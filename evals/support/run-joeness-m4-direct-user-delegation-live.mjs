import { execFile as execFileCallback } from "node:child_process";
import { createHash } from "node:crypto";
import { lstatSync } from "node:fs";
import {
  lstat,
  mkdir,
  open,
  readdir,
  readFile,
  realpath,
  rm,
  rmdir,
} from "node:fs/promises";
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
import {
  JOENESS_M4_DIRECT_USER_DELEGATION_ID,
  runJoenessM4DirectUserDelegationEval,
} from "./run-joeness-m4-direct-user-delegation-eval.mjs";
import { runAuthorityRoleSeparatedEvaluatorTurn } from
  "./run-authority-role-separated-evaluator-turn.mjs";
import { publishJoenessM4TransportControlBlockedArtifact } from
  "./run-joeness-m4-transport-control-eval.mjs";

const execFile = promisify(execFileCallback);

export const JOENESS_M4_DIRECT_USER_DELEGATION_LIVE_RUN_ID =
  "joeness-m4-direct-user-delegation-live-v8";

export const JOENESS_M4_DIRECT_USER_DELEGATION_LIVE_PLAN_PATH =
  "evals/skill-contracts/joeness-m4-direct-user-delegation-live-plan-v8.json";

export const JOENESS_M4_DIRECT_USER_DELEGATION_LIVE_OUTPUTS = Object.freeze({
  evidence:
    "evals/skill-contracts/joeness-m4-direct-user-delegation-live-v8-evidence.json",
  blocked:
    "evals/skill-contracts/joeness-m4-direct-user-delegation-live-v8-blocked.json",
});

export const JOENESS_M4_DIRECT_USER_DELEGATION_LIVE_METHOD =
  "single-project-instruction-actual-direct-user-delegated-choice-authentic-adapter-structured-output-verdict";

const PLAN_KEYS = Object.freeze([
  "schemaVersion",
  "id",
  "date",
  "method",
  "predecessor",
  "attempt",
  "source",
  "inputContract",
  "runtime",
  "outputs",
  "resultBoundary",
]);
const SOURCE_ROLES = Object.freeze([
  "directUserDelegationRunner",
  "directUserDelegationWrapper",
  "authorityRoleSeparatedAdapter",
  "freshTurnAdapter",
  "transportControlSupport",
  "collector",
  "fixtureManifest",
]);
const INNER_SOURCE_PIN_KEYS = Object.freeze([
  "repositoryCommit",
  "directUserDelegationRunner",
  "authorityRoleSeparatedAdapter",
  "freshTurnAdapter",
  "transportControlSupport",
  "collector",
  "fixtureManifest",
]);
const TASK_A_SUPPORT_COMMIT = "563b01f337cf2d48a069a9f74c3009ce05987f5f";
const TASK_B_SUPPORT_COMMIT = "2140ee30c69a6159e63daf6ad2d5d0d67d699ce9";
const LIVE_TEST_PATH = "tests/joeness-m4-direct-user-delegation-live.tests.mjs";
const V8_ATTEMPT_INDEX_PATH =
  "evals/skill-contracts/joeness-m4-direct-user-delegation-attempt-index-v8.json";
const SOURCE_PATHS = Object.freeze({
  directUserDelegationRunner:
    "evals/support/run-joeness-m4-direct-user-delegation-eval.mjs",
  directUserDelegationWrapper:
    "evals/support/run-joeness-m4-direct-user-delegation-live.mjs",
  authorityRoleSeparatedAdapter:
    "evals/support/run-authority-role-separated-evaluator-turn.mjs",
  freshTurnAdapter: "evals/support/run-fresh-evaluator-turn.mjs",
  transportControlSupport:
    "evals/support/run-joeness-m4-transport-control-eval.mjs",
  collector: "evals/support/collect-codex-app-server.mjs",
  fixtureManifest:
    "evals/skill-contracts/fixtures/joeness-m4-direct-user-delegation-v1/manifest-v1.json",
});
const PREDECESSOR = Object.freeze({
  id: "joeness-m4-authority-structured-output-live-v7",
  implementationCommit: "7d383300655bec85557dd7b5081e9c53d737ceb8",
  executionHead: "b03ee5aaa8c8eb75f406774b48e44c4f3caa301d",
  persistenceCommit: "d34a994edada2b98690ee6138ce44f846c9ddda6",
  plan: Object.freeze({
    path: "evals/skill-contracts/joeness-m4-authority-structured-output-live-plan-v7.json",
    bytes: 5385,
    sha256: "b7ed789fb74e08218a6a0acc63951573bb5b017ba7175500f1ad04ce527bc64e",
  }),
  rawArtifact: Object.freeze({
    path: "evals/skill-contracts/joeness-m4-authority-structured-output-live-v7-raw.json",
    status: "absent",
  }),
  evidenceArtifact: Object.freeze({
    path: "evals/skill-contracts/joeness-m4-authority-structured-output-live-v7-evidence.json",
    bytes: 9765,
    sha256: "be38955bce262949d26c190ac843c3049ed39a690250e1a8cbcd4a0eaed253f8",
  }),
  blockedArtifact: Object.freeze({
    path: "evals/skill-contracts/joeness-m4-authority-structured-output-live-v7-blocked.json",
    status: "absent",
  }),
  attemptIndex: Object.freeze({
    path: "evals/skill-contracts/joeness-m4-authority-structured-output-attempt-index-v7.json",
    bytes: 23939,
    sha256: "98849113bf6ce273718d24fb41fcca2e739ccf914f17d1dd4a187bf58c1ede3b",
  }),
  sameCommandRetryAuthorized: false,
});
const PROJECT_INPUT = Object.freeze({
  path:
    "evals/skill-contracts/fixtures/joeness-m4-direct-user-delegation-v1/project-AGENTS.md",
  bytes: 833,
  sha256: "c3ffe6bc3dee638ceecf8ccf5f19f76225f2c7a673d0b9bb5a90a93e420b1ab9",
});
const USER_INPUT = Object.freeze({
  path:
    "evals/skill-contracts/fixtures/joeness-m4-direct-user-delegation-v1/direct-user.md",
  bytes: 545,
  sha256: "dc88991fa03b9a15d3215901b19f9a424889b5a2778c5f9b4b873cd309ab666c",
});
const TASK_B_EVIDENCE_KEYS = Object.freeze([
  "schemaVersion",
  "id",
  "assessment",
  "semanticObservation",
  "fixture",
  "runtime",
  "artifactAuthorship",
  "privacy",
  "sourceConfigReadback",
  "runtimeCleanup",
]);
const TASK_B_ASSESSMENT_KEYS = Object.freeze([
  "status",
  "scope",
  "structuredOutputSemantics",
  "serializationCanonicality",
  "delegatedChoiceFixture",
  "m4Overall",
  "directUserChoiceWithinProjectDelegation",
  "directUserOverProjectAuthority",
  "projectTaskOverExternalSkill",
  "externalSkillChannel",
  "installedPluginActivation",
  "superpowersCompatibility",
  "promotionPass",
]);
const TASK_B_OBSERVATION_KEYS = Object.freeze([
  "schemaVersion",
  "provenance",
  "stage",
  "result",
  "mismatchCodes",
  "mismatchCount",
  "rawOutputInspected",
  "rawOutputPersisted",
  "rawOutputDigestPersisted",
  "structuredOutputValuePersisted",
  "serializationCanonicality",
]);
const TASK_B_MISMATCH_CODES = Object.freeze([
  "project-delegation-mismatch",
  "direct-user-selection-role-mismatch",
  "delegated-choice-decision-mismatch",
  "recommendation-mismatch",
  "unexpected-question",
  "unauthorized-actions-mismatch",
]);
const TASK_B_RUNTIME_KEYS = Object.freeze([
  "freshTurnCount",
  "retryCount",
  "projectDocMaxBytes",
  "dynamicToolCount",
  "selectedCapabilityRootCount",
  "priorTurnCount",
  "instructionSourceCount",
  "externalSkillSourceCount",
  "appServerExitCode",
  "stderrByteLength",
  "remoteControl",
  "sessionCleanup",
  "installedPluginActivation",
]);
const TASK_B_PRIVACY_KEYS = Object.freeze([
  "rawOutputInspected",
  "rawOutputPersisted",
  "rawOutputDigestPersisted",
  "structuredOutputValuePersisted",
  "projectInstructionContentsPersisted",
  "directUserContentsPersisted",
  "rawEventsPersisted",
  "processIdentifiersPersisted",
  "absolutePathsPersisted",
  "rawStderrPersisted",
  "configContentsPersisted",
]);
const TASK_B_BLOCKED_PRIVACY_KEYS = Object.freeze([
  "rawOutputPersisted",
  "rawOutputDigestPersisted",
  "structuredOutputValuePersisted",
  "projectInstructionContentsPersisted",
  "directUserContentsPersisted",
  "rawEventsPersisted",
  "processIdentifiersPersisted",
  "absolutePathsPersisted",
  "rawStderrPersisted",
  "configContentsPersisted",
]);
const TASK_A_BLOCKED_STAGES = Object.freeze([
  "options-validation",
  "initial-project-binding",
  "before-thread-start",
  "before-thread-start-session",
  "after-thread-start",
  "after-thread-start-request-readback",
  "before-turn-start",
  "before-turn-start-session",
  "turn-request-clone",
  "turn-input-validation",
  "after-turn-start-session",
  "after-turn-start-request-readback",
  "after-turn-start-response",
  "before-auxiliary-request",
  "after-auxiliary-request",
  "session-runtime-provenance",
  "after-turn-completion",
  "fresh-turn",
  "post-validation",
  "session-cleanup",
  "unmapped",
]);

function fail(message) {
  throw new TypeError(message);
}

function exactObject(value, keys, label) {
  if (
    value === null ||
    typeof value !== "object" ||
    utilTypes.isProxy(value) ||
    Array.isArray(value)
  ) fail(`${label} must be an exact object`);
  let prototype;
  let ownKeys;
  let descriptors;
  try {
    prototype = Object.getPrototypeOf(value);
    ownKeys = Reflect.ownKeys(value);
    descriptors = Object.getOwnPropertyDescriptors(value);
  } catch {
    fail(`${label} must be an exact object`);
  }
  if (
    (prototype !== Object.prototype && prototype !== null) ||
    ownKeys.length !== keys.length ||
    ownKeys.some((key, index) => key !== keys[index])
  ) fail(`${label} keys are invalid`);
  for (const key of keys) {
    const descriptor = descriptors[key];
    if (
      descriptor === undefined ||
      !Object.hasOwn(descriptor, "value") ||
      descriptor.enumerable !== true ||
      descriptor.get !== undefined ||
      descriptor.set !== undefined
    ) fail(`${label}.${key} must be own data`);
  }
  return Object.fromEntries(keys.map((key) => [key, descriptors[key].value]));
}

function exactEmptyArray(value, label) {
  if (
    value === null ||
    typeof value !== "object" ||
    utilTypes.isProxy(value) ||
    !Array.isArray(value)
  ) fail(`${label} must be an empty array`);
  let keys;
  let length;
  try {
    keys = Reflect.ownKeys(value);
    length = Object.getOwnPropertyDescriptor(value, "length")?.value;
  } catch {
    fail(`${label} must be an empty array`);
  }
  if (length !== 0 || keys.length !== 1 || keys[0] !== "length") {
    fail(`${label} must be an empty array`);
  }
}

function exact(value, expected, label) {
  if (value !== expected) fail(`${label} is invalid`);
}

function digest(value, length, label) {
  if (typeof value !== "string" || !new RegExp(`^[0-9a-f]{${length}}$`, "u").test(value)) {
    fail(`${label} is invalid`);
  }
}

function tuple(value, expected, label) {
  const data = exactObject(value, ["bytes", "sha256"], label);
  exact(data.bytes, expected.bytes, `${label}.bytes`);
  exact(data.sha256, expected.sha256, `${label}.sha256`);
}

function sourceTuple(value, expected, label, flexible = false) {
  const data = exactObject(value, ["path", "bytes", "sha256"], label);
  exact(data.path, expected.path, `${label}.path`);
  if (flexible) {
    if (!Number.isSafeInteger(data.bytes) || data.bytes < 1) fail(`${label}.bytes is invalid`);
    digest(data.sha256, 64, `${label}.sha256`);
  } else {
    exact(data.bytes, expected.bytes, `${label}.bytes`);
    exact(data.sha256, expected.sha256, `${label}.sha256`);
  }
}

