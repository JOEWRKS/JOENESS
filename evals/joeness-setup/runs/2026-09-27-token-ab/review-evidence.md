# Six-field project-connection token A/B — 2026-09-27

## Boundary

The [pre-registration](preregister.md) was committed as `ca01781` before
either arm ran. Both arms used the same fictional Case C source and prompt,
`codex-cli 0.158.0-alpha.2`, `gpt-6-astra / xhigh`, fresh ephemeral sessions,
the same `--ignore-user-config` setting, and the same machine/auth. Bare ran
first. The only intended project-instruction difference was the owned
six-field JOENESS connection: Setup retained it; Bare used the official
helper to detach it. Both began with Case C tree
`bffc9598bd70b9c4420ae3ac5246199490d8955c`. The global environment was
held common, so this measures the project connection, not the entire
JOENESS package or Independent Judgment Core. Bare's detach created one
extra local Git history commit; an agent reading history could see it.

The original project and personal installation were not modified. Each arm
has a saved [final response](bare-response.md) ([Setup](setup-response.md))
and a verified complete-history [Git bundle](bare.bundle)
([Setup](setup.bundle)). [CLI usage counters](usage.json) came from each
`turn.completed` JSON event; wall time came from a stopwatch around the CLI
process. Both CLI exits were 0.

## Outcome parity before cost comparison

Both agents corrected only the three authorized Case C files: label source,
TASK, and ISSUES. Both changed lowercase conversion to uppercase, retained
trimming and non-string rejection, reproduced the initial failure, and
recorded the subsequent two passing tests. Independent `node --test
cases/C/label.test.mjs` returned 2 PASS / 0 FAIL in each arm, and both diffs
passed `git diff --check`. The task records preserve actual checks; the issue
records preserve cause, fix and verification. Bare explicitly called the
history of how the regression returned unknown; Setup also recorded it as
unknown while finding no unresolved local defect. Neither claimed user
acceptance or invented work in another case. The material task outcome and
information boundaries were comparable. Setup produced the six-field scan
layer; Bare used a conventional short explanation. Format alone was not
scored as a quality improvement.

## Measured usage

| Metric | Bare | Setup | Setup minus Bare |
|---|---:|---:|---:|
| Input tokens, including cached | 159,170 | 107,119 | −52,051 (−32.7%) |
| Cached input tokens | 145,792 | 93,184 | −52,608 (−36.1%) |
| Derived uncached input | 13,378 | 13,935 | +557 (+4.2%) |
| Output tokens | 1,955 | 1,873 | −82 (−4.2%) |
| Input + output, including cached | 161,125 | 108,992 | −52,133 (−32.4%) |
| Uncached input + output | 15,333 | 15,808 | +475 (+3.1%) |
| Wall time | 86.890 s | 72.953 s | −13.937 s (−16.0%) |

The CLI reports cached input as a subset of input. The uncached and combined
rows are arithmetic, not a billing estimate. Reasoning-output counters were
411 Bare and 273 Setup; they are not added again to output. Neither total
processed tokens nor uncached tokens alone establish monetary cost without
cache pricing and model billing details. No rate/pricing claim is made.

## Interpretation and limitations

There was no observed large project-connection token blow-up in this pair.
Setup processed fewer total input/output tokens and finished sooner, while
its *uncached* input plus output was 3.1% higher. Those mixed results cannot
support either a general efficiency win or a general token leak. One
non-counterbalanced pair is sensitive to model variance, run order and cache
behavior. The number of agent tool actions and full rollout were not saved;
the durable task records show relevant before/after tests, not a separate
formatting-only verification pass. No behavioral rerun was made.

The previous standalone case reported a CLI `tokens used` line of 12,258.
That line lacks this A/B's input/cached/output breakdown and is not directly
comparable to the detailed JSON usage here. Both A/B arms ignored user config
to remove unrelated plugin startup variation; this is not a measurement of
ordinary desktop sessions with all user plugins active.
