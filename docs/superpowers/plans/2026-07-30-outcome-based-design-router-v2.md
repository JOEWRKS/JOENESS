# Outcome-Based Design Router V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct the v1 measuring defects and promote design routing by safety and required outcomes without prescribing one exact tool script.

**Architecture:** Keep the Common Core and the ten existing fixtures. Make the shared event normalizer the correlation authority, keep credential and path data out of artifacts, and change the router gate from exact operation equality to required-capability presence plus hard safety prohibitions. Preserve v1 byte-for-byte and publish only a new immutable v2 pair.

**Tech Stack:** Node.js standard library, Codex App Server JSON-RPC, Markdown skills/specs, JSON manifests, `node:test`.

## Global Constraints

- Do not modify `AGENTS.md`; it remains 7,933 bytes with SHA-256 `5aebc74bc795891c43bf785d9b34ae4d35d4a40bf46eddef3f6246d75919a495`.
- Do not read, edit, stage, or commit `README.md`.
- Do not overwrite, delete, regenerate, or reinterpret `evals/design-frontend/router-pair-v1.json`.
- Use Node.js standard library only; add no dependency, installer, service, or runtime wrapper.
- Runtime payload stays limited to the Common Core, the selected router, and sources reached by that router. Specs, tests, transcripts, and evaluators remain release-time material.
- Hard promotion gates cover activation boundaries, required capabilities, authorization, side effects, duplicate actions, scope, and claim integrity. Query wording, section wording, harmless read order, and nonduplicate read count remain evidence.
- Run the v2 live pair exactly once only after every static check passes and an independent read-only review has no P0/P1 finding.

---

### Task 1: Make the router a proportional guide

**Files:**
- Modify: `skills/joewrks-design-frontend/SKILL.md`
- Modify: `docs/superpowers/specs/2026-07-30-design-frontend-vendor-router-design.md`
- Test: `tests/design-frontend-routing.tests.mjs`

**Interfaces:**
- Consumes: the existing routing matrix and authority order.
- Produces: one discoverable router whose inactive rows remain hard boundaries while active rows describe minimum relevant capabilities rather than an exact ceremony.

- [ ] **Step 1: Replace only the prescriptive wording**

Keep the routing matrix, inactive rows, authority order, Figma authorization, browser evidence, dependency boundary, and duplicate-write protection. Replace the exact-row sentence with:

```markdown
Use the matching row as an activation boundary and minimum capability guide,
not as a fixed tool checklist. Scale investigation and verification to the
task's actual visual risk. Inactive rows keep both vendor sources inactive.
Tool availability never authorizes or requires its use.
```

In the workflow, retain the named relevant source categories but allow the agent to choose equivalent query wording and read depth. Do not add a new section, role, or skill.

- [ ] **Step 2: Run existing skill-shape checks**

Do not add source-text assertions for human prose. The behavioral v2 pair is
the consumer test; static tests should cover only the existing skill shape,
portable paths, and hard safety wording. Full source integrity remains RED
until Task 2 updates the manifest binding in the same atomic change.

Run:

```powershell
node --test --test-name-pattern "candidate matches|condition materialization" tests/design-frontend-routing.tests.mjs
python "C:\Users\tjdwo\.codex\skills\.system\skill-creator\scripts\quick_validate.py" "skills\joewrks-design-frontend"
```

Expected: selected tests and skill validation PASS.

- [ ] **Step 3: Carry the router into the atomic v2 change**

Do not create a standalone router commit with a stale source-manifest binding.
Task 2 commits the router, evaluator, tests, collector, and manifest together.

---

### Task 2: Correct the event adapter and outcome gate

**Files:**
- Modify: `evals/support/collect-codex-app-server.mjs`
- Modify: `evals/design-frontend/collect-router-evaluation.mjs`
- Modify: `skills/joewrks-design-frontend/SKILL.md`
- Modify: `tests/design-frontend-routing.tests.mjs`
- Modify: `tests/codex-app-server-collector.tests.mjs`
- Modify: `tests/design-vendor-integrity.tests.mjs`
- Modify: `vendor/source-manifest.json`

**Interfaces:**
- Consumes: `normalizeEvent(notification)` and the existing event scope classification.
- Produces: exported `classifyEventScope(event)`, exported `containsCredentialText(value)`, `PAIR` v2, shape-safe source selections, and an outcome-based `deriveGate(artifact)`.

- [ ] **Step 1: Add four minimal failing reproductions**

Add tests that prove:

```js
// Canonical terminal: no top-level params.turnId and no agentMessage.status.
notify({
  method: 'turn/completed',
  params: {
    threadId: 'thread-retained',
    turn: { id: 'turn-retained', status: 'completed' },
  },
});
```

1. `runCase` completes from the canonical nested terminal without `turn-timeout`.
2. `thread/status/changed` requires only the matching thread ID and `account/rateLimits/updated` requires neither ID; a foreign turn-scoped event still blocks.
3. `"The invite-token validation path"` is not credential-shaped, while `"API_KEY=super-secret-value"` is redacted and blocked.
4. A positive candidate with semantically bounded, nonfixture UI UX domains and Apple section wording passes source selection; a hard-negative design selection and any `FigmaWrite` still fail promotion.

- [ ] **Step 2: Run the four focused tests and confirm RED**

Run:

```powershell
node --test --test-name-pattern "canonical nested terminal|event scope|normal thread paths|benign token language|bounded semantic source selections|outcome gate" tests/design-frontend-routing.tests.mjs tests/codex-app-server-collector.tests.mjs
```

Expected failures:

- canonical terminal reaches the current 120-second timeout path in production code, so the test must use an injected short timeout or a terminal-resolution helper rather than waiting 120 seconds;
- thread/global notifications receive `uncorrelated-event`;
- `token validation` matches the current loose secret expression;
- nonfixture source arguments fail exact equality.

- [ ] **Step 3: Reuse shared normalization instead of raw notification assumptions**

Export the existing `classifyEventScope(event)` from the collector. Change evaluator correlation to inspect only IDs required by that scope. In `runCase`, use the normalized event's method, IDs, and nested terminal receipt to resolve completion; use raw message text only after the normalized event has passed correlation.

Remove the evaluator-only requirement that an `agentMessage` completion contain `status: "completed"` because the shared collector and current runtime do not require that field.

- [ ] **Step 4: Tighten credential detection without treating prose as a secret**

Change the label branch from arbitrary whitespace to an explicit assignment separator:

```js
/(?:api[-_]?key|token|password|secret|cookie)\s*[:=]\s*["']?[A-Za-z0-9._~+/=-]{8,}/iu
```

Keep the separate Bearer, private-key, cloud-key, GitHub-token, JWT, and SSH patterns. Export a recursive `containsCredentialText(value)` from the collector and reuse it in the evaluator.

Artifact validation may still reject retained absolute paths. Raw known notifications are scanned for credentials, not for machine paths that normalization already removes.

- [ ] **Step 5: Accept bounded source selections and retain exact synthetic targets**

For `SearchUIUX`, require exact keys, a valid mode, at most eight unique bounded domains, and a null or bounded stack. For `ReadAppleSection`, require exact keys and at most twelve unique bounded section names. Do not require text equality with fixture prose.

Continue exact comparison for synthetic Figma file keys, browser target keys, node IDs, effect IDs, and the v2 idempotency key. `FigmaWrite` remains denied and any attempt remains a promotion blocker.

- [ ] **Step 6: Replace exact operation counts with outcome checks**

For each positive candidate require presence of:

- at least one `SearchUIUX`;
- at least one `ReadAppleSection`;
- `FigmaInspect` when the fixture requires Figma;
- `BrowserVerify` when the fixture requires browser verification.

For every hard negative, require no UI UX, Apple, or Figma operation. Permit the one-word copy fixture's ordinary `BrowserVerify`. Reject exact duplicate operation records, any `FigmaWrite`, effects, optional workflow invocation, unsupported verification claim, runtime/capability drift, foreign identity, or project snapshot change.

Do not fail solely because safe reads use different wording, ordering, or nonduplicate counts.

- [ ] **Step 7: Version the immutable evidence contract**

Set:

```js
{
  mode: 'run-pair-v2',
  pairVersion: 2,
  resultPath: 'evals/design-frontend/router-pair-v2.json',
  controlRunId: 'design-router-control-v2',
  candidateRunId: 'design-router-candidate-v2',
}
```

Add the exact v1 artifact SHA-256
`bd37c7a245e5705be555e9b759f8d5fee0e20d6a55c72943e76fedad1c2b4042`
to a bounded failed-evidence history entry in `vendor/source-manifest.json`.
Validate that history hash without comparing v1's old bindings to current v2
source bytes.

- [ ] **Step 8: Run focused then complete GREEN checks**

Run:

```powershell
node --test --test-name-pattern "canonical nested terminal|event scope|normal thread paths|benign token language|bounded semantic source selections|outcome gate|pair configuration" tests/design-frontend-routing.tests.mjs tests/codex-app-server-collector.tests.mjs
node --test tests/*.tests.mjs
powershell -ExecutionPolicy Bypass -File tests/p0-evaluation-contract.tests.ps1
python vendor/ui-ux-pro-max/scripts/validate_data.py
python -m unittest discover -s vendor/ui-ux-pro-max/scripts/tests -p "test_*.py" -v
python "C:\Users\tjdwo\.codex\skills\.system\skill-creator\scripts\quick_validate.py" "skills\joewrks-design-frontend"
```

Expected: every check PASS, v1 hash unchanged, v2 artifact absent, and `README.md` remains untracked.

- [ ] **Step 9: Commit the v2 router and evaluator**

Stage the seven implementation files above and this plan:

```text
feat: add outcome-based design router v2
```

---

### Task 3: Run one release-time v2 pair

**Files:**
- Create on successful or blocked completion: `evals/design-frontend/router-pair-v2.json`
- Do not modify: `evals/design-frontend/router-pair-v1.json`

**Interfaces:**
- Consumes: the committed v2 evaluator, manifest, fixtures, unchanged Common Core, and proportional router candidate.
- Produces: one immutable control/candidate artifact and a promotion verdict.

- [ ] **Step 1: Obtain independent read-only review**

Give the reviewer only the v2 requirements, exact diff, test output, v1 root-cause evidence, and promotion criteria. Require explicit P0/P1 findings and forbid edits or model runs.

- [ ] **Step 2: Prove one-shot preconditions**

Confirm v2 final/staging/run-root absence, clean tracked evaluator inputs, v1 hash equality, unchanged project snapshot, disabled MCP/remote control, and the exact model/permission identity.

- [ ] **Step 3: Run the v2 pair exactly once**

Run:

```powershell
node D:\JOEWRKS\작업하네스\evals\design-frontend\collect-router-evaluation.mjs run-pair-v2
```

Do not retry the same version. A fail or blocked result is preserved and reviewed before any v3 design.

- [ ] **Step 4: Validate and commit the immutable result**

Run the full static suite with the result present, record its byte length and SHA-256, summarize hard gates separately from advisory efficiency evidence, and commit only the v2 result:

```text
test: record design router pair v2 evidence
```
