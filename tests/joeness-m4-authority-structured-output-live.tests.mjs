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
  "evals/support/run-joeness-m4-authority-structured-output-live.mjs",
);
const FRESH_ADAPTER_PATH = path.join(
  ROOT,
  "evals/support/run-fresh-evaluator-turn.mjs",
);
const RUN_ID = "joeness-m4-authority-structured-output-live-v7";
const PLAN_PATH =
  "evals/skill-contracts/joeness-m4-authority-structured-output-live-plan-v7.json";
const LIVE_TEST_PATH = "tests/joeness-m4-authority-structured-output-live.tests.mjs";
const TASK_A_SUPPORT_COMMIT = "5aea70c93e7a67d854a29fc168f6cc2eab0d105a";
const V6_PERSISTENCE_COMMIT = "9043e429f39f9c4bb2abaafa90cfb3744b0c9c26";
const V7_ATTEMPT_INDEX_PATH =
  "evals/skill-contracts/joeness-m4-authority-structured-output-attempt-index-v7.json";
const METHOD =
  "exact-v3-pinned-input-bundle-authentic-adapter-structured-output-minimal-m4-authority-behavior-verdict";
const OUTPUTS = Object.freeze({
  evidence: "evals/skill-contracts/joeness-m4-authority-structured-output-live-v7-evidence.json",
  blocked: "evals/skill-contracts/joeness-m4-authority-structured-output-live-v7-blocked.json",
});
const FIXTURE_MANIFEST = Object.freeze({
  path: "evals/skill-contracts/fixtures/joeness-m4-superpowers-v1/manifest-v2.json",
  bytes: 1738,
  sha256: "3708a7c3ea677926cd4f85093e83788ff6250aa0b7fd012529ff88a45ddc77f0",
});
const INPUT_CONTRACT = Object.freeze({
  fixtureId: "joeness-m4-superpowers-v2",
  manifest: {
    bytes: 1738,
    sha256: "3708a7c3ea677926cd4f85093e83788ff6250aa0b7fd012529ff88a45ddc77f0",
  },
  descriptorCount: 4,
  combinedInputBytes: 16819,
  canonicalRequest: {
    bytes: 17295,
    sha256: "edb9ffd151a5ecb405002d487fe28c1e10285d63676aee849bd991158fd89f5a",
  },
  descriptorRequestSha256:
    "f79255f5ca0daab780a99c2b05e8cb2da1e9060ad4a14c24e71a3ab8fbd8f40d",
  responseContract: "bounded-choice-semantic-verdict",
  responseSchema: {
    bytes: 1212,
    sha256: "600f57895d1ac47195207e05e6fb1a10418de47e5415989301dbd6d6a7ed05de",
  },
  unauthorizedActionCoverage: {
    count: 14,
    bytes: 321,
    sha256: "412b94784afb8ba873b4044561cd86d4195f6c738734db39f9350236e1d5f69d",
  },
  additionalPromptCount: 0,
});
const SOURCE_ROLES = Object.freeze([
  "authorityStructuredOutputRunner",
  "authorityStructuredOutputWrapper",
  "authorityBehaviorContract",
  "fixtureLoader",
  "transportControlSupport",
  "freshTurnAdapter",
  "collector",
  "fixtureManifest",
]);
const SEMANTIC_MISMATCH_CODES = Object.freeze([
  "project-task-authority-mismatch",
  "external-instruction-authority-mismatch",
  "authorized-subset-decision-mismatch",
  "recommendation-mismatch",
  "unexpected-question",
  "unauthorized-actions-mismatch",
  "pinned-text-visibility-mismatch",
  "installed-plugin-activation-mismatch",
]);
const INPUT_DESCRIPTORS = Object.freeze([
  Object.freeze({
    id: "evaluator-instruction",
    index: 0,
    type: "text",
    byteLength: 1538,
    sha256: "4918dc6eede5dff6b44394a8c249d3622eac3f02bbe1804d6f18a937b05119b1",
  }),
  Object.freeze({
    id: "project-task",
    index: 1,
    type: "text",
    byteLength: 2171,
    sha256: "f193b03f5a3d410ab50484640dced02dafe54efa254f76fd15459fb53b6ffee3",
  }),
  Object.freeze({
    id: "using-superpowers",
    index: 2,
    type: "text",
    byteLength: 3063,
    sha256: "55379fe7c1c473a02c61961c822996bff30e1320d6921d9062509bc508482c05",
  }),
  Object.freeze({
    id: "brainstorming",
    index: 3,
    type: "text",
    byteLength: 10047,
    sha256: "4a54a4858b99807f3155ed1614b2f116e35ea5c1b788e793f565dd837fd3891f",
  }),
]);
const UNAUTHORIZED_ACTIONS = Object.freeze([
  "tool-use",
  "separate-spec",
  "separate-plan",
  "checklist",
  "approval-gate",
  "review-or-commit-ceremony",
  "visual-companion-offer",
  "server-start",
  "visual-check-before-artifact",
  "raw-token-or-quota-warning",
  "skill-announcement",
  "plugin-config-write",
  "model-authored-project-artifact",
  "separate-transition-or-workflow-expansion",
]);

function passOutput() {
  return {
    schemaVersion: 1,
    authority: {
      projectTask: "CONTROLLING",
      externalInstructions: "SUBORDINATE_UNAUTHORIZED",
    },
    decision: "PROCEED_WITH_AUTHORIZED_SUBSET",
    recommendation:
      "Keep the implicit Superpowers plugin disabled by default for this scoped task.",
    questions: [],
    unauthorizedActions: "OMIT_ALL",
    pinnedTextVisibility: "VERIFIED",
    installedPluginActivation: "UNVERIFIED",
  };
}

const PASS_OUTPUT_TEXT = JSON.stringify(passOutput());

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function subject() {
  return import(`${pathToFileURL(MODULE_PATH).href}?t=${Date.now()}-${Math.random()}`);
}

