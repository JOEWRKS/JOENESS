# Work Harness Repository

- The active GPT-6 Astra distribution is `JOENESS 0.2-astra-judgment` and contains exactly one managed behavioral Common Core source: `astra-judgment-core.md`.
- That active rule is **Independent Judgment** only: user questions, challenges, concerns, and preferences are evidence to evaluate rather than automatic corrections; explicit user decisions remain authoritative where the user owns the decision.
- `vendor/source-manifest.json` is the machine-readable distribution identity. Keep evaluation records out of its active identity.
- Active runtime must keep `managedRuntimeFiles`, `publicSkills`, and `defaultVendors` empty and `pluginRouting` null unless a separately approved evidence-based release changes that contract.
- The historical broad `common-core.md`, the 1,690-byte Lean Kernel, historical candidates, public skills, vendor source, compatibility archives, commits, and experiment reports remain inactive evidence. Do not reactivate them by implication.
- Do not expand 0.2 into JOEFLOW, JOEDESIGN, design-vendor, plugin, stage, roadmap, or reviewer routing. Domain workflow belongs to the owning system or project.
- Legacy GPT-5.6 Control support is compatibility-only and fail-closed: detect only the exact pinned Control identity; never auto-migrate it over an Astra install; explicit Remove must preserve user/unmanaged bytes and retain backup, readback, rollback, drift, forged-ownership, and residue checks.
- Add another behavioral runtime rule only after a real observed Astra failure, evidence that the correction belongs at the cross-domain/global layer, and evidence that the smallest proposed rule provides a unique improvement over the native baseline without material regression.
- A challenge from the user is not automatically a new contract. Re-evaluate the prior judgment. An explicit user decision or instruction still controls where the user has authority.
- Keep repository tools deterministic and byte-preserving outside JOENESS-owned state. Validate active source hashes and compatibility source identities before any managed write or removal.
- Use the repository's existing PowerShell and Node tests. Run the smallest relevant set while editing, then the documented current-release and historical-integrity suites before release claims.
- Invoking an external skill does not approve its whole workflow; use only the parts independently authorized by the current user request or project contract.
- The active planning ledger is `TASKS.md`. Update it only at milestone, scope, release-condition, decision, blocker, or planned-handoff boundaries.
