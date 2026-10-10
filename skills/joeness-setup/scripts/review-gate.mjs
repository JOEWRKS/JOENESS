// Explicit, read-only evidence consumer. Not a daemon, visual judge, or Markdown lock.
import {readFileSync,realpathSync} from 'node:fs';
import {resolve,relative,isAbsolute,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';

const hash=b=>createHash('sha256').update(b).digest('hex');
const digest=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const text=x=>typeof x==='string'&&x.trim().length>0;
const assert=(ok,message)=>{if(!ok)throw new Error(message);};
const lanes=['implementation','technical','visual'];
const inside=(root,p)=>{const r=relative(root,p);return r===''||(!r.startsWith('..'+sep)&&r!=='..'&&!isAbsolute(r));};
const safeRelative=p=>text(p)&&p===p.normalize('NFC')&&!/[\\:\x00-\x1f]/.test(p)&&!p.startsWith('/')&&p.split('/').every(s=>s&&s!=='.'&&s!=='..');
const sort=xs=>[...xs].sort((a,b)=>Buffer.compare(Buffer.from(a),Buffer.from(b)));
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
const equal=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
// Opaque specialist context (targets, rules, authority, extensions) affects reuse.
// Do not guess domain-specific dependency mappings from an unchanged check ID.
const reuseContext=b=>Object.fromEntries(Object.entries(b).filter(([k])=>!['required_checks','authorization_ref','required_lanes','required_acceptance'].includes(k)));

export function evaluate(options) {
  const root=realpathSync(options.root);
  const evidenceRoots=[root,...(options.evidenceRoots||[]).map(p=>realpathSync(p))];
  function pathFor(p,evidence=false) {
    assert((evidence&&isAbsolute(p))||safeRelative(p),'Unsafe path');
    const actual=realpathSync(isAbsolute(p)?p:resolve(root,p));
    assert((evidence?evidenceRoots:[root]).some(r=>inside(r,actual)),'Path outside allowed roots');
    return actual;
  }
  const bytes=(p,evidence=false)=>readFileSync(pathFor(p,evidence));
  const json=(p,evidence=false)=>JSON.parse(bytes(p,evidence).toString('utf8'));
  function pin(p,expected) {assert(digest(expected),'Missing external SHA-256 pin');const raw=bytes(p);assert(hash(raw)===expected,'Pinned baseline/acceptance changed');return JSON.parse(raw.toString('utf8'));}
  function baseline(b) {
    assert(b.schema==='joeness.review-baseline.v1'&&text(b.scope_id)&&text(b.authorization_ref),'Invalid baseline identity/authorization reference');
    assert(Array.isArray(b.authority)&&b.authority.length>0,'Missing authority');
    for(const a of b.authority)assert(safeRelative(a.path)&&digest(a.sha256),'Invalid authority binding');
    assert(Array.isArray(b.required_checks)&&b.required_checks.length>0,'Empty required scope');
    const ids=new Set();
    for(const c of b.required_checks) {
      assert(text(c.check_id)&&!ids.has(c.check_id),'Invalid/duplicate required check');ids.add(c.check_id);
      assert(text(c.target_id)&&text(c.method)&&digest(c.criterion_sha256)&&lanes.includes(c.lane),'Invalid required check identity');
      assert(Array.isArray(c.inputs)&&c.inputs.length>0&&new Set(c.inputs).size===c.inputs.length&&c.inputs.every(safeRelative),'Invalid/empty input dependency scope');
    }
    assert(b.required_acceptance===undefined||typeof b.required_acceptance==='boolean','Invalid acceptance requirement');
    if(b.required_lanes!==undefined)assert(Array.isArray(b.required_lanes)&&b.required_lanes.length>0&&new Set(b.required_lanes).size===b.required_lanes.length&&b.required_lanes.every(l=>lanes.includes(l)),'Invalid required lanes');
  }
  const b=pin(options.baseline,options.baselineSha256);baseline(b);
  let previous=null;
  if(options.previousBaseline){previous=pin(options.previousBaseline,options.previousBaselineSha256);baseline(previous);assert(previous.scope_id===b.scope_id,'Previous scope mismatch');}
  const errors=[];
  for(const a of b.authority){try{assert(hash(bytes(a.path))===a.sha256,'Authority changed');}catch{errors.push('Authority missing/changed: '+a.path);}}
  const received=new Map();
  for(const path of options.results||[]) {
    try {
      const r=json(path,true);
      assert(['joedesign.conformance.v1','joeness.check-results.v1'].includes(r.schema),'Unsupported result schema');
      assert(r.scope_id===b.scope_id&&digest(r.baseline_sha256),'Result scope/baseline mismatch');
      const current=r.baseline_sha256===options.baselineSha256;
      assert(current||(previous&&r.baseline_sha256===options.previousBaselineSha256),'Unrecognized result baseline');
      assert(r.acceptance==='NOT_GRANTED','Specialist result cannot grant user acceptance');
      assert(Array.isArray(r.results)&&Array.isArray(r.unresolved),'Malformed results/unresolved');
      for(const u of r.unresolved)assert(text(u.check_id)&&text(u.reason)&&b.required_checks.some(c=>c.check_id===u.check_id),'Malformed/unmapped unresolved item');
      for(const entry of r.results) {
        const c=b.required_checks.find(c=>c.check_id===entry.check_id);
        assert(c&&!received.has(entry.check_id),'Unknown/duplicate result');
        assert(c.lane!=='visual'||r.schema==='joedesign.conformance.v1','Non-specialist result cannot attest visual compliance');
        assert(c.lane==='visual'||r.schema==='joeness.check-results.v1','Design result cannot attest technical/implementation completion');
        received.set(entry.check_id,{entry,current,unresolved:r.unresolved.some(u=>u.check_id===entry.check_id)});
      }
      // An unresolved item remains blocking even if its result was omitted.
      for(const u of r.unresolved)if(!r.results.some(e=>e.check_id===u.check_id)) errors.push('Unresolved without result: '+u.check_id);
    } catch(e){errors.push('Result unavailable/invalid: '+path+' ('+e.message+')');}
  }
  const checks=b.required_checks.map(c=>{
    let fingerprint=null;
    const output=(status,reason)=>({check_id:c.check_id,lane:c.lane,status,reason,input_fingerprint:fingerprint});
    try{fingerprint=hash(JSON.stringify(sort(c.inputs).map(p=>[p,hash(bytes(p))])));}catch{return output('UNVERIFIED','Current target input unavailable');}
    const item=received.get(c.check_id);
    if(!item)return output('UNVERIFIED','Required result missing');
    const {entry:e,current,unresolved}=item;
    if(!current&&(!equal(reuseContext(b),reuseContext(previous))||!equal(c,previous.required_checks.find(p=>p.check_id===c.check_id))))return output('STALE','Required criterion/target/dependencies or shared baseline context changed');
    if(e.target_id!==c.target_id||e.method!==c.method||e.criterion_sha256!==c.criterion_sha256)return output('STALE','Result does not match pinned criterion/target/method');
    if(e.input_fingerprint!==fingerprint)return output('STALE','Target inputs changed');
    if(!['PASS','FAIL','UNVERIFIED'].includes(e.status))return output('UNVERIFIED','Malformed specialist status');
    if(e.status==='FAIL'||unresolved)return output('FAIL','Specialist failure/unresolved item');
    if(e.status!=='PASS')return output('UNVERIFIED','Specialist verification missing');
    try {
      assert(Array.isArray(e.evidence)&&e.evidence.length>0,'Missing proof');
      for(const proof of e.evidence)assert(digest(proof.sha256)&&hash(bytes(proof.path,true))===proof.sha256,'Missing/damaged proof');
    } catch{return output('UNVERIFIED','Evidence missing, damaged or outside allowed roots');}
    return output('PASS','Current bound specialist result; evidence integrity only');
  });
  const states=Object.fromEntries(lanes.map(l=>{
    const list=checks.filter(c=>c.lane===l);
    return [l,errors.length?'UNVERIFIED':!list.length?'UNVERIFIED':list.some(c=>c.status==='FAIL')?'FAIL':list.some(c=>c.status==='STALE')?'STALE':list.every(c=>c.status==='PASS')?'PASS':'UNVERIFIED'];
  }));
  states.user_acceptance='NOT_GRANTED';
  if(options.acceptance) {
    try {
      const a=pin(options.acceptance,options.acceptanceSha256);
      assert(a.schema==='joeness.user-acceptance.v1'&&a.scope_id===b.scope_id&&a.baseline_sha256===options.baselineSha256&&a.status==='ACCEPTED','Acceptance identity mismatch');
      assert(a.source&&digest(a.source.sha256)&&hash(bytes(a.source.path,true))===a.source.sha256,'Acceptance source missing/changed');
      assert(equal(a.input_fingerprints,Object.fromEntries(checks.map(c=>[c.check_id,c.input_fingerprint])))&&checks.every(c=>c.input_fingerprint!==null),'Acceptance output changed');
      states.user_acceptance='ACCEPTED';
    } catch(e){states.user_acceptance='UNVERIFIED';errors.push('Acceptance invalid: '+e.message);}
  }
  const required=[...new Set([...(b.required_lanes||[]),...b.required_checks.map(c=>c.lane)])];
  const scopeComplete=!errors.length&&required.every(l=>states[l]==='PASS')&&(b.required_acceptance===false||states.user_acceptance==='ACCEPTED');
  assert([...lanes,'complete'].includes(options.claim),'Unknown claim');
  const allowed=!errors.length&&(options.claim==='complete'?scopeComplete:states[options.claim]==='PASS');
  return {schema:'joeness.review-gate.v1',scope_id:b.scope_id,claim:options.claim,allowed,required_scope_complete:scopeComplete,project_complete:false,lanes:states,checks,errors,limits:['No visual re-judgment or user-identity authentication','Pinned scope completeness and dependency discovery require authorized review','Explicit CLI only; direct Markdown edits and natural-language claims are not intercepted']};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  try {
    const o={results:[],evidenceRoots:[]};
    const names={'--root':'root','--baseline':'baseline','--baseline-sha256':'baselineSha256','--previous-baseline':'previousBaseline','--previous-baseline-sha256':'previousBaselineSha256','--claim':'claim','--acceptance':'acceptance','--acceptance-sha256':'acceptanceSha256'};
    for(let i=2;i<process.argv.length;i+=2){const k=process.argv[i],v=process.argv[i+1];assert(text(v)&&!v.startsWith('--'),'Missing CLI argument');if(k==='--result')o.results.push(v);else if(k==='--evidence-root')o.evidenceRoots.push(v);else{assert(Object.hasOwn(names,k),'Unknown CLI argument');assert(!Object.hasOwn(o,names[k]),'Duplicate CLI argument: '+k);o[names[k]]=v;}}
    const result=evaluate(o);console.log(JSON.stringify(result));process.exitCode=result.allowed?0:2;
  }catch(e){console.log(JSON.stringify({schema:'joeness.review-gate.v1',allowed:false,required_scope_complete:false,project_complete:false,errors:[e.message]}));process.exitCode=2;}
}
