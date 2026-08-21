import { randomUUID } from "node:crypto";
import { lstat, readFile, realpath, rm, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  createExclusiveRunRoot,
  classifyEventScope,
  EVALUATION_PERMISSION_PROFILE,
  evaluateHooksInventory,
  listMcpServerStatus,
  normalizeEvent,
  openAppServer,
  parseThreadStartResponse,
  prepareRuntime,
  proveWriteIsolation,
  removeIsolatedCodexHome,
  remoteControlSnapshotIsSafe,
  runBuffered,
  sha256,
  stableStringify,
  verifyMcpRuntimeIsInert,
} from "./collect-codex-app-server.mjs";
import {
  buildTicketEvaluationPrompt,
  buildTicketThreadStartRequest,
  captureGitWorkspaceSnapshot,
  compareGitWorkspaceSnapshots,
  assertTicketWorkspaceReady,
  deriveTicketPolicyState,
  handleTicketEvaluatorToolCall,
  parseTicketEvaluatorOutput,
  validateTicketInspectionEvidence,
  TICKET_AUTHORITY_PATHS,
  TICKET_EVALUATOR_TOOL_NAME,
  TICKET_OPERATION_PATHS,
  TICKET_READ_PATHS,
  TICKET_REQUIRED_OPERATIONS,
} from "./ticket-evaluator-provenance.mjs";

const PLAN_CANDIDATE_IDS = Object.freeze([
  "c1-normal",
  "c2-controlled-fault",
  "c3-successful-rework",
  "c3-unchanged-control",
  "c3-repeated-failure-control",
  "missing-evidence-control",
]);
const PLAN_AUTHORITY_PATHS = Object.freeze([
  "AGENTS.md",
  "TASKS.md",
  "skills/ticket/SKILL.md",
  "evals/fixtures/ticket-m1b/check.mjs",
  "evals/support/ticket-verdict.mjs",
]);
const PLAN_FORBIDDEN_SOURCES = Object.freeze([
  "implementer final report",
  "controller final report",
  "prior evaluator prose",
  "M1B raw transcript",
  "M1B aggregate evidence",
]);
const FULL_SHA = /^[0-9a-f]{40}$/u;
const PLAN_V1_ID = "joeness-ticket-m1c-prompt-manifest-v1";
const PLAN_V2_ID = "joeness-ticket-m1c-prompt-manifest-v2";
const PLAN_V3_ID = "joeness-ticket-m1c-prompt-manifest-v3";
const PLAN_V1_RUNTIME = Object.freeze({ codexVersion: "codex-cli 0.145.0" });
const PLAN_V2_RUNTIME = Object.freeze({ codexVersion: "codex-cli 0.146.0" });
const PLAN_V3_RUNTIME = Object.freeze({ codexVersion: "codex-cli 0.146.0" });
const PLAN_V2_PREDECESSOR = Object.freeze({
  path: "evals/experiments/joeness-ticket-m1c-prompt-manifest-v1.json",
  byteLength: 3428,
  sha256: "ddb28bb1c9c3795a77ef9b37158ab70210a549fe4a2ed33205bb280345680501",
  methodChange: "pin-codex-cli-0.146.0",
});
const PLAN_V3_PREDECESSOR = Object.freeze({
  path: "evals/experiments/joeness-ticket-m1c-prompt-manifest-v2.json",
  byteLength: 3738,
  sha256: "69d4a1f31d7f7dda9d4b30a05e7a26350df69f48787820afa72947f6377efcc5",
  methodChange: "dynamic-tool-operation-only-fixed-paths",
});
const TICKET_CHECKOUT_PATH_LIMIT = 248;

export function buildTicketRunId(mode, uuid = randomUUID()) {
  if (!["smoke", "batch"].includes(mode)) {
    throw new Error("Ticket evaluator run mode is invalid");
  }
  const compactUuid = uuid.replaceAll("-", "").toLowerCase();
  if (!/^[0-9a-f]{32}$/u.test(compactUuid)) {
    throw new Error("Ticket evaluator run UUID is invalid");
  }
  return `t-${mode === "smoke" ? "s" : "b"}-${compactUuid}`;
}

export function buildTicketCandidateDirectory(index) {
  if (!Number.isSafeInteger(index) || index < 0) {
    throw new Error("Ticket evaluator candidate index is invalid");
  }
  return `c${index + 1}`;
}

export function assertTicketCheckoutPathBudget(
  candidateRoot,
  repositoryPaths,
  limit = TICKET_CHECKOUT_PATH_LIMIT,
) {
  if (
    typeof candidateRoot !== 'string' ||
    !Array.isArray(repositoryPaths) ||
    repositoryPaths.length === 0 ||
    !Number.isSafeInteger(limit) ||
    limit < 1
  ) {
    throw new Error("Ticket evaluator checkout path budget input is invalid");
  }
  const resolvedRoot = path.resolve(candidateRoot);
  let longestPath = null;
  let maxFullPathLength = -1;
  for (const repositoryPath of repositoryPaths) {
    if (
      typeof repositoryPath !== 'string' ||
      !repositoryPath ||
      repositoryPath.includes('\0') ||
      path.isAbsolute(repositoryPath)
    ) {
      throw new Error("Ticket evaluator repository path is invalid");
    }
    const fullPath = path.resolve(
      resolvedRoot,
      ...repositoryPath.split("/"),
    );
    if (
      fullPath !== resolvedRoot &&
      !fullPath.startsWith(`${resolvedRoot}${path.sep}`)
    ) {
      throw new Error("Ticket evaluator repository path escapes checkout root");
    }
    if (fullPath.length > maxFullPathLength) {
      maxFullPathLength = fullPath.length;
      longestPath = repositoryPath;
    }
  }
  if (maxFullPathLength >= limit) {
    throw new Error(
      `Ticket evaluator checkout path budget exceeded: ${maxFullPathLength} >= ${limit}`,
    );
  }
  return { limit, maxFullPathLength, longestPath };
}

export function ticketAppServerFailureState(error) {
  const evidence = error?.ticketEvidence?.appServer;
  if (!evidence || typeof evidence !== 'object') {
    return null;
  }
  return {
    processTerminationConfirmed: evidence.processCloseConfirmed === true,
    sessionHealthy: false,
    launchEvidence: evidence,
  };
}

