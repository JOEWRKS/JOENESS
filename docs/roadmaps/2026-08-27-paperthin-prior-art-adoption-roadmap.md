# JOENESS × Paperthin Prior-Art Adoption Roadmap

- Status: planning / `P0+P1+P2+P3+P4 COMPLETE` / `P5 BLOCKED` / sole candidate `PARKED` / no adoption implemented
- JOENESS baseline: `main@1d867465cc2f99788a0b478d5fba4eb090fcde83`
- Active Core baseline: `interaction-safety-core-v8.md` — `2,934 bytes` / SHA-256 `41b3f8435c6077a9289e0c9d3315aa00d68a96e2e9add7168de6bb42f9730aea`
- Public skills baseline: `project`, `ticket`, `design`, `visual-check`, `spec`, `handoff`
- Paperthin research baseline: `LilMGenius/paperthin@3bca079a51bcfff5dafb53d1d7f9f523d66ee317`
- Paperthin license: MIT

## 1. Goal

Use Paperthin and real-project incidents as prior art to identify low-level failure patterns JOENESS does not already cover, then adopt only the smallest change that earns permanent complexity through real evidence.

A no-change result is valid success. The controlling question remains:

> Which failure reflex is actually missing from JOENESS, where is the lowest-cost layer that can express it, and what real evidence proves the change is worth permanent complexity?

## 2. Hard boundaries

Until a future adoption gate explicitly passes:

- do not modify Core v8;
- do not add/remove public skills;
- do not change installer/manifest behavior merely to force a candidate through validation;
- do not rewrite M2/M3/M4/M5/M6 evidence classifications or `TASKS.md` from this research branch;
- do not install Paperthin into the active environment;
- do not import Paperthin's full catalog, `.re0/` topology, `sip`, automatic loops, or external-write behavior;
- do not create synthetic eval volume to justify a candidate;
- do not treat same-model/multi-agent agreement as proof;
- do not turn one RVR project, even with multiple incident contexts, directly into a Core rule;
- do not rewrite historical evaluation plans/hashes to make a new active skill identity appear compatible;
- do not interpret Dororong research-stage completion as Dororong product completion.

## 3. Evidence surfaces

Keep one document per evidence purpose:

