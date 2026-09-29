# JOENESS Context Storage and Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 `joeness-setup`이 프로젝트 사실을 한 원본에 간결하게 기록하고, 작업에 맞는 자료만 읽으며, 복잡한 문서 재편은 근거를 들어 제안하도록 한다.

**Architecture:** 새 런타임 엔진 없이 기존 SKILL·짧은 프로젝트 AGENTS 연결·역할별 자산에 계약을 명시한다. 설치 manifest는 변경된 패키지 파일의 정확한 SHA-256만 갱신한다. 기존 가상 프로젝트와 계약 테스트에 사례를 추가하고, 실제 새 컨텍스트 실행은 별도 bounded evidence로 확인한다.

**Tech Stack:** Markdown skill/assets, Node.js `node:test`, PowerShell 설치·프로젝트 helper, Git.

**Spec:** `docs/superpowers/specs/2026-09-29-joeness-context-storage-routing-design.md`

## Global Constraints

- 활성 제품: Independent Judgment Core와 공개 `joeness-setup` 스킬 하나. Core bytes, 설치 helper의 소유권 경계, `managedRuntimeFiles=[]`, `defaultVendors=[]`, `pluginRouting=null` 유지.
- 기존 Product/승인 DESIGN 권위 보존. 기존 경로 우선, 필수 다섯 파일 묶음·메모리 DB·배경 프로세스·새 공개 스킬 금지.
- 실제 사용자 프로젝트의 문서 이동·삭제·자동 재편 금지. 이번 구현·시험은 가상 fixture만 변경.
- 새 기록은 간결하게 직접 작성하되 원인·검증 한계·승인 상태를 누락하지 않음. 상태 파일은 업무 기록으로 사용하지 않음.
- 재편 기준의 75%는 관찰/설정된 한도가 있을 때만 쓰는 제안용 조기 신호. 실제 잘림 또는 재현된 구조 오류는 즉시 조사; 그 외 약한 신호는 둘 이상 필요.
- 질문·토론·기록 금지 요청은 자동 기록하지 않음. 구현·검증·사용자 수용은 별도 상태.

## Review Focus

- 기존 Product 문서가 다섯 이름 밖에 있어도 권위를 잃거나 새 `PRODUCT.md`를 만들지 않는가? Task 1 계약 테스트와 Task 3 fresh 사례.
- 약한 신호 하나나 알 수 없는 로더 한도만으로 재편을 강요하지 않는가? Task 2 fixture·fresh 사례.
- 요청과 무관한 긴 문서를 무조건 읽거나 기록을 중복하지 않는가? Task 1 계약과 Task 3 행동 평가.
- 미커밋 최신 상세와 활성 우회를 간결화 명목으로 지우지 않는가? Task 2 기존 Git fixture 회귀.
- 자료 읽기·쓰기 실패 시 완료를 꾸미거나 독립적인 승인 작업을 버리지 않는가? Task 3 기존 실패 fixture 회귀.

---

### Task 1: 단일 저장 위치와 간결한 기록 계약

**Files:**
- Modify: `tests/joeness-setup-contract.tests.mjs`
- Modify: `skills/joeness-setup/SKILL.md`
- Modify: `skills/joeness-setup/assets/AGENTS.md`
- Modify: `skills/joeness-setup/assets/ROADMAP.md`, `TASK.md`, `ISSUES.md`, `DESIGN.md`
- Modify: `vendor/source-manifest.json`

**Interfaces:**
- Consumes: 기존 `joeness-setup`의 Inspect/Apply/Normal work 흐름과 다섯 역할 자산.
- Produces: 주된 원본 한 곳·정확한 교차 링크·짧은 신규 기록·Product/Design 보존을 설명하는 배포 소스. 다음 Task는 이 문구를 프로젝트 연결과 사용자 안내에 사용.

