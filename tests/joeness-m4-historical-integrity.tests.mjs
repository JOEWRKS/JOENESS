import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { lstat, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PERSISTENCE_COMMIT = "8ab3ae8e1eac0db0d5eb823f4eb4821178a645b0";
const EXECUTION_HEAD = "11fd6c3597d3606eac8fce022d5c4da19c9f283f";
const PLAN = {
  path: "evals/skill-contracts/joeness-m4-direct-user-delegation-live-plan-v10.json",
  bytes: 5548,
  sha256: "4f3f61439c47dec7d63dabe0d91d864943a6b5af25c9028990ffbd84ccfa1584",
};
const EVIDENCE = {
  path: "evals/skill-contracts/joeness-m4-direct-user-delegation-live-v10-evidence.json",
  bytes: 9414,
  sha256: "49dc9c783446857a8328804a0ef131550387a504de7171636076622923743b92",
};
const ATTEMPT_INDEX = {
  path: "evals/skill-contracts/joeness-m4-direct-user-delegation-attempt-index-v10.json",
  bytes: 13674,
  sha256: "eb0837eac9dc91c85227995b229fd1ba5e12a05eca1abc587e252a374c84e584",
};
const BLOCKED_PATH =
  "evals/skill-contracts/joeness-m4-direct-user-delegation-live-v10-blocked.json";

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function workingTuple(tuple) {
  const bytes = await readFile(path.join(ROOT, ...tuple.path.split("/")));
  return { path: tuple.path, bytes: bytes.length, sha256: sha256(bytes) };
}

async function committedTuple(tuple) {
  const { stdout } = await execFileAsync(
    "git",
    ["show", `${PERSISTENCE_COMMIT}:${tuple.path}`],
    { cwd: ROOT, encoding: "buffer", maxBuffer: 1024 * 1024 },
  );
  return { path: tuple.path, bytes: stdout.length, sha256: sha256(stdout) };
}

test("persisted v10 semantic-pass artifacts retain exact working and commit identities", async () => {
  for (const tuple of [PLAN, EVIDENCE, ATTEMPT_INDEX]) {
    assert.deepEqual(await workingTuple(tuple), tuple);
    assert.deepEqual(await committedTuple(tuple), tuple);
    const stats = await lstat(path.join(ROOT, ...tuple.path.split("/")));
    assert.equal(stats.isFile(), true, tuple.path);
    assert.equal(stats.isSymbolicLink(), false, tuple.path);
    assert.equal(stats.nlink, 1, tuple.path);
  }

  await assert.rejects(
    lstat(path.join(ROOT, ...BLOCKED_PATH.split("/"))),
    { code: "ENOENT" },
  );
  await assert.rejects(
    execFileAsync("git", ["show", `${PERSISTENCE_COMMIT}:${BLOCKED_PATH}`], {
      cwd: ROOT,
      encoding: "buffer",
    }),
  );
});

test("v10 persistence commit and attempt index bind only the approved semantic-pass result", async () => {
  const { stdout: parent } = await execFileAsync(
    "git",
    ["rev-parse", `${PERSISTENCE_COMMIT}^`],
    { cwd: ROOT, encoding: "utf8" },
  );
  assert.equal(parent.trim(), EXECUTION_HEAD);

  const { stdout: changed } = await execFileAsync(
    "git",
    [
      "diff-tree",
      "--no-commit-id",
      "--name-status",
      "-r",
      "--no-renames",
      PERSISTENCE_COMMIT,
    ],
    { cwd: ROOT, encoding: "utf8" },
  );
  assert.deepEqual(
    changed.trim().split(/\r?\n/u),
    [`A\t${ATTEMPT_INDEX.path}`, `A\t${EVIDENCE.path}`],
  );

  const plan = JSON.parse(await readFile(path.join(ROOT, ...PLAN.path.split("/")), "utf8"));
  const evidence = JSON.parse(
    await readFile(path.join(ROOT, ...EVIDENCE.path.split("/")), "utf8"),
  );
  const index = JSON.parse(
    await readFile(path.join(ROOT, ...ATTEMPT_INDEX.path.split("/")), "utf8"),
  );

  assert.deepEqual(index.plan, PLAN);
  assert.deepEqual(index.evidenceArtifact, EVIDENCE);
  assert.deepEqual(index.blockedArtifact, { path: BLOCKED_PATH, status: "absent" });
  assert.deepEqual(index.predecessor, plan.predecessor);
  assert.deepEqual(index.executionSource, evidence.executionSource);
  assert.deepEqual(index.inputContract, evidence.inputContract);
  assert.deepEqual(index.resultBoundary, evidence.resultBoundary);
  assert.deepEqual(index.resultBoundary, plan.resultBoundary);
  assert.equal(index.disposition.directUserDelegationVerdict, "PASS-PINNED-FIXTURE");
  assert.equal(index.disposition.m4, "UNVALIDATED");
  assert.equal(index.disposition.promotionPass, false);
  assert.equal(index.disposition.sameCommandRetryAuthorized, false);
  assert.equal(index.disposition.additionalLiveAttemptAuthorized, false);
});
