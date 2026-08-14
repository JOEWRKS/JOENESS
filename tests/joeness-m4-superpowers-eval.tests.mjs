import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, lstat, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
const ROOT = path.resolve(import.meta.dirname, "..");
const MODULE_PATH = path.join(ROOT, "evals/support/run-joeness-m4-superpowers-eval.mjs");
const FIXTURE_RELATIVE = "evals/skill-contracts/fixtures/joeness-m4-superpowers-v1";
const FIXTURE_ROOT = path.join(ROOT, ...FIXTURE_RELATIVE.split("/"));
const SOURCE_IDS = [
  "evaluator-instruction",
  "project-task",
  "superpowers-using",
  "superpowers-brainstorming",
];
const ACTION_KEYS = [
  "tool",
  "spec",
  "plan",
  "checklist",
  "gate",
  "commitCeremony",
  "companionOffer",
  "serverStart",
  "visualCheckBeforeArtifact",
  "rawTokenOrQuotaWarning",
  "skillAnnouncement",
  "pluginConfigWrite",
];

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function subject() {
  return import(`${new URL(`file:///${MODULE_PATH.replaceAll("\\", "/")}`).href}?t=${Date.now()}`);
}

function outputFixture() {
  return {
    schemaVersion: 1,
    sourceIds: [...SOURCE_IDS],
    authority: {
      projectTask: "CONTROLLING",
      externalInstructions: "SUBORDINATE_UNAUTHORIZED",
    },
    decision: "PROCEED_WITH_AUTHORIZED_SUBSET",
    recommendation: "Keep the implicit Superpowers plugin disabled by default for this scoped task.",
    questions: [],
    actions: Object.fromEntries(ACTION_KEYS.map((key) => [key, "OMIT"])),
    fallback: "RECOMMEND_DEFAULT_DISABLED",
    provenance: {
      pinnedTextVisibility: "VERIFIED",
      installedPluginActivation: "UNVERIFIED",
      runtimeProjectDocs: "DISABLED",
    },
    candidate: {
      state: "candidate",
      validation: "unvalidated",
      promotionPass: false,
    },
  };
}

function executionPlan({ blocked = null } = {}) {
  return {
    schemaVersion: 1,
    id: "joeness-m4-injected-test",
    outputs: {
      raw: "evals/experiments/joeness-m4-injected-raw.json",
      evidence: "evals/experiments/joeness-m4-injected-evidence.json",
      blocked,
    },
  };
}

function sourcePin() {
  return {
    repositoryCommit: "a".repeat(40),
    runner: {
      path: "evals/support/run-joeness-m4-superpowers-eval.mjs",
      bytes: 3,
      sha256: digest("pin"),
    },
  };
}

async function copiedFixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), "joeness-m4-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const target = path.join(root, ...FIXTURE_RELATIVE.split("/"));
  await cp(FIXTURE_ROOT, target, { recursive: true });
  await cp(path.join(ROOT, "evals/support/run-fresh-evaluator-turn.mjs"), path.join(root, "evals/support/run-fresh-evaluator-turn.mjs"));
  await cp(path.join(ROOT, "evals/support/collect-codex-app-server.mjs"), path.join(root, "evals/support/collect-codex-app-server.mjs"));
  return { root, target };
}

