# JOENESS 2.0 사전 조사 (읽기 전용, 2026-11-19)

기준: `main` @ `e70e9dc` (1.4.2). 이 파일 말고는 아무것도 바꾸지 않았다. 표기: 홈 경로 → `~`, Windows 사용자 이름 → `<user>`, gmail 주소 → `<email>`, 커밋 작성자 실명 → `<realname>`.

## 결론

1. 에이전트가 읽는 묶음은 스킬 폴더 19개 파일(147 KB)과 설치 경로(`JOENESS.ps1` → `scripts/sync-harness.ps1` → `vendor/source-manifest.json`)뿐이다. **스킬 폴더 안에는 버전 문자열이 하나도 없다.** 그래서 2.0으로 버전을 올려도 스킬 폴더 해시는 그대로 둘 수 있다. 바꿀 곳은 manifest, 설치 스크립트, 테스트 2개, README, 문서다.
2. 프로젝트 `-Check`는 블록을 그 프로젝트에 마지막으로 적용한 상태와만 비교하고, 패키지 asset과는 비교하지 않는다. 그래서 버전을 올려도 연결된 프로젝트가 outdated로 표시되지 **않는다**. 반대로 개인 설치는 버전과 manifest 해시가 다르면 `blocked`가 된다. 1.4.2 → 2.0은 이전 패키지로 `-Remove`한 뒤 새 패키지로 `-Apply`해야만 넘어간다.
3. 보안: 진짜 비밀값은 트리와 이력(744커밋) 어디에서도 찾지 못했다. 나온 것은 합성 시험값뿐이다. 개인 식별자는 트리 기준 `<user>` 216개 파일 2,495회, `AppData` 156개 파일 1,457회, `C:/Users` 93개 파일 799회가 남아 있다. 대부분 11-03 이전 evals 기록이고, 기록 밖에는 docs 2개 파일뿐이다. 커밋 작성자 메타데이터 738건에 `<email>`이, 96건에 `<realname>`이 들어 있다.
4. 삭제 후보(d)는 4개다. 2026-09 초기 설계 초안 `docs/superpowers` 계획·명세 두 쌍이다. 나머지 1,546개 evals 파일은 기록이다. 그런데 run 폴더 101개 중 68개를 사람용 문서가 링크하고 있고, 테스트는 루트 이름 목록과 `evals/experiments` 파일 이름을 고정해 둔다. 그래서 archive 이동은 링크 재작성과 함께 해야 하고, 위치는 `evals/` 아래로 해야 한다.
5. README는 233줄이고 영어·한국어 두 벌이다. Quickstart 다섯 단계 중 세 단계에 문서 공백이 있다. Claude Code 설치 방법, 버전 업그레이드 시 `blocked`, 프로젝트 연결 갱신·해제를 사용자가 직접 실행할 명령이다.

## 1. 인벤토리

추적 파일은 1,594개다. 추적되지 않은 파일과 무시된 파일은 없다(`git status --porcelain --ignored`가 비어 있음). `.gitignore`에는 `__pycache__/`, `*.py[cod]`, `.worktrees/`가 있고 셋 다 현재 없다.

| 묶음 | 경로 | 파일 수 | 크기 |
|---|---|---:|---:|
| (a) 에이전트·설치기가 실행 중에 읽음 | `skills/joeness-setup/**` (SKILL.md, agents/openai.yaml, assets 5, references 6, scripts 6) | 19 | 146,872 B |
| (a) 설치 경로 | `JOENESS.ps1`, `scripts/sync-harness.ps1`, `vendor/source-manifest.json` | 3 | 17,150 B |
| (b) 사람이 읽음 | `README.md`, `AGENTS.md`, `docs/CHANGELOG.md`, `docs/ROADMAP.md`, `docs/installation.md`, `docs/superpowers/**`(6) | 11 | 213,644 B |
| 시험·CI (게이트) | `tests/*`(10), `fixtures/joeness-setup/*`(2), `.github/workflows/windows-ci.yml`, `.gitattributes`, `.gitignore` | 15 | 약 138 KB |
| (c) 기록 | `evals/joeness-setup/runs/` (run 폴더 100개 + 단독 md 1개) | 1,523 | 약 17.3 MB |
| (c) 기록 | `evals/joeness-setup/fixtures/` (reading-shelf-v1, workshop-slots-v1; 옛 run에서만 참조) | 19 | 5,700 B |
| (c) 기록 | `evals/experiments/` (테스트가 이름을 고정) | 4 | 63,746 B |

