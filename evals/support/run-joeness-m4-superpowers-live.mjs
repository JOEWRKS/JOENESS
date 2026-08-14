import { execFile as execFileCallback } from "node:child_process";
import { createHash } from "node:crypto";
import { lstat, open, readFile, realpath, rm } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { promisify, types as utilTypes } from "node:util";

import {
  createExclusiveRunRoot,
  openAppServer,
  prepareRuntime,
  removeIsolatedCodexHome,
} from "./collect-codex-app-server.mjs";
import { runFreshEvaluatorTurn } from "./run-fresh-evaluator-turn.mjs";
import {
  preflightJoenessM4SuperpowersEval,
  publishJoenessM4SuccessArtifacts,
  runJoenessM4SuperpowersEval,
} from "./run-joeness-m4-superpowers-eval.mjs";

const execFile = promisify(execFileCallback);

export const JOENESS_M4_LIVE_RUN_ID = "joeness-m4-superpowers-live-v2";
export const JOENESS_M4_CODEX_VERSION = "codex-cli 0.146.0";

const PLAN_PATH = "evals/skill-contracts/joeness-m4-superpowers-live-plan-v2.json";
const LIVE_METHOD = "bounded-path-private-fresh-failure-stage-and-lifecycle-retention-no-evaluator-contract-change";
const SOURCE_PATHS = Object.freeze({
  runner: "evals/support/run-joeness-m4-superpowers-eval.mjs",
  liveWrapper: "evals/support/run-joeness-m4-superpowers-live.mjs",
  freshTurnAdapter: "evals/support/run-fresh-evaluator-turn.mjs",
  collector: "evals/support/collect-codex-app-server.mjs",
  fixtureManifest: "evals/skill-contracts/fixtures/joeness-m4-superpowers-v1/manifest.json",
});
const OUTPUT_PATHS = Object.freeze({
  raw: "evals/skill-contracts/joeness-m4-superpowers-live-v2-raw.json",
  evidence: "evals/skill-contracts/joeness-m4-superpowers-live-v2-evidence.json",
  blocked: "evals/skill-contracts/joeness-m4-superpowers-live-v2-blocked.json",
});
const PREDECESSOR = Object.freeze({
  id: "joeness-m4-superpowers-live-v1",
  implementationCommit: "6a08c764283bbf2babd9f29765b097de561c9c4e",
  executionHead: "d66b091a05e0724108304456bbff7c7b0ad252e0",
  persistenceCommit: "2a41df1d9fe55ecb4ffe7fd1fc5da5c8bd20cbd4",
  plan: Object.freeze({
    path: "evals/skill-contracts/joeness-m4-superpowers-live-plan-v1.json",
    bytes: 1888,
    sha256: "34d59ba0fd3dfa24973b9ab6e55205ecd3a22da32daf2fa15daaa156273f428c",
  }),
  blockedArtifact: Object.freeze({
    path: "evals/skill-contracts/joeness-m4-superpowers-live-v1-blocked.json",
    bytes: 1384,
    sha256: "590c1a44cf7e9660ee2c6df8a32c63cadfcab881154c16aadefcd8315fdcbec4",
  }),
  attemptIndex: Object.freeze({
    path: "evals/skill-contracts/joeness-m4-superpowers-attempt-index-v1.json",
    bytes: 6230,
    sha256: "5a00e7e526075dedb066107229f80beb61e94d5cd6fc125952693d27ccd66455",
  }),
  sameCommandRetryAuthorized: false,
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
const FRESH_BLOCKER_CODE_INDEX = new Map(
  FRESH_BLOCKER_CODES.map((code, index) => [code, index]),
);

function fail(message) {
  throw new TypeError(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function assertSafeData(value, label = "value", depth = 0) {
  if (depth > 24) fail(`${label} nesting is unsafe`);
  if (value === null || ["string", "boolean"].includes(typeof value)) return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail(`${label} number is unsafe`);
    return;
  }
  if (typeof value !== "object" || utilTypes.isProxy(value)) fail(`${label} is unsafe`);
  let keys;
  try { keys = Reflect.ownKeys(value); } catch { fail(`${label} is unsafe`); }
  if (keys.some((key) => typeof key === "symbol")) fail(`${label} contains symbol keys`);
  if (Array.isArray(value)) {
    const actual = keys.filter((key) => key !== "length");
    const expected = Array.from({ length: value.length }, (_, index) => String(index));
    if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
      fail(`${label} array is sparse or extended`);
    }
  } else if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) {
    fail(`${label} must be a plain object`);
  }
  for (const key of keys) {
    if (key === "length" && Array.isArray(value)) continue;
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(value, key); } catch { fail(`${label} is unsafe`); }
    if (!descriptor || !("value" in descriptor) || descriptor.get || descriptor.set) fail(`${label}.${key} is unsafe`);
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

function exactShallowKeys(value, keys, label) {
  if (
    value === null ||
    Array.isArray(value) ||
    typeof value !== "object" ||
    utilTypes.isProxy(value) ||
    (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)
  ) fail(`${label} must be a plain object`);
  const actual = Reflect.ownKeys(value);
  if (actual.some((key) => typeof key === "symbol")) fail(`${label} contains symbol keys`);
  const expected = [...keys].sort();
  const sorted = [...actual].sort();
  if (sorted.length !== expected.length || sorted.some((key, index) => key !== expected[index])) {
    fail(`${label} has missing or extra keys`);
  }
  for (const key of actual) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !("value" in descriptor) || descriptor.get || descriptor.set) fail(`${label}.${key} is unsafe`);
  }
}

function portableRelative(value, label) {
  if (
    typeof value !== "string" ||
    value.length < 1 ||
    value.length > 180 ||
    value.includes("\\") ||
    value.includes("\0") ||
    path.posix.isAbsolute(value) ||
    /^[A-Za-z]:/u.test(value) ||
    value.split("/").some((part) => !part || part === "." || part === "..")
  ) fail(`${label} is not a portable relative path`);
}

function validateTuple(value, expectedPath, label) {
  exactKeys(value, ["path", "bytes", "sha256"], label);
  if (value.path !== expectedPath) fail(`${label} path is invalid`);
  portableRelative(value.path, `${label}.path`);
  if (!Number.isSafeInteger(value.bytes) || value.bytes < 1 || value.bytes > 1024 * 1024) fail(`${label} bytes are invalid`);
  if (typeof value.sha256 !== "string" || !/^[0-9a-f]{64}$/u.test(value.sha256)) fail(`${label} digest is invalid`);
}

