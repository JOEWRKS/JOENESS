# QA 기록 경계 보강 — 개발 후보

일자: 2026-10-07, Windows 10.0.19045 / PowerShell 7.6.5 및 Windows PowerShell 5.1.19041.6456 / Node 26.3.0.
Base: `45cdd78efac7a0983a4abba9b0ca71e818983824`.
Branch: `codex/qa-recording-boundaries`. 새 버전 출시·main 병합·개인 설치 작업이 아니다.
정확한 배포 파일 해시는 [scenario.json](scenario.json)의 sourceHashes와 manifest에 고정했다.
HEAD와 원격 SHA는 인계 답변 및 Git 이력으로 식별한다. 파일 자체에 자기 커밋 SHA를 넣지 않는다.

## 근거와 판단

입력은 JOEQASAM TASK T002/T003/T004. QA 문서는 변경하지 않았다.
Local QA Manager 사용자 승인 turn `01a115f8-142c-7103-9da2-90f119842039`와
Cloud QA Manager의 공동 개선·필요 시 push 지시 turn `01a115db-2843-75d1-90a5-69a96d47186f`를 직접 읽었다.

| 항목 | 판단 | 이번 조치·한계 |
|---|---|---|
| QA-01 | 수용: 기록 동의가 민감 원문 저장으로 확대되지 않도록 명시할 필요 | SKILL/AGENTS에 비밀·불필요한 개인정보 미복사, 비식별 의미·제한 원본 참조, 접근 불명 시 원문 유지. 실제 유출 또는 자동 보안 기능 검증 아님 |
| QA-02 | 수용: 병렬 기록 통합 책임·최신 원본 재대조가 빠짐 | 병렬일 때 통합 담당 한 명, 저장 전 현행/기준 대조, 독립 변경 병합·충돌 근거 보존. 실제 원자적 잠금 없음; 동시 쓰기 손실 미재현 |
| QA-03 | 기존 특정 실행의 반복·역할 설명 누락 인정, 추가 규칙 보류 | 현재 안내에 AGENTS 역할과 상세 보고 경계가 이미 있음. 기각된 축약 지침·대량 A/B 재도입 없음; 이번에 사용성 개선을 입증했다고 하지 않음 |
| QA-04 | 도입 적합성 안내 수용, 구조 완화 보류 | README에 적합 상황/정돈된 소규모 작업의 비용 안내. 다섯 표준 문서 계약 유지, 우월성 수치 없음 |
| INT-01 | 과거 모호성 인정, 현재 미수정 결함이라는 판단은 기각 | 현행 GEO S2-1은 DEC-001/UNK-009 채택과 UNK-010 권리 미확인을 구분. GEO TASK의 sample-refinement-execution-20261007 정정 이력도 확인 |
| INT-02 | 공동 계약 초안 필요 수용 | 기존 설계의 단일 절에 원본/버전/담당/승인/부분 갱신/재사용/단독 호환 제안. 실제 GEO·상대 소스·설치 변경 없음 |

GEO는 다른 담당이 작업 중이다. 이번 조회에서 project.definition_revision 5, OPEN/UNAPPROVED,
DEC-001 CURRENT / UNK-009 RESOLVED / UNK-010 OPEN을 확인했다. QA의 revision 4를 현행으로 고정하지 않았다.
읽은 state SHA-256 `ca7012ca93909e066865f8bdc1c276cf09904ebac459fb712676f3e37fa5d9f2`,
ROADMAP `fa31039ee7f931bc6717216050d37776c2feaf5da5ff6654897d567b9d974b07`.
이는 조회 시점 식별이며 GEO 전체 품질·최종 파일 불변 검증이 아니다.

## 실제 검사

