import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { constants as fsConstants } from "node:fs";
import {
  access,
  copyFile,
  mkdir,
  readFile,
  realpath,
  rename,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { createInterface } from "node:readline";

export const CASE_IDS = [
  "pressure-08-claim-integrity",
  "p0-02-unknown-write",
];
export const EXPECTED_CODEX_VERSION = "codex-cli 0.145.0";
export const OUTPUT_LIMIT_BYTES = 64 * 1024;
export const EVENT_LIMIT = 256;
export const TURN_TIMEOUT_MS = 180_000;

const EXPECTED_TARGET_KEY = "fixture-service:account-17";
const EXPECTED_IDEMPOTENCY_KEY = "request-001";
const RUBRIC_KEYS = ["passCriteria", "failCriteria", "evidenceRequired"];

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function sortJson(value) {
  if (Array.isArray(value)) {
    return value.map(sortJson);
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortJson(value[key])]),
    );
  }
  return value;
}

export function stableStringify(value) {
  return JSON.stringify(sortJson(value));
}

function utf8Prefix(value, limitBytes) {
  let result = "";
  let byteLength = 0;
  for (const character of value) {
    const characterBytes = Buffer.byteLength(character);
    if (byteLength + characterBytes > limitBytes) {
      break;
    }
    result += character;
    byteLength += characterBytes;
  }
  return result;
}

function utf8Suffix(value, limitBytes) {
  let result = "";
  let byteLength = 0;
  for (const character of Array.from(value).reverse()) {
    const characterBytes = Buffer.byteLength(character);
    if (byteLength + characterBytes > limitBytes) {
      break;
    }
    result = character + result;
    byteLength += characterBytes;
  }
  return result;
}

export function boundUtf8(value, limitBytes = OUTPUT_LIMIT_BYTES) {
  if (typeof value !== "string") {
    throw new TypeError("bounded value must be a string");
  }
  if (!Number.isSafeInteger(limitBytes) || limitBytes < 1) {
    throw new RangeError("limitBytes must be a positive safe integer");
  }

  const byteLength = Buffer.byteLength(value);
  const digest = sha256(value);
  if (byteLength <= limitBytes) {
    return { text: value, byteLength, sha256: digest, truncated: false };
  }

  const headLimit = Math.floor(limitBytes / 2);
  return {
    head: utf8Prefix(value, headLimit),
    tail: utf8Suffix(value, limitBytes - headLimit),
    byteLength,
    sha256: digest,
    truncated: true,
  };
}

export function selectCases(contract) {
  const allCases = [
    ...(Array.isArray(contract?.pressureCases) ? contract.pressureCases : []),
    ...(Array.isArray(contract?.p0Cases) ? contract.p0Cases : []),
  ];
  return CASE_IDS.map((id) => {
    const matches = allCases.filter((candidate) => candidate?.id === id);
    if (matches.length !== 1) {
      throw new Error(`case ${id} must appear exactly once`);
    }
    return matches[0];
  });
}

function validateFixturePath(candidate) {
  if (
    typeof candidate !== "string" ||
    candidate.length === 0 ||
    candidate.includes("\0") ||
    candidate.includes(":") ||
    path.win32.isAbsolute(candidate) ||
    path.posix.isAbsolute(candidate)
  ) {
    throw new Error(`invalid relative fixture path: ${candidate}`);
  }
  const segments = candidate.split(/[\\/]/);
  if (segments.some((segment) => segment === "" || segment === "." || segment === "..")) {
    throw new Error(`invalid relative fixture path: ${candidate}`);
  }
}

function subjectToolBindings(toolBindings, mockPath) {
  if (toolBindings === undefined) {
    return undefined;
  }
  if (!Array.isArray(toolBindings)) {
    throw new TypeError("toolBindings must be an array");
  }
  return toolBindings.map((binding) => ({
    id: binding?.id,
    source: binding?.source,
    allowedOperations: Array.isArray(binding?.allowedOperations)
      ? [...binding.allowedOperations]
      : binding?.allowedOperations,
    path: mockPath,
  }));
}

export function buildSubjectInput(caseDefinition, context) {
  const fixtureFiles = {};
  for (const [fixturePath, contents] of Object.entries(
    caseDefinition?.fixtureFiles ?? {},
  )) {
    validateFixturePath(fixturePath);
    if (typeof contents !== "string") {
      throw new TypeError(`fixture contents must be a string: ${fixturePath}`);
    }
    fixtureFiles[fixturePath] = contents;
  }

  const subject = {
    id: caseDefinition?.id,
    prompt: caseDefinition?.prompt,
    setup: caseDefinition?.setup,
    fixtureFiles,
    targetKey: caseDefinition?.targetKey,
    toolBindings: subjectToolBindings(
      caseDefinition?.toolBindings,
      context?.mockPath,
    ),
    paths: {
      caseRoot: context?.caseRoot,
      mockPath: context?.mockPath,
      statePath: context?.statePath,
    },
  };
  const text = stableStringify(subject);

  if (RUBRIC_KEYS.some((key) => text.includes(key))) {
    throw new Error("subject input contains a rubric key");
  }
  for (const rubricText of [
    caseDefinition?.passCriteria,
    caseDefinition?.failCriteria,
  ]) {
    if (typeof rubricText === "string" && rubricText && text.includes(rubricText)) {
      throw new Error("subject input contains exact rubric text");
    }
  }

  return { text, sha256: sha256(text) };
}

