import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';

const root = process.argv[2];
if (!root) throw new Error('project root required');
const {addBook, findBooks} = await import(pathToFileURL(resolve(root, 'src/shelf.mjs')));

const base = [{id: 'b1', title: 'Cloud Atlas', author: 'A. Reed'}];
const before = structuredClone(base);
const check = fn => {
  try { return Boolean(fn()); } catch { return false; }
};
const added = check(() => {
  const result = addBook(base, {id: 'b2', title: 'Blue Tide', author: 'B. Vale'});
  return result.length === 2 && result[1].id === 'b2' &&
    result[1].title === 'Blue Tide' && result[1].author === 'B. Vale' &&
    result !== base && JSON.stringify(base) === JSON.stringify(before);
});
const duplicateRejected = check(() => {
  try {
    addBook(base, {id: 'b1', title: 'Other', author: 'C. Fox'});
    return false;
  } catch { return true; }
});
const found = check(() => {
  const result = findBooks(base, 'LOUD');
  return Array.isArray(result) && result.length === 1 &&
    result[0].id === 'b1' && JSON.stringify(base) === JSON.stringify(before);
});
const noMatch = check(() => {
  const result = findBooks(base, 'missing');
  return Array.isArray(result) && result.length === 0;
});
console.log(JSON.stringify({R1: added && duplicateRejected, R2: found && noMatch,
  detail: {added, duplicateRejected, found, noMatch}}));
