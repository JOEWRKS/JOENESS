import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const MODULE_URL = new URL(
  "../evals/support/run-fresh-evaluator-turn.mjs",
  import.meta.url,
);

const SYNTHETIC_TOKEN_SHAPES = Object.freeze([
  "sk-SYNTHETIC_TEST_ONLY_abcdefghijklmnop",
  "sk-proj-SYNTHETIC_TEST_ONLY_abcdefghijklmnop",
  "sk-svcacct-SYNTHETIC_TEST_ONLY_abcdefghijklmnop",
  "ghp_SYNTHETIC_TEST_ONLY_abcdefghijklmnop",
  "github_pat_SYNTHETIC_TEST_ONLY_abcdefghijklmnop",
  "AKIASYNTHETICTEST000",
  "eyJSYNTHETIC0.eyJSYNTHETIC1.SYNTHETICSIGNATURE",
]);

async function loadSubject() {
  try {
    return await import(MODULE_URL.href);
  } catch {
    return null;
  }
}

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function outputSchema() {
  return {
    type: "object",
    properties: {
      verdict: { type: "string", enum: ["PASS", "FAIL"] },
    },
    required: ["verdict"],
    additionalProperties: false,
  };
}

function dynamicTool() {
  return {
    type: "function",
    name: "fixture-read",
    description: "Read one controlled fixture value.",
    inputSchema: {
      type: "object",
      properties: { key: { type: "string", enum: ["alpha"] } },
      required: ["key"],
      additionalProperties: false,
    },
    deferLoading: false,
  };
}

function successfulImageViewItem(id, matchedInputIndex = 1) {
  return {
    id,
    matchedInputIndex,
    eventCount: 2,
    startedCount: 1,
    completedCount: 1,
    complete: true,
  };
}

function successfulImageViewSnapshot(items, overrides = {}) {
  return {
    complete: true,
    eventCount: items.length * 2,
    completedCount: items.length,
    items,
    blockers: [],
    privacy: {
      rawPathPersisted: false,
      pathDigestPersisted: false,
      rawDiagnosticDigestPersisted: false,
    },
    ...overrides,
  };
}

function createSession({
  finalText = '{"verdict":"PASS"}',
  priorTurns = [],
  instructionSources = [],
  foreignEvent = false,
  lateForbiddenEvent = false,
  lateAgentMessage = null,
  dynamicLifecycleMismatch = false,
  duplicateTerminal = false,
  omitTerminal = false,
  omitAgentMessage = false,
  closeExitCode = 0,
  stderrByteLength = 0,
  stderrDiagnostic = null,
  remoteControlSnapshot = {
    seen: true,
    complete: true,
    status: "disabled",
    environmentAttached: false,
  },
  runDynamicTool = false,
  onThreadStart = null,
  releaseToolThrows = false,
  unsubscribeThrows = false,
  unsubscribeRejects = false,
  onUnsubscribe = null,
  remoteSnapshotThrowsOnRead = null,
  runtimeError = null,
  mcpAfterError = null,
  mcpInventory = [],
  mcpAfterResponse = { data: [], nextCursor: null },
  closeError = null,
  provideImageBinder = true,
  imageDiagnostics = null,
  successfulImageViews = null,
  onBindLocalImageDiagnostics = null,
  onTurnCompleted = null,
  onClose = null,
  onBeforeThreadStartResponse = null,
  onBeforeAgentMessage = null,
  onAfterAgentMessage = null,
  turnStartError = null,
} = {}) {
  const listeners = new Set();
  const requests = [];
  const operations = [];
  const imageBindings = [];
  let toolHandler = null;
  let processExitCode = null;
  let closed = false;
  let remoteSnapshotReadCount = 0;

  function emit(notification) {
    for (const listener of listeners) listener(notification);
  }

  const session = {
    requests,
    operations,
    imageBindings,
    notificationCursor: 0,
    mcpInventory: structuredClone(mcpInventory),
    get remoteControlSnapshot() {
      remoteSnapshotReadCount += 1;
      if (remoteSnapshotReadCount === remoteSnapshotThrowsOnRead) {
        throw new Error("fixture remote-control snapshot failed");
      }
      return remoteControlSnapshot;
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
        ...(stderrDiagnostic === null ? {} : { diagnostic: stderrDiagnostic }),
      };
    },
    get imageDiagnostics() {
      if (imageBindings.length === 0) return null;
      return structuredClone(
        imageDiagnostics ?? {
          status: "NO_ROUTER_IMAGE_ERROR",
          observationCount: 0,
          expectedTargetCount: imageBindings[0].images.length,
          effectivePathMatch: "UNVERIFIED",
          matchedInputIndex: null,
          effectivePathAbsolute: "UNVERIFIED",
          effectivePathWithinRoot: "UNVERIFIED",
          modelArgumentAbsolute: "UNVERIFIED",
          outerCategory: "UNVERIFIED",
          reportedCategory: "UNVERIFIED",
          privacy: {
            rawPathPersisted: false,
            pathDigestPersisted: false,
            rawDiagnosticDigestPersisted: false,
          },
        },
      );
    },
    get successfulImageViews() {
      if (imageBindings.length === 0) return null;
      return structuredClone(
        successfulImageViews ?? {
          complete: true,
          eventCount: 0,
          completedCount: 0,
          items: [],
          blockers: [],
          privacy: {
            rawPathPersisted: false,
            pathDigestPersisted: false,
            rawDiagnosticDigestPersisted: false,
          },
        },
      );
    },
    client: {
      async request(method, params) {
        operations.push(method);
        requests.push({ method, params: structuredClone(params) });
        if (method === "thread/start") {
          await onThreadStart?.(params);
          emit({
            method: "thread/started",
            params: { thread: { id: "fresh-thread" } },
          });
          await onBeforeThreadStartResponse?.({ emit, params });
          return {
            thread: {
              id: "fresh-thread",
              cwd: params.cwd,
              ephemeral: true,
              modelProvider: "fixture-provider",
              turns: structuredClone(priorTurns),
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
          };
        }
        if (method === "turn/start") {
          if (turnStartError !== null) throw turnStartError;
          emit({
            method: "turn/started",
            params: {
              threadId: params.threadId,
              turn: { id: "fresh-turn" },
            },
          });
          if (runtimeError !== null) {
            emit({
              method: "error",
              params: {
                threadId: params.threadId,
                turnId: "fresh-turn",
                error: runtimeError,
              },
            });
          }
          if (foreignEvent) {
            emit({
              method: "item/started",
              params: {
                threadId: "other-thread",
                turnId: "other-turn",
                item: { id: "foreign-reasoning", type: "reasoning" },
              },
            });
          }
          if (runDynamicTool) {
            const controlledArguments = { key: "alpha" };
            const lifecycleArguments = dynamicLifecycleMismatch
              ? { key: "tampered" }
              : controlledArguments;
            emit({
              method: "item/started",
              params: {
                threadId: params.threadId,
                turnId: "fresh-turn",
                item: {
                  id: "call-1",
                  type: "dynamicToolCall",
                  tool: "fixture-read",
                  arguments: lifecycleArguments,
                  status: "inProgress",
                },
              },
            });
            const response = await toolHandler({
              method: "item/tool/call",
              params: {
                threadId: params.threadId,
                turnId: "fresh-turn",
                callId: "call-1",
                tool: "fixture-read",
                arguments: controlledArguments,
              },
            });
            emit({
              method: "item/completed",
              params: {
                threadId: params.threadId,
                turnId: "fresh-turn",
                item: {
                  id: "call-1",
                  type: "dynamicToolCall",
                  tool: "fixture-read",
                  arguments: lifecycleArguments,
                  status: "completed",
                  success: true,
                  contentItems: response.contentItems,
                },
              },
            });
          }
          await onBeforeAgentMessage?.({ emit, params, turnId: "fresh-turn" });
          if (!omitAgentMessage) {
            emit({
              method: "item/completed",
              params: {
                threadId: params.threadId,
                turnId: "fresh-turn",
                item: {
                  id: "final-message",
                  type: "agentMessage",
                  text: finalText,
                },
              },
            });
          }
          await onAfterAgentMessage?.({ emit, params, turnId: "fresh-turn" });
          if (!omitTerminal) {
            const terminal = {
              method: "turn/completed",
              params: {
                threadId: params.threadId,
                turn: { id: "fresh-turn", status: "completed" },
              },
            };
            emit(terminal);
            if (duplicateTerminal) emit(terminal);
          }
          await onTurnCompleted?.({ emit, params, imageBindings });
          return { turn: { id: "fresh-turn", status: "inProgress" } };
        }
        if (method === "turn/interrupt") return {};
        if (method === "mcpServerStatus/list") {
          if (mcpAfterError !== null) throw mcpAfterError;
          return structuredClone(mcpAfterResponse);
        }
        throw new Error(`unexpected request: ${method}`);
      },
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        onUnsubscribe?.({ emit, listener });
        if (unsubscribeThrows) {
          throw new Error("fixture unsubscribe failed");
        }
        if (unsubscribeRejects) {
          return Promise.reject(new Error("fixture async unsubscribe failed"));
        }
      };
    },
    setDynamicToolHandler(handler) {
      assert.equal(toolHandler, null);
      toolHandler = handler;
      return () => {
        toolHandler = null;
        if (releaseToolThrows) {
          throw new Error("fixture dynamic-tool release failed");
        }
      };
    },
    async close() {
      operations.push("close");
      if (lateForbiddenEvent) {
        emit({
          method: "item/completed",
          params: {
            threadId: "fresh-thread",
            turnId: "fresh-turn",
            item: {
              id: "late-file-change",
              type: "fileChange",
              status: "completed",
            },
          },
        });
      }
      if (lateAgentMessage !== null) {
        emit({
          method: "item/completed",
          params: {
            threadId: "fresh-thread",
            turnId: "fresh-turn",
            item: {
              id: "late-agent-message",
              type: "agentMessage",
              text: lateAgentMessage,
            },
          },
        });
      }
      await onClose?.();
      if (closeError !== null) throw closeError;
      processExitCode = closeExitCode;
      closed = true;
    },
    get closed() {
      return closed;
    },
  };
  if (provideImageBinder) {
    session.bindLocalImageDiagnostics = async (binding) => {
      operations.push("bindLocalImageDiagnostics");
      imageBindings.push(structuredClone(binding));
      await onBindLocalImageDiagnostics?.(binding);
    };
  }
  return session;
}