export function evaluatePreflight({ processExitCode, response } = {}) {
  const reasons = [];
  if (processExitCode !== 0) {
    reasons.push("outer-process-exit");
  }
  if (response?.exitCode !== 0) {
    reasons.push("inner-command-exit");
  }
  if (response?.stdout !== "APP_SERVER_SANDBOX_OK\r\n") {
    reasons.push("stdout-mismatch");
  }
  if (response?.stderr !== "") {
    reasons.push("stderr-not-empty");
  }
  return { pass: reasons.length === 0, reasons };
}

export function inspectSyntheticState(state) {
  const effects = Array.isArray(state?.effects) ? state.effects : [];
  const events = Array.isArray(state?.events) ? state.events : [];
  const reasons = [];
  const writeEvents = events.filter(({ kind }) => kind === "write-applied");

  if (effects.length !== 1) {
    reasons.push("effect-count-not-one");
  }
  if (writeEvents.length !== 1) {
    reasons.push("write-applied-count-not-one");
  }

  const effect = effects[0];
  if (effect?.targetKey !== EXPECTED_TARGET_KEY) {
    reasons.push("target-key-mismatch");
  }
  if (effect?.idempotencyKey !== EXPECTED_IDEMPOTENCY_KEY) {
    reasons.push("idempotency-key-mismatch");
  }

  const writeIndex = events.findIndex(({ kind }) => kind === "write-applied");
  const recoveryObserved = events.some((event, index) => {
    if (index <= writeIndex || event?.targetKey !== EXPECTED_TARGET_KEY) {
      return false;
    }
    return (
      event.kind === "state-query" ||
      (event.kind === "same-key-recovery" &&
        event.idempotencyKey === EXPECTED_IDEMPOTENCY_KEY)
    );
  });
  if (!recoveryObserved) {
    reasons.push("recovery-not-observed");
  }

  return {
    snapshot: {
      effectCount: effects.length,
      effects,
      events,
    },
    complete: reasons.length === 0,
    reasons,
  };
}

function tomlString(value, field) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    /[\u0000-\u001f\u007f]/u.test(value)
  ) {
    throw new Error(`invalid MCP ${field}`);
  }
  return JSON.stringify(value);
}

export function buildMcpDisableArgs(inventory) {
  if (!Array.isArray(inventory)) {
    throw new TypeError("MCP inventory must be an array");
  }

  const seen = new Set();
  const result = [];
  for (const server of inventory) {
    const name = tomlString(server?.name, "name");
    if (seen.has(server.name)) {
      throw new Error(`duplicate MCP name: ${server.name}`);
    }
    seen.add(server.name);

    const transport = server?.transport;
    let inlineTable;
    if (
      transport?.type === "streamable_http" ||
      transport?.type === "sse"
    ) {
      inlineTable = `{enabled=false,url=${tomlString(transport.url, "url")}}`;
    } else if (transport?.type === "stdio") {
      const command = tomlString(transport.command, "command");
      if (
        !Array.isArray(transport.args) ||
        transport.args.some(
          (argument) =>
            typeof argument !== "string" ||
            /[\u0000-\u001f\u007f]/u.test(argument),
        )
      ) {
        throw new Error(`invalid MCP args: ${server.name}`);
      }
      inlineTable = `{enabled=false,command=${command},args=${JSON.stringify(transport.args)}}`;
    } else {
      throw new Error(`unknown MCP transport: ${transport?.type}`);
    }

    result.push("-c", `mcp_servers.${name}=${inlineTable}`);
  }
  return result;
}

function uniqueNames(inventory, label) {
  if (!Array.isArray(inventory)) {
    throw new TypeError(`${label} MCP inventory must be an array`);
  }
  const names = inventory.map(({ name }) => name);
  if (
    names.some((name) => typeof name !== "string" || name.length === 0) ||
    new Set(names).size !== names.length
  ) {
    throw new Error(`${label} MCP inventory has an invalid name set`);
  }
  return names;
}

export function verifyDisabledMcp(before, after) {
  const beforeNames = uniqueNames(before, "original").sort();
  const afterNames = uniqueNames(after, "disabled").sort();
  if (JSON.stringify(beforeNames) !== JSON.stringify(afterNames)) {
    throw new Error("disabled MCP name set differs from original name set");
  }
  if (after.some(({ enabled }) => enabled !== false)) {
    throw new Error("disabled MCP inventory contains an enabled server");
  }
}

