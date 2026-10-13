# JOENESS1.0.0 personal installation — T040

Status: personal installation1.0.0 verified. Tag/GitHub Release belongs to QA
Manager after joint checks; this owner has not created either.

## Authority and exact versions

- User approval in Manager turn `01a13565-862e-7143-aa4c-0f4c7b4d4834`:
  update personal installations, finish tags/GitHub Releases and verify. Manager
  assigned each owner only its installation/current records; central publication
  stays with Manager. Existing projects, other skills, settings and dirty files excluded.
- Source installed: `0989e0c2610b1c137938251aea6dc55aae28ef54`, version1.0.0.
  Exact old package: `c4902f72b728e36d558225157a10f740ed6abdc0`, version0.3.4.
- Old full manifest SHA `49889a08818ac80006527a16bfa0911c08024ea67f4d263375ab4a96a6167aeb`.
- New full manifest SHA `529a22ace091617b01e4eb82178f3a7fb9dbc16e2eab0b0b925676be81c0a905`.
- Both complete manifests, old/new state, command outputs, file hashes and
  backup inventory are in [personal-install.json](personal-install.json).

## Executed transition

`node evals/joeness-setup/runs/2026-10-13-v100-personal/install-and-check.mjs --approved-t040`
exited0. It exports only the old exact installer/package to a temporary folder,
checks current source and personal ownership, then uses the canonical installer.
No state file was edited directly.

1. Old package Check: current, exit0; exact17-file inventory and old state matched.
2. Backup17 files plus state outside skill discovery; all18 hashes matched.
3. Old package Remove: removed, exit0; no skill files/state remaining.
4. New package Check: ready; Apply: current; Check: current, all exit0.
5. Exact17 files/state verified; same skill bytes before/after. Old/new state
   differ only in releaseVersion and manifestSha256. No added/deleted final files.
6. Three actual installed gate tests passed: current visual scope without user
   acceptance; missing-check failure/recovery; exact approval boundary. No source
   runtime changes, so full96/96 and PS5/7 lifecycle evidence reused from T039.

Backup retained:
`C:/Users/tjdwo/.codex-install-backups/joeness-v100-20261013-529a22ace091`.
Previous state SHA `0e910838a939538c1d725afb48410be0790ddde1be26a90c1ed9b066387a1c8e`;
new state SHA `e853b4a81c6aeedefd8d5ff9d70df2e82a7e2368b348e8244f1c39b7e319eb70`.
Global AGENTS/config unchanged. Other owners may update their own skills in
parallel; three-product comparisons are Manager's responsibility, not this run.

## Checking the installed version

From the current source package, run:

```powershell
powershell.exe -NoProfile -File .\JOENESS.ps1 -Check -CodexHome C:\Users\tjdwo\.codex
Get-Content C:\Users\tjdwo\.codex\joeness-skills-state.json | ConvertFrom-Json | Select-Object releaseVersion,manifestSha256
```

Expected: Check current and releaseVersion1.0.0 with the new manifest above.
Check alone does not certify a project's document contents or user acceptance.
Updated skill is available on the next turn; do not assume old conversations
automatically reload instructions. Actual runtime bytes are unchanged here.

## Preservation and handoff

- Source/runtime/tests/manifest unchanged; only installation evidence and current
  status documents are committed after this transition.
- APP-001 ROADMAP hunk remains unstaged; untracked docs/ISSUES.md retains SHA
  d3c87c8fa0e2e34600ae12ff0b1c9ea1d503ca5a7f6a30db17ca8e8ea9b529c7.
- Source1.0.0 main commit0989e0c already passed hosted branch/main CI per QA
  T039 hosted-ci.json (main run38401914593). This is prior source evidence,
  not a claim about a yet-unrun documentation follow-up workflow.
- Final documentation commit and remote refs are reported to Manager T040.
  No force, reset, project update, tag or GitHub Release by this owner.

Release summary for Manager:
- 작업 순서·완료 기준·남은 일을 로드맵과 역할별 문서로 관리.
- 결과를 여섯 항목으로 보고하고, 근거 없는 완료·승인 혼동을 줄이도록 설계.
- 독립 사용 가능. 다른 JOE 도구의 검증 결과는 명시적으로 연결하며 자동 승인하지 않음.
