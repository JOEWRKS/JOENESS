import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { createHash } from "node:crypto";
import { lstat, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);

const ROOT = path.resolve(import.meta.dirname, "..");
const MODULE_PATH = path.join(
  ROOT,
  "evals/support/run-joeness-m4-superpowers-live.mjs",
);

async function subject() {
  return import(`${pathToFileURL(MODULE_PATH).href}?t=${Date.now()}`);
}

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function tuple(pathValue, text) {
  return { path: pathValue, bytes: Buffer.byteLength(text), sha256: digest(text) };
}

function planFixture(implementationCommit = "a".repeat(40)) {
  return {
    schemaVersion: 1,
    id: "joeness-m4-superpowers-live-v1",
    date: "2026-08-14",
    attempt: { freshTurnCount: 1, retryCount: 0, automaticRetry: false },
    source: {
      planImplementationCommit: implementationCommit,
      runner: tuple("evals/support/run-joeness-m4-superpowers-eval.mjs", "runner"),
      liveWrapper: tuple("evals/support/run-joeness-m4-superpowers-live.mjs", "wrapper"),
      freshTurnAdapter: tuple("evals/support/run-fresh-evaluator-turn.mjs", "adapter"),
      collector: tuple("evals/support/collect-codex-app-server.mjs", "collector"),
      fixtureManifest: tuple("evals/skill-contracts/fixtures/joeness-m4-superpowers-v1/manifest.json", "manifest"),
    },
    runtime: {
      codexVersion: "codex-cli 0.146.0",
      projectDocs: "disabled",
      installedPluginActivation: "UNVERIFIED",
      dynamicTools: [],
    },
    outputs: {
      raw: "evals/skill-contracts/joeness-m4-superpowers-live-v1-raw.json",
      evidence: "evals/skill-contracts/joeness-m4-superpowers-live-v1-evidence.json",
      blocked: "evals/skill-contracts/joeness-m4-superpowers-live-v1-blocked.json",
    },
    resultBoundary: {
      state: "candidate",
      validation: "unvalidated",
      promotionPass: false,
      corePromotion: false,
      manifestPromotion: false,
    },
  };
}

async function writeRelative(root, relativePath, text) {
  const target = path.join(root, ...relativePath.split("/"));
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, text, "utf8");
}

async function git(root, args) {
  const { stdout } = await execFile("git", args, { cwd: root, encoding: "utf8" });
  return stdout.trim();
}

