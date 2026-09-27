// Mechanically preserve the two fictional fixture diffs and independent test outputs.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)));
const sha = value => createHash('sha256').update(value).digest('hex');
for (const arm of ['old', 'new']) {
  const project = resolve(`D:/JOEWRKS/JOENESS-PlainLanguage-Coding-20260927/${arm}`);
  const result = JSON.parse(readFileSync(join(root, 'results', `coding-${arm}.json`), 'utf8'));
  const target = join(root, 'results', `coding-${arm}-capture.md`);
  if (existsSync(target)) throw new Error(`Capture already exists: ${arm}`);
  const git = (...args) => execFileSync('git', ['-C', project, ...args], {encoding:'utf8'}).trim();
  if (git('rev-parse', 'HEAD^{tree}') !== result.baselineTree) throw new Error(`Baseline changed: ${arm}`);
  if (git('status', '--porcelain=v1', '--untracked-files=all') !== result.statusAfter) throw new Error(`Working state changed: ${arm}`);
  const diff = git('diff', '--', 'src/shelf.mjs', 'tests/shelf.test.mjs', 'ROADMAP.md', 'ISSUES.md', 'HANDOFF.md');
  const proof = readFileSync(join(project, 'artifacts/attempt-01/local-check.md'), 'utf8');
  const test = execFileSync('node', ['--test', 'tests/shelf.test.mjs'], {cwd:project, encoding:'utf8'}).trim();
  writeFileSync(target, [
    `# Coding ${arm} — bounded fixture capture`,
    '',
    `Baseline Git tree: \`${result.baselineTree}\``,
    `Git diff SHA-256: \`${sha(diff)}\``,
    `Local-check SHA-256: \`${sha(proof)}\``,
    `Independent test output SHA-256: \`${sha(test)}\``,
    '',
    '## Git diff', '', '```diff', diff, '```',
    '', '## Untracked run evidence', '', '```text', proof.trim(), '```',
    '', '## Independent node test', '', '```text', test, '```', '',
  ].join('\n'));
  console.log(`${arm}: capture ${target}`);
}
