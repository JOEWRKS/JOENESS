# Project roadmap

Project scope: 문의 폼 화면의 디자인 규칙 적용.
Product authority: README.md.
Product revision / approval: none (README.md has no revision record; read 2026-11-15).
Current stage: S-1 폼 디자인 규칙 — complete (CO1, CO2, CO3 complete).
Next eligible work: none (다음 규칙 대기).
Status words: not started / in progress / verification pending / on hold / complete / removed from scope.

## Stage S-1 폼 디자인 규칙 — complete

Goal: 승인된 디자인 규칙 Rev 2 (C1–C3) 적용.
Entry condition: none.
Completion condition: CO1, CO2, CO3 complete.

| ID | Required outcome | Status | Check / completion criterion | Evidence or gap |
| --- | --- | --- | --- | --- |
| CO1 | 필드 간격 12px (C1) | complete | DESIGN.md#rule-coverage 행 C1 (360·768·1280 × 기본·focus) | TASK.md#co1, TASK.md#co3; gap: focus 렌더 간격 미측정 (토큰 검사만) |
| CO2 | 버튼 최소 높이 44px (C2) | complete | DESIGN.md#rule-coverage 행 C2 (360·768·1280 × 기본·focus) | TASK.md#co2, TASK.md#co3; gap: 규칙 상태 범위 안에는 없음 (hover·active는 범위 밖, 미측정) |
| CO3 | 입력창 최소 높이 44px, 360·768 (C3) | complete | DESIGN.md#rule-coverage 행 C3 (360·768 × 기본·focus) | TASK.md#co3; gap: 규칙 상태 범위 안에는 없음 (오류·disabled는 범위 밖, 미측정; 1280은 C3 밖) |

Scope decisions: C3 크기 범위 360·768 (사용자 요청 2026-11-15, DESIGN.md Rev 2).
User acceptance: not required.
Optional/later: none.
