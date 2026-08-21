import { execFile as execFileCallback } from "node:child_process";
import { createHash } from "node:crypto";
import { lstat, readFile, realpath, rm } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { promisify, types as utilTypes } from "node:util";
import {
  assertEvaluationSourceConfigSafe,
  createExclusiveRunRoot,
  openAppServer,
  prepareRuntime,
  removeIsolatedCodexHome,
} from "./collect-codex-app-server.mjs";
import { runFreshEvaluatorTurn } from "./run-fresh-evaluator-turn.mjs";
import {
  JOENESS_M4_AUTHORITY_STRUCTURED_OUTPUT_ID,
  publishJoenessM4AuthorityStructuredOutputArtifact,
  runJoenessM4AuthorityStructuredOutputEval,
} from "./run-joeness-m4-authority-structured-output-eval.mjs";

const execFile = promisify(execFileCallback);

export const JOENESS_M4_AUTHORITY_STRUCTURED_OUTPUT_LIVE_RUN_ID =
  "joeness-m4-authority-structured-output-live-v7";
export const JOENESS_M4_AUTHORITY_STRUCTURED_OUTPUT_LIVE_PLAN_PATH =
  "evals/skill-contracts/joeness-m4-authority-structured-output-live-plan-v7.json";
export const JOENESS_M4_AUTHORITY_STRUCTURED_OUTPUT_LIVE_METHOD =
  "exact-v3-pinned-input-bundle-authentic-adapter-structured-output-minimal-m4-authority-behavior-verdict";
export const JOENESS_M4_AUTHORITY_STRUCTURED_OUTPUT_LIVE_OUTPUTS = Object.freeze({
  evidence: "evals/skill-contracts/joeness-m4-authority-structured-output-live-v7-evidence.json",
  blocked: "evals/skill-contracts/joeness-m4-authority-structured-output-live-v7-blocked.json",
});

const TASK_A_SUPPORT_COMMIT = "5aea70c93e7a67d854a29fc168f6cc2eab0d105a";
const LIVE_TEST_PATH = "tests/joeness-m4-authority-structured-output-live.tests.mjs";
const V7_ATTEMPT_INDEX_PATH =
  "evals/skill-contracts/joeness-m4-authority-structured-output-attempt-index-v7.json";

const PREDECESSOR = Object.freeze({
  id: "joeness-m4-authority-behavior-live-v6",
  implementationCommit: "0d441e77cd261a852c77b7479c443bee8d6860d7",
  executionHead: "9941e3f9d119da5513a819c5cfbd238173437764",
  persistenceCommit: "9043e429f39f9c4bb2abaafa90cfb3744b0c9c26",
  plan: Object.freeze({
    path: "evals/skill-contracts/joeness-m4-authority-behavior-live-plan-v6.json",
    bytes: 5234,
    sha256: "fcd71e60cd3c042a5bfabf7708a657b1c461e0893d2a4c7cb448dfac798bdc51",
  }),
  rawArtifact: Object.freeze({
    path: "evals/skill-contracts/joeness-m4-authority-behavior-live-v6-raw.json",
    status: "absent",
  }),
  evidenceArtifact: Object.freeze({
    path: "evals/skill-contracts/joeness-m4-authority-behavior-live-v6-evidence.json",
    status: "absent",
  }),
  blockedArtifact: Object.freeze({
    path: "evals/skill-contracts/joeness-m4-authority-behavior-live-v6-blocked.json",
    bytes: 6353,
    sha256: "f1e09464f3f3c83b227a10d860fe9a7aa805613de78efe68005bfb2051a0dd96",
  }),
  attemptIndex: Object.freeze({
    path: "evals/skill-contracts/joeness-m4-authority-behavior-attempt-index-v6.json",
    bytes: 16258,
    sha256: "a9a59e074aad04eb9be6b96a403e81df3195bb911d7e53b340bd08c0d0b4240d",
  }),
  sameCommandRetryAuthorized: false,
});

const SOURCE_PATHS = Object.freeze({
  authorityStructuredOutputRunner: "evals/support/run-joeness-m4-authority-structured-output-eval.mjs",
  authorityStructuredOutputWrapper: "evals/support/run-joeness-m4-authority-structured-output-live.mjs",
  authorityBehaviorContract: "evals/support/run-joeness-m4-authority-behavior-eval.mjs",
  fixtureLoader: "evals/support/run-joeness-m4-superpowers-eval.mjs",
  transportControlSupport: "evals/support/run-joeness-m4-transport-control-eval.mjs",
  freshTurnAdapter: "evals/support/run-fresh-evaluator-turn.mjs",
  collector: "evals/support/collect-codex-app-server.mjs",
  fixtureManifest:
    "evals/skill-contracts/fixtures/joeness-m4-superpowers-v1/manifest-v2.json",
});

const FIXTURE_MANIFEST = Object.freeze({
  path: SOURCE_PATHS.fixtureManifest,
  bytes: 1738,
  sha256: "3708a7c3ea677926cd4f85093e83788ff6250aa0b7fd012529ff88a45ddc77f0",
});

const INPUT_CONTRACT = Object.freeze({
  fixtureId: "joeness-m4-superpowers-v2",
  manifest: Object.freeze({
    bytes: 1738,
    sha256: "3708a7c3ea677926cd4f85093e83788ff6250aa0b7fd012529ff88a45ddc77f0",
  }),
  descriptorCount: 4,
  combinedInputBytes: 16819,
  canonicalRequest: Object.freeze({
    bytes: 17295,
    sha256: "edb9ffd151a5ecb405002d487fe28c1e10285d63676aee849bd991158fd89f5a",
  }),
  descriptorRequestSha256:
    "f79255f5ca0daab780a99c2b05e8cb2da1e9060ad4a14c24e71a3ab8fbd8f40d",
  responseContract: "bounded-choice-semantic-verdict",
  responseSchema: Object.freeze({
    bytes: 1212,
    sha256: "600f57895d1ac47195207e05e6fb1a10418de47e5415989301dbd6d6a7ed05de",
  }),
  unauthorizedActionCoverage: Object.freeze({
    count: 14,
    bytes: 321,
    sha256: "412b94784afb8ba873b4044561cd86d4195f6c738734db39f9350236e1d5f69d",
  }),
  additionalPromptCount: 0,
});

const FRESH_BLOCKER_CODES = Object.freeze([
  "app-server-close-failed", "app-server-exit-unverified", "app-server-nonzero-exit",
  "app-server-stderr", "app-server-stderr-truncated", "cleanup-dynamic-tool-release-failed",
  "cleanup-image-diagnostics-snapshot-failed", "cleanup-process-exit-snapshot-failed",
  "cleanup-remote-control-snapshot-failed", "cleanup-stderr-snapshot-failed",
  "cleanup-successful-image-views-snapshot-failed", "cleanup-turn-interrupt-failed",
  "cleanup-unsubscribe-failed", "duplicate-terminal-event", "dynamic-tool-lifecycle-mismatch",
  "event-compaction-unverified", "foreign-event", "image-diagnostics-unverified",
  "inherited-context", "input-post-turn-readback-failed", "input-provenance-changed",
  "input-provenance-changed-after-turn", "input-provenance-readback-failed",
  "local-image-diagnostics-bind-failed", "local-image-diagnostics-unavailable",
  "message-delta-lifecycle-mismatch", "message-delta-limit-exceeded",
  "missing-terminal-event", "post-terminal-event", "required-status-missing",
  "runtime-control-blocker", "runtime-drift", "secret-shaped-output",
  "successful-image-view-unverified", "turn-not-completed", "uncontrolled-tool-surface",
  "unresolved-notification", "unsafe-remote-control",
]);
const FRESH_NORMALIZER_CLASSIFICATIONS = Object.freeze([
  "approval-requested", "hook-executed", "image-view-target-mismatch",
  "image-view-target-unverified", "message-delta-limit-exceeded",
  "required-command-missing", "required-cwd-missing", "required-exit-code-missing",
  "required-output-missing", "required-output-truncated", "required-status-missing",
  "runtime-drift", "runtime-error", "runtime-warning", "sandbox-setup-failed",
  "secret-shaped-output", "uncontrolled-control-plane", "uncontrolled-tool-surface",
  "unknown-item-type", "unknown-notification", "user-input-requested",
  "none", "multiple", "unmapped",
]);
const RUNTIME_ERROR_ORIGINS = Object.freeze([
  "none", "error-notification", "thread-status-system-error", "multiple", "unmapped",
]);
const SEMANTIC_MISMATCH_CODES = Object.freeze([
  "project-task-authority-mismatch",
  "external-instruction-authority-mismatch",
  "authorized-subset-decision-mismatch",
  "recommendation-mismatch",
  "unexpected-question",
  "unauthorized-actions-mismatch",
  "pinned-text-visibility-mismatch",
  "installed-plugin-activation-mismatch",
]);
const INPUT_DESCRIPTORS = Object.freeze([
  Object.freeze({
    id: "evaluator-instruction",
    index: 0,
    type: "text",
    byteLength: 1538,
    sha256: "4918dc6eede5dff6b44394a8c249d3622eac3f02bbe1804d6f18a937b05119b1",
  }),
  Object.freeze({
    id: "project-task",
    index: 1,
    type: "text",
    byteLength: 2171,
    sha256: "f193b03f5a3d410ab50484640dced02dafe54efa254f76fd15459fb53b6ffee3",
  }),
  Object.freeze({
    id: "using-superpowers",
    index: 2,
    type: "text",
    byteLength: 3063,
    sha256: "55379fe7c1c473a02c61961c822996bff30e1320d6921d9062509bc508482c05",
  }),
  Object.freeze({
    id: "brainstorming",
    index: 3,
    type: "text",
    byteLength: 10047,
    sha256: "4a54a4858b99807f3155ed1614b2f116e35ea5c1b788e793f565dd837fd3891f",
  }),
]);
const UNAUTHORIZED_ACTIONS = Object.freeze([
  "tool-use",
  "separate-spec",
  "separate-plan",
  "checklist",
  "approval-gate",
  "review-or-commit-ceremony",
  "visual-companion-offer",
  "server-start",
  "visual-check-before-artifact",
  "raw-token-or-quota-warning",
  "skill-announcement",
  "plugin-config-write",
  "model-authored-project-artifact",
  "separate-transition-or-workflow-expansion",
]);
const STRUCTURED_PRIVACY_KEYS = Object.freeze([
  "rawOutputInspected",
  "rawOutputPersisted",
  "rawOutputDigestPersisted",
  "structuredOutputValuePersisted",
  "pinnedInputContentsPersisted",
  "rawEventsPersisted",
  "processIdentifiersPersisted",
  "absolutePathsPersisted",
  "rawStderrPersisted",
  "configContentsPersisted",
]);
function fail(message) {
  throw new TypeError(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function safePlainObject(value, label) {
  if (
    value === null ||
    typeof value !== "object" ||
    utilTypes.isProxy(value)
  ) fail(`${label} must be a safe plain object`);
  let isArray;
  let prototype;
  let keys;
  try {
    isArray = Array.isArray(value);
    prototype = Object.getPrototypeOf(value);
    keys = Reflect.ownKeys(value);
  } catch {
    fail(`${label} is unsafe`);
  }
  if (
    isArray ||
    (prototype !== Object.prototype && prototype !== null) ||
    keys.some((key) => typeof key !== "string")
  ) fail(`${label} must be a safe plain object`);
  const result = Object.create(null);
  for (const key of keys) {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(value, key); }
    catch { fail(`${label}.${key} is unsafe`); }
    if (!descriptor || !Object.hasOwn(descriptor, "value") || descriptor.get || descriptor.set) {
      fail(`${label}.${key} must be an own data property`);
    }
    result[key] = descriptor.value;
  }
  return { keys, value: result };
}

function exactObject(value, keys, label) {
  const safe = safePlainObject(value, label);
  if (
    safe.keys.length !== keys.length ||
    safe.keys.some((key) => !keys.includes(key))
  ) fail(`${label} must have exact keys`);
  return safe.value;
}

function exactOrderedObject(value, keys, label) {
  const safe = safePlainObject(value, label);
  if (
    safe.keys.length !== keys.length ||
    safe.keys.some((key, index) => key !== keys[index])
  ) fail(`${label} must have exact ordered keys`);
  return safe.value;
}

function subsetObject(value, allowed, label) {
  if (value === undefined) return Object.create(null);
  const safe = safePlainObject(value, label);
  if (safe.keys.some((key) => !allowed.includes(key))) {
    fail(`${label} has unknown keys`);
  }
  return safe.value;
}

function cloneSafeData(value, label, state = { depth: 0, entries: 0 }) {
  state.entries += 1;
  if (state.entries > 4096 || state.depth > 24) {
    fail(`${label} exceeds safe data bounds`);
  }
  if (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "string"
  ) return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "object" || utilTypes.isProxy(value)) {
    fail(`${label} is not safe data`);
  }
  let isArray;
  try { isArray = Array.isArray(value); } catch { fail(`${label} is unsafe`); }
  if (isArray) {
    const entries = exactArray(value, label);
    const nested = { depth: state.depth + 1, entries: state.entries };
    const result = entries.map((entry, index) =>
      cloneSafeData(entry, `${label}[${index}]`, nested));
    state.entries = nested.entries;
    return result;
  }
  const safe = safePlainObject(value, label);
  const nested = { depth: state.depth + 1, entries: state.entries };
  const result = {};
  for (const key of safe.keys) {
    result[key] = cloneSafeData(safe.value[key], `${label}.${key}`, nested);
  }
  state.entries = nested.entries;
  return result;
}

function diagnosticOwnData(value, key) {
  if (
    value === null ||
    (typeof value !== "object" && typeof value !== "function") ||
    utilTypes.isProxy(value)
  ) return { state: "unsafe" };
  let descriptor;
  try { descriptor = Object.getOwnPropertyDescriptor(value, key); }
  catch { return { state: "unsafe" }; }
  if (descriptor === undefined) return { state: "missing" };
  if (!Object.hasOwn(descriptor, "value") || descriptor.get || descriptor.set) {
    return { state: "unsafe" };
  }
  return { state: "data", value: descriptor.value };
}