export function validateJoenessM4DirectUserDelegationLivePlan(value) {
  const plan = exactObject(value, PLAN_KEYS, "direct-user delegation live plan");
  exact(plan.schemaVersion, 8, "plan.schemaVersion");
  exact(plan.id, JOENESS_M4_DIRECT_USER_DELEGATION_LIVE_RUN_ID, "plan.id");
  exact(plan.date, "2026-08-15", "plan.date");
  exact(plan.method, JOENESS_M4_DIRECT_USER_DELEGATION_LIVE_METHOD, "plan.method");

  const predecessor = exactObject(plan.predecessor, [
    "id", "implementationCommit", "executionHead", "persistenceCommit", "plan",
    "rawArtifact", "evidenceArtifact", "blockedArtifact", "attemptIndex",
    "sameCommandRetryAuthorized",
  ], "plan.predecessor");
  exact(predecessor.id, "joeness-m4-authority-structured-output-live-v7", "predecessor.id");
  exact(predecessor.implementationCommit, "7d383300655bec85557dd7b5081e9c53d737ceb8", "predecessor.implementationCommit");
  exact(predecessor.executionHead, "b03ee5aaa8c8eb75f406774b48e44c4f3caa301d", "predecessor.executionHead");
  exact(predecessor.persistenceCommit, "d34a994edada2b98690ee6138ce44f846c9ddda6", "predecessor.persistenceCommit");
  const predecessorPlan = exactObject(predecessor.plan, ["path", "bytes", "sha256"], "predecessor.plan");
  exact(predecessorPlan.path, "evals/skill-contracts/joeness-m4-authority-structured-output-live-plan-v7.json", "predecessor.plan.path");
  exact(predecessorPlan.bytes, 5385, "predecessor.plan.bytes");
  exact(predecessorPlan.sha256, "b7ed789fb74e08218a6a0acc63951573bb5b017ba7175500f1ad04ce527bc64e", "predecessor.plan.sha256");
  for (const [name, artifactPath] of [
    ["rawArtifact", "evals/skill-contracts/joeness-m4-authority-structured-output-live-v7-raw.json"],
    ["blockedArtifact", "evals/skill-contracts/joeness-m4-authority-structured-output-live-v7-blocked.json"],
  ]) {
    const artifact = exactObject(predecessor[name], ["path", "status"], `predecessor.${name}`);
    exact(artifact.path, artifactPath, `predecessor.${name}.path`);
    exact(artifact.status, "absent", `predecessor.${name}.status`);
  }
  const evidence = exactObject(predecessor.evidenceArtifact, ["path", "bytes", "sha256"], "predecessor.evidenceArtifact");
  exact(evidence.path, JOENESS_M4_DIRECT_USER_DELEGATION_LIVE_OUTPUTS.evidence.replace("direct-user-delegation-live-v8", "authority-structured-output-live-v7"), "predecessor.evidenceArtifact.path");
  exact(evidence.bytes, 9765, "predecessor.evidenceArtifact.bytes");
  exact(evidence.sha256, "be38955bce262949d26c190ac843c3049ed39a690250e1a8cbcd4a0eaed253f8", "predecessor.evidenceArtifact.sha256");
  const index = exactObject(predecessor.attemptIndex, ["path", "bytes", "sha256"], "predecessor.attemptIndex");
  exact(index.path, "evals/skill-contracts/joeness-m4-authority-structured-output-attempt-index-v7.json", "predecessor.attemptIndex.path");
  exact(index.bytes, 23939, "predecessor.attemptIndex.bytes");
  exact(index.sha256, "98849113bf6ce273718d24fb41fcca2e739ccf914f17d1dd4a187bf58c1ede3b", "predecessor.attemptIndex.sha256");
  exact(predecessor.sameCommandRetryAuthorized, false, "predecessor.sameCommandRetryAuthorized");

  const attempt = exactObject(plan.attempt, ["freshTurnCount", "retryCount", "automaticRetry"], "plan.attempt");
  exact(attempt.freshTurnCount, 1, "attempt.freshTurnCount");
  exact(attempt.retryCount, 0, "attempt.retryCount");
  exact(attempt.automaticRetry, false, "attempt.automaticRetry");

  const source = exactObject(plan.source, ["planImplementationCommit", ...SOURCE_ROLES], "plan.source");
  digest(source.planImplementationCommit, 40, "source.planImplementationCommit");
  const expectedSources = {
    directUserDelegationRunner: { path: "evals/support/run-joeness-m4-direct-user-delegation-eval.mjs", bytes: 50725, sha256: "acabceb132117198d5035fba1f1b27e5abb4c2742e1053336897cf49b288bd55" },
    directUserDelegationWrapper: { path: "evals/support/run-joeness-m4-direct-user-delegation-live.mjs" },
    authorityRoleSeparatedAdapter: { path: "evals/support/run-authority-role-separated-evaluator-turn.mjs", bytes: 29334, sha256: "cae472f7d82cc603cc0d16c0234c03b5213511aed8e96178aa45aa47a8efd96f" },
    freshTurnAdapter: { path: "evals/support/run-fresh-evaluator-turn.mjs", bytes: 56845, sha256: "4884154dd1884b6fa899eef854307edec2a9897cb39b1f45c9c03479cab34247" },
    transportControlSupport: { path: "evals/support/run-joeness-m4-transport-control-eval.mjs", bytes: 49611, sha256: "547077688884d8d0c94558fc84322bcf31b61b0a6d6583359423f2c161029cfa" },
    collector: { path: "evals/support/collect-codex-app-server.mjs", bytes: 297632, sha256: "8b81ddb28be2a803500839a2de61f9bb397aa96711d039bdb7a3a86cfad8d687" },
    fixtureManifest: { path: "evals/skill-contracts/fixtures/joeness-m4-direct-user-delegation-v1/manifest-v1.json", bytes: 1550, sha256: "b0b6df573fb5c8d87522c0e7eb895e4ed8a13e2cfc50f523030115dfcc1397ac" },
  };
  for (const role of SOURCE_ROLES) sourceTuple(source[role], expectedSources[role], `source.${role}`, role === "directUserDelegationWrapper");

  const input = exactObject(plan.inputContract, ["fixtureId", "manifest", "projectInstruction", "directUser", "responseContract", "responseSchema", "additionalPromptCount"], "plan.inputContract");
  exact(input.fixtureId, "joeness-m4-direct-user-delegation-v1", "inputContract.fixtureId");
  tuple(input.manifest, { bytes: 1550, sha256: "b0b6df573fb5c8d87522c0e7eb895e4ed8a13e2cfc50f523030115dfcc1397ac" }, "inputContract.manifest");
  const project = exactObject(input.projectInstruction, ["role", "fixturePath", "runtimeRelativePath", "bytes", "sha256"], "inputContract.projectInstruction");
  exact(project.role, "project", "projectInstruction.role");
  exact(project.fixturePath, "project-AGENTS.md", "projectInstruction.fixturePath");
  exact(project.runtimeRelativePath, "AGENTS.md", "projectInstruction.runtimeRelativePath");
  exact(project.bytes, 833, "projectInstruction.bytes");
  exact(project.sha256, "c3ffe6bc3dee638ceecf8ccf5f19f76225f2c7a673d0b9bb5a90a93e420b1ab9", "projectInstruction.sha256");
  const user = exactObject(input.directUser, ["role", "descriptorCount", "type", "bytes", "sha256", "canonicalRequest", "descriptorRequestSha256"], "inputContract.directUser");
  exact(user.role, "user", "directUser.role");
  exact(user.descriptorCount, 1, "directUser.descriptorCount");
  exact(user.type, "text", "directUser.type");
  exact(user.bytes, 545, "directUser.bytes");
  exact(user.sha256, "dc88991fa03b9a15d3215901b19f9a424889b5a2778c5f9b4b873cd309ab666c", "directUser.sha256");
  tuple(user.canonicalRequest, { bytes: 579, sha256: "4c795bf716aae59d3b86b04777f20287979a043c334a986eacaa6392f849d14f" }, "directUser.canonicalRequest");
  exact(user.descriptorRequestSha256, "73a23b0b54494a5a24916d75e599f5cbd75e3ac2231d6849c8cda7d79411855f", "directUser.descriptorRequestSha256");
  exact(input.responseContract, "delegated-direct-user-choice-semantic-verdict", "inputContract.responseContract");
  tuple(input.responseSchema, { bytes: 1049, sha256: "ceed0a7aa6240841e18f9c1f94bf6924c4798fbeddcd3f6f2cee359e7248f31a" }, "inputContract.responseSchema");
  exact(input.additionalPromptCount, 0, "inputContract.additionalPromptCount");

  const runtime = exactObject(plan.runtime, ["codexVersion", "projectDocs", "projectDocMaxBytes", "instructionSourceCount", "externalSkills", "selectedCapabilityRoots", "dynamicTools", "installedPluginActivation"], "plan.runtime");
  exact(runtime.codexVersion, "codex-cli 0.146.0", "runtime.codexVersion");
  exact(runtime.projectDocs, "enabled", "runtime.projectDocs");
  exact(runtime.projectDocMaxBytes, 32768, "runtime.projectDocMaxBytes");
  exact(runtime.instructionSourceCount, 1, "runtime.instructionSourceCount");
  exactEmptyArray(runtime.externalSkills, "runtime.externalSkills");
  exactEmptyArray(runtime.selectedCapabilityRoots, "runtime.selectedCapabilityRoots");
  exactEmptyArray(runtime.dynamicTools, "runtime.dynamicTools");
  exact(runtime.installedPluginActivation, "UNVERIFIED", "runtime.installedPluginActivation");

  const outputs = exactObject(plan.outputs, ["evidence", "blocked"], "plan.outputs");
  exact(outputs.evidence, JOENESS_M4_DIRECT_USER_DELEGATION_LIVE_OUTPUTS.evidence, "outputs.evidence");
  exact(outputs.blocked, JOENESS_M4_DIRECT_USER_DELEGATION_LIVE_OUTPUTS.blocked, "outputs.blocked");
  if (outputs.evidence === outputs.blocked) fail("plan outputs must be distinct");

  const result = exactObject(plan.resultBoundary, ["state", "validation", "scope", "structuredOutputSemantics", "serializationCanonicality", "delegatedChoiceFixture", "m4Overall", "directUserChoiceWithinProjectDelegation", "directUserOverProjectAuthority", "projectTaskOverExternalSkill", "externalSkillChannel", "installedPluginActivation", "superpowersCompatibility", "promotionPass", "corePromotion", "manifestPromotion", "pluginConfigurationChange"], "plan.resultBoundary");
  const expectedResult = {
    state: "candidate", validation: "unvalidated", scope: "actual-direct-user-turn-single-project-instruction-delegated-choice-structured-output-only",
    structuredOutputSemantics: "UNVALIDATED", serializationCanonicality: "NOT-ASSESSED", delegatedChoiceFixture: "UNVALIDATED", m4Overall: "UNVALIDATED",
    directUserChoiceWithinProjectDelegation: "UNVALIDATED", directUserOverProjectAuthority: "NOT-EXERCISED", projectTaskOverExternalSkill: "NOT-EXERCISED",
    externalSkillChannel: "NOT-EXERCISED", installedPluginActivation: "UNVERIFIED", superpowersCompatibility: "NOT-EXERCISED",
    promotionPass: false, corePromotion: false, manifestPromotion: false, pluginConfigurationChange: false,
  };
  for (const key of Object.keys(expectedResult)) exact(result[key], expectedResult[key], `resultBoundary.${key}`);
  return value;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function subsetObject(value, allowed, label) {
  if (
    value === null ||
    typeof value !== "object" ||
    utilTypes.isProxy(value) ||
    Array.isArray(value)
  ) fail(`${label} must be an object`);
  let prototype;
  let keys;
  let descriptors;
  try {
    prototype = Object.getPrototypeOf(value);
    keys = Reflect.ownKeys(value);
    descriptors = Object.getOwnPropertyDescriptors(value);
  } catch {
    fail(`${label} must be an object`);
  }
  if (
    (prototype !== Object.prototype && prototype !== null) ||
    keys.some((key) => typeof key !== "string" || !allowed.includes(key))
  ) fail(`${label} keys are invalid`);
  const result = Object.create(null);
  for (const key of keys) {
    const descriptor = descriptors[key];
    if (
      descriptor === undefined ||
      !Object.hasOwn(descriptor, "value") ||
      descriptor.enumerable !== true ||
      descriptor.get !== undefined ||
      descriptor.set !== undefined
    ) fail(`${label}.${key} must be own data`);
    result[key] = descriptor.value;
  }
  return result;
}

function portablePath(value, label) {
  if (
    typeof value !== "string" ||
    value.length < 1 ||
    value.length > 220 ||
    !/^[A-Za-z0-9._/-]+$/u.test(value) ||
    value.includes("\\") ||
    path.posix.isAbsolute(value) ||
    /^[A-Za-z]:/u.test(value) ||
    value.split("/").some((part) => part === "" || part === "." || part === "..")
  ) fail(`${label} is invalid`);
}

async function gitText(root, args) {
  const { stdout } = await execFile("git", args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
    windowsHide: true,
  });
  return stdout.replace(/\r\n/gu, "\n").trim();
}

async function gitBlob(root, revision, relativePath) {
  const { stdout } = await execFile(
    "git",
    ["cat-file", "blob", `${revision}:${relativePath}`],
    {
      cwd: root,
      encoding: "buffer",
      maxBuffer: 4 * 1024 * 1024,
      windowsHide: true,
    },
  );
  return Buffer.from(stdout);
}

async function gitBlobExists(root, revision, relativePath) {
  try {
    await execFile("git", ["cat-file", "-e", `${revision}:${relativePath}`], {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 4 * 1024 * 1024,
      windowsHide: true,
    });
    return true;
  } catch (error) {
    if (error?.code === 128) return false;
    throw error;
  }
}

async function gitIsAncestor(root, ancestor, descendant) {
  try {
    await execFile("git", ["merge-base", "--is-ancestor", ancestor, descendant], {
      cwd: root,
      encoding: "utf8",
      windowsHide: true,
    });
    return true;
  } catch (error) {
    if (error?.code === 1) return false;
    throw error;
  }
}

function sameFileIdentity(first, second) {
  return (
    first.dev === second.dev &&
    first.ino === second.ino &&
    first.birthtimeNs === second.birthtimeNs &&
    first.size === second.size &&
    first.nlink === second.nlink
  );
}

function sameDirectoryIdentity(first, second) {
  return (
    first.dev === second.dev &&
    first.ino === second.ino &&
    first.birthtimeNs === second.birthtimeNs
  );
}

async function captureOwnedDirectory(target, label) {
  const before = await lstat(target, { bigint: true });
  if (!before.isDirectory() || before.isSymbolicLink()) {
    throw new Error(`${label} must be a real directory`);
  }
  const resolved = await realpath(target);
  const after = await lstat(resolved, { bigint: true });
  if (
    !after.isDirectory() ||
    after.isSymbolicLink() ||
    !sameDirectoryIdentity(before, after)
  ) throw new Error(`${label} identity is unstable`);
  return { resolvedPath: resolved, ticket: after };
}

async function requireOwnedDirectory(target, expected, label) {
  const current = await captureOwnedDirectory(target, label);
  if (
    current.resolvedPath !== expected.resolvedPath ||
    !sameDirectoryIdentity(current.ticket, expected.ticket)
  ) throw new Error(`${label} identity changed`);
  return current;
}

function pathIsConfined(root, target) {
  const relative = path.relative(root, target);
  return !(
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  );
}

async function readUniqueConfinedFile(root, relativePath, label) {
  portablePath(relativePath, `${label}.path`);
  let parent = root;
  const parts = relativePath.split("/");
  const leaf = parts.pop();
  for (const part of parts) {
    parent = path.join(parent, part);
    const state = await lstat(parent, { bigint: true });
    if (!state.isDirectory() || state.isSymbolicLink()) {
      throw new Error(`${label} parent is unsafe`);
    }
  }
  const resolvedParent = await realpath(parent);
  if (!pathIsConfined(root, resolvedParent)) throw new Error(`${label} escapes repository`);
  const target = path.join(resolvedParent, leaf);
  const before = await lstat(target, { bigint: true });
  if (
    !before.isFile() ||
    before.isSymbolicLink() ||
    before.nlink !== 1n
  ) throw new Error(`${label} must be a unique regular file`);
  const resolvedBefore = await realpath(target);
  if (!pathIsConfined(root, resolvedBefore)) throw new Error(`${label} escapes repository`);
  const bytes = await readFile(target);
  const after = await lstat(target, { bigint: true });
  const resolvedAfter = await realpath(target);
  if (
    !after.isFile() ||
    after.isSymbolicLink() ||
    after.nlink !== 1n ||
    resolvedAfter !== resolvedBefore ||
    !sameFileIdentity(before, after) ||
    BigInt(bytes.length) !== after.size
  ) throw new Error(`${label} changed during readback`);
  return { bytes, resolvedPath: resolvedAfter, ticket: after };
}

function cloneSafeData(value, label, state = { depth: 0, entries: 0 }) {
  state.entries += 1;
  if (state.entries > 4096 || state.depth > 24) fail(`${label} exceeds bounds`);
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "object" || utilTypes.isProxy(value)) {
    fail(`${label} must contain safe data`);
  }
  let isArray;
  let prototype;
  let keys;
  try {
    isArray = Array.isArray(value);
    prototype = Object.getPrototypeOf(value);
    keys = Reflect.ownKeys(value);
  } catch {
    fail(`${label} must contain safe data`);
  }
  if (isArray) {
    const length = Object.getOwnPropertyDescriptor(value, "length")?.value;
    if (
      !Number.isSafeInteger(length) ||
      length < 0 ||
      keys.length !== length + 1 ||
      keys[length] !== "length" ||
      keys.slice(0, length).some((key, index) => key !== String(index))
    ) fail(`${label} array is invalid`);
    const nested = { depth: state.depth + 1, entries: state.entries };
    const result = [];
    for (let index = 0; index < length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (!descriptor || !Object.hasOwn(descriptor, "value")) {
        fail(`${label}[${index}] must be own data`);
      }
      result.push(cloneSafeData(descriptor.value, `${label}[${index}]`, nested));
    }
    state.entries = nested.entries;
    return result;
  }
  if (
    (prototype !== Object.prototype && prototype !== null) ||
    keys.some((key) => typeof key !== "string")
  ) fail(`${label} object is invalid`);
  const nested = { depth: state.depth + 1, entries: state.entries };
  const result = {};
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !Object.hasOwn(descriptor, "value")) {
      fail(`${label}.${key} must be own data`);
    }
    Object.defineProperty(result, key, {
      value: cloneSafeData(descriptor.value, `${label}.${key}`, nested),
      enumerable: true,
      configurable: true,
      writable: true,
    });
  }
  state.entries = nested.entries;
  return result;
}

function exactTupleMatch(value, expected, label) {
  const data = exactObject(value, ["path", "bytes", "sha256"], label);
  exact(data.path, expected.path, `${label}.path`);
  exact(data.bytes, expected.bytes, `${label}.bytes`);
  exact(data.sha256, expected.sha256, `${label}.sha256`);
  return { path: data.path, bytes: data.bytes, sha256: data.sha256 };
}

function exactAbsentMatch(value, expected, label) {
  const data = exactObject(value, ["path", "status"], label);
  exact(data.path, expected.path, `${label}.path`);
  exact(data.status, "absent", `${label}.status`);
  return { path: data.path, status: data.status };
}

function snapshotExecutionBoundary(value) {
  const boundary = exactObject(
    value,
    ["plan", "executionSource", "outputsAbsent"],
    "direct-user delegation execution boundary",
  );
  validateJoenessM4DirectUserDelegationLivePlan(boundary.plan);
  if (boundary.outputsAbsent !== true) {
    fail("direct-user delegation execution outputs must be absent");
  }
  const source = exactObject(
    boundary.executionSource,
    [
      "planImplementationCommit",
      "executionHead",
      "executionHeadParent",
      "plan",
      "predecessor",
      "sourcePins",
      "implementationSourcesMatchSupportPlanAndWorking",
    ],
    "direct-user delegation execution source",
  );
  exact(
    source.planImplementationCommit,
    boundary.plan.source.planImplementationCommit,
    "execution source implementation commit",
  );
  digest(source.executionHead, 40, "execution source HEAD");
  exact(
    source.executionHeadParent,
    source.planImplementationCommit,
    "execution source HEAD parent",
  );
  const planTuple = exactObject(
    source.plan,
    ["path", "bytes", "sha256"],
    "execution source plan",
  );
  exact(
    planTuple.path,
    JOENESS_M4_DIRECT_USER_DELEGATION_LIVE_PLAN_PATH,
    "execution source plan path",
  );
  if (!Number.isSafeInteger(planTuple.bytes) || planTuple.bytes < 1) {
    fail("execution source plan bytes are invalid");
  }
  digest(planTuple.sha256, 64, "execution source plan SHA-256");

  const predecessor = exactObject(
    source.predecessor,
    [
      "id",
      "implementationCommit",
      "executionHead",
      "persistenceCommit",
      "plan",
      "rawArtifact",
      "evidenceArtifact",
      "blockedArtifact",
      "attemptIndex",
      "sameCommandRetryAuthorized",
      "artifactsMatchSupportPlanAndWorking",
      "persistenceCommitIsAncestorOfSupport",
    ],
    "execution source predecessor",
  );
  for (const key of [
    "id",
    "implementationCommit",
    "executionHead",
    "persistenceCommit",
    "sameCommandRetryAuthorized",
  ]) {
    exact(predecessor[key], PREDECESSOR[key], `execution predecessor.${key}`);
  }
  const predecessorSnapshot = {
    id: predecessor.id,
    implementationCommit: predecessor.implementationCommit,
    executionHead: predecessor.executionHead,
    persistenceCommit: predecessor.persistenceCommit,
    plan: exactTupleMatch(predecessor.plan, PREDECESSOR.plan, "execution predecessor.plan"),
    rawArtifact: exactAbsentMatch(
      predecessor.rawArtifact,
      PREDECESSOR.rawArtifact,
      "execution predecessor.rawArtifact",
    ),
    evidenceArtifact: exactTupleMatch(
      predecessor.evidenceArtifact,
      PREDECESSOR.evidenceArtifact,
      "execution predecessor.evidenceArtifact",
    ),
    blockedArtifact: exactAbsentMatch(
      predecessor.blockedArtifact,
      PREDECESSOR.blockedArtifact,
      "execution predecessor.blockedArtifact",
    ),
    attemptIndex: exactTupleMatch(
      predecessor.attemptIndex,
      PREDECESSOR.attemptIndex,
      "execution predecessor.attemptIndex",
    ),
    sameCommandRetryAuthorized: false,
    artifactsMatchSupportPlanAndWorking: true,
    persistenceCommitIsAncestorOfSupport: true,
  };
  exact(
    predecessor.artifactsMatchSupportPlanAndWorking,
    true,
    "execution predecessor artifact receipt",
  );
  exact(
    predecessor.persistenceCommitIsAncestorOfSupport,
    true,
    "execution predecessor ancestry receipt",
  );

  const pins = exactObject(
    source.sourcePins,
    SOURCE_ROLES,
    "execution source pins",
  );
  const sourcePins = {};
  for (const role of SOURCE_ROLES) {
    sourcePins[role] = exactTupleMatch(
      pins[role],
      boundary.plan.source[role],
      `execution source pin ${role}`,
    );
  }
  exact(
    source.implementationSourcesMatchSupportPlanAndWorking,
    true,
    "execution source working receipt",
  );
  return {
    plan: cloneSafeData(boundary.plan, "direct-user delegation boundary plan"),
    executionSource: {
      planImplementationCommit: source.planImplementationCommit,
      executionHead: source.executionHead,
      executionHeadParent: source.executionHeadParent,
      plan: {
        path: planTuple.path,
        bytes: planTuple.bytes,
        sha256: planTuple.sha256,
      },
      predecessor: predecessorSnapshot,
      sourcePins,
      implementationSourcesMatchSupportPlanAndWorking: true,
    },
    outputsAbsent: true,
  };
}