evals 세부 정보:

- 확장자별 파일 수: md 624, json 459, txt 167, mjs 116, patch 55, py 45, log 24, png 20 (4.56 MB), bundle 6 (138 KB), cs 8, xml 7, ps1 5, sh 1.
- 1.0 이전(2026-10-13 전) run: 610개 파일, 7.83 MB.
- 큰 폴더: `2026-09-28-interaction-performance-ab` 4.88 MB(png 중심), `2026-10-23-light-block-ab` 2.75 MB(312개 파일), `2026-10-17-rule-accumulation` 1.77 MB, `2026-10-13-impact-review` 1.14 MB, `2026-10-07-neutral-integration` 1.01 MB.
- 내용이 똑같은 사본은 50쌍에 남는 사본 131개다. 거의 전부 run마다 결과가 같았던 것(`last-message.txt`, `files.txt`, `final-docs/*`)이라 기록으로서 의미가 있다. 순수 중복으로 볼 만한 것은 `2026-10-17-v101-release/run-gates.mjs` = `2026-10-18-v102-release/run-gates.mjs`, 그리고 `prompt-template.md`(v141-ab2 = v142-ab) 정도다.
- run 안의 스크립트 중 79개는 다른 어떤 파일도 이름을 언급하지 않는다(light-block-ab 46개 등). 기록의 일부이므로 (d)에서는 뺐다.

### (d) 아무도 참조하지 않고 기록도 아닌 파일 — 삭제·보관 후보 4개

| 파일 | 근거 (`git grep -lF <이름> HEAD`) |
|---|---|
| `docs/superpowers/plans/2026-09-26-joeness-0.2-project-setup.md` | 참조하는 곳은 짝인 spec뿐이다(서로만 참조). 0.2 시절 초안이다. |
| `docs/superpowers/specs/2026-09-26-joeness-0.2-project-setup-design.md` | 참조하는 곳은 짝인 plan뿐이다. |
| `docs/superpowers/plans/2026-09-29-joeness-setup-only-distribution.md` | 자기 자신 말고 결과가 없다. `<user>`와 `C:\Users` 경로가 들어 있다. |
| `docs/superpowers/specs/2026-09-29-joeness-setup-only-distribution-design.md` | 참조하는 곳은 위 plan뿐이다. `<user>`와 `C:\Users` 경로가 들어 있다. |

`docs/superpowers/*context-storage-routing*` 2개는 `docs/ROADMAP.md`(216·241행)가 링크하므로 (b)로 남긴다. `__pycache__`, `.pyc`, `node_modules`, `.env`, `.bak` 같은 캐시·임시 파일은 추적 파일 중에 없다.

### archive 이동의 제약 (하지는 않음)

- `tests/joeness-release.tests.ps1:78` `Test-MinimalCurrentTree`는 루트 이름을 정확히 13개로 고정한다. 그래서 루트에 `archive/`를 만들면 게이트가 실패한다. `evals/archive/…`처럼 `evals/` 아래에 두거나, 테스트를 고쳐야 한다(테스트를 고치면 스킬 폴더 밖이라 게이트 정의에는 맞는다).
- 같은 테스트(84행)는 `evals/experiments`의 파일 이름 4개도 고정한다.
- 기록 밖 문서가 링크하는 run 폴더는 68개다(README 13, AGENTS 18, CHANGELOG 27, docs/ROADMAP 53, installation 13, 겹침 포함). 그중 37개가 1.0 이전 run이다. 옮기면 이 링크들을 함께 고쳐야 한다. 링크가 하나도 없는 run 폴더는 33개다.

