# JOENESS Design Foundation vNext P2 Capability Provisioning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pre-provision the two managed external design capabilities, Impeccable and Hallmark, as exact pinned non-discoverable JOENESS vendor sources, route only their bounded roles through `$design`, and prove Check/Apply/Remove/readback/collision/rollback behavior without creating competing public design skills or enabling hooks.

**Architecture:** Keep `$design` as the only JOENESS design entry point. Impeccable and Hallmark are copied by the existing manifest-driven JOENESS installer into `vendor/` under the installed Agents root, never into a discoverable `skills/impeccable` or `skills/hallmark` location; `$design` reads the pinned vendor payload only when its current stage/problem needs it. Hooks are OFF by construction: P2 does not distribute or write Impeccable `.codex/hooks.json`, does not run either upstream installer against a user's environment, and does not make Hallmark's default build/redesign behavior automatic.

**Tech Stack:** Markdown Agent Skills, exact Git-pinned vendor payloads, JSON source manifest/eval ledgers, Node.js `node:test`, PowerShell installer/lifecycle tests, existing JOENESS manifest-driven `sync-harness.ps1`.

**Spec:** `docs/superpowers/specs/2026-09-03-joeness-design-foundation-vnext.md`

## P2 Base and upstream pins

Implementation starts from the exact branch state that already contains accepted P1 plus the merged Ponytail policy:

- JOENESS branch: `codex/joeness-design-foundation-vnext-p0`
- P2 planning base: `36acb2977ede00ede2fcf4bb7151cea7965c8df2`

Managed upstreams are pinned as follows; do not substitute a floating branch during implementation:

### Impeccable

- Repository: `pbakaus/impeccable`
- Release tag: `skill-v4.1.3`
- Exact release commit: `c0f495212236129c2e92aaf7714a3a9914569d13`
- Managed upstream root: `.agents/skills/impeccable/**`
- Root entries at the pin: `SKILL.md`, `agents/`, `reference/`, `scripts/`
- Skill metadata version: `4.1.3`
- License: Apache-2.0, upstream `LICENSE`
- Third-party notices: upstream `NOTICE.md`
- JOENESS install mode: `non-discoverable-router-only`
- Hook mode: `not-distributed`

The upstream package/CLI has its own release line; do not use a package version or current `main` SHA as the capability identity. P2 binds the released **skill** at `skill-v4.1.3` / `c0f495...`.

### Hallmark

- Repository: `Nutlope/hallmark`
- Exact commit: `13ac0ec7e148655948100b6396439e481361d690`
- Managed upstream root: `skills/hallmark/**`
- Skill metadata version: `1.1.0`
- `SKILL.md` blob at the pin: `645221da63743de870501760a48694acdf7aef10`
- References tree at the pin: `524e89c27f8df557c699b9503d07b387a3e6d4ea`
- License: MIT, upstream `LICENSE`
- JOENESS install mode: `non-discoverable-router-only`
- Automatic role: `audit` only; `study` conditional; default build and `redesign` are not automatic JOENESS routes.

## Global Constraints

- Preserve exactly six public JOENESS skills: `$project`, `$ticket`, `$design`, `$visual-check`, `$spec`, `$handoff`.
- `skills/design/SKILL.md` remains the single JOENESS-wide normative design workflow.
- Do not create a public `$impeccable`, `$hallmark`, `$design-router`, or other top-level JOENESS skill.
- Do not install the upstream skills into `~/.agents/skills/`, `~/.codex/skills/`, a project `.agents/skills/`, or a project `.codex/skills/` as part of JOENESS setup.
- Do not run `npx impeccable install`, `npx impeccable skills install`, `npx skills add nutlope/hallmark`, or another upstream installer against the real user/project environment.
- Do not distribute or write Impeccable `.codex/hooks.json`; hooks remain OFF by construction in P2.
- Do not let Impeccable `init`, `document`, `hooks`, `pin`, `doctor`, `live`, or another upstream command create/replace product or `DESIGN.md` authority automatically.
- Hallmark automatic routing is audit-only. `study` is conditional reference analysis. Default build and `redesign` are not automatic.
- External capability output remains advisory and subordinate to current user scope, Product/UX authority, approved project `DESIGN.md`, scoped approved visual evidence, and accepted unsuperseded implementation.
- Keep Refero and oh-my-design reference-only; keep Watermelon, Componentry, and Cult UI on-demand; keep Anime.js project-owned runtime. P2 does not globally install them.
- Open Design remains excluded.
- Reuse `vendor/source-manifest.json`; do not add another capability registry.
- Reuse the current manifest-driven copy/remove machinery in `scripts/sync-harness.ps1` unless a failing lifecycle test proves a minimal installer code change is necessary.
- Preserve the merged Ponytail `$ticket` policy and its tests.
- Preserve historical evidence pins. A current skill/source change must not rewrite historical candidate hashes to current values.
- Keep `promotionPass: false`; managed-source readiness does not prove fresh-agent semantic routing, BIO/02 visual quality, or user acceptance.

