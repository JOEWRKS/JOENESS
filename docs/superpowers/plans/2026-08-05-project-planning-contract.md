# Conditional Project Planning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make JOENESS offer one durable, evidence-backed project roadmap for long-lived development or design work while leaving simple work and the Interaction Safety Core unchanged.

**Architecture:** Reuse `joewrks-project-setup` as a hybrid skill: implicit selection may inspect and offer, while file writes require explicit consent. Reuse the existing snapshot-guarded PowerShell helper for the project `AGENTS.md`; create `TASKS.md` through the normal file editor only when no authoritative tracker exists.

**Tech Stack:** Markdown skill instructions, OpenAI skill YAML, JSON source manifest, Node.js `node:test`, Windows PowerShell installer tests.

## Global Constraints

- Do not modify `evals/candidates/interaction-safety-core-v1.md` or `vendor/source-manifest.json#activeCommonCore`.
- Do not add a skill, dependency, service, evaluator framework, or new write helper.
- Automatic selection is read-only through discovery and the one-time offer; every file write needs consent that names its targets.
- Prefer the existing authoritative tracker; never create a duplicate ledger.
- Keep a new `TASKS.md` preferably at or below 4 KiB, future milestones shallow, and only the current milestone executable.
- `TASKS.md` is a locator and status ledger, never proof; current Git, files, tests, builds, and external state win.
- Update the ledger only at milestone, scope, release-condition, decision, blocker, or planned-handoff boundaries.
- Preserve existing project-setup helper behavior and byte-preserving installer contracts.

---

## File Map

- `skills/joewrks-project-setup/SKILL.md`: routing, bounded discovery, consent, single-ledger, roadmap, evidence, and update contract.
- `skills/joewrks-project-setup/agents/openai.yaml`: expose conditional implicit selection and retain explicit `$joewrks-project-setup` use.
- `tests/design-vendor-integrity.tests.mjs`: enforce the new skill contract, activation policy, bytes, and hashes.
- `tests/sync-harness.tests.ps1`: enforce installed metadata and the bilingual public explanation.
- `README.md`: explain the offer, the two possible file changes, refusal behavior, and explicit invocation in Korean and English.
- `vendor/source-manifest.json`: record the changed policy, rationale, byte counts, and SHA-256 values.
- `evals/JOENESS-0.1-PROJECT-PLANNING-SMOKE.md`: retain six small instruction-level behavior observations and their limitation.

### Task 1: Hybrid project-planning contract

**Files:**
- Modify: `skills/joewrks-project-setup/SKILL.md`
- Modify: `skills/joewrks-project-setup/agents/openai.yaml`

**Interfaces:**
- Consumes: existing `scripts/project-setup.ps1 -Check/-Apply` snapshot contract.
- Produces: activation policy `hybrid-offer-explicit-write`; read-only offer mode; explicit write mode for `TASKS.md` and the managed `AGENTS.md` block.

- [x] **Step 1: Run the no-guidance behavior baseline**

Give five fresh agents the same realistic request without this skill: a clean Git repository, three collaborators, a three-month release, no plan, and “start now.” Ask for the first response and exact immediate actions without permitting shared-file writes.

- [x] **Step 2: Verify RED and retain the observed gap**

Read every output. The baseline is RED only if the agents repeatedly omit a durable single plan source, start broad implementation without resolving the working contract, or create excessive up-front plans. Record exact observed behavior rather than a guessed rationale. If the control already produces the target behavior consistently, stop and do not modify the skill.

- [x] **Step 3: Write the minimum skill contract**

Change the skill description so it is selected for either an explicit durable-contract request or an unplanned long-lived project start/major release expansion. Its workflow must say:

```markdown
- Run the existing read-only root check first.
- Inspect only project rules, a user-named tracker, root TASKS.md/ROADMAP.md/TODO.md, and a directly relevant approved plan.
- For implicit use, offer once only when no usable ledger exists; do not write before consent explicitly covers TASKS.md and the AGENTS.md plan pointer.
- Continue safe reading, status checks, and a compact chat plan while waiting; delay only permanent planning files and plan-based broad implementation.
- A refusal lasts only for the current task.
- Reuse one authoritative tracker; do not duplicate it.
- Keep TASKS.md at or below 4 KiB when practical, future milestones shallow, inferred items provisional, and current work limited to the next one to three priorities.
- Treat the ledger as context, not proof; reconcile it with current evidence before work and completion claims.
- Update only at milestone, scope, release-condition, decision, blocker, or planned-handoff boundaries.
- Create TASKS.md first, verify it, then use the existing snapshot helper to connect the ledger in AGENTS.md; report a partial write honestly if the second write fails.
```

Set the metadata to:

```yaml
interface:
  display_name: "JOEWRKS Project Setup"
  short_description: "Offer or apply a durable project roadmap"
  default_prompt: "Use $joewrks-project-setup to find the current project ledger, offer a durable roadmap for unplanned long-lived work, and write only the targets the user explicitly approves."

policy:
  allow_implicit_invocation: true
```

- [x] **Step 4: Run the same five fresh-context samples with the candidate skill**

Invoke the candidate by its worktree path and use the same request and constraints as Step 1. Read every output. GREEN requires one bounded persistence offer, no file-write claim, no broad implementation, and no detailed A-Z plan in all five samples.

- [x] **Step 5: Commit the behavior-tested contract**

```powershell
git add -- skills/joewrks-project-setup/SKILL.md skills/joewrks-project-setup/agents/openai.yaml
git commit -m "feat: offer durable project planning"
```

### Task 2: Public docs and install integrity

