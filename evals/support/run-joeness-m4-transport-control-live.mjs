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
  JOENESS_M4_TRANSPORT_CONTROL_ID,
  publishJoenessM4TransportControlBlockedArtifact,
  publishJoenessM4TransportControlSuccessArtifacts,
  runJoenessM4TransportControlEval,
} from "./run-joeness-m4-transport-control-eval.mjs";

const execFile = promisify(execFileCallback);

export const JOENESS_M4_TRANSPORT_CONTROL_LIVE_RUN_ID =
  "joeness-m4-transport-control-live-v4";
export const JOENESS_M4_TRANSPORT_CONTROL_LIVE_PLAN_PATH =
  "evals/skill-contracts/joeness-m4-transport-control-live-plan-v4.json";
export const JOENESS_M4_TRANSPORT_CONTROL_LIVE_METHOD =
  "neutral-tiny-json-transport-control-with-fixed-runtime-error-origin-no-plugin-activation-or-policy-assessment";
export const JOENESS_M4_TRANSPORT_CONTROL_LIVE_OUTPUTS = Object.freeze({
  raw: "evals/skill-contracts/joeness-m4-transport-control-live-v4-raw.json",
  evidence: "evals/skill-contracts/joeness-m4-transport-control-live-v4-evidence.json",
  blocked: "evals/skill-contracts/joeness-m4-transport-control-live-v4-blocked.json",
});

const PREDECESSOR = Object.freeze({
  id: "joeness-m4-superpowers-live-v3",
  implementationCommit: "39387f9ce0708ed56ef7be8e34831690eae31021",
  executionHead: "e36175da3fa67e3b8aedddef6c12156dfd04a438",
  persistenceCommit: "8f5b8dcfd12fccabb1b25cbc813aec48340b7287",
  plan: Object.freeze({
    path: "evals/skill-contracts/joeness-m4-superpowers-live-plan-v3.json",
    bytes: 2958,
    sha256: "2d98638e45b65fa2c1dc98fd11d7eeb86d57d9c6d69ce0a56752315aa83fb855",
  }),
  blockedArtifact: Object.freeze({
    path: "evals/skill-contracts/joeness-m4-superpowers-live-v3-blocked.json",
    bytes: 3670,
    sha256: "41aeafdb4a5b4b2bb468510846cb889050681e844f40d21669dbaf4c5175978a",
  }),
  attemptIndex: Object.freeze({
    path: "evals/skill-contracts/joeness-m4-superpowers-attempt-index-v3.json",
    bytes: 10146,
    sha256: "6f6dec9b5556b19247c218a9940a7dc30dd29b60d374dd51438b865d9aa1867a",
  }),
  sameCommandRetryAuthorized: false,
});

const SOURCE_PATHS = Object.freeze({
  controlRunner: "evals/support/run-joeness-m4-transport-control-eval.mjs",
  controlWrapper: "evals/support/run-joeness-m4-transport-control-live.mjs",
  freshTurnAdapter: "evals/support/run-fresh-evaluator-turn.mjs",
  collector: "evals/support/collect-codex-app-server.mjs",
});

