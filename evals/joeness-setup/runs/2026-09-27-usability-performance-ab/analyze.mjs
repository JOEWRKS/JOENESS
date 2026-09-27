// Aggregate only the bounded CLI result records, never the raw model rollout.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const records = readdirSync(join(root, 'results'))
  .filter(name => name.endsWith('.json'))
  .map(name => JSON.parse(readFileSync(join(root, 'results', name), 'utf8')));
if (records.length !== 24) throw new Error(`Expected 24 results; got ${records.length}`);
if (records.some(row => row.exitCode !== 0 || !row.usage || !row.runtime.threadId)) {
  throw new Error('Incomplete model result');
}
const hash = text => createHash('sha256').update(text).digest('hex');
if (records.some(row => hash(readFileSync(join(root, 'responses', `${row.id}.md`), 'utf8')) !== row.responseSha256)) {
  throw new Error('Response hash mismatch');
}

const totals = rows => rows.reduce((sum, row) => {
  sum.sessions += 1;
  sum.input += row.usage.input_tokens;
  sum.cached += row.usage.cached_input_tokens;
  sum.output += row.usage.output_tokens;
  sum.total += row.derived.inputPlusOutput;
  sum.noncached += row.derived.noncachedInputPlusOutput;
  sum.wallMs += row.wallMs;
  return sum;
}, { sessions: 0, input: 0, cached: 0, output: 0, total: 0, noncached: 0, wallMs: 0 });

const summary = {
  sessionCount: records.length,
  runtime: [...new Set(records.map(row => `${row.runtime.model}/${row.runtime.reasoningEffort}`))],
  allExitZero: records.every(row => row.exitCode === 0),
  allResponseHashesMatch: true,
  pairedPromptHashesEqual: ['reading-shelf', 'workshop-slots'].every(fixture =>
    ['S0', 'S1', 'S2', 'S3', 'S4', 'S5'].every(stage =>
      new Set(records.filter(row => row.fixture === fixture && row.stage === stage)
        .map(row => row.promptSha256)).size === 1)),
  byArm: {},
  byFixture: {},
  byStage: {},
  s4ReadOnly: records.filter(row => row.stage === 'S4').map(row => ({
    id: row.id, unchanged: row.statusBefore === row.statusAfter,
  })),
};
for (const arm of ['bare', 'joeness']) {
  summary.byArm[arm] = totals(records.filter(row => row.arm === arm));
}
for (const fixture of ['reading-shelf', 'workshop-slots']) {
  summary.byFixture[fixture] = {};
  for (const arm of ['bare', 'joeness']) {
    summary.byFixture[fixture][arm] = totals(records.filter(row => row.fixture === fixture && row.arm === arm));
  }
}
for (const stage of ['S0', 'S1', 'S2', 'S3', 'S4', 'S5']) {
  summary.byStage[stage] = {};
  for (const arm of ['bare', 'joeness']) {
    summary.byStage[stage][arm] = totals(records.filter(row => row.stage === stage && row.arm === arm));
  }
}
process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