function validatePredecessor(value) {
  exactKeys(
    value,
    ["id", "implementationCommit", "executionHead", "persistenceCommit", "plan", "blockedArtifact", "attemptIndex", "sameCommandRetryAuthorized"],
    "M4 live plan predecessor",
  );
  for (const key of ["id", "implementationCommit", "executionHead", "persistenceCommit", "sameCommandRetryAuthorized"]) {
    if (value[key] !== PREDECESSOR[key]) fail(`M4 live plan predecessor ${key} is invalid`);
  }
  for (const role of ["plan", "blockedArtifact", "attemptIndex"]) {
    const expected = PREDECESSOR[role];
    validateTuple(value[role], expected.path, `M4 live plan predecessor.${role}`);
    if (value[role].bytes !== expected.bytes || value[role].sha256 !== expected.sha256) {
      fail(`M4 live plan predecessor ${role} tuple is invalid`);
    }
  }
}

export function validateJoenessM4LivePlan(value) {
  exactKeys(value, ["schemaVersion", "id", "date", "method", "predecessor", "attempt", "source", "runtime", "outputs", "resultBoundary"], "M4 live plan");
  if (
    value.schemaVersion !== 2 ||
    value.id !== JOENESS_M4_LIVE_RUN_ID ||
    value.date !== "2026-08-14" ||
    value.method !== LIVE_METHOD
  ) fail("M4 live plan identity or method is invalid");
  validatePredecessor(value.predecessor);
  exactKeys(value.attempt, ["freshTurnCount", "retryCount", "automaticRetry"], "M4 live plan attempt");
  if (value.attempt.freshTurnCount !== 1 || value.attempt.retryCount !== 0 || value.attempt.automaticRetry !== false) fail("M4 live plan attempt policy is invalid");
  exactKeys(value.source, ["planImplementationCommit", ...Object.keys(SOURCE_PATHS)], "M4 live plan source");
  if (typeof value.source.planImplementationCommit !== "string" || !/^[0-9a-f]{40}$/u.test(value.source.planImplementationCommit)) fail("M4 live plan source commit is invalid");
  for (const [role, expectedPath] of Object.entries(SOURCE_PATHS)) validateTuple(value.source[role], expectedPath, `M4 live plan source.${role}`);
  exactKeys(value.runtime, ["codexVersion", "projectDocs", "installedPluginActivation", "dynamicTools"], "M4 live plan runtime");
  if (
    value.runtime.codexVersion !== JOENESS_M4_CODEX_VERSION ||
    value.runtime.projectDocs !== "disabled" ||
    value.runtime.installedPluginActivation !== "UNVERIFIED" ||
    !Array.isArray(value.runtime.dynamicTools) ||
    value.runtime.dynamicTools.length !== 0
  ) fail("M4 live plan runtime is invalid");
  exactKeys(value.outputs, Object.keys(OUTPUT_PATHS), "M4 live plan outputs");
  for (const [role, expectedPath] of Object.entries(OUTPUT_PATHS)) {
    if (value.outputs[role] !== expectedPath) fail(`M4 live plan output ${role} is invalid`);
    portableRelative(value.outputs[role], `M4 live plan output ${role}`);
  }
  exactKeys(value.resultBoundary, ["state", "validation", "promotionPass", "corePromotion", "manifestPromotion"], "M4 live plan result boundary");
  if (
    value.resultBoundary.state !== "candidate" ||
    value.resultBoundary.validation !== "unvalidated" ||
    value.resultBoundary.promotionPass !== false ||
    value.resultBoundary.corePromotion !== false ||
    value.resultBoundary.manifestPromotion !== false
  ) fail("M4 live plan promotion boundary is invalid");
  return value;
}

export async function snapshotJoenessM4SourceConfig(options) {
  options ??= {};
  if (utilTypes.isProxy(options)) fail("M4 source config options must not be a proxy");
  exactShallowKeys(options, Object.hasOwn(options, "sourceCodexHome") ? ["sourceCodexHome"] : [], "M4 source config options");
  const sourceCodexHome = options.sourceCodexHome ?? process.env.CODEX_HOME ?? path.join(homedir(), ".codex");
  if (typeof sourceCodexHome !== "string" || !path.isAbsolute(sourceCodexHome)) fail("M4 source Codex home must be absolute");
  const homeStat = await lstat(sourceCodexHome);
  if (!homeStat.isDirectory() || homeStat.isSymbolicLink()) throw new Error("M4 source Codex home must be a real directory");
  const resolvedHome = await realpath(sourceCodexHome);
  const configPath = path.join(resolvedHome, "config.toml");
  const before = await lstat(configPath);
  if (!before.isFile() || before.isSymbolicLink()) throw new Error("M4 source config must be a regular non-symlink file");
  const resolvedConfig = await realpath(configPath);
  const relative = path.relative(resolvedHome, resolvedConfig);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error("M4 source config escapes its home");
  const bytes = await readFile(resolvedConfig);
  const after = await lstat(configPath);
  const readback = await readFile(resolvedConfig);
  const final = await lstat(configPath);
  if (
    !after.isFile() ||
    after.isSymbolicLink() ||
    !final.isFile() ||
    final.isSymbolicLink() ||
    after.size !== bytes.length ||
    before.size !== after.size ||
    final.size !== readback.length ||
    !bytes.equals(readback)
  ) {
    throw new Error("M4 source config changed during snapshot");
  }
  return { bytes: bytes.length, sha256: sha256(bytes) };
}

