import { lstat, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import {
  EVALUATION_PERMISSION_PROFILE,
  buildThreadStartRequest,
  classifyEventScope,
  containsCredentialText,
  listMcpServerStatus,
  normalizeEvent,
  parseThreadStartResponse,
  remoteControlSnapshotIsSafe,
  sha256,
  stableStringify,
  verifyMcpRuntimeIsInert,
} from "./collect-codex-app-server.mjs";

const FORBIDDEN_ITEM_TYPES = new Set([
  "commandExecution",
  "fileChange",
  "mcpToolCall",
  "webSearch",
  "collabAgentToolCall",
]);

function unique(values) {
  return [...new Set(values)];
}

function exactKeys(value, keys) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).sort().join("\0") === [...keys].sort().join("\0")
  );
}

function isJsonObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function cloneJson(value, label) {
  let text;
  try {
    text = stableStringify(value);
  } catch (cause) {
    throw new TypeError(`${label} must be JSON serializable`, { cause });
  }
  if (text === undefined) {
    throw new TypeError(`${label} must be JSON serializable`);
  }
  return JSON.parse(text);
}

function isPathInsideOrEqual(root, candidate) {
  const relative = path.relative(root, candidate);
  return (
    relative === "" ||
    (relative !== ".." &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative))
  );
}

function validateDynamicTools(dynamicTools, dynamicToolController) {
  if (!Array.isArray(dynamicTools)) {
    throw new TypeError("fresh evaluator dynamic tools must be an array");
  }
  const names = new Set();
  for (const tool of dynamicTools) {
    if (
      !isJsonObject(tool) ||
      tool.type !== "function" ||
      typeof tool.name !== "string" ||
      !tool.name ||
      names.has(tool.name)
    ) {
      throw new TypeError("fresh evaluator dynamic tool descriptor is malformed");
    }
    cloneJson(tool, "fresh evaluator dynamic tool descriptor");
    names.add(tool.name);
  }
  if (
    (dynamicTools.length > 0 && typeof dynamicToolController !== "function") ||
    (dynamicTools.length === 0 && dynamicToolController !== undefined)
  ) {
    throw new TypeError(
      "fresh evaluator dynamic tool controller must exactly match configured tools",
    );
  }
  return names;
}

export function buildFreshEvaluatorThreadStartRequest(root, dynamicTools = []) {
  if (typeof root !== "string" || !path.isAbsolute(root)) {
    throw new TypeError("fresh evaluator root must be an absolute path");
  }
  if (!Array.isArray(dynamicTools)) {
    throw new TypeError("fresh evaluator dynamic tools must be an array");
  }
  const request = buildThreadStartRequest(root, dynamicTools);
  request.config.project_doc_max_bytes = 0;
  return request;
}

async function describeInput(root, input) {
  if (!Array.isArray(input) || input.length === 0) {
    throw new TypeError("fresh evaluator input must be a nonempty array");
  }
  const rootStat = await lstat(root);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) {
    throw new Error("fresh evaluator root must be a real directory");
  }
  const resolvedRoot = await realpath(root);
  const descriptors = [];
  let textCount = 0;
  for (const [index, entry] of input.entries()) {
    if (exactKeys(entry, ["type", "text"]) && entry.type === "text") {
      if (typeof entry.text !== "string" || !entry.text) {
        throw new TypeError("fresh evaluator text input is malformed");
      }
      textCount += 1;
      descriptors.push({
        index,
        type: "text",
        text: entry.text,
        byteLength: Buffer.byteLength(entry.text),
        sha256: sha256(entry.text),
      });
      continue;
    }
    if (exactKeys(entry, ["type", "path"]) && entry.type === "localImage") {
      if (typeof entry.path !== "string" || !path.isAbsolute(entry.path)) {
        throw new TypeError("fresh evaluator local image path is malformed");
      }
      const fileStat = await lstat(entry.path);
      const resolvedFile = await realpath(entry.path);
      if (
        !fileStat.isFile() ||
        fileStat.isSymbolicLink() ||
        !isPathInsideOrEqual(resolvedRoot, resolvedFile)
      ) {
        throw new Error(
          "fresh evaluator local image must be an in-root regular file",
        );
      }
      const bytes = await readFile(entry.path);
      descriptors.push({
        index,
        type: "localImage",
        path: entry.path,
        byteLength: bytes.length,
        sha256: sha256(bytes),
        originalDetail: "unverified",
      });
      continue;
    }
    throw new TypeError("fresh evaluator input descriptor is malformed");
  }
  if (textCount === 0) {
    throw new TypeError("fresh evaluator input requires text");
  }
  return {
    descriptors,
    requestSha256: sha256(stableStringify(input)),
  };
}