1. P1 source comparison: [`2026-08-27-paperthin-stage-p1-mechanism-gap-matrix.md`](2026-08-27-paperthin-stage-p1-mechanism-gap-matrix.md)
2. RVR combined incident intake: [`2026-08-27-paperthin-p3-rvr-evidence-intake.md`](2026-08-27-paperthin-p3-rvr-evidence-intake.md)
3. P2 closeout + P3 fit decision: [`2026-08-28-paperthin-stage-p2-p3-evidence-fit.md`](2026-08-28-paperthin-stage-p2-p3-evidence-fit.md)
4. P4/P5 visual candidate decision: [`2026-08-28-paperthin-stage-p4-p5-visual-check-decision.md`](2026-08-28-paperthin-stage-p4-p5-visual-check-decision.md)
5. Independent Dororong checkpoint: `JOEWRKS/Doropet`, Draft PR [`#1`](https://github.com/JOEWRKS/Doropet/pull/1), head `cc04e67e8cc330d9afe0af607b66188527a42cd4`

The RVR intake still leaves source-report repo/commit/path, incident-time JOENESS identity, and Open Design plugin/runtime/log identity partly `UNVERIFIED`. Those boundaries remain in force.

## 4. Completed stages

### P0 — Freeze and bind baselines — COMPLETE

- exact JOENESS/Paperthin baselines pinned;
- Core/public skills unchanged;
- existing release/validation classifications unchanged.

### P1 — Prior-art mechanism extraction — COMPLETE

Historical source-level classifications:

| Mechanism | P1 classification |
|---|---|
| `readchk` | `GAP_CANDIDATE` |
| `shower` | `GAP_CANDIDATE` |
| `mandela` | `GAP_CANDIDATE` |
| `re0-memo` | `ALREADY_COVERED` |
| `catchup` | `GAP_CANDIDATE` |

These describe source-contract overlap only; they are not adoption approvals.

### P2 — Dororong live pilot — COMPLETE

Research-stage result: `P2 COMPLETE`; product result: **Dororong M1 remains `PARTIAL`**.

Verified checkpoint boundary:

- body-outline scope `PASS`;
- attempt-8 visual asset identity `PRESERVED`;
- exact attempt-8 → checkpoint runtime-binary provenance `UNVERIFIED`;
- closed-eye/state-animation/remaining interaction/non-interference acceptance `UNVERIFIED`;
- Draft PR open, unmerged, explicitly not an M1-completion PR.

Observed positive JOENESS behavior:

- GUI automation failure stayed separate from product verdict;
- actual Windows evidence overruled narrower static success;
- stage-aware feedback preserved current PASS while deferring later improvements;
- partial/unverified layers stayed partial/unverified;
- binary hash mismatch stopped downstream work and one bounded reconstruction ended with unresolved DLL provenance rather than speculation;
- no Paperthin/RVR-derived rule was injected mid-pilot.

### P3 — Evidence-to-pattern fit — COMPLETE

Paperthin-named mechanisms after real-use fit:

| Mechanism | P3 result | Disposition |
|---|---|---|
| `readchk` | `REAL_SINGLE_PROJECT_GAP` | `PARK` |
| `shower` | `THEORETICAL_ONLY` | `PARK` |
| `mandela` | `REAL_SINGLE_PROJECT_GAP` | no standalone skill; bounded validation-independence concern only |
| `re0-memo` one-off→rule guard | `ALREADY_COVERED_IN_PRACTICE` | no change |
| `re0-memo` lesson→next-execution transfer | `REAL_SINGLE_PROJECT_GAP` | `PARK` |
| `catchup` | `THEORETICAL_ONLY` | `PARK` |

RVR-specific seams:

- **A+B visual acceptance frame + impacted-invariant recheck:** `REAL_SINGLE_PROJECT_GAP`; sole P4 survivor.
- **C+D tool backing-runtime/effect identity + delegated side-effect authority:** `REAL_SINGLE_PROJECT_GAP` with incomplete identity; parked in M4.
- **E procedure-label success ≠ actual effect:** `ALREADY_COVERED_IN_PRACTICE`; no Core change.

P3 outcome: Core candidates `0`, new public skills `0`, installer/manifest candidates `0`, P4 survivors `1`.

### P4 — Lowest-cost integration design — COMPLETE

The sole survivor was expressible as a bounded `EXISTING_SKILL_TWEAK`:

1. before candidate interpretation for an acceptance verdict, freeze the smallest sourced acceptance axes/invariants capable of changing that verdict;
2. after a concrete correction, recheck another required invariant only when the correction mechanism materially affects it;
3. do not rerun unrelated/unaffected properties merely because a correction happened.

Approved production scope was only:

- `skills/visual-check/references/durable-evidence.md`
- `skills/visual-check/references/concrete-defect.md`

Explicitly out of scope: Core, `SKILL.md`, `approved-reference.md`, installer/manifest, `TASKS.md`, new public skills, RVR gate/status taxonomy, rerun-all behavior.

Candidate implementation branch: `codex/visual-check-acceptance-invariants-p4`.

### P5 — Bounded candidate validation — BLOCKED; CANDIDATE PARKED

Full decision: [`2026-08-28-paperthin-stage-p4-p5-visual-check-decision.md`](2026-08-28-paperthin-stage-p4-p5-visual-check-decision.md).

TDD evidence:

- clean RED head `5e377813ecdee522f902b3f2a7a9a3f660641cee`, Actions run `33177328114`: 674 current-release tests, 672 PASS, exactly the 2 new contract assertions FAIL;
- implementation head `71e5d9d67a5ee9880d4ea47717df1e6f4c8a81ad`, Actions run `33177845723`: both new focused assertions PASS, but full current-release gate is 611 PASS / 63 FAIL.

Root cause of the 63 failures is not the focused behavior assertions. The repository intentionally exact-pins active `$visual-check` reference bytes in:

- `vendor/source-manifest.json` + `tests/design-vendor-integrity.tests.mjs`;
- M2B1 smoke plans and runner preflight, including `design-visual-m2-b1-smoke-plan-v10.json`.

M2B1 v10 binds predecessor artifacts, source commit/runner identities, and visual-check inputs by exact bytes/SHA; its boundary states `manifestUpdate: forbidden-before-independent-review`. Rewriting those historical hashes is not valid compatibility work. Preserving history while supporting a new active identity would require a new evaluation/contract generation or broader historical-materialization architecture.

That expansion exceeds the approved two-reference tweak and is disproportionate to a `REAL_SINGLE_PROJECT_GAP`. Therefore:

> `P5 = BLOCKED`; sole candidate = `PARK`.

Do not update every pin, create a new eval generation, or expand permanent validation machinery merely to force this candidate through.

## 5. P3 ↔ M4 boundary

The Open Design incident remains a real-project evidence lead for existing M4 external-plugin contract conflict:

- logical plugin/mode identity versus backing runtime/effect identity;
- recovery/re-registration before contract diagnosis;
- delegation preserving user tool/side-effect authority;
- retry after `daemon_shutdown` or unexpected GUI/process effects.

This roadmap does not change M4 status. Do not call the incident an exact M4 PASS/FAIL until missing incident-time identities are bound or independent evidence reproduces the gap.

## 6. Adoption state

No candidate reaches P6.

- candidate branch is retained as bounded failed-validation evidence;
- no candidate PR is opened;
- no candidate is merged;
- `main` remains unchanged by this adoption track;
- Core v8 remains frozen;
- active six-skill catalog remains unchanged on main;
- installer/manifest and `TASKS.md` remain unchanged;
- personal installation is not updated.

## 7. Return to real-use observation

This Paperthin/RVR adoption track is now parked.

Reopen the visual seam only if either:

1. an independent project reproduces the same acceptance-frame / impacted-invariant failure class; or
2. visual-check identity/versioning is already being changed for another independently justified reason, reducing the marginal integration cost.

Otherwise, continue using unchanged JOENESS and collect outcome-changing evidence only.

Dororong phase-2 may proceed independently; it must not treat the parked candidate as an adopted rule.

## 8. Decision principles

1. **No-change is first-class.** Prior art/incidents can validate the current design without creating work.
2. **Mechanism over branding.** Tool/plugin/skill names do not prove execution semantics.
3. **Current artifact/state beats narrative.** Actual visual/runtime/process effects control their own evidence layer.
4. **One layer does not prove another.** Build/deploy/process/visual/user-acceptance/tool-contract evidence remain separate.
5. **Fresh context is a tool, not automatic proof.** Use it only for an observed context-contamination failure.
6. **One symptom is not a global rule.** Cross-context evidence within one project still falls short of cross-project repetition.
7. **Independent truth matters.** Self-generated or implementation-mirroring checks do not prove external correctness by themselves.
8. **Delegation does not expand authority.** Subagents inherit relevant user/project boundaries.
9. **Retry permission is not diagnosis permission.** User-authorized retry does not erase evidence-based stop constraints.
10. **Positive evidence matters too.** Correct Dororong behavior is evidence against unnecessary rules.
11. **Historical evidence is immutable evidence.** Do not rewrite pinned predecessor plans/hashes to make a new candidate appear validated.
12. **Restraint is measurable.** A compact behavior delta does not justify a broad validation-architecture expansion when real-use evidence is still single-project.
