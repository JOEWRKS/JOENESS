# JOENESS Intent And Error Reporting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install a compact, tested JOENESS contract that separates blocking questions from explanatory prose and records meaningful error handling without adding routine ceremony.

**Architecture:** Replace only the manifest pointer with a new historical-preserving thin Core candidate that contains the existing retry boundary plus two conditional response contracts. Extend the existing explicit-only Handoff receipt rather than creating another skill or logger, then bind both files through the current manifest and installer tests.

**Tech Stack:** Markdown instruction artifacts, JSON manifest/evaluation evidence, Node.js `node:test`, Windows PowerShell installer contract tests.

## Global Constraints

- Preserve every historical candidate and experiment artifact; create new versioned artifacts instead of rewriting them.
- Keep the installed Core at or below 1,800 UTF-8 bytes.
- Do not increase question frequency: only current blocking decisions receive a separated final block, with at most three items.
- Do not record routine transient errors, expected TDD failures, simple syntax mistakes, or raw transcripts.
- Distinguish `fixed`, `mitigated`, `worked around`, and `unresolved`; a workaround is never a fix.
- Add no dependency, logger, service, new skill, Unity-specific rule, or broad Common Core activation.
- Keep Handoff explicit-only and preferably at or below 4 KiB.

---

### Task 1: Thin interaction Core and material failure receipt

**Files:**
- Create: `evals/candidates/interaction-safety-core-v1.md`
- Create: `evals/experiments/joeness-0.1-interaction-safety-core-v1.json`
- Modify: `skills/handoff/SKILL.md`
- Modify: `vendor/source-manifest.json`
- Modify: `.gitattributes`
- Modify: `tests/thin-hybrid-core.tests.mjs`
- Modify: `tests/design-vendor-integrity.tests.mjs`
- Modify: `tests/sync-harness.tests.ps1`
- Modify: `README.md`
- Modify: `evals/JOENESS-0.1-BETA-VALIDATION.md`

**Interfaces:**
- Consumes: `vendor/source-manifest.json#activeCommonCore`, the existing marker-based installer, the explicit-only `handoff` skill, and the retained retry-safety evaluation.
- Produces: one active Core pointer with exact SHA-256 identity and one updated Handoff file identity; no installer API changes.

- [ ] **Step 1: Record the control behavior**

Run five fresh-context samples without the new candidate. Score each output for: separated final decision block, no more than three current blockers, recommended default, waiting state, reversible assumptions not asked, cause certainty, response classification, verification, and residual risk. Preserve only compact scores and representative failures in the new experiment JSON.

- [ ] **Step 2: Write the failing behavioral and integrity tests**

Change `tests/thin-hybrid-core.tests.mjs` so it requires a new active candidate and evaluation artifact while confirming the retained retry decision is not rewritten. Require the candidate to express the two conditional response contracts and retain every retry branch. Change `tests/design-vendor-integrity.tests.mjs` and the README expectations in `tests/sync-harness.tests.ps1` to require the new pointer and Handoff receipt fields. Run the two Node test files and verify failure is caused by the missing candidate and unchanged Handoff contract.

- [ ] **Step 3: Implement the smallest instruction change**

Create a Core no larger than 1,800 UTF-8 bytes with this semantic content:

```markdown
# JOENESS Interaction Safety Core

Use only for a real user decision or after a failure; this does not add an approval or logging workflow.

- When progress depends on a user decision, put only current blocking choices in a final confirmation-needed block in the user's language, separate from explanation, with at most three items. Each item states the decision, recommended default, and what waits. Omit the block when none. State a material reversible assumption and continue instead of asking; do not re-ask a resolved choice without changed evidence.
- Preserve the retry classifications and limits from `retry-safety-core-v1.md` without weakening them.
- After a material failure changes the path, outcome, safety, verification, or handoff, give a compact receipt: observed evidence; cause confirmed, suspected, or unknown; response fixed, mitigated, worked around, or unresolved; verification; remaining risk. Link raw logs, omit routine transient/TDD/syntax failures, and never call a workaround a fix.
```

Write the retry bullets directly into the candidate so installation remains self-contained. Add the same material-failure fields to Handoff's existing evidence receipt and record any workaround removal condition. Update exact byte counts and SHA-256 values in the manifest, then update README and the evaluation ledger without claiming general quality or token improvement.

- [ ] **Step 4: Verify GREEN and run candidate behavior samples**

Run the two Node tests and verify all seven cases pass. Run five fresh-context samples with only the candidate guidance added and manually score every output against Step 1. If any sample buries a blocking question, asks a reversible default, exceeds three blockers, or calls a workaround fixed, revise only the responsible sentence and repeat the candidate samples.

- [ ] **Step 5: Verify installation and repository state**

Run `powershell.exe -NoProfile -ExecutionPolicy Bypass -File tests/sync-harness.tests.ps1` once and require exit code `0` with `PASS sync-harness contract`. Run `git diff --check`, parse the manifest JSON, verify file hashes, and confirm the worktree contains only planned changes.

- [ ] **Step 6: Commit**

```powershell
git add .gitattributes README.md evals/candidates/interaction-safety-core-v1.md evals/experiments/joeness-0.1-interaction-safety-core-v1.json evals/JOENESS-0.1-BETA-VALIDATION.md skills/handoff/SKILL.md tests/thin-hybrid-core.tests.mjs tests/design-vendor-integrity.tests.mjs tests/sync-harness.tests.ps1 vendor/source-manifest.json docs/superpowers/specs/2026-08-04-intent-error-reporting-design.md docs/superpowers/plans/2026-08-04-intent-error-reporting.md
git commit -m "feat: add intent and error reporting core"
```