async function createRoot(t) {
  const root = await mkdtemp(path.join(tmpdir(), "joeness-fresh-evaluator-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

async function rejectedEvidence(promise) {
  let observed;
  await assert.rejects(promise, (error) => {
    observed = error;
    return error?.freshEvaluatorEvidence !== undefined;
  });
  return observed.freshEvaluatorEvidence;
}

async function rejectedFailure(promise) {
  let observed;
  await assert.rejects(promise, (error) => {
    observed = error;
    return error?.freshEvaluatorEvidence !== undefined;
  });
  return observed;
}

function emitAgentDelta(emit, {
  threadId = "fresh-thread",
  turnId = "fresh-turn",
  itemId,
  delta,
  extraParams = {},
}) {
  emit({
    method: "item/agentMessage/delta",
    params: { threadId, turnId, itemId, delta, ...extraParams },
  });
}

function emitAgentCompletion(emit, {
  threadId = "fresh-thread",
  turnId = "fresh-turn",
  itemId,
  text,
}) {
  emit({
    method: "item/completed",
    params: {
      threadId,
      turnId,
      item: { id: itemId, type: "agentMessage", text },
    },
  });
}

test("fresh evaluator compacts 1952 safe agent-message fragments into one retained event", async (t) => {
  const subject = await loadSubject();
  assert.equal(typeof subject?.runFreshEvaluatorTurn, "function");
  const root = await createRoot(t);
  const prefix = '{"verdict":"PASS"}';
  const finalText = `${prefix}${" ".repeat(1952 - prefix.length)}`;
  const session = createSession({
    finalText,
    onBeforeAgentMessage: ({ emit, params, turnId }) => {
      for (const delta of finalText) {
        emit({
          method: "item/agentMessage/delta",
          params: {
            threadId: params.threadId,
            turnId,
            itemId: "final-message",
            delta,
          },
        });
      }
    },
  });

  const result = await subject.runFreshEvaluatorTurn({
    session,
    root,
    input: [{ type: "text", text: "Return the JSON verdict." }],
    outputSchema: outputSchema(),
  });

  assert.deepEqual(result.output, { verdict: "PASS" });
  assert.equal(result.events.length, 5);
  const delta = result.events.find(({ method }) => method === "item/agentMessage/delta");
  assert.deepEqual(delta.messageDelta, {
    itemId: "final-message",
    count: 1952,
    byteLength: 1952,
    sha256: digest(finalText),
  });
  assert.deepEqual(result.eventCompaction, {
    observedEventCount: 1956,
    retainedEventCount: 5,
    retainedEventLimit: 512,
    retainedEventsOverLimit: false,
    methodHistogram: {
      eventCount: 1956,
      entries: [
        { method: "item/agentMessage/delta", count: 1952 },
        { method: "item/completed", count: 1 },
        { method: "thread/started", count: 1 },
        { method: "turn/completed", count: 1 },
        { method: "turn/started", count: 1 },
      ],
    },
    itemTypeHistogram: {
      eventCount: 1,
      entries: [{ itemType: "agentMessage", count: 1 }],
    },
    agentMessageDelta: {
      groupCount: 1,
      fragmentCount: 1952,
      byteLength: 1952,
      fragmentLimit: 4096,
      byteLimit: 1048576,
      fragmentLimitExceeded: false,
      byteLimitExceeded: false,
      rawTextRetained: false,
    },
    normalizerBlocker: {
      provenance: "adapter-normalization-fixed-enum",
      classification: "none",
    },
    rawPayloadRetained: false,
  });
  assert.equal(JSON.stringify(result.eventCompaction).includes(finalText), false);
});

test("fresh evaluator normalizer blocker compaction records none for a normal turn", async (t) => {
  const subject = await loadSubject();
  const root = await createRoot(t);
  const result = await subject.runFreshEvaluatorTurn({
    session: createSession(),
    root,
    input: [{ type: "text", text: "Return the JSON verdict." }],
    outputSchema: outputSchema(),
  });

  assert.deepEqual(result.eventCompaction.normalizerBlocker, {
    provenance: "adapter-normalization-fixed-enum",
    classification: "none",
  });
});

test("fresh evaluator normalizer blocker compaction classifies an error notification", async (t) => {
  const subject = await loadSubject();
  const root = await createRoot(t);
  const evidence = await rejectedEvidence(subject.runFreshEvaluatorTurn({
    session: createSession({
      runtimeError: { message: "fixture runtime failure" },
    }),
    root,
    input: [{ type: "text", text: "Return the JSON verdict." }],
    outputSchema: outputSchema(),
  }));

  assert.deepEqual(evidence.eventCompaction.normalizerBlocker, {
    provenance: "adapter-normalization-fixed-enum",
    classification: "runtime-error",
  });
});

test("fresh evaluator normalizer blocker compaction classifies a hook notification", async (t) => {
  const subject = await loadSubject();
  const root = await createRoot(t);
  const rawMessage = "NORMALIZER_HOOK_MESSAGE_CANARY";
  const rawPath = "C:\\NORMALIZER_HOOK_PATH_CANARY\\hook.json";
  const credential = "sk-SYNTHETIC_TEST_ONLY_abcdefghijklmnop";
  const evidence = await rejectedEvidence(subject.runFreshEvaluatorTurn({
    session: createSession({
      onBeforeAgentMessage: ({ emit, params, turnId }) => {
        emit({
          method: "hook/started",
          params: {
            threadId: params.threadId,
            turnId,
            message: rawMessage,
            path: rawPath,
            credential,
          },
        });
      },
    }),
    root,
    input: [{ type: "text", text: "Return the JSON verdict." }],
    outputSchema: outputSchema(),
  }));

  assert.deepEqual(evidence.eventCompaction.normalizerBlocker, {
    provenance: "adapter-normalization-fixed-enum",
    classification: "hook-executed",
  });
  const serialized = JSON.stringify(evidence.eventCompaction);
  for (const canary of [rawMessage, rawPath, credential]) {
    assert.equal(serialized.includes(canary), false, canary);
  }
});

test("fresh evaluator normalizer blocker compaction classifies distinct fixed codes as multiple", async (t) => {
  const subject = await loadSubject();
  const root = await createRoot(t);
  const evidence = await rejectedEvidence(subject.runFreshEvaluatorTurn({
    session: createSession({
      runtimeError: { message: "fixture runtime failure" },
      onBeforeAgentMessage: ({ emit, params, turnId }) => {
        emit({
          method: "warning",
          params: { threadId: params.threadId, turnId },
        });
      },
    }),
    root,
    input: [{ type: "text", text: "Return the JSON verdict." }],
    outputSchema: outputSchema(),
  }));

  assert.deepEqual(evidence.eventCompaction.normalizerBlocker, {
    provenance: "adapter-normalization-fixed-enum",
    classification: "multiple",
  });
});

test("fresh evaluator normalizer blocker compaction never serializes raw notification details", async (t) => {
  const subject = await loadSubject();
  const root = await createRoot(t);
  const rawMessage = "NORMALIZER_RAW_MESSAGE_CANARY";
  const rawPath = "C:\\NORMALIZER_RAW_PATH_CANARY\\input.json";
  const credential = "sk-SYNTHETIC_TEST_ONLY_abcdefghijklmnop";
  const evidence = await rejectedEvidence(subject.runFreshEvaluatorTurn({
    session: createSession({
      runtimeError: {
        message: rawMessage,
        additionalDetails: `${rawPath} Bearer ${credential}`,
      },
    }),
    root,
    input: [{ type: "text", text: "Return the JSON verdict." }],
    outputSchema: outputSchema(),
  }));

  assert.deepEqual(evidence.eventCompaction.normalizerBlocker, {
    provenance: "adapter-normalization-fixed-enum",
    classification: "runtime-error",
  });
  const serialized = JSON.stringify(evidence.eventCompaction);
  for (const canary of [rawMessage, rawPath, credential]) {
    assert.equal(serialized.includes(canary), false, canary);
  }
});

test("fresh evaluator counts queued notifications once and retains compaction on failure", async (t) => {
  const subject = await loadSubject();
  const root = await createRoot(t);
  const queuedSession = createSession({
    onBeforeThreadStartResponse: ({ emit }) => {
      const queuedNotification = {
        method: "thread/status/changed",
        params: {
          threadId: "fresh-thread",
          status: { type: "active", activeFlags: [] },
        },
      };
      emit(queuedNotification);
      queuedNotification.method = "error";
      queuedNotification.params = {
        threadId: "mutated-thread",
        error: { message: "must not be observed" },
      };
    },
  });
  const queued = await subject.runFreshEvaluatorTurn({
    session: queuedSession,
    root,
    input: [{ type: "text", text: "Return the JSON verdict." }],
    outputSchema: outputSchema(),
  });
  assert.equal(queued.eventCompaction.observedEventCount, 5);
  assert.equal(queued.eventCompaction.retainedEventCount, 5);
  assert.equal(queued.eventCompaction.methodHistogram.eventCount, 5);
  assert.equal(
    queued.eventCompaction.methodHistogram.entries.reduce((sum, entry) => sum + entry.count, 0),
    5,
  );
  assert.deepEqual(
    queued.eventCompaction.methodHistogram.entries.find(
      ({ method }) => method === "thread/status/changed",
    ),
    { method: "thread/status/changed", count: 1 },
  );
  assert.equal(
    queued.eventCompaction.methodHistogram.entries.some(({ method }) => method === "error"),
    false,
  );

  const failed = await rejectedEvidence(subject.runFreshEvaluatorTurn({
    session: createSession({ runtimeError: { message: "fixture runtime error" } }),
    root,
    input: [{ type: "text", text: "Return the JSON verdict." }],
    outputSchema: outputSchema(),
  }));
  assert.equal(failed.eventCompaction.observedEventCount, 5);
  assert.equal(failed.eventCompaction.retainedEventCount, 5);
  assert.equal(failed.eventCompaction.rawPayloadRetained, false);
  assert.deepEqual(
    failed.eventCompaction.methodHistogram.entries.find(({ method }) => method === "error"),
    { method: "error", count: 1 },
  );
});

test("fresh evaluator compacts interleaved agent-message groups and closes each exact lifecycle", async (t) => {
  const subject = await loadSubject();
  const root = await createRoot(t);
  const auxiliaryText = "αβ";
  const finalText = '{"verdict":"PASS"}';
  const result = await subject.runFreshEvaluatorTurn({
    session: createSession({
      finalText,
      onBeforeAgentMessage: ({ emit, params, turnId }) => {
        emitAgentDelta(emit, {
          threadId: params.threadId,
          turnId,
          itemId: "aux-message",
          delta: "α",
        });
        emitAgentDelta(emit, {
          threadId: params.threadId,
          turnId,
          itemId: "final-message",
          delta: '{"verdict":',
        });
        emitAgentDelta(emit, {
          threadId: params.threadId,
          turnId,
          itemId: "aux-message",
          delta: "β",
        });
        emitAgentDelta(emit, {
          threadId: params.threadId,
          turnId,
          itemId: "final-message",
          delta: '"PASS"}',
        });
        emitAgentCompletion(emit, {
          threadId: params.threadId,
          turnId,
          itemId: "aux-message",
          text: auxiliaryText,
        });
      },
    }),
    root,
    input: [{ type: "text", text: "Return the JSON verdict." }],
    outputSchema: outputSchema(),
  });

  const deltas = result.events.filter(({ method }) => method === "item/agentMessage/delta");
  assert.deepEqual(deltas.map(({ messageDelta }) => messageDelta), [
    {
      itemId: "aux-message",
      count: 2,
      byteLength: Buffer.byteLength(auxiliaryText, "utf8"),
      sha256: digest(auxiliaryText),
    },
    {
      itemId: "final-message",
      count: 2,
      byteLength: Buffer.byteLength(finalText, "utf8"),
      sha256: digest(finalText),
    },
  ]);
  const auxiliaryCompletionIndex = result.events.findIndex(
    ({ item }) => item?.id === "aux-message",
  );
  const finalCompletionIndex = result.events.findIndex(
    ({ item }) => item?.id === "final-message",
  );
  assert.equal(result.events.indexOf(deltas[0]) < auxiliaryCompletionIndex, true);
  assert.equal(result.events.indexOf(deltas[1]) < finalCompletionIndex, true);
  assert.deepEqual(result.eventCompaction.agentMessageDelta, {
    groupCount: 2,
    fragmentCount: 4,
    byteLength:
      Buffer.byteLength(auxiliaryText, "utf8") + Buffer.byteLength(finalText, "utf8"),
    fragmentLimit: 4096,
    byteLimit: 1048576,
    fragmentLimitExceeded: false,
    byteLimitExceeded: false,
    rawTextRetained: false,
  });
});

test("fresh evaluator counts an empty agent-message fragment", async (t) => {
  const subject = await loadSubject();
  const root = await createRoot(t);
  const finalText = '{"verdict":"PASS"}';
  const result = await subject.runFreshEvaluatorTurn({
    session: createSession({
      finalText,
      onBeforeAgentMessage: ({ emit, params, turnId }) => {
        emitAgentDelta(emit, {
          threadId: params.threadId,
          turnId,
          itemId: "final-message",
          delta: "",
        });
        emitAgentDelta(emit, {
          threadId: params.threadId,
          turnId,
          itemId: "final-message",
          delta: finalText,
        });
      },
    }),
    root,
    input: [{ type: "text", text: "Return the JSON verdict." }],
    outputSchema: outputSchema(),
  });

  const delta = result.events.find(({ method }) => method === "item/agentMessage/delta");
  assert.deepEqual(delta.messageDelta, {
    itemId: "final-message",
    count: 2,
    byteLength: Buffer.byteLength(finalText, "utf8"),
    sha256: digest(finalText),
  });
  assert.equal(result.eventCompaction.agentMessageDelta.fragmentCount, 2);
});

test("fresh evaluator rejects incomplete or inconsistent agent-message delta lifecycles", async (t) => {
  const subject = await loadSubject();
  const scenarios = [
    ["missing completion", ({ emit, params, turnId }) => {
      emitAgentDelta(emit, {
        threadId: params.threadId,
        turnId,
        itemId: "aux-message",
        delta: "alpha",
      });
    }],
    ["completion before delta", ({ emit, params, turnId }) => {
      emitAgentCompletion(emit, {
        threadId: params.threadId,
        turnId,
        itemId: "aux-message",
        text: "alpha",
      });
      emitAgentDelta(emit, {
        threadId: params.threadId,
        turnId,
        itemId: "aux-message",
        delta: "alpha",
      });
    }],
    ["duplicate completion", ({ emit, params, turnId }) => {
      emitAgentDelta(emit, {
        threadId: params.threadId,
        turnId,
        itemId: "aux-message",
        delta: "alpha",
      });
      for (let index = 0; index < 2; index += 1) {
        emitAgentCompletion(emit, {
          threadId: params.threadId,
          turnId,
          itemId: "aux-message",
          text: "alpha",
        });
      }
    }],
    ["hash mismatch", ({ emit, params, turnId }) => {
      emitAgentDelta(emit, {
        threadId: params.threadId,
        turnId,
        itemId: "aux-message",
        delta: "alpha",
      });
      emitAgentCompletion(emit, {
        threadId: params.threadId,
        turnId,
        itemId: "aux-message",
        text: "bravo",
      });
    }],
  ];

  for (const [name, onBeforeAgentMessage] of scenarios) {
    await t.test(name, async (scenario) => {
      const root = await createRoot(scenario);
      const evidence = await rejectedEvidence(subject.runFreshEvaluatorTurn({
        session: createSession({ onBeforeAgentMessage }),
        root,
        input: [{ type: "text", text: "Return the JSON verdict." }],
        outputSchema: outputSchema(),
      }));
      assert.equal(
        evidence.blockers.includes("message-delta-lifecycle-mismatch"),
        true,
      );
      assert.equal(
        evidence.events.some(({ blockers = [] }) =>
          blockers.includes("message-delta-lifecycle-mismatch")),
        true,
      );
    });
  }
});

test("fresh evaluator detects a split credential without retaining raw delta text", async (t) => {
  const subject = await loadSubject();
  const root = await createRoot(t);
  const fragments = ["ghp_SYNTHETIC_TEST_", "ONLY_abcdefghijklmnop"];
  const canary = fragments.join("");
  const evidence = await rejectedEvidence(subject.runFreshEvaluatorTurn({
    session: createSession({
      finalText: canary,
      onBeforeAgentMessage: ({ emit, params, turnId }) => {
        for (const [index, delta] of fragments.entries()) {
          emitAgentDelta(emit, {
            threadId: params.threadId,
            turnId,
            itemId: index === 0 ? "aux-message" : "final-message",
            delta,
          });
        }
      },
    }),
    root,
    input: [{ type: "text", text: "Return the JSON verdict." }],
    outputSchema: outputSchema(),
  }));

  const serialized = JSON.stringify(evidence);
  assert.equal(evidence.blockers.includes("secret-shaped-output"), true);
  assert.equal(evidence.eventCompaction.agentMessageDelta.fragmentCount, 2);
  assert.equal(evidence.eventCompaction.agentMessageDelta.rawTextRetained, false);
  assert.equal(serialized.includes(canary), false);
  for (const fragment of fragments) assert.equal(serialized.includes(fragment), false);
});

test("fresh evaluator accepts 4096 delta fragments and rejects fragment 4097", async (t) => {
  const subject = await loadSubject();
  for (const [fragmentCount, shouldReject] of [[4096, false], [4097, true]]) {
    await t.test(String(fragmentCount), async (scenario) => {
      const root = await createRoot(scenario);
      const prefix = '{"verdict":"PASS"}';
      const finalText = `${prefix}${" ".repeat(fragmentCount - prefix.length)}`;
      const session = createSession({
        finalText,
        unsubscribeRejects: shouldReject,
        ...(shouldReject
          ? {
              onUnsubscribe: ({ listener }) => {
                listener({
                  method: "item/agentMessage/delta",
                  params: {
                    threadId: "fresh-thread",
                    turnId: "fresh-turn",
                    itemId: "late-message",
                    delta: "REENTRANT_SECRET_CANARY",
                  },
                });
              },
            }
          : {}),
        onBeforeAgentMessage: ({ emit, params, turnId }) => {
          for (const delta of finalText) {
            emitAgentDelta(emit, {
              threadId: params.threadId,
              turnId,
              itemId: "final-message",
              delta,
            });
          }
        },
      });
      const promise = subject.runFreshEvaluatorTurn({
        session,
        root,
        input: [{ type: "text", text: "Return the JSON verdict." }],
        outputSchema: outputSchema(),
      });
      const evidence = shouldReject ? await rejectedEvidence(promise) : await promise;
      assert.equal(evidence.eventCompaction.agentMessageDelta.fragmentCount, fragmentCount);
      if (shouldReject) {
        assert.equal(evidence.eventCompaction.observedEventCount, 4099);
        assert.equal(JSON.stringify(evidence).includes("REENTRANT_SECRET_CANARY"), false);
      }
      assert.equal(
        evidence.eventCompaction.agentMessageDelta.fragmentLimitExceeded,
        shouldReject,
      );
      assert.equal(
        evidence.blockers.includes("message-delta-limit-exceeded"),
        shouldReject,
      );
      assert.equal(
        session.requests.some(({ method, params }) =>
          method === "turn/interrupt" &&
          params.threadId === "fresh-thread" &&
          params.turnId === "fresh-turn"),
        shouldReject,
      );
      assert.equal(
        evidence.blockers.includes("cleanup-unsubscribe-failed"),
        shouldReject,
      );
    });
  }
});

test("fresh evaluator records the exact delta byte boundary and rejects byte 1048577", async (t) => {
  const subject = await loadSubject();
  for (const [byteLength, shouldExceed] of [[1048576, false], [1048577, true]]) {
    await t.test(String(byteLength), async (scenario) => {
      const root = await createRoot(scenario);
      const finalText = "x".repeat(byteLength);
      const evidence = await rejectedEvidence(subject.runFreshEvaluatorTurn({
        session: createSession({
          finalText,
          onBeforeAgentMessage: ({ emit, params, turnId }) => {
            emitAgentDelta(emit, {
              threadId: params.threadId,
              turnId,
              itemId: "final-message",
              delta: finalText,
            });
          },
        }),
        root,
        input: [{ type: "text", text: "Return the JSON verdict." }],
        outputSchema: outputSchema(),
      }));
      assert.equal(evidence.eventCompaction.agentMessageDelta.byteLength, byteLength);
      assert.equal(
        evidence.eventCompaction.agentMessageDelta.byteLimitExceeded,
        shouldExceed,
      );
      assert.equal(
        evidence.blockers.includes("message-delta-limit-exceeded"),
        shouldExceed,
      );
      assert.equal(evidence.eventCompaction.agentMessageDelta.rawTextRetained, false);
    });
  }
});

test("fresh evaluator counts but does not coalesce foreign and post-terminal deltas", async (t) => {
  const subject = await loadSubject();
  const scenarios = [
    ["foreign", {
      onBeforeAgentMessage: ({ emit, turnId }) => {
        emitAgentDelta(emit, {
          threadId: "foreign-thread",
          turnId,
          itemId: "foreign-message",
          delta: "foreign fragment",
        });
      },
    }, "foreign-event"],
    ["post terminal", {
      onTurnCompleted: ({ emit, params }) => {
        emitAgentDelta(emit, {
          threadId: params.threadId,
          turnId: "fresh-turn",
          itemId: "late-message",
          delta: "late fragment",
        });
      },
    }, "post-terminal-event"],
  ];

  for (const [name, options, blocker] of scenarios) {
    await t.test(name, async (scenario) => {
      const root = await createRoot(scenario);
      const evidence = await rejectedEvidence(subject.runFreshEvaluatorTurn({
        session: createSession(options),
        root,
        input: [{ type: "text", text: "Return the JSON verdict." }],
        outputSchema: outputSchema(),
      }));
      assert.equal(evidence.blockers.includes(blocker), true);
      assert.equal(evidence.eventCompaction.agentMessageDelta.fragmentCount, 1);
      assert.equal(
        evidence.events.filter(({ method }) => method === "item/agentMessage/delta").length,
        1,
      );
    });
  }
});

test("fresh evaluator fails closed on malformed and hostile notifications without retaining canaries", async (t) => {
  const subject = await loadSubject();
  const root = await createRoot(t);
  const canary = "HOSTILE_RAW_NOTIFICATION_CANARY";
  let trapReads = 0;
  const hostile = new Proxy({ canary }, {
    get() {
      trapReads += 1;
      throw new Error("hostile notification trap");
    },
  });
  const revoked = Proxy.revocable({ canary }, {});
  revoked.revoke();
  const failure = await rejectedFailure(subject.runFreshEvaluatorTurn({
    session: createSession({
      mcpAfterError: new Error("fixture later MCP status failure"),
      closeError: new Error("fixture later close failure"),
      unsubscribeThrows: true,
      onBeforeAgentMessage: ({ emit, params, turnId }) => {
        emitAgentDelta(emit, {
          threadId: params.threadId,
          turnId,
          itemId: "malformed-message",
          delta: "malformed",
          extraParams: { unexpected: true },
        });
        emit(hostile);
        emit(revoked.proxy);
      },
    }),
    root,
    input: [{ type: "text", text: "Return the JSON verdict." }],
    outputSchema: outputSchema(),
  }));
  const evidence = failure.freshEvaluatorEvidence;

  assert.equal(trapReads, 1);
  assert.deepEqual(subject.projectFreshEvaluatorFailureDiagnostic(failure), {
    schemaVersion: 1,
    failurePhase: "event-compaction",
  });
  assert.equal(evidence.blockers.includes("runtime-drift"), true);
  assert.equal(evidence.eventCompaction.observedEventCount, 7);
  assert.equal(evidence.eventCompaction.agentMessageDelta.fragmentCount, 0);
  assert.equal(JSON.stringify(evidence).includes(canary), false);
});

test("fresh evaluator preserves close and cleanup failures before hostile unsubscribe re-entry", async (t) => {
  const subject = await loadSubject();
  const cases = [
    [
      "session-close",
      { closeError: new Error("fixture earlier close failure") },
      false,
    ],
    [
      "session-cleanup",
      { runDynamicTool: true, releaseToolThrows: true },
      true,
    ],
  ];

  for (const [failurePhase, options, useDynamicTool] of cases) {
    await t.test(failurePhase, async (scenario) => {
      const root = await createRoot(scenario);
      const canary = `HOSTILE_UNSUBSCRIBE_REENTRY_${failurePhase}_CANARY`;
      let trapReads = 0;
      const hostile = new Proxy({ canary }, {
        get() {
          trapReads += 1;
          throw new Error("hostile unsubscribe re-entry trap");
        },
      });
      const failure = await rejectedFailure(subject.runFreshEvaluatorTurn({
        session: createSession({
          ...options,
          onUnsubscribe: ({ listener }) => listener(hostile),
        }),
        root,
        input: [{ type: "text", text: "Return the JSON verdict." }],
        outputSchema: outputSchema(),
        ...(useDynamicTool
          ? {
              dynamicTools: [dynamicTool()],
              dynamicToolController: async () => ({
                success: true,
                contentItems: [{ type: "inputText", text: '{"value":7}' }],
              }),
            }
          : {}),
        turnTimeoutMs: 100,
      }));

      assert.deepEqual(subject.projectFreshEvaluatorFailureDiagnostic(failure), {
        schemaVersion: 1,
        failurePhase,
      });
      assert.equal(trapReads, 1);
      assert.equal(JSON.stringify(failure.freshEvaluatorEvidence).includes(canary), false);
    });
  }
});

test("fresh evaluator binds private image paths but persists only safe input and lifecycle evidence", async (t) => {
  const subject = await loadSubject();
  assert.equal(typeof subject?.runFreshEvaluatorTurn, "function");
  const root = await createRoot(t);
  const imageDirectory = path.join(root, "fixture images");
  await mkdir(imageDirectory);
  const imagePath = path.join(imageDirectory, "정확한 후보.png");
  const imageBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0xff, 0x31]);
  await writeFile(imagePath, imageBytes);
  const input = [
    { type: "text", text: "Inspect the exact candidate and return JSON." },
    { type: "localImage", path: imagePath },
  ];
  const schema = outputSchema();
  const session = createSession();

  const result = await subject.runFreshEvaluatorTurn({
    session,
    root,
    input,
    outputSchema: schema,
    turnTimeoutMs: 100,
  });

  const threadStart = session.requests.find(({ method }) => method === "thread/start");
  const turnStart = session.requests.find(({ method }) => method === "turn/start");
  assert.equal(threadStart.params.cwd, root);
  assert.equal(threadStart.params.ephemeral, true);
  assert.equal(threadStart.params.config.project_doc_max_bytes, 0);
  assert.deepEqual(threadStart.params.selectedCapabilityRoots, []);
  assert.deepEqual(threadStart.params.dynamicTools, []);
  assert.equal(threadStart.params.approvalPolicy, "never");
  assert.equal(threadStart.params.permissions, "joewrks-eval-control-v3");
  assert.deepEqual(turnStart.params.input, input);
  assert.deepEqual(turnStart.params.outputSchema, schema);
  assert.equal(turnStart.params.approvalPolicy, "never");
  assert.equal(turnStart.params.permissions, "joewrks-eval-control-v3");
  assert.deepEqual(result.output, { verdict: "PASS" });
  assert.deepEqual(result.outputText, {
    text: '{"verdict":"PASS"}',
    byteLength: 18,
    sha256: digest('{"verdict":"PASS"}'),
  });
  assert.deepEqual(result.input.descriptors[1], {
    index: 1,
    type: "localImage",
    byteLength: imageBytes.length,
    sha256: digest(imageBytes),
    absolute: true,
    withinResolvedRoot: true,
    regularFile: true,
    nonSymlink: true,
    readable: true,
    originalDetail: "unverified",
  });
  assert.deepEqual(result.input.controllerLocalImages, [
    {
      inputIndex: 1,
      byteLength: imageBytes.length,
      sha256: digest(imageBytes),
      absolute: true,
      withinResolvedRoot: true,
      regularFile: true,
      nonSymlink: true,
      readable: true,
      checkedBeforeThreadStart: true,
      checkedBeforeTurnStart: true,
      unchangedBeforeTurnStart: true,
      postTurnPreCleanup: { readable: true, unchanged: true },
    },
  ]);
  assert.deepEqual(session.imageBindings, [
    {
      root: await realpath(root),
      images: [
        {
          inputIndex: 1,
          sentPath: imagePath,
          resolvedPath: await realpath(imagePath),
          byteLength: imageBytes.length,
          sha256: digest(imageBytes),
        },
      ],
    },
  ]);
  assert.equal(
    session.operations.indexOf("bindLocalImageDiagnostics") <
      session.operations.indexOf("turn/start"),
    true,
  );
  assert.equal(
    session.operations.filter((operation) => operation === "bindLocalImageDiagnostics")
      .length,
    1,
  );
  assert.deepEqual(result.appServer.imageDiagnostics, {
    status: "NO_ROUTER_IMAGE_ERROR",
    observationCount: 0,
    expectedTargetCount: 1,
    effectivePathMatch: "UNVERIFIED",
    matchedInputIndex: null,
    effectivePathAbsolute: "UNVERIFIED",
    effectivePathWithinRoot: "UNVERIFIED",
    modelArgumentAbsolute: "UNVERIFIED",
    outerCategory: "UNVERIFIED",
    reportedCategory: "UNVERIFIED",
    privacy: {
      rawPathPersisted: false,
      pathDigestPersisted: false,
      rawDiagnosticDigestPersisted: false,
    },
  });
  assert.deepEqual(result.appServer.successfulImageViews, {
    complete: true,
    eventCount: 0,
    completedCount: 0,
    items: [],
    blockers: [],
    privacy: {
      rawPathPersisted: false,
      pathDigestPersisted: false,
      rawDiagnosticDigestPersisted: false,
    },
  });
  assert.deepEqual(result.threadStart.request, {
    ephemeral: true,
    approvalPolicy: "never",
    permissions: "joewrks-eval-control-v3",
    projectDocMaxBytes: 0,
    selectedCapabilityRootCount: 0,
    dynamicToolCount: 0,
    runtimeWorkspaceRootCount: 1,
    environmentCount: 1,
  });
  assert.deepEqual(result.threadStart.response, {
    threadId: "fresh-thread",
    ephemeral: true,
    priorTurnCount: 0,
    instructionSourceCount: 0,
  });
  assert.equal(Object.hasOwn(result.thread, "cwd"), false);
  assert.equal(Object.hasOwn(result.thread, "request"), false);
  assert.equal(Object.hasOwn(result.turn.request, "input"), false);
  assert.equal(Object.hasOwn(turnStart.params.input[1], "detail"), false);
  const serialized = JSON.stringify(result);
  assert.equal(serialized.includes(imagePath), false);
  assert.equal(serialized.includes(root), false);
  assert.equal(serialized.includes(input[0].text), false);
  assert.equal(serialized.includes(imageBytes.toString("base64")), false);
  assert.equal(serialized.includes('"cwd"'), false);
  assert.equal(session.closed, true);
});

test("fresh evaluator freezes caller-owned text before awaited thread start", async (t) => {
  const subject = await loadSubject();
  assert.equal(typeof subject?.runFreshEvaluatorTurn, "function");
  const root = await createRoot(t);
  const input = [{ type: "text", text: "original prompt" }];
  const session = createSession({
    onThreadStart() {
      input[0].text = "mutated prompt";
      input.push({ type: "text", text: "injected prompt" });
    },
  });

  const result = await subject.runFreshEvaluatorTurn({
    session,
    root,
    input,
    outputSchema: outputSchema(),
    turnTimeoutMs: 100,
  });

  const turnStart = session.requests.find(({ method }) => method === "turn/start");
  assert.deepEqual(turnStart.params.input, [
    { type: "text", text: "original prompt" },
  ]);
  assert.deepEqual(result.input.descriptors, [
    {
      index: 0,
      type: "text",
      byteLength: 15,
      sha256: digest("original prompt"),
    },
  ]);
});

test("fresh evaluator safe request hash is independent of private root and image path", async (t) => {
  const subject = await loadSubject();
  assert.equal(typeof subject?.runFreshEvaluatorTurn, "function");
  const roots = [await createRoot(t), await createRoot(t)];
  const hashes = [];
  for (const [index, root] of roots.entries()) {
    const directory = path.join(root, `private-${index}`);
    await mkdir(directory);
    const imagePath = path.join(directory, `candidate-${index}.png`);
    await writeFile(imagePath, Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x21]));
    const result = await subject.runFreshEvaluatorTurn({
      session: createSession(),
      root,
      input: [
        { type: "text", text: "Inspect the same logical image." },
        { type: "localImage", path: imagePath },
      ],
      outputSchema: outputSchema(),
      turnTimeoutMs: 100,
    });
    hashes.push(result.input.requestSha256);
    assert.equal(JSON.stringify(result).includes(root), false);
    assert.equal(JSON.stringify(result).includes(imagePath), false);
  }
  assert.equal(hashes[0], hashes[1]);
});

