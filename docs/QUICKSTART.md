# JOENESS 빠른 시작

Windows PowerShell 기준이다. `<클론>`은 이 저장소를 받은 폴더, `<프로젝트>`는 JOENESS를 연결할 Git 프로젝트의 루트다. 개인 도구 설치(1·2)와 프로젝트 연결(3)은 따로 한다.

## 1. Codex에 설치

```powershell
git clone https://github.com/JOEWRKS/JOENESS.git
cd JOENESS
powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
```

`ready`가 나오면 설치한다. `current`면 이미 같은 패키지가 설치되어 있다. `blocked`면 6절(업그레이드)을 본다.

```powershell
powershell.exe -NoProfile -File .\JOENESS.ps1 -Apply
powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
```

마지막 `-Check`가 `current`면 끝이다. 설치 위치는 `CODEX_HOME`, 없으면 `~\.codex`다. 다른 위치에 설치하려면 모든 명령에 `-CodexHome <경로>`를 붙인다.

## 2. Claude Code에서 쓰기 (권장 방법, 수동)

이 작업을 해 주는 스크립트는 없다. 권장 방법은 이 저장소를 **로컬 수정 없는 별도 클론**으로 두고, Claude Code 스킬 폴더에서 그 클론의 `skills\joeness-setup`으로 junction을 거는 것이다.

```powershell
git clone https://github.com/JOEWRKS/JOENESS.git <클론>
New-Item -ItemType Junction -Path <스킬폴더>\joeness-setup -Target <클론>\skills\joeness-setup
```

- `<스킬폴더>`: 모든 프로젝트에서 쓰려면 `~\.claude\skills`, 한 작업 공간에서만 쓰려면 `<작업공간>\.claude\skills`. 개발자는 작업 공간 쪽을 쓴다.
- 갱신: `git -C <클론> pull --ff-only`. 클론에서 직접 고치지 않는다(fast-forward가 막힌다).
- 확인: `git -C <클론> status`가 깨끗하고, `<클론>\vendor\source-manifest.json`의 `release.version`이 원하는 버전인지 본다. Claude Code 쪽에는 `-Check` 같은 설치 상태 명령이 없다.

## 3. 프로젝트 연결

프로젝트를 연 **새 채팅**에서 요청한다.

- 새 프로젝트: `이 프로젝트에 JOENESS 설치해줘. 목표는 [목표]. 만들 문서와 기록 범위를 먼저 보여줘.`
- 기존 프로젝트: `이 프로젝트에 JOENESS 설치해줘. 기존 계획·결과·승인 근거를 보존하고 정리안을 먼저 보여줘.`
- 변경안을 확인한 뒤: `이대로 적용해줘.`

에이전트는 `project-setup.ps1 -Check -ProjectPath <프로젝트>`로 상태를 본 뒤, 승인을 받으면 `-Apply`에 해시 세 개와 연결문을 넘겨 실행한다. 바뀌는 것은 `<프로젝트>\AGENTS.md`의 JOENESS 구역과 `.joeness\setup-state.json`, 그리고 승인한 ROADMAP·TASK·ISSUES·DESIGN 문서뿐이다. Git 프로젝트여야 한다.

## 4. 첫 사용

`로드맵에서 다음으로 가능한 작업을 이어서 진행해.`

작업이 끝나면 에이전트가 작업·업데이트 파일·이슈·해결·남은 문제·다음 작업 여섯 항목으로 먼저 보고한다.

## 5. 상태 확인

```powershell
powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
powershell.exe -NoProfile -File "$HOME\.codex\skills\joeness-setup\scripts\project-setup.ps1" -Check -ProjectPath <프로젝트>
```

- 첫 명령은 클론 폴더에서 실행한다. `current`면 개인 설치가 이 패키지와 같다.
- 두 번째 명령은 Codex에 설치된 사본을 쓴다. Claude Code만 쓴다면 `<클론>\skills\joeness-setup\scripts\project-setup.ps1`로 바꾼다. 결과가 `current`면 연결 구역이 마지막으로 적용한 상태 그대로다.
- 주의: 이 검사는 패키지의 최신 연결문과 비교하지 **않는다**. 패키지를 올려도 기존 프로젝트는 `current`로 나온다. 새 연결문을 반영하려면 채팅에서 `현재 프로젝트의 JOENESS 연결과 로드맵을 확인해줘. 빠진 부분의 변경안을 먼저 보여줘.`라고 요청한다.

## 6. 업그레이드 (예: 1.4.2 → 2.0.0)

버전이 다른 설치본이 있으면 새 패키지의 `-Check`는 항상 `blocked`다. 덮어쓰지 말고, **설치할 때 쓴 옛 패키지로 먼저 제거**한다.

```powershell
git clone https://github.com/JOEWRKS/JOENESS.git JOENESS-old
cd JOENESS-old
git checkout JOENESS-v1.4.2
powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
powershell.exe -NoProfile -File .\JOENESS.ps1 -Remove
```

옛 패키지의 `-Check`가 `current`일 때만 `-Remove`한다(`current`가 아니면 그 태그가 설치본과 다르다는 뜻이다). 그다음 새 패키지 폴더로 돌아가 설치한다.

```powershell
cd ..\JOENESS
git pull --ff-only
powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
powershell.exe -NoProfile -File .\JOENESS.ps1 -Apply
powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
```

순서대로 `ready` → `current` → `current`가 나와야 한다. Claude Code 쪽은 `git -C <클론> pull --ff-only`만 하면 된다. 이미 연결된 프로젝트는 자동으로 바뀌지 않는다(5절 주의 참고). 백업과 복구는 [설치·업데이트·복구](installation.md)를 본다.

## 7. 프로젝트 연결 해제

프로젝트를 연 채팅에서 `이 프로젝트에서 JOENESS 연결을 해제해줘.`라고 요청한다. 에이전트가 새로 `-Check`를 한 뒤 `-Detach`를 실행한다(해시 인자가 필요해서 사람이 직접 치는 명령은 없다). 연결 구역만 빠지고 일반 문서와 작업 이력은 남는다. 선택형 hook을 켰다면 [changes-hook 안내](../skills/joeness-setup/references/changes-hook.md)대로 따로 끈다.

## 8. 패키지 제거

설치에 쓴 **같은 패키지 폴더**에서 실행한다.

```powershell
powershell.exe -NoProfile -File .\JOENESS.ps1 -Remove
```

결과는 `removed`다. 프로젝트 연결은 지워지지 않는다(7절은 따로). Claude Code 쪽은 junction만 지운다: `cmd /c rmdir "<스킬폴더>\joeness-setup"`. `rmdir`은 junction만 지우고 클론은 남긴다(Windows PowerShell 5.1의 `Remove-Item -Recurse`는 대상 폴더 내용까지 지울 수 있으니 쓰지 않는다).
