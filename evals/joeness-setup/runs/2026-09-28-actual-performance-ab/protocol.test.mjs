import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRunId, tallyUsage, parseNUnitCases, gradeTestResults, normalizeHistoricalInstructions } from './protocol.mjs';

test('fixture normalization removes old pilot but preserves the project boundary and live-root isolation', () => {
  const input = '# Project\n- Root: D:\\JOEWRKS\\MergeDrop\n\n## JOENESS design pilot evaluation\n- old rule\n<!-- JOEWRKS-PROJECT:END -->\n';
  assert.equal(normalizeHistoricalInstructions(input), '# Project\n- Root: .\n\n<!-- JOEWRKS-PROJECT:END -->\n');
});

test('run identity keeps hyphenated case names and rejects malformed IDs', () => {
  assert.deepEqual(parseRunId('deferred-ranking-auth-r2-joeness'), {
    caseId: 'deferred-ranking-auth', repetition: 2, arm: 'joeness',
  });
  assert.throws(() => parseRunId('deferred-ranking-auth-joeness'), /Invalid run ID/);
});

test('token tally separates cache and counts a correction without hiding its cost', () => {
  assert.deepEqual(tallyUsage([
    { input_tokens: 120, cached_input_tokens: 80, output_tokens: 30 },
    { input_tokens: 50, cached_input_tokens: 10, output_tokens: 20 },
  ]), { input: 170, cachedInput: 90, output: 50, noncachedInputPlusOutput: 130 });
  assert.throws(() => tallyUsage([{ input_tokens: 1, cached_input_tokens: 2, output_tokens: 0 }]), /Invalid usage/);
});

test('NUnit parser reads actual case outcomes rather than parent-suite status', () => {
  const xml = '<test-run total="2" passed="1" failed="1"><test-suite result="Failed(Child)"><test-case fullname="A.Works" result="Passed" /><test-case result="Failed" fullname="B.Breaks"><failure><message>bad</message></failure></test-case></test-suite></test-run>';
  assert.deepEqual(parseNUnitCases(xml), [
    { fullname: 'A.Works', result: 'Passed' },
    { fullname: 'B.Breaks', result: 'Failed' },
  ]);
});

test('grade rejects a missing oracle even when the rest of the suite is green', () => {
  const oracle = [{ fullname: 'A.Oracle', result: 'Passed' }];
  const baseline = [{ fullname: 'A.Oracle', result: 'Passed' }, { fullname: 'B.OldFailure', result: 'Failed' }];
  const current = [{ fullname: 'B.OldFailure', result: 'Failed' }];
  const result = gradeTestResults(oracle, current, baseline, ['A.Oracle']);
  assert.equal(result.pass, false);
  assert.deepEqual(result.missingTests, ['A.Oracle']);
});

test('grade allows only exact pre-existing failures and catches new regressions', () => {
  const oracle = [{ fullname: 'A.Oracle', result: 'Passed' }];
  const baseline = [{ fullname: 'A.Oracle', result: 'Passed' }, { fullname: 'B.OldFailure', result: 'Failed' }];
  const good = [{ fullname: 'A.Oracle', result: 'Passed' }, { fullname: 'B.OldFailure', result: 'Failed' }];
  assert.equal(gradeTestResults(oracle, good, baseline, ['A.Oracle']).pass, true);
  const bad = [{ fullname: 'A.Oracle', result: 'Passed' }, { fullname: 'B.OldFailure', result: 'Failed' }, { fullname: 'C.NewFailure', result: 'Failed' }];
  const result = gradeTestResults(oracle, bad, baseline, ['A.Oracle']);
  assert.equal(result.pass, false);
  assert.deepEqual(result.newFailures, ['C.NewFailure']);
});

test('grade treats a newly skipped baseline test as an unverified regression', () => {
  const oracle = [{ fullname: 'A.Oracle', result: 'Passed' }];
  const baseline = [{ fullname: 'A.Oracle', result: 'Passed' }, { fullname: 'B.Existing', result: 'Passed' }];
  const current = [{ fullname: 'A.Oracle', result: 'Passed' }, { fullname: 'B.Existing', result: 'Skipped' }];
  const result = gradeTestResults(oracle, current, baseline, ['A.Oracle']);
  assert.equal(result.pass, false);
  assert.deepEqual(result.newFailures, ['B.Existing']);
});