test("fresh evaluator gives the diagnostic binder the resolved root", async (t) => {
  const subject = await loadSubject();
  assert.equal(typeof subject?.runFreshEvaluatorTurn, "function");
  const root = await createRoot(t);
  const aliasSegment = path.join(root, "alias-segment");
  await mkdir(aliasSegment);
  const rootAlias = `${aliasSegment}${path.sep}..`;
  const imagePath = path.join(root, "approved.png");
  await writeFile(imagePath, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  const session = createSession();

  await subject.runFreshEvaluatorTurn({
    session,
    root: rootAlias,
    input: [
      { type: "text", text: "Inspect the image." },
      { type: "localImage", path: imagePath },
    ],
    outputSchema: outputSchema(),
    turnTimeoutMs: 100,
  });

  assert.equal(session.imageBindings[0].root, await realpath(rootAlias));
});

test("fresh evaluator requires the image diagnostic binder before turn start", async (t) => {
  const subject = await loadSubject();
  assert.equal(typeof subject?.runFreshEvaluatorTurn, "function");
  const root = await createRoot(t);
  const imagePath = path.join(root, "approved.png");
  await writeFile(imagePath, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  const session = createSession({ provideImageBinder: false });

  const evidence = await rejectedEvidence(
    subject.runFreshEvaluatorTurn({
      session,
      root,
      input: [
        { type: "text", text: "Inspect the image." },
        { type: "localImage", path: imagePath },
      ],
      outputSchema: outputSchema(),
      turnTimeoutMs: 100,
    }),
  );

  assert.equal(evidence.blockers.includes("local-image-diagnostics-unavailable"), true);
  assert.equal(session.requests.some(({ method }) => method === "turn/start"), false);
  assert.equal(JSON.stringify(evidence).includes(imagePath), false);
});

test("fresh evaluator requires a successful image-view snapshot for local images", async (t) => {
  const subject = await loadSubject();
  const root = await createRoot(t);
  const imagePath = path.join(root, "approved.png");
  await writeFile(imagePath, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  const session = createSession();
  Object.defineProperty(session, "successfulImageViews", {
    configurable: true,
    get: () => null,
  });

  const evidence = await rejectedEvidence(
    subject.runFreshEvaluatorTurn({
      session,
      root,
      input: [
        { type: "text", text: "Inspect the image." },
        { type: "localImage", path: imagePath },
      ],
      outputSchema: outputSchema(),
      turnTimeoutMs: 100,
    }),
  );

  assert.equal(
    evidence.blockers.includes("successful-image-view-unverified"),
    true,
  );
  assert.equal(JSON.stringify(evidence).includes(imagePath), false);
});

test("fresh evaluator preserves the pre-turn image checks when turn start fails", async (t) => {
  const subject = await loadSubject();
  const root = await createRoot(t);
  const imagePath = path.join(root, "approved.png");
  const imageBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
  await writeFile(imagePath, imageBytes);
  const session = createSession({ turnStartError: new Error("fixture turn start failed") });

  const evidence = await rejectedEvidence(
    subject.runFreshEvaluatorTurn({
      session,
      root,
      input: [
        { type: "text", text: "Inspect the image." },
        { type: "localImage", path: imagePath },
      ],
      outputSchema: outputSchema(),
      turnTimeoutMs: 100,
    }),
  );

  assert.deepEqual(evidence.input.controllerLocalImages, [{
    inputIndex: 1,
    byteLength: imageBytes.length,
    sha256: digest(imageBytes),
    absolute: true,
    withinResolvedRoot: true,
    regularFile: true,
    nonSymlink: true,
    readable: true,
    checkedBeforeThreadStart: true,
    checkedBeforeTurnStart: true,
    unchangedBeforeTurnStart: true,
    postTurnPreCleanup: { readable: false, unchanged: false },
  }]);
  assert.equal(session.operations.includes("bindLocalImageDiagnostics"), true);
  assert.equal(JSON.stringify(evidence).includes(imagePath), false);
});

test("fresh evaluator rejects contradictory image diagnostics on a clean success path", async (t) => {
  const subject = await loadSubject();
  const root = await createRoot(t);
  const imagePath = path.join(root, "approved.png");
  await writeFile(imagePath, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  const noRouter = {
    status: "NO_ROUTER_IMAGE_ERROR",
    observationCount: 0,
    expectedTargetCount: 1,
    effectivePathMatch: "UNVERIFIED",
    matchedInputIndex: null,
    effectivePathAbsolute: "UNVERIFIED",
    effectivePathWithinRoot: "UNVERIFIED",
    modelArgumentAbsolute: "UNVERIFIED",
    outerCategory: "UNVERIFIED",
    reportedCategory: "UNVERIFIED",
    privacy: {
      rawPathPersisted: false,
      pathDigestPersisted: false,
      rawDiagnosticDigestPersisted: false,
    },
  };
  const cases = [
    {
      name: "target count mismatch",
      diagnostic: { ...noRouter, expectedTargetCount: 2 },
    },
    {
      name: "NO_ROUTER_IMAGE_ERROR with an observation",
      diagnostic: { ...noRouter, observationCount: 1 },
    },
    {
      name: "OBSERVED without App Server stderr",
      diagnostic: {
        ...noRouter,
        status: "OBSERVED",
        observationCount: 1,
        effectivePathMatch: "MATCH",
        matchedInputIndex: 1,
        effectivePathAbsolute: "VERIFIED",
        effectivePathWithinRoot: "VERIFIED",
        outerCategory: "unable-to-locate",
        reportedCategory: "not-found",
      },
    },
    {
      name: "MISMATCH without App Server stderr",
      diagnostic: {
        ...noRouter,
        status: "UNVERIFIED",
        observationCount: 1,
        effectivePathMatch: "MISMATCH",
      },
    },
    {
      name: "privacy invariant violation",
      diagnostic: {
        ...noRouter,
        privacy: { ...noRouter.privacy, rawPathPersisted: true },
      },
    },
    {
      name: "unexpected raw path field",
      diagnostic: { ...noRouter, path: imagePath },
    },
  ];

  for (const { name, diagnostic } of cases) {
    await t.test(name, async () => {
      const evidence = await rejectedEvidence(
        subject.runFreshEvaluatorTurn({
          session: createSession({ imageDiagnostics: diagnostic }),
          root,
          input: [
            { type: "text", text: "Inspect the image." },
            { type: "localImage", path: imagePath },
          ],
          outputSchema: outputSchema(),
          turnTimeoutMs: 100,
        }),
      );

      assert.equal(evidence.blockers.includes("image-diagnostics-unverified"), true);
      assert.equal(JSON.stringify(evidence).includes(imagePath), false);
    });
  }
});

test("fresh evaluator preserves correlated successful image-view lifecycle evidence", async (t) => {
  const subject = await loadSubject();
  const root = await createRoot(t);
  const imagePath = path.join(root, "approved.png");
  await writeFile(imagePath, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  const viewEvidence = {
    complete: true,
    eventCount: 2,
    completedCount: 1,
    items: [
      {
        id: "view-1",
        matchedInputIndex: 1,
        eventCount: 2,
        startedCount: 1,
        completedCount: 1,
        complete: true,
      },
    ],
    blockers: [],
    privacy: {
      rawPathPersisted: false,
      pathDigestPersisted: false,
      rawDiagnosticDigestPersisted: false,
    },
  };

  const result = await subject.runFreshEvaluatorTurn({
    session: createSession({ successfulImageViews: viewEvidence }),
    root,
    input: [
      { type: "text", text: "Inspect the image." },
      { type: "localImage", path: imagePath },
    ],
    outputSchema: outputSchema(),
    turnTimeoutMs: 100,
  });

  assert.deepEqual(result.appServer.successfulImageViews, viewEvidence);
  assert.equal(JSON.stringify(result).includes(imagePath), false);
});

test("fresh evaluator preserves a safe incomplete image-view lifecycle while blocking success", async (t) => {
  const subject = await loadSubject();
  const root = await createRoot(t);
  const imagePath = path.join(root, "approved.png");
  await writeFile(imagePath, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  const incomplete = {
    complete: false,
    eventCount: 1,
    completedCount: 0,
    items: [
      {
        id: "view-incomplete-1",
        matchedInputIndex: 1,
        eventCount: 1,
        startedCount: 1,
        completedCount: 0,
        complete: false,
      },
    ],
    blockers: ["image-view-lifecycle-incomplete"],
    privacy: {
      rawPathPersisted: false,
      pathDigestPersisted: false,
      rawDiagnosticDigestPersisted: false,
    },
  };

  const evidence = await rejectedEvidence(
    subject.runFreshEvaluatorTurn({
      session: createSession({ successfulImageViews: incomplete }),
      root,
      input: [
        { type: "text", text: "Inspect the image." },
        { type: "localImage", path: imagePath },
      ],
      outputSchema: outputSchema(),
      turnTimeoutMs: 100,
    }),
  );

  assert.equal(
    evidence.blockers.includes("successful-image-view-unverified"),
    true,
  );
  assert.deepEqual(evidence.appServer.successfulImageViews, incomplete);
  assert.equal(JSON.stringify(evidence).includes(imagePath), false);
});

test("fresh evaluator drops incomplete image-view evidence containing path or credential text", async (t) => {
  const subject = await loadSubject();
  const root = await createRoot(t);
  const imagePath = path.join(root, "approved.png");
  await writeFile(imagePath, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  const forbiddenPath = "C:\\Users\\Private-User\\view.png";
  const secret = "sk-SYNTHETIC_TEST_ONLY_abcdefghijklmnop";
  const cases = [
    {
      name: "path-shaped blocker",
      value: {
        ...successfulImageViewSnapshot([], {
          complete: false,
          blockers: [forbiddenPath],
        }),
      },
      forbidden: forbiddenPath,
    },
    {
      name: "path-shaped item id",
      value: {
        ...successfulImageViewSnapshot([
          successfulImageViewItem(forbiddenPath),
        ]),
        complete: false,
        blockers: ["image-view-lifecycle-incomplete"],
      },
      forbidden: forbiddenPath,
    },
    {
      name: "credential-shaped blocker",
      value: {
        ...successfulImageViewSnapshot([], {
          complete: false,
          blockers: [secret],
        }),
      },
      forbidden: secret,
    },
  ];

  for (const { name, value, forbidden } of cases) {
    await t.test(name, async () => {
      const evidence = await rejectedEvidence(
        subject.runFreshEvaluatorTurn({
          session: createSession({ successfulImageViews: value }),
          root,
          input: [
            { type: "text", text: "Inspect the image." },
            { type: "localImage", path: imagePath },
          ],
          outputSchema: outputSchema(),
          turnTimeoutMs: 100,
        }),
      );

      assert.equal(
        evidence.blockers.includes("successful-image-view-unverified"),
        true,
      );
      assert.equal(evidence.appServer.successfulImageViews, null);
      assert.equal(JSON.stringify(evidence).includes(forbidden), false);
    });
  }
});

test("fresh evaluator rejects malformed successful image-view lifecycle evidence", async (t) => {
  const subject = await loadSubject();
  const root = await createRoot(t);
  const imagePath = path.join(root, "approved.png");
  await writeFile(imagePath, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  const base = {
    complete: true,
    eventCount: 0,
    completedCount: 0,
    items: [],
    blockers: [],
    privacy: {
      rawPathPersisted: false,
      pathDigestPersisted: false,
      rawDiagnosticDigestPersisted: false,
    },
  };
  const cases = [
    { name: "incomplete", value: { ...base, complete: false } },
    { name: "blocker", value: { ...base, blockers: ["view-incomplete"] } },
    {
      name: "uncorrelated input",
      value: {
        ...base,
        eventCount: 2,
        completedCount: 1,
        items: [{
          id: "view-1",
          matchedInputIndex: 7,
          eventCount: 2,
          startedCount: 1,
          completedCount: 1,
          complete: true,
        }],
      },
    },
    {
      name: "inconsistent counts",
      value: { ...base, eventCount: 2 },
    },
    {
      name: "privacy violation",
      value: {
        ...base,
        privacy: { ...base.privacy, pathDigestPersisted: true },
      },
    },
    {
      name: "unexpected raw path",
      value: { ...base, path: imagePath },
    },
  ];

  for (const { name, value } of cases) {
    await t.test(name, async () => {
      const evidence = await rejectedEvidence(
        subject.runFreshEvaluatorTurn({
          session: createSession({ successfulImageViews: value }),
          root,
          input: [
            { type: "text", text: "Inspect the image." },
            { type: "localImage", path: imagePath },
          ],
          outputSchema: outputSchema(),
          turnTimeoutMs: 100,
        }),
      );

      assert.equal(
        evidence.blockers.includes("successful-image-view-unverified"),
        true,
      );
      assert.equal(JSON.stringify(evidence).includes(imagePath), false);
    });
  }
});

test("fresh evaluator bounds successful image-view evidence before copying it", async (t) => {
  const subject = await loadSubject();
  const root = await createRoot(t);
  const imagePath = path.join(root, "approved.png");
  await writeFile(imagePath, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  let eventOverflowTrapCount = 0;
  const eventOverflowItems = new Proxy([], {
    get() {
      eventOverflowTrapCount += 1;
      throw new Error("event overflow items must not be inspected");
    },
    getOwnPropertyDescriptor() {
      eventOverflowTrapCount += 1;
      throw new Error("event overflow items must not be inspected");
    },
    getPrototypeOf() {
      eventOverflowTrapCount += 1;
      throw new Error("event overflow items must not be inspected");
    },
    ownKeys() {
      eventOverflowTrapCount += 1;
      throw new Error("event overflow items must not be inspected");
    },
  });
  const cases = [
    {
      name: "more than eight items",
      value: successfulImageViewSnapshot(
        Array.from({ length: 9 }, (_, index) =>
          successfulImageViewItem(`view-${index + 1}`),
        ),
      ),
    },
    {
      name: "more than sixteen events",
      value: {
        complete: true,
        eventCount: 17,
        completedCount: 0,
        items: eventOverflowItems,
        blockers: [],
        privacy: {
          rawPathPersisted: false,
          pathDigestPersisted: false,
          rawDiagnosticDigestPersisted: false,
        },
      },
      after: () => assert.equal(eventOverflowTrapCount, 0),
    },
    {
      name: "identifier over 128 UTF-8 bytes",
      value: successfulImageViewSnapshot([
        successfulImageViewItem("x".repeat(129)),
      ]),
    },
    {
      name: "credential-shaped identifier",
      value: successfulImageViewSnapshot([
        successfulImageViewItem(
          "sk-SYNTHETIC_TEST_ONLY_abcdefghijklmnop",
        ),
      ]),
    },
  ];

  for (const { name, value, after } of cases) {
    await t.test(name, async () => {
      const session = createSession();
      Object.defineProperty(session, "successfulImageViews", {
        configurable: true,
        get: () => value,
      });
      const evidence = await rejectedEvidence(
        subject.runFreshEvaluatorTurn({
          session,
          root,
          input: [
            { type: "text", text: "Inspect the image." },
            { type: "localImage", path: imagePath },
          ],
          outputSchema: outputSchema(),
          turnTimeoutMs: 100,
        }),
      );

      assert.equal(
        evidence.blockers.includes("successful-image-view-unverified"),
        true,
      );
      assert.equal(evidence.appServer.successfulImageViews, null);
      after?.();
    });
  }
});

test("fresh evaluator never invokes nested successful image-view accessors or proxy traps", async (t) => {
  const subject = await loadSubject();
  const root = await createRoot(t);
  const imagePath = path.join(root, "approved.png");
  await writeFile(imagePath, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  let accessorTrapCount = 0;
  const accessorItem = successfulImageViewItem("placeholder");
  Object.defineProperty(accessorItem, "id", {
    enumerable: true,
    configurable: true,
    get() {
      accessorTrapCount += 1;
      return "view-accessor";
    },
  });
  let proxyTrapCount = 0;
  const proxyItems = new Proxy([], {
    get(target, key, receiver) {
      proxyTrapCount += 1;
      return Reflect.get(target, key, receiver);
    },
    getOwnPropertyDescriptor(target, key) {
      proxyTrapCount += 1;
      return Reflect.getOwnPropertyDescriptor(target, key);
    },
    getPrototypeOf(target) {
      proxyTrapCount += 1;
      return Reflect.getPrototypeOf(target);
    },
    ownKeys(target) {
      proxyTrapCount += 1;
      return Reflect.ownKeys(target);
    },
  });
  const revokedItemHandle = Proxy.revocable(
    successfulImageViewItem("view-revoked"),
    {},
  );
  revokedItemHandle.revoke();
  const cases = [
    {
      name: "nested accessor",
      value: successfulImageViewSnapshot([accessorItem]),
      trapCount: () => accessorTrapCount,
    },
    {
      name: "nested proxy",
      value: {
        complete: true,
        eventCount: 0,
        completedCount: 0,
        items: proxyItems,
        blockers: [],
        privacy: {
          rawPathPersisted: false,
          pathDigestPersisted: false,
          rawDiagnosticDigestPersisted: false,
        },
      },
      trapCount: () => proxyTrapCount,
    },
    {
      name: "nested revoked proxy",
      value: successfulImageViewSnapshot([revokedItemHandle.proxy]),
      trapCount: () => 0,
    },
  ];

  for (const { name, value, trapCount } of cases) {
    await t.test(name, async () => {
      const session = createSession();
      Object.defineProperty(session, "successfulImageViews", {
        configurable: true,
        get: () => value,
      });
      const evidence = await rejectedEvidence(
        subject.runFreshEvaluatorTurn({
          session,
          root,
          input: [
            { type: "text", text: "Inspect the image." },
            { type: "localImage", path: imagePath },
          ],
          outputSchema: outputSchema(),
          turnTimeoutMs: 100,
        }),
      );

      assert.equal(
        evidence.blockers.includes("successful-image-view-unverified"),
        true,
      );
      assert.equal(evidence.appServer.successfulImageViews, null);
      assert.equal(
        evidence.blockers.includes(
          "cleanup-successful-image-views-snapshot-failed",
        ),
        false,
      );
      assert.equal(trapCount(), 0);
    });
  }
});

test("fresh evaluator blocks a malformed successful image-view snapshot without local images", async (t) => {
  const subject = await loadSubject();
  const root = await createRoot(t);
  const session = createSession();
  Object.defineProperty(session, "successfulImageViews", {
    configurable: true,
    get: () => ({
      complete: true,
      eventCount: 17,
      completedCount: 0,
      items: [],
      blockers: [],
      privacy: {
        rawPathPersisted: false,
        pathDigestPersisted: false,
        rawDiagnosticDigestPersisted: false,
      },
    }),
  });

  const evidence = await rejectedEvidence(
    subject.runFreshEvaluatorTurn({
      session,
      root,
      input: [{ type: "text", text: "Return the controlled result." }],
      outputSchema: outputSchema(),
      turnTimeoutMs: 100,
    }),
  );

  assert.equal(
    evidence.blockers.includes("successful-image-view-unverified"),
    true,
  );
  assert.equal(evidence.appServer.successfulImageViews, null);
});

test("fresh evaluator performs the third image readback before closing the session", async (t) => {
  const subject = await loadSubject();
  assert.equal(typeof subject?.runFreshEvaluatorTurn, "function");
  const root = await createRoot(t);
  const imagePath = path.join(root, "approved.png");
  await writeFile(imagePath, Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x31]));
  const session = createSession({
    onClose: () => rm(imagePath),
  });

  const result = await subject.runFreshEvaluatorTurn({
    session,
    root,
    input: [
      { type: "text", text: "Inspect the image." },
      { type: "localImage", path: imagePath },
    ],
    outputSchema: outputSchema(),
    turnTimeoutMs: 100,
  });

  assert.deepEqual(result.input.controllerLocalImages[0].postTurnPreCleanup, {
    readable: true,
    unchanged: true,
  });
  assert.equal(session.operations.at(-1), "close");
});

test("fresh evaluator fails closed when the image is deleted after the terminal event", async (t) => {
  const subject = await loadSubject();
  assert.equal(typeof subject?.runFreshEvaluatorTurn, "function");
  const root = await createRoot(t);
  const imagePath = path.join(root, "approved.png");
  await writeFile(imagePath, Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x41]));
  const session = createSession({
    onTurnCompleted: () => rm(imagePath),
  });

  const failure = await rejectedFailure(
    subject.runFreshEvaluatorTurn({
      session,
      root,
      input: [
        { type: "text", text: "Inspect the image." },
        { type: "localImage", path: imagePath },
      ],
      outputSchema: outputSchema(),
      turnTimeoutMs: 100,
    }),
  );
  const evidence = failure.freshEvaluatorEvidence;

  assert.equal(evidence.blockers.includes("input-post-turn-readback-failed"), true);
  assert.deepEqual(subject.projectFreshEvaluatorFailureDiagnostic(failure), {
    schemaVersion: 1,
    failurePhase: "post-runtime-validation",
  });
  assert.deepEqual(
    evidence.input.controllerLocalImages[0].postTurnPreCleanup,
    { readable: false, unchanged: false },
  );
  assert.equal(session.closed, true);
  assert.equal(JSON.stringify(evidence).includes(imagePath), false);
});

test("fresh evaluator fails closed when image bytes drift after the terminal event", async (t) => {
  const subject = await loadSubject();
  assert.equal(typeof subject?.runFreshEvaluatorTurn, "function");
  const root = await createRoot(t);
  const imagePath = path.join(root, "approved.png");
  const before = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x51]);
  const after = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x52]);
  await writeFile(imagePath, before);
  const session = createSession({
    onTurnCompleted: () => writeFile(imagePath, after),
  });

  const failure = await rejectedFailure(
    subject.runFreshEvaluatorTurn({
      session,
      root,
      input: [
        { type: "text", text: "Inspect the image." },
        { type: "localImage", path: imagePath },
      ],
      outputSchema: outputSchema(),
      turnTimeoutMs: 100,
    }),
  );
  const evidence = failure.freshEvaluatorEvidence;

  assert.equal(evidence.blockers.includes("input-provenance-changed-after-turn"), true);
  assert.deepEqual(subject.projectFreshEvaluatorFailureDiagnostic(failure), {
    schemaVersion: 1,
    failurePhase: "post-runtime-validation",
  });
  assert.deepEqual(
    evidence.input.controllerLocalImages[0].postTurnPreCleanup,
    { readable: true, unchanged: false },
  );
  assert.equal(JSON.stringify(evidence).includes(imagePath), false);
});

test("fresh evaluator fails closed when image bytes change during thread start", async (t) => {
  const subject = await loadSubject();
  assert.equal(typeof subject?.runFreshEvaluatorTurn, "function");
  const root = await createRoot(t);
  const imagePath = path.join(root, "candidate.png");
  const before = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x01]);
  const after = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x02]);
  await writeFile(imagePath, before);
  const session = createSession({
    async onThreadStart() {
      await writeFile(imagePath, after);
    },
  });

  const evidence = await rejectedEvidence(
    subject.runFreshEvaluatorTurn({
      session,
      root,
      input: [
        { type: "text", text: "Inspect the image." },
        { type: "localImage", path: imagePath },
      ],
      outputSchema: outputSchema(),
      turnTimeoutMs: 100,
    }),
  );

  assert.equal(evidence.blockers.includes("input-provenance-changed"), true);
  assert.equal(
    session.requests.some(({ method }) => method === "turn/start"),
    false,
  );
  assert.deepEqual(evidence.input.descriptors[1], {
    index: 1,
    type: "localImage",
    byteLength: before.length,
    sha256: digest(before),
    absolute: true,
    withinResolvedRoot: true,
    regularFile: true,
    nonSymlink: true,
    readable: true,
    originalDetail: "unverified",
  });
});

