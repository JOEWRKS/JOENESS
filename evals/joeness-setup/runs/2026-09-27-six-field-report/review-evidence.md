# Six-field report revalidation — 2026-09-27

## Scope and frozen inputs

The user chose a short six-line work report: `작업`, `업데이트 파일`, `이슈`,
`해결`, `남은 문제`, `다음 작업`. The fifth line separates an unresolved or
unverified boundary from an issue already fixed. The underlying JOENESS
purpose remains project-fact classification and handoff; the report is a
scan layer, not a replacement for precise records.

The [preregistered prompt and rubric](preregister.md) were used in fresh,
read-only Codex CLI `0.158.0-alpha.2` sessions with `gpt-6-astra / xhigh`.
The same fictional project was used in each run. Its final Git history is
the verified [bundle](project.bundle), HEAD
`72fab1d77c3d271725e466b6b18fb59d4204d180`. Only the owned project
connection and state differ from the prior Setup fixture; no product, code,
test, roadmap, task or issue content was rewritten for scoring. The source
project on disk was `D:/JOEWRKS/JOENESS-ReportSix-20260927`.

## Observed sequence

The initial six-field connection yielded [five raw responses](response-1.md)
([2](response-2.md), [3](response-3.md), [4](response-4.md),
[5](response-5.md)). All five exposed the six fields and kept the real kiosk
verification unconfirmed. But the opening bullets were often long and
technical, and exact requested details such as retained reservation fields
were inconsistent. This was a readability/detail-preservation failure of the
initial wording, not a fabricated completion. These responses are preserved.

The narrow correction says the six bullets are the plain-language scan layer;
requested cause, verification, scope, acceptance, stale-record facts and
source pointers belong under `상세 보고`. Five fresh sessions after that change
produced [corrected raw responses](corrected-1.md) ([2](corrected-2.md),
[3](corrected-3.md), [4](corrected-4.md), [5](corrected-5.md)). The saved
response text preserves the model's words; trailing Markdown
line-break spaces were stripped from corrected responses 1, 3 and 5 solely
to satisfy the repository whitespace gate. Manual review of all five found:

| Check | Result |
|---|---|
| Six ordered, short Korean opening lines | 5/5 |
| Confirmed cancellation issue separated from remaining kiosk verification | 5/5 |
| Existing `filter` cause, `map` correction, retained `id/attendee/slot`, local-test boundary retained in detail | 5/5 |
| M1 incomplete, user acceptance separate, email excluded/deferred without new approval | 5/5 |
| Old `HANDOFF.md` and pre-fix run treated as stale; no fabricated kiosk proof or project write | 5/5 |

These are five samples in one fixture, not a universal reliability or
performance result. The corrected answers re-ran relevant local tests while
checking the handoff even though formatting alone did not require reruns.
There is no comparable causal token/latency control. Initial-run tokens were
14,068 / 14,046 / 6,875 / 21,675 / 32,198; corrected-run tokens were
12,992 / 14,049 / 15,301 / 12,326 / 13,210. Initial elapsed times were
80,664 / 71,853 / 38,319 / 55,208 / 67,709 ms; corrected times were
80,419 / 96,111 / 100,894 / 86,154 / 86,364 ms. Do not infer a speedup or
slowdown from these non-paired samples.

## Static and installation checks

- TDD RED: the added onboarding assertion for `남은 문제: 없음` failed before
  source edits, with 1 fail / 2 pass. After the correction the targeted test
  passed.
- Final `tests/astra-judgment-sync.tests.ps1`: PASS current-only release
  contract. `tests/joeness-project-setup.tests.ps1`: 21 PASS under both
  PowerShell 7 (`pwsh`) and Windows PowerShell (`powershell.exe`).
  `tests/joeness-install.tests.ps1`: PASS. Node contract and fixture tests:
  6 PASS / 0 FAIL.
- `skill-creator/scripts/quick_validate.py` could not run: its local Python
  environment lacks `yaml` (`ModuleNotFoundError`). This is a validator
  availability limit, not a passing result; no dependency was installed.
- Personal installation: the previous package's `-Check` returned `current`.
  Its own installer `-Remove` returned `removed`; the updated source's
  `-Check` returned `ready`, `-Apply` returned `current`, and a final `-Check`
  returned `current` with zero blockers. The installer operated on its
  verified owned files and managed AGENTS suffix, preserving the user-owned
  prefix. Installed `SKILL.md`, AGENTS asset and usage bytes matched the
  source manifest hashes.

## Limits

No fresh behavioral run exercised a completed project with `남은 문제: 없음`;
the wording and onboarding assertion cover that case statically. No human
readability rating of the corrected five responses was requested or
invented. The test does not establish real-project task accuracy, universal
activation, or an advantage over Bare Astra. Existing unresolved kiosk proof
remains unresolved within the fictional fixture.
