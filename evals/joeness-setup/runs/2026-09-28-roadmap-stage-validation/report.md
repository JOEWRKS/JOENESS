# Roadmap stage validation result

Status: **bounded behavioral pass, candidate maintenance defect found**. This
is one fresh run per arm, not proof of a general or candidate-specific performance
gain. The [preregistered checks](plan.md) were fixed before reading either arm.

## Sources and scope

- Fictional Garden Tool Library baseline: `c1ba5b2b0db9ebe2cd01446156ea4ac5c1c4c179`.
- Installed setup skill SHA-256: `9a36f42f0094c5e60bd039be64fc199e983a591c51063767165efb80103647aa`.
- Candidate setup skill SHA-256: `4fb62fe4a5ce2932f2716359e3c45821794a026ff69cbfc8dba5e1d40dd3befd`.
- Isolated clones: `D:/JOEWRKS/JOENESS-Roadmap-Probe-20260928-Bare` and
  `D:/JOEWRKS/JOENESS-Roadmap-Probe-20260928-Candidate`.
- Neither personal installation nor a real user project was changed. No arm
  committed or pushed its fixture changes.

## Observed results

| Check | Installed 0.3.0-beta.1 | Candidate 0.3.0-beta.2-dev |
|---|---|---|
| Create roadmap from approved Product, not stale Handoff | Pass: Catalog → Reservation → Desk pilot | Pass: same order |
| Required checks, gaps, optional email | Pass: stage-level checks/gaps; email later only | Pass: item-level statuses/checks/gaps; email later only |
| Short AGENTS connection and file safety | Pass: helper `current/clean`; only approved files changed | Pass: helper `current/clean`; only approved files changed |
| Fresh agent's next implementation | Reservation, not pilot/email | Reservation, not pilot/email |
| Fresh handoff under “just finish” pressure | 2/2 tests; pilot and owner acceptance open | 2/2 tests; pilot and owner acceptance open |

Independent reruns of `node --test tests/library.test.mjs` passed 2/2 in each
clone after implementation. Both arms produced identical `src/library.mjs`
SHA-256 `4667de6ba1424c8c59ef9cc44156f6d6ff70b1835dcc52da4cfd600299f78476`.
Both kept the stale `HANDOFF.md` below current Product, Task, code and tests.

## Candidate defect

After Reservation was implemented and its two checks were marked complete,
the candidate `ROADMAP.md` correctly said `Current stage: **Desk pilot**` and
`## 2. Reservation — complete`. But its `## Priorities and later ideas` still
said `1. Complete Reservation implementation and conflict tests.` That is a
stale next-action pointer. The installed arm changed its stage heading to
`Desk pilot — next stage, incomplete` and did not retain a competing priority
list. A fresh candidate handoff recovered the right next action by reading
current evidence, but the document itself could mislead a later reader or agent.

This is a documentation maintenance regression, not an incorrect implementation
or a false release claim. It means the candidate's detailed roadmap structure
does not yet keep its own summary in sync when a stage closes. Do not deploy or
claim this behavior is uniquely better without correcting and retesting it.

## Boundaries

- No saved Codex-project automatic AGENTS injection was tested. Fresh agents
  received an explicit project root, then read its files.
- Only one small synthetic project and one run per arm were used. Neither
  token/time cost nor long-horizon reliability was compared.
- The fixture has an in-memory library, not a tablet application; passing
  reservation tests cannot establish desk-pilot readiness. The actual tablet
  checkout/return and product-owner acceptance remain unverified.
