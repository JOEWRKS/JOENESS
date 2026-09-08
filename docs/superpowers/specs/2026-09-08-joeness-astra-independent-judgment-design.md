# JOENESS 0.2 Astra Judgment — Design Specification

**Date:** 2026-09-08  
**Status:** APPROVED DESIGN / IMPLEMENTATION NOT STARTED  
**Target:** GPT-6 Astra / xhigh  
**Base:** `main` at `5e7497bd104527d5e6dbfc36011f0f5ee3668ff5`  
**Working branch:** `codex/joeness-v0.2-astra-judgment`

## 1. Decision

Reopen JOENESS from the current Astra-native zero-runtime state with one narrowly scoped active behavioral overlay: **Independent Judgment**.

This is not a restoration of the historical broad Common Core, public skills, vendors, plugin routing, or the old GPT-5.6 harness bundle.

The release identity becomes:

- product name: `JOENESS`
- version: `0.2-astra-judgment`
- target model: `gpt-6-astra`
- reasoning effort: `xhigh`
- runtime mode: minimal managed Common Core block
- active public skills: none
- default vendors: none
- plugin routing: none

The single active purpose is to reduce a repeatedly observed Astra failure mode: treating user pushback, doubt, preference, or challenge as an automatic correction instead of evidence to evaluate independently.

## 2. Why the zero-runtime decision is being reopened

JOENESS `0.1-astra-native` intentionally closed the behavioral runtime because the earlier broad safety overlay did not demonstrate unique material value over Bare Astra. The repository therefore required a real observed Astra failure plus evidence of a narrow useful correction before adding runtime behavior again.

A cross-domain failure has now been observed in normal work:

1. the agent reaches a reasoned conclusion;
2. the user challenges or questions it without necessarily issuing a new decision;
3. the agent too readily reverses or weakens the conclusion;
4. the reversal is sometimes driven more by conversational agreement than by new evidence, changed constraints, or a genuine authority decision.

This is materially different from correctly obeying an explicit user decision. The missing behavior is not resistance to users; it is **classification and re-evaluation before changing judgment**.

This observed failure satisfies the repository's reopening criterion sufficiently to justify a minimal candidate. It does not justify restoring the historical broad Core.

## 3. Product behavior

The active rule must preserve four distinctions.

### 3.1 Challenge is evidence, not automatic correction

Questions, concerns, preferences, objections, and challenges should trigger re-evaluation. They do not by themselves prove the previous conclusion was wrong.

### 3.2 Explicit decisions remain authoritative where the user owns the decision

If the user explicitly chooses a direction, accepts a trade-off, changes a product preference, or otherwise makes a decision within their authority, follow it.

The overlay must not turn the agent into an argumentative or disobedient system.

### 3.3 Re-evaluation must use the actual task contract

When challenged, compare the prior judgment against:

- the current goal;
- available evidence;
- project/repository truth;
- constraints;
- trade-offs;
- explicit authority boundaries.

If the prior judgment still holds, keep it and explain the reason. If the challenge exposes better evidence or a mistaken assumption, revise the judgment.

### 3.4 Agreement is not the optimization target

Surface material downsides, contradictions, wasted work, invalid assumptions, and unnecessary complexity even when the result is recommending against a user's proposal.

The objective is better progress toward the user's actual goal, not conversational agreement.

## 4. Active rule text

The active payload should remain small enough to inspect as a single managed block.

Canonical content:

```text
# JOENESS — Independent Judgment

Treat user questions, challenges, concerns, and preferences as evidence to evaluate, not automatic corrections.

Do not change a prior conclusion merely because the user pushes back. Re-evaluate it against the goal, available evidence, constraints, authority, and trade-offs. If the prior judgment still holds, say so and explain why; if the challenge exposes better evidence or a mistaken assumption, revise the judgment.

Distinguish a challenge from an explicit decision or instruction. Explicit user decisions control where the user has authority; disagreement, uncertainty, or preference alone does not automatically replace an evidence-based conclusion.

Do not optimize for agreement. Surface material downsides, contradictions, invalid assumptions, and unnecessary work even when that means recommending against the user's proposal.
```

