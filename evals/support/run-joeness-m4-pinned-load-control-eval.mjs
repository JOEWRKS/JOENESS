import { execFile as execFileCallback } from "node:child_process";
import { createHash } from "node:crypto";
import { lstat, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { promisify, types as utilTypes } from "node:util";
import {
  buildJoenessM4Input,
  preflightJoenessM4SuperpowersEval,
} from "./run-joeness-m4-superpowers-eval.mjs";
import {
  projectJoenessM4TransportControlFreshFailure,
  publishJoenessM4TransportControlBlockedArtifact,
  publishJoenessM4TransportControlSuccessArtifacts,
} from "./run-joeness-m4-transport-control-eval.mjs";
import { runFreshEvaluatorTurn } from "./run-fresh-evaluator-turn.mjs";

const execFile = promisify(execFileCallback);
const RUNNER_SOURCE_PATH =
  "evals/support/run-joeness-m4-pinned-load-control-eval.mjs";
const FIXTURE_LOADER_SOURCE_PATH =
  "evals/support/run-joeness-m4-superpowers-eval.mjs";
const FRESH_TURN_ADAPTER_SOURCE_PATH =
  "evals/support/run-fresh-evaluator-turn.mjs";
const TRANSPORT_CONTROL_SUPPORT_SOURCE_PATH =
  "evals/support/run-joeness-m4-transport-control-eval.mjs";
const FROZEN_MANIFEST = Object.freeze({
  byteLength: 1738,
  sha256: "3708a7c3ea677926cd4f85093e83788ff6250aa0b7fd012529ff88a45ddc77f0",
});
const FROZEN_REQUEST = Object.freeze({
  byteLength: 17295,
  sha256: "edb9ffd151a5ecb405002d487fe28c1e10285d63676aee849bd991158fd89f5a",
});
const FROZEN_INPUTS = Object.freeze([
  Object.freeze({
    id: "evaluator-instruction",
    byteLength: 1538,
    sha256: "4918dc6eede5dff6b44394a8c249d3622eac3f02bbe1804d6f18a937b05119b1",
  }),
  Object.freeze({
    id: "project-task",
    byteLength: 2171,
    sha256: "f193b03f5a3d410ab50484640dced02dafe54efa254f76fd15459fb53b6ffee3",
  }),
  Object.freeze({
    id: "superpowers-using",
    byteLength: 3063,
    sha256: "55379fe7c1c473a02c61961c822996bff30e1320d6921d9062509bc508482c05",
  }),
  Object.freeze({
    id: "superpowers-brainstorming",
    byteLength: 10047,
    sha256: "4a54a4858b99807f3155ed1614b2f116e35ea5c1b788e793f565dd837fd3891f",
  }),
]);
const DESCRIPTOR_REQUEST_SHA256 =
  "f79255f5ca0daab780a99c2b05e8cb2da1e9060ad4a14c24e71a3ab8fbd8f40d";
const EXACT_RAW_OUTPUT = '{"schemaVersion":1,"transport":"ok"}';
const EXACT_RAW_OUTPUT_SHA256 =
  "b270bf58038d3d0c99216e11735eeadd9ef29d2dbfa3b14e99bfe8900c36a6ea";
const ASSESSMENT = Object.freeze({
  status: "PASS",
  scope: "pinned-content-load-transport-only",
  m4Behavior: "NOT-ASSESSED",
  joenessPolicy: "UNVERIFIED",
  superpowersCompatibility: "UNVERIFIED",
  promotionPass: false,
});

export const JOENESS_M4_PINNED_LOAD_CONTROL_ID =
  "joeness-m4-pinned-load-control-v1";

function fail(message) {
  throw new TypeError(message);
}

function exactObject(value, keys, label) {
  if (
    value === null ||
    typeof value !== "object" ||
    utilTypes.isProxy(value)
  ) {
    fail(`${label} must be an exact object`);
  }
  let isArray;
  let prototype;
  let ownKeys;
  try {
    isArray = Array.isArray(value);
    prototype = Object.getPrototypeOf(value);
    ownKeys = Reflect.ownKeys(value);
  } catch {
    fail(`${label} must be an exact object`);
  }
  if (isArray || (prototype !== Object.prototype && prototype !== null)) {
    fail(`${label} must be an exact object`);
  }
  if (
    ownKeys.length !== keys.length ||
    ownKeys.some((key) => typeof key !== "string" || !keys.includes(key))
  ) {
    fail(`${label} keys are invalid`);
  }
  for (const key of keys) {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(value, key); }
    catch { fail(`${label}.${key} must be own data`); }
    if (
      descriptor === undefined ||
      !Object.hasOwn(descriptor, "value") ||
      descriptor.enumerable !== true
    ) {
      fail(`${label}.${key} must be own data`);
    }
  }
  return value;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
}

