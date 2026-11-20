# JOENESS 2.0.0 QUICKSTART 특성화 시험 보고

시험일 2026-11-19. 대상 `docs/QUICKSTART.md`(태그 `JOENESS-v2.0.0`와 main `f8e02ef`에서 같은 내용, 98행). 원문 사본은 `log/QUICKSTART-v2.0.0.md`. 대조군은 없다.

## 결론

- **문서를 그대로 따라가면 설치, 업그레이드, 프로젝트 연결, 해제, 제거가 모두 끝까지 된다.** 문서가 적은 상태값(`ready`·`current`·`blocked`·`removed`)은 실제 출력과 **모두 일치**했다. 아래 "상태값 대조"에 줄마다 적었다.
- 결함은 10건이다(문서 9건, 도구 1건). 막혀서 진행이 멈춘 것은 없다. 그중 새 사용자가 실제로 걸릴 만한 것은 셋이다.
  - **D3**: 6절 첫 명령을 어디서 실행하는지 문서에 없다. 1절 바로 뒤라면 사용자는 `JOENESS` 안에 있고, 그대로 따르면 `cd ..\JOENESS`가 없는 폴더를 가리킨다.
  - **D2**: 5절 상태 확인 명령이 `$HOME\.codex`로 고정돼 있다. 1절에서 소개한 `-CodexHome`·`CODEX_HOME`를 쓴 사용자에게는 경로가 틀린다.
  - **D5**: 6절은 옛 패키지 `-Check`가 `current`가 아니면 "태그가 다르다"고만 한다. 무엇으로 맞는 태그를 찾는지가 없고, `-Check` 출력에도 버전 필드가 없어 거기서 막힌다.
- 4절(첫 사용)은 실제 에이전트가 필요해서 실행하지 않았다.

## 절별 판정

| 절 | 판정 | 근거 (문서 줄 / 실제 출력) |
|---|---|---|
| 1. Codex에 설치 (L5–20) | 문서 결함(경미) | 1.4.2와 2.0.0 모두 `-Check`=`ready` → `-Apply`=`current` → `-Check`=`current`로 L13·L20과 같았다(log 01–03, 12–14). 결함: D1, D10 |
| 2. Claude Code (L22–33) | 통과 | 별도 클론 후 `New-Item -ItemType Junction` 성공(LinkType Junction). `git status` 깨끗, `release.version`=`2.0.0`, `pull --ff-only`=Already up to date(log 40–44) |
| 3. 프로젝트 연결 (L35–43) | 문서 결함(경미) | `-Check`=`ready` → `-Apply`=`current`(changedTargets `AGENTS.md`, `.joeness/setup-state.json`) → `-Check`=`current`. 바뀐 파일은 L43 설명과 같다(log 20–23). 결함: D7 |
| 4. 첫 사용 (L45–49) | 미실행 | 실제 새 채팅 에이전트가 필요하다. 내가 역할극으로 하면 문서가 아니라 나 자신을 시험하게 된다 |
| 5. 상태 확인 (L51–60) | 문서 결함 | 클론 폴더 `-Check`=`current`(L58 일치). 프로젝트 `-Check`는 Codex 사본과 클론 사본 모두 `current`(L59 일치, log 30–32). 결함: D2 |
| 6. 업그레이드 (L62–84) | 문서 결함 + 도구 결함 | 1.4.2 설치 상태에서 2.0.0 `-Check`=`blocked`, exit 2(L64 일치, log 04). 옛 패키지 `-Check`=`current` → `-Remove`=`removed`(L74 일치, log 07–08). 새 패키지 `ready` → `current` → `current`(L84 일치, log 12–14). 결함: D3, D4, D5, D6, D8 |
| 7. 연결 해제 (L86–88) | 문서 결함(경미) | 새 `-Check` 후 `-Detach`=`detached`. 그 뒤 `-Check`=`ready`. ROADMAP·TASK·ISSUES·DESIGN·README는 남았다(log 50–52). 결함: D7, D9 |
| 8. 패키지 제거 (L90–98) | 도구 결함(경미) | 같은 폴더에서 `-Remove`=`removed`(L98 일치). 다시 `-Check`=`ready`. `cmd /c rmdir`은 junction만 지웠고 클론의 `SKILL.md`는 남았다(L98 일치, log 60–62). 결함: D8 |

## 결함 목록

