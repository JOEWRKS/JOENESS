# JOENESS Clean Interface And Visual Safety Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** JOENESS의 대표 설치 파일과 활성 호출명을 `JOENESS.ps1`, `$project`, `$design`, `$visual-check`, `$handoff`로 정리하고, RVR 사고에서 확인된 외부 배포·시각 검증·인계 안전성을 필요한 작업에만 조건부로 적용한다.

**Architecture:** 설치 대상은 계속 `vendor/source-manifest.json`의 활성 포인터만 따른다. 새 Core와 새 스킬은 먼저 독립 계약 검사로 고정하고, 설치기는 기존 V1/V2 상태를 읽는 비활성 호환 자료를 확보한 뒤 이름을 전환한다. 과거 평가 파일과 외부 vendor는 바꾸지 않으며, 새 호출의 실제 자동 선택은 설치 후 새 Codex 작업에서 확인될 때까지 `candidate/unvalidated`로 남긴다.

공개 이름 전환이 새 스킬 경로와 설치 migration을 한 manifest transaction으로 소비하므로 계획을 둘로 분리하지 않는다. 대신 각 Task는 독립 RED/GREEN과 commit으로 검토 가능하게 유지한다.

**Tech Stack:** Windows PowerShell 5.1, Node.js built-in test runner, JSON manifest with SHA-256, Markdown/YAML Codex skills, Python vendor validators

## Global Constraints

- 활성 제품명은 `JOENESS`, 대표 진입점은 `JOENESS.ps1`, 버전은 manifest의 `release.version: "0.1"`로 분리한다.
- 활성 호출명은 정확히 `project`, `design`, `visual-check`, `handoff` 네 개다.
- `JOENESS-0.1.ps1`과 `harness.ps1`은 0.1 Beta 동안 조용히 전달하는 호환 래퍼로 유지한다.
- 설치 state의 `schemaVersion = 2`, `bundleSelection = personal-pilot`, marker, state 파일명, 백업 경로, 내부 함수명은 바꾸지 않는다.
- `interaction-safety-core-v1.md`, 기존 `docs/superpowers/**`, 기존 `evals/**`, `behaviorEvidenceHistory`, 외부 vendor 원본과 라이선스는 역사 증거로 보존한다.
- 새 Core는 `interaction-safety-core-v2.md`로 만들며 UTF-8 기준 2,048바이트를 넘지 않는다.
- UI UX Pro Max와 Apple Design은 `design`의 비발견 source dependency로만 유지한다. 외부 플러그인의 별칭 스킬은 만들지 않는다.
- `project`, `design`, `visual-check`만 좁은 조건에서 암시적으로 선택될 수 있고 `handoff`는 명시 요청 전용이다.
- 실패 영수증, 확인 필요 블록, 상태 설명은 사용자가 쓰는 언어를 따른다.
- 새 행동 증거는 새 artifact로만 기록한다. 옛 결과를 현재 검증으로 이름만 바꿔 재사용하지 않는다.
- 스킬 파일을 수정하는 작업자는 먼저 `superpowers:writing-skills`를 읽고, 각 동작 변경은 실패 검사부터 작성한다.
- 작은 관련 검사를 먼저 실행하고, 릴리스 판정 직전에만 문서화된 전체 suite를 실행한다.

---

## File Structure

### 새 파일

- `JOENESS.ps1`: 버전과 무관한 유일한 대표 설치 진입점
- `evals/candidates/interaction-safety-core-v2.md`: 외부 배포형 build/test를 외부 쓰기로 분류하는 새 활성 Core
- `skills/project/SKILL.md`, `skills/project/agents/openai.yaml`, `skills/project/scripts/project-setup.ps1`: 최종 프로젝트 계약 스킬과 기존 helper
- `skills/design/SKILL.md`, `skills/design/agents/openai.yaml`: 최종 UI/UX 라우터
- `skills/visual-check/SKILL.md`, `skills/visual-check/agents/openai.yaml`: 조건부 시각 회귀 검증
- `evals/skill-contracts/cases.json`: 새 네 역할의 정적 라우팅·안전 사례
- `tests/skill-contracts.tests.mjs`: 새 스킬 frontmatter, 경계, 사례 계약 검사
- `vendor/compatibility/joeness-0.1/skills/**`: 이전 설치를 판별하기 위한 옛 활성 스킬의 정확한 비활성 바이트

### 수정 파일

- `vendor/source-manifest.json`: 새 Core, 활성 스킬, 비활성 호환 자료, 현재 평가 상태와 해시
- `scripts/sync-harness.ps1`: V1 호환 선택, 충돌 판정, 빈 디렉터리 정리, 공개 JSON
- `skills/handoff/SKILL.md`: 사고가 있을 때만 추가되는 증거 묶음
- `.gitattributes`: 새 진입점·Core·스킬의 LF 계약
- `tests/thin-hybrid-core.tests.mjs`: Core v2 의미·크기·역사 보존
- `tests/design-vendor-integrity.tests.mjs`: manifest, active skill, compatibility archive, evaluation 경계
- `tests/sync-harness.tests.ps1`: 설치·업데이트·제거·V1/V2 migration·공개 결과·rollback
- `tests/project-setup.tests.ps1`: helper의 새 물리 경로
- `tests/design-frontend-routing.tests.mjs`: 옛 평가의 source를 compatibility archive로 materialize
- `tests/design-frontend-hybrid-routing.tests.mjs`: 옛 hybrid 계약을 compatibility archive에 결속
- `README.md`: 한국어·영어 설치와 네 역할 설명

### 활성 영역에서 제거할 경로

- `skills/joewrks-project-setup/**`
- `skills/joewrks-design-frontend/**`

이 바이트는 먼저 `vendor/compatibility/joeness-0.1/skills/**`에 정확히 보존한다. 설치 manifest에는 새 경로만 활성화한다.

---

### Task 1: Version The Interaction Safety Core

**Files:**
- Create: `evals/candidates/interaction-safety-core-v2.md`
- Modify: `tests/thin-hybrid-core.tests.mjs`
- Modify: `tests/design-vendor-integrity.tests.mjs`
- Modify: `vendor/source-manifest.json`
- Modify: `.gitattributes`

**Interfaces:**
- Consumes: 현재 활성 Core v1의 모든 재시도·증거·사용자 언어 계약
- Produces: `activeCommonCore.path = "evals/candidates/interaction-safety-core-v2.md"`, SHA-256 `3f10f1ba56864b4ba3bf1dd2b9f3200281749280a09375b2d843d1d0838049a5`

- [ ] **Step 1: Write the failing Core contract**

`tests/thin-hybrid-core.tests.mjs`가 새 포인터와 외부 배포 의미를 요구하도록 바꾼다.

