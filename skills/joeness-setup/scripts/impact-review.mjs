// Read-only diagnostic. No gate override, receipt rewrite, repin or approval.
import {readFileSync,realpathSync,statSync} from 'node:fs';
import {resolve,relative,isAbsolute,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual as equal} from 'node:util';
const sha=b=>createHash('sha256').update(b).digest('hex');
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const text=x=>typeof x==='string'&&x.trim().length>0;
const hash=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const need=(ok,message)=>{if(!ok)throw Error(message);};
const canon=v=>Array.isArray(v)?v.map(canon):obj(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canon(v[k])])):v;
const digest=v=>sha(JSON.stringify(canon(v)));
const omit=(v,keys)=>Object.fromEntries(Object.entries(v).filter(([k])=>!keys.includes(k)));
const list=x=>{need(Array.isArray(x)&&x.length<=4096,'Expected bounded list');return x;};
const ids=x=>{list(x);need(x.every(text)&&new Set(x).size===x.length,'Duplicate/invalid IDs');return x;};
function index(rows,key){const m=new Map();for(const row of list(rows)){need(obj(row)&&text(row[key])&&!m.has(row[key]),'Missing/duplicate '+key);m.set(row[key],row);}return m;}
const sameKeys=(a,b)=>equal([...a.keys()].sort(),[...b.keys()].sort());
const categories=['reusable-candidate','rerun','unknown'];
export function inspect(options){
 const out={schema:'joeness.impact-consumption.v1',valid:false,allowed:false,reuse_authorized:false,project_complete:false,scope_id:null,candidate_check_ids:[],checks:[],errors:[],limits:['Diagnostic only; existing gate and user acceptance remain unchanged.','Local pins and review contexts do not authenticate actors, measurements or dependency completeness.']};
 const seen=[];
 try{
  const root=realpathSync(options.root),roots=[root,...(options.evidenceRoots||[]).map(p=>realpathSync(p))];
  const inside=(base,p)=>{const r=relative(base,p);return r===''||r!=='..'&&!r.startsWith('..'+sep)&&!isAbsolute(r);};
  function path(p,evidence=false){need(text(p)&&!p.includes('\0'),'Invalid path');const full=realpathSync(resolve(root,p));need((evidence?roots:[root]).some(r=>inside(r,full)),'Path outside allowed roots');return full;}
  function bytes(ref,evidence=false){need(obj(ref)&&hash(ref.sha256),'Missing independent reference hash');const p=path(ref.path,evidence);need(statSync(p).isFile()&&statSync(p).size<=64*1024*1024,'Invalid/oversize evidence');const b=readFileSync(p);need(sha(b)===ref.sha256,'Pinned bytes changed: '+ref.path);seen.push({ref,evidence,p});return b;}
  const decode=b=>new TextDecoder('utf-8',{fatal:true}).decode(b).replace(/^\uFEFF/,'');
  function json(ref,evidence=false){const b=bytes(ref,evidence);need(b.length<=4*1024*1024,'Oversize JSON');const v=JSON.parse(decode(b));need(obj(v),'Expected JSON object');return v;}
  const external=(name,pin)=>({path:options[name],sha256:options[pin]});
  const impactRef=external('impact','impactSha256'),reviewRef=external('impactReview','impactReviewSha256'),newRef=external('baseline','baselineSha256'),oldRef=external('previousBaseline','previousBaselineSha256'),receiptRef=external('oldResult','oldResultSha256');
  const report=json(impactRef,true),review=json(reviewRef,true),old=json(oldRef),current=json(newRef),receipt=json(receiptRef,true);
  need(report.schema==='joedesign.impact.v1'&&report.reuse_authorized===false&&report.acceptance==='NOT_GRANTED'&&report.trust==='LOCAL_UNAUTHENTICATED','Impact cannot grant reuse/acceptance');
  need(old.schema==='joeness.review-baseline.v1'&&current.schema===old.schema&&text(current.scope_id)&&old.scope_id===current.scope_id,'Invalid baseline scope');out.scope_id=current.scope_id;
  need(report.scope_id===out.scope_id&&review.schema==='joeness.impact-reuse-review.v1'&&review.scope_id===out.scope_id,'Review/report scope mismatch');
  need(equal(omit(old,['authority','authorization_ref']),omit(current,['authority','authorization_ref'])),'Baseline scope/criterion/target/acceptance/context changed');
  const definitions=index(current.required_checks,'check_id'),targets=index(current.targets,'id');need(definitions.size>0&&targets.size>0,'Empty required scope');
  function sameRef(actual,expected,evidence=false){need(actual?.sha256===expected.sha256&&path(actual.path,evidence)===path(expected.path,evidence),'Reported source differs from independent pin');bytes(actual,evidence);}
  sameRef(report.old_baseline,oldRef);sameRef(report.new_baseline,newRef);sameRef(report.old_result,receiptRef,true);
  need(review.impact_sha256===impactRef.sha256&&review.old_baseline_sha256===oldRef.sha256&&review.new_baseline_sha256===newRef.sha256&&review.old_result_sha256===receiptRef.sha256&&review.semantic_review_sha256===report.review?.sha256,'Independent review binds another transition');
  need(text(review.implementation_context)&&text(review.review_context)&&review.implementation_context!==review.review_context&&text(review.rationale),'Missing independent substantive review');
  need(list(review.source_refs).length>0,'Missing independent review source material');for(const ref of review.source_refs)bytes(ref,true);
  const request=json(report.request);need(request.schema==='joedesign.impact-request.v1','Invalid request');
  for(const k of ['old_baseline','new_baseline','old_result','served','review','authority_before'])need(equal(request[k],report[k]),'Report/request binding mismatch: '+k);
  const transition=digest(omit(request,['review']));need(report.transition_sha256===transition,'Transition digest mismatch');
  const semantic=json(report.review);need(semantic.schema==='joedesign.impact-review.v1'&&semantic.scope_id===out.scope_id&&semantic.transition_sha256===transition&&text(semantic.scope_analysis),'Semantic review scope mismatch');
  need(text(semantic.implementation_context)&&text(semantic.review_context)&&semantic.implementation_context!==semantic.review_context,'Semantic review not independent');
  const decisions=index(semantic.checks,'check_id');need([...decisions.keys()].every(id=>definitions.has(id)),'Unknown semantic review check');
  const before=index(old.authority,'path'),after=index(current.authority,'path'),snapshots=index(report.authority_before,'path'),analysis=index(semantic.authority_analysis,'path'),deltas=index(report.authority_delta,'path');
  need(before.size>0&&[after,snapshots,analysis,deltas].every(m=>sameKeys(before,m)),'Authority coverage mismatch');
  for(const [name,a] of before){
   const b=after.get(name),s=snapshots.get(name).snapshot,v=analysis.get(name),d=deltas.get(name);
   need(equal(omit(a,['sha256']),omit(b,['sha256']))&&s?.sha256===a.sha256,'Authority definition/snapshot mismatch');
   const original=bytes(s),now=bytes(b),suffix=now.subarray(original.length);
   need(now.subarray(0,original.length).equals(original),'Existing authority bytes changed');
   need(text(v.rationale)&&d.kind===v.kind&&d.old_sha256===a.sha256&&d.new_sha256===b.sha256&&d.appended_sha256===sha(suffix),'Authority delta contradicts actual bytes');
   if(now.equals(original))need(v.kind==='UNCHANGED','Unchanged authority misclassified');
   else{
    need(name==='DESIGN.md'&&suffix.length>0,'Only root DESIGN append is supported');const content=decode(suffix).trim();
    if(v.kind==='COMMENT_APPEND')need(content.startsWith('<!--')&&content.endsWith('-->')&&!content.slice(4,-3).includes('-->'),'Not one comment append');
    else if(v.kind==='UNRELATED_SECTION_APPEND')need(/^\r?\n/.test(decode(suffix))&&content.startsWith('## ')&&!decode(original).split(/\r?\n/).includes(content.split(/\r?\n/)[0]),'Not a new appended section');
    else throw Error('Unsupported authority change');
   }
  }
  need(receipt.schema==='joedesign.conformance.v1'&&receipt.scope_id===out.scope_id&&receipt.baseline_sha256===oldRef.sha256&&receipt.acceptance==='NOT_GRANTED','Old receipt identity/acceptance mismatch');
  const previous=index(receipt.results,'check_id'),unresolved=index(receipt.unresolved,'check_id'),rows=index(report.checks,'check_id');
  need(sameKeys(previous,definitions)&&sameKeys(rows,definitions)&&[...unresolved.keys()].every(id=>definitions.has(id)),'Required receipt/report coverage mismatch');
  const confirmed=ids(review.confirmed_candidate_check_ids);need(confirmed.every(id=>rows.get(id)?.classification==='reusable-candidate'),'Review confirms missing/noncandidate check');
  const counts=Object.fromEntries(categories.map(k=>[k,[...rows.values()].filter(r=>r.classification===k).length]));need(equal(report.counts,counts)&&list(report.findings).length===0,'Invalid counts or unresolved shared findings');
  const served=json(report.served);need(served.schema==='joedesign.served-build.v1'&&served.scope_id===out.scope_id&&served.baseline_sha256===newRef.sha256,'Served scope mismatch');
  const servedTargets=index(list(served.targets).map(t=>({...t,id:t.target?.id})),'id');need(sameKeys(servedTargets,targets),'Served target coverage mismatch');
  for(const [id,c] of definitions){
   const row=rows.get(id),prior=previous.get(id),verdict={check_id:id,classification:row.classification,reasons:row.reasons};
   need(categories.includes(row.classification)&&list(row.reasons).length>0&&row.reasons.every(text),'Malformed impact row');
   need(['check_id','target_id','method','criterion_sha256'].every(k=>row[k]===c[k]),'Impact check definition mismatch');
   if(row.classification==='reusable-candidate'){
    try{
     need(confirmed.includes(id),'Candidate has no independent confirmation');
     need(equal(row.previous_result,prior)&&prior.status==='PASS'&&!unresolved.has(id),'Old failure/unverified/altered result');
     need(c.method==='geometry'&&c.lane==='visual'&&['check_id','target_id','method','criterion_sha256'].every(k=>prior[k]===c[k]),'Unchanged geometry only');
     const inputs=ids(c.inputs);need(inputs.length>0,'Empty dependencies');
     const fingerprint=sha(JSON.stringify([...inputs].sort((a,b)=>Buffer.compare(Buffer.from(a),Buffer.from(b))).map(p=>{const b=readFileSync(path(p));const ref={path:p,sha256:sha(b)};bytes(ref);return [p,ref.sha256];})));
     need(row.input_fingerprint===fingerprint&&prior.input_fingerprint===fingerprint,'Current runtime inputs changed');
     const decision=decisions.get(id);need(decision?.verdict==='UNAFFECTED'&&text(decision.rationale)&&list(decision.blocking_findings).length===0&&list(decision.source_refs).length>0,'Missing review or current blocker/rejection');for(const ref of decision.source_refs)bytes(ref,true);
     const target=targets.get(c.target_id),live=servedTargets.get(c.target_id);need(target&&equal(row.target,target)&&equal(live.target,target)&&text(live.build_id)&&row.build_id===live.build_id,'Current target/build mismatch');
     need(live.dependencies_complete===true&&equal(live.limitations,[]),'Unverified served/late dependencies');
     const resources=index(live.resources,'path'),expected=new Set([...definitions.values()].filter(x=>x.target_id===c.target_id).flatMap(x=>x.inputs));need(equal([...resources.keys()].sort(),[...expected].sort()),'Served dependency coverage mismatch');
     for(const ref of resources.values()){bytes(ref);need(ref.response_sha256===ref.sha256,'Served response differs from current input');}
     const proofs=list(prior.evidence);need(proofs.length>0,'Missing old evidence');const logs=[],bound=new Map();
     for(const proof of proofs){const b=bytes(proof,true);bound.set(path(proof.path,true),proof.sha256);try{const log=JSON.parse(decode(b));if(obj(log)&&obj(log.target)&&obj(log.design))logs.push(log);}catch{}}
     need(logs.length===1,'Missing/ambiguous prior observation');const log=logs[0];
     need(equal(log.target,target)&&log.build_id===live.build_id&&log.design.baseline_sha256===oldRef.sha256&&log.design.input_fingerprints?.[id]===fingerprint,'Observed target/build/baseline differs');
     need(list(log.frames).length>0,'Missing rendered frame');for(const frame of log.frames){const expected=log.frame_hashes?.[frame];need(hash(expected)&&bound.get(path(frame,true))===expected,'Unbound frame');bytes({path:frame,sha256:expected},true);}
    }catch(e){verdict.classification='unknown';verdict.reasons=[e.message];}
   }
   out.checks.push(verdict);
  }
  for(const s of seen)need(path(s.ref.path,s.evidence)===s.p&&sha(readFileSync(s.p))===s.ref.sha256,'Source changed during read');
  out.candidate_check_ids=out.checks.filter(c=>c.classification==='reusable-candidate').map(c=>c.check_id);out.valid=true;
 }catch(e){out.errors.push(e.message);out.checks=out.checks.map(c=>({...c,classification:'unknown',reasons:['Invalid shared evidence']}));out.candidate_check_ids=[];}
 return out;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 let out;try{
  const names={'--root':'root','--impact':'impact','--impact-sha256':'impactSha256','--impact-review':'impactReview','--impact-review-sha256':'impactReviewSha256','--baseline':'baseline','--baseline-sha256':'baselineSha256','--previous-baseline':'previousBaseline','--previous-baseline-sha256':'previousBaselineSha256','--old-result':'oldResult','--old-result-sha256':'oldResultSha256'},opts={evidenceRoots:[]};
  for(let i=2;i<process.argv.length;i+=2){const k=process.argv[i],v=process.argv[i+1];need(text(v)&&!v.startsWith('--'),'Missing CLI value');if(k==='--evidence-root')opts.evidenceRoots.push(v);else{need(Object.hasOwn(names,k)&&!Object.hasOwn(opts,names[k]),'Unknown/duplicate CLI option');opts[names[k]]=v;}}
  need(Object.values(names).every(k=>text(opts[k])),'Missing independent pin argument');out=inspect(opts);
 }catch(e){out={schema:'joeness.impact-consumption.v1',valid:false,allowed:false,reuse_authorized:false,project_complete:false,candidate_check_ids:[],checks:[],errors:[e.message]};}
 console.log(JSON.stringify(out));process.exitCode=out.valid?0:2;
}
