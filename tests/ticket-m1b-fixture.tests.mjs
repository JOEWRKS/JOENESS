import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { inspectTicketFixture } from "../evals/fixtures/ticket-m1b/check.mjs";

function inspect(candidate, withEvidence = true) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "joeness-ticket-m1b-"));
  const candidatePath = path.join(root, "candidate.json");
  const evidencePath = path.join(root, "evidence.json");

  try {
    fs.writeFileSync(candidatePath, JSON.stringify(candidate));
    if (withEvidence) fs.writeFileSync(evidencePath, "{}\n");
    return inspectTicketFixture(candidatePath, evidencePath);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

test("normal candidate is accepted", () => {
  const result = inspect({ target: "READY", guard: "STABLE" });
  assert.equal(result.summary.state, "ACCEPTED");
  assert.deepEqual(result.criteria.map(({ verdict }) => verdict), ["PASS", "PASS", "PASS"]);
});

test("fault changes only the target criterion to REWORK", () => {
  const result = inspect({ target: "M1B_FAULT_SEED", guard: "STABLE" });
  assert.equal(result.summary.state, "REWORK");
  assert.deepEqual(result.summary.failedIds, ["target-ready"]);
});

test("missing evidence remains UNVERIFIED", () => {
  const result = inspect({ target: "READY", guard: "STABLE" }, false);
  assert.equal(result.summary.state, "UNVERIFIED");
  assert.deepEqual(result.summary.unverifiedRequiredIds, ["evidence-present"]);
});
