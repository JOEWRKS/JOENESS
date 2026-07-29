# Design/Frontend Vendor and Router Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan.

**Goal:** Materialize the two pinned design sources as non-discoverable vendor
data, create one minimal `joewrks-design-frontend` entry point, and promote it
only after byte-level, structural, routing, and behavior checks pass.

**Architecture:** The root common core stays unchanged. Exact upstream bytes
live under `vendor/`, one source manifest owns provenance and integrity, and
one discoverable skill routes only meaningful design/frontend work to the
smallest relevant vendor content and required Figma/browser capability.

**Tech Stack:** Markdown skills, JSON fixtures/manifests, Node.js built-in test
runner, Python 3 standard library and the pinned upstream search runtime,
PowerShell for existing repository contracts.

## Global Constraints

- Do not read, edit, stage, or overwrite the user's untracked `README.md`.
- Do not rerun any Common Core v1-v5 one-shot evaluation.
- Keep `AGENTS.md` byte-identical at 7,933 bytes and SHA-256
  `5aebc74bc795891c43bf785d9b34ae4d35d4a40bf46eddef3f6246d75919a495`.
- Do not run upstream installers, package managers, or runtime downloads.
- Do not expose either upstream `SKILL.md` as an independently discoverable
  skill.
- Use exact bulk copy only for pinned third-party bytes; author all JOEWRKS
  files with `apply_patch`.
- Commit only explicit paths and inspect the staged diff before each commit.

---

### Task 1: Freeze the source and packaging contract

**Files:**

- Create: `tests/design-vendor-integrity.tests.mjs`
- Create: `vendor/source-manifest.json` after the failing test exists

**Step 1: Write the failing integrity test**

The test must require:

- exactly the UI UX Pro Max subtree, Apple `SKILL.md`, and two notices;
- repository-relative local paths, byte lengths, SHA-256, pinned commits,
  archive hashes, license hashes, activation mode, and evaluation state;
- no missing, changed, extra, symlinked, or unregistered vendor file;
- no absolute personal path in the manifest;
- the fixed `AGENTS.md` hash.

**Step 2: Run the RED check**

Run:

```powershell
node --test tests/design-vendor-integrity.tests.mjs
```

Expected: FAIL because the source manifest and vendor files do not exist.

**Step 3: Materialize exact upstream bytes**

Copy only:

- `.claude/skills/ui-ux-pro-max/**` at
  `3b5df7547964f0cb3424de74cff55b69039250d3`;
- `skills/apple-design/SKILL.md` at
  `e695d13cb298db0f46d5ef05be2ad13fa12908a6`;
- each repository's root `LICENSE` into `vendor/notices/`.

Do not modify these copied bytes.

**Step 4: Generate the bounded manifest**

Record every included local file with exact bytes and SHA-256. Record both
archive SHA-256 values and exact license provenance. Use forward-slash,
repository-relative paths only.

**Step 5: Run the GREEN checks**

Run:

```powershell
node --test tests/design-vendor-integrity.tests.mjs
python vendor/ui-ux-pro-max/scripts/validate_data.py
python -m unittest discover -s vendor/ui-ux-pro-max/scripts/tests -p "test_*.py" -v
```

Expected: all pass; upstream suite reports 16 tests.

**Step 6: Commit**

Commit exact paths with message:

```text
vendor: pin design source bundle
```

### Task 2: Establish the routing baseline

**Files:**

- Create: `evals/design-frontend/cases.json`
- Create: `tests/design-frontend-routing.tests.mjs`

**Step 1: Write ten fixtures**

Add exactly five positive and five hard-negative requests from the design
spec. Each fixture includes:

- stable ID and request text;
- approved scope and visual authority;
- expected router activation;
- expected UI UX domains and Apple criteria;
- Figma/browser requirement;
- forbidden actions and completion claims.

No pass/fail rubric text may be included in the model-facing request.

**Step 2: Write the baseline test**

The test first confirms the ten-case shape and then requires a
`joewrks-design-frontend` candidate matching the expected routing contract.

**Step 3: Run the RED check**

Run:

```powershell
node --test tests/design-frontend-routing.tests.mjs
```

Expected: FAIL because no router skill exists.

**Step 4: Preserve baseline evidence**

Record the failure reason as `router_absent`; do not invent a no-skill
behavioral failure where the common core already succeeds.

### Task 3: Create the minimum router skill

**Files:**

