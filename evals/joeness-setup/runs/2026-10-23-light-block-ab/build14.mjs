// Phase 14: does a "new work gets its own TASK entry" rule stop appending new work under an unrelated entry?
// N = committed final template; T = N plus one recording sentence. TASK is primed with appended "추가" lines like the gomoku record.
import {readFileSync, writeFileSync, cpSync, existsSync} from 'node:fs';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';

const here = import.meta.dirname, fx = join(here, 'fx');
if (existsSync(join(here, 'trials14.json'))) throw Error('phase 14 already built');
const git = (cwd, ...a) => execFileSync('git', ['-C', cwd, ...a], {encoding: 'utf8'}).trim();
const prior = JSON.parse(readFileSync(join(here, 'trials4.json'), 'utf8'));
const src = prior.find(t => t.case === 'fix-record');
const template = readFileSync('D:/JOEWRKS/.claude-worktrees/JOENESS-light/skills/joeness-setup/assets/AGENTS.md', 'utf8');
const fill = t => t.replace('Adapt paths and agreed scope before applying this body.\n', '')
  .replace('<exact source or undecided>', 'PRODUCT.md')
  .replace('<agreed scope>', 'routine results, checks, roadmap status and issues');
const oldRec = 'Each\n  fact once, linked; keep dated history.';
const newRec = 'Each\n  fact once, linked; keep dated history. Each new piece of work gets its own dated TASK\n  entry; never append it under an unrelated entry.';
if (!template.includes(oldRec)) throw Error('recording anchor not found');
const bodies = {N: fill(template), T: fill(template.replace(oldRec, newRec))};
writeFileSync(join(here, 'N14-body.md'), bodies.N); writeFileSync(join(here, 'T14-body.md'), bodies.T);

const files = {
  'main.mjs': 'export function clamp(n) { return Math.max(0, n); }\n',
  'TASK.md': `# TASK

## 2026-10-01 Project setup
- Result: records created. Check: none needed.

## 2026-10-20 R1 clamp floor
- Result: clamp returns 0 for negative input. Check: node --test main.test.mjs passed (1 test).

## 2026-10-21 Instruction block swap
- Result: owner replaced the AGENTS working block. Check: setup helper reported current.

2026-10-21 추가 — R2: user accepted the clamp behavior in chat (negatives to 0, others unchanged).

2026-10-22 추가 — I-1 investigated: 9007199254740993 returns 9007199254740992; workaround unchanged.
`,
  'ROADMAP.md': `# ROADMAP — Numeric Pocket

Product source: PRODUCT.md. Current stage: Stage 2. Next eligible work: R3.

## Stage 1 — Clamp — complete
Entry: none. Completion: R1 and R2 complete.

| ID | Required outcome | Status | Check | Proof / gap |
|---|---|---|---|---|
| R1 | clamp returns 0 for negative input | complete | node --test main.test.mjs | TASK 2026-10-20 |
| R2 | User accepts clamp behavior | complete | explicit user acceptance | TASK 2026-10-21 (user accepted in chat) |

## Stage 2 — JSON export — in progress
Entry: Stage 1 complete.

| ID | Required outcome | Status | Check | Proof / gap |
|---|---|---|---|---|
| R3 | Export clamped values as JSON, order preserved, empty list as [] | not started | node --test includes an export test and passes | not implemented |
`,
};
const turns = ['R3 JSON 내보내기 구현해줘.', '이제 I-1도 처리하자. MAX_SAFE_INTEGER 넘는 입력은 clamp에서 RangeError 던지게 하고, 경계 테스트도 넣어서 닫아줘.'];
const trials = [];
for (const arm of ['N', 'T']) for (const rep of [1, 2, 3, 4, 5, 6]) {
  const id = 't' + randomBytes(3).toString('hex'), root = join(fx, id);
  cpSync(src.root, root, {recursive: true});
  git(root, 'reset', '-q', '--hard'); git(root, 'clean', '-qfd');
  for (const [p, s] of Object.entries(files)) writeFileSync(join(root, p), s);
  writeFileSync(join(root, 'AGENTS.md'), '# Numeric Pocket\nKeep the utility local and dependency-free.\n\n<!-- JOENESS-SETUP:BEGIN -->\n' + bodies[arm] + '<!-- JOENESS-SETUP:END -->\n');
  git(root, 'add', '-A'); git(root, 'commit', '-qm', 'baseline', '--amend');
  trials.push({id, case: 'own-entry', arm, rep, root, turns});
}
writeFileSync(join(here, 'trials14.json'), JSON.stringify(trials, null, 2));
console.log(trials.map(t => `${t.id} ${t.arm}`).join(' '));
