# JOENESS 빠른 시작

Windows PowerShell 기준이다. `<클론>`은 이 저장소를 받은 폴더, `<프로젝트>`는 JOENESS를 연결할 Git 프로젝트의 루트다. 개인 도구 설치(1·2)와 프로젝트 연결(3)은 따로 한다.

`<설치위치>`는 Codex 설치 위치다. 기본은 `CODEX_HOME`, 없으면 `~\.codex`다. 다른 위치를 쓰려면 **첫 명령부터** 모든 `JOENESS.ps1` 명령에 `-CodexHome <설치위치>`를 붙인다. 붙이지 않으면 기본 위치를 검사한다.

## 1. Codex에 설치

```powershell
git clone https://github.com/JOEWRKS/JOENESS.git
cd JOENESS
powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
```

`ready`가 나오면 설치한다. `current`면 이미 같은 패키지가 설치되어 있다. `blocked`(exit 2)면 6절(업그레이드)을 본다. 출력 JSON의 `installedRelease`는 설치본 버전, `packageRelease`는 이 클론의 버전이다.

```powershell
powershell.exe -NoProfile -File .\JOENESS.ps1 -Apply
powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
```

마지막 `-Check`가 `current`면 끝이다. `-Apply`는 성공 JSON(stdout) 뒤에 사용 안내를 stderr로 낸다. Windows PowerShell 5.1에서 `2>&1`로 받으면 빨간 `NativeCommandError`로 보이지만 실패가 아니다. 판정은 JSON의 `status`와 exit code 0으로 한다.

## 2. Claude Code에서 쓰기 (권장 방법, 수동)

이 작업을 해 주는 스크립트는 없다. 권장 방법은 이 저장소를 **로컬 수정 없는 별도 클론**으로 두고, Claude Code 스킬 폴더에서 그 클론의 `skills\joeness-setup`으로 junction을 거는 것이다.

```powershell
git clone https://github.com/JOEWRKS/JOENESS.git <클론>
New-Item -ItemType Junction -Path <스킬폴더>\joeness-setup -Target <클론>\skills\joeness-setup
```

- `<스킬폴더>`: 모든 프로젝트에서 쓰려면 `~\.claude\skills`, 한 작업 공간에서만 쓰려면 `<작업공간>\.claude\skills`. 개발자는 작업 공간 쪽을 쓴다.
- 갱신: `git -C <클론> pull --ff-only`. 클론에서 직접 고치지 않는다(fast-forward가 막힌다).
- 확인: `git -C <클론> status`가 깨끗하고, `<클론>\vendor\source-manifest.json`의 `release.version`이 원하는 버전인지 본다. Claude Code 쪽에는 `-Check` 같은 설치 상태 명령이 없다.
- 2.0.0 이하의 검수 도구(`review-gate.mjs` 등 `.mjs` 4개)는 junction 경로로 실행하면 검사 없이 exit 0으로 끝났다. 2.0.1에서 고쳤다. 2.0.0 클론을 쓰고 있다면 갱신한다.

## 3. 프로젝트 연결

프로젝트를 연 **새 채팅**에서 요청한다.

- 새 프로젝트: `이 프로젝트에 JOENESS 설치해줘. 목표는 [목표]. 만들 문서와 기록 범위를 먼저 보여줘.`
- 기존 프로젝트: `이 프로젝트에 JOENESS 설치해줘. 기존 계획·결과·승인 근거를 보존하고 정리안을 먼저 보여줘.`
- 변경안을 확인한 뒤: `이대로 적용해줘.`

에이전트는 `project-setup.ps1 -Check -ProjectPath <프로젝트>`로 상태를 본다. 승인을 받으면 `-Check`가 준 기대값 세 개(`-ExpectedRoot` 경로, `-ExpectedTargetHash`, `-ExpectedStateHash`)와 연결문을 `-Apply`에 넘겨 실행한다. 바뀌는 것은 `<프로젝트>\AGENTS.md`의 JOENESS 구역과 `.joeness\setup-state.json`, 그리고 승인한 ROADMAP·TASK·ISSUES·DESIGN 문서뿐이다. Git 프로젝트여야 한다.

## 4. 첫 사용

`로드맵에서 다음으로 가능한 작업을 이어서 진행해.`

작업이 끝나면 에이전트가 작업·업데이트 파일·이슈·해결·남은 문제·다음 작업 여섯 항목으로 먼저 보고한다.

## 5. 상태 확인

```powershell
powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
powershell.exe -NoProfile -File "<설치위치>\skills\joeness-setup\scripts\project-setup.ps1" -Check -ProjectPath <프로젝트>
```