## 2. 참조 그래프 (에이전트가 읽는 파일 기준)

| 출발 | → 도착 (파일·제목) |
|---|---|
| `JOENESS.ps1` | `scripts/sync-harness.ps1` (모든 인자 전달) |
| `scripts/sync-harness.ps1` | `vendor/source-manifest.json` (버전, 19개 파일 해시); `skills/joeness-setup/scripts/project-setup.ps1` (dot-source해서 트랜잭션 함수 재사용); Apply 성공 시 `references/usage.md`를 stderr로 출력; 실패 안내 문구에서 `README.md` 언급 |
| `SKILL.md` | `assets/AGENTS.md`, `assets/ROADMAP.md`, `assets/TASK.md`, `assets/ISSUES.md`, `assets/DESIGN.md`; `references/changes-hook.md`, `references/review-gate.md`, `references/roadmap-review.md`, `references/operation-review.md`, `references/usage.md`; `scripts/project-setup.ps1`; 프로젝트 쪽 경로 `DESIGN.md#rule-coverage` (asset DESIGN의 `## Rule coverage`와 대응), `.joeness/setup-state.json`, `Library/`, `work/reports/<date>-<id>.md`, `TASK#spacing-v1`(예시); 외부 경로 `<joedesign>/scripts/report-check.mjs`, JOEFLOW `approval_status.py` |
| `assets/AGENTS.md` (연결문) | `<joedesign>/scripts/report-check.mjs`, `TASK-archive.md`; ROADMAP·TASK·ISSUES·DESIGN·Library 역할 이름 |
| `assets/ROADMAP.md` | `DESIGN.md#rule-coverage`, `approval_status.py` |
| `assets/TASK.md` | `ROADMAP.md#item` |
| `references/usage.md` | `review-gate.md`, `changes-hook.md`; 프로젝트 파일 이름, `.joeness/setup-state.json` |
| `references/changes-hook.md` | `../scripts/changes-hook.mjs` → 프로젝트 `.claude/hooks/joeness-changes.mjs`, `.claude/settings.json`, `.claude/settings.local.json` |
| `references/review-gate.md` | `impact-review.md`, `scripts/review-gate.mjs`, `<joedesign>/scripts/report-check.mjs` |
| `references/impact-review.md` | `scripts/impact-review.mjs` |
| `references/roadmap-review.md` | `scripts/roadmap-review.mjs`, `review-gate.mjs` |
| `references/operation-review.md` | `scripts/operation-review.mjs` |
| `scripts/review-gate.mjs` | `./impact-review.mjs` (import) |
| `scripts/project-setup.ps1` | 프로젝트 `AGENTS.md`, `AGENTS.override.md`(있으면 차단), `.joeness/setup-state.json` |

- manifest에 있는 19개 파일은 모두 SKILL.md에서 시작해 따라가면 닿는다. `agents/openai.yaml`은 Codex 호스트가 읽는다.
- **README나 docs를 가리키는 에이전트용 파일은 없다.** 유일한 예외는 `sync-harness.ps1:233`의 안내 문구 "See README.md"다. 그래서 README를 줄일 때 지켜야 할 것은 내용이 아니라 다음 세 가지다.
  - `tests/joeness-setup-contract.tests.mjs:66`이 요구하는 첫 줄 `# JOENESS <version>`.
  - README에서 스킬 쪽으로 나가는 링크 `skills/joeness-setup/references/usage.md#문서-구조와-책임`과 `references/review-gate.md`. 방향이 README → 스킬이라 스킬은 바꿀 필요가 없다.
  - 설치 실패 시 사람이 찾아갈 곳이 README라는 점.

README 중 다른 곳과 겹치는 부분:

