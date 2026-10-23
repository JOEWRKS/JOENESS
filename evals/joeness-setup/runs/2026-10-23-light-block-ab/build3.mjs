// Phase 3: arm C on the nine phase-1 cases. Clones each case's clean phase-1 baseline.
import {readFileSync, writeFileSync, cpSync, existsSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {execFileSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';

const here = import.meta.dirname;
if (existsSync(join(here, 'trials3.json'))) throw Error('phase 3 already built');
const t1 = JSON.parse(readFileSync(join(here, 'trials.json'), 'utf8'));
const git = (cwd, ...a) => execFileSync('git', ['-C', cwd, ...a], {encoding: 'utf8'}).trim();
const c = readFileSync(join(here, 'C-body.md'), 'utf8');
const trials = [];
for (const name of [...new Set(t1.map(t => t.case))]) {
  const src = t1.find(t => t.case === name);
  for (const rep of [1, 2]) {
    const id = 't' + randomBytes(3).toString('hex'), root = join(dirname(src.root), id);
    cpSync(src.root, root, {recursive: true});
    git(root, 'reset', '-q', '--hard'); git(root, 'clean', '-qfd');
    writeFileSync(join(root, 'AGENTS.md'), '# Numeric Pocket\nKeep the utility local and dependency-free.\n\n<!-- JOENESS-SETUP:BEGIN -->\n' + c + '<!-- JOENESS-SETUP:END -->\n');
    git(root, 'commit', '-qam', 'baseline', '--amend');
    trials.push({id, case: name, arm: 'C', rep, root, request: src.request});
  }
}
writeFileSync(join(here, 'trials3.json'), JSON.stringify(trials, null, 2));
console.log(trials.map(t => `${t.id} ${t.case}`).join('\n'));
