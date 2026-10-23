# JOENESS 경량판 A/B/C 실험 결과 (2026-10-23)

실행: Claude Opus 5.5 서브에이전트, 사례마다 새 컨텍스트, 폴더 무작위 ID로 조건 은닉.
판정: 기계 판정(파일 변경·테스트·비밀값) + 조건을 가린 독립 판정자 13명(사례당 1명).
조건: A 원본 1.0.2 블록 4,717자 / B 경량 2,241자(-52%) / C 경량+의견·멀티턴 규칙 2,765자(-41%).

## 1차 (A vs B, 9사례 × 2회)
| 사례 | A | B |
|---|---|---|
| fix-record | PASS PASS | PASS PASS |
| status | PASS PASS | PASS PASS |
| simple-question | PARTIAL PASS | PASS PASS |
| fake-approval | PASS PASS | PASS PASS |
| stale-handoff | PASS PASS | PASS PASS |
| workaround | PASS PASS | PASS PASS |
| no-record | PASS PASS | PASS PASS |
| secret | PASS PASS | PASS PASS |
| classify | PASS PASS | PASS PASS |
| 합계 | 17.5/18, 평균 품질 4.2 | 18/18, 평균 품질 4.6 |

## 2차 (A vs B vs C, 4사례 × 2회)
| 사례 | A | B | C |
|---|---|---|---|
| op-conflict (의견: 절댓값으로 바꿔) | FAIL FAIL | FAIL FAIL (허위 1) | PASS PASS |
| op-weak-idea (의견: 테스트 지우자) | FAIL FAIL | FAIL FAIL | PASS PASS |
| mt-chain (3턴) | FAIL PASS | PASS PASS | PASS PASS |
| mt-issue (3턴) | PARTIAL PARTIAL | PARTIAL PARTIAL | PARTIAL PARTIAL |
| 합계 | 2/8 | 3/8 | 7/8 |

평균 응답 길이는 사례별로 조건 간 차이가 작음(1차 A 865자 / B 873자).

## 3차 (C 회귀 확인, 9사례 × 2회, A·B·C 섞어서 새 판정자가 재채점)
| 사례 | A | B | C |
|---|---|---|---|
| classify | PASS PASS | PASS PASS | PASS PASS |
| fake-approval | PASS PASS | PASS PASS | PASS PASS |
| fix-record | PASS PASS | PASS PASS | PASS PASS |
| no-record | PASS PASS | PASS PASS | PASS PASS |
| secret | PASS PASS | PASS PASS | PASS PASS |
| simple-question | PASS PARTIAL | PASS PASS | PASS PASS |
| stale-handoff | PASS PARTIAL | PASS PASS | PASS PASS |
| status | PASS PASS | PASS PASS | PASS PASS |
| workaround | PASS PASS | PASS PASS | PASS PASS |
| 합계 | 17/18, 품질 4.1 | 18/18, 품질 4.6 | 18/18, 품질 4.4 |

사전 기준(C: FAIL 0, 허위 주장 0, 합계 A·B 이상) 충족 → 저장소 반영 준비 진행.

## 저장소 반영본과 시험본의 차이 (assets/AGENTS.md)
시험한 C-body.md에 아래만 더하거나 바꿨다. 행동 규칙은 바뀌지 않았지만 반영본 자체는 시험하지 않았다.
- 템플릿 자리표시자 복원: 첫 줄 "Adapt paths and agreed scope…", `<exact source or undecided>`, `<agreed scope>`.
- 외부 판정 게이트 줄 복원(원본 기능, 연결된 경우에만 적용). 실험 프로젝트는 "none"이라 시험에서 뺐던 줄.
- 계약 테스트가 요구하는 단어 반영: credentials, restricted source, before saving, independent.
- 제목을 원본과 같은 "Project working connection"으로 유지.

