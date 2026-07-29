import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { createConnection } from "node:net";
import path from "node:path";
import { PassThrough } from "node:stream";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  approvalDenialResponse,
  boundUtf8,
  buildAppServerEnvironment,
  buildDoctorArgs,
  buildEvaluationPermissionArgs,
  buildMcpDisableArgs,
  buildRuntimeIsolationArgs,
  buildSubjectInput,
  collectRuntimeInventory,
  createExclusiveRunRoot,
  createJsonlClient,
  createV2RunRoot,
  evaluateHooksInventory,
  evaluatePreflight,
  EVALUATION_PERMISSION_PROFILE,
  gitBlobHash,
  hashEvidence,
  hashRepositoryFiles,
  inspectSyntheticState,
  listMcpServerStatus,
  normalizeEvent,
  parseCli,
  proveNetworkIsolation,
  proveReadIsolation,
  proveWriteIsolation,
  readWindowsSandboxReadiness,
  remoteControlSnapshotIsSafe,
  requestSyntheticWriteBroker,
  runBuffered,
  runSubjectCase,
  selectCases,
  sha256,
  startSyntheticWriteBroker,
  stableStringify,
  validateResult,
  verifyDisabledMcp,
  verifyMcpRuntimeIsInert,
  writeResultExclusive,
} from "../evals/support/collect-codex-app-server.mjs";

const SAFE_REMOTE_CONTROL_SNAPSHOT = {
  seen: true,
  complete: true,
  status: "disabled",
  environmentAttached: false,
};

test("App Server environment and named profile exclude ambient secrets", () => {
  const environment = buildAppServerEnvironment({
    SystemRoot: "C:\\Windows",
    Path: "C:\\Windows\\System32",
    USERPROFILE: "C:\\Users\\test",
    CODEX_HOME: "C:\\Users\\test\\.codex",
    OPENAI_API_KEY: "secret",
    GITHUB_TOKEN: "secret",
    AWS_SECRET_ACCESS_KEY: "secret",
    CUSTOM_VALUE: "secret",
  });
  assert.deepEqual(environment, {
    CODEX_HOME: "C:\\Users\\test\\.codex",
    Path: "C:\\Windows\\System32",
    SystemRoot: "C:\\Windows",
    USERPROFILE: "C:\\Users\\test",
  });
  assert.deepEqual(buildEvaluationPermissionArgs(), [
    "-c",
    `permissions.${EVALUATION_PERMISSION_PROFILE}={filesystem={":minimal"="read",":workspace_roots"="read"},network={enabled=false}}`,
    "-c",
    `default_permissions="${EVALUATION_PERMISSION_PROFILE}"`,
    "-c",
    'windows.sandbox="elevated"',
    "-c",
    'shell_environment_policy={inherit="core",ignore_default_excludes=false}',
  ]);
});

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
    brokerPipeName: "joewrks-test",
  });
  assert.match(input.text, /request-001/);
  assert.match(input.text, /joewrks-test/);
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
    brokerPipeName: "joewrks-test",
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

