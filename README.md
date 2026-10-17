# JOENESS 1.0.1

[English](#english) | [한국어](#korean)

<a name="english"></a>

**English**

## 1. Summary

**Task sequence, progress, and remaining-work management.**

Three-point summary:

1. Project goals and completion criteria organized into a staged roadmap.
2. Dedicated documents for plans, results, issues, and design, with task-specific reading priorities.
3. Six-field summary first; supporting evidence only where needed.

Source version: **1.0.1**. [Validation and publication status](evals/joeness-setup/runs/2026-10-17-v101-release/review-evidence.md). No automatic update of personal installations or existing project connections.

## 2. Design Purpose

- Purpose: organize scattered plans and records; recover current status when resuming or handing off work.
- Focus: next eligible work, completed work, and outstanding verification.
- Replacement scope: duplicate current-progress trackers consolidated into one roadmap. Existing evidence and approval sources preserved.
- Outside scope: product definition, design judgment, development execution, and user approval.

## 3. Key Features

| File | Owned information |
|---|---|
| `AGENTS.md` | Working rules and document locations |
| `ROADMAP.md` | Goals, staged checklists, current status, and next work |
| `TASK.md` | Work results and verification evidence |
| `ISSUES.md` | Open issues, workarounds, and residual risks |
| `DESIGN.md` | Design standards and approval scope |

- Document organization: preservation and relocation within approved scope. Product-definition sources retained separately.
- Reference storage: `Library/` created when material exists; research and references grouped by topic.
- Reading order: relevant documents first. [Document responsibilities and reading order (Korean)](skills/joeness-setup/references/usage.md#문서-구조와-책임).

Example report:

- Work: reservation cancellation bug fixed.
- Updated files: reservation logic, tests, and work record.
- Issue: cancellation also deleted the reservation history.
- Resolution: status-only cancellation implemented and checked.
- Remaining problems: verification on the actual venue device pending.
- Next work: reservation and cancellation tests on that device.

Field meanings: `Issue` for encountered problems; `Resolution` for verified action; `Remaining problems` for unresolved or unverified work. Additional evidence only when needed. No mandatory report format for simple questions.

## 4. Usage

### Installation

Repository checkout in Windows PowerShell. For an existing download, start in that folder.

```powershell
git clone https://github.com/JOEWRKS/JOENESS.git
cd JOENESS
powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
```

| Check result | Action |
|---|---|
| `ready` | Installation commands below permitted |
| `current` | Same package already installed; no reinstall needed |
| `blocked` | Existing files preserved; no overwrite. Consult the [update and recovery guide (Korean)](docs/installation.md) |

```powershell
powershell.exe -NoProfile -File .\JOENESS.ps1 -Apply
powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
```

### Project setup

Open the intended Git project in Codex, then request setup.

- New project: `Install JOENESS in this project. The goal is [goal]. First show the proposed documents and recording scope.`
- Existing project: `Install JOENESS in this project. Preserve existing plans, results, and approval evidence. Show the organization proposal first.`
- Approve the proposal: `Apply this proposal.`
- Routine work: `Continue with the next eligible task in the roadmap.`

Personal tool installation and project-document setup are separate. Project files created or changed **only after proposal approval**. No per-task reinstall.

## 5. Tool Integration

| Tool | Role |
|---|---|
| [JOENESS](https://github.com/JOEWRKS/JOENESS) | Task sequence, progress, and completion evidence |
| [JOEFLOW](https://github.com/JOEWRKS/JOEFLOW) | Requirements, rules, exceptions, and acceptance criteria |
| [JOEDESIGN](https://github.com/JOEWRKS/JOEDESIGN) | UI creation, visual standards, and design review |

**Work organization → product definition → UI creation and review → development by the implementation owner → result verification → completed and remaining-work records.**

Reservation-feature handoff example:

- JOEFLOW → design and implementation owners: reservation/cancellation rules and acceptance criteria.
- Design owner → implementation and recording owners: UI standards and review results.
- Implementation owner → JOENESS records: development/test results and outstanding verification.
- JOENESS: links to each source; roadmap completion and remaining-work status updates.

JOENESS used throughout the workflow. **Standalone use supported for each tool.** No automatic execution of other tools or approval on the user's behalf. [Connect verification results to required outcomes](skills/joeness-setup/references/review-gate.md).

## 6. Limitations

- Supported environment: Codex, Windows PowerShell 5.1 or PowerShell 7 on Windows, UTF-8 documents in Git projects. Optional verification helpers require Node.js 18 or later.
- Undecided scope: unresolved goals remain pending. No invented completion or design approval.
- Separate checks: installation, document organization, instruction delivery, and work verification. No overall completion while required verification or user acceptance remains pending.
- Automation limits: no continuous monitoring, automatic updates, or enforced locking. No automatic update of existing projects or open conversations.
- Check reuse: only within an evidence-backed, bounded scope. No comprehensive CSS/dynamic-change analysis or automatic interception of completion claims in chat.
- Unproven: token savings, general performance superiority, and reliability across all environments.
- Excluded from records: passwords, credentials, and unnecessary personal data.

[Detailed usage, recording controls, and disconnecting (Korean)](skills/joeness-setup/references/usage.md) · [Installation checks, updates, and recovery (Korean)](docs/installation.md) · [Changelog (Korean)](docs/CHANGELOG.md) · [Development roadmap (Korean)](docs/ROADMAP.md) · [Windows checks](.github/workflows/windows-ci.yml)

---

<a name="korean"></a>

**한국어**

## 1. 핵심 요약

**작업 순서·진행 상태·남은 일 관리 도구.**

세줄요약:

1. 프로젝트 목표와 완료 조건을 단계별 로드맵으로 정리.
2. 계획·결과·문제·디자인의 기록 위치와 읽기 우선순위 구분.
3. 작업 결과를 여섯 항목으로 선요약. 필요한 근거만 후술.

소스 버전: **1.0.1**. [검증·게시 상태](evals/joeness-setup/runs/2026-10-17-v101-release/review-evidence.md). 개인 설치·기존 프로젝트 연결 자동 갱신 없음.

## 2. 설계 목적

- 목적: 흩어진 계획·기록의 정리, 작업 재개·인수인계 시 현재 상태 복원.
- 집중: 무엇부터 할지, 어디까지 끝났는지, 어떤 검증이 남았는지 구분.
- 대체 범위: 여러 문서에 중복된 현재 진행표를 단일 로드맵으로 정리. 기존 근거·승인 원본은 보존.
- 비대체 범위: 제품 기획·디자인 판정·개발 실행·사용자 승인.

## 3. 주요 기능

| 파일 | 담당 정보 |
|---|---|
| `AGENTS.md` | 작업 규칙·문서 위치 |
| `ROADMAP.md` | 목표·단계별 체크리스트·현재 상태·다음 작업 |
| `TASK.md` | 수행 결과·검증 근거 |
| `ISSUES.md` | 미해결 문제·우회책·남은 위험 |
| `DESIGN.md` | 디자인 기준·승인 범위 |

- 문서 정리: 승인 범위 내 기존 내용 보존·재배치. 제품 기준 원본 별도 유지.
- 자료 보관: 실제 자료 발생 시 `Library/` 생성, 주제별 조사·참고 저장.
- 조회 순서: 작업에 필요한 문서부터 확인. [문서별 책임·읽는 순서](skills/joeness-setup/references/usage.md#문서-구조와-책임).

보고 예시:

- 작업: 예약 취소 오류 수정.
- 업데이트 파일: 예약 기능, 검사, 작업 기록.
- 이슈: 취소 시 예약 내역도 삭제.
- 해결: 취소 상태만 변경하도록 수정·확인.
- 남은 문제: 실제 행사장 기기 확인 필요.
- 다음 작업: 해당 기기에서 예약·취소 시험.

항목 구분: `이슈`는 발생 문제, `해결`은 확인한 조치, `남은 문제`는 미해결·미검증. 근거는 필요한 경우만 후술. 단순 질문에는 형식 강제 없음.

## 4. 사용 방법

### 설치

Windows PowerShell에서 저장소 확보. 기존 다운로드 사용 시 해당 폴더에서 시작.

```powershell
git clone https://github.com/JOEWRKS/JOENESS.git
cd JOENESS
powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
```

| 확인 결과 | 조치 |
|---|---|
| `ready` | 아래 설치 명령 실행 가능 |
| `current` | 같은 패키지 설치 확인. 재설치 불필요 |
| `blocked` | 기존 파일 보존·덮어쓰기 중단. [업데이트·복구 안내](docs/installation.md) 확인 |

```powershell
powershell.exe -NoProfile -File .\JOENESS.ps1 -Apply
powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
```

### 프로젝트 적용

Codex에서 사용할 Git 프로젝트를 연 뒤 요청.

- 새 프로젝트: `이 프로젝트에 JOENESS 설치해줘. 목표는 [목표]. 만들 문서와 기록 범위를 먼저 보여줘.`
- 기존 프로젝트: `이 프로젝트에 JOENESS 설치해줘. 기존 계획·결과·승인 근거를 보존하고 정리안을 먼저 보여줘.`
- 변경안 승인: `이대로 적용해줘.`
- 평소 작업: `로드맵에서 다음으로 가능한 작업을 이어서 진행해.`

개인 도구 설치와 프로젝트 문서 정리는 별도. **변경안 승인 후에만** 프로젝트 파일 생성·변경. 매 작업 재설치 불필요.

## 5. 도구 간 연결

| 도구 | 역할 |
|---|---|
| [JOENESS](https://github.com/JOEWRKS/JOENESS) | 작업 순서·진행 상태·완료 근거 관리 |
| [JOEFLOW](https://github.com/JOEWRKS/JOEFLOW) | 요구사항·규칙·예외·완료 기준 확정 |
| [JOEDESIGN](https://github.com/JOEWRKS/JOEDESIGN) | 화면 제작·시각 기준 수립·디자인 검수 |

**작업 정리 → 만들 것 확정 → 화면 제작·검수 → 구현 담당의 개발 → 결과 검증 → 완료·잔여 기록.**

예약 기능 인계 예시:

- JOEFLOW → 디자인·구현 담당: 예약·취소 규칙, 완료 기준.
- 디자인 담당 → 구현·기록 담당: 화면 기준, 검수 결과.
- 구현 담당 → JOENESS 기록: 개발·시험 결과, 남은 검증.
- JOENESS: 각 원본 연결, 로드맵 완료·잔여 상태 갱신.

JOENESS는 전 과정에서 사용. **각 도구의 단독 사용 지원.** 다른 도구 자동 실행·사용자 대신 승인 없음. [필요한 항목에 검증 결과 연결](skills/joeness-setup/references/review-gate.md).

## 6. 한계

- 지원 환경: Codex, Windows PowerShell 5.1/7, Git 프로젝트의 UTF-8 문서. 선택형 검증 도구는 Node.js 18 이상 필요.
- 미정 사항: 목표 미확정 시 결정 대기 유지. 완료·디자인 승인 임의 생성 금지.
- 완료 구분: 설치 성공·문서 정리·지침 전달·작업 검증은 별도. 필수 검증·사용자 수락 미완 시 전체 완료 보류.
- 자동화 범위: 상시 감시·자동 업데이트·강제 잠금 없음. 기존 프로젝트·열린 채팅 자동 갱신 없음.
- 검사 재사용: 근거가 확인된 제한 범위만 지원. CSS·동적 변경 전체 판정 미지원. 채팅의 완료 선언까지 자동 차단 불가.
- 미입증: 토큰 절감·일반적인 성능 우위·모든 환경의 안정성.
- 기록 제외: 비밀번호·인증키·불필요한 개인정보.

[상세 사용법·기록 중지·연결 해제](skills/joeness-setup/references/usage.md) · [설치 확인·업데이트·복구](docs/installation.md) · [변경 이력](docs/CHANGELOG.md) · [개발 로드맵](docs/ROADMAP.md) · [Windows 검사](.github/workflows/windows-ci.yml)

[English ↑](#english) | [한국어 ↑](#korean)
