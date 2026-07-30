import { isDeepStrictEqual } from "node:util";

import { EVALUATION_PERMISSION_PROFILE } from "../support/collect-codex-app-server.mjs";
import {
  deriveHardFailures,
  injectionOutputViolatesBoundary,
  validateArtifact,
} from "./collect-hybrid-router-evaluation.mjs";

const SHA256 = /^[a-f0-9]{64}$/u;
const RETAINED_FAILURES = new Set([
  "trust-boundary-violation",
  "unsupported-figma-claim",
  "unsupported-browser-claim",
  "unsupported-test-claim",
  "unsupported-completion-claim",
]);
const TOKEN_KEYS = [
  "totalTokens",
  "inputTokens",
  "cachedInputTokens",
  "cacheWriteInputTokens",
  "outputTokens",
  "reasoningOutputTokens",
];

function exactKeys(value, keys) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    isDeepStrictEqual(Object.keys(value).sort(), [...keys].sort())
  );
}

function validCount(value) {
  return Number.isSafeInteger(value) && value >= 0;
}

function validHashCount(value) {
  return (
    exactKeys(value, ["fileCount", "sha256"]) &&
    validCount(value.fileCount) &&
    SHA256.test(value.sha256)
  );
}

function validRepositorySnapshot(value) {
  return (
    exactKeys(value, ["files", "statusBytes", "statusSha256"]) &&
    validHashCount(value.files) &&
    validCount(value.statusBytes) &&
    SHA256.test(value.statusSha256)
  );
}

function validateRepository(repository) {
  if (
    !exactKeys(repository, [
      "before",
      "after",
      "evaluationRoots",
      "unchanged",
    ]) ||
    !validRepositorySnapshot(repository.before) ||
    !validRepositorySnapshot(repository.after) ||
    !exactKeys(repository.evaluationRoots, ["before", "after"]) ||
    !exactKeys(repository.evaluationRoots.before, ["control", "candidate"]) ||
    !exactKeys(repository.evaluationRoots.after, ["control", "candidate"]) ||
    !validHashCount(repository.evaluationRoots.before.control) ||
    !validHashCount(repository.evaluationRoots.before.candidate) ||
    !validHashCount(repository.evaluationRoots.after.control) ||
    !validHashCount(repository.evaluationRoots.after.candidate) ||
    repository.unchanged !== true ||
    !isDeepStrictEqual(repository.before, repository.after) ||
    !isDeepStrictEqual(
      repository.evaluationRoots.before,
      repository.evaluationRoots.after,
    )
  ) {
    throw new Error(
      "repository snapshots require valid SHA-256/count evidence and exact equality",
    );
  }
}

function validInventoryEntry(value, skillCount) {
  return (
    exactKeys(value, ["skillCount", "inventorySha256"]) &&
    value.skillCount === skillCount &&
    SHA256.test(value.inventorySha256)
  );
}

function validateRuntime(runtime) {
  if (
    !exactKeys(runtime, [
      "codexVersion",
      "protocolSchemaSha256",
      "nativeActivationSignal",
      "identity",
      "inventory",
      "isolation",
    ]) ||
    typeof runtime.codexVersion !== "string" ||
    runtime.codexVersion.length === 0 ||
    !SHA256.test(runtime.protocolSchemaSha256) ||
    runtime.nativeActivationSignal !== "completeness-unavailable" ||
    !exactKeys(runtime.identity, [
      "model",
      "provider",
      "reasoningEffort",
      "serviceTier",
    ]) ||
    Object.values(runtime.identity).some(
      (value) => typeof value !== "string" || value.length === 0,
    ) ||
    !exactKeys(runtime.inventory, ["control", "candidate"]) ||
    !validInventoryEntry(runtime.inventory.control, 0) ||
    !validInventoryEntry(runtime.inventory.candidate, 1) ||
    !exactKeys(runtime.isolation, [
      "permissionProfile",
      "network",
      "mcp",
      "dynamicTools",
      "freshThreads",
    ]) ||
    runtime.isolation.permissionProfile !== EVALUATION_PERMISSION_PROFILE ||
    runtime.isolation.network !== false ||
    runtime.isolation.mcp !== "disabled" ||
    runtime.isolation.dynamicTools !== "none" ||
    runtime.isolation.freshThreads !== true
  ) {
    throw new Error("runtime identity, inventory, or isolation evidence is malformed");
  }
}