export function parseTicketEvaluatorCli(argv) {
  if (!Array.isArray(argv)) {
    throw new TypeError("Ticket evaluator arguments must be an array");
  }
  const options = {
    manifest: null,
    mode: null,
    candidate: null,
    output: null,
    rawOutput: null,
  };
  const names = new Map([
    ["--manifest", "manifest"],
    ["--mode", "mode"],
    ["--candidate", "candidate"],
    ["--output", "output"],
    ["--raw-output", "rawOutput"],
  ]);
  for (let index = 0; index < argv.length; index += 2) {
    const key = names.get(argv[index]);
    const value = argv[index + 1];
    if (
      !key ||
      typeof value !== "string" ||
      !value ||
      options[key] !== null
    ) {
      throw new Error("Ticket evaluator CLI arguments are malformed");
    }
    options[key] = value;
  }
  if (
    !options.manifest ||
    !["smoke", "batch"].includes(options.mode) ||
    !options.output
  ) {
    throw new Error("Ticket evaluator requires manifest, mode, and output");
  }
  if (options.mode === "smoke") {
    if (!options.candidate || options.rawOutput !== null) {
      throw new Error("smoke mode requires one candidate and no raw-output");
    }
  } else if (options.candidate !== null || !options.rawOutput) {
    throw new Error("batch mode requires raw-output and no candidate");
  }
  return options;
}

function exactObjectKeys(value, keys) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).sort().join("\0") === [...keys].sort().join("\0")
  );
}

export function validateTicketEvaluationPlan(value) {
  const isV1 = value?.id === PLAN_V1_ID;
  const isV2 = value?.id === PLAN_V2_ID;
  const isV3 = value?.id === PLAN_V3_ID;
  const hasRuntimeContract = isV2 || isV3;
  const expectedKeys = [
    "schemaVersion",
    "id",
    "originalGoal",
    "base",
    "authority",
    "inspection",
    "forbiddenNarrativeSources",
    "candidates",
    ...(hasRuntimeContract ? ["runtime", "predecessor"] : []),
  ];
  const expectedRuntime = isV3 ? PLAN_V3_RUNTIME : PLAN_V2_RUNTIME;
  const expectedPredecessor = isV3
    ? PLAN_V3_PREDECESSOR
    : PLAN_V2_PREDECESSOR;
  if (
    !exactObjectKeys(value, expectedKeys) ||
    value.schemaVersion !== (isV3 ? 3 : isV2 ? 2 : 1) ||
    (!isV1 && !isV2 && !isV3) ||
    (hasRuntimeContract &&
      (!exactObjectKeys(value.runtime, ["codexVersion"]) ||
        stableStringify(value.runtime) !== stableStringify(expectedRuntime) ||
        !exactObjectKeys(value.predecessor, [
          "path",
          "byteLength",
          "sha256",
          "methodChange",
        ]) ||
        stableStringify(value.predecessor) !==
          stableStringify(expectedPredecessor))) ||
    typeof value.originalGoal !== "string" ||
    !value.originalGoal.trim() ||
    !exactObjectKeys(value.base, ["sha", "tree"]) ||
    !FULL_SHA.test(value.base.sha) ||
    !FULL_SHA.test(value.base.tree) ||
    !exactObjectKeys(value.authority, ["revision", "paths"]) ||
    value.authority.revision !== value.base.sha ||
    stableStringify(value.authority.paths) !==
      stableStringify(PLAN_AUTHORITY_PATHS) ||
    !exactObjectKeys(
      value.inspection,
      isV3
        ? ["allowedPaths", "requiredOperations", "operationPaths"]
        : ["allowedPaths", "requiredOperations"],
    ) ||
    stableStringify(value.inspection.allowedPaths) !==
      stableStringify(TICKET_READ_PATHS) ||
    stableStringify(value.inspection.requiredOperations) !==
      stableStringify(TICKET_REQUIRED_OPERATIONS) ||
    (isV3 &&
      stableStringify(value.inspection.operationPaths) !==
        stableStringify(TICKET_OPERATION_PATHS)) ||
    stableStringify(value.forbiddenNarrativeSources) !==
      stableStringify(PLAN_FORBIDDEN_SOURCES) ||
    !Array.isArray(value.candidates) ||
    value.candidates.length !== PLAN_CANDIDATE_IDS.length
  ) {
    throw new Error("Ticket evaluation plan is malformed");
  }
  const seenShas = new Set();
  value.candidates.forEach((candidate, index) => {
    if (
      !exactObjectKeys(candidate, [
        "id",
        "sha",
        "tree",
        "parent",
        "previousSha",
        "reworkRound",
        "remoteRef",
      ]) ||
      candidate.id !== PLAN_CANDIDATE_IDS[index] ||
      ![
        candidate.sha,
        candidate.tree,
        candidate.parent,
        candidate.previousSha,
      ].every((entry) => typeof entry === "string" && FULL_SHA.test(entry)) ||
      seenShas.has(candidate.sha) ||
      !Number.isSafeInteger(candidate.reworkRound) ||
      ![0, 1].includes(candidate.reworkRound) ||
      typeof candidate.remoteRef !== "string" ||
      !/^refs\/remotes\/origin\/codex\/ticket-m1b-[a-z0-9-]+$/u.test(
        candidate.remoteRef,
      )
    ) {
      throw new Error(`Ticket evaluation candidate is malformed: ${index}`);
    }
    seenShas.add(candidate.sha);
  });
  const byId = new Map(value.candidates.map((candidate) => [candidate.id, candidate]));
  const graph = {
    "c1-normal": [value.base.sha, value.base.sha],
    "c2-controlled-fault": [byId.get("c1-normal").sha, byId.get("c1-normal").sha],
    "c3-successful-rework": [
      byId.get("c2-controlled-fault").sha,
      byId.get("c2-controlled-fault").sha,
    ],
    "c3-unchanged-control": [
      byId.get("c2-controlled-fault").sha,
      byId.get("c2-controlled-fault").sha,
    ],
    "c3-repeated-failure-control": [
      byId.get("c2-controlled-fault").sha,
      byId.get("c2-controlled-fault").sha,
    ],
    "missing-evidence-control": [
      byId.get("c1-normal").sha,
      byId.get("c1-normal").sha,
    ],
  };
  if (
    value.candidates.some(
      (candidate) =>
        candidate.parent !== graph[candidate.id][0] ||
        candidate.previousSha !== graph[candidate.id][1],
    )
  ) {
    throw new Error("Ticket evaluation candidate graph differs");
  }
  const serialized = stableStringify(value);
  if (/expected(?:Verdict|State)|ACCEPTED|USER_DECISION/u.test(serialized)) {
    throw new Error("Ticket evaluation plan leaks expected evaluator answers");
  }
  if (TICKET_AUTHORITY_PATHS.length !== PLAN_AUTHORITY_PATHS.length) {
    throw new Error("Ticket authority virtual path set drifted");
  }
  return structuredClone(value);
}

