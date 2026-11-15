# Project Design

**Reporting:** follow the `## Report Form` section below exactly (보고는 `## Report Form` 절을 그대로 따른다).

**Status:** APPROVED
**Revision:** 2
**Product Authority:** README.md

<!-- Compact seed, not a required form. Keep only needed project decisions;
unknown/empty is valid. Do not retranscribe settled source specifications. -->

## Visual Sources and Approval Scope

<!-- Original artifact/version + direct real-asset pointers + surface/state/viewport.
Distinguish approved visual targets from ordinary references. Supplied ≠ approved.
Record actual approval and its scope; do not fabricate approval or source facts. -->

사용자 승인 Rev 1 (2026-11-01): 문의 폼 화면, 360·768·1280, 기본·focus. 별도 시안 없음.
사용자 요청 Rev 2 (2026-11-15): C3 추가 ("입력창 최소 높이 44px(360·768) 규칙을 디자인 규칙 C3으로 추가"). 범위 360·768; 1280은 규칙 밖.

## Project Decisions

<!-- Only needed relationships: source observation → preserve/change → concrete
implementation/native-role mapping → expected observable difference.
Distinguish measured / estimated / proposed / approved values when relevant.
Include relevant hierarchy/flow, spacing, type, color, imagery/crop or responsive/
state invariants; do not fill every craft topic or replace originals with prose. -->

- C1 필드 간격 12px (모든 크기).
- C2 버튼 최소 높이 44px (모든 크기, 터치 대상).
- C3 입력창 최소 높이 44px (360·768). 대상: 이름 input `#name`, 요청 내용 textarea `#body`. 1280은 규칙 밖 (현재 input min-height 40px).

## Token Roles

<!-- Required whenever a shared token (shadow, spacing step, radius, type size, color)
is used by more than one part. One row per role; the same role uses the same token
at every size. A part with no row has no token claim. Status per row: measured
(read from the shipped code), proposed, or approved (with the approval locator). -->

| Role | Parts | Token / value | Status |
| --- | --- | --- | --- |
| 필드 간격 | 폼 필드 사이 | field_gap 12 | approved (Rev 1) |
| 터치 높이 | 버튼 | button.min_height 44 | approved (Rev 1) |
| 입력 높이 | 입력창 (input) | input.min_height 44 @360·768 | approved (Rev 2, 2026-11-15 사용자 요청); @1280 40은 measured, 규칙 밖 |

## Rule Coverage

<!-- Required whenever this file states a measurable rule. One row per rule: which
check (script/command or manual observation) measures it, on which layouts, sizes
and states, and what it leaves unmeasured. A rule with no check is unmeasured, never
passed; "0 violations" means only the listed rows. The project's completion Check
(JOENESS ROADMAP) points here. After a change to any listed file, re-run the rows
of every affected rule. With the harness, the pinned JSON baseline must agree with
this table; without it, this table is the contract. Before a row counts, spot-check
it: compare the check's reading on one target with a direct observation of the
quantity the rule names. Fill the Spot check cell in every row with
"<target>: check N / observed M", or "not spot-checked"; an empty cell means not
spot-checked, and one row's spot check does not cover another row. When a result is
quoted elsewhere (report, ROADMAP), quote it with this row's layouts, sizes and
states, and with "not spot-checked" when that is the row's state; such a result is
not listed as resolved or verified. -->

| Rule | Check | Spot check | Layouts | Sizes | States | Unmeasured |
| --- | --- | --- | --- | --- | --- | --- |
| C1 필드 간격 12px | node scripts/design-check.mjs (토큰); 렌더 측정 2026-11-15 (브라우저 getBoundingClientRect, 폼 자식 사이 간격) | 768 form: check 12 / observed 12 | form | 360·768·1280 | 기본·focus(#name, #body) | 오류·비활성 상태, 다크 모드; 렌더 측정 스크립트는 저장소에 없음 |
| C2 버튼 최소 높이 44px | node scripts/design-check.mjs (토큰); 렌더 측정 2026-11-15 (button 높이) | not spot-checked (768 캡처 눈대중 정밀도 ±2px로 44 경계 판정 불가) | form | 360·768·1280 | 기본·focus(#name, #body) | button 자체 focus·hover·active, 다크 모드; 렌더 측정 스크립트는 저장소에 없음 |
| C3 입력창 최소 높이 44px | node scripts/design-check.mjs (토큰 input.min_height@360·768); 렌더 측정 2026-11-15 (#name, #body 높이) | 768 #name: check 50 / observed 약 50 (캡처 테두리, ±2px) | form | 360·768 | 기본·focus(#name, #body) | 오류(invalid) 상태, 다크 모드; 토큰 검사는 input만 (textarea 미포함); 렌더 측정 스크립트는 저장소에 없음 |

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

<!-- Missing source facts, conflicts and unobserved targets. Original and rendered
artifact pointers when relevant. Technical/visual checks and user acceptance remain
separate. Preserve existing custom sections instead of forcing this shape. -->

## Amendment Rule

Only explicit user approval promotes DRAFT to APPROVED. Preserve APPROVED Rev N
while proposing a separately labeled DRAFT Rev N+1 in this same file. Replace the
active approved rule set only after proof and explicit approval. Local refinement
within approved intent does not automatically create a material revision.
