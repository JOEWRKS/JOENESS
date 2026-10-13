#!/usr/bin/env node
// Explicit, read-only diagnosis of a reviewed extraction. Not a stage engine.
import {readFileSync,realpathSync,statSync} from 'node:fs';
import {resolve,relative,isAbsolute,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';

const hash=b=>createHash('sha256').update(b).digest('hex');
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const text=x=>typeof x==='string'&&x.trim().length>0;
const digest=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
export const canonical=v=>Array.isArray(v)?'['+v.map(canonical).join(',')+']':object(v)?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);
export function mappingHash(input){const {mapping_review,...mapping}=input;return hash(canonical(mapping));}
const same=(a,b)=>canonical(a)===canonical(b);
const targetKey=t=>canonical([...t].sort((a,b)=>a.path.localeCompare(b.path,'en')));
const pointer=(value,path)=>{
  if(typeof path!=='string'||(path!==''&&!path.startsWith('/'))||/~(?![01])/u.test(path))throw Error('Invalid JSON pointer');
  for(const token of path===''?[]:path.slice(1).split('/').map(t=>t.replaceAll('~1','/').replaceAll('~0','~'))){
    if(value===null||typeof value!=='object'||!Object.hasOwn(value,token))throw Error('JSON pointer not found');
    value=value[token];
  }
  return value;
};