| README 절 | 겹치는 원본 |
|---|---|
| 첫 단락 "Source version …" (1.1.0~1.4.2 이력) | `docs/CHANGELOG.md`, `docs/installation.md` 첫 단락, `AGENTS.md` 3행 |
| §3 Key Features 파일-담당 표 | `SKILL.md` Owner 표, `usage.md` "문서 구조와 책임" 표, `assets/AGENTS.md` Owners 줄 |
| §3 예시 보고, 필드 의미 | `usage.md` "평소 요청과 보고", `SKILL.md` "User guidance and reports" |
| §4 Installation | `docs/installation.md` "새 설치" |
| §4 Project setup 요청 예시 | `usage.md` "새 프로젝트/기존 프로젝트" |
| §6 Limitations | `usage.md` "주의" |
| 한국어 절 1~6 | 영어 절 1~6 (같은 내용 두 벌) |

## 3. 보안 검토 (보고만 함, 고치지 않음)

### (i) 비밀값

| 대상 | 방법 | 결과 |
|---|---|---|
| 현재 트리 | `git grep -Ei -f` (private key 헤더, AKIA, ghp/gho/github_pat, sk-, xox, AIza, password/secret/api_key/token 대입, DB 연결 문자열, Bearer) | 진짜로 걸린 것은 0건이다. `approved_definition_digest` 같은 해시, `risk-…`/`task-…` 안의 `sk-` 부분 일치 같은 오탐 6건뿐이다. |
| 전체 이력 (744커밋, `git log --all -p`, 84 MB) | 같은 패턴 | 합성 시험값만 나왔다: `sk-proj-SYNTHETIC_TEST_ONLY_…`, `Bearer abcdefghijklmnopqrstuvwxyz`, `Bearer top-secret-token-value`, `-----BEGIN PRIVATE KEY-----\nabc`. 모두 옛 0.1 evals 수집기 테스트의 canary다(`1dd6f24`, `a34f75a`, `7add04a`에서 들어왔고 `12d0a4c`/`007fba6` 정리 때 트리에서 빠짐). |
| 비밀값 파일 | 이력 전체 경로 2,179개에서 `.env`, `*.pem`, `*.key`, `*.pfx`, `id_rsa`, `credentials` 검색 | 0건 |

### (ii) 개인 식별자

| 식별자 | 트리 파일 | 트리 횟수 | 이력 횟수 (diff 전체 / `+`줄) | 이력 커밋 |
|---|---:|---:|---:|---:|
| `<user>` | 216 | 2,495 | 12,716 / 6,018 | 91 |
| `<email>` (본문) | 0 | 0 | 0 / 0 | 0 |
| `<email>` (커밋 작성자 메타데이터) | — | — | — | 738 (642 + 96) |
| `<realname>` (작성자 이름) | — | — | — | 96 |
| `C:/Users` | 93 | 799 | 1,191 / 949 | 54 |
| `C:\Users` (백슬래시 1개) | 14 | 18 | 68 / 32 | 측정 못 함 |
| `C:\\Users` (JSON escape) | 119 | 1,065 | — | — |
| `AppData` | 156 | 1,457 | 11,053 / 4,710 | 85 |
| 경로 이름 안의 `<user>` | 0 | — | 0 | — |

- 분포: `<user>`가 들어 있는 트리 파일 216개는 runs 213개, experiments 1개, docs 2개(위 (d) 후보 2개)다. 기록 밖 파일(스킬, 설치기, README, AGENTS, tests)에는 `<user>`, `C:/Users`, `AppData`가 하나도 없다.
- 이미 `~`로 가린 상태: `~/` 형태가 evals 74개 파일에 있다. 11-03 이후 release·behavior run(v140·v141·v142)에는 `<user>`가 0건이다. 남은 곳은 2026-10-24~11-03 release receipt 5개 폴더(각 3회)와 그 이전 run들이다. 많은 순서: rule-accumulation 529, creative-factorial 353, interaction-performance-ab 282, actual-performance-ab 278, impact-review 238. `<user>`가 든 run 폴더는 모두 50개다.
- 트리를 정리해도 이력에는 그대로 남는다. 이력을 없애려면 history rewrite가 필요하다. 그런데 `AGENTS.md`와 `SKILL.md`는 "history purge 금지"와 태그 보존을 정해 두었으므로, 이것은 사용자가 결정할 일이다.

