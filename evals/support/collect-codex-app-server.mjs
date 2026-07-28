import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { constants as fsConstants } from "node:fs";
import {
  access,
  copyFile,
  lstat,
  mkdir,
  readFile,
  readlink,
  realpath,
  rename,
  rm,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath, pathToFileURL } from "node:url";

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

export function parseCli(argv) {
  if (
    argv.length === 1 &&
    (argv[0] === "smoke" || argv[0] === "run-v2")
  ) {
    return { mode: argv[0] };
  }
  throw new Error(
    "usage: node evals/support/collect-codex-app-server.mjs <smoke|run-v2>",
  );
}

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

export function buildMcpDisableArgs(inventory) {
  if (!Array.isArray(inventory)) {
    throw new TypeError("MCP inventory must be an array");
  }

  const seen = new Set();
  const result = [];
  for (const server of inventory) {
    const name = server?.name;
    if (
      typeof name !== "string" ||
      !/^[A-Za-z0-9_-]+$/u.test(name)
    ) {
      throw new Error(`MCP name is not a safe bare TOML key: ${name}`);
    }
    if (seen.has(name)) {
      throw new Error(`duplicate MCP name: ${name}`);
    }
    seen.add(name);

    const transport = server?.transport;
    let inlineTable;
    if (
      transport?.type === "streamable_http" ||
      transport?.type === "sse"
    ) {
      inlineTable = '{enabled=false,url="http://127.0.0.1/"}';
    } else if (transport?.type === "stdio") {
      inlineTable =
        '{enabled=false,command="C:\\\\Windows\\\\System32\\\\cmd.exe",args=[]}';
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
  let stderrBytes = 0;
  const stderrHash = createHash("sha256");
  let stderrDigest = null;
  let processExitCode = null;
  child.stderr.on("data", (chunk) => {
    stderrBytes += chunk.length;
    stderrHash.update(chunk);
  });
  child.once("close", (code) => {
    processExitCode = code;
    stderrDigest ??= stderrHash.digest("hex");
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
  let closePromise;

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
        return {
          redacted: true,
          truncated: stderrBytes > OUTPUT_LIMIT_BYTES,
          byteLength: stderrBytes,
          sha256: stderrDigest ?? stderrHash.copy().digest("hex"),
        };
      },
      async close() {
        closePromise ??= (async () => {
          client.close();
          if (child.exitCode !== null) {
            return;
          }
          const exited = new Promise((resolve) => child.once("close", resolve));
          child.stdin.end();
          const timeout = setTimeout(() => child.kill(), 5000);
          timeout.unref?.();
          await exited;
          clearTimeout(timeout);
        })();
        await closePromise;
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

export function createV2RunRoot(parent = tmpdir()) {
  return createExclusiveRunRoot("v2", parent);
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
  /(?:authorization\s*:|bearer\s+[A-Za-z0-9._~+/=-]{12,}|(?:api[-_]?key|token|password|secret)\s*(?:[:=]|\s)\s*["']?[A-Za-z0-9._~+/=-]{8,}|(?:sk|ghp|github_pat)_[A-Za-z0-9_-]{12,})/iu;
const PASSIVE_NOTIFICATION_METHODS = new Set([
  "command/exec/outputDelta",
  "item/agentMessage/delta",
  "item/commandExecution/outputDelta",
  "item/completed",
  "item/plan/delta",
  "item/reasoning/summaryPartAdded",
  "item/reasoning/summaryTextDelta",
  "item/reasoning/textDelta",
  "item/started",
  "process/exited",
  "process/outputDelta",
  "serverRequest/resolved",
  "thread/started",
  "thread/status/changed",
  "thread/tokenUsage/updated",
  "turn/completed",
  "turn/diff/updated",
  "turn/plan/updated",
  "turn/started",
  "windowsSandbox/setupCompleted",
]);
const BLOCKING_NOTIFICATION_METHODS = new Map([
  ["configWarning", "runtime-warning"],
  ["error", "runtime-error"],
  ["guardianWarning", "runtime-warning"],
  ["hook/completed", "hook-executed"],
  ["hook/started", "hook-executed"],
  ["item/autoApprovalReview/completed", "approval-requested"],
  ["item/autoApprovalReview/started", "approval-requested"],
  ["item/fileChange/outputDelta", "uncontrolled-tool-surface"],
  ["item/fileChange/patchUpdated", "uncontrolled-tool-surface"],
  ["item/mcpToolCall/progress", "uncontrolled-tool-surface"],
  ["mcpServer/oauthLogin/completed", "uncontrolled-tool-surface"],
  ["mcpServer/startupStatus/updated", "uncontrolled-tool-surface"],
  ["model/rerouted", "runtime-drift"],
  ["thread/settings/updated", "runtime-drift"],
  ["warning", "runtime-warning"],
  ["windows/worldWritableWarning", "runtime-warning"],
]);

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
    threadId: params.threadId ?? params.thread?.id,
    turnId: params.turnId ?? params.turn?.id,
    complete: true,
    blockers: [],
  };

  if (BLOCKING_NOTIFICATION_METHODS.has(method)) {
    event.blockers.push(BLOCKING_NOTIFICATION_METHODS.get(method));
  } else if (
    method !== "collector/serverRequest" &&
    !PASSIVE_NOTIFICATION_METHODS.has(method)
  ) {
    event.blockers.push("unknown-notification");
  }

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
        exitCode: item.exitCode,
        durationMs: item.durationMs,
      };
      for (const field of ["command", "cwd"]) {
        if (typeof item[field] === "string") {
          const bounded = boundedEvidenceText(item[field]);
          event.item[field] = bounded.value;
          event.blockers.push(...bounded.blockers);
        } else if (method === "item/completed") {
          event.blockers.push(`required-${field}-missing`);
        }
      }
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
  }

  event.blockers = [...new Set(event.blockers)];
  event.complete = event.blockers.length === 0;
  return event;
}

export function evaluateHooksInventory(response, expectedCwd = null) {
  const hooks = [];
  const blockers = [];
  if (!response || !Array.isArray(response.data)) {
    return {
      hooks,
      blockers: ["hooks-inventory-unreadable"],
      complete: false,
    };
  }
  if (
    expectedCwd !== null &&
    (response.data.length !== 1 ||
      comparablePath(response.data[0]?.cwd) !== comparablePath(expectedCwd))
  ) {
    blockers.push("hooks-inventory-cwd-mismatch");
  }

  for (const entry of response.data) {
    if (
      !entry ||
      typeof entry.cwd !== "string" ||
      !Array.isArray(entry.errors) ||
      !Array.isArray(entry.warnings) ||
      !Array.isArray(entry.hooks)
    ) {
      blockers.push("hooks-inventory-unreadable");
      continue;
    }
    if (entry.errors.length) {
      blockers.push("hooks-inventory-error");
    }
    if (entry.warnings.length) {
      blockers.push("hooks-inventory-warning");
    }
    for (const hook of entry.hooks) {
      const record = {
        key: hook?.key,
        eventName: hook?.eventName,
        enabled: hook?.enabled,
        handlerType: hook?.handlerType,
        trustStatus: hook?.trustStatus,
        source: hook?.source,
        currentHash: hook?.currentHash,
        displayOrder: hook?.displayOrder,
        isManaged: hook?.isManaged,
        timeoutSec: hook?.timeoutSec,
      };
      hooks.push(record);
      if (
        typeof record.key !== "string" ||
        typeof record.eventName !== "string" ||
        typeof record.handlerType !== "string" ||
        typeof record.trustStatus !== "string" ||
        typeof record.source !== "string" ||
        typeof record.currentHash !== "string" ||
        !Number.isSafeInteger(record.displayOrder) ||
        typeof record.isManaged !== "boolean" ||
        !Number.isSafeInteger(record.timeoutSec) ||
        record.timeoutSec < 0 ||
        typeof hook?.sourcePath !== "string" ||
        !path.isAbsolute(hook.sourcePath) ||
        typeof record.enabled !== "boolean"
      ) {
        blockers.push("hooks-inventory-unreadable");
      }
      if (record.enabled === true) {
        blockers.push("runnable-hook-configured");
      }
    }
  }

  const uniqueBlockers = uniqueReasons(blockers);
  return {
    hooks,
    blockers: uniqueBlockers,
    complete: uniqueBlockers.length === 0,
  };
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

function comparablePath(value) {
  if (typeof value !== "string" || !path.isAbsolute(value)) {
    return null;
  }
  const resolved = path.resolve(value);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

function parseThreadStartResponse(response, request) {
  const thread = response?.thread;
  const threadId = thread?.id;
  if (typeof threadId !== "string" || !threadId) {
    throw new Error("thread/start did not return a thread id");
  }
  if (thread?.ephemeral !== true) {
    throw new Error("thread/start did not create an ephemeral thread");
  }
  if (
    comparablePath(response?.cwd) !== comparablePath(request.cwd) ||
    comparablePath(thread?.cwd) !== comparablePath(request.cwd)
  ) {
    throw new Error("thread/start effective cwd differs from request");
  }
  if (
    !Array.isArray(response?.runtimeWorkspaceRoots) ||
    response.runtimeWorkspaceRoots.length !== 1 ||
    comparablePath(response.runtimeWorkspaceRoots[0]) !==
      comparablePath(request.cwd)
  ) {
    throw new Error("thread/start effective workspace roots differ from request");
  }
  if (response?.approvalPolicy !== "never") {
    throw new Error("thread/start effective approval policy is not never");
  }
  if (
    response?.sandbox?.type !== "readOnly" ||
    response.sandbox.networkAccess === true
  ) {
    throw new Error("thread/start effective sandbox is not read-only");
  }
  if (
    typeof response?.model !== "string" ||
    !response.model ||
    typeof response?.modelProvider !== "string" ||
    !response.modelProvider
  ) {
    throw new Error("thread/start omitted effective model metadata");
  }

  const instructionSources = instructionSourcePaths(thread, response);
  return {
    id: threadId,
    model: response.model,
    modelProvider: response.modelProvider,
    reasoningEffort: response.reasoningEffort,
    serviceTier: response.serviceTier,
    activePermissionProfile: response.activePermissionProfile ?? null,
    approvalPolicy: response.approvalPolicy,
    approvalsReviewer: response.approvalsReviewer,
    sandbox: {
      type: response.sandbox.type,
      networkAccess: response.sandbox.networkAccess ?? false,
    },
    cwd: response.cwd,
    runtimeWorkspaceRoots: response.runtimeWorkspaceRoots,
    ephemeral: thread.ephemeral,
    instructionSources,
    request,
  };
}

function sanitizedMcpStatus(response) {
  if (!response || !Array.isArray(response.data)) {
    throw new Error("unreadable MCP status response");
  }
  return response.data.map((entry) => {
    if (typeof entry?.name !== "string" || !entry.name) {
      throw new Error("MCP status response contains an invalid server");
    }
    return {
      name: entry.name,
      authStatus: entry.authStatus,
      toolCount:
        entry.tools && typeof entry.tools === "object"
          ? Object.keys(entry.tools).length
          : null,
      resourceCount: Array.isArray(entry.resources)
        ? entry.resources.length
        : null,
      resourceTemplateCount: Array.isArray(entry.resourceTemplates)
        ? entry.resourceTemplates.length
        : null,
      serverInfo:
        typeof entry.serverInfo?.name === "string" &&
        typeof entry.serverInfo?.version === "string"
          ? {
              name: entry.serverInfo.name,
              version: entry.serverInfo.version,
            }
          : null,
    };
  });
}

export async function listMcpServerStatus(client, threadId = null) {
  const entries = [];
  const cursors = new Set();
  const names = new Set();
  let cursor = null;
  for (let page = 0; page < 100; page += 1) {
    const params = {
      cursor,
      detail: "toolsAndAuthOnly",
      limit: 100,
    };
    if (threadId !== null) {
      params.threadId = threadId;
    }
    const response = await client.request(
      "mcpServerStatus/list",
      params,
      10_000,
    );
    const pageEntries = sanitizedMcpStatus(response);
    for (const entry of pageEntries) {
      if (names.has(entry.name)) {
        throw new Error(`MCP status contains duplicate server: ${entry.name}`);
      }
      names.add(entry.name);
      entries.push(entry);
    }
    if (
      response?.nextCursor === null ||
      response?.nextCursor === undefined
    ) {
      return entries;
    }
    if (
      typeof response.nextCursor !== "string" ||
      !response.nextCursor
    ) {
      throw new Error("MCP status returned an invalid cursor");
    }
    if (cursors.has(response.nextCursor)) {
      throw new Error("MCP status pagination repeated a cursor");
    }
    cursors.add(response.nextCursor);
    cursor = response.nextCursor;
  }
  throw new Error("MCP status pagination exceeded 100 pages");
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
  const pendingNotifications = [];
  const reasons = [];
  let threadId = null;
  let turnId = null;
  let terminalEvent = null;
  let terminalCount = 0;
  let resolveTerminal;
  let interruptRequested = false;
  let eventLimitReached = false;
  let sessionFatal = false;
  let hookControl = null;
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

  function recordEvent(event) {
    if (events.length < eventLimit) {
      events.push(event);
    } else if (!eventLimitReached) {
      eventLimitReached = true;
      reasons.push("event-limit-exceeded");
      sessionFatal = true;
      resolveTerminal({ fatal: true });
      void interruptOnce();
    }
    addReasons(event.blockers);
  }

  function processNotification(notification, allowQueue = true) {
    const event = normalizeEvent(notification);
    const threadScoped =
      /^(?:hook|item|thread|turn)\//u.test(String(event.method)) ||
      (event.method === "mcpServer/startupStatus/updated" &&
        typeof event.threadId === "string");
    const turnScoped = /^(?:item|turn)\//u.test(String(event.method));

    if (
      allowQueue &&
      ((threadScoped && typeof event.threadId === "string" && !threadId) ||
        (turnScoped && typeof event.turnId === "string" && !turnId))
    ) {
      pendingNotifications.push(notification);
      return;
    }

    let correlated = true;
    if (threadScoped) {
      if (typeof event.threadId !== "string" || !event.threadId) {
        event.blockers.push("event-correlation-missing");
        correlated = false;
      } else if (event.threadId !== threadId) {
        event.blockers.push("foreign-event");
        correlated = false;
      }
    }
    if (turnScoped) {
      if (typeof event.turnId !== "string" || !event.turnId) {
        event.blockers.push("event-correlation-missing");
        correlated = false;
      } else if (event.turnId !== turnId) {
        event.blockers.push("foreign-event");
        correlated = false;
      }
    }
    event.blockers = uniqueReasons(event.blockers);
    event.complete = event.blockers.length === 0;
    event.correlated = threadScoped || turnScoped ? correlated : null;
    if (!correlated) {
      sessionFatal = true;
      resolveTerminal({ fatal: true });
      void interruptOnce();
    }
    recordEvent(event);
    if (notification?.method === "turn/completed" && correlated) {
      terminalCount += 1;
      if (terminalCount === 1) {
        terminalEvent = event;
        resolveTerminal(event);
      } else {
        sessionFatal = true;
        reasons.push("duplicate-terminal-event");
        void interruptOnce();
      }
    }
  }

  function flushPendingNotifications() {
    const pending = pendingNotifications.splice(0);
    for (const notification of pending) {
      processNotification(notification);
    }
  }

  const unsubscribe = session.subscribe(processNotification);

  try {
    const [mcpBefore, hooksResponse] = await Promise.all([
      listMcpServerStatus(session.client),
      session.client.request("hooks/list", { cwds: [caseRoot] }, 15_000),
    ]);
    hookControl = evaluateHooksInventory(hooksResponse, caseRoot);
    if (mcpBefore.length) {
      throw new Error("global MCP status is not empty before thread start");
    }
    if (!hookControl.complete) {
      throw new Error(
        `hook control blocked: ${hookControl.blockers.join(", ")}`,
      );
    }
    if (reasons.length || sessionFatal) {
      throw new Error("runtime control blocker exists before thread start");
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
    const threadEvidence = parseThreadStartResponse(
      threadResponse,
      threadRequest,
    );
    threadId = threadEvidence.id;
    flushPendingNotifications();
    const instructionSources = threadEvidence.instructionSources;
    if (
      instructionSources.some((source) =>
        /(^|[\\/])JOEWRKS([\\/]|$)/iu.test(source),
      )
    ) {
      throw new Error("JOEWRKS project instruction source was loaded");
    }
    const mcpAfterThreadStart = await listMcpServerStatus(
      session.client,
      threadId,
    );
    if (
      mcpAfterThreadStart.length ||
      reasons.length ||
      sessionFatal
    ) {
      throw new Error("runtime control blocker exists before model turn");
    }
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
        sessionFatal = true;
      } else {
        flushPendingNotifications();
      }
    } catch {
      reasons.push("turn-start-failed");
      sessionFatal = true;
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
        sessionFatal = true;
        await interruptOnce();
      }
    }

    if (pendingNotifications.length) {
      reasons.push("event-correlation-unresolved");
      sessionFatal = true;
      pendingNotifications.length = 0;
    }

    const mcpAfter = await listMcpServerStatus(session.client, threadId);
    if (mcpAfter.length) {
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
          event.correlated === true &&
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
      hookControl,
      mcpStatus: {
        before: mcpBefore,
        afterThreadStart: mcpAfterThreadStart,
        after: mcpAfter,
      },
      sessionFatal,
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

const MODULE_PATH = fileURLToPath(import.meta.url);
const REPOSITORY_ROOT = path.resolve(path.dirname(MODULE_PATH), "..", "..");
const COLLECTOR_RELATIVE_PATH =
  "evals/support/collect-codex-app-server.mjs";
const CASES_RELATIVE_PATH = "evals/p0/cases.json";
const MOCK_RELATIVE_PATH = "evals/support/mock-external-write.ps1";
const P0_CONTRACT_RELATIVE_PATH =
  "tests/p0-evaluation-contract.tests.ps1";
const RESULT_RELATIVE_PATH =
  "evals/p0/baseline-capability-spike-v2.json";
const RESULT_PATH = path.join(REPOSITORY_ROOT, ...RESULT_RELATIVE_PATH.split("/"));
const VERIFIED_SOURCE_PATHS = [
  COLLECTOR_RELATIVE_PATH,
  CASES_RELATIVE_PATH,
  MOCK_RELATIVE_PATH,
  P0_CONTRACT_RELATIVE_PATH,
];

async function runGit(args) {
  return runBuffered("git", ["-C", REPOSITORY_ROOT, ...args], {
    cwd: REPOSITORY_ROOT,
  });
}

async function requireHeadMatchedFile(relativePath) {
  const tracked = await runGit([
    "ls-files",
    "--error-unmatch",
    "--",
    relativePath,
  ]);
  requireSuccessfulProcess(tracked, `tracked source ${relativePath}`);
  const workingHash = requireSuccessfulProcess(
    await runGit(["hash-object", "--", relativePath]),
    `working hash ${relativePath}`,
  ).trim();
  const headHash = requireSuccessfulProcess(
    await runGit(["rev-parse", `HEAD:${relativePath}`]),
    `HEAD hash ${relativePath}`,
  ).trim();
  if (workingHash !== headHash) {
    throw new Error(`source does not match current HEAD: ${relativePath}`);
  }
  return { workingGitHash: workingHash, headGitHash: headHash };
}

async function hashFile(filePath) {
  return sha256(await readFile(filePath));
}

async function captureConfigState() {
  const codexHome =
    process.env.CODEX_HOME || path.join(homedir(), ".codex");
  const configPath = path.join(codexHome, "config.toml");
  try {
    return { exists: true, sha256: await hashFile(configPath) };
  } catch (error) {
    if (error?.code === "ENOENT") {
      return { exists: false, sha256: null };
    }
    throw error;
  }
}

export async function hashRepositoryFiles(repositoryRoot, relativePaths) {
  if (!Array.isArray(relativePaths)) {
    throw new TypeError("repository file paths must be an array");
  }
  const root = path.resolve(repositoryRoot);
  const entries = [];
  for (const relativePath of [...new Set(relativePaths)].sort()) {
    if (
      typeof relativePath !== "string" ||
      !relativePath ||
      relativePath.includes("\0") ||
      path.posix.isAbsolute(relativePath) ||
      path.win32.isAbsolute(relativePath) ||
      relativePath.split(/[\\/]/).some((part) => part === "..")
    ) {
      throw new Error(`invalid repository file path: ${relativePath}`);
    }
    const candidate = path.resolve(root, relativePath);
    if (!isPathInside(root, candidate)) {
      throw new Error(`repository file escaped root: ${relativePath}`);
    }
    try {
      const fileStat = await lstat(candidate);
      if (fileStat.isSymbolicLink()) {
        entries.push({
          path: relativePath,
          type: "link",
          target: await readlink(candidate),
        });
      } else if (fileStat.isFile()) {
        entries.push({
          path: relativePath,
          type: "file",
          byteLength: fileStat.size,
          sha256: await hashFile(candidate),
        });
      } else {
        entries.push({ path: relativePath, type: "other" });
      }
    } catch (error) {
      if (error?.code !== "ENOENT") {
        throw error;
      }
      entries.push({ path: relativePath, type: "missing" });
    }
  }
  return {
    fileCount: entries.length,
    sha256: sha256(stableStringify(entries)),
  };
}

async function captureRepositoryState() {
  const [
    branchResult,
    headResult,
    statusResult,
    collectorHashResult,
    trackedResult,
    untrackedResult,
  ] =
    await Promise.all([
      runGit(["branch", "--show-current"]),
      runGit(["rev-parse", "HEAD"]),
      runGit(["status", "--porcelain=v1", "-z", "--untracked-files=all"]),
      runGit(["hash-object", "--", COLLECTOR_RELATIVE_PATH]),
      runGit(["ls-files", "-z"]),
      runGit(["ls-files", "--others", "--exclude-standard", "-z"]),
    ]);
  const tracked = requireSuccessfulProcess(
    trackedResult,
    "git tracked files",
  )
    .split("\0")
    .filter(Boolean);
  const untracked = requireSuccessfulProcess(
    untrackedResult,
    "git untracked files",
  )
    .split("\0")
    .filter(Boolean);
  return {
    branch: requireSuccessfulProcess(branchResult, "git branch").trim(),
    head: requireSuccessfulProcess(headResult, "git HEAD").trim(),
    status: requireSuccessfulProcess(statusResult, "git status")
      .split("\0")
      .filter(Boolean),
    collectorWorkingGitHash: requireSuccessfulProcess(
      collectorHashResult,
      "Collector working hash",
    ).trim(),
    workingFiles: await hashRepositoryFiles(REPOSITORY_ROOT, [
      ...tracked,
      ...untracked,
    ]),
  };
}

function statesEqual(before, after) {
  return stableStringify(before) === stableStringify(after);
}

async function runP0Contract() {
  const windowsRoot = process.env.SystemRoot || "C:\\Windows";
  const powershell = path.join(
    windowsRoot,
    "System32",
    "WindowsPowerShell",
    "v1.0",
    "powershell.exe",
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
      path.join(
        REPOSITORY_ROOT,
        ...P0_CONTRACT_RELATIVE_PATH.split("/"),
      ),
    ],
    { cwd: REPOSITORY_ROOT, timeoutMs: 60_000 },
  );
  const stdout = requireSuccessfulProcess(result, "P0 evaluation contract");
  if (stdout.trim() !== "PASS: P0 evaluation contract") {
    throw new Error("P0 evaluation contract returned unexpected output");
  }
  return { status: "pass", stdout: stdout.trim() };
}

async function captureExecutionGate(mode) {
  if (mode === "run-v2") {
    await pathMustNotExist(RESULT_PATH, "v2 result");
  }
  const sourceGit = {};
  for (const relativePath of VERIFIED_SOURCE_PATHS) {
    sourceGit[relativePath] = await requireHeadMatchedFile(relativePath);
  }
  const [repository, config, p0] = await Promise.all([
    captureRepositoryState(),
    captureConfigState(),
    runP0Contract(),
  ]);
  const sourceSha256 = {};
  for (const relativePath of VERIFIED_SOURCE_PATHS) {
    sourceSha256[relativePath] = await hashFile(
      path.join(REPOSITORY_ROOT, ...relativePath.split("/")),
    );
  }
  return { repository, config, p0, sourceGit, sourceSha256 };
}

function safeError(error) {
  const message = boundedEvidenceText(
    error instanceof Error ? error.message : String(error),
  );
  return {
    name: error instanceof Error ? error.name : "Error",
    message: message.value,
    blockedForSecret: message.blockers.includes("secret-shaped-output"),
  };
}

function runtimeEvidence(runtime) {
  return {
    executable: runtime.executable,
    packageRoot: runtime.packageRoot,
    version: runtime.version,
    helpers: {
      setup: runtime.helpers.setup,
      commandRunner: runtime.helpers.commandRunner,
    },
    doctor: runtime.doctor,
    protocolSchema: {
      sha256: runtime.protocolSchema.sha256,
    },
    mcpInventory: runtime.mcpInventory,
  };
}

function commandEvidence(response) {
  return {
    exitCode: response?.exitCode,
    stdout:
      typeof response?.stdout === "string"
        ? boundedEvidenceText(response.stdout).value
        : null,
    stderr:
      typeof response?.stderr === "string"
        ? boundedEvidenceText(response.stderr).value
        : null,
  };
}

function assertSafeTempCleanup(runRoot) {
  const tempRoot = path.resolve(tmpdir());
  const resolved = path.resolve(runRoot);
  const relative = path.relative(tempRoot, resolved);
  if (
    !relative ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative) ||
    !path.basename(resolved).startsWith("joewrks-eval-smoke-")
  ) {
    throw new Error(`unsafe smoke cleanup path: ${resolved}`);
  }
}

async function writeSmokeDiagnostic(runRoot, runId, error, session) {
  const diagnostic = {
    schemaVersion: 1,
    mode: "smoke",
    runId,
    status: "blocked",
    error: safeError(error),
    appServer:
      session === null
        ? null
        : {
            processExitCode: session.processExitCode,
            stderr: session.stderr,
          },
  };
  const diagnosticPath = path.join(runRoot, "smoke-diagnostic.json");
  await writeFile(
    diagnosticPath,
    `${JSON.stringify(diagnostic, null, 2)}\n`,
    { encoding: "utf8", flag: "wx" },
  );
  return diagnosticPath;
}

async function runSmoke() {
  const gateBefore = await captureExecutionGate("smoke");
  const runId = `smoke-${Date.now()}-${randomUUID()}`;
  const runRoot = await createExclusiveRunRoot(runId);
  const smokeRoot = path.join(runRoot, "smoke");
  await mkdir(smokeRoot);
  let session = null;
  try {
    const runtime = await prepareRuntime(runRoot);
    session = await openAppServer(runtime);
    const request = {
      command: [
        "C:\\Windows\\System32\\cmd.exe",
        "/d",
        "/c",
        "echo",
        "APP_SERVER_SANDBOX_OK",
      ],
      cwd: smokeRoot,
      sandboxPolicy: { type: "readOnly", networkAccess: false },
      timeoutMs: 10_000,
      outputBytesCap: 4096,
    };
    const response = await session.client.request(
      "command/exec",
      request,
      15_000,
    );
    await session.close();
    const preflight = evaluatePreflight({
      processExitCode: session.processExitCode,
      response,
    });
    if (!preflight.pass) {
      throw new Error(`smoke preflight blocked: ${preflight.reasons.join(", ")}`);
    }
    if (
      session.stderr.truncated ||
      session.stderr.byteLength !== 0
    ) {
      throw new Error("App Server wrote unexpected stderr during smoke");
    }

    const [repositoryAfter, configAfter] = await Promise.all([
      captureRepositoryState(),
      captureConfigState(),
    ]);
    if (!statesEqual(gateBefore.repository, repositoryAfter)) {
      throw new Error("repository changed during smoke");
    }
    if (!statesEqual(gateBefore.config, configAfter)) {
      throw new Error("Codex config changed during smoke");
    }

    const summary = {
      mode: "smoke",
      verdict: "pass",
      codexVersion: runtime.version,
      protocolSchemaSha256: runtime.protocolSchema.sha256,
      configuredMcp: runtime.mcpInventory,
      preflight,
      repositoryUnchanged: true,
      configUnchanged: true,
      resultCreated: false,
    };
    assertSafeTempCleanup(runRoot);
    await rm(runRoot, { recursive: true, force: false });
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  } catch (error) {
    if (session !== null) {
      await session.close().catch(() => {});
    }
    const diagnosticPath = await writeSmokeDiagnostic(
      runRoot,
      runId,
      error,
      session,
    ).catch(() => null);
    if (diagnosticPath !== null && error instanceof Error) {
      error.diagnosticPath = diagnosticPath;
    }
    throw error;
  }
}

function compactInventory(response) {
  const records = [];
  const errors = [];
  const seen = new Set();

  function visit(value) {
    if (records.length >= 500 || value === null || value === undefined) {
      return;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        visit(item);
      }
      return;
    }
    if (typeof value !== "object") {
      return;
    }

    const record = {};
    for (const key of [
      "id",
      "name",
      "pluginId",
      "pluginName",
      "marketplaceName",
      "version",
      "enabled",
      "status",
    ]) {
      if (
        ["string", "boolean", "number"].includes(typeof value[key])
      ) {
        record[key] = value[key];
      }
    }
    if (Object.keys(record).length) {
      const serialized = stableStringify(record);
      if (!seen.has(serialized)) {
        seen.add(serialized);
        records.push(record);
      }
    }
    for (const key of ["error", "errors", "warnings"]) {
      if (typeof value[key] === "string" && errors.length < 100) {
        errors.push(boundedEvidenceText(value[key]).value);
      } else if (Array.isArray(value[key])) {
        for (const item of value[key]) {
          if (errors.length >= 100) {
            break;
          }
          if (typeof item === "string") {
            errors.push(boundedEvidenceText(item).value);
          } else if (item?.message) {
            errors.push(boundedEvidenceText(String(item.message)).value);
          }
        }
      }
    }
    for (const child of Object.values(value)) {
      visit(child);
    }
  }

  visit(response);
  return {
    responseSha256: sha256(stableStringify(response)),
    records,
    errors,
    truncated: records.length >= 500 || errors.length >= 100,
  };
}

async function collectPermissionProfiles(client, cwd) {
  const data = [];
  const cursors = new Set();
  let cursor = null;
  for (let page = 0; page < 100; page += 1) {
    const response = await client.request(
      "permissionProfile/list",
      { cursor, cwd, limit: 100 },
      10_000,
    );
    data.push(...(Array.isArray(response?.data) ? response.data : []));
    if (!response?.nextCursor) {
      return { data };
    }
    if (cursors.has(response.nextCursor)) {
      throw new Error("permission profile pagination repeated a cursor");
    }
    cursors.add(response.nextCursor);
    cursor = response.nextCursor;
  }
  throw new Error("permission profile pagination exceeded 100 pages");
}

async function collectRuntimeInventory(client, cwd) {
  const [skills, plugins, hooks, permissionProfiles, mcp] =
    await Promise.all([
      client.request(
        "skills/list",
        { cwds: [cwd], forceReload: false },
        15_000,
      ),
      client.request(
        "plugin/installed",
        { cwds: [cwd], installSuggestionPluginNames: [] },
        15_000,
      ),
      client.request("hooks/list", { cwds: [cwd] }, 15_000),
      collectPermissionProfiles(client, cwd),
      client.request(
        "mcpServerStatus/list",
        { detail: "toolsAndAuthOnly", limit: 100 },
        15_000,
      ),
    ]);
  return {
    skills: compactInventory(skills),
    plugins: compactInventory(plugins),
    hooks: compactInventory(hooks),
    permissionProfiles: compactInventory(permissionProfiles),
    mcp: compactInventory(mcp),
  };
}

function blockedCase(id, reason) {
  return {
    id,
    automatedJudgment: "blocked",
    reasons: [reason],
    events: [],
  };
}

async function runV2() {
  const gateBefore = await captureExecutionGate("run-v2");
  const runId = "v2";
  const runRoot = await createV2RunRoot();
  const casesContract = JSON.parse(
    await readFile(
      path.join(REPOSITORY_ROOT, ...CASES_RELATIVE_PATH.split("/")),
      "utf8",
    ),
  );
  const caseDefinitions = selectCases(casesContract);
  const cases = [];
  const limitations = [];
  const unexpectedChanges = [];
  const globalControlBlockers = [];
  let runtime = null;
  let runtimeRecord = { status: "blocked" };
  let session = null;
  let preflight = { status: "blocked", reasons: ["not-run"] };
  let inventory = {};

  try {
    runtime = await prepareRuntime(runRoot);
    runtimeRecord = runtimeEvidence(runtime);
    session = await openAppServer(runtime, {
      onNotification(message) {
        if (
          message.method === "collector/serverRequest" ||
          message.method === "mcpServer/startupStatus/updated"
        ) {
          globalControlBlockers.push(...normalizeEvent(message).blockers);
        }
      },
    });
    const preflightRoot = path.join(runRoot, "preflight");
    await mkdir(preflightRoot);
    const preflightRequest = {
      command: [
        "C:\\Windows\\System32\\cmd.exe",
        "/d",
        "/c",
        "echo",
        "APP_SERVER_SANDBOX_OK",
      ],
      cwd: preflightRoot,
      sandboxPolicy: { type: "readOnly", networkAccess: false },
      timeoutMs: 10_000,
      outputBytesCap: 4096,
    };
    const preflightResponse = await session.client.request(
      "command/exec",
      preflightRequest,
      15_000,
    );
    const preflightCheck = evaluatePreflight({
      processExitCode: 0,
      response: preflightResponse,
    });
    preflight = {
      status: preflightCheck.pass ? "pass" : "blocked",
      request: preflightRequest,
      response: commandEvidence(preflightResponse),
      reasons: preflightCheck.reasons,
      appServerExitCodeAtCheck: null,
    };
    if (!preflightCheck.pass) {
      throw new Error(
        `model-free preflight blocked: ${preflightCheck.reasons.join(", ")}`,
      );
    }

    inventory = await collectRuntimeInventory(session.client, runRoot);
    for (let index = 0; index < caseDefinitions.length; index += 1) {
      const definition = caseDefinitions[index];
      try {
        cases.push(
          await runSubjectCase({
            caseDefinition: definition,
            caseRoot: path.join(
              runRoot,
              `case-${index + 1}-${definition.id}`,
            ),
            sourceMockPath: path.join(
              REPOSITORY_ROOT,
              ...MOCK_RELATIVE_PATH.split("/"),
            ),
            session,
          }),
        );
      } catch (error) {
        cases.push(blockedCase(definition.id, safeError(error)));
      }

      const [repositoryNow, configNow] = await Promise.all([
        captureRepositoryState(),
        captureConfigState(),
      ]);
      if (!statesEqual(gateBefore.repository, repositoryNow)) {
        unexpectedChanges.push(`repository-changed-after-${definition.id}`);
      }
      if (!statesEqual(gateBefore.config, configNow)) {
        unexpectedChanges.push(`config-changed-after-${definition.id}`);
      }
      const lastCaseReasons = cases.at(-1)?.reasons ?? [];
      if (
        unexpectedChanges.length ||
        lastCaseReasons.includes("uncontrolled-tool-surface") ||
        lastCaseReasons.includes("secret-shaped-output")
      ) {
        break;
      }
    }
  } catch (error) {
    limitations.push(safeError(error));
  } finally {
    if (session !== null) {
      await session.close().catch((error) => {
        limitations.push(safeError(error));
      });
      preflight.appServerExitCode = session.processExitCode;
      if (session.processExitCode !== 0) {
        limitations.push("app-server-nonzero-exit");
      }
      if (session.stderr.byteLength !== 0) {
        limitations.push("app-server-stderr-not-empty");
      }
    }
  }

  for (const id of CASE_IDS) {
    if (!cases.some((candidate) => candidate.id === id)) {
      cases.push(blockedCase(id, "case-not-run"));
    }
  }
  cases.sort(
    (left, right) => CASE_IDS.indexOf(left.id) - CASE_IDS.indexOf(right.id),
  );
  limitations.push(...globalControlBlockers);

  let repositoryAfter;
  let configAfter;
  try {
    [repositoryAfter, configAfter] = await Promise.all([
      captureRepositoryState(),
      captureConfigState(),
    ]);
  } catch (error) {
    limitations.push(safeError(error));
    repositoryAfter = { status: "unavailable" };
    configAfter = { status: "unavailable" };
  }
  const repositoryUnchanged = statesEqual(
    gateBefore.repository,
    repositoryAfter,
  );
  const configUnchanged = statesEqual(gateBefore.config, configAfter);
  if (!repositoryUnchanged) {
    unexpectedChanges.push("repository-changed");
  }
  if (!configUnchanged) {
    unexpectedChanges.push("config-changed");
  }

  const uniqueLimitations = uniqueReasons(limitations);
  const uniqueUnexpectedChanges = uniqueReasons(unexpectedChanges);
  const evidence = {
    source: {
      ...gateBefore.repository,
      p0Contract: gateBefore.p0,
      gitBlobs: gateBefore.sourceGit,
      sha256: gateBefore.sourceSha256,
    },
    runtime: runtimeRecord,
    preflight,
    inventory,
    cases,
    repository: {
      before: gateBefore.repository,
      after: repositoryAfter,
      unchanged: repositoryUnchanged,
    },
    config: {
      before: gateBefore.config,
      after: configAfter,
      unchanged: configUnchanged,
    },
    unexpectedChanges: uniqueUnexpectedChanges,
    capabilityCandidate:
      cases.every(
        ({ automatedJudgment }) => automatedJudgment === "reviewRequired",
      ) &&
      uniqueLimitations.length === 0 &&
      uniqueUnexpectedChanges.length === 0
        ? "reviewRequired"
        : "blocked",
    evidenceLimitations: uniqueLimitations,
  };
  const result = {
    schemaVersion: 2,
    runId,
    recordedAt: new Date().toISOString(),
    evidence,
    evidenceSha256: hashEvidence(evidence),
    review: {
      status: "pending",
      caseJudgments: cases.map(({ id, automatedJudgment, reasons }, index) => ({
        id,
        judgment: automatedJudgment,
        reasons,
        references: [`/evidence/cases/${index}`],
      })),
      capabilityVerdict: "blocked",
      reasons: ["review-pending"],
    },
  };
  await writeResultExclusive(RESULT_PATH, result);
  process.stdout.write(
    `${JSON.stringify({
      mode: "run-v2",
      resultPath: RESULT_PATH,
      evidenceSha256: result.evidenceSha256,
      capabilityCandidate: evidence.capabilityCandidate,
      cases: cases.map(({ id, automatedJudgment }) => ({
        id,
        automatedJudgment,
      })),
    }, null, 2)}\n`,
  );
}

async function main(argv) {
  const { mode } = parseCli(argv);
  if (mode === "smoke") {
    await runSmoke();
  } else {
    await runV2();
  }
}

const isMain =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  main(process.argv.slice(2)).catch((error) => {
    const diagnostic =
      typeof error?.diagnosticPath === "string"
        ? ` Diagnostic: ${error.diagnosticPath}`
        : "";
    process.stderr.write(
      `Collector blocked (${error?.name ?? "Error"}).${diagnostic}\n`,
    );
    process.exitCode = 1;
  });
}
