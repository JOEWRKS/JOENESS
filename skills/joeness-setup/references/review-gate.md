# External review consumption

Use only where an authorized roadmap outcome requires an external specialist
verdict. No new public skill, global payload, background worker or stage engine.
Node.js 18+ is required for this explicit read-only helper. Missing runtime or
missing input means unverified; do not fall back to a completion claim.

## Owners and invocation

- User/authorized scope owner: approves criteria, required targets, dependencies,
  scope removal and acceptance. Pin the baseline SHA outside the result file.
- Specialist (JOEDESIGN for visual work): owns criterion interpretation, required
  screen/state/viewport coverage, actual measurements, professional review,
  result production and invalidation dependencies. Hashes alone are not visual proof.
- JOENESS integrator: checks receipt coverage, identity, freshness and evidence
  integrity before resuming dependent work or advancing the related status.
  Records implementation, technical verification, visual compliance and user
  acceptance separately in the existing TASK/ROADMAP, not a new live ledger.

From the installed skill's absolute directory, run:

```text
node scripts/review-gate.mjs --root <project> --baseline <relative-json> --baseline-sha256 <approved-pin> --result <relative-result-json> --claim visual
```

`--claim` is implementation, technical, visual or complete. Exit0 permits only
that claim in the declared scope; exit2 blocks it. `project_complete` is always
false: a scoped receipt cannot certify the entire project. `complete` requires
every required lane and acceptance unless the approved baseline explicitly says
`required_acceptance:false`. A visual PASS does not grant acceptance or prove
implementation/technical completion. Missing lanes remain UNVERIFIED.

Before changing the corresponding ROADMAP item to complete, consume the current
inputs and link the emitted result from TASK. On nonzero exit or unavailable
result, retain verification pending and name the affected gap. Preserve completed
implementation and independent authorized work. Do not silently remove a check.

## Minimal pinned baseline

JSON schema identity `joeness.review-baseline.v1`:

- `scope_id`: stable scoped roadmap outcome.
- `authorization_ref`: actual approval/scope locator, not an invented approval.
- `authority`: nonempty `{path,sha256}` list of current authoritative source files.
- `required_checks`: nonempty list of `{check_id,target_id,method,criterion_sha256,
  inputs,lane}`. IDs unique; lane implementation/technical/visual. `inputs` is
  the nonempty per-check dependency path list. Include build inputs, shared CSS,
  runtime/configuration evidence where relevant; omitted dependencies cannot be
  discovered by this consumer. Target ID must bind screen/state/viewport as
  specified by the specialist. Criterion meaning remains with that owner.
- `required_lanes`: optional additional required lanes. It cannot remove lanes
  represented by required checks.
- `required_acceptance`: optional boolean, default true.

Paths are root-contained NFC POSIX relative paths without `..`, empty segments,
backslashes or drive prefixes. Symlinks resolving outside the root are rejected.
Additional specialist fields are permitted; they remain bound by the baseline pin.
The pin is SHA-256 of exact baseline bytes. Do not take the expectation from the
incoming result or refresh it automatically after a failure.

## Specialist result

`joedesign.conformance.v1` supplies visual checks only;
`joeness.check-results.v1` supplies implementation/technical checks only.
Both have `scope_id`, `baseline_sha256`, `results`, `unresolved` and
`acceptance:"NOT_GRANTED"`. Top-level PASS is not used.

Each result: `{check_id,target_id,method,criterion_sha256,status,
input_fingerprint,evidence}`. Status is PASS/FAIL/UNVERIFIED. Evidence is a
nonempty list of `{path,sha256}` for PASS. `unresolved` contains
`{check_id,reason}`; a listed item blocks its check even if it says PASS.
Duplicate/unknown results, malformed files and unbound scopes fail closed.

Fingerprint: sort input paths by UTF-8 bytes, hash actual bytes at each path,
serialize `[[path,lowercaseSha256],...]` using compact UTF-8 JSON without trailing
newline, then SHA-256. Consumer recalculates this; it never trusts an output
fingerprint merely because the producer supplied it. It does not rejudge pixels.

Result and evidence paths normally resolve under the project root. For isolated producer
artifacts, explicitly supply `--evidence-root <allowed-directory>`; absolute
result/evidence paths are accepted only under that real path. No evidence is executed.
Repeat `--result` for separate nonoverlapping receipts, `--evidence-root` for
additional authorized roots. Other options must occur once; duplicates are rejected.
Avoid secrets in all inputs/outputs.

## Resume, change, acceptance

Check current authority, dependencies and proof on resume. A changed input marks
only dependent checks STALE; unchanged checks remain reusable. An authority change
requires authorized baseline review, not an automatic new approval.
With an explicitly authorized new baseline, prior evidence may be consumed using
`--previous-baseline <old-json> --previous-baseline-sha256 <old-approved-pin>`.
Only checks whose entire pinned definitions, current inputs and shared baseline
context still match may pass. Shared context includes authority, target definitions,
rules and opaque specialist extensions; only `required_checks`, `authorization_ref`,
`required_lanes` and `required_acceptance` are excluded from that shared comparison.
Any shared-context change requires fresh results within this scope: the consumer
does not guess which domain-specific fields are unrelated. Per-check-only changes
still permit reuse of unchanged checks. Supply refreshed results without duplicate IDs. Retain
the previous baseline/results as dated proof; they are not competing live state.
Use narrow scopes so an unrelated criterion change does not block other work.

Acceptance is never emitted by the specialist. If the user has accepted the
exact output, supply a separately pinned `--acceptance <json>
--acceptance-sha256 <authorized-pin>`. Schema `joeness.user-acceptance.v1` has
`scope_id`, current `baseline_sha256`, `status:"ACCEPTED"`, `source:{path,sha256}`
and `input_fingerprints:{check_id:currentFingerprint}` for every required check.
Missing, changed or mismatched acceptance cannot complete a scope requiring it.

## Enforcement limits

This helper refuses an invalid completion claim with a nonzero exit; consumers
must honor that exit. It does not intercept direct Markdown edits, arbitrary
natural-language claims or a caller changing both the baseline and its pin.
It authenticates neither the producer nor the user's identity. Evidence hashes
detect mutation, not fabricated observations or misinterpreted design rules.
Trusted CI/host permissions, independently approved baseline pins and specialist
review are needed to protect those boundaries. Even then, whole aesthetic quality
and user acceptance must not be inferred from DOM measurements.

Do not label a project protected until the applicable command, pinned inputs and
consumer enforcement are actually connected and tested there. Source candidate,
installed package and project connection are separate versions/activation states.
