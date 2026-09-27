// Overlay the frozen hidden interaction oracle only after an agent run ends.
// Unity XML/logs remain in the isolated trial root; this repository keeps hashes.
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseNUnitCases, parseRunId } from '../2026-09-28-actual-performance-ab/protocol.mjs';
import { runProcess } from './process-runner.mjs';
import { meaningfulStateRestored, scoreInteraction } from './score.mjs';

const evidenceRoot = dirname(fileURLToPath(import.meta.url));
const plan = JSON.parse(readFileSync(join(evidenceRoot, 'plan.json'), 'utf8'));
const trialRoot = resolve(plan.trialRoot);
const unity = 'C:\\Program Files\\Unity\\Hub\\Editor\\6000.3.21f1\\Editor\\Unity.exe';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

function underTrial(path) {
  const target = resolve(path);
  const part = relative(trialRoot, target);
  if (!part || part === '..' || part.startsWith('..\\') || part.startsWith('../')) throw new Error(`Unsafe trial path: ${path}`);
  return target;
}

async function git(project, args) {
  const result = await runProcess('git', args, project, true);
  if (result.code !== 0) throw new Error(`git failed: ${args.join(' ')} ${result.stderr.slice(-400)}`);
  return result.stdout;
}

async function unityTest(game, platform, filter, xml, log) {
  const args = ['-batchmode', '-nographics', '-runTests', '-testPlatform', platform,
    '-projectPath', game, '-testResults', xml, '-logFile', log];
  if (filter) args.push('-testFilter', filter);
  const start = performance.now();
  const result = await runProcess(unity, args, game);
  return { exitCode: result.code, wallMs: Math.round(performance.now() - start),
    xmlExists: existsSync(xml) };
}