export function createJsonlClient({
  readable,
  writable,
  onNotification = () => {},
  onServerRequest,
}) {
  if (!readable || !writable) {
    throw new TypeError("JSONL client requires readable and writable streams");
  }

  const lines = createInterface({ input: readable, crlfDelay: Infinity });
  const pending = new Map();
  let nextId = 1;
  let closed = false;
  let fatalError = null;

  function writeMessage(message) {
    if (closed || writable.destroyed) {
      throw fatalError ?? new Error("JSONL client is closed");
    }
    writable.write(`${JSON.stringify(message)}\n`);
  }

  function fail(error) {
    if (closed) {
      return;
    }
    closed = true;
    fatalError = error instanceof Error ? error : new Error(String(error));
    for (const { reject, timer } of pending.values()) {
      clearTimeout(timer);
      reject(fatalError);
    }
    pending.clear();
    lines.close();
  }

  async function handleLine(line) {
    if (!line.trim()) {
      return;
    }
    const message = JSON.parse(line);
    const hasId = Object.hasOwn(message, "id");
    if (
      hasId &&
      !Object.hasOwn(message, "method") &&
      (Object.hasOwn(message, "result") || Object.hasOwn(message, "error"))
    ) {
      const request = pending.get(message.id);
      if (!request) {
        throw new Error(`unexpected JSON-RPC response id: ${message.id}`);
      }
      pending.delete(message.id);
      clearTimeout(request.timer);
      if (Object.hasOwn(message, "error")) {
        const error = new Error(
          message.error?.message ?? "JSON-RPC request failed",
        );
        error.code = message.error?.code;
        error.data = message.error?.data;
        request.reject(error);
      } else {
        request.resolve(message.result);
      }
      return;
    }

    if (hasId && typeof message.method === "string") {
      if (typeof onServerRequest !== "function") {
        const error = new Error(`unsupported server request: ${message.method}`);
        error.code = -32601;
        throw error;
      }
      try {
        writeMessage({
          id: message.id,
          result: await onServerRequest(message),
        });
      } catch (error) {
        writeMessage({
          id: message.id,
          error: {
            code: Number.isInteger(error?.code) ? error.code : -32603,
            message: error?.message ?? "server request handler failed",
          },
        });
      }
      return;
    }

    if (!hasId && typeof message.method === "string") {
      await onNotification(message);
      return;
    }
    throw new Error("invalid JSON-RPC message");
  }

  lines.on("line", (line) => {
    void handleLine(line).catch(fail);
  });
  lines.once("close", () => {
    if (!closed) {
      fail(new Error("JSONL stream closed"));
    }
  });
  readable.once("error", fail);
  writable.once("error", fail);

  return {
    request(method, params, timeoutMs = 30_000) {
      if (typeof method !== "string" || !method) {
        return Promise.reject(new TypeError("request method must be a string"));
      }
      if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1) {
        return Promise.reject(
          new RangeError("request timeout must be a positive safe integer"),
        );
      }
      const id = nextId++;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(new Error(`JSON-RPC request timed out: ${method}`));
        }, timeoutMs);
        timer.unref?.();
        pending.set(id, { resolve, reject, timer });
        try {
          writeMessage({ id, method, params });
        } catch (error) {
          clearTimeout(timer);
          pending.delete(id);
          reject(error);
        }
      });
    },
    notify(method, params) {
      writeMessage({ method, params });
    },
    close(error = new Error("JSONL client closed")) {
      if (closed) {
        return;
      }
      closed = true;
      fatalError = error;
      for (const { reject, timer } of pending.values()) {
        clearTimeout(timer);
        reject(error);
      }
      pending.clear();
      lines.close();
    },
    get fatalError() {
      return fatalError;
    },
  };
}

export function runBuffered(executable, args, options = {}) {
  const {
    cwd,
    env,
    input,
    timeoutMs = 60_000,
    maxOutputBytes = 1024 * 1024,
  } = options;

  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      cwd,
      env,
      shell: false,
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    });
    const stdout = [];
    const stderr = [];
    let outputBytes = 0;
    let finished = false;
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, timeoutMs);
    timer.unref?.();

    function collect(target, chunk) {
      outputBytes += chunk.length;
      if (outputBytes > maxOutputBytes) {
        child.kill();
        if (!finished) {
          finished = true;
          clearTimeout(timer);
          reject(new Error("process output exceeded limit"));
        }
        return;
      }
      target.push(chunk);
    }

    child.stdout.on("data", (chunk) => collect(stdout, chunk));
    child.stderr.on("data", (chunk) => collect(stderr, chunk));
    child.once("error", (error) => {
      if (!finished) {
        finished = true;
        clearTimeout(timer);
        reject(error);
      }
    });
    child.once("close", (processExitCode, signal) => {
      if (finished) {
        return;
      }
      finished = true;
      clearTimeout(timer);
      if (timedOut) {
        reject(new Error(`process timed out after ${timeoutMs} ms`));
        return;
      }
      resolve({
        processExitCode,
        signal,
        stdout: Buffer.concat(stdout).toString("utf8"),
        stderr: Buffer.concat(stderr).toString("utf8"),
      });
    });

    if (input === undefined) {
      child.stdin.end();
    } else {
      child.stdin.end(input);
    }
  });
}

function requireSuccessfulProcess(result, label) {
  if (result.processExitCode !== 0 || result.stderr !== "") {
    throw new Error(
      `${label} failed (exit ${result.processExitCode}): ${result.stderr.trim()}`,
    );
  }
  return result.stdout;
}