export async function verifyJoenessM4ExecutionBoundary(options) {
  exactKeys(options, ["repositoryRoot", "planPath"], "M4 execution boundary options");
  const { repositoryRoot, planPath } = options;
  if (typeof repositoryRoot !== "string" || !path.isAbsolute(repositoryRoot)) fail("M4 repository root must be absolute");
  if (planPath !== PLAN_PATH) fail("M4 plan path is invalid");
  const rootStat = await lstat(repositoryRoot);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) fail("M4 repository root must be a real directory");
  const resolvedRoot = await realpath(repositoryRoot);
  const status = await gitText(resolvedRoot, ["status", "--porcelain"]);
  if (status !== "") throw new Error("M4 execution worktree is dirty");
  const executionHead = await gitText(resolvedRoot, ["rev-parse", "HEAD"]);
  if (!/^[0-9a-f]{40}$/u.test(executionHead)) throw new Error("M4 execution HEAD is invalid");

  const planFile = await confinedRegularFile(resolvedRoot, planPath, "M4 live plan");
  const planBytes = await readFile(planFile);
  if (planBytes.length < 1 || planBytes.length > 32 * 1024) throw new Error("M4 live plan size is invalid");
  let plan;
  try { plan = JSON.parse(planBytes.toString("utf8")); } catch (cause) { throw new Error("M4 live plan JSON is malformed", { cause }); }
  validateJoenessM4LivePlan(plan);
  const implementationCommit = plan.source.planImplementationCommit;
  const parentLine = await gitText(resolvedRoot, ["rev-list", "--parents", "-n", "1", executionHead]);
  const parents = parentLine.split(/\s+/u);
  if (parents.length !== 2 || parents[0] !== executionHead || parents[1] !== implementationCommit) {
    throw new Error("M4 execution HEAD must be the direct single-parent child of the implementation commit");
  }
  const diff = await gitText(resolvedRoot, ["diff", "--name-status", implementationCommit, executionHead]);
  if (diff !== `A\t${PLAN_PATH}`) throw new Error("M4 execution commit is not plan-only");
  const committedPlan = await gitBlob(resolvedRoot, executionHead, PLAN_PATH);
  if (!committedPlan.equals(planBytes)) throw new Error("M4 working plan differs from execution HEAD");
  if (await gitBlobExists(resolvedRoot, implementationCommit, PLAN_PATH)) throw new Error("M4 plan already exists in the implementation commit");

  const predecessorExecutionLine = await gitText(
    resolvedRoot,
    ["rev-list", "--parents", "-n", "1", PREDECESSOR.executionHead],
  );
  if (predecessorExecutionLine !== `${PREDECESSOR.executionHead} ${PREDECESSOR.implementationCommit}`) {
    throw new Error("M4 predecessor execution lineage is invalid");
  }
  const predecessorPersistenceLine = await gitText(
    resolvedRoot,
    ["rev-list", "--parents", "-n", "1", PREDECESSOR.persistenceCommit],
  );
  if (predecessorPersistenceLine !== `${PREDECESSOR.persistenceCommit} ${PREDECESSOR.executionHead}`) {
    throw new Error("M4 predecessor persistence lineage is invalid");
  }
  if (!(await gitIsAncestor(resolvedRoot, PREDECESSOR.executionHead, implementationCommit))) {
    throw new Error("M4 predecessor execution head is not an ancestor of generation-v2 support");
  }
  if (!(await gitIsAncestor(resolvedRoot, PREDECESSOR.persistenceCommit, implementationCommit))) {
    throw new Error("M4 predecessor persistence commit is not an ancestor of generation-v2 support");
  }

  for (const [role, pin, commits] of [
    ["plan", PREDECESSOR.plan, [PREDECESSOR.executionHead, PREDECESSOR.persistenceCommit, implementationCommit, executionHead]],
    ["blockedArtifact", PREDECESSOR.blockedArtifact, [PREDECESSOR.persistenceCommit, implementationCommit, executionHead]],
    ["attemptIndex", PREDECESSOR.attemptIndex, [PREDECESSOR.persistenceCommit, implementationCommit, executionHead]],
  ]) {
    for (const commit of commits) {
      const candidate = await gitBlob(resolvedRoot, commit, pin.path);
      if (candidate.length !== pin.bytes || sha256(candidate) !== pin.sha256) {
        throw new Error(`M4 predecessor ${role} pin drift`);
      }
    }
    const workingFile = await confinedRegularFile(resolvedRoot, pin.path, `M4 predecessor ${role}`);
    const working = await readFile(workingFile);
    if (working.length !== pin.bytes || sha256(working) !== pin.sha256) {
      throw new Error(`M4 predecessor ${role} pin drift`);
    }
  }

  for (const [role, expectedPath] of Object.entries(SOURCE_PATHS)) {
    const pin = plan.source[role];
    const [fromB, fromC] = await Promise.all([
      gitBlob(resolvedRoot, implementationCommit, expectedPath),
      gitBlob(resolvedRoot, executionHead, expectedPath),
    ]);
    const workingFile = await confinedRegularFile(resolvedRoot, expectedPath, `M4 source ${role}`);
    const workingStat = await lstat(workingFile);
    if (workingStat.size !== pin.bytes) throw new Error(`M4 source ${role} size drift`);
    const working = await readFile(workingFile);
    for (const candidate of [fromB, fromC, working]) {
      if (candidate.length !== pin.bytes || sha256(candidate) !== pin.sha256) throw new Error(`M4 source ${role} pin drift`);
    }
  }

  for (const outputPath of Object.values(plan.outputs)) {
    if (await gitBlobExists(resolvedRoot, executionHead, outputPath)) throw new Error(`M4 output is already committed: ${outputPath}`);
    await confinedAbsentTarget(resolvedRoot, outputPath, "M4 output");
  }
  const [finalStatus, finalHead, planReadback] = await Promise.all([
    gitText(resolvedRoot, ["status", "--porcelain"]),
    gitText(resolvedRoot, ["rev-parse", "HEAD"]),
    readFile(planFile),
  ]);
  if (finalStatus !== "" || finalHead !== executionHead || !planReadback.equals(planBytes)) {
    throw new Error("M4 execution boundary changed during verification");
  }
  return {
    plan,
    executionSource: {
      planImplementationCommit: implementationCommit,
      executionHead,
      executionHeadParent: implementationCommit,
      plan: { path: PLAN_PATH, bytes: planBytes.length, sha256: sha256(planBytes) },
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

async function gitText(root, args) {
  const { stdout } = await execFile("git", args, { cwd: root, encoding: "utf8", maxBuffer: 1024 * 1024 });
  return stdout.trim();
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

async function gitBlob(root, commit, relativePath) {
  const { stdout } = await execFile("git", ["cat-file", "blob", `${commit}:${relativePath}`], {
    cwd: root,
    encoding: "buffer",
    maxBuffer: 1024 * 1024,
  });
  return Buffer.from(stdout);
}

export async function gitBlobExists(root, commit, relativePath) {
  if (typeof root !== "string" || !path.isAbsolute(root)) fail("M4 Git tree root must be absolute");
  if (typeof commit !== "string" || !/^[0-9a-f]{40}$/u.test(commit)) fail("M4 Git tree commit is invalid");
  portableRelative(relativePath, "M4 Git tree path");
  const { stdout } = await execFile(
    "git",
    ["ls-tree", "-z", "--full-tree", commit, "--", relativePath],
    { cwd: root, encoding: "buffer", maxBuffer: 1024 * 1024, windowsHide: true },
  );
  const output = Buffer.from(stdout);
  if (output.length === 0) return false;
  if (output[output.length - 1] !== 0) throw new Error("M4 Git tree output is not NUL terminated");
  const records = output.subarray(0, -1).toString("utf8").split("\0");
  if (records.length !== 1) throw new Error("M4 Git tree output is ambiguous");
  const separator = records[0].indexOf("\t");
  if (separator < 1) throw new Error("M4 Git tree output is malformed");
  const metadata = records[0].slice(0, separator);
  const returnedPath = records[0].slice(separator + 1);
  if (!/^\d{6} (?:blob|tree|commit) [0-9a-f]{40}$/u.test(metadata) || returnedPath !== relativePath) {
    throw new Error("M4 Git tree output does not match the exact path");
  }
  return true;
}

async function confinedRegularFile(root, relativePath, label) {
  portableRelative(relativePath, `${label}.path`);
  let current = root;
  for (const part of relativePath.split("/")) {
    current = path.join(current, part);
    const stat = await lstat(current);
    if (stat.isSymbolicLink()) throw new Error(`${label} contains a symlink or reparse traversal`);
  }
  const stat = await lstat(current);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`${label} must be a regular file`);
  const resolved = await realpath(current);
  const relative = path.relative(root, resolved);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error(`${label} escapes the repository`);
  return resolved;
}

async function confinedAbsentTarget(root, relativePath, label) {
  portableRelative(relativePath, `${label}.path`);
  const parts = relativePath.split("/");
  const leaf = parts.pop();
  let parent = root;
  for (const part of parts) {
    parent = path.join(parent, part);
    const stat = await lstat(parent);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`${label} parent is unsafe`);
  }
  const resolvedParent = await realpath(parent);
  const relative = path.relative(root, resolvedParent);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error(`${label} parent escapes the repository`);
  const target = path.join(resolvedParent, leaf);
  try {
    await lstat(target);
  } catch (error) {
    if (error?.code === "ENOENT") return target;
    throw error;
  }
  throw new Error(`${label} collision: ${relativePath}`);
}

export async function preflightJoenessM4Live(options) {
  exactShallowKeys(
    options,
    ["repositoryRoot", "planPath", "sourceCodexHome", "operations"],
    "M4 preflight options",
  );
  const injected = options.operations ?? {};
  exactShallowKeys(
    injected,
    options.operations === undefined ? [] : ["verifyExecutionBoundary", "preflightEvaluator"],
    "M4 preflight operations",
  );
  const verifyExecutionBoundary = injected.verifyExecutionBoundary ?? verifyJoenessM4ExecutionBoundary;
  const preflightEvaluator = injected.preflightEvaluator ?? preflightJoenessM4SuperpowersEval;
  if (typeof verifyExecutionBoundary !== "function" || typeof preflightEvaluator !== "function") {
    fail("M4 preflight operations must be functions");
  }
  const boundary = await verifyExecutionBoundary({
    repositoryRoot: options.repositoryRoot,
    planPath: options.planPath,
  });
  await preflightEvaluator({ repositoryRoot: options.repositoryRoot });
  const sourceConfig = await snapshotJoenessM4SourceConfig({ sourceCodexHome: options.sourceCodexHome });
  const receipt = {
    mode: "preflight",
    id: boundary.plan.id,
    executionSource: boundary.executionSource,
    sourceConfig,
    outputsAbsent: boundary.outputsAbsent,
    runtime: boundary.plan.runtime,
    resultBoundary: boundary.plan.resultBoundary,
  };
  assertJoenessM4ArtifactPrivacy(receipt, "M4 preflight receipt");
  return receipt;
}

export async function createJoenessM4DefaultRuntime(options) {
  exactShallowKeys(
    options,
    ["plan", "repositoryRoot", "sourceCodexHome", "runParent", "cleanupState", "operations"],
    "M4 default runtime options",
  );
  const plan = validateJoenessM4LivePlan(options.plan);
  if (typeof options.repositoryRoot !== "string" || !path.isAbsolute(options.repositoryRoot)) {
    fail("M4 repository root must be absolute");
  }
  const sourceCodexHome = options.sourceCodexHome ?? process.env.CODEX_HOME ?? path.join(homedir(), ".codex");
  const runParent = options.runParent ?? tmpdir();
  if (typeof sourceCodexHome !== "string" || !path.isAbsolute(sourceCodexHome)) fail("M4 source Codex home must be absolute");
  if (typeof runParent !== "string" || !path.isAbsolute(runParent)) fail("M4 run parent must be absolute");
  const cleanupState = options.cleanupState ?? {};
  if (cleanupState === null || Array.isArray(cleanupState) || typeof cleanupState !== "object") {
    fail("M4 cleanup state must be an object");
  }
  const injected = options.operations ?? {};
  exactShallowKeys(
    injected,
    options.operations === undefined
      ? []
      : ["createExclusiveRunRoot", "prepareRuntime", "openAppServer", "removeIsolatedCodexHome", "removeRunRoot"],
    "M4 default runtime operations",
  );
  const operations = {
    createExclusiveRunRoot: injected.createExclusiveRunRoot ?? createExclusiveRunRoot,
    prepareRuntime: injected.prepareRuntime ?? prepareRuntime,
    openAppServer: injected.openAppServer ?? openAppServer,
    removeIsolatedCodexHome: injected.removeIsolatedCodexHome ?? removeIsolatedCodexHome,
    removeRunRoot: injected.removeRunRoot ?? removeOwnedRunRoot,
  };
  for (const [name, operation] of Object.entries(operations)) {
    if (typeof operation !== "function") fail(`M4 default runtime operation ${name} must be a function`);
  }

  if (operations.prepareRuntime === prepareRuntime) {
    const collectorSourceCodexHome = process.env.CODEX_HOME ?? path.join(homedir(), ".codex");
    if (typeof collectorSourceCodexHome !== "string" || !path.isAbsolute(collectorSourceCodexHome)) {
      fail("M4 collector-selected source Codex home is invalid");
    }
    const [resolvedSourceCodexHome, resolvedCollectorSourceCodexHome] = await Promise.all([
      realpath(sourceCodexHome),
      realpath(collectorSourceCodexHome),
    ]);
    if (resolvedSourceCodexHome !== resolvedCollectorSourceCodexHome) {
      throw new Error("M4 source Codex home must exactly match the collector-selected home");
    }
  }

  const sourceConfigBefore = await snapshotJoenessM4SourceConfig({ sourceCodexHome });
  cleanupState.sourceConfigBefore = sourceConfigBefore;
  let runRoot;
  let runtime;
  let session;
  let openAttempted = false;
  const readSourceConfig = () => snapshotJoenessM4SourceConfig({ sourceCodexHome });
  const cleanupOwnedRuntime = async ({ launchCount, closeConfirmedCount }) => {
    const isolatedParent = path.join(sourceCodexHome, ".eval-runtime");
    const isolatedCodexHome = runtime?.isolatedCodexHome ?? path.join(
      isolatedParent,
      `${path.basename(runRoot)}-controller-codex-home`,
    );
    const cleanupErrors = [];
    try {
      await operations.removeIsolatedCodexHome(runRoot, isolatedCodexHome, isolatedParent);
    } catch (error) {
      cleanupErrors.push(error);
    }
    try {
      if (!(await pathIsAbsent(isolatedCodexHome))) {
        throw new Error("M4 isolated Codex home cleanup readback failed");
      }
    } catch (error) {
      cleanupErrors.push(error);
    }
    try {
      await operations.removeRunRoot(runRoot, runParent, plan.id);
    } catch (error) {
      cleanupErrors.push(error);
    }
    try {
      if (!(await pathIsAbsent(runRoot))) throw new Error("M4 run-root cleanup readback failed");
    } catch (error) {
      cleanupErrors.push(error);
    }
    let sourceConfigAfter;
    try {
      sourceConfigAfter = await readSourceConfig();
      if (
        sourceConfigAfter.bytes !== sourceConfigBefore.bytes ||
        sourceConfigAfter.sha256 !== sourceConfigBefore.sha256
      ) throw new Error("M4 source config changed during runtime");
    } catch (error) {
      cleanupErrors.push(error);
    }
    if (cleanupErrors.length > 0) {
      throw new AggregateError(cleanupErrors, "M4 owned runtime cleanup was not fully safe", {
        cause: cleanupErrors[0],
      });
    }
    cleanupState.sourceConfigAfter = sourceConfigAfter;
    cleanupState.receipt = {
      appServerLaunchCount: launchCount,
      appServerCloseConfirmedCount: closeConfirmedCount,
      remainingOwnedProcessCount: 0,
      isolatedCodexHomeReadback: "absent",
      runRootReadback: "absent",
    };
  };
  try {
    runRoot = await operations.createExclusiveRunRoot(plan.id, runParent);
    runtime = await operations.prepareRuntime(runRoot, {
      expectedCodexVersion: JOENESS_M4_CODEX_VERSION,
    });
    openAttempted = true;
    session = await operations.openAppServer(runtime);
  } catch (error) {
    const closeConfirmed = confirmedAppServerCloseFromError(error);
    if (runRoot && (!openAttempted || closeConfirmed)) {
      try {
        await cleanupOwnedRuntime({
          launchCount: openAttempted ? 1 : 0,
          closeConfirmedCount: closeConfirmed ? 1 : 0,
        });
      } catch (cleanupError) {
        throw new AggregateError([error, cleanupError], "M4 partial runtime cleanup failed", { cause: error });
      }
    }
    throw error;
  }
  let finishPromise;
  return {
    session,
    sourceConfigBefore,
    readSourceConfig,
    async finish() {
      finishPromise ??= (async () => {
        let closeError = null;
        try { await session.close(); } catch (error) { closeError = error; }
        if (session.processCloseConfirmed !== true) {
          if (closeError) throw closeError;
          throw new Error("M4 app server close was not confirmed successful");
        }
        await cleanupOwnedRuntime({ launchCount: 1, closeConfirmedCount: 1 });
        if (closeError) throw closeError;
        if (session.processExitCode !== 0) throw new Error("M4 app server exit was not successful");
      })();
      return finishPromise;
    },
  };
}

function confirmedAppServerCloseFromError(error) {
  if (error === null || typeof error !== "object" || utilTypes.isProxy(error)) return false;
  let ticketDescriptor;
  try { ticketDescriptor = Object.getOwnPropertyDescriptor(error, "ticketEvidence"); } catch { return false; }
  if (!ticketDescriptor || !("value" in ticketDescriptor)) return false;
  const ticket = ticketDescriptor.value;
  if (ticket === null || typeof ticket !== "object" || utilTypes.isProxy(ticket)) return false;
  let appServerDescriptor;
  try { appServerDescriptor = Object.getOwnPropertyDescriptor(ticket, "appServer"); } catch { return false; }
  if (!appServerDescriptor || !("value" in appServerDescriptor)) return false;
  const appServer = appServerDescriptor.value;
  if (appServer === null || typeof appServer !== "object" || utilTypes.isProxy(appServer)) return false;
  let closeDescriptor;
  try { closeDescriptor = Object.getOwnPropertyDescriptor(appServer, "processCloseConfirmed"); } catch { return false; }
  return Boolean(closeDescriptor && "value" in closeDescriptor && closeDescriptor.value === true);
}

async function pathIsAbsent(target) {
  try {
    await lstat(target);
    return false;
  } catch (error) {
    if (error?.code === "ENOENT") return true;
    throw error;
  }
}

async function removeOwnedRunRoot(runRoot, runParent, runId) {
  if (typeof runId !== "string" || !/^[a-z0-9-]{1,80}$/u.test(runId)) {
    throw new Error("M4 run-root cleanup identity is invalid");
  }
  const expected = path.join(path.resolve(runParent), `joewrks-eval-${runId}`);
  const actual = path.resolve(runRoot);
  if (actual !== expected) throw new Error("M4 run-root cleanup path is invalid");
  const stat = await lstat(actual);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error("M4 run root is not an owned directory");
  await rm(actual, { recursive: true, force: false });
}

export async function runJoenessM4Live(options) {
  exactShallowKeys(
    options,
    ["repositoryRoot", "planPath", "sourceCodexHome", "runParent", "operations"],
    "M4 live options",
  );
  const { repositoryRoot, planPath, sourceCodexHome, runParent } = options;
  const injected = options.operations ?? {};
  exactShallowKeys(
    injected,
    options.operations === undefined
      ? []
      : [
        "verifyExecutionBoundary",
        "preflightEvaluator",
        "createRuntime",
        "runEvaluator",
        "runTurn",
        "publishSuccess",
        "writeBlocked",
      ],
    "M4 live operations",
  );
  const operations = {
    verifyExecutionBoundary: injected.verifyExecutionBoundary ?? verifyJoenessM4ExecutionBoundary,
    preflightEvaluator: injected.preflightEvaluator ?? preflightJoenessM4SuperpowersEval,
    createRuntime: injected.createRuntime ?? createJoenessM4DefaultRuntime,
    runEvaluator: injected.runEvaluator ?? runJoenessM4SuperpowersEval,
    runTurn: injected.runTurn ?? runFreshEvaluatorTurn,
    publishSuccess: injected.publishSuccess ?? publishJoenessM4SuccessArtifacts,
    writeBlocked: injected.writeBlocked ?? writeJoenessM4BlockedArtifact,
  };
  for (const [name, operation] of Object.entries(operations)) {
    if (typeof operation !== "function") fail(`M4 live operation ${name} must be a function`);
  }
  const retainDelegatedFreshFailure = operations.runEvaluator === runJoenessM4SuperpowersEval;
  const boundaryOptions = { repositoryRoot, planPath };
  const initial = await operations.verifyExecutionBoundary(boundaryOptions);
  await operations.preflightEvaluator({ repositoryRoot });
  const plan = initial.plan;
  const cleanupState = {};
  let runtimeFactoryStarted = false;
  let runtimeFactoryCompleted = false;
  let blockedPublished = false;
  const runtimeFactory = async () => {
    if (runtimeFactoryStarted) throw new Error("M4 runtime factory may be called exactly once");
    runtimeFactoryStarted = true;
    const runtime = await operations.createRuntime({
      plan,
      repositoryRoot,
      sourceCodexHome,
      runParent,
      cleanupState,
      operations: undefined,
    });
    runtimeFactoryCompleted = true;
    return runtime;
  };
  const revalidate = async () => {
    const current = await operations.verifyExecutionBoundary(boundaryOptions);
    if (
      current.executionSource.planImplementationCommit !== initial.executionSource.planImplementationCommit ||
      current.executionSource.executionHead !== initial.executionSource.executionHead ||
      current.executionSource.plan.sha256 !== initial.executionSource.plan.sha256
    ) throw new Error("M4 execution boundary changed after preflight");
    return current;
  };
  const successPublisher = async (publication) => {
    exactShallowKeys(
      publication,
      ["repositoryRoot", "rawPath", "evidencePath", "rawText", "evidence"],
      "M4 delegated success publication",
    );
    const current = await revalidate();
    const evidence = joenessM4DurableEvidence(publication.evidence, plan, current.executionSource, cleanupState);
    assertJoenessM4ArtifactPrivacy(publication.rawText, "M4 raw artifact");
    assertJoenessM4ArtifactPrivacy(evidence, "M4 evidence artifact");
    return operations.publishSuccess({ ...publication, evidence });
  };
  const writeArtifact = async (relativePath, value) => {
    await revalidate();
    const blocked = joenessM4BlockedEvidence(
      value,
      plan,
      initial.executionSource,
      cleanupState,
      retainDelegatedFreshFailure,
    );
    assertJoenessM4ArtifactPrivacy(blocked, "M4 blocked artifact");
    const result = await operations.writeBlocked(repositoryRoot, relativePath, blocked);
    blockedPublished = true;
    return result;
  };
  try {
    return await operations.runEvaluator({
      repositoryRoot,
      executionPlan: { schemaVersion: 1, id: plan.id, outputs: plan.outputs },
      sourcePin: {
        repositoryCommit: initial.executionSource.executionHead,
        runner: plan.source.runner,
      },
      runtimeFactory,
      runTurn: operations.runTurn,
      successPublisher,
      writeArtifact,
    });
  } catch (error) {
    if (
      runtimeFactoryStarted &&
      !runtimeFactoryCompleted &&
      !blockedPublished &&
      cleanupStateIsSafe(cleanupState)
    ) {
      const current = await revalidate();
      const blocked = joenessM4BlockedEvidence({
        schemaVersion: 1,
        status: "blocked",
        phase: "runtime-factory",
        safeCleanup: true,
        cause: { category: "runtime-factory-failed" },
      }, plan, current.executionSource, cleanupState, false);
      assertJoenessM4ArtifactPrivacy(blocked, "M4 partial-factory blocked artifact");
      await operations.writeBlocked(repositoryRoot, plan.outputs.blocked, blocked);
      blockedPublished = true;
    }
    throw error;
  }
}

function cleanupStateIsSafe(cleanupState) {
  try {
    assertSafeData(cleanupState, "M4 cleanup state");
    const before = cleanupState.sourceConfigBefore;
    const after = cleanupState.sourceConfigAfter;
    const receipt = cleanupState.receipt;
    return Boolean(
      before &&
      after &&
      before.bytes === after.bytes &&
      before.sha256 === after.sha256 &&
      receipt?.appServerLaunchCount === receipt?.appServerCloseConfirmedCount &&
      receipt?.remainingOwnedProcessCount === 0 &&
      receipt?.isolatedCodexHomeReadback === "absent" &&
      receipt?.runRootReadback === "absent"
    );
  } catch {
    return false;
  }
}

function joenessM4DurableEvidence(base, plan, executionSource, cleanupState) {
  assertSafeData(base, "M4 delegated evidence");
  if (!cleanupState.receipt || !cleanupState.sourceConfigBefore || !cleanupState.sourceConfigAfter) {
    throw new Error("M4 runtime cleanup evidence is incomplete");
  }
  return {
    ...base,
    executionSource,
    runtime: {
      codexVersion: plan.runtime.codexVersion,
      freshTurnCount: plan.attempt.freshTurnCount,
      retryCount: plan.attempt.retryCount,
      dynamicToolCount: plan.runtime.dynamicTools.length,
      sourceConfigBefore: cleanupState.sourceConfigBefore,
      sourceConfigAfter: cleanupState.sourceConfigAfter,
      sourceConfigReadback: "UNCHANGED",
      cleanup: cleanupState.receipt,
    },
    resultBoundary: plan.resultBoundary,
    privacy: {
      configContentsPersisted: false,
      processIdentifiersPersisted: false,
      absolutePathsPersisted: false,
      rawStderrPersisted: false,
    },
  };
}

function hasSelectedDataProperties(value, keys) {
  if (
    value === null ||
    typeof value !== "object" ||
    utilTypes.isProxy(value) ||
    Array.isArray(value)
  ) return false;
  let prototype;
  try { prototype = Object.getPrototypeOf(value); } catch { return false; }
  if (prototype !== Object.prototype && prototype !== null) return false;
  for (const key of keys) {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(value, key); } catch { return false; }
    if (!descriptor || !("value" in descriptor) || descriptor.get || descriptor.set) return false;
  }
  return true;
}