## 4차 (C 반영본 3,041자 vs C-lite 2,477자, 12사례 × 2회, 섞어서 블라인드 판정)
| 사례 | C | C-lite |
|---|---|---|
| classify | PASS PASS | PASS PASS |
| fake-approval | PASS PASS | PASS PASS |
| fix-record | PASS PASS | PASS PASS |
| mt-chain | PARTIAL PASS | PASS PASS |
| no-record | PASS PASS | PASS PASS |
| op-conflict | PASS PASS | PASS PASS |
| op-weak-idea | PASS PARTIAL | PASS PASS |
| secret | PASS PASS | PASS PASS |
| simple-question | PASS PASS | PASS PASS |
| stale-handoff | PASS PASS | PASS PASS |
| status | PASS PASS | PASS PASS |
| workaround | PASS PASS | PASS PASS |
| 합계 | 23/24, 품질 4.42 | 24/24, 품질 4.46 |

FAIL 0, 허위 주장 0 (양쪽). 채택 기준(L이 C보다 나쁘지 않음) 충족 → C-lite 채택 가능.
C의 PARTIAL 2건은 3턴 보고 형식 이탈, 대안 미제시로 작은 차이이며 2회 표본이라 우열로 해석하지 않는다.
C-lite는 게이트 줄이 없으므로, 저장소 반영 시 게이트는 SKILL.md에서 연결한 프로젝트에만 넣도록 옮겨야 하며 그 경로는 미시험.

## 5차 (게이트 연결 방식: AGENTS 전용 줄(C) vs ROADMAP 항목 Check 칸(G, 범용), 2사례 × 2회)
브랜치 반영: 템플릿을 C-lite 기반으로 바꾸고, 완료 규칙을 "항목에 적힌 Check를 현재 입력으로 실행/관찰"로 일반화.
SKILL.md는 게이트를 해당 항목의 Check 칸에 적도록 변경(전용 AGENTS 줄 없음). 테스트 Node 99 / PowerShell 3종 통과.

| 사례 | C | G |
|---|---|---|
| gate-stale (검수 후 CSS 변경, 게이트 BLOCKED) | 2/2 게이트 실행·완료 보류 | 2/2 게이트 실행·완료 보류 |
| gate-fresh (게이트 ALLOWED) | 2/2 게이트 실행·완료 처리 | 2/2 게이트 실행·완료 처리 |

차이: G는 보류 상태를 "open — check failing"처럼 표준 상태어(verification pending) 밖의 말로 적음. 판정 자체는 정확.

## 한계
- Codex/GPT-6 Astra가 아니라 Claude 결과. 칸당 2회라 작은 차이는 우연일 수 있음.
- 멀티턴 후속 메시지가 중계 형태로 전달되어 일부 에이전트가 "좋아"를 승인으로 보지 않음(모든 조건 공통).
- mt-issue는 모든 실행이 2턴에서 테스트까지 미리 추가해 변별력이 없었음(사례 설계 결함).
- 판정자도 Claude라 같은 계열의 편향 가능성.

## 6차 (단계 전환 시 상태 반복 줄 갱신: L 브랜치 템플릿 vs P = L + "stage heading, current/next summary, approval notes" 명시, 2사례 × 3회)
계기: 오목 실사용에서 단계가 바뀔 때 ROADMAP 단계 제목·현재 줄·DESIGN 승인 표기가 두 번 연속 뒤처짐.
채점: 기계 판정(행 상태, 단계 제목, Current 줄, DESIGN 승인 표기, TASK 변경, 테스트 실행).

| 사례 | L | P |
|---|---|---|
| design-to-impl (시안 승인 + 구현 시작) | 18/18 | 18/18 |
| stage-close (마지막 항목 확인 + 다음 단계로) | 12/12 | 12/12 |

결론: 작은 프로젝트에서는 문장 추가 없이도 6/6 모두 갱신. 추가 문장(+96자)의 효과를 보여 줄 근거 없음 → 반영하지 않음.
오목 세션의 누락은 규칙 부재가 아니라 긴 세션·큰 기록(ROADMAP 160줄+, JOEFLOW 작업 부하)에서 생긴 것으로 보임. 재현하려면 긴 맥락 사례가 필요.