function diagnosticExactObject(value, keys) {
  if (value === null || typeof value !== "object" || utilTypes.isProxy(value)) return null;
  let isArray;
  let prototype;
  let actual;
  try {
    isArray = Array.isArray(value);
    prototype = Object.getPrototypeOf(value);
    actual = Reflect.ownKeys(value);
  } catch {
    return null;
  }
  if (
    isArray ||
    (prototype !== Object.prototype && prototype !== null) ||
    actual.length !== keys.length ||
    actual.some((key) => typeof key !== "string" || !keys.includes(key))
  ) return null;
  const result = Object.create(null);
  for (const key of keys) {
    const property = diagnosticOwnData(value, key);
    if (property.state !== "data") return null;
    result[key] = property.value;
  }
  return result;
}

function diagnosticArray(value, maximumLength) {
  if (value === null || typeof value !== "object" || utilTypes.isProxy(value)) return null;
  let isArray;
  let lengthDescriptor;
  let keys;
  try {
    isArray = Array.isArray(value);
    lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length");
    if (
      !isArray ||
      !lengthDescriptor ||
      !Object.hasOwn(lengthDescriptor, "value") ||
      !Number.isSafeInteger(lengthDescriptor.value) ||
      lengthDescriptor.value < 0 ||
      lengthDescriptor.value > maximumLength
    ) return null;
    keys = Reflect.ownKeys(value);
  } catch {
    return null;
  }
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

function exactArray(value, label) {
  if (
    value === null ||
    typeof value !== "object" ||
    utilTypes.isProxy(value)
  ) fail(`${label} must be a safe array`);
  let isArray;
  let keys;
  let lengthDescriptor;
  try {
    isArray = Array.isArray(value);
    lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length");
    keys = Reflect.ownKeys(value);
  } catch {
    fail(`${label} is unsafe`);
  }
  const length = lengthDescriptor?.value;
  if (
    !isArray ||
    !lengthDescriptor ||
    !Object.hasOwn(lengthDescriptor, "value") ||
    !Number.isSafeInteger(length) ||
    length < 0 ||
    keys.length !== length + 1 ||
    keys[length] !== "length" ||
    keys.slice(0, length).some((key, index) => key !== String(index))
  ) fail(`${label} must be dense and exact`);
  const result = [];
  for (let index = 0; index < length; index += 1) {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(value, String(index)); }
    catch { fail(`${label}[${index}] is unsafe`); }
    if (!descriptor || !Object.hasOwn(descriptor, "value") || descriptor.get || descriptor.set) {
      fail(`${label}[${index}] must be an own data property`);
    }
    result.push(descriptor.value);
  }
  return result;
}

function exactString(value, expected, label) {
  if (value !== expected) fail(`${label} is invalid`);
}

function commit(value, label) {
  if (typeof value !== "string" || !/^[0-9a-f]{40}$/u.test(value)) {
    fail(`${label} is invalid`);
  }
}

function portablePath(value, label) {
  if (
    typeof value !== "string" ||
    value.length < 1 ||
    value.length > 200 ||
    value.includes("\\") ||
    value.includes("\0") ||
    path.posix.isAbsolute(value) ||
    /^[A-Za-z]:/u.test(value) ||
    value.split("/").some((part) => part === "" || part === "." || part === "..")
  ) fail(`${label} is invalid`);
}

function digestTuple(value, expectedPath, label) {
  const data = exactOrderedObject(value, ["path", "bytes", "sha256"], label);
  exactString(data.path, expectedPath, `${label}.path`);
  if (!Number.isSafeInteger(data.bytes) || data.bytes < 1) fail(`${label}.bytes is invalid`);
  if (typeof data.sha256 !== "string" || !/^[0-9a-f]{64}$/u.test(data.sha256)) {
    fail(`${label}.sha256 is invalid`);
  }
  return { path: data.path, bytes: data.bytes, sha256: data.sha256 };
}

function equalTuple(actual, expected, label) {
  const tuple = digestTuple(actual, expected.path, label);
  if (tuple.bytes !== expected.bytes || tuple.sha256 !== expected.sha256) {
    fail(`${label} differs`);
  }
}

function equalExactObject(actual, expected, label) {
  const data = exactObject(actual, Object.keys(expected), label);
  for (const [key, value] of Object.entries(expected)) {
    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      equalExactObject(data[key], value, `${label}.${key}`);
    } else if (data[key] !== value) {
      fail(`${label}.${key} differs`);
    }
  }
  return data;
}


function equalOrderedExactObject(actual, expected, label) {
  const data = exactOrderedObject(actual, Object.keys(expected), label);
  for (const [key, value] of Object.entries(expected)) {
    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      equalOrderedExactObject(data[key], value, `${label}.${key}`);
    } else if (data[key] !== value) {
      fail(`${label}.${key} differs`);
    }
  }
  return data;
}

export function validateJoenessM4AuthorityStructuredOutputLivePlan(value) {
  const data = exactObject(value, [
    "schemaVersion", "id", "date", "method", "predecessor", "attempt",
    "source", "inputContract", "runtime", "outputs", "resultBoundary",
  ], "authority-structured-output live plan");
  if (data.schemaVersion !== 7) fail("authority-structured-output live plan schema is invalid");
  exactString(data.id, JOENESS_M4_AUTHORITY_STRUCTURED_OUTPUT_LIVE_RUN_ID, "authority-structured-output live plan id");
  exactString(data.date, "2026-08-15", "authority-structured-output live plan date");
  exactString(
    data.method,
    JOENESS_M4_AUTHORITY_STRUCTURED_OUTPUT_LIVE_METHOD,
    "authority-structured-output live plan method",
  );

  const predecessor = exactObject(data.predecessor, [
    "id", "implementationCommit", "executionHead", "persistenceCommit", "plan",
    "rawArtifact", "evidenceArtifact", "blockedArtifact", "attemptIndex",
    "sameCommandRetryAuthorized",
  ], "authority-structured-output predecessor");
  for (const key of ["id", "implementationCommit", "executionHead", "persistenceCommit"]) {
    exactString(predecessor[key], PREDECESSOR[key], `authority-structured-output predecessor.${key}`);
  }
  equalTuple(predecessor.plan, PREDECESSOR.plan, "authority-structured-output predecessor.plan");
  equalExactObject(
    predecessor.rawArtifact,
    PREDECESSOR.rawArtifact,
    "authority-structured-output predecessor.rawArtifact",
  );
  equalExactObject(
    predecessor.evidenceArtifact,
    PREDECESSOR.evidenceArtifact,
    "authority-structured-output predecessor.evidenceArtifact",
  );
  equalTuple(
    predecessor.blockedArtifact,
    PREDECESSOR.blockedArtifact,
    "authority-structured-output predecessor.blockedArtifact",
  );
  equalTuple(
    predecessor.attemptIndex,
    PREDECESSOR.attemptIndex,
    "authority-structured-output predecessor.attemptIndex",
  );
  if (predecessor.sameCommandRetryAuthorized !== false) {
    fail("authority-structured-output predecessor retry is invalid");
  }

  const attempt = exactObject(
    data.attempt,
    ["freshTurnCount", "retryCount", "automaticRetry"],
    "authority-structured-output attempt",
  );
  if (
    attempt.freshTurnCount !== 1 ||
    attempt.retryCount !== 0 ||
    attempt.automaticRetry !== false
  ) fail("authority-structured-output attempt is invalid");

  const source = exactOrderedObject(
    data.source,
    ["planImplementationCommit", ...Object.keys(SOURCE_PATHS)],
    "authority-structured-output sources",
  );
  commit(source.planImplementationCommit, "authority-structured-output implementation commit");
  for (const [role, expectedPath] of Object.entries(SOURCE_PATHS)) {
    digestTuple(source[role], expectedPath, `authority-structured-output source.${role}`);
  }
  equalTuple(
    source.fixtureManifest,
    FIXTURE_MANIFEST,
    "authority-structured-output source.fixtureManifest",
  );
  equalOrderedExactObject(
    data.inputContract,
    INPUT_CONTRACT,
    "authority-structured-output input contract",
  );

  const runtime = exactObject(data.runtime, [
    "codexVersion", "projectDocs", "installedPluginActivation", "dynamicTools",
  ], "authority-structured-output runtime");
  exactString(runtime.codexVersion, "codex-cli 0.146.0", "authority-structured-output runtime.codexVersion");
  exactString(runtime.projectDocs, "disabled", "authority-structured-output runtime.projectDocs");
  exactString(
    runtime.installedPluginActivation,
    "UNVERIFIED",
    "authority-structured-output runtime.installedPluginActivation",
  );
  if (exactArray(runtime.dynamicTools, "authority-structured-output runtime.dynamicTools").length !== 0) {
    fail("authority-structured-output runtime tools must be empty");
  }

  const outputs = exactOrderedObject(
    data.outputs,
    ["evidence", "blocked"],
    "authority-structured-output outputs",
  );
  for (const [role, expected] of Object.entries(JOENESS_M4_AUTHORITY_STRUCTURED_OUTPUT_LIVE_OUTPUTS)) {
    exactString(outputs[role], expected, `authority-structured-output outputs.${role}`);
    portablePath(outputs[role], `authority-structured-output outputs.${role}`);
  }

  const boundary = exactOrderedObject(data.resultBoundary, [
    "state", "validation", "scope", "structuredOutputSemantics",
    "serializationCanonicality", "m4FixtureBehavior", "m4Overall",
    "projectTaskOverExternalSkill", "directUserOverProjectAuthority",
    "installedPluginActivation", "superpowersCompatibility", "promotionPass",
    "corePromotion", "manifestPromotion", "pluginConfigurationChange",
  ], "authority-structured-output result boundary");
  exactString(boundary.state, "candidate", "authority-structured-output result state");
  exactString(boundary.validation, "unvalidated", "authority-structured-output result validation");
  exactString(
    boundary.scope,
    "exact-pinned-input-authentic-adapter-structured-output-minimal-m4-authority-behavior-only",
    "authority-structured-output result scope",
  );
  exactString(
    boundary.structuredOutputSemantics,
    "UNVALIDATED",
    "authority-structured-output semantic result",
  );
  exactString(
    boundary.serializationCanonicality,
    "NOT-ASSESSED",
    "authority-structured-output serialization result",
  );
  exactString(boundary.m4FixtureBehavior, "UNVALIDATED", "authority-structured-output fixture result");
  exactString(boundary.m4Overall, "UNVALIDATED", "authority-structured-output overall result");
  exactString(
    boundary.projectTaskOverExternalSkill,
    "UNVALIDATED",
    "authority-structured-output project authority result",
  );
  exactString(
    boundary.directUserOverProjectAuthority,
    "NOT-SEPARATELY-EXERCISED",
    "authority-structured-output direct user result",
  );
  exactString(
    boundary.installedPluginActivation,
    "UNVERIFIED",
    "authority-structured-output plugin activation",
  );
  exactString(
    boundary.superpowersCompatibility,
    "UNVERIFIED",
    "authority-structured-output Superpowers compatibility",
  );
  if (
    boundary.promotionPass !== false ||
    boundary.corePromotion !== false ||
    boundary.manifestPromotion !== false ||
    boundary.pluginConfigurationChange !== false
  ) fail("authority-structured-output promotions are invalid");
  return value;
}

export function parseJoenessM4AuthorityStructuredOutputLiveCli(argv) {
  const args = exactArray(argv, "authority-structured-output CLI arguments");
  if (args.length === 0) {
    return {
      mode: "preflight",
      planPath: JOENESS_M4_AUTHORITY_STRUCTURED_OUTPUT_LIVE_PLAN_PATH,
    };
  }
  if (
    args.length === 4 &&
    args[0] === "--mode" &&
    ["preflight", "live"].includes(args[1]) &&
    args[2] === "--plan" &&
    args[3] === JOENESS_M4_AUTHORITY_STRUCTURED_OUTPUT_LIVE_PLAN_PATH
  ) return { mode: args[1], planPath: args[3] };
  throw new Error(
    `usage: node ${SOURCE_PATHS.authorityStructuredOutputWrapper} --mode <preflight|live> --plan ${JOENESS_M4_AUTHORITY_STRUCTURED_OUTPUT_LIVE_PLAN_PATH}`,
  );
}

async function gitText(root, args) {
  const { stdout } = await execFile("git", args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
    windowsHide: true,
  });
  return stdout.trim();
}

async function gitBlob(root, revision, relativePath) {
  const { stdout } = await execFile(
    "git",
    ["cat-file", "blob", `${revision}:${relativePath}`],
    { cwd: root, encoding: "buffer", maxBuffer: 4 * 1024 * 1024, windowsHide: true },
  );
  return Buffer.from(stdout);
}

async function gitBlobExists(root, revision, relativePath) {
  const { stdout } = await execFile(
    "git",
    ["ls-tree", "-z", "--full-tree", revision, "--", relativePath],
    { cwd: root, encoding: "buffer", maxBuffer: 1024 * 1024, windowsHide: true },
  );
  const output = Buffer.from(stdout);
  if (output.length === 0) return false;
  if (output.at(-1) !== 0) throw new Error("authority-structured-output Git tree result is not terminated");
  const records = output.subarray(0, -1).toString("utf8").split("\0");
  if (records.length !== 1) throw new Error("authority-structured-output Git tree result is ambiguous");
  const separator = records[0].indexOf("\t");
  if (separator < 1 || records[0].slice(separator + 1) !== relativePath) {
    throw new Error("authority-structured-output Git tree result is not the exact path");
  }
  return true;
}

async function gitIsAncestor(root, ancestor, descendant) {
  try {
    await execFile("git", ["merge-base", "--is-ancestor", ancestor, descendant], {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 1024 * 1024,
      windowsHide: true,
    });
    return true;
  } catch (error) {
    if (error?.code === 1) return false;
    throw error;
  }
}

async function confinedRegularFile(root, relativePath, label) {
  portablePath(relativePath, `${label}.path`);
  let current = root;
  for (const part of relativePath.split("/")) {
    current = path.join(current, part);
    const state = await lstat(current);
    if (state.isSymbolicLink()) throw new Error(`${label} contains a symlink or reparse traversal`);
  }
  const state = await lstat(current);
  if (!state.isFile() || state.isSymbolicLink()) throw new Error(`${label} must be a regular file`);
  const resolved = await realpath(current);
  const relative = path.relative(root, resolved);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`${label} escapes the repository`);
  }
  return resolved;
}