function boundedFreshBlockerCodes(value) {
  if (value === null || typeof value !== "object" || utilTypes.isProxy(value)) return null;
  let prototype;
  let lengthDescriptor;
  try {
    prototype = Object.getPrototypeOf(value);
    lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length");
  } catch {
    return null;
  }
  if (
    !Array.isArray(value) ||
    prototype !== Array.prototype ||
    !lengthDescriptor ||
    !("value" in lengthDescriptor) ||
    !Number.isSafeInteger(lengthDescriptor.value) ||
    lengthDescriptor.value < 0 ||
    lengthDescriptor.value > FRESH_BLOCKER_CODES.length
  ) return null;
  const length = lengthDescriptor.value;
  const result = [];
  let previousIndex = -1;
  for (let index = 0; index < length; index += 1) {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(value, String(index)); } catch { return null; }
    if (!descriptor || !("value" in descriptor) || descriptor.get || descriptor.set) return null;
    const codeIndex = FRESH_BLOCKER_CODE_INDEX.get(descriptor.value);
    if (codeIndex === undefined || codeIndex <= previousIndex) return null;
    previousIndex = codeIndex;
    result.push(descriptor.value);
  }
  return result;
}

function rebuildFreshFailure(value) {
  const keys = [
    "schemaVersion", "provenance", "runnerStage", "evidenceState", "lifecycle",
    "eventCounts", "blockers", "appServerExit", "primaryCauseKind", "retention",
  ];
  if (!hasSelectedDataProperties(value, keys)) return null;
  if (
    value.schemaVersion !== 1 ||
    value.provenance !== "runner-observed-default-fresh-adapter-rejection" ||
    value.runnerStage !== "fresh-turn-rejected" ||
    value.evidenceState !== "retained"
  ) return null;

  if (!hasSelectedDataProperties(
    value.lifecycle,
    ["threadStart", "turnStart", "terminal", "terminalCountState"],
  )) return null;
  const lifecycle = {
    threadStart: value.lifecycle.threadStart,
    turnStart: value.lifecycle.turnStart,
    terminal: value.lifecycle.terminal,
    terminalCountState: value.lifecycle.terminalCountState,
  };
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

  if (!hasSelectedDataProperties(
    value.eventCounts,
    ["observed", "retained", "retainedOverLimit"],
  )) return null;
  const eventCounts = {
    observed: value.eventCounts.observed,
    retained: value.eventCounts.retained,
    retainedOverLimit: value.eventCounts.retainedOverLimit,
  };
  if (
    !Number.isSafeInteger(eventCounts.observed) ||
    eventCounts.observed < 0 ||
    !Number.isSafeInteger(eventCounts.retained) ||
    eventCounts.retained < 0 ||
    eventCounts.retained > eventCounts.observed ||
    typeof eventCounts.retainedOverLimit !== "boolean" ||
    eventCounts.retainedOverLimit !== (eventCounts.retained > 512) ||
    (lifecycle.terminal !== "missing" && eventCounts.observed < 1)
  ) return null;

  if (!hasSelectedDataProperties(
    value.blockers,
    ["count", "codes", "unclassifiedCount"],
  )) return null;
  const blockerCodes = boundedFreshBlockerCodes(value.blockers.codes);
  const blockerCount = value.blockers.count;
  const unclassifiedCount = value.blockers.unclassifiedCount;
  if (blockerCodes === null) return null;
  const hasDuplicateTerminal = blockerCodes.includes("duplicate-terminal-event");
  const hasMissingTerminal = blockerCodes.includes("missing-terminal-event");
  const hasTurnNotCompleted = blockerCodes.includes("turn-not-completed");
  const hasUnverifiedAppServerExit = blockerCodes.includes("app-server-exit-unverified");
  const hasNonzeroAppServerExit = blockerCodes.includes("app-server-nonzero-exit");
  if (
    (hasMissingTerminal && (hasDuplicateTerminal || hasTurnNotCompleted)) ||
    (hasUnverifiedAppServerExit && hasNonzeroAppServerExit)
  ) return null;
  const expectedTerminal = hasDuplicateTerminal
    ? "ambiguous"
    : hasMissingTerminal
      ? "missing"
      : hasTurnNotCompleted
        ? "non-completed"
        : "completed";
  const expectedAppServerExit = hasUnverifiedAppServerExit
    ? "unverified"
    : hasNonzeroAppServerExit
      ? "nonzero"
      : "zero";
  if (
    !Number.isSafeInteger(blockerCount) ||
    blockerCount < 0 ||
    blockerCount > 64 ||
    !Number.isSafeInteger(unclassifiedCount) ||
    unclassifiedCount < 0 ||
    blockerCount !== blockerCodes.length + unclassifiedCount ||
    lifecycle.terminal !== expectedTerminal
  ) return null;

  if (
    value.appServerExit !== expectedAppServerExit ||
    !["syntax-error", "type-error", "aggregate-error", "error", "unverified"].includes(value.primaryCauseKind)
  ) return null;
  const retentionKeys = [
    "rawOutputPersisted", "rawEventsPersisted", "threadTurnProcessIdentifiersPersisted",
    "absolutePathsPersisted", "rawEventOrOutputDigestsPersisted", "rawStderrPersisted",
    "configContentsPersisted",
  ];
  if (!hasSelectedDataProperties(value.retention, retentionKeys)) return null;
  if (retentionKeys.some((key) => value.retention[key] !== false)) return null;

  const rebuilt = {
    schemaVersion: 1,
    provenance: "runner-observed-default-fresh-adapter-rejection",
    runnerStage: "fresh-turn-rejected",
    evidenceState: "retained",
    lifecycle,
    eventCounts,
    blockers: {
      count: blockerCount,
      codes: blockerCodes,
      unclassifiedCount,
    },
    appServerExit: value.appServerExit,
    primaryCauseKind: value.primaryCauseKind,
    retention: Object.fromEntries(retentionKeys.map((key) => [key, false])),
  };
  return Buffer.byteLength(JSON.stringify(rebuilt)) <= 2048 ? rebuilt : null;
}

