# JOENESS 2.0.2 — source, main, publication and personal installation

User decision on 2026-11-26 ("추천대로 게시", said directly to the parent Claude Code session after the parent
reported the three 2.0.2 candidates): version commit, main push, CI, tag, Release, Codex personal installation and
Claude Code clone update in sequence, run by that parent session.

1. Runtime payload since 2.0.1: three files. New `scripts/revision-line.mjs` (prints the ROADMAP
   `Product revision / approval:` line from JOEFLOW `approval_status.py` JSON; text only, fails closed with exit 2),
   `SKILL.md` (roadmap section: `definition_status` recorded, the script named) and `assets/ROADMAP.md` (the
   revision-line placeholder). `assets/AGENTS.md`, `project-setup.ps1` and the four review helpers are byte-identical
   to 2.0.1. Preparation commit `12295dc` by the building session (bundle J only, user-confirmed scope 2026-11-26);
   record [report-202.md](report-202.md), ATELIER line comparison [atelier-line-compare.txt](atelier-line-compare.txt).
   No behavioral A/B, no paid runs.
2. Release commit `d9e443a09d90e1895a2256a7c26fd10c5ef8e8d5` (CHANGELOG publish line, AGENTS source-version line, README and
   installation wording, [release notes](release-notes-v2.0.2.md), the install script below) fast-forwarded to `main`
   and pushed. Local checks at the candidate commit (payload unchanged since): Node 121/121, release, install and
   project-setup PowerShell suites exit 0 (Windows PowerShell 5.1). Tag `JOENESS-v2.0.2`, Release
   https://github.com/JOEWRKS/JOENESS/releases/tag/JOENESS-v2.0.2.
   Exact-commit [Windows run 45801799776](https://github.com/JOEWRKS/JOENESS/actions/runs/45801799776): completed/success
   (the only PowerShell 7 run; `pwsh` is not installed locally).
3. Codex personal installation ([install-and-check.mjs](install-and-check.mjs) `--approved-personal-v202`, record
   [personal-install.json](personal-install.json)): the 2.0.1 install matched the 2.0.1 manifest file by file; backup of
   the 20 owned files to `~/.codex-install-backups/joeness-v202-20261126-276effe7e92c` with hash parity;
   2.0.1 package (`git archive` of `8ae6b37`) `-Remove` → `removed`; 2.0.2 `-Check` → `ready`,
   `-Apply` → `current`, `-Check` → `current`; 20 installed files equal the manifest; delta exactly
   `joeness-skills-state.json`, `SKILL.md`, `assets/ROADMAP.md`, `scripts/revision-line.mjs`; `AGENTS.md` and
   `config.toml` unchanged. Representative check: the installed `revision-line.mjs` on the ATELIER rev23 fixture prints
   the line that equals ATELIER `ROADMAP.md` line 5 byte for byte. Status `installed-and-verified`.
4. Claude Code clone `.local` copy fast-forwarded to `d9e443a` (junction `joeness-setup` now serves 2.0.2).
5. Not verified: agent behavior (whether an agent runs the script after an approval), macOS/Linux, connected projects
   (connection text unchanged; ATELIER's ROADMAP is not touched).
