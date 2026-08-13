import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { createHash } from "node:crypto";
import { chmod, copyFile, cp, lstat, mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);

const ROOT = path.resolve(import.meta.dirname, "..");
const MODULE_URL = new URL(
  "../evals/support/run-design-visual-m2-b1.mjs",
  import.meta.url,
);
const PLAN_PATH = path.join(
  ROOT,
  "evals/skill-contracts/design-visual-m2-b1-smoke-plan-v1.json",
);
const SUCCESSOR_PLAN_PATH = path.join(
  ROOT,
  "evals/skill-contracts/design-visual-m2-b1-smoke-plan-v2.json",
);

async function loadSubject() {
  try {
    return await import(MODULE_URL.href);
  } catch {
    return null;
  }
}

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function designOutput() {
  const check = (id, observableFact, evidenceLayer, applicability, semantics = "acceptance") => ({
    id,
    sourceIds: [`source-${id}`],
    observableFact,
    evidenceLayer,
    applicability,
    semantics,
  });
  return {
    schemaVersion: 5,
    invariants: [
      check("modal-frame", "The Collection modal frame is visibly intact.", "visible-appearance", {
        mode: "match",
        dimensions: { variant: ["Default"], surface: ["Collection modal"] },
      }),
    ],
    variants: [
      check("default-spacing", "The Default cards have balanced visible spacing.", "visible-appearance", {
        mode: "match",
        dimensions: { variant: ["Default"], surface: ["Collection modal"] },
      }),
    ],
    states: [
      check("selected-state", "The selected state remains visually distinct.", "visible-appearance", {
        mode: "match",
        dimensions: { variant: ["Default"], state: ["Selected"], surface: ["Collection modal"] },
      }),
    ],
    wholeFrameChecks: [
      check("runtime-target", "The named runtime target is proven.", "runtime-identity", {
        mode: "match",
        dimensions: { target: ["Xiaomi 23043RP34G"] },
      }),
    ],
    focusedChecks: [
      check("artifact-id", "The installed artifact identity is proven.", "artifact-identity", {
        mode: "always",
      }),
    ],
    unverifiedBoundaries: [
      check("user-acceptance", "Explicit user acceptance is not supplied.", "user-acceptance", {
        mode: "always",
      }, "boundary"),
    ],
  };
}

function visualOutput(design, candidateId, defect) {
  const checks = Object.values(design)
    .filter(Array.isArray)
    .flat()
    .map((item) => {
      const missingState = item.applicability.dimensions?.state;
      const missingTarget = item.applicability.dimensions?.target;
      const unsupportedLayer = item.evidenceLayer !== "visible-appearance";
      let scopeMatch = "APPLICABLE";
      let verdict = "PASS";
      let observed = "The named visible relation is present in the Collection modal.";
      if (missingState || missingTarget) {
        scopeMatch = "UNVERIFIED";
        verdict = "UNVERIFIED";
        observed = `Claim scope omits ${missingState ? "state" : "target"}.`;
      } else if (unsupportedLayer && item.semantics === "acceptance") {
        verdict = "UNVERIFIED";
        observed = `The still image does not prove ${item.evidenceLayer}.`;
      } else if (item.semantics === "boundary") {
        verdict = "PASS";
        observed = "No user-acceptance evidence is supplied.";
      }
      if (defect && item.id === "default-spacing") {
        verdict = "FAIL";
        observed = "The left gap is visibly much smaller than the right gap.";
      }
      return {
        id: item.id,
        sourceIds: item.sourceIds,
        evidenceLayer: item.evidenceLayer,
        applicability: item.applicability,
        semantics: item.semantics,
        expected: item.observableFact,
        scopeMatch,
        observed,
        verdict,
      };
    });
  return {
    candidateId,
    claimScope: { variant: "Default", surface: "Collection modal" },
    checks,
    visibleAppearanceOverall: defect ? "FAIL" : "UNVERIFIED",
    completeContractOverall: defect ? "FAIL" : "UNVERIFIED",
  };
}

