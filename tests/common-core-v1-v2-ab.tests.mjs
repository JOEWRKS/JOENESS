import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  evaluateValidatedAbExperiment as validateAbExperiment,
  validateAbExperiment as validateRawAbExperiment,
  validateCodingRawArtifacts,
  validatePolicyRawArtifacts,
  verifyCliGitBindings,
} from "../evals/support/evaluate-common-core-v1-v2-ab.mjs";

const HEAD = "0123456789abcdef0123456789abcdef01234567";
const CONTROL_HEAD = "89abcdef0123456789abcdef0123456789abcdef";
const SOURCE_SNAPSHOT = "1".repeat(64);
const V1_SHA = "a".repeat(64);
const V2_SHA = "b".repeat(64);
const POLICY_CASE_IDS = Array.from(
  { length: 16 },
  (_, index) => `policy-${String(index + 1).padStart(2, "0")}`,
);
const digest = (value) =>
  createHash("sha256").update(value).digest("hex");

const EXPERIMENT = {
  schemaVersion: 1,
  candidates: {
    v1: { source: "v1.md", byteLength: 100, sha256: V1_SHA },
    v2: { source: "v2.md", byteLength: 75, sha256: V2_SHA },
  },
  runtime: {
    appServer: "codex-cli 0.145.0",
    model: "gpt-5.6-sol",
    reasoningEffort: "low",
    serviceTier: "default",
    codingRunner: "runner.mjs",
    codingCases: "cases.json",
    evaluator: "evaluator.mjs",
  },
  policy: {
    controlMode: "run-control-ab-v8",
    arms: [
      "run-core-v1-ab-v8-r1",
      "run-core-v2-ab-v8-r1",
      "run-core-v2-ab-v8-r2",
      "run-core-v1-ab-v8-r2",
      "run-core-v2-ab-v8-r3",
      "run-core-v1-ab-v8-r3",
      "run-core-v1-ab-v8-r4",
      "run-core-v2-ab-v8-r4",
    ],
    repetitionsPerCandidate: 4,
    casesPerArm: 16,
    tieRule: "not-a-v2-win",
    nullRule: "block",
    outlierRemoval: "forbidden",
  },
  coding: {
    arms: [
      "run-v1-coding-ab-r1",
      "run-v2-coding-ab-r1",
      "run-v2-coding-ab-r2",
      "run-v1-coding-ab-r2",
    ],
    cases: [
      "feature-immutable-update",
      "maintenance-shared-parser",
      "frontend-responsive-accessible",
    ],
    repetitionsPerCandidate: 2,
    executionSurface: "patch-only-no-shell",
    patchEvidence: "jsonl-file-change-hard-gate",
    outlierRemoval: "forbidden",
  },
  review: {
    primary: "blind-all-policy-cases",
    audit: {
      schemaVersion: 1,
      artifactId: "common-core-v1-v2-ab-review-audit-v8",
      artifactPath:
        "evals/reviews/common-core-v1-v2-ab-review-audit-v8.json",
      selection: "case-index-0-5-10-15-each-arm",
      caseIndexes: [0, 5, 10, 15],
      minimumRawAgreementPercent: 100,
    },
    unresolvedDisagreements: 0,
  },
  claimScope: {
    realCodeImplementation: "measured-three-small-patch-only-cases",
    autonomousTestIteration: "not-measured",
    codingExecutionSurface: "patch-only-no-shell",
    frontendFunctionalResponsiveAccessibility:
      "measured-static-contract-and-menu-logic",
    visualFidelityAndFigmaQuality: "not-measured",
    statisticalGeneralization: "not-claimed",
  },
  gates: {
    comparability: {
      evidenceLimitations: 0,
      unexpectedChanges: 0,
      sessionFatals: 0,
    },
    quality: {
      policyV2Passes: 64,
      codingV2Passes: 6,
      codingVisibleAndHiddenChecksRequired: true,
      codingScopeAndInstructionIntegrityRequired: true,
    },
    tokenEfficiency: {
      staticByteReductionPercentMin: 20,
      policyAggregateInputReductionPercentMin: 2,
      policyCaseMedianInputWinsMin: 12,
      policyCaseCount: 16,
      policyRepetitionInputLowerMin: 3,
      policyRepetitionCount: 4,
      policyMedianCaseTotalDeltaMaxExclusive: 0,
      codingAggregateInputRegressionPercentMax: 0,
      combinedTotalTokenDeltaMaxExclusive: 0,
    },
    latency: {
      combinedWallClockRegressionPercentMax: 25,
    },
  },
};

function policyRunId(mode) {
  if (mode === "run-control-ab-v8") return "no-harness-control-ab-v8";
  return mode.replace(/^run-core-/, "common-core-");
}

