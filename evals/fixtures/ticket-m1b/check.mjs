import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { summarizeTicketVerdicts } from "../../support/ticket-verdict.mjs";

export function inspectTicketFixture(candidatePath, evidencePath) {
  const candidate = JSON.parse(fs.readFileSync(candidatePath, "utf8"));
  const criteria = [
    {
      id: "target-ready",
      required: true,
      verdict: candidate.target === "READY" ? "PASS" : "FAIL",
    },
    {
      id: "guard-stable",
      required: true,
      verdict: candidate.guard === "STABLE" ? "PASS" : "FAIL",
    },
    {
      id: "evidence-present",
      required: true,
      verdict: fs.existsSync(evidencePath) ? "PASS" : "UNVERIFIED",
    },
  ];

  return { criteria, summary: summarizeTicketVerdicts(criteria) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [, , candidatePath, evidencePath] = process.argv;
  if (!candidatePath || !evidencePath) {
    throw new Error("usage: node check.mjs <candidate.json> <evidence.json>");
  }
  process.stdout.write(`${JSON.stringify(inspectTicketFixture(candidatePath, evidencePath), null, 2)}\n`);
}
