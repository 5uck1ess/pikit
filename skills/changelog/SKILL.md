---
name: changelog
description: Generate a structured changelog from git history — use when asked to create a changelog, release notes, or summarize what changed between versions/tags/branches.
---

# Changelog Generation

Generate a structured changelog from git commits between two refs.

## Step 1: Gather Commits

```bash
FROM=${from:-$(git describe --tags --abbrev=0 2>/dev/null || git rev-list --max-parents=0 HEAD)}
TO=${to:-HEAD}
git log ${FROM}..${TO} --oneline --no-merges
```

## Step 2: Categorize

Analyze each commit:
- **Features** — new functionality
- **Fixes** — bug fixes
- **Performance** — optimizations
- **Refactoring** — code changes with no behavior change
- **Documentation** — doc changes
- **Tests** — test additions/changes
- **Breaking Changes** — public API or behavior changes

## Step 3: Output

```
## Changelog: {from} -> {to}

### Features
- Added JWT authentication middleware (#42)

### Fixes
- Fixed race condition in cache invalidation (#38)

### Breaking Changes
- Removed deprecated `/api/v1/users` endpoint

### Other
- Updated dependencies
```

## Rules

- Use actual commit messages — don't fabricate changes
- Group related commits together
- Include PR/issue numbers if present
- Highlight breaking changes prominently
- Skip merge commits and trivial changes