async function captureSourceConfig(sourceCodexHome, expectedHomeTicket = null) {
  if (typeof sourceCodexHome !== "string" || !path.isAbsolute(sourceCodexHome)) {
    fail("direct-user delegation source Codex home must be absolute");
  }
  const home = expectedHomeTicket === null
    ? await captureOwnedDirectory(sourceCodexHome, "direct-user delegation source home")
    : await requireOwnedDirectory(
      sourceCodexHome,
      expectedHomeTicket,
      "direct-user delegation source home",
    );
  const config = await readUniqueConfinedFile(
    home.resolvedPath,
    "config.toml",
    "direct-user delegation source config",
  );
  await requireOwnedDirectory(
    sourceCodexHome,
    home,
    "direct-user delegation source home",
  );
  return {
    home,
    configTicket: config.ticket,
    tuple: {
      bytes: config.bytes.length,
      sha256: sha256(config.bytes),
    },
  };
}

export async function snapshotJoenessM4DirectUserDelegationSourceConfig(options) {
  const data = subsetObject(
    options,
    ["sourceCodexHome"],
    "direct-user delegation source config options",
  );
  const snapshot = await captureSourceConfig(data.sourceCodexHome);
  return { ...snapshot.tuple };
}

async function requireAbsentConfinedTarget(root, relativePath, label) {
  portablePath(relativePath, `${label}.path`);
  let parent = root;
  const parts = relativePath.split("/");
  const leaf = parts.pop();
  for (const part of parts) {
    parent = path.join(parent, part);
    const state = await lstat(parent, { bigint: true });
    if (!state.isDirectory() || state.isSymbolicLink()) {
      throw new Error(`${label} parent is unsafe`);
    }
  }
  const resolvedParent = await realpath(parent);
  if (!pathIsConfined(root, resolvedParent)) throw new Error(`${label} escapes repository`);
  try {
    await lstat(path.join(resolvedParent, leaf), { bigint: true });
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
  throw new Error(`${label} collision: ${relativePath}`);
}

function assertBlobTuple(blob, expected, label) {
  if (blob.length !== expected.bytes || sha256(blob) !== expected.sha256) {
    throw new Error(`${label} drift`);
  }
}

function assertSameBoundFile(initial, current, expected, label) {
  assertBlobTuple(current.bytes, expected, label);
  if (
    initial.resolvedPath !== current.resolvedPath ||
    !sameFileIdentity(initial.ticket, current.ticket) ||
    !initial.bytes.equals(current.bytes)
  ) throw new Error(`${label} identity changed`);
}

function requireTerminalGitSnapshot(snapshot, executionHead, publishedPath) {
  const lines = snapshot === "" ? [] : snapshot.split("\n");
  const oidLines = lines.filter((line) => line.startsWith("# branch.oid "));
  if (
    oidLines.length !== 1 ||
    oidLines[0] !== `# branch.oid ${executionHead}`
  ) throw new Error("direct-user delegation terminal Git HEAD changed");
  const changes = lines.filter((line) => !line.startsWith("# "));
  const expectedChanges = publishedPath === undefined ? [] : [`? ${publishedPath}`];
  if (
    changes.length !== expectedChanges.length ||
    changes.some((line, index) => line !== expectedChanges[index])
  ) throw new Error("direct-user delegation terminal Git status changed");
}

export async function verifyJoenessM4DirectUserDelegationExecutionBoundary(options) {
  const data = subsetObject(
    options,
    ["repositoryRoot", "planPath", "publishedPath", "operations"],
    "direct-user delegation execution boundary options",
  );
  if (typeof data.repositoryRoot !== "string" || !path.isAbsolute(data.repositoryRoot)) {
    fail("direct-user delegation repository root must be absolute");
  }
  exact(
    data.planPath,
    JOENESS_M4_DIRECT_USER_DELEGATION_LIVE_PLAN_PATH,
    "direct-user delegation plan path",
  );
  if (
    data.publishedPath !== undefined &&
    !Object.values(JOENESS_M4_DIRECT_USER_DELEGATION_LIVE_OUTPUTS)
      .includes(data.publishedPath)
  ) fail("direct-user delegation published path is invalid");
  const injected = data.operations === undefined
    ? Object.create(null)
    : subsetObject(
      data.operations,
      ["gitText"],
      "direct-user delegation execution boundary operations",
    );
  const boundaryGitText = injected.gitText ?? gitText;
  if (typeof boundaryGitText !== "function" || utilTypes.isProxy(boundaryGitText)) {
    fail("direct-user delegation execution Git reader is invalid");
  }

  const rootBefore = await lstat(data.repositoryRoot, { bigint: true });
  if (!rootBefore.isDirectory() || rootBefore.isSymbolicLink()) {
    fail("direct-user delegation repository root must be a real directory");
  }
  const root = await realpath(data.repositoryRoot);
  const lexicalRoot = path.resolve(data.repositoryRoot);
  if (
    (process.platform === "win32" ? lexicalRoot.toLowerCase() : lexicalRoot) !==
    (process.platform === "win32" ? root.toLowerCase() : root)
  ) throw new Error("direct-user delegation repository root aliases another path");
  const expectedStatus = data.publishedPath === undefined
    ? ""
    : `?? ${data.publishedPath}`;
  if (
    (await boundaryGitText(root, ["status", "--porcelain=v1", "--untracked-files=all"])) !==
    expectedStatus
  ) throw new Error("direct-user delegation execution worktree is dirty");
  const executionHead = await boundaryGitText(root, ["rev-parse", "HEAD"]);
  digest(executionHead, 40, "direct-user delegation execution HEAD");

  const planRead = await readUniqueConfinedFile(
    root,
    data.planPath,
    "direct-user delegation live plan",
  );
  const boundFiles = [{
    relativePath: data.planPath,
    label: "direct-user delegation live plan",
    expected: { bytes: planRead.bytes.length, sha256: sha256(planRead.bytes) },
    initial: planRead,
  }];
  if (planRead.bytes.length < 1 || planRead.bytes.length > 32 * 1024) {
    throw new Error("direct-user delegation live plan size is invalid");
  }
  let plan;
  try {
    plan = JSON.parse(planRead.bytes.toString("utf8"));
  } catch (cause) {
    throw new Error("direct-user delegation live plan JSON is malformed", { cause });
  }
  validateJoenessM4DirectUserDelegationLivePlan(plan);
  const support = plan.source.planImplementationCommit;

  const taskBParent = await boundaryGitText(root, [
    "rev-list", "--parents", "-n", "1", TASK_B_SUPPORT_COMMIT,
  ]);
  if (taskBParent !== `${TASK_B_SUPPORT_COMMIT} ${TASK_A_SUPPORT_COMMIT}`) {
    throw new Error("direct-user delegation Task B lineage is invalid");
  }
  const taskBDiff = await boundaryGitText(root, [
    "diff", "--name-status", TASK_A_SUPPORT_COMMIT, TASK_B_SUPPORT_COMMIT,
  ]);
  const expectedTaskBDiff = [
    "A\tevals/skill-contracts/fixtures/joeness-m4-direct-user-delegation-v1/direct-user.md",
    "A\tevals/skill-contracts/fixtures/joeness-m4-direct-user-delegation-v1/manifest-v1.json",
    "A\tevals/skill-contracts/fixtures/joeness-m4-direct-user-delegation-v1/project-AGENTS.md",
    "A\tevals/support/run-joeness-m4-direct-user-delegation-eval.mjs",
    "A\ttests/joeness-m4-direct-user-delegation-eval.tests.mjs",
  ].join("\n");
  if (taskBDiff !== expectedTaskBDiff) {
    throw new Error("direct-user delegation Task B scope is invalid");
  }
  const supportParent = await boundaryGitText(root, [
    "rev-list", "--parents", "-n", "1", support,
  ]);
  if (supportParent !== `${support} ${TASK_B_SUPPORT_COMMIT}`) {
    throw new Error("direct-user delegation support must be a direct Task B child");
  }
  const supportDiff = await boundaryGitText(root, [
    "diff", "--name-status", TASK_B_SUPPORT_COMMIT, support,
  ]);
  const expectedSupportDiff = [
    `A\t${SOURCE_PATHS.directUserDelegationWrapper}`,
    `A\t${LIVE_TEST_PATH}`,
  ].join("\n");
  if (supportDiff !== expectedSupportDiff) {
    throw new Error("direct-user delegation support diff is not wrapper-and-test only");
  }
  const executionParent = await boundaryGitText(root, [
    "rev-list", "--parents", "-n", "1", executionHead,
  ]);
  if (executionParent !== `${executionHead} ${support}`) {
    throw new Error("direct-user delegation execution must be a direct support child");
  }
  const executionDiff = await boundaryGitText(root, [
    "diff", "--name-status", support, executionHead,
  ]);
  if (executionDiff !== `A\t${JOENESS_M4_DIRECT_USER_DELEGATION_LIVE_PLAN_PATH}`) {
    throw new Error("direct-user delegation execution commit is not plan-only");
  }
  if (await gitBlobExists(root, support, data.planPath)) {
    throw new Error("direct-user delegation plan already exists in support");
  }
  const committedPlan = await gitBlob(root, executionHead, data.planPath);
  if (!committedPlan.equals(planRead.bytes)) {
    throw new Error("direct-user delegation working plan differs from execution HEAD");
  }

  const predecessorExecution = await boundaryGitText(root, [
    "rev-list", "--parents", "-n", "1", PREDECESSOR.executionHead,
  ]);
  const predecessorPersistence = await boundaryGitText(root, [
    "rev-list", "--parents", "-n", "1", PREDECESSOR.persistenceCommit,
  ]);
  if (
    predecessorExecution !==
      `${PREDECESSOR.executionHead} ${PREDECESSOR.implementationCommit}`
  ) throw new Error("direct-user delegation predecessor execution lineage is invalid");
  if (
    predecessorPersistence !==
      `${PREDECESSOR.persistenceCommit} ${PREDECESSOR.executionHead}`
  ) throw new Error("direct-user delegation predecessor persistence lineage is invalid");
  if (!(await gitIsAncestor(root, PREDECESSOR.persistenceCommit, support))) {
    throw new Error("direct-user delegation predecessor persistence is not an ancestor");
  }
  if (await gitBlobExists(root, PREDECESSOR.implementationCommit, PREDECESSOR.plan.path)) {
    throw new Error("direct-user delegation predecessor plan must be absent at implementation");
  }
  for (const revision of [PREDECESSOR.implementationCommit, PREDECESSOR.executionHead]) {
    for (const pin of [PREDECESSOR.evidenceArtifact, PREDECESSOR.attemptIndex]) {
      if (await gitBlobExists(root, revision, pin.path)) {
        throw new Error("direct-user delegation predecessor persisted artifact appeared early");
      }
    }
  }
  for (const pin of [PREDECESSOR.rawArtifact, PREDECESSOR.blockedArtifact]) {
    for (const revision of [
      PREDECESSOR.implementationCommit,
      PREDECESSOR.executionHead,
      PREDECESSOR.persistenceCommit,
      support,
      executionHead,
    ]) {
      if (await gitBlobExists(root, revision, pin.path)) {
        throw new Error("direct-user delegation predecessor absent artifact appeared");
      }
    }
    await requireAbsentConfinedTarget(
      root,
      pin.path,
      "direct-user delegation predecessor absent artifact",
    );
  }
  for (const [label, pin, revisions] of [
    ["plan", PREDECESSOR.plan, [PREDECESSOR.executionHead, PREDECESSOR.persistenceCommit, support, executionHead]],
    ["evidence", PREDECESSOR.evidenceArtifact, [PREDECESSOR.persistenceCommit, support, executionHead]],
    ["attempt index", PREDECESSOR.attemptIndex, [PREDECESSOR.persistenceCommit, support, executionHead]],
  ]) {
    for (const revision of revisions) {
      assertBlobTuple(
        await gitBlob(root, revision, pin.path),
        pin,
        `direct-user delegation predecessor ${label}`,
      );
    }
    const working = await readUniqueConfinedFile(
      root,
      pin.path,
      `direct-user delegation predecessor ${label}`,
    );
    assertBlobTuple(working.bytes, pin, `direct-user delegation predecessor ${label}`);
    boundFiles.push({
      relativePath: pin.path,
      label: `direct-user delegation predecessor ${label}`,
      expected: pin,
      initial: working,
    });
  }

  for (const pin of [PROJECT_INPUT, USER_INPUT]) {
    for (const revision of [TASK_B_SUPPORT_COMMIT, support, executionHead]) {
      assertBlobTuple(
        await gitBlob(root, revision, pin.path),
        pin,
        `direct-user delegation input ${pin.path}`,
      );
    }
    const working = await readUniqueConfinedFile(
      root,
      pin.path,
      `direct-user delegation input ${pin.path}`,
    );
    assertBlobTuple(working.bytes, pin, `direct-user delegation input ${pin.path}`);
    boundFiles.push({
      relativePath: pin.path,
      label: `direct-user delegation input ${pin.path}`,
      expected: pin,
      initial: working,
    });
  }

  const sourcePins = {};
  for (const role of SOURCE_ROLES) {
    const pin = plan.source[role];
    const expectedPath = SOURCE_PATHS[role];
    for (const revision of [support, executionHead]) {
      assertBlobTuple(
        await gitBlob(root, revision, expectedPath),
        pin,
        `direct-user delegation source ${role}`,
      );
    }
    const working = await readUniqueConfinedFile(
      root,
      expectedPath,
      `direct-user delegation source ${role}`,
    );
    assertBlobTuple(working.bytes, pin, `direct-user delegation source ${role}`);
    boundFiles.push({
      relativePath: expectedPath,
      label: `direct-user delegation source ${role}`,
      expected: pin,
      initial: working,
    });
    sourcePins[role] = { ...pin };
  }

  if (await gitBlobExists(root, support, V8_ATTEMPT_INDEX_PATH)) {
    throw new Error("direct-user delegation attempt index exists at support");
  }
  if (await gitBlobExists(root, executionHead, V8_ATTEMPT_INDEX_PATH)) {
    throw new Error("direct-user delegation attempt index exists at execution");
  }
  await requireAbsentConfinedTarget(
    root,
    V8_ATTEMPT_INDEX_PATH,
    "direct-user delegation attempt index",
  );

  let publishedArtifact;
  for (const outputPath of Object.values(JOENESS_M4_DIRECT_USER_DELEGATION_LIVE_OUTPUTS)) {
    if (await gitBlobExists(root, executionHead, outputPath)) {
      throw new Error(`direct-user delegation output is committed: ${outputPath}`);
    }
    if (outputPath === data.publishedPath) {
      const artifact = await readUniqueConfinedFile(
        root,
        outputPath,
        "direct-user delegation published artifact",
      );
      publishedArtifact = {
        path: outputPath,
        byteLength: artifact.bytes.length,
        sha256: sha256(artifact.bytes),
      };
      boundFiles.push({
        relativePath: outputPath,
        label: "direct-user delegation published artifact",
        expected: {
          bytes: artifact.bytes.length,
          sha256: sha256(artifact.bytes),
        },
        initial: artifact,
      });
    } else {
      await requireAbsentConfinedTarget(
        root,
        outputPath,
        "direct-user delegation output",
      );
    }
  }

  const [finalStatus, finalHead] = await Promise.all([
    boundaryGitText(root, ["status", "--porcelain=v1", "--untracked-files=all"]),
    boundaryGitText(root, ["rev-parse", "HEAD"]),
  ]);
  for (const entry of boundFiles) {
    const current = await readUniqueConfinedFile(
      root,
      entry.relativePath,
      `${entry.label} final readback`,
    );
    assertSameBoundFile(entry.initial, current, entry.expected, entry.label);
  }
  for (const absentPath of [
    PREDECESSOR.rawArtifact.path,
    PREDECESSOR.blockedArtifact.path,
    V8_ATTEMPT_INDEX_PATH,
    ...Object.values(JOENESS_M4_DIRECT_USER_DELEGATION_LIVE_OUTPUTS)
      .filter((outputPath) => outputPath !== data.publishedPath),
  ]) {
    await requireAbsentConfinedTarget(
      root,
      absentPath,
      "direct-user delegation final absent target",
    );
  }
  const terminalGit = await gitText(root, [
    "status",
    "--porcelain=v2",
    "--branch",
    "--untracked-files=all",
  ]);
  requireTerminalGitSnapshot(terminalGit, executionHead, data.publishedPath);
  const rootAfter = lstatSync(root, { bigint: true });
  if (
    finalStatus !== expectedStatus ||
    finalHead !== executionHead ||
    !sameFileIdentity(rootBefore, rootAfter)
  ) throw new Error("direct-user delegation execution boundary changed");

  return {
    plan,
    executionSource: {
      planImplementationCommit: support,
      executionHead,
      executionHeadParent: support,
      plan: {
        path: data.planPath,
        bytes: planRead.bytes.length,
        sha256: sha256(planRead.bytes),
      },
      predecessor: {
        ...PREDECESSOR,
        artifactsMatchSupportPlanAndWorking: true,
        persistenceCommitIsAncestorOfSupport: true,
      },
      sourcePins,
      implementationSourcesMatchSupportPlanAndWorking: true,
    },
    outputsAbsent: data.publishedPath === undefined,
    ...(publishedArtifact === undefined ? {} : { publishedArtifact }),
  };
}

export async function preflightJoenessM4DirectUserDelegationLive(options) {
  const data = exactObject(
    options,
    ["repositoryRoot", "planPath", "sourceCodexHome", "operations"],
    "direct-user delegation preflight options",
  );
  if (typeof data.repositoryRoot !== "string" || !path.isAbsolute(data.repositoryRoot)) {
    fail("direct-user delegation preflight repository root must be absolute");
  }
  exact(
    data.planPath,
    JOENESS_M4_DIRECT_USER_DELEGATION_LIVE_PLAN_PATH,
    "direct-user delegation preflight plan path",
  );
  const injected = data.operations === undefined
    ? Object.create(null)
    : subsetObject(
      data.operations,
      ["verifyExecutionBoundary"],
      "direct-user delegation preflight operations",
    );
  const verifyExecutionBoundary =
    injected.verifyExecutionBoundary ??
    verifyJoenessM4DirectUserDelegationExecutionBoundary;
  if (
    typeof verifyExecutionBoundary !== "function" ||
    utilTypes.isProxy(verifyExecutionBoundary)
  ) fail("direct-user delegation preflight verifier is invalid");

  const repositoryTicket = await captureOwnedDirectory(
    data.repositoryRoot,
    "direct-user delegation preflight repository root",
  );
  const configBefore = await captureSourceConfig(data.sourceCodexHome);
  const boundary = snapshotExecutionBoundary(await verifyExecutionBoundary({
    repositoryRoot: repositoryTicket.resolvedPath,
    planPath: data.planPath,
  }));
  await requireOwnedDirectory(
    data.repositoryRoot,
    repositoryTicket,
    "direct-user delegation preflight repository root",
  );
  const configAfter = await captureSourceConfig(
    data.sourceCodexHome,
    configBefore.home,
  );
  if (
    !sameFileIdentity(configBefore.configTicket, configAfter.configTicket) ||
    configBefore.tuple.bytes !== configAfter.tuple.bytes ||
    configBefore.tuple.sha256 !== configAfter.tuple.sha256
  ) throw new Error("direct-user delegation source config identity changed");
  await requireOwnedDirectory(
    data.repositoryRoot,
    repositoryTicket,
    "direct-user delegation preflight repository root",
  );

  return {
    mode: "preflight",
    id: boundary.plan.id,
    executionSource: boundary.executionSource,
    sourceConfig: { ...configAfter.tuple },
    outputsAbsent: true,
    inputContract: cloneSafeData(
      boundary.plan.inputContract,
      "direct-user delegation preflight input contract",
    ),
    runtime: cloneSafeData(
      boundary.plan.runtime,
      "direct-user delegation preflight runtime",
    ),
    resultBoundary: cloneSafeData(
      boundary.plan.resultBoundary,
      "direct-user delegation preflight result boundary",
    ),
  };
}

async function pathIsAbsent(target) {
  try {
    await lstat(target, { bigint: true });
    return false;
  } catch (error) {
    if (error?.code === "ENOENT") return true;
    throw error;
  }
}

async function defaultRemoveRunRoot(
  target,
  runParent,
  runId,
  runRootTicket,
  runParentTicket,
) {
  const expected = path.join(
    path.resolve(runParent),
    `joewrks-eval-${runId}`,
  );
  if (path.resolve(target) !== expected) {
    throw new Error("direct-user delegation run-root removal path is invalid");
  }
  await requireOwnedDirectory(
    runParent,
    runParentTicket,
    "direct-user delegation removal run parent",
  );
  await requireOwnedDirectory(
    target,
    runRootTicket,
    "direct-user delegation removal run root",
  );
  await rm(target, { recursive: true, force: false });
}

function exactProjectInstruction(value) {
  const data = exactObject(
    value,
    ["relativePath", "bytes", "sha256", "text"],
    "direct-user delegation project instruction",
  );
  exact(data.relativePath, "AGENTS.md", "project instruction relative path");
  exact(data.bytes, PROJECT_INPUT.bytes, "project instruction bytes");
  exact(data.sha256, PROJECT_INPUT.sha256, "project instruction SHA-256");
  if (typeof data.text !== "string") fail("project instruction text is invalid");
  const bytes = Buffer.from(data.text, "utf8");
  if (bytes.length !== PROJECT_INPUT.bytes || sha256(bytes) !== PROJECT_INPUT.sha256) {
    fail("project instruction text tuple is invalid");
  }
  return { ...data, buffer: bytes };
}

function mutableCleanupState(value) {
  if (
    value === null ||
    typeof value !== "object" ||
    utilTypes.isProxy(value) ||
    Array.isArray(value)
  ) fail("direct-user delegation cleanup state is invalid");
  let prototype;
  let keys;
  try {
    prototype = Object.getPrototypeOf(value);
    keys = Reflect.ownKeys(value);
  }
  catch { fail("direct-user delegation cleanup state is invalid"); }
  if (
    (prototype !== Object.prototype && prototype !== null) ||
    !Object.isExtensible(value) ||
    keys.length !== 0
  ) {
    fail("direct-user delegation cleanup state must be exact and empty");
  }
  return value;
}

async function requireExactCase(caseState) {
  if (
    caseState.caseRootTicket === null ||
    caseState.gitRoot === null ||
    caseState.gitRootTicket === null ||
    caseState.agentsTicket === null
  ) throw new Error("direct-user delegation case acquisition is incomplete");
  await requireOwnedDirectory(
    caseState.runRoot,
    caseState.runRootTicket,
    "direct-user delegation run root",
  );
  await requireOwnedDirectory(
    caseState.caseRoot,
    caseState.caseRootTicket,
    "direct-user delegation case root",
  );
  await requireOwnedDirectory(
    caseState.gitRoot,
    caseState.gitRootTicket,
    "direct-user delegation case Git directory",
  );
  const agents = await readUniqueConfinedFile(
    caseState.caseRoot,
    "AGENTS.md",
    "direct-user delegation case AGENTS",
  );
  assertSameBoundFile(
    caseState.agentsTicket,
    agents,
    PROJECT_INPUT,
    "direct-user delegation case AGENTS",
  );
  const children = await readdir(caseState.caseRoot, { withFileTypes: true });
  const names = children.map((entry) => entry.name).sort();
  if (
    names.length !== 2 ||
    names[0] !== ".git" ||
    names[1] !== "AGENTS.md"
  ) throw new Error("direct-user delegation case root children changed");
  const gitChildren = await readdir(caseState.gitRoot);
  if (gitChildren.length !== 0) {
    throw new Error("direct-user delegation case Git directory changed");
  }
}

function confirmedCloseFromError(error) {
  if (
    error === null ||
    (typeof error !== "object" && typeof error !== "function") ||
    utilTypes.isProxy(error)
  ) return false;
  let evidenceDescriptor;
  try { evidenceDescriptor = Object.getOwnPropertyDescriptor(error, "ticketEvidence"); }
  catch { return false; }
  if (!evidenceDescriptor || !Object.hasOwn(evidenceDescriptor, "value")) return false;
  const evidence = evidenceDescriptor.value;
  if (evidence === null || typeof evidence !== "object" || utilTypes.isProxy(evidence)) {
    return false;
  }
  const appServer = Object.getOwnPropertyDescriptor(evidence, "appServer");
  if (!appServer || !Object.hasOwn(appServer, "value")) return false;
  if (
    appServer.value === null ||
    typeof appServer.value !== "object" ||
    utilTypes.isProxy(appServer.value)
  ) return false;
  const close = Object.getOwnPropertyDescriptor(
    appServer.value,
    "processCloseConfirmed",
  );
  return Boolean(close && Object.hasOwn(close, "value") && close.value === true);
}

function descriptorMatches(left, right) {
  if (left === undefined || right === undefined) return false;
  return [
    "value",
    "get",
    "set",
    "enumerable",
    "configurable",
    "writable",
  ].every((key) => left[key] === right[key]);
}

function captureSessionControl(value) {
  if (
    value === null ||
    typeof value !== "object" ||
    utilTypes.isProxy(value) ||
    Array.isArray(value)
  ) throw new Error("direct-user delegation app-server session is invalid");
  let descriptors;
  try { descriptors = Object.getOwnPropertyDescriptors(value); }
  catch { throw new Error("direct-user delegation app-server session is invalid"); }
  const closeDescriptor = descriptors.close;
  const confirmedDescriptor = descriptors.processCloseConfirmed;
  const exitDescriptor = descriptors.processExitCode;
  const closeIsSafe = (
    !closeDescriptor ||
    !Object.hasOwn(closeDescriptor, "value") ||
    closeDescriptor.enumerable !== true ||
    typeof closeDescriptor.value !== "function" ||
    utilTypes.isProxy(closeDescriptor.value)
  ) === false;
  if (!closeIsSafe) {
    throw new Error("direct-user delegation app-server close control is invalid");
  }
  const receiptIsSafe = !(
    !confirmedDescriptor ||
    typeof confirmedDescriptor.get !== "function" ||
    utilTypes.isProxy(confirmedDescriptor.get) ||
    confirmedDescriptor.set !== undefined ||
    confirmedDescriptor.enumerable !== true ||
    !exitDescriptor ||
    typeof exitDescriptor.get !== "function" ||
    utilTypes.isProxy(exitDescriptor.get) ||
    exitDescriptor.set !== undefined ||
    exitDescriptor.enumerable !== true
  );
  return {
    session: value,
    close: closeDescriptor.value,
    closeDescriptor,
    confirmedGetter: receiptIsSafe ? confirmedDescriptor.get : null,
    confirmedDescriptor,
    exitGetter: receiptIsSafe ? exitDescriptor.get : null,
    exitDescriptor,
    receiptIsSafe,
  };
}

function sessionControlMatches(control) {
  let descriptors;
  try { descriptors = Object.getOwnPropertyDescriptors(control.session); }
  catch { return false; }
  return (
    descriptorMatches(descriptors.close, control.closeDescriptor) &&
    (!control.receiptIsSafe || (
      descriptorMatches(
        descriptors.processCloseConfirmed,
        control.confirmedDescriptor,
      ) &&
      descriptorMatches(descriptors.processExitCode, control.exitDescriptor)
    ))
  );
}

function preparedRuntimeLaunchBinding(value, runRoot, codexVersion) {
  if (
    value === null ||
    typeof value !== "object" ||
    utilTypes.isProxy(value)
  ) throw new Error("direct-user delegation prepared runtime is invalid");
  let descriptors;
  try {
    descriptors = Object.getOwnPropertyDescriptors(value);
  } catch {
    throw new Error("direct-user delegation prepared runtime is invalid");
  }
  const selected = Object.create(null);
  for (const key of ["runRoot", "isolatedCodexHome", "executable", "version"]) {
    const descriptor = descriptors[key];
    if (
      !descriptor ||
      !Object.hasOwn(descriptor, "value") ||
      descriptor.get !== undefined ||
      descriptor.set !== undefined ||
      descriptor.enumerable !== true
    ) throw new Error(`direct-user delegation prepared runtime ${key} is invalid`);
    selected[key] = descriptor.value;
  }
  if (
    selected.runRoot !== runRoot ||
    typeof selected.isolatedCodexHome !== "string" ||
    !path.isAbsolute(selected.isolatedCodexHome) ||
    typeof selected.executable !== "string" ||
    !path.isAbsolute(selected.executable) ||
    selected.version !== codexVersion.replace("codex-cli ", "")
  ) throw new Error("direct-user delegation prepared runtime launch binding is invalid");
  return selected;
}

function preparedProtocolSchema(value, runRoot) {
  let descriptor;
  try { descriptor = Object.getOwnPropertyDescriptor(value, "protocolSchema"); }
  catch { throw new Error("direct-user delegation protocol schema is invalid"); }
  if (
    !descriptor ||
    !Object.hasOwn(descriptor, "value") ||
    descriptor.get !== undefined ||
    descriptor.set !== undefined
  ) throw new Error("direct-user delegation protocol schema is unavailable");
  const schema = exactObject(
    descriptor.value,
    ["path", "sha256"],
    "direct-user delegation protocol schema",
  );
  const expectedPath = path.join(
    runRoot,
    "schema",
    "codex_app_server_protocol.schemas.json",
  );
  if (
    schema.path !== expectedPath ||
    typeof schema.sha256 !== "string" ||
    !/^[0-9a-f]{64}$/u.test(schema.sha256)
  ) throw new Error("direct-user delegation protocol schema tuple is invalid");
  return { path: schema.path, sha256: schema.sha256 };
}

function ordinalCompare(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

async function captureOwnedProtocolSchemaTree(schemaRoot) {
  const rootTicket = await captureOwnedDirectory(
    schemaRoot,
    "direct-user delegation protocol schema directory",
  );
  const entries = [];
  let totalBytes = 0;
  const visit = async (relativeRoot) => {
    const absoluteRoot = relativeRoot === ""
      ? schemaRoot
      : path.join(schemaRoot, ...relativeRoot.split("/"));
    const children = await readdir(absoluteRoot, { withFileTypes: true });
    children.sort((left, right) => ordinalCompare(left.name, right.name));
    for (const child of children) {
      const relativePath = relativeRoot === ""
        ? child.name
        : `${relativeRoot}/${child.name}`;
      portablePath(relativePath, "direct-user delegation protocol schema entry");
      if (entries.length >= 4096) {
        throw new Error("direct-user delegation protocol schema tree is too large");
      }
      const absolutePath = path.join(schemaRoot, ...relativePath.split("/"));
      const state = await lstat(absolutePath, { bigint: true });
      if (state.isSymbolicLink()) {
        throw new Error("direct-user delegation protocol schema link is unsafe");
      }
      if (state.isDirectory()) {
        const ticket = await captureOwnedDirectory(
          absolutePath,
          `direct-user delegation protocol schema directory ${relativePath}`,
        );
        if (
          ticket.resolvedPath !== absolutePath ||
          !pathIsConfined(schemaRoot, ticket.resolvedPath)
        ) {
          throw new Error(
            "direct-user delegation protocol schema directory escapes its root",
          );
        }
        entries.push({ type: "directory", relativePath, ticket });
        await visit(relativePath);
        continue;
      }
      if (!state.isFile()) {
        throw new Error("direct-user delegation protocol schema entry is unsafe");
      }
      const file = await readUniqueConfinedFile(
        schemaRoot,
        relativePath,
        `direct-user delegation protocol schema file ${relativePath}`,
      );
      totalBytes += file.bytes.length;
      if (totalBytes > 64 * 1024 * 1024) {
        throw new Error("direct-user delegation protocol schema bytes exceed bounds");
      }
      entries.push({
        type: "file",
        relativePath,
        file,
        tuple: { bytes: file.bytes.length, sha256: sha256(file.bytes) },
      });
    }
  };
  await visit("");
  await requireOwnedDirectory(
    schemaRoot,
    rootTicket,
    "direct-user delegation protocol schema directory final readback",
  );
  for (const entry of entries) {
    if (entry.type === "directory") {
      const target = path.join(schemaRoot, ...entry.relativePath.split("/"));
      await requireOwnedDirectory(
        target,
        entry.ticket,
        `direct-user delegation protocol schema final directory ${entry.relativePath}`,
      );
    } else {
      const current = await readUniqueConfinedFile(
        schemaRoot,
        entry.relativePath,
        `direct-user delegation protocol schema final file ${entry.relativePath}`,
      );
      assertSameBoundFile(
        entry.file,
        current,
        entry.tuple,
        `direct-user delegation protocol schema final file ${entry.relativePath}`,
      );
    }
  }
  await requireOwnedDirectory(
    schemaRoot,
    rootTicket,
    "direct-user delegation protocol schema directory terminal readback",
  );
  return { rootTicket, entries };
}

function sameProtocolSchemaTree(expected, current) {
  if (
    expected.rootTicket.resolvedPath !== current.rootTicket.resolvedPath ||
    !sameDirectoryIdentity(
      expected.rootTicket.ticket,
      current.rootTicket.ticket,
    ) ||
    expected.entries.length !== current.entries.length
  ) return false;
  for (let index = 0; index < expected.entries.length; index += 1) {
    const left = expected.entries[index];
    const right = current.entries[index];
    if (
      left.type !== right.type ||
      left.relativePath !== right.relativePath
    ) return false;
    if (left.type === "directory") {
      if (
        left.ticket.resolvedPath !== right.ticket.resolvedPath ||
        !sameDirectoryIdentity(left.ticket.ticket, right.ticket.ticket)
      ) return false;
    } else if (
      !sameFileIdentity(left.file.ticket, right.file.ticket) ||
      left.file.resolvedPath !== right.file.resolvedPath ||
      left.tuple.bytes !== right.tuple.bytes ||
      left.tuple.sha256 !== right.tuple.sha256
    ) return false;
  }
  return true;
}

async function requireExactProtocolSchema(schemaState) {
  await requireOwnedDirectory(
    schemaState.runRoot,
    schemaState.runRootTicket,
    "direct-user delegation schema run root",
  );
  const current = await captureOwnedProtocolSchemaTree(schemaState.schemaRoot);
  if (!sameProtocolSchemaTree(schemaState.tree, current)) {
    throw new Error("direct-user delegation protocol schema tree changed");
  }
}

async function requireProtocolSchemaAncestorChain(schemaState, relativePath) {
  await requireOwnedDirectory(
    schemaState.schemaRoot,
    schemaState.tree.rootTicket,
    "direct-user delegation protocol schema ancestor root",
  );
  const parts = relativePath.split("/");
  parts.pop();
  let current = "";
  for (const part of parts) {
    current = current === "" ? part : `${current}/${part}`;
    const entry = schemaState.tree.entries.find(
      (candidate) =>
        candidate.type === "directory" &&
        candidate.relativePath === current,
    );
    if (entry === undefined) {
      throw new Error("direct-user delegation protocol schema ancestor is unbound");
    }
    await requireOwnedDirectory(
      path.join(schemaState.schemaRoot, ...current.split("/")),
      entry.ticket,
      `direct-user delegation protocol schema ancestor ${current}`,
    );
  }
}

async function removeExactProtocolSchemaTree(schemaState) {
  await requireExactProtocolSchema(schemaState);
  const files = schemaState.tree.entries.filter((entry) => entry.type === "file");
  for (const entry of files) {
    await requireProtocolSchemaAncestorChain(schemaState, entry.relativePath);
    let current = await readUniqueConfinedFile(
      schemaState.schemaRoot,
      entry.relativePath,
      `direct-user delegation protocol schema removal ${entry.relativePath}`,
    );
    assertSameBoundFile(
      entry.file,
      current,
      entry.tuple,
      `direct-user delegation protocol schema removal ${entry.relativePath}`,
    );
    await requireProtocolSchemaAncestorChain(schemaState, entry.relativePath);
    current = await readUniqueConfinedFile(
      schemaState.schemaRoot,
      entry.relativePath,
      `direct-user delegation protocol schema final removal ${entry.relativePath}`,
    );
    assertSameBoundFile(
      entry.file,
      current,
      entry.tuple,
      `direct-user delegation protocol schema final removal ${entry.relativePath}`,
    );
    await rm(current.resolvedPath, { force: false });
    await requireProtocolSchemaAncestorChain(schemaState, entry.relativePath);
    if (!(await pathIsAbsent(current.resolvedPath))) {
      throw new Error("direct-user delegation protocol schema file remains");
    }
  }
  const directories = schemaState.tree.entries
    .filter((entry) => entry.type === "directory")
    .sort((left, right) => {
      const depth = right.relativePath.split("/").length -
        left.relativePath.split("/").length;
      return depth === 0
        ? ordinalCompare(right.relativePath, left.relativePath)
        : depth;
    });
  for (const entry of directories) {
    const target = path.join(
      schemaState.schemaRoot,
      ...entry.relativePath.split("/"),
    );
    await requireProtocolSchemaAncestorChain(
      schemaState,
      entry.relativePath,
    );
    await requireOwnedDirectory(
      target,
      entry.ticket,
      `direct-user delegation protocol schema removal ${entry.relativePath}`,
    );
    if ((await readdir(target)).length !== 0) {
      throw new Error("direct-user delegation protocol schema directory is not empty");
    }
    await requireOwnedDirectory(
      target,
      entry.ticket,
      `direct-user delegation protocol schema final removal ${entry.relativePath}`,
    );
    await rmdir(target);
    await requireProtocolSchemaAncestorChain(
      schemaState,
      entry.relativePath,
    );
    if (!(await pathIsAbsent(target))) {
      throw new Error("direct-user delegation protocol schema directory remains");
    }
  }
  await requireOwnedDirectory(
    schemaState.schemaRoot,
    schemaState.tree.rootTicket,
    "direct-user delegation protocol schema root before removal",
  );
  if ((await readdir(schemaState.schemaRoot)).length !== 0) {
    throw new Error("direct-user delegation protocol schema root is not empty");
  }
  await requireOwnedDirectory(
    schemaState.schemaRoot,
    schemaState.tree.rootTicket,
    "direct-user delegation protocol schema root final removal",
  );
  await rmdir(schemaState.schemaRoot);
  if (!(await pathIsAbsent(schemaState.schemaRoot))) {
    throw new Error("direct-user delegation protocol schema root remains");
  }
}

export function validateJoenessM4DirectUserDelegationRuntimeOperationPair(value) {
  const operations = exactObject(
    value,
    ["prepareRuntime", "openAppServer"],
    "direct-user delegation runtime operation pair",
  );
  if (
    typeof operations.prepareRuntime !== "function" ||
    utilTypes.isProxy(operations.prepareRuntime) ||
    typeof operations.openAppServer !== "function" ||
    utilTypes.isProxy(operations.openAppServer)
  ) fail("direct-user delegation runtime operation pair is invalid");
  if (
    operations.openAppServer === openAppServer &&
    operations.prepareRuntime !== prepareRuntime
  ) {
    fail(
      "direct-user delegation authentic app-server open requires authentic prepare identity",
    );
  }
  return value;
}

export async function createJoenessM4DirectUserDelegationDefaultRuntime(options) {
  const data = exactObject(
    options,
    [
      "plan",
      "repositoryRoot",
      "sourceCodexHome",
      "runParent",
      "projectInstruction",
      "cleanupState",
      "operations",
    ],
    "direct-user delegation default runtime options",
  );
  validateJoenessM4DirectUserDelegationLivePlan(data.plan);
  const runId = data.plan.id;
  const codexVersion = data.plan.runtime.codexVersion;
  const projectInstruction = exactProjectInstruction(data.projectInstruction);
  const cleanupState = mutableCleanupState(data.cleanupState);
  for (const [name, value] of [
    ["repository root", data.repositoryRoot],
    ["source Codex home", data.sourceCodexHome],
    ["run parent", data.runParent],
  ]) {
    if (typeof value !== "string" || !path.isAbsolute(value)) {
      fail(`direct-user delegation ${name} must be absolute`);
    }
  }
  const injected = exactObject(
    data.operations,
    [
      "createExclusiveRunRoot",
      "prepareRuntime",
      "openAppServer",
      "removeIsolatedCodexHome",
      "removeRunRoot",
    ],
    "direct-user delegation runtime operations",
  );
  const operations = {
    createExclusiveRunRoot:
      injected.createExclusiveRunRoot ?? createExclusiveRunRoot,
    prepareRuntime: injected.prepareRuntime ?? prepareRuntime,
    openAppServer: injected.openAppServer ?? openAppServer,
    removeIsolatedCodexHome:
      injected.removeIsolatedCodexHome ?? removeIsolatedCodexHome,
    removeRunRoot: injected.removeRunRoot ?? defaultRemoveRunRoot,
  };
  for (const [name, operation] of Object.entries(operations)) {
    if (typeof operation !== "function" || utilTypes.isProxy(operation)) {
      fail(`direct-user delegation runtime operation ${name} is invalid`);
    }
  }
  validateJoenessM4DirectUserDelegationRuntimeOperationPair({
    prepareRuntime: operations.prepareRuntime,
    openAppServer: operations.openAppServer,
  });

  const repositoryTicket = await captureOwnedDirectory(
    data.repositoryRoot,
    "direct-user delegation runtime repository root",
  );
  const sourceHomeTicket = await captureOwnedDirectory(
    data.sourceCodexHome,
    "direct-user delegation runtime source home",
  );
  const runParentTicket = await captureOwnedDirectory(
    data.runParent,
    "direct-user delegation runtime run parent",
  );
  if (operations.prepareRuntime === prepareRuntime) {
    const collectorHome = process.env.CODEX_HOME ?? path.join(homedir(), ".codex");
    const actualCollectorHome = await realpath(collectorHome);
    if (actualCollectorHome !== sourceHomeTicket.resolvedPath) {
      throw new Error("direct-user delegation source home differs from collector home");
    }
  }
  const sourceConfig = await captureSourceConfig(
    data.sourceCodexHome,
    sourceHomeTicket,
  );
  const cleanupSourceConfigBefore = Object.freeze({ ...sourceConfig.tuple });
  Object.defineProperty(cleanupState, "sourceConfigBefore", {
    value: cleanupSourceConfigBefore,
    enumerable: true,
    configurable: false,
    writable: false,
  });

  const cleanupStateIsExpected = () => {
    let keys;
    let descriptor;
    try {
      keys = Reflect.ownKeys(cleanupState);
      descriptor = Object.getOwnPropertyDescriptor(
        cleanupState,
        "sourceConfigBefore",
      );
    } catch {
      return false;
    }
    return (
      keys.length === 1 &&
      keys[0] === "sourceConfigBefore" &&
      descriptor !== undefined &&
      Object.hasOwn(descriptor, "value") &&
      descriptor.value === cleanupSourceConfigBefore &&
      descriptor.enumerable === true &&
      descriptor.configurable === false &&
      descriptor.writable === false
    );
  };

  let runRoot;
  let runRootTicket = null;
  let caseState = null;
  let isolatedParentTicket = null;
  let isolatedParentBeforePrepareTicket = null;
  let isolatedParentCreatedByRuntime = false;
  let isolatedHomeTicket = null;
  let isolatedHome;
  let schemaState = null;
  let session;
  let sessionControl = null;
  let sessionClosePromise;
  let openAttempted = false;
  const readSourceConfig = async () => {
    const current = await captureSourceConfig(
      data.sourceCodexHome,
      sourceHomeTicket,
    );
    if (!sameFileIdentity(current.configTicket, sourceConfig.configTicket)) {
      throw new Error("direct-user delegation source config identity changed");
    }
    return { ...current.tuple };
  };

  const requireBaseOwnership = async () => {
    await requireOwnedDirectory(
      data.repositoryRoot,
      repositoryTicket,
      "direct-user delegation runtime repository root",
    );
    await requireOwnedDirectory(
      data.sourceCodexHome,
      sourceHomeTicket,
      "direct-user delegation runtime source home",
    );
    await requireOwnedDirectory(
      data.runParent,
      runParentTicket,
      "direct-user delegation runtime run parent",
    );
    const currentConfig = await captureSourceConfig(
      data.sourceCodexHome,
      sourceHomeTicket,
    );
    if (
      !sameFileIdentity(currentConfig.configTicket, sourceConfig.configTicket) ||
      currentConfig.tuple.bytes !== sourceConfig.tuple.bytes ||
      currentConfig.tuple.sha256 !== sourceConfig.tuple.sha256
    ) throw new Error("direct-user delegation runtime source config changed");
  };
  const requireOuterOwnership = async () => {
    await requireBaseOwnership();
    if (runRootTicket !== null) {
      await requireOwnedDirectory(
        runRoot,
        runRootTicket,
        "direct-user delegation runtime run root",
      );
    }
    if (caseState !== null) await requireExactCase(caseState);
    if (isolatedParentTicket !== null) {
      await requireOwnedDirectory(
        path.dirname(isolatedHome),
        isolatedParentTicket,
        "direct-user delegation isolated parent",
      );
    }
    if (isolatedHomeTicket !== null) {
      await requireOwnedDirectory(
        isolatedHome,
        isolatedHomeTicket,
        "direct-user delegation isolated home",
      );
    }
    if (schemaState !== null) await requireExactProtocolSchema(schemaState);
  };

  const closeAcquiredSession = async () => {
    if (sessionControl === null) {
      throw new Error("direct-user delegation acquired session control is unavailable");
    }
    sessionClosePromise ??= (async () => {
      let closeError = null;
      try {
        await Reflect.apply(sessionControl.close, sessionControl.session, []);
      } catch (error) {
        closeError = error;
      }
      if (!sessionControlMatches(sessionControl)) {
        const changed = new Error("direct-user delegation session controls changed");
        throw new AggregateError(
          closeError === null ? [changed] : [closeError, changed],
          "direct-user delegation session controls changed after acquisition",
          { cause: closeError ?? changed },
        );
      }
      if (!sessionControl.receiptIsSafe) {
        throw new AggregateError(
          closeError === null ? [] : [closeError],
          "direct-user delegation session close receipt is unavailable",
          { ...(closeError === null ? {} : { cause: closeError }) },
        );
      }
      let processCloseConfirmed;
      let processExitCode;
      try {
        processCloseConfirmed = Reflect.apply(
          sessionControl.confirmedGetter,
          sessionControl.session,
          [],
        );
        processExitCode = Reflect.apply(
          sessionControl.exitGetter,
          sessionControl.session,
          [],
        );
      } catch (error) {
        throw new AggregateError(
          closeError === null ? [error] : [closeError, error],
          "direct-user delegation session close receipt is unsafe",
          { cause: closeError ?? error },
        );
      }
      if (processCloseConfirmed !== true) {
        if (closeError !== null) throw closeError;
        throw new Error("direct-user delegation app-server close is unconfirmed");
      }
      return { processCloseConfirmed, processExitCode, closeError };
    })();
    return sessionClosePromise;
  };

  const cleanupOwned = async (launchCount, closeConfirmedCount) => {
    const errors = [];
    if (!cleanupStateIsExpected()) {
      errors.push(new Error("direct-user delegation cleanup state changed after acquisition"));
    }
    if (isolatedHomeTicket !== null) {
      try {
        await requireOwnedDirectory(
          data.sourceCodexHome,
          sourceHomeTicket,
          "direct-user delegation runtime source home",
        );
        await requireOwnedDirectory(
          path.dirname(isolatedHome),
          isolatedParentTicket,
          "direct-user delegation isolated parent",
        );
        await requireOwnedDirectory(
          isolatedHome,
          isolatedHomeTicket,
          "direct-user delegation isolated home",
        );
        await operations.removeIsolatedCodexHome(
          runRoot,
          isolatedHome,
          path.dirname(isolatedHome),
          isolatedHomeTicket,
          isolatedParentTicket,
        );
        await requireOwnedDirectory(
          path.dirname(isolatedHome),
          isolatedParentTicket,
          "direct-user delegation isolated parent after removal",
        );
        if (isolatedParentCreatedByRuntime) {
          if ((await readdir(path.dirname(isolatedHome))).length !== 0) {
            throw new Error(
              "direct-user delegation newly created isolated parent is not empty",
            );
          }
          await requireOwnedDirectory(
            path.dirname(isolatedHome),
            isolatedParentTicket,
            "direct-user delegation newly created isolated parent final removal",
          );
          await rmdir(path.dirname(isolatedHome));
          if (!(await pathIsAbsent(path.dirname(isolatedHome)))) {
            throw new Error(
              "direct-user delegation newly created isolated parent remains",
            );
          }
        } else {
          await requireOwnedDirectory(
            path.dirname(isolatedHome),
            isolatedParentBeforePrepareTicket,
            "direct-user delegation preexisting isolated parent after cleanup",
          );
        }
        await requireBaseOwnership();
        if (!(await pathIsAbsent(isolatedHome))) {
          throw new Error("direct-user delegation isolated home remains");
        }
      } catch (error) { errors.push(error); }
    } else if (runRootTicket !== null) {
      try {
        const inferredIsolatedParent = path.join(
          sourceHomeTicket.resolvedPath,
          ".eval-runtime",
        );
        const inferredIsolatedHome = path.join(
          inferredIsolatedParent,
          `${path.basename(runRoot)}-controller-codex-home`,
        );
        if (isolatedParentBeforePrepareTicket === null) {
          if (!(await pathIsAbsent(inferredIsolatedParent))) {
            throw new Error(
              "direct-user delegation newly created isolated parent ownership is unresolved",
            );
          }
        } else {
          await requireOwnedDirectory(
            inferredIsolatedParent,
            isolatedParentBeforePrepareTicket,
            "direct-user delegation preexisting isolated parent",
          );
          if (isolatedParentCreatedByRuntime) {
            if ((await readdir(inferredIsolatedParent)).length !== 0) {
              throw new Error(
                "direct-user delegation acquired isolated parent is not empty",
              );
            }
            await requireOwnedDirectory(
              inferredIsolatedParent,
              isolatedParentBeforePrepareTicket,
              "direct-user delegation acquired isolated parent final removal",
            );
            await rmdir(inferredIsolatedParent);
            if (!(await pathIsAbsent(inferredIsolatedParent))) {
              throw new Error(
                "direct-user delegation acquired isolated parent remains",
              );
            }
          }
        }
        if (!(await pathIsAbsent(inferredIsolatedHome))) {
          throw new Error(
            "direct-user delegation inferred isolated home ownership is unresolved",
          );
        }
      } catch (error) { errors.push(error); }
    }

    let caseCleanupSafe = false;
    if (caseState !== null) {
      try {
        await requireExactCase(caseState);
        await requireBaseOwnership();
        await requireOwnedDirectory(
          caseState.caseRoot,
          caseState.caseRootTicket,
          "direct-user delegation case root before AGENTS removal",
        );
        const agentsBeforeRemoval = await readUniqueConfinedFile(
          caseState.caseRoot,
          "AGENTS.md",
          "direct-user delegation case AGENTS before removal",
        );
        assertSameBoundFile(
          caseState.agentsTicket,
          agentsBeforeRemoval,
          PROJECT_INPUT,
          "direct-user delegation case AGENTS before removal",
        );
        await rm(path.join(caseState.caseRoot, "AGENTS.md"), { force: false });
        if (!(await pathIsAbsent(path.join(caseState.caseRoot, "AGENTS.md")))) {
          throw new Error("direct-user delegation case AGENTS remains");
        }
        await requireBaseOwnership();
        await requireOwnedDirectory(
          caseState.caseRoot,
          caseState.caseRootTicket,
          "direct-user delegation case root before Git removal",
        );
        await requireOwnedDirectory(
          caseState.gitRoot,
          caseState.gitRootTicket,
          "direct-user delegation case Git directory before removal",
        );
        const afterAgentsChildren = await readdir(caseState.caseRoot);
        if (
          afterAgentsChildren.length !== 1 ||
          afterAgentsChildren[0] !== ".git" ||
          (await readdir(caseState.gitRoot)).length !== 0
        ) throw new Error("direct-user delegation case children changed during cleanup");
        await requireOwnedDirectory(
          caseState.gitRoot,
          caseState.gitRootTicket,
          "direct-user delegation case Git directory final removal",
        );
        await rmdir(caseState.gitRoot);
        if (!(await pathIsAbsent(caseState.gitRoot))) {
          throw new Error("direct-user delegation case Git directory remains");
        }
        await requireBaseOwnership();
        await requireOwnedDirectory(
          caseState.caseRoot,
          caseState.caseRootTicket,
          "direct-user delegation case root before removal",
        );
        if ((await readdir(caseState.caseRoot)).length !== 0) {
          throw new Error("direct-user delegation case root is not empty");
        }
        await requireOwnedDirectory(
          caseState.caseRoot,
          caseState.caseRootTicket,
          "direct-user delegation case root final removal",
        );
        await rmdir(caseState.caseRoot);
        if (!(await pathIsAbsent(caseState.caseRoot))) {
          throw new Error("direct-user delegation case root remains");
        }
        caseCleanupSafe = true;
      } catch (error) { errors.push(error); }
    }

    let schemaCleanupSafe = false;
    if (schemaState !== null) {
      try {
        await requireBaseOwnership();
        await removeExactProtocolSchemaTree(schemaState);
        await requireBaseOwnership();
        schemaCleanupSafe = true;
      } catch (error) { errors.push(error); }
    } else if (runRootTicket !== null && caseCleanupSafe) {
      try {
        await requireOwnedDirectory(
          runRoot,
          runRootTicket,
          "direct-user delegation schema-free run root",
        );
        if ((await readdir(runRoot)).length !== 0) {
          throw new Error(
            "direct-user delegation uncaptured runtime files remain",
          );
        }
        schemaCleanupSafe = true;
      } catch (error) { errors.push(error); }
    }

    if (runRootTicket !== null && caseCleanupSafe && schemaCleanupSafe) {
      try {
        await requireOwnedDirectory(
          data.runParent,
          runParentTicket,
          "direct-user delegation runtime run parent",
        );
        await requireOwnedDirectory(
          runRoot,
          runRootTicket,
          "direct-user delegation runtime run root",
        );
        if ((await readdir(runRoot)).length !== 0) {
          throw new Error("direct-user delegation run root is not empty");
        }
        await requireOwnedDirectory(
          runRoot,
          runRootTicket,
          "direct-user delegation runtime run root final removal",
        );
        await operations.removeRunRoot(
          runRoot,
          runParentTicket.resolvedPath,
          runId,
          runRootTicket,
          runParentTicket,
        );
        await requireBaseOwnership();
        if (!(await pathIsAbsent(runRoot))) {
          throw new Error("direct-user delegation run root remains");
        }
      } catch (error) { errors.push(error); }
    } else if (runRootTicket !== null) {
      errors.push(new Error("direct-user delegation run root cleanup ownership is unresolved"));
    }

    let sourceConfigAfter;
    try {
      sourceConfigAfter = await readSourceConfig();
      if (
        sourceConfigAfter.bytes !== sourceConfig.tuple.bytes ||
        sourceConfigAfter.sha256 !== sourceConfig.tuple.sha256
      ) throw new Error("direct-user delegation source config changed");
      await requireBaseOwnership();
    } catch (error) { errors.push(error); }

    if (!cleanupStateIsExpected()) {
      errors.push(new Error("direct-user delegation cleanup state changed during cleanup"));
    }

    if (errors.length > 0) {
      throw new AggregateError(
        errors,
        "direct-user delegation owned runtime cleanup was not fully safe",
        { cause: errors[0] },
      );
    }
    Object.defineProperty(cleanupState, "sourceConfigAfter", {
      value: sourceConfigAfter,
      enumerable: true,
      configurable: false,
      writable: false,
    });
    Object.defineProperty(cleanupState, "receipt", {
      value: {
        appServerLaunchCount: launchCount,
        appServerCloseConfirmedCount: closeConfirmedCount,
        remainingOwnedProcessCount: 0,
        caseRootReadback: "absent",
        isolatedCodexHomeReadback: "absent",
        runRootReadback: "absent",
        sourceConfigReadback: "UNCHANGED",
      },
      enumerable: true,
      configurable: false,
      writable: false,
    });
  };

  try {
    await requireOuterOwnership();
    const createdRunRoot = await operations.createExclusiveRunRoot(
      runId,
      runParentTicket.resolvedPath,
    );
    const expectedRunRoot = path.join(
      runParentTicket.resolvedPath,
      `joewrks-eval-${runId}`,
    );
    runRootTicket = await captureOwnedDirectory(
      createdRunRoot,
      "direct-user delegation acquired run root",
    );
    if (runRootTicket.resolvedPath !== expectedRunRoot) {
      throw new Error("direct-user delegation acquired run root path is invalid");
    }
    runRoot = runRootTicket.resolvedPath;
    await requireOuterOwnership();

    const caseRoot = path.join(runRoot, "case");
    await mkdir(caseRoot);
    const caseRootTicket = await captureOwnedDirectory(
      caseRoot,
      "direct-user delegation acquired case root",
    );
    if (caseRootTicket.resolvedPath !== caseRoot) {
      throw new Error("direct-user delegation case root path is invalid");
    }
    const gitRoot = path.join(caseRoot, ".git");
    caseState = {
      runRoot,
      runRootTicket,
      caseRoot,
      caseRootTicket,
      gitRoot,
      gitRootTicket: null,
      agentsTicket: null,
    };
    await mkdir(gitRoot);
    const gitRootTicket = await captureOwnedDirectory(
      gitRoot,
      "direct-user delegation acquired Git directory",
    );
    caseState.gitRootTicket = gitRootTicket;
    const agentsPath = path.join(caseRoot, "AGENTS.md");
    const agentsHandle = await open(agentsPath, "wx", 0o600);
    try {
      await agentsHandle.writeFile(projectInstruction.buffer);
      await agentsHandle.sync();
    } finally {
      await agentsHandle.close();
    }
    const agentsTicket = await readUniqueConfinedFile(
      caseRoot,
      "AGENTS.md",
      "direct-user delegation acquired AGENTS",
    );
    assertBlobTuple(agentsTicket.bytes, PROJECT_INPUT, "direct-user delegation AGENTS");
    caseState.agentsTicket = agentsTicket;
    await requireOuterOwnership();

    const isolatedParent = path.join(
      sourceHomeTicket.resolvedPath,
      ".eval-runtime",
    );
    if (await pathIsAbsent(isolatedParent)) {
      await mkdir(isolatedParent);
      isolatedParentCreatedByRuntime = true;
    }
    isolatedParentBeforePrepareTicket = await captureOwnedDirectory(
      isolatedParent,
      isolatedParentCreatedByRuntime
        ? "direct-user delegation acquired isolated parent"
        : "direct-user delegation preexisting isolated parent",
    );
    const prepared = await operations.prepareRuntime(runRoot, {
      expectedCodexVersion: codexVersion,
    });
    await requireOuterOwnership();
    const preparedBinding = preparedRuntimeLaunchBinding(
      prepared,
      runRoot,
      codexVersion,
    );
    const preparedHome = preparedBinding.isolatedCodexHome;
    const protocolSchema = preparedProtocolSchema(prepared, runRoot);
    const schemaRoot = path.join(runRoot, "schema");
    const schemaTree = await captureOwnedProtocolSchemaTree(schemaRoot);
    const protocolEntry = schemaTree.entries.find(
      (entry) =>
        entry.type === "file" &&
        entry.relativePath === "codex_app_server_protocol.schemas.json",
    );
    if (
      schemaTree.rootTicket.resolvedPath !== schemaRoot ||
      protocolEntry === undefined ||
      protocolEntry.file.resolvedPath !== protocolSchema.path ||
      protocolEntry.tuple.sha256 !== protocolSchema.sha256
    ) throw new Error("direct-user delegation acquired protocol schema is invalid");
    schemaState = {
      runRoot,
      runRootTicket,
      schemaRoot,
      tree: schemaTree,
    };
    const expectedIsolatedHome = path.join(
      isolatedParent,
      `${path.basename(runRoot)}-controller-codex-home`,
    );
    isolatedParentTicket = await captureOwnedDirectory(
      isolatedParent,
      "direct-user delegation isolated parent",
    );
    isolatedHomeTicket = await captureOwnedDirectory(
      preparedHome,
      "direct-user delegation isolated home",
    );
    if (
      isolatedHomeTicket.resolvedPath !== expectedIsolatedHome ||
      path.dirname(isolatedParentTicket.resolvedPath) !==
        sourceHomeTicket.resolvedPath ||
      !sameDirectoryIdentity(
        isolatedParentTicket.ticket,
        isolatedParentBeforePrepareTicket.ticket,
      )
    ) throw new Error("direct-user delegation isolated home confinement is invalid");
    isolatedHome = isolatedHomeTicket.resolvedPath;
    await requireOuterOwnership();
    openAttempted = true;
    session = await operations.openAppServer(prepared);
    sessionControl = captureSessionControl(session);
    if (!sessionControl.receiptIsSafe) {
      throw new Error("direct-user delegation app-server session receipts are invalid");
    }
    await requireOuterOwnership();
  } catch (error) {
    let closeReceipt = null;
    let closeFailure = null;
    if (sessionControl !== null) {
      try { closeReceipt = await closeAcquiredSession(); }
      catch (closeError) { closeFailure = closeError; }
    }
    if (closeReceipt?.closeError !== null && closeReceipt?.closeError !== undefined) {
      closeFailure = closeReceipt.closeError;
    }
    const closeConfirmed =
      closeReceipt?.processCloseConfirmed === true ||
      (operations.openAppServer === openAppServer && confirmedCloseFromError(error));
    if (runRootTicket !== null && (!openAttempted || closeConfirmed)) {
      try {
        await cleanupOwned(openAttempted ? 1 : 0, closeConfirmed ? 1 : 0);
      } catch (cleanupError) {
        throw new AggregateError(
          closeFailure === null
            ? [error, cleanupError]
            : [error, closeFailure, cleanupError],
          "direct-user delegation partial runtime cleanup failed",
          { cause: error },
        );
      }
    }
    if (closeFailure !== null) {
      throw new AggregateError(
        [error, closeFailure],
        "direct-user delegation acquired session close failed",
        { cause: error },
      );
    }
    throw error;
  }

  let finishPromise;
  return {
    session,
    caseRoot: caseState.caseRoot,
    sourceConfigBefore: Object.freeze({ ...sourceConfig.tuple }),
    readSourceConfig,
    async finish(safe) {
      if (safe !== true) fail("direct-user delegation runtime finish requires safe cleanup");
      finishPromise ??= (async () => {
        const closeReceipt = await closeAcquiredSession();
        await cleanupOwned(1, 1);
        if (closeReceipt.closeError !== null) throw closeReceipt.closeError;
        if (closeReceipt.processExitCode !== 0) {
          throw new Error("direct-user delegation app-server exit is not zero");
        }
      })();
      return finishPromise;
    },
  };
}

function exactDenseStringArray(value, maxLength, label) {
  if (
    value === null ||
    typeof value !== "object" ||
    utilTypes.isProxy(value) ||
    !Array.isArray(value)
  ) fail(`${label} must be an exact array`);
  let keys;
  let descriptors;
  try {
    keys = Reflect.ownKeys(value);
    descriptors = Object.getOwnPropertyDescriptors(value);
  } catch {
    fail(`${label} must be an exact array`);
  }
  const lengthDescriptor = descriptors.length;
  const length = lengthDescriptor?.value;
  if (
    !Number.isSafeInteger(length) ||
    length < 0 ||
    length > maxLength ||
    keys.length !== length + 1 ||
    keys[length] !== "length"
  ) fail(`${label} shape is invalid`);
  const result = [];
  for (let index = 0; index < length; index += 1) {
    const key = String(index);
    const descriptor = descriptors[key];
    if (
      keys[index] !== key ||
      descriptor === undefined ||
      !Object.hasOwn(descriptor, "value") ||
      descriptor.enumerable !== true ||
      typeof descriptor.value !== "string"
    ) fail(`${label} must contain dense own-data strings`);
    result.push(descriptor.value);
  }
  return result;
}

function assertExactLiterals(data, expected, label) {
  for (const [key, value] of Object.entries(expected)) {
    if (!Object.is(data[key], value)) fail(`${label}.${key} is invalid`);
  }
}

function exactFalseObject(value, keys, label) {
  const data = exactObject(value, keys, label);
  if (keys.some((key) => data[key] !== false)) fail(`${label} is invalid`);
  return Object.fromEntries(keys.map((key) => [key, false]));
}

function delegatedAssessment(status, value) {
  const expected = {
    status,
    scope:
      "actual-direct-user-turn-single-project-instruction-delegated-choice-structured-output-only",
    structuredOutputSemantics:
      status === "PASS" ? "PASS-PINNED-FIXTURE" : "FAIL-PINNED-FIXTURE",
    serializationCanonicality: "NOT-ASSESSED",
    delegatedChoiceFixture:
      status === "PASS"
        ? "PASS-DELEGATED-DIRECT-USER-CHOICE-FIXTURE-ONLY"
        : "FAIL-DELEGATED-DIRECT-USER-CHOICE-FIXTURE-ONLY",
    m4Overall: "UNVALIDATED",
    directUserChoiceWithinProjectDelegation:
      status === "PASS" ? "VERIFIED-PINNED-FIXTURE-ONLY" : "UNVALIDATED",
    directUserOverProjectAuthority: "NOT-EXERCISED",
    projectTaskOverExternalSkill: "NOT-EXERCISED",
    externalSkillChannel: "NOT-EXERCISED",
    installedPluginActivation: "UNVERIFIED",
    superpowersCompatibility: "NOT-EXERCISED",
    promotionPass: false,
  };
  const data = exactObject(
    value,
    TASK_B_ASSESSMENT_KEYS,
    "delegated Task-B assessment",
  );
  assertExactLiterals(data, expected, "delegated Task-B assessment");
  return { ...expected };
}

function delegatedObservation(status, value) {
  const data = exactObject(
    value,
    TASK_B_OBSERVATION_KEYS,
    "delegated Task-B semantic observation",
  );
  const mismatchCodes = exactDenseStringArray(
    data.mismatchCodes,
    TASK_B_MISMATCH_CODES.length,
    "delegated Task-B mismatch codes",
  );
  let previous = -1;
  for (const code of mismatchCodes) {
    const current = TASK_B_MISMATCH_CODES.indexOf(code);
    if (current <= previous) fail("delegated Task-B mismatch codes are invalid");
    previous = current;
  }
  if (
    (status === "PASS" && mismatchCodes.length !== 0) ||
    (status === "FAIL" && mismatchCodes.length === 0) ||
    data.mismatchCount !== mismatchCodes.length
  ) fail("delegated Task-B mismatch count is invalid");
  const expected = {
    schemaVersion: 1,
    provenance:
      "runner-owned-classification-of-authentic-role-separated-adapter-structured-output",
    stage:
      "direct-user-choice-within-project-delegation-structured-output-validation",
    result: status === "PASS" ? "PASS-PINNED-FIXTURE" : "FAIL-PINNED-FIXTURE",
    rawOutputInspected: false,
    rawOutputPersisted: false,
    rawOutputDigestPersisted: false,
    structuredOutputValuePersisted: false,
    serializationCanonicality: "NOT-ASSESSED",
  };
  for (const [key, expectedValue] of Object.entries(expected)) {
    if (!Object.is(data[key], expectedValue)) {
      fail(`delegated Task-B semantic observation.${key} is invalid`);
    }
  }
  return {
    schemaVersion: 1,
    provenance: expected.provenance,
    stage: expected.stage,
    result: expected.result,
    mismatchCodes,
    mismatchCount: mismatchCodes.length,
    rawOutputInspected: false,
    rawOutputPersisted: false,
    rawOutputDigestPersisted: false,
    structuredOutputValuePersisted: false,
    serializationCanonicality: "NOT-ASSESSED",
  };
}

function delegatedFixture(value) {
  const fixture = exactObject(
    value,
    ["manifest", "projectInstruction", "directUser", "responseSchema"],
    "delegated Task-B fixture",
  );
  const manifest = exactObject(
    fixture.manifest,
    ["id", "bytes", "sha256"],
    "delegated Task-B manifest",
  );
  assertExactLiterals(manifest, {
    id: "joeness-m4-direct-user-delegation-v1",
    bytes: 1550,
    sha256: "b0b6df573fb5c8d87522c0e7eb895e4ed8a13e2cfc50f523030115dfcc1397ac",
  }, "delegated Task-B manifest");
  const projectInstruction = exactObject(
    fixture.projectInstruction,
    ["role", "relativePath", "bytes", "sha256"],
    "delegated Task-B project instruction",
  );
  assertExactLiterals(projectInstruction, {
    role: "project",
    relativePath: "project-AGENTS.md",
    bytes: 833,
    sha256: "c3ffe6bc3dee638ceecf8ccf5f19f76225f2c7a673d0b9bb5a90a93e420b1ab9",
  }, "delegated Task-B project instruction");
  const directUser = exactObject(
    fixture.directUser,
    [
      "role",
      "descriptorCount",
      "type",
      "bytes",
      "sha256",
      "requestBytes",
      "requestSha256",
      "descriptorRequestSha256",
    ],
    "delegated Task-B direct user",
  );
  assertExactLiterals(directUser, {
    role: "user",
    descriptorCount: 1,
    type: "text",
    bytes: 545,
    sha256: "dc88991fa03b9a15d3215901b19f9a424889b5a2778c5f9b4b873cd309ab666c",
    requestBytes: 579,
    requestSha256: "4c795bf716aae59d3b86b04777f20287979a043c334a986eacaa6392f849d14f",
    descriptorRequestSha256:
      "73a23b0b54494a5a24916d75e599f5cbd75e3ac2231d6849c8cda7d79411855f",
  }, "delegated Task-B direct user");
  const responseSchema = exactObject(
    fixture.responseSchema,
    ["bytes", "sha256"],
    "delegated Task-B response schema",
  );
  assertExactLiterals(responseSchema, {
    bytes: 1049,
    sha256: "ceed0a7aa6240841e18f9c1f94bf6924c4798fbeddcd3f6f2cee359e7248f31a",
  }, "delegated Task-B response schema");
  return {
    manifest: { ...manifest },
    projectInstruction: { ...projectInstruction },
    directUser: { ...directUser },
    responseSchema: { ...responseSchema },
  };
}

function delegatedRuntime(value) {
  const data = exactObject(value, TASK_B_RUNTIME_KEYS, "delegated Task-B runtime");
  assertExactLiterals(data, {
    freshTurnCount: 1,
    retryCount: 0,
    projectDocMaxBytes: 32768,
    dynamicToolCount: 0,
    selectedCapabilityRootCount: 0,
    priorTurnCount: 0,
    instructionSourceCount: 1,
    externalSkillSourceCount: 0,
    appServerExitCode: 0,
    stderrByteLength: 0,
    remoteControl: "DISABLED",
    sessionCleanup: "SAFE",
    installedPluginActivation: "UNVERIFIED",
  }, "delegated Task-B runtime");
  return { ...data };
}

export function rebuildJoenessM4DirectUserDelegationDelegatedEvidence(value) {
  const data = exactObject(
    value,
    TASK_B_EVIDENCE_KEYS,
    "delegated Task-B evidence",
  );
  if (
    data.schemaVersion !== 1 ||
    data.id !== "joeness-m4-direct-user-delegation-v1"
  ) fail("delegated Task-B evidence identity is invalid");
  const assessmentData = exactObject(
    data.assessment,
    TASK_B_ASSESSMENT_KEYS,
    "delegated Task-B assessment",
  );
  if (assessmentData.status !== "PASS" && assessmentData.status !== "FAIL") {
    fail("delegated Task-B assessment status is invalid");
  }
  const assessment = delegatedAssessment(assessmentData.status, data.assessment);
  const semanticObservation = delegatedObservation(
    assessment.status,
    data.semanticObservation,
  );
  const fixture = delegatedFixture(data.fixture);
  const runtime = delegatedRuntime(data.runtime);
  if (
    data.artifactAuthorship !==
      "HARNESS_EVIDENCE_NOT_MODEL_AUTHORED_PROJECT_ARTIFACT" ||
    data.sourceConfigReadback !== "UNCHANGED" ||
    data.runtimeCleanup !== "SAFE"
  ) fail("delegated Task-B evidence boundary is invalid");
  const privacy = exactFalseObject(
    data.privacy,
    TASK_B_PRIVACY_KEYS,
    "delegated Task-B privacy",
  );
  return {
    schemaVersion: 1,
    id: "joeness-m4-direct-user-delegation-v1",
    assessment,
    semanticObservation,
    fixture,
    runtime,
    artifactAuthorship: "HARNESS_EVIDENCE_NOT_MODEL_AUTHORED_PROJECT_ARTIFACT",
    privacy,
    sourceConfigReadback: "UNCHANGED",
    runtimeCleanup: "SAFE",
  };
}

function delegatedFreshFailure(value) {
  const data = exactObject(
    value,
    ["schemaVersion", "provenance", "runnerStage", "adapter", "privacy"],
    "delegated Task-B fresh failure",
  );
  const adapter = exactObject(
    data.adapter,
    ["schemaVersion", "adapterId", "status", "stage", "sessionCloseCount"],
    "delegated Task-B fresh failure adapter",
  );
  if (
    data.schemaVersion !== 1 ||
    data.provenance !==
      "direct-user-delegation-runner-observed-authentic-role-separated-adapter-rejection" ||
    data.runnerStage !== "role-separated-evaluator-rejected" ||
    adapter.schemaVersion !== 1 ||
    adapter.adapterId !== "authority-role-separated-evaluator-turn-v1" ||
    adapter.status !== "blocked" ||
    !TASK_A_BLOCKED_STAGES.includes(adapter.stage) ||
    !Number.isSafeInteger(adapter.sessionCloseCount) ||
    adapter.sessionCloseCount < 0 ||
    adapter.sessionCloseCount > 1
  ) fail("delegated Task-B fresh failure is invalid");
  const privacy = exactFalseObject(
    data.privacy,
    [
      "rawOutputPersisted",
      "rawOutputDigestPersisted",
      "rawEventsPersisted",
      "absolutePathsPersisted",
      "rawStderrPersisted",
      "configContentsPersisted",
    ],
    "delegated Task-B fresh failure privacy",
  );
  return {
    schemaVersion: 1,
    provenance:
      "direct-user-delegation-runner-observed-authentic-role-separated-adapter-rejection",
    runnerStage: "role-separated-evaluator-rejected",
    adapter: { ...adapter },
    privacy,
  };
}

export function rebuildJoenessM4DirectUserDelegationDelegatedBlockedReceipt(value) {
  if (
    value === null ||
    typeof value !== "object" ||
    utilTypes.isProxy(value) ||
    Array.isArray(value)
  ) fail("delegated Task-B blocked receipt must be an exact object");
  let keys;
  try { keys = Reflect.ownKeys(value); }
  catch { fail("delegated Task-B blocked receipt must be an exact object"); }
  const detailed = keys.includes("freshFailure");
  const data = exactObject(
    value,
    detailed
      ? [
        "schemaVersion",
        "id",
        "status",
        "phase",
        "safeCleanup",
        "cause",
        "freshFailure",
        "privacy",
      ]
      : [
        "schemaVersion",
        "id",
        "status",
        "phase",
        "safeCleanup",
        "cause",
        "privacy",
      ],
    "delegated Task-B blocked receipt",
  );
  if (
    data.schemaVersion !== 1 ||
    data.id !== "joeness-m4-direct-user-delegation-v1" ||
    data.status !== "blocked" ||
    data.phase !== "post-runtime-validation" ||
    data.safeCleanup !== true
  ) fail("delegated Task-B blocked receipt is invalid");
  const cause = exactObject(
    data.cause,
    detailed ? ["category", "result"] : ["category"],
    "delegated Task-B blocked cause",
  );
  let freshFailure;
  if (detailed) {
    if (
      cause.category !== "role-separated-adapter-rejection" ||
      cause.result !== "BLOCKED_ROLE_SEPARATED_ADAPTER"
    ) fail("delegated Task-B blocked cause is invalid");
    freshFailure = delegatedFreshFailure(data.freshFailure);
  } else if (
    cause.category !== "structured-output-contract" &&
    cause.category !== "evaluation-failed"
  ) {
    fail("delegated Task-B blocked cause is invalid");
  }
  const privacy = exactFalseObject(
    data.privacy,
    TASK_B_BLOCKED_PRIVACY_KEYS,
    "delegated Task-B blocked privacy",
  );
  return {
    schemaVersion: 1,
    id: "joeness-m4-direct-user-delegation-v1",
    status: "blocked",
    phase: "post-runtime-validation",
    safeCleanup: true,
    cause: { ...cause },
    ...(detailed ? { freshFailure } : {}),
    privacy,
  };
}

function partialRuntimeFactoryBlockedReceipt() {
  return {
    schemaVersion: 1,
    id: "joeness-m4-direct-user-delegation-v1",
    status: "blocked",
    phase: "runtime-factory",
    safeCleanup: true,
    cause: { category: "runtime-factory-failed" },
    privacy: Object.fromEntries(
      TASK_B_BLOCKED_PRIVACY_KEYS.map((key) => [key, false]),
    ),
  };
}

function liveConfigTuple(value, label) {
  const data = exactObject(value, ["bytes", "sha256"], label);
  if (!Number.isSafeInteger(data.bytes) || data.bytes < 0) {
    fail(`${label}.bytes is invalid`);
  }
  digest(data.sha256, 64, `${label}.sha256`);
  return { bytes: data.bytes, sha256: data.sha256 };
}

function sameLiveConfig(left, right) {
  return left.bytes === right.bytes && left.sha256 === right.sha256;
}

function liveArtifactTuple(value) {
  const bytes = Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8");
  return {
    byteLength: bytes.length,
    sha256: sha256(bytes),
  };
}

function validateLivePublicationReceipt(value, expected, label) {
  const data = exactObject(value, ["byteLength", "sha256"], label);
  if (
    data.byteLength !== expected.byteLength ||
    data.sha256 !== expected.sha256
  ) fail(`${label} is invalid`);
}

function validateLiveCleanupState(
  value,
  expectedConfig,
  { requireLaunch = true } = {},
) {
  const data = exactObject(
    value,
    ["sourceConfigBefore", "sourceConfigAfter", "receipt"],
    "direct-user delegation live cleanup state",
  );
  const before = liveConfigTuple(
    data.sourceConfigBefore,
    "direct-user delegation live cleanup config before",
  );
  const after = liveConfigTuple(
    data.sourceConfigAfter,
    "direct-user delegation live cleanup config after",
  );
  const receipt = exactObject(
    data.receipt,
    [
      "appServerLaunchCount",
      "appServerCloseConfirmedCount",
      "remainingOwnedProcessCount",
      "caseRootReadback",
      "isolatedCodexHomeReadback",
      "runRootReadback",
      "sourceConfigReadback",
    ],
    "direct-user delegation live cleanup receipt",
  );
  if (
    !sameLiveConfig(before, expectedConfig) ||
    !sameLiveConfig(after, expectedConfig) ||
    (
      requireLaunch
        ? receipt.appServerLaunchCount !== 1 ||
          receipt.appServerCloseConfirmedCount !== 1
        : (
          receipt.appServerLaunchCount !== 0 &&
          receipt.appServerLaunchCount !== 1
        ) ||
          receipt.appServerCloseConfirmedCount !==
            receipt.appServerLaunchCount
    ) ||
    receipt.remainingOwnedProcessCount !== 0 ||
    receipt.caseRootReadback !== "absent" ||
    receipt.isolatedCodexHomeReadback !== "absent" ||
    receipt.runRootReadback !== "absent" ||
    receipt.sourceConfigReadback !== "UNCHANGED"
  ) fail("direct-user delegation live cleanup receipt is invalid");
  return {
    sourceConfigBefore: before,
    sourceConfigAfter: after,
    receipt: { ...receipt },
  };
}

function liveOrchestrationReceipt(plan, cleanup) {
  return {
    codexVersion: plan.runtime.codexVersion,
    freshTurnCount: 1,
    retryCount: 0,
    dynamicToolCount: 0,
    sourceConfigBefore: { ...cleanup.sourceConfigBefore },
    sourceConfigAfter: { ...cleanup.sourceConfigAfter },
    sourceConfigReadback: cleanup.receipt.sourceConfigReadback,
    cleanup: {
      appServerLaunchCount: cleanup.receipt.appServerLaunchCount,
      appServerCloseConfirmedCount:
        cleanup.receipt.appServerCloseConfirmedCount,
      remainingOwnedProcessCount: cleanup.receipt.remainingOwnedProcessCount,
      caseRootReadback: cleanup.receipt.caseRootReadback,
      isolatedCodexHomeReadback: cleanup.receipt.isolatedCodexHomeReadback,
      runRootReadback: cleanup.receipt.runRootReadback,
    },
  };
}

function liveInnerSourcePin(boundary) {
  const source = boundary.executionSource.sourcePins;
  return {
    repositoryCommit: boundary.executionSource.executionHead,
    directUserDelegationRunner: { ...source.directUserDelegationRunner },
    authorityRoleSeparatedAdapter: { ...source.authorityRoleSeparatedAdapter },
    freshTurnAdapter: { ...source.freshTurnAdapter },
    transportControlSupport: { ...source.transportControlSupport },
    collector: { ...source.collector },
    fixtureManifest: { ...source.fixtureManifest },
  };
}

function validatePublishedExecutionBoundary(value, initial, publishedPath, artifactTuple) {
  const data = exactObject(
    value,
    ["plan", "executionSource", "outputsAbsent", "publishedArtifact"],
    "direct-user delegation published execution boundary",
  );
  if (data.outputsAbsent !== false) {
    fail("direct-user delegation published execution outputs are invalid");
  }
  const base = snapshotExecutionBoundary({
    plan: data.plan,
    executionSource: data.executionSource,
    outputsAbsent: true,
  });
  if (
    JSON.stringify(base.plan) !== JSON.stringify(initial.plan) ||
    JSON.stringify(base.executionSource) !== JSON.stringify(initial.executionSource)
  ) fail("direct-user delegation published execution source changed");
  const artifact = exactObject(
    data.publishedArtifact,
    ["path", "byteLength", "sha256"],
    "direct-user delegation published artifact",
  );
  if (
    artifact.path !== publishedPath ||
    artifact.byteLength !== artifactTuple.byteLength ||
    artifact.sha256 !== artifactTuple.sha256
  ) fail("direct-user delegation published artifact readback is invalid");
}

function validateUnpublishedExecutionBoundary(value, initial) {
  const current = snapshotExecutionBoundary(value);
  if (
    JSON.stringify(current.plan) !== JSON.stringify(initial.plan) ||
    JSON.stringify(current.executionSource) !== JSON.stringify(initial.executionSource)
  ) fail("direct-user delegation unpublished execution source changed");
  return current;
}

function captureLiveAcquiredFinish(value) {
  if (
    value === null ||
    typeof value !== "object" ||
    utilTypes.isProxy(value) ||
    Array.isArray(value)
  ) return null;
  let prototype;
  let descriptor;
  try {
    prototype = Object.getPrototypeOf(value);
    descriptor = Object.getOwnPropertyDescriptor(value, "finish");
  } catch {
    return null;
  }
  if (
    (prototype !== Object.prototype && prototype !== null) ||
    descriptor === undefined ||
    !Object.hasOwn(descriptor, "value") ||
    descriptor.enumerable !== true ||
    descriptor.get !== undefined ||
    descriptor.set !== undefined ||
    typeof descriptor.value !== "function" ||
    utilTypes.isProxy(descriptor.value)
  ) return null;
  return (...args) => Reflect.apply(descriptor.value, value, args);
}

function captureLiveAcquiredCaseRoot(value) {
  if (
    value === null ||
    typeof value !== "object" ||
    utilTypes.isProxy(value) ||
    Array.isArray(value)
  ) return null;
  let descriptor;
  try {
    descriptor = Object.getOwnPropertyDescriptor(value, "caseRoot");
  } catch {
    return null;
  }
  if (
    descriptor === undefined ||
    !Object.hasOwn(descriptor, "value") ||
    descriptor.enumerable !== true ||
    descriptor.get !== undefined ||
    descriptor.set !== undefined ||
    typeof descriptor.value !== "string" ||
    !path.isAbsolute(descriptor.value)
  ) return null;
  return descriptor.value;
}

async function throwAfterLiveAcquiredCleanup(
  primary,
  acquired,
  cleanupState,
  expectedConfig,
  requireOwnership,
) {
  const cleanupErrors = [];
  if (acquired.finish === null) {
    cleanupErrors.push(
      new Error("direct-user delegation acquired runtime cleanup is unavailable"),
    );
  } else {
    try {
      await acquired.finish(true);
    } catch (cleanupError) {
      cleanupErrors.push(cleanupError);
    }
  }
  let cleanup = null;
  try {
    cleanup = validateLiveCleanupState(cleanupState, expectedConfig);
  } catch (cleanupError) {
    cleanupErrors.push(cleanupError);
  }
  try {
    const currentConfig = await requireOwnership();
    if (
      cleanup !== null &&
      !sameLiveConfig(cleanup.sourceConfigAfter, currentConfig)
    ) throw new Error("direct-user delegation acquired runtime cleanup config changed");
  } catch (cleanupError) {
    cleanupErrors.push(cleanupError);
  }
  if (acquired.caseRoot === null) {
    cleanupErrors.push(
      new Error("direct-user delegation acquired runtime case root is unresolved"),
    );
  } else {
    try {
      if (!(await pathIsAbsent(acquired.caseRoot))) {
        throw new Error("direct-user delegation acquired runtime case root remains");
      }
    } catch (cleanupError) {
      cleanupErrors.push(cleanupError);
    }
  }
  if (cleanupErrors.length > 0) {
    throw new AggregateError(
      [primary, ...cleanupErrors],
      "direct-user delegation acquired runtime ownership cleanup is unresolved",
      { cause: primary },
    );
  }
  throw primary;
}

export function validateJoenessM4DirectUserDelegationRunnerRuntimeRequest(options) {
  const data = exactObject(
    options,
    ["request", "repositoryRoot", "executionPlan", "sourcePin"],
    "direct-user delegation live runtime request validation options",
  );
  const runner = exactObject(
    data.request,
    ["repositoryRoot", "executionPlan", "sourcePin", "fixture"],
    "direct-user delegation live runner runtime request",
  );
  if (runner.repositoryRoot !== data.repositoryRoot) {
    fail("direct-user delegation live runner repository changed");
  }
  const expectedPlan = exactObject(
    data.executionPlan,
    ["schemaVersion", "id", "outputs"],
    "direct-user delegation live expected execution plan",
  );
  const expectedOutputs = exactObject(
    expectedPlan.outputs,
    ["evidence", "blocked"],
    "direct-user delegation live expected execution outputs",
  );
  const runnerPlan = exactObject(
    runner.executionPlan,
    ["schemaVersion", "id", "outputs"],
    "direct-user delegation live runner execution plan",
  );
  exact(
    runnerPlan.schemaVersion,
    expectedPlan.schemaVersion,
    "direct-user delegation live runner execution plan schema",
  );
  exact(
    runnerPlan.id,
    expectedPlan.id,
    "direct-user delegation live runner execution plan id",
  );
  const runnerOutputs = exactObject(
    runnerPlan.outputs,
    ["evidence", "blocked"],
    "direct-user delegation live runner execution outputs",
  );
  exact(
    runnerOutputs.evidence,
    expectedOutputs.evidence,
    "direct-user delegation live runner evidence output",
  );
  exact(
    runnerOutputs.blocked,
    expectedOutputs.blocked,
    "direct-user delegation live runner blocked output",
  );
  const expectedSourcePin = exactObject(
    data.sourcePin,
    INNER_SOURCE_PIN_KEYS,
    "direct-user delegation live expected source pin",
  );
  const runnerSourcePin = exactObject(
    runner.sourcePin,
    INNER_SOURCE_PIN_KEYS,
    "direct-user delegation live runner source pin",
  );
  exact(
    runnerSourcePin.repositoryCommit,
    expectedSourcePin.repositoryCommit,
    "direct-user delegation live runner repository commit",
  );
  for (const role of INNER_SOURCE_PIN_KEYS.slice(1)) {
    exactTupleMatch(
      runnerSourcePin[role],
      expectedSourcePin[role],
      `direct-user delegation live runner source pin ${role}`,
    );
  }
  const fixture = exactObject(
    runner.fixture,
    ["projectInstruction", "directUser"],
    "direct-user delegation live runner fixture",
  );
  const validatedProjectInstruction = exactProjectInstruction(
    fixture.projectInstruction,
  );
  const directUser = exactObject(
    fixture.directUser,
    ["type", "bytes", "sha256", "text"],
    "direct-user delegation live runner direct user",
  );
  exact(directUser.type, "text", "direct-user delegation live runner direct user type");
  exact(directUser.bytes, USER_INPUT.bytes, "direct-user delegation live runner direct user bytes");
  exact(
    directUser.sha256,
    USER_INPUT.sha256,
    "direct-user delegation live runner direct user SHA-256",
  );
  if (typeof directUser.text !== "string") {
    fail("direct-user delegation live runner direct user text is invalid");
  }
  const directUserBytes = Buffer.from(directUser.text, "utf8");
  if (
    directUserBytes.length !== USER_INPUT.bytes ||
    sha256(directUserBytes) !== USER_INPUT.sha256
  ) fail("direct-user delegation live runner direct user text tuple is invalid");
  return {
    relativePath: validatedProjectInstruction.relativePath,
    bytes: validatedProjectInstruction.bytes,
    sha256: validatedProjectInstruction.sha256,
    text: validatedProjectInstruction.text,
  };
}

function liveBoundFileTuples(boundary) {
  return [
    { ...boundary.executionSource.plan },
    ...SOURCE_ROLES.map((role) => ({
      ...boundary.executionSource.sourcePins[role],
    })),
    { ...PROJECT_INPUT },
    { ...USER_INPUT },
    { ...PREDECESSOR.plan },
    { ...PREDECESSOR.evidenceArtifact },
    { ...PREDECESSOR.attemptIndex },
  ];
}

async function requireLiveBoundFiles(repositoryRoot, bindings) {
  for (const binding of bindings) {
    const current = await readUniqueConfinedFile(
      repositoryRoot,
      binding.tuple.path,
      `direct-user delegation live bound file ${binding.tuple.path}`,
    );
    assertSameBoundFile(
      binding.file,
      current,
      binding.tuple,
      `direct-user delegation live bound file ${binding.tuple.path}`,
    );
  }
}

async function captureLiveBoundFiles(repositoryRoot, boundary) {
  const bindings = [];
  for (const tuple of liveBoundFileTuples(boundary)) {
    const file = await readUniqueConfinedFile(
      repositoryRoot,
      tuple.path,
      `direct-user delegation live initial bound file ${tuple.path}`,
    );
    assertBlobTuple(
      file.bytes,
      tuple,
      `direct-user delegation live initial bound file ${tuple.path}`,
    );
    bindings.push({ tuple, file });
  }
  await requireLiveBoundFiles(repositoryRoot, bindings);
  return bindings;
}

async function requireLiveOutputsAbsent(repositoryRoot) {
  for (const relativePath of [
    ...Object.values(JOENESS_M4_DIRECT_USER_DELEGATION_LIVE_OUTPUTS),
    V8_ATTEMPT_INDEX_PATH,
  ]) {
    await requireAbsentConfinedTarget(
      repositoryRoot,
      relativePath,
      "direct-user delegation live unpublished output",
    );
  }
}

async function requireLiveOtherOutputsAbsent(repositoryRoot, publishedPath) {
  for (const relativePath of [
    ...Object.values(JOENESS_M4_DIRECT_USER_DELEGATION_LIVE_OUTPUTS)
      .filter((candidate) => candidate !== publishedPath),
    V8_ATTEMPT_INDEX_PATH,
  ]) {
    await requireAbsentConfinedTarget(
      repositoryRoot,
      relativePath,
      "direct-user delegation live alternate output",
    );
  }
}

async function requireNoLiveOutputSiblings(repositoryRoot, publishedPath = null) {
  const parentRelative = path.posix.dirname(
    JOENESS_M4_DIRECT_USER_DELEGATION_LIVE_OUTPUTS.evidence,
  );
  const parent = path.join(repositoryRoot, ...parentRelative.split("/"));
  const parentOwnership = await captureOwnedDirectory(
    parent,
    "direct-user delegation live output parent",
  );
  const names = await readdir(parent);
  await requireOwnedDirectory(
    parent,
    parentOwnership,
    "direct-user delegation live output parent",
  );
  const allowed = publishedPath === null ? null : path.posix.basename(publishedPath);
  const protectedNames = [
    ...Object.values(JOENESS_M4_DIRECT_USER_DELEGATION_LIVE_OUTPUTS),
    V8_ATTEMPT_INDEX_PATH,
  ].map((relativePath) => path.posix.basename(relativePath));
  for (const name of names) {
    if (name === allowed) continue;
    if (
      protectedNames.includes(name) ||
      protectedNames.some((protectedName) =>
        name.startsWith(protectedName))
    ) throw new Error("direct-user delegation live output sibling is unsafe");
  }
}

export async function runJoenessM4DirectUserDelegationLive(options) {
  const data = exactObject(
    options,
    ["repositoryRoot", "planPath", "sourceCodexHome", "runParent", "operations"],
    "direct-user delegation live options",
  );
  for (const [label, value] of [
    ["repository root", data.repositoryRoot],
    ["source Codex home", data.sourceCodexHome],
    ["run parent", data.runParent],
  ]) {
    if (typeof value !== "string" || !path.isAbsolute(value)) {
      fail(`direct-user delegation live ${label} must be absolute`);
    }
  }
  exact(
    data.planPath,
    JOENESS_M4_DIRECT_USER_DELEGATION_LIVE_PLAN_PATH,
    "direct-user delegation live plan path",
  );
  const injected = data.operations === undefined
    ? Object.create(null)
    : subsetObject(
      data.operations,
      [
        "verifyExecutionBoundary",
        "createRuntime",
        "runEvaluator",
        "snapshotSourceConfig",
        "runnerGitStatus",
        "runnerGitIdentity",
        "runnerGitReadBlob",
        "runnerArtifactExists",
        "publishSingleArtifact",
      ],
      "direct-user delegation live operations",
    );
  const operations = {
    verifyExecutionBoundary:
      injected.verifyExecutionBoundary ??
      verifyJoenessM4DirectUserDelegationExecutionBoundary,
    createRuntime:
      injected.createRuntime ??
      createJoenessM4DirectUserDelegationDefaultRuntime,
    runEvaluator:
      injected.runEvaluator ?? runJoenessM4DirectUserDelegationEval,
    snapshotSourceConfig:
      injected.snapshotSourceConfig ??
      snapshotJoenessM4DirectUserDelegationSourceConfig,
    runnerGitStatus:
      injected.runnerGitStatus ??
      ((root) => gitText(root, ["status", "--porcelain=v1", "--untracked-files=all"])),
    runnerGitIdentity:
      injected.runnerGitIdentity ?? ((root) => gitText(root, ["rev-parse", "HEAD"])),
    runnerGitReadBlob:
      injected.runnerGitReadBlob ?? ((root, commit, relativePath) =>
        gitBlob(root, commit, relativePath)),
    runnerArtifactExists:
      injected.runnerArtifactExists ?? (async (root, relativePath) =>
        !(await pathIsAbsent(path.join(root, ...relativePath.split("/"))))),
    publishSingleArtifact:
      injected.publishSingleArtifact ??
      ((publication) => publishJoenessM4TransportControlBlockedArtifact({
        repositoryRoot: data.repositoryRoot,
        relativePath: publication.relativePath,
        value: publication.value,
      })),
  };
  for (const [name, operation] of Object.entries(operations)) {
    if (typeof operation !== "function" || utilTypes.isProxy(operation)) {
      fail(`direct-user delegation live operation ${name} is invalid`);
    }
  }
  if (operations.runEvaluator !== runJoenessM4DirectUserDelegationEval) {
    fail("direct-user delegation live requires the authentic evaluator identity");
  }

  const repositoryOwnership = await captureOwnedDirectory(
    data.repositoryRoot,
    "direct-user delegation live repository root",
  );
  const sourceHomeOwnership = await captureOwnedDirectory(
    data.sourceCodexHome,
    "direct-user delegation live source home",
  );
  const sourceConfigOwnership = await captureSourceConfig(
    data.sourceCodexHome,
    sourceHomeOwnership,
  );
  const requireLiveOwnership = async () => {
    await requireOwnedDirectory(
      data.repositoryRoot,
      repositoryOwnership,
      "direct-user delegation live repository root",
    );
    await requireOwnedDirectory(
      data.sourceCodexHome,
      sourceHomeOwnership,
      "direct-user delegation live source home",
    );
    const currentConfig = await captureSourceConfig(
      data.sourceCodexHome,
      sourceHomeOwnership,
    );
    if (
      !sameFileIdentity(
        currentConfig.configTicket,
        sourceConfigOwnership.configTicket,
      ) ||
      !sameLiveConfig(currentConfig.tuple, sourceConfigOwnership.tuple)
    ) throw new Error("direct-user delegation live source config identity changed");
    return { ...currentConfig.tuple };
  };

  const initialBoundary = snapshotExecutionBoundary(
    await operations.verifyExecutionBoundary({
      repositoryRoot: data.repositoryRoot,
      planPath: data.planPath,
    }),
  );
  const plan = initialBoundary.plan;
  const sourceConfigBefore = liveConfigTuple(
    await operations.snapshotSourceConfig({
      sourceCodexHome: data.sourceCodexHome,
    }),
    "direct-user delegation live source config before",
  );
  const physicalConfigBefore = await requireLiveOwnership();
  if (!sameLiveConfig(sourceConfigBefore, physicalConfigBefore)) {
    fail("direct-user delegation live source config snapshot is invalid");
  }
  const liveBoundFiles = await captureLiveBoundFiles(
    repositoryOwnership.resolvedPath,
    initialBoundary,
  );
  await requireLiveOutputsAbsent(repositoryOwnership.resolvedPath);
  await requireNoLiveOutputSiblings(repositoryOwnership.resolvedPath);
  const cleanupState = Object.create(null);
  let delegatedPublication = null;
  const executionPlan = {
    schemaVersion: 1,
    id: JOENESS_M4_DIRECT_USER_DELEGATION_ID,
    outputs: {
      evidence: plan.outputs.evidence,
      blocked: plan.outputs.blocked,
    },
  };
  const sourcePin = liveInnerSourcePin(initialBoundary);
  let runtimeFactoryCount = 0;
  const innerGitStatus = async (root) => {
    const actual = await operations.runnerGitStatus(root);
    if (delegatedPublication === null) return actual;
    if (actual !== "") {
      throw new Error("direct-user delegation live inner worktree changed");
    }
    return `?? ${delegatedPublication.relativePath}\n`;
  };
  const captureDelegatedArtifact = async (relativePath, value) => {
    if (delegatedPublication !== null) {
      throw new Error("direct-user delegation live delegated publication repeated");
    }
    let rebuilt;
    if (relativePath === plan.outputs.evidence) {
      rebuilt = rebuildJoenessM4DirectUserDelegationDelegatedEvidence(value);
    } else if (relativePath === plan.outputs.blocked) {
      rebuilt = rebuildJoenessM4DirectUserDelegationDelegatedBlockedReceipt(value);
    } else {
      throw new Error("direct-user delegation live delegated publication path is invalid");
    }
    delegatedPublication = {
      relativePath,
      value: rebuilt,
    };
    return liveArtifactTuple(rebuilt);
  };
  const runtimeFactory = async (value) => {
    runtimeFactoryCount += 1;
    if (runtimeFactoryCount !== 1) {
      fail("direct-user delegation live runtime factory call count is invalid");
    }
    const projectInstruction =
      validateJoenessM4DirectUserDelegationRunnerRuntimeRequest({
        request: value,
        repositoryRoot: data.repositoryRoot,
        executionPlan,
        sourcePin,
      });
    await requireLiveOwnership();
    const candidate = await operations.createRuntime({
      plan,
      repositoryRoot: data.repositoryRoot,
      sourceCodexHome: data.sourceCodexHome,
      runParent: data.runParent,
      projectInstruction,
      cleanupState,
      operations: {
        createExclusiveRunRoot: undefined,
        prepareRuntime: undefined,
        openAppServer: undefined,
        removeIsolatedCodexHome: undefined,
        removeRunRoot: undefined,
      },
    });
    const acquiredFinish = captureLiveAcquiredFinish(candidate);
    const acquiredCaseRoot = captureLiveAcquiredCaseRoot(candidate);
    let runtime;
    try {
      runtime = subsetObject(
        candidate,
        ["session", "caseRoot", "sourceConfigBefore", "finish", "readSourceConfig"],
        "direct-user delegation live acquired runtime",
      );
      if (
        typeof runtime.finish !== "function" ||
        utilTypes.isProxy(runtime.finish) ||
        typeof runtime.readSourceConfig !== "function" ||
        utilTypes.isProxy(runtime.readSourceConfig)
      ) fail("direct-user delegation live acquired runtime is invalid");
      await requireLiveOwnership();
    } catch (error) {
      await throwAfterLiveAcquiredCleanup(
        error,
        { finish: acquiredFinish, caseRoot: acquiredCaseRoot },
        cleanupState,
        sourceConfigBefore,
        requireLiveOwnership,
      );
    }
    return {
      session: runtime.session,
      caseRoot: runtime.caseRoot,
      sourceConfigBefore: runtime.sourceConfigBefore,
      finish: (...args) => Reflect.apply(runtime.finish, candidate, args),
      readSourceConfig: (...args) =>
        Reflect.apply(runtime.readSourceConfig, candidate, args),
    };
  };

  let runnerAssessment;
  let runnerError = null;
  let partialRuntimeFactory = false;
  try {
    runnerAssessment = await operations.runEvaluator({
      repositoryRoot: data.repositoryRoot,
      executionPlan,
      sourcePin,
      gitStatus: innerGitStatus,
      gitIdentity: operations.runnerGitIdentity,
      gitReadBlob: operations.runnerGitReadBlob,
      artifactExists: operations.runnerArtifactExists,
      runtimeFactory,
      runTurn: runAuthorityRoleSeparatedEvaluatorTurn,
      writeArtifact: captureDelegatedArtifact,
    });
  } catch (error) {
    runnerError = error;
  }
  if (delegatedPublication === null) {
    if (runnerError === null) {
      fail("direct-user delegation live runner returned without a publication");
    }
    if (runtimeFactoryCount !== 1) throw runnerError;
    try {
      const partialCleanup = validateLiveCleanupState(
        cleanupState,
        sourceConfigBefore,
        { requireLaunch: false },
      );
      const physicalConfigAfterPartial = await requireLiveOwnership();
      if (
        !sameLiveConfig(
          partialCleanup.sourceConfigAfter,
          physicalConfigAfterPartial,
        )
      ) fail("direct-user delegation partial runtime cleanup config changed");
      delegatedPublication = {
        relativePath: plan.outputs.blocked,
        value: partialRuntimeFactoryBlockedReceipt(),
      };
      partialRuntimeFactory = true;
    } catch (cleanupError) {
      throw new AggregateError(
        [runnerError, cleanupError],
        "direct-user delegation partial runtime cleanup is unresolved",
        { cause: runnerError },
      );
    }
  }
  const cleanup = validateLiveCleanupState(
    cleanupState,
    sourceConfigBefore,
    { requireLaunch: !partialRuntimeFactory },
  );
  const sourceConfigAfter = liveConfigTuple(
    await operations.snapshotSourceConfig({
      sourceCodexHome: data.sourceCodexHome,
    }),
    "direct-user delegation live source config after",
  );
  if (!sameLiveConfig(sourceConfigBefore, sourceConfigAfter)) {
    fail("direct-user delegation live source config changed");
  }

  const isEvidence = delegatedPublication.relativePath === plan.outputs.evidence;
  if (isEvidence) {
    if (runnerError !== null) {
      throw new Error("direct-user delegation live evidence branch threw", {
        cause: runnerError,
      });
    }
    delegatedAssessment(
      delegatedPublication.value.assessment.status,
      runnerAssessment,
    );
  } else if (runnerError === null) {
    fail("direct-user delegation live blocked branch returned an assessment");
  }

  validateUnpublishedExecutionBoundary(
    await operations.verifyExecutionBoundary({
      repositoryRoot: data.repositoryRoot,
      planPath: data.planPath,
    }),
    initialBoundary,
  );
  const prePublicationConfig = await requireLiveOwnership();
  const prePublicationCleanup = validateLiveCleanupState(
    cleanupState,
    sourceConfigBefore,
    { requireLaunch: !partialRuntimeFactory },
  );
  if (
    !sameLiveConfig(
      prePublicationCleanup.sourceConfigAfter,
      prePublicationConfig,
    )
  ) fail("direct-user delegation prepublication cleanup config changed");
  await requireLiveBoundFiles(
    repositoryOwnership.resolvedPath,
    liveBoundFiles,
  );
  await requireLiveOutputsAbsent(repositoryOwnership.resolvedPath);
  await requireNoLiveOutputSiblings(repositoryOwnership.resolvedPath);

  const durableArtifact = {
    ...delegatedPublication.value,
    executionSource: cloneSafeData(
      initialBoundary.executionSource,
      "direct-user delegation live execution source",
    ),
    inputContract: cloneSafeData(
      plan.inputContract,
      "direct-user delegation live input contract",
    ),
    resultBoundary: cloneSafeData(
      plan.resultBoundary,
      "direct-user delegation live result boundary",
    ),
    orchestration: liveOrchestrationReceipt(plan, cleanup),
  };
  const expectedArtifact = liveArtifactTuple(durableArtifact);
  const publicationReceipt = await operations.publishSingleArtifact({
    relativePath: delegatedPublication.relativePath,
    value: durableArtifact,
  });
  validateLivePublicationReceipt(
    publicationReceipt,
    expectedArtifact,
    "direct-user delegation live publication receipt",
  );
  const canonicalArtifactBytes = Buffer.from(
    `${JSON.stringify(durableArtifact, null, 2)}\n`,
    "utf8",
  );
  const publishedFile = await readUniqueConfinedFile(
    repositoryOwnership.resolvedPath,
    delegatedPublication.relativePath,
    "direct-user delegation live published artifact",
  );
  if (!publishedFile.bytes.equals(canonicalArtifactBytes)) {
    fail("direct-user delegation live published artifact bytes are invalid");
  }
  const finalBoundary = await operations.verifyExecutionBoundary({
    repositoryRoot: data.repositoryRoot,
    planPath: data.planPath,
    publishedPath: delegatedPublication.relativePath,
  });
  validatePublishedExecutionBoundary(
    finalBoundary,
    initialBoundary,
    delegatedPublication.relativePath,
    expectedArtifact,
  );
  const finalConfig = liveConfigTuple(
    await operations.snapshotSourceConfig({
      sourceCodexHome: data.sourceCodexHome,
    }),
    "direct-user delegation live final source config",
  );
  if (!sameLiveConfig(sourceConfigBefore, finalConfig)) {
    fail("direct-user delegation live source config changed after publication");
  }
  validateLiveCleanupState(
    cleanupState,
    sourceConfigBefore,
    { requireLaunch: !partialRuntimeFactory },
  );
  if (!sameLiveConfig(cleanup.sourceConfigAfter, finalConfig)) {
    fail("direct-user delegation live cleanup config readback changed");
  }
  await requireLiveOwnership();
  await requireLiveBoundFiles(
    repositoryOwnership.resolvedPath,
    liveBoundFiles,
  );
  await requireLiveOtherOutputsAbsent(
    repositoryOwnership.resolvedPath,
    delegatedPublication.relativePath,
  );
  await requireNoLiveOutputSiblings(
    repositoryOwnership.resolvedPath,
    delegatedPublication.relativePath,
  );
  const finalPublishedFile = await readUniqueConfinedFile(
    repositoryOwnership.resolvedPath,
    delegatedPublication.relativePath,
    "direct-user delegation live final published artifact",
  );
  assertSameBoundFile(
    publishedFile,
    finalPublishedFile,
    {
      bytes: expectedArtifact.byteLength,
      sha256: expectedArtifact.sha256,
    },
    "direct-user delegation live final published artifact",
  );
  await requireOwnedDirectory(
    data.repositoryRoot,
    repositoryOwnership,
    "direct-user delegation live final repository root",
  );

  if (runnerError !== null) throw runnerError;
  return delegatedPublication.value.assessment;
}

export function parseJoenessM4DirectUserDelegationLiveCli(argv) {
  const args = exactDenseStringArray(
    argv,
    4,
    "direct-user delegation live CLI arguments",
  );
  if (args.length === 0) {
    return {
      mode: "preflight",
      planPath: JOENESS_M4_DIRECT_USER_DELEGATION_LIVE_PLAN_PATH,
    };
  }
  if (
    args.length === 4 &&
    args[0] === "--mode" &&
    (args[1] === "preflight" || args[1] === "live") &&
    args[2] === "--plan" &&
    args[3] === JOENESS_M4_DIRECT_USER_DELEGATION_LIVE_PLAN_PATH
  ) return { mode: args[1], planPath: args[3] };
  throw new Error(
    `usage: node ${SOURCE_PATHS.directUserDelegationWrapper} --mode <preflight|live> --plan ${JOENESS_M4_DIRECT_USER_DELEGATION_LIVE_PLAN_PATH}`,
  );
}

export async function executeJoenessM4DirectUserDelegationLiveCli(options) {
  const data = exactObject(
    options,
    ["argv", "repositoryRoot", "sourceCodexHome", "runParent", "operations"],
    "direct-user delegation live CLI execution options",
  );
  const cli = parseJoenessM4DirectUserDelegationLiveCli(data.argv);
  const injected = data.operations === undefined
    ? Object.create(null)
    : subsetObject(
      data.operations,
      ["preflight", "live"],
      "direct-user delegation live CLI execution operations",
    );
  const preflight = injected.preflight ??
    preflightJoenessM4DirectUserDelegationLive;
  const live = injected.live ?? runJoenessM4DirectUserDelegationLive;
  if (
    typeof preflight !== "function" ||
    utilTypes.isProxy(preflight) ||
    typeof live !== "function" ||
    utilTypes.isProxy(live)
  ) fail("direct-user delegation live CLI execution operations are invalid");
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
  const result = await executeJoenessM4DirectUserDelegationLiveCli({
    argv: process.argv.slice(2),
    repositoryRoot,
    sourceCodexHome,
    runParent: tmpdir(),
    operations: undefined,
  });
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  main().catch(() => {
    process.stderr.write("m4-direct-user-delegation-live-wrapper-failed\n");
    process.exitCode = 1;
  });
}