```js
import { createHash } from "node:crypto";

assert.equal(
  manifest.activeCommonCore.path,
  "evals/candidates/interaction-safety-core-v2.md",
);
assert.match(
  core,
  /build\/test.*deploy folder.*shared target.*external runtime.*external\/shared write/is,
);
assert.match(core, /may have applied.*inspect state.*stable idempotency key.*unknown.*stop writes/is);
assert.ok(Buffer.byteLength(core, "utf8") <= 2048);

const coreV1 = await readFile(
  path.join(root, "evals", "candidates", "interaction-safety-core-v1.md"),
  "utf8",
);
assert.equal(
  createHash("sha256").update(coreV1).digest("hex"),
  "e7a3c02d4c147eaadde2c00a0452c7de21b3e0f51fa02cf7bd7085c43d97ac4d",
);
```

`tests/design-vendor-integrity.tests.mjs`도 v1 고정 해시와 v2 활성 포인터를 각각 검사한다.

- [ ] **Step 2: Run the focused tests and confirm RED**

Run:

```powershell
node --test .\tests\thin-hybrid-core.tests.mjs .\tests\design-vendor-integrity.tests.mjs
```

Expected: `interaction-safety-core-v2.md`가 없고 manifest가 v1을 가리켜 실패한다.

- [ ] **Step 3: Create the exact 2,048-byte Core v2**

`evals/candidates/interaction-safety-core-v2.md`의 전체 내용은 다음과 같다.

```markdown
# JOENESS Interaction Safety Core

No approval/log workflow.

- If progress needs a user decision, show valid unresolved choices in a separate confirmation block in user's language, max 3; don't copy external menus verbatim. Give recommended default and what waits. Omit if none; continue on a material reversible assumption. Don't re-ask resolved choices absent new evidence. At task end with no blocker, give one realistic next step. Future external action: state as a boundary, not a question, until current.
- Native crash/crash reporter/unexpected external-process exit or user's current crash/relaunch/stop report: contain agent-owned process; stop. Same command/mechanism automatic retries: 0. Replacement PID is a new attempt; user signal overrides liveness.
- Deterministic compile/test/managed error: read exact error. One evidence-driven retry only after fixing cause/changing method. Known transient only if idempotent: retry once. Repeat stops/reclassifies.
- Build/test changing a deploy folder, shared target, or external runtime is an external/shared write. If it may have applied, inspect state or recover with same stable idempotency key; else report unknown and stop writes.
- Optional GUI verification: primary approach plus one materially different fallback for whole verification goal. Helper/PID/delegation changes don't reset it. Both fail: report unverified/blocked; another approach needs new evidence/user decision.
- Filenames, narration, liveness aren't success. Evidence supports only the exact artifact/version, named target/state, and observed property. Call fixed only after directly rechecking the original failure mode; otherwise name verified layer and missing check. WER/dumps only after a crash signal.
- Material failure/carried-forward workaround receipt: omit routine errors/log dumps; link raw logs; never call workaround a fix. Exactly 5 lines, labels/statuses in user language: evidence; cause=confirmed/suspected/unknown; handling=fixed/mitigated/worked around/unresolved; verification; remaining risk.
```

파일 끝 LF를 포함한 바이트 수가 정확히 `2048`, SHA-256이 위 인터페이스 값인지 확인하고 manifest와 `.gitattributes`를 갱신한다.

- [ ] **Step 4: Run the focused tests and confirm GREEN**

```powershell
node --test .\tests\thin-hybrid-core.tests.mjs .\tests\design-vendor-integrity.tests.mjs
git diff --check
```

Expected: 두 Node test가 통과하고 v1 해시는 변하지 않는다.

- [ ] **Step 5: Commit the Core version**

```powershell
git add -- .gitattributes evals/candidates/interaction-safety-core-v2.md tests/thin-hybrid-core.tests.mjs tests/design-vendor-integrity.tests.mjs vendor/source-manifest.json
git commit -m "feat: classify side-effecting builds as external writes"
```

---

### Task 2: Create The Four Final Skill Contracts

**Files:**
- Create: `skills/project/**`
- Create: `skills/design/**`
- Create: `skills/visual-check/**`
- Create: `vendor/compatibility/joeness-0.1/skills/**`
- Create: `evals/skill-contracts/cases.json`
- Create: `tests/skill-contracts.tests.mjs`
- Modify: `skills/handoff/SKILL.md`
- Modify: `vendor/source-manifest.json`
- Modify: `tests/design-vendor-integrity.tests.mjs`
- Modify: `.gitattributes`

**Interfaces:**
- Consumes: 기존 project helper, design vendor router, handoff license와 explicit-only 정책
- Produces: 최종 스킬 파일 네 벌과 이전 0.1 스킬의 비활성 exact-byte archive

- [ ] **Step 1: Archive the current 0.1 active skill bytes before editing**

다음 여덟 파일을 license 포함 같은 상대 구조로 `vendor/compatibility/joeness-0.1/skills/` 아래에 보존한다.

```text
skills/joewrks-design-frontend/SKILL.md
skills/joewrks-design-frontend/agents/openai.yaml
skills/joewrks-project-setup/SKILL.md
skills/joewrks-project-setup/agents/openai.yaml
skills/joewrks-project-setup/scripts/project-setup.ps1
skills/handoff/SKILL.md
skills/handoff/agents/openai.yaml
skills/handoff/LICENSE
```

archive 검사에는 현재 manifest의 `bytes`와 `sha256`을 그대로 사용한다. `tests/design-vendor-integrity.tests.mjs`에서 upstream vendor 집합과 compatibility 집합을 분리하고, archive의 각 source가 현재 원본 해시와 일치하는지 검사한다.

- [ ] **Step 2: Write the failing final-skill contract and case ledger**

`evals/skill-contracts/cases.json`은 정확히 다음 역할 사례를 갖는다.

```json
{
  "schemaVersion": 1,
  "cases": [
    {"id":"long-project-no-ledger","expectedSkills":["project"],"forbiddenSkills":[],"request":"여러 출시 단계가 있는 새 앱 프로젝트를 시작할 거야. 아직 계획 원장은 없어."},
    {"id":"small-fix","expectedSkills":[],"forbiddenSkills":["project"],"request":"오타 한 글자만 고쳐줘."},
    {"id":"new-login-ui","expectedSkills":["design"],"forbiddenSkills":["visual-check"],"request":"새 로그인 화면의 UI와 반응형 동작을 설계해줘."},
    {"id":"moving-frame-regression","expectedSkills":["visual-check"],"forbiddenSkills":["design"],"request":"걷는 중 동쪽 프레임만 반전돼. 기존 디자인은 바꾸지 마."},
    {"id":"redesign-and-regression","expectedSkills":["design","visual-check"],"forbiddenSkills":[],"request":"조준 보행 모션의 의도도 바꾸고 현재 방향 반전 결함도 검증해줘."},
    {"id":"subjective-first-draft","expectedSkills":["design"],"forbiddenSkills":["visual-check"],"request":"첫 시안 분위기가 마음에 안 들어. 더 따뜻하게 다시 잡아줘."},
    {"id":"explicit-handoff","expectedSkills":["handoff"],"forbiddenSkills":[],"request":"다음 작업이 이어받도록 인수인계를 만들어줘."},
    {"id":"ordinary-status","expectedSkills":[],"forbiddenSkills":["handoff"],"request":"현재 진행 상황만 알려줘."}
  ]
}
```