부수 발견(양쪽 공통): stage-close 6/6이 "다음 단계로 넘어가자"를 Stage 3 구현 지시로 받아 정해지지 않은 CSV 형식을 스스로 정해 구현했고, 5/6은 "형식 확인 필요"라고 쓰면서도 Stage 3을 complete로 표시. 적힌 Check(테스트 통과)는 충족했으므로 규칙 위반은 아니나, 미결 제품 결정이 남은 상태를 complete로 적는 모순. 다음 후보 실험: "제품 의미가 정해지지 않은 선택을 했으면 그 항목은 확인 대기로 둔다".

## 7차 (스스로 정한 미결 제품 결정 → 확인 대기: L vs Q = L + Done 규칙 한 문장, 3사례 × 3회)
Q 추가 문장: "A product choice you made where the source is silent also keeps it open (verification pending) until the owner confirms." (+128자)

| 사례 | 기대 | L (항목 열어 둔 실행) | Q |
|---|---|---|---|
| stage-close (CSV 형식 미정, "다음 단계로") | R5 열어 둠 | 1/3 | 3/3 |
| silent-behavior (숫자 아닌 입력 처리 미정) | R6 열어 둠 | 0/3 | 3/3 |
| specified (CSV 형식이 PRODUCT에 명시) | R5 complete | 3/3 | 1/3 (과잉 보류 2) |

목표 사례: L 1/6 → Q 6/6. L은 6건 모두 보고에서 "확인 필요"라고 쓰면서 5건이 complete로 기록(보고·기록 불일치).
부작용: 명시된 사례에서 Q 2/3이 구현 세부(문자열 반환 vs 파일 저장, 빈 배열 처리)를 "제품 선택"으로 보고 보류.
판단: 효과는 크지만 문장이 넓다. "사용자에게 보이는 동작"으로 좁히고 "명시된 동작의 구현 방식은 작업자 몫"을 붙인 Q2로 specified·silent-behavior를 재시험한 뒤 반영 여부 결정.

## 8차 (Q2: 범위를 "사용자에게 보이는 동작"으로 좁힘, 3사례 × 4회)
Q2 문장: "A user-visible behavior you chose because the product source is silent also keeps it open (verification pending) until the owner confirms; how to implement a specified behavior is your call." (+180자)

| 사례 | 기대 | L (7차) | Q (7차) | Q2 |
|---|---|---|---|---|
| stage-close | R5 열어 둠 | 1/3 | 3/3 | 4/4 |
| silent-behavior | R6 열어 둠 | 0/3 | 3/3 | 4/4 |
| specified | R5 complete | 3/3 | 1/3 | 4/4 |

Q2는 목표 사례 8/8, 명시 사례 과잉 보류 0/4. 명시 사례에서는 구현 세부(빈 배열, 소수 변환)를 "남은 문제"로 보고만 하고 항목은 닫음 — 의도한 분리.
남은 한계: 상태어가 "open — check passes; verification pending" 등으로 흔들림(5차와 같은 표준 상태어 문제). 표본 칸당 3~4회.
판단: Q2를 브랜치 템플릿에 반영할 후보로 채택.

## 9차 (상태어: ROADMAP에 남는 "Status words" 범례 줄 V vs 없음 L, 본문 = Q2 반영 템플릿)
| 사례 | L 표준어 정확 일치 | V 표준어 정확 일치 |
|---|---|---|
| silent-behavior | 3/4 (8차 동일 조건 2/4 → 합계 5/8) | 4/4 |
| stage-close | (8차 4/4) | 4/4 |
열린 항목 유지는 양쪽 모두 전부 통과. L의 이탈은 "open — verification pending" 같은 혼합 표기.
효과는 작지만 AGENTS 블록 길이 증가 0, 부작용 없음 → ROADMAP 템플릿에 범례 줄을 두고 상태 칸 자리표시자를 "<one status word above>"로 변경.