test("fresh evaluator rejects inherited turns and instruction sources", async (t) => {
  const subject = await loadSubject();
  assert.equal(typeof subject?.runFreshEvaluatorTurn, "function");
  const root = await createRoot(t);
  const instructionPath = path.join(root, "AGENTS.md");
  for (const [session, expectedInstructionSourceCount] of [
    [createSession({ priorTurns: [{ id: "prior-turn" }] }), 0],
    [createSession({ instructionSources: [instructionPath] }), 1],
  ]) {
    const evidence = await rejectedEvidence(
      subject.runFreshEvaluatorTurn({
        session,
        root,
        input: [{ type: "text", text: "Return JSON." }],
        outputSchema: outputSchema(),
        turnTimeoutMs: 100,
      }),
    );
    assert.equal(session.closed, true);
    assert.equal(evidence.threadStart.request.projectDocMaxBytes, 0);
    assert.equal(
      evidence.threadStart.response.instructionSourceCount,
      expectedInstructionSourceCount,
    );
    assert.equal(JSON.stringify(evidence).includes(instructionPath), false);
  }
});

test("fresh evaluator rejects a cross-thread event", async (t) => {
  const subject = await loadSubject();
  assert.equal(typeof subject?.runFreshEvaluatorTurn, "function");
  const root = await createRoot(t);
  const evidence = await rejectedEvidence(
    subject.runFreshEvaluatorTurn({
      session: createSession({ foreignEvent: true }),
      root,
      input: [{ type: "text", text: "Return JSON." }],
      outputSchema: outputSchema(),
      turnTimeoutMs: 100,
    }),
  );
  assert.equal(evidence.blockers.includes("foreign-event"), true);
});

