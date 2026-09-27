// Fresh, read-only wording comparison; keeps bounded final answers, not rollouts.
import { spawn, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)));
const binary = process.env.JOENESS_EVAL_CODEX_BIN;
if (!binary || !existsSync(binary)) throw new Error('Set JOENESS_EVAL_CODEX_BIN');
const repo = resolve(root, '../../../../');
const oldSkill = execFileSync('git', ['show', 'bbe456a:skills/joeness-setup/SKILL.md'], {cwd:repo, encoding:'utf8'});
const newSkill = readFileSync(join(repo, 'skills/joeness-setup/SKILL.md'), 'utf8');
const sha = text => createHash('sha256').update(text).digest('hex');
function guidance(skill) {
  const start = skill.indexOf('After substantive work, lead with six');
  const end = skill.indexOf('Simple questions need no receipt;', start);
  if (start < 0 || end < 0) throw new Error('Cannot locate report guidance');
  return skill.slice(start, end).trim();
}
const oldGuidance = guidance(oldSkill);
const newGuidance = guidance(newSkill);
const trialRoot = resolve('D:/JOEWRKS/JOENESS-Usability-Performance-AB-20260927/projects');
const stagePlan = JSON.parse(readFileSync(join(repo, 'evals/joeness-setup/runs/2026-09-27-usability-performance-ab/plan.json'), 'utf8'));
const handoff = stagePlan.stages.find(stage => stage.id === 'S4');
const readOnlyCases = [
  ['reading-shelf', 'old'], ['reading-shelf', 'new'],
  ['workshop-slots', 'new'], ['workshop-slots', 'old'],
];
const workspaceRetry = process.argv.includes('--workspace-retry');
const fullAccessRetry = process.argv.includes('--full-access-retry');
const conciseRecheck = process.argv.includes('--concise-recheck');
const cases = conciseRecheck
  ? [['workshop-slots', 'new']]
  : workspaceRetry || fullAccessRetry
  ? [['reading-shelf', 'new'], ['workshop-slots', 'new']]
  : readOnlyCases;
function gitStatus(project) {
  return execFileSync('git', ['-C', project, 'status', '--porcelain=v1', '--untracked-files=all'], {encoding:'utf8'}).trim();
}
async function runOne(fixture, arm) {
  const suffix = conciseRecheck ? '-concise-recheck' : fullAccessRetry ? '-full-access-retry' : workspaceRetry ? '-workspace-retry' : '';
  const id = `${fixture}-${arm}${suffix}`;
  const project = join(trialRoot, `${fixture}-joeness`);
  const resultPath = join(root, 'results', `${id}.json`);
  const responsePath = join(root, 'responses', `${id}.md`);
  if (!existsSync(project)) throw new Error(`Project missing: ${project}`);
  if (existsSync(resultPath) || existsSync(responsePath)) throw new Error(`No rerun/overwrite: ${id}`);
  const instruction = arm === 'old' ? oldGuidance : newGuidance;
  const prompt = [
    handoff.prompts[fixture],
    '',
    '이번 평가에서는 다음 보고 지침을 적용하세요. 프로젝트의 다른 사실·권한·기록은 그대로 따릅니다.',
    '<report-guidance>', instruction, '</report-guidance>',
  ].join('\n');
  const before = gitStatus(project);
  const args = ['exec', '--ephemeral', '--ignore-user-config',
    '-m', 'gpt-6-astra', '-c', 'model_reasoning_effort="xhigh"',
    '-c', 'approval_policy="never"', '-s', conciseRecheck || fullAccessRetry ? 'danger-full-access' : workspaceRetry ? 'workspace-write' : 'read-only',
    '-C', project, '--json', '-o', responsePath, '--', prompt];
  let buffer = '', threadId = null, usage = null, lastError = null, testCommandCount = 0;
  const eventCounts = {};
  function collect(line) {
    if (!line.trim()) return;
    try {
      const event = JSON.parse(line);
      eventCounts[event.type] = (eventCounts[event.type] || 0) + 1;
      if (event.type === 'thread.started') threadId = event.thread_id || null;
      if (event.type === 'turn.completed') usage = event.usage || null;
      if (event.type === 'turn.failed' || event.type === 'error') lastError = event.message || event.error || event.type;
      if (event.type === 'item.started' && event.item?.type === 'command_execution'
          && /(?:node\s+--test|npm(?:\.cmd)?\s+test)/i.test(event.item.command || '')) testCommandCount++;
    } catch { /* Do not persist raw events or output. */ }
  }
  console.log(`START ${id}`);
  const startedAt = new Date().toISOString();
  const start = performance.now();
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
  const exitCode = await new Promise((resolvePromise, reject) => {
    child.on('error', reject);
    child.on('close', resolvePromise);
  });
  collect(buffer);
  const response = existsSync(responsePath) ? readFileSync(responsePath, 'utf8') : null;
  const result = {
    id, fixture, arm, startedAt, wallMs:Math.round(performance.now() - start), exitCode,
    runtime:{binary, model:'gpt-6-astra', reasoningEffort:'xhigh', threadId},
    promptSha256:sha(prompt), guidanceSha256:sha(instruction),
    responseSha256:response === null ? null : sha(response),
    usage, testCommandCount, eventCounts, lastError,
    statusBefore:before, statusAfter:gitStatus(project),
  };
  writeFileSync(resultPath, JSON.stringify(result, null, 2) + '\n');
  console.log(`END ${id} exit=${exitCode} tokens=${usage ? usage.input_tokens + usage.output_tokens : 'missing'} wall=${result.wallMs}ms`);
  if (exitCode !== 0 || !usage || !threadId || before !== result.statusAfter) {
    throw new Error(`Preserved failing evidence: ${id}`);
  }
}
mkdirSync(join(root, 'results'), {recursive:true});
mkdirSync(join(root, 'responses'), {recursive:true});
for (const [fixture, arm] of cases) await runOne(fixture, arm);
