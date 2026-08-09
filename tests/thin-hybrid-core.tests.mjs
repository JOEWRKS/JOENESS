import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("the interaction safety core adds conditional decisions and failure receipts without rewriting retry evidence", async () => {
  const manifest = JSON.parse(
    await readFile(path.join(root, "vendor", "source-manifest.json"), "utf8"),
  );
  const priorDecision = JSON.parse(
    await readFile(path.join(root, "evals", "experiments", "common-core-final-decision-v1.json"), "utf8"),
  );
  const retryDecision = JSON.parse(
    await readFile(path.join(root, "evals", "experiments", "joeness-0.1-retry-safety-core-v1.json"), "utf8"),
  );
  const interactionDecision = JSON.parse(
    await readFile(path.join(root, "evals", "experiments", "joeness-0.1-interaction-safety-core-v1.json"), "utf8"),
  );
  assert.equal(manifest.activeCommonCore.path, "evals/candidates/interaction-safety-core-v2.md");

  const core = await readFile(path.join(root, manifest.activeCommonCore.path), "utf8");
  const disabledCore = await readFile(path.join(root, "evals", "candidates", "no-common-core.md"), "utf8");
  const projectAgents = await readFile(path.join(root, "AGENTS.md"), "utf8");
  const readme = await readFile(path.join(root, "README.md"), "utf8");
  assert.ok(Buffer.byteLength(core, "utf8") <= 2048, "safety core must stay at or below 2 KiB");
  assert.match(core, /native crash.*same (?:command|mechanism).*automatic retr(?:y|ies).*0/is);
  assert.match(core, /deterministic.*(?:cause|error).*(?:one|1).*evidence-driven/is);
  assert.match(core, /transient.*idempotent.*(?:one|1)/is);
  assert.match(core, /build\/test.*deploy folder.*shared target.*external runtime.*external\/shared write/is);
  assert.match(core, /may have applied.*inspect state.*stable idempotency key.*unknown.*stop writes/is);
  assert.match(core, /primary approach.*one materially different fallback.*whole verification goal/is);
  assert.match(core, /replacement PID.*new attempt/is);
  assert.match(core, /filenames.*narration.*aren't success/is);
  assert.match(core, /evidence supports only.*exact artifact\/version.*named target\/state.*observed property/is);
  assert.match(core, /directly rechecking the original failure mode.*verified layer.*missing check/is);
  assert.match(core, /progress needs a user decision.*valid unresolved choices.*separate confirmation block.*user's language.*max 3/is);
  assert.match(core, /don't copy external menus verbatim/is);
  assert.match(core, /recommended default.*what waits/is);
  assert.match(core, /omit if none.*continue.*material reversible assumption.*don't re-ask resolved choices absent new evidence/is);
  assert.match(core, /task end.*no blocker.*one realistic next step/is);
  assert.match(core, /future external action.*(?:stated|state).*(?:boundary|not a question).*until.*current/is);
  assert.match(core, /material failure.*carried-forward workaround.*receipt/is);
  assert.match(core, /exactly (?:five|5) lines.*labels\/statuses.*user language.*evidence.*cause.*handling.*verification.*remaining risk/is);
  assert.match(core, /labels\/statuses in user language/is);
  assert.doesNotMatch(core, /^  (?:Evidence|Cause|Handling|Verification|Remaining risk):/m);
  assert.match(core, /omit routine errors\/log dumps.*link raw logs/is);
  assert.match(core, /never call (?:a )?workaround a fix/is);
  assert.doesNotMatch(core, /every external GUI launch must record/i);
  assert.doesNotMatch(core, /mandatory WER.*(?:launch|attempt)/i);
  assert.equal(disabledCore, "\n");
  assert.notEqual(projectAgents, core);
  assert.doesNotMatch(projectAgents, /Treat an explicit request.*closed contract/is);
  assert.match(projectAgents, /rejected broad.*always-on Core.*disabled.*preserved.*evidence/is);
  assert.match(projectAgents, /thin Interaction Safety Core.*activeCommonCore.*manifest/is);
  assert.doesNotMatch(projectAgents, /^# JOENESS Interaction Safety Core$/m);
  assert.match(readme, /진행에 사용자 결정이 필요할 때.*현재 차단 선택.*최종 확인 블록.*권장 기본값.*대기 작업/s);
  assert.match(readme, /중대한 실패.*이어받은 우회책.*증거.*원인.*처리.*검증.*남은 위험/s);
  assert.match(readme, /user decision.*valid unresolved choices.*user's language.*recommended default.*what waits.*external skill menus.*not copied verbatim.*no blocking choice.*one realistic recommended next step/is);
  assert.match(readme, /material failures.*carried-forward workarounds.*user's language.*labels.*status values/is);
  assert.doesNotMatch(readme, /activates only after failure/i);
  const coreV1 = await readFile(
    path.join(root, "evals", "candidates", "interaction-safety-core-v1.md"),
    "utf8",
  );
  assert.equal(
    createHash("sha256").update(coreV1).digest("hex"),
    "e7a3c02d4c147eaadde2c00a0452c7de21b3e0f51fa02cf7bd7085c43d97ac4d",
  );
  assert.equal(priorDecision.decision.activeCommonCore, "none");
  assert.equal(priorDecision.decision.promoteLeanCandidate, false);
  assert.equal(priorDecision.decision.allowOneRevision, false);
  assert.equal(retryDecision.supersedes, "common-core-final-decision-v1 only for the isolated retry boundary");
  assert.equal(retryDecision.decision.activeCommonCore, "retry-safety-core-v1");
  assert.equal(retryDecision.decision.sameMechanismNativeCrashAutomaticRetries, 0);
  assert.equal(retryDecision.decision.normalDeterministicEvidenceDrivenRetries, 1);
  assert.equal(retryDecision.decision.transientIdempotentRetries, 1);
  assert.equal(retryDecision.decision.unknownNonIdempotentWriteRetriesBeforeReadback, 0);
  assert.equal(interactionDecision.schemaVersion, 1);
  assert.equal(interactionDecision.control.sampleCount, 5);
  assert.equal(interactionDecision.candidateV1.sampleCount, 5);
  assert.equal(interactionDecision.candidateV1.scores.onlyCurrentChoices, "1/5");
  assert.equal(interactionDecision.candidateV1.scores.workaroundExplicitlyClassified, "0/5");
  assert.equal(interactionDecision.revisionV1.sampleCount, 5);
  assert.equal(interactionDecision.revisionV1.scores.separatedFinalDecisionBlock, "5/5");
  assert.equal(interactionDecision.revisionV1.scores.currentBlockersAtMostThree, "5/5");
  assert.equal(interactionDecision.revisionV1.scores.futureExternalActionIsBoundary, "5/5");
  assert.equal(interactionDecision.revisionV1.scores.recommendedDefaultAndWaitingState, "5/5");
  assert.equal(interactionDecision.revisionV1.scores.workaroundExplicitlyClassified, "0/5");
  assert.equal(interactionDecision.errorReportControl.sampleCount, 5);
  assert.equal(interactionDecision.errorReportControl.scores.workaroundExplicitlyClassified, "0/5");
  assert.equal(interactionDecision.revisionV2.sampleCount, 5);
  assert.equal(interactionDecision.revisionV2.scores.receiptPresent, "4/5");
  assert.equal(interactionDecision.revisionV2.scores.workaroundExplicitlyClassified, "3/5");
  assert.equal(interactionDecision.revisionV3.sampleCount, 5);
  assert.equal(interactionDecision.revisionV3.scores.exactReceiptFields, "5/5");
  assert.equal(interactionDecision.revisionV3.scores.handlingWorkedAround, "5/5");
  assert.equal(interactionDecision.revisionV3.scores.unverifiedStoreBuildPreserved, "5/5");
  assert.equal(interactionDecision.revisionV3.scores.falseFixedClaimAvoided, "5/5");
  assert.equal(interactionDecision.revisionV3.result, "pass");
  assert.equal(interactionDecision.excludedAttempts.leakedTargetTerms, 1);
  assert.equal(interactionDecision.excludedAttempts.interruptedSiblings, 2);
  for (const name of ["candidateV1", "revisionV1", "revisionV2", "errorReportControl", "revisionV3", "control"]) {
    assert.equal("source" in interactionDecision[name], false, `${name} must not imply a retained raw source file`);
    assert.equal(typeof interactionDecision[name].sourceDescription, "string");
  }
  assert.match(
    interactionDecision.limitations.behaviorEvidenceRetention,
    /controller-observed scores.*representative failures.*Git.*SHA-256.*raw model outputs.*run IDs.*not retained.*summary-only.*not independently replayable/is,
  );
  const historicalBindings = {
    candidateV1: {
      path: "evals/candidates/interaction-safety-core-v1.md",
      gitCommit: "4ae9d29243ce49ffa8b62534adf879fd4d4ebd67",
      sha256: "95566ab5c40164cdcecbe42d5fa00ac67b52da5711c250d2f31e54126920ec1e",
    },
    revisionV1: {
      path: "evals/candidates/interaction-safety-core-v1.md",
      gitCommit: "a77565d88b8afd3dee2247601a7ab0027971d82e",
      sha256: "6e83d9142b9118d5cabcff8dd1ff65defcc23f5226347779453b180fafe81c67",
    },
    revisionV2: {
      path: "evals/candidates/interaction-safety-core-v1.md",
      gitCommit: "637aa8db2afe5153928856aa2940a429d7e66a32",
      sha256: "9979420a69eef8635c12b5550f76c9f40a5a21095986eaad2f04e9ea451c7b6a",
    },
    revisionV3: {
      path: "evals/candidates/interaction-safety-core-v1.md",
      gitCommit: "06157c81c0ea978845a811d6c9c374835101dd36",
      sha256: "bcc4b92533f5e6ac6f06891293eadfec1d692db66019c2245795e47001a70bba",
    },
  };
  for (const [name, expected] of Object.entries(historicalBindings)) {
    const { path: candidatePath, gitCommit, sha256 } = interactionDecision[name];
    assert.deepEqual({ path: candidatePath, gitCommit, sha256 }, expected);
  }

  const betaLedger = await readFile(path.join(root, "evals", "JOENESS-0.1-BETA-VALIDATION.md"), "utf8");
  assert.match(betaLedger, /Revision v1 question evidence:.*separated.*current-choice.*future-boundary.*recommended-default.*waiting-state.*5\/5/is);
  assert.match(betaLedger, /Revision v3 exact error receipt evidence:.*5\/5/is);
  assert.match(betaLedger, /token measurement.*unavailable/is);
  assert.match(betaLedger, /no general quality or token-improvement claim/is);
  assert.match(betaLedger, /Summary evidence is retained.*raw model outputs.*run IDs.*not retained.*summary-only.*not independently replayable/is);
  assert.doesNotMatch(betaLedger, /Fresh-context candidate sampling.*unavailable/is);
});

test("design references are selected independently and cannot expand scope", async () => {
  const skill = await readFile(
    path.join(root, "skills", "design", "SKILL.md"),
    "utf8",
  );

  assert.match(skill, /UI UX Pro Max.*unspecified design direction|unspecified design direction.*UI UX Pro Max/is);
  assert.match(skill, /Apple Design.*motion.*gesture.*material.*typography/is);
  assert.match(skill, /reference.*cannot add.*acceptance.*definition of done/is);
  assert.doesNotMatch(skill, /both local sources/i);
});