`tests/skill-contracts.tests.mjs`는 네 `SKILL.md`의 frontmatter 이름, `openai.yaml` 표시명·암시 호출 정책, 위 여덟 case ID와 기대 역할을 검사한다. 또한 다음 의미를 regex로 고정한다.

```js
assert.match(project, /no-deploy build\/test.*deploy command.*actual target.*protected process/is);
assert.match(project, /recheck.*project root.*Git.*deploy.*read back.*hash/is);
assert.match(design, /subjective.*first[- ]draft|new UI\/UX intent/is);
assert.match(design, /visual-check.*concrete visual defect|visual regression.*visual-check/is);
assert.match(visualCheck, /original failure.*target.*state/is);
assert.match(visualCheck, /one causal hypothesis.*minimum coherent change set/is);
assert.match(visualCheck, /source.*build artifact.*deployed artifact.*visual candidate.*user acceptance/is);
assert.match(visualCheck, /rejected hypothesis.*new evidence.*not repeat/is);
assert.match(handoff, /last accepted.*build.*deploy.*hash.*next single hypothesis/is);
```

- [ ] **Step 3: Run the new test and confirm RED**

```powershell
node --test .\tests\skill-contracts.tests.mjs
```

Expected: 최종 경로와 `visual-check`가 없어서 실패한다.

- [ ] **Step 4: Create the final skill metadata**

각 `agents/openai.yaml`은 다음 공개 metadata를 사용한다.

```yaml
# skills/project/agents/openai.yaml
interface:
  display_name: "Project"
  short_description: "Keep one durable project roadmap and deployment boundary"
  default_prompt: "Use $project to find the current project ledger, offer a durable roadmap for unplanned long-lived work, and persist only approved targets."
policy:
  allow_implicit_invocation: true
```

```yaml
# skills/design/agents/openai.yaml
interface:
  display_name: "Design"
  short_description: "Route bounded UI and UX design work"
  default_prompt: "Use $design to route and verify this UI or UX task without expanding scope."
policy:
  allow_implicit_invocation: true
```

```yaml
# skills/visual-check/agents/openai.yaml
interface:
  display_name: "Visual Check"
  short_description: "Verify a concrete visual regression and its exact state"
  default_prompt: "Use $visual-check to bind a reported visual failure to the exact built, deployed, and observed state."
policy:
  allow_implicit_invocation: true
```

`skills/handoff/agents/openai.yaml`은 `Handoff`와 `allow_implicit_invocation: false`를 유지한다.

`.gitattributes`에는 다음 LF 규칙을 추가하고 기존 옛 skill 규칙은 Task 7의 활성 전환 전까지 유지한다.

```gitattributes
/skills/project/** text eol=lf
/skills/design/** text eol=lf
/skills/visual-check/** text eol=lf
/evals/skill-contracts/*.json text eol=lf
```

- [ ] **Step 5: Implement the minimal skill boundaries**

`project`는 기존 장기 프로젝트 제안·단일 원장·승인 후 쓰기 계약을 유지하고, 외부 배포가 있을 때만 다음 섹션을 추가한다.

```markdown
## External deployment boundary

Only when the project can write outside its source tree, record the no-deploy build/test command, the explicit deploy command and actual target, protected processes or stop conditions, and the canonical acceptance/restoration record.

Before an external deploy, recheck the exact project root; when Git-backed, recheck HEAD and worktree; recheck the command, target, and protected process. If a required no-deploy path is unavailable, do not substitute a deploying build. After deployment, read back the actual target state or artifact hash when possible.

Treat accepted, restorable-copy-present, and restore-tested as separate states. When a canonical document conflicts with current Git, the deployed artifact, hashes, or a direct check, mark it mismatch/unverified and update it only after the evidence is reconciled.
```

`design`은 기존 vendor·Figma 권위와 조건부 사용을 유지하고 다음 경계를 추가한다.

```markdown
## Visual defect boundary

Use this skill for new UI/UX intent, including subjective first-draft feedback. Route a concrete mismatch against an approved state, state-dependent rendering failure, or visual regression to `$visual-check`. When both intent and verification change, settle the intended design first, then verify the implementation as a separate responsibility.
```

`visual-check`는 다음 전체 계약으로 시작한다.

```markdown
---
name: visual-check
description: Use when a user reports or rejects a concrete visual, animation, rendering, direction, motion, viewport, or device-state mismatch against an implemented or accepted result. Do not use for new design exploration, subjective first-draft preference, or nonvisual defects.
---

# Visual Check

Bind the original failure to the exact named target and state. Add only protected regression states; do not invent a full state matrix.

Use one causal hypothesis and the minimum coherent change set that can test it. Record why inseparable edits belong together. Do not repeat a rejected hypothesis or failed method without new evidence.

Keep source inspection, build artifact, deployed artifact, visual candidate, and user acceptance as separate states. Automated checks or a different state cannot prove the original visual failure fixed. When a deployable result becomes a future baseline, bind the applicable source commit/worktree, build hash, deployed hash, exact target/state, and user verdict in the project's chosen evidence pointer.

Treat accepted, restorable-copy-present, and restore-tested as different states. Follow the Interaction Safety Core retry and external-process limits. Use project-owned verification tools; do not create a general deployment or screenshot system.
```

`handoff`에는 반복 시각·배포 사고일 때만 다음 목록을 추가한다.

```markdown
For a repeated visual or deployment incident only, also record the exact failing target/state; the last accepted evidence pointer or applicable source, build, and deployed hashes; the user's current verdict; rejected hypotheses or methods; and the next single hypothesis. Keep ordinary handoffs compact.
```

- [ ] **Step 6: Update the active handoff hash and run focused GREEN tests**

handoff 파일의 실제 bytes와 SHA-256을 계산해 manifest의 handoff entry만 갱신한다. 최종 project/design/visual-check는 아직 activeSkills로 전환하지 않는다.

```powershell
node --test .\tests\skill-contracts.tests.mjs .\tests\design-vendor-integrity.tests.mjs
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\project-setup.tests.ps1
git diff --check
```

Expected: 새 정적 계약과 기존 project helper 검사가 모두 통과한다.

- [ ] **Step 7: Commit the final skill sources**

```powershell
git add -- .gitattributes skills/project skills/design skills/visual-check skills/handoff/SKILL.md vendor/compatibility evals/skill-contracts tests/skill-contracts.tests.mjs tests/design-vendor-integrity.tests.mjs vendor/source-manifest.json
git commit -m "feat: define project design visual and handoff roles"
```

---

### Task 3: Decouple V1 Trust From The Active Skill Name

**Files:**
- Modify: `vendor/source-manifest.json`
- Modify: `scripts/sync-harness.ps1`
- Modify: `tests/sync-harness.tests.ps1`
- Modify: `tests/design-vendor-integrity.tests.mjs`

**Interfaces:**
- Consumes: exact compatibility archive from Task 2
- Produces: `compatibility.legacyInstallSources.stateSchemaV1`, `Get-HarnessLegacyInstallSelections`