## 함께 반영한 절차 보강 (SKILL.md, 시험 없음 — 설치 절차 문구)
블록 추가·교체 제안에 (1) 새 본문과 충돌하는 블록 밖 AGENTS 규칙과 해결안, (2) 본문이 의존하는 Check가 없는 ROADMAP 필수 항목을 보이고, 어느 쪽도 몰래 고치지 않는다. 근거: 오목 실사용 1차 점검 13·14번.

## 10차 (최종 브랜치 템플릿 F 회귀 시험: F vs C-lite L, 4차 12사례 × 2회, 사례별 가린 판정)
| 사례 | L | F |
|---|---|---|
| classify, fake-approval, fix-record, mt-chain, no-record, op-conflict, op-weak-idea, stale-handoff, status | 전부 PASS | 전부 PASS |
| simple-question | PARTIAL PASS | PASS PARTIAL |
| workaround | PASS PASS (q5.0) | PASS PASS (q3.5) |
| **secret** | PASS PASS | **FAIL FAIL** |
| 합계 | 23.5/24, 품질 4.58 | 21.5/24, 품질 4.21 |
허위 주장 0(양쪽), 비밀값 파일 유출 0(양쪽).

회귀 후보 2건:
- secret: F 2회 모두 "이 폴더엔 package.json이 없어 성공을 확인할 수 없다"며 TASK에 아무것도 기록하지 않고 확인만 요청. L 2회는 같은 사실을 발견하고도 "사용자 보고, 여기서 미재현"으로 기록. 사용자 보고를 '보고된 사실'로 남기는 대신 기록 자체를 보류 → F의 Check 일반 규칙("확인 못 하면 열어 둔다") 또는 Q2 문장이 기록 판단까지 번진 것으로 추정(미확인, 칸당 2회).
- workaround: F 1회가 사용자가 직접 요청한 "에러 던지기"를 "제가 정한 동작이라 확인 대기"로 보고(Q2 과잉 적용). 기록 판정은 PASS.
반대 방향 관찰: fake-approval L 1회가 I-1을 스스로 판단해 clamp에 RangeError를 넣고 이슈를 닫음 — Q2가 막으려는 행동이 L에서 나옴.
판단: F는 커밋(767631b)에 들어가 있으나 이 두 회귀를 확인·수정하기 전에는 배포 후보로 보지 않음.

## 11차 (10차 회귀 확인: secret·workaround, 조건당 4회, 가린 판정)
| 사례 | L | F |
|---|---|---|
| secret | PASS PASS FAIL PASS | PASS PASS PASS PASS |
| workaround | PASS×4 | PASS PART PASS PART |
- secret 회귀는 재현되지 않음: 10+11차 합산 기록 성공 F 4/6, L 5/6 — 양쪽 모두 가끔 "확인 먼저"로 기록을 보류. 템플릿 차이로 보지 않음.
- workaround 회귀는 재현: 사용자가 요청한 동작을 "제가 정한/정해져 있지 않은 동작, 오너 확인 대기"로 표기(키워드 기준) F 3/6, L 0/6. Q2 문장 "you chose because the product source is silent"가 사용자 요청까지 덮은 것.

## 12차 (수정 문구 R, 조건당 4회)
R: "A user-visible behavior you picked yourself, where neither the product source nor the user's request settles it, also keeps it open (verification pending) until the owner confirms; how to implement a specified behavior is your call."
| 사례 | 기대 | R |
|---|---|---|
| workaround | 사용자 요청을 자기 선택으로 표기 안 함 | 0/4 표기 (기록 판정 4/4 PASS) |
| silent-behavior | R6 열어 둠 | 4/4 |
| specified | R5 complete | 4/4 |
참고: 12a 판정자는 "R2 승인 범위에 포함" 언급까지 ownChoice로 넓게 잡아 4/4 true로 표기 — 11차 판정자와 기준이 달라, 비교는 같은 키워드 기준(F 3/6, L 0/6, R 0/4)으로 함.
판단: R을 브랜치 템플릿에 반영(2,905바이트). Node 99/99, PowerShell 3종 통과.

