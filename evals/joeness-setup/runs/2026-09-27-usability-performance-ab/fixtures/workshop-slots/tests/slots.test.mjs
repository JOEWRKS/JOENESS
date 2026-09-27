import test from 'node:test';
import assert from 'node:assert/strict';
import {reserveSlot} from '../src/slots.mjs';

test('reservation requires an id and slot', () => {
  assert.throws(() => reserveSlot([], {id: '', slot: 'AM'}), /required/);
  assert.throws(() => reserveSlot([], {id: 'w-1', slot: ''}), /required/);
});

test('reservation creates a new list', () => {
  const existing = [];
  const result = reserveSlot(existing, {id: 'w-1', attendee: 'Mina', slot: 'AM'});
  assert.notStrictEqual(result, existing);
  assert.deepEqual(existing, []);
});