async function committedPlanRepo(t) {
  const root = await mkdtemp(path.join(tmpdir(), "joeness-m4-live-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await git(root, ["init", "--quiet"]);
  await git(root, ["config", "user.name", "M4 Test"]);
  await git(root, ["config", "user.email", "m4@example.invalid"]);
  const sourceTexts = {
    runner: "runner",
    liveWrapper: "wrapper",
    freshTurnAdapter: "adapter",
    collector: "collector",
    fixtureManifest: "manifest",
  };
  const draft = planFixture();
  for (const [role, text] of Object.entries(sourceTexts)) {
    await writeRelative(root, draft.source[role].path, text);
  }
  await mkdir(path.join(root, "evals/skill-contracts"), { recursive: true });
  await git(root, ["add", "."]);
  await git(root, ["commit", "--quiet", "-m", "B implementation"]);
  const implementationCommit = await git(root, ["rev-parse", "HEAD"]);
  const plan = planFixture(implementationCommit);
  await writeRelative(root, "evals/skill-contracts/joeness-m4-superpowers-live-plan-v1.json", `${JSON.stringify(plan, null, 2)}\n`);
  await git(root, ["add", "."]);
  await git(root, ["commit", "--quiet", "-m", "C plan only"]);
  const executionHead = await git(root, ["rev-parse", "HEAD"]);
  return { root, plan, implementationCommit, executionHead };
}

test("exports the committed-plan live wrapper boundary", async () => {
  const api = await subject();
  assert.equal(api.JOENESS_M4_LIVE_RUN_ID, "joeness-m4-superpowers-live-v1");
  assert.equal(api.JOENESS_M4_CODEX_VERSION, "codex-cli 0.146.0");
  for (const name of [
    "validateJoenessM4LivePlan",
    "snapshotJoenessM4SourceConfig",
    "verifyJoenessM4ExecutionBoundary",
    "preflightJoenessM4Live",
    "createJoenessM4DefaultRuntime",
    "runJoenessM4Live",
    "parseJoenessM4LiveCli",
  ]) {
    assert.equal(typeof api[name], "function", name);
  }
});

test("live plan validator freezes one turn, retry zero, Codex 0.146, and no promotion", async () => {
  const api = await subject();
  const valid = planFixture();
  assert.deepEqual(api.validateJoenessM4LivePlan(valid), valid);
  for (const mutate of [
    (value) => { value.attempt.freshTurnCount = 2; },
    (value) => { value.attempt.retryCount = 1; },
    (value) => { value.attempt.automaticRetry = true; },
    (value) => { value.runtime.codexVersion = "codex-cli 0.145.0"; },
    (value) => { value.runtime.dynamicTools = ["tool"]; },
    (value) => { value.resultBoundary.promotionPass = true; },
    (value) => { value.source.extra = true; },
  ]) {
    const invalid = structuredClone(valid);
    mutate(invalid);
    assert.throws(() => api.validateJoenessM4LivePlan(invalid), /plan|attempt|runtime|promotion|source|key/i);
  }
});

test("execution boundary binds clean C to its direct B parent and identical B/C/current sources", async (t) => {
  const api = await subject();
  const fixture = await committedPlanRepo(t);
  const result = await api.verifyJoenessM4ExecutionBoundary({
    repositoryRoot: fixture.root,
    planPath: "evals/skill-contracts/joeness-m4-superpowers-live-plan-v1.json",
  });
  assert.equal(result.plan.source.planImplementationCommit, fixture.implementationCommit);
  assert.deepEqual(result.executionSource, {
    planImplementationCommit: fixture.implementationCommit,
    executionHead: fixture.executionHead,
    executionHeadParent: fixture.implementationCommit,
    plan: result.executionSource.plan,
    implementationSourcesMatchBAndC: true,
  });
  assert.equal(result.executionSource.plan.path, "evals/skill-contracts/joeness-m4-superpowers-live-plan-v1.json");
  assert.equal(result.executionSource.plan.bytes > 0, true);
  assert.match(result.executionSource.plan.sha256, /^[0-9a-f]{64}$/);
  assert.equal(result.outputsAbsent, true);
});

test("Git tree presence distinguishes a missing path from an invalid commit", async (t) => {
  const api = await subject();
  const fixture = await committedPlanRepo(t);
  assert.equal(await api.gitBlobExists(
    fixture.root,
    fixture.executionHead,
    "evals/skill-contracts/not-present.json",
  ), false);
  assert.equal(await api.gitBlobExists(
    fixture.root,
    fixture.executionHead,
    fixture.plan.source.runner.path,
  ), true);
  await assert.rejects(
    api.gitBlobExists(
      fixture.root,
      "f".repeat(40),
      fixture.plan.source.runner.path,
    ),
    /git|tree|object|revision|commit/i,
  );
});

test("execution boundary rejects an intermediate commit after plan C", async (t) => {
  const api = await subject();
  const fixture = await committedPlanRepo(t);
  await git(fixture.root, ["commit", "--quiet", "--allow-empty", "-m", "intermediate"]);
  await assert.rejects(
    api.verifyJoenessM4ExecutionBoundary({
      repositoryRoot: fixture.root,
      planPath: "evals/skill-contracts/joeness-m4-superpowers-live-plan-v1.json",
    }),
    /direct single-parent child/i,
  );
});

test("execution boundary rejects a merge execution head", async (t) => {
  const api = await subject();
  const fixture = await committedPlanRepo(t);
  const mainBranch = await git(fixture.root, ["branch", "--show-current"]);
  await git(fixture.root, ["branch", "side", fixture.implementationCommit]);
  await git(fixture.root, ["switch", "--quiet", "side"]);
  await git(fixture.root, ["commit", "--quiet", "--allow-empty", "-m", "side"]);
  await git(fixture.root, ["switch", "--quiet", mainBranch]);
  await git(fixture.root, ["merge", "--quiet", "--no-ff", "side", "-m", "merge"]);
  await assert.rejects(
    api.verifyJoenessM4ExecutionBoundary({
      repositoryRoot: fixture.root,
      planPath: "evals/skill-contracts/joeness-m4-superpowers-live-plan-v1.json",
    }),
    /direct single-parent child/i,
  );
});

test("execution boundary rejects a non-plan file in C", async (t) => {
  const api = await subject();
  const fixture = await committedPlanRepo(t);
  await writeRelative(fixture.root, "unexpected.txt", "extra");
  await git(fixture.root, ["add", "unexpected.txt"]);
  await git(fixture.root, ["commit", "--quiet", "--amend", "--no-edit"]);
  await assert.rejects(
    api.verifyJoenessM4ExecutionBoundary({
      repositoryRoot: fixture.root,
      planPath: "evals/skill-contracts/joeness-m4-superpowers-live-plan-v1.json",
    }),
    /plan-only/i,
  );
});

test("execution boundary rejects a source tuple drift in the plan", async (t) => {
  const api = await subject();
  const fixture = await committedPlanRepo(t);
  fixture.plan.source.runner.sha256 = digest("not-the-runner");
  await writeRelative(
    fixture.root,
    "evals/skill-contracts/joeness-m4-superpowers-live-plan-v1.json",
    `${JSON.stringify(fixture.plan, null, 2)}\n`,
  );
  await git(fixture.root, ["add", "evals/skill-contracts/joeness-m4-superpowers-live-plan-v1.json"]);
  await git(fixture.root, ["commit", "--quiet", "--amend", "--no-edit"]);
  await assert.rejects(
    api.verifyJoenessM4ExecutionBoundary({
      repositoryRoot: fixture.root,
      planPath: "evals/skill-contracts/joeness-m4-superpowers-live-plan-v1.json",
    }),
    /source runner pin drift/i,
  );
});

test("execution boundary rejects an ignored output symlink", async (t) => {
  const api = await subject();
  const fixture = await committedPlanRepo(t);
  const outside = path.join(fixture.root, "outside-output.json");
  await writeFile(outside, "outside", "utf8");
  await writeFile(
    path.join(fixture.root, ".git", "info", "exclude"),
    `${fixture.plan.outputs.raw}\noutside-output.json\n`,
    "utf8",
  );
  const target = path.join(fixture.root, ...fixture.plan.outputs.raw.split("/"));
  await symlink(outside, target, "file");
  assert.equal(await git(fixture.root, ["status", "--porcelain"]), "");
  await assert.rejects(
    api.verifyJoenessM4ExecutionBoundary({
      repositoryRoot: fixture.root,
      planPath: "evals/skill-contracts/joeness-m4-superpowers-live-plan-v1.json",
    }),
    /output.*collision|symlink/i,
  );
});

test("source config snapshot retains only byte length and digest and rejects a symlink", async (t) => {
  const api = await subject();
  const root = await mkdtemp(path.join(tmpdir(), "joeness-m4-config-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(path.join(root, "config.toml"), "[features]\nplugins = false\n", "utf8");
  assert.deepEqual(await api.snapshotJoenessM4SourceConfig({ sourceCodexHome: root }), {
    bytes: 27,
    sha256: digest("[features]\nplugins = false\n"),
  });
  const outside = path.join(root, "outside.toml");
  await writeFile(outside, "secret", "utf8");
  await rm(path.join(root, "config.toml"));
  await symlink(outside, path.join(root, "config.toml"), "file");
  await assert.rejects(
    api.snapshotJoenessM4SourceConfig({ sourceCodexHome: root }),
    /config|symlink|regular/i,
  );
});

test("default collector runtime rejects a different source Codex home before create or prepare", async (t) => {
  const api = await subject();
  const root = await mkdtemp(path.join(tmpdir(), "joeness-m4-home-mismatch-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const sourceCodexHome = path.join(root, "different-codex-home");
  const runParent = path.join(root, "runs");
  await mkdir(sourceCodexHome);
  await mkdir(runParent);
  await writeFile(path.join(sourceCodexHome, "config.toml"), "plugins = false\n", "utf8");
  let createCount = 0;
  await assert.rejects(
    api.createJoenessM4DefaultRuntime({
      plan: planFixture(),
      repositoryRoot: root,
      sourceCodexHome,
      runParent,
      cleanupState: {},
      operations: {
        createExclusiveRunRoot: async () => {
          createCount += 1;
          throw new Error("create must not run");
        },
        prepareRuntime: undefined,
        openAppServer: async () => {},
        removeIsolatedCodexHome: async () => {},
        removeRunRoot: async () => {},
      },
    }),
    /source Codex home.*collector/i,
  );
  assert.equal(createCount, 0);
});

test("default runtime uses Codex 0.146 once and proves process, isolated home, and run-root cleanup", async (t) => {
  const api = await subject();
  const root = await mkdtemp(path.join(tmpdir(), "joeness-m4-runtime-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const sourceCodexHome = path.join(root, "codex-home");
  const runParent = path.join(root, "runs");
  await mkdir(sourceCodexHome, { recursive: true });
  await mkdir(runParent, { recursive: true });
  await writeFile(path.join(sourceCodexHome, "config.toml"), "plugins = false\n", "utf8");
  const calls = { create: 0, prepare: 0, open: 0, close: 0, removeHome: 0, removeRoot: 0 };
  let processCloseConfirmed = false;
  let processExitCode = null;
  const cleanupState = {};
  const runtime = await api.createJoenessM4DefaultRuntime({
    plan: planFixture(),
    repositoryRoot: root,
    sourceCodexHome,
    runParent,
    cleanupState,
    operations: {
      createExclusiveRunRoot: async (runId, parent) => {
        calls.create += 1;
        assert.equal(runId, "joeness-m4-superpowers-live-v1");
        const runRoot = path.join(parent, `joewrks-eval-${runId}`);
        await mkdir(runRoot);
        return runRoot;
      },
      prepareRuntime: async (runRoot, options) => {
        calls.prepare += 1;
        assert.deepEqual(options, { expectedCodexVersion: "codex-cli 0.146.0" });
        const isolatedCodexHome = path.join(sourceCodexHome, ".eval-runtime", `${path.basename(runRoot)}-controller-codex-home`);
        await mkdir(isolatedCodexHome, { recursive: true });
        return { runRoot, isolatedCodexHome, version: "codex-cli 0.146.0" };
      },
      openAppServer: async () => {
        calls.open += 1;
        const session = {
          async close() {
            calls.close += 1;
            processCloseConfirmed = true;
            processExitCode = 0;
          },
        };
        Object.defineProperties(session, {
          processCloseConfirmed: { enumerable: true, get: () => processCloseConfirmed },
          processExitCode: { enumerable: true, get: () => processExitCode },
        });
        return session;
      },
      removeIsolatedCodexHome: async (_runRoot, isolatedCodexHome) => {
        calls.removeHome += 1;
        await rm(isolatedCodexHome, { recursive: true, force: false });
      },
      removeRunRoot: async (runRoot) => {
        calls.removeRoot += 1;
        await rm(runRoot, { recursive: true, force: false });
      },
    },
  });
  assert.deepEqual(runtime.sourceConfigBefore, {
    bytes: 16,
    sha256: digest("plugins = false\n"),
  });
  await runtime.finish(true);
  assert.deepEqual(calls, { create: 1, prepare: 1, open: 1, close: 1, removeHome: 1, removeRoot: 1 });
  assert.deepEqual(cleanupState.receipt, {
    appServerLaunchCount: 1,
    appServerCloseConfirmedCount: 1,
    remainingOwnedProcessCount: 0,
    isolatedCodexHomeReadback: "absent",
    runRootReadback: "absent",
  });
  assert.deepEqual(await runtime.readSourceConfig(), runtime.sourceConfigBefore);
});

test("default runtime cleans a partial factory only after launch close is confirmed", async (t) => {
  const api = await subject();
  const root = await mkdtemp(path.join(tmpdir(), "joeness-m4-partial-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const sourceCodexHome = path.join(root, "codex-home");
  const runParent = path.join(root, "runs");
  await mkdir(sourceCodexHome, { recursive: true });
  await mkdir(runParent, { recursive: true });
  await writeFile(path.join(sourceCodexHome, "config.toml"), "plugins = false\n", "utf8");
  let runRoot;
  let isolatedCodexHome;
  const cleanupState = {};
  await assert.rejects(
    api.createJoenessM4DefaultRuntime({
      plan: planFixture(),
      repositoryRoot: root,
      sourceCodexHome,
      runParent,
      cleanupState,
      operations: {
        createExclusiveRunRoot: async () => {
          runRoot = path.join(runParent, "joewrks-eval-joeness-m4-superpowers-live-v1");
          await mkdir(runRoot);
          return runRoot;
        },
        prepareRuntime: async () => {
          isolatedCodexHome = path.join(sourceCodexHome, ".eval-runtime", "partial-controller-codex-home");
          await mkdir(isolatedCodexHome, { recursive: true });
          return { runRoot, isolatedCodexHome, version: "codex-cli 0.146.0" };
        },
        openAppServer: async () => {
          const error = new Error("launch failed");
          error.ticketEvidence = { appServer: { processCloseConfirmed: true, processExitCode: 1 } };
          throw error;
        },
        removeIsolatedCodexHome: async (_runRoot, target) => rm(target, { recursive: true, force: false }),
        removeRunRoot: async (target) => rm(target, { recursive: true, force: false }),
      },
    }),
    /launch failed/,
  );
  await assert.rejects(lstat(isolatedCodexHome), { code: "ENOENT" });
  await assert.rejects(lstat(runRoot), { code: "ENOENT" });
  assert.deepEqual(cleanupState.receipt, {
    appServerLaunchCount: 1,
    appServerCloseConfirmedCount: 1,
    remainingOwnedProcessCount: 0,
    isolatedCodexHomeReadback: "absent",
    runRootReadback: "absent",
  });
  assert.deepEqual(cleanupState.sourceConfigAfter, cleanupState.sourceConfigBefore);
});

test("hostile ticket evidence accessors and proxies are trap-zero and treated as unconfirmed", async (t) => {
  const api = await subject();
  for (const kind of ["accessor", "proxy"]) {
    const root = await mkdtemp(path.join(tmpdir(), `joeness-m4-ticket-${kind}-`));
    t.after(() => rm(root, { recursive: true, force: true }));
    const sourceCodexHome = path.join(root, "codex-home");
    const runParent = path.join(root, "runs");
    await mkdir(sourceCodexHome, { recursive: true });
    await mkdir(runParent, { recursive: true });
    await writeFile(path.join(sourceCodexHome, "config.toml"), "plugins = false\n", "utf8");
    let trapCount = 0;
    let removeCount = 0;
    const cleanupState = {};
    await assert.rejects(
      api.createJoenessM4DefaultRuntime({
        plan: planFixture(),
        repositoryRoot: root,
        sourceCodexHome,
        runParent,
        cleanupState,
        operations: {
          createExclusiveRunRoot: async () => {
            const runRoot = path.join(runParent, "joewrks-eval-joeness-m4-superpowers-live-v1");
            await mkdir(runRoot);
            return runRoot;
          },
          prepareRuntime: async (runRoot) => {
            const isolatedCodexHome = path.join(sourceCodexHome, ".eval-runtime", `${kind}-controller-codex-home`);
            await mkdir(isolatedCodexHome, { recursive: true });
            return { runRoot, isolatedCodexHome, version: "codex-cli 0.146.0" };
          },
          openAppServer: async () => {
            const error = new Error(`hostile ${kind}`);
            if (kind === "accessor") {
              Object.defineProperty(error, "ticketEvidence", {
                get() {
                  trapCount += 1;
                  return { appServer: { processCloseConfirmed: true } };
                },
              });
            } else {
              error.ticketEvidence = new Proxy({}, {
                get() {
                  trapCount += 1;
                  return { processCloseConfirmed: true };
                },
              });
            }
            throw error;
          },
          removeIsolatedCodexHome: async () => { removeCount += 1; },
          removeRunRoot: async () => { removeCount += 1; },
        },
      }),
      new RegExp(`hostile ${kind}`),
    );
    assert.equal(trapCount, 0, kind);
    assert.equal(removeCount, 0, kind);
    assert.equal(cleanupState.receipt, undefined, kind);
  }
});

test("default runtime cleans the deterministic isolated home after prepare fails before return", async (t) => {
  const api = await subject();
  const root = await mkdtemp(path.join(tmpdir(), "joeness-m4-prepare-fail-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const sourceCodexHome = path.join(root, "codex-home");
  const runParent = path.join(root, "runs");
  await mkdir(sourceCodexHome, { recursive: true });
  await mkdir(runParent, { recursive: true });
  await writeFile(path.join(sourceCodexHome, "config.toml"), "plugins = false\n", "utf8");
  let runRoot;
  let isolatedCodexHome;
  const cleanupState = {};
  await assert.rejects(
    api.createJoenessM4DefaultRuntime({
      plan: planFixture(),
      repositoryRoot: root,
      sourceCodexHome,
      runParent,
      cleanupState,
      operations: {
        createExclusiveRunRoot: async () => {
          runRoot = path.join(runParent, "joewrks-eval-joeness-m4-superpowers-live-v1");
          await mkdir(runRoot);
          return runRoot;
        },
        prepareRuntime: async () => {
          isolatedCodexHome = path.join(
            sourceCodexHome,
            ".eval-runtime",
            `${path.basename(runRoot)}-controller-codex-home`,
          );
          await mkdir(isolatedCodexHome, { recursive: true });
          throw new Error("prepare failed");
        },
        openAppServer: async () => { throw new Error("must not launch"); },
        removeIsolatedCodexHome: async (_root, target) => rm(target, { recursive: true, force: false }),
        removeRunRoot: async (target) => rm(target, { recursive: true, force: false }),
      },
    }),
    /prepare failed/,
  );
  await assert.rejects(lstat(isolatedCodexHome), { code: "ENOENT" });
  await assert.rejects(lstat(runRoot), { code: "ENOENT" });
  assert.deepEqual(cleanupState.receipt, {
    appServerLaunchCount: 0,
    appServerCloseConfirmedCount: 0,
    remainingOwnedProcessCount: 0,
    isolatedCodexHomeReadback: "absent",
    runRootReadback: "absent",
  });
});

test("default runtime retains owned state when process close cannot be confirmed", async (t) => {
  const api = await subject();
  const root = await mkdtemp(path.join(tmpdir(), "joeness-m4-unconfirmed-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const sourceCodexHome = path.join(root, "codex-home");
  const runParent = path.join(root, "runs");
  await mkdir(sourceCodexHome, { recursive: true });
  await mkdir(runParent, { recursive: true });
  await writeFile(path.join(sourceCodexHome, "config.toml"), "plugins = false\n", "utf8");
  let runRoot;
  let isolatedCodexHome;
  let removeCount = 0;
  const cleanupState = {};
  const runtime = await api.createJoenessM4DefaultRuntime({
    plan: planFixture(),
    repositoryRoot: root,
    sourceCodexHome,
    runParent,
    cleanupState,
    operations: {
      createExclusiveRunRoot: async () => {
        runRoot = path.join(runParent, "joewrks-eval-joeness-m4-superpowers-live-v1");
        await mkdir(runRoot);
        return runRoot;
      },
      prepareRuntime: async () => {
        isolatedCodexHome = path.join(sourceCodexHome, ".eval-runtime", "unconfirmed-controller-codex-home");
        await mkdir(isolatedCodexHome, { recursive: true });
        return { runRoot, isolatedCodexHome, version: "codex-cli 0.146.0" };
      },
      openAppServer: async () => ({
        processCloseConfirmed: false,
        processExitCode: null,
        close: async () => {},
      }),
      removeIsolatedCodexHome: async () => { removeCount += 1; },
      removeRunRoot: async () => { removeCount += 1; },
    },
  });
  await assert.rejects(runtime.finish(true), /close.*confirmed/i);
  assert.equal(removeCount, 0);
  assert.equal((await lstat(isolatedCodexHome)).isDirectory(), true);
  assert.equal((await lstat(runRoot)).isDirectory(), true);
  assert.equal(cleanupState.receipt, undefined);
});

test("default runtime still cleans owned state when close reports an error after confirmed process exit", async (t) => {
  const api = await subject();
  const root = await mkdtemp(path.join(tmpdir(), "joeness-m4-close-error-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const sourceCodexHome = path.join(root, "codex-home");
  const runParent = path.join(root, "runs");
  await mkdir(sourceCodexHome, { recursive: true });
  await mkdir(runParent, { recursive: true });
  await writeFile(path.join(sourceCodexHome, "config.toml"), "plugins = false\n", "utf8");
  let runRoot;
  let isolatedCodexHome;
  let removeCount = 0;
  const cleanupState = {};
  const runtime = await api.createJoenessM4DefaultRuntime({
    plan: planFixture(),
    repositoryRoot: root,
    sourceCodexHome,
    runParent,
    cleanupState,
    operations: {
      createExclusiveRunRoot: async () => {
        runRoot = path.join(runParent, "joewrks-eval-joeness-m4-superpowers-live-v1");
        await mkdir(runRoot);
        return runRoot;
      },
      prepareRuntime: async () => {
        isolatedCodexHome = path.join(sourceCodexHome, ".eval-runtime", "close-error-controller-codex-home");
        await mkdir(isolatedCodexHome, { recursive: true });
        return { runRoot, isolatedCodexHome, version: "codex-cli 0.146.0" };
      },
      openAppServer: async () => ({
        processCloseConfirmed: true,
        processExitCode: 0,
        close: async () => { throw new Error("close transport error"); },
      }),
      removeIsolatedCodexHome: async (_root, target) => {
        removeCount += 1;
        await rm(target, { recursive: true, force: false });
      },
      removeRunRoot: async (target) => {
        removeCount += 1;
        await rm(target, { recursive: true, force: false });
      },
    },
  });
  await assert.rejects(runtime.finish(true), /close transport error/);
  assert.equal(removeCount, 2);
  await assert.rejects(lstat(isolatedCodexHome), { code: "ENOENT" });
  await assert.rejects(lstat(runRoot), { code: "ENOENT" });
  assert.deepEqual(cleanupState.sourceConfigAfter, cleanupState.sourceConfigBefore);
});

test("cleanup attempts both owned roots and config readback independently and aggregates every failure", async (t) => {
  const api = await subject();
  const root = await mkdtemp(path.join(tmpdir(), "joeness-m4-cleanup-errors-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const sourceCodexHome = path.join(root, "codex-home");
  const runParent = path.join(root, "runs");
  await mkdir(sourceCodexHome, { recursive: true });
  await mkdir(runParent, { recursive: true });
  await writeFile(path.join(sourceCodexHome, "config.toml"), "plugins = false\n", "utf8");
  let runRoot;
  let isolatedCodexHome;
  let removeHomeCount = 0;
  let removeRootCount = 0;
  const cleanupState = {};
  const runtime = await api.createJoenessM4DefaultRuntime({
    plan: planFixture(),
    repositoryRoot: root,
    sourceCodexHome,
    runParent,
    cleanupState,
    operations: {
      createExclusiveRunRoot: async () => {
        runRoot = path.join(runParent, "joewrks-eval-joeness-m4-superpowers-live-v1");
        await mkdir(runRoot);
        return runRoot;
      },
      prepareRuntime: async () => {
        isolatedCodexHome = path.join(sourceCodexHome, ".eval-runtime", "cleanup-errors-controller-codex-home");
        await mkdir(isolatedCodexHome, { recursive: true });
        return { runRoot, isolatedCodexHome, version: "codex-cli 0.146.0" };
      },
      openAppServer: async () => ({
        processCloseConfirmed: true,
        processExitCode: 0,
        close: async () => {},
      }),
      removeIsolatedCodexHome: async () => {
        removeHomeCount += 1;
        throw new Error("isolated removal failed");
      },
      removeRunRoot: async () => {
        removeRootCount += 1;
        throw new Error("run-root removal failed");
      },
    },
  });
  await rm(path.join(sourceCodexHome, "config.toml"));
  let caught;
  try { await runtime.finish(true); } catch (error) { caught = error; }
  assert.equal(caught instanceof AggregateError, true);
  assert.equal(caught.errors.length, 5);
  assert.deepEqual(caught.errors.slice(0, 4).map((error) => error.message), [
    "isolated removal failed",
    "M4 isolated Codex home cleanup readback failed",
    "run-root removal failed",
    "M4 run-root cleanup readback failed",
  ]);
  assert.match(caught.errors[4].message, /config|ENOENT|no such/i);
  assert.equal(removeHomeCount, 1);
  assert.equal(removeRootCount, 1);
  assert.equal(cleanupState.receipt, undefined);
});

test("live wrapper revalidates C before success publication and separates B/C provenance", async (t) => {
  const api = await subject();
  const fixture = await committedPlanRepo(t);
  const temp = await mkdtemp(path.join(tmpdir(), "joeness-m4-wrapper-"));
  t.after(() => rm(temp, { recursive: true, force: true }));
  const sourceCodexHome = path.join(temp, "codex-home");
  const runParent = path.join(temp, "runs");
  await mkdir(sourceCodexHome);
  await mkdir(runParent);
  await writeFile(path.join(sourceCodexHome, "config.toml"), "plugins = false\n", "utf8");
  const configTuple = { bytes: 16, sha256: digest("plugins = false\n") };
  const cleanupReceipt = {
    appServerLaunchCount: 1,
    appServerCloseConfirmedCount: 1,
    remainingOwnedProcessCount: 0,
    isolatedCodexHomeReadback: "absent",
    runRootReadback: "absent",
  };
  const calls = { verify: 0, preflight: 0, evaluator: 0, runtime: 0, success: 0, blocked: 0 };
  let publication;
  const result = await api.runJoenessM4Live({
    repositoryRoot: fixture.root,
    planPath: "evals/skill-contracts/joeness-m4-superpowers-live-plan-v1.json",
    sourceCodexHome,
    runParent,
    operations: {
      verifyExecutionBoundary: async (options) => {
        calls.verify += 1;
        return api.verifyJoenessM4ExecutionBoundary(options);
      },
      preflightEvaluator: async () => {
        calls.preflight += 1;
        return { manifest: { id: "joeness-m4-superpowers-v1" } };
      },
      createRuntime: async (options) => {
        calls.runtime += 1;
        options.cleanupState.sourceConfigBefore = configTuple;
        options.cleanupState.sourceConfigAfter = configTuple;
        options.cleanupState.receipt = cleanupReceipt;
        return { session: {}, finish: async () => {}, readSourceConfig: async () => configTuple, sourceConfigBefore: configTuple };
      },
      runEvaluator: async (options) => {
        calls.evaluator += 1;
        assert.equal(options.sourcePin.repositoryCommit, fixture.executionHead);
        assert.deepEqual(options.sourcePin.runner, fixture.plan.source.runner);
        assert.deepEqual(options.executionPlan, {
          schemaVersion: 1,
          id: "joeness-m4-superpowers-live-v1",
          outputs: fixture.plan.outputs,
        });
        await options.runtimeFactory({});
        await options.successPublisher({
          repositoryRoot: fixture.root,
          rawPath: fixture.plan.outputs.raw,
          evidencePath: fixture.plan.outputs.evidence,
          rawText: '{"status":"candidate"}',
          evidence: { freshTurn: true },
        });
        return { status: "candidate", validation: "unvalidated", promotionPass: false };
      },
      runTurn: async () => { throw new Error("fake evaluator owns this seam"); },
      publishSuccess: async (options) => {
        calls.success += 1;
        publication = options;
        return { completePair: true };
      },
      writeBlocked: async () => { calls.blocked += 1; },
    },
  });
  assert.deepEqual(result, { status: "candidate", validation: "unvalidated", promotionPass: false });
  assert.deepEqual(calls, { verify: 2, preflight: 1, evaluator: 1, runtime: 1, success: 1, blocked: 0 });
  assert.deepEqual(publication.evidence.executionSource, {
    planImplementationCommit: fixture.implementationCommit,
    executionHead: fixture.executionHead,
    executionHeadParent: fixture.implementationCommit,
    plan: publication.evidence.executionSource.plan,
    implementationSourcesMatchBAndC: true,
  });
  assert.deepEqual(publication.evidence.runtime, {
    codexVersion: "codex-cli 0.146.0",
    freshTurnCount: 1,
    retryCount: 0,
    dynamicToolCount: 0,
    sourceConfigBefore: configTuple,
    sourceConfigAfter: configTuple,
    sourceConfigReadback: "UNCHANGED",
    cleanup: cleanupReceipt,
  });
  assert.deepEqual(publication.evidence.resultBoundary, fixture.plan.resultBoundary);
  assert.deepEqual(publication.evidence.privacy, {
    configContentsPersisted: false,
    processIdentifiersPersisted: false,
    absolutePathsPersisted: false,
    rawStderrPersisted: false,
  });
  assert.equal(JSON.stringify(publication).includes(fixture.root), false);
});

test("runtime factory rejects a second call before creating another runtime", async (t) => {
  const api = await subject();
  const fixture = await committedPlanRepo(t);
  let createRuntimeCount = 0;
  await assert.rejects(
    api.runJoenessM4Live({
      repositoryRoot: fixture.root,
      planPath: "evals/skill-contracts/joeness-m4-superpowers-live-plan-v1.json",
      sourceCodexHome: path.join(tmpdir(), "unused-codex-home"),
      runParent: tmpdir(),
      operations: {
        verifyExecutionBoundary: api.verifyJoenessM4ExecutionBoundary,
        preflightEvaluator: async () => ({}),
        createRuntime: async () => {
          createRuntimeCount += 1;
          return {};
        },
        runEvaluator: async (options) => {
          await options.runtimeFactory({});
          await options.runtimeFactory({});
        },
        runTurn: async () => {},
        publishSuccess: async () => {},
        writeBlocked: async () => {},
      },
    }),
    /runtime factory.*once|second runtime/i,
  );
  assert.equal(createRuntimeCount, 1);
});

test("blocked publication is enriched only after outer boundary revalidation", async (t) => {
  const api = await subject();
  const fixture = await committedPlanRepo(t);
  const temp = await mkdtemp(path.join(tmpdir(), "joeness-m4-blocked-"));
  t.after(() => rm(temp, { recursive: true, force: true }));
  const sourceCodexHome = path.join(temp, "codex-home");
  const runParent = path.join(temp, "runs");
  await mkdir(sourceCodexHome);
  await mkdir(runParent);
  await writeFile(path.join(sourceCodexHome, "config.toml"), "plugins = false\n", "utf8");
  const tupleValue = { bytes: 16, sha256: digest("plugins = false\n") };
  const cleanupReceipt = {
    appServerLaunchCount: 1,
    appServerCloseConfirmedCount: 1,
    remainingOwnedProcessCount: 0,
    isolatedCodexHomeReadback: "absent",
    runRootReadback: "absent",
  };
  let verifyCount = 0;
  let blockedWrite;
  await assert.rejects(
    api.runJoenessM4Live({
      repositoryRoot: fixture.root,
      planPath: "evals/skill-contracts/joeness-m4-superpowers-live-plan-v1.json",
      sourceCodexHome,
      runParent,
      operations: {
        verifyExecutionBoundary: async (options) => {
          verifyCount += 1;
          return api.verifyJoenessM4ExecutionBoundary(options);
        },
        preflightEvaluator: async () => ({}),
        createRuntime: async (options) => {
          options.cleanupState.sourceConfigBefore = tupleValue;
          options.cleanupState.sourceConfigAfter = tupleValue;
          options.cleanupState.receipt = cleanupReceipt;
          return {};
        },
        runEvaluator: async (options) => {
          await options.runtimeFactory({});
          await options.writeArtifact(fixture.plan.outputs.blocked, {
            schemaVersion: 1,
            status: "blocked",
            phase: "post-runtime-validation",
            safeCleanup: true,
            cause: { category: "evaluation-failed" },
          });
          throw new Error("evaluation failed");
        },
        runTurn: async () => {},
        publishSuccess: async () => {},
        writeBlocked: async (repositoryRoot, relativePath, value) => {
          blockedWrite = { repositoryRoot, relativePath, value };
        },
      },
    }),
    /evaluation failed/,
  );
  assert.equal(verifyCount, 2);
  assert.equal(blockedWrite.relativePath, fixture.plan.outputs.blocked);
  assert.equal(blockedWrite.value.executionSource.planImplementationCommit, fixture.implementationCommit);
  assert.equal(blockedWrite.value.executionSource.executionHead, fixture.executionHead);
  assert.deepEqual(blockedWrite.value.runtime.cleanup, cleanupReceipt);
  assert.equal(JSON.stringify(blockedWrite.value).includes(fixture.root), false);
});

test("blocked callback performs no write when outer boundary revalidation fails", async (t) => {
  const api = await subject();
  const fixture = await committedPlanRepo(t);
  let verifyCount = 0;
  let writeCount = 0;
  await assert.rejects(
    api.runJoenessM4Live({
      repositoryRoot: fixture.root,
      planPath: "evals/skill-contracts/joeness-m4-superpowers-live-plan-v1.json",
      sourceCodexHome: path.join(tmpdir(), "unused-codex-home"),
      runParent: tmpdir(),
      operations: {
        verifyExecutionBoundary: async (options) => {
          verifyCount += 1;
          if (verifyCount === 2) throw new Error("outer boundary changed");
          return api.verifyJoenessM4ExecutionBoundary(options);
        },
        preflightEvaluator: async () => ({}),
        createRuntime: async () => ({}),
        runEvaluator: async (options) => options.writeArtifact(fixture.plan.outputs.blocked, {
          schemaVersion: 1,
          status: "blocked",
          phase: "post-runtime-validation",
          safeCleanup: true,
          cause: { category: "evaluation-failed" },
        }),
        runTurn: async () => {},
        publishSuccess: async () => {},
        writeBlocked: async () => { writeCount += 1; },
      },
    }),
    /outer boundary changed/,
  );
  assert.equal(verifyCount, 2);
  assert.equal(writeCount, 0);
});

test("preflight is non-live and returns bounded source, config, and absence evidence", async (t) => {
  const api = await subject();
  const fixture = await committedPlanRepo(t);
  const temp = await mkdtemp(path.join(tmpdir(), "joeness-m4-preflight-"));
  t.after(() => rm(temp, { recursive: true, force: true }));
  const sourceCodexHome = path.join(temp, "codex-home");
  await mkdir(sourceCodexHome);
  await writeFile(path.join(sourceCodexHome, "config.toml"), "plugins = false\n", "utf8");
  let fixturePreflightCount = 0;
  const receipt = await api.preflightJoenessM4Live({
    repositoryRoot: fixture.root,
    planPath: "evals/skill-contracts/joeness-m4-superpowers-live-plan-v1.json",
    sourceCodexHome,
    operations: {
      verifyExecutionBoundary: api.verifyJoenessM4ExecutionBoundary,
      preflightEvaluator: async () => {
        fixturePreflightCount += 1;
        return { manifest: { id: "joeness-m4-superpowers-v1" } };
      },
    },
  });
  assert.equal(fixturePreflightCount, 1);
  assert.deepEqual(receipt, {
    mode: "preflight",
    id: "joeness-m4-superpowers-live-v1",
    executionSource: receipt.executionSource,
    sourceConfig: { bytes: 16, sha256: digest("plugins = false\n") },
    outputsAbsent: true,
    runtime: fixture.plan.runtime,
    resultBoundary: fixture.plan.resultBoundary,
  });
  assert.equal(receipt.executionSource.planImplementationCommit, fixture.implementationCommit);
  assert.equal(receipt.executionSource.executionHead, fixture.executionHead);
  assert.equal(JSON.stringify(receipt).includes(fixture.root), false);
});

test("CLI admits only the fixed preflight or explicit one-live plan", async () => {
  const api = await subject();
  const planPath = "evals/skill-contracts/joeness-m4-superpowers-live-plan-v1.json";
  assert.deepEqual(api.parseJoenessM4LiveCli([]), { mode: "preflight", planPath });
  assert.deepEqual(api.parseJoenessM4LiveCli(["--mode", "preflight", "--plan", planPath]), {
    mode: "preflight",
    planPath,
  });
  assert.deepEqual(api.parseJoenessM4LiveCli(["--mode", "live", "--plan", planPath]), {
    mode: "live",
    planPath,
  });
  for (const argv of [
    ["--mode", "live"],
    ["--mode", "live", "--plan", "elsewhere.json"],
    ["--mode", "live", "--plan", planPath, "--retry"],
  ]) assert.throws(() => api.parseJoenessM4LiveCli(argv), /CLI|plan|invalid/i);
});

test("CLI failure emits one fixed bounded category without the raw error message", async () => {
  const planPath = "evals/skill-contracts/joeness-m4-superpowers-live-plan-v1.json";
  let caught;
  try {
    await execFile(process.execPath, [MODULE_PATH, "--mode", "preflight", "--plan", planPath], {
      cwd: ROOT,
      encoding: "utf8",
    });
  } catch (error) {
    caught = error;
  }
  assert.equal(caught?.code, 1);
  assert.equal(caught?.stderr, "m4-live-wrapper-failed\n");
  assert.equal(caught.stderr.includes(ROOT), false);
});

test("default blocked writer publishes exclusively with readback", async (t) => {
  const api = await subject();
  const fixture = await committedPlanRepo(t);
  const configTuple = { bytes: 16, sha256: digest("plugins = false\n") };
  const cleanupReceipt = {
    appServerLaunchCount: 1,
    appServerCloseConfirmedCount: 1,
    remainingOwnedProcessCount: 0,
    isolatedCodexHomeReadback: "absent",
    runRootReadback: "absent",
  };
  await assert.rejects(
    api.runJoenessM4Live({
      repositoryRoot: fixture.root,
      planPath: "evals/skill-contracts/joeness-m4-superpowers-live-plan-v1.json",
      sourceCodexHome: path.join(tmpdir(), "unused-codex-home"),
      runParent: tmpdir(),
      operations: {
        verifyExecutionBoundary: api.verifyJoenessM4ExecutionBoundary,
        preflightEvaluator: async () => ({}),
        createRuntime: async (options) => {
          options.cleanupState.sourceConfigBefore = configTuple;
          options.cleanupState.sourceConfigAfter = configTuple;
          options.cleanupState.receipt = cleanupReceipt;
          return {};
        },
        runEvaluator: async (options) => {
          await options.runtimeFactory({});
          await options.writeArtifact(fixture.plan.outputs.blocked, {
            schemaVersion: 1,
            status: "blocked",
            phase: "post-runtime-validation",
            safeCleanup: true,
            cause: { category: "evaluation-failed" },
          });
          throw new Error("evaluation stopped");
        },
        runTurn: async () => {},
        publishSuccess: async () => {},
        writeBlocked: undefined,
      },
    }),
    /evaluation stopped/,
  );
  const target = path.join(fixture.root, ...fixture.plan.outputs.blocked.split("/"));
  const text = await readFile(target, "utf8");
  const value = JSON.parse(text);
  assert.equal(value.status, "blocked");
  assert.equal(value.executionSource.planImplementationCommit, fixture.implementationCommit);
  assert.equal(value.executionSource.executionHead, fixture.executionHead);
  assert.equal(text.endsWith("\n"), true);
  await assert.rejects(
    api.runJoenessM4Live({
      repositoryRoot: fixture.root,
      planPath: "evals/skill-contracts/joeness-m4-superpowers-live-plan-v1.json",
      sourceCodexHome: path.join(tmpdir(), "unused-codex-home"),
      runParent: tmpdir(),
      operations: {
        verifyExecutionBoundary: api.verifyJoenessM4ExecutionBoundary,
        preflightEvaluator: async () => ({}),
        createRuntime: async () => ({}),
        runEvaluator: async () => {},
        runTurn: async () => {},
        publishSuccess: async () => {},
        writeBlocked: undefined,
      },
    }),
    /dirty|collision|output/i,
  );
  assert.equal(await readFile(target, "utf8"), text);
});

test("confirmed partial factory failure publishes blocked only after safe cleanup and revalidation", async (t) => {
  const api = await subject();
  const fixture = await committedPlanRepo(t);
  const configTuple = { bytes: 16, sha256: digest("plugins = false\n") };
  const cleanupReceipt = {
    appServerLaunchCount: 1,
    appServerCloseConfirmedCount: 1,
    remainingOwnedProcessCount: 0,
    isolatedCodexHomeReadback: "absent",
    runRootReadback: "absent",
  };
  let verifyCount = 0;
  let blockedWriteCount = 0;
  await assert.rejects(
    api.runJoenessM4Live({
      repositoryRoot: fixture.root,
      planPath: "evals/skill-contracts/joeness-m4-superpowers-live-plan-v1.json",
      sourceCodexHome: path.join(tmpdir(), "unused-codex-home"),
      runParent: tmpdir(),
      operations: {
        verifyExecutionBoundary: async (options) => {
          verifyCount += 1;
          return api.verifyJoenessM4ExecutionBoundary(options);
        },
        preflightEvaluator: async () => ({}),
        createRuntime: async (options) => {
          options.cleanupState.sourceConfigBefore = configTuple;
          options.cleanupState.sourceConfigAfter = configTuple;
          options.cleanupState.receipt = cleanupReceipt;
          throw new Error("partial runtime factory failed");
        },
        runEvaluator: async (options) => options.runtimeFactory({}),
        runTurn: async () => {},
        publishSuccess: async () => {},
        writeBlocked: async (_root, relativePath, value) => {
          blockedWriteCount += 1;
          assert.equal(relativePath, fixture.plan.outputs.blocked);
          assert.equal(value.status, "blocked");
          assert.equal(value.phase, "runtime-factory");
          assert.deepEqual(value.runtime.cleanup, cleanupReceipt);
        },
      },
    }),
    /partial runtime factory failed/,
  );
  assert.equal(verifyCount, 2);
  assert.equal(blockedWriteCount, 1);
});

test("unconfirmed partial factory failure publishes no blocked artifact", async (t) => {
  const api = await subject();
  const fixture = await committedPlanRepo(t);
  let verifyCount = 0;
  let blockedWriteCount = 0;
  await assert.rejects(
    api.runJoenessM4Live({
      repositoryRoot: fixture.root,
      planPath: "evals/skill-contracts/joeness-m4-superpowers-live-plan-v1.json",
      sourceCodexHome: path.join(tmpdir(), "unused-codex-home"),
      runParent: tmpdir(),
      operations: {
        verifyExecutionBoundary: async (options) => {
          verifyCount += 1;
          return api.verifyJoenessM4ExecutionBoundary(options);
        },
        preflightEvaluator: async () => ({}),
        createRuntime: async () => { throw new Error("process close unconfirmed"); },
        runEvaluator: async (options) => options.runtimeFactory({}),
        runTurn: async () => {},
        publishSuccess: async () => {},
        writeBlocked: async () => { blockedWriteCount += 1; },
      },
    }),
    /close unconfirmed/,
  );
  assert.equal(verifyCount, 1);
  assert.equal(blockedWriteCount, 0);
});

test("success publication rejects PID, absolute-path, raw-stderr, and config-content evidence", async (t) => {
  const api = await subject();
  const forbidden = [
    { pid: 1234 },
    { note: "C:\\private\\runtime" },
    { stderr: "raw diagnostic" },
    { configContents: "plugins = true" },
  ];
  for (const evidence of forbidden) {
    const fixture = await committedPlanRepo(t);
    const configTuple = { bytes: 16, sha256: digest("plugins = false\n") };
    let publishCount = 0;
    await assert.rejects(
      api.runJoenessM4Live({
        repositoryRoot: fixture.root,
        planPath: "evals/skill-contracts/joeness-m4-superpowers-live-plan-v1.json",
        sourceCodexHome: path.join(tmpdir(), "unused-codex-home"),
        runParent: tmpdir(),
        operations: {
          verifyExecutionBoundary: api.verifyJoenessM4ExecutionBoundary,
          preflightEvaluator: async () => ({}),
          createRuntime: async (options) => {
            options.cleanupState.sourceConfigBefore = configTuple;
            options.cleanupState.sourceConfigAfter = configTuple;
            options.cleanupState.receipt = {
              appServerLaunchCount: 1,
              appServerCloseConfirmedCount: 1,
              remainingOwnedProcessCount: 0,
              isolatedCodexHomeReadback: "absent",
              runRootReadback: "absent",
            };
            return {};
          },
          runEvaluator: async (options) => {
            await options.runtimeFactory({});
            return options.successPublisher({
              repositoryRoot: fixture.root,
              rawPath: fixture.plan.outputs.raw,
              evidencePath: fixture.plan.outputs.evidence,
              rawText: '{"status":"candidate"}',
              evidence,
            });
          },
          runTurn: async () => {},
          publishSuccess: async () => { publishCount += 1; },
          writeBlocked: async () => {},
        },
      }),
      /private|absolute path/i,
    );
    assert.equal(publishCount, 0);
  }
});
