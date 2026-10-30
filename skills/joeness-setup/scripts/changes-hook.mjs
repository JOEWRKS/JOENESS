// Optional Claude Code hook. UserPromptSubmit: list commits that landed since the agent's last turn ended.
// Stop (--record): remember HEAD when the agent finishes, so its own commits are not reported back to it.
// Stdout becomes agent context; nothing is printed on the first message, with --record, or when HEAD did not move.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const dir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const git = (...a) => execFileSync('git', a, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
let head, state;
try {
  head = git('rev-parse', 'HEAD');
  state = join(git('rev-parse', '--absolute-git-dir'), 'joeness-last-head');
} catch { process.exit(0); }
let prev = '';
try { prev = readFileSync(state, 'utf8').trim(); } catch {}
try { writeFileSync(state, head + '\n'); } catch { process.exit(0); }
if (process.argv.includes('--record') || !prev || prev === head) process.exit(0);
let log = '', files = '';
try {
  log = git('log', '--oneline', '--no-decorate', `${prev}..${head}`);
  files = git('diff', '--name-only', prev, head);
} catch { process.exit(0); }
if (!log) process.exit(0);
process.stdout.write(
  `Commits since your previous turn ended:\n${log}\nFiles they changed:\n${files}\n` +
  'A check from an earlier turn that covers these files is out of date; run it again before relying on it.\n');