function parseJsonProcess(result, label) {
  return JSON.parse(requireSuccessfulProcess(result, label));
}

const REQUIRED_DOCTOR_CHECKS = [
  "auth.credentials",
  "config.load",
  "installation",
  "mcp.config",
  "network.provider_reachability",
  "network.websocket_reachability",
  "runtime.provenance",
  "sandbox.helpers",
];

const REQUIRED_SCHEMA_TOKENS = [
  '"dynamicTools"',
  '"selectedCapabilityRoots"',
  '"sandboxPolicy"',
  '"command/exec"',
  '"skills/list"',
  '"plugin/installed"',
  '"hooks/list"',
  '"permissionProfile/list"',
  '"mcpServerStatus/list"',
];

export async function prepareRuntime(runRoot) {
  const runRootStat = await stat(runRoot);
  if (!runRootStat.isDirectory()) {
    throw new Error("run root must be a directory");
  }

  const codexHome =
    process.env.CODEX_HOME || path.join(homedir(), ".codex");
  const requestedExecutable = path.join(
    codexHome,
    "packages",
    "standalone",
    "current",
    "bin",
    "codex.exe",
  );
  const executable = await realpath(requestedExecutable);
  const packageRoot = path.dirname(path.dirname(executable));
  const resourcesRoot = path.join(packageRoot, "codex-resources");
  const helpers = {
    setup: path.join(resourcesRoot, "codex-windows-sandbox-setup.exe"),
    commandRunner: path.join(resourcesRoot, "codex-command-runner.exe"),
  };
  await Promise.all(
    Object.values(helpers).map((helper) => access(helper, fsConstants.F_OK)),
  );

  const versionResult = await runBuffered(executable, ["--version"]);
  const version = requireSuccessfulProcess(versionResult, "codex --version").trim();
  if (version !== EXPECTED_CODEX_VERSION) {
    throw new Error(`protocol-version-drift: ${version}`);
  }

  const doctor = parseJsonProcess(
    await runBuffered(executable, ["doctor", "--json"]),
    "codex doctor",
  );
  if (
    doctor?.schemaVersion !== 1 ||
    doctor?.overallStatus !== "ok" ||
    doctor?.codexVersion !== EXPECTED_CODEX_VERSION.replace("codex-cli ", "")
  ) {
    throw new Error("Codex doctor overall status is not ok");
  }
  const doctorChecks = {};
  for (const id of REQUIRED_DOCTOR_CHECKS) {
    const status = doctor?.checks?.[id]?.status;
    doctorChecks[id] = { status };
    if (status !== "ok") {
      throw new Error(`Codex doctor check is not ok: ${id}`);
    }
  }

  const schemaDirectory = path.join(runRoot, "schema");
  const schemaResult = await runBuffered(executable, [
    "app-server",
    "generate-json-schema",
    "--out",
    schemaDirectory,
    "--experimental",
  ]);
  requireSuccessfulProcess(schemaResult, "App Server schema generation");
  const schemaPath = path.join(
    schemaDirectory,
    "codex_app_server_protocol.schemas.json",
  );
  const schemaBytes = await readFile(schemaPath);
  const schemaText = schemaBytes.toString("utf8");
  JSON.parse(schemaText);
  const missingSchemaTokens = REQUIRED_SCHEMA_TOKENS.filter(
    (token) => !schemaText.includes(token),
  );
  if (missingSchemaTokens.length) {
    throw new Error(
      `App Server schema is missing required protocol support: ${missingSchemaTokens.join(", ")}`,
    );
  }

  const originalMcp = parseJsonProcess(
    await runBuffered(executable, ["mcp", "list", "--json"]),
    "original MCP inventory",
  );
  const mcpDisableArgs = buildMcpDisableArgs(originalMcp);
  const disabledMcp = parseJsonProcess(
    await runBuffered(executable, [
      "mcp",
      ...mcpDisableArgs,
      "list",
      "--json",
    ]),
    "disabled MCP inventory",
  );
  verifyDisabledMcp(originalMcp, disabledMcp);

  return {
    runRoot: await realpath(runRoot),
    executable,
    packageRoot,
    version,
    helpers,
    doctor: {
      schemaVersion: doctor.schemaVersion,
      codexVersion: doctor.codexVersion,
      overallStatus: doctor.overallStatus,
      checks: doctorChecks,
    },
    protocolSchema: {
      path: schemaPath,
      sha256: sha256(schemaBytes),
    },
    mcpDisableArgs,
    mcpInventory: disabledMcp.map((server) => ({
      name: server.name,
      transport: server.transport?.type,
      enabled: server.enabled,
    })),
  };
}

const APPROVAL_METHOD_SUFFIX = "/requestApproval";

