# JOENESS

> 0.1 Beta

[한국어](#한국어) · [English](#english-guide)

## 한국어

JOENESS는 Windows용 Codex 작업환경입니다. 프로젝트 맥락, 중요 작업의 구현·검토 분리, UI/UX 설계, 시각 결과 확인, 명세 요약, 인수인계를 필요한 작업에서만 돕습니다.

**JOENESS Core**는 모든 작업에서 보이는 얇은 안전 규칙입니다. 정상 작업에는 별도 보고 양식을 만들지 않고, 시각 결과나 영구 명세가 실제로 생긴 경우에만 알맞은 스킬로 넘깁니다.

보고할 때는 목표와 성공 조건, 중요한 작업 방식이나 변경, 완료·부분 완료·차단 상태, 직접 해결·우회·미해결 상태, 실제 결과와 검증, 남은 경계를 내부적으로 구분합니다. 사용자에게는 결과를 먼저 말하고 해당하는 내용만 자연스럽게 전달합니다. 고정 항목이나 줄 수를 강제하지 않으며, 빈칸을 채우거나 보고를 위해 별도 검사·문서·로그를 만들지 않습니다.

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
| `$ticket` | 중요한 계획 항목 하나를 구현 에이전트와 새 검토 에이전트로 분리해 합격 조건별로 확인 | 기존 계획이나 티켓에 관찰 가능한 합격 조건이 있고, 여러 파일·데이터·시각 결과·배포처럼 재검토 이득이 큰 작업 |
| `$design` | UI/UX 설계와 구현을 돕기 | UI/UX 설계 또는 구현이 필요한 작업 |
| `$visual-check` | 새로 만들거나 수정한 시각 결과물을 완료 전에 직접 확인하고, 승인된 이미지를 다른 크기·형식으로 옮기거나 화면·움직임 문제를 검증 | 화면·이미지·움직임 결과가 생겼을 때, 승인된 이미지를 다른 크기·형식으로 옮길 때, 또는 재현 가능한 시각 결함이 있을 때 |
| `$spec` | 파일로 만든 명세의 핵심 결정을 사용자 언어로 짧게 전달 | 영구 명세를 새로 만들거나 내용상 크게 고쳤을 때 |
| `$handoff` | 다음 작업을 위한 짧은 인수인계를 만듦 | 자동 선택하지 않음; 요청할 때만 사용 |

`$spec`은 최종 명세 파일을 다시 확인한 뒤 보고합니다. 프로젝트가 요구하지 않는 검토·승인 질문을 새로 만들지 않습니다.

새 장기 프로젝트에 계획이 없으면 `$project`, 기존 계획에 준비된 중요 작업이 있으면 `$ticket`을 사용합니다. 오타·읽기 전용 조사·단일 자동검사로 완전히 판정되는 저위험 수정에는 둘 다 붙이지 않습니다. `$ticket` 검토자는 구현자의 설명을 먼저 받지 않는 새 컨텍스트이지만 같은 Codex 계열과 권한을 쓰므로 객관성을 보증하는 외부 심판은 아닙니다.

자동 선택은 강제 후크가 아니라 **모델 라우팅(model routing)** 입니다. JOENESS Core가 시각 결과와 명세 전달 조건을 항상 알려 누락 가능성을 줄이지만, 특정 스킬 사용을 확실히 지정하려면 요청에 `$visual-check` 또는 `$spec`처럼 호출명을 적으세요.

UI UX Pro Max와 Apple Design은 JOENESS 설치 때 함께 복사되는 `$design` 내부 참고자료입니다. 별도 호출 스킬로 노출되지 않습니다.

### 외부 플러그인

Figma, Superpowers, Ponytail은 JOENESS와 **별도로 설치**하는 외부 플러그인입니다. JOENESS는 이 플러그인의 설치·활성화 설정을 바꾸지 않습니다.

| 플러그인 | JOENESS 권장 정책 |
|---|---|
| Figma | **conditional**: 실제 Figma 파일·노드·결과가 작업 대상일 때만 사용 |
| Superpowers | **explicit-only**: 사용자가 요청하거나 프로젝트가 요구한 복잡한 계획·디버깅·TDD에만 사용. 암묵 호출을 막을 수 없다면 기본 비활성화 |
| Ponytail | **default disabled**: 평소에는 끄고, 과설계 검토를 명시한 `review`·`audit`에만 사용 |

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

JOENESS is a Windows Codex work environment. It helps with project context, separated implementation and review for important work, UI/UX design, visual-result checks, specification summaries, and handoffs only when a task needs them.

**JOENESS Core** is the thin safety instruction visible in every task. It adds no special report format to clean work and routes only an actual visual result or persistent-specification delivery to the applicable skill.

For reporting, it internally separates the goal and success criteria, material method or deviation, complete/partial/blocked outcome, direct fix/workaround/unresolved handling, actual result and verification, and remaining boundary. It tells the user the outcome first and includes only applicable facts in natural prose. It imposes no fixed fields or line count and creates no check, document, or log merely to fill a report.

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
| `$ticket` | Separates one important planned item between an implementer and a fresh evaluator, then checks each acceptance criterion | An existing plan or ticket has observable acceptance criteria and independent rechecking is worthwhile for multi-file, data, visual, or deployment work |
| `$design` | Helps with UI/UX design and implementation | The task needs UI/UX design or implementation |
| `$visual-check` | Directly checks a created or changed visual output before completion, and also moves an approved image to another size or format or verifies screen and motion problems | When a screen, image, or motion result is created or changed, when moving an approved image to another size or format, or when a reproducible visual defect needs checking |
| `$spec` | Briefly delivers the key decisions in a persistent specification in the user's language | After creating or materially revising a persistent specification |
| `$handoff` | Creates a brief handoff for the next task | Never automatic; use it when requested |

`$spec` rechecks the final specification file before reporting. It does not invent a review or approval prompt that the project does not require.

Use `$project` when a new long-running project lacks a plan, and `$ticket` for an important prepared item in that plan. Skip both for typos, read-only investigation, or a low-risk change fully decided by one deterministic check. The `$ticket` evaluator starts with fresh context and does not receive the implementer's narrative first, but it uses the same Codex family and permissions and therefore is not an objective external judge.

Automatic selection is **model routing**, not a deterministic hook. JOENESS Core keeps the visual-result and specification-delivery conditions visible to reduce misses. To require a particular skill, include its call such as `$visual-check` or `$spec` in the request.

UI UX Pro Max and Apple Design are bundled with every JOENESS installation as internal `$design` references. They are not exposed as separate callable skills.

### External plugins

Figma, Superpowers, and Ponytail are external plugins installed **separately** from JOENESS. JOENESS does not change their installation or enablement settings.

| Plugin | JOENESS policy |
|---|---|
| Figma | **conditional**: only when a real Figma file, node, or result is the task target |
| Superpowers | **explicit-only**: only when requested or required by the project for complex planning, debugging, or TDD; default disabled if implicit invocation cannot be prevented |
| Ponytail | **default disabled**: enable only an explicitly requested `review` or `audit` for over-engineering |

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
