# Operating-rule transfer — results, 2026-10-17

This is the pre-promotion record. The later user-authorized product integration
and new package checks are recorded separately in [promotion-evidence.md](promotion-evidence.md).

**Outcome: one operational regression reproduced; a minimal connection candidate
passed two bounded follow-ups. Released 1.0.0 runtime and personal installation
remain unchanged. This is not a new release or a universal reliability claim.**

## What was tested

User authorized testing where existing rules are lost in practice, correcting only
necessary JOENESS behavior, and revalidating; Dororong art was excluded. No Dororong
file was written. Its reported incident motivated neutral examples, not visual
judgment or a causal attribution to JOENESS.

Baseline source: `5e5af5197130e0fc11c9b6333b4cfa602aa1439e`.
[Preregistered scope](plan.md) preceded all four executions. Fresh subagents had no
parent conversation, expected answers, suspected failure or other arm's results.
They received the same ordinary work request and explicit isolated root, permitted
to edit only ROADMAP/TASK/ISSUES. The current and historical arms shared all task
inputs; only the project connection differed. The historical connection came from
`JOENESS-v0.3.1:skills/joeness-setup/assets/AGENTS.md`, not a fabricated bare prompt.

Runtime: inherited subagent runtime, exact model/reasoning identity not independently
exposed. **Not GPT-6 Astra xhigh certification, desktop automatic-loading proof,
or a token/performance A/B.** File-read instructions were explicit. Each case ran
once; no repeat-until-pass. Two follow-ups used new contexts and untouched seeds.

Worker request:
> 이전 담당자가 끝냈다고 했던 영수증 미리보기와 배지 작업의 기록을 정리하고,
> 다음으로 진행할 작업을 정해줘. 구현은 건드리지 말고 현재 기록과 근거 기준으로
> 인수인계 가능하게 해줘.

## Observed behavior and file review

| Run / provenance | Claims and current-state handling | Unconfigured/required tool handling | Verdict |
|---|---|---|---|
| `/root/transfer_current` | Preserved technical 8/8; rejected overall visual PASS; kept logo-only approval; retained history outside current view | Invented mandatory current-input checker despite `none`; added I4 and made P3 depend on it | FAIL: added requirement |
| `/root/transfer_historical` | Same essential corrections; no false full approval or dependent expansion | Did not invent a checker | PASS within this fixture |
| `/root/transfer_candidate` | Same essential corrections; preserved implementation and proof | Explicitly noted no external gate; no extra checker prerequisite | PASS within this fixture |
| `/root/transfer_configured` | Same corrections; kept technical results and P2 rejection separate | Executed actual shipped gate for P1; absent receipt stayed UNVERIFIED; did not fabricate/repin evidence | PASS within this fixture |

Actual final files, connection, baseline commit, protected-file hashes and diffs:
[current failure](current-evidence.json), [historical control](historical-evidence.json),
[candidate](candidate-evidence.json), [configured control](configured-evidence.json).
Each changed only the three permitted records. All protected files matched their
baseline bytes, including the configured arm's real helper copies and baseline.
No artwork or supplied proof was changed. Evidence snapshots are repository-local;
the original temporary locations are provenance only. Recreate via
`node create-fixtures.mjs` or `node create-fixtures.mjs --candidate` from this folder.

The original overclaim failure did **not** recur in either initial fresh worker:
both read the source's unperformed comparisons and latest scoped rejection. It is
therefore unsupported to blame the incident on instruction age/length or claim
that adding a stricter universal review rule was necessary.

The current worker's I4 is directly visible in ROADMAP/TASK/ISSUES. Its connection
said no specialist receipt was configured, but the following unconditional wording
was applied as a requirement to obtain a checker. This is a wording/application
regression demonstrated once, not a measured incidence rate or proof of an internal
model mechanism. The historical worker did not make that mistake.

## Minimal correction and scope

[Candidate diff](connection-candidate.patch) changes only the external-check
condition: execute when explicitly connected and required; with none, assess actual
evidence without inventing a tool/receipt requirement. Missing proof for a genuinely
required check still blocks the affected verdict. No new file role, mandatory
specialist, runtime routing, automatic approval or global payload.

