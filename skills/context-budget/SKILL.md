---
name: context-budget
description: Recognizing context pressure before it degrades output quality.
---

# Context Budget

The `context-monitor` hook tracks usage tiers and injects warnings automatically. This skill covers what the hook can't detect — the subtle signs that quality is already degrading.

## Early Warning Signs

Watch for these before the hook's warnings fire:

- **Silent partial completion** — claiming "done" but implementation is incomplete. Verify semantics, not just file existence.
- **Increasing vagueness** — "appropriate handling" or "standard patterns" instead of specific code.
- **Skipped steps** — omitting verification or protocol steps you'd normally follow.
- **Repetition** — restating things already established, burning tokens on known context.

If you notice these, treat it as POOR tier regardless of what the monitor says.

## Rules

1. **Don't read what you don't need.** Frontmatter or summary over full file.
2. **Don't inline large content.** Reference paths; let tools read from disk.
3. **Checkpoint before it's too late.** Commit and write a continuation note at first sign of pressure.
4. **Say it.** Tell the user when context is getting heavy.
