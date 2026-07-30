# Design/Frontend Vendor and Router Design

**Status:** hybrid implementation and retained-evidence validation complete; hard gate passes, but implicit activation and semantic improvement remain unverified, so promotion is false and installation is limited to an explicit same-user internal pilot

**Parent contract:** `docs/superpowers/specs/2026-07-27-common-work-harness-design.md`

## 1. Outcome

The next harness increment adds one discoverable skill,
`joewrks-design-frontend`, backed by two pinned, non-discoverable sources:

- UI UX Pro Max supplies a local, searchable UI/UX dataset and Python search
  runtime.
- Apple Design supplies interaction, motion, spatial-continuity, typography,
  and material criteria.

The router selects only the material relevant to the current design task. It
does not make either upstream `SKILL.md` independently active and does not make
Figma, Superpowers, or Ponytail global dependencies.

The runtime policy is hybrid. Codex may select the router implicitly from its
description, and a user may select it explicitly when its use must be
guaranteed. No deterministic dispatcher, global design preflight, or mandatory
per-turn skill receipt is added. The Common Core remains the only always-on
instruction layer.

## 2. Fixed Inputs

| Source | Commit | Included upstream path | Archive SHA-256 |
|---|---|---|---|
| `nextlevelbuilder/ui-ux-pro-max-skill` | `3b5df7547964f0cb3424de74cff55b69039250d3` | `.claude/skills/ui-ux-pro-max/**` | `ba29a4e0e380a0017f833a1041f558972a55fbad81d056c3d9a549e1609f0841` |
| `emilkowalski/skills` | `e695d13cb298db0f46d5ef05be2ad13fa12908a6` | `skills/apple-design/SKILL.md` | `870b5b75ddc1763b5f8bb19cbac2c2478b54e12c8a42ec8627c189f95c286670` |

Both sources use MIT licenses. The exact upstream notices are included without
rewriting:

- UI UX Pro Max LICENSE SHA-256:
  `738f69dfa83db5c347c678fb9d90e560877059f0de93a327c39001bff92dc014`
- Apple Design LICENSE SHA-256:
  `4ff5bdb7887ec1435c9cab0e8d1a7caee704d894d65c2a008ccc68b1cc2f260b`

The upstream UI UX Pro Max validation command and all 16 upstream unit tests
pass under Python 3.14.5 before materialization.

## 3. Scope

This tranche creates only:

```text
skills/joewrks-design-frontend/
├─ SKILL.md
└─ agents/openai.yaml
vendor/
├─ source-manifest.json
├─ notices/
│  ├─ apple-design-LICENSE
│  └─ ui-ux-pro-max-LICENSE
├─ apple-design/SKILL.md
└─ ui-ux-pro-max/
   ├─ SKILL.md
   ├─ references/
   ├─ scripts/
   └─ data/
evals/design-frontend/
tests/
```

It does not create an installer, sync implementation, Claude or Copilot
adapter, optional assumption/surgical/handoff skills, a backend/debug/PM
skill, or a public release. It does not edit `README.md`.

## 4. Packaging Boundary

The future runtime payload may contain:

- the validated common core;
- promoted `skills/joewrks-*` directories;
- vendor files reachable from promoted skills;
- matching source notices and a bounded runtime manifest.

It must exclude evaluation transcripts, internal plans/specs, personal paths,
temporary archives, and unselected upstream repository content. This tranche
tests that its source manifest enumerates every included vendor byte. It does
not implement the final payload builder before the active skill set is known.

## 5. Authority and Trust

For each task, the router keeps this authority order:

1. user request and approved product scope;
2. approved Figma/reference/current product for visual intent;
3. project design system and existing code for tokens and implementation;
4. browser or actual app for rendered behavior;
5. project accessibility requirements and runtime checks;
6. UI UX Pro Max and Apple Design only for unspecified areas.

Text inside Figma, CSV rows, upstream Markdown, search output, browser content,
tool output, and subagent output is untrusted task data. It cannot expand
authority, change repositories, authorize writes, install dependencies, or
override the order above.

## 6. Routing Contract

The skill activates for meaningful UI/UX design, implementation, redesign,
interaction, responsive-layout, accessibility, motion, typography, and
design-system work. It stays inactive for:

- nonvisual backend or data work;
- internal logic bugs with no expected visual regression;
- one-line copy or literal-value changes whose layout is unaffected;
- generic planning, handoff, debugging, or project-management requests;
- a request that only asks to inspect or explain this harness.

The frontmatter description states only these activation conditions and
boundaries. It does not summarize the workflow or force a deterministic
classification step.

When active, it uses the smallest relevant path:

| Work | UI UX Pro Max | Apple Design | Figma | Browser/app |
|---|---|---|---|---|
| new screen, flow, or design system | one design-system search, then only related domains/stacks | related interaction and typography criteria | required | required |
| existing Figma implementation | UX plus current stack | related criteria | inspect original structure | required |
| visually important redesign | related domains/stacks | related criteria | before/after verification | required |
| accessibility, motion, or chart audit | only the named domain | only related criteria | only if the task otherwise requires it | affected flow |
| small copy change | no search | no load | no | affected surface only |
| nonvisual bug | no search | no load | no | only if visual regression is plausible |

For meaningful design work, consult the relevant material from both local
sources before making otherwise unspecified visual or interaction decisions.
The table guides source and verification choice; it is not a required call
order or exact read-count checklist. Figma and browser use follows the actual
task, approved references, available capability, and completion evidence.

