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
const PLAN_PATH = "evals/skill-contracts/joeness-m4-superpowers-live-plan-v3.json";
const V3_ATTEMPT_INDEX_PATH = "evals/skill-contracts/joeness-m4-superpowers-attempt-index-v3.json";
const V1_PLAN_PATH = "evals/skill-contracts/joeness-m4-superpowers-live-plan-v1.json";
const V1_BLOCKED_PATH = "evals/skill-contracts/joeness-m4-superpowers-live-v1-blocked.json";
const V1_ATTEMPT_INDEX_PATH = "evals/skill-contracts/joeness-m4-superpowers-attempt-index-v1.json";
const V2_PLAN_PATH = "evals/skill-contracts/joeness-m4-superpowers-live-plan-v2.json";
const V2_BLOCKED_PATH = "evals/skill-contracts/joeness-m4-superpowers-live-v2-blocked.json";
const V2_ATTEMPT_INDEX_PATH = "evals/skill-contracts/joeness-m4-superpowers-attempt-index-v2.json";
const V2_IMPLEMENTATION_COMMIT = "c3c1f482ec3f0a0174d30d8838baa3798cfaeca6";
const V2_EXECUTION_HEAD = "dd675a0dce342514b7eb0aa791afa62adf48983a";
const V2_PERSISTENCE_COMMIT = "04bad279da7c5eded32a97aa8918fbab28192bef";
const V2_METHOD = "bounded-path-private-fresh-failure-stage-and-lifecycle-retention-no-evaluator-contract-change";
const V3_METHOD = "bounded-path-private-fixed-enum-normalized-event-blocker-projection-no-evaluator-contract-change";
const NORMALIZER_BLOCKER_CLASSIFICATIONS = Object.freeze([
  "approval-requested",
  "hook-executed",
  "image-view-target-mismatch",
  "image-view-target-unverified",
  "message-delta-limit-exceeded",
  "required-command-missing",
  "required-cwd-missing",
  "required-exit-code-missing",
  "required-output-missing",
  "required-output-truncated",
  "required-status-missing",
  "runtime-drift",
  "runtime-error",
  "runtime-warning",
  "sandbox-setup-failed",
  "secret-shaped-output",
  "uncontrolled-control-plane",
  "uncontrolled-tool-surface",
  "unknown-item-type",
  "unknown-notification",
  "user-input-requested",
  "none",
  "multiple",
  "unmapped",
]);
const PREDECESSOR = Object.freeze({
  id: "joeness-m4-superpowers-live-v2",
  implementationCommit: V2_IMPLEMENTATION_COMMIT,
  executionHead: V2_EXECUTION_HEAD,
  persistenceCommit: V2_PERSISTENCE_COMMIT,
  plan: Object.freeze({ path: V2_PLAN_PATH, bytes: 2952, sha256: "85be6e07cef1d3165fd0cb504de929dbafc74e227d1b2a403777035d198c449c" }),
  blockedArtifact: Object.freeze({ path: V2_BLOCKED_PATH, bytes: 3540, sha256: "ba29d79c3955f4bfce5059b1e05fbae8744e50eeaf235dd60d331ef3c7f1e4a0" }),
  attemptIndex: Object.freeze({ path: V2_ATTEMPT_INDEX_PATH, bytes: 9264, sha256: "147eead383f1b5e696dd5d7fcc57a9c86915adb8d8448189f4eb59bb95f73156" }),
  sameCommandRetryAuthorized: false,
});

async function subject() {
  return import(`${pathToFileURL(MODULE_PATH).href}?t=${Date.now()}`);
}

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function tuple(pathValue, text) {
  return { path: pathValue, bytes: Buffer.byteLength(text), sha256: digest(text) };
}

