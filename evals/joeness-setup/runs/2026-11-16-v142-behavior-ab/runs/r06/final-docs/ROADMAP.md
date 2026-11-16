# Project roadmap

Project scope: 문의 폼 화면의 디자인 규칙 적용.
Product authority: README.md.
Product revision / approval: none (README.md has no revision record; read 2026-11-10).
Current stage: S-1 폼 디자인 규칙 — verification pending (CO3: C3 렌더 미측정·not spot-checked).
Next eligible work: CO3 — 360·768에서 input 렌더 높이 측정 및 C3 spot check (이 기계에 Playwright 없음).
Status words: not started / in progress / verification pending / on hold / complete / removed from scope.

## Stage S-1 폼 디자인 규칙 — verification pending

Goal: 승인된 디자인 규칙 적용 (Rev 1: C1·C2, Rev 2: C3).
Entry condition: none.
Completion condition: CO1, CO2, CO3 complete.

| ID | Required outcome | Status | Check / completion criterion | Evidence or gap |
| --- | --- | --- | --- | --- |
| CO1 | 필드 간격 12px (C1) | complete | DESIGN.md Rule Coverage C1 행 | TASK.md#co1; 재실행 TASK.md#co3 |
| CO2 | 버튼 최소 높이 44px (C2) | complete | DESIGN.md Rule Coverage C2 행 | TASK.md#co2; 재실행 TASK.md#co3 |
| CO3 | 입력창 최소 높이 44px, 360·768 (C3) | verification pending | DESIGN.md Rule Coverage C3 행 | TASK.md#co3; gap: 코드(토큰) 2/2 ok, 렌더 미측정, not spot-checked, focus 미측정 |

Scope decisions: CO3를 새 단계 대신 S-1에 추가 (2026-11-16 작업자 선택, 사용자 확인 대기).
User acceptance: not required.
Optional/later: none.