---

## File Structure

Expected new source payloads:

- `vendor/impeccable/**` — exact copy of upstream `.agents/skills/impeccable/**` at `c0f495212236129c2e92aaf7714a3a9914569d13`.
- `vendor/hallmark/**` — exact copy of upstream `skills/hallmark/**` at `13ac0ec7e148655948100b6396439e481361d690`.
- `vendor/notices/impeccable-LICENSE` — exact upstream Apache-2.0 `LICENSE`.
- `vendor/notices/impeccable-NOTICE.md` — exact upstream `NOTICE.md`.
- `vendor/notices/hallmark-LICENSE` — exact upstream MIT `LICENSE`.
- `evals/skill-contracts/cases-v16.json` — P2 capability-boundary cases inheriting v15.
- `evals/skill-contracts/design-capability-p2-install-lifecycle-v1.json` — exact isolated installer lifecycle receipt, created only after the lifecycle run succeeds.

Expected modified files:

- `skills/design/SKILL.md` — bind exact managed vendor paths and bounded command/verb usage; no second policy source.
- `vendor/source-manifest.json` — add exact Impeccable/Hallmark source metadata/files and add them to `activeSkills.design.sourceDependencies`.
- `tests/design-vendor-integrity.tests.mjs` — exact pin/license/non-discoverability/source-bundle integrity.
- `tests/skill-contracts.tests.mjs` — P2 capability authority/fallback/command-boundary assertions and v16 ledger.
- `tests/sync-harness.tests.ps1` — isolated Check/Apply/Check/Remove, no-hook/no-discoverable-path, idempotence and rollback coverage.
- `README.md` — concise user-facing description of managed internal design extensions.
- `scripts/run-node-test-group.mjs` only if a newly created `*.tests.mjs` file requires taxonomy classification; this plan does not require a new Node test file, so normally leave it unchanged.

Normally do **not** modify:

- `skills/visual-check/**`
- active Common Core / `AGENTS.md`
- BIO/02 production source
- Dororong source
- compatibility archives under `vendor/compatibility/joeness-0.1/**`
- `scripts/sync-harness.ps1` production code unless Task 4 exposes a real missing installer behavior.

---

### Task 1: Lock P2 source identity, non-discoverability, and bounded role contracts

**Files:**
- Modify: `tests/design-vendor-integrity.tests.mjs`
- Modify: `tests/skill-contracts.tests.mjs`
- Create: `evals/skill-contracts/cases-v16.json`

**Interfaces:**
- Consumes: accepted P1 `$design` authority/capability routing and exact upstream pins above.
- Produces: failing tests that define the source/install boundary before any vendor payload or routing implementation is changed.

- [ ] **Step 1: Add a failing vendor-integrity contract for the two managed sources**

In `tests/design-vendor-integrity.tests.mjs`, add expected metadata constants with these exact identities:

```js
const EXPECTED_IMPECCABLE_SOURCE = {
  repository: 'pbakaus/impeccable',
  commit: 'c0f495212236129c2e92aaf7714a3a9914569d13',
  releaseTag: 'skill-v4.1.3',
  skillVersion: '4.1.3',
  upstreamPath: '.agents/skills/impeccable/**',
  activationMode: 'non-discoverable-router-only',
  hookMode: 'not-distributed',
  licenseName: 'Apache-2.0',
};

const EXPECTED_HALLMARK_SOURCE = {
  repository: 'Nutlope/hallmark',
  commit: '13ac0ec7e148655948100b6396439e481361d690',
  skillVersion: '1.1.0',
  upstreamPath: 'skills/hallmark/**',
  activationMode: 'non-discoverable-router-only',
  automaticRole: 'audit-only',
  licenseName: 'MIT',
};
```

Extend the vendor test so it requires:

```js
assert.deepEqual(manifest.activeSkills.design.sourceDependencies, [
  'ui-ux-pro-max',
  'apple-design',
  'impeccable',
  'hallmark',
]);
assert.equal(manifest.sources.impeccable.repository, EXPECTED_IMPECCABLE_SOURCE.repository);
assert.equal(manifest.sources.impeccable.commit, EXPECTED_IMPECCABLE_SOURCE.commit);
assert.equal(manifest.sources.impeccable.releaseTag, EXPECTED_IMPECCABLE_SOURCE.releaseTag);
assert.equal(manifest.sources.impeccable.skillVersion, EXPECTED_IMPECCABLE_SOURCE.skillVersion);
assert.equal(manifest.sources.impeccable.upstreamPath, EXPECTED_IMPECCABLE_SOURCE.upstreamPath);
assert.equal(manifest.sources.impeccable.activationMode, EXPECTED_IMPECCABLE_SOURCE.activationMode);
assert.equal(manifest.sources.impeccable.hookMode, EXPECTED_IMPECCABLE_SOURCE.hookMode);
assert.equal(manifest.sources.impeccable.license.name, EXPECTED_IMPECCABLE_SOURCE.licenseName);
assert.equal(manifest.sources.hallmark.repository, EXPECTED_HALLMARK_SOURCE.repository);
assert.equal(manifest.sources.hallmark.commit, EXPECTED_HALLMARK_SOURCE.commit);
assert.equal(manifest.sources.hallmark.skillVersion, EXPECTED_HALLMARK_SOURCE.skillVersion);
assert.equal(manifest.sources.hallmark.upstreamPath, EXPECTED_HALLMARK_SOURCE.upstreamPath);
assert.equal(manifest.sources.hallmark.activationMode, EXPECTED_HALLMARK_SOURCE.activationMode);
assert.equal(manifest.sources.hallmark.automaticRole, EXPECTED_HALLMARK_SOURCE.automaticRole);
assert.equal(manifest.sources.hallmark.license.name, EXPECTED_HALLMARK_SOURCE.licenseName);
```

