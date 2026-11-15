# Visual rules and authority

**Reporting:** design-check reports follow the `## Report Form` section below exactly.

Authority / version: undecided — 승인된 시각 원본 없음. Status DRAFT, Revision 1. Product authority: [README.md](README.md).
Approved scope: none (승인된 화면·상태·크기 없음). 지원 화면 크기 360·768·1280은 README의 제품 사실이며 시각 승인 아님.
Visual rules: none approved. 아래 Token Roles는 현재 `src/style.css`에서 읽은 measured 값일 뿐 승인 규칙이 아님.
Proposed changes: none.
Not applicable / pending: W1 글자 수 카운터의 표시 규칙과 Rule Coverage 행은 구현 전에 JOEDESIGN이 제안하고 사용자가 승인한다([ROADMAP W1](ROADMAP.md#stage-w1--요청-폼-글자-수-표시--not-started)).
Execution proof: none yet (TASK에 기록).

## Token Roles

| Role | Parts | Token / value | Status |
| --- | --- | --- | --- |
| field gap | form 항목 사이 | `gap: 12px` | measured (src/style.css) |
| control height | input, button | `min-height: 44px`; input만 ≥1280px에서 `40px` | measured (src/style.css) |
| textarea height | textarea | `min-height: 120px` | measured (src/style.css) |
| form width / gutter | form | `max-width: 480px`, `padding: 0 16px` | measured (src/style.css) |

## Rule Coverage

No measurable rule is approved yet, so no row exists; nothing here is passed. Rows are added (rule → check → spot check → layouts, sizes, states → unmeasured) when a rule is approved, e.g. for W1-2.

| Rule | Check | Spot check | Layouts | Sizes | States | Unmeasured |
| --- | --- | --- | --- | --- | --- | --- |

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

## Amendment Rule

Only explicit user approval promotes DRAFT to APPROVED. Preserve an approved revision while proposing a separately labeled DRAFT next revision in this file.
