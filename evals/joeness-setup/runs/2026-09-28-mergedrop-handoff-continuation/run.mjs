// Frozen continuation of the prior real-code A/B. Raw rollouts and credentials are not retained.
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const plan = JSON.parse(readFileSync(join(root, 'plan.json'), 'utf8'));
const trial = resolve(plan.trialRoot);
const prior = resolve(plan.sourceTrialRoot);
const harness = resolve(root, '../../../../');
const cli = process.env.JOENESS_EVAL_CODEX_BIN;
const auth = join(process.env.USERPROFILE || '', '.codex', 'auth.json');
const hash = data => createHash('sha256').update(data).digest('hex');

function childPath(...parts) {
  const path = resolve(trial, ...parts);
  const relativePath = relative(trial, path);
  if (!relativePath || relativePath === '..' || relativePath.startsWith('..\\') || relativePath.startsWith('../')) {
    throw new Error(`Path outside trial: ${path}`);
  }
  return path;
}

async function command(file, args, cwd, env = process.env) {
  return await new Promise((done, fail) => {
    const process = spawn(file, args, { cwd, env, windowsHide: true });
    process.stdin.end();
    let output = '';
    process.stdout.on('data', chunk => { output += chunk.toString(); });
    process.stderr.on('data', chunk => { output += chunk.toString(); });
    process.on('error', fail);
    process.on('close', code => code === 0 ? done(output) : fail(new Error(`${file} exited ${code}: ${output.slice(-1500)}`)));
  });
}

async function prepare() {
  if (existsSync(trial)) throw new Error(`Trial already exists; refusing overwrite: ${trial}`);
  if (plan.status !== 'PRE_REGISTERED') throw new Error('Plan is not preregistered');
  const manifest = JSON.parse(readFileSync(join(harness, 'vendor/source-manifest.json'), 'utf8'));
  const coreHash = hash(readFileSync(join(harness, 'astra-judgment-core.md')));
  const skillHash = hash(readFileSync(join(harness, 'skills/joeness-setup/SKILL.md')));
  const expectedSkill = manifest.publicSkills.find(item => item.name === 'joeness-setup')?.files.find(item => item.path === 'SKILL.md')?.sha256;
  if (coreHash !== manifest.activeCommonCore.sha256 || skillHash !== expectedSkill) throw new Error('Package hash drift');
  const inventory = [];
  mkdirSync(trial, { recursive: true });
  for (const arm of ['bare', 'joeness']) {
    const source = join(prior, 'runs', `deferred-ranking-auth-r1-${arm}`, 'project');
    const sourceResult = JSON.parse(readFileSync(join(harness, 'evals/joeness-setup/runs/2026-09-28-actual-performance-ab/results', `deferred-ranking-auth-r1-${arm}.json`), 'utf8'));
    if (!existsSync(source) || sourceResult.exitCode !== 0 || !sourceResult.authCopyRemoved) throw new Error(`Prior source unavailable: ${arm}`);
    const project = childPath(arm, 'project');
    const home = childPath(arm, 'home');
    mkdirSync(dirname(project), { recursive: true });
    cpSync(source, project, { recursive: true });
    mkdirSync(home, { recursive: true });
    const priorHead = (await command('git', ['rev-parse', 'HEAD'], project)).trim();
    if (priorHead !== sourceResult.headAfter) throw new Error(`Prior HEAD drift: ${arm}`);
    const priorDiff = (await command('git', ['diff', '--name-only'], project)).trim().split(/\r?\n/).filter(Boolean);
    const allowed = new Set(['TASK.md', 'game/Assets/MergeDrop/Art/UI/SettingsIcon.png.meta',
      'game/Assets/MergeDrop/Scripts/Platform/PlayGamesLeaderboard.cs',
      'game/Assets/MergeDrop/Scripts/Runtime/GameController.cs',
      'game/Assets/MergeDrop/Tests/EditMode/GameControllerStateTests.cs',
      'game/Assets/MergeDrop/Tests/EditMode/PlayGamesLeaderboardTests.cs',
      'game/ProjectSettings/TimeManager.asset']);
    if (priorDiff.some(file => !allowed.has(file))) throw new Error(`Unexpected prior diff: ${arm}: ${priorDiff.join(', ')}`);
    // Freeze only the prior agent's meaningful work. Unity's line-ending-only metadata drift remains unstaged.
    const meaningful = priorDiff.filter(file => file !== 'game/Assets/MergeDrop/Art/UI/SettingsIcon.png.meta' && file !== 'game/ProjectSettings/TimeManager.asset');
    if (!meaningful.includes('game/Assets/MergeDrop/Scripts/Runtime/GameController.cs')) throw new Error(`Previous repair missing: ${arm}`);
    await command('git', ['add', '--', ...meaningful], project);
    await command('git', ['-c', 'user.name=JOENESS Eval', '-c', 'user.email=eval@invalid.local', 'commit', '-qm', 'Freeze previous authentication repair for independent continuation'], project);
    if (arm === 'joeness') {
      const apply = await command('pwsh', ['-NoProfile', '-File', join(harness, 'JOENESS.ps1'), '-Apply', '-CodexHome', home], harness);
      const check = await command('pwsh', ['-NoProfile', '-File', join(harness, 'JOENESS.ps1'), '-Check', '-CodexHome', home], harness);
      if (!apply.includes('"status":"current"') || !check.includes('"status":"current"')) throw new Error('Isolated JOENESS install failed');
    }
    const setupState = arm === 'joeness' ? JSON.parse(await command('pwsh', ['-NoProfile', '-File', join(harness, 'skills/joeness-setup/scripts/project-setup.ps1'), '-Check', '-ProjectPath', project], harness)) : null;
    if (arm === 'joeness' && (setupState.status !== 'current' || setupState.blockState !== 'clean')) throw new Error('Copied setup state not clean');
    inventory.push({ arm, source, priorThreadId: sourceResult.runtime.threadId, priorHead, frozenHead: (await command('git', ['rev-parse', 'HEAD'], project)).trim(),
      priorResponseSha256: sourceResult.responseSha256, agentsSha256: hash(readFileSync(join(project, 'AGENTS.md'))), setupStatus: setupState?.status || 'absent',
      baselineStatus: (await command('git', ['status', '--porcelain=v1'], project)).trim() });
    console.log(`PREPARED ${arm}`);
  }
  writeFileSync(join(root, 'inventory.json'), JSON.stringify({ coreHash, skillHash, inventory }, null, 2) + '\n');
}

