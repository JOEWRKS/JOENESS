import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { validateResult } from "./collect-codex-app-server.mjs";
import { claimsAutonomousTestExecution } from "./run-common-core-coding-ab.mjs";

const MODULE_PATH = fileURLToPath(import.meta.url);

const METRIC_KEYS = [
  "inputTokens",
  "cachedInputTokens",
  "outputTokens",
  "reasoningOutputTokens",
  "totalTokens",
  "wallClockMs",
];
const CODING_INTEGRITY_KEYS = [
  "instructionUnchanged",
  "changedPathsAllowed",
  "protectedPathsUnchanged",
  "noSymlinks",
  "workspaceContained",
  "safeImplementationFiles",
  "patchOnlyToolSurface",
  "claimIntegrity",
  "gitMetadataUnchanged",
  "fixtureHeadUnchanged",
  "fullTreeDiffMatchesGit",
];
const CODING_CHECK_KEYS = [
  "sourceClean",
  "sourceBound",
  "candidateHashMatch",
  "allCasesCompleted",
  "allBaselineTestsFail",
  "allVisibleTestsPass",
  "allHiddenTestsPass",
  "noSymlinks",
  "outputWithinLimits",
  "safeImplementationFiles",
  "patchOnlyToolSurface",
  "claimIntegrity",
  "gitMetadataUnchanged",
  "fixtureHeadUnchanged",
  "fullTreeDiffMatchesGit",
  "noUserConfigPluginsOrSkills",
  "credentialPathOutsideWorkspace",
  "identityHomeEmpty",
  "shellEnvPolicy",
];
const CODING_COMPARABILITY_CHECK_KEYS = CODING_CHECK_KEYS.filter(
  (key) => !["allVisibleTestsPass", "allHiddenTestsPass"].includes(key),
);

function fail(message) {
  throw new Error(`invalid A/B evidence: ${message}`);
}

function object(value, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    fail(`${label} must be an object`);
  }
  return value;
}

function array(value, label) {
  if (!Array.isArray(value)) fail(`${label} must be an array`);
  return value;
}

function own(value, key, label) {
  if (!Object.hasOwn(value, key)) fail(`${label}.${key} is required`);
  return value[key];
}

