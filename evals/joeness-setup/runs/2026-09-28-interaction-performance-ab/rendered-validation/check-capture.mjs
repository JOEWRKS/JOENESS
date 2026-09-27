import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const [beforePath, afterPath, expectedWidth, expectedHeight] = process.argv.slice(2);
assert.ok(beforePath && afterPath && expectedWidth && expectedHeight,
  'Usage: node check-capture.mjs before.png after.png width height');

function inspect(path) {
  const bytes = readFileSync(path);
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `${path}: PNG signature`);
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  assert.equal(width, Number(expectedWidth), `${path}: width`);
  assert.equal(height, Number(expectedHeight), `${path}: height`);
  assert.ok(bytes.length > 50_000, `${path}: capture is suspiciously small`);
  return { length: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
}

const before = inspect(beforePath);
const after = inspect(afterPath);
assert.notEqual(before.sha256, after.sha256, 'before and after frames are identical');
process.stdout.write(JSON.stringify({
  dimensions: `${expectedWidth}x${expectedHeight}`,
  before,
  after
}) + '\n');
