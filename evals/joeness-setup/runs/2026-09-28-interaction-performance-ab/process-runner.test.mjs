import test from 'node:test';
import assert from 'node:assert/strict';
import { runProcess } from './process-runner.mjs';

test('keeps Git warning stderr separate from content stdout', async () => {
  const result = await runProcess(process.execPath,
    ['-e', "process.stdout.write('content'); process.stderr.write('warning')"],
    process.cwd(), true);
  assert.equal(result.code, 0);
  assert.equal(result.stdout, 'content');
  assert.equal(result.stderr, 'warning');
});
