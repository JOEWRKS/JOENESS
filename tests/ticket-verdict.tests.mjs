import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { summarizeTicketVerdicts } from '../evals/support/ticket-verdict.mjs';

const item = (id, verdict, required = true) => ({ id, required, verdict });

test('FAIL has precedence and preserves failed input order', () => {
  assert.deepEqual(
    summarizeTicketVerdicts([
      item('render', 'PASS'),
      item('save', 'FAIL'),
      item('deploy', 'UNVERIFIED'),
      item('restore', 'FAIL', false),
    ]),
    {
      state: 'REWORK',
      counts: { PASS: 1, FAIL: 2, UNVERIFIED: 1 },
      failedIds: ['save', 'restore'],
      unverifiedRequiredIds: ['deploy'],
    },
  );
});

test('required UNVERIFIED blocks acceptance when no criterion fails', () => {
  assert.equal(
    summarizeTicketVerdicts([
      item('unit', 'PASS'),
      item('runtime', 'UNVERIFIED'),
    ]).state,
    'UNVERIFIED',
  );
});

test('optional UNVERIFIED does not block acceptance', () => {
  assert.deepEqual(
    summarizeTicketVerdicts([
      item('required-check', 'PASS'),
      item('advisory-check', 'UNVERIFIED', false),
    ]),
    {
      state: 'ACCEPTED',
      counts: { PASS: 1, FAIL: 0, UNVERIFIED: 1 },
      failedIds: [],
      unverifiedRequiredIds: [],
    },
  );
});

test('empty criteria are accepted and input remains byte-for-byte stable', () => {
  const criteria = [item('one', 'PASS'), item('two', 'UNVERIFIED', false)];
  const before = JSON.stringify(criteria);
  assert.equal(summarizeTicketVerdicts([]).state, 'ACCEPTED');
  summarizeTicketVerdicts(criteria);
  assert.equal(JSON.stringify(criteria), before);
});

test('invalid criteria fail deterministically', () => {
  const invalidCases = [
    [null, /criteria must be an array/i],
    [[item('', 'PASS')], /non-empty id/i],
    [[item('same', 'PASS'), item('same', 'PASS')], /duplicate id: same/i],
    [[{ id: 'required', required: 'yes', verdict: 'PASS' }], /required must be boolean/i],
    [[item('verdict', 'MAYBE')], /invalid verdict: MAYBE/i],
  ];

  for (const [value, error] of invalidCases) {
    assert.throws(() => summarizeTicketVerdicts(value), error);
  }
});

test('ticket conditionally invokes Ponytail only as a bounded over-engineering audit', () => {
  const ticket = readFileSync(new URL('../skills/ticket/SKILL.md', import.meta.url), 'utf8');

  assert.match(ticket, /Ponytail.*(?:review|audit).*read-only/is);
  assert.match(ticket, /concrete.*(?:over-engineering|complexity).*risk.*abstraction.*framework.*dependenc.*layer.*generaliz/is);
  assert.match(ticket, /(?:unavailable|disabled).*not.*block/is);
  assert.match(ticket, /(?:cannot|must not).*add.*(?:scope|requirement|acceptance criter)/is);
  assert.match(ticket, /low-risk.*(?:skip|do not.*Ponytail)/is);
});
