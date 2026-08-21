import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import test from "node:test";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(import.meta.dirname, "..");
const MODULE_PATH = path.join(
  ROOT,
  "evals/support/run-joeness-m4-pinned-load-control-eval.mjs",
);
const FIXTURE_LOADER_PATH = path.join(
  ROOT,
  "evals/support/run-joeness-m4-superpowers-eval.mjs",
);
const FRESH_ADAPTER_PATH = path.join(
  ROOT,
  "evals/support/run-fresh-evaluator-turn.mjs",
);
const TRANSPORT_SUPPORT_PATH = path.join(
  ROOT,
  "evals/support/run-joeness-m4-transport-control-eval.mjs",
);
const RUNNER_RELATIVE_PATH =
  "evals/support/run-joeness-m4-pinned-load-control-eval.mjs";
const FIXTURE_LOADER_RELATIVE_PATH =
  "evals/support/run-joeness-m4-superpowers-eval.mjs";
const FRESH_ADAPTER_RELATIVE_PATH =
  "evals/support/run-fresh-evaluator-turn.mjs";
const TRANSPORT_SUPPORT_RELATIVE_PATH =
  "evals/support/run-joeness-m4-transport-control-eval.mjs";

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function subject() {
  return import(`${pathToFileURL(MODULE_PATH).href}?t=${Date.now()}-${Math.random()}`);
}

test("exports a pinned-load control whose only semantic output is the tiny transport object", async () => {
  const api = await subject();
  assert.equal(
    api.JOENESS_M4_PINNED_LOAD_CONTROL_ID,
    "joeness-m4-pinned-load-control-v1",
  );
  assert.deepEqual(api.joenessM4PinnedLoadControlOutputSchema(), {
    type: "object",
    properties: {
      schemaVersion: { type: "integer", enum: [1] },
      transport: { type: "string", enum: ["ok"] },
    },
    required: ["schemaVersion", "transport"],
    additionalProperties: false,
  });
  assert.deepEqual(
    api.validateJoenessM4PinnedLoadControlOutput({ schemaVersion: 1, transport: "ok" }),
    { schemaVersion: 1, transport: "ok" },
  );
  for (const invalid of [
    { schemaVersion: 1, transport: "ok", decision: "PROCEED" },
    { schemaVersion: 1, transport: "wrong" },
    {
      schemaVersion: 1,
      sourceIds: ["evaluator-instruction"],
      decision: "PROCEED_WITH_AUTHORIZED_SUBSET",
    },
  ]) {
    assert.throws(
      () => api.validateJoenessM4PinnedLoadControlOutput(invalid),
      /output|contract|exact|invalid/iu,
    );
  }
});

async function sourcePin(root = ROOT) {
  const [runner, fixtureLoader, freshTurnAdapter, transportControlSupport] = await Promise.all([
    readFile(path.join(root, ...RUNNER_RELATIVE_PATH.split("/"))),
    readFile(path.join(root, ...FIXTURE_LOADER_RELATIVE_PATH.split("/"))),
    readFile(path.join(root, ...FRESH_ADAPTER_RELATIVE_PATH.split("/"))),
    readFile(path.join(root, ...TRANSPORT_SUPPORT_RELATIVE_PATH.split("/"))),
  ]);
  return {
    repositoryCommit: "a".repeat(40),
    runner: {
      path: RUNNER_RELATIVE_PATH,
      bytes: runner.length,
      sha256: digest(runner),
    },
    fixtureLoader: {
      path: FIXTURE_LOADER_RELATIVE_PATH,
      bytes: fixtureLoader.length,
      sha256: digest(fixtureLoader),
    },
    freshTurnAdapter: {
      path: FRESH_ADAPTER_RELATIVE_PATH,
      bytes: freshTurnAdapter.length,
      sha256: digest(freshTurnAdapter),
    },
    transportControlSupport: {
      path: TRANSPORT_SUPPORT_RELATIVE_PATH,
      bytes: transportControlSupport.length,
      sha256: digest(transportControlSupport),
    },
  };
}