- [ ] **Step 1: 실패 계약 테스트 작성.** `tests/joeness-setup-contract.tests.mjs`에 `records have one primary home without mandatory five-file creation`을 추가한다. SKILL·AGENTS 자산에 주된 저장 위치/정확한 링크/필요할 때만 새 문서/상태 파일은 업무 메모리가 아님을 assert하고, Product가 필수 여섯째 문서가 아님을 확인한다. 각 역할 자산은 Task 실행, Issue 재사용 원인, Roadmap 필수 항목, Design 승인 범위를 구분하는지 assert한다.
- [ ] **Step 2: RED 확인.** `node --test tests/joeness-setup-contract.tests.mjs`; 새 테스트가 계약 문구 부재로 FAIL해야 한다.
- [ ] **Step 3: 최소 문구 구현.** SKILL의 Inspect/Normal work에 `primary home → exact cross-link`와 처음부터 짧게 기록하기를 넣고, AGENTS 자산에는 실제 경로·작업별 읽기 안내만 한두 줄로 둔다. 역할 자산에는 해당 저장 필드만 짧게 조정한다. 기존 일상 기록 동의·완료 게이트·여섯 항목 보고는 유지한다. 적용 파일의 `Get-FileHash -Algorithm SHA256` 결과를 `vendor/source-manifest.json#publicSkills[0].files`의 같은 경로에 반영한다.
- [ ] **Step 4: GREEN 확인.** `node --test tests/joeness-setup-contract.tests.mjs`; 전체 PASS, 기존 manifest/core/inventory 테스트도 PASS.
- [ ] **Step 5: 커밋.** 이 Task의 파일만 staging하고 `git diff --cached --check` 후 `git commit -m "feat: clarify single-home project records"`.

### Task 2: 작업별 조회와 문서 재편 제안 경계

**Files:**
- Modify: `tests/joeness-setup-contract.tests.mjs`
- Modify: `tests/joeness-setup-fixtures.tests.mjs`
- Modify: `fixtures/joeness-setup/create-fixture.mjs`
- Modify: `fixtures/joeness-setup/behavior-cases.json`
- Modify: `skills/joeness-setup/SKILL.md`
- Modify: `skills/joeness-setup/assets/AGENTS.md`
- Modify: `vendor/source-manifest.json`

**Interfaces:**
- Consumes: Task 1의 단일 저장 위치와 기존 `createFixture(kind)`/`behavior-cases.json` 형식.
- Produces: 작업별 탐색 출발점과 `재편 제안만` 계약; `createFixture('scattered')`와 `createFixture('simple-routing')`가 각각 역할 분산·단일 약한 신호를 가진 임시 Git 프로젝트 root를 반환한다.

- [ ] **Step 1: 실패 계약·fixture 테스트 작성.** `routing is task selective and restructuring is proposal only`는 요청별 ROADMAP/TASK/ISSUES/DESIGN 선택, 현재 관찰과 승인 권위의 분리, 임계값(실제 잘림/재현 오류 또는 약한 신호 2개)을 assert한다. fixture 테스트는 `scattered`에 중복 원본·현재/옛 상태 충돌 두 신호, `simple-routing`에 긴 무관 문서 하나만 있음을 assert한다. `behavior-cases.json`에 `selective-handoff`(normal: 끝난 일·남은 일 조회), `single-signal-no-restructure`(simple-routing: 무관한 긴 문서 하나), `multi-signal-proposal`(scattered: 중복과 권위 분산), `product-authority-preserved`(normal: 다섯 역할 밖 Product 권위) 네 사례를 추가한다. 모두 읽기 전용 요청이며 `allowedChanges=[]`; 모든 기존 프로젝트 문서를 `forbiddenChanges`에 넣고 실제 읽기·diff·답변을 `evidence`로 요구한다. case 수 21·ID 유일성을 확인한다.
- [ ] **Step 2: RED 확인.** `node --test tests/joeness-setup-contract.tests.mjs tests/joeness-setup-fixtures.tests.mjs`; 새 계약 또는 fixture 미구현으로 FAIL.
- [ ] **Step 3: 최소 소스·fixture 구현.** SKILL은 고정 파일 순서/RACI가 아닌 작업별 읽기, 사실 충돌 시 출처·승인 구분, 증거 기반 재편 **제안**을 명시한다. AGENTS 자산은 세부 신호표를 복사하지 않고 관련 문서만 읽으라는 짧은 라우팅 한 줄만 보유한다. fixture 생성기는 새 두 kind의 사용자 소유 문서를 만드는 데만 쓰고 제품 helper는 변경하지 않는다. 바뀐 패키지 파일의 manifest SHA-256을 갱신한다.
- [ ] **Step 4: GREEN 및 보존 회귀.** Step 2 명령과 `powershell.exe -NoProfile -File tests/joeness-project-setup.tests.ps1`를 실행해 PASS. 기존 미커밋 상세·ZIP/잘못된 참조·부분 쓰기 사례는 삭제하거나 기대 답안을 완화하지 않는다.
- [ ] **Step 5: 커밋.** `git diff --cached --check` 후 이 Task의 변경만 `git commit -m "feat: route context reads and bound restructuring proposals"`.

