# JOENESS × Paperthin Prior-Art Adoption Roadmap

- Status: planning / P0+P1 complete / pre-P2 evidence prepared / P2 pending / no adoption approved
- JOENESS baseline: `main@1d867465cc2f99788a0b478d5fba4eb090fcde83`
- Active Core baseline: `interaction-safety-core-v8.md` — `2,934 bytes` / SHA-256 `41b3f8435c6077a9289e0c9d3315aa00d68a96e2e9add7168de6bb42f9730aea`
- Public skills baseline: `project`, `ticket`, `design`, `visual-check`, `spec`, `handoff`
- Paperthin research baseline: `LilMGenius/paperthin@3bca079a51bcfff5dafb53d1d7f9f523d66ee317`
- Paperthin license: MIT

## 1. Goal

Use Paperthin as prior art to identify low-level agentic failure patterns that JOENESS does not already cover, then adopt only the smallest changes that earn their way in through real-project evidence.

This is not a migration to Paperthin, a dependency installation, or a catalog import. The target remains JOENESS: thin Core, conditional skills, one main writer, evidence-bound completion, minimal persistent state, and no rule accumulation without observed need.

Success means either:

1. a Paperthin-derived mechanism closes a demonstrated JOENESS gap with lower rework or clearer verification; or
2. the mechanism is rejected/parked with an evidence-backed reason and JOENESS remains unchanged.

A no-change result is a valid success.

## 2. Hard boundaries

Until an adoption gate is explicitly passed:

- do not modify Core v8;
- do not add, remove, or change public skills;
- do not change installer/manifest behavior;
- do not change current M2/M3/M4/M5/M6 evidence classifications from this research branch;
- do not install Paperthin into the active JOENESS environment;
- do not import Paperthin's full skill catalog, `.re0/` casebook topology, `sip` orchestration, automatic build loops, symlink/update model, or external-write behavior;
- do not create synthetic eval volume merely to justify a candidate;
- do not treat same-model or multi-agent agreement as proof;
- do not interrupt or alter an active real-project pilot to make it fit this roadmap;
- do not turn one RVR project, even with multiple incident contexts, directly into a global Core rule.

Paperthin concepts should be translated to mechanisms, not copied verbatim. If substantial Paperthin text or code is ever reused, preserve the MIT license notice/provenance required by the source license.

## 3. Working hypothesis

JOENESS and Paperthin overlap in philosophy but operate at different layers.

- JOENESS owns workflow authority, scope, write safety, retry limits, evidence, completion, project/ticket/spec/visual/handoff boundaries.
- Paperthin supplies low-level reflexes around request interpretation, fresh-context comprehension, validation independence, iteration learning, human re-entry, and perspective diversity.

The adoption question is not “which Paperthin skills should JOENESS install?” but:

> Which failure reflex is actually missing from JOENESS, where is the lowest-cost layer that can express it, and what real evidence proves the change is worth its permanent complexity?

## 4. P1 watchlist — historical classifications remain unchanged until P3

P1 source extraction is complete in [`2026-08-27-paperthin-stage-p1-mechanism-gap-matrix.md`](2026-08-27-paperthin-stage-p1-mechanism-gap-matrix.md), with corrected source-identity commit `dbdad2c0b9cfe3413e711ea467d8852924b0f649`.

| Paperthin mechanism | P1 classification | Pre-P2 real-use signal now available |
|---|---|---|
| `readchk` — silent request-understanding check | `GAP_CANDIDATE` | **new lead** from Open Design user/tool-boundary mistranslation; exact user instruction + plugin manifest still unbound |
| `shower` — fresh zero-context comprehension read | `GAP_CANDIDATE` | partial visual-review signal only |
| `mandela` — validation leakage audit | `GAP_CANDIDATE` | **strong RVR lead**: implementation/mock/checks shared assumptions and circularly agreed |
| `re0-memo` — complaint → pattern → gate | `ALREADY_COVERED` | **reopen in P3 only for lesson→execution transfer**; one-off→global-rule guard remains already covered |
| `catchup` — human re-entry from live state | `GAP_CANDIDATE` | no material RVR signal |