test("fresh evaluator drains and rejects a late forbidden event", async (t) => {
  const subject = await loadSubject();
  assert.equal(typeof subject?.runFreshEvaluatorTurn, "function");
  const root = await createRoot(t);
  const evidence = await rejectedEvidence(
    subject.runFreshEvaluatorTurn({
      session: createSession({ lateForbiddenEvent: true }),
      root,
      input: [{ type: "text", text: "Return JSON." }],
      outputSchema: outputSchema(),
      turnTimeoutMs: 100,
    }),
  );
  assert.equal(evidence.blockers.includes("uncontrolled-tool-surface"), true);
  assert.equal(
    evidence.events.some(({ item }) => item?.id === "late-file-change"),
    true,
  );
});

test("fresh evaluator rejects a valid-looking agent message after the terminal", async (t) => {
  const subject = await loadSubject();
  assert.equal(typeof subject?.runFreshEvaluatorTurn, "function");
  const root = await createRoot(t);
  const evidence = await rejectedEvidence(
    subject.runFreshEvaluatorTurn({
      session: createSession({
        finalText: '{"verdict":"PASS"}',
        lateAgentMessage: '{"verdict":"FAIL"}',
      }),
      root,
      input: [{ type: "text", text: "Return JSON." }],
      outputSchema: outputSchema(),
      turnTimeoutMs: 100,
    }),
  );
  assert.equal(evidence.blockers.includes("post-terminal-event"), true);
  assert.equal(
    evidence.events.find(({ item }) => item?.id === "late-agent-message")
      ?.postTerminal,
    true,
  );
});