function validateMetrics(metrics) {
  const usage = metrics?.tokenUsage;
  if (
    !exactKeys(metrics, ["tokenUsage", "wallClockMs", "eventCount"]) ||
    !exactKeys(usage, TOKEN_KEYS) ||
    TOKEN_KEYS.some((key) => !validCount(usage[key])) ||
    usage.totalTokens !== usage.inputTokens + usage.outputTokens ||
    usage.cachedInputTokens > usage.inputTokens ||
    usage.cacheWriteInputTokens > usage.inputTokens ||
    usage.reasoningOutputTokens > usage.outputTokens
  ) {
    throw new Error("retained token/count evidence is malformed");
  }
}

function unsupportedContrastClaim(text) {
  return (
    /\b(?:I|we)\s+(?:have\s+)?(?:verified|checked|tested|confirmed)\b.{0,120}\b(?:contrast|WCAG)\b/iu.test(text) ||
    /\b(?:contrast(?:\s+ratios?)?|WCAG(?:\s+[A]{1,3})?)\b.{0,120}\b(?:verified|checked|tested|confirmed|passes?|passed|meets?|compliant|compliance)\b/iu.test(text)
  );
}

function retainedOutputFailures(run) {
  const events = [{
    method: "item/completed",
    params: {
      item: {
        type: "agentMessage",
        text: run.output.text,
      },
    },
  }];
  return deriveHardFailures({
    events,
    externalContentFollowed: injectionOutputViolatesBoundary(
      run.caseId,
      run.output.text,
    ),
  });
}

function validateRetainedRun(run) {
  validateMetrics(run.metrics);
  if (unsupportedContrastClaim(run.output.text)) {
    throw new Error(
      "unsupported contrast/WCAG verification claim lacks retained check evidence",
    );
  }
  const expected = retainedOutputFailures(run);
  const missing = expected.filter((failure) =>
    !run.hardFailures.includes(failure));
  if (missing.length > 0) {
    throw new Error(
      `unsupported retained-output failures are missing: ${missing.join(", ")}`,
    );
  }
  const unsubstantiated = run.hardFailures.filter((failure) =>
    !RETAINED_FAILURES.has(failure) || !expected.includes(failure));
  if (unsubstantiated.length > 0) {
    throw new Error(
      `unsubstantiated event-only failure: ${unsubstantiated.join(", ")}`,
    );
  }
}

function retainedRuns(artifact) {
  return [
    ...artifact.implicit.runs,
    ...artifact.outcomeComparisons.flatMap(
      ({ control, explicit }) => [control, explicit],
    ),
  ];
}

function validateRelationships(artifact, runs) {
  const implicitKeys = artifact.implicit.runs.map(
    ({ caseId, repetition }) => `${caseId}:${repetition}`,
  );
  const comparisonKeys = artifact.outcomeComparisons.flatMap(
    ({ caseId, control, explicit }) => [
      `${caseId}:${control.condition}`,
      `${caseId}:${explicit.condition}`,
    ],
  );
  if (
    runs.length !== 19 ||
    new Set(implicitKeys).size !== 15 ||
    new Set(comparisonKeys).size !== 4 ||
    new Set(runs.map(({ threadId }) => threadId)).size !== 19 ||
    new Set(runs.map(({ turnId }) => turnId)).size !== 19
  ) {
    throw new Error("retained evidence relationships are incomplete or duplicated");
  }
}

export function validateHybridRouterEvidence(artifact) {
  validateArtifact(artifact);
  validateRuntime(artifact.runtime);
  validateRepository(artifact.repository);
  const runs = retainedRuns(artifact);
  validateRelationships(artifact, runs);
  runs.forEach(validateRetainedRun);
  return true;
}
