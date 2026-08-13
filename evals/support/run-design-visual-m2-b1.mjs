import { randomUUID } from "node:crypto";
import { chmod, copyFile, lstat, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { types as utilTypes } from "node:util";

import {
  containsCredentialText,
  createExclusiveRunRoot,
  diagnosticOwnData,
  openAppServer,
  prepareRuntime,
  removeIsolatedCodexHome,
  runBuffered,
  sanitizeDiagnosticEvidence,
  sha256,
  stableStringify,
} from "./collect-codex-app-server.mjs";
import { runFreshEvaluatorTurn } from "./run-fresh-evaluator-turn.mjs";

const SECTION_ORDER = Object.freeze([
  "invariants",
  "variants",
  "states",
  "wholeFrameChecks",
  "focusedChecks",
  "unverifiedBoundaries",
]);
const CHECK_KEYS = Object.freeze([
  "id",
  "sourceIds",
  "observableFact",
  "evidenceLayer",
  "applicability",
  "semantics",
]);
const VISUAL_CHECK_KEYS = Object.freeze([
  "id",
  "sourceIds",
  "evidenceLayer",
  "applicability",
  "semantics",
  "expected",
  "scopeMatch",
  "observed",
  "verdict",
]);
const EVIDENCE_LAYERS = new Set([
  "visible-appearance",
  "artifact-identity",
  "interaction",
  "runtime-identity",
  "user-acceptance",
]);
const PLAN_INPUT_KEYS = Object.freeze([
  "authority",
  "frozenFacts",
  "designSkill",
  "designPrompt",
  "visualSkill",
  "durableEvidence",
  "concreteDefect",
  "approvedReference",
  "visualPrompt",
  "approvedSource",
]);
const OUTPUT_KEYS = Object.freeze([
  "designRaw",
  "designHandoff",
  "sampleARaw",
  "sampleAEnvelope",
  "sampleBRaw",
  "sampleBEnvelope",
  "summary",
  "blocked",
]);
const EXPECTED_IMAGE_PATHS = Object.freeze({
  approvedSource: "evals/skill-contracts/fixtures/visual-m2-v1/blind/ff71c6e9919567b251659f00fda0a224a5f91fab24ed36042eb070310d739110.png",
  "sample-a": "evals/skill-contracts/fixtures/visual-m2-v1/blind/0684e6867856745762217a70862b81fee8ac70787b5ab57ea13ffa58a870db62.png",
  "sample-b": "evals/skill-contracts/fixtures/visual-m2-v1/blind/545a332a92e5b2b9e9f13415553511f07fbdcf189bc13a4852f123c9a943a7df.png",
});
const REQUIRED_OUTCOMES = Object.freeze({
  "sample-a": "applicable-visible-fail-and-aggregate-fail",
  "sample-b": "zero-fails-with-unsupported-layers-unverified",
});
const M2B1_PREDECESSORS = Object.freeze({
  2: Object.freeze({
    plan: Object.freeze({
      path: "evals/skill-contracts/design-visual-m2-b1-smoke-plan-v1.json",
      bytes: 4136,
      sha256: "817566dbadd085f4b4b5e13200ccccbdc8c0c536c7b4e7f9d3c0b2db9ecc6a82",
    }),
    blockedAttempt: Object.freeze({
      path: "evals/skill-contracts/design-visual-m2-b1-v1-blocked.json",
      bytes: 41149,
      sha256: "cfdd9d78b40d60809b481fa02b4118b38837326ae202cf52e8c9751d2c89472e",
    }),
    latestReceipt: Object.freeze({
      path: "evals/skill-contracts/design-visual-m2-attempt-index-v3.json",
      bytes: 3469,
      sha256: "c15029f52e9988fc670170b6ebc00029ce0a8d5a078aa0c128f612d257411fdf",
    }),
  }),
  3: Object.freeze({
    plan: Object.freeze({
      path: "evals/skill-contracts/design-visual-m2-b1-smoke-plan-v2.json",
      bytes: 5599,
      sha256: "758f6087d628db856e48752e8172126cd7c1f70e00ccf733b2f8afbfc76ffe0d",
    }),
    blockedAttempt: Object.freeze({
      path: "evals/skill-contracts/design-visual-m2-b1-v2-blocked.json",
      bytes: 44050,
      sha256: "979399d04ecba4fa48fb59c081c0aee22e8ae838391169b89ea1fd7ab69dd700",
    }),
    latestReceipt: Object.freeze({
      path: "evals/skill-contracts/design-visual-m2-attempt-index-v4.json",
      bytes: 3681,
      sha256: "12bcf3f41105a3d4b955204f81efee451e21792d61e787af1d33f90176f2caf0",
    }),
  }),
  4: Object.freeze({
    plan: Object.freeze({
      path: "evals/skill-contracts/design-visual-m2-b1-smoke-plan-v3.json",
      bytes: 5603,
      sha256: "4df74b6887c7301e9d15054f07285146d141b50346a0cf18cbb339897d0713de",
    }),
    blockedAttempt: Object.freeze({
      path: "evals/skill-contracts/design-visual-m2-b1-v3-blocked.json",
      bytes: 2207,
      sha256: "4fccaccb2ccbb5128e704bc5c9f2256a690da226210fca98b2eadee457530e7e",
    }),
    latestReceipt: Object.freeze({
      path: "evals/skill-contracts/design-visual-m2-attempt-index-v5.json",
      bytes: 4557,
      sha256: "04ce185d3918cfa9096d71e8dc7bbe86ccbf2834813c980113b11a3182a332ed",
    }),
  }),
  5: Object.freeze({
    plan: Object.freeze({
      path: "evals/skill-contracts/design-visual-m2-b1-smoke-plan-v4.json",
      bytes: 5616,
      sha256: "6a2c1a3408d7d10c9044a86db336653772365f57a0cd01b130b4c4658c740737",
    }),
    blockedAttempt: Object.freeze({
      path: "evals/skill-contracts/design-visual-m2-b1-v4-blocked.json",
      bytes: 10898,
      sha256: "da48853672e3b10b26dd7c083a29c50c7d2e2f8e663c38422cbaab44930c021b",
    }),
    latestReceipt: Object.freeze({
      path: "evals/skill-contracts/design-visual-m2-attempt-index-v6.json",
      bytes: 4948,
      sha256: "bdfcb2ebd064e01632a5251f7c7b1603d8ffb8ab5f5d8fa58eb52da0ba413840",
    }),
  }),
});
const M2B1_METHOD_CHANGES = Object.freeze({
  2: "bounded-sanitized-runtime-error-and-primary-cause-capture",
  3: "closed-object-response-schemas-required-by-observed-api-error",
  4: "prioritized-bounded-failure-evidence-retention-no-evaluator-contract-change",
  5: "bounded-sanitized-app-server-stderr-diagnostic-retention-no-evaluator-contract-change",
});
const M2B1_UNCHANGED_EVALUATOR_CONTRACT_KEYS = Object.freeze([
  "runtime",
  "inputs",
  "candidates",
  "claimScope",
  "originalDetail",
  "boundaries",
]);

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function exactKeys(value, keys) {
  return isObject(value) &&
    Object.keys(value).sort().join("\0") === [...keys].sort().join("\0");
}

function clone(value) {
  return JSON.parse(stableStringify(value));
}

function assertPortablePath(value, label) {
  if (
    typeof value !== "string" ||
    !value ||
    path.posix.isAbsolute(value) ||
    value.includes("\\") ||
    value.split("/").some((part) => part === "" || part === "." || part === "..")
  ) {
    throw new Error(`${label} path is unsafe`);
  }
  return value;
}

function assertPin(pin, label) {
  if (
    !exactKeys(pin, ["path", "bytes", "sha256"]) ||
    !Number.isSafeInteger(pin.bytes) ||
    pin.bytes < 1 ||
    !/^[a-f0-9]{64}$/u.test(pin.sha256)
  ) {
    throw new Error(`${label} pin is malformed`);
  }
  assertPortablePath(pin.path, label);
}

function assertOutputPath(value, label) {
  assertPortablePath(value, label);
  if (!value.endsWith(".json")) throw new Error(`${label} output path is malformed`);
}

export function validateDesignVisualM2B1Plan(value) {
  const isSuccessor = [2, 3, 4, 5].includes(value?.schemaVersion);
  const expectedKeys = [
    "schemaVersion", "id", "date",
    ...(isSuccessor ? ["predecessor", "source"] : []),
    "runtime", "inputs", "candidates", "claimScope", "originalDetail",
    "outputs", "boundaries",
  ];
  if (!exactKeys(value, expectedKeys)) {
    throw new Error("M2B1 plan is malformed");
  }
  if (
    ![1, 2, 3, 4, 5].includes(value.schemaVersion) ||
    value.id !== `design-visual-m2-b1-smoke-plan-v${value.schemaVersion}` ||
    typeof value.date !== "string" ||
    !exactKeys(value.runtime, ["codexVersion", "sessionOrder", "retryCount"]) ||
    value.runtime.codexVersion !== "codex-cli 0.146.0" ||
    stableStringify(value.runtime.sessionOrder) !== stableStringify(["design", "sample-a", "sample-b"]) ||
    value.runtime.retryCount !== 0
  ) {
    throw new Error("M2B1 plan identity or runtime is malformed");
  }
  if (isSuccessor) {
    if (
      !exactKeys(value.predecessor, [
        "plan", "blockedAttempt", "latestReceipt", "methodChange", "attemptPolicy",
      ]) ||
      value.predecessor.methodChange !== M2B1_METHOD_CHANGES[value.schemaVersion] ||
      value.predecessor.attemptPolicy !== "one-method-changed-attempt-no-automatic-retry"
    ) {
      throw new Error("M2B1 predecessor contract is malformed");
    }
    for (const [key, pin] of Object.entries({
      plan: value.predecessor.plan,
      blockedAttempt: value.predecessor.blockedAttempt,
      latestReceipt: value.predecessor.latestReceipt,
    })) {
      assertPin(pin, `M2B1 predecessor ${key}`);
      if (stableStringify(pin) !== stableStringify(M2B1_PREDECESSORS[value.schemaVersion][key])) {
        throw new Error(`M2B1 predecessor ${key} pin differs`);
      }
    }
    if (
      !exactKeys(value.source, ["repositoryCommit", "runner", "freshTurnAdapter", "collector"]) ||
      !/^[a-f0-9]{40}$/u.test(value.source.repositoryCommit)
    ) {
      throw new Error("M2B1 source contract is malformed");
    }
    const expectedSourcePaths = {
      runner: "evals/support/run-design-visual-m2-b1.mjs",
      freshTurnAdapter: "evals/support/run-fresh-evaluator-turn.mjs",
      collector: "evals/support/collect-codex-app-server.mjs",
    };
    for (const [key, expectedPath] of Object.entries(expectedSourcePaths)) {
      assertPin(value.source[key], `M2B1 source ${key}`);
      if (value.source[key].path !== expectedPath) {
        throw new Error(`M2B1 source ${key} path differs`);
      }
    }
  }
  if (!exactKeys(value.inputs, PLAN_INPUT_KEYS)) {
    throw new Error("M2B1 plan inputs are malformed");
  }
  for (const key of PLAN_INPUT_KEYS) assertPin(value.inputs[key], `M2B1 ${key}`);
  if (
    value.inputs.authority.path !== "evals/skill-contracts/design-visual-m2-authority-v5.json" ||
    value.inputs.frozenFacts.path !== "evals/skill-contracts/design-visual-m2-authority-v1.json" ||
    value.inputs.designPrompt.path !== "evals/skill-contracts/design-visual-m2-design-prompt-v5.md" ||
    value.inputs.visualPrompt.path !== "evals/skill-contracts/design-visual-m2-visual-prompt-v9.md" ||
    value.inputs.approvedSource.path !== EXPECTED_IMAGE_PATHS.approvedSource
  ) {
    throw new Error("M2B1 plan exact input path pin is invalid");
  }
  if (!Array.isArray(value.candidates) || value.candidates.length !== 2) {
    throw new Error("M2B1 plan candidates are malformed");
  }
  for (const [index, expectedId] of ["sample-a", "sample-b"].entries()) {
    const candidate = value.candidates[index];
    if (
      !exactKeys(candidate, ["id", "image", "requiredOutcome"]) ||
      candidate.id !== expectedId ||
      candidate.requiredOutcome !== REQUIRED_OUTCOMES[expectedId]
    ) {
      throw new Error("M2B1 opaque candidate order or required outcome is malformed");
    }
    assertPin(candidate.image, `M2B1 ${expectedId}`);
    if (candidate.image.path !== EXPECTED_IMAGE_PATHS[expectedId]) {
      throw new Error(`M2B1 ${expectedId} exact image path pin is invalid`);
    }
  }
  if (
    !exactKeys(value.claimScope, ["variant", "surface"]) ||
    value.claimScope.variant !== "Default" ||
    value.claimScope.surface !== "Collection modal" ||
    value.originalDetail !== "UNVERIFIED"
  ) {
    throw new Error("M2B1 claim scope is malformed");
  }
  if (!exactKeys(value.outputs, OUTPUT_KEYS)) {
    throw new Error("M2B1 output plan is malformed");
  }
  const outputPaths = Object.entries(value.outputs).map(([key, output]) => {
    assertOutputPath(output, `M2B1 ${key}`);
    return output;
  });
  if (new Set(outputPaths).size !== outputPaths.length) {
    throw new Error("M2B1 output paths collide");
  }
  const generation = `-v${value.schemaVersion}-`;
  if (outputPaths.some((output) => !output.includes(generation))) {
    throw new Error("M2B1 output generation is malformed");
  }
  if (
    !exactKeys(value.boundaries, ["acceptanceSurface", "states", "target", "originalDetail", "manifestUpdate"]) ||
    value.boundaries.acceptanceSurface !== "Collection modal" ||
    value.boundaries.states !== "UNVERIFIED" ||
    value.boundaries.target !== "UNVERIFIED" ||
    value.boundaries.originalDetail !== "UNVERIFIED" ||
    value.boundaries.manifestUpdate !== "forbidden-before-independent-review"
  ) {
    throw new Error("M2B1 boundaries are malformed");
  }
  if (/ground.?truth|known.?visual.?failure|positive.?control|TASKS|prior verdict/iu.test(stableStringify(value))) {
    throw new Error("M2B1 plan leaks hidden evaluator information");
  }
  return clone(value);
}

function assertUnchangedM2B1EvaluatorContract(plan, predecessorBytes) {
  if (![4, 5].includes(plan.schemaVersion)) return;
  let predecessor;
  try {
    predecessor = validateDesignVisualM2B1Plan(
      JSON.parse(predecessorBytes.toString("utf8")),
    );
  } catch (error) {
    throw new Error("M2B1 predecessor plan contract is unreadable", { cause: error });
  }
  for (const key of M2B1_UNCHANGED_EVALUATOR_CONTRACT_KEYS) {
    if (stableStringify(plan[key]) !== stableStringify(predecessor[key])) {
      throw new Error(`M2B1 evaluator contract changed at ${key}`);
    }
  }
}

function validateApplicability(value, label) {
  if (!isObject(value) || !["always", "match"].includes(value.mode)) {
    throw new Error(`${label} applicability is malformed`);
  }
  if (value.mode === "always") {
    if (!exactKeys(value, ["mode"])) throw new Error(`${label} applicability is malformed`);
    return;
  }
  if (!exactKeys(value, ["mode", "dimensions"]) || !isObject(value.dimensions)) {
    throw new Error(`${label} applicability is malformed`);
  }
  const allowed = new Set(["variant", "state", "surface", "target"]);
  if (Object.keys(value.dimensions).length === 0) throw new Error(`${label} dimensions are empty`);
  for (const [dimension, names] of Object.entries(value.dimensions)) {
    if (
      !allowed.has(dimension) ||
      !Array.isArray(names) ||
      names.length === 0 ||
      new Set(names).size !== names.length ||
      names.some((name) => typeof name !== "string" || !name)
    ) {
      throw new Error(`${label} dimensions are malformed`);
    }
  }
}

export function validateDesignM2B1Output(value) {
  if (!exactKeys(value, ["schemaVersion", ...SECTION_ORDER]) || value.schemaVersion !== 5) {
    throw new Error("M2B1 Design output shape is malformed");
  }
  const seen = new Set();
  for (const section of SECTION_ORDER) {
    if (!Array.isArray(value[section])) throw new Error(`M2B1 Design ${section} is malformed`);
    for (const check of value[section]) {
      if (
        !exactKeys(check, CHECK_KEYS) ||
        typeof check.id !== "string" ||
        !check.id ||
        seen.has(check.id) ||
        !Array.isArray(check.sourceIds) ||
        check.sourceIds.length === 0 ||
        check.sourceIds.some((id) => typeof id !== "string" || !id) ||
        typeof check.observableFact !== "string" ||
        !check.observableFact ||
        !EVIDENCE_LAYERS.has(check.evidenceLayer) ||
        !["acceptance", "boundary"].includes(check.semantics)
      ) {
        throw new Error("M2B1 Design check is malformed or duplicated");
      }
      seen.add(check.id);
      validateApplicability(check.applicability, `M2B1 Design ${check.id}`);
      if ((section === "unverifiedBoundaries") !== (check.semantics === "boundary")) {
        throw new Error("M2B1 Design semantics are in the wrong section");
      }
      if (
        check.evidenceLayer === "visible-appearance" &&
        check.semantics === "acceptance" &&
        !check.applicability.dimensions?.surface?.includes("Collection modal")
      ) {
        throw new Error("M2B1 visible acceptance check lacks Collection modal scope");
      }
    }
  }
  if (seen.size === 0) throw new Error("M2B1 Design output has no checks");
  return clone(value);
}

function flattenDesign(design) {
  return SECTION_ORDER.flatMap((section) => design[section]);
}

function scopeMatchFor(applicability, claimScope) {
  if (applicability.mode === "always") return "APPLICABLE";
  for (const [dimension, allowed] of Object.entries(applicability.dimensions)) {
    if (Object.hasOwn(claimScope, dimension) && !allowed.includes(claimScope[dimension])) {
      return "NOT_APPLICABLE";
    }
  }
  for (const dimension of Object.keys(applicability.dimensions)) {
    if (!Object.hasOwn(claimScope, dimension)) return "UNVERIFIED";
  }
  return "APPLICABLE";
}

function aggregate(checks, layer = null) {
  const applicable = checks.filter((check) =>
    check.semantics === "acceptance" &&
    check.scopeMatch !== "NOT_APPLICABLE" &&
    (layer === null || check.evidenceLayer === layer));
  if (applicable.length === 0) return "UNVERIFIED";
  if (applicable.some(({ verdict }) => verdict === "FAIL")) return "FAIL";
  if (applicable.some(({ verdict }) => verdict === "UNVERIFIED")) return "UNVERIFIED";
  return "PASS";
}

export function validateVisualM2B1Output(value, designValue, candidateId) {
  const design = validateDesignM2B1Output(designValue);
  if (
    !exactKeys(value, ["candidateId", "claimScope", "checks", "visibleAppearanceOverall", "completeContractOverall"]) ||
    value.candidateId !== candidateId ||
    !exactKeys(value.claimScope, ["variant", "surface"]) ||
    value.claimScope.variant !== "Default" ||
    value.claimScope.surface !== "Collection modal" ||
    !Array.isArray(value.checks)
  ) {
    throw new Error("M2B1 Visual output shape or opaque candidate id is malformed");
  }
  const expected = flattenDesign(design);
  if (value.checks.length !== expected.length) {
    throw new Error("M2B1 Visual atomic transfer count differs");
  }
  for (const [index, check] of value.checks.entries()) {
    const source = expected[index];
    if (!exactKeys(check, VISUAL_CHECK_KEYS)) {
      throw new Error("M2B1 Visual check is malformed");
    }
    for (const [field, expectedValue] of [
      ["id", source.id],
      ["sourceIds", source.sourceIds],
      ["evidenceLayer", source.evidenceLayer],
      ["applicability", source.applicability],
      ["semantics", source.semantics],
      ["expected", source.observableFact],
    ]) {
      if (stableStringify(check[field]) !== stableStringify(expectedValue)) {
        throw new Error(`M2B1 Visual transfer order or ${field} differs`);
      }
    }
    const expectedScope = scopeMatchFor(source.applicability, value.claimScope);
    if (
      check.scopeMatch !== expectedScope ||
      typeof check.observed !== "string" ||
      !check.observed ||
      !["PASS", "FAIL", "UNVERIFIED", "NOT_APPLICABLE"].includes(check.verdict) ||
      (expectedScope === "NOT_APPLICABLE" && check.verdict !== "NOT_APPLICABLE") ||
      (expectedScope === "UNVERIFIED" && check.verdict !== "UNVERIFIED") ||
      (expectedScope === "APPLICABLE" && check.verdict === "NOT_APPLICABLE")
    ) {
      throw new Error("M2B1 Visual scope/verdict transfer is invalid");
    }
    if (
      source.semantics === "acceptance" &&
      source.evidenceLayer !== "visible-appearance" &&
      check.verdict === "PASS"
    ) {
      throw new Error("M2B1 still image broadly passes an unsupported layer");
    }
  }
  const visible = aggregate(value.checks, "visible-appearance");
  const complete = aggregate(value.checks);
  if (value.visibleAppearanceOverall !== visible || value.completeContractOverall !== complete) {
    throw new Error("M2B1 Visual aggregate overall is invalid");
  }
  const acceptance = value.checks.filter(({ semantics }) => semantics === "acceptance");
  if (candidateId === "sample-a") {
    if (
      !acceptance.some((check) => check.evidenceLayer === "visible-appearance" && check.scopeMatch === "APPLICABLE" && check.verdict === "FAIL") ||
      visible !== "FAIL" ||
      complete !== "FAIL"
    ) {
      throw new Error("M2B1 sample-a lacks the bounded defect outcome");
    }
  } else if (candidateId === "sample-b") {
    if (
      value.checks.some(({ verdict }) => verdict === "FAIL") ||
      !acceptance.some(({ verdict }) => verdict === "UNVERIFIED") ||
      !acceptance.some((check) => check.evidenceLayer !== "visible-appearance" && check.verdict === "UNVERIFIED")
    ) {
      throw new Error("M2B1 sample-b overclaims the bounded control outcome");
    }
  } else {
    throw new Error("M2B1 candidate id is not opaque-plan-owned");
  }
  return clone(value);
}

function resolveInside(root, relativePath) {
  const resolved = path.resolve(root, ...relativePath.split("/"));
  const relative = path.relative(root, resolved);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error("M2B1 path escapes repository");
  }
  return resolved;
}

