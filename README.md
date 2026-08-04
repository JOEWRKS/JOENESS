# JOENESS 0.1 Beta

[한국어](#한국어-설명) · [English](#english-guide)

## 한국어 설명

JOENESS는 Windows용 Codex에 프로젝트 맥락 관리와 선별된 작업 스킬을 더하는 개인용 Beta 작업환경입니다. Codex 자체의 성능을 무조건 높이는 도구가 아니라, 긴 프로젝트에서 범위 이탈·허위 완료·불필요한 재작업을 줄이고 필요한 스킬을 필요한 순간에만 쓰도록 돕습니다.

> **현재 상태:** `personal-pilot Beta candidate`. 개인 실사용을 시작할 수 있는 단계지만 stable 또는 범용 배포판으로 인증되지는 않았습니다. 전역 Common Core 규칙은 검증 결과 비활성화되어 있습니다.

### 무엇을 해주나요?

- 프로젝트별 목표·제약·검증 기준을 `AGENTS.md`에 최소한으로 남깁니다.
- UI/UX 작업에는 디자인 스킬과 UI UX Pro Max·Apple Design 참고자료를 조건부로 사용합니다.
- 다음 작업이나 다른 사람에게 넘길 때 현재 파일과 Git 상태에 연결된 짧은 인수인계를 만들 수 있습니다.
- 설치 파일의 hash, 기존 파일 충돌, 외부 수정(drift)을 확인하고 모르는 파일을 강제로 덮어쓰지 않습니다.

다음 기능은 포함하지 않습니다.

- Codex, Figma, 브라우저 또는 외부 플러그인의 설치·로그인·설정
- 프로젝트 코드나 디자인의 자동 생성
- 자동 업데이트, Windows 앱 등록, 백업 자동 복원
- 모든 작업에 강제로 적용되는 긴 전역 프롬프트

### 준비물

- Windows와 Codex
- Windows PowerShell 5.1 이상(`powershell.exe`)
- 이 저장소의 신뢰할 수 있는 commit 또는 SHA-256을 확인한 ZIP

설치 자체에는 Node.js, Python, npm, Git 또는 관리자 권한이 필요하지 않습니다. Git은 저장소를 clone하거나 개발·공유할 때만 필요합니다.

### 처음 설치하기: 화면을 보면서 그대로 따라 하세요

#### 1단계: 받은 파일의 압축을 풉니다

1. 받은 JOENESS ZIP 파일을 마우스 오른쪽 버튼으로 누릅니다.
2. **모두 압축 풀기**를 누릅니다.
3. 압축이 풀린 폴더를 엽니다.
4. 폴더 안에 `JOENESS-0.1.ps1` 파일이 보이는지 확인합니다.

Git 사용에 익숙한 사람만 다음 방법을 대신 사용하면 됩니다.

```powershell
git clone https://github.com/JOEWRKS/joewrks-work-harness.git
```

#### 2단계: 그 폴더에서 PowerShell을 엽니다

1. `JOENESS-0.1.ps1`이 보이는 파일 탐색기 창을 그대로 둡니다.
2. 파일 탐색기 위쪽의 **주소창**을 한 번 클릭합니다.
3. 주소를 지우고 `powershell`이라고 입력합니다.
4. Enter 키를 누릅니다.
5. 파란색 또는 검은색 PowerShell 창이 열리면 준비가 끝난 것입니다.

#### 3단계: 아래 명령을 한 줄씩 복사합니다

먼저 설치 가능한 상태인지 확인합니다. **이 단계에서는 아직 설치하지 않습니다.**

```powershell
powershell.exe -NoProfile -File .\JOENESS-0.1.ps1 -Check
```

출력에서 `"status":"ready"`가 보이면 아래 설치 명령으로 진행합니다. `"status":"current"`가 보이면 이미 설치된 상태이므로 설치 명령을 건너뛰고 4단계로 이동합니다. `blocked` 또는 `unknown`이 보이면 설치하지 말고 출력 전체를 Codex에 붙여 넣어 해결 방법을 물어봅니다.

설치 명령을 복사하고 Enter 키를 누릅니다.

```powershell
powershell.exe -NoProfile -File .\JOENESS-0.1.ps1 -Apply
```

`-Apply` 결과가 `"status":"current"`이면 다음 확인 단계로 진행합니다. `blocked`, `failed`, `unknown` 중 하나가 보이면 더 실행하지 말고 출력 전체를 Codex에 붙여 넣습니다.

마지막으로 설치가 끝났는지 확인합니다.

```powershell
powershell.exe -NoProfile -File .\JOENESS-0.1.ps1 -Check
```

출력에 `"status":"current"`가 보이면 설치가 끝난 것입니다. PowerShell 창은 닫아도 됩니다.

#### 4단계: Codex에서 새 작업을 엽니다

1. Codex를 엽니다.
2. 기존 작업을 이어 쓰지 말고 **새 작업**을 만듭니다.
3. 작업할 프로젝트 폴더를 Codex에서 엽니다.

새 작업을 여는 이유는 방금 설치한 스킬 목록을 Codex가 다시 읽게 하기 위해서입니다.

#### 5단계: 프로젝트를 처음 사용할 때 설정합니다

새 작업의 채팅창에 다음 문장을 그대로 붙여 넣습니다.

```text
$joewrks-project-setup 이 프로젝트의 목표, 현재 구조, 실행·테스트 방법을 읽고 지속 작업 규칙으로 최소 설정해줘.
```

설정이 끝난 뒤부터는 평소처럼 요청하면 됩니다.

```text
현재 작업 이어서 구현해줘.
로그인 화면을 만들어줘.
오류 원인을 찾아서 수정해줘.
```

아래 스킬을 매번 직접 부를 필요는 없습니다. 해당 절차를 **이번 작업에서 꼭 적용하라고 명시하고 싶을 때만** 사용합니다.

- UI/UX 작업에 디자인 절차를 확실히 적용: `$joewrks-design-frontend`
- 새 작업이나 다른 사람에게 현재 상태 전달: `$handoff`
- 프로젝트의 지속 규칙을 다시 설정: `$joewrks-project-setup`

`joewrks-project-setup`은 프로젝트의 JOEWRKS 관리 블록만 만들거나 갱신하며 코드·디자인·의존성을 바꾸지 않습니다. Figma와 브라우저 검증은 해당 플러그인과 권한이 따로 있을 때만 사용할 수 있습니다.

### 설치하면 무엇이 생기나요?

설치만으로 현재 프로젝트의 코드나 디자인이 바뀌지는 않습니다. JOENESS는 사용자용 Codex 설정 폴더에 다음 도우미를 준비합니다.

- **프로젝트 설정 도우미 — `joewrks-project-setup`:** 프로젝트의 목표, 중요한 문서, 실행·테스트 방법을 짧은 지속 규칙으로 정리합니다. 처음 사용할 때 직접 요청하고, 목표나 규칙을 바꾸고 싶을 때 다시 요청할 수 있습니다.
- **디자인·프론트엔드 도우미 — `joewrks-design-frontend`:** 의미 있는 UI/UX 작업에서 디자인 기준, 접근성, 반응형 화면과 검증 방법을 선택해서 사용합니다. 관련 작업이면 자동으로 선택될 수 있습니다.
- **인수인계 도우미 — `handoff`:** 새 작업이나 다른 사람이 이어갈 때 현재 파일·Git·검사 결과를 짧게 정리합니다. 사용자가 직접 요청할 때만 문서를 만듭니다.
- **UI UX Pro Max·Apple Design 참고자료:** 디자인 도우미가 필요할 때 찾아보는 내부 참고자료입니다. 사용자가 별도로 실행할 프로그램은 아닙니다.
- **설치 기록과 백업:** JOENESS가 설치한 파일만 나중에 안전하게 업데이트하거나 제거하기 위한 기록입니다. 기존 파일을 강제로 덮어쓰지 않도록 돕습니다.

Figma·브라우저·외부 플러그인은 설치되지 않습니다. 필요하면 각각 별도로 설치하고 연결해야 합니다.

<details>
<summary>정확한 설치 위치가 궁금한 경우에만 펼쳐보기</summary>

아래는 별도 경로 옵션이나 `CODEX_HOME`을 설정하지 않았을 때의 위치입니다.

| 항목 | 기본 위치 |
|---|---|
| 설치 상태 파일 | `%USERPROFILE%\.codex\joewrks-harness-state.json` |
| 전역 규칙이 없는 빈 관리 구역 | `%USERPROFILE%\.codex\AGENTS.md` |
| 세 가지 스킬 | `%USERPROFILE%\.agents\skills` |
| 디자인 참고자료 | `%USERPROFILE%\.agents\vendor` |
| 실행별 백업 | `%LOCALAPPDATA%\JOEWRKS\work-harness\backups` |

사용자 지정 위치가 필요하면 `-CodexHome`, `-AgentsHome`, `-BackupRoot`를 지정할 수 있습니다. 업데이트와 제거에도 처음 사용한 것과 같은 경로를 사용해야 합니다.

</details>

### PowerShell 창에 나온 설치 결과·오류 확인하기

이 부분은 **Codex 채팅에 프롬프트를 입력한 뒤 보는 내용이 아닙니다.** 앞에서 연 PowerShell 창에 JOENESS 설치 명령을 입력하면 긴 글이 나오는데, 그중 `"status":"단어"` 부분만 찾으면 됩니다.

| 보이는 단어 | 쉬운 뜻 | 내가 할 일 |
|---|---|---|
| `ready` | 설치하거나 업데이트할 준비가 됨 | `-Apply` 명령을 실행합니다. |
| `current` | 설치가 정상적으로 끝났고 최신 상태임 | PowerShell을 닫고 Codex를 사용합니다. |
| `blocked` | 기존 파일 충돌 등을 발견해 아무것도 덮어쓰지 않고 멈춤 | 강제로 설치하지 말고 출력 전체를 Codex에 붙여 넣습니다. |
| `unknown` | 설치 또는 복구 결과를 확실히 판단할 수 없음 | 같은 명령을 반복하지 말고 출력 전체를 Codex에 붙여 넣습니다. |
| `failed` | 설치에 실패했지만 변경 내용은 되돌린 상태 | 출력 전체를 Codex에 붙여 넣어 원인을 확인합니다. |
| `removed` | 제거가 끝났거나 제거할 JOENESS 설치 기록이 없었음 | 제거가 목적이었다면 작업을 끝냅니다. |

정상적인 첫 설치에서는 보통 `-Check` 후 `ready` → `-Apply` 후 `current` → 마지막 `-Check` 후 `current` 순서로 보입니다.

<details>
<summary>개발자용 exit code 보기</summary>

`current`, `ready`, `removed`는 exit `0`, `failed`는 `1`, `blocked`는 `2`, `unknown`은 `3`입니다.

</details>

### 업데이트와 제거

업데이트는 새 commit 또는 검증한 새 ZIP에서 다시 `-Check` → `-Apply` → `-Check` 순서로 실행합니다. 자동 updater는 없습니다.

설치한 항목을 제거하려면 설치에 사용한 소스 묶음 또는 호환되는 새 버전에서 실행합니다.

```powershell
powershell.exe -NoProfile -File .\JOENESS-0.1.ps1 -Remove
```

`-Remove`는 state와 현재 hash로 소유권이 확인된 파일과 관리 블록만 제거합니다. 다른 `AGENTS.md` 내용과 무관한 `.agents` 파일은 보존합니다. no-state `removed`는 유효한 state나 알려진 차단 증거를 찾지 못했고 관리 파일을 변경하지 않았다는 뜻일 뿐, 인식하지 못한 vendor residue까지 모두 없다는 증명은 아닙니다.

백업에는 이전 `AGENTS.md`와 state가 들어갈 수 있으므로 개인 정보처럼 취급하십시오. 성공 상태와 복구 필요 여부를 확인한 뒤에만 사용자가 직접 삭제합니다.

### 문제가 생겼을 때

- PowerShell ExecutionPolicy가 기본 명령을 막을 때만 출처의 commit 또는 ZIP hash를 먼저 확인하고 다음 fallback을 사용합니다.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\JOENESS-0.1.ps1 -Check
```

- 비어 있지 않은 `.codex\AGENTS.override.md`, 같은 이름의 기존 unmanaged 스킬, 설치 뒤 수정된 관리 파일, 잘못된 marker, junction·symlink 경로는 안전을 위해 `blocked`가 될 수 있습니다. `--force` 옵션은 없습니다.
- `-Apply`는 실제 쓰기 직전에 전체 검사를 다시 수행하고, 대상 변경 전 실행별 백업을 만듭니다.

### 압축을 푼 JOENESS 폴더 안의 파일·폴더 설명

여기서 말하는 이름은 인터넷 주소나 설치된 위치가 아닙니다. **ZIP 압축을 풀었을 때 파일 탐색기에 보이는 파일과 노란색 폴더의 이름**입니다. 이름 끝에 `/`가 있으면 폴더입니다.

일반 사용자는 `README.md`와 `JOENESS-0.1.ps1` 두 파일만 알면 됩니다. 나머지는 설치기가 내부에서 사용하므로 이름을 바꾸거나 삭제하지 않습니다.

| 탐색기에 보이는 이름 | 쉽게 말하면 | 일반 사용자가 할 일 |
|---|---|---|
| `README.md` | 지금 읽고 있는 설치·사용 설명서 | 사용법이 궁금할 때 엽니다. |
| `JOENESS-0.1.ps1` | JOENESS 설치·확인·제거를 시작하는 파일 | 앞의 PowerShell 명령에서 사용합니다. |
| `harness.ps1` | 예전 파일명을 위한 호환용 설치 파일 | 새 사용자는 사용하지 않습니다. |
| `scripts/` | 실제 설치 작업을 처리하는 내부 폴더 | 열거나 수정할 필요가 없습니다. |
| `skills/` | 설치할 프로젝트 설정·디자인·인수인계 도우미 원본 | 직접 실행하지 않습니다. |
| `vendor/` | 디자인 참고자료와 설치 목록·라이선스가 든 폴더 | 삭제하거나 이름을 바꾸지 않습니다. |
| `tests/` | 설치기가 제대로 작동하는지 개발자가 검사하는 폴더 | 일반 사용자는 사용하지 않습니다. |
| `evals/` | 어떤 하네스 구성이 나았는지 비교한 실험 기록 | 일반 사용자는 읽지 않아도 됩니다. |
| `docs/` | JOENESS를 설계하고 만든 과정의 문서 | 일반 사용자는 읽지 않아도 됩니다. |
| `AGENTS.md` | 이 JOENESS 저장소를 개발할 때만 쓰는 작업 규칙 | 설치된 전역 규칙이 아니므로 건드리지 않습니다. |
| `common-core.md` | 사용하지 않기로 결정한 과거 규칙의 평가 기록 | 현재 설치되지 않으므로 사용하지 않습니다. |

<details>
<summary>개발자용 검증 기록과 테스트 명령 보기</summary>

현재 판정과 검증 범위는 [JOENESS 0.1 Beta 검증 원장](evals/JOENESS-0.1-BETA-VALIDATION.md), 설치 대상과 고정 hash는 [source manifest](vendor/source-manifest.json)에서 확인할 수 있습니다. 과거 A/B 결과는 현재 JOENESS의 성능 보증이 아닙니다.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\sync-harness.tests.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\project-setup.tests.ps1
node --test .\tests\design-vendor-integrity.tests.mjs
```

</details>

## English Guide

JOENESS is a personal Beta work environment that adds project-context management and selected task skills to Codex on Windows. It is not a guaranteed performance booster. Its purpose is to reduce scope drift, false completion claims, and avoidable rework in long projects while loading specialist guidance only when useful.

> **Current status:** `personal-pilot Beta candidate`. It is ready for personal pilots, but it is not certified as stable or share-ready. Validation disabled the global Common Core rule layer.

### What it does

- Persists a small project-specific contract in `AGENTS.md` when explicitly requested.
- Conditionally supplies UI/UX guidance from UI UX Pro Max and Apple Design.
- Creates an evidence-linked handoff when explicitly requested.
- Checks source hashes, collisions, and installed-file drift instead of force-overwriting unknown content.

It does not install Codex, Figma, browser capabilities, or external plugins. It does not generate project code or designs during installation, provide an automatic updater or backup restore command, or inject a long global prompt into every task.

### Install: follow these steps exactly

You need Windows, Codex, and Windows PowerShell 5.1 or later. The installer itself does not require Node.js, Python, npm, Git, network access, or administrator rights.

1. Extract the JOENESS ZIP.
2. Open the extracted folder and confirm that `JOENESS-0.1.ps1` is visible.
3. Click the File Explorer address bar.
4. Replace the address with `powershell` and press Enter.
5. In the PowerShell window, paste each command below one at a time.

First, inspect whether installation can proceed. This does not install anything.

```powershell
powershell.exe -NoProfile -File .\JOENESS-0.1.ps1 -Check
```

If the result is `ready`, continue to Apply. If it is `current`, JOENESS is already installed, so skip Apply and continue to “Start using it.” If it is `blocked` or `unknown`, do not install—paste the complete output into Codex and ask how to resolve it.

When the result is `ready`, run the installation command:

```powershell
powershell.exe -NoProfile -File .\JOENESS-0.1.ps1 -Apply
```

Continue only if Apply reports `"status":"current"`. If it reports `blocked`, `failed`, or `unknown`, run nothing else and paste the complete output into Codex.

Finally, confirm the installed state:

```powershell
powershell.exe -NoProfile -File .\JOENESS-0.1.ps1 -Check
```

The final Check must report `"status":"current"`. `harness.ps1` remains a compatibility alias; new users should use `JOENESS-0.1.ps1`.

### Start using it

1. Open Codex and create a new task so it refreshes the installed skill list.
2. Open the project folder you want to work on.
3. Paste this when first setting up the project. Repeat it later only when its durable goals or rules need to change:

```text
$joewrks-project-setup read this project's goal, structure, run commands, and tests, then persist the smallest durable work contract.
```

After setup, ask for work normally. You do not need to name a skill every time. Use `$joewrks-design-frontend` only when you want to require the design workflow explicitly, and `$handoff` when another task or person must resume the verified state.

The package includes the explicit-only `handoff` skill. When the user explicitly requests `$joewrks-project-setup` or `setup`, `configure`, `persist`, or `apply` of a durable JOEWRKS project contract, that skill may update only its managed block in the project-root `AGENTS.md`; it does not change code, design, or dependencies.

Figma and browser verification require separately available plugins and permissions. JOENESS neither installs those capabilities nor certifies their output.

### What gets installed?

Installation alone does not change the code or design in your current project. JOENESS prepares these helpers in your user-level Codex configuration:

- **Project setup helper — `joewrks-project-setup`:** Turns the project's goals, important documents, run commands, and tests into a small durable contract. Request it explicitly the first time, and request it again whenever you want to change the durable goals or rules.
- **Design and frontend helper — `joewrks-design-frontend`:** Selects relevant design guidance, accessibility checks, responsive behavior, and verification for meaningful UI/UX work. Codex may select it automatically when relevant.
- **Handoff helper — `handoff`:** Records a compact summary linked to current files, Git, and observed checks when another task or person must continue. It writes a handoff only when explicitly requested.
- **UI UX Pro Max and Apple Design references:** Internal reference material consulted by the design helper when useful. They are not separate programs for the user to run.
- **Installation state and backups:** Let JOENESS update or remove only files it can prove it installed, instead of force-overwriting existing content.

Figma, browser capabilities, and external plugins are not installed. Install and connect them separately when needed.

<details>
<summary>Show exact default locations</summary>

These locations apply when no custom path arguments or `CODEX_HOME` are set.

| Item | Default location |
|---|---|
| Installation state | `%USERPROFILE%\.codex\joewrks-harness-state.json` |
| Empty managed area with no global rules | `%USERPROFILE%\.codex\AGENTS.md` |
| Three skills | `%USERPROFILE%\.agents\skills` |
| Design references | `%USERPROFILE%\.agents\vendor` |
| Per-run backups | `%LOCALAPPDATA%\JOEWRKS\work-harness\backups` |

Use `-CodexHome`, `-AgentsHome`, and `-BackupRoot` only when custom locations are required. Reuse the same locations for updates and removal.

</details>

### Read the JOENESS installer result in PowerShell — not a Codex prompt

This section is **not about the response after entering a prompt in Codex chat**. When you run a JOENESS installation command in the PowerShell window opened earlier, it prints a long result. Find only the `"status":"word"` part.

| Word shown | Plain meaning | What to do |
|---|---|---|
| `ready` | Installation or update can proceed | Run the `-Apply` command. |
| `current` | Installation is complete and matches this version | Close PowerShell and use Codex. |
| `blocked` | JOENESS found a conflict and stopped without force-overwriting it | Do not force installation; paste the complete output into Codex. |
| `unknown` | The final install or recovery state cannot be determined | Do not rerun the same command; paste the complete output into Codex. |
| `failed` | Installation failed, but its changes were rolled back | Paste the complete output into Codex to diagnose the cause. |
| `removed` | Removal completed, or no owned JOENESS installation state was found | If removal was your goal, stop here. |

A normal first installation usually reads `ready` after the first Check → `current` after Apply → `current` after the final Check.

An unresolved target or incomplete rollback prevents a final-state claim. For `unknown`, do not blindly rerun: inspect `backupPath`, `rollback`, `unresolvedTargets`, and the actual files first.

<details>
<summary>Show developer exit codes</summary>

`current`, `ready`, and `removed` use exit `0`; `failed` uses `1`; `blocked` uses `2`; `unknown` uses `3`.

</details>

### Update and remove

To update, obtain a new trusted revision and run Check → Apply → Check again with the same custom path arguments, if any. There is no automatic updater.

```powershell
powershell.exe -NoProfile -File .\JOENESS-0.1.ps1 -Remove
```

Removal deletes only files and the managed block whose ownership is proven by valid state and current hashes. A no-state `removed` result means no valid state or recognized blocking evidence was found and no managed files were changed; it does not prove that every unrecognized or vendor residue is absent.

Backups may contain prior state and the user's `AGENTS.md`; treat them as private. They are not pruned automatically and there is no automatic restore command.

If the default command is blocked by ExecutionPolicy, verify the source commit or ZIP hash before using this fallback:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\JOENESS-0.1.ps1 -Check
```

### Files and folders inside the extracted JOENESS folder

These names are not web addresses or installed locations. They are the files and yellow folders shown in File Explorer after extracting the ZIP. A name ending in `/` is a folder.

Most users need only `README.md` and `JOENESS-0.1.ps1`. The installer uses everything else internally, so do not rename or delete those items.

| Name shown in File Explorer | Plain meaning | What a regular user should do |
|---|---|---|
| `README.md` | The installation and usage guide you are reading | Open it when you need instructions. |
| `JOENESS-0.1.ps1` | Starts JOENESS installation, checking, and removal | Use it through the PowerShell commands above. |
| `harness.ps1` | Compatibility file for the older installer name | New users should ignore it. |
| `scripts/` | Internal folder that performs the actual installation | Do not edit it. |
| `skills/` | Source copies of the project setup, design, and handoff helpers | Do not run them directly. |
| `vendor/` | Design references, the install inventory, and license notices | Do not delete or rename it. |
| `tests/` | Developer checks for the installer and bundled files | Regular users do not use it. |
| `evals/` | Historical experiments comparing harness candidates | Regular users do not need to read it. |
| `docs/` | Documents recording how JOENESS was designed and built | Regular users do not need to read it. |
| `AGENTS.md` | Work rules used only while developing this JOENESS repository | It is not an installed global rule; leave it unchanged. |
| `common-core.md` | Evaluation record for a retired rule set | It is not currently installed or used. |

<details>
<summary>Show developer evidence, sharing, and test commands</summary>

- Repository `common-core.md`: retained evaluation evidence and not installed by the current manifest.
- Native Codex handles broad requests; persist only project-specific facts and gates in the project `AGENTS.md`.
- Do not add a separate `HARNESS.md`.

See the [Beta validation ledger](evals/JOENESS-0.1-BETA-VALIDATION.md) for the current verdict and limitations, and the [source manifest](vendor/source-manifest.json) for the installed inventory and hashes.

For direct sharing, package only the exact committed revision:

```powershell
$revision = (git rev-parse --short=12 HEAD).Trim()
$archive = ".\JOENESS-0.1-$revision.zip"
git archive --format=zip --output $archive HEAD
Get-FileHash $archive -Algorithm SHA256
```

Before sharing, run and record an exact-HEAD archive review and deliver the archive SHA-256 out of band. The manifest proves internal source consistency; it does not authenticate who supplied the archive.

</details>
