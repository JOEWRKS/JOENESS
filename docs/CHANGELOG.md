# 변경 이력

## 1.4.1 — 통합 시험 결함 3건 (2026-11-15)

- 계기: 2026-11-12 JOEFLOW 1.7.0 통합 시험(JOENESS 연결 → JOEFLOW 정의 → JOEDESIGN 구현·보고 → 도장 소비)에서 나온 JOENESS 결함 3건.
- `<joedesign>` 자리: 연결문·SKILL.md·review-gate.md에 "커밋 파일에는 글자 그대로, 실행할 때 `JOEDESIGN_HOME` 또는 설치된 joedesign 스킬 폴더로 푼다". `project-setup.ps1 -Apply`는 드라이브·UNC·사용자 홈 경로가 든 본문을 막고, `-Check`는 기존 블록의 그런 경로를 `warnings`로 알린다(차단 아님). 연결문 4,946바이트·793단어 → 5,148바이트·823단어.
- `assets/DESIGN.md`에 `## Rule coverage` 표(JOEDESIGN Rule Coverage 7열 + Result 링크). DESIGN.md 하나·규칙 표 하나 규칙(JOEDESIGN 템플릿을 쓰면 그 표에 Result 열 추가).
- `assets/ROADMAP.md`에 `Product revision / approval:` 줄(JOEFLOW면 `approval_status.py`의 `definition_revision`·`approval_status`·`approved_revision`, revision 기록이 없으면 `none`).
- [후보 보고서](../evals/joeness-setup/runs/2026-11-12-v141-candidate/report.md): 테스트 1.4.0 104/104 → 후보 106/106(+ PowerShell 28 cases), 행동 A/B 없음. 사용자 승인("게시하고 2번 ㄱ", 2026-11-14)으로 게시. [소스·main·개인 설치·게시 상태](../evals/joeness-setup/runs/2026-11-15-v141-release/review-evidence.md).

## 1.4.0 — JOEDESIGN 보고 도장 소비와 Check 칸 예시 (2026-11-10)