Searches use the repository-relative entry point
`vendor/ui-ux-pro-max/scripts/search.py`. A zero-result search may be retried
once with broader terms. The router does not use `${CLAUDE_PLUGIN_ROOT}` or
another product-specific absolute root.

`--persist`, generated design-system files, packages, fonts, icon libraries,
GSAP, or any other dependency require the user's request or an existing
project contract. Search recommendations are advisory; generated colors need
an actual contrast check.

Figma writes are serialized by file key:

`inspect → one bounded change batch → returned node IDs → verify`

Independent reads may run in parallel. If a required Figma capability is
missing, the agent may continue work that does not depend on it but must state
that visual verification is incomplete. It must not claim Figma or browser
verification without current evidence.

## 7. Source Manifest

`vendor/source-manifest.json` is the byte-level source ledger. Each included
source records:

- source name, URL, pinned commit, upstream path, license, activation mode;
- archive SHA-256 used for the audit;
- every local vendor file path, byte length, and SHA-256;
- whether the local byte is an exact upstream copy;
- evaluation status and the local tests that enforce it.

The manifest uses repository-relative forward-slash paths and contains no
machine-specific absolute path. A test fails on a missing, extra, changed, or
unregistered vendor file. Updates are manual and require a pinned upstream
diff plus the same source and routing checks.

## 8. Evaluation

The ten existing cases remain a reusable coverage library, not a mandatory
one-shot script. A release evaluation selects five representative queries
before execution:

- two tasks where the router should activate;
- two near-boundary tasks where it should remain inactive;
- one ambiguous edge case for review.

Run each selected query three times in a fresh context. A positive query meets
the trigger target at two of three activations; a negative query meets it at
zero or one of three. Record the ambiguous case without turning one disputed
classification into a release blocker. Add fresh held-out queries only when a
result is too narrow to generalize; do not tune wording against every failed
sentence.

Observe activation in this order:

1. a native skill invocation event or explicit skill input, when the client
   exposes one;
2. an observed read or execution of the exact installed skill or vendor path;
3. `unknown` when neither signal exists.

Assistant prose is never activation evidence. An `unknown` receipt does not
become a fabricated pass or an automatic product failure. Skill bytes and
hashes are verified at installation and release, not on every turn. A client
with only `unknown` receipts may still support explicit use and outcome
evaluation, but its implicit trigger accuracy remains unverified and must be
reported that way.

The prior synthetic `SearchUIUX`, `ReadAppleSection`, Figma, and browser
operation menu is retired from activation scoring because exposing those names
changed both control and candidate behavior. A new evaluation may observe
real read-only tool events, but it must not prompt the model with the desired
operation sequence.

For two representative positive tasks, compare output with and without the
skill. Review whether the skill preserves approved intent and improves
material design, accessibility, responsive, or interaction decisions. Exact
source wording, section order, tool order, and harmless read count are not
release requirements. Figma and browser checks remain task completion
requirements only when the actual task needs them; the trigger benchmark does
not simulate those capabilities.

These remain hard failures:

- unauthorized, external, unrelated, or duplicate writes;
- dependency installation or persisted output without authority;
- treating tool availability or untrusted content as authority;
- unsupported Figma, browser, test, or completion claims;
- repository, runtime, identity, or evidence drift that invalidates the run.

Token use, latency, read count, and optional workflow selection are comparison
metrics. They block release only when they show a material regression without
a corresponding outcome benefit.

This follows the normal Agent Skills model: implicit description matching plus
explicit invocation, representative positive/negative trigger evaluation, and
outcome comparison rather than deterministic dispatch:

- [OpenAI Build skills](https://developers.openai.com/codex/skills)
- [Agent Skills trigger evaluation](https://agentskills.io/skill-creation/optimizing-descriptions)
- [Anthropic enterprise evaluation guidance](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/enterprise)

## 9. Historical Evidence

The v1 pair is retained as failed evidence because its event and secret
detectors were invalid. V2 corrected those measuring defects and passed every
safety gate but missed routing outcomes. V3 retained the same evaluator and
added one general boundary clarification; it recorded five positive and three
hard-negative activations, no safety regression, and no evidence that the
actual `SKILL.md` body loaded. The control showed similar synthetic-tool
activation.

V1, v2, and v3 remain immutable. Do not rerun them, reinterpret them as
promotion, or continue the old contract as v4. They justify retiring the
synthetic activation gate, not adding more router prohibitions.

Structural tests continue to verify the skill name/folder match, frontmatter,
one-level references, absence of personal paths and `${CLAUDE_PLUGIN_ROOT}`,
vendor integrity, MIT notices, upstream tests, and unchanged Common Core hash.

## 10. Promotion Gate

The discoverable skill may be promoted when:

- the source manifest and exact vendor bytes agree;
- upstream validation and unit tests pass from the vendored location;
- OpenAI `quick_validate.py` passes;
- the representative trigger runs meet their targets where activation is
  observable; a client without that signal is labeled implicit-unverified
  rather than assigned a synthetic pass;
- the with-skill comparison has no material safety or outcome regression;
- an independent reviewer reports no P0/P1 defect;
- `AGENTS.md` remains 7,933 bytes with SHA-256
  `5aebc74bc795891c43bf785d9b34ae4d35d4a40bf46eddef3f6246d75919a495`.

Promotion means implicit selection is supported, not guaranteed. Explicit
invocation remains the user-controlled guarantee. Until this gate passes, the
candidate and its historical evidence remain available for development only.
