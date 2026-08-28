# JOENESS × Paperthin Prior-Art Adoption Roadmap

- Status: planning / `P0+P1+P2+P3 COMPLETE` / `P4 NEXT` / no adoption implemented
- JOENESS baseline: `main@1d867465cc2f99788a0b478d5fba4eb090fcde83`
- Active Core baseline: `interaction-safety-core-v8.md` — `2,934 bytes` / SHA-256 `41b3f8435c6077a9289e0c9d3315aa00d68a96e2e9add7168de6bb42f9730aea`
- Public skills baseline: `project`, `ticket`, `design`, `visual-check`, `spec`, `handoff`
- Paperthin research baseline: `LilMGenius/paperthin@3bca079a51bcfff5dafb53d1d7f9f523d66ee317`
- Paperthin license: MIT

## 1. Goal

Use Paperthin as prior art to identify low-level agentic failure patterns that JOENESS does not already cover, then adopt only the smallest changes that earn their way in through real-project evidence.

This is not a Paperthin migration, dependency installation, or skill-catalog import. A no-change result remains valid success.

The controlling question is:

> Which failure reflex is actually missing from JOENESS, where is the lowest-cost layer that can express it, and what real evidence proves the change is worth permanent complexity?

## 2. Hard boundaries

Until a later adoption gate explicitly passes:

- do not modify Core v8;
- do not add/remove public skills;
- do not change installer/manifest behavior;
- do not change M2/M3/M4/M5/M6 classifications or `TASKS.md` from this research branch;
- do not install Paperthin into the active JOENESS environment;
- do not import Paperthin's full catalog, `.re0/` topology, `sip`, automatic loops, symlink/update model, or external-write behavior;
- do not create synthetic eval volume to justify a candidate;
- do not treat same-model/multi-agent agreement as proof;
- do not turn one RVR project, even with multiple incident contexts, directly into a Core rule;
- do not interpret Dororong research-stage completion as Dororong product completion.

Paperthin concepts are translated to mechanisms, not copied verbatim. Substantial copied source material would require MIT provenance/notice.

## 3. Evidence surfaces

Keep one document per stage/evidence purpose rather than duplicating state:

1. P1 source comparison: [`2026-08-27-paperthin-stage-p1-mechanism-gap-matrix.md`](2026-08-27-paperthin-stage-p1-mechanism-gap-matrix.md)
2. RVR combined incident intake: [`2026-08-27-paperthin-p3-rvr-evidence-intake.md`](2026-08-27-paperthin-p3-rvr-evidence-intake.md)
3. P2 closeout + P3 fit decision: [`2026-08-28-paperthin-stage-p2-p3-evidence-fit.md`](2026-08-28-paperthin-stage-p2-p3-evidence-fit.md)
4. Independent Dororong checkpoint: `JOEWRKS/Doropet`, Draft PR [`#1`](https://github.com/JOEWRKS/Doropet/pull/1), head `cc04e67e8cc330d9afe0af607b66188527a42cd4`

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

These classifications describe contract overlap at the pinned source baseline; they are not adoption approvals.

### P2 — Dororong live pilot — COMPLETE

Research-stage result: `P2 COMPLETE`; product result: **Dororong M1 remains `PARTIAL`**.

Verified remote checkpoint boundary:

- body-outline scope `PASS`;
- attempt-8 visual asset identity `PRESERVED` at checkpoint;
- exact attempt-8 → checkpoint runtime-binary provenance `UNVERIFIED`;
- closed-eye/state-animation/remaining interaction/non-interference acceptance `UNVERIFIED`;
- Draft PR is open, unmerged, and explicitly not an M1-completion PR.

Observed JOENESS-positive behavior includes:

- GUI automation failure stayed separate from product verdict and manual current-PC observation was used instead;
- real Windows failure overruled narrower static/repository success;
- user's `좋다` closed the current body-outline stage while next-phase expression/animation feedback was deferred rather than retroactively rewriting the PASS;
- partial/unverified layers were preserved;
- binary hash mismatch stopped downstream work, triggered one bounded reconstruction, and remained `UNVERIFIED` when exact DLL provenance could not be reproduced;
- no Paperthin/RVR-derived runtime rule was injected mid-pilot.

Per-attempt installed Core/skill identity was not independently re-hashed inside Doropet, so P2 does not claim exact Core-v8 invocation proof for every runtime attempt.

### P3 — Evidence-to-pattern fit — COMPLETE

Full decision: [`2026-08-28-paperthin-stage-p2-p3-evidence-fit.md`](2026-08-28-paperthin-stage-p2-p3-evidence-fit.md).

Paperthin-named mechanisms after real-use fit:

| Mechanism | P3 result | Disposition |
|---|---|---|
| `readchk` | `REAL_SINGLE_PROJECT_GAP` | `PARK`; no Core/public skill change |
| `shower` | `THEORETICAL_ONLY` | `PARK` |
| `mandela` | `REAL_SINGLE_PROJECT_GAP` | no standalone public skill; retain bounded validation-independence concern |
| `re0-memo` one-off→rule guard | `ALREADY_COVERED_IN_PRACTICE` | no change |
| `re0-memo` lesson→next-execution transfer | `REAL_SINGLE_PROJECT_GAP` | `PARK`; no standalone memo skill |
| `catchup` | `THEORETICAL_ONLY` | `PARK` |

RVR-specific bounded seams after subtracting existing JOENESS:

- **A+B visual acceptance frame + impacted-invariant recheck:** `REAL_SINGLE_PROJECT_GAP`; the only candidate advancing to P4.
- **C+D tool backing-runtime/effect identity + delegated side-effect authority:** `REAL_SINGLE_PROJECT_GAP` with incomplete evidence identity; parked in the existing M4/plugin-conflict thread.
- **E procedure-label success ≠ actual effect:** `ALREADY_COVERED_IN_PRACTICE` at Core level; RVR is nonexecution evidence and Dororong provides positive counter-evidence.

P3 outcome:

- Core candidates: `0`
- new public-skill candidates: `0`
- installer/manifest candidates: `0`
- P4 survivors: `1`

## 5. P3 ↔ M4 boundary

The Open Design incident remains useful real-project evidence for the existing M4 external-plugin contract-conflict scope:

- logical plugin/mode identity versus backing runtime/effect identity;
- recovery/re-registration before contract diagnosis;
- delegation preserving user tool/side-effect authority;
- retry behavior after `daemon_shutdown` or unexpected GUI/process side effects.

This research branch does **not** change M4 status. Do not call the incident an exact M4 PASS/FAIL until the missing incident-time identities are bound or independent evidence reproduces the same gap.

## 6. P4 — Choose lowest-cost integration form — NEXT

P4 may design **one candidate only**:

> `$visual-check` acceptance-frame + materially impacted-invariant discipline.

The candidate may become `PARK` if a compact non-ceremonial delta cannot be stated. The maximum allowed implementation form entering P4 is `EXISTING_SKILL_TWEAK`; it is **not** a Core or new-skill candidate.

Before touching runtime files, P4 must answer:

1. What exact existing `$visual-check` behavior changes?
2. What triggers it, and what ordinary visual work does **not** trigger it?
3. Which sourced acceptance axes/invariants must be frozen before candidate interpretation?
4. After a fix, how are only **materially impacted** invariants selected for recheck?
5. What falsifiable observation proves the behavior occurred?
6. Why current `approved-reference`, `durable-evidence`, and `concrete-defect` text cannot already express the required behavior without modification?
7. What independent outside truth would validate the claimed practical benefit?
8. Which exact files would change, and which files are explicitly out of scope?

Non-goals:

- no universal preflight checklist;
- no rerun-all-after-every-edit rule;
- no RVR Gate 0–8 or nine-state taxonomy import;
- no new public visual skill;
- no bundled Paperthin mechanism.

P4 output should be one bounded design/decision. If `PARK`, stop this adoption track and return to real-use observation.

## 7. P5 — Bounded candidate validation

Run only if P4 approves a concrete change.

Use only checks relevant to the claimed delta:

- static contract/trigger assertions for routing/contract text;
- deterministic repository regression once after the candidate is internally complete;
- fresh-context smoke only if the change claims context isolation;
- actual project evidence where practical behavior is claimed;
- visual/runtime evidence only at the affected layer.

For any new evaluation ask:

> What independent outside truth enters this validation?

If none enters, the result may prove contract consistency but not behavioral value.

Do not reopen broad A/B, repeated generations, reviewer panels, or self-confirming eval volume.

## 8. P6 — Adopt one change at a time

Only after P5 passes at the claimed layer:

1. update approved files only;
2. preserve Core/catalog/manifest unless the approved form explicitly requires otherwise;
3. run required deterministic gates;
4. push one feature branch;
5. PR with exact evidence boundary;
6. merge only after hosted CI passes;
7. verify post-merge CI;
8. update personal installation only if an installed artifact changed;
9. sync `TASKS.md` only after the real state exists.

No second prior-art idea rides the same adoption.

## 9. P7 — Freeze and real-use observation

After any adoption:

- freeze the change;
- use JOENESS in real projects;
- collect outcome-changing evidence only;
- distinguish one complaint from a reusable pattern;
- reopen only for repeated evidence or a material safety defect.

## 10. Decision principles

1. **No-change is first-class.** Prior art/incidents can validate the current design without creating work.
2. **Mechanism over branding.** Tool/plugin/skill names do not prove execution semantics.
3. **Current artifact/state beats narrative.** Actual visual/runtime/process effects control their own evidence layer.
4. **One layer does not prove another.** Build/deploy/process/visual/user-acceptance/tool-contract evidence remain separate.
5. **Fresh context is a tool, not automatic proof.** Use it only for an observed context-contamination failure.
6. **One symptom is not a global rule.** Cross-context evidence within one project still falls short of cross-project repetition.
7. **Independent truth matters.** Self-generated mocks/expected values/implementation-mirroring checks do not prove external correctness by themselves.
8. **Delegation does not expand authority.** Subagents inherit relevant user/project tool/write/side-effect boundaries.
9. **Retry permission is not diagnosis permission.** User-authorized retry does not erase evidence-based stop constraints.
10. **Positive evidence matters too.** Dororong behavior that current JOENESS handled correctly is evidence against unnecessary new rules.
11. **Restraint is measurable.** If a bounded delta cannot be justified, P4 should park it and leave JOENESS unchanged.

## 11. Immediate next action

Do **not** start implementation yet.

Next action is Stage P4 only:

1. inspect current `$visual-check` plus `approved-reference`, `durable-evidence`, and `concrete-defect` at the pinned JOENESS baseline/current main;
2. write the smallest candidate delta for pre-candidate acceptance framing + materially impacted invariant recheck;
3. decide `PARK` versus `EXISTING_SKILL_TWEAK` before changing any runtime file.

Until that decision, Core v8, six public skills, installer/manifest, and `TASKS.md` remain frozen. Doropet PR #1 remains a separate unmerged product checkpoint.
