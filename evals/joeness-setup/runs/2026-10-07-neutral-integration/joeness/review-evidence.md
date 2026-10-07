# T008 — 중립 연결·중단 후 재개 검증

기준 후보: `f7f9a2b9c40408312bf8bd4266dd9f021146d484`, branch `codex/qa-recording-boundaries`.
일자: 2026-10-07. 판정: **한정 사례 통과**, 출시·실제 프로젝트 적용·사용자 수락 아님.
인간 승인: Local QA Manager turn `01a1160b-9b8b-7762-9b6e-6c3a59dc2051`의
“다음 작업 바로 ㄱ”을 직접 확인했다.
정확한 요청·실행자·임시 Git 기준점은 [execution.json](execution.json), 사전 조건은 [protocol.md](protocol.md).

## 결과

| 검증 | 실제 결과 | 근거 |
|---|---|---|
| JOENESS 단독 연결 | 실제 Check→Apply→Check = ready→current→current/clean. 일반 제품 문서 연결, JOEFLOW 형식 강제 없음 | [helper](standalone-helper.json) |
| 단독 새 담당자 재개 | ROADMAP/TASK만 변경. 채택된 방향 재질문 제거, 기존 합성 검사 기록 반영. 실기기 검증·단계·사용자 수락 미완 유지 | [전후 원문·diff·해시](standalone-observed.json), [응답](standalone-response.md) |
| 통합 연결 | 고정 OPEN state 사본과 낡은 ROADMAP에 실제 helper 적용. 원본·기존 AGENTS 본문 보존 | [helper](combined-helper.json) |
| 통합 새 담당자 재개 | 실제 state 조회 후 R1/다음 작업만 정정. DEC-1000 CURRENT, UNK-1000 RESOLVED, UNK-1001 OPEN 및 전체 OPEN/UNAPPROVED 유지. 결정 재생성·재승인·state 쓰기 없음 | [전후 원문·diff·해시](combined-observed.json), [응답](combined-response.md) |
| JOEFLOW 단독·의존성 | JOENESS 문서 입력 없이 현행 설치 엔진 실행. 같은 승인 revision 재사용, 비소비 자료 변경, 새 OPEN revision 재사용, 소비 근거 변경 시 영향 소비자만 재검토 | [담당 원본 결과](../joeflow/audit-results.json), [재현·출처](../joeflow/README.md) |

두 재개는 각각 `fork_turns=none`인 새 subagent 1회. 실행자는 정답·기존 평가를 받지 않고
AGENTS와 합성 파일을 실제로 읽고 수정했다. 부모는 그 후 파일/diff를 캡처·검토했다.
모델/추론 강도는 도구에서 노출되지 않았으므로 Astra/xhigh 검증으로 세지 않는다.
자동 앱 지침 전달이 아니라 AGENTS를 명시적으로 읽도록 요청한 시험이다.

단독 R1의 상태 표기는 정식 상태명 대신 `passed in recorded synthetic evidence (demo-7)`였다.
새 실행을 꾸미거나 실기기·단계 완료로 바꾸지는 않았지만 **서식 완전 준수로 판정하지 않는다**.
이 한 번의 표현 편차만으로 규칙을 추가하지 않는다. 통합 응답의 길이·사용성도 이번 판정 대상 아님.

## 원본 보존과 실행 범위

- 단독 Product SHA-256: `3060094b34cb68d94bc4a893da31d3e1c2cbb0cf2fe3e346eb5077ca135cf240`, 전후 동일.
- 통합 state SHA-256: `5d9c05f37a882984913ebe9b6b7d886e978c7d54ef8ab1423db7b2b00aa1bdc9`, 전후 동일.
  사본은 읽기 전용 속성으로 고정. schema 0.2.0/revision 1, approval_history `[]` 불변.
- 두 사례 모두 AGENTS·DESIGN·ISSUES·연결 상태 불변, 미추적 파일 0.
  TASK 이전 본문은 그대로 보존하고 실제 수행 결과만 추가했다.
- 통합 입력 전체는 [JOEFLOW 고정 원본](../joeflow/open-source-state.json) 한 곳에 보관.
  관찰 JSON은 이 원본의 해시·ID/상태만 기록하며 두 번째 결정 장부를 만들지 않는다.
- 임시 통합 AGENTS에는 초안의 원본 쓰기 담당·버전 참조·재개 규칙을 짧게 추가했다.
  따라서 결과는 **후보 JOENESS + 초안 연결문**의 한정 검증이며 배포본만의 자동 동기화 증명이 아니다.
- 기준 후보 이후 `skills/`, manifest, helper, installer, tests, workflow 변경 0. 공개 9파일 해시 일치.
  실제 GEO·JOEFLOW 제품 저장소·개인 설치에는 이 작업의 쓰기 명령을 실행하지 않았다.
  전체 실제 프로젝트의 전후 불변 감사나 설치 검사 재실행으로 확대하지 않는다.

## 실제 명령과 확인

helper 정확한 인수는 execution.json에 있고 결과는 두 helper JSON에 있다. 재실행 시 이미 적용된
fixture에는 Apply를 반복하지 않는다. 읽기 전용 캡처 명령:

```powershell
node evals/joeness-setup/runs/2026-10-07-neutral-integration/joeness/capture-fixture.mjs <standalone-root> 8c5c0e291bd6d5894450bf8608a2351c88dd9b07 product-brief.md
node evals/joeness-setup/runs/2026-10-07-neutral-integration/joeness/capture-fixture.mjs <combined-root> e942336a4e21c0ce5a5c5b6f564488a79f345c7b product-definition/state.json
node evals/joeness-setup/runs/2026-10-07-neutral-integration/joeness/verify-evidence.mjs
python -B -X utf8 C:/Users/tjdwo/.codex/skills/joewrks-product-definition/scripts/validate_state.py evals/joeness-setup/runs/2026-10-07-neutral-integration/joeflow/open-source-state.json
git diff --check
```

캡처 2회 exit 0. 최종 verifier PASS: 두 helper/보호 바이트/기록 보존, JOEFLOW manifest 11/11,
JOENESS 배포 9/9, 기준 후보 대비 실행 소스 불변, 허용 루트 구조. OPEN validator valid=true/errors 0.
이는 저장 산출물 무결성 검사이며 새로운 모델 실행이나 의미 판정의 대체가 아니다.
기존 Node13/13·PS5/7 연결 각27/27·설치·출시 계약은
[동일 소스의 이전 근거](../../2026-10-07-qa-recording/review-evidence.md)를 재사용하며 중복 실행하지 않았다.

## JOEFLOW 결과 해석

JOEFLOW 담당이 설치 엔진을 실제 실행했고 QA가 저장된 state를 읽기 전용 재실행해 대조했다.
부모 JOENESS 담당은 제공된 script·결과·고정 해시를 검토했으며 엔진 실행 담당으로 주장하지 않는다.
별도 승인 기준본은 기존 M6 dogfood의 읽기 전용 사본이다. 이번 실제 사용자 승인을 만든 것이 아니다.

- 기준본과 비소비 자료만 추가한 같은 revision: CONFORMANT / SAME_APPROVED_REVISION.
  definition/manifest digest, approval/history 불변.
- 비소비 자료만 달라진 새 OPEN revision: CONFORMANT / OLDER_APPROVED_REVISION_UNAFFECTED.
  현재 제품 전체는 UNAPPROVED지만 기존 소비 계약은 재사용 가능.
- 소비 근거 변경: REENTRY_REQUIRED, `resolve_thread`만 영향, 나머지 소비자 5개 비영향.
  기존 승인 control을 그대로 둔 별도 probe는 closed=false이며 stale_approval,
  stale Manifest, 동일 revision 의미 변경을 실제 검출했다. 이 예상 거부는 제품 검사 실패가 아니다.
- 주의: 해당 엔진은 REENTRY_REQUIRED에도 relation 필드에 OLDER_APPROVED_REVISION_UNAFFECTED를
  반환한다. **relation 문자열 단독으로 재사용을 허가하지 않고 status·gaps·affected_consumers를 함께 본다**.
  이 관찰은 기존 엔진의 해석 주의점이며 이번 JOENESS 회귀나 새 엔진 수정으로 주장하지 않는다.

## 실패·운영 한계 보존

1. 첫 단독 fixture driver는 dot-source된 helper의 Check/Apply switch와 지역 변수명이 충돌해
   Apply 전에 실패. driver 변수명만 변경 후 실행 성공. 제품 helper 결함 아님. 원문은 execution.json.
2. JOEFLOW 자료 이동 뒤 빈 루트 `evidence/`가 남아 첫 무결성 검사 exact-root assertion 실패.
   경로와 비어 있음을 직접 확인하고 빈 폴더만 삭제한 뒤 통과. 파일 삭제 없음, 루트 계약 완화 없음.
3. 중간 맥락 복구 때 과거 대기 요청으로 잘못 종료한 응답을 보존한다. QA의 재개 요청과 최신 인간
   승인을 재확인해 이미 끝난 시험은 반복하지 않고 캡처부터 재개했다. JOENESS 원인으로 단정하지 않는다.
4. 선택 staging 보호 검사가 새 행의 앱 문제 ID 언급에도 반응해 중단했다. 새 행 설명만 일반 문구로
   바꾼 후 관련 hunk만 stage했고 기존 이슈 기록은 제외했다. Python 증거의 줄바꿈 경고에는 이 run만의
   `.gitattributes`로 LF를 고정했다. 증거 원문·해시는 바꾸지 않았다.
5. 준비된 '원본 저장 완료/요약 미반영' 경계의 수동 재개만 확인. 프로세스 강제 종료, 쓰기 실패 자동 복구,
   실제 동시 쓰기, 앱 자동 주입, 장기 안정성, 사용자 수락, Bare 대비 성능·토큰 절감은 미검증.

QA가 두 observed JSON을 임시 Git baseline/현재 파일과 직접 대조해 모든 해시·변경 범위를 확인했다.
한정 중단 재개와 두 단독 경로 통과 의견을 수령했다. 이번 결과는 공동 최소 호환안의 선택 근거이며,
사용자 채택·제품 의미 소유권 이전·main 병합·릴리스·개인 설치·실제 프로젝트 적용은 수행하지 않는다.
최종 commit/tree/원격 SHA는 Git 이력과 인계 답변에서 식별한다.
