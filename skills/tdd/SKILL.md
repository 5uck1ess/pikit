---
name: tdd
description: Test-driven development — write the test first, watch it fail, write minimal code to pass. Use when implementing features or fixing bugs.
---

# Test-Driven Development

## The Iron Law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

Write code before the test? Delete it. Start over. No exceptions.

## Red-Green-Refactor

### RED — Write Failing Test

Write ONE minimal test showing what should happen.

Requirements:
- One behavior per test
- Clear name describing the scenario and expected outcome
- Real code, not mocks (unless external dependency)

### Verify RED — Watch It Fail

**MANDATORY. Never skip.**

Run the test. Confirm:
- Test FAILS (not errors from typos)
- Failure message matches what you expect
- Fails because the feature is missing

Test passes? You're testing existing behavior. Fix the test.

### GREEN — Minimal Code

Write the SIMPLEST code to pass the test. Nothing more.

Don't add features. Don't refactor. Don't "improve" beyond the test.

### Verify GREEN — Watch It Pass

**MANDATORY.**

Run the test. Confirm:
- Test passes
- ALL other tests still pass
- No warnings or errors in output

### REFACTOR — Clean Up

After green only:
- Remove duplication
- Improve names
- Extract helpers

Keep tests green. Don't add behavior.

### Repeat

Next failing test for next behavior.

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "Too simple to test" | Simple code breaks. Test takes 30 seconds. |
| "I'll test after" | Tests written after pass immediately — proves nothing. |
| "Need to explore first" | Fine. Throw away exploration, start with TDD. |
| "Test is hard to write" | Listen to the test. Hard to test = hard to use. Fix the design. |
| "TDD will slow me down" | TDD is faster than debugging. Every time. |
| "Keep as reference" | You'll adapt it. That's testing-after. Delete means delete. |

## Bug Fix Example

Bug: empty email accepted.

**RED:** `test('rejects empty email', () => { expect(validate('')).toBe(false); })`
**Verify RED:** FAIL — `expected false, got undefined`
**GREEN:** `function validate(email) { return email.trim().length > 0; }`
**Verify GREEN:** PASS

## Red Flags — STOP and Start Over

- Code written before test
- Test passes immediately (you're testing existing behavior)
- Can't explain why the test failed
- Rationalizing "just this once"
- Multiple behaviors in one test

All of these mean: delete code, start over with TDD.
