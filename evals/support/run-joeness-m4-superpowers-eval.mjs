import { execFile as execFileCallback } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { link as linkFileDefault, open, lstat, readFile, realpath, unlink as unlinkFileDefault } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { promisify, types as utilTypes } from "node:util";
import { runFreshEvaluatorTurn } from "./run-fresh-evaluator-turn.mjs";

const execFile = promisify(execFileCallback);

export const JOENESS_M4_FIXTURE_RELATIVE_PATH =
  "evals/skill-contracts/fixtures/joeness-m4-superpowers-v1";
export const JOENESS_M4_FIXTURE_MANIFEST_FILENAME = "manifest-v2.json";
export const JOENESS_M4_FIXTURE_ID = "joeness-m4-superpowers-v2";

const SOURCE_IDS = Object.freeze([
  "evaluator-instruction",
  "project-task",
  "superpowers-using",
  "superpowers-brainstorming",
]);
const ACTION_KEYS = Object.freeze([
  "tool",
  "spec",
  "plan",
  "checklist",
  "gate",
  "commitCeremony",
  "companionOffer",
  "serverStart",
  "visualCheckBeforeArtifact",
  "rawTokenOrQuotaWarning",
  "skillAnnouncement",
  "pluginConfigWrite",
]);
const LIMITS = Object.freeze({
  manifestBytes: 8 * 1024,
  individualInputBytes: 16 * 1024,
  combinedInputBytes: 32 * 1024,
  rawResponseBytes: 16 * 1024,
  evidenceBytes: 64 * 1024,
  relativePathCharacters: 160,
  maxQuestions: 1,
  fixtureQuestions: 0,
});
const SOURCE_BLOB_BYTES = 512 * 1024;
const EXACT_RECOMMENDATION =
  "Keep the implicit Superpowers plugin disabled by default for this scoped task.";

