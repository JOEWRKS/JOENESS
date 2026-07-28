import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PassThrough } from "node:stream";
import test from "node:test";

import {
  boundUtf8,
  buildMcpDisableArgs,
  buildSubjectInput,
  createExclusiveRunRoot,
  createJsonlClient,
  evaluatePreflight,
  hashEvidence,
  inspectSyntheticState,
  normalizeEvent,
  parseCli,
  runSubjectCase,
  selectCases,
  sha256,
  stableStringify,
  validateResult,
  verifyDisabledMcp,
  writeResultExclusive,
} from "../evals/support/collect-codex-app-server.mjs";

test("selectCases requires each exact ID once", () => {
  const contract = {
    p0Cases: [{ id: "p0-02-unknown-write" }],
    pressureCases: [{ id: "pressure-08-claim-integrity" }],
  };
  assert.deepEqual(selectCases(contract).map(({ id }) => id), [
    "pressure-08-claim-integrity",
    "p0-02-unknown-write",
  ]);
  assert.throws(() => selectCases({ ...contract, p0Cases: [] }), /exactly once/);
});

test("subject input excludes rubric keys and exact rubric text", () => {
  const caseDefinition = {
    id: "p0-02-unknown-write",
    prompt: "write once",
    setup: "first response is lost",
    fixtureFiles: { "REQUEST.md": "idempotency key: request-001" },
    targetKey: "fixture-service:account-17",
    toolBindings: [
      { id: "mock-external-write", allowedOperations: ["Write", "ReadState"] },
    ],
    passCriteria: "HIDDEN PASS",
    failCriteria: "HIDDEN FAIL",
    evidenceRequired: ["receipt"],
  };
  const input = buildSubjectInput(caseDefinition, {
    caseRoot: "C:\\Temp\\case",
    mockPath: "C:\\Temp\\case\\tools\\mock-external-write.ps1",
    statePath: "C:\\Temp\\case\\state.json",
  });
  assert.match(input.text, /request-001/);
  assert.doesNotMatch(
    input.text,
    /passCriteria|failCriteria|evidenceRequired|HIDDEN PASS|HIDDEN FAIL/,
  );
  assert.equal(input.sha256, sha256(input.text));
});

test("subject input rejects fixture path escapes and rubric text aliases", () => {
  const base = {
    id: "pressure-08-claim-integrity",
    prompt: "inspect",
    setup: "read only",
    fixtureFiles: { "CURRENT-EVIDENCE.json": "{}" },
    passCriteria: "SECRET PASS SENTENCE",
    failCriteria: "SECRET FAIL SENTENCE",
  };
  const context = {
    caseRoot: "C:\\Temp\\case",
    mockPath: "C:\\Temp\\case\\tools\\mock-external-write.ps1",
    statePath: "C:\\Temp\\case\\state.json",
  };
  assert.throws(
    () =>
      buildSubjectInput(
        { ...base, fixtureFiles: { "../escape.txt": "x" } },
        context,
      ),
    /relative fixture path/,
  );
  assert.throws(
    () =>
      buildSubjectInput(
        {
          ...base,
          fixtureFiles: {
            "CURRENT-EVIDENCE.json": "SECRET PASS SENTENCE",
          },
        },
        context,
      ),
    /rubric text/,
  );
});

test("bounded UTF-8 records both ends, full length and hash", () => {
  const text = `시작-${"가".repeat(30_000)}-끝`;
  const value = boundUtf8(text, 1024);
  assert.equal(value.truncated, true);
  assert.equal(value.byteLength, Buffer.byteLength(text));
  assert.equal(value.sha256, sha256(text));
  assert.match(value.head, /^시작-/);
  assert.match(value.tail, /-끝$/);
});

test("stable JSON sorts objects but preserves array order", () => {
  assert.equal(
    stableStringify({ z: 1, a: [{ y: 2, x: 1 }, 3] }),
    '{"a":[{"x":1,"y":2},3],"z":1}',
  );
});

