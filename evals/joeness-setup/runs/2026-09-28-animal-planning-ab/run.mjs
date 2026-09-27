// One-shot, preregistered real-project planning comparison. Never stores auth or raw rollouts.
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const evidenceRoot = dirname(fileURLToPath(import.meta.url));
const plan = JSON.parse(readFileSync(join(evidenceRoot, 'plan.json'), 'utf8'));
const trialRoot = resolve('D:/JOEWRKS/JOENESS-Animal-Planning-AB-20260928');
const sourceRoot = resolve(plan.snapshotSource);
const harnessRoot = resolve('D:/JOEWRKS/작업하네스');
const binary = process.env.JOENESS_EVAL_CODEX_BIN;
const authSource = resolve(process.env.USERPROFILE, '.codex/auth.json');
const hash = value => createHash('sha256').update(value).digest('hex');

if (plan.status !== 'PRE_REGISTERED' || plan.order.join(',') !== 'bare-plan,joeness-plan,joeness-handoff,bare-handoff') throw new Error('Plan mismatch');
if (!binary || !existsSync(binary) || !existsSync(authSource)) throw new Error('Missing runtime or login input');
if (existsSync(trialRoot)) throw new Error('Trial root already exists; refusing rerun or overwrite');

function command(exe, args, cwd, env = process.env) {
  return new Promise((done, fail) => {
    const child = spawn(exe, args, { cwd, env, windowsHide: true });
    child.stdin.end();
    let output = '';
    child.stdout.on('data', b => { output += b.toString(); });
    child.stderr.on('data', b => { output += b.toString(); });
    child.on('error', fail);
    child.on('close', code => code === 0 ? done(output) : fail(new Error(`${exe} exited ${code}: ${output.slice(-2000)}`)));
  });
}

async function prepare() {
  const inventory = [];
  for (const arm of ['bare', 'joeness']) {
    const project = join(trialRoot, 'projects', arm);
    for (const relative of plan.sourceFiles) {
      const source = join(sourceRoot, relative);
      if (!existsSync(source)) throw new Error(`Missing source ${relative}`);
      const original = readFileSync(source);
      let contents = original;
      if (relative.endsWith('.md')) {
        let text = original.toString('utf8');
        text = text.replaceAll('D:\\JOEWRKS\\MergeDrop', '.');
        text = text.replaceAll('D:/JOEWRKS/MergeDrop', '.');
        if (relative === 'AGENTS.md' && arm === 'bare') {
          const pattern = /\r?\n<!-- JOENESS-SETUP:BEGIN -->[\s\S]*?<!-- JOENESS-SETUP:END -->\r?\n/;
          if (!pattern.test(text)) throw new Error('Missing project setup block');
          text = text.replace(pattern, '\n');
        }
        contents = Buffer.from(text);
      }
      const target = join(project, relative);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, contents);
      inventory.push({ arm, path: relative, sourceSha256: hash(original), fixtureSha256: hash(contents) });
    }
    if (arm === 'joeness') {
      const relative = '.joeness/setup-state.json';
      const source = join(sourceRoot, relative);
      const original = readFileSync(source);
      const target = join(project, relative);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, original);
      inventory.push({ arm, path: relative, sourceSha256: hash(original), fixtureSha256: hash(original) });
    }
    await command('git', ['init', '-q'], project);
    await command('git', ['add', '.'], project);
    await command('git', ['-c', 'user.name=JOENESS Eval', '-c', 'user.email=eval@invalid.local', 'commit', '-qm', 'Frozen planning fixture'], project);
  }
  mkdirSync(join(trialRoot, 'homes', 'bare'), { recursive: true });
  mkdirSync(join(trialRoot, 'homes', 'joeness'), { recursive: true });
  const apply = await command('pwsh', ['-NoProfile', '-File', join(harnessRoot, 'JOENESS.ps1'), '-Apply', '-CodexHome', join(trialRoot, 'homes', 'joeness')], harnessRoot);
  const check = await command('pwsh', ['-NoProfile', '-File', join(harnessRoot, 'JOENESS.ps1'), '-Check', '-CodexHome', join(trialRoot, 'homes', 'joeness')], harnessRoot);
  writeFileSync(join(evidenceRoot, 'fixture-inventory.json'), JSON.stringify({ trialRoot, sourceRoot, inventory, installation: { apply: apply.trim(), check: check.trim() } }, null, 2) + '\n');
  for (const arm of ['bare', 'joeness']) copyFileSync(authSource, join(trialRoot, 'homes', arm, 'auth.json'));
}