function candidateAndRepetition(id) {
  const match = id.match(/(?:^|-)(v[12])-(?:coding-ab|ab-v8)-r?([1-4])$/);
  if (!match) throw new Error(`bad fixture id: ${id}`);
  return { version: match[1], repetition: Number(match[2]) };
}

function policyArtifact(mode, recordedAt) {
  const runId = policyRunId(mode);
  const isControl = mode === EXPERIMENT.policy.controlMode;
  const { version = "v1" } = isControl
    ? {}
    : candidateAndRepetition(runId);
  const inputTokens = version === "v1" ? 100 : 95;
  const totalTokens = version === "v1" ? 120 : 110;
  const wallClockMs = version === "v1" ? 1000 : 1050;
  const candidate = EXPERIMENT.candidates[version];
  return {
    schemaVersion: 8,
    runId,
    recordedAt,
    evidence: {
      source: {
        head: isControl ? CONTROL_HEAD : HEAD,
        status: [],
        workingFiles: { sha256: SOURCE_SNAPSHOT },
        gitBlobs: {
          "collector.mjs": {
            workingGitHash: "1234567890abcdef1234567890abcdef12345678",
            headGitHash: "1234567890abcdef1234567890abcdef12345678",
          },
        },
        sha256: { "collector.mjs": "4".repeat(64) },
      },
      runtime: { version: EXPERIMENT.runtime.appServer },
      cases: POLICY_CASE_IDS.map((id) => ({
        id,
        thread: {
          model: EXPERIMENT.runtime.model,
          reasoningEffort: EXPERIMENT.runtime.reasoningEffort,
          serviceTier: EXPERIMENT.runtime.serviceTier,
        },
        metrics: {
          inputTokens,
          cachedInputTokens: 20,
          outputTokens: totalTokens - inputTokens,
          reasoningOutputTokens: 5,
          totalTokens,
          wallClockMs,
        },
        sessionFatal: false,
      })),
      evaluation: {
        condition: isControl ? "control" : "core",
        candidateReference: {
          sourcePath: candidate.source,
          byteLength: candidate.byteLength,
          sha256: candidate.sha256,
        },
        instructionOverlay: isControl
          ? null
          : {
              sourcePath: candidate.source,
              byteLength: candidate.byteLength,
              sha256: candidate.sha256,
            },
        baseline: isControl
          ? null
          : { runId: policyRunId(EXPERIMENT.policy.controlMode) },
      },
      unexpectedChanges: [],
      evidenceLimitations: [],
    },
    review: {
      status: "complete",
      capabilityVerdict: "pass",
      caseJudgments: POLICY_CASE_IDS.map((id) => ({
        id,
        judgment: "pass",
        reasons: ["reviewed"],
        references: ["/evidence/cases/0"],
      })),
    },
  };
}

