---
name: test-gen
description: Generate tests for code — use when asked to write tests, create a test suite, add test coverage, or generate unit/integration tests for a file or module.
---

# Test Generation

Generate tests for target code, run them, and iterate until they pass.

## Step 1: Analyze Target

Read the target files and detect:
- Language and test framework (vitest, jest, pytest, go test, cargo test, etc.)
- Existing test patterns and conventions
- Exports, public API, and key code paths
- Edge cases and error conditions

If test framework isn't obvious, check `package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`.

## Step 2: Generate Tests

1. Create test files matching project conventions
2. Cover happy paths, edge cases, error conditions
3. Use descriptive test names
4. Mock external dependencies only when necessary
5. Follow existing test patterns in the repo

## Step 3: Run and Fix

Run the test command. If tests fail, fix and retry up to 3 times.

## Step 4: Report

```
## Test Generation Report

**Target:** {target}
**Framework:** {framework}
**Tests created:** {count}
**Status:** all passing / {n} failing

### Files Created
- tests/test_parser.py (12 tests)

### Coverage
- Lines: {line_coverage}%

### Run Command
{test_command}
```

## Rules

- Match existing test conventions exactly (naming, location, style)
- Never modify source code — only create/edit test files
- Tests must actually run and pass
- Iterate up to 3 times to fix failures
- If a test can't be fixed, skip it and note in report
