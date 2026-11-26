# JOENESS 2.0.2 — ROADMAP 리비전 줄 출력 스크립트 (2026-11-26)

ATELIER 실사용 마찰(검토 묶음 J)에서 나온 한 가지를 고친 판이다. `SKILL.md` 로드맵 절 두 문장과 `assets/ROADMAP.md` 한 줄, 새 스크립트 `scripts/revision-line.mjs`만 바뀌었고 연결문 `assets/AGENTS.md`·`project-setup.ps1`·검수 도구 4개는 2.0.1과 바이트 단위로 같다.

- 계기: ATELIER 실사용(JOENESS 2.0.1 + JOEFLOW + JOEDESIGN)의 마찰 기록 19번, 검토 묶음 J. JOEFLOW 승인·재진입 때마다 ROADMAP `Product revision / approval:` 줄을 `approval_status.py` 출력에서 손으로 옮겨 적었다(지금까지 7회). 사용자 확정(2026-11-26): 2.0.2는 묶음 J만. 기록 [evals/v2.0.2-tests-20261126/report-202.md](report-202.md).
- **바뀐 것**
  - 새 `skills/joeness-setup/scripts/revision-line.mjs`: `approval_status.py`가 찍은 JSON(stdin 또는 `--input <file>`)과 날짜(`--date YYYY-MM-DD`, 없으면 그 기계의 오늘)를 받아 `Product revision / approval: definition_revision N, approval_status S, approved_revision M, definition_status D (`approval_status.py`, read YYYY-MM-DD).` 한 줄만 찍는다. 파일은 고치지 않는다. `pending_revisions`가 비어 있지 않으면 괄호 안 `read` 앞에 `pending_revisions 24-25`(연속이면 범위, 하나면 그 번호)를 넣는다. `definition_revision`이 null이면 `none`. JSON이 아니거나 `error`를 담았거나 필드가 빠졌거나 값이 이상하면 stderr와 exit 2, stdout은 비운다. 진입 판정은 2.0.1 검수 도구와 같은 실제 경로 비교.
  - `SKILL.md` 로드맵 절: 기록하는 JOEFLOW 필드에 `definition_status`를 더하고(ATELIER 줄이 이미 쓰던 필드), 승인·재진입 뒤 그 스크립트를 돌리되 줄은 에이전트가 붙여 넣고 ROADMAP 편집은 에이전트 몫이라는 문장. `assets/ROADMAP.md` 리비전 줄 자리 설명에 같은 안내.
  - manifest: 파일 20개(새 스크립트), `SKILL.md`·`assets/ROADMAP.md` 해시, `release.version` 2.0.2. 설치기 파일 목록과 버전 핀, 테스트 버전 핀, CI node 명령에 새 테스트.
  - 연결문 `assets/AGENTS.md`·`project-setup.ps1`·검수 도구는 2.0.1과 바이트 단위로 같다.
- **세션이 대신 내린 결정**: SKILL.md에 미승인 리비전 표기 형식이 없어서 과업 지시대로 괄호 안 `pending_revisions N`을 썼고, N은 `approval_status.py`가 늘 연속 번호를 주므로 `24-25` 범위로 줄였다(연속이 아니면 `/`로 잇는다). 스크립트 이름 `revision-line.mjs`, Node(기존 검수 도구와 같은 관례, 의존성 없음). 기존 프로젝트의 ROADMAP은 건드리지 않는다(연결 자동 갱신 없음).
- **확인된 것**: ATELIER `approval_status.py` 출력(읽기 전용으로 받아 `project_file` 절대 경로를 상대 경로로 바꾼 fixture)으로 찍은 줄이 ATELIER `ROADMAP.md` 5행(2026-11-26)과 바이트 단위로 같다. 미승인 fixture는 ATELIER state 사본의 리비전을 25로 올려 같은 스크립트로 얻었다. Node 121/121, PowerShell 5.1 release·install·project-setup exit 0.
- **확인되지 않은 것**: PowerShell 7과 GitHub Windows CI(push 전). 실제 설치 폴더에서의 실행. 에이전트가 이 안내를 읽고 실제로 스크립트를 쓰는지(행동 시험 없음).


**업그레이드.** 2.0.1 개인 설치본에서 2.0.2 `-Check`는 `blocked`(`installedRelease` 2.0.1). 2.0.1 패키지로 `-Remove`한 뒤 2.0.2로 `-Apply`. 연결된 프로젝트는 연결문이 같아 갱신할 것이 없다. 기록: [report-202.md](report-202.md).