- [ ] **Step 1: Write RED tests for immutable legacy sources**

`tests/sync-harness.tests.ps1`의 `Write-V1FixtureState`가 현재 activeSkills를 잘라 쓰지 않고 compatibility entry를 사용하도록 기대값을 바꾼다. 다음 두 차단 case를 `Test-V1HistoricalTrust`에 추가한다.

```powershell
$legacySkill = Join-Path $f.SourceRoot 'vendor\compatibility\joeness-0.1\skills\joewrks-design-frontend\SKILL.md'
Add-Content -LiteralPath $legacySkill -Value 'drift'
Assert-BlockedBeforeWrites $f {} 'legacy compatibility source hash mismatch'

[IO.File]::Delete($legacySkill)
Assert-BlockedBeforeWrites $f {} 'legacy compatibility source missing'
```

`tests/design-vendor-integrity.tests.mjs`는 compatibility entry의 모든 `sourcePath`, `localPath`, `bytes`, `sha256`을 archive와 대조한다.

- [ ] **Step 2: Run the installer and integrity tests and confirm RED**

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\sync-harness.tests.ps1
node --test .\tests\design-vendor-integrity.tests.mjs
```

Expected: manifest에 compatibility entry가 없어서 실패한다.

- [ ] **Step 3: Add the compatibility manifest contract**

`compatibility.legacyInstallSources.stateSchemaV1`은 다음 값을 갖는다.

```json
{
  "commonCore": {
    "sourcePath": "evals/candidates/common-core-v1.md",
    "localPath": "AGENTS.md",
    "sha256": "5aebc74bc795891c43bf785d9b34ae4d35d4a40bf46eddef3f6246d75919a495"
  },
  "skillName": "joewrks-design-frontend",
  "sourceDependencies": ["ui-ux-pro-max", "apple-design"],
  "files": [
    {
      "sourcePath": "vendor/compatibility/joeness-0.1/skills/joewrks-design-frontend/SKILL.md",
      "localPath": "skills/joewrks-design-frontend/SKILL.md",
      "bytes": 3335,
      "sha256": "a5a0c3c64b94b8565a53e19e10d15fa96dcc995bd152da6c1886ed938261a05e"
    },
    {
      "sourcePath": "vendor/compatibility/joeness-0.1/skills/joewrks-design-frontend/agents/openai.yaml",
      "localPath": "skills/joewrks-design-frontend/agents/openai.yaml",
      "bytes": 263,
      "sha256": "3d0bc6bf72b93b3bd185852f080b19caeb17aed45f582df339d61c2633f81892"
    }
  ]
}
```

같은 `legacyInstallSources` 아래 `release0.1` entry에는 archive의 handoff, design, project 여덟 파일과 Core v1의 source/local path·bytes·hash를 기록한다. 이 entry는 fixture와 legacy V2 migration 판별에만 사용하고 새 설치 selection에 포함하지 않는다.

`release0.1.files`의 정확한 값은 다음 표다.

| sourcePath 접두어 `vendor/compatibility/joeness-0.1/` 뒤 경로 | 이전 localPath | bytes | sha256 |
|---|---|---:|---|
| `skills/joewrks-design-frontend/SKILL.md` | `skills/joewrks-design-frontend/SKILL.md` | 3335 | `a5a0c3c64b94b8565a53e19e10d15fa96dcc995bd152da6c1886ed938261a05e` |
| `skills/joewrks-design-frontend/agents/openai.yaml` | `skills/joewrks-design-frontend/agents/openai.yaml` | 263 | `3d0bc6bf72b93b3bd185852f080b19caeb17aed45f582df339d61c2633f81892` |
| `skills/joewrks-project-setup/SKILL.md` | `skills/joewrks-project-setup/SKILL.md` | 5764 | `777eecb563479f813015548284b43a2a94b2fa0fd10b2ee0f55198396fe9173c` |
| `skills/joewrks-project-setup/agents/openai.yaml` | `skills/joewrks-project-setup/agents/openai.yaml` | 353 | `1581633a8cea5dce3dd33a49bc8fb593169deddc01e496347190928a23cfeffc` |
| `skills/joewrks-project-setup/scripts/project-setup.ps1` | `skills/joewrks-project-setup/scripts/project-setup.ps1` | 17495 | `4ffc548078a5c87357fd0e4e63538567ea2666f118243a0558bff29278d13105` |
| `skills/handoff/SKILL.md` | `skills/handoff/SKILL.md` | 3700 | `5c49bbe372921e95530d566359670f760cc25da95efe38a4d16c5125a1ca30b4` |
| `skills/handoff/agents/openai.yaml` | `skills/handoff/agents/openai.yaml` | 141 | `5c479fd562c691851690e8b18c8501045bef0943c10743d636b2fae26add1d28` |
| `skills/handoff/LICENSE` | `skills/handoff/LICENSE` | 1068 | `0e7ac423bf2c6e223b7c5b156f8cf72da49d748e56a1641402c31f22ad07dbb5` |

`release0.1.activeCommonCore`는 `evals/candidates/interaction-safety-core-v1.md`, 2044 bytes, SHA-256 `e7a3c02d4c147eaadde2c00a0452c7de21b3e0f51fa02cf7bd7085c43d97ac4d`로 고정한다.

- [ ] **Step 4: Implement `Get-HarnessLegacyInstallSelections`**

`scripts/sync-harness.ps1`에서 현재 active design descriptor를 읽는 505~513행 로직을 제거하고 다음 책임의 helper를 추가한다.

```powershell
function Get-HarnessLegacyInstallSelections {
    param($LegacyEntry, $Manifest, [string] $SourceRoot)
    $selected = [Collections.Generic.List[object]]::new()
    foreach ($file in @($LegacyEntry.files)) {
        $sourceRelative = Get-HarnessSafeRelativePath ([string] $file.sourcePath) 'Legacy source path'
        $targetRelative = Get-HarnessSafeRelativePath ([string] $file.localPath) 'Legacy target path'
        $sourcePath = Resolve-HarnessSourceFile $SourceRoot $sourceRelative
        $hash = Get-HarnessValidSha256 $file.sha256 'Legacy source hash'
        $bytes = [IO.File]::ReadAllBytes($sourcePath)
        if ($bytes.Length -cne [int] $file.bytes -or (Get-HarnessSha256 $bytes) -cne $hash) {
            throw "Legacy compatibility source mismatch: $sourceRelative"
        }
        $null = $selected.Add([pscustomobject]@{
            RelativePath = $targetRelative
            Path = $sourcePath
            Hash = $hash
            Entry = $file
        })
    }
    foreach ($sourceName in @($LegacyEntry.sourceDependencies)) {
        $sourceProperty = $Manifest.sources.PSObject.Properties[[string] $sourceName]
        if ($null -eq $sourceProperty) { throw "Missing legacy source dependency: $sourceName" }
        foreach ($file in @($sourceProperty.Value.files)) {
            $relative = Get-HarnessSafeRelativePath ([string] $file.localPath) 'Legacy dependency path'
            $path = Resolve-HarnessSourceFile $SourceRoot $relative
            $hash = Get-HarnessValidSha256 $file.sha256 "Legacy dependency hash for $relative"
            $bytes = [IO.File]::ReadAllBytes($path)
            if ($bytes.Length -cne [int] $file.bytes -or (Get-HarnessSha256 $bytes) -cne $hash) {
                throw "Legacy dependency source mismatch: $relative"
            }
            $null = $selected.Add([pscustomobject]@{
                RelativePath = $relative
                Path = $path
                Hash = $hash
                Entry = $file
            })
        }
    }
    $selected.ToArray()
}
```

구현 시 dependency 선택을 중복하지 않도록 반환 `RelativePath`를 case-insensitive set으로 검증한다. V1 `historicalCoreEntry`와 `historicalV1WholeFiles`는 compatibility entry에서만 만든다.

- [ ] **Step 5: Rebuild V1 fixtures from compatibility data and confirm GREEN**

`New-Fixture`가 compatibility archive를 복사하고, `Write-V1FixtureState`가 `stateSchemaV1`의 exact target/hash 집합으로 설치본을 만든다.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\sync-harness.tests.ps1
node --test .\tests\design-vendor-integrity.tests.mjs
git diff --check
```