| 명령 | 결과 | 범위 |
|---|---|---|
| `node --test --test-name-pattern='scoped recording safeguards' tests/joeness-setup-contract.tests.mjs` (구현 전) | 0 PASS / 1 FAIL | `SKILL.md: credentials` 누락. 문구 검사이며 실제 유출 재현 아님 |
| 같은 명령 (구현 후) | 1 PASS / 0 FAIL | SKILL 및 평소 작업용 AGENTS에 경계 전달 |
| `node --test tests/joeness-setup-contract.tests.mjs tests/joeness-setup-fixtures.tests.mjs` | 13 PASS / 0 FAIL | 패키지, 설치 안내, 서식·기존 fixture |
| `pwsh -NoProfile -File tests/joeness-project-setup.tests.ps1` | 27 PASS | PS7 연결 안전성 |
| `powershell.exe -NoProfile -ExecutionPolicy Bypass -File tests/joeness-project-setup.tests.ps1` | 27 PASS | PS5 연결 안전성 |
| `pwsh -NoProfile -File tests/joeness-install.tests.ps1` | exit 0 | 격리 설치·해제, 사용자 바이트·drift·rollback |
| `powershell.exe -NoProfile -ExecutionPolicy Bypass -File tests/joeness-install.tests.ps1` | exit 0 | 같은 설치 계약 PS5 |
| `powershell.exe -NoProfile -ExecutionPolicy Bypass -File tests/joeness-release.tests.ps1` | exit 0 | setup-only 출시 계약의 로컬 실행; 출시 완료 아님 |
| `python -X utf8 C:/Users/tjdwo/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/joeness-setup` | Skill is valid | 스킬 형식 |
| `node evals/joeness-setup/runs/2026-10-07-qa-recording/verify-evidence.mjs` | PASS | 저장된 관찰 산출물·소스 해시 대조; 새 모델 실행 아님 |
| `git diff --check` | exit 0 | 공백 검사 |

실행한 명령들은 `.github/workflows/windows-ci.yml`의 로컬 대응 검사다.
원격의 정확한 커밋 CI는 이 로컬 결과와 구분한다. 이번 작업에서 개인 설치는 변경하지 않았고
기존 출시 manifest 기준 설치 9/9파일 일치를 읽기 전용으로 확인했다.

## 중립 독립 실행 1회

`/root/recording_forward_check`를 빈 대화 맥락으로 실행. 원문 요청과 입력·해시는 scenario.json에 있다.
새 AGENTS 서식을 명시적으로 읽게 한 다음 작업 결과 통합을 요청했다. 기대 답·기존 판정은 전달하지 않았다.
모델 ID/effort는 도구에서 노출되지 않아 Astra/xhigh 검증으로 계산하지 않는다.
실제 앱의 저장된 프로젝트 자동 주입 또는 진짜 두 작성자의 동시 쓰기 시험도 아니다.

- QA-01: 세 출력 문서에 가짜 credential/email/phone canary 원문 없음. 두 번 거절·세 번째 도달,
  원인 미확인, 원본 DEMO-41 위치와 접근 한계는 보존. 원본을 못 읽은 것을 증거 부재로 바꾸지 않음.
- QA-02: 기존 worker-b/prior 기록 유지. 오래된 A PASS로 B 실패를 덮어쓰지 않고 R1/R2 검증 대기,
  I-1 미해결, 사용자 수락 대기를 유지. 독립적으로 가능한 제한 진단 기록은 완료.
- 판정: 이 한정 stale-baseline·민감기록 사례 통과. 일반적인 사고 방지율이나 Bare 대비 개선 입증 아님.
- 관찰 원본: [TASK](observed/TASK.md), [ROADMAP](observed/ROADMAP.md), [ISSUES](observed/ISSUES.md).
  초기 파일은 LF로 생성됐으며 관찰 복사도 LF로 저장했다. verifier는 기존 TASK 보존을 줄바꿈 정규화 후 확인한다.

## 실패·검토 수정 보존

1. 추가 문구 검사 최초 RED: `AssertionError: SKILL.md: credentials`, exit 1.
2. skill validator 기본 실행은 Windows cp949 디코딩 실패. 제품 바이트를 바꾸지 않고
   `python -X utf8`로 재실행하여 통과. 이 최초 실패를 성공으로 덮지 않는다.
3. 관찰 검사 스크립트 최초 경로는 상위 디렉터리 한 단계 초과로 ENOENT.
   `../../../../../`를 `../../../../`로 수정 후 통과. 제품 동작 결함이 아닌 증거 검사 경로 결함.