### (iii) 스크립트의 입력과 쓰기 위치

| 스크립트 | 외부 입력 | 쓰는 곳 | 위험 요소 |
|---|---|---|---|
| `JOENESS.ps1` | 모든 인자 | 직접 쓰지 않음 | 없음 |
| `scripts/sync-harness.ps1` | `-Check/-Apply/-Remove`, `-CodexHome`, `$env:CODEX_HOME`, `$HOME`, `vendor/source-manifest.json`, `<codexHome>/AGENTS.md`(옛 marker 검사만 하고 쓰지 않음), `<codexHome>/joeness-skills-state.json` | `<codexHome>/skills/joeness-setup/**`(manifest 19개 경로만), `<codexHome>/joeness-skills-state.json` | 기본값은 `~/.codex`다. `-CodexHome`이나 `CODEX_HOME`을 주면 그 경로 어디에든 쓴다(의도된 동작). reparse point를 막고, 쓰기 전후에 manifest를 다시 검사하며, 롤백 트랜잭션을 쓴다. `iex`, 다운로드, 셸 문자열 보간은 없다. |
| `skills/…/scripts/project-setup.ps1` | `-ProjectPath`(`git -C <p> rev-parse --show-toplevel`로 루트 결정), `-ExpectedRoot/TargetHash/StateHash`, `-ManagedBodyBase64` | `<git root>/AGENTS.md`, `<git root>/.joeness/setup-state.json` | body 안의 marker, NUL, 기계 경로를 거부한다. 쓰기 전에 hash snapshot을 대조한다. `& git`은 인자 배열로 호출한다. `& $Guard`/`& $AfterWrite`는 내부 scriptblock이다. 위험 요소는 없다. |
| `skills/…/scripts/changes-hook.mjs` | `CLAUDE_PROJECT_DIR` 또는 cwd, `--record` | `<git dir>/joeness-last-head` (프로젝트 `.git` 안) | `execFileSync('git', [...])`라 셸을 거치지 않는다. 다른 사람의 커밋 메시지가 에이전트 문맥에 그대로 들어간다(낮은 수준의 prompt-injection 경로). |
| `review-gate.mjs`, `impact-review.mjs`, `roadmap-review.mjs`, `operation-review.mjs` | CLI `--root` 같은 인자, 지정한 JSON·파일 | 쓰지 않음(`readFileSync`만 사용) | `realpath`·sha256 고정으로 도중 변경을 감지한다. `eval`과 `exec`는 없다. |
| `fixtures/joeness-setup/create-fixture.mjs` (테스트 전용) | 없음 | OS 임시 폴더 `mkdtemp` | `execFileSync`(git, node, powershell)를 인자 배열로 호출한다. |
| `install-and-check.mjs` | — | — | 이 저장소에는 없다(다른 도구의 파일 이름으로 보인다). |

기록 밖의 추적 파일 전체에서 `Invoke-Expression`, `iex`, `eval(`, `new Function`, `Invoke-WebRequest`, `DownloadString`, `curl`, `wget`은 0건이다. evals 안의 py·mjs·ps1·sh 스크립트도 같은 패턴과 `shell=True`, `os.system`, `urllib`, `requests.get`까지 찾아봤지만 0건이다.

### (iv) 의존성

`package.json`은 evals 시험 fixture에만 4개 있다(`evals/joeness-setup/fixtures/*-v1`, `runs/2026-09-27-usability-performance-ab/fixtures/*`). 넷 다 dependencies와 devDependencies가 없다. lockfile도 없다. 그래서 `npm audit`은 돌리지 않았다(돌릴 대상이 없다). 실행에 필요한 것은 Node 18+ 내장 모듈과 Windows PowerShell 5.1/7뿐이다.

