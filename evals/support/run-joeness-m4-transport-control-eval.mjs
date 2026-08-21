import { execFile as execFileCallback } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import {
  link as linkFileDefault,
  lstat,
  open,
  readFile,
  realpath,
  unlink as unlinkFileDefault,
} from "node:fs/promises";
import path from "node:path";
import { promisify, types as utilTypes } from "node:util";
import { runFreshEvaluatorTurn } from "./run-fresh-evaluator-turn.mjs";

const execFile = promisify(execFileCallback);

export const JOENESS_M4_TRANSPORT_CONTROL_ID = "joeness-m4-transport-control-v1";
export const JOENESS_M4_TRANSPORT_CONTROL_INPUT_TEXT =
  'Return exactly this JSON object: {"schemaVersion":1,"transport":"ok"}.';

const EVENT_METHODS = Object.freeze([
  "account/rateLimits/updated",
  "item/agentMessage/delta",
  "item/commandExecution/outputDelta",
  "item/completed",
  "item/plan/delta",
  "item/reasoning/summaryPartAdded",
  "item/reasoning/summaryTextDelta",
  "item/reasoning/textDelta",
  "item/started",
  "remoteControl/status/changed",
  "serverRequest/resolved",
  "thread/started",
  "thread/status/changed",
  "thread/tokenUsage/updated",
  "turn/completed",
  "turn/plan/updated",
  "turn/started",
  "windowsSandbox/setupCompleted",
  "configWarning",
  "error",
  "guardianWarning",
  "hook/completed",
  "hook/started",
  "item/autoApprovalReview/completed",
  "item/autoApprovalReview/started",
  "item/fileChange/outputDelta",
  "item/fileChange/patchUpdated",
  "item/mcpToolCall/progress",
  "mcpServer/oauthLogin/completed",
  "mcpServer/startupStatus/updated",
  "model/rerouted",
  "thread/settings/updated",
  "turn/diff/updated",
  "warning",
  "windows/worldWritableWarning",
  "collector/serverRequest",
  "other",
]);

const BLOCKER_CODES = Object.freeze([
  "app-server-close-failed",
  "app-server-exit-unverified",
  "app-server-nonzero-exit",
  "app-server-stderr",
  "app-server-stderr-truncated",
  "cleanup-dynamic-tool-release-failed",
  "cleanup-image-diagnostics-snapshot-failed",
  "cleanup-process-exit-snapshot-failed",
  "cleanup-remote-control-snapshot-failed",
  "cleanup-stderr-snapshot-failed",
  "cleanup-successful-image-views-snapshot-failed",
  "cleanup-turn-interrupt-failed",
  "cleanup-unsubscribe-failed",
  "duplicate-terminal-event",
  "dynamic-tool-lifecycle-mismatch",
  "event-compaction-unverified",
  "foreign-event",
  "image-diagnostics-unverified",
  "inherited-context",
  "input-post-turn-readback-failed",
  "input-provenance-changed",
  "input-provenance-changed-after-turn",
  "input-provenance-readback-failed",
  "local-image-diagnostics-bind-failed",
  "local-image-diagnostics-unavailable",
  "message-delta-lifecycle-mismatch",
  "message-delta-limit-exceeded",
  "missing-terminal-event",
  "post-terminal-event",
  "required-status-missing",
  "runtime-control-blocker",
  "runtime-drift",
  "secret-shaped-output",
  "successful-image-view-unverified",
  "turn-not-completed",
  "uncontrolled-tool-surface",
  "unresolved-notification",
  "unsafe-remote-control",
]);

const NORMALIZER_CLASSIFICATIONS = Object.freeze([
  "approval-requested",
  "hook-executed",
  "image-view-target-mismatch",
  "image-view-target-unverified",
  "message-delta-limit-exceeded",
  "required-command-missing",
  "required-cwd-missing",
  "required-exit-code-missing",
  "required-output-missing",
  "required-output-truncated",
  "required-status-missing",
  "runtime-drift",
  "runtime-error",
  "runtime-warning",
  "sandbox-setup-failed",
  "secret-shaped-output",
  "uncontrolled-control-plane",
  "uncontrolled-tool-surface",
  "unknown-item-type",
  "unknown-notification",
  "user-input-requested",
  "none",
  "multiple",
  "unmapped",
]);

const ORIGIN_PROVENANCE = "runner-projected-default-adapter-retained-events-fixed-enum";
const RUNNER_SOURCE_PATH = "evals/support/run-joeness-m4-transport-control-eval.mjs";
const MAX_RETAINED_SCAN = 512;
const MAX_PROJECTED_FAILURE_BYTES = 1792;
const MAX_RETAINED_FAILURE_BYTES = 2048;
const MAX_BLOCKED_RECEIPT_BYTES = 4096;
const MAX_RAW_OUTPUT_BYTES = 2048;
const MAX_EVIDENCE_BYTES = 8192;
const MAX_RELATIVE_PATH_CHARACTERS = 180;

function fail(message) {
  throw new TypeError(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function assertSafeData(value, label, depth = 0) {
  if (depth > 20) fail(`${label} exceeds safe nesting`);
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) return;
  if (typeof value !== "object" || utilTypes.isProxy(value)) fail(`${label} is unsafe`);
  let keys;
  let prototype;
  try {
    keys = Reflect.ownKeys(value);
    prototype = Object.getPrototypeOf(value);
  } catch {
    fail(`${label} is unsafe`);
  }
  if (keys.some((key) => typeof key === "symbol")) fail(`${label} contains symbol keys`);
  if (Array.isArray(value)) {
    const expected = Array.from({ length: value.length }, (_, index) => String(index));
    const actual = keys.filter((key) => key !== "length");
    if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
      fail(`${label} array is sparse or has extra keys`);
    }
  } else if (prototype !== Object.prototype && prototype !== null) {
    fail(`${label} must be a plain object`);
  }
  for (const key of keys) {
    if (key === "length" && Array.isArray(value)) continue;
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(value, key); } catch { fail(`${label} is unsafe`); }
    if (!descriptor || !("value" in descriptor) || descriptor.get || descriptor.set) {
      fail(`${label}.${key} contains an accessor`);
    }
    assertSafeData(descriptor.value, `${label}.${key}`, depth + 1);
  }
}

