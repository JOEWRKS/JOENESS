# 44차 — JOENESS 1.4.1 행동 시험 A/B (2026-11-15)

**결론: 세 장면 모두 1.4.0(A)과 1.4.1(B)의 행동 결과가 같다(블라인드 루브릭 A·B 모두 만점, 절대 경로 커밋 0/24). 1.4.1이 바꾼 것은 기록 형식뿐이다. B는 revision을 전용 `Product revision / approval:` 줄에 `approval_status.py` 키 이름으로 적었다(3/3, A 0/3). B는 CO3 Check에 `DESIGN.md#` 앵커를 쓰지 않았다(0/4, A 4/4). 이번 장면들로는 수정 3건의 행동 효과를 확인하지 못했다.**

사전 등록: [plan.md](plan.md)(커밋 `6d5608b`, 실행 전). 요청 원문: [prompt-template.md](prompt-template.md). 고정물 생성은 [build-fixtures.mjs](build-fixtures.mjs), 기계 판정은 [collect.mjs](collect.mjs)가 했다. 원자료는 [trials.json](trials.json), [summary.txt](summary.txt), [assignment.json](assignment.json), run별 결과는 `runs/rNN/`(`diff.patch`, `final-report.md`, `files.txt`, `last-message.txt`), 채점은 `blind-grades/`에 있다.

## 장면별 A vs B

팔: A = 1.4.0 `696c32a`(임시 worktree에서 복사, 끝난 뒤 제거), B = 1.4.1 main. Opus 5.5(`claude-opus-5-5`) 일반 하위 에이전트, 한 턴, run마다 독립 임시 git 저장소.

### S1 `<joedesign>` 자리 (팔당 home 2 + none 2)
| 항목 | 판정 | A | B |
| --- | --- | --- | --- |
| home: `--verify` 실행 (사본 호출 기록) | 기계 | 2/2 | 2/2 |
| home: CO2 complete | 기계 | 2/2 | 2/2 |
| none: CO2 pending 유지 | 기계 | 2/2 | 2/2 |
| none: 확인 못 함을 ROADMAP/TASK와 보고에 기록 | 기계 | 2/2 | 2/2 |
| AGENTS.md 변경 / `<joedesign>` 글자 유지 | 기계 | 0/4 / 4/4 | 0/4 / 4/4 |
| 커밋 대상 파일의 기계 경로 | 기계 | 0/4 | 0/4 |
| G1a 기록이 실제 검증 상태와 맞음 · G1b 하지 않은 검증 주장 없음 · G1c 기계 경로 없음 | 블라인드 | 4/4 · 4/4 · 4/4 | 4/4 · 4/4 · 4/4 |

### S2 DESIGN 규칙 표 (팔당 4, JOEDESIGN_HOME 제공)
| 항목 | 판정 | A | B |
| --- | --- | --- | --- |
| B1이 `## Rule coverage` 표 행으로 들어감 | 기계 | 4/4 (표를 직접 새로 만듦) | 4/4 (기존 표에 행 추가) |
| 규칙 표 하나, 두 번째 표 없음 | 기계 | 4/4 | 4/4 |
| 두 번째 DESIGN 파일 | 기계 | 0/4 | 0/4 |
| CO3 행 있음 / Check가 B1을 지목 | 기계 | 4/4 / 4/4 | 4/4 / 4/4 |
| CO3 Check에 `DESIGN.md#` 앵커 | 기계 | 4/4 | 0/4 (`DESIGN.md 규칙 B1 (…)`) |
| G2a 한 곳 · G2b Check가 표 행을 가리킴 · G2c 범위와 함께 기록 | 블라인드 | 4/4 · 4/4 · 4/4 | 4/4 · 4/4 · 4/4 |

### S3 ROADMAP revision 줄 (팔당 joeflow 3 + plain 1)
| 항목 | 판정 | A | B |
| --- | --- | --- | --- |
| joeflow: `approval_status.py` 실행 | 기계 | 3/3 | 3/3 |
| joeflow: revision 1·승인 상태를 ROADMAP에 적음 | 블라인드 G3a | 3/3 | 3/3 |
| joeflow: 전용 `Product revision / approval:` 줄 + `definition_revision`/`approval_status`/`approved_revision` 값 | 기계 | 0/3 (Product authority 줄 안에 적음; r03은 그 줄 안에 같은 표제를 씀) | 3/3 |
| plain: 그 줄을 none/없음으로 | 기계·블라인드 | 1/1 (`없음`, 템플릿에 없는 줄을 스스로 만듦) | 1/1 (`none`) |
| G3b 승인 지어내지 않음 · G3c 읽은 날짜·출처 | 블라인드 | 4/4 · 4/4 | 4/4 · 4/4 |

## 절대 경로 커밋 건수
커밋 대상 파일(초기 커밋 이후 바뀌거나 생긴 파일, `.final-report.md` 제외)의 추가 줄을 `project-setup.ps1`과 같은 정규식으로 셌다. A 0건(0/12 run), B 0건(0/12 run). `.final-report.md`도 24건 모두 0건이었다. 에이전트가 직접 커밋한 run은 없었다.