function codingArtifact(mode, recordedAt) {
  const { version, repetition } = candidateAndRepetition(mode);
  const candidate = EXPERIMENT.candidates[version];
  const inputTokens = 100;
  const totalTokens = version === "v1" ? 120 : 110;
  return {
    schemaVersion: 1,
    kind: "common-core-coding-ab",
    id: mode,
    runId: `00000000-0000-4000-8000-${version === "v1" ? "1" : "2"}${repetition}0000000000`,
    recordedAt,
    source: {
      head: HEAD,
      clean: true,
      objectFormat: "sha1",
      runner: { path: "runner.mjs", sha256: "2".repeat(64) },
      cases: { path: "cases.json", sha256: "3".repeat(64) },
    },
    runtime: {
      codexVersion: EXPERIMENT.runtime.appServer,
      model: EXPERIMENT.runtime.model,
      reasoningEffort: EXPERIMENT.runtime.reasoningEffort,
      serviceTier: EXPERIMENT.runtime.serviceTier,
      approvalPolicy: "never",
      sandbox: "workspace-write",
      network: false,
      ephemeral: true,
      executionSurface: "patch-only-no-shell",
      shellTool: false,
      patchToolEvidence: "jsonl-file-change-hard-gate",
      ignoreUserConfig: true,
      ignoreRules: true,
      disabledFeatures: [
        "apps",
        "plugins",
        "multi_agent",
        "hooks",
        "skill_search",
        "shell_tool",
        "unified_exec",
      ],
      shellEnvPolicy:
        'inherit="core",ignore_default_excludes=false',
    },
    candidate: {
      id: version,
      path: candidate.source,
      expectedSha256: candidate.sha256,
      actualSha256: candidate.sha256,
      bytes: candidate.byteLength,
    },
    repetition,
    cases: EXPERIMENT.coding.cases.map((caseId) => {
      const diffText =
        "diff --git a/src/target.js b/src/target.js\n--- a/src/target.js\n+++ b/src/target.js\n";
      const baselineFiles = {
        "AGENTS.md": { bytes: 10, sha256: "4".repeat(64) },
        "src/target.js": { bytes: 1, sha256: "5".repeat(64) },
      };
      const currentFiles = {
        "AGENTS.md": baselineFiles["AGENTS.md"],
        "src/target.js": { bytes: 2, sha256: "6".repeat(64) },
      };
      const fileTree = (files) => ({
        files,
        bytes: Object.values(files).reduce(
          (total, metadata) => total + metadata.bytes,
          0,
        ),
        sha256: digest(
          JSON.stringify(
            Object.fromEntries(
              Object.entries(files).sort(([left], [right]) =>
                left.localeCompare(right),
              ),
            ),
          ),
        ),
      });
      const gitMetadata = fileTree({
        HEAD: { bytes: 41, sha256: "7".repeat(64) },
      });
      return {
      caseId,
      baseline: {
        gitHead: HEAD,
        gitTree: "8".repeat(40),
        gitMetadataSha256: gitMetadata.sha256,
        gitMetadata,
        fileTree: fileTree(baselineFiles),
        changedPaths: [],
        diff: { text: "", bytes: 0, sha256: digest(""), truncated: false },
        visible: { exitCode: 1 },
        hidden: { exitCode: 1 },
      },
      metrics: {
        inputTokens,
        cachedInputTokens: 20,
        outputTokens: totalTokens - inputTokens,
        reasoningOutputTokens: 5,
        totalTokens,
        wallClockMs: 1000,
        finalOutputBytes: 100,
        eventCount: 3,
      },
      process: {
        exitCode: 0,
        stderr: "",
        itemTypes: ["reasoning", "file_change", "agent_message"],
        fileChangePaths: ["src/target.js"],
      },
      finalMessage: "Implemented. I did not run tests; the controller must validate.",
      changedPaths: ["src/target.js"],
      diff: {
        text: diffText,
        bytes: Buffer.byteLength(diffText),
        sha256: digest(diffText),
        truncated: false,
      },
      fileTree: fileTree(currentFiles),
      git: {
        head: HEAD,
        tree: "8".repeat(40),
        metadataSha256: gitMetadata.sha256,
        metadata: gitMetadata,
      },
      tests: {
        visible: { exitCode: 0, stdout: "", stderr: "" },
        hidden: { exitCode: 0, stdout: "", stderr: "" },
      },
      workspaceSize: { files: 3, bytes: 1000 },
      integrity: {
        instructionUnchanged: true,
        changedPathsAllowed: true,
        protectedPathsUnchanged: true,
        noSymlinks: true,
        workspaceContained: true,
        safeImplementationFiles: true,
        patchOnlyToolSurface: true,
        claimIntegrity: true,
        gitMetadataUnchanged: true,
        fixtureHeadUnchanged: true,
        fullTreeDiffMatchesGit: true,
        noUserConfigPluginsOrSkills: true,
        credentialPathOutsideWorkspace: true,
        identityHomeEmpty: true,
        shellEnvPolicy:
          'inherit="core",ignore_default_excludes=false',
      },
    };
    }),
    totals: {
      inputTokens: 300,
      cachedInputTokens: 60,
      outputTokens: (totalTokens - inputTokens) * 3,
      reasoningOutputTokens: 15,
      totalTokens: totalTokens * 3,
      wallClockMs: 3000,
      finalOutputBytes: 300,
      eventCount: 9,
    },
    checks: {
      sourceClean: true,
      sourceBound: true,
      candidateHashMatch: true,
      allCasesCompleted: true,
      allBaselineTestsFail: true,
      allVisibleTestsPass: true,
      allHiddenTestsPass: true,
      noSymlinks: true,
      outputWithinLimits: true,
      safeImplementationFiles: true,
      patchOnlyToolSurface: true,
      claimIntegrity: true,
      gitMetadataUnchanged: true,
      fixtureHeadUnchanged: true,
      fullTreeDiffMatchesGit: true,
      noUserConfigPluginsOrSkills: true,
      credentialPathOutsideWorkspace: true,
      identityHomeEmpty: true,
      shellEnvPolicy: true,
    },
  };
}

function makeFixture() {
  let second = 0;
  const timestamp = () =>
    new Date(Date.UTC(2026, 6, 31, 0, 0, second++)).toISOString();
  const policyArtifacts = [
      policyArtifact(EXPERIMENT.policy.controlMode, timestamp()),
      ...EXPERIMENT.policy.arms.map((mode) =>
        policyArtifact(mode, timestamp()),
      ),
    ];
  const codingArtifacts = EXPERIMENT.coding.arms.map((mode) =>
      codingArtifact(mode, timestamp()),
    );
  const comparisons = policyArtifacts.slice(1).flatMap((artifact) =>
    EXPERIMENT.review.audit.caseIndexes.map((caseIndex) => ({
      runId: artifact.runId,
      caseId: POLICY_CASE_IDS[caseIndex],
      primaryJudgment:
        artifact.review.caseJudgments[caseIndex].judgment,
      auditJudgment:
        artifact.review.caseJudgments[caseIndex].judgment,
    })),
  );
  return {
    policyArtifacts,
    codingArtifacts,
    auditArtifact: {
      schemaVersion: 1,
      id: EXPERIMENT.review.audit.artifactId,
      recordedAt: timestamp(),
      selection: EXPERIMENT.review.audit.selection,
      comparisons,
      agreementPercent: 100,
      unresolvedDisagreements: 0,
    },
  };
}

