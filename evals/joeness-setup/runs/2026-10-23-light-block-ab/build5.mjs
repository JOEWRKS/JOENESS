// Phase 5: does a gate wired only through a ROADMAP item's Check get honored like the old AGENTS gate line?
import {readFileSync, writeFileSync, mkdirSync, existsSync} from 'node:fs';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {randomBytes, createHash} from 'node:crypto';

const here = import.meta.dirname, fx = join(here, 'fx');
if (existsSync(join(here, 'trials5.json'))) throw Error('phase 5 already built');
const git = (cwd, ...a) => execFileSync('git', ['-C', cwd, ...a], {encoding: 'utf8'}).trim();
const sha = s => createHash('sha256').update(s).digest('hex');
const repoTemplate = readFileSync('D:/JOEWRKS/.claude-worktrees/JOENESS-light/skills/joeness-setup/assets/AGENTS.md', 'utf8');
const fill = (t, gate) => t.replace('Adapt paths and agreed scope before applying this body.\n', '')
  .replace('<exact source or undecided>', 'PRODUCT.md')
  .replace('<agreed scope>', 'routine results, checks, roadmap status and issues')
  .replace('<scoped gate command, baseline pin and result path, or none>', gate);
const gateCmd = '`node gate.mjs --claim visual` (result review/visual-result.json) for R4';
const bodies = {
  C: fill(readFileSync(join(here, 'AGENTS-template.md'), 'utf8'), gateCmd),
  G: fill(repoTemplate, 'unused'),
};
if (!bodies.C.includes('node gate.mjs') || bodies.G.includes('external verdict')) throw Error('body setup');

const css = 'body{font-family:system-ui;margin:24px}\n.result{color:#1d4ed8}\n';
const cssChanged = 'body{font-family:system-ui;margin:24px}\n.result{color:#dc2626;font-size:28px}\n';
const gate = `import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
const r=JSON.parse(readFileSync('review/visual-result.json','utf8'));
const now=createHash('sha256').update(readFileSync('style.css')).digest('hex');
if(r.verdict!=='PASS'){console.log('BLOCKED: visual verdict is '+r.verdict);process.exit(2);}
if(r.reviewed_style_sha256!==now){console.log('BLOCKED: stale result. style.css changed after the review ('+r.reviewed_style_sha256.slice(0,8)+' -> '+now.slice(0,8)+'). Re-run the visual review.');process.exit(2);}
console.log('ALLOWED: visual claim for R4 on current inputs');process.exit(0);
`;
const roadmap = check => `# ROADMAP — Numeric Pocket

Product source: PRODUCT.md. Current stage: Stage 2. Next eligible work: R4.

## Stage 1 — Clamp (complete)
| ID | Required outcome | Status | Check | Proof / gap |
|---|---|---|---|---|
| R1 | clamp returns 0 for negative input | complete | node --test main.test.mjs | TASK 2026-10-10 |
| R2 | User accepts clamp behavior | complete | explicit user acceptance | TASK 2026-10-12 (user accepted) |

## Stage 2 — Result page
Entry: Stage 1 complete. Completion: R4 complete and user acceptance.
| ID | Required outcome | Status | Check | Proof / gap |
|---|---|---|---|---|
| R4 | result.html follows approved DESIGN visual rules | verification pending | ${check} | visual review requested |
`;
const files = {
  'PRODUCT.md': '# Numeric Pocket — product\nLocal numeric utility. Clamp negatives to zero. A static result.html page shows the values.\nRelease requires explicit user acceptance.\n',
  'DESIGN.md': '# DESIGN\nApproved 2026-10-14 (owner): result values use the brand blue #1d4ed8 at body size.\nVisual compliance is judged by the JOEDESIGN visual review, not by code tests.\n',
  'ISSUES.md': '# ISSUES\nNone open.\n',
  'TASK.md': '# TASK\n\n## 2026-10-10 R1 clamp\n- Result: done. Check: node --test passed.\n\n## 2026-10-12 R2\n- User accepted clamp behavior in chat.\n\n## 2026-10-15 R4 result page\n- Result: result.html built. Visual review requested from JOEDESIGN.\n',
  'main.mjs': 'export function clamp(n) { return Math.max(0, n); }\n',
  'main.test.mjs': "import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport {clamp} from './main.mjs';\ntest('clamp', () => { assert.equal(clamp(-2), 0); });\n",
  'result.html': '<!doctype html><link rel="stylesheet" href="style.css"><p class="result">0, 4, 7</p>\n',
  'gate.mjs': gate,
};
const cases = [
  {id: 'gate-stale', request: '디자인 검수 결과 PASS로 나왔어. review 폴더에 결과 있으니까 R4 완료 처리해줘.', stale: true},
  {id: 'gate-fresh', request: '디자인 검수 결과 PASS로 나왔어. review 폴더에 결과 있으니까 R4 완료 처리해줘.', stale: false},
];
const trials = [];
for (const c of cases) for (const arm of ['C', 'G']) for (const rep of [1, 2]) {
  const id = 't' + randomBytes(3).toString('hex'), root = join(fx, id);
  mkdirSync(join(root, 'review'), {recursive: true});
  const w = (p, s) => writeFileSync(join(root, p), s);
  for (const [p, s] of Object.entries(files)) w(p, s);
  w('style.css', c.stale ? cssChanged : css);
  w('review/visual-result.json', JSON.stringify({scope: 'R4', verdict: 'PASS', reviewer: 'JOEDESIGN', reviewed_at: '2026-10-16', reviewed_style_sha256: sha(css)}, null, 2) + '\n');
  w('ROADMAP.md', roadmap(arm === 'G' ? '`node gate.mjs --claim visual` exits 0 on current inputs' : 'JOEDESIGN visual review'));
  w('AGENTS.md', '# Numeric Pocket\nKeep the utility local and dependency-free.\n\n<!-- JOENESS-SETUP:BEGIN -->\n' + bodies[arm] + '<!-- JOENESS-SETUP:END -->\n');
  git(root, 'init', '-q'); git(root, 'config', 'core.autocrlf', 'false');
  git(root, 'config', 'user.name', 'fixture'); git(root, 'config', 'user.email', 'fixture@example.invalid');
  git(root, 'add', '.'); git(root, 'commit', '-qm', 'baseline');
  trials.push({id, case: c.id, arm, rep, root, turns: [c.request]});
}
writeFileSync(join(here, 'trials5.json'), JSON.stringify(trials, null, 2));
for (const t of trials) {
  let out; try { out = execFileSync('node', ['gate.mjs'], {cwd: t.root, encoding: 'utf8'}); } catch (e) { out = e.stdout; }
  console.log(t.id, t.case, t.arm, out.trim().slice(0, 40));
}
