# Current roadmap and delivery diagnosis

Use when setup normalization, a relevant scope/state change, or a handoff reveals
competing current summaries or unclear delivery limits. Not a check for every
question. Preserve the source documents and old failures. Fix only authorized
owner sections; this reader does not rewrite, install, approve or schedule work.

## Owners and extraction

ROADMAP owns current scope/order/status/next; TASK owns performed work and proof.
Product/decision owners establish scope, required checks, exclusions and whether
acceptance is required. Design specialists supply observations with exact
screen/state/viewport/output identity, never user acceptance by inference.
Acceptance/rejection must come from its actual decision source. The integrator
reviews source interpretation and completeness of the extraction. Unknown
meaning remains unknown; a reviewer name or hash cannot prove it correct.

Use a one-time, source-bound input to inspect existing records, not a competing
live ledger. Reuse specialist source objects where available. Do not maintain
these inputs beside ROADMAP as a second state store. Small direct read-back can
remain manual; use the helper for repeatable identity/coverage/conflict checks.

1. Locate current ROADMAP sections and related proof. Classify dated former
   summaries as history only when the original context supports that choice.
   Check that no other current section is omitted; the helper cannot find an
   unlisted assertion or interpret all free prose.
2. Extract scoped required outcomes and exclusions from authorized owners. Bind
   to exact current source bytes and a nonempty quote or JSON pointer/value.
   Keep partial outcomes/target-specific acceptance separate. Include target
   identity metadata (route/state/viewport/theme/locale as applicable), actual
   output/build and criteria dependencies in each target set.
3. Review the mapping against sources, including coverage, scope authority and
   acceptance requirements. Record that review at its existing work/evidence
   location, not a new approval authority. Pending review => null. A confirmed
   review binds the digest below; never auto-sign a mapping merely to pass.
4. Run the explicit read-only helper with an independently checked input pin.
   Inspect findings; correct at the owner and review affected mappings again.
   Preserve invalid/failed attempts as evidence. Unrelated work remains eligible.

## Invocation and output

Node.js 18+; from the absolute installed skill directory:

```text
node scripts/roadmap-review.mjs --root <project> --input <relative-json> --input-sha256 <checked-sha256> [--format text]
```

Default output is JSON `joeness.roadmap-diagnosis.v1`. `--format text` shows
scope, delivery, required remainder, exclusions and limitations together.
Exit0 means only that the declared, reviewed scope has no detected gap; exit2
means incomplete or undetermined (inspect delivery/findings, not exit alone).
`project_complete` is always false. No output grants product approval, proves
unlisted checks, refreshes a specialist receipt, or bypasses review-gate.mjs.
This helper does not authenticate reviewers/users or prove prose meaning.

- `invalid`: malformed reference/shape, wrong source value, duplicate IDs, escape.
- `conflict`: contradictory current claims/results or required/excluded overlap.
- `unknown`: missing/unreadable/stale source, target mismatch, missing required
  observation, incomplete semantic review or undecided acceptance requirement.
- Observed FAIL/REJECTED/PARTIAL retain those states; never convert absent proof
  to a failed implementation or silently erase a completed independent lane.

`delivery` is complete/incomplete/undetermined within the declared scope only.
Show required remainder separately from authorized exclusions and disclosed
verification limits. An excluded item is not passed. READY_FOR_REVIEW is not
approval; Manifest UNAPPROVED can coexist with a separately authorized demo
delivery. Do not invent that separate authorization.

For unknown/conflict/invalid, name affected source/outcome and the manual check
needed. No newest-date-wins or automatic rewrite. Do not call missing access
missing work. After correction, inspect current targets before retrying.

## Input v1

`schema: "joeness.roadmap-review.v1"`, nonempty `scope_id`, and:

- `scope_source`, `scope_authorization`: source refs. Scope definition and actual
  authorized delivery decision are separate; either may be a section of an
  existing source. These refs do not authenticate their author's authority.
- `mapping_review`: null or a JSON ref to an object containing `scope_id`,
  `status: "CONFIRMED"`, `mapping_sha256`. Extra review explanation is allowed.
  Digest = SHA-256 of input excluding only top-level mapping_review, recursively
  sorted object keys, array order unchanged, compact UTF-8 JSON, no newline.
  The exported mappingHash(input) computes it; computing it is NOT review.
- `views`: `{id,kind:"current"|"history",source,claims:[{key,value,source}]}`.
  Current claims use nonempty strings; same key with different values conflicts.
  Claim refs stay inside the view. Use `outcome:<id>:<lane>` to compare roadmap
  status directly with the corresponding current observation. Other keys, e.g.
  stage/next, are compared between current views, not semantically interpreted.
  Historical claims are not evaluated or followed; their classification and
  preserved source locator are covered by mapping review.
- `required_outcomes`: nonempty array of `{id,label,required_lanes,
  acceptance_required,source,targets}`. Lanes: implementation/technical/visual.
  Acceptance: true/false/null; null is unresolved. A source object containing
  these fields must agree with the normalized outcome. A free-text source
  requires actual interpretation review, not keyword matching.
- `excluded_outcomes`: `{id,label,source,authorization}`. Keep the original
  exclusion decision and former failures retrievable; do not count as PASS.
- `observations`: `{outcome_id,lane,status,source,targets}`. One current result
  per required outcome/lane. Ordinary status: PASS/FAIL/UNVERIFIED/PARTIAL.
  Acceptance lane: ACCEPTED/REJECTED/NOT_GRANTED/UNVERIFIED/PARTIAL.
  For JSON sources, pointer/value must select the observation object containing
  outcome_id/lane/status/targets; these must equal the normalized fields.
  Text observations require mapping review of their actual meaning. Do not
  promote a measurement or specialist PASS into exact user acceptance.
- `limitations`: `{text,source}`; non-blocking disclosed boundaries, not a place
  to hide required gaps. All five arrays above must be present; each <=256.

Source ref: `{path,sha256,quote}` OR `{path,sha256,pointer,value}`. Quote is exact,
nonempty UTF-8 text. Pointer is RFC6901, including empty string for the root;
value must deep-equal the source value, not merely mention the same status.
Target ref: `{path,sha256}`; each nonempty target set has unique paths and must
exactly match its outcome's set. Every source/target is read at its current hash.
Paths are root-contained NFC POSIX relative paths; traversal, symlink escapes,
absolute paths and backslashes rejected. SHA-256 is lowercase hex. File bound
4 MiB; a larger source requires a scoped authorized extraction or manual review,
never silent truncation. No file is written by this CLI.

## Regression boundary

Test current/history negative controls, closed/reopened work, source contradiction,
partial/rejected acceptance, unknown criteria, absent/stale/other-target proof,
exclusion without authority, mapping mutation, and source bytes unchanged.
Source tests do not prove fresh-context instruction delivery or real-world
completeness. Personal installation and project connection remain separate.