export function resolveTicketRuntimeContract(plan) {
  if (plan?.id === PLAN_V1_ID && plan?.schemaVersion === 1) {
    return { ...PLAN_V1_RUNTIME, generation: "v1" };
  }
  if (
    plan?.id === PLAN_V2_ID &&
    plan?.schemaVersion === 2 &&
    stableStringify(plan.runtime) === stableStringify(PLAN_V2_RUNTIME)
  ) {
    return { ...PLAN_V2_RUNTIME, generation: "v2" };
  }
  if (
    plan?.id === PLAN_V3_ID &&
    plan?.schemaVersion === 3 &&
    stableStringify(plan.runtime) === stableStringify(PLAN_V3_RUNTIME)
  ) {
    return { ...PLAN_V3_RUNTIME, generation: "v3" };
  }
  throw new Error("Ticket runtime contract is malformed");
}

function assertPreparedTicketRuntime(runtime, contract) {
  if (
    runtime?.version !== contract.codexVersion ||
    runtime?.doctor?.codexVersion !== contract.codexVersion.replace("codex-cli ", "")
  ) {
    throw new Error("prepared Ticket runtime contract differs");
  }
  return true;
}

export async function prepareTicketRuntime(
  runRoot,
  plan,
  prepareImpl = prepareRuntime,
) {
  const contract = resolveTicketRuntimeContract(plan);
  const runtime = await prepareImpl(runRoot, {
    expectedCodexVersion: contract.codexVersion,
  });
  assertPreparedTicketRuntime(runtime, contract);
  return runtime;
}

export function assertTicketSessionRuntime(session, contract) {
  const userAgent = session?.initializeResult?.userAgent;
  const version = contract.codexVersion.replace("codex-cli ", "");
  const escapedVersion = version.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const exactUserAgent = new RegExp(
    `^joewrks-codex-evidence-collector/${escapedVersion}(?:$|[ (])`,
    "u",
  );
  if (typeof userAgent !== "string" || !exactUserAgent.test(userAgent)) {
    throw new Error("Ticket App Server user agent differs from runtime contract");
  }
  return { expectedCodexVersion: contract.codexVersion, userAgent };
}

function unique(values) {
  return [...new Set(values)];
}

function ticketDynamicEvent(notification) {
  const method = notification?.method;
  const params = notification?.params;
  const item = params?.item;
  if (
    !["item/started", "item/completed"].includes(method) ||
    item?.type !== "dynamicToolCall"
  ) {
    return null;
  }
  const blockers = [];
  if (
    typeof params.threadId !== "string" ||
    !params.threadId ||
    typeof params.turnId !== "string" ||
    !params.turnId ||
    typeof item.id !== "string" ||
    !item.id ||
    item.tool !== TICKET_EVALUATOR_TOOL_NAME ||
    !item.arguments ||
    typeof item.arguments !== "object" ||
    Array.isArray(item.arguments)
  ) {
    blockers.push("uncontrolled-tool-surface");
  }
  const event = {
    method,
    threadId: params?.threadId,
    turnId: params?.turnId,
    complete: blockers.length === 0,
    blockers,
    item: {
      id: item?.id,
      type: item?.type,
      tool: item?.tool,
      operation: item?.arguments?.operation,
      path: item?.arguments?.path ?? null,
      status: item?.status,
    },
  };
  if (method === "item/started" && item?.status !== "inProgress") {
    blockers.push("required-status-missing");
  }
  if (method === "item/completed") {
    if (
      item?.status !== "completed" ||
      item?.success !== true ||
      !Array.isArray(item?.contentItems) ||
      item.contentItems.length !== 1 ||
      item.contentItems[0]?.type !== "inputText" ||
      typeof item.contentItems[0]?.text !== "string"
    ) {
      blockers.push("runtime-drift");
    } else {
      event.item.output = {
        byteLength: Buffer.byteLength(item.contentItems[0].text),
        sha256: sha256(item.contentItems[0].text),
      };
    }
  }
  event.blockers = unique(blockers);
  event.complete = event.blockers.length === 0;
  return event;
}

function normalizeTicketEvent(notification) {
  return ticketDynamicEvent(notification) ?? normalizeEvent(notification);
}

function finalAgentText(events) {
  const message = events.findLast(
    (event) =>
      event.method === "item/completed" &&
      event.item?.type === "agentMessage",
  );
  const text = message?.item?.text?.text;
  if (typeof text !== "string" || !text) {
    throw new Error("Ticket evaluator final message is missing");
  }
  return text;
}