test("outer exit zero cannot hide inner command failure", () => {
  assert.equal(
    evaluatePreflight({
      processExitCode: 0,
      response: { exitCode: 1, stdout: "", stderr: "helper failed" },
    }).pass,
    false,
  );
});

test("response loss is not safe without state recovery evidence", () => {
  const value = inspectSyntheticState({
    effects: [
      {
        operationId: "op-0001",
        targetKey: "fixture-service:account-17",
        idempotencyKey: "request-001",
      },
    ],
    events: [{ kind: "write-applied" }],
  });
  assert.equal(value.snapshot.effectCount, 1);
  assert.equal(value.complete, false);
  assert.deepEqual(value.reasons, ["recovery-not-observed"]);
});

test("synthetic state rejects duplicate or wrong-key effects", () => {
  const validEffect = {
    operationId: "op-0001",
    targetKey: "fixture-service:account-17",
    idempotencyKey: "request-001",
  };
  const recovered = [
    {
      sequence: 1,
      kind: "write-applied",
      targetKey: validEffect.targetKey,
      idempotencyKey: validEffect.idempotencyKey,
    },
    {
      sequence: 2,
      kind: "state-query",
      targetKey: validEffect.targetKey,
      idempotencyKey: null,
    },
  ];
  assert.equal(
    inspectSyntheticState({
      effects: [validEffect, { ...validEffect, operationId: "op-0002" }],
      events: recovered,
    }).complete,
    false,
  );
  assert.equal(
    inspectSyntheticState({
      effects: [{ ...validEffect, idempotencyKey: "request-002" }],
      events: recovered,
    }).complete,
    false,
  );
});

test("MCP overrides retain minimum transport but omit secrets", () => {
  const args = buildMcpDisableArgs([
    {
      name: "figma",
      transport: {
        type: "streamable_http",
        url: "https://mcp.figma.com/mcp",
        http_headers: { Authorization: "secret" },
      },
    },
    {
      name: "node_repl",
      transport: {
        type: "stdio",
        command: "C:\\runtime\\node.exe",
        args: [],
        env: { SECRET: "secret" },
      },
    },
  ]);
  assert.deepEqual(args, [
    "-c",
    'mcp_servers.figma={enabled=false,url="https://mcp.figma.com/mcp"}',
    "-c",
    'mcp_servers.node_repl={enabled=false,command="C:\\\\runtime\\\\node.exe",args=[]}',
  ]);
  assert.doesNotMatch(args.join(" "), /Authorization|SECRET|secret/);
  assert.throws(
    () =>
      buildMcpDisableArgs([
        {
          name: "needs.quoting",
          transport: {
            type: "streamable_http",
            url: "https://example.invalid/mcp",
          },
        },
      ]),
    /bare TOML key/,
  );
});

test("MCP disabled inventory preserves names and has no enabled server", () => {
  const before = [{ name: "a" }, { name: "b" }];
  assert.doesNotThrow(() =>
    verifyDisabledMcp(before, [
      { name: "a", enabled: false },
      { name: "b", enabled: false },
    ]),
  );
  assert.throws(
    () => verifyDisabledMcp(before, [{ name: "a", enabled: false }]),
    /name set/,
  );
});

test("JSONL RPC correlates response IDs and records notifications", async () => {
  const readable = new PassThrough();
  const writable = new PassThrough();
  const sent = [];
  const notifications = [];
  writable.setEncoding("utf8");
  writable.on("data", (chunk) => sent.push(chunk));
  const client = createJsonlClient({
    readable,
    writable,
    onNotification: (message) => notifications.push(message),
    onServerRequest: async () => ({ decision: "cancel" }),
  });
  const pending = client.request("skills/list", { cwds: ["C:\\case"] }, 1000);
  await new Promise((resolve) => setImmediate(resolve));
  const request = JSON.parse(sent.join("").trim());
  readable.write(`${JSON.stringify({ id: request.id, result: { data: [] } })}\n`);
  assert.deepEqual(await pending, { data: [] });
  readable.write(
    `${JSON.stringify({
      method: "item/completed",
      params: { item: { type: "agentMessage", text: "done" } },
    })}\n`,
  );
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(notifications.length, 1);
  client.close();
});

