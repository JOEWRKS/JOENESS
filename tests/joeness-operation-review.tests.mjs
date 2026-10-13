import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,rmSync,readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const cli=process.env.JOENESS_TEST_OPERATION_CLI||fileURLToPath(new URL('../skills/joeness-setup/scripts/operation-review.mjs',import.meta.url));
const hash=b=>createHash('sha256').update(b).digest('hex');
function fixture(t,projection=false){
  const root=mkdtempSync(join(tmpdir(),'joeness-operation-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
  const put=(p,v)=>writeFileSync(join(root,p),typeof v==='string'?v:JSON.stringify(v)),sha=p=>hash(readFileSync(join(root,p)));
  const ref=p=>({path:p,sha256:sha(p)}),absolute=p=>({path:join(root,p),sha256:sha(p)});
  put('producer.py','# synthetic transport fixture, not a real producer execution');
  put('state.json',{schema_version:'0.2.0',project:{definition_revision:1,definition_status:'READY_FOR_REVIEW'},approval:{status:'UNAPPROVED'}});
  let report,primary='state.json';
  if(!projection)report={schema_version:'joewrks.state-candidate-preflight/1.0',source:absolute(primary),canonical:null,canonical_unchanged:null,source_unchanged:true,identity:{schema_version:'0.2.0',definition_revision:1,definition_status:'READY_FOR_REVIEW',approval_status:'UNAPPROVED',definition_digest:'a'.repeat(64)},stages:{state_validation:'PASS',semantic_readiness:'PASS',manifest_review_readiness:'PASS',user_approval:'UNAPPROVED'},overall_status:'PASS',findings:[],summary:{validation_error_count:0,blocking_metric_count:0,finding_count:0},next_action:'PRESENT_EXACT_MANIFEST_FOR_USER_REVIEW'};
  else{
    put('scope.json',{scope_id:'fixture',required_projection_ids:['master','html'],semantic_review_required_ids:['master','html'],render_review_required_ids:[],projection_contracts:Object.fromEntries(['master','html'].map(id=>[id,{kind:'MARKDOWN',required_markers:[id+' content'],semantic_coverage:[],recovery_owner:'PRODUCT_DEFINITION_OWNER'}]))});
    const declarations=['master','html'].map(id=>{
      put(id+'.md',id+' content');put(id+'-review.json',{status:'PASS'});
      return {projection_id:id,kind:'MARKDOWN',...ref(id+'.md'),required:true,review:{scope:[],semantic_status:'PASS',semantic_findings:[],review_evidence:ref(id+'-review.json'),render_status:'NOT_REQUIRED'}};
    });
    put('audit.json',{schema_version:'joewrks.projection-audit-input/1.0',canonical_state:ref('state.json'),scope_authority:{...ref('scope.json'),pointer:''},projections:declarations});primary='audit.json';
    report={schema_version:'joewrks.projection-audit/1.0',input:absolute(primary),canonical_source:absolute('state.json'),scope_authority_sha256:sha('scope.json'),source_unchanged:true,overall_status:'PASS',resume_identity:'a'.repeat(64),resumed_projection_ids:[],completed_projection_ids:['html','master'],pending_projection_ids:[],failed_projection_ids:[],next_actions:[],limitations:['Synthetic observations only'],projections:declarations.map(d=>({projection_id:d.projection_id,kind:d.kind,...absolute(d.path),required:true,source_identity:'PASS',structure:'PASS',materialization:'PASS',semantic_review:{status:'PASS',findings:[],coverage:[]},coverage:{status:'PASS',required:[],reviewed:[]},render_review:{status:'NOT_REQUIRED',findings:[]},review_evidence_sha256:sha(d.projection_id+'-review.json'),render_evidence_sha256:null,status:'COMPLETE',findings:[],next_action:'NONE',recovery_owner:'PRODUCT_DEFINITION_OWNER'}))};
  }
  const request={schema:'joeness.operation-request.v1',run_id:'synthetic-run-1',producer_schema:report.schema_version,primary:ref(primary),canonical:null,producer_files:[ref('producer.py')]};
  const capture={schema:'joeness.operation-capture.v1',run_id:request.run_id,request_sha256:null,exit_code:0,signal:null,stdout:null,stderr:null};
  function seal(raw=JSON.stringify(report)){
    put('request.json',request);put('stdout.txt',raw);put('stderr.txt','');capture.request_sha256=sha('request.json');capture.stdout=ref('stdout.txt');capture.stderr=ref('stderr.txt');put('capture.json',capture);
  }
  function run(extra=[]){const r=spawnSync(process.execPath,[cli,'--root',root,'--evidence-root',root,'--request','request.json','--request-sha256',sha('request.json'),'--capture','capture.json','--capture-sha256',sha('capture.json'),...extra],{encoding:'utf8'});assert.ifError(r.error);assert.ok(r.stdout.trim(),r.stderr);return {exit:r.status,...JSON.parse(r.stdout)};}
  seal();return {root,put,sha,ref,request,capture,report,seal,run};
}
test('F03 PASS is preflight only and preserves UNAPPROVED',t=>{const f=fixture(t),r=f.run();assert.equal(r.exit,0);assert.equal(r.allowed,true);assert.equal(r.project_complete,false);assert.equal(r.approval_granted,false);assert.equal(r.reported.stages.user_approval,'UNAPPROVED');});
test('F03 structured failure preserves findings but never allows completion',t=>{const f=fixture(t);f.report.overall_status='FAIL';f.report.stages.state_validation='FAIL';f.report.findings=[{id:'F1',pointer:'/schema_version',cause:'bad schema',next_action:'repair candidate'}];f.report.summary.finding_count=1;f.capture.exit_code=1;f.seal();const r=f.run();assert.equal(r.exit,2);assert.equal(r.verdict,'blocked');assert.equal(r.reported.findings[0].pointer,'/schema_version');});
test('failed execution cannot reuse a previous valid stdout',t=>{const f=fixture(t);f.capture.exit_code=2;f.seal();assert.equal(f.run().allowed,false);assert.ok(f.run().findings.some(x=>x.code==='EXECUTION_FAILED'));});
test('truncated, trailing or multiple JSON outputs are rejected',t=>{const f=fixture(t);for(const raw of ['{','{}\n{}',JSON.stringify(f.report)+'warning']){f.seal(raw);assert.equal(f.run().allowed,false);}});
test('run identity and current request pin prevent another run capture reuse',t=>{const f=fixture(t);f.capture.run_id='old-run';f.seal();assert.equal(f.run().allowed,false);f.capture.run_id=f.request.run_id;f.seal();f.capture.request_sha256='0'.repeat(64);f.put('capture.json',f.capture);assert.equal(f.run().allowed,false);});
test('stale target and producer bytes keep result pending',t=>{const f=fixture(t);f.put('state.json','changed');assert.equal(f.run().allowed,false);const g=fixture(t);g.put('producer.py','changed');assert.equal(g.run().allowed,false);});
test('F03 approval and source identity cannot be silently promoted',t=>{const f=fixture(t);f.report.identity.approval_status='APPROVED';f.seal();assert.equal(f.run().allowed,false);f.report.identity.approval_status='UNAPPROVED';f.report.source.sha256='a'.repeat(64);f.seal();assert.equal(f.run().allowed,false);});
test('F04 valid scope preserves every axis separately',t=>{const f=fixture(t,true),r=f.run();assert.equal(r.exit,0);assert.equal(r.reported.projections[0].semantic_review.status,'PASS');assert.equal(r.reported.projections[0].render_review.status,'NOT_REQUIRED');assert.equal(r.approval_granted,false);});
test('F04 PARTIAL keeps completed sibling and UNKNOWN/null semantic findings',t=>{const f=fixture(t,true),p=f.report.projections[1];p.status='PENDING';p.semantic_review={status:'UNKNOWN',findings:null,coverage:[]};p.coverage={status:'UNKNOWN',required:[],reviewed:null};p.review_evidence_sha256=null;p.next_action='COMPLETE_THE_UNREVIEWED_REQUIRED_AXIS';f.report.overall_status='PARTIAL';f.report.completed_projection_ids=['master'];f.report.pending_projection_ids=['html'];f.report.next_actions=[{projection_id:'html',owner:'PRODUCT_DEFINITION_OWNER',action:p.next_action,path:p.path}];f.capture.exit_code=1;f.seal();const r=f.run();assert.equal(r.exit,2);assert.equal(r.reported.projections[0].status,'COMPLETE');assert.equal(r.reported.projections[1].semantic_review.findings,null);});
test('UNKNOWN findings cannot be zero and UNKNOWN cannot be COMPLETE',t=>{const f=fixture(t,true),p=f.report.projections[0];p.semantic_review={status:'UNKNOWN',findings:0,coverage:[]};f.seal();assert.equal(f.run().allowed,false);p.semantic_review.findings=null;f.seal();assert.equal(f.run().allowed,false);});
test('missing, duplicate, downgraded required projection cannot hide behind top PASS',t=>{for(const mutate of [f=>f.report.projections.pop(),f=>f.report.projections.push(f.report.projections[0]),f=>f.report.projections[0].required=false]){const f=fixture(t,true);mutate(f);f.seal();assert.equal(f.run().allowed,false);}});
test('stale projection or review evidence prevents reusing output',t=>{const f=fixture(t,true);f.put('master.md','new body');assert.equal(f.run().allowed,false);const g=fixture(t,true);g.put('master-review.json','{}');assert.equal(g.run().allowed,false);});
test('incorrect status partitions and missing recovery owner are rejected',t=>{const f=fixture(t,true);f.report.completed_projection_ids=['master'];f.seal();assert.equal(f.run().allowed,false);f.report.completed_projection_ids=['master','html'];delete f.report.projections[0].recovery_owner;f.seal();assert.equal(f.run().allowed,false);});
test('root escape, duplicate CLI flags and altered capture bytes are rejected',t=>{const f=fixture(t);f.request.primary.path='../outside';f.seal();assert.equal(f.run().allowed,false);assert.equal(f.run(['--request','request.json']).allowed,false);});
test('consumer is read-only and no producer is executed by it',t=>{const f=fixture(t),snap=()=>readdirSync(f.root).map(p=>[p,f.sha(p)]),before=snap();assert.equal(f.run().exit,0);assert.deepEqual(snap(),before);});
test('final producer coverage FAIL/UNKNOWN cannot be hidden by COMPLETE',t=>{for(const status of ['FAIL','UNKNOWN']){const f=fixture(t,true);f.report.projections[0].coverage.status=status;f.seal();assert.equal(f.run().allowed,false);}});
test('approved projection coverage and recovery owner cannot be replaced',t=>{for(const mutate of [f=>f.report.projections[0].coverage.required=['invented'],f=>f.report.projections[0].recovery_owner='OTHER']){const f=fixture(t,true);mutate(f);f.seal();assert.equal(f.run().allowed,false);}});
test('projection with missing approved structural markers is not complete',t=>{const f=fixture(t,true);f.put('master.md','wrong content');let input=JSON.parse(readFileSync(join(f.root,'audit.json')));input.projections[0].sha256=f.sha('master.md');f.put('audit.json',input);f.request.primary=f.ref('audit.json');f.report.input.sha256=f.sha('audit.json');f.report.projections[0].sha256=f.sha('master.md');f.seal();assert.equal(f.run().allowed,false);});
test('approved nonrequired semantic review does not demand an extra review record',t=>{
  const f=fixture(t,true),scope=JSON.parse(readFileSync(join(f.root,'scope.json'))),input=JSON.parse(readFileSync(join(f.root,'audit.json')));
  scope.semantic_review_required_ids=['html'];f.put('scope.json',scope);input.scope_authority={...f.ref('scope.json'),pointer:''};delete input.projections[0].review;f.put('audit.json',input);
  f.request.primary=f.ref('audit.json');f.report.input.sha256=f.sha('audit.json');f.report.scope_authority_sha256=f.sha('scope.json');
  f.report.projections[0].semantic_review={status:'NOT_REQUIRED',findings:[],coverage:[]};f.report.projections[0].review_evidence_sha256=null;f.seal();assert.equal(f.run().allowed,true);
});
test('installed producer needs an explicit separate root; omitted root and escapes stay blocked',t=>{
  const f=fixture(t),producerRoot=mkdtempSync(join(tmpdir(),'joeness-installed-producer-'));t.after(()=>rmSync(producerRoot,{recursive:true,force:true}));
  const p=join(producerRoot,'producer.py');writeFileSync(p,'# installed producer fixture');f.request.producer_files=[{path:p,sha256:hash(readFileSync(p))}];f.seal();
  assert.equal(f.run().allowed,false);assert.equal(f.run(['--producer-root',producerRoot]).allowed,true);
  f.request.producer_files=[{...f.ref('producer.py'),path:join(f.root,'producer.py')}];f.seal();const escaped=f.run(['--producer-root',producerRoot]);assert.equal(escaped.allowed,false);assert.equal(escaped.findings[0].code,'PATH_ESCAPE');
});