function validateDigest(value, label) {
  if (typeof value !== "string" || !/^[0-9a-f]{64}$/u.test(value)) {
    fail(`${label} must be a lowercase SHA-256 digest`);
  }
}

function validatePortableRelativePath(value, label) {
  if (
    typeof value !== "string" ||
    value.length < 1 ||
    value.length > 160 ||
    value.includes("\\") ||
    value.includes("\0") ||
    path.posix.isAbsolute(value) ||
    /^[A-Za-z]:/u.test(value) ||
    value.split("/").some((part) => part === "" || part === "." || part === "..")
  ) {
    fail(`${label} must be a portable relative path`);
  }
}

function validateTuple(value, expectedPath, label) {
  exactObject(value, ["path", "bytes", "sha256"], label);
  validatePortableRelativePath(value.path, `${label}.path`);
  if (value.path !== expectedPath) fail(`${label}.path is invalid`);
  if (!Number.isSafeInteger(value.bytes) || value.bytes < 1) fail(`${label}.bytes is invalid`);
  validateDigest(value.sha256, `${label}.sha256`);
}

function validateExecutionPlan(value) {
  exactObject(value, ["schemaVersion", "id", "outputs"], "pinned-load execution plan");
  if (value.schemaVersion !== 1 || value.id !== JOENESS_M4_PINNED_LOAD_CONTROL_ID) {
    fail("pinned-load execution plan identity is invalid");
  }
  exactObject(value.outputs, ["raw", "evidence", "blocked"], "pinned-load execution outputs");
  for (const [key, output] of Object.entries(value.outputs)) {
    if (key === "blocked" && output === null) continue;
    validatePortableRelativePath(output, `pinned-load ${key} output`);
  }
  const paths = Object.values(value.outputs).filter(Boolean).map((value) => value.toLowerCase());
  if (new Set(paths).size !== paths.length) fail("pinned-load output paths collide");
}

function validateSourcePin(value) {
  exactObject(
    value,
    [
      "repositoryCommit",
      "runner",
      "fixtureLoader",
      "freshTurnAdapter",
      "transportControlSupport",
    ],
    "pinned-load source pin",
  );
  if (typeof value.repositoryCommit !== "string" || !/^[0-9a-f]{40}$/u.test(value.repositoryCommit)) {
    fail("pinned-load source commit is invalid");
  }
  validateTuple(value.runner, RUNNER_SOURCE_PATH, "pinned-load runner source pin");
  validateTuple(
    value.fixtureLoader,
    FIXTURE_LOADER_SOURCE_PATH,
    "pinned-load fixture loader source pin",
  );
  validateTuple(
    value.freshTurnAdapter,
    FRESH_TURN_ADAPTER_SOURCE_PATH,
    "pinned-load fresh turn adapter source pin",
  );
  validateTuple(
    value.transportControlSupport,
    TRANSPORT_CONTROL_SUPPORT_SOURCE_PATH,
    "pinned-load transport control support source pin",
  );
}

function snapshotPlan(value) {
  return Object.freeze({
    schemaVersion: value.schemaVersion,
    id: value.id,
    outputs: Object.freeze({ ...value.outputs }),
  });
}

function snapshotSourcePin(value) {
  return Object.freeze({
    repositoryCommit: value.repositoryCommit,
    runner: Object.freeze({ ...value.runner }),
    fixtureLoader: Object.freeze({ ...value.fixtureLoader }),
    freshTurnAdapter: Object.freeze({ ...value.freshTurnAdapter }),
    transportControlSupport: Object.freeze({ ...value.transportControlSupport }),
  });
}

async function defaultGitStatus(repositoryRoot) {
  const { stdout } = await execFile(
    "git",
    ["status", "--porcelain=v1", "--untracked-files=all"],
    {
    cwd: repositoryRoot,
    encoding: "utf8",
      windowsHide: true,
    },
  );
  return stdout;
}