function exactKeys(value, keys, label) {
  assertSafeData(value, label);
  if (value === null || Array.isArray(value) || typeof value !== "object") fail(`${label} must be an object`);
  const actual = Object.getOwnPropertyNames(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    fail(`${label} must have exact keys`);
  }
}

function diagnosticOwnData(value, key) {
  if (
    value === null ||
    (typeof value !== "object" && typeof value !== "function") ||
    utilTypes.isProxy(value)
  ) return { state: "unsafe" };
  let descriptor;
  try { descriptor = Object.getOwnPropertyDescriptor(value, key); } catch { return { state: "unsafe" }; }
  if (descriptor === undefined) return { state: "missing" };
  if (!("value" in descriptor) || descriptor.get || descriptor.set) return { state: "unsafe" };
  return { state: "data", value: descriptor.value };
}

function diagnosticObject(value, keys) {
  if (value === null || typeof value !== "object" || utilTypes.isProxy(value)) return null;
  let prototype;
  try {
    if (Array.isArray(value)) return null;
    prototype = Object.getPrototypeOf(value);
  } catch {
    return null;
  }
  if (prototype !== Object.prototype && prototype !== null) return null;
  const result = Object.create(null);
  for (const key of keys) {
    const property = diagnosticOwnData(value, key);
    if (property.state !== "data") return null;
    result[key] = property.value;
  }
  return result;
}

function diagnosticExactObject(value, keys) {
  const result = diagnosticObject(value, keys);
  if (result === null) return null;
  let actual;
  try { actual = Reflect.ownKeys(value); } catch { return null; }
  if (actual.length !== keys.length || actual.some((key) => typeof key !== "string" || !keys.includes(key))) {
    return null;
  }
  return result;
}

function diagnosticArray(value, maximumLength) {
  if (value === null || typeof value !== "object" || utilTypes.isProxy(value)) return null;
  let keys;
  let lengthDescriptor;
  try {
    if (!Array.isArray(value)) return null;
    keys = Reflect.ownKeys(value);
    lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length");
  } catch {
    return null;
  }
  if (
    !lengthDescriptor ||
    !("value" in lengthDescriptor) ||
    !Number.isSafeInteger(lengthDescriptor.value) ||
    lengthDescriptor.value < 0 ||
    lengthDescriptor.value > maximumLength
  ) return null;
  const length = lengthDescriptor.value;
  if (
    keys.length !== length + 1 ||
    keys[length] !== "length" ||
    keys.slice(0, length).some((key, index) => key !== String(index))
  ) return null;
  const result = [];
  for (let index = 0; index < length; index += 1) {
    const property = diagnosticOwnData(value, String(index));
    if (property.state !== "data") return null;
    result.push(property.value);
  }
  return result;
}

function diagnosticRetainedEvents(value, expectedLength) {
  if (value === null || typeof value !== "object" || utilTypes.isProxy(value)) return null;
  let lengthDescriptor;
  try {
    if (!Array.isArray(value)) return null;
    lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length");
  } catch {
    return null;
  }
  if (
    !lengthDescriptor ||
    !("value" in lengthDescriptor) ||
    !Number.isSafeInteger(lengthDescriptor.value) ||
    lengthDescriptor.value < 0 ||
    lengthDescriptor.value !== expectedLength
  ) return null;
  const length = lengthDescriptor.value;
  if (length > MAX_RETAINED_SCAN) return { length, values: null };
  let keys;
  try { keys = Reflect.ownKeys(value); } catch { return null; }
  if (
    keys.length !== length + 1 ||
    keys[length] !== "length" ||
    keys.slice(0, length).some((key, index) => key !== String(index))
  ) return null;
  const values = [];
  for (let index = 0; index < length; index += 1) {
    const property = diagnosticOwnData(value, String(index));
    if (property.state !== "data") return null;
    values.push(property.value);
  }
  return { length, values };
}

function hasNoSymbolKeys(value) {
  if (value === null || typeof value !== "object" || utilTypes.isProxy(value)) return false;
  try { return !Reflect.ownKeys(value).some((key) => typeof key === "symbol"); } catch { return false; }
}

function fixedPrimaryCauseKind(error) {
  const property = diagnosticOwnData(error, "cause");
  if (property.state !== "data") return "unverified";
  const cause = property.value;
  if (cause === null || typeof cause !== "object" || utilTypes.isProxy(cause)) return "unverified";
  let prototype;
  try { prototype = Object.getPrototypeOf(cause); } catch { return "unverified"; }
  if (prototype === SyntaxError.prototype) return "syntax-error";
  if (prototype === TypeError.prototype) return "type-error";
  if (prototype === AggregateError.prototype) return "aggregate-error";
  if (prototype === Error.prototype) return "error";
  return "unverified";
}

function isExactTypeError(value) {
  if (value === null || typeof value !== "object" || utilTypes.isProxy(value)) return false;
  try { return Object.getPrototypeOf(value) === TypeError.prototype; } catch { return false; }
}

function validateDigest(value, label) {
  if (typeof value !== "string" || !/^[0-9a-f]{64}$/u.test(value)) fail(`${label} must be a lowercase SHA-256 digest`);
}

function validatePortableRelativePath(value, label) {
  if (
    typeof value !== "string" ||
    value.length < 1 ||
    value.length > MAX_RELATIVE_PATH_CHARACTERS ||
    value.includes("\\") ||
    path.posix.isAbsolute(value) ||
    value.split("/").some((part) => part === "" || part === "." || part === "..")
  ) fail(`${label} must be a portable relative path`);
}

function validateExecutionPlan(value) {
  exactKeys(value, ["schemaVersion", "id", "outputs"], "transport control execution plan");
  if (value.schemaVersion !== 1 || value.id !== JOENESS_M4_TRANSPORT_CONTROL_ID) {
    fail("transport control execution plan identity is invalid");
  }
  exactKeys(value.outputs, ["raw", "evidence", "blocked"], "transport control execution outputs");
  validatePortableRelativePath(value.outputs.raw, "transport control raw output");
  validatePortableRelativePath(value.outputs.evidence, "transport control evidence output");
  if (value.outputs.blocked !== null) validatePortableRelativePath(value.outputs.blocked, "transport control blocked output");
  const targets = [value.outputs.raw, value.outputs.evidence, value.outputs.blocked].filter(Boolean).map((item) => item.toLowerCase());
  if (new Set(targets).size !== targets.length) fail("transport control output paths collide");
}