P1 classification is source-level history. P3 may narrow, split, park, or reject a mechanism based on real use; it does not rewrite what P1 observed in the pinned contracts.

## 5. Prepared real-project evidence before Dororong review

The combined RVR evidence intake is [`2026-08-27-paperthin-p3-rvr-evidence-intake.md`](2026-08-27-paperthin-p3-rvr-evidence-intake.md).

It fingerprints the latest supplied integrated RVR report as:

- attachment: `붙여넣은 마크다운(1)(7).md`
- bytes: `99,068`
- SHA-256: `79740b56627900fa5e67c1de6ad5dfffd7a847eee21e728dc6ec0d4adf72bd0c`

The previous visual-only report fingerprint remains historical evidence that the first analysis existed before later appended execution incidents.

The combined intake preserves two separate incident families:

### 5.1 Visual verification / deployment family

Observed leads:

- structural/identity checks were widened into visual PASS;
- candidate-visible strengths became post-hoc whole acceptance criteria;
- `4×` native pixel scale was confused with acceptable physical size;
- the `2×` fix improved physical size while violating pixel-grid density;
- implementation/mock/checks shared assumptions and produced circular “evidence”;
- exact ZIP/live identity proved exact deployment of wrong results, not quality;
- a correct first failure report did not prevent later recurrence.

### 5.2 Open Design tool-boundary / execution family

Observed leads:

- plugin/mode naming was treated as evidence about actual backing runtime and user-visible side effects;
- recovery/re-registration was attempted before the plugin/runtime structure was fully diagnosed;
- two Local Codex runs reportedly ended with `daemon_shutdown` and zero art outputs;
- the broad execution structure was repeated after the first shutdown without a proven cause fix/new evidence;
- `Open Design.exe -e ...` was used as though it were a Node.js runner, launching an Electron GUI/process tree and producing `EPIPE`;
- delegation did not preserve the user's intended execution-effect boundary strongly enough.

The exact source repo/commit/path, incident-time installed JOENESS identities, exact Open Design plugin/runtime revision, raw run logs, and exact user instruction remain `UNVERIFIED` in this research branch unless later bound from primary evidence.

## 6. Cross-incident synthesis — hypothesis only

The two incident families share a higher-level shape:

> A procedural label or narrow successful step was widened into success of the user's actual goal/effect.

Examples:

- `visual-check invoked / image opened / tests passed` → incorrectly widened toward “visual acceptance verified”;
- `plugin selected / Local Codex started / Cloud not selected` → incorrectly widened toward “user's tool/side-effect boundary satisfied”.

This is meaningful because it recurs across **different failure contexts**, but both contexts are still inside one RVR project. Treat it as a cross-context signal, not yet a cross-project Core candidate.

## 7. Roadmap stages

### Stage P0 — Freeze and bind baselines — COMPLETE

Purpose: ensure prior-art research cannot silently rewrite the system being evaluated.

Pass state:

- exact JOENESS and Paperthin baselines pinned;
- Core/public skills unchanged;
- existing validation classifications unchanged.

### Stage P1 — Prior-art mechanism extraction — COMPLETE

Deliverable: one compact mechanism-level gap matrix, not per-skill research files.

Result:

- `ALREADY_COVERED=1` (`re0-memo` narrow P1 mechanism)
- `GAP_CANDIDATE=4` (`readchk`, `shower`, `mandela`, `catchup`)

These are not adoption approvals.

### Stage P2 — Finish Dororong live pilot without contamination — NEXT

Purpose: obtain an independent end-to-end JOENESS observation before changing the harness in response to Paperthin/RVR.

Actions:

1. Finish the existing Dororong M1 path under the already-installed Core v8 and current six skills.
2. Keep Paperthin/RVR-derived candidate rules out of the live pilot unless the user independently asks for the same behavior.
3. At closeout collect observed friction **and observed successes** relevant to:
   - instruction/boundary misread or needless clarification;
   - hidden-session-context dependence in spec/handoff;
   - self-confirming validation;
   - lesson recorded but not converted into later execution behavior;
   - human re-entry/context loss;
   - procedural/tool label being mistaken for actual effect;
   - retry/side-effect handling if an unexpected external-process/tool failure naturally occurs.