async function run(id) {
  if (!plan.sequence.includes(id)) throw new Error(`Unregistered run: ${id}`);
  if (!cli || !existsSync(cli) || !existsSync(auth)) throw new Error('CLI or login unavailable');
  const [stage, arm] = id.split('-');
  const project = childPath(arm, 'project');
  const home = childPath(arm, 'home');
  const authCopy = childPath(arm, 'home', 'auth.json');
  const responsePath = join(root, 'responses', `${id}.md`);
  const resultPath = join(root, 'results', `${id}.json`);
  if (!existsSync(project) || !existsSync(home) || existsSync(authCopy) || existsSync(responsePath) || existsSync(resultPath)) throw new Error(`Fixture absent or run already attempted: ${id}`);
  if (stage === 'handoff' && !existsSync(join(root, 'results', `continue-${arm}.json`))) throw new Error(`Continuation result missing: ${arm}`);
  const prompt = plan.prompts[stage];
  const before = (await command('git', ['status', '--porcelain=v1', '--untracked-files=all'], project)).trim();
  const headBefore = (await command('git', ['rev-parse', 'HEAD'], project)).trim();
  const args = ['exec', '--ephemeral', '--ignore-user-config', '-m', plan.runtime.model,
    '-c', `model_reasoning_effort="${plan.runtime.reasoningEffort}"`, '-c', 'approval_policy="never"', '-s', 'danger-full-access',
    '-C', project, '--json', '-o', responsePath, '--', prompt];
  let buffer = '', threadId = null, usage = null, lastError = null, exitCode = null, timedOut = false;
  const itemTypes = {};
  function collect(line) {
    if (!line.trim()) return;
    try {
      const event = JSON.parse(line);
      if (event.type === 'thread.started') threadId = event.thread_id || null;
      if (event.type === 'turn.completed') usage = event.usage || null;
      if (event.type === 'turn.failed' || event.type === 'error') lastError = event.message || event.error || event.type;
      if (event.type === 'item.started') {
        const type = event.item?.type || 'unknown';
        itemTypes[type] = (itemTypes[type] || 0) + 1;
      }
    } catch { /* Do not retain raw rollout or stderr. */ }
  }
  mkdirSync(dirname(responsePath), { recursive: true });
  mkdirSync(dirname(resultPath), { recursive: true });
  const startedAt = new Date().toISOString();
  const start = performance.now();
  copyFileSync(auth, authCopy);
  console.log(`START ${id}`);
  try {
    const child = spawn(cli, args, { cwd: project, env: { ...process.env, CODEX_HOME: home }, windowsHide: true });
    child.stdin.end();
    child.stdout.on('data', chunk => {
      buffer += chunk.toString();
      let index;
      while ((index = buffer.indexOf('\n')) >= 0) { collect(buffer.slice(0, index)); buffer = buffer.slice(index + 1); }
    });
    child.stderr.on('data', () => {});
    const timer = setTimeout(() => { timedOut = true; child.kill(); }, plan.runtime.sessionTimeoutMs);
    try { exitCode = await new Promise((done, fail) => { child.on('error', fail); child.on('close', done); }); }
    finally { clearTimeout(timer); }
    collect(buffer);
  } finally {
    if (existsSync(authCopy)) rmSync(authCopy);
  }
  const after = (await command('git', ['status', '--porcelain=v1', '--untracked-files=all'], project)).trim();
  const response = existsSync(responsePath) ? readFileSync(responsePath) : null;
  const record = { id, arm, stage, startedAt, wallMs: Math.round(performance.now() - start), exitCode, timedOut,
    runtime: { cli, model: plan.runtime.model, reasoningEffort: plan.runtime.reasoningEffort, threadId },
    promptSha256: hash(prompt), responseSha256: response ? hash(response) : null, usage,
    noncachedInputPlusOutput: usage ? usage.input_tokens - usage.cached_input_tokens + usage.output_tokens : null,
    itemTypes, lastError, statusBefore: before, statusAfter: after, headBefore,
    headAfter: (await command('git', ['rev-parse', 'HEAD'], project)).trim(), authCopyRemoved: !existsSync(authCopy) };
  writeFileSync(resultPath, JSON.stringify(record, null, 2) + '\n');
  console.log(`END ${id} exit=${exitCode} timeout=${timedOut} wallMs=${record.wallMs} input=${usage?.input_tokens ?? '?'} output=${usage?.output_tokens ?? '?'}`);
  if (exitCode !== 0 || timedOut || !usage || !response) throw new Error(`Incomplete run; preserve evidence: ${id}`);
}

if (process.argv[2] === 'prepare') await prepare();
else if (process.argv[2] === 'one') await run(process.argv[3]);
else throw new Error('Usage: node run.mjs prepare|one <stage-arm>');