- 첫 명령은 클론 폴더에서 실행한다(기본 위치가 아니면 `-CodexHome <설치위치>`를 붙인다). `current`면 개인 설치가 이 패키지와 같다. 설치본 버전은 JSON의 `installedRelease`로, 또는 `<설치위치>\joeness-skills-state.json`의 `releaseVersion`으로 본다.
- 두 번째 명령은 Codex에 설치된 사본을 쓴다. Claude Code만 쓴다면 `<클론>\skills\joeness-setup\scripts\project-setup.ps1`로 바꾼다. 결과가 `current`면 연결 구역이 마지막으로 적용한 상태 그대로다.
- 주의: 이 검사는 패키지의 최신 연결문과 비교하지 **않는다**. 패키지를 올려도 기존 프로젝트는 `current`로 나온다. 새 연결문을 반영하려면 채팅에서 `현재 프로젝트의 JOENESS 연결과 로드맵을 확인해줘. 빠진 부분의 변경안을 먼저 보여줘.`라고 요청한다.

## 6. 업그레이드 (예: 2.0.0 → 2.0.1)

버전이 다른 설치본이 있으면 새 패키지의 `-Check`는 항상 `blocked`(exit 2)다. 메시지는 `Skill ownership does not match this package; existing files were preserved`이고, 2.0.1부터는 뒤에 `(installed release 2.0.0, this package 2.0.1; ...)`처럼 두 버전이 붙는다. 덮어쓰지 말고, **설치할 때 쓴 옛 패키지로 먼저 제거**한다.

설치본 버전은 새 패키지 `-Check` JSON의 `installedRelease`, 또는 `<설치위치>\joeness-skills-state.json`의 `releaseVersion`으로 안다. 그 버전의 태그는 `JOENESS-v<버전>`이다. 2.0.0 이하 패키지의 `-Check`에는 `installedRelease` 필드가 없다.

아래 명령은 1절 클론(`JOENESS`)의 **상위 폴더**에서 시작한다. 1절 바로 뒤라면 먼저 `cd ..`를 한다.

```powershell
git clone https://github.com/JOEWRKS/JOENESS.git JOENESS-old
cd JOENESS-old
git checkout JOENESS-v2.0.0
powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
powershell.exe -NoProfile -File .\JOENESS.ps1 -Remove
```

옛 패키지의 `-Check`가 `current`일 때만 `-Remove`한다. `current`가 아니면 그 태그가 설치본과 다르다는 뜻이니, 위에서 확인한 `releaseVersion`의 태그로 다시 체크아웃한다. 그다음 새 패키지 폴더로 돌아가 설치한다.

```powershell
cd ..\JOENESS
git pull --ff-only
powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
powershell.exe -NoProfile -File .\JOENESS.ps1 -Apply
powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
```

`git pull --ff-only`는 1절처럼 main을 받은 클론이 전제다. pull은 태그가 아니라 main의 최신 커밋을 준다. 클론을 태그에 체크아웃해 두었다면(detached HEAD) `You are not currently on a branch.`가 나오므로, 대신 `git fetch --tags`를 한 뒤 `git checkout JOENESS-v2.0.1`을 한다.

순서대로 `ready` → `current` → `current`가 나와야 한다. Claude Code 쪽은 `git -C <클론> pull --ff-only`만 하면 된다. 이미 연결된 프로젝트는 자동으로 바뀌지 않는다(5절 주의 참고). 백업과 복구는 [설치·업데이트·복구](installation.md)를 본다.

## 7. 프로젝트 연결 해제

프로젝트를 연 채팅에서 `이 프로젝트에서 JOENESS 연결을 해제해줘.`라고 요청한다. 에이전트가 새로 `-Check`를 한 뒤 `-Detach`를 실행한다(기대값 인자가 필요해서 사람이 직접 치는 명령은 없다). 결과는 `detached`이고, 그 뒤 `-Check`는 `ready`다. 연결 구역만 빠지고 일반 문서와 작업 이력은 남는다. `AGENTS.md`에 JOENESS 구역밖에 없었다면 0바이트 `AGENTS.md`와 빈 `.joeness\` 폴더가 남는다. 파일을 지우지 않는 것이 의도이므로, 필요 없으면 직접 지운다. 선택형 hook을 켰다면 [changes-hook 안내](../skills/joeness-setup/references/changes-hook.md)대로 따로 끈다.

## 8. 패키지 제거

설치에 쓴 **같은 패키지 폴더**에서 실행한다.

```powershell
powershell.exe -NoProfile -File .\JOENESS.ps1 -Remove
```

결과는 `removed`다. 2.0.1부터는 비게 된 `<설치위치>\skills\joeness-setup` 폴더 트리도 지운다. 다른 스킬과 함께 쓰는 `skills` 폴더는 남긴다. 2.0.0 이하로 제거했다면 빈 폴더가 남아 있을 수 있지만 재설치에는 지장이 없다. 프로젝트 연결은 지워지지 않는다(7절은 따로). Claude Code 쪽은 junction만 지운다: `cmd /c rmdir "<스킬폴더>\joeness-setup"`. `rmdir`은 junction만 지우고 클론은 남긴다(Windows PowerShell 5.1의 `Remove-Item -Recurse`는 대상 폴더 내용까지 지울 수 있으니 쓰지 않는다).
