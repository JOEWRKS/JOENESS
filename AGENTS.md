# Work Harness Repository

- The active GPT-6 Astra distribution has no runtime behavioral overlay, Common Core, public skill, default vendor, plugin routing, or managed runtime file.
- `vendor/source-manifest.json` is the machine-readable distribution identity. Keep evaluation records out of its active identity.
- Preserve historical candidates, vendor source, skills, compatibility archives, commits, and experiment reports as immutable evidence. Record a rerun as a new artifact instead of rewriting an earlier result.
- The rejected broad always-on Core remains disabled and preserved as historical evidence; it is not an active pointer or runtime payload.
- Legacy removal is compatibility-only and fail-closed: remove only an exact supported ownership and source identity; preserve user and unmanaged bytes; retain backup, readback, rollback, drift, forged-ownership, and residue checks.
- Add a behavioral runtime rule only after a real observed Astra failure and evidence that the rule provides a unique improvement over the native baseline.
- Keep repository tools deterministic and byte-preserving outside their owned state. Validate source hashes before compatibility removal.
- Use the repository's existing PowerShell and Node tests. Run the smallest relevant set while editing, then the documented current-release and historical-integrity suites before release claims.
- Invoking an external skill does not approve its whole workflow; use only the parts independently authorized by the current user request or project contract.
- The active planning ledger is `TASKS.md`. Update it only at milestone, scope, release-condition, decision, blocker, or planned-handoff boundaries.