async function runOne(id) {
  const [arm, stage] = id.split('-');
  const project = join(trialRoot, 'projects', arm);
  const home = join(trialRoot, 'homes', arm);
  const prompt = plan.prompts[stage];
  const responsePath = join(evidenceRoot, 'responses', `${id}.md`);
  const resultPath = join(evidenceRoot, 'results', `${id}.json`);
  if (existsSync(responsePath) || existsSync(resultPath)) throw new Error(`Refusing rerun ${id}`);
  const statusBefore = (await command('git', ['status', '--porcelain=v1', '--untracked-files=all'], project)).trim();
  const args = ['exec', '--ephemeral', '--ignore-user-config', '-m', 'gpt-6-astra', '-c', 'model_reasoning_effort="xhigh"', '-c', 'approval_policy="never"', '-s', 'workspace-write', '-C', project, '--json', '-o', responsePath, '--', prompt];
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
      if (event.type === 'item.started') itemTypeCounts[event.item?.type || 'unknown'] = (itemTypeCounts[event.item?.type || 'unknown'] || 0) + 1;
    } catch { /* Non-JSON progress and stderr are not retained. */ }
  }
  const startedAt = new Date().toISOString();
  const started = performance.now();
  console.log(`START ${id}`);
  const child = spawn(binary, args, { cwd: project, env: { ...process.env, CODEX_HOME: home }, windowsHide: true });
  child.stdin.end();
  child.stdout.on('data', b => {
    buffer += b.toString();
    let index;
    while ((index = buffer.indexOf('\n')) >= 0) { collect(buffer.slice(0, index)); buffer = buffer.slice(index + 1); }
  });
  child.stderr.on('data', () => {});
  const exitCode = await new Promise((done, fail) => { child.on('error', fail); child.on('close', done); });
  collect(buffer);
  const wallMs = Math.round(performance.now() - started);
  const statusAfter = (await command('git', ['status', '--porcelain=v1', '--untracked-files=all'], project)).trim();
  const response = existsSync(responsePath) ? readFileSync(responsePath) : null;
  const result = { id, startedAt, wallMs, exitCode, runtime: { binary, model: 'gpt-6-astra', reasoningEffort: 'xhigh', threadId }, promptSha256: hash(prompt), responseSha256: response ? hash(response) : null, usage, derived: usage ? { noncachedInput: usage.input_tokens - usage.cached_input_tokens, inputPlusOutput: usage.input_tokens + usage.output_tokens, noncachedInputPlusOutput: usage.input_tokens - usage.cached_input_tokens + usage.output_tokens } : null, eventCounts, itemTypeCounts, lastError, statusBefore, statusAfter };
  writeFileSync(resultPath, JSON.stringify(result, null, 2) + '\n');
  console.log(`END ${id} code=${exitCode} wallMs=${wallMs} input=${usage?.input_tokens ?? '?'} cached=${usage?.cached_input_tokens ?? '?'} output=${usage?.output_tokens ?? '?'}`);
  if (exitCode !== 0 || !usage || !response) throw new Error(`Incomplete run ${id}; preserve evidence`);
}

mkdirSync(join(evidenceRoot, 'responses'), { recursive: true });
mkdirSync(join(evidenceRoot, 'results'), { recursive: true });
let prepared = false;
try {
  await prepare();
  prepared = true;
  for (const id of plan.order) await runOne(id);
} finally {
  // Remove only the two exact temporary login copies inside the known trial root.
  for (const arm of ['bare', 'joeness']) {
    const target = join(trialRoot, 'homes', arm, 'auth.json');
    if (!target.startsWith(join(trialRoot, 'homes') + '\\')) throw new Error('Unsafe cleanup target');
    if (existsSync(target)) rmSync(target);
  }
  writeFileSync(join(evidenceRoot, 'cleanup.json'), JSON.stringify({ prepared, sourceAuthExists: existsSync(authSource), bareCopyExists: existsSync(join(trialRoot, 'homes', 'bare', 'auth.json')), joenessCopyExists: existsSync(join(trialRoot, 'homes', 'joeness', 'auth.json')) }, null, 2) + '\n');
}
