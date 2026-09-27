// Prepare isolated historical Unity fixtures and run the preregistered coding A/B.
// No raw model rollout, credentials, or Unity logs are written to this repository.
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeHistoricalInstructions, parseRunId, tallyUsage } from './protocol.mjs';

const evidenceRoot = dirname(fileURLToPath(import.meta.url));
const plan = JSON.parse(readFileSync(join(evidenceRoot, 'plan.json'), 'utf8'));
const trialRoot = resolve(plan.trialRoot);
const sourceRoot = resolve(plan.sourceRepository);
const harnessRoot = resolve(plan.harnessRepository);
const binary = process.env.JOENESS_EVAL_CODEX_BIN;
const authSource = resolve(process.env.USERPROFILE || '', '.codex/auth.json');
const textExtensions = new Set(['.md', '.txt', '.json', '.cs', '.ps1', '.mjs', '.js', '.xml', '.yaml', '.yml', '.asmdef', '.unity', '.prefab', '.asset']);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

function insideTrial(path) {
  const part = relative(trialRoot, resolve(path));
  if (!part || part === '..' || part.startsWith('..\\') || part.startsWith('../') || part.startsWith('\\') || part.startsWith('/')) throw new Error(`Unsafe trial path: ${path}`);
  return resolve(path);
}

async function command(file, args, cwd, env = process.env) {
  return await new Promise((done, fail) => {
    const child = spawn(file, args, { cwd, env, windowsHide: true });
    child.stdin.end();
    let output = '';
    child.stdout.on('data', chunk => { output += chunk.toString(); });
    child.stderr.on('data', chunk => { output += chunk.toString(); });
    child.on('error', fail);
    child.on('close', code => code === 0 ? done(output) : fail(new Error(`${file} exited ${code}: ${output.slice(-2000)}`)));
  });
}

function walk(dir, visit) {
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, item.name);
    if (item.isDirectory()) walk(path, visit);
    else if (item.isFile()) visit(path);
  }
}

function neutralizeTemplate(root) {
  walk(root, path => {
    if (!textExtensions.has(extname(path).toLowerCase()) && !path.endsWith('AGENTS.md')) return;
    const raw = readFileSync(path);
    if (raw.includes(0)) return;
    let text = raw.toString('utf8');
    if (path === join(root, 'AGENTS.md')) text = normalizeHistoricalInstructions(text);
    else text = text.replaceAll('D:\\JOEWRKS\\MergeDrop', '.').replaceAll('D:/JOEWRKS/MergeDrop', '.');
    if (text !== raw.toString('utf8')) writeFileSync(path, text);
  });
}

function packageHashes() {
  const manifest = JSON.parse(readFileSync(join(harnessRoot, 'vendor/source-manifest.json'), 'utf8'));
  const core = hash(readFileSync(join(harnessRoot, 'astra-judgment-core.md')));
  const skill = hash(readFileSync(join(harnessRoot, 'skills/joeness-setup/SKILL.md')));
  const expectedSkill = manifest.publicSkills.find(item => item.name === 'joeness-setup')?.files.find(item => item.path === 'SKILL.md')?.sha256;
  if (core !== manifest.activeCommonCore.sha256 || skill !== expectedSkill) throw new Error('Active JOENESS source hash drift');
  return { core, skill };
}

async function prepareTemplates() {
  const root = insideTrial(join(trialRoot, 'templates'));
  if (existsSync(root)) throw new Error('Templates already exist; refusing overwrite');
  mkdirSync(root, { recursive: true });
  for (const item of plan.cases) {
    const target = insideTrial(join(root, item.id));
    mkdirSync(target, { recursive: true });
    const tarPath = insideTrial(join(root, `${item.id}.tar`));
    await command('git', ['-C', sourceRoot, 'archive', '--format=tar', `--output=${tarPath}`, item.baseCommit], sourceRoot);
    await command('tar', ['-xf', tarPath, '-C', target], target);
    rmSync(tarPath);
    neutralizeTemplate(target);
    console.log(`TEMPLATE ${item.id} ${item.baseCommit}`);
  }
}

