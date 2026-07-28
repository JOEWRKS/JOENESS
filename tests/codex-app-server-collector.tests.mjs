import assert from "node:assert/strict";
import { PassThrough } from "node:stream";
import test from "node:test";

import {
  boundUtf8,
  buildMcpDisableArgs,
  buildSubjectInput,
  createJsonlClient,
  evaluatePreflight,
  inspectSyntheticState,
  selectCases,
  sha256,
  stableStringify,
  verifyDisabledMcp,
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
    'mcp_servers."figma"={enabled=false,url="https://mcp.figma.com/mcp"}',
    "-c",
    'mcp_servers."node_repl"={enabled=false,command="C:\\\\runtime\\\\node.exe",args=[]}',
  ]);
  assert.doesNotMatch(args.join(" "), /Authorization|SECRET|secret/);
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