const M4_FRESH_EVENT_METHODS = Object.freeze([
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
const M4_FRESH_BLOCKER_CODES = Object.freeze([
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
const M4_FRESH_NORMALIZER_BLOCKER_CLASSIFICATIONS = Object.freeze([
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

function fail(message) {
  throw new TypeError(message);
}

function assertSafeData(value, label = "value", depth = 0) {
  if (depth > 24) fail(`${label} is unsafe: nesting limit exceeded`);
  if (value === null || ["string", "boolean"].includes(typeof value)) return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail(`${label} is unsafe: non-finite number`);
    return;
  }
  if (typeof value !== "object" || utilTypes.isProxy(value)) fail(`${label} is unsafe`);
  let keys;
  try {
    keys = Reflect.ownKeys(value);
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
  } else if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) {
    fail(`${label} must be a plain object`);
  }
  for (const key of keys) {
    if (key === "length" && Array.isArray(value)) continue;
    let descriptor;
    try {
      descriptor = Object.getOwnPropertyDescriptor(value, key);
    } catch {
      fail(`${label} is unsafe`);
    }
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
    fail(`${label} has missing or extra keys`);
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
  try {
    actual = Reflect.ownKeys(value);
  } catch {
    return null;
  }
  if (
    actual.length !== keys.length ||
    actual.some((key) => typeof key !== "string" || !keys.includes(key))
  ) return null;
  return result;
}

function diagnosticArray(value, maximumLength) {
  if (value === null || typeof value !== "object" || utilTypes.isProxy(value)) return null;
  let isArray;
  let lengthDescriptor;
  try {
    isArray = Array.isArray(value);
    lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length");
  } catch {
    return null;
  }
  if (
    !isArray ||
    !lengthDescriptor ||
    !("value" in lengthDescriptor) ||
    !Number.isSafeInteger(lengthDescriptor.value) ||
    lengthDescriptor.value < 0 ||
    lengthDescriptor.value > maximumLength
  ) return null;
  const length = lengthDescriptor.value;
  const result = [];
  for (let index = 0; index < length; index += 1) {
    const property = diagnosticOwnData(value, String(index));
    if (property.state !== "data") return null;
    result.push(property.value);
  }
  return result;
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

export function projectJoenessM4FreshFailure(error) {
  const evidenceProperty = diagnosticOwnData(error, "freshEvaluatorEvidence");
  if (evidenceProperty.state !== "data") return null;
  const evidence = evidenceProperty.value;
  const baseKeys = [
    "threadStart", "thread", "turn", "input", "outputSchema", "events",
    "eventCompaction", "toolEvidence", "mcpAfter", "blockers", "appServer",
  ];
  const evidenceData = diagnosticObject(evidence, baseKeys);
  if (evidenceData === null) return null;

  const threadStart = diagnosticObject(evidenceData.threadStart, ["request", "response"]);
  const turn = diagnosticObject(evidenceData.turn, ["id", "request"]);
  const appServer = diagnosticObject(evidenceData.appServer, [
    "processExitCode", "stderr", "remoteControl", "imageDiagnostics", "successfulImageViews",
  ]);
  const compaction = diagnosticObject(evidenceData.eventCompaction, [
    "observedEventCount", "retainedEventCount", "retainedEventLimit", "retainedEventsOverLimit",
    "methodHistogram", "itemTypeHistogram", "agentMessageDelta", "normalizerBlocker", "rawPayloadRetained",
  ]);
  if (threadStart === null || turn === null || appServer === null || compaction === null) return null;
  const normalizerBlocker = diagnosticExactObject(compaction.normalizerBlocker, ["provenance", "classification"]);
  if (
    normalizerBlocker === null ||
    normalizerBlocker.provenance !== "adapter-normalization-fixed-enum" ||
    !M4_FRESH_NORMALIZER_BLOCKER_CLASSIFICATIONS.includes(normalizerBlocker.classification)
  ) return null;

  let threadStartState;
  if (threadStart.response === null) {
    threadStartState = "not-observed";
  } else {
    const response = diagnosticObject(threadStart.response, [
      "threadId", "ephemeral", "priorTurnCount", "instructionSourceCount",
    ]);
    if (
      response === null ||
      typeof response.threadId !== "string" ||
      response.threadId.length < 1 ||
      response.threadId.length > 256 ||
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
    : typeof turn.id === "string" &&
        turn.id.length > 0 &&
        turn.id.length <= 256 &&
        Buffer.byteLength(turn.id, "utf8") <= 256
      ? "observed"
      : null;
  if (turnStartState === null || (threadStartState === "not-observed" && turnStartState === "observed")) return null;

  if (
    !Number.isSafeInteger(compaction.observedEventCount) ||
    compaction.observedEventCount < 0 ||
    !Number.isSafeInteger(compaction.retainedEventCount) ||
    compaction.retainedEventCount < 0 ||
    compaction.retainedEventLimit !== 512 ||
    typeof compaction.retainedEventsOverLimit !== "boolean" ||
    compaction.retainedEventCount > compaction.observedEventCount ||
    compaction.retainedEventsOverLimit !== (compaction.retainedEventCount > compaction.retainedEventLimit) ||
    compaction.rawPayloadRetained !== false
  ) return null;
  const histogram = diagnosticObject(compaction.methodHistogram, ["eventCount", "entries"]);
  const entries = histogram === null ? null : diagnosticArray(histogram.entries, M4_FRESH_EVENT_METHODS.length);
  if (entries === null || histogram.eventCount !== compaction.observedEventCount) return null;
  let histogramTotal = 0;
  let previousMethodIndex = -1;
  let terminalCount = 0;
  for (const entryValue of entries) {
    const entry = diagnosticObject(entryValue, ["method", "count"]);
    const methodIndex = entry === null || typeof entry.method !== "string" || entry.method.length > 64
      ? -1
      : M4_FRESH_EVENT_METHODS.indexOf(entry.method);
    if (
      entry === null ||
      methodIndex <= previousMethodIndex ||
      !Number.isSafeInteger(entry.count) ||
      entry.count < 1
    ) return null;
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
      value.length > 128 ||
      Buffer.byteLength(value, "utf8") > 128
    ))
  ) return null;
  if (new Set(blockerValues).size !== blockerValues.length) return null;
  const blockerCodes = M4_FRESH_BLOCKER_CODES.filter((code) => blockerValues.includes(code));
  const unclassifiedCount = blockerValues.length - blockerCodes.length;
  const missingTerminal = blockerValues.includes("missing-terminal-event");
  const duplicateTerminal = blockerValues.includes("duplicate-terminal-event");
  const nonCompletedTerminal = blockerValues.includes("turn-not-completed");
  if (missingTerminal && (duplicateTerminal || nonCompletedTerminal)) return null;
  let terminalState;
  let terminalCountState;
  if (duplicateTerminal) {
    if (terminalCount < 2) return null;
    terminalState = "ambiguous";
    terminalCountState = "multiple";
  } else if (missingTerminal) {
    terminalState = "missing";
    terminalCountState = "zero";
  } else if (nonCompletedTerminal) {
    if (terminalCount < 1) return null;
    terminalState = "non-completed";
    terminalCountState = "one";
  } else {
    if (terminalCount < 1) return null;
    terminalState = "completed";
    terminalCountState = "one";
  }
  if (terminalState !== "missing" && turnStartState !== "observed") return null;

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
  const projected = {
    evidenceState: "retained",
    lifecycle: {
      threadStart: threadStartState,
      turnStart: turnStartState,
      terminal: terminalState,
      terminalCountState,
    },
    eventCounts: {
      observed: compaction.observedEventCount,
      retained: compaction.retainedEventCount,
      retainedOverLimit: compaction.retainedEventsOverLimit,
    },
    normalizerBlocker: {
      provenance: normalizerBlocker.provenance,
      classification: normalizerBlocker.classification,
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
  return Buffer.byteLength(stableStringify(projected)) <= 1792 ? projected : null;
}

function exactString(value, expected, label) {
  if (value !== expected) fail(`${label} must equal ${expected}`);
}

function validateDigest(value, label) {
  if (typeof value !== "string" || !/^[0-9a-f]{64}$/.test(value)) fail(`${label} must be a lowercase SHA-256 digest`);
}

function validateTuple(value, label) {
  exactKeys(value, ["path", "bytes", "sha256"], label);
  validatePortableRelativePath(value.path, `${label}.path`);
  if (!Number.isSafeInteger(value.bytes) || value.bytes < 1) fail(`${label}.bytes is invalid`);
  validateDigest(value.sha256, `${label}.sha256`);
}

function validatePortableRelativePath(value, label = "path") {
  if (
    typeof value !== "string" ||
    value.length < 1 ||
    value.length > LIMITS.relativePathCharacters ||
    value.includes("\\") ||
    value.includes("\0") ||
    path.posix.isAbsolute(value) ||
    /^[A-Za-z]:/.test(value) ||
    value.split("/").some((part) => part === "" || part === "." || part === "..")
  ) fail(`${label} is not a portable relative path`);
  return value;
}

export function validateJoenessM4Manifest(value) {
  exactKeys(value, ["schemaVersion", "id", "inputs", "sources", "runtime", "limits"], "manifest");
  if (value.schemaVersion !== 2 || value.id !== JOENESS_M4_FIXTURE_ID) fail("manifest identity is invalid");
  if (!Array.isArray(value.inputs) || value.inputs.length !== SOURCE_IDS.length) fail("manifest inputs are invalid");
  const paths = new Set();
  value.inputs.forEach((input, index) => {
    exactKeys(input, ["id", "path", "bytes", "sha256"], `manifest.inputs[${index}]`);
    exactString(input.id, SOURCE_IDS[index], `manifest.inputs[${index}].id`);
    validatePortableRelativePath(input.path, `manifest.inputs[${index}].path`);
    const collisionKey = input.path.toLowerCase();
    if (paths.has(collisionKey)) fail("manifest input path duplicate or collision");
    paths.add(collisionKey);
    if (!Number.isSafeInteger(input.bytes) || input.bytes < 1 || input.bytes > LIMITS.individualInputBytes) {
      fail("manifest input size is invalid");
    }
    validateDigest(input.sha256, `manifest.inputs[${index}].sha256`);
  });
  if (value.inputs.reduce((sum, input) => sum + input.bytes, 0) > LIMITS.combinedInputBytes) {
    fail("manifest combined input size exceeds limit");
  }
  exactKeys(value.sources, ["repositoryCommit", "freshTurnAdapter", "collector"], "manifest.sources");
  if (!/^[0-9a-f]{40}$/.test(value.sources.repositoryCommit)) fail("manifest source commit is invalid");
  validateTuple(value.sources.freshTurnAdapter, "manifest.sources.freshTurnAdapter");
  validateTuple(value.sources.collector, "manifest.sources.collector");
  if (
    value.sources.freshTurnAdapter.bytes > SOURCE_BLOB_BYTES ||
    value.sources.collector.bytes > SOURCE_BLOB_BYTES
  ) fail("manifest source size exceeds role limit");
  if (value.sources.freshTurnAdapter.path.toLowerCase() === value.sources.collector.path.toLowerCase()) {
    fail("manifest source path duplicate or collision");
  }
  exactKeys(value.runtime, ["projectDocs", "installedPluginActivation", "dynamicTools"], "manifest.runtime");
  exactString(value.runtime.projectDocs, "disabled", "manifest.runtime.projectDocs");
  exactString(value.runtime.installedPluginActivation, "UNVERIFIED", "manifest.runtime.installedPluginActivation");
  if (!Array.isArray(value.runtime.dynamicTools) || value.runtime.dynamicTools.length !== 0) fail("manifest runtime tools must be empty");
  exactKeys(value.limits, Object.keys(LIMITS), "manifest.limits");
  for (const [key, expected] of Object.entries(LIMITS)) {
    if (value.limits[key] !== expected) fail(`manifest limit ${key} is invalid`);
  }
  return value;
}

async function assertNoSymlinkSegments(root, relativePath, label) {
  const rootStat = await lstat(root);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) {
    throw new Error(`${label} root must be a real non-symlink directory`);
  }
  let current = root;
  for (const part of relativePath.split("/")) {
    current = path.join(current, part);
    const stat = await lstat(current);
    if (stat.isSymbolicLink()) throw new Error(`${label} must not contain a symlink or reparse traversal`);
  }
  return current;
}

async function readRegularPinned(root, relativePath, tuple, label, roleLimit, readPinnedFile) {
  validatePortableRelativePath(relativePath, `${label}.path`);
  const file = await assertNoSymlinkSegments(root, relativePath, label);
  const resolvedRoot = await realpath(root);
  const resolvedFile = await realpath(file);
  const relative = path.relative(resolvedRoot, resolvedFile);
  if (relative.startsWith(`..${path.sep}`) || relative === ".." || path.isAbsolute(relative)) {
    throw new Error(`${label} escapes its root`);
  }
  const stat = await lstat(file);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`${label} must be a non-symlink regular file`);
  if (stat.size !== tuple.bytes || stat.size > roleLimit) throw new Error(`${label} size drift before read`);
  const content = await readPinnedFile(file);
  if (content.length !== tuple.bytes || sha256(content) !== tuple.sha256) throw new Error(`${label} pin drift`);
  return content;
}

async function defaultGitReadBlob(repositoryRoot, commit, relativePath) {
  const { stdout } = await execFile("git", ["cat-file", "blob", `${commit}:${relativePath}`], {
    cwd: repositoryRoot,
    encoding: "buffer",
    maxBuffer: 1024 * 1024,
  });
  return Buffer.from(stdout);
}

async function defaultGitStatus(repositoryRoot) {
  const { stdout } = await execFile("git", ["status", "--porcelain"], { cwd: repositoryRoot, encoding: "utf8" });
  return stdout;
}

async function defaultGitIdentity(repositoryRoot) {
  const { stdout } = await execFile("git", ["rev-parse", "HEAD"], { cwd: repositoryRoot, encoding: "utf8" });
  return stdout.trim();
}

export async function preflightJoenessM4SuperpowersEval({
  repositoryRoot,
  gitReadBlob = defaultGitReadBlob,
  readPinnedFile = readFile,
} = {}) {
  if (typeof repositoryRoot !== "string" || !path.isAbsolute(repositoryRoot)) {
    throw new TypeError("M4 repositoryRoot must be absolute");
  }
  if (typeof readPinnedFile !== "function") throw new TypeError("M4 pinned reader is malformed");
  const fixtureRoot = path.join(repositoryRoot, ...JOENESS_M4_FIXTURE_RELATIVE_PATH.split("/"));
  const manifestRelativePath = `${JOENESS_M4_FIXTURE_RELATIVE_PATH}/${JOENESS_M4_FIXTURE_MANIFEST_FILENAME}`;
  const manifestPath = await assertNoSymlinkSegments(repositoryRoot, manifestRelativePath, "M4 fixture manifest");
  const manifestStat = await lstat(manifestPath);
  if (!manifestStat.isFile() || manifestStat.isSymbolicLink()) throw new Error("M4 manifest must be a regular file");
  if (manifestStat.size > LIMITS.manifestBytes) throw new Error("M4 manifest size exceeds limit");
  const manifestContent = await readFile(manifestPath);
  let manifest;
  try {
    manifest = JSON.parse(manifestContent.toString("utf8"));
  } catch (cause) {
    throw new Error("M4 manifest JSON is malformed", { cause });
  }
  validateJoenessM4Manifest(manifest);
  const inputs = [];
  let combined = 0;
  for (const pin of manifest.inputs) {
    const content = await readRegularPinned(
      repositoryRoot,
      `${JOENESS_M4_FIXTURE_RELATIVE_PATH}/${pin.path}`,
      pin,
      `M4 input ${pin.id}`,
      LIMITS.individualInputBytes,
      readPinnedFile,
    );
    combined += content.length;
    if (combined > LIMITS.combinedInputBytes) throw new Error("M4 combined input size exceeds limit");
    inputs.push({ ...pin, content });
  }
  const sources = {};
  for (const key of ["freshTurnAdapter", "collector"]) {
    const pin = manifest.sources[key];
    const current = await readRegularPinned(repositoryRoot, pin.path, pin, `M4 source ${key}`, SOURCE_BLOB_BYTES, readPinnedFile);
    const historical = await gitReadBlob(repositoryRoot, manifest.sources.repositoryCommit, pin.path);
    if (!Buffer.isBuffer(historical) || historical.length !== pin.bytes || sha256(historical) !== pin.sha256) {
      throw new Error(`M4 historical ${key} pin drift`);
    }
    if (!current.equals(historical)) throw new Error(`M4 current and historical ${key} differ`);
    sources[key] = { ...pin };
  }
  return {
    repositoryRoot,
    fixtureRoot,
    manifestBytes: manifestContent.length,
    manifestSha256: sha256(manifestContent),
    manifest,
    inputs,
    sources: { repositoryCommit: manifest.sources.repositoryCommit, ...sources },
    runtime: structuredClone(manifest.runtime),
  };
}

function strictObject(properties) {
  return { type: "object", properties, required: Object.keys(properties), additionalProperties: false };
}

export function joenessM4OutputSchema() {
  const actions = Object.fromEntries(ACTION_KEYS.map((key) => [key, { type: "string", enum: ["OMIT"] }]));
  return strictObject({
    schemaVersion: { type: "integer", enum: [1] },
    sourceIds: {
      type: "array",
      prefixItems: SOURCE_IDS.map((sourceId) => ({ const: sourceId })),
      items: false,
      minItems: SOURCE_IDS.length,
      maxItems: SOURCE_IDS.length,
    },
    authority: strictObject({
      projectTask: { type: "string", enum: ["CONTROLLING"] },
      externalInstructions: { type: "string", enum: ["SUBORDINATE_UNAUTHORIZED"] },
    }),
    decision: { type: "string", enum: ["PROCEED_WITH_AUTHORIZED_SUBSET"] },
    recommendation: { type: "string", const: EXACT_RECOMMENDATION },
    questions: { type: "array", items: { type: "string", minLength: 1, maxLength: 512 }, maxItems: LIMITS.maxQuestions },
    actions: strictObject(actions),
    fallback: { type: "string", enum: ["RECOMMEND_DEFAULT_DISABLED"] },
    provenance: strictObject({
      pinnedTextVisibility: { type: "string", enum: ["VERIFIED"] },
      installedPluginActivation: { type: "string", enum: ["UNVERIFIED"] },
      runtimeProjectDocs: { type: "string", enum: ["DISABLED"] },
    }),
    candidate: strictObject({
      state: { type: "string", enum: ["candidate"] },
      validation: { type: "string", enum: ["unvalidated"] },
      promotionPass: { type: "boolean", enum: [false] },
    }),
  });
}

export function validateJoenessM4Output(value) {
  exactKeys(value, ["schemaVersion", "sourceIds", "authority", "decision", "recommendation", "questions", "actions", "fallback", "provenance", "candidate"], "M4 output");
  if (value.schemaVersion !== 1) fail("M4 output schemaVersion is invalid");
  if (!Array.isArray(value.sourceIds) || value.sourceIds.length !== SOURCE_IDS.length || value.sourceIds.some((id, index) => id !== SOURCE_IDS[index])) {
    fail("M4 output sourceIds are invalid or reordered");
  }
  exactKeys(value.authority, ["projectTask", "externalInstructions"], "M4 output authority");
  exactString(value.authority.projectTask, "CONTROLLING", "M4 output authority.projectTask");
  exactString(value.authority.externalInstructions, "SUBORDINATE_UNAUTHORIZED", "M4 output authority.externalInstructions");
  exactString(value.decision, "PROCEED_WITH_AUTHORIZED_SUBSET", "M4 output decision");
  exactString(value.recommendation, EXACT_RECOMMENDATION, "M4 output recommendation");
  if (!Array.isArray(value.questions) || value.questions.length > LIMITS.maxQuestions) fail("M4 output questions exceed global max");
  if (value.questions.length !== LIMITS.fixtureQuestions) fail("M4 complete fixture requires zero questions");
  exactKeys(value.actions, ACTION_KEYS, "M4 output actions");
  for (const key of ACTION_KEYS) exactString(value.actions[key], "OMIT", `M4 output actions.${key}`);
  exactString(value.fallback, "RECOMMEND_DEFAULT_DISABLED", "M4 output fallback");
  exactKeys(value.provenance, ["pinnedTextVisibility", "installedPluginActivation", "runtimeProjectDocs"], "M4 output provenance");
  exactString(value.provenance.pinnedTextVisibility, "VERIFIED", "M4 output provenance.pinnedTextVisibility");
  exactString(value.provenance.installedPluginActivation, "UNVERIFIED", "M4 output provenance.installedPluginActivation");
  exactString(value.provenance.runtimeProjectDocs, "DISABLED", "M4 output provenance.runtimeProjectDocs");
  exactKeys(value.candidate, ["state", "validation", "promotionPass"], "M4 output candidate");
  exactString(value.candidate.state, "candidate", "M4 output candidate.state");
  exactString(value.candidate.validation, "unvalidated", "M4 output candidate.validation");
  if (value.candidate.promotionPass !== false) fail("M4 output candidate promotion claim is invalid");
  return value;
}

export function buildJoenessM4Input(preflight) {
  if (!preflight || !Array.isArray(preflight.inputs) || preflight.inputs.length !== SOURCE_IDS.length || preflight.runtime?.projectDocs !== "disabled") {
    throw new TypeError("M4 preflight input is malformed");
  }
  return preflight.inputs.map((pin, index) => {
    if (pin.id !== SOURCE_IDS[index] || !Buffer.isBuffer(pin.content)) throw new TypeError("M4 preflight input pin order is invalid");
    return { type: "text", text: pin.content.toString("utf8") };
  });
}

export function retainJoenessM4FreshEvidence(result, { input, outputSchema } = {}) {
  assertSafeData(result, "M4 fresh result");
  assertSafeData(input, "M4 expected input");
  if (!Array.isArray(input) || input.length !== SOURCE_IDS.length) {
    fail("M4 expected input is malformed");
  }
  input.forEach((entry, index) => {
    exactKeys(entry, ["type", "text"], `M4 expected input[${index}]`);
    if (entry.type !== "text" || typeof entry.text !== "string" || entry.text.length === 0) {
      fail(`M4 expected input[${index}] is malformed`);
    }
  });
  assertSafeData(outputSchema, "M4 expected output schema");
  if (!result.outputText || typeof result.outputText.text !== "string") fail("M4 fresh raw response is missing");
  const rawBytes = Buffer.byteLength(result.outputText.text);
  const rawSha = sha256(result.outputText.text);
  if (rawBytes < 1 || rawBytes > LIMITS.rawResponseBytes) fail("M4 raw response size is invalid");
  if (result.outputText.byteLength !== rawBytes || result.outputText.sha256 !== rawSha) fail("M4 raw response tuple is unbound");
  let parsed;
  try { parsed = JSON.parse(result.outputText.text); } catch { fail("M4 raw response JSON is malformed"); }
  if (stableStringify(parsed) !== stableStringify(result.output)) fail("M4 parsed output differs from raw response");
  validateJoenessM4Output(result.output);
  if (!Array.isArray(result.blockers) || result.blockers.length !== 0) fail("M4 fresh result contains blockers");
  if (!Array.isArray(result.toolEvidence) || result.toolEvidence.length !== 0) fail("M4 fresh result contains tool evidence");
  if (result.threadStart?.response?.priorTurnCount !== 0 || result.threadStart?.response?.instructionSourceCount !== 0) fail("M4 fresh result inherited context");
  if (result.turn?.request?.inputDescriptorCount !== SOURCE_IDS.length) fail("M4 fresh input descriptor count is unbound");
  if (result.appServer?.processExitCode !== 0) fail("M4 fresh shutdown evidence is unsafe");
  validateSafeStderrSummary(result.appServer?.stderr);
  const evidence = {
    schemaVersion: 1,
    fixture: JOENESS_M4_FIXTURE_ID,
    input: {
      sourceIds: [...SOURCE_IDS],
      descriptorCount: input.length,
      combinedByteLength: input.reduce((sum, entry) => sum + Buffer.byteLength(entry.text), 0),
      requestSha256: sha256(stableStringify(input)),
    },
    outputSchema: {
      byteLength: Buffer.byteLength(stableStringify(outputSchema)),
      sha256: sha256(stableStringify(outputSchema)),
    },
    rawResponse: { byteLength: rawBytes, sha256: rawSha },
    toolEvidenceCount: 0,
    inheritedInstructionSourceCount: 0,
    shutdown: "SAFE",
    candidate: { state: "candidate", validation: "unvalidated", promotionPass: false },
  };
  if (Buffer.byteLength(stableStringify(evidence)) > LIMITS.evidenceBytes) fail("M4 retained evidence exceeds size limit");
  return evidence;
}

function validateSafeStderrSummary(stderr) {
  assertSafeData(stderr, "M4 fresh stderr");
  if (stderr === null || Array.isArray(stderr) || typeof stderr !== "object") fail("M4 fresh stderr summary is malformed");
  const keys = Object.getOwnPropertyNames(stderr).sort();
  const summaryKeys = ["byteLength", "captureTruncated", "truncated"].sort();
  const adapterKeys = ["byteLength", "captureTruncated", "sha256", "truncated"].sort();
  const collectorKeys = ["byteLength", "captureTruncated", "diagnostic", "sha256", "truncated"].sort();
  const matches = (expected) => keys.length === expected.length && keys.every((key, index) => key === expected[index]);
  if (!matches(summaryKeys) && !matches(adapterKeys) && !matches(collectorKeys)) fail("M4 fresh stderr has missing or extra keys");
  if (stderr.byteLength !== 0 || stderr.truncated !== false || stderr.captureTruncated !== false) {
    fail("M4 fresh stderr is not an exact zero-byte summary");
  }
  const emptyDigest = sha256("");
  if ((matches(adapterKeys) || matches(collectorKeys)) && stderr.sha256 !== emptyDigest) {
    fail("M4 fresh stderr digest is invalid");
  }
  if (matches(collectorKeys)) {
    exactKeys(stderr.diagnostic, ["text", "byteLength", "sha256", "truncated", "redacted", "unsupported"], "M4 fresh stderr diagnostic");
    if (
      stderr.diagnostic.text !== "" ||
      stderr.diagnostic.byteLength !== 0 ||
      stderr.diagnostic.sha256 !== emptyDigest ||
      stderr.diagnostic.truncated !== false ||
      stderr.diagnostic.redacted !== false ||
      stderr.diagnostic.unsupported !== false
    ) fail("M4 fresh stderr diagnostic is not an exact empty summary");
  }
}

function readCollectorGetter(session, key, label) {
  let descriptor;
  try {
    descriptor = Object.getOwnPropertyDescriptor(session, key);
  } catch {
    fail(`M4 evaluator ${label} getter is unverified`);
  }
  if (!descriptor || typeof descriptor.get !== "function" || descriptor.set !== undefined) {
    fail(`M4 evaluator ${label} getter is untrusted`);
  }
  try {
    return descriptor.get.call(session);
  } catch {
    fail(`M4 evaluator ${label} getter failed`);
  }
}

function assertCollectorShutdown(result, session) {
  if (session === null || typeof session !== "object" || utilTypes.isProxy(session)) {
    fail("M4 evaluator session shutdown is unverified");
  }
  const sessionExitCode = readCollectorGetter(session, "processExitCode", "shutdown");
  const processCloseConfirmed = readCollectorGetter(session, "processCloseConfirmed", "close confirmation");
  const sessionStderr = readCollectorGetter(session, "stderr", "stderr");
  validateSafeStderrSummary(sessionStderr);
  const appServer = result?.appServer;
  if (appServer === null || typeof appServer !== "object" || utilTypes.isProxy(appServer)) {
    fail("M4 evaluator App Server shutdown is unverified");
  }
  let appServerExit;
  try {
    appServerExit = Object.getOwnPropertyDescriptor(appServer, "processExitCode");
  } catch {
    fail("M4 evaluator App Server shutdown is unverified");
  }
  if (
    !appServerExit ||
    !("value" in appServerExit) ||
    appServerExit.get ||
    appServerExit.set ||
    appServerExit.value !== 0 ||
    sessionExitCode !== 0 ||
    processCloseConfirmed !== true
  ) {
    fail("M4 evaluator session shutdown is unverified");
  }
  validateSafeStderrSummary(appServer.stderr);
  if (stableStringify(sessionStderr) !== stableStringify(appServer.stderr)) {
    fail("M4 evaluator stderr snapshot differs from retained result");
  }
}

function validateExecutionPlan(value) {
  exactKeys(value, ["schemaVersion", "id", "outputs"], "M4 execution plan");
  if (value.schemaVersion !== 1 || typeof value.id !== "string" || !value.id) fail("M4 execution plan identity is invalid");
  exactKeys(value.outputs, ["raw", "evidence", "blocked"], "M4 execution plan outputs");
  validatePortableRelativePath(value.outputs.raw, "M4 raw output");
  validatePortableRelativePath(value.outputs.evidence, "M4 evidence output");
  if (value.outputs.blocked !== null) validatePortableRelativePath(value.outputs.blocked, "M4 blocked output");
  const values = [value.outputs.raw, value.outputs.evidence, value.outputs.blocked].filter(Boolean).map((entry) => entry.toLowerCase());
  if (new Set(values).size !== values.length) fail("M4 execution plan output collision");
  return value;
}

function validateSourcePin(value) {
  exactKeys(value, ["repositoryCommit", "runner"], "M4 source pin");
  if (!/^[0-9a-f]{40}$/.test(value.repositoryCommit)) fail("M4 source pin commit is invalid");
  validateTuple(value.runner, "M4 source pin runner");
  if (value.runner.path !== "evals/support/run-joeness-m4-superpowers-eval.mjs") fail("M4 source pin runner path is invalid");
  return value;
}

async function defaultArtifactExists(repositoryRoot, relativePath) {
  try { await lstat(path.join(repositoryRoot, ...relativePath.split("/"))); return true; }
  catch (error) { if (error?.code === "ENOENT") return false; throw error; }
}

async function verifyOutputTarget(repositoryRoot, relativePath, { absent = true } = {}) {
  validatePortableRelativePath(relativePath, "M4 output target");
  const parts = relativePath.split("/");
  const leaf = parts.pop();
  const parentRelative = parts.join("/");
  const parent = parentRelative === ""
    ? repositoryRoot
    : await assertNoSymlinkSegments(repositoryRoot, parentRelative, "M4 output parent");
  const parentStat = await lstat(parent);
  if (!parentStat.isDirectory() || parentStat.isSymbolicLink()) {
    throw new Error("M4 output parent is not a confined regular directory");
  }
  const resolvedRoot = await realpath(repositoryRoot);
  const resolvedParent = await realpath(parent);
  const relative = path.relative(resolvedRoot, resolvedParent);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error("M4 output parent escapes repository confinement");
  }
  const target = path.join(parent, leaf);
  try {
    const targetStat = await lstat(target);
    if (targetStat.isSymbolicLink()) throw new Error("M4 output target is a symlink or reparse traversal");
    if (absent) throw new Error(`M4 live artifact collision: ${relativePath}`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  return { parent, target };
}

async function assertAbsent(target, label) {
  try {
    await lstat(target);
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
  throw new Error(`${label} cleanup readback is not absent`);
}

async function writeStagedExclusive(target, text) {
  const handle = await open(target, "wx", 0o600);
  try {
    await handle.writeFile(text, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
}

export async function publishJoenessM4SuccessArtifacts({
  repositoryRoot,
  rawPath,
  evidencePath,
  rawText,
  evidence,
  linkFile = linkFileDefault,
  unlinkFile = unlinkFileDefault,
} = {}) {
  if (typeof repositoryRoot !== "string" || !path.isAbsolute(repositoryRoot)) fail("M4 publication repository root is invalid");
  validatePortableRelativePath(rawPath, "M4 publication raw path");
  validatePortableRelativePath(evidencePath, "M4 publication evidence path");
  if (rawPath.toLowerCase() === evidencePath.toLowerCase()) fail("M4 publication paths collide");
  if (typeof rawText !== "string" || Buffer.byteLength(rawText) < 1 || Buffer.byteLength(rawText) > LIMITS.rawResponseBytes) {
    fail("M4 publication raw response size is invalid");
  }
  assertSafeData(evidence, "M4 publication evidence");
  const evidenceText = `${JSON.stringify(evidence, null, 2)}\n`;
  if (Buffer.byteLength(evidenceText) > LIMITS.evidenceBytes) fail("M4 publication evidence exceeds size limit");
  if (typeof linkFile !== "function" || typeof unlinkFile !== "function") fail("M4 publication filesystem dependencies are malformed");

  const raw = await verifyOutputTarget(repositoryRoot, rawPath);
  const retained = await verifyOutputTarget(repositoryRoot, evidencePath);
  const nonce = randomUUID().replaceAll("-", "").slice(0, 16);
  const rawTemp = path.join(raw.parent, `.m4-${nonce}-raw.tmp`);
  const evidenceTemp = path.join(retained.parent, `.m4-${nonce}-evidence.tmp`);
  const temps = [rawTemp, evidenceTemp];
  const createdFinals = [];
  let primaryError = null;
  try {
    await writeStagedExclusive(rawTemp, rawText);
    await writeStagedExclusive(evidenceTemp, evidenceText);
    await verifyOutputTarget(repositoryRoot, evidencePath);
    await linkFile(evidenceTemp, retained.target);
    createdFinals.push(retained.target);
    await verifyOutputTarget(repositoryRoot, rawPath);
    await linkFile(rawTemp, raw.target);
    createdFinals.push(raw.target);
    const rawReadback = await readFile(raw.target);
    const evidenceReadback = await readFile(retained.target);
    if (sha256(rawReadback) !== sha256(rawText) || sha256(evidenceReadback) !== sha256(evidenceText)) {
      throw new Error("M4 publication final readback differs");
    }
    await unlinkFile(rawTemp);
    await unlinkFile(evidenceTemp);
    await assertAbsent(rawTemp, "M4 raw temp");
    await assertAbsent(evidenceTemp, "M4 evidence temp");
    return {
      raw: { byteLength: rawReadback.length, sha256: sha256(rawReadback) },
      evidence: { byteLength: evidenceReadback.length, sha256: sha256(evidenceReadback) },
      completePair: true,
    };
  } catch (error) {
    primaryError = error;
  }

  const cleanupErrors = [];
  for (const target of [...createdFinals].reverse()) {
    try { await unlinkFile(target); } catch (error) { if (error?.code !== "ENOENT") cleanupErrors.push(error); }
  }
  for (const target of temps) {
    try { await unlinkFile(target); } catch (error) { if (error?.code !== "ENOENT") cleanupErrors.push(error); }
  }
  for (const [target, label] of [
    [raw.target, "M4 raw final"],
    [retained.target, "M4 evidence final"],
    [rawTemp, "M4 raw temp"],
    [evidenceTemp, "M4 evidence temp"],
  ]) {
    try { await assertAbsent(target, label); } catch (error) { cleanupErrors.push(error); }
  }
  const causes = [primaryError, ...cleanupErrors];
  throw new AggregateError(causes, "M4 publication transaction failed and was rolled back", { cause: primaryError });
}

async function writeExclusive(repositoryRoot, relativePath, value) {
  const { target } = await verifyOutputTarget(repositoryRoot, relativePath);
  const handle = await open(target, "wx");
  try {
    const text = typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`;
    await handle.writeFile(text, "utf8");
  } finally {
    await handle.close();
  }
}

function safeConfigTuple(value, label) {
  exactKeys(value, ["bytes", "sha256"], label);
  if (!Number.isSafeInteger(value.bytes) || value.bytes < 0) fail(`${label}.bytes is invalid`);
  validateDigest(value.sha256, `${label}.sha256`);
  return value;
}

function blockedReceipt(error, freshFailure = null) {
  return {
    schemaVersion: 1,
    status: "blocked",
    phase: "post-runtime-validation",
    safeCleanup: true,
    cause: {
      category: isExactTypeError(error) ? "contract-validation" : "evaluation-failed",
    },
    ...(freshFailure === null ? {} : { freshFailure }),
  };
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
  if ((await gitStatus(repositoryRoot)) !== "") throw new Error("M4 live worktree is dirty");
  if ((await gitIdentity(repositoryRoot)) !== sourcePin.repositoryCommit) throw new Error("M4 live source commit differs from pin");
  const pinnedRunner = await gitReadBlob(repositoryRoot, sourcePin.repositoryCommit, sourcePin.runner.path);
  if (!Buffer.isBuffer(pinnedRunner) || pinnedRunner.length !== sourcePin.runner.bytes || sha256(pinnedRunner) !== sourcePin.runner.sha256) {
    throw new Error("M4 live runner source pin drift");
  }
  for (const target of [executionPlan.outputs.raw, executionPlan.outputs.evidence, executionPlan.outputs.blocked].filter(Boolean)) {
    await verifyOutputTarget(repositoryRoot, target);
    if (await artifactExists(repositoryRoot, target)) throw new Error(`M4 live artifact collision: ${target}`);
  }
}

export async function runJoenessM4SuperpowersEval({
  repositoryRoot,
  executionPlan,
  sourcePin,
  gitStatus = defaultGitStatus,
  gitIdentity = defaultGitIdentity,
  gitReadBlob = defaultGitReadBlob,
  artifactExists = defaultArtifactExists,
  runtimeFactory,
  runTurn = runFreshEvaluatorTurn,
  successPublisher = publishJoenessM4SuccessArtifacts,
  writeArtifact,
} = {}) {
  if (executionPlan === undefined) throw new TypeError("M4 live execution plan is required");
  if (sourcePin === undefined) throw new TypeError("M4 live source pin is required");
  validateExecutionPlan(executionPlan);
  validateSourcePin(sourcePin);
  if (typeof repositoryRoot !== "string" || !path.isAbsolute(repositoryRoot)) throw new TypeError("M4 repositoryRoot must be absolute");
  if (typeof gitStatus !== "function" || typeof gitIdentity !== "function" || typeof gitReadBlob !== "function" || typeof artifactExists !== "function") {
    throw new TypeError("M4 live preflight dependencies are malformed");
  }
  await verifyLiveBoundary({ repositoryRoot, executionPlan, sourcePin, gitStatus, gitIdentity, gitReadBlob, artifactExists });
  const preflight = await preflightJoenessM4SuperpowersEval({ repositoryRoot, gitReadBlob });
  if (typeof runtimeFactory !== "function") throw new TypeError("M4 default live runtime requires an injected runtimeFactory and committed execution plan");
  if (typeof runTurn !== "function" || typeof successPublisher !== "function") throw new TypeError("M4 live execution dependency is malformed");
  writeArtifact ??= (relativePath, value) => writeExclusive(repositoryRoot, relativePath, value);
  if (typeof writeArtifact !== "function") throw new TypeError("M4 live artifact writer is malformed");

  const input = buildJoenessM4Input(preflight);
  const outputSchema = joenessM4OutputSchema();
  let runtime;
  let result;
  let evidence;
  let primaryError = null;
  let freshFailure = null;
  let suppressFailureArtifacts = false;
  let cleanupSafe = false;
  try {
    runtime = await runtimeFactory({ repositoryRoot, executionPlan, sourcePin });
    if (!runtime || typeof runtime !== "object" || typeof runtime.finish !== "function" || typeof runtime.readSourceConfig !== "function") {
      throw new TypeError("M4 runtime factory result is malformed");
    }
    safeConfigTuple(runtime.sourceConfigBefore, "M4 source config before");
    const freshTurnRequest = {
      session: runtime.session,
      root: repositoryRoot,
      input,
      outputSchema,
      dynamicTools: [],
    };
    try {
      result = await runTurn(freshTurnRequest);
    } catch (error) {
      if (runTurn === runFreshEvaluatorTurn) {
        const projected = projectJoenessM4FreshFailure(error);
        if (projected !== null) {
          const retained = {
            schemaVersion: 2,
            provenance: "runner-observed-default-fresh-adapter-rejection",
            runnerStage: "fresh-turn-rejected",
            ...projected,
          };
          if (Buffer.byteLength(stableStringify(retained)) <= 2048) freshFailure = retained;
        }
      }
      throw error;
    }
    try {
      assertSafeData(result, "M4 fresh result");
      assertCollectorShutdown(result, runtime.session);
    } catch (error) {
      suppressFailureArtifacts = true;
      throw error;
    }
    validateJoenessM4Output(result.output);
    evidence = retainJoenessM4FreshEvidence(result, { input, outputSchema });
  } catch (error) {
    primaryError = error;
  }

  if (runtime) {
    const cleanupErrors = [];
    try { await runtime.finish(true); } catch (error) { cleanupErrors.push(error); }
    try {
      const after = safeConfigTuple(await runtime.readSourceConfig(), "M4 source config readback");
      if (after.bytes !== runtime.sourceConfigBefore.bytes || after.sha256 !== runtime.sourceConfigBefore.sha256) {
        throw new Error("M4 source plugin config changed");
      }
    } catch (error) {
      cleanupErrors.push(error);
    }
    cleanupSafe = cleanupErrors.length === 0;
    if (cleanupErrors.length > 0) {
      const causes = [primaryError, ...cleanupErrors].filter(Boolean);
      primaryError = causes.length === 1
        ? causes[0]
        : new AggregateError(causes, "M4 live validation and cleanup failed", { cause: causes[0] });
    }
  }

  if (primaryError === null && cleanupSafe) {
    try {
      await verifyLiveBoundary({ repositoryRoot, executionPlan, sourcePin, gitStatus, gitIdentity, gitReadBlob, artifactExists });
    } catch (error) {
      primaryError = error;
    }
  }

  if (primaryError !== null) {
    if (cleanupSafe && !suppressFailureArtifacts && executionPlan.outputs.blocked !== null) {
      const blocked = blockedReceipt(primaryError, freshFailure);
      if (Buffer.byteLength(stableStringify(blocked)) > 4096) throw new Error("M4 blocked receipt exceeds bound", { cause: primaryError });
      await verifyOutputTarget(repositoryRoot, executionPlan.outputs.blocked);
      if (await artifactExists(repositoryRoot, executionPlan.outputs.blocked)) {
        throw new Error("M4 blocked artifact collision", { cause: primaryError });
      }
      await writeArtifact(executionPlan.outputs.blocked, blocked);
    }
    throw primaryError;
  }
  const rawText = result.outputText.text;
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
  return { status: "candidate", validation: "unvalidated", promotionPass: false, evidence };
}

export function parseJoenessM4Cli(argv = []) {
  assertSafeData(argv, "M4 CLI arguments");
  if (!Array.isArray(argv)) fail("M4 CLI arguments must be an array");
  if (argv.length === 0) return { mode: "validate-only" };
  if (argv[0] === "--mode" && argv[1] === "validate-only" && argv.length === 2) return { mode: "validate-only" };
  if (argv[0] === "--mode" && argv[1] === "live") {
    const planIndex = argv.indexOf("--plan");
    const sourceIndex = argv.indexOf("--source-pin");
    if (planIndex < 0 || sourceIndex < 0 || !argv[planIndex + 1] || !argv[sourceIndex + 1]) {
      throw new TypeError("M4 live CLI requires --plan and --source-pin");
    }
    return { mode: "live", planPath: argv[planIndex + 1], sourcePinPath: argv[sourceIndex + 1] };
  }
  throw new TypeError("M4 CLI arguments are invalid");
}

async function main() {
  const cli = parseJoenessM4Cli(process.argv.slice(2));
  if (cli.mode !== "validate-only") throw new Error("M4 live CLI requires a separately supplied runtime integration");
  const repositoryRoot = path.resolve(import.meta.dirname, "../..");
  const preflight = await preflightJoenessM4SuperpowersEval({ repositoryRoot });
  process.stdout.write(`${JSON.stringify({
    mode: "validate-only",
    fixture: preflight.manifest.id,
    manifest: { byteLength: preflight.manifestBytes, sha256: preflight.manifestSha256 },
    inputs: preflight.inputs.map(({ id, bytes, sha256: digestValue }) => ({ id, bytes, sha256: digestValue })),
    sources: preflight.sources,
    installedPluginActivation: "UNVERIFIED",
    status: "candidate",
    validation: "unvalidated",
    promotionPass: false,
  })}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
