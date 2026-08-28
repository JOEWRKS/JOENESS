# JOENESS × Paperthin Stage P4/P5 — visual-check acceptance invariant decision

- Status: `P4 COMPLETE` / `P5 BLOCKED` / candidate `PARKED`
- Research baseline before this decision: `codex/joeness-paperthin-prior-art-roadmap@d5d0b2a5ca54b4d2cd6f0a935875b6f147cec546`
- Candidate branch: `codex/visual-check-acceptance-invariants-p4`
- Candidate branch base: `d5d0b2a5ca54b4d2cd6f0a935875b6f147cec546`
- Last candidate implementation head inspected: `71e5d9d67a5ee9880d4ea47717df1e6f4c8a81ad`
- Core/public-skill catalog/installer/TASKS status: unchanged
- Adoption status: no PR, no merge, no main change, no personal-install update

This document records why the only P3 survivor is parked instead of expanding the validation surface to force an adoption.

## 1. P4 bounded design

P3 advanced one residual `$visual-check` seam after subtracting behavior already required by the active contract:

1. before candidate interpretation for an acceptance verdict, freeze the smallest sourced acceptance axes/invariants capable of changing that verdict;
2. after a concrete correction, if the correction mechanism materially affects another required acceptance invariant, recheck that impacted invariant together with the rejected property;
3. do not rerun unrelated or unaffected properties solely because a correction occurred.

The intended maximum integration form was `EXISTING_SKILL_TWEAK`.

The approved production scope was deliberately narrow:

- `skills/visual-check/references/durable-evidence.md`
- `skills/visual-check/references/concrete-defect.md`

Explicit non-goals included Core changes, `skills/visual-check/SKILL.md`, `approved-reference.md`, installer behavior, manifest changes, `TASKS.md`, a new public skill, RVR Gate/status-taxonomy import, and rerun-all verification.

## 2. TDD evidence

A focused regression was added on the candidate branch before production changes.

### 2.1 Clean RED

Candidate head: `5e377813ecdee522f902b3f2a7a9a3f660641cee`  
GitHub Actions run: `33177328114`

The Node taxonomy first passed with 31 classified Node suites: 20 current-release, 1 historical-integrity, 10 historical-replay. The current-release group then ran 674 tests with:

- 672 PASS
- 2 FAIL

The only failures were the two new contract assertions:

- pre-candidate sourced acceptance-axis/invariant freeze missing;
- materially impacted invariant recheck missing.

This is the valid RED state. An earlier RED attempt also had an unrelated taxonomy-count failure and was not accepted as clean RED.

### 2.2 Minimal production delta

At candidate head `71e5d9d67a5ee9880d4ea47717df1e6f4c8a81ad` the two approved references contain only the intended behavioral delta:

- `durable-evidence.md`: before inspecting a candidate for an acceptance verdict, freeze the smallest sourced acceptance axes or invariants that can change the verdict for that claim;
- `concrete-defect.md`: when the correction mechanism materially affects another required acceptance invariant, recheck that impacted invariant with the rejected property; do not recheck unrelated/unaffected properties solely because a correction occurred.

The focused new assertions are GREEN at that head.

## 3. P5 deterministic release gate — BLOCKED

GitHub Actions run: `33177845723`  
Head: `71e5d9d67a5ee9880d4ea47717df1e6f4c8a81ad`

The taxonomy gate passed and both new focused visual-check assertions passed. The full current-release group did **not** pass:

- total: 674
- PASS: 611
- FAIL: 63

The failures are not evidence that the two new sentences contradict their focused contract. They expose an existing exact-byte pin architecture around the active `$visual-check` references.

### 3.1 Active-skill manifest pin

`vendor/source-manifest.json` registers `visual-check` as an active skill and pins its files by exact bytes/SHA. `tests/design-vendor-integrity.tests.mjs` independently hardcodes the same active-skill file identities and rejects byte drift. Therefore changing either reference necessarily invalidates the current manifest/integrity identity until a new active-skill contract identity is created.

The approved P4 scope explicitly excluded a manifest change, so silently updating these pins is not authorized by the bounded design.

### 3.2 M2B1 historical evaluation pins

The existing `design-visual-m2-b1-smoke-plan-v10.json` is not disposable current metadata. It binds:

- a predecessor plan, blocked attempt, and latest receipt by exact bytes/SHA;
- a specific repository source commit and runner/adapter/collector identities;
- active visual-check `SKILL.md`, `durable-evidence.md`, `concrete-defect.md`, and `approved-reference.md` by exact bytes/SHA;
- an explicit one-method-changed/no-automatic-retry history.

Its boundary also states `manifestUpdate: forbidden-before-independent-review`.

The M2B1 runner preflight intentionally rejects active reference bytes that differ from these pins. Rewriting the old plan hashes would mutate historical evidence. Preserving that history while supporting a new active visual-check identity would require a new evaluation/contract version or a broader historical-materialization architecture change.

That work is materially larger than the approved two-reference skill tweak and would reopen the evaluation treadmill this roadmap was designed to avoid.

## 4. P5 decision

`P5 = BLOCKED` for adoption of this candidate under the approved scope.

Reason:

> The behavioral delta is compact and its focused regression is GREEN, but the repository's current release gate intentionally binds the active visual-check references into manifest and historical M2B1 evidence identities. Passing the full gate requires expanding into manifest/evaluation-versioning or historical-evidence infrastructure, which is outside the approved P4 boundary and disproportionate to a `REAL_SINGLE_PROJECT_GAP`.

This is not converted into a request to update every pin. The roadmap's restraint rule applies: do not increase permanent system/eval complexity merely to force the sole survivor through P5.

## 5. Final disposition

Candidate: `$visual-check` acceptance-frame + materially impacted-invariant discipline  
P4 form: `EXISTING_SKILL_TWEAK` was technically expressible  
P5 result: `BLOCKED`  
Final disposition: **`PARK`**

Consequences:

- do not merge `codex/visual-check-acceptance-invariants-p4`;
- do not modify Core v8;
- do not modify the active six-skill catalog;
- do not update `vendor/source-manifest.json` merely to force this candidate through;
- do not rewrite M2B1 predecessor plans or historical evidence hashes;
- do not create a new M2B1 evaluation generation solely for this one RVR-derived seam;
- do not change installer/manifest behavior or `TASKS.md`;
- retain the candidate branch as bounded failed-validation evidence;
- return to real-use observation.

A future independent project may reopen the seam if it reproduces the same failure class or if visual-check identity/versioning is already being changed for another justified reason. At that time this candidate can be reconsidered without treating the present failed gate as approval.
