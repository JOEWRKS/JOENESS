# Project Design

**Reporting:** follow the `## Report Form` section below exactly (보고는 `## Report Form` 절을 그대로 따른다).

**Status:** DRAFT
**Revision:** 1
**Product Authority:** README.md (no revision record; read 2026-11-15)

Design checks use JOEDESIGN. This is the project's only DESIGN.md and its only rule table.

## Visual Sources and Approval Scope

Visual source: the shipped code only (`src/index.html`, `src/style.css`). No approved visual target or original exists.
Approved scope: none. Supported widths per README.md: 360, 768, 1280.

## Project Decisions

None approved. Request form character counter (ROADMAP R1): display format, position and near-limit/limit state undecided; decide with the user before adding its rule rows.

## Token Roles

Values read from `src/style.css` on 2026-11-15; measured, not approved.

| Role | Parts | Token / value | Status |
| --- | --- | --- | --- |
| Form field gap | form children (labels, input, textarea, button) | `gap: 12px` | measured |
| Control min height | input, textarea (base), button | `min-height: 44px`; input `40px` at ≥1280px | measured |
| Form width / side padding | form | `max-width: 480px`, `padding: 0 16px` | measured |

## Rule Coverage

One row per measurable rule; a ROADMAP design Check names these rows. A rule with no check is unmeasured, never passed. Result links the latest TASK entry; no copied log. No approved measurable rule exists yet; R1 counter rows are added once its display is decided.

| Rule | Check | Spot check | Layouts | Sizes | States | Unmeasured | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |

## Report Form

Any session that changes a file listed in Rule Coverage, with or without JOEDESIGN
loaded, reports design-check results in one list, one line per check that ran:
`check | result | sizes x states, mode | rendered or code | spot check` (the row's
Spot check cell, or "not spot-checked"). The fourth cell is `code`, `rendered`, or
`rendered (injected css)` when the preview could not load the page's linked CSS
and the same CSS was injected (another departure: `rendered (<what differed>)`),
e.g. `C1 gap | 8/8 | 4 sizes x 2 states, light | rendered (injected css) | not
spot-checked`. Each fix takes its own line; its result
is `fixed` only when its spot check cell holds a direct observation of the fixed
thing on a target that showed it, otherwise `changed`. A `changed` fix is an open
issue: it goes under 남은 문제 (remaining work) in the report, ISSUES and ROADMAP,
never under 해결 (resolved). Outside the list, a pass or count carries its
parenthesis (sizes x states, rendered or code, spot check outcome). A turn with no
design check says `design checks: none ran`. A result that is not spot-checked is
not resolved, verified or done. A change that moves, overlaps, hides or merges an
existing element lists, under `## Display before/after`, two lines per element:
`before: element | content shown | route` and `after: ...` (`hidden` when gone).
A pair that differs stays `product decision pending` until the product definition
changes; a matching pair is a design decision.

Report order (this paragraph is the one place that sets it): (1) when the project
reports in the six lines 작업, 업데이트 파일, 이슈, 해결, 남은 문제, 다음 작업
(JOENESS), those six lines open the report, where JOENESS reads them; (2) next, the
line `design check results:` and the list under it (or `design checks: none ran`);
(3) `## Display before/after` when the change has one; (4) any explanation
paragraphs, each outcome sentence with its parenthesis; (5) when the report is
stamped, the `report-check: ok <chars> chars <sha8>` line, always the last line.
Without the six lines the report starts at (2); a one-line title may precede (1).

## Open Decisions / Evidence Boundary

- R1 counter display undecided (see Project Decisions).
- No rendered observation has been made at any size; technical/visual checks and user acceptance remain separate.

## Amendment Rule

Only explicit user approval promotes DRAFT to APPROVED. Preserve APPROVED Rev N
while proposing a separately labeled DRAFT Rev N+1 in this same file. Replace the
active approved rule set only after proof and explicit approval. Local refinement
within approved intent does not automatically create a material revision.
