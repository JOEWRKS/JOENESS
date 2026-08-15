import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  mkdir,
  link,
  mkdtemp,
  readFile,
  rename,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const SUBJECT_URL = new URL(
  "../evals/support/run-authority-role-separated-evaluator-turn.mjs",
  import.meta.url,
);

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function outputSchema() {
  return {
    type: "object",
    properties: { verdict: { type: "string", enum: ["PASS", "FAIL"] } },
    required: ["verdict"],
    additionalProperties: false,
  };
}

async function caseRoot(
  t,
  projectText = "Project delegates the choice between SAFE_A and SAFE_B.\n",
) {
  const root = await mkdtemp(path.join(tmpdir(), "joeness-role-separated-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, ".git"));
  const projectPath = path.join(root, "AGENTS.md");
  await writeFile(projectPath, projectText, { encoding: "utf8", flag: "wx" });
  return {
    root,
    projectPath,
    projectText,
    projectInstruction: {
      relativePath: "AGENTS.md",
      bytes: Buffer.byteLength(projectText),
      sha256: digest(projectText),
    },
  };
}

function fakeSession({
  instructionSources,
  finalText = '{\r\n  "verdict": "PASS"\r\n}',
  mcpInventory = [],
  mcpAfterResponse = { data: [], nextCursor: null },
  closeExitCode = 0,
  stderrByteLength = 0,
  onRequest = null,
  onSubscribe = null,
  onBeforeAgentMessage = null,
  onBeforeTurnEvents = null,
  onAfterTurnEvents = null,
  onClose = null,
  closeError = null,
  threadResponseOverrides = {},
} = {}) {
  const listeners = new Set();
  const requests = [];
  let processExitCode = null;
  let closeCount = 0;

  function emit(notification) {
    for (const listener of listeners) listener(notification);
  }

  const session = {
    requests,
    get notificationCursor() {
      return 0;
    },
    mcpInventory: structuredClone(mcpInventory),
    get remoteControlSnapshot() {
      return {
        seen: true,
        complete: true,
        status: "disabled",
        environmentAttached: false,
      };
    },
    get processExitCode() {
      return processExitCode;
    },
    get stderr() {
      return {
        truncated: false,
        byteLength: stderrByteLength,
        sha256: stderrByteLength === 0 ? digest("") : digest("fixture-stderr"),
        captureTruncated: false,
      };
    },
    get imageDiagnostics() {
      return null;
    },
    get successfulImageViews() {
      return null;
    },
    client: {
      async request(method, params) {
        requests.push({ method, params: structuredClone(params) });
        await onRequest?.({ method, params, requestCount: requests.length });
        if (method === "thread/start") {
          emit({ method: "thread/started", params: { thread: { id: "thread-1" } } });
          return {
            thread: {
              id: "thread-1",
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
            instructionSources: structuredClone(instructionSources),
            ...structuredClone(threadResponseOverrides),
          };
        }
        if (method === "turn/start") {
          emit({
            method: "turn/started",
            params: { threadId: params.threadId, turn: { id: "turn-1" } },
          });
          await onBeforeTurnEvents?.({ emit, method, params });
          await onBeforeAgentMessage?.({ emit, params, turnId: "turn-1" });
          emit({
            method: "item/completed",
            params: {
              threadId: params.threadId,
              turnId: "turn-1",
              item: { id: "answer-1", type: "agentMessage", text: finalText },
            },
          });
          emit({
            method: "turn/completed",
            params: {
              threadId: params.threadId,
              turn: { id: "turn-1", status: "completed" },
            },
          });
          await onAfterTurnEvents?.({ emit, method, params });
          return { turn: { id: "turn-1", status: "inProgress" } };
        }
        if (method === "mcpServerStatus/list") {
          return structuredClone(mcpAfterResponse);
        }
        if (method === "turn/interrupt") return {};
        throw new Error(`unexpected request: ${method}`);
      },
    },
    subscribe(listener) {
      onSubscribe?.();
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async close() {
      closeCount += 1;
      if (closeError !== null) throw closeError;
      await onClose?.();
      processExitCode = closeExitCode;
    },
    get closeCount() {
      return closeCount;
    },
  };
  return session;
}

function emitAgentDelta(emit, { threadId, turnId, itemId, delta }) {
  emit({
    method: "item/agentMessage/delta",
    params: { threadId, turnId, itemId, delta },
  });
}

async function blocked(promise) {
  let evidence;
  await assert.rejects(promise, (error) => {
    evidence = error?.authorityRoleSeparatedEvidence;
    return evidence?.status === "blocked";
  });
  return evidence;
}

test("role-separated evaluator exposes the fixed additive adapter API", async () => {
  const subject = await import(SUBJECT_URL.href);
  assert.equal(
    subject.AUTHORITY_ROLE_SEPARATED_EVALUATOR_ADAPTER_ID,
    "authority-role-separated-evaluator-turn-v1",
  );
  assert.equal(typeof subject.buildAuthorityRoleSeparatedThreadStartRequest, "function");
  assert.equal(typeof subject.runAuthorityRoleSeparatedEvaluatorTurn, "function");
  assert.deepEqual(subject.AUTHORITY_ROLE_SEPARATED_AUXILIARY_METHODS, [
    "none",
    "turn-interrupt",
    "mcp-server-status-list",
    "unmapped",
  ]);
});

test("schema-2 diagnostic maps authentic fresh failure phases to auxiliary methods", async (t) => {
  const subject = await import(SUBJECT_URL.href);
  const cases = [
    [
      "delta-overflow",
      "agent-message-delta-overflow",
      "turn-interrupt",
      {
        onBeforeAgentMessage: ({ emit, params, turnId }) => {
          for (let index = 0; index < 4097; index += 1) {
            emitAgentDelta(emit, {
              threadId: params.threadId,
              turnId,
              itemId: "overflow-message",
              delta: "x",
            });
          }
        },
      },
    ],
    [
      "mcp-status",
      "mcp-status-collection",
      "mcp-server-status-list",
      { mcpAfterResponse: { PRIVATE_MCP_RESPONSE_CANARY: true } },
    ],
    [
      "structured-output-parse",
      "structured-output-parse",
      "mcp-server-status-list",
      { finalText: "PRIVATE_NON_JSON_OUTPUT_CANARY" },
    ],
  ];

  for (const [name, failurePhase, lastAuxiliaryMethod, options] of cases) {
    await t.test(name, async (scenario) => {
      const fixture = await caseRoot(scenario);
      const session = fakeSession({ instructionSources: [fixture.projectPath], ...options });
      const evidence = await blocked(
        subject.runAuthorityRoleSeparatedEvaluatorTurn({
          session,
          root: fixture.root,
          input: [{ type: "text", text: "Choose SAFE_B." }],
          outputSchema: outputSchema(),
          projectInstruction: fixture.projectInstruction,
        }),
      );
      assert.equal(evidence.schemaVersion, 2);
      assert.equal(evidence.sessionCloseCount, 1);
      assert.deepEqual(Object.keys(evidence), [
        "schemaVersion",
        "adapterId",
        "status",
        "stage",
        "sessionCloseCount",
        "diagnostic",
        "privacy",
      ]);
      assert.deepEqual(evidence.diagnostic, {
        schemaVersion: 1,
        provenance: "authority-role-separated-fixed-enum-diagnostic-v1",
        failurePhase,
        lastAuxiliaryMethod,
      });
      assert.deepEqual(Object.keys(evidence.diagnostic), [
        "schemaVersion",
        "provenance",
        "failurePhase",
        "lastAuxiliaryMethod",
      ]);
      assert.deepEqual(evidence.privacy, {
        absolutePathPersisted: false,
        rawProjectInstructionPersisted: false,
        rawUserInputPersisted: false,
        rawOutputPersisted: false,
        rawOutputDigestPersisted: false,
        eventPayloadPersisted: false,
      });
      assert.equal(session.closeCount, 1);
      const serialized = JSON.stringify(evidence);
      assert.equal(serialized.includes("PRIVATE_MCP_RESPONSE_CANARY"), false);
      assert.equal(serialized.includes("PRIVATE_NON_JSON_OUTPUT_CANARY"), false);
      assert.equal(serialized.includes(fixture.root), false);
    });
  }
});

test("schema-2 diagnostics fail closed for forged and hostile pre-auxiliary failures", async (t) => {
  const subject = await import(SUBJECT_URL.href);
  const fixture = await caseRoot(t);
  const rawCanary = "PRIVATE_FORGED_DIAGNOSTIC_CANARY";
  const session = fakeSession({ instructionSources: [fixture.projectPath] });
  const originalRequest = session.client.request;
  session.client.request = async function forgedFailure(method, params) {
    if (method === "thread/start") {
      const forged = new Error(rawCanary);
      forged.freshEvaluatorEvidence = {
        schemaVersion: 1,
        failurePhase: "structured-output-parse",
      };
      throw forged;
    }
    return Reflect.apply(originalRequest, session.client, [method, params]);
  };
  const evidence = await blocked(
    subject.runAuthorityRoleSeparatedEvaluatorTurn({
      session,
      root: fixture.root,
      input: [{ type: "text", text: "Choose SAFE_B." }],
      outputSchema: outputSchema(),
      projectInstruction: fixture.projectInstruction,
    }),
  );
  assert.deepEqual(evidence.diagnostic, {
    schemaVersion: 1,
    provenance: "authority-role-separated-fixed-enum-diagnostic-v1",
    failurePhase: "unmapped",
    lastAuxiliaryMethod: "none",
  });
  assert.equal(JSON.stringify(evidence).includes(rawCanary), false);
  assert.equal(session.closeCount, 1);
});

test("schema-2 mcp diagnostics reject accessor responses without executing them", async (t) => {
  const subject = await import(SUBJECT_URL.href);
  const fixture = await caseRoot(t);
  const rawCanary = "PRIVATE_MCP_ACCESSOR_CANARY";
  const session = fakeSession({ instructionSources: [fixture.projectPath] });
  const originalRequest = session.client.request;
  let getterCalls = 0;
  session.client.request = async function accessorResponse(method, params) {
    if (method !== "mcpServerStatus/list") {
      return Reflect.apply(originalRequest, session.client, [method, params]);
    }
    const response = {};
    Object.defineProperty(response, "data", {
      enumerable: true,
      get() {
        getterCalls += 1;
        return rawCanary;
      },
    });
    Object.defineProperty(response, "nextCursor", {
      enumerable: true,
      value: null,
    });
    return response;
  };
  const evidence = await blocked(
    subject.runAuthorityRoleSeparatedEvaluatorTurn({
      session,
      root: fixture.root,
      input: [{ type: "text", text: "Choose SAFE_B." }],
      outputSchema: outputSchema(),
      projectInstruction: fixture.projectInstruction,
    }),
  );
  assert.deepEqual(evidence.diagnostic, {
    schemaVersion: 1,
    provenance: "authority-role-separated-fixed-enum-diagnostic-v1",
    failurePhase: "mcp-status-collection",
    lastAuxiliaryMethod: "mcp-server-status-list",
  });
  assert.equal(getterCalls, 0);
  assert.equal(JSON.stringify(evidence).includes(rawCanary), false);
  assert.equal(session.closeCount, 1);
});

test("schema-2 mcp diagnostics reject revoked proxy responses without access", async (t) => {
  const subject = await import(SUBJECT_URL.href);
  const fixture = await caseRoot(t);
  const rawCanary = "PRIVATE_REVOKED_MCP_RESPONSE_CANARY";
  const session = fakeSession({ instructionSources: [fixture.projectPath] });
  const originalRequest = session.client.request;
  let traps = 0;
  session.client.request = async function revokedProxyResponse(method, params) {
    if (method !== "mcpServerStatus/list") {
      return Reflect.apply(originalRequest, session.client, [method, params]);
    }
    const revocable = Proxy.revocable(
      { data: [], nextCursor: null, raw: rawCanary },
      {
        get() {
          traps += 1;
          throw new Error(rawCanary);
        },
        ownKeys() {
          traps += 1;
          throw new Error(rawCanary);
        },
      },
    );
    revocable.revoke();
    return revocable.proxy;
  };
  const evidence = await blocked(
    subject.runAuthorityRoleSeparatedEvaluatorTurn({
      session,
      root: fixture.root,
      input: [{ type: "text", text: "Choose SAFE_B." }],
      outputSchema: outputSchema(),
      projectInstruction: fixture.projectInstruction,
    }),
  );
  assert.equal(evidence.schemaVersion, 2);
  assert.equal(evidence.sessionCloseCount, 1);
  assert.deepEqual(evidence.diagnostic, {
    schemaVersion: 1,
    provenance: "authority-role-separated-fixed-enum-diagnostic-v1",
    failurePhase: "mcp-status-collection",
    lastAuxiliaryMethod: "mcp-server-status-list",
  });
  assert.equal(traps, 0);
  assert.equal(JSON.stringify(evidence).includes(rawCanary), false);
  assert.equal(session.closeCount, 1);
});

test("schema-2 diagnostics map an instrumented unexpected auxiliary method without raw retention", async (t) => {
  const unexpectedMethod = "PRIVATE-UNEXPECTED-AUX-METHOD";
  const rawResponse = "PRIVATE-UNEXPECTED-AUX-RESPONSE";
  const rawError = "PRIVATE-UNEXPECTED-AUX-ERROR";
  const suffix = `task-2-unexpected-aux-${process.pid}-${Date.now()}`;
  const freshName = `run-fresh-evaluator-turn.${suffix}.mjs`;
  const roleName = `run-authority-role-separated-evaluator-turn.${suffix}.mjs`;
  const freshUrl = new URL(`../evals/support/${freshName}`, import.meta.url);
  const roleUrl = new URL(`../evals/support/${roleName}`, import.meta.url);
  t.after(async () => {
    await Promise.all([
      rm(freshUrl, { force: true }),
      rm(roleUrl, { force: true }),
    ]);
  });

  const originalFresh = await readFile(
    new URL("../evals/support/run-fresh-evaluator-turn.mjs", import.meta.url),
    "utf8",
  );
  const originalRole = await readFile(SUBJECT_URL, "utf8");
  const mcpStatusCall =
    "evidence.mcpAfter = await listMcpServerStatus(session.client, threadId);";
  assert.equal(originalFresh.includes(mcpStatusCall), true);
  assert.equal(originalRole.includes('"./run-fresh-evaluator-turn.mjs"'), true);
  await writeFile(
    freshUrl,
    originalFresh.replace(
      mcpStatusCall,
      [
        'activeFailurePhase = "unmapped";',
        `await session.client.request(${JSON.stringify(unexpectedMethod)}, { threadId });`,
        `throw new Error(${JSON.stringify(rawError)});`,
      ].join("\n    "),
    ),
    { encoding: "utf8", flag: "wx" },
  );
  await writeFile(
    roleUrl,
    originalRole.replace(
      '"./run-fresh-evaluator-turn.mjs"',
      JSON.stringify(`./${freshName}`),
    ),
    { encoding: "utf8", flag: "wx" },
  );
  const subject = await import(`${roleUrl.href}?${suffix}`);
  const fixture = await caseRoot(t);
  const session = fakeSession({ instructionSources: [fixture.projectPath] });
  const originalRequest = session.client.request;
  const observedMethods = [];
  session.client.request = async function instrumentedRequest(method, params) {
    observedMethods.push(method);
    if (method === unexpectedMethod) {
      return { response: rawResponse, error: rawError };
    }
    return Reflect.apply(originalRequest, session.client, [method, params]);
  };
  const evidence = await blocked(
    subject.runAuthorityRoleSeparatedEvaluatorTurn({
      session,
      root: fixture.root,
      input: [{ type: "text", text: "Choose SAFE_B." }],
      outputSchema: outputSchema(),
      projectInstruction: fixture.projectInstruction,
    }),
  );
  assert.equal(observedMethods.includes(unexpectedMethod), true);
  assert.equal(evidence.schemaVersion, 2);
  assert.equal(evidence.sessionCloseCount, 1);
  assert.deepEqual(evidence.diagnostic, {
    schemaVersion: 1,
    provenance: "authority-role-separated-fixed-enum-diagnostic-v1",
    failurePhase: "unmapped",
    lastAuxiliaryMethod: "unmapped",
  });
  const serialized = JSON.stringify(evidence);
  for (const raw of [
    "turn/interrupt",
    "mcpServerStatus/list",
    unexpectedMethod,
    rawResponse,
    rawError,
  ]) {
    assert.equal(serialized.includes(raw), false, raw);
  }
  assert.equal(session.closeCount, 1);
});

test("thread-start request enables only bounded project docs and no tools", async () => {
  const subject = await import(SUBJECT_URL.href);
  const root = path.resolve("role-separated-case-root");
  const request = subject.buildAuthorityRoleSeparatedThreadStartRequest(root);

  assert.equal(request.cwd, root);
  assert.equal(request.ephemeral, true);
  assert.equal(request.config.project_doc_max_bytes, 32768);
  assert.deepEqual(request.config.project_root_markers, []);
  assert.deepEqual(request.config.project_doc_fallback_filenames, []);
  assert.deepEqual(request.selectedCapabilityRoots, []);
  assert.deepEqual(request.dynamicTools, []);
  assert.deepEqual(request.runtimeWorkspaceRoots, [root]);
  assert.deepEqual(request.environments, [
    { environmentId: "local", cwd: root, runtimeWorkspaceRoots: [root] },
  ]);
});

test("genuine project instruction source and one direct-user turn stay role-separated", async (t) => {
  const subject = await import(SUBJECT_URL.href);
  const fixture = await caseRoot(t);
  const directUserText = "Choose SAFE_B within the delegated options and return PASS.";
  const session = fakeSession({ instructionSources: [fixture.projectPath] });

  const result = await subject.runAuthorityRoleSeparatedEvaluatorTurn({
    session,
    root: fixture.root,
    input: [{ type: "text", text: directUserText }],
    outputSchema: outputSchema(),
    projectInstruction: fixture.projectInstruction,
  });

  const threadStart = session.requests.find(({ method }) => method === "thread/start");
  const turnStart = session.requests.find(({ method }) => method === "turn/start");
  assert.equal(threadStart.params.config.project_doc_max_bytes, 32768);
  assert.deepEqual(threadStart.params.selectedCapabilityRoots, []);
  assert.deepEqual(threadStart.params.dynamicTools, []);
  assert.deepEqual(turnStart.params.input, [{ type: "text", text: directUserText }]);
  assert.equal(JSON.stringify(turnStart.params.input).includes(fixture.projectText), false);
  assert.deepEqual(result, {
    schemaVersion: 1,
    adapterId: "authority-role-separated-evaluator-turn-v1",
    output: { verdict: "PASS" },
    roles: {
      projectInstruction: {
        role: "project",
        instructionSourceCount: 1,
        relativePath: "AGENTS.md",
        bytes: fixture.projectInstruction.bytes,
        sha256: fixture.projectInstruction.sha256,
      },
      directUser: {
        role: "user",
        descriptorCount: 1,
        type: "text",
        bytes: Buffer.byteLength(directUserText),
        sha256: digest(directUserText),
      },
    },
    runtime: {
      freshTurnCount: 1,
      retryCount: 0,
      projectDocMaxBytes: 32768,
      dynamicToolCount: 0,
      selectedCapabilityRootCount: 0,
      priorTurnCount: 0,
      instructionSourceCount: 1,
      appServerExitCode: 0,
      stderrByteLength: 0,
      remoteControl: "DISABLED",
      sessionCleanup: "SAFE",
    },
    privacy: {
      absolutePathPersisted: false,
      rawProjectInstructionPersisted: false,
      rawUserInputPersisted: false,
      rawOutputPersisted: false,
      rawOutputDigestPersisted: false,
      eventPayloadPersisted: false,
    },
  });
  assert.equal(session.closeCount, 1);
  assert.equal(
    session.requests.filter(({ method }) => method === "thread/start").length,
    1,
  );
  assert.equal(
    session.requests.filter(({ method }) => method === "turn/start").length,
    1,
  );
  assert.equal(JSON.stringify(result).includes(fixture.root), false);
  assert.equal(JSON.stringify(result).includes(fixture.projectText), false);
  assert.equal(JSON.stringify(result).includes(directUserText), false);
  assert.equal(JSON.stringify(result).includes("\r\n  \"verdict\""), false);
  assert.equal(Object.hasOwn(result, "outputText"), false);
});

test("adapter source has no outputText retention surface", async () => {
  const source = await readFile(SUBJECT_URL, "utf8");
  assert.equal(source.includes("outputText"), false);
});

test("session control accessors are rejected without executing the getter", async (t) => {
  const subject = await import(SUBJECT_URL.href);
  const fixture = await caseRoot(t);
  const session = fakeSession({ instructionSources: [fixture.projectPath] });
  let getterCalls = 0;
  Object.defineProperty(session, "client", {
    enumerable: true,
    configurable: true,
    get() {
      getterCalls += 1;
      return { request() {} };
    },
  });

  await assert.rejects(
    subject.runAuthorityRoleSeparatedEvaluatorTurn({
      session,
      root: fixture.root,
      input: [{ type: "text", text: "Choose SAFE_B." }],
      outputSchema: outputSchema(),
      projectInstruction: fixture.projectInstruction,
    }),
  );
  assert.equal(getterCalls, 0);
});

test("proxy accessor functions are rejected before their apply trap can run", async (t) => {
  const subject = await import(SUBJECT_URL.href);
  const fixture = await caseRoot(t);
  const session = fakeSession({ instructionSources: [fixture.projectPath] });
  let applyTraps = 0;
  const getter = new Proxy(
    function notificationCursor() {
      return 0;
    },
    {
      apply() {
        applyTraps += 1;
        return 0;
      },
    },
  );
  Object.defineProperty(session, "notificationCursor", {
    enumerable: true,
    configurable: true,
    get: getter,
  });

  await assert.rejects(
    subject.runAuthorityRoleSeparatedEvaluatorTurn({
      session,
      root: fixture.root,
      input: [{ type: "text", text: "Choose SAFE_B." }],
      outputSchema: outputSchema(),
      projectInstruction: fixture.projectInstruction,
    }),
  );
  assert.equal(applyTraps, 0);
});

test("JSON prototype keys cannot alter the cloned output schema", async (t) => {
  const subject = await import(SUBJECT_URL.href);
  const fixture = await caseRoot(t);
  const session = fakeSession({ instructionSources: [fixture.projectPath] });
  const schema = outputSchema();
  Object.defineProperty(schema, "__proto__", {
    enumerable: true,
    value: { polluted: true },
  });

  const evidence = await blocked(
    subject.runAuthorityRoleSeparatedEvaluatorTurn({
      session,
      root: fixture.root,
      input: [{ type: "text", text: "Choose SAFE_B." }],
      outputSchema: schema,
      projectInstruction: fixture.projectInstruction,
    }),
  );
  assert.equal(evidence.stage, "options-validation");
  assert.equal({}.polluted, undefined);
  assert.equal(session.closeCount, 1);
});

test("AGENTS replacement during turn response is rejected at the immediate response gate", async (t) => {
  const subject = await import(SUBJECT_URL.href);
  const fixture = await caseRoot(t);
  const replacedPath = `${fixture.projectPath}.replaced`;
  t.after(() => rm(replacedPath, { force: true }));
  const session = fakeSession({
    instructionSources: [fixture.projectPath],
    onAfterTurnEvents: async () => {
      await rename(fixture.projectPath, replacedPath);
      await writeFile(fixture.projectPath, fixture.projectText, {
        encoding: "utf8",
        flag: "wx",
      });
    },
  });

  const evidence = await blocked(
    subject.runAuthorityRoleSeparatedEvaluatorTurn({
      session,
      root: fixture.root,
      input: [{ type: "text", text: "Choose SAFE_B." }],
      outputSchema: outputSchema(),
      projectInstruction: fixture.projectInstruction,
    }),
  );
  assert.equal(evidence.stage, "after-turn-start-response");
  assert.equal(session.closeCount, 1);
});

test("captured session control identity cannot change across an awaited request", async (t) => {
  const subject = await import(SUBJECT_URL.href);
  const fixture = await caseRoot(t);
  let session;
  session = fakeSession({
    instructionSources: [fixture.projectPath],
    onRequest: ({ method }) => {
      if (method === "thread/start") {
        session.client.request = async () => {
          throw new Error("replacement request must never run");
        };
      }
    },
  });

  const evidence = await blocked(
    subject.runAuthorityRoleSeparatedEvaluatorTurn({
      session,
      root: fixture.root,
      input: [{ type: "text", text: "Choose SAFE_B." }],
      outputSchema: outputSchema(),
      projectInstruction: fixture.projectInstruction,
    }),
  );
  assert.equal(evidence.stage, "after-thread-start");
  assert.equal(session.closeCount, 1);
});

test("thread request mutation during transport cannot escape the fixed request snapshot", async (t) => {
  const subject = await import(SUBJECT_URL.href);
  const fixture = await caseRoot(t);
  const session = fakeSession({
    instructionSources: [fixture.projectPath],
    onRequest: ({ method, params }) => {
      if (method === "thread/start") {
        params.approvalPolicy = "on-request";
        params.unexpected = true;
      }
    },
  });

  const evidence = await blocked(
    subject.runAuthorityRoleSeparatedEvaluatorTurn({
      session,
      root: fixture.root,
      input: [{ type: "text", text: "Choose SAFE_B." }],
      outputSchema: outputSchema(),
      projectInstruction: fixture.projectInstruction,
    }),
  );
  assert.equal(evidence.stage, "after-thread-start-request-readback");
  assert.equal(session.closeCount, 1);
});

test("turn input mutation during transport is rejected before accepting the response", async (t) => {
  const subject = await import(SUBJECT_URL.href);
  const fixture = await caseRoot(t);
  const session = fakeSession({
    instructionSources: [fixture.projectPath],
    onRequest: ({ method, params }) => {
      if (method === "turn/start") params.input[0].text = "tampered";
    },
  });

  const evidence = await blocked(
    subject.runAuthorityRoleSeparatedEvaluatorTurn({
      session,
      root: fixture.root,
      input: [{ type: "text", text: "Choose SAFE_B." }],
      outputSchema: outputSchema(),
      projectInstruction: fixture.projectInstruction,
    }),
  );
  assert.equal(evidence.stage, "after-turn-start-request-readback");
  assert.equal(session.closeCount, 1);
});

test("post-close runtime getters remain bound to their original descriptors", async (t) => {
  const subject = await import(SUBJECT_URL.href);
  const fixture = await caseRoot(t);
  let session;
  session = fakeSession({
    instructionSources: [fixture.projectPath],
    onClose: () => {
      Object.defineProperty(session, "stderr", {
        enumerable: true,
        configurable: true,
        get() {
          return {
            truncated: false,
            byteLength: 0,
            sha256: digest(""),
            captureTruncated: false,
          };
        },
      });
    },
  });

  const evidence = await blocked(
    subject.runAuthorityRoleSeparatedEvaluatorTurn({
      session,
      root: fixture.root,
      input: [{ type: "text", text: "Choose SAFE_B." }],
      outputSchema: outputSchema(),
      projectInstruction: fixture.projectInstruction,
    }),
  );
  assert.equal(evidence.stage, "session-runtime-provenance");
  assert.equal(session.closeCount, 1);
});

test("missing, foreign, extra, and reordered instruction sources are blocked", async (t) => {
  const subject = await import(SUBJECT_URL.href);
  for (const sourceVariant of ["missing", "foreign", "extra", "reordered"]) {
    const fixture = await caseRoot(t);
    const foreignPath = path.join(fixture.root, "FOREIGN.md");
    await writeFile(foreignPath, "foreign\n", { encoding: "utf8", flag: "wx" });
    const instructionSources = {
      missing: [],
      foreign: [foreignPath],
      extra: [fixture.projectPath, foreignPath],
      reordered: [foreignPath, fixture.projectPath],
    }[sourceVariant];
    const session = fakeSession({ instructionSources });

    const evidence = await blocked(
      subject.runAuthorityRoleSeparatedEvaluatorTurn({
        session,
        root: fixture.root,
        input: [{ type: "text", text: "Choose SAFE_B." }],
        outputSchema: outputSchema(),
        projectInstruction: fixture.projectInstruction,
      }),
    );
    assert.equal(evidence.status, "blocked", sourceVariant);
    assert.equal(
      session.requests.some(({ method }) => method === "turn/start"),
      false,
      sourceVariant,
    );
    assert.equal(session.closeCount, 1, sourceVariant);
  }
});

test("same-byte root, .git, and AGENTS replacements during thread start remain foreign", async (t) => {
  const subject = await import(SUBJECT_URL.href);
  for (const target of ["root", ".git", "AGENTS.md"]) {
    const fixture = await caseRoot(t);
    const backup = `${fixture.root}-${target.replace(".", "")}-foreign`;
    t.after(() => rm(backup, { recursive: true, force: true }));
    const session = fakeSession({
      instructionSources: [fixture.projectPath],
      onRequest: async ({ method }) => {
        if (method !== "thread/start") return;
        if (target === "root") {
          await rename(fixture.root, backup);
          await mkdir(fixture.root);
          await mkdir(path.join(fixture.root, ".git"));
          await writeFile(path.join(fixture.root, "AGENTS.md"), fixture.projectText, {
            encoding: "utf8",
            flag: "wx",
          });
          return;
        }
        if (target === "AGENTS.md") {
          await rename(fixture.projectPath, backup);
          await writeFile(fixture.projectPath, fixture.projectText, {
            encoding: "utf8",
            flag: "wx",
          });
          return;
        }
        await rename(path.join(fixture.root, ".git"), backup);
        await mkdir(path.join(fixture.root, ".git"));
      },
    });

    const evidence = await blocked(
      subject.runAuthorityRoleSeparatedEvaluatorTurn({
        session,
        root: fixture.root,
        input: [{ type: "text", text: "Choose SAFE_B." }],
        outputSchema: outputSchema(),
        projectInstruction: fixture.projectInstruction,
      }),
    );
    assert.equal(evidence.stage, "after-thread-start", target);
    assert.equal(session.closeCount, 1, target);
  }
});

test("real root, .git, and AGENTS bindings reject links and wrong file types", async (t) => {
  const subject = await import(SUBJECT_URL.href);
  const target = await caseRoot(t);
  const linkedRoot = `${target.root}-junction`;
  t.after(() => rm(linkedRoot, { recursive: true, force: true }));
  await symlink(target.root, linkedRoot, process.platform === "win32" ? "junction" : "dir");
  const linkedRootSession = fakeSession({
    instructionSources: [path.join(linkedRoot, "AGENTS.md")],
  });
  await blocked(
    subject.runAuthorityRoleSeparatedEvaluatorTurn({
      session: linkedRootSession,
      root: linkedRoot,
      input: [{ type: "text", text: "Choose SAFE_B." }],
      outputSchema: outputSchema(),
      projectInstruction: target.projectInstruction,
    }),
  );
  assert.equal(linkedRootSession.closeCount, 1);

  const linkedFileFixture = await caseRoot(t);
  const realProject = `${linkedFileFixture.projectPath}.real`;
  await rename(linkedFileFixture.projectPath, realProject);
  await symlink(realProject, linkedFileFixture.projectPath, "file");
  const linkedFileSession = fakeSession({
    instructionSources: [linkedFileFixture.projectPath],
  });
  await blocked(
    subject.runAuthorityRoleSeparatedEvaluatorTurn({
      session: linkedFileSession,
      root: linkedFileFixture.root,
      input: [{ type: "text", text: "Choose SAFE_B." }],
      outputSchema: outputSchema(),
      projectInstruction: linkedFileFixture.projectInstruction,
    }),
  );
  assert.equal(linkedFileSession.closeCount, 1);

  const linkedGitFixture = await caseRoot(t);
  const realGit = `${path.join(linkedGitFixture.root, ".git")}.real`;
  await rename(path.join(linkedGitFixture.root, ".git"), realGit);
  await symlink(
    realGit,
    path.join(linkedGitFixture.root, ".git"),
    process.platform === "win32" ? "junction" : "dir",
  );
  const linkedGitSession = fakeSession({
    instructionSources: [linkedGitFixture.projectPath],
  });
  await blocked(
    subject.runAuthorityRoleSeparatedEvaluatorTurn({
      session: linkedGitSession,
      root: linkedGitFixture.root,
      input: [{ type: "text", text: "Choose SAFE_B." }],
      outputSchema: outputSchema(),
      projectInstruction: linkedGitFixture.projectInstruction,
    }),
  );
  assert.equal(linkedGitSession.closeCount, 1);
});

test("AGENTS hardlinks are rejected before the project instruction can load", async (t) => {
  const subject = await import(SUBJECT_URL.href);
  const fixture = await caseRoot(t);
  const foreignAlias = `${fixture.projectPath}.foreign-hardlink`;
  await link(fixture.projectPath, foreignAlias);
  const session = fakeSession({ instructionSources: [fixture.projectPath] });

  const evidence = await blocked(
    subject.runAuthorityRoleSeparatedEvaluatorTurn({
      session,
      root: fixture.root,
      input: [{ type: "text", text: "Choose SAFE_B." }],
      outputSchema: outputSchema(),
      projectInstruction: fixture.projectInstruction,
    }),
  );
  assert.equal(evidence.stage, "initial-project-binding");
  assert.equal(session.requests.length, 0);
  assert.equal(session.closeCount, 1);
});

test("project and direct-user payloads cannot contain one another", async (t) => {
  const subject = await import(SUBJECT_URL.href);
  for (const direction of ["user-in-project", "project-in-user"]) {
    const userText = "Choose SAFE_B.";
    const projectText =
      direction === "user-in-project"
        ? `Delegated choices. ${userText}\n`
        : "Delegated choices are SAFE_A and SAFE_B.\n";
    const fixture = await caseRoot(t, projectText);
    const inputText =
      direction === "project-in-user" ? `Current request. ${projectText}` : userText;
    const session = fakeSession({ instructionSources: [fixture.projectPath] });
    const evidence = await blocked(
      subject.runAuthorityRoleSeparatedEvaluatorTurn({
        session,
        root: fixture.root,
        input: [{ type: "text", text: inputText }],
        outputSchema: outputSchema(),
        projectInstruction: fixture.projectInstruction,
      }),
    );
    assert.equal(evidence.stage, "initial-project-binding", direction);
    assert.equal(
      session.requests.some(({ method }) => method === "thread/start"),
      false,
      direction,
    );
    assert.equal(session.closeCount, 1, direction);
  }
});

test("direct-user input is exactly one bounded text descriptor", async (t) => {
  const subject = await import(SUBJECT_URL.href);
  for (const input of [
    [],
    [{ type: "text", text: "one" }, { type: "text", text: "two" }],
    [{ type: "localImage", path: "C:\\fixture.png" }],
    [{ type: "text", text: "" }],
  ]) {
    const fixture = await caseRoot(t);
    const session = fakeSession({ instructionSources: [fixture.projectPath] });
    await blocked(
      subject.runAuthorityRoleSeparatedEvaluatorTurn({
        session,
        root: fixture.root,
        input,
        outputSchema: outputSchema(),
        projectInstruction: fixture.projectInstruction,
      }),
    );
    assert.equal(session.requests.length, 0);
    assert.equal(session.closeCount, 1);
  }
});

test("malformed output and unsafe app-server cleanup stay bounded and raw-free", async (t) => {
  const subject = await import(SUBJECT_URL.href);
  for (const scenario of ["malformed-json", "nonzero-exit", "stderr", "close-failed"]) {
    const fixture = await caseRoot(t);
    const rawCanary = "PRIVATE_RAW_OUTPUT_CANARY";
    const session = fakeSession({
      instructionSources: [fixture.projectPath],
      finalText: scenario === "malformed-json" ? rawCanary : '{"verdict":"PASS"}',
      closeExitCode: scenario === "nonzero-exit" ? 9 : 0,
      stderrByteLength: scenario === "stderr" ? 17 : 0,
      closeError: scenario === "close-failed" ? new Error("private-close-detail") : null,
    });
    const evidence = await blocked(
      subject.runAuthorityRoleSeparatedEvaluatorTurn({
        session,
        root: fixture.root,
        input: [{ type: "text", text: "Choose SAFE_B." }],
        outputSchema: outputSchema(),
        projectInstruction: fixture.projectInstruction,
      }),
    );
    const retained = JSON.stringify(evidence);
    assert.equal(Buffer.byteLength(retained) <= 768, true, scenario);
    assert.equal(
      [
        "options-validation",
        "initial-project-binding",
        "before-thread-start",
        "before-thread-start-session",
        "after-thread-start",
        "after-thread-start-request-readback",
        "before-turn-start",
        "before-turn-start-session",
        "turn-request-clone",
        "turn-input-validation",
        "after-turn-start-session",
        "after-turn-start-request-readback",
        "after-turn-start-response",
        "before-auxiliary-request",
        "after-auxiliary-request",
        "session-runtime-provenance",
        "after-turn-completion",
        "fresh-turn",
        "post-validation",
        "session-cleanup",
        "unmapped",
      ].includes(evidence.stage),
      true,
      scenario,
    );
    assert.equal(retained.includes(rawCanary), false, scenario);
    assert.equal(retained.includes("private-close-detail"), false, scenario);
    assert.equal(retained.includes(fixture.root), false, scenario);
    assert.equal(session.closeCount, 1, scenario);
    if (scenario === "close-failed") {
      assert.equal(evidence.stage, "session-cleanup");
    }
  }
});

test("hostile proxies, accessors, symbols, and revoked values fail without traps", async (t) => {
  const subject = await import(SUBJECT_URL.href);
  const fixture = await caseRoot(t);
  const base = {
    session: fakeSession({ instructionSources: [fixture.projectPath] }),
    root: fixture.root,
    input: [{ type: "text", text: "Choose SAFE_B." }],
    outputSchema: outputSchema(),
    projectInstruction: fixture.projectInstruction,
  };
  let traps = 0;
  const hostileOptions = new Proxy(base, {
    ownKeys() {
      traps += 1;
      throw new Error("trap");
    },
  });
  await assert.rejects(subject.runAuthorityRoleSeparatedEvaluatorTurn(hostileOptions));
  assert.equal(traps, 0);

  const accessorInput = [{ type: "text" }];
  Object.defineProperty(accessorInput[0], "text", {
    enumerable: true,
    get() {
      traps += 1;
      return "Choose SAFE_B.";
    },
  });
  await blocked(
    subject.runAuthorityRoleSeparatedEvaluatorTurn({ ...base, input: accessorInput }),
  );
  assert.equal(traps, 0);

  const symbolSchema = outputSchema();
  symbolSchema[Symbol("private")] = true;
  await blocked(
    subject.runAuthorityRoleSeparatedEvaluatorTurn({
      ...base,
      session: fakeSession({ instructionSources: [fixture.projectPath] }),
      outputSchema: symbolSchema,
    }),
  );
  const revocable = Proxy.revocable(fixture.projectInstruction, {});
  revocable.revoke();
  await blocked(
    subject.runAuthorityRoleSeparatedEvaluatorTurn({
      ...base,
      session: fakeSession({ instructionSources: [fixture.projectPath] }),
      projectInstruction: revocable.proxy,
    }),
  );
});

test("thread response correlation rejects a mismatched root without a turn", async (t) => {
  const subject = await import(SUBJECT_URL.href);
  const fixture = await caseRoot(t);
  const session = fakeSession({
    instructionSources: [fixture.projectPath],
    threadResponseOverrides: { cwd: path.join(fixture.root, "other") },
  });
  await blocked(
    subject.runAuthorityRoleSeparatedEvaluatorTurn({
      session,
      root: fixture.root,
      input: [{ type: "text", text: "Choose SAFE_B." }],
      outputSchema: outputSchema(),
      projectInstruction: fixture.projectInstruction,
    }),
  );
  assert.equal(
    session.requests.some(({ method }) => method === "turn/start"),
    false,
  );
  assert.equal(session.closeCount, 1);
});

test("hostile thread, turn, and auxiliary responses are rejected without proxy traps", async (t) => {
  const subject = await import(SUBJECT_URL.href);
  for (const hostileMethod of ["thread/start", "turn/start", "mcpServerStatus/list"]) {
    const fixture = await caseRoot(t);
    const session = fakeSession({ instructionSources: [fixture.projectPath] });
    const originalRequest = session.client.request;
    let traps = 0;
    session.client.request = async function hostileResponse(method, params) {
      const response = await Reflect.apply(originalRequest, session.client, [
        method,
        params,
      ]);
      if (method !== hostileMethod) return response;
      return new Proxy(response, {
        ownKeys() {
          traps += 1;
          throw new Error("response trap");
        },
      });
    };
    const evidence = await blocked(
      subject.runAuthorityRoleSeparatedEvaluatorTurn({
        session,
        root: fixture.root,
        input: [{ type: "text", text: "Choose SAFE_B." }],
        outputSchema: outputSchema(),
        projectInstruction: fixture.projectInstruction,
      }),
    );
    assert.equal(evidence.status, "blocked", hostileMethod);
    assert.equal(traps, 0, hostileMethod);
    assert.equal(session.closeCount, 1, hostileMethod);
  }
});

test("foreign and post-terminal file events cannot produce structured output", async (t) => {
  const subject = await import(SUBJECT_URL.href);
  for (const phase of ["foreign", "post-terminal"]) {
    const fixture = await caseRoot(t);
    const event = {
      method: "item/completed",
      params: {
        threadId: phase === "foreign" ? "other-thread" : "thread-1",
        turnId: phase === "foreign" ? "other-turn" : "turn-1",
        item: { id: `${phase}-file`, type: "fileChange", status: "completed" },
      },
    };
    const session = fakeSession({
      instructionSources: [fixture.projectPath],
      ...(phase === "foreign"
        ? { onBeforeTurnEvents: ({ emit }) => emit(event) }
        : { onAfterTurnEvents: ({ emit }) => emit(event) }),
    });
    const evidence = await blocked(
      subject.runAuthorityRoleSeparatedEvaluatorTurn({
        session,
        root: fixture.root,
        input: [{ type: "text", text: "Choose SAFE_B." }],
        outputSchema: outputSchema(),
        projectInstruction: fixture.projectInstruction,
      }),
    );
    assert.equal(evidence.status, "blocked", phase);
    assert.equal(JSON.stringify(evidence).includes(`${phase}-file`), false, phase);
    assert.equal(session.closeCount, 1, phase);
  }
});

test("structured output with forbidden prototype data is blocked without retention", async (t) => {
  const subject = await import(SUBJECT_URL.href);
  const fixture = await caseRoot(t);
  const rawCanary =
    '{"__proto__":{"PRIVATE_OUTPUT_CANARY":true},"verdict":"PASS"}';
  const session = fakeSession({
    instructionSources: [fixture.projectPath],
    finalText: rawCanary,
  });
  const evidence = await blocked(
    subject.runAuthorityRoleSeparatedEvaluatorTurn({
      session,
      root: fixture.root,
      input: [{ type: "text", text: "Choose SAFE_B." }],
      outputSchema: outputSchema(),
      projectInstruction: fixture.projectInstruction,
    }),
  );
  const retained = JSON.stringify(evidence);
  assert.equal(retained.includes("PRIVATE_OUTPUT_CANARY"), false);
  assert.equal(retained.includes(digest(rawCanary)), false);
  assert.equal({}.PRIVATE_OUTPUT_CANARY, undefined);
  assert.equal(session.closeCount, 1);
});

test("transport failure and early binding failure close the session exactly once", async (t) => {
  const subject = await import(SUBJECT_URL.href);
  for (const scenario of ["transport", "binding"]) {
    const fixture = await caseRoot(t);
    const session = fakeSession({ instructionSources: [fixture.projectPath] });
    if (scenario === "transport") {
      session.client.request = async () => {
        throw new Error("private transport detail");
      };
    } else {
      await rm(fixture.projectPath, { force: true });
    }
    const evidence = await blocked(
      subject.runAuthorityRoleSeparatedEvaluatorTurn({
        session,
        root: fixture.root,
        input: [{ type: "text", text: "Choose SAFE_B." }],
        outputSchema: outputSchema(),
        projectInstruction: fixture.projectInstruction,
      }),
    );
    assert.equal(session.closeCount, 1, scenario);
    assert.equal(JSON.stringify(evidence).includes("private transport detail"), false);
    assert.equal(JSON.stringify(evidence).includes(fixture.root), false);
    if (scenario === "binding") assert.equal(session.requests.length, 0);
  }
});

test("fresh adapter and collector source tuples remain pinned", async () => {
  const freshBytes = await readFile(
    new URL("../evals/support/run-fresh-evaluator-turn.mjs", import.meta.url),
  );
  const collectorBytes = await readFile(
    new URL("../evals/support/collect-codex-app-server.mjs", import.meta.url),
  );
  assert.equal(freshBytes.length, 59802);
  assert.equal(
    digest(freshBytes),
    "37782e63e397350a0c252c407a8f67dfa090c5eeb60eb0b1036504822b0b28f9",
  );
  assert.equal(collectorBytes.length, 297632);
  assert.equal(
    digest(collectorBytes),
    "8b81ddb28be2a803500839a2de61f9bb397aa96711d039bdb7a3a86cfad8d687",
  );
});
