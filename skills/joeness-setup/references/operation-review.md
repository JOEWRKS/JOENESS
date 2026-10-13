# Consume a captured planning operation

Use only for an explicitly requested JOEFLOW candidate preflight or planning
projection audit whose outcome affects an authorized ROADMAP item. This is
not automatic product routing, a new approval authority, or a background runner.
The helper reads a capture; it never launches a producer or writes a project.

## Execution boundary

The caller runs the authorized producer once with a fresh run ID, capturing
complete stdout, stderr and actual process exit/signal into fresh evidence paths.
Pin the request before launch, and record the exact source/dependency files of
the producer invoked. On timeout, missing exit, nonzero execution failure,
truncated output or changed input, preserve the failed attempt. Never reuse an
older stdout or infer success from an existing file. Inspect current targets
before any retry. The read-only consumer does not authenticate that a caller
really executed the command; actual caller-to-producer evidence is required.

JOEFLOW owns candidate correctness, Product/approval meaning, projection review
and repair. JOENESS checks execution identity, current source bytes, required
coverage and consistent result structure. It records detailed findings in TASK
and only affected gaps/next work in ROADMAP. Keep unrelated completed work intact.
Do not copy these contracts into project AGENTS or add a second live status file.

## Invocation

Node18+; use the absolute installed skill directory:

```text
node scripts/operation-review.mjs --root <source-root> --evidence-root <capture-root> --request <request.json> --request-sha256 <pin> --capture <capture.json> --capture-sha256 <pin>
```

Paths in request/capture are resolved under evidence-root (default source-root).
Source paths resolve under source-root. When the installed producer is outside
the project, explicitly pass `--producer-root <installed-skill-root>`; only the
request's `producer_files` resolve under that root (default source-root). It does
not widen project/evidence access or select/launch a producer. Absolute producer-reported
paths are permitted only inside that root; symlink escapes fail. Each file is
bounded to4MiB and checked against lowercase SHA-256. No silent truncation.

Request `joeness.operation-request.v1`:

- `run_id`: caller-created unique invocation identity.
- `producer_schema`: `joewrks.state-candidate-preflight/1.0` or
  `joewrks.projection-audit/1.0`.
- `primary`: `{path,sha256}` of candidate state or audit input.
- `canonical`: candidate's optional canonical state ref, otherwise null.
- `producer_files`: nonempty `{path,sha256}` list including the entrypoint and
  actual implementation/dependency files used. No vendor package is installed
  or selected by this helper; the approved caller supplies the producer.

Capture `joeness.operation-capture.v1`:

- `run_id`, `request_sha256`: exact invocation/request association.
- `exit_code`: actual exit; `signal`: null or actual interruption signal.
- `stdout`, `stderr`: `{path,sha256}` of captured raw streams under evidence-root.

The producer's rc0 means its scoped operation passed, rc1 means a valid negative
or partial result, rc2 indicates invocation/read/output failure. Only complete
single JSON stdout for rc0/1 is consumed. Failure on stderr cannot be replaced
with a previous success. The consumer returns JSON and rc0 only for `allowed:true`;
otherwise rc2. Consult `verdict` (pass/blocked/unknown/invalid) and findings.

## Preserved meaning

`joeness.operation-consumption.v1` retains producer data in `reported`, including
recovery owner/action and each projection's separate source identity, structure,
semantic review, render review, approved coverage and materialization. Approved
coverage, recovery owner, kind and required structural markers are checked against
the pinned scope. A semantic review not required by that scope stays NOT_REQUIRED;
do not demand an extra review record for it. `reported` is the producer's
claim, not necessarily a current usable result: check allowed/verdict/findings.
UNKNOWN/NOT_REVIEWED meaning must not become zero findings or PASS. Unknown
semantic/render findings remain null. One pending projection does not erase a
completed sibling. Required coverage comes from the pinned scope source, not a
weakened top-level PASS or an omitted output row.

F03 PASS permits presenting a candidate for review, not recording its approval.
F04 PASS means only the declared required projections passed that audit. It is
not proof of full Product/design quality. `project_complete:false` and
`approval_granted:false` are invariant. Existing specialist/acceptance gates
remain required; this helper does not repin or replace them.

Source hashes and pointers establish identity, not semantic truth or signer
identity. Producer/receipt fabrication and omitted producer dependencies require
trusted capture and independent review, not a stronger wording claim. A new
producer contract needs consumer compatibility tests before adoption.