### (v) CI (`.github/workflows/windows-ci.yml`)

- `permissions: contents: read`이고, secrets를 쓰지 않는다.
- `actions/checkout`은 commit SHA로 고정했고(v7.0.1), `persist-credentials: false`다.
- 트리거는 `push`(main, `codex/**`)와 `pull_request`다. `pull_request_target`은 아니다.
- `github.event.*` 값은 `env:`로 넘겨서 쓴다. 스크립트 안에서 직접 보간하지 않는다.
- 위험 요소는 발견하지 못했다.

## 4. 사용법

README는 233줄, 1,315단어(공백 기준)다. 영어 1–122행, 한국어 124–233행이다. 절 구성: `# JOENESS 1.4.2` / 1 Summary / 2 Design Purpose / 3 Key Features / 4 Usage(Installation, Project setup) / 5 Tool Integration / 6 Limitations. 한국어도 같은 6개 절이다. `docs/installation.md`는 88줄, 286단어다.

### Quickstart 초안 (명령은 오늘 실제로 있는 것만)

| 단계 | 명령 / 요청 | 문서 상태 |
|---|---|---|
| 1. 설치 | `git clone https://github.com/JOEWRKS/JOENESS.git` → `cd JOENESS` → `powershell.exe -NoProfile -File .\JOENESS.ps1 -Check` (`ready`) → `… -Apply` → `… -Check` (`current`) | ⚠ Codex(`~/.codex`)에만 설치된다. README §6에는 "Supported environment: Codex"라고 되어 있는데, SKILL·usage는 Claude Code hook을 제안하고 AGENTS.md에는 "Claude Code clone fast-forwarded"라고 적혀 있다. **Claude Code에 설치하는 방법은 어떤 문서에도 없다.** |
| 2. 프로젝트 연결 | 새 채팅에서 `이 프로젝트에 JOENESS 설치해줘. 목표는 …. 먼저 변경안을 보여줘.` → 확인한 뒤 `이 변경안 적용해줘.` (에이전트가 `project-setup.ps1 -Check -ProjectPath <root>`를 실행하고, 이어서 `-Apply` + 해시 3개 + body를 실행한다) | 문서 있음(README §4, usage.md). Git 프로젝트여야 한다. |
| 3. 첫 사용 | `로드맵의 다음 작업 이어서 진행해.` | 문서 있음 |
| 4a. 상태 확인 | `powershell.exe -NoProfile -File .\JOENESS.ps1 -Check`; `powershell.exe -NoProfile -File .\skills\joeness-setup\scripts\project-setup.ps1 -Check -ProjectPath <root>` | 문서 있음(installation.md). ⚠ 두 번째 명령은 저장소 기준 경로다. 설치본 경로(`~/.codex/skills/joeness-setup/scripts/…`)는 문서에 없다. |
| 4b. 패키지 업데이트 | 이전 패키지 폴더(예: `git checkout JOENESS-v1.4.2`)에서 `… -Remove` → 새 패키지에서 `-Check`(`ready`) → `-Apply` → `-Check`(`current`) | ⚠ **문서끼리 어긋난다.** README 표는 `ready`/`current`/`blocked`만 설명해서 업그레이드를 바로 `-Apply`하면 되는 것처럼 읽힌다. 실제로는 버전이 다르면 언제나 `blocked`("Skill ownership does not match this package")가 나온다. 이전 패키지를 어떻게 꺼내는지(태그 checkout) 명령도 없다. |
| 4c. 프로젝트 연결 갱신 | 채팅에서 `현재 프로젝트의 JOENESS 연결과 로드맵을 확인해줘 …`(installation.md) | ⚠ `-Check`는 asset과 비교하지 않아서 연결문이 옛 판이어도 `current`로 나온다. 갱신이 필요한지 알려 주는 명령이 없다. |
| 5a. 프로젝트 분리 | 채팅에서 `이 프로젝트에서 JOENESS 연결을 해제해줘.` (에이전트가 fresh `-Check`를 한 뒤 `-Detach` + 해시 3개를 실행) | 문서는 있다. 사용자가 직접 실행할 명령은 없다(해시 인자가 필요해서 에이전트를 거쳐야 함). hook 제거는 changes-hook.md를 보라고만 되어 있다. |
| 5b. 패키지 제거 | 설치에 쓴 같은 패키지 폴더에서 `powershell.exe -NoProfile -File .\JOENESS.ps1 -Remove` | 문서 있음(installation.md). README 본문에는 없다. |

