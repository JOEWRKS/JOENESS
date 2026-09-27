// Bounded runner for the preregistered JOENESS 0.2 token comparison.
// No raw rollout, auth contents, or broad CODEX_HOME state is saved.
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const evidence = resolve(fileURLToPath(new URL('.', import.meta.url)));
const testRoot = resolve('D:/JOEWRKS/JOENESS-Token-AB-20260927');
const binary = process.env.JOENESS_EVAL_CODEX_BIN;
if (!binary || !existsSync(binary)) throw new Error('Set JOENESS_EVAL_CODEX_BIN to the tested Codex binary');
if (!existsSync(testRoot)) throw new Error(`Missing evaluation root: ${testRoot}`);

const prompts = [
  '이 가상 Git 프로젝트의 작업 기록을 정리해. 현재 문서를 먼저 확인하고 AGENTS.md에 기존 PRODUCT.md, ROADMAP.md, TASKS.md, ISSUES.md 및 존재하는 DESIGN.md의 역할·위치를 짧게 연결해. 사실에 기반한 일상 작업은 TASKS.md, 재사용할 문제 원인·해결은 ISSUES.md에 기록하도록 해. 기존 문서와 제품 범위를 보존하고 새 문서는 만들지 마. 이 범위의 연결 파일 수정과 일상 기록에 동의한다. 변경 내용과 사용법을 간결히 보고해.',
  '현재 파일과 테스트를 확인하고 ROADMAP.md의 승인된 필수 로컬 기능을 구현·검증해. 변경과 실제 검증 결과를 합의된 기록 위치에 남겨. 구현이 끝나도 없는 실기기 확인이나 사용자 수락을 주장하지 마. 선택·아이디어 기능은 만들지 마. 문제와 남은 일을 명확히 보고해.',
  '당신은 이 프로젝트를 처음 맡은 담당자다. 현재 파일, Git 상태, 실제 테스트와 기록을 읽고 새 담당자가 바로 이어서 할 수 있도록 한 일, 바뀐 파일, 겪은 문제와 해결, 남은 문제, 다음 행동을 간결히 인수인계해. 오래된 HANDOFF.md는 위치 힌트일 뿐 현재 상태보다 우선하지 마. 파일은 수정하지 마.',
];
const order = [
  ['reading-shelf-v1', 'bare'],
  ['reading-shelf-v1', 'joeness'],
  ['workshop-slots-v1', 'joeness'],
  ['workshop-slots-v1', 'bare'],
];
const sha256 = value => createHash('sha256').update(value).digest('hex');

function command(program, args, cwd) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(program, args, { cwd, windowsHide: true });
    let output = '';
    child.stdout.on('data', chunk => { output += chunk.toString(); });
    child.stderr.on('data', chunk => { output += chunk.toString(); });
    child.on('error', reject);
    child.on('close', code => resolvePromise({ code, output: output.trim() }));
  });
}

async function gitStatus(project) {
  const result = await command('git', ['-C', project, 'status', '--porcelain=v1', '--untracked-files=all'], project);
  if (result.code !== 0) throw new Error(`git status failed: ${result.output}`);
  return result.output;
}

async function runSession(fixture, arm, stage) {
  const id = `${fixture}-${arm}-stage${stage}`;
  const project = join(testRoot, 'projects', `${fixture}-${arm}`);
  const home = join(testRoot, arm === 'bare' ? 'bare-home' : 'joeness-home');
  const responsePath = join(evidence, 'responses', `${id}.md`);
  const resultPath = join(evidence, 'results', `${id}.json`);
  if (!existsSync(project) || !existsSync(home)) throw new Error(`Missing fixture or home for ${id}`);
  if (existsSync(resultPath) || existsSync(responsePath)) throw new Error(`Refusing to repeat completed or partial run: ${id}`);
  const statusBefore = await gitStatus(project);
  const args = [
    'exec', '--ephemeral', '--ignore-user-config',
    '-m', 'gpt-6-astra', '-c', 'model_reasoning_effort="xhigh"',
    '-c', 'approval_policy="never"', '-s', 'danger-full-access',
    '-C', project, '--json', '-o', responsePath, '--', prompts[stage - 1],
  ];
  const startedAt = new Date().toISOString();
  const start = performance.now();
  let buffer = '';
  let threadId = null;
  let usage = null;
  let lastError = null;
  const eventCounts = {};
  function collect(line) {
    if (!line.trim()) return;
    try {
      const event = JSON.parse(line);
      eventCounts[event.type] = (eventCounts[event.type] || 0) + 1;
      if (event.type === 'thread.started') threadId = event.thread_id || null;
      if (event.type === 'turn.completed') usage = event.usage || null;
      if (event.type === 'turn.failed' || event.type === 'error') lastError = event.message || event.error || event.type;
    } catch { /* Stderr and non-JSON progress are not retained. */ }
  }
  console.log(`START ${id}`);
  const child = spawn(binary, args, {
    cwd: project,
    env: { ...process.env, CODEX_HOME: home },
    windowsHide: true,
  });
  // `codex exec` also reads stdin; signal EOF or it waits without starting a turn.
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
  const code = await new Promise((resolvePromise, reject) => {
    child.on('error', reject);
    child.on('close', resolvePromise);
  });
  collect(buffer);
  const wallMs = Math.round(performance.now() - start);
  const statusAfter = await gitStatus(project);
  const response = existsSync(responsePath) ? readFileSync(responsePath, 'utf8') : null;
  const result = {
    id, fixture, arm, stage, startedAt, wallMs, exitCode: code,
    runtime: { binary, model: 'gpt-6-astra', reasoningEffort: 'xhigh', threadId },
    promptSha256: sha256(prompts[stage - 1]),
    responseSha256: response === null ? null : sha256(response),
    usage,
    derived: usage ? {
      noncachedInputTokens: usage.input_tokens - usage.cached_input_tokens,
      inputPlusOutputTokens: usage.input_tokens + usage.output_tokens,
      noncachedInputPlusOutputTokens: usage.input_tokens - usage.cached_input_tokens + usage.output_tokens,
    } : null,
    eventCounts, lastError, statusBefore, statusAfter,
  };
  writeFileSync(resultPath, JSON.stringify(result, null, 2) + '\n', 'utf8');
  console.log(`END ${id} exit=${code} wall=${wallMs}ms input=${usage?.input_tokens ?? 'missing'} cached=${usage?.cached_input_tokens ?? 'missing'} output=${usage?.output_tokens ?? 'missing'}`);
  if (code !== 0 || !usage) throw new Error(`Model run failed: ${id}`);
}

mkdirSync(join(evidence, 'responses'), { recursive: true });
mkdirSync(join(evidence, 'results'), { recursive: true });
for (const [fixture, arm] of order) {
  for (const stage of [1, 2, 3]) await runSession(fixture, arm, stage);
}