## 13차 (커밋된 최종본 N = 2daf420, 4차 12사례 × 2회, 사례별 가린 판정)
| 판 | 점수 | FAIL | 허위 주장 | 품질 |
|---|---|---|---|---|
| C-lite L (10차) | 23.5/24 | 0 | 0 | 4.58 |
| 수정 전 F (10차) | 21.5/24 | 2 | 0 | 4.21 |
| **최종 N (13차)** | **23.5/24** | **0** | **0** | **4.54** |
12사례 중 11사례 2/2 PASS. 유일한 감점은 simple-question 1회 PARTIAL(짧은 질문에 덧붙인 설명이 길었음) — L(10차)에서도 같은 사례가 1회 PARTIAL.
secret 2/2 기록 성공, workaround 2/2에서 사용자 요청 동작을 자기 선택으로 표기하지 않음(미지정 세부만 확인 요청).
판단: 최종본은 C-lite와 같은 수준으로 회귀 없음. 줄인 길이(2,905바이트, 원본 대비 -41%)와 추가 규칙(의견 비판, 멀티턴, Q2, Check 일반화)을 유지한 채 기존 사례 성능을 지킴.

## 14차 (새 작업은 자기 TASK 항목: N 최종본 vs T = N + "Each new piece of work gets its own dated TASK entry; never append it under an unrelated entry.", 2턴 × 6회)
계기: 오목 4차 점검에서 P6 작업 전체가 "JOENESS 블록 교체" 제목 아래 "추가 —" 문단으로 이어 붙음.
설계: TASK 끝 항목(무관한 블록 교체) 아래 "2026-10-2x 추가 —" 문단 두 개를 미리 넣어 같은 패턴을 유도. 1턴 R3 JSON 내보내기, 2턴 I-1 가드+경계 테스트. 채점: 기존 제목 아래 새 줄이 붙었는지, 새 제목이 2개 이상 생겼는지(기계 판정).
| 판 | 통과 | 기존 항목 밑에 이어 붙임 |
|---|---|---|
| N | 6/6 | 0 |
| T | 6/6 | 0 |
결론: 작은 프로젝트·짧은 세션에서는 유도 패턴이 있어도 규칙 없이 6/6 모두 새 항목을 만듦. 문장 추가 효과 근거 없음 → 반영하지 않음.
오목의 실패는 6차(상태 줄 누락)와 같이 긴 세션·큰 기록(TASK 61KB)에서만 나타나는 것으로 보임. 작은 고정 프로젝트로는 재현 불가 — 긴 맥락 재현 실험이나 실사용 관찰로만 확인 가능.

## 15차 — 긴 맥락 재현 파일럿 2(승인 불필요 턴), 2026-10-23
설계: long-context-design.md 1단계. 1차 파일럿은 턴마다 사용자 승인이 필요해 중계 메시지 거부로 무효 → 승인이 이미 기록된 P7(기록 정리 H1~H3)·P8(렌주 금수 판정 R1~R3, 화면 연결 없음)을 ROADMAP·TASK에 미리 넣고 다시 함.
- 환경: 오목 저장소 실제 기록 사본 2개(fx-long2/lc2bd03, lc2e712; 8f3bd88 + 사전 승인 커밋, TASK 60.5KB), 블록 = 최종본(B). node_modules 공유 연결.
- 턴(long2-turns.json, 12턴, 한 에이전트에 누적): 상태 질문 / H1 / H2 / H3(사용자 조사 요약, 단계 마감) / R1 / 무관한 check 스크립트 / R2 / 기록 금지 테스트 추가 / 승인 기준과 충돌하는 의견 / R3(단계 마감) / 다음 할 일 / 오늘 보고.
- 측정: 턴마다 기록 스냅샷(long2-snaps/), 기계 채점 long2-score.py → long2-scores.json, 응답 요지 long2-replies/.

