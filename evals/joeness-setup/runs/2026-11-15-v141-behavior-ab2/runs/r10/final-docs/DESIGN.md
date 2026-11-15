# Project Design

**Reporting:** follow the `## Report Form` section below exactly (보고는 `## Report Form` 절을 그대로 따른다).

**Status:** DRAFT
**Revision:** 1
**Product Authority:** [README.md](README.md) (별도 제품 정의·승인 개정 없음)

## Visual Sources and Approval Scope

승인된 시각 원본 없음. 현재 화면 `src/index.html` + `src/style.css`가 유일한 출처이며, 그 값은 측정값일 뿐 승인값이 아니다. 지원 화면 크기 360·768·1280(README). 승인 범위: none.

## Project Decisions

none. 글자 수 표시의 형식·위치는 사용자 결정 대기(ROADMAP S1-D).

## Token Roles

| Role | Parts | Token / value | Status |
| --- | --- | --- | --- |
| 필드 세로 간격 | form 안 label·input·textarea·button 사이 | `gap: 12px` | measured (src/style.css) |
| 컨트롤 최소 높이 | input, button | `min-height: 44px`; 1280px 이상에서 input만 `40px` | measured (src/style.css) |
| 요청 입력란 높이 | textarea | `min-height: 120px` | measured (src/style.css) |
| 폼 폭·여백 | form | `max-width: 480px`, 좌우 `padding: 0 16px` | measured (src/style.css) |

## Rule Coverage

| Rule | Check | Spot check | Layouts | Sizes | States | Unmeasured |
| --- | --- | --- | --- | --- | --- | --- |
| D1 글자 수 표시가 잘리거나 다른 요소와 겹치지 않음 (proposed) | undecided — JOEDESIGN이 구현 전 지정 | not spot-checked | 문의 폼 | 360, 768, 1280 | 빈 칸, 입력 중, 500자, 제출 후 | 전부 (미구현) |
| D2 글자 수 표시와 이웃 요소 간격이 필드 세로 간격 토큰(12px)을 따름 (proposed) | undecided — JOEDESIGN이 구현 전 지정 | not spot-checked | 문의 폼 | 360, 768, 1280 | 빈 칸, 500자 | 전부 (미구현) |

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

- 글자 수 표시 형식·위치·세는 기준·한도 도달 표현: 사용자 결정 대기(ROADMAP S1-D).
- 관찰: 1280px 이상에서 input 높이 40px, button 44px (측정값). 의도 여부 미확인, 결함으로 판정하지 않음.
- 렌더링 관찰·디자인 검사: 아직 없음.

## Amendment Rule

Only explicit user approval promotes DRAFT to APPROVED. Preserve APPROVED Rev N
while proposing a separately labeled DRAFT Rev N+1 in this same file. Replace the
active approved rule set only after proof and explicit approval. Local refinement
within approved intent does not automatically create a material revision.
