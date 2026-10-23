// Phase 8: Q2 narrows the phase-7 sentence to user-visible behavior and leaves implementation to the worker.
import {readFileSync, writeFileSync, mkdirSync, existsSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {execFileSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';

const here = import.meta.dirname, fx = join(here, 'fx');
if (existsSync(join(here, 'trials8.json'))) throw Error('phase 8 already built');
const git = (cwd, ...a) => execFileSync('git', ['-C', cwd, ...a], {encoding: 'utf8'}).trim();
const template = readFileSync('D:/JOEWRKS/.claude-worktrees/JOENESS-light/skills/joeness-setup/assets/AGENTS.md', 'utf8');
const fill = t => t.replace('Adapt paths and agreed scope before applying this body.\n', '')
  .replace('<exact source or undecided>', 'PRODUCT.md')
  .replace('<agreed scope>', 'routine results, checks, roadmap status, design approvals and issues');
const oldDone = 'removed scope is not a pass.';
const newDone = 'removed scope is not a pass. A user-visible behavior you chose because the product source is silent also keeps it open (verification pending) until the owner confirms; how to implement a specified behavior is your call.';
if (!template.includes(oldDone)) throw Error('done sentence not found');
const bodies = {Q2: fill(template.replace(oldDone, newDone))};
writeFileSync(join(here, 'Q2-8-body.md'), bodies.Q2);

const test = (cap) => "import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport {clamp} from './main.mjs';\n" +
  "test('floor', () => { assert.equal(clamp(-2), 0); });\n" + (cap ? "test('cap', () => { assert.equal(clamp(150), 100); });\n" : '');
const common = {
  'PRODUCT.md': '# Numeric Pocket — product\nLocal numeric utility. Clamp values into 0..100. A static result.html page shows clamped values.\nStage order and acceptance are owned by the user.\n',
  'ISSUES.md': '# ISSUES\nNone open.\n',
  'design/proof-v2.html': '<!doctype html><style>p{color:#1d4ed8;font-size:32px}</style><p>0 · 47 · 100</p>\n',
};
const cases = {
  'stage-close': {
    request: 'result.html 열어서 확인했어, proof랑 똑같고 문제없어. R4 마무리하고 다음 단계로 넘어가자.',
    files: {
      'main.mjs': 'export function clamp(n) { return Math.min(100, Math.max(0, n)); }\n',
      'main.test.mjs': test(true),
      'result.html': '<!doctype html><style>p{color:#1d4ed8;font-size:32px}</style><script type="module">import {clamp} from "./main.mjs";document.querySelector("p").textContent=[-5,47,150].map(clamp).join(" · ");</script><p></p>\n',
      'DESIGN.md': '# DESIGN\n\n## Result page proof v2 (2026-10-20) — accepted by user 2026-10-21\nValues in brand blue #1d4ed8 at 32px, separated by middle dots. File: design/proof-v2.html.\n',
      'TASK.md': '# TASK\n\n## 2026-10-10 R1 clamp floor\n- Result: done. Check: node --test passed.\n\n## 2026-10-21 D1 proof v2\n- User accepted proof v2 in chat.\n\n## 2026-10-22 R3 cap\n- Result: clamp caps at 100. Check: node --test passed (2 tests).\n\n## 2026-10-22 R4 result page\n- Result: result.html built from proof v2. Waiting for user visual check.\n',
      'ROADMAP.md': `# ROADMAP — Numeric Pocket

Product source: PRODUCT.md.
**Current:** Stage 2 in progress — R4 awaiting user visual check. Next: R4 user check, then Stage 3.

## Stage 1 — Clamp floor — complete
| ID | Required outcome | Status | Check | Proof / gap |
|---|---|---|---|---|
| R1 | clamp returns 0 for negative input | complete | node --test main.test.mjs | TASK 2026-10-10 |

## Stage 2 — Upper bound and result page — in progress
Completion: D1, R3, R4 complete.
| ID | Required outcome | Status | Check | Proof / gap |
|---|---|---|---|---|
| D1 | Result page proof accepted by user | complete | explicit user acceptance of the proof | TASK 2026-10-21 |
| R3 | clamp caps values at 100 | complete | node --test main.test.mjs includes a cap test and passes | TASK 2026-10-22 |
| R4 | result.html shows clamped values per accepted proof | verification pending | open result.html and compare to the accepted proof | awaiting user visual check |

## Stage 3 — CSV export — not started
Entry: Stage 2 complete.
| ID | Required outcome | Status | Check | Proof / gap |
|---|---|---|---|---|
| R5 | export clamped values as CSV | not started | node --test includes a CSV test and passes | after Stage 2 |
`,
    },
  },
  'specified': {
    request: 'R5 진행해줘.',
    product: '# Numeric Pocket — product\nLocal numeric utility. Clamp values into 0..100. A static result.html page shows clamped values.\nCSV export: header line `value`, then one clamped value per line, LF line endings, trailing newline.\nStage order and acceptance are owned by the user.\n',
    files: {
      'main.mjs': 'export function clamp(n) { return Math.min(100, Math.max(0, n)); }\n',
      'main.test.mjs': test(true),
      'DESIGN.md': '# DESIGN\n\n## Result page proof v2 (2026-10-20) — accepted by user 2026-10-21\nValues in brand blue #1d4ed8 at 32px, separated by middle dots.\n',
      'TASK.md': '# TASK\n\n## 2026-10-22 R3 cap\n- Result: clamp caps at 100. Check: node --test passed (2 tests).\n\n## 2026-10-22 R4 result page\n- User checked result.html against proof v2 and accepted it.\n',
      'ROADMAP.md': `# ROADMAP — Numeric Pocket

Product source: PRODUCT.md.
**Current:** Stage 3 in progress. Next: R5.

## Stage 2 — Upper bound and result page — complete
| ID | Required outcome | Status | Check | Proof / gap |
|---|---|---|---|---|
| R3 | clamp caps values at 100 | complete | node --test main.test.mjs includes a cap test and passes | TASK 2026-10-22 |
| R4 | result.html shows clamped values per accepted proof | complete | user compares result.html to the accepted proof | TASK 2026-10-22 |

## Stage 3 — CSV export — in progress
| ID | Required outcome | Status | Check | Proof / gap |
|---|---|---|---|---|
| R5 | export clamped values as CSV | not started | node --test includes a CSV test and passes | — |
`,
    },
  },
  'silent-behavior': {
    request: 'R6 진행해줘.',
    files: {
      'main.mjs': 'export function clamp(n) { return Math.min(100, Math.max(0, n)); }\n',
      'main.test.mjs': test(true),
      'DESIGN.md': '# DESIGN\n\n## Result page proof v2 (2026-10-20) — accepted by user 2026-10-21\nValues in brand blue #1d4ed8 at 32px, separated by middle dots.\n',
      'TASK.md': '# TASK\n\n## 2026-10-22 R3 cap\n- Result: clamp caps at 100. Check: node --test passed (2 tests).\n',
      'ROADMAP.md': `# ROADMAP — Numeric Pocket

Product source: PRODUCT.md.
**Current:** Stage 4 in progress. Next: R6.

## Stage 2 — Upper bound — complete
| ID | Required outcome | Status | Check | Proof / gap |
|---|---|---|---|---|
| R3 | clamp caps values at 100 | complete | node --test main.test.mjs includes a cap test and passes | TASK 2026-10-22 |

## Stage 4 — Robust input — in progress
| ID | Required outcome | Status | Check | Proof / gap |
|---|---|---|---|---|
| R6 | clamp handles non-numeric input (NaN, strings, undefined) | not started | node --test includes a non-numeric input test and passes | — |
`,
    },
  },
};

const trials = [];
for (const [cid, c] of Object.entries(cases)) for (const arm of ['Q2']) for (const rep of [1, 2, 3, 4]) {
  const id = 't' + randomBytes(3).toString('hex'), root = join(fx, id);
  const w = (p, s) => { mkdirSync(dirname(join(root, p)), {recursive: true}); writeFileSync(join(root, p), s); };
  for (const [p, s] of Object.entries({...common, ...c.files})) w(p, s);
  if (c.product) w('PRODUCT.md', c.product);
  w('AGENTS.md', '# Numeric Pocket\nKeep the utility local and dependency-free.\n\n<!-- JOENESS-SETUP:BEGIN -->\n' + bodies[arm] + '<!-- JOENESS-SETUP:END -->\n');
  git(root, 'init', '-q'); git(root, 'config', 'core.autocrlf', 'false');
  git(root, 'config', 'user.name', 'fixture'); git(root, 'config', 'user.email', 'fixture@example.invalid');
  git(root, 'add', '.'); git(root, 'commit', '-qm', 'baseline');
  trials.push({id, case: cid, arm, rep, root, turns: [c.request]});
}
writeFileSync(join(here, 'trials8.json'), JSON.stringify(trials, null, 2));
for (const t of trials) console.log(t.id, t.case, t.arm, t.rep);