test("fresh evaluator rejects a dynamic-tool lifecycle mismatch", async (t) => {
  const subject = await loadSubject();
  assert.equal(typeof subject?.runFreshEvaluatorTurn, "function");
  const root = await createRoot(t);
  const evidence = await rejectedEvidence(
    subject.runFreshEvaluatorTurn({
      session: createSession({
        runDynamicTool: true,
        dynamicLifecycleMismatch: true,
      }),
      root,
      input: [{ type: "text", text: "Use the controlled tool." }],
      outputSchema: outputSchema(),
      dynamicTools: [dynamicTool()],
      dynamicToolController: async () => ({
        success: true,
        contentItems: [{ type: "inputText", text: '{"value":7}' }],
      }),
      turnTimeoutMs: 100,
    }),
  );
  assert.equal(evidence.blockers.includes("dynamic-tool-lifecycle-mismatch"), true);
  assert.deepEqual(evidence.toolEvidence[0].arguments, { key: "alpha" });
});

test("fresh evaluator returns correlated controlled dynamic-tool evidence", async (t) => {
  const subject = await loadSubject();
  assert.equal(typeof subject?.runFreshEvaluatorTurn, "function");
  const root = await createRoot(t);
  const responseText = '{"value":7}';
  const result = await subject.runFreshEvaluatorTurn({
    session: createSession({ runDynamicTool: true }),
    root,
    input: [{ type: "text", text: "Use the controlled tool." }],
    outputSchema: outputSchema(),
    dynamicTools: [dynamicTool()],
    dynamicToolController: async () => ({
      success: true,
      contentItems: [{ type: "inputText", text: responseText }],
    }),
    turnTimeoutMs: 100,
  });
  assert.deepEqual(result.toolEvidence, [
    {
      callId: "call-1",
      tool: "fixture-read",
      arguments: { key: "alpha" },
      argumentsSha256: digest('{"key":"alpha"}'),
      status: "completed",
      response: { byteLength: 11, sha256: digest(responseText) },
    },
  ]);
});

