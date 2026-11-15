# Project Design

**Reporting:** follow the `## Report Form` section below exactly (보고는 `## Report Form` 절을 그대로 따른다).

**Status:** DRAFT
**Revision:** 1
**Product Authority:** [README.md](README.md) at commit 490f22d (별도 제품 승인 기록 없음).

## Visual Sources and Approval Scope

Authority / version: 승인된 시각 원본 없음 (undecided). 현재 화면은 `src/index.html`·`src/style.css`의 구현뿐이며, 구현은 승인이 아니다.
Approved scope: none.
Supported sizes (Product source): 360·768·1280 (README.md).
Design check owner: JOEDESIGN (`<joedesign>` = 작업 기기에 설치된 JOEDESIGN 스킬 폴더).
Execution proof: TASK 해당 항목 링크; 결과 로그를 여기 복사하지 않는다.

## Project Decisions

Approved visual rules: none.
Proposed changes: 요청 내용 글자 수 표시 (ROADMAP S1). 형식·위치·한도 도달 표시는 미결정 (ROADMAP S1-2).

## Token Roles

| Role | Parts | Token / value | Status |
| --- | --- | --- | --- |
| field gap | form 항목 사이 | `gap: 12px` | measured (src/style.css, 490f22d) |
| control min height | input, button | `min-height: 44px`; ≥1280px input `40px` | measured (src/style.css, 490f22d) |
| textarea min height | textarea | `min-height: 120px` | measured (src/style.css, 490f22d) |
| form width | form | `max-width: 480px`, 좌우 `padding: 0 16px` | measured (src/style.css, 490f22d) |

## Rule Coverage

| Rule | Check | Spot check | Layouts | Sizes | States | Unmeasured |
| --- | --- | --- | --- | --- | --- | --- |
| L1 폼이 가로 넘침·잘림 없이 표시 (README 지원 크기) | JOEDESIGN rendered capture/measurement (명령은 첫 실행 때 TASK에 기록) | not spot-checked | 문의 폼 단일 화면 | 360, 768, 1280 | 빈 값, 입력 중, 500자 | 전부 (아직 실행 안 함) |
| C1 글자 수 표시가 보이고 입력란·버튼과 겹치지 않음 | undecided (S1-2 형식 결정 후 확정) | not spot-checked | 문의 폼 단일 화면 | 360, 768, 1280 | 빈 값, 입력 중, 500자 | 전부 (규칙 미확정) |

## Report Form

Any session that changes a file listed in Rule Coverage, with or without JOEDESIGN
loaded, reports design-check results in one list, one line per check that ran:
`check | result | sizes x states, mode | rendered or code | spot check` (the row's
Spot check cell, or "not spot-checked"). The fourth cell is `code`, `rendered`, or
`rendered (injected css)` when the preview could not load the page's linked CSS
and the same CSS was injected (another departure: `rendered (<what differed>)`).
Each fix takes its own line; its result is `fixed` only when its spot check cell
holds a direct observation of the fixed thing on a target that showed it, otherwise
`changed`. A `changed` fix is an open issue: it goes under 남은 문제 (remaining work)
in the report, ISSUES and ROADMAP, never under 해결 (resolved). Outside the list, a
pass or count carries its parenthesis (sizes x states, rendered or code, spot check
outcome). A turn with no design check says `design checks: none ran`. A result that
is not spot-checked is not resolved, verified or done. A change that moves, overlaps,
hides or merges an existing element lists, under `## Display before/after`, two lines
per element: `before: element | content shown | route` and `after: ...` (`hidden`
when gone). A pair that differs stays `product decision pending` until the product
definition changes; a matching pair is a design decision.

Report order: (1) the six JOENESS lines 작업, 업데이트 파일, 이슈, 해결, 남은 문제,
다음 작업; (2) the line `design check results:` and the list under it (or
`design checks: none ran`); (3) `## Display before/after` when the change has one;
(4) any explanation paragraphs, each outcome sentence with its parenthesis; (5) when
the report is stamped, the `report-check: ok <chars> chars <sha8>` line, always last.
Save a stamped report at `work/reports/<date>-<task id>.md` and name it in TASK.

## Open Decisions / Evidence Boundary

글자 수 표시 형식·위치 (ROADMAP S1-2). 렌더링 관찰 미실행. 기술 검사·시각 검사·사용자 수락은 별개.

## Amendment Rule

Only explicit user approval promotes DRAFT to APPROVED. Preserve APPROVED Rev N
while proposing a separately labeled DRAFT Rev N+1 in this same file. Replace the
active approved rule set only after proof and explicit approval.
