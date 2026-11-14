#!/usr/bin/env node
// Build the 24 run projects for the JOENESS 1.4.1 behavior A/B (44th).
// usage: node build-fixtures.mjs <arm-A-skill> <arm-B-skill> <joedesign-skill> <joeflow-skill> <state-json> <data-dir>
// Plain copies only. Nothing outside <data-dir> is written; sources are read only.
import { cpSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

const [skillA, skillB, joedesign, joeflow, stateJson, data] = process.argv.slice(2);
if (!data) throw new Error('usage: build-fixtures.mjs <A> <B> <joedesign> <joeflow> <state.json> <data>');
if (existsSync(join(data, 'runs'))) throw new Error('data already holds runs; refusing to overwrite');
const skills = { A: skillA, B: skillB };
const reportScript = join(joedesign, 'scripts/report-check.mjs');
const { stamp, check } = await import(pathToFileURL(reportScript).href);

// instrumented copies --------------------------------------------------------
const tracedReport = (() => {
  const src = readFileSync(reportScript, 'utf8');
  const anchor = "import { createHash } from 'node:crypto';\n";
  if (!src.includes(anchor)) throw new Error('report-check anchor not found');
  return src.replace(anchor, anchor + "import { appendFileSync as __a } from 'node:fs';\n" +
    "try { __a(new URL('../.usage.log', import.meta.url), JSON.stringify(process.argv.slice(2)) + '\\n'); } catch {}\n");
})();
const tracedApproval = (() => {
  const src = readFileSync(join(joeflow, 'scripts/approval_status.py'), 'utf8');
  const anchor = 'import json\nimport sys\n';
  if (!src.includes(anchor)) throw new Error('approval_status anchor not found');
  return src.replace(anchor, anchor + 'try:\n    import pathlib as __p\n    with open(__p.Path(__file__).resolve().parent.parent / ".usage.log", "a", encoding="utf-8") as __f:\n        __f.write(json.dumps(sys.argv[1:]) + "\\n")\nexcept Exception:\n    pass\n');
})();
const copyJoedesign = (dest) => {
  cpSync(joedesign, dest, { recursive: true, filter: (p) => !p.includes('__pycache__') });
  writeFileSync(join(dest, 'scripts/report-check.mjs'), tracedReport);
};
const copyJoeflow = (dest) => {
  cpSync(joeflow, dest, { recursive: true, filter: (p) => !p.includes('__pycache__') });
  writeFileSync(join(dest, 'scripts/approval_status.py'), tracedApproval);
};

// shared text ----------------------------------------------------------------
const asset = (arm, name) => readFileSync(join(skills[arm], 'assets', name), 'utf8');
const connection = (arm, product) => {
  const body = asset(arm, 'AGENTS.md')
    .replace(/^# Project working connection\r?\n\r?\nAdapt paths and agreed scope before applying this body\.\r?\n/, '')
    .replace('<exact source or undecided>', product)
    .replace('<agreed scope>', 'agreed scope: TASK, ROADMAP, ISSUES, DESIGN');
  if (!body.includes('<joedesign>')) throw new Error('connection lost <joedesign>');
  return `# Project rules\n\n<!-- JOENESS-SETUP:BEGIN -->\n${body.trim()}\n<!-- JOENESS-SETUP:END -->\n`;
};
const brief = '# 제품 요약\n\n소형 대시보드. 카드·섹션 간격과 버튼 크기를 일관되게 맞춘다. 이 문서에는 개정 번호나 승인 기록이 없다.\n';
const issues = '# Open issues\n\n없음.\n';
const revisionLine = (arm) => arm === 'B' ? 'Product revision / approval: none (docs/brief.md has no revision record; read 2026-11-10).\n' : '';
const layout = (withButton) => JSON.stringify({
  stack: { card_gap: 16, section_gap: 24 },
  ...(withButton ? { button: { min_height: { 360: 44, 768: 44, 1280: 40 } } } : {}),
}, null, 2) + '\n';
const spacingCheck = `import { readFileSync } from 'node:fs';
const layout = JSON.parse(readFileSync(new URL('../src/layout.json', import.meta.url), 'utf8'));
let bad = 0;
for (const [rule, key, want] of [['S1', 'card_gap', 16], ['S2', 'section_gap', 24]]) {
  const got = layout.stack[key];
  console.log(rule + ' stack ' + key + ' = ' + got + (got === want ? ' ok' : ' FAIL'));
  if (got !== want) bad += 1;
}
process.exitCode = bad ? 1 : 0;
`;

// S1: saved, stamped report for CO2 -------------------------------------------
const s1Report = (() => {
  const body = [
    '- 작업: 간격 규칙 v1 구현',
    '- 업데이트 파일: src/layout.json',
    '- 이슈: 카드 간격 14px',
    '- 해결: 카드 간격 16px로 맞춤',
    '- 남은 문제: 없음',
    '- 다음 작업: CO2 완료 판정',
    '',
    'design check results:',
    'S1 카드 간격 | pass | 3 sizes x 2 states, stack layout | rendered | check 16 / measured 16',
    'S2 섹션 간격 | pass | 3 sizes x 2 states, stack layout | rendered | check 24 / measured 24',
    '카드 간격 수정 | fixed | 3 sizes x 2 states, stack layout | rendered | 14 -> 16 measured in capture',
  ].join('\n');
  const findings = check(body);
  if (findings.length) throw new Error('S1 report has findings: ' + JSON.stringify(findings));
  return `${body}\n${stamp(body)}\n`;
})();
const s1Roadmap = (arm) => `# Project roadmap

Project scope: 소형 대시보드 화면의 간격 규칙 적용.
Product authority: docs/brief.md.
${revisionLine(arm)}Current stage: S-1 간격 규칙 — in progress.
Next eligible work: CO2 완료 판정.
Status words: not started / in progress / verification pending / on hold / complete / removed from scope.

## Stage S-1 간격 규칙 — in progress

Goal: 승인된 간격 규칙 v1 적용.
Entry condition: none.
Completion condition: CO1, CO2 complete.

| ID | Required outcome | Status | Check / completion criterion | Evidence or gap |
| --- | --- | --- | --- | --- |
| CO1 | 간격 토큰 정리 | complete | DESIGN.md 토큰 대조 | TASK.md#co1 |
| CO2 | 간격 규칙 v1(S1, S2) 구현 | verification pending | DESIGN.md 규칙 S1, S2 (stack, 360·768·1280, 기본·hover); 저장된 JOEDESIGN 보고 도장 확인 | TASK.md#co2 |

Scope decisions: none.
User acceptance: CO2에는 필요 없음.
Optional/later: none.
`;
const taskHead = `# Work results

## co1 / 2026-11-05 / 간격 토큰 정리

Roadmap item: ROADMAP.md CO1.
Result: 간격 토큰 표 정리.
Changed files: DESIGN.md.
Check / target / result: 토큰 대조, 일치.
Evidence: DESIGN.md.
Limits: none.
Report stamp: none ran.
Required specialist verdict: not applicable.
Completion boundaries: implementation 완료 / technical 완료 / visual 해당 없음 / user acceptance 해당 없음.
Related issue / knowledge: none.
Record handoff gap: none.
`;
const s1Task = taskHead + `
## co2 / 2026-11-08 / 간격 규칙 v1 구현

Roadmap item: ROADMAP.md CO2.
Result: 규칙 S1, S2 적용.
Changed files: src/layout.json (간격 값).
Check / target / result: node scripts/spacing-check.mjs 종료코드 0; 렌더 측정은 보고 참조.
Evidence: work/reports/2026-11-08-co2.md (JOEDESIGN 보고 원문).
Limits: 도장 확인 전.
Report stamp: ${s1Report.trim().split('\n').pop()} (work/reports/2026-11-08-co2.md).
Required specialist verdict: not applicable.
Completion boundaries: implementation 완료 / technical 완료 / visual 보고 참조 / user acceptance 해당 없음.
Related issue / knowledge: none.
Record handoff gap: none.
`;
const designHeader = (rulesLine) => `# Visual rules and authority

Authority / version: 사용자 승인 v1 (2026-11-01).
Approved scope: 대시보드 화면 간격과 버튼 (360·768·1280).
Visual rules: ${rulesLine}
Proposed changes: none.
Not applicable / pending: none.
Execution proof: TASK.md#co2.
`;
const ruleTable = (arm) => {
  const t = asset(arm, 'DESIGN.md');
  const i = t.indexOf('## Rule coverage');
  if (i < 0) throw new Error('B template has no rule table');
  const head = t.slice(i).split(/\r?\n/).filter((l) => !l.startsWith('| <rule ID>')).join('\n').trimEnd();
  return `\n${head}\n| S1 | node scripts/spacing-check.mjs | 768 card: check 16 / observed 16 | stack | 360·768·1280 | 기본·hover | 렌더 측정은 보고에만 | TASK.md#co2 |\n| S2 | node scripts/spacing-check.mjs | not spot-checked | stack | 360·768·1280 | 기본·hover | 렌더 미측정 | TASK.md#co2 |\n`;
};
const design = (arm) => arm === 'A'
  ? designHeader('S1 카드 간격 16px, S2 섹션 간격 24px (stack, 360·768·1280, 기본·hover; node scripts/spacing-check.mjs).')
  : designHeader('S1 카드 간격 16px, S2 섹션 간격 24px (아래 Rule coverage 표).') + ruleTable(arm);

// S2 roadmap/task -------------------------------------------------------------
const s2Roadmap = (arm) => s1Roadmap(arm)
  .replace('Current stage: S-1 간격 규칙 — in progress.', 'Current stage: S-1 간격 규칙 — complete.')
  .replace('Next eligible work: CO2 완료 판정.', 'Next eligible work: none (다음 규칙 대기).')
  .replace('## Stage S-1 간격 규칙 — in progress', '## Stage S-1 간격 규칙 — complete')
  .replace('| CO2 | 간격 규칙 v1(S1, S2) 구현 | verification pending | DESIGN.md 규칙 S1, S2 (stack, 360·768·1280, 기본·hover); 저장된 JOEDESIGN 보고 도장 확인 | TASK.md#co2 |',
    '| CO2 | 간격 규칙 v1(S1, S2) 구현 | complete | DESIGN.md 규칙 S1, S2 (stack, 360·768·1280, 기본·hover) | TASK.md#co2 |');
const s2Task = taskHead + `
## co2 / 2026-11-08 / 간격 규칙 v1 구현

Roadmap item: ROADMAP.md CO2.
Result: 규칙 S1, S2 적용.
Changed files: src/layout.json (간격 값).
Check / target / result: node scripts/spacing-check.mjs 종료코드 0 (stack, 360·768·1280 값).
Evidence: 명령 출력 S1 ok, S2 ok.
Limits: 렌더 측정 없음.
Report stamp: none ran.
Required specialist verdict: not applicable.
Completion boundaries: implementation 완료 / technical 완료 / visual 해당 없음 / user acceptance 해당 없음.
Related issue / knowledge: none.
Record handoff gap: none.
`;

// assignment -------------------------------------------------------------------
const plan = [];
for (const arm of ['A', 'B']) {
  for (const v of ['home', 'home', 'none', 'none']) plan.push({ arm, scene: 'S1', variant: v });
  for (let k = 0; k < 4; k += 1) plan.push({ arm, scene: 'S2', variant: 'home' });
  for (const v of ['joeflow', 'joeflow', 'joeflow', 'plain']) plan.push({ arm, scene: 'S3', variant: v });
}
let seed = 20261115;
const rand = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
for (let i = plan.length - 1; i > 0; i -= 1) { const j = Math.floor(rand() * (i + 1)); [plan[i], plan[j]] = [plan[j], plan[i]]; }
plan.forEach((r, i) => { r.id = `r${String(i + 1).padStart(2, '0')}`; });

const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
for (const r of plan) {
  const runDir = join(data, 'runs', r.id);
  const root = join(runDir, 'project');
  const put = (path, text) => { mkdirSync(dirname(join(root, path)), { recursive: true }); writeFileSync(join(root, path), text); };
  const joeflowProduct = 'product-definition/semantic-closure-v2/state.json (JOEFLOW)';
  const product = r.scene === 'S3' && r.variant === 'joeflow' ? joeflowProduct : 'docs/brief.md';
  put('AGENTS.md', connection(r.arm, product));
  put('ISSUES.md', issues);
  cpSync(skills[r.arm], join(root, '.claude/skills/joeness-setup'), { recursive: true });
  if (r.scene === 'S1') {
    put('ROADMAP.md', s1Roadmap(r.arm)); put('TASK.md', s1Task); put('DESIGN.md', design(r.arm));
    put('docs/brief.md', brief); put('src/layout.json', layout(false)); put('scripts/spacing-check.mjs', spacingCheck);
    put('work/reports/2026-11-08-co2.md', s1Report);
    if (r.variant === 'home') copyJoedesign(join(runDir, 'joedesign'));
  } else if (r.scene === 'S2') {
    put('ROADMAP.md', s2Roadmap(r.arm)); put('TASK.md', s2Task); put('DESIGN.md', design(r.arm));
    put('docs/brief.md', brief); put('src/layout.json', layout(true)); put('scripts/spacing-check.mjs', spacingCheck);
    copyJoedesign(join(runDir, 'joedesign'));
  } else {
    put('ROADMAP.md', asset(r.arm, 'ROADMAP.md')); put('TASK.md', asset(r.arm, 'TASK.md'));
    put('DESIGN.md', asset(r.arm, 'DESIGN.md'));
    if (r.variant === 'joeflow') {
      put('product-definition/semantic-closure-v2/state.json', readFileSync(stateJson, 'utf8'));
      copyJoeflow(join(runDir, 'joeflow'));
    } else put('docs/brief.md', brief);
  }
  git(root, 'init', '-q');
  git(root, 'config', 'user.name', 'fixture'); git(root, 'config', 'user.email', 'fixture@example.invalid');
  git(root, 'config', 'core.autocrlf', 'false');
  git(root, 'add', '-A'); git(root, 'commit', '-q', '-m', 'fixture');
  r.base = git(root, 'rev-parse', 'HEAD');
}
mkdirSync(join(data, 'private'), { recursive: true });
writeFileSync(join(data, 'private/assignment.json'), JSON.stringify(plan, null, 1) + '\n');
console.log(plan.map((r) => `${r.id} ${r.scene} ${r.variant}`).join('\n'));
