import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("always-on Common Core stays disabled after the final Lean decision", async () => {
  const manifest = JSON.parse(
    await readFile(path.join(root, "vendor", "source-manifest.json"), "utf8"),
  );
  const decision = JSON.parse(
    await readFile(path.join(root, "evals", "experiments", "common-core-final-decision-v1.json"), "utf8"),
  );
  assert.equal(manifest.activeCommonCore.path, "evals/candidates/no-common-core.md");

  const core = await readFile(path.join(root, manifest.activeCommonCore.path), "utf8");
  const projectAgents = await readFile(path.join(root, "AGENTS.md"), "utf8");
  assert.equal(core, "\n");
  assert.notEqual(projectAgents, core);
  assert.doesNotMatch(projectAgents, /Treat an explicit request.*closed contract/is);
  assert.equal(decision.decision.activeCommonCore, "none");
  assert.equal(decision.decision.promoteLeanCandidate, false);
  assert.equal(decision.decision.allowOneRevision, false);
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
