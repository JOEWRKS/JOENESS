# JOENESS 0.2 full-package token A/B — review

## Identity and execution

- Date: 2026-09-27 (Asia/Seoul).
- Runtime: `codex-cli 0.158.0-alpha.2`, `gpt-6-astra`, `xhigh`, fresh ephemeral
  sessions, identical flags and exact stage prompts. Twelve successful sessions,
  one per fixture/arm/stage, in the preregistered counterbalanced order.
- JOENESS source: `vendor/source-manifest.json` SHA-256
  `0d0c7d38a7d3fb44975dae90d6dfc72374406acdbd470214616cfd80f2deb81f`;
  Core SHA-256
  `f360b48be1b4143035f61fa20149a3249c60dea2e7f12cffa8bf1e8918f4f6a9`;
  setup SKILL.md SHA-256
  `50c283f0f8b8fbb9d858dc9b0085d1f1a2f6eae2946a15368f1553f8849f626c`.
- JOENESS isolated home: installer `-Apply` and `-Check` returned `current`,
  one active public skill (`joeness-setup`). Bare isolated home had neither the
  global JOENESS AGENTS block nor skill. No parent AGENTS file applied to the
  fixture directories. Fixture Git trees matched within each pair before run.
- Every run has one distinct runtime thread ID, successful exit, usage and bounded
  response in `results/` and `responses/`. The three prompt hashes match across
  arms. No run was repeated for an outcome. The initial stdin-wait infrastructure
  attempt is preserved separately; no model turn, response or project change
  occurred in it.
- The temporary auth copies in both isolated homes were removed after run;
  both paths were checked absent. No personal install or product source changed.

## Token usage

`input` includes the `cached` subset. `noncached + output` is a second exposure
measure, **not a bill**. CLI `cache_write_input_tokens` was zero in all runs.
All numbers below come from the CLI's `turn.completed.usage` events, not from
response length estimates. Durations are observed wall time.

| Scope (two fixtures) | Bare input | JOENESS input | Bare cached | JOENESS cached | Bare output | JOENESS output | Input + output change | Noncached + output change | Wall change |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Stage 1: initial setup | 201,740 | 292,790 | 187,520 | 261,248 | 4,082 | 7,091 | +45.7% | +111.1% | +65.1% |
| Stage 2: local work | 381,813 | 305,145 | 338,688 | 272,640 | 8,353 | 8,662 | -19.6% | -20.0% | +3.7% |
| Stage 3: fresh handoff | 151,848 | 215,825 | 129,408 | 187,136 | 3,747 | 3,937 | +41.2% | +24.6% | +4.2% |
| Stages 2–3 only | 533,661 | 520,970 | 468,096 | 459,776 | 12,100 | 12,599 | -2.2% | -5.0% | +3.9% |
| Full three-stage lifecycle | 735,401 | 813,760 | 655,616 | 721,024 | 16,182 | 19,690 | **+10.9%** | **+17.2%** | **+19.9%** |

Full-lifecycle input + output: Bare **751,583**, JOENESS **833,450**.
Noncached input + output: Bare **95,967**, JOENESS **112,426**.
Wall time: Bare **602.4 s**, JOENESS **722.3 s**.

The aggregate masks disagreement between fixtures:

| Fixture | Bare input + output | JOENESS input + output | Change | Bare noncached + output | JOENESS noncached + output | Change |
|---|---:|---:|---:|---:|---:|---:|
| Reading shelf | 396,598 | 332,484 | -16.2% | 52,150 | 53,444 | +2.5% |
| Workshop slots | 354,985 | 500,966 | +41.1% | 43,817 | 58,982 | +34.6% |

## Outcome and friction checks

- Reading shelf: both arms implemented the approved `addBook` and `findBooks`
  behavior. Independent post-run `node --test`: **8/8 pass** in each arm.
  Both correctly marked local technical completion, kept CSV export optional
  and user acceptance pending. Neither repeated the stale kickoff work in the
  fresh handoff.
- Workshop slots: both arms implemented approved reservation/cancellation
  behavior. Independent post-run `node --test`: **4/4 pass** in each arm.
  Both kept the venue-kiosk verification unchecked, M1 incomplete and user
  acceptance separate. Neither implemented email reminders or treated the
  stale handoff as current authority.
- All four project worktrees passed `git diff --check`; warnings were only
  Git's LF-to-CRLF checkout notices. Stage 3 Git status was unchanged before
  versus after each read-only handoff. Source diffs stayed in approved scope.
- Both arms connected the existing project documents and recorded actual work.
  JOENESS additionally created its expected `.joeness/setup-state.json` in
  each fixture; this is setup metadata, not a product feature. No material
  accuracy advantage or regression appeared in these fixtures.
- JOENESS's initial setup and handoff cost more in both fixtures. Its local
  implementation stage was substantially cheaper in one fixture and slightly
  dearer in the other. Observed extra handoff hash checking in JOENESS answers
  did not establish a unique outcome benefit. No extra approval or unfinished
  authorized work was observed.

## Conclusion and bounds

The claim “JOENESS causes **no** usage increase” is false for this bounded
full-package lifecycle: observed total input + output was **10.9% higher** and
noncached input + output **17.2% higher**. The claim “JOENESS **always** causes
excessive use” is also unsupported: stage 2 aggregate was lower, and the two
fixtures moved in opposite directions. One-time setup is the clearest cost;
post-setup stages together were near parity by these measures.

This is two fictional, local projects and one run per arm/stage, not a precision
estimate for daily workloads. It does not isolate passive Core tokens from
skill-triggered actions or different agent decisions; it compares the shipped
package as used. Cached-token pricing was not assessed. Human handoff
comprehension and long-term project value were not tested here. No product
change is justified solely by this sample; the observed setup/handoff overhead
is a concrete follow-up risk, not evidence of a universal tax.