function validateSourcePin(value) {
  exactKeys(value, ["repositoryCommit", "runner"], "transport control source pin");
  if (typeof value.repositoryCommit !== "string" || !/^[0-9a-f]{40}$/u.test(value.repositoryCommit)) {
    fail("transport control source commit is invalid");
  }
  exactKeys(value.runner, ["path", "bytes", "sha256"], "transport control runner source pin");
  validatePortableRelativePath(value.runner.path, "transport control runner source path");
  if (value.runner.path !== RUNNER_SOURCE_PATH) fail("transport control runner source path is invalid");
  if (!Number.isSafeInteger(value.runner.bytes) || value.runner.bytes < 1) fail("transport control runner bytes are invalid");
  validateDigest(value.runner.sha256, "transport control runner digest");
}

function snapshotExecutionPlan(value) {
  return Object.freeze({
    schemaVersion: value.schemaVersion,
    id: value.id,
    outputs: Object.freeze({
      raw: value.outputs.raw,
      evidence: value.outputs.evidence,
      blocked: value.outputs.blocked,
    }),
  });
}

function snapshotSourcePin(value) {
  return Object.freeze({
    repositoryCommit: value.repositoryCommit,
    runner: Object.freeze({
      path: value.runner.path,
      bytes: value.runner.bytes,
      sha256: value.runner.sha256,
    }),
  });
}

function runtimeExecutionPlan(value) {
  return {
    schemaVersion: value.schemaVersion,
    id: value.id,
    outputs: { ...value.outputs },
  };
}

function runtimeSourcePin(value) {
  return {
    repositoryCommit: value.repositoryCommit,
    runner: { ...value.runner },
  };
}

function safeConfigTuple(value, label) {
  exactKeys(value, ["bytes", "sha256"], label);
  if (!Number.isSafeInteger(value.bytes) || value.bytes < 0) fail(`${label}.bytes is invalid`);
  validateDigest(value.sha256, `${label}.sha256`);
  return value;
}

export function joenessM4TransportControlOutputSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["schemaVersion", "transport"],
    properties: {
      schemaVersion: { type: "integer", enum: [1] },
      transport: { type: "string", enum: ["ok"] },
    },
  };
}

export function validateJoenessM4TransportControlOutput(value) {
  exactKeys(value, ["schemaVersion", "transport"], "transport control output");
  if (value.schemaVersion !== 1 || value.transport !== "ok") fail("transport control output contract is invalid");
  return value;
}

function projectRuntimeErrorOrigin({ events, observed, retained, retainedOverLimit, globalRuntimeError }) {
  if (observed !== retained || retainedOverLimit || retained > MAX_RETAINED_SCAN) {
    return "unmapped";
  }
  let errorNotification = false;
  let threadStatusSystemError = false;
  let unmapped = false;
  let retainedRuntimeError = false;
  for (const event of events) {
    if (!hasNoSymbolKeys(event)) return null;
    const selected = diagnosticObject(event, ["method", "blockers"]);
    if (
      selected === null ||
      typeof selected.method !== "string" ||
      selected.method.length < 1 ||
      Buffer.byteLength(selected.method, "utf8") > 128
    ) return null;
    const eventBlockers = diagnosticArray(selected.blockers, 64);
    if (
      eventBlockers === null ||
      eventBlockers.some((blocker) => (
        typeof blocker !== "string" ||
        blocker.length < 1 ||
        Buffer.byteLength(blocker, "utf8") > 128
      ))
    ) return null;
    if (!eventBlockers.includes("runtime-error")) continue;
    retainedRuntimeError = true;
    if (selected.method === "error") {
      errorNotification = true;
      continue;
    }
    if (selected.method === "thread/status/changed") {
      const statusProperty = diagnosticOwnData(event, "threadStatus");
      if (statusProperty.state === "unsafe") return null;
      if (statusProperty.state === "missing") {
        unmapped = true;
        continue;
      }
      if (!hasNoSymbolKeys(statusProperty.value)) return null;
      const status = diagnosticObject(statusProperty.value, ["type"]);
      if (status === null) return null;
      if (status.type === "systemError") threadStatusSystemError = true;
      else unmapped = true;
      continue;
    }
    unmapped = true;
  }
  if (retainedRuntimeError !== globalRuntimeError) unmapped = true;
  if (unmapped) return "unmapped";
  if (errorNotification && threadStatusSystemError) return "multiple";
  if (errorNotification) return "error-notification";
  if (threadStatusSystemError) return "thread-status-system-error";
  return "none";
}