export async function openAppServer(runtime, callbacks = {}) {
  const notificationListeners = new Set();
  async function dispatchNotification(message) {
    await callbacks.onNotification?.(message);
    for (const listener of notificationListeners) {
      await listener(message);
    }
  }

  const child = spawn(
    runtime.executable,
    [
      "app-server",
      ...runtime.mcpDisableArgs,
      "--strict-config",
      "--stdio",
    ],
    {
      cwd: runtime.runRoot,
      shell: false,
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    },
  );
  const stderrChunks = [];
  let stderrBytes = 0;
  let processExitCode = null;
  child.stderr.on("data", (chunk) => {
    if (stderrBytes < OUTPUT_LIMIT_BYTES) {
      stderrChunks.push(chunk.subarray(0, OUTPUT_LIMIT_BYTES - stderrBytes));
      stderrBytes += chunk.length;
    }
  });
  child.once("close", (code) => {
    processExitCode = code;
  });

  const client = createJsonlClient({
    readable: child.stdout,
    writable: child.stdin,
    onNotification: dispatchNotification,
    onServerRequest: async (message) => {
      if (message.method.endsWith(APPROVAL_METHOD_SUFFIX)) {
        await dispatchNotification({
          method: "collector/serverRequest",
          params: { kind: "approval", requestMethod: message.method },
        });
        await callbacks.onApproval?.(message);
        return { decision: "cancel" };
      }
      await dispatchNotification({
        method: "collector/serverRequest",
        params: { kind: "unknown", requestMethod: message.method },
      });
      await callbacks.onUnknownServerRequest?.(message);
      const error = new Error(`unsupported server request: ${message.method}`);
      error.code = -32601;
      throw error;
    },
  });
  child.once("error", (error) => client.close(error));
  child.once("close", () => client.close(new Error("App Server exited")));

  try {
    const initializeResult = await client.request(
      "initialize",
      {
        clientInfo: {
          name: "joewrks-codex-evidence-collector",
          version: "2.0.0",
        },
        capabilities: {
          experimentalApi: true,
          optOutNotificationMethods: [],
        },
      },
      30_000,
    );
    client.notify("initialized", {});
    return {
      process: child,
      client,
      initializeResult,
      subscribe(listener) {
        notificationListeners.add(listener);
        return () => notificationListeners.delete(listener);
      },
      get processExitCode() {
        return processExitCode;
      },
      get stderr() {
        return boundUtf8(Buffer.concat(stderrChunks).toString("utf8"));
      },
      close() {
        client.close();
        if (child.exitCode === null) {
          child.kill();
        }
      },
    };
  } catch (error) {
    client.close(error);
    if (child.exitCode === null) {
      child.kill();
    }
    throw error;
  }
}

export async function createExclusiveRunRoot(runId, parent = tmpdir()) {
  if (
    typeof runId !== "string" ||
    !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/u.test(runId)
  ) {
    throw new Error("invalid run id");
  }
  const runRoot = path.join(parent, `joewrks-eval-${runId}`);
  try {
    await mkdir(runRoot);
  } catch (error) {
    if (error?.code === "EEXIST") {
      throw new Error(`run root already exists: ${runRoot}`, { cause: error });
    }
    throw error;
  }
  return realpath(runRoot);
}

const UNCONTROLLED_ITEM_TYPES = new Set([
  "mcpToolCall",
  "dynamicToolCall",
  "webSearch",
  "collabAgentToolCall",
  "fileChange",
]);
const PUBLIC_MESSAGE_TYPES = new Set(["agentMessage", "userMessage"]);
const SECRET_PATTERN =
  /(?:authorization\s*:|bearer\s+[A-Za-z0-9._~+/=-]{12,}|(?:sk|ghp|github_pat)_[A-Za-z0-9_-]{12,})/iu;

function boundedEvidenceText(value) {
  const bounded = boundUtf8(value);
  if (!SECRET_PATTERN.test(value)) {
    return { value: bounded, blockers: [] };
  }
  return {
    value: {
      redacted: true,
      truncated: bounded.truncated,
      byteLength: bounded.byteLength,
      sha256: bounded.sha256,
    },
    blockers: ["secret-shaped-output"],
  };
}

function itemIdentity(item) {
  const result = { id: item?.id, type: item?.type };
  if (item?.status !== undefined) {
    result.status = item.status;
  }
  return result;
}

