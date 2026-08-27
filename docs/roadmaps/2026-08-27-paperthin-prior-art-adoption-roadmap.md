# JOENESS × Paperthin Prior-Art Adoption Roadmap

- Status: planning / no adoption approved
- JOENESS baseline: `main@1d867465cc2f99788a0b478d5fba4eb090fcde83`
- Active Core baseline: `interaction-safety-core-v8.md` — `2,934 bytes` / SHA-256 `41b3f8435c6077a9289e0c9d3315aa00d68a96e2e9add7168de6bb42f9730aea`
- Public skills baseline: `project`, `ticket`, `design`, `visual-check`, `spec`, `handoff`
- Paperthin research baseline: `LilMGenius/paperthin@3bca079a51bcfff5dafb53d1d7f9f523d66ee317`
- Paperthin license: MIT

## 1. Goal

Use Paperthin as prior art to identify low-level agentic failure patterns that JOENESS does not already cover, then adopt only the smallest changes that earn their way in through real project evidence.

This is not a migration to Paperthin, a dependency installation, or a catalog import. The target remains JOENESS: thin Core, conditional skills, one main writer, evidence-bound completion, minimal persistent state, and no rule accumulation without observed need.

Success means either:

1. a Paperthin-derived mechanism closes a demonstrated JOENESS gap with lower rework or clearer verification; or
2. the mechanism is rejected/parked with an evidence-backed reason and JOENESS remains unchanged.

A no-change result is a valid success.

## 2. Non-goals and hard boundaries

Until an adoption gate is explicitly passed:

- do not modify Core v8;
- do not add, remove, or change public skills;
- do not change installer/manifest behavior;
- do not change current M2/M3/M4/M5/M6 evidence classifications;
- do not install Paperthin into the active JOENESS environment;
- do not import Paperthin's full skill catalog, `.re0/` casebook topology, `sip` orchestration, automatic build loops, symlink/update model, or external-write behavior;
- do not create synthetic eval volume merely to justify a candidate;
- do not treat same-model or multi-agent agreement as proof;
- do not interrupt or alter an active real-project pilot to make it fit this roadmap.

Paperthin concepts should be translated to mechanisms, not copied verbatim. If substantial Paperthin text or code is ever reused, preserve the MIT license notice/provenance required by the source license.

## 3. Working hypothesis

JOENESS and Paperthin overlap in philosophy but operate at different layers.

- JOENESS owns workflow authority, scope, write safety, retry limits, evidence, completion, project/ticket/spec/visual/handoff boundaries.
- Paperthin supplies low-level reflexes around artifact hygiene, request interpretation, fresh-context comprehension, validation independence, iteration learning, human re-entry, and perspective diversity.

The adoption question is therefore not "which Paperthin skills should JOENESS install?" but:

> Which failure reflex is missing from JOENESS, where is the lowest-cost layer that can express it, and what real evidence proves the change is worth its permanent complexity?

## 4. Initial watchlist — hypotheses, not commitments

| Paperthin mechanism | Potential JOENESS value | Default integration guess | Current disposition |
|---|---|---|---|
| `readchk` — silent request-understanding check | catch expensive misreads without confirmation theater | existing route/Core only if repeated common failure; otherwise no change | WATCH |
| `shower` — fresh zero-context comprehension read | prove a spec/handoff stands on its own, not merely that it is factually current | conditional fresh-read check at high-value handoff/spec boundary | WATCH |
| `mandela` — validation leakage audit | prevent self-confirming evals from being mistaken for behavioral proof | evaluation policy/reference, not public runtime skill by default | WATCH |
| `re0-memo` — complaint → pattern → gate | turn real-project failures into reusable lessons without one-case rule accumulation | JOENESS maintenance/review method | WATCH |
| `catchup` — human re-entry from live state | restore owner context after long agent/project gaps | possible future conditional/public skill only if real demand repeats | WATCH |
| `aim` — propose intent from handed-over data | reduce unnecessary "what do you want?" turns | later candidate | PARKED |
| `nba` — one next best action from live state | avoid option menus when the user asks what to do next | later candidate | PARKED |
| `prism` — distinct failure-mode lenses | improve high-risk heterogeneous review | explicit/user-invoked only if ever adopted | PARKED |
| `hate` — one load-bearing objection + cheapest falsification | kill expensive bad plans early | explicit/user-invoked only if ever adopted | PARKED |
| `modelchk` — cheapest sufficient capability/effort | cost/runtime sizing | later, only if JOENESS obtains routing/cost evidence | PARKED |

Explicitly out of adoption scope unless a future project supplies new evidence: full Paperthin catalog, `sip` as an automatic done-gate, `.re0/iteration` as general project topology, automatic restart loops, automatic repo-star/external writes, or broad multi-review by default.

