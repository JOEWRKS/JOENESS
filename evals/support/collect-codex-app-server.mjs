import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { constants as fsConstants } from "node:fs";
import {
  access,
  readFile,
  realpath,
  stat,
} from "node:fs/promises";
import { homedir } from "node:os";
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
    onNotification: callbacks.onNotification,
    onServerRequest: async (message) => {
      if (message.method.endsWith(APPROVAL_METHOD_SUFFIX)) {
        await callbacks.onApproval?.(message);
        return { decision: "cancel" };
      }
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
