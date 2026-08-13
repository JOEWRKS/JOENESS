import { lstat, mkdir, readFile, realpath, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  createExclusiveRunRoot,
  openAppServer,
  prepareRuntime,
  removeIsolatedCodexHome,
  runBuffered,
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
  if (!exactKeys(value, [
    "schemaVersion", "id", "date", "runtime", "inputs", "candidates",
    "claimScope", "originalDetail", "outputs", "boundaries",
  ])) {
    throw new Error("M2B1 plan is malformed");
  }
  if (
    value.schemaVersion !== 1 ||
    value.id !== "design-visual-m2-b1-smoke-plan-v1" ||
    typeof value.date !== "string" ||
    !exactKeys(value.runtime, ["codexVersion", "sessionOrder", "retryCount"]) ||
    value.runtime.codexVersion !== "codex-cli 0.146.0" ||
    stableStringify(value.runtime.sessionOrder) !== stableStringify(["design", "sample-a", "sample-b"]) ||
    value.runtime.retryCount !== 0
  ) {
    throw new Error("M2B1 plan identity or runtime is malformed");
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
      typeof candidate.requiredOutcome !== "string"
    ) {
      throw new Error("M2B1 opaque candidate order is malformed");
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
      acceptance.some(({ verdict }) => verdict === "FAIL") ||
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

export async function preflightDesignVisualM2B1({
  repositoryRoot,
  planPath,
  gitStatus = defaultGitStatus,
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
  const pins = {};
  for (const [key, pin] of Object.entries(plan.inputs)) {
    pins[key] = await verifyPinnedFile(root, pin, `M2B1 ${key}`);
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
  return { root, planPath: resolvedPlan, plan, pins };
}

function designSchema() {
  return { type: "object", additionalProperties: true };
}

function visualSchema() {
  return { type: "object", additionalProperties: true };
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

function buildDesignInput(preflight) {
  const { pins } = preflight;
  const text = [
    pins.designPrompt.content.toString("utf8"),
    pinnedText("current Design skill", pins.designSkill),
    pinnedText("authority v5", pins.authority),
    pinnedText("frozen facts v1", pins.frozenFacts),
  ].join("");
  return [textEntry(text), imageEntry(pins.approvedSource.absolutePath)];
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

function buildVisualInput(preflight, candidate, designRaw) {
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
    imageEntry(pins.approvedSource.absolutePath),
    imageEntry(candidatePin.absolutePath),
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
  createSession,
  runTurn = runFreshEvaluatorTurn,
  writeArtifact = writeExclusive,
} = {}) {
  const preflight = await preflightDesignVisualM2B1({ repositoryRoot, planPath, gitStatus });
  let runtimeFactory = null;
  if (typeof createSession !== "function") {
    runtimeFactory = await defaultRuntimeFactory(preflight.plan);
    createSession = runtimeFactory.createSession;
  }
  if (typeof runTurn !== "function" || typeof writeArtifact !== "function") {
    throw new TypeError("M2B1 orchestration dependencies are malformed");
  }
  const sessions = [];
  const completed = [];
  let activeSession = null;
  let safeShutdown = true;
  try {
    await verifyPreflightPins(preflight);
    activeSession = await createSession({ phase: "design" });
    sessions.push(activeSession);
    const designResult = await runTurn({
      session: activeSession,
      root: preflight.root,
      input: buildDesignInput(preflight),
      outputSchema: designSchema(),
    });
    assertTurnShutdown(designResult, activeSession);
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
      activeSession = await createSession({ phase: "visual", candidateId: candidate.id });
      sessions.push(activeSession);
      const dynamicTools = [visualTool()];
      const visualResult = await runTurn({
        session: activeSession,
        root: preflight.root,
        input: buildVisualInput(preflight, candidate, designRaw),
        outputSchema: visualSchema(),
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
        evidence: clone({ input: visualResult.input, toolEvidence: visualResult.toolEvidence, appServer: visualResult.appServer }),
      });
    }
    await verifyPreflightPins(preflight);
    const handoff = { schemaVersion: 1, designRaw: { byteLength: designRaw.byteLength, sha256: designRaw.sha256 }, sections: clone(design) };
    const summary = {
      schemaVersion: 1,
      id: "design-visual-m2-b1-v1-summary",
      status: "complete",
      sessionOrder: [...completed],
      originalDetail: "UNVERIFIED",
      claimScope: clone(preflight.plan.claimScope),
      designRaw: handoff.designRaw,
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
    for (const [key, value] of writes) await writeArtifact(outputFile(preflight, key), value);
    await runtimeFactory?.finish(true);
    return {
      status: "complete",
      design: { raw: handoff.designRaw, output: design },
      visuals,
      summary,
    };
  } catch (error) {
    safeShutdown = activeSession === null || verifiedFailureShutdown(error, activeSession);
    if (safeShutdown) {
      const blocked = {
        schemaVersion: 1,
        id: "design-visual-m2-b1-v1-blocked",
        status: "blocked",
        completedSessions: [...completed],
        failedSession: sessions.length,
        error: String(error?.message ?? error),
        partialEvidence: clone(error?.freshEvaluatorEvidence ?? {}),
        retryCount: 0,
      };
      try {
        await writeArtifact(outputFile(preflight, "blocked"), blocked);
      } catch (writeError) {
        error.blockedArtifactError = writeError;
      }
    }
    await runtimeFactory?.finish(safeShutdown).catch((cleanupError) => {
      error.runtimeCleanupError = cleanupError;
    });
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