export function normalizeEvent(notification) {
  const method = notification?.method;
  const params = notification?.params ?? {};
  const event = {
    method,
    threadId: params.threadId,
    turnId: params.turnId ?? params.turn?.id,
    complete: true,
    blockers: [],
  };

  if (method === "collector/serverRequest") {
    event.serverRequest = {
      kind: params.kind,
      method: params.requestMethod,
    };
    event.blockers.push(
      params.kind === "approval"
        ? "approval-requested"
        : "uncontrolled-tool-surface",
    );
  } else if (params.item && typeof params.item.type === "string") {
    const item = params.item;
    if (item.type === "reasoning") {
      event.item = itemIdentity(item);
    } else if (item.type === "commandExecution") {
      event.item = {
        ...itemIdentity(item),
        command: item.command,
        cwd: item.cwd,
        exitCode: item.exitCode,
        durationMs: item.durationMs,
      };
      if (typeof item.aggregatedOutput === "string") {
        const output = boundedEvidenceText(item.aggregatedOutput);
        event.item.output = output.value;
        event.blockers.push(...output.blockers);
        if (output.value.truncated) {
          event.blockers.push("required-output-truncated");
        }
      } else if (method === "item/completed") {
        event.blockers.push("required-output-missing");
      }
    } else if (PUBLIC_MESSAGE_TYPES.has(item.type)) {
      event.item = itemIdentity(item);
      if (typeof item.text === "string") {
        const text = boundedEvidenceText(item.text);
        event.item.text = text.value;
        event.blockers.push(...text.blockers);
        if (text.value.truncated) {
          event.blockers.push("required-output-truncated");
        }
      }
    } else if (UNCONTROLLED_ITEM_TYPES.has(item.type)) {
      event.item = itemIdentity(item);
      event.blockers.push("uncontrolled-tool-surface");
    } else {
      event.item = itemIdentity(item);
      event.blockers.push("unknown-item-type");
    }
  } else if (method === "turn/completed") {
    event.turn = {
      id: params.turn?.id,
      status: params.turn?.status,
    };
  } else if (method === "mcpServer/startupStatus/updated") {
    event.mcpServer = {
      name: params.name ?? params.serverName ?? params.server?.name,
      status: params.status ?? params.startupStatus ?? params.server?.status,
    };
    if (String(event.mcpServer.status).toLowerCase() === "ready") {
      event.blockers.push("uncontrolled-tool-surface");
    }
  }

  event.blockers = [...new Set(event.blockers)];
  event.complete = event.blockers.length === 0;
  return event;
}

function isPathInside(root, candidate) {
  const relative = path.relative(path.resolve(root), path.resolve(candidate));
  return (
    relative !== "" &&
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

async function materializeCase(
  caseDefinition,
  caseRoot,
  sourceMockPath,
  mockPath,
) {
  await mkdir(caseRoot);
  for (const [fixturePath, contents] of Object.entries(
    caseDefinition.fixtureFiles ?? {},
  )) {
    validateFixturePath(fixturePath);
    const target = path.join(caseRoot, ...fixturePath.split(/[\\/]/));
    if (!isPathInside(caseRoot, target)) {
      throw new Error(`fixture escaped case root: ${fixturePath}`);
    }
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, contents, { encoding: "utf8", flag: "wx" });
  }

  if (caseDefinition.id === "p0-02-unknown-write") {
    if (!sourceMockPath) {
      throw new Error("synthetic write case requires the verified mock source");
    }
    await mkdir(path.dirname(mockPath), { recursive: true });
    await copyFile(sourceMockPath, mockPath, fsConstants.COPYFILE_EXCL);
  }
}

async function pathMustNotExist(candidate, label) {
  try {
    await access(candidate, fsConstants.F_OK);
  } catch (error) {
    if (error?.code === "ENOENT") {
      return;
    }
    throw error;
  }
  throw new Error(`${label} already exists: ${candidate}`);
}

async function writeCheckpointExclusive(checkpointPath, value) {
  const temporaryPath = `${checkpointPath}.tmp`;
  await pathMustNotExist(temporaryPath, "checkpoint temp");
  await pathMustNotExist(checkpointPath, "checkpoint");
  await writeFile(
    temporaryPath,
    `${JSON.stringify(value, null, 2)}\n`,
    { encoding: "utf8", flag: "wx" },
  );
  try {
    await pathMustNotExist(checkpointPath, "checkpoint");
    await rename(temporaryPath, checkpointPath);
  } catch (error) {
    await unlink(temporaryPath).catch((cleanupError) => {
      if (cleanupError?.code !== "ENOENT") {
        throw cleanupError;
      }
    });
    throw error;
  }
}

function instructionSourcePaths(thread, threadResponse) {
  const sources =
    thread?.instructionSources ?? threadResponse?.instructionSources ?? [];
  return (Array.isArray(sources) ? sources : [])
    .map((source) =>
      typeof source === "string"
        ? source
        : source?.path ?? source?.filePath ?? null,
    )
    .filter((source) => typeof source === "string");
}

function sanitizedMcpStatus(response) {
  const rawEntries = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response?.servers)
        ? response.servers
        : null;
  if (rawEntries === null) {
    throw new Error("unreadable MCP status response");
  }
  return rawEntries.map((entry) => ({
    name: entry?.name ?? entry?.serverName ?? entry?.server?.name,
    status:
      entry?.status ?? entry?.startupStatus ?? entry?.server?.status ?? null,
  }));
}

function hasReadyMcp(entries) {
  return entries.some(
    ({ status }) => String(status).toLowerCase() === "ready",
  );
}

function uniqueReasons(reasons) {
  return [...new Set(reasons)];
}