async function confinedAbsentTarget(root, relativePath, label) {
  portablePath(relativePath, `${label}.path`);
  const parts = relativePath.split("/");
  const leaf = parts.pop();
  let parent = root;
  for (const part of parts) {
    parent = path.join(parent, part);
    const state = await lstat(parent);
    if (!state.isDirectory() || state.isSymbolicLink()) throw new Error(`${label} parent is unsafe`);
  }
  const resolvedParent = await realpath(parent);
  const relative = path.relative(root, resolvedParent);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`${label} parent escapes the repository`);
  }
  const target = path.join(resolvedParent, leaf);
  try { await lstat(target); }
  catch (error) { if (error?.code === "ENOENT") return target; throw error; }
  throw new Error(`${label} collision: ${relativePath}`);
}

export async function verifyJoenessM4AuthorityStructuredOutputExecutionBoundary(options) {
  const data = subsetObject(
    options,
    ["repositoryRoot", "planPath", "publishedPath"],
    "authority-structured-output execution boundary options",
  );
  if (typeof data.repositoryRoot !== "string" || !path.isAbsolute(data.repositoryRoot)) {
    fail("authority-structured-output repository root must be absolute");
  }
  exactString(data.planPath, JOENESS_M4_AUTHORITY_STRUCTURED_OUTPUT_LIVE_PLAN_PATH, "authority-structured-output plan path");
  if (
    data.publishedPath !== undefined &&
    !Object.values(JOENESS_M4_AUTHORITY_STRUCTURED_OUTPUT_LIVE_OUTPUTS)
      .includes(data.publishedPath)
  ) fail("authority-structured-output published path is invalid");
  const rootState = await lstat(data.repositoryRoot);
  if (!rootState.isDirectory() || rootState.isSymbolicLink()) fail("authority-structured-output repository root must be a real directory");
  const root = await realpath(data.repositoryRoot);
  const expectedStatus = data.publishedPath === undefined
    ? ""
    : `?? ${data.publishedPath}`;
  if (
    (await gitText(root, ["status", "--porcelain=v1", "--untracked-files=all"])) !==
    expectedStatus
  ) {
    throw new Error("authority-structured-output execution worktree is dirty");
  }
  const executionHead = await gitText(root, ["rev-parse", "HEAD"]);
  commit(executionHead, "authority-structured-output execution HEAD");
  const planFile = await confinedRegularFile(root, data.planPath, "authority-structured-output live plan");
  const planBytes = await readFile(planFile);
  if (planBytes.length < 1 || planBytes.length > 32 * 1024) throw new Error("authority-structured-output live plan size is invalid");
  let plan;
  try { plan = JSON.parse(planBytes.toString("utf8")); }
  catch (cause) { throw new Error("authority-structured-output live plan JSON is malformed", { cause }); }
  validateJoenessM4AuthorityStructuredOutputLivePlan(plan);
  const support = plan.source.planImplementationCommit;
  const supportParentLine = await gitText(root, ["rev-list", "--parents", "-n", "1", support]);
  if (supportParentLine !== `${support} ${TASK_A_SUPPORT_COMMIT}`) {
    throw new Error("authority-structured-output support must be a direct single-parent child of Task A");
  }
  const supportDiff = await gitText(root, [
    "diff", "--name-status", TASK_A_SUPPORT_COMMIT, support,
  ]);
  const expectedSupportDiff = [
    `A\t${SOURCE_PATHS.authorityStructuredOutputWrapper}`,
    `A\t${LIVE_TEST_PATH}`,
  ].join("\n");
  if (supportDiff !== expectedSupportDiff) {
    throw new Error("authority-structured-output support diff must contain exactly the wrapper and test");
  }
  const parentLine = await gitText(root, ["rev-list", "--parents", "-n", "1", executionHead]);
  if (parentLine !== `${executionHead} ${support}`) {
    throw new Error("authority-structured-output execution HEAD must be a direct single-parent child of support");
  }
  const diff = await gitText(root, ["diff", "--name-status", support, executionHead]);
  if (diff !== `A\t${JOENESS_M4_AUTHORITY_STRUCTURED_OUTPUT_LIVE_PLAN_PATH}`) {
    throw new Error("authority-structured-output execution commit is not plan-only");
  }
  const committedPlan = await gitBlob(root, executionHead, data.planPath);
  if (!committedPlan.equals(planBytes)) throw new Error("authority-structured-output working plan differs from execution HEAD");
  if (await gitBlobExists(root, support, data.planPath)) throw new Error("authority-structured-output plan already exists in support");
  for (const revision of [support, executionHead]) {
    if (await gitBlobExists(root, revision, V7_ATTEMPT_INDEX_PATH)) {
      throw new Error("authority-structured-output attempt index already exists");
    }
  }
  await confinedAbsentTarget(root, V7_ATTEMPT_INDEX_PATH, "authority-structured-output attempt index");

  const predecessorExecution = await gitText(root, ["rev-list", "--parents", "-n", "1", PREDECESSOR.executionHead]);
  const predecessorPersistence = await gitText(root, ["rev-list", "--parents", "-n", "1", PREDECESSOR.persistenceCommit]);
  if (predecessorExecution !== `${PREDECESSOR.executionHead} ${PREDECESSOR.implementationCommit}`) {
    throw new Error("authority-structured-output predecessor execution lineage is invalid");
  }
  if (predecessorPersistence !== `${PREDECESSOR.persistenceCommit} ${PREDECESSOR.executionHead}`) {
    throw new Error("authority-structured-output predecessor persistence lineage is invalid");
  }
  if (!(await gitIsAncestor(root, PREDECESSOR.executionHead, support))) {
    throw new Error("authority-structured-output predecessor execution is not an ancestor of support");
  }
  if (!(await gitIsAncestor(root, PREDECESSOR.persistenceCommit, support))) {
    throw new Error("authority-structured-output predecessor persistence is not an ancestor of support");
  }
  if (await gitBlobExists(root, PREDECESSOR.implementationCommit, PREDECESSOR.plan.path)) {
    throw new Error("authority-structured-output predecessor plan must be absent at implementation");
  }
  for (const pin of [PREDECESSOR.rawArtifact, PREDECESSOR.evidenceArtifact]) {
    for (const revision of [
      PREDECESSOR.implementationCommit,
      PREDECESSOR.executionHead,
      PREDECESSOR.persistenceCommit,
      support,
      executionHead,
    ]) {
      if (await gitBlobExists(root, revision, pin.path)) {
        throw new Error("authority-structured-output predecessor absent output appeared");
      }
    }
    await confinedAbsentTarget(
      root,
      pin.path,
      "authority-structured-output predecessor absent output",
    );
  }
  for (const pin of [PREDECESSOR.blockedArtifact, PREDECESSOR.attemptIndex]) {
    for (const revision of [
      PREDECESSOR.implementationCommit,
      PREDECESSOR.executionHead,
    ]) {
      if (await gitBlobExists(root, revision, pin.path)) {
        throw new Error("authority-structured-output predecessor artifact appeared before persistence");
      }
    }
  }
  for (const [role, pin, revisions] of [
    ["plan", PREDECESSOR.plan, [PREDECESSOR.executionHead, PREDECESSOR.persistenceCommit, support, executionHead]],
    ["blockedArtifact", PREDECESSOR.blockedArtifact, [PREDECESSOR.persistenceCommit, support, executionHead]],
    ["attemptIndex", PREDECESSOR.attemptIndex, [PREDECESSOR.persistenceCommit, support, executionHead]],
  ]) {
    for (const revision of revisions) {
      const candidate = await gitBlob(root, revision, pin.path);
      if (candidate.length !== pin.bytes || sha256(candidate) !== pin.sha256) {
        throw new Error(`authority-structured-output predecessor ${role} drift`);
      }
    }
    const working = await readFile(await confinedRegularFile(root, pin.path, `authority-structured-output predecessor ${role}`));
    if (working.length !== pin.bytes || sha256(working) !== pin.sha256) {
      throw new Error(`authority-structured-output predecessor ${role} drift`);
    }
  }
  for (const [role, expectedPath] of Object.entries(SOURCE_PATHS)) {
    const pin = plan.source[role];
    const candidates = [
      await gitBlob(root, support, expectedPath),
      await gitBlob(root, executionHead, expectedPath),
      await readFile(await confinedRegularFile(root, expectedPath, `authority-structured-output source ${role}`)),
    ];
    if (candidates.some((candidate) => candidate.length !== pin.bytes || sha256(candidate) !== pin.sha256)) {
      throw new Error(`authority-structured-output source ${role} drift`);
    }
  }
  let publishedArtifact;
  for (const outputPath of Object.values(JOENESS_M4_AUTHORITY_STRUCTURED_OUTPUT_LIVE_OUTPUTS)) {
    if (await gitBlobExists(root, executionHead, outputPath)) {
      throw new Error(`authority-structured-output output is already committed: ${outputPath}`);
    }
    if (outputPath === data.publishedPath) {
      const artifactPath = await confinedRegularFile(
        root,
        outputPath,
        "authority-structured-output published artifact",
      );
      const artifact = await readFile(artifactPath);
      publishedArtifact = {
        path: outputPath,
        byteLength: artifact.length,
        sha256: sha256(artifact),
      };
    } else {
      await confinedAbsentTarget(root, outputPath, "authority-structured-output output");
    }
  }
  const [finalStatus, finalHead, planReadback] = await Promise.all([
    gitText(root, ["status", "--porcelain=v1", "--untracked-files=all"]),
    gitText(root, ["rev-parse", "HEAD"]),
    readFile(planFile),
  ]);
  if (
    finalStatus !== expectedStatus || finalHead !== executionHead ||
    !planReadback.equals(planBytes)
  ) {
    throw new Error("authority-structured-output execution boundary changed during verification");
  }
  return {
    plan,
    executionSource: {
      planImplementationCommit: support,
      executionHead,
      executionHeadParent: support,
      plan: {
        path: JOENESS_M4_AUTHORITY_STRUCTURED_OUTPUT_LIVE_PLAN_PATH,
        bytes: planBytes.length,
        sha256: sha256(planBytes),
      },
      predecessor: {
        ...PREDECESSOR,
        artifactsMatchSupportPlanAndWorking: true,
        executionHeadIsAncestorOfSupport: true,
        persistenceCommitIsAncestorOfSupport: true,
      },
      sourcePins: Object.fromEntries(
        Object.keys(SOURCE_PATHS).map((role) => [role, { ...plan.source[role] }]),
      ),
      implementationSourcesMatchSupportPlanAndWorking: true,
    },
    outputsAbsent: data.publishedPath === undefined,
    ...(publishedArtifact === undefined ? {} : { publishedArtifact }),
  };
}

export async function snapshotJoenessM4AuthorityStructuredOutputSourceConfig(options = {}) {
  const data = subsetObject(
    options,
    ["sourceCodexHome"],
    "authority-structured-output source config options",
  );
  const sourceCodexHome = data.sourceCodexHome ?? process.env.CODEX_HOME ?? path.join(homedir(), ".codex");
  if (typeof sourceCodexHome !== "string" || !path.isAbsolute(sourceCodexHome)) {
    fail("authority-structured-output source Codex home must be absolute");
  }
  const homeState = await lstat(sourceCodexHome);

  if (!homeState.isDirectory() || homeState.isSymbolicLink()) {
    throw new Error("authority-structured-output source Codex home must be a real directory");
  }
  const resolvedHome = await realpath(sourceCodexHome);
  const configPath = path.join(resolvedHome, "config.toml");
  const before = await lstat(configPath);
  if (!before.isFile() || before.isSymbolicLink()) {
    throw new Error("authority-structured-output source config must be a regular file");
  }
  const resolvedConfig = await realpath(configPath);
  const relative = path.relative(resolvedHome, resolvedConfig);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error("authority-structured-output source config escapes its home");
  }
  const bytes = await readFile(resolvedConfig);
  assertEvaluationSourceConfigSafe(bytes);
  const after = await lstat(configPath);
  const readback = await readFile(resolvedConfig);
  const final = await lstat(configPath);
  if (
    !after.isFile() || after.isSymbolicLink() ||
    !final.isFile() || final.isSymbolicLink() ||
    before.size !== after.size || after.size !== bytes.length || final.size !== readback.length ||
    !bytes.equals(readback)
  ) throw new Error("authority-structured-output source config changed during snapshot");
  return { bytes: bytes.length, sha256: sha256(bytes) };
}

async function pathIsAbsent(target) {
  try { await lstat(target); return false; }
  catch (error) { if (error?.code === "ENOENT") return true; throw error; }
}

