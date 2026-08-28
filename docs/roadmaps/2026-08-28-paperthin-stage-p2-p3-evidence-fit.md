# JOENESS × Paperthin Stage P2 closeout + P3 evidence-to-pattern fit

- Status: `P2 COMPLETE` / `P3 COMPLETE` / no adoption implemented
- JOENESS comparison baseline: `main@1d867465cc2f99788a0b478d5fba4eb090fcde83`
- Core baseline: `interaction-safety-core-v8.md`, SHA-256 `41b3f8435c6077a9289e0c9d3315aa00d68a96e2e9add7168de6bb42f9730aea`
- Public skills baseline: `project`, `ticket`, `design`, `visual-check`, `spec`, `handoff`
- Paperthin baseline: `LilMGenius/paperthin@3bca079a51bcfff5dafb53d1d7f9f523d66ee317`
- P1 input: [`2026-08-27-paperthin-stage-p1-mechanism-gap-matrix.md`](2026-08-27-paperthin-stage-p1-mechanism-gap-matrix.md)
- RVR input: [`2026-08-27-paperthin-p3-rvr-evidence-intake.md`](2026-08-27-paperthin-p3-rvr-evidence-intake.md)
- Dororong remote checkpoint: `JOEWRKS/Doropet`, Draft PR [`#1`](https://github.com/JOEWRKS/Doropet/pull/1)
- Dororong phase-1 remote head: `cc04e67e8cc330d9afe0af607b66188527a42cd4`

This document closes the research stages only. `P2 COMPLETE` does **not** mean Dororong M1 is complete, and `P3 COMPLETE` does **not** approve a JOENESS runtime change.

## 1. P2 closeout — Dororong live pilot

### 1.1 Product boundary

The remote checkpoint keeps the product verdict narrower than the implemented work:

- phase-1 body-outline scope: `PASS`;
- overall Dororong M1: `PARTIAL`;
- attempt-8 visual asset identity at the checkpoint: `PRESERVED`;
- exact runtime-binary provenance from attempt 8 to the clean checkpoint: `UNVERIFIED`;
- closed-eye expression, richer state animation, and remaining interaction/non-interference acceptance: `UNVERIFIED`.

The Draft PR is explicitly a phase-1 checkpoint, not an M1-completion PR, and remains unmerged. Its base is `main@2ff76cbeeaea4048bd9d451cfc38189a9945c05f`; its head is `feature/dororong-m1@cc04e67e8cc330d9afe0af607b66188527a42cd4`.

Primary remote evidence:

- [Draft PR #1](https://github.com/JOEWRKS/Doropet/pull/1)
- [attempt-8 manual Windows acceptance](https://github.com/JOEWRKS/Doropet/blob/cc04e67e8cc330d9afe0af607b66188527a42cd4/docs/verification/2026-08-28-m1-windows-acceptance-manual-attempt-8.md)
- [phase-1 conversation/work history](https://github.com/JOEWRKS/Doropet/blob/cc04e67e8cc330d9afe0af607b66188527a42cd4/docs/handoff/2026-08-28-dororong-phase-1-conversation-and-work-history.md)

### 1.2 Positive JOENESS behavior actually observed

Dororong supplies useful counter-evidence to the RVR failures:

1. **Automation failure stayed separate from product verdict.** The Windows GUI automation limitation was recorded as an environment/tool limitation; it was not converted into a Dororong PASS or FAIL. The user-assisted current-PC manual path replaced the unavailable automation without pretending the missing checks had run.
2. **Real Windows evidence overruled narrower repository/static success.** Candidate F passed repository/static checks but failed on the real Windows presentation; the result stayed FAIL until the later attempt-8 actual-Windows acceptance.
3. **Stage-aware feedback worked.** The user's `좋다` closed the body-outline correction while the same feedback moved closed-eye expression and state-specific motion into the next phase. The current PASS was not withdrawn merely because a later-stage improvement was requested.
4. **Partial completion stayed partial.** Body-outline PASS did not upgrade closed-eye/animation/interaction/non-interference items that remained unobserved.
5. **Provenance mismatch stopped downstream work.** When a clean-checkpoint rebuild did not reproduce all attempt-8 binary hashes, push/PR was stopped. A bounded one-time reconstruction then reproduced the EXE and both visual assets but not App/Core DLL hashes. The cause remained `UNVERIFIED`; no speculative cause, repeated rebuild loop, or false binary-equivalence claim was added.
6. **The checkpoint was preserved without completion theater.** A docs-only provenance commit was pushed and the PR body explicitly carries the `PARTIAL`/`UNVERIFIED` boundaries instead of presenting the checkpoint as finished M1.

### 1.3 Dororong friction that remains evidence, not automatically a rule

- The visual body-outline work needed attempts 3–8 before the user accepted the named scope. This is real rework cost, but the attempts span different causal failures and do not by themselves prove one missing cross-project JOENESS mechanism.
- Early project corrections included working-location and character-identity clarification. These are evidence that misunderstandings can be costly, but the available checkpoint evidence does not prove that a generic pre-work `readchk` reflex would have prevented them.
- No demonstrated failure shows that the phase-1 handoff itself cannot be understood by a fresh reader without hidden session context.
- No demonstrated human re-entry failure occurred.

### 1.4 P2 pass decision

`P2 = COMPLETE` because the pilot reached an honest real-project boundary under the unchanged JOENESS candidate without injecting Paperthin/RVR-derived rules mid-pilot, and the closeout preserves both successful and unverified layers.

Boundary:

- Dororong M1 remains `PARTIAL`.
- The project records that the harness was used without reinstalling/modifying it, but this research does not independently re-hash the installed Core/skills identity at every Dororong runtime attempt. Do not claim per-attempt exact Core-v8 activation from the product evidence alone.

## 2. P3 method

For each candidate, first subtract behavior already required by current JOENESS. Only the residual is treated as a possible change.

Classification vocabulary follows the roadmap:

- `REPEATED_COMMON_FAILURE`
- `REAL_SINGLE_PROJECT_GAP`
- `ALREADY_COVERED_IN_PRACTICE`
- `THEORETICAL_ONLY`
- `CONFLICTS_WITH_JOENESS`

A costly incident does not automatically create a rule. Dororong successes count as evidence against unnecessary expansion.

## 3. P1 Paperthin candidate fit

| P1 mechanism | P3 classification | Evidence fit | P3 disposition |
|---|---|---|---|
| `readchk` | `REAL_SINGLE_PROJECT_GAP` | RVR Open Design shows a real user/tool-boundary mistranslation lead. Dororong has early corrections, but they do not independently prove the same generic failure class or that silent paraphrase would have prevented it. | `PARK`; no Core/public skill change |
| `shower` | `THEORETICAL_ONLY` | RVR has same-session review bias, but no general artifact-alone cold-read failure. Dororong produced a durable handoff, but no fresh-reader failure was observed. | `PARK` |
| `mandela` | `REAL_SINGLE_PROJECT_GAP` | RVR implementation/mock/checks shared assumptions and produced circular internal consistency. Current JOENESS already rejects candidate-derived authority/self-authored evidence in important paths, and Dororong shows external Windows/user evidence correctly overriding narrower checks. | do not add `$mandela`; feed only the bounded validation-independence concern into relevant maintenance/eval work |
| `re0-memo` — one-off→global-rule guard | `ALREADY_COVERED_IN_PRACTICE` | Core v8 already forbids globalizing one candidate/context symptom; this research itself preserved that boundary. | no change |
| `re0-memo` — lesson→next-execution gate | `REAL_SINGLE_PROJECT_GAP` | RVR wrote correct lessons before later recurrence. Dororong, however, preserved named failures and eventually changed the execution/check path successfully. | `PARK`; do not create a standalone memo skill |
| `catchup` | `THEORETICAL_ONLY` | No real human re-entry/context-restoration failure is demonstrated in RVR or Dororong. | `PARK` |

Result: **no Paperthin-named mechanism earns a new public skill or Core rule at P3.**

## 4. RVR bounded seams after subtracting existing JOENESS

### A+B. Visual acceptance frame + impacted-invariant recheck

Classification: `REAL_SINGLE_PROJECT_GAP`.

Existing JOENESS already requires sourced claim-specific checks, falsifiable observations, layer separation, rejection handling, and recheck of the rejected property. The residual seam is narrower:

1. before interpreting a candidate for a visual acceptance claim, freeze the sourced acceptance axes/invariants capable of changing that verdict rather than letting visible candidate strengths define the checklist post hoc;
2. when the correction mechanism materially affects another acceptance invariant, recheck that impacted invariant together with the failed property instead of assuming untouched quality.

RVR supplies the direct failure: `4×` preserved native pixel density but failed physical size; the `2×` correction improved size but directly broke pixel-grid density.

Dororong supplies useful adjacent evidence but **not an independent reproduction of this exact seam**: actual Windows evidence correctly overruled static checks, which confirms current layer discipline can work. Therefore this candidate is worth a bounded P4 design decision but does not yet justify immediate implementation as a proven general fix.

P3 disposition: **ADVANCE 1** to P4 as a possible `EXISTING_SKILL_TWEAK`, with implementation allowed to remain `PARK` if P4 cannot state a non-ceremonial trigger and proof boundary.

Non-goals if it survives P4:

- no universal preflight checklist;
- no rerun-all-checks-after-every-edit rule;
- no RVR Gate 0–8/status taxonomy import;
- no new public visual skill.

### C+D. Tool backing-runtime/effect identity + delegated side-effect authority

Classification: `REAL_SINGLE_PROJECT_GAP`, evidence identity incomplete.

Existing Core already says user/project owns tool choice, same command/mechanism retry is zero after crash/unexpected exit, GUI/tool fallbacks are bounded, and delegation does not create new product authority. The residual question is whether a material user constraint about GUI/cloud/network/external-process effects needs an explicit identity check of the selected plugin/mode's actual backing runtime/effects, and whether that constraint must be carried into delegated external-tool work.

RVR Open Design supplies a real incident lead, but this research branch still lacks exact incident-time plugin/runtime revision, raw run logs, and exact user instruction binding. Dororong does not reproduce this tool-contract failure.

P3 disposition: **PARK in the existing M4/plugin-conflict thread.** Do not change Core, `ticket`, or public routing from this evidence. M4 may use it as a real-project lead when the missing identity can be bound or an independent project reproduces the same gap.

### E. Procedure-label success versus actual user-goal/effect evidence

Classification: `ALREADY_COVERED_IN_PRACTICE` at Core level.

Core already says filename/narration/liveness are not success and evidence must bind exact artifact/version/target/state/observed property. RVR violated this behavior; Dororong later demonstrates the intended opposite behavior through manual runtime evidence, partial-state preservation, and provenance-stop handling.

P3 disposition: **no Core change**. Treat RVR as nonexecution evidence, not a missing general rule.

## 5. P3 survivors

Only one candidate advances to P4:

| # | Candidate | Why it survives | Maximum allowed form entering P4 |
|---|---|---|---|
| 1 | visual acceptance-frame + impacted-invariant discipline | real `$visual-check`-boundary failure with a narrowly identifiable residual after subtracting current rules | `EXISTING_SKILL_TWEAK` candidate; may still become `PARK` |

Everything else is parked or no-change:

- no Core candidate;
- no new public skill;
- no standalone `readchk`, `shower`, `mandela`, `re0-memo`, or `catchup` adoption;
- Open Design/tool identity remains an M4 evidence lead, not a runtime change candidate;
- no installer/manifest change.

This is intentionally below the roadmap's maximum of three advancing candidates.

## 6. P4 entry condition

P4 may design only the surviving visual candidate. Before changing any runtime file, it must answer:

1. exact behavior delta in one current `$visual-check` boundary;
2. trigger/non-trigger so ordinary low-risk visual work does not gain ceremony;
3. which acceptance axes must be frozen before candidate interpretation and which do not;
4. how to identify only **materially impacted** invariants after a correction;
5. what concrete observation proves the new behavior happened;
6. why existing `approved-reference`, `durable-evidence`, and `concrete-defect` text cannot already express the same behavior without modification;
7. what independent outside truth would validate the claimed benefit.

If these cannot be answered compactly, P4 result is `PARK` and JOENESS remains unchanged.

## 7. Freeze after P3

Until P4 explicitly approves a bounded design:

- Core v8 remains frozen;
- six public skills remain unchanged;
- installer/manifest and `TASKS.md` remain unchanged;
- Paperthin is not installed into the active environment;
- Doropet Draft PR #1 remains a separate product checkpoint and is not merged by this research;
- Dororong phase-2 work is not evidence for an already-adopted rule because no rule has been adopted.
