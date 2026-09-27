// One fresh, read-only handoff on the user-selected actual MergeDrop worktree.
import { spawn, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)));
const caseId = process.env.JOENESS_EVAL_CASE || 'initial';
if (!['initial', 'post-audit', 'post-correction'].includes(caseId)) throw new Error('Unknown case');
const output = caseId === 'initial' ? root : join(root, caseId);
const project = resolve('D:/JOEWRKS/MergeDrop/.worktrees/mergedrop-v1');
const binary = process.env.JOENESS_EVAL_CODEX_BIN;
if (!binary || !existsSync(binary)) throw new Error('Set JOENESS_EVAL_CODEX_BIN');
const responsePath = join(output, 'response.md');
const resultPath = join(output, 'result.json');
if (existsSync(responsePath) || existsSync(resultPath)) throw new Error('No overwrite or rerun');
mkdirSync(output, {recursive:true});
const sha = value => createHash('sha256').update(value).digest('hex');
const git = (...args) => execFileSync('git', ['-C', project, ...args], {encoding:'utf8'}).trim();
const fileHash = path => sha(readFileSync(join(project, path)));
const before = {
  head:git('rev-parse', 'HEAD'), branch:git('branch', '--show-current'),
  statusSha256:sha(git('status', '--porcelain=v1', '--untracked-files=all')),
  agentsSha256:fileHash('AGENTS.md'), setupStateSha256:fileHash('.joeness/setup-state.json'),
  taskSha256:fileHash('TASK.md'),
};
const initialPrompt = [
  '처음 이 프로젝트를 맡는 동료에게 현재 상태를 인계해줘.',
  '지금까지 끝난 일, 아직 남은 일, 실제 다음 행동을 먼저 알려줘.',
  '현재 파일과 검증 근거를 확인하고 기술 완료와 사용자·외부 승인 상태를 구분해.',
  '이 요청은 읽기 전용이다. 파일을 수정하거나 빌드·기기 조작·외부 서비스 작업을 하지 마.',
].join('\n');
const postAuditPrompt = [
  '머지멜론의 0.1.13 출시 준비 점검을 새로 인계받았다.',
  '현재 작업표와 꼭 필요한 실제 파일을 확인해 이미 끝난 일, 남은 검증, 바로 다음 행동을 짧게 알려줘.',
  '오래된 기록과 현재 상태, 기술 검사와 사용자·Play 승인을 구분해.',
  '읽기 전용이다. 파일 수정, 빌드, 기기 조작, Play 작업은 하지 마.',
].join('\n');
const prompt = caseId === 'initial' ? initialPrompt : postAuditPrompt;
const args = ['exec', '--ephemeral', '-m', 'gpt-6-astra',
  '-c', 'model_reasoning_effort="xhigh"', '-c', 'approval_policy="never"',
  '-s', 'read-only', '-C', project, '--json', '-o', responsePath, '--', prompt];
let buffer = '', threadId = null, usage = null, lastError = null;
const eventCounts = {};
function collect(line) {
  if (!line.trim()) return;
  try {
    const event=JSON.parse(line);
    eventCounts[event.type]=(eventCounts[event.type]||0)+1;
    if (event.type==='thread.started') threadId=event.thread_id||null;
    if (event.type==='turn.completed') usage=event.usage||null;
    if (event.type==='turn.failed'||event.type==='error') lastError=event.message||event.error||event.type;
  } catch { /* Never retain rollout contents. */ }
}
console.log('START mergedrop handoff');
const startedAt=new Date().toISOString();
const start=performance.now();
const child=spawn(binary,args,{cwd:project,windowsHide:true});
child.stdin.end();
child.stdout.on('data',chunk=>{
  buffer+=chunk.toString(); let at;
  while((at=buffer.indexOf('\n'))>=0){collect(buffer.slice(0,at));buffer=buffer.slice(at+1);}
});
child.stderr.on('data',()=>{});
const exitCode=await new Promise((done,fail)=>{child.on('error',fail);child.on('close',done);});
collect(buffer);
const response=existsSync(responsePath)?readFileSync(responsePath):null;
const after = {
  head:git('rev-parse','HEAD'), branch:git('branch','--show-current'),
  statusSha256:sha(git('status','--porcelain=v1','--untracked-files=all')),
  agentsSha256:fileHash('AGENTS.md'), setupStateSha256:fileHash('.joeness/setup-state.json'),
  taskSha256:fileHash('TASK.md'),
};
const result={caseId,startedAt,wallMs:Math.round(performance.now()-start),exitCode,
  runtime:{binary,model:'gpt-6-astra',reasoningEffort:'xhigh',threadId},
  promptSha256:sha(prompt),responseSha256:response?sha(response):null,
  before,after,usage,eventCounts,lastError};
writeFileSync(resultPath,JSON.stringify(result,null,2)+'\n');
console.log(`END exit=${exitCode} tokens=${usage?usage.input_tokens+usage.output_tokens:'missing'} wall=${result.wallMs}ms unchanged=${JSON.stringify(before)===JSON.stringify(after)}`);
if(exitCode!==0||!usage||!threadId||JSON.stringify(before)!==JSON.stringify(after))throw new Error('Preserved failing/ambiguous evidence');