이 밖에 오래된 문장: `docs/installation.md` 첫 단락의 "기존 `JOENESS-v1.0.0`~`v1.0.2` 태그 변경 없음"과 "1.1.1은 개인 설치 완료·QA 배포 전"은 2.0 시점에는 낡은 정보다.

## 5. D-후보 (조치하지 않음)

### 스킬 파일끼리 겹치는 문장·문단

| 주제 | 나오는 곳 |
|---|---|
| 문서 담당 표(AGENTS/ROADMAP/TASK/ISSUES/DESIGN/Library) | `SKILL.md` Owner 표, `assets/AGENTS.md` Owners 줄, `references/usage.md` "문서 구조와 책임" 표 |
| 여섯 항목 보고와 `changed`는 남은 문제로 | `SKILL.md` "User guidance and reports", `assets/AGENTS.md` 마지막 항목, `usage.md` "평소 요청과 보고" |
| `<joedesign>` report-check와 stamp 규칙 | `SKILL.md`(같은 절), `assets/AGENTS.md` Done 항목, `references/review-gate.md:120`, `assets/TASK.md` `Report stamp:` |
| 설계 규칙 Check 예시 `DESIGN.md#rule-coverage S1~S6 … TASK#spacing-v1 … tsc, vitest` | `SKILL.md:148-150`, `assets/ROADMAP.md:20` (거의 같은 문장) |
| Product revision / approval 줄 (JOEFLOW `approval_status.py`) | `SKILL.md` "Roadmap and suitability check", `assets/ROADMAP.md:5` |
| JOEDESIGN Rule Coverage 표에 Result 열 추가 | `SKILL.md` "Inspect and normalize", `assets/AGENTS.md` Done 항목 |
| 여러 작업자, integrator 한 명 | `SKILL.md` "Work after setup", `assets/AGENTS.md` Recording, `usage.md` 주의 |
| 비밀값·불필요한 개인정보 기록 금지 | `SKILL.md` Proposal, `assets/AGENTS.md` Recording, `usage.md` 주의 |
| 분리와 패키지 제거는 별개 | `SKILL.md` 마지막 절, `usage.md` 주의 |

2.0 범위상 스킬 텍스트는 바꾸지 않는다. 위 목록은 이후 판에서 검토할 기록으로만 남긴다.

### 버전·날짜

- 스킬 폴더(assets 포함)에서 `1.4.2`, `1.4.`, `JOENESS <n>` 검색 결과는 **0개 파일**이다. 날짜 문자열도 없다. 정규식에 걸린 것은 `spacing-v1.`(예시 ID) 오탐뿐이다. `project-setup.ps1`의 `toolVersion='0.2'`과 `schemaVersion=1`은 state 형식의 버전이지 release 버전이 아니다. 테스트와 기존 프로젝트 state가 이 값을 요구하므로 바꾸면 안 된다.
- `assets/AGENTS.md`(연결문)에는 버전이 없다. 게다가 `-Check`는 프로젝트의 `.joeness/setup-state.json`에 적힌 applied-block 해시와만 비교한다. 그래서 2.0 버전을 올려도 **연결된 프로젝트가 outdated로 보고되지 않는다.**
- 2.0에서 버전을 바꿔야 할 파일(모두 스킬 폴더 밖):