test("collector raw validation rejects post-capture evidence, hash, and review mutation", async () => {
  const controlBytes = await readFile(
    new URL("../evals/p0/no-harness-control-v7.json", import.meta.url),
  );
  const coreBytes = await readFile(
    new URL("../evals/p0/common-core-v7.json", import.meta.url),
  );
  const originals = [
    JSON.parse(controlBytes),
    JSON.parse(coreBytes),
  ];
  const bytesByRunId = new Map([
    [originals[0].runId, controlBytes],
    [originals[1].runId, coreBytes],
  ]);

  assert.equal(
    validatePolicyRawArtifacts(originals, bytesByRunId),
    true,
  );
  for (const mutate of [
    (artifacts) => {
      artifacts[1].evidence.cases[0].metrics.inputTokens += 1;
    },
    (artifacts) => {
      artifacts[1].evidenceSha256 = "f".repeat(64);
    },
    (artifacts) => {
      artifacts[1].review.caseJudgments[0].judgment = "fail";
    },
  ]) {
    const artifacts = structuredClone(originals);
    mutate(artifacts);
    assert.throws(
      () => validatePolicyRawArtifacts(artifacts, bytesByRunId),
      /raw bytes|evidence hash/,
    );
  }
});

test("public set validation cannot bypass missing raw policy bytes", () => {
  assert.throws(
    () => validateRawAbExperiment(EXPERIMENT, makeFixture()),
    /raw policy artifact bytes/,
  );
});

test("coding raw validation recomputes tests, process, scope, diff, and isolation checks", () => {
  const artifacts = makeFixture().codingArtifacts;
  const catalog = {
    schemaVersion: 1,
    cases: EXPERIMENT.coding.cases.map((id) => ({
      id,
      allowedChangedPaths: ["src/target.js"],
      protectedPaths: ["AGENTS.md"],
    })),
  };
  const bytesFor = (items) =>
    new Map(
      items.map((artifact) => [
        artifact.id,
        Buffer.from(`${JSON.stringify(artifact)}\n`),
      ]),
    );
  assert.equal(
    validateCodingRawArtifacts(artifacts, bytesFor(artifacts), catalog),
    true,
  );
  for (const mutate of [
    (item) => {
      item.baseline.visible.exitCode = 0;
    },
    (item) => {
      item.process.exitCode = 1;
    },
    (item) => {
      item.changedPaths = ["src/not-allowed.js"];
    },
    (item) => {
      item.diff.sha256 = "f".repeat(64);
    },
    (item) => {
      item.integrity.noUserConfigPluginsOrSkills = false;
    },
  ]) {
    const changed = structuredClone(artifacts);
    mutate(changed[1].cases[0]);
    assert.throws(
      () =>
        validateCodingRawArtifacts(changed, bytesFor(changed), catalog),
      /coding raw|coding check|coding case/,
    );
  }
});

