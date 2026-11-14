## 1.4.1 — 통합 시험 결함 3건 (2026-11-15)

2026-11-12 세 도구 통합 시험(JOENESS 연결 → JOEFLOW 정의 → JOEDESIGN 구현·보고 → JOENESS 도장 소비)에서 나온 JOENESS 결함 3건을 고쳤다.
- `<joedesign>` 자리: 연결문(`assets/AGENTS.md`)·`SKILL.md`·`references/review-gate.md`는 커밋 파일에 `<joedesign>`을 글자 그대로 두고, 실행할 때 `JOEDESIGN_HOME` 또는 설치된 joedesign 스킬 폴더로 푼다. `project-setup.ps1 -Apply`는 드라이브 문자·UNC·사용자 홈 경로가 든 본문을 막고(`blocked`, 아무 파일도 쓰지 않음), `-Check`는 이미 적용된 블록의 그런 경로를 `warnings`로 알린다(상태 `current` 유지). 연결문 4,946바이트·793단어 → 5,148바이트·823단어.
- `assets/DESIGN.md`에 `## Rule coverage` 표: JOEDESIGN Rule Coverage 표의 앞 7열(Rule, Check, Spot check, Layouts, Sizes, States, Unmeasured) + `Result`(TASK 링크). DESIGN.md 하나·규칙 표 하나 규칙(JOEDESIGN 템플릿을 이미 쓰면 그 표에 Result 열을 더해 쓴다).
- `assets/ROADMAP.md`에 `Product revision / approval:` 줄: 제품 원본이 보고하는 revision·승인 상태·읽은 날짜(JOEFLOW면 `approval_status.py`의 `definition_revision`·`approval_status`·`approved_revision`), revision 기록이 없으면 `none`. JOENESS는 읽은 값을 적을 뿐 승인은 제품 원본이 소유한다.

**확인된 것.** 세 수정이 각각 별도 커밋이고 각 커밋 뒤 전체 테스트 실패 0(Node 104/104 → 106/106, PowerShell project-setup 27 → 28 cases, release·install 스위트 exit 0). 임시 git 저장소에서 기계 경로가 든 본문은 `-Apply blocked`로 파일을 쓰지 않았고, 배포 본문은 `-Apply current` 뒤 AGENTS.md에 `<joedesign>`이 글자 그대로 남았으며, DESIGN의 `## Rule coverage` 표 머리와 ROADMAP의 revision 줄이 실제 결과 문서에 들어갔다. JOENESS 표의 앞 7열은 JOEDESIGN `templates/DESIGN.md`의 Rule Coverage 머리와 같다.

**확인되지 않은 것.** 에이전트가 새 문구만 보고 실제로 `<joedesign>`을 풀어 쓰는지, JOEDESIGN 템플릿 프로젝트에서 표를 하나로 합치는지, ROADMAP에 revision을 채우는지는 행동 A/B 없이(유료 실행 0회) 게시한다. `approval_status.py`를 실제 state에 돌린 출력으로 ROADMAP 줄을 채워 보지 않았다. PowerShell 7 로컬 실행 없음(CI가 두 셸을 돈다). 기계 경로 탐지는 드라이브 문자·UNC·`/Users/`·`/home/`만 잡고 `~/`·상대 경로·환경 변수 확장 결과는 잡지 않는다. 기존 프로젝트 연결(예: AI 오목)은 자동 갱신하지 않으며 `-Check`가 경고를 낼 수 있다.

근거: `evals/joeness-setup/runs/2026-11-12-v141-candidate/report.md`, `docs/CHANGELOG.md`. 기존 프로젝트 연결은 자동으로 갱신하지 않는다.
