// One bounded old/new code-work pair on identical fictional Git fixtures.
import { spawn, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)));
const repo = resolve(root, '../../../../');
const binary = process.env.JOENESS_EVAL_CODEX_BIN;
const arm = process.argv[2];
if (!binary || !existsSync(binary)) throw new Error('Set JOENESS_EVAL_CODEX_BIN');
if (!['old', 'new'].includes(arm)) throw new Error('Pass old or new');
const project = resolve(`D:/JOEWRKS/JOENESS-PlainLanguage-Coding-20260927/${arm}`);
const resultPath = join(root, 'results', `coding-${arm}.json`);
const responsePath = join(root, 'responses', `coding-${arm}.md`);
if (!existsSync(project) || existsSync(resultPath) || existsSync(responsePath)) throw new Error('Missing fixture or result already exists');
const skill = arm === 'old'
  ? execFileSync('git', ['show', 'bbe456a:skills/joeness-setup/SKILL.md'], {cwd: repo, encoding: 'utf8'})
  : readFileSync(join(repo, 'skills/joeness-setup/SKILL.md'), 'utf8');
const start = skill.indexOf('After substantive work, lead with six');
const end = skill.indexOf('Simple questions need no receipt;', start);
if (start < 0 || end < 0) throw new Error('Report guidance not found');
const guidance = skill.slice(start, end).trim();
const prompt = [
  '가상 Reading Shelf 프로젝트의 현재 파일과 기록을 먼저 확인하세요.',
  '이번 작업은 ROADMAP의 R1만 완료하는 것입니다. addBook이 author를 보존하고, 기존 id의 중복 추가를 거부하며, 입력 목록을 바꾸지 않도록 하세요.',
  '해당 동작을 확인하는 테스트를 추가하고 로컬 테스트를 실행하세요. R2 검색과 선택 사항 CSV는 구현하지 마세요.',
  '프로젝트의 기존 기록 규칙에 따라 작업 결과와 실제 확인 범위만 기록하세요. M1 전체 완료 또는 사용자 승인을 주장하지 마세요.',
  '',
  '이번 평가에서 최종 보고에만 다음 지침을 적용하세요. 작업 범위와 근거는 바꾸지 마세요.',
  '<report-guidance>', guidance, '</report-guidance>',
].join('\n');
const sha = value => createHash('sha256').update(value).digest('hex');
const git = (...args) => execFileSync('git', ['-C', project, ...args], {encoding:'utf8'}).trim();
const beforeTree = git('rev-parse', 'HEAD^{tree}');
const beforeStatus = git('status', '--porcelain=v1', '--untracked-files=all');
if (beforeStatus) throw new Error('Fixture must start clean');
mkdirSync(join(root, 'results'), {recursive:true});
mkdirSync(join(root, 'responses'), {recursive:true});
const args = ['exec', '--ephemeral', '--ignore-user-config', '-m', 'gpt-6-astra',
  '-c', 'model_reasoning_effort="xhigh"', '-c', 'approval_policy="never"',
  '-s', 'danger-full-access', '-C', project, '--json', '-o', responsePath, '--', prompt];
let buffer = '', threadId = null, usage = null, lastError = null;
let testCommandCount = 0;
const eventCounts = {};
function collect(line) {
  if (!line.trim()) return;
  try {
    const event = JSON.parse(line);
    eventCounts[event.type] = (eventCounts[event.type] || 0) + 1;
    if (event.type === 'thread.started') threadId = event.thread_id || null;
    if (event.type === 'turn.completed') usage = event.usage || null;
    if (event.type === 'turn.failed' || event.type === 'error') lastError = event.message || event.error || event.type;
    if (event.type === 'item.started' && event.item?.type === 'command_execution' &&
      /(?:node\s+--test|npm(?:\.cmd)?\s+test)/i.test(event.item.command || '')) testCommandCount++;
  } catch { /* Never retain full rollout or command output. */ }
}
console.log(`START coding-${arm}`);
const startedAt = new Date().toISOString();
const startTime = performance.now();
const child = spawn(binary, args, {cwd:project, windowsHide:true});
child.stdin.end();
child.stdout.on('data', chunk => {
  buffer += chunk.toString();
  let at;
  while ((at = buffer.indexOf('\n')) >= 0) {
    collect(buffer.slice(0, at));
    buffer = buffer.slice(at + 1);
  }
});
child.stderr.on('data', () => {});
const exitCode = await new Promise((done, fail) => { child.on('error', fail); child.on('close', done); });
collect(buffer);
const response = existsSync(responsePath) ? readFileSync(responsePath, 'utf8') : null;
const result = {
  id:`coding-${arm}`, startedAt, wallMs:Math.round(performance.now()-startTime), exitCode,
  fixture:'reading-shelf', arm, baselineTree:beforeTree,
  runtime:{binary, model:'gpt-6-astra', reasoningEffort:'xhigh', threadId},
  promptSha256:sha(prompt), guidanceSha256:sha(guidance), responseSha256:response === null ? null : sha(response),
  usage, testCommandCount, eventCounts, lastError,
  statusBefore:beforeStatus, statusAfter:git('status', '--porcelain=v1', '--untracked-files=all'),
  diffStat:git('diff', '--stat'),
};
writeFileSync(resultPath, JSON.stringify(result, null, 2) + '\n');
console.log(`END coding-${arm} exit=${exitCode} tokens=${usage ? usage.input_tokens + usage.output_tokens : 'missing'} wall=${result.wallMs}ms`);
if (exitCode !== 0 || !usage || !threadId) throw new Error(`Preserved failing evidence: coding-${arm}`);
