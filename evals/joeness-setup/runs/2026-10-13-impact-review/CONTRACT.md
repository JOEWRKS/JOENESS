# C — impact consumption, diagnostic first

Only the reviewed transition between two explicitly pinned baselines is in scope.
This phase does not alter review-gate, old observations, acceptance or live projects.
JOEDESIGN owns impact interpretation and measurements. JOENESS checks source binding,
coverage, unchanged inputs and evidence integrity; local hashes are not authentication.

Proposed CLI: `impact-review.mjs --root ROOT --impact FILE --impact-sha256 PIN
--impact-review FILE --impact-review-sha256 PIN --baseline FILE --baseline-sha256 PIN
--previous-baseline FILE --previous-baseline-sha256 PIN --old-result FILE
--old-result-sha256 PIN [--evidence-root ROOT]`.

Independent `joeness.impact-reuse-review.v1` contains `scope_id`, `impact_sha256`,
`old_baseline_sha256`, `new_baseline_sha256`, `old_result_sha256`,
`semantic_review_sha256`, distinct nonempty `implementation_context`/`review_context`,
`confirmed_candidate_check_ids`, substantive `source_refs` and `rationale`.
Its exact pin is supplied separately, never read as its own expectation.
It does not replace source-scope or user acceptance authority.

The read-only diagnostic always returns `allowed:false`, `reuse_authorized:false`,
`project_complete:false`. It distinguishes independently consistent candidates from
rerun/unknown/invalid and cannot advance the existing gate. A later separately
reviewed gate change may consume the same exact pinned contract. Until then old
receipts after authority changes remain stale.

Required rejection cases: wrong scope/pin, missing or duplicate required checks,
changed baseline definition/acceptance/opaque context, non-append authority change,
changed runtime bytes, missing/changed served build, incomplete or late dependencies,
old FAIL/UNVERIFIED/unresolved, changed proof, current review blockers/rejection,
missing independent review, altered candidate/previous result, unbound input root.
Positive cases: reviewed DESIGN comment/section append with complete unchanged
runtime, target/build, old measurement evidence and both review bindings. Partial
candidate sets do not erase unrelated failures or assert whole-scope completion.

Actual producer final source pins/fixtures and Manager independent review are
required before integration or limited reuse. No automatic repin, user install,
GEO writes, release or commit/push in this phase.