No stage framework, roadmap framework, reviewer workflow, design policy, or domain-specific rule is added to the runtime payload.

## 5. Alternatives considered

### A. Keep `0.1-astra-native` zero runtime

**Benefit:** no runtime complexity, no risk of overcorrection.  
**Rejected because:** the observed failure is now concrete and cross-domain enough to justify a narrow correction candidate.

### B. Restore the historical broad Common Core

**Benefit:** reuses previously developed safety/workflow material.  
**Rejected because:** it recreates the framework overhead that Astra rebaseline failed to justify and would confound whether Independent Judgment itself provides value.

### C. Add only documentation, no installed behavior

**Benefit:** no installer/runtime changes.  
**Rejected because:** a repository note that is not loaded into the model does not address the observed runtime behavior.

### D. Minimal Independent Judgment overlay

**Selected.** It targets one observed failure, preserves the Astra-native reduction everywhere else, and is independently falsifiable.

## 6. Repository structure

Create a new active source file rather than repurposing the historical broad `common-core.md`.

Active source:

`astra-judgment-core.md`

Historical `common-core.md`, eval candidates, skills, vendor source, and compatibility evidence remain unchanged except for documentation that clarifies they are not active.

The active source is installed only as the existing JOENESS-owned managed block inside Codex user `AGENTS.md`, using the repository's existing markers:

- `<!-- JOEWRKS-HARNESS:BEGIN -->`
- `<!-- JOEWRKS-HARNESS:END -->`

No whole-file runtime payload is required for the new release beyond the ownership state needed for safe Check/Apply/Remove semantics.

## 7. Manifest identity

Update `vendor/source-manifest.json` so the active distribution is machine-readable and hash-bound.

Required active values:

- `schemaVersion`: `2`
- `release.name`: `JOENESS`
- `release.version`: `0.2-astra-judgment`
- `release.entrypoint`: `JOENESS.ps1`
- `target.model`: `gpt-6-astra`
- `target.reasoningEffort`: `xhigh`
- `runtimeMode`: `common-core`
- `activeCommonCore.path`: `astra-judgment-core.md`
- `activeCommonCore.sha256`: exact SHA-256 of the committed `astra-judgment-core.md` bytes used by the release
- `managedRuntimeFiles`: empty array
- `publicSkills`: empty array
- `defaultVendors`: empty array
- `pluginRouting`: null

The current GPT-5.6 Control compatibility identity must be preserved unchanged in meaning and values:

- compatibility key: `controlSixSkill`
- commit: `80c79e9f4be91d730b1b3cdc62d7bf51508895e8`
- distribution manifest path: `vendor/source-manifest.json`
- distribution manifest bytes: `37845`
- distribution manifest SHA-256: `f7866fb42f3336e0bd82f01e0f3940ab8b6a5d5b55e4677b9306e461be3c0158`
- Control active Common Core path: `evals/candidates/interaction-safety-core-v8.md`
- Control active Common Core SHA-256: `41b3f8435c6077a9289e0c9d3315aa00d68a96e2e9add7168de6bb42f9730aea`
- active skill names: `design`, `handoff`, `project`, `spec`, `ticket`, `visual-check`
- whole-file count: `64`
- selection SHA-256: `f4a3c7fbacd8d6f8cfb1b958c094e73f5ba739a1bb633d3fff5614e34b8a7587`
- canonicalization string remains exactly: `ordinal-sorted localPath=sha256 UTF-8 lines joined by LF without trailing LF`

Do not mix evaluation result records into the active distribution identity.

## 8. Installer behavior

The current `scripts/sync-harness.ps1` is intentionally hard-coded to accept only the zero-runtime Astra identity. It must be updated narrowly to support the new manifest-driven active Common Core again without reactivating skills/vendors.

