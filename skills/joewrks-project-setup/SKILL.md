---
name: joewrks-project-setup
description: Use only when the user explicitly asks to inspect or apply a project-specific JOEWRKS AGENTS.md contract. Never write project files through implicit invocation.
---

# JOEWRKS Project Setup

This skill is an explicit-only candidate. It does not transfer approval from another project, conversation, or the installed Common Core.

## Workflow

1. If the user did not explicitly request this skill for the current project, do not write a project file.
2. Run `scripts/project-setup.ps1 -Check -ProjectPath <path>` before proposing or applying a change. Treat its exact `projectRoot` and `targetHash` as the apply snapshot.
3. Read only the minimum relevant package manifests, existing commands, framework and design-system evidence, tests, and current project rules.
4. Propose a UTF-8 managed body of at most 8 KiB containing only verified project purpose, stack, authority, standard commands, and verification facts. Do not include either JOEWRKS project marker; the helper owns markers and byte conversion. Ask one question only when ambiguity would change product direction.
5. Only when the user explicitly requests apply for this project, encode the approved body as UTF-8 Base64 and run:

   ```powershell
   scripts/project-setup.ps1 -Apply -ProjectPath <path> `
     -ExpectedRoot <check-projectRoot> `
     -ExpectedTargetHash <check-targetHash> `
     -ManagedBodyBase64 <base64>
   ```

6. Report only the helper JSON and the observed project diff as completion evidence.

The helper may change only the single managed marker block in the Git-root `AGENTS.md`. Do not reproduce the Common Core, install dependencies, change code or design, make external writes, or expand authority.
