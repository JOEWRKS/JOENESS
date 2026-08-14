import { execFile as execFileCallback } from "node:child_process";
import { createHash } from "node:crypto";
import { lstat, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { types as utilTypes } from "node:util";

import {
  classifyJoenessM4AuthorityBehaviorOutput,
  joenessM4AuthorityBehaviorOutputSchema,
} from "./run-joeness-m4-authority-behavior-eval.mjs";
import {
  buildJoenessM4Input,
  preflightJoenessM4SuperpowersEval,
} from "./run-joeness-m4-superpowers-eval.mjs";
import {
  projectJoenessM4TransportControlFreshFailure,
  publishJoenessM4TransportControlBlockedArtifact,
} from "./run-joeness-m4-transport-control-eval.mjs";
import { runFreshEvaluatorTurn } from "./run-fresh-evaluator-turn.mjs";

const execFile = promisify(execFileCallback);

export const JOENESS_M4_AUTHORITY_STRUCTURED_OUTPUT_ID =
  "joeness-m4-authority-structured-output-v1";

const RUNNER_SOURCE_PATH =
  "evals/support/run-joeness-m4-authority-structured-output-eval.mjs";
const AUTHORITY_BEHAVIOR_CONTRACT_SOURCE_PATH =
  "evals/support/run-joeness-m4-authority-behavior-eval.mjs";
const FIXTURE_LOADER_SOURCE_PATH =
  "evals/support/run-joeness-m4-superpowers-eval.mjs";
const FRESH_TURN_ADAPTER_SOURCE_PATH =
  "evals/support/run-fresh-evaluator-turn.mjs";
const TRANSPORT_CONTROL_SUPPORT_SOURCE_PATH =
  "evals/support/run-joeness-m4-transport-control-eval.mjs";
const EXECUTION_OPTION_KEYS = Object.freeze([
  "repositoryRoot",
  "executionPlan",
  "sourcePin",
  "gitStatus",
  "gitIdentity",
  "gitReadBlob",
  "artifactExists",
  "runtimeFactory",
  "runTurn",
  "writeArtifact",
]);

const FROZEN_MANIFEST = Object.freeze({
  byteLength: 1738,
  sha256: "3708a7c3ea677926cd4f85093e83788ff6250aa0b7fd012529ff88a45ddc77f0",
});
const FROZEN_REQUEST = Object.freeze({
  byteLength: 17295,
  sha256: "edb9ffd151a5ecb405002d487fe28c1e10285d63676aee849bd991158fd89f5a",
});
const DESCRIPTOR_REQUEST_SHA256 =
  "f79255f5ca0daab780a99c2b05e8cb2da1e9060ad4a14c24e71a3ab8fbd8f40d";
const OUTPUT_SCHEMA_TUPLE = Object.freeze({
  byteLength: 1212,
  sha256: "600f57895d1ac47195207e05e6fb1a10418de47e5415989301dbd6d6a7ed05de",
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
    id: "using-superpowers",
    byteLength: 3063,
    sha256: "55379fe7c1c473a02c61961c822996bff30e1320d6921d9062509bc508482c05",
  }),
  Object.freeze({
    id: "brainstorming",
    byteLength: 10047,
    sha256: "4a54a4858b99807f3155ed1614b2f116e35ea5c1b788e793f565dd837fd3891f",
  }),
]);
const UNAUTHORIZED_ACTION_COVERAGE = Object.freeze([
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
const UNAUTHORIZED_ACTION_COVERAGE_TUPLE = Object.freeze({
  byteLength: 321,
  sha256: "412b94784afb8ba873b4044561cd86d4195f6c738734db39f9350236e1d5f69d",
});

function fail(message) {
  throw new TypeError(message);
}

class StructuredOutputContractError extends TypeError {}

function exactOwnDataSnapshot(value, keys, label) {
  if (
    value === null ||
    typeof value !== "object" ||
    utilTypes.isProxy(value)
  ) fail(`${label} must be an exact own-data object`);
  let isArray;
  let prototype;
  let ownKeys;
  try {
    isArray = Array.isArray(value);
    prototype = Object.getPrototypeOf(value);
    ownKeys = Reflect.ownKeys(value);
  } catch {
    fail(`${label} must be an exact own-data object`);
  }
  if (isArray || (prototype !== Object.prototype && prototype !== null)) {
    fail(`${label} must be an exact object`);
  }
  if (
    ownKeys.length !== keys.length ||
    ownKeys.some((key, index) => key !== keys[index])
  ) fail(`${label} keys are invalid`);
  const snapshot = Object.create(null);
  for (const key of keys) {
    const property = diagnosticOwnData(value, key);
    if (property.state !== "data") fail(`${label}.${key} must be own data`);
    snapshot[key] = property.value;
  }
  return snapshot;
}

function selectedOwnDataOptions(value) {
  if (value === undefined) return Object.create(null);
  if (
    value === null ||
    typeof value !== "object" ||
    utilTypes.isProxy(value)
  ) fail("structured-output execution options must be an exact own-data object");
  let isArray;
  let prototype;
  let ownKeys;
  try {
    isArray = Array.isArray(value);
    prototype = Object.getPrototypeOf(value);
    ownKeys = Reflect.ownKeys(value);
  } catch {
    fail("structured-output execution options must be an exact own-data object");
  }
  if (
    isArray ||
    (prototype !== Object.prototype && prototype !== null) ||
    ownKeys.some((key) => typeof key !== "string" || !EXECUTION_OPTION_KEYS.includes(key))
  ) fail("structured-output execution options keys are invalid");
  const snapshot = Object.create(null);
  for (const key of ownKeys) {
    const property = diagnosticOwnData(value, key);
    if (property.state !== "data") {
      fail(`structured-output execution options.${key} must be own data`);
    }
    snapshot[key] = property.value;
  }
  return snapshot;
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
    value.length > 180 ||
    !/^[A-Za-z0-9._/-]+$/u.test(value) ||
    value.includes("\\") ||
    value.includes("\0") ||
    path.posix.isAbsolute(value) ||
    /^[A-Za-z]:/u.test(value) ||
    value.split("/").some((part) => part === "" || part === "." || part === "..")
  ) fail(`${label} must be a portable relative path`);
}

function validateTuple(value, expectedPath, label) {
  const data = exactOwnDataSnapshot(value, ["path", "bytes", "sha256"], label);
  validatePortableRelativePath(data.path, `${label}.path`);
  if (data.path !== expectedPath) fail(`${label}.path is invalid`);
  if (!Number.isSafeInteger(data.bytes) || data.bytes < 1) {
    fail(`${label}.bytes is invalid`);
  }
  validateDigest(data.sha256, `${label}.sha256`);
}

function validateExecutionPlan(value) {
  const data = exactOwnDataSnapshot(
    value,
    ["schemaVersion", "id", "outputs"],
    "structured-output execution plan",
  );
  if (
    data.schemaVersion !== 1 ||
    data.id !== JOENESS_M4_AUTHORITY_STRUCTURED_OUTPUT_ID
  ) fail("structured-output execution plan identity is invalid");
  const outputs = exactOwnDataSnapshot(
    data.outputs,
    ["evidence", "blocked"],
    "structured-output execution outputs",
  );
  validatePortableRelativePath(outputs.evidence, "structured-output evidence output");
  validatePortableRelativePath(outputs.blocked, "structured-output blocked output");
  if (outputs.evidence.toLowerCase() === outputs.blocked.toLowerCase()) {
    fail("structured-output output paths collide");
  }
}

function validateSourcePin(value) {
  const data = exactOwnDataSnapshot(
    value,
    [
      "repositoryCommit",
      "authorityStructuredOutputRunner",
      "authorityBehaviorContract",
      "fixtureLoader",
      "freshTurnAdapter",
      "transportControlSupport",
    ],
    "structured-output source pin",
  );
  if (
    typeof data.repositoryCommit !== "string" ||
    !/^[0-9a-f]{40}$/u.test(data.repositoryCommit)
  ) fail("structured-output source commit is invalid");
  validateTuple(
    data.authorityStructuredOutputRunner,
    RUNNER_SOURCE_PATH,
    "structured-output runner source pin",
  );
  validateTuple(
    data.authorityBehaviorContract,
    AUTHORITY_BEHAVIOR_CONTRACT_SOURCE_PATH,
    "structured-output authority contract source pin",
  );
  validateTuple(
    data.fixtureLoader,
    FIXTURE_LOADER_SOURCE_PATH,
    "structured-output fixture loader source pin",
  );
  validateTuple(
    data.freshTurnAdapter,
    FRESH_TURN_ADAPTER_SOURCE_PATH,
    "structured-output fresh turn adapter source pin",
  );
  validateTuple(
    data.transportControlSupport,
    TRANSPORT_CONTROL_SUPPORT_SOURCE_PATH,
    "structured-output transport support source pin",
  );
}

function snapshotPlan(value) {
  return Object.freeze({
    schemaVersion: value.schemaVersion,
    id: value.id,
    outputs: Object.freeze({
      evidence: value.outputs.evidence,
      blocked: value.outputs.blocked,
    }),
  });
}

function snapshotSourcePin(value) {
  return Object.freeze({
    repositoryCommit: value.repositoryCommit,
    authorityStructuredOutputRunner: Object.freeze({
      ...value.authorityStructuredOutputRunner,
    }),
    authorityBehaviorContract: Object.freeze({ ...value.authorityBehaviorContract }),
    fixtureLoader: Object.freeze({ ...value.fixtureLoader }),
    freshTurnAdapter: Object.freeze({ ...value.freshTurnAdapter }),
    transportControlSupport: Object.freeze({ ...value.transportControlSupport }),
  });
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

function diagnosticOwnData(value, key) {
  if (
    value === null ||
    (typeof value !== "object" && typeof value !== "function") ||
    utilTypes.isProxy(value)
  ) return { state: "unsafe" };
  let descriptor;
  try {
    descriptor = Object.getOwnPropertyDescriptor(value, key);
  } catch {
    return { state: "unsafe" };
  }
  if (
    descriptor === undefined ||
    !Object.hasOwn(descriptor, "value") ||
    descriptor.enumerable !== true ||
    descriptor.get ||
    descriptor.set
  ) return { state: "unsafe" };
  return { state: "data", value: descriptor.value };
}

function diagnosticObject(value, keys) {
  if (value === null || typeof value !== "object" || utilTypes.isProxy(value)) {
    return null;
  }
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
  let ownKeys;
  try {
    ownKeys = Reflect.ownKeys(value);
  } catch {
    return null;
  }
  if (
    ownKeys.length !== keys.length ||
    ownKeys.some((key) => typeof key !== "string" || !keys.includes(key))
  ) return null;
  return result;
}

function diagnosticArray(value, maximumLength) {
  if (value === null || typeof value !== "object" || utilTypes.isProxy(value)) {
    return null;
  }
  let lengthDescriptor;
  let ownKeys;
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
    ownKeys = Reflect.ownKeys(value);
  } catch {
    return null;
  }
  const length = lengthDescriptor.value;
  if (
    ownKeys.length !== length + 1 ||
    ownKeys[length] !== "length" ||
    ownKeys.slice(0, length).some((key, index) => key !== String(index))
  ) return null;
  const result = [];
  for (let index = 0; index < length; index += 1) {
    const property = diagnosticOwnData(value, String(index));
    if (property.state !== "data") return null;
    result.push(property.value);
  }
  return result;
}

function passAssessment() {
  return {
    status: "PASS",
    scope:
      "pinned-content-authentic-adapter-structured-output-minimal-authority-behavior",
    structuredOutputSemantics: "PASS-PINNED-FIXTURE",
    serializationCanonicality: "NOT-ASSESSED",
    m4FixtureBehavior: "PASS-PINNED-STRUCTURED-OUTPUT-ONLY",
    m4Overall: "UNVALIDATED",
    projectTaskOverExternalSkill: "VERIFIED-PINNED-STRUCTURED-OUTPUT-ONLY",
    directUserOverProjectAuthority: "NOT-SEPARATELY-EXERCISED",
    installedPluginActivation: "UNVERIFIED",
    superpowersCompatibility: "UNVERIFIED",
    promotionPass: false,
  };
}

function failAssessment() {
  return {
    status: "FAIL",
    scope:
      "pinned-content-authentic-adapter-structured-output-minimal-authority-behavior",
    structuredOutputSemantics: "FAIL-PINNED-FIXTURE",
    serializationCanonicality: "NOT-ASSESSED",
    m4FixtureBehavior: "FAIL-PINNED-STRUCTURED-OUTPUT-ONLY",
    m4Overall: "UNVALIDATED",
    projectTaskOverExternalSkill: "UNVALIDATED",
    directUserOverProjectAuthority: "NOT-SEPARATELY-EXERCISED",
    installedPluginActivation: "UNVERIFIED",
    superpowersCompatibility: "UNVERIFIED",
    promotionPass: false,
  };
}

export function joenessM4AuthorityStructuredOutputSchema() {
  return joenessM4AuthorityBehaviorOutputSchema();
}

export function retainJoenessM4AuthorityStructuredOutputFreshEvidence(
  result,
) {
  const resultData = diagnosticObject(result, [
    "input",
    "outputSchema",
    "blockers",
    "toolEvidence",
    "threadStart",
    "turn",
    "eventCompaction",
    "appServer",
  ]);
  if (resultData === null) fail("structured-output fresh result is unsafe");
  const outputProperty = diagnosticOwnData(result, "output");
  if (outputProperty.state !== "data") {
    throw new StructuredOutputContractError(
      "structured-output fresh result output is unavailable",
    );
  }
  const blockers = diagnosticArray(resultData.blockers, 64);
  const tools = diagnosticArray(resultData.toolEvidence, 64);
  const inputEvidence = diagnosticObject(resultData.input, ["descriptors", "requestSha256"]);
  const outputSchemaEvidence = diagnosticObject(
    resultData.outputSchema,
    ["byteLength", "sha256"],
  );
  const threadStart = diagnosticObject(resultData.threadStart, ["request", "response"]);
  const turn = diagnosticObject(resultData.turn, ["id", "request"]);
  const compaction = diagnosticObject(resultData.eventCompaction, ["rawPayloadRetained"]);
  const appServer = diagnosticObject(resultData.appServer, ["processExitCode", "stderr"]);
  if (
    blockers === null || blockers.length !== 0 ||
    tools === null || tools.length !== 0 ||
    inputEvidence === null || outputSchemaEvidence === null ||
    threadStart === null || turn === null || compaction === null ||
    compaction.rawPayloadRetained !== false || appServer === null
  ) fail("structured-output fresh result boundary is invalid");

  let classification;
  try {
    classification = classifyJoenessM4AuthorityBehaviorOutput(outputProperty.value);
  } catch {
    throw new StructuredOutputContractError(
      "structured-output fresh result output contract is invalid",
    );
  }
  const descriptors = diagnosticArray(inputEvidence.descriptors, FROZEN_INPUTS.length);
  if (descriptors === null || descriptors.length !== FROZEN_INPUTS.length) {
    fail("structured-output input descriptors are invalid");
  }
  const retainedDescriptors = descriptors.map((descriptor, index) => {
    const data = diagnosticExactObject(
      descriptor,
      ["index", "type", "byteLength", "sha256"],
    );
    const expected = FROZEN_INPUTS[index];
    if (
      data === null || data.index !== index || data.type !== "text" ||
      data.byteLength !== expected.byteLength || data.sha256 !== expected.sha256
    ) fail("structured-output input descriptor tuple drift");
    return {
      id: expected.id,
      index,
      type: "text",
      byteLength: expected.byteLength,
      sha256: expected.sha256,
    };
  });
  const request = diagnosticObject(
    threadStart.request,
    ["projectDocMaxBytes", "dynamicToolCount"],
  );
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
  const schemaText = stableStringify(joenessM4AuthorityStructuredOutputSchema());
  if (
    Buffer.byteLength(schemaText) !== OUTPUT_SCHEMA_TUPLE.byteLength ||
    sha256(schemaText) !== OUTPUT_SCHEMA_TUPLE.sha256 ||
    outputSchemaEvidence.byteLength !== OUTPUT_SCHEMA_TUPLE.byteLength ||
    outputSchemaEvidence.sha256 !== OUTPUT_SCHEMA_TUPLE.sha256 ||
    request === null || request.projectDocMaxBytes !== 0 || request.dynamicToolCount !== 0 ||
    response === null || response.ephemeral !== true || response.priorTurnCount !== 0 ||
    response.instructionSourceCount !== 0 ||
    typeof turn.id !== "string" || turn.id.length < 1 ||
    turnRequest === null || turnRequest.inputDescriptorCount !== FROZEN_INPUTS.length ||
    turnRequest.inputRequestSha256 !== DESCRIPTOR_REQUEST_SHA256 ||
    turnRequest.outputSchemaSha256 !== OUTPUT_SCHEMA_TUPLE.sha256 ||
    inputEvidence.requestSha256 !== DESCRIPTOR_REQUEST_SHA256 ||
    appServer.processExitCode !== 0 || stderr === null || stderr.byteLength !== 0 ||
    stderr.truncated !== false || stderr.captureTruncated !== false
  ) fail("structured-output fresh lifecycle boundary is invalid");
  const coverageText = stableStringify(UNAUTHORIZED_ACTION_COVERAGE);
  if (
    Buffer.byteLength(coverageText) !== UNAUTHORIZED_ACTION_COVERAGE_TUPLE.byteLength ||
    sha256(coverageText) !== UNAUTHORIZED_ACTION_COVERAGE_TUPLE.sha256
  ) fail("structured-output unauthorized action coverage tuple drift");
  const status = classification.status;
  const observation = {
    schemaVersion: 1,
    provenance:
      "runner-owned-classification-of-authentic-default-fresh-adapter-structured-output",
    stage: "minimal-authority-behavior-structured-output-validation",
    result: status === "PASS" ? "PASS-PINNED-FIXTURE" : "FAIL-PINNED-FIXTURE",
    mismatchCodes: [...classification.mismatchCodes],
    mismatchCount: classification.mismatchCodes.length,
    rawOutputInspected: false,
    rawOutputPersisted: false,
    rawOutputDigestPersisted: false,
    structuredOutputValuePersisted: false,
    serializationCanonicality: "NOT-ASSESSED",
  };
  return {
    classification,
    evidence: {
      schemaVersion: 1,
      id: JOENESS_M4_AUTHORITY_STRUCTURED_OUTPUT_ID,
      assessment: status === "PASS" ? passAssessment() : failAssessment(),
      input: {
        manifest: {
          id: "joeness-m4-superpowers-v2",
          byteLength: FROZEN_MANIFEST.byteLength,
          sha256: FROZEN_MANIFEST.sha256,
        },
        descriptorCount: FROZEN_INPUTS.length,
        combinedInputBytes: FROZEN_INPUTS.reduce(
          (total, descriptor) => total + descriptor.byteLength,
          0,
        ),
        descriptors: retainedDescriptors,
        canonicalRequest: { ...FROZEN_REQUEST },
        descriptorRequestSha256: DESCRIPTOR_REQUEST_SHA256,
      },
      semanticObservation: observation,
      unauthorizedActionCoverage: {
        items: [...UNAUTHORIZED_ACTION_COVERAGE],
        ...UNAUTHORIZED_ACTION_COVERAGE_TUPLE,
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
      privacy: {
        rawOutputInspected: false,
        rawOutputPersisted: false,
        rawOutputDigestPersisted: false,
        structuredOutputValuePersisted: false,
        pinnedInputContentsPersisted: false,
        rawEventsPersisted: false,
        processIdentifiersPersisted: false,
        absolutePathsPersisted: false,
        rawStderrPersisted: false,
        configContentsPersisted: false,
      },
    },
  };
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
  validatePortableRelativePath(relativePath, "structured-output artifact target");
  const parts = relativePath.split("/");
  const leaf = parts.pop();
  const parentRelative = parts.join("/");
  const parent = parentRelative === ""
    ? repositoryRoot
    : await assertNoSymlinkSegments(
      repositoryRoot,
      parentRelative,
      "structured-output artifact parent",
    );
  const parentStat = await lstat(parent);
  if (!parentStat.isDirectory() || parentStat.isSymbolicLink()) {
    throw new Error(
      "structured-output artifact parent is not a confined regular directory",
    );
  }
  const resolvedRoot = await realpath(repositoryRoot);
  const resolvedParent = await realpath(parent);
  const relative = path.relative(resolvedRoot, resolvedParent);
  if (
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new Error("structured-output artifact parent escapes repository confinement");
  }
  const target = path.join(parent, leaf);
  try {
    const targetStat = await lstat(target);
    if (targetStat.isSymbolicLink()) {
      throw new Error(
        "structured-output artifact target is a symlink or reparse traversal",
      );
    }
    throw new Error(`structured-output artifact collision: ${relativePath}`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

async function verifySourceBoundary({
  repositoryRoot,
  sourcePin,
  gitStatus,
  gitIdentity,
  gitReadBlob,
  allowedPublishedPath = null,
}) {
  const status = await gitStatus(repositoryRoot);
  const allowedStatuses = allowedPublishedPath === null
    ? [""]
    : ["", `?? ${allowedPublishedPath}\n`, `?? ${allowedPublishedPath}\r\n`];
  if (!allowedStatuses.includes(status)) {
    fail("structured-output worktree is dirty");
  }
  if ((await gitIdentity(repositoryRoot)) !== sourcePin.repositoryCommit) {
    fail("structured-output source commit differs from pin");
  }
  for (const role of [
    "authorityStructuredOutputRunner",
    "authorityBehaviorContract",
    "fixtureLoader",
    "freshTurnAdapter",
    "transportControlSupport",
  ]) {
    const tuple = sourcePin[role];
    const blob = await gitReadBlob(
      repositoryRoot,
      sourcePin.repositoryCommit,
      tuple.path,
    );
    if (
      utilTypes.isProxy(blob) ||
      !Buffer.isBuffer(blob) ||
      blob.length !== tuple.bytes ||
      sha256(blob) !== tuple.sha256
    ) fail(`structured-output ${role} source pin drift`);
    const workingPath = await assertNoSymlinkSegments(
      repositoryRoot,
      tuple.path,
      `structured-output ${role} working source`,
    );
    const workingStat = await lstat(workingPath);
    if (!workingStat.isFile() || workingStat.isSymbolicLink()) {
      fail(`structured-output ${role} working source is not a regular file`);
    }
    const working = await readFile(workingPath);
    if (
      working.length !== tuple.bytes ||
      sha256(working) !== tuple.sha256 ||
      !working.equals(blob)
    ) fail(`structured-output ${role} working source pin drift`);
  }
}

async function verifyLiveBoundary(options) {
  await verifySourceBoundary(options);
  const { repositoryRoot, executionPlan, artifactExists } = options;
  for (const output of Object.values(executionPlan.outputs)) {
    await verifyOutputTarget(repositoryRoot, output);
    if (await artifactExists(repositoryRoot, output)) {
      fail(`structured-output artifact collision: ${output}`);
    }
  }
}

function safeConfigTuple(value, label) {
  const data = exactOwnDataSnapshot(value, ["bytes", "sha256"], label);
  if (!Number.isSafeInteger(data.bytes) || data.bytes < 0) {
    fail(`${label}.bytes is invalid`);
  }
  validateDigest(data.sha256, `${label}.sha256`);
  return Object.freeze({ bytes: data.bytes, sha256: data.sha256 });
}

async function verifyPostPublicationBoundary({
  runtime,
  sourceConfigBefore,
  repositoryRoot,
  sourcePin,
  gitStatus,
  gitIdentity,
  gitReadBlob,
  publishedPath,
}) {
  const sourceConfigAfterPublication = safeConfigTuple(
    await runtime.readSourceConfig(),
    "structured-output source config after publication",
  );
  if (
    sourceConfigAfterPublication.bytes !== sourceConfigBefore.bytes ||
    sourceConfigAfterPublication.sha256 !== sourceConfigBefore.sha256
  ) fail("structured-output source config changed during publication");
  await verifySourceBoundary({
    repositoryRoot,
    sourcePin,
    gitStatus,
    gitIdentity,
    gitReadBlob,
    allowedPublishedPath: publishedPath,
  });
}

export function projectJoenessM4AuthorityStructuredOutputFreshFailure(error) {
  return projectJoenessM4TransportControlFreshFailure(error);
}

export async function publishJoenessM4AuthorityStructuredOutputArtifact(options) {
  return publishJoenessM4TransportControlBlockedArtifact(options);
}

function exactPrototype(value, prototype) {
  if (
    value === null ||
    typeof value !== "object" ||
    utilTypes.isProxy(value)
  ) return false;
  try {
    return Object.getPrototypeOf(value) === prototype;
  } catch {
    return false;
  }
}

function blockedReceipt(error, freshFailure) {
  const structuredOutputContract = exactPrototype(
    error,
    StructuredOutputContractError.prototype,
  );
  return {
    schemaVersion: 1,
    status: "blocked",
    phase: "post-runtime-validation",
    safeCleanup: true,
    cause: structuredOutputContract
      ? {
        category: "structured-output-contract",
        result: "BLOCKED_STRUCTURED_OUTPUT_CONTRACT",
      }
      : {
        category: exactPrototype(error, TypeError.prototype)
          ? "contract-validation"
          : "evaluation-failed",
      },
    ...(freshFailure === null ? {} : { freshFailure }),
  };
}

export async function runJoenessM4AuthorityStructuredOutputEval(options) {
  const optionData = selectedOwnDataOptions(options);
  let {
    repositoryRoot,
    executionPlan,
    sourcePin,
    gitStatus,
    gitIdentity,
    gitReadBlob,
    artifactExists,
    runtimeFactory,
    runTurn,
    writeArtifact,
  } = optionData;
  if (gitStatus === undefined) gitStatus = defaultGitStatus;
  if (gitIdentity === undefined) gitIdentity = defaultGitIdentity;
  if (gitReadBlob === undefined) gitReadBlob = defaultGitReadBlob;
  if (artifactExists === undefined) artifactExists = defaultArtifactExists;
  if (runTurn === undefined) runTurn = runFreshEvaluatorTurn;
  validateExecutionPlan(executionPlan);
  validateSourcePin(sourcePin);
  executionPlan = snapshotPlan(executionPlan);
  sourcePin = snapshotSourcePin(sourcePin);
  if (typeof repositoryRoot !== "string" || !path.isAbsolute(repositoryRoot)) {
    fail("structured-output repository root must be absolute");
  }
  for (const dependency of [
    gitStatus,
    gitIdentity,
    gitReadBlob,
    artifactExists,
    runtimeFactory,
    runTurn,
  ]) {
    if (typeof dependency !== "function" || utilTypes.isProxy(dependency)) {
      fail("structured-output execution dependency is invalid");
    }
  }
  if (writeArtifact === undefined) {
    writeArtifact = (relativePath, value) =>
      publishJoenessM4AuthorityStructuredOutputArtifact({
        repositoryRoot,
        relativePath,
        value,
      });
  }
  if (typeof writeArtifact !== "function" || utilTypes.isProxy(writeArtifact)) {
    fail("structured-output artifact writer is invalid");
  }
  if (runTurn !== runFreshEvaluatorTurn) {
    fail(
      "structured-output evidence requires the authentic imported fresh-turn adapter identity",
    );
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
    preflight?.manifest?.id !== "joeness-m4-superpowers-v2" ||
    preflight.manifestBytes !== FROZEN_MANIFEST.byteLength ||
    preflight.manifestSha256 !== FROZEN_MANIFEST.sha256
  ) fail("structured-output frozen manifest tuple drift");
  const input = buildJoenessM4Input(preflight);
  const canonicalRequest = stableStringify(input);
  if (
    Buffer.byteLength(canonicalRequest) !== FROZEN_REQUEST.byteLength ||
    sha256(canonicalRequest) !== FROZEN_REQUEST.sha256
  ) fail("structured-output frozen request tuple drift");
  const outputSchema = joenessM4AuthorityStructuredOutputSchema();
  const schemaText = stableStringify(outputSchema);
  if (
    Buffer.byteLength(schemaText) !== OUTPUT_SCHEMA_TUPLE.byteLength ||
    sha256(schemaText) !== OUTPUT_SCHEMA_TUPLE.sha256
  ) fail("structured-output frozen response schema tuple drift");

  let runtime;
  let sourceConfigBefore;
  let retained;
  let primaryError = null;
  let freshFailure = null;
  let cleanupSafe = false;
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
        authorityStructuredOutputRunner: {
          ...sourcePin.authorityStructuredOutputRunner,
        },
        authorityBehaviorContract: { ...sourcePin.authorityBehaviorContract },
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
    ) fail("structured-output runtime factory result is invalid");
    runtime = {
      session: runtimeData.session,
      finish: (...args) => Reflect.apply(runtimeData.finish, runtimeCandidate, args),
      readSourceConfig: (...args) =>
        Reflect.apply(runtimeData.readSourceConfig, runtimeCandidate, args),
    };
    sourceConfigBefore = safeConfigTuple(
      runtimeData.sourceConfigBefore,
      "structured-output source config before",
    );
    let result;
    try {
      result = await runTurn({
        session: runtime.session,
        root: repositoryRoot,
        input,
        outputSchema,
        dynamicTools: [],
      });
    } catch (error) {
      const projected = projectJoenessM4AuthorityStructuredOutputFreshFailure(error);
      if (projected !== null) {
        const candidate = {
          schemaVersion: 6,
          provenance:
            "authority-structured-output-runner-observed-default-fresh-adapter-rejection",
          runnerStage: "fresh-turn-rejected",
          pinnedRequest: {
            descriptorCount: FROZEN_INPUTS.length,
            byteLength: FROZEN_REQUEST.byteLength,
            sha256: FROZEN_REQUEST.sha256,
          },
          ...projected,
        };
        if (Buffer.byteLength(stableStringify(candidate)) <= 3072) {
          freshFailure = candidate;
        }
      }
      throw error;
    }
    retained = retainJoenessM4AuthorityStructuredOutputFreshEvidence(result);
  } catch (error) {
    primaryError = error;
  }

  let cleanupError = null;
  if (runtime !== undefined) {
    const cleanupErrors = [];
    try {
      await runtime.finish(true);
    } catch (error) {
      cleanupErrors.push(error);
    }
    try {
      const sourceConfigAfter = safeConfigTuple(
        await runtime.readSourceConfig(),
        "structured-output source config after",
      );
      if (
        sourceConfigBefore === undefined ||
        sourceConfigBefore.bytes !== sourceConfigAfter.bytes ||
        sourceConfigBefore.sha256 !== sourceConfigAfter.sha256
      ) fail("structured-output source config changed");
    } catch (error) {
      cleanupErrors.push(error);
    }
    if (cleanupErrors.length === 1) cleanupError = cleanupErrors[0];
    if (cleanupErrors.length > 1) {
      cleanupError = new AggregateError(
        cleanupErrors,
        "structured-output cleanup failed",
        { cause: cleanupErrors[0] },
      );
    }
    cleanupSafe = cleanupErrors.length === 0;
  }
  if (cleanupError !== null) {
    if (primaryError === null) throw cleanupError;
    throw new AggregateError(
      [primaryError, cleanupError],
      "structured-output evaluation and cleanup failed",
      { cause: primaryError },
    );
  }
  if (primaryError !== null) {
    if (cleanupSafe) {
      const blocked = blockedReceipt(primaryError, freshFailure);
      if (Buffer.byteLength(stableStringify(blocked)) > 4096) {
        throw new Error("structured-output blocked receipt exceeds bound", {
          cause: primaryError,
        });
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
      await verifyPostPublicationBoundary({
        runtime,
        sourceConfigBefore,
        repositoryRoot,
        sourcePin,
        gitStatus,
        gitIdentity,
        gitReadBlob,
        publishedPath: executionPlan.outputs.blocked,
      });
    }
    throw primaryError;
  }
  if (!cleanupSafe || retained === undefined) {
    fail("structured-output cleanup was not verified safe");
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
  const durableEvidence = {
    ...retained.evidence,
    sourceConfigReadback: "UNCHANGED",
    runtimeCleanup: "SAFE",
  };
  const resultStatus = retained.classification.status;
  if (Buffer.byteLength(stableStringify(durableEvidence)) > 8192) {
    fail("structured-output evidence exceeds bound");
  }
  await writeArtifact(executionPlan.outputs.evidence, durableEvidence);
  await verifyPostPublicationBoundary({
    runtime,
    sourceConfigBefore,
    repositoryRoot,
    sourcePin,
    gitStatus,
    gitIdentity,
    gitReadBlob,
    publishedPath: executionPlan.outputs.evidence,
  });
  return resultStatus === "PASS" ? passAssessment() : failAssessment();
}
