#!/usr/bin/env node
// Reads a pinned capture of an explicitly invoked producer. Never executes it.
import {readFileSync,realpathSync,statSync} from 'node:fs';
import {resolve,relative,dirname,isAbsolute,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual as equal} from 'node:util';
const sha=b=>createHash('sha256').update(b).digest('hex');
const obj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const str=v=>typeof v==='string'&&v.trim().length>0;
const digest=v=>typeof v==='string'&&/^[0-9a-f]{64}$/.test(v);
const schemas=['joewrks.state-candidate-preflight/1.0','joewrks.projection-audit/1.0'];
class Finding extends Error{constructor(kind,code,at,message){super(message);Object.assign(this,{kind,code,at});}}
const fail=(code,at,message)=>{throw new Finding('invalid',code,at,message);};
const unknown=(code,at,message)=>{throw new Finding('unknown',code,at,message);};
const need=(condition,code,at,message)=>{if(!condition)fail(code,at,message);};
function array(v,at){need(Array.isArray(v)&&v.length<=512,'ARRAY',at,'Expected bounded array');return v;}
function unique(v,at){array(v,at);need(v.every(str)&&new Set(v).size===v.length,'IDS',at,'Expected unique nonempty IDs');return v;}
function select(v,p){
  need(typeof p==='string'&&(p===''||p.startsWith('/'))&&!/~(?![01])/.test(p),'POINTER','scope','Invalid JSON pointer');
  for(const k of p===''?[]:p.slice(1).split('/').map(k=>k.replaceAll('~1','/').replaceAll('~0','~'))){need(obj(v)||Array.isArray(v),'POINTER',p,'Missing pointer');need(Object.hasOwn(v,k),'POINTER',p,'Missing pointer');v=v[k];}return v;
}

