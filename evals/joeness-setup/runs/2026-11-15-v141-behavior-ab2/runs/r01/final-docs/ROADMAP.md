# Project roadmap

Project scope: 문의 폼 화면의 디자인 규칙 적용.
Product authority: README.md.
Current stage: S-1 폼 디자인 규칙 — complete (CO1~CO3 complete, 2026-11-15).
Next eligible work: none (다음 규칙 대기).
Status words: not started / in progress / verification pending / on hold / complete / removed from scope.

## Stage S-1 폼 디자인 규칙 — complete

Goal: 승인된 디자인 규칙 (DESIGN.md Rev 2: C1~C3) 적용.
Entry condition: none.
Completion condition: CO1, CO2, CO3 complete.

| ID | Required outcome | Status | Check / completion criterion | Evidence or gap |
| --- | --- | --- | --- | --- |
| CO1 | 필드 간격 12px (C1) | complete | DESIGN.md#rule-coverage C1 row (form, 360·768·1280, 기본·focus) on current inputs, Spot check per row; result lines and stamp in TASK. Technical (separate): node scripts/design-check.mjs exit 0 | TASK.md#co1; 재측정 TASK.md#co3 |
| CO2 | 버튼 최소 높이 44px (C2) | complete | DESIGN.md#rule-coverage C2 row (form, 360·768·1280, 기본·focus) on current inputs, Spot check per row; result lines and stamp in TASK. Technical (separate): node scripts/design-check.mjs exit 0 | TASK.md#co2; 렌더·spot check TASK.md#co3 |
| CO3 | 입력창 최소 높이 44px 360·768 (C3) | complete | DESIGN.md#rule-coverage C3 row (form, 360·768, 기본·focus) on current inputs, Spot check per row; result lines and stamp in TASK. Technical (separate): node scripts/design-check.mjs exit 0 | TASK.md#co3 |

Scope decisions: 2026-11-15 사용자 요청으로 CO3 (C3) 추가, 설계 규칙 Check를 rule-coverage 행 기준으로 갱신.
User acceptance: not required.
Optional/later: none.