test("Git blob hashing matches the canonical object hash", () => {
  assert.equal(
    gitBlobHash("test content\n"),
    "d670460b4b4aece5915caf5c68d12f560a9fe3e4",
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

test("read isolation proof stores labels only and fails when a target is readable", async () => {
  const cwd = path.resolve(tmpdir(), "joewrks-read-probe-case");
  const targetPath = path.resolve(tmpdir(), "joewrks-read-probe-rubric.json");
  const configPath = path.resolve(tmpdir(), "joewrks-read-probe-config.toml");
  const controlPath = path.resolve(tmpdir(), "joewrks-read-probe-control");
  const workspacePath = path.join(cwd, "sentinel.txt");
  const calls = [];
  const denied = await proveReadIsolation(
    {
      async request(method, params) {
        calls.push({ method, params });
        return { exitCode: 0, stdout: "", stderr: "" };
      },
    },
    cwd,
    [
      { label: "codex-config", path: configPath },
      { label: "collector-control", path: controlPath },
      { label: "frozen-rubric", path: targetPath },
    ],
    { label: "workspace-sentinel", path: workspacePath },
  );
  assert.deepEqual(denied, {
    status: "pass",
    permissionProfile: EVALUATION_PERMISSION_PROFILE,
    workspace: { label: "workspace-sentinel", readable: true },
    targets: [
      { label: "codex-config", denied: true },
      { label: "collector-control", denied: true },
      { label: "frozen-rubric", denied: true },
    ],
    reasons: [],
  });
  assert.equal(calls[0].params.permissionProfile, EVALUATION_PERMISSION_PROFILE);
  assert.equal(Object.hasOwn(calls[0].params, "sandboxPolicy"), false);
  assert.equal(
    calls.every(
      ({ method, params }) =>
        method !== "command/exec" ||
        !Object.hasOwn(params, "outputBytesCap"),
    ),
    true,
  );
  assert.doesNotMatch(JSON.stringify(denied), /rubric\.json/u);

  const readable = await proveReadIsolation(
    {
      async request() {
        return { exitCode: 41, stdout: "", stderr: "" };
      },
    },
    cwd,
    [{ label: "frozen-rubric", path: targetPath }],
  );
  assert.equal(readable.status, "blocked");
  assert.deepEqual(readable.reasons, [
    "frozen-rubric-readable-or-inconclusive",
  ]);
});

test("write, network and elevated-readiness probes fail closed", async (t) => {
  const cwd = await createTestRoot(t);
  const writeTarget = path.join(cwd, "must-not-exist.txt");
  const calls = [];
  const client = {
    async request(method, params) {
      calls.push({ method, params });
      return { exitCode: 0, stdout: "", stderr: "" };
    },
  };
  assert.equal(
    (await proveWriteIsolation(client, cwd, writeTarget)).status,
    "pass",
  );
  assert.deepEqual(await proveNetworkIsolation(client, cwd), {
    status: "pass",
    permissionProfile: EVALUATION_PERMISSION_PROFILE,
    target: "controller-loopback",
    controllerReachable: true,
    connectionObserved: false,
    reasons: [],
  });
  assert.equal(
    calls.every(
      ({ method, params }) =>
        method !== "command/exec" ||
        !Object.hasOwn(params, "outputBytesCap"),
    ),
    true,
  );
  const failedClient = {
    async request() {
      return { exitCode: 41, stdout: "", stderr: "" };
    },
  };
  assert.deepEqual(await proveWriteIsolation(failedClient, cwd, writeTarget), {
    status: "blocked",
    permissionProfile: EVALUATION_PERMISSION_PROFILE,
    target: { label: "workspace-write-sentinel", created: false },
    reasons: ["workspace-write-not-denied"],
  });
  assert.deepEqual(await proveNetworkIsolation(failedClient, cwd), {
    status: "blocked",
    permissionProfile: EVALUATION_PERMISSION_PROFILE,
    target: "controller-loopback",
    controllerReachable: true,
    connectionObserved: false,
    reasons: ["network-access-not-denied"],
  });
  assert.deepEqual(
    await readWindowsSandboxReadiness({
      async request() {
        return { status: "ready" };
      },
    }),
    { status: "ready" },
  );
  await assert.rejects(
    () =>
      readWindowsSandboxReadiness({
        async request() {
          return { status: "future" };
        },
      }),
    /malformed/,
  );
});

test("response loss is not safe without state recovery evidence", () => {
  const value = inspectSyntheticState({
    responseLossInjected: true,
    requestCount: 2,
    rejectedRequestCount: 0,
    overflow: false,
    effects: [
      {
        operationId: "op-0001",
        targetKey: "fixture-service:account-17",
        idempotencyKey: "request-001",
      },
    ],
    events: [
      {
        sequence: 1,
        kind: "probe",
        targetKey: null,
        idempotencyKey: null,
      },
      {
        sequence: 2,
        kind: "write-applied",
        operationId: "op-0001",
        targetKey: "fixture-service:account-17",
        idempotencyKey: "request-001",
      },
    ],
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

test("controller-owned broker commits once before dropping the response", async (t) => {
  const broker = await startSyntheticWriteBroker();
  t.after(() => broker.close());

  assert.deepEqual(
    await requestSyntheticWriteBroker(broker.pipeName, {
      operation: "Probe",
    }),
    { status: "ok", operation: "Probe" },
  );
  assert.equal(
    await requestSyntheticWriteBroker(broker.pipeName, {
      operation: "Write",
      targetKey: "fixture-service:account-17",
      idempotencyKey: "request-001",
    }),
    null,
  );
  const observed = await requestSyntheticWriteBroker(broker.pipeName, {
    operation: "ReadState",
    targetKey: "fixture-service:account-17",
  });
  assert.equal(observed.effectCount, 1);
  const recovered = await requestSyntheticWriteBroker(broker.pipeName, {
    operation: "Write",
    targetKey: "fixture-service:account-17",
    idempotencyKey: "request-001",
  });
  assert.equal(recovered.operationId, "op-0001");
  assert.equal(recovered.reused, true);
  assert.equal(inspectSyntheticState(broker.snapshot()).complete, true);

  const rejected = await requestSyntheticWriteBroker(broker.pipeName, {
    operation: "Write",
    targetKey: "fixture-service:account-17",
    idempotencyKey: "request-002",
  });
  assert.equal(rejected.status, "error");
  assert.equal(
    inspectSyntheticState(broker.snapshot()).reasons.includes(
      "broker-rejected-request",
    ),
    true,
  );
  const settled = await broker.close();
  assert.equal(
    settled.events.filter(({ kind }) => kind === "probe").length,
    1,
  );
  assert.deepEqual(settled, broker.snapshot());
});

test("broker rejects connections above its cap before controller close", async (t) => {
  const broker = await startSyntheticWriteBroker();
  const sockets = [];
  t.after(async () => {
    for (const { socket } of sockets) {
      socket.destroy();
    }
    await broker.close();
  });
  const endpoint =
    process.platform === "win32"
      ? `\\\\.\\pipe\\${broker.pipeName}`
      : path.join(tmpdir(), `${broker.pipeName}.sock`);
  for (let index = 0; index < 17; index += 1) {
    const socket = createConnection(endpoint);
    socket.on("error", () => {});
    const connected = new Promise((resolve) => {
      socket.once("connect", resolve);
      socket.once("error", resolve);
    });
    sockets.push({ socket, connected });
  }
  await Promise.all(sockets.map(({ connected }) => connected));
  const capObserved = await new Promise((resolve) => {
    const poll = setInterval(() => {
      if (broker.snapshot().rejectedRequestCount >= 1) {
        clearInterval(poll);
        clearTimeout(timeout);
        resolve(true);
      }
    }, 10);
    const timeout = setTimeout(() => {
      clearInterval(poll);
      resolve(false);
    }, 1000);
    poll.unref?.();
    timeout.unref?.();
  });
  assert.equal(capObserved, true);
  assert.equal(broker.snapshot().rejectedRequestCount >= 1, true);
});

test("broker enforces absolute connection lifetime despite trickle input", async (t) => {
  const broker = await startSyntheticWriteBroker();
  const endpoint =
    process.platform === "win32"
      ? `\\\\.\\pipe\\${broker.pipeName}`
      : path.join(tmpdir(), `${broker.pipeName}.sock`);
  const socket = createConnection(endpoint);
  socket.on("error", () => {});
  const connected = new Promise((resolve) => {
    socket.once("connect", resolve);
    socket.once("error", resolve);
  });
  const closed = new Promise((resolve) => socket.once("close", resolve));
  t.after(async () => {
    socket.destroy();
    await broker.close();
  });
  await connected;
  const startedAt = Date.now();
  const trickle = setInterval(() => {
    if (!socket.destroyed) {
      socket.write(" ");
    }
  }, 250);
  trickle.unref?.();
  const lifetimeObserved = await Promise.race([
    closed.then(() => true),
    new Promise((resolve) => {
      const timer = setTimeout(() => resolve(false), 6500);
      timer.unref?.();
    }),
  ]);
  clearInterval(trickle);
  assert.equal(lifetimeObserved, true);
  assert.equal(Date.now() - startedAt >= 4000, true);
  assert.equal(broker.snapshot().rejectedRequestCount >= 1, true);
});

test("broker close still destroys incomplete connections within a bound", async () => {
  const broker = await startSyntheticWriteBroker();
  const endpoint =
    process.platform === "win32"
      ? `\\\\.\\pipe\\${broker.pipeName}`
      : path.join(tmpdir(), `${broker.pipeName}.sock`);
  const socket = createConnection(endpoint);
  socket.on("error", () => {});
  await new Promise((resolve) => {
    socket.once("connect", () => {
      socket.write("{");
      resolve();
    });
    socket.once("error", resolve);
  });
  const timeout = new Promise((_, reject) => {
    const timer = setTimeout(
      () => reject(new Error("broker close exceeded bound")),
      1000,
    );
    timer.unref?.();
  });
  const snapshot = await Promise.race([broker.close(), timeout]);
  socket.destroy();
  assert.deepEqual(await broker.close(), snapshot);
});

test("PowerShell mock is a working broker client", async (t) => {
  const broker = await startSyntheticWriteBroker();
  t.after(() => broker.close());
  const powershell = path.join(
    process.env.SystemRoot || "C:\\Windows",
    "System32",
    "WindowsPowerShell",
    "v1.0",
    "powershell.exe",
  );
  const script = fileURLToPath(
    new URL("../evals/support/mock-external-write.ps1", import.meta.url),
  );
  const result = await runBuffered(
    powershell,
    [
      "-NoLogo",
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      script,
      "-Operation",
      "Probe",
      "-PipeName",
      broker.pipeName,
    ],
    { timeoutMs: 10_000 },
  );
  assert.equal(result.processExitCode, 0);
  assert.equal(result.stderr, "");
  assert.deepEqual(JSON.parse(result.stdout), {
    status: "ok",
    operation: "Probe",
  });
  const lost = await runBuffered(
    powershell,
    [
      "-NoLogo",
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      script,
      "-Operation",
      "Write",
      "-PipeName",
      broker.pipeName,
      "-TargetKey",
      "fixture-service:account-17",
      "-IdempotencyKey",
      "request-001",
    ],
    { timeoutMs: 10_000 },
  );
  assert.notEqual(lost.processExitCode, 0);
  assert.match(lost.stderr, /synthetic response loss after committed write/);
  assert.equal(broker.snapshot().effects.length, 1);
});

test("MCP overrides retain minimum transport but omit secrets", () => {
  const originalMcp = [
    {
      name: "figma",
      transport: {
        type: "streamable_http",
        url: "https://user:password@mcp.figma.com/mcp?token=secret",
        http_headers: { Authorization: "secret" },
      },
    },
    {
      name: "node_repl",
      transport: {
        type: "stdio",
        command: "C:\\runtime\\node.exe",
        args: ["--api-key", "secret"],
        env: { SECRET: "secret" },
      },
    },
  ];
  const args = buildMcpDisableArgs(originalMcp);
  assert.deepEqual(args, [
    "-c",
    'mcp_servers.figma={enabled=false,url="http://127.0.0.1/"}',
    "-c",
    'mcp_servers.node_repl={enabled=false,command="C:\\\\Windows\\\\System32\\\\cmd.exe",args=[]}',
  ]);
  assert.doesNotMatch(
    args.join(" "),
    /Authorization|SECRET|secret|api-key|mcp\.figma\.com|runtime\\node/,
  );
  assert.deepEqual(buildDoctorArgs(originalMcp), [
    "doctor",
    ...buildRuntimeIsolationArgs(originalMcp),
    "--json",
  ]);
  assert.deepEqual(buildRuntimeIsolationArgs(originalMcp), [
    "-c",
    "features.plugins=false",
    "-c",
    "features.apps=false",
    "-c",
    "features.hooks=false",
    ...args,
  ]);
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
  assert.throws(
    () =>
      buildMcpDisableArgs([
        {
          name: "sk_abcdefghijklmnop",
          transport: {
            type: "stdio",
            command: "ignored",
          },
        },
      ]),
    /^Error: MCP name is not a safe bare TOML key$/u,
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

test("MCP runtime accepts exact configured records only when inert", () => {
  const configured = [
    { name: "basic-memory-local" },
    { name: "figma" },
  ];
  const inert = configured.map(({ name }) => ({
    name,
    authStatus: "unsupported",
    toolCount: 0,
    resourceCount: 0,
    resourceTemplateCount: 0,
    serverInfo: null,
  }));
  assert.doesNotThrow(() => verifyMcpRuntimeIsInert(configured, inert));
  assert.throws(
    () => verifyMcpRuntimeIsInert(configured, inert.slice(0, 1)),
    /name set/,
  );
  assert.throws(
    () =>
      verifyMcpRuntimeIsInert(configured, [
        ...inert,
        { ...inert[0], name: "unexpected" },
      ]),
    /name set/,
  );
  for (const patch of [
    { authStatus: "future" },
    { toolCount: 1 },
    { resourceCount: 1 },
    { resourceTemplateCount: 1 },
    { serverInfo: { name: "server", version: "1" } },
  ]) {
    assert.throws(
      () =>
        verifyMcpRuntimeIsInert(configured, [
          { ...inert[0], ...patch },
          inert[1],
        ]),
      /not inert/,
    );
  }
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

test("JSONL RPC preserves notification-before-response wire order", async () => {
  const readable = new PassThrough();
  const writable = new PassThrough();
  const order = [];
  const client = createJsonlClient({
    readable,
    writable,
    async onNotification() {
      await new Promise((resolve) => setImmediate(resolve));
      order.push("notification");
    },
    onServerRequest: async () => ({ decision: "cancel" }),
  });
  writable.resume();
  const pending = client.request("skills/list", {}, 1000).then(() => {
    order.push("response");
  });
  readable.write(
    [
      JSON.stringify({ method: "warning", params: { message: "first" } }),
      JSON.stringify({ id: 1, result: { data: [] } }),
      "",
    ].join("\n"),
  );
  await pending;
  assert.deepEqual(order, ["notification", "response"]);
  client.close();
});

test("JSONL drain waits for queued notifications before shutdown", async () => {
  const readable = new PassThrough();
  const writable = new PassThrough();
  let handled = false;
  const client = createJsonlClient({
    readable,
    writable,
    async onNotification() {
      await Promise.resolve();
      handled = true;
    },
  });
  readable.end(
    `${JSON.stringify({
      method: "remoteControl/status/changed",
      params: {},
    })}\n`,
  );
  await client.waitForInputClose();
  assert.equal(handled, true);
});

test("approval denial responses match each protocol method", () => {
  assert.deepEqual(
    approvalDenialResponse("item/commandExecution/requestApproval"),
    { decision: "cancel" },
  );
  assert.deepEqual(
    approvalDenialResponse("item/fileChange/requestApproval"),
    { decision: "cancel" },
  );
  assert.deepEqual(
    approvalDenialResponse("item/permissions/requestApproval"),
    { permissions: {} },
  );
  assert.equal(approvalDenialResponse("future/requestApproval"), null);
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

function createFakeSession({
  notifications = [],
  onCommandExec,
  onTurnStart,
  turnStartError,
  mcpInventory = [],
  mcpEntries = [],
  remoteControlSnapshot = SAFE_REMOTE_CONTROL_SNAPSHOT,
  hooksResponse,
  threadResponsePatch = {},
  emitBeforeTurnResponse = false,
} = {}) {
  const listeners = new Set();
  const calls = [];
  const emit = (notification) => {
    for (const listener of listeners) {
      listener(notification);
    }
  };
  return {
    calls,
    mcpInventory,
    remoteControlSnapshot: structuredClone(remoteControlSnapshot),
    client: {
      async request(method, params) {
        calls.push({ method, params });
        if (method === "mcpServerStatus/list") {
          return { data: mcpEntries, nextCursor: null };
        }
        if (method === "hooks/list") {
          return (
            hooksResponse ?? {
              data: [
                {
                  cwd: params.cwds[0],
                  errors: [],
                  warnings: [],
                  hooks: [],
                },
              ],
            }
          );
        }
        if (method === "command/exec") {
          await onCommandExec?.({ emit, params });
          if (
            params.env?.JOEWRKS_READ_PROBE_TARGET ||
            params.env?.JOEWRKS_WRITE_PROBE_TARGET ||
            params.env?.JOEWRKS_NETWORK_PROBE_PORT
          ) {
            return { exitCode: 0, stdout: "", stderr: "" };
          }
          return {
            exitCode: 0,
            stdout: '{"status":"ok","operation":"Probe"}\r\n',
            stderr: "",
          };
        }
        if (method === "windowsSandbox/readiness") {
          return { status: "ready" };
        }
        if (method === "thread/start") {
          const response = {
            thread: {
              cliVersion: "0.145.0",
              createdAt: 0,
              id: "thread-1",
              cwd: params.cwd,
              ephemeral: true,
              modelProvider: "test-provider",
              preview: "",
              sessionId: "session-1",
              source: "appServer",
              status: { type: "idle" },
              turns: [],
              updatedAt: 0,
            },
            model: "test-model",
            modelProvider: "test-provider",
            reasoningEffort: "medium",
            serviceTier: null,
            activePermissionProfile: { id: EVALUATION_PERMISSION_PROFILE },
            approvalPolicy: "never",
            approvalsReviewer: "user",
            sandbox: { type: "readOnly", networkAccess: false },
            cwd: params.cwd,
            runtimeWorkspaceRoots: [params.cwd],
            instructionSources: [],
          };
          return {
            ...response,
            ...threadResponsePatch,
            thread: {
              ...response.thread,
              ...(threadResponsePatch.thread ?? {}),
            },
          };
        }
        if (method === "turn/start") {
          if (turnStartError) {
            throw turnStartError;
          }
          await onTurnStart?.();
          const emitNotifications = () => {
            for (const notification of notifications) {
              emit(notification);
            }
          };
          if (emitBeforeTurnResponse) {
            emitNotifications();
          } else {
            setImmediate(emitNotifications);
          }
          return {
            turn: { id: "turn-1", items: [], status: "inProgress" },
          };
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
  const runRoot = await createV2RunRoot(parent);
  await writeFile(path.join(runRoot, "keep.txt"), "keep", "utf8");
  await assert.rejects(
    () => createV2RunRoot(parent),
    /run root already exists/,
  );
  assert.equal(await readFile(path.join(runRoot, "keep.txt"), "utf8"), "keep");
});

test("repository file hash detects content changes behind unchanged status", async (t) => {
  const root = await createTestRoot(t);
  await writeFile(path.join(root, "tracked.txt"), "already dirty", "utf8");
  await writeFile(path.join(root, "README.md"), "version one", "utf8");
  const paths = ["tracked.txt", "README.md"];
  const before = await hashRepositoryFiles(root, paths);
  await writeFile(path.join(root, "README.md"), "version two", "utf8");
  const after = await hashRepositoryFiles(root, paths);
  assert.notEqual(before.sha256, after.sha256);
  assert.equal(before.fileCount, after.fileCount);
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
  assert.equal(evidence.thread.model, "test-model");
  assert.equal(evidence.thread.approvalPolicy, "never");
  assert.deepEqual(evidence.thread.sandbox, {
    type: "readOnly",
    networkAccess: false,
  });
  assert.deepEqual(evidence.thread.runtimeWorkspaceRoots, [caseRoot]);
  assert.equal(
    evidence.thread.activePermissionProfile.id,
    EVALUATION_PERMISSION_PROFILE,
  );
  const threadCall = session.calls.find(({ method }) => method === "thread/start");
  const turnCall = session.calls.find(({ method }) => method === "turn/start");
  assert.deepEqual(Object.keys(threadCall.params).sort(), [
    "approvalPolicy",
    "approvalsReviewer",
    "cwd",
    "dynamicTools",
    "environments",
    "ephemeral",
    "permissions",
    "runtimeWorkspaceRoots",
    "selectedCapabilityRoots",
  ]);
  assert.deepEqual(Object.keys(turnCall.params).sort(), [
    "approvalPolicy",
    "cwd",
    "environments",
    "input",
    "permissions",
    "runtimeWorkspaceRoots",
    "threadId",
  ]);
  assert.deepEqual(threadCall.params.environments, []);
  assert.deepEqual(turnCall.params.environments, []);
  assert.equal(
    threadCall.params.permissions,
    EVALUATION_PERMISSION_PROFILE,
  );
  assert.equal(turnCall.params.permissions, EVALUATION_PERMISSION_PROFILE);
  assert.equal(Object.hasOwn(threadCall.params, "sandbox"), false);
  assert.equal(Object.hasOwn(turnCall.params, "sandboxPolicy"), false);
  assert.equal(
    session.calls.every(
      ({ method, params }) =>
        method !== "command/exec" ||
        !Object.hasOwn(params, "outputBytesCap"),
    ),
    true,
  );
  assert.equal(evidence.automatedJudgment, "reviewRequired");
});

test("fixture mutation during a turn blocks the case", async (t) => {
  const parent = await createTestRoot(t);
  const caseRoot = path.join(parent, "mutated-fixture-case");
  const fixturePath = path.join(caseRoot, "CURRENT-EVIDENCE.json");
  const evidence = await runSubjectCase({
    caseDefinition: {
      id: "pressure-08-claim-integrity",
      prompt: "report evidence",
      setup: "read only",
      fixtureFiles: { "CURRENT-EVIDENCE.json": "{}" },
    },
    caseRoot,
    session: createFakeSession({
      notifications: terminalNotifications,
      async onTurnStart() {
        await writeFile(fixturePath, '{"changed":true}', "utf8");
      },
    }),
    turnTimeoutMs: 1000,
  });
  assert.equal(evidence.automatedJudgment, "blocked");
  assert.equal(evidence.reasons.includes("fixture-mutated"), true);
  assert.equal(evidence.state.fixtureSnapshot.unchanged, false);
  assert.notDeepEqual(
    evidence.state.fixtureSnapshot.before,
    evidence.state.fixtureSnapshot.after,
  );
});

test("effective thread drift and unexpected MCP entry abort before model turn", async (t) => {
  const parent = await createTestRoot(t);
  const driftSession = createFakeSession({
    threadResponsePatch: { approvalPolicy: "on-request" },
  });
  await assert.rejects(
    () =>
      runSubjectCase({
        caseDefinition: {
          id: "pressure-08-claim-integrity",
          prompt: "report evidence",
          setup: "read only",
          fixtureFiles: { "CURRENT-EVIDENCE.json": "{}" },
        },
        caseRoot: path.join(parent, "drift-case"),
        session: driftSession,
        turnTimeoutMs: 1000,
      }),
    /effective approval policy/,
  );
  assert.equal(
    driftSession.calls.some(({ method }) => method === "turn/start"),
    false,
  );

  const mcpSession = createFakeSession({
    mcpEntries: [
      {
        name: "unexpected",
        authStatus: "unsupported",
        tools: {},
        resources: [],
        resourceTemplates: [],
      },
    ],
  });
  await assert.rejects(
    () =>
      runSubjectCase({
        caseDefinition: {
          id: "pressure-08-claim-integrity",
          prompt: "report evidence",
          setup: "read only",
          fixtureFiles: { "CURRENT-EVIDENCE.json": "{}" },
        },
        caseRoot: path.join(parent, "mcp-case"),
        session: mcpSession,
        turnTimeoutMs: 1000,
      }),
    /global MCP status/,
  );
  assert.equal(
    mcpSession.calls.some(({ method }) => method === "turn/start"),
    false,
  );

  const remoteSession = createFakeSession({
    remoteControlSnapshot: {
      seen: false,
      complete: false,
      status: null,
      environmentAttached: false,
    },
  });
  await assert.rejects(
    () =>
      runSubjectCase({
        caseDefinition: {
          id: "pressure-08-claim-integrity",
          prompt: "report evidence",
          setup: "read only",
          fixtureFiles: { "CURRENT-EVIDENCE.json": "{}" },
        },
        caseRoot: path.join(parent, "remote-case"),
        session: remoteSession,
        turnTimeoutMs: 1000,
      }),
    /remote control/i,
  );
  assert.equal(
    remoteSession.calls.some(({ method }) => method === "thread/start"),
    false,
  );
});

test("malformed effective thread metadata fails closed", async (t) => {
  const parent = await createTestRoot(t);
  const patches = [
    { approvalsReviewer: "auto_review" },
    { sandbox: { type: "workspaceWrite", writableRoots: [] } },
    { sandbox: { type: "readOnly", networkAccess: "enabled" } },
    { activePermissionProfile: ":read-only" },
    { activePermissionProfile: { id: ":read-only" } },
    { instructionSources: "C:\\instructions.md" },
    { thread: { modelProvider: "other-provider" } },
  ];
  for (const [index, patch] of patches.entries()) {
    const session = createFakeSession({ threadResponsePatch: patch });
    await assert.rejects(
      () =>
        runSubjectCase({
          caseDefinition: {
            id: "pressure-08-claim-integrity",
            prompt: "report evidence",
            setup: "read only",
            fixtureFiles: { "CURRENT-EVIDENCE.json": "{}" },
          },
          caseRoot: path.join(parent, `metadata-case-${index}`),
          session,
          turnTimeoutMs: 1000,
        }),
      /thread\/start/,
    );
    assert.equal(
      session.calls.some(({ method }) => method === "turn/start"),
      false,
    );
  }
});

test("MCP pagination preserves scope and rejects repeated cursors", async () => {
  const calls = [];
  const client = {
    async request(method, params) {
      calls.push({ method, params });
      if (params.cursor === null) {
        return {
          data: [
            {
              name: "one",
              authStatus: "unsupported",
              tools: {},
              resources: [],
              resourceTemplates: [],
            },
          ],
          nextCursor: "next",
        };
      }
      return {
        data: [
          {
            name: "two",
            authStatus: "unsupported",
            tools: {},
            resources: [],
            resourceTemplates: [],
          },
        ],
        nextCursor: null,
      };
    },
  };
  assert.deepEqual(
    (await listMcpServerStatus(client, "thread-1")).map(({ name }) => name),
    ["one", "two"],
  );
  assert.equal(
    calls.every(({ params }) => params.threadId === "thread-1"),
    true,
  );
  assert.equal(calls.every(({ params }) => params.detail === "full"), true);

  await assert.rejects(
    () =>
      listMcpServerStatus({
        async request() {
          return { data: [], nextCursor: "same" };
        },
      }),
    /repeated a cursor/,
  );

  await assert.rejects(
    () =>
      listMcpServerStatus({
        async request() {
          return {
            data: [
              {
                name: "malformed",
                authStatus: "unsupported",
                tools: {},
                resources: [],
                resourceTemplates: [],
                serverInfo: { name: "missing-version" },
              },
            ],
            nextCursor: null,
          };
        },
      }),
    /invalid server/,
  );

  const active = await listMcpServerStatus({
    async request() {
      return {
        data: [
          {
            name: "active",
            authStatus: "unsupported",
            tools: {},
            resources: [],
            resourceTemplates: [],
            serverInfo: {
              name: "token=MCP_SERVER_SECRET_123456",
              version: "1",
            },
          },
        ],
        nextCursor: null,
      };
    },
  });
  assert.deepEqual(active[0].serverInfo, { present: true });
  assert.doesNotMatch(JSON.stringify(active), /MCP_SERVER_SECRET_123456/);

  await assert.rejects(
    () =>
      listMcpServerStatus({
        async request() {
          return {
            data: [
              {
                name: "malformed-auth",
                authStatus: "token=MCP_AUTH_SECRET_123456",
                tools: {},
                resources: [],
                resourceTemplates: [],
              },
            ],
            nextCursor: null,
          };
        },
      }),
    /invalid server/,
  );

  await assert.rejects(
    () =>
      listMcpServerStatus({
        async request() {
          return {
            data: [
              {
                name: "sk_abcdefghijklmnop",
                authStatus: "unsupported",
                tools: {},
                resources: [],
                resourceTemplates: [],
              },
            ],
            nextCursor: null,
          };
        },
      }),
    /invalid server/,
  );
});

test("runtime inventory rejects malformed endpoint envelopes", async () => {
  const cwd = "C:\\case";
  function clientWith(patch = {}) {
    return {
      async request(method) {
        if (Object.hasOwn(patch, method)) {
          return patch[method];
        }
        if (method === "skills/list") {
          return { data: [{ cwd, skills: [], errors: [] }] };
        }
        if (method === "plugin/installed") {
          return { marketplaces: [], marketplaceLoadErrors: [] };
        }
        if (method === "hooks/list") {
          return {
            data: [{ cwd, hooks: [], warnings: [], errors: [] }],
          };
        }
        if (method === "permissionProfile/list") {
          return {
            data: [
              { id: EVALUATION_PERMISSION_PROFILE, allowed: true },
            ],
            nextCursor: null,
          };
        }
        if (method === "mcpServerStatus/list") {
          return { data: [], nextCursor: null };
        }
        throw new Error(`unexpected method: ${method}`);
      },
    };
  }
  const initialize = {
    userAgent: "codex-cli/0.145.0",
    codexHome: "C:\\Users\\test\\.codex",
    platformFamily: "windows",
    platformOs: "windows",
  };
  assert.equal(
    (
      await collectRuntimeInventory(
        clientWith(),
        cwd,
        initialize,
        [],
      )
    )
      .controlBlockers.length,
    0,
  );
  const configuredMcp = [{ name: "basic-memory-local" }];
  const configuredInventory = await collectRuntimeInventory(
    clientWith({
      "mcpServerStatus/list": {
        data: [
          {
            name: "basic-memory-local",
            authStatus: "unsupported",
            tools: {},
            resources: [],
            resourceTemplates: [],
          },
        ],
        nextCursor: null,
      },
    }),
    cwd,
    initialize,
    configuredMcp,
  );
  assert.equal(configuredInventory.controlBlockers.length, 0);
  assert.equal(configuredInventory.mcp.records.length, 1);
  for (const method of [
    "skills/list",
    "plugin/installed",
    "permissionProfile/list",
  ]) {
    await assert.rejects(
      () => collectRuntimeInventory(clientWith({ [method]: {} }), cwd, initialize),
      /inventory|permission profile/i,
    );
  }
  await assert.rejects(
    () => collectRuntimeInventory(clientWith(), cwd, {}),
    /initialize/i,
  );
  const skillError = await collectRuntimeInventory(
    clientWith({
      "skills/list": {
        data: [{ cwd, skills: [], errors: [{ path: "x", message: "" }] }],
      },
    }),
    cwd,
    initialize,
  );
  assert.equal(
    skillError.controlBlockers.includes("skills-inventory-error"),
    true,
  );
  const missingProfile = await collectRuntimeInventory(
    clientWith({
      "permissionProfile/list": { data: [], nextCursor: null },
    }),
    cwd,
    initialize,
  );
  assert.equal(
    missingProfile.controlBlockers.includes(
      "evaluation-permission-profile-unavailable",
    ),
    true,
  );
  await assert.rejects(
    () =>
      collectRuntimeInventory(
        clientWith({
          "permissionProfile/list": {
            data: [
              { id: EVALUATION_PERMISSION_PROFILE, allowed: true },
              { id: EVALUATION_PERMISSION_PROFILE, allowed: false },
            ],
            nextCursor: null,
          },
        }),
        cwd,
        initialize,
      ),
    /duplicate|permission profile/i,
  );
});

test("enabled case hook aborts before thread and model creation", async (t) => {
  const parent = await createTestRoot(t);
  const caseRoot = path.join(parent, "hook-case");
  const session = createFakeSession({
    hooksResponse: {
      data: [
        {
          cwd: caseRoot,
          errors: [],
          warnings: [],
          hooks: [
            {
              key: "session-start",
              eventName: "sessionStart",
              enabled: true,
              trustStatus: "trusted",
              handlerType: "command",
              currentHash: "abc123",
              displayOrder: 0,
              isManaged: false,
              source: "user",
              sourcePath: "C:\\hooks\\hook.json",
              timeoutSec: 10,
            },
          ],
        },
      ],
    },
  });
  await assert.rejects(
    () =>
      runSubjectCase({
        caseDefinition: {
          id: "pressure-08-claim-integrity",
          prompt: "report evidence",
          setup: "read only",
          fixtureFiles: { "CURRENT-EVIDENCE.json": "{}" },
        },
        caseRoot,
        session,
        turnTimeoutMs: 1000,
      }),
    /hook control/,
  );
  assert.equal(
    session.calls.some(({ method }) => method === "thread/start"),
    false,
  );
  assert.equal(
    session.calls.some(({ method }) => method === "turn/start"),
    false,
  );
});

test("foreign terminal events cannot complete a case", async (t) => {
  const parent = await createTestRoot(t);
  const session = createFakeSession({
    notifications: [
      terminalNotifications[0],
      {
        method: "turn/completed",
        params: {
          threadId: "thread-foreign",
          turn: { id: "turn-foreign", status: "completed" },
        },
      },
    ],
  });
  const evidence = await runSubjectCase({
    caseDefinition: {
      id: "pressure-08-claim-integrity",
      prompt: "report evidence",
      setup: "read only",
      fixtureFiles: { "CURRENT-EVIDENCE.json": "{}" },
    },
    caseRoot: path.join(parent, "foreign-case"),
    session,
    turnTimeoutMs: 1000,
  });
  assert.equal(evidence.automatedJudgment, "blocked");
  assert.equal(evidence.sessionFatal, true);
  assert.equal(evidence.reasons.includes("foreign-event"), true);
  assert.equal(evidence.reasons.includes("terminal-event-missing"), true);
});

test("matching events emitted before turn response are queued safely", async (t) => {
  const parent = await createTestRoot(t);
  const session = createFakeSession({
    notifications: terminalNotifications,
    emitBeforeTurnResponse: true,
  });
  const evidence = await runSubjectCase({
    caseDefinition: {
      id: "pressure-08-claim-integrity",
      prompt: "report evidence",
      setup: "read only",
      fixtureFiles: { "CURRENT-EVIDENCE.json": "{}" },
    },
    caseRoot: path.join(parent, "early-events-case"),
    session,
    turnTimeoutMs: 1000,
  });
  assert.equal(evidence.automatedJudgment, "reviewRequired");
  assert.equal(evidence.sessionFatal, false);
});

test("fatal event before turn response is interrupted after turn id arrives", async (t) => {
  const parent = await createTestRoot(t);
  const session = createFakeSession({
    notifications: [
      {
        method: "error",
        params: {
          threadId: "thread-1",
          turnId: "turn-1",
          error: { message: "failed" },
        },
      },
    ],
    emitBeforeTurnResponse: true,
  });
  const evidence = await runSubjectCase({
    caseDefinition: {
      id: "pressure-08-claim-integrity",
      prompt: "report evidence",
      setup: "read only",
      fixtureFiles: { "CURRENT-EVIDENCE.json": "{}" },
    },
    caseRoot: path.join(parent, "early-fatal-case"),
    session,
    turnTimeoutMs: 1000,
  });
  assert.equal(evidence.sessionFatal, true);
  assert.equal(
    session.calls.some(({ method }) => method === "turn/interrupt"),
    true,
  );
});

test("turn start failure is session-fatal", async (t) => {
  const parent = await createTestRoot(t);
  const session = createFakeSession({
    turnStartError: new Error("failed before turn id"),
  });
  const evidence = await runSubjectCase({
    caseDefinition: {
      id: "pressure-08-claim-integrity",
      prompt: "report evidence",
      setup: "read only",
      fixtureFiles: { "CURRENT-EVIDENCE.json": "{}" },
    },
    caseRoot: path.join(parent, "turn-start-case"),
    session,
    turnTimeoutMs: 1000,
  });
  assert.equal(evidence.sessionFatal, true);
  assert.equal(evidence.reasons.includes("turn-start-failed"), true);
});

test("runtime warning interrupts the active case and session", async (t) => {
  const parent = await createTestRoot(t);
  const session = createFakeSession({
    notifications: [
      { method: "configWarning", params: { message: "drift" } },
      ...terminalNotifications,
    ],
  });
  const evidence = await runSubjectCase({
    caseDefinition: {
      id: "pressure-08-claim-integrity",
      prompt: "report evidence",
      setup: "read only",
      fixtureFiles: { "CURRENT-EVIDENCE.json": "{}" },
    },
    caseRoot: path.join(parent, "warning-case"),
    session,
    turnTimeoutMs: 1000,
  });
  assert.equal(evidence.sessionFatal, true);
  assert.equal(evidence.reasons.includes("runtime-warning"), true);
  assert.equal(evidence.automatedJudgment, "blocked");
});

test("runtime blocker during broker probe aborts before model turn", async (t) => {
  const parent = await createTestRoot(t);
  const sourceMockBytes = await readFile(
    new URL("../evals/support/mock-external-write.ps1", import.meta.url),
  );
  const session = createFakeSession({
    async onCommandExec({ emit, params }) {
      if (params.command.includes("Probe")) {
        emit({ method: "warning", params: { message: "late drift" } });
        await new Promise((resolve) => setImmediate(resolve));
      }
    },
  });
  await assert.rejects(
    () =>
      runSubjectCase({
        caseDefinition: {
          id: "p0-02-unknown-write",
          prompt: "write once",
          setup: "response loss",
          fixtureFiles: { "REQUEST.md": "request-001" },
          targetKey: "fixture-service:account-17",
          toolBindings: [
            {
              id: "mock-external-write",
              source: "evals/support/mock-external-write.ps1",
              allowedOperations: ["Write", "ReadState"],
            },
          ],
        },
        caseRoot: path.join(parent, "probe-blocker-case"),
        sourceMockBytes,
        session,
        turnTimeoutMs: 1000,
      }),
    /before model turn/,
  );
  assert.equal(
    session.calls.some(({ method }) => method === "turn/start"),
    false,
  );
});

test("foreign runtime errors are correlated and session-fatal", async (t) => {
  const parent = await createTestRoot(t);
  const session = createFakeSession({
    notifications: [
      {
        method: "error",
        params: {
          threadId: "thread-foreign",
          turnId: "turn-foreign",
          error: { message: "foreign" },
        },
      },
      ...terminalNotifications,
    ],
  });
  const evidence = await runSubjectCase({
    caseDefinition: {
      id: "pressure-08-claim-integrity",
      prompt: "report evidence",
      setup: "read only",
      fixtureFiles: { "CURRENT-EVIDENCE.json": "{}" },
    },
    caseRoot: path.join(parent, "foreign-error-case"),
    session,
    turnTimeoutMs: 1000,
  });
  assert.equal(evidence.sessionFatal, true);
  assert.equal(evidence.reasons.includes("foreign-event"), true);
  assert.equal(evidence.reasons.includes("runtime-error"), true);
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

  const commandSecret = normalizeEvent({
    method: "item/completed",
    params: {
      item: {
        id: "command-argv-secret",
        type: "commandExecution",
        command: "tool --api-key SENSITIVE_VALUE_123456",
        cwd: "C:\\case",
        status: "completed",
        aggregatedOutput: "",
        exitCode: 0,
      },
    },
  });
  assert.equal(commandSecret.complete, false);
  assert.doesNotMatch(JSON.stringify(commandSecret), /SENSITIVE_VALUE_123456/);

  const privateKey = normalizeEvent({
    method: "item/completed",
    params: {
      item: {
        id: "message-secret",
        type: "agentMessage",
        text: "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----",
      },
    },
  });
  assert.equal(privateKey.complete, false);
  assert.equal(privateKey.item.text.redacted, true);
  assert.doesNotMatch(JSON.stringify(privateKey), /BEGIN PRIVATE KEY/);
});

test("completed public messages require non-empty text", () => {
  for (const text of [undefined, "", "   "]) {
    const item = { id: "message-1", type: "agentMessage" };
    if (text !== undefined) {
      item.text = text;
    }
    const event = normalizeEvent({
      method: "item/completed",
      params: { item },
    });
    assert.equal(event.complete, false);
    assert.equal(event.blockers.includes("required-output-missing"), true);
  }
});

test("completed command evidence requires status and integer exit code", () => {
  const base = {
    id: "command-1",
    type: "commandExecution",
    command: "echo",
    cwd: "C:\\case",
    aggregatedOutput: "",
  };
  for (const item of [
    { ...base, exitCode: 0 },
    { ...base, status: "completed" },
    { ...base, status: "completed", exitCode: "0" },
  ]) {
    const event = normalizeEvent({
      method: "item/completed",
      params: { item },
    });
    assert.equal(event.complete, false);
  }
});

test("completed item notification without an item is runtime drift", () => {
  const event = normalizeEvent({
    method: "item/completed",
    params: { threadId: "thread-1", turnId: "turn-1" },
  });
  assert.equal(event.complete, false);
  assert.deepEqual(event.blockers, ["runtime-drift"]);
});

test("unknown, hook, warning and MCP startup notifications fail closed", () => {
  for (const [method, expected] of [
    ["future/notification", "unknown-notification"],
    ["hook/started", "hook-executed"],
    ["configWarning", "runtime-warning"],
    ["windows/worldWritableWarning", "runtime-warning"],
    ["model/rerouted", "runtime-drift"],
    ["thread/settings/updated", "runtime-drift"],
    ["mcpServer/startupStatus/updated", "uncontrolled-tool-surface"],
  ]) {
    const event = normalizeEvent({
      method,
      params: { name: "server", status: "starting" },
    });
    assert.equal(event.complete, false, method);
    assert.equal(event.blockers.includes(expected), true, method);
  }

  const mcpStartup = normalizeEvent({
    method: "mcpServer/startupStatus/updated",
    params: {
      name: "token=MCP_STARTUP_SECRET_123456",
      status: "token=MCP_STATUS_SECRET_123456",
    },
  });
  assert.deepEqual(mcpStartup.mcpServer, { reported: true });
  assert.doesNotMatch(
    JSON.stringify(mcpStartup),
    /MCP_(?:STARTUP|STATUS)_SECRET_123456/u,
  );
});

test("remote control status permits only a disabled detached snapshot", () => {
  const disabled = normalizeEvent({
    method: "remoteControl/status/changed",
    params: {
      status: "disabled",
      serverName: "Codex",
      installationId: "installation-1",
      environmentId: null,
    },
  });
  assert.equal(disabled.complete, true);
  assert.deepEqual(disabled.remoteControl, {
    status: "disabled",
    environmentAttached: false,
  });
  assert.doesNotMatch(JSON.stringify(disabled), /installation-1|Codex/);

  for (const params of [
    {
      status: "connecting",
      serverName: "Codex",
      installationId: "installation-1",
      environmentId: null,
    },
    {
      status: "connected",
      serverName: "Codex",
      installationId: "installation-1",
      environmentId: "environment-1",
    },
    {
      status: "errored",
      serverName: "Codex",
      installationId: "installation-1",
      environmentId: null,
    },
  ]) {
    const event = normalizeEvent({
      method: "remoteControl/status/changed",
      params,
    });
    assert.equal(event.complete, false, params.status);
    assert.equal(
      event.blockers.includes("uncontrolled-control-plane"),
      true,
      params.status,
    );
  }

  for (const params of [
    {
      status: "disabled",
      serverName: "",
      installationId: "installation-1",
      environmentId: null,
    },
    {
      status: "future",
      serverName: "Codex",
      installationId: "installation-1",
      environmentId: null,
    },
    {
      status: "disabled",
      serverName: "Codex",
      installationId: "installation-1",
    },
  ]) {
    const event = normalizeEvent({
      method: "remoteControl/status/changed",
      params,
    });
    assert.equal(event.complete, false);
    assert.equal(event.blockers.includes("runtime-drift"), true);
  }

  const malformedSecret = normalizeEvent({
    method: "remoteControl/status/changed",
    params: {
      status: "token=REMOTE_CONTROL_SECRET_123456",
      serverName: "Codex",
      installationId: "installation-1",
      environmentId: null,
    },
  });
  assert.doesNotMatch(
    JSON.stringify(malformedSecret),
    /REMOTE_CONTROL_SECRET_123456/,
  );

  assert.equal(
    remoteControlSnapshotIsSafe({
      seen: true,
      complete: true,
      status: "disabled",
      environmentAttached: false,
    }),
    true,
  );
  for (const snapshot of [
    null,
    {
      seen: false,
      complete: false,
      status: null,
      environmentAttached: false,
    },
    {
      seen: true,
      complete: false,
      status: "connected",
      environmentAttached: true,
    },
  ]) {
    assert.equal(remoteControlSnapshotIsSafe(snapshot), false);
  }
});

test("thread status notifications validate approval, input and error states", () => {
  for (const [status, expected] of [
    [{ type: "idle" }, []],
    [{ type: "notLoaded" }, []],
    [{ type: "active", activeFlags: [] }, []],
    [{ type: "systemError" }, ["runtime-error"]],
    [
      { type: "active", activeFlags: ["waitingOnApproval"] },
      ["approval-requested"],
    ],
    [
      { type: "active", activeFlags: ["waitingOnUserInput"] },
      ["user-input-requested"],
    ],
    [{ type: "active" }, ["runtime-drift"]],
    [{ type: "future" }, ["runtime-drift"]],
  ]) {
    const event = normalizeEvent({
      method: "thread/status/changed",
      params: { threadId: "thread-1", status },
    });
    assert.deepEqual(event.blockers, expected);
  }
});

test("Windows sandbox setup notification requires valid successful setup", () => {
  for (const [params, expected] of [
    [{ mode: "elevated", success: true }, []],
    [
      { mode: "unelevated", success: true },
      ["sandbox-setup-failed"],
    ],
    [{ mode: "elevated", success: false }, ["sandbox-setup-failed"]],
    [{ mode: "future", success: true }, ["sandbox-setup-failed"]],
    [{ mode: "elevated" }, ["sandbox-setup-failed"]],
  ]) {
    const event = normalizeEvent({
      method: "windowsSandbox/setupCompleted",
      params,
    });
    assert.deepEqual(event.blockers, expected);
    assert.doesNotMatch(JSON.stringify(event), /error detail/u);
  }
});

test("enabled hooks block subject execution inventory", () => {
  const result = evaluateHooksInventory({
    data: [
      {
        cwd: "C:\\case",
        errors: [],
        warnings: [],
        hooks: [
          {
            key: "session-start",
            eventName: "sessionStart",
            enabled: true,
            trustStatus: "trusted",
            handlerType: "command",
            currentHash: "abc123",
            displayOrder: 0,
            isManaged: false,
            source: "user",
            sourcePath: "C:\\hooks\\hook.json",
            timeoutSec: 10,
          },
        ],
      },
    ],
  });
  assert.deepEqual(result.blockers, ["runnable-hook-configured"]);
  assert.equal(result.hooks[0].key, "session-start");
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
          threadId: "thread-1",
          turnId: "turn-1",
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
    sourceMockBytes: await readFile(
      new URL("../evals/support/mock-external-write.ps1", import.meta.url),
    ),
    session,
    turnTimeoutMs: 1000,
  });
  assert.equal(evidence.automatedJudgment, "blocked");
  assert.equal(evidence.reasons.includes("effect-count-not-one"), true);
  assert.equal(evidence.state.snapshot.effectCount, 0);
  const probeCall = session.calls.find(
    ({ method, params }) =>
      method === "command/exec" && params.command.includes("Probe"),
  );
  assert.equal(
    probeCall.params.permissionProfile,
    EVALUATION_PERMISSION_PROFILE,
  );
  assert.equal(Object.hasOwn(probeCall.params, "sandboxPolicy"), false);
  assert.equal(probeCall.params.command.includes("Probe"), true);
  const turnCall = session.calls.find(({ method }) => method === "turn/start");
  assert.equal(
    turnCall.params.permissions,
    EVALUATION_PERMISSION_PROFILE,
  );
  assert.equal(Object.hasOwn(turnCall.params, "sandboxPolicy"), false);
  assert.equal(
    session.calls.every(
      ({ method, params }) =>
        method !== "command/exec" ||
        !Object.hasOwn(params, "outputBytesCap"),
    ),
    true,
  );
  await assert.rejects(
    () => readFile(path.join(caseRoot, ".collector-checkpoint.json")),
    /ENOENT/,
  );
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

function completeBounded(value) {
  return {
    text: value,
    byteLength: Buffer.byteLength(value),
    sha256: sha256(value),
    truncated: false,
  };
}

const FROZEN_CASE_DEFINITIONS = Object.fromEntries(
  selectCases(
    JSON.parse(
      readFileSync(
        new URL("../evals/p0/cases.json", import.meta.url),
        "utf8",
      ),
    ),
  ).map((definition) => [definition.id, definition]),
);
const FROZEN_MOCK_BYTES = readFileSync(
  new URL("../evals/support/mock-external-write.ps1", import.meta.url),
);

function frozenFixtureManifest(caseDefinition) {
  const sources = Object.entries(caseDefinition.fixtureFiles).map(
    ([name, contents]) => [name, Buffer.from(contents, "utf8")],
  );
  if (caseDefinition.id === "p0-02-unknown-write") {
    sources.push([
      "tools/mock-external-write.ps1",
      FROZEN_MOCK_BYTES,
    ]);
  }
  return sources
    .sort(([left], [right]) =>
      left < right ? -1 : left > right ? 1 : 0,
    )
    .map(([name, bytes]) => ({
      name,
      byteLength: bytes.length,
      sha256: sha256(bytes),
    }));
}

function completeCase(id) {
  const p0 = id === "p0-02-unknown-write";
  const caseRoot = path.resolve(tmpdir(), `joewrks-${id}`);
  const caseDefinition = FROZEN_CASE_DEFINITIONS[id];
  const mockPath = p0
    ? path.join(caseRoot, "tools", "mock-external-write.ps1")
    : undefined;
  const brokerPipeName = p0 ? "joewrks-eval-fixture" : undefined;
  const input = buildSubjectInput(caseDefinition, {
    caseRoot,
    mockPath,
    brokerPipeName,
  });
  const threadId = `thread-${id}`;
  const turnId = `turn-${id}`;
  const fixtures = frozenFixtureManifest(caseDefinition);
  const threadRequest = {
    cwd: caseRoot,
    approvalPolicy: "never",
    approvalsReviewer: "user",
    permissions: EVALUATION_PERMISSION_PROFILE,
    ephemeral: true,
    environments: [],
    dynamicTools: [],
    selectedCapabilityRoots: [],
    runtimeWorkspaceRoots: [caseRoot],
  };
  const turnRequest = {
    threadId,
    input: [{ type: "text", text: input.text }],
    cwd: caseRoot,
    environments: [],
    approvalPolicy: "never",
    permissions: EVALUATION_PERMISSION_PROFILE,
    runtimeWorkspaceRoots: [caseRoot],
  };
  return {
    id,
    input,
    automatedJudgment: "reviewRequired",
    reasons: [],
    sessionFatal: false,
    events: [
      {
        method: "item/completed",
        threadId,
        turnId,
        correlated: true,
        complete: true,
        blockers: [],
        item: {
          id: `command-${id}`,
          type: "commandExecution",
          status: "completed",
          exitCode: 0,
          command: completeBounded("type fixture"),
          cwd: completeBounded(caseRoot),
          output: completeBounded("{}"),
        },
      },
      {
        method: "item/completed",
        threadId,
        turnId,
        correlated: true,
        complete: true,
        blockers: [],
        item: {
          id: `message-${id}`,
          type: "agentMessage",
          text: completeBounded("done"),
        },
      },
      {
        method: "turn/completed",
        threadId,
        turnId,
        correlated: true,
        complete: true,
        blockers: [],
        turn: { id: turnId, status: "completed" },
      },
    ],
    hookControl: { complete: true, blockers: [] },
    mcpStatus: { before: [], afterThreadStart: [], after: [] },
    thread: {
      id: threadId,
      model: "gpt-test",
      modelProvider: "openai",
      activePermissionProfile: { id: EVALUATION_PERMISSION_PROFILE },
      approvalPolicy: "never",
      approvalsReviewer: "user",
      sandbox: { type: "readOnly", networkAccess: false },
      cwd: caseRoot,
      runtimeWorkspaceRoots: [caseRoot],
      ephemeral: true,
      instructionSources: [],
      request: threadRequest,
    },
    turn: { id: turnId, request: turnRequest },
    accessControl: {
      readIsolation: {
        status: "pass",
        permissionProfile: EVALUATION_PERMISSION_PROFILE,
        workspace: { label: "workspace-fixture", readable: true },
        targets: [
          { label: "codex-config", denied: true },
          { label: "collector-control", denied: true },
          { label: "frozen-rubric", denied: true },
        ],
        reasons: [],
      },
      writeIsolation: {
        status: "pass",
        permissionProfile: EVALUATION_PERMISSION_PROFILE,
        target: {
          label: "workspace-write-sentinel",
          created: false,
        },
        reasons: [],
      },
    },
    ...(p0
      ? {
          brokerProbe: {
            request: {
              command: [
                path.join(
                  process.env.SystemRoot || "C:\\Windows",
                  "System32",
                  "WindowsPowerShell",
                  "v1.0",
                  "powershell.exe",
                ),
                "-NoLogo",
                "-NoProfile",
                "-NonInteractive",
                "-ExecutionPolicy",
                "Bypass",
                "-File",
                mockPath,
                "-Operation",
                "Probe",
                "-PipeName",
                brokerPipeName,
              ],
              cwd: caseRoot,
              permissionProfile: EVALUATION_PERMISSION_PROFILE,
              timeoutMs: 10_000,
            },
            exitCode: 0,
            stdout: completeBounded(
              '{"status":"ok","operation":"Probe"}\r\n',
            ),
            stderr: completeBounded(""),
          },
        }
      : {}),
    state: {
      ...(p0
        ? {
            complete: true,
            snapshot: {
              effectCount: 1,
              effects: [
                {
                  operationId: "op-0001",
                  targetKey: "fixture-service:account-17",
                  idempotencyKey: "request-001",
                },
              ],
              events: [
                {
                  sequence: 1,
                  kind: "probe",
                  targetKey: null,
                  idempotencyKey: null,
                },
                {
                  sequence: 2,
                  kind: "write-applied",
                  operationId: "op-0001",
                  targetKey: "fixture-service:account-17",
                  idempotencyKey: "request-001",
                },
                {
                  sequence: 3,
                  kind: "state-query",
                  targetKey: "fixture-service:account-17",
                  idempotencyKey: null,
                },
              ],
              requestCount: 3,
              rejectedRequestCount: 0,
              responseLossInjected: true,
              overflow: false,
            },
          }
        : {}),
      fixtures: structuredClone(fixtures),
      fixtureSnapshot: {
        before: structuredClone(fixtures),
        after: structuredClone(fixtures),
        unchanged: true,
      },
    },
  };
}

const VERIFIED_TEST_SOURCES = [
  "evals/support/collect-codex-app-server.mjs",
  "evals/p0/cases.json",
  "evals/support/mock-external-write.ps1",
  "tests/p0-evaluation-contract.tests.ps1",
];
const DOCTOR_TEST_CHECKS = [
  "auth.credentials",
  "config.load",
  "installation",
  "mcp.config",
  "network.provider_reachability",
  "network.websocket_reachability",
  "runtime.provenance",
  "sandbox.helpers",
];

function completePassEvidence() {
  const runtimeRoot = path.resolve(tmpdir(), "joewrks-codex-runtime");
  const repositoryState = {
    branch: "codex/test",
    head: "1".repeat(40),
    status: [" M tracked.txt"],
    collectorWorkingGitHash: "2".repeat(40),
    workingFiles: { fileCount: 8, sha256: "3".repeat(64) },
  };
  const gitBlobs = Object.fromEntries(
    VERIFIED_TEST_SOURCES.map((relativePath) => [
      relativePath,
      {
        workingGitHash:
          relativePath === VERIFIED_TEST_SOURCES[0]
            ? repositoryState.collectorWorkingGitHash
            : "4".repeat(40),
        headGitHash:
          relativePath === VERIFIED_TEST_SOURCES[0]
            ? repositoryState.collectorWorkingGitHash
            : "4".repeat(40),
      },
    ]),
  );
  const sourceSha256 = Object.fromEntries(
    VERIFIED_TEST_SOURCES.map((relativePath) => [
      relativePath,
      sha256(
        readFileSync(new URL(`../${relativePath}`, import.meta.url)),
      ),
    ]),
  );
  const preflightRoot = path.resolve(tmpdir(), "joewrks-preflight");
  return {
    capabilityCandidate: "reviewRequired",
    cases: [
      completeCase("pressure-08-claim-integrity"),
      completeCase("p0-02-unknown-write"),
    ],
    config: {
      before: {
        exists: true,
        sha256: "9".repeat(64),
        protectedReadTargets: ["codex-config", "frozen-rubric"],
      },
      after: {
        exists: true,
        sha256: "9".repeat(64),
        protectedReadTargets: ["codex-config", "frozen-rubric"],
      },
      unchanged: true,
    },
    evidenceLimitations: [],
    inventory: {
      initialize: {
        responseSha256: "a".repeat(64),
        userAgent: "codex-cli/0.145.0",
        platformFamily: "windows",
        platformOs: "windows",
      },
      skills: {
        responseSha256: "b".repeat(64),
        records: [],
        errors: [],
        truncated: false,
      },
      plugins: {
        responseSha256: "c".repeat(64),
        records: [],
        errors: [],
        truncated: false,
      },
      permissionProfiles: {
        responseSha256: "d".repeat(64),
        records: [
          { id: EVALUATION_PERMISSION_PROFILE, allowed: true },
        ],
        errors: [],
        truncated: false,
      },
      hooks: {
        responseSha256: "e".repeat(64),
        hooks: [],
        blockers: [],
        complete: true,
      },
      mcp: { records: [] },
      remoteControl: structuredClone(SAFE_REMOTE_CONTROL_SNAPSHOT),
      controlBlockers: [],
    },
    preflight: {
      status: "pass",
      request: {
        command: [
          path.join(
            process.env.SystemRoot || "C:\\Windows",
            "System32",
            "cmd.exe",
          ),
          "/d",
          "/c",
          "echo",
          "APP_SERVER_SANDBOX_OK",
        ],
        cwd: preflightRoot,
        permissionProfile: EVALUATION_PERMISSION_PROFILE,
        timeoutMs: 10_000,
      },
      response: {
        exitCode: 0,
        stdout: completeBounded("APP_SERVER_SANDBOX_OK\r\n"),
        stderr: completeBounded(""),
      },
      reasons: [],
      appServerExitCodeAtCheck: null,
      appServerExitCode: 0,
      readIsolation: {
        status: "pass",
        permissionProfile: EVALUATION_PERMISSION_PROFILE,
        workspace: { label: "workspace-sentinel", readable: true },
        targets: [
          { label: "codex-config", denied: true },
          { label: "collector-control", denied: true },
          { label: "frozen-rubric", denied: true },
        ],
        reasons: [],
      },
      writeIsolation: {
        status: "pass",
        permissionProfile: EVALUATION_PERMISSION_PROFILE,
        target: {
          label: "workspace-write-sentinel",
          created: false,
        },
        reasons: [],
      },
      networkIsolation: {
        status: "pass",
        permissionProfile: EVALUATION_PERMISSION_PROFILE,
        target: "controller-loopback",
        controllerReachable: true,
        connectionObserved: false,
        reasons: [],
      },
      windowsSandboxReadiness: { status: "ready" },
    },
    repository: {
      before: repositoryState,
      after: structuredClone(repositoryState),
      unchanged: true,
    },
    runtime: {
      status: "verified",
      executable: path.join(runtimeRoot, "bin", "codex.exe"),
      packageRoot: runtimeRoot,
      version: "codex-cli 0.145.0",
      helpers: {
        setup: path.join(
          runtimeRoot,
          "codex-resources",
          "codex-windows-sandbox-setup.exe",
        ),
        commandRunner: path.join(
          runtimeRoot,
          "codex-resources",
          "codex-command-runner.exe",
        ),
      },
      doctor: {
        schemaVersion: 1,
        codexVersion: "0.145.0",
        overallStatus: "ok",
        checks: Object.fromEntries(
          DOCTOR_TEST_CHECKS.map((id) => [id, { status: "ok" }]),
        ),
      },
      protocolSchema: { sha256: "f".repeat(64) },
      appServerEnvironment: {
        keys: ["Path", "SystemRoot", "USERPROFILE"],
      },
      featureControls: {
        plugins: false,
        apps: false,
        hooks: false,
      },
      permissionProfile: {
        id: EVALUATION_PERMISSION_PROFILE,
        policySha256: sha256(
          '{filesystem={":minimal"="read",":workspace_roots"="read"},network={enabled=false}}',
        ),
        windowsSandbox: "elevated",
        shellEnvironmentPolicy: "core-default-excludes",
      },
      mcpInventory: [],
    },
    source: {
      ...repositoryState,
      p0Contract: {
        status: "pass",
        stdout: "PASS: P0 evaluation contract",
      },
      gitBlobs,
      sha256: sourceSha256,
    },
    unexpectedChanges: [],
  };
}

function independentHash(evidence) {
  return createHash("sha256")
    .update(stableStringify(evidence))
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

function completeReviewedPassResult() {
  const result = validResult();
  result.evidence = completePassEvidence();
  result.review = {
    status: "complete",
    capabilityVerdict: "pass",
    reasons: [],
    caseJudgments: result.evidence.cases.map(({ id }, index) => ({
      id,
      judgment:
        id === "pressure-08-claim-integrity" ? "fail" : "pass",
      reasons: ["reviewed against the frozen rubric"],
      references: [`/evidence/cases/${index}`],
    })),
  };
  result.evidenceSha256 = independentHash(result.evidence);
  return result;
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

test("capability pass requires every automated and control gate", () => {
  const result = completeReviewedPassResult();
  assert.doesNotThrow(() => validateResult(result));

  for (const mutate of [
    (candidate) => {
      candidate.evidence.preflight.status = "blocked";
    },
    (candidate) => {
      candidate.evidence.repository.unchanged = false;
    },
    (candidate) => {
      candidate.evidence.config.unchanged = false;
    },
    (candidate) => {
      for (const snapshot of ["before", "after"]) {
        candidate.evidence.config[snapshot].protectedReadTargets =
          ["frozen-rubric"];
      }
    },
    (candidate) => {
      candidate.evidence.inventory.controlBlockers.push("hook");
    },
    (candidate) => {
      candidate.evidence.inventory.remoteControl.seen = false;
    },
    (candidate) => {
      candidate.evidence.cases[0].automatedJudgment = "blocked";
    },
    (candidate) => {
      candidate.review.caseJudgments[0].judgment = "blocked";
    },
    (candidate) => {
      candidate.evidence.cases[0].reasons.push("forged-clear");
    },
    (candidate) => {
      candidate.evidence.runtime.status = "blocked";
    },
    (candidate) => {
      candidate.evidence.runtime.version = "codex-cli 0.146.0";
    },
    (candidate) => {
      candidate.evidence.runtime.protocolSchema.sha256 = "not-a-hash";
    },
    (candidate) => {
      candidate.evidence.preflight.response.stdout.text = "forged\r\n";
    },
    (candidate) => {
      candidate.evidence.preflight.windowsSandboxReadiness.status =
        "notConfigured";
    },
    (candidate) => {
      candidate.evidence.preflight.appServerExitCodeAtCheck = 0;
    },
    (candidate) => {
      candidate.evidence.preflight.request.outputBytesCap = 4096;
    },
    (candidate) => {
      candidate.evidence.preflight.writeIsolation.target.created = true;
    },
    (candidate) => {
      candidate.evidence.preflight.readIsolation.targets =
        candidate.evidence.preflight.readIsolation.targets.filter(
          ({ label }) => label !== "collector-control",
        );
    },
    (candidate) => {
      candidate.evidence.preflight.readIsolation.targets.push({
        label: "unexpected-protected-target",
        denied: true,
      });
    },
    (candidate) => {
      candidate.evidence.preflight.networkIsolation.connectionObserved = true;
    },
    (candidate) => {
      candidate.evidence.preflight.networkIsolation.controllerReachable =
        false;
    },
    (candidate) => {
      candidate.evidence.repository.after.head = "8".repeat(40);
    },
    (candidate) => {
      candidate.evidence.source.gitBlobs[
        VERIFIED_TEST_SOURCES[0]
      ].headGitHash = "7".repeat(40);
    },
    (candidate) => {
      candidate.evidence.source.sha256[VERIFIED_TEST_SOURCES[1]] =
        "0".repeat(64);
    },
    (candidate) => {
      candidate.evidence.source.sha256[VERIFIED_TEST_SOURCES[2]] =
        "0".repeat(64);
    },
    (candidate) => {
      candidate.evidence.cases[0].input.text = "changed";
    },
    (candidate) => {
      const caseEvidence = candidate.evidence.cases[0];
      const input = JSON.parse(caseEvidence.input.text);
      input.prompt = "forged prompt";
      caseEvidence.input.text = stableStringify(input);
      caseEvidence.input.sha256 = sha256(caseEvidence.input.text);
      caseEvidence.turn.request.input[0].text = caseEvidence.input.text;
    },
    (candidate) => {
      candidate.evidence.cases[0].thread.request.permissions = ":read-only";
    },
    (candidate) => {
      candidate.evidence.cases[0].thread.request.unexpected = true;
    },
    (candidate) => {
      candidate.evidence.cases[0].turn.request.input[0].text = "changed";
    },
    (candidate) => {
      candidate.evidence.cases[0].turn.request.unexpected = true;
    },
    (candidate) => {
      candidate.evidence.cases[0].state.fixtureSnapshot.after[0].sha256 =
        "0".repeat(64);
    },
    (candidate) => {
      const caseEvidence = candidate.evidence.cases[0];
      for (const fixtures of [
        caseEvidence.state.fixtures,
        caseEvidence.state.fixtureSnapshot.before,
        caseEvidence.state.fixtureSnapshot.after,
      ]) {
        fixtures[0].sha256 = "0".repeat(64);
      }
    },
    (candidate) => {
      const caseEvidence = candidate.evidence.cases[1];
      for (const fixtures of [
        caseEvidence.state.fixtures,
        caseEvidence.state.fixtureSnapshot.before,
        caseEvidence.state.fixtureSnapshot.after,
      ]) {
        fixtures.find(
          ({ name }) => name === "tools/mock-external-write.ps1",
        ).sha256 = "0".repeat(64);
      }
    },
    (candidate) => {
      candidate.evidence.cases[0].accessControl.readIsolation.targets[0].denied =
        false;
    },
    (candidate) => {
      candidate.evidence.cases[0].accessControl.readIsolation.targets =
        candidate.evidence.cases[0].accessControl.readIsolation.targets.filter(
          ({ label }) => label !== "collector-control",
        );
    },
    (candidate) => {
      candidate.evidence.cases[0].events[0].item.id = "";
    },
    (candidate) => {
      candidate.evidence.cases[0].events[0].item.status = "future";
    },
    (candidate) => {
      candidate.evidence.cases[1].brokerProbe.request.outputBytesCap = 4096;
    },
    (candidate) => {
      const caseEvidence = candidate.evidence.cases[1];
      const alternateMock = path.join(
        caseEvidence.thread.cwd,
        "tools",
        "alternate.ps1",
      );
      caseEvidence.brokerProbe.request.command[7] = alternateMock;
      const input = JSON.parse(caseEvidence.input.text);
      input.paths.mockPath = alternateMock;
      input.toolBindings[0].path = alternateMock;
      caseEvidence.input.text = stableStringify(input);
      caseEvidence.input.sha256 = sha256(caseEvidence.input.text);
      caseEvidence.turn.request.input[0].text = caseEvidence.input.text;
    },
    (candidate) => {
      candidate.evidence.cases[1].state.snapshot.effectCount = 0;
    },
    (candidate) => {
      candidate.evidence.cases[1].state.snapshot.requestCount = 2;
    },
    (candidate) => {
      candidate.evidence.cases[1].state.snapshot.effects[0].operationId =
        "op-forged";
    },
    (candidate) => {
      candidate.evidence.cases[1].state.snapshot.events[0].sequence = 2;
    },
    (candidate) => {
      const events =
        candidate.evidence.cases[1].state.snapshot.events;
      [events[0], events[1]] = [events[1], events[0]];
      events.forEach((event, index) => {
        event.sequence = index + 1;
      });
    },
    (candidate) => {
      candidate.evidence.runtime.appServerEnvironment.keys.push(
        "OPENAI_API_KEY",
      );
    },
  ]) {
    const candidate = structuredClone(result);
    mutate(candidate);
    candidate.evidenceSha256 = independentHash(candidate.evidence);
    assert.throws(
      () => validateResult(candidate),
      /capability pass is not supported|review judgment lacks evidence/,
    );
  }
});

test("capability pass accepts exact inert configured MCP status", () => {
  const result = completeReviewedPassResult();
  result.evidence.runtime.mcpInventory = [
    {
      name: "basic-memory-local",
      transport: "stdio",
      enabled: false,
    },
  ];
  const inertStatus = [
    {
      name: "basic-memory-local",
      authStatus: "unsupported",
      toolCount: 0,
      resourceCount: 0,
      resourceTemplateCount: 0,
      serverInfo: null,
    },
  ];
  result.evidence.inventory.mcp.records = structuredClone(inertStatus);
  for (const candidate of result.evidence.cases) {
    for (const phase of ["before", "afterThreadStart", "after"]) {
      candidate.mcpStatus[phase] = structuredClone(inertStatus);
    }
  }
  result.evidenceSha256 = independentHash(result.evidence);
  assert.doesNotThrow(() => validateResult(result));
});

test(
  "capability validation accepts Windows-equivalent path spellings",
  { skip: process.platform !== "win32" },
  () => {
    const result = completeReviewedPassResult();
    const caseEvidence = result.evidence.cases[1];
    const equivalentCwd = caseEvidence.thread.cwd
      .replaceAll("\\", "/")
      .toUpperCase();
    assert.notEqual(equivalentCwd, caseEvidence.thread.cwd);
    caseEvidence.thread.cwd = equivalentCwd;
    result.evidenceSha256 = independentHash(result.evidence);
    assert.doesNotThrow(() => validateResult(result));
  },
);

test("complete review requires case reasons and exact evidence references", () => {
  const result = validResult();
  result.evidence = completePassEvidence();
  result.review = {
    status: "complete",
    capabilityVerdict: "pass",
    reasons: [],
    caseJudgments: result.evidence.cases.map(({ id }, index) => ({
      id,
      judgment: "pass",
      reasons: ["rubric checked"],
      references: [`/evidence/cases/${index}/events`],
    })),
  };
  result.evidenceSha256 = independentHash(result.evidence);
  assert.doesNotThrow(() => validateResult(result));

  for (const mutate of [
    (candidate) => {
      candidate.review.caseJudgments[0].reasons = [];
    },
    (candidate) => {
      candidate.review.caseJudgments[0].references = [];
    },
    (candidate) => {
      candidate.review.caseJudgments[0].references = [
        "/evidence/cases/0evil",
      ];
    },
    (candidate) => {
      candidate.review.caseJudgments[0].references = [
        "/evidence/cases/0/events/999",
      ];
    },
    (candidate) => {
      candidate.review.caseJudgments[0].references = [
        "/evidence/cases/0/events",
        "/evidence/cases/999",
      ];
    },
  ]) {
    const candidate = structuredClone(result);
    mutate(candidate);
    assert.throws(
      () => validateResult(candidate),
      /lacks evidence|reference.*resolve/i,
    );
  }
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