## 5. Roadmap

### Stage P0 — Freeze and bind baselines

Purpose: ensure prior-art research cannot silently rewrite the system being evaluated.

Actions:

1. Bind the JOENESS source baseline to exact `main` SHA, Core v8 identity, six public skills, current manifest state, and current `promotionPass=false` boundary.
2. Bind the Paperthin research baseline to exact source commit and license.
3. Record the currently active real-project pilot(s) and declare them observation sources, not migration targets.

Pass:

- baselines are exact and readable;
- no JOENESS runtime/product file changed;
- existing validation classifications remain unchanged.

### Stage P1 — Prior-art mechanism extraction

Purpose: reduce Paperthin from a 28-skill catalog to a mechanism-level comparison.

Actions:

1. Read the source `SKILL.md` for each WATCH candidate, plus only adjacent docs needed to understand its trigger, mutation authority, fresh-context behavior, and verification rule.
2. For each candidate extract:
   - failure mode;
   - trigger condition;
   - action/reflex;
   - evidence/proof surface;
   - mutation/authority model;
   - stop condition;
   - likely JOENESS overlap/conflict.
3. Separate source fact from JOENESS inference.
4. Do not write a new JOENESS rule during this stage.

Deliverable:

- one compact Paperthin → JOENESS gap matrix; no per-skill research documents.

Pass:

- every WATCH candidate is classified `ALREADY_COVERED`, `GAP_CANDIDATE`, `CONFLICT`, or `NO_EVIDENCE`;
- each classification points to exact JOENESS and Paperthin source evidence.

### Stage P2 — Finish the Dororong live pilot without contamination

Purpose: obtain a real end-to-end JOENESS observation before changing the harness in response to Paperthin.

Actions:

1. Finish the existing Dororong M1 path under the already-installed Core v8 and current six skills.
2. Keep Paperthin ideas out of the pilot's live instructions unless the user independently asks for the same behavior.
3. At closeout collect only observed friction relevant to the watchlist, for example:
   - instruction misread or needless clarification;
   - spec/handoff that required hidden session context;
   - validation that became self-confirming;
   - human context loss after an agent gap;
   - repeated complaint pattern that lacked a reusable gate;
   - excessive or redundant internal review.
4. Preserve successes as evidence too; "JOENESS already handled this" is a valid result.

Pass:

- Dororong's product verdict remains independent of this research;
- pilot observations are bound to actual transcript/artifact/runtime evidence;
- no Paperthin-inspired JOENESS mutation occurred mid-pilot.

### Stage P3 — Evidence-to-pattern fit review

Purpose: test whether any Paperthin mechanism solves an observed JOENESS problem rather than merely sounding useful.

For every `GAP_CANDIDATE`, classify the observed evidence:

- `REPEATED_COMMON_FAILURE` — repeated across distinct candidates/contexts/projects;
- `REAL_SINGLE_PROJECT_GAP` — real and costly, but only one context so far;
- `ALREADY_COVERED_IN_PRACTICE` — current JOENESS handled it adequately;
- `THEORETICAL_ONLY` — no observed need;
- `CONFLICTS_WITH_JOENESS` — would add ceremony, duplicate authority, or weaken safety.

Adoption gates:

- **Core change:** only `REPEATED_COMMON_FAILURE` or a material cross-project safety defect. Core v8 size/freeze constraints still apply.
- **Existing skill change:** at least one real failure at that skill's boundary plus independent supporting evidence that the fix generalizes.
- **New public skill:** unique recurring user value that cannot fit an existing skill without mixing responsibilities; natural trigger must be demonstrable.
- **Internal policy/reference only:** useful validation or maintenance principle with no need for user-facing routing.
- **No change:** default when evidence is insufficient.

Pass:

- no more than three candidates advance;
- every advancing candidate names the exact observed gap it would close;
- "Paperthin has a skill for it" is never an adoption reason.

### Stage P4 — Choose the lowest-cost integration form

Purpose: prevent good ideas from automatically becoming permanent skills or Core rules.

For each surviving candidate choose exactly one:

1. `REJECT` — incompatible or redundant;
2. `PARK` — plausible but evidence insufficient;
3. `REFERENCE` — internal conditional guidance/eval policy only;
4. `EXISTING_SKILL_TWEAK` — smallest change to one current skill;
5. `NEW_CONDITIONAL_SKILL` — only when role/trigger is genuinely unique;
6. `CORE_CANDIDATE` — last resort for repeated common behavior.

Default preference is the lowest numbered form that fully closes the observed gap.

