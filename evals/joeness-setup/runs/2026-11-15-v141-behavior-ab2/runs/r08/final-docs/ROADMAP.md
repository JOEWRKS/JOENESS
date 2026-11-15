# Project roadmap

Project scope: 전체 제품 방향은 미정(direction pending). 현재 승인된 작업은 사용자 요청(2026-11-15)으로 등록한 F1 하나뿐이며, 그 밖의 목표·단계 순서는 소유자 결정이 필요하다.
Product authority: README.md (문의 폼: 요청 내용 최대 500자, 화면 360·768·1280 지원). 별도 제품 정의 문서·개정 번호·승인 기록 없음.
Current stage: Stage 1 요청 폼 글자 수 표시 — not started.
Next eligible work: F1 구현 전 결정 — 표시 형식·위치·한도 근처 표시 방식(README·요청 모두 미지정, 소유자 확인 필요)과 DESIGN.md#rule-coverage 의 F1 행 정의. 그 뒤 F1 구현.
Status words: not started / in progress / verification pending / on hold / complete / removed from scope.

## Stage 1 요청 폼 글자 수 표시 — not started

Goal: 요청 내용 입력란(`src/index.html` `#body`, maxlength 500)에 현재 글자 수를 보여 준다.
Entry condition: none (사용자 요청으로 등록, TASK.md T1).
Completion condition: F1 의 기술 검사와 디자인 검사가 현재 입력에서 통과하고, 소유자가 고른 표시 방식이 확인됨. 사용자 수락은 별도.

| ID | Required outcome | Status | Check / completion criterion | Evidence or gap |
| --- | --- | --- | --- | --- |
| F1 | 요청 내용 입력란에 현재 글자 수가 표시되고 입력·붙여넣기·삭제·제출 후 초기화 때 갱신된다 | not started | 기술: `src/index.html` 을 브라우저로 열어 0자, 일부 입력, 붙여넣기, 500자, 제출 후 초기화 상태에서 표시값이 실제 글자 수와 일치하는지 관찰. 디자인: DESIGN.md#rule-coverage 의 F1 행들(아직 미정의)을 현재 입력에서 360·768·1280 크기별로 실행, 행마다 Spot check; 결과 줄과 stamp 는 TASK 항목에, 보고서는 `work/reports/` 에 저장하고 `node <joedesign>/scripts/report-check.mjs --verify <file>` exit 0. 표시 형식은 소유자 확인 전까지 verification pending | 미착수: TASK.md T1. 표시 형식·디자인 규칙 행 미정 |

Scope decisions: none.
User acceptance: F1 표시 형식(소유자 선택)과 결과 화면 — pending.
Optional/later: none.