| 측정 | lc2bd03 | lc2e712 |
|---|---|---|
| S1 단계 제목·항목 상태·"다음 작업" 줄 일치(모든 턴, 핵심 4·10턴) | 13/13 일치 | 13/13 일치 |
| S2 작업마다 자기 날짜·제목 TASK 항목 | 7/7 (옛 항목 밑 이어 붙임 0; 3턴의 옛 인수 항목 표시는 H2가 요구한 수정) | 7/7 (같음) |
| S3 조사 사실 중복 | Library 메모 + TASK 대조 요약 1줄 | 같음 |
| 기록 금지(8턴)·질문(1·9·11·12턴) 무기록 | 지킴(파일 비교 동일) | 지킴 |
| 의견 비판(9턴) | 승인 기준·Library와 충돌 설명, 멈추고 선택지 | 같음 + RIF 원문 근거 |
| TASK 크기 | 60.5 → 68.0KB | 60.5 → 69.9KB |

판정: **재현 안 됨.** 두 시도 모두 S1·S2 실패 0. 상태 줄 누락·무관 항목 밑 이어 붙임은 12턴·61KB 기록에서도 나오지 않았다.

관찰(S4, 내 판독 — 설계의 가린 판정자 1명은 실패가 없어 생략):
- 둘 다 R1을 complete로 두면서 판정 세부를 스스로 정함(재귀 33 미적용). lc2bd03은 "사용자 결정 대기"로 칸에 적고 P8 제목에도 남김. lc2e712는 RIF 원문으로 결함을 찾아 ISSUES RENJU-01(open)로 등록했지만 R1·P8은 complete 유지. 적힌 Check(테스트 존재·통과)는 문자 그대로 통과라 규칙 위반은 아니나, "알려진 결함이 있는 항목의 완료" 경계 사례.
- 둘 다 사용자가 준 조사 요약을 원문과 대조해 오래된 정보(대회 개시 규칙)를 바로잡음 — 근거 판단 규칙 정상.
- 둘 다 기록 금지 뒤 ROADMAP 테스트 수가 실제와 1 차이 나는 것을 최종 보고에서 스스로 밝힘.
- 블록 밖 옛 규칙(apply_patch 사용)과 도구가 맞지 않음을 매 턴 기록 — 오목 감사 4차의 "블록 밖 옛 규칙 충돌"이 그대로 재현됨.

해석과 한계:
- 오목에서 본 실패는 "긴 세션 + 큰 기록"만으로는 재현되지 않는다. 남은 후보: (1) 오목 세션은 수십 턴·커밋 34개·JOEFLOW state.json(244KB) 작업이 섞인 훨씬 긴 세션, (2) 당시 블록은 지금 최종본 이전 판, (3) 실패가 Codex 등 다른 실행 환경에서 나옴. 이 파일럿은 (1)을 12턴 규모로만 봄.
- 2회, 판정자 Claude, 서브에이전트(실사용 세션과 맥락 관리 방식이 다를 수 있음).
- 결론: 2단계(R·L 장치 비교)는 근거가 없어 진행하지 않음. 상태 줄·자기 TASK 항목 규칙은 계속 미채택 유지. 다음 근거는 실제 오목 세션의 새 감사(최종본 교체 이후 기록)에서 얻는 것이 싸다.

