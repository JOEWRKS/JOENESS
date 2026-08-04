import assert from "node:assert/strict";
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
  assert.equal(manifest.activeCommonCore.path, "evals/candidates/interaction-safety-core-v1.md");

  const core = await readFile(path.join(root, manifest.activeCommonCore.path), "utf8");
  const disabledCore = await readFile(path.join(root, "evals", "candidates", "no-common-core.md"), "utf8");
  const projectAgents = await readFile(path.join(root, "AGENTS.md"), "utf8");
  assert.ok(Buffer.byteLength(core, "utf8") <= 1800, "safety core must stay smaller than 1.8 KiB");
  assert.match(core, /native crash.*same (?:command|mechanism).*automatic retr(?:y|ies).*0/is);
  assert.match(core, /deterministic.*(?:cause|error).*(?:one|1).*evidence-driven/is);
  assert.match(core, /transient.*idempotent.*(?:one|1)/is);
  assert.match(core, /external.*write.*inspect.*state.*stable idempotency key/is);
  assert.match(core, /primary approach.*one materially different fallback.*whole verification goal/is);
  assert.match(core, /replacement PID.*new attempt/is);
  assert.match(core, /filenames.*narration.*not success/is);
  assert.match(core, /progress depends on a user decision.*final confirmation-needed block.*(?:at most|max) three/is);
  assert.match(core, /recommended default.*what waits/is);
  assert.match(core, /material reversible assumption.*continue.*do not re-ask/is);
  assert.match(core, /material failure.*observed evidence.*cause.*confirmed.*suspected.*unknown/is);
  assert.match(core, /response.*fixed.*mitigated.*worked around.*unresolved/is);
  assert.match(core, /remaining risk.*raw logs.*routine transient.*TDD.*syntax/is);
  assert.match(core, /never call a workaround a fix/is);
  assert.doesNotMatch(core, /every external GUI launch must record/i);
  assert.doesNotMatch(core, /mandatory WER.*(?:launch|attempt)/i);
  assert.equal(disabledCore, "\n");
  assert.notEqual(projectAgents, core);
  assert.doesNotMatch(projectAgents, /Treat an explicit request.*closed contract/is);
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
  assert.equal(interactionDecision.candidate.sampleCount, 0);
  assert.equal(interactionDecision.limitations.freshContextSamples, "unavailable");
  assert.match(interactionDecision.limitations.reason, /fresh-context/i);
});

test("design references are selected independently and cannot expand scope", async () => {
  const skill = await readFile(
    path.join(root, "skills", "joewrks-design-frontend", "SKILL.md"),
    "utf8",
  );

  assert.match(skill, /UI UX Pro Max.*unspecified design direction|unspecified design direction.*UI UX Pro Max/is);
  assert.match(skill, /Apple Design.*motion.*gesture.*material.*typography/is);
  assert.match(skill, /reference.*cannot add.*acceptance.*definition of done/is);
  assert.doesNotMatch(skill, /both local sources/i);
});