Expected: V1 정상 migration은 통과하고 missing/drifted compatibility source는 쓰기 전에 `sourceIntegrity`로 차단된다.

- [ ] **Step 6: Commit legacy trust separation**

```powershell
git add -- vendor/source-manifest.json scripts/sync-harness.ps1 tests/sync-harness.tests.ps1 tests/design-vendor-integrity.tests.mjs
git commit -m "fix: preserve legacy install trust across skill renames"
```

---

### Task 4: Narrow Skill Collision Detection

**Files:**
- Modify: `scripts/sync-harness.ps1`
- Modify: `tests/sync-harness.tests.ps1`

**Interfaces:**
- Consumes: active manifest names, legacy names, state-owned installed skill paths
- Produces: exact-target occupancy check plus frontmatter-based cross-root collision check

- [ ] **Step 1: Replace collision fixtures with exact cases**

`Test-ManifestSkillCollisions`는 다음 여섯 case를 독립 fixture로 검사한다.

```powershell
@(
    @{ Name = 'actual design frontmatter'; Skill = 'design'; ExpectBlocked = $true },
    @{ Name = 'actual project frontmatter'; Skill = 'project'; ExpectBlocked = $true },
    @{ Name = 'plain project directory'; Skill = $null; ExpectBlocked = $false },
    @{ Name = 'unowned legacy design skill'; Skill = 'joewrks-design-frontend'; ExpectBlocked = $true },
    @{ Name = 'unowned legacy project skill'; Skill = 'joewrks-project-setup'; ExpectBlocked = $true },
    @{ Name = 'state-owned legacy skill'; Skill = 'state-owned'; ExpectBlocked = $false }
)
```

정확한 새 설치 대상 `skills\project`에 비소유 파일이 있으면 `SKILL.md`가 없어도 차단하는 case를 별도로 유지한다.

- [ ] **Step 2: Run the collision subset and confirm RED**

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\sync-harness.tests.ps1
```

Expected: 이름만 같은 일반 디렉터리를 현재 구현이 `duplicateSkill`로 잘못 차단한다.

- [ ] **Step 3: Make cross-root detection frontmatter-based**

`Get-HarnessFrontmatterCollisions`에서 재귀 디렉터리 이름만 비교하는 첫 loop를 제거한다. 실제 `SKILL.md`마다 다음 순서로 판정한다.

```powershell
$reservedNames = @($ManagedSkillFiles.Keys) + @('joewrks-project-setup', 'joewrks-design-frontend')
$isOwned = @($OwnedSkillFiles | Where-Object { $skillFile.FullName -ieq $_ }).Count -gt 0
if ($isOwned) { continue }
$text = (Read-HarnessUtf8 $skillFile.FullName).Text
foreach ($skillName in $reservedNames) {
    $pattern = '(?ms)\A---\s*\r?\n.*?^\s*name\s*:\s*[''"]?' + [regex]::Escape($skillName) + '[''"]?\s*$.*?^---\s*$'
    if ($text -match $pattern) {
        $null = $collisions.Add("Duplicate skill frontmatter name: $($skillFile.FullName)")
        break
    }
}
```

읽을 수 없는 `SKILL.md`는 부모 디렉터리명이 예약 이름일 때만 차단한다. 정확한 target directory의 비소유 내용은 기존 skeleton preflight가 계속 차단한다.

- [ ] **Step 4: Run the installer contract and confirm GREEN**

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\sync-harness.tests.ps1
git diff --check
```

- [ ] **Step 5: Commit collision narrowing**

```powershell
git add -- scripts/sync-harness.ps1 tests/sync-harness.tests.ps1
git commit -m "fix: detect only real skill namespace collisions"
```

---

### Task 5: Clean Only Proven Empty Directories

**Files:**
- Modify: `scripts/sync-harness.ps1`
- Modify: `tests/sync-harness.tests.ps1`

**Interfaces:**
- Consumes: directories created by the current run and parents emptied by managed-file removal
- Produces: `Remove-HarnessEmptyDirectories` result with removed, non-empty, and failed paths

- [ ] **Step 1: Change rollback and removal expectations to the safe contract**

`Test-CreatedDirectoryRollbackResidue`, `Test-DeterministicRollback`, `Test-MultiTargetRollback`, `Test-RemoveContract`에 다음 구분을 고정한다.

```text
clean rollback: status=failed, rollback.status=complete, run-created empty directories absent
external file appears in run-created directory: status=unknown, rollback.status=incomplete, external file preserved
successful Remove: managed empty skill directories absent
non-owned file remains after Remove: directory and external file preserved
```