export function diagnose({root,inputPath,inputSha256}){
  const findings=[];
  const add=(kind,code,at,message)=>{findings.push({kind,code,at,message});return false;};
  const result={schema:'joeness.roadmap-diagnosis.v1',scope_id:null,delivery:'undetermined',project_complete:false,
    interpretation:'Reviewed extraction only; source hashes do not authenticate approval or prove semantic correctness.',
    coverage:'Declared current views/outcomes only; no whole-project certification.',findings,outcomes:[],excluded:[],limitations:[],current:[],historical_views_ignored:0};
  let base;
  try{base=realpathSync(root);if(!statSync(base).isDirectory())throw Error('root not directory');}
  catch{add('invalid','ROOT','root','Readable explicit project root required');return result;}
  // Recheck every read source at the end: no mixed snapshot is called current.
  const snapshots=new Map();
  function file(ref,at){
    if(!object(ref)||!text(ref.path)||!digest(ref.sha256))return add('invalid','REFERENCE',at,'Path and lowercase SHA-256 required');
    const p=ref.path;
    if(p!==p.normalize('NFC')||p.includes('\\')||p.includes(':')||p.includes('\0')||isAbsolute(p)||p.split('/').some(x=>!x||x==='.'||x==='..'))return add('invalid','PATH',at,'Use a root-contained NFC relative path');
    let abs;
    try{abs=realpathSync(resolve(base,p));}
    catch{return add('unknown','UNREADABLE',at,'Source unavailable; this does not establish that work never occurred');}
    const rel=relative(base,abs);
    if(rel==='..'||rel.startsWith('..'+sep)||isAbsolute(rel))return add('invalid','PATH_ESCAPE',at,'Resolved source escapes root');
    try{
      if(!statSync(abs).isFile()||statSync(abs).size>4*1024*1024)return add('invalid','FILE_BOUND',at,'Expected file of at most 4 MiB');
      const bytes=readFileSync(abs),actual=hash(bytes);
      if(actual!==ref.sha256)return add('unknown','STALE',at,'Current bytes differ from referenced evidence');
      snapshots.set(p,{abs,sha256:actual});return bytes;
    }catch{return add('unknown','UNREADABLE',at,'Cannot read source');}
  }
  function source(ref,at){
    const b=file(ref,at);if(!b)return false;
    if(Object.hasOwn(ref,'quote')===Object.hasOwn(ref,'pointer'))return add('invalid','SELECTOR',at,'Choose exact nonempty quote or JSON pointer/value');
    let s;try{s=new TextDecoder('utf-8',{fatal:true}).decode(b);}catch{return add('invalid','ENCODING',at,'Source text must be UTF-8');}
    if(Object.hasOwn(ref,'quote')){
      if(!text(ref.quote)||!s.includes(ref.quote))return add('invalid','QUOTE',at,'Exact quote is absent');
    }else{
      try{if(!Object.hasOwn(ref,'value')||!isDeepStrictEqual(pointer(JSON.parse(s),ref.pointer),ref.value))throw Error('mismatch');}
      catch{return add('invalid','POINTER',at,'JSON pointer/value does not match source');}
    }
    return true;
  }
  function list(v,at,nonempty=false){if(!Array.isArray(v)||v.length>256||(nonempty&&!v.length))return add('invalid','LIST',at,'Expected bounded array'+(nonempty?' with entries':''));return true;}
  function targets(v,at){
    if(!list(v,at,true))return false;let ok=true;const seen=new Set();
    for(const [i,t] of v.entries()){
      if(!object(t)||seen.has(t.path)){add('invalid','TARGETS',at,'Malformed or duplicate target');ok=false;continue;}
      seen.add(t.path);if(!file(t,at+'/'+i))ok=false;
    }return ok;
  }
  let input;
  try{
    const bytes=file({path:inputPath,sha256:inputSha256},'input');if(!bytes)return result;
    input=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  }catch{add('invalid','INPUT','input','Input must be valid UTF-8 JSON');return result;}
  if(!object(input)||input.schema!=='joeness.roadmap-review.v1'||!text(input.scope_id)){add('invalid','SCHEMA','input','Expected schema and scope_id');return result;}
  result.scope_id=input.scope_id;
  source(input.scope_source,'scope_source');source(input.scope_authorization,'scope_authorization');
  if(input.mapping_review===null||input.mapping_review===undefined)add('unknown','MAPPING_REVIEW','mapping_review','Source interpretation and coverage need explicit review');
  else if(source(input.mapping_review,'mapping_review')){
    const v=input.mapping_review.value;
    if(!object(v)||v.status!=='CONFIRMED'||v.scope_id!==input.scope_id||!digest(v.mapping_sha256))add('unknown','MAPPING_REVIEW','mapping_review','Expected source-backed review of this exact scope/mapping, not a name or boolean');
    else if(v.mapping_sha256!==mappingHash(input))add('unknown','MAPPING_STALE','mapping_review','Extraction changed since semantic/coverage review');
  }
  const arrays=['views','required_outcomes','excluded_outcomes','observations','limitations'];
  if(!arrays.every(k=>list(input[k],k,k==='required_outcomes')))return result;
  if(object(input.scope_source?.value)){
    const v=input.scope_source.value;
    if(Object.hasOwn(v,'scope_id')&&v.scope_id!==input.scope_id)add('invalid','SCOPE_ID','scope_source','Normalized scope differs from source');
    if(Array.isArray(v.required)&&!same(v.required.map(o=>o.id).sort(),input.required_outcomes.map(o=>o?.id).sort()))add('invalid','SCOPE_COVERAGE','required_outcomes','Required set differs from source scope');
    if(Array.isArray(v.excluded)&&!same(v.excluded.map(o=>o.id).sort(),input.excluded_outcomes.map(o=>o?.id).sort()))add('invalid','SCOPE_COVERAGE','excluded_outcomes','Excluded set differs from source scope');
  }
  if(object(input.scope_authorization?.value)){
    const a=input.scope_authorization.value;
    if(Object.hasOwn(a,'scope_id')&&a.scope_id!==input.scope_id)add('conflict','AUTHORIZATION_SCOPE','scope_authorization','Decision belongs to a different scope');
    if(object(a.scope)&&object(input.scope_source?.value)&&!same(a.scope,input.scope_source.value))add('conflict','AUTHORIZATION_SCOPE','scope_authorization','Authorized scope and selected scope source differ');
  }
  const viewIds=new Set(),claims=new Map();
  for(const [i,v] of input.views.entries()){
    const at='views/'+i;
    if(!object(v)||!text(v.id)||viewIds.has(v.id)||!['current','history'].includes(v.kind)){add('invalid','VIEW',at,'Unique view id and explicit current/history classification required');continue;}
    viewIds.add(v.id);
    // Historical text is not a current assertion; do not force a full history read.
    if(v.kind==='history'){result.historical_views_ignored++;continue;}
    const valid=source(v.source,at+'/source');
    if(!list(v.claims,at+'/claims',true))continue;
    for(const [j,c] of v.claims.entries()){
      const ca=at+'/claims/'+j;
      if(!object(c)||!text(c.key)||!text(c.value)){add('invalid','CLAIM',ca,'Nonempty claim key/value required');continue;}
      const good=source(c.source,ca+'/source');
      if(valid&&good){
        if(Object.hasOwn(v.source,'quote')!==Object.hasOwn(c.source,'quote')){add('invalid','CLAIM_LOCATION',ca,'View and claim must use the same selector type');continue;}
        if(c.source.path!==v.source.path||c.source.sha256!==v.source.sha256||(v.source.quote&&c.source.quote&&!v.source.quote.includes(c.source.quote))){add('invalid','CLAIM_LOCATION',ca,'Claim must be within its current view source');continue;}
        if(Object.hasOwn(v.source,'pointer')&&(!Object.hasOwn(c.source,'pointer')||(v.source.pointer!==''&&c.source.pointer!==v.source.pointer&&!c.source.pointer.startsWith(v.source.pointer+'/')))){add('invalid','CLAIM_LOCATION',ca,'Claim pointer is outside its view');continue;}
        if(Object.hasOwn(c.source,'pointer')&&!same(c.source.value,c.value)){add('invalid','CLAIM_VALUE',ca,'Claim differs from source value');continue;}
        if(claims.has(c.key)&&claims.get(c.key)!==c.value)add('conflict','CURRENT_CONFLICT',ca,'Current views disagree on '+c.key);
        claims.set(c.key,c.value);result.current.push({view_id:v.id,key:c.key,value:c.value,source:c.source});
      }
    }
  }
  if(!result.current.length)add('unknown','CURRENT_MISSING','views','No verified current view; inspect roadmap before choosing next work');
  const ids=new Set(),outcomes=new Map();
  for(const [i,o] of input.required_outcomes.entries()){
    const at='required_outcomes/'+i;
    if(!object(o)||!text(o.id)||!text(o.label)||ids.has(o.id)){add('invalid','OUTCOME',at,'Unique outcome id and label required');continue;}
    ids.add(o.id);
    const sourceOk=source(o.source,at+'/source');
    if(sourceOk&&object(o.source.value)&&!['id','required_lanes','acceptance_required','targets'].every(k=>same(o.source.value[k],o[k])))add('invalid','OUTCOME_VALUE',at,'Required outcome differs from source object');
    const targetOk=targets(o.targets,at+'/targets');
    if(!list(o.required_lanes,at+'/required_lanes',true)||new Set(o.required_lanes).size!==o.required_lanes.length||o.required_lanes.some(l=>!['implementation','technical','visual'].includes(l))){add('invalid','LANES',at,'Unique implementation/technical/visual required lanes');continue;}
    if(![true,false,null].includes(o.acceptance_required)){add('invalid','ACCEPTANCE_REQUIREMENT',at,'Use explicit true/false/null acceptance requirement');continue;}
    if(o.acceptance_required===null)add('unknown','ACCEPTANCE_REQUIREMENT',at,'Acceptance requirement undecided');
    const entry={id:o.id,label:o.label,lanes:{},acceptance_required:o.acceptance_required};
    result.outcomes.push(entry);outcomes.set(o.id,{o,entry,usable:sourceOk&&targetOk});
  }
  const excludedIds=new Set();
  for(const [i,e] of input.excluded_outcomes.entries()){
    const at='excluded_outcomes/'+i;
    if(!object(e)||!text(e.id)||!text(e.label)||excludedIds.has(e.id)){add('invalid','EXCLUDED',at,'Unique excluded id/label required');continue;}
    excludedIds.add(e.id);
    if(ids.has(e.id))add('conflict','SCOPE_CONFLICT',at,'Outcome is both required and excluded');
    const a=source(e.source,at+'/source'),b=source(e.authorization,at+'/authorization');
    if(a&&object(e.source.value)&&e.source.value.id!==e.id)add('invalid','EXCLUDED_VALUE',at,'Excluded outcome differs from source object');
    result.excluded.push({id:e.id,label:e.label,verified:a&&b,source:e.source});
  }
  const observations=new Map();
  for(const [i,o] of input.observations.entries()){
    const at='observations/'+i;
    if(!object(o)||!outcomes.has(o.outcome_id)||!['implementation','technical','visual','acceptance'].includes(o.lane)){add('invalid','OBSERVATION',at,'Observation needs known required outcome and lane');continue;}
    const permitted=o.lane==='acceptance'?['ACCEPTED','REJECTED','NOT_GRANTED','PARTIAL','UNVERIFIED']:['PASS','FAIL','UNVERIFIED','PARTIAL'];
    if(!permitted.includes(o.status)){add('invalid','STATUS',at,'Status is incompatible with lane');continue;}
    const sourceOk=source(o.source,at+'/source');
    let sourceFieldsOk=true;
    if(sourceOk&&Object.hasOwn(o.source,'pointer')){
      const raw=o.source.value;
      if(!object(raw)||!['outcome_id','lane','status','targets'].every(k=>same(raw[k],o[k]))){add('invalid','OBSERVATION_VALUE',at,'Source observation object and normalized fields differ');sourceFieldsOk=false;}
    }
    const targetOk=targets(o.targets,at+'/targets'),expected=outcomes.get(o.outcome_id);
    const identityOk=Array.isArray(o.targets)&&Array.isArray(expected.o.targets)&&targetKey(o.targets)===targetKey(expected.o.targets);
    if(!identityOk)add('unknown','TARGET_MISMATCH',at,'Observation does not cover the exact required target set');
    const key=o.outcome_id+'/'+o.lane,prior=observations.get(key);
    if(prior){add(prior.status!==o.status?'conflict':'invalid',prior.status!==o.status?'OBSERVATION_CONFLICT':'DUPLICATE_OBSERVATION',at,'More than one current observation for outcome/lane');prior.usable=false;}
    else observations.set(key,{status:o.status,usable:sourceOk&&sourceFieldsOk&&targetOk&&identityOk&&expected.usable});
  }
  let incomplete=false;
  for(const {o,entry} of outcomes.values()){
    const lanes=new Set([...o.required_lanes,'acceptance',...input.observations.filter(x=>x?.outcome_id===o.id).map(x=>x.lane)]);
    for(const lane of lanes){
      const obs=observations.get(o.id+'/'+lane),required=o.required_lanes.includes(lane)||(lane==='acceptance'&&o.acceptance_required===true);
      entry.lanes[lane]=obs?.usable?obs.status:lane==='acceptance'?'NOT_GRANTED':'UNVERIFIED';
      if(lane==='acceptance'&&obs?.usable&&obs.status==='REJECTED'&&o.acceptance_required===false)add('conflict','EXACT_REJECTION',o.id+'/acceptance','Current exact rejection needs owner resolution even when acceptance was not required');
      if(required){
        if(!obs)add('unknown','RESULT_MISSING',o.id+'/'+lane,'Required result not supplied; inspect linked evidence before rerunning');
        else if(!obs.usable)entry.lanes[lane]='UNVERIFIED';
        else if(obs.status==='UNVERIFIED')add('unknown','RESULT_UNVERIFIED',o.id+'/'+lane,'Owner explicitly left this required check unverified');
        else if(obs.status!==(lane==='acceptance'?'ACCEPTED':'PASS'))incomplete=true;
      }
    }
  }
  for(const c of result.current){
    if(c.key.startsWith('outcome:')){
      const parts=c.key.split(':');
      if(parts.length!==3||!outcomes.has(parts[1])||!['implementation','technical','visual','acceptance'].includes(parts[2])){add('invalid','CLAIM_KEY',c.view_id,'Expected outcome:<known id>:<lane>');continue;}
      const obs=observations.get(parts[1]+'/'+parts[2]);
      if(obs?.usable&&c.value!==obs.status)add('conflict','ROADMAP_RESULT_CONFLICT',c.view_id,'Current roadmap differs from linked execution result: '+c.key);
    }
  }
  for(const [i,l] of input.limitations.entries()){
    if(!object(l)||!text(l.text)){add('invalid','LIMITATION','limitations/'+i,'Text and source required');continue;}
    result.limitations.push({text:l.text,verified:source(l.source,'limitations/'+i),source:l.source});
  }
  for(const [p,s] of snapshots){
    try{if(realpathSync(resolve(base,p))!==s.abs||hash(readFileSync(s.abs))!==s.sha256)add('unknown','CHANGED_DURING_READ',p,'Source changed during diagnosis; inspect current state before retry');}
    catch{add('unknown','CHANGED_DURING_READ',p,'Source unavailable at end of diagnosis');}
  }
  if(!findings.length)result.delivery=incomplete?'incomplete':'complete';
  result.required_remaining=result.outcomes.flatMap(o=>Object.entries(o.lanes).filter(([lane,status])=>
    (outcomes.get(o.id).o.required_lanes.includes(lane)||(lane==='acceptance'&&o.acceptance_required===true))&&status!==(lane==='acceptance'?'ACCEPTED':'PASS')).map(([lane,status])=>({id:o.id,label:o.label,lane,status})));
  return result;
}