async function verifyPinnedFile(root, pin, label) {
  const file = resolveInside(root, pin.path);
  const stat = await lstat(file);
  const resolvedRoot = await realpath(root);
  const resolvedFile = await realpath(file);
  if (
    !stat.isFile() ||
    stat.isSymbolicLink() ||
    !resolvedFile.startsWith(`${resolvedRoot}${path.sep}`) ||
    stat.size !== pin.bytes
  ) {
    throw new Error(`${label} pin byte provenance differs`);
  }
  const bytes = await readFile(file);
  if (sha256(bytes) !== pin.sha256) throw new Error(`${label} pin hash provenance differs`);
  return { ...pin, absolutePath: file, content: bytes };
}

async function defaultGitStatus(root) {
  const result = await runBuffered("git", ["status", "--porcelain=v1"], { cwd: root });
  if (result.processExitCode !== 0 || result.stderr !== "") throw new Error("M2B1 git status failed");
  return result.stdout;
}

async function defaultGitIdentity(root, implementationCommit) {
  const headResult = await runBuffered("git", ["rev-parse", "HEAD"], { cwd: root });
  if (headResult.processExitCode !== 0 || headResult.stderr !== "") {
    throw new Error("M2B1 Git HEAD readback failed");
  }
  const head = headResult.stdout.trim();
  if (!/^[a-f0-9]{40}$/u.test(head)) throw new Error("M2B1 Git HEAD is malformed");
  const commitResult = await runBuffered(
    "git",
    ["cat-file", "-e", `${implementationCommit}^{commit}`],
    { cwd: root },
  );
  if (commitResult.processExitCode !== 0 || commitResult.stderr !== "") {
    throw new Error("M2B1 implementation commit is unavailable");
  }
  const ancestorResult = await runBuffered(
    "git",
    ["merge-base", "--is-ancestor", implementationCommit, head],
    { cwd: root },
  );
  if (ancestorResult.processExitCode !== 0 || ancestorResult.stderr !== "") {
    throw new Error("M2B1 implementation commit is not an ancestor of HEAD");
  }
  return head;
}