async function pinnedRepositoryCopy(t) {
  const root = await mkdtemp(path.join(tmpdir(), "joeness-m4-pinned-load-repo-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const fixtureRoot = "evals/skill-contracts/fixtures/joeness-m4-superpowers-v1";
  const relativePaths = [
    RUNNER_RELATIVE_PATH,
    FIXTURE_LOADER_RELATIVE_PATH,
    FRESH_ADAPTER_RELATIVE_PATH,
    TRANSPORT_SUPPORT_RELATIVE_PATH,
    "evals/support/collect-codex-app-server.mjs",
    `${fixtureRoot}/manifest-v2.json`,
    `${fixtureRoot}/evaluator-instruction.md`,
    `${fixtureRoot}/project/TASK.md`,
    `${fixtureRoot}/superpowers-6.2.0/using-superpowers/SKILL.md`,
    `${fixtureRoot}/superpowers-6.2.0/brainstorming/SKILL.md`,
  ];
  for (const relativePath of relativePaths) {
    const target = path.join(root, ...relativePath.split("/"));
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(path.join(ROOT, ...relativePath.split("/")), target);
  }
  await mkdir(path.join(root, "evals", "experiments"), { recursive: true });
  return root;
}

function executionPlan({
  blocked = null,
  raw = "evals/experiments/pinned-load-control-raw.json",
  evidence = "evals/experiments/pinned-load-control-evidence.json",
} = {}) {
  return {
    schemaVersion: 1,
    id: "joeness-m4-pinned-load-control-v1",
    outputs: {
      raw,
      evidence,
      blocked,
    },
  };
}

function freshSession({
  threadStartError = null,
  agentText = '{"schemaVersion":1,"transport":"ok"}',
} = {}) {
  const listeners = new Set();
  const requests = [];
  let closed = false;
  let processExitCode = null;
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
        requests.push({ method, params });
        if (method === "thread/start") {
          if (threadStartError !== null) throw threadStartError;
          emit({ method: "thread/started", params: { thread: { id: "PRIVATE-THREAD-ID" } } });
          return {
            thread: {
              id: "PRIVATE-THREAD-ID",
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
            params: { threadId: params.threadId, turn: { id: "PRIVATE-TURN-ID" } },
          });
          emit({
            method: "item/completed",
            params: {
              threadId: params.threadId,
              turnId: "PRIVATE-TURN-ID",
              item: {
                id: "PRIVATE-MESSAGE-ID",
                type: "agentMessage",
                text: agentText,
              },
            },
          });
          emit({
            method: "turn/completed",
            params: {
              threadId: params.threadId,
              turn: { id: "PRIVATE-TURN-ID", status: "completed" },
            },
          });
          return { turn: { id: "PRIVATE-TURN-ID", status: "inProgress" } };
        }
        if (method === "mcpServerStatus/list") return { data: [], nextCursor: null };
        if (method === "turn/interrupt") return {};
        throw new Error(`unexpected request: ${method}`);
      },
    },
    requests,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async close() {
      closed = true;
      processExitCode = 0;
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

async function liveOptions({ runTurn, session = freshSession(), blocked = null } = {}) {
  const pin = await sourcePin();
  const calls = { finish: 0, publish: 0, writes: [], runTurn: 0 };
  const config = { bytes: 6, sha256: digest("config") };
  return {
    calls,
    options: {
      repositoryRoot: ROOT,
      executionPlan: executionPlan({ blocked }),
      sourcePin: pin,
      async gitStatus() { return ""; },
      async gitIdentity() { return pin.repositoryCommit; },
      async gitReadBlob(_root, _commit, relativePath) {
        return readFile(path.join(ROOT, ...relativePath.split("/")));
      },
      async artifactExists() { return false; },
      async runtimeFactory() {
        return {
          session,
          sourceConfigBefore: { ...config },
          async readSourceConfig() { return { ...config }; },
          async finish(safe) {
            calls.finish += 1;
            assert.equal(safe, true);
            await session.close();
          },
        };
      },
      ...(runTurn === undefined ? {} : {
        async runTurn(request) {
          calls.runTurn += 1;
          return runTurn(request);
        },
      }),
      async successPublisher(value) {
        calls.publish += 1;
        calls.publication = value;
        return { completePair: true };
      },
      async writeArtifact(relativePath, value) {
        calls.writes.push({ relativePath, value });
      },
    },
  };
}

test("run sends exactly the four manifest-v2 text descriptors in pinned order with only the tiny response schema", async () => {
  const api = await subject();
  const session = freshSession();
  const fixture = await liveOptions({ session });
  await api.runJoenessM4PinnedLoadControlEval(fixture.options);
  assert.equal(fixture.calls.finish, 1);
  const threadStart = session.requests.find(({ method }) => method === "thread/start")?.params;
  const request = session.requests.find(({ method }) => method === "turn/start")?.params;
  assert.ok(threadStart);
  assert.ok(request);
  assert.deepEqual(threadStart.dynamicTools, []);
  assert.deepEqual(request.outputSchema, {
    type: "object",
    properties: {
      schemaVersion: { type: "integer", enum: [1] },
      transport: { type: "string", enum: ["ok"] },
    },
    required: ["schemaVersion", "transport"],
    additionalProperties: false,
  });
  assert.equal(request.input.length, 4);
  assert.deepEqual(
    request.input.map(({ type, text }) => ({
      type,
      bytes: Buffer.byteLength(text),
      sha256: digest(text),
    })),
    [
      { type: "text", bytes: 1538, sha256: "4918dc6eede5dff6b44394a8c249d3622eac3f02bbe1804d6f18a937b05119b1" },
      { type: "text", bytes: 2171, sha256: "f193b03f5a3d410ab50484640dced02dafe54efa254f76fd15459fb53b6ffee3" },
      { type: "text", bytes: 3063, sha256: "55379fe7c1c473a02c61961c822996bff30e1320d6921d9062509bc508482c05" },
      { type: "text", bytes: 10047, sha256: "4a54a4858b99807f3155ed1614b2f116e35ea5c1b788e793f565dd837fd3891f" },
    ],
  );
});

test("runner source provenance pins the exact imported fresh-turn adapter", async () => {
  const api = await subject();
  const pin = await sourcePin();
  const withoutAdapter = structuredClone(pin);
  delete withoutAdapter.freshTurnAdapter;
  await assert.rejects(
    () => api.runJoenessM4PinnedLoadControlEval({
      repositoryRoot: ROOT,
      executionPlan: executionPlan(),
      sourcePin: withoutAdapter,
    }),
    /fresh.*adapter|source pin|keys/iu,
  );
  const wrongAdapter = structuredClone(pin);
  wrongAdapter.freshTurnAdapter.sha256 = "f".repeat(64);
  let runtimeFactoryCalls = 0;
  await assert.rejects(
    () => api.runJoenessM4PinnedLoadControlEval({
      repositoryRoot: ROOT,
      executionPlan: executionPlan(),
      sourcePin: wrongAdapter,
      async gitStatus() { return ""; },
      async gitIdentity() { return pin.repositoryCommit; },
      async gitReadBlob(_root, _commit, relativePath) {
        return readFile(path.join(ROOT, ...relativePath.split("/")));
      },
      async artifactExists() { return false; },
      async runtimeFactory() { runtimeFactoryCalls += 1; },
      async successPublisher() {},
    }),
    /fresh.*adapter|pin drift/iu,
  );
  assert.equal(runtimeFactoryCalls, 0);

  const wrongSupport = structuredClone(pin);
  wrongSupport.transportControlSupport.sha256 = "e".repeat(64);
  await assert.rejects(
    () => api.runJoenessM4PinnedLoadControlEval({
      repositoryRoot: ROOT,
      executionPlan: executionPlan(),
      sourcePin: wrongSupport,
      async gitStatus() { return ""; },
      async gitIdentity() { return pin.repositoryCommit; },
      async gitReadBlob(_root, _commit, relativePath) {
        return readFile(path.join(ROOT, ...relativePath.split("/")));
      },
      async artifactExists() { return false; },
      async runtimeFactory() { runtimeFactoryCalls += 1; },
      async successPublisher() {},
    }),
    /transport.*support|pin drift/iu,
  );
  assert.equal(runtimeFactoryCalls, 0);

  const withoutSupport = structuredClone(pin);
  delete withoutSupport.transportControlSupport;
  await assert.rejects(
    () => api.runJoenessM4PinnedLoadControlEval({
      repositoryRoot: ROOT,
      executionPlan: executionPlan(),
      sourcePin: withoutSupport,
    }),
    /transport.*support|source pin|keys/iu,
  );
});

test("a self-consistent changed manifest and input cannot replace the frozen v3 request", async (t) => {
  const api = await subject();
  const root = await mkdtemp(path.join(tmpdir(), "joeness-m4-pinned-load-mutated-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const fixtureRoot = "evals/skill-contracts/fixtures/joeness-m4-superpowers-v1";
  const relativePaths = [
    RUNNER_RELATIVE_PATH,
    FIXTURE_LOADER_RELATIVE_PATH,
    FRESH_ADAPTER_RELATIVE_PATH,
    TRANSPORT_SUPPORT_RELATIVE_PATH,
    "evals/support/collect-codex-app-server.mjs",
    `${fixtureRoot}/manifest-v2.json`,
    `${fixtureRoot}/evaluator-instruction.md`,
    `${fixtureRoot}/project/TASK.md`,
    `${fixtureRoot}/superpowers-6.2.0/using-superpowers/SKILL.md`,
    `${fixtureRoot}/superpowers-6.2.0/brainstorming/SKILL.md`,
  ];
  for (const relativePath of relativePaths) {
    const target = path.join(root, ...relativePath.split("/"));
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(path.join(ROOT, ...relativePath.split("/")), target);
  }
  await mkdir(path.join(root, "evals", "experiments"), { recursive: true });
  const inputPath = path.join(root, ...`${fixtureRoot}/evaluator-instruction.md`.split("/"));
  const changedInput = Buffer.concat([await readFile(inputPath), Buffer.from("\nchanged-control\n")]);
  await writeFile(inputPath, changedInput);
  const manifestPath = path.join(root, ...`${fixtureRoot}/manifest-v2.json`.split("/"));
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  manifest.inputs[0].bytes = changedInput.length;
  manifest.inputs[0].sha256 = digest(changedInput);
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  const pin = await sourcePin(root);
  let runtimeFactoryCalls = 0;
  await assert.rejects(
    () => api.runJoenessM4PinnedLoadControlEval({
      repositoryRoot: root,
      executionPlan: executionPlan(),
      sourcePin: pin,
      async gitStatus() { return ""; },
      async gitIdentity() { return pin.repositoryCommit; },
      async gitReadBlob(_root, _commit, relativePath) {
        return readFile(path.join(root, ...relativePath.split("/")));
      },
      async artifactExists() { return false; },
      async runtimeFactory() { runtimeFactoryCalls += 1; },
      async successPublisher() {},
    }),
    /frozen|manifest|request|pin drift/iu,
  );
  assert.equal(runtimeFactoryCalls, 0);
});

test("an injected turn implementation cannot mint a pinned-load PASS", async () => {
  const api = await subject();
  const fixture = await liveOptions({
    runTurn: async () => ({
      output: { schemaVersion: 1, transport: "ok" },
      outputText: {
        text: '{"schemaVersion":1,"transport":"ok"}',
        byteLength: 36,
        sha256: "b270bf58038d3d0c99216e11735eeadd9ef29d2dbfa3b14e99bfe8900c36a6ea",
      },
    }),
  });
  await assert.rejects(
    () => api.runJoenessM4PinnedLoadControlEval(fixture.options),
    /authentic|identity|provenance/iu,
  );
  assert.equal(fixture.calls.runTurn, 0);
  assert.equal(fixture.calls.publish, 0);
  assert.equal(fixture.calls.writes.length, 0);
});

test("the imported adapter can prove only pinned-content-load transport while every M4 verdict stays unassessed", async () => {
  const api = await subject();
  const fixture = await liveOptions();
  const result = await api.runJoenessM4PinnedLoadControlEval(fixture.options);
  assert.deepEqual(result, {
    status: "PASS",
    scope: "pinned-content-load-transport-only",
    m4Behavior: "NOT-ASSESSED",
    joenessPolicy: "UNVERIFIED",
    superpowersCompatibility: "UNVERIFIED",
    promotionPass: false,
  });
  assert.equal(fixture.calls.finish, 1);
  assert.equal(fixture.calls.publish, 1);
  assert.equal(fixture.calls.writes.length, 0);
  const publication = fixture.calls.publication;
  assert.equal(publication.rawText, '{"schemaVersion":1,"transport":"ok"}');
  assert.deepEqual(publication.evidence.assessment, result);
  assert.deepEqual(publication.evidence.input, {
    manifest: {
      id: "joeness-m4-superpowers-v2",
      byteLength: 1738,
      sha256: "3708a7c3ea677926cd4f85093e83788ff6250aa0b7fd012529ff88a45ddc77f0",
    },
    descriptorCount: 4,
    descriptors: [
      { id: "evaluator-instruction", index: 0, type: "text", byteLength: 1538, sha256: "4918dc6eede5dff6b44394a8c249d3622eac3f02bbe1804d6f18a937b05119b1" },
      { id: "project-task", index: 1, type: "text", byteLength: 2171, sha256: "f193b03f5a3d410ab50484640dced02dafe54efa254f76fd15459fb53b6ffee3" },
      { id: "superpowers-using", index: 2, type: "text", byteLength: 3063, sha256: "55379fe7c1c473a02c61961c822996bff30e1320d6921d9062509bc508482c05" },
      { id: "superpowers-brainstorming", index: 3, type: "text", byteLength: 10047, sha256: "4a54a4858b99807f3155ed1614b2f116e35ea5c1b788e793f565dd837fd3891f" },
    ],
    canonicalRequest: {
      byteLength: 17295,
      sha256: "edb9ffd151a5ecb405002d487fe28c1e10285d63676aee849bd991158fd89f5a",
    },
    descriptorRequestSha256: "f79255f5ca0daab780a99c2b05e8cb2da1e9060ad4a14c24e71a3ab8fbd8f40d",
  });
  assert.deepEqual(publication.evidence.output, {
    schemaVersion: 1,
    transport: "ok",
    byteLength: 36,
    sha256: "b270bf58038d3d0c99216e11735eeadd9ef29d2dbfa3b14e99bfe8900c36a6ea",
    schemaSha256: "874e782d9de6862f9718199125fcebfcf47f7990da06dce54d2d32f8c12db423",
  });
  assert.deepEqual(publication.evidence.runtime, {
    freshTurnCount: 1,
    retryCount: 0,
    dynamicToolCount: 0,
    projectDocs: "DISABLED",
    installedPluginActivation: "UNVERIFIED",
  });
  assert.equal(publication.evidence.sourceConfigReadback, "UNCHANGED");
  assert.equal(publication.evidence.runtimeCleanup, "SAFE");
  assert.deepEqual(publication.evidence.privacy, {
    pinnedInputContentsPersisted: false,
    rawEventsPersisted: false,
    processIdentifiersPersisted: false,
    absolutePathsPersisted: false,
    rawStderrPersisted: false,
    configContentsPersisted: false,
  });
  const serialized = JSON.stringify(publication.evidence);
  for (const canary of [
    "PRIVATE-THREAD-ID",
    "PRIVATE-TURN-ID",
    "PRIVATE-MESSAGE-ID",
    ROOT,
    "You are evaluating whether",
  ]) {
    assert.equal(serialized.includes(canary), false, canary);
  }
});

test("configuration readback is still attempted when runtime finish fails", async () => {
  const api = await subject();
  const pin = await sourcePin();
  const calls = { finish: 0, configReads: 0, publish: 0 };
  const config = { bytes: 6, sha256: digest("config") };
  await assert.rejects(
    () => api.runJoenessM4PinnedLoadControlEval({
      repositoryRoot: ROOT,
      executionPlan: executionPlan(),
      sourcePin: pin,
      async gitStatus() { return ""; },
      async gitIdentity() { return pin.repositoryCommit; },
      async gitReadBlob(_root, _commit, relativePath) {
        return readFile(path.join(ROOT, ...relativePath.split("/")));
      },
      async artifactExists() { return false; },
      async runtimeFactory() {
        return {
          session: freshSession(),
          sourceConfigBefore: { ...config },
          async finish() {
            calls.finish += 1;
            throw new Error("finish failed");
          },
          async readSourceConfig() {
            calls.configReads += 1;
            return { ...config };
          },
        };
      },
      async successPublisher() { calls.publish += 1; },
    }),
    /finish failed|cleanup/iu,
  );
  assert.equal(calls.finish, 1);
  assert.equal(calls.configReads, 1);
  assert.equal(calls.publish, 0);
});

test("an authentic adapter rejection retains only bounded fixed-enum failure evidence", async () => {
  const api = await subject();
  const fixture = await liveOptions({
    blocked: "evals/experiments/pinned-load-control-blocked.json",
    session: freshSession({
      threadStartError: new Error("PRIVATE-RUNTIME-ERROR-CANARY"),
    }),
  });
  await assert.rejects(
    () => api.runJoenessM4PinnedLoadControlEval(fixture.options),
    /fresh evaluator turn validation failed/iu,
  );
  assert.equal(fixture.calls.publish, 0);
  assert.equal(fixture.calls.writes.length, 1);
  const [{ relativePath, value }] = fixture.calls.writes;
  assert.equal(relativePath, "evals/experiments/pinned-load-control-blocked.json");
  assert.deepEqual({
    schemaVersion: value.schemaVersion,
    status: value.status,
    phase: value.phase,
    safeCleanup: value.safeCleanup,
  }, {
    schemaVersion: 1,
    status: "blocked",
    phase: "post-runtime-validation",
    safeCleanup: true,
  });
  assert.equal(value.freshFailure.schemaVersion, 4);
  assert.equal(
    value.freshFailure.provenance,
    "pinned-load-control-runner-observed-default-fresh-adapter-rejection",
  );
  assert.equal(value.freshFailure.runnerStage, "fresh-turn-rejected");
  assert.deepEqual(value.freshFailure.pinnedRequest, {
    descriptorCount: 4,
    byteLength: 17295,
    sha256: "edb9ffd151a5ecb405002d487fe28c1e10285d63676aee849bd991158fd89f5a",
  });
  assert.equal(
    value.freshFailure.runtimeErrorOrigin.provenance,
    "runner-projected-default-adapter-retained-events-fixed-enum",
  );
  assert.equal(value.freshFailure.runtimeErrorOrigin.classification, "none");
  assert.equal(JSON.stringify(value).includes("PRIVATE-RUNTIME-ERROR-CANARY"), false);
});

test("output parents must already be confined regular directories before runtime starts", async () => {
  const api = await subject();
  const pin = await sourcePin();
  let runtimeFactoryCalls = 0;
  await assert.rejects(
    () => api.runJoenessM4PinnedLoadControlEval({
      repositoryRoot: ROOT,
      executionPlan: executionPlan({
        raw: "missing-pinned-load-parent/raw.json",
        evidence: "missing-pinned-load-parent/evidence.json",
      }),
      sourcePin: pin,
      async gitStatus() { return ""; },
      async gitIdentity() { return pin.repositoryCommit; },
      async gitReadBlob(_root, _commit, relativePath) {
        return readFile(path.join(ROOT, ...relativePath.split("/")));
      },
      async artifactExists() { return false; },
      async runtimeFactory() { runtimeFactoryCalls += 1; },
      async successPublisher() {},
    }),
    /output parent|confined|ENOENT/iu,
  );
  assert.equal(runtimeFactoryCalls, 0);
});

test("a partial runtime-factory failure cannot claim safe cleanup or publish blocked evidence", async () => {
  const api = await subject();
  const pin = await sourcePin();
  let blockedWrites = 0;
  await assert.rejects(
    () => api.runJoenessM4PinnedLoadControlEval({
      repositoryRoot: ROOT,
      executionPlan: executionPlan({
        blocked: "evals/experiments/pinned-load-control-blocked.json",
      }),
      sourcePin: pin,
      async gitStatus() { return ""; },
      async gitIdentity() { return pin.repositoryCommit; },
      async gitReadBlob(_root, _commit, relativePath) {
        return readFile(path.join(ROOT, ...relativePath.split("/")));
      },
      async artifactExists() { return false; },
      async runtimeFactory() {
        throw new Error("partial runtime factory failure");
      },
      async successPublisher() {},
      async writeArtifact() { blockedWrites += 1; },
    }),
    /partial runtime factory failure/iu,
  );
  assert.equal(blockedWrites, 0);
});

test("a duplicate-key or noncanonical raw response cannot carry hidden text into the raw artifact", async () => {
  const api = await subject();
  const fixture = await liveOptions({
    session: freshSession({
      agentText: '{"transport":"PRIVATE-RAW-CANARY","schemaVersion":1,"transport":"ok"}',
    }),
  });
  await assert.rejects(
    () => api.runJoenessM4PinnedLoadControlEval(fixture.options),
    /raw output|canonical|tuple/iu,
  );
  assert.equal(fixture.calls.publish, 0);
  assert.equal(fixture.calls.writes.length, 0);
});

test("source pins bind both the committed blob and the working file before runtime", async (t) => {
  const api = await subject();
  const root = await pinnedRepositoryCopy(t);
  const pin = await sourcePin(root);
  const supportPath = path.join(root, ...TRANSPORT_SUPPORT_RELATIVE_PATH.split("/"));
  const committedSupport = await readFile(supportPath);
  await writeFile(supportPath, Buffer.concat([committedSupport, Buffer.from("\nworking drift\n")]));
  let runtimeFactoryCalls = 0;
  await assert.rejects(
    () => api.runJoenessM4PinnedLoadControlEval({
      repositoryRoot: root,
      executionPlan: executionPlan(),
      sourcePin: pin,
      async gitStatus() { return ""; },
      async gitIdentity() { return pin.repositoryCommit; },
      async gitReadBlob(_root, _commit, relativePath) {
        if (relativePath === TRANSPORT_SUPPORT_RELATIVE_PATH) return committedSupport;
        return readFile(path.join(root, ...relativePath.split("/")));
      },
      async artifactExists() { return false; },
      async runtimeFactory() { runtimeFactoryCalls += 1; },
      async successPublisher() {},
    }),
    /working|source pin drift/iu,
  );
  assert.equal(runtimeFactoryCalls, 0);
});

test("success and blocked publication both stop on final worktree mutation", async () => {
  const api = await subject();
  const success = await liveOptions();
  let successStatusReads = 0;
  success.options.gitStatus = async () => {
    successStatusReads += 1;
    return successStatusReads === 1 ? "" : " M changed-after-turn";
  };
  await assert.rejects(
    () => api.runJoenessM4PinnedLoadControlEval(success.options),
    /worktree is dirty/iu,
  );
  assert.equal(success.calls.publish, 0);

  const blocked = await liveOptions({
    blocked: "evals/experiments/pinned-load-control-blocked.json",
    session: freshSession({ threadStartError: new Error("PRIVATE-FINAL-BOUNDARY") }),
  });
  let blockedStatusReads = 0;
  blocked.options.gitStatus = async () => {
    blockedStatusReads += 1;
    return blockedStatusReads === 1 ? "" : " M changed-after-failure";
  };
  await assert.rejects(
    () => api.runJoenessM4PinnedLoadControlEval(blocked.options),
    /worktree is dirty/iu,
  );
  assert.equal(blocked.calls.writes.length, 0);
});

test("hostile success and failure evidence is rejected without invoking accessors or proxy traps", async () => {
  const api = await subject();
  let traps = 0;
  const hostileResult = new Proxy({}, {
    get() { traps += 1; throw new Error("PRIVATE-PROXY-CANARY"); },
    ownKeys() { traps += 1; throw new Error("PRIVATE-PROXY-CANARY"); },
    getOwnPropertyDescriptor() { traps += 1; throw new Error("PRIVATE-PROXY-CANARY"); },
  });
  assert.throws(
    () => api.retainJoenessM4PinnedLoadControlFreshEvidence(hostileResult),
    /unsafe|boundary/iu,
  );
  assert.equal(traps, 0);

  const hostileError = new Error("outer");
  Object.defineProperty(hostileError, "freshEvaluatorEvidence", {
    enumerable: true,
    get() { traps += 1; throw new Error("PRIVATE-ACCESSOR-CANARY"); },
  });
  assert.equal(api.projectJoenessM4PinnedLoadControlFreshFailure(hostileError), null);
  assert.equal(traps, 0);
});

test("a hostile runtime factory result is rejected without invoking accessors or publishing", async () => {
  const api = await subject();
  const pin = await sourcePin();
  let traps = 0;
  let publishes = 0;
  const runtime = {
    sourceConfigBefore: { bytes: 1, sha256: digest("x") },
    async finish() {},
    async readSourceConfig() { return { bytes: 1, sha256: digest("x") }; },
  };
  Object.defineProperty(runtime, "session", {
    enumerable: true,
    get() { traps += 1; throw new Error("PRIVATE-RUNTIME-ACCESSOR-CANARY"); },
  });
  await assert.rejects(
    () => api.runJoenessM4PinnedLoadControlEval({
      repositoryRoot: ROOT,
      executionPlan: executionPlan(),
      sourcePin: pin,
      async gitStatus() { return ""; },
      async gitIdentity() { return pin.repositoryCommit; },
      async gitReadBlob(_root, _commit, relativePath) {
        return readFile(path.join(ROOT, ...relativePath.split("/")));
      },
      async artifactExists() { return false; },
      async runtimeFactory() { return runtime; },
      async successPublisher() { publishes += 1; },
    }),
    /runtime factory result|unsafe/iu,
  );
  assert.equal(traps, 0);
  assert.equal(publishes, 0);
});

test("Windows drive-shaped and NUL output paths fail as non-portable before any boundary call", async () => {
  const api = await subject();
  const pin = await sourcePin();
  for (const raw of ["C:/private/raw.json", "evals/experiments/raw\0.json"]) {
    let boundaryCalls = 0;
    await assert.rejects(
      () => api.runJoenessM4PinnedLoadControlEval({
        repositoryRoot: ROOT,
        executionPlan: executionPlan({ raw }),
        sourcePin: pin,
        async gitStatus() { boundaryCalls += 1; return ""; },
      }),
      /portable relative path/iu,
    );
    assert.equal(boundaryCalls, 0);
  }
});

test("revoked and accessor-backed plans fail closed before invoking their traps", async () => {
  const api = await subject();
  const revoked = Proxy.revocable({}, {});
  revoked.revoke();
  await assert.rejects(
    () => api.runJoenessM4PinnedLoadControlEval({ executionPlan: revoked.proxy }),
    /execution plan.*exact object|unsafe/iu,
  );

  let traps = 0;
  const accessorPlan = {
    schemaVersion: 1,
    id: "joeness-m4-pinned-load-control-v1",
  };
  Object.defineProperty(accessorPlan, "outputs", {
    enumerable: true,
    get() { traps += 1; throw new Error("PRIVATE-PLAN-ACCESSOR-CANARY"); },
  });
  await assert.rejects(
    () => api.runJoenessM4PinnedLoadControlEval({ executionPlan: accessorPlan }),
    /execution plan.*outputs.*own data/iu,
  );
  assert.equal(traps, 0);
});