function setupBlock() {
  const liveAgents = readFileSync(join(sourceRoot, 'AGENTS.md'), 'utf8');
  const match = /<!-- JOENESS-SETUP:BEGIN -->[\s\S]*?<!-- JOENESS-SETUP:END -->/.exec(liveAgents);
  if (!match) throw new Error('Current project setup block missing');
  const stateBytes = readFileSync(join(sourceRoot, '.joeness/setup-state.json'));
  const state = JSON.parse(stateBytes.toString('utf8'));
  if (hash(Buffer.from(match[0])) !== state.appliedBlockSha256) throw new Error('Current project setup block hash drift');
  return { block: match[0], stateBytes };
}

async function prepareRuns() {
  const runsRoot = insideTrial(join(trialRoot, 'runs'));
  if (existsSync(runsRoot)) throw new Error('Runs already exist; refusing overwrite');
  const { block, stateBytes } = setupBlock();
  const packageIdentity = packageHashes();
  const inventory = [];
  mkdirSync(runsRoot, { recursive: true });
  for (const id of plan.runOrder) {
    const identity = parseRunId(id);
    const item = plan.cases.find(candidate => candidate.id === identity.caseId);
    if (!item) throw new Error(`Unknown case: ${id}`);
    const template = insideTrial(join(trialRoot, 'templates', item.id));
    if (!existsSync(join(template, 'game', 'Library'))) throw new Error(`Template not imported: ${item.id}`);
    const runRoot = insideTrial(join(runsRoot, id));
    const project = insideTrial(join(runRoot, 'project'));
    const home = insideTrial(join(runRoot, 'home'));
    mkdirSync(runRoot, { recursive: true });
    cpSync(template, project, { recursive: true });
    mkdirSync(home, { recursive: true });
    if (identity.arm === 'joeness') {
      const agents = join(project, 'AGENTS.md');
      writeFileSync(agents, readFileSync(agents, 'utf8').trimEnd() + '\n\n' + block + '\n');
      mkdirSync(join(project, '.joeness'), { recursive: true });
      writeFileSync(join(project, '.joeness/setup-state.json'), stateBytes);
      const apply = await command('pwsh', ['-NoProfile', '-File', join(harnessRoot, 'JOENESS.ps1'), '-Apply', '-CodexHome', home], harnessRoot);
      const check = await command('pwsh', ['-NoProfile', '-File', join(harnessRoot, 'JOENESS.ps1'), '-Check', '-CodexHome', home], harnessRoot);
      if (!apply.includes('"status":"current"') || !check.includes('"status":"current"')) throw new Error(`JOENESS install not current: ${id}`);
    }
    await command('git', ['init', '-q'], project);
    await command('git', ['add', '.'], project);
    await command('git', ['-c', 'user.name=JOENESS Eval', '-c', 'user.email=eval@invalid.local', 'commit', '-qm', 'Frozen historical task fixture'], project);
    const head = (await command('git', ['rev-parse', 'HEAD'], project)).trim();
    inventory.push({ id, caseId: item.id, baseCommit: item.baseCommit, arm: identity.arm, project, home, head, agentsSha256: hash(readFileSync(join(project, 'AGENTS.md'))) });
    console.log(`PREPARED ${id}`);
  }
  writeFileSync(join(evidenceRoot, 'fixture-inventory.json'), JSON.stringify({ packageIdentity, inventory }, null, 2) + '\n');
}