### 8.1 `-Check`

For a clean new Astra environment:

- validate the source manifest and active core hash;
- inspect the target `AGENTS.md` and JOENESS ownership state;
- return `ready` / `changesRequired: true` when the managed Independent Judgment block is absent and installation is safe;
- return `current` / `changesRequired: false` when the exact owned block and state match;
- return `blocked` on ambiguous ownership, marker collision, drift, unsafe path, or malformed state;
- continue to detect exact supported GPT-5.6 Control installs as `legacy` without silently overwriting them.

### 8.2 `-Apply`

Unlike `0.1-astra-native`, Apply becomes supported for the new release.

Apply must:

1. validate manifest/core hashes before writes;
2. preserve all bytes outside the JOENESS managed block;
3. create/update the managed block only when ownership and preflight are safe;
4. write/update JOENESS ownership state;
5. back up affected pre-change bytes before replacement;
6. read back written files;
7. fail closed and roll back when a write cannot be verified;
8. never install public skills, vendors, plugin routing, or historical broad Core content.

### 8.3 `-Remove`

Remove must support both:

- the current exact `0.2-astra-judgment` owned install;
- the exact historical GPT-5.6 Control compatibility identity already supported by the repository.

For the current release, Remove deletes only the owned managed block and JOENESS state, preserving user bytes before/after the block.

Drifted or uncertain ownership remains blocked rather than repaired destructively.

## 9. Migration behavior

### Clean Astra environment

`Check → ready`, then explicit `Apply` installs the Independent Judgment block.

### Existing exact `0.2` install

`Check → current`; `Apply` is idempotent/no additional changes.

### Existing `0.1-astra-native` environment

Because `0.1` installed no runtime payload, it behaves like a clean environment unless residual JOENESS-owned legacy state exists. Any residual ownership ambiguity must be surfaced rather than overwritten.

### Exact GPT-5.6 Control install

Preserve the current compatibility rule: report `legacy`; require explicit safe removal before installing the Astra judgment overlay. Do not auto-migrate the historical Control bundle in one operation.

### Drifted/forged/partial historical install

Continue to fail closed.

## 10. README and user-facing documentation

Rewrite the README's top-level positioning so it no longer claims that JOENESS requires no Astra runtime by default.

The README must clearly explain:

1. `0.1-astra-native` was a deliberate zero-runtime release based on then-current evidence;
2. `0.2-astra-judgment` reopens runtime behavior because a new specific failure was observed in Astra;
3. only Independent Judgment is active;
4. the historical broad Core, skills, vendors, and plugin routing remain inactive;
5. what the rule does;
6. what it deliberately does not do;
7. installation/check/remove commands;
8. legacy GPT-5.6 removal behavior;
9. version history and evidence standard for adding future rules;
10. rollback/removal expectations.

Document both Korean primary guidance and concise English guidance, following the repository's current README convention.

## 11. AGENTS.md update

Update repository-maintainer guidance to reflect the reopened minimal runtime:

- active Astra distribution contains exactly one Common Core behavior;
- historical broad Common Core remains inactive;
- future rules still require real observed failure plus unique benefit evidence;
- do not expand this release into JOEFLOW/JOEDESIGN/domain workflow routing;
- compatibility removal remains fail-closed;
- tests and byte-preservation rules remain mandatory.

## 12. Handoff / decision history

Do not rewrite the 2026-09-05 Astra-native transition handoff. It is historical evidence of a valid decision under the evidence available then.

Add a new dated handoff/decision document explaining:

- observed post-closure failure;
- why it satisfies the reopening criterion;
- why only one rule is activated;
- what remains intentionally inactive;
- release identity and verification result;
- rollback/revisit conditions.

## 13. Test strategy

Implementation must use the repository's existing PowerShell and Node test structure and add the smallest new coverage needed.

### Distribution identity tests

Verify:

- version is `0.2-astra-judgment`;
- target remains `gpt-6-astra` / `xhigh`;
- runtime mode is active Common Core;
- active core path/hash are exact;
- zero public skills;
- zero default vendors;
- null plugin routing;
- zero managed whole-file runtime payload;
- historical Control compatibility identity remains byte-for-byte/logically unchanged.

### Check tests

Cover at minimum:

- clean target → `ready`;
- exact installed block/state → `current`;
- missing state with matching unowned marker → fail-closed ownership behavior;
- duplicate/incomplete markers → `blocked`;
- drifted owned block → `blocked`;
- exact GPT-5.6 Control → `legacy`.

### Apply tests

Cover at minimum:

- clean install preserves pre-existing user `AGENTS.md` bytes;
- idempotent repeat Apply;
- update from an owned prior `0.2` block identity if a future source hash changes within the same supported test fixture;
- backup + readback behavior;
- simulated write/readback failure rolls back;
- no skill/vendor files are created.

### Remove tests

Cover at minimum:

- exact `0.2` install removal restores surrounding user bytes;
- state removal verified;
- drift blocks removal;
- legacy GPT-5.6 removal tests continue passing;
- no unrelated/user files removed.

### Behavioral A/B evidence

Add a small Astra evaluation set separate from the release manifest. At minimum cover:

1. user challenges a correct technical conclusion with a false claim;
2. user proposes unnecessary complexity;
3. user expresses doubt without a new decision;
4. user states a preference as if it were a fact;
5. user provides a genuinely better correction;
6. user explicitly changes a decision they own;
7. user requests a direction conflicting with a previously approved constraint;
8. user asks a leading agreement-seeking question.

Compare Bare Astra vs Astra + Independent Judgment on:

- unjustified agreement/reversal rate;
- correct acceptance of genuine corrections;
- compliance with explicit user decisions;
- unnecessary argumentative resistance;
- task usefulness.

Release implementation may land with the rule as the requested user-directed candidate, but broad future expansion must remain gated on evaluation evidence.

## 14. Versioning rationale

Use `0.2-astra-judgment`, not `0.1.x`, because runtime semantics materially change:

- `0.1-astra-native`: no active behavioral runtime;
- `0.2-astra-judgment`: one active managed behavioral overlay.

This version change communicates that installation semantics and `Apply` behavior changed even though scope remains intentionally tiny.

## 15. Non-goals

Do not:

- restore `common-core.md` as active;
- restore the 1,690-byte Lean Kernel as active;
- restore historical public skills;
- restore design vendors;
- add JOEFLOW or JOEDESIGN routing;
- add plugin routing;
- add stage-aware workflow machinery to runtime;
- add domain-specific policy;
- make the agent argumentative for its own sake;
- weaken explicit user authority;
- infer that every user challenge is wrong.

## 16. Failure and rollback criteria

The change should be reconsidered or removed if evaluation or real use shows any of the following materially:

- the agent ignores explicit user decisions;
- the agent becomes needlessly argumentative;
- correct user corrections are rejected more often;
- the rule adds verbosity/friction without improving judgment;
- Bare Astra no longer exhibits the motivating failure in future model baselines;
- a smaller native/model setting solves the issue without a JOENESS overlay.

`-Remove` is the operational rollback path for an installed exact release.

## 17. Release claim boundary

Do not claim `JOENESS 0.2 Astra Judgment` is complete until:

- the implementation diff matches this spec;
- targeted tests pass;
- documented current-release tests pass;
- historical-integrity/legacy-removal tests pass;
- manifest/core hashes are verified from committed bytes;
- branch remote readback confirms the pushed commit;
- README and handoff accurately match runtime behavior.

Main-branch integration is allowed only after those checks and final diff review.

## 18. Canonical summary

> JOENESS 0.2 does not restore the old harness. It adds one independently testable Astra correction: user pushback is evidence to re-evaluate, not an automatic reason to agree or reverse. Explicit user decisions remain authoritative where the user owns the decision. Everything else stays Astra-native unless a future observed failure independently earns another minimal rule.
