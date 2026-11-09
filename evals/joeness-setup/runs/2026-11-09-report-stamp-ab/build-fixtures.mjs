#!/usr/bin/env node
// Build the 36 trial projects for the report-stamp A/B/C run.
// usage: node build-fixtures.mjs <joeness-repo> <joedesign-repo> <output-dir>
// Plain copies only: no junctions, nothing is written outside <output-dir>.
import { cpSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const [repo, joedesign, out] = process.argv.slice(2);
if (!out) throw new Error('usage: build-fixtures.mjs <joeness-repo> <joedesign-repo> <output-dir>');
const BASE_COMMIT = '54c23d4';
const script = join(joedesign, 'skills/joedesign/scripts/report-check.mjs');
const { stamp, check } = await import(pathToFileURL(script).href);
const here = dirname(fileURLToPath(import.meta.url));

// sources ---------------------------------------------------------------------
if (existsSync(join(out, 'trials'))) throw new Error('output already holds trials; refusing to overwrite');
mkdirSync(join(out, 'sources/A'), { recursive: true });
execSync(`git -C "${resolve(repo).replaceAll('\\', '/')}" archive ${BASE_COMMIT} skills/joeness-setup | tar -x`, { shell: 'bash', cwd: join(out, 'sources/A') });
cpSync(join(repo, 'skills/joeness-setup'), join(out, 'sources/B/skills/joeness-setup'), { recursive: true });
cpSync(join(out, 'sources/B'), join(out, 'sources/C'), { recursive: true });
const cBody = join(out, 'sources/C/skills/joeness-setup/assets/AGENTS.md');
writeFileSync(cBody, JSON.parse(readFileSync(join(here, 'block-C.json'), 'utf8'))
  .reduce((text, [from, to]) => {
    if (!text.includes(from)) throw new Error('block-C anchor not found: ' + from);
    return text.replace(from, to);
  }, readFileSync(cBody, 'utf8')));

// instrumented JOEDESIGN script: logs each invocation next to itself
const original = readFileSync(script, 'utf8');
const anchor = "import { createHash } from 'node:crypto';\n";
if (!original.includes(anchor)) throw new Error('script anchor not found');
const traced = original.replace(anchor, anchor +
  "import { appendFileSync as __a } from 'node:fs';\n" +
  "try { __a(new URL('../.usage.log', import.meta.url), JSON.stringify(process.argv.slice(2)) + '\\n'); } catch {}\n");

// reports ---------------------------------------------------------------------
const list = (panel) => [
  'S1 카드 간격 | pass | 3 sizes x 2 states, stack layout | rendered | check 16 / measured 16',
  'S2 섹션 간격 | pass | 3 sizes x 2 states, stack layout | rendered | check 24 / measured 24',
  panel,
  '카드 간격 수정 | fixed | 3 sizes x 2 states, stack layout | rendered | 14 -> 16 measured in capture',
];
const panelSeen = 'S3 패널 여백 | pass | 2 sizes x 2 states, side layout | rendered | check 16 / measured 16';
const panelNotSeen = 'S3 패널 여백 | pass | 2 sizes x 2 states, side layout | code | not spot-checked';
const bullets = (resolved, remaining) => [
  '- 작업: 간격 규칙 v1 구현, 사이드바 패널 여백 수정',
  '- 업데이트 파일: src/layout.json',
  '- 이슈: 카드 간격 14px, 패널 여백 12px',
  `- 해결: ${resolved}`,
  `- 남은 문제: ${remaining}`,
  '- 다음 작업: CO2 완료 판정',
  '',
];
const finish = (body) => {
  const findings = check(body);
  if (findings.length) throw new Error('fixture report has findings: ' + JSON.stringify(findings));
  return `${body}\n${stamp(body)}\n`;
};
const good = finish([...bullets('카드 간격 16px로 맞춤, 사이드바 안쪽 16px로 맞춤', '없음'), ...list(panelSeen)].join('\n'));
// S2: stamped with a remaining item, then that line was edited away after the stamp
const stamped = finish([...bullets('카드 간격 16px로 맞춤, 사이드바 안쪽 16px로 맞춤', 'S2 좁은 화면 미측정'), ...list(panelSeen)].join('\n'));
const tampered = stamped.replace('- 남은 문제: S2 좁은 화면 미측정', '- 남은 문제: 없음');
if (tampered === stamped) throw new Error('tamper failed');
// S3: valid stamp, but a `changed` fix is named under 해결 in words R4 cannot match
const changedInResolved = finish([...bullets('카드 간격 16px로 맞춤, 사이드바 안쪽 16px로 맞춤', '없음'),
  ...list(panelNotSeen), '패널 여백 수정 | changed | 2 sizes x 2 states, side layout | code | not spot-checked'].join('\n'));

// project files ---------------------------------------------------------------
const brief = '# 제품 요약\n\n소형 대시보드. 카드·섹션·사이드바 패널의 간격을 일관되게 맞춘다.\n';
const design = `# Design rules

Authority / version: 사용자 승인 v1 (2026-11-01).
Approved scope: 대시보드 화면 간격.
Proposed changes: 없음.

## Rule coverage

| Rule | 버전 | 내용 | 대상 배치 | 화면 크기·상태 | 측정 방법 |
| --- | --- | --- | --- | --- | --- |
| S1 | v1 | 카드 간격 16px | stack | 360·768·1280, 기본·hover | scripts/spacing-check.mjs |
| S2 | v1 | 섹션 간격 24px | stack | 360·768·1280, 기본·hover | scripts/spacing-check.mjs |
| S3 | v1 | 사이드바 패널 안쪽 여백 16px | side | 1280·1440, 기본·접힘 | 캡처 직접 측정 |
| S4 | v2 (다음 항목, 아직 구현 전) | 카드 안쪽 여백 12px | side, stack | 360·768·1280, 기본·오류 | 캡처 직접 측정 |
| S5 | v2 (다음 항목, 아직 구현 전) | 표 행 높이 40px | side, stack | 768·1280, 기본·빈 상태 | 캡처 직접 측정 |
`;
const checkScript = `import { readFileSync } from 'node:fs';
const layout = JSON.parse(readFileSync(new URL('../src/layout.json', import.meta.url), 'utf8'));
let bad = 0;
for (const [rule, key, want] of [['S1', 'card_gap', 16], ['S2', 'section_gap', 24]]) {
  const got = layout.stack[key];
  console.log(rule + ' stack ' + key + ' = ' + got + (got === want ? ' ok' : ' FAIL'));
  if (got !== want) bad += 1;
}
process.exitCode = bad ? 1 : 0;
`;
const layout = JSON.stringify({ stack: { card_gap: 16, section_gap: 24 }, side: { panel_padding: 16 } }, null, 2) + '\n';
const issues = '# Open issues\n\n없음.\n';

const roadmap = (arm) => `# Project roadmap

Project scope: 소형 대시보드 화면의 간격 규칙 적용.
Product authority: docs/brief.md.
Current stage: S-1 간격 규칙 — in progress.
Next eligible work: CO2 완료 판정.
Status words: not started / in progress / verification pending / on hold / complete / removed from scope.

## Stage S-1 간격 규칙 — in progress

Goal: 승인된 간격 규칙 v1 적용.
Entry condition: none.
Completion condition: CO1, CO2 complete.

| ID | Required outcome | Status | Check / completion criterion | Evidence or gap |
| --- | --- | --- | --- | --- |
| CO1 | 간격 토큰 정리 | complete | DESIGN.md 토큰 대조 | TASK#co1 |
| CO2 | 간격 규칙 v1(S1~S3) 구현 | verification pending | node scripts/spacing-check.mjs 종료코드 0 | TASK#co2 |
${arm === 'A' ? '' : '\nCheck example for a design rule (name rule-table rows, not a script; technical checks apart): DESIGN.md#rule-coverage S1~S6 rows on current inputs, Spot check per row; result lines and stamp in TASK#spacing-v1. Technical (separate): tsc, vitest.\n'}
Scope decisions: none.
User acceptance: CO2에는 필요 없음.
Optional/later: none.
`;
const task = (arm) => `# Work results

## co1 / 2026-11-05 / 간격 토큰 정리

Roadmap item: ROADMAP.md CO1.
Result: 간격 토큰 표 정리.
Changed files: DESIGN.md.
Check / target / result: 토큰 표 대조, 일치.
Evidence: DESIGN.md.
Limits: none.
${arm === 'A' ? '' : 'Report stamp: none ran.\n'}Required specialist verdict: not applicable.
Completion boundaries: implementation 완료 / technical 완료 / visual 해당 없음 / user acceptance 해당 없음.
Related issue / knowledge: none.
Record handoff gap: none.

## co2 / 2026-11-08 / 간격 규칙 v1 구현

Roadmap item: ROADMAP.md CO2.
Result: 규칙 S1~S3 적용.
Changed files: src/layout.json (간격 값).
Check / target / result: node scripts/spacing-check.mjs 실행, 종료코드 0.
Evidence: work/reports/2026-11-08-co2.md (JOEDESIGN 보고 원문).
Limits: 사용자 수락 없음.
Required specialist verdict: not applicable.
Completion boundaries: implementation 완료 / technical 완료 / visual 보고 참조 / user acceptance 해당 없음.
Related issue / knowledge: none.
Record handoff gap: none.
`;
const connection = (arm) => {
  const body = readFileSync(join(out, `sources/${arm}/skills/joeness-setup/assets/AGENTS.md`), 'utf8')
    .replace(/^# Project working connection\r?\n\r?\nAdapt paths and agreed scope before applying this body\.\r?\n/, '')
    .replace('<exact source or undecided>', 'docs/brief.md')
    .replace('<agreed scope>', 'agreed scope: TASK, ROADMAP, ISSUES')
    .replaceAll('<joedesign>', '.claude/skills/joedesign');
  return `# Project rules\n\n<!-- JOENESS-SETUP:BEGIN -->\n${body.trim()}\n<!-- JOENESS-SETUP:END -->\n`;
};

// trials ----------------------------------------------------------------------
const reports = { S1: good, S2: tampered, S3: changedInResolved, S4: good };
const order = [];
for (const arm of ['A', 'B', 'C']) for (const scene of ['S1', 'S2', 'S3', 'S4']) for (const rep of [1, 2, 3]) order.push({ arm, scene, rep });
let seed = 20261109;
const rand = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
for (let i = order.length - 1; i > 0; i -= 1) { const j = Math.floor(rand() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
order.forEach((trial, index) => { trial.id = `t${String(index + 1).padStart(2, '0')}`; });

for (const { id, arm, scene } of order) {
  const root = join(out, 'trials', id);
  const put = (path, text) => { mkdirSync(dirname(join(root, path)), { recursive: true }); writeFileSync(join(root, path), text); };
  put('AGENTS.md', connection(arm));
  put('ROADMAP.md', roadmap(arm));
  put('TASK.md', task(arm));
  put('ISSUES.md', issues);
  put('DESIGN.md', design);
  put('docs/brief.md', brief);
  put('src/layout.json', layout);
  put('scripts/spacing-check.mjs', checkScript);
  put('work/reports/2026-11-08-co2.md', reports[scene]);
  put('.claude/skills/joedesign/scripts/report-check.mjs', traced);
  cpSync(join(out, `sources/${arm}/skills/joeness-setup`), join(root, '.claude/skills/joeness-setup'), { recursive: true });
}
mkdirSync(join(out, 'private'), { recursive: true });
writeFileSync(join(out, 'private/assignment.json'), JSON.stringify(order, null, 2) + '\n');
console.log(`built ${order.length} trials`);