async function runOne(id) {
  if (!binary || !existsSync(binary) || !existsSync(authSource)) throw new Error('Missing CLI or login input');
  if (!plan.runOrder.includes(id)) throw new Error(`Run not preregistered: ${id}`);
  packageHashes();
  const identity = parseRunId(id);
  const item = plan.cases.find(candidate => candidate.id === identity.caseId);
  const runRoot = insideTrial(join(trialRoot, 'runs', id));
  const project = insideTrial(join(runRoot, 'project'));
  const home = insideTrial(join(runRoot, 'home'));
  const authCopy = insideTrial(join(home, 'auth.json'));
  const response = join(evidenceRoot, 'responses', `${id}.md`);
  const result = join(evidenceRoot, 'results', `${id}.json`);
  if (!existsSync(project) || !existsSync(home)) throw new Error(`Fixture missing: ${id}`);
  if (existsSync(response) || existsSync(result) || existsSync(authCopy)) throw new Error(`Refusing rerun or stale auth: ${id}`);
  const statusBefore = (await command('git', ['status', '--porcelain=v1', '--untracked-files=all'], project)).trim();
  if (statusBefore) throw new Error(`Fixture not clean: ${id} ${statusBefore.slice(0, 1000)}`);
  const headBefore = (await command('git', ['rev-parse', 'HEAD'], project)).trim();
  const prompt = `${plan.commonPrompt}\n\n오류: ${item.prompt}`;
  const args = ['exec', '--ephemeral', '--ignore-user-config', '-m', 'gpt-6-astra', '-c', 'model_reasoning_effort="xhigh"', '-c', 'approval_policy="never"', '-s', 'danger-full-access', '-C', project, '--json', '-o', response, '--', prompt];
  let threadId = null;
  let usage = null;
  let lastError = null;
  let buffer = '';
  const eventCounts = {};
  const itemTypeCounts = {};
  const commands = [];
  function collect(line) {
    if (!line.trim()) return;
    try {
      const event = JSON.parse(line);
      eventCounts[event.type] = (eventCounts[event.type] || 0) + 1;
      if (event.type === 'thread.started') threadId = event.thread_id || null;
      if (event.type === 'turn.completed') usage = event.usage || null;
      if (event.type === 'turn.failed' || event.type === 'error') lastError = event.message || event.error || event.type;
      if (event.type === 'item.started') {
        const type = event.item?.type || 'unknown';
        itemTypeCounts[type] = (itemTypeCounts[type] || 0) + 1;
        if (type === 'command_execution' && typeof event.item?.command === 'string') commands.push(event.item.command.slice(0, 2000));
      }
    } catch { /* Neither malformed progress nor raw output is stored. */ }
  }
  mkdirSync(dirname(response), { recursive: true });
  mkdirSync(dirname(result), { recursive: true });
  let exitCode = null;
  let timedOut = false;
  const startedAt = new Date().toISOString();
  const start = performance.now();
  copyFileSync(authSource, authCopy);
  console.log(`START ${id}`);
  try {
    const child = spawn(binary, args, { cwd: project, env: { ...process.env, CODEX_HOME: home }, windowsHide: true });
    child.stdin.end();
    child.stdout.on('data', chunk => {
      buffer += chunk.toString();
      let index;
      while ((index = buffer.indexOf('\n')) >= 0) { collect(buffer.slice(0, index)); buffer = buffer.slice(index + 1); }
    });
    child.stderr.on('data', () => {});
    const timer = setTimeout(() => { timedOut = true; child.kill(); }, plan.runtime.sessionTimeoutMs);
    try {
      exitCode = await new Promise((done, fail) => { child.on('error', fail); child.on('close', done); });
    } finally { clearTimeout(timer); }
    collect(buffer);
  } finally {
    if (existsSync(authCopy)) rmSync(authCopy);
  }
  const wallMs = Math.round(performance.now() - start);
  const statusAfter = (await command('git', ['status', '--porcelain=v1', '--untracked-files=all'], project)).trim();
  const headAfter = (await command('git', ['rev-parse', 'HEAD'], project)).trim();
  const responseBytes = existsSync(response) ? readFileSync(response) : null;
  const record = { id, identity, startedAt, wallMs, exitCode, timedOut, runtime: { cli: binary, model: plan.runtime.model, reasoningEffort: plan.runtime.reasoningEffort, threadId }, promptSha256: hash(prompt), responseSha256: responseBytes ? hash(responseBytes) : null, usage, derived: usage ? tallyUsage([usage]) : null, eventCounts, itemTypeCounts, commands, lastError, statusBefore, statusAfter, headBefore, headAfter, authCopyRemoved: !existsSync(authCopy) };
  writeFileSync(result, JSON.stringify(record, null, 2) + '\n');
  console.log(`END ${id} exit=${exitCode} timeout=${timedOut} wallMs=${wallMs} input=${usage?.input_tokens ?? '?'} cached=${usage?.cached_input_tokens ?? '?'} output=${usage?.output_tokens ?? '?'}`);
  if (exitCode !== 0 || timedOut || !usage || !responseBytes) throw new Error(`Run incomplete; preserve evidence: ${id}`);
}

const mode = process.argv[2];
if (mode === 'templates') await prepareTemplates();
else if (mode === 'runs') await prepareRuns();
else if (mode === 'one') await runOne(process.argv[3]);
else if (mode === 'all') for (const id of plan.runOrder) await runOne(id);
else throw new Error('Usage: node run.mjs templates|runs|one <id>|all');