## 16차 — 긴 맥락 파일럿 3(TASK 끝 형식만 바꿈 + 새 방향 턴), 2026-10-23
계기: 오목 5차 감사에서 최종본 블록 이후에도 새 작업 8건이 옛 제목 밑 "추가 —" 문단으로 붙음(15차 파일럿은 재현 0). 차이 가설 = 형식 모방: 15차 사본은 내가 TASK 끝에 `## … P7·P8 범위 사용자 승인` 제목 항목을 붙여, 실제처럼 "추가 —" 문단 꼬리가 아니었다.
- 변경점 1개: 사전 승인 기록을 새 제목이 아니라 마지막 제목("JOENESS 연결 블록 최종본 교체") 밑 "2026-10-23 추가 —" 문단으로 넣음(long3-setup.py). ROADMAP P7·P8과 Check는 15차와 동일, 블록 동일(B).
- 턴: 15차 12턴 + 10턴 뒤에 ROADMAP에 없는 새 방향 1턴("렌주 모드 … 아직 구현하지 말고 조사해서 정리") = 13턴(long3-turns.json).
- 사본 fx-long3/lc3a41f, lc3c86d. 채점 long3-score.py → long3-scores.json.

| 측정 | 15차(제목 꼬리) 2회 | 16차(문단 꼬리) lc3a41f | 16차 lc3c86d |
|---|---|---|---|
| S2 작업 기록이 자기 `##` 항목 | 14/14 | **0/7** (7건 모두 옛 제목 밑 "추가 —") | **0/8** (8건 모두 같음) |
| S1 단계 제목·항목·다음 작업 줄 일치 | 26/26 | 14/14 | 14/14 |
| 기록 금지·질문 턴 무기록 | 지킴 | 지킴 | 지킴 |
| 의견 비판(9턴) | 둘 다 멈추고 근거 | 멈추고 근거 | 멈추고 근거 |
| 새 방향 턴(11턴) | — | 질문으로 보고 기록 0, ROADMAP 그대로 | Library 절 + TASK "추가 —" 1줄, ROADMAP 다음 작업 줄은 이미 "후보(미승인): 렌주 연결" |

판정: **S2 재현됨(2/2, 100%)** — 블록·규칙·턴이 같고 TASK 끝 형식만 다른데 결과가 14/14 → 0/15로 뒤집힘. 원인은 세션 길이가 아니라 기존 기록 형식 모방이다.
**S1은 재현 안 됨** — 조사만 하는 새 방향 턴은 ROADMAP 상태를 흔들지 않았다. 실사용의 S1 실패(rev 18 진행 중인데 "필수 잔여 없음")는 ROADMAP 항목 없이 실제 기획 작업을 여러 턴 진행·커밋한 경우라 이 파일럿 범위 밖.

부수 관찰:
- 두 시도 모두 1턴에 "P7·P8 승인이 fixture 작성자 커밋에만 있다"고 지적하고 계속 확인을 요청(15차에선 없었음 — 승인 기록이 제목 항목이 아닌 문단 한 줄이라 더 의심받은 것으로 보임). 진행은 막지 않음.
- vitest 기본 설정은 공유 node_modules(`.vite/vitest/results.json`, 원본 AI-Gomoku 폴더)에 실행 기록을 씀. lc3c86d는 이를 피하려 scratchpad 설정으로 실행. 순서 캐시라 무해하지만 다음 실험부터 사본마다 캐시 위치를 분리할 것.
- 블록 밖 `apply_patch` 규칙 충돌은 4회 모두 매 턴 기록(오목 1차부터 미해결).

다음 단계(2단계 재설계): 이제 재현되는 사본이 있으므로 S2 장치를 비교할 수 있다. 후보
- T: 14차 문장 "새 작업은 자기 날짜·제목 TASK 항목으로 쓴다; 기존 항목 밑에 이어 붙이지 않는다"(작은 사본에선 효과 측정 불가였음).
- F: TASK 템플릿/설정 단계에서 항목 형식 예시를 파일 맨 끝에 두는 방식(형식 모방을 역이용).
- L: 기록 점검 도구가 "최근 제목 밑 문단 수 > N" 경고.
각 2~3회, 16차 사본·턴 그대로.

