import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { link, lstat, mkdtemp, mkdir, readFile, readdir, rm, symlink, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(import.meta.dirname, "..");
const MODULE_PATH = path.join(ROOT, "evals/support/run-joeness-m4-transport-control-eval.mjs");
const ID = "joeness-m4-transport-control-v1";
const INPUT_TEXT = 'Return exactly this JSON object: {"schemaVersion":1,"transport":"ok"}.';
const ORIGIN_PROVENANCE = "runner-projected-default-adapter-retained-events-fixed-enum";

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function subject() {
  return import(`${pathToFileURL(MODULE_PATH).href}?t=${Date.now()}-${Math.random()}`);
}

function exactOutput() {
  return { schemaVersion: 1, transport: "ok" };
}

function outputText(output = exactOutput()) {
  const text = JSON.stringify(output);
  return { text, byteLength: Buffer.byteLength(text), sha256: digest(text) };
}

function safeFreshResult(output = exactOutput()) {
  return {
    output,
    outputText: outputText(output),
    blockers: [],
    toolEvidence: [],
    threadStart: {
      request: {
        ephemeral: true,
        approvalPolicy: "never",
        permissions: "joewrks-eval-control-v3",
        projectDocMaxBytes: 0,
        selectedCapabilityRootCount: 0,
        dynamicToolCount: 0,
        runtimeWorkspaceRootCount: 1,
        environmentCount: 1,
      },
      response: {
        threadId: "private-thread-id",
        ephemeral: true,
        priorTurnCount: 0,
        instructionSourceCount: 0,
      },
    },
    turn: {
      id: "private-turn-id",
      request: { inputDescriptorCount: 1 },
    },
    eventCompaction: {
      observedEventCount: 3,
      retainedEventCount: 3,
      retainedEventLimit: 512,
      retainedEventsOverLimit: false,
      rawPayloadRetained: false,
    },
    appServer: {
      processExitCode: 0,
      stderr: { byteLength: 0, truncated: false, captureTruncated: false },
    },
  };
}

function executionPlan({ blocked = "evals/experiments/transport-control-blocked.json" } = {}) {
  return {
    schemaVersion: 1,
    id: ID,
    outputs: {
      raw: "evals/experiments/transport-control-raw.json",
      evidence: "evals/experiments/transport-control-evidence.json",
      blocked,
    },
  };
}

function sourcePin() {
  return {
    repositoryCommit: "a".repeat(40),
    runner: {
      path: "evals/support/run-joeness-m4-transport-control-eval.mjs",
      bytes: 3,
      sha256: digest("pin"),
    },
  };
}

function runtimeFixture({ configAfter, finishError } = {}) {
  const calls = { finish: 0, configReads: 0 };
  const config = { bytes: 9, sha256: digest("config") };
  return {
    calls,
    runtime: {
      session: { opaque: true },
      sourceConfigBefore: config,
      async readSourceConfig() {
        calls.configReads += 1;
        return configAfter ?? config;
      },
      async finish(safe) {
        calls.finish += 1;
        assert.equal(safe, true);
        if (finishError) throw finishError;
        return { status: "completed" };
      },
    },
  };
}

function liveDependencies({
  result = safeFreshResult(),
  runError = null,
  configAfter,
  finishError,
  blocked = "evals/experiments/transport-control-blocked.json",
} = {}) {
  const calls = {
    runtimeFactory: 0,
    runTurn: 0,
    publish: 0,
    writes: [],
    gitStatus: 0,
    gitIdentity: 0,
    gitReadBlob: 0,
    artifactExists: 0,
  };
  const fixture = runtimeFixture({ configAfter, finishError });
  const options = {
    repositoryRoot: ROOT,
    executionPlan: executionPlan({ blocked }),
    sourcePin: sourcePin(),
    async gitStatus() { calls.gitStatus += 1; return ""; },
    async gitIdentity() { calls.gitIdentity += 1; return "a".repeat(40); },
    async gitReadBlob() { calls.gitReadBlob += 1; return Buffer.from("pin"); },
    async artifactExists() { calls.artifactExists += 1; return false; },
    async runtimeFactory() {
      calls.runtimeFactory += 1;
      return fixture.runtime;
    },
    async runTurn(request) {
      calls.runTurn += 1;
      calls.request = request;
      if (runError) throw runError;
      return result;
    },
    async successPublisher(publication) {
      calls.publish += 1;
      calls.publication = publication;
      return { completePair: true };
    },
    async writeArtifact(relativePath, value) {
      calls.writes.push({ relativePath, value });
    },
  };
  return { calls, fixture, options };
}

function normalizedEvent(method, blockers = [], extra = {}) {
  return {
    method,
    blockers,
    ...extra,
    rawText: "RAW-EVENT-CANARY",
    threadId: "PRIVATE-THREAD-ID-CANARY",
    runtimeError: { message: "RAW-RUNTIME-ERROR-CANARY" },
  };
}

function lifecycleEvents(...tail) {
  return [
    normalizedEvent("thread/started"),
    normalizedEvent("turn/started"),
    normalizedEvent("turn/completed", ["turn-not-completed"]),
    ...tail,
  ];
}

function methodHistogram(events) {
  const counts = new Map();
  for (const event of events) counts.set(event.method, (counts.get(event.method) ?? 0) + 1);
  const order = [
    "thread/started",
    "thread/status/changed",
    "turn/completed",
    "turn/started",
    "error",
    "other",
  ];
  return [...counts]
    .sort(([left], [right]) => order.indexOf(left) - order.indexOf(right))
    .map(([method, count]) => ({ method, count }));
}

function freshFailureFixture({
  events = [
    ...lifecycleEvents(normalizedEvent("error", ["runtime-error"])),
  ],
  blockers = ["runtime-error", "runtime-control-blocker", "turn-not-completed"],
  normalizerClassification = "runtime-error",
  observedEventCount = events.length,
  retainedEventCount = events.length,
  retainedEventsOverLimit = false,
  processExitCode = 0,
  cause = new Error("PRIVATE-CAUSE-CANARY"),
} = {}) {
  const histogramEntries = methodHistogram(events);
  const unretainedCount = observedEventCount - events.length;
  if (unretainedCount > 0) histogramEntries.push({ method: "other", count: unretainedCount });
  const error = new Error("fresh evaluator turn validation failed", { cause });
  error.freshEvaluatorEvidence = {
    threadStart: {
      request: { privatePath: "C:\\PRIVATE-PATH-CANARY" },
      response: {
        threadId: "PRIVATE-THREAD-ID-CANARY",
        ephemeral: true,
        priorTurnCount: 0,
        instructionSourceCount: 0,
      },
    },
    thread: { id: "PRIVATE-THREAD-ID-CANARY" },
    turn: {
      id: "PRIVATE-TURN-ID-CANARY",
      request: { privateDigest: "PRIVATE-DIGEST-CANARY" },
    },
    input: { rawText: "RAW-INPUT-CANARY" },
    outputSchema: { rawText: "RAW-SCHEMA-CANARY" },
    events,
    eventCompaction: {
      observedEventCount,
      retainedEventCount,
      retainedEventLimit: 512,
      retainedEventsOverLimit,
      methodHistogram: { eventCount: observedEventCount, entries: histogramEntries },
      itemTypeHistogram: { eventCount: 0, entries: [] },
      agentMessageDelta: {
        groupCount: 0,
        fragmentCount: 0,
        byteLength: 0,
        fragmentLimit: 4096,
        byteLimit: 1048576,
        fragmentLimitExceeded: false,
        byteLimitExceeded: false,
        rawTextRetained: false,
      },
      normalizerBlocker: {
        provenance: "adapter-normalization-fixed-enum",
        classification: normalizerClassification,
      },
      rawPayloadRetained: false,
    },
    toolEvidence: [],
    mcpAfter: [],
    blockers,
    appServer: {
      processExitCode,
      stderr: { text: "RAW-STDERR-CANARY", sha256: "PRIVATE-STDERR-DIGEST-CANARY" },
      remoteControl: null,
      imageDiagnostics: null,
      successfulImageViews: null,
    },
  };
  return error;
}

function failureWithEventReplacement(event, { statusBase = false } = {}) {
  const events = lifecycleEvents(normalizedEvent(
    statusBase ? "thread/status/changed" : "error",
    ["runtime-error"],
    statusBase ? { threadStatus: { type: "systemError" } } : {},
  ));
  const error = freshFailureFixture({ events });
  error.freshEvaluatorEvidence.events = [...events.slice(0, -1), event];
  return error;
}

function origin(projected) {
  return projected?.runtimeErrorOrigin;
}

function earlyDefaultAdapterFailureSession() {
  let processExitCode = null;
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
      async request(method) {
        if (method === "thread/start") throw new Error("PRIVATE-THREAD-START-CANARY");
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

test("exports the frozen neutral transport-control runner API", async () => {
  const api = await subject();
  assert.equal(api.JOENESS_M4_TRANSPORT_CONTROL_ID, ID);
  assert.equal(api.JOENESS_M4_TRANSPORT_CONTROL_INPUT_TEXT, INPUT_TEXT);
  for (const name of [
    "joenessM4TransportControlOutputSchema",
    "validateJoenessM4TransportControlOutput",
    "projectJoenessM4TransportControlFreshFailure",
    "publishJoenessM4TransportControlBlockedArtifact",
    "publishJoenessM4TransportControlSuccessArtifacts",
    "runJoenessM4TransportControlEval",
  ]) assert.equal(typeof api[name], "function", name);
});

test("uses one neutral text descriptor, exact schema, one turn, no tools, no retry, and transport-only result", async () => {
  const api = await subject();
  const deps = liveDependencies();
  const result = await api.runJoenessM4TransportControlEval(deps.options);

  assert.equal(deps.calls.runtimeFactory, 1);
  assert.equal(deps.calls.runTurn, 1);
  assert.equal(deps.fixture.calls.finish, 1);
  assert.equal(deps.fixture.calls.configReads, 1);
  assert.deepEqual(deps.calls.request.input, [{ type: "text", text: INPUT_TEXT }]);
  assert.deepEqual(deps.calls.request.dynamicTools, []);
  assert.equal(deps.calls.request.root, ROOT);
  assert.equal(deps.calls.request.session, deps.fixture.runtime.session);
  assert.deepEqual(deps.calls.request.outputSchema, api.joenessM4TransportControlOutputSchema());
  assert.equal(deps.calls.request.outputSchema.additionalProperties, false);
  assert.deepEqual(result, {
    status: "PASS",
    scope: "transport-only",
    m4Behavior: "NOT-ASSESSED",
    joenessPolicy: "UNVERIFIED",
    superpowersCompatibility: "UNVERIFIED",
    promotionPass: false,
  });
  assert.equal(deps.calls.publish, 1);
  assert.equal(deps.calls.writes.length, 0);
  assert.equal(deps.calls.publication.rawText, JSON.stringify(exactOutput()));
  assert.deepEqual(deps.calls.publication.evidence.assessment, result);
  assert.equal(deps.calls.publication.evidence.runtime.projectDocs, "DISABLED");
  assert.equal(deps.calls.publication.evidence.runtime.dynamicToolCount, 0);
  assert.equal(deps.calls.publication.evidence.runtime.turnCount, 1);
  assert.equal(deps.calls.publication.evidence.runtime.retryCount, 0);
  assert.equal(JSON.stringify(deps.calls.publication).includes(INPUT_TEXT), false);
});

test("accepts only the exact own-data transport output", async () => {
  const api = await subject();
  assert.deepEqual(api.validateJoenessM4TransportControlOutput(exactOutput()), exactOutput());
  const malformed = [
    null,
    [],
    { schemaVersion: 1 },
    { schemaVersion: 1, transport: "bad" },
    { schemaVersion: 2, transport: "ok" },
    { schemaVersion: 1, transport: "ok", extra: true },
    Object.assign(Object.create({ inherited: true }), exactOutput()),
  ];
  const symbol = exactOutput();
  symbol[Symbol("hidden")] = true;
  malformed.push(symbol);
  const accessor = { schemaVersion: 1 };
  Object.defineProperty(accessor, "transport", { enumerable: true, get() { throw new Error("TRAP"); } });
  malformed.push(accessor, new Proxy(exactOutput(), {}));
  for (const value of malformed) {
    assert.throws(() => api.validateJoenessM4TransportControlOutput(value), /output|contract|exact|unsafe/i);
  }
});

test("projects each fixed runtime-error origin without reading raw runtime fields", async () => {
  const api = await subject();
  const cases = [
    ["none", lifecycleEvents(), ["runtime-control-blocker", "turn-not-completed"], "none"],
    ["error-notification", lifecycleEvents(
      normalizedEvent("error", ["runtime-error"]),
    ), undefined, "runtime-error"],
    ["thread-status-system-error", lifecycleEvents(
      normalizedEvent("thread/status/changed", ["runtime-error"], { threadStatus: { type: "systemError", detail: "RAW-STATUS-CANARY" } }),
    ), undefined, "runtime-error"],
    ["multiple", lifecycleEvents(
      normalizedEvent("error", ["runtime-error"]),
      normalizedEvent("thread/status/changed", ["runtime-error"], { threadStatus: { type: "systemError" } }),
    ), undefined, "runtime-error"],
    ["unmapped", lifecycleEvents(
      normalizedEvent("turn/started", ["runtime-error"]),
    ), undefined, "runtime-error"],
  ];
  for (const [classification, events, blockers, normalizerClassification] of cases) {
    const projected = api.projectJoenessM4TransportControlFreshFailure(freshFailureFixture({
      events,
      ...(blockers === undefined ? {} : { blockers }),
      normalizerClassification,
    }));
    assert.deepEqual(origin(projected), { provenance: ORIGIN_PROVENANCE, classification });
    const text = JSON.stringify(projected);
    for (const canary of [
      "RAW-EVENT-CANARY", "PRIVATE-THREAD-ID-CANARY", "RAW-RUNTIME-ERROR-CANARY",
      "RAW-STATUS-CANARY", "RAW-INPUT-CANARY", "RAW-SCHEMA-CANARY", "RAW-STDERR-CANARY",
      "PRIVATE-PATH-CANARY", "PRIVATE-DIGEST-CANARY", "PRIVATE-CAUSE-CANARY",
    ]) assert.equal(text.includes(canary), false, `${classification}: ${canary}`);
  }
});

test("deduplicates repeated origins and gives unmapped precedence over a mapped source", async () => {
  const api = await subject();
  const repeated = lifecycleEvents(
    normalizedEvent("error", ["runtime-error"]),
    normalizedEvent("error", ["runtime-error"]),
  );
  assert.equal(origin(api.projectJoenessM4TransportControlFreshFailure(freshFailureFixture({ events: repeated }))).classification, "error-notification");

  const conflicted = lifecycleEvents(
    normalizedEvent("error", ["runtime-error"]),
    normalizedEvent("turn/started", ["runtime-error"]),
  );
  assert.equal(origin(api.projectJoenessM4TransportControlFreshFailure(freshFailureFixture({ events: conflicted }))).classification, "unmapped");
});

test("v3-shaped runtime error exposes origin while preserving coarse count, lifecycle, and exit", async () => {
  const api = await subject();
  const projected = api.projectJoenessM4TransportControlFreshFailure(freshFailureFixture());
  assert.deepEqual(projected.lifecycle, {
    threadStart: "observed",
    turnStart: "observed",
    terminal: "non-completed",
    terminalCountState: "one",
  });
  assert.deepEqual(projected.eventCounts, { observed: 4, retained: 4, retainedOverLimit: false });
  assert.deepEqual(projected.normalizerBlocker, {
    provenance: "adapter-normalization-fixed-enum",
    classification: "runtime-error",
  });
  assert.deepEqual(projected.runtimeErrorOrigin, {
    provenance: ORIGIN_PROVENANCE,
    classification: "error-notification",
  });
  assert.deepEqual(projected.blockers, {
    count: 3,
    codes: ["runtime-control-blocker", "turn-not-completed"],
    unclassifiedCount: 1,
  });
  assert.equal(projected.appServerExit, "zero");
  assert.equal(Buffer.byteLength(JSON.stringify(projected)) <= 1792, true);
});

test("downgrades consistent incomplete or over-limit retention to unmapped but rejects inconsistent and hostile arrays without traps", async () => {
  const api = await subject();
  const base = freshFailureFixture();
  const evidence = base.freshEvaluatorEvidence;
  assert.equal(origin(api.projectJoenessM4TransportControlFreshFailure(
    freshFailureFixture({ observedEventCount: 5 }),
  )).classification, "unmapped");
  assert.equal(origin(api.projectJoenessM4TransportControlFreshFailure(freshFailureFixture({
    events: lifecycleEvents(),
    blockers: ["runtime-control-blocker", "turn-not-completed"],
    normalizerClassification: "none",
    observedEventCount: 4,
  }))).classification, "unmapped");

  const tooMany = lifecycleEvents(
    ...Array.from({ length: 510 }, () => normalizedEvent("error", ["runtime-error"])),
  );
  assert.equal(origin(api.projectJoenessM4TransportControlFreshFailure(freshFailureFixture({
    events: tooMany,
    retainedEventsOverLimit: true,
  }))).classification, "unmapped");

  const hostile = [
    freshFailureFixture({ retainedEventCount: 3 }),
    freshFailureFixture({ retainedEventsOverLimit: true }),
  ];

  const sparse = [...evidence.events];
  delete sparse[1];
  const sparseError = freshFailureFixture();
  sparseError.freshEvaluatorEvidence.events = sparse;
  hostile.push(sparseError);

  const extraArrayKey = [...evidence.events];
  extraArrayKey.extra = true;
  const extraError = freshFailureFixture();
  extraError.freshEvaluatorEvidence.events = extraArrayKey;
  hostile.push(extraError);

  const symbolArray = [...evidence.events];
  symbolArray[Symbol("hidden")] = true;
  const symbolError = freshFailureFixture();
  symbolError.freshEvaluatorEvidence.events = symbolArray;
  hostile.push(symbolError);

  const accessorIndex = [...evidence.events];
  let indexTraps = 0;
  Object.defineProperty(accessorIndex, "3", {
    enumerable: true,
    get() { indexTraps += 1; throw new Error("TRAP"); },
  });
  const accessorIndexError = freshFailureFixture();
  accessorIndexError.freshEvaluatorEvidence.events = accessorIndex;
  hostile.push(accessorIndexError);

  let traps = 0;
  const accessorEvent = normalizedEvent("error", []);
  Object.defineProperty(accessorEvent, "blockers", {
    enumerable: true,
    get() { traps += 1; throw new Error("TRAP"); },
  });
  hostile.push(failureWithEventReplacement(accessorEvent));

  const proxiedEvent = new Proxy(normalizedEvent("error", ["runtime-error"]), {
    getOwnPropertyDescriptor() { traps += 1; throw new Error("TRAP"); },
    ownKeys() { traps += 1; throw new Error("TRAP"); },
    get() { traps += 1; throw new Error("TRAP"); },
  });
  hostile.push(failureWithEventReplacement(proxiedEvent));

  const revoked = Proxy.revocable(normalizedEvent("error", ["runtime-error"]), {});
  revoked.revoke();
  hostile.push(failureWithEventReplacement(revoked.proxy));

  for (const error of hostile) assert.equal(api.projectJoenessM4TransportControlFreshFailure(error), null);
  assert.equal(traps, 0);
  assert.equal(indexTraps, 0);
});

test("fails closed on malformed selected event fields and never touches disallowed accessors", async () => {
  const api = await subject();
  let disallowedReads = 0;
  const safe = normalizedEvent("error", ["runtime-error"]);
  for (const key of ["runtimeError", "message", "details", "threadId", "id", "path", "rawOutput"]) {
    Object.defineProperty(safe, key, {
      configurable: true,
      enumerable: true,
      get() { disallowedReads += 1; throw new Error(`TRAP-${key}`); },
    });
  }
  const projected = api.projectJoenessM4TransportControlFreshFailure(freshFailureFixture({ events: lifecycleEvents(safe) }));
  assert.equal(origin(projected).classification, "error-notification");
  assert.equal(disallowedReads, 0);

  const malformed = [
    {},
    { method: 1, blockers: ["runtime-error"] },
    { method: "error", blockers: "runtime-error" },
    { method: "error", blockers: ["runtime-error"], [Symbol("hidden")]: true },
  ];
  for (const event of malformed) {
    assert.equal(api.projectJoenessM4TransportControlFreshFailure(failureWithEventReplacement(event)), null);
  }

  for (const event of [
    { method: "thread/status/changed", blockers: ["runtime-error"] },
    { method: "thread/status/changed", blockers: ["runtime-error"], threadStatus: { type: "other" } },
  ]) {
    assert.equal(origin(api.projectJoenessM4TransportControlFreshFailure(
      freshFailureFixture({ events: lifecycleEvents(event) }),
    )).classification, "unmapped");
  }
});

test("rejects hostile nested blockers and threadStatus shapes without invoking traps", async () => {
  const api = await subject();
  let traps = 0;
  const hostileBlockers = [];
  const sparseBlockers = ["runtime-error"];
  sparseBlockers.length = 2;
  hostileBlockers.push(sparseBlockers);
  const symbolBlockers = ["runtime-error"];
  symbolBlockers[Symbol("hidden")] = true;
  hostileBlockers.push(symbolBlockers);
  const accessorBlockers = [];
  Object.defineProperty(accessorBlockers, "0", {
    enumerable: true,
    get() { traps += 1; throw new Error("TRAP"); },
  });
  accessorBlockers.length = 1;
  hostileBlockers.push(accessorBlockers);
  hostileBlockers.push(new Proxy(["runtime-error"], {
    getOwnPropertyDescriptor() { traps += 1; throw new Error("TRAP"); },
    ownKeys() { traps += 1; throw new Error("TRAP"); },
    get() { traps += 1; throw new Error("TRAP"); },
  }));
  const revokedBlockers = Proxy.revocable(["runtime-error"], {});
  revokedBlockers.revoke();
  hostileBlockers.push(revokedBlockers.proxy);
  for (const blockers of hostileBlockers) {
    assert.equal(api.projectJoenessM4TransportControlFreshFailure(
      failureWithEventReplacement({ method: "error", blockers }),
    ), null);
  }

  const hostileStatuses = [];
  const accessorStatus = {};
  Object.defineProperty(accessorStatus, "type", {
    enumerable: true,
    get() { traps += 1; throw new Error("TRAP"); },
  });
  hostileStatuses.push(accessorStatus);
  const symbolStatus = { type: "systemError", [Symbol("hidden")]: true };
  hostileStatuses.push(symbolStatus);
  hostileStatuses.push(new Proxy({ type: "systemError" }, {
    getOwnPropertyDescriptor() { traps += 1; throw new Error("TRAP"); },
    ownKeys() { traps += 1; throw new Error("TRAP"); },
    get() { traps += 1; throw new Error("TRAP"); },
  }));
  const revokedStatus = Proxy.revocable({ type: "systemError" }, {});
  revokedStatus.revoke();
  hostileStatuses.push(revokedStatus.proxy);
  for (const threadStatus of hostileStatuses) {
    assert.equal(api.projectJoenessM4TransportControlFreshFailure(
      failureWithEventReplacement({
        method: "thread/status/changed",
        blockers: ["runtime-error"],
        threadStatus,
      }, { statusBase: true }),
    ), null);
  }
  assert.equal(traps, 0);
});

test("source is neutral and imports neither the legacy M4 rubric runner nor fixtures", async () => {
  await subject();
  const source = await readFile(MODULE_PATH, "utf8");
  assert.match(source, /from "\.\/run-fresh-evaluator-turn\.mjs"/u);
  for (const forbidden of [
    "run-joeness-m4-superpowers-eval",
    "joeness-m4-superpowers-v1",
    "fixtureManifest",
    "manifest-v2.json",
    "rubric",
    "Superpowers",
    "JOENESSPolicy",
  ]) assert.equal(source.includes(forbidden), false, forbidden);
});

test("success publication excludes raw input, IDs, paths, stderr, config, and adapter canaries", async () => {
  const api = await subject();
  const result = safeFreshResult();
  result.private = "RAW-RESULT-CANARY";
  result.threadStart.privatePath = "C:\\PRIVATE-PATH-CANARY";
  result.appServer.stderr.text = "RAW-STDERR-CANARY";
  const deps = liveDependencies({ result });
  await api.runJoenessM4TransportControlEval(deps.options);
  const durable = JSON.stringify(deps.calls.publication);
  for (const canary of [
    INPUT_TEXT,
    "PRIVATE-THREAD-ID-CANARY",
    "private-thread-id",
    "private-turn-id",
    "PRIVATE-PATH-CANARY",
    "RAW-STDERR-CANARY",
    "RAW-RESULT-CANARY",
    "config",
  ]) assert.equal(durable.includes(canary), false, canary);
});

test("success rejects forged project-doc or tool summaries before claiming DISABLED and zero", async () => {
  const api = await subject();
  for (const [key, value] of [["projectDocMaxBytes", 1], ["dynamicToolCount", 1]]) {
    const result = safeFreshResult();
    result.threadStart.request[key] = value;
    const deps = liveDependencies({ result });
    await assert.rejects(api.runJoenessM4TransportControlEval(deps.options), /lifecycle|request|boundary|project|tool/i);
    assert.equal(deps.calls.publish, 0);
    assert.equal(deps.calls.writes.length, 1);
  }
  const nonEphemeral = safeFreshResult();
  nonEphemeral.threadStart.response.ephemeral = false;
  const deps = liveDependencies({ result: nonEphemeral });
  await assert.rejects(api.runJoenessM4TransportControlEval(deps.options), /lifecycle|response|boundary|ephemeral/i);
  assert.equal(deps.calls.publish, 0);
});

test("result proxy and output accessor fail closed without invoking traps", async () => {
  const api = await subject();
  let traps = 0;
  const proxied = new Proxy(safeFreshResult(), {
    get(_target, key) {
      if (key === "then") return undefined;
      traps += 1;
      throw new Error("TRAP");
    },
    getOwnPropertyDescriptor() { traps += 1; throw new Error("TRAP"); },
    ownKeys() { traps += 1; throw new Error("TRAP"); },
  });
  const proxyDeps = liveDependencies({ result: proxied });
  await assert.rejects(api.runJoenessM4TransportControlEval(proxyDeps.options), /result|unsafe|boundary/i);
  assert.equal(traps, 0);
  assert.equal(proxyDeps.calls.writes.length, 1);

  const accessor = safeFreshResult();
  Object.defineProperty(accessor, "output", {
    enumerable: true,
    get() { traps += 1; throw new Error("TRAP"); },
  });
  const accessorDeps = liveDependencies({ result: accessor });
  await assert.rejects(api.runJoenessM4TransportControlEval(accessorDeps.options), /result|unsafe|boundary/i);
  assert.equal(traps, 0);
  assert.equal(accessorDeps.calls.writes.length, 1);
});

test("injected runTurn cannot mint authentic retained freshFailure provenance", async () => {
  const api = await subject();
  const deps = liveDependencies({ runError: freshFailureFixture() });
  await assert.rejects(api.runJoenessM4TransportControlEval(deps.options), /fresh evaluator turn validation failed/);
  assert.equal(deps.calls.runTurn, 1);
  assert.equal(deps.fixture.calls.finish, 1);
  assert.equal(deps.calls.publish, 0);
  assert.equal(deps.calls.writes.length, 1);
  const blocked = deps.calls.writes[0].value;
  assert.deepEqual(blocked, {
    schemaVersion: 1,
    status: "blocked",
    phase: "post-runtime-validation",
    safeCleanup: true,
    cause: { category: "evaluation-failed" },
  });
  assert.equal(JSON.stringify(blocked).includes("freshFailure"), false);
});

test("authentic imported adapter failure retains schemaVersion 3 while omitting private cause text", async () => {
  const api = await subject();
  const deps = liveDependencies();
  delete deps.options.runTurn;
  deps.fixture.runtime.session = earlyDefaultAdapterFailureSession();
  await assert.rejects(api.runJoenessM4TransportControlEval(deps.options), /fresh evaluator turn validation failed/);
  assert.equal(deps.calls.writes.length, 1);
  const blocked = deps.calls.writes[0].value;
  assert.equal(blocked.freshFailure.schemaVersion, 3);
  assert.equal(blocked.freshFailure.provenance, "transport-control-runner-observed-default-fresh-adapter-rejection");
  assert.equal(JSON.stringify(blocked).includes("PRIVATE-THREAD-START-CANARY"), false);
});

test("invalid success output cleans up then writes only generic blocked artifact", async () => {
  const api = await subject();
  const deps = liveDependencies({ result: safeFreshResult({ schemaVersion: 1, transport: "ok", extra: true }) });
  await assert.rejects(api.runJoenessM4TransportControlEval(deps.options), /output|exact|contract/i);
  assert.equal(deps.calls.runTurn, 1);
  assert.equal(deps.fixture.calls.finish, 1);
  assert.equal(deps.fixture.calls.configReads, 1);
  assert.equal(deps.calls.publish, 0);
  assert.equal(deps.calls.writes.length, 1);
  assert.equal(deps.calls.writes[0].relativePath, executionPlan().outputs.blocked);
  assert.equal(deps.calls.writes[0].value.status, "blocked");
  assert.equal(JSON.stringify(deps.calls.writes[0].value).includes("extra"), false);
});

test("unsafe cleanup or config drift suppresses every artifact", async () => {
  const api = await subject();
  const finishFailure = liveDependencies({ runError: new Error("turn failed"), finishError: new Error("finish failed") });
  await assert.rejects(api.runJoenessM4TransportControlEval(finishFailure.options), /failed/);
  assert.equal(finishFailure.calls.publish, 0);
  assert.equal(finishFailure.calls.writes.length, 0);

  const configDrift = liveDependencies({
    runError: new Error("turn failed"),
    configAfter: { bytes: 10, sha256: digest("changed") },
  });
  await assert.rejects(api.runJoenessM4TransportControlEval(configDrift.options), /failed|config/i);
  assert.equal(configDrift.calls.publish, 0);
  assert.equal(configDrift.calls.writes.length, 0);
});

test("in-place mutation of the runtime-owned config tuple cannot hide drift", async () => {
  const api = await subject();
  const deps = liveDependencies();
  const baseline = deps.fixture.runtime.sourceConfigBefore;
  deps.fixture.runtime.readSourceConfig = async () => {
    baseline.bytes += 1;
    baseline.sha256 = digest("mutated-config");
    return baseline;
  };
  await assert.rejects(api.runJoenessM4TransportControlEval(deps.options), /config|cleanup|changed/i);
  assert.equal(deps.calls.publish, 0);
  assert.equal(deps.calls.writes.length, 0);
});

test("runtimeFactory cannot move the runner-owned plan or source-pin boundary", async () => {
  const api = await subject();
  const deps = liveDependencies();
  const originalFactory = deps.options.runtimeFactory;
  deps.options.runtimeFactory = async (request) => {
    request.executionPlan.outputs.raw = "evals/experiments/mutated-raw.json";
    request.executionPlan.outputs.evidence = "evals/experiments/mutated-evidence.json";
    request.sourcePin.runner.bytes = 5;
    request.sourcePin.runner.sha256 = digest("drift");
    return originalFactory(request);
  };
  const result = await api.runJoenessM4TransportControlEval(deps.options);
  assert.equal(result.status, "PASS");
  assert.equal(deps.calls.publication.rawPath, executionPlan().outputs.raw);
  assert.equal(deps.calls.publication.evidencePath, executionPlan().outputs.evidence);
});

test("preflight rejects dirty git, source drift, and output collision before runtime", async () => {
  const api = await subject();
  const cases = [
    ["dirty", { gitStatus: async () => " M user-change" }],
    ["source", { gitIdentity: async () => "b".repeat(40) }],
    ["pin", { gitReadBlob: async () => Buffer.from("drift") }],
    ["collision", { artifactExists: async () => true }],
  ];
  for (const [label, overrides] of cases) {
    const deps = liveDependencies();
    Object.assign(deps.options, overrides);
    await assert.rejects(api.runJoenessM4TransportControlEval(deps.options), /dirty|source|pin|collision|exists/i, label);
    assert.equal(deps.calls.runtimeFactory, 0, label);
    assert.equal(deps.calls.runTurn, 0, label);
  }

  const wrongPath = liveDependencies();
  wrongPath.options.sourcePin.runner.path = "evals/support/another-runner.mjs";
  await assert.rejects(api.runJoenessM4TransportControlEval(wrongPath.options), /runner.*path|source.*path/i);
  assert.equal(wrongPath.calls.runtimeFactory, 0);
});

test("final pre-publication revalidation catches post-turn git mutation and emits no artifact", async () => {
  const api = await subject();
  const deps = liveDependencies();
  let reads = 0;
  deps.options.gitStatus = async () => {
    reads += 1;
    return reads === 1 ? "" : " M post-turn-mutation";
  };
  await assert.rejects(api.runJoenessM4TransportControlEval(deps.options), /dirty|changed|mutation/i);
  assert.equal(deps.calls.runTurn, 1);
  assert.equal(deps.fixture.calls.finish, 1);
  assert.equal(deps.calls.publish, 0);
  assert.equal(deps.calls.writes.length, 0);
});

test("blocked publication also revalidates git and outputs after cleanup", async () => {
  const api = await subject();
  const deps = liveDependencies({ runError: new Error("turn failed") });
  let reads = 0;
  deps.options.gitStatus = async () => {
    reads += 1;
    return reads === 1 ? "" : " M post-turn-mutation";
  };
  await assert.rejects(api.runJoenessM4TransportControlEval(deps.options), /turn failed|dirty|mutation|boundary validation/i);
  assert.equal(deps.fixture.calls.finish, 1);
  assert.equal(deps.calls.publish, 0);
  assert.equal(deps.calls.writes.length, 0);
  assert.equal(reads, 2);
});

test("default blocked writer publishes one exclusive read-back receipt and no success artifact", async (t) => {
  const api = await subject();
  const root = await mkdtemp(path.join(tmpdir(), "joeness-m4-control-blocked-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, "evals/experiments"), { recursive: true });
  const deps = liveDependencies({ result: safeFreshResult({ schemaVersion: 1, transport: "bad" }) });
  deps.options.repositoryRoot = root;
  delete deps.options.writeArtifact;
  await assert.rejects(api.runJoenessM4TransportControlEval(deps.options), /output|contract/i);
  const blockedPath = path.join(root, ...executionPlan().outputs.blocked.split("/"));
  const blockedText = await readFile(blockedPath, "utf8");
  assert.deepEqual(JSON.parse(blockedText), {
    schemaVersion: 1,
    status: "blocked",
    phase: "post-runtime-validation",
    safeCleanup: true,
    cause: { category: "contract-validation" },
  });
  assert.equal(blockedText.endsWith("\n"), true);
  await assert.rejects(lstat(path.join(root, ...executionPlan().outputs.raw.split("/"))), /ENOENT/);
  await assert.rejects(lstat(path.join(root, ...executionPlan().outputs.evidence.split("/"))), /ENOENT/);
  assert.deepEqual((await readdir(path.join(root, "evals/experiments"))).sort(), ["transport-control-blocked.json"]);
});

test("blocked writer preserves a replacement whose file identity is not the acquired file", async (t) => {
  const api = await subject();
  const root = await mkdtemp(path.join(tmpdir(), "joeness-m4-control-blocked-race-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, "evals/experiments"), { recursive: true });
  const relativePath = "evals/experiments/blocked.json";
  const foreign = "FOREIGN-BLOCKED-REPLACEMENT";
  let caught;
  try {
    await api.publishJoenessM4TransportControlBlockedArtifact({
      repositoryRoot: root,
      relativePath,
      value: { schemaVersion: 1, status: "blocked" },
      async readArtifact(target) {
        await unlink(target);
        await writeFile(target, foreign, { flag: "wx" });
        return readFile(target);
      },
    });
  } catch (error) {
    caught = error;
  }
  assert.ok(caught);
  assert.match(caught.message, /unresolved|identity|replacement/i);
  assert.equal(await readFile(path.join(root, ...relativePath.split("/")), "utf8"), foreign);
});

test("default publisher creates an all-or-nothing raw/evidence pair", async (t) => {
  const api = await subject();
  const root = await mkdtemp(path.join(tmpdir(), "joeness-m4-control-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, "evals/experiments"), { recursive: true });
  const rawPath = "evals/experiments/raw.json";
  const evidencePath = "evals/experiments/evidence.json";
  const rawText = JSON.stringify(exactOutput());
  const evidence = { schemaVersion: 1, assessment: { status: "PASS" } };
  const receipt = await api.publishJoenessM4TransportControlSuccessArtifacts({
    repositoryRoot: root,
    rawPath,
    evidencePath,
    rawText,
    evidence,
  });
  assert.equal(receipt.completePair, true);
  assert.equal(await readFile(path.join(root, ...rawPath.split("/")), "utf8"), rawText);
  assert.equal(await readFile(path.join(root, ...evidencePath.split("/")), "utf8"), `${JSON.stringify(evidence, null, 2)}\n`);
});

test("default publisher rejects collision and symlink traversal before creating a pair", async (t) => {
  const api = await subject();
  const root = await mkdtemp(path.join(tmpdir(), "joeness-m4-control-boundary-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, "evals/experiments"), { recursive: true });
  await writeFile(path.join(root, "evals/experiments/raw.json"), "existing");
  await assert.rejects(api.publishJoenessM4TransportControlSuccessArtifacts({
    repositoryRoot: root,
    rawPath: "evals/experiments/raw.json",
    evidencePath: "evals/experiments/evidence.json",
    rawText: JSON.stringify(exactOutput()),
    evidence: { schemaVersion: 1 },
  }), /collision|exists/i);
  await assert.rejects(lstat(path.join(root, "evals/experiments/evidence.json")), /ENOENT/);

  const outside = await mkdtemp(path.join(tmpdir(), "joeness-m4-control-outside-"));
  t.after(() => rm(outside, { recursive: true, force: true }));
  await mkdir(path.join(root, "linked"));
  await symlink(outside, path.join(root, "linked/out"), "junction");
  await assert.rejects(api.publishJoenessM4TransportControlSuccessArtifacts({
    repositoryRoot: root,
    rawPath: "linked/out/raw.json",
    evidencePath: "linked/out/evidence.json",
    rawText: JSON.stringify(exactOutput()),
    evidence: { schemaVersion: 1 },
  }), /symlink|reparse|confine|parent/i);
});

test("default publisher rolls back owned links but preserves ambiguous link-created-then-thrown targets", async (t) => {
  const api = await subject();
  for (const mode of ["create-then-throw", "partial-link", "readback-mismatch"]) {
    const root = await mkdtemp(path.join(tmpdir(), `joeness-m4-control-${mode}-`));
    t.after(() => rm(root, { recursive: true, force: true }));
    await mkdir(path.join(root, "evals/experiments"), { recursive: true });
    let links = 0;
    const publication = {
      repositoryRoot: root,
      rawPath: "evals/experiments/raw.json",
      evidencePath: "evals/experiments/evidence.json",
      rawText: JSON.stringify(exactOutput()),
      evidence: { schemaVersion: 1 },
    };
    if (mode === "create-then-throw") {
      publication.linkFile = async (source, target) => {
        await writeFile(target, await readFile(source));
        throw new Error("link created then failed");
      };
    } else if (mode === "partial-link") {
      publication.linkFile = async (source, target) => {
        links += 1;
        if (links === 2) throw new Error("second link failed");
        await link(source, target);
      };
    } else {
      publication.linkFile = async (source, target) => {
        await link(source, target);
        await writeFile(target, "wrong");
      };
    }
    let caught;
    try { await api.publishJoenessM4TransportControlSuccessArtifacts(publication); }
    catch (error) { caught = error; }
    assert.ok(caught);
    if (mode === "create-then-throw") {
      assert.match(caught.message, /unresolved/i);
      assert.doesNotMatch(caught.message, /rolled back/i);
      assert.equal(
        await readFile(path.join(root, "evals/experiments/evidence.json"), "utf8"),
        `${JSON.stringify(publication.evidence, null, 2)}\n`,
      );
      await assert.rejects(lstat(path.join(root, "evals/experiments/raw.json")), /ENOENT/);
    } else {
      for (const name of ["raw.json", "evidence.json"]) {
        await assert.rejects(lstat(path.join(root, "evals/experiments", name)), /ENOENT/);
      }
    }
  }
});

test("publisher preserves final and temp replacements that no longer match acquired identities", async (t) => {
  const api = await subject();
  for (const replacement of ["final", "temp"]) {
    const root = await mkdtemp(path.join(tmpdir(), `joeness-m4-control-post-acquire-${replacement}-`));
    t.after(() => rm(root, { recursive: true, force: true }));
    await mkdir(path.join(root, "evals/experiments"), { recursive: true });
    const foreign = `FOREIGN-${replacement.toUpperCase()}-REPLACEMENT`;
    let evidenceSource;
    let evidenceTarget;
    let calls = 0;
    let caught;
    try {
      await api.publishJoenessM4TransportControlSuccessArtifacts({
        repositoryRoot: root,
        rawPath: "evals/experiments/raw.json",
        evidencePath: "evals/experiments/evidence.json",
        rawText: JSON.stringify(exactOutput()),
        evidence: { schemaVersion: 1 },
        async linkFile(source, target) {
          calls += 1;
          if (calls === 1) {
            evidenceSource = source;
            evidenceTarget = target;
            await link(source, target);
            return;
          }
          const victim = replacement === "final" ? evidenceTarget : evidenceSource;
          await unlink(victim);
          await writeFile(victim, foreign, { flag: "wx" });
          throw new Error("second link failed after replacement");
        },
      });
    } catch (error) {
      caught = error;
    }
    assert.ok(caught);
    assert.match(caught.message, /unresolved|identity|replacement/i);
    const victim = replacement === "final" ? evidenceTarget : evidenceSource;
    assert.equal(await readFile(victim, "utf8"), foreign);
  }
});

test("publisher never deletes a foreign EEXIST race target it did not acquire", async (t) => {
  const api = await subject();
  const root = await mkdtemp(path.join(tmpdir(), "joeness-m4-control-race-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, "evals/experiments"), { recursive: true });
  const foreign = "FOREIGN-TARGET-MUST-SURVIVE";
  let caught;
  try { await api.publishJoenessM4TransportControlSuccessArtifacts({
    repositoryRoot: root,
    rawPath: "evals/experiments/raw.json",
    evidencePath: "evals/experiments/evidence.json",
    rawText: JSON.stringify(exactOutput()),
    evidence: { schemaVersion: 1 },
    async linkFile(_source, target) {
      await writeFile(target, foreign, { flag: "wx" });
      const error = new Error("foreign EEXIST race");
      error.code = "EEXIST";
      throw error;
    },
  }); } catch (error) { caught = error; }
  assert.ok(caught);
  assert.match(caught.message, /unresolved/i);
  assert.doesNotMatch(caught.message, /rolled back/i);
  assert.equal(await readFile(path.join(root, "evals/experiments/evidence.json"), "utf8"), foreign);
  await assert.rejects(lstat(path.join(root, "evals/experiments/raw.json")), /ENOENT/);
});
