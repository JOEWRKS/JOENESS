import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const MODULE_URL = new URL(
  "../evals/support/run-fresh-evaluator-turn.mjs",
  import.meta.url,
);

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
  closeExitCode = 0,
  stderrByteLength = 0,
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
  remoteSnapshotThrowsOnRead = null,
} = {}) {
  const listeners = new Set();
  const requests = [];
  let toolHandler = null;
  let processExitCode = null;
  let closed = false;
  let remoteSnapshotReadCount = 0;

  function emit(notification) {
    for (const listener of listeners) listener(notification);
  }

  const session = {
    requests,
    notificationCursor: 0,
    mcpInventory: [],
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
        redacted: true,
        truncated: false,
        byteLength: stderrByteLength,
        sha256: stderrByteLength === 0 ? digest("") : digest("fixture-stderr"),
      };
    },
    client: {
      async request(method, params) {
        requests.push({ method, params: structuredClone(params) });
        if (method === "thread/start") {
          await onThreadStart?.(params);
          emit({
            method: "thread/started",
            params: { thread: { id: "fresh-thread" } },
          });
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
          emit({
            method: "turn/started",
            params: {
              threadId: params.threadId,
              turn: { id: "fresh-turn" },
            },
          });
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
          return { turn: { id: "fresh-turn", status: "inProgress" } };
        }
        if (method === "turn/interrupt") return {};
        if (method === "mcpServerStatus/list") {
          return { data: [], nextCursor: null };
        }
        throw new Error(`unexpected request: ${method}`);
      },
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (unsubscribeThrows) {
          throw new Error("fixture unsubscribe failed");
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
      processExitCode = closeExitCode;
      closed = true;
    },
    get closed() {
      return closed;
    },
  };
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

test("fresh evaluator preserves exact local-image descriptors and hashes without embedding bytes", async (t) => {
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
    path: imagePath,
    byteLength: imageBytes.length,
    sha256: digest(imageBytes),
    originalDetail: "unverified",
  });
  assert.equal(Object.hasOwn(turnStart.params.input[1], "detail"), false);
  assert.equal(JSON.stringify(result.input).includes(imageBytes.toString("base64")), false);
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
      text: "original prompt",
      byteLength: 15,
      sha256: digest("original prompt"),
    },
  ]);
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
    path: imagePath,
    byteLength: before.length,
    sha256: digest(before),
    originalDetail: "unverified",
  });
});

test("fresh evaluator rejects inherited turns and instruction sources", async (t) => {
  const subject = await loadSubject();
  assert.equal(typeof subject?.runFreshEvaluatorTurn, "function");
  const root = await createRoot(t);
  const instructionPath = path.join(root, "AGENTS.md");
  for (const session of [
    createSession({ priorTurns: [{ id: "prior-turn" }] }),
    createSession({ instructionSources: [instructionPath] }),
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
    assert.equal(evidence.threadStart.request.config.project_doc_max_bytes, 0);
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

test("fresh evaluator rejects missing or duplicate terminals, stderr, nonzero exit, and unsafe remote control", async (t) => {
  const subject = await loadSubject();
  assert.equal(typeof subject?.runFreshEvaluatorTurn, "function");
  const root = await createRoot(t);
  const scenarios = [
    ["missing terminal", { omitTerminal: true }, "missing-terminal-event", 15],
    ["duplicate terminal", { duplicateTerminal: true }, "duplicate-terminal-event", 100],
    ["stderr", { stderrByteLength: 3 }, "app-server-stderr", 100],
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
