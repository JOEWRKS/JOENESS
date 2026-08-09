import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import * as lifecycleRunner from "../evals/support/run-project-aware-lean-ab.mjs";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const contractPath = path.join(
  repositoryRoot,
  "evals",
  "project-aware-lean",
  "contract-v1.json",
);
const runnerPath = path.join(
  repositoryRoot,
  "evals",
  "support",
  "run-project-aware-lean-ab.mjs",
);

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function runGit(args) {
  return execFileSync("git", args, { encoding: "utf8", stdio: "pipe" }).trim();
}

async function initializeRepository(root) {
  await mkdir(root);
  runGit(["init", "-b", "main", root]);
  await writeFile(path.join(root, "README.md"), "repository identity fixture\n");
  runGit(["-C", root, "add", "README.md"]);
  runGit([
    "-C",
    root,
    "-c",
    "user.name=JOEWRKS Harness",
    "-c",
    "user.email=harness@example.invalid",
    "commit",
    "-m",
    "fixture",
  ]);
}

async function removeVerifiedTempRoot(root) {
  const absoluteRoot = path.resolve(root);
  const absoluteTemp = path.resolve(tmpdir());
  const relation = path.relative(absoluteTemp, absoluteRoot);
  assert.ok(
    relation !== "" &&
      relation !== ".." &&
      !relation.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relation),
    "cleanup target must stay inside the OS temp root",
  );
  assert.match(path.basename(absoluteRoot), /^lean-repository-identity-/u);
  await rm(absoluteRoot, { recursive: true, force: true });
}

test("repository identity accepts linked worktrees from the same repository", async () => {
  const tempRoot = await mkdtemp(
    path.join(tmpdir(), "lean-repository-identity-"),
  );
  try {
    const main = path.join(tempRoot, "main");
    const linked = path.join(tempRoot, "linked");
    await initializeRepository(main);
    runGit(["-C", main, "worktree", "add", "-b", "linked", linked]);

    assert.equal(
      await lifecycleRunner.repositoryRootsMatch(main, linked),
      true,
    );
  } finally {
    await removeVerifiedTempRoot(tempRoot);
  }
});

test("repository identity rejects a foreign repository", async () => {
  const tempRoot = await mkdtemp(
    path.join(tmpdir(), "lean-repository-identity-"),
  );
  try {
    const first = path.join(tempRoot, "first");
    const foreign = path.join(tempRoot, "foreign");
    await initializeRepository(first);
    await initializeRepository(foreign);

    assert.equal(
      await lifecycleRunner.repositoryRootsMatch(first, foreign),
      false,
    );
  } finally {
    await removeVerifiedTempRoot(tempRoot);
  }
});

test("contract isolates the current Lean Core as the only arm difference", () => {
  const contract = readJson(contractPath);

  assert.deepEqual(contract.control, { agentsFile: "absent" });
  assert.equal(contract.candidate.activePath, "AGENTS.md");
  assert.equal(contract.candidate.bytes, 2976);
  assert.equal(
    contract.candidate.sha256,
    "3d97d20c4b76536068b18bbacd5805567967b6c25da920e48984ff666ed1e2be",
  );
  assert.equal(contract.runtime.shellEnabled, true);
  assert.equal(contract.runtime.networkAccess, false);
  assert.equal(contract.runtime.pluginsEnabled, false);
  assert.equal(contract.runtime.skillsEnabled, false);
  assert.equal(contract.runtime.appsEnabled, false);
  assert.equal(contract.runtime.multiAgentEnabled, false);
  assert.deepEqual(
    contract.phases.map(({ order }) => order),
    [
      ["control", "candidate"],
      ["candidate", "control"],
      ["control", "candidate"],
    ],
  );
});

test("smoke validates frozen candidate identity and the six-session contract without calling Codex", () => {
  const result = spawnSync(
    process.execPath,
    [runnerPath, "--smoke", "--contract", contractPath],
    { cwd: repositoryRoot, encoding: "utf8" },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "smoke-ok");
  assert.equal(output.evaluation, "project-aware-lean-ab-v1");
  assert.equal(output.candidateMatchesActive, false);
  assert.equal(output.candidateSha256, readJson(contractPath).candidate.sha256);
  assert.equal(output.phaseCount, 3);
  assert.equal(output.sessionCount, 6);
  assert.equal(output.codexCalled, false);
});