export function projectJoenessM4TransportControlFreshFailure(error) {
  const evidenceProperty = diagnosticOwnData(error, "freshEvaluatorEvidence");
  if (evidenceProperty.state !== "data") return null;
  const evidence = evidenceProperty.value;
  const evidenceData = diagnosticObject(evidence, [
    "threadStart",
    "thread",
    "turn",
    "input",
    "outputSchema",
    "events",
    "eventCompaction",
    "toolEvidence",
    "mcpAfter",
    "blockers",
    "appServer",
  ]);
  if (evidenceData === null) return null;
  const threadStart = diagnosticObject(evidenceData.threadStart, ["request", "response"]);
  const turn = diagnosticObject(evidenceData.turn, ["id", "request"]);
  const appServer = diagnosticObject(evidenceData.appServer, [
    "processExitCode",
    "stderr",
    "remoteControl",
    "imageDiagnostics",
    "successfulImageViews",
  ]);
  const compaction = diagnosticObject(evidenceData.eventCompaction, [
    "observedEventCount",
    "retainedEventCount",
    "retainedEventLimit",
    "retainedEventsOverLimit",
    "methodHistogram",
    "itemTypeHistogram",
    "agentMessageDelta",
    "normalizerBlocker",
    "rawPayloadRetained",
  ]);
  if (threadStart === null || turn === null || appServer === null || compaction === null) return null;

  const normalizer = diagnosticExactObject(compaction.normalizerBlocker, ["provenance", "classification"]);
  if (
    normalizer === null ||
    normalizer.provenance !== "adapter-normalization-fixed-enum" ||
    !NORMALIZER_CLASSIFICATIONS.includes(normalizer.classification)
  ) return null;

  let threadStartState;
  if (threadStart.response === null) {
    threadStartState = "not-observed";
  } else {
    const response = diagnosticObject(threadStart.response, [
      "threadId",
      "ephemeral",
      "priorTurnCount",
      "instructionSourceCount",
    ]);
    if (
      response === null ||
      typeof response.threadId !== "string" ||
      response.threadId.length < 1 ||
      Buffer.byteLength(response.threadId, "utf8") > 256 ||
      typeof response.ephemeral !== "boolean" ||
      !Number.isSafeInteger(response.priorTurnCount) ||
      response.priorTurnCount < 0 ||
      !Number.isSafeInteger(response.instructionSourceCount) ||
      response.instructionSourceCount < 0
    ) return null;
    threadStartState = "observed";
  }
  const turnStartState = turn.id === null
    ? "not-observed"
    : typeof turn.id === "string" && turn.id.length > 0 && Buffer.byteLength(turn.id, "utf8") <= 256
      ? "observed"
      : null;
  if (turnStartState === null || (threadStartState === "not-observed" && turnStartState === "observed")) return null;

  if (
    !Number.isSafeInteger(compaction.observedEventCount) ||
    compaction.observedEventCount < 0 ||
    !Number.isSafeInteger(compaction.retainedEventCount) ||
    compaction.retainedEventCount < 0 ||
    compaction.retainedEventCount > compaction.observedEventCount ||
    compaction.retainedEventLimit !== MAX_RETAINED_SCAN ||
    typeof compaction.retainedEventsOverLimit !== "boolean" ||
    compaction.retainedEventsOverLimit !== (compaction.retainedEventCount > MAX_RETAINED_SCAN) ||
    compaction.rawPayloadRetained !== false
  ) return null;
  const retainedEvents = diagnosticRetainedEvents(evidenceData.events, compaction.retainedEventCount);
  if (retainedEvents === null) return null;

  const histogram = diagnosticObject(compaction.methodHistogram, ["eventCount", "entries"]);
  const entries = histogram === null ? null : diagnosticArray(histogram.entries, EVENT_METHODS.length);
  if (entries === null || histogram.eventCount !== compaction.observedEventCount) return null;
  let histogramTotal = 0;
  let previousMethodIndex = -1;
  let terminalCount = 0;
  for (const entryValue of entries) {
    const entry = diagnosticObject(entryValue, ["method", "count"]);
    const methodIndex = entry === null || typeof entry.method !== "string" ? -1 : EVENT_METHODS.indexOf(entry.method);
    if (entry === null || methodIndex <= previousMethodIndex || !Number.isSafeInteger(entry.count) || entry.count < 1) return null;
    previousMethodIndex = methodIndex;
    histogramTotal += entry.count;
    if (!Number.isSafeInteger(histogramTotal)) return null;
    if (entry.method === "turn/completed") terminalCount = entry.count;
  }
  if (histogramTotal !== histogram.eventCount) return null;

  const blockerValues = diagnosticArray(evidenceData.blockers, 64);
  if (
    blockerValues === null ||
    blockerValues.some((value) => (
      typeof value !== "string" ||
      value.length < 1 ||
      Buffer.byteLength(value, "utf8") > 128
    )) ||
    new Set(blockerValues).size !== blockerValues.length
  ) return null;
  const blockerCodes = BLOCKER_CODES.filter((code) => blockerValues.includes(code));
  const unclassifiedCount = blockerValues.length - blockerCodes.length;
  const missingTerminal = blockerValues.includes("missing-terminal-event");
  const duplicateTerminal = blockerValues.includes("duplicate-terminal-event");
  const nonCompletedTerminal = blockerValues.includes("turn-not-completed");
  if (missingTerminal && (duplicateTerminal || nonCompletedTerminal)) return null;
  let terminal;
  let terminalCountState;
  if (duplicateTerminal) {
    if (terminalCount < 2) return null;
    terminal = "ambiguous";
    terminalCountState = "multiple";
  } else if (missingTerminal) {
    if (terminalCount !== 0) return null;
    terminal = "missing";
    terminalCountState = "zero";
  } else if (nonCompletedTerminal) {
    if (terminalCount !== 1) return null;
    terminal = "non-completed";
    terminalCountState = "one";
  } else {
    if (terminalCount !== 1) return null;
    terminal = "completed";
    terminalCountState = "one";
  }
  if (terminal !== "missing" && turnStartState !== "observed") return null;

  const appServerExit = appServer.processExitCode === null
    ? "unverified"
    : Number.isSafeInteger(appServer.processExitCode)
      ? appServer.processExitCode === 0 ? "zero" : "nonzero"
      : null;
  if (appServerExit === null) return null;
  const exitUnverified = blockerValues.includes("app-server-exit-unverified");
  const exitNonzero = blockerValues.includes("app-server-nonzero-exit");
  if (
    (appServerExit === "unverified") !== exitUnverified ||
    (appServerExit === "nonzero") !== exitNonzero ||
    (appServerExit === "zero") !== (!exitUnverified && !exitNonzero)
  ) return null;

  const globalRuntimeError = blockerValues.includes("runtime-error");
  if (
    (normalizer.classification === "runtime-error" && !globalRuntimeError) ||
    (normalizer.classification === "none" && globalRuntimeError)
  ) return null;
  const originClassification = projectRuntimeErrorOrigin({
    events: retainedEvents.values,
    observed: compaction.observedEventCount,
    retained: compaction.retainedEventCount,
    retainedOverLimit: compaction.retainedEventsOverLimit,
    globalRuntimeError,
  });
  if (originClassification === null) return null;

  const projected = {
    evidenceState: "retained",
    lifecycle: {
      threadStart: threadStartState,
      turnStart: turnStartState,
      terminal,
      terminalCountState,
    },
    eventCounts: {
      observed: compaction.observedEventCount,
      retained: compaction.retainedEventCount,
      retainedOverLimit: compaction.retainedEventsOverLimit,
    },
    normalizerBlocker: {
      provenance: normalizer.provenance,
      classification: normalizer.classification,
    },
    runtimeErrorOrigin: {
      provenance: ORIGIN_PROVENANCE,
      classification: originClassification,
    },
    blockers: {
      count: blockerValues.length,
      codes: blockerCodes,
      unclassifiedCount,
    },
    appServerExit,
    primaryCauseKind: fixedPrimaryCauseKind(error),
    retention: {
      rawOutputPersisted: false,
      rawEventsPersisted: false,
      threadTurnProcessIdentifiersPersisted: false,
      absolutePathsPersisted: false,
      rawEventOrOutputDigestsPersisted: false,
      rawStderrPersisted: false,
      configContentsPersisted: false,
    },
  };
  return Buffer.byteLength(stableStringify(projected)) <= MAX_PROJECTED_FAILURE_BYTES ? projected : null;
}