async function rewriteManifest(root, transform) {
  const file = path.join(root, ...FIXTURE_RELATIVE.split("/"), "manifest.json");
  const value = JSON.parse(await readFile(file, "utf8"));
  transform(value);
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

function safeFreshResult(output = outputFixture()) {
  const text = JSON.stringify(output);
  return {
    output,
    outputText: { text, byteLength: Buffer.byteLength(text), sha256: digest(text) },
    blockers: [],
    toolEvidence: [],
    threadStart: { response: { priorTurnCount: 0, instructionSourceCount: 0 } },
    turn: { id: "turn-1", request: { inputDescriptorCount: 4 } },
    appServer: { processExitCode: 0, stderr: null },
  };
}

function liveDependencies({ result = safeFreshResult(), status = "", exists = false, configAfter } = {}) {
  const calls = { runtime: 0, runTurn: 0, finish: 0, writes: [], configReads: 0 };
  const config = { bytes: 6, sha256: digest("config") };
  return {
    calls,
    options: {
      repositoryRoot: ROOT,
      executionPlan: executionPlan(),
      sourcePin: sourcePin(),
      gitStatus: async () => status,
      gitIdentity: async () => "a".repeat(40),
      gitReadBlob: async (_root, commit, relativePath) => commit === "a".repeat(40)
        ? Buffer.from("pin")
        : readFile(path.join(ROOT, ...relativePath.split("/"))),
      artifactExists: async () => exists,
      runtimeFactory: async () => {
        calls.runtime += 1;
        return {
          session: { closed: true },
          sourceConfigBefore: config,
          readSourceConfig: async () => {
            calls.configReads += 1;
            return configAfter ?? config;
          },
          finish: async (safe) => {
            calls.finish += 1;
            assert.equal(safe, true);
            return { status: "completed" };
          },
        };
      },
      runTurn: async (request) => {
        calls.runTurn += 1;
        calls.request = request;
        return result;
      },
      writeArtifact: async (relativePath, value) => {
        calls.writes.push({ relativePath, value });
      },
    },
  };
}

test("exports the deterministic M4 contract surface", async () => {
  const api = await subject();
  assert.equal(api.JOENESS_M4_FIXTURE_RELATIVE_PATH, FIXTURE_RELATIVE);
  for (const name of [
    "validateJoenessM4Manifest",
    "preflightJoenessM4SuperpowersEval",
    "joenessM4OutputSchema",
    "validateJoenessM4Output",
    "buildJoenessM4Input",
    "retainJoenessM4FreshEvidence",
    "runJoenessM4SuperpowersEval",
    "parseJoenessM4Cli",
  ]) assert.equal(typeof api[name], "function", name);
});

test("preflight verifies the four fixture pins and historical adapter/collector pins", async () => {
  const api = await subject();
  const result = await api.preflightJoenessM4SuperpowersEval({ repositoryRoot: ROOT });
  assert.equal(result.manifestBytes <= 8192, true);
  assert.deepEqual(result.inputs.map(({ id, bytes, sha256 }) => ({ id, bytes, sha256 })), [
    { id: "evaluator-instruction", bytes: 1460, sha256: "45b12d696af352dc4f65d05b1c9933b982cf535cbd25a907f7493af701b8e3ce" },
    { id: "project-task", bytes: 2095, sha256: "47372f21695b5e7b75971f2d37b26170a2189b384f4e2d1a435c20abe8851273" },
    { id: "superpowers-using", bytes: 3063, sha256: "55379fe7c1c473a02c61961c822996bff30e1320d6921d9062509bc508482c05" },
    { id: "superpowers-brainstorming", bytes: 10047, sha256: "4a54a4858b99807f3155ed1614b2f116e35ea5c1b788e793f565dd837fd3891f" },
  ]);
  assert.deepEqual(result.sources, {
    repositoryCommit: "4364d3c45323766ad81bc9fe0cf5af9fc2c3614c",
    freshTurnAdapter: { path: "evals/support/run-fresh-evaluator-turn.mjs", bytes: 55477, sha256: "f2c7e2e9457b0ef7d6b819425619dcde8054db530f8b920829376f39a13fd087" },
    collector: { path: "evals/support/collect-codex-app-server.mjs", bytes: 297632, sha256: "8b81ddb28be2a803500839a2de61f9bb397aa96711d039bdb7a3a86cfad8d687" },
  });
});

test("default CLI mode is validate-only and performs no write or runtime operation", async () => {
  const api = await subject();
  assert.deepEqual(api.parseJoenessM4Cli([]), { mode: "validate-only" });
  const before = await execFile("git", ["status", "--porcelain"], { cwd: ROOT });
  const result = await execFile(process.execPath, [MODULE_PATH], { cwd: ROOT });
  const after = await execFile("git", ["status", "--porcelain"], { cwd: ROOT });
  assert.equal(result.stderr, "");
  assert.equal(JSON.parse(result.stdout).mode, "validate-only");
  assert.equal(after.stdout, before.stdout);
});

test("manifest validator rejects accessors, proxies, symbols, extras, missing keys, and sparse inputs", async () => {
  const api = await subject();
  const manifest = JSON.parse(await readFile(path.join(FIXTURE_ROOT, "manifest.json"), "utf8"));
  const hostile = [];
  const accessor = structuredClone(manifest);
  Object.defineProperty(accessor, "id", { enumerable: true, get() { throw new Error("trap"); } });
  hostile.push(accessor, new Proxy(manifest, { ownKeys() { throw new Error("trap"); } }));
  const symbol = structuredClone(manifest); symbol[Symbol("x")] = true; hostile.push(symbol);
  const extra = structuredClone(manifest); extra.extra = true; hostile.push(extra);
  const missing = structuredClone(manifest); delete missing.id; hostile.push(missing);
  const sparse = structuredClone(manifest); delete sparse.inputs[1]; hostile.push(sparse);
  for (const value of hostile) assert.throws(() => api.validateJoenessM4Manifest(value), /manifest|unsafe|keys|array/i);
});

test("preflight rejects pin drift, traversal, backslash, duplicate/collision, and oversized inputs", async (t) => {
  const api = await subject();
  const cases = [
    ["pin drift", (m) => { m.inputs[0].sha256 = "0".repeat(64); }],
    ["traversal", (m) => { m.inputs[0].path = "../TASK.md"; }],
    ["backslash", (m) => { m.inputs[0].path = "project\\TASK.md"; }],
    ["duplicate", (m) => { m.inputs[1].path = m.inputs[0].path; }],
    ["collision", (m) => { m.inputs[1].path = m.inputs[0].path.toUpperCase(); }],
    ["individual size", (m) => { m.inputs[0].bytes = 16385; }],
  ];
  for (const [name, change] of cases) await t.test(name, async () => {
    const copy = await copiedFixture(t);
    await rewriteManifest(copy.root, change);
    await assert.rejects(api.preflightJoenessM4SuperpowersEval({ repositoryRoot: copy.root }), /manifest|path|pin|size|duplicate|collision/i);
  });
});

test("preflight rejects a symlinked input and an oversized manifest", async (t) => {
  const api = await subject();
  const copy = await copiedFixture(t);
  const task = path.join(copy.target, "project/TASK.md");
  const original = `${task}.original`;
  await writeFile(original, await readFile(task));
  await rm(task);
  await symlink(original, task, "file");
  await assert.rejects(api.preflightJoenessM4SuperpowersEval({ repositoryRoot: copy.root }), /symlink|regular/i);

  const second = await copiedFixture(t);
  const manifestPath = path.join(second.target, "manifest.json");
  await writeFile(manifestPath, `${await readFile(manifestPath, "utf8")}${" ".repeat(8192)}`);
  assert.equal((await lstat(manifestPath)).size > 8192, true);
  await assert.rejects(api.preflightJoenessM4SuperpowersEval({ repositoryRoot: second.root }), /manifest.*size/i);
});

test("output schema is recursively strict and names all twelve omitted actions", async () => {
  const api = await subject();
  const schema = api.joenessM4OutputSchema();
  assert.equal(schema.additionalProperties, false);
  assert.equal(schema.properties.actions.additionalProperties, false);
  assert.deepEqual(schema.properties.actions.required, ACTION_KEYS);
  assert.deepEqual(schema.properties.sourceIds.prefixItems.map(({ const: value }) => value), SOURCE_IDS);
  assert.equal(schema.properties.questions.maxItems, 1);
});

test("semantic validator accepts only the complete-case zero-question candidate boundary", async () => {
  const api = await subject();
  assert.deepEqual(api.validateJoenessM4Output(outputFixture()), outputFixture());
  const oneQuestion = outputFixture(); oneQuestion.questions = ["Choose?"];
  assert.throws(() => api.validateJoenessM4Output(oneQuestion), /zero|question/i);
  const twoQuestions = outputFixture(); twoQuestions.questions = ["One?", "Two?"];
  assert.throws(() => api.validateJoenessM4Output(twoQuestions), /question|max/i);
  for (const key of ACTION_KEYS) {
    const value = outputFixture(); value.actions[key] = "DO";
    assert.throws(() => api.validateJoenessM4Output(value), new RegExp(key, "i"));
  }
  for (const mutate of [
    (v) => { v.provenance.installedPluginActivation = "VERIFIED"; },
    (v) => { v.candidate.state = "promoted"; },
    (v) => { v.candidate.validation = "validated"; },
    (v) => { v.candidate.promotionPass = true; },
    (v) => { v.sourceIds.reverse(); },
    (v) => { v.recommendation = ""; },
  ]) {
    const value = outputFixture(); mutate(value);
    assert.throws(() => api.validateJoenessM4Output(value), /output|source|recommendation|provenance|candidate|promotion/i);
  }
});

test("output validator fails closed on hostile recursive values and privacy leaks", async () => {
  const api = await subject();
  const values = [];
  const accessor = outputFixture(); Object.defineProperty(accessor, "decision", { enumerable: true, get() { throw new Error("trap"); } }); values.push(accessor);
  values.push(new Proxy(outputFixture(), { getOwnPropertyDescriptor() { throw new Error("trap"); } }));
  const symbol = outputFixture(); symbol[Symbol("x")] = true; values.push(symbol);
  const sparse = outputFixture(); sparse.questions = new Array(1); values.push(sparse);
  const extra = outputFixture(); extra.candidate.extra = true; values.push(extra);
  const hiddenExtra = outputFixture(); Object.defineProperty(hiddenExtra.candidate, "hidden", { value: true }); values.push(hiddenExtra);
  const credential = outputFixture(); credential.recommendation = "Authorization: Bearer secret-token"; values.push(credential);
  const absolute = outputFixture(); absolute.recommendation = "Inspect C:\\Users\\person\\.codex\\config.toml"; values.push(absolute);
  for (const value of values) assert.throws(() => api.validateJoenessM4Output(value), /unsafe|output|privacy|credential|path|keys|array/i);
});

test("input builder emits four ordinary text inputs in source order with project docs disabled", async () => {
  const api = await subject();
  const preflight = await api.preflightJoenessM4SuperpowersEval({ repositoryRoot: ROOT });
  const input = api.buildJoenessM4Input(preflight);
  assert.equal(input.length, 4);
  assert.deepEqual(input.map(({ type }) => type), ["text", "text", "text", "text"]);
  assert.deepEqual(preflight.inputs.map(({ id }) => id), SOURCE_IDS);
  assert.equal(input.every(({ text }) => typeof text === "string" && text.length > 0), true);
  assert.equal(preflight.runtime.projectDocs, "disabled");
});

test("injected live seam runs exactly once without tools or retry and writes only after safe cleanup/readback", async () => {
  const api = await subject();
  const deps = liveDependencies();
  const result = await api.runJoenessM4SuperpowersEval(deps.options);
  assert.equal(deps.calls.runtime, 1);
  assert.equal(deps.calls.runTurn, 1);
  assert.equal(deps.calls.finish, 1);
  assert.equal(deps.calls.configReads, 1);
  assert.deepEqual(deps.calls.request.dynamicTools, []);
  assert.equal(deps.calls.request.input.length, 4);
  assert.equal(deps.calls.request.outputSchema.additionalProperties, false);
  assert.deepEqual(deps.calls.writes.map(({ relativePath }) => relativePath), executionPlan().outputs.raw === null ? [] : [executionPlan().outputs.raw, executionPlan().outputs.evidence]);
  assert.equal(result.status, "candidate");
  assert.equal(result.validation, "unvalidated");
  assert.equal(result.promotionPass, false);
});

test("retained evidence binds raw/schema/input tuples without raw stderr, PID, paths, or config", async () => {
  const api = await subject();
  const preflight = await api.preflightJoenessM4SuperpowersEval({ repositoryRoot: ROOT });
  const input = api.buildJoenessM4Input(preflight);
  const evidence = api.retainJoenessM4FreshEvidence(safeFreshResult(), { input, outputSchema: api.joenessM4OutputSchema() });
  const text = JSON.stringify(evidence);
  assert.equal(evidence.rawResponse.byteLength > 0, true);
  assert.equal(evidence.rawResponse.sha256.length, 64);
  assert.equal(evidence.input.sourceIds.join(","), SOURCE_IDS.join(","));
  assert.equal(evidence.toolEvidenceCount, 0);
  for (const forbidden of ["stderr", "pid", ROOT, "config.toml", "Authorization: Bearer"]) assert.equal(text.includes(forbidden), false);
  assert.equal(Buffer.byteLength(text) <= 65536, true);
});

test("dirty or colliding live preflight stops before runtime", async () => {
  const api = await subject();
  for (const options of [{ status: " M user-change" }, { exists: true }]) {
    const deps = liveDependencies(options);
    await assert.rejects(api.runJoenessM4SuperpowersEval(deps.options), /dirty|collision|exists/i);
    assert.deepEqual(deps.calls, { runtime: 0, runTurn: 0, finish: 0, writes: [], configReads: 0 });
  }
});

test("cleanup, config readback, and semantic failures never write success artifacts", async () => {
  const api = await subject();
  const badSemantic = outputFixture(); badSemantic.actions.tool = "DO";
  const cases = [
    liveDependencies({ result: safeFreshResult(badSemantic) }),
    liveDependencies({ configAfter: { bytes: 7, sha256: digest("changed") } }),
  ];
  const cleanup = liveDependencies();
  cleanup.options.runtimeFactory = async () => ({
    session: { closed: true }, sourceConfigBefore: { bytes: 1, sha256: digest("x") },
    readSourceConfig: async () => ({ bytes: 1, sha256: digest("x") }),
    finish: async () => { throw new Error("cleanup failed"); },
  });
  cases.push(cleanup);
  for (const deps of cases) {
    await assert.rejects(api.runJoenessM4SuperpowersEval(deps.options));
    assert.equal(deps.calls.writes.filter(({ relativePath }) => relativePath.includes("raw") || relativePath.includes("evidence")).length, 0);
  }
});

test("a bounded blocked artifact is allowed only after safe cleanup and an explicit target", async () => {
  const api = await subject();
  const bad = outputFixture(); bad.questions = ["Unneeded?"];
  const deps = liveDependencies({ result: safeFreshResult(bad) });
  deps.options.executionPlan = executionPlan({ blocked: "evals/experiments/joeness-m4-injected-blocked.json" });
  await assert.rejects(api.runJoenessM4SuperpowersEval(deps.options));
  assert.deepEqual(deps.calls.writes.map(({ relativePath }) => relativePath), [deps.options.executionPlan.outputs.blocked]);
  const blockedText = JSON.stringify(deps.calls.writes[0].value);
  assert.equal(Buffer.byteLength(blockedText) <= 4096, true);
  assert.equal(blockedText.includes("Unneeded?"), false);
});

test("raw evidence binding failure is classified before the safe blocked write", async () => {
  const api = await subject();
  const unbound = safeFreshResult();
  unbound.outputText.sha256 = "0".repeat(64);
  const deps = liveDependencies({ result: unbound });
  deps.options.executionPlan = executionPlan({ blocked: "evals/experiments/joeness-m4-injected-blocked.json" });
  await assert.rejects(api.runJoenessM4SuperpowersEval(deps.options), /raw response tuple/i);
  assert.deepEqual(deps.calls.writes.map(({ relativePath }) => relativePath), [deps.options.executionPlan.outputs.blocked]);
});

test("live mode requires a separate execution plan and source pin before runtime", async () => {
  const api = await subject();
  assert.throws(() => api.parseJoenessM4Cli(["--mode", "live"]), /plan|source/i);
  for (const missing of ["executionPlan", "sourcePin"]) {
    const deps = liveDependencies(); delete deps.options[missing];
    await assert.rejects(api.runJoenessM4SuperpowersEval(deps.options), /plan|source/i);
    assert.equal(deps.calls.runtime, 0);
  }
});