**Files:**
- Modify: `README.md`
- Modify: `tests/sync-harness.tests.ps1`
- Modify: `tests/design-vendor-integrity.tests.mjs`
- Modify: `vendor/source-manifest.json`

**Interfaces:**
- Consumes: the final bytes from Task 1.
- Produces: deterministic install metadata and matching Korean/English user instructions.

- [x] **Step 1: Add failing README/install assertions**

Require the bilingual README to explain these exact outcomes:

```text
JOENESS may offer a durable roadmap once for a long-lived project with no usable plan.
Accepting may create TASKS.md and add only its location and update rule to project AGENTS.md.
Declining creates no files and normal work continues with a compact chat plan.
An existing tracker remains the single source of truth.
```

Require installed `agents/openai.yaml` to contain `allow_implicit_invocation: true`. Run the smallest relevant PowerShell test selection or the full file if it has no selector.

- [x] **Step 2: Observe RED**

Run:

```powershell
node --test .\tests\design-vendor-integrity.tests.mjs
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\sync-harness.tests.ps1
```

Expected: at least the README/manifest assertions fail before documentation and hashes are updated.

- [x] **Step 3: Update README in both languages**

Replace the explicit-only explanation with a short flow: broad long-lived request, one offer, named file targets, accept/decline effects, existing-ledger reuse, and optional explicit `$joewrks-project-setup` invocation. Do not add a second usage guide or a `HARNESS.md`.

- [x] **Step 4: Record exact bytes and hashes**

Compute the two changed skill files:

```powershell
$files = @(
  'skills/joewrks-project-setup/SKILL.md',
  'skills/joewrks-project-setup/agents/openai.yaml'
)
$files | ForEach-Object {
  [pscustomobject]@{
    localPath = $_
    bytes = (Get-Item -LiteralPath $_).Length
    sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $_).Hash.ToLowerInvariant()
  }
} | ConvertTo-Json
```

Update both `vendor/source-manifest.json` and `EXPECTED_PROJECT_SETUP_SKILL` with that output. Set:

```json
"activationPolicy": "hybrid-offer-explicit-write",
"intentionalDifferences": ["Conditional long-project planning offer with explicit writes, bounded discovery, single-ledger reuse, and snapshot-guarded AGENTS.md updates."]
```

- [x] **Step 5: Run integrity and installer tests**

Run the two Step 2 commands again. Expected: PASS with no manifest hash drift, README contract failure, or helper regression.

- [x] **Step 6: Commit docs and integrity metadata**

```powershell
git add -- README.md tests/sync-harness.tests.ps1 tests/design-vendor-integrity.tests.mjs vendor/source-manifest.json
git commit -m "docs: explain conditional project roadmaps"
```

### Task 3: Six-case behavior smoke review

**Files:**
- Create: `evals/JOENESS-0.1-PROJECT-PLANNING-SMOKE.md`

**Interfaces:**
- Consumes: Task 1 candidate skill text and metadata.
- Produces: bounded evidence for the six design scenarios without claiming runtime routing certification.

- [x] **Step 1: Review the remaining five isolated variations**

Use fresh agents with no project history. Invoke the candidate skill by path, give each one prompt and a synthetic repository inventory, and do not reveal the expected answer. Task 1 already covers case 1 with five repetitions; cover the remaining cases once each:

```text
2. Long-lived app project, existing ROADMAP.md -> reuse; no new ledger.
3. One bug fix, no ledger -> no planning offer.
4. Long-lived project, user declines -> no files; no repeat in this task.
5. User accepts both named targets -> shallow TASKS.md plus AGENTS.md pointer/update rule.
6. Ledger says done but no current evidence -> keep unverified/partial, not complete.
```

- [x] **Step 2: Record evidence without inflation**

Create one compact table with columns `Case`, `Expected`, `Observed`, `Pass`, and `Residual limitation`. Include the five control and five candidate observations from Task 1. State that this is instruction-level evidence; explicit path invocation verifies application behavior but does not prove Codex runtime implicit selection frequency.

- [x] **Step 3: Commit the smoke record**

```powershell
git add -- evals/JOENESS-0.1-PROJECT-PLANNING-SMOKE.md
git commit -m "test: record project planning smoke cases"
```

### Task 4: Release regression, install, merge, and push

**Files:**
- Verify only before merge; no planned source changes.

**Interfaces:**
- Consumes: Tasks 1-3.
- Produces: reviewed main-branch release and matching personal installation.

- [x] **Step 1: Run the documented regression suite**

```powershell
node --test .\tests\thin-hybrid-core.tests.mjs .\tests\design-vendor-integrity.tests.mjs
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\project-setup.tests.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\sync-harness.tests.ps1
git diff main...HEAD --check
git status --short
```

Expected: all tests PASS, diff check is empty, and only intentional committed files exist.

- [x] **Step 2: Request an independent diff review**

Ask one reviewer to score spec compliance and one reviewer to look only for over-expansion, duplicate authority, misleading completion claims, and installer regressions. Fix only evidenced issues and rerun the smallest affected test.

- [x] **Step 3: Merge the verified branch into main**

From the main worktree, confirm it is clean and still at the branch base or a reviewed descendant, then run:

```powershell
git merge --no-ff codex/project-planning -m "merge: add conditional project planning"
```

- [x] **Step 4: Apply and verify the personal installation**

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\JOENESS-0.1.ps1 -Check
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\JOENESS-0.1.ps1 -Apply
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\JOENESS-0.1.ps1 -Check
```

Expected: the final status is `current`; the installed project-setup skill and metadata hashes match the manifest.

- [x] **Step 5: Push main**

```powershell
git push origin main
```

Expected: `origin/main` points at the verified merge commit.