async function grade(id) {
  if (!plan.runOrder.includes(id)) throw new Error(`Unregistered run: ${id}`);
  const item = plan.cases.find(candidate => candidate.id === parseRunId(id).caseId);
  const project = underTrial(join(trialRoot, 'runs', id, 'project'));
  const game = underTrial(join(project, 'game'));
  const gradeRoot = underTrial(join(trialRoot, 'grades', id));
  const gradePath = join(evidenceRoot, 'grades', `${id}.json`);
  const resultPath = join(evidenceRoot, 'results', `${id}.json`);
  if (!item || !existsSync(resultPath) || existsSync(gradeRoot) || existsSync(gradePath))
    throw new Error('Missing run or grade already started');
  const result = JSON.parse(readFileSync(resultPath, 'utf8'));
  if (result.exitCode !== 0 || result.timedOut || !result.usage || !result.authCopyRemoved)
    throw new Error('Agent run incomplete');
  if ((await git(project, ['rev-parse', 'HEAD'])).trim() !== result.headAfter)
    throw new Error('Agent HEAD drift');
  const statusBefore = await git(project, ['status', '--porcelain=v1', '--untracked-files=all']);
  const diffBefore = await git(project, ['diff', '--binary', '--no-ext-diff', '--no-color']);
  const untrackedBefore = await git(project, ['ls-files', '--others', '--exclude-standard']);

  const oracleSource = readFileSync(join(evidenceRoot, 'oracles', item.oracleFile.split('/').at(-1)));
  if (sha(oracleSource) !== item.oracleSha256) throw new Error('Oracle source hash drift');
  const greenName = item.id === 'collection-swipe' ? 'swipe-green.xml' : 'restart-green.xml';
  const greenXml = readFileSync(underTrial(join(trialRoot, greenName)));
  if (sha(greenXml) !== item.preflightGreenSha256) throw new Error('Preflight green XML drift');
  const oracleNames = parseNUnitCases(greenXml.toString('utf8')).map(test => test.fullname);
  const baselineXml = readFileSync(underTrial(join(trialRoot, 'templates', `${item.id}-baseline.xml`)));
  if (sha(baselineXml) !== item.baselineEditModeSha256) throw new Error('Baseline XML drift');

  const target = underTrial(join(project, item.oracleFile));
  const overlays = [target, `${target}.meta`];
  if (item.oracleAssemblyFile) {
    const asmdef = underTrial(join(project, item.oracleAssemblyFile));
    overlays.push(asmdef, `${asmdef}.meta`, underTrial(join(project, 'game/Assets/MergeDrop/Tests/PlayMode.meta')));
  }
  const original = new Map(overlays.map(path => [path, existsSync(path) ? readFileSync(path) : null]));
  const playModeDir = item.oracleAssemblyFile ? underTrial(dirname(target)) : null;
  const hadPlayModeDir = playModeDir && existsSync(playModeDir);
  mkdirSync(dirname(target), { recursive: true });
  mkdirSync(gradeRoot, { recursive: true });
  const focusedXml = underTrial(join(gradeRoot, 'focused.xml'));
  const fullXml = underTrial(join(gradeRoot, 'full-editmode.xml'));
  let focusedRun, fullRun;
  try {
    writeFileSync(target, oracleSource);
    if (item.oracleAssemblyFile) copyFileSync(
      join(evidenceRoot, 'oracles', item.oracleAssemblyFile.split('/').at(-1)),
      join(project, item.oracleAssemblyFile));
    focusedRun = await unityTest(game, item.oraclePlatform, item.oracleFilter,
      focusedXml, underTrial(join(gradeRoot, 'focused.log')));
    fullRun = await unityTest(game, 'EditMode', null,
      fullXml, underTrial(join(gradeRoot, 'full-editmode.log')));
  } finally {
    for (const [path, bytes] of original) {
      if (bytes === null) { if (existsSync(path)) rmSync(path); }
      else writeFileSync(path, bytes);
    }
    if (playModeDir && !hadPlayModeDir && existsSync(playModeDir) && readdirSync(playModeDir).length === 0)
      rmdirSync(playModeDir);
  }
  const statusAfter = await git(project, ['status', '--porcelain=v1', '--untracked-files=all']);
  const diffAfter = await git(project, ['diff', '--binary', '--no-ext-diff', '--no-color']);
  const untrackedAfter = await git(project, ['ls-files', '--others', '--exclude-standard']);
  const restored = meaningfulStateRestored(statusBefore, statusAfter,
    diffBefore, diffAfter, untrackedBefore, untrackedAfter);
  if (!focusedRun.xmlExists || !fullRun.xmlExists || !restored)
    throw new Error('Verification infrastructure failed; inspect preserved external logs');
  const focusedBytes = readFileSync(focusedXml);
  const fullBytes = readFileSync(fullXml);
  const focusedCases = parseNUnitCases(focusedBytes.toString('utf8'));
  const fullCases = parseNUnitCases(fullBytes.toString('utf8'));
  const baselineCases = parseNUnitCases(baselineXml.toString('utf8'));
  const outcome = scoreInteraction(focusedCases, fullCases, baselineCases, oracleNames);
  const record = {
    id, caseId: item.id, agentResultSha256: sha(readFileSync(resultPath)),
    oracleSha256: sha(oracleSource), baselineEditModeSha256: sha(baselineXml),
    oracleNames, focused: { ...focusedRun, resultSha256: sha(focusedBytes),
      passed: focusedCases.filter(test => test.result === 'Passed').length,
      failed: focusedCases.filter(test => test.result === 'Failed').length },
    fullEditMode: { ...fullRun, resultSha256: sha(fullBytes),
      passed: fullCases.filter(test => test.result === 'Passed').length,
      failed: fullCases.filter(test => test.result === 'Failed').length },
    outcome, restored, statusOnlyDrift: statusBefore !== statusAfter && restored
  };
  mkdirSync(dirname(gradePath), { recursive: true });
  writeFileSync(gradePath, JSON.stringify(record, null, 2) + '\n');
  console.log(`GRADE ${id} ${outcome.pass ? 'PASS' : 'FAIL'} focused=${record.focused.passed}/${focusedCases.length} full=${record.fullEditMode.passed}/${fullCases.length}`);
}

if (process.argv.length !== 3) throw new Error('Usage: node grade.mjs <run-id>');
await grade(process.argv[2]);