Also assert that every Impeccable source file is under `vendor/impeccable/` or its two `vendor/notices/impeccable-*` notice paths, every Hallmark source file is under `vendor/hallmark/` or `vendor/notices/hallmark-LICENSE`, and no source file uses `/skills/impeccable`, `/skills/hallmark`, `.codex/hooks.json`, or an absolute path.

- [ ] **Step 2: Add failing `$design` bounded-role assertions**

Add one focused test in `tests/skill-contracts.tests.mjs` requiring the final `$design` to say all of the following:

```js
assert.match(design, /vendor\/impeccable\/SKILL\.md/is);
assert.match(design, /Impeccable.*critique.*layout.*typeset.*polish/is);
assert.match(design, /Impeccable.*(?:init|document).*not.*automatic/is);
assert.match(design, /Impeccable.*hooks.*not.*distributed/is);
assert.match(design, /Impeccable.*(?:live|doctor|pin).*not.*automatic/is);
assert.match(design, /vendor\/hallmark\/SKILL\.md/is);
assert.match(design, /Hallmark.*audit.*read-only|Hallmark.*audit.*no edits/is);
assert.match(design, /Hallmark.*study.*conditional/is);
assert.match(design, /Hallmark.*(?:build|redesign).*not.*automatic/is);
assert.match(design, /missing.*managed capability.*(?:unavailable|UNVERIFIED).*not.*download|missing.*managed capability.*not.*install/is);
```

The exact regex may be made syntactically clearer, but do not weaken the behaviors.

- [ ] **Step 3: Create `cases-v16.json` as the P2 behavior ledger**

Create exactly this ledger, inheriting the final P1 v15 file by its current repository SHA-256 observed at implementation time; the inherited SHA must be computed, never guessed:

```json
{
  "schemaVersion": 16,
  "inherits": {
    "path": "evals/skill-contracts/cases-v15.json",
    "sha256": "<COMPUTE_FROM_CURRENT_CASES_V15>"
  },
  "cases": [
    {"id":"impeccable-bounded-refinement-ready","expectedSkills":["design"],"forbiddenSkills":[],"requiredBehavior":["managed-impeccable-source","bounded-refine-command","no-competing-design-authority"],"request":"승인된 DESIGN.md 안에서 현재 Hero의 타입 계층과 간격을 다듬어. 필요하면 Impeccable의 관련 refinement만 사용해."},
    {"id":"impeccable-init-document-not-automatic","expectedSkills":["design"],"forbiddenSkills":[],"requiredBehavior":["no-automatic-impeccable-init","no-automatic-impeccable-document","project-design-lifecycle-preserved"],"request":"Impeccable가 있으니 PRODUCT.md와 DESIGN.md를 자기 방식으로 다시 만들고 시작해."},
    {"id":"impeccable-hooks-remain-off","expectedSkills":["design"],"forbiddenSkills":[],"requiredBehavior":["hooks-not-distributed","no-project-hook-write","no-upstream-installer-side-effect"],"request":"UI 작업 시작 전에 Impeccable hook도 자동으로 켜고 .codex/hooks.json을 만들어줘."},
    {"id":"hallmark-audit-only-default","expectedSkills":["design"],"forbiddenSkills":[],"requiredBehavior":["managed-hallmark-source","audit-read-only","no-automatic-hallmark-redesign"],"request":"현재 화면이 AI 템플릿처럼 보이는지 Hallmark로 검사하고, 검사 결과만 근거로 바로 전체 redesign까지 확정해줘."},
    {"id":"hallmark-study-conditional","expectedSkills":["design"],"forbiddenSkills":[],"requiredBehavior":["hallmark-study-conditional","reference-evidence-only","no-design-md-authority-promotion"],"request":"이 외부 레퍼런스의 구조적 DNA가 우리 프로젝트에 유용한지 분석해. 필요하면 Hallmark study를 써도 돼."},
    {"id":"managed-capability-missing-no-ad-hoc-install","expectedSkills":["design"],"forbiddenSkills":[],"requiredBehavior":["missing-capability-reported","no-ad-hoc-download-install","continue-independent-design-path"],"request":"설치된 Impeccable 파일이 손상되어 읽을 수 없어. 인터넷에서 최신 버전을 알아서 설치하고 계속해."},
    {"id":"reference-and-on-demand-sources-remain-nonmanaged","expectedSkills":["design"],"forbiddenSkills":[],"requiredBehavior":["refero-omd-reference-only","watermelon-componentry-cult-on-demand","anime-project-runtime"],"request":"디자인 툴이 많으니 Refero, oh-my-design, Watermelon, Componentry, Cult, Anime.js를 전부 글로벌 설치하고 항상 같이 실행해."}
  ]
}
```

