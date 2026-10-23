// Phase 12a: revised Q2 wording (R) on the workaround case, 4 runs.
import {readFileSync, writeFileSync, cpSync, existsSync} from 'node:fs';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';

const here = import.meta.dirname, fx = join(here, 'fx');
if (existsSync(join(here, 'trials12a.json'))) throw Error('phase 12a already built');
const git = (cwd, ...a) => execFileSync('git', ['-C', cwd, ...a], {encoding: 'utf8'}).trim();
const prior = JSON.parse(readFileSync(join(here, 'trials4.json'), 'utf8'));
const template = readFileSync(join(here, 'R12-template.md'), 'utf8');
const final = template.replace('Adapt paths and agreed scope before applying this body.\n', '')
  .replace('<exact source or undecided>', 'PRODUCT.md')
  .replace('<agreed scope>', 'routine results, checks, roadmap status and issues');
if (final.includes('<') && /<[a-z]/.test(final)) throw Error('unfilled placeholder');
writeFileSync(join(here, 'R12-body.md'), final);
const bodies = {R: final};
const trials = [];
for (const name of ['workaround']) {
  const src = prior.find(t => t.case === name);
  for (const arm of ['R']) for (const rep of [1, 2, 3, 4]) {
    const id = 't' + randomBytes(3).toString('hex'), root = join(fx, id);
    cpSync(src.root, root, {recursive: true});
    git(root, 'reset', '-q', '--hard'); git(root, 'clean', '-qfd');
    writeFileSync(join(root, 'AGENTS.md'), '# Numeric Pocket\nKeep the utility local and dependency-free.\n\n<!-- JOENESS-SETUP:BEGIN -->\n' + bodies[arm] + '<!-- JOENESS-SETUP:END -->\n');
    git(root, 'commit', '-qam', 'baseline', '--amend');
    trials.push({id, case: name, arm, rep, root, turns: src.turns});
  }
}
writeFileSync(join(here, 'trials12a.json'), JSON.stringify(trials, null, 2));
console.log(trials.map(t => `${t.id} ${t.case} ${t.arm} ${t.turns.length}`).join('\n'));