function comparableResolvedPath(value) {
  const resolved = path.resolve(value);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

function directoryIdentity(state) {
  return {
    dev: state.dev,
    ino: state.ino,
    birthtimeNs: state.birthtimeNs,
  };
}

function sameDirectoryIdentity(left, right) {
  return (
    left.dev === right.dev &&
    left.ino === right.ino &&
    left.birthtimeNs === right.birthtimeNs
  );
}

async function captureOwnedDirectory(target, expectedPath, label) {
  if (typeof target !== "string" || !path.isAbsolute(target)) fail(`${label} path is invalid`);
  const state = await lstat(target, { bigint: true });
  if (!state.isDirectory() || state.isSymbolicLink()) throw new Error(`${label} is not a real directory`);
  const resolvedPath = await realpath(target);
  if (comparableResolvedPath(resolvedPath) !== comparableResolvedPath(expectedPath)) {
    throw new Error(`${label} resolves outside its exact owned path`);
  }
  return {
    resolvedPath,
    ...directoryIdentity(state),
  };
}

async function requireOwnedDirectory(target, ticket, label) {
  if (ticket === null || ticket === undefined) throw new Error(`${label} ownership identity is unavailable`);
  const current = await captureOwnedDirectory(target, ticket.resolvedPath, label);
  if (!sameDirectoryIdentity(current, ticket)) throw new Error(`${label} ownership identity changed`);
  return current;
}

async function assertUnownedIsolatedTargetAbsent({
  sourceHomeTicket,
  isolatedParent,
  isolatedHome,
}) {
  await requireOwnedDirectory(sourceHomeTicket.resolvedPath, sourceHomeTicket, "authority-structured-output source home");
  let parentState;
  try { parentState = await lstat(isolatedParent, { bigint: true }); }
  catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
  if (!parentState.isDirectory() || parentState.isSymbolicLink()) {
    throw new Error("authority-structured-output isolated parent is unsafe; inferred target was preserved");
  }
  const resolvedParent = await realpath(isolatedParent);
  if (comparableResolvedPath(resolvedParent) !== comparableResolvedPath(isolatedParent)) {
    throw new Error("authority-structured-output isolated parent escapes the source home; inferred target was preserved");
  }
  if (comparableResolvedPath(path.dirname(resolvedParent)) !== comparableResolvedPath(sourceHomeTicket.resolvedPath)) {
    throw new Error("authority-structured-output isolated parent is not confined to the source home");
  }
  try { await lstat(isolatedHome, { bigint: true }); }
  catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
  throw new Error("authority-structured-output isolated home ownership is unavailable; existing target was preserved");
}

async function removeOwnedRunRoot(runRoot, runParent, runId, runRootTicket, runParentTicket) {
  if (runId !== JOENESS_M4_AUTHORITY_STRUCTURED_OUTPUT_LIVE_RUN_ID) {
    throw new Error("authority-structured-output run-root identity is invalid");
  }
  const expected = path.join(path.resolve(runParent), `joewrks-eval-${runId}`);
  const actual = path.resolve(runRoot);
  if (actual !== expected) throw new Error("authority-structured-output run-root cleanup path is invalid");
  await requireOwnedDirectory(runParent, runParentTicket, "authority-structured-output run parent");
  await requireOwnedDirectory(actual, runRootTicket, "authority-structured-output run root");
  await rm(actual, { recursive: true, force: false });
}

function confirmedAppServerCloseFromError(error) {
  const ticketProperty = diagnosticOwnData(error, "ticketEvidence");
  if (ticketProperty.state !== "data") return false;
  const appServerProperty = diagnosticOwnData(ticketProperty.value, "appServer");
  if (appServerProperty.state !== "data") return false;
  const closeProperty = diagnosticOwnData(appServerProperty.value, "processCloseConfirmed");
  return closeProperty.state === "data" && closeProperty.value === true;
}

export async function createJoenessM4AuthorityStructuredOutputDefaultRuntime(options) {
  const data = exactObject(options, [
    "plan", "repositoryRoot", "sourceCodexHome", "runParent", "cleanupState", "operations",
  ], "authority-structured-output default runtime options");
  validateJoenessM4AuthorityStructuredOutputLivePlan(data.plan);
  const runId = data.plan.id;
  const codexVersion = data.plan.runtime.codexVersion;
  if (typeof data.repositoryRoot !== "string" || !path.isAbsolute(data.repositoryRoot)) {
    fail("authority-structured-output repository root must be absolute");
  }
  if (typeof data.sourceCodexHome !== "string" || !path.isAbsolute(data.sourceCodexHome)) {
    fail("authority-structured-output source Codex home must be absolute");
  }
  if (typeof data.runParent !== "string" || !path.isAbsolute(data.runParent)) {
    fail("authority-structured-output run parent must be absolute");
  }
  if (
    data.cleanupState === null ||
    typeof data.cleanupState !== "object" ||
    utilTypes.isProxy(data.cleanupState) ||
    Array.isArray(data.cleanupState)
  ) fail("authority-structured-output cleanup state must be an object");
  const injected = exactObject(data.operations, [
    "createExclusiveRunRoot", "prepareRuntime", "openAppServer",
    "removeIsolatedCodexHome", "removeRunRoot",
  ], "authority-structured-output runtime operations");
  const operations = {
    createExclusiveRunRoot: injected.createExclusiveRunRoot ?? createExclusiveRunRoot,
    prepareRuntime: injected.prepareRuntime ?? prepareRuntime,
    openAppServer: injected.openAppServer ?? openAppServer,
    removeIsolatedCodexHome: injected.removeIsolatedCodexHome ?? removeIsolatedCodexHome,
    removeRunRoot: injected.removeRunRoot ?? removeOwnedRunRoot,
  };
  for (const [name, operation] of Object.entries(operations)) {
    if (typeof operation !== "function") fail(`authority-structured-output runtime operation ${name} is invalid`);
  }
  const sourceHomeTicket = await captureOwnedDirectory(
    data.sourceCodexHome,
    data.sourceCodexHome,
    "authority-structured-output source home",
  );
  const runParentTicket = await captureOwnedDirectory(
    data.runParent,
    data.runParent,
    "authority-structured-output run parent",
  );
  const sourceCodexHome = sourceHomeTicket.resolvedPath;
  const runParent = runParentTicket.resolvedPath;
  if (operations.prepareRuntime === prepareRuntime) {
    const collectorHome = process.env.CODEX_HOME ?? path.join(homedir(), ".codex");
    const [selected, actual] = await Promise.all([
      realpath(sourceCodexHome),
      realpath(collectorHome),
    ]);
    if (selected !== actual) throw new Error("authority-structured-output source home differs from collector source home");
  }
  await requireOwnedDirectory(sourceCodexHome, sourceHomeTicket, "authority-structured-output source home");
  await requireOwnedDirectory(runParent, runParentTicket, "authority-structured-output run parent");
  const sourceConfigBefore = await snapshotJoenessM4AuthorityStructuredOutputSourceConfig({
    sourceCodexHome,
  });
  await requireOwnedDirectory(sourceCodexHome, sourceHomeTicket, "authority-structured-output source home");
  await requireOwnedDirectory(runParent, runParentTicket, "authority-structured-output run parent");
  data.cleanupState.sourceConfigBefore = Object.freeze({ ...sourceConfigBefore });
  let runRoot;
  let runRootTicket = null;
  let prepared;
  let isolatedParentTicket = null;
  let isolatedHomeTicket = null;
  let session;
  let openAttempted = false;
  const readSourceConfig = () => snapshotJoenessM4AuthorityStructuredOutputSourceConfig({
    sourceCodexHome,
  });
  const cleanupOwned = async (launchCount, closeConfirmedCount) => {
    const isolatedParent = path.join(sourceCodexHome, ".eval-runtime");
    const isolatedHome = isolatedHomeTicket?.resolvedPath ?? path.join(
      isolatedParent,
      `${path.basename(runRoot)}-controller-codex-home`,
    );
    const errors = [];
    if (isolatedHomeTicket === null) {
      try {
        await assertUnownedIsolatedTargetAbsent({
          sourceHomeTicket,
          isolatedParent,
          isolatedHome,
        });
      } catch (error) { errors.push(error); }
    } else {
      try {
        await requireOwnedDirectory(sourceCodexHome, sourceHomeTicket, "authority-structured-output source home");
        await requireOwnedDirectory(isolatedParent, isolatedParentTicket, "authority-structured-output isolated parent");
        await requireOwnedDirectory(isolatedHome, isolatedHomeTicket, "authority-structured-output isolated home");
        await operations.removeIsolatedCodexHome(
          runRoot,
          isolatedHome,
          isolatedParent,
          isolatedHomeTicket,
          isolatedParentTicket,
        );
      } catch (error) { errors.push(error); }
      try {
        if (!(await pathIsAbsent(isolatedHome))) {
          throw new Error("authority-structured-output isolated home readback is not absent");
        }
      } catch (error) { errors.push(error); }
    }
    try {
      await requireOwnedDirectory(runParent, runParentTicket, "authority-structured-output run parent");
      await requireOwnedDirectory(runRoot, runRootTicket, "authority-structured-output run root");
      await operations.removeRunRoot(
        runRoot,
        runParent,
        runId,
        runRootTicket,
        runParentTicket,
      );
    }
    catch (error) { errors.push(error); }
    try {
      if (!(await pathIsAbsent(runRoot))) throw new Error("authority-structured-output run-root readback is not absent");
    } catch (error) { errors.push(error); }
    let sourceConfigAfter;
    try {
      await requireOwnedDirectory(sourceCodexHome, sourceHomeTicket, "authority-structured-output source home");
      sourceConfigAfter = await readSourceConfig();
      await requireOwnedDirectory(sourceCodexHome, sourceHomeTicket, "authority-structured-output source home");
      if (
        sourceConfigAfter.bytes !== sourceConfigBefore.bytes ||
        sourceConfigAfter.sha256 !== sourceConfigBefore.sha256
      ) throw new Error("authority-structured-output source config changed during runtime");
    } catch (error) { errors.push(error); }
    if (errors.length > 0) {
      throw new AggregateError(errors, "authority-structured-output owned runtime cleanup was not fully safe", {
        cause: errors[0],
      });
    }
    data.cleanupState.sourceConfigAfter = sourceConfigAfter;
    data.cleanupState.receipt = {
      appServerLaunchCount: launchCount,
      appServerCloseConfirmedCount: closeConfirmedCount,
      remainingOwnedProcessCount: 0,
      isolatedCodexHomeReadback: "absent",
      runRootReadback: "absent",
    };
  };
  try {
    await requireOwnedDirectory(runParent, runParentTicket, "authority-structured-output run parent");
    runRoot = await operations.createExclusiveRunRoot(runId, runParent);
    const expectedRunRoot = path.join(runParent, `joewrks-eval-${runId}`);
    runRootTicket = await captureOwnedDirectory(
      runRoot,
      expectedRunRoot,
      "authority-structured-output acquired run root",
    );
    runRoot = runRootTicket.resolvedPath;
    await requireOwnedDirectory(runParent, runParentTicket, "authority-structured-output run parent");
    await requireOwnedDirectory(sourceCodexHome, sourceHomeTicket, "authority-structured-output source home");
    await requireOwnedDirectory(runRoot, runRootTicket, "authority-structured-output acquired run root");
    await requireOwnedDirectory(runParent, runParentTicket, "authority-structured-output run parent");
    prepared = await operations.prepareRuntime(runRoot, {
      expectedCodexVersion: codexVersion,
    });
    await requireOwnedDirectory(sourceCodexHome, sourceHomeTicket, "authority-structured-output source home");
    await requireOwnedDirectory(runParent, runParentTicket, "authority-structured-output run parent");
    await requireOwnedDirectory(runRoot, runRootTicket, "authority-structured-output acquired run root");
    const isolatedProperty = diagnosticOwnData(prepared, "isolatedCodexHome");
    if (isolatedProperty.state !== "data" || typeof isolatedProperty.value !== "string") {
      throw new Error("authority-structured-output prepared isolated home is unavailable");
    }
    const isolatedParent = path.join(sourceCodexHome, ".eval-runtime");
    const expectedIsolatedHome = path.join(
      isolatedParent,
      `${path.basename(runRoot)}-controller-codex-home`,
    );
    await requireOwnedDirectory(sourceCodexHome, sourceHomeTicket, "authority-structured-output source home");
    isolatedParentTicket = await captureOwnedDirectory(
      isolatedParent,
      isolatedParent,
      "authority-structured-output acquired isolated parent",
    );
    if (
      comparableResolvedPath(path.dirname(isolatedParentTicket.resolvedPath)) !==
      comparableResolvedPath(sourceHomeTicket.resolvedPath)
    ) throw new Error("authority-structured-output isolated parent is not confined to the source home");
    isolatedHomeTicket = await captureOwnedDirectory(
      isolatedProperty.value,
      expectedIsolatedHome,
      "authority-structured-output acquired isolated home",
    );
    await requireOwnedDirectory(sourceCodexHome, sourceHomeTicket, "authority-structured-output source home");
    await requireOwnedDirectory(runParent, runParentTicket, "authority-structured-output run parent");
    await requireOwnedDirectory(runRoot, runRootTicket, "authority-structured-output acquired run root");
    await requireOwnedDirectory(isolatedParent, isolatedParentTicket, "authority-structured-output acquired isolated parent");
    await requireOwnedDirectory(isolatedHomeTicket.resolvedPath, isolatedHomeTicket, "authority-structured-output acquired isolated home");
    openAttempted = true;
    session = await operations.openAppServer(prepared);
  } catch (error) {
    const closeConfirmed = confirmedAppServerCloseFromError(error);
    if (runRoot && (!openAttempted || closeConfirmed)) {
      try { await cleanupOwned(openAttempted ? 1 : 0, closeConfirmed ? 1 : 0); }
      catch (cleanupError) {
        throw new AggregateError([error, cleanupError], "authority-structured-output partial runtime cleanup failed", {
          cause: error,
        });
      }
    }
    throw error;
  }
  let finishPromise;
  return {
    session,
    sourceConfigBefore: Object.freeze({ ...sourceConfigBefore }),
    readSourceConfig,
    async finish(safe) {
      if (safe !== true) fail("authority-structured-output runtime finish requires safe cleanup");
      finishPromise ??= (async () => {
        let closeError = null;
        try { await session.close(); } catch (error) { closeError = error; }
        if (session.processCloseConfirmed !== true) {
          if (closeError) throw closeError;
          throw new Error("authority-structured-output app server close is unconfirmed");
        }
        await cleanupOwned(1, 1);
        if (closeError) throw closeError;
        if (session.processExitCode !== 0) throw new Error("authority-structured-output app server exit is not zero");
      })();
      return finishPromise;
    },
  };
}


function tryRebuildFreshFailure(value) {
  const data = diagnosticExactObject(value, [
    "schemaVersion", "provenance", "runnerStage", "pinnedRequest", "evidenceState",
    "lifecycle", "eventCounts", "normalizerBlocker", "runtimeErrorOrigin", "blockers",
    "appServerExit", "primaryCauseKind", "retention",
  ]);
  if (
    data === null ||
    data.schemaVersion !== 6 ||
    data.provenance !==
      "authority-structured-output-runner-observed-default-fresh-adapter-rejection" ||
    data.runnerStage !== "fresh-turn-rejected" ||
    data.evidenceState !== "retained"
  ) return null;
  const pinnedRequest = diagnosticExactObject(
    data.pinnedRequest,
    ["descriptorCount", "byteLength", "sha256"],
  );
  const lifecycle = diagnosticExactObject(data.lifecycle, [
    "threadStart", "turnStart", "terminal", "terminalCountState",
  ]);
  const eventCounts = diagnosticExactObject(data.eventCounts, [
    "observed", "retained", "retainedOverLimit",
  ]);
  const normalizer = diagnosticExactObject(
    data.normalizerBlocker,
    ["provenance", "classification"],
  );
  const origin = diagnosticExactObject(
    data.runtimeErrorOrigin,
    ["provenance", "classification"],
  );
  const blockers = diagnosticExactObject(data.blockers, [
    "count", "codes", "unclassifiedCount",
  ]);
  const retentionKeys = [
    "rawOutputPersisted", "rawEventsPersisted", "threadTurnProcessIdentifiersPersisted",
    "absolutePathsPersisted", "rawEventOrOutputDigestsPersisted", "rawStderrPersisted",
    "configContentsPersisted",
  ];
  const retention = diagnosticExactObject(data.retention, retentionKeys);
  const codes = blockers === null
    ? null
    : diagnosticArray(blockers.codes, FRESH_BLOCKER_CODES.length);
  if (
    pinnedRequest === null ||
    lifecycle === null ||
    eventCounts === null ||
    normalizer === null ||
    origin === null ||
    blockers === null ||
    retention === null ||
    codes === null
  ) return null;
  if (
    pinnedRequest.descriptorCount !== INPUT_CONTRACT.descriptorCount ||
    pinnedRequest.byteLength !== INPUT_CONTRACT.canonicalRequest.bytes ||
    pinnedRequest.sha256 !== INPUT_CONTRACT.canonicalRequest.sha256
  ) return null;
  if (
    !["observed", "not-observed"].includes(lifecycle.threadStart) ||
    !["observed", "not-observed"].includes(lifecycle.turnStart) ||
    !["completed", "missing", "non-completed", "ambiguous"].includes(lifecycle.terminal) ||
    !["zero", "one", "multiple"].includes(lifecycle.terminalCountState) ||
    (lifecycle.turnStart === "observed" && lifecycle.threadStart !== "observed") ||
    (lifecycle.terminal !== "missing" && lifecycle.turnStart !== "observed") ||
    (lifecycle.terminal === "missing" && lifecycle.terminalCountState !== "zero") ||
    (["completed", "non-completed"].includes(lifecycle.terminal) &&
      lifecycle.terminalCountState !== "one") ||
    (lifecycle.terminal === "ambiguous" && lifecycle.terminalCountState !== "multiple")
  ) return null;
  if (
    !Number.isSafeInteger(eventCounts.observed) ||
    eventCounts.observed < 0 ||
    !Number.isSafeInteger(eventCounts.retained) ||
    eventCounts.retained < 0 ||
    eventCounts.retained > eventCounts.observed ||
    eventCounts.retainedOverLimit !== (eventCounts.retained > 512)
  ) return null;
  if (

    normalizer.provenance !== "adapter-normalization-fixed-enum" ||
    !FRESH_NORMALIZER_CLASSIFICATIONS.includes(normalizer.classification) ||
    origin.provenance !==
      "runner-projected-default-adapter-retained-events-fixed-enum" ||
    !RUNTIME_ERROR_ORIGINS.includes(origin.classification)
  ) return null;
  let previousCodeIndex = -1;
  for (const code of codes) {
    const index = FRESH_BLOCKER_CODES.indexOf(code);
    if (index <= previousCodeIndex) return null;
    previousCodeIndex = index;
  }
  if (
    !Number.isSafeInteger(blockers.count) ||
    blockers.count < 0 ||
    blockers.count > 64 ||
    !Number.isSafeInteger(blockers.unclassifiedCount) ||
    blockers.unclassifiedCount < 0 ||
    blockers.count !== codes.length + blockers.unclassifiedCount ||
    !["zero", "nonzero", "unverified"].includes(data.appServerExit) ||
    !["syntax-error", "type-error", "aggregate-error", "error", "unverified"].includes(
      data.primaryCauseKind,
    ) ||
    retentionKeys.some((key) => retention[key] !== false)
  ) return null;
  const rebuilt = {
    schemaVersion: 6,
    provenance: "authority-structured-output-runner-observed-default-fresh-adapter-rejection",
    runnerStage: "fresh-turn-rejected",
    pinnedRequest: {
      descriptorCount: INPUT_CONTRACT.descriptorCount,
      byteLength: INPUT_CONTRACT.canonicalRequest.bytes,
      sha256: INPUT_CONTRACT.canonicalRequest.sha256,
    },
    evidenceState: "retained",
    lifecycle: { ...lifecycle },
    eventCounts: { ...eventCounts },
    normalizerBlocker: {
      provenance: "adapter-normalization-fixed-enum",
      classification: normalizer.classification,
    },
    runtimeErrorOrigin: {
      provenance: "runner-projected-default-adapter-retained-events-fixed-enum",
      classification: origin.classification,
    },
    blockers: {
      count: blockers.count,
      codes,
      unclassifiedCount: blockers.unclassifiedCount,
    },
    appServerExit: data.appServerExit,
    primaryCauseKind: data.primaryCauseKind,
    retention: Object.fromEntries(retentionKeys.map((key) => [key, false])),
  };
  return Buffer.byteLength(JSON.stringify(rebuilt)) <= 3072 ? rebuilt : null;
}

export function rebuildJoenessM4AuthorityStructuredOutputDelegatedBlockedReceipt(value) {
  const required = ["schemaVersion", "status", "phase", "safeCleanup", "cause"];
  let hasFreshFailure = false;
  let data = diagnosticExactObject(value, required);
  if (data === null) {
    data = diagnosticExactObject(value, [...required, "freshFailure"]);
    hasFreshFailure = data !== null;
  }
  if (data === null) fail("authority-structured-output delegated receipt is incomplete or unsafe");
  let cause = diagnosticExactObject(data.cause, ["category"]);
  let causeHasResult = false;
  if (cause === null) {
    cause = diagnosticExactObject(data.cause, ["category", "result"]);
    causeHasResult = cause !== null;
  }
  if (
    data.schemaVersion !== 1 ||
    data.status !== "blocked" ||
    data.safeCleanup !== true ||
    !["post-runtime-validation", "runtime-factory"].includes(data.phase)
  ) fail("authority-structured-output delegated receipt contract is invalid");
  const causeIsValid = cause !== null && (
    (data.phase === "runtime-factory" &&
      cause.category === "runtime-factory-failed" && !causeHasResult) ||
    (data.phase === "post-runtime-validation" &&
      ["contract-validation", "evaluation-failed"].includes(cause.category) &&
      !causeHasResult) ||
    (data.phase === "post-runtime-validation" &&
      cause.category === "structured-output-contract" &&
      causeHasResult &&
      cause.result === "BLOCKED_STRUCTURED_OUTPUT_CONTRACT")
  );
  if (!causeIsValid) {
    if (data.phase !== "post-runtime-validation") {
      fail("authority-structured-output delegated receipt cause is invalid");
    }
    return {
      schemaVersion: 1,
      status: "blocked",
      phase: "post-runtime-validation",
      safeCleanup: true,
      cause: { category: "evaluation-failed" },
    };
  }
  const rebuilt = {
    schemaVersion: 1,
    status: "blocked",
    phase: data.phase,
    safeCleanup: true,
    cause: {
      category: cause.category,
      ...(causeHasResult ? { result: cause.result } : {}),
    },
  };
  if (data.phase !== "post-runtime-validation") return rebuilt;
  if (!hasFreshFailure) return rebuilt;
  const fresh = tryRebuildFreshFailure(data.freshFailure);
  if (fresh !== null) rebuilt.freshFailure = fresh;
  return rebuilt;
}

export function rebuildJoenessM4AuthorityStructuredOutputDelegatedEvidence(value) {
  const data = diagnosticExactObject(value, [
    "schemaVersion", "id", "assessment", "input", "semanticObservation",
    "unauthorizedActionCoverage", "artifactAuthorship", "runtime",
    "sourceConfigReadback", "runtimeCleanup", "privacy",
  ]);
  if (
    data === null ||
    data.schemaVersion !== 1 ||
    data.id !== JOENESS_M4_AUTHORITY_STRUCTURED_OUTPUT_ID
  ) return undefined;
  const assessment = diagnosticExactObject(data.assessment, [
    "status", "scope", "structuredOutputSemantics", "serializationCanonicality",
    "m4FixtureBehavior", "m4Overall", "projectTaskOverExternalSkill",
    "directUserOverProjectAuthority", "installedPluginActivation",
    "superpowersCompatibility", "promotionPass",
  ]);
  const input = diagnosticExactObject(data.input, [
    "manifest", "descriptorCount", "combinedInputBytes", "descriptors",
    "canonicalRequest", "descriptorRequestSha256",
  ]);
  const observation = diagnosticExactObject(data.semanticObservation, [
    "schemaVersion", "provenance", "stage", "result", "mismatchCodes",
    "mismatchCount", "rawOutputInspected", "rawOutputPersisted",
    "rawOutputDigestPersisted", "structuredOutputValuePersisted",
    "serializationCanonicality",
  ]);
  const coverage = diagnosticExactObject(data.unauthorizedActionCoverage, [
    "items", "byteLength", "sha256",
  ]);
  const runtime = diagnosticExactObject(data.runtime, [
    "freshTurnCount", "retryCount", "dynamicToolCount", "externalToolEvidenceCount",
    "projectDocs", "installedPluginActivation",
  ]);
  const privacy = diagnosticExactObject(data.privacy, STRUCTURED_PRIVACY_KEYS);
  if (
    assessment === null || input === null || observation === null ||
    coverage === null || runtime === null || privacy === null
  ) return undefined;
  const manifest = diagnosticExactObject(input.manifest, ["id", "byteLength", "sha256"]);
  const canonicalRequest = diagnosticExactObject(
    input.canonicalRequest,
    ["byteLength", "sha256"],
  );
  const descriptors = diagnosticArray(input.descriptors, INPUT_DESCRIPTORS.length);
  const codes = diagnosticArray(
    observation.mismatchCodes,
    SEMANTIC_MISMATCH_CODES.length,
  );
  const actions = diagnosticArray(coverage.items, UNAUTHORIZED_ACTIONS.length);
  if (
    manifest === null || canonicalRequest === null || descriptors === null ||
    descriptors.length !== INPUT_DESCRIPTORS.length || codes === null ||
    actions === null || actions.length !== UNAUTHORIZED_ACTIONS.length
  ) return undefined;
  const rebuiltDescriptors = [];
  for (let index = 0; index < INPUT_DESCRIPTORS.length; index += 1) {
    const descriptor = diagnosticExactObject(
      descriptors[index],
      ["id", "index", "type", "byteLength", "sha256"],
    );
    const expected = INPUT_DESCRIPTORS[index];
    if (
      descriptor === null || descriptor.id !== expected.id ||
      descriptor.index !== expected.index || descriptor.type !== expected.type ||
      descriptor.byteLength !== expected.byteLength ||
      descriptor.sha256 !== expected.sha256
    ) return undefined;
    rebuiltDescriptors.push({ ...expected });
  }
  for (let index = 0; index < UNAUTHORIZED_ACTIONS.length; index += 1) {
    if (actions[index] !== UNAUTHORIZED_ACTIONS[index]) return undefined;
  }
  let previousCodeIndex = -1;
  for (const code of codes) {
    const codeIndex = SEMANTIC_MISMATCH_CODES.indexOf(code);
    if (codeIndex <= previousCodeIndex) return undefined;
    previousCodeIndex = codeIndex;
  }
  const pass = assessment.status === "PASS";
  const failStatus = assessment.status === "FAIL";
  if (
    (!pass && !failStatus) ||
    assessment.scope !==
      "pinned-content-authentic-adapter-structured-output-minimal-authority-behavior" ||
    assessment.structuredOutputSemantics !==
      (pass ? "PASS-PINNED-FIXTURE" : "FAIL-PINNED-FIXTURE") ||
    assessment.serializationCanonicality !== "NOT-ASSESSED" ||
    assessment.m4FixtureBehavior !==
      (pass
        ? "PASS-PINNED-STRUCTURED-OUTPUT-ONLY"
        : "FAIL-PINNED-STRUCTURED-OUTPUT-ONLY") ||
    assessment.m4Overall !== "UNVALIDATED" ||
    assessment.projectTaskOverExternalSkill !==
      (pass ? "VERIFIED-PINNED-STRUCTURED-OUTPUT-ONLY" : "UNVALIDATED") ||
    assessment.directUserOverProjectAuthority !== "NOT-SEPARATELY-EXERCISED" ||
    assessment.installedPluginActivation !== "UNVERIFIED" ||
    assessment.superpowersCompatibility !== "UNVERIFIED" ||
    assessment.promotionPass !== false ||
    observation.schemaVersion !== 1 ||
    observation.provenance !==
      "runner-owned-classification-of-authentic-default-fresh-adapter-structured-output" ||
    observation.stage !== "minimal-authority-behavior-structured-output-validation" ||
    observation.result !==
      (pass ? "PASS-PINNED-FIXTURE" : "FAIL-PINNED-FIXTURE") ||
    observation.mismatchCount !== codes.length ||
    (pass ? codes.length !== 0 : codes.length < 1) ||
    observation.rawOutputInspected !== false ||
    observation.rawOutputPersisted !== false ||
    observation.rawOutputDigestPersisted !== false ||
    observation.structuredOutputValuePersisted !== false ||
    observation.serializationCanonicality !== "NOT-ASSESSED" ||
    manifest.id !== INPUT_CONTRACT.fixtureId ||
    manifest.byteLength !== INPUT_CONTRACT.manifest.bytes ||
    manifest.sha256 !== INPUT_CONTRACT.manifest.sha256 ||
    input.descriptorCount !== INPUT_CONTRACT.descriptorCount ||
    input.combinedInputBytes !== INPUT_CONTRACT.combinedInputBytes ||
    canonicalRequest.byteLength !== INPUT_CONTRACT.canonicalRequest.bytes ||
    canonicalRequest.sha256 !== INPUT_CONTRACT.canonicalRequest.sha256 ||
    input.descriptorRequestSha256 !== INPUT_CONTRACT.descriptorRequestSha256 ||
    coverage.byteLength !== INPUT_CONTRACT.unauthorizedActionCoverage.bytes ||
    coverage.sha256 !== INPUT_CONTRACT.unauthorizedActionCoverage.sha256 ||
    data.artifactAuthorship !==
      "HARNESS_EVIDENCE_NOT_MODEL_AUTHORED_PROJECT_ARTIFACT" ||
    runtime.freshTurnCount !== 1 || runtime.retryCount !== 0 ||
    runtime.dynamicToolCount !== 0 || runtime.externalToolEvidenceCount !== 0 ||
    runtime.projectDocs !== "DISABLED" ||
    runtime.installedPluginActivation !== "UNVERIFIED" ||
    data.sourceConfigReadback !== "UNCHANGED" || data.runtimeCleanup !== "SAFE" ||
    STRUCTURED_PRIVACY_KEYS.some((key) => privacy[key] !== false)
  ) return undefined;
  return {
    schemaVersion: 1,
    id: JOENESS_M4_AUTHORITY_STRUCTURED_OUTPUT_ID,
    assessment: {
      status: pass ? "PASS" : "FAIL",
      scope:
        "pinned-content-authentic-adapter-structured-output-minimal-authority-behavior",
      structuredOutputSemantics: pass
        ? "PASS-PINNED-FIXTURE"
        : "FAIL-PINNED-FIXTURE",
      serializationCanonicality: "NOT-ASSESSED",
      m4FixtureBehavior: pass
        ? "PASS-PINNED-STRUCTURED-OUTPUT-ONLY"
        : "FAIL-PINNED-STRUCTURED-OUTPUT-ONLY",
      m4Overall: "UNVALIDATED",
      projectTaskOverExternalSkill: pass
        ? "VERIFIED-PINNED-STRUCTURED-OUTPUT-ONLY"
        : "UNVALIDATED",
      directUserOverProjectAuthority: "NOT-SEPARATELY-EXERCISED",
      installedPluginActivation: "UNVERIFIED",
      superpowersCompatibility: "UNVERIFIED",
      promotionPass: false,
    },
    input: {
      manifest: {
        id: INPUT_CONTRACT.fixtureId,
        byteLength: INPUT_CONTRACT.manifest.bytes,
        sha256: INPUT_CONTRACT.manifest.sha256,
      },
      descriptorCount: INPUT_CONTRACT.descriptorCount,
      combinedInputBytes: INPUT_CONTRACT.combinedInputBytes,
      descriptors: rebuiltDescriptors,
      canonicalRequest: {
        byteLength: INPUT_CONTRACT.canonicalRequest.bytes,
        sha256: INPUT_CONTRACT.canonicalRequest.sha256,
      },
      descriptorRequestSha256: INPUT_CONTRACT.descriptorRequestSha256,
    },
    semanticObservation: {
      schemaVersion: 1,
      provenance:
        "runner-owned-classification-of-authentic-default-fresh-adapter-structured-output",
      stage: "minimal-authority-behavior-structured-output-validation",
      result: pass ? "PASS-PINNED-FIXTURE" : "FAIL-PINNED-FIXTURE",
      mismatchCodes: [...codes],
      mismatchCount: codes.length,
      rawOutputInspected: false,
      rawOutputPersisted: false,
      rawOutputDigestPersisted: false,
      structuredOutputValuePersisted: false,
      serializationCanonicality: "NOT-ASSESSED",
    },
    unauthorizedActionCoverage: {
      items: [...UNAUTHORIZED_ACTIONS],
      byteLength: INPUT_CONTRACT.unauthorizedActionCoverage.bytes,
      sha256: INPUT_CONTRACT.unauthorizedActionCoverage.sha256,
    },
    artifactAuthorship: "HARNESS_EVIDENCE_NOT_MODEL_AUTHORED_PROJECT_ARTIFACT",
    runtime: {
      freshTurnCount: 1,
      retryCount: 0,
      dynamicToolCount: 0,
      externalToolEvidenceCount: 0,
      projectDocs: "DISABLED",
      installedPluginActivation: "UNVERIFIED",
    },
    sourceConfigReadback: "UNCHANGED",
    runtimeCleanup: "SAFE",
    privacy: Object.fromEntries(STRUCTURED_PRIVACY_KEYS.map((key) => [key, false])),
  };
}

function snapshotExecutionBoundary(value) {
  const data = exactObject(value, ["plan", "executionSource", "outputsAbsent"], "authority-structured-output boundary receipt");
  const plan = cloneSafeData(
    validateJoenessM4AuthorityStructuredOutputLivePlan(data.plan),
    "authority-structured-output boundary plan",
  );
  if (data.outputsAbsent !== true) fail("authority-structured-output boundary outputs must be absent");
  const source = exactObject(data.executionSource, [
    "planImplementationCommit", "executionHead", "executionHeadParent", "plan",
    "predecessor", "sourcePins", "implementationSourcesMatchSupportPlanAndWorking",
  ], "authority-structured-output execution source");
  commit(source.planImplementationCommit, "authority-structured-output execution source support");
  commit(source.executionHead, "authority-structured-output execution source head");
  commit(source.executionHeadParent, "authority-structured-output execution source parent");
  if (
    source.planImplementationCommit !== plan.source.planImplementationCommit ||
    source.executionHeadParent !== source.planImplementationCommit ||
    source.executionHead === source.planImplementationCommit ||
    source.implementationSourcesMatchSupportPlanAndWorking !== true
  ) fail("authority-structured-output execution source lineage is invalid");
  const planTuple = digestTuple(
    source.plan,
    JOENESS_M4_AUTHORITY_STRUCTURED_OUTPUT_LIVE_PLAN_PATH,
    "authority-structured-output execution plan tuple",
  );
  const predecessor = exactObject(source.predecessor, [
    "id", "implementationCommit", "executionHead", "persistenceCommit", "plan",
    "rawArtifact", "evidenceArtifact", "blockedArtifact", "attemptIndex",
    "sameCommandRetryAuthorized",
    "artifactsMatchSupportPlanAndWorking", "executionHeadIsAncestorOfSupport",
    "persistenceCommitIsAncestorOfSupport",
  ], "authority-structured-output execution predecessor");
  for (const key of ["id", "implementationCommit", "executionHead", "persistenceCommit"]) {
    exactString(predecessor[key], PREDECESSOR[key], `authority-structured-output execution predecessor.${key}`);
  }
  equalTuple(predecessor.plan, PREDECESSOR.plan, "authority-structured-output execution predecessor.plan");
  equalExactObject(
    predecessor.rawArtifact,
    PREDECESSOR.rawArtifact,
    "authority-structured-output execution predecessor.rawArtifact",
  );
  equalExactObject(
    predecessor.evidenceArtifact,
    PREDECESSOR.evidenceArtifact,
    "authority-structured-output execution predecessor.evidenceArtifact",
  );
  equalTuple(
    predecessor.blockedArtifact,
    PREDECESSOR.blockedArtifact,
    "authority-structured-output execution predecessor.blockedArtifact",
  );
  equalTuple(
    predecessor.attemptIndex,
    PREDECESSOR.attemptIndex,
    "authority-structured-output execution predecessor.attemptIndex",
  );
  if (
    predecessor.sameCommandRetryAuthorized !== false ||
    predecessor.artifactsMatchSupportPlanAndWorking !== true ||
    predecessor.executionHeadIsAncestorOfSupport !== true ||
    predecessor.persistenceCommitIsAncestorOfSupport !== true
  ) fail("authority-structured-output execution predecessor state is invalid");
  const sourcePinsData = exactOrderedObject(
    source.sourcePins,
    Object.keys(SOURCE_PATHS),
    "authority-structured-output execution source pins",
  );
  const sourcePins = {};
  for (const [role, expectedPath] of Object.entries(SOURCE_PATHS)) {
    const pin = digestTuple(
      sourcePinsData[role],
      expectedPath,
      `authority-structured-output execution source pin.${role}`,
    );
    if (
      pin.bytes !== plan.source[role].bytes ||
      pin.sha256 !== plan.source[role].sha256
    ) fail(`authority-structured-output execution source pin.${role} differs from plan`);
    sourcePins[role] = { ...pin };
  }
  return {
    plan,
    executionSource: {
      planImplementationCommit: source.planImplementationCommit,
      executionHead: source.executionHead,
      executionHeadParent: source.executionHeadParent,
      plan: { ...planTuple },
      predecessor: {
        id: PREDECESSOR.id,
        implementationCommit: PREDECESSOR.implementationCommit,
        executionHead: PREDECESSOR.executionHead,
        persistenceCommit: PREDECESSOR.persistenceCommit,
        plan: { ...PREDECESSOR.plan },
        rawArtifact: { ...PREDECESSOR.rawArtifact },
        evidenceArtifact: { ...PREDECESSOR.evidenceArtifact },
        blockedArtifact: { ...PREDECESSOR.blockedArtifact },
        attemptIndex: { ...PREDECESSOR.attemptIndex },
        sameCommandRetryAuthorized: false,
        artifactsMatchSupportPlanAndWorking: true,
        executionHeadIsAncestorOfSupport: true,
        persistenceCommitIsAncestorOfSupport: true,
      },
      sourcePins,
      implementationSourcesMatchSupportPlanAndWorking: true,
    },
    outputsAbsent: true,
  };
}

function sameExecutionBoundary(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function snapshotPostPublicationBoundary(
  value,
  publishedPath,
  publicationResult,
  expectedPublication,
) {
  const data = exactObject(value, [
    "plan", "executionSource", "outputsAbsent", "publishedArtifact",
  ], "authority-structured-output post-publication boundary receipt");
  if (data.outputsAbsent !== false) {
    fail("authority-structured-output post-publication output state is invalid");
  }
  const artifact = exactObject(data.publishedArtifact, [
    "path", "byteLength", "sha256",
  ], "authority-structured-output published artifact readback");
  const publication = exactObject(publicationResult, [
    "byteLength", "sha256",
  ], "authority-structured-output publication receipt");
  const expected = exactObject(expectedPublication, [
    "byteLength", "sha256",
  ], "authority-structured-output expected publication tuple");
  exactString(artifact.path, publishedPath, "authority-structured-output published artifact path");
  if (
    !Number.isSafeInteger(artifact.byteLength) || artifact.byteLength < 1 ||
    typeof artifact.sha256 !== "string" || !/^[0-9a-f]{64}$/u.test(artifact.sha256) ||
    publication.byteLength !== artifact.byteLength ||
    publication.sha256 !== artifact.sha256 ||
    artifact.byteLength !== expected.byteLength ||
    artifact.sha256 !== expected.sha256
  ) {
    fail(
      "authority-structured-output publication readback differs from expected canonical artifact",
    );
  }
  return snapshotExecutionBoundary({
    plan: data.plan,
    executionSource: data.executionSource,
    outputsAbsent: true,
  });
}

function configTuple(value, label) {
  const data = exactObject(value, ["bytes", "sha256"], label);
  if (!Number.isSafeInteger(data.bytes) || data.bytes < 1) fail(`${label}.bytes is invalid`);
  if (typeof data.sha256 !== "string" || !/^[0-9a-f]{64}$/u.test(data.sha256)) {
    fail(`${label}.sha256 is invalid`);
  }
  return { bytes: data.bytes, sha256: data.sha256 };
}

function snapshotCleanupState(value, { requireLaunch }) {
  const data = exactObject(
    value,
    ["sourceConfigBefore", "sourceConfigAfter", "receipt"],
    "authority-structured-output cleanup state",
  );
  const before = configTuple(data.sourceConfigBefore, "authority-structured-output cleanup config before");
  const after = configTuple(data.sourceConfigAfter, "authority-structured-output cleanup config after");
  const receipt = exactObject(data.receipt, [
    "appServerLaunchCount", "appServerCloseConfirmedCount", "remainingOwnedProcessCount",
    "isolatedCodexHomeReadback", "runRootReadback",
  ], "authority-structured-output cleanup receipt");
  if (
    before.bytes !== after.bytes ||
    before.sha256 !== after.sha256 ||
    ![0, 1].includes(receipt.appServerLaunchCount) ||
    receipt.appServerCloseConfirmedCount !== receipt.appServerLaunchCount ||
    receipt.remainingOwnedProcessCount !== 0 ||
    receipt.isolatedCodexHomeReadback !== "absent" ||
    receipt.runRootReadback !== "absent" ||
    (requireLaunch && receipt.appServerLaunchCount !== 1)
  ) fail("authority-structured-output cleanup evidence is not safe");
  return {
    sourceConfigBefore: before,
    sourceConfigAfter: after,
    receipt: {
      appServerLaunchCount: receipt.appServerLaunchCount,
      appServerCloseConfirmedCount: receipt.appServerCloseConfirmedCount,
      remainingOwnedProcessCount: 0,
      isolatedCodexHomeReadback: "absent",
      runRootReadback: "absent",
    },
  };
}

function cleanupStateIsSafe(value, options) {
  try { snapshotCleanupState(value, options); return true; }
  catch { return false; }
}

function assertArtifactPrivacy(value, label) {
  const safe = cloneSafeData(value, label);
  const forbiddenKey = /^(?:pid|parentPid|executable|cwd|argv|stderr|rawStderr|diagnostic|configContents)$/iu;
  const visit = (candidate, key = "") => {
    if (forbiddenKey.test(key)) throw new Error(`${label} contains private runtime data`);
    if (typeof candidate === "string") {
      if (/^[A-Za-z]:[\\/]/u.test(candidate) || candidate.startsWith("/")) {
        throw new Error(`${label} contains an absolute path`);
      }
      return;
    }
    if (candidate === null || typeof candidate !== "object") return;
    if (Array.isArray(candidate)) {
      for (const entry of candidate) visit(entry, key);
      return;
    }
    for (const [entryKey, entry] of Object.entries(candidate)) visit(entry, entryKey);
  };
  visit(safe);
  return safe;
}

function expectedArtifactPublication(value) {
  const text = `${JSON.stringify(value, null, 2)}\n`;
  return {
    byteLength: Buffer.byteLength(text),
    sha256: sha256(text),
  };
}

function durableRuntime(plan, cleanup) {
  return {
    codexVersion: plan.runtime.codexVersion,
    freshTurnCount: plan.attempt.freshTurnCount,
    retryCount: plan.attempt.retryCount,
    dynamicToolCount: plan.runtime.dynamicTools.length,
    sourceConfigBefore: cleanup.sourceConfigBefore,
    sourceConfigAfter: cleanup.sourceConfigAfter,
    sourceConfigReadback: "UNCHANGED",
    cleanup: cleanup.receipt,
  };
}

function durableStructuredEvidence(base, plan, executionSource, cleanupState) {
  const rebuilt = rebuildJoenessM4AuthorityStructuredOutputDelegatedEvidence(base);
  if (rebuilt === undefined) {
    throw new Error("authority-structured-output delegated evidence is invalid");
  }
  const cleanup = snapshotCleanupState(cleanupState, { requireLaunch: true });
  return {
    ...rebuilt,
    executionSource: cloneSafeData(
      executionSource,
      "authority-structured-output evidence execution source",
    ),
    inputContract: cloneSafeData(
      plan.inputContract,
      "authority-structured-output evidence input contract",
    ),
    runtime: durableRuntime(plan, cleanup),
    resultBoundary: cloneSafeData(
      plan.resultBoundary,
      "authority-structured-output evidence result boundary",
    ),
    privacy: Object.fromEntries(STRUCTURED_PRIVACY_KEYS.map((key) => [key, false])),
  };
}

function durableBlockedEvidence(base, plan, executionSource, cleanupState, retainDetails) {
  const rebuilt = retainDetails
    ? rebuildJoenessM4AuthorityStructuredOutputDelegatedBlockedReceipt(base)
    : {
        schemaVersion: 1,
        status: "blocked",
        phase: "post-runtime-validation",
        safeCleanup: true,
        cause: { category: "evaluation-failed" },
      };
  const cleanup = snapshotCleanupState(cleanupState, { requireLaunch: rebuilt.phase !== "runtime-factory" });
  const freshFailure = retainDetails ? rebuilt.freshFailure : undefined;
  return {
    schemaVersion: 1,
    status: "blocked",
    phase: rebuilt.phase,
    safeCleanup: true,
    cause: {
      category: rebuilt.cause.category,
      ...(Object.hasOwn(rebuilt.cause, "result")
        ? { result: rebuilt.cause.result }
        : {}),
    },
    ...(freshFailure === undefined ? {} : { freshFailure }),
    executionSource: cloneSafeData(executionSource, "authority-structured-output blocked execution source"),
    inputContract: cloneSafeData(plan.inputContract, "authority-structured-output blocked input contract"),
    runtime: durableRuntime(plan, cleanup),
    resultBoundary: cloneSafeData(plan.resultBoundary, "authority-structured-output blocked result boundary"),
    privacy: Object.fromEntries(STRUCTURED_PRIVACY_KEYS.map((key) => [key, false])),
  };
}

export async function preflightJoenessM4AuthorityStructuredOutputLive(options) {
  const data = exactObject(
    options,
    ["repositoryRoot", "planPath", "sourceCodexHome", "operations"],
    "authority-structured-output preflight options",
  );
  const injected = subsetObject(data.operations, ["verifyExecutionBoundary"], "authority-structured-output preflight operations");
  const verifyExecutionBoundary = injected.verifyExecutionBoundary ?? verifyJoenessM4AuthorityStructuredOutputExecutionBoundary;
  if (typeof verifyExecutionBoundary !== "function") fail("authority-structured-output preflight verifier is invalid");
  const boundary = snapshotExecutionBoundary(await verifyExecutionBoundary({
    repositoryRoot: data.repositoryRoot,
    planPath: data.planPath,
  }));
  const sourceConfig = await snapshotJoenessM4AuthorityStructuredOutputSourceConfig({
    sourceCodexHome: data.sourceCodexHome,
  });
  return assertArtifactPrivacy({
    mode: "preflight",
    id: boundary.plan.id,
    executionSource: boundary.executionSource,
    sourceConfig,
    outputsAbsent: true,
    inputContract: boundary.plan.inputContract,
    runtime: boundary.plan.runtime,
    resultBoundary: boundary.plan.resultBoundary,
  }, "authority-structured-output preflight receipt");
}

export async function runJoenessM4AuthorityStructuredOutputLive(options) {
  const data = exactObject(options, [
    "repositoryRoot", "planPath", "sourceCodexHome", "runParent", "operations",
  ], "authority-structured-output live options");
  if (typeof data.repositoryRoot !== "string" || !path.isAbsolute(data.repositoryRoot)) {
    fail("authority-structured-output live repository root must be absolute");
  }
  exactString(data.planPath, JOENESS_M4_AUTHORITY_STRUCTURED_OUTPUT_LIVE_PLAN_PATH, "authority-structured-output live plan path");
  if (typeof data.sourceCodexHome !== "string" || !path.isAbsolute(data.sourceCodexHome)) {
    fail("authority-structured-output live source Codex home must be absolute");
  }
  if (typeof data.runParent !== "string" || !path.isAbsolute(data.runParent)) {
    fail("authority-structured-output live run parent must be absolute");
  }
  const repositoryRootTicket = await captureOwnedDirectory(
    data.repositoryRoot,
    data.repositoryRoot,
    "authority-structured-output live repository root",
  );
  const sourceHomeTicket = await captureOwnedDirectory(
    data.sourceCodexHome,
    data.sourceCodexHome,
    "authority-structured-output live source home",
  );
  const allowedOperations = [
    "verifyExecutionBoundary", "createRuntime", "runEvaluator", "runTurn",
    "publishSingleArtifact", "snapshotSourceConfig", "runnerGitStatus", "runnerGitIdentity",
    "runnerGitReadBlob", "runnerArtifactExists",
  ];
  const injected = subsetObject(data.operations, allowedOperations, "authority-structured-output live operations");
  const operations = {
    verifyExecutionBoundary: injected.verifyExecutionBoundary ?? verifyJoenessM4AuthorityStructuredOutputExecutionBoundary,
    createRuntime: injected.createRuntime ?? createJoenessM4AuthorityStructuredOutputDefaultRuntime,
    runEvaluator: injected.runEvaluator ?? runJoenessM4AuthorityStructuredOutputEval,
    runTurn: injected.runTurn ?? runFreshEvaluatorTurn,
    publishSingleArtifact:
      injected.publishSingleArtifact ?? publishJoenessM4AuthorityStructuredOutputArtifact,
    snapshotSourceConfig: injected.snapshotSourceConfig ?? (({ sourceCodexHome }) =>
      snapshotJoenessM4AuthorityStructuredOutputSourceConfig({ sourceCodexHome })),
    runnerGitStatus: injected.runnerGitStatus,
    runnerGitIdentity: injected.runnerGitIdentity,
    runnerGitReadBlob: injected.runnerGitReadBlob,
    runnerArtifactExists: injected.runnerArtifactExists,
  };
  for (const name of [
    "verifyExecutionBoundary", "createRuntime", "runEvaluator", "runTurn",
    "publishSingleArtifact", "snapshotSourceConfig",
  ]) {
    if (typeof operations[name] !== "function") fail(`authority-structured-output live operation ${name} is invalid`);
  }
  for (const name of ["runnerGitStatus", "runnerGitIdentity", "runnerGitReadBlob", "runnerArtifactExists"]) {
    if (operations[name] !== undefined && typeof operations[name] !== "function") {
      fail(`authority-structured-output live operation ${name} is invalid`);
    }
  }

  const boundaryOptions = { repositoryRoot: data.repositoryRoot, planPath: data.planPath };
  await requireOwnedDirectory(
    data.repositoryRoot,
    repositoryRootTicket,
    "authority-structured-output live repository root",
  );
  await requireOwnedDirectory(
    data.sourceCodexHome,
    sourceHomeTicket,
    "authority-structured-output live source home",
  );
  const initial = snapshotExecutionBoundary(await operations.verifyExecutionBoundary(boundaryOptions));
  await requireOwnedDirectory(
    data.repositoryRoot,
    repositoryRootTicket,
    "authority-structured-output live repository root",
  );
  await requireOwnedDirectory(
    data.sourceCodexHome,
    sourceHomeTicket,
    "authority-structured-output live source home",
  );
  const plan = initial.plan;
  const initialIdentity = JSON.stringify(initial);
  const sourceConfigBaseline = configTuple(
    await operations.snapshotSourceConfig({ sourceCodexHome: data.sourceCodexHome }),
    "authority-structured-output publication source config baseline",
  );
  await requireOwnedDirectory(
    data.repositoryRoot,
    repositoryRootTicket,
    "authority-structured-output live repository root",
  );
  await requireOwnedDirectory(
    data.sourceCodexHome,
    sourceHomeTicket,
    "authority-structured-output live source home",
  );
  const authenticRunner = operations.runEvaluator === runJoenessM4AuthorityStructuredOutputEval;
  const authenticAdapter = operations.runTurn === runFreshEvaluatorTurn;
  const authenticChain = authenticRunner && authenticAdapter;
  const cleanupState = {};
  let runtimeFactoryStarted = false;
  let runtimeFactoryCompleted = false;
  let evidencePublished = false;
  let evidenceStatus = null;
  let blockedPublished = false;
  let pendingUnauthenticatedBlocked = null;
  let mixedUnauthenticatedPublication = false;
  let durablePublication = null;
  let publicationRevalidatedAfterEvaluator = false;

  const executionPlan = {
    schemaVersion: 1,
    id: JOENESS_M4_AUTHORITY_STRUCTURED_OUTPUT_ID,
    outputs: cloneSafeData(plan.outputs, "authority-structured-output runner outputs"),
  };
  const sourcePin = {
    repositoryCommit: initial.executionSource.executionHead,
    authorityStructuredOutputRunner: cloneSafeData(
      initial.executionSource.sourcePins.authorityStructuredOutputRunner,
      "authority-structured-output runner source pin",
    ),
    authorityBehaviorContract: cloneSafeData(
      initial.executionSource.sourcePins.authorityBehaviorContract,
      "authority-structured-output authority behavior contract source pin",
    ),
    fixtureLoader: cloneSafeData(
      initial.executionSource.sourcePins.fixtureLoader,
      "authority-structured-output fixture loader source pin",
    ),
    freshTurnAdapter: cloneSafeData(
      initial.executionSource.sourcePins.freshTurnAdapter,
      "authority-structured-output fresh adapter source pin",
    ),
    transportControlSupport: cloneSafeData(
      initial.executionSource.sourcePins.transportControlSupport,
      "authority-structured-output transport support source pin",
    ),
  };
  const requireRuntimeEntryBoundary = async (label) => {
    await requireOwnedDirectory(
      data.repositoryRoot,
      repositoryRootTicket,
      "authority-structured-output live repository root",
    );
    await requireOwnedDirectory(
      data.sourceCodexHome,
      sourceHomeTicket,
      "authority-structured-output live source home",
    );
    const sourceConfig = configTuple(
      await operations.snapshotSourceConfig({ sourceCodexHome: data.sourceCodexHome }),
      label,
    );
    await requireOwnedDirectory(
      data.repositoryRoot,
      repositoryRootTicket,
      "authority-structured-output live repository root",
    );
    await requireOwnedDirectory(
      data.sourceCodexHome,
      sourceHomeTicket,
      "authority-structured-output live source home",
    );
    if (
      sourceConfig.bytes !== sourceConfigBaseline.bytes ||
      sourceConfig.sha256 !== sourceConfigBaseline.sha256
    ) throw new Error("authority-structured-output source config changed before runtime");
  };
  const runtimeFactory = async (runnerOptions) => {
    if (runtimeFactoryStarted) throw new Error("authority-structured-output runtime factory may be called exactly once");
    runtimeFactoryStarted = true;
    const runnerData = exactObject(
      runnerOptions,
      ["repositoryRoot", "executionPlan", "sourcePin"],
      "authority-structured-output delegated runtime request",
    );
    const request = cloneSafeData(runnerData, "authority-structured-output delegated runtime request");
    if (
      request.repositoryRoot !== data.repositoryRoot ||
      JSON.stringify(request.executionPlan) !== JSON.stringify(executionPlan) ||
      JSON.stringify(request.sourcePin) !== JSON.stringify(sourcePin)
    ) throw new Error("authority-structured-output delegated runtime request differs from bound source");
    await requireRuntimeEntryBoundary(
      "authority-structured-output pre-runtime source config readback",
    );
    const runtime = await operations.createRuntime({
      plan: cloneSafeData(plan, "authority-structured-output runtime plan"),
      repositoryRoot: data.repositoryRoot,
      sourceCodexHome: data.sourceCodexHome,
      runParent: data.runParent,
      cleanupState,
      operations: {
        createExclusiveRunRoot: undefined,
        prepareRuntime: undefined,
        openAppServer: undefined,
        removeIsolatedCodexHome: undefined,
        removeRunRoot: undefined,
      },
    });
    try {
      await requireRuntimeEntryBoundary(
        "authority-structured-output post-runtime-factory source config readback",
      );
    } catch (boundaryError) {
      let cleanupError = null;
      const finishProperty = diagnosticOwnData(runtime, "finish");
      if (
        finishProperty.state !== "data" ||
        typeof finishProperty.value !== "function" ||
        utilTypes.isProxy(finishProperty.value)
      ) {
        cleanupError = new Error(
          "authority-structured-output acquired runtime cleanup is unavailable",
        );
      } else {
        try {
          await Reflect.apply(finishProperty.value, runtime, [true]);
          if (!cleanupStateIsSafe(cleanupState, { requireLaunch: true })) {
            throw new Error(
              "authority-structured-output acquired runtime cleanup is unresolved",
            );
          }
        } catch (error) {
          cleanupError = error;
        }
      }
      if (cleanupError !== null) {
        throw new AggregateError(
          [boundaryError, cleanupError],
          "authority-structured-output runtime boundary changed and cleanup is unresolved",
          { cause: boundaryError },
        );
      }
      throw boundaryError;
    }
    runtimeFactoryCompleted = true;
    return runtime;
  };
  const revalidate = async () => {
    await requireOwnedDirectory(
      data.repositoryRoot,
      repositoryRootTicket,
      "authority-structured-output live repository root",
    );
    await requireOwnedDirectory(
      data.sourceCodexHome,
      sourceHomeTicket,
      "authority-structured-output live source home",
    );
    const current = snapshotExecutionBoundary(await operations.verifyExecutionBoundary(boundaryOptions));
    await requireOwnedDirectory(
      data.repositoryRoot,
      repositoryRootTicket,
      "authority-structured-output live repository root",
    );
    await requireOwnedDirectory(
      data.sourceCodexHome,
      sourceHomeTicket,
      "authority-structured-output live source home",
    );
    if (!sameExecutionBoundary(current, initial) || JSON.stringify(current) !== initialIdentity) {
      throw new Error("authority-structured-output execution boundary changed after preflight");
    }
    return current;
  };
  const snapshotPublicationSafety = async (requireLaunch) => {
    await requireOwnedDirectory(
      data.repositoryRoot,
      repositoryRootTicket,
      "authority-structured-output live repository root",
    );
    await requireOwnedDirectory(
      data.sourceCodexHome,
      sourceHomeTicket,
      "authority-structured-output live source home",
    );
    const sourceConfig = configTuple(
      await operations.snapshotSourceConfig({ sourceCodexHome: data.sourceCodexHome }),
      "authority-structured-output publication source config readback",
    );
    await requireOwnedDirectory(
      data.repositoryRoot,
      repositoryRootTicket,
      "authority-structured-output live repository root",
    );
    await requireOwnedDirectory(
      data.sourceCodexHome,
      sourceHomeTicket,
      "authority-structured-output live source home",
    );
    if (
      sourceConfig.bytes !== sourceConfigBaseline.bytes ||
      sourceConfig.sha256 !== sourceConfigBaseline.sha256
    ) throw new Error("authority-structured-output source config changed during publication");
    return {
      sourceConfig,
      cleanup: snapshotCleanupState(cleanupState, { requireLaunch }),
    };
  };
  const revalidateAfterPublication = async (
    publishedPath,
    publicationResult,
    expectedPublication,
    expectedSafety,
    requireLaunch,
  ) => {
    const currentSafety = await snapshotPublicationSafety(requireLaunch);
    if (JSON.stringify(currentSafety) !== JSON.stringify(expectedSafety)) {
      throw new Error("authority-structured-output cleanup state changed during publication");
    }
    const current = snapshotPostPublicationBoundary(
      await operations.verifyExecutionBoundary({
        ...boundaryOptions,
        publishedPath,
      }),
      publishedPath,
      publicationResult,
      expectedPublication,
    );
    if (!sameExecutionBoundary(current, initial) || JSON.stringify(current) !== initialIdentity) {
      throw new Error("authority-structured-output execution boundary changed after publication");
    }
    const finalSafety = await snapshotPublicationSafety(requireLaunch);
    if (JSON.stringify(finalSafety) !== JSON.stringify(expectedSafety)) {
      throw new Error("authority-structured-output cleanup state changed during publication");
    }
    return current;
  };
  const writeArtifact = async (relativePath, value) => {
    if (evidencePublished || blockedPublished || pendingUnauthenticatedBlocked !== null) {
      if (!authenticChain) mixedUnauthenticatedPublication = true;
      throw new Error("authority-structured-output publication branch is already selected");
    }
    if (relativePath === plan.outputs.evidence) {
      if (!authenticChain) {
        mixedUnauthenticatedPublication = true;
        throw new Error("authority-structured-output evidence requires authentic runner and adapter identity");
      }
      const rebuilt = rebuildJoenessM4AuthorityStructuredOutputDelegatedEvidence(value);
      if (rebuilt === undefined) {
        throw new Error("authority-structured-output delegated evidence is invalid");
      }
      const current = await revalidate();
      const evidence = durableStructuredEvidence(
        rebuilt,
        plan,
        current.executionSource,
        cleanupState,
      );
      const safeEvidence = assertArtifactPrivacy(
        evidence,
        "authority-structured-output evidence artifact",
      );
      const expectedPublication = expectedArtifactPublication(safeEvidence);
      const publicationSafety = await snapshotPublicationSafety(true);
      const result = await operations.publishSingleArtifact({
        repositoryRoot: data.repositoryRoot,
        relativePath: plan.outputs.evidence,
        value: safeEvidence,
      });
      await revalidateAfterPublication(
        plan.outputs.evidence,
        result,
        expectedPublication,
        publicationSafety,
        true,
      );
      durablePublication = {
        publishedPath: plan.outputs.evidence,
        publicationResult: cloneSafeData(result, "authority-structured-output evidence publication receipt"),
        expectedPublication: { ...expectedPublication },
        expectedSafety: cloneSafeData(publicationSafety, "authority-structured-output evidence publication safety"),
        requireLaunch: true,
      };
      evidencePublished = true;
      evidenceStatus = rebuilt.assessment.status;
      return result;
    }
    exactString(relativePath, plan.outputs.blocked, "authority-structured-output delegated blocked path");
    const current = await revalidate();
    const blocked = durableBlockedEvidence(
      value,
      plan,
      current.executionSource,
      cleanupState,
      authenticChain,
    );
    const safeBlocked = assertArtifactPrivacy(blocked, "authority-structured-output blocked artifact");
    if (!authenticChain) {
      pendingUnauthenticatedBlocked = safeBlocked;
      return { pending: true };
    }
    const publicationSafety = await snapshotPublicationSafety(true);
    const result = await operations.publishSingleArtifact({
      repositoryRoot: data.repositoryRoot,
      relativePath: plan.outputs.blocked,
      value: safeBlocked,
    });
    await revalidateAfterPublication(
      plan.outputs.blocked,
      result,
      expectedArtifactPublication(safeBlocked),
      publicationSafety,
      true,
    );
    durablePublication = {
      publishedPath: plan.outputs.blocked,
      publicationResult: cloneSafeData(result, "authority-structured-output blocked publication receipt"),
      expectedPublication: expectedArtifactPublication(safeBlocked),
      expectedSafety: cloneSafeData(publicationSafety, "authority-structured-output blocked publication safety"),
      requireLaunch: true,
    };
    blockedPublished = true;
    return result;
  };

  try {
    const result = await operations.runEvaluator({
      repositoryRoot: data.repositoryRoot,
      executionPlan: cloneSafeData(executionPlan, "authority-structured-output execution plan"),
      sourcePin: cloneSafeData(sourcePin, "authority-structured-output source pin"),
      runtimeFactory,
      runTurn: operations.runTurn,
      writeArtifact,
      ...(operations.runnerGitStatus === undefined ? {} : { gitStatus: operations.runnerGitStatus }),
      ...(operations.runnerGitIdentity === undefined ? {} : { gitIdentity: operations.runnerGitIdentity }),
      ...(operations.runnerGitReadBlob === undefined ? {} : { gitReadBlob: operations.runnerGitReadBlob }),
      ...(operations.runnerArtifactExists === undefined ? {} : { artifactExists: operations.runnerArtifactExists }),
    });
    if (!authenticChain) {
      throw new Error("authority-structured-output evaluator result lacks authentic publication provenance");
    }
    if (durablePublication === null) {
      throw new Error("authority-structured-output evaluator result lacks durable publication provenance");
    }
    await revalidateAfterPublication(
      durablePublication.publishedPath,
      durablePublication.publicationResult,
      durablePublication.expectedPublication,
      durablePublication.expectedSafety,
      durablePublication.requireLaunch,
    );
    publicationRevalidatedAfterEvaluator = true;
    const assessment = cloneSafeData(result, "authority-structured-output assessment");
    const exactAssessment = exactObject(assessment, [
      "status", "scope", "structuredOutputSemantics", "serializationCanonicality",
      "m4FixtureBehavior", "m4Overall", "projectTaskOverExternalSkill",
      "directUserOverProjectAuthority", "installedPluginActivation",
      "superpowersCompatibility", "promotionPass",
    ], "authority-structured-output assessment");
    const pass = exactAssessment.status === "PASS";
    const failStatus = exactAssessment.status === "FAIL";
    if (
      (!pass && !failStatus) ||
      exactAssessment.scope !==
        "pinned-content-authentic-adapter-structured-output-minimal-authority-behavior" ||
      exactAssessment.structuredOutputSemantics !==
        (pass ? "PASS-PINNED-FIXTURE" : "FAIL-PINNED-FIXTURE") ||
      exactAssessment.serializationCanonicality !== "NOT-ASSESSED" ||
      exactAssessment.m4FixtureBehavior !==
        (pass
          ? "PASS-PINNED-STRUCTURED-OUTPUT-ONLY"
          : "FAIL-PINNED-STRUCTURED-OUTPUT-ONLY") ||
      exactAssessment.m4Overall !== "UNVALIDATED" ||
      exactAssessment.projectTaskOverExternalSkill !==
        (pass ? "VERIFIED-PINNED-STRUCTURED-OUTPUT-ONLY" : "UNVALIDATED") ||
      exactAssessment.directUserOverProjectAuthority !== "NOT-SEPARATELY-EXERCISED" ||
      exactAssessment.installedPluginActivation !== "UNVERIFIED" ||
      exactAssessment.superpowersCompatibility !== "UNVERIFIED" ||
      exactAssessment.promotionPass !== false ||
      !evidencePublished || evidenceStatus !== exactAssessment.status || blockedPublished
    ) {
      throw new Error(
        `authority-structured-output ${pass ? "PASS" : "FAIL"} publication provenance is invalid`,
      );
    }
    return assessment;
  } catch (error) {
    if (
      blockedPublished &&
      durablePublication !== null &&
      !publicationRevalidatedAfterEvaluator
    ) {
      await revalidateAfterPublication(
        durablePublication.publishedPath,
        durablePublication.publicationResult,
        durablePublication.expectedPublication,
        durablePublication.expectedSafety,
        durablePublication.requireLaunch,
      );
      publicationRevalidatedAfterEvaluator = true;
    }
    if (
      pendingUnauthenticatedBlocked !== null &&
      !mixedUnauthenticatedPublication &&
      !blockedPublished &&
      !evidencePublished
    ) {
      await revalidate();
      const publicationSafety = await snapshotPublicationSafety(true);
      const result = await operations.publishSingleArtifact({
        repositoryRoot: data.repositoryRoot,
        relativePath: plan.outputs.blocked,
        value: pendingUnauthenticatedBlocked,
      });
      await revalidateAfterPublication(
        plan.outputs.blocked,
        result,
        expectedArtifactPublication(pendingUnauthenticatedBlocked),
        publicationSafety,
        true,
      );
      durablePublication = {
        publishedPath: plan.outputs.blocked,
        publicationResult: cloneSafeData(result, "authority-structured-output generic blocked publication receipt"),
        expectedPublication: expectedArtifactPublication(pendingUnauthenticatedBlocked),
        expectedSafety: cloneSafeData(publicationSafety, "authority-structured-output generic blocked publication safety"),
        requireLaunch: true,
      };
      blockedPublished = true;
    }
    if (
      runtimeFactoryStarted &&
      !runtimeFactoryCompleted &&
      !blockedPublished &&
      !evidencePublished &&
      cleanupStateIsSafe(cleanupState, { requireLaunch: false })
    ) {
      const current = await revalidate();
      const blocked = durableBlockedEvidence({
        schemaVersion: 1,
        status: "blocked",
        phase: "runtime-factory",
        safeCleanup: true,
        cause: { category: "runtime-factory-failed" },
      }, plan, current.executionSource, cleanupState, true);
      const safeBlocked = assertArtifactPrivacy(
        blocked,
        "authority-structured-output partial-factory blocked artifact",
      );
      const publicationSafety = await snapshotPublicationSafety(false);
      const publication = await operations.publishSingleArtifact({
        repositoryRoot: data.repositoryRoot,
        relativePath: plan.outputs.blocked,
        value: safeBlocked,
      });
      await revalidateAfterPublication(
        plan.outputs.blocked,
        publication,
        expectedArtifactPublication(safeBlocked),
        publicationSafety,
        false,
      );
      durablePublication = {
        publishedPath: plan.outputs.blocked,
        publicationResult: cloneSafeData(publication, "authority-structured-output partial blocked publication receipt"),
        expectedPublication: expectedArtifactPublication(safeBlocked),
        expectedSafety: cloneSafeData(publicationSafety, "authority-structured-output partial blocked publication safety"),
        requireLaunch: false,
      };
      blockedPublished = true;
    }
    throw error;
  }
}

export async function executeJoenessM4AuthorityStructuredOutputLiveCli(options) {
  const data = exactObject(options, [
    "argv", "repositoryRoot", "sourceCodexHome", "runParent", "operations",
  ], "authority-structured-output CLI execution options");
  const cli = parseJoenessM4AuthorityStructuredOutputLiveCli(data.argv);
  const injected = subsetObject(data.operations, ["preflight", "live"], "authority-structured-output CLI execution operations");
  const preflight = injected.preflight ?? preflightJoenessM4AuthorityStructuredOutputLive;
  const live = injected.live ?? runJoenessM4AuthorityStructuredOutputLive;
  if (typeof preflight !== "function" || typeof live !== "function") {
    fail("authority-structured-output CLI execution operations are invalid");
  }
  return cli.mode === "preflight"
    ? preflight({
      repositoryRoot: data.repositoryRoot,
      planPath: cli.planPath,
      sourceCodexHome: data.sourceCodexHome,
      operations: undefined,
    })
    : live({
      repositoryRoot: data.repositoryRoot,
      planPath: cli.planPath,
      sourceCodexHome: data.sourceCodexHome,
      runParent: data.runParent,
      operations: undefined,
    });
}

async function main() {
  const repositoryRoot = path.resolve(import.meta.dirname, "../..");
  const sourceCodexHome = process.env.CODEX_HOME ?? path.join(homedir(), ".codex");
  const result = await executeJoenessM4AuthorityStructuredOutputLiveCli({
    argv: process.argv.slice(2),
    repositoryRoot,
    sourceCodexHome,
    runParent: tmpdir(),
    operations: undefined,
  });
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(() => {
    process.stderr.write("m4-authority-structured-output-live-wrapper-failed\n");
    process.exitCode = 1;
  });
}