function normalizeDynamicToolEvent(notification, allowedToolNames) {
  const params = notification?.params ?? {};
  const item = params.item;
  if (
    !["item/started", "item/completed"].includes(notification?.method) ||
    item?.type !== "dynamicToolCall"
  ) {
    return null;
  }
  const blockers = [];
  const argumentsValue = isJsonObject(item.arguments)
    ? cloneJson(item.arguments, "dynamic tool lifecycle arguments")
    : null;
  if (
    typeof params.threadId !== "string" ||
    !params.threadId ||
    typeof params.turnId !== "string" ||
    !params.turnId ||
    typeof item.id !== "string" ||
    !item.id ||
    typeof item.tool !== "string" ||
    !allowedToolNames.has(item.tool) ||
    argumentsValue === null
  ) {
    blockers.push("uncontrolled-tool-surface");
  }
  if (containsCredentialText(argumentsValue)) {
    blockers.push("secret-shaped-output");
  }
  const event = {
    method: notification.method,
    threadId: params.threadId,
    turnId: params.turnId,
    item: {
      id: item?.id,
      type: "dynamicToolCall",
      tool: item?.tool,
      arguments: argumentsValue,
      argumentsSha256:
        argumentsValue === null ? null : sha256(stableStringify(argumentsValue)),
      status: item?.status,
    },
    blockers,
  };
  if (notification.method === "item/started") {
    if (item.status !== "inProgress") blockers.push("required-status-missing");
  } else if (
    !["completed", "failed"].includes(item.status) ||
    typeof item.success !== "boolean" ||
    item.status !== (item.success ? "completed" : "failed") ||
    !Array.isArray(item.contentItems) ||
    item.contentItems.length !== 1 ||
    item.contentItems[0]?.type !== "inputText" ||
    typeof item.contentItems[0]?.text !== "string"
  ) {
    blockers.push("runtime-drift");
  } else {
    const responseText = item.contentItems[0].text;
    event.item.success = item.success;
    event.item.response = {
      byteLength: Buffer.byteLength(responseText),
      sha256: sha256(responseText),
    };
    if (containsCredentialText(responseText)) {
      blockers.push("secret-shaped-output");
    }
  }
  event.blockers = unique(blockers);
  event.complete = event.blockers.length === 0;
  return event;
}

function dynamicLifecycleMatches(events, toolEvidence) {
  const lifecycleEvents = events.filter(
    (event) => event.item?.type === "dynamicToolCall",
  );
  if (lifecycleEvents.length !== toolEvidence.length * 2) return false;
  if (new Set(toolEvidence.map(({ callId }) => callId)).size !== toolEvidence.length) {
    return false;
  }
  return toolEvidence.every((evidence) => {
    const lifecycle = lifecycleEvents.filter(
      (event) => event.item.id === evidence.callId,
    );
    return (
      lifecycle.length === 2 &&
      lifecycle[0].method === "item/started" &&
      lifecycle[1].method === "item/completed" &&
      lifecycle[0].item.status === "inProgress" &&
      lifecycle[1].item.status === evidence.status &&
      lifecycle.every(
        (event) =>
          event.item.tool === evidence.tool &&
          event.item.argumentsSha256 === evidence.argumentsSha256 &&
          stableStringify(event.item.arguments) ===
            stableStringify(evidence.arguments),
      ) &&
      lifecycle[1].item.response?.byteLength ===
        evidence.response.byteLength &&
      lifecycle[1].item.response?.sha256 === evidence.response.sha256
    );
  });
}

function summarizeThreadStart(response) {
  return {
    threadId:
      typeof response?.thread?.id === "string" ? response.thread.id : null,
    ephemeral: response?.thread?.ephemeral === true,
    priorTurnCount: Array.isArray(response?.thread?.turns)
      ? response.thread.turns.length
      : null,
    instructionSources: Array.isArray(response?.instructionSources)
      ? [...response.instructionSources]
      : null,
  };
}

