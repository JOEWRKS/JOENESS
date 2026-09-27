// Runs the preregistered six-stage comparison without retaining raw rollouts.
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const evidenceRoot = resolve(fileURLToPath(new URL('.', import.meta.url)));
const plan = JSON.parse(readFileSync(join(evidenceRoot, 'plan.json'), 'utf8'));
const trialRoot = resolve('D:/JOEWRKS/JOENESS-Usability-Performance-AB-20260927');
const binary = process.env.JOENESS_EVAL_CODEX_BIN;
if (!binary || !existsSync(binary)) throw new Error('Set JOENESS_EVAL_CODEX_BIN to the tested CLI binary');
if (!existsSync(trialRoot)) throw new Error(`Missing trial root: ${trialRoot}`);
if (plan.status !== 'PRE_REGISTERED' || plan.stages.length !== 6) throw new Error('Unexpected plan');

const hash = value => createHash('sha256').update(value).digest('hex');
function promptFor(stage, fixture) {
  const prompt = stage.prompts[fixture];
  return prompt === '$sharedSetupPrompt' ? plan.sharedSetupPrompt : prompt;
}
function gitStatus(project) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn('git', ['-C', project, 'status', '--porcelain=v1', '--untracked-files=all'], {
      cwd: project, windowsHide: true,
    });
    child.stdin.end();
    let output = '';
    child.stdout.on('data', chunk => { output += chunk.toString(); });
    child.stderr.on('data', chunk => { output += chunk.toString(); });
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolvePromise(output.trim()) : reject(new Error(output.trim())));
  });
}

async function runOne(fixture, arm, stage) {
  const id = `${fixture}-${arm}-${stage.id}`;
  const project = join(trialRoot, 'projects', `${fixture}-${arm}`);
  const codexHome = join(trialRoot, arm === 'bare' ? 'bare-home' : 'joeness-home');
  const responsePath = join(evidenceRoot, 'responses', `${id}.md`);
  const resultPath = join(evidenceRoot, 'results', `${id}.json`);
  if (!existsSync(project) || !existsSync(codexHome)) throw new Error(`Missing project or home: ${id}`);
  if (existsSync(responsePath) || existsSync(resultPath)) throw new Error(`Refusing rerun or overwrite: ${id}`);
  const prompt = promptFor(stage, fixture);
  const statusBefore = await gitStatus(project);
  const args = [
    'exec', '--ephemeral', '--ignore-user-config',
    '-m', 'gpt-6-astra', '-c', 'model_reasoning_effort="xhigh"',
    '-c', 'approval_policy="never"', '-s', 'danger-full-access',
    '-C', project, '--json', '-o', responsePath, '--', prompt,
  ];
  let buffer = '';
  let threadId = null;
  let usage = null;
  let lastError = null;
  const eventCounts = {};
  const itemTypeCounts = {};
  function collect(line) {
    if (!line.trim()) return;
    try {
      const event = JSON.parse(line);
      eventCounts[event.type] = (eventCounts[event.type] || 0) + 1;
      if (event.type === 'thread.started') threadId = event.thread_id || null;
      if (event.type === 'turn.completed') usage = event.usage || null;
      if (event.type === 'turn.failed' || event.type === 'error') lastError = event.message || event.error || event.type;
      if (event.type === 'item.started') {
        const itemType = event.item?.type || 'unknown';
        itemTypeCounts[itemType] = (itemTypeCounts[itemType] || 0) + 1;
      }
    } catch { /* Do not retain stderr or non-JSON progress. */ }
  }
  console.log(`START ${id}`);
  const startedAt = new Date().toISOString();
  const start = performance.now();
  const child = spawn(binary, args, {
    cwd: project,
    env: { ...process.env, CODEX_HOME: codexHome },
    windowsHide: true,
  });
  child.stdin.end();
  child.stdout.on('data', chunk => {
    buffer += chunk.toString();
    let index;
    while ((index = buffer.indexOf('\n')) >= 0) {
      collect(buffer.slice(0, index));
      buffer = buffer.slice(index + 1);
    }
  });
  child.stderr.on('data', () => {});
  const exitCode = await new Promise((resolvePromise, reject) => {
    child.on('error', reject);
    child.on('close', resolvePromise);
  });
  collect(buffer);
  const wallMs = Math.round(performance.now() - start);
  const statusAfter = await gitStatus(project);
  const response = existsSync(responsePath) ? readFileSync(responsePath, 'utf8') : null;
  const result = {
    id, fixture, arm, stage: stage.id, label: stage.label, startedAt, wallMs,
    exitCode,
    runtime: { binary, model: 'gpt-6-astra', reasoningEffort: 'xhigh', threadId },
    promptSha256: hash(prompt),
    responseSha256: response === null ? null : hash(response),
    usage,
    derived: usage ? {
      noncachedInput: usage.input_tokens - usage.cached_input_tokens,
      inputPlusOutput: usage.input_tokens + usage.output_tokens,
      noncachedInputPlusOutput: usage.input_tokens - usage.cached_input_tokens + usage.output_tokens,
    } : null,
    eventCounts, itemTypeCounts, lastError, statusBefore, statusAfter,
  };
  writeFileSync(resultPath, JSON.stringify(result, null, 2) + '\n');
  console.log(`END ${id} exit=${exitCode} wall=${wallMs}ms input=${usage?.input_tokens ?? 'missing'} cached=${usage?.cached_input_tokens ?? 'missing'} output=${usage?.output_tokens ?? 'missing'}`);
  if (exitCode !== 0 || !usage) throw new Error(`Run failed; retain evidence and inspect: ${id}`);
}

mkdirSync(join(evidenceRoot, 'responses'), { recursive: true });
mkdirSync(join(evidenceRoot, 'results'), { recursive: true });
for (const stage of plan.stages) {
  for (const fixture of ['reading-shelf', 'workshop-slots']) {
    for (const arm of stage.order[fixture]) await runOne(fixture, arm, stage);
  }
}