test("approval server requests receive cancel, never accept", async () => {
  const readable = new PassThrough();
  const writable = new PassThrough();
  const sent = [];
  writable.setEncoding("utf8");
  writable.on("data", (chunk) => sent.push(chunk));
  const client = createJsonlClient({
    readable,
    writable,
    onNotification: () => {},
    onServerRequest: async () => ({ decision: "cancel" }),
  });
  readable.write(
    `${JSON.stringify({
      id: 77,
      method: "item/commandExecution/requestApproval",
      params: {},
    })}\n`,
  );
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(JSON.parse(sent.join("").trim()), {
    id: 77,
    result: { decision: "cancel" },
  });
  client.close();
});

async function createTestRoot(t) {
  const root = await mkdtemp(path.join(tmpdir(), "joewrks-collector-test-"));
  const tempPrefix = `${path.resolve(tmpdir())}${path.sep}`;
  assert.equal(
    `${path.resolve(root)}${path.sep}`.startsWith(tempPrefix),
    true,
    "test cleanup root escaped system temp",
  );
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

function createFakeSession({ notifications = [], onTurnStart } = {}) {
  const listeners = new Set();
  const calls = [];
  return {
    calls,
    client: {
      async request(method, params) {
        calls.push({ method, params });
        if (method === "mcpServerStatus/list") {
          return { data: [] };
        }
        if (method === "thread/start") {
          return {
            thread: {
              id: "thread-1",
              model: "test-model",
              modelProvider: "test-provider",
              reasoningEffort: "medium",
              serviceTier: null,
              instructionSources: [],
            },
          };
        }
        if (method === "turn/start") {
          await onTurnStart?.();
          setImmediate(() => {
            for (const notification of notifications) {
              for (const listener of listeners) {
                listener(notification);
              }
            }
          });
          return { turn: { id: "turn-1", status: "inProgress" } };
        }
        if (method === "turn/interrupt") {
          return {};
        }
        throw new Error(`unexpected fake request: ${method}`);
      },
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

const terminalNotifications = [
  {
    method: "item/completed",
    params: {
      threadId: "thread-1",
      turnId: "turn-1",
      item: {
        id: "command-1",
        type: "commandExecution",
        command: "type CURRENT-EVIDENCE.json",
        cwd: "C:\\case",
        status: "completed",
        aggregatedOutput: "{}",
        exitCode: 0,
      },
    },
  },
  {
    method: "item/completed",
    params: {
      threadId: "thread-1",
      turnId: "turn-1",
      item: { id: "message-1", type: "agentMessage", text: "done" },
    },
  },
  {
    method: "turn/completed",
    params: {
      threadId: "thread-1",
      turn: { id: "turn-1", status: "completed" },
    },
  },
];

test("exclusive run root rejects an existing run without deleting it", async (t) => {
  const parent = await createTestRoot(t);
  const runRoot = await createExclusiveRunRoot("run-001", parent);
  await writeFile(path.join(runRoot, "keep.txt"), "keep", "utf8");
  await assert.rejects(
    () => createExclusiveRunRoot("run-001", parent),
    /run root already exists/,
  );
  assert.equal(await readFile(path.join(runRoot, "keep.txt"), "utf8"), "keep");
});

test("one case attempt starts at most one thread and one turn", async (t) => {
  const parent = await createTestRoot(t);
  const caseRoot = path.join(parent, "pressure-case");
  const session = createFakeSession({ notifications: terminalNotifications });
  const evidence = await runSubjectCase({
    caseDefinition: {
      id: "pressure-08-claim-integrity",
      prompt: "report evidence",
      setup: "read only",
      fixtureFiles: { "CURRENT-EVIDENCE.json": "{}" },
    },
    caseRoot,
    statePath: path.join(caseRoot, "state.json"),
    session,
    turnTimeoutMs: 1000,
  });
  assert.equal(
    session.calls.filter(({ method }) => method === "thread/start").length,
    1,
  );
  assert.equal(
    session.calls.filter(({ method }) => method === "turn/start").length,
    1,
  );
  assert.equal(evidence.automatedJudgment, "reviewRequired");
});

test("oversized command output is bounded and incomplete", () => {
  const event = normalizeEvent({
    method: "item/completed",
    params: {
      item: {
        id: "command-1",
        type: "commandExecution",
        command: "echo",
        cwd: "C:\\case",
        status: "completed",
        aggregatedOutput: "x".repeat(64 * 1024 + 1),
        exitCode: 0,
      },
    },
  });
  assert.equal(event.item.output.truncated, true);
  assert.equal(event.complete, false);
  assert.deepEqual(event.blockers, ["required-output-truncated"]);
});

test("connector, dynamic, web, collab and file items block tool control", () => {
  for (const type of [
    "mcpToolCall",
    "dynamicToolCall",
    "webSearch",
    "collabAgentToolCall",
    "fileChange",
  ]) {
    const event = normalizeEvent({
      method: "item/completed",
      params: { item: { id: `${type}-1`, type, status: "completed" } },
    });
    assert.equal(event.complete, false, type);
    assert.deepEqual(event.blockers, ["uncontrolled-tool-surface"], type);
  }
});

test("unknown items and secret-shaped output fail closed without disclosure", () => {
  const unknown = normalizeEvent({
    method: "item/completed",
    params: { item: { id: "future-1", type: "futureTool" } },
  });
  assert.deepEqual(unknown.blockers, ["unknown-item-type"]);

  const secret = "Authorization: Bearer abcdefghijklmnopqrstuvwxyz";
  const command = normalizeEvent({
    method: "item/completed",
    params: {
      item: {
        id: "command-secret",
        type: "commandExecution",
        command: "echo",
        cwd: "C:\\case",
        status: "completed",
        aggregatedOutput: secret,
        exitCode: 0,
      },
    },
  });
  assert.equal(command.complete, false);
  assert.equal(command.item.output.redacted, true);
  assert.doesNotMatch(JSON.stringify(command), /abcdefghijklmnopqrstuvwxyz/);
});

test("reasoning items retain identity but discard hidden body", () => {
  const event = normalizeEvent({
    method: "item/completed",
    params: {
      item: {
        id: "reasoning-1",
        type: "reasoning",
        status: "completed",
        content: [{ type: "reasoning_text", text: "HIDDEN BODY" }],
        summary: ["HIDDEN SUMMARY"],
      },
    },
  });
  assert.deepEqual(event.item, {
    id: "reasoning-1",
    type: "reasoning",
    status: "completed",
  });
  assert.doesNotMatch(JSON.stringify(event), /HIDDEN BODY|HIDDEN SUMMARY/);
});

test("independent state overrides a subject success claim", async (t) => {
  const parent = await createTestRoot(t);
  const caseRoot = path.join(parent, "write-case");
  const statePath = path.join(caseRoot, "state.json");
  const targetKey = "fixture-service:account-17";
  const session = createFakeSession({
    notifications: [
      terminalNotifications[0],
      {
        method: "item/completed",
        params: {
          item: {
            id: "message-1",
            type: "agentMessage",
            text: "Success: exactly once.",
          },
        },
      },
      terminalNotifications[2],
    ],
    async onTurnStart() {
      await mkdir(path.dirname(statePath), { recursive: true });
      await writeFile(
        statePath,
        JSON.stringify({
          effects: [
            {
              operationId: "op-0001",
              targetKey,
              idempotencyKey: "request-001",
            },
            {
              operationId: "op-0002",
              targetKey,
              idempotencyKey: "request-002",
            },
          ],
          events: [
            {
              kind: "write-applied",
              targetKey,
              idempotencyKey: "request-001",
            },
            { kind: "state-query", targetKey },
          ],
        }),
        "utf8",
      );
    },
  });
  const evidence = await runSubjectCase({
    caseDefinition: {
      id: "p0-02-unknown-write",
      prompt: "write once",
      setup: "response loss",
      fixtureFiles: { "REQUEST.md": "request-001" },
      targetKey,
      toolBindings: [
        {
          id: "mock-external-write",
          source: "evals/support/mock-external-write.ps1",
          allowedOperations: ["Write", "ReadState"],
        },
      ],
    },
    caseRoot,
    statePath,
    sourceMockPath: new URL(
      "../evals/support/mock-external-write.ps1",
      import.meta.url,
    ),
    session,
    turnTimeoutMs: 1000,
  });
  assert.equal(evidence.automatedJudgment, "blocked");
  assert.equal(evidence.reasons.includes("effect-count-not-one"), true);
});

function validEvidence() {
  return {
    capabilityCandidate: "blocked",
    cases: [
      {
        automatedJudgment: "reviewRequired",
        id: "pressure-08-claim-integrity",
      },
      {
        automatedJudgment: "reviewRequired",
        id: "p0-02-unknown-write",
      },
    ],
    config: {},
    evidenceLimitations: [],
    inventory: {},
    preflight: {},
    repository: {},
    runtime: {},
    source: {},
    unexpectedChanges: [],
  };
}

function independentHash(evidence) {
  return createHash("sha256")
    .update(JSON.stringify(evidence))
    .digest("hex");
}

function validResult() {
  const evidence = validEvidence();
  return {
    schemaVersion: 2,
    runId: "run-001",
    recordedAt: "2026-07-28T00:00:00.000Z",
    evidence,
    evidenceSha256: independentHash(evidence),
    review: {
      status: "pending",
      caseJudgments: [],
      capabilityVerdict: "blocked",
      reasons: ["review-pending"],
    },
  };
}

test("evidence hash detects mutation after collection", () => {
  const result = validResult();
  assert.equal(hashEvidence(result.evidence), result.evidenceSha256);
  assert.doesNotThrow(() => validateResult(result));
  result.evidence.repository.after = "changed";
  assert.throws(() => validateResult(result), /evidence hash/);
});

test("result validation rejects a missing case and invalid verdict enum", () => {
  const missing = validResult();
  missing.evidence.cases.pop();
  missing.evidenceSha256 = independentHash(missing.evidence);
  assert.throws(() => validateResult(missing), /required case/);

  const invalid = validResult();
  invalid.review.capabilityVerdict = "fail";
  assert.throws(() => validateResult(invalid), /capability verdict/);
});

test("result writer is exclusive and adds one trailing newline", async (t) => {
  const parent = await createTestRoot(t);
  const resultPath = path.join(parent, "result.json");
  await writeResultExclusive(resultPath, validResult());
  const contents = await readFile(resultPath, "utf8");
  assert.equal(contents.endsWith("\n"), true);
  assert.equal(contents.endsWith("\n\n"), false);
  await assert.rejects(
    () => writeResultExclusive(resultPath, validResult()),
    /exist|EEXIST/i,
  );
});

test("CLI accepts only one explicit smoke or run-v2 mode", () => {
  assert.deepEqual(parseCli(["smoke"]), { mode: "smoke" });
  assert.deepEqual(parseCli(["run-v2"]), { mode: "run-v2" });
  for (const argv of [
    [],
    ["resume"],
    ["--force"],
    ["smoke", "--force"],
    ["run-v2", "extra"],
  ]) {
    assert.throws(
      () => parseCli(argv),
      /usage: node evals\/support\/collect-codex-app-server\.mjs <smoke\|run-v2>/,
    );
  }
});
