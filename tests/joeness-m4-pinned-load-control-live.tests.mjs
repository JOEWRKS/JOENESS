import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFile, cp, lstat, mkdtemp, mkdir, readFile, rename, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import test from "node:test";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);

const ROOT = path.resolve(import.meta.dirname, "..");
const MODULE_PATH = path.join(
  ROOT,
  "evals/support/run-joeness-m4-pinned-load-control-live.mjs",
);
const FRESH_ADAPTER_PATH = path.join(
  ROOT,
  "evals/support/run-fresh-evaluator-turn.mjs",
);
const RUN_ID = "joeness-m4-pinned-load-control-live-v5";
const PLAN_PATH =
  "evals/skill-contracts/joeness-m4-pinned-load-control-live-plan-v5.json";
const V4_PERSISTENCE_COMMIT = "9919795d957d29fce73ce67478052fd819d0b975";
const V5_ATTEMPT_INDEX_PATH =
  "evals/skill-contracts/joeness-m4-pinned-load-control-attempt-index-v5.json";
const METHOD =
  "exact-v3-pinned-input-bundle-tiny-schema-transport-control-no-m4-assessment";
const OUTPUTS = Object.freeze({
  raw: "evals/skill-contracts/joeness-m4-pinned-load-control-live-v5-raw.json",
  evidence: "evals/skill-contracts/joeness-m4-pinned-load-control-live-v5-evidence.json",
  blocked: "evals/skill-contracts/joeness-m4-pinned-load-control-live-v5-blocked.json",
});
const FIXTURE_MANIFEST = Object.freeze({
  path: "evals/skill-contracts/fixtures/joeness-m4-superpowers-v1/manifest-v2.json",
  bytes: 1738,
  sha256: "3708a7c3ea677926cd4f85093e83788ff6250aa0b7fd012529ff88a45ddc77f0",
});
const INPUT_CONTRACT = Object.freeze({
  fixtureId: "joeness-m4-superpowers-v2",
  descriptorCount: 4,
  combinedInputBytes: 16819,
  canonicalRequestBytes: 17295,
  canonicalRequestSha256:
    "edb9ffd151a5ecb405002d487fe28c1e10285d63676aee849bd991158fd89f5a",
  responseSchemaBytes: 192,
  responseSchemaSha256:
    "874e782d9de6862f9718199125fcebfcf47f7990da06dce54d2d32f8c12db423",
  additionalPromptCount: 0,
});
const SOURCE_ROLES = Object.freeze([
  "diagnosticRunner",
  "diagnosticWrapper",
  "fixtureLoader",
  "transportControlSupport",
  "freshTurnAdapter",
  "collector",
  "fixtureManifest",
]);

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function subject() {
  return import(`${pathToFileURL(MODULE_PATH).href}?t=${Date.now()}-${Math.random()}`);
}

async function cleanEvaluatorRoot(t) {
  const root = await mkdtemp(path.join(tmpdir(), "joeness-m4-pinned-load-control-eval-"));
  t.after(async () => {
    await rm(root, { recursive: true, force: true });
  });
  await mkdir(path.join(root, "evals", "skill-contracts"), { recursive: true });
  await cp(
    path.join(ROOT, "evals", "skill-contracts", "fixtures"),
    path.join(root, "evals", "skill-contracts", "fixtures"),
    { recursive: true },
  );
  await mkdir(path.join(root, "evals", "support"), { recursive: true });
  for (const relativePath of [
    plan().source.diagnosticRunner.path,
    plan().source.fixtureLoader.path,
    plan().source.transportControlSupport.path,
    plan().source.freshTurnAdapter.path,
    plan().source.collector.path,
  ]) {
    await copyFile(
      path.join(ROOT, ...relativePath.split("/")),
      path.join(root, ...relativePath.split("/")),
    );
  }
  return root;
}

function tuple(pathname, text = pathname) {
  return { path: pathname, bytes: Buffer.byteLength(text), sha256: digest(text) };
}

function plan() {
  return {
    schemaVersion: 5,
    id: RUN_ID,
    date: "2026-08-15",
    method: METHOD,
    predecessor: {
      id: "joeness-m4-transport-control-live-v4",
      implementationCommit: "f19f9013be5122867b36b4acc3b6a356f0f5e084",
      executionHead: "0431a8ae13ced91811b335cca97bb23a7eca39df",
      persistenceCommit: V4_PERSISTENCE_COMMIT,
      plan: {
        path: "evals/skill-contracts/joeness-m4-transport-control-live-plan-v4.json",
        bytes: 2938,
        sha256: "27bca3f7abe9c5cee4e36ef67f7d82d019902b7952e10e2a5a1dba8924425971",
      },
      rawArtifact: {
        path: "evals/skill-contracts/joeness-m4-transport-control-live-v4-raw.json",
        bytes: 36,
        sha256: "b270bf58038d3d0c99216e11735eeadd9ef29d2dbfa3b14e99bfe8900c36a6ea",
      },
      evidenceArtifact: {
        path: "evals/skill-contracts/joeness-m4-transport-control-live-v4-evidence.json",
        bytes: 3575,
        sha256: "bf578f38ab86705b2a45e3fd73bd6f00b06b2fd0f2fd91c95cbfd8ae97ed8658",
      },
      blockedArtifact: {
        path: "evals/skill-contracts/joeness-m4-transport-control-live-v4-blocked.json",
        status: "absent",
      },
      attemptIndex: {
        path: "evals/skill-contracts/joeness-m4-transport-control-attempt-index-v4.json",
        bytes: 11475,
        sha256: "0e9ee6509b76e48109bf901cca735c6bce69212935b19b5044f90317e2e564a0",
      },
      sameCommandRetryAuthorized: false,
    },
    attempt: {
      freshTurnCount: 1,
      retryCount: 0,
      automaticRetry: false,
    },
    source: {
      planImplementationCommit: "a".repeat(40),
      diagnosticRunner: {
        path: "evals/support/run-joeness-m4-pinned-load-control-eval.mjs",
        bytes: 30773,
        sha256: "05eadb27ba5e5a81dc48a64eab5f5609567a0d09b12d080d4b7135f867cadf97",
      },
      diagnosticWrapper: tuple(
        "evals/support/run-joeness-m4-pinned-load-control-live.mjs",
        "diagnostic-wrapper",
      ),
      fixtureLoader: {
        path: "evals/support/run-joeness-m4-superpowers-eval.mjs",
        bytes: 53515,
        sha256: "b144d15d1601f7de8356fa95819566d47ef6447e9a5195329692d1b83533c9bc",
      },
      transportControlSupport: {
        path: "evals/support/run-joeness-m4-transport-control-eval.mjs",
        bytes: 49611,
        sha256: "547077688884d8d0c94558fc84322bcf31b61b0a6d6583359423f2c161029cfa",
      },
      freshTurnAdapter: {
        path: "evals/support/run-fresh-evaluator-turn.mjs",
        bytes: 56845,
        sha256: "4884154dd1884b6fa899eef854307edec2a9897cb39b1f45c9c03479cab34247",
      },
      collector: {
        path: "evals/support/collect-codex-app-server.mjs",
        bytes: 297632,
        sha256: "8b81ddb28be2a803500839a2de61f9bb397aa96711d039bdb7a3a86cfad8d687",
      },
      fixtureManifest: { ...FIXTURE_MANIFEST },
    },
    inputContract: { ...INPUT_CONTRACT },
    runtime: {
      codexVersion: "codex-cli 0.146.0",
      projectDocs: "disabled",
      installedPluginActivation: "UNVERIFIED",
      dynamicTools: [],
    },
    outputs: { ...OUTPUTS },
    resultBoundary: {
      state: "candidate",
      validation: "unvalidated",
      scope: "pinned-content-load-transport-only",
      m4Behavior: "NOT-ASSESSED",
      joenessPolicy: "UNVERIFIED",
      superpowersCompatibility: "UNVERIFIED",
      promotionPass: false,
      corePromotion: false,
      manifestPromotion: false,
    },
  };
}

function freshFailure(origin = "error-notification") {
  return {
    schemaVersion: 4,
    provenance: "pinned-load-control-runner-observed-default-fresh-adapter-rejection",
    runnerStage: "fresh-turn-rejected",
    pinnedRequest: {
      descriptorCount: 4,
      byteLength: 17295,
      sha256: "edb9ffd151a5ecb405002d487fe28c1e10285d63676aee849bd991158fd89f5a",
    },
    evidenceState: "retained",
    lifecycle: {
      threadStart: "observed",
      turnStart: "observed",
      terminal: "non-completed",
      terminalCountState: "one",
    },
    eventCounts: { observed: 4, retained: 4, retainedOverLimit: false },
    normalizerBlocker: {
      provenance: "adapter-normalization-fixed-enum",
      classification: "runtime-error",
    },
    runtimeErrorOrigin: {
      provenance: "runner-projected-default-adapter-retained-events-fixed-enum",
      classification: origin,
    },
    blockers: {
      count: 3,
      codes: ["runtime-control-blocker", "turn-not-completed"],
      unclassifiedCount: 1,
    },
    appServerExit: "zero",
    primaryCauseKind: "error",
    retention: {
      rawOutputPersisted: false,
      rawEventsPersisted: false,
      threadTurnProcessIdentifiersPersisted: false,
      absolutePathsPersisted: false,
      rawEventOrOutputDigestsPersisted: false,
      rawStderrPersisted: false,
      configContentsPersisted: false,
    },
  };
}

