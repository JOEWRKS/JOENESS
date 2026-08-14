# Work Harness Repository

- `vendor/source-manifest.json#activeCommonCore` is the single install pointer. The rejected broad always-on Core remains disabled and preserved as evidence. Only the thin Interaction Safety Core named by `activeCommonCore` is active through the manifest; do not copy Core contents into this file.
- Root `AGENTS.md` contains only durable rules for this repository. Project-specific contracts installed elsewhere remain outside the global Core.
- Preserve historical candidates and experiment reports as evidence. Record a rerun as a new artifact instead of rewriting an earlier failure.
- Keep installers deterministic and byte-preserving outside their owned marker blocks. Validate source hashes before applying changes.
- Use the repository's existing PowerShell and Node tests. Run only the smallest relevant set while editing, then the documented suite before release claims.
- Invoking an external skill does not approve its whole workflow; use only the parts independently authorized by the current user request or project contract.
<!-- JOEWRKS-PROJECT:BEGIN -->
- Active planning ledger: `TASKS.md`.
- Before changing plan status, reconcile current Git, files, tests, and evidence. Update the ledger only at milestone, scope, release-condition, decision, blocker, or planned-handoff boundaries; never per edit, command, response, or commit.
<!-- JOEWRKS-PROJECT:END -->