export async function preflightDesignVisualM2B1({
  repositoryRoot,
  planPath,
  gitStatus = defaultGitStatus,
  gitIdentity = defaultGitIdentity,
} = {}) {
  if (typeof repositoryRoot !== "string" || !path.isAbsolute(repositoryRoot)) {
    throw new TypeError("M2B1 repository root must be absolute");
  }
  const rootStat = await lstat(repositoryRoot);
  const root = await realpath(repositoryRoot);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) throw new Error("M2B1 root is unsafe");
  const planStat = await lstat(planPath);
  const resolvedPlan = await realpath(planPath);
  if (!planStat.isFile() || planStat.isSymbolicLink() || !resolvedPlan.startsWith(`${root}${path.sep}`)) {
    throw new Error("M2B1 plan path is unsafe");
  }
  const plan = validateDesignVisualM2B1Plan(JSON.parse(await readFile(resolvedPlan, "utf8")));
  if (await gitStatus(root) !== "") throw new Error("M2B1 requires a clean repository");
  const executionHead = plan.source
    ? await gitIdentity(root, plan.source.repositoryCommit)
    : null;
  const pins = {};
  for (const [key, pin] of Object.entries(plan.inputs)) {
    pins[key] = await verifyPinnedFile(root, pin, `M2B1 ${key}`);
  }
  if (plan.source) {
    for (const [key, pin] of Object.entries({
      runner: plan.source.runner,
      freshTurnAdapter: plan.source.freshTurnAdapter,
      collector: plan.source.collector,
    })) {
      await verifyPinnedFile(root, pin, `M2B1 source ${key}`);
    }
  }
  if (plan.predecessor) {
    let predecessorPlanBytes = null;
    for (const [key, pin] of Object.entries({
      plan: plan.predecessor.plan,
      blockedAttempt: plan.predecessor.blockedAttempt,
      latestReceipt: plan.predecessor.latestReceipt,
    })) {
      const verified = await verifyPinnedFile(root, pin, `M2B1 predecessor ${key}`);
      if (key === "plan") predecessorPlanBytes = verified.content;
    }
    assertUnchangedM2B1EvaluatorContract(plan, predecessorPlanBytes);
  }
  pins.candidates = [];
  for (const candidate of plan.candidates) {
    pins.candidates.push(await verifyPinnedFile(root, candidate.image, `M2B1 ${candidate.id}`));
  }
  for (const [key, output] of Object.entries(plan.outputs)) {
    const file = resolveInside(root, output);
    try {
      await lstat(file);
      throw new Error(`M2B1 output collision exists: ${key}`);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    const parent = await realpath(path.dirname(file));
    if (!parent.startsWith(`${root}${path.sep}`)) throw new Error("M2B1 output parent escapes repository");
  }
  const planBytes = await readFile(resolvedPlan);
  return {
    root,
    planPath: resolvedPlan,
    plan,
    pins,
    executionSource: plan.source
      ? {
          head: executionHead,
          plan: {
            path: path.relative(root, resolvedPlan).replaceAll(path.sep, "/"),
            bytes: planBytes.length,
            sha256: sha256(planBytes),
          },
          implementation: clone(plan.source),
        }
      : null,
  };
}

