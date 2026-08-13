import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { createHash } from "node:crypto";
import { chmod, copyFile, cp, lstat, mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
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
const STRICT_PLAN_PATH = path.join(
  ROOT,
  "evals/skill-contracts/design-visual-m2-b1-smoke-plan-v3.json",
);
const BOUNDED_DIAGNOSTIC_PLAN_PATH = path.join(
  ROOT,
  "evals/skill-contracts/design-visual-m2-b1-smoke-plan-v4.json",
);
const STDERR_DIAGNOSTIC_PLAN_PATH = path.join(
  ROOT,
  "evals/skill-contracts/design-visual-m2-b1-smoke-plan-v5.json",
);
const PATH_PRIVATE_IMAGE_PLAN_PATH = path.join(
  ROOT,
  "evals/skill-contracts/design-visual-m2-b1-smoke-plan-v6.json",
);
const ATTACHMENT_SEMANTICS_PLAN_PATH = path.join(
  ROOT,
  "evals/skill-contracts/design-visual-m2-b1-smoke-plan-v7.json",
);
const ATTACHED_IMAGE_PLAN_PATH = path.join(
  ROOT,
  "evals/skill-contracts/design-visual-m2-b1-smoke-plan-v8.json",
);
const ATTACHED_IMAGE_DESIGN_PROMPT = Object.freeze({
  path: "evals/skill-contracts/design-visual-m2-design-prompt-v6.md",
  bytes: 2847,
  sha256: "fcf9baad94269d11e4f744a65b47b4989872cdc030d7aa017405efdc34db55f5",
});
const ATTACHED_IMAGE_VISUAL_PROMPT = Object.freeze({
  path: "evals/skill-contracts/design-visual-m2-visual-prompt-v10.md",
  bytes: 3051,
  sha256: "46285875db42fdf6f89ed7792f40dcc6b5ad64400923184aa0e946e784015eb0",
});

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

async function successorFixtureRoot(t, plan) {
  const root = await mkdtemp(path.join(tmpdir(), "joeness-m2-b1-successor-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const pins = [
    ...Object.values(plan.inputs),
    ...plan.candidates.map(({ image }) => image),
    plan.predecessor.plan,
    plan.predecessor.blockedAttempt,
    plan.predecessor.latestReceipt,
    plan.source.runner,
    plan.source.freshTurnAdapter,
    plan.source.collector,
  ];
  for (const pin of pins) {
    const destination = path.join(root, ...pin.path.split("/"));
    await mkdir(path.dirname(destination), { recursive: true });
    if ([plan.source.runner, plan.source.freshTurnAdapter, plan.source.collector].includes(pin)) {
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
  const planPath = path.join(
    root,
    `evals/skill-contracts/design-visual-m2-b1-smoke-plan-v${plan.schemaVersion}.json`,
  );
  await mkdir(path.dirname(planPath), { recursive: true });
  await writeFile(planPath, JSON.stringify(plan, null, 2) + "\n");
  return { root, planPath };
}

function copiedFixtureGitReadBlob(plan) {
  const pins = new Map(
    [plan.source.runner, plan.source.freshTurnAdapter, plan.source.collector]
      .map((pin) => [pin.path, pin]),
  );
  return async (_root, implementationCommit, sourcePath) => {
    assert.equal(implementationCommit, plan.source.repositoryCommit);
    const pin = pins.get(sourcePath);
    if (pin === undefined) throw new Error("unexpected source blob request");
    const bytes = await execFile(
      "git",
      ["show", `${implementationCommit}:${sourcePath}`],
      { cwd: ROOT, encoding: "buffer", maxBuffer: 1024 * 1024 },
    );
    return bytes.stdout;
  };
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
        threadStart: {
          request: {
            ephemeral: true,
            approvalPolicy: "never",
            permissions: "joewrks-eval-control-v3",
            projectDocMaxBytes: 0,
            selectedCapabilityRootCount: 0,
            dynamicToolCount: index === 0 ? 0 : 1,
            runtimeWorkspaceRootCount: 1,
            environmentCount: 1,
          },
          response: {
            threadId,
            ephemeral: true,
            priorTurnCount: 0,
            instructionSourceCount: 0,
          },
        },
        thread: {
          id: threadId,
          activePermissionProfileId: "joewrks-eval-control-v3",
          approvalPolicy: "never",
          approvalsReviewer: "user",
          sandbox: { type: "readOnly", networkAccess: false },
          ephemeral: true,
          priorTurnCount: 0,
          instructionSourceCount: 0,
          runtimeWorkspaceRootCount: 1,
        },
        turn: {
          id: turnId,
          request: {
            inputDescriptorCount: options.input.length,
            inputRequestSha256: digest(`request-${index}`),
            approvalPolicy: "never",
            permissions: "joewrks-eval-control-v3",
            outputSchemaSha256: digest(`schema-${index}`),
          },
        },
        input: {
          requestSha256: digest(`request-${index}`),
          descriptors: [
            { index: 0, type: "text", text: "prompt sk-proj-SYNTHETIC_TEST_ONLY_abcdefghijklmnop", byteLength: 6, sha256: digest(`prompt-${index}`) },
            ...options.input
              .map((entry, inputIndex) => ({ entry, inputIndex }))
              .filter(({ entry }) => entry.type === "localImage")
              .map(({ entry, inputIndex }, imageOffset) => ({
                index: inputIndex,
                type: "localImage",
                path: entry.path,
                byteLength: 4,
                sha256: digest(`image-${index}-${imageOffset + 1}`),
                originalDetail: "unverified",
                embeddedBytes: "SYNTHETIC_IMAGE_BYTES_MUST_NOT_PERSIST",
              })),
          ],
          controllerLocalImages: controllerImageEvidence(
            options.input
              .filter(({ type }) => type === "localImage")
              .map((_, imageOffset) => digest(`image-${index}-${imageOffset + 1}`)),
            1,
          ),
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
        appServer: {
          processExitCode: 0,
          stderr: {
            byteLength: 0,
            sha256: "f".repeat(64),
            truncated: false,
            captureTruncated: false,
          },
          imageDiagnostics: safeImageDiagnostics({
            status: "NO_ROUTER_IMAGE_ERROR",
            observationCount: 0,
            expectedTargetCount: options.input.filter(({ type }) => type === "localImage").length,
            effectivePathMatch: "UNVERIFIED",
            matchedInputIndex: null,
            effectivePathAbsolute: "UNVERIFIED",
            effectivePathWithinRoot: "UNVERIFIED",
            outerCategory: "UNVERIFIED",
            reportedCategory: "UNVERIFIED",
          }),
          successfulImageViews: safeSuccessfulImageViews(),
        },
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

test("M2B1 strict-schema plan preserves v2 evidence and uses only v3 outputs", async () => {
  const subject = await loadSubject();
  const plan = JSON.parse(await readFile(STRICT_PLAN_PATH, "utf8"));
  const validated = subject.validateDesignVisualM2B1Plan(plan);

  assert.equal(validated.schemaVersion, 3);
  assert.equal(validated.id, "design-visual-m2-b1-smoke-plan-v3");
  assert.equal(
    validated.predecessor.methodChange,
    "closed-object-response-schemas-required-by-observed-api-error",
  );
  assert.equal(validated.predecessor.attemptPolicy, "one-method-changed-attempt-no-automatic-retry");
  assert.equal(validated.runtime.retryCount, 0);
  assert.equal(Object.values(validated.outputs).every((file) => file.includes("-v3-")), true);
  assert.equal(
    Object.values(validated.outputs).some((file) => file.includes("-v1-") || file.includes("-v2-")),
    false,
  );
  assert.deepEqual(validated.predecessor, {
    plan: {
      path: "evals/skill-contracts/design-visual-m2-b1-smoke-plan-v2.json",
      bytes: 5599,
      sha256: "758f6087d628db856e48752e8172126cd7c1f70e00ccf733b2f8afbfc76ffe0d",
    },
    blockedAttempt: {
      path: "evals/skill-contracts/design-visual-m2-b1-v2-blocked.json",
      bytes: 44050,
      sha256: "979399d04ecba4fa48fb59c081c0aee22e8ae838391169b89ea1fd7ab69dd700",
    },
    latestReceipt: {
      path: "evals/skill-contracts/design-visual-m2-attempt-index-v4.json",
      bytes: 3681,
      sha256: "12bcf3f41105a3d4b955204f81efee451e21792d61e787af1d33f90176f2caf0",
    },
    methodChange: "closed-object-response-schemas-required-by-observed-api-error",
    attemptPolicy: "one-method-changed-attempt-no-automatic-retry",
  });
  assert.equal(validated.source.repositoryCommit, "21be38fbebe67160d1ab7c82cd88f52fe70b864c");
  assert.deepEqual(validated.source.runner, {
    path: "evals/support/run-design-visual-m2-b1.mjs",
    bytes: 49921,
    sha256: "6d0c52d7fd65bcb2b12136c5adc18596c6e6eb064238943ba876a17f8ee166ac",
  });

  const changed = structuredClone(plan);
  changed.predecessor.blockedAttempt.sha256 = "0".repeat(64);
  assert.throws(() => subject.validateDesignVisualM2B1Plan(changed), /predecessor|pin/iu);
});

test("M2B1 bounded-diagnostic plan preserves v3 evidence and uses only v4 outputs", async () => {
  const subject = await loadSubject();
  const plan = JSON.parse(await readFile(BOUNDED_DIAGNOSTIC_PLAN_PATH, "utf8"));

  const validated = subject.validateDesignVisualM2B1Plan(plan);
  assert.equal(validated.schemaVersion, 4);
  assert.equal(validated.id, "design-visual-m2-b1-smoke-plan-v4");
  assert.equal(
    validated.predecessor.methodChange,
    "prioritized-bounded-failure-evidence-retention-no-evaluator-contract-change",
  );
  assert.equal(validated.runtime.retryCount, 0);
  assert.equal(Object.values(validated.outputs).every((file) => file.includes("-v4-")), true);
  assert.equal(
    Object.values(validated.outputs).some((file) =>
      file.includes("-v1-") || file.includes("-v2-") || file.includes("-v3-")),
    false,
  );

  const changed = structuredClone(plan);
  changed.predecessor.latestReceipt.bytes += 1;
  assert.throws(() => subject.validateDesignVisualM2B1Plan(changed), /predecessor|pin/iu);
});

test("M2B1 v4 preflight rejects input and candidate drift from the pinned v3 contract", async (t) => {
  const subject = await loadSubject();
  const boundedPlan = JSON.parse(await readFile(BOUNDED_DIAGNOSTIC_PLAN_PATH, "utf8"));

  for (const target of ["input", "candidate"]) {
    const plan = structuredClone(boundedPlan);
    const fixture = await successorFixtureRoot(t, plan);
    const changedBytes = Buffer.from(`changed-${target}-contract\n`, "utf8");
    const pin = target === "input" ? plan.inputs.designSkill : plan.candidates[0].image;
    pin.bytes = changedBytes.byteLength;
    pin.sha256 = digest(changedBytes);
    await writeFile(path.join(fixture.root, ...pin.path.split("/")), changedBytes);
    await writeFile(fixture.planPath, JSON.stringify(plan, null, 2) + "\n");

    await assert.rejects(
      subject.preflightDesignVisualM2B1({
        repositoryRoot: fixture.root,
        planPath: fixture.planPath,
        gitStatus: async () => "",
        gitIdentity: async () => "f".repeat(40),
        gitReadBlob: copiedFixtureGitReadBlob(plan),
      }),
      /contract|predecessor|unchanged/iu,
    );
  }
});

test("M2B1 stderr-diagnostic generation preserves v4 evidence and uses only v5 outputs", async () => {
  const subject = await loadSubject();
  const predecessor = JSON.parse(await readFile(BOUNDED_DIAGNOSTIC_PLAN_PATH, "utf8"));
  const plan = JSON.parse(await readFile(STDERR_DIAGNOSTIC_PLAN_PATH, "utf8"));

  const validated = subject.validateDesignVisualM2B1Plan(plan);
  assert.equal(validated.schemaVersion, 5);
  assert.equal(validated.id, "design-visual-m2-b1-smoke-plan-v5");
  assert.equal(
    validated.predecessor.methodChange,
    "bounded-sanitized-app-server-stderr-diagnostic-retention-no-evaluator-contract-change",
  );
  assert.equal(validated.runtime.retryCount, 0);
  assert.equal(Object.values(validated.outputs).every((file) => file.includes("-v5-")), true);
  assert.equal(
    Object.values(validated.outputs).some((file) =>
      ["-v1-", "-v2-", "-v3-", "-v4-"].some((generation) => file.includes(generation))),
    false,
  );
  assert.equal(new Set(Object.values(validated.outputs)).size, 8);
  for (const key of ["runtime", "inputs", "candidates", "claimScope", "originalDetail", "boundaries"]) {
    assert.deepEqual(validated[key], predecessor[key]);
  }
  assert.equal(validated.source.repositoryCommit, "9c38529dbba8ae9fb566d57746092f7a8fb06bd0");

  for (const predecessorKey of ["plan", "blockedAttempt", "latestReceipt"]) {
    const changed = structuredClone(plan);
    changed.predecessor[predecessorKey].sha256 = "0".repeat(64);
    assert.throws(() => subject.validateDesignVisualM2B1Plan(changed), /predecessor|pin/iu);
  }
});

test("M2B1 v5 preflight accepts the unchanged v4 evaluator contract and rejects drift", async (t) => {
  const subject = await loadSubject();
  const acceptedPlan = JSON.parse(await readFile(STDERR_DIAGNOSTIC_PLAN_PATH, "utf8"));
  const acceptedFixture = await successorFixtureRoot(t, acceptedPlan);
  const accepted = await subject.preflightDesignVisualM2B1({
    repositoryRoot: acceptedFixture.root,
    planPath: acceptedFixture.planPath,
    gitStatus: async () => "",
    gitIdentity: async () => "f".repeat(40),
    gitReadBlob: copiedFixtureGitReadBlob(acceptedPlan),
  });
  assert.equal(accepted.plan.schemaVersion, 5);

  for (const target of ["input", "candidate"]) {
    const changedPlan = structuredClone(acceptedPlan);
    const changedBytes = Buffer.from(`changed-v5-${target}\n`, "utf8");
    const pin = target === "input"
      ? changedPlan.inputs.designSkill
      : changedPlan.candidates[0].image;
    pin.bytes = changedBytes.byteLength;
    pin.sha256 = digest(changedBytes);
    const changedFixture = await successorFixtureRoot(t, changedPlan);
    await writeFile(
      path.join(changedFixture.root, ...pin.path.split("/")),
      changedBytes,
    );
    await assert.rejects(
      subject.preflightDesignVisualM2B1({
        repositoryRoot: changedFixture.root,
        planPath: changedFixture.planPath,
        gitStatus: async () => "",
        gitIdentity: async () => "f".repeat(40),
        gitReadBlob: copiedFixtureGitReadBlob(changedPlan),
      }),
      /contract|unchanged/iu,
    );
  }
});

test("M2B1 preflight rejects a source pin whose commit blob differs", async (t) => {
  const subject = await loadSubject();
  const plan = JSON.parse(await readFile(STDERR_DIAGNOSTIC_PLAN_PATH, "utf8"));
  const fixture = await successorFixtureRoot(t, plan);
  await assert.rejects(
    subject.preflightDesignVisualM2B1({
      repositoryRoot: fixture.root,
      planPath: fixture.planPath,
      gitStatus: async () => "",
      gitIdentity: async () => "f".repeat(40),
      gitReadBlob: async () => Buffer.from("wrong source blob\n"),
    }),
    /source.*blob|blob.*pin/iu,
  );
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
    if ([
      plan.source.runner,
      plan.source.freshTurnAdapter,
      plan.source.collector,
    ].includes(pin)) {
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
  success.gitReadBlob = copiedFixtureGitReadBlob(plan);
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
  failure.gitReadBlob = success.gitReadBlob;
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

test("M2B1 orchestrator writes nothing unless staging rollback proves its root absent", async (t) => {
  const subject = await loadSubject();
  for (const readback of ["retained", "unknown"]) {
    const { root, planPath } = await fixtureRoot(t);
    const dependencies = successfulDependencies();
    const original = new Error(`staging failed and root ${readback}`);
    original.stagingEvidence = {
      root: path.join(root, `${readback}-staging-root`),
      rollback: { attempted: true, readback, cleanupErrors: ["fixture"] },
    };
    await assert.rejects(
      subject.runDesignVisualM2B1({
        repositoryRoot: root,
        planPath,
        ...dependencies,
        runTurn: async (options) => {
          options.session.closed = true;
          options.session.processExitCode = 0;
          throw original;
        },
      }),
      new RegExp(`staging failed and root ${readback}`),
    );
    assert.deepEqual(dependencies.writes, [], readback);
  }
});

test("M2B1 orchestrator writes nothing when staged-root cleanup is not proven removed", async (t) => {
  const subject = await loadSubject();
  for (const readback of ["retained", "unknown"]) {
    const { root, planPath } = await fixtureRoot(t);
    const dependencies = successfulDependencies();
    await assert.rejects(
      subject.runDesignVisualM2B1({
        repositoryRoot: root,
        planPath,
        ...dependencies,
        cleanupStagedRoots: async (stagedRoots) => stagedRoots.map((staged) => ({
          ...staged,
          readback,
        })),
      }),
      /cleanup|removed|retained|unknown/iu,
    );
    assert.deepEqual(dependencies.writes, [], readback);
  }
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
    "appServer", "attachmentBoundary", "blockers", "events", "input", "mcpAfter",
    "outputSchema", "thread", "threadStart", "toolEvidence", "turn",
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
    result.threadStart.response.threadId = "reused-thread";
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
  assert.equal(
    blocked.cleanupEvidence.stagedRoots.every((entry) => !Object.hasOwn(entry, "root")),
    true,
  );
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
  assert.equal(verified.writes[0].value.partialEvidence.retention, "prioritized");
  assert.equal(verified.writes[0].value.partialEvidence.events.arrayLength, 1);
  assert.deepEqual(verified.writes[0].value.partialEvidence.events.window.head, [{}]);

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

test("M2B1 Task 1 prevalidation retains only bounded count evidence for every exceeded limit", async (t) => {
  const subject = await loadSubject();
  const { root, planPath } = await fixtureRoot(t);
  let elementTrapCalls = 0;
  const hostileElement = (pathCanary) => new Proxy({
    pathCanary,
    credentialCanary: "sk-proj-SYNTHETIC_TEST_ONLY_abcdefghijklmnop",
  }, {
    get() {
      elementTrapCalls += 1;
      throw new Error("Task 1 array elements must not be read");
    },
    ownKeys() {
      elementTrapCalls += 1;
      throw new Error("Task 1 array elements must not be reflected");
    },
  });
  const cases = [
    {
      label: "events only",
      eventsCount: 513,
      mcpAfterCount: 0,
      expected: {
        eventsCount: 513,
        eventsLimit: 512,
        eventsOverLimit: true,
        mcpAfterCount: 0,
        mcpAfterLimit: 128,
        mcpAfterOverLimit: false,
        rawPayloadRetained: false,
      },
    },
    {
      label: "MCP only",
      eventsCount: 2,
      mcpAfterCount: 129,
      expected: {
        eventsCount: 2,
        eventsLimit: 512,
        eventsOverLimit: false,
        mcpAfterCount: 129,
        mcpAfterLimit: 128,
        mcpAfterOverLimit: true,
        rawPayloadRetained: false,
      },
    },
    {
      label: "both",
      eventsCount: 513,
      mcpAfterCount: 129,
      expected: {
        eventsCount: 513,
        eventsLimit: 512,
        eventsOverLimit: true,
        mcpAfterCount: 129,
        mcpAfterLimit: 128,
        mcpAfterOverLimit: true,
        rawPayloadRetained: false,
      },
    },
  ];
  for (const current of cases) {
    const dependencies = successfulDependencies();
    const successfulRunTurn = dependencies.runTurn;
    dependencies.runTurn = async (options) => {
      const result = await successfulRunTurn(options);
      result.events = Array.from({ length: current.eventsCount }, (_, index) => index === 0
        ? hostileElement("C:\\Users\\private\\task1-events.log")
        : { method: index === current.eventsCount - 1 ? "turn/completed" : "item/completed" });
      result.mcpAfter = Array.from({ length: current.mcpAfterCount }, (_, index) => index === 0
        ? hostileElement("C:\\Users\\private\\task1-mcp.json")
        : { name: `server-${index}` });
      return result;
    };

    await assert.rejects(
      subject.runDesignVisualM2B1({ repositoryRoot: root, planPath, ...dependencies }),
      /Task 1 evidence is incomplete, blocked, or unbounded/,
      current.label,
    );
    const blocked = dependencies.writes.find(({ file }) => file.endsWith("blocked.json")).value;
    assert.deepEqual(blocked.task1Prevalidation, current.expected, current.label);
    assert.deepEqual(Object.keys(blocked.task1Prevalidation).sort(), [
      "eventsCount",
      "eventsLimit",
      "eventsOverLimit",
      "mcpAfterCount",
      "mcpAfterLimit",
      "mcpAfterOverLimit",
      "rawPayloadRetained",
    ]);
    const serialized = JSON.stringify(blocked);
    assert.equal(serialized.includes("SYNTHETIC_TEST_ONLY"), false, current.label);
    assert.equal(serialized.includes("private"), false, current.label);
    assert.deepEqual(blocked.partialEvidence, {}, current.label);
  }
  assert.equal(elementTrapCalls, 0);
});

test("M2B1 Task 1 prevalidation keeps the existing 512-event and 128-MCP limits inclusive", async (t) => {
  const subject = await loadSubject();
  const { root, planPath } = await fixtureRoot(t);
  const dependencies = successfulDependencies();
  const successfulRunTurn = dependencies.runTurn;
  dependencies.runTurn = async (options) => {
    const result = await successfulRunTurn(options);
    result.events = Array.from({ length: 512 }, (_, index) => ({
      method: index === 511 ? "turn/completed" : "item/completed",
      threadId: result.thread.id,
      turnId: result.turn.id,
      complete: true,
      blockers: [],
      ...(index === 511 ? { turn: { id: result.turn.id, status: "completed" } } : {}),
    }));
    result.mcpAfter = Array.from({ length: 128 }, (_, index) => ({
      name: `server-${index}`,
      status: "disabled",
    }));
    return result;
  };

  const summary = await subject.runDesignVisualM2B1({
    repositoryRoot: root,
    planPath,
    ...dependencies,
  });
  assert.equal(summary.executionStatus, "completed");
  assert.equal(dependencies.writes.some(({ file }) => file.endsWith("blocked.json")), false);
});

test("M2B1 Task 1 prevalidation omits a count summary for malformed or proxy arrays", async (t) => {
  const subject = await loadSubject();
  const { root, planPath } = await fixtureRoot(t);
  const cases = [
    { label: "non-array events", apply: (result) => { result.events = {}; } },
    { label: "non-array MCP", apply: (result) => { result.mcpAfter = {}; } },
    { label: "blocked result", apply: (result) => { result.blockers = ["synthetic-blocker"]; } },
    { label: "missing output schema", apply: (result) => { result.outputSchema = null; } },
  ];
  let trapCalls = 0;
  cases.push({
    label: "proxy events",
    apply: (result) => {
      result.events = new Proxy([], {
        get() {
          trapCalls += 1;
          throw new Error("proxy event trap must not run");
        },
      });
    },
  });
  cases.push({
    label: "proxy MCP",
    apply: (result) => {
      result.mcpAfter = new Proxy([], {
        get() {
          trapCalls += 1;
          throw new Error("proxy MCP trap must not run");
        },
      });
    },
  });
  cases.push({
    label: "proxy blockers",
    apply: (result) => {
      result.blockers = new Proxy([], {
        get() {
          trapCalls += 1;
          throw new Error("proxy blocker trap must not run");
        },
      });
    },
  });
  cases.push({
    label: "proxy output schema",
    apply: (result) => {
      result.outputSchema = new Proxy({}, {
        get() {
          trapCalls += 1;
          throw new Error("proxy output schema trap must not run");
        },
      });
    },
  });
  cases.push({
    label: "accessor events",
    apply: (result) => {
      Object.defineProperty(result, "events", {
        configurable: true,
        enumerable: true,
        get() {
          trapCalls += 1;
          throw new Error("event accessor must not run");
        },
      });
    },
  });
  cases.push({
    label: "accessor MCP",
    apply: (result) => {
      Object.defineProperty(result, "mcpAfter", {
        configurable: true,
        enumerable: true,
        get() {
          trapCalls += 1;
          throw new Error("MCP accessor must not run");
        },
      });
    },
  });
  cases.push({
    label: "accessor blockers",
    apply: (result) => {
      Object.defineProperty(result, "blockers", {
        configurable: true,
        enumerable: true,
        get() {
          trapCalls += 1;
          throw new Error("blocker accessor must not run");
        },
      });
    },
  });
  cases.push({
    label: "accessor output schema",
    apply: (result) => {
      Object.defineProperty(result, "outputSchema", {
        configurable: true,
        enumerable: true,
        get() {
          trapCalls += 1;
          throw new Error("output schema accessor must not run");
        },
      });
    },
  });
  for (const [label, key, value] of [
    ["revoked events", "events", []],
    ["revoked MCP", "mcpAfter", []],
    ["revoked blockers", "blockers", []],
    ["revoked output schema", "outputSchema", {}],
  ]) {
    cases.push({
      label,
      apply: (result) => {
        const revocable = Proxy.revocable(value, {});
        revocable.revoke();
        result[key] = revocable.proxy;
      },
    });
  }

  for (const current of cases) {
    const dependencies = successfulDependencies();
    const successfulRunTurn = dependencies.runTurn;
    dependencies.runTurn = async (options) => {
      const result = await successfulRunTurn(options);
      return current.apply(result) ?? result;
    };
    await assert.rejects(
      subject.runDesignVisualM2B1({ repositoryRoot: root, planPath, ...dependencies }),
      /Task 1 evidence is incomplete, blocked, or unbounded/,
      current.label,
    );
    const blocked = dependencies.writes.find(({ file }) => file.endsWith("blocked.json")).value;
    assert.equal(Object.hasOwn(blocked, "task1Prevalidation"), false, current.label);
  }
  assert.equal(trapCalls, 0);
});

test("M2B1 prevalidation seams fail closed without invoking result identity or shutdown traps", async (t) => {
  const subject = await loadSubject();
  const { root, planPath } = await fixtureRoot(t);
  let trapCalls = 0;
  const trappingProxy = (target, label) => new Proxy(target, {
    get(source, key, receiver) {
      if (key === "then") return undefined;
      trapCalls += 1;
      throw new Error(`${label} proxy trap must not run`);
    },
  });
  const accessor = (result, key, label) => {
    Object.defineProperty(result, key, {
      configurable: true,
      enumerable: true,
      get() {
        trapCalls += 1;
        throw new Error(`${label} accessor must not run`);
      },
    });
    return result;
  };
  const cases = [
    {
      label: "top-level result proxy",
      expected: /session shutdown is unverified/,
      mutate: (result) => trappingProxy(result, "result"),
    },
    {
      label: "app server accessor",
      expected: /session shutdown is unverified/,
      mutate: (result) => accessor(result, "appServer", "app server"),
    },
    {
      label: "app server proxy",
      expected: /session shutdown is unverified/,
      mutate: (result) => {
        result.appServer = trappingProxy(result.appServer, "app server");
        return result;
      },
    },
    {
      label: "exit-code accessor",
      expected: /session shutdown is unverified/,
      mutate: (result) => {
        accessor(result.appServer, "processExitCode", "exit code");
        return result;
      },
    },
    {
      label: "thread accessor",
      expected: /thread identity is missing/,
      mutate: (result) => accessor(result, "thread", "thread"),
    },
    {
      label: "thread proxy",
      expected: /thread identity is missing/,
      mutate: (result) => {
        result.thread = trappingProxy(result.thread, "thread");
        return result;
      },
    },
    {
      label: "turn accessor",
      expected: /turn identity is missing/,
      mutate: (result) => accessor(result, "turn", "turn"),
    },
    {
      label: "turn proxy",
      expected: /turn identity is missing/,
      mutate: (result) => {
        result.turn = trappingProxy(result.turn, "turn");
        return result;
      },
    },
  ];

  for (const current of cases) {
    const dependencies = successfulDependencies();
    const successfulRunTurn = dependencies.runTurn;
    dependencies.runTurn = async (options) => {
      const result = await successfulRunTurn(options);
      return current.mutate(result);
    };
    await assert.rejects(
      subject.runDesignVisualM2B1({ repositoryRoot: root, planPath, ...dependencies }),
      current.expected,
      current.label,
    );
  }
  assert.equal(trapCalls, 0);
});

test("M2B1 accepts the collector session getter and process pid identity shape", async (t) => {
  const subject = await loadSubject();
  const { root, planPath } = await fixtureRoot(t);
  const dependencies = successfulDependencies();
  let exitCodeReads = 0;
  dependencies.createSession = async () => {
    let processExitCode = null;
    const session = {
      process: { pid: 41001 + dependencies.sessions.length },
      closed: false,
      get processExitCode() {
        exitCodeReads += 1;
        return processExitCode;
      },
      set processExitCode(value) {
        processExitCode = value;
      },
      setProcessExitCode(value) {
        processExitCode = value;
      },
    };
    dependencies.sessions.push(session);
    return session;
  };
  const successfulRunTurn = dependencies.runTurn;
  dependencies.runTurn = async (options) => {
    const result = await successfulRunTurn(options);
    options.session.setProcessExitCode(0);
    return result;
  };

  const summary = await subject.runDesignVisualM2B1({
    repositoryRoot: root,
    planPath,
    ...dependencies,
  });
  assert.equal(summary.executionStatus, "completed");
  assert.deepEqual(summary.summary.evaluatorIdentities.map(({ sessionId }) => sessionId), [
    "41001",
    "41002",
    "41003",
  ]);
  assert.equal(exitCodeReads > 0, true);
});

test("M2B1 Task 1 prevalidation attaches its bounded summary non-enumerably", async (t) => {
  const subject = await loadSubject();
  const { root, planPath } = await fixtureRoot(t);
  const dependencies = successfulDependencies();
  const successfulRunTurn = dependencies.runTurn;
  dependencies.runTurn = async (options) => {
    const result = await successfulRunTurn(options);
    result.events = Array.from({ length: 513 }, () => ({
      pathCanary: "C:\\Users\\private\\must-not-persist.log",
    }));
    return result;
  };

  let failure;
  try {
    await subject.runDesignVisualM2B1({ repositoryRoot: root, planPath, ...dependencies });
  } catch (error) {
    failure = error;
  }
  assert.notEqual(failure, undefined);
  assert.deepEqual(Object.getOwnPropertyDescriptor(failure, "task1Prevalidation"), {
    configurable: true,
    enumerable: false,
    writable: true,
    value: {
      eventsCount: 513,
      eventsLimit: 512,
      eventsOverLimit: true,
      mcpAfterCount: 0,
      mcpAfterLimit: 128,
      mcpAfterOverLimit: false,
      rawPayloadRetained: false,
    },
  });
  assert.equal(Object.keys(failure).includes("task1Prevalidation"), false);
});

test("M2B1 blocked writer copies only an exact Task 1 prevalidation projection", async (t) => {
  const subject = await loadSubject();
  const { root, planPath } = await fixtureRoot(t);
  const projectionCanary = "writer-projection-canary-must-not-persist";
  let trapCalls = 0;
  const exact = {
    eventsCount: 513,
    eventsLimit: 512,
    eventsOverLimit: true,
    mcpAfterCount: 0,
    mcpAfterLimit: 128,
    mcpAfterOverLimit: false,
    rawPayloadRetained: false,
  };
  const cases = [
    { label: "exact", mutate: (value) => value, retained: true },
    { label: "missing", mutate: (value) => { delete value.rawPayloadRetained; return value; } },
    { label: "extra", mutate: (value) => ({ ...value, rawPayload: "must-not-persist" }) },
    { label: "wrong limit", mutate: (value) => ({ ...value, eventsLimit: 513 }) },
    { label: "count boolean mismatch", mutate: (value) => ({ ...value, eventsOverLimit: false }) },
    { label: "raw retained", mutate: (value) => ({ ...value, rawPayloadRetained: true }) },
    {
      label: "accessor own field",
      mutate: (value) => {
        Object.defineProperty(value, "eventsCount", {
          configurable: true,
          enumerable: true,
          get() {
            trapCalls += 1;
            return projectionCanary;
          },
        });
        return value;
      },
    },
    {
      label: "live proxy",
      mutate: (value) => new Proxy({ ...value, projectionCanary }, {
        get() {
          trapCalls += 1;
          throw new Error("live projection proxy get trap must not run");
        },
        ownKeys() {
          trapCalls += 1;
          throw new Error("live projection proxy ownKeys trap must not run");
        },
        getOwnPropertyDescriptor() {
          trapCalls += 1;
          throw new Error("live projection proxy descriptor trap must not run");
        },
      }),
    },
    {
      label: "revoked proxy",
      mutate: (value) => {
        const revocable = Proxy.revocable({ ...value, projectionCanary }, {
          get() {
            trapCalls += 1;
            throw new Error("revoked projection proxy get trap must not run");
          },
          ownKeys() {
            trapCalls += 1;
            throw new Error("revoked projection proxy ownKeys trap must not run");
          },
          getOwnPropertyDescriptor() {
            trapCalls += 1;
            throw new Error("revoked projection proxy descriptor trap must not run");
          },
        });
        revocable.revoke();
        return revocable.proxy;
      },
    },
  ];
  for (const current of cases) {
    const dependencies = successfulDependencies();
    dependencies.runTurn = async (options) => {
      options.session.closed = true;
      options.session.processExitCode = 0;
      const failure = new Error(`projection ${current.label}`);
      Object.defineProperty(failure, "task1Prevalidation", {
        configurable: true,
        enumerable: false,
        writable: true,
        value: current.mutate(structuredClone(exact)),
      });
      failure.freshEvaluatorEvidence = {
        events: {},
        appServer: { processExitCode: 0 },
      };
      throw failure;
    };

    await assert.rejects(
      subject.runDesignVisualM2B1({ repositoryRoot: root, planPath, ...dependencies }),
      new RegExp(`projection ${current.label}`),
    );
    const blocked = dependencies.writes.find(({ file }) => file.endsWith("blocked.json")).value;
    assert.equal(blocked.partialEvidence.retention, "minimal", current.label);
    if (current.retained) {
      assert.deepEqual(blocked.task1Prevalidation, exact);
    } else {
      assert.equal(Object.hasOwn(blocked, "task1Prevalidation"), false, current.label);
    }
    assert.equal(JSON.stringify(blocked).includes("must-not-persist"), false, current.label);
    assert.equal(JSON.stringify(blocked).includes(projectionCanary), false, current.label);
  }
  assert.equal(trapCalls, 0);
});

test("M2B1 oversized failure evidence keeps prioritized diagnostics instead of one budget marker", async (t) => {
  const subject = await loadSubject();
  const { root, planPath } = await fixtureRoot(t);
  const dependencies = successfulDependencies();
  const diagnostic = (text) => ({
    text,
    byteLength: Buffer.byteLength(text),
    sha256: digest(text),
    truncated: false,
    redacted: false,
    unsupported: false,
  });
  dependencies.runTurn = async (options) => {
    options.session.closed = true;
    options.session.processExitCode = 0;
    const inner = new Error("schema rejected sk-proj-SYNTHETIC_TEST_ONLY_abcdefghijklmnop");
    inner.code = "invalid_json_schema";
    const error = new Error("fresh evaluator turn validation failed", { cause: inner });
    error.freshEvaluatorEvidence = {
      primaryCause: {
        code: diagnostic("invalid_json_schema"),
        message: diagnostic("response schema was rejected"),
      },
      thread: { id: "thread-large" },
      turn: { id: "turn-large", request: { padding: "x".repeat(160 * 1024) } },
      input: { requestSha256: "a".repeat(64), descriptors: [] },
      outputSchema: { byteLength: 4096, sha256: "b".repeat(64), value: { padding: "y".repeat(32 * 1024) } },
      events: Array.from({ length: 40 }, (_, index) => ({
        method: index === 39 ? "turn/completed" : "item/completed",
        threadId: "thread-large",
        turnId: "turn-large",
        complete: index !== 17,
        blockers: index === 17 ? ["runtime-error"] : [],
        ...(index === 17
          ? {
              runtimeError: {
                code: diagnostic("invalid_json_schema"),
                message: diagnostic("response schema was rejected"),
              },
            }
          : {}),
        padding: "z".repeat(4096),
      })),
      toolEvidence: [],
      mcpAfter: [],
      blockers: ["runtime-error", "turn-not-completed", "runtime-control-blocker"],
      appServer: {
        processExitCode: 0,
        stderr: { byteLength: 0, sha256: "e".repeat(64), truncated: false },
        remoteControl: { enabled: false },
      },
    };
    throw error;
  };

  await assert.rejects(
    subject.runDesignVisualM2B1({ repositoryRoot: root, planPath, ...dependencies }),
    /fresh evaluator turn validation failed/,
  );
  const blocked = dependencies.writes.find(({ file }) => file.endsWith("blocked.json")).value;
  assert.equal(blocked.partialEvidence.retention, "prioritized");
  assert.equal(blocked.partialEvidence.primaryCause.code.text, "invalid_json_schema");
  assert.equal(blocked.partialEvidence.runtimeErrors.observedCount, 1);
  assert.equal(blocked.partialEvidence.runtimeErrors.records[0].code.text, "invalid_json_schema");
  assert.deepEqual(blocked.partialEvidence.blockers.map(({ text }) => text), [
    "runtime-error",
    "turn-not-completed",
    "runtime-control-blocker",
  ]);
  assert.equal(blocked.partialEvidence.appServer.processExitCode, 0);
  assert.equal(Object.hasOwn(blocked.partialEvidence.appServer.stderr, "sha256"), false);
  assert.equal(blocked.partialEvidence.events.arrayLength, 40);
  assert.equal(blocked.partialEvidence.events.windowOmittedIndexCount > 0, true);
  assert.equal(blocked.partialEvidence.outputSchema.byteLength, 4096);
  assert.equal(blocked.error.cause.code.text, "invalid_json_schema");
  assert.equal(blocked.error.cause.message.redacted, true);
  assert.equal(JSON.stringify(blocked).includes("SYNTHETIC_TEST_ONLY"), false);
  assert.equal(JSON.stringify(blocked).includes("z".repeat(256)), false);
  assert.notDeepEqual(blocked.partialEvidence, {
    sanitized: { text: "[TRUNCATED:diagnostic-budget]" },
  });
});

test("M2B1 nested failure cause is bounded without invoking accessors or following cycles", async (t) => {
  const subject = await loadSubject();
  const { root, planPath } = await fixtureRoot(t);
  const dependencies = successfulDependencies();
  let getterCalls = 0;
  dependencies.runTurn = async (options) => {
    options.session.closed = true;
    options.session.processExitCode = 0;
    const inner = new Error("inner failure");
    inner.code = "inner-code";
    Object.defineProperty(inner, "details", {
      enumerable: true,
      get() {
        getterCalls += 1;
        return "must not run";
      },
    });
    inner.cause = inner;
    const outer = new Error("outer failure", { cause: inner });
    outer.freshEvaluatorEvidence = { appServer: { processExitCode: 0 } };
    throw outer;
  };

  await assert.rejects(
    subject.runDesignVisualM2B1({ repositoryRoot: root, planPath, ...dependencies }),
    /outer failure/,
  );
  const blocked = dependencies.writes.find(({ file }) => file.endsWith("blocked.json")).value;
  assert.equal(getterCalls, 0);
  assert.equal(blocked.error.cause.code.text, "inner-code");
  assert.equal(blocked.error.cause.details.text, "[UNSUPPORTED:accessor]");
  assert.equal(blocked.error.cause.cause.cycle, true);
});

test("M2B1 prioritized diagnostics read the true event tail and label bounded observations", async (t) => {
  const subject = await loadSubject();
  const { root, planPath } = await fixtureRoot(t);
  const dependencies = successfulDependencies();
  const diagnostic = (text) => ({
    text,
    byteLength: Buffer.byteLength(text),
    sha256: digest(text),
    truncated: false,
    redacted: false,
    unsupported: false,
  });
  dependencies.runTurn = async (options) => {
    options.session.closed = true;
    options.session.processExitCode = 0;
    const events = Array.from({ length: 600 }, (_, index) => ({
      method: "item/completed",
      threadId: "thread-window",
      turnId: "turn-window",
      complete: true,
      blockers: [],
      item: { id: `item-${index}`, type: "agentMessage", status: "completed" },
    }));
    events[599] = {
      method: "turn/completed",
      threadId: "thread-window",
      turnId: "turn-window",
      complete: false,
      blockers: ["runtime-error"],
      runtimeError: {
        code: diagnostic("tail_runtime_error"),
        message: diagnostic("the actual last event failed"),
      },
      turn: { id: "turn-window", status: "failed" },
    };
    const error = new Error("windowed evidence failed");
    error.freshEvaluatorEvidence = {
      primaryCause: { message: diagnostic("windowed evidence failed") },
      turn: { id: "turn-window", request: { padding: "x".repeat(160 * 1024) } },
      events,
      blockers: ["runtime-error"],
      appServer: { processExitCode: 0 },
    };
    throw error;
  };

  await assert.rejects(
    subject.runDesignVisualM2B1({ repositoryRoot: root, planPath, ...dependencies }),
    /windowed evidence failed/,
  );
  const blocked = dependencies.writes.find(({ file }) => file.endsWith("blocked.json")).value;
  assert.equal(blocked.partialEvidence.events.arrayLength, 600);
  assert.equal(blocked.partialEvidence.events.scanIndexCount < 600, true);
  assert.equal(blocked.partialEvidence.events.observedEventCount, 512);
  assert.equal(blocked.partialEvidence.events.window.tail.at(-1).turn.status.text, "failed");
  assert.equal(blocked.partialEvidence.runtimeErrors.records[0].code.text, "tail_runtime_error");
  assert.equal(blocked.partialEvidence.runtimeErrors.observedCount, 1);
  assert.equal(blocked.partialEvidence.runtimeErrors.totalCount, "UNVERIFIED");
  assert.equal(blocked.partialEvidence.events.windowSha256.length, 64);
  assert.equal(Object.hasOwn(blocked.partialEvidence.events, "sha256"), false);
});

test("M2B1 prioritized diagnostics fail closed around accessors, revoked proxies, paths, and large sums", async (t) => {
  const subject = await loadSubject();
  const { root, planPath } = await fixtureRoot(t);
  const dependencies = successfulDependencies();
  let getterCalls = 0;
  const remoteControl = {};
  Object.defineProperty(remoteControl, "hidden", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return "must not run";
    },
  });
  const revocable = Proxy.revocable({}, {});
  revocable.revoke();
  dependencies.runTurn = async (options) => {
    options.session.closed = true;
    options.session.processExitCode = 0;
    const error = new Error("hostile evidence failed");
    error.freshEvaluatorEvidence = {
      primaryCause: revocable.proxy,
      turn: { id: "turn-hostile", request: { padding: "x".repeat(160 * 1024) } },
      events: Array.from({ length: 40 }, (_, index) => ({
        method: "item/completed",
        threadId: "thread-hostile",
        turnId: "turn-hostile",
        complete: false,
        blockers: ["runtime-error"],
        runtimeError: {
          code: "C:\\Users\\private\\runtime.log",
          message: "m".repeat(32 * 1024),
          details: { apiKey: "SYNTHETIC_TEST_ONLY_abcdefghijklmnop" },
        },
        padding: "p".repeat(4096),
      })),
      blockers: Array.from({ length: 32 }, (_, index) => `blocker-${index}-${"b".repeat(4096)}`),
      appServer: {
        processExitCode: 0,
        stderr: { path: "C:\\Users\\private\\stderr.log" },
        remoteControl,
      },
    };
    throw error;
  };

  await assert.rejects(
    subject.runDesignVisualM2B1({ repositoryRoot: root, planPath, ...dependencies }),
    /hostile evidence failed/,
  );
  const blocked = dependencies.writes.find(({ file }) => file.endsWith("blocked.json")).value;
  assert.equal(getterCalls, 0);
  assert.equal(["prioritized", "minimal"].includes(blocked.partialEvidence.retention), true);
  assert.equal(JSON.stringify(blocked).includes("SYNTHETIC_TEST_ONLY"), false);
  assert.equal(JSON.stringify(blocked).includes("C:\\\\Users\\\\private"), false);
  assert.equal(JSON.stringify(blocked).includes("[REDACTED_PATH]"), true);
  assert.equal(Buffer.byteLength(JSON.stringify(blocked.partialEvidence)) < 96 * 1024, true);
});

test("M2B1 prioritized diagnostics preserve trusted sanitizer flags", async (t) => {
  const subject = await loadSubject();
  const { root, planPath } = await fixtureRoot(t);
  const dependencies = successfulDependencies();
  const redactedText = "[REDACTED]";
  const budgetText = "[TRUNCATED:diagnostic-budget]";
  dependencies.runTurn = async (options) => {
    options.session.closed = true;
    options.session.processExitCode = 0;
    const error = new Error("sanitizer metadata failed");
    error.freshEvaluatorEvidence = {
      primaryCause: {
        message: {
          text: redactedText,
          byteLength: Buffer.byteLength(redactedText),
          sha256: digest(redactedText),
          truncated: false,
          redacted: true,
          unsupported: false,
        },
        details: {
          text: budgetText,
          byteLength: null,
          sha256: digest(budgetText),
          truncated: true,
          redacted: true,
          unsupported: true,
          budgetExceeded: true,
        },
      },
      turn: { id: "turn-sanitizer", request: { padding: "x".repeat(160 * 1024) } },
      events: [],
      blockers: ["runtime-error"],
      appServer: { processExitCode: 0 },
    };
    throw error;
  };

  await assert.rejects(
    subject.runDesignVisualM2B1({ repositoryRoot: root, planPath, ...dependencies }),
    /sanitizer metadata failed/,
  );
  const blocked = dependencies.writes.find(({ file }) => file.endsWith("blocked.json")).value;
  assert.equal(blocked.partialEvidence.primaryCause.message.text, redactedText);
  assert.equal(blocked.partialEvidence.primaryCause.message.redacted, true);
  assert.equal(blocked.partialEvidence.primaryCause.details.text, budgetText);
  assert.equal(blocked.partialEvidence.primaryCause.details.truncated, true);
  assert.equal(blocked.partialEvidence.primaryCause.details.budgetExceeded, true);
});

test("M2B1 prioritized diagnostics preserve structured App Server stderr", async (t) => {
  const subject = await loadSubject();
  const { root, planPath } = await fixtureRoot(t);
  const dependencies = successfulDependencies();
  const diagnostic = {
    text: "warning [REDACTED]",
    byteLength: 18,
    sha256: digest("warning [REDACTED]"),
    truncated: false,
    redacted: true,
    unsupported: false,
  };
  dependencies.runTurn = async (options) => {
    options.session.closed = true;
    options.session.processExitCode = 0;
    const error = new Error("fresh evaluator turn validation failed", {
      cause: new Error("fresh evaluator evidence is unsafe"),
    });
    error.freshEvaluatorEvidence = {
      primaryCause: { message: "fresh evaluator evidence is unsafe" },
      blockers: ["app-server-stderr"],
      events: Array.from({ length: 40 }, (_, index) => ({
        method: index === 39 ? "turn/completed" : "item/completed",
        padding: "x".repeat(4096),
      })),
      appServer: {
        processExitCode: 0,
        stderr: {
          byteLength: 383,
          sha256: "a".repeat(64),
          truncated: false,
          captureTruncated: false,
          diagnostic,
        },
      },
    };
    throw error;
  };

  await assert.rejects(
    subject.runDesignVisualM2B1({ repositoryRoot: root, planPath, ...dependencies }),
    /fresh evaluator turn validation failed/,
  );
  const blocked = dependencies.writes.find(({ file }) => file.endsWith("blocked.json")).value;
  assert.equal(blocked.partialEvidence.appServer.stderr.byteLength, 383);
  assert.equal(Object.hasOwn(blocked.partialEvidence.appServer.stderr, "sha256"), false);
  assert.equal(blocked.partialEvidence.appServer.stderr.captureTruncated, false);
  assert.deepEqual(blocked.partialEvidence.appServer.stderr.diagnostic, diagnostic);
});

test("M2B1 prioritized diagnostics reject live proxy traps without invoking them", async (t) => {
  const subject = await loadSubject();
  const { root, planPath } = await fixtureRoot(t);
  const dependencies = successfulDependencies();
  let trapCalls = 0;
  const proxy = new Proxy({}, {
    getOwnPropertyDescriptor() {
      trapCalls += 1;
      return undefined;
    },
    getPrototypeOf() {
      trapCalls += 1;
      return Object.prototype;
    },
    ownKeys() {
      trapCalls += 1;
      return [];
    },
  });
  dependencies.runTurn = async (options) => {
    options.session.closed = true;
    options.session.processExitCode = 0;
    const error = new Error("proxy evidence failed");
    error.freshEvaluatorEvidence = {
      primaryCause: proxy,
      turn: { id: "turn-proxy", request: { padding: "x".repeat(160 * 1024) } },
      events: [],
      blockers: ["runtime-error"],
      appServer: { processExitCode: 0, remoteControl: proxy },
    };
    throw error;
  };

  await assert.rejects(
    subject.runDesignVisualM2B1({ repositoryRoot: root, planPath, ...dependencies }),
    /proxy evidence failed/,
  );
  const blocked = dependencies.writes.find(({ file }) => file.endsWith("blocked.json")).value;
  assert.equal(trapCalls, 0);
  assert.equal(blocked.partialEvidence.primaryCause.value.text, "[UNSUPPORTED:proxy]");
  assert.equal(blocked.partialEvidence.appServer.remoteControl.text, "[UNSUPPORTED:proxy]");
});

test("M2B1 path privacy supersedes small exact cloning and drops hidden and uncurated prototype-shaped keys", async (t) => {
  const subject = await loadSubject();
  const { root, planPath } = await fixtureRoot(t);
  const dependencies = successfulDependencies();
  dependencies.runTurn = async (options) => {
    options.session.closed = true;
    options.session.processExitCode = 0;
    const evidence = { appServer: { processExitCode: 0 }, events: [] };
    Object.defineProperty(evidence, "hidden", {
      enumerable: false,
      value: "SYNTHETIC_TEST_ONLY_hidden_value",
    });
    Object.defineProperty(evidence, "__proto__", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: { retainedAsData: true },
    });
    const error = new Error("plain data evidence failed");
    error.freshEvaluatorEvidence = evidence;
    throw error;
  };

  await assert.rejects(
    subject.runDesignVisualM2B1({ repositoryRoot: root, planPath, ...dependencies }),
    /plain data evidence failed/,
  );
  const blocked = dependencies.writes.find(({ file }) => file.endsWith("blocked.json")).value;
  assert.equal(blocked.partialEvidence.retention, "prioritized");
  assert.equal(Object.hasOwn(blocked.partialEvidence, "hidden"), false);
  assert.equal(JSON.stringify(blocked).includes("SYNTHETIC_TEST_ONLY_hidden_value"), false);
  assert.equal(Object.hasOwn(blocked.partialEvidence, "__proto__"), false);
  assert.equal(Object.getPrototypeOf(blocked.partialEvidence), Object.prototype);
});

function safeImageDiagnostics(overrides = {}) {
  return {
    status: "OBSERVED",
    observationCount: 1,
    expectedTargetCount: 1,
    effectivePathMatch: "MATCH",
    matchedInputIndex: 1,
    effectivePathAbsolute: "VERIFIED",
    effectivePathWithinRoot: "VERIFIED",
    modelArgumentAbsolute: "UNVERIFIED",
    outerCategory: "unable-to-locate",
    reportedCategory: "not-found",
    privacy: {
      rawPathPersisted: false,
      pathDigestPersisted: false,
      rawDiagnosticDigestPersisted: false,
    },
    ...overrides,
  };
}

function safeSuccessfulImageViews(inputIndexes = []) {
  const items = inputIndexes.map((matchedInputIndex) => ({
    id: `image-view-${matchedInputIndex}`,
    matchedInputIndex,
    eventCount: 2,
    startedCount: 1,
    completedCount: 1,
    complete: true,
  }));
  return {
    complete: true,
    eventCount: items.length * 2,
    completedCount: items.length,
    items,
    blockers: [],
    privacy: {
      rawPathPersisted: false,
      pathDigestPersisted: false,
      rawDiagnosticDigestPersisted: false,
    },
  };
}

function controllerImageEvidence(sha256 = digest("controller-image"), inputIndex = 1) {
  const hashes = Array.isArray(sha256) ? sha256 : [sha256];
  return hashes.map((hash, offset) => ({
    inputIndex: inputIndex + offset,
    byteLength: 4,
    sha256: hash,
    absolute: true,
    withinResolvedRoot: true,
    regularFile: true,
    nonSymlink: true,
    readable: true,
    checkedBeforeThreadStart: true,
    checkedBeforeTurnStart: true,
    unchangedBeforeTurnStart: true,
    postTurnPreCleanup: { readable: true, unchanged: true },
  }));
}

test("M2B1 success evidence omits evaluator paths, cwd, and root identities", async (t) => {
  const subject = await loadSubject();
  const { root, planPath } = await fixtureRoot(t);
  const dependencies = successfulDependencies();

  const result = await subject.runDesignVisualM2B1({
    repositoryRoot: root,
    planPath,
    ...dependencies,
  });

  for (const identity of result.summary.evaluatorIdentities) {
    assert.equal(Object.hasOwn(identity, "evaluatorRoot"), false);
  }
  const handoff = dependencies.writes.find(({ file }) => file.endsWith("design-handoff.json")).value;
  assert.equal(Object.hasOwn(handoff.evidence.thread, "cwd"), false);
  assert.equal(Object.hasOwn(handoff.evidence.thread, "runtimeWorkspaceRoots"), false);
  assert.equal(Object.hasOwn(handoff.evidence.thread, "request"), false);
  assert.deepEqual(handoff.evidence.threadStart.request, {
    ephemeral: true,
    approvalPolicy: "never",
    permissions: "joewrks-eval-control-v3",
    projectDocMaxBytes: 0,
    selectedCapabilityRootCount: 0,
    dynamicToolCount: 0,
    runtimeWorkspaceRootCount: 1,
    environmentCount: 1,
  });
  assert.equal(handoff.evidence.threadStart.response.instructionSourceCount, 0);
  assert.equal(handoff.evidence.thread.activePermissionProfileId, "joewrks-eval-control-v3");
  assert.equal(handoff.evidence.thread.approvalPolicy, "never");
  assert.equal(handoff.evidence.thread.approvalsReviewer, "user");
  assert.deepEqual(handoff.evidence.thread.sandbox, { type: "readOnly", networkAccess: false });
  assert.equal(handoff.evidence.thread.ephemeral, true);
  assert.equal(handoff.evidence.thread.priorTurnCount, 0);
  assert.equal(handoff.evidence.thread.instructionSourceCount, 0);
  assert.equal(handoff.evidence.thread.runtimeWorkspaceRootCount, 1);
  assert.deepEqual(handoff.evidence.turn.request, {
    inputDescriptorCount: 2,
    inputRequestSha256: digest("request-0"),
    approvalPolicy: "never",
    permissions: "joewrks-eval-control-v3",
    outputSchemaSha256: digest("schema-0"),
  });
  assert.equal(Object.hasOwn(handoff.evidence.appServer.stderr, "sha256"), false);
  assert.equal(handoff.evidence.appServer.imageDiagnostics.status, "NO_ROUTER_IMAGE_ERROR");
  assert.deepEqual(
    handoff.evidence.appServer.successfulImageViews,
    safeSuccessfulImageViews(),
  );
  assert.deepEqual(handoff.evidence.attachmentBoundary, {
    localImageRequestSubmission: "VERIFIED",
    localSourceFileReadback: "VERIFIED",
    attachmentConversion: "UNVERIFIED",
    providerInclusion: "UNVERIFIED",
    modelPixelUse: "UNVERIFIED",
    originalDetail: "UNVERIFIED",
    imageViewTelemetryRole: "OPTIONAL_SEPARATE_TOOL",
  });
  for (const visual of result.visuals) {
    assert.deepEqual(visual.evidence.attachmentBoundary, handoff.evidence.attachmentBoundary);
  }
  assert.deepEqual(
    handoff.evidence.input.controllerLocalImages,
    controllerImageEvidence(digest("image-0-1")),
  );
  assert.equal(
    handoff.evidence.input.descriptors.some((descriptor) => Object.hasOwn(descriptor, "path")),
    false,
  );
  const serialized = JSON.stringify(dependencies.writes);
  for (const stagedRoot of dependencies.calls.map(({ root: callRoot }) => callRoot)) {
    assert.equal(serialized.includes(stagedRoot), false);
    assert.equal(serialized.includes(stagedRoot.replaceAll("\\", "/")), false);
  }
});

test("M2B1 success requires correlated controller and App Server image evidence", async (t) => {
  const subject = await loadSubject();
  for (const mutation of [
    (result) => delete result.input.controllerLocalImages,
    (result) => { result.input.controllerLocalImages[0].sha256 = "0".repeat(64); },
    (result) => { result.input.controllerLocalImages[0].readable = false; },
    (result) => { result.input.controllerLocalImages.push(structuredClone(result.input.controllerLocalImages[0])); },
    (result) => delete result.appServer.imageDiagnostics,
    (result) => { result.appServer.imageDiagnostics.expectedTargetCount = 2; },
    (result) => { result.appServer.imageDiagnostics.status = "OBSERVED"; },
    (result) => delete result.appServer.successfulImageViews,
  ]) {
    const { root, planPath } = await fixtureRoot(t);
    const dependencies = successfulDependencies();
    const originalRunTurn = dependencies.runTurn;
    dependencies.runTurn = async (options) => {
      const result = await originalRunTurn(options);
      if (dependencies.calls.length === 1) mutation(result);
      return result;
    };

    await assert.rejects(
      subject.runDesignVisualM2B1({ repositoryRoot: root, planPath, ...dependencies }),
      /controller image|image diagnostic|image evidence|successful image-view/iu,
    );
    assert.equal(
      dependencies.writes.every(({ file }) => file.endsWith("blocked.json")),
      true,
    );
  }
});

test("M2B1 success requires a zero-stderr NO_ROUTER_IMAGE_ERROR observation", async (t) => {
  const subject = await loadSubject();
  for (const mutate of [
    (result) => {
      result.appServer.imageDiagnostics = safeImageDiagnostics();
    },
    (result) => {
      result.appServer.stderr.byteLength = 1;
    },
  ]) {
    const { root, planPath } = await fixtureRoot(t);
    const dependencies = successfulDependencies();
    const originalRunTurn = dependencies.runTurn;
    dependencies.runTurn = async (options) => {
      const result = await originalRunTurn(options);
      if (dependencies.calls.length === 1) mutate(result);
      return result;
    };
    await assert.rejects(
      subject.runDesignVisualM2B1({ repositoryRoot: root, planPath, ...dependencies }),
      /image diagnostic|stderr|router image/iu,
    );
    assert.equal(
      dependencies.writes.every(({ file }) => file.endsWith("blocked.json")),
      true,
    );
  }
});

test("M2B1 attachment success accepts zero or repeated optional view_image lifecycles", async (t) => {
  const subject = await loadSubject();
  const cases = [
    {
      phaseCall: 1,
      views: safeSuccessfulImageViews([1]),
    },
    {
      phaseCall: 1,
      views: {
        ...safeSuccessfulImageViews([1]),
        eventCount: 4,
        completedCount: 2,
        items: [
          ...safeSuccessfulImageViews([1]).items,
          { ...safeSuccessfulImageViews([1]).items[0], id: "image-view-1-duplicate" },
        ],
      },
    },
    {
      phaseCall: 2,
      views: safeSuccessfulImageViews([1]),
    },
    {
      phaseCall: 2,
      views: {
        ...safeSuccessfulImageViews([2]),
        eventCount: 4,
        completedCount: 2,
        items: [
          ...safeSuccessfulImageViews([2]).items,
          { ...safeSuccessfulImageViews([2]).items[0], id: "image-view-2-repeat" },
        ],
      },
    },
  ];
  for (const { phaseCall, views } of cases) {
    const { root, planPath } = await fixtureRoot(t);
    const dependencies = successfulDependencies();
    const originalRunTurn = dependencies.runTurn;
    dependencies.runTurn = async (options) => {
      const result = await originalRunTurn(options);
      if (dependencies.calls.length === phaseCall) {
        result.appServer.successfulImageViews = structuredClone(views);
      }
      return result;
    };
    const result = await subject.runDesignVisualM2B1({
      repositoryRoot: root,
      planPath,
      ...dependencies,
    });
    assert.equal(result.executionStatus, "completed");
    assert.equal(result.m2b1Status, "partial-unvalidated");
    assert.equal(result.promotionPass, false);
    assert.equal(result.summary.m2b1Status, "partial-unvalidated");
    assert.equal(result.summary.promotionPass, false);
    assert.equal(result.summary.originalDetail, "UNVERIFIED");
    for (const evidence of [result.design.evidence, ...result.visuals.map(({ evidence }) => evidence)]) {
      assert.equal(evidence.attachmentBoundary.attachmentConversion, "UNVERIFIED");
      assert.equal(evidence.attachmentBoundary.providerInclusion, "UNVERIFIED");
      assert.equal(evidence.attachmentBoundary.modelPixelUse, "UNVERIFIED");
      assert.equal(evidence.attachmentBoundary.originalDetail, "UNVERIFIED");
      assert.equal(
        evidence.attachmentBoundary.imageViewTelemetryRole,
        "OPTIONAL_SEPARATE_TOOL",
      );
    }
    assert.equal(dependencies.writes.some(({ file }) => file.endsWith("blocked.json")), false);
  }
});

test("M2B1 optional view_image evidence rejects unexpected or unsafe lifecycles", async (t) => {
  const subject = await loadSubject();
  const cases = [
    safeSuccessfulImageViews([2]),
    {
      complete: false,
      eventCount: 1,
      completedCount: 0,
      items: [{
        id: "image-view-incomplete",
        matchedInputIndex: 1,
        eventCount: 1,
        startedCount: 1,
        completedCount: 0,
        complete: false,
      }],
      blockers: ["image-view-lifecycle-incomplete"],
      privacy: {
        rawPathPersisted: false,
        pathDigestPersisted: false,
        rawDiagnosticDigestPersisted: false,
      },
    },
    {
      ...safeSuccessfulImageViews([1]),
      eventCount: 4,
      completedCount: 2,
      items: [
        ...safeSuccessfulImageViews([1]).items,
        structuredClone(safeSuccessfulImageViews([1]).items[0]),
      ],
    },
    safeSuccessfulImageViews(Array.from({ length: 9 }, () => 1)),
  ];
  for (const views of cases) {
    const { root, planPath } = await fixtureRoot(t);
    const dependencies = successfulDependencies();
    const originalRunTurn = dependencies.runTurn;
    dependencies.runTurn = async (options) => {
      const result = await originalRunTurn(options);
      if (dependencies.calls.length === 1) {
        result.appServer.successfulImageViews = structuredClone(views);
      }
      return result;
    };
    await assert.rejects(
      subject.runDesignVisualM2B1({ repositoryRoot: root, planPath, ...dependencies }),
      /successful image-view|image evidence|diagnostic evidence/iu,
    );
    assert.equal(
      dependencies.writes.every(({ file }) => file.endsWith("blocked.json")),
      true,
    );
  }
});

test("M2B1 runner correlation failure attaches and persists path-private fresh evidence", async (t) => {
  const subject = await loadSubject();
  const { root, planPath } = await fixtureRoot(t);
  const dependencies = successfulDependencies();
  const originalRunTurn = dependencies.runTurn;
  const rawDiagnosticText = "raw image diagnostic text must not persist";
  const rawStderrSha256 = "f".repeat(64);
  let rawStagedRoot;
  dependencies.runTurn = async (options) => {
    const result = await originalRunTurn(options);
    if (dependencies.calls.length === 1) {
      rawStagedRoot = options.root;
      result.input.cwd = options.root;
      result.appServer.stderr.diagnostic = { text: rawDiagnosticText };
      result.appServer.stderr.pathSha256 = digest(options.root);
      result.appServer.successfulImageViews = safeSuccessfulImageViews([2]);
    }
    return result;
  };

  let failure;
  await assert.rejects(
    subject.runDesignVisualM2B1({ repositoryRoot: root, planPath, ...dependencies }),
    (error) => {
      failure = error;
      assert.match(error.message, /successful image-view evidence is not correlated/iu);
      assert.deepEqual(error.freshEvaluatorEvidence, {
        input: {
          expectedLocalImageInputIndexes: [1],
          controllerLocalImages: controllerImageEvidence(digest("image-0-1")),
        },
        appServer: {
          processExitCode: 0,
          stderr: {
            byteLength: 0,
            truncated: false,
            captureTruncated: false,
          },
          imageDiagnostics: safeImageDiagnostics({
            status: "NO_ROUTER_IMAGE_ERROR",
            observationCount: 0,
            expectedTargetCount: 1,
            effectivePathMatch: "UNVERIFIED",
            matchedInputIndex: null,
            effectivePathAbsolute: "UNVERIFIED",
            effectivePathWithinRoot: "UNVERIFIED",
            outerCategory: "UNVERIFIED",
            reportedCategory: "UNVERIFIED",
          }),
          successfulImageViews: safeSuccessfulImageViews([2]),
        },
      });
      return true;
    },
  );
  assert.notEqual(failure, undefined);
  const blocked = dependencies.writes.find(({ file }) => file.endsWith("blocked.json")).value;
  assert.equal(Object.hasOwn(blocked.partialEvidence, "attachmentBoundary"), false);
  assert.deepEqual(blocked.partialEvidence.input.expectedLocalImageInputIndexes, [1]);
  assert.deepEqual(
    blocked.partialEvidence.input.controllerLocalImages,
    controllerImageEvidence(digest("image-0-1")),
  );
  assert.deepEqual(
    blocked.partialEvidence.appServer.successfulImageViews,
    safeSuccessfulImageViews([2]),
  );
  assert.equal(blocked.partialEvidence.appServer.processExitCode, 0);
  assert.deepEqual(blocked.partialEvidence.appServer.stderr, {
    byteLength: 0,
    truncated: false,
    captureTruncated: false,
  });
  const serialized = JSON.stringify(blocked);
  for (const forbidden of [
    rawStagedRoot,
    rawStagedRoot.replaceAll("\\", "/"),
    rawDiagnosticText,
    rawStderrSha256,
    digest(rawStagedRoot),
    "Collection modal frame is visibly intact",
  ]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
  assert.equal(serialized.includes('"cwd"'), false);
  assert.equal(serialized.includes('"path"'), false);
});

test("M2B1 runner correlation failure projection fails closed on unsafe nested evidence", async (t) => {
  const subject = await loadSubject();
  for (const mode of [
    "accessor",
    "proxy",
    "secret",
    "path-id",
    "path-blocker",
    "oversize",
  ]) {
    const { root, planPath } = await fixtureRoot(t);
    const dependencies = successfulDependencies();
    const originalRunTurn = dependencies.runTurn;
    const forbiddenSecret = "sk-proj-SYNTHETIC_TEST_ONLY_abcdefghijklmnop";
    const forbiddenPath = "C:\\Users\\Private\\unexpected.png";
    let trapCalls = 0;
    dependencies.runTurn = async (options) => {
      const result = await originalRunTurn(options);
      if (dependencies.calls.length !== 1) return result;
      if (mode === "accessor") {
        Object.defineProperty(result.appServer.stderr, "diagnostic", {
          enumerable: true,
          get() {
            trapCalls += 1;
            return { text: "unsafe accessor text" };
          },
        });
        result.appServer.successfulImageViews = safeSuccessfulImageViews([2]);
      } else if (mode === "proxy") {
        result.appServer.imageDiagnostics.privacy = new Proxy({}, {
          ownKeys() { trapCalls += 1; throw new Error("privacy ownKeys trap"); },
          getOwnPropertyDescriptor() { trapCalls += 1; throw new Error("privacy descriptor trap"); },
          get() { trapCalls += 1; throw new Error("privacy get trap"); },
        });
      } else if (mode === "secret") {
        const views = safeSuccessfulImageViews([1]);
        views.items[0].id = forbiddenSecret;
        result.appServer.successfulImageViews = views;
      } else if (mode === "path-id") {
        const views = safeSuccessfulImageViews([1]);
        views.items[0].id = forbiddenPath;
        result.appServer.successfulImageViews = views;
      } else if (mode === "path-blocker") {
        result.appServer.successfulImageViews = {
          ...safeSuccessfulImageViews([1]),
          complete: false,
          blockers: [forbiddenPath],
        };
      } else {
        result.appServer.successfulImageViews = safeSuccessfulImageViews(
          Array.from({ length: 9 }, () => 1),
        );
      }
      return result;
    };

    let failure;
    await assert.rejects(
      subject.runDesignVisualM2B1({ repositoryRoot: root, planPath, ...dependencies }),
      (error) => {
        failure = error;
        assert.deepEqual(error.freshEvaluatorEvidence.input.expectedLocalImageInputIndexes, [1]);
        return true;
      },
      mode,
    );
    assert.notEqual(failure, undefined, mode);
    assert.equal(trapCalls, 0, mode);
    const blocked = dependencies.writes.find(({ file }) => file.endsWith("blocked.json")).value;
    const serialized = JSON.stringify(blocked);
    assert.equal(serialized.includes(forbiddenSecret), false, mode);
    assert.equal(serialized.includes(forbiddenPath), false, mode);
    assert.equal(Buffer.byteLength(serialized) < 96 * 1024, true, mode);
    if (mode === "proxy") {
      assert.equal(Object.hasOwn(blocked.partialEvidence.appServer, "imageDiagnostics"), false);
    }
    if (["secret", "path-id", "path-blocker", "oversize"].includes(mode)) {
      assert.equal(
        Object.hasOwn(blocked.partialEvidence.appServer, "successfulImageViews"),
        false,
        mode,
      );
    }
  }
});

test("M2B1 success requires exact safe evaluator security summaries", async (t) => {
  const subject = await loadSubject();
  for (const mutation of [
    (result) => { result.threadStart.request.permissions = "other"; },
    (result) => { result.thread.activePermissionProfileId = "other"; },
    (result) => { result.thread.approvalsReviewer = "agent"; },
    (result) => { result.thread.sandbox.networkAccess = true; },
    (result) => { result.turn.request.outputSchemaSha256 = "0".repeat(64); },
  ]) {
    const { root, planPath } = await fixtureRoot(t);
    const dependencies = successfulDependencies();
    const originalRunTurn = dependencies.runTurn;
    dependencies.runTurn = async (options) => {
      const result = await originalRunTurn(options);
      if (dependencies.calls.length === 1) mutation(result);
      return result;
    };
    await assert.rejects(
      subject.runDesignVisualM2B1({ repositoryRoot: root, planPath, ...dependencies }),
      /security evidence/iu,
    );
    assert.equal(dependencies.writes.every(({ file }) => file.endsWith("blocked.json")), true);
  }
});

test("M2B1 attachment boundary is emitted only after submitted turn evidence returns safely", async (t) => {
  const subject = await loadSubject();
  for (const mutation of [
    (result) => { result.turn.request.inputDescriptorCount = 0; },
    (result) => { result.blockers = ["missing-terminal-event"]; },
  ]) {
    const { root, planPath } = await fixtureRoot(t);
    const dependencies = successfulDependencies();
    const originalRunTurn = dependencies.runTurn;
    dependencies.runTurn = async (options) => {
      const result = await originalRunTurn(options);
      if (dependencies.calls.length === 1) mutation(result);
      return result;
    };
    await assert.rejects(
      subject.runDesignVisualM2B1({ repositoryRoot: root, planPath, ...dependencies }),
      /security evidence|incomplete|blocked/iu,
    );
    assert.equal(
      dependencies.writes.some(({ file }) => !file.endsWith("blocked.json")),
      false,
    );
    const blocked = dependencies.writes.find(({ file }) => file.endsWith("blocked.json")).value;
    assert.equal(Object.hasOwn(blocked.partialEvidence, "attachmentBoundary"), false);
  }
});

test("M2B1 small blocked evidence uses a path-private curated projection", async (t) => {
  const subject = await loadSubject();
  const { root, planPath } = await fixtureRoot(t);
  const dependencies = successfulDependencies();
  let rawStagedRoot;
  const rawImagePath = "C:\\Users\\Private\\approved.png";
  const rawStderrSha256 = "d".repeat(64);
  dependencies.runTurn = async (options) => {
    rawStagedRoot = options.root;
    options.session.closed = true;
    options.session.processExitCode = 0;
    const error = new Error("fixture image lookup failed");
    error.freshEvaluatorEvidence = {
      threadStart: { request: { cwd: options.root } },
      thread: { id: "thread-private", cwd: options.root, request: { cwd: options.root } },
      turn: { id: "turn-private", request: { cwd: options.root } },
      input: {
        requestSha256: digest("request-private"),
        descriptors: [
          { index: 0, type: "text", text: "prompt", byteLength: 6, sha256: digest("prompt") },
          { index: 1, type: "localImage", path: rawImagePath, byteLength: 4, sha256: digest("controller-image"), originalDetail: "unverified" },
        ],
        controllerLocalImages: controllerImageEvidence(),
      },
      events: [],
      blockers: ["app-server-stderr"],
      appServer: {
        processExitCode: 0,
        stderr: {
          byteLength: 383,
          sha256: rawStderrSha256,
          truncated: false,
          captureTruncated: false,
          diagnostic: {
            text: "unable to locate image at [REDACTED_PATH]",
            byteLength: 50,
            sha256: digest("unable to locate image at [REDACTED_PATH]"),
            truncated: false,
            redacted: true,
            unsupported: false,
          },
        },
        imageDiagnostics: safeImageDiagnostics(),
        successfulImageViews: safeSuccessfulImageViews(),
      },
    };
    throw error;
  };

  await assert.rejects(
    subject.runDesignVisualM2B1({ repositoryRoot: root, planPath, ...dependencies }),
    /fixture image lookup failed/,
  );
  const blocked = dependencies.writes.find(({ file }) => file.endsWith("blocked.json")).value;
  assert.equal(blocked.partialEvidence.retention, "prioritized");
  assert.deepEqual(blocked.partialEvidence.input.controllerLocalImages, controllerImageEvidence());
  assert.equal(
    blocked.partialEvidence.input.descriptors.some((descriptor) => Object.hasOwn(descriptor, "path")),
    false,
  );
  assert.deepEqual(blocked.partialEvidence.appServer.imageDiagnostics, safeImageDiagnostics());
  assert.deepEqual(
    blocked.partialEvidence.appServer.successfulImageViews,
    safeSuccessfulImageViews(),
  );
  assert.equal(Object.hasOwn(blocked.partialEvidence.appServer.stderr, "sha256"), false);
  assert.equal(blocked.cleanupEvidence.stagedRoots.every((entry) => !Object.hasOwn(entry, "root")), true);
  const serialized = JSON.stringify(blocked);
  for (const forbidden of [rawStagedRoot, rawStagedRoot.replaceAll("\\", "/"), rawImagePath, rawStderrSha256]) {
    assert.equal(serialized.includes(forbidden), false);
  }
});

test("M2B1 minimal blocked projection retains only safe image diagnostics", async (t) => {
  const subject = await loadSubject();
  const { root, planPath } = await fixtureRoot(t);
  const dependencies = successfulDependencies();
  const revoked = Proxy.revocable([], {});
  revoked.revoke();
  dependencies.runTurn = async (options) => {
    options.session.closed = true;
    options.session.processExitCode = 0;
    const error = new Error("unreadable event collection");
    error.freshEvaluatorEvidence = {
      events: revoked.proxy,
      blockers: ["app-server-stderr"],
      input: { controllerLocalImages: controllerImageEvidence() },
      appServer: {
        processExitCode: 0,
        imageDiagnostics: safeImageDiagnostics({
          status: "UNVERIFIED",
          observationCount: 2,
          effectivePathMatch: "UNVERIFIED",
          matchedInputIndex: null,
          effectivePathAbsolute: "UNVERIFIED",
          effectivePathWithinRoot: "UNVERIFIED",
          outerCategory: "UNVERIFIED",
          reportedCategory: "UNVERIFIED",
        }),
        successfulImageViews: safeSuccessfulImageViews(),
      },
    };
    throw error;
  };

  await assert.rejects(
    subject.runDesignVisualM2B1({ repositoryRoot: root, planPath, ...dependencies }),
    /unreadable event collection/,
  );
  const blocked = dependencies.writes.find(({ file }) => file.endsWith("blocked.json")).value;
  assert.equal(blocked.partialEvidence.retention, "minimal");
  assert.deepEqual(blocked.partialEvidence.input.controllerLocalImages, controllerImageEvidence());
  assert.equal(blocked.partialEvidence.appServer.imageDiagnostics.status, "UNVERIFIED");
  assert.deepEqual(blocked.partialEvidence.appServer.imageDiagnostics.privacy, {
    rawPathPersisted: false,
    pathDigestPersisted: false,
    rawDiagnosticDigestPersisted: false,
  });
  assert.deepEqual(
    blocked.partialEvidence.appServer.successfulImageViews,
    safeSuccessfulImageViews(),
  );
});

test("M2B1 blocked projection preserves a bounded incomplete image-view lifecycle", async (t) => {
  const subject = await loadSubject();
  const { root, planPath } = await fixtureRoot(t);
  const dependencies = successfulDependencies();
  const incomplete = {
    complete: false,
    eventCount: 1,
    completedCount: 0,
    items: [{
      id: "image-view-incomplete",
      matchedInputIndex: 1,
      eventCount: 1,
      startedCount: 1,
      completedCount: 0,
      complete: false,
    }],
    blockers: ["image-view-lifecycle-incomplete"],
    privacy: {
      rawPathPersisted: false,
      pathDigestPersisted: false,
      rawDiagnosticDigestPersisted: false,
    },
  };
  dependencies.runTurn = async (options) => {
    options.session.closed = true;
    options.session.processExitCode = 0;
    const error = new Error("incomplete image-view lifecycle");
    error.freshEvaluatorEvidence = {
      events: [],
      blockers: ["image-view-lifecycle-incomplete"],
      appServer: { processExitCode: 0, successfulImageViews: incomplete },
    };
    throw error;
  };

  await assert.rejects(
    subject.runDesignVisualM2B1({ repositoryRoot: root, planPath, ...dependencies }),
    /incomplete image-view lifecycle/,
  );
  const blocked = dependencies.writes.find(({ file }) => file.endsWith("blocked.json")).value;
  assert.deepEqual(blocked.partialEvidence.appServer.successfulImageViews, incomplete);
});

test("M2B1 image-view projection reads no accessor or nested proxy traps", async (t) => {
  const subject = await loadSubject();
  for (const mode of ["accessor", "proxy"]) {
    const { root, planPath } = await fixtureRoot(t);
    const dependencies = successfulDependencies();
    let trapCalls = 0;
    const views = safeSuccessfulImageViews([1]);
    if (mode === "accessor") {
      for (const [target, key, value] of [
        [views, "complete", true],
        [views, "eventCount", 2],
        [views.privacy, "rawPathPersisted", false],
        [views.items[0], "id", "image-view-1"],
      ]) {
        Object.defineProperty(target, key, {
          enumerable: true,
          configurable: true,
          get() {
            trapCalls += 1;
            return value;
          },
        });
      }
    } else {
      views.privacy = new Proxy(views.privacy, {
        get() { trapCalls += 1; throw new Error("privacy get trap"); },
        ownKeys() { trapCalls += 1; throw new Error("privacy ownKeys trap"); },
        getOwnPropertyDescriptor() {
          trapCalls += 1;
          throw new Error("privacy descriptor trap");
        },
      });
    }
    dependencies.runTurn = async (options) => {
      options.session.closed = true;
      options.session.processExitCode = 0;
      const error = new Error(`unsafe image-view ${mode}`);
      error.freshEvaluatorEvidence = {
        events: [],
        appServer: { processExitCode: 0, successfulImageViews: views },
      };
      throw error;
    };

    await assert.rejects(
      subject.runDesignVisualM2B1({ repositoryRoot: root, planPath, ...dependencies }),
      new RegExp(`unsafe image-view ${mode}`),
    );
    assert.equal(trapCalls, 0, mode);
    const blocked = dependencies.writes.find(({ file }) => file.endsWith("blocked.json")).value;
    assert.equal(
      Object.hasOwn(blocked.partialEvidence.appServer, "successfulImageViews"),
      false,
      mode,
    );
  }
});

test("M2B1 minimal projection cannot persist oversized or credential-shaped image-view ids", async (t) => {
  const subject = await loadSubject();
  for (const forbiddenId of [
    "🙂".repeat(33),
    "sk-proj-SYNTHETIC_TEST_ONLY_abcdefghijklmnop",
  ]) {
    const { root, planPath } = await fixtureRoot(t);
    const dependencies = successfulDependencies();
    const revoked = Proxy.revocable([], {});
    revoked.revoke();
    const views = safeSuccessfulImageViews([1]);
    views.items[0].id = forbiddenId;
    dependencies.runTurn = async (options) => {
      options.session.closed = true;
      options.session.processExitCode = 0;
      const error = new Error("unsafe bounded image-view id");
      error.freshEvaluatorEvidence = {
        events: revoked.proxy,
        appServer: { processExitCode: 0, successfulImageViews: views },
      };
      throw error;
    };

    await assert.rejects(
      subject.runDesignVisualM2B1({ repositoryRoot: root, planPath, ...dependencies }),
      /unsafe bounded image-view id/,
    );
    const blocked = dependencies.writes.find(({ file }) => file.endsWith("blocked.json")).value;
    const serialized = JSON.stringify(blocked);
    assert.equal(Buffer.byteLength(serialized) <= 32 * 1024, true);
    assert.equal(serialized.includes(forbiddenId), false);
    assert.equal(
      Object.hasOwn(blocked.partialEvidence.appServer, "successfulImageViews"),
      false,
    );
  }
});

test("M2B1 image diagnostics omit an observation with any unknown field", async (t) => {
  const subject = await loadSubject();
  const { root, planPath } = await fixtureRoot(t);
  const dependencies = successfulDependencies();
  const forbiddenPath = "C:\\Users\\Private\\unexpected.png";
  dependencies.runTurn = async (options) => {
    options.session.closed = true;
    options.session.processExitCode = 0;
    const error = new Error("unknown image diagnostic field");
    error.freshEvaluatorEvidence = {
      events: [],
      appServer: {
        processExitCode: 0,
        imageDiagnostics: safeImageDiagnostics({ rawPath: forbiddenPath }),
      },
    };
    throw error;
  };

  await assert.rejects(
    subject.runDesignVisualM2B1({ repositoryRoot: root, planPath, ...dependencies }),
    /unknown image diagnostic field/,
  );
  const blocked = dependencies.writes.find(({ file }) => file.endsWith("blocked.json")).value;
  assert.equal(Object.hasOwn(blocked.partialEvidence.appServer, "imageDiagnostics"), false);
  assert.equal(JSON.stringify(blocked).includes(forbiddenPath), false);
});

test("M2B1 image diagnostic privacy proxy is omitted without invoking traps", async (t) => {
  const subject = await loadSubject();
  const { root, planPath } = await fixtureRoot(t);
  const dependencies = successfulDependencies();
  let trapCalls = 0;
  const privacy = new Proxy({}, {
    ownKeys() { trapCalls += 1; return []; },
    getOwnPropertyDescriptor() { trapCalls += 1; return undefined; },
    get() { trapCalls += 1; return false; },
  });
  dependencies.runTurn = async (options) => {
    options.session.closed = true;
    options.session.processExitCode = 0;
    const error = new Error("proxied image privacy");
    error.freshEvaluatorEvidence = {
      events: [],
      appServer: {
        processExitCode: 0,
        imageDiagnostics: safeImageDiagnostics({ privacy }),
      },
    };
    throw error;
  };
  await assert.rejects(
    subject.runDesignVisualM2B1({ repositoryRoot: root, planPath, ...dependencies }),
    /proxied image privacy/,
  );
  const blocked = dependencies.writes.find(({ file }) => file.endsWith("blocked.json")).value;
  assert.equal(trapCalls, 0);
  assert.equal(Object.hasOwn(blocked.partialEvidence.appServer, "imageDiagnostics"), false);
});

test("M2B1 blocked controller image evidence preserves false lifecycle facts", async (t) => {
  const subject = await loadSubject();
  const { root, planPath } = await fixtureRoot(t);
  const dependencies = successfulDependencies();
  const controller = controllerImageEvidence()[0];
  controller.readable = false;
  controller.unchangedBeforeTurnStart = false;
  controller.postTurnPreCleanup = { readable: false, unchanged: false };
  dependencies.runTurn = async (options) => {
    options.session.closed = true;
    options.session.processExitCode = 0;
    const error = new Error("controller lifecycle failed");
    error.freshEvaluatorEvidence = {
      events: [],
      input: { controllerLocalImages: [controller] },
      appServer: { processExitCode: 0 },
    };
    throw error;
  };
  await assert.rejects(
    subject.runDesignVisualM2B1({ repositoryRoot: root, planPath, ...dependencies }),
    /controller lifecycle failed/,
  );
  const blocked = dependencies.writes.find(({ file }) => file.endsWith("blocked.json")).value;
  assert.deepEqual(blocked.partialEvidence.input.controllerLocalImages, [controller]);
});

test("M2B1 controller image evidence fails closed on sparse arrays and unknown fields", async (t) => {
  const subject = await loadSubject();
  const { root, planPath } = await fixtureRoot(t);
  const forbiddenPath = "C:\\Users\\Private\\unexpected-controller.png";
  const sparse = new Array(1);
  for (const controllerLocalImages of [
    [{ ...controllerImageEvidence()[0], rawPath: forbiddenPath }],
    sparse,
  ]) {
    const dependencies = successfulDependencies();
    dependencies.runTurn = async (options) => {
      options.session.closed = true;
      options.session.processExitCode = 0;
      const error = new Error("malformed controller image evidence");
      error.freshEvaluatorEvidence = {
        events: [],
        input: { controllerLocalImages },
        appServer: { processExitCode: 0 },
      };
      throw error;
    };

    await assert.rejects(
      subject.runDesignVisualM2B1({ repositoryRoot: root, planPath, ...dependencies }),
      /malformed controller image evidence/,
    );
    const blocked = dependencies.writes.find(({ file }) => file.endsWith("blocked.json")).value;
    assert.equal(Object.hasOwn(blocked.partialEvidence.input, "controllerLocalImages"), false);
    assert.equal(JSON.stringify(blocked).includes(forbiddenPath), false);
  }
});

test("M2B1 artifact leak gate writes nothing when a staged-root variant reaches output", async (t) => {
  const subject = await loadSubject();
  const { root, planPath } = await fixtureRoot(t);
  const dependencies = successfulDependencies();
  const originalRunTurn = dependencies.runTurn;
  dependencies.runTurn = async (options) => {
    const result = await originalRunTurn(options);
    if (dependencies.calls.length === 1) {
      result.output.invariants[0].observableFact =
        `forbidden ${options.root} ${options.root.replaceAll("\\", "/")}`;
      const text = JSON.stringify(result.output);
      result.outputText = {
        text,
        byteLength: Buffer.byteLength(text),
        sha256: digest(text),
      };
    }
    return result;
  };

  await assert.rejects(
    subject.runDesignVisualM2B1({ repositoryRoot: root, planPath, ...dependencies }),
    /artifact.*path|path.*artifact|private/iu,
  );
  assert.deepEqual(dependencies.writes, []);
});

test("M2B1 artifact leak gate rejects Windows case changes, file URLs, path digests, and nested JSON escaping", async (t) => {
  const subject = await loadSubject();
  for (const mode of ["case-changed", "file-url", "path-digest", "nested-json"]) {
    const { root, planPath } = await fixtureRoot(t);
    const dependencies = successfulDependencies();
    const originalRunTurn = dependencies.runTurn;
    dependencies.runTurn = async (options) => {
      const result = await originalRunTurn(options);
      if (dependencies.calls.length !== 1) return result;
      let text;
      if (mode === "case-changed") {
        result.output.invariants[0].observableFact = options.root.toUpperCase();
        text = JSON.stringify(result.output);
      } else if (mode === "file-url") {
        result.output.invariants[0].observableFact = pathToFileURL(options.root).href;
        text = JSON.stringify(result.output);
      } else if (mode === "path-digest") {
        result.output.invariants[0].observableFact = digest(options.root);
        text = JSON.stringify(result.output);
      } else {
        const valid = JSON.stringify(result.output);
        const hidden = JSON.stringify(options.root);
        text = valid.replace(
          /"schemaVersion":5/u,
          `"schemaVersion":${hidden},"schemaVersion":5`,
        );
      }
      result.outputText = {
        text,
        byteLength: Buffer.byteLength(text),
        sha256: digest(text),
      };
      return result;
    };

    await assert.rejects(
      subject.runDesignVisualM2B1({ repositoryRoot: root, planPath, ...dependencies }),
      /artifact.*path|path.*artifact|private/iu,
    );
    assert.deepEqual(dependencies.writes, [], mode);
  }
});

test("M2B1 schema 6 support pins v5 history and rejects unchanged source", async (t) => {
  const subject = await loadSubject();
  const v5 = JSON.parse(await readFile(STDERR_DIAGNOSTIC_PLAN_PATH, "utf8"));
  const v6 = structuredClone(v5);
  v6.schemaVersion = 6;
  v6.id = "design-visual-m2-b1-smoke-plan-v6";
  v6.predecessor = {
    plan: {
      path: "evals/skill-contracts/design-visual-m2-b1-smoke-plan-v5.json",
      bytes: 5627,
      sha256: "80cf2d288d494bce456c18031935a8bd5ff2ef53f90053fc799845ad739223a5",
    },
    blockedAttempt: {
      path: "evals/skill-contracts/design-visual-m2-b1-v5-blocked.json",
      bytes: 11093,
      sha256: "c3b5ad2e6e64c53299bcb87d662d0f4a3a316ecb27c487033fc6aa0c44cd40c3",
    },
    latestReceipt: {
      path: "evals/skill-contracts/design-visual-m2-attempt-index-v7.json",
      bytes: 5686,
      sha256: "c11a4c5366c44563bd6118ed45cfdf4c46986083aaaf847103475eea287537e8",
    },
    methodChange: "path-private-controller-image-readback-and-resolved-view-image-error-correlation-no-evaluator-contract-change",
    attemptPolicy: "one-method-changed-attempt-no-automatic-retry",
  };
  v6.outputs = Object.fromEntries(
    Object.entries(v5.outputs).map(([key, value]) => [key, value.replace("-v5-", "-v6-")]),
  );

  const validated = subject.validateDesignVisualM2B1Plan(v6);
  assert.equal(validated.schemaVersion, 6);
  assert.equal(Object.values(validated.outputs).every((file) => file.includes("-v6-")), true);
  for (const key of ["runtime", "inputs", "candidates", "claimScope", "originalDetail", "boundaries"]) {
    assert.deepEqual(validated[key], v5[key]);
  }
  assert.equal(digest(JSON.stringify(subject.designSchema())), "83057a2d2746c3be1741dadb4a39a7fb8375c988d3bbc6fb120f8ff03d7f002b");
  assert.equal(digest(JSON.stringify(subject.visualSchema("sample-a"))), "64682110930af7251454f45e7b4963de5f5bb16891c5a77c34b0b07b9ade5652");
  assert.equal(digest(JSON.stringify(subject.visualSchema("sample-b"))), "a71384d54076fa83b8bcce9f033947ec6a5417fe72cf9e8d47df23fe9b7847df");

  const unchangedSourceFixture = await successorFixtureRoot(t, v6);
  await assert.rejects(subject.preflightDesignVisualM2B1({
    repositoryRoot: unchangedSourceFixture.root,
    planPath: unchangedSourceFixture.planPath,
    gitStatus: async () => "",
    gitIdentity: async () => "f".repeat(40),
    gitReadBlob: copiedFixtureGitReadBlob(v6),
  }), /source.*unchanged|method.*source/iu);

  const distinctCommitSameBlobs = structuredClone(v6);
  distinctCommitSameBlobs.source.repositoryCommit = "e".repeat(40);
  const sameBlobFixture = await successorFixtureRoot(t, v6);
  await writeFile(
    sameBlobFixture.planPath,
    JSON.stringify(distinctCommitSameBlobs, null, 2) + "\n",
  );
  await assert.rejects(subject.preflightDesignVisualM2B1({
    repositoryRoot: sameBlobFixture.root,
    planPath: sameBlobFixture.planPath,
    gitStatus: async () => "",
    gitIdentity: async () => "f".repeat(40),
    gitReadBlob: async (_root, implementationCommit, sourcePath) => {
      assert.equal(implementationCommit, distinctCommitSameBlobs.source.repositoryCommit);
      const bytes = await execFile(
        "git",
        ["show", `${v6.source.repositoryCommit}:${sourcePath}`],
        { cwd: ROOT, encoding: "buffer", maxBuffer: 1024 * 1024 },
      );
      return bytes.stdout;
    },
  }), /source.*unchanged|method.*source/iu);
});

test("M2B1 v6 plan pins the path-private support commit and preserves the evaluator contract", async () => {
  const subject = await loadSubject();
  const v5 = JSON.parse(await readFile(STDERR_DIAGNOSTIC_PLAN_PATH, "utf8"));
  const v6Bytes = await readFile(PATH_PRIVATE_IMAGE_PLAN_PATH);
  const v6 = JSON.parse(v6Bytes.toString("utf8"));
  const validated = subject.validateDesignVisualM2B1Plan(v6);

  assert.equal(validated.schemaVersion, 6);
  assert.equal(validated.id, "design-visual-m2-b1-smoke-plan-v6");
  assert.equal(validated.source.repositoryCommit, "63fb26273bf1b37820dcf5fc1fcc82b8c1373ec3");
  assert.deepEqual(validated.predecessor, {
    plan: {
      path: "evals/skill-contracts/design-visual-m2-b1-smoke-plan-v5.json",
      bytes: 5627,
      sha256: "80cf2d288d494bce456c18031935a8bd5ff2ef53f90053fc799845ad739223a5",
    },
    blockedAttempt: {
      path: "evals/skill-contracts/design-visual-m2-b1-v5-blocked.json",
      bytes: 11093,
      sha256: "c3b5ad2e6e64c53299bcb87d662d0f4a3a316ecb27c487033fc6aa0c44cd40c3",
    },
    latestReceipt: {
      path: "evals/skill-contracts/design-visual-m2-attempt-index-v7.json",
      bytes: 5686,
      sha256: "c11a4c5366c44563bd6118ed45cfdf4c46986083aaaf847103475eea287537e8",
    },
    methodChange: "path-private-controller-image-readback-and-resolved-view-image-error-correlation-no-evaluator-contract-change",
    attemptPolicy: "one-method-changed-attempt-no-automatic-retry",
  });
  for (const key of ["runtime", "inputs", "candidates", "claimScope", "originalDetail", "boundaries"]) {
    assert.deepEqual(validated[key], v5[key]);
  }
  assert.deepEqual(validated.outputs, {
    designRaw: "evals/skill-contracts/design-visual-m2-b1-v6-design-raw.json",
    designHandoff: "evals/skill-contracts/design-visual-m2-b1-v6-design-handoff.json",
    sampleARaw: "evals/skill-contracts/design-visual-m2-b1-v6-sample-a-raw.json",
    sampleAEnvelope: "evals/skill-contracts/design-visual-m2-b1-v6-sample-a-envelope.json",
    sampleBRaw: "evals/skill-contracts/design-visual-m2-b1-v6-sample-b-raw.json",
    sampleBEnvelope: "evals/skill-contracts/design-visual-m2-b1-v6-sample-b-envelope.json",
    summary: "evals/skill-contracts/design-visual-m2-b1-v6-summary.json",
    blocked: "evals/skill-contracts/design-visual-m2-b1-v6-blocked.json",
  });

  for (const pin of [
    validated.source.runner,
    validated.source.freshTurnAdapter,
    validated.source.collector,
  ]) {
    const committed = await execFile(
      "git",
      ["show", `${validated.source.repositoryCommit}:${pin.path}`],
      { cwd: ROOT, encoding: "buffer", maxBuffer: 1024 * 1024 },
    );
    assert.equal(committed.stdout.byteLength, pin.bytes);
    assert.equal(digest(committed.stdout), pin.sha256);
  }
  assert.equal(v6Bytes.at(-1), 0x0a);
});

test("M2B1 schema 7 support pins v6 history, separates outputs, and rejects unchanged source", async (t) => {
  const subject = await loadSubject();
  const v6 = JSON.parse(await readFile(PATH_PRIVATE_IMAGE_PLAN_PATH, "utf8"));
  const v7 = structuredClone(v6);
  v7.schemaVersion = 7;
  v7.id = "design-visual-m2-b1-smoke-plan-v7";
  v7.predecessor = {
    plan: {
      path: "evals/skill-contracts/design-visual-m2-b1-smoke-plan-v6.json",
      bytes: 5651,
      sha256: "79d951ac146d4c4c2e4f9128f7eefde8fbaaa80a91f070e2c1a08a3f74566aa8",
    },
    blockedAttempt: {
      path: "evals/skill-contracts/design-visual-m2-b1-v6-blocked.json",
      bytes: 2089,
      sha256: "d832aba9e6b2b2ab8b979a0149a62ad59f40c6888950b97efbc6ef8b3340a20c",
    },
    latestReceipt: {
      path: "evals/skill-contracts/design-visual-m2-attempt-index-v8.json",
      bytes: 6329,
      sha256: "c43e90ffb5f85ed0d2fb917beb2be0405337a338377c0fa42023f9b3a3c51dfb",
    },
    methodChange: "bounded-path-private-post-validation-image-evidence-retention-and-local-image-attachment-vs-optional-image-view-telemetry-separation-no-evaluator-contract-change",
    attemptPolicy: "one-method-changed-attempt-no-automatic-retry",
  };
  v7.outputs = Object.fromEntries(
    Object.entries(v6.outputs).map(([key, value]) => [key, value.replace("-v6-", "-v7-")]),
  );

  const validated = subject.validateDesignVisualM2B1Plan(v7);
  assert.equal(validated.schemaVersion, 7);
  assert.equal(validated.id, "design-visual-m2-b1-smoke-plan-v7");
  assert.deepEqual(validated.predecessor, v7.predecessor);
  assert.equal(Object.values(validated.outputs).every((file) => file.includes("-v7-")), true);
  assert.equal(Object.values(validated.outputs).some((file) => file.includes("-v6-")), false);
  assert.deepEqual(validated.outputs, {
    designRaw: "evals/skill-contracts/design-visual-m2-b1-v7-design-raw.json",
    designHandoff: "evals/skill-contracts/design-visual-m2-b1-v7-design-handoff.json",
    sampleARaw: "evals/skill-contracts/design-visual-m2-b1-v7-sample-a-raw.json",
    sampleAEnvelope: "evals/skill-contracts/design-visual-m2-b1-v7-sample-a-envelope.json",
    sampleBRaw: "evals/skill-contracts/design-visual-m2-b1-v7-sample-b-raw.json",
    sampleBEnvelope: "evals/skill-contracts/design-visual-m2-b1-v7-sample-b-envelope.json",
    summary: "evals/skill-contracts/design-visual-m2-b1-v7-summary.json",
    blocked: "evals/skill-contracts/design-visual-m2-b1-v7-blocked.json",
  });
  for (const key of ["runtime", "inputs", "candidates", "claimScope", "originalDetail", "boundaries"]) {
    assert.deepEqual(validated[key], v6[key]);
  }
  assert.equal(digest(JSON.stringify(subject.designSchema())), "83057a2d2746c3be1741dadb4a39a7fb8375c988d3bbc6fb120f8ff03d7f002b");
  assert.equal(digest(JSON.stringify(subject.visualSchema("sample-a"))), "64682110930af7251454f45e7b4963de5f5bb16891c5a77c34b0b07b9ade5652");
  assert.equal(digest(JSON.stringify(subject.visualSchema("sample-b"))), "a71384d54076fa83b8bcce9f033947ec6a5417fe72cf9e8d47df23fe9b7847df");

  const unchangedSourceFixture = await successorFixtureRoot(t, v7);
  await assert.rejects(subject.preflightDesignVisualM2B1({
    repositoryRoot: unchangedSourceFixture.root,
    planPath: unchangedSourceFixture.planPath,
    gitStatus: async () => "",
    gitIdentity: async () => "f".repeat(40),
    gitReadBlob: copiedFixtureGitReadBlob(v7),
  }), /source.*unchanged|method.*source/iu);

  const distinctCommitSameBlobs = structuredClone(v7);
  distinctCommitSameBlobs.source.repositoryCommit = "e".repeat(40);
  const sameBlobFixture = await successorFixtureRoot(t, v7);
  await writeFile(
    sameBlobFixture.planPath,
    JSON.stringify(distinctCommitSameBlobs, null, 2) + "\n",
  );
  await assert.rejects(subject.preflightDesignVisualM2B1({
    repositoryRoot: sameBlobFixture.root,
    planPath: sameBlobFixture.planPath,
    gitStatus: async () => "",
    gitIdentity: async () => "f".repeat(40),
    gitReadBlob: async (_root, implementationCommit, sourcePath) => {
      assert.equal(implementationCommit, distinctCommitSameBlobs.source.repositoryCommit);
      const bytes = await execFile(
        "git",
        ["show", `${v7.source.repositoryCommit}:${sourcePath}`],
        { cwd: ROOT, encoding: "buffer", maxBuffer: 1024 * 1024 },
      );
      return bytes.stdout;
    },
  }), /source.*unchanged|method.*source/iu);

  for (const mutation of [
    (plan) => { plan.predecessor.plan.sha256 = "0".repeat(64); },
    (plan) => { plan.predecessor.methodChange = "evidence-retention-only"; },
    (plan) => { plan.outputs.summary = "evals/skill-contracts/design-visual-m2-b1-v6-summary.json"; },
  ]) {
    const changed = structuredClone(v7);
    mutation(changed);
    assert.throws(
      () => subject.validateDesignVisualM2B1Plan(changed),
      /predecessor|method|output|generation|malformed|differs/iu,
    );
  }
});

test("M2B1 actual v7 plan pins the support commit without pinning current worktree bytes", async () => {
  const subject = await loadSubject();
  const v6 = JSON.parse(await readFile(PATH_PRIVATE_IMAGE_PLAN_PATH, "utf8"));
  const v7Bytes = await readFile(ATTACHMENT_SEMANTICS_PLAN_PATH);
  const v7 = JSON.parse(v7Bytes.toString("utf8"));
  const validated = subject.validateDesignVisualM2B1Plan(v7);

  assert.equal(validated.schemaVersion, 7);
  assert.equal(validated.id, "design-visual-m2-b1-smoke-plan-v7");
  assert.equal(validated.date, "2026-08-14");
  assert.equal(
    validated.source.repositoryCommit,
    "5d1554f938d4b7e823edb800a95f5d323df146b2",
  );
  assert.deepEqual(validated.predecessor, {
    plan: {
      path: "evals/skill-contracts/design-visual-m2-b1-smoke-plan-v6.json",
      bytes: 5651,
      sha256: "79d951ac146d4c4c2e4f9128f7eefde8fbaaa80a91f070e2c1a08a3f74566aa8",
    },
    blockedAttempt: {
      path: "evals/skill-contracts/design-visual-m2-b1-v6-blocked.json",
      bytes: 2089,
      sha256: "d832aba9e6b2b2ab8b979a0149a62ad59f40c6888950b97efbc6ef8b3340a20c",
    },
    latestReceipt: {
      path: "evals/skill-contracts/design-visual-m2-attempt-index-v8.json",
      bytes: 6329,
      sha256: "c43e90ffb5f85ed0d2fb917beb2be0405337a338377c0fa42023f9b3a3c51dfb",
    },
    methodChange: "bounded-path-private-post-validation-image-evidence-retention-and-local-image-attachment-vs-optional-image-view-telemetry-separation-no-evaluator-contract-change",
    attemptPolicy: "one-method-changed-attempt-no-automatic-retry",
  });
  for (const key of ["runtime", "inputs", "candidates", "claimScope", "originalDetail", "boundaries"]) {
    assert.deepEqual(validated[key], v6[key]);
  }
  assert.deepEqual(validated.outputs, {
    designRaw: "evals/skill-contracts/design-visual-m2-b1-v7-design-raw.json",
    designHandoff: "evals/skill-contracts/design-visual-m2-b1-v7-design-handoff.json",
    sampleARaw: "evals/skill-contracts/design-visual-m2-b1-v7-sample-a-raw.json",
    sampleAEnvelope: "evals/skill-contracts/design-visual-m2-b1-v7-sample-a-envelope.json",
    sampleBRaw: "evals/skill-contracts/design-visual-m2-b1-v7-sample-b-raw.json",
    sampleBEnvelope: "evals/skill-contracts/design-visual-m2-b1-v7-sample-b-envelope.json",
    summary: "evals/skill-contracts/design-visual-m2-b1-v7-summary.json",
    blocked: "evals/skill-contracts/design-visual-m2-b1-v7-blocked.json",
  });
  for (const pin of [
    validated.source.runner,
    validated.source.freshTurnAdapter,
    validated.source.collector,
  ]) {
    const committed = await execFile(
      "git",
      ["show", `${validated.source.repositoryCommit}:${pin.path}`],
      { cwd: ROOT, encoding: "buffer", maxBuffer: 1024 * 1024 },
    );
    assert.equal(committed.stdout.byteLength, pin.bytes);
    assert.equal(digest(committed.stdout), pin.sha256);
  }
  for (const [key, output] of Object.entries(validated.outputs)) {
    if (key === "blocked") continue;
    await assertPathMissing(path.join(ROOT, ...output.split("/")));
  }
  const blocked = await readFile(path.join(ROOT, ...validated.outputs.blocked.split("/")));
  assert.equal(blocked.byteLength, 13819);
  assert.equal(digest(blocked), "98342a6bc909960d4c934af2488a285514cccfe32510730d2fe6181e7269ddb9");
  assert.equal(v7Bytes.at(-1), 0x0a);
});

test("M2B1 schema 8 permits only the two attached-image prompt pins to change", async (t) => {
  const subject = await loadSubject();
  const v7 = JSON.parse(await readFile(ATTACHMENT_SEMANTICS_PLAN_PATH, "utf8"));
  const v8 = structuredClone(v7);
  v8.schemaVersion = 8;
  v8.id = "design-visual-m2-b1-smoke-plan-v8";
  v8.predecessor = {
    plan: {
      path: "evals/skill-contracts/design-visual-m2-b1-smoke-plan-v7.json",
      bytes: 5703,
      sha256: "5be462158df803197ec2d5be1d2ae7c255591a5db52ffe01aebe60d5b2a6964e",
    },
    blockedAttempt: {
      path: "evals/skill-contracts/design-visual-m2-b1-v7-blocked.json",
      bytes: 13819,
      sha256: "98342a6bc909960d4c934af2488a285514cccfe32510730d2fe6181e7269ddb9",
    },
    latestReceipt: {
      path: "evals/skill-contracts/design-visual-m2-attempt-index-v9.json",
      bytes: 9042,
      sha256: "b11f75296eb5a6f53993bae7cc2ab776f00c07b27a0700e2d6c17fc177384933",
    },
    methodChange: "attached-image-only-design-and-visual-evaluator-instructions-no-path-open-or-view-image-no-acceptance-criteria-change",
    attemptPolicy: "one-method-changed-attempt-no-automatic-retry",
  };
  v8.inputs.designPrompt = structuredClone(ATTACHED_IMAGE_DESIGN_PROMPT);
  v8.inputs.visualPrompt = structuredClone(ATTACHED_IMAGE_VISUAL_PROMPT);
  v8.outputs = Object.fromEntries(
    Object.entries(v7.outputs).map(([key, value]) => [key, value.replace("-v7-", "-v8-")]),
  );
  const validated = subject.validateDesignVisualM2B1Plan(v8);
  assert.equal(validated.schemaVersion, 8);
  assert.equal(validated.id, "design-visual-m2-b1-smoke-plan-v8");
  assert.deepEqual(validated.predecessor, v8.predecessor);
  assert.deepEqual(validated.inputs.designPrompt, ATTACHED_IMAGE_DESIGN_PROMPT);
  assert.deepEqual(validated.inputs.visualPrompt, ATTACHED_IMAGE_VISUAL_PROMPT);
  assert.equal(Object.values(validated.outputs).every((file) => file.includes("-v8-")), true);
  assert.equal(Object.values(validated.outputs).some((file) => file.includes("-v7-")), false);
  for (const key of ["runtime", "candidates", "claimScope", "originalDetail", "boundaries"]) {
    assert.deepEqual(validated[key], v7[key]);
  }
  for (const key of [
    "authority", "frozenFacts", "designSkill", "visualSkill", "durableEvidence",
    "concreteDefect", "approvedReference", "approvedSource",
  ]) {
    assert.deepEqual(validated.inputs[key], v7.inputs[key], key);
  }
  assert.equal(digest(JSON.stringify(subject.designSchema())), "83057a2d2746c3be1741dadb4a39a7fb8375c988d3bbc6fb120f8ff03d7f002b");
  assert.equal(digest(JSON.stringify(subject.visualSchema("sample-a"))), "64682110930af7251454f45e7b4963de5f5bb16891c5a77c34b0b07b9ade5652");
  assert.equal(digest(JSON.stringify(subject.visualSchema("sample-b"))), "a71384d54076fa83b8bcce9f033947ec6a5417fe72cf9e8d47df23fe9b7847df");

  for (const [label, mutation] of [
    ["old Design prompt", (plan) => { plan.inputs.designPrompt = structuredClone(v7.inputs.designPrompt); }],
    ["old Visual prompt", (plan) => { plan.inputs.visualPrompt = structuredClone(v7.inputs.visualPrompt); }],
    ["non-prompt input drift", (plan) => { plan.inputs.designSkill = structuredClone(plan.inputs.visualSkill); }],
    ["runtime drift", (plan) => { plan.runtime.retryCount = 1; }],
    ["candidate drift", (plan) => { plan.candidates.reverse(); }],
    ["claim-scope drift", (plan) => { plan.claimScope.variant = "Pixel"; }],
    ["original-detail drift", (plan) => { plan.originalDetail = "VERIFIED"; }],
    ["boundary drift", (plan) => { plan.boundaries.states = "VERIFIED"; }],
    ["predecessor drift", (plan) => { plan.predecessor.plan.sha256 = "0".repeat(64); }],
    ["method drift", (plan) => { plan.predecessor.methodChange = "prompt-change"; }],
    ["output reuse", (plan) => { plan.outputs.summary = v7.outputs.summary; }],
  ]) {
    const changed = structuredClone(v8);
    mutation(changed);
    if (label === "non-prompt input drift") {
      changed.source = {
        repositoryCommit: "af1c76c1113e6190f16dc9f9c5640d1377900e94",
        runner: {
          path: "evals/support/run-design-visual-m2-b1.mjs",
          bytes: 101591,
          sha256: "52123e599efea2d4d8354c9690e006514df79a621509de778dce329628961c98",
        },
        freshTurnAdapter: structuredClone(v7.source.freshTurnAdapter),
        collector: structuredClone(v7.source.collector),
      };
      const fixture = await successorFixtureRoot(t, changed);
      await assert.rejects(subject.preflightDesignVisualM2B1({
        repositoryRoot: fixture.root,
        planPath: fixture.planPath,
        gitStatus: async () => "",
        gitIdentity: async (_root, sourceCommit, predecessorSourceCommit) => {
          assert.equal(sourceCommit, changed.source.repositoryCommit);
          assert.equal(predecessorSourceCommit, v7.source.repositoryCommit);
          return sourceCommit;
        },
        gitReadBlob: copiedFixtureGitReadBlob(changed),
      }), /contract.*input|input.*contract|evaluator contract/iu, label);
    } else {
      assert.throws(
        () => subject.validateDesignVisualM2B1Plan(changed),
        /prompt|runtime|candidate|scope|detail|boundar|predecessor|method|output|generation|malformed|differs/iu,
        label,
      );
    }
  }
});

test("M2B1 schema 8 rejects an unchanged method source commit or unchanged source blobs", async (t) => {
  const subject = await loadSubject();
  const v7 = JSON.parse(await readFile(ATTACHMENT_SEMANTICS_PLAN_PATH, "utf8"));
  const unchanged = structuredClone(v7);
  unchanged.schemaVersion = 8;
  unchanged.id = "design-visual-m2-b1-smoke-plan-v8";
  unchanged.predecessor = {
    plan: {
      path: "evals/skill-contracts/design-visual-m2-b1-smoke-plan-v7.json",
      bytes: 5703,
      sha256: "5be462158df803197ec2d5be1d2ae7c255591a5db52ffe01aebe60d5b2a6964e",
    },
    blockedAttempt: {
      path: "evals/skill-contracts/design-visual-m2-b1-v7-blocked.json",
      bytes: 13819,
      sha256: "98342a6bc909960d4c934af2488a285514cccfe32510730d2fe6181e7269ddb9",
    },
    latestReceipt: {
      path: "evals/skill-contracts/design-visual-m2-attempt-index-v9.json",
      bytes: 9042,
      sha256: "b11f75296eb5a6f53993bae7cc2ab776f00c07b27a0700e2d6c17fc177384933",
    },
    methodChange: "attached-image-only-design-and-visual-evaluator-instructions-no-path-open-or-view-image-no-acceptance-criteria-change",
    attemptPolicy: "one-method-changed-attempt-no-automatic-retry",
  };
  unchanged.inputs.designPrompt = structuredClone(ATTACHED_IMAGE_DESIGN_PROMPT);
  unchanged.inputs.visualPrompt = structuredClone(ATTACHED_IMAGE_VISUAL_PROMPT);
  unchanged.outputs = Object.fromEntries(
    Object.entries(v7.outputs).map(([key, value]) => [key, value.replace("-v7-", "-v8-")]),
  );

  const sameCommitFixture = await successorFixtureRoot(t, unchanged);
  await assert.rejects(subject.preflightDesignVisualM2B1({
    repositoryRoot: sameCommitFixture.root,
    planPath: sameCommitFixture.planPath,
    gitStatus: async () => "",
    gitIdentity: async (_root, sourceCommit) => sourceCommit,
    gitReadBlob: copiedFixtureGitReadBlob(unchanged),
  }), /source.*unchanged|method.*source/iu);

  const distinctCommitSameBlobs = structuredClone(unchanged);
  distinctCommitSameBlobs.source.repositoryCommit = "ded8dba1a6bec29ef1810be9a102b8553b542f8a";
  const sameBlobFixture = await successorFixtureRoot(t, unchanged);
  await writeFile(
    sameBlobFixture.planPath,
    JSON.stringify(distinctCommitSameBlobs, null, 2) + "\n",
  );
  await assert.rejects(subject.preflightDesignVisualM2B1({
    repositoryRoot: sameBlobFixture.root,
    planPath: sameBlobFixture.planPath,
    gitStatus: async () => "",
    gitIdentity: async (_root, sourceCommit) => sourceCommit,
    gitReadBlob: async (_root, implementationCommit, sourcePath) => {
      assert.equal(implementationCommit, distinctCommitSameBlobs.source.repositoryCommit);
      const bytes = await execFile(
        "git",
        ["show", `${v7.source.repositoryCommit}:${sourcePath}`],
        { cwd: ROOT, encoding: "buffer", maxBuffer: 1024 * 1024 },
      );
      return bytes.stdout;
    },
  }), /source.*unchanged|method.*source/iu);
});

test("M2B1 schema 8 default Git identity rejects a method-source rollback", async (t) => {
  const subject = await loadSubject();
  const v7 = JSON.parse(await readFile(ATTACHMENT_SEMANTICS_PLAN_PATH, "utf8"));
  const rollback = structuredClone(v7);
  rollback.schemaVersion = 8;
  rollback.id = "design-visual-m2-b1-smoke-plan-v8";
  rollback.predecessor = {
    plan: {
      path: "evals/skill-contracts/design-visual-m2-b1-smoke-plan-v7.json",
      bytes: 5703,
      sha256: "5be462158df803197ec2d5be1d2ae7c255591a5db52ffe01aebe60d5b2a6964e",
    },
    blockedAttempt: {
      path: "evals/skill-contracts/design-visual-m2-b1-v7-blocked.json",
      bytes: 13819,
      sha256: "98342a6bc909960d4c934af2488a285514cccfe32510730d2fe6181e7269ddb9",
    },
    latestReceipt: {
      path: "evals/skill-contracts/design-visual-m2-attempt-index-v9.json",
      bytes: 9042,
      sha256: "b11f75296eb5a6f53993bae7cc2ab776f00c07b27a0700e2d6c17fc177384933",
    },
    methodChange: "attached-image-only-design-and-visual-evaluator-instructions-no-path-open-or-view-image-no-acceptance-criteria-change",
    attemptPolicy: "one-method-changed-attempt-no-automatic-retry",
  };
  rollback.inputs.designPrompt = structuredClone(ATTACHED_IMAGE_DESIGN_PROMPT);
  rollback.inputs.visualPrompt = structuredClone(ATTACHED_IMAGE_VISUAL_PROMPT);
  rollback.outputs = Object.fromEntries(
    Object.entries(v7.outputs).map(([key, value]) => [key, value.replace("-v7-", "-v8-")]),
  );
  rollback.source = {
    repositoryCommit: "af1c76c1113e6190f16dc9f9c5640d1377900e94",
    runner: {
      path: "evals/support/run-design-visual-m2-b1.mjs",
      bytes: 101591,
      sha256: "52123e599efea2d4d8354c9690e006514df79a621509de778dce329628961c98",
    },
    freshTurnAdapter: structuredClone(v7.source.freshTurnAdapter),
    collector: structuredClone(v7.source.collector),
  };
  const planRoot = await mkdtemp(path.join(ROOT, ".m2b1-rollback-"));
  t.after(() => rm(planRoot, { recursive: true, force: true }));
  const planPath = path.join(planRoot, "plan.json");
  await writeFile(planPath, JSON.stringify(rollback, null, 2) + "\n");

  await assert.rejects(subject.preflightDesignVisualM2B1({
    repositoryRoot: ROOT,
    planPath,
    gitStatus: async () => "",
  }), /predecessor.*ancestor|descendant.*predecessor|method.*rollback/iu);
});

test("M2B1 actual v8 plan pins the attached-image support commit and collision-free outputs", async () => {
  const subject = await loadSubject();
  const v7 = JSON.parse(await readFile(ATTACHMENT_SEMANTICS_PLAN_PATH, "utf8"));
  const v8Bytes = await readFile(ATTACHED_IMAGE_PLAN_PATH);
  const v8 = JSON.parse(v8Bytes.toString("utf8"));
  const validated = subject.validateDesignVisualM2B1Plan(v8);

  assert.equal(validated.schemaVersion, 8);
  assert.equal(validated.id, "design-visual-m2-b1-smoke-plan-v8");
  assert.equal(validated.date, "2026-08-14");
  assert.equal(
    validated.source.repositoryCommit,
    "e8dd4831a8f33b1f8af9e635cb806d04df0225b4",
  );
  assert.deepEqual(validated.predecessor, {
    plan: {
      path: "evals/skill-contracts/design-visual-m2-b1-smoke-plan-v7.json",
      bytes: 5703,
      sha256: "5be462158df803197ec2d5be1d2ae7c255591a5db52ffe01aebe60d5b2a6964e",
    },
    blockedAttempt: {
      path: "evals/skill-contracts/design-visual-m2-b1-v7-blocked.json",
      bytes: 13819,
      sha256: "98342a6bc909960d4c934af2488a285514cccfe32510730d2fe6181e7269ddb9",
    },
    latestReceipt: {
      path: "evals/skill-contracts/design-visual-m2-attempt-index-v9.json",
      bytes: 9042,
      sha256: "b11f75296eb5a6f53993bae7cc2ab776f00c07b27a0700e2d6c17fc177384933",
    },
    methodChange: "attached-image-only-design-and-visual-evaluator-instructions-no-path-open-or-view-image-no-acceptance-criteria-change",
    attemptPolicy: "one-method-changed-attempt-no-automatic-retry",
  });
  assert.deepEqual(validated.inputs.designPrompt, ATTACHED_IMAGE_DESIGN_PROMPT);
  assert.deepEqual(validated.inputs.visualPrompt, ATTACHED_IMAGE_VISUAL_PROMPT);
  for (const key of [
    "authority", "frozenFacts", "designSkill", "visualSkill", "durableEvidence",
    "concreteDefect", "approvedReference", "approvedSource",
  ]) {
    assert.deepEqual(validated.inputs[key], v7.inputs[key], key);
  }
  for (const key of ["runtime", "candidates", "claimScope", "originalDetail", "boundaries"]) {
    assert.deepEqual(validated[key], v7[key], key);
  }
  assert.deepEqual(validated.outputs, {
    designRaw: "evals/skill-contracts/design-visual-m2-b1-v8-design-raw.json",
    designHandoff: "evals/skill-contracts/design-visual-m2-b1-v8-design-handoff.json",
    sampleARaw: "evals/skill-contracts/design-visual-m2-b1-v8-sample-a-raw.json",
    sampleAEnvelope: "evals/skill-contracts/design-visual-m2-b1-v8-sample-a-envelope.json",
    sampleBRaw: "evals/skill-contracts/design-visual-m2-b1-v8-sample-b-raw.json",
    sampleBEnvelope: "evals/skill-contracts/design-visual-m2-b1-v8-sample-b-envelope.json",
    summary: "evals/skill-contracts/design-visual-m2-b1-v8-summary.json",
    blocked: "evals/skill-contracts/design-visual-m2-b1-v8-blocked.json",
  });
  for (const pin of [
    validated.source.runner,
    validated.source.freshTurnAdapter,
    validated.source.collector,
  ]) {
    const committed = await execFile(
      "git",
      ["show", `${validated.source.repositoryCommit}:${pin.path}`],
      { cwd: ROOT, encoding: "buffer", maxBuffer: 1024 * 1024 },
    );
    assert.equal(committed.stdout.byteLength, pin.bytes);
    assert.equal(digest(committed.stdout), pin.sha256);
  }
  assert.notEqual(validated.source.repositoryCommit, v7.source.repositoryCommit);
  await execFile(
    "git",
    ["merge-base", "--is-ancestor", v7.source.repositoryCommit, validated.source.repositoryCommit],
    { cwd: ROOT },
  );
  for (const [key, output] of Object.entries(validated.outputs)) {
    if (key === "blocked") continue;
    await assertPathMissing(path.join(ROOT, ...output.split("/")));
  }
  const blocked = await readFile(path.join(ROOT, ...validated.outputs.blocked.split("/")));
  assert.equal(blocked.byteLength, 2094);
  assert.equal(digest(blocked), "9c0f132c7ed96234b320526a163bdc3dfa5b45383dff4f648183cfc1dfd14cec");
  assert.equal(v8Bytes.at(-1), 0x0a);
});
