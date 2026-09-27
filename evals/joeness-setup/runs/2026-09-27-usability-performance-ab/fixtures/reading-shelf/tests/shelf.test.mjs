import test from 'node:test';
import assert from 'node:assert/strict';
import {addBook, listBooks} from '../src/shelf.mjs';

test('listBooks returns distinct records without changing the input', () => {
  const books = [{id: 'b1', title: 'Cloud Atlas', author: 'A. Reed'}];
  assert.deepEqual(listBooks(books), books);
  assert.notStrictEqual(listBooks(books)[0], books[0]);
  assert.deepEqual(books, [{id: 'b1', title: 'Cloud Atlas', author: 'A. Reed'}]);
});

test('addBook keeps its existing title validation', () => {
  assert.throws(() => addBook([], {id: 'b2', title: ''}), /title required/);
});