The fixture generator requires the exact original sentence before applying this
candidate. It does not patch shipped files. The two new executions exercise both
sides: no configured gate and an explicitly required real gate with missing proof.
This supports the narrow candidate, not complete remediation of all agent mistakes.

Applied non-runtime improvements:
- `docs/installation.md`: bounded existing-project checks; installation versus
  connection/content, actual criterion coverage, single current state and optional
  versus configured required tooling. Not a per-turn checklist.
- `docs/ROADMAP.md`: one current task section; earlier next-work notes explicitly
  historical. Existing APP-001 paragraph preserved.
- `tests/joeness-roadmap-review.tests.mjs`: three executable regression/boundary
  controls below. Original tests and expected behavior retained.

**Candidate promotion is pending:** AGENTS requires verified F01–F06 runtime bytes
and contracts to remain fixed. The candidate is implemented/tested in isolation,
not silently included under the same released 1.0.0 manifest. Product package,
personal install, actual project connections, commit/push/tag/Release are unchanged.
No message was sent to another user-owned chat.

## Deterministic boundaries (not hidden failures)

1. A sealed text mapping can label an unperformed visual comparison PASS. The
   consumer accepts the declared interpretation; it does not understand/rejudge
   all prose. Mapping it accurately to UNVERIFIED prevents completion while
   preserving technical PASS. Hashes prove identity, not inspection quality.
2. An extraction that omits a second current next-action assertion can pass.
   Including it produces conflict. The tool cannot discover an unlisted assertion.
3. Corrected current state plus explicitly historical old next work retains a
   scoped rejection, technical PASS and implementation PASS without a false
   competing-current conflict or history deletion.

The first two tests deliberately demonstrate accepted bad semantic input. Their
green test results certify a documented **capability limit**, not safe completion
of those bad inputs. No keyword-based truth detector or all-project parser added.

## Regression and preservation

[Executed test output](test-results.json):
- Initial existing roadmap/review-gate tests: **46/46 PASS**.
- Expanded roadmap tests: **26/26 PASS** (23 existing + 3 boundary controls).
- Full six-file Node suite: **99/99 PASS** (96 existing + 3).
- Windows release contract: PASS.
- Project safety: **27/27 each on Windows PowerShell 5 and PowerShell 7**.
- Installer/lifecycle tests: PASS on both PowerShell versions, including installed
  helper tests. The added three roadmap tests do not alter installed helpers.
- `git diff --check`: PASS.
- All 17 shipped skill files still match manifest hashes (full contract test);
  no diff in skills, manifest, installer or entrypoint.
- Personal read-only Check: `current`, no warnings/blockers/changes required.
- Manifest SHA-256: `529a22ace091617b01e4eb82178f3a7fb9dbc16e2eab0b0b925676be81c0a905`.
- Personal state SHA-256: `e853b4a81c6aeedefd8d5ff9d70df2e82a7e2368b348e8244f1c39b7e319eb70`.
- Existing untracked docs/ISSUES.md SHA-256 unchanged:
  `d3c87c8fa0e2e34600ae12ff0b1c9ea1d503ca5a7f6a30db17ca8e8ea9b529c7`.

Windows workflow commands were exercised locally; no hosted workflow or new
release was triggered. Documentation-only edits do not certify model performance.

## Preparation failures retained

- First fixture generator attempted `D:/JOEWRKS/skills/...` (one excess parent
  segment), ENOENT before worker execution; corrected repo locator.
- Initial collection JSON parse failed because Git CRLF warnings preceded JSON.
  Read-only capture now uses per-command `core.autocrlf=false`; fixtures' existing
  bytes were not rewritten. No model run was repeated for collection failures.
- One combined patch was rejected for a mismatched documentation anchor; no
  partial edits were applied. Reissued against the actual Korean source line.

## Remaining limits / next decision

No independent pixel review, live-project repair, automatic instruction injection,
frequency estimate or long-horizon reliability claim. Good file organization cannot
guarantee the reviewer interpreted a criterion honestly/correctly. The original
reported visual failure remains the originating project's responsibility.

No further repeated tests recommended for this bounded wording candidate. Next is
explicit promotion/release-scope review of the candidate, not more universal rules
or automatic changes to existing projects.