const FRESH_BLOCKER_CODES = Object.freeze([
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

function fail(message) {
  throw new TypeError(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function safePlainObject(value, label) {
  if (value === null || typeof value !== "object" || utilTypes.isProxy(value) || Array.isArray(value)) {
    fail(`${label} must be a safe plain object`);
  }
  let prototype;
  let keys;
  try {
    prototype = Object.getPrototypeOf(value);
    keys = Reflect.ownKeys(value);
  } catch {
    fail(`${label} is unsafe`);
  }
  if (
    (prototype !== Object.prototype && prototype !== null) ||
    keys.some((key) => typeof key !== "string")
  ) fail(`${label} must be a safe plain object`);
  const result = Object.create(null);
  for (const key of keys) {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(value, key); }
    catch { fail(`${label}.${key} is unsafe`); }
    if (!descriptor || !("value" in descriptor) || descriptor.get || descriptor.set) {
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

function subsetObject(value, allowed, label) {
  if (value === undefined) return Object.create(null);
  const safe = safePlainObject(value, label);
  if (safe.keys.some((key) => !allowed.includes(key))) fail(`${label} has unknown keys`);
  return safe.value;
}

function cloneSafeData(value, label, state = { depth: 0, entries: 0 }) {
  state.entries += 1;
  if (state.entries > 4096 || state.depth > 24) fail(`${label} exceeds safe data bounds`);
  if (value === null || typeof value === "boolean" || typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "object" || utilTypes.isProxy(value)) fail(`${label} is not safe data`);
  if (Array.isArray(value)) {
    const entries = exactArray(value, label);
    const nested = { depth: state.depth + 1, entries: state.entries };
    const result = entries.map((entry, index) => cloneSafeData(entry, `${label}[${index}]`, nested));
    state.entries = nested.entries;
    return result;
  }
  const safe = safePlainObject(value, label);
  const nested = { depth: state.depth + 1, entries: state.entries };
  const result = {};
  for (const key of safe.keys) result[key] = cloneSafeData(safe.value[key], `${label}.${key}`, nested);
  state.entries = nested.entries;
  return result;
}

function exactArray(value, label) {
  if (value === null || typeof value !== "object" || utilTypes.isProxy(value) || !Array.isArray(value)) {
    fail(`${label} must be a safe array`);
  }
  let keys;
  let length;
  try {
    keys = Reflect.ownKeys(value);
    const descriptor = Object.getOwnPropertyDescriptor(value, "length");
    length = descriptor?.value;
  } catch {
    fail(`${label} is unsafe`);
  }
  if (
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
    if (!descriptor || !("value" in descriptor) || descriptor.get || descriptor.set) {
      fail(`${label}[${index}] must be an own data property`);
    }
    result.push(descriptor.value);
  }
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
  if (!("value" in descriptor) || descriptor.get || descriptor.set) return { state: "unsafe" };
  return { state: "data", value: descriptor.value };
}

function diagnosticExactObject(value, keys) {
  if (value === null || typeof value !== "object" || utilTypes.isProxy(value) || Array.isArray(value)) return null;
  let prototype;
  let actual;
  try {
    prototype = Object.getPrototypeOf(value);
    actual = Reflect.ownKeys(value);
  } catch {
    return null;
  }
  if (
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
  if (value === null || typeof value !== "object" || utilTypes.isProxy(value) || !Array.isArray(value)) return null;
  let keys;
  let lengthDescriptor;
  try {
    keys = Reflect.ownKeys(value);
    lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length");
  } catch {
    return null;
  }
  const length = lengthDescriptor?.value;
  if (
    !("value" in (lengthDescriptor ?? {})) ||
    !Number.isSafeInteger(length) ||
    length < 0 ||
    length > maximumLength ||
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

function exactString(value, expected, label) {
  if (value !== expected) fail(`${label} is invalid`);
}

function commit(value, label) {
  if (typeof value !== "string" || !/^[0-9a-f]{40}$/u.test(value)) fail(`${label} is invalid`);
}

function portablePath(value, label) {
  if (
    typeof value !== "string" ||
    value.length < 1 ||
    value.length > 200 ||
    value.includes("\\") ||
    path.posix.isAbsolute(value) ||
    value.split("/").some((part) => part === "" || part === "." || part === "..")
  ) fail(`${label} is invalid`);
}

function digestTuple(value, expectedPath, label) {
  const data = exactObject(value, ["path", "bytes", "sha256"], label);
  exactString(data.path, expectedPath, `${label}.path`);
  if (!Number.isSafeInteger(data.bytes) || data.bytes < 1) fail(`${label}.bytes is invalid`);
  if (typeof data.sha256 !== "string" || !/^[0-9a-f]{64}$/u.test(data.sha256)) {
    fail(`${label}.sha256 is invalid`);
  }
  return { path: data.path, bytes: data.bytes, sha256: data.sha256 };
}

function equalTuple(actual, expected, label) {
  const tuple = digestTuple(actual, expected.path, label);
  if (tuple.bytes !== expected.bytes || tuple.sha256 !== expected.sha256) fail(`${label} differs`);
}

export function validateJoenessM4TransportControlLivePlan(value) {
  const data = exactObject(value, [
    "schemaVersion", "id", "date", "method", "predecessor", "attempt",
    "source", "runtime", "outputs", "resultBoundary",
  ], "transport control live plan");
  if (data.schemaVersion !== 4) fail("transport control live plan schema is invalid");
  exactString(data.id, JOENESS_M4_TRANSPORT_CONTROL_LIVE_RUN_ID, "transport control live plan id");
  exactString(data.date, "2026-08-14", "transport control live plan date");
  exactString(data.method, JOENESS_M4_TRANSPORT_CONTROL_LIVE_METHOD, "transport control live plan method");

  const predecessor = exactObject(data.predecessor, [
    "id", "implementationCommit", "executionHead", "persistenceCommit", "plan",
    "blockedArtifact", "attemptIndex", "sameCommandRetryAuthorized",
  ], "transport control predecessor");
  for (const key of ["id", "implementationCommit", "executionHead", "persistenceCommit"]) {
    exactString(predecessor[key], PREDECESSOR[key], `transport control predecessor.${key}`);
  }
  equalTuple(predecessor.plan, PREDECESSOR.plan, "transport control predecessor.plan");
  equalTuple(predecessor.blockedArtifact, PREDECESSOR.blockedArtifact, "transport control predecessor.blockedArtifact");
  equalTuple(predecessor.attemptIndex, PREDECESSOR.attemptIndex, "transport control predecessor.attemptIndex");
  if (predecessor.sameCommandRetryAuthorized !== false) fail("transport control predecessor retry is invalid");

  const attempt = exactObject(data.attempt, ["freshTurnCount", "retryCount", "automaticRetry"], "transport control attempt");
  if (attempt.freshTurnCount !== 1 || attempt.retryCount !== 0 || attempt.automaticRetry !== false) {
    fail("transport control attempt is invalid");
  }

  const source = exactObject(data.source, [
    "planImplementationCommit", "controlRunner", "controlWrapper", "freshTurnAdapter", "collector",
  ], "transport control sources");
  commit(source.planImplementationCommit, "transport control implementation commit");
  for (const [role, expectedPath] of Object.entries(SOURCE_PATHS)) {
    digestTuple(source[role], expectedPath, `transport control source.${role}`);
  }

  const runtime = exactObject(data.runtime, [
    "codexVersion", "projectDocs", "installedPluginActivation", "dynamicTools",
  ], "transport control runtime");
  exactString(runtime.codexVersion, "codex-cli 0.146.0", "transport control runtime.codexVersion");
  exactString(runtime.projectDocs, "disabled", "transport control runtime.projectDocs");
  exactString(runtime.installedPluginActivation, "UNVERIFIED", "transport control runtime.installedPluginActivation");
  if (exactArray(runtime.dynamicTools, "transport control runtime.dynamicTools").length !== 0) {
    fail("transport control runtime tools must be empty");
  }

  const outputs = exactObject(data.outputs, ["raw", "evidence", "blocked"], "transport control outputs");
  for (const [role, expected] of Object.entries(JOENESS_M4_TRANSPORT_CONTROL_LIVE_OUTPUTS)) {
    exactString(outputs[role], expected, `transport control outputs.${role}`);
    portablePath(outputs[role], `transport control outputs.${role}`);
  }

  const boundary = exactObject(data.resultBoundary, [
    "state", "validation", "transportScopeOnly", "m4Behavior", "joenessPolicy",
    "superpowersCompatibility", "promotionPass", "corePromotion", "manifestPromotion",
  ], "transport control result boundary");
  exactString(boundary.state, "candidate", "transport control result state");
  exactString(boundary.validation, "unvalidated", "transport control result validation");
  if (boundary.transportScopeOnly !== true) fail("transport control result scope is invalid");
  exactString(boundary.m4Behavior, "NOT-ASSESSED", "transport control M4 behavior");
  exactString(boundary.joenessPolicy, "UNVERIFIED", "transport control JOENESS policy");
  exactString(boundary.superpowersCompatibility, "UNVERIFIED", "transport control Superpowers compatibility");
  if (boundary.promotionPass !== false || boundary.corePromotion !== false || boundary.manifestPromotion !== false) {
    fail("transport control promotions are invalid");
  }
  return value;
}

export function parseJoenessM4TransportControlLiveCli(argv) {
  if (!Array.isArray(argv)) fail("transport control CLI arguments are invalid");
  if (argv.length === 0) {
    return { mode: "preflight", planPath: JOENESS_M4_TRANSPORT_CONTROL_LIVE_PLAN_PATH };
  }
  if (
    argv.length === 4 &&
    argv[0] === "--mode" &&
    ["preflight", "live"].includes(argv[1]) &&
    argv[2] === "--plan" &&
    argv[3] === JOENESS_M4_TRANSPORT_CONTROL_LIVE_PLAN_PATH
  ) return { mode: argv[1], planPath: argv[3] };
  throw new Error(
    `usage: node ${SOURCE_PATHS.controlWrapper} --mode <preflight|live> --plan ${JOENESS_M4_TRANSPORT_CONTROL_LIVE_PLAN_PATH}`,
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
  if (output.at(-1) !== 0) throw new Error("transport control Git tree result is not terminated");
  const records = output.subarray(0, -1).toString("utf8").split("\0");
  if (records.length !== 1) throw new Error("transport control Git tree result is ambiguous");
  const separator = records[0].indexOf("\t");
  if (separator < 1 || records[0].slice(separator + 1) !== relativePath) {
    throw new Error("transport control Git tree result is not the exact path");
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

export async function verifyJoenessM4TransportControlExecutionBoundary(options) {
  const data = exactObject(options, ["repositoryRoot", "planPath"], "transport control execution boundary options");
  if (typeof data.repositoryRoot !== "string" || !path.isAbsolute(data.repositoryRoot)) {
    fail("transport control repository root must be absolute");
  }
  exactString(data.planPath, JOENESS_M4_TRANSPORT_CONTROL_LIVE_PLAN_PATH, "transport control plan path");
  const rootState = await lstat(data.repositoryRoot);
  if (!rootState.isDirectory() || rootState.isSymbolicLink()) fail("transport control repository root must be a real directory");
  const root = await realpath(data.repositoryRoot);
  if ((await gitText(root, ["status", "--porcelain=v1", "--untracked-files=all"])) !== "") {
    throw new Error("transport control execution worktree is dirty");
  }
  const executionHead = await gitText(root, ["rev-parse", "HEAD"]);
  commit(executionHead, "transport control execution HEAD");
  const planFile = await confinedRegularFile(root, data.planPath, "transport control live plan");
  const planBytes = await readFile(planFile);
  if (planBytes.length < 1 || planBytes.length > 32 * 1024) throw new Error("transport control live plan size is invalid");
  let plan;
  try { plan = JSON.parse(planBytes.toString("utf8")); }
  catch (cause) { throw new Error("transport control live plan JSON is malformed", { cause }); }
  validateJoenessM4TransportControlLivePlan(plan);
  const support = plan.source.planImplementationCommit;
  const parentLine = await gitText(root, ["rev-list", "--parents", "-n", "1", executionHead]);
  if (parentLine !== `${executionHead} ${support}`) {
    throw new Error("transport control execution HEAD must be a direct single-parent child of support");
  }
  const diff = await gitText(root, ["diff", "--name-status", support, executionHead]);
  if (diff !== `A\t${JOENESS_M4_TRANSPORT_CONTROL_LIVE_PLAN_PATH}`) {
    throw new Error("transport control execution commit is not plan-only");
  }
  const committedPlan = await gitBlob(root, executionHead, data.planPath);
  if (!committedPlan.equals(planBytes)) throw new Error("transport control working plan differs from execution HEAD");
  if (await gitBlobExists(root, support, data.planPath)) throw new Error("transport control plan already exists in support");

  const predecessorExecution = await gitText(root, ["rev-list", "--parents", "-n", "1", PREDECESSOR.executionHead]);
  const predecessorPersistence = await gitText(root, ["rev-list", "--parents", "-n", "1", PREDECESSOR.persistenceCommit]);
  if (predecessorExecution !== `${PREDECESSOR.executionHead} ${PREDECESSOR.implementationCommit}`) {
    throw new Error("transport control predecessor execution lineage is invalid");
  }
  if (predecessorPersistence !== `${PREDECESSOR.persistenceCommit} ${PREDECESSOR.executionHead}`) {
    throw new Error("transport control predecessor persistence lineage is invalid");
  }
  if (!(await gitIsAncestor(root, PREDECESSOR.executionHead, support))) {
    throw new Error("transport control predecessor execution is not an ancestor of support");
  }
  if (!(await gitIsAncestor(root, PREDECESSOR.persistenceCommit, support))) {
    throw new Error("transport control predecessor persistence is not an ancestor of support");
  }
  for (const [role, pin, revisions] of [
    ["plan", PREDECESSOR.plan, [PREDECESSOR.executionHead, PREDECESSOR.persistenceCommit, support, executionHead]],
    ["blockedArtifact", PREDECESSOR.blockedArtifact, [PREDECESSOR.persistenceCommit, support, executionHead]],
    ["attemptIndex", PREDECESSOR.attemptIndex, [PREDECESSOR.persistenceCommit, support, executionHead]],
  ]) {
    for (const revision of revisions) {
      const candidate = await gitBlob(root, revision, pin.path);
      if (candidate.length !== pin.bytes || sha256(candidate) !== pin.sha256) {
        throw new Error(`transport control predecessor ${role} drift`);
      }
    }
    const working = await readFile(await confinedRegularFile(root, pin.path, `transport control predecessor ${role}`));
    if (working.length !== pin.bytes || sha256(working) !== pin.sha256) {
      throw new Error(`transport control predecessor ${role} drift`);
    }
  }
  for (const [role, expectedPath] of Object.entries(SOURCE_PATHS)) {
    const pin = plan.source[role];
    const candidates = [
      await gitBlob(root, support, expectedPath),
      await gitBlob(root, executionHead, expectedPath),
      await readFile(await confinedRegularFile(root, expectedPath, `transport control source ${role}`)),
    ];
    if (candidates.some((candidate) => candidate.length !== pin.bytes || sha256(candidate) !== pin.sha256)) {
      throw new Error(`transport control source ${role} drift`);
    }
  }
  for (const outputPath of Object.values(JOENESS_M4_TRANSPORT_CONTROL_LIVE_OUTPUTS)) {
    if (await gitBlobExists(root, executionHead, outputPath)) {
      throw new Error(`transport control output is already committed: ${outputPath}`);
    }
    await confinedAbsentTarget(root, outputPath, "transport control output");
  }
  const [finalStatus, finalHead, planReadback] = await Promise.all([
    gitText(root, ["status", "--porcelain=v1", "--untracked-files=all"]),
    gitText(root, ["rev-parse", "HEAD"]),
    readFile(planFile),
  ]);
  if (finalStatus !== "" || finalHead !== executionHead || !planReadback.equals(planBytes)) {
    throw new Error("transport control execution boundary changed during verification");
  }
  return {
    plan,
    executionSource: {
      planImplementationCommit: support,
      executionHead,
      executionHeadParent: support,
      plan: {
        path: JOENESS_M4_TRANSPORT_CONTROL_LIVE_PLAN_PATH,
        bytes: planBytes.length,
        sha256: sha256(planBytes),
      },
      predecessor: {
        ...PREDECESSOR,
        artifactsMatchSupportPlanAndWorking: true,
        executionHeadIsAncestorOfSupport: true,
        persistenceCommitIsAncestorOfSupport: true,
      },
      implementationSourcesMatchSupportPlanAndWorking: true,
    },
    outputsAbsent: true,
  };
}

export async function snapshotJoenessM4TransportControlSourceConfig(options = {}) {
  const allowed = Object.hasOwn(options, "sourceCodexHome") ? ["sourceCodexHome"] : [];
  const data = exactObject(options, allowed, "transport control source config options");
  const sourceCodexHome = data.sourceCodexHome ?? process.env.CODEX_HOME ?? path.join(homedir(), ".codex");
  if (typeof sourceCodexHome !== "string" || !path.isAbsolute(sourceCodexHome)) {
    fail("transport control source Codex home must be absolute");
  }
  const homeState = await lstat(sourceCodexHome);
  if (!homeState.isDirectory() || homeState.isSymbolicLink()) {
    throw new Error("transport control source Codex home must be a real directory");
  }
  const resolvedHome = await realpath(sourceCodexHome);
  const configPath = path.join(resolvedHome, "config.toml");
  const before = await lstat(configPath);
  if (!before.isFile() || before.isSymbolicLink()) {
    throw new Error("transport control source config must be a regular file");
  }
  const resolvedConfig = await realpath(configPath);
  const relative = path.relative(resolvedHome, resolvedConfig);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error("transport control source config escapes its home");
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
  ) throw new Error("transport control source config changed during snapshot");
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
  await requireOwnedDirectory(sourceHomeTicket.resolvedPath, sourceHomeTicket, "transport control source home");
  let parentState;
  try { parentState = await lstat(isolatedParent, { bigint: true }); }
  catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
  if (!parentState.isDirectory() || parentState.isSymbolicLink()) {
    throw new Error("transport control isolated parent is unsafe; inferred target was preserved");
  }
  const resolvedParent = await realpath(isolatedParent);
  if (comparableResolvedPath(resolvedParent) !== comparableResolvedPath(isolatedParent)) {
    throw new Error("transport control isolated parent escapes the source home; inferred target was preserved");
  }
  if (comparableResolvedPath(path.dirname(resolvedParent)) !== comparableResolvedPath(sourceHomeTicket.resolvedPath)) {
    throw new Error("transport control isolated parent is not confined to the source home");
  }
  try { await lstat(isolatedHome, { bigint: true }); }
  catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
  throw new Error("transport control isolated home ownership is unavailable; existing target was preserved");
}

async function removeOwnedRunRoot(runRoot, runParent, runId, runRootTicket, runParentTicket) {
  if (runId !== JOENESS_M4_TRANSPORT_CONTROL_LIVE_RUN_ID) {
    throw new Error("transport control run-root identity is invalid");
  }
  const expected = path.join(path.resolve(runParent), `joewrks-eval-${runId}`);
  const actual = path.resolve(runRoot);
  if (actual !== expected) throw new Error("transport control run-root cleanup path is invalid");
  await requireOwnedDirectory(runParent, runParentTicket, "transport control run parent");
  await requireOwnedDirectory(actual, runRootTicket, "transport control run root");
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

export async function createJoenessM4TransportControlDefaultRuntime(options) {
  const data = exactObject(options, [
    "plan", "repositoryRoot", "sourceCodexHome", "runParent", "cleanupState", "operations",
  ], "transport control default runtime options");
  validateJoenessM4TransportControlLivePlan(data.plan);
  const runId = data.plan.id;
  const codexVersion = data.plan.runtime.codexVersion;
  if (typeof data.repositoryRoot !== "string" || !path.isAbsolute(data.repositoryRoot)) {
    fail("transport control repository root must be absolute");
  }
  if (typeof data.sourceCodexHome !== "string" || !path.isAbsolute(data.sourceCodexHome)) {
    fail("transport control source Codex home must be absolute");
  }
  if (typeof data.runParent !== "string" || !path.isAbsolute(data.runParent)) {
    fail("transport control run parent must be absolute");
  }
  if (
    data.cleanupState === null ||
    typeof data.cleanupState !== "object" ||
    utilTypes.isProxy(data.cleanupState) ||
    Array.isArray(data.cleanupState)
  ) fail("transport control cleanup state must be an object");
  const injected = exactObject(data.operations, [
    "createExclusiveRunRoot", "prepareRuntime", "openAppServer",
    "removeIsolatedCodexHome", "removeRunRoot",
  ], "transport control runtime operations");
  const operations = {
    createExclusiveRunRoot: injected.createExclusiveRunRoot ?? createExclusiveRunRoot,
    prepareRuntime: injected.prepareRuntime ?? prepareRuntime,
    openAppServer: injected.openAppServer ?? openAppServer,
    removeIsolatedCodexHome: injected.removeIsolatedCodexHome ?? removeIsolatedCodexHome,
    removeRunRoot: injected.removeRunRoot ?? removeOwnedRunRoot,
  };
  for (const [name, operation] of Object.entries(operations)) {
    if (typeof operation !== "function") fail(`transport control runtime operation ${name} is invalid`);
  }
  const sourceHomeTicket = await captureOwnedDirectory(
    data.sourceCodexHome,
    data.sourceCodexHome,
    "transport control source home",
  );
  const runParentTicket = await captureOwnedDirectory(
    data.runParent,
    data.runParent,
    "transport control run parent",
  );
  const sourceCodexHome = sourceHomeTicket.resolvedPath;
  const runParent = runParentTicket.resolvedPath;
  if (operations.prepareRuntime === prepareRuntime) {
    const collectorHome = process.env.CODEX_HOME ?? path.join(homedir(), ".codex");
    const [selected, actual] = await Promise.all([
      realpath(sourceCodexHome),
      realpath(collectorHome),
    ]);
    if (selected !== actual) throw new Error("transport control source home differs from collector source home");
  }
  await requireOwnedDirectory(sourceCodexHome, sourceHomeTicket, "transport control source home");
  await requireOwnedDirectory(runParent, runParentTicket, "transport control run parent");
  const sourceConfigBefore = await snapshotJoenessM4TransportControlSourceConfig({
    sourceCodexHome,
  });
  await requireOwnedDirectory(sourceCodexHome, sourceHomeTicket, "transport control source home");
  await requireOwnedDirectory(runParent, runParentTicket, "transport control run parent");
  data.cleanupState.sourceConfigBefore = Object.freeze({ ...sourceConfigBefore });
  let runRoot;
  let runRootTicket = null;
  let prepared;
  let isolatedParentTicket = null;
  let isolatedHomeTicket = null;
  let session;
  let openAttempted = false;
  const readSourceConfig = () => snapshotJoenessM4TransportControlSourceConfig({
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
        await requireOwnedDirectory(sourceCodexHome, sourceHomeTicket, "transport control source home");
        await requireOwnedDirectory(isolatedParent, isolatedParentTicket, "transport control isolated parent");
        await requireOwnedDirectory(isolatedHome, isolatedHomeTicket, "transport control isolated home");
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
          throw new Error("transport control isolated home readback is not absent");
        }
      } catch (error) { errors.push(error); }
    }
    try {
      await requireOwnedDirectory(runParent, runParentTicket, "transport control run parent");
      await requireOwnedDirectory(runRoot, runRootTicket, "transport control run root");
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
      if (!(await pathIsAbsent(runRoot))) throw new Error("transport control run-root readback is not absent");
    } catch (error) { errors.push(error); }
    let sourceConfigAfter;
    try {
      await requireOwnedDirectory(sourceCodexHome, sourceHomeTicket, "transport control source home");
      sourceConfigAfter = await readSourceConfig();
      await requireOwnedDirectory(sourceCodexHome, sourceHomeTicket, "transport control source home");
      if (
        sourceConfigAfter.bytes !== sourceConfigBefore.bytes ||
        sourceConfigAfter.sha256 !== sourceConfigBefore.sha256
      ) throw new Error("transport control source config changed during runtime");
    } catch (error) { errors.push(error); }
    if (errors.length > 0) {
      throw new AggregateError(errors, "transport control owned runtime cleanup was not fully safe", {
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
    await requireOwnedDirectory(runParent, runParentTicket, "transport control run parent");
    runRoot = await operations.createExclusiveRunRoot(runId, runParent);
    const expectedRunRoot = path.join(runParent, `joewrks-eval-${runId}`);
    runRootTicket = await captureOwnedDirectory(
      runRoot,
      expectedRunRoot,
      "transport control acquired run root",
    );
    runRoot = runRootTicket.resolvedPath;
    await requireOwnedDirectory(runParent, runParentTicket, "transport control run parent");
    await requireOwnedDirectory(sourceCodexHome, sourceHomeTicket, "transport control source home");
    await requireOwnedDirectory(runRoot, runRootTicket, "transport control acquired run root");
    await requireOwnedDirectory(runParent, runParentTicket, "transport control run parent");
    prepared = await operations.prepareRuntime(runRoot, {
      expectedCodexVersion: codexVersion,
    });
    await requireOwnedDirectory(sourceCodexHome, sourceHomeTicket, "transport control source home");
    await requireOwnedDirectory(runParent, runParentTicket, "transport control run parent");
    await requireOwnedDirectory(runRoot, runRootTicket, "transport control acquired run root");
    const isolatedProperty = diagnosticOwnData(prepared, "isolatedCodexHome");
    if (isolatedProperty.state !== "data" || typeof isolatedProperty.value !== "string") {
      throw new Error("transport control prepared isolated home is unavailable");
    }
    const isolatedParent = path.join(sourceCodexHome, ".eval-runtime");
    const expectedIsolatedHome = path.join(
      isolatedParent,
      `${path.basename(runRoot)}-controller-codex-home`,
    );
    await requireOwnedDirectory(sourceCodexHome, sourceHomeTicket, "transport control source home");
    isolatedParentTicket = await captureOwnedDirectory(
      isolatedParent,
      isolatedParent,
      "transport control acquired isolated parent",
    );
    if (
      comparableResolvedPath(path.dirname(isolatedParentTicket.resolvedPath)) !==
      comparableResolvedPath(sourceHomeTicket.resolvedPath)
    ) throw new Error("transport control isolated parent is not confined to the source home");
    isolatedHomeTicket = await captureOwnedDirectory(
      isolatedProperty.value,
      expectedIsolatedHome,
      "transport control acquired isolated home",
    );
    await requireOwnedDirectory(sourceCodexHome, sourceHomeTicket, "transport control source home");
    await requireOwnedDirectory(runParent, runParentTicket, "transport control run parent");
    await requireOwnedDirectory(runRoot, runRootTicket, "transport control acquired run root");
    await requireOwnedDirectory(isolatedParent, isolatedParentTicket, "transport control acquired isolated parent");
    await requireOwnedDirectory(isolatedHomeTicket.resolvedPath, isolatedHomeTicket, "transport control acquired isolated home");
    openAttempted = true;
    session = await operations.openAppServer(prepared);
  } catch (error) {
    const closeConfirmed = confirmedAppServerCloseFromError(error);
    if (runRoot && (!openAttempted || closeConfirmed)) {
      try { await cleanupOwned(openAttempted ? 1 : 0, closeConfirmed ? 1 : 0); }
      catch (cleanupError) {
        throw new AggregateError([error, cleanupError], "transport control partial runtime cleanup failed", {
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
      if (safe !== true) fail("transport control runtime finish requires safe cleanup");
      finishPromise ??= (async () => {
        let closeError = null;
        try { await session.close(); } catch (error) { closeError = error; }
        if (session.processCloseConfirmed !== true) {
          if (closeError) throw closeError;
          throw new Error("transport control app server close is unconfirmed");
        }
        await cleanupOwned(1, 1);
        if (closeError) throw closeError;
        if (session.processExitCode !== 0) throw new Error("transport control app server exit is not zero");
      })();
      return finishPromise;
    },
  };
}

function tryRebuildFreshFailure(value) {
  const topKeys = [
    "schemaVersion", "provenance", "runnerStage", "evidenceState", "lifecycle",
    "eventCounts", "normalizerBlocker", "runtimeErrorOrigin", "blockers",
    "appServerExit", "primaryCauseKind", "retention",
  ];
  const data = diagnosticExactObject(value, topKeys);
  if (
    data === null ||
    data.schemaVersion !== 3 ||
    data.provenance !== "transport-control-runner-observed-default-fresh-adapter-rejection" ||
    data.runnerStage !== "fresh-turn-rejected" ||
    data.evidenceState !== "retained"
  ) return null;
  const lifecycle = diagnosticExactObject(data.lifecycle, [
    "threadStart", "turnStart", "terminal", "terminalCountState",
  ]);
  const eventCounts = diagnosticExactObject(data.eventCounts, [
    "observed", "retained", "retainedOverLimit",
  ]);
  const normalizer = diagnosticExactObject(data.normalizerBlocker, ["provenance", "classification"]);
  const origin = diagnosticExactObject(data.runtimeErrorOrigin, ["provenance", "classification"]);
  const blockers = diagnosticExactObject(data.blockers, ["count", "codes", "unclassifiedCount"]);
  const retentionKeys = [
    "rawOutputPersisted", "rawEventsPersisted", "threadTurnProcessIdentifiersPersisted",
    "absolutePathsPersisted", "rawEventOrOutputDigestsPersisted", "rawStderrPersisted",
    "configContentsPersisted",
  ];
  const retention = diagnosticExactObject(data.retention, retentionKeys);
  const codes = blockers === null ? null : diagnosticArray(blockers.codes, FRESH_BLOCKER_CODES.length);
  if (
    lifecycle === null ||
    eventCounts === null ||
    normalizer === null ||
    origin === null ||
    blockers === null ||
    retention === null ||
    codes === null
  ) return null;
  if (
    !["observed", "not-observed"].includes(lifecycle.threadStart) ||
    !["observed", "not-observed"].includes(lifecycle.turnStart) ||
    !["completed", "missing", "non-completed", "ambiguous"].includes(lifecycle.terminal) ||
    !["zero", "one", "multiple"].includes(lifecycle.terminalCountState) ||
    (lifecycle.turnStart === "observed" && lifecycle.threadStart !== "observed") ||
    (lifecycle.terminal !== "missing" && lifecycle.turnStart !== "observed") ||
    (lifecycle.terminal === "missing" && lifecycle.terminalCountState !== "zero") ||
    (["completed", "non-completed"].includes(lifecycle.terminal) && lifecycle.terminalCountState !== "one") ||
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
    origin.provenance !== "runner-projected-default-adapter-retained-events-fixed-enum" ||
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
    !["syntax-error", "type-error", "aggregate-error", "error", "unverified"].includes(data.primaryCauseKind) ||
    retentionKeys.some((key) => retention[key] !== false)
  ) return null;
  const rebuilt = {
    schemaVersion: 3,
    provenance: "transport-control-runner-observed-default-fresh-adapter-rejection",
    runnerStage: "fresh-turn-rejected",
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
  return Buffer.byteLength(JSON.stringify(rebuilt)) <= 2048 ? rebuilt : null;
}

export function rebuildJoenessM4TransportControlDelegatedBlockedReceipt() {
  const value = arguments[0];
  const required = ["schemaVersion", "status", "phase", "safeCleanup", "cause"];
  if (value === null || typeof value !== "object" || utilTypes.isProxy(value) || Array.isArray(value)) {
    fail("transport control delegated receipt must be a safe plain object");
  }
  let prototype;
  try { prototype = Object.getPrototypeOf(value); } catch { fail("transport control delegated receipt is unsafe"); }
  if (prototype !== Object.prototype && prototype !== null) fail("transport control delegated receipt must be plain");
  const data = Object.create(null);
  for (const key of required) {
    const property = diagnosticOwnData(value, key);
    if (property.state !== "data") fail("transport control delegated receipt is incomplete or unsafe");
    data[key] = property.value;
  }
  const cause = diagnosticExactObject(data.cause, ["category"]);
  if (
    data.schemaVersion !== 1 ||
    data.status !== "blocked" ||
    data.safeCleanup !== true ||
    !["post-runtime-validation", "runtime-factory"].includes(data.phase) ||
    cause === null ||
    (data.phase === "runtime-factory" && cause.category !== "runtime-factory-failed") ||
    (data.phase === "post-runtime-validation" && !["contract-validation", "evaluation-failed"].includes(cause.category))
  ) fail("transport control delegated receipt contract is invalid");
  const rebuilt = {
    schemaVersion: 1,
    status: "blocked",
    phase: data.phase,
    safeCleanup: true,
    cause: { category: cause.category },
  };
  if (data.phase !== "post-runtime-validation") return rebuilt;
  const freshProperty = diagnosticOwnData(value, "freshFailure");
  if (freshProperty.state !== "data") return rebuilt;
  const fresh = tryRebuildFreshFailure(freshProperty.value);
  if (fresh !== null) rebuilt.freshFailure = fresh;
  return rebuilt;
}

function snapshotExecutionBoundary(value) {
  const data = exactObject(value, ["plan", "executionSource", "outputsAbsent"], "transport control boundary receipt");
  const plan = cloneSafeData(
    validateJoenessM4TransportControlLivePlan(data.plan),
    "transport control boundary plan",
  );
  if (data.outputsAbsent !== true) fail("transport control boundary outputs must be absent");
  const source = exactObject(data.executionSource, [
    "planImplementationCommit", "executionHead", "executionHeadParent", "plan",
    "predecessor", "implementationSourcesMatchSupportPlanAndWorking",
  ], "transport control execution source");
  commit(source.planImplementationCommit, "transport control execution source support");
  commit(source.executionHead, "transport control execution source head");
  commit(source.executionHeadParent, "transport control execution source parent");
  if (
    source.planImplementationCommit !== plan.source.planImplementationCommit ||
    source.executionHeadParent !== source.planImplementationCommit ||
    source.executionHead === source.planImplementationCommit ||
    source.implementationSourcesMatchSupportPlanAndWorking !== true
  ) fail("transport control execution source lineage is invalid");
  const planTuple = digestTuple(
    source.plan,
    JOENESS_M4_TRANSPORT_CONTROL_LIVE_PLAN_PATH,
    "transport control execution plan tuple",
  );
  const predecessor = exactObject(source.predecessor, [
    "id", "implementationCommit", "executionHead", "persistenceCommit", "plan",
    "blockedArtifact", "attemptIndex", "sameCommandRetryAuthorized",
    "artifactsMatchSupportPlanAndWorking", "executionHeadIsAncestorOfSupport",
    "persistenceCommitIsAncestorOfSupport",
  ], "transport control execution predecessor");
  for (const key of ["id", "implementationCommit", "executionHead", "persistenceCommit"]) {
    exactString(predecessor[key], PREDECESSOR[key], `transport control execution predecessor.${key}`);
  }
  equalTuple(predecessor.plan, PREDECESSOR.plan, "transport control execution predecessor.plan");
  equalTuple(
    predecessor.blockedArtifact,
    PREDECESSOR.blockedArtifact,
    "transport control execution predecessor.blockedArtifact",
  );
  equalTuple(
    predecessor.attemptIndex,
    PREDECESSOR.attemptIndex,
    "transport control execution predecessor.attemptIndex",
  );
  if (
    predecessor.sameCommandRetryAuthorized !== false ||
    predecessor.artifactsMatchSupportPlanAndWorking !== true ||
    predecessor.executionHeadIsAncestorOfSupport !== true ||
    predecessor.persistenceCommitIsAncestorOfSupport !== true
  ) fail("transport control execution predecessor state is invalid");
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
        blockedArtifact: { ...PREDECESSOR.blockedArtifact },
        attemptIndex: { ...PREDECESSOR.attemptIndex },
        sameCommandRetryAuthorized: false,
        artifactsMatchSupportPlanAndWorking: true,
        executionHeadIsAncestorOfSupport: true,
        persistenceCommitIsAncestorOfSupport: true,
      },
      implementationSourcesMatchSupportPlanAndWorking: true,
    },
    outputsAbsent: true,
  };
}

function sameExecutionBoundary(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
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
    "transport control cleanup state",
  );
  const before = configTuple(data.sourceConfigBefore, "transport control cleanup config before");
  const after = configTuple(data.sourceConfigAfter, "transport control cleanup config after");
  const receipt = exactObject(data.receipt, [
    "appServerLaunchCount", "appServerCloseConfirmedCount", "remainingOwnedProcessCount",
    "isolatedCodexHomeReadback", "runRootReadback",
  ], "transport control cleanup receipt");
  if (
    before.bytes !== after.bytes ||
    before.sha256 !== after.sha256 ||
    ![0, 1].includes(receipt.appServerLaunchCount) ||
    receipt.appServerCloseConfirmedCount !== receipt.appServerLaunchCount ||
    receipt.remainingOwnedProcessCount !== 0 ||
    receipt.isolatedCodexHomeReadback !== "absent" ||
    receipt.runRootReadback !== "absent" ||
    (requireLaunch && receipt.appServerLaunchCount !== 1)
  ) fail("transport control cleanup evidence is not safe");
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

function durableSuccessEvidence(base, plan, executionSource, cleanupState) {
  const retained = cloneSafeData(base, "transport control delegated success evidence");
  const cleanup = snapshotCleanupState(cleanupState, { requireLaunch: true });
  return {
    ...retained,
    executionSource: cloneSafeData(executionSource, "transport control durable execution source"),
    runtime: durableRuntime(plan, cleanup),
    resultBoundary: cloneSafeData(plan.resultBoundary, "transport control durable result boundary"),
    privacy: {
      configContentsPersisted: false,
      processIdentifiersPersisted: false,
      absolutePathsPersisted: false,
      rawStderrPersisted: false,
    },
  };
}

function durableBlockedEvidence(base, plan, executionSource, cleanupState, retainFreshFailure) {
  const rebuilt = rebuildJoenessM4TransportControlDelegatedBlockedReceipt(base);
  const cleanup = snapshotCleanupState(cleanupState, { requireLaunch: rebuilt.phase !== "runtime-factory" });
  const freshFailure = retainFreshFailure ? rebuilt.freshFailure : undefined;
  return {
    schemaVersion: 1,
    status: "blocked",
    phase: rebuilt.phase,
    safeCleanup: true,
    cause: { category: rebuilt.cause.category },
    ...(freshFailure === undefined ? {} : { freshFailure }),
    executionSource: cloneSafeData(executionSource, "transport control blocked execution source"),
    runtime: durableRuntime(plan, cleanup),
    resultBoundary: cloneSafeData(plan.resultBoundary, "transport control blocked result boundary"),
    privacy: {
      configContentsPersisted: false,
      processIdentifiersPersisted: false,
      absolutePathsPersisted: false,
      rawStderrPersisted: false,
    },
  };
}

export async function preflightJoenessM4TransportControlLive(options) {
  const data = exactObject(
    options,
    ["repositoryRoot", "planPath", "sourceCodexHome", "operations"],
    "transport control preflight options",
  );
  const injected = subsetObject(data.operations, ["verifyExecutionBoundary"], "transport control preflight operations");
  const verifyExecutionBoundary = injected.verifyExecutionBoundary ?? verifyJoenessM4TransportControlExecutionBoundary;
  if (typeof verifyExecutionBoundary !== "function") fail("transport control preflight verifier is invalid");
  const boundary = snapshotExecutionBoundary(await verifyExecutionBoundary({
    repositoryRoot: data.repositoryRoot,
    planPath: data.planPath,
  }));
  const sourceConfig = await snapshotJoenessM4TransportControlSourceConfig({
    sourceCodexHome: data.sourceCodexHome,
  });
  return assertArtifactPrivacy({
    mode: "preflight",
    id: boundary.plan.id,
    executionSource: boundary.executionSource,
    sourceConfig,
    outputsAbsent: true,
    runtime: boundary.plan.runtime,
    resultBoundary: boundary.plan.resultBoundary,
  }, "transport control preflight receipt");
}

export async function runJoenessM4TransportControlLive(options) {
  const data = exactObject(options, [
    "repositoryRoot", "planPath", "sourceCodexHome", "runParent", "operations",
  ], "transport control live options");
  if (typeof data.repositoryRoot !== "string" || !path.isAbsolute(data.repositoryRoot)) {
    fail("transport control live repository root must be absolute");
  }
  exactString(data.planPath, JOENESS_M4_TRANSPORT_CONTROL_LIVE_PLAN_PATH, "transport control live plan path");
  if (typeof data.sourceCodexHome !== "string" || !path.isAbsolute(data.sourceCodexHome)) {
    fail("transport control live source Codex home must be absolute");
  }
  if (typeof data.runParent !== "string" || !path.isAbsolute(data.runParent)) {
    fail("transport control live run parent must be absolute");
  }
  const allowedOperations = [
    "verifyExecutionBoundary", "createRuntime", "runEvaluator", "runTurn",
    "publishSuccess", "publishBlocked", "runnerGitStatus", "runnerGitIdentity",
    "runnerGitReadBlob", "runnerArtifactExists",
  ];
  const injected = subsetObject(data.operations, allowedOperations, "transport control live operations");
  const operations = {
    verifyExecutionBoundary: injected.verifyExecutionBoundary ?? verifyJoenessM4TransportControlExecutionBoundary,
    createRuntime: injected.createRuntime ?? createJoenessM4TransportControlDefaultRuntime,
    runEvaluator: injected.runEvaluator ?? runJoenessM4TransportControlEval,
    runTurn: injected.runTurn ?? runFreshEvaluatorTurn,
    publishSuccess: injected.publishSuccess ?? publishJoenessM4TransportControlSuccessArtifacts,
    publishBlocked: injected.publishBlocked ?? publishJoenessM4TransportControlBlockedArtifact,
    runnerGitStatus: injected.runnerGitStatus,
    runnerGitIdentity: injected.runnerGitIdentity,
    runnerGitReadBlob: injected.runnerGitReadBlob,
    runnerArtifactExists: injected.runnerArtifactExists,
  };
  for (const name of [
    "verifyExecutionBoundary", "createRuntime", "runEvaluator", "runTurn",
    "publishSuccess", "publishBlocked",
  ]) {
    if (typeof operations[name] !== "function") fail(`transport control live operation ${name} is invalid`);
  }
  for (const name of ["runnerGitStatus", "runnerGitIdentity", "runnerGitReadBlob", "runnerArtifactExists"]) {
    if (operations[name] !== undefined && typeof operations[name] !== "function") {
      fail(`transport control live operation ${name} is invalid`);
    }
  }

  const boundaryOptions = { repositoryRoot: data.repositoryRoot, planPath: data.planPath };
  const initial = snapshotExecutionBoundary(await operations.verifyExecutionBoundary(boundaryOptions));
  const plan = initial.plan;
  const initialIdentity = JSON.stringify(initial);
  const authenticRunner = operations.runEvaluator === runJoenessM4TransportControlEval;
  const authenticAdapter = operations.runTurn === runFreshEvaluatorTurn;
  const authenticChain = authenticRunner && authenticAdapter;
  const cleanupState = {};
  let runtimeFactoryStarted = false;
  let runtimeFactoryCompleted = false;
  let successPublished = false;
  let blockedPublished = false;

  const executionPlan = {
    schemaVersion: 1,
    id: JOENESS_M4_TRANSPORT_CONTROL_ID,
    outputs: cloneSafeData(plan.outputs, "transport control runner outputs"),
  };
  const sourcePin = {
    repositoryCommit: initial.executionSource.executionHead,
    runner: cloneSafeData(plan.source.controlRunner, "transport control runner source pin"),
  };
  const runtimeFactory = async (runnerOptions) => {
    if (runtimeFactoryStarted) throw new Error("transport control runtime factory may be called exactly once");
    runtimeFactoryStarted = true;
    const runnerData = exactObject(
      runnerOptions,
      ["repositoryRoot", "executionPlan", "sourcePin"],
      "transport control delegated runtime request",
    );
    const request = cloneSafeData(runnerData, "transport control delegated runtime request");
    if (
      request.repositoryRoot !== data.repositoryRoot ||
      JSON.stringify(request.executionPlan) !== JSON.stringify(executionPlan) ||
      JSON.stringify(request.sourcePin) !== JSON.stringify(sourcePin)
    ) throw new Error("transport control delegated runtime request differs from bound source");
    const runtime = await operations.createRuntime({
      plan: cloneSafeData(plan, "transport control runtime plan"),
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
    runtimeFactoryCompleted = true;
    return runtime;
  };
  const revalidate = async () => {
    const current = snapshotExecutionBoundary(await operations.verifyExecutionBoundary(boundaryOptions));
    if (!sameExecutionBoundary(current, initial) || JSON.stringify(current) !== initialIdentity) {
      throw new Error("transport control execution boundary changed after preflight");
    }
    return current;
  };
  const successPublisher = async (publication) => {
    if (!authenticChain) throw new Error("transport control success requires authentic runner and adapter identity");
    const delegated = exactObject(publication, [
      "repositoryRoot", "rawPath", "evidencePath", "rawText", "evidence",
    ], "transport control delegated success publication");
    exactString(delegated.repositoryRoot, data.repositoryRoot, "transport control delegated success root");
    exactString(delegated.rawPath, plan.outputs.raw, "transport control delegated raw path");
    exactString(delegated.evidencePath, plan.outputs.evidence, "transport control delegated evidence path");
    if (typeof delegated.rawText !== "string" || Buffer.byteLength(delegated.rawText) < 1) {
      fail("transport control delegated raw output is invalid");
    }
    const current = await revalidate();
    const evidence = durableSuccessEvidence(
      delegated.evidence,
      plan,
      current.executionSource,
      cleanupState,
    );
    const rawText = assertArtifactPrivacy(delegated.rawText, "transport control raw artifact");
    const safeEvidence = assertArtifactPrivacy(evidence, "transport control evidence artifact");
    const result = await operations.publishSuccess({
      repositoryRoot: data.repositoryRoot,
      rawPath: plan.outputs.raw,
      evidencePath: plan.outputs.evidence,
      rawText,
      evidence: safeEvidence,
    });
    successPublished = true;
    return result;
  };
  const writeArtifact = async (relativePath, value) => {
    exactString(relativePath, plan.outputs.blocked, "transport control delegated blocked path");
    const current = await revalidate();
    const blocked = durableBlockedEvidence(
      value,
      plan,
      current.executionSource,
      cleanupState,
      authenticChain,
    );
    const safeBlocked = assertArtifactPrivacy(blocked, "transport control blocked artifact");
    const result = await operations.publishBlocked({
      repositoryRoot: data.repositoryRoot,
      relativePath: plan.outputs.blocked,
      value: safeBlocked,
    });
    blockedPublished = true;
    return result;
  };

  try {
    const result = await operations.runEvaluator({
      repositoryRoot: data.repositoryRoot,
      executionPlan: cloneSafeData(executionPlan, "transport control execution plan"),
      sourcePin: cloneSafeData(sourcePin, "transport control source pin"),
      runtimeFactory,
      runTurn: operations.runTurn,
      successPublisher,
      writeArtifact,
      ...(operations.runnerGitStatus === undefined ? {} : { gitStatus: operations.runnerGitStatus }),
      ...(operations.runnerGitIdentity === undefined ? {} : { gitIdentity: operations.runnerGitIdentity }),
      ...(operations.runnerGitReadBlob === undefined ? {} : { gitReadBlob: operations.runnerGitReadBlob }),
      ...(operations.runnerArtifactExists === undefined ? {} : { artifactExists: operations.runnerArtifactExists }),
    });
    if (!authenticChain || !successPublished || blockedPublished) {
      throw new Error("transport control evaluator result lacks authentic publication provenance");
    }
    return cloneSafeData(result, "transport control assessment");
  } catch (error) {
    if (
      runtimeFactoryStarted &&
      !runtimeFactoryCompleted &&
      !blockedPublished &&
      !successPublished &&
      cleanupStateIsSafe(cleanupState, { requireLaunch: false })
    ) {
      const current = await revalidate();
      const blocked = durableBlockedEvidence({
        schemaVersion: 1,
        status: "blocked",
        phase: "runtime-factory",
        safeCleanup: true,
        cause: { category: "runtime-factory-failed" },
      }, plan, current.executionSource, cleanupState, false);
      await operations.publishBlocked({
        repositoryRoot: data.repositoryRoot,
        relativePath: plan.outputs.blocked,
        value: assertArtifactPrivacy(blocked, "transport control partial-factory blocked artifact"),
      });
      blockedPublished = true;
    }
    throw error;
  }
}

export async function executeJoenessM4TransportControlLiveCli(options) {
  const data = exactObject(options, [
    "argv", "repositoryRoot", "sourceCodexHome", "runParent", "operations",
  ], "transport control CLI execution options");
  const cli = parseJoenessM4TransportControlLiveCli(data.argv);
  const injected = subsetObject(data.operations, ["preflight", "live"], "transport control CLI execution operations");
  const preflight = injected.preflight ?? preflightJoenessM4TransportControlLive;
  const live = injected.live ?? runJoenessM4TransportControlLive;
  if (typeof preflight !== "function" || typeof live !== "function") {
    fail("transport control CLI execution operations are invalid");
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
  const result = await executeJoenessM4TransportControlLiveCli({
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
    process.stderr.write("m4-transport-control-live-wrapper-failed\n");
    process.exitCode = 1;
  });
}
