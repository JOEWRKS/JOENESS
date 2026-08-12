# JOENESS 검증 부채 로드맵

이 파일은 현재 검증 작업의 유일한 활성 원장이다. 날짜별 계획·실험·사고 보고서는 역사 증거로만 링크하고 진행 상태를 중복 기록하지 않는다.

- **목표 / 릴리스:** V9 후보의 설치·행동·실프로젝트 효과를 기능별로 검증한다. 증거가 없는 기능은 `candidate/unvalidated`를 유지하고 전체를 한 번에 승격하지 않는다.
- **마일스톤:**
  - [x] **M0 후보 고정·설치:** 전체 회귀, 격리 `Check → Apply → Check → 재Apply → Remove → Check`, 원상복구, feature branch push
  - [ ] **M1 Ticket E2E:** 고정 티켓 → 구현자 → 고정 커밋 → 무이력 평가자 → 조건별 판정 → 재작업 1회 제한
  - [ ] **M2 Design→Visual:** MergeDrop·RVR 결함과 정상 대조군에서 기준 자가도출, 부분/전체 판정 분리, 실제 화면 확인
  - [ ] **M3 Core V6:** clean·partial·blocked·workaround·반복 오류·복구 상황의 한국어 결과 우선 보고와 중단 규칙
  - [ ] **M4 암묵 라우팅:** Project·Ticket·Design·Visual Check·Spec·Handoff의 양성/음성 사례
  - [ ] **M5 결합 흐름:** Project → Ticket → Spec → Handoff 재개의 종단 검증
  - [ ] **M6 실프로젝트 파일럿:** Unity, .NET 게임 모드, 웹/앱에서 품질·재작업·시간을 기록하고 기능별 승격 판정
- **현재:**

  | 단계 | 기대 결과 | 합격 조건 | 상태 |
  |---|---|---|---|
  | M0 | 재현 가능한 V9 배포 후보 | 전체 회귀와 격리 수명주기 통과, clean tree, exact hash, 원상복구 | 완료 — [`joeness-v9-m0-validation-v1.json`](evals/experiments/joeness-v9-m0-validation-v1.json), 증거 `4ce9b25` |
  | M1 | Ticket 검토 루프의 실제 종단 증거 | 무이력 평가자 완료, 조건별 직접 판정, 평가 전후 비변경 | 진행 중 |

- **차단 / 결정 / 링크:**
  - 검증 기간에는 검증 실패를 고치는 최소 변경 외 새 기능을 추가하지 않는다.
  - M0 검증 기준은 `codex/joeness-interface`의 `f3b4b30`; 원격 feature branch와 일치한다.
  - 사용자 홈은 V7·스킬 5개이며 `$ticket`과 최신 Design/Visual 규칙이 아직 적용되지 않았다. M1~M3의 격리 검증 후 M4 직전에 exact `Check → Apply → Check`로 갱신하고 새 Codex 작업에서 라우팅을 검증한다.
  - 공식 상태와 증거 포인터: [`vendor/source-manifest.json`](vendor/source-manifest.json)
- **증거 / 검토:** 2026-08-12에 M0 전체 회귀와 격리 공개 진입점 수명주기를 통과했다. 개인 설치는 V7이며 아직 갱신하지 않았다. 상태 변경은 exact 커밋·실행 결과·산출물·대상 상태를 다시 읽은 뒤에만 한다. 필수 검증이 남으면 `부분 완료` 또는 `미검증`으로 유지한다.

## M1 활성 티켓 — criterion verdict reducer

- **목표:** Ticket 평가자가 조건별 판정을 하나의 상태로 축약할 때 사용하는 결정론적 유틸리티를 추가하고, 구현자와 무이력 평가자의 실제 종단 흐름을 검증한다.
- **범위:** 구현자는 `evals/support/ticket-verdict.mjs`만 생성한다. `tests/ticket-verdict.tests.mjs`, 이 원장, 다른 제품·평가 파일은 수정하지 않는다.
- **제외:** 자동 에이전트 실행기, 사용자 홈 설치, UI, 네트워크, 외부 쓰기, 기존 Ticket 스킬 계약 변경.
- **합격 조건:**
  1. `summarizeTicketVerdicts(criteria)`를 named export한다.
  2. 각 항목의 non-empty unique `id`, boolean `required`, `PASS|FAIL|UNVERIFIED` verdict를 검증하고 입력 배열과 객체를 변경하지 않는다.
  3. 하나라도 `FAIL`이면 `REWORK`; 아니면 required `UNVERIFIED`가 있으면 `UNVERIFIED`; 그 외에는 optional `UNVERIFIED`가 있어도 `ACCEPTED`다.
  4. `{ state, counts, failedIds, unverifiedRequiredIds }`를 입력 순서에 대해 결정론적으로 반환한다.
  5. `node --test tests/ticket-verdict.tests.mjs`와 기존 전체 Node suite가 통과한다.
- **증거 요구:** 구현자는 full 40-character BASE·CANDIDATE, exact diff, 실행한 검사를 제출한다. 새 평가자는 구현자 설명 없이 원 요청·이 티켓·두 SHA만 받고, clean detached CANDIDATE에서 diff와 focused test를 직접 확인한다. 평가 전후 HEAD·tracked·untracked 상태가 같아야 한다.

## 갱신 규칙

마일스톤, 범위, 릴리스 조건, 결정, 차단, 계획된 인계가 바뀔 때만 갱신한다. 편집·명령·응답·커밋마다 쓰지 않는다. 실패 재실행은 새 증거로 보존하고 이전 실패를 덮어쓰지 않는다.
