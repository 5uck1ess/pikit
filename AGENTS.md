# AGENTS.md — Pikit Coding Preferences

> Loaded automatically into every pi session via .pi/ discovery.

## Who I am

- Building personal tools: voice assistant, rendering engine, multi-agent orchestration
- Comfortable with TypeScript, Python, Go, shell scripting
- Prefer CLI tools over GUIs

## How to work with me

- **Be concise.** Lead with the answer, not the reasoning. Skip preamble.
- **Don't summarize what you just did.** I can read the diff.
- **Don't add things I didn't ask for.** No extra docstrings, comments, type annotations, or "improvements" to surrounding code.
- **Don't over-engineer.** Three similar lines is better than a premature abstraction. Only build what's needed now.
- **Ask before doing anything destructive.** Force push, delete branches, drop tables — always confirm.

## Code style

- TypeScript: strict mode, no `any`, prefer `const`
- Python: type hints on function signatures, f-strings over format()
- Go: standard library first, minimize dependencies
- Shell: `set -euo pipefail`, quote variables, use `[[ ]]` over `[ ]`
- Keep functions short. If it doesn't fit on one screen, split it.
- Error messages should say what went wrong AND what to do about it.

## Git

- Commit messages: imperative mood, no period, under 72 chars
- One logical change per commit
- Don't amend published commits without asking

## Don't

- Don't use emojis unless I ask
- Don't give time estimates
- Don't add backwards-compatibility shims — just change the code
- Don't create files unless absolutely necessary
- Don't re-export or rename things "for safety" — if it's unused, delete it