async function fixtureRoot(t) {
  const root = await mkdtemp(path.join(tmpdir(), "joeness-m2-b1-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const plan = JSON.parse(await readFile(PLAN_PATH, "utf8"));
  const pins = [
    ...Object.values(plan.inputs),
    ...plan.candidates.map(({ image }) => image),
  ];
  for (const pin of pins) {
    const destination = path.join(root, ...pin.path.split("/"));
    await mkdir(path.dirname(destination), { recursive: true });
    await cp(path.join(ROOT, ...pin.path.split("/")), destination);
  }
  const copiedPlan = path.join(root, ...path.relative(ROOT, PLAN_PATH).split(path.sep));
  await mkdir(path.dirname(copiedPlan), { recursive: true });
  await writeFile(copiedPlan, JSON.stringify(plan, null, 2) + "\n");
  await writeFile(path.join(root, "TASKS.md"), "controller-only tasks\n");
  await mkdir(path.join(root, "history"));
  await writeFile(path.join(root, "history", "prior-verdict.json"), "{}\n");
  await mkdir(path.join(root, "ground-truth"));
  await writeFile(path.join(root, "ground-truth", "roles.json"), "{}\n");
  return { root, plan, planPath: copiedPlan };
}

async function listRelativeFiles(root, current = root) {
  const entries = await readdir(current, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) files.push(...await listRelativeFiles(root, absolute));
    else files.push(path.relative(root, absolute).replaceAll("\\", "/"));
  }
  return files.sort();
}

async function assertPathMissing(file) {
  await assert.rejects(lstat(file), (error) => error?.code === "ENOENT");
}

function closedSession(id) {
  return { id, closed: false, processExitCode: null };
}

function successfulDependencies(design = designOutput()) {
  const sessions = [];
  const calls = [];
  const writes = [];
  return {
    sessions,
    calls,
    writes,
    createSession: async () => {
      const session = closedSession(`session-${sessions.length + 1}`);
      sessions.push(session);
      return session;
    },
    runTurn: async (options) => {
      const index = calls.length;
      calls.push(structuredClone({
        root: options.root,
        rootFiles: await listRelativeFiles(options.root),
        rootFileHashes: Object.fromEntries(await Promise.all(
          (await listRelativeFiles(options.root)).map(async (file) => [
            file,
            digest(await readFile(path.join(options.root, ...file.split("/")))),
          ]),
        )),
        input: options.input,
        dynamicTools: options.dynamicTools,
      }));
      let output;
      let toolEvidence = [];
      if (index === 0) {
        output = design;
      } else {
        const response = await options.dynamicToolController({
          tool: options.dynamicTools[0].name,
          arguments: { contract: "design-raw" },
        });
        const raw = response.contentItems[0].text;
        toolEvidence = [{
          tool: options.dynamicTools[0].name,
          arguments: { contract: "design-raw" },
          response: { byteLength: Buffer.byteLength(raw), sha256: digest(raw) },
          status: "completed",
        }];
        output = visualOutput(design, index === 1 ? "sample-a" : "sample-b", index === 1);
      }
      options.session.closed = true;
      options.session.processExitCode = 0;
      const text = JSON.stringify(output);
      const threadId = `thread-${index + 1}`;
      const turnId = `turn-${index + 1}`;
      const lifecycleEvents = index === 0
        ? [
            { method: "turn/started", threadId, turnId, complete: true, blockers: [] },
            { method: "turn/completed", threadId, turnId, turn: { id: turnId, status: "completed" }, complete: true, blockers: [] },
          ]
        : [
            { method: "turn/started", threadId, turnId, complete: true, blockers: [] },
            { method: "item/started", threadId, turnId, item: { id: `call-${index}`, type: "dynamicToolCall", tool: "design-contract", status: "inProgress", secretPayload: "sk-proj-SYNTHETIC_TEST_ONLY_abcdefghijklmnop" }, complete: true, blockers: [] },
            { method: "item/completed", threadId, turnId, item: { id: `call-${index}`, type: "dynamicToolCall", tool: "design-contract", status: "completed", success: true }, complete: true, blockers: [] },
            { method: "turn/completed", threadId, turnId, turn: { id: turnId, status: "completed" }, complete: true, blockers: [] },
          ];
      return {
        output,
        outputText: { text, byteLength: Buffer.byteLength(text), sha256: digest(text) },
        threadStart: { request: { cwd: options.root }, response: { threadId } },
        thread: { id: threadId },
        turn: { id: turnId, request: { input: options.input } },
        input: {
          requestSha256: digest(`request-${index}`),
          descriptors: [
            { index: 0, type: "text", text: "prompt sk-proj-SYNTHETIC_TEST_ONLY_abcdefghijklmnop", byteLength: 6, sha256: digest(`prompt-${index}`) },
            { index: 1, type: "localImage", path: path.join(options.root, "approved.png"), byteLength: 4, sha256: digest(`image-${index}`), originalDetail: "unverified", embeddedBytes: "SYNTHETIC_IMAGE_BYTES_MUST_NOT_PERSIST" },
          ],
        },
        outputSchema: {
          value: { syntheticSecret: "sk-proj-SYNTHETIC_TEST_ONLY_abcdefghijklmnop" },
          byteLength: 31,
          sha256: digest(`schema-${index}`),
        },
        events: lifecycleEvents,
        toolEvidence,
        mcpAfter: [],
        blockers: [],
        appServer: { processExitCode: 0, stderr: { byteLength: 0 } },
      };
    },
    gitStatus: async () => "",
    writeArtifact: async (file, value) => {
      assert.equal(sessions.every(({ closed }) => closed), true, "artifact written before session shutdown");
      writes.push({ file, value: structuredClone(value) });
    },
  };
}

test("M2B1 plan pins the successor prompt and opaque approved/defect/control inputs", async () => {
  const subject = await loadSubject();
  assert.equal(typeof subject?.validateDesignVisualM2B1Plan, "function");
  const plan = JSON.parse(await readFile(PLAN_PATH, "utf8"));
  assert.equal(subject.validateDesignVisualM2B1Plan(plan).id, "design-visual-m2-b1-smoke-plan-v1");
  assert.equal(plan.inputs.visualPrompt.path.endsWith("visual-prompt-v9.md"), true);
  assert.deepEqual(plan.candidates.map(({ id }) => id), ["sample-a", "sample-b"]);
  assert.deepEqual(plan.candidates.map(({ image: { path } }) => path), [
    "evals/skill-contracts/fixtures/visual-m2-v1/blind/0684e6867856745762217a70862b81fee8ac70787b5ab57ea13ffa58a870db62.png",
    "evals/skill-contracts/fixtures/visual-m2-v1/blind/545a332a92e5b2b9e9f13415553511f07fbdcf189bc13a4852f123c9a943a7df.png",
  ]);
  assert.equal(JSON.stringify(plan).match(/ground.?truth|known.?failure|positive.?control|TASKS/iu), null);
  assert.deepEqual(plan.claimScope, { variant: "Default", surface: "Collection modal" });
  assert.equal(plan.originalDetail, "UNVERIFIED");
});

test("M2B1 response schemas are recursively strict and match the runtime validators", async () => {
  const subject = await loadSubject();
  assert.equal(typeof subject?.designSchema, "function");
  assert.equal(typeof subject?.visualSchema, "function");

  function assertStrict(schema, label = "root") {
    for (const unsupportedKeyword of ["minLength", "minItems", "maxItems"]) {
      assert.equal(
        Object.hasOwn(schema, unsupportedKeyword),
        false,
        `${label} uses unnecessary ${unsupportedKeyword}`,
      );
    }
    if (schema.type === "object") {
      assert.equal(schema.additionalProperties, false, `${label} allows extra properties`);
      assert.deepEqual(
        [...schema.required].sort(),
        Object.keys(schema.properties).sort(),
        `${label} required keys differ`,
      );
      for (const [key, value] of Object.entries(schema.properties)) {
        assertStrict(value, `${label}.${key}`);
      }
    } else if (schema.type === "array") {
      assertStrict(schema.items, `${label}[]`);
    } else if (Array.isArray(schema.anyOf)) {
      schema.anyOf.forEach((item, index) => assertStrict(item, `${label}.anyOf[${index}]`));
    }
  }

  function assertAccepts(schema, value, label = "root") {
    if (Array.isArray(schema.anyOf)) {
      const failures = [];
      for (const option of schema.anyOf) {
        try {
          assertAccepts(option, value, label);
          return;
        } catch (error) {
          failures.push(error);
        }
      }
      assert.fail(`${label} matches no anyOf branch: ${failures.map(({ message }) => message).join(" | ")}`);
    }
    if (schema.type === "object") {
      assert.equal(value !== null && typeof value === "object" && !Array.isArray(value), true, label);
      assert.deepEqual(Object.keys(value).sort(), [...schema.required].sort(), label);
      for (const [key, child] of Object.entries(schema.properties)) {
        assertAccepts(child, value[key], `${label}.${key}`);
      }
    } else if (schema.type === "array") {
      assert.equal(Array.isArray(value), true, label);
      if (schema.minItems !== undefined) assert.equal(value.length >= schema.minItems, true, label);
      if (schema.maxItems !== undefined) assert.equal(value.length <= schema.maxItems, true, label);
      value.forEach((item, index) => assertAccepts(schema.items, item, `${label}[${index}]`));
    } else if (schema.type === "string") {
      assert.equal(typeof value, "string", label);
      if (schema.minLength !== undefined) assert.equal(value.length >= schema.minLength, true, label);
    } else if (schema.type === "integer") {
      assert.equal(Number.isInteger(value), true, label);
    }
    if (schema.enum) assert.equal(schema.enum.includes(value), true, label);
  }

  const design = subject.designSchema();
  const designFixture = designOutput();
  const visualFixture = visualOutput(designFixture, "sample-b", false);
  const visual = subject.visualSchema("sample-b");
  assertStrict(design, "design");
  assertStrict(visual, "visual");
  assertAccepts(design, designFixture, "designFixture");
  assertAccepts(visual, visualFixture, "visualFixture");
  assert.doesNotThrow(() => subject.validateDesignM2B1Output(designFixture));
  assert.doesNotThrow(() => subject.validateVisualM2B1Output(
    visualFixture,
    designFixture,
    "sample-b",
  ));
});

test("M2B1 successor plan preserves v1 evidence and uses disjoint v2 outputs", async () => {
  const subject = await loadSubject();
  const plan = JSON.parse(await readFile(SUCCESSOR_PLAN_PATH, "utf8"));
  const validated = subject.validateDesignVisualM2B1Plan(plan);

  assert.equal(validated.schemaVersion, 2);
  assert.equal(validated.id, "design-visual-m2-b1-smoke-plan-v2");
  assert.equal(validated.predecessor.methodChange, "bounded-sanitized-runtime-error-and-primary-cause-capture");
  assert.equal(validated.predecessor.attemptPolicy, "one-method-changed-attempt-no-automatic-retry");
  assert.equal(Object.values(validated.outputs).every((file) => file.includes("-v2-")), true);
  assert.equal(Object.values(validated.outputs).some((file) => file.includes("-v1-")), false);

  const changed = structuredClone(plan);
  changed.predecessor.latestReceipt.sha256 = "0".repeat(64);
  assert.throws(() => subject.validateDesignVisualM2B1Plan(changed), /predecessor|pin/iu);
  const changedSource = structuredClone(plan);
  changedSource.source.collector.path = "evals/support/not-the-collector.mjs";
  assert.throws(() => subject.validateDesignVisualM2B1Plan(changedSource), /source|path/iu);
});

test("M2B1 successor run emits v2 summary and blocked identities", async (t) => {
  const subject = await loadSubject();
  const root = await mkdtemp(path.join(tmpdir(), "joeness-m2-b1-v2-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const plan = JSON.parse(await readFile(SUCCESSOR_PLAN_PATH, "utf8"));
  for (const pin of [
    ...Object.values(plan.inputs),
    ...plan.candidates.map(({ image }) => image),
    plan.predecessor.plan,
    plan.predecessor.blockedAttempt,
    plan.predecessor.latestReceipt,
    plan.source.runner,
    plan.source.freshTurnAdapter,
    plan.source.collector,
  ]) {
    const destination = path.join(root, ...pin.path.split("/"));
    await mkdir(path.dirname(destination), { recursive: true });
    if (pin === plan.source.runner) {
      const source = await execFile(
        "git",
        ["show", `${plan.source.repositoryCommit}:${pin.path}`],
        { cwd: ROOT, encoding: "buffer", maxBuffer: 1024 * 1024 },
      );
      await writeFile(destination, source.stdout);
    } else {
      await cp(path.join(ROOT, ...pin.path.split("/")), destination);
    }
  }
  const planPath = path.join(root, ...path.relative(ROOT, SUCCESSOR_PLAN_PATH).split(path.sep));
  await mkdir(path.dirname(planPath), { recursive: true });
  await writeFile(planPath, JSON.stringify(plan, null, 2) + "\n");

  const success = successfulDependencies();
  success.gitIdentity = async (_root, implementationCommit) => {
    assert.equal(implementationCommit, plan.source.repositoryCommit);
    return "f".repeat(40);
  };
  const result = await subject.runDesignVisualM2B1({
    repositoryRoot: root,
    planPath,
    ...success,
  });
  assert.equal(result.summary.id, "design-visual-m2-b1-v2-summary");
  assert.equal(result.summary.executionSource.head, "f".repeat(40));
  assert.equal(result.summary.executionSource.implementation.repositoryCommit, plan.source.repositoryCommit);
  assert.equal(result.summary.executionSource.plan.path.endsWith("smoke-plan-v2.json"), true);

  const failure = successfulDependencies();
  failure.gitIdentity = success.gitIdentity;
  failure.runTurn = async (options) => {
    options.session.closed = true;
    options.session.processExitCode = 0;
    const error = new Error("successor evaluator failed");
    error.freshEvaluatorEvidence = { appServer: { processExitCode: 0 } };
    throw error;
  };
  await assert.rejects(subject.runDesignVisualM2B1({
    repositoryRoot: root,
    planPath,
    ...failure,
  }), /successor evaluator failed/);
  const blocked = failure.writes.find(({ file }) => file.endsWith("blocked.json"));
  assert.equal(blocked.value.id, "design-visual-m2-b1-v2-blocked");
  assert.equal(blocked.value.executionSource.head, "f".repeat(40));
});

test("M2B1 evaluator-root staging rolls back and reads back absence after copy failure", async (t) => {
  const subject = await loadSubject();
  assert.equal(typeof subject?.stageEvaluatorRoot, "function");
  const { root, planPath } = await fixtureRoot(t);
  const preflight = await subject.preflightDesignVisualM2B1({
    repositoryRoot: root,
    planPath,
    gitStatus: async () => "",
  });
  let stagedRoot;
  let copyCalls = 0;
  const original = new Error("fixture copy failed");
  await assert.rejects(
    subject.stageEvaluatorRoot(preflight, "sample-a", {
      mkdtemp: async (prefix) => {
        stagedRoot = await mkdtemp(prefix);
        return stagedRoot;
      },
      copyFile: async (...argumentsValue) => {
        copyCalls += 1;
        if (copyCalls === 2) throw original;
        return copyFile(...argumentsValue);
      },
      chmod,
      rm,
      lstat,
    }),
    (error) =>
      error === original &&
      error.stagingEvidence?.root === stagedRoot &&
      error.stagingEvidence?.rollback?.readback === "absent",
  );
  await assertPathMissing(stagedRoot);
});

test("M2B1 evaluator-root staging rolls back and reads back absence after chmod failure", async (t) => {
  const subject = await loadSubject();
  assert.equal(typeof subject?.stageEvaluatorRoot, "function");
  const { root, planPath } = await fixtureRoot(t);
  const preflight = await subject.preflightDesignVisualM2B1({
    repositoryRoot: root,
    planPath,
    gitStatus: async () => "",
  });
  let stagedRoot;
  let chmodCalls = 0;
  const original = new Error("fixture chmod failed");
  await assert.rejects(
    subject.stageEvaluatorRoot(preflight, "sample-a", {
      mkdtemp: async (prefix) => {
        stagedRoot = await mkdtemp(prefix);
        return stagedRoot;
      },
      copyFile,
      chmod: async (...argumentsValue) => {
        chmodCalls += 1;
        if (chmodCalls === 2) throw original;
        return chmod(...argumentsValue);
      },
      rm,
      lstat,
    }),
    (error) =>
      error === original &&
      error.stagingEvidence?.root === stagedRoot &&
      error.stagingEvidence?.rollback?.readback === "absent",
  );
  await assertPathMissing(stagedRoot);
});

test("M2B1 staging rollback failure surfaces both errors and the exact retained root", async (t) => {
  const subject = await loadSubject();
  assert.equal(typeof subject?.stageEvaluatorRoot, "function");
  const { root, planPath } = await fixtureRoot(t);
  const preflight = await subject.preflightDesignVisualM2B1({
    repositoryRoot: root,
    planPath,
    gitStatus: async () => "",
  });
  let stagedRoot;
  const original = new Error("fixture copy failed");
  const rollback = new Error("fixture rollback failed");
  t.after(async () => {
    if (stagedRoot) await rm(stagedRoot, { recursive: true, force: true });
  });
  await assert.rejects(
    subject.stageEvaluatorRoot(preflight, "design", {
      mkdtemp: async (prefix) => {
        stagedRoot = await mkdtemp(prefix);
        return stagedRoot;
      },
      copyFile: async () => { throw original; },
      chmod,
      rm: async () => { throw rollback; },
      lstat,
    }),
    (error) =>
      error instanceof AggregateError &&
      error.errors[0] === original &&
      error.errors[1] === rollback &&
      error.stagingEvidence?.root === stagedRoot &&
      error.stagingEvidence?.rollback?.readback === "retained",
  );
  assert.equal((await lstat(stagedRoot)).isDirectory(), true);
});

test("M2B1 orchestrator uses three sessions, one raw Design tuple, and candidate-isolated Visual turns", async (t) => {
  const subject = await loadSubject();
  assert.equal(typeof subject?.runDesignVisualM2B1, "function");
  const { root, planPath } = await fixtureRoot(t);
  const dependencies = successfulDependencies();
  const result = await subject.runDesignVisualM2B1({
    repositoryRoot: root,
    planPath,
    ...dependencies,
  });

  assert.equal(Object.hasOwn(result, "status"), false);
  assert.equal(result.executionStatus, "completed");
  assert.equal(result.m2b1Status, "partial-unvalidated");
  assert.equal(result.promotionPass, false);
  assert.equal(Object.hasOwn(result.summary, "status"), false);
  assert.equal(result.summary.executionStatus, "completed");
  assert.equal(result.summary.m2b1Status, "partial-unvalidated");
  assert.equal(result.summary.promotionPass, false);
  assert.equal(dependencies.sessions.length, 3);
  assert.equal(new Set(dependencies.sessions.map(({ id }) => id)).size, 3);
  assert.equal(dependencies.calls.length, 3);
  assert.equal(new Set(dependencies.calls.map(({ root }) => root)).size, 3);
  assert.deepEqual(dependencies.calls.map(({ rootFiles }) => rootFiles), [
    ["approved.png"],
    ["approved.png", "candidate.png"],
    ["approved.png", "candidate.png"],
  ]);
  for (const call of dependencies.calls) {
    assert.equal(call.rootFiles.some((file) => /TASKS|smoke-plan|history|ground-truth/iu.test(file)), false);
  }
  const visualCalls = dependencies.calls.slice(1);
  const imagePaths = visualCalls.map(({ input }) => input.filter(({ type }) => type === "localImage").map(({ path: file }) => file));
  assert.equal(imagePaths.every((paths) => paths.length === 2), true);
  assert.notEqual(imagePaths[0][0], imagePaths[1][0]);
  assert.equal(path.basename(imagePaths[0][0]), "approved.png");
  assert.equal(path.basename(imagePaths[1][0]), "approved.png");
  assert.equal(visualCalls[0].rootFileHashes["approved.png"], visualCalls[1].rootFileHashes["approved.png"]);
  assert.notEqual(imagePaths[0][1], imagePaths[1][1]);
  assert.equal(visualCalls[0].rootFileHashes["candidate.png"], "0684e6867856745762217a70862b81fee8ac70787b5ab57ea13ffa58a870db62");
  assert.equal(visualCalls[1].rootFileHashes["candidate.png"], "545a332a92e5b2b9e9f13415553511f07fbdcf189bc13a4852f123c9a943a7df");
  for (const call of visualCalls) {
    assert.equal(JSON.stringify(call).match(/ground.?truth|known.?failure|positive.?control|TASKS/iu), null);
  }
  assert.equal(result.design.raw.sha256, result.visuals[0].designRaw.sha256);
  assert.equal(result.design.raw.sha256, result.visuals[1].designRaw.sha256);
  assert.equal(result.visuals[0].output.completeContractOverall, "FAIL");
  assert.equal(result.visuals[1].output.checks.some(({ verdict }) => verdict === "FAIL"), false);
  assert.equal(result.visuals[1].output.checks.some(({ verdict }) => verdict === "UNVERIFIED"), true);
  assert.deepEqual(result.summary.evaluatorIdentities.map(({ threadId, turnId }) => [threadId, turnId]), [
    ["thread-1", "turn-1"],
    ["thread-2", "turn-2"],
    ["thread-3", "turn-3"],
  ]);
  assert.equal(result.visuals[0].evidence.thread.id, "thread-2");
  assert.equal(result.visuals[0].evidence.turn.id, "turn-2");
  assert.deepEqual(Object.keys(result.visuals[0].evidence).sort(), [
    "appServer", "blockers", "events", "input", "mcpAfter", "outputSchema",
    "thread", "threadStart", "toolEvidence", "turn",
  ]);
  assert.deepEqual(result.visuals[0].evidence.events.records.map(({ method }) => method), [
    "turn/started", "item/started", "item/completed", "turn/completed",
  ]);
  assert.equal(result.visuals[0].evidence.events.records.at(-1).turn.status, "completed");
  assert.deepEqual(result.visuals[0].evidence.blockers, []);
  assert.equal(result.visuals[0].evidence.outputSchema.sha256, digest("schema-1"));
  assert.equal(Object.hasOwn(result.visuals[0].evidence.outputSchema, "value"), false);
  assert.deepEqual(result.visuals[0].evidence.mcpAfter.records, []);
  assert.equal(result.visuals[0].evidence.mcpAfter.sha256, digest("[]"));
  const retainedEvidence = JSON.stringify(result.visuals[0].evidence);
  assert.equal(retainedEvidence.includes("SYNTHETIC_IMAGE_BYTES_MUST_NOT_PERSIST"), false);
  assert.equal(retainedEvidence.includes("SYNTHETIC_TEST_ONLY"), false);
});

test("M2B1 validators reject altered pins, escaping paths, reordered transfer, and broad PASS", async (t) => {
  const subject = await loadSubject();
  assert.equal(typeof subject?.preflightDesignVisualM2B1, "function");
  const { root, plan, planPath } = await fixtureRoot(t);
  const changed = path.join(root, ...plan.inputs.designPrompt.path.split("/"));
  await writeFile(changed, "changed bytes");
  await assert.rejects(
    subject.preflightDesignVisualM2B1({ repositoryRoot: root, planPath, gitStatus: async () => "" }),
    /pin.*(?:byte|hash)|provenance/iu,
  );

  const escaped = structuredClone(plan);
  escaped.inputs.designPrompt.path = "../outside.md";
  assert.throws(() => subject.validateDesignVisualM2B1Plan(escaped), /path/iu);

  const design = designOutput();
  const reordered = visualOutput(design, "sample-a", true);
  [reordered.checks[0], reordered.checks[1]] = [reordered.checks[1], reordered.checks[0]];
  assert.throws(() => subject.validateVisualM2B1Output(reordered, design, "sample-a"), /order|transfer/iu);
  const broadPass = visualOutput(design, "sample-b", false);
  broadPass.completeContractOverall = "PASS";
  assert.throws(() => subject.validateVisualM2B1Output(broadPass, design, "sample-b"), /aggregate|overall/iu);

  const boundaryFail = visualOutput(design, "sample-b", false);
  boundaryFail.checks.find(({ semantics }) => semantics === "boundary").verdict = "FAIL";
  assert.throws(() => subject.validateVisualM2B1Output(boundaryFail, design, "sample-b"), /sample-b|control|fail/iu);

});

test("M2B1 plan rejects contradictory candidate outcome literals", async () => {
  const subject = await loadSubject();
  const plan = JSON.parse(await readFile(PLAN_PATH, "utf8"));
  plan.candidates[0].requiredOutcome = "zero-fails-with-unsupported-layers-unverified";
  assert.throws(() => subject.validateDesignVisualM2B1Plan(plan), /outcome/iu);
});

test("M2B1 rejects reused evaluator thread or turn identity before success artifacts", async (t) => {
  const subject = await loadSubject();
  const { root, planPath } = await fixtureRoot(t);
  const dependencies = successfulDependencies();
  const originalRunTurn = dependencies.runTurn;
  dependencies.runTurn = async (options) => {
    const result = await originalRunTurn(options);
    result.thread.id = "reused-thread";
    result.turn.id = "reused-turn";
    return result;
  };
  await assert.rejects(
    subject.runDesignVisualM2B1({ repositoryRoot: root, planPath, ...dependencies }),
    /identity|thread|turn/iu,
  );
  assert.equal(dependencies.writes.some(({ file }) => file.endsWith("summary.json")), false);
});

test("M2B1 runtime cleanup runs once before success writes and cleanup failure leaves only blocked evidence", async (t) => {
  const subject = await loadSubject();
  const { root, planPath } = await fixtureRoot(t);
  const dependencies = successfulDependencies();
  let finishCalls = 0;
  const finishRuntime = async () => {
    finishCalls += 1;
    const error = new Error("runtime cleanup failed sk-proj-SYNTHETIC_TEST_ONLY_abcdefghijklmnop");
    error.runtimeCleanupEvidence = {
      processTerminationConfirmed: true,
      isolatedHome: { readback: "removed" },
    };
    throw error;
  };
  await assert.rejects(
    subject.runDesignVisualM2B1({
      repositoryRoot: root,
      planPath,
      ...dependencies,
      finishRuntime,
    }),
    /runtime cleanup failed/,
  );
  assert.equal(finishCalls, 1);
  assert.equal(dependencies.writes.filter(({ file }) => !file.endsWith("blocked.json")).length, 0);
  assert.equal(dependencies.writes.filter(({ file }) => file.endsWith("blocked.json")).length, 1);
  const blocked = dependencies.writes.find(({ file }) => file.endsWith("blocked.json")).value;
  assert.equal(blocked.cleanupEvidence.phase, "post-evaluator-cleanup");
  assert.equal(blocked.cleanupEvidence.finishAttempts, 1);
  assert.equal(blocked.cleanupEvidence.stagedRoots.length, 3);
  assert.equal(blocked.cleanupEvidence.stagedRoots.every(({ readback }) => readback === "removed"), true);
  assert.equal(blocked.cleanupEvidence.runtime.status, "failed");
  assert.deepEqual(JSON.parse(blocked.cleanupEvidence.runtime.available.text), {
    isolatedHome: { readback: "removed" },
    processTerminationConfirmed: true,
  });
  assert.equal(blocked.cleanupEvidence.cause.message.redacted, true);
  assert.equal(JSON.stringify(blocked).includes("SYNTHETIC_TEST_ONLY"), false);
});

test("M2B1 preflight rejects dirty repositories and every output collision before sessions start", async (t) => {
  const subject = await loadSubject();
  const { root, plan, planPath } = await fixtureRoot(t);
  let sessions = 0;
  await assert.rejects(
    subject.runDesignVisualM2B1({
      repositoryRoot: root,
      planPath,
      gitStatus: async () => " M changed.md\n",
      createSession: async () => { sessions += 1; },
    }),
    /clean repository/iu,
  );
  assert.equal(sessions, 0);

  const collision = path.join(root, ...plan.outputs.summary.split("/"));
  await mkdir(path.dirname(collision), { recursive: true });
  await writeFile(collision, "existing evidence");
  await assert.rejects(
    subject.runDesignVisualM2B1({
      repositoryRoot: root,
      planPath,
      gitStatus: async () => "",
      createSession: async () => { sessions += 1; },
    }),
    /collision|exists/iu,
  );
  assert.equal(sessions, 0);
  assert.equal(await readFile(collision, "utf8"), "existing evidence");
});

test("M2B1 real Git preflight accepts an exact clean fixture repository", async (t) => {
  const subject = await loadSubject();
  const { root, planPath } = await fixtureRoot(t);
  await execFile("git", ["init"], { cwd: root });
  await execFile("git", ["config", "user.email", "m2b1@example.invalid"], { cwd: root });
  await execFile("git", ["config", "user.name", "M2B1 Fixture"], { cwd: root });
  await execFile("git", ["add", "."], { cwd: root });
  await execFile("git", ["commit", "-m", "fixture"], { cwd: root });
  const result = await subject.preflightDesignVisualM2B1({ repositoryRoot: root, planPath });
  assert.equal(result.plan.id, "design-visual-m2-b1-smoke-plan-v1");
});

test("M2B1 failure stops without retry, preserves verified partial evidence, and never writes after unsafe cleanup", async (t) => {
  const subject = await loadSubject();
  const { root, planPath } = await fixtureRoot(t);
  const verified = successfulDependencies();
  const successfulRunTurn = verified.runTurn;
  verified.runTurn = async (options) => {
    if (verified.calls.length === 1) {
      verified.calls.push({ failed: true });
      options.session.closed = true;
      options.session.processExitCode = 0;
      const error = new Error("sample-a evaluator failed");
      error.freshEvaluatorEvidence = { appServer: { processExitCode: 0 }, events: [{ id: "partial" }] };
      throw error;
    }
    return successfulRunTurn(options);
  };
  await assert.rejects(
    subject.runDesignVisualM2B1({ repositoryRoot: root, planPath, ...verified }),
    /sample-a evaluator failed/,
  );
  assert.equal(verified.sessions.length, 2);
  assert.equal(verified.writes.length, 1);
  assert.equal(verified.writes[0].file.endsWith("blocked.json"), true);
  assert.deepEqual(verified.writes[0].value.partialEvidence.events, [{ id: "partial" }]);

  const unsafe = successfulDependencies();
  unsafe.runTurn = async (options) => {
    unsafe.calls.push({ failed: true });
    options.session.closed = false;
    const error = new Error("close unverified");
    error.freshEvaluatorEvidence = { appServer: { processExitCode: null } };
    throw error;
  };
  await assert.rejects(
    subject.runDesignVisualM2B1({ repositoryRoot: root, planPath, ...unsafe }),
    /close unverified/,
  );
  assert.equal(unsafe.sessions.length, 1);
  assert.equal(unsafe.writes.length, 0);
});