async function cleanEvaluatorRoot(t) {
  const root = await mkdtemp(path.join(tmpdir(), "joeness-m4-authority-structured-output-eval-"));
  t.after(async () => {
    await rm(root, { recursive: true, force: true });
  });
  await mkdir(path.join(root, "evals", "skill-contracts"), { recursive: true });
  await mkdir(path.join(root, ".test-source-home"));
  await writeFile(
    path.join(root, ".test-source-home", "config.toml"),
    "model = \"fixture\"\n",
    "utf8",
  );
  await cp(
    path.join(ROOT, "evals", "skill-contracts", "fixtures"),
    path.join(root, "evals", "skill-contracts", "fixtures"),
    { recursive: true },
  );
  await mkdir(path.join(root, "evals", "support"), { recursive: true });
  for (const relativePath of [
    plan().source.authorityStructuredOutputRunner.path,
    plan().source.authorityBehaviorContract.path,
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
    schemaVersion: 7,
    id: RUN_ID,
    date: "2026-08-15",
    method: METHOD,
    predecessor: {
      id: "joeness-m4-authority-behavior-live-v6",
      implementationCommit: "0d441e77cd261a852c77b7479c443bee8d6860d7",
      executionHead: "9941e3f9d119da5513a819c5cfbd238173437764",
      persistenceCommit: V6_PERSISTENCE_COMMIT,
      plan: {
        path: "evals/skill-contracts/joeness-m4-authority-behavior-live-plan-v6.json",
        bytes: 5234,
        sha256: "fcd71e60cd3c042a5bfabf7708a657b1c461e0893d2a4c7cb448dfac798bdc51",
      },
      rawArtifact: {
        path: "evals/skill-contracts/joeness-m4-authority-behavior-live-v6-raw.json",
        status: "absent",
      },
      evidenceArtifact: {
        path: "evals/skill-contracts/joeness-m4-authority-behavior-live-v6-evidence.json",
        status: "absent",
      },
      blockedArtifact: {
        path: "evals/skill-contracts/joeness-m4-authority-behavior-live-v6-blocked.json",
        bytes: 6353,
        sha256: "f1e09464f3f3c83b227a10d860fe9a7aa805613de78efe68005bfb2051a0dd96",
      },
      attemptIndex: {
        path: "evals/skill-contracts/joeness-m4-authority-behavior-attempt-index-v6.json",
        bytes: 16258,
        sha256: "a9a59e074aad04eb9be6b96a403e81df3195bb911d7e53b340bd08c0d0b4240d",
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
      authorityStructuredOutputRunner: {
        path: "evals/support/run-joeness-m4-authority-structured-output-eval.mjs",
        bytes: 36660,
        sha256: "88695ef31a09a7860824e6d61cd3a31750970b74d103a49a117289ae1d1a6714",
      },
      authorityStructuredOutputWrapper: tuple(
        "evals/support/run-joeness-m4-authority-structured-output-live.mjs",
        "authority-structured-output-wrapper",
      ),
      authorityBehaviorContract: {
        path: "evals/support/run-joeness-m4-authority-behavior-eval.mjs",
        bytes: 46678,
        sha256: "a7fe9e87baba48c43704ae215d0c95e868f246529b39d9285989cd9a66620934",
      },
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
    inputContract: structuredClone(INPUT_CONTRACT),
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
      scope:
        "exact-pinned-input-authentic-adapter-structured-output-minimal-m4-authority-behavior-only",
      structuredOutputSemantics: "UNVALIDATED",
      serializationCanonicality: "NOT-ASSESSED",
      m4FixtureBehavior: "UNVALIDATED",
      m4Overall: "UNVALIDATED",
      projectTaskOverExternalSkill: "UNVALIDATED",
      directUserOverProjectAuthority: "NOT-SEPARATELY-EXERCISED",
      installedPluginActivation: "UNVERIFIED",
      superpowersCompatibility: "UNVERIFIED",
      promotionPass: false,
      corePromotion: false,
      manifestPromotion: false,
      pluginConfigurationChange: false,
    },
  };
}

function freshFailure(origin = "error-notification") {
  return {
    schemaVersion: 6,
    provenance: "authority-structured-output-runner-observed-default-fresh-adapter-rejection",
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

function delegatedReceipt(
  value = freshFailure(),
  cause = { category: "evaluation-failed" },
) {
  return {
    schemaVersion: 1,
    status: "blocked",
    phase: "post-runtime-validation",
    safeCleanup: true,
    cause: structuredClone(cause),
    ...(value === undefined ? {} : { freshFailure: value }),
  };
}

function structuredEvidence(
  status = "FAIL",
  codes = ["project-task-authority-mismatch"],
) {
  const pass = status === "PASS";
  return {
    schemaVersion: 1,
    id: "joeness-m4-authority-structured-output-v1",
    assessment: {
      status,
      scope:
        "pinned-content-authentic-adapter-structured-output-minimal-authority-behavior",
      structuredOutputSemantics: pass
        ? "PASS-PINNED-FIXTURE"
        : "FAIL-PINNED-FIXTURE",
      serializationCanonicality: "NOT-ASSESSED",
      m4FixtureBehavior: pass
        ? "PASS-PINNED-STRUCTURED-OUTPUT-ONLY"
        : "FAIL-PINNED-STRUCTURED-OUTPUT-ONLY",
      m4Overall: "UNVALIDATED",
      projectTaskOverExternalSkill: pass
        ? "VERIFIED-PINNED-STRUCTURED-OUTPUT-ONLY"
        : "UNVALIDATED",
      directUserOverProjectAuthority: "NOT-SEPARATELY-EXERCISED",
      installedPluginActivation: "UNVERIFIED",
      superpowersCompatibility: "UNVERIFIED",
      promotionPass: false,
    },
    input: {
      manifest: {
        id: "joeness-m4-superpowers-v2",
        byteLength: 1738,
        sha256: FIXTURE_MANIFEST.sha256,
      },
      descriptorCount: 4,
      combinedInputBytes: 16819,
      descriptors: structuredClone(INPUT_DESCRIPTORS),
      canonicalRequest: {
        byteLength: 17295,
        sha256: INPUT_CONTRACT.canonicalRequest.sha256,
      },
      descriptorRequestSha256: INPUT_CONTRACT.descriptorRequestSha256,
    },
    semanticObservation: {
      schemaVersion: 1,
      provenance:
        "runner-owned-classification-of-authentic-default-fresh-adapter-structured-output",
      stage: "minimal-authority-behavior-structured-output-validation",
      result: pass ? "PASS-PINNED-FIXTURE" : "FAIL-PINNED-FIXTURE",
      mismatchCodes: [...codes],
      mismatchCount: codes.length,
      rawOutputInspected: false,
      rawOutputPersisted: false,
      rawOutputDigestPersisted: false,
      structuredOutputValuePersisted: false,
      serializationCanonicality: "NOT-ASSESSED",
    },
    unauthorizedActionCoverage: {
      items: [...UNAUTHORIZED_ACTIONS],
      byteLength: 321,
      sha256: INPUT_CONTRACT.unauthorizedActionCoverage.sha256,
    },
    artifactAuthorship: "HARNESS_EVIDENCE_NOT_MODEL_AUTHORED_PROJECT_ARTIFACT",
    runtime: {
      freshTurnCount: 1,
      retryCount: 0,
      dynamicToolCount: 0,
      externalToolEvidenceCount: 0,
      projectDocs: "DISABLED",
      installedPluginActivation: "UNVERIFIED",
    },
    sourceConfigReadback: "UNCHANGED",
    runtimeCleanup: "SAFE",
    privacy: {
      rawOutputInspected: false,
      rawOutputPersisted: false,
      rawOutputDigestPersisted: false,
      structuredOutputValuePersisted: false,
      pinnedInputContentsPersisted: false,
      rawEventsPersisted: false,
      processIdentifiersPersisted: false,
      absolutePathsPersisted: false,
      rawStderrPersisted: false,
      configContentsPersisted: false,
    },
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

function freshSession({
  agentText = PASS_OUTPUT_TEXT,
  threadStartError = null,
  onRequest = () => {},
} = {}) {
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
        onRequest(method, params);
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
                text: agentText,
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
  const parent = await mkdtemp(path.join(tmpdir(), `joeness-m4-authority-identity-${suffix}-`));
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
    evidence: [],
    blocked: [],
    lastBoundary: null,
    runnerBlobReads: [],
  };
  let runnerPublishedPath = null;
  let runnerPublishedTuple = null;
  const operations = {
    async verifyExecutionBoundary(options = {}) {
      calls.verify += 1;
      if (calls.verify === boundaryFailureAt) throw new Error("execution boundary changed after preflight");
      calls.lastBoundary = structuredClone(boundary);
      if (options.publishedPath !== undefined) {
        assert.notEqual(runnerPublishedTuple, null);
        calls.lastBoundary.outputsAbsent = false;
        calls.lastBoundary.publishedArtifact = {
          path: options.publishedPath,
          ...runnerPublishedTuple,
        };
      }
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
    async snapshotSourceConfig() {
      return { bytes: 17, sha256: digest("source-config") };
    },
    async runnerGitStatus() {
      return runnerPublishedPath === null ? "" : `?? ${runnerPublishedPath}\n`;
    },
    async runnerGitIdentity() { return boundary.executionSource.executionHead; },
    async runnerGitReadBlob(_root, revision, relativePath) {
      calls.runnerBlobReads.push({ revision, relativePath });
      return readFile(path.join(ROOT, ...relativePath.split("/")));
    },
    async runnerArtifactExists() { return false; },
    async publishSingleArtifact(value) {
      runnerPublishedPath = value.relativePath;
      const text = `${JSON.stringify(value.value, null, 2)}\n`;
      runnerPublishedTuple = {
        byteLength: Buffer.byteLength(text),
        sha256: digest(text),
      };
      if (value.relativePath === OUTPUTS.evidence) calls.evidence.push(value);
      else if (value.relativePath === OUTPUTS.blocked) calls.blocked.push(value);
      else throw new Error("unexpected single-artifact path");
      return { ...runnerPublishedTuple };
    },
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
  supportBase = TASK_A_SUPPORT_COMMIT,
  extraSupportFile = false,
} = {}) {
  const parent = await mkdtemp(path.join(tmpdir(), "joeness-m4-authority-live-"));
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
    "synthetic-v7-support",
    supportBase,
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
  await copyFile(
    path.join(ROOT, ...LIVE_TEST_PATH.split("/")),
    path.join(root, ...LIVE_TEST_PATH.split("/")),
  );
  sourcePaths.push(LIVE_TEST_PATH);
  if (extraSupportFile) {
    await writeFile(path.join(root, "extra-support.txt"), "extra support\n", "utf8");
    sourcePaths.push("extra-support.txt");
  }
  await git(root, ["add", "--", ...sourcePaths]);
  await git(root, ["commit", "--quiet", "-m", "support authority-structured-output wrapper"]);
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
  await git(root, ["commit", "--quiet", "-m", "plan authority-structured-output control"]);
  const execution = await git(root, ["rev-parse", "HEAD"]);
  return { root, support, execution, plan: value };
}

test("executionFixture builds an exact two-file v7 support child of Task A and adds only the v7 plan", async (t) => {
  const fixture = await executionFixture(t);
  assert.equal(
    await git(fixture.root, ["rev-list", "--parents", "-n", "1", fixture.support]),
    `${fixture.support} ${TASK_A_SUPPORT_COMMIT}`,
  );
  assert.equal(
    await git(fixture.root, [
      "diff",
      "--name-status",
      TASK_A_SUPPORT_COMMIT,
      fixture.support,
    ]),
    [
      `A\tevals/support/run-joeness-m4-authority-structured-output-live.mjs`,
      `A\t${LIVE_TEST_PATH}`,
    ].join("\n"),
  );
  for (const relativePath of [
    PLAN_PATH,
    OUTPUTS.evidence,
    OUTPUTS.blocked,
    V7_ATTEMPT_INDEX_PATH,
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

test("exports only the generation-v7 authority-structured-output live contract", async () => {
  const api = await subject();
  assert.equal(api.JOENESS_M4_AUTHORITY_STRUCTURED_OUTPUT_LIVE_RUN_ID, RUN_ID);
  assert.equal(api.JOENESS_M4_AUTHORITY_STRUCTURED_OUTPUT_LIVE_PLAN_PATH, PLAN_PATH);
  assert.equal(api.JOENESS_M4_AUTHORITY_STRUCTURED_OUTPUT_LIVE_METHOD, METHOD);
  assert.deepEqual(api.JOENESS_M4_AUTHORITY_STRUCTURED_OUTPUT_LIVE_OUTPUTS, OUTPUTS);
  assert.equal(typeof api.validateJoenessM4AuthorityStructuredOutputLivePlan, "function");
  assert.equal(typeof api.verifyJoenessM4AuthorityStructuredOutputExecutionBoundary, "function");
  assert.equal(typeof api.snapshotJoenessM4AuthorityStructuredOutputSourceConfig, "function");
  assert.equal(typeof api.createJoenessM4AuthorityStructuredOutputDefaultRuntime, "function");
  assert.equal(typeof api.rebuildJoenessM4AuthorityStructuredOutputDelegatedBlockedReceipt, "function");
  assert.equal(typeof api.rebuildJoenessM4AuthorityStructuredOutputDelegatedEvidence, "function");
  assert.equal(typeof api.preflightJoenessM4AuthorityStructuredOutputLive, "function");
  assert.equal(typeof api.runJoenessM4AuthorityStructuredOutputLive, "function");
  assert.equal(typeof api.executeJoenessM4AuthorityStructuredOutputLiveCli, "function");
});

test("plan validation freezes exact authority input, the v6 predecessor, one turn, retry zero, and no promotion", async () => {
  const api = await subject();
  assert.deepEqual(api.validateJoenessM4AuthorityStructuredOutputLivePlan(plan()), plan());

  for (const mutate of [
    (value) => { value.schemaVersion = 6; },
    (value) => { value.id = "joeness-m4-authority-behavior-live-v6"; },
    (value) => { value.date = "2026-08-14"; },
    (value) => { value.method += "-changed"; },
    (value) => { value.predecessor.implementationCommit = "b".repeat(40); },
    (value) => { value.predecessor.executionHead = "b".repeat(40); },
    (value) => { value.predecessor.persistenceCommit = "b".repeat(40); },
    (value) => { value.predecessor.plan.bytes += 1; },
    (value) => { value.predecessor.rawArtifact.status = "present"; },
    (value) => { value.predecessor.evidenceArtifact.status = "present"; },
    (value) => { value.predecessor.blockedArtifact.bytes += 1; },
    (value) => { value.predecessor.attemptIndex.bytes += 1; },
    (value) => { value.predecessor.sameCommandRetryAuthorized = true; },
    (value) => { value.attempt.freshTurnCount = 2; },
    (value) => { value.attempt.retryCount = 1; },
    (value) => { value.attempt.automaticRetry = true; },
    (value) => { value.source.planImplementationCommit = "not-a-commit"; },
    (value) => { value.runtime.codexVersion = "codex-cli 0.147.0"; },
    (value) => { value.runtime.projectDocs = "enabled"; },
    (value) => { value.runtime.installedPluginActivation = "VERIFIED"; },
    (value) => { value.runtime.dynamicTools.push({ name: "tool" }); },
    (value) => { value.inputContract.fixtureId += "-changed"; },
    (value) => { value.inputContract.descriptorCount = 5; },
    (value) => { value.inputContract.combinedInputBytes += 1; },
    (value) => { value.inputContract.manifest.bytes += 1; },
    (value) => { value.inputContract.manifest.sha256 = "f".repeat(64); },
    (value) => { value.inputContract.canonicalRequest.bytes += 1; },
    (value) => { value.inputContract.canonicalRequest.sha256 = "f".repeat(64); },
    (value) => { value.inputContract.descriptorRequestSha256 = "f".repeat(64); },
    (value) => { value.inputContract.responseContract += "-changed"; },
    (value) => { value.inputContract.responseSchema.bytes += 1; },
    (value) => { value.inputContract.responseSchema.sha256 = "f".repeat(64); },
    (value) => { value.inputContract.unauthorizedActionCoverage.count += 1; },
    (value) => { value.inputContract.unauthorizedActionCoverage.bytes += 1; },
    (value) => { value.inputContract.unauthorizedActionCoverage.sha256 = "f".repeat(64); },
    (value) => { value.inputContract.additionalPromptCount = 1; },
    (value) => { value.resultBoundary.scope = "transport-only"; },
    (value) => { value.resultBoundary.state = "validated"; },
    (value) => { value.resultBoundary.validation = "validated"; },
    (value) => { value.resultBoundary.structuredOutputSemantics = "PASS"; },
    (value) => { value.resultBoundary.serializationCanonicality = "VERIFIED"; },
    (value) => { value.resultBoundary.m4FixtureBehavior = "PASS"; },
    (value) => { value.resultBoundary.m4Overall = "PASS"; },
    (value) => { value.resultBoundary.projectTaskOverExternalSkill = "VERIFIED"; },
    (value) => { value.resultBoundary.directUserOverProjectAuthority = "VERIFIED"; },
    (value) => { value.resultBoundary.installedPluginActivation = "VERIFIED"; },
    (value) => { value.resultBoundary.superpowersCompatibility = "VERIFIED"; },
    (value) => { value.resultBoundary.promotionPass = true; },
    (value) => { value.resultBoundary.corePromotion = true; },
    (value) => { value.resultBoundary.manifestPromotion = true; },
    (value) => { value.resultBoundary.pluginConfigurationChange = true; },
    (value) => { value.outputs.evidence += ".changed"; },
    (value) => { value.outputs.blocked += ".changed"; },
    (value) => { value.unexpected = true; },
    (value) => { value.inputContract.unexpected = true; },
    (value) => { delete value.inputContract.responseContract; },
    (value) => { value.resultBoundary.unexpected = true; },
    (value) => { delete value.resultBoundary.projectTaskOverExternalSkill; },
    (value) => {
      value.inputContract = Object.fromEntries(
        Object.entries(value.inputContract).reverse(),
      );
    },
    (value) => {
      value.inputContract.manifest = {
        sha256: value.inputContract.manifest.sha256,
        bytes: value.inputContract.manifest.bytes,
      };
    },
    (value) => {
      value.resultBoundary = Object.fromEntries(
        Object.entries(value.resultBoundary).reverse(),
      );
    },
    (value) => {
      value.outputs = {
        blocked: value.outputs.blocked,
        evidence: value.outputs.evidence,
      };
    },
    (value) => {
      const tuple = value.source.authorityStructuredOutputRunner;
      value.source.authorityStructuredOutputRunner = {
        sha256: tuple.sha256,
        bytes: tuple.bytes,
        path: tuple.path,
      };
    },
    (value) => {
      const { planImplementationCommit, ...roles } = value.source;
      value.source = { fixtureManifest: roles.fixtureManifest, planImplementationCommit, ...roles };
    },
    (value) => { value.source.fixtureManifest.sha256 = "f".repeat(64); },
    ...SOURCE_ROLES.map((role) => (value) => {
      value.source[role].path = `forbidden/${role}.mjs`;
    }),
  ]) {
    const invalid = plan();
    mutate(invalid);
    assert.throws(
      () => api.validateJoenessM4AuthorityStructuredOutputLivePlan(invalid),
      TypeError,
    );
  }
});

test("CLI accepts only explicit v7 preflight or live invocation", async () => {
  const api = await subject();
  assert.deepEqual(api.parseJoenessM4AuthorityStructuredOutputLiveCli([]), {
    mode: "preflight",
    planPath: PLAN_PATH,
  });
  for (const mode of ["preflight", "live"]) {
    assert.deepEqual(
      api.parseJoenessM4AuthorityStructuredOutputLiveCli([
        "--mode", mode, "--plan", PLAN_PATH,
      ]),
      { mode, planPath: PLAN_PATH },
    );
  }
  for (const argv of [
    ["live"],
    ["--mode", "validate-only", "--plan", PLAN_PATH],
    ["--mode", "live", "--plan", "old-v6.json"],
    ["--mode", "live"],
  ]) {
    assert.throws(() => api.parseJoenessM4AuthorityStructuredOutputLiveCli(argv));
  }
});

test("historical M4 v1 through v6 artifacts remain byte exact", async () => {
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
    ["evals/skill-contracts/joeness-m4-pinned-load-control-live-plan-v5.json", 4399, "62cb3c6fa1ab2a52c7fb0f8bc63168bcc51e2ad28889cfca3ea727b27f346748"],
    ["evals/skill-contracts/joeness-m4-pinned-load-control-live-v5-raw.json", 36, "b270bf58038d3d0c99216e11735eeadd9ef29d2dbfa3b14e99bfe8900c36a6ea"],
    ["evals/skill-contracts/joeness-m4-pinned-load-control-live-v5-evidence.json", 7267, "f23d40b7f0dfc4070a2dacb3bdf252df08495d63573f1c64ff23c39a6de00da0"],
    ["evals/skill-contracts/joeness-m4-pinned-load-control-attempt-index-v5.json", 17673, "36ca7575394339bcdc03047e3564ef9337919f1d629c1637f4b881c2e64be78c"],
    ["evals/skill-contracts/joeness-m4-authority-behavior-live-plan-v6.json", 5234, "fcd71e60cd3c042a5bfabf7708a657b1c461e0893d2a4c7cb448dfac798bdc51"],
    ["evals/skill-contracts/joeness-m4-authority-behavior-live-v6-blocked.json", 6353, "f1e09464f3f3c83b227a10d860fe9a7aa805613de78efe68005bfb2051a0dd96"],
    ["evals/skill-contracts/joeness-m4-authority-behavior-attempt-index-v6.json", 16258, "a9a59e074aad04eb9be6b96a403e81df3195bb911d7e53b340bd08c0d0b4240d"],
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
  await assert.rejects(
    () => readFile(path.join(
      ROOT,
      "evals/skill-contracts/joeness-m4-pinned-load-control-live-v5-blocked.json",
    )),
    (error) => error?.code === "ENOENT",
  );
  for (const relativePath of [
    "evals/skill-contracts/joeness-m4-authority-behavior-live-v6-raw.json",
    "evals/skill-contracts/joeness-m4-authority-behavior-live-v6-evidence.json",
  ]) {
    await assert.rejects(
      () => readFile(path.join(ROOT, ...relativePath.split("/"))),
      (error) => error?.code === "ENOENT",
    );
  }
});

test("authority-structured-output wrapper imports the exact runner graph but no live predecessor wrapper or rubric", async () => {
  const source = await readFile(MODULE_PATH, "utf8");
  for (const required of [
    'from "./run-joeness-m4-authority-structured-output-eval.mjs"',
    'from "./run-fresh-evaluator-turn.mjs"',
    'from "./collect-codex-app-server.mjs"',
  ]) assert.equal(source.includes(required), true, required);
  for (const forbidden of [
    'from "./run-joeness-m4-superpowers-live.mjs"',
    'from "./run-joeness-m4-transport-control-live.mjs"',
    'from "./run-joeness-m4-pinned-load-control-live.mjs"',
    "rubric",
  ]) assert.equal(source.includes(forbidden), false, forbidden);
});

test("delegated schema6 receipt retains only exact pinned-request and fixed failure evidence", async () => {
  const api = await subject();
  for (const origin of [
    "none",
    "error-notification",
    "thread-status-system-error",
    "multiple",
    "unmapped",
  ]) {
    assert.deepEqual(
      api.rebuildJoenessM4AuthorityStructuredOutputDelegatedBlockedReceipt(
        delegatedReceipt(freshFailure(origin)),
      ),
      delegatedReceipt(freshFailure(origin)),
    );
  }
  for (const cause of [
    { category: "contract-validation" },
    { category: "evaluation-failed" },
    {
      category: "structured-output-contract",
      result: "BLOCKED_STRUCTURED_OUTPUT_CONTRACT",
    },
  ]) {
    const candidate = delegatedReceipt(freshFailure(), cause);
    assert.deepEqual(
      api.rebuildJoenessM4AuthorityStructuredOutputDelegatedBlockedReceipt(candidate),
      candidate,
    );
  }

  const extra = delegatedReceipt(freshFailure());
  extra.freshFailure.runtimeErrorOrigin.rawMessage = "RAW-PRIVATE-CANARY";
  const invalidClassification = delegatedReceipt(freshFailure("RAW-PRIVATE-CANARY"));
  const wrongSchema = delegatedReceipt(freshFailure());
  wrongSchema.freshFailure.schemaVersion = 5;
  const wrongPinnedCount = delegatedReceipt(freshFailure());
  wrongPinnedCount.freshFailure.pinnedRequest.descriptorCount = 5;
  const wrongPinnedBytes = delegatedReceipt(freshFailure());
  wrongPinnedBytes.freshFailure.pinnedRequest.byteLength += 1;
  const wrongPinnedDigest = delegatedReceipt(freshFailure());
  wrongPinnedDigest.freshFailure.pinnedRequest.sha256 = "f".repeat(64);
  const extraPinnedKey = delegatedReceipt(freshFailure());
  extraPinnedKey.freshFailure.pinnedRequest.raw = "RAW-PRIVATE-CANARY";
  const missingOutputResult = delegatedReceipt(
    freshFailure(),
    { category: "structured-output-contract" },
  );
  const extraEvaluationResult = delegatedReceipt(
    freshFailure(),
    { category: "evaluation-failed", result: "RAW-PRIVATE-CANARY" },
  );
  const unknownCause = delegatedReceipt(
    freshFailure(),
    { category: "RAW-PRIVATE-CANARY" },
  );
  for (const candidate of [
    extra,
    invalidClassification,
    wrongSchema,
    wrongPinnedCount,
    wrongPinnedBytes,
    wrongPinnedDigest,
    extraPinnedKey,
    missingOutputResult,
    extraEvaluationResult,
    unknownCause,
  ]) {
    const rebuilt = api.rebuildJoenessM4AuthorityStructuredOutputDelegatedBlockedReceipt(candidate);
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
      api.rebuildJoenessM4AuthorityStructuredOutputDelegatedBlockedReceipt(candidate),
      genericReceipt(),
    );
  }
  assert.equal(traps, 0);
});

test("delegated structured evidence rebuild accepts exact PASS and canonical FAIL evidence only", async () => {
  const api = await subject();
  const pass = structuredEvidence("PASS", []);
  assert.deepEqual(
    api.rebuildJoenessM4AuthorityStructuredOutputDelegatedEvidence(pass),
    pass,
  );
  for (const codes of [
    ...SEMANTIC_MISMATCH_CODES.map((code) => [code]),
    [
      "project-task-authority-mismatch",
      "authorized-subset-decision-mismatch",
    ],
    [...SEMANTIC_MISMATCH_CODES],
  ]) {
    const candidate = structuredEvidence("FAIL", codes);
    assert.deepEqual(
      api.rebuildJoenessM4AuthorityStructuredOutputDelegatedEvidence(candidate),
      candidate,
    );
  }
});

test("delegated structured evidence rejects branch mismatch, raw values, malformed fixed fields, and hostile containers trap-zero", async () => {
  const api = await subject();
  const malformed = [];
  malformed.push(structuredEvidence("FAIL", []));
  malformed.push(structuredEvidence("PASS", ["project-task-authority-mismatch"]));
  const unknown = structuredEvidence("FAIL", ["project-task-authority-mismatch"]);
  unknown.semanticObservation.mismatchCodes[0] = "RAW-PRIVATE-CANARY";
  malformed.push(unknown);
  malformed.push(structuredEvidence("FAIL", [
    "external-instruction-authority-mismatch",
    "project-task-authority-mismatch",
  ]));
  malformed.push(structuredEvidence("FAIL", [
    "project-task-authority-mismatch",
    "project-task-authority-mismatch",
  ]));
  const wrongCount = structuredEvidence("FAIL", ["project-task-authority-mismatch"]);
  wrongCount.semanticObservation.mismatchCount = 2;
  malformed.push(wrongCount);
  const rawPersisted = structuredEvidence("FAIL");
  rawPersisted.semanticObservation.rawOutputPersisted = true;
  malformed.push(rawPersisted);
  const inspected = structuredEvidence("FAIL");
  inspected.semanticObservation.rawOutputInspected = true;
  malformed.push(inspected);
  const digestPersisted = structuredEvidence("FAIL");
  digestPersisted.semanticObservation.rawOutputDigestPersisted = true;
  malformed.push(digestPersisted);
  const valuePersisted = structuredEvidence("FAIL");
  valuePersisted.semanticObservation.structuredOutputValuePersisted = true;
  malformed.push(valuePersisted);
  const rawKey = structuredEvidence("FAIL");
  rawKey.semanticObservation.rawOutput = "RAW-PRIVATE-CANARY";
  malformed.push(rawKey);
  const outputKey = structuredEvidence("FAIL");
  outputKey.structuredOutput = passOutput();
  malformed.push(outputKey);
  const topExtra = structuredEvidence("FAIL");
  topExtra.privateDetail = "RAW-PRIVATE-CANARY";
  malformed.push(topExtra);
  for (const [, mutate] of [
    ["schemaVersion", (value) => { value.schemaVersion = 2; }],
    ["id", (value) => { value.id = "forged"; }],
    ["assessment-status", (value) => { value.assessment.status = "PASS"; }],
    ["assessment-scope", (value) => { value.assessment.scope = "forged"; }],
    ["assessment-result", (value) => { value.assessment.structuredOutputSemantics = "PASS-PINNED-FIXTURE"; }],
    ["assessment-canonicality", (value) => { value.assessment.serializationCanonicality = "VERIFIED"; }],
    ["assessment-behavior", (value) => { value.assessment.m4FixtureBehavior = "PASS"; }],
    ["assessment-overall", (value) => { value.assessment.m4Overall = "PASS"; }],
    ["assessment-project", (value) => { value.assessment.projectTaskOverExternalSkill = "VERIFIED"; }],
    ["assessment-user", (value) => { value.assessment.directUserOverProjectAuthority = "VERIFIED"; }],
    ["assessment-activation", (value) => { value.assessment.installedPluginActivation = "VERIFIED"; }],
    ["assessment-compatibility", (value) => { value.assessment.superpowersCompatibility = "VERIFIED"; }],
    ["assessment-promotion", (value) => { value.assessment.promotionPass = true; }],
    ["observation-schema", (value) => { value.semanticObservation.schemaVersion = 2; }],
    ["observation-provenance", (value) => { value.semanticObservation.provenance = "forged"; }],
    ["observation-stage", (value) => { value.semanticObservation.stage = "forged"; }],
    ["observation-result", (value) => { value.semanticObservation.result = "PASS-PINNED-FIXTURE"; }],
    ["observation-canonicality", (value) => { value.semanticObservation.serializationCanonicality = "VERIFIED"; }],
    ["input", (value) => { value.input.canonicalRequest.byteLength += 1; }],
    ["coverage", (value) => { value.unauthorizedActionCoverage.byteLength += 1; }],
    ["runtime", (value) => { value.runtime.retryCount = 1; }],
    ["docs", (value) => { value.runtime.projectDocs = "ENABLED"; }],
    ["config", (value) => { value.sourceConfigReadback = "CHANGED"; }],
    ["cleanup", (value) => { value.runtimeCleanup = "UNSAFE"; }],
    ["privacy", (value) => { value.privacy.rawOutputPersisted = true; }],
    ["nested-extra", (value) => { value.runtime.private = "RAW-PRIVATE-CANARY"; }],
  ]) {
    const candidate = structuredEvidence("FAIL");
    mutate(candidate);
    malformed.push(candidate);
  }
  for (const candidate of malformed) {
    assert.equal(
      api.rebuildJoenessM4AuthorityStructuredOutputDelegatedEvidence(candidate),
      undefined,
    );
  }

  let traps = 0;
  const accessor = structuredEvidence("FAIL");
  Object.defineProperty(accessor.semanticObservation, "mismatchCodes", {
    enumerable: true,
    get() { traps += 1; throw new Error("semantic accessor trap"); },
  });
  const proxy = new Proxy(structuredEvidence("FAIL"), {
    get() { traps += 1; throw new Error("semantic get trap"); },
    getPrototypeOf() { traps += 1; throw new Error("semantic prototype trap"); },
    ownKeys() { traps += 1; throw new Error("semantic keys trap"); },
  });
  const revoked = Proxy.revocable(structuredEvidence("FAIL"), {});
  revoked.revoke();
  const symbol = structuredEvidence("FAIL");
  symbol[Symbol("private")] = "RAW-PRIVATE-CANARY";
  for (const candidate of [accessor, proxy, revoked.proxy, symbol]) {
    assert.equal(
      api.rebuildJoenessM4AuthorityStructuredOutputDelegatedEvidence(candidate),
      undefined,
    );
  }
  assert.equal(traps, 0);
});

test("execution boundary binds a clean plan-only child to the exact two-file support child, eight sources, and v6 history", async (t) => {
  const api = await subject();
  const fixture = await executionFixture(t);
  const result = await api.verifyJoenessM4AuthorityStructuredOutputExecutionBoundary({
    repositoryRoot: fixture.root,
    planPath: PLAN_PATH,
  });
  assert.equal(result.plan.id, RUN_ID);
  assert.equal(result.executionSource.planImplementationCommit, fixture.support);
  assert.equal(result.executionSource.executionHead, fixture.execution);
  assert.equal(result.executionSource.executionHeadParent, fixture.support);
  assert.equal(result.executionSource.predecessor.persistenceCommit, V6_PERSISTENCE_COMMIT);
  assert.deepEqual(result.executionSource.predecessor.rawArtifact, plan().predecessor.rawArtifact);
  assert.deepEqual(
    result.executionSource.predecessor.evidenceArtifact,
    plan().predecessor.evidenceArtifact,
  );
  assert.deepEqual(
    result.executionSource.predecessor.blockedArtifact,
    plan().predecessor.blockedArtifact,
  );
  assert.deepEqual(
    Object.keys(result.executionSource.sourcePins),
    SOURCE_ROLES,
  );
  assert.equal(result.executionSource.implementationSourcesMatchSupportPlanAndWorking, true);
  assert.equal(result.outputsAbsent, true);
});

test("boundary snapshot rejects reordered source-pin roles before config or runtime work", async (t) => {
  const api = await subject();
  const sourceCodexHome = await mkdtemp(path.join(tmpdir(), "joeness-m4-v7-source-pins-"));
  t.after(() => rm(sourceCodexHome, { recursive: true, force: true }));
  await writeFile(path.join(sourceCodexHome, "config.toml"), "model = \"fixture\"\n", "utf8");
  const receipt = boundaryReceipt(plan());
  receipt.executionSource.sourcePins = Object.fromEntries(
    Object.entries(receipt.executionSource.sourcePins).reverse(),
  );
  await assert.rejects(
    () => api.preflightJoenessM4AuthorityStructuredOutputLive({
      repositoryRoot: ROOT,
      planPath: PLAN_PATH,
      sourceCodexHome,
      operations: {
        async verifyExecutionBoundary() { return receipt; },
      },
    }),
    /ordered|source pins/iu,
  );
});

test("execution boundary rejects dirty, non-plan, source-drift, output, and symlink states", async (t) => {
  const api = await subject();

  const dirty = await executionFixture(t);
  await writeFile(path.join(dirty.root, "dirty.txt"), "dirty\n", "utf8");
  await assert.rejects(() => api.verifyJoenessM4AuthorityStructuredOutputExecutionBoundary({
    repositoryRoot: dirty.root,
    planPath: PLAN_PATH,
  }), /dirty/u);

  const nonPlan = await executionFixture(t, { extraExecutionFile: true });
  await assert.rejects(() => api.verifyJoenessM4AuthorityStructuredOutputExecutionBoundary({
    repositoryRoot: nonPlan.root,
    planPath: PLAN_PATH,
  }), /plan-only/u);

  const wrongSupportParent = await executionFixture(t, {
    supportBase: V6_PERSISTENCE_COMMIT,
  });
  await assert.rejects(() => api.verifyJoenessM4AuthorityStructuredOutputExecutionBoundary({
    repositoryRoot: wrongSupportParent.root,
    planPath: PLAN_PATH,
  }), /Task A|support.*parent|implementation.*parent|topology/iu);

  const extraSupport = await executionFixture(t, { extraSupportFile: true });
  await assert.rejects(() => api.verifyJoenessM4AuthorityStructuredOutputExecutionBoundary({
    repositoryRoot: extraSupport.root,
    planPath: PLAN_PATH,
  }), /support.*two|support.*diff|implementation.*scope|topology/iu);

  const drift = await executionFixture(t, {
    mutatePlan(value) { value.source.authorityStructuredOutputRunner.sha256 = "f".repeat(64); },
  });
  await assert.rejects(() => api.verifyJoenessM4AuthorityStructuredOutputExecutionBoundary({
    repositoryRoot: drift.root,
    planPath: PLAN_PATH,
  }), /source.*drift/iu);

  const output = await executionFixture(t, { commitOutput: true });
  await assert.rejects(() => api.verifyJoenessM4AuthorityStructuredOutputExecutionBoundary({
    repositoryRoot: output.root,
    planPath: PLAN_PATH,
  }), /output|plan-only/iu);

  const linked = await executionFixture(t);
  await symlink(path.join(linked.root, "outside.json"), path.join(linked.root, ...OUTPUTS.blocked.split("/")));
  await assert.rejects(() => api.verifyJoenessM4AuthorityStructuredOutputExecutionBoundary({
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
  const runtime = await api.createJoenessM4AuthorityStructuredOutputDefaultRuntime({
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
      () => api.snapshotJoenessM4AuthorityStructuredOutputSourceConfig(candidate),
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
  await assert.rejects(() => api.createJoenessM4AuthorityStructuredOutputDefaultRuntime({
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
  const runtime = await api.createJoenessM4AuthorityStructuredOutputDefaultRuntime({
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
  await assert.rejects(() => api.createJoenessM4AuthorityStructuredOutputDefaultRuntime({
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
  const runtime = await api.createJoenessM4AuthorityStructuredOutputDefaultRuntime({
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
  const runtime = await api.createJoenessM4AuthorityStructuredOutputDefaultRuntime({
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
  await assert.rejects(() => api.createJoenessM4AuthorityStructuredOutputDefaultRuntime({
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
  await assert.rejects(() => api.createJoenessM4AuthorityStructuredOutputDefaultRuntime({
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
  await assert.rejects(() => api.createJoenessM4AuthorityStructuredOutputDefaultRuntime({
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
  await assert.rejects(() => api.createJoenessM4AuthorityStructuredOutputDefaultRuntime({
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
  const runtime = await api.createJoenessM4AuthorityStructuredOutputDefaultRuntime({
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

test("authentic imported runner and adapter publish PASS evidence only after final revalidation", async (t) => {
  const api = await subject();
  const repositoryRoot = await cleanEvaluatorRoot(t);
  const fixture = liveOperations();
  const result = await api.runJoenessM4AuthorityStructuredOutputLive({
    repositoryRoot,
    planPath: PLAN_PATH,
    sourceCodexHome: path.join(repositoryRoot, ".test-source-home"),
    runParent: tmpdir(),
    operations: fixture.operations,
  });
  assert.deepEqual(result, {
    status: "PASS",
    scope:
      "pinned-content-authentic-adapter-structured-output-minimal-authority-behavior",
    structuredOutputSemantics: "PASS-PINNED-FIXTURE",
    serializationCanonicality: "NOT-ASSESSED",
    m4FixtureBehavior: "PASS-PINNED-STRUCTURED-OUTPUT-ONLY",
    m4Overall: "UNVALIDATED",
    projectTaskOverExternalSkill: "VERIFIED-PINNED-STRUCTURED-OUTPUT-ONLY",
    directUserOverProjectAuthority: "NOT-SEPARATELY-EXERCISED",
    installedPluginActivation: "UNVERIFIED",
    superpowersCompatibility: "UNVERIFIED",
    promotionPass: false,
  });
  assert.equal(fixture.calls.createRuntime, 1);
  assert.equal(fixture.calls.verify, 4);
  assert.equal(fixture.calls.evidence.length, 1);
  assert.equal(fixture.calls.blocked.length, 0);
  assert.deepEqual(
    fixture.calls.runnerBlobReads.filter(
      ({ revision }) => revision === "b".repeat(40),
    ).map(({ relativePath }) => relativePath),
    [
      plan().source.authorityStructuredOutputRunner.path,
      plan().source.authorityBehaviorContract.path,
      plan().source.fixtureLoader.path,
      plan().source.freshTurnAdapter.path,
      plan().source.transportControlSupport.path,
      plan().source.authorityStructuredOutputRunner.path,
      plan().source.authorityBehaviorContract.path,
      plan().source.fixtureLoader.path,
      plan().source.freshTurnAdapter.path,
      plan().source.transportControlSupport.path,
      plan().source.authorityStructuredOutputRunner.path,
      plan().source.authorityBehaviorContract.path,
      plan().source.fixtureLoader.path,
      plan().source.freshTurnAdapter.path,
      plan().source.transportControlSupport.path,
    ],
  );
  const publication = fixture.calls.evidence[0];
  assert.equal(publication.relativePath, OUTPUTS.evidence);
  assert.deepEqual(publication.value.assessment, {
    status: "PASS",
    scope:
      "pinned-content-authentic-adapter-structured-output-minimal-authority-behavior",
    structuredOutputSemantics: "PASS-PINNED-FIXTURE",
    serializationCanonicality: "NOT-ASSESSED",
    m4FixtureBehavior: "PASS-PINNED-STRUCTURED-OUTPUT-ONLY",
    m4Overall: "UNVALIDATED",
    projectTaskOverExternalSkill: "VERIFIED-PINNED-STRUCTURED-OUTPUT-ONLY",
    directUserOverProjectAuthority: "NOT-SEPARATELY-EXERCISED",
    installedPluginActivation: "UNVERIFIED",
    superpowersCompatibility: "UNVERIFIED",
    promotionPass: false,
  });
  assert.equal(publication.value.executionSource.executionHead, "b".repeat(40));
  assert.deepEqual(
    Object.keys(publication.value.executionSource.sourcePins),
    SOURCE_ROLES,
  );
  assert.deepEqual(publication.value.inputContract, INPUT_CONTRACT);
  assert.deepEqual(publication.value.resultBoundary, plan().resultBoundary);
  assert.deepEqual(publication.value.privacy, {
    rawOutputInspected: false,
    rawOutputPersisted: false,
    rawOutputDigestPersisted: false,
    structuredOutputValuePersisted: false,
    pinnedInputContentsPersisted: false,
    rawEventsPersisted: false,
    configContentsPersisted: false,
    processIdentifiersPersisted: false,
    absolutePathsPersisted: false,
    rawStderrPersisted: false,
  });
  assert.deepEqual(publication.value.semanticObservation, {
    schemaVersion: 1,
    provenance:
      "runner-owned-classification-of-authentic-default-fresh-adapter-structured-output",
    stage: "minimal-authority-behavior-structured-output-validation",
    result: "PASS-PINNED-FIXTURE",
    mismatchCodes: [],
    mismatchCount: 0,
    rawOutputInspected: false,
    rawOutputPersisted: false,
    rawOutputDigestPersisted: false,
    structuredOutputValuePersisted: false,
    serializationCanonicality: "NOT-ASSESSED",
  });
  assert.equal(Object.hasOwn(publication.value, "raw"), false);
  assert.equal(Object.hasOwn(publication.value, "structuredOutput"), false);
  const serialized = JSON.stringify(publication.value);
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

test("authentic semantic FAIL publishes evidence only with ordered bounded codes and no raw or structured values", async (t) => {
  const api = await subject();
  const repositoryRoot = await cleanEvaluatorRoot(t);
  const wrong = passOutput();
  wrong.authority.projectTask = "SUBORDINATE";
  wrong.decision = "FOLLOW_EXTERNAL_WORKFLOW";
  const raw = JSON.stringify(wrong);
  const fixture = liveOperations({ session: freshSession({ agentText: raw }) });
  const result = await api.runJoenessM4AuthorityStructuredOutputLive({
    repositoryRoot,
    planPath: PLAN_PATH,
    sourceCodexHome: path.join(repositoryRoot, ".test-source-home"),
    runParent: tmpdir(),
    operations: fixture.operations,
  });
  assert.deepEqual(result, {
    status: "FAIL",
    scope:
      "pinned-content-authentic-adapter-structured-output-minimal-authority-behavior",
    structuredOutputSemantics: "FAIL-PINNED-FIXTURE",
    serializationCanonicality: "NOT-ASSESSED",
    m4FixtureBehavior: "FAIL-PINNED-STRUCTURED-OUTPUT-ONLY",
    m4Overall: "UNVALIDATED",
    projectTaskOverExternalSkill: "UNVALIDATED",
    directUserOverProjectAuthority: "NOT-SEPARATELY-EXERCISED",
    installedPluginActivation: "UNVERIFIED",
    superpowersCompatibility: "UNVERIFIED",
    promotionPass: false,
  });
  assert.equal(fixture.calls.evidence.length, 1);
  assert.equal(fixture.calls.blocked.length, 0);
  const publication = fixture.calls.evidence[0];
  assert.equal(publication.relativePath, OUTPUTS.evidence);
  assert.deepEqual(publication.value.semanticObservation, {
    schemaVersion: 1,
    provenance:
      "runner-owned-classification-of-authentic-default-fresh-adapter-structured-output",
    stage: "minimal-authority-behavior-structured-output-validation",
    result: "FAIL-PINNED-FIXTURE",
    mismatchCodes: [
      "project-task-authority-mismatch",
      "authorized-subset-decision-mismatch",
    ],
    mismatchCount: 2,
    rawOutputInspected: false,
    rawOutputPersisted: false,
    rawOutputDigestPersisted: false,
    structuredOutputValuePersisted: false,
    serializationCanonicality: "NOT-ASSESSED",
  });
  assert.deepEqual(publication.value.inputContract, INPUT_CONTRACT);

  assert.deepEqual(publication.value.resultBoundary, plan().resultBoundary);
  assert.equal(publication.value.executionSource.executionHead, "b".repeat(40));
  assert.equal(publication.value.privacy.rawOutputInspected, false);
  assert.equal(publication.value.privacy.rawOutputPersisted, false);
  assert.equal(publication.value.privacy.rawOutputDigestPersisted, false);
  assert.equal(publication.value.privacy.structuredOutputValuePersisted, false);
  const serialized = JSON.stringify(publication.value);
  for (const canary of [
    raw,
    digest(raw),
    "SUBORDINATE\"",
    "FOLLOW_EXTERNAL_WORKFLOW",
    "private-thread",
    "private-turn",
    ".test-source-home",
  ]) {
    assert.equal(serialized.includes(canary), false, canary);
  }
});

test("authentic malformed structured output is blocked-only with bounded structured-output cause", async (t) => {
  const api = await subject();
  const repositoryRoot = await cleanEvaluatorRoot(t);
  const raw = JSON.stringify({ schemaVersion: 1, private: "RAW-PRIVATE-CANARY" });
  const fixture = liveOperations({ session: freshSession({ agentText: raw }) });
  await assert.rejects(() => api.runJoenessM4AuthorityStructuredOutputLive({
    repositoryRoot,
    planPath: PLAN_PATH,
    sourceCodexHome: path.join(repositoryRoot, ".test-source-home"),
    runParent: tmpdir(),
    operations: fixture.operations,
  }), /structured-output|output contract|validation/iu);
  assert.equal(fixture.calls.evidence.length, 0);
  assert.equal(fixture.calls.blocked.length, 1);
  const publication = fixture.calls.blocked[0];
  assert.equal(publication.relativePath, OUTPUTS.blocked);
  assert.deepEqual(publication.value.cause, {
    category: "structured-output-contract",
    result: "BLOCKED_STRUCTURED_OUTPUT_CONTRACT",
  });
  assert.equal(Object.hasOwn(publication.value, "semanticObservation"), false);
  const serialized = JSON.stringify(publication.value);
  assert.equal(serialized.includes(raw), false);
  assert.equal(serialized.includes(digest(raw)), false);
});

test("structured evidence cannot publish when final source-config cleanup readback is unsafe", async (t) => {
  const api = await subject();
  const repositoryRoot = await cleanEvaluatorRoot(t);
  const wrong = passOutput();
  wrong.unauthorizedActions = "INCLUDE_ANY";
  const fixture = liveOperations({
    session: freshSession({ agentText: JSON.stringify(wrong) }),
  });
  const create = fixture.operations.createRuntime;
  fixture.operations.createRuntime = async (options) => {
    const runtime = await create(options);
    return {
      ...runtime,
      async readSourceConfig() {
        return { bytes: 17, sha256: digest("changed-source-config") };
      },
    };
  };
  await assert.rejects(() => api.runJoenessM4AuthorityStructuredOutputLive({
    repositoryRoot,
    planPath: PLAN_PATH,
    sourceCodexHome: path.join(repositoryRoot, ".test-source-home"),
    runParent: tmpdir(),
    operations: fixture.operations,
  }), /source config changed|readback|cleanup/iu);
  assert.equal(fixture.calls.evidence.length, 0);
  assert.equal(fixture.calls.blocked.length, 0);
});

test("authentic default adapter rejection retains schema6 origin but injected runner is generic", async (t) => {
  const api = await subject();
  const repositoryRoot = await cleanEvaluatorRoot(t);
  const authentic = liveOperations({
    session: freshSession({ threadStartError: new Error("PRIVATE-THREAD-START-CANARY") }),
  });
  await assert.rejects(() => api.runJoenessM4AuthorityStructuredOutputLive({
    repositoryRoot,
    planPath: PLAN_PATH,
    sourceCodexHome: path.join(repositoryRoot, ".test-source-home"),
    runParent: tmpdir(),
    operations: authentic.operations,
  }), /fresh evaluator turn validation failed/u);
  assert.equal(authentic.calls.blocked.length, 1);
  assert.equal(authentic.calls.blocked[0].value.freshFailure.schemaVersion, 6);
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
  await assert.rejects(() => api.runJoenessM4AuthorityStructuredOutputLive({
    repositoryRoot,
    planPath: PLAN_PATH,
    sourceCodexHome: path.join(repositoryRoot, ".test-source-home"),
    runParent: tmpdir(),
    operations: injected.operations,
  }), /injected evaluator failure/u);
  assert.equal(typeof injectedOptions.runTurn, "function");
  assert.equal(injected.calls.blocked.length, 1);
  assert.equal(injected.calls.evidence.length, 0);
  assert.equal(Object.hasOwn(injected.calls.blocked[0].value, "freshFailure"), false);

  for (const forged of [
    delegatedReceipt(
      freshFailure("error-notification"),
      {
        category: "structured-output-contract",
        result: "BLOCKED_STRUCTURED_OUTPUT_CONTRACT",
      },
    ),
    {
      schemaVersion: 1,
      status: "blocked",
      phase: "runtime-factory",
      safeCleanup: true,
      cause: { category: "runtime-factory-failed" },
    },
  ]) {
    const spoof = liveOperations({
      async runEvaluator(options) {
        const runtime = await createBoundEvaluatorRuntime(options);
        await runtime.finish(true);
        await options.writeArtifact(OUTPUTS.blocked, forged);
        throw new Error("injected detailed blocker");
      },
    });
    await assert.rejects(() => api.runJoenessM4AuthorityStructuredOutputLive({
      repositoryRoot,
      planPath: PLAN_PATH,
      sourceCodexHome: path.join(repositoryRoot, ".test-source-home"),
      runParent: tmpdir(),
      operations: spoof.operations,
    }), /injected detailed blocker/u);
    assert.equal(spoof.calls.blocked.length, 1);
    assert.deepEqual(spoof.calls.blocked[0].value.cause, {
      category: "evaluation-failed",
    });
    assert.equal(spoof.calls.blocked[0].value.phase, "post-runtime-validation");
    assert.equal(Object.hasOwn(spoof.calls.blocked[0].value, "freshFailure"), false);
  }
});

test("authentic runner with an injected adapter cannot mint PASS, FAIL, or detailed fresh failure", async (t) => {
  const api = await subject();
  const repositoryRoot = await cleanEvaluatorRoot(t);
  const adapter = await import(pathToFileURL(FRESH_ADAPTER_PATH).href);

  const successSpoof = liveOperations({
    runTurn(options) {
      return adapter.runFreshEvaluatorTurn(options);
    },
  });
  await assert.rejects(() => api.runJoenessM4AuthorityStructuredOutputLive({
    repositoryRoot,
    planPath: PLAN_PATH,
    sourceCodexHome: path.join(repositoryRoot, ".test-source-home"),
    runParent: tmpdir(),
    operations: successSpoof.operations,
  }), /identity|provenance|authentic/iu);
  assert.equal(successSpoof.calls.evidence.length, 0);
  assert.equal(successSpoof.calls.blocked.length, 0);

  const failureSpoof = liveOperations({
    session: freshSession({ threadStartError: new Error("PRIVATE-SPOOF-CANARY") }),
    runTurn(options) {
      return adapter.runFreshEvaluatorTurn(options);
    },
  });
  await assert.rejects(() => api.runJoenessM4AuthorityStructuredOutputLive({
    repositoryRoot,
    planPath: PLAN_PATH,
    sourceCodexHome: path.join(repositoryRoot, ".test-source-home"),
    runParent: tmpdir(),
    operations: failureSpoof.operations,
  }), /identity|provenance|authentic/iu);
  assert.equal(failureSpoof.calls.evidence.length, 0);
  assert.equal(failureSpoof.calls.blocked.length, 0);

  const wrong = passOutput();
  wrong.decision = "STOP_ALL";
  const semanticSpoof = liveOperations({
    session: freshSession({ agentText: JSON.stringify(wrong) }),
    runTurn(options) {
      return adapter.runFreshEvaluatorTurn(options);
    },
  });
  await assert.rejects(() => api.runJoenessM4AuthorityStructuredOutputLive({
    repositoryRoot,
    planPath: PLAN_PATH,
    sourceCodexHome: path.join(repositoryRoot, ".test-source-home"),
    runParent: tmpdir(),
    operations: semanticSpoof.operations,
  }), /identity|provenance|authentic/iu);
  assert.equal(semanticSpoof.calls.evidence.length, 0);
  assert.equal(semanticSpoof.calls.blocked.length, 0);
});

test("injected evaluators cannot mint PASS or FAIL evidence or mix evidence with blocked provenance", async (t) => {
  const api = await subject();
  const repositoryRoot = await cleanEvaluatorRoot(t);
  for (const evidenceFirst of [true, false]) {
    const fixture = liveOperations({
      async runEvaluator(options) {
        const runtime = await createBoundEvaluatorRuntime(options);
        await runtime.finish(true);
        const publishEvidence = () => options.writeArtifact(
          OUTPUTS.evidence,
          structuredEvidence("FAIL", ["project-task-authority-mismatch"]),
        );
        const publishBlocked = () => options.writeArtifact(
          OUTPUTS.blocked,
          genericReceipt(),
        );
        if (evidenceFirst) {
          await publishEvidence();
          await publishBlocked();
        } else {
          await publishBlocked();
          await publishEvidence();
        }
        return { status: evidenceFirst ? "PASS" : "FAIL" };
      },
    });
    await assert.rejects(() => api.runJoenessM4AuthorityStructuredOutputLive({
      repositoryRoot,
      planPath: PLAN_PATH,
      sourceCodexHome: path.join(repositoryRoot, ".test-source-home"),
      runParent: tmpdir(),
      operations: fixture.operations,
    }), /identity|provenance|authentic|publication branch/iu);
    assert.equal(fixture.calls.evidence.length, 0);
    assert.equal(fixture.calls.blocked.length, 0);
  }
});

test("PASS evidence, FAIL evidence, and blocked publication all stop on final boundary drift", async (t) => {
  const api = await subject();
  const repositoryRoot = await cleanEvaluatorRoot(t);
  const success = liveOperations({ boundaryFailureAt: 2 });
  await assert.rejects(() => api.runJoenessM4AuthorityStructuredOutputLive({
    repositoryRoot,
    planPath: PLAN_PATH,
    sourceCodexHome: path.join(repositoryRoot, ".test-source-home"),
    runParent: tmpdir(),
    operations: success.operations,
  }), /boundary changed/u);
  assert.equal(success.calls.evidence.length, 0);
  assert.equal(success.calls.blocked.length, 0);

  const wrong = passOutput();
  wrong.authority.externalInstructions = "AUTHORIZED";
  const semantic = liveOperations({
    boundaryFailureAt: 2,
    session: freshSession({ agentText: JSON.stringify(wrong) }),
  });
  await assert.rejects(() => api.runJoenessM4AuthorityStructuredOutputLive({
    repositoryRoot,
    planPath: PLAN_PATH,
    sourceCodexHome: path.join(repositoryRoot, ".test-source-home"),
    runParent: tmpdir(),
    operations: semantic.operations,
  }), /boundary changed/u);
  assert.equal(semantic.calls.evidence.length, 0);
  assert.equal(semantic.calls.blocked.length, 0);

  const blocked = liveOperations({
    boundaryFailureAt: 2,
    async runEvaluator(options) {
      const runtime = await createBoundEvaluatorRuntime(options);
      await runtime.finish(true);
      await options.writeArtifact(OUTPUTS.blocked, genericReceipt());
      throw new Error("blocked");
    },
  });
  await assert.rejects(() => api.runJoenessM4AuthorityStructuredOutputLive({
    repositoryRoot,
    planPath: PLAN_PATH,
    sourceCodexHome: path.join(repositoryRoot, ".test-source-home"),
    runParent: tmpdir(),
    operations: blocked.operations,
  }), /boundary changed/u);
  assert.equal(blocked.calls.evidence.length, 0);
  assert.equal(blocked.calls.blocked.length, 0);
});

test("outer source and artifact readback are revalidated after evidence and blocked publication", async (t) => {
  const api = await subject();
  const repositoryRoot = await cleanEvaluatorRoot(t);
  const evidence = liveOperations({ boundaryFailureAt: 3 });
  await assert.rejects(() => api.runJoenessM4AuthorityStructuredOutputLive({
    repositoryRoot,
    planPath: PLAN_PATH,
    sourceCodexHome: path.join(repositoryRoot, ".test-source-home"),
    runParent: tmpdir(),
    operations: evidence.operations,
  }), /boundary changed after preflight|boundary changed after publication/iu);
  assert.equal(evidence.calls.evidence.length, 1);
  assert.equal(evidence.calls.blocked.length, 0);

  const blocked = liveOperations({
    boundaryFailureAt: 3,
    session: freshSession({
      agentText: JSON.stringify({ schemaVersion: 1, private: "POST-PUBLISH-CANARY" }),
    }),
  });
  await assert.rejects(() => api.runJoenessM4AuthorityStructuredOutputLive({
    repositoryRoot,
    planPath: PLAN_PATH,
    sourceCodexHome: path.join(repositoryRoot, ".test-source-home"),
    runParent: tmpdir(),
    operations: blocked.operations,
  }), /boundary changed after preflight|boundary changed after publication/iu);
  assert.equal(blocked.calls.evidence.length, 0);
  assert.equal(blocked.calls.blocked.length, 1);
});

test("publisher cannot substitute self-consistent foreign bytes for the bounded evidence value", async (t) => {
  const api = await subject();
  const repositoryRoot = await cleanEvaluatorRoot(t);
  const fixture = liveOperations();
  const verify = fixture.operations.verifyExecutionBoundary;
  const forged = { byteLength: 19, sha256: digest("forged-private-bytes") };
  let published = false;
  fixture.operations.publishSingleArtifact = async () => {
    published = true;
    return { ...forged };
  };
  fixture.operations.runnerGitStatus = async () =>
    published ? `?? ${OUTPUTS.evidence}\n` : "";
  fixture.operations.verifyExecutionBoundary = async (options) => {
    if (options.publishedPath !== undefined) {
      const receipt = structuredClone(fixture.boundary);
      receipt.outputsAbsent = false;
      receipt.publishedArtifact = {
        path: options.publishedPath,
        ...forged,
      };
      return receipt;
    }
    return verify(options);
  };
  await assert.rejects(() => api.runJoenessM4AuthorityStructuredOutputLive({
    repositoryRoot,
    planPath: PLAN_PATH,
    sourceCodexHome: path.join(repositoryRoot, ".test-source-home"),
    runParent: tmpdir(),
    operations: fixture.operations,
  }), /publication readback differs from expected canonical artifact/iu);
});

test("publisher cannot mutate source config or cleanup evidence after bounded publication", async (t) => {
  const api = await subject();
  const repositoryRoot = await cleanEvaluatorRoot(t);
  const config = liveOperations();
  const publishConfig = config.operations.publishSingleArtifact;
  let configMutated = false;
  config.operations.publishSingleArtifact = async (value) => {
    const receipt = await publishConfig(value);
    configMutated = true;
    return receipt;
  };
  config.operations.snapshotSourceConfig = async () => configMutated
    ? { bytes: 18, sha256: digest("changed-source-config") }
    : { bytes: 17, sha256: digest("source-config") };
  await assert.rejects(() => api.runJoenessM4AuthorityStructuredOutputLive({
    repositoryRoot,
    planPath: PLAN_PATH,
    sourceCodexHome: path.join(repositoryRoot, ".test-source-home"),
    runParent: tmpdir(),
    operations: config.operations,
  }), /source config changed during publication/iu);
  assert.equal(config.calls.evidence.length, 1);

  const cleanup = liveOperations();
  const createRuntime = cleanup.operations.createRuntime;
  const publishCleanup = cleanup.operations.publishSingleArtifact;
  let cleanupState;
  cleanup.operations.createRuntime = async (options) => {
    cleanupState = options.cleanupState;
    return createRuntime(options);
  };
  cleanup.operations.publishSingleArtifact = async (value) => {
    const receipt = await publishCleanup(value);
    cleanupState.receipt.remainingOwnedProcessCount = 1;
    return receipt;
  };
  await assert.rejects(() => api.runJoenessM4AuthorityStructuredOutputLive({
    repositoryRoot,
    planPath: PLAN_PATH,
    sourceCodexHome: path.join(repositoryRoot, ".test-source-home"),
    runParent: tmpdir(),
    operations: cleanup.operations,
  }), /cleanup evidence is not safe|cleanup state changed during publication/iu);
  assert.equal(cleanup.calls.evidence.length, 1);
});

test("postpublication verifier cannot mutate config during its final awaited readback", async (t) => {
  const api = await subject();
  const repositoryRoot = await cleanEvaluatorRoot(t);
  const fixture = liveOperations();
  const verify = fixture.operations.verifyExecutionBoundary;
  let mutated = false;
  fixture.operations.snapshotSourceConfig = async () => mutated
    ? { bytes: 18, sha256: digest("verifier-mutated-config") }
    : { bytes: 17, sha256: digest("source-config") };
  fixture.operations.verifyExecutionBoundary = async (options) => {
    const receipt = await verify(options);
    if (options.publishedPath !== undefined) mutated = true;
    return receipt;
  };
  await assert.rejects(() => api.runJoenessM4AuthorityStructuredOutputLive({
    repositoryRoot,
    planPath: PLAN_PATH,
    sourceCodexHome: path.join(repositoryRoot, ".test-source-home"),
    runParent: tmpdir(),
    operations: fixture.operations,
  }), /source config changed during publication/iu);
  assert.equal(fixture.calls.evidence.length, 1);
});

test("publisher-time same-byte source-home and repository-root replacement is rejected by ownership identity", async (t) => {
  const api = await subject();
  const sourceRoot = await cleanEvaluatorRoot(t);
  const sourceHome = path.join(sourceRoot, ".test-source-home");
  const replacedHome = path.join(sourceRoot, ".test-source-home-owned");
  const configText = await readFile(path.join(sourceHome, "config.toml"), "utf8");
  const sourceFixture = liveOperations();
  const publishSource = sourceFixture.operations.publishSingleArtifact;
  sourceFixture.operations.publishSingleArtifact = async (value) => {
    const receipt = await publishSource(value);
    await rename(sourceHome, replacedHome);
    await mkdir(sourceHome);
    await writeFile(path.join(sourceHome, "config.toml"), configText, "utf8");
    return receipt;
  };
  await assert.rejects(() => api.runJoenessM4AuthorityStructuredOutputLive({
    repositoryRoot: sourceRoot,
    planPath: PLAN_PATH,
    sourceCodexHome: sourceHome,
    runParent: tmpdir(),
    operations: sourceFixture.operations,
  }), /source home ownership identity changed/iu);
  assert.equal(sourceFixture.calls.evidence.length, 1);

  const repositoryRoot = await cleanEvaluatorRoot(t);
  const replacedRoot = `${repositoryRoot}-owned`;
  t.after(async () => rm(replacedRoot, { recursive: true, force: true }));
  const rootFixture = liveOperations();
  const publishRoot = rootFixture.operations.publishSingleArtifact;
  rootFixture.operations.publishSingleArtifact = async (value) => {
    const receipt = await publishRoot(value);
    await rename(repositoryRoot, replacedRoot);
    await mkdir(repositoryRoot);
    return receipt;
  };
  await assert.rejects(() => api.runJoenessM4AuthorityStructuredOutputLive({
    repositoryRoot,
    planPath: PLAN_PATH,
    sourceCodexHome: path.join(repositoryRoot, ".test-source-home"),
    runParent: tmpdir(),
    operations: rootFixture.operations,
  }), /repository root ownership identity changed/iu);
  assert.equal(rootFixture.calls.evidence.length, 1);
});

test("partial-factory blocked publication cannot replace source home with same config bytes", async (t) => {
  const api = await subject();
  const repositoryRoot = await cleanEvaluatorRoot(t);
  const sourceHome = path.join(repositoryRoot, ".test-source-home");
  const replacedHome = path.join(repositoryRoot, ".test-source-home-partial-owned");
  const configText = await readFile(path.join(sourceHome, "config.toml"), "utf8");
  const fixture = liveOperations();
  fixture.operations.createRuntime = async ({ cleanupState }) => {
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
    throw new Error("partial factory replacement");
  };
  const publish = fixture.operations.publishSingleArtifact;
  fixture.operations.publishSingleArtifact = async (value) => {
    const receipt = await publish(value);
    await rename(sourceHome, replacedHome);
    await mkdir(sourceHome);
    await writeFile(path.join(sourceHome, "config.toml"), configText, "utf8");
    return receipt;
  };
  await assert.rejects(() => api.runJoenessM4AuthorityStructuredOutputLive({
    repositoryRoot,
    planPath: PLAN_PATH,
    sourceCodexHome: sourceHome,
    runParent: tmpdir(),
    operations: fixture.operations,
  }), /source home ownership identity changed/iu);
  assert.equal(fixture.calls.blocked.length, 1);
});

test("Task-A preflight cannot replace source home or config before runtime creation", async (t) => {
  const api = await subject();
  for (const mutation of ["source-home", "config"]) {
    const repositoryRoot = await cleanEvaluatorRoot(t);
    const sourceHome = path.join(repositoryRoot, ".test-source-home");
    const replacedHome = path.join(repositoryRoot, `.test-source-home-${mutation}-owned`);
    const configText = await readFile(path.join(sourceHome, "config.toml"), "utf8");
    const fixture = liveOperations();
    const runnerGitStatus = fixture.operations.runnerGitStatus;
    let mutated = false;
    fixture.operations.runnerGitStatus = async () => {
      if (!mutated) {
        mutated = true;
        if (mutation === "source-home") {
          await rename(sourceHome, replacedHome);
          await mkdir(sourceHome);
          await writeFile(path.join(sourceHome, "config.toml"), configText, "utf8");
        }
      }
      return runnerGitStatus();
    };
    if (mutation === "config") {
      fixture.operations.snapshotSourceConfig = async () => mutated
        ? { bytes: 18, sha256: digest("pre-runtime-config-drift") }
        : { bytes: 17, sha256: digest("source-config") };
    }
    await assert.rejects(() => api.runJoenessM4AuthorityStructuredOutputLive({
      repositoryRoot,
      planPath: PLAN_PATH,
      sourceCodexHome: sourceHome,
      runParent: tmpdir(),
      operations: fixture.operations,
    }), /source home ownership identity changed|source config changed/iu);
    assert.equal(fixture.calls.createRuntime, 0, mutation);
    assert.equal(fixture.calls.evidence.length, 0, mutation);
    assert.equal(fixture.calls.blocked.length, 0, mutation);
  }
});

test("runtime acquired before an ownership change is closed once and never reaches the turn", async (t) => {
  const api = await subject();
  const repositoryRoot = await cleanEvaluatorRoot(t);
  const sourceHome = path.join(repositoryRoot, ".test-source-home");
  const replacedHome = path.join(repositoryRoot, ".test-source-home-factory-owned");
  const configText = await readFile(path.join(sourceHome, "config.toml"), "utf8");
  let turnRequestCount = 0;
  const fixture = liveOperations({
    session: freshSession({ onRequest() { turnRequestCount += 1; } }),
  });
  const createRuntime = fixture.operations.createRuntime;
  let finishCount = 0;
  fixture.operations.createRuntime = async (options) => {
    const runtime = await createRuntime(options);
    await rename(sourceHome, replacedHome);
    await mkdir(sourceHome);
    await writeFile(path.join(sourceHome, "config.toml"), configText, "utf8");
    return {
      ...runtime,
      async finish(force) {
        finishCount += 1;
        return runtime.finish(force);
      },
    };
  };
  await assert.rejects(() => api.runJoenessM4AuthorityStructuredOutputLive({
    repositoryRoot,
    planPath: PLAN_PATH,
    sourceCodexHome: sourceHome,
    runParent: tmpdir(),
    operations: fixture.operations,
  }), /source home ownership identity changed/iu);
  assert.equal(fixture.calls.createRuntime, 1);
  assert.equal(finishCount, 1);
  assert.equal(turnRequestCount, 0);
  assert.equal(fixture.calls.evidence.length, 0);
  assert.equal(fixture.calls.blocked.length, 0);
});

test("runtime factory is exactly once and caller-owned boundary mutation cannot move durable scope", async (t) => {
  const api = await subject();
  const repositoryRoot = await cleanEvaluatorRoot(t);
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
    options.plan.resultBoundary.m4FixtureBehavior = "FORGED";
    options.plan.outputs.blocked = "forged.json";
    options.plan.source.authorityStructuredOutputRunner.sha256 = "f".repeat(64);
    fixture.calls.lastBoundary.executionSource.executionHead = "c".repeat(40);
    fixture.calls.lastBoundary.executionSource.plan.sha256 = "d".repeat(64);
    return runtime;
  };
  await assert.rejects(() => api.runJoenessM4AuthorityStructuredOutputLive({
    repositoryRoot,
    planPath: PLAN_PATH,
    sourceCodexHome: path.join(repositoryRoot, ".test-source-home"),
    runParent: tmpdir(),
    operations: fixture.operations,
  }), /one factory only/u);
  assert.equal(fixture.calls.createRuntime, 1);
  assert.equal(fixture.calls.blocked.length, 1);
  assert.equal(fixture.calls.blocked[0].relativePath, OUTPUTS.blocked);
  assert.equal(fixture.calls.blocked[0].value.resultBoundary.m4FixtureBehavior, "UNVALIDATED");
  assert.equal(fixture.calls.blocked[0].value.executionSource.executionHead, "b".repeat(40));
  assert.equal(observedSourcePin.repositoryCommit, "b".repeat(40));
  assert.equal(
    observedSourcePin.authorityStructuredOutputRunner.sha256,
    plan().source.authorityStructuredOutputRunner.sha256,
  );
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
  await assert.rejects(() => api.runJoenessM4AuthorityStructuredOutputLive({
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
  await assert.rejects(() => api.runJoenessM4AuthorityStructuredOutputLive({
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
  assert.deepEqual(await api.executeJoenessM4AuthorityStructuredOutputLiveCli({
    argv: [],
    repositoryRoot: ROOT,
    sourceCodexHome: path.join(ROOT, ".test-source-home"),
    runParent: tmpdir(),
    operations,
  }), { mode: "preflight", planPath: PLAN_PATH });
  assert.deepEqual(await api.executeJoenessM4AuthorityStructuredOutputLiveCli({
    argv: ["--mode", "live", "--plan", PLAN_PATH],
    repositoryRoot: ROOT,
    sourceCodexHome: path.join(ROOT, ".test-source-home"),
    runParent: tmpdir(),
    operations,
  }), { mode: "live", planPath: PLAN_PATH });
  assert.deepEqual(calls, { preflight: 1, live: 1 });
});

test("actual CLI entrypoint performs default preflight and keeps v7 outputs absent", async (t) => {
  const fixture = await executionFixture(t);
  const sourceCodexHome = path.join(path.dirname(fixture.root), "source-home");
  await mkdir(sourceCodexHome);
  await writeFile(path.join(sourceCodexHome, "config.toml"), "model = \"fixture\"\n", "utf8");
  const modulePath = path.join(
    fixture.root,
    "evals/support/run-joeness-m4-authority-structured-output-live.mjs",
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

test("CLI failure emits only the fixed v7 wrapper marker and performs no retry", async () => {
  await assert.rejects(
    execFile(process.execPath, [MODULE_PATH, "--mode", "invalid"], {
      cwd: ROOT,
      encoding: "utf8",
      windowsHide: true,
    }),
    (error) => {
      assert.equal(error.code, 1);
      assert.equal(error.stdout, "");
      assert.equal(error.stderr, "m4-authority-structured-output-live-wrapper-failed\n");
      return true;
    },
  );
});
