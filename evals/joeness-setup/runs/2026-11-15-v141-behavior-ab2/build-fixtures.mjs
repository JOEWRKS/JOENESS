#!/usr/bin/env node
// Build the 16 run folders for the JOENESS 1.4.1 behavior A/B, 2nd round (45th).
// usage: node build-fixtures.mjs <arm-A-skill> <arm-B-skill> <joedesign-skill> <data-dir>
// Plain copies only. Nothing outside <data-dir> is written; sources are read only.
// Layout per run: <data>/runs/<rNN>/project (git repo), <data>/runs/<rNN>/tools/{joeness-setup,joedesign}.
import { cpSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';

const [skillA, skillB, joedesign, data] = process.argv.slice(2);
if (!data) throw new Error('usage: build-fixtures.mjs <A> <B> <joedesign> <data>');
if (existsSync(join(data, 'runs'))) throw new Error('data already holds runs; refusing to overwrite');
const skills = { A: skillA, B: skillB };
const asset = (arm, name) => readFileSync(join(skills[arm], 'assets', name), 'utf8');
const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
const ps = (...args) => execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ...args], { encoding: 'utf8' });

// shared project text ----------------------------------------------------------
const readme = `# 문의 폼

작은 정적 문의 폼. \`src/index.html\`을 브라우저로 열어 쓴다.
요청 내용은 최대 500자까지 받는다. 화면 크기는 360·768·1280을 지원한다.
`;
const html = `<!doctype html>
<html lang="ko">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>문의</title><link rel="stylesheet" href="style.css"></head>
<body>
<form id="request-form">
  <label for="name">이름</label>
  <input id="name" name="name" required>
  <label for="body">요청 내용</label>
  <textarea id="body" name="body" maxlength="500" required></textarea>
  <button type="submit">보내기</button>
</form>
<script src="form.js"></script>
</body>
</html>
`;
const formJs = `const form = document.getElementById('request-form');
form.addEventListener('submit', (event) => {
  event.preventDefault();
  form.reset();
  alert('접수되었습니다.');
});
`;
const css = `form { display: grid; gap: 12px; max-width: 480px; margin: 24px auto; padding: 0 16px; }
input, textarea { font: inherit; min-height: 44px; }
textarea { min-height: 120px; }
button { min-height: 44px; }
@media (min-width: 1280px) { input { min-height: 40px; } }
`;

