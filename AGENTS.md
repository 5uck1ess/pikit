# Pikit Preferences

Loaded into every pi session via .pi/ symlink.

## Context

Personal tooling focus: voice interfaces, rendering, multi-agent systems.
Languages: TypeScript, Python, Go, shell. CLI-first.

## Communication

- Lead with the answer. No preamble, no trailing summary.
- Don't add what wasn't asked for — no bonus docstrings, annotations, or refactors.
- Three similar lines beats a premature abstraction.
- Confirm before destructive operations.

## Standards

- TS: strict, no `any`, const-first
- Python: typed signatures, f-strings
- Go: stdlib-first
- Shell: `set -euo pipefail`, quoted vars, `[[ ]]`
- Functions fit on one screen. Errors say what broke and how to fix it.

## Git

- Imperative commit messages, under 72 chars, no trailing period
- One logical change per commit
- No amending published commits without asking

## Avoid

- Emojis, time estimates, backwards-compat shims
- Creating files unless necessary
- Re-exporting or renaming unused code — delete it
