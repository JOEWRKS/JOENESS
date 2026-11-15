# Project roadmap

Project scope: 작은 정적 문의 폼(`src/index.html`) 유지·개선. 현재 승인된 작업은 F1(요청 폼 글자 수 표시, 사용자 요청 2026-11-15)뿐이며, 그 밖의 프로젝트 목표·단계는 direction pending(결정 필요: 다음 목표와 순서).
Product authority: [README.md](README.md) (요청 내용 최대 500자, 지원 화면 360·768·1280). README가 정하지 않는 동작은 undecided.
Product revision / approval: none (README.md has no revision or approval record; read 2026-11-15).
Current stage: Stage 1 — not started.
Next eligible work: F1 구현 전 표시 형식(위치·문구·형태) 확인과 JOEDESIGN 규칙 행 작성 → F1 구현.
Status words: not started / in progress / verification pending / on hold / complete / removed from scope.

## Stage 1 / 요청 폼 글자 수 표시 — not started

Goal: 요청 내용 입력란에 현재 글자 수가 보인다.
Entry condition: none.
Completion condition: F1 Check 전부 통과(현재 입력 기준), 표시 형식에 대한 사용자 확인. 사용자 수락은 별도.

| ID | Required outcome | Status | Check / completion criterion | Evidence or gap |
| --- | --- | --- | --- | --- |
| F1 | 요청 내용(`#body`) 입력 시 현재 글자 수가 표시된다 | not started | Behavior: 빈 상태·입력 중·500자·제출 후 초기화 상태에서 표시 숫자가 입력란의 실제 글자 수(maxlength 500 기준)와 일치, 브라우저 관찰. Design: DESIGN.md#rule-coverage 의 글자 수 표시 행(구현 전 JOEDESIGN으로 작성; 360·768·1280, 위 상태들), Spot check per row; result lines and stamp in TASK, `node <joedesign>/scripts/report-check.mjs --verify <file>` exit 0. Owner: 표시 형식(예: `N/500`, 위치, 문구)은 README·요청이 정하지 않음 → 사용자 확인 전 verification pending. | 미구현. 등록: [TASK](TASK.md#2026-11-15--f1-등록--요청-폼-글자-수-표시). 규칙 행 없음, 형식 미정. |

Scope decisions: none.
User acceptance: 표시 형식 확인 pending; 최종 수락 pending.
Optional/later: none.
