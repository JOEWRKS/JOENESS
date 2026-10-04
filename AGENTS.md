# JOENESS Repository

- Released: `JOENESS 0.3.1`; release candidate: `0.3.2` (not yet deployed) for `gpt-6-astra / xhigh`. Earlier releases remain in Git tags. Roadmap creation, existing-document reuse and a fresh project chat have bounded evidence. Revalidate changed behavior; do not claim release completion before the exact release commit passes the Windows gate and installation check.
- Distribution mode: `setup-only`. The sole public skill, `joeness-setup`, is project-scoped setup; the package has no always-on global payload and does not write global `AGENTS.md`.
- `vendor/source-manifest.json` is the machine-readable active release identity.
- Keep current sources, setup spec/plan, bounded fixtures/evidence, installer/tests/CI and the Independent Judgment A/B plan. Historical 0.1 sources remain in Git history.
- Do not reintroduce historical Common Core files, public skills, vendors, compatibility archives, superseded docs, old entrypoints, old evals, or old tests into main merely to preserve history. Git history is the source for historical versions.
- Keep `managedRuntimeFiles` and `defaultVendors` empty, `pluginRouting` null, and `publicSkills` exactly `joeness-setup`. This setup release was explicitly approved.
- Do not expand JOENESS into JOEFLOW, JOEDESIGN, design-vendor, plugin, stage, or domain routing. Those belong to their owning systems/projects.
- Do not add a global behavioral payload without separate evidence and approval.
- Preserve user-owned bytes. Legacy global Core state or markers, unknown skill ownership, and managed skill drift must fail closed; do not auto-migrate an older personal installation.
- Run `tests/joeness-release.tests.ps1` and the current Windows release workflow before any release-complete claim.
- The Independent Judgment A/B has bounded run evidence under `evals/experiments/`. Bare and Core were materially equivalent in eight cases; do not claim behavioral superiority or treat repository correctness as behavioral evidence. Human goal-usefulness rating remains unverified.
