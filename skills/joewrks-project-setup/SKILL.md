---
name: joewrks-project-setup
description: Use only when the user explicitly asks to set up, configure, persist, or apply a durable JOEWRKS contract for a development or design project. Native Codex handles ordinary project declarations and broad do it or continue requests; this skill only persists verified project-specific context.
---

# JOEWRKS Project Setup

Create or update a durable project contract only for an explicit setup, configure, persist, or apply request for the current project. Start with a read-only check; no other project, conversation, global instruction layer, or prior permission transfers write authority.

## Workflow

1. Run `scripts/project-setup.ps1 -Check -ProjectPath <path>`. Treat its exact `projectRoot` and `targetHash` as the apply snapshot.
2. Read only the minimum relevant project rules, product and status documents, package manifests, framework or design-system evidence, standard commands, and tests.
3. Propose a UTF-8 managed body of preferably 2 KiB and at most 8 KiB. Include only durable, verified facts needed by a fresh qualified collaborator:
   - product outcome, target users and platforms, and actual release target;
   - explicit non-goals, constraints, and local or external authority boundaries;
   - authoritative specification, design, status, stack, and standard run, build, and test paths;
   - project-documented, risk-proportional acceptance and release evidence for planning, design, implementation, verification, and launch readiness; preserve only project-specified review requirements and do not invent validation topology or duplicate unchanged clean builds solely for confirmation;
   - maintenance, collaboration, release acceptance, and unresolved external decisions.
4. Do not freeze volatile progress as memory. Recompute the current phase from Git, files, tests, and builds; reference an existing status source when continuity must persist. Ask one question only when ambiguity would change product direction.
5. Do not include either JOEWRKS project marker; the helper owns markers and byte conversion.
6. Only after the user explicitly requests setup, configure, persist, or apply of a durable JOEWRKS contract for this project, encode the approved body as UTF-8 Base64 and run:

   ```powershell
   scripts/project-setup.ps1 -Apply -ProjectPath <path> `
     -ExpectedRoot <check-projectRoot> `
     -ExpectedTargetHash <check-targetHash> `
     -ManagedBodyBase64 <base64>
   ```

7. Report the helper JSON and observed project diff as completion evidence.

The helper may change only the single managed marker block in the Git-root `AGENTS.md`. Do not create a global rule layer, install dependencies, change code or design, make external writes, or expand authority.