export function rebuildJoenessM4DelegatedBlockedReceipt(value) {
  if (value === null || typeof value !== "object" || utilTypes.isProxy(value) || Array.isArray(value)) {
    fail("M4 delegated blocked receipt must be a plain object");
  }
  let prototype;
  try {
    prototype = Object.getPrototypeOf(value);
  } catch {
    fail("M4 delegated blocked receipt is unsafe");
  }
  if (prototype !== Object.prototype && prototype !== null) fail("M4 delegated blocked receipt must be a plain object");
  const requiredKeys = ["schemaVersion", "status", "phase", "safeCleanup", "cause"];
  const data = Object.create(null);
  for (const key of requiredKeys) {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(value, key); } catch { fail("M4 delegated blocked receipt is unsafe"); }
    if (!descriptor || !("value" in descriptor) || descriptor.get || descriptor.set) {
      fail("M4 delegated blocked receipt is unsafe");
    }
    data[key] = descriptor.value;
  }
  if (
    data.schemaVersion !== 1 ||
    data.status !== "blocked" ||
    data.safeCleanup !== true ||
    !["post-runtime-validation", "runtime-factory"].includes(data.phase) ||
    !hasSelectedDataProperties(data.cause, ["category"])
  ) fail("M4 delegated blocked receipt contract is invalid");
  const category = data.cause.category;
  if (
    (data.phase === "runtime-factory" && category !== "runtime-factory-failed") ||
    (data.phase === "post-runtime-validation" && !["contract-validation", "evaluation-failed"].includes(category))
  ) fail("M4 delegated blocked receipt cause is invalid");
  const rebuilt = {
    schemaVersion: 1,
    status: "blocked",
    phase: data.phase,
    safeCleanup: true,
    cause: { category },
  };
  if (data.phase === "post-runtime-validation") {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(value, "freshFailure"); } catch { descriptor = null; }
    const freshFailure = descriptor && "value" in descriptor && !descriptor.get && !descriptor.set
      ? rebuildFreshFailure(descriptor.value)
      : null;
    if (freshFailure !== null) rebuilt.freshFailure = freshFailure;
  }
  return rebuilt;
}