Before implementation, write a bounded design for each advancing candidate covering:

- exact behavior delta;
- trigger and non-trigger boundary;
- authority/mutation boundary;
- observable acceptance;
- failure/stop behavior;
- files expected to change;
- explicit non-goals.

One candidate per implementation branch unless two changes are mechanically inseparable.

### Stage P5 — Bounded candidate validation

Purpose: validate the claimed delta without reopening the old evaluation treadmill.

Use only checks relevant to the candidate:

- static contract/trigger assertions when routing text changes;
- deterministic repository regression exactly once after the candidate is internally complete;
- fresh-context behavioral smoke only when the candidate specifically claims a context-isolation behavior;
- actual project evidence when the claimed value is real-project behavior;
- isolated installer lifecycle only when install/manifest/managed-file identity changes;
- visual/runtime acceptance only when the candidate affects those surfaces.

Do not automatically run:

- broad with-skill vs without-skill A/B;
- multiple generational retries;
- reviewer panels without heterogeneous high-risk failure modes;
- synthetic evals whose scorer/designer/model share the same ground truth.

For any new eval, explicitly answer the Paperthin/`mandela` question:

> What independent outside truth enters this validation?

If the answer is "none", the result may be a contract check but not behavioral proof.

Pass:

- claimed benefit has evidence at the layer where it is claimed;
- unrelated historical boundaries remain unchanged;
- failed or unverified checks remain visible;
- candidate may still be rejected after successful mechanical tests if no practical value is demonstrated.

### Stage P6 — Adopt one change at a time

Purpose: preserve causal attribution and rollback clarity.

For each accepted candidate:

1. update only its approved files;
2. keep Core/public catalog/manifest unchanged unless the integration form requires them;
3. record provenance when source material is substantially reused;
4. run required deterministic gates;
5. push feature branch;
6. PR to `main` with exact evidence boundary;
7. merge normally after hosted CI passes;
8. verify post-merge CI;
9. update personal installation only if the installed artifact changed;
10. sync `TASKS.md` only after the real state exists.

Do not bundle a second Paperthin-derived idea into the same adoption because the first passed.

### Stage P7 — Freeze and real-use observation

Purpose: prevent immediate rule accumulation after adoption.

After each adopted change:

1. freeze it;
2. use JOENESS in real projects;
3. collect only outcome-changing feedback;
4. distinguish a specific complaint from a reusable pattern;
5. reopen this roadmap only when repeated evidence or a material safety defect appears.

A candidate that receives no real-use evidence does not automatically graduate to broader Core policy.

## 6. Evidence ledger shape

Use existing project evidence surfaces where possible. Do not create a new document per thought.

The minimum record for a candidate is:

| Field | Meaning |
|---|---|
| source mechanism | exact Paperthin file/commit and mechanism, not marketing summary |
| JOENESS overlap | current Core/skill/contract that already covers part of it |
| observed gap | exact real-project/transcript/evidence pointer |
| candidate form | reject / park / reference / skill tweak / new skill / Core |
| claimed benefit | one falsifiable behavior change |
| proof surface | what can actually prove that claim |
| result | pass / fail / unverified / no-change |
| boundary | what this evidence does not prove |

## 7. Decision principles

1. **No-change is first-class.** Prior art can validate the current design without creating work.
2. **Mechanism over branding.** Durable JOENESS guidance should describe the underlying behavior; Paperthin remains cited prior art where relevant.
3. **Current artifact/state beats author narrative.** Paperthin's "trust the artifact, not the author" is compatible with JOENESS evidence-first behavior.
4. **Fresh context is a tool, not automatic proof.** Use it when session bias is the failure mode; bind conclusions to artifact/state evidence.
5. **One symptom is evidence, not a global rule.** Generalize only after cross-context support.
6. **Independent truth matters.** Mechanical contract checks and self-scored outputs are not substitutes for external/runtime/user evidence.
7. **Restraint is measurable.** A review that finds no gap should leave JOENESS unchanged.
8. **One main writer remains the default.** Paperthin multi-perspective ideas do not authorize concurrent product writes.
9. **User-only actions remain user-owned.** External/shared writes, high-cost perspective fan-out, release/merge, and other consequential actions do not become automatic reflexes merely because prior art does so.

## 8. Immediate next action

Do not implement a Paperthin-derived change yet.

Next:

1. let the active Dororong M1 pilot reach its existing completion/partial/blocked boundary;
2. in parallel, perform Stage P1 read-only mechanism extraction against the pinned Paperthin commit;
3. when both exist, run Stage P3 once to decide whether zero, one, or at most three candidates deserve a bounded design.

Until that review, JOENESS Core v8 and the six public skills remain frozen.
