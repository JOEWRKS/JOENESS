# JOENESS 2.0.2

[English](#english) | [한국어](#korean)

<a name="english"></a>

**English**

## 1. Summary

**Task sequence, progress, and remaining-work management.**

1. Project goals and completion criteria organized into a staged roadmap.
2. Dedicated documents for plans, results, issues, and design, with task-specific reading priorities.
3. Six-field summary first; supporting evidence only where needed.

Version **2.0.2** (candidate, unpublished): new `scripts/revision-line.mjs` prints the ROADMAP `Product revision / approval:` line from JOEFLOW `approval_status.py` JSON (text only; the agent pastes it). 2.0.1: the four review helpers no longer exit 0 without running when started through a junction or symlink path; `-Remove` deletes the emptied skill folders; `-Check` reports `installedRelease`; line-ending guidance for pinned gate files; quickstart fixes. 2.0.0 added repository hygiene, a security review and a one-page quickstart. Version history: [CHANGELOG (Korean)](docs/CHANGELOG.md). No automatic update of personal installations or existing project connections.

- [Quickstart (Korean)](docs/QUICKSTART.md): install for Codex or Claude Code, connect a project, check status, upgrade, detach, remove.
- [Security review (Korean)](docs/SECURITY.md): what was checked, what remains, script trust boundaries, reporting.

## 2. Design Purpose

- Purpose: organize scattered plans and records; recover current status when resuming or handing off work.
- Focus: next eligible work, completed work, and outstanding verification.
- Replacement scope: duplicate current-progress trackers consolidated into one roadmap. Existing evidence and approval sources preserved.
- Outside scope: product definition, design judgment, development execution, and user approval.

## 3. Key Features

Setup creates `AGENTS.md`, `ROADMAP.md`, `TASK.md`, `ISSUES.md` and `DESIGN.md` in the project, each with one owner role, plus `Library/` when material exists. [Document responsibilities and reading order (Korean)](skills/joeness-setup/references/usage.md#문서-구조와-책임).

After work, the agent reports six fields first (work, updated files, issue, resolution, remaining problems, next work); evidence follows only when needed. [Connect verification results to required outcomes](skills/joeness-setup/references/review-gate.md).

## 4. Usage

```powershell
git clone https://github.com/JOEWRKS/JOENESS.git
cd JOENESS
powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
powershell.exe -NoProfile -File .\JOENESS.ps1 -Apply
powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
```

Run `-Apply` only after `ready`; finish at `current`. `blocked` preserves existing files: an older installed version must first be removed with its own package ([Quickstart §6](docs/QUICKSTART.md)).

Then, in a new chat in the Git project: `Install JOENESS in this project. The goal is [goal]. First show the proposed documents and recording scope.` → `Apply this proposal.` → `Continue with the next eligible task in the roadmap.` Project files change **only after proposal approval**.

## 5. Tool Integration

| Tool | Role |
|---|---|
| [JOENESS](https://github.com/JOEWRKS/JOENESS) | Task sequence, progress, and completion evidence |
| [JOEFLOW](https://github.com/JOEWRKS/JOEFLOW) | Requirements, rules, exceptions, and acceptance criteria |
| [JOEDESIGN](https://github.com/JOEWRKS/JOEDESIGN) | UI creation, visual standards, and design review |

Each tool works standalone. No automatic execution of other tools or approval on the user's behalf.

## 6. Limitations

- Supported environment: Codex (installer) and Claude Code (manual clone link), Windows PowerShell 5.1 or PowerShell 7 on Windows, UTF-8 documents in Git projects. Optional verification helpers require Node.js 18 or later.
- Undecided scope: unresolved goals remain pending. No invented completion or design approval.
- Separate checks: installation, document organization, instruction delivery, and work verification. No overall completion while required verification or user acceptance remains pending.
- Automation limits: no continuous monitoring, automatic updates, or enforced locking. No automatic update of existing projects or open conversations.
- Check reuse: only within an evidence-backed, bounded scope. No comprehensive CSS/dynamic-change analysis or automatic interception of completion claims in chat.
- Unproven: token savings, general performance superiority, and reliability across all environments.
- Excluded from records: passwords, credentials, and unnecessary personal data.

[Detailed usage and disconnecting (Korean)](skills/joeness-setup/references/usage.md) · [Installation, updates, and recovery (Korean)](docs/installation.md) · [Development roadmap (Korean)](docs/ROADMAP.md) · [Windows checks](.github/workflows/windows-ci.yml)

---

<a name="korean"></a>

**한국어**

## 1. 핵심 요약

**작업 순서·진행 상태·남은 일 관리 도구.**

1. 프로젝트 목표와 완료 조건을 단계별 로드맵으로 정리.
2. 계획·결과·문제·디자인의 기록 위치와 읽기 우선순위 구분.
3. 작업 결과를 여섯 항목으로 선요약. 필요한 근거만 후술.

버전 **2.0.2**(후보, 미게시): JOEFLOW `approval_status.py` JSON에서 ROADMAP `Product revision / approval:` 줄을 찍는 `scripts/revision-line.mjs` 추가(글만 출력, 붙여 넣기는 에이전트). 2.0.1: 검수 도구 4개가 junction·심볼릭 링크 경로에서 검사 없이 exit 0으로 끝나던 결함 수정, `-Remove`가 빈 스킬 폴더를 지움, `-Check`에 `installedRelease`, 게이트 고정 파일의 줄바꿈 안내, 빠른 시작 보완. 2.0.0은 저장소 정리·보안 검토·한 쪽 빠른 시작. 버전별 내용은 [변경 이력](docs/CHANGELOG.md). 개인 설치·기존 프로젝트 연결 자동 갱신 없음.

- [빠른 시작](docs/QUICKSTART.md): Codex·Claude Code 설치, 프로젝트 연결, 상태 확인, 업그레이드, 연결 해제, 제거.
- [보안 검토](docs/SECURITY.md): 확인한 것, 남은 것, 스크립트 신뢰 경계, 신고 방법.

## 2. 설계 목적

- 목적: 흩어진 계획·기록의 정리, 작업 재개·인수인계 시 현재 상태 복원.
- 집중: 무엇부터 할지, 어디까지 끝났는지, 어떤 검증이 남았는지 구분.
- 대체 범위: 여러 문서에 중복된 현재 진행표를 단일 로드맵으로 정리. 기존 근거·승인 원본은 보존.
- 비대체 범위: 제품 기획·디자인 판정·개발 실행·사용자 승인.

## 3. 주요 기능

셋업은 프로젝트에 `AGENTS.md`·`ROADMAP.md`·`TASK.md`·`ISSUES.md`·`DESIGN.md`를 담당 하나씩 두고, 자료가 생기면 `Library/`를 만든다. [문서별 책임·읽는 순서](skills/joeness-setup/references/usage.md#문서-구조와-책임).

작업 뒤 에이전트는 작업·업데이트 파일·이슈·해결·남은 문제·다음 작업 여섯 항목으로 먼저 보고하고, 근거는 필요할 때만 덧붙인다. [필요한 항목에 검증 결과 연결](skills/joeness-setup/references/review-gate.md).

## 4. 사용 방법

```powershell
git clone https://github.com/JOEWRKS/JOENESS.git
cd JOENESS
powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
powershell.exe -NoProfile -File .\JOENESS.ps1 -Apply
powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
```

`-Apply`는 `ready`일 때만, 마지막은 `current`. `blocked`는 기존 파일 보존 상태다. 이전 버전이 설치되어 있으면 그 버전의 패키지로 먼저 제거한다([빠른 시작 6절](docs/QUICKSTART.md)).

그다음 Git 프로젝트를 연 새 채팅에서: `이 프로젝트에 JOENESS 설치해줘. 목표는 [목표]. 만들 문서와 기록 범위를 먼저 보여줘.` → `이대로 적용해줘.` → `로드맵에서 다음으로 가능한 작업을 이어서 진행해.` **변경안 승인 후에만** 프로젝트 파일 생성·변경.

## 5. 도구 간 연결

| 도구 | 역할 |
|---|---|
| [JOENESS](https://github.com/JOEWRKS/JOENESS) | 작업 순서·진행 상태·완료 근거 관리 |
| [JOEFLOW](https://github.com/JOEWRKS/JOEFLOW) | 요구사항·규칙·예외·완료 기준 확정 |
| [JOEDESIGN](https://github.com/JOEWRKS/JOEDESIGN) | 화면 제작·시각 기준 수립·디자인 검수 |

각 도구는 단독 사용 가능. 다른 도구 자동 실행·사용자 대신 승인 없음.

## 6. 한계

- 지원 환경: Codex(설치기)·Claude Code(클론 수동 연결), Windows PowerShell 5.1/7, Git 프로젝트의 UTF-8 문서. 선택형 검증 도구는 Node.js 18 이상 필요.
- 미정 사항: 목표 미확정 시 결정 대기 유지. 완료·디자인 승인 임의 생성 금지.
- 완료 구분: 설치 성공·문서 정리·지침 전달·작업 검증은 별도. 필수 검증·사용자 수락 미완 시 전체 완료 보류.
- 자동화 범위: 상시 감시·자동 업데이트·강제 잠금 없음. 기존 프로젝트·열린 채팅 자동 갱신 없음.
- 검사 재사용: 근거가 확인된 제한 범위만 지원. CSS·동적 변경 전체 판정 미지원. 채팅의 완료 선언까지 자동 차단 불가.
- 미입증: 토큰 절감·일반적인 성능 우위·모든 환경의 안정성.
- 기록 제외: 비밀번호·인증키·불필요한 개인정보.

[상세 사용법·연결 해제](skills/joeness-setup/references/usage.md) · [설치·업데이트·복구](docs/installation.md) · [개발 로드맵](docs/ROADMAP.md) · [Windows 검사](.github/workflows/windows-ci.yml)

[English ↑](#english) | [한국어 ↑](#korean)