function strictObject(properties) {
  return {
    type: "object",
    properties,
    required: Object.keys(properties),
    additionalProperties: false,
  };
}

function stringArraySchema() {
  return { type: "array", items: { type: "string" } };
}

function applicabilitySchema() {
  const dimensionNames = ["variant", "state", "surface", "target"];
  const dimensionOptions = [];
  for (let mask = 1; mask < 2 ** dimensionNames.length; mask += 1) {
    const properties = {};
    dimensionNames.forEach((name, index) => {
      if ((mask & (1 << index)) !== 0) properties[name] = stringArraySchema();
    });
    dimensionOptions.push(strictObject(properties));
  }
  return {
    anyOf: [
      strictObject({ mode: { type: "string", enum: ["always"] } }),
      strictObject({
        mode: { type: "string", enum: ["match"] },
        dimensions: { anyOf: dimensionOptions },
      }),
    ],
  };
}

function designCheckSchema(semantics) {
  return strictObject({
    id: { type: "string" },
    sourceIds: stringArraySchema(),
    observableFact: { type: "string" },
    evidenceLayer: { type: "string", enum: [...EVIDENCE_LAYERS] },
    applicability: applicabilitySchema(),
    semantics: { type: "string", enum: [semantics] },
  });
}

export function designSchema() {
  const checkArray = (semantics) => ({
    type: "array",
    items: designCheckSchema(semantics),
  });
  return strictObject({
    schemaVersion: { type: "integer", enum: [5] },
    invariants: checkArray("acceptance"),
    variants: checkArray("acceptance"),
    states: checkArray("acceptance"),
    wholeFrameChecks: checkArray("acceptance"),
    focusedChecks: checkArray("acceptance"),
    unverifiedBoundaries: checkArray("boundary"),
  });
}

export function visualSchema(candidateId = null) {
  const check = strictObject({
    id: { type: "string" },
    sourceIds: stringArraySchema(),
    evidenceLayer: { type: "string", enum: [...EVIDENCE_LAYERS] },
    applicability: applicabilitySchema(),
    semantics: { type: "string", enum: ["acceptance", "boundary"] },
    expected: { type: "string" },
    scopeMatch: { type: "string", enum: ["APPLICABLE", "NOT_APPLICABLE", "UNVERIFIED"] },
    observed: { type: "string" },
    verdict: { type: "string", enum: ["PASS", "FAIL", "UNVERIFIED", "NOT_APPLICABLE"] },
  });
  return strictObject({
    candidateId: {
      type: "string",
      enum: candidateId === null ? ["sample-a", "sample-b"] : [candidateId],
    },
    claimScope: strictObject({
      variant: { type: "string", enum: ["Default"] },
      surface: { type: "string", enum: ["Collection modal"] },
    }),
    checks: {
      type: "array",
      items: check,
    },
    visibleAppearanceOverall: { type: "string", enum: ["PASS", "FAIL", "UNVERIFIED"] },
    completeContractOverall: { type: "string", enum: ["PASS", "FAIL", "UNVERIFIED"] },
  });
}

function textEntry(text) {
  return { type: "text", text };
}

function imageEntry(file) {
  return { type: "localImage", path: file };
}

function pinnedText(label, pin) {
  return `\n\n--- ${label}; bytes=${pin.bytes}; sha256=${pin.sha256} ---\n${pin.content.toString("utf8")}`;
}

function buildDesignInput(preflight, evaluatorRoot) {
  const { pins } = preflight;
  const text = [
    pins.designPrompt.content.toString("utf8"),
    pinnedText("current Design skill", pins.designSkill),
    pinnedText("authority v5", pins.authority),
    pinnedText("frozen facts v1", pins.frozenFacts),
  ].join("");
  return [textEntry(text), imageEntry(path.join(evaluatorRoot, "approved.png"))];
}

function visualTool() {
  return {
    type: "function",
    name: "design-contract",
    description: "Return the exact raw Design contract pinned by the controller.",
    inputSchema: {
      type: "object",
      properties: { contract: { type: "string", enum: ["design-raw"] } },
      required: ["contract"],
      additionalProperties: false,
    },
    deferLoading: false,
  };
}

function buildVisualInput(preflight, candidate, designRaw, evaluatorRoot) {
  const { pins, plan } = preflight;
  const candidatePin = pins.candidates.find(({ path: pinPath }) => pinPath === candidate.image.path);
  const launch = [
    pins.visualPrompt.content.toString("utf8"),
    `\n\nOpaque candidate id: ${candidate.id}`,
    `\nClaim scope: ${stableStringify(plan.claimScope)}`,
    `\nDesign raw tuple: bytes=${designRaw.byteLength}; sha256=${designRaw.sha256}`,
    `\nApproved source tuple: bytes=${pins.approvedSource.bytes}; sha256=${pins.approvedSource.sha256}`,
    `\nCandidate tuple: bytes=${candidatePin.bytes}; sha256=${candidatePin.sha256}`,
    pinnedText("current Visual Check skill", pins.visualSkill),
    pinnedText("durable evidence contract", pins.durableEvidence),
    pinnedText("concrete defect contract", pins.concreteDefect),
    pinnedText("approved reference contract", pins.approvedReference),
  ].join("");
  return [
    textEntry(launch),
    imageEntry(path.join(evaluatorRoot, "approved.png")),
    imageEntry(path.join(evaluatorRoot, "candidate.png")),
  ];
}

function assertTurnShutdown(result, session) {
  if (result?.appServer?.processExitCode !== 0 || session?.processExitCode !== 0) {
    throw new Error("M2B1 evaluator session shutdown is unverified");
  }
}