export function consume(options){
  const result={schema:'joeness.operation-consumption.v1',allowed:false,verdict:'unknown',project_complete:false,approval_granted:false,findings:[],reported:null,
    limits:['Pinned capture integrity is not producer execution authentication or semantic correctness.','Preflight/audit is not product approval or project completion.']};
  const snapshots=[];
  try{
    const root=realpathSync(options.root),evidence=realpathSync(options.evidenceRoot??options.root),producerRoot=realpathSync(options.producerRoot??options.root);
    function contained(base,path){
      need(str(path)&&!path.includes('\0'),'PATH','reference','Nonempty path required');
      let abs;try{abs=realpathSync(resolve(base,path));}catch{unknown('UNREADABLE',path,'Source is unavailable, not proven unperformed');}
      const r=relative(base,abs);need(r!=='..'&&!r.startsWith('..'+sep)&&!isAbsolute(r),'PATH_ESCAPE',path,'Resolved path escapes explicit root');return abs;
    }
    function load(base,ref){
      need(obj(ref)&&digest(ref.sha256),'REFERENCE','reference','Path/SHA-256 required');
      const abs=contained(base,ref.path);need(statSync(abs).isFile()&&statSync(abs).size<=4*1024*1024,'FILE_BOUND',ref.path,'Expected file <=4 MiB');
      const bytes=readFileSync(abs);if(sha(bytes)!==ref.sha256)unknown('STALE',ref.path,'Current bytes differ from pinned input');
      snapshots.push({base,path:ref.path,abs,sha256:ref.sha256});return {abs,bytes};
    }
    function json(file){try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(file.bytes));}catch{fail('JSON',file.abs,'Expected one complete UTF-8 JSON value');}}
    const requestFile=load(evidence,{path:options.request,sha256:options.requestSha256}),request=json(requestFile);
    need(obj(request)&&request.schema==='joeness.operation-request.v1'&&str(request.run_id)&&schemas.includes(request.producer_schema),'REQUEST','request','Unknown request contract');
    const capture=json(load(evidence,{path:options.capture,sha256:options.captureSha256}));
    need(obj(capture)&&capture.schema==='joeness.operation-capture.v1'&&capture.run_id===request.run_id&&capture.request_sha256===options.requestSha256,'CAPTURE_ID','capture','Capture is not for this exact run/request');
    const stdout=load(evidence,capture.stdout);load(evidence,capture.stderr);
    if(![0,1].includes(capture.exit_code)||capture.signal!==null)unknown('EXECUTION_FAILED','capture','Producer execution did not complete successfully; never substitute older stdout');
    const report=json(stdout);result.reported=report;
    need(obj(report)&&report.schema_version===request.producer_schema,'SCHEMA','stdout','Unexpected producer output schema');
    array(request.producer_files,'producer_files');need(request.producer_files.length>0,'PRODUCER','request','Pin the producer source files used for this run');
    for(const f of request.producer_files)load(producerRoot,f);
    const primaryFile=load(root,request.primary),primary=json(primaryFile);
    function sameFile(actual,expected,at){
      need(obj(actual)&&obj(expected)&&actual.sha256===expected.sha256,'IDENTITY',at,'Reported identity differs from expected input');
      const a=load(root,actual),b=load(root,expected);need(a.abs===b.abs,'IDENTITY',at,'Reported source path differs from requested input');
    }
    need(report.source_unchanged===true,'SOURCE_CHANGED','stdout','Producer did not confirm source preservation');
    if(request.producer_schema===schemas[0]){
      sameFile(report.source,request.primary,'source');
      if(request.canonical!==null){sameFile(report.canonical,request.canonical,'canonical');need(report.canonical_unchanged===true,'SOURCE_CHANGED','canonical','Canonical source changed');}
      else need(report.canonical===null&&report.canonical_unchanged===null,'IDENTITY','canonical','Unexpected canonical source');
      need(obj(report.identity)&&obj(report.stages)&&obj(report.summary),'STRUCTURE','stdout','Missing preflight axes');
      const expectedIdentity={schema_version:primary.schema_version??null,definition_revision:primary.project?.definition_revision??null,definition_status:primary.project?.definition_status??null,approval_status:primary.approval?.status??null};
      for(const [key,v] of Object.entries(expectedIdentity))need(equal(report.identity[key],v),'IDENTITY','identity/'+key,'Producer identity contradicts candidate');
      need(['PASS','FAIL'].includes(report.stages.state_validation)&&['PASS','FAIL'].includes(report.stages.semantic_readiness)&&['PASS','NOT_READY'].includes(report.stages.manifest_review_readiness),'STAGES','stages','Malformed stage status');
      need(report.stages.user_approval===(primary.approval?.status==='APPROVED'?'APPROVED':'UNAPPROVED'),'APPROVAL','stages','Reported approval differs from candidate, not a new approval');
      array(report.findings,'findings');need(report.summary.finding_count===report.findings.length,'COUNTS','summary','Finding count differs from actual findings');
      for(const k of ['validation_error_count','blocking_metric_count','finding_count'])need(Number.isSafeInteger(report.summary[k])&&report.summary[k]>=0,'COUNTS','summary/'+k,'Expected nonnegative count');
      need(str(report.next_action),'NEXT','next_action','Missing next action');
      need(['PASS','FAIL'].includes(report.overall_status),'STATUS','overall_status','Unknown preflight status');
      if(report.overall_status==='PASS')need(['state_validation','semantic_readiness','manifest_review_readiness'].every(k=>report.stages[k]==='PASS')&&report.findings.length===0&&Object.values(report.summary).every(x=>x===0),'FALSE_PASS','stdout','PASS contradicts preflight axes');
    }else{
      sameFile(report.input,request.primary,'input');
      need(primary.schema_version==='joewrks.projection-audit-input/1.0','SCHEMA','primary','Wrong audit input');
      const auditDir=dirname(primaryFile.abs);
      // Producer paths are relative to the audit input; all must still stay inside root.
      const fromAudit=ref=>{need(obj(ref)&&str(ref.path),'REFERENCE','audit','Missing audit ref');return {...ref,path:resolve(auditDir,ref.path)};};
      sameFile(report.canonical_source,fromAudit(primary.canonical_state),'canonical_source');
      const scopeFile=load(root,fromAudit(primary.scope_authority)),scope=select(json(scopeFile),primary.scope_authority.pointer??'');
      need(obj(scope)&&report.scope_authority_sha256===sha(scopeFile.bytes),'SCOPE','scope','Scope identity mismatch');
      const required=unique(scope.required_projection_ids,'required'),semanticRequired=unique(scope.semantic_review_required_ids,'semantic_required'),renderRequired=unique(scope.render_review_required_ids,'render_required');
      need(required.length>0&&[...semanticRequired,...renderRequired].every(id=>required.includes(id)),'SCOPE','scope','Empty or conflicting required scope');
      need(obj(scope.projection_contracts)&&required.every(id=>Object.hasOwn(scope.projection_contracts,id)),'SCOPE','contracts','Approved contracts for required projections are missing');
      const declarations=new Map();
      for(const d of array(primary.projections,'declarations')){need(obj(d)&&str(d.projection_id)&&!declarations.has(d.projection_id),'DUPLICATE','declarations','Unique declared projections required');declarations.set(d.projection_id,d);}
      const seen=new Set(),completed=[],pending=[],failed=[];
      for(const p of array(report.projections,'projections')){
        need(obj(p)&&str(p.projection_id)&&!seen.has(p.projection_id),'DUPLICATE','projections','Unique reported projections required');seen.add(p.projection_id);
        const id=p.projection_id,d=declarations.get(id),mandatory=required.includes(id);
        const contract=Object.hasOwn(scope.projection_contracts,id)?scope.projection_contracts[id]:null;
        need(d||mandatory,'PROJECTION','projections','Unknown projection');
        need(p.required===mandatory&&str(p.recovery_owner)&&str(p.next_action),'PROJECTION',id,'Required flag/recovery owner/next action mismatch');
        if(contract){
          need(obj(contract)&&str(contract.kind)&&str(contract.recovery_owner),'SCOPE',id,'Malformed approved contract');
          array(contract.required_markers,id+'/required_markers');array(contract.semantic_coverage,id+'/semantic_coverage');
          need(p.recovery_owner===contract.recovery_owner,'RECOVERY_OWNER',id,'Recovery owner differs from approved contract');
          need(obj(p.coverage)&&['PASS','FAIL','UNKNOWN'].includes(p.coverage.status)&&equal(p.coverage.required,contract.semantic_coverage),'COVERAGE',id,'Missing or altered approved coverage');
          need(p.coverage.status==='UNKNOWN'?p.coverage.reviewed===null:Array.isArray(p.coverage.reviewed),'COVERAGE',id,'Unknown reviewed coverage must be null');
          if(p.coverage.status==='PASS')need(equal(p.coverage.reviewed,contract.semantic_coverage)&&(!semanticRequired.includes(id)||equal(p.coverage.reviewed,d?.review?.scope)),'COVERAGE',id,'Passing coverage differs from approved or required declared set');
          if(p.structure==='PASS')need(p.kind===contract.kind,'KIND',id,'Passing projection kind differs from approved contract');
        }
        need(['PASS','FAIL'].includes(p.structure)&&['PASS','FAIL'].includes(p.materialization)&&['PASS','FAIL','UNKNOWN'].includes(p.source_identity)&&['COMPLETE','PENDING','FAILED'].includes(p.status),'AXES',id,'Unknown projection axis');
        for(const [axis,requiredAxis] of [['semantic_review',semanticRequired.includes(id)],['render_review',renderRequired.includes(id)]]){
          const a=p[axis];need(obj(a)&&['PASS','FAIL','UNKNOWN','NOT_REQUIRED'].includes(a.status),'AXES',id+'/'+axis,'Missing review axis');
          need(a.status==='UNKNOWN'?a.findings===null:Array.isArray(a.findings),'UNKNOWN_COUNT',id+'/'+axis,'Unreviewed findings must be null, not zero/empty');
          if(a.status==='PASS'||a.status==='NOT_REQUIRED')need(a.findings.length===0,'FALSE_PASS',id+'/'+axis,'Passing review cannot contain findings');
          need(!requiredAxis||a.status!=='NOT_REQUIRED','SCOPE',id+'/'+axis,'Required review cannot be waived by output');
        }
        array(p.findings,id+'/findings');
        if(d){
          if(p.materialization==='PASS'){
            sameFile({path:p.path,sha256:p.sha256},fromAudit(d),id+'/target');
            if(contract&&p.structure==='PASS'){
              const content=new TextDecoder('utf-8',{fatal:true}).decode(load(root,fromAudit(d)).bytes);
              need(contract.required_markers.every(m=>str(m)&&content.includes(m)),'STRUCTURE_MARKERS',id,'Current projection lacks approved required markers');
            }
          }
          for(const [key,field] of [['review_evidence','review_evidence_sha256'],['render_evidence','render_evidence_sha256']]){
            if(p[field]!==null){const expected=fromAudit(d.review?.[key]);need(p[field]===expected.sha256,'IDENTITY',id+'/'+field,'Reported review evidence differs from input');load(root,expected);}
          }
          need(p.semantic_review.status!=='PASS'||digest(p.review_evidence_sha256),'REVIEW_EVIDENCE',id,'PASS needs current semantic review proof');
          need(p.render_review.status!=='PASS'||digest(p.render_evidence_sha256),'REVIEW_EVIDENCE',id,'PASS needs current render review proof');
          need(p.semantic_review.status!=='PASS'||d.review?.semantic_status==='PASS','REVIEW_STATUS',id,'Semantic PASS contradicts declared review');
          need(p.render_review.status!=='PASS'||d.review?.render_status==='PASS','REVIEW_STATUS',id,'Render PASS contradicts declared review');
        }
        if(p.status==='COMPLETE')need(d&&p.structure==='PASS'&&p.materialization==='PASS'&&p.source_identity==='PASS'&&p.coverage?.status==='PASS'&&['PASS','NOT_REQUIRED'].includes(p.semantic_review.status)&&['PASS','NOT_REQUIRED'].includes(p.render_review.status)&&p.findings.length===0,'FALSE_COMPLETE',id,'COMPLETE contradicts a review axis');
        if(mandatory)(p.status==='COMPLETE'?completed:p.status==='PENDING'?pending:failed).push(id);
      }
      need(equal([...seen].sort(),[...new Set([...required,...declarations.keys()])].sort()),'COVERAGE','projections','Missing required/declared projection result');
      for(const [key,expected] of [['completed_projection_ids',completed],['pending_projection_ids',pending],['failed_projection_ids',failed]])need(equal([...unique(report[key],key)].sort(),expected.sort()),'PARTITION',key,'Summary does not match projection outcomes');
      need(unique(report.resumed_projection_ids,'resumed').every(id=>completed.includes(id))&&digest(report.resume_identity),'RESUME','resume','Malformed resume identity/IDs');
      need(report.resumed_projection_ids.length===0||primary.resume_receipt!=null,'RESUME','resume','Reused results need an explicit prior receipt');
      const shouldPass=completed.length===required.length&&!pending.length&&!failed.length;
      need(report.overall_status===(shouldPass?'PASS':'PARTIAL'),'FALSE_PASS','overall_status','Overall result contradicts required projections');
      array(report.next_actions,'next_actions');array(report.limitations,'limitations');
    }
    need(capture.exit_code===(report.overall_status==='PASS'?0:1),'EXIT_MISMATCH','capture','Exit code and producer verdict disagree');
    for(const s of snapshots){if(realpathSync(resolve(s.base,s.path))!==s.abs||sha(readFileSync(s.abs))!==s.sha256)unknown('CHANGED_DURING_READ',s.path,'Input changed while consuming result');}
    result.allowed=report.overall_status==='PASS';result.verdict=result.allowed?'pass':'blocked';
  }catch(e){result.findings.push({kind:e.kind??'invalid',code:e.code??'READ_ERROR',at:e.at??'input',message:e instanceof Finding?e.message:'Cannot consume this input safely'});result.verdict=result.findings[0].kind;}
  return result;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const keys=new Map([['--root','root'],['--evidence-root','evidenceRoot'],['--producer-root','producerRoot'],['--request','request'],['--request-sha256','requestSha256'],['--capture','capture'],['--capture-sha256','captureSha256']]);
  let result;try{
    const opts={};for(let i=2;i<process.argv.length;i+=2){const k=keys.get(process.argv[i]),v=process.argv[i+1];need(k&&!Object.hasOwn(opts,k)&&str(v)&&!v.startsWith('--'),'CLI','arguments','Unknown/duplicate option or missing value');opts[k]=v;}
    need(['root','request','requestSha256','capture','captureSha256'].every(k=>str(opts[k])),'CLI','arguments','Missing explicit root/request/capture pins');result=consume(opts);
  }catch(e){result={schema:'joeness.operation-consumption.v1',allowed:false,verdict:'invalid',project_complete:false,approval_granted:false,findings:[{kind:'invalid',code:e.code??'CLI',message:e.message}],reported:null};}
  process.stdout.write(JSON.stringify(result)+'\n');process.exitCode=result.allowed?0:2;
}