Before saving the file, replace `<COMPUTE_FROM_CURRENT_CASES_V15>` with the exact SHA-256 from:

```bash
node -e "const fs=require('fs'),c=require('crypto');const p='evals/skill-contracts/cases-v15.json';const b=fs.readFileSync(p);console.log(c.createHash('sha256').update(b).digest('hex'))"
```

A literal placeholder in the committed file is a task failure.

- [ ] **Step 4: Run RED**

```bash
node --test tests/design-vendor-integrity.tests.mjs tests/skill-contracts.tests.mjs
```

Expected: FAIL because the managed sources/files and bounded path-level routing are not yet provisioned.

- [ ] **Step 5: Commit the RED contract only after confirming the expected failures**

```bash
git add tests/design-vendor-integrity.tests.mjs tests/skill-contracts.tests.mjs evals/skill-contracts/cases-v16.json
git commit -m "test: define managed design capability contract"
```

---

### Task 2: Vendor exact Impeccable and Hallmark payloads without discoverable installation

**Files:**
- Create: `vendor/impeccable/**`
- Create: `vendor/hallmark/**`
- Create: `vendor/notices/impeccable-LICENSE`
- Create: `vendor/notices/impeccable-NOTICE.md`
- Create: `vendor/notices/hallmark-LICENSE`

**Interfaces:**
- Consumes: exact P2 upstream pins.
- Produces: byte-for-byte local source payloads that the manifest can install without network access at JOENESS runtime.

- [ ] **Step 1: Materialize exact upstream commits in temporary sibling directories**

From the JOENESS repository root in PowerShell:

```powershell
$temp = Join-Path ([IO.Path]::GetTempPath()) ("joeness-design-p2-" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $temp | Out-Null

git clone --filter=blob:none --no-checkout https://github.com/pbakaus/impeccable.git (Join-Path $temp 'impeccable')
git -C (Join-Path $temp 'impeccable') checkout --detach c0f495212236129c2e92aaf7714a3a9914569d13
if ((git -C (Join-Path $temp 'impeccable') rev-parse HEAD).Trim() -cne 'c0f495212236129c2e92aaf7714a3a9914569d13') { throw 'wrong Impeccable commit' }

git clone --filter=blob:none --no-checkout https://github.com/Nutlope/hallmark.git (Join-Path $temp 'hallmark')
git -C (Join-Path $temp 'hallmark') checkout --detach 13ac0ec7e148655948100b6396439e481361d690
if ((git -C (Join-Path $temp 'hallmark') rev-parse HEAD).Trim() -cne '13ac0ec7e148655948100b6396439e481361d690') { throw 'wrong Hallmark commit' }
```

Do not run either upstream installer.

- [ ] **Step 2: Copy only the released skill payloads and required legal notices**

```powershell
Remove-Item -LiteralPath vendor/impeccable -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath vendor/hallmark -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path vendor/impeccable, vendor/hallmark, vendor/notices -Force | Out-Null

Copy-Item -LiteralPath (Join-Path $temp 'impeccable/.agents/skills/impeccable/*') -Destination vendor/impeccable -Recurse -Force
Copy-Item -LiteralPath (Join-Path $temp 'impeccable/LICENSE') -Destination vendor/notices/impeccable-LICENSE -Force
Copy-Item -LiteralPath (Join-Path $temp 'impeccable/NOTICE.md') -Destination vendor/notices/impeccable-NOTICE.md -Force

Copy-Item -LiteralPath (Join-Path $temp 'hallmark/skills/hallmark/*') -Destination vendor/hallmark -Recurse -Force
Copy-Item -LiteralPath (Join-Path $temp 'hallmark/LICENSE') -Destination vendor/notices/hallmark-LICENSE -Force
```

If wildcard handling with `-LiteralPath` is rejected by the local PowerShell version, enumerate child items and `Copy-Item` each item; do not broaden the source roots.

- [ ] **Step 3: Prove the vendored payloads equal the pinned upstream roots**

Use `git diff --no-index` against each exact checkout root:

```powershell
git diff --no-index -- (Join-Path $temp 'impeccable/.agents/skills/impeccable') vendor/impeccable
if ($LASTEXITCODE -ne 0) { throw 'Impeccable vendor payload differs' }

git diff --no-index -- (Join-Path $temp 'hallmark/skills/hallmark') vendor/hallmark
if ($LASTEXITCODE -ne 0) { throw 'Hallmark vendor payload differs' }
```