- Create: `skills/joewrks-design-frontend/SKILL.md`
- Create: `skills/joewrks-design-frontend/agents/openai.yaml`
- Modify: `vendor/source-manifest.json`

**Step 1: Initialize the skill**

Run OpenAI `skill-creator/scripts/init_skill.py` for
`joewrks-design-frontend` without example resources.

**Step 2: Replace the template with the routing contract**

Keep the body procedural and compact. It must:

- state precise positive and hard-negative activation boundaries;
- resolve vendor paths relative to the skill/repository, never a personal or
  product-specific absolute root;
- select one UI UX search plan and related Apple sections;
- preserve the design authority order and trust boundary;
- apply the Figma/browser matrix;
- forbid default persistence, dependency installation, and duplicate writes;
- require evidence before verification/completion claims.

**Step 3: Generate product metadata**

Create `agents/openai.yaml` with quoted strings, a short description, a
default prompt naming `$joewrks-design-frontend`, and implicit invocation
enabled. Do not declare Figma as an unconditional dependency.

**Step 4: Add active-file provenance**

Record the local skill files, hashes, intentional JOEWRKS authorship, and
evaluation state in the source manifest without claiming an upstream exact
copy.

**Step 5: Run focused checks**

Run:

```powershell
node --test tests/design-vendor-integrity.tests.mjs tests/design-frontend-routing.tests.mjs
python "<skill-creator-root>\scripts\quick_validate.py" "skills\joewrks-design-frontend"
```

Expected: all pass.

**Step 6: Commit**

Commit exact paths with message:

```text
feat: add bounded design frontend router
```

### Task 4: Add behavior evidence without weakening the contract

**Files:**

- Create or modify only bounded files under: `evals/design-frontend/`
- Modify: `tests/design-frontend-routing.tests.mjs`
- Modify: `vendor/source-manifest.json`

**Step 1: Create a fresh-context evaluator**

Reuse the existing App Server collector primitives where safe, but give this
evaluation new run IDs and output paths. Do not alter or rerun historical
one-shot modes. Pair the same ten fixtures, model, permissions, and project
snapshot with:

- control: common core only;
- candidate: common core plus exact router candidate.

**Step 2: Bind evidence**

Record model identity, runtime, permission profile, fixture hash, candidate
hash, source-manifest hash, tool/capability inventory, prompt/output metrics,
and case-specific evidence. Do not retain secrets or unbounded raw events.

**Step 3: Review each case**

Use the predefined rubric to classify activation, minimum source selection,
Figma/browser selection, authority handling, forbidden actions, and claim
integrity. A missing capability is a valid bounded outcome, not permission to
claim completion.

**Step 4: Apply the gate**

Promotion requires:

- 5/5 positive activation;
- 0/5 hard-negative activation;
- no P0 safety regression;
- no default Superpowers/Ponytail invocation;
- no unsupported Figma/browser claim;
- no unrelated write, install, persistence, or duplicated side effect.

If behavior fails, keep the evidence, fix only the demonstrated routing defect,
and run a new versioned pair. Never overwrite or rerun a one-shot result.

### Task 5: Independent review and stage closure

**Files:**

- Modify: `vendor/source-manifest.json`
- Modify: `evals/manifest.yaml`
- Modify:
  `docs/superpowers/specs/2026-07-27-common-work-harness-design.md`
- Modify:
  `docs/superpowers/specs/2026-07-30-design-frontend-vendor-router-design.md`

**Step 1: Run the complete verification set**

Run:

```powershell
node --test tests/*.tests.mjs
powershell -ExecutionPolicy Bypass -File tests/p0-evaluation-contract.tests.ps1
python vendor/ui-ux-pro-max/scripts/validate_data.py
python -m unittest discover -s vendor/ui-ux-pro-max/scripts/tests -p "test_*.py" -v
python "<skill-creator-root>\scripts\quick_validate.py" "skills\joewrks-design-frontend"
```

Also verify the common-core byte length and SHA-256.

**Step 2: Request independent review**

Give the reviewer only the requirements, diff, test outputs, manifests, and
evidence. Require explicit P0/P1 findings and forbid edits.

**Step 3: Close the ledgers**

Only after the gate passes:

- change evaluation state from candidate to promoted;
- record result paths and exact hashes;
- update the master staged-deployment status without rewriting history;
- state the still-unimplemented installer, sync, optional skills, and
  cross-runtime adapters.

**Step 4: Commit**

Commit exact paths with message:

```text
docs: close design frontend router stage
```
