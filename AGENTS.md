# JOENESS Repository

- Current source: 1.0.1 optional-gate patch. User authorized commit/push and personal installation update on 2026-10-17, with new publication coordinated with QA. Keep the existing `JOENESS-v1.0.0` tag untouched. QA owns main/tag/Release publication; do not duplicate it here. Exact source/install/publication status: `evals/joeness-setup/runs/2026-10-17-v101-release/review-evidence.md`. Only `assets/AGENTS.md` changes within the 17-file payload; preserve all other 16 files and F01–F06 scripts/contracts. Existing project connections are not automatically updated.

- Previous 1.0.0 source/main validation: `evals/joeness-setup/runs/2026-10-13-v100-candidate/review-evidence.md`; previous authorized personal transition: `evals/joeness-setup/runs/2026-10-13-v100-personal/review-evidence.md`. These and earlier 0.3.4 evidence are historical. Do not conflate source, personal install, main publication and a tagged release.

- Source version: `JOENESS 1.0.1`. Previous `0.3.4` release evidence is in `evals/joeness-setup/runs/2026-10-10-v034-release/review-evidence.md`; `0.3.3` evidence remains in `evals/joeness-setup/runs/2026-10-06-v033-release/review-evidence.md`. The manifest target remains `gpt-6-astra / xhigh`; earlier GEO replay evidence is `gpt-6-astra / high`, not xhigh validation. Package gate tests do not establish model performance. Earlier releases remain in Git tags. Revalidate changed behavior; do not claim a release complete before its exact commit passes the Windows gate and installation check.
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
