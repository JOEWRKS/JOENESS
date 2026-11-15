# Project roadmap

Project scope: 문의 폼(`README.md`: 이름·요청 내용 입력, 요청 내용 최대 500자, 화면 360·768·1280 지원). 이번에 등록된 작업은 요청 폼 글자 수 표시(R1). 그 밖의 전체 납품 목표·단계 순서: 미정(결정 필요: 사용자).
Product authority: `README.md` (전체). 별도 제품 정의 문서 없음.
Product revision / approval: none (README에 개정·승인 기록 없음; 2026-11-15 읽음).
Current stage: Stage 1 — 요청 폼 글자 수 표시, not started.
Next eligible work: R1 표시 형식 결정(R1-D) 확인 후 R1-C1 구현; R1-V1 디자인 규칙 행은 구현 전에 DESIGN에 정의.
Status words: not started / in progress / verification pending / on hold / complete / removed from scope.

## Stage 1 — 요청 폼 글자 수 표시 — not started

Goal: 요청 내용 입력란에 현재 글자 수를 표시(사용자 요청 2026-11-15, [TASK](TASK.md#t1--2026-11-15--요청-폼-글자-수-표시-등록)).
Entry condition: none.
Completion condition: R1-D, R1-C1, R1-V1 모두 아래 Check 통과. 사용자 수락은 별도(아래).

| ID | Required outcome | Status | Check / completion criterion | Evidence or gap |
| --- | --- | --- | --- | --- |
| R1-D | 표시 형식·위치·500자 도달 시 동작 결정 | not started | 사용자(제품 소유자) 확인 기록. README는 500자 제한만 정하고 표시 형식은 정하지 않음 | 미결정 |
| R1-C1 | 요청 내용 입력·삭제·붙여넣기·폼 초기화 후 표시 수가 실제 글자 수와 일치, 최대 500 | not started | 브라우저에서 `src/index.html` 0자·임의 입력·500자·보내기 후 초기화 상태 관찰 결과를 TASK에 기록 | 미구현 |
| R1-V1 | 글자 수 표시의 시각 규칙 준수 | not started | DESIGN.md#rule-coverage 의 글자 수 표시 행(구현 전 정의)을 현재 입력으로 360·768·1280, 위 상태에서 실행, 행마다 Spot check; 결과 줄과 JOEDESIGN 보고서 스탬프는 TASK에, 완료 전 `node <joedesign>/scripts/report-check.mjs --verify <file>` exit 0 | 규칙 행 미정의, 미실행 |

Scope decisions: none.
User acceptance: 글자 수 표시 결과의 사용자 수락 pending(필요 여부 포함 미정).
Optional/later: none.