test("fresh evaluator rejects malformed final JSON with partial evidence", async (t) => {
  const subject = await loadSubject();
  assert.equal(typeof subject?.runFreshEvaluatorTurn, "function");
  const root = await createRoot(t);
  const evidence = await rejectedEvidence(
    subject.runFreshEvaluatorTurn({
      session: createSession({ finalText: "not-json" }),
      root,
      input: [{ type: "text", text: "Return JSON." }],
      outputSchema: outputSchema(),
      turnTimeoutMs: 100,
    }),
  );
  assert.equal(evidence.thread.id, "fresh-thread");
  assert.equal(evidence.turn.id, "fresh-turn");
  assert.equal(evidence.events.length > 0, true);
  assert.deepEqual(evidence.toolEvidence, []);
  assert.equal(evidence.appServer.processExitCode, 0);
});

test("fresh evaluator exposes the closed raw-free failure-phase projector", async () => {
  const subject = await loadSubject();
  assert.deepEqual(subject.FRESH_EVALUATOR_FAILURE_PHASES, [
    "terminal-timeout",
    "agent-message-delta-overflow",
    "mcp-status-collection",
    "mcp-runtime-inertness",
    "session-close",
    "session-cleanup",
    "event-compaction",
    "post-runtime-validation",
    "final-agent-text",
    "structured-output-parse",
    "unmapped",
  ]);
  assert.equal(typeof subject.projectFreshEvaluatorFailureDiagnostic, "function");
  assert.equal(subject.projectFreshEvaluatorFailureDiagnostic(new Error("forged")), null);
});

test("fresh evaluator projects deterministic failure phases without raw evidence", async (t) => {
  const subject = await loadSubject();
  const inertActiveMcpResponse = {
    data: [{
      name: "fixture-active",
      authStatus: "notLoggedIn",
      tools: { forbidden: {} },
      resources: [],
      resourceTemplates: [],
      serverInfo: null,
    }],
    nextCursor: null,
  };
  const cases = [
    [
      "terminal-timeout",
      { omitTerminal: true },
      1,
      (session) => assert.equal(
        session.requests.filter(({ method }) => method === "turn/interrupt").length,
        1,
      ),
    ],
    [
      "agent-message-delta-overflow",
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
      100,
      (session) => assert.equal(
        session.requests.filter(({ method }) => method === "turn/interrupt").length,
        1,
      ),
    ],
    ["mcp-status-collection", { mcpAfterResponse: {} }, 100, null],
    [
      "mcp-runtime-inertness",
      {
        mcpInventory: [{ name: "fixture-active" }],
        mcpAfterResponse: inertActiveMcpResponse,
      },
      100,
      null,
    ],
    ["final-agent-text", { finalText: "" }, 100, null],
    [
      "structured-output-parse",
      { finalText: "PRIVATE-NON-JSON-CANARY" },
      100,
      null,
    ],
  ];

  for (const [failurePhase, options, turnTimeoutMs, inspect] of cases) {
    await t.test(failurePhase, async (scenario) => {
      const root = await createRoot(scenario);
      const session = createSession(options);
      const failure = await rejectedFailure(subject.runFreshEvaluatorTurn({
        session,
        root,
        input: [{ type: "text", text: "Return the JSON verdict." }],
        outputSchema: outputSchema(),
        turnTimeoutMs,
      }));
      assert.deepEqual(subject.projectFreshEvaluatorFailureDiagnostic(failure), {
        schemaVersion: 1,
        failurePhase,
      });
      const serialized = JSON.stringify(
        subject.projectFreshEvaluatorFailureDiagnostic(failure),
      );
      assert.equal(serialized.includes("PRIVATE-NON-JSON-CANARY"), false);
      assert.equal(serialized.includes(root), false);
      assert.equal(serialized.includes("primaryCause"), false);
      inspect?.(session);
    });
  }
});

test("fresh evaluator preserves delta-overflow phase when interrupt transport throws synchronously", async (t) => {
  const subject = await loadSubject();
  const root = await createRoot(t);
  const session = createSession({
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
  });
  const request = session.client.request;
  session.client.request = function requestWithSynchronousInterruptFailure(
    method,
    ...args
  ) {
    if (method === "turn/interrupt") {
      throw new Error("fixture synchronous interrupt transport failure");
    }
    return request.call(this, method, ...args);
  };
  const failure = await rejectedFailure(subject.runFreshEvaluatorTurn({
    session,
    root,
    input: [{ type: "text", text: "Return the JSON verdict." }],
    outputSchema: outputSchema(),
    turnTimeoutMs: 100,
  }));

  assert.deepEqual(subject.projectFreshEvaluatorFailureDiagnostic(failure), {
    schemaVersion: 1,
    failurePhase: "agent-message-delta-overflow",
  });
});

test("fresh evaluator retains post-runtime validation when blockers coexist with invalid final output", async (t) => {
  const subject = await loadSubject();
  for (const finalText of ["", "PRIVATE-NON-JSON-CANARY"]) {
    await t.test(JSON.stringify(finalText), async (scenario) => {
      const root = await createRoot(scenario);
      const failure = await rejectedFailure(subject.runFreshEvaluatorTurn({
        session: createSession({ stderrByteLength: 3, finalText }),
        root,
        input: [{ type: "text", text: "Return the JSON verdict." }],
        outputSchema: outputSchema(),
        turnTimeoutMs: 100,
      }));
      assert.deepEqual(subject.projectFreshEvaluatorFailureDiagnostic(failure), {
        schemaVersion: 1,
        failurePhase: "post-runtime-validation",
      });
    });
  }
});