export async function runTicketEvaluatorTurn({
  session,
  candidateRoot,
  built,
  context,
  turnTimeoutMs = 180_000,
}) {
  if (
    !session?.client?.request ||
    typeof session.subscribe !== "function" ||
    typeof session.setDynamicToolHandler !== "function" ||
    typeof session.close !== "function" ||
    typeof candidateRoot !== "string" ||
    !built?.manifest ||
    typeof built.prompt !== "string" ||
    built.dynamicTool?.name !== TICKET_EVALUATOR_TOOL_NAME ||
    !Number.isSafeInteger(turnTimeoutMs) ||
    turnTimeoutMs < 1
  ) {
    throw new Error("Ticket evaluator turn input is malformed");
  }
  if (!remoteControlSnapshotIsSafe(session.remoteControlSnapshot)) {
    throw new Error("remote control is not safely disabled");
  }

  const events = [];
  const blockers = [];
  const pending = [];
  const toolEvidence = [];
  let threadId = null;
  let turnId = null;
  let toolTurnId = null;
  let terminalEvent = null;
  let terminalCount = 0;
  let thread = null;
  let turnRequest = null;
  let mcpAfter = null;
  let primaryError = null;
  let closeError = null;
  let resolveTerminal;
  const terminalPromise = new Promise((resolve) => {
    resolveTerminal = resolve;
  });

  function record(notification, allowQueue = true) {
    const event = normalizeTicketEvent(notification);
    const scope = classifyEventScope(event);
    if (
      allowQueue &&
      ((scope.threadScoped && !threadId) || (scope.turnScoped && !turnId))
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
    if (
      event.item?.type === "commandExecution" ||
      ["fileChange", "mcpToolCall", "webSearch", "collabAgentToolCall"].includes(
        event.item?.type,
      )
    ) {
      event.blockers.push("uncontrolled-tool-surface");
    }
    event.blockers = unique(event.blockers);
    event.complete = event.blockers.length === 0;
    blockers.push(...event.blockers);
    events.push(event);
    if (event.method === "turn/completed") {
      terminalCount += 1;
      if (terminalCount === 1) {
        terminalEvent = event;
        resolveTerminal(event);
      } else {
        blockers.push("duplicate-terminal-event");
      }
    }
  }

  function flushPending() {
    const queued = pending.splice(0);
    for (const notification of queued) record(notification, false);
  }

  const unsubscribe = session.subscribe(record, {
    afterCursor: Number.isSafeInteger(session.notificationCursor)
      ? session.notificationCursor
      : 0,
  });
  let releaseTool = null;
  try {
    const threadRequest = buildTicketThreadStartRequest(
      candidateRoot,
      built.dynamicTool,
    );
    const threadResponse = await session.client.request(
      "thread/start",
      threadRequest,
      30_000,
    );
    thread = parseThreadStartResponse(threadResponse, threadRequest);
    threadId = thread.id;
    flushPending();
    if (thread.priorTurnCount !== 0 || thread.instructionSources.length !== 0) {
      throw new Error("Ticket evaluator thread is not context-separated");
    }

    releaseTool = session.setDynamicToolHandler(async (message) => {
      if (message?.params?.threadId !== threadId) {
        throw new Error("Ticket tool request belongs to a foreign thread");
      }
      toolTurnId ??= message?.params?.turnId;
      if (message?.params?.turnId !== toolTurnId) {
        throw new Error("Ticket tool request belongs to a foreign turn");
      }
      return handleTicketEvaluatorToolCall(message, {
        threadId,
        turnId: toolTurnId,
        context,
        evidence: toolEvidence,
      });
    });

    turnRequest = {
      threadId,
      input: [{ type: "text", text: built.prompt }],
      approvalPolicy: "never",
      permissions: EVALUATION_PERMISSION_PROFILE,
    };
    const turnResponse = await session.client.request(
      "turn/start",
      turnRequest,
      turnTimeoutMs,
    );
    const turn = turnResponse?.turn ?? turnResponse;
    turnId = turn?.id ?? turn?.turnId;
    if (typeof turnId !== "string" || !turnId) {
      throw new Error("Ticket evaluator turn id is missing");
    }
    if (toolTurnId !== null && toolTurnId !== turnId) {
      throw new Error("Ticket tool events differ from the active turn");
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
      await session.client
        .request("turn/interrupt", { threadId, turnId }, 10_000)
        .catch(() => {});
      throw new Error("Ticket evaluator turn timed out");
    }
    mcpAfter = await listMcpServerStatus(session.client, threadId);
    verifyMcpRuntimeIsInert(session.mcpInventory, mcpAfter);
  } catch (error) {
    primaryError = error;
  } finally {
    try {
      await session.close();
      if (
        session.processExitCode !== 0 ||
        session.stderr?.truncated === true ||
        session.stderr?.byteLength !== 0 ||
        !remoteControlSnapshotIsSafe(session.remoteControlSnapshot)
      ) {
        throw new Error("Ticket evaluator App Server final state is unsafe");
      }
    } catch (error) {
      closeError = error;
    }
    releaseTool?.();
    unsubscribe();
  }

  if (pending.length !== 0) {
    blockers.push("event-correlation-unresolved");
  }
  if (terminalEvent?.turn?.status !== "completed") {
    blockers.push("turn-not-completed");
  }
  const observedOperations = toolEvidence.map(({ operation }) => operation);
  if (
    stableStringify([...observedOperations].sort()) !==
    stableStringify([...built.manifest.inspection.requiredOperations].sort())
  ) {
    blockers.push("required-ticket-inspection-missing");
  }
  if (!ticketToolLifecycleMatches(events, toolEvidence)) {
    blockers.push("ticket-tool-lifecycle-mismatch");
  }
  if (events.some((event) => event.complete !== true)) {
    blockers.push("runtime-control-blocker");
  }
  if (!remoteControlSnapshotIsSafe(session.remoteControlSnapshot)) {
    blockers.push("remote-control-unverified");
  }
  const finalBlockers = unique(blockers);
  const partialEvidence = {
    thread,
    turn: { id: turnId, request: turnRequest },
    prompt: {
      byteLength: Buffer.byteLength(built.prompt),
      sha256: sha256(built.prompt),
      requestSha256:
        turnRequest === null ? null : sha256(stableStringify(turnRequest)),
    },
    events,
    toolEvidence,
    mcpAfter,
    blockers: finalBlockers,
    appServer: {
      processExitCode: session.processExitCode,
      stderr: session.stderr,
      remoteControl: session.remoteControlSnapshot,
    },
  };
  if (primaryError !== null || closeError !== null) {
    const error = new AggregateError(
      [primaryError, closeError].filter(Boolean),
      "Ticket evaluator turn or final drain failed",
      { cause: primaryError ?? closeError },
    );
    error.ticketEvidence = partialEvidence;
    throw error;
  }
  try {
    const outputText = finalAgentText(events);
    const output = parseTicketEvaluatorOutput(outputText, {
      candidateSha: context.candidateSha,
    });
    return {
      ...partialEvidence,
      output,
      outputText: {
        byteLength: Buffer.byteLength(outputText),
        sha256: sha256(outputText),
        text: outputText,
      },
    };
  } catch (cause) {
    const error = new Error("Ticket evaluator output validation failed", { cause });
    error.ticketEvidence = partialEvidence;
    throw error;
  }
}

function ticketToolLifecycleMatches(events, toolEvidence) {
  const dynamicEvents = events.filter(
    (event) => event.item?.type === "dynamicToolCall",
  );
  if (dynamicEvents.length !== toolEvidence.length * 2) return false;
  return toolEvidence.every((evidence) => {
    const lifecycle = dynamicEvents.filter(
      (event) => event.item?.id === evidence.callId,
    );
    if (
      lifecycle.length !== 2 ||
      lifecycle[0].method !== "item/started" ||
      lifecycle[1].method !== "item/completed"
    ) {
      return false;
    }
    return lifecycle.every(
      (event) =>
        event.item.tool === TICKET_EVALUATOR_TOOL_NAME &&
        event.item.operation === evidence.operation &&
        event.item.path === evidence.path,
    ) &&
      lifecycle[1].item.output?.sha256 === evidence.responseSha256 &&
      lifecycle[1].item.output?.byteLength === evidence.responseByteLength;
  });
}

async function runProcess(executable, args, options = {}) {
  const result = await runBuffered(executable, args, {
    timeoutMs: 60_000,
    maxOutputBytes: 4 * 1024 * 1024,
    windowsHide: true,
    ...options,
  });
  return {
    argv: [executable, ...args],
    exitCode: result.processExitCode,
    signal: result.signal,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

async function runGit(repositoryRoot, args, { requireEmptyStderr = false } = {}) {
  const result = await runProcess("git", args, { cwd: repositoryRoot });
  if (
    result.exitCode !== 0 ||
    result.signal !== null ||
    (requireEmptyStderr && result.stderr !== "")
  ) {
    const error = new Error(`Git command failed: git ${args.join(" ")}`);
    error.ticketEvidence = { process: processEvidence(result) };
    throw error;
  }
  return result;
}

export async function runTicketGit(repositoryRoot, args, options = {}) {
  return runGit(repositoryRoot, args, options);
}

function processEvidence(result) {
  return {
    argv: result.argv,
    exitCode: result.exitCode,
    signal: result.signal,
    stdout: {
      byteLength: Buffer.byteLength(result.stdout),
      sha256: sha256(result.stdout),
      text: result.stdout,
    },
    stderr: {
      byteLength: Buffer.byteLength(result.stderr),
      sha256: sha256(result.stderr),
      text: result.stderr,
    },
  };
}

export function serializeTicketError(error, depth = 0) {
  if (depth > 4) {
    return { name: "Error", message: "nested error depth exceeded" };
  }
  const value = {
    name: error?.name ?? "Error",
    message: error?.message ?? String(error),
  };
  if (Array.isArray(error?.errors)) {
    value.errors = error.errors.map((entry) =>
      serializeTicketError(entry, depth + 1),
    );
  }
  if (error?.cause && error.cause !== error) {
    value.cause = serializeTicketError(error.cause, depth + 1);
  }
  if (error?.ticketEvidence !== undefined) {
    value.ticketEvidence = error.ticketEvidence;
  }
  return value;
}

async function gitObjectText(repositoryRoot, revision, objectPath) {
  const result = await runGit(
    repositoryRoot,
    ["show", `${revision}:${objectPath}`],
    { requireEmptyStderr: true },
  );
  return result.stdout;
}

async function buildAuthorityFiles(repositoryRoot, plan) {
  const actualToVirtual = new Map([
    ["AGENTS.md", "authority/AGENTS.md"],
    ["TASKS.md", "authority/TASKS.md"],
    ["skills/ticket/SKILL.md", "authority/ticket-SKILL.md"],
    ["evals/fixtures/ticket-m1b/check.mjs", "authority/check.mjs"],
    ["evals/support/ticket-verdict.mjs", "authority/ticket-verdict.mjs"],
  ]);
  const entries = await Promise.all(
    plan.authority.paths.map(async (objectPath) => [
      actualToVirtual.get(objectPath),
      await gitObjectText(repositoryRoot, plan.authority.revision, objectPath),
    ]),
  );
  if (entries.some(([virtualPath]) => typeof virtualPath !== "string")) {
    throw new Error("Ticket authority path mapping is incomplete");
  }
  return Object.fromEntries(entries);
}

function directCheckerCriteria(toolEvidence) {
  const checker = toolEvidence.find(({ operation }) => operation === "RunChecker");
  const criteria = checker?.result?.result?.criteria;
  if (!Array.isArray(criteria)) {
    throw new Error("direct Ticket checker evidence is missing");
  }
  return criteria.map(({ id, verdict }) => ({ id, verdict }));
}

function evaluatorCriteria(output) {
  return output.criteria.map(({ id, verdict }) => ({ id, verdict }));
}

const EXPECTED_POLICY_STATES = Object.freeze({
  "c1-normal": "ACCEPTED",
  "c2-controlled-fault": "REWORK",
  "c3-successful-rework": "ACCEPTED",
  "c3-unchanged-control": "USER_DECISION",
  "c3-repeated-failure-control": "USER_DECISION",
  "missing-evidence-control": "UNVERIFIED",
});

async function verifyPlanGitObjects(repositoryRoot, plan) {
  const baseTree = (
    await runGit(repositoryRoot, ["rev-parse", `${plan.base.sha}^{tree}`], {
      requireEmptyStderr: true,
    })
  ).stdout.trim();
  if (baseTree !== plan.base.tree) {
    throw new Error("M1C BASE tree differs from the plan");
  }
  const authorityBlobs = Object.fromEntries(
    await Promise.all(
      plan.authority.paths.map(async (objectPath) => {
        const blob = await runGit(
          repositoryRoot,
          ["rev-parse", `${plan.authority.revision}:${objectPath}`],
          { requireEmptyStderr: true },
        );
        return [objectPath, blob.stdout.trim()];
      }),
    ),
  );
  const candidates = [];
  for (const candidate of plan.candidates) {
    const [remote, tree, parent] = await Promise.all([
      runGit(repositoryRoot, ["rev-parse", candidate.remoteRef], {
        requireEmptyStderr: true,
      }),
      runGit(repositoryRoot, ["rev-parse", `${candidate.sha}^{tree}`], {
        requireEmptyStderr: true,
      }),
      runGit(repositoryRoot, ["rev-parse", `${candidate.sha}^`], {
        requireEmptyStderr: true,
      }),
    ]);
    if (
      remote.stdout.trim() !== candidate.sha ||
      tree.stdout.trim() !== candidate.tree ||
      parent.stdout.trim() !== candidate.parent
    ) {
      throw new Error(`M1C candidate Git identity differs: ${candidate.id}`);
    }
    const candidateAuthority = Object.fromEntries(
      await Promise.all(
        plan.authority.paths.map(async (objectPath) => {
          const blob = await runGit(
            repositoryRoot,
            ["rev-parse", `${candidate.sha}:${objectPath}`],
            { requireEmptyStderr: true },
          );
          return [objectPath, blob.stdout.trim()];
        }),
      ),
    );
    if (stableStringify(candidateAuthority) !== stableStringify(authorityBlobs)) {
      throw new Error(`M1C authority changed in candidate: ${candidate.id}`);
    }
    candidates.push({ id: candidate.id, authorityBlobs: candidateAuthority });
  }
  return { authorityRevision: plan.authority.revision, authorityBlobs, candidates };
}

async function snapshotFile(repositoryRoot, relativePath) {
  const bytes = await readFile(path.join(repositoryRoot, relativePath));
  return {
    path: relativePath.replaceAll("\\", "/"),
    byteLength: bytes.length,
    sha256: sha256(bytes),
  };
}

export async function verifyTicketPlanPredecessor(repositoryRoot, plan) {
  if (plan.id === PLAN_V1_ID) return null;
  const observed = await snapshotFile(repositoryRoot, plan.predecessor.path);
  const expected = {
    path: plan.predecessor.path,
    byteLength: plan.predecessor.byteLength,
    sha256: plan.predecessor.sha256,
  };
  if (stableStringify(observed) !== stableStringify(expected)) {
    throw new Error("Ticket predecessor artifact differs from the plan");
  }
  return observed;
}

function runtimeEvidence(runtime) {
  return {
    version: runtime.version,
    doctor: runtime.doctor,
    protocolSchema: runtime.protocolSchema,
    permissionProfile: runtime.permissionProfile,
    requestedFeatureControls: runtime.requestedFeatureControls,
    mcpInventory: runtime.mcpInventory,
  };
}

export async function reserveTicketOutputPaths(targetPaths) {
  if (
    !Array.isArray(targetPaths) ||
    targetPaths.length === 0 ||
    new Set(targetPaths.map((targetPath) => path.resolve(targetPath))).size !==
      targetPaths.length
  ) {
    throw new Error("Ticket output reservation paths are malformed");
  }
  const targets = targetPaths.map((targetPath) => path.resolve(targetPath));
  const locks = [];
  try {
    for (const target of targets) {
      try {
        await lstat(target);
        throw new Error(`Ticket output already exists: ${target}`);
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
      }
      const lock = path.join(
        path.resolve(tmpdir()),
        `joeness-ticket-output-${sha256(target)}.lock`,
      );
      await writeFile(
        lock,
        `${JSON.stringify({ status: "reserved", target })}\n`,
        { encoding: "utf8", flag: "wx" },
      );
      locks.push(lock);
    }
  } catch (error) {
    await Promise.all(locks.map((lock) => unlink(lock).catch(() => {})));
    throw new Error("Ticket output exists or is already reserved", { cause: error });
  }
  let released = false;
  return {
    targets,
    locks: [...locks],
    async release() {
      if (released) return;
      released = true;
      const results = await Promise.allSettled(locks.map((lock) => unlink(lock)));
      const errors = results
        .filter(({ status }) => status === "rejected")
        .map(({ reason }) => reason);
      if (errors.length !== 0) {
        throw new AggregateError(errors, "Ticket output reservation release failed");
      }
    },
  };
}

async function writeJsonExclusive(targetPath, value) {
  const text = `${JSON.stringify(value, null, 2)}\n`;
  await writeFile(targetPath, text, { encoding: "utf8", flag: "wx" });
  return {
    path: targetPath,
    byteLength: Buffer.byteLength(text),
    sha256: sha256(text),
  };
}

async function snapshotJsonArtifact(targetPath) {
  try {
    const bytes = await readFile(targetPath);
    return {
      path: targetPath,
      byteLength: bytes.length,
      sha256: sha256(bytes),
    };
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

function safeRunRoot(runRoot) {
  const relative = path.relative(path.resolve(tmpdir()), path.resolve(runRoot));
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
}

export function ticketRunRootRetentionRequired(bodyError, cleanupErrors) {
  return bodyError !== null || cleanupErrors.length !== 0;
}

export async function runTicketEvaluationBatch({
  repositoryRoot,
  manifestPath,
  mode,
  candidateId = null,
}) {
  const resolvedRepository = await realpath(repositoryRoot);
  const manifestText = await readFile(manifestPath, "utf8");
  const plan = validateTicketEvaluationPlan(JSON.parse(manifestText));
  const runtimeContract = resolveTicketRuntimeContract(plan);
  const predecessorEvidence = await verifyTicketPlanPredecessor(
    resolvedRepository,
    plan,
  );
  const selected =
    mode === "smoke"
      ? plan.candidates.filter(({ id }) => id === candidateId)
      : plan.candidates;
  if (selected.length !== (mode === "smoke" ? 1 : plan.candidates.length)) {
    throw new Error("Ticket evaluator candidate selection is invalid");
  }
  const statusBefore = await runGit(resolvedRepository, ["status", "--porcelain=v1"], {
    requireEmptyStderr: true,
  });
  if (statusBefore.stdout !== "") {
    throw new Error("Ticket evaluator requires a clean repository");
  }
  const planGitEvidence = await verifyPlanGitObjects(resolvedRepository, plan);
  const [head, tree, worktreesBefore] = await Promise.all([
    runGit(resolvedRepository, ["rev-parse", "HEAD"], {
      requireEmptyStderr: true,
    }),
    runGit(resolvedRepository, ["rev-parse", "HEAD^{tree}"], {
      requireEmptyStderr: true,
    }),
    runGit(resolvedRepository, ["worktree", "list", "--porcelain"], {
      requireEmptyStderr: true,
    }),
  ]);
  const authorityFiles = await buildAuthorityFiles(resolvedRepository, plan);
  const runRoot = await createExclusiveRunRoot(buildTicketRunId(mode));
  const candidateRoots = [];
  let runtime = null;
  let session = null;
  const cases = [];
  let activeCase = null;
  let bodyError = null;
  const cleanupErrors = [];
  let worktreesAfter = null;
  let statusAfter = null;
  let processTerminationConfirmed = true;
  let sessionHealthy = true;
  let worktreesRemoved = true;
  let isolatedHomeRemoved = true;
  let runRootState = "retained";
  try {
    runtime = await prepareTicketRuntime(runRoot, plan);

    for (const [index, candidate] of selected.entries()) {
      session = await openAppServer(runtime);
      const runtimeSession = assertTicketSessionRuntime(session, runtimeContract);
      const initialMcp = await listMcpServerStatus(session.client);
      verifyMcpRuntimeIsInert(session.mcpInventory, initialMcp);
      const candidateRoot = path.join(
        runRoot,
        buildTicketCandidateDirectory(index),
      );
      const treePaths = await runGit(
        resolvedRepository,
        ["ls-tree", "-r", "--name-only", "-z", candidate.sha],
        { requireEmptyStderr: true },
      );
      const checkoutPathBudget = assertTicketCheckoutPathBudget(
        candidateRoot,
        treePaths.stdout.split("\0").filter(Boolean),
      );
      await runGit(resolvedRepository, [
        "worktree",
        "add",
        "--detach",
        candidateRoot,
        candidate.sha,
      ]);
      candidateRoots.push(candidateRoot);
      const before = await captureGitWorkspaceSnapshot(candidateRoot);
      if (
        before.identity.head !== candidate.sha ||
        before.identity.tree !== candidate.tree ||
        before.identity.detached !== true
      ) {
        throw new Error(`detached candidate state differs: ${candidate.id}`);
      }
      assertTicketWorkspaceReady(before);
      const [hooksResponse, writeIsolation] = await Promise.all([
        session.client.request("hooks/list", { cwds: [candidateRoot] }, 15_000),
        proveWriteIsolation(
          session.client,
          candidateRoot,
          path.join(candidateRoot, ".joewrks-ticket-write-probe"),
        ),
      ]);
      const hookControl = evaluateHooksInventory(hooksResponse, candidateRoot);
      if (!hookControl.complete || writeIsolation.status !== "pass") {
        throw new Error(`Ticket evaluator isolation failed: ${candidate.id}`);
      }

      const built = buildTicketEvaluationPrompt({
        originalGoal: plan.originalGoal,
        base: plan.base,
        candidate: {
          id: candidate.id,
          sha: candidate.sha,
          tree: candidate.tree,
          parent: candidate.parent,
          previousSha: candidate.previousSha,
          reworkRound: candidate.reworkRound,
        },
        authorityFiles,
        inspection: plan.inspection,
      });
      activeCase = {
        candidate,
        promptManifest: built.manifest,
        promptText: built.prompt,
        dynamicTool: built.dynamicTool,
        isolation: {
          hookControl,
          writeIsolation,
          runtimeSession,
          checkoutPathBudget,
        },
        before,
      };
      const turn = await runTicketEvaluatorTurn({
        session,
        candidateRoot,
        built,
        context: {
          root: candidateRoot,
          baseSha: plan.base.sha,
          candidateSha: candidate.sha,
          previousSha: candidate.previousSha,
          allowedPaths: plan.inspection.allowedPaths,
          ...(plan.inspection.operationPaths
            ? { operationPaths: plan.inspection.operationPaths }
            : {}),
        },
      });
      session = null;
      const after = await captureGitWorkspaceSnapshot(candidateRoot);
      const stateComparison = compareGitWorkspaceSnapshots(before, after);
      const criteriaMatch =
        stableStringify(directCheckerCriteria(turn.toolEvidence)) ===
        stableStringify(evaluatorCriteria(turn.output));
      const inspectionEvidenceValid = validateTicketInspectionEvidence(
        turn.toolEvidence,
        { baseSha: plan.base.sha, candidate },
      );
      const policy = deriveTicketPolicyState({
        checkerState: turn.output.checkerState,
        reworkRound: candidate.reworkRound,
      });
      const passed =
        turn.blockers.length === 0 &&
        turn.output.alignment === "PASS" &&
        criteriaMatch &&
        inspectionEvidenceValid &&
        stateComparison.equal &&
        policy.state === EXPECTED_POLICY_STATES[candidate.id];
      cases.push({
        ...activeCase,
        turn,
        after,
        stateComparison,
        criteriaMatch,
        inspectionEvidenceValid,
        policy,
        expectedPolicyState: EXPECTED_POLICY_STATES[candidate.id],
        status: passed ? "pass" : "fail",
      });
      activeCase = null;
    }
  } catch (error) {
    const appServerFailure = ticketAppServerFailureState(error);
    if (appServerFailure !== null) {
      processTerminationConfirmed =
        appServerFailure.processTerminationConfirmed;
      sessionHealthy = appServerFailure.sessionHealthy;
    }
    if (activeCase !== null) {
      cases.push({
        ...activeCase,
        turn: error?.ticketEvidence ?? null,
        status: "blocked",
        error: serializeTicketError(error),
      });
      activeCase = null;
    }
    bodyError = error;
  } finally {
    if (session !== null) {
      processTerminationConfirmed = false;
      sessionHealthy = false;
      try {
        await session.close();
        processTerminationConfirmed = true;
        sessionHealthy = true;
        if (session.processExitCode !== 0) {
          cleanupErrors.push(new Error("Ticket App Server exited nonzero"));
          sessionHealthy = false;
        }
        if (session.stderr.truncated || session.stderr.byteLength !== 0) {
          cleanupErrors.push(new Error("Ticket App Server wrote stderr"));
          sessionHealthy = false;
        }
        if (!remoteControlSnapshotIsSafe(session.remoteControlSnapshot)) {
          cleanupErrors.push(
            new Error("Ticket App Server remote control is not safely disabled"),
          );
          sessionHealthy = false;
        }
      } catch (error) {
        processTerminationConfirmed = session.processCloseConfirmed === true;
        cleanupErrors.push(error);
      }
    }
    if (processTerminationConfirmed) {
      for (const candidateRoot of [...candidateRoots].reverse()) {
        try {
          await runGit(resolvedRepository, ["worktree", "remove", candidateRoot]);
        } catch (error) {
          worktreesRemoved = false;
          cleanupErrors.push(error);
        }
      }
    } else {
      worktreesRemoved = false;
      cleanupErrors.push(
        new Error("Ticket candidate worktrees retained because process termination is unconfirmed"),
      );
    }
    if (runtime !== null) {
      isolatedHomeRemoved = false;
      if (processTerminationConfirmed) {
        try {
          await removeIsolatedCodexHome(runRoot, runtime.isolatedCodexHome);
          isolatedHomeRemoved = true;
        } catch (error) {
          cleanupErrors.push(error);
        }
      }
    }
    try {
      [worktreesAfter, statusAfter] = await Promise.all([
        runGit(resolvedRepository, ["worktree", "list", "--porcelain"], {
          requireEmptyStderr: true,
        }),
        runGit(resolvedRepository, ["status", "--porcelain=v1"], {
          requireEmptyStderr: true,
        }),
      ]);
      if (worktreesBefore.stdout !== worktreesAfter.stdout) {
        cleanupErrors.push(new Error("Ticket worktree registry was not restored"));
      }
      if (statusAfter.stdout !== "") {
        cleanupErrors.push(new Error("Ticket repository changed during evaluation"));
      }
    } catch (error) {
      cleanupErrors.push(error);
    }
    if (
      processTerminationConfirmed &&
      worktreesRemoved &&
      isolatedHomeRemoved &&
      !ticketRunRootRetentionRequired(bodyError, cleanupErrors)
    ) {
      if (safeRunRoot(runRoot)) {
        try {
          await rm(runRoot, { recursive: true, force: false });
          try {
            await lstat(runRoot);
            runRootState = "retained";
            cleanupErrors.push(new Error("Ticket evaluator run root still exists after removal"));
          } catch (error) {
            if (error?.code === "ENOENT") {
              runRootState = "removed";
            } else {
              runRootState = "unknown";
              cleanupErrors.push(error);
            }
          }
        } catch (error) {
          cleanupErrors.push(error);
          try {
            await lstat(runRoot);
            runRootState = "retained";
          } catch (readbackError) {
            runRootState = readbackError?.code === "ENOENT" ? "removed" : "unknown";
            if (readbackError?.code !== "ENOENT") cleanupErrors.push(readbackError);
          }
        }
      } else {
        cleanupErrors.push(new Error("Ticket evaluator run root is unsafe to remove"));
      }
    }
  }
  if (bodyError !== null || cleanupErrors.length !== 0) {
    const error = new AggregateError(
      [bodyError, ...cleanupErrors].filter(Boolean),
      bodyError === null
        ? "Ticket evaluator cleanup failed"
        : "Ticket evaluator execution or cleanup failed",
      { cause: bodyError ?? cleanupErrors[0] },
    );
    error.ticketEvidence = {
      runRoot: {
        path: runRoot,
        state: runRootState,
      },
      cases,
      cleanup: {
        processTerminationConfirmed,
        sessionHealthy,
        worktreesRemoved,
        candidateRoots: [...candidateRoots],
        isolatedHomeRemoved,
        isolatedCodexHome:
          runtime === null
            ? null
            : {
                path: runtime.isolatedCodexHome,
                state: isolatedHomeRemoved
                  ? "removed"
                  : processTerminationConfirmed
                    ? "unknown"
                    : "retained-process-unconfirmed",
              },
        errors: cleanupErrors.map(serializeTicketError),
      },
    };
    throw error;
  }
  const worktreeRegistryEqual =
    worktreesBefore.stdout === worktreesAfter.stdout;
  const repositoryCleanAfter = statusAfter.stdout === "";
  const threadIds = cases.map(({ turn }) => turn.thread.id);
  const turnIds = cases.map(({ turn }) => turn.turn.id);
  const allPassed =
    cases.length === selected.length &&
    cases.every(({ status }) => status === "pass") &&
    new Set(threadIds).size === threadIds.length &&
    new Set(turnIds).size === turnIds.length &&
    worktreeRegistryEqual &&
    repositoryCleanAfter;
  return {
    schemaVersion: 1,
    id: `joeness-ticket-m1c-${mode}-${runtimeContract.generation}`,
    result: allPassed
      ? "ticket-evaluator-provenance-pass"
      : "ticket-evaluator-provenance-fail",
    classification: mode === "smoke" ? "disposable-smoke" : "m1c-strict-e2e",
    m1cPass: allPassed,
    promotionPass: false,
    plan: {
      path: path.relative(resolvedRepository, manifestPath).replaceAll("\\", "/"),
      byteLength: Buffer.byteLength(manifestText),
      sha256: sha256(manifestText),
      value: plan,
      predecessorEvidence,
      gitEvidence: planGitEvidence,
    },
    infrastructure: {
      repositoryHead: head.stdout.trim(),
      repositoryTree: tree.stdout.trim(),
      files: await Promise.all([
        snapshotFile(
          resolvedRepository,
          "evals/support/ticket-evaluator-provenance.mjs",
        ),
        snapshotFile(
          resolvedRepository,
          "evals/support/run-ticket-evaluator.mjs",
        ),
        snapshotFile(
          resolvedRepository,
          "evals/support/collect-codex-app-server.mjs",
        ),
      ]),
      runtime: runtimeEvidence(runtime),
    },
    worktreeRegistry: {
      before: processEvidence(worktreesBefore),
      after: processEvidence(worktreesAfter),
      equal: worktreeRegistryEqual,
    },
    repositoryCleanBefore: statusBefore.stdout === "",
    repositoryCleanAfter,
    uniqueThreadIds: new Set(threadIds).size === threadIds.length,
    uniqueTurnIds: new Set(turnIds).size === turnIds.length,
    cases,
    limitations: [
      "This proves exact evaluator user input, absent project instruction sources, controlled tool evidence, and candidate-worktree non-mutation; it does not expose provider-internal system instructions.",
      "The evaluator is context-separated but remains the same model family, not an independent organization.",
      "This controlled fixture does not measure real-project quality or efficiency; M6 remains required.",
    ],
  };
}

async function writeFailure(options, error) {
  const value = buildTicketFailureRecord(
    options.mode,
    error,
    options.manifestRequest,
  );
  if (options.mode === "batch" && options.rawOutput) {
    const rawPath = path.resolve(options.rawOutput);
    const summaryPath = path.resolve(options.output);
    const raw =
      (await snapshotJsonArtifact(rawPath)) ??
      (await writeJsonExclusive(rawPath, value));
    if ((await snapshotJsonArtifact(summaryPath)) === null) {
      await writeJsonExclusive(summaryPath, { ...value, raw });
    }
  } else {
    const outputPath = path.resolve(options.output);
    if ((await snapshotJsonArtifact(outputPath)) === null) {
      await writeJsonExclusive(outputPath, value);
    }
  }
}

export async function snapshotTicketManifestRequest(manifestPath) {
  const resolvedPath = path.resolve(manifestPath);
  try {
    const bytes = await readFile(resolvedPath);
    const request = {
      path: resolvedPath,
      byteLength: bytes.length,
      sha256: sha256(bytes),
    };
    try {
      const plan = validateTicketEvaluationPlan(JSON.parse(bytes.toString("utf8")));
      const runtime = resolveTicketRuntimeContract(plan);
      return {
        ...request,
        status: "validated",
        id: plan.id,
        runtime,
      };
    } catch (error) {
      return {
        ...request,
        status: "invalid",
        validationError: serializeTicketError(error),
      };
    }
  } catch (error) {
    return {
      path: resolvedPath,
      status: "unreadable",
      readError: serializeTicketError(error),
    };
  }
}

export function buildTicketFailureRecord(mode, error, manifestRequest = null) {
  const generation = manifestRequest?.runtime?.generation;
  return {
    schemaVersion: 1,
    ...(generation ? { id: `joeness-ticket-m1c-${mode}-${generation}` } : {}),
    status: "blocked",
    mode,
    ...(manifestRequest ? { manifestRequest } : {}),
    error: serializeTicketError(error),
    promotionPass: false,
  };
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseTicketEvaluatorCli(argv);
  let reservation;
  try {
    reservation = await reserveTicketOutputPaths(
      options.mode === "batch"
        ? [path.resolve(options.output), path.resolve(options.rawOutput)]
        : [path.resolve(options.output)],
    );
  } catch (error) {
    process.stderr.write(`${error?.message ?? String(error)}\n`);
    return 1;
  }
  let exitCode = 1;
  options.manifestRequest = await snapshotTicketManifestRequest(options.manifest);
  try {
    const raw = await runTicketEvaluationBatch({
      repositoryRoot: process.cwd(),
      manifestPath: path.resolve(options.manifest),
      mode: options.mode,
      candidateId: options.candidate,
    });
    if (options.mode === "smoke") {
      const artifact = await writeJsonExclusive(path.resolve(options.output), raw);
      process.stdout.write(
        `${JSON.stringify({ status: raw.m1cPass ? "pass" : "fail", artifact })}\n`,
      );
      exitCode = raw.m1cPass ? 0 : 1;
    } else {
      const rawArtifact = await writeJsonExclusive(
        path.resolve(options.rawOutput),
        raw,
      );
      const summary = {
        schemaVersion: 1,
        id: `joeness-ticket-m1c-e2e-${resolveTicketRuntimeContract(raw.plan.value).generation}`,
        result: raw.m1cPass
          ? "m1c-strict-ticket-provenance-pass"
          : "m1c-strict-ticket-provenance-fail",
        classification: "m1c-strict-e2e",
        m1cPass: raw.m1cPass,
        promotionPass: false,
        candidateCount: raw.cases.length,
        states: Object.fromEntries(
          raw.cases.map(({ candidate, policy }) => [candidate.id, policy.state]),
        ),
        raw: rawArtifact,
        limitations: raw.limitations,
      };
      const summaryArtifact = await writeJsonExclusive(
        path.resolve(options.output),
        summary,
      );
      process.stdout.write(
        `${JSON.stringify({
          status: raw.m1cPass ? "pass" : "fail",
          summary: summaryArtifact,
          raw: rawArtifact,
        })}\n`,
      );
      exitCode = raw.m1cPass ? 0 : 1;
    }
  } catch (error) {
    await writeFailure(options, error);
    process.stderr.write(`${error?.message ?? String(error)}\n`);
    exitCode = 1;
  }
  try {
    await reservation.release();
  } catch (error) {
    process.stderr.write(`${error?.message ?? String(error)}\n`);
    exitCode = 1;
  }
  return exitCode;
}

if (
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
) {
  process.exitCode = await main();
}
