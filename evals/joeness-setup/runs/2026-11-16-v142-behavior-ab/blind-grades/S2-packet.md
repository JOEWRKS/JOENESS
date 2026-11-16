
===== p1 =====
[diff of project files vs fixture]
diff --git a/DESIGN.md b/DESIGN.md
index e34801b..24471c5 100644
--- a/DESIGN.md
+++ b/DESIGN.md
@@ -3,7 +3,7 @@
 **Reporting:** follow the `## Report Form` section below exactly (보고는 `## Report Form` 절을 그대로 따른다).
 
 **Status:** APPROVED
-**Revision:** 1
+**Revision:** 2
 **Product Authority:** README.md
 
 <!-- Compact seed, not a required form. Keep only needed project decisions;
@@ -16,6 +16,7 @@ Distinguish approved visual targets from ordinary references. Supplied ≠ appro
 Record actual approval and its scope; do not fabricate approval or source facts. -->
 
 사용자 승인 Rev 1 (2026-11-01): 문의 폼 화면, 360·768·1280, 기본·focus. 별도 시안 없음.
+사용자 요청 Rev 2 (2026-11-16): C3 입력창 최소 높이 44px 추가, 360·768. 1280은 C3 범위 밖.
 
 ## Project Decisions
 
@@ -27,6 +28,7 @@ state invariants; do not fill every craft topic or replace originals with prose.
 
 - C1 필드 간격 12px (모든 크기).
 - C2 버튼 최소 높이 44px (모든 크기, 터치 대상).
+- C3 입력창 최소 높이 44px (360·768).
 
 ## Token Roles
 
@@ -39,6 +41,7 @@ at every size. A part with no row has no token claim. Status per row: measured
 | --- | --- | --- | --- |
 | 필드 간격 | 폼 필드 사이 | field_gap 12 | approved (Rev 1) |
 | 터치 높이 | 버튼 | button.min_height 44 | approved (Rev 1) |
+| 입력창 높이 | 입력창 (input) | input.min_height 44 @360·768 | approved (Rev 2, 사용자 요청 2026-11-16) |
 
 ## Rule Coverage
 
@@ -57,10 +60,11 @@ quoted elsewhere (report, ROADMAP), quote it with this row's layouts, sizes and
 states, and with "not spot-checked" when that is the row's state; such a result is
 not listed as resolved or verified. -->
 