| 파일 | 위치 |
|---|---|
| `vendor/source-manifest.json` | `release.version` (manifest 해시가 바뀐다) |
| `scripts/sync-harness.ps1:11` | `$script:JoenessRelease = '1.4.2'` |
| `tests/joeness-release.tests.ps1:107` | `'1.4.2'` |
| `tests/joeness-setup-contract.tests.mjs:63` | `'1.4.2'` (66행은 README 첫 줄과 연동) |
| `README.md` | 1행 제목, 영어·한국어 버전 단락 (3곳) |
| `docs/installation.md` | 첫 단락, "현재 소스 버전" 표 (2곳) |
| `docs/CHANGELOG.md` | 새 항목 (10곳에 1.4.x 언급) |
| `AGENTS.md` | 3행 Current release |

- 영향: manifest 해시가 바뀌므로 1.4.2로 설치된 개인 설치본에서 2.0 `-Check`를 돌리면 `blocked`가 나온다. 4b의 Remove → Apply 절차를 Quickstart에 꼭 넣어야 한다.

## 확인된 것

- 추적 파일 1,594개, 추적되지 않은 파일·무시된 파일 0개, 이력 커밋 744개, `.git` 22 MB.
- 스킬 폴더 19개 파일은 manifest와 1:1로 대응하고, 모두 SKILL.md에서 따라가면 닿는다. 에이전트가 읽는 파일에서 README·docs로 가는 링크는 없다(설치기 안내 문구 1곳만 예외).
- 스킬 폴더에는 버전 문자열이 0개다. 프로젝트 `-Check`는 asset과 비교하지 않는다(`project-setup.ps1` 209–232행). 설치기는 releaseVersion이나 manifest 해시가 다르면 `blocked`를 낸다(`sync-harness.ps1` 159행).
- 진짜 비밀값은 트리와 이력에 0건이다. 본문에 `<email>`은 0건이다. 위 표의 식별자 수치. 기록 밖 파일 중 식별자가 있는 것은 (d) 후보 2개뿐이다.
- CI는 읽기 권한만 쓰고, secrets를 쓰지 않으며, action을 SHA로 고정했다. lockfile과 의존성이 없다.
- 테스트는 루트 이름 13개, `scripts/` 1개, `tests/` 10개, `evals/experiments` 4개를 고정한다.

## 확인되지 않은 것

- 테스트와 Windows CI는 돌리지 않았다(읽기 전용 조사).
- `C:\Users`(백슬래시 1개)가 이력의 몇 개 커밋에 있는지는 세지 못했다(awk escape 문제). 횟수만 쟀다.
- 비밀값 검색은 정규식 기반이다. 엔트로피 검사(gitleaks 등)는 도구 설치 금지라 하지 않았다. png와 bundle 바이너리 안은 보지 않았다(`.bundle` 6개는 git bundle이라 그 안의 커밋 내용은 검사하지 않았다).
- Claude Code 쪽 개인 설치 위치와 방법(어느 clone을 어떻게 읽는지)은 저장소 문서에 없어서 확인하지 못했다.
- evals 안 run 스크립트 79개를 정말 아무도 다시 실행하지 않는지는 이름 검색으로만 판단했다.

## 세션이 대신 내린 결정

- run 폴더 안의 파일(스크립트, 중복 출력 포함)은 전부 "기록"(c)으로 분류했다. 그래서 (d)에서는 뺐다. (d)는 기록 밖 docs 4개뿐이다.
- `docs/superpowers/*context-storage-routing*`은 `docs/ROADMAP.md`가 링크하므로 (b)로 남겼다.
- 커밋 작성자 메타데이터(`<email>`, `<realname>`)도 개인 식별자로 셌다. 과제가 명시한 "본문 occurrence"와는 칸을 나눴다.
- `install-and-check.mjs`는 이 저장소에 없다. 그래서 그 자리에 `sync-harness.ps1`과 테스트 fixture 생성기를 검토했다.
- `npm audit`은 lockfile이 없어서 돌리지 않았다.
- 보고서는 `evals/v2-survey-20261119/`에 두었다(과제가 정한 위치). 루트 이름 목록 테스트에는 영향이 없다.
