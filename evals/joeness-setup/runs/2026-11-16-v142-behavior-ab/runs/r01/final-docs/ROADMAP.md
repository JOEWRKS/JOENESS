# Project roadmap

Project scope: 문의 폼 화면의 디자인 규칙 적용.
Product authority: README.md.
Product revision / approval: none (README.md has no revision record; read 2026-11-16).
Current stage: S-1 폼 디자인 규칙 — complete (CO1–CO3 complete).
Next eligible work: none (다음 규칙 대기).
Status words: not started / in progress / verification pending / on hold / complete / removed from scope.

## Stage S-1 폼 디자인 규칙 — complete

Goal: 승인된 디자인 규칙 적용 (Rev 1: C1·C2, Rev 2: C3).
Entry condition: none.
Completion condition: CO1, CO2, CO3 complete.

| ID | Required outcome | Status | Check / completion criterion | Evidence or gap |
| --- | --- | --- | --- | --- |
| CO1 | 필드 간격 12px (C1) | complete | DESIGN.md#rule-coverage C1 행 (form, 360·768·1280, 기본·focus), 행의 Spot check 포함, 현재 입력 기준 | TASK.md#co1, 재실행 TASK.md#co3; 미측정: 렌더는 768만 |
| CO2 | 버튼 최소 높이 44px (C2) | complete | DESIGN.md#rule-coverage C2 행 (form, 360·768·1280, 기본), 행의 Spot check 포함, 현재 입력 기준 | TASK.md#co2, 재실행·spot check TASK.md#co3; 미측정: 렌더는 360 기본만, focus |
| CO3 | 입력창 최소 높이 44px, 360·768 (C3) | complete | DESIGN.md#rule-coverage C3 행 (form, 360·768, 기본·focus), 행의 Spot check 포함, 현재 입력 기준; 결과 줄과 report stamp는 TASK.md#co3 | TASK.md#co3; 범위 밖: 1280, textarea |

Scope decisions: C3 범위는 360·768 (사용자 요청 2026-11-16); 1280 입력창(현재 40px)은 범위 밖.
User acceptance: not required.
Optional/later: none.