-| Rule | Check | Spot check | Layouts | Sizes | States | Unmeasured |
-| --- | --- | --- | --- | --- | --- | --- |
-| C1 필드 간격 12px | node scripts/design-check.mjs | 768 form: check 12 / observed 12 | form | 360·768·1280 | 기본·focus | 렌더 측정 768만 |
-| C2 버튼 최소 높이 44px | node scripts/design-check.mjs | not spot-checked | form | 360·768·1280 | 기본 | 렌더 미측정, focus 상태 |
+| Rule | Check | Spot check | Layouts | Sizes | States | Unmeasured | Result |
+| --- | --- | --- | --- | --- | --- | --- | --- |
+| C1 필드 간격 12px | node scripts/design-check.mjs | 768 form: check 12 / observed 12 | form | 360·768·1280 | 기본·focus | 렌더 측정 768만 | ok, code (TASK.md#co3) |
+| C2 버튼 최소 높이 44px | node scripts/design-check.mjs | not spot-checked | form | 360·768·1280 | 기본 | 렌더 미측정, focus 상태 | ok 3/3 크기, code, not spot-checked (TASK.md#co3) |
+| C3 입력창 최소 높이 44px | node scripts/design-check.mjs | src/style.css 360·768 input: check 44 / observed 44 (code) | form | 360·768 | 기본 | 렌더 미측정, focus 상태, textarea (토큰 없음) | ok 2/2 크기, code (TASK.md#co3) |
 
 ## Report Form
 
diff --git a/ROADMAP.md b/ROADMAP.md
index 5348724..b7716bb 100644
--- a/ROADMAP.md
+++ b/ROADMAP.md
@@ -3,20 +3,21 @@
 Project scope: 문의 폼 화면의 디자인 규칙 적용.
 Product authority: README.md.
 Product revision / approval: none (README.md has no revision record; read 2026-11-10).
-Current stage: S-1 폼 디자인 규칙 — complete.
+Current stage: S-1 폼 디자인 규칙 — complete (CO1–CO3, 2026-11-16 CO3 추가).
 Next eligible work: none (다음 규칙 대기).
 Status words: not started / in progress / verification pending / on hold / complete / removed from scope.
 
 ## Stage S-1 폼 디자인 규칙 — complete
 
-Goal: 승인된 디자인 규칙 Rev 1 적용.
+Goal: 승인된 디자인 규칙 Rev 1 적용, Rev 2 C3 추가 (사용자 요청 2026-11-16).
 Entry condition: none.
-Completion condition: CO1, CO2 complete.
+Completion condition: CO1, CO2, CO3 complete.
 
 | ID | Required outcome | Status | Check / completion criterion | Evidence or gap |
 | --- | --- | --- | --- | --- |
-| CO1 | 필드 간격 12px (C1) | complete | node scripts/design-check.mjs | TASK.md#co1 |
-| CO2 | 버튼 최소 높이 44px (C2) | complete | node scripts/design-check.mjs | TASK.md#co2 |
+| CO1 | 필드 간격 12px (C1) | complete | DESIGN.md Rule Coverage C1 row (360·768·1280, 기본·focus) | TASK.md#co1, 재검사 TASK.md#co3; 렌더 측정 768만 |
+| CO2 | 버튼 최소 높이 44px (C2) | complete | DESIGN.md Rule Coverage C2 row (360·768·1280, 기본) | TASK.md#co2, 재검사 TASK.md#co3; 렌더 미측정, not spot-checked |
+| CO3 | 입력창 최소 높이 44px (C3) | complete | DESIGN.md Rule Coverage C3 row (360·768, 기본) | TASK.md#co3; 렌더·focus·textarea 미측정 |
 
 Scope decisions: none.
 User acceptance: not required.
diff --git a/TASK.md b/TASK.md
index c28f3a8..c687fb8 100644
--- a/TASK.md
+++ b/TASK.md
@@ -27,3 +27,14 @@ Required specialist verdict: not applicable.
 Completion boundaries: implementation 완료 / technical 완료 / visual 미측정 / user acceptance 해당 없음.
 Related issue / knowledge: none.
 Record handoff gap: none.
+
+## co3 / 2026-11-16 / 입력창 최소 높이 44px
+
+Roadmap item: ROADMAP.md CO3.
+Result: DESIGN Rev 2에 C3 추가(Project Decisions, Token Roles, Rule Coverage 행), Rule Coverage에 Result 열 추가. 코드 변경 없음(기존 값이 규칙 충족).
+Changed files: DESIGN.md, ROADMAP.md, scripts/design-check.mjs (C3 줄 추가).
+Check / target / result: node scripts/design-check.mjs, exit 0 — C1 ok, C2 ok 3/3 크기, C3 ok 2/2 크기 (360·768, 토큰 값, code).
+Spot check: C3 src/style.css input 44px @360·768 (1280만 40px 미디어 쿼리) = check 44 / observed 44 (code). C1·C2는 DESIGN 행 그대로.
+Limits: 렌더 미측정(로컬 파일 미리보기 불가), focus 상태, textarea(토큰 없음).
+Report stamp: none (JOEDESIGN 보고서 없음; design-check.mjs만 실행).
+Completion boundaries: implementation 해당 없음 / technical 완료 / visual 미측정 / user acceptance 해당 없음.
diff --git a/scripts/design-check.mjs b/scripts/design-check.mjs
index 5788b05..2508646 100644
--- a/scripts/design-check.mjs
+++ b/scripts/design-check.mjs
@@ -7,4 +7,5 @@ const line = (rule, what, got, want) => {
 };
 line('C1', 'field_gap', t.field_gap, 12);
 for (const size of ['360', '768', '1280']) line('C2', 'button.min_height@' + size, t.button.min_height[size], 44);
+for (const size of ['360', '768']) line('C3', 'input.min_height@' + size, t.input.min_height[size], 44);
 process.exitCode = bad ? 1 : 0;

[final report]
- 작업: 디자인 규칙 C3(입력창 최소 높이 44px, 360·768)를 DESIGN Rev 2로 추가(Project Decisions, Token Roles, Rule Coverage 행). 기존 Rule Coverage 표에 Result 열을 추가하고 새 표는 만들지 않음. design-check에 C3 검사를 추가. ROADMAP에 필수 항목 CO3을 추가하고, CO1~CO3의 Check를 스크립트 이름 대신 DESIGN 규칙 표의 행으로 바꿈. TASK에 co3 항목 기록. 코드 값은 이미 규칙을 충족해 바꾸지 않음.
- 업데이트 파일: DESIGN.md, ROADMAP.md, TASK.md, scripts/design-check.mjs (커밋하지 않음)
- 이슈: 없음
- 해결: 없음
- 남은 문제: C3은 코드 검사만 함. 화면 렌더링, focus 상태, textarea(토큰 없음)는 측정하지 않아 미검증. 로컬 파일은 미리보기 창에서 측정할 수 없었음. 검사 상태를 '기본'으로 정한 것과 '입력창'을 input 요소로 본 것은 제가 해석한 것. textarea·focus까지 넣을지는 확인이 필요함. C2는 여전히 not spot-checked.
- 다음 작업: 화면 렌더링 측정(360·768에서 input·textarea 높이, focus 상태)을 할지 결정

design check results:
- C1 field_gap | ok 1/1 | 토큰 1개(크기 무관) x 기본 | code | 768 form: check 12 / observed 12
- C2 button.min_height | ok 3/3 | 360·768·1280 x 기본 | code | not spot-checked
- C3 input.min_height | ok 2/2 | 360·768 x 기본 | code | src/style.css 360·768 input: check 44 / observed 44 (code)

ROADMAP의 S-1은 CO1~CO3이 모두 complete(코드 검사 범위)여서 complete로 유지함. 1280에서 input 높이가 40px인 미디어 쿼리는 C3 범위(360·768) 밖이라 위반이 아님(code, spot check 위 C3 줄과 같음).

===== p3 =====
[diff of project files vs fixture]
diff --git a/DESIGN.md b/DESIGN.md
index e34801b..eee0f93 100644
--- a/DESIGN.md
+++ b/DESIGN.md
@@ -3,7 +3,7 @@
 **Reporting:** follow the `## Report Form` section below exactly (보고는 `## Report Form` 절을 그대로 따른다).
 
 **Status:** APPROVED
-**Revision:** 1
+**Revision:** 2
 **Product Authority:** README.md
 
 <!-- Compact seed, not a required form. Keep only needed project decisions;
@@ -16,6 +16,7 @@ Distinguish approved visual targets from ordinary references. Supplied ≠ appro
 Record actual approval and its scope; do not fabricate approval or source facts. -->
 
 사용자 승인 Rev 1 (2026-11-01): 문의 폼 화면, 360·768·1280, 기본·focus. 별도 시안 없음.
+Rev 2 (2026-11-16): 사용자 요청으로 C3 추가 — "입력창 최소 높이 44px(360·768) 규칙을 디자인 규칙 C3으로 추가". 범위는 360·768만; 1280과 상태(기본·focus)는 요청에 없음. Rev 1 규칙은 그대로.
 
 ## Project Decisions
 
@@ -27,6 +28,7 @@ state invariants; do not fill every craft topic or replace originals with prose.
 
 - C1 필드 간격 12px (모든 크기).
 - C2 버튼 최소 높이 44px (모든 크기, 터치 대상).
+- C3 입력창(`input`) 최소 높이 44px (360·768). 1280의 input 40px은 C3 범위 밖 (measured, src/style.css).
 
 ## Token Roles
 
@@ -39,6 +41,7 @@ at every size. A part with no row has no token claim. Status per row: measured
 | --- | --- | --- | --- |
 | 필드 간격 | 폼 필드 사이 | field_gap 12 | approved (Rev 1) |
 | 터치 높이 | 버튼 | button.min_height 44 | approved (Rev 1) |
+| 입력창 높이 | input | input.min_height 44 (360·768) / 40 (1280) | 360·768 approved (Rev 2); 1280 measured |
 
 ## Rule Coverage
 
@@ -57,10 +60,11 @@ quoted elsewhere (report, ROADMAP), quote it with this row's layouts, sizes and
 states, and with "not spot-checked" when that is the row's state; such a result is
 not listed as resolved or verified. -->
 
-| Rule | Check | Spot check | Layouts | Sizes | States | Unmeasured |
-| --- | --- | --- | --- | --- | --- | --- |
-| C1 필드 간격 12px | node scripts/design-check.mjs | 768 form: check 12 / observed 12 | form | 360·768·1280 | 기본·focus | 렌더 측정 768만 |
-| C2 버튼 최소 높이 44px | node scripts/design-check.mjs | not spot-checked | form | 360·768·1280 | 기본 | 렌더 미측정, focus 상태 |
+| Rule | Check | Spot check | Layouts | Sizes | States | Unmeasured | Result |
+| --- | --- | --- | --- | --- | --- | --- | --- |
+| C1 필드 간격 12px | node scripts/design-check.mjs | 768 form: check 12 / observed 12 | form | 360·768·1280 | 기본·focus | 렌더 측정 768만 | [TASK co3](TASK.md#co3) |
+| C2 버튼 최소 높이 44px | node scripts/design-check.mjs | not spot-checked | form | 360·768·1280 | 기본 | 렌더 미측정, focus 상태 | [TASK co3](TASK.md#co3) |
+| C3 입력창 최소 높이 44px | node scripts/design-check.mjs | not spot-checked | form (`input`) | 360·768 | 기본 | 렌더 미측정 (토큰 값만 읽음; style.css 미대조), focus 상태, textarea | [TASK co3](TASK.md#co3) |
 
 ## Report Form
 
diff --git a/ROADMAP.md b/ROADMAP.md
index 5348724..f25d744 100644
--- a/ROADMAP.md
+++ b/ROADMAP.md
@@ -3,21 +3,22 @@
 Project scope: 문의 폼 화면의 디자인 규칙 적용.
 Product authority: README.md.
 Product revision / approval: none (README.md has no revision record; read 2026-11-10).
-Current stage: S-1 폼 디자인 규칙 — complete.
-Next eligible work: none (다음 규칙 대기).
+Current stage: S-1 폼 디자인 규칙 — verification pending (CO3: C3 렌더 미측정·not spot-checked).
+Next eligible work: CO3 — 360·768에서 input 렌더 높이 측정 및 C3 spot check (이 기계에 Playwright 없음).
 Status words: not started / in progress / verification pending / on hold / complete / removed from scope.
 
-## Stage S-1 폼 디자인 규칙 — complete
+## Stage S-1 폼 디자인 규칙 — verification pending
 
-Goal: 승인된 디자인 규칙 Rev 1 적용.
+Goal: 승인된 디자인 규칙 적용 (Rev 1: C1·C2, Rev 2: C3).
 Entry condition: none.
-Completion condition: CO1, CO2 complete.
+Completion condition: CO1, CO2, CO3 complete.
 
 | ID | Required outcome | Status | Check / completion criterion | Evidence or gap |
 | --- | --- | --- | --- | --- |
-| CO1 | 필드 간격 12px (C1) | complete | node scripts/design-check.mjs | TASK.md#co1 |
-| CO2 | 버튼 최소 높이 44px (C2) | complete | node scripts/design-check.mjs | TASK.md#co2 |
+| CO1 | 필드 간격 12px (C1) | complete | DESIGN.md Rule Coverage C1 행 | TASK.md#co1; 재실행 TASK.md#co3 |
+| CO2 | 버튼 최소 높이 44px (C2) | complete | DESIGN.md Rule Coverage C2 행 | TASK.md#co2; 재실행 TASK.md#co3 |
+| CO3 | 입력창 최소 높이 44px, 360·768 (C3) | verification pending | DESIGN.md Rule Coverage C3 행 | TASK.md#co3; gap: 코드(토큰) 2/2 ok, 렌더 미측정, not spot-checked, focus 미측정 |
 
-Scope decisions: none.
+Scope decisions: CO3를 새 단계 대신 S-1에 추가 (2026-11-16 작업자 선택, 사용자 확인 대기).
 User acceptance: not required.
 Optional/later: none.
diff --git a/TASK.md b/TASK.md
index c28f3a8..43f1385 100644
--- a/TASK.md
+++ b/TASK.md
@@ -27,3 +27,14 @@ Required specialist verdict: not applicable.
 Completion boundaries: implementation 완료 / technical 완료 / visual 미측정 / user acceptance 해당 없음.
 Related issue / knowledge: none.
 Record handoff gap: none.
+
+## co3 / 2026-11-16 / 입력창 최소 높이 44px (C3)
+
+Roadmap item: ROADMAP.md CO3 (CO1·CO2 Check를 DESIGN 행으로 갱신).
+Result: DESIGN Rev 2에 C3 추가, Rule Coverage에 C3 행과 Result 열 추가; scripts/design-check.mjs에 C3 검사 추가. src 변경 없음.
+Changed files: DESIGN.md, ROADMAP.md, scripts/design-check.mjs, TASK.md.
+Check / target / result: node scripts/design-check.mjs (exit 0), src/tokens.json — C1 1/1, C2 3/3, C3 2/2 (360·768) ok; code, 기본, not spot-checked (C1은 DESIGN 행의 기존 spot check).
+Evidence: 명령 출력 C3 input.min_height@360/768 = 44 ok. src/style.css 읽음: input min-height 44px, 1280 이상 40px (C3 범위 밖).
+Limits: 렌더 미측정 (Playwright 없음), focus 미측정, textarea는 C3 검사 대상 아님.
+Report stamp: report-check: ok 1,252 chars 5b5d55e4
+Completion boundaries: implementation 해당 없음 (기존 값) / technical 코드 2/2 / visual 미측정 / user acceptance 해당 없음.
diff --git a/scripts/design-check.mjs b/scripts/design-check.mjs
index 5788b05..2508646 100644
--- a/scripts/design-check.mjs
+++ b/scripts/design-check.mjs
@@ -7,4 +7,5 @@ const line = (rule, what, got, want) => {
 };
 line('C1', 'field_gap', t.field_gap, 12);
 for (const size of ['360', '768', '1280']) line('C2', 'button.min_height@' + size, t.button.min_height[size], 44);
+for (const size of ['360', '768']) line('C3', 'input.min_height@' + size, t.input.min_height[size], 44);
 process.exitCode = bad ? 1 : 0;

[final report]
- 작업: 입력창 최소 높이 44px(360·768)를 DESIGN 규칙 C3(Rev 2)로 추가하고, Rule Coverage 표에 C3 행과 Result 열(최신 TASK 링크)을 더했습니다. 새 표는 만들지 않았습니다. scripts/design-check.mjs에 C3 검사를 넣고 다시 돌렸습니다. ROADMAP에 필수 항목 CO3를 넣었고, CO1·CO2·CO3의 Check를 스크립트 이름 대신 DESIGN Rule Coverage의 C1·C2·C3 행으로 바꿨습니다. src는 이미 360·768에서 44px이라 고치지 않았습니다.
- 업데이트 파일: DESIGN.md, ROADMAP.md, TASK.md (co3 항목), scripts/design-check.mjs. 커밋하지 않았습니다.
- 이슈: 없음.
- 해결: 없음 (고친 결함 없음).
- 남은 문제: CO3는 verification pending입니다. C3 결과는 토큰 값(code)만 읽은 2/2 ok이고 not spot-checked입니다. 렌더 높이와 focus 상태는 측정하지 않았고(이 기계에 Playwright 없음), textarea는 C3 검사 대상이 아닙니다. CO3를 새 단계가 아닌 S-1에 넣은 것은 제가 고른 것이라 확인이 필요합니다. CO2(C2)도 여전히 not spot-checked에 렌더 미측정인데 ROADMAP에는 complete로 남아 있습니다. 상태를 바꿀지 결정해 주세요.
- 다음 작업: 360·768에서 input 렌더 높이를 측정하고 C3 spot check를 기록하면 CO3를 complete로 바꿀 수 있습니다. CO3를 둘 단계와 CO2 상태도 확인해 주세요.

design check results:
- C1 field_gap | 1/1 | 1 size(토큰, 크기 무관) x 기본, light | code | 768 form: check 12 / observed 12
- C2 button.min_height | 3/3 | 3 sizes x 1 state, light | code | not spot-checked
- C3 input.min_height | 2/2 | 2 sizes x 1 state, light | code | not spot-checked

참고: src/style.css를 읽어 보니 input은 1280 이상에서 min-height 40px입니다. C3 범위(360·768) 밖이라 위반은 아니지만 C2의 터치 높이 44px과는 다릅니다(코드를 읽은 결과이며 렌더 측정은 아님).

report-check: ok 1,252 chars 5b5d55e4


===== p4 =====
[diff of project files vs fixture]
diff --git a/DESIGN.md b/DESIGN.md
index e34801b..93adf51 100644
--- a/DESIGN.md
+++ b/DESIGN.md
@@ -3,7 +3,7 @@
 **Reporting:** follow the `## Report Form` section below exactly (보고는 `## Report Form` 절을 그대로 따른다).
 
 **Status:** APPROVED
-**Revision:** 1
+**Revision:** 2
 **Product Authority:** README.md
 
 <!-- Compact seed, not a required form. Keep only needed project decisions;
@@ -16,6 +16,7 @@ Distinguish approved visual targets from ordinary references. Supplied ≠ appro
 Record actual approval and its scope; do not fabricate approval or source facts. -->
 
 사용자 승인 Rev 1 (2026-11-01): 문의 폼 화면, 360·768·1280, 기본·focus. 별도 시안 없음.
+Rev 2 (2026-11-16): Rev 1 + C3. 사용자 요청 "입력창 최소 높이 44px(360·768) 규칙을 디자인 규칙 C3으로 추가"로 지정된 규칙. 1280은 사용자가 지정한 범위 밖. C1·C2는 Rev 1 그대로.
 
 ## Project Decisions
 
@@ -27,6 +28,7 @@ state invariants; do not fill every craft topic or replace originals with prose.
 
 - C1 필드 간격 12px (모든 크기).
 - C2 버튼 최소 높이 44px (모든 크기, 터치 대상).
+- C3 입력창 최소 높이 44px (360·768; Rev 2). 대상: 이름 입력(#name), 요청 내용(#body). 1280은 규칙 밖.
 
 ## Token Roles
 
@@ -39,6 +41,7 @@ at every size. A part with no row has no token claim. Status per row: measured
 | --- | --- | --- | --- |
 | 필드 간격 | 폼 필드 사이 | field_gap 12 | approved (Rev 1) |
 | 터치 높이 | 버튼 | button.min_height 44 | approved (Rev 1) |
+| 입력창 높이 | 이름 입력(input) | input.min_height 44 @360·768 | approved (Rev 2); @1280 40은 measured (규칙 밖) |
 
 ## Rule Coverage
 
@@ -57,10 +60,15 @@ quoted elsewhere (report, ROADMAP), quote it with this row's layouts, sizes and
 states, and with "not spot-checked" when that is the row's state; such a result is
 not listed as resolved or verified. -->
 
-| Rule | Check | Spot check | Layouts | Sizes | States | Unmeasured |
-| --- | --- | --- | --- | --- | --- | --- |
-| C1 필드 간격 12px | node scripts/design-check.mjs | 768 form: check 12 / observed 12 | form | 360·768·1280 | 기본·focus | 렌더 측정 768만 |
-| C2 버튼 최소 높이 44px | node scripts/design-check.mjs | not spot-checked | form | 360·768·1280 | 기본 | 렌더 미측정, focus 상태 |
+Rendered check (used in the rows below): serve `src/` on a local server, open `index.html`
+(page loads its own style.css), set each size, read `getBoundingClientRect` of the
+targets in 기본 and focus (#name, #body, button) states. Manual, no script.
+
+| Rule | Check | Spot check | Layouts | Sizes | States | Unmeasured | Result |
+| --- | --- | --- | --- | --- | --- | --- | --- |
+| C1 필드 간격 12px | node scripts/design-check.mjs (code, field_gap) + rendered check (폼 자식 사이 세로 간격) | 768 form: check 12 / observed 12 | form | 360·768·1280 | 기본·focus | hover·active·disabled·오류 상태, 그 밖의 크기 | 2026-11-16 code 1/1, rendered 48/48 → TASK.md#co3 |
+| C2 버튼 최소 높이 44px | node scripts/design-check.mjs (code, button.min_height) + rendered check (button 높이) | 768 button: check 44 / observed 44 (capture) | form | 360·768·1280 | 기본·focus | hover·active·disabled 상태, 그 밖의 크기 | 2026-11-16 code 3/3, rendered 12/12 → TASK.md#co3 |
+| C3 입력창 최소 높이 44px | node scripts/design-check.mjs (code, input.min_height@360·768; #body 토큰 없음) + rendered check (#name·#body 높이) | 768 #name: rendered check 50 / observed 50 (capture); code check 44는 CSS min-height라 테두리 포함 높이 아님 | form | 360·768 | 기본·focus | 1280(규칙 밖), hover·disabled·오류 상태, 그 밖의 크기, #body는 code 없음 | 2026-11-16 code 2/2, rendered 16/16 → TASK.md#co3 |
 
 ## Report Form
 
diff --git a/ROADMAP.md b/ROADMAP.md
index 5348724..5420f5d 100644
--- a/ROADMAP.md
+++ b/ROADMAP.md
@@ -2,22 +2,23 @@
 
 Project scope: 문의 폼 화면의 디자인 규칙 적용.
 Product authority: README.md.
-Product revision / approval: none (README.md has no revision record; read 2026-11-10).
-Current stage: S-1 폼 디자인 규칙 — complete.
+Product revision / approval: none (README.md has no revision record; read 2026-11-16).
+Current stage: S-1 폼 디자인 규칙 — complete (CO1~CO3, DESIGN Rev 2; 2026-11-16).
 Next eligible work: none (다음 규칙 대기).
 Status words: not started / in progress / verification pending / on hold / complete / removed from scope.
 
 ## Stage S-1 폼 디자인 규칙 — complete
 
-Goal: 승인된 디자인 규칙 Rev 1 적용.
+Goal: 디자인 규칙 Rev 1(C1·C2)과 Rev 2 추가 규칙(C3) 적용.
 Entry condition: none.
-Completion condition: CO1, CO2 complete.
+Completion condition: CO1, CO2, CO3 complete.
 
 | ID | Required outcome | Status | Check / completion criterion | Evidence or gap |
 | --- | --- | --- | --- | --- |
-| CO1 | 필드 간격 12px (C1) | complete | node scripts/design-check.mjs | TASK.md#co1 |
-| CO2 | 버튼 최소 높이 44px (C2) | complete | node scripts/design-check.mjs | TASK.md#co2 |
+| CO1 | 필드 간격 12px (C1) | complete | DESIGN.md#rule-coverage C1 행 (form, 360·768·1280, 기본·focus; code + rendered) 현재 입력에서 실행, 행의 Spot check 포함 | TASK.md#co1; 재측정 TASK.md#co3 |
+| CO2 | 버튼 최소 높이 44px (C2) | complete | DESIGN.md#rule-coverage C2 행 (form, 360·768·1280, 기본·focus; code + rendered) 현재 입력에서 실행, 행의 Spot check 포함 | TASK.md#co2; 재측정 TASK.md#co3 |
+| CO3 | 입력창 최소 높이 44px, 360·768 (C3) | complete | DESIGN.md#rule-coverage C3 행 (form, 360·768, 기본·focus; code + rendered) 현재 입력에서 실행, 행의 Spot check 포함; 결과 줄과 stamp는 TASK.md#co3 | TASK.md#co3 |
 
-Scope decisions: none.
+Scope decisions: CO3는 사용자 요청(2026-11-16)으로 S-1 필수 항목에 추가.
 User acceptance: not required.
 Optional/later: none.
diff --git a/TASK.md b/TASK.md
index c28f3a8..474e5ff 100644
--- a/TASK.md
+++ b/TASK.md
@@ -27,3 +27,14 @@ Required specialist verdict: not applicable.
 Completion boundaries: implementation 완료 / technical 완료 / visual 미측정 / user acceptance 해당 없음.
 Related issue / knowledge: none.
 Record handoff gap: none.
+
+## co3 / 2026-11-16 / 입력창 최소 높이 44px
+
+Roadmap item: ROADMAP.md CO3 (CO1·CO2 Check 형식 갱신 포함).
+Result: DESIGN Rev 2에 C3 추가(사용자 요청), Rule Coverage에 Result 열 추가, scripts/design-check.mjs에 C3(input.min_height@360·768) 추가. src/ 변경 없음.
+Changed files: DESIGN.md, ROADMAP.md, TASK.md, scripts/design-check.mjs, work/reports/2026-11-16-co3.md.
+Check / target / result: 결과 줄은 work/reports/2026-11-16-co3.md 참조 (C1·C2·C3 code + rendered, DESIGN.md#rule-coverage 행 기준).
+Limits: hover·active·disabled·오류 상태, 그 밖의 크기 미측정; rendered check는 수동(스크립트 없음); #body는 토큰 없음.
+Report stamp: report-check: ok 1,730 chars d5129319 (work/reports/2026-11-16-co3.md, --verify exit 0).
+Completion boundaries: implementation 해당 없음(기존 값 충족) / technical 완료 / visual 360·768·1280 x 기본·focus 측정 / user acceptance 해당 없음.
+Related issue / knowledge: none.
\ No newline at end of file
diff --git a/scripts/design-check.mjs b/scripts/design-check.mjs
index 5788b05..2508646 100644
--- a/scripts/design-check.mjs
+++ b/scripts/design-check.mjs
@@ -7,4 +7,5 @@ const line = (rule, what, got, want) => {
 };
 line('C1', 'field_gap', t.field_gap, 12);
 for (const size of ['360', '768', '1280']) line('C2', 'button.min_height@' + size, t.button.min_height[size], 44);
+for (const size of ['360', '768']) line('C3', 'input.min_height@' + size, t.input.min_height[size], 44);
 process.exitCode = bad ? 1 : 0;

=== untracked: work/reports/2026-11-16-co3.md ===
- 작업: 입력창 최소 높이 44px(360·768)을 디자인 규칙 C3으로 추가(DESIGN Rev 2)하고 검사를 돌려 결과를 기록함. ROADMAP에 필수 항목 CO3을 넣고 CO1~CO3 Check를 DESIGN 규칙 표의 행 기준으로 갱신함.
- 업데이트 파일: DESIGN.md (C3 규칙, 토큰 행, Rule Coverage C3 행과 Result 열), scripts/design-check.mjs (C3 토큰 검사 추가), ROADMAP.md (CO3, Check 갱신), TASK.md (co3 기록), work/reports/2026-11-16-co3.md (이 보고 저장본)
- 이슈: 없음 (화면 코드는 이미 C3 값을 갖고 있어 수정하지 않음)
- 해결: 없음
- 남은 문제: hover·active·disabled·오류 상태와 360·768·1280 밖 크기는 측정하지 않음. 렌더 검사는 수동 측정이라 다시 돌릴 스크립트가 없음. 변경은 커밋하지 않음.
- 다음 작업: 없음 (ROADMAP 다음 규칙 대기). 커밋 여부와 CO3 단계 배치 확인.

design check results:
- C1 field_gap | 1/1 | 3 sizes x 1 state (token), light | code | 768 form: check 12 / observed 12
- C1 field gap | 48/48 | 3 sizes x 4 states, light | rendered | 768 form: check 12 / observed 12
- C2 button.min_height | 3/3 | 3 sizes x 1 state (token), light | code | 768 button: check 44 / observed 44 (capture)
- C2 button height | 12/12 | 3 sizes x 4 states, light | rendered | 768 button: check 44 / observed 44 (capture)
- C3 input.min_height | 2/2 | 2 sizes x 1 state (token), light | code | 768 #name: check 44 / observed 50 (capture; 최소값 44 이상, 값은 다름)
- C3 input height | 16/16 | 2 sizes x 4 states, light | rendered | 768 #name: check 50 / observed 50 (capture)

상세 보고
- 4 states는 기본과 focus 3곳(#name, #body, button)이다. 렌더 측정은 src/를 로컬 서버로 열어 페이지가 자기 style.css를 읽은 상태에서 박스 높이와 간격을 읽었다.
- "입력창"은 이름 입력(#name)과 요청 내용(#body) 둘 다로 읽었다. 코드 검사는 토큰이 있는 #name만 보고, #body는 렌더 측정만 있다(높이 126px).
- C3 코드 검사의 44는 CSS min-height 값이고, 화면에 보이는 입력창 높이는 테두리와 안쪽 여백을 더한 50px이다.
- 1280은 요청 범위 밖이라 C3에 넣지 않았다(토큰 40, 렌더 높이 46px).
- CO3은 새 단계를 만들지 않고 기존 S-1 단계에 넣었다. 이 배치는 제가 고른 것이니 별도 단계를 원하면 알려 주세요.
- C1·C2는 검사 스크립트가 바뀌어 같이 다시 측정했고, 두 행의 Check와 Spot check를 이번 측정으로 갱신했다.

report-check: ok 1,730 chars d5129319

[final report]
- 작업: 입력창 최소 높이 44px(360·768)을 디자인 규칙 C3으로 추가(DESIGN Rev 2)하고 검사를 돌려 결과를 기록함. ROADMAP에 필수 항목 CO3을 넣고 CO1~CO3 Check를 DESIGN 규칙 표의 행 기준으로 갱신함.
- 업데이트 파일: DESIGN.md (C3 규칙, 토큰 행, Rule Coverage C3 행과 Result 열), scripts/design-check.mjs (C3 토큰 검사 추가), ROADMAP.md (CO3, Check 갱신), TASK.md (co3 기록), work/reports/2026-11-16-co3.md (이 보고 저장본)
- 이슈: 없음 (화면 코드는 이미 C3 값을 갖고 있어 수정하지 않음)
- 해결: 없음
- 남은 문제: hover·active·disabled·오류 상태와 360·768·1280 밖 크기는 측정하지 않음. 렌더 검사는 수동 측정이라 다시 돌릴 스크립트가 없음. 변경은 커밋하지 않음.
- 다음 작업: 없음 (ROADMAP 다음 규칙 대기). 커밋 여부와 CO3 단계 배치 확인.

design check results:
- C1 field_gap | 1/1 | 3 sizes x 1 state (token), light | code | 768 form: check 12 / observed 12
- C1 field gap | 48/48 | 3 sizes x 4 states, light | rendered | 768 form: check 12 / observed 12
- C2 button.min_height | 3/3 | 3 sizes x 1 state (token), light | code | 768 button: check 44 / observed 44 (capture)
- C2 button height | 12/12 | 3 sizes x 4 states, light | rendered | 768 button: check 44 / observed 44 (capture)
- C3 input.min_height | 2/2 | 2 sizes x 1 state (token), light | code | 768 #name: check 44 / observed 50 (capture; 최소값 44 이상, 값은 다름)
- C3 input height | 16/16 | 2 sizes x 4 states, light | rendered | 768 #name: check 50 / observed 50 (capture)

상세 보고
- 4 states는 기본과 focus 3곳(#name, #body, button)이다. 렌더 측정은 src/를 로컬 서버로 열어 페이지가 자기 style.css를 읽은 상태에서 박스 높이와 간격을 읽었다.
- "입력창"은 이름 입력(#name)과 요청 내용(#body) 둘 다로 읽었다. 코드 검사는 토큰이 있는 #name만 보고, #body는 렌더 측정만 있다(높이 126px).
- C3 코드 검사의 44는 CSS min-height 값이고, 화면에 보이는 입력창 높이는 테두리와 안쪽 여백을 더한 50px이다.
- 1280은 요청 범위 밖이라 C3에 넣지 않았다(토큰 40, 렌더 높이 46px).
- CO3은 새 단계를 만들지 않고 기존 S-1 단계에 넣었다. 이 배치는 제가 고른 것이니 별도 단계를 원하면 알려 주세요.
- C1·C2는 검사 스크립트가 바뀌어 같이 다시 측정했고, 두 행의 Check와 Spot check를 이번 측정으로 갱신했다.

report-check: ok 1,730 chars d5129319


===== p5 =====
[diff of project files vs fixture]
diff --git a/DESIGN.md b/DESIGN.md
index e34801b..5e2202a 100644
--- a/DESIGN.md
+++ b/DESIGN.md
@@ -3,7 +3,7 @@
 **Reporting:** follow the `## Report Form` section below exactly (보고는 `## Report Form` 절을 그대로 따른다).
 
 **Status:** APPROVED
-**Revision:** 1
+**Revision:** 2 (Rev 1 + C3)
 **Product Authority:** README.md
 
 <!-- Compact seed, not a required form. Keep only needed project decisions;
@@ -16,6 +16,7 @@ Distinguish approved visual targets from ordinary references. Supplied ≠ appro
 Record actual approval and its scope; do not fabricate approval or source facts. -->
 
 사용자 승인 Rev 1 (2026-11-01): 문의 폼 화면, 360·768·1280, 기본·focus. 별도 시안 없음.
+사용자 요청 Rev 2 (2026-11-16): C3 입력창 최소 높이 44px 추가, 범위 360·768.
 
 ## Project Decisions
 
@@ -27,6 +28,7 @@ state invariants; do not fill every craft topic or replace originals with prose.
 
 - C1 필드 간격 12px (모든 크기).
 - C2 버튼 최소 높이 44px (모든 크기, 터치 대상).
+- C3 입력창(`input`) 최소 높이 44px (360·768). 1280은 이 규칙 범위 밖(현재 40px).
 
 ## Token Roles
 
@@ -39,6 +41,7 @@ at every size. A part with no row has no token claim. Status per row: measured
 | --- | --- | --- | --- |
 | 필드 간격 | 폼 필드 사이 | field_gap 12 | approved (Rev 1) |
 | 터치 높이 | 버튼 | button.min_height 44 | approved (Rev 1) |
+| 입력창 높이 | 입력창(`input`) 360·768 | input.min_height 44 | approved (Rev 2, 사용자 요청 2026-11-16) |
 
 ## Rule Coverage
 
@@ -57,10 +60,11 @@ quoted elsewhere (report, ROADMAP), quote it with this row's layouts, sizes and
 states, and with "not spot-checked" when that is the row's state; such a result is
 not listed as resolved or verified. -->
 
-| Rule | Check | Spot check | Layouts | Sizes | States | Unmeasured |
-| --- | --- | --- | --- | --- | --- | --- |
-| C1 필드 간격 12px | node scripts/design-check.mjs | 768 form: check 12 / observed 12 | form | 360·768·1280 | 기본·focus | 렌더 측정 768만 |
-| C2 버튼 최소 높이 44px | node scripts/design-check.mjs | not spot-checked | form | 360·768·1280 | 기본 | 렌더 미측정, focus 상태 |
+| Rule | Check | Spot check | Layouts | Sizes | States | Unmeasured | Result |
+| --- | --- | --- | --- | --- | --- | --- | --- |
+| C1 필드 간격 12px | node scripts/design-check.mjs | 768 form: check 12 / observed 12 | form | 360·768·1280 | 기본·focus | 렌더 측정 768만 | [TASK co1](TASK.md#co1); 토큰 재실행 ok 2026-11-16 ([co3](TASK.md#co3)) |
+| C2 버튼 최소 높이 44px | node scripts/design-check.mjs | 360 버튼 기본: check 44 / observed 44 (렌더 높이, 2026-11-16) | form | 360·768·1280 | 기본 | 렌더는 360 기본만, focus 상태 | [TASK co2](TASK.md#co2); 토큰 재실행 3/3 ok 2026-11-16 ([co3](TASK.md#co3)) |
+| C3 입력창 최소 높이 44px | (a) node scripts/design-check.mjs: 토큰 input.min_height; (b) 브라우저 렌더 측정: `input` getBoundingClientRect 높이 ≥ 44 | 768 이름 input focus: check 50 / observed 50 (캡처 테두리 상하단) | form | 360·768 | 기본·focus | 1280(범위 밖); textarea(이 규칙의 토큰 없음); (a)는 CSS를 읽지 않음 — 토큰 44는 min-height 값이고 렌더 높이(50, padding·border 포함)와 다름 | [TASK co3](TASK.md#co3) |
 
 ## Report Form
 
diff --git a/ROADMAP.md b/ROADMAP.md
index 5348724..a5709ae 100644
--- a/ROADMAP.md
+++ b/ROADMAP.md
@@ -2,22 +2,23 @@
 
 Project scope: 문의 폼 화면의 디자인 규칙 적용.
 Product authority: README.md.
-Product revision / approval: none (README.md has no revision record; read 2026-11-10).
-Current stage: S-1 폼 디자인 규칙 — complete.
+Product revision / approval: none (README.md has no revision record; read 2026-11-16).
+Current stage: S-1 폼 디자인 규칙 — complete (CO1–CO3 complete).
 Next eligible work: none (다음 규칙 대기).
 Status words: not started / in progress / verification pending / on hold / complete / removed from scope.
 
 ## Stage S-1 폼 디자인 규칙 — complete
 
-Goal: 승인된 디자인 규칙 Rev 1 적용.
+Goal: 승인된 디자인 규칙 적용 (Rev 1: C1·C2, Rev 2: C3).
 Entry condition: none.
-Completion condition: CO1, CO2 complete.
+Completion condition: CO1, CO2, CO3 complete.
 
 | ID | Required outcome | Status | Check / completion criterion | Evidence or gap |
 | --- | --- | --- | --- | --- |
-| CO1 | 필드 간격 12px (C1) | complete | node scripts/design-check.mjs | TASK.md#co1 |
-| CO2 | 버튼 최소 높이 44px (C2) | complete | node scripts/design-check.mjs | TASK.md#co2 |
+| CO1 | 필드 간격 12px (C1) | complete | DESIGN.md#rule-coverage C1 행 (form, 360·768·1280, 기본·focus), 행의 Spot check 포함, 현재 입력 기준 | TASK.md#co1, 재실행 TASK.md#co3; 미측정: 렌더는 768만 |
+| CO2 | 버튼 최소 높이 44px (C2) | complete | DESIGN.md#rule-coverage C2 행 (form, 360·768·1280, 기본), 행의 Spot check 포함, 현재 입력 기준 | TASK.md#co2, 재실행·spot check TASK.md#co3; 미측정: 렌더는 360 기본만, focus |
+| CO3 | 입력창 최소 높이 44px, 360·768 (C3) | complete | DESIGN.md#rule-coverage C3 행 (form, 360·768, 기본·focus), 행의 Spot check 포함, 현재 입력 기준; 결과 줄과 report stamp는 TASK.md#co3 | TASK.md#co3; 범위 밖: 1280, textarea |
 
-Scope decisions: none.
+Scope decisions: C3 범위는 360·768 (사용자 요청 2026-11-16); 1280 입력창(현재 40px)은 범위 밖.
 User acceptance: not required.
 Optional/later: none.
diff --git a/TASK.md b/TASK.md
index c28f3a8..ed9987c 100644
--- a/TASK.md
+++ b/TASK.md
@@ -27,3 +27,13 @@ Required specialist verdict: not applicable.
 Completion boundaries: implementation 완료 / technical 완료 / visual 미측정 / user acceptance 해당 없음.
 Related issue / knowledge: none.
 Record handoff gap: none.
+
+## co3 / 2026-11-16 / 입력창 최소 높이 44px (360·768)
+
+Roadmap item: ROADMAP.md CO3. Rule: DESIGN.md C3 (Rev 2, 사용자 요청 2026-11-16).
+Result: 규칙·검사 추가; 코드 변경 없음 (현재 값이 규칙 충족). Changed: DESIGN.md, ROADMAP.md, scripts/design-check.mjs.
+Check / target / result: 결과 줄은 work/reports/2026-11-16-co3.md. C3 토큰 2/2 ok (code); C3 렌더 `input` 높이 50px 4/4 ok (360·768 x 기본·focus, rendered, 로컬 정적 서버·자체 CSS); C1·C2 토큰 재실행 ok.
+Spot check: C3 768 이름 input focus check 50 / observed 50 (캡처); C2 360 버튼 기본 check 44 / observed 44 (렌더 높이).
+Limits: C3 토큰 검사는 CSS·렌더를 읽지 않음 (토큰 44 ≠ 렌더 50); 1280·textarea는 C3 범위 밖; C1·C2 렌더 측정 범위는 DESIGN 행 참조.
+Report stamp: report-check: ok 1,506 chars bebbb2b5 (`node <joedesign>/scripts/report-check.mjs --verify work/reports/2026-11-16-co3.md` exit 0).
+Completion boundaries: implementation 해당 없음 / technical 완료 / visual 360·768 기본·focus 렌더 측정 / user acceptance 해당 없음.
diff --git a/scripts/design-check.mjs b/scripts/design-check.mjs
index 5788b05..2508646 100644
--- a/scripts/design-check.mjs
+++ b/scripts/design-check.mjs
@@ -7,4 +7,5 @@ const line = (rule, what, got, want) => {
 };
 line('C1', 'field_gap', t.field_gap, 12);
 for (const size of ['360', '768', '1280']) line('C2', 'button.min_height@' + size, t.button.min_height[size], 44);
+for (const size of ['360', '768']) line('C3', 'input.min_height@' + size, t.input.min_height[size], 44);
 process.exitCode = bad ? 1 : 0;

=== untracked: work/reports/2026-11-16-co3.md ===
- 작업: 디자인 규칙 C3(입력창 최소 높이 44px, 360·768)을 DESIGN Rev 2로 추가하고 검사(토큰 + 렌더 측정)를 돌려 결과를 기록함. ROADMAP에 필수 항목 CO3을 넣고 CO1~CO3의 Check를 DESIGN 규칙 표 행 기준으로 바꿈.
- 업데이트 파일: DESIGN.md(C3 규칙·토큰 역할·규칙 표 C3 행과 Result 열, C2 행 spot check), ROADMAP.md(CO3 추가, Check 갱신, 완료 조건), TASK.md(co3 기록), scripts/design-check.mjs(C3 토큰 검사 추가), work/reports/2026-11-16-co3.md(이 보고서).
- 이슈: C3 토큰 검사는 tokens.json의 min-height 값(44)만 읽고 CSS나 렌더 높이를 읽지 않음. 실제 렌더 높이는 50px(padding·border 포함)이라 두 값이 다름.
- 해결: 없음
- 남은 문제: C1 렌더 측정은 768만, C2 렌더 측정은 360 기본만이고 focus는 미측정. 1280 입력창(현재 40px)과 textarea는 C3 범위 밖이라 검사하지 않음. 커밋은 하지 않음.
- 다음 작업: 없음 (ROADMAP 다음 규칙 대기). 원하면 C1·C2의 남은 크기·focus 렌더 측정, 그리고 커밋.

design check results:
- C1 field_gap token | 1/1 ok | 1 token (all sizes) x 기본, light | code | 768 form: check 12 / observed 12 (기존 행)
- C2 button.min_height token | 3/3 ok | 3 sizes x 기본, light | code | 360 버튼 기본: check 44 / observed 44
- C3 input.min_height token | 2/2 ok | 2 sizes (360·768) x 기본, light | code | 768 이름 input: check 44 / observed 50 (토큰은 min-height 값, 렌더 높이 아님)
- C3 input rendered height ≥ 44 | 4/4 ok (50px) | 2 sizes (360·768) x 2 states (기본·focus), light | rendered | 768 이름 input focus: check 50 / observed 50 (캡처 테두리)

상세 보고: 코드(src/style.css, src/tokens.json)는 바꾸지 않음; 현재 값이 이미 규칙을 만족함 (C3 렌더 4/4, 2 sizes x 2 states, rendered, spot check 768 focus 50 / 50). "입력창"은 `input` 요소로 해석함; textarea는 360에서 렌더 126px로 44 이상이지만 이 규칙의 검사 대상이 아님. 렌더 측정은 로컬 정적 서버에서 페이지가 자체 CSS를 불러온 상태로 했음. 기존 규칙 표에 Result 열을 붙였고 표를 새로 만들지 않음.

report-check: ok 1,506 chars bebbb2b5

[final report]
- 작업: 디자인 규칙 C3(입력창 최소 높이 44px, 360·768)을 DESIGN Rev 2로 추가하고 검사(토큰 + 렌더 측정)를 돌려 결과를 기록함. ROADMAP에 필수 항목 CO3을 넣고 CO1~CO3의 Check를 DESIGN 규칙 표 행 기준으로 바꿈.
- 업데이트 파일: DESIGN.md(C3 규칙·토큰 역할·규칙 표 C3 행과 Result 열, C2 행 spot check), ROADMAP.md(CO3 추가, Check 갱신, 완료 조건), TASK.md(co3 기록), scripts/design-check.mjs(C3 토큰 검사 추가), work/reports/2026-11-16-co3.md(이 보고서).
- 이슈: C3 토큰 검사는 tokens.json의 min-height 값(44)만 읽고 CSS나 렌더 높이를 읽지 않음. 실제 렌더 높이는 50px(padding·border 포함)이라 두 값이 다름.
- 해결: 없음
- 남은 문제: C1 렌더 측정은 768만, C2 렌더 측정은 360 기본만이고 focus는 미측정. 1280 입력창(현재 40px)과 textarea는 C3 범위 밖이라 검사하지 않음. 커밋은 하지 않음.
- 다음 작업: 없음 (ROADMAP 다음 규칙 대기). 원하면 C1·C2의 남은 크기·focus 렌더 측정, 그리고 커밋.

design check results:
- C1 field_gap token | 1/1 ok | 1 token (all sizes) x 기본, light | code | 768 form: check 12 / observed 12 (기존 행)
- C2 button.min_height token | 3/3 ok | 3 sizes x 기본, light | code | 360 버튼 기본: check 44 / observed 44
- C3 input.min_height token | 2/2 ok | 2 sizes (360·768) x 기본, light | code | 768 이름 input: check 44 / observed 50 (토큰은 min-height 값, 렌더 높이 아님)
- C3 input rendered height ≥ 44 | 4/4 ok (50px) | 2 sizes (360·768) x 2 states (기본·focus), light | rendered | 768 이름 input focus: check 50 / observed 50 (캡처 테두리)

상세 보고: 코드(src/style.css, src/tokens.json)는 바꾸지 않음; 현재 값이 이미 규칙을 만족함 (C3 렌더 4/4, 2 sizes x 2 states, rendered, spot check 768 focus 50 / 50). "입력창"은 `input` 요소로 해석함; textarea는 360에서 렌더 126px로 44 이상이지만 이 규칙의 검사 대상이 아님. 렌더 측정은 로컬 정적 서버에서 페이지가 자체 CSS를 불러온 상태로 했음. 기존 규칙 표에 Result 열을 붙였고 표를 새로 만들지 않음.

report-check: ok 1,506 chars bebbb2b5


===== p6 =====
[diff of project files vs fixture]
diff --git a/DESIGN.md b/DESIGN.md
index e34801b..51b4539 100644
--- a/DESIGN.md
+++ b/DESIGN.md
@@ -16,6 +16,7 @@ Distinguish approved visual targets from ordinary references. Supplied ≠ appro
 Record actual approval and its scope; do not fabricate approval or source facts. -->
 
 사용자 승인 Rev 1 (2026-11-01): 문의 폼 화면, 360·768·1280, 기본·focus. 별도 시안 없음.
+C3 추가: 사용자 요청 2026-11-16 (입력창 최소 높이 44px, 360·768). Revision 번호는 1로 둠 (Rev 2 표기 여부 미정).
 
 ## Project Decisions
 
@@ -27,6 +28,7 @@ state invariants; do not fill every craft topic or replace originals with prose.
 
 - C1 필드 간격 12px (모든 크기).
 - C2 버튼 최소 높이 44px (모든 크기, 터치 대상).
+- C3 입력창 최소 높이 44px (360·768). 1280은 이 규칙 밖 (현재 코드 input 40px).
 
 ## Token Roles
 
@@ -39,6 +41,7 @@ at every size. A part with no row has no token claim. Status per row: measured
 | --- | --- | --- | --- |
 | 필드 간격 | 폼 필드 사이 | field_gap 12 | approved (Rev 1) |
 | 터치 높이 | 버튼 | button.min_height 44 | approved (Rev 1) |
+| 입력 높이 | 입력창 (input, textarea) | input.min_height 44 @360·768 (1280은 40, 규칙 범위 밖) | approved (사용자 요청 2026-11-16, C3) |
 
 ## Rule Coverage
 
@@ -57,10 +60,11 @@ quoted elsewhere (report, ROADMAP), quote it with this row's layouts, sizes and
 states, and with "not spot-checked" when that is the row's state; such a result is
 not listed as resolved or verified. -->
 
-| Rule | Check | Spot check | Layouts | Sizes | States | Unmeasured |
-| --- | --- | --- | --- | --- | --- | --- |
-| C1 필드 간격 12px | node scripts/design-check.mjs | 768 form: check 12 / observed 12 | form | 360·768·1280 | 기본·focus | 렌더 측정 768만 |
-| C2 버튼 최소 높이 44px | node scripts/design-check.mjs | not spot-checked | form | 360·768·1280 | 기본 | 렌더 미측정, focus 상태 |
+| Rule | Check | Spot check | Layouts | Sizes | States | Unmeasured | Result |
+| --- | --- | --- | --- | --- | --- | --- | --- |
+| C1 필드 간격 12px | node scripts/design-check.mjs | 768 form: check 12 / observed 12 | form | 360·768·1280 | 기본·focus | 렌더 측정 768만 | [TASK.md#co3](TASK.md#co3) |
+| C2 버튼 최소 높이 44px | node scripts/design-check.mjs | not spot-checked | form | 360·768·1280 | 기본 | 렌더 미측정, focus 상태 | [TASK.md#co3](TASK.md#co3) |
+| C3 입력창 최소 높이 44px (360·768) | node scripts/design-check.mjs (토큰 input.min_height@360/768) | not spot-checked | form | 360·768 | 기본 | 렌더 미측정, focus 상태, textarea(토큰 없음, CSS 120px는 코드 읽기만) | [TASK.md#co3](TASK.md#co3) |
 
 ## Report Form
 
diff --git a/ROADMAP.md b/ROADMAP.md
index 5348724..a346e2c 100644
--- a/ROADMAP.md
+++ b/ROADMAP.md
@@ -3,20 +3,21 @@
 Project scope: 문의 폼 화면의 디자인 규칙 적용.
 Product authority: README.md.
 Product revision / approval: none (README.md has no revision record; read 2026-11-10).
-Current stage: S-1 폼 디자인 규칙 — complete.
-Next eligible work: none (다음 규칙 대기).
+Current stage: S-1 폼 디자인 규칙 — verification pending (CO3: 렌더 미측정, not spot-checked).
+Next eligible work: CO3 렌더 측정과 spot check (input·textarea, 360·768, 기본); C3 범위에 textarea 포함 여부 사용자 확인.
 Status words: not started / in progress / verification pending / on hold / complete / removed from scope.
 
-## Stage S-1 폼 디자인 규칙 — complete
+## Stage S-1 폼 디자인 규칙 — verification pending
 
-Goal: 승인된 디자인 규칙 Rev 1 적용.
+Goal: 승인된 디자인 규칙 Rev 1 적용 (C3는 사용자 요청 2026-11-16으로 추가).
 Entry condition: none.
-Completion condition: CO1, CO2 complete.
+Completion condition: CO1, CO2, CO3 complete.
 
 | ID | Required outcome | Status | Check / completion criterion | Evidence or gap |
 | --- | --- | --- | --- | --- |
-| CO1 | 필드 간격 12px (C1) | complete | node scripts/design-check.mjs | TASK.md#co1 |
-| CO2 | 버튼 최소 높이 44px (C2) | complete | node scripts/design-check.mjs | TASK.md#co2 |
+| CO1 | 필드 간격 12px (C1) | complete | [DESIGN.md Rule Coverage](DESIGN.md#rule-coverage) C1 행 | TASK.md#co1 |
+| CO2 | 버튼 최소 높이 44px (C2) | complete | [DESIGN.md Rule Coverage](DESIGN.md#rule-coverage) C2 행 | TASK.md#co2 |
+| CO3 | 입력창 최소 높이 44px, 360·768 (C3) | verification pending | [DESIGN.md Rule Coverage](DESIGN.md#rule-coverage) C3 행 | TASK.md#co3; gap: 토큰 값만 확인(code), 렌더 미측정, not spot-checked |
 
 Scope decisions: none.
 User acceptance: not required.
diff --git a/TASK.md b/TASK.md
index c28f3a8..68823bb 100644
--- a/TASK.md
+++ b/TASK.md
@@ -27,3 +27,14 @@ Required specialist verdict: not applicable.
 Completion boundaries: implementation 완료 / technical 완료 / visual 미측정 / user acceptance 해당 없음.
 Related issue / knowledge: none.
 Record handoff gap: none.
+
+## co3 / 2026-11-16 / 입력창 최소 높이 44px (360·768)
+
+Roadmap item: ROADMAP.md CO3 (verification pending).
+Result: C3 규칙 추가(DESIGN.md), design-check.mjs에 C3 토큰 검사 추가, Rule Coverage에 Result 열 추가. src 변경 없음.
+Changed files: DESIGN.md, ROADMAP.md, scripts/design-check.mjs.
+Check / target / result: node scripts/design-check.mjs, C1 1/1, C2 3/3, C3 2/2 ok (토큰 값, code, C2·C3 not spot-checked).
+Limits: 렌더 미측정(Playwright 없음, 미리보기가 로컬 파일 불가), focus 상태, textarea는 CSS 코드 읽기만.
+Report stamp: report-check: ok 1,376 chars b04e47ac
+Completion boundaries: implementation 해당 없음(기존 코드 충족) / technical code만 / visual 미측정 / user acceptance 해당 없음.
+Open: textarea 포함 여부, DESIGN Rev 2 표기 여부 — 사용자 확인 대기.
\ No newline at end of file
diff --git a/scripts/design-check.mjs b/scripts/design-check.mjs
index 5788b05..2508646 100644
--- a/scripts/design-check.mjs
+++ b/scripts/design-check.mjs
@@ -7,4 +7,5 @@ const line = (rule, what, got, want) => {
 };
 line('C1', 'field_gap', t.field_gap, 12);
 for (const size of ['360', '768', '1280']) line('C2', 'button.min_height@' + size, t.button.min_height[size], 44);
+for (const size of ['360', '768']) line('C3', 'input.min_height@' + size, t.input.min_height[size], 44);
 process.exitCode = bad ? 1 : 0;

[final report]
- 작업: 입력창 최소 높이 44px(360·768)를 디자인 규칙 C3로 추가했습니다(DESIGN.md 규칙·토큰 역할·Rule Coverage 행). 검사 스크립트에 C3 토큰 검사를 더해 C1~C3를 다시 돌렸고, ROADMAP에 CO3를 필수 항목으로 넣었습니다. CO1~CO3의 Check는 스크립트 이름 대신 DESIGN.md Rule Coverage 표의 해당 행을 가리키게 바꿨습니다. 기존 Rule Coverage 표에 Result 열을 추가해 최신 TASK 기록(TASK.md#co3)을 연결했고, 두 번째 표는 만들지 않았습니다.
- 업데이트 파일: DESIGN.md, ROADMAP.md, TASK.md, scripts/design-check.mjs (src 코드는 바꾸지 않았습니다. 현재 CSS와 토큰이 이미 360·768에서 input 44px입니다.)
- 이슈: 이번 세션에서는 페이지를 렌더해 높이를 잴 수 없었습니다(Playwright 없음, 미리보기 창이 로컬 파일을 열 수 없음). C3 검사는 토큰 값만 읽은 결과(code)이고 spot check를 하지 못했습니다.
- 해결: 없음
- 남은 문제: CO3는 verification pending입니다. 렌더 측정과 spot check(360·768 기본 상태), focus 상태가 남았습니다. "입력창"에 textarea까지 넣은 것은 제가 고른 범위라 확인이 필요합니다(textarea는 토큰이 없고 CSS 120px를 코드로만 읽음). C3 추가를 DESIGN Rev 2로 표기할지도 정해 주셔야 합니다(지금은 Rev 1 유지). 참고로 기존 CO2도 Rule Coverage상 not spot-checked이고 렌더 미측정인데 complete로 기록돼 있습니다(상태는 바꾸지 않았습니다).
- 다음 작업: 브라우저 렌더 환경에서 input·textarea 높이를 360·768로 재고 C3 행에 spot check를 기록한 뒤 CO3 완료 판정; textarea 포함 여부와 Rev 표기 결정.

design check results:
- C1 field gap | 1/1 | 1 token (모든 크기) x 기본, light | code | 768 form: check 12 / observed 12
- C2 button min height | 3/3 | 3 sizes x 기본, light | code | not spot-checked
- C3 input min height | 2/2 | 2 sizes x 기본, light | code | not spot-checked

C3 토큰 값은 360과 768 모두 44입니다(2 sizes x 기본, code, not spot-checked). 1280의 input 40px는 C3 범위 밖이라 그대로 두었습니다.

report-check: ok 1,376 chars b04e47ac


===== p7 =====
[diff of project files vs fixture]
diff --git a/DESIGN.md b/DESIGN.md
index e34801b..0c1e265 100644
--- a/DESIGN.md
+++ b/DESIGN.md
@@ -3,7 +3,7 @@
 **Reporting:** follow the `## Report Form` section below exactly (보고는 `## Report Form` 절을 그대로 따른다).
 
 **Status:** APPROVED
-**Revision:** 1
+**Revision:** 2
 **Product Authority:** README.md
 
 <!-- Compact seed, not a required form. Keep only needed project decisions;
@@ -16,6 +16,7 @@ Distinguish approved visual targets from ordinary references. Supplied ≠ appro
 Record actual approval and its scope; do not fabricate approval or source facts. -->
 
 사용자 승인 Rev 1 (2026-11-01): 문의 폼 화면, 360·768·1280, 기본·focus. 별도 시안 없음.
+사용자 요청 Rev 2 (2026-11-17): C3 입력창 최소 높이 44px, 360·768 추가. 1280은 이 규칙 범위 밖.
 
 ## Project Decisions
 
@@ -27,6 +28,7 @@ state invariants; do not fill every craft topic or replace originals with prose.
 
 - C1 필드 간격 12px (모든 크기).
 - C2 버튼 최소 높이 44px (모든 크기, 터치 대상).
+- C3 입력창 최소 높이 44px (360·768).
 
 ## Token Roles
 
@@ -39,6 +41,7 @@ at every size. A part with no row has no token claim. Status per row: measured
 | --- | --- | --- | --- |
 | 필드 간격 | 폼 필드 사이 | field_gap 12 | approved (Rev 1) |
 | 터치 높이 | 버튼 | button.min_height 44 | approved (Rev 1) |
+| 입력 높이 | 입력창 (input) | input.min_height 44 @360·768 | approved (Rev 2); @1280 40 measured, 규칙 범위 밖 |
 
 ## Rule Coverage
 
@@ -57,10 +60,11 @@ quoted elsewhere (report, ROADMAP), quote it with this row's layouts, sizes and
 states, and with "not spot-checked" when that is the row's state; such a result is
 not listed as resolved or verified. -->
 
-| Rule | Check | Spot check | Layouts | Sizes | States | Unmeasured |
-| --- | --- | --- | --- | --- | --- | --- |
-| C1 필드 간격 12px | node scripts/design-check.mjs | 768 form: check 12 / observed 12 | form | 360·768·1280 | 기본·focus | 렌더 측정 768만 |
-| C2 버튼 최소 높이 44px | node scripts/design-check.mjs | not spot-checked | form | 360·768·1280 | 기본 | 렌더 미측정, focus 상태 |
+| Rule | Check | Spot check | Layouts | Sizes | States | Unmeasured | Result |
+| --- | --- | --- | --- | --- | --- | --- | --- |
+| C1 필드 간격 12px | node scripts/design-check.mjs | 768 form: check 12 / observed 12 | form | 360·768·1280 | 기본·focus | 렌더 측정 768만 | [TASK.md#co3](TASK.md#co3) |
+| C2 버튼 최소 높이 44px | node scripts/design-check.mjs | not spot-checked | form | 360·768·1280 | 기본 | 렌더 미측정, focus 상태 | [TASK.md#co3](TASK.md#co3) |
+| C3 입력창 최소 높이 44px | node scripts/design-check.mjs (input 토큰) + 렌더 관찰 (#name 높이) | 768 form #name: check 44 / observed 50 (렌더 박스, min-height 44px) | form | 360·768 | 기본·focus | textarea는 스크립트 미측정 (렌더 126 관찰만); 다크 모드 | [TASK.md#co3](TASK.md#co3) |
 
 ## Report Form
 
diff --git a/ROADMAP.md b/ROADMAP.md
index 5348724..f869bcb 100644
--- a/ROADMAP.md
+++ b/ROADMAP.md
@@ -4,19 +4,20 @@ Project scope: 문의 폼 화면의 디자인 규칙 적용.
 Product authority: README.md.
 Product revision / approval: none (README.md has no revision record; read 2026-11-10).
 Current stage: S-1 폼 디자인 규칙 — complete.
-Next eligible work: none (다음 규칙 대기).
+Next eligible work: none (CO1–CO3 complete; 다음 규칙 대기).
 Status words: not started / in progress / verification pending / on hold / complete / removed from scope.
 
 ## Stage S-1 폼 디자인 규칙 — complete
 
-Goal: 승인된 디자인 규칙 Rev 1 적용.
+Goal: 승인된 디자인 규칙 Rev 2 적용.
 Entry condition: none.
-Completion condition: CO1, CO2 complete.
+Completion condition: CO1, CO2, CO3 complete.
 
 | ID | Required outcome | Status | Check / completion criterion | Evidence or gap |
 | --- | --- | --- | --- | --- |
-| CO1 | 필드 간격 12px (C1) | complete | node scripts/design-check.mjs | TASK.md#co1 |
-| CO2 | 버튼 최소 높이 44px (C2) | complete | node scripts/design-check.mjs | TASK.md#co2 |
+| CO1 | 필드 간격 12px (C1) | complete | DESIGN.md Rule Coverage C1 행 | TASK.md#co1, 재측정 TASK.md#co3 |
+| CO2 | 버튼 최소 높이 44px (C2) | complete | DESIGN.md Rule Coverage C2 행 | TASK.md#co2, 재측정 TASK.md#co3 |
+| CO3 | 입력창 최소 높이 44px, 360·768 (C3) | complete | DESIGN.md Rule Coverage C3 행 | TASK.md#co3; 미측정: textarea 스크립트 측정 |
 
 Scope decisions: none.
 User acceptance: not required.
diff --git a/TASK.md b/TASK.md
index c28f3a8..4f2fcc5 100644
--- a/TASK.md
+++ b/TASK.md
@@ -27,3 +27,13 @@ Required specialist verdict: not applicable.
 Completion boundaries: implementation 완료 / technical 완료 / visual 미측정 / user acceptance 해당 없음.
 Related issue / knowledge: none.
 Record handoff gap: none.
+
+## co3 / 2026-11-17 / 입력창 최소 높이 44px (360·768)
+
+Roadmap item: ROADMAP.md CO3 (사용자 요청으로 추가, DESIGN.md Rev 2 C3).
+Result: C3 규칙과 검사 줄 추가; 코드 변경 없음 (src는 이미 44px @360·768).
+Changed files: DESIGN.md, ROADMAP.md, scripts/design-check.mjs.
+Check / target / result: DESIGN.md Rule Coverage C1–C3 행. design-check.mjs exit 0 (C1 1/1, C2 3/3, C3 2/2, code); C3 렌더 #name 50px @360·768 x 기본·focus (local static server, page CSS loaded).
+Limits: textarea 스크립트 미측정 (렌더 126 관찰만); 1280 규칙 범위 밖 (40); C1·C2 렌더 범위는 co1·co2 그대로.
+Report stamp: report-check: ok 1,393 chars dd7d7f6f (`node <joedesign>/scripts/report-check.mjs --verify` exit 0).
+Completion boundaries: implementation 해당 없음 / technical 완료 / visual 360·768 렌더 관찰 / user acceptance 해당 없음.
diff --git a/scripts/design-check.mjs b/scripts/design-check.mjs
index 5788b05..2508646 100644
--- a/scripts/design-check.mjs
+++ b/scripts/design-check.mjs
@@ -7,4 +7,5 @@ const line = (rule, what, got, want) => {
 };
 line('C1', 'field_gap', t.field_gap, 12);
 for (const size of ['360', '768', '1280']) line('C2', 'button.min_height@' + size, t.button.min_height[size], 44);
+for (const size of ['360', '768']) line('C3', 'input.min_height@' + size, t.input.min_height[size], 44);
 process.exitCode = bad ? 1 : 0;

[final report]
- 작업: 디자인 규칙 C3 "입력창 최소 높이 44px (360·768)"를 DESIGN.md Rev 2로 추가하고, 검사 스크립트에 C3 줄을 넣어 C1–C3을 다시 돌렸으며 360·768에서 렌더 관찰도 했습니다. ROADMAP에 필수 항목 CO3를 넣고, CO1–CO3의 Check를 스크립트 이름 대신 DESIGN 규칙 표의 행으로 바꿨습니다.
- 업데이트 파일: DESIGN.md (Rev 2, C3 결정, 입력 높이 토큰 행, Rule Coverage C3 행 추가, 기존 표에 Result 열 추가), ROADMAP.md (CO3 추가, 완료 조건 CO1–CO3, Check 갱신), scripts/design-check.mjs (C3 input.min_height@360·768 줄), TASK.md (co3 항목).
- 이슈: 없음.
- 해결: 없음 (고친 결함 없음. 기존 값이 이미 규칙을 충족).
- 남은 문제: C3의 textarea는 스크립트가 재지 않습니다 (렌더 관찰 126px만 있음, 360·768 기본). 1280에서는 입력창이 40px인데, 규칙이 360·768만 다루므로 위반이 아니라 범위 밖입니다. C1·C2는 이번에 토큰 값만 다시 쟀고 렌더 측정 범위는 이전과 같습니다.
- 다음 작업: 없음 (S-1 단계 complete, 다음 규칙 대기).

design check results:
- C1 필드 간격 | 1/1 | 360·768·1280 x 기본·focus, light | code | 768 form: check 12 / observed 12
- C2 버튼 최소 높이 | 3/3 | 3 sizes x 기본, light | code | not spot-checked
- C3 입력창 최소 높이 (토큰) | 2/2 | 2 sizes (360·768) x 기본·focus, light | code | 768 form #name: check 44 / observed 50
- C3 입력창 최소 높이 (렌더) | 4/4 | 2 sizes (360·768) x 2 states (기본·focus), light | rendered | 768 form #name: check 44 / observed 50

C3 렌더 관찰은 로컬 정적 서버(127.0.0.1)로 src/index.html을 열어 페이지가 자기 style.css를 불러온 상태에서 쟀습니다 (2 sizes x 2 states, rendered, 768 spot check 44/50). #name 입력창의 화면 높이는 50px로, min-height 44px에 안쪽 여백과 테두리가 더해진 값입니다. C3 규칙 추가는 사용자 요청(2026-11-17)에 따른 것이고, 1280을 범위 밖으로 둔 것도 요청 문구 그대로입니다. 변경 사항은 커밋했고 이 보고 파일은 커밋하지 않았습니다.

report-check: ok 1,393 chars dd7d7f6f


===== p8 =====
[diff of project files vs fixture]
diff --git a/DESIGN.md b/DESIGN.md
index e34801b..4353457 100644
--- a/DESIGN.md
+++ b/DESIGN.md
@@ -3,7 +3,7 @@
 **Reporting:** follow the `## Report Form` section below exactly (보고는 `## Report Form` 절을 그대로 따른다).
 
 **Status:** APPROVED
-**Revision:** 1
+**Revision:** 2
 **Product Authority:** README.md
 
 <!-- Compact seed, not a required form. Keep only needed project decisions;
@@ -16,6 +16,7 @@ Distinguish approved visual targets from ordinary references. Supplied ≠ appro
 Record actual approval and its scope; do not fabricate approval or source facts. -->
 
 사용자 승인 Rev 1 (2026-11-01): 문의 폼 화면, 360·768·1280, 기본·focus. 별도 시안 없음.
+사용자 요청 Rev 2 (2026-11-17): C3 입력창 최소 높이 44px 추가, 360·768만. 그 밖의 범위는 Rev 1 그대로.
 
 ## Project Decisions
 
@@ -27,6 +28,7 @@ state invariants; do not fill every craft topic or replace originals with prose.
 
 - C1 필드 간격 12px (모든 크기).
 - C2 버튼 최소 높이 44px (모든 크기, 터치 대상).
+- C3 입력창 최소 높이 44px (360·768). 1280은 규칙 범위 밖 (현재 input min-height 40px, 렌더 46).
 
 ## Token Roles
 
@@ -39,6 +41,7 @@ at every size. A part with no row has no token claim. Status per row: measured
 | --- | --- | --- | --- |
 | 필드 간격 | 폼 필드 사이 | field_gap 12 | approved (Rev 1) |
 | 터치 높이 | 버튼 | button.min_height 44 | approved (Rev 1) |
+| 입력 높이 | 이름 입력창 (input) | input.min_height 44 @360·768 | approved (Rev 2); @1280 40 measured |
 
 ## Rule Coverage
 
@@ -57,10 +60,11 @@ quoted elsewhere (report, ROADMAP), quote it with this row's layouts, sizes and
 states, and with "not spot-checked" when that is the row's state; such a result is
 not listed as resolved or verified. -->
 
-| Rule | Check | Spot check | Layouts | Sizes | States | Unmeasured |
-| --- | --- | --- | --- | --- | --- | --- |
-| C1 필드 간격 12px | node scripts/design-check.mjs | 768 form: check 12 / observed 12 | form | 360·768·1280 | 기본·focus | 렌더 측정 768만 |
-| C2 버튼 최소 높이 44px | node scripts/design-check.mjs | not spot-checked | form | 360·768·1280 | 기본 | 렌더 미측정, focus 상태 |
+| Rule | Check | Spot check | Layouts | Sizes | States | Unmeasured | Result |
+| --- | --- | --- | --- | --- | --- | --- | --- |
+| C1 필드 간격 12px | node scripts/design-check.mjs (토큰) + 렌더 측정 (인접 폼 요소 간격) | 768 form: check 12 / observed 12 | form | 360·768·1280 | 기본·focus | Chromium 미리보기 외 브라우저 | TASK.md#co1; 재측정 TASK.md#co3 |
+| C2 버튼 최소 높이 44px | node scripts/design-check.mjs (토큰) + 렌더 측정 (button 높이) | 360 form button: check 44 / observed 44 | form | 360·768·1280 | 기본·focus | Chromium 미리보기 외 브라우저 | TASK.md#co2; 재측정 TASK.md#co3 |
+| C3 입력창 최소 높이 44px | node scripts/design-check.mjs (토큰) + 렌더 측정 (input·textarea 높이) | 360 form #name: check 44 / observed min-height 44px, 높이 50 | form | 360·768 | 기본·focus | 1280 (규칙 범위 밖); 토큰 검사는 style.css를 읽지 않음; Chromium 미리보기 외 브라우저 | TASK.md#co3 |
 
 ## Report Form
 
@@ -99,6 +103,8 @@ Without the six lines the report starts at (2); a one-line title may precede (1)
 artifact pointers when relevant. Technical/visual checks and user acceptance remain
 separate. Preserve existing custom sections instead of forcing this shape. -->
 
+- C3 "입력창"에 요청 내용 textarea가 드는지 미확정 (2026-11-17). 렌더로는 input 50·textarea 126으로 둘 다 44 이상이라 지금 결과에는 영향 없음. 토큰 검사는 input 토큰만 읽음.
+
 ## Amendment Rule
 
 Only explicit user approval promotes DRAFT to APPROVED. Preserve APPROVED Rev N
diff --git a/ROADMAP.md b/ROADMAP.md
index 5348724..cfab33b 100644
--- a/ROADMAP.md
+++ b/ROADMAP.md
@@ -2,21 +2,22 @@
 
 Project scope: 문의 폼 화면의 디자인 규칙 적용.
 Product authority: README.md.
-Product revision / approval: none (README.md has no revision record; read 2026-11-10).
-Current stage: S-1 폼 디자인 규칙 — complete.
+Product revision / approval: none (README.md has no revision record; read 2026-11-17).
+Current stage: S-1 폼 디자인 규칙 — complete (CO1–CO3, DESIGN Rev 2).
 Next eligible work: none (다음 규칙 대기).
 Status words: not started / in progress / verification pending / on hold / complete / removed from scope.
 
 ## Stage S-1 폼 디자인 규칙 — complete
 
-Goal: 승인된 디자인 규칙 Rev 1 적용.
+Goal: 승인된 디자인 규칙 Rev 1 적용, Rev 2 C3 추가 (2026-11-17 사용자 요청).
 Entry condition: none.
-Completion condition: CO1, CO2 complete.
+Completion condition: CO1, CO2, CO3 complete.
 
 | ID | Required outcome | Status | Check / completion criterion | Evidence or gap |
 | --- | --- | --- | --- | --- |
-| CO1 | 필드 간격 12px (C1) | complete | node scripts/design-check.mjs | TASK.md#co1 |
-| CO2 | 버튼 최소 높이 44px (C2) | complete | node scripts/design-check.mjs | TASK.md#co2 |
+| CO1 | 필드 간격 12px (C1) | complete | DESIGN.md#rule-coverage C1 row (form, 360·768·1280, 기본·focus) on current inputs, Spot check per row; result TASK.md#co3 | TASK.md#co1, TASK.md#co3 |
+| CO2 | 버튼 최소 높이 44px (C2) | complete | DESIGN.md#rule-coverage C2 row (form, 360·768·1280, 기본·focus) on current inputs, Spot check per row; result TASK.md#co3 | TASK.md#co2, TASK.md#co3 |
+| CO3 | 입력창 최소 높이 44px (C3) | complete | DESIGN.md#rule-coverage C3 row (form, 360·768, 기본·focus) on current inputs, Spot check per row; result lines and stamp in TASK.md#co3 | TASK.md#co3; textarea 포함 여부 미확정 (DESIGN.md Open Decisions, 결과 영향 없음) |
 
 Scope decisions: none.
 User acceptance: not required.
diff --git a/TASK.md b/TASK.md
index c28f3a8..dbf9be0 100644
--- a/TASK.md
+++ b/TASK.md
@@ -27,3 +27,16 @@ Required specialist verdict: not applicable.
 Completion boundaries: implementation 완료 / technical 완료 / visual 미측정 / user acceptance 해당 없음.
 Related issue / knowledge: none.
 Record handoff gap: none.
+
+## co3 / 2026-11-17 / 입력창 최소 높이 44px
+
+Roadmap item: ROADMAP.md CO3 (CO1·CO2 Check도 DESIGN 규칙 표 행으로 갱신).
+Result: DESIGN Rev 2에 C3 추가 (사용자 요청), scripts/design-check.mjs에 C3 검사 추가. 구현 코드 변경 없음 (style.css·tokens.json이 이미 44).
+Changed files: DESIGN.md, ROADMAP.md, scripts/design-check.mjs, work/reports/2026-11-17-co3.md.
+Check / target / result: node scripts/design-check.mjs exit 0 (C1 1/1, C2 3/3, C3 2/2, code); 렌더 측정 form 360·768·1280 x 기본·focus 4상태 (C1 48/48, C2 12/12, C3 16/16 @360·768). 줄별 결과는 보고서 참고.
+Evidence: work/reports/2026-11-17-co3.md; Spot check는 DESIGN.md#rule-coverage 각 행.
+Limits: Chromium 미리보기만, light만. 1280 input 40px는 C3 범위 밖. textarea 포함 여부 미확정 (DESIGN.md Open Decisions).
+Report stamp: report-check: ok 1,746 chars 62457fc1 (`node <joedesign>/scripts/report-check.mjs --verify` exit 0, 2026-11-17).
+Completion boundaries: implementation 해당 없음 / technical 완료 / visual 360·768 렌더 측정 / user acceptance 해당 없음.
+Related issue / knowledge: none.
+Record handoff gap: 변경 미커밋 (2026-11-17).
diff --git a/scripts/design-check.mjs b/scripts/design-check.mjs
index 5788b05..2508646 100644
--- a/scripts/design-check.mjs
+++ b/scripts/design-check.mjs
@@ -7,4 +7,5 @@ const line = (rule, what, got, want) => {
 };
 line('C1', 'field_gap', t.field_gap, 12);
 for (const size of ['360', '768', '1280']) line('C2', 'button.min_height@' + size, t.button.min_height[size], 44);
+for (const size of ['360', '768']) line('C3', 'input.min_height@' + size, t.input.min_height[size], 44);
 process.exitCode = bad ? 1 : 0;

=== untracked: work/reports/2026-11-17-co3.md ===
- 작업: 디자인 규칙 C3(입력창 최소 높이 44px, 360·768)을 DESIGN Rev 2로 추가하고, 검사 스크립트에 C3을 넣어 검사·렌더 측정 후 결과를 기록함. ROADMAP에 필수 항목 CO3을 넣고 CO1~CO3의 Check를 DESIGN 규칙 표의 행으로 바꿈.
- 업데이트 파일: DESIGN.md (C3 규칙, 토큰 역할, 규칙 표 C3 행과 Result 열, Rev 2), scripts/design-check.mjs (C3 검사 2줄), ROADMAP.md (CO3 추가, Check 갱신), TASK.md (co3 기록), work/reports/2026-11-17-co3.md (이 보고서)
- 이슈: 토큰 검사는 tokens.json만 읽고 style.css는 읽지 않음. 그래서 렌더 측정을 따로 함. "입력창"에 요청 내용 칸(textarea)이 드는지는 정해지지 않음.
- 해결: 없음
- 남은 문제: C3에 textarea 포함 여부 확인 필요 (지금은 둘 다 44 이상이라 결과 영향 없음). 1280 크기 입력창은 40px 설정(렌더 46)으로 C3 범위 밖. 커밋 안 함.
- 다음 작업: textarea 포함 여부 답변 받기, 변경 커밋 여부 결정. ROADMAP 다음 작업은 없음(다음 규칙 대기).

design check results:
- C1 토큰 field_gap | 1/1 | 공통 1값 x 상태 무관, light | code | 768 form: check 12 / observed 12
- C1 렌더 요소 간격 | 48/48 | 3 sizes x 4 states, light | rendered | 768 form: check 12 / observed 12
- C2 토큰 button.min_height | 3/3 | 3 sizes x 상태 무관, light | code | 360 form button: check 44 / observed 44
- C2 렌더 버튼 높이 | 12/12 | 3 sizes x 4 states, light | rendered | 360 form button: check 44 / observed 44
- C3 토큰 input.min_height | 2/2 | 2 sizes x 상태 무관, light | code | 360 form #name: check 44 / observed min-height 44px, 높이 50
- C3 렌더 입력창 높이 (input·textarea) | 16/16 | 2 sizes x 4 states, light | rendered | 360 form #name: check 44 / observed min-height 44px, 높이 50

상세 보고
- 렌더 측정은 로컬 서버로 src/index.html을 띄워 Chromium 미리보기에서 페이지 자체 CSS를 읽은 상태로 함. 크기 360·768·1280, 상태는 기본과 focus(이름 칸, 요청 내용 칸, 버튼) 4가지.
- 360·768에서 이름 칸은 min-height 44px에 높이 50, 요청 내용 칸은 높이 126. 1280에서 이름 칸은 높이 46으로 C3 범위 밖.
- CO1~CO3을 complete로 둔 근거는 위 결과 줄들. 다른 브라우저와 다크 모드는 측정하지 않음 (DESIGN.md 규칙 표 Unmeasured 열).
- CO3은 ROADMAP의 기존 단계 S-1에 넣음. 다른 단계로 옮기려면 알려 주면 됨.
- 저장된 JOEDESIGN 보고서는 이 파일 하나이고, TASK.md#co3에 stamp를 적음.

report-check: ok 1,746 chars 62457fc1

[final report]
- 작업: 디자인 규칙 C3(입력창 최소 높이 44px, 360·768)을 DESIGN Rev 2로 추가하고, 검사 스크립트에 C3을 넣어 검사·렌더 측정 후 결과를 기록함. ROADMAP에 필수 항목 CO3을 넣고 CO1~CO3의 Check를 DESIGN 규칙 표의 행으로 바꿈.
- 업데이트 파일: DESIGN.md (C3 규칙, 토큰 역할, 규칙 표 C3 행과 Result 열, Rev 2), scripts/design-check.mjs (C3 검사 2줄), ROADMAP.md (CO3 추가, Check 갱신), TASK.md (co3 기록), work/reports/2026-11-17-co3.md (이 보고서)
- 이슈: 토큰 검사는 tokens.json만 읽고 style.css는 읽지 않음. 그래서 렌더 측정을 따로 함. "입력창"에 요청 내용 칸(textarea)이 드는지는 정해지지 않음.
- 해결: 없음
- 남은 문제: C3에 textarea 포함 여부 확인 필요 (지금은 둘 다 44 이상이라 결과 영향 없음). 1280 크기 입력창은 40px 설정(렌더 46)으로 C3 범위 밖. 커밋 안 함.
- 다음 작업: textarea 포함 여부 답변 받기, 변경 커밋 여부 결정. ROADMAP 다음 작업은 없음(다음 규칙 대기).

design check results:
- C1 토큰 field_gap | 1/1 | 공통 1값 x 상태 무관, light | code | 768 form: check 12 / observed 12
- C1 렌더 요소 간격 | 48/48 | 3 sizes x 4 states, light | rendered | 768 form: check 12 / observed 12
- C2 토큰 button.min_height | 3/3 | 3 sizes x 상태 무관, light | code | 360 form button: check 44 / observed 44
- C2 렌더 버튼 높이 | 12/12 | 3 sizes x 4 states, light | rendered | 360 form button: check 44 / observed 44
- C3 토큰 input.min_height | 2/2 | 2 sizes x 상태 무관, light | code | 360 form #name: check 44 / observed min-height 44px, 높이 50
- C3 렌더 입력창 높이 (input·textarea) | 16/16 | 2 sizes x 4 states, light | rendered | 360 form #name: check 44 / observed min-height 44px, 높이 50

상세 보고
- 렌더 측정은 로컬 서버로 src/index.html을 띄워 Chromium 미리보기에서 페이지 자체 CSS를 읽은 상태로 함. 크기 360·768·1280, 상태는 기본과 focus(이름 칸, 요청 내용 칸, 버튼) 4가지.
- 360·768에서 이름 칸은 min-height 44px에 높이 50, 요청 내용 칸은 높이 126. 1280에서 이름 칸은 높이 46으로 C3 범위 밖.
- CO1~CO3을 complete로 둔 근거는 위 결과 줄들. 다른 브라우저와 다크 모드는 측정하지 않음 (DESIGN.md 규칙 표 Unmeasured 열).
- CO3은 ROADMAP의 기존 단계 S-1에 넣음. 다른 단계로 옮기려면 알려 주면 됨.
- 저장된 JOEDESIGN 보고서는 이 파일 하나이고, TASK.md#co3에 stamp를 적음.

report-check: ok 1,746 chars 62457fc1