test("lifecycle invocation keeps the built-in shell but disables optional surfaces", () => {
  assert.equal(typeof lifecycleRunner.buildLifecycleCodexArgs, "function");
  const contract = readJson(contractPath);
  const args = lifecycleRunner.buildLifecycleCodexArgs(
    "C:\\eval\\workspace",
    "C:\\eval\\final.txt",
    contract,
  );

  assert.equal(args[0], "exec");
  assert.ok(args.includes("--ignore-user-config"));
  assert.ok(args.includes("--ephemeral"));
  assert.ok(args.includes("--json"));
  assert.ok(args.includes("workspace-write"));
  assert.ok(args.includes('approval_policy="never"'));
  assert.ok(args.includes("sandbox_workspace_write.network_access=false"));
  assert.ok(args.includes("plugins"));
  assert.ok(args.includes("apps"));
  assert.ok(args.includes("multi_agent"));
  assert.equal(args.includes("shell_tool"), false);
  assert.equal(args.includes("unified_exec"), false);
  assert.equal(args.includes("code_mode"), false);
  assert.equal(args.at(-1), "-");
});

test("result validation requires six fresh threads and stable arm workspaces", () => {
  assert.equal(typeof lifecycleRunner.validateRunEvidence, "function");
  const contract = readJson(contractPath);
  const sessions = contract.phases.flatMap((phase, phaseIndex) =>
    phase.order.map((arm, orderIndex) => ({
      phaseId: phase.id,
      phaseIndex,
      orderIndex,
      arm,
      prompt: phase.prompt,
      workspace: `D:/eval/${arm}`,
      status: "complete",
      threadId: `thread-${phaseIndex}-${arm}`,
      runtimeSignature: "runtime-v1",
      wallClockMs: 1000,
      usage: {
        inputTokens: 10,
        cachedInputTokens: 2,
        outputTokens: 3,
        reasoningOutputTokens: 1,
        totalTokens: 13,
      },
      commandExecutions: [],
      fileChangePaths: [],
      finalMessage: "done",
      beforeSnapshotSha256: `before-${phaseIndex}-${arm}`,
      afterSnapshotSha256: `after-${phaseIndex}-${arm}`,
    })),
  );
  const result = {
    schemaVersion: 1,
    evaluation: contract.evaluation,
    status: "complete",
    source: { beforeHead: "abc", afterHead: "abc", unchanged: true },
    candidate: {
      sha256: contract.candidate.sha256,
      matchesActive: true,
      protectedAfterRun: true,
    },
    sessions,
  };

  assert.doesNotThrow(() => lifecycleRunner.validateRunEvidence(result, contract));
  const duplicateThread = structuredClone(result);
  duplicateThread.sessions[1].threadId = duplicateThread.sessions[0].threadId;
  assert.throws(
    () => lifecycleRunner.validateRunEvidence(duplicateThread, contract),
    /fresh thread/,
  );
});

test("artifact snapshots exclude installed dependencies from authored-file limits", async () => {
  assert.equal(typeof lifecycleRunner.snapshotWorkspace, "function");
  const root = await mkdtemp(path.join(tmpdir(), "lean-snapshot-"));
  try {
    await mkdir(path.join(root, "src"));
    await mkdir(path.join(root, "node_modules", "dependency"), { recursive: true });
    await writeFile(path.join(root, "src", "app.js"), "export const app = true;\n");
    await writeFile(
      path.join(root, "node_modules", "dependency", "index.js"),
      "module.exports = {};\n",
    );
    const contract = structuredClone(readJson(contractPath));
    contract.workspace.fileLimit = 1;

    const snapshot = await lifecycleRunner.snapshotWorkspace(root, contract, false);

    assert.equal(snapshot.fileCount, 1);
    assert.deepEqual(Object.keys(snapshot.files), ["src/app.js"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