function delegatedReceipt(value = freshFailure()) {
  return {
    schemaVersion: 1,
    status: "blocked",
    phase: "post-runtime-validation",
    safeCleanup: true,
    cause: { category: "evaluation-failed" },
    ...(value === undefined ? {} : { freshFailure: value }),
  };
}

function genericReceipt() {
  return {
    schemaVersion: 1,
    status: "blocked",
    phase: "post-runtime-validation",
    safeCleanup: true,
    cause: { category: "evaluation-failed" },
  };
}

function boundaryReceipt(value = plan()) {
  return {
    plan: value,
    executionSource: {
      planImplementationCommit: value.source.planImplementationCommit,
      executionHead: "b".repeat(40),
      executionHeadParent: value.source.planImplementationCommit,
      plan: { path: PLAN_PATH, bytes: 100, sha256: digest("plan") },
      predecessor: {
        ...value.predecessor,
        artifactsMatchSupportPlanAndWorking: true,
        executionHeadIsAncestorOfSupport: true,
        persistenceCommitIsAncestorOfSupport: true,
      },
      sourcePins: Object.fromEntries(
        SOURCE_ROLES.map((role) => [role, structuredClone(value.source[role])]),
      ),
      implementationSourcesMatchSupportPlanAndWorking: true,
    },
    outputsAbsent: true,
  };
}

function freshSession({ threadStartError = null } = {}) {
  const listeners = new Set();
  let processExitCode = null;
  let closed = false;
  function emit(notification) {
    for (const listener of listeners) listener(notification);
  }
  return {
    notificationCursor: 0,
    mcpInventory: [],
    remoteControlSnapshot: {
      seen: true,
      complete: true,
      status: "disabled",
      environmentAttached: false,
    },
    client: {
      async request(method, params) {
        if (method === "thread/start") {
          if (threadStartError) throw threadStartError;
          emit({ method: "thread/started", params: { thread: { id: "private-thread" } } });
          return {
            thread: {
              id: "private-thread",
              cwd: params.cwd,
              ephemeral: true,
              modelProvider: "fixture-provider",
              turns: [],
            },
            model: "fixture-model",
            modelProvider: "fixture-provider",
            reasoningEffort: "medium",
            serviceTier: null,
            activePermissionProfile: { id: "joewrks-eval-control-v3" },
            approvalPolicy: "never",
            approvalsReviewer: "user",
            sandbox: { type: "readOnly", networkAccess: false },
            cwd: params.cwd,
            runtimeWorkspaceRoots: params.runtimeWorkspaceRoots,
            instructionSources: [],
          };
        }
        if (method === "turn/start") {
          emit({
            method: "turn/started",
            params: { threadId: params.threadId, turn: { id: "private-turn" } },
          });
          emit({
            method: "item/completed",
            params: {
              threadId: params.threadId,
              turnId: "private-turn",
              item: {
                id: "private-message",
                type: "agentMessage",
                text: '{"schemaVersion":1,"transport":"ok"}',
              },
            },
          });
          emit({
            method: "turn/completed",
            params: {
              threadId: params.threadId,
              turn: { id: "private-turn", status: "completed" },
            },
          });
          return { turn: { id: "private-turn", status: "inProgress" } };
        }
        if (method === "mcpServerStatus/list") return { data: [], nextCursor: null };
        if (method === "turn/interrupt") return {};
        throw new Error(`unexpected request: ${method}`);
      },
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async close() {
      if (!closed) {
        closed = true;
        processExitCode = 0;
      }
    },
    get processExitCode() { return processExitCode; },
    get processCloseConfirmed() { return closed; },
    get stderr() {
      return {
        byteLength: 0,
        sha256: digest(""),
        truncated: false,
        captureTruncated: false,
      };
    },
    get imageDiagnostics() { return null; },
    get successfulImageViews() { return null; },
  };
}

function safeCleanupState(target) {
  const tuple = { bytes: 17, sha256: digest("source-config") };
  target.sourceConfigBefore = { ...tuple };
  target.sourceConfigAfter = { ...tuple };
  target.receipt = {
    appServerLaunchCount: 1,
    appServerCloseConfirmedCount: 1,
    remainingOwnedProcessCount: 0,
    isolatedCodexHomeReadback: "absent",
    runRootReadback: "absent",
  };
  return tuple;
}

async function identityRuntimeFixture(t, suffix) {
  const parent = await mkdtemp(path.join(tmpdir(), `joeness-m4-control-identity-${suffix}-`));
  t.after(() => rm(parent, { recursive: true, force: true }));
  const sourceCodexHome = path.join(parent, "source-home");
  const runParent = path.join(parent, "runs");
  const runRoot = path.join(runParent, `joewrks-eval-${RUN_ID}`);
  const isolatedParent = path.join(sourceCodexHome, ".eval-runtime");
  const isolatedHome = path.join(
    isolatedParent,
    `${path.basename(runRoot)}-controller-codex-home`,
  );
  await mkdir(sourceCodexHome);
  await mkdir(runParent);
  await writeFile(path.join(sourceCodexHome, "config.toml"), "model = \"fixture\"\n", "utf8");
  return { parent, sourceCodexHome, runParent, runRoot, isolatedParent, isolatedHome };
}

function identityRuntimeOperations(fixture, { prepareRuntime } = {}) {
  const calls = { removeHome: 0, removeRoot: 0 };
  let closed = false;
  return {
    calls,
    operations: {
      async createExclusiveRunRoot(id, selectedParent) {
        assert.equal(id, RUN_ID);
        assert.equal(selectedParent, fixture.runParent);
        await mkdir(fixture.runRoot);
        return fixture.runRoot;
      },
      prepareRuntime: prepareRuntime ?? (async () => {
        await mkdir(fixture.isolatedParent);
        await mkdir(fixture.isolatedHome);
        return { isolatedCodexHome: fixture.isolatedHome };
      }),
      async openAppServer() {
        return {
          async close() { closed = true; },
          get processCloseConfirmed() { return closed; },
          get processExitCode() { return closed ? 0 : null; },
        };
      },
      async removeIsolatedCodexHome(_runRoot, selectedHome) {
        calls.removeHome += 1;
        await rm(selectedHome, { recursive: true, force: false });
      },
      async removeRunRoot(selectedRoot) {
        calls.removeRoot += 1;
        await rm(selectedRoot, { recursive: true, force: false });
      },
    },
  };
}

function liveOperations({
  session = freshSession(),
  boundaryFailureAt = null,
  runEvaluator,
  runTurn,
} = {}) {
  const value = plan();
  const boundary = boundaryReceipt(value);
  const calls = {
    verify: 0,
    createRuntime: 0,
    success: [],
    blocked: [],
    lastBoundary: null,
    runnerBlobReads: [],
  };
  const operations = {
    async verifyExecutionBoundary() {
      calls.verify += 1;
      if (calls.verify === boundaryFailureAt) throw new Error("execution boundary changed after preflight");
      calls.lastBoundary = structuredClone(boundary);
      return calls.lastBoundary;
    },
    async createRuntime({ cleanupState }) {
      calls.createRuntime += 1;
      const config = safeCleanupState(cleanupState);
      return {
        session,
        sourceConfigBefore: { ...config },
        async readSourceConfig() { return { ...config }; },
        async finish() { await session.close(); },
      };
    },
    async runnerGitStatus() { return ""; },
    async runnerGitIdentity() { return boundary.executionSource.executionHead; },
    async runnerGitReadBlob(_root, revision, relativePath) {
      calls.runnerBlobReads.push({ revision, relativePath });
      return readFile(path.join(ROOT, ...relativePath.split("/")));
    },
    async runnerArtifactExists() { return false; },
    async publishSuccess(value) { calls.success.push(value); return { completePair: true }; },
    async publishBlocked(value) { calls.blocked.push(value); return { byteLength: 1, sha256: digest("x") }; },
    ...(runEvaluator === undefined ? {} : { runEvaluator }),
    ...(runTurn === undefined ? {} : { runTurn }),
  };
  return { boundary, calls, operations };
}

function createBoundEvaluatorRuntime(options) {
  return options.runtimeFactory({
    repositoryRoot: options.repositoryRoot,
    executionPlan: options.executionPlan,
    sourcePin: options.sourcePin,
  });
}

async function git(root, args) {
  const { stdout } = await execFile("git", args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
    windowsHide: true,
  });
  return stdout.trim();
}

async function gitPathExists(root, revision, relativePath) {
  try {
    await execFile("git", ["cat-file", "-e", `${revision}:${relativePath}`], {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 4 * 1024 * 1024,
      windowsHide: true,
    });
    return true;
  } catch (error) {
    if (error?.code === 128) return false;
    throw error;
  }
}