- [ ] **Step 2: Run the installer contract and confirm RED**

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\sync-harness.tests.ps1
```

Expected: 현재 구현이 빈 생성 디렉터리를 unresolved로 남겨 clean rollback을 `unknown`으로 보고한다.

- [ ] **Step 3: Add the bounded empty-directory helper**

```powershell
function Remove-HarnessEmptyDirectories {
    param([string] $BoundaryRoot, [string[]] $Directories)
    $removed = [Collections.Generic.List[string]]::new()
    $nonEmpty = [Collections.Generic.List[string]]::new()
    $failed = [Collections.Generic.List[string]]::new()
    $seen = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
    $unique = [Collections.Generic.List[string]]::new()
    foreach ($candidate in @($Directories)) {
        if ([string]::IsNullOrWhiteSpace($candidate)) { continue }
        $full = [IO.Path]::GetFullPath($candidate).TrimEnd('\', '/')
        if ($seen.Add($full)) { $null = $unique.Add($full) }
    }
    $ordered = @($unique | Sort-Object @{ Expression = { $_.Length }; Descending = $true }, @{ Expression = { $_ }; Descending = $true })
    foreach ($directory in $ordered) {
        try {
            Assert-HarnessNoReparsePoint $BoundaryRoot $directory 'Directory cleanup target'
            if (-not (Test-Path -LiteralPath $directory)) { continue }
            $item = Get-Item -LiteralPath $directory -Force -ErrorAction Stop
            if (-not $item.PSIsContainer -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
                throw "Directory cleanup target is unsafe: $directory"
            }
            if (@(Get-ChildItem -LiteralPath $directory -Force -ErrorAction Stop).Count -ne 0) {
                $null = $nonEmpty.Add($directory)
                continue
            }
            Remove-Item -LiteralPath $directory -Force -ErrorAction Stop
            $null = $removed.Add($directory)
        } catch {
            $null = $failed.Add($directory)
        }
    }
    [pscustomobject]@{ removed = @($removed); nonEmpty = @($nonEmpty); failed = @($failed) }
}
```

성공·Remove에서는 managed-file parent를 AgentsHome 경계까지만 cleanup candidate로 모은다. rollback에서는 `createdDirectories`의 `nonEmpty`와 `failed`만 unresolved로 처리한다. 비재귀 삭제만 사용한다.

- [ ] **Step 4: Run rollback, removal, and full installer tests**

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\sync-harness.tests.ps1
git diff --check
```

Expected: clean rollback은 complete이고 외부 residue case만 unknown이다.

- [ ] **Step 5: Commit deterministic directory cleanup**

```powershell
git add -- scripts/sync-harness.ps1 tests/sync-harness.tests.ps1
git commit -m "fix: clean only proven empty harness directories"
```

---

### Task 6: Replace Design-Specific Public JSON

**Files:**
- Modify: `scripts/sync-harness.ps1`
- Modify: `tests/sync-harness.tests.ps1`

**Interfaces:**
- Consumes: current manifest active skill keys and internal state
- Produces: stable neutral result keys; internal state remains schema 2 and `personal-pilot`

- [ ] **Step 1: Add a strict public result assertion**

`Assert-PilotDisclosure`를 제거하고 다음 계약을 추가한다.

```powershell
function Assert-PublicResultContract {
    param($Result, [string] $ExpectedMode, [string] $Message)
    $required = @('activeSkills','agentsRoot','backupPath','blockers','changes','changesRequired','mode','rollback','skillsRoot','status','unresolvedTargets','warnings')
    Assert-Equal (($Result.PSObject.Properties.Name | Sort-Object) -join ',') (($required | Sort-Object) -join ',') "$Message result keys"
    Assert-Equal $Result.mode $ExpectedMode "$Message mode"
    $json = $Result | ConvertTo-Json -Compress -Depth 16
    foreach ($forbidden in @('designFrontendRoot','designFrontendPilot','bundleSelection','personal-pilot')) {
        Assert-True (-not $json.Contains($forbidden)) "$Message hides $forbidden"
    }
    Assert-True (-not (@($Result.changes).kind -contains 'designFrontend')) "$Message uses neutral change kinds"
}
```

Check, Apply, Remove, blocked invocation, rollback 결과에 모두 사용한다.

- [ ] **Step 2: Run the installer contract and confirm RED**

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\sync-harness.tests.ps1
```

- [ ] **Step 3: Build one neutral result shape**

작은 `New-HarnessPublicResult` helper를 만들어 네 return 경로가 같은 키를 사용하게 한다.

```powershell
function New-HarnessPublicResult {
    param(
        [string] $Status, [string] $Mode, [string] $AgentsRoot, [string] $SkillsRoot,
        [string[]] $ActiveSkills, [object[]] $Warnings, [bool] $ChangesRequired,
        [object[]] $Changes, [object[]] $Blockers, $BackupPath, $Rollback,
        [string[]] $UnresolvedTargets
    )
    [pscustomobject][ordered]@{
        status = $Status
        mode = $Mode
        agentsRoot = $AgentsRoot
        skillsRoot = $SkillsRoot
        activeSkills = @($ActiveSkills | Sort-Object -CaseSensitive)
        warnings = @($Warnings)
        changesRequired = $ChangesRequired
        changes = @($Changes)
        blockers = @($Blockers)
        backupPath = $BackupPath
        rollback = $Rollback
        unresolvedTargets = @($UnresolvedTargets)
    }
}
```

`mode`는 `check`, `apply`, `remove` 중 하나다. change kind `designFrontend`는 `managedFile`, `optionalCollision`은 `managedCollision`, `optionalDrift`는 `managedDrift`로 바꾼다. `-IncludeDesignFrontend` 경고는 다음 한 줄만 사용한다.

```text
DEPRECATED: -IncludeDesignFrontend is ignored; the current JOENESS bundle already installs all active skills.
```

공개 결과에서만 옛 필드를 제거한다. state의 `bundleSelection`과 V1 `sourceIdentities.designFrontend`는 유지한다.

- [ ] **Step 4: Run every mode and rollback contract**

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\sync-harness.tests.ps1
git diff --check
```

- [ ] **Step 5: Commit the neutral output**

```powershell
git add -- scripts/sync-harness.ps1 tests/sync-harness.tests.ps1
git commit -m "refactor: expose neutral JOENESS installer results"
```

---

### Task 7: Activate The Clean Names Atomically

**Files:**
- Create: `JOENESS.ps1`
- Modify: `vendor/source-manifest.json`
- Modify: `scripts/sync-harness.ps1`
- Modify: `.gitattributes`
- Modify: `tests/sync-harness.tests.ps1`
- Modify: `tests/project-setup.tests.ps1`
- Modify: `tests/design-vendor-integrity.tests.mjs`
- Modify: `tests/thin-hybrid-core.tests.mjs`
- Modify: `tests/design-frontend-routing.tests.mjs`
- Modify: `tests/design-frontend-hybrid-routing.tests.mjs`
- Remove: `skills/joewrks-project-setup/**`
- Remove: `skills/joewrks-design-frontend/**`

**Interfaces:**
- Consumes: final skill candidates, legacy trust, collision, rollback and neutral output from Tasks 2~6
- Produces: active manifest and installed tree containing only `project`, `design`, `visual-check`, `handoff`

- [ ] **Step 1: Write RED tests for the clean active interface**

`tests/design-vendor-integrity.tests.mjs`가 다음을 요구하게 한다.

```js
assert.deepEqual(manifest.release, {
  name: 'JOENESS',
  version: '0.1',
  entrypoint: 'JOENESS.ps1',
});
assert.deepEqual(Object.keys(manifest.activeSkills).sort(), [
  'design', 'handoff', 'project', 'visual-check',
]);
assert.equal(manifest.activeSkills.design.activationPolicy, 'hybrid');
assert.equal(manifest.activeSkills.project.activationPolicy, 'hybrid-offer-explicit-write');
assert.equal(manifest.activeSkills['visual-check'].activationPolicy, 'hybrid-visual-regression');
assert.equal(manifest.activeSkills.handoff.activationPolicy, 'explicit-only');
for (const skill of Object.values(manifest.activeSkills)) {
  assert.equal(skill.evaluationState, 'candidate');
}
```

`tests/sync-harness.tests.ps1`은 대표·버전 호환·과거 호환 파일을 따로 정의하고 세 파일의 Check JSON이 동일한지 검사한다.

```powershell
$ReleaseEntry = Join-Path $RepositoryRoot 'JOENESS.ps1'
$VersionCompatibilityEntry = Join-Path $RepositoryRoot 'JOENESS-0.1.ps1'
$LegacyCompatibilityEntry = Join-Path $RepositoryRoot 'harness.ps1'
```

`Write-LegacyNamedV2FixtureState`로 현재 0.1 옛 이름 설치본을 만든 뒤 다음을 검사한다.

```text
matching old files: 새 네 스킬 설치, 옛 managed files 제거, 옛 빈 디렉터리 제거
drifted old file: status=blocked, 어떤 새 파일도 쓰지 않음
unowned second old skill: duplicateSkill, 어떤 새 파일도 쓰지 않음
```

- [ ] **Step 2: Run the focused suite and confirm RED**

```powershell
node --test .\tests\design-vendor-integrity.tests.mjs .\tests\skill-contracts.tests.mjs .\tests\thin-hybrid-core.tests.mjs
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\sync-harness.tests.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\project-setup.tests.ps1
```

Expected: 대표 파일, activeSkills 새 키, helper 새 경로, legacy named V2 migration이 아직 없어 실패한다.

- [ ] **Step 3: Create the stable entrypoint and switch activeSkills**

`JOENESS.ps1`은 다음 두 줄만 가진다.

```powershell
& (Join-Path $PSScriptRoot 'scripts\sync-harness.ps1') @args
exit $LASTEXITCODE
```

manifest의 activeSkills를 새 네 키와 새 파일 경로로 교체하고 실제 bytes·SHA-256을 기록한다. `design.sourceDependencies`만 `ui-ux-pro-max`, `apple-design`을 가진다. 옛 active skill 원본은 compatibility archive가 검증된 후 활성 `skills/joewrks-*` 경로에서 제거한다.

`.gitattributes`에 `/JOENESS.ps1 text eol=lf`를 추가하고 Task 2에서 추가한 새 skill 규칙을 유지한다. 활성 영역에서 제거된 `/skills/joewrks-design-frontend/**`, `/skills/joewrks-project-setup/**` 규칙은 제거한다. Core v2 규칙과 두 호환 래퍼 규칙은 유지한다.

- [ ] **Step 4: Separate current evaluation from historical design evidence**

현재 `evaluation.current`의 옛 hybrid 객체는 바이트를 바꾸지 않고 `evaluation.history` 배열로 이동한다. 새 current는 다음 상태로 시작한다.

```json
{
  "mode": "active-skill-contract-v1",
  "version": 1,
  "state": "unvalidated",
  "cases": {
    "path": "evals/skill-contracts/cases.json",
    "sha256": "56de838e2cd019be801f9367566e49319f7713e69fef458eb2400214374ac90c"
  },
  "hardGate": "unverified",
  "classification": "candidate",
  "outcomeReview": "pending",
  "semanticImprovement": "not-asserted",
  "promotionPass": false
}
```

위 해시는 Task 2에 적은 JSON과 끝 LF를 포함한 1399 bytes의 값이다. 파일 bytes와 해시를 다시 계산해 일치시킨다. 기존 `behaviorEvidenceHistory`와 `behaviorEvidence`는 수정하지 않는다.

`evaluation.tests`에는 `tests/skill-contracts.tests.mjs`를 추가한다. 옛 hybrid 테스트나 artifact를 삭제하지 않는다.

- [ ] **Step 5: Point current tests at current skills and historical tests at the archive**

- `tests/project-setup.tests.ps1`의 helper 경로를 `skills\project\scripts\project-setup.ps1`로 바꾼다.
- `tests/thin-hybrid-core.tests.mjs`의 디자인 reference 검사를 `skills/design/SKILL.md`로 바꾼다.
- `tests/design-frontend-hybrid-routing.tests.mjs`의 역사 `SKILL` 상수는 `vendor/compatibility/joeness-0.1/skills/joewrks-design-frontend/SKILL.md`를 읽게 한다.
- `tests/design-frontend-routing.tests.mjs`의 materialization case는 temp source root에 compatibility design archive를 `skills/joewrks-design-frontend`로 복사한 뒤, 수정하지 않은 옛 evaluator에 그 temp source root를 넘긴다. 과거 artifact의 논리 path와 hash 기대값은 바꾸지 않는다.

materialization test의 source 준비는 다음처럼 현재 root를 바꾸지 않고 temp 내부에서만 수행한다.

```js
const sourceRoot = path.join(runRoot, 'legacy-source');
mkdirSync(path.join(sourceRoot, 'skills'), { recursive: true });
copyFileSync(path.join(ROOT, 'AGENTS.md'), path.join(sourceRoot, 'AGENTS.md'));
cpSync(path.join(ROOT, 'vendor'), path.join(sourceRoot, 'vendor'), { recursive: true });
cpSync(
  path.join(ROOT, 'vendor', 'compatibility', 'joeness-0.1', 'skills', 'joewrks-design-frontend'),
  path.join(sourceRoot, 'skills', 'joewrks-design-frontend'),
  { recursive: true },
);
const roots = await evaluator.materializeConditionRoots(runRoot, sourceRoot);
```

이 test 파일의 `node:fs` import에 `copyFileSync`, `cpSync`, `mkdirSync`를 추가한다.

- [ ] **Step 6: Apply the new manifest to an old V2 fixture and confirm migration**

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\sync-harness.tests.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\project-setup.tests.ps1
node --test .\tests\design-vendor-integrity.tests.mjs .\tests\thin-hybrid-core.tests.mjs .\tests\skill-contracts.tests.mjs
node --test .\tests\design-frontend-routing.tests.mjs .\tests\design-frontend-hybrid-routing.tests.mjs
git diff --check
```

Expected: 옛 V1, 옛 이름 V2, 새 설치가 모두 통과하고 실제 installed active skill은 네 새 이름뿐이다.

- [ ] **Step 7: Commit the atomic activation**

```powershell
git add -- JOENESS.ps1 .gitattributes vendor/source-manifest.json scripts/sync-harness.ps1 skills tests evals/skill-contracts
git commit -m "feat: activate the clean JOENESS interface"
```

---

### Task 8: Rewrite The Bilingual User Guide

**Files:**
- Modify: `README.md`
- Modify: `tests/sync-harness.tests.ps1`

**Interfaces:**
- Consumes: final entrypoint, four active names, neutral PowerShell JSON
- Produces: first-time Korean and English instructions with one compatibility table per language

- [ ] **Step 1: Write the README RED contract**

`Test-ReadmeContract`이 한국어와 영어 각각 다음을 요구하게 한다.

```text
primary commands: JOENESS.ps1 -Check, -Apply, -Remove
active calls: $project, $design, $visual-check, $handoff
PowerShell status is not a chat response
restart or open a new task after Apply
external plugins are installed separately and selected only when relevant
old entrypoint and calls appear only in one compatibility table per language
```

전체 README에서 `JOENESS-0.1.ps1`, `harness.ps1`, `joewrks-project-setup`, `joewrks-design-frontend`의 등장 횟수가 각 언어의 compatibility row를 넘지 않는지 개수로 검사한다.

- [ ] **Step 2: Run the README contract and confirm RED**

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\sync-harness.tests.ps1
```

- [ ] **Step 3: Make the normal path five short steps**

README 제목은 `# JOENESS`로 바꾸고 바로 아래에 `0.1 Beta` 상태를 둔다. 한국어와 영어의 첫 사용 흐름을 다음 순서로 맞춘다.

```text
1. ZIP 전체 압축 해제
2. 파일 탐색기 주소창에서 PowerShell 열기
3. JOENESS.ps1 -Check
4. ready일 때만 JOENESS.ps1 -Apply 후 다시 -Check
5. Codex 재실행 또는 새 작업에서 자연어 요청
```

네 역할 표는 호출명, 하는 일, 자동 선택 조건만 보여 준다. Figma, Superpowers, Ponytail의 provider 세부 스킬명은 호출법으로 나열하지 않고 별도 설치 구성 표에만 둔다. UI UX Pro Max와 Apple Design은 `$design` 내부 참고자료라고 설명한다.

호환 표는 다음 교체만 한 번 보여 준다.

```text
JOENESS-0.1.ps1 / harness.ps1 → JOENESS.ps1
$joewrks-project-setup → $project
$joewrks-design-frontend → $design
```

- [ ] **Step 4: Run README and integrity tests**

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\sync-harness.tests.ps1
node --test .\tests\design-vendor-integrity.tests.mjs .\tests\skill-contracts.tests.mjs
git diff --check
```

- [ ] **Step 5: Commit the user guide**

```powershell
git add -- README.md tests/sync-harness.tests.ps1
git commit -m "docs: simplify JOENESS installation and calls"
```

---

### Task 9: Release Regression And Fresh-Task Boundary

**Files:**
- Verify only: no planned source change
- Do not create `evals/experiments/active-skills-v1.json` until fresh-task evidence is actually observed

**Interfaces:**
- Consumes: complete candidate implementation
- Produces: exact automated test receipt, isolated install lifecycle, honest fresh-task validation boundary

- [ ] **Step 1: Run the complete repository suite once**

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\sync-harness.tests.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\project-setup.tests.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\p0-evaluation-contract.tests.ps1
node --test .\tests\*.tests.mjs
python -B .\vendor\ui-ux-pro-max\scripts\validate_data.py
python -B -m unittest discover -s .\vendor\ui-ux-pro-max\scripts\tests -p "test_*.py"
git diff --check
```

Expected: 모든 명령 exit code 0. 옛 evidence 해시는 보존되고 새 current는 여전히 `candidate/unvalidated`다.

- [ ] **Step 2: Verify an isolated full lifecycle**

임시 `CodexHome`, `AgentsHome`, `BackupRoot`를 만들어 다음 순서로 실행한다.

```powershell
powershell.exe -NoProfile -File .\JOENESS.ps1 -Check  -CodexHome $tempCodex -AgentsHome $tempAgents -BackupRoot $tempBackup
powershell.exe -NoProfile -File .\JOENESS.ps1 -Apply  -CodexHome $tempCodex -AgentsHome $tempAgents -BackupRoot $tempBackup
powershell.exe -NoProfile -File .\JOENESS.ps1 -Check  -CodexHome $tempCodex -AgentsHome $tempAgents -BackupRoot $tempBackup
powershell.exe -NoProfile -File .\JOENESS.ps1 -Remove -CodexHome $tempCodex -AgentsHome $tempAgents -BackupRoot $tempBackup
```

각 JSON에 neutral result keys만 있는지, Apply 후 activeSkills가 네 개와 정확히 일치하는지, Remove 후 JOENESS 소유 파일만 사라지는지 확인한다. 임시 경로는 절대경로를 검증한 뒤 정리한다.

- [ ] **Step 3: Test and document the downgrade boundary**

이번 릴리스는 이전 installer의 직접 Apply downgrade를 보장하지 않는다. 현재 릴리스가 보장하는 동작은 `new Apply → new Remove`까지다. 그 뒤 사용자가 선택한 옛 trusted ZIP의 Apply와 Check는 그 옛 패키지의 별도 실행이며 현재 릴리스의 검증 주장에 포함하지 않는다.

```text
new Apply → new Remove → old trusted ZIP Apply and Check as a separate, unverified package action
```

자동 검사에서는 `new Apply → new Remove`가 Core marker, state, 새 active skill files를 제거하고 비소유 파일을 보존하는 데까지 검증한다. 실제 옛 ZIP 실행 증거가 없으면 downgrade 성공이나 직접 downgrade 지원을 문서화하지 않는다.

- [ ] **Step 4: Apply to the user's active JOENESS installation from the controller only**

병렬 작업자나 테스트 fixture가 아니라 주 작업 controller가 실행한다.

```powershell
powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
powershell.exe -NoProfile -File .\JOENESS.ps1 -Apply
powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
```

첫 Check가 `ready`일 때만 Apply한다. `blocked`, `failed`, `unknown`이면 반복하지 않고 exact JSON과 현재 설치 state를 보고한다. Apply 후 Check가 `current`이고 실제 `.agents/skills` readback이 네 새 경로와 일치해야 설치 완료다.

- [ ] **Step 5: Hold the fresh-task claim until the app reloads**

현재 열린 작업은 스킬 목록을 소급 갱신하지 못하므로 여기서 자동 호출 성공을 주장하지 않는다. 앱 재실행 또는 새 Codex 작업에서 다음 네 read-only smoke prompt를 각각 한 번 사용한다.

```text
$project 장기 프로젝트의 계획 원장 유무만 읽기 전용으로 판단하고 파일은 만들지 마.
$design 로그인 화면의 UI 방향만 제안하고 파일은 바꾸지 마.
$visual-check 걷는 중 동쪽 프레임만 반전되는 결함의 검증 상태만 정리하고 파일은 바꾸지 마.
$handoff 이 빈 smoke 작업에서 인수인계에 필요한 필드만 설명하고 파일은 만들지 마.
```

네 이름의 실제 노출·명시 호출이 모두 관찰된 뒤에만 별도 후속 커밋으로 `evals/experiments/active-skills-v1.json`을 만들고 `evaluation.current.artifact`와 `hardGate`를 갱신한다. 일부만 확인되면 확인된 역할과 미확인 역할을 분리하고 `candidate/unvalidated`를 유지한다.

- [ ] **Step 6: Finish with a clean implementation branch**

Task 9에서 실패가 나오면 여기서 즉석 수정하지 않는다. 실패가 처음 도입된 Task의 RED/GREEN 단계로 돌아가 그 Task가 명시한 파일과 commit 형식으로 수정한다. 모든 검사가 통과한 뒤 다음을 확인하며 Task 9 자체는 새 커밋을 만들지 않는다.

```powershell
git status --short
git log --oneline --decorate -10
```

Expected: 작업 트리가 clean이고 Tasks 1~8의 독립 커밋이 보인다.