function joenessM4BlockedEvidence(base, plan, executionSource, cleanupState, retainFreshFailure = false) {
  const blocked = rebuildJoenessM4DelegatedBlockedReceipt(base);
  const { freshFailure, ...genericBlocked } = blocked;
  return {
    ...genericBlocked,
    ...(retainFreshFailure && freshFailure ? { freshFailure } : {}),
    executionSource,
    runtime: {
      codexVersion: plan.runtime.codexVersion,
      freshTurnCount: plan.attempt.freshTurnCount,
      retryCount: plan.attempt.retryCount,
      dynamicToolCount: plan.runtime.dynamicTools.length,
      sourceConfigReadback: "UNCHANGED",
      cleanup: cleanupState.receipt,
    },
    resultBoundary: plan.resultBoundary,
    privacy: {
      configContentsPersisted: false,
      processIdentifiersPersisted: false,
      absolutePathsPersisted: false,
      rawStderrPersisted: false,
    },
  };
}

function assertJoenessM4ArtifactPrivacy(value, label, key = "") {
  assertSafeData(value, label);
  const forbiddenKey = /^(?:pid|parentPid|executable|cwd|argv|stderr|rawStderr|diagnostic|configContents)$/iu;
  const visit = (candidate, candidateKey) => {
    if (forbiddenKey.test(candidateKey)) throw new Error(`${label} contains private runtime data`);
    if (typeof candidate === "string") {
      if (/^[A-Za-z]:[\\/]/u.test(candidate) || candidate.startsWith("/")) {
        throw new Error(`${label} contains an absolute path`);
      }
      return;
    }
    if (candidate === null || typeof candidate !== "object") return;
    if (Array.isArray(candidate)) {
      candidate.forEach((entry) => visit(entry, candidateKey));
      return;
    }
    for (const [entryKey, entry] of Object.entries(candidate)) visit(entry, entryKey);
  };
  visit(value, key);
}

