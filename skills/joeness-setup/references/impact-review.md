# Reviewed geometry reuse

Read only when an authorized ROADMAP outcome requests reuse across a DESIGN
authority change. This is not automatic routing or a new approval source.

JOEDESIGN produces `joedesign.impact.v1` from its explicitly requested
`inspect-impact` command. Preserve the real execution exit, stdout/stderr and
source pins. On failed/truncated execution do not substitute an older report.
Independent source review must cover the exact transition and every candidate.

First run the diagnostic from the installed skill directory:

```text
node scripts/impact-review.mjs --root PROJECT --impact REPORT --impact-sha256 PIN --impact-review REVIEW --impact-review-sha256 PIN --baseline NEW --baseline-sha256 PIN --previous-baseline OLD --previous-baseline-sha256 PIN --old-result RECEIPT --old-result-sha256 PIN
```

Optional repeated `--evidence-root` admits explicitly allowed external evidence.
Root-contained source references and exact SHA-256 pins are mandatory. JSON is
bounded to4MiB, other evidence to64MiB. No input is executed or rewritten.

Independent review schema `joeness.impact-reuse-review.v1`:

- `scope_id`, `impact_sha256`, `old_baseline_sha256`, `new_baseline_sha256`,
  `old_result_sha256`, `semantic_review_sha256`: exact reviewed identities.
- `implementation_context`, `review_context`: distinct nonempty contexts.
- `confirmed_candidate_check_ids`: unique reviewed subset of reported candidates.
- `source_refs`: nonempty pinned `{path,sha256}` evidence; `rationale`: substantive
  scoped reason, not a name, PASS label or invented user approval.

Diagnostic `valid` means structurally consistent inputs, not scope completion.
It always returns `allowed:false`, `reuse_authorized:false`, `project_complete:false`.
Candidate IDs are separated from rerun/unknown and reasons. rc0 means a valid
diagnostic, possibly with unknown checks; rc2 means invalid input. Do not advance
work because this diagnostic returned0.

## Explicit gate connection

After independently reviewing the exact report and transition, use the ordinary
review-gate command with the same root, current/previous baseline pins and old
receipt as `--result`. Add all six options:

```text
--impact REPORT --impact-sha256 PIN --impact-review REVIEW --impact-review-sha256 PIN --old-result RECEIPT --old-result-sha256 PIN
```

Missing any pin blocks the transition. No options means the prior gate behavior:
changed shared authority/context requires fresh results. The old receipt must
match both exact bytes and the explicitly named path, not a replacement receipt.
Only `review-gate` rc0/allowed for the requested claim permits related progress.
Reused checks are named in `impact_reuse.reused_check_ids` and labeled as prior
observations, never as a fresh render. User acceptance stays separately bound to
the current output/baseline; old acceptance is not migrated.

## Bounded support and ownership

Only geometry checks support this transition. Old/new baseline definitions must
match completely except authority hashes and authorization reference. Runtime
inputs, required checks, targets, criteria, acceptance requirements and opaque
fields cannot be weakened. Root DESIGN.md may only append one reviewed comment
or a reviewed unrelated new section; its original bytes must remain intact.
Semantic noninterference is independently reviewed, not inferred from a heading.

Current served-build identity, exact target, dependency coverage and response/file
hashes must match the old observation. Old measurements, frames, source refs and
evidence remain immutable. FAIL/UNVERIFIED, unresolved checks and current review
blockers/rejection cannot become reusable. CSS/token/runtime changes, unknown
late dependencies or served-build mismatch require fresh scoped evidence.

JOEDESIGN owns measurement and impact interpretation; JOENESS checks binding,
coverage/current bytes and consumes the result. Hashes/contexts do not authenticate
reviewers, HTTP observations, approval, omitted dependencies or semantic truth.
The gate is explicit, not a host interceptor. Keep failures and direct-edit limits
visible. Do not install or activate a project merely because this source exists.