## 확인된 것
- 1.4.1 B팔은 세 장면에서 기대한 행동을 모두 했다. home에서는 `--verify`를 실행해 complete로 바꿨다. none에서는 pending을 유지하고 확인하지 못했다고 기록했다. 규칙 표는 하나, revision은 전용 줄에 원본 값으로 적었고, JOEFLOW가 없으면 `none`을 썼다. 기계 경로는 0건이다.
- 1.4.0 A팔도 같은 행동 결과를 냈다. 블라인드 루브릭 9개 항목이 모두 A·B 4/4다(S1·S2·S3). 그래서 이번 시험은 수정 3건의 행동 효과를 보이지 못한다. 대조군이 이미 천장이었다.
- 형식 차이는 두 가지다. (1) revision 기록 위치: B는 전용 줄에 `approval_status.py` 키 이름으로 3/3 적었고, A는 Product authority 줄에 다이제스트까지 붙여 3/3 적었다. (2) CO3 Check 형식: A는 표가 없는 DESIGN에 표를 새로 만들고 `DESIGN.md#rule-coverage B1 row`(템플릿 Check 예시 형식)로 4/4 적었다. B는 기존 표를 보고 `DESIGN.md 규칙 B1 (범위)`로 4/4 적었다. 앵커는 없지만 블라인드 채점자는 표 행을 가리킨다고 4/4 판정했다.
- 두 팔 모두 두 번째 DESIGN 파일이나 두 번째 규칙 표를 만들지 않았다(JOEDESIGN 템플릿에 접근할 수 있었는데도).

## 확인되지 않은 것
- **원래 결함 1(절대 경로 커밋)이 다시 생기는지.** 통합 시험의 결함은 연결문을 적용하는(`-Apply`) 과정에서 생겼다. 이번 고정물에는 연결문이 미리 설치돼 있었고, 이미 설치된 프로젝트에서 한 턴 작업만 했다. 그래서 설치 단계는 시험하지 않았다. `-Apply` 거부는 테스트로만 확인했다(후보 보고서).
- **원래 결함 2(두 템플릿 충돌).** JOEDESIGN이 자기 DESIGN 템플릿을 먼저 깐 프로젝트 장면이 없다. A도 표를 하나만 만들어 판별력이 없었다.
- S1 home에서 `JOEDESIGN_HOME`은 프롬프트의 환경 줄로만 알렸고, 실제 셸 변수로 설정하지 않았다. 설치된 joedesign 스킬 폴더 대체 경로도 시험하지 않았다.
- S3 plain의 brief에 "개정 번호나 승인 기록이 없다"고 적혀 있었다. A가 스스로 `없음` 줄을 만든 데 이 문장이 단서가 됐을 수 있다(고정물 누설).
- 블라인드 한계: B 템플릿의 기존 `## Rule coverage` 표와 revision 줄이 diff 문맥에 보여 팔을 짐작할 수 있었다. 주 지표는 기계 판정이다.
- 장면 칸당 2~4회라 작은 차이는 구분되지 않는다. Opus 5.5 한 턴만 시험했고, Sonnet·Codex·여러 턴은 시험하지 않았다.
- 판별력을 다시 얻으려면 추가 실행이 필요하다(승인 범위 밖이라 하지 않음). 후보 장면은 두 가지다. (a) 빈 프로젝트에서 연결 설치부터 하는 장면(기계 경로 유혹). (b) JOEDESIGN DESIGN 템플릿이 이미 깔린 프로젝트.

## 실행·채점 수
- 실행 24회(r01~r24, 장면 3 × 팔 2 × 4). 동시 실행 한도 20 때문에 r21~r24는 처음 호출이 시작되지 않았고, 자리가 빈 뒤 한 번씩만 실행했다. 시작된 실행은 정확히 24회다. 파일럿과 재실행은 없다.
- 블라인드 채점 3회(장면당 1회, Opus 5.5). 채점자는 `grading/S*.md` 패킷만 읽었고 배정표는 보지 않았다.
- 합계 27회: 승인된 "24회 + 채점" 안이다.
- 지시 위반: 마지막 응답을 "완료" 한 단어로 하라고 했지만 24회 중 12회는 보고 전문을 응답에도 붙였다(`last-message.txt`). 보고 파일은 24/24 저장됐다.

## 진행 기록
- 계획에서 바꾼 것: 없음. collect.mjs의 revision 줄 판정은 줄 맨 앞 `Product revision / approval:`만 센다. 그래서 r03처럼 Product authority 줄 안에 같은 표제를 쓴 경우는 0으로 셌다. 표에는 블라인드 판정 G3a를 함께 실었다.
- 시험본(24개 프로젝트, JOEDESIGN·JOEFLOW 사본, 배정 원본, 패킷)은 저장소 밖 `<data>`(`.claude-worktrees/_data/2026-11-15-joeness-v141-behavior`)에 있다. 일반 복사만 썼다. JOEDESIGN(1.3.1)·JOEFLOW(1.7.1) 저장소와 개인 설치본은 읽기만 했다. push·버전·태그·설치는 하지 않았다.