async function defaultGitStatus(repositoryRoot) {
  const result = await execFile("git", ["status", "--porcelain=v1", "--untracked-files=all"], {
    cwd: repositoryRoot,
    windowsHide: true,
    encoding: "utf8",
  });
  return result.stdout;
}

async function defaultGitIdentity(repositoryRoot) {
  const result = await execFile("git", ["rev-parse", "HEAD"], {
    cwd: repositoryRoot,
    windowsHide: true,
    encoding: "utf8",
  });
  return result.stdout.trim();
}

async function defaultGitReadBlob(repositoryRoot, commit, relativePath) {
  const result = await execFile("git", ["show", `${commit}:${relativePath}`], {
    cwd: repositoryRoot,
    windowsHide: true,
    encoding: "buffer",
    maxBuffer: 1024 * 1024,
  });
  return result.stdout;
}

async function defaultArtifactExists(repositoryRoot, relativePath) {
  try { await lstat(path.join(repositoryRoot, ...relativePath.split("/"))); return true; }
  catch (error) { if (error?.code === "ENOENT") return false; throw error; }
}

async function assertNoSymlinkSegments(repositoryRoot, relativePath, label) {
  let current = repositoryRoot;
  for (const segment of relativePath.split("/").filter(Boolean)) {
    current = path.join(current, segment);
    const state = await lstat(current);
    if (state.isSymbolicLink()) throw new Error(`${label} contains a symlink or reparse traversal`);
  }
  return current;
}

