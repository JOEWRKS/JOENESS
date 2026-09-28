// Independent Unity grading runs only in disposable copies of completed agent projects.
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gradeTestResults, parseNUnitCases } from '../2026-09-28-actual-performance-ab/protocol.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const plan = JSON.parse(readFileSync(join(root, 'plan.json'), 'utf8'));
const priorPlan = JSON.parse(readFileSync(join(root, '../2026-09-28-actual-performance-ab/plan.json'), 'utf8'));
const trial = resolve(plan.trialRoot);
const prior = resolve(plan.sourceTrialRoot);
const unity = 'C:\\Program Files\\Unity\\Hub\\Editor\\6000.3.21f1\\Editor\\Unity.exe';
const hash = data => createHash('sha256').update(data).digest('hex');

async function command(file, args, cwd) {
  return await new Promise((done, fail) => {
    const child = spawn(file, args, { cwd, windowsHide: true });
    child.stdin.end();
    const stdout = [];
    const stderr = [];
    child.stdout.on('data', chunk => stdout.push(chunk));
    child.stderr.on('data', chunk => stderr.push(chunk));
    child.on('error', fail);
    child.on('close', code => done({ code, stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr) }));
  });
}

async function grade(arm) {
  if (!['bare', 'joeness'].includes(arm)) throw new Error('Usage: node grade.mjs bare|joeness');
  if (!existsSync(unity)) throw new Error('Unity not available');
  const agentRecordPath = join(root, 'results', `continue-${arm}.json`);
  const outputPath = join(root, 'grades', `${arm}.json`);
  const gradeRoot = join(trial, 'grades', arm);
  if (!existsSync(agentRecordPath) || existsSync(outputPath) || existsSync(gradeRoot)) throw new Error('Agent incomplete or grade already attempted');
  const agentRecord = JSON.parse(readFileSync(agentRecordPath, 'utf8'));
  if (agentRecord.exitCode !== 0 || agentRecord.timedOut || !agentRecord.authCopyRemoved) throw new Error('Agent run did not complete');
  const project = join(trial, arm, 'project');
  const gradeProject = join(gradeRoot, 'project');
  mkdirSync(gradeRoot, { recursive: true });
  cpSync(project, gradeProject, { recursive: true });
  const sourceHead = await command('git', ['rev-parse', 'HEAD'], project);
  const copyHead = await command('git', ['rev-parse', 'HEAD'], gradeProject);
  if (sourceHead.code !== 0 || copyHead.code !== 0 || !sourceHead.stdout.equals(copyHead.stdout)) throw new Error('Grade copy HEAD mismatch');
  const previousRanking = priorPlan.cases.find(item => item.id === 'complete-ranking-rows');
  const oracle = await command('git', ['-C', plan.sourceRepository, 'show', `${plan.oracle.fixCommit}:${plan.oracle.file}`], plan.sourceRepository);
  if (oracle.code !== 0 || !oracle.stdout.length || plan.oracle.fixCommit !== previousRanking.fixCommit) throw new Error('Historical oracle unavailable');
  const oraclePath = join(gradeProject, plan.oracle.file);
  const originalOracleHash = hash(readFileSync(oraclePath));
  writeFileSync(oraclePath, oracle.stdout);
  const game = join(gradeProject, 'game');
  const focusedXml = join(gradeRoot, 'focused.xml');
  const fullXml = join(gradeRoot, 'full.xml');
  const focusedLog = join(gradeRoot, 'focused.log');
  const fullLog = join(gradeRoot, 'full.log');
  const common = ['-batchmode', '-nographics', '-runTests', '-testPlatform', 'EditMode', '-projectPath', game];
  const startFocused = performance.now();
  const focused = await command(unity, [...common, '-testFilter', plan.oracle.filter, '-testResults', focusedXml, '-logFile', focusedLog], game);
  const focusedMs = Math.round(performance.now() - startFocused);
  const startFull = performance.now();
  const full = await command(unity, [...common, '-testResults', fullXml, '-logFile', fullLog], game);
  const fullMs = Math.round(performance.now() - startFull);
  if (!existsSync(focusedXml) || !existsSync(fullXml)) throw new Error('Unity XML missing; inspect retained logs in isolated grade root');
  const focusedBytes = readFileSync(focusedXml);
  const fullBytes = readFileSync(fullXml);
  const baselineBytes = readFileSync(plan.oracle.baselineFullXml);
  if (hash(baselineBytes) !== previousRanking.baselineFullResultSha256) throw new Error('Previous baseline hash drift');
  const oracleNames = parseNUnitCases(readFileSync(join(prior, 'preflight', 'complete-ranking-rows', 'green-results.xml'), 'utf8')).map(item => item.fullname);
  const focusedCases = parseNUnitCases(focusedBytes.toString('utf8'));
  const fullCases = parseNUnitCases(fullBytes.toString('utf8'));
  const baselineCases = parseNUnitCases(baselineBytes.toString('utf8'));
  const outcome = gradeTestResults(focusedCases, fullCases, baselineCases, oracleNames);
  const record = { arm, agentRecordSha256: hash(readFileSync(agentRecordPath)), gradeRoot, oracleSourceSha256: hash(oracle.stdout),
    originalOracleSha256: originalOracleHash, baselineFullSha256: hash(baselineBytes), oracleNames,
    focused: { exitCode: focused.code, wallMs: focusedMs, xmlSha256: hash(focusedBytes), total: focusedCases.length, passed: focusedCases.filter(item => item.result === 'Passed').length },
    full: { exitCode: full.code, wallMs: fullMs, xmlSha256: hash(fullBytes), total: fullCases.length, passed: fullCases.filter(item => item.result === 'Passed').length, failed: fullCases.filter(item => item.result === 'Failed').length },
    outcome, limitation: 'EditMode source/layout oracle only; no Android device, live Play authentication, or visual acceptance.' };
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(record, null, 2) + '\n');
  console.log(`GRADE ${arm}: ${outcome.pass ? 'PASS' : 'FAIL'} oracle=${outcome.oraclePass} full=${record.full.passed}/${record.full.total} newFailures=${outcome.newFailures.length}`);
}

await grade(process.argv[2]);
