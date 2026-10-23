// Phase 4: C (filled branch template) vs L (C-lite) on 12 cases. Clones clean baselines from fx/.
import {readFileSync, writeFileSync, cpSync, existsSync} from 'node:fs';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';

const here = import.meta.dirname, fx = join(here, 'fx');
if (existsSync(join(here, 'trials4.json'))) throw Error('phase 4 already built');
const git = (cwd, ...a) => execFileSync('git', ['-C', cwd, ...a], {encoding: 'utf8'}).trim();
const prior = ['trials.json', 'trials2.json'].flatMap(f => JSON.parse(readFileSync(join(here, f), 'utf8')));
const bodies = {C: readFileSync(join(here, 'C2-body.md'), 'utf8'), L: readFileSync(join(here, 'L-body.md'), 'utf8')};
const trials = [];
for (const name of [...new Set(prior.map(t => t.case))].filter(c => c !== 'mt-issue')) {
  const src = prior.find(t => t.case === name);
  for (const arm of ['C', 'L']) for (const rep of [1, 2]) {
    const id = 't' + randomBytes(3).toString('hex'), root = join(fx, id);
    cpSync(join(fx, src.id), root, {recursive: true});
    git(root, 'reset', '-q', '--hard'); git(root, 'clean', '-qfd');
    writeFileSync(join(root, 'AGENTS.md'), '# Numeric Pocket\nKeep the utility local and dependency-free.\n\n<!-- JOENESS-SETUP:BEGIN -->\n' + bodies[arm] + '<!-- JOENESS-SETUP:END -->\n');
    git(root, 'commit', '-qam', 'baseline', '--amend');
    trials.push({id, case: name, arm, rep, root, turns: src.turns || [src.request]});
  }
}
writeFileSync(join(here, 'trials4.json'), JSON.stringify(trials, null, 2));
console.log(trials.map(t => `${t.id} ${t.case} ${t.turns.length}`).join('\n'));
