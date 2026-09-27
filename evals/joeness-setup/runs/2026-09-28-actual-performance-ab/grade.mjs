// Independently grade a completed coding run with the hidden historical oracle.
// Oracle source is overlaid only after the agent has finished and restored afterward.
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gradeTestResults, parseNUnitCases, parseRunId } from './protocol.mjs';

const evidenceRoot = dirname(fileURLToPath(import.meta.url));
const plan = JSON.parse(readFileSync(join(evidenceRoot, 'plan.json'), 'utf8'));
const trialRoot = resolve(plan.trialRoot);
const sourceRoot = resolve(plan.sourceRepository);
const unity = 'C:\\Program Files\\Unity\\Hub\\Editor\\6000.3.21f1\\Editor\\Unity.exe';
const sha256 = value => createHash('sha256').update(value).digest('hex');

function underTrial(path) {
  const target = resolve(path);
  const part = relative(trialRoot, target);
  if (!part || part === '..' || part.startsWith('..\\') || part.startsWith('../')) throw new Error(`Not an exact trial child: ${path}`);
  return target;
}

async function processRun(file, args, cwd, capture = false) {
  return await new Promise((done, fail) => {
    const child = spawn(file, args, { cwd, windowsHide: true });
    child.stdin.end();
    const chunks = [];
    child.stdout.on('data', chunk => { if (capture) chunks.push(chunk); });
    child.stderr.on('data', chunk => { if (capture) chunks.push(chunk); });
    child.on('error', fail);
    child.on('close', code => done({ code, output: Buffer.concat(chunks) }));
  });
}

async function gitText(project, args) {
  const run = await processRun('git', args, project, true);
  if (run.code !== 0) throw new Error(`git failed: ${args.join(' ')} ${run.output.toString('utf8').slice(-500)}`);
  return run.output.toString('utf8');
}

async function unityTest(game, filter, xml, log) {
  const args = ['-batchmode', '-nographics', '-runTests', '-testPlatform', 'EditMode', '-projectPath', game,
    '-testResults', xml, '-logFile', log];
  if (filter) args.push('-testFilter', filter);
  const start = performance.now();
  const outcome = await processRun(unity, args, game);
  return { exitCode: outcome.code, wallMs: Math.round(performance.now() - start), xmlExists: existsSync(xml) };
}

async function grade(id) {
  if (!plan.runOrder.includes(id)) throw new Error(`Unregistered run: ${id}`);
  if (!existsSync(unity)) throw new Error('Unity runtime missing');
  const caseId = parseRunId(id).caseId;
  const item = plan.cases.find(candidate => candidate.id === caseId);
  const project = underTrial(join(trialRoot, 'runs', id, 'project'));
  const game = underTrial(join(project, 'game'));
  const resultPath = join(evidenceRoot, 'results', `${id}.json`);
  const gradePath = join(evidenceRoot, 'grades', `${id}.json`);
  const gradeRoot = underTrial(join(trialRoot, 'grades', id));
  if (!existsSync(resultPath) || existsSync(gradePath) || existsSync(gradeRoot)) throw new Error('Run absent or grade already started');
  const result = JSON.parse(readFileSync(resultPath, 'utf8'));
  if (result.exitCode !== 0 || result.timedOut || !result.usage || !result.authCopyRemoved) throw new Error('Agent run incomplete');
  const head = (await gitText(project, ['rev-parse', 'HEAD'])).trim();
  if (head !== result.headAfter) throw new Error('Agent fixture HEAD drift');
  const status = (await gitText(project, ['status', '--porcelain=v1', '--untracked-files=all'])).trim();
  if (status !== result.statusAfter) throw new Error('Agent fixture status drift');
  const greenFull = underTrial(join(trialRoot, 'preflight', caseId, 'green-full-results.xml'));
  const greenBytes = readFileSync(greenFull);
  if (sha256(greenBytes) !== item.baselineFullResultSha256) throw new Error('Baseline XML hash drift');

  mkdirSync(gradeRoot, { recursive: true });
  const oraclePath = join(project, item.oracleFile);
  const original = existsSync(oraclePath) ? readFileSync(oraclePath) : null;
  const oracleRun = await processRun('git', ['-C', sourceRoot, 'show', `${item.fixCommit}:${item.oracleFile}`], sourceRoot, true);
  if (oracleRun.code !== 0) throw new Error('Historical oracle unavailable');
  const focusedXml = join(gradeRoot, 'focused.xml');
  const fullXml = join(gradeRoot, 'full.xml');
  const oracleNames = parseNUnitCases(readFileSync(underTrial(join(trialRoot, 'preflight', caseId, 'green-results.xml')), 'utf8'))
    .map(test => test.fullname);
  let focusedRun;
  let fullRun;
  try {
    writeFileSync(oraclePath, oracleRun.output);
    focusedRun = await unityTest(game, item.oracleFilter, focusedXml, join(gradeRoot, 'focused.log'));
    fullRun = await unityTest(game, null, fullXml, join(gradeRoot, 'full.log'));
  } finally {
    if (original === null) rmSync(oraclePath);
    else writeFileSync(oraclePath, original);
  }
  const statusRestored = (await gitText(project, ['status', '--porcelain=v1', '--untracked-files=all'])).trim() === status;
  if (!focusedRun.xmlExists || !fullRun.xmlExists || !statusRestored) throw new Error('Verification infrastructure failed; inspect external grade artifacts');
  const focusedBytes = readFileSync(focusedXml);
  const fullBytes = readFileSync(fullXml);
  const focusedCases = parseNUnitCases(focusedBytes.toString('utf8'));
  const fullCases = parseNUnitCases(fullBytes.toString('utf8'));
  const baselineCases = parseNUnitCases(greenBytes.toString('utf8'));
  const outcome = gradeTestResults(focusedCases, fullCases, baselineCases, oracleNames);
  const record = { id, caseId, agentResultSha256: sha256(readFileSync(resultPath)), oracleSourceSha256: sha256(oracleRun.output),
    originalOracleFileSha256: original === null ? null : sha256(original), baselineFullResultSha256: sha256(greenBytes),
    oracleNames, focused: { ...focusedRun, resultSha256: sha256(focusedBytes), cases: focusedCases.length },
    full: { ...fullRun, resultSha256: sha256(fullBytes), cases: fullCases.length,
      passed: fullCases.filter(test => test.result === 'Passed').length, failed: fullCases.filter(test => test.result === 'Failed').length },
    outcome, statusRestored };
  mkdirSync(dirname(gradePath), { recursive: true });
  writeFileSync(gradePath, JSON.stringify(record, null, 2) + '\n');
  console.log(`GRADE ${id} ${outcome.pass ? 'PASS' : 'FAIL'} focused=${focusedCases.length} full=${record.full.passed}/${fullCases.length} newFailures=${outcome.newFailures.length}`);
}

if (process.argv.length !== 3) throw new Error('Usage: node grade.mjs <run-id>');
await grade(process.argv[2]);