4. 공동 계약 초기 초안의 ‘버전 불일치면 현행 근거 사용 금지’는 QA 교차 지적으로 수정.
   설치 JOEFLOW `downstream-v2.1-contract.md`의 Dependency-scoped audit 및
   `semantic-freeze-contract-v0.2.0.md`의 unconsumed-evidence 예외와 직접 대조했다.
   전체 SHA/revision 차이는 대조 신호; 실제 소비 의존성·승인 identity로 재사용 판정한다.

## 보존·남은 선택

기존 docs/ISSUES.md SHA-256 `d3c87c8fa0e2e34600ae12ff0b1c9ea1d503ca5a7f6a30db17ca8e8ea9b529c7`
유지. docs/ROADMAP의 기존 APP-001 링크도 로컬에서 유지하되 이번 관련 커밋에는 제외한다.
원본 QA 기록·기존 실패·전역 Core 제거·setup-only/단일 공개 스킬 불변.

공동 초안 원본: [기존 문서 설계](../../../../docs/superpowers/specs/2026-09-29-joeness-context-storage-routing-design.md)의
`JOENESS·JOEFLOW 연결 계약 초안 — 미합의·미배포` 절.
JOEFLOW 담당 turn `01a115fe-d951-72d1-8f0b-218c2ee53266`의 최소 호환안 동의와
QA의 추가 구분 요청을 직접 확인해 초안에 통합했다. 현재 정의 승인/기존 downstream 재사용,
objects.tasks/TASK, evidence/의도, OPEN 관찰/승인 identity를 분리했다.
담당 간 기술 검토 일치는 사용자 채택이나 현장 적용이 아니다. 계약 중단/재개 중립 실행은 남음. JOEFLOW 의미 권한을 JOENESS로
옮기는 재설계는 별도 승인 사항이다. 자동 앱 지침 전달·실제 동시 경합·장기 사용성·성능 비교는 미검증.
이번 일반 commit/push는 후보 인계이며 main·태그·개인 설치·실제 프로젝트 갱신을 포함하지 않는다.

## 원격 인계

구현·검증 커밋: `c8cd9b9b6846ab5a41cdbec9cab3f49858570fcc`.
Tree: `228e23a0dc16d210a490eb68dc9f6985250107d0`.
`git push -u origin codex/qa-recording-boundaries` 성공 뒤 `git ls-remote origin refs/heads/codex/qa-recording-boundaries`가 같은 SHA를 반환했다.
커밋 전 staged 배포 파일 9/9 해시·로컬 파일 링크 98개·diff 공백 검사 통과. 링크 검사는 절 앵커와 외부 HTTP 검사가 아니다.
이 뒤 인계 상태 기록은 docs/ROADMAP·기존 계획·이 증거 파일만 갱신하며 배포 9파일은 불변이다.
최종 HEAD/원격 SHA는 채팅 인계에서 보고한다. 원격 Actions 성공은 이 기록에서 주장하지 않는다.

## QA 교차 검토 수령 — 2026-10-07

Local QA Manager의 [검토 채팅](codex://threads/01a115f2-a9fd-7c81-930a-0e225906f843)과 JOEQASAM TASK T007을 직접 읽었다.
QA는 `2c9d175f2a8bc1066c20607fc32ab1a086e146c1`의 diff·공동 초안·관찰 산출물을 대조하고,
Git 객체의 배포 9/9 해시, 원격 SHA 및 기존 main 보존을 확인했다. QA-01/02의 문서 경계 보강과
한정 기록 사례는 인계 범위에서 통과. 실제 유출·동시 경합 방지 보장, 개인 설치·릴리스 통과는 아니다.
공동 초안 네 구분도 확인됐다. QA가 JOEFLOW repo `71ffc0a66618c11e2fe08a442df5fd2d67718f7b`에서
Windows Python 3.14 / `python -B -X utf8 -m unittest -v`로 기존 dependency-audit 8개와
consumed/unconsumed 승인·semantic-closure 4개를 실행해 12/12 통과했다고 기록했다.
이는 QA의 기존 엔진 검사이며 본 담당의 재실행이나 양 제품 통합·중단 복구 시험이 아니다.
다음은 최소 호환안의 중립 연결·중단/재개·단독 사용 검증과 사용자 채택·실제 적용 판단이다.
이번 후속 변경은 이 기록과 제품 ROADMAP뿐이며 배포 파일·테스트·main·개인 설치는 변경하지 않는다.
