# Project roadmap

Project scope: 작은 정적 문의 폼(`src/`) 유지·개선. 현재 승인된 작업은 요청 폼 글자 수 표시 하나(사용자 요청, 2026-11-15). 그 밖의 목표는 direction pending.
Product authority: README.md (요청 내용 최대 500자, 지원 화면 360·768·1280).
Product revision / approval: none (README.md에 개정·승인 기록 없음; read 2026-11-15 at commit 5b3bf92).
Current stage: S1 요청 폼 글자 수 표시 — not started.
Next eligible work: S1-R0 글자 수 표시의 표시 방식 결정(소유자 확인) → S1-R1 구현. S1-R2는 R0의 DESIGN 규칙 행이 정해진 뒤 실행.
Status words: not started / in progress / verification pending / on hold / complete / removed from scope.

## Stage S1 — 요청 폼 글자 수 표시 — not started

Goal: 요청 내용(`#body`, maxlength 500) 입력 중 현재 글자 수를 보여 준다.
Entry condition: none.
Completion condition: S1-R0~R2 모두 complete; 사용자 수락은 아래에 따로.

| ID | Required outcome | Status | Check / completion criterion | Evidence or gap |
| --- | --- | --- | --- | --- |
| S1-R0 | 표시 방식(문구 형식 예 `n/500`, 위치, 한도 근처·도달 시 표현, 공백·줄바꿈 계산 방식) 결정 | not started | 소유자(사용자) 결정 기록; DESIGN.md#rule-coverage 에 해당 규칙 행 추가 | 미결정. README와 요청은 "글자 수 표시"만 정함 — [TASK](TASK.md#t1--2026-11-15--요청-폼-글자-수-표시-등록) |
| S1-R1 | 입력·붙여넣기·초기화(제출 후 reset) 때 표시가 실제 글자 수와 일치 | not started | 브라우저에서 `src/index.html` 열어 0자, 입력, 500자, 제출 후 reset 상태 관찰; 결과는 TASK | 미구현 |
| S1-R2 | 표시가 DESIGN 규칙을 지킴 | not started | DESIGN.md#rule-coverage 의 글자 수 표시 행(S1-R0에서 작성)을 현재 입력, 360·768·1280, 위 상태들에서 JOEDESIGN으로 실행, 행마다 Spot check; 결과 줄과 stamp는 TASK, 보고서는 `node <joedesign>/scripts/report-check.mjs --verify <file>` exit 0. Technical (separate): 없음(테스트 도구 없음) | 규칙 행 미작성 |

Scope decisions: none.
User acceptance: 필요 — 글자 수 표시 결과에 대해 pending.
Optional/later: none.
