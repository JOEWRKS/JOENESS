# Project roadmap

Project scope: 정적 문의 폼(`src/`). 현재 승인된 작업은 요청 폼 글자 수 표시(사용자 요청 2026-11-15) 하나. 그 밖의 장기 목표는 방향 미정(결정 필요: 다음 목표).
Product authority: [README.md](README.md) — 요청 내용 최대 500자, 화면 360·768·1280 지원. 별도 제품 정의·승인 개정 없음.
Current stage: S1 요청 폼 글자 수 표시 — not started (TASK 등록만, 구현 안 함).
Next eligible work: S1-D 표시 형식 사용자 결정 → S1-R1 구현(사용자 구현 지시 후) → S1-R2 JOEDESIGN 검사.
Status words: not started / in progress / verification pending / on hold / complete / removed from scope.

## Stage S1 / 요청 폼 글자 수 표시 — not started

Goal: 요청 내용 입력란(`#body`, 최대 500자)에 현재 글자 수를 보여 준다.
Entry condition: 사용자 구현 지시. S1-R1은 S1-D 결정에 의존.
Completion condition: S1-D, S1-R1, S1-R2가 각 Check 통과. 사용자 수락은 아래 별도.

| ID | Required outcome | Status | Check / completion criterion | Evidence or gap |
| --- | --- | --- | --- | --- |
| S1-D | 표시 형식 결정: 문구(예: `0 / 500`), 위치, 세는 기준(`maxlength`와 같은 기준인지), 한도 도달 시 표현 | not started | 사용자 결정이 TASK에 기록됨 | gap: 미결정. 요청은 "글자 수 표시"만 정함 ([TASK-001](TASK.md#task-001--2026-11-15--요청-폼-글자-수-표시)) |
| S1-R1 | 입력·붙여넣기·삭제 시 글자 수가 바로 바뀌고, 제출 후 초기화되면 0으로 돌아옴. 500자에서 표시가 한도와 일치 | not started | 브라우저 관찰: 빈 칸, 입력 중, 500자, 제출 후 4개 상태의 표시 값. 결과는 TASK | gap: 미구현 |
| S1-R2 | 글자 수 표시가 360·768·1280에서 잘림·겹침 없이 기존 폼 간격을 지킴 | not started | DESIGN.md#rule-coverage D1~D2 rows on current inputs, Spot check per row; result lines and stamp in TASK. JOEDESIGN 보고는 `node <joedesign>/scripts/report-check.mjs --verify <file>` exit 0. Technical (separate): S1-R1 | gap: 미구현. D1~D2 Check 방법은 JOEDESIGN이 구현 전에 정함 |

Scope decisions: none.
User acceptance: 글자 수 표시 최종 모습의 사용자 수락 — 필요 여부 미정(사용자 결정).
Optional/later: 스크린리더용 글자 수 안내(aria-live 등) — 요구되지 않음, 필수 항목 아님.