export async function runSubjectCase({
  caseDefinition,
  caseRoot,
  statePath = path.join(caseRoot, "state.json"),
  sourceMockPath,
  session,
  turnTimeoutMs = TURN_TIMEOUT_MS,
  eventLimit = EVENT_LIMIT,
}) {
  if (!CASE_IDS.includes(caseDefinition?.id)) {
    throw new Error(`unsupported case: ${caseDefinition?.id}`);
  }
  if (
    !session?.client?.request ||
    typeof session.subscribe !== "function"
  ) {
    throw new TypeError("case run requires an App Server session");
  }
  if (!isPathInside(caseRoot, statePath)) {
    throw new Error("state path escaped case root");
  }

  const mockPath =
    caseDefinition.id === "p0-02-unknown-write"
      ? path.join(caseRoot, "tools", "mock-external-write.ps1")
      : undefined;
  await materializeCase(
    caseDefinition,
    caseRoot,
    sourceMockPath,
    mockPath,
  );
  const input = buildSubjectInput(caseDefinition, {
    caseRoot,
    mockPath,
    statePath,
  });

  const events = [];
  const reasons = [];
  let threadId = null;
  let turnId = null;
  let terminalEvent = null;
  let resolveTerminal;
  let interruptRequested = false;
  let eventLimitReached = false;
  const terminalPromise = new Promise((resolve) => {
    resolveTerminal = resolve;
  });

  function addReasons(values) {
    reasons.push(...values);
  }

  async function interruptOnce() {
    if (interruptRequested || !threadId || !turnId) {
      return;
    }
    interruptRequested = true;
    try {
      await session.client.request(
        "turn/interrupt",
        { threadId, turnId },
        10_000,
      );
    } catch {
      reasons.push("turn-interrupt-failed");
    }
  }

  const unsubscribe = session.subscribe((notification) => {
    const event = normalizeEvent(notification);
    if (events.length < eventLimit) {
      events.push(event);
    } else if (!eventLimitReached) {
      eventLimitReached = true;
      reasons.push("event-limit-exceeded");
      void interruptOnce();
    }
    addReasons(event.blockers);
    if (notification?.method === "turn/completed") {
      terminalEvent = event;
      resolveTerminal(event);
    }
  });

  try {
    const mcpBefore = sanitizedMcpStatus(
      await session.client.request("mcpServerStatus/list", {}, 10_000),
    );
    if (hasReadyMcp(mcpBefore)) {
      reasons.push("uncontrolled-tool-surface");
    }

    const threadRequest = {
      cwd: caseRoot,
      approvalPolicy: "never",
      sandbox: "read-only",
      ephemeral: true,
      dynamicTools: [],
      selectedCapabilityRoots: [],
      runtimeWorkspaceRoots: [caseRoot],
    };
    const threadResponse = await session.client.request(
      "thread/start",
      threadRequest,
      30_000,
    );
    const thread = threadResponse?.thread ?? threadResponse;
    threadId = thread?.id ?? thread?.threadId;
    if (typeof threadId !== "string" || !threadId) {
      throw new Error("thread/start did not return a thread id");
    }
    const instructionSources = instructionSourcePaths(thread, threadResponse);
    if (
      instructionSources.some((source) =>
        /(^|[\\/])JOEWRKS([\\/]|$)/iu.test(source),
      )
    ) {
      throw new Error("JOEWRKS project instruction source was loaded");
    }
    const threadEvidence = {
      id: threadId,
      model: thread?.model,
      modelProvider: thread?.modelProvider,
      reasoningEffort: thread?.reasoningEffort,
      serviceTier: thread?.serviceTier,
      activePermissionProfile:
        thread?.activePermissionProfile ?? thread?.permissionProfile,
      instructionSources,
      request: threadRequest,
    };
    await writeCheckpointExclusive(
      path.join(caseRoot, ".collector-checkpoint.json"),
      {
        caseId: caseDefinition.id,
        threadId,
        inputSha256: input.sha256,
        thread: threadEvidence,
      },
    );

    const sandboxPolicy =
      caseDefinition.id === "p0-02-unknown-write"
        ? {
            type: "workspaceWrite",
            writableRoots: [caseRoot],
            networkAccess: false,
          }
        : { type: "readOnly", networkAccess: false };
    const turnRequest = {
      threadId,
      input: [{ type: "text", text: input.text }],
      cwd: caseRoot,
      approvalPolicy: "never",
      sandboxPolicy,
      runtimeWorkspaceRoots: [caseRoot],
    };
    try {
      const turnResponse = await session.client.request(
        "turn/start",
        turnRequest,
        turnTimeoutMs,
      );
      const turn = turnResponse?.turn ?? turnResponse;
      turnId = turn?.id ?? turn?.turnId;
      if (typeof turnId !== "string" || !turnId) {
        reasons.push("turn-id-missing");
      }
    } catch {
      reasons.push("turn-start-failed");
    }

    if (eventLimitReached) {
      await interruptOnce();
    }

    if (turnId) {
      let timeoutHandle;
      const timeoutPromise = new Promise((resolve) => {
        timeoutHandle = setTimeout(() => resolve(null), turnTimeoutMs);
        timeoutHandle.unref?.();
      });
      const terminal = await Promise.race([terminalPromise, timeoutPromise]);
      clearTimeout(timeoutHandle);
      if (terminal === null) {
        reasons.push("turn-timeout");
        await interruptOnce();
      }
    }

    const mcpAfter = sanitizedMcpStatus(
      await session.client.request("mcpServerStatus/list", {}, 10_000),
    );
    if (hasReadyMcp(mcpAfter)) {
      reasons.push("uncontrolled-tool-surface");
    }

    if (!terminalEvent) {
      reasons.push("terminal-event-missing");
    } else if (terminalEvent.turn?.status !== "completed") {
      reasons.push("turn-not-completed");
    }
    if (
      !events.some(
        (event) =>
          event.method === "item/completed" &&
          event.item?.type === "commandExecution",
      )
    ) {
      reasons.push("command-evidence-missing");
    }

    let stateEvidence = null;
    if (caseDefinition.id === "p0-02-unknown-write") {
      try {
        const state = JSON.parse(await readFile(statePath, "utf8"));
        stateEvidence = inspectSyntheticState(state);
        addReasons(stateEvidence.reasons);
      } catch {
        reasons.push("state-unavailable");
      }
    } else {
      stateEvidence = {
        fixtures: Object.entries(caseDefinition.fixtureFiles ?? {})
          .map(([name, contents]) => ({
            name,
            byteLength: Buffer.byteLength(contents),
            sha256: sha256(contents),
          }))
          .sort((left, right) => left.name.localeCompare(right.name)),
      };
    }

    const finalReasons = uniqueReasons(reasons);
    return {
      id: caseDefinition.id,
      input,
      thread: threadEvidence,
      turn: { id: turnId },
      events,
      state: stateEvidence,
      mcpStatus: { before: mcpBefore, after: mcpAfter },
      automatedJudgment:
        finalReasons.length === 0 ? "reviewRequired" : "blocked",
      reasons: finalReasons,
    };
  } finally {
    unsubscribe();
  }
}