function exact(value, expected, label) {
  if (value !== expected) {
    fail(`${label} must be ${JSON.stringify(expected)}, got ${JSON.stringify(value)}`);
  }
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function assertSha(value, label) {
  if (!/^[0-9a-f]{64}$/u.test(value)) fail(`${label} must be a lowercase SHA-256`);
}

function assertRecordedOrder(artifacts, label) {
  let previous = -Infinity;
  for (const [index, artifact] of artifacts.entries()) {
    const value = artifact.recordedAt;
    const milliseconds = Date.parse(value);
    if (
      typeof value !== "string" ||
      !Number.isFinite(milliseconds) ||
      new Date(milliseconds).toISOString() !== value
    ) {
      fail(`${label}[${index}].recordedAt must be canonical ISO-8601`);
    }
    if (milliseconds <= previous) {
      fail(`${label} recordedAt values must be strictly increasing`);
    }
    previous = milliseconds;
  }
}

function policyRunId(mode) {
  if (mode === "run-control-ab-v8") return "no-harness-control-ab-v8";
  if (!/^run-core-v[12]-ab-v8-r[1-4]$/u.test(mode)) {
    fail(`unsupported policy mode ${JSON.stringify(mode)}`);
  }
  return mode.replace(/^run-core-/u, "common-core-");
}

function assertCodingMode(mode) {
  if (!/^run-v[12]-coding-ab-r[12]$/u.test(mode)) {
    fail(`unsupported coding mode ${JSON.stringify(mode)}`);
  }
  return mode;
}

function armIdentity(mode, kind) {
  const expression =
    kind === "policy"
      ? /^run-core-(v[12])-ab-v8-r([1-4])$/u
      : /^run-(v[12])-coding-ab-r([12])$/u;
  const match = mode.match(expression);
  if (!match) fail(`invalid ${kind} arm ${JSON.stringify(mode)}`);
  return { version: match[1], repetition: Number(match[2]) };
}

function assertExactArtifactOrder(
  artifacts,
  modes,
  toExpectedId,
  getActualId,
  label,
) {
  if (artifacts.length !== modes.length) {
    fail(`${label} artifact set must contain exactly ${modes.length} artifacts`);
  }
  const expected = modes.map(toExpectedId);
  const actual = artifacts.map(getActualId);
  if (canonical(actual) !== canonical(expected)) {
    fail(`${label} artifact order must be ${expected.join(", ")}`);
  }
}

function metricObject(value, label) {
  object(value, label);
  const result = {};
  for (const key of METRIC_KEYS) {
    const item = own(value, key, label);
    if (item !== null && (!Number.isFinite(item) || item < 0)) {
      fail(`${label}.${key} must be null or a non-negative finite number`);
    }
    result[key] = item;
  }
  return result;
}

function sum(values) {
  return values.some((value) => value === null)
    ? null
    : values.reduce((total, value) => total + value, 0);
}

function median(values) {
  if (values.some((value) => value === null)) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function aggregateMetricObjects(items) {
  return Object.fromEntries(
    METRIC_KEYS.map((key) => [key, sum(items.map((item) => item[key]))]),
  );
}

function medianMetricObjects(items) {
  return Object.fromEntries(
    METRIC_KEYS.map((key) => [key, median(items.map((item) => item[key]))]),
  );
}

function percentDelta(baseline, candidate) {
  if (baseline === null || candidate === null || baseline === 0) return null;
  return ((candidate - baseline) / baseline) * 100;
}

function percentReduction(baseline, candidate) {
  const delta = percentDelta(baseline, candidate);
  if (delta === null) return null;
  return delta === 0 ? 0 : -delta;
}

function delta(left, right) {
  return left === null || right === null ? null : right - left;
}

function assertRuntime(experiment, artifact, kind, index) {
  if (kind === "policy") {
    const runtime = object(artifact.evidence.runtime, `policy[${index}].evidence.runtime`);
    exact(runtime.version, experiment.runtime.appServer, `policy[${index}] runtime version`);
    for (const [caseIndex, item] of artifact.evidence.cases.entries()) {
      const thread = object(item.thread, `policy[${index}].cases[${caseIndex}].thread`);
      exact(thread.model, experiment.runtime.model, `policy[${index}] model`);
      exact(
        thread.reasoningEffort,
        experiment.runtime.reasoningEffort,
        `policy[${index}] reasoning effort`,
      );
      exact(
        thread.serviceTier,
        experiment.runtime.serviceTier,
        `policy[${index}] service tier`,
      );
    }
    return;
  }
  const runtime = object(artifact.runtime, `coding[${index}].runtime`);
  exact(runtime.codexVersion, experiment.runtime.appServer, `coding[${index}] runtime version`);
  exact(runtime.model, experiment.runtime.model, `coding[${index}] model`);
  exact(
    runtime.reasoningEffort,
    experiment.runtime.reasoningEffort,
    `coding[${index}] reasoning effort`,
  );
  exact(runtime.serviceTier, experiment.runtime.serviceTier, `coding[${index}] service tier`);
  exact(
    runtime.executionSurface,
    "patch-only-no-shell",
    `coding[${index}] execution surface`,
  );
  exact(runtime.shellTool, false, `coding[${index}] shell tool`);
  exact(
    runtime.patchToolEvidence,
    "jsonl-file-change-hard-gate",
    `coding[${index}] patch tool evidence`,
  );
}

function assertPolicyReview(artifact, caseIds, index) {
  const review = object(artifact.review, `policy[${index}].review`);
  exact(review.status, "complete", `policy[${index}] review status`);
  if (review.capabilityVerdict !== "pass") {
    fail(`policy[${index}] review capability must pass`);
  }
  const judgments = array(
    review.caseJudgments,
    `policy[${index}].review.caseJudgments`,
  );
  if (judgments.length !== caseIds.length) {
    fail(`policy[${index}] review must cover every case`);
  }
  judgments.forEach((judgment, caseIndex) => {
    object(judgment, `policy[${index}].review.caseJudgments[${caseIndex}]`);
    exact(
      judgment.id,
      caseIds[caseIndex],
      `policy[${index}] review case id`,
    );
    if (!["pass", "fail"].includes(judgment.judgment)) {
      fail(`policy[${index}] review judgment must be pass or fail`);
    }
    if (
      !Array.isArray(judgment.reasons) ||
      judgment.reasons.length === 0 ||
      !Array.isArray(judgment.references) ||
      judgment.references.length === 0
    ) {
      fail(`policy[${index}] review judgment must include reasons and references`);
    }
  });
  return judgments;
}

function assertCandidateReference(reference, candidate, label) {
  object(reference, label);
  if (
    reference.sourcePath !== candidate.source ||
    reference.byteLength !== candidate.byteLength ||
    reference.sha256 !== candidate.sha256
  ) {
    fail(`${label} candidate SHA, source, or byte length drifted`);
  }
}

function assertSameSource(artifacts, getSource, label) {
  const [first, ...rest] = artifacts.map(getSource);
  if (!first.head || typeof first.head !== "string") fail(`${label} fixed HEAD is missing`);
  for (const [index, source] of rest.entries()) {
    if (source.head !== first.head) fail(`${label} fixed HEAD drift at artifact ${index + 1}`);
  }
  return first.head;
}

function policySourceIdentity(source, label) {
  object(source, label);
  if (!Array.isArray(source.status) || source.status.length !== 0) {
    fail(`${label} must record a clean source status`);
  }
  const snapshot = source.workingFiles?.sha256;
  assertSha(snapshot, `${label}.workingFiles.sha256`);
  if (source.gitBlobs) {
    for (const [name, hashes] of Object.entries(source.gitBlobs)) {
      if (hashes.workingGitHash !== hashes.headGitHash) {
        fail(`${label}.gitBlobs[${JSON.stringify(name)}] is not HEAD-bound`);
      }
    }
  }
  return source.gitBlobs && source.sha256
    ? canonical({ gitBlobs: source.gitBlobs, sha256: source.sha256 })
    : canonical({ workingFilesSha256: snapshot });
}

function codingSourceIdentity(source, label, experiment, sourceBlobSha256) {
  object(source, label);
  const runner = object(source.runner, `${label}.runner`);
  const cases = object(source.cases, `${label}.cases`);
  assertSha(runner.sha256, `${label}.runner.sha256`);
  assertSha(cases.sha256, `${label}.cases.sha256`);
  if (experiment.runtime.codingRunner) {
    exact(runner.path, experiment.runtime.codingRunner, `${label}.runner.path`);
  }
  if (experiment.runtime.codingCases) {
    exact(cases.path, experiment.runtime.codingCases, `${label}.cases.path`);
  }
  if (sourceBlobSha256) {
    exact(runner.sha256, sourceBlobSha256.runner, `${label}.runner Git blob SHA`);
    exact(cases.sha256, sourceBlobSha256.cases, `${label}.cases Git blob SHA`);
  }
  return canonical({
    objectFormat: source.objectFormat,
    runner,
    cases,
  });
}

function assertSourceIdentities(values, label) {
  if (new Set(values).size !== 1) fail(`${label} verified source identity drifted`);
}

function gate(pass, actual, expected, operator) {
  return { pass: Boolean(pass), actual, expected, operator };
}

function isCodingCasePass(item) {
  const visible = object(item.tests?.visible, "coding visible test");
  const hidden = object(item.tests?.hidden, "coding hidden test");
  const process = object(item.process, "coding process");
  const changedPaths = array(item.changedPaths, "coding changed paths");
  const integrity = object(item.integrity, "coding integrity");
  for (const key of CODING_INTEGRITY_KEYS) own(integrity, key, "coding integrity");
  return (
    process.exitCode === 0 &&
    changedPaths.length > 0 &&
    visible.exitCode === 0 &&
    hidden.exitCode === 0 &&
    CODING_INTEGRITY_KEYS.every((key) => integrity[key] === true)
  );
}

function validateContract(experiment) {
  object(experiment, "experiment");
  const candidates = object(experiment.candidates, "experiment.candidates");
  for (const version of ["v1", "v2"]) {
    const candidate = object(candidates[version], `experiment.candidates.${version}`);
    assertSha(candidate.sha256, `experiment.candidates.${version}.sha256`);
    if (!Number.isInteger(candidate.byteLength) || candidate.byteLength <= 0) {
      fail(`experiment.candidates.${version}.byteLength must be positive`);
    }
  }
  const policy = object(experiment.policy, "experiment.policy");
  const coding = object(experiment.coding, "experiment.coding");
  const review = object(experiment.review, "experiment.review");
  const audit = object(review.audit, "experiment.review.audit");
  const claimScope = object(experiment.claimScope, "experiment.claimScope");
  const gates = object(experiment.gates, "experiment.gates");
  if (
    typeof experiment.runtime?.evaluator !== "string" ||
    !experiment.runtime.evaluator
  ) {
    fail("experiment runtime evaluator path is required");
  }
  exact(policy.repetitionsPerCandidate, 4, "policy repetitions");
  exact(policy.casesPerArm, 16, "policy case count");
  exact(policy.tieRule, "not-a-v2-win", "policy tie rule");
  exact(policy.nullRule, "block", "policy null rule");
  exact(policy.outlierRemoval, "forbidden", "policy outlier removal");
  if (policy.arms.length !== 8) fail("policy contract must declare exactly 8 Core arms");
  exact(coding.repetitionsPerCandidate, 2, "coding repetitions");
  exact(
    coding.executionSurface,
    "patch-only-no-shell",
    "coding execution surface",
  );
  exact(
    coding.patchEvidence,
    "jsonl-file-change-hard-gate",
    "coding patch evidence",
  );
  exact(coding.outlierRemoval, "forbidden", "coding outlier removal");
  if (coding.arms.length !== 4 || coding.cases.length !== 3) {
    fail("coding contract must declare 4 arms containing exactly 12 case records");
  }
  exact(review.primary, "blind-all-policy-cases", "primary review mode");
  exact(audit.schemaVersion, 1, "review audit schema version");
  if (typeof audit.artifactId !== "string" || !audit.artifactId) {
    fail("review audit artifact id is required");
  }
  if (typeof audit.artifactPath !== "string" || !audit.artifactPath) {
    fail("review audit artifact path is required");
  }
  exact(
    audit.selection,
    "case-index-0-5-10-15-each-arm",
    "review audit selection",
  );
  if (canonical(audit.caseIndexes) !== canonical([0, 5, 10, 15])) {
    fail("review audit case indexes must be 0, 5, 10, and 15");
  }
  exact(audit.minimumRawAgreementPercent, 100, "review audit agreement gate");
  exact(review.unresolvedDisagreements, 0, "unresolved review disagreements");
  exact(
    claimScope.realCodeImplementation,
    "measured-three-small-patch-only-cases",
    "real code implementation claim scope",
  );
  exact(
    claimScope.autonomousTestIteration,
    "not-measured",
    "autonomous test iteration claim scope",
  );
  exact(
    claimScope.codingExecutionSurface,
    "patch-only-no-shell",
    "coding execution surface claim scope",
  );
  exact(
    claimScope.frontendFunctionalResponsiveAccessibility,
    "measured-static-contract-and-menu-logic",
    "frontend functional claim scope",
  );
  exact(
    claimScope.visualFidelityAndFigmaQuality,
    "not-measured",
    "visual fidelity and Figma claim scope",
  );
  exact(
    claimScope.statisticalGeneralization,
    "not-claimed",
    "statistical generalization claim scope",
  );
  exact(
    gates.tokenEfficiency.policyCaseCount,
    policy.casesPerArm,
    "policy gate case count",
  );
  exact(
    gates.tokenEfficiency.policyRepetitionCount,
    policy.repetitionsPerCandidate,
    "policy gate repetition count",
  );
  exact(
    gates.quality.policyV2Passes,
    policy.casesPerArm * policy.repetitionsPerCandidate,
    "policy v2 pass gate",
  );
  exact(
    gates.quality.codingV2Passes,
    coding.cases.length * coding.repetitionsPerCandidate,
    "coding v2 pass gate",
  );
}

function evaluateReviewAudit(experiment, policyArtifacts, auditArtifact) {
  const contract = experiment.review.audit;
  if (auditArtifact === null || auditArtifact === undefined) {
    return {
      status: "missing",
      comparisonCount: 0,
      agreementCount: 0,
      agreementPercent: null,
      unresolvedDisagreements: null,
      pass: false,
    };
  }
  object(auditArtifact, "review audit artifact");
  exact(
    auditArtifact.schemaVersion,
    contract.schemaVersion,
    "review audit artifact schema version",
  );
  exact(auditArtifact.id, contract.artifactId, "review audit artifact id");
  exact(
    auditArtifact.selection,
    contract.selection,
    "review audit artifact selection",
  );
  assertRecordedOrder([auditArtifact], "review audit artifact");
  const comparisons = array(
    auditArtifact.comparisons,
    "review audit artifact comparisons",
  );
  const expected = policyArtifacts.slice(1).flatMap((artifact) =>
    contract.caseIndexes.map((caseIndex) => ({
      runId: artifact.runId,
      caseId: artifact.review.caseJudgments[caseIndex].id,
      primaryJudgment:
        artifact.review.caseJudgments[caseIndex].judgment,
    })),
  );
  if (comparisons.length !== expected.length) {
    fail(`review audit must contain exactly ${expected.length} comparisons`);
  }
  let agreementCount = 0;
  comparisons.forEach((comparison, index) => {
    object(comparison, `review audit comparison ${index}`);
    exact(
      comparison.runId,
      expected[index].runId,
      `review audit comparison ${index} runId`,
    );
    exact(
      comparison.caseId,
      expected[index].caseId,
      `review audit comparison ${index} caseId`,
    );
    if (comparison.primaryJudgment !== expected[index].primaryJudgment) {
      fail(`audit primary judgment drifted: ${comparison.caseId}`);
    }
    if (!["pass", "fail"].includes(comparison.auditJudgment)) {
      fail(`review audit judgment is invalid: ${comparison.caseId}`);
    }
    if (comparison.auditJudgment === comparison.primaryJudgment) {
      agreementCount += 1;
    }
  });
  const disagreementCount = comparisons.length - agreementCount;
  const agreementPercent = (agreementCount / comparisons.length) * 100;
  exact(
    auditArtifact.agreementPercent,
    agreementPercent,
    "review audit recorded agreement",
  );
  exact(
    auditArtifact.unresolvedDisagreements,
    disagreementCount,
    "review audit unresolved disagreements",
  );
  return {
    status: "complete",
    comparisonCount: comparisons.length,
    agreementCount,
    agreementPercent,
    unresolvedDisagreements: disagreementCount,
    pass:
      agreementPercent >= contract.minimumRawAgreementPercent &&
      disagreementCount <= experiment.review.unresolvedDisagreements,
  };
}

export function validatePolicyRawArtifacts(
  policyArtifacts,
  policyArtifactBytes,
  { sourceResolver } = {},
) {
  array(policyArtifacts, "policyArtifacts");
  if (!(policyArtifactBytes instanceof Map)) {
    fail("raw policy artifact bytes must be provided as a Map");
  }
  if (policyArtifactBytes.size !== policyArtifacts.length) {
    fail("raw policy artifact byte set must exactly match policy artifacts");
  }
  const runIds = new Set(policyArtifacts.map(({ runId }) => runId));
  if (runIds.size !== policyArtifacts.length) {
    fail("raw policy artifacts contain duplicate runIds");
  }
  for (const [index, artifact] of policyArtifacts.entries()) {
    const bytes = policyArtifactBytes.get(artifact.runId);
    if (!Buffer.isBuffer(bytes)) {
      fail(`raw policy artifact bytes are missing: ${artifact.runId}`);
    }
    let parsed;
    try {
      parsed = JSON.parse(bytes.toString("utf8"));
    } catch {
      fail(`raw policy artifact is not valid JSON: ${artifact.runId}`);
    }
    if (canonical(parsed) !== canonical(artifact)) {
      fail(`policy artifact differs from raw bytes: ${artifact.runId}`);
    }
    const condition = artifact.evidence?.evaluation?.condition;
    const baselineRunId = artifact.evidence?.evaluation?.baseline?.runId;
    const baselineBytes =
      condition === "core" ? policyArtifactBytes.get(baselineRunId) : null;
    const options = { baselineBytes };
    if (sourceResolver !== undefined) options.sourceResolver = sourceResolver;
    try {
      validateResult(artifact, options);
    } catch (error) {
      throw new Error(
        `invalid raw policy artifact ${index} (${artifact.runId}): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
  return true;
}

function pathsFromDiff(text) {
  return [...text.matchAll(/^diff --git a\/(.+?) b\/(.+)$/gmu)].map(
    (match) => match[2],
  );
}

function validateFileTree(tree, label) {
  object(tree, label);
  const files = object(tree.files, `${label}.files`);
  let bytes = 0;
  for (const [relative, metadata] of Object.entries(files)) {
    if (
      path.isAbsolute(relative) ||
      relative.includes("\\") ||
      relative.split("/").some((part) => part === "" || part === "." || part === "..")
    ) {
      fail(`${label} contains an unsafe path`);
    }
    object(metadata, `${label}.files[${JSON.stringify(relative)}]`);
    if (!Number.isSafeInteger(metadata.bytes) || metadata.bytes < 0) {
      fail(`${label} contains an invalid byte count`);
    }
    assertSha(metadata.sha256, `${label} file SHA`);
    bytes += metadata.bytes;
  }
  const serialized = JSON.stringify(
    Object.fromEntries(
      Object.entries(files).sort(([left], [right]) =>
        left.localeCompare(right),
      ),
    ),
  );
  if (tree.bytes !== bytes || tree.sha256 !== sha256(serialized)) {
    fail(`${label} aggregate does not match raw file entries`);
  }
  return files;
}

function changedFileTreePaths(before, after) {
  const paths = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...paths]
    .filter(
      (relative) =>
        canonical(before[relative] ?? null) !==
        canonical(after[relative] ?? null),
    )
    .sort();
}

export function validateCodingRawArtifacts(
  codingArtifacts,
  codingArtifactBytes,
  catalog,
) {
  array(codingArtifacts, "codingArtifacts");
  if (!(codingArtifactBytes instanceof Map)) {
    fail("raw coding artifact bytes must be provided as a Map");
  }
  if (codingArtifactBytes.size !== codingArtifacts.length) {
    fail("raw coding artifact byte set must exactly match coding artifacts");
  }
  const definitions = new Map(
    array(catalog?.cases, "coding case catalog").map((item) => [
      item.id,
      item,
    ]),
  );
  for (const artifact of codingArtifacts) {
    const bytes = codingArtifactBytes.get(artifact.id);
    if (!Buffer.isBuffer(bytes)) {
      fail(`raw coding artifact bytes are missing: ${artifact.id}`);
    }
    let parsed;
    try {
      parsed = JSON.parse(bytes.toString("utf8"));
    } catch {
      fail(`raw coding artifact is not valid JSON: ${artifact.id}`);
    }
    if (canonical(parsed) !== canonical(artifact)) {
      fail(`coding artifact differs from raw bytes: ${artifact.id}`);
    }
    const cases = array(artifact.cases, `coding raw ${artifact.id} cases`);
    if (
      canonical(cases.map(({ caseId }) => caseId)) !==
      canonical([...definitions.keys()])
    ) {
      fail(`coding raw ${artifact.id} case set drifted`);
    }
    const computedChecks = {
      sourceClean: artifact.source?.clean === true,
      sourceBound:
        typeof artifact.source?.runner?.sha256 === "string" &&
        typeof artifact.source?.cases?.sha256 === "string",
      candidateHashMatch:
        artifact.candidate?.expectedSha256 ===
        artifact.candidate?.actualSha256,
      allCasesCompleted: cases.length === definitions.size,
      allBaselineTestsFail: true,
      allVisibleTestsPass: true,
      allHiddenTestsPass: true,
      noSymlinks: true,
      safeImplementationFiles: true,
      patchOnlyToolSurface: true,
      claimIntegrity: true,
      gitMetadataUnchanged: true,
      fixtureHeadUnchanged: true,
      fullTreeDiffMatchesGit: true,
      outputWithinLimits: true,
      noUserConfigPluginsOrSkills: true,
      credentialPathOutsideWorkspace: true,
      identityHomeEmpty: true,
      shellEnvPolicy: true,
    };
    const numericMetricKeys = new Set();
    for (const [caseIndex, item] of cases.entries()) {
      const label = `coding case ${artifact.id}/${item.caseId}`;
      const definition = definitions.get(item.caseId);
      object(definition, `${label} definition`);
      const allowed = array(
        definition.allowedChangedPaths,
        `${label} allowed paths`,
      );
      const protectedPaths = array(
        definition.protectedPaths,
        `${label} protected paths`,
      );
      const changedPaths = array(item.changedPaths, `${label} changed paths`);
      const diff = object(item.diff, `${label} diff`);
      const diffBytes = Buffer.from(diff.text ?? "", "utf8");
      const diffPaths = pathsFromDiff(diff.text ?? "");
      const pathsValid =
        changedPaths.length > 0 &&
        new Set(changedPaths).size === changedPaths.length &&
        canonical([...changedPaths].sort()) ===
          canonical([...diffPaths].sort()) &&
        changedPaths.every((relative) => allowed.includes(relative)) &&
        changedPaths.every((relative) => !protectedPaths.includes(relative));
      if (
        diff.truncated !== false ||
        diff.bytes !== diffBytes.length ||
        diff.sha256 !== sha256(diffBytes) ||
        !pathsValid
      ) {
        fail(`${label} diff or changed-path evidence is invalid`);
      }
      const baseline = object(item.baseline, `${label} baseline`);
      const baselineDiff = object(
        baseline.diff,
        `${label} baseline diff`,
      );
      const baselineFailed =
        Array.isArray(baseline.changedPaths) &&
        baseline.changedPaths.length === 0 &&
        baselineDiff.text === "" &&
        baselineDiff.bytes === 0 &&
        baselineDiff.sha256 === sha256("") &&
        baselineDiff.truncated === false &&
        baseline.visible?.exitCode !== 0 &&
        baseline.hidden?.exitCode !== 0;
      const processPassed = item.process?.exitCode === 0;
      const processEvidence = object(item.process, `${label} process`);
      const itemTypes = array(
        processEvidence.itemTypes,
        `${label} process item types`,
      );
      const fileChangePaths = array(
        processEvidence.fileChangePaths,
        `${label} process file-change paths`,
      );
      const patchOnlyToolSurface =
        itemTypes.includes("file_change") &&
        itemTypes.every((type) =>
          ["reasoning", "agent_message", "todo_list", "file_change"].includes(
            type,
          ),
        ) &&
        canonical([...fileChangePaths].sort()) ===
          canonical([...changedPaths].sort());
      const baselineFiles = validateFileTree(
        baseline.fileTree,
        `${label} baseline file tree`,
      );
      const currentFiles = validateFileTree(
        item.fileTree,
        `${label} file tree`,
      );
      const treeChangedPaths = changedFileTreePaths(
        baselineFiles,
        currentFiles,
      );
      const gitEvidence = object(item.git, `${label} Git evidence`);
      validateFileTree(
        baseline.gitMetadata,
        `${label} baseline Git metadata`,
      );
      validateFileTree(
        gitEvidence.metadata,
        `${label} Git metadata`,
      );
      assertSha(
        baseline.gitMetadataSha256,
        `${label} baseline Git metadata SHA`,
      );
      assertSha(
        gitEvidence.metadataSha256,
        `${label} Git metadata SHA`,
      );
      if (
        baseline.gitMetadata.sha256 !== baseline.gitMetadataSha256 ||
        gitEvidence.metadata.sha256 !== gitEvidence.metadataSha256
      ) {
        fail(`${label} Git metadata summary drifted`);
      }
      for (const [name, value] of [
        ["baseline HEAD", baseline.gitHead],
        ["baseline tree", baseline.gitTree],
        ["current HEAD", gitEvidence.head],
        ["current tree", gitEvidence.tree],
      ]) {
        if (!/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/u.test(value)) {
          fail(`${label} ${name} is invalid`);
        }
      }
      const gitMetadataUnchanged =
        baseline.gitMetadataSha256 === gitEvidence.metadataSha256;
      const fixtureHeadUnchanged =
        baseline.gitHead === gitEvidence.head &&
        baseline.gitTree === gitEvidence.tree;
      const fullTreeDiffMatchesGit =
        canonical(treeChangedPaths) ===
        canonical([...changedPaths].sort());
      const claimIntegrity = !claimsAutonomousTestExecution(
        item.finalMessage,
      );
      const visiblePassed = item.tests?.visible?.exitCode === 0;
      const hiddenPassed = item.tests?.hidden?.exitCode === 0;
      const integrity = object(item.integrity, `${label} integrity`);
      const recomputedIntegrity = {
        instructionUnchanged: !changedPaths.includes("AGENTS.md"),
        changedPathsAllowed: changedPaths.every((relative) =>
          allowed.includes(relative),
        ),
        protectedPathsUnchanged: changedPaths.every(
          (relative) => !protectedPaths.includes(relative),
        ),
        safeImplementationFiles: pathsValid,
        patchOnlyToolSurface,
        claimIntegrity,
        gitMetadataUnchanged,
        fixtureHeadUnchanged,
        fullTreeDiffMatchesGit,
      };
      for (const [key, value] of Object.entries(recomputedIntegrity)) {
        if (integrity[key] !== value) {
          fail(`${label} integrity ${key} does not match raw evidence`);
        }
      }
      for (const key of [
        "noSymlinks",
        "workspaceContained",
        "noUserConfigPluginsOrSkills",
        "credentialPathOutsideWorkspace",
        "identityHomeEmpty",
      ]) {
        if (integrity[key] !== true) {
          fail(`${label} integrity ${key} failed`);
        }
      }
      if (
        integrity.shellEnvPolicy !==
        'inherit="core",ignore_default_excludes=false'
      ) {
        fail(`${label} shell environment policy drifted`);
      }
      const outputWithinLimits =
        Number.isFinite(item.metrics?.finalOutputBytes) &&
        item.metrics.finalOutputBytes <= 64 * 1024 &&
        Buffer.byteLength(item.process?.stderr ?? "") <= 2 * 1024 * 1024 &&
        Buffer.byteLength(item.tests?.visible?.stdout ?? "") <=
          2 * 1024 * 1024 &&
        Buffer.byteLength(item.tests?.visible?.stderr ?? "") <=
          2 * 1024 * 1024 &&
        Buffer.byteLength(item.tests?.hidden?.stdout ?? "") <=
          2 * 1024 * 1024 &&
        Buffer.byteLength(item.tests?.hidden?.stderr ?? "") <=
          2 * 1024 * 1024 &&
        Number.isFinite(item.workspaceSize?.files) &&
        item.workspaceSize.files <= 128 &&
        Number.isFinite(item.workspaceSize?.bytes) &&
        item.workspaceSize.bytes <= 1024 * 1024;
      computedChecks.allBaselineTestsFail &&= baselineFailed;
      computedChecks.allVisibleTestsPass &&= visiblePassed && processPassed;
      computedChecks.allHiddenTestsPass &&= hiddenPassed && processPassed;
      computedChecks.noSymlinks &&= integrity.noSymlinks;
      computedChecks.safeImplementationFiles &&= pathsValid;
      computedChecks.patchOnlyToolSurface &&= patchOnlyToolSurface;
      computedChecks.claimIntegrity &&= claimIntegrity;
      computedChecks.gitMetadataUnchanged &&= gitMetadataUnchanged;
      computedChecks.fixtureHeadUnchanged &&= fixtureHeadUnchanged;
      computedChecks.fullTreeDiffMatchesGit &&= fullTreeDiffMatchesGit;
      computedChecks.outputWithinLimits &&= outputWithinLimits;
      computedChecks.noUserConfigPluginsOrSkills &&=
        integrity.noUserConfigPluginsOrSkills;
      computedChecks.credentialPathOutsideWorkspace &&=
        integrity.credentialPathOutsideWorkspace;
      computedChecks.identityHomeEmpty &&= integrity.identityHomeEmpty;
      computedChecks.shellEnvPolicy &&=
        integrity.shellEnvPolicy ===
        'inherit="core",ignore_default_excludes=false';
      for (const [key, value] of Object.entries(item.metrics ?? {})) {
        if (Number.isFinite(value)) numericMetricKeys.add(key);
      }
    }
    const expectedTotals = Object.fromEntries(
      [...numericMetricKeys].map((key) => [
        key,
        cases.reduce((total, item) => total + item.metrics[key], 0),
      ]),
    );
    if (canonical(artifact.totals) !== canonical(expectedTotals)) {
      fail(`coding raw ${artifact.id} totals do not match case metrics`);
    }
    for (const [key, expected] of Object.entries(computedChecks)) {
      if (artifact.checks?.[key] !== expected) {
        fail(`coding check ${artifact.id}.${key} does not match raw evidence`);
      }
    }
    if (
      artifact.runtime?.ignoreUserConfig !== true ||
      artifact.runtime?.ignoreRules !== true ||
      artifact.runtime?.executionSurface !== "patch-only-no-shell" ||
      artifact.runtime?.shellTool !== false ||
      artifact.runtime?.patchToolEvidence !==
        "jsonl-file-change-hard-gate" ||
      !Array.isArray(artifact.runtime?.disabledFeatures) ||
      !artifact.runtime.disabledFeatures.includes("shell_tool") ||
      !artifact.runtime.disabledFeatures.includes("unified_exec") ||
      artifact.runtime?.shellEnvPolicy !==
        'inherit="core",ignore_default_excludes=false'
    ) {
      fail(`coding raw ${artifact.id} tool-surface isolation drifted`);
    }
  }
  return true;
}

export function validateAbExperiment(
  experiment,
  artifacts,
  options = {},
) {
  validatePolicyRawArtifacts(
    artifacts?.policyArtifacts,
    options.policyArtifactBytes,
    { sourceResolver: options.policySourceResolver },
  );
  validateCodingRawArtifacts(
    artifacts?.codingArtifacts,
    options.codingArtifactBytes,
    options.codingCaseCatalog,
  );
  if (artifacts?.auditArtifact !== null && artifacts?.auditArtifact !== undefined) {
    if (!Buffer.isBuffer(options.auditArtifactBytes)) {
      fail("raw review audit artifact bytes are required");
    }
    let parsed;
    try {
      parsed = JSON.parse(options.auditArtifactBytes.toString("utf8"));
    } catch {
      fail("raw review audit artifact is not valid JSON");
    }
    if (canonical(parsed) !== canonical(artifacts.auditArtifact)) {
      fail("review audit artifact differs from raw bytes");
    }
  }
  return evaluateValidatedAbExperiment(experiment, artifacts, options);
}

export function evaluateValidatedAbExperiment(
  experiment,
  { policyArtifacts, codingArtifacts, auditArtifact = null },
  options = {},
) {
  validateContract(experiment);
  array(policyArtifacts, "policyArtifacts");
  array(codingArtifacts, "codingArtifacts");

  const policyModes = [experiment.policy.controlMode, ...experiment.policy.arms];
  assertExactArtifactOrder(
    policyArtifacts,
    policyModes,
    policyRunId,
    (artifact) => artifact.runId,
    "policy",
  );
  assertExactArtifactOrder(
    codingArtifacts,
    experiment.coding.arms,
    assertCodingMode,
    (artifact) => artifact.id,
    "coding",
  );
  assertRecordedOrder(policyArtifacts, "policy artifacts");
  assertRecordedOrder(codingArtifacts, "coding artifacts");

  const controlHead = object(
    policyArtifacts[0].evidence.source,
    "policy Control source",
  ).head;
  if (!controlHead || typeof controlHead !== "string") {
    fail("policy Control HEAD is missing");
  }
  const policyHead = assertSameSource(
    policyArtifacts.slice(1),
    (artifact) => object(artifact.evidence, "policy evidence").source,
    "policy Core",
  );
  const codingHead = assertSameSource(
    codingArtifacts,
    (artifact) => artifact.source,
    "coding",
  );
  if (policyHead !== codingHead) fail("fixed HEAD differs between policy and coding evidence");

  const policySourceIdentities = [];
  const codingSourceIdentities = [];
  const rawControl = [];
  const rawPolicy = [];
  const rawCoding = [];
  const policyCaseIds = policyArtifacts[0].evidence.cases.map(({ id }) => id);
  if (
    policyCaseIds.length !== experiment.policy.casesPerArm ||
    new Set(policyCaseIds).size !== policyCaseIds.length
  ) {
    fail("policy Control must contain 16 unique cases");
  }

  let evidenceLimitationCount = 0;
  let unexpectedChangeCount = 0;
  let sessionFatalCount = 0;
  let policyV2Passes = 0;
  let metricsComplete = true;

  policyArtifacts.forEach((artifact, artifactIndex) => {
    const evidence = object(artifact.evidence, `policy[${artifactIndex}].evidence`);
    const source = object(evidence.source, `policy[${artifactIndex}].evidence.source`);
    policySourceIdentities.push(
      policySourceIdentity(source, `policy[${artifactIndex}].evidence.source`),
    );
    assertRuntime(experiment, artifact, "policy", artifactIndex);
    const cases = array(evidence.cases, `policy[${artifactIndex}].evidence.cases`);
    if (
      canonical(cases.map(({ id }) => id)) !== canonical(policyCaseIds)
    ) {
      fail(`policy[${artifactIndex}] case order drifted`);
    }
    const judgments = assertPolicyReview(
      artifact,
      policyCaseIds,
      artifactIndex,
    );
    const limitations = array(
      evidence.evidenceLimitations,
      `policy[${artifactIndex}].evidence.evidenceLimitations`,
    );
    const changes = array(
      evidence.unexpectedChanges,
      `policy[${artifactIndex}].evidence.unexpectedChanges`,
    );
    evidenceLimitationCount += limitations.length;
    unexpectedChangeCount += changes.length;
    sessionFatalCount += cases.filter(({ sessionFatal }) => sessionFatal !== false).length;

    const mode = policyModes[artifactIndex];
    const isControl = artifactIndex === 0;
    const evaluation = object(
      evidence.evaluation,
      `policy[${artifactIndex}].evidence.evaluation`,
    );
    if (isControl) {
      exact(evaluation.condition, "control", "policy Control condition");
      assertCandidateReference(
        evaluation.candidateReference,
        experiment.candidates.v1,
        "policy Control candidate reference",
      );
      if (evaluation.instructionOverlay !== null) {
        fail("policy Control must not contain an instruction overlay");
      }
      cases.forEach((item, caseIndex) => {
        const metrics = metricObject(
          item.metrics,
          `policy[${artifactIndex}].cases[${caseIndex}].metrics`,
        );
        if (Object.values(metrics).includes(null)) metricsComplete = false;
        rawControl.push({ caseId: item.id, metrics });
      });
      return;
    }

    const { version, repetition } = armIdentity(mode, "policy");
    exact(evaluation.condition, "core", `policy[${artifactIndex}] condition`);
    assertCandidateReference(
      evaluation.candidateReference,
      experiment.candidates[version],
      `policy[${artifactIndex}] candidate reference`,
    );
    assertCandidateReference(
      evaluation.instructionOverlay,
      experiment.candidates[version],
      `policy[${artifactIndex}] instruction overlay`,
    );
    exact(
      evaluation.baseline?.runId,
      policyArtifacts[0].runId,
      `policy[${artifactIndex}] shared Control`,
    );
    cases.forEach((item, caseIndex) => {
      const metrics = metricObject(
        item.metrics,
        `policy[${artifactIndex}].cases[${caseIndex}].metrics`,
      );
      if (Object.values(metrics).includes(null)) metricsComplete = false;
      rawPolicy.push({
        runId: artifact.runId,
        candidate: version,
        repetition,
        caseId: item.id,
        metrics,
      });
      if (version === "v2" && judgments[caseIndex].judgment === "pass") {
        policyV2Passes += 1;
      }
    });
  });
  assertSourceIdentities(policySourceIdentities, "policy");
  const reviewAudit = evaluateReviewAudit(
    experiment,
    policyArtifacts,
    auditArtifact,
  );

  const codingByCandidate = {
    v1: new Map(experiment.coding.cases.map((id) => [id, []])),
    v2: new Map(experiment.coding.cases.map((id) => [id, []])),
  };
  let codingV2Passes = 0;
  let codingComparabilityPass = true;
  const codingRunIds = new Set();

  codingArtifacts.forEach((artifact, artifactIndex) => {
    const mode = experiment.coding.arms[artifactIndex];
    const { version, repetition } = armIdentity(mode, "coding");
    const source = object(artifact.source, `coding[${artifactIndex}].source`);
    codingSourceIdentities.push(
      codingSourceIdentity(
        source,
        `coding[${artifactIndex}].source`,
        experiment,
        options.sourceBlobSha256,
      ),
    );
    assertRuntime(experiment, artifact, "coding", artifactIndex);
    exact(artifact.id, mode, `coding[${artifactIndex}] id`);
    if (
      typeof artifact.runId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(
        artifact.runId,
      ) ||
      codingRunIds.has(artifact.runId)
    ) {
      fail(`coding[${artifactIndex}] runId must be a unique UUID`);
    }
    codingRunIds.add(artifact.runId);
    exact(artifact.repetition, repetition, `coding[${artifactIndex}] repetition`);
    const candidate = object(
      artifact.candidate,
      `coding[${artifactIndex}].candidate`,
    );
    exact(candidate.id, version, `coding[${artifactIndex}] candidate id`);
    exact(
      candidate.path,
      experiment.candidates[version].source,
      `coding[${artifactIndex}] candidate path`,
    );
    if (
      candidate.expectedSha256 !== experiment.candidates[version].sha256 ||
      candidate.actualSha256 !== experiment.candidates[version].sha256
    ) {
      fail(`coding[${artifactIndex}] candidate SHA drifted`);
    }
    exact(
      candidate.bytes,
      experiment.candidates[version].byteLength,
      `coding[${artifactIndex}] candidate bytes`,
    );
    const cases = array(artifact.cases, `coding[${artifactIndex}].cases`);
    if (
      canonical(cases.map(({ caseId }) => caseId)) !==
      canonical(experiment.coding.cases)
    ) {
      fail(`coding[${artifactIndex}] case order drifted`);
    }
    const checks = object(artifact.checks, `coding[${artifactIndex}].checks`);
    for (const key of CODING_CHECK_KEYS) {
      own(checks, key, `coding[${artifactIndex}].checks`);
    }
    if (
      !CODING_COMPARABILITY_CHECK_KEYS.every((key) => checks[key] === true)
    ) {
      codingComparabilityPass = false;
    }
    if (source.clean !== true) codingComparabilityPass = false;

    const computedTotals = [];
    cases.forEach((item, caseIndex) => {
      const metrics = metricObject(
        item.metrics,
        `coding[${artifactIndex}].cases[${caseIndex}].metrics`,
      );
      if (Object.values(metrics).includes(null)) metricsComplete = false;
      computedTotals.push(metrics);
      const casePass =
        isCodingCasePass(item) &&
        CODING_CHECK_KEYS.every((key) => checks[key] === true);
      if (version === "v2" && casePass) codingV2Passes += 1;
      codingByCandidate[version].get(item.caseId).push(metrics);
      rawCoding.push({
        runId: artifact.runId,
        candidate: version,
        repetition,
        caseId: item.caseId,
        metrics,
        pass: casePass,
      });
    });
    const recordedTotals = metricObject(
      artifact.totals,
      `coding[${artifactIndex}].totals`,
    );
    const calculatedTotals = aggregateMetricObjects(computedTotals);
    if (canonical(recordedTotals) !== canonical(calculatedTotals)) {
      fail(`coding[${artifactIndex}] recorded totals do not match case metrics`);
    }
  });
  assertSourceIdentities(codingSourceIdentities, "coding");

  const policyMedians = { v1: new Map(), v2: new Map() };
  for (const version of ["v1", "v2"]) {
    for (const caseId of policyCaseIds) policyMedians[version].set(caseId, []);
    for (const item of rawPolicy.filter(({ candidate }) => candidate === version)) {
      policyMedians[version].get(item.caseId).push(item.metrics);
    }
    for (const [caseId, values] of policyMedians[version]) {
      if (values.length !== experiment.policy.repetitionsPerCandidate) {
        fail(`policy ${version} ${caseId} repetition set is incomplete`);
      }
      policyMedians[version].set(caseId, medianMetricObjects(values));
    }
  }
  const policyCaseMedians = policyCaseIds.map((caseId) => {
    const v1 = policyMedians.v1.get(caseId);
    const v2 = policyMedians.v2.get(caseId);
    return {
      caseId,
      v1,
      v2,
      delta: Object.fromEntries(
        METRIC_KEYS.map((key) => [key, delta(v1[key], v2[key])]),
      ),
    };
  });
  const policyCandidateAggregates = Object.fromEntries(
    ["v1", "v2"].map((version) => [
      version,
      aggregateMetricObjects([...policyMedians[version].values()]),
    ]),
  );
  const policyRawCandidateTotals = Object.fromEntries(
    ["v1", "v2"].map((version) => [
      version,
      aggregateMetricObjects(
        rawPolicy
          .filter(({ candidate }) => candidate === version)
          .map(({ metrics }) => metrics),
      ),
    ]),
  );
  const policyRepetitionTotals = Array.from(
    { length: experiment.policy.repetitionsPerCandidate },
    (_, index) => {
      const repetition = index + 1;
      const values = {};
      for (const version of ["v1", "v2"]) {
        values[version] = sum(
          rawPolicy
            .filter(
              (item) =>
                item.candidate === version && item.repetition === repetition,
            )
            .map(({ metrics }) => metrics.inputTokens),
        );
      }
      return {
        repetition,
        ...values,
        delta: delta(values.v1, values.v2),
      };
    },
  );

  const codingMedians = { v1: new Map(), v2: new Map() };
  for (const version of ["v1", "v2"]) {
    for (const [caseId, values] of codingByCandidate[version]) {
      if (values.length !== experiment.coding.repetitionsPerCandidate) {
        fail(`coding ${version} ${caseId} repetition set is incomplete`);
      }
      codingMedians[version].set(caseId, medianMetricObjects(values));
    }
  }
  const codingCaseMedians = experiment.coding.cases.map((caseId) => {
    const v1 = codingMedians.v1.get(caseId);
    const v2 = codingMedians.v2.get(caseId);
    return {
      caseId,
      v1,
      v2,
      delta: Object.fromEntries(
        METRIC_KEYS.map((key) => [key, delta(v1[key], v2[key])]),
      ),
    };
  });
  const codingCandidateAggregates = Object.fromEntries(
    ["v1", "v2"].map((version) => [
      version,
      aggregateMetricObjects([...codingMedians[version].values()]),
    ]),
  );
  const codingRawCandidateTotals = Object.fromEntries(
    ["v1", "v2"].map((version) => [
      version,
      aggregateMetricObjects(
        rawCoding
          .filter(({ candidate }) => candidate === version)
          .map(({ metrics }) => metrics),
      ),
    ]),
  );

  const policyInputReduction = percentReduction(
    policyRawCandidateTotals.v1.inputTokens,
    policyRawCandidateTotals.v2.inputTokens,
  );
  const policyInputWins = policyCaseMedians.filter(
    (item) => item.delta.inputTokens !== null && item.delta.inputTokens < 0,
  ).length;
  const policyRepetitionWins = policyRepetitionTotals.filter(
    (item) => item.delta !== null && item.delta < 0,
  ).length;
  const policyMedianTotalDelta = median(
    policyCaseMedians.map((item) => item.delta.totalTokens),
  );
  const codingInputRegression = percentDelta(
    codingRawCandidateTotals.v1.inputTokens,
    codingRawCandidateTotals.v2.inputTokens,
  );
  const combined = {};
  for (const version of ["v1", "v2"]) {
    combined[version] = {
      inputTokens: sum([
        policyRawCandidateTotals[version].inputTokens,
        codingRawCandidateTotals[version].inputTokens,
      ]),
      totalTokens: sum([
        policyRawCandidateTotals[version].totalTokens,
        codingRawCandidateTotals[version].totalTokens,
      ]),
      wallClockMs: sum([
        policyRawCandidateTotals[version].wallClockMs,
        codingRawCandidateTotals[version].wallClockMs,
      ]),
    };
  }
  combined.inputTokenDelta = delta(
    combined.v1.inputTokens,
    combined.v2.inputTokens,
  );
  combined.totalTokenDelta = delta(
    combined.v1.totalTokens,
    combined.v2.totalTokens,
  );
  combined.wallClockRegressionPercent = percentDelta(
    combined.v1.wallClockMs,
    combined.v2.wallClockMs,
  );

  const staticReduction = percentReduction(
    experiment.candidates.v1.byteLength,
    experiment.candidates.v2.byteLength,
  );
  const controlTotals = aggregateMetricObjects(
    rawControl.map(({ metrics }) => metrics),
  );
  const experimentObservedTotals = aggregateMetricObjects([
    ...rawControl,
    ...rawPolicy,
    ...rawCoding,
  ].map(({ metrics }) => metrics));
  const configured = experiment.gates;
  const gates = {
    metricsComplete: gate(metricsComplete, metricsComplete, true, "==="),
    evidenceLimitations: gate(
      evidenceLimitationCount <= configured.comparability.evidenceLimitations,
      evidenceLimitationCount,
      configured.comparability.evidenceLimitations,
      "<=",
    ),
    unexpectedChanges: gate(
      unexpectedChangeCount <= configured.comparability.unexpectedChanges,
      unexpectedChangeCount,
      configured.comparability.unexpectedChanges,
      "<=",
    ),
    sessionFatals: gate(
      sessionFatalCount <= configured.comparability.sessionFatals,
      sessionFatalCount,
      configured.comparability.sessionFatals,
      "<=",
    ),
    codingComparability: gate(
      codingComparabilityPass,
      codingComparabilityPass,
      true,
      "===",
    ),
    reviewAudit: gate(
      reviewAudit.pass,
      reviewAudit.agreementPercent,
      experiment.review.audit.minimumRawAgreementPercent,
      ">=",
    ),
    policyV2Passes: gate(
      policyV2Passes === configured.quality.policyV2Passes,
      policyV2Passes,
      configured.quality.policyV2Passes,
      "===",
    ),
    codingV2Passes: gate(
      codingV2Passes === configured.quality.codingV2Passes,
      codingV2Passes,
      configured.quality.codingV2Passes,
      "===",
    ),
    staticByteReduction: gate(
      staticReduction >=
        configured.tokenEfficiency.staticByteReductionPercentMin,
      staticReduction,
      configured.tokenEfficiency.staticByteReductionPercentMin,
      ">=",
    ),
    policyAggregateInputReduction: gate(
      policyInputReduction !== null &&
        policyInputReduction >=
          configured.tokenEfficiency.policyAggregateInputReductionPercentMin,
      policyInputReduction,
      configured.tokenEfficiency.policyAggregateInputReductionPercentMin,
      ">=",
    ),
    policyCaseMedianInputWins: gate(
      metricsComplete &&
        policyInputWins >=
          configured.tokenEfficiency.policyCaseMedianInputWinsMin,
      policyInputWins,
      configured.tokenEfficiency.policyCaseMedianInputWinsMin,
      ">=",
    ),
    policyRepetitionInputLower: gate(
      metricsComplete &&
        policyRepetitionWins >=
          configured.tokenEfficiency.policyRepetitionInputLowerMin,
      policyRepetitionWins,
      configured.tokenEfficiency.policyRepetitionInputLowerMin,
      ">=",
    ),
    policyMedianCaseTotalDelta: gate(
      policyMedianTotalDelta !== null &&
        policyMedianTotalDelta <
          configured.tokenEfficiency.policyMedianCaseTotalDeltaMaxExclusive,
      policyMedianTotalDelta,
      configured.tokenEfficiency.policyMedianCaseTotalDeltaMaxExclusive,
      "<",
    ),
    codingAggregateInputRegression: gate(
      codingInputRegression !== null &&
        codingInputRegression <=
          configured.tokenEfficiency.codingAggregateInputRegressionPercentMax,
      codingInputRegression,
      configured.tokenEfficiency.codingAggregateInputRegressionPercentMax,
      "<=",
    ),
    combinedTotalTokenDelta: gate(
      combined.totalTokenDelta !== null &&
        combined.totalTokenDelta <
          configured.tokenEfficiency.combinedTotalTokenDeltaMaxExclusive,
      combined.totalTokenDelta,
      configured.tokenEfficiency.combinedTotalTokenDeltaMaxExclusive,
      "<",
    ),
    combinedWallClockRegression: gate(
      combined.wallClockRegressionPercent !== null &&
        combined.wallClockRegressionPercent <=
          configured.latency.combinedWallClockRegressionPercentMax,
      combined.wallClockRegressionPercent,
      configured.latency.combinedWallClockRegressionPercentMax,
      "<=",
    ),
  };
  const reasons = [];
  for (const [name, result] of Object.entries(gates)) {
    if (!result.pass) reasons.push(name === "metricsComplete" ? "metrics contain null" : `${name} gate failed`);
  }

  return {
    verdict: reasons.length === 0 ? "pass" : "blocked",
    reasons,
    contractSha256: options.contractSha256 ?? null,
    evaluatorSha256: options.evaluatorSha256 ?? null,
    artifactSha256: options.artifactSha256 ?? null,
    controlHead,
    fixedHead: policyHead,
    gates,
    metrics: {
      staticByteReductionPercent: staticReduction,
      control: controlTotals,
      experimentObservedTotals,
      reviewAudit,
      quality: { policyV2Passes, codingV2Passes },
      policy: {
        rawCandidateTotals: policyRawCandidateTotals,
        caseMedianCandidateTotals: policyCandidateAggregates,
        caseMedians: policyCaseMedians,
        repetitionTotals: policyRepetitionTotals,
        aggregateInputReductionPercent: policyInputReduction,
        caseMedianInputWins: policyInputWins,
        repetitionInputLowerCount: policyRepetitionWins,
        medianCaseTotalTokenDelta: policyMedianTotalDelta,
      },
      coding: {
        rawCandidateTotals: codingRawCandidateTotals,
        caseMedianCandidateTotals: codingCandidateAggregates,
        caseMedians: codingCaseMedians,
        aggregateInputRegressionPercent: codingInputRegression,
      },
      combined,
    },
    raw: { policy: rawPolicy, coding: rawCoding },
  };
}

async function collectJsonFiles(root) {
  const files = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...(await collectJsonFiles(target)));
    else if (entry.isFile() && entry.name.endsWith(".json")) files.push(target);
  }
  return files;
}

function git(repositoryRoot, args, encoding = "utf8") {
  return execFileSync("git", ["-C", repositoryRoot, ...args], {
    encoding,
    maxBuffer: 32 * 1024 * 1024,
    windowsHide: true,
  });
}

export async function verifyCliGitBindings({
  repositoryRoot,
  contractPath,
  contractBytes,
  experiment,
  policyArtifacts,
  policyArtifactBytes,
  codingArtifacts,
  codingArtifactBytes,
  auditArtifact = null,
  auditArtifactBytes = null,
  modulePath = MODULE_PATH,
}) {
  validateContract(experiment);
  const controlHead = policyArtifacts[0].evidence.source.head;
  const fixedHead = policyArtifacts[1].evidence.source.head;
  const currentHead = git(repositoryRoot, ["rev-parse", "HEAD"]).trim();
  const contractRelativePath = path
    .relative(repositoryRoot, path.resolve(contractPath))
    .split(path.sep)
    .join("/");
  if (
    contractRelativePath === "" ||
    contractRelativePath === ".." ||
    contractRelativePath.startsWith("../")
  ) {
    fail("experiment contract must be inside the source repository");
  }
  if (controlHead === fixedHead) {
    fail("Control and Core must use distinct pre-Control and post-Control HEADs");
  }
  for (const [ancestor, descendant, label] of [
    [controlHead, fixedHead, "Control HEAD must precede the fixed Core HEAD"],
    [fixedHead, currentHead, "fixed Core HEAD must precede the evidence HEAD"],
  ]) {
    try {
      git(repositoryRoot, ["merge-base", "--is-ancestor", ancestor, descendant]);
    } catch {
      fail(label);
    }
  }
  const transitionPaths = git(repositoryRoot, [
    "diff-tree",
    "--no-commit-id",
    "--name-only",
    "-r",
    controlHead,
    fixedHead,
  ])
    .trim()
    .split(/\r?\n/u)
    .filter(Boolean);
  const expectedControlPath = `evals/p0/${policyArtifacts[0].runId}.json`;
  if (canonical(transitionPaths) !== canonical([expectedControlPath])) {
    fail(
      `Control-to-Core commit may add only ${expectedControlPath}; got ${transitionPaths.join(", ")}`,
    );
  }
  const frozenContract = git(
    repositoryRoot,
    ["show", `${fixedHead}:${contractRelativePath}`],
    null,
  );
  const controlContract = git(
    repositoryRoot,
    ["show", `${controlHead}:${contractRelativePath}`],
    null,
  );
  const currentContract = git(
    repositoryRoot,
    ["show", `${currentHead}:${contractRelativePath}`],
    null,
  );
  if (
    !contractBytes.equals(frozenContract) ||
    !frozenContract.equals(controlContract) ||
    !frozenContract.equals(currentContract)
  ) {
    fail("working experiment contract is not byte-identical across H0/H1/current Git blobs");
  }

  const evaluatorRelativePath = path
    .relative(repositoryRoot, path.resolve(modulePath))
    .split(path.sep)
    .join("/");
  exact(
    evaluatorRelativePath,
    experiment.runtime.evaluator,
    "running evaluator path",
  );
  const evaluatorBytes = await readFile(modulePath);
  const evaluatorBlobs = [controlHead, fixedHead, currentHead].map((head) =>
    git(repositoryRoot, ["show", `${head}:${evaluatorRelativePath}`], null),
  );
  if (
    evaluatorBlobs.some((bytes) => !bytes.equals(evaluatorBytes))
  ) {
    fail("running evaluator is not byte-identical across H0/H1/current Git blobs");
  }

  const committedControl = git(
    repositoryRoot,
    ["show", `${fixedHead}:${expectedControlPath}`],
    null,
  );
  if (!committedControl.equals(policyArtifactBytes.get(policyArtifacts[0].runId))) {
    fail("reviewed Control raw bytes differ from the H1 Git blob");
  }

  const artifactSha256 = {};
  const anchored = [
    ...policyArtifacts.map((artifact) => ({
      id: artifact.runId,
      relativePath: `evals/p0/${artifact.runId}.json`,
      bytes: policyArtifactBytes.get(artifact.runId),
    })),
    ...codingArtifacts.map((artifact) => ({
      id: artifact.id,
      relativePath: `evals/coding/results/${artifact.id}.json`,
      bytes: codingArtifactBytes.get(artifact.id),
    })),
    ...(auditArtifact
      ? [{
          id: auditArtifact.id,
          relativePath: experiment.review.audit.artifactPath,
          bytes: auditArtifactBytes,
        }]
      : []),
  ];
  for (const artifact of anchored) {
    if (!Buffer.isBuffer(artifact.bytes)) {
      fail(`raw artifact bytes are missing: ${artifact.id}`);
    }
    const committed = git(
      repositoryRoot,
      ["show", `${currentHead}:${artifact.relativePath}`],
      null,
    );
    if (!committed.equals(artifact.bytes)) {
      fail(`raw artifact differs from current Git blob: ${artifact.id}`);
    }
    artifactSha256[artifact.id] = sha256(artifact.bytes);
  }

  const verifiedPolicySource = policyArtifacts[0].evidence.source;
  for (const [relativePath, recorded] of Object.entries(
    verifiedPolicySource.gitBlobs ?? {},
  )) {
    const controlGitHash = git(
      repositoryRoot,
      ["rev-parse", `${controlHead}:${relativePath}`],
    ).trim();
    const fixedGitHash = git(
      repositoryRoot,
      ["rev-parse", `${fixedHead}:${relativePath}`],
    ).trim();
    if (
      controlGitHash !== fixedGitHash ||
      recorded.headGitHash !== fixedGitHash ||
      recorded.workingGitHash !== fixedGitHash
    ) {
      fail(`verified policy Git blob drifted: ${relativePath}`);
    }
    const bytes = git(
      repositoryRoot,
      ["show", `${fixedHead}:${relativePath}`],
      null,
    );
    if (verifiedPolicySource.sha256?.[relativePath] !== sha256(bytes)) {
      fail(`verified policy byte SHA drifted: ${relativePath}`);
    }
  }
  for (const [version, candidate] of Object.entries(experiment.candidates)) {
    const fixedBytes = git(
      repositoryRoot,
      ["show", `${fixedHead}:${candidate.source}`],
      null,
    );
    const controlBytes = git(
      repositoryRoot,
      ["show", `${controlHead}:${candidate.source}`],
      null,
    );
    if (
      !fixedBytes.equals(controlBytes) ||
      fixedBytes.length !== candidate.byteLength ||
      sha256(fixedBytes) !== candidate.sha256
    ) {
      fail(`candidate ${version} Git blob does not match the frozen contract`);
    }
  }
  const sourceBlobSha256 = {};
  let codingCaseCatalog;
  for (const [key, relativePath] of [
    ["runner", experiment.runtime.codingRunner],
    ["cases", experiment.runtime.codingCases],
  ]) {
    const bytes = git(repositoryRoot, ["show", `${fixedHead}:${relativePath}`], null);
    const controlBytes = git(
      repositoryRoot,
      ["show", `${controlHead}:${relativePath}`],
      null,
    );
    if (!bytes.equals(controlBytes)) {
      fail(`${relativePath} changed between Control and Core HEADs`);
    }
    sourceBlobSha256[key] = sha256(bytes);
    if (key === "cases") codingCaseCatalog = JSON.parse(bytes.toString("utf8"));
  }
  return {
    controlHead,
    fixedHead,
    currentHead,
    sourceBlobSha256,
    codingCaseCatalog,
    artifactSha256,
    evaluatorSha256: sha256(evaluatorBytes),
  };
}

async function runCli(contractPath, artifactRoot) {
  const contractBytes = await readFile(contractPath);
  const experiment = JSON.parse(contractBytes.toString("utf8"));
  const expectedPolicyIds = [
    experiment.policy.controlMode,
    ...experiment.policy.arms,
  ].map(policyRunId);
  const expectedCodingIds = experiment.coding.arms.map(assertCodingMode);
  const requiredIds = new Set([...expectedPolicyIds, ...expectedCodingIds]);
  const recognizedIds = new Set([
    ...requiredIds,
    experiment.review.audit.artifactId,
  ]);
  const artifactsById = new Map();
  for (const file of await collectJsonFiles(artifactRoot)) {
    const bytes = await readFile(file);
    const artifact = JSON.parse(bytes.toString("utf8"));
    const artifactId = artifact.id ?? artifact.runId;
    if (!recognizedIds.has(artifactId)) continue;
    if (artifactsById.has(artifactId)) fail(`duplicate artifact ${artifactId}`);
    artifactsById.set(artifactId, { artifact, bytes });
  }
  const missing = [...requiredIds].filter((id) => !artifactsById.has(id));
  if (missing.length > 0) fail(`missing artifacts: ${missing.join(", ")}`);
  const policyArtifacts = expectedPolicyIds.map(
    (id) => artifactsById.get(id).artifact,
  );
  const codingArtifacts = expectedCodingIds.map(
    (id) => artifactsById.get(id).artifact,
  );
  const auditEntry = artifactsById.get(experiment.review.audit.artifactId);
  const auditArtifact = auditEntry?.artifact ?? null;
  const policyArtifactBytes = new Map(
    expectedPolicyIds.map((id) => [id, artifactsById.get(id).bytes]),
  );
  const codingArtifactBytes = new Map(
    expectedCodingIds.map((id) => [id, artifactsById.get(id).bytes]),
  );
  const repositoryRoot = git(
    path.dirname(path.resolve(contractPath)),
    ["rev-parse", "--show-toplevel"],
  ).trim();
  const bindings = await verifyCliGitBindings({
    repositoryRoot,
    contractPath,
    contractBytes,
    experiment,
    policyArtifacts,
    policyArtifactBytes,
    codingArtifacts,
    codingArtifactBytes,
    auditArtifact,
    auditArtifactBytes: auditEntry?.bytes ?? null,
  });
  return validateAbExperiment(
    experiment,
    { policyArtifacts, codingArtifacts, auditArtifact },
    {
      contractSha256: sha256(contractBytes),
      sourceBlobSha256: bindings.sourceBlobSha256,
      policyArtifactBytes,
      codingArtifactBytes,
      codingCaseCatalog: bindings.codingCaseCatalog,
      auditArtifactBytes: auditEntry?.bytes ?? null,
      artifactSha256: bindings.artifactSha256,
      evaluatorSha256: bindings.evaluatorSha256,
    },
  );
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(MODULE_PATH);
if (isMain) {
  const [contractPath, artifactRoot] = process.argv.slice(2);
  if (!contractPath || !artifactRoot) {
    console.error(
      "usage: node evals/support/evaluate-common-core-v1-v2-ab.mjs <contract.json> <artifact-directory>",
    );
    process.exitCode = 2;
  } else {
    runCli(path.resolve(contractPath), path.resolve(artifactRoot))
      .then((summary) => console.log(JSON.stringify(summary, null, 2)))
      .catch((error) => {
        console.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
      });
  }
}
