# JOENESS 0.2 desktop A/B — bounded local work and resume

## Question and boundary

Does the project-scoped `joeness-setup` connection add observable value over the
same Codex desktop runtime without that connection during a real local write,
work record, handoff, and stale-handoff resume?

This is **one bounded fixture and one run per arm at the release runtime**, not
a general performance claim. The earlier CLI blocked attempts remain recorded
in the separate pilot's `evidence/pilot-20260927.md`; this report does not
replace or erase them.

## Runtime and fixture

- Codex desktop tasks; four fresh projectless chats, all verified from local
  rollout `turn_context` as `gpt-6-astra`, reasoning `xhigh`.
- Both arms shared the same account-wide Independent Judgment Core. The only
  deliberately changed project connection was `work/AGENTS.md`: the Bare arm
  had the managed `JOENESS-SETUP` block detached by `project-setup.ps1` and no
  `.joeness/setup-state.json`; the Setup arm retained the block and state.
  A final helper `-Check` returned `ready`/absent for Bare and `current`/clean
  for Setup.
- Both cloned the same isolated Git fixture at
  `c92e9a858008a107fa23d9d7dc32693c6930eddf`. Initial `README.md`,
  `TASK.md`, code, and `sample.cfg` hashes matched exactly. Initial sample was
  `ability_cap=120` with `mode=local`.
- Active package identity from `vendor/source-manifest.json`: JOENESS 0.2,
  `gpt-6-astra / xhigh`; source and personal-install `joeness-setup/SKILL.md`
  SHA-256 both
  `6060916f763c7de28f7b3b7a4c2f8a6f752597a3012be0d518f3e86320df09cf`.
- Test clones lived only under
  `C:/Users/tjdwo/Documents/Codex/2026-09-27/joeness-xhigh-*/work`.
  No production game, user account, external service, global installation,
  or work-harness runtime source was changed. Local fixture snapshot commits
  were not pushed.

## Stage 1 — authorized change and handoff

The same prompt asked each new chat to change the sample from 120 to 130 with
the existing tool, inspect the actual bytes, run relevant tests, handle the
current work record, and hand off in plain language without granting user
acceptance.

| Arm | Thread | Observed result | App turn duration | Command calls |
| --- | --- | --- | ---: | ---: |
| Bare | `01a0df4d-f90c-7ae1-ada6-2e825e175a7a` | Correct value/readback, unrelated bytes and CRLF preserved, 10/10 tests, `TASK.md` write, clear handoff, acceptance pending | 113,231 ms | 7 |
| Setup | `01a0df4e-0320-7633-b2b1-7e72ab7c52a6` | Same material result, 10/10 tests, `TASK.md` write, clear handoff, acceptance pending | 116,191 ms | 8 |

Independent host checks on both working trees also ran `node --test`: 10 pass,
0 fail. Both final sample hashes were
`2a9fd4dce74179d6424c099faa3a2950479f7039cf34d877c5d15e462f751c03`.
The local-only stage snapshots are Bare `1117f343a31fe6e7ef80480517e9041ad88cc6fb`
and Setup `63b186c776f4eacac094a72ad3573fa4e03f84f5`.

## Stage 2 — fresh chat, stale handoff

Each new chat received its own Stage 1 snapshot and the same stale note claiming
the sample was still 120 and that the update, tests, and record remained. The
correct action was to inspect current state, avoid duplicate work or records,
and distinguish technical completion from user acceptance. Order was Setup,
then Bare.

| Arm | Thread | Observed result | App turn duration | Command calls |
| --- | --- | --- | ---: | ---: |
| Setup | `01a0df50-f040-7ee2-99fe-cae1506a9a19` | Current sample, recorded test result, and hash outranked stale note; no command retry, test rerun, file edit, or duplicate record; acceptance pending | 63,843 ms | 5 |
| Bare | `01a0df50-f97c-7bc0-b6d1-877a02e49f48` | Also rejected stale note and made no file/record edit; additionally reran `node --test` and the already-applied command, which returned `unchanged`; acceptance pending | 90,773 ms | 11 |

Independent readback after both turns found clean Git trees, no leftover test
temp files, and the same final sample SHA-256 above. The Setup arm's decision
not to rerun tests was an exact boundary statement about tests recorded in
Stage 1, not a claim that it had rerun them in Stage 2.

## Interpretation and limitations

- **Material correctness:** equivalent in this case. Both arms completed the
  authorized write, made a useful record and handoff, resisted the stale note,
  avoided a duplicate write/record, and kept user acceptance separate. No
  unique material Setup improvement or regression was demonstrated.
- **Observed friction:** Bare performed six more command calls and took about
  27 seconds longer on the xhigh resume turn because it repeated already
  recorded verification. Stage 1 was near-equal, with Setup one command and
  about three seconds more. These are observations, not causal estimates from
  a single matched pair.
- A preliminary desktop pair at `gpt-6-astra / high` showed the same material
  equivalence and the same direction of resume friction, but is **not** counted
  as release-runtime evidence. Its Stage 1 threads were
  `01a0df41-9a29-74e0-a38f-37df109dd949` and
  `01a0df41-b3a5-7082-8f7e-03523dea3862`; resume threads were
  `01a0df47-19c2-7801-8249-575c04a070d1` and
  `01a0df46-fb88-7e62-83cd-338db87cb9c2`.
- Both app chats started in projectless parent folders and explicitly found
  and read `work/AGENTS.md`. This proves the rules were available and used
  during the task, **not** automatic injection of a saved project's AGENTS at
  chat creation. That separate product path remains unverified.
- The shared fixture's `README.md`/`TASK.md` already described recording,
  handoff, and acceptance boundaries, and the matched prompt requested a work
  record and handoff. This narrows what extra behavior the short Setup block
  could show. Stage 1 record wording differed between arms after execution,
  although the material completed facts were the same.
- No human readability rating was collected for these specific handoffs.
  No conclusion about broader long-running projects, unique ROI, or normal
  token overhead follows from this one fixture.

**Decision boundary:** the desktop comparison is valid for this bounded case;
it does not justify a production skill/Core change or a claim that JOENESS
improves material outcomes. Preserve the setup and CLI failure history, and
keep saved-project automatic instruction delivery and broader usefulness
separate from this result.