function planFixture(implementationCommit = "a".repeat(40), sourceTuples = {}) {
  return {
    schemaVersion: 3,
    id: "joeness-m4-superpowers-live-v3",
    date: "2026-08-14",
    method: V3_METHOD,
    predecessor: structuredClone(PREDECESSOR),
    attempt: { freshTurnCount: 1, retryCount: 0, automaticRetry: false },
    source: {
      planImplementationCommit: implementationCommit,
      runner: sourceTuples.runner ?? tuple("evals/support/run-joeness-m4-superpowers-eval.mjs", "runner"),
      liveWrapper: sourceTuples.liveWrapper ?? tuple("evals/support/run-joeness-m4-superpowers-live.mjs", "wrapper"),
      freshTurnAdapter: sourceTuples.freshTurnAdapter ?? tuple("evals/support/run-fresh-evaluator-turn.mjs", "adapter"),
      collector: sourceTuples.collector ?? tuple("evals/support/collect-codex-app-server.mjs", "collector"),
      fixtureManifest: sourceTuples.fixtureManifest ?? tuple("evals/skill-contracts/fixtures/joeness-m4-superpowers-v1/manifest-v2.json", "manifest"),
    },
    runtime: {
      codexVersion: "codex-cli 0.146.0",
      projectDocs: "disabled",
      installedPluginActivation: "UNVERIFIED",
      dynamicTools: [],
    },
    outputs: {
      raw: "evals/skill-contracts/joeness-m4-superpowers-live-v3-raw.json",
      evidence: "evals/skill-contracts/joeness-m4-superpowers-live-v3-evidence.json",
      blocked: "evals/skill-contracts/joeness-m4-superpowers-live-v3-blocked.json",
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

function blockedReceipt(freshFailure) {
  return {
    schemaVersion: 1,
    status: "blocked",
    phase: "post-runtime-validation",
    safeCleanup: true,
    cause: { category: "evaluation-failed" },
    ...(freshFailure === undefined ? {} : { freshFailure }),
  };
}

function freshFailureFixture(normalizerBlockerClassification = "none") {
  return {
    schemaVersion: 2,
    provenance: "runner-observed-default-fresh-adapter-rejection",
    runnerStage: "fresh-turn-rejected",
    evidenceState: "retained",
    lifecycle: {
      threadStart: "observed",
      turnStart: "observed",
      terminal: "completed",
      terminalCountState: "one",
    },
    eventCounts: {
      observed: 3,
      retained: 3,
      retainedOverLimit: false,
    },
    normalizerBlocker: {
      provenance: "adapter-normalization-fixed-enum",
      classification: normalizerBlockerClassification,
    },
    blockers: {
      count: 0,
      codes: [],
      unclassifiedCount: 0,
    },
    appServerExit: "zero",
    primaryCauseKind: "syntax-error",
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

function earlyDefaultAdapterFailureSession() {
  let processExitCode = null;
  const remoteControlSnapshot = {
    seen: true,
    complete: true,
    status: "disabled",
    environmentAttached: false,
  };
  return {
    notificationCursor: 0,
    mcpInventory: [],
    remoteControlSnapshot,
    client: {
      async request(method) {
        if (method === "thread/start") throw new Error("private thread-start failure");
        throw new Error("unexpected request");
      },
    },
    subscribe() { return () => {}; },
    async close() { processExitCode = 0; },
    get processExitCode() { return processExitCode; },
    get processCloseConfirmed() { return processExitCode === 0; },
    get stderr() {
      return { byteLength: 0, sha256: digest(""), truncated: false, captureTruncated: false };
    },
    get imageDiagnostics() { return null; },
    get successfulImageViews() { return null; },
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

async function gitPathExists(root, revision, relativePath) {
  try {
    await execFile("git", ["cat-file", "-e", `${revision}:${relativePath}`], {
      cwd: root,
      encoding: "utf8",
    });
    return true;
  } catch (error) {
    if (error?.code === 128) return false;
    throw error;
  }
}

async function committedPlanRepo(t, { orphanSupport = false } = {}) {
  const parent = await mkdtemp(path.join(tmpdir(), "joeness-m4-live-"));
  const root = path.join(parent, "repo");
  t.after(() => rm(parent, { recursive: true, force: true }));
  await execFile("git", ["clone", "--quiet", "--shared", ROOT, root], { encoding: "utf8" });
  await git(root, ["config", "user.name", "M4 Test"]);
  await git(root, ["config", "user.email", "m4@example.invalid"]);
  if (orphanSupport) {
    await git(root, ["switch", "--quiet", "--orphan", "isolated-v3-support"]);
    await git(root, ["checkout", V2_PERSISTENCE_COMMIT, "--", "."]);
  } else {
    await git(root, [
      "switch",
      "--quiet",
      "--create",
      "synthetic-v3-support",
      V2_PERSISTENCE_COMMIT,
    ]);
  }
  const sourceTuples = {};
  const draft = planFixture();
  for (const role of ["runner", "liveWrapper", "freshTurnAdapter", "collector", "fixtureManifest"]) {
    const relativePath = draft.source[role].path;
    const content = await readFile(path.join(ROOT, ...relativePath.split("/")));
    await writeRelative(root, relativePath, content);
    sourceTuples[role] = tuple(relativePath, content);
  }
  await git(root, ["add", "."]);
  await git(root, ["commit", "--quiet", "--allow-empty", "-m", "D generation-v3 support"]);
  const implementationCommit = await git(root, ["rev-parse", "HEAD"]);
  const plan = planFixture(implementationCommit, sourceTuples);
  await writeRelative(root, PLAN_PATH, `${JSON.stringify(plan, null, 2)}\n`);
  await git(root, ["add", "."]);
  await git(root, ["commit", "--quiet", "-m", "E plan only"]);
  const executionHead = await git(root, ["rev-parse", "HEAD"]);
  return { root, plan, implementationCommit, executionHead };
}

test("committedPlanRepo builds v3 support from immutable v2 history and adds only the v3 plan", async (t) => {
  const fixture = await committedPlanRepo(t);
  assert.equal(
    await git(fixture.root, [
      "rev-list",
      "--parents",
      "-n",
      "1",
      fixture.implementationCommit,
    ]),
    `${fixture.implementationCommit} ${V2_PERSISTENCE_COMMIT}`,
  );
  for (const relativePath of [
    PLAN_PATH,
    fixture.plan.outputs.raw,
    fixture.plan.outputs.evidence,
    fixture.plan.outputs.blocked,
    V3_ATTEMPT_INDEX_PATH,
  ]) {
    assert.equal(
      await gitPathExists(fixture.root, fixture.implementationCommit, relativePath),
      false,
      relativePath,
    );
  }
  assert.equal(
    await git(fixture.root, ["rev-list", "--parents", "-n", "1", fixture.executionHead]),
    `${fixture.executionHead} ${fixture.implementationCommit}`,
  );
  assert.equal(
    await git(fixture.root, [
      "diff",
      "--name-status",
      fixture.implementationCommit,
      fixture.executionHead,
    ]),
    `A\t${PLAN_PATH}`,
  );
});

test("exports the committed-plan live wrapper boundary", async () => {
  const api = await subject();
  assert.equal(api.JOENESS_M4_LIVE_RUN_ID, "joeness-m4-superpowers-live-v3");
  assert.equal(api.JOENESS_M4_CODEX_VERSION, "codex-cli 0.146.0");
  for (const name of [
    "validateJoenessM4LivePlan",
    "snapshotJoenessM4SourceConfig",
    "verifyJoenessM4ExecutionBoundary",
    "preflightJoenessM4Live",
    "createJoenessM4DefaultRuntime",
    "runJoenessM4Live",
    "rebuildJoenessM4DelegatedBlockedReceipt",
    "parseJoenessM4LiveCli",
  ]) {
    assert.equal(typeof api[name], "function", name);
  }
});

test("wrapper independently rebuilds only selected bounded fresh-failure fields", async () => {
  const api = await subject();
  const valid = freshFailureFixture();
  assert.deepEqual(
    api.rebuildJoenessM4DelegatedBlockedReceipt(blockedReceipt(valid)),
    blockedReceipt(valid),
  );
  const largeSafeCounts = freshFailureFixture();
  largeSafeCounts.eventCounts = {
    observed: Number.MAX_SAFE_INTEGER,
    retained: Number.MAX_SAFE_INTEGER,
    retainedOverLimit: true,
  };
  assert.deepEqual(
    api.rebuildJoenessM4DelegatedBlockedReceipt(blockedReceipt(largeSafeCounts)),
    blockedReceipt(largeSafeCounts),
  );
  const unverifiedExit = freshFailureFixture();
  unverifiedExit.blockers = { count: 1, codes: ["app-server-exit-unverified"], unclassifiedCount: 0 };
  unverifiedExit.appServerExit = "unverified";
  assert.deepEqual(
    api.rebuildJoenessM4DelegatedBlockedReceipt(blockedReceipt(unverifiedExit)),
    blockedReceipt(unverifiedExit),
  );
  const nonzeroExit = freshFailureFixture();
  nonzeroExit.blockers = { count: 1, codes: ["app-server-nonzero-exit"], unclassifiedCount: 0 };
  nonzeroExit.appServerExit = "nonzero";
  assert.deepEqual(
    api.rebuildJoenessM4DelegatedBlockedReceipt(blockedReceipt(nonzeroExit)),
    blockedReceipt(nonzeroExit),
  );
  const duplicateTurnNotCompleted = freshFailureFixture();
  duplicateTurnNotCompleted.lifecycle = {
    threadStart: "observed",
    turnStart: "observed",
    terminal: "ambiguous",
    terminalCountState: "multiple",
  };
  duplicateTurnNotCompleted.blockers = {
    count: 2,
    codes: ["duplicate-terminal-event", "turn-not-completed"],
    unclassifiedCount: 0,
  };
  assert.deepEqual(
    api.rebuildJoenessM4DelegatedBlockedReceipt(blockedReceipt(duplicateTurnNotCompleted)),
    blockedReceipt(duplicateTurnNotCompleted),
  );

  const generic = blockedReceipt();
  const invalid = [];
  const wrongCount = freshFailureFixture(); wrongCount.blockers.count = 1; invalid.push(wrongCount);
  const wrongLimit = freshFailureFixture(); wrongLimit.eventCounts.retainedOverLimit = true; invalid.push(wrongLimit);
  const impossibleLifecycle = freshFailureFixture(); impossibleLifecycle.lifecycle.threadStart = "not-observed"; invalid.push(impossibleLifecycle);
  const wrongTerminalCount = freshFailureFixture(); wrongTerminalCount.lifecycle.terminalCountState = "zero"; invalid.push(wrongTerminalCount);
  const unknownCode = freshFailureFixture(); unknownCode.blockers = { count: 1, codes: ["RAW-BLOCKER-CANARY"], unclassifiedCount: 0 }; invalid.push(unknownCode);
  const duplicateCode = freshFailureFixture(); duplicateCode.blockers = { count: 2, codes: ["missing-terminal-event", "missing-terminal-event"], unclassifiedCount: 0 }; invalid.push(duplicateCode);
  const impossibleMissingDuplicate = freshFailureFixture();
  impossibleMissingDuplicate.lifecycle = { threadStart: "observed", turnStart: "observed", terminal: "ambiguous", terminalCountState: "multiple" };
  impossibleMissingDuplicate.blockers = { count: 2, codes: ["duplicate-terminal-event", "missing-terminal-event"], unclassifiedCount: 0 };
  invalid.push(impossibleMissingDuplicate);
  const impossibleMissingTurn = freshFailureFixture();
  impossibleMissingTurn.lifecycle = { threadStart: "observed", turnStart: "observed", terminal: "missing", terminalCountState: "zero" };
  impossibleMissingTurn.blockers = { count: 2, codes: ["missing-terminal-event", "turn-not-completed"], unclassifiedCount: 0 };
  invalid.push(impossibleMissingTurn);
  const unboundUnverifiedExit = freshFailureFixture(); unboundUnverifiedExit.appServerExit = "unverified"; invalid.push(unboundUnverifiedExit);
  const unboundNonzeroExit = freshFailureFixture(); unboundNonzeroExit.appServerExit = "nonzero"; invalid.push(unboundNonzeroExit);
  const contradictedZeroExit = freshFailureFixture();
  contradictedZeroExit.blockers = { count: 1, codes: ["app-server-nonzero-exit"], unclassifiedCount: 0 };
  invalid.push(contradictedZeroExit);
  const contradictoryExitBlockers = freshFailureFixture();
  contradictoryExitBlockers.blockers = {
    count: 2,
    codes: ["app-server-exit-unverified", "app-server-nonzero-exit"],
    unclassifiedCount: 0,
  };
  contradictoryExitBlockers.appServerExit = "unverified";
  invalid.push(contradictoryExitBlockers);
  const pathValue = freshFailureFixture(); pathValue.primaryCauseKind = "C:\\private\\cause"; invalid.push(pathValue);

  let traps = 0;
  const oldSchema = freshFailureFixture(); oldSchema.schemaVersion = 1; invalid.push(oldSchema);
  const missingNormalizer = freshFailureFixture(); delete missingNormalizer.normalizerBlocker; invalid.push(missingNormalizer);
  const missingNormalizerClassification = freshFailureFixture(); delete missingNormalizerClassification.normalizerBlocker.classification; invalid.push(missingNormalizerClassification);
  const extraNormalizer = freshFailureFixture(); extraNormalizer.normalizerBlocker.rawCanary = "RAW-NORMALIZER-EXTRA-CANARY"; invalid.push(extraNormalizer);
  const symbolNormalizer = freshFailureFixture(); symbolNormalizer.normalizerBlocker[Symbol("raw-normalizer-symbol-canary")] = true; invalid.push(symbolNormalizer);
  const accessorNormalizer = freshFailureFixture();
  Object.defineProperty(accessorNormalizer.normalizerBlocker, "classification", {
    get() { traps += 1; throw new Error("normalizer accessor trap"); },
  });
  invalid.push(accessorNormalizer);
  const liveNormalizerProxy = freshFailureFixture();
  liveNormalizerProxy.normalizerBlocker = new Proxy({}, {
    get() { traps += 1; throw new Error("normalizer proxy get trap"); },
    getPrototypeOf() { traps += 1; throw new Error("normalizer proxy prototype trap"); },
    ownKeys() { traps += 1; throw new Error("normalizer proxy ownKeys trap"); },
  });
  invalid.push(liveNormalizerProxy);
  const revokedNormalizerProxy = freshFailureFixture();
  const revokedNormalizer = Proxy.revocable({}, {});
  revokedNormalizer.revoke();
  revokedNormalizerProxy.normalizerBlocker = revokedNormalizer.proxy;
  invalid.push(revokedNormalizerProxy);
  const invalidNormalizerProvenance = freshFailureFixture();
  invalidNormalizerProvenance.normalizerBlocker.provenance = "RAW-FORGED-PROVENANCE-CANARY";
  invalid.push(invalidNormalizerProvenance);
  const invalidNormalizerClassification = freshFailureFixture();
  invalidNormalizerClassification.normalizerBlocker.classification = "RAW-PRIVATE-RUNTIME-DETAIL-CANARY";
  invalid.push(invalidNormalizerClassification);
  invalid.push(new Proxy(freshFailureFixture(), { get() { traps += 1; throw new Error("proxy trap"); } }));
  const revoked = Proxy.revocable(freshFailureFixture(), {}); revoked.revoke(); invalid.push(revoked.proxy);
  const accessorNested = freshFailureFixture();
  Object.defineProperty(accessorNested.lifecycle, "terminal", { enumerable: true, get() { traps += 1; throw new Error("nested accessor trap"); } });
  invalid.push(accessorNested);

  for (const freshFailure of invalid) {
    const rebuilt = api.rebuildJoenessM4DelegatedBlockedReceipt(blockedReceipt(freshFailure));
    assert.deepEqual(rebuilt, generic);
    assert.equal(JSON.stringify(rebuilt).includes("RAW-"), false);
    assert.equal(JSON.stringify(rebuilt).includes("C:\\private"), false);
  }

  const accessorBase = blockedReceipt();
  Object.defineProperty(accessorBase, "freshFailure", {
    enumerable: true,
    get() { traps += 1; throw new Error("base accessor trap"); },
  });
  assert.deepEqual(api.rebuildJoenessM4DelegatedBlockedReceipt(accessorBase), generic);
  assert.equal(traps, 0);

  const extraFresh = freshFailureFixture();
  extraFresh.rawCanary = "C:\\private\\RAW-FRESH-CANARY";
  extraFresh[Symbol("raw-symbol-canary")] = "RAW-SYMBOL-CANARY";
  for (let index = 0; index < 20_000; index += 1) {
    extraFresh[`ignored-${index}`] = `RAW-EXTRA-CANARY-${index}`;
  }
  Object.defineProperty(extraFresh, "ignoredAccessor", {
    enumerable: true,
    get() { traps += 1; throw new Error("ignored accessor trap"); },
  });
  const rebuiltExtraFresh = api.rebuildJoenessM4DelegatedBlockedReceipt(blockedReceipt(extraFresh));
  assert.deepEqual(rebuiltExtraFresh, blockedReceipt(freshFailureFixture()));

  const extraCodes = freshFailureFixture();
  for (let index = 0; index < 20_000; index += 1) {
    extraCodes.blockers.codes[`ignored-${index}`] = `RAW-ARRAY-CANARY-${index}`;
  }
  const rebuiltExtraCodes = api.rebuildJoenessM4DelegatedBlockedReceipt(blockedReceipt(extraCodes));
  assert.deepEqual(rebuiltExtraCodes, blockedReceipt(freshFailureFixture()));

  const extraBase = blockedReceipt();
  extraBase.rawExtra = "RAW-BASE-CANARY";
  Object.defineProperty(extraBase, "ignoredAccessor", {
    enumerable: true,
    get() { traps += 1; throw new Error("ignored base accessor trap"); },
  });
  const rebuiltExtraBase = api.rebuildJoenessM4DelegatedBlockedReceipt(extraBase);
  assert.deepEqual(rebuiltExtraBase, generic);
  assert.equal(traps, 0);
  assert.equal(
    JSON.stringify([rebuiltExtraFresh, rebuiltExtraCodes, rebuiltExtraBase]).includes("RAW-"),
    false,
  );
});

test("wrapper accepts every fixed normalizer classification and retains no raw detail", async () => {
  const api = await subject();
  for (const classification of NORMALIZER_BLOCKER_CLASSIFICATIONS) {
    const freshFailure = freshFailureFixture(classification);
    const rebuilt = api.rebuildJoenessM4DelegatedBlockedReceipt(blockedReceipt(freshFailure));
    assert.deepEqual(rebuilt.freshFailure?.normalizerBlocker, {
      provenance: "adapter-normalization-fixed-enum",
      classification,
    }, classification);
    assert.equal(JSON.stringify(rebuilt).includes("RAW-"), false, classification);
  }
});

test("wrapper exposes the hidden v2 runtime-error without changing coarse blockers", async () => {
  const api = await subject();
  const freshFailure = freshFailureFixture("runtime-error");
  freshFailure.lifecycle = {
    threadStart: "observed",
    turnStart: "observed",
    terminal: "non-completed",
    terminalCountState: "one",
  };
  freshFailure.blockers = {
    count: 3,
    codes: ["runtime-control-blocker", "turn-not-completed"],
    unclassifiedCount: 1,
  };
  const rebuilt = api.rebuildJoenessM4DelegatedBlockedReceipt(blockedReceipt(freshFailure));
  assert.deepEqual(rebuilt.freshFailure?.normalizerBlocker, {
    provenance: "adapter-normalization-fixed-enum",
    classification: "runtime-error",
  });
  assert.deepEqual(rebuilt.freshFailure?.lifecycle, freshFailure.lifecycle);
  assert.deepEqual(rebuilt.freshFailure?.blockers, freshFailure.blockers);
  assert.equal(rebuilt.freshFailure?.appServerExit, "zero");
});

test("generation-v3 plan validator freezes the new method, v2 predecessor, one turn, retry zero, and no promotion", async () => {
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
    (value) => { value.schemaVersion = 2; },
    (value) => { value.id = "joeness-m4-superpowers-live-v2"; },
    (value) => { value.method = V2_METHOD; },
    (value) => { value.predecessor.id = "joeness-m4-superpowers-live-v1"; },
    (value) => { value.predecessor.executionHead = "f".repeat(40); },
    (value) => { value.predecessor.persistenceCommit = "e".repeat(40); },
    (value) => { value.predecessor.plan.sha256 = "0".repeat(64); },
    (value) => { value.predecessor.sameCommandRetryAuthorized = true; },
    (value) => { value.source.fixtureManifest.path = "evals/skill-contracts/fixtures/joeness-m4-superpowers-v1/manifest.json"; },
    (value) => { value.outputs.raw = "evals/skill-contracts/joeness-m4-superpowers-live-v2-raw.json"; },
    (value) => { value.source.extra = true; },
  ]) {
    const invalid = structuredClone(valid);
    mutate(invalid);
    assert.throws(() => api.validateJoenessM4LivePlan(invalid), /plan|attempt|runtime|promotion|source|output|key/i);
  }
});

test("execution boundary binds a plan-only head to v3 support, exact v2 history, and support/plan/current source pins", async (t) => {
  const api = await subject();
  const fixture = await committedPlanRepo(t);
  const result = await api.verifyJoenessM4ExecutionBoundary({
    repositoryRoot: fixture.root,
    planPath: PLAN_PATH,
  });
  assert.equal(result.plan.source.planImplementationCommit, fixture.implementationCommit);
  assert.deepEqual(result.executionSource, {
    planImplementationCommit: fixture.implementationCommit,
    executionHead: fixture.executionHead,
    executionHeadParent: fixture.implementationCommit,
    plan: result.executionSource.plan,
    predecessor: {
      ...structuredClone(PREDECESSOR),
      artifactsMatchSupportPlanAndWorking: true,
      executionHeadIsAncestorOfSupport: true,
      persistenceCommitIsAncestorOfSupport: true,
    },
    implementationSourcesMatchSupportPlanAndWorking: true,
  });
  assert.equal(result.executionSource.plan.path, PLAN_PATH);
  assert.equal(result.executionSource.plan.bytes > 0, true);
  assert.match(result.executionSource.plan.sha256, /^[0-9a-f]{64}$/);
  assert.equal(result.outputsAbsent, true);
});

test("historical M4 v1 and v2 plans, blocked receipts, and attempt indexes remain byte exact", async () => {
  const tuples = [
    { path: V1_PLAN_PATH, bytes: 1888, sha256: "34d59ba0fd3dfa24973b9ab6e55205ecd3a22da32daf2fa15daaa156273f428c" },
    { path: V1_BLOCKED_PATH, bytes: 1384, sha256: "590c1a44cf7e9660ee2c6df8a32c63cadfcab881154c16aadefcd8315fdcbec4" },
    { path: V1_ATTEMPT_INDEX_PATH, bytes: 6230, sha256: "5a00e7e526075dedb066107229f80beb61e94d5cd6fc125952693d27ccd66455" },
    { path: V2_PLAN_PATH, bytes: 2952, sha256: "85be6e07cef1d3165fd0cb504de929dbafc74e227d1b2a403777035d198c449c" },
    { path: V2_BLOCKED_PATH, bytes: 3540, sha256: "ba29d79c3955f4bfce5059b1e05fbae8744e50eeaf235dd60d331ef3c7f1e4a0" },
    { path: V2_ATTEMPT_INDEX_PATH, bytes: 9264, sha256: "147eead383f1b5e696dd5d7fcc57a9c86915adb8d8448189f4eb59bb95f73156" },
  ];
  for (const expected of tuples) {
    const content = await readFile(path.join(ROOT, ...expected.path.split("/")));
    assert.equal(content.length, expected.bytes, expected.path);
    assert.equal(digest(content), expected.sha256, expected.path);
  }
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

test("execution boundary rejects an intermediate commit after the plan-only head", async (t) => {
  const api = await subject();
  const fixture = await committedPlanRepo(t);
  await git(fixture.root, ["commit", "--quiet", "--allow-empty", "-m", "intermediate"]);
  await assert.rejects(
    api.verifyJoenessM4ExecutionBoundary({
      repositoryRoot: fixture.root,
      planPath: PLAN_PATH,
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
      planPath: PLAN_PATH,
    }),
    /direct single-parent child/i,
  );
});

test("execution boundary rejects a non-plan file in the generation-v3 plan commit", async (t) => {
  const api = await subject();
  const fixture = await committedPlanRepo(t);
  await writeRelative(fixture.root, "unexpected.txt", "extra");
  await git(fixture.root, ["add", "unexpected.txt"]);
  await git(fixture.root, ["commit", "--quiet", "--amend", "--no-edit"]);
  await assert.rejects(
    api.verifyJoenessM4ExecutionBoundary({
      repositoryRoot: fixture.root,
      planPath: PLAN_PATH,
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
    PLAN_PATH,
    `${JSON.stringify(fixture.plan, null, 2)}\n`,
  );
  await git(fixture.root, ["add", PLAN_PATH]);
  await git(fixture.root, ["commit", "--quiet", "--amend", "--no-edit"]);
  await assert.rejects(
    api.verifyJoenessM4ExecutionBoundary({
      repositoryRoot: fixture.root,
      planPath: PLAN_PATH,
    }),
    /source runner pin drift/i,
  );
});

test("execution boundary rejects a dirty worktree before reading runtime state", async (t) => {
  const api = await subject();
  const fixture = await committedPlanRepo(t);
  await writeRelative(fixture.root, "untracked-dirty-canary.txt", "dirty\n");
  await assert.rejects(
    api.verifyJoenessM4ExecutionBoundary({ repositoryRoot: fixture.root, planPath: PLAN_PATH }),
    /worktree.*dirty/i,
  );
});

test("execution boundary rejects working manifest-v2 drift against support and plan pins", async (t) => {
  const api = await subject();
  const fixture = await committedPlanRepo(t);
  const manifestPath = fixture.plan.source.fixtureManifest.path;
  await git(fixture.root, ["update-index", "--assume-unchanged", manifestPath]);
  await writeRelative(fixture.root, manifestPath, "tampered manifest-v2\n");
  assert.equal(await git(fixture.root, ["status", "--porcelain"]), "");
  await assert.rejects(
    api.verifyJoenessM4ExecutionBoundary({ repositoryRoot: fixture.root, planPath: PLAN_PATH }),
    /source fixtureManifest (?:size|pin) drift/i,
  );
});

test("execution boundary rejects a working predecessor artifact that differs from its immutable v2 tuple", async (t) => {
  const api = await subject();
  const fixture = await committedPlanRepo(t);
  await git(fixture.root, ["update-index", "--assume-unchanged", V2_BLOCKED_PATH]);
  await writeRelative(fixture.root, V2_BLOCKED_PATH, "tampered predecessor artifact\n");
  assert.equal(await git(fixture.root, ["status", "--porcelain"]), "");
  await assert.rejects(
    api.verifyJoenessM4ExecutionBoundary({ repositoryRoot: fixture.root, planPath: PLAN_PATH }),
    /predecessor blockedArtifact pin drift/i,
  );
});

test("execution boundary rejects support that does not descend from the exact v2 execution head", async (t) => {
  const api = await subject();
  const fixture = await committedPlanRepo(t, { orphanSupport: true });
  await assert.rejects(
    api.verifyJoenessM4ExecutionBoundary({ repositoryRoot: fixture.root, planPath: PLAN_PATH }),
    /predecessor execution head.*ancestor|lineage/i,
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
      planPath: PLAN_PATH,
    }),
    /output.*collision|symlink/i,
  );
});

test("execution boundary rejects an ignored regular output collision", async (t) => {
  const api = await subject();
  const fixture = await committedPlanRepo(t);
  await writeFile(
    path.join(fixture.root, ".git", "info", "exclude"),
    `${fixture.plan.outputs.blocked}\n`,
    "utf8",
  );
  await writeRelative(fixture.root, fixture.plan.outputs.blocked, "collision\n");
  assert.equal(await git(fixture.root, ["status", "--porcelain"]), "");
  await assert.rejects(
    api.verifyJoenessM4ExecutionBoundary({ repositoryRoot: fixture.root, planPath: PLAN_PATH }),
    /output.*collision/i,
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
        assert.equal(runId, "joeness-m4-superpowers-live-v3");
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
      removeRunRoot: async (runRoot, parent, runId) => {
        calls.removeRoot += 1;
        assert.equal(parent, runParent);
        assert.equal(runId, "joeness-m4-superpowers-live-v3");
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
          runRoot = path.join(runParent, "joewrks-eval-joeness-m4-superpowers-live-v3");
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
            const runRoot = path.join(runParent, "joewrks-eval-joeness-m4-superpowers-live-v3");
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
          runRoot = path.join(runParent, "joewrks-eval-joeness-m4-superpowers-live-v3");
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
        runRoot = path.join(runParent, "joewrks-eval-joeness-m4-superpowers-live-v3");
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
        runRoot = path.join(runParent, "joewrks-eval-joeness-m4-superpowers-live-v3");
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
        runRoot = path.join(runParent, "joewrks-eval-joeness-m4-superpowers-live-v3");
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

test("live wrapper revalidates the plan-only head before success publication and retains v3 lineage", async (t) => {
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
    planPath: PLAN_PATH,
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
          id: "joeness-m4-superpowers-live-v3",
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
    predecessor: {
      ...structuredClone(PREDECESSOR),
      artifactsMatchSupportPlanAndWorking: true,
      executionHeadIsAncestorOfSupport: true,
      persistenceCommitIsAncestorOfSupport: true,
    },
    implementationSourcesMatchSupportPlanAndWorking: true,
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

test("live wrapper blocks success when HEAD changes after runtime but before publication", async (t) => {
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
  let publishCount = 0;
  await assert.rejects(
    api.runJoenessM4Live({
      repositoryRoot: fixture.root,
      planPath: PLAN_PATH,
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
          await git(fixture.root, ["commit", "--quiet", "--allow-empty", "-m", "TOCTOU after runtime"]);
          return options.successPublisher({
            repositoryRoot: fixture.root,
            rawPath: fixture.plan.outputs.raw,
            evidencePath: fixture.plan.outputs.evidence,
            rawText: '{"status":"candidate"}',
            evidence: { freshTurn: true },
          });
        },
        runTurn: async () => {},
        publishSuccess: async () => { publishCount += 1; },
        writeBlocked: async () => {},
      },
    }),
    /direct single-parent child|execution boundary changed/i,
  );
  assert.equal(publishCount, 0);
});

test("runtime factory rejects a second call before creating another runtime", async (t) => {
  const api = await subject();
  const fixture = await committedPlanRepo(t);
  let createRuntimeCount = 0;
  await assert.rejects(
    api.runJoenessM4Live({
      repositoryRoot: fixture.root,
      planPath: PLAN_PATH,
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

test("an injected evaluator cannot forge runner-owned fresh-failure provenance", async (t) => {
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
  const validFreshFailure = freshFailureFixture();
  await assert.rejects(
    api.runJoenessM4Live({
      repositoryRoot: fixture.root,
      planPath: PLAN_PATH,
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
          await options.writeArtifact(
            fixture.plan.outputs.blocked,
            blockedReceipt(validFreshFailure),
          );
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
  assert.equal(Object.hasOwn(blockedWrite.value, "freshFailure"), false);
  assert.equal(JSON.stringify(blockedWrite.value).includes(fixture.root), false);
});

test("the imported pinned runner may retain an exact fresh-adapter rejection projection", async (t) => {
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
  let blockedWrite;
  await assert.rejects(
    api.runJoenessM4Live({
      repositoryRoot: fixture.root,
      planPath: PLAN_PATH,
      sourceCodexHome: path.join(tmpdir(), "unused-codex-home"),
      runParent: tmpdir(),
      operations: {
        verifyExecutionBoundary: api.verifyJoenessM4ExecutionBoundary,
        preflightEvaluator: async () => ({}),
        createRuntime: async (options) => {
          options.cleanupState.sourceConfigBefore = configTuple;
          options.cleanupState.sourceConfigAfter = configTuple;
          options.cleanupState.receipt = cleanupReceipt;
          return {
            session: earlyDefaultAdapterFailureSession(),
            sourceConfigBefore: configTuple,
            readSourceConfig: async () => configTuple,
            finish: async () => {},
          };
        },
        runEvaluator: undefined,
        runTurn: undefined,
        publishSuccess: async () => { throw new Error("success must not publish"); },
        writeBlocked: async (repositoryRoot, relativePath, value) => {
          blockedWrite = { repositoryRoot, relativePath, value };
        },
      },
    }),
    /fresh evaluator turn validation failed/,
  );
  assert.equal(blockedWrite.relativePath, fixture.plan.outputs.blocked);
  assert.deepEqual(blockedWrite.value.freshFailure, {
    schemaVersion: 2,
    provenance: "runner-observed-default-fresh-adapter-rejection",
    runnerStage: "fresh-turn-rejected",
    evidenceState: "retained",
    lifecycle: {
      threadStart: "not-observed",
      turnStart: "not-observed",
      terminal: "missing",
      terminalCountState: "zero",
    },
    eventCounts: { observed: 0, retained: 0, retainedOverLimit: false },
    normalizerBlocker: {
      provenance: "adapter-normalization-fixed-enum",
      classification: "none",
    },
    blockers: { count: 1, codes: ["missing-terminal-event"], unclassifiedCount: 0 },
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
  });
  const durable = JSON.stringify(blockedWrite.value);
  for (const forbidden of ["private thread-start failure", "private-thread", fixture.root, "stderr"]) {
    assert.equal(durable.includes(forbidden), false, forbidden);
  }
});

test("blocked callback performs no write when outer boundary revalidation fails", async (t) => {
  const api = await subject();
  const fixture = await committedPlanRepo(t);
  let verifyCount = 0;
  let writeCount = 0;
  await assert.rejects(
    api.runJoenessM4Live({
      repositoryRoot: fixture.root,
      planPath: PLAN_PATH,
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
    planPath: PLAN_PATH,
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
    id: "joeness-m4-superpowers-live-v3",
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
  const planPath = PLAN_PATH;
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
    ["--mode", "live", "--plan", V1_PLAN_PATH],
    ["--mode", "live", "--plan", V2_PLAN_PATH],
    ["--mode", "live", "--plan", "elsewhere.json"],
    ["--mode", "live", "--plan", planPath, "--retry"],
  ]) assert.throws(() => api.parseJoenessM4LiveCli(argv), /CLI|plan|invalid/i);
});

test("CLI invalid arguments emit one fixed bounded category without their raw canary", async () => {
  const rawCanary = "C:\\private\\RAW_CLI_ERROR_CANARY.json";
  let caught;
  try {
    await execFile(process.execPath, [MODULE_PATH, "--mode", "preflight", "--plan", rawCanary], {
      cwd: ROOT,
      encoding: "utf8",
    });
  } catch (error) {
    caught = error;
  }
  assert.equal(caught?.code, 1);
  assert.equal(caught?.stdout, "");
  assert.equal(caught?.stderr, "m4-live-wrapper-failed\n");
  assert.equal(caught.stderr.includes(rawCanary), false);
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
      planPath: PLAN_PATH,
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
      planPath: PLAN_PATH,
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
      planPath: PLAN_PATH,
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
      planPath: PLAN_PATH,
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
        planPath: PLAN_PATH,
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