async function writeJoenessM4BlockedArtifact(repositoryRoot, relativePath, value) {
  if (typeof repositoryRoot !== "string" || !path.isAbsolute(repositoryRoot)) fail("M4 blocked repository root is invalid");
  if (relativePath !== OUTPUT_PATHS.blocked) fail("M4 blocked output path is invalid");
  assertSafeData(value, "M4 blocked output");
  const text = `${JSON.stringify(value, null, 2)}\n`;
  if (Buffer.byteLength(text) < 1 || Buffer.byteLength(text) > 16 * 1024) {
    fail("M4 blocked output size is invalid");
  }
  const resolvedRoot = await realpath(repositoryRoot);
  const target = await confinedAbsentTarget(resolvedRoot, relativePath, "M4 blocked output");
  let handle;
  let created = false;
  try {
    handle = await open(target, "wx", 0o600);
    created = true;
    await handle.writeFile(text, "utf8");
    await handle.sync();
    await handle.close();
    handle = undefined;
    const readbackPath = await confinedRegularFile(resolvedRoot, relativePath, "M4 blocked output readback");
    const readback = await readFile(readbackPath);
    if (readback.length !== Buffer.byteLength(text) || sha256(readback) !== sha256(text)) {
      throw new Error("M4 blocked output readback differs");
    }
    return { bytes: readback.length, sha256: sha256(readback) };
  } catch (error) {
    if (handle) await handle.close().catch(() => {});
    if (created) await rm(target, { force: true }).catch(() => {});
    throw error;
  }
}

