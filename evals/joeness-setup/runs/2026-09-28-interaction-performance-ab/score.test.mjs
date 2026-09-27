import test from 'node:test';
import assert from 'node:assert/strict';
import { meaningfulStateRestored, scoreInteraction } from './score.mjs';

const baseline = [{ fullname: 'Existing.Works', result: 'Passed' }];
const focused = [{ fullname: 'Interaction.VisibleResult', result: 'Passed' }];

test('passes when the visible interaction passes and the existing suite stays green', () => {
  assert.deepEqual(scoreInteraction(focused, baseline, baseline, ['Interaction.VisibleResult']), {
    pass: true, oraclePass: true, missingBaseline: [], newFailures: []
  });
});

test('rejects a missing or failed interaction even when existing tests pass', () => {
  assert.equal(scoreInteraction([], baseline, baseline, ['Interaction.VisibleResult']).pass, false);
  assert.equal(scoreInteraction([{ ...focused[0], result: 'Failed' }], baseline, baseline,
    ['Interaction.VisibleResult']).pass, false);
});

test('rejects new failure and missing baseline coverage', () => {
  assert.deepEqual(scoreInteraction(focused, [{ ...baseline[0], result: 'Failed' }], baseline,
    ['Interaction.VisibleResult']).newFailures, ['Existing.Works']);
  assert.deepEqual(scoreInteraction(focused, [], baseline,
    ['Interaction.VisibleResult']).missingBaseline, ['Existing.Works']);
});

test('ignores a Git status-only normalization but not a changed diff or untracked file', () => {
  assert.equal(meaningfulStateRestored(' M source.cs', ' M source.cs\n M setting.asset',
    'same diff', 'same diff', 'own.test.cs\n', 'own.test.cs\n'), true);
  assert.equal(meaningfulStateRestored('', '', 'before', 'after', '', ''), false);
  assert.equal(meaningfulStateRestored('', '', '', '', '', 'new.meta\n'), false);
});