| ID | 종류 | 줄 | 내용 |
|---|---|---|---|
| D1 | 문서 | L10, L20 | 문서는 "다른 위치면 모든 명령에 `-CodexHome`"를 L20에 적는데, 사용자는 L10의 첫 `-Check`를 이미 옵션 없이 친 뒤다. 읽기 전용이라 해는 없지만 엉뚱한 위치를 검사한다. 옵션 안내를 명령 앞에 둬야 한다. |
| D2 | 문서 | L55 | 문서는 `"$HOME\.codex\skills\...\project-setup.ps1"`을 실행하라고 하는데, 실제 설치 위치는 `CODEX_HOME` 또는 `-CodexHome`일 수 있다(L20이 소개한 바로 그 경우). 이 시험에서는 규칙상 `~\.codex`에 접근하지 않고 scratch 경로로 바꿔 실행했다. |
| D3 | 문서 | L67, L77 | L67 `git clone ... JOENESS-old`를 어느 폴더에서 치는지 없다. 1절(L9 `cd JOENESS`) 바로 뒤라면 `JOENESS\JOENESS-old`가 생기고, L77 `cd ..\JOENESS`는 없는 `JOENESS\JOENESS`가 된다. 새 클론의 `git status`도 더러워진다. **추론이며 그대로 실행하지는 않았다.** 나는 상위 폴더에서 실행했다. |
| D4 | 문서 | L78 | 문서는 `git pull --ff-only`만 하라고 하는데, 클론이 태그에 detached면 실제로는 `You are not currently on a branch.`(exit 1)가 나온다(log 09). 이 시험은 지시대로 `checkout JOENESS-v1.4.2`를 했기 때문에 일부는 내가 만든 상황이다. 하지만 L69가 태그 checkout을 권하므로 같은 방식으로 설치한 사용자도 걸린다. 또 pull은 태그 `v2.0.0`(9b6dd25)이 아니라 main HEAD(f8e02ef)를 준다. 오늘은 `skills`·`JOENESS.ps1`·`vendor` 차이가 없어 결과가 같다. |
| D5 | 문서 | L74 | 문서는 "`current`가 아니면 그 태그가 설치본과 다르다"고만 한다. 맞는 태그를 찾는 방법이 없고, `-Check` JSON에 설치본 버전 필드도 없어(log 03, 07) 그 자리에서 막힌다. |
| D6 | 문서/도구 | L13, L64 | `blocked` 판정 자체는 맞다. 다만 실제 메시지가 `Skill ownership does not match this package; existing files were preserved`라서 버전 차이나 업그레이드를 떠올리게 하지 않는다. exit code 2도 문서에 없다(log 04). |
| D7 | 문서 | L43, L88 | 문서는 "`-Apply`에 해시 세 개"라고 하는데, 실제 인자는 `-ExpectedRoot`(경로) 하나와 해시 둘(`-ExpectedTargetHash`, `-ExpectedStateHash`)이다. 설치본 SKILL.md L271은 "three expected values"라고 맞게 적는다. |
| D8 | 도구 | 6·8절 | `-Remove`가 `removed`를 내고도 `codex-home\skills\joeness-setup\{agents,assets,references,scripts}` 빈 폴더 6개를 남긴다(1.4.2 제거와 2.0.0 제거 두 번 다). 재설치(`ready` → `current`)를 막지는 않았다. |
| D9 | 문서 | L88 | 문서는 "연결 구역만 빠진다"고 하는데, 실제로는 0바이트 `AGENTS.md`와 빈 `.joeness\` 폴더가 남는다. 빈 AGENTS를 남기는 것은 SKILL.md L272의 의도이지만 QUICKSTART에는 없다. |
| D10 | 문서 | L16 | `-Apply`는 성공 JSON 뒤에 사용 안내 전문(usage.md)을 stderr로 낸다. PowerShell 5.1에서 `2>&1`로 받으면 빨간 `NativeCommandError`로 보여 실패로 오해하기 쉽다(log 02). 문서에 언급이 없다. |

## 상태값 대조 (문서 줄 → 실제)

- L13 `ready`이면 설치 → 첫 설치 `ready` ✓ / L20 마지막 `current` ✓
- L13·L64 다른 버전이 있으면 `blocked` → `blocked`, exit 2 ✓
- L74 옛 패키지 `current` → `current` ✓ → `-Remove` → `removed` ✓
- L84 `ready` → `current` → `current` ✓
- L59 프로젝트 `current` ✓ / L98 `removed` ✓
- 문서에 없는 값: 3절 `-Check`의 `ready`, 7절의 `detached`, 해제 뒤 `-Check`의 `ready`. 이상하지는 않으나 문서가 기대값을 주지 않는다.

## 확인된 것

- 1.4.2 → 2.0.0 업그레이드는 문서 절차대로 하면 된다. `-Remove`를 하기 전 2.0.0 `-Check`가 `blocked`로 기존 파일을 지키는 것도 확인했다.
- 3절 도우미 동작: 해시 기대값을 넘겨 연결 구역만 쓰고, 상태 파일을 만들고, 다시 검사하면 `current`가 나온다.
- 해제는 다른 문서를 보존하고 패키지 제거는 프로젝트 연결과 별개다. 두 경우 모두 실행 뒤 다시 검사해 확인했다.
- Claude Code junction은 문서의 `New-Item -ItemType Junction`으로 만들고 `cmd /c rmdir`로 지웠다. 클론은 남는다.

## 확인되지 않은 것

- 4절: 실제 에이전트가 로드맵을 이어 작업하고 여섯 항목으로 보고하는지.
- 3절의 채팅 문장(L39–41)을 받은 **실제 Codex·Claude 에이전트**가 SKILL.md대로 변경안을 내는지. 나는 에이전트 역할을 했고, 시험 설계를 이미 알고 있었다.
- 새 채팅이 연결 지침을 실제로 받는지(SKILL.md L105 "fresh context delivery").
- D3의 중첩 클론 실패는 추론이며 그대로 실행하지 않았다.
- 실제 `~\.codex`·`~\.claude\skills` 위치에서의 동작. 규칙상 scratch로 대체했다.
- changes-hook(7절 선택 hook).

## 내가 대신 내린 결정

- 모든 `JOENESS.ps1` 명령에 `-CodexHome <scratch>\codex-home`를 붙였다. 5절 L55의 `$HOME\.codex` 경로도 scratch 경로로 바꿨다.
- 6절의 "blocked" 주장을 확인하려고 `-Remove` 전에 2.0.0 worktree(`JOENESS-v2probe`)에서 `-Check`를 한 번 더 했다. 문서에는 없는 단계다.
- 6절 L67은 cwd 최상위에서 실행했다(D3 회피). L78이 실패해서 `git checkout main` 뒤 다시 pull했다.
- 2절의 junction은 지시서의 `mklink /J` 대신 **문서에 적힌** `New-Item -ItemType Junction`으로 만들었다. 문서를 시험하는 것이 목적이라서다. 스킬 폴더는 `<scratch>\claude-skills`를 썼다. 클론은 별도로 `JOENESS-claude`를 받았다.
- 3절: 프로젝트는 `proj\`(git init, 커밋 1개). 설치본 SKILL.md와 assets를 읽고 에이전트 역할로 변경안을 썼다(`log/21-proj-proposal.md`). **승인 "이대로 적용해줘."는 내가 사용자 역할로 줬다.** changes-hook은 거절로 처리했다. 연결문은 `assets/AGENTS.md`에서 안내 1줄을 빼고 자리표시자 두 개를 채운 것이다(`log/21-proj-body.md`). `-Detach` 인자 이름을 알려고 설치본 `project-setup.ps1`의 param 줄을 검색했다.
- 지시서의 절 번호(4절 상태 확인, 5절 Claude Code)는 문서와 달라서 **문서 기준**(2절 Claude Code, 5절 상태 확인)으로 맞췄다.
- 오염: 첫 파일을 읽을 때 하네스 hook이 클론의 `AGENTS.md` 내용을 자동으로 내 문맥에 넣었다. 내가 연 것은 아니다. 업그레이드에 `-Remove`가 먼저라는 내용이 있었지만 QUICKSTART L64와 같아서 행동은 바뀌지 않았다. evals는 읽지 않았다.

## 로그

`log\`에 명령마다 출력과 `[exit=N]`이 있다(00 클론, 01–14 설치·업그레이드, 20–23 3절, 30–32 5절, 40–44 2절, 50–52 7절, 60–62 8절). 경로 안의 사용자 이름은 로그에 그대로 있지 않다(scratch가 `D:\JOEWRKS\...` 아래라 홈 경로는 나오지 않는다).

## scratch 밖 흔적

없다. 쓴 곳은 모두 `D:\JOEWRKS\.local\v2-tests-20261119\docs-joeness\` 아래이고, git clone 3회는 네트워크 읽기다. 전역 git 설정, PATH, 레지스트리는 바꾸지 않았다(proj 커밋은 `-c user.name/email` 일회성 인자). `~\.codex`, `~\.claude\skills`, 금지 경로는 열지 않았다. 공유 노트 폴더는 목록만 봤다.

scratch에 남긴 것: `JOENESS\`(main 클론, worktree 원본) · `JOENESS-v2probe\`(그 worktree, v2.0.0) · `JOENESS-old\`(v1.4.2 클론) · `JOENESS-claude\`(Claude용 클론) · `codex-home\`(제거 후 빈 폴더 6개) · `claude-skills\`(빈 폴더) · `proj\`(Git, 문서 4개 미커밋, 0바이트 AGENTS.md, 빈 `.joeness\`) · `log\` · `report.md` — junction: 없음(만든 1개는 `cmd /c rmdir`로 지웠고, `dir /s /a:l`로 0개 확인).
