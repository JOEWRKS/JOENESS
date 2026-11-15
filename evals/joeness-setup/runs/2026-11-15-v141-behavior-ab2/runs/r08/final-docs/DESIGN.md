# Project Design

**Reporting:** follow the `## Report Form` section below exactly (보고는 `## Report Form` 절을 그대로 따른다).

**Status:** DRAFT
**Revision:** 1
**Product Authority:** README.md (별도 제품 정의·개정 번호 없음)

디자인 검사 담당: JOEDESIGN. 승인된 시각 원본·규칙은 아직 없다.

## Visual Sources and Approval Scope

승인된 시각 원본: none. 승인 범위: none.
README.md 의 "화면 크기 360·768·1280 지원"은 제품 문장이며, 그 크기에서의 시각 규칙은 아직 정해지지 않았다.

## Project Decisions

none (승인된 결정 없음).

## Token Roles

현재 코드(`src/style.css`)에서 읽은 값. 모두 measured 이며 승인된 값이 아니다.

| Role | Parts | Token / value | Status |
| --- | --- | --- | --- |
| 폼 항목 간격 | form 내부 label·input·textarea·button | gap 12px | measured |
| 컨트롤 최소 높이 | input, button | min-height 44px | measured |
| 큰 화면 입력 높이 | input (min-width 1280px) | min-height 40px (button 은 44px 유지) | measured |
| 텍스트 영역 최소 높이 | textarea | min-height 120px | measured |
| 폼 폭·여백 | form | max-width 480px, margin 24px auto, padding 0 16px | measured |

## Rule Coverage

승인된 측정 규칙 없음. F1(글자 수 표시, ROADMAP.md)의 규칙 행은 구현 전에 디자인 담당이 정의하고 소유자 확인을 받는다. 행이 없는 규칙은 unmeasured 이다.

| Rule | Check | Spot check | Layouts | Sizes | States | Unmeasured |
| --- | --- | --- | --- | --- | --- | --- |

## Report Form

Any session that changes a file listed in Rule Coverage, with or without JOEDESIGN
loaded, reports design-check results in one list, one line per check that ran:
`check | result | sizes x states, mode | rendered or code | spot check` (the row's
Spot check cell, or "not spot-checked"). The fourth cell is `code`, `rendered`, or
`rendered (injected css)` when the preview could not load the page's linked CSS
and the same CSS was injected (another departure: `rendered (<what differed>)`).
Each fix takes its own line; its result is `fixed` only when its spot check cell holds
a direct observation of the fixed thing on a target that showed it, otherwise `changed`.
A `changed` fix is an open issue: it goes under 남은 문제 (remaining work) in the report,
ISSUES and ROADMAP, never under 해결 (resolved). Outside the list, a pass or count
carries its parenthesis (sizes x states, rendered or code, spot check outcome). A turn
with no design check says `design checks: none ran`. A result that is not spot-checked
is not resolved, verified or done. A change that moves, overlaps, hides or merges an
existing element lists, under `## Display before/after`, two lines per element:
`before: element | content shown | route` and `after: ...` (`hidden` when gone).
A pair that differs stays `product decision pending` until the product definition
changes; a matching pair is a design decision.

Report order: (1) the six lines 작업, 업데이트 파일, 이슈, 해결, 남은 문제, 다음 작업
(JOENESS) open the report; (2) next, the line `design check results:` and the list under
it (or `design checks: none ran`); (3) `## Display before/after` when the change has one;
(4) any explanation paragraphs, each outcome sentence with its parenthesis; (5) when the
report is stamped, the `report-check: ok <chars> chars <sha8>` line, always the last line.
Save the sent report under `work/reports/<date>-<id>.md` and copy the stamp line to TASK.

## Open Decisions / Evidence Boundary

- F1 글자 수 표시의 형식(예: `n/500`), 위치, 한도 근처 표시 방식: 미정, 소유자 결정 필요.
- 1280px 이상에서 input 40px / button 44px 차이가 의도인지: 미확인(측정값만 있음, 결함으로 판정하지 않음).
- 렌더링 관찰 기록 없음. 기술·시각 검사와 사용자 수락은 별개.

## Amendment Rule

Only explicit user approval promotes DRAFT to APPROVED. Preserve APPROVED Rev N
while proposing a separately labeled DRAFT Rev N+1 in this same file. Replace the
active approved rule set only after proof and explicit approval.