// S2: connected project with JOEDESIGN's DESIGN template already in use --------
const tokens = JSON.stringify({
  field_gap: 12,
  button: { min_height: { 360: 44, 768: 44, 1280: 44 } },
  input: { min_height: { 360: 44, 768: 44, 1280: 40 } },
}, null, 2) + '\n';
const designCheck = `import { readFileSync } from 'node:fs';
const t = JSON.parse(readFileSync(new URL('../src/tokens.json', import.meta.url), 'utf8'));
let bad = 0;
const line = (rule, what, got, want) => {
  const ok = got === want; if (!ok) bad += 1;
  console.log(rule + ' ' + what + ' = ' + got + (ok ? ' ok' : ' FAIL (want ' + want + ')'));
};
line('C1', 'field_gap', t.field_gap, 12);
for (const size of ['360', '768', '1280']) line('C2', 'button.min_height@' + size, t.button.min_height[size], 44);
process.exitCode = bad ? 1 : 0;
`;
const joedesignDesign = (() => {
  const t = readFileSync(join(joedesign, 'templates/DESIGN.md'), 'utf8');
  const filled = t
    .replace('**Status:** DRAFT', '**Status:** APPROVED')
    .replace('**Product Authority:** <pointer>', '**Product Authority:** README.md')
    .replace(/(## Visual Sources and Approval Scope\r?\n\r?\n<!--[\s\S]*?-->\r?\n)/,
      '$1\n사용자 승인 Rev 1 (2026-11-01): 문의 폼 화면, 360·768·1280, 기본·focus. 별도 시안 없음.\n')
    .replace(/(## Project Decisions\r?\n\r?\n<!--[\s\S]*?-->\r?\n)/,
      '$1\n- C1 필드 간격 12px (모든 크기).\n- C2 버튼 최소 높이 44px (모든 크기, 터치 대상).\n')
    .replace('| Role | Parts | Token / value | Status |\n| --- | --- | --- | --- |\n',
      '| Role | Parts | Token / value | Status |\n| --- | --- | --- | --- |\n| 필드 간격 | 폼 필드 사이 | field_gap 12 | approved (Rev 1) |\n| 터치 높이 | 버튼 | button.min_height 44 | approved (Rev 1) |\n')
    .replace('| Rule | Check | Spot check | Layouts | Sizes | States | Unmeasured |\n| --- | --- | --- | --- | --- | --- | --- |\n',
      '| Rule | Check | Spot check | Layouts | Sizes | States | Unmeasured |\n| --- | --- | --- | --- | --- | --- | --- |\n' +
      '| C1 필드 간격 12px | node scripts/design-check.mjs | 768 form: check 12 / observed 12 | form | 360·768·1280 | 기본·focus | 렌더 측정 768만 |\n' +
      '| C2 버튼 최소 높이 44px | node scripts/design-check.mjs | not spot-checked | form | 360·768·1280 | 기본 | 렌더 미측정, focus 상태 |\n');
  if (!filled.includes('| C2 버튼') || !filled.includes('| 필드 간격 |') || !filled.includes('APPROVED') || !filled.includes('별도 시안')) throw new Error('JOEDESIGN template anchors not found');
  return filled;
})();
const revisionLine = (arm) => arm === 'B' ? 'Product revision / approval: none (README.md has no revision record; read 2026-11-10).\n' : '';
const s2Roadmap = (arm) => `# Project roadmap

Project scope: 문의 폼 화면의 디자인 규칙 적용.
Product authority: README.md.
${revisionLine(arm)}Current stage: S-1 폼 디자인 규칙 — complete.
Next eligible work: none (다음 규칙 대기).
Status words: not started / in progress / verification pending / on hold / complete / removed from scope.

## Stage S-1 폼 디자인 규칙 — complete

Goal: 승인된 디자인 규칙 Rev 1 적용.
Entry condition: none.
Completion condition: CO1, CO2 complete.

| ID | Required outcome | Status | Check / completion criterion | Evidence or gap |
| --- | --- | --- | --- | --- |
| CO1 | 필드 간격 12px (C1) | complete | node scripts/design-check.mjs | TASK.md#co1 |
| CO2 | 버튼 최소 높이 44px (C2) | complete | node scripts/design-check.mjs | TASK.md#co2 |

Scope decisions: none.
User acceptance: not required.
Optional/later: none.
`;
const s2Task = `# Work results

## co1 / 2026-11-04 / 필드 간격 12px

Roadmap item: ROADMAP.md CO1.
Result: 필드 간격 12px 적용.
Changed files: src/style.css, src/tokens.json.
Check / target / result: node scripts/design-check.mjs, C1 ok (토큰 값).
Evidence: 명령 출력 C1 field_gap = 12 ok.
Limits: 렌더 측정은 768만.
Report stamp: none ran.
Required specialist verdict: not applicable.
Completion boundaries: implementation 완료 / technical 완료 / visual 768만 / user acceptance 해당 없음.
Related issue / knowledge: none.
Record handoff gap: none.

## co2 / 2026-11-06 / 버튼 최소 높이 44px

Roadmap item: ROADMAP.md CO2.
Result: 버튼 최소 높이 44px 적용.
Changed files: src/style.css, src/tokens.json.
Check / target / result: node scripts/design-check.mjs, C2 ok 3/3 크기 (토큰 값).
Evidence: 명령 출력 C2 button.min_height@360/768/1280 = 44 ok.
Limits: 렌더 미측정.
Report stamp: none ran.
Required specialist verdict: not applicable.
Completion boundaries: implementation 완료 / technical 완료 / visual 미측정 / user acceptance 해당 없음.
Related issue / knowledge: none.
Record handoff gap: none.
`;
const connectionBody = (arm) => {
  const body = asset(arm, 'AGENTS.md')
    .replace(/^# Project working connection\r?\n\r?\nAdapt paths and agreed scope before applying this body\.\r?\n/, '')
    .replace('<exact source or undecided>', 'README.md')
    .replace('<agreed scope>', 'agreed scope: TASK, ROADMAP, ISSUES, DESIGN');
  if (!body.includes('<joedesign>') || body.includes('<agreed scope>')) throw new Error('connection anchors');
  return body.trim() + '\n';
};
const applyConnection = (arm, root, skillCopy) => {
  const script = join(skillCopy, 'scripts/project-setup.ps1');
  const c = JSON.parse(ps(script, '-Check', '-ProjectPath', root));
  if (c.status !== 'ready') throw new Error('fixture check: ' + JSON.stringify(c));
  const b64 = Buffer.from(connectionBody(arm), 'utf8').toString('base64');
  const a = JSON.parse(ps(script, '-Apply', '-ProjectPath', root, '-ExpectedRoot', c.projectRoot,
    '-ExpectedTargetHash', c.targetHash, '-ExpectedStateHash', c.stateHash, '-ManagedBodyBase64', b64));
  if (a.status !== 'current') throw new Error('fixture apply: ' + JSON.stringify(a));
};

// assignment: 2 scenes x 2 arms x 4, seeded shuffle ------------------------------
const plan = [];
for (const arm of ['A', 'B']) for (const scene of ['S1', 'S2']) for (let k = 0; k < 4; k += 1) plan.push({ arm, scene });
let seed = 20261116;
const rand = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
for (let i = plan.length - 1; i > 0; i -= 1) { const j = Math.floor(rand() * (i + 1)); [plan[i], plan[j]] = [plan[j], plan[i]]; }
plan.forEach((r, i) => { r.id = `r${String(i + 1).padStart(2, '0')}`; });

for (const r of plan) {
  const runDir = join(data, 'runs', r.id);
  const root = join(runDir, 'project');
  const skillCopy = join(runDir, 'tools', 'joeness-setup');
  cpSync(skills[r.arm], skillCopy, { recursive: true });
  cpSync(joedesign, join(runDir, 'tools', 'joedesign'), { recursive: true, filter: (p) => !p.includes('__pycache__') });
  const put = (path, text) => { mkdirSync(dirname(join(root, path)), { recursive: true }); writeFileSync(join(root, path), text); };
  put('README.md', readme); put('src/index.html', html); put('src/form.js', formJs); put('src/style.css', css);
  git(root, 'init', '-q');
  git(root, 'config', 'user.name', 'fixture'); git(root, 'config', 'user.email', 'fixture@example.invalid');
  git(root, 'config', 'core.autocrlf', 'false');
  if (r.scene === 'S2') {
    put('src/tokens.json', tokens); put('scripts/design-check.mjs', designCheck);
    put('DESIGN.md', joedesignDesign); put('ROADMAP.md', s2Roadmap(r.arm)); put('TASK.md', s2Task);
    put('ISSUES.md', '# Open issues\n\n없음.\n');
    put('AGENTS.md', '# Project rules\n\n- 커밋 메시지는 한국어로 쓴다.\n');
    applyConnection(r.arm, root, skillCopy);
  }
  git(root, 'add', '-A'); git(root, 'commit', '-q', '-m', 'fixture');
  r.base = git(root, 'rev-parse', 'HEAD');
}
mkdirSync(join(data, 'private'), { recursive: true });
writeFileSync(join(data, 'private/assignment.json'), JSON.stringify(plan, null, 1) + '\n');
console.log(plan.map((r) => `${r.id} ${r.scene}`).join('\n'));