async function defaultGitIdentity(repositoryRoot) {
  const { stdout } = await execFile("git", ["rev-parse", "HEAD"], {
    cwd: repositoryRoot,
    encoding: "utf8",
    windowsHide: true,
  });
  return stdout.trim();
}

async function defaultGitReadBlob(repositoryRoot, commit, relativePath) {
  const { stdout } = await execFile(
    "git",
    ["cat-file", "blob", `${commit}:${relativePath}`],
    {
      cwd: repositoryRoot,
      encoding: "buffer",
      maxBuffer: 1024 * 1024,
      windowsHide: true,
    },
  );
  return Buffer.from(stdout);
}

async function defaultArtifactExists(repositoryRoot, relativePath) {
  try {
    await lstat(path.join(repositoryRoot, ...relativePath.split("/")));
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function assertNoSymlinkSegments(repositoryRoot, relativePath, label) {
  let current = repositoryRoot;
  for (const segment of relativePath.split("/").filter(Boolean)) {
    current = path.join(current, segment);
    const state = await lstat(current);
    if (state.isSymbolicLink()) {
      throw new Error(`${label} contains a symlink or reparse traversal`);
    }
  }
  return current;
}

async function verifyOutputTarget(repositoryRoot, relativePath) {
  validatePortableRelativePath(relativePath, "pinned-load output target");
  const parts = relativePath.split("/");
  const leaf = parts.pop();
  const parentRelative = parts.join("/");
  const parent = parentRelative === ""
    ? repositoryRoot
    : await assertNoSymlinkSegments(
      repositoryRoot,
      parentRelative,
      "pinned-load output parent",
    );
  const parentStat = await lstat(parent);
  if (!parentStat.isDirectory() || parentStat.isSymbolicLink()) {
    throw new Error("pinned-load output parent is not a confined regular directory");
  }
  const resolvedRoot = await realpath(repositoryRoot);
  const resolvedParent = await realpath(parent);
  const relative = path.relative(resolvedRoot, resolvedParent);
  if (
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new Error("pinned-load output parent escapes repository confinement");
  }
  const target = path.join(parent, leaf);
  try {
    const targetStat = await lstat(target);
    if (targetStat.isSymbolicLink()) {
      throw new Error("pinned-load output target is a symlink or reparse traversal");
    }
    throw new Error(`pinned-load artifact collision: ${relativePath}`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
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
  if ((await gitStatus(repositoryRoot)) !== "") fail("pinned-load live worktree is dirty");
  if ((await gitIdentity(repositoryRoot)) !== sourcePin.repositoryCommit) {
    fail("pinned-load live source commit differs from pin");
  }
  for (const role of [
    "runner",
    "fixtureLoader",
    "freshTurnAdapter",
    "transportControlSupport",
  ]) {
    const tuple = sourcePin[role];
    const blob = await gitReadBlob(repositoryRoot, sourcePin.repositoryCommit, tuple.path);
    if (!Buffer.isBuffer(blob) || blob.length !== tuple.bytes || sha256(blob) !== tuple.sha256) {
      fail(`pinned-load ${role} source pin drift`);
    }
    const workingPath = await assertNoSymlinkSegments(
      repositoryRoot,
      tuple.path,
      `pinned-load ${role} working source`,
    );
    const workingStat = await lstat(workingPath);
    if (!workingStat.isFile() || workingStat.isSymbolicLink()) {
      fail(`pinned-load ${role} working source is not a regular file`);
    }
    const working = await readFile(workingPath);
    if (
      working.length !== tuple.bytes ||
      sha256(working) !== tuple.sha256 ||
      !working.equals(blob)
    ) {
      fail(`pinned-load ${role} working source pin drift`);
    }
  }
  for (const output of Object.values(executionPlan.outputs).filter(Boolean)) {
    await verifyOutputTarget(repositoryRoot, output);
    if (await artifactExists(repositoryRoot, output)) {
      fail(`pinned-load artifact collision: ${output}`);
    }
  }
}

function safeConfigTuple(value, label) {
  exactObject(value, ["bytes", "sha256"], label);
  if (!Number.isSafeInteger(value.bytes) || value.bytes < 0) fail(`${label}.bytes is invalid`);
  validateDigest(value.sha256, `${label}.sha256`);
  return { bytes: value.bytes, sha256: value.sha256 };
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
  if (!Object.hasOwn(descriptor, "value") || descriptor.get || descriptor.set) {
    return { state: "unsafe" };
  }
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
  if (
    actual.length !== keys.length ||
    actual.some((key) => typeof key !== "string" || !keys.includes(key))
  ) return null;
  return result;
}

function diagnosticArray(value, maximumLength) {
  if (value === null || typeof value !== "object" || utilTypes.isProxy(value)) return null;
  let keys;
  let lengthDescriptor;
  try {
    if (!Array.isArray(value)) return null;
    lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length");
    if (
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

function assessment() {
  return { ...ASSESSMENT };
}

export function joenessM4PinnedLoadControlOutputSchema() {
  return {
    type: "object",
    properties: {
      schemaVersion: { type: "integer", enum: [1] },
      transport: { type: "string", enum: ["ok"] },
    },
    required: ["schemaVersion", "transport"],
    additionalProperties: false,
  };
}

export function validateJoenessM4PinnedLoadControlOutput(value) {
  exactObject(value, ["schemaVersion", "transport"], "pinned-load control output");
  if (value.schemaVersion !== 1 || value.transport !== "ok") {
    fail("pinned-load control output contract is invalid");
  }
  return value;
}

export function retainJoenessM4PinnedLoadControlFreshEvidence(
  result,
  { preflight, input, outputSchema } = {},
) {
  const resultData = diagnosticObject(result, [
    "output",
    "outputText",
    "input",
    "outputSchema",
    "blockers",
    "toolEvidence",
    "threadStart",
    "turn",
    "eventCompaction",
    "appServer",
  ]);
  if (resultData === null) fail("pinned-load fresh result is unsafe");
  const outputData = diagnosticExactObject(resultData.output, ["schemaVersion", "transport"]);
  const outputText = diagnosticExactObject(resultData.outputText, ["text", "byteLength", "sha256"]);
  const inputEvidence = diagnosticObject(resultData.input, ["descriptors", "requestSha256"]);
  const outputSchemaEvidence = diagnosticObject(resultData.outputSchema, ["byteLength", "sha256"]);
  const blockers = diagnosticArray(resultData.blockers, 64);
  const tools = diagnosticArray(resultData.toolEvidence, 64);
  const threadStart = diagnosticObject(resultData.threadStart, ["request", "response"]);
  const turn = diagnosticObject(resultData.turn, ["id", "request"]);
  const compaction = diagnosticObject(resultData.eventCompaction, ["rawPayloadRetained"]);
  const appServer = diagnosticObject(resultData.appServer, ["processExitCode", "stderr"]);
  if (
    outputData === null ||
    outputText === null ||
    inputEvidence === null ||
    outputSchemaEvidence === null ||
    blockers === null || blockers.length !== 0 ||
    tools === null || tools.length !== 0 ||
    threadStart === null ||
    turn === null ||
    compaction === null || compaction.rawPayloadRetained !== false ||
    appServer === null
  ) fail("pinned-load fresh result boundary is invalid");
  if (outputData.schemaVersion !== 1 || outputData.transport !== "ok") {
    fail("pinned-load semantic output contract is invalid");
  }
  const descriptors = diagnosticArray(inputEvidence.descriptors, FROZEN_INPUTS.length);
  if (descriptors === null || descriptors.length !== FROZEN_INPUTS.length) {
    fail("pinned-load input descriptors are invalid");
  }
  const retainedDescriptors = descriptors.map((descriptor, index) => {
    const data = diagnosticExactObject(
      descriptor,
      ["index", "type", "byteLength", "sha256"],
    );
    const expected = FROZEN_INPUTS[index];
    if (
      data === null ||
      data.index !== index ||
      data.type !== "text" ||
      data.byteLength !== expected.byteLength ||
      data.sha256 !== expected.sha256
    ) fail("pinned-load input descriptor tuple drift");
    return {
      id: expected.id,
      index,
      type: "text",
      byteLength: expected.byteLength,
      sha256: expected.sha256,
    };
  });
  if (inputEvidence.requestSha256 !== DESCRIPTOR_REQUEST_SHA256) {
    fail("pinned-load descriptor request digest drift");
  }
  const request = diagnosticObject(threadStart.request, ["projectDocMaxBytes", "dynamicToolCount"]);
  const response = diagnosticObject(
    threadStart.response,
    ["ephemeral", "priorTurnCount", "instructionSourceCount"],
  );
  const turnRequest = diagnosticObject(
    turn.request,
    ["inputDescriptorCount", "inputRequestSha256", "outputSchemaSha256"],
  );
  const stderr = diagnosticObject(
    appServer.stderr,
    ["byteLength", "truncated", "captureTruncated"],
  );
  const schemaText = stableStringify(outputSchema);
  const schemaSha256 = sha256(schemaText);
  if (
    request === null ||
    request.projectDocMaxBytes !== 0 ||
    request.dynamicToolCount !== 0 ||
    response === null ||
    response.ephemeral !== true ||
    response.priorTurnCount !== 0 ||
    response.instructionSourceCount !== 0 ||
    typeof turn.id !== "string" || turn.id.length < 1 ||
    turnRequest === null ||
    turnRequest.inputDescriptorCount !== FROZEN_INPUTS.length ||
    turnRequest.inputRequestSha256 !== DESCRIPTOR_REQUEST_SHA256 ||
    turnRequest.outputSchemaSha256 !== schemaSha256 ||
    outputSchemaEvidence.byteLength !== Buffer.byteLength(schemaText) ||
    outputSchemaEvidence.sha256 !== schemaSha256 ||
    appServer.processExitCode !== 0 ||
    stderr === null ||
    stderr.byteLength !== 0 ||
    stderr.truncated !== false ||
    stderr.captureTruncated !== false
  ) fail("pinned-load fresh lifecycle boundary is invalid");
  if (
    preflight?.manifest?.id !== "joeness-m4-superpowers-v2" ||
    preflight.manifestBytes !== FROZEN_MANIFEST.byteLength ||
    preflight.manifestSha256 !== FROZEN_MANIFEST.sha256 ||
    !Array.isArray(input) ||
    input.length !== FROZEN_INPUTS.length
  ) fail("pinned-load expected fixture boundary is invalid");
  const canonicalRequest = stableStringify(input);
  if (
    Buffer.byteLength(canonicalRequest) !== FROZEN_REQUEST.byteLength ||
    sha256(canonicalRequest) !== FROZEN_REQUEST.sha256
  ) fail("pinned-load expected request tuple drift");
  if (
    typeof outputText.text !== "string" ||
    outputText.text !== EXACT_RAW_OUTPUT ||
    Buffer.byteLength(outputText.text) !== 36 ||
    outputText.byteLength !== Buffer.byteLength(outputText.text) ||
    outputText.sha256 !== EXACT_RAW_OUTPUT_SHA256 ||
    outputText.sha256 !== sha256(outputText.text)
  ) fail("pinned-load raw output canonical tuple is invalid");
  let parsed;
  try { parsed = JSON.parse(outputText.text); } catch { fail("pinned-load raw output JSON is invalid"); }
  validateJoenessM4PinnedLoadControlOutput(parsed);
  if (stableStringify(parsed) !== stableStringify(outputData)) {
    fail("pinned-load raw output differs from semantic output");
  }
  return {
    schemaVersion: 1,
    id: JOENESS_M4_PINNED_LOAD_CONTROL_ID,
    assessment: assessment(),
    input: {
      manifest: {
        id: "joeness-m4-superpowers-v2",
        byteLength: FROZEN_MANIFEST.byteLength,
        sha256: FROZEN_MANIFEST.sha256,
      },
      descriptorCount: FROZEN_INPUTS.length,
      descriptors: retainedDescriptors,
      canonicalRequest: { ...FROZEN_REQUEST },
      descriptorRequestSha256: DESCRIPTOR_REQUEST_SHA256,
    },
    output: {
      schemaVersion: 1,
      transport: "ok",
      byteLength: outputText.byteLength,
      sha256: outputText.sha256,
      schemaSha256,
    },
    runtime: {
      freshTurnCount: 1,
      retryCount: 0,
      dynamicToolCount: 0,
      projectDocs: "DISABLED",
      installedPluginActivation: "UNVERIFIED",
    },
    privacy: {
      pinnedInputContentsPersisted: false,
      rawEventsPersisted: false,
      processIdentifiersPersisted: false,
      absolutePathsPersisted: false,
      rawStderrPersisted: false,
      configContentsPersisted: false,
    },
  };
}

export function projectJoenessM4PinnedLoadControlFreshFailure(error) {
  return projectJoenessM4TransportControlFreshFailure(error);
}

export async function publishJoenessM4PinnedLoadControlSuccessArtifacts(options) {
  return publishJoenessM4TransportControlSuccessArtifacts(options);
}

export async function publishJoenessM4PinnedLoadControlBlockedArtifact(options) {
  return publishJoenessM4TransportControlBlockedArtifact(options);
}

function isExactTypeError(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !utilTypes.isProxy(value) &&
    Object.getPrototypeOf(value) === TypeError.prototype
  );
}

function blockedReceipt(error, freshFailure) {
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

export async function runJoenessM4PinnedLoadControlEval({
  repositoryRoot,
  executionPlan,
  sourcePin,
  gitStatus = defaultGitStatus,
  gitIdentity = defaultGitIdentity,
  gitReadBlob = defaultGitReadBlob,
  artifactExists = defaultArtifactExists,
  runtimeFactory,
  runTurn = runFreshEvaluatorTurn,
  successPublisher = publishJoenessM4PinnedLoadControlSuccessArtifacts,
  writeArtifact,
} = {}) {
  validateExecutionPlan(executionPlan);
  validateSourcePin(sourcePin);
  executionPlan = snapshotPlan(executionPlan);
  sourcePin = snapshotSourcePin(sourcePin);
  if (typeof repositoryRoot !== "string" || !path.isAbsolute(repositoryRoot)) {
    fail("pinned-load repository root must be absolute");
  }
  for (const dependency of [
    gitStatus,
    gitIdentity,
    gitReadBlob,
    artifactExists,
    runtimeFactory,
    runTurn,
    successPublisher,
  ]) {
    if (typeof dependency !== "function") fail("pinned-load execution dependency is invalid");
  }
  writeArtifact ??= (relativePath, value) =>
    publishJoenessM4PinnedLoadControlBlockedArtifact({
      repositoryRoot,
      relativePath,
      value,
    });
  if (typeof writeArtifact !== "function") fail("pinned-load artifact writer is invalid");
  if (runTurn !== runFreshEvaluatorTurn) {
    fail("pinned-load PASS requires the authentic imported fresh-turn adapter identity");
  }
  await verifyLiveBoundary({
    repositoryRoot,
    executionPlan,
    sourcePin,
    gitStatus,
    gitIdentity,
    gitReadBlob,
    artifactExists,
  });
  const preflight = await preflightJoenessM4SuperpowersEval({
    repositoryRoot,
    gitReadBlob,
  });
  if (
    preflight.manifestBytes !== FROZEN_MANIFEST.byteLength ||
    preflight.manifestSha256 !== FROZEN_MANIFEST.sha256
  ) {
    fail("pinned-load frozen manifest tuple drift");
  }
  const input = buildJoenessM4Input(preflight);
  const canonicalRequest = stableStringify(input);
  if (
    Buffer.byteLength(canonicalRequest) !== FROZEN_REQUEST.byteLength ||
    sha256(canonicalRequest) !== FROZEN_REQUEST.sha256
  ) {
    fail("pinned-load frozen request tuple drift");
  }
  const outputSchema = joenessM4PinnedLoadControlOutputSchema();
  let runtime;
  let primaryError = null;
  let result;
  let evidence;
  let rawText;
  let freshFailure = null;
  let cleanupSafe = false;
  let sourceConfigBefore;
  try {
    const runtimeCandidate = await runtimeFactory({
      repositoryRoot,
      executionPlan: {
        schemaVersion: executionPlan.schemaVersion,
        id: executionPlan.id,
        outputs: { ...executionPlan.outputs },
      },
      sourcePin: {
        repositoryCommit: sourcePin.repositoryCommit,
        runner: { ...sourcePin.runner },
        fixtureLoader: { ...sourcePin.fixtureLoader },
        freshTurnAdapter: { ...sourcePin.freshTurnAdapter },
        transportControlSupport: { ...sourcePin.transportControlSupport },
      },
    });
    const runtimeData = diagnosticObject(
      runtimeCandidate,
      ["session", "sourceConfigBefore", "finish", "readSourceConfig"],
    );
    if (
      runtimeData === null ||
      typeof runtimeData.finish !== "function" ||
      utilTypes.isProxy(runtimeData.finish) ||
      typeof runtimeData.readSourceConfig !== "function" ||
      utilTypes.isProxy(runtimeData.readSourceConfig)
    ) {
      fail("pinned-load runtime factory result is invalid");
    }
    runtime = {
      session: runtimeData.session,
      sourceConfigBefore: runtimeData.sourceConfigBefore,
      finish: (...args) => Reflect.apply(runtimeData.finish, runtimeCandidate, args),
      readSourceConfig: (...args) =>
        Reflect.apply(runtimeData.readSourceConfig, runtimeCandidate, args),
    };
    sourceConfigBefore = safeConfigTuple(
      runtime.sourceConfigBefore,
      "pinned-load source config before",
    );
    try {
      result = await runTurn({
        session: runtime.session,
        root: repositoryRoot,
        input,
        outputSchema,
        dynamicTools: [],
      });
    } catch (error) {
      const projected = projectJoenessM4PinnedLoadControlFreshFailure(error);
      if (projected !== null) {
        const retained = {
          schemaVersion: 4,
          provenance: "pinned-load-control-runner-observed-default-fresh-adapter-rejection",
          runnerStage: "fresh-turn-rejected",
          pinnedRequest: {
            descriptorCount: FROZEN_INPUTS.length,
            byteLength: FROZEN_REQUEST.byteLength,
            sha256: FROZEN_REQUEST.sha256,
          },
          ...projected,
        };
        if (Buffer.byteLength(stableStringify(retained)) <= 3072) freshFailure = retained;
      }
      throw error;
    }
    const resultData = diagnosticObject(result, [
      "output",
      "outputText",
      "input",
      "outputSchema",
      "blockers",
      "toolEvidence",
      "threadStart",
      "turn",
      "eventCompaction",
      "appServer",
    ]);
    if (resultData === null) fail("pinned-load fresh result is unsafe");
    evidence = retainJoenessM4PinnedLoadControlFreshEvidence(resultData, {
      preflight,
      input,
      outputSchema,
    });
    const outputTextData = diagnosticExactObject(
      resultData.outputText,
      ["text", "byteLength", "sha256"],
    );
    rawText = outputTextData !== null && evidence.output.sha256 === outputTextData.sha256
      ? outputTextData.text
      : null;
    if (rawText === null) fail("pinned-load raw output binding is invalid");
  } catch (error) {
    primaryError = error;
  }
  let cleanupError = null;
  if (runtime !== undefined) {
    const cleanupErrors = [];
    try { await runtime.finish(true); } catch (error) { cleanupErrors.push(error); }
    try {
      const sourceConfigAfter = safeConfigTuple(
        await runtime.readSourceConfig(),
        "pinned-load source config after",
      );
      if (
        sourceConfigBefore === undefined ||
        sourceConfigBefore.bytes !== sourceConfigAfter.bytes ||
        sourceConfigBefore.sha256 !== sourceConfigAfter.sha256
      ) {
        fail("pinned-load source config changed");
      }
    } catch (error) {
      cleanupErrors.push(error);
    }
    if (cleanupErrors.length === 1) cleanupError = cleanupErrors[0];
    if (cleanupErrors.length > 1) {
      cleanupError = new AggregateError(cleanupErrors, "pinned-load cleanup failed", {
        cause: cleanupErrors[0],
      });
    }
    cleanupSafe = cleanupErrors.length === 0;
  }
  if (cleanupError !== null) {
    if (primaryError === null) throw cleanupError;
    throw new AggregateError(
      [primaryError, cleanupError],
      "pinned-load validation and cleanup failed",
      { cause: primaryError },
    );
  }
  if (primaryError !== null) {
    if (cleanupSafe && executionPlan.outputs.blocked !== null) {
      const blocked = blockedReceipt(primaryError, freshFailure);
      if (Buffer.byteLength(stableStringify(blocked)) > 4096) {
        throw new Error("pinned-load blocked receipt exceeds bound", { cause: primaryError });
      }
      await verifyLiveBoundary({
        repositoryRoot,
        executionPlan,
        sourcePin,
        gitStatus,
        gitIdentity,
        gitReadBlob,
        artifactExists,
      });
      await writeArtifact(executionPlan.outputs.blocked, blocked);
    }
    throw primaryError;
  }
  await verifyLiveBoundary({
    repositoryRoot,
    executionPlan,
    sourcePin,
    gitStatus,
    gitIdentity,
    gitReadBlob,
    artifactExists,
  });
  if (!cleanupSafe) fail("pinned-load cleanup was not verified safe");
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
  return assessment();
}
