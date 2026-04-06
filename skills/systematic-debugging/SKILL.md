---
name: systematic-debugging
description: Use when encountering any bug, test failure, or unexpected behavior — enforces root cause investigation before proposing fixes.
---

# Systematic Debugging

## The Iron Law

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

If you haven't completed Phase 1, you cannot propose fixes.

## Phase 1: Root Cause Investigation

BEFORE attempting ANY fix:

1. **Read error messages carefully** — full stack traces, line numbers, error codes. Don't skip past them.
2. **Reproduce consistently** — can you trigger it reliably? Exact steps? Every time?
3. **Check recent changes** — `git diff`, recent commits, new dependencies, config changes.
4. **Gather evidence in multi-component systems** — add diagnostic logging at EACH component boundary. Run once to find WHERE it breaks. Then investigate that component.
5. **Trace data flow** — where does the bad value originate? Keep tracing up until you find the source. Fix at source, not at symptom.

## Phase 2: Pattern Analysis

1. **Find working examples** — locate similar working code in the same codebase.
2. **Compare against references** — if implementing a pattern, read the reference COMPLETELY.
3. **Identify differences** — what's different between working and broken? List every difference.
4. **Understand dependencies** — what settings, config, environment does this need?

## Phase 3: Hypothesis and Testing

1. **Form single hypothesis** — "I think X is the root cause because Y." Be specific.
2. **Test minimally** — smallest possible change. One variable at a time.
3. **Verify before continuing** — worked? Phase 4. Didn't work? New hypothesis. Don't pile fixes.

## Phase 4: Implementation

1. **Create failing test** — simplest reproduction. Automated. MUST have before fixing.
2. **Implement single fix** — ONE change. No "while I'm here" improvements.
3. **Verify fix** — test passes? Other tests still pass?
4. **If 3+ fixes failed** — STOP. Question the architecture. This is NOT a failed hypothesis — this is a wrong architecture. Escalate to the user.

## Red Flags — STOP and Return to Phase 1

- "Quick fix for now, investigate later"
- "Just try changing X and see"
- Proposing solutions before tracing data flow
- "One more fix attempt" after 2+ failures
- Each fix reveals a new problem in a different place

## Quick Reference

| Phase | Key Activities | Done when |
|-------|---------------|-----------|
| 1. Root Cause | Read errors, reproduce, check changes, trace data | Understand WHAT and WHY |
| 2. Pattern | Find working examples, compare | Differences identified |
| 3. Hypothesis | Form theory, test minimally | Confirmed or new hypothesis |
| 4. Implementation | Create test, fix, verify | Bug resolved, tests pass |
