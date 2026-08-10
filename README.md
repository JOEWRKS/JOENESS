# JOENESS

> 0.1 Beta

[한국어](#한국어) · [English](#english-guide)

## 한국어

JOENESS는 Windows용 Codex 작업환경입니다. 프로젝트 맥락, UI/UX 설계, 시각 결과 확인, 인수인계를 필요한 작업에서만 돕습니다.

### 처음 사용: 5단계

1. 받은 ZIP을 **전체 압축 해제**합니다. `JOENESS.ps1`만 따로 옮기지 마세요.
2. 압축을 푼 폴더를 파일 탐색기로 열고, 위쪽 주소창에 `powershell`을 입력한 뒤 Enter를 눌러 PowerShell을 엽니다.
3. 설치 전 상태를 확인합니다.

   ```powershell
   powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
   ```

4. PowerShell 출력의 `"status":"ready"`일 때만 적용하고, 바로 다시 확인합니다.

   ```powershell
   powershell.exe -NoProfile -File .\JOENESS.ps1 -Apply
   powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
   ```

5. Codex를 재실행하거나 새 작업을 열고, `로그인 화면을 만들어줘`처럼 자연어로 요청합니다.

`ready`, `current`, `blocked` 같은 상태는 **PowerShell 출력**이며 Codex 채팅 답변이 아닙니다. `blocked`, `failed`, `unknown`이면 같은 명령을 반복하지 말고 PowerShell 출력 전체를 Codex에 붙여 넣으세요.

### 역할

| 호출명 | 하는 일 | 자동 선택 조건 |
|---|---|---|
| `$project` | 오래 이어질 프로젝트의 작업 맥락과 계획을 정리 | 쓸 수 있는 계획이 없는 장기 프로젝트 |
| `$design` | UI/UX 설계와 구현을 돕기 | UI/UX 설계 또는 구현이 필요한 작업 |
| `$visual-check` | 새로 만들거나 수정한 시각 결과물을 완료 전에 직접 확인하고, 승인된 이미지를 다른 크기·형식으로 옮기거나 화면·움직임 문제를 검증 | 화면·이미지·움직임 결과가 생겼을 때, 승인된 이미지를 다른 크기·형식으로 옮길 때, 또는 재현 가능한 시각 결함이 있을 때 |
| `$handoff` | 다음 작업을 위한 짧은 인수인계를 만듦 | 자동 선택하지 않음; 요청할 때만 사용 |

UI UX Pro Max와 Apple Design은 `$design` 내부 참고자료입니다.

### 외부 플러그인

Figma, Superpowers, Ponytail은 JOENESS와 **별도로 설치**하는 외부 플러그인입니다. 관련 작업에서만 선택되며, JOENESS 설치가 이를 대신 설치하거나 모든 작업에서 실행하지 않습니다.

| 플러그인 | 관련 작업 |
|---|---|
| Figma | 실제 Figma 파일 작업 |
| Superpowers | 복잡한 계획·디버깅·검토 |
| Ponytail | 과설계 점검 |

### 업데이트와 제거

새 ZIP을 전체 압축 해제한 뒤 같은 순서로 `-Check`를 실행합니다. 제거가 필요할 때만 전체 패키지 폴더에서 실행합니다.

```powershell
powershell.exe -NoProfile -File .\JOENESS.ps1 -Remove
```

### 호환 이름

| 이전 이름 | 현재 이름 |
|---|---|
| `JOENESS-0.1.ps1` / `harness.ps1` | `JOENESS.ps1` |
| `$joewrks-project-setup` | `$project` |
| `$joewrks-design-frontend` | `$design` |

## English Guide

JOENESS is a Windows Codex work environment. It helps with project context, UI/UX design, visual-result checks, and handoffs only when a task needs them.

### First use: five steps

1. **Extract the complete ZIP.** Do not move `JOENESS.ps1` by itself.
2. Open the extracted folder in File Explorer, type `powershell` in the address bar, and press Enter.
3. Check the installation state.

   ```powershell
   powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
   ```

4. Only when PowerShell reports `"status":"ready"`, apply it and check again.

   ```powershell
   powershell.exe -NoProfile -File .\JOENESS.ps1 -Apply
   powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
   ```

5. Restart Codex or open a new task, then make a natural-language request such as “Build a login screen.”

Statuses such as `ready`, `current`, and `blocked` are **PowerShell output**, not a Codex chat response. For `blocked`, `failed`, or `unknown`, do not repeat the command; paste the complete PowerShell output into Codex.

### Roles

| Call | What it does | Automatic selection condition |
|---|---|---|
| `$project` | Organizes durable project context and planning | A long-running project has no usable plan |
| `$design` | Helps with UI/UX design and implementation | The task needs UI/UX design or implementation |
| `$visual-check` | Directly checks a created or changed visual output before completion, and also moves an approved image to another size or format or verifies screen and motion problems | When a screen, image, or motion result is created or changed, when moving an approved image to another size or format, or when a reproducible visual defect needs checking |
| `$handoff` | Creates a brief handoff for the next task | Never automatic; use it when requested |

UI UX Pro Max and Apple Design are reference material inside `$design`.

### External plugins

Figma, Superpowers, and Ponytail are external plugins installed **separately** from JOENESS. They are selected only when relevant; JOENESS neither installs them nor runs all of them for every task.

| Plugin | Relevant work |
|---|---|
| Figma | Work on real Figma files |
| Superpowers | Complex planning, debugging, or review |
| Ponytail | Over-engineering checks |

### Update and remove

Extract the complete new ZIP, then repeat the Check step. Run removal only when needed from the complete package folder.

```powershell
powershell.exe -NoProfile -File .\JOENESS.ps1 -Remove
```

### Compatibility names

| Previous name | Current name |
|---|---|
| `JOENESS-0.1.ps1` / `harness.ps1` | `JOENESS.ps1` |
| `$joewrks-project-setup` | `$project` |
| `$joewrks-design-frontend` | `$design` |