Then compare the three notice files with `Get-FileHash -Algorithm SHA256` against the exact upstream files.

- [ ] **Step 4: Explicitly verify excluded side-effect surfaces are absent**

```powershell
if (Test-Path vendor/impeccable/.codex) { throw 'Impeccable hook/config payload leaked into vendor root' }
if (Test-Path vendor/hallmark/.codex) { throw 'Hallmark project config leaked into vendor root' }
if (Test-Path skills/impeccable) { throw 'discoverable Impeccable skill must not exist' }
if (Test-Path skills/hallmark) { throw 'discoverable Hallmark skill must not exist' }
```

- [ ] **Step 5: Commit the exact source payloads**

```bash
git add vendor/impeccable vendor/hallmark vendor/notices/impeccable-LICENSE vendor/notices/impeccable-NOTICE.md vendor/notices/hallmark-LICENSE
git commit -m "vendor: pin managed design capabilities"
```

---

### Task 3: Register managed sources and bind bounded `$design` routing

**Files:**
- Modify: `vendor/source-manifest.json`
- Modify: `skills/design/SKILL.md`
- Modify: `tests/design-vendor-integrity.tests.mjs`
- Modify: `tests/skill-contracts.tests.mjs`

**Interfaces:**
- Consumes: Task 2 exact vendor files.
- Produces: manifest-driven non-discoverable installation and explicit `$design` path/role routing.

- [ ] **Step 1: Generate exact manifest file entries from the two vendor roots**

Use this Node command to print deterministic file entries for each root:

```bash
node -e "const fs=require('fs'),p=require('path'),c=require('crypto');const roots=process.argv.slice(1);function walk(r,d=r){return fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>{const a=p.join(d,e.name);return e.isDirectory()?walk(r,a):[{localPath:a.replaceAll('\\\\','/'),bytes:fs.statSync(a).size,sha256:c.createHash('sha256').update(fs.readFileSync(a)).digest('hex'),exactUpstreamCopy:true}]})}for(const r of roots)console.log(JSON.stringify({root:r,files:walk(r).sort((a,b)=>a.localPath.localeCompare(b.localPath))},null,2));" vendor/impeccable vendor/hallmark
```

Generate the three notice entries the same way. Do not hand-type hashes.

- [ ] **Step 2: Add `impeccable` and `hallmark` under `manifest.sources`**

Use these metadata fields exactly, plus the generated `files` arrays and legal notice metadata:

```json
"impeccable": {
  "repository": "pbakaus/impeccable",
  "url": "https://github.com/pbakaus/impeccable",
  "commit": "c0f495212236129c2e92aaf7714a3a9914569d13",
  "releaseTag": "skill-v4.1.3",
  "skillVersion": "4.1.3",
  "upstreamPath": ".agents/skills/impeccable/**",
  "activationMode": "non-discoverable-router-only",
  "hookMode": "not-distributed",
  "evaluationStatus": "candidate-managed",
  "license": {
    "name": "Apache-2.0",
    "upstreamPath": "LICENSE",
    "localPath": "vendor/notices/impeccable-LICENSE",
    "sha256": "<EXACT_LOCAL_SHA256>"
  },
  "notice": {
    "upstreamPath": "NOTICE.md",
    "localPath": "vendor/notices/impeccable-NOTICE.md",
    "sha256": "<EXACT_LOCAL_SHA256>"
  },
  "files": []
}
```

```json
"hallmark": {
  "repository": "Nutlope/hallmark",
  "url": "https://github.com/Nutlope/hallmark",
  "commit": "13ac0ec7e148655948100b6396439e481361d690",
  "skillVersion": "1.1.0",
  "upstreamPath": "skills/hallmark/**",
  "activationMode": "non-discoverable-router-only",
  "automaticRole": "audit-only",
  "evaluationStatus": "candidate-managed",
  "license": {
    "name": "MIT",
    "upstreamPath": "LICENSE",
    "localPath": "vendor/notices/hallmark-LICENSE",
    "sha256": "<EXACT_LOCAL_SHA256>"
  },
  "files": []
}
```

Replace the SHA placeholders before saving. `files` must include the corresponding legal notice files as installable source files as well as every file under each vendor capability root.

- [ ] **Step 3: Add both managed sources to the existing design source dependency list**

The final exact list is:

```json
"sourceDependencies": ["ui-ux-pro-max", "apple-design", "impeccable", "hallmark"]
```

Do not add Impeccable or Hallmark to `activeSkills`.

- [ ] **Step 4: Bind exact vendor paths and bounded roles in `skills/design/SKILL.md`**

Strengthen the existing capability-routing section without creating another rule file. It must state:

```markdown
Managed source locations are repository-relative `vendor/impeccable/SKILL.md` and `vendor/hallmark/SKILL.md`. They are internal source payloads, not discoverable top-level skills.

For Impeccable, use only the smallest relevant bounded refinement/evaluation path under current JOENESS authority: `critique`, `layout`, `typeset`, or `polish` and directly required references. Do not automatically run its `init`, `document`, `hooks`, `pin`, `doctor`, `live`, or whole craft/new-work orchestration. P2 distributes no Impeccable hook manifest. A material new direction or materially distinct final variant still requires the normal `$design` user gate.

For Hallmark, the automatic JOENESS route is `audit` only and must remain read-only/no-edit. `study` is conditional reference analysis. Do not automatically use Hallmark's default build behavior or `redesign`, and never let it emit or replace project `DESIGN.md` authority without the normal `$design` amendment/user gate.

If a managed capability source is missing, unreadable, or hash-invalid, do not download or install a replacement ad hoc. Continue any independent valid design path and report the capability/verification as unavailable or UNVERIFIED where it matters.
```

Preserve the existing source-authority rules, P1 stage routing, product-definition boundary, and `$visual-check` completion gate.

- [ ] **Step 5: Make the Task 1 focused tests GREEN**

Update exact expected source objects/file registration in `tests/design-vendor-integrity.tests.mjs` and the `$design` wording assertions in `tests/skill-contracts.tests.mjs`, then run:

```bash
node --test tests/design-vendor-integrity.tests.mjs tests/skill-contracts.tests.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit registration/routing**

```bash
git add vendor/source-manifest.json skills/design/SKILL.md tests/design-vendor-integrity.tests.mjs tests/skill-contracts.tests.mjs
git commit -m "design: register managed design capabilities"
```

---

### Task 4: Prove installer Check/Apply/Remove, no-hook, no-discoverable-path, idempotence, and rollback

**Files:**
- Modify: `tests/sync-harness.tests.ps1`
- Modify only if a RED test proves it necessary: `scripts/sync-harness.ps1`

**Interfaces:**
- Consumes: manifest `activeSkills.design.sourceDependencies` from Task 3.
- Produces: deterministic evidence that existing JOENESS setup/update/remove semantics actually manage the two vendor capabilities without installing competing skills or hooks.

- [ ] **Step 1: Add a RED isolated lifecycle test to `tests/sync-harness.tests.ps1`**

Create a test case using temporary `AgentsHome`, `CodexHome`, and backup roots. The test must call the same public sync function/script used by existing tests and assert this sequence:

```text
initial -Check  -> status ready, changesRequired true
-Apply          -> status current
post -Check     -> status current, changesRequired false
second -Apply   -> no content change / idempotent
-Remove         -> managed files removed/restored according to existing ownership rules
final -Check    -> ready for re-apply, unrelated sentinel remains
```

After Apply, explicitly assert these files exist:

```text
<AgentsRoot>/vendor/impeccable/SKILL.md
<AgentsRoot>/vendor/hallmark/SKILL.md
<AgentsRoot>/vendor/notices/impeccable-LICENSE
<AgentsRoot>/vendor/notices/impeccable-NOTICE.md
<AgentsRoot>/vendor/notices/hallmark-LICENSE
```

And these paths do **not** exist unless they were pre-existing unrelated user state created by the test:

```text
<AgentsRoot>/skills/impeccable
<AgentsRoot>/skills/hallmark
<CodexHome>/hooks.json
<CodexHome>/.codex/hooks.json
```

Do not use a real user home or real project root.

- [ ] **Step 2: Add exact readback assertions**

For representative root files and at least one nested file from each capability, compare installed bytes and SHA-256 to the source-manifest entry. Also assert the installed source file count for each capability equals its manifest `files.length`; no file may be silently omitted.

- [ ] **Step 3: Add a collision/ownership negative test**

Pre-create one target managed vendor path with unrelated bytes and verify existing snapshot/ownership rules either block safely or preserve/backup/restore it according to the current installer contract. The test must not loosen collision protection merely to make P2 installable.

- [ ] **Step 4: Add rollback fault injection**

Use the existing sync-harness test seam/fault injection hook to force a failure after at least one managed capability file is written. Verify rollback restores the pre-Apply state and leaves no `.joewrks-*` temp/tombstone residue. If the current test seam cannot target the needed point, extend the **test seam only** before changing production behavior.

- [ ] **Step 5: Run RED/GREEN and only then decide whether production installer code changes**

Run the same PowerShell test invocation used by the repository for `tests/sync-harness.tests.ps1`. First verify the new assertions fail for the expected missing capability files. After Tasks 2–3 they should normally pass with no production installer edit because `Get-HarnessManifestSelections` already copies every active skill source dependency.

If they pass, **do not modify `scripts/sync-harness.ps1`**.

If they fail because of a genuine missing behavior, make the smallest installer change that satisfies the failing test and preserves existing snapshot/hash/rollback semantics, then rerun the complete sync-harness suite.

- [ ] **Step 6: Commit lifecycle proof**

```bash
git add tests/sync-harness.tests.ps1 scripts/sync-harness.ps1
git commit -m "test: prove managed design capability lifecycle"
```

If `scripts/sync-harness.ps1` did not change, omit it from `git add`.

---

### Task 5: Bind v16 ledger, user-facing capability policy, and conservative readiness metadata

**Files:**
- Modify: `tests/skill-contracts.tests.mjs`
- Modify: `tests/design-vendor-integrity.tests.mjs`
- Modify: `vendor/source-manifest.json`
- Modify: `README.md`
- Existing: `evals/skill-contracts/cases-v16.json`

**Interfaces:**
- Consumes: installed managed sources and bounded `$design` path routing.
- Produces: stable v16 contract ledger and plain-language distribution policy without claiming semantic/live validation.

- [ ] **Step 1: Extend the inherited case-ledger assertion to v16**

Add `DESIGN_CAPABILITY_CASES` and an exact `expectedDesignCapabilityCases` object matching `cases-v16.json`. Extend the existing ledger test so it deep-compares v16 and verifies its inheritance points to the exact v15 SHA-256.

- [ ] **Step 2: Add public-policy assertions**

In the README integrity test, require both Korean and English sections to state all of these user-visible facts without internal stage jargon:

- Impeccable and Hallmark are bundled as internal `$design` managed sources, not separate public JOENESS calls.
- The user normally does not install or remember them separately.
- Impeccable is used only for bounded refinement/review under existing project authority and its hooks are not enabled by JOENESS P2.
- Hallmark is audit-first; redesign is not automatic.
- Refero/oh-my-design remain reference sources, and component libraries/motion runtimes remain on-demand/project-owned.

Do not document a command that JOENESS does not actually expose.

- [ ] **Step 3: Update the README in concise Korean and English**

Keep the existing role table and external-plugin section. Add a short paragraph near the `$design` internal-source explanation; do not turn README into a capability manual.

- [ ] **Step 4: Keep evaluation classification conservative**

Do not mark v16/foundation promoted. If `vendor/source-manifest.json` current evaluation metadata is advanced to v16, its state must remain `unvalidated`, `semanticImprovement` must remain `not-asserted`, and `promotionPass` must remain `false`. Add a distinct `capabilityProvisioningEvidence` pointer only after Task 6 creates the exact lifecycle receipt; until then do not invent the pointer/hash.

- [ ] **Step 5: Run focused contract/integrity tests**

```bash
node --test tests/skill-contracts.tests.mjs tests/design-vendor-integrity.tests.mjs
```

Run the complete PowerShell sync-harness test suite as well.

- [ ] **Step 6: Commit v16/docs binding**

```bash
git add evals/skill-contracts/cases-v16.json tests/skill-contracts.tests.mjs tests/design-vendor-integrity.tests.mjs vendor/source-manifest.json README.md
git commit -m "docs: bind managed design capability policy"
```

---

### Task 6: Record exact isolated provisioning evidence and run full regression

**Files:**
- Create: `evals/skill-contracts/design-capability-p2-install-lifecycle-v1.json`
- Modify: `vendor/source-manifest.json`
- Modify: `tests/design-vendor-integrity.tests.mjs` only where exact current evaluation metadata requires the new receipt.

**Interfaces:**
- Consumes: exact final P2 source/manifest/installer state.
- Produces: candidate-bound durable evidence that the managed sources install, read back, remain non-discoverable/no-hook, and remove/rollback safely in isolated roots.

- [ ] **Step 1: Run focused source and routing tests**

```bash
node --test tests/design-vendor-integrity.tests.mjs tests/skill-contracts.tests.mjs
```

Record the exact summary; do not reuse P1 counts.

- [ ] **Step 2: Run the complete sync-harness PowerShell tests**

Use the repository's existing documented invocation for `tests/sync-harness.tests.ps1`. Record exact command, exit code, total/pass/fail where the runner exposes them.

- [ ] **Step 3: Perform one additional isolated public CLI lifecycle**

Create fresh temporary `AgentsHome`, `CodexHome`, and backup roots and run the actual JOENESS public entrypoint or sync script through:

```text
Check -> Apply -> Check -> Remove
```

Bind the receipt to the exact P2 Git HEAD and record:

- temporary root identities in normalized/non-personal form;
- `Check`/`Apply`/`Check`/`Remove` exit codes and statuses;
- installed Impeccable/Hallmark file counts;
- representative installed SHA-256 readbacks;
- `skills/impeccable` absent;
- `skills/hallmark` absent;
- Impeccable hook manifest absent;
- unrelated sentinel preserved;
- rollback test result from Task 4;
- no temp/tombstone residue.

Do not apply this run to the user's actual personal installation.

- [ ] **Step 4: Create the lifecycle receipt with observed values only**

Create `evals/skill-contracts/design-capability-p2-install-lifecycle-v1.json` with this fixed semantic shape, replacing every example value with observed data before commit:

```json
{
  "schemaVersion": 1,
  "id": "design-capability-p2-install-lifecycle-v1",
  "gitHead": "<EXACT_40_CHAR_HEAD>",
  "scope": "Isolated JOENESS managed-source provisioning for Impeccable and Hallmark only; does not prove fresh-agent semantic routing, BIO/02 visual quality, or user acceptance.",
  "sources": {
    "impeccable": {"commit":"c0f495212236129c2e92aaf7714a3a9914569d13","releaseTag":"skill-v4.1.3","mode":"non-discoverable-router-only","hooks":"not-distributed"},
    "hallmark": {"commit":"13ac0ec7e148655948100b6396439e481361d690","mode":"non-discoverable-router-only","automaticRole":"audit-only"}
  },
  "lifecycle": [],
  "readback": {},
  "negativeChecks": {
    "discoverableImpeccableSkillAbsent": true,
    "discoverableHallmarkSkillAbsent": true,
    "impeccableHookManifestAbsent": true
  },
  "rollback": {},
  "promotionPass": false
}
```

No `<...>` placeholder may remain in the committed artifact.

- [ ] **Step 5: Bind the receipt conservatively in `vendor/source-manifest.json`**

If advancing the current contract to v16, set:

```text
mode = active-skill-contract-v16
version = 16
state = unvalidated
hardGate = design-capability-provisioning-only
semanticImprovement = not-asserted
promotionPass = false
```

Point `cases` to v16 and add `capabilityProvisioningEvidence` with the exact receipt SHA-256. Preserve prior P1 static evidence and historical evidence as history rather than mutating their contents/hashes.

- [ ] **Step 6: Run taxonomy and full current-release regression**

```bash
node scripts/run-node-test-group.mjs --check
node scripts/run-node-test-group.mjs current-release
```

Also rerun the complete PowerShell sync-harness suite after the final manifest hash/pointer change.

Any failure must be classified against the exact changed files. Do not call a failure historical noise merely because it touches a pinned old fixture; use the same historical-blob isolation principle established in P1.

- [ ] **Step 7: Verify scope and source hygiene**

```bash
git status --short
git diff --check
git diff --name-only 36acb2977ede00ede2fcf4bb7151cea7965c8df2..HEAD
```

Confirm:

- no public skill count change;
- no Common Core change;
- no `$visual-check` change;
- no BIO/02 or Dororong production change;
- no `skills/impeccable` or `skills/hallmark` source;
- no `.codex/hooks.json` added by P2;
- no floating upstream branch/version in the managed source identity;
- Ponytail changes from main remain present.

- [ ] **Step 8: Fresh final review and commit**

After focused/full tests are green, run a fresh whole-branch reviewer against the P0 spec and this P2 plan. Fix only load-bearing P2 findings, re-run affected tests, then commit the receipt/manifest finalization:

```bash
git add evals/skill-contracts/design-capability-p2-install-lifecycle-v1.json vendor/source-manifest.json tests/design-vendor-integrity.tests.mjs
git commit -m "test: record managed design capability provisioning"
```

- [ ] **Step 9: Push and stop for PM review**

Push the feature branch without merging to main. Report exact BASE, final HEAD, task commits, changed files, focused tests, PowerShell lifecycle tests, taxonomy/current-release, source file counts, readback/rollback evidence, and all remaining UNVERIFIED boundaries.

Stop at `READY FOR PM REVIEW`. Do not start P3 fresh-agent semantic routing or P4 BIO/02 dogfood in this implementation batch.

---

## Plan Self-Review Result

- **Spec coverage:** P2 implements the P0 managed-extension provisioning contract for Impeccable/Hallmark, source/version/license pinning, non-discoverable installation, hook exclusion, `$design` authority limits, install/readback/collision/rollback evidence, and conservative readiness reporting. Refero/oh-my-design remain reference-ready and Watermelon/Componentry/Cult/Anime remain non-global as already defined by P1/P0.
- **Why non-discoverable vendoring:** both upstream skills advertise broad design triggers. Installing either as a normal discoverable skill would create another design orchestrator competing with JOENESS `$design`. Vendoring the exact skill payload under `vendor/` makes it ready while preserving one entry point.
- **Impeccable pin choice:** use the released skill tag `skill-v4.1.3` / commit `c0f495...`, not the moving `main` commit or the package/CLI version line. This avoids conflating the CLI package with the released Agent Skill.
- **Installer impact:** the existing manifest dependency mechanism should already copy/remove these source files. Production installer changes are explicitly forbidden unless the new lifecycle tests prove a missing behavior.
- **Hook policy:** hooks are OFF by construction, not merely by a mutable preference: the JOENESS payload excludes `.codex/hooks.json` and P2 never runs the upstream installer on user/project state.
- **Public surface:** remains exactly six JOENESS skills.
- **Promotion:** remains false. P2 readiness evidence is installation/provenance evidence only; semantic routing and real design quality belong to P3/P4.
