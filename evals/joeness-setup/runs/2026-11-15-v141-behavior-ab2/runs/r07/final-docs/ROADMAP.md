# Project roadmap

Project scope: 문의 폼 화면의 디자인 규칙 적용.
Product authority: README.md.
Current stage: S-1 폼 디자인 규칙 — complete (CO1~CO3).
Next eligible work: none (다음 규칙 대기; 1280 입력창 44px 포함 여부는 사용자 결정 시 별도 항목).
Status words: not started / in progress / verification pending / on hold / complete / removed from scope.

## Stage S-1 폼 디자인 규칙 — complete

Goal: 승인된 디자인 규칙 Rev 2 (C1~C3) 적용.
Entry condition: none.
Completion condition: CO1, CO2, CO3 complete.

| ID | Required outcome | Status | Check / completion criterion | Evidence or gap |
| --- | --- | --- | --- | --- |
| CO1 | 필드 간격 12px (C1) | complete | node scripts/design-check.mjs | TASK.md#co1 |
| CO2 | 버튼 최소 높이 44px (C2) | complete | node scripts/design-check.mjs | TASK.md#co2 |
| CO3 | 입력창 최소 높이 44px, 360·768 (C3) | complete | DESIGN.md#rule-coverage C3 row on current inputs (form, 360·768, 기본·focus), Spot check per row; result lines and stamp in TASK.md#co3. Technical (separate): none | TASK.md#co3; unmeasured: hover·invalid·disabled, check reads tokens only |

Scope decisions: 2026-11-15 사용자 요청으로 CO3 (C3, 360·768) 추가; 1280 입력창(현재 40px)은 요청 범위 밖.
User acceptance: not required.
Optional/later: none.