async function writeExclusive(file, value) {
  const text = typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`;
  await writeFile(file, text, { encoding: "utf8", flag: "wx" });
}

function outputFile(preflight, key) {
  return resolveInside(preflight.root, preflight.plan.outputs[key]);
}

async function verifyPreflightPins(preflight) {
  for (const [key, pin] of Object.entries(preflight.plan.inputs)) {
    await verifyPinnedFile(preflight.root, pin, `M2B1 ${key}`);
  }
  for (const candidate of preflight.plan.candidates) {
    await verifyPinnedFile(preflight.root, candidate.image, `M2B1 ${candidate.id}`);
  }
  if (preflight.plan.predecessor) {
    for (const [key, pin] of Object.entries({
      plan: preflight.plan.predecessor.plan,
      blockedAttempt: preflight.plan.predecessor.blockedAttempt,
      latestReceipt: preflight.plan.predecessor.latestReceipt,
    })) {
      await verifyPinnedFile(preflight.root, pin, `M2B1 predecessor ${key}`);
    }
  }
  if (preflight.plan.source) {
    for (const [key, pin] of Object.entries({
      runner: preflight.plan.source.runner,
      freshTurnAdapter: preflight.plan.source.freshTurnAdapter,
      collector: preflight.plan.source.collector,
    })) {
      await verifyPinnedFile(preflight.root, pin, `M2B1 source ${key}`);
    }
  }
}

export async function stageEvaluatorRoot(preflight, phase, operations = {}) {
  const makeDirectory = operations.mkdtemp ?? mkdtemp;
  const copy = operations.copyFile ?? copyFile;
  const setMode = operations.chmod ?? chmod;
  const rollbackSetMode = operations.rollbackChmod ?? chmod;
  const remove = operations.rm ?? rm;
  const inspect = operations.lstat ?? lstat;
  let root = null;
  try {
    root = await makeDirectory(path.join(tmpdir(), `joeness-m2b1-${phase}-`));
    const approved = path.join(root, "approved.png");
    await copy(preflight.pins.approvedSource.absolutePath, approved);
    await setMode(approved, 0o444);
    if (phase !== "design") {
      const candidate = preflight.plan.candidates.find(({ id }) => id === phase);
      const pin = preflight.pins.candidates.find(({ path: pinPath }) => pinPath === candidate.image.path);
      const candidateFile = path.join(root, "candidate.png");
      await copy(pin.absolutePath, candidateFile);
      await setMode(candidateFile, 0o444);
    }
    await setMode(root, 0o555);
    return { phase, runId: `${phase}-${randomUUID()}`, root };
  } catch (originalError) {
    if (root === null) throw originalError;
    const cleanupErrors = [];
    try {
      await rollbackSetMode(root, 0o755);
    } catch (error) {
      cleanupErrors.push(error);
    }
    try {
      await remove(root, { recursive: true, force: false });
    } catch (error) {
      cleanupErrors.push(error);
    }
    let readback = "retained";
    try {
      await inspect(root);
    } catch (error) {
      if (error?.code === "ENOENT") {
        readback = "absent";
      } else {
        readback = "unknown";
        cleanupErrors.push(error);
      }
    }
    const stagingEvidence = {
      root,
      rollback: {
        attempted: true,
        readback,
        cleanupErrors: cleanupErrors.map((error) => String(error?.message ?? error)),
      },
    };
    if (readback === "absent") {
      originalError.stagingEvidence = stagingEvidence;
      throw originalError;
    }
    const rollbackError = cleanupErrors.length === 1
      ? cleanupErrors[0]
      : new AggregateError(cleanupErrors, "M2B1 staging rollback failed");
    const failure = new AggregateError(
      [originalError, rollbackError],
      "M2B1 evaluator root staging and rollback failed",
      { cause: originalError },
    );
    failure.stagingEvidence = stagingEvidence;
    throw failure;
  }
}

async function rootReadback(staged) {
  try {
    await lstat(staged.root);
    return { phase: staged.phase, runId: staged.runId, root: staged.root, readback: "retained" };
  } catch (error) {
    return {
      phase: staged.phase,
      runId: staged.runId,
      root: staged.root,
      readback: error?.code === "ENOENT" ? "removed" : "unknown",
    };
  }
}

async function inspectEvaluatorRoots(stagedRoots) {
  return Promise.all(stagedRoots.map(rootReadback));
}

async function removeEvaluatorRoots(stagedRoots) {
  const errors = [];
  const evidence = [];
  for (const staged of stagedRoots) {
    try {
      await chmod(staged.root, 0o755);
    } catch (error) {
      errors.push(error);
    }
    try {
      await rm(staged.root, { recursive: true, force: false });
    } catch (error) {
      errors.push(error);
    }
    const readback = await rootReadback(staged);
    evidence.push(readback);
    if (readback.readback !== "removed") {
      errors.push(new Error(`M2B1 evaluator root was ${readback.readback}: ${staged.root}`));
    }
  }
  if (errors.length > 0) {
    const error = errors.length === 1
      ? errors[0]
      : new AggregateError(errors, "M2B1 evaluator root cleanup failed", { cause: errors[0] });
    error.stagedRootEvidence = evidence;
    throw error;
  }
  return evidence;
}

function diagnosticContainer(value) {
  return value !== null && (typeof value === "object" || typeof value === "function");
}

function diagnosticProxy(value) {
  return diagnosticContainer(value) && utilTypes.isProxy(value);
}

function safeDiagnosticOwnData(value, key) {
  if (diagnosticProxy(value)) {
    return { found: false, value: undefined, unsupported: "proxy" };
  }
  return diagnosticOwnData(value, key);
}

function preserveSanitizedDiagnostic(value, limitBytes) {
  if (!diagnosticContainer(value) || diagnosticProxy(value)) return null;
  const text = safeDiagnosticOwnData(value, "text");
  const head = safeDiagnosticOwnData(value, "head");
  const tail = safeDiagnosticOwnData(value, "tail");
  const byteLength = safeDiagnosticOwnData(value, "byteLength");
  const digestProperty = safeDiagnosticOwnData(value, "sha256");
  const truncated = safeDiagnosticOwnData(value, "truncated");
  const redacted = safeDiagnosticOwnData(value, "redacted");
  const unsupported = safeDiagnosticOwnData(value, "unsupported");
  const budgetExceeded = safeDiagnosticOwnData(value, "budgetExceeded");
  const validFlags =
    typeof truncated.value === "boolean" &&
    typeof redacted.value === "boolean" &&
    typeof unsupported.value === "boolean" &&
    typeof digestProperty.value === "string" &&
    /^[a-f0-9]{64}$/u.test(digestProperty.value);
  if (!validFlags) return null;
  if (text.found && typeof text.value === "string") {
    const safe = sanitizeDiagnosticEvidence(text.value, limitBytes);
    if (safe.text !== text.value || safe.truncated) return safe;
    const textBytes = Buffer.byteLength(text.value);
    const normalTuple =
      truncated.value === false &&
      Number.isSafeInteger(byteLength.value) &&
      byteLength.value === textBytes &&
      digestProperty.value === sha256(text.value) &&
      !budgetExceeded.found;
    const budgetTuple =
      text.value === "[TRUNCATED:diagnostic-budget]" &&
      truncated.value === true &&
      redacted.value === true &&
      unsupported.value === true &&
      budgetExceeded.value === true &&
      (byteLength.value === null || Number.isSafeInteger(byteLength.value)) &&
      digestProperty.value === sha256(text.value);
    if (!normalTuple && !budgetTuple) return null;
    return {
      text: text.value,
      byteLength: byteLength.value,
      sha256: digestProperty.value,
      truncated: truncated.value,
      redacted: redacted.value || safe.redacted,
      unsupported: unsupported.value || safe.unsupported,
      ...(budgetTuple ? { budgetExceeded: true } : {}),
    };
  }
  if (
    head.found &&
    tail.found &&
    typeof head.value === "string" &&
    typeof tail.value === "string" &&
    truncated.value === true &&
    Number.isSafeInteger(byteLength.value) &&
    byteLength.value >= Buffer.byteLength(head.value) + Buffer.byteLength(tail.value)
  ) {
    const safeHead = sanitizeDiagnosticEvidence(head.value, limitBytes);
    const safeTail = sanitizeDiagnosticEvidence(tail.value, limitBytes);
    const retainedHead = safeHead.text ?? `${safeHead.head ?? ""}${safeHead.tail ?? ""}`;
    const retainedTail = safeTail.text ?? `${safeTail.head ?? ""}${safeTail.tail ?? ""}`;
    return {
      head: retainedHead,
      tail: retainedTail,
      byteLength: byteLength.value,
      sha256: digestProperty.value,
      truncated: true,
      redacted: redacted.value || safeHead.redacted || safeTail.redacted,
      unsupported: unsupported.value || safeHead.unsupported || safeTail.unsupported,
      ...(budgetExceeded.value === true ? { budgetExceeded: true } : {}),
    };
  }
  return null;
}

function retainDiagnosticValue(value, _label, limitBytes = 1024) {
  if (
    value === null ||
    typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value))
  ) {
    return value;
  }
  if (diagnosticProxy(value)) {
    return sanitizeDiagnosticEvidence("[UNSUPPORTED:proxy]", limitBytes);
  }
  if (diagnosticContainer(value)) {
    const preserved = preserveSanitizedDiagnostic(value, limitBytes);
    if (preserved !== null) return preserved;
  }
  return sanitizeDiagnosticEvidence(value, limitBytes);
}

function sanitizedCause(error, depth = 0, seen = new Set()) {
  if (error === null || (typeof error !== "object" && typeof error !== "function")) {
    return { value: sanitizeDiagnosticEvidence(error) };
  }
  if (diagnosticProxy(error)) {
    return { value: sanitizeDiagnosticEvidence("[UNSUPPORTED:proxy]") };
  }
  if (seen.has(error)) return { cycle: true };
  if (depth >= 3) return { depthLimitReached: true };
  seen.add(error);
  const cause = {};
  for (const key of ["name", "code", "message", "details"]) {
    const property = safeDiagnosticOwnData(error, key);
    if (property.found) cause[key] = sanitizeDiagnosticEvidence(property.value);
  }
  const nested = safeDiagnosticOwnData(error, "cause");
  if (nested.found) {
    cause.cause = nested.value !== null &&
        (typeof nested.value === "object" || typeof nested.value === "function")
      ? sanitizedCause(nested.value, depth + 1, seen)
      : { value: sanitizeDiagnosticEvidence(nested.value) };
  }
  return cause;
}

function diagnosticArrayLength(value) {
  if (diagnosticProxy(value)) return null;
  try {
    if (!Array.isArray(value)) return null;
  } catch {
    return null;
  }
  const lengthProperty = safeDiagnosticOwnData(value, "length");
  return Number.isSafeInteger(lengthProperty.value) && lengthProperty.value >= 0
    ? lengthProperty.value
    : null;
}

function diagnosticArrayEntries(value, indices) {
  const entries = [];
  for (const index of indices) {
    const item = safeDiagnosticOwnData(value, String(index));
    if (item.found) entries.push({ index, value: item.value });
  }
  return entries;
}

function boundedArrayPrefix(value, limit = 16) {
  const count = diagnosticArrayLength(value);
  if (count === null) return { count: null, entries: [] };
  const indices = Array.from({ length: Math.min(count, limit) }, (_, index) => index);
  return { count, entries: diagnosticArrayEntries(value, indices) };
}

function diagnosticEventWindows(value) {
  const count = diagnosticArrayLength(value);
  if (count === null) {
    return {
      count: null,
      scanIndices: [],
      scannedEntries: [],
      headEntries: [],
      tailEntries: [],
    };
  }
  const headIndices = Array.from({ length: Math.min(count, 2) }, (_, index) => index);
  const tailStart = Math.max(headIndices.length, count - 2);
  const tailIndices = Array.from(
    { length: Math.max(0, count - tailStart) },
    (_, index) => tailStart + index,
  );
  const scanHead = Array.from({ length: Math.min(count, 256) }, (_, index) => index);
  const scanTailStart = Math.max(scanHead.length, count - 256);
  const scanTail = Array.from(
    { length: Math.max(0, count - scanTailStart) },
    (_, index) => scanTailStart + index,
  );
  const scanIndices = [...new Set([...scanHead, ...scanTail])];
  return {
    count,
    scanIndices,
    scannedEntries: diagnosticArrayEntries(value, scanIndices),
    headEntries: diagnosticArrayEntries(value, headIndices),
    tailEntries: diagnosticArrayEntries(value, tailIndices),
  };
}

function retainDiagnosticRecord(value, label) {
  if (diagnosticProxy(value)) {
    return { value: sanitizeDiagnosticEvidence("[UNSUPPORTED:proxy]") };
  }
  if (!diagnosticContainer(value)) return { value: retainDiagnosticValue(value, label) };
  const record = {};
  for (const key of ["name", "code", "message", "details"]) {
    const property = safeDiagnosticOwnData(value, key);
    if (property.found) {
      record[key] = retainDiagnosticValue(property.value, `${label} ${key}`, 1024);
    }
  }
  return record;
}

function retainFailureEvent(value) {
  if (diagnosticProxy(value)) {
    return { unavailable: sanitizeDiagnosticEvidence("[UNSUPPORTED:proxy]") };
  }
  if (!diagnosticContainer(value)) {
    return { unavailable: retainDiagnosticValue(value, "failure event", 256) };
  }
  const retained = {};
  for (const key of ["method", "threadId", "turnId", "complete", "postTerminal"]) {
    const property = safeDiagnosticOwnData(value, key);
    if (property.found) {
      retained[key] = retainDiagnosticValue(property.value, `failure event ${key}`, 256);
    }
  }
  const blockers = safeDiagnosticOwnData(value, "blockers");
  if (blockers.found) {
    const prefix = boundedArrayPrefix(blockers.value, 4);
    retained.blockers = prefix.entries
      .map(({ value: item }) => retainDiagnosticValue(item, "failure event blocker", 256));
    retained.blockerArrayLength = prefix.count ?? "UNVERIFIED";
  }
  const turn = safeDiagnosticOwnData(value, "turn");
  if (turn.found && diagnosticContainer(turn.value)) {
    retained.turn = {};
    for (const key of ["id", "status"]) {
      const property = safeDiagnosticOwnData(turn.value, key);
      if (property.found) {
        retained.turn[key] = retainDiagnosticValue(property.value, `failure turn ${key}`, 256);
      }
    }
  }
  const item = safeDiagnosticOwnData(value, "item");
  if (item.found && diagnosticContainer(item.value)) {
    retained.item = {};
    for (const key of ["id", "type", "tool", "status", "success"]) {
      const property = safeDiagnosticOwnData(item.value, key);
      if (property.found) {
        retained.item[key] = retainDiagnosticValue(property.value, `failure item ${key}`, 256);
      }
    }
  }
  const runtimeError = safeDiagnosticOwnData(value, "runtimeError");
  if (runtimeError.found) {
    retained.runtimeError = retainDiagnosticRecord(runtimeError.value, "runtime error");
  }
  return retained;
}

function retainFailureObjectFields(value, fields, label) {
  if (diagnosticProxy(value)) {
    return { value: sanitizeDiagnosticEvidence("[UNSUPPORTED:proxy]") };
  }
  if (!diagnosticContainer(value)) return {};
  const retained = {};
  for (const key of fields) {
    const property = safeDiagnosticOwnData(value, key);
    if (property.found) {
      retained[key] = retainDiagnosticValue(property.value, `${label} ${key}`, 2048);
    }
  }
  return retained;
}

function retainAppServerStderr(value) {
  if (diagnosticProxy(value) || !diagnosticContainer(value)) {
    return { diagnostic: sanitizeDiagnosticEvidence("[UNSUPPORTED:stderr]") };
  }
  const retained = {};
  const byteLength = safeDiagnosticOwnData(value, "byteLength");
  retained.byteLength = Number.isSafeInteger(byteLength.value) && byteLength.value >= 0
    ? byteLength.value
    : "UNVERIFIED";
  const digest = safeDiagnosticOwnData(value, "sha256");
  retained.sha256 = typeof digest.value === "string" && /^[a-f0-9]{64}$/u.test(digest.value)
    ? digest.value
    : "UNVERIFIED";
  for (const key of ["truncated", "captureTruncated"]) {
    const property = safeDiagnosticOwnData(value, key);
    retained[key] = typeof property.value === "boolean" ? property.value : "UNVERIFIED";
  }
  const diagnostic = safeDiagnosticOwnData(value, "diagnostic");
  if (diagnostic.found) {
    retained.diagnostic = preserveSanitizedDiagnostic(diagnostic.value, 16 * 1024) ??
      sanitizeDiagnosticEvidence("[UNSUPPORTED:stderr-diagnostic]");
  }
  return retained;
}

function retainAppServer(value) {
  const retained = retainFailureObjectFields(
    value,
    ["processExitCode", "remoteControl"],
    "App Server",
  );
  const stderr = safeDiagnosticOwnData(value, "stderr");
  if (stderr.found) retained.stderr = retainAppServerStderr(stderr.value);
  return retained;
}

function minimalPartialEvidence(value, projectionError = null) {
  const primaryCauseProperty = safeDiagnosticOwnData(value, "primaryCause");
  const blockersProperty = safeDiagnosticOwnData(value, "blockers");
  const blockers = boundedArrayPrefix(blockersProperty.found ? blockersProperty.value : [], 8);
  const appServerProperty = safeDiagnosticOwnData(value, "appServer");
  const eventsProperty = safeDiagnosticOwnData(value, "events");
  const eventCount = diagnosticArrayLength(eventsProperty.found ? eventsProperty.value : []);
  return {
    retention: "minimal",
    primaryCause: primaryCauseProperty.found
      ? retainDiagnosticRecord(primaryCauseProperty.value, "primary cause")
      : {},
    blockers: blockers.entries.map(({ value: item }) =>
      retainDiagnosticValue(item, "failure blocker", 256)),
    blockerArrayLength: blockers.count ?? "UNVERIFIED",
    appServer: appServerProperty.found
      ? retainAppServer(appServerProperty.value)
      : {},
    events: { arrayLength: eventCount ?? "UNVERIFIED" },
    projectionError: projectionError === null
      ? null
      : sanitizedCause(projectionError),
  };
}

function prioritizedPartialEvidence(value) {
  const eventsProperty = safeDiagnosticOwnData(value, "events");
  const events = diagnosticEventWindows(eventsProperty.found ? eventsProperty.value : []);
  const eventHead = events.headEntries.map(({ value }) => retainFailureEvent(value));
  const eventTail = events.tailEntries.map(({ value }) => retainFailureEvent(value));
  const observedRuntimeErrors = events.scannedEntries
    .map(({ value: event }) => safeDiagnosticOwnData(event, "runtimeError"))
    .filter(({ found }) => found)
    .map(({ value: runtimeError }) => retainDiagnosticRecord(runtimeError, "runtime error"));
  const primaryCauseProperty = safeDiagnosticOwnData(value, "primaryCause");
  const blockersProperty = safeDiagnosticOwnData(value, "blockers");
  const blockers = boundedArrayPrefix(blockersProperty.found ? blockersProperty.value : [], 16);
  const appServerProperty = safeDiagnosticOwnData(value, "appServer");
  const threadProperty = safeDiagnosticOwnData(value, "thread");
  const turnProperty = safeDiagnosticOwnData(value, "turn");
  const inputProperty = safeDiagnosticOwnData(value, "input");
  const outputSchemaProperty = safeDiagnosticOwnData(value, "outputSchema");
  const projection = {
    retention: "prioritized",
    primaryCause: primaryCauseProperty.found
      ? retainDiagnosticRecord(primaryCauseProperty.value, "primary cause")
      : {},
    runtimeErrors: {
      records: observedRuntimeErrors.slice(0, 4),
      observedCount: observedRuntimeErrors.length,
      omittedObservedCount: Math.max(0, observedRuntimeErrors.length - 4),
      scanIndexCount: events.scanIndices.length,
      observedEventCount: events.scannedEntries.length,
      unscannedIndexCount: events.count === null
        ? "UNVERIFIED"
        : Math.max(0, events.count - events.scanIndices.length),
      totalCount: "UNVERIFIED",
    },
    blockers: blockers.entries.map(({ value: item }) =>
      retainDiagnosticValue(item, "failure blocker", 512)),
    blockerArrayLength: blockers.count ?? "UNVERIFIED",
    appServer: appServerProperty.found
      ? retainAppServer(appServerProperty.value)
      : {},
    thread: threadProperty.found
      ? retainFailureObjectFields(threadProperty.value, ["id"], "thread")
      : {},
    turn: turnProperty.found
      ? retainFailureObjectFields(turnProperty.value, ["id"], "turn")
      : {},
    input: inputProperty.found
      ? retainFailureObjectFields(inputProperty.value, ["requestSha256", "descriptors"], "input")
      : {},
    outputSchema: outputSchemaProperty.found
      ? retainFailureObjectFields(outputSchemaProperty.value, ["byteLength", "sha256"], "output schema")
      : {},
    events: {
      arrayLength: events.count ?? "UNVERIFIED",
      scanIndexCount: events.scanIndices.length,
      observedEventCount: events.scannedEntries.length,
      window: {
        head: eventHead,
        headIndices: events.headEntries.map(({ index }) => index),
        tail: eventTail,
        tailIndices: events.tailEntries.map(({ index }) => index),
      },
      windowOmittedIndexCount: events.count === null
        ? "UNVERIFIED"
        : Math.max(0, events.count - eventHead.length - eventTail.length),
    },
  };
  projection.events.windowSha256 = sha256(stableStringify({
    arrayLength: projection.events.arrayLength,
    scanIndexCount: projection.events.scanIndexCount,
    observedEventCount: projection.events.observedEventCount,
    window: projection.events.window,
    windowOmittedIndexCount: projection.events.windowOmittedIndexCount,
  }));
  try {
    return safeBoundedClone(projection, "prioritized partial", 80 * 1024);
  } catch (error) {
    return minimalPartialEvidence(value, error);
  }
}

function retainPartialEvidence(value) {
  if (!diagnosticContainer(value)) return {};
  try {
    return safePartialEvidenceClone(value, 128 * 1024);
  } catch {
    try {
      return prioritizedPartialEvidence(value);
    } catch (error) {
      return minimalPartialEvidence(value, error);
    }
  }
}

function scalarIdentity(value, label) {
  if ((typeof value !== "string" || !value) && !Number.isSafeInteger(value)) {
    throw new Error(`M2B1 ${label} identity is missing`);
  }
  return String(value);
}

function buildEvaluatorIdentity(phase, staged, session, result) {
  return {
    phase,
    runId: scalarIdentity(staged.runId, "run"),
    evaluatorRoot: staged.root,
    sessionId: scalarIdentity(session?.id ?? session?.process?.pid, "session"),
    threadId: scalarIdentity(result?.thread?.id, "thread"),
    turnId: scalarIdentity(result?.turn?.id, "turn"),
  };
}

function validateEvaluatorIdentities(identities) {
  if (
    identities.length !== 3 ||
    stableStringify(identities.map(({ phase }) => phase)) !==
      stableStringify(["design", "sample-a", "sample-b"])
  ) {
    throw new Error("M2B1 evaluator identity order is invalid");
  }
  for (const field of ["runId", "evaluatorRoot", "sessionId", "threadId", "turnId"]) {
    if (new Set(identities.map((identity) => identity[field])).size !== identities.length) {
      throw new Error(`M2B1 evaluator ${field} identity was reused`);
    }
  }
  return clone(identities);
}

function safeBoundedClone(value, label, limitBytes = 64 * 1024) {
  const serialized = stableStringify(value);
  if (
    serialized === undefined ||
    Buffer.byteLength(serialized) > limitBytes ||
    containsCredentialText(value)
  ) {
    throw new Error(`M2B1 ${label} evidence is unsafe or unbounded`);
  }
  return JSON.parse(serialized);
}

function cloneDataWithoutAccessors(value, state = { nodes: 0, seen: new Set() }, depth = 0) {
  state.nodes += 1;
  if (state.nodes > 4096 || depth > 16) {
    throw new Error("M2B1 partial evidence structure is too broad or deep");
  }
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value))
  ) {
    return value;
  }
  if (typeof value !== "object" || utilTypes.isProxy(value)) {
    throw new Error("M2B1 partial evidence value is unsupported");
  }
  if (state.seen.has(value)) throw new Error("M2B1 partial evidence is cyclic");
  state.seen.add(value);
  let isArray;
  let prototype;
  let keys;
  try {
    isArray = Array.isArray(value);
    prototype = Object.getPrototypeOf(value);
    keys = Object.keys(value);
  } catch {
    throw new Error("M2B1 partial evidence reflection failed");
  }
  if (!isArray && prototype !== Object.prototype && prototype !== null) {
    throw new Error("M2B1 partial evidence object is not plain data");
  }
  if (keys.length > 1024) {
    throw new Error("M2B1 partial evidence has too many keys");
  }
  if (isArray) {
    const length = safeDiagnosticOwnData(value, "length");
    if (
      !Number.isSafeInteger(length.value) ||
      length.value < 0 ||
      length.value > 1024 ||
      keys.length !== length.value ||
      Array.from({ length: length.value }, (_, index) => String(index))
        .some((key, index) => keys[index] !== key)
    ) {
      throw new Error("M2B1 partial evidence array is sparse or too large");
    }
  }
  const output = isArray ? [] : Object.create(null);
  for (const key of keys) {
    let descriptor;
    try {
      descriptor = Object.getOwnPropertyDescriptor(value, key);
    } catch {
      throw new Error("M2B1 partial evidence descriptor failed");
    }
    if (!descriptor || !Object.hasOwn(descriptor, "value")) {
      throw new Error("M2B1 partial evidence accessor is unsupported");
    }
    output[key] = cloneDataWithoutAccessors(descriptor.value, state, depth + 1);
  }
  state.seen.delete(value);
  return output;
}

function safePartialEvidenceClone(value, limitBytes) {
  const cloned = cloneDataWithoutAccessors(value);
  return safeBoundedClone(cloned, "partial", limitBytes);
}

function retainInputEvidence(input) {
  if (!isObject(input) || !Array.isArray(input.descriptors)) {
    throw new Error("M2B1 Task 1 input evidence is malformed");
  }
  const descriptors = input.descriptors.map((descriptor) => {
    if (!isObject(descriptor)) throw new Error("M2B1 Task 1 input descriptor is malformed");
    const retained = {
      index: descriptor.index,
      type: descriptor.type,
      byteLength: descriptor.byteLength,
      sha256: descriptor.sha256,
    };
    if (descriptor.type === "localImage") {
      retained.path = descriptor.path;
      retained.originalDetail = descriptor.originalDetail;
    }
    return retained;
  });
  return safeBoundedClone({
    descriptors,
    requestSha256: input.requestSha256,
  }, "input", 32 * 1024);
}

function retainLifecycleEvent(event) {
  if (!isObject(event)) throw new Error("M2B1 Task 1 lifecycle event is malformed");
  const retained = {
    method: event.method,
    threadId: event.threadId,
    turnId: event.turnId,
    complete: event.complete,
    blockers: Array.isArray(event.blockers) ? event.blockers : [],
  };
  if (event.postTerminal === true) retained.postTerminal = true;
  if (isObject(event.turn)) {
    retained.turn = { id: event.turn.id, status: event.turn.status };
  }
  if (isObject(event.item)) {
    retained.item = {
      id: event.item.id,
      type: event.item.type,
      tool: event.item.tool,
      status: event.item.status,
    };
    if (typeof event.item.success === "boolean") retained.item.success = event.item.success;
    if (typeof event.item.argumentsSha256 === "string") {
      retained.item.argumentsSha256 = event.item.argumentsSha256;
    }
    if (isObject(event.item.response)) {
      retained.item.response = {
        byteLength: event.item.response.byteLength,
        sha256: event.item.response.sha256,
      };
    }
  }
  if (isObject(event.runtimeError)) {
    retained.runtimeError = safeBoundedClone(event.runtimeError, "runtime error", 8 * 1024);
  }
  return retained;
}

function retainToolEvidence(toolEvidence) {
  if (!Array.isArray(toolEvidence) || toolEvidence.length > 16) {
    throw new Error("M2B1 Task 1 tool evidence is malformed or unbounded");
  }
  return safeBoundedClone(toolEvidence.map((entry) => ({
    callId: entry.callId,
    tool: entry.tool,
    arguments: entry.arguments,
    argumentsSha256: entry.argumentsSha256,
    status: entry.status,
    response: isObject(entry.response)
      ? { byteLength: entry.response.byteLength, sha256: entry.response.sha256 }
      : null,
  })), "tool", 32 * 1024);
}

function retainTask1Evidence(result) {
  if (
    !Array.isArray(result.events) ||
    result.events.length > 512 ||
    !Array.isArray(result.mcpAfter) ||
    result.mcpAfter.length > 128 ||
    !Array.isArray(result.blockers) ||
    result.blockers.length !== 0 ||
    !isObject(result.outputSchema)
  ) {
    throw new Error("M2B1 Task 1 evidence is incomplete, blocked, or unbounded");
  }
  const eventRecords = result.events.map(retainLifecycleEvent);
  const mcpRecords = safeBoundedClone(result.mcpAfter, "MCP after", 32 * 1024);
  return safeBoundedClone({
    threadStart: result.threadStart ?? null,
    thread: result.thread ?? null,
    turn: isObject(result.turn) ? { id: result.turn.id } : null,
    input: retainInputEvidence(result.input),
    outputSchema: {
      byteLength: result.outputSchema.byteLength,
      sha256: result.outputSchema.sha256,
    },
    events: {
      records: eventRecords,
      count: eventRecords.length,
      sha256: sha256(stableStringify(eventRecords)),
    },
    toolEvidence: retainToolEvidence(result.toolEvidence),
    mcpAfter: {
      records: mcpRecords,
      count: mcpRecords.length,
      sha256: sha256(stableStringify(mcpRecords)),
    },
    blockers: [],
    appServer: result.appServer ?? null,
  }, "Task 1", 256 * 1024);
}

async function defaultRuntimeFactory(plan) {
  const runRoot = await createExclusiveRunRoot(`design-visual-m2-b1-${Date.now()}`);
  const runtime = await prepareRuntime(runRoot, { expectedCodexVersion: plan.runtime.codexVersion });
  return {
    createSession: () => openAppServer(runtime),
    async finish(safe) {
      if (!safe) return;
      await removeIsolatedCodexHome(runRoot, runtime.isolatedCodexHome);
      await rm(runRoot, { recursive: true, force: false });
    },
  };
}

function verifiedFailureShutdown(error, session) {
  return error?.freshEvaluatorEvidence?.appServer?.processExitCode === 0 || session?.processExitCode === 0;
}

export async function runDesignVisualM2B1({
  repositoryRoot,
  planPath,
  gitStatus = defaultGitStatus,
  gitIdentity = defaultGitIdentity,
  createSession,
  finishRuntime,
  runTurn = runFreshEvaluatorTurn,
  writeArtifact = writeExclusive,
} = {}) {
  const preflight = await preflightDesignVisualM2B1({
    repositoryRoot,
    planPath,
    gitStatus,
    gitIdentity,
  });
  let runtimeFactory = null;
  if (typeof createSession !== "function") {
    runtimeFactory = await defaultRuntimeFactory(preflight.plan);
    createSession = runtimeFactory.createSession;
    finishRuntime ??= runtimeFactory.finish;
  }
  finishRuntime ??= async () => {};
  if (
    typeof runTurn !== "function" ||
    typeof writeArtifact !== "function" ||
    typeof finishRuntime !== "function"
  ) {
    throw new TypeError("M2B1 orchestration dependencies are malformed");
  }
  const sessions = [];
  const completed = [];
  const stagedRoots = [];
  const identities = [];
  let activeSession = null;
  let safeShutdown = true;
  let finishAttempted = false;
  let cleanupEvidence = null;

  async function finishOnce(safe) {
    if (finishAttempted) return cleanupEvidence;
    finishAttempted = true;
    const errors = [];
    let runtime;
    try {
      const available = await finishRuntime(safe);
      runtime = {
        status: "completed",
        ...(available === undefined
          ? {}
          : { available: sanitizeDiagnosticEvidence(available, 16 * 1024) }),
      };
    } catch (error) {
      errors.push(error);
      const available = diagnosticOwnData(error, "runtimeCleanupEvidence");
      runtime = {
        status: "failed",
        ...(available.found
          ? { available: sanitizeDiagnosticEvidence(available.value, 16 * 1024) }
          : {}),
      };
    }
    let stagedRootEvidence;
    if (safe) {
      try {
        stagedRootEvidence = await removeEvaluatorRoots(stagedRoots);
      } catch (error) {
        errors.push(error);
        stagedRootEvidence = Array.isArray(error?.stagedRootEvidence)
          ? clone(error.stagedRootEvidence)
          : await inspectEvaluatorRoots(stagedRoots);
      }
    } else {
      stagedRootEvidence = await inspectEvaluatorRoots(stagedRoots);
    }
    cleanupEvidence = {
      phase: "post-evaluator-cleanup",
      finishAttempts: 1,
      safeShutdownRequested: safe,
      runtime,
      stagedRoots: stagedRootEvidence,
      ...(errors.length > 0 ? { cause: sanitizedCause(errors[0]) } : {}),
    };
    if (errors.length > 0) {
      const failure = errors.length === 1
        ? errors[0]
        : new AggregateError(errors, "M2B1 runtime cleanup failed", { cause: errors[0] });
      failure.cleanupEvidence = cleanupEvidence;
      throw failure;
    }
    return cleanupEvidence;
  }

  function registerSession(session) {
    if (sessions.includes(session)) throw new Error("M2B1 evaluator session object was reused");
    sessions.push(session);
    return session;
  }

  try {
    await verifyPreflightPins(preflight);
    const designRoot = await stageEvaluatorRoot(preflight, "design");
    stagedRoots.push(designRoot);
    activeSession = registerSession(await createSession({ phase: "design", runId: designRoot.runId }));
    const designResult = await runTurn({
      session: activeSession,
      root: designRoot.root,
      input: buildDesignInput(preflight, designRoot.root),
      outputSchema: designSchema(),
    });
    assertTurnShutdown(designResult, activeSession);
    const designIdentity = buildEvaluatorIdentity("design", designRoot, activeSession, designResult);
    identities.push(designIdentity);
    const designEvidence = retainTask1Evidence(designResult);
    completed.push("design");
    const designRaw = {
      text: designResult.outputText.text,
      byteLength: Buffer.byteLength(designResult.outputText.text),
      sha256: sha256(designResult.outputText.text),
    };
    if (
      designRaw.byteLength !== designResult.outputText.byteLength ||
      designRaw.sha256 !== designResult.outputText.sha256
    ) {
      throw new Error("M2B1 Design raw tuple differs from adapter evidence");
    }
    const design = validateDesignM2B1Output(JSON.parse(designRaw.text));
    const visuals = [];
    for (const candidate of preflight.plan.candidates) {
      await verifyPreflightPins(preflight);
      const visualRoot = await stageEvaluatorRoot(preflight, candidate.id);
      stagedRoots.push(visualRoot);
      activeSession = registerSession(await createSession({ phase: "visual", candidateId: candidate.id, runId: visualRoot.runId }));
      const dynamicTools = [visualTool()];
      const visualResult = await runTurn({
        session: activeSession,
        root: visualRoot.root,
        input: buildVisualInput(preflight, candidate, designRaw, visualRoot.root),
        outputSchema: visualSchema(candidate.id),
        dynamicTools,
        dynamicToolController: async ({ tool, arguments: argumentsValue }) => {
          if (
            tool !== "design-contract" ||
            !exactKeys(argumentsValue, ["contract"]) ||
            argumentsValue.contract !== "design-raw"
          ) {
            throw new Error("M2B1 Design contract request is malformed");
          }
          return { success: true, contentItems: [{ type: "inputText", text: designRaw.text }] };
        },
      });
      assertTurnShutdown(visualResult, activeSession);
      const identity = buildEvaluatorIdentity(candidate.id, visualRoot, activeSession, visualResult);
      identities.push(identity);
      completed.push(candidate.id);
      if (
        visualResult.toolEvidence?.length !== 1 ||
        visualResult.toolEvidence[0].tool !== "design-contract" ||
        visualResult.toolEvidence[0].status !== "completed" ||
        visualResult.toolEvidence[0].response?.byteLength !== designRaw.byteLength ||
        visualResult.toolEvidence[0].response?.sha256 !== designRaw.sha256
      ) {
        throw new Error("M2B1 Visual Design handoff hash differs");
      }
      const parsed = JSON.parse(visualResult.outputText.text);
      const output = validateVisualM2B1Output(parsed, design, candidate.id);
      visuals.push({
        candidateId: candidate.id,
        designRaw: { byteLength: designRaw.byteLength, sha256: designRaw.sha256 },
        raw: clone(visualResult.outputText),
        output,
        identity,
        evidence: retainTask1Evidence(visualResult),
      });
    }
    await verifyPreflightPins(preflight);
    const evaluatorIdentities = validateEvaluatorIdentities(identities);
    const handoff = {
      schemaVersion: 1,
      designRaw: { byteLength: designRaw.byteLength, sha256: designRaw.sha256 },
      identity: designIdentity,
      evidence: designEvidence,
      sections: clone(design),
    };
    const summary = {
      schemaVersion: 1,
      id: `design-visual-m2-b1-v${preflight.plan.schemaVersion}-summary`,
      executionStatus: "completed",
      m2b1Status: "partial-unvalidated",
      promotionPass: false,
      sessionOrder: [...completed],
      originalDetail: "UNVERIFIED",
      claimScope: clone(preflight.plan.claimScope),
      ...(preflight.executionSource
        ? { executionSource: clone(preflight.executionSource) }
        : {}),
      designRaw: handoff.designRaw,
      evaluatorIdentities,
      outcomes: visuals.map(({ candidateId, output }) => ({
        candidateId,
        visibleAppearanceOverall: output.visibleAppearanceOverall,
        completeContractOverall: output.completeContractOverall,
      })),
    };
    const writes = [
      ["designRaw", designRaw.text],
      ["designHandoff", handoff],
      ["sampleARaw", visuals[0].raw.text],
      ["sampleAEnvelope", visuals[0]],
      ["sampleBRaw", visuals[1].raw.text],
      ["sampleBEnvelope", visuals[1]],
      ["summary", summary],
    ];
    await finishOnce(true);
    for (const [key, value] of writes) await writeArtifact(outputFile(preflight, key), value);
    return {
      executionStatus: "completed",
      m2b1Status: "partial-unvalidated",
      promotionPass: false,
      design: { raw: handoff.designRaw, output: design, identity: designIdentity, evidence: designEvidence },
      visuals,
      summary,
    };
  } catch (error) {
    safeShutdown =
      (activeSession === null || verifiedFailureShutdown(error, activeSession)) &&
      sessions.every((session) => session?.processExitCode === 0);
    try {
      await finishOnce(safeShutdown);
    } catch (cleanupError) {
      cleanupEvidence = cleanupError?.cleanupEvidence ?? cleanupEvidence;
    }
    if (safeShutdown) {
      const blocked = {
        schemaVersion: 1,
        id: `design-visual-m2-b1-v${preflight.plan.schemaVersion}-blocked`,
        status: "blocked",
        completedSessions: [...completed],
        failedSession: sessions.length,
        error: sanitizedCause(error),
        ...(preflight.executionSource
          ? { executionSource: clone(preflight.executionSource) }
          : {}),
        partialEvidence: retainPartialEvidence(error?.freshEvaluatorEvidence),
        cleanupEvidence: clone(cleanupEvidence ?? {
          phase: "post-evaluator-cleanup",
          finishAttempts: finishAttempted ? 1 : 0,
          safeShutdownRequested: safeShutdown,
          runtime: { status: "not-attempted" },
          stagedRoots: await inspectEvaluatorRoots(stagedRoots),
        }),
        retryCount: 0,
        evaluatorIdentities: clone(identities),
      };
      try {
        await writeArtifact(outputFile(preflight, "blocked"), blocked);
      } catch (writeError) {
        error.blockedArtifactError = writeError;
      }
    }
    throw error;
  }
}

async function main() {
  const [planArgument] = process.argv.slice(2);
  if (!planArgument) throw new Error("usage: node run-design-visual-m2-b1.mjs <repository-relative-plan>");
  const repositoryRoot = process.cwd();
  const result = await runDesignVisualM2B1({
    repositoryRoot,
    planPath: path.resolve(repositoryRoot, planArgument),
  });
  process.stdout.write(`${JSON.stringify(result.summary)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error}\n`);
    process.exitCode = 1;
  });
}