function finalAgentText(message) {
  const value = message?.item?.text;
  if (
    !value ||
    value.truncated !== false ||
    typeof value.text !== "string" ||
    !value.text
  ) {
    throw new Error("fresh evaluator final agent text is missing or truncated");
  }
  return value.text;
}

function attachEvidence(error, evidence) {
  const failure = new Error("fresh evaluator turn validation failed", {
    cause: error,
  });
  failure.freshEvaluatorEvidence = evidence;
  return failure;
}

export async function runFreshEvaluatorTurn({
  session,
  root,
  input,
  outputSchema,
  dynamicTools = [],
  dynamicToolController,
  turnTimeoutMs = 180_000,
} = {}) {
  const events = [];
  const pending = [];
  const blockers = [];
  const toolEvidence = [];
  const evidence = {
    threadStart: { request: null, response: null },
    thread: null,
    turn: { id: null, request: null },
    input: null,
    outputSchema: null,
    events,
    toolEvidence,
    mcpAfter: null,
    blockers,
    appServer: {
      processExitCode: null,
      stderr: null,
      remoteControl: null,
    },
  };
  let allowedToolNames = new Set();
  let threadId = null;
  let turnId = null;
  let toolTurnId = null;
  let terminalEvent = null;
  let latestPreTerminalAgentMessage = null;
  let terminalAgentMessage = null;
  let terminalCount = 0;
  let primaryError = null;
  let closeError = null;
  const cleanupErrors = [];
  let unsubscribe = null;
  let releaseTool = null;
  let resolveTerminal;
  const terminalPromise = new Promise((resolve) => {
    resolveTerminal = resolve;
  });

  function record(notification, allowQueue = true) {
    let event;
    try {
      event =
        normalizeDynamicToolEvent(notification, allowedToolNames) ??
        normalizeEvent(notification);
    } catch {
      event = {
        method: notification?.method,
        threadId: notification?.params?.threadId,
        turnId: notification?.params?.turnId,
        complete: false,
        blockers: ["runtime-drift"],
      };
    }
    const scope = classifyEventScope(event);
    if (
      allowQueue &&
      ((scope.threadScoped && threadId === null) ||
        (scope.turnScoped && turnId === null))
    ) {
      pending.push(notification);
      return;
    }
    if (
      (scope.threadScoped && event.threadId !== threadId) ||
      (scope.turnScoped && event.turnId !== turnId)
    ) {
      event.blockers.push("foreign-event");
    }
    if (FORBIDDEN_ITEM_TYPES.has(event.item?.type)) {
      event.blockers.push("uncontrolled-tool-surface");
    }
    const postTerminal = terminalEvent !== null;
    if (postTerminal) {
      event.postTerminal = true;
      if (/^item\//u.test(String(event.method))) {
        event.blockers.push("post-terminal-event");
      }
    } else if (
      event.method === "item/completed" &&
      event.item?.type === "agentMessage"
    ) {
      latestPreTerminalAgentMessage = event;
    }
    event.blockers = unique(event.blockers);
    event.complete = event.blockers.length === 0;
    blockers.push(...event.blockers);
    events.push(event);
    if (
      event.method === "turn/completed" &&
      event.threadId === threadId &&
      event.turnId === turnId
    ) {
      terminalCount += 1;
      if (terminalCount === 1) {
        terminalEvent = event;
        terminalAgentMessage = latestPreTerminalAgentMessage;
        resolveTerminal(event);
      } else {
        blockers.push("duplicate-terminal-event");
      }
    }
  }

  function flushPending() {
    const queued = pending.splice(0);
    for (const notification of queued) record(notification, true);
  }

  try {
    if (
      !session?.client ||
      typeof session.client.request !== "function" ||
      typeof session.subscribe !== "function" ||
      typeof session.close !== "function" ||
      !Number.isSafeInteger(turnTimeoutMs) ||
      turnTimeoutMs < 1 ||
      !isJsonObject(outputSchema)
    ) {
      throw new TypeError("fresh evaluator turn input is malformed");
    }
    allowedToolNames = validateDynamicTools(
      dynamicTools,
      dynamicToolController,
    );
    if (dynamicTools.length > 0 && typeof session.setDynamicToolHandler !== "function") {
      throw new TypeError("fresh evaluator session lacks dynamic tool control");
    }
    const schemaValue = cloneJson(outputSchema, "fresh evaluator output schema");
    evidence.outputSchema = {
      value: schemaValue,
      byteLength: Buffer.byteLength(stableStringify(schemaValue)),
      sha256: sha256(stableStringify(schemaValue)),
    };
    const requestInput = cloneJson(input, "fresh evaluator turn input");
    evidence.input = await describeInput(root, requestInput);
    evidence.threadStart.request = buildFreshEvaluatorThreadStartRequest(
      root,
      dynamicTools,
    );
    if (!remoteControlSnapshotIsSafe(session.remoteControlSnapshot)) {
      blockers.push("unsafe-remote-control");
      throw new Error("fresh evaluator remote control is not safely disabled");
    }

    unsubscribe = session.subscribe(record, {
      afterCursor: Number.isSafeInteger(session.notificationCursor)
        ? session.notificationCursor
        : 0,
    });
    const threadResponse = await session.client.request(
      "thread/start",
      evidence.threadStart.request,
      30_000,
    );
    evidence.threadStart.response = summarizeThreadStart(threadResponse);
    threadId = evidence.threadStart.response.threadId;
    flushPending();
    if (
      evidence.threadStart.response.priorTurnCount !== 0 ||
      evidence.threadStart.response.instructionSources?.length !== 0
    ) {
      blockers.push("inherited-context");
    }
    evidence.thread = parseThreadStartResponse(
      threadResponse,
      evidence.threadStart.request,
    );
    threadId = evidence.thread.id;
    if (blockers.includes("inherited-context")) {
      throw new Error("fresh evaluator thread inherited context");
    }

    if (dynamicTools.length > 0) {
      releaseTool = session.setDynamicToolHandler(async (message) => {
        const params = message?.params;
        if (
          message?.method !== "item/tool/call" ||
          params?.threadId !== threadId ||
          typeof params?.turnId !== "string" ||
          !params.turnId ||
          typeof params?.callId !== "string" ||
          !params.callId ||
          typeof params?.tool !== "string" ||
          !allowedToolNames.has(params.tool) ||
          !isJsonObject(params.arguments)
        ) {
          throw new Error("fresh evaluator dynamic tool request is uncontrolled");
        }
        toolTurnId ??= params.turnId;
        if (
          params.turnId !== toolTurnId ||
          toolEvidence.some(({ callId }) => callId === params.callId)
        ) {
          throw new Error("fresh evaluator dynamic tool identity is inconsistent");
        }
        const argumentsValue = cloneJson(
          params.arguments,
          "fresh evaluator dynamic tool arguments",
        );
        if (containsCredentialText(argumentsValue)) {
          throw new Error("fresh evaluator dynamic tool arguments contain credentials");
        }
        const response = await dynamicToolController({
          threadId: params.threadId,
          turnId: params.turnId,
          callId: params.callId,
          tool: params.tool,
          arguments: argumentsValue,
        });
        if (
          !isJsonObject(response) ||
          typeof response.success !== "boolean" ||
          !Array.isArray(response.contentItems) ||
          response.contentItems.length !== 1 ||
          response.contentItems[0]?.type !== "inputText" ||
          typeof response.contentItems[0]?.text !== "string"
        ) {
          throw new Error("fresh evaluator dynamic tool response is malformed");
        }
        const responseText = response.contentItems[0].text;
        if (containsCredentialText(responseText)) {
          throw new Error("fresh evaluator dynamic tool response contains credentials");
        }
        toolEvidence.push({
          callId: params.callId,
          tool: params.tool,
          arguments: argumentsValue,
          argumentsSha256: sha256(stableStringify(argumentsValue)),
          status: response.success ? "completed" : "failed",
          response: {
            byteLength: Buffer.byteLength(responseText),
            sha256: sha256(responseText),
          },
        });
        return response;
      });
    }

    const currentInput = await describeInput(root, requestInput);
    if (stableStringify(currentInput) !== stableStringify(evidence.input)) {
      blockers.push("input-provenance-changed");
      throw new Error("fresh evaluator input provenance changed before turn start");
    }
    evidence.turn.request = {
      threadId,
      input: requestInput,
      approvalPolicy: "never",
      permissions: EVALUATION_PERMISSION_PROFILE,
      outputSchema: schemaValue,
    };
    const turnResponse = await session.client.request(
      "turn/start",
      evidence.turn.request,
      turnTimeoutMs,
    );
    const turn = turnResponse?.turn ?? turnResponse;
    turnId = turn?.id ?? turn?.turnId ?? null;
    evidence.turn.id = turnId;
    if (typeof turnId !== "string" || !turnId) {
      throw new Error("fresh evaluator turn id is missing");
    }
    if (toolTurnId !== null && toolTurnId !== turnId) {
      blockers.push("dynamic-tool-lifecycle-mismatch");
    }
    flushPending();

    let timeout;
    const timedOut = new Promise((resolve) => {
      timeout = setTimeout(() => resolve(null), turnTimeoutMs);
      timeout.unref?.();
    });
    const terminal = await Promise.race([terminalPromise, timedOut]);
    clearTimeout(timeout);
    if (terminal === null) {
      blockers.push("missing-terminal-event");
      await session.client
        .request("turn/interrupt", { threadId, turnId }, 10_000)
        .catch(() => {});
      throw new Error("fresh evaluator turn timed out");
    }
    evidence.mcpAfter = await listMcpServerStatus(session.client, threadId);
    verifyMcpRuntimeIsInert(session.mcpInventory, evidence.mcpAfter);
  } catch (error) {
    primaryError = error;
  } finally {
    try {
      await session?.close?.();
    } catch (error) {
      closeError = error;
      blockers.push("app-server-close-failed");
    }
    try {
      await releaseTool?.();
    } catch (error) {
      cleanupErrors.push(error);
      blockers.push("cleanup-dynamic-tool-release-failed");
    }
    try {
      await unsubscribe?.();
    } catch (error) {
      cleanupErrors.push(error);
      blockers.push("cleanup-unsubscribe-failed");
    }
    let processExitCode = null;
    let stderr = null;
    let remoteControl = null;
    for (const [label, snapshot] of [
      ["process-exit", () => session?.processExitCode ?? null],
      ["stderr", () => session?.stderr ?? null],
      ["remote-control", () => session?.remoteControlSnapshot ?? null],
    ]) {
      try {
        const value = snapshot();
        if (label === "process-exit") processExitCode = value;
        if (label === "stderr") stderr = value;
        if (label === "remote-control") remoteControl = value;
      } catch (error) {
        cleanupErrors.push(error);
        blockers.push(`cleanup-${label}-snapshot-failed`);
      }
    }
    evidence.appServer = {
      processExitCode,
      stderr,
      remoteControl,
    };
  }

  if (pending.length > 0) blockers.push("unresolved-notification");
  if (terminalCount === 0) blockers.push("missing-terminal-event");
  if (terminalCount > 1) blockers.push("duplicate-terminal-event");
  if (terminalEvent !== null && terminalEvent.turn?.status !== "completed") {
    blockers.push("turn-not-completed");
  }
  if (!dynamicLifecycleMatches(events, toolEvidence)) {
    blockers.push("dynamic-tool-lifecycle-mismatch");
  }
  if (events.some((event) => event.complete !== true)) {
    blockers.push("runtime-control-blocker");
  }
  if (evidence.appServer.processExitCode === null) {
    blockers.push("app-server-exit-unverified");
  } else if (evidence.appServer.processExitCode !== 0) {
    blockers.push("app-server-nonzero-exit");
  }
  if (evidence.appServer.stderr?.truncated === true) {
    blockers.push("app-server-stderr-truncated");
  }
  if (evidence.appServer.stderr?.byteLength !== 0) {
    blockers.push("app-server-stderr");
  }
  if (!remoteControlSnapshotIsSafe(evidence.appServer.remoteControl)) {
    blockers.push("unsafe-remote-control");
  }
  evidence.blockers = unique(blockers);

  if (
    primaryError !== null ||
    closeError !== null ||
    cleanupErrors.length > 0 ||
    evidence.blockers.length > 0
  ) {
    const failures = [primaryError, closeError, ...cleanupErrors].filter(Boolean);
    const cause =
      failures.length < 2
        ? failures[0] ?? new Error("fresh evaluator evidence is unsafe")
        : new AggregateError(failures, "fresh evaluator cleanup or turn failed", {
            cause: failures[0],
          });
    throw attachEvidence(
      cause,
      evidence,
    );
  }

  let outputText;
  let output;
  try {
    outputText = finalAgentText(terminalAgentMessage);
    output = JSON.parse(outputText);
  } catch (error) {
    throw attachEvidence(error, evidence);
  }
  return {
    ...evidence,
    output,
    outputText: {
      text: outputText,
      byteLength: Buffer.byteLength(outputText),
      sha256: sha256(outputText),
    },
  };
}