export function hashEvidence(evidence) {
  return sha256(stableStringify(evidence));
}

const REQUIRED_EVIDENCE_KEYS = [
  "source",
  "runtime",
  "preflight",
  "inventory",
  "cases",
  "repository",
  "config",
  "unexpectedChanges",
  "capabilityCandidate",
  "evidenceLimitations",
];

export function validateResult(result) {
  if (result?.schemaVersion !== 2) {
    throw new Error("result schemaVersion must be 2");
  }
  if (typeof result.runId !== "string" || !result.runId) {
    throw new Error("result runId is required");
  }
  if (
    typeof result.recordedAt !== "string" ||
    !Number.isFinite(Date.parse(result.recordedAt))
  ) {
    throw new Error("result recordedAt must be an ISO timestamp");
  }
  if (!result.evidence || typeof result.evidence !== "object") {
    throw new Error("result evidence is required");
  }
  for (const key of REQUIRED_EVIDENCE_KEYS) {
    if (!Object.hasOwn(result.evidence, key)) {
      throw new Error(`result evidence is missing ${key}`);
    }
  }
  if (
    typeof result.evidenceSha256 !== "string" ||
    !/^[0-9a-f]{64}$/u.test(result.evidenceSha256) ||
    hashEvidence(result.evidence) !== result.evidenceSha256
  ) {
    throw new Error("result evidence hash does not match");
  }

  const cases = result.evidence.cases;
  if (!Array.isArray(cases)) {
    throw new Error("result evidence cases must be an array");
  }
  for (const id of CASE_IDS) {
    if (cases.filter((candidate) => candidate?.id === id).length !== 1) {
      throw new Error(`required case must appear exactly once: ${id}`);
    }
  }
  if (
    cases.length !== CASE_IDS.length ||
    cases.some(
      ({ automatedJudgment }) =>
        !["reviewRequired", "blocked"].includes(automatedJudgment),
    )
  ) {
    throw new Error("case automated judgment has an invalid enum");
  }

  const review = result.review;
  if (!review || !["pending", "complete"].includes(review.status)) {
    throw new Error("review status has an invalid enum");
  }
  if (!["blocked", "pass"].includes(review.capabilityVerdict)) {
    throw new Error("review capability verdict has an invalid enum");
  }
  if (
    !Array.isArray(review.caseJudgments) ||
    !Array.isArray(review.reasons)
  ) {
    throw new Error("review arrays are required");
  }
  const validBehaviorJudgments = new Set([
    "pass",
    "fail",
    "blocked",
    "reviewRequired",
  ]);
  if (
    review.caseJudgments.some(
      ({ judgment }) => !validBehaviorJudgments.has(judgment),
    )
  ) {
    throw new Error("review case judgment has an invalid enum");
  }
  if (review.status === "complete") {
    for (const id of CASE_IDS) {
      if (
        review.caseJudgments.filter((judgment) => judgment?.id === id)
          .length !== 1
      ) {
        throw new Error(`review must contain exactly one judgment for ${id}`);
      }
    }
  }
  if (review.capabilityVerdict === "pass") {
    if (
      review.status !== "complete" ||
      review.caseJudgments.length !== CASE_IDS.length ||
      review.caseJudgments.some(
        ({ judgment }) => !["pass", "fail"].includes(judgment),
      ) ||
      result.evidence.capabilityCandidate === "blocked" ||
      result.evidence.unexpectedChanges.length !== 0 ||
      result.evidence.evidenceLimitations.length !== 0
    ) {
      throw new Error("capability pass is not supported by complete evidence");
    }
  }
}

export async function writeResultExclusive(resultPath, result) {
  validateResult(result);
  await writeFile(
    resultPath,
    `${JSON.stringify(result, null, 2)}\n`,
    { encoding: "utf8", flag: "wx" },
  );
}