test("valid direct A/B evidence passes and reports the frozen formulas", () => {
  const result = validateAbExperiment(EXPERIMENT, makeFixture());

  assert.equal(result.verdict, "pass");
  assert.deepEqual(result.reasons, []);
  assert.deepEqual(
    {
      staticReduction: result.metrics.staticByteReductionPercent,
      control: result.metrics.control,
      policyRaw: result.metrics.policy.rawCandidateTotals,
      policyInput: result.metrics.policy.caseMedianCandidateTotals,
      policyInputReduction:
        result.metrics.policy.aggregateInputReductionPercent,
      policyWins: result.metrics.policy.caseMedianInputWins,
      policyRepetitionWins: result.metrics.policy.repetitionInputLowerCount,
      policyMedianTotalDelta:
        result.metrics.policy.medianCaseTotalTokenDelta,
      codingRaw: result.metrics.coding.rawCandidateTotals,
      codingInput: result.metrics.coding.caseMedianCandidateTotals,
      codingRegression:
        result.metrics.coding.aggregateInputRegressionPercent,
      combinedTotalDelta: result.metrics.combined.totalTokenDelta,
      combinedInputDelta: result.metrics.combined.inputTokenDelta,
      experimentObservedTotalTokens:
        result.metrics.experimentObservedTotals.totalTokens,
    },
    {
      staticReduction: 25,
      control: {
        inputTokens: 1600,
        cachedInputTokens: 320,
        outputTokens: 320,
        reasoningOutputTokens: 80,
        totalTokens: 1920,
        wallClockMs: 16000,
      },
      policyRaw: {
        v1: {
          inputTokens: 6400,
          cachedInputTokens: 1280,
          outputTokens: 1280,
          reasoningOutputTokens: 320,
          totalTokens: 7680,
          wallClockMs: 64000,
        },
        v2: {
          inputTokens: 6080,
          cachedInputTokens: 1280,
          outputTokens: 960,
          reasoningOutputTokens: 320,
          totalTokens: 7040,
          wallClockMs: 67200,
        },
      },
      policyInput: {
        v1: {
          inputTokens: 1600,
          cachedInputTokens: 320,
          outputTokens: 320,
          reasoningOutputTokens: 80,
          totalTokens: 1920,
          wallClockMs: 16000,
        },
        v2: {
          inputTokens: 1520,
          cachedInputTokens: 320,
          outputTokens: 240,
          reasoningOutputTokens: 80,
          totalTokens: 1760,
          wallClockMs: 16800,
        },
      },
      policyInputReduction: 5,
      policyWins: 16,
      policyRepetitionWins: 4,
      policyMedianTotalDelta: -10,
      codingRaw: {
        v1: {
          inputTokens: 600,
          cachedInputTokens: 120,
          outputTokens: 120,
          reasoningOutputTokens: 30,
          totalTokens: 720,
          wallClockMs: 6000,
        },
        v2: {
          inputTokens: 600,
          cachedInputTokens: 120,
          outputTokens: 60,
          reasoningOutputTokens: 30,
          totalTokens: 660,
          wallClockMs: 6000,
        },
      },
      codingInput: {
        v1: {
          inputTokens: 300,
          cachedInputTokens: 60,
          outputTokens: 60,
          reasoningOutputTokens: 15,
          totalTokens: 360,
          wallClockMs: 3000,
        },
        v2: {
          inputTokens: 300,
          cachedInputTokens: 60,
          outputTokens: 30,
          reasoningOutputTokens: 15,
          totalTokens: 330,
          wallClockMs: 3000,
        },
      },
      codingRegression: 0,
      combinedTotalDelta: -700,
      combinedInputDelta: -320,
      experimentObservedTotalTokens: 18020,
    },
  );
  assert.equal(result.gates.combinedWallClockRegression.pass, true);
  assert.equal(
    Math.round(result.metrics.combined.wallClockRegressionPercent * 1000),
    4571,
  );
  assert.equal(result.raw.policy.length, 128);
  assert.equal(result.raw.coding.length, 12);
});

test("an incomplete artifact set is invalid", () => {
  const fixture = makeFixture();
  fixture.policyArtifacts.pop();
  assert.throws(
    () => validateAbExperiment(EXPERIMENT, fixture),
    /policy artifact set must contain exactly 9 artifacts/,
  );
});

test("artifact order must match the declared order", () => {
  const fixture = makeFixture();
  [fixture.policyArtifacts[1], fixture.policyArtifacts[2]] = [
    fixture.policyArtifacts[2],
    fixture.policyArtifacts[1],
  ];
  assert.throws(
    () => validateAbExperiment(EXPERIMENT, fixture),
    /policy artifact order/,
  );
});

test("recordedAt values must be canonical and strictly increasing", () => {
  const fixture = makeFixture();
  fixture.policyArtifacts[2].recordedAt =
    fixture.policyArtifacts[1].recordedAt;
  assert.throws(
    () => validateAbExperiment(EXPERIMENT, fixture),
    /recordedAt.*strictly increasing/,
  );
});

test("fixed HEAD drift is invalid", () => {
  const fixture = makeFixture();
  fixture.codingArtifacts[1].source.head = "f".repeat(40);
  assert.throws(
    () => validateAbExperiment(EXPERIMENT, fixture),
    /fixed HEAD/,
  );
});

test("claim scope cannot overstate the patch-only coding evidence", () => {
  const fixture = makeFixture();
  const experiment = structuredClone(EXPERIMENT);
  experiment.claimScope.visualFidelityAndFigmaQuality = "measured";
  assert.throws(
    () => validateAbExperiment(experiment, fixture),
    /visual fidelity and Figma claim scope/,
  );
});

test("verified policy source drift across Control and Core is invalid", () => {
  const fixture = makeFixture();
  fixture.policyArtifacts[1].evidence.source.sha256["collector.mjs"] =
    "5".repeat(64);
  assert.throws(
    () => validateAbExperiment(EXPERIMENT, fixture),
    /verified source identity drifted/,
  );
});