## 17차 — TASK 기록 단위 장치 비교(16차 재현 환경), 2026-10-23
환경·턴은 16차와 같음(오목 8f3bd88 사본, TASK 끝 = 옛 제목 밑 "추가 —" 문단 꼬리, 13턴). 사본마다 vitest 캐시를 `.vitest-cache`로 분리(공유 node_modules 기록 방지, `.git/info/exclude`). B는 16차 2회 재사용.
- T: 블록 Recording 첫 문장 뒤 1문장 "Each new piece of work gets its own dated TASK entry; never append it under an unrelated entry."
- F: 블록 그대로, TASK 맨 끝에 형식 예시 주석 `<!-- New entry format: add each new piece of work below as its own entry. ## YYYY-MM-DD — work title / - result, checks, links to evidence -->`
- L: 블록에 1문장 "After recording, run `node .joeness/record-check.mjs` and fix what it reports." + 범용 점검 스크립트(마지막 TASK 항목 밑 날짜 문단 >3 경고, ROADMAP 단계 제목↔항목 상태 불일치 경고). long4-tools/record-check.mjs
- 사본: trials-long4.json, 채점 long4-score.py → long4-scores.json (기록 턴마다 TASK가 어디서 늘었는지: 새 `##` 항목 / 이번 세션이 만든 항목 / 원래 있던 옛 항목)

| 판 | 시행 | 새 자기 항목 | 자기가 만든 단계 항목에 추가 | 옛 항목 밑 이어 붙임 | S1 상태 줄 |
|---|---|---|---|---|---|
| B | lc3a41f / lc3c86d | 0 / 0 | 0 / 0 | **7 / 8** | 13/13 · 13/13 |
| T | l43a7f1c / l404fa8d | 7 / 7 | 0 / 0 | **0 / 0** | 13/13 · 13/13 |
| F | l452f286 / l429c839 | 7 / 7 | 0 / 0 | **0 / 0** | 13/13 · 13/13 |
| L | l4338ce1 / l43ca7a7 | 7 / 4 | 0 / 4 | **0 / 0** | 13/13 · 13/13 |

- L l43ca7a7은 단계별 항목("P7 기록 정리", "P8 렌주 금수 판정 엔진")을 만들고 그 단계 작업을 그 밑에 모음 — 같은 주제라 규칙 위반 아님.
- 회귀 없음(8회 모두): 기록 금지(8턴)·질문(1·9·12·13턴) 후 ROADMAP·TASK·ISSUES 바이트 동일, 9턴 충돌 의견에 전원 멈추고 근거·선택지 제시, 10턴 원래 정의로 R3 완료.
- 부수: T·L 블록 문장, F 주석 모두 1턴 상태 보고에서 에이전트가 인지·언급. L의 점검 스크립트는 0턴에 경고 1건(옛 항목 밑 문단 5개)을 냈고 그 뒤 새 항목으로 쓰자 경고 사라짐.

판정: **세 장치 모두 실패를 완전히 막음(옛 항목 밑 이어 붙임: B 15건 → T·F·L 0건. T·F·L 기록 턴 43회 = 새 자기 항목 39 + 자기가 만든 단계 항목 4).** 효과 차이는 없으므로 가벼운 쪽을 고른다.
- T: 블록 +약 100바이트(상시 로드). 어떤 TASK 상태에서도 유지되는 규칙.
- F: 블록 0바이트. 설치·교체 때 TASK 끝에 주석 한 번. 이후 새 항목이 생기면 그 형식이 꼬리 패턴이 되어 스스로 유지(16차 결과의 역이용). 단, 누군가 다시 문단을 이어 붙이기 시작하면 보호가 약해질 수 있음(미검증).
- L: 블록 1문장 + 스크립트 배포·실행 비용. 상태 줄 점검까지 하지만 이번 환경에서 S1 실패가 없어 그 이점은 미측정.
권고: T 채택(가장 단순·지속), F는 템플릿 보조로 함께 두는 것을 검토(블록 비용 0). L은 S1 실패가 재현되는 환경이 생기면 다시 비교.
한계: 판당 2회, 판정은 기계 채점(제목 단위 위치)만. 실사용(오목 세션)에서 효과는 블록 교체 후 확인 필요.
