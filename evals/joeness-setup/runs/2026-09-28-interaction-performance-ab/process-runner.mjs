import { spawn } from 'node:child_process';

export async function runProcess(file, args, cwd, capture = false) {
  return await new Promise((done, fail) => {
    const child = spawn(file, args, { cwd, windowsHide: true });
    child.stdin.end();
    const stdout = [];
    const stderr = [];
    child.stdout.on('data', chunk => { if (capture) stdout.push(chunk); });
    child.stderr.on('data', chunk => { if (capture) stderr.push(chunk); });
    child.on('error', fail);
    child.on('close', code => done({ code,
      stdout: Buffer.concat(stdout).toString('utf8'),
      stderr: Buffer.concat(stderr).toString('utf8') }));
  });
}