async function verifyOutputTarget(repositoryRoot, relativePath, { absent = true } = {}) {
  validatePortableRelativePath(relativePath, "transport control output target");
  const parts = relativePath.split("/");
  const leaf = parts.pop();
  const parentRelative = parts.join("/");
  const parent = parentRelative === ""
    ? repositoryRoot
    : await assertNoSymlinkSegments(repositoryRoot, parentRelative, "transport control output parent");
  const parentStat = await lstat(parent);
  if (!parentStat.isDirectory() || parentStat.isSymbolicLink()) {
    throw new Error("transport control output parent is not a confined regular directory");
  }
  const resolvedRoot = await realpath(repositoryRoot);
  const resolvedParent = await realpath(parent);
  const relative = path.relative(resolvedRoot, resolvedParent);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error("transport control output parent escapes repository confinement");
  }
  const target = path.join(parent, leaf);
  try {
    const targetStat = await lstat(target);
    if (targetStat.isSymbolicLink()) throw new Error("transport control output target is a symlink or reparse traversal");
    if (absent) throw new Error(`transport control artifact collision: ${relativePath}`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  return { parent, target };
}

async function assertAbsent(target, label) {
  try { await lstat(target); }
  catch (error) { if (error?.code === "ENOENT") return; throw error; }
  throw new Error(`${label} cleanup readback is not absent`);
}

function identityFromStat(state) {
  return {
    dev: state.dev,
    ino: state.ino,
    birthtimeNs: state.birthtimeNs,
  };
}

function sameIdentity(left, right) {
  return left !== null && right !== null &&
    left.dev === right.dev &&
    left.ino === right.ino &&
    left.birthtimeNs === right.birthtimeNs;
}

async function readIdentity(target) {
  const state = await lstat(target, { bigint: true });
  if (!state.isFile() || state.isSymbolicLink()) throw new Error("transport control artifact identity is not a regular file");
  return identityFromStat(state);
}

async function requireOwnedIdentity(target, expected, label) {
  let current;
  try { current = await readIdentity(target); }
  catch (error) {
    if (error?.code === "ENOENT") throw new Error(`${label} identity is missing; cleanup is unresolved`, { cause: error });
    throw error;
  }
  if (!sameIdentity(current, expected)) throw new Error(`${label} identity changed; cleanup is unresolved`);
  return current;
}

async function unlinkOwned(target, expected, label, unlinkFile) {
  try { await requireOwnedIdentity(target, expected, label); }
  catch (error) {
    if (error?.cause?.code === "ENOENT") return;
    throw error;
  }
  await unlinkFile(target);
  await assertAbsent(target, label);
}

async function writeStagedExclusive(target, text, unlinkFile) {
  let handle;
  let owned = false;
  let ownedIdentity = null;
  let primaryError = null;
  try {
    handle = await open(target, "wx", 0o600);
    owned = true;
    ownedIdentity = identityFromStat(await handle.stat({ bigint: true }));
    await handle.writeFile(text, "utf8");
    await handle.sync();
  } catch (error) {
    primaryError = error;
  } finally {
    if (handle) {
      try { await handle.close(); } catch (error) { primaryError ??= error; }
    }
  }
  if (primaryError === null) {
    await requireOwnedIdentity(target, ownedIdentity, "transport control staged temp");
    return ownedIdentity;
  }
  const cleanupErrors = [];
  if (owned) {
    if (ownedIdentity !== null) {
      try { await unlinkOwned(target, ownedIdentity, "transport control staged temp", unlinkFile); }
      catch (error) { cleanupErrors.push(error); }
    } else {
      try { await assertAbsent(target, "transport control unverified staged temp"); }
      catch (error) { cleanupErrors.push(error); }
    }
    try { await assertAbsent(target, "transport control staged temp"); } catch (error) { cleanupErrors.push(error); }
  }
  if (cleanupErrors.length === 0) throw primaryError;
  throw new AggregateError(
    [primaryError, ...cleanupErrors],
    "transport control staged write cleanup failed",
    { cause: primaryError },
  );
}

export async function publishJoenessM4TransportControlSuccessArtifacts({
  repositoryRoot,
  rawPath,
  evidencePath,
  rawText,
  evidence,
  linkFile = linkFileDefault,
  unlinkFile = unlinkFileDefault,
} = {}) {
  if (typeof repositoryRoot !== "string" || !path.isAbsolute(repositoryRoot)) fail("transport control publication root is invalid");
  validatePortableRelativePath(rawPath, "transport control publication raw path");
  validatePortableRelativePath(evidencePath, "transport control publication evidence path");
  if (rawPath.toLowerCase() === evidencePath.toLowerCase()) fail("transport control publication paths collide");
  if (
    typeof rawText !== "string" ||
    Buffer.byteLength(rawText) < 1 ||
    Buffer.byteLength(rawText) > MAX_RAW_OUTPUT_BYTES
  ) fail("transport control raw output size is invalid");
  assertSafeData(evidence, "transport control publication evidence");
  const evidenceText = `${JSON.stringify(evidence, null, 2)}\n`;
  if (Buffer.byteLength(evidenceText) > MAX_EVIDENCE_BYTES) fail("transport control publication evidence exceeds size limit");
  if (typeof linkFile !== "function" || typeof unlinkFile !== "function") fail("transport control publication dependencies are invalid");

  const raw = await verifyOutputTarget(repositoryRoot, rawPath);
  const retained = await verifyOutputTarget(repositoryRoot, evidencePath);
  const nonce = randomUUID().replaceAll("-", "").slice(0, 16);
  const rawTemp = path.join(raw.parent, `.m4-control-${nonce}-raw.tmp`);
  const evidenceTemp = path.join(retained.parent, `.m4-control-${nonce}-evidence.tmp`);
  const createdTemps = [];
  const ownedFinals = [];
  let primaryError = null;
  try {
    const rawTempIdentity = await writeStagedExclusive(rawTemp, rawText, unlinkFile);
    createdTemps.push({ target: rawTemp, identity: rawTempIdentity });
    const evidenceTempIdentity = await writeStagedExclusive(evidenceTemp, evidenceText, unlinkFile);
    createdTemps.push({ target: evidenceTemp, identity: evidenceTempIdentity });
    await verifyOutputTarget(repositoryRoot, evidencePath);
    await linkFile(evidenceTemp, retained.target);
    const evidenceFinalIdentity = await readIdentity(retained.target);
    await requireOwnedIdentity(evidenceTemp, evidenceTempIdentity, "transport control evidence temp");
    if (!sameIdentity(evidenceFinalIdentity, evidenceTempIdentity)) {
      throw new Error("transport control evidence final ownership identity is unverified");
    }
    ownedFinals.push({ target: retained.target, identity: evidenceFinalIdentity });
    await verifyOutputTarget(repositoryRoot, rawPath);
    await linkFile(rawTemp, raw.target);
    const rawFinalIdentity = await readIdentity(raw.target);
    await requireOwnedIdentity(rawTemp, rawTempIdentity, "transport control raw temp");
    if (!sameIdentity(rawFinalIdentity, rawTempIdentity)) {
      throw new Error("transport control raw final ownership identity is unverified");
    }
    ownedFinals.push({ target: raw.target, identity: rawFinalIdentity });
    for (const owned of [...createdTemps, ...ownedFinals]) {
      await requireOwnedIdentity(owned.target, owned.identity, "transport control publication artifact");
    }
    const rawReadback = await readFile(raw.target);
    const evidenceReadback = await readFile(retained.target);
    for (const owned of [...createdTemps, ...ownedFinals]) {
      await requireOwnedIdentity(owned.target, owned.identity, "transport control publication artifact readback");
    }
    if (sha256(rawReadback) !== sha256(rawText) || sha256(evidenceReadback) !== sha256(evidenceText)) {
      throw new Error("transport control publication final readback differs");
    }
    await unlinkOwned(rawTemp, rawTempIdentity, "transport control raw temp", unlinkFile);
    await unlinkOwned(evidenceTemp, evidenceTempIdentity, "transport control evidence temp", unlinkFile);
    return {
      raw: { byteLength: rawReadback.length, sha256: sha256(rawReadback) },
      evidence: { byteLength: evidenceReadback.length, sha256: sha256(evidenceReadback) },
      completePair: true,
    };
  } catch (error) {
    primaryError = error;
  }

  const cleanupErrors = [];
  for (const owned of [...ownedFinals].reverse()) {
    try { await unlinkOwned(owned.target, owned.identity, "transport control owned final", unlinkFile); }
    catch (error) { cleanupErrors.push(error); }
  }
  for (const owned of createdTemps) {
    try { await unlinkOwned(owned.target, owned.identity, "transport control owned temp", unlinkFile); }
    catch (error) { cleanupErrors.push(error); }
  }
  for (const [target, label] of [
    [raw.target, "transport control raw final"],
    [retained.target, "transport control evidence final"],
    [rawTemp, "transport control raw temp"],
    [evidenceTemp, "transport control evidence temp"],
  ]) {
    try { await assertAbsent(target, label); } catch (error) { cleanupErrors.push(error); }
  }
  throw new AggregateError(
    [primaryError, ...cleanupErrors],
    cleanupErrors.length === 0
      ? "transport control publication transaction failed and was rolled back"
      : "transport control publication transaction failed and cleanup is unresolved",
    { cause: primaryError },
  );
}

export async function publishJoenessM4TransportControlBlockedArtifact({
  repositoryRoot,
  relativePath,
  value,
  readArtifact = readFile,
  unlinkFile = unlinkFileDefault,
} = {}) {
  if (typeof repositoryRoot !== "string" || !path.isAbsolute(repositoryRoot)) fail("transport control blocked publication root is invalid");
  validatePortableRelativePath(relativePath, "transport control blocked publication path");
  assertSafeData(value, "transport control blocked publication value");
  if (typeof readArtifact !== "function" || typeof unlinkFile !== "function") fail("transport control blocked publication dependencies are invalid");
  const { target } = await verifyOutputTarget(repositoryRoot, relativePath);
  const text = `${JSON.stringify(value, null, 2)}\n`;
  let handle;
  let ownedIdentity = null;
  let primaryError = null;
  try {
    handle = await open(target, "wx", 0o600);
    ownedIdentity = identityFromStat(await handle.stat({ bigint: true }));
    await handle.writeFile(text, "utf8");
    await handle.sync();
    await handle.close();
    handle = null;
    const readback = await readArtifact(target);
    await requireOwnedIdentity(target, ownedIdentity, "transport control blocked artifact");
    if (readback.length !== Buffer.byteLength(text) || sha256(readback) !== sha256(text)) {
      throw new Error("transport control blocked artifact readback differs");
    }
    return { byteLength: readback.length, sha256: sha256(readback) };
  } catch (error) {
    primaryError = error;
  } finally {
    if (handle) {
      try { await handle.close(); } catch (error) { primaryError ??= error; }
    }
  }
  const cleanupErrors = [];
  if (ownedIdentity !== null) {
    try { await unlinkOwned(target, ownedIdentity, "transport control blocked artifact", unlinkFile); }
    catch (error) { cleanupErrors.push(error); }
  } else {
    try { await assertAbsent(target, "transport control unverified blocked artifact"); }
    catch (error) { cleanupErrors.push(error); }
  }
  if (cleanupErrors.length === 0) throw primaryError;
  throw new AggregateError(
    [primaryError, ...cleanupErrors],
    "transport control blocked artifact write failed and cleanup is unresolved",
    { cause: primaryError },
  );
}

async function verifyLiveBoundary({
  repositoryRoot,
  executionPlan,
  sourcePin,
  gitStatus,
  gitIdentity,
  gitReadBlob,
  artifactExists,
}) {
  if ((await gitStatus(repositoryRoot)) !== "") throw new Error("transport control live worktree is dirty");
  if ((await gitIdentity(repositoryRoot)) !== sourcePin.repositoryCommit) throw new Error("transport control live source commit differs from pin");
  const pinnedRunner = await gitReadBlob(repositoryRoot, sourcePin.repositoryCommit, sourcePin.runner.path);
  if (
    !Buffer.isBuffer(pinnedRunner) ||
    pinnedRunner.length !== sourcePin.runner.bytes ||
    sha256(pinnedRunner) !== sourcePin.runner.sha256
  ) throw new Error("transport control live runner source pin drift");
  for (const target of [executionPlan.outputs.raw, executionPlan.outputs.evidence, executionPlan.outputs.blocked].filter(Boolean)) {
    await verifyOutputTarget(repositoryRoot, target);
    if (await artifactExists(repositoryRoot, target)) throw new Error(`transport control artifact collision: ${target}`);
  }
}

function retainSuccessEvidence(result, { input, outputSchema }) {
  const outputTextData = diagnosticExactObject(result.outputText, ["text", "byteLength", "sha256"]);
  const blockers = diagnosticArray(result.blockers, 64);
  const tools = diagnosticArray(result.toolEvidence, 64);
  const threadStart = diagnosticObject(result.threadStart, ["request", "response"]);
  const turn = diagnosticObject(result.turn, ["id", "request"]);
  const appServer = diagnosticObject(result.appServer, ["processExitCode", "stderr"]);
  if (
    outputTextData === null ||
    blockers === null || blockers.length !== 0 ||
    tools === null || tools.length !== 0 ||
    threadStart === null || turn === null || appServer === null
  ) fail("transport control fresh result boundary is invalid");
  const request = diagnosticObject(threadStart.request, ["projectDocMaxBytes", "dynamicToolCount"]);
  const response = diagnosticObject(threadStart.response, ["ephemeral", "priorTurnCount", "instructionSourceCount"]);
  const turnRequest = diagnosticObject(turn.request, ["inputDescriptorCount"]);
  const stderr = diagnosticObject(appServer.stderr, ["byteLength", "truncated", "captureTruncated"]);
  if (
    request === null ||
    request.projectDocMaxBytes !== 0 ||
    request.dynamicToolCount !== 0 ||
    response === null ||
    response.ephemeral !== true ||
    response.priorTurnCount !== 0 ||
    response.instructionSourceCount !== 0 ||
    typeof turn.id !== "string" ||
    turn.id.length < 1 ||
    turnRequest === null ||
    turnRequest.inputDescriptorCount !== 1 ||
    appServer.processExitCode !== 0 ||
    stderr === null ||
    stderr.byteLength !== 0 ||
    stderr.truncated !== false ||
    stderr.captureTruncated !== false
  ) fail("transport control fresh lifecycle boundary is invalid");
  const text = outputTextData.text;
  if (
    typeof text !== "string" ||
    Buffer.byteLength(text) < 1 ||
    Buffer.byteLength(text) > MAX_RAW_OUTPUT_BYTES ||
    outputTextData.byteLength !== Buffer.byteLength(text) ||
    outputTextData.sha256 !== sha256(text)
  ) fail("transport control raw output tuple is invalid");
  let parsed;
  try { parsed = JSON.parse(text); } catch { fail("transport control raw output JSON is invalid"); }
  validateJoenessM4TransportControlOutput(parsed);
  if (stableStringify(parsed) !== stableStringify(result.output)) fail("transport control raw output differs from semantic output");
  const inputText = input[0].text;
  const schemaText = stableStringify(outputSchema);
  return {
    schemaVersion: 1,
    id: JOENESS_M4_TRANSPORT_CONTROL_ID,
    assessment: {
      status: "PASS",
      scope: "transport-only",
      m4Behavior: "NOT-ASSESSED",
      joenessPolicy: "UNVERIFIED",
      superpowersCompatibility: "UNVERIFIED",
      promotionPass: false,
    },
    input: {
      descriptorCount: 1,
      byteLength: Buffer.byteLength(inputText),
      sha256: sha256(inputText),
    },
    output: {
      schemaVersion: 1,
      transport: "ok",
      byteLength: outputTextData.byteLength,
      sha256: outputTextData.sha256,
      schemaSha256: sha256(schemaText),
    },
    runtime: {
      projectDocs: "DISABLED",
      dynamicToolCount: 0,
      turnCount: 1,
      retryCount: 0,
    },
  };
}

function blockedReceipt(error, freshFailure = null) {
  return {
    schemaVersion: 1,
    status: "blocked",
    phase: "post-runtime-validation",
    safeCleanup: true,
    cause: { category: isExactTypeError(error) ? "contract-validation" : "evaluation-failed" },
    ...(freshFailure === null ? {} : { freshFailure }),
  };
}

export async function runJoenessM4TransportControlEval({
  repositoryRoot,
  executionPlan,
  sourcePin,
  gitStatus = defaultGitStatus,
  gitIdentity = defaultGitIdentity,
  gitReadBlob = defaultGitReadBlob,
  artifactExists = defaultArtifactExists,
  runtimeFactory,
  runTurn = runFreshEvaluatorTurn,
  successPublisher = publishJoenessM4TransportControlSuccessArtifacts,
  writeArtifact,
} = {}) {
  if (executionPlan === undefined) fail("transport control execution plan is required");
  if (sourcePin === undefined) fail("transport control source pin is required");
  validateExecutionPlan(executionPlan);
  validateSourcePin(sourcePin);
  executionPlan = snapshotExecutionPlan(executionPlan);
  sourcePin = snapshotSourcePin(sourcePin);
  if (typeof repositoryRoot !== "string" || !path.isAbsolute(repositoryRoot)) fail("transport control repository root must be absolute");
  if (
    typeof gitStatus !== "function" ||
    typeof gitIdentity !== "function" ||
    typeof gitReadBlob !== "function" ||
    typeof artifactExists !== "function" ||
    typeof runtimeFactory !== "function" ||
    typeof runTurn !== "function" ||
    typeof successPublisher !== "function"
  ) fail("transport control execution dependency is invalid");
  writeArtifact ??= (relativePath, value) => publishJoenessM4TransportControlBlockedArtifact({
    repositoryRoot,
    relativePath,
    value,
  });
  if (typeof writeArtifact !== "function") fail("transport control artifact writer is invalid");
  await verifyLiveBoundary({
    repositoryRoot,
    executionPlan,
    sourcePin,
    gitStatus,
    gitIdentity,
    gitReadBlob,
    artifactExists,
  });

  const input = [{ type: "text", text: JOENESS_M4_TRANSPORT_CONTROL_INPUT_TEXT }];
  const outputSchema = joenessM4TransportControlOutputSchema();
  let runtime;
  let result;
  let evidence;
  let rawText;
  let sourceConfigBefore;
  let primaryError = null;
  let freshFailure = null;
  let cleanupSafe = false;
  try {
    runtime = await runtimeFactory({
      repositoryRoot,
      executionPlan: runtimeExecutionPlan(executionPlan),
      sourcePin: runtimeSourcePin(sourcePin),
    });
    if (
      runtime === null ||
      typeof runtime !== "object" ||
      typeof runtime.finish !== "function" ||
      typeof runtime.readSourceConfig !== "function"
    ) fail("transport control runtime factory result is invalid");
    const validatedConfigBefore = safeConfigTuple(
      runtime.sourceConfigBefore,
      "transport control source config before",
    );
    sourceConfigBefore = Object.freeze({
      bytes: validatedConfigBefore.bytes,
      sha256: validatedConfigBefore.sha256,
    });
    try {
      result = await runTurn({
        session: runtime.session,
        root: repositoryRoot,
        input,
        outputSchema,
        dynamicTools: [],
      });
    } catch (error) {
      if (runTurn === runFreshEvaluatorTurn) {
        const projected = projectJoenessM4TransportControlFreshFailure(error);
        if (projected !== null) {
          const retained = {
            schemaVersion: 3,
            provenance: "transport-control-runner-observed-default-fresh-adapter-rejection",
            runnerStage: "fresh-turn-rejected",
            ...projected,
          };
          if (Buffer.byteLength(stableStringify(retained)) <= MAX_RETAINED_FAILURE_BYTES) freshFailure = retained;
        }
      }
      throw error;
    }
    const resultData = diagnosticObject(result, [
      "output",
      "outputText",
      "blockers",
      "toolEvidence",
      "threadStart",
      "turn",
      "appServer",
    ]);
    if (resultData === null) fail("transport control fresh result is unsafe");
    validateJoenessM4TransportControlOutput(resultData.output);
    evidence = retainSuccessEvidence(resultData, { input, outputSchema });
    rawText = resultData.outputText.text;
  } catch (error) {
    primaryError = error;
  }

  if (runtime) {
    const cleanupErrors = [];
    try { await runtime.finish(true); } catch (error) { cleanupErrors.push(error); }
    try {
      const after = safeConfigTuple(await runtime.readSourceConfig(), "transport control source config readback");
      if (
        sourceConfigBefore === undefined ||
        after.bytes !== sourceConfigBefore.bytes ||
        after.sha256 !== sourceConfigBefore.sha256
      ) throw new Error("transport control source plugin config changed");
    } catch (error) {
      cleanupErrors.push(error);
    }
    cleanupSafe = cleanupErrors.length === 0;
    if (!cleanupSafe) {
      const causes = [primaryError, ...cleanupErrors].filter(Boolean);
      primaryError = causes.length === 1
        ? causes[0]
        : new AggregateError(causes, "transport control execution and cleanup failed", { cause: causes[0] });
    }
  }

  if (cleanupSafe) {
    try {
      await verifyLiveBoundary({
        repositoryRoot,
        executionPlan,
        sourcePin,
        gitStatus,
        gitIdentity,
        gitReadBlob,
        artifactExists,
      });
    } catch (error) {
      primaryError = primaryError === null
        ? error
        : new AggregateError(
            [primaryError, error],
            "transport control execution and final boundary validation failed",
            { cause: primaryError },
          );
      cleanupSafe = false;
    }
  }

  if (primaryError !== null) {
    if (cleanupSafe && executionPlan.outputs.blocked !== null) {
      const blocked = blockedReceipt(primaryError, freshFailure);
      if (Buffer.byteLength(stableStringify(blocked)) > MAX_BLOCKED_RECEIPT_BYTES) {
        throw new Error("transport control blocked receipt exceeds bound", { cause: primaryError });
      }
      await verifyOutputTarget(repositoryRoot, executionPlan.outputs.blocked);
      if (await artifactExists(repositoryRoot, executionPlan.outputs.blocked)) {
        throw new Error("transport control blocked artifact collision", { cause: primaryError });
      }
      await writeArtifact(executionPlan.outputs.blocked, blocked);
    }
    throw primaryError;
  }

  const assessment = evidence.assessment;
  const durableEvidence = {
    ...evidence,
    sourceConfigReadback: "UNCHANGED",
    runtimeCleanup: "SAFE",
  };
  await successPublisher({
    repositoryRoot,
    rawPath: executionPlan.outputs.raw,
    evidencePath: executionPlan.outputs.evidence,
    rawText,
    evidence: durableEvidence,
  });
  return assessment;
}
