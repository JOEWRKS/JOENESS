// UserPromptSubmit hook: before each user message, list commits that landed since the previous one.
// Stdout becomes context for the agent; it prints nothing on the first message or when HEAD did not move.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const git = (...a) => execFileSync('git', a, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
let head;
try { head = git('rev-parse', 'HEAD'); } catch { process.exit(0); }
const state = join(git('rev-parse', '--absolute-git-dir'), 'joeness-last-head');
let prev = '';
try { prev = readFileSync(state, 'utf8').trim(); } catch {}
writeFileSync(state, head + '\n');
if (!prev || prev === head) process.exit(0);
let log = '', files = '';
try {
  log = git('log', '--oneline', '--no-decorate', `${prev}..${head}`);
  files = git('diff', '--name-only', prev, head);
} catch { process.exit(0); }
if (!log) process.exit(0);
process.stdout.write(
  `Commits since the previous user message:\n${log}\nFiles they changed:\n${files}\n` +
  'A check from an earlier turn that covers these files is out of date; run it again before relying on it.\n');