- JOEDESIGN 제안서(`docs/proposals/2026-11-09-joeness-report-stamp.md`) 반영. `SKILL.md`: 도장 줄 기록, ROADMAP 항목을 complete로 바꾸기 전 `report-check.mjs --verify` 종료코드 0 확인, Node·스크립트가 없으면 "could not verify"로 적고 완료를 선언하지 않음, `changed` 수정은 해결이 아니라 남은 문제, Check 칸은 규칙 표의 행을 가리킴. `assets/TASK.md`: `Report stamp:` 줄. `assets/ROADMAP.md`: Check 예시 한 줄. `references/review-gate.md`: 게이트 없는 경우의 도장 소비 절. 스크립트·스키마·계약은 그대로. 새 스크립트·새 장부 없음, review-gate 대체 아님.
- [검증 근거](../evals/joeness-setup/runs/2026-11-09-report-stamp-ab/report.md) 43차: Opus 5.5 한 턴, 3개 팔(1.3.0 / 네 파일 / 네 파일 + 연결문 3문장) × 4장면 × 3회 = 36회. 도장을 TASK에 복사 0/9 · 3/9 · 9/9, TASK `Report stamp:` 칸 0/9 · 6/9 · 9/9, 새 Check가 표 행을 가리킴 0/3 · 3/3 · 3/3. `--verify` 실행(8/9 · 9/9 · 9/9), 어긋난 도장 pending(세 팔 3/3), `changed` 남은 문제 이동(세 팔 3/3)은 대조군도 천장이라 문구 효과를 보이지 못함. 사용자 승인("둘 다 승인", 2026-11-10)으로 C팔 연결문(`assets/AGENTS.md`) 3문장도 넣음: Done에 저장된 JOEDESIGN 보고는 `--verify` 종료코드 0 전에 완료 불가, 기록에 도장 줄 복사와 Check 칸은 규칙 표 행, 보고의 해결 정의에 `changed`는 남은 문제. 4,425바이트·711단어 → 4,946바이트·793단어. 시험한 C 본문과 바이트 일치.
- [소스·main·개인 설치·게시 상태](../evals/joeness-setup/runs/2026-11-10-v140-release/review-evidence.md): main `696c32a` Windows CI 성공, 게시 [JOENESS-v1.4.0](https://github.com/JOEWRKS/JOENESS/releases/tag/JOENESS-v1.4.0)(2026-11-10), Codex 개인 설치 1.4.0 갱신(백업·바이트 대조·대표 검사 통과), Claude Code 클론 갱신. 기존 프로젝트 연결은 자동 갱신하지 않음.

## 1.3.0 — 검사 범위 규칙 (2026-11-03)

- 연결문(`assets/AGENTS.md`)에 세 문장 추가. Done: 규칙 통과를 적기 전에 검사가 실제로 잰 것(화면·배치·크기·상태)을 규칙이 덮는 범위와 대조하고, 검사가 안 잰 것은 미검증이며 기록에 그 이름을 적는다. 근거: 검사 결과는 범위(무엇이 어디서 돌았는지)와 함께여야 근거다. 재검사: 변경 뒤에는 바뀐 파일이 건드리는 규칙·대상을 모두 다시 잰다. 4,021바이트·657단어 → 4,425바이트·724단어. 나머지 스킬 파일 불변, manifest의 연결문 해시만 갱신.
- 계기: AI 오목에서 실측 검사가 세로 배치 간격만 재는데 "간격 위반 0"을 옆 배치 규칙 준수로 보고한 일(2026-10-31~11-01).
- [검증 근거](../evals/joeness-setup/runs/2026-11-02-check-scope-ab/report.md) 42차: 오목 실제 기록 사본, Opus 5.5·Sonnet 5.5, 장면 6 × 판 2~3 × 8회 = 96회, 블라인드 채점. 정의형 문장(B)은 효과 없음(16회, A와 같음). 행동형 문장(B2)은 완료 기록에 검사 밖 미측정 대상을 열거하게 함(7/8 대 0/8). 숨은 구멍(옆 배치 미측정) 자체는 질문 장면에서만 3/8 대 0/8로 드물게 찾음. 대조군·변경 장면은 세 판 모두 천장, 불필요한 질문 0. 오프라인(브라우저 불가) 조건의 한정 근거.
- 실전 확인: AI 오목 프로젝트에 적용해 실제 작업 3턴(수정·검사 확대·작은 변경)을 보았고 기준 4개(범위 기록, 범위 없는 주장 없음, 변경 뒤 재측정, 불필요한 멈춤 없음)를 모두 지켰다([live-check](../evals/joeness-setup/runs/2026-11-02-check-scope-ab/live-check.md)).
- [소스·main·개인 설치·게시 상태](../evals/joeness-setup/runs/2026-11-03-v130-release/review-evidence.md).

## 1.2.0 — 턴 사이 변경 알림 hook (선택, 2026-10-30)

- 셋업이 Claude Code를 쓰는 Git 프로젝트에 선택 항목으로 제안하는 hook 추가: `scripts/changes-hook.mjs`, `references/changes-hook.md`. 사용자가 승인한 경우에만 프로젝트의 `.claude/hooks/`와 `.claude/settings.json`에 넣고, 셋업 완료의 필수 조건은 아님. SKILL.md(제안·분리 두 줄)와 usage.md(안내 한 줄) 수정. 연결문(`assets/AGENTS.md`)과 나머지 14개 스킬 파일은 불변. 스킬 파일 17 → 19개.
- 동작: 사용자 메시지마다 에이전트의 직전 턴이 끝난 뒤 들어온 커밋과 바뀐 파일을 알리고, 그 파일을 다룬 앞 턴 검사는 낡았다고 덧붙임. Stop 때 HEAD를 기록해 에이전트 자신의 커밋은 알리지 않음. 첫 메시지·HEAD 변화 없음·Git 아님이면 출력 없음. Codex에서는 동작하지 않음.
- [검증 근거](../evals/joeness-setup/runs/2026-10-30-followup-hook-ab/report.md) 41차: 알리지 않은 팀원 커밋 뒤 "완료로 기록해 줘". 새 커밋 발견·재검사 hook 10/10 대 없음 0/4(서브에이전트, 주입 모사), 실제 Claude Code CLI 2턴 A/B 5/5 대 0/5, 결함 상태 완료 0/5 대 1/5. 커밋 없는 대조군은 출력 없음. 40차에서 문장 보강은 2/10.
- 자기 커밋 제외(Stop 기록)와 알림 문구 "since your previous turn ended"는 41차 이후 바뀐 부분으로, `tests/joeness-changes-hook.tests.mjs` 5건과 실제 Claude Code CLI 2턴 1회로 확인(1턴 에이전트 자기 커밋 635038b는 빠지고, 턴 사이 팀원 커밋 e08cd32만 알림).
- [소스·main·개인 설치 상태](../evals/joeness-setup/runs/2026-10-30-v120-release/review-evidence.md): main `021a220` Windows CI 성공, 개인 설치 1.2.0 갱신 완료(2026-10-30). 게시 [JOENESS-v1.2.0](https://github.com/JOEWRKS/JOENESS/releases/tag/JOENESS-v1.2.0)(태그 대상 `8f9db3f`, Windows CI 41049458119 성공, 2026-10-30). 1.1.1은 따로 게시하지 않고 1.2.0에 포함. 기존 프로젝트 연결은 자동 갱신하지 않음.

## 1.1.1 — 승인 범위 규칙 (2026-10-29)

- 연결문(`assets/AGENTS.md`)에 승인 범위 규칙 한 줄 추가: 사용자 요청은 그 요청이 말한 것만 승인한다. "완료로 기록해 줘"·"닫아 줘"·"다음으로" 같은 요청은 그 안에 남은 결정(아무도 승인하지 않은 보이는 변경, 작업자가 고른 방식·형식, 아직 못 채운 닫힘 조건)을 승인하지 않는다. 완료로 적기 전에 묻거나 항목을 열어 두고 남은 것을 말하며, 사용자가 말하지 않은 결정을 사용자 결정으로 적지 않는다. 3,586바이트·568단어 → 4,021바이트·657단어. 나머지 16개 스킬 파일 불변.
- [검증 근거](../evals/joeness-setup/runs/2026-10-29-approval-scope-ab/report.md) 38차: Opus 5.5 high·medium, 장면 3종 × 판당 10회. 남은 결정을 사용자 승인으로 추정해 기록한 경우 1.1.0 7/30 → 1.1.1 0/30(피셔 양측 p≈0.01). 승인이 실제로 있는 대조군에서는 1.1.0 10/10, 1.1.1 9/10 완료(1회 과잉 확인). 단일 턴·Opus만의 한정 근거.
- 같은 보고서의 Codex(gpt-6-astra/xhigh) 확인: 38차 장면 3종 × 판당 3회에서 추정 기록 1.1.0 6/6 → 1.1.1 0/6, 실제 승인 대조군은 두 판 모두 3/3 완료. 39차(결정이 대화 속에만 있는 3턴 세션)에서도 1.1.1 추정 기록 0/10.
- 40차(앞 턴 근거 재사용)는 약점이 재현됐지만(1.1.1에서 새 커밋 발견 0/10) 보강 문장 두 가지가 2/10에 그쳐 넣지 않음. hook 후보로 ROADMAP R4·R11에 기록.
- 같은 보고서의 36·37차(확인 주장 규칙, 25턴 장기 세션 판당 4세션 맹검 채점)는 천장 효과·작은 차이로 넣지 않음.
- [소스·개인 설치 상태](../evals/joeness-setup/runs/2026-10-29-v111-release/review-evidence.md): 개인 설치 1.1.1 갱신 완료(2026-10-29). QA 배포는 아직 하지 않음. 기존 프로젝트 연결은 자동 갱신하지 않음.

## 1.1.0 — 경량 연결문과 기록 규칙 보강 (2026-10-24)

- 연결문(`assets/AGENTS.md`)을 경량판으로 다시 씀: 4,907바이트·649단어·64줄 → 3,586바이트·568단어·46줄. 문서 소유권·읽기 범위·승인 권한·Done·기록·보고 규칙은 유지.
- 새 규칙 일곱 가지: 사용자 의견도 근거로 판단하고 틀려 보이면 이유를 말한 뒤 확인, 후속 턴에도 첫 턴과 같은 규칙과 기록·보고, 스스로 고른 사용자 가시 동작은 소유자 확인 전까지 verification pending(사용자가 요청한 동작은 제외), 새 작업마다 자기 날짜 TASK 항목, 항목 상태가 바뀌면 ROADMAP 현재·다음 줄을 다시 씀, 새 TASK 항목은 약 10줄로 쓰고 다른 기록·이전 항목에 이미 있는 내용은 복사하지 않음, TASK가 약 40KB를 넘으면 끝난 항목을 TASK-archive.md로 옮기자고 세션당 한 번만 제안하고 사용자 동의 뒤에만 옮김.
- [TASK 크기 규칙 근거](../evals/joeness-setup/runs/2026-10-24-task-size-ab/report.md): 실제 프로젝트 기록 사본 네 곳에서 Claude A/B 22~29차, Codex(gpt-6-astra/xhigh) 짧은 확인 30차. 항목 길이 규칙은 새로 쓰는 양 −20~−29%. 보관 제안은 40KB를 넘은 직후 제안하고 승인 전 이동 0, 승인 뒤 보관 시 분실·깨진 링크 0. 긴 세션 재언급은 줄었으나 0은 아님. Codex에서도 항목 길이 −31~−35%, 큰 TASK 첫 턴 제안 2/2, 오탐·승인 전 이동 0(2턴 확인). 판당 2~6회의 한정 근거.
- `assets/ROADMAP.md`에 상태어 범례 한 줄, `SKILL.md`의 연결문 적용 안내에 블록 밖 충돌 규칙·필수 Check 누락 표시 추가. 나머지 14개 스킬 파일 불변.
- [검증 근거](../evals/joeness-setup/runs/2026-10-23-light-block-ab/report.md): Claude A/B 1~19차(오목 실제 기록 사본의 긴 맥락 재현 포함), Codex(gpt-6-astra/xhigh) 확인 20·21차. Codex에서는 두 기록 규칙의 추가 효과가 없었고 회귀도 없었음. 후속 턴 규칙은 31차 긴 세션 8턴 맹검 A/B에서 뺐을 때 5~8턴 점수 96%→89%, 실패 세션 0/6→4/6(앞 4턴은 차이 없음). 판당 2~6회의 한정 근거.
- [소스·개인 설치·배포 상태](../evals/joeness-setup/runs/2026-10-24-v110-release/review-evidence.md). 기존 프로젝트 연결은 자동 갱신하지 않음.

## 1.0.2 — 작업자 방법과 필수 요건 구분 (2026-10-18)

- 기존 연결문의 네 줄 교체. 승인된 결과·순서·필수 조건은 유지하고 작업자가 선택한 방법은 명시적인 요구가 아니면 교체 가능하도록 명확화.
- 새 규칙 절·승인 절차 없음. 연결문664단어·65줄 유지, 나머지16개 스킬 파일·F01–F06 동작 불변.
- [검증 근거](../evals/joeness-setup/runs/2026-10-18-method-boundary/review-evidence.md). 두 사례의 경계 확인이며 일반 창의성 향상·장기 재발 방지의 증명은 아님.
- [소스·개인 설치·QA 배포 상태](../evals/joeness-setup/runs/2026-10-18-v102-release/review-evidence.md). 기존 태그·실제 프로젝트 연결 보존.

## 1.0.1 — 선택형 검사 조건 보강 (2026-10-17)

- 검증한 연결문 후보를 제품 서식에 반영. 명시적으로 연결된 필수 검사만 실행 대상으로 제한; 미설정 도구를 새 필수 작업으로 생성하지 않음.
- 실제 필수 검사의 누락·실패·오래된 결과는 계속 미완료. 판단·검사 스크립트와 나머지 16개 스킬 파일 유지.
- 사용자 승인 후 수정판 1.0.1로 소스·설치기 버전 통일. 기존 1.0.0 태그 보존. 개인 설치 갱신과 QA의 main·태그·Release 발행은 [별도 상태 기록](../evals/joeness-setup/runs/2026-10-17-v101-release/review-evidence.md)으로 확인. 실제 프로젝트 연결 자동 변경 없음.
- [제품 반영·검증 근거](../evals/joeness-setup/runs/2026-10-17-operating-rule-transfer/promotion-evidence.md).

## 1.0.0 (2026-10-13)

- 제품 버전·설치기·manifest를 1.0.0으로 통일. 검증된 F01–F06 연결 보강을 유지하고 공통 사용 안내 정리.
- README를 역할·사용 시점·시작법·결과·도구 간 인계·주의사항의 여섯 절로 정리. 상세 설치·복구 안내 분리.
- 공개 스킬 `joeness-setup`, manifest schema3, 설치 상태 schema1, 기존 helper 계약과 17개 skill 파일은 유지. 제품 버전과 데이터 규격 버전은 별개.
- 소스 게시 뒤 별도 승인으로 개인 설치1.0.0 전환·검증 완료. 태그·GitHub Release는 QA 담당의 공동 설치검증 후 발행 단계입니다. [소스 검증·게시](../evals/joeness-setup/runs/2026-10-13-v100-candidate/review-evidence.md), [개인 설치](../evals/joeness-setup/runs/2026-10-13-v100-personal/review-evidence.md).

## 0.3.4 및 후속 검증 후보

- 외부 검증의 누락·실패·오래된 근거 차단. 구현·기술 검사·시각 검사·사용자 수락 구분.
- 민감정보 기록 경계, 병렬 기록의 통합 책임 명시. 전역 판단 Core 없이 선택한 항목에만 검사 연결.
- 후속 후보: 현재/과거 기록과 납품 범위 구분, JOEFLOW 실행 결과 소비, 명시적으로 검토한 디자인 변경의 제한적 검사 재사용.
- [0.3.4 출시](../evals/joeness-setup/runs/2026-10-10-v034-release/review-evidence.md), [후속 후보·개인 설치](../evals/joeness-setup/runs/2026-10-13-impact-review/review-evidence.md). 후속 후보를 기존 출시 태그와 혼동하지 않습니다.

## 0.3.3

- 승인 후 표준 ROADMAP과 다섯 문서로 업무 정리. 제품·승인·과거 근거 보존.
- 주제별 Library와 문서 소유권, 여섯 항목 선요약. 효과가 불충분한 별도 축약 실험안은 제외.
- GEO 새 채팅 검증은 Astra/high 한정. xhigh·장기 안정성 증명 아님. 긴 상세와 인계 누락은 한계로 보존.
- [출시 기록](../evals/joeness-setup/runs/2026-10-06-v033-release/review-evidence.md).

## 0.3.2

- 문서별 담당 정보와 갱신 책임 명시. 작업 뒤 결과와 영향받은 로드맵 상태·다음 작업을 함께 갱신.
- 핵심 근거·미완·승인은 보존하고 상세 중복은 링크로 대체. 기존 문서 재편은 승인 후 진행.
- [출시 기록](../evals/joeness-setup/runs/2026-10-05-v032-release/review-evidence.md).

## 0.3.1 및 이전

- 작은 로드맵 기본 제안, 단계 진입·완료 조건과 독립 검증 항목 구분, 변경·미검증 범위만 재검사.
- 당시의 기존 계획 재사용 방식은 후속 표준 문서 정리 방식으로 변경됐습니다.
- 이전 버전의 정확한 소스는 Git 태그·이력, 검증·한계는 [개발 로드맵](ROADMAP.md)에 보존합니다. setup-only 구성과 사용자 수락 분리는 유지합니다.
