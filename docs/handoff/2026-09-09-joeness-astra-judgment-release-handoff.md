# JOENESS 0.2 Astra Judgment — Release Handoff

**Date:** 2026-09-09  
**Release identity:** `0.2-astra-judgment`  
**Target:** `gpt-6-astra / xhigh`  
**PR:** #13 — `JOENESS 0.2 Astra Judgment`

## 1. Release decision

JOENESS 0.2 reopens the Astra runtime for one observed cross-domain failure only: an agent can treat user pushback, doubt, concern, or preference as an automatic correction and reverse a previously reasoned judgment without new evidence or a new authority decision.

0.2 does **not** restore the former broad JOENESS harness. The active behavioral payload is exactly one source file:

- `astra-judgment-core.md`
- bytes: `877`
- SHA-256: `f360b48be1b4143035f61fa20149a3249c60dea2e7f12cffa8bf1e8918f4f6a9`

The rule requires Independent Judgment:

- user questions/challenges/concerns/preferences are evidence to evaluate, not automatic corrections;
- prior conclusions are re-evaluated against goal, evidence, constraints, authority, and trade-offs;
- explicit user decisions remain authoritative where the user owns the decision;
- the agent does not optimize for agreement and should surface material downsides, contradictions, invalid assumptions, or unnecessary work.

## 2. Active distribution surface

`vendor/source-manifest.json` is the machine-readable release identity.

Expected active values:

- release version: `0.2-astra-judgment`
- model: `gpt-6-astra`
- reasoning effort: `xhigh`
- runtime mode: `common-core`
- active Common Core: `astra-judgment-core.md`
- managed runtime whole-file payload: `0`
- public skills: `0`
- default vendors: `0`
- plugin routing: `null`

Historical `common-core.md`, the 1,690-byte Lean Kernel, public skills, design vendors, JOEFLOW, JOEDESIGN, and other domain workflows remain inactive evidence/reference material.

## 3. User lifecycle

Canonical Windows commands:

```powershell
powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
powershell.exe -NoProfile -File .\JOENESS.ps1 -Apply
powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
powershell.exe -NoProfile -File .\JOENESS.ps1 -Remove
```

Expected clean lifecycle:

1. clean `Check` -> `ready`, `changesRequired: true`, no managed write;
2. explicit `Apply` -> `current`;
3. post-install `Check` -> `current`, `changesRequired: false`;
4. repeat `Apply` -> idempotent `current`, no ceremony backup;
5. explicit `Remove` -> `removed`, exact pre-install `AGENTS.md` user bytes restored;
6. post-remove `Check` -> `ready`.

Unowned markers, managed-block drift, forged ownership, uncertain state, or unsupported historical identities remain fail-closed.

## 4. GPT-5.6 Control compatibility

Exact historical Control compatibility remains preserved and is not folded into automatic migration.

Pinned Control identity:

- commit: `80c79e9f4be91d730b1b3cdc62d7bf51508895e8`
- distribution manifest SHA-256: `f7866fb42f3336e0bd82f01e0f3940ab8b6a5d5b55e4677b9306e461be3c0158`
- active Core source: `evals/candidates/interaction-safety-core-v8.md`
- active Core SHA-256: `41b3f8435c6077a9289e0c9d3315aa00d68a96e2e9add7168de6bb42f9730aea`
- whole-file count: `64`
- selection SHA-256: `f4a3c7fbacd8d6f8cfb1b958c094e73f5ba739a1bb633d3fff5614e34b8a7587`

Behavior:

- exact Control `Check` -> `legacy`;
- `Apply` over exact Control -> remains `legacy`, no implicit migration;
- explicit `Remove` -> safe removal only when pinned ownership/source identity is exact;
- after removal -> 0.2 is `ready` but is not silently installed;
- drifted/forged/partial historical state -> `blocked`.

## 5. Historical-integrity blocker and resolution

During release verification, the historical-local test

`paired v1 artifacts and blocked controls remain valid after recovery`

was rejected by the current strengthened collector with:

`reviewed pass/fail case lacks complete evidence`

The same failure was reproduced on the frozen pre-0.2 base, proving that it was not introduced by Astra Judgment.

Resolution:

- historical evaluation artifacts were not rewritten;
- the current collector validator was not weakened;
- `scripts/run-node-test-group.mjs` now records this one exact historical-local case as an expected failure and requires the exact output marker;
- missing, renamed, duplicate, skipped, TODO, wrong-status, or wrong-marker cases remain blocking.

This preserves the historical fact while keeping current validation strict.

## 6. PowerShell cross-runtime defect found during verification

The retained exact-Control rollback suite passed under Windows PowerShell but failed inside the canonical PowerShell 7 test process with:

`Unsupported state schemaVersion`

Root cause:

- Windows PowerShell `ConvertFrom-Json` represented JSON `schemaVersion: 2` as `Int32`;
- PowerShell 7 could represent the same JSON integer as `Int64`;
- the validator incorrectly required `[int]` specifically.

The production guard was minimally corrected to accept only `Int32` or `Int64` integer values `1` or `2`. Strings, floating-point values, unsupported values, and other types remain rejected.

Fix commit:

`a9779ae53d4c3e800079f0d3a2c800dedf778102` — `fix: accept JSON integer schema across PowerShell runtimes`

Temporary diagnostic workflows and RED/probe artifacts used to isolate this issue were removed before the release-ready diff.

## 7. Verification evidence

Clean release-ready branch baseline:

- branch: `codex/joeness-v0.2-astra-judgment`
- verified head: `7d30b2bc12ab09fbca3e3e24967157c21ecde7f7`
- verified tree: `e5d393cbd79b056de87258ef337c4bec0f422b16`
- Windows deterministic release gate run: `34317708016`
- job: `102357307887`
- conclusion: `success`

That clean gate passed all of the following:

- full-history checkout/materialization;
- pinned Node/Python toolchain verification;
- Node taxonomy coverage;
- current-release Node tests;
- historical-integrity Node tests;
- Astra Judgment lifecycle tests;
- retained sync-harness fail-closed tests;
- project setup deterministic tests;
- P0 evaluation contract tests;
- vendor Python unit tests;
- `git diff --check`;
- canonical CI materialization cleanup.

Earlier observed counts after the historical-runner correction were:

- current-release Node tests: `189 pass / 0 fail`;
- historical-integrity Node tests: `27 pass / 0 fail`;
- taxonomy: `33` files classified (`6 current-release / 4 historical-integrity / 23 historical-replay`).

The final release branch must still receive a fresh deterministic gate after this handoff/ledger finalization before merge. A release-complete claim is allowed only after that final head is green and `main` readback succeeds.

## 8. Behavioral evidence boundary

The behavioral comparison artifact is:

`evals/experiments/joeness-astra-independent-judgment-ab-plan-v1.json`

Current state:

- status: `NOT-RUN`
- results: `null`
- conclusion: `null`

Repository lifecycle/installer verification proves that the 0.2 distribution is internally consistent and safely managed. It does **not** prove that Independent Judgment is behaviorally superior to Bare Astra. Behavioral superiority remains a separate experiment claim.

## 9. Release boundary

This release is complete only when:

1. the final branch head (including release documentation) passes the deterministic Windows gate;
2. PR #13 is no longer draft and is merged through the repository-supported path;
3. `main` is read back and contains the exact `0.2-astra-judgment` manifest and active Core identity;
4. the post-merge main CI, if triggered, is green before the final completion report.

Do not create or imply a new public tag solely from the manifest version unless a separate release/tag decision authorizes it.