test("candidate SHA drift is invalid", () => {
  const fixture = makeFixture();
  fixture.policyArtifacts[2].evidence.evaluation.candidateReference.sha256 =
    "f".repeat(64);
  assert.throws(
    () => validateAbExperiment(EXPERIMENT, fixture),
    /candidate SHA/,
  );
});

test("review must be complete and capability-valid", () => {
  const fixture = makeFixture();
  fixture.policyArtifacts[1].review.capabilityVerdict = "blocked";
  assert.throws(
    () => validateAbExperiment(EXPERIMENT, fixture),
    /review capability/,
  );
});

test("missing independent review audit blocks promotion", () => {
  const fixture = makeFixture();
  fixture.auditArtifact = null;
  const result = validateAbExperiment(EXPERIMENT, fixture);

  assert.equal(result.verdict, "blocked");
  assert.equal(result.gates.reviewAudit.pass, false);
  assert.equal(result.metrics.reviewAudit.status, "missing");
});

test("review audit agreement is recomputed from exact primary judgments", () => {
  const fixture = makeFixture();
  fixture.auditArtifact.comparisons[0].auditJudgment = "fail";
  fixture.auditArtifact.agreementPercent = 96.875;
  fixture.auditArtifact.unresolvedDisagreements = 1;
  const result = validateAbExperiment(EXPERIMENT, fixture);

  assert.equal(result.verdict, "blocked");
  assert.equal(result.metrics.reviewAudit.agreementPercent, 96.875);
  assert.equal(result.metrics.reviewAudit.unresolvedDisagreements, 1);
  assert.equal(result.gates.reviewAudit.pass, false);
});

test("review audit cannot rewrite the recorded primary judgment", () => {
  const fixture = makeFixture();
  fixture.auditArtifact.comparisons[0].primaryJudgment = "fail";
  assert.throws(
    () => validateAbExperiment(EXPERIMENT, fixture),
    /audit primary judgment drifted/,
  );
});

test("a null metric blocks instead of being discarded or throwing", () => {
  const fixture = makeFixture();
  fixture.policyArtifacts[2].evidence.cases[0].metrics.inputTokens = null;
  const result = validateAbExperiment(EXPERIMENT, fixture);

  assert.equal(result.verdict, "blocked");
  assert.equal(result.gates.metricsComplete.pass, false);
  assert.ok(result.reasons.includes("metrics contain null"));
});

test("input-token ties are not counted as v2 wins", () => {
  const fixture = makeFixture();
  for (const artifact of fixture.policyArtifacts) {
    if (artifact.runId.includes("-v2-")) {
      for (const item of artifact.evidence.cases) {
        item.metrics.inputTokens = 100;
      }
    }
  }
  const result = validateAbExperiment(EXPERIMENT, fixture);

  assert.equal(result.verdict, "blocked");
  assert.equal(result.metrics.policy.caseMedianInputWins, 0);
  assert.equal(result.metrics.policy.aggregateInputReductionPercent, 0);
  assert.equal(result.gates.policyCaseMedianInputWins.pass, false);
});

test("coding input regression is a blocking gate", () => {
  const fixture = makeFixture();
  for (const artifact of fixture.codingArtifacts) {
    if (artifact.candidate.id === "v2") {
      for (const item of artifact.cases) {
        item.metrics.inputTokens = 101;
        item.metrics.outputTokens = 9;
      }
      artifact.totals.inputTokens = 303;
      artifact.totals.outputTokens = 27;
    }
  }
  const result = validateAbExperiment(EXPERIMENT, fixture);

  assert.equal(result.verdict, "blocked");
  assert.equal(result.metrics.coding.aggregateInputRegressionPercent, 1);
  assert.equal(result.gates.codingAggregateInputRegression.pass, false);
});

test("a raw policy outlier is never removed from the primary cost gate", () => {
  const fixture = makeFixture();
  const artifact = fixture.policyArtifacts.find(
    ({ runId }) => runId === "common-core-v2-ab-v8-r1",
  );
  artifact.evidence.cases[0].metrics.inputTokens = 1000;
  const result = validateAbExperiment(EXPERIMENT, fixture);

  assert.equal(
    result.metrics.policy.caseMedianCandidateTotals.v2.inputTokens,
    1520,
  );
  assert.equal(result.metrics.policy.rawCandidateTotals.v2.inputTokens, 6985);
  assert.equal(
    Math.round(result.metrics.policy.aggregateInputReductionPercent * 1000),
    -9141,
  );
  assert.equal(result.gates.policyAggregateInputReduction.pass, false);
  assert.equal(result.verdict, "blocked");
});

test("a v2 coding integrity failure is a blocking quality failure", () => {
  const fixture = makeFixture();
  fixture.codingArtifacts[1].cases[0].integrity.instructionUnchanged =
    false;
  const result = validateAbExperiment(EXPERIMENT, fixture);

  assert.equal(result.verdict, "blocked");
  assert.equal(result.metrics.quality.codingV2Passes, 5);
  assert.equal(result.gates.codingV2Passes.pass, false);
});

