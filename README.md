# JOENESS

> 0.1 Beta

[한국어](#한국어) · [English](#english-guide)

## 한국어

JOENESS는 Windows용 Codex에 설치하는 작고 항상 적용되는 작업 안전 커널(모든 작업에 적용되는 작은 규칙 묶음)입니다. 사용자와 프로젝트의 권한, 요청 범위, 현재 상태, 외부 쓰기, 재시도, 완료 증거의 기본 안전선만 지킵니다.

설치한 뒤에는 JOENESS용 역할이나 호출명을 고를 필요 없이 평소처럼 작업하면 됩니다. Codex에 원하는 결과를 자연어로 요청하세요.

### 설치와 확인

1. 받은 ZIP을 **전체 압축 해제**합니다. `JOENESS.ps1`만 따로 옮기지 마세요.
2. 압축을 푼 폴더를 파일 탐색기로 열고, 위쪽 주소창에 `powershell`을 입력한 뒤 Enter를 눌러 PowerShell을 엽니다.
3. 설치 상태를 확인합니다.

   ```powershell
   powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
   ```

   `-Check`는 읽기 전용이며 파일을 바꾸지 않습니다. `ready`, `current`, `blocked` 같은 상태는 **PowerShell 출력**이며 Codex 채팅 답변이 아닙니다. `blocked`, `failed`, `unknown`이면 같은 명령을 반복하지 말고 PowerShell 출력 전체를 Codex에 붙여 넣으세요.

4. PowerShell 출력의 `"status":"ready"`일 때만 적용하고, 바로 다시 확인합니다.

   ```powershell
   powershell.exe -NoProfile -File .\JOENESS.ps1 -Apply
   ```

   ```powershell
   powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
   ```

5. Codex를 재실행하거나 새 작업을 엽니다. 설치한 뒤에는 `로그인 화면을 만들어줘`처럼 평소처럼 작업하면 됩니다.

### 업데이트와 제거

업데이트할 때도 새 ZIP을 전체 압축 해제하고 그 폴더에서 `-Check`를 먼저 실행합니다. `ready`일 때만 `-Apply`를 실행한 뒤 `-Check`로 다시 확인하세요.

`-Apply`는 변경 대상 파일을 백업하며, 되돌리기 위해 관리 블록 밖의 사용자 소유 내용까지 포함한 기존 `AGENTS.md` 전체를 백업할 수 있습니다. 실제 변경은 JOENESS가 소유한 관리 블록과 설치 파일로 제한합니다. 이전 JOENESS 0.1 갱신에서도 기록된 소유 파일만 교체·제거하고 사용자 소유 내용은 보존하며, 소유권이나 상태를 확인할 수 없으면 쓰지 않고 `blocked`로 멈춥니다.

제거는 설치에 사용한 전체 패키지 폴더에서 실행합니다.

```powershell
powershell.exe -NoProfile -File .\JOENESS.ps1 -Remove
```

`-Remove`는 기록된 소유권과 현재 파일 상태를 먼저 확인하고 JOENESS가 소유한 설치 파일과 관리 블록만 제거합니다. 사용자 소유 파일과 관리 블록 바깥 내용은 보존하며, 변경이나 소유권을 확인할 수 없으면 제거하지 않고 멈춥니다.

## English Guide

JOENESS is a small, always-on work-safety kernel—a small set of rules applied to every task—installed into Codex on Windows. It keeps a basic safety boundary around user and project authority, requested scope, current state, external writes, retries, and completion evidence.

After installation, work normally. You do not need to choose JOENESS roles or call names; ask Codex for the result you want in natural language.

### Install and check

1. **Extract the complete ZIP.** Do not move `JOENESS.ps1` by itself.
2. Open the extracted folder in File Explorer, type `powershell` in the address bar, and press Enter.
3. Check the installation state.

   ```powershell
   powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
   ```

   `-Check` is read-only and changes no files. Statuses such as `ready`, `current`, and `blocked` are **PowerShell output**, not a Codex chat response. For `blocked`, `failed`, or `unknown`, do not repeat the command; paste the complete PowerShell output into Codex.

4. Run Apply only when PowerShell reports `"status":"ready"`, then check again immediately.

   ```powershell
   powershell.exe -NoProfile -File .\JOENESS.ps1 -Apply
   ```

   ```powershell
   powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
   ```

5. Restart Codex or open a new task. After installation, work normally with a request such as “Build a login screen.”

### Update and remove

For an update, extract the complete new ZIP and run `-Check` from that folder first. Run `-Apply` only for `ready`, then run `-Check` again.

`-Apply` backs up affected files and may copy the entire pre-change `AGENTS.md`, including user-owned content outside its managed block, for rollback. It changes only JOENESS-owned installation files and the JOENESS managed block. A previous JOENESS 0.1 update likewise replaces or removes only recorded owned files and preserves user-owned content; if ownership or state cannot be verified, it performs no write and stops with `blocked`.

Run removal from the complete package folder used for the installation.

```powershell
powershell.exe -NoProfile -File .\JOENESS.ps1 -Remove
```

`-Remove` first verifies recorded ownership and current file state, then removes only JOENESS-owned installation files and its managed block. It preserves user-owned files and content outside the managed block; if a change or ownership cannot be verified, it stops without removing them.
