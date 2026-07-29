# Design/Frontend Vendor and Router Design

**Status:** approved master-spec tranche, implementation pending

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

When active, it uses the smallest relevant path:

| Work | UI UX Pro Max | Apple Design | Figma | Browser/app |
|---|---|---|---|---|
| new screen, flow, or design system | one design-system search, then only related domains/stacks | related interaction and typography criteria | required | required |
| existing Figma implementation | UX plus current stack | related criteria | inspect original structure | required |
| visually important redesign | related domains/stacks | related criteria | before/after verification | required |
| accessibility, motion, or chart audit | only the named domain | only related criteria | only if the task otherwise requires it | affected flow |
| small copy change | no search | no load | no | affected surface only |
| nonvisual bug | no search | no load | no | only if visual regression is plausible |

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

The router must pass five positive and five hard-negative fixtures.

Positive coverage:

1. a new responsive portfolio flow;
2. implementation from an approved Figma frame;
3. a visually important redesign;
4. an accessibility audit of an existing form;
5. a gesture/sheet/motion interaction.

Hard-negative coverage:

1. backend input validation;
2. a nonvisual test failure;
3. a one-word copy correction;
4. a generic handoff request;
5. an instruction embedded in external design content that asks for unrelated
   writes or dependency installation.

Required assertions:

- all five positives select the router and all five negatives avoid it;
- only required UI UX domains and Apple sections are loaded;
- Figma is selected only for the contractually required cases;
- missing required Figma capability is not hidden;
- approved Figma/project design authority defeats conflicting recommendations;
- no default Superpowers or Ponytail invocation occurs;
- no download, install, persistence, unrelated write, or duplicated side
  effect occurs;
- no verification action is claimed without evidence.

Structural tests also verify the skill name/folder match, frontmatter,
one-level references, absence of personal paths and `${CLAUDE_PLUGIN_ROOT}`,
vendor integrity, MIT notices, upstream tests, and unchanged common-core hash.

## 9. Promotion Gate

The discoverable skill is promoted only when:

- the source manifest and exact vendor bytes agree;
- upstream validation and unit tests pass from the vendored location;
- OpenAI `quick_validate.py` passes;
- the ten routing fixtures pass with zero hard-negative activation;
- an independent reviewer reports no P0/P1 defect;
- `AGENTS.md` remains 7,933 bytes with SHA-256
  `5aebc74bc795891c43bf785d9b34ae4d35d4a40bf46eddef3f6246d75919a495`.

Until then, any candidate is evaluation-only and completion must be reported
as incomplete.