test("an empty or failed v2 coding run is not counted as implementation success", () => {
  for (const mutate of [
    (item) => {
      item.changedPaths = [];
    },
    (item) => {
      item.integrity.safeImplementationFiles = false;
    },
    (item) => {
      item.integrity.patchOnlyToolSurface = false;
    },
    (item) => {
      item.integrity.claimIntegrity = false;
    },
  ]) {
    const fixture = makeFixture();
    mutate(fixture.codingArtifacts[1].cases[0]);
    const result = validateAbExperiment(EXPERIMENT, fixture);
    assert.equal(result.verdict, "blocked");
    assert.equal(result.metrics.quality.codingV2Passes, 5);
  }
});

test("a failed v2 Codex process cannot count as a coding pass", () => {
  const fixture = makeFixture();
  fixture.codingArtifacts[1].cases[0].process.exitCode = 1;
  const result = validateAbExperiment(EXPERIMENT, fixture);

  assert.equal(result.metrics.quality.codingV2Passes, 5);
  assert.equal(result.gates.codingV2Passes.pass, false);
  assert.equal(result.verdict, "blocked");
});

test("a v1 implementation failure remains measured instead of invalidating comparability", () => {
  const fixture = makeFixture();
  fixture.codingArtifacts[0].cases[0].tests.hidden.exitCode = 1;
  fixture.codingArtifacts[0].checks.allHiddenTestsPass = false;
  const result = validateAbExperiment(EXPERIMENT, fixture);

  assert.equal(result.gates.codingComparability.pass, true);
  assert.equal(result.metrics.quality.codingV2Passes, 6);
  assert.equal(result.verdict, "pass");
});