export function parseJoenessM4LiveCli(argv) {
  argv ??= [];
  assertSafeData(argv, "M4 live CLI arguments");
  if (!Array.isArray(argv)) fail("M4 live CLI arguments must be an array");
  if (argv.length === 0) return { mode: "preflight", planPath: PLAN_PATH };
  if (
    argv.length === 4 &&
    argv[0] === "--mode" &&
    ["preflight", "live"].includes(argv[1]) &&
    argv[2] === "--plan" &&
    argv[3] === PLAN_PATH
  ) return { mode: argv[1], planPath: PLAN_PATH };
  throw new TypeError("M4 live CLI arguments or fixed plan are invalid");
}

async function main() {
  const cli = parseJoenessM4LiveCli(process.argv.slice(2));
  const repositoryRoot = path.resolve(import.meta.dirname, "../..");
  const sourceCodexHome = process.env.CODEX_HOME ?? path.join(homedir(), ".codex");
  const result = cli.mode === "preflight"
    ? await preflightJoenessM4Live({
      repositoryRoot,
      planPath: cli.planPath,
      sourceCodexHome,
      operations: undefined,
    })
    : await runJoenessM4Live({
      repositoryRoot,
      planPath: cli.planPath,
      sourceCodexHome,
      runParent: tmpdir(),
      operations: undefined,
    });
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(() => {
    process.stderr.write("m4-live-wrapper-failed\n");
    process.exitCode = 1;
  });
}