4. Do not manufacture any of these conditions to test the roadmap.

Pass:

- Dororong product verdict remains independent of this research;
- evidence is bound to real transcript/artifact/runtime state;
- no Paperthin/RVR-inspired JOENESS mutation occurred mid-pilot.

### Stage P3 — Evidence-to-pattern fit review

Run once after P2. Inputs:

1. P1 mechanism matrix;
2. combined RVR evidence intake;
3. Dororong closeout evidence;
4. existing JOENESS source/contract evidence needed to distinguish missing rule from nonexecution.

For each P1 candidate classify the observed evidence:

- `REPEATED_COMMON_FAILURE` — repeated across distinct projects/contexts strongly enough to justify a reusable mechanism;
- `REAL_SINGLE_PROJECT_GAP` — real and costly, but not yet cross-project;
- `ALREADY_COVERED_IN_PRACTICE` — current JOENESS handled it adequately;
- `THEORETICAL_ONLY` — no observed need;
- `CONFLICTS_WITH_JOENESS` — would add ceremony, duplicate authority, or weaken safety.

Also review these **bounded non-Paperthin seams** exposed by RVR:

A. `visual-check`: criteria-before-candidate freeze.  
B. `visual-check`: change-impact invariant recheck.  
C. tool/M4: logical tool identity → backing runtime/effect identity when side effects materially affect user authority.  
D. tool/M4/ticket: delegated authority preserves material tool/side-effect constraints without boilerplate.  
E. maintenance: procedure-label success must not substitute for actual user-goal/effect evidence.

P3 must first ask for each RVR issue:

> Was this already required by the active contract and merely not executed?

Only the residual behavior after that subtraction is a true change candidate.

Adoption gates:

- **Core change:** only repeated cross-project common failure or material cross-project safety defect.
- **Existing skill change:** at least one real failure at that skill boundary plus evidence the bounded fix generalizes.
- **New public skill:** unique recurring user value that cannot fit an existing skill without mixing responsibilities.
- **Internal policy/reference:** validation/maintenance principle needing no user-facing routing.
- **No change:** default when existing rules are sufficient or evidence is insufficient.

Pass:

- advance no more than three total candidates;
- every advancing candidate names the exact observed gap it closes;
- every candidate states what existing JOENESS already covered;
- “Paperthin has a skill for it” or “the incident was expensive” is never itself an adoption reason.

### Stage P3-M4 cross-thread — Open Design plugin evidence

The Open Design incident also belongs to the existing JOENESS validation-debt roadmap's M4 external-plugin contract-conflict scope.

This branch does **not** change M4 status or `TASKS.md`. When M4 resumes, use the combined RVR intake as an evidence lead for:

- plugin logical identity versus backing runtime/effect identity;
- installed-plugin contract conflict before recovery/re-registration;
- delegation preserving tool/side-effect authority;
- retry behavior after `daemon_shutdown` or unexpected GUI/process side effects.

Do not call the incident an exact M4 PASS/FAIL until the evidence identity required for that claim is actually bound.

### Stage P4 — Choose the lowest-cost integration form

For each P3 survivor choose exactly one:

1. `REJECT`
2. `PARK`
3. `REFERENCE`
4. `EXISTING_SKILL_TWEAK`
5. `NEW_CONDITIONAL_SKILL`
6. `CORE_CANDIDATE`

Default preference is the lowest numbered form that fully closes the observed gap.

Before implementation, write a bounded design covering exact behavior delta, trigger/non-trigger, authority, observable acceptance, stop/failure behavior, expected files, and non-goals.

One candidate per implementation branch unless two changes are mechanically inseparable.

### Stage P5 — Bounded candidate validation

Use only checks relevant to the claimed delta:

- static contract/trigger assertions when routing text changes;
- deterministic repository regression once after the candidate is internally complete;
- fresh-context behavioral smoke only for claimed context-isolation behavior;
- real-project evidence when practical behavior is claimed;
- installer lifecycle only when install/manifest/managed identity changes;
- visual/runtime/process acceptance only when those surfaces are affected.

For every new eval ask:

> What independent outside truth enters this validation?

If the answer is “none”, the result may be a contract check but not behavioral proof.

Do not automatically run broad A/B, generational retries, reviewer panels, or synthetic evals that share the same ground truth.

### Stage P6 — Adopt one change at a time

For each accepted candidate:

1. change only approved files;
2. keep Core/catalog/manifest unchanged unless required by the approved integration form;
3. preserve provenance when source material is substantially reused;
4. run required gates;
5. push feature branch;
6. PR with exact evidence boundary;
7. merge after hosted CI;
8. verify post-merge CI;
9. update personal install only if installed artifact changed;
10. sync `TASKS.md` only after the real state exists.

Do not bundle another idea because the first one passed.

### Stage P7 — Freeze and real-use observation

After adoption:

1. freeze the change;
2. use JOENESS in real projects;
3. collect only outcome-changing feedback;
4. distinguish a specific complaint from a reusable pattern;
5. reopen only on repeated evidence or material safety defect.

## 8. Evidence ledger shape

Use existing evidence surfaces where possible. Do not create a new document per thought.

| Field | Meaning |
|---|---|
| source mechanism | exact Paperthin file/commit or exact JOENESS seam |
| JOENESS overlap | current Core/skill/contract that already covers part of it |
| observed gap | exact real-project/transcript/evidence pointer |
| identity status | exact / partial / unverified source/runtime/revision binding |
| candidate form | reject / park / reference / skill tweak / new skill / Core |
| claimed benefit | one falsifiable behavior change |
| proof surface | what can actually prove that claim |
| result | pass / fail / unverified / no-change |
| boundary | what this evidence does not prove |

## 9. Decision principles

1. **No-change is first-class.** Prior art/incidents can validate the current design without creating work.
2. **Mechanism over branding.** Tool/plugin/skill names do not prove execution semantics.
3. **Current artifact/state beats narrative.** Actual visual/runtime/process effects outrank descriptions of what was supposed to happen within their evidence layer.
4. **One layer does not prove another.** Build/deploy/process/visual/user-acceptance/tool-contract evidence stay separate.
5. **Fresh context is a tool, not automatic proof.** Use it only when context contamination is the actual failure mode.
6. **One symptom is evidence, not a global rule.** Cross-context evidence inside one project is stronger than one symptom but still weaker than cross-project repetition.
7. **Independent truth matters.** Self-generated mocks, expected values, or implementation-mirroring tests cannot by themselves prove external correctness.
8. **Delegation does not expand authority.** Subagents inherit the relevant user/project tool/write/side-effect boundary.
9. **Retry permission is not diagnosis permission.** A user-authorized retry does not erase existing evidence-based retry/stop constraints.
10. **Restraint is measurable.** If P3 finds existing rules sufficient, the correct result is better enforcement/observation or no change, not a new rule.

## 10. Immediate next action

Completed before Dororong review:

1. P0 baselines frozen.
2. P1 mechanism extraction complete and source identity corrected.
3. RVR visual-verification incident registered.
4. Open Design tool-boundary incident integrated into the same evidence intake.
5. P3 now has explicit bounded questions for visual criteria/invariants, validation independence, lesson transfer, request/tool-boundary understanding, tool execution identity, delegation, and retry nonexecution.
6. M4 relation recorded without changing M4 status or `TASKS.md`.

Next:

1. let Dororong M1 reach its existing completion / partial / blocked boundary under unchanged installed JOENESS;
2. collect Dororong closeout evidence without injecting any candidate rule from this roadmap;
3. run Stage P3 once using P1 + combined RVR + Dororong evidence;
4. separately carry the Open Design contract-conflict evidence lead into M4 when that existing milestone resumes;
5. advance zero to at most three candidates to bounded design.

Until that review, JOENESS Core v8 and the six public skills remain frozen.