test("CLI bindings anchor evaluator, Control, Core, coding, audit, and contract bytes to Git", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "common-core-ab-validator-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const git = (...args) =>
    execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      windowsHide: true,
    }).trim();
  const contractPath = path.join(root, "contract.json");
  const runnerPath = path.join(root, "runner.mjs");
  const casesPath = path.join(root, "cases.json");
  const evaluatorPath = path.join(root, "evaluator.mjs");
  const runnerText = "export const runner = true;\n";
  const casesText = `${JSON.stringify({
    schemaVersion: 1,
    cases: EXPERIMENT.coding.cases.map((id) => ({
      id,
      allowedChangedPaths: ["src/target.js"],
      protectedPaths: ["AGENTS.md"],
    })),
  })}\n`;
  const evaluatorText = "export const evaluator = true;\n";
  const candidateTexts = {
    v1: `${"common core v1 ".repeat(8)}\n`,
    v2: "common core v2\n",
  };
  const cliExperiment = structuredClone(EXPERIMENT);
  cliExperiment.runtime.evaluator = "evaluator.mjs";
  for (const version of ["v1", "v2"]) {
    cliExperiment.candidates[version] = {
      source: `${version}.md`,
      byteLength: Buffer.byteLength(candidateTexts[version]),
      sha256: digest(candidateTexts[version]),
    };
  }
  const contractText = `${JSON.stringify(cliExperiment, null, 2)}\n`;
  await Promise.all([
    writeFile(contractPath, contractText),
    writeFile(runnerPath, runnerText),
    writeFile(casesPath, casesText),
    writeFile(evaluatorPath, evaluatorText),
    writeFile(path.join(root, "v1.md"), candidateTexts.v1),
    writeFile(path.join(root, "v2.md"), candidateTexts.v2),
  ]);
  git("init", "--quiet");
  git("config", "core.autocrlf", "false");
  git("config", "user.email", "validator@example.invalid");
  git("config", "user.name", "Validator Test");
  git(
    "add",
    "contract.json",
    "runner.mjs",
    "cases.json",
    "evaluator.mjs",
    "v1.md",
    "v2.md",
  );
  git("commit", "--quiet", "-m", "freeze contract");
  const controlHead = git("rev-parse", "HEAD");
  const runnerGitHash = git("rev-parse", `${controlHead}:runner.mjs`);
  const casesGitHash = git("rev-parse", `${controlHead}:cases.json`);

  const fixture = makeFixture();
  for (const artifact of fixture.policyArtifacts) {
    const version = artifact.runId.includes("-v2-") ? "v2" : "v1";
    artifact.evidence.evaluation.candidateReference = {
      sourcePath: cliExperiment.candidates[version].source,
      byteLength: cliExperiment.candidates[version].byteLength,
      sha256: cliExperiment.candidates[version].sha256,
    };
    if (artifact.evidence.evaluation.instructionOverlay) {
      artifact.evidence.evaluation.instructionOverlay = {
        ...artifact.evidence.evaluation.candidateReference,
      };
    }
  }
  for (const artifact of fixture.codingArtifacts) {
    const candidate = cliExperiment.candidates[artifact.candidate.id];
    artifact.candidate.path = candidate.source;
    artifact.candidate.expectedSha256 = candidate.sha256;
    artifact.candidate.actualSha256 = candidate.sha256;
    artifact.candidate.bytes = candidate.byteLength;
  }
  fixture.policyArtifacts[0].evidence.source.head = controlHead;
  for (const artifact of fixture.policyArtifacts) {
    artifact.evidence.source.gitBlobs = {
      "runner.mjs": {
        workingGitHash: runnerGitHash,
        headGitHash: runnerGitHash,
      },
      "cases.json": {
        workingGitHash: casesGitHash,
        headGitHash: casesGitHash,
      },
    };
    artifact.evidence.source.sha256 = {
      "runner.mjs": digest(runnerText),
      "cases.json": digest(casesText),
    };
  }
  const controlRelativePath =
    "evals/p0/no-harness-control-ab-v8.json";
  const controlPath = path.join(root, ...controlRelativePath.split("/"));
  await mkdir(path.dirname(controlPath), { recursive: true });
  await writeFile(
    controlPath,
    `${JSON.stringify(fixture.policyArtifacts[0])}\n`,
  );
  git("add", controlRelativePath);
  git("commit", "--quiet", "-m", "freeze reviewed control");
  const fixedHead = git("rev-parse", "HEAD");
  const policyArtifactBytes = new Map([
    [
      fixture.policyArtifacts[0].runId,
      await readFile(controlPath),
    ],
  ]);
  for (const artifact of fixture.policyArtifacts.slice(1)) {
    artifact.evidence.source.head = fixedHead;
    const relative = `evals/p0/${artifact.runId}.json`;
    const destination = path.join(root, ...relative.split("/"));
    const bytes = Buffer.from(`${JSON.stringify(artifact)}\n`);
    await writeFile(destination, bytes);
    policyArtifactBytes.set(artifact.runId, bytes);
  }
  const codingArtifactBytes = new Map();
  for (const artifact of fixture.codingArtifacts) {
    artifact.source.head = fixedHead;
    artifact.source.runner.sha256 = digest(runnerText);
    artifact.source.cases.sha256 = digest(casesText);
    const relative = `evals/coding/results/${artifact.id}.json`;
    const destination = path.join(root, ...relative.split("/"));
    await mkdir(path.dirname(destination), { recursive: true });
    const bytes = Buffer.from(`${JSON.stringify(artifact)}\n`);
    await writeFile(destination, bytes);
    codingArtifactBytes.set(artifact.id, bytes);
  }
  const auditPath = path.join(
    root,
    ...cliExperiment.review.audit.artifactPath.split("/"),
  );
  await mkdir(path.dirname(auditPath), { recursive: true });
  const auditArtifactBytes = Buffer.from(
    `${JSON.stringify(fixture.auditArtifact)}\n`,
  );
  await writeFile(auditPath, auditArtifactBytes);
  git("add", "evals");
  git("commit", "--quiet", "-m", "freeze A/B evidence");

  const args = {
    repositoryRoot: root,
    contractPath,
    contractBytes: Buffer.from(contractText),
    experiment: cliExperiment,
    policyArtifacts: fixture.policyArtifacts,
    policyArtifactBytes,
    codingArtifacts: fixture.codingArtifacts,
    codingArtifactBytes,
    auditArtifact: fixture.auditArtifact,
    auditArtifactBytes,
    modulePath: evaluatorPath,
  };
  const bindings = await verifyCliGitBindings(args);
  assert.equal(bindings.controlHead, controlHead);
  assert.equal(bindings.fixedHead, fixedHead);
  assert.equal(
    bindings.artifactSha256[fixture.policyArtifacts[0].runId],
    digest(policyArtifactBytes.get(fixture.policyArtifacts[0].runId)),
  );

  await writeFile(evaluatorPath, `${evaluatorText}// tampered\n`);
  await assert.rejects(
    verifyCliGitBindings(args),
    /running evaluator is not byte-identical/,
  );
  await writeFile(evaluatorPath, evaluatorText);
  await assert.rejects(
    verifyCliGitBindings({
      ...args,
      contractBytes: Buffer.from(`${contractText} `),
    }),
    /contract is not byte-identical/,
  );
  const changedControlBytes = new Map(policyArtifactBytes);
  changedControlBytes.set(
    fixture.policyArtifacts[0].runId,
    Buffer.concat([
      policyArtifactBytes.get(fixture.policyArtifacts[0].runId),
      Buffer.from(" "),
    ]),
  );
  await assert.rejects(
    verifyCliGitBindings({
      ...args,
      policyArtifactBytes: changedControlBytes,
    }),
    /Control raw bytes differ/,
  );
});
