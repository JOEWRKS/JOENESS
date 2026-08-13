import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("the interaction safety core stays silent on clean success without rewriting retry evidence", async () => {
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
  assert.equal(manifest.activeCommonCore.path, "evals/candidates/interaction-safety-core-v7.md");

  const core = await readFile(path.join(root, manifest.activeCommonCore.path), "utf8");
  const visualSkill = await readFile(path.join(root, "skills", "visual-check", "SKILL.md"), "utf8");
  const visualEvidence = await readFile(path.join(root, "skills", "visual-check", "references", "durable-evidence.md"), "utf8");
  const specSkill = await readFile(path.join(root, "skills", "spec", "SKILL.md"), "utf8");
  const disabledCore = await readFile(path.join(root, "evals", "candidates", "no-common-core.md"), "utf8");
  const projectAgents = await readFile(path.join(root, "AGENTS.md"), "utf8");
  assert.ok(Buffer.byteLength(core, "utf8") <= 3072, "active JOENESS Core stays within 3 KiB");
  assert.equal(createHash("sha256").update(core).digest("hex"), manifest.activeCommonCore.sha256);
  assert.match(core, /^# JOENESS Core$/m);
  assert.match(core, /visual(?: output)? create\/change:\$visual-check pre-completion/is);
  assert.match(visualSkill, /acceptance depends on appearance, layout, motion, or target rendering.*do not use.*plans.*neither produces nor changes.*visual artifact/is);
  assert.match(visualEvidence, /exact produced artifact and version.*exact current build/is);
  assert.match(core, /persistent spec create\/material revision:\$spec post-final-write/is);
  assert.match(specSkill, /inspect.*exact current artifact.*after.*final write.*unreadable.*unverified/is);
  assert.match(specSkill, /do not use.*read-only review.*unchanged.*typo.*format.*link-only/is);
  assert.match(core, /user\/project owns workflow\/report\/approval\/tool/is);
  assert.match(core, /material unresolved blocking\/outcome-changing choice.*user\/project format.*user-language question.*max3 choices.*recommendation.*wait.*reversible\+authorized/is);
  assert.match(core, /crash.*user crash\/relaunch\/stop.*contain task-owned PID.*restore\+readback temp state.*stop\/no relaunch/is);
  assert.match(core, /same command\/mechanism retry=0.*new PID=new attempt.*user signal outranks liveness/is);
  assert.match(core, /deterministic.*read exact error.*(?:1|one) evidence-(?:driven|based) retry after cause[- ]fix\/method[- ]change/is);
  assert.match(core, /(?:transient.*idempotent.*(?:one|1)|idempotent transient.*once)/is);
  assert.match(core, /writes classify by target effect.*local (?:project )?dependency install alone isn't shared\/external/is);
  assert.match(core, /shared\/external unclear.*inspect state\/same-key idempotent recovery.*else unknown/is);
  assert.match(core, /intended temp project\/shared\/external state.*exact pre-state.*(?:all|every) exits? restore\+readback.*unknown\/unverified=unresolved\+stop writes/is);
  assert.match(core, /fresh authoritative invocation-bound result\/exit ends bounded op.*content decides/is);
  assert.match(core, /generic liveness=cleanup.*(?:never|not) wait\/relaunch evidence/is);
  assert.match(core, /filename\/narration\/liveness!=success/is);
  assert.match(core, /evidence=exact artifact\/version\+target\/state\+observed property/is);
  assert.match(core, /fixed needs original-failure recheck.*verified layer\+missing check/is);
  assert.match(core, /GUI\/tool need:project decides.*user(?:-visible)? goal.*primary\+(?:1|one) materially different fallback.*helper\/PID\/delegation.*don't reset.*both fail=unverified\/blocked.*new evidence\/user decision/is);
  assert.match(core, /WER\/dump needs crash signal/is);
  assert.doesNotMatch(core, /unblocked end.*one realistic next step/is);
  assert.match(core, /clean:result only.*no Core next step/is);
  assert.match(core, /track:goal\/criteria.*method\/change.*outcome.*handling.*result\/checks.*limit/is);
  assert.match(core, /state:blocked by blocker.*else partial if required work\/check remains.*else complete/is);
  assert.match(core, /user:outcome\+verification first.*only relevant facts.*show workaround\/unverified\/unresolved\/boundary/is);
  assert.match(core, /user-facing progress.*explanations.*opinions.*questions.*non-specialist.*understand/is);
  assert.match(core, /plain words.*explain needed technical terms.*first used/is);
  assert.match(core, /internal workflow labels.*agent jargon.*awkward literal translations.*ordinary words/is);
  assert.match(core, /internal agent coordination is exempt.*explicit user-requested format or technical level overrides/is);
  assert.match(core, /cause=evidenced\+relevant/is);
  assert.match(core, /no fixed labels\/lines\/empties\/filler work/is);
  assert.match(core, /workaround.*(?:!=|not).*fix/is);
  assert.doesNotMatch(core, /exactly (?:five|5) lines/is);
  assert.doesNotMatch(core, /^  (?:Evidence|Cause|Handling|Verification|Remaining risk):/m);
  assert.doesNotMatch(core, /failure\/workaround receipt|evidence,cause confidence,handling,verification,risk/is);
  assert.match(core, /kill(?::| only )launch\/post-baseline record (?:must match|matching) start time\+resolved path\+command\+lineage/is);
  assert.match(core, /name\/port(?: alone)? never.*ambiguous.*leave\/report/is);
  assert.doesNotMatch(core, /every external GUI launch must record/i);
  assert.doesNotMatch(core, /(?:always|every task|all operations).{0,80}(?:process inventory|process logging|launch logging)/is);
  assert.doesNotMatch(core, /mandatory WER.*(?:launch|attempt)/i);
  assert.equal(disabledCore, "\n");
  assert.notEqual(projectAgents, core);
  assert.doesNotMatch(projectAgents, /Treat an explicit request.*closed contract/is);
  assert.match(projectAgents, /rejected broad.*always-on Core.*disabled.*preserved.*evidence/is);
  assert.match(projectAgents, /thin Interaction Safety Core.*activeCommonCore.*manifest/is);
  assert.doesNotMatch(projectAgents, /^# JOENESS Interaction Safety Core$/m);
  const coreV4 = await readFile(
    path.join(root, "evals", "candidates", "interaction-safety-core-v4.md"),
    "utf8",
  );
  assert.equal(Buffer.byteLength(coreV4, "utf8"), 2047);
  assert.equal(
    createHash("sha256").update(coreV4).digest("hex"),
    "5efd93bc041d328b41a9424b9f5593d90da26fe8263cf4a502894d4fdfc2926b",
  );
  const coreV5 = await readFile(
    path.join(root, "evals", "candidates", "interaction-safety-core-v5.md"),
    "utf8",
  );
  assert.equal(Buffer.byteLength(coreV5, "utf8"), 2040);
  assert.equal(
    createHash("sha256").update(coreV5).digest("hex"),
    "160a10f476d2503054e02697c8588a2ae58155b91adb17387763ae0e21e515c3",
  );
  const coreV6 = await readFile(
    path.join(root, "evals", "candidates", "interaction-safety-core-v6.md"),
    "utf8",
  );
  assert.equal(Buffer.byteLength(coreV6, "utf8"), 2047);
  assert.equal(
    createHash("sha256").update(coreV6).digest("hex"),
    "897495e89128194afe695ff55e537c5e7ef52e6778bf260b10c9b6ab35857ceb",
  );
  const coreV2 = await readFile(
    path.join(root, "evals", "candidates", "interaction-safety-core-v2.md"),
    "utf8",
  );
  assert.equal(
    createHash("sha256").update(coreV2).digest("hex"),
    "3f10f1ba56864b4ba3bf1dd2b9f3200281749280a09375b2d843d1d0838049a5",
  );
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
