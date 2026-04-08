---
name: verification
description: Evidence before claims, always — run verification commands and confirm output before making any completion or success claims.
---

# Verification Before Completion

## The Iron Law

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

If you haven't run the verification command in this response, you cannot claim it passes.

## The Gate

Before claiming ANY status:

1. **IDENTIFY** — what command proves this claim?
2. **RUN** — execute the FULL command (fresh, complete)
3. **READ** — full output, check exit code, count failures
4. **VERIFY** — does output confirm the claim?
5. **ONLY THEN** — make the claim

Skip any step = the claim is unverified.

## What Requires Verification

| Claim | Requires | NOT sufficient |
|-------|----------|----------------|
| "Tests pass" | Test command output showing 0 failures | Previous run, "should pass" |
| "Linter clean" | Linter output showing 0 errors | Partial check, extrapolation |
| "Build succeeds" | Build command exit 0 | Linter passing, "looks good" |
| "Bug fixed" | Original symptom test passes | "Code changed, should be fixed" |
| "Requirements met" | Line-by-line checklist verified | "Tests passing" |

## Red Flags — STOP

- Using "should", "probably", "seems to"
- Expressing satisfaction before verification ("Great!", "Done!")
- About to commit/push without running tests
- Relying on a previous run instead of a fresh one
- Thinking "just this once"

## Rationalization Prevention

| Excuse | Reality |
|--------|---------|
| "Should work now" | RUN the verification |
| "I'm confident" | Confidence is not evidence |
| "Linter passed" | Linter is not the test suite |
| "Partial check is enough" | Partial proves nothing |

## The Pattern

```
Run command -> Read output -> State result with evidence
```

```
WRONG: "All tests should pass now."
RIGHT: "Ran `npm test` — 34/34 passing, 0 failures."
```

## Verification Levels

Existence does not equal implementation. Verify at all four levels:

| Level | Check | Method |
|-------|-------|--------|
| 1. Exists | File is present at expected path | `[ -f path ]` |
| 2. Substantive | Content is real, not placeholder | No TODO/FIXME, no stub returns, no lorem ipsum |
| 3. Wired | Connected to the rest of the system | Imports resolve, routes registered, config referenced |
| 4. Functional | Actually works when invoked | Tests pass, endpoint responds, UI renders |

Levels 1-3 can be checked programmatically. Level 4 often requires running the system.

The `stub-detect` hook catches Level 2 failures at write time. A file full of stubs passes Level 1 but fails Levels 2-4.

## Non-Negotiable

No shortcuts. Run the command. Read the output. Then claim the result.