export function renderText(r){
  const labels={complete:'완료(검토된 범위 한정)',incomplete:'미완',undetermined:'판정 대기'};
  const lanes={implementation:'구현',technical:'동작 확인',visual:'화면 검토',acceptance:'사용자 수락'};
  return ['범위: '+(r.scope_id??'확인 필요'),'이번 납품: '+labels[r.delivery],
    '필수 잔여: '+(r.required_remaining?.map(x=>x.label+' / '+lanes[x.lane]+' ['+x.status+']').join(', ')|| (r.delivery==='complete'?'없음':'판정 근거 확인 필요')),
    '범위 밖: '+(r.excluded.map(x=>x.label+(x.verified?'':'(근거 확인 필요)')).join(', ')||'없음'),
    '참고 한계: '+(r.limitations.map(x=>x.text+(x.verified?'':'(근거 확인 필요)')).join('; ')||'전체 프로젝트 완료·제품 승인을 대신하지 않음'),
    ...r.findings.map(x=>'- '+x.kind+' / '+x.at+': '+x.message)].join('\n')+'\n';
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  let format='json',r;
  try{
    const opts=Object.create(null),allowed=new Set(['--root','--input','--input-sha256','--format']);
    for(let i=2;i<process.argv.length;i+=2){const k=process.argv[i],v=process.argv[i+1];if(!allowed.has(k)||Object.hasOwn(opts,k)||!v||v.startsWith('--'))throw Error('Unknown/duplicate option or missing value');opts[k]=v;}
    if(!opts['--root']||!opts['--input']||!opts['--input-sha256']||!['json','text'].includes(opts['--format']??'json'))throw Error('Use --root --input --input-sha256 [--format json|text]');
    format=opts['--format']??'json';r=diagnose({root:opts['--root'],inputPath:opts['--input'],inputSha256:opts['--input-sha256']});
  }catch(e){r={schema:'joeness.roadmap-diagnosis.v1',scope_id:null,delivery:'undetermined',project_complete:false,findings:[{kind:'invalid',code:'CLI',at:'input',message:e.message}],outcomes:[],excluded:[],limitations:[]};}
  process.stdout.write(format==='text'?renderText(r):JSON.stringify(r)+'\n');
  process.exitCode=r.delivery==='complete'&&!r.findings.length?0:2;
}