async function sourceTuple(root, relativePath) {
  const bytes = await readFile(path.join(root, ...relativePath.split("/")));
  return { path: relativePath, bytes: bytes.length, sha256: digest(bytes) };
}

async function executionFixture(t, {
  mutatePlan,
  extraExecutionFile = false,
  commitOutput = false,
} = {}) {
  const parent = await mkdtemp(path.join(tmpdir(), "joeness-m4-control-live-"));
  t.after(() => rm(parent, { recursive: true, force: true }));
  const root = path.join(parent, "repo");
  await execFile("git", ["clone", "--quiet", "--no-hardlinks", ROOT, root], {
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
    windowsHide: true,
  });
  await git(root, ["config", "user.email", "fixture@example.invalid"]);
  await git(root, ["config", "user.name", "fixture"]);
  await git(root, [
    "switch",
    "--quiet",
    "--create",
    "synthetic-v5-support",
    V4_PERSISTENCE_COMMIT,
  ]);
  const sourcePaths = [];
  const draft = plan();
  for (const role of SOURCE_ROLES) {
    const relativePath = draft.source[role].path;
    sourcePaths.push(relativePath);
    await copyFile(
      path.join(ROOT, ...relativePath.split("/")),
      path.join(root, ...relativePath.split("/")),
    );
  }
  await git(root, ["add", "--", ...sourcePaths]);
  await git(root, ["commit", "--quiet", "-m", "support pinned-load wrapper"]);
  const support = await git(root, ["rev-parse", "HEAD"]);

  const value = plan();
  value.source.planImplementationCommit = support;
  for (const role of SOURCE_ROLES) {
    value.source[role] = await sourceTuple(root, value.source[role].path);
  }
  mutatePlan?.(value);
  const absolutePlan = path.join(root, ...PLAN_PATH.split("/"));
  await writeFile(absolutePlan, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await git(root, ["add", "--", PLAN_PATH]);
  if (extraExecutionFile) {
    await writeFile(path.join(root, "extra.txt"), "extra\n", "utf8");
    await git(root, ["add", "--", "extra.txt"]);
  }
  if (commitOutput) {
    await writeFile(path.join(root, ...OUTPUTS.blocked.split("/")), "{}\n", "utf8");
    await git(root, ["add", "--", OUTPUTS.blocked]);
  }
  await git(root, ["commit", "--quiet", "-m", "plan pinned-load control"]);
  const execution = await git(root, ["rev-parse", "HEAD"]);
  return { root, support, execution, plan: value };
}

test("executionFixture builds v5 support from immutable v4 history and adds only the v5 plan", async (t) => {
  const fixture = await executionFixture(t);
  assert.equal(
    await git(fixture.root, ["rev-list", "--parents", "-n", "1", fixture.support]),
    `${fixture.support} ${V4_PERSISTENCE_COMMIT}`,
  );
  for (const relativePath of [
    PLAN_PATH,
    OUTPUTS.raw,
    OUTPUTS.evidence,
    OUTPUTS.blocked,
    V5_ATTEMPT_INDEX_PATH,
  ]) {
    assert.equal(
      await gitPathExists(fixture.root, fixture.support, relativePath),
      false,
      relativePath,
    );
  }
  assert.equal(
    await git(fixture.root, ["rev-list", "--parents", "-n", "1", fixture.execution]),
    `${fixture.execution} ${fixture.support}`,
  );
  assert.equal(
    await git(fixture.root, [
      "diff",
      "--name-status",
      fixture.support,
      fixture.execution,
    ]),
    `A\t${PLAN_PATH}`,
  );
});

test("exports only the generation-v5 pinned-load-control live contract", async () => {
  const api = await subject();
  assert.equal(api.JOENESS_M4_PINNED_LOAD_CONTROL_LIVE_RUN_ID, RUN_ID);
  assert.equal(api.JOENESS_M4_PINNED_LOAD_CONTROL_LIVE_PLAN_PATH, PLAN_PATH);
  assert.equal(api.JOENESS_M4_PINNED_LOAD_CONTROL_LIVE_METHOD, METHOD);
  assert.deepEqual(api.JOENESS_M4_PINNED_LOAD_CONTROL_LIVE_OUTPUTS, OUTPUTS);
  assert.equal(typeof api.validateJoenessM4PinnedLoadControlLivePlan, "function");
  assert.equal(typeof api.verifyJoenessM4PinnedLoadControlExecutionBoundary, "function");
  assert.equal(typeof api.snapshotJoenessM4PinnedLoadControlSourceConfig, "function");
  assert.equal(typeof api.createJoenessM4PinnedLoadControlDefaultRuntime, "function");
  assert.equal(typeof api.rebuildJoenessM4PinnedLoadControlDelegatedBlockedReceipt, "function");
  assert.equal(typeof api.preflightJoenessM4PinnedLoadControlLive, "function");
  assert.equal(typeof api.runJoenessM4PinnedLoadControlLive, "function");
  assert.equal(typeof api.executeJoenessM4PinnedLoadControlLiveCli, "function");
});

test("plan validation freezes exact pinned input, the v4 predecessor, one turn, retry zero, and no promotion", async () => {
  const api = await subject();
  assert.deepEqual(api.validateJoenessM4PinnedLoadControlLivePlan(plan()), plan());

  for (const mutate of [
    (value) => { value.schemaVersion = 4; },
    (value) => { value.id = "joeness-m4-transport-control-live-v4"; },
    (value) => { value.date = "2026-08-14"; },
    (value) => { value.method += "-changed"; },
    (value) => { value.predecessor.implementationCommit = "b".repeat(40); },
    (value) => { value.predecessor.executionHead = "b".repeat(40); },
    (value) => { value.predecessor.persistenceCommit = "b".repeat(40); },
    (value) => { value.predecessor.plan.bytes += 1; },
    (value) => { value.predecessor.rawArtifact.bytes += 1; },
    (value) => { value.predecessor.evidenceArtifact.sha256 = "f".repeat(64); },
    (value) => { value.predecessor.blockedArtifact.status = "present"; },
    (value) => { value.predecessor.attemptIndex.bytes += 1; },
    (value) => { value.predecessor.sameCommandRetryAuthorized = true; },
    (value) => { value.attempt.freshTurnCount = 2; },
    (value) => { value.attempt.retryCount = 1; },
    (value) => { value.runtime.projectDocs = "enabled"; },
    (value) => { value.runtime.installedPluginActivation = "VERIFIED"; },
    (value) => { value.runtime.dynamicTools.push({ name: "tool" }); },
    (value) => { value.inputContract.fixtureId += "-changed"; },
    (value) => { value.inputContract.descriptorCount = 5; },
    (value) => { value.inputContract.combinedInputBytes += 1; },
    (value) => { value.inputContract.canonicalRequestBytes += 1; },
    (value) => { value.inputContract.canonicalRequestSha256 = "f".repeat(64); },
    (value) => { value.inputContract.responseSchemaBytes += 1; },
    (value) => { value.inputContract.responseSchemaSha256 = "f".repeat(64); },
    (value) => { value.inputContract.additionalPromptCount = 1; },
    (value) => { value.resultBoundary.scope = "transport-only"; },
    (value) => { value.resultBoundary.m4Behavior = "PASS"; },
    (value) => { value.resultBoundary.joenessPolicy = "VERIFIED"; },
    (value) => { value.resultBoundary.superpowersCompatibility = "VERIFIED"; },
    (value) => { value.resultBoundary.promotionPass = true; },
    (value) => { value.source.fixtureManifest.sha256 = "f".repeat(64); },
    ...SOURCE_ROLES.map((role) => (value) => {
      value.source[role].path = `forbidden/${role}.mjs`;
    }),
  ]) {
    const invalid = plan();
    mutate(invalid);
    assert.throws(
      () => api.validateJoenessM4PinnedLoadControlLivePlan(invalid),
      TypeError,
    );
  }
});

test("CLI accepts only explicit v5 preflight or live invocation", async () => {
  const api = await subject();
  assert.deepEqual(api.parseJoenessM4PinnedLoadControlLiveCli([]), {
    mode: "preflight",
    planPath: PLAN_PATH,
  });
  for (const mode of ["preflight", "live"]) {
    assert.deepEqual(
      api.parseJoenessM4PinnedLoadControlLiveCli([
        "--mode", mode, "--plan", PLAN_PATH,
      ]),
      { mode, planPath: PLAN_PATH },
    );
  }
  for (const argv of [
    ["live"],
    ["--mode", "validate-only", "--plan", PLAN_PATH],
    ["--mode", "live", "--plan", "old-v4.json"],
    ["--mode", "live"],
  ]) {
    assert.throws(() => api.parseJoenessM4PinnedLoadControlLiveCli(argv));
  }
});

test("historical M4 v1 through v4 artifacts remain byte exact", async () => {
  const historical = [
    ["evals/skill-contracts/joeness-m4-superpowers-live-plan-v1.json", 1888, "34d59ba0fd3dfa24973b9ab6e55205ecd3a22da32daf2fa15daaa156273f428c"],
    ["evals/skill-contracts/joeness-m4-superpowers-live-v1-blocked.json", 1384, "590c1a44cf7e9660ee2c6df8a32c63cadfcab881154c16aadefcd8315fdcbec4"],
    ["evals/skill-contracts/joeness-m4-superpowers-attempt-index-v1.json", 6230, "5a00e7e526075dedb066107229f80beb61e94d5cd6fc125952693d27ccd66455"],
    ["evals/skill-contracts/joeness-m4-superpowers-live-plan-v2.json", 2952, "85be6e07cef1d3165fd0cb504de929dbafc74e227d1b2a403777035d198c449c"],
    ["evals/skill-contracts/joeness-m4-superpowers-live-v2-blocked.json", 3540, "ba29d79c3955f4bfce5059b1e05fbae8744e50eeaf235dd60d331ef3c7f1e4a0"],
    ["evals/skill-contracts/joeness-m4-superpowers-attempt-index-v2.json", 9264, "147eead383f1b5e696dd5d7fcc57a9c86915adb8d8448189f4eb59bb95f73156"],
    ["evals/skill-contracts/joeness-m4-superpowers-live-plan-v3.json", 2958, "2d98638e45b65fa2c1dc98fd11d7eeb86d57d9c6d69ce0a56752315aa83fb855"],
    ["evals/skill-contracts/joeness-m4-superpowers-live-v3-blocked.json", 3670, "41aeafdb4a5b4b2bb468510846cb889050681e844f40d21669dbaf4c5175978a"],
    ["evals/skill-contracts/joeness-m4-superpowers-attempt-index-v3.json", 10146, "6f6dec9b5556b19247c218a9940a7dc30dd29b60d374dd51438b865d9aa1867a"],
    ["evals/skill-contracts/joeness-m4-transport-control-live-plan-v4.json", 2938, "27bca3f7abe9c5cee4e36ef67f7d82d019902b7952e10e2a5a1dba8924425971"],
    ["evals/skill-contracts/joeness-m4-transport-control-live-v4-raw.json", 36, "b270bf58038d3d0c99216e11735eeadd9ef29d2dbfa3b14e99bfe8900c36a6ea"],
    ["evals/skill-contracts/joeness-m4-transport-control-live-v4-evidence.json", 3575, "bf578f38ab86705b2a45e3fd73bd6f00b06b2fd0f2fd91c95cbfd8ae97ed8658"],
    ["evals/skill-contracts/joeness-m4-transport-control-attempt-index-v4.json", 11475, "0e9ee6509b76e48109bf901cca735c6bce69212935b19b5044f90317e2e564a0"],
  ];
  for (const [relativePath, bytes, sha256] of historical) {
    const content = await readFile(path.join(ROOT, ...relativePath.split("/")));
    assert.equal(content.length, bytes, relativePath);
    assert.equal(digest(content), sha256, relativePath);
  }
  await assert.rejects(
    () => readFile(path.join(
      ROOT,
      "evals/skill-contracts/joeness-m4-transport-control-live-v4-blocked.json",
    )),
    (error) => error?.code === "ENOENT",
  );
});

test("pinned-load wrapper imports the exact diagnostic graph but no live predecessor wrapper or rubric", async () => {
  const source = await readFile(MODULE_PATH, "utf8");
  for (const required of [
    'from "./run-joeness-m4-pinned-load-control-eval.mjs"',
    'from "./run-fresh-evaluator-turn.mjs"',
    'from "./collect-codex-app-server.mjs"',
  ]) assert.equal(source.includes(required), true, required);
  for (const forbidden of [
    'from "./run-joeness-m4-superpowers-live.mjs"',
    'from "./run-joeness-m4-transport-control-live.mjs"',
    "rubric",
  ]) assert.equal(source.includes(forbidden), false, forbidden);
});

test("delegated schema4 receipt retains only exact pinned-request and fixed failure evidence", async () => {
  const api = await subject();
  for (const origin of [
    "none",
    "error-notification",
    "thread-status-system-error",
    "multiple",
    "unmapped",
  ]) {
    assert.deepEqual(
      api.rebuildJoenessM4PinnedLoadControlDelegatedBlockedReceipt(
        delegatedReceipt(freshFailure(origin)),
      ),
      delegatedReceipt(freshFailure(origin)),
    );
  }

  const extra = delegatedReceipt(freshFailure());
  extra.freshFailure.runtimeErrorOrigin.rawMessage = "RAW-PRIVATE-CANARY";
  const invalidClassification = delegatedReceipt(freshFailure("RAW-PRIVATE-CANARY"));
  const wrongSchema = delegatedReceipt(freshFailure());
  wrongSchema.freshFailure.schemaVersion = 3;
  const wrongPinnedCount = delegatedReceipt(freshFailure());
  wrongPinnedCount.freshFailure.pinnedRequest.descriptorCount = 5;
  const wrongPinnedBytes = delegatedReceipt(freshFailure());
  wrongPinnedBytes.freshFailure.pinnedRequest.byteLength += 1;
  const wrongPinnedDigest = delegatedReceipt(freshFailure());
  wrongPinnedDigest.freshFailure.pinnedRequest.sha256 = "f".repeat(64);
  const extraPinnedKey = delegatedReceipt(freshFailure());
  extraPinnedKey.freshFailure.pinnedRequest.raw = "RAW-PRIVATE-CANARY";
  for (const candidate of [
    extra,
    invalidClassification,
    wrongSchema,
    wrongPinnedCount,
    wrongPinnedBytes,
    wrongPinnedDigest,
    extraPinnedKey,
  ]) {
    const rebuilt = api.rebuildJoenessM4PinnedLoadControlDelegatedBlockedReceipt(candidate);
    assert.deepEqual(rebuilt, genericReceipt());
    assert.equal(JSON.stringify(rebuilt).includes("RAW-PRIVATE-CANARY"), false);
  }
});

test("delegated hostile origin accessors and proxies are trap-zero and become generic", async () => {
  const api = await subject();
  let traps = 0;
  const accessor = delegatedReceipt(freshFailure());
  Object.defineProperty(accessor.freshFailure.runtimeErrorOrigin, "classification", {
    enumerable: true,
    get() { traps += 1; throw new Error("origin accessor trap"); },
  });
  const liveProxy = delegatedReceipt(freshFailure());
  liveProxy.freshFailure.runtimeErrorOrigin = new Proxy({}, {
    get() { traps += 1; throw new Error("origin proxy get trap"); },
    getPrototypeOf() { traps += 1; throw new Error("origin proxy prototype trap"); },
    ownKeys() { traps += 1; throw new Error("origin proxy keys trap"); },
  });
  const revoked = Proxy.revocable({}, {});
  revoked.revoke();
  const revokedReceipt = delegatedReceipt(freshFailure());
  revokedReceipt.freshFailure.runtimeErrorOrigin = revoked.proxy;

  for (const candidate of [accessor, liveProxy, revokedReceipt]) {
    assert.deepEqual(
      api.rebuildJoenessM4PinnedLoadControlDelegatedBlockedReceipt(candidate),
      genericReceipt(),
    );
  }
  assert.equal(traps, 0);
});

test("execution boundary binds a clean direct plan-only child to all seven sources and v4 history", async (t) => {
  const api = await subject();
  const fixture = await executionFixture(t);
  const result = await api.verifyJoenessM4PinnedLoadControlExecutionBoundary({
    repositoryRoot: fixture.root,
    planPath: PLAN_PATH,
  });
  assert.equal(result.plan.id, RUN_ID);
  assert.equal(result.executionSource.planImplementationCommit, fixture.support);
  assert.equal(result.executionSource.executionHead, fixture.execution);
  assert.equal(result.executionSource.executionHeadParent, fixture.support);
  assert.equal(result.executionSource.predecessor.persistenceCommit, V4_PERSISTENCE_COMMIT);
  assert.deepEqual(result.executionSource.predecessor.rawArtifact, plan().predecessor.rawArtifact);
  assert.deepEqual(
    result.executionSource.predecessor.evidenceArtifact,
    plan().predecessor.evidenceArtifact,
  );
  assert.deepEqual(
    result.executionSource.predecessor.blockedArtifact,
    { path: plan().predecessor.blockedArtifact.path, status: "absent" },
  );
  assert.deepEqual(
    Object.keys(result.executionSource.sourcePins),
    SOURCE_ROLES,
  );
  assert.equal(result.executionSource.implementationSourcesMatchSupportPlanAndWorking, true);
  assert.equal(result.outputsAbsent, true);
});

test("execution boundary rejects dirty, non-plan, source-drift, output, and symlink states", async (t) => {
  const api = await subject();

  const dirty = await executionFixture(t);
  await writeFile(path.join(dirty.root, "dirty.txt"), "dirty\n", "utf8");
  await assert.rejects(() => api.verifyJoenessM4PinnedLoadControlExecutionBoundary({
    repositoryRoot: dirty.root,
    planPath: PLAN_PATH,
  }), /dirty/u);

  const nonPlan = await executionFixture(t, { extraExecutionFile: true });
  await assert.rejects(() => api.verifyJoenessM4PinnedLoadControlExecutionBoundary({
    repositoryRoot: nonPlan.root,
    planPath: PLAN_PATH,
  }), /plan-only/u);

  const drift = await executionFixture(t, {
    mutatePlan(value) { value.source.diagnosticRunner.sha256 = "f".repeat(64); },
  });
  await assert.rejects(() => api.verifyJoenessM4PinnedLoadControlExecutionBoundary({
    repositoryRoot: drift.root,
    planPath: PLAN_PATH,
  }), /source.*drift/iu);

  const output = await executionFixture(t, { commitOutput: true });
  await assert.rejects(() => api.verifyJoenessM4PinnedLoadControlExecutionBoundary({
    repositoryRoot: output.root,
    planPath: PLAN_PATH,
  }), /output|plan-only/iu);

  const linked = await executionFixture(t);
  await symlink(path.join(linked.root, "outside.json"), path.join(linked.root, ...OUTPUTS.blocked.split("/")));
  await assert.rejects(() => api.verifyJoenessM4PinnedLoadControlExecutionBoundary({
    repositoryRoot: linked.root,
    planPath: PLAN_PATH,
  }), /dirty|symlink|collision/iu);
  assert.equal((await lstat(path.join(linked.root, ...OUTPUTS.blocked.split("/")))).isSymbolicLink(), true);
});

test("default runtime launches once, closes once, removes owned roots, and reads unchanged config", async (t) => {
  const api = await subject();
  const parent = await mkdtemp(path.join(tmpdir(), "joeness-m4-control-runtime-"));
  t.after(() => rm(parent, { recursive: true, force: true }));
  const sourceCodexHome = path.join(parent, "source-home");
  const runParent = path.join(parent, "runs");
  await mkdir(sourceCodexHome);
  await mkdir(runParent);
  await writeFile(path.join(sourceCodexHome, "config.toml"), "model = \"fixture\"\n", "utf8");
  const calls = { create: 0, prepare: 0, open: 0, close: 0, removeHome: 0, removeRoot: 0 };
  const cleanupState = {};
  let runRoot;
  let isolatedHome;
  let closed = false;
  const runtime = await api.createJoenessM4PinnedLoadControlDefaultRuntime({
    plan: plan(),
    repositoryRoot: ROOT,
    sourceCodexHome,
    runParent,
    cleanupState,
    operations: {
      async createExclusiveRunRoot(id, selectedParent) {
        calls.create += 1;
        assert.equal(id, RUN_ID);
        runRoot = path.join(selectedParent, `joewrks-eval-${id}`);
        await mkdir(runRoot);
        return runRoot;
      },
      async prepareRuntime(selectedRoot, options) {
        calls.prepare += 1;
        assert.equal(selectedRoot, runRoot);
        assert.equal(options.expectedCodexVersion, "codex-cli 0.146.0");
        const isolatedParent = path.join(sourceCodexHome, ".eval-runtime");
        await mkdir(isolatedParent);
        isolatedHome = path.join(isolatedParent, `${path.basename(runRoot)}-controller-codex-home`);
        await mkdir(isolatedHome);
        return { isolatedCodexHome: isolatedHome };
      },
      async openAppServer() {
        calls.open += 1;
        return {
          async close() { calls.close += 1; closed = true; },
          get processCloseConfirmed() { return closed; },
          get processExitCode() { return closed ? 0 : null; },
        };
      },
      async removeIsolatedCodexHome(_runRoot, selectedHome) {
        calls.removeHome += 1;
        assert.equal(selectedHome, isolatedHome);
        await rm(selectedHome, { recursive: true, force: false });
      },
      async removeRunRoot(selectedRoot) {
        calls.removeRoot += 1;
        await rm(selectedRoot, { recursive: true, force: false });
      },
    },
  });
  await Promise.all([runtime.finish(true), runtime.finish(true)]);
  assert.deepEqual(calls, { create: 1, prepare: 1, open: 1, close: 1, removeHome: 1, removeRoot: 1 });
  assert.deepEqual(cleanupState.receipt, {
    appServerLaunchCount: 1,
    appServerCloseConfirmedCount: 1,
    remainingOwnedProcessCount: 0,
    isolatedCodexHomeReadback: "absent",
    runRootReadback: "absent",
  });
  assert.deepEqual(cleanupState.sourceConfigAfter, cleanupState.sourceConfigBefore);
  await assert.rejects(lstat(runRoot), { code: "ENOENT" });
  await assert.rejects(lstat(isolatedHome), { code: "ENOENT" });
});

test("source-config snapshot rejects proxy and accessor options without invoking traps", async () => {
  const api = await subject();
  let traps = 0;
  const proxy = new Proxy({}, {
    getOwnPropertyDescriptor() {
      traps += 1;
      throw new Error("source config proxy trap");
    },
  });
  const accessor = {};
  Object.defineProperty(accessor, "sourceCodexHome", {
    enumerable: true,
    get() {
      traps += 1;
      throw new Error("source config accessor trap");
    },
  });
  const revoked = Proxy.revocable({}, {});
  revoked.revoke();
  for (const candidate of [proxy, accessor, revoked.proxy]) {
    await assert.rejects(
      () => api.snapshotJoenessM4PinnedLoadControlSourceConfig(candidate),
      TypeError,
    );
  }
  assert.equal(traps, 0);
});

test("default runtime cleans a partial preparation but treats config mutation as unsafe", async (t) => {
  const api = await subject();
  const parent = await mkdtemp(path.join(tmpdir(), "joeness-m4-control-runtime-failure-"));
  t.after(() => rm(parent, { recursive: true, force: true }));
  const sourceCodexHome = path.join(parent, "source-home");
  const runParent = path.join(parent, "runs");
  await mkdir(sourceCodexHome);
  await mkdir(runParent);
  const configPath = path.join(sourceCodexHome, "config.toml");
  await writeFile(configPath, "model = \"fixture\"\n", "utf8");
  let runRoot;
  let isolatedHome;
  const cleanupState = {};
  const callerOwnedPlan = plan();
  await assert.rejects(() => api.createJoenessM4PinnedLoadControlDefaultRuntime({
    plan: callerOwnedPlan,
    repositoryRoot: ROOT,
    sourceCodexHome,
    runParent,
    cleanupState,
    operations: {
      async createExclusiveRunRoot(id, selectedParent) {
        runRoot = path.join(selectedParent, `joewrks-eval-${id}`);
        await mkdir(runRoot);
        return runRoot;
      },
      async prepareRuntime() {
        const isolatedParent = path.join(sourceCodexHome, ".eval-runtime");
        await mkdir(isolatedParent);
        isolatedHome = path.join(isolatedParent, `${path.basename(runRoot)}-controller-codex-home`);
        await mkdir(isolatedHome);
        callerOwnedPlan.id = "mutated-after-validation";
        throw new Error("prepare failed");
      },
      async openAppServer() { throw new Error("must not open"); },
      async removeIsolatedCodexHome(_runRoot, selectedHome) {
        await rm(selectedHome, { recursive: true, force: false });
      },
      async removeRunRoot(selectedRoot, _parent, runId) {
        assert.equal(runId, RUN_ID);
        await rm(selectedRoot, { recursive: true, force: false });
      },
    },
  }), /partial runtime cleanup failed/u);
  assert.equal(Object.hasOwn(cleanupState, "receipt"), false);
  assert.equal((await lstat(isolatedHome)).isDirectory(), true);
  await assert.rejects(lstat(runRoot), { code: "ENOENT" });
  await rm(isolatedHome, { recursive: true, force: false });

  let closed = false;
  const fullCleanup = {};
  const runtime = await api.createJoenessM4PinnedLoadControlDefaultRuntime({
    plan: plan(),
    repositoryRoot: ROOT,
    sourceCodexHome,
    runParent,
    cleanupState: fullCleanup,
    operations: {
      async createExclusiveRunRoot(id, selectedParent) {
        runRoot = path.join(selectedParent, `joewrks-eval-${id}`);
        await mkdir(runRoot);
        return runRoot;
      },
      async prepareRuntime() {
        const isolatedParent = path.join(sourceCodexHome, ".eval-runtime");
        isolatedHome = path.join(isolatedParent, `${path.basename(runRoot)}-controller-codex-home`);
        await mkdir(isolatedHome);
        return { isolatedCodexHome: isolatedHome };
      },
      async openAppServer() {
        return {
          async close() { closed = true; },
          get processCloseConfirmed() { return closed; },
          get processExitCode() { return 0; },
        };
      },
      async removeIsolatedCodexHome(_runRoot, selectedHome) { await rm(selectedHome, { recursive: true }); },
      async removeRunRoot(selectedRoot) { await rm(selectedRoot, { recursive: true }); },
    },
  });
  await writeFile(configPath, "model = \"mutated\"\n", "utf8");
  await assert.rejects(() => runtime.finish(true), /config changed|cleanup/iu);
  assert.equal(Object.hasOwn(fullCleanup, "receipt"), false);
});

test("preexisting isolated home is preserved when preparation reports EEXIST", async (t) => {
  const api = await subject();
  const fixture = await identityRuntimeFixture(t, "preexisting");
  await mkdir(fixture.isolatedParent);
  await mkdir(fixture.isolatedHome);
  await writeFile(path.join(fixture.isolatedHome, "foreign.txt"), "preserve\n", "utf8");
  const lifecycle = identityRuntimeOperations(fixture, {
    async prepareRuntime() {
      const error = new Error("preexisting isolated home");
      error.code = "EEXIST";
      throw error;
    },
  });
  const cleanupState = {};
  await assert.rejects(() => api.createJoenessM4PinnedLoadControlDefaultRuntime({
    plan: plan(),
    repositoryRoot: ROOT,
    sourceCodexHome: fixture.sourceCodexHome,
    runParent: fixture.runParent,
    cleanupState,
    operations: lifecycle.operations,
  }), /preexisting isolated home|partial runtime cleanup failed/u);
  assert.equal(lifecycle.calls.removeHome, 0);
  assert.equal(await readFile(path.join(fixture.isolatedHome, "foreign.txt"), "utf8"), "preserve\n");
  assert.equal(Object.hasOwn(cleanupState, "receipt"), false);
});

test("acquired isolated-home replacement is preserved and cleanup stays unresolved", async (t) => {
  const api = await subject();
  const fixture = await identityRuntimeFixture(t, "home-replacement");
  const lifecycle = identityRuntimeOperations(fixture);
  const cleanupState = {};
  const runtime = await api.createJoenessM4PinnedLoadControlDefaultRuntime({
    plan: plan(),
    repositoryRoot: ROOT,
    sourceCodexHome: fixture.sourceCodexHome,
    runParent: fixture.runParent,
    cleanupState,
    operations: lifecycle.operations,
  });
  const acquired = `${fixture.isolatedHome}-acquired`;
  await rename(fixture.isolatedHome, acquired);
  await mkdir(fixture.isolatedHome);
  await writeFile(path.join(fixture.isolatedHome, "foreign.txt"), "preserve\n", "utf8");
  await assert.rejects(() => runtime.finish(true), /identity|cleanup/iu);
  assert.equal(lifecycle.calls.removeHome, 0);
  assert.equal(await readFile(path.join(fixture.isolatedHome, "foreign.txt"), "utf8"), "preserve\n");
  assert.equal((await lstat(acquired)).isDirectory(), true);
  assert.equal(Object.hasOwn(cleanupState, "receipt"), false);
});

test("acquired run-root replacement is preserved and cleanup stays unresolved", async (t) => {
  const api = await subject();
  const fixture = await identityRuntimeFixture(t, "root-replacement");
  const lifecycle = identityRuntimeOperations(fixture);
  const cleanupState = {};
  const runtime = await api.createJoenessM4PinnedLoadControlDefaultRuntime({
    plan: plan(),
    repositoryRoot: ROOT,
    sourceCodexHome: fixture.sourceCodexHome,
    runParent: fixture.runParent,
    cleanupState,
    operations: lifecycle.operations,
  });
  const acquired = `${fixture.runRoot}-acquired`;
  await rename(fixture.runRoot, acquired);
  await mkdir(fixture.runRoot);
  await writeFile(path.join(fixture.runRoot, "foreign.txt"), "preserve\n", "utf8");
  await assert.rejects(() => runtime.finish(true), /identity|cleanup/iu);
  assert.equal(lifecycle.calls.removeRoot, 0);
  assert.equal(await readFile(path.join(fixture.runRoot, "foreign.txt"), "utf8"), "preserve\n");
  assert.equal((await lstat(acquired)).isDirectory(), true);
  assert.equal(Object.hasOwn(cleanupState, "receipt"), false);
});

test("symlinked isolated parent cannot redirect cleanup outside the source home", async (t) => {
  const api = await subject();
  const fixture = await identityRuntimeFixture(t, "parent-link");
  const outside = path.join(fixture.parent, "outside-runtime");
  const outsideHome = path.join(
    outside,
    `${path.basename(fixture.runRoot)}-controller-codex-home`,
  );
  await mkdir(outside);
  await mkdir(outsideHome);
  await writeFile(path.join(outsideHome, "foreign.txt"), "preserve\n", "utf8");
  await symlink(outside, fixture.isolatedParent, process.platform === "win32" ? "junction" : "dir");
  const lifecycle = identityRuntimeOperations(fixture, {
    async prepareRuntime() { throw new Error("isolated parent rejected"); },
  });
  const cleanupState = {};
  await assert.rejects(() => api.createJoenessM4PinnedLoadControlDefaultRuntime({
    plan: plan(),
    repositoryRoot: ROOT,
    sourceCodexHome: fixture.sourceCodexHome,
    runParent: fixture.runParent,
    cleanupState,
    operations: lifecycle.operations,
  }), /isolated parent rejected|partial runtime cleanup failed/u);
  assert.equal(lifecycle.calls.removeHome, 0);
  assert.equal(await readFile(path.join(outsideHome, "foreign.txt"), "utf8"), "preserve\n");
  assert.equal(Object.hasOwn(cleanupState, "receipt"), false);
});

test("run-parent replacement during exclusive creation stops before prepare and preserves both trees", async (t) => {
  const api = await subject();
  const fixture = await identityRuntimeFixture(t, "parent-replacement-before-prepare");
  const lifecycle = identityRuntimeOperations(fixture);
  const acquiredParent = `${fixture.runParent}-acquired`;
  let prepareCalls = 0;
  lifecycle.operations.createExclusiveRunRoot = async () => {
    await mkdir(fixture.runRoot);
    await rename(fixture.runParent, acquiredParent);
    await mkdir(fixture.runParent);
    await mkdir(fixture.runRoot);
    await writeFile(path.join(fixture.runRoot, "foreign.txt"), "preserve\n", "utf8");
    return fixture.runRoot;
  };
  lifecycle.operations.prepareRuntime = async () => {
    prepareCalls += 1;
    throw new Error("prepare must not run after parent replacement");
  };
  const cleanupState = {};
  await assert.rejects(() => api.createJoenessM4PinnedLoadControlDefaultRuntime({
    plan: plan(),
    repositoryRoot: ROOT,
    sourceCodexHome: fixture.sourceCodexHome,
    runParent: fixture.runParent,
    cleanupState,
    operations: lifecycle.operations,
  }), /identity|cleanup|replacement/iu);
  assert.equal(prepareCalls, 0);
  assert.equal(lifecycle.calls.removeRoot, 0);
  assert.equal(await readFile(path.join(fixture.runRoot, "foreign.txt"), "utf8"), "preserve\n");
  assert.equal((await lstat(path.join(acquiredParent, path.basename(fixture.runRoot)))).isDirectory(), true);
  assert.equal(Object.hasOwn(cleanupState, "receipt"), false);
});

test("source-home replacement during run-root creation stops before prepare", async (t) => {
  const api = await subject();
  const fixture = await identityRuntimeFixture(t, "source-replacement-before-prepare");
  const lifecycle = identityRuntimeOperations(fixture);
  const acquiredSource = `${fixture.sourceCodexHome}-acquired`;
  let prepareCalls = 0;
  lifecycle.operations.createExclusiveRunRoot = async () => {
    await mkdir(fixture.runRoot);
    await rename(fixture.sourceCodexHome, acquiredSource);
    await mkdir(fixture.sourceCodexHome);
    await writeFile(path.join(fixture.sourceCodexHome, "config.toml"), "model = \"foreign\"\n", "utf8");
    return fixture.runRoot;
  };
  lifecycle.operations.prepareRuntime = async () => {
    prepareCalls += 1;
    throw new Error("prepare must not run after source replacement");
  };
  const cleanupState = {};
  await assert.rejects(() => api.createJoenessM4PinnedLoadControlDefaultRuntime({
    plan: plan(),
    repositoryRoot: ROOT,
    sourceCodexHome: fixture.sourceCodexHome,
    runParent: fixture.runParent,
    cleanupState,
    operations: lifecycle.operations,
  }), /identity|cleanup|replacement/iu);
  assert.equal(prepareCalls, 0);
  assert.equal(await readFile(path.join(fixture.sourceCodexHome, "config.toml"), "utf8"), "model = \"foreign\"\n");
  assert.equal((await lstat(acquiredSource)).isDirectory(), true);
  assert.equal(Object.hasOwn(cleanupState, "receipt"), false);
});

test("run-root replacement returned by prepare stops before app-server open", async (t) => {
  const api = await subject();
  const fixture = await identityRuntimeFixture(t, "root-replacement-after-prepare");
  const lifecycle = identityRuntimeOperations(fixture);
  const acquiredRoot = `${fixture.runRoot}-acquired`;
  let openCalls = 0;
  lifecycle.operations.prepareRuntime = async () => {
    await mkdir(fixture.isolatedParent);
    await mkdir(fixture.isolatedHome);
    await rename(fixture.runRoot, acquiredRoot);
    await mkdir(fixture.runRoot);
    await writeFile(path.join(fixture.runRoot, "foreign.txt"), "preserve\n", "utf8");
    return { isolatedCodexHome: fixture.isolatedHome };
  };
  lifecycle.operations.openAppServer = async () => {
    openCalls += 1;
    throw new Error("open must not run after root replacement");
  };
  const cleanupState = {};
  await assert.rejects(() => api.createJoenessM4PinnedLoadControlDefaultRuntime({
    plan: plan(),
    repositoryRoot: ROOT,
    sourceCodexHome: fixture.sourceCodexHome,
    runParent: fixture.runParent,
    cleanupState,
    operations: lifecycle.operations,
  }), /identity|cleanup|replacement/iu);
  assert.equal(openCalls, 0);
  assert.equal(lifecycle.calls.removeRoot, 0);
  assert.equal(lifecycle.calls.removeHome, 0);
  assert.equal(await readFile(path.join(fixture.runRoot, "foreign.txt"), "utf8"), "preserve\n");
  assert.equal((await lstat(acquiredRoot)).isDirectory(), true);
  assert.equal((await lstat(fixture.isolatedHome)).isDirectory(), true);
  assert.equal(Object.hasOwn(cleanupState, "receipt"), false);
});

test("same-byte source-home replacement during cleanup cannot mint a safe receipt", async (t) => {
  const api = await subject();
  const fixture = await identityRuntimeFixture(t, "source-replacement-during-cleanup");
  const lifecycle = identityRuntimeOperations(fixture);
  const acquiredSource = `${fixture.sourceCodexHome}-acquired`;
  const removeRunRoot = lifecycle.operations.removeRunRoot;
  lifecycle.operations.removeRunRoot = async (...args) => {
    await removeRunRoot(...args);
    await rename(fixture.sourceCodexHome, acquiredSource);
    await mkdir(fixture.sourceCodexHome);
    await writeFile(path.join(fixture.sourceCodexHome, "config.toml"), "model = \"fixture\"\n", "utf8");
  };
  const cleanupState = {};
  const runtime = await api.createJoenessM4PinnedLoadControlDefaultRuntime({
    plan: plan(),
    repositoryRoot: ROOT,
    sourceCodexHome: fixture.sourceCodexHome,
    runParent: fixture.runParent,
    cleanupState,
    operations: lifecycle.operations,
  });
  await assert.rejects(() => runtime.finish(true), /identity|cleanup|source home/iu);
  assert.equal(await readFile(path.join(fixture.sourceCodexHome, "config.toml"), "utf8"), "model = \"fixture\"\n");
  assert.equal((await lstat(acquiredSource)).isDirectory(), true);
  assert.equal(Object.hasOwn(cleanupState, "receipt"), false);
});

test("authentic imported runner and adapter publish transport-only success after final revalidation", async (t) => {
  const api = await subject();
  const repositoryRoot = await cleanEvaluatorRoot(t);
  const fixture = liveOperations();
  const result = await api.runJoenessM4PinnedLoadControlLive({
    repositoryRoot,
    planPath: PLAN_PATH,
    sourceCodexHome: path.join(repositoryRoot, ".test-source-home"),
    runParent: tmpdir(),
    operations: fixture.operations,
  });
  assert.deepEqual(result, {
    status: "PASS",
    scope: "pinned-content-load-transport-only",
    m4Behavior: "NOT-ASSESSED",
    joenessPolicy: "UNVERIFIED",
    superpowersCompatibility: "UNVERIFIED",
    promotionPass: false,
  });
  assert.equal(fixture.calls.createRuntime, 1);
  assert.equal(fixture.calls.verify, 2);
  assert.equal(fixture.calls.success.length, 1);
  assert.equal(fixture.calls.blocked.length, 0);
  assert.deepEqual(
    fixture.calls.runnerBlobReads.filter(
      ({ revision }) => revision === "b".repeat(40),
    ).map(({ relativePath }) => relativePath),
    [
      plan().source.diagnosticRunner.path,
      plan().source.fixtureLoader.path,
      plan().source.freshTurnAdapter.path,
      plan().source.transportControlSupport.path,
      plan().source.diagnosticRunner.path,
      plan().source.fixtureLoader.path,
      plan().source.freshTurnAdapter.path,
      plan().source.transportControlSupport.path,
    ],
  );
  const publication = fixture.calls.success[0];
  assert.equal(publication.rawText, '{"schemaVersion":1,"transport":"ok"}');
  assert.equal(publication.evidence.executionSource.executionHead, "b".repeat(40));
  assert.deepEqual(
    Object.keys(publication.evidence.executionSource.sourcePins),
    SOURCE_ROLES,
  );
  assert.deepEqual(publication.evidence.inputContract, INPUT_CONTRACT);
  assert.deepEqual(publication.evidence.resultBoundary, plan().resultBoundary);
  assert.deepEqual(publication.evidence.privacy, {
    pinnedInputContentsPersisted: false,
    rawEventsPersisted: false,
    configContentsPersisted: false,
    processIdentifiersPersisted: false,
    absolutePathsPersisted: false,
    rawStderrPersisted: false,
  });
  const serialized = JSON.stringify(publication.evidence);
  for (const canary of [
    "private-thread",
    "private-turn",
    "private-message",
    "Evaluate the conflict between",
    "stderr",
    ".test-source-home",
  ]) {
    assert.equal(serialized.includes(canary), false, canary);
  }
});

test("authentic default adapter rejection retains detailed origin but injected runner is generic", async (t) => {
  const api = await subject();
  const repositoryRoot = await cleanEvaluatorRoot(t);
  const authentic = liveOperations({
    session: freshSession({ threadStartError: new Error("PRIVATE-THREAD-START-CANARY") }),
  });
  await assert.rejects(() => api.runJoenessM4PinnedLoadControlLive({
    repositoryRoot,
    planPath: PLAN_PATH,
    sourceCodexHome: path.join(repositoryRoot, ".test-source-home"),
    runParent: tmpdir(),
    operations: authentic.operations,
  }), /fresh evaluator turn validation failed/u);
  assert.equal(authentic.calls.blocked.length, 1);
  assert.equal(authentic.calls.blocked[0].value.freshFailure.schemaVersion, 4);
  assert.equal(authentic.calls.blocked[0].value.freshFailure.runtimeErrorOrigin.classification, "none");
  assert.equal(JSON.stringify(authentic.calls.blocked[0]).includes("PRIVATE-THREAD-START-CANARY"), false);

  let injectedOptions;
  const injected = liveOperations({
    async runEvaluator(options) {
      injectedOptions = options;
      const runtime = await createBoundEvaluatorRuntime(options);
      await runtime.finish(true);
      await options.writeArtifact(OUTPUTS.blocked, delegatedReceipt(freshFailure("error-notification")));
      throw new Error("injected evaluator failure");
    },
  });
  await assert.rejects(() => api.runJoenessM4PinnedLoadControlLive({
    repositoryRoot,
    planPath: PLAN_PATH,
    sourceCodexHome: path.join(repositoryRoot, ".test-source-home"),
    runParent: tmpdir(),
    operations: injected.operations,
  }), /injected evaluator failure/u);
  assert.equal(typeof injectedOptions.runTurn, "function");
  assert.equal(injected.calls.blocked.length, 1);
  assert.equal(Object.hasOwn(injected.calls.blocked[0].value, "freshFailure"), false);
});

test("authentic runner with an injected adapter cannot mint PASS or detailed fresh failure", async (t) => {
  const api = await subject();
  const repositoryRoot = await cleanEvaluatorRoot(t);
  const adapter = await import(pathToFileURL(FRESH_ADAPTER_PATH).href);

  const successSpoof = liveOperations({
    runTurn(options) {
      return adapter.runFreshEvaluatorTurn(options);
    },
  });
  await assert.rejects(() => api.runJoenessM4PinnedLoadControlLive({
    repositoryRoot,
    planPath: PLAN_PATH,
    sourceCodexHome: path.join(repositoryRoot, ".test-source-home"),
    runParent: tmpdir(),
    operations: successSpoof.operations,
  }), /identity|provenance|authentic/iu);
  assert.equal(successSpoof.calls.success.length, 0);
  assert.equal(successSpoof.calls.blocked.length, 0);

  const failureSpoof = liveOperations({
    session: freshSession({ threadStartError: new Error("PRIVATE-SPOOF-CANARY") }),
    runTurn(options) {
      return adapter.runFreshEvaluatorTurn(options);
    },
  });
  await assert.rejects(() => api.runJoenessM4PinnedLoadControlLive({
    repositoryRoot,
    planPath: PLAN_PATH,
    sourceCodexHome: path.join(repositoryRoot, ".test-source-home"),
    runParent: tmpdir(),
    operations: failureSpoof.operations,
  }), /identity|provenance|authentic/iu);
  assert.equal(failureSpoof.calls.success.length, 0);
  assert.equal(failureSpoof.calls.blocked.length, 0);
});

test("success and blocked publication both stop on final boundary drift", async (t) => {
  const api = await subject();
  const repositoryRoot = await cleanEvaluatorRoot(t);
  const success = liveOperations({ boundaryFailureAt: 2 });
  await assert.rejects(() => api.runJoenessM4PinnedLoadControlLive({
    repositoryRoot,
    planPath: PLAN_PATH,
    sourceCodexHome: path.join(repositoryRoot, ".test-source-home"),
    runParent: tmpdir(),
    operations: success.operations,
  }), /boundary changed/u);
  assert.equal(success.calls.success.length, 0);
  assert.equal(success.calls.blocked.length, 0);

  const blocked = liveOperations({
    boundaryFailureAt: 2,
    async runEvaluator(options) {
      const runtime = await createBoundEvaluatorRuntime(options);
      await runtime.finish(true);
      await options.writeArtifact(OUTPUTS.blocked, genericReceipt());
      throw new Error("blocked");
    },
  });
  await assert.rejects(() => api.runJoenessM4PinnedLoadControlLive({
    repositoryRoot,
    planPath: PLAN_PATH,
    sourceCodexHome: path.join(repositoryRoot, ".test-source-home"),
    runParent: tmpdir(),
    operations: blocked.operations,
  }), /boundary changed/u);
  assert.equal(blocked.calls.success.length, 0);
  assert.equal(blocked.calls.blocked.length, 0);
});

test("runtime factory is exactly once and caller-owned boundary mutation cannot move durable scope", async () => {
  const api = await subject();
  let observedSourcePin;
  const fixture = liveOperations({
    async runEvaluator(options) {
      observedSourcePin = structuredClone(options.sourcePin);
      const runtime = await createBoundEvaluatorRuntime(options);
      await assert.rejects(() => createBoundEvaluatorRuntime(options), /exactly once/u);
      await runtime.finish(true);
      await options.writeArtifact(OUTPUTS.blocked, genericReceipt());
      throw new Error("one factory only");
    },
  });
  const create = fixture.operations.createRuntime;
  fixture.operations.createRuntime = async (options) => {
    const runtime = await create(options);
    options.plan.resultBoundary.m4Behavior = "FORGED";
    options.plan.outputs.blocked = "forged.json";
    options.plan.source.diagnosticRunner.sha256 = "f".repeat(64);
    fixture.calls.lastBoundary.executionSource.executionHead = "c".repeat(40);
    fixture.calls.lastBoundary.executionSource.plan.sha256 = "d".repeat(64);
    return runtime;
  };
  await assert.rejects(() => api.runJoenessM4PinnedLoadControlLive({
    repositoryRoot: ROOT,
    planPath: PLAN_PATH,
    sourceCodexHome: path.join(ROOT, ".test-source-home"),
    runParent: tmpdir(),
    operations: fixture.operations,
  }), /one factory only/u);
  assert.equal(fixture.calls.createRuntime, 1);
  assert.equal(fixture.calls.blocked.length, 1);
  assert.equal(fixture.calls.blocked[0].relativePath, OUTPUTS.blocked);
  assert.equal(fixture.calls.blocked[0].value.resultBoundary.m4Behavior, "NOT-ASSESSED");
  assert.equal(fixture.calls.blocked[0].value.executionSource.executionHead, "b".repeat(40));
  assert.equal(observedSourcePin.repositoryCommit, "b".repeat(40));
  assert.equal(observedSourcePin.runner.sha256, plan().source.diagnosticRunner.sha256);
  assert.equal(observedSourcePin.fixtureLoader.sha256, plan().source.fixtureLoader.sha256);
  assert.equal(
    observedSourcePin.transportControlSupport.sha256,
    plan().source.transportControlSupport.sha256,
  );
});

test("partial runtime-factory failure publishes only after safe cleanup and config readback", async (t) => {
  const api = await subject();
  const repositoryRoot = await cleanEvaluatorRoot(t);
  const safe = liveOperations();
  safe.operations.createRuntime = async ({ cleanupState }) => {
    const tupleValue = { bytes: 17, sha256: digest("source-config") };
    cleanupState.sourceConfigBefore = { ...tupleValue };
    cleanupState.sourceConfigAfter = { ...tupleValue };
    cleanupState.receipt = {
      appServerLaunchCount: 0,
      appServerCloseConfirmedCount: 0,
      remainingOwnedProcessCount: 0,
      isolatedCodexHomeReadback: "absent",
      runRootReadback: "absent",
    };
    throw new Error("safe partial factory failure");
  };
  await assert.rejects(() => api.runJoenessM4PinnedLoadControlLive({
    repositoryRoot,
    planPath: PLAN_PATH,
    sourceCodexHome: path.join(repositoryRoot, ".test-source-home"),
    runParent: tmpdir(),
    operations: safe.operations,
  }), /safe partial factory failure/u);
  assert.equal(safe.calls.blocked.length, 1);
  assert.equal(safe.calls.blocked[0].value.phase, "runtime-factory");
  assert.deepEqual(safe.calls.blocked[0].value.inputContract, INPUT_CONTRACT);
  assert.equal(safe.calls.blocked[0].value.runtime.cleanup.appServerLaunchCount, 0);

  const unsafe = liveOperations();
  unsafe.operations.createRuntime = async ({ cleanupState }) => {
    cleanupState.sourceConfigBefore = { bytes: 17, sha256: digest("before") };
    cleanupState.sourceConfigAfter = { bytes: 17, sha256: digest("after") };
    cleanupState.receipt = {
      appServerLaunchCount: 0,
      appServerCloseConfirmedCount: 0,
      remainingOwnedProcessCount: 0,
      isolatedCodexHomeReadback: "absent",
      runRootReadback: "absent",
    };
    throw new Error("unsafe partial factory failure");
  };
  await assert.rejects(() => api.runJoenessM4PinnedLoadControlLive({
    repositoryRoot,
    planPath: PLAN_PATH,
    sourceCodexHome: path.join(repositoryRoot, ".test-source-home"),
    runParent: tmpdir(),
    operations: unsafe.operations,
  }), /unsafe partial factory failure/u);
  assert.equal(unsafe.calls.blocked.length, 0);
});

test("CLI dispatcher routes preflight and live exactly once without automatic retry", async () => {
  const api = await subject();
  const calls = { preflight: 0, live: 0 };
  const operations = {
    async preflight(options) {
      calls.preflight += 1;
      return { mode: "preflight", planPath: options.planPath };
    },
    async live(options) {
      calls.live += 1;
      return { mode: "live", planPath: options.planPath };
    },
  };
  assert.deepEqual(await api.executeJoenessM4PinnedLoadControlLiveCli({
    argv: [],
    repositoryRoot: ROOT,
    sourceCodexHome: path.join(ROOT, ".test-source-home"),
    runParent: tmpdir(),
    operations,
  }), { mode: "preflight", planPath: PLAN_PATH });
  assert.deepEqual(await api.executeJoenessM4PinnedLoadControlLiveCli({
    argv: ["--mode", "live", "--plan", PLAN_PATH],
    repositoryRoot: ROOT,
    sourceCodexHome: path.join(ROOT, ".test-source-home"),
    runParent: tmpdir(),
    operations,
  }), { mode: "live", planPath: PLAN_PATH });
  assert.deepEqual(calls, { preflight: 1, live: 1 });
});

test("actual CLI entrypoint performs default preflight and keeps v5 outputs absent", async (t) => {
  const fixture = await executionFixture(t);
  const sourceCodexHome = path.join(path.dirname(fixture.root), "source-home");
  await mkdir(sourceCodexHome);
  await writeFile(path.join(sourceCodexHome, "config.toml"), "model = \"fixture\"\n", "utf8");
  const modulePath = path.join(
    fixture.root,
    "evals/support/run-joeness-m4-pinned-load-control-live.mjs",
  );
  const { stdout, stderr } = await execFile(process.execPath, [
    modulePath,
    "--mode", "preflight",
    "--plan", PLAN_PATH,
  ], {
    cwd: fixture.root,
    env: { ...process.env, CODEX_HOME: sourceCodexHome },
    encoding: "utf8",
    windowsHide: true,
  });
  assert.equal(stderr, "");
  const receipt = JSON.parse(stdout);
  assert.equal(receipt.mode, "preflight");
  assert.equal(receipt.id, RUN_ID);
  assert.deepEqual(receipt.inputContract, INPUT_CONTRACT);
  for (const outputPath of Object.values(OUTPUTS)) {
    await assert.rejects(lstat(path.join(fixture.root, ...outputPath.split("/"))), { code: "ENOENT" });
  }
});

test("CLI failure emits only the fixed v5 wrapper marker and performs no retry", async () => {
  await assert.rejects(
    execFile(process.execPath, [MODULE_PATH, "--mode", "invalid"], {
      cwd: ROOT,
      encoding: "utf8",
      windowsHide: true,
    }),
    (error) => {
      assert.equal(error.code, 1);
      assert.equal(error.stdout, "");
      assert.equal(error.stderr, "m4-pinned-load-control-live-wrapper-failed\n");
      return true;
    },
  );
});