test("fresh evaluator retains close and cleanup phases when real event compaction fails", async (t) => {
  const subject = await loadSubject();
  const cases = [
    ["session-close", { closeError: new Error("fixture close failure") }],
    ["session-cleanup", { unsubscribeThrows: true }],
  ];
  for (const [failurePhase, options] of cases) {
    await t.test(failurePhase, async (scenario) => {
      const root = await createRoot(scenario);
      const originalMapGet = Map.prototype.get;
      try {
        const failure = await rejectedFailure(subject.runFreshEvaluatorTurn({
          session: createSession({
            ...options,
            onClose() {
              Map.prototype.get = function getWithCompactionMismatch(key) {
                const value = originalMapGet.call(this, key);
                return key === "thread/started" && value === 1 ? 2 : value;
              };
            },
          }),
          root,
          input: [{ type: "text", text: "Return the JSON verdict." }],
          outputSchema: outputSchema(),
          turnTimeoutMs: 100,
        }));
        assert.equal(failure.freshEvaluatorEvidence.eventCompaction, null);
        assert.equal(
          failure.freshEvaluatorEvidence.blockers.includes("event-compaction-unverified"),
          true,
        );
        assert.deepEqual(subject.projectFreshEvaluatorFailureDiagnostic(failure), {
          schemaVersion: 1,
          failurePhase,
        });
      } finally {
        Map.prototype.get = originalMapGet;
      }
    });
  }
});

test("fresh evaluator projector only recognizes private failure identities", async (t) => {
  const subject = await loadSubject();
  let trapCalls = 0;
  const accessorBearing = {};
  Object.defineProperty(accessorBearing, "freshEvaluatorEvidence", {
    get() {
      trapCalls += 1;
      return "forged";
    },
  });
  const symbolBearing = { [Symbol("fresh-evaluator-canary")]: "forged" };
  const proxy = new Proxy({}, {
    get() {
      trapCalls += 1;
      return "forged";
    },
    getOwnPropertyDescriptor() {
      trapCalls += 1;
      return undefined;
    },
  });
  const revoked = Proxy.revocable({}, {});
  revoked.revoke();

  for (const value of [
    new Error("forged"),
    proxy,
    revoked.proxy,
    accessorBearing,
    symbolBearing,
    null,
    undefined,
    "forged",
    1,
    true,
  ]) {
    assert.equal(subject.projectFreshEvaluatorFailureDiagnostic(value), null);
  }
  assert.equal(trapCalls, 0);

  const root = await createRoot(t);
  const failure = await rejectedFailure(subject.runFreshEvaluatorTurn({
    session: createSession({ finalText: "PRIVATE-NON-JSON-CANARY" }),
    root,
    input: [{ type: "text", text: "Return the JSON verdict." }],
    outputSchema: outputSchema(),
    turnTimeoutMs: 100,
  }));
  const first = subject.projectFreshEvaluatorFailureDiagnostic(failure);
  first.failurePhase = "forged";
  const second = subject.projectFreshEvaluatorFailureDiagnostic(failure);
  assert.notEqual(first, second);
  assert.deepEqual(second, {
    schemaVersion: 1,
    failurePhase: "structured-output-parse",
  });
});

test("fresh evaluator partial evidence includes the runtime diagnostic and wrapped primary cause", async (t) => {
  const subject = await loadSubject();
  assert.equal(typeof subject?.runFreshEvaluatorTurn, "function");
  const root = await createRoot(t);
  const primary = new Error("adapter backend failed");
  primary.code = "adapter_failure";
  primary.details = { authorization: "Bearer hidden-adapter-secret" };
  const evidence = await rejectedEvidence(
    subject.runFreshEvaluatorTurn({
      session: createSession({
        runtimeError: {
          message: "backend rejected request",
          codexErrorInfo: "backend_failure",
          additionalDetails: "Cookie: session=hidden-runtime-secret",
        },
        mcpAfterError: primary,
      }),
      root,
      input: [{ type: "text", text: "Return JSON." }],
      outputSchema: outputSchema(),
      turnTimeoutMs: 100,
    }),
  );

  assert.deepEqual(evidence.events.map(({ method }) => method), [
    "thread/started",
    "turn/started",
    "error",
    "item/completed",
    "turn/completed",
  ]);
  assert.equal(evidence.events[2].threadId, "fresh-thread");
  assert.equal(evidence.events[2].turnId, "fresh-turn");
  assert.equal(evidence.events[2].runtimeError.code.text, "backend_failure");
  assert.equal(evidence.events[2].runtimeError.details.text, "[REDACTED]");
  assert.deepEqual(evidence.primaryCause, {
    code: {
      text: "adapter_failure",
      byteLength: 15,
      sha256: "360bc120cb95f8deff40988b58edfaf75a8dae8740ef913143a6b49a8cb02148",
      truncated: false,
      redacted: false,
      unsupported: false,
    },
    message: {
      text: "adapter backend failed",
      byteLength: 22,
      sha256: "5ee7f96503f7b45ff8445ec93039ea32831f84fdd00c1ac68dd6812e4bccae2f",
      truncated: false,
      redacted: false,
      unsupported: false,
    },
    details: {
      text: '{"authorization":"[REDACTED]"}',
      byteLength: 30,
      sha256: "35dc6144ff36675ee40d1a531281b43d54e93aefcc2377cef1ad85678fdaa0f8",
      truncated: false,
      redacted: true,
      unsupported: false,
    },
  });
  assert.equal(JSON.stringify(evidence).includes("hidden-runtime-secret"), false);
  assert.equal(JSON.stringify(evidence).includes("hidden-adapter-secret"), false);
});

test("fresh evaluator primary-cause capture never invokes accessors", async (t) => {
  const subject = await loadSubject();
  assert.equal(typeof subject?.runFreshEvaluatorTurn, "function");
  const root = await createRoot(t);
  let reads = 0;
  const primary = new Error("adapter backend failed");
  Object.defineProperty(primary, "details", {
    enumerable: true,
    get() {
      reads += 1;
      return "must not execute";
    },
  });

  const evidence = await rejectedEvidence(
    subject.runFreshEvaluatorTurn({
      session: createSession({ mcpAfterError: primary }),
      root,
      input: [{ type: "text", text: "Return JSON." }],
      outputSchema: outputSchema(),
      turnTimeoutMs: 100,
    }),
  );

  assert.equal(reads, 0);
  assert.deepEqual(evidence.primaryCause.details, {
    text: "[UNSUPPORTED:accessor]",
    byteLength: 22,
    sha256: "66edbdac07d683412d1df6e962f509f69fd5f423df819b523ec066abd4bf30a3",
    truncated: false,
    redacted: false,
    unsupported: true,
  });
});

test("fresh evaluator sanitizes provider token shapes in runtime and primary-cause evidence", async (t) => {
  const subject = await loadSubject();
  assert.equal(typeof subject?.runFreshEvaluatorTurn, "function");
  const root = await createRoot(t);
  const diagnostic = SYNTHETIC_TOKEN_SHAPES.join(" ");
  const primary = new Error(`adapter failed ${diagnostic}`);
  primary.details = `primary details ${diagnostic}`;
  const evidence = await rejectedEvidence(
    subject.runFreshEvaluatorTurn({
      session: createSession({
        runtimeError: {
          message: `runtime failed ${diagnostic}`,
          codexErrorInfo: "backend_failure",
          additionalDetails: `runtime details ${diagnostic}`,
        },
        mcpAfterError: primary,
      }),
      root,
      input: [{ type: "text", text: "Return JSON." }],
      outputSchema: outputSchema(),
      turnTimeoutMs: 100,
    }),
  );
  const serialized = JSON.stringify(evidence);
  for (const token of SYNTHETIC_TOKEN_SHAPES) {
    assert.equal(serialized.includes(token), false, token);
  }
  assert.equal(evidence.events.find(({ method }) => method === "error").runtimeError.message.redacted, true);
  assert.equal(evidence.events.find(({ method }) => method === "error").runtimeError.details.redacted, true);
  assert.equal(evidence.primaryCause.message.redacted, true);
  assert.equal(evidence.primaryCause.details.redacted, true);
});

test("fresh evaluator rejects missing or duplicate terminals, stderr, nonzero exit, and unsafe remote control", async (t) => {
  const subject = await loadSubject();
  assert.equal(typeof subject?.runFreshEvaluatorTurn, "function");
  const root = await createRoot(t);
  const scenarios = [
    ["missing terminal", { omitTerminal: true }, "missing-terminal-event", 15],
    ["duplicate terminal", { duplicateTerminal: true }, "duplicate-terminal-event", 100],
    [
      "stderr",
      {
        stderrByteLength: 3,
        stderrDiagnostic: {
          text: "err",
          byteLength: 3,
          sha256: digest("err"),
          truncated: false,
          redacted: false,
          unsupported: false,
        },
      },
      "app-server-stderr",
      100,
    ],
    ["nonzero exit", { closeExitCode: 7 }, "app-server-nonzero-exit", 100],
    [
      "unsafe remote control",
      {
        remoteControlSnapshot: {
          seen: true,
          complete: true,
          status: "connected",
          environmentAttached: true,
        },
      },
      "unsafe-remote-control",
      100,
    ],
  ];
  for (const [name, options, blocker, turnTimeoutMs] of scenarios) {
    await t.test(name, async () => {
      const session = createSession(options);
      const evidence = await rejectedEvidence(
        subject.runFreshEvaluatorTurn({
          session,
          root,
          input: [{ type: "text", text: "Return JSON." }],
          outputSchema: outputSchema(),
          turnTimeoutMs,
        }),
      );
      assert.equal(evidence.blockers.includes(blocker), true);
      if (name === "stderr") {
        assert.equal(evidence.appServer.stderr.diagnostic.text, "err");
      }
      assert.equal(session.closed, true);
    });
  }
});

test("fresh evaluator attaches partial evidence when cleanup callbacks or snapshot getters throw", async (t) => {
  const subject = await loadSubject();
  assert.equal(typeof subject?.runFreshEvaluatorTurn, "function");
  const root = await createRoot(t);
  const scenarios = [
    ["dynamic-tool release", { runDynamicTool: true, releaseToolThrows: true }],
    ["unsubscribe", { unsubscribeThrows: true }],
    ["async unsubscribe", { unsubscribeRejects: true }],
    ["snapshot getter", { remoteSnapshotThrowsOnRead: 2 }],
  ];
  for (const [name, options] of scenarios) {
    await t.test(name, async () => {
      const session = createSession(options);
      const runOptions = {
        session,
        root,
        input: [{ type: "text", text: "Return JSON." }],
        outputSchema: outputSchema(),
        turnTimeoutMs: 100,
      };
      if (options.runDynamicTool) {
        runOptions.dynamicTools = [dynamicTool()];
        runOptions.dynamicToolController = async () => ({
          success: true,
          contentItems: [{ type: "inputText", text: '{"value":7}' }],
        });
      }
      const evidence = await rejectedEvidence(
        subject.runFreshEvaluatorTurn(runOptions),
      );
      assert.equal(evidence.thread.id, "fresh-thread");
      assert.equal(evidence.turn.id, "fresh-turn");
      assert.equal(evidence.events.length > 0, true);
      assert.equal(
        evidence.blockers.some((blocker) => blocker.includes("cleanup")),
        true,
      );
    });
  }
});