### Task 3: 사용자 안내, 신선한 행동 증거, 전체 회귀

**Files:**
- Modify: `skills/joeness-setup/references/usage.md`
- Modify: `README.md`
- Modify: `vendor/source-manifest.json`
- Create: `evals/joeness-setup/runs/2026-09-29-context-routing/review-evidence.md`
- Test: `fixtures/joeness-setup/behavior-cases.json`의 Task 2 신규 네 사례와 기존 회귀.

**Interfaces:**
- Consumes: Task 1–2의 배포 문구, manifest·fixture·예상 행동.
- Produces: 기존 사용자에게 실제 사용법과 재편 제안 경계를 설명하는 짧은 안내, fresh 실행별 runtime/입력/읽기·쓰기/diff/판정이 구분된 bounded evidence.

- [ ] **Step 1: 안내 계약을 RED로 추가.** `tests/joeness-setup-contract.tests.mjs`에 `usage distinguishes role routing from automatic migration`을 추가한다. `usage.md`가 기존 경로 재사용, 필요한 문서만 조회, 자동 재편 없음, 근거 있는 제안과 사용자 승인, Product/Design 권위를 설명하는지 assert한다. README는 같은 내용을 한 문단과 사용 예 링크로 연결하되 상세 설계 전문을 싣지 않는지 확인한다.
- [ ] **Step 2: RED 확인.** `node --test tests/joeness-setup-contract.tests.mjs`에서 새 테스트 FAIL.
- [ ] **Step 3: 안내 최소 수정.** `usage.md`와 README에 비전공자용 짧은 사용 예를 더한다. 바뀐 `usage.md`의 SHA-256만 manifest에 반영한다. 설치만으로 문서가 생긴다고 말하지 않는다.
- [ ] **Step 4: GREEN 및 전체 Windows 검증.** `powershell.exe -NoProfile -File tests/astra-judgment-sync.tests.ps1`, `pwsh -NoProfile -File tests/joeness-project-setup.tests.ps1`, `powershell.exe -NoProfile -File tests/joeness-project-setup.tests.ps1`, `powershell.exe -NoProfile -File tests/joeness-install.tests.ps1`, `node --test tests/joeness-setup-contract.tests.mjs tests/joeness-setup-fixtures.tests.mjs`를 순서대로 실행해 모두 PASS. `.github/workflows/windows-ci.yml`과 명령·순서를 대조한다.
- [ ] **Step 5: fresh 행동 평가.** 새 컨텍스트에서 신규 네 사례를 각 한 번 실행한다. 기대 답은 agent 입력에 넣지 않는다. 실제 파일 읽기, diff, 현재 상태/승인 구분, 불필요한 재편·중복 기록 여부를 `review-evidence.md`에 남긴다. `single-signal-no-restructure`는 제안 강요가 없고, `multi-signal-proposal`은 파일 이동 없이 근거·매핑·승인 경계를 제시해야 PASS. 기존 `history-new`와 `write-failure`도 회귀 확인한다. 실행 불가·실패는 그대로 기록하고 제품 READY를 주장하지 않는다.
- [ ] **Step 6: 커밋.** 성공/실패 증거를 삭제하지 말고 `git diff --cached --check` 후 해당 변경을 `git commit -m "docs: explain context routing and record validation"`.

## 완료 판정

계약·fixture·Windows 전체 회귀와 fresh 행동 사례가 모두 통과해야 이번 기능 검증 완료라고 보고한다. 사람이 실제 프로젝트에서 더 빨리 이해했는지, 전체 토큰 절감이나 성능 향상은 별도 비교 없이는 미입증으로 둔다. 개인 설치 갱신, 실제 프로젝트 재편, 배포·release 태그·main 병합은 이 계획의 자동 후속 작업이 아니다.
