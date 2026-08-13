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
          successfulImageViews: safeSuccessfulImageViews(
            options.input
              .map((entry, inputIndex) => ({ entry, inputIndex }))
              .filter(({ entry }) => entry.type === "localImage")
              .map(({ inputIndex }) => inputIndex),
          ),
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
    safeSuccessfulImageViews([1]),
  );
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

test("M2B1 success requires exactly one complete image-view lifecycle per phase image", async (t) => {
  const subject = await loadSubject();
  const cases = [
    {
      phaseCall: 1,
      views: safeSuccessfulImageViews(),
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
    await assert.rejects(
      subject.runDesignVisualM2B1({ repositoryRoot: root, planPath, ...dependencies }),
      /successful image-view|image evidence|correlated/iu,
    );
    assert.equal(
      dependencies.writes.every(({ file }) => file.endsWith("blocked.json")),
      true,
    );
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
