---
name: doc-gen
description: Generate documentation for code — use when asked to document a module, generate API docs, create a README for code, or write reference documentation.
---

# Documentation Generation

Analyze code and generate comprehensive documentation.

## Step 1: Analyze Target

Read the target files and identify:
- Public exports, classes, functions, types
- API surface and interfaces
- Configuration options
- Dependencies and relationships
- Usage patterns from existing code/tests

## Step 2: Generate Documentation

Produce:
1. **Overview** — what the module/package does
2. **API Reference** — every export with signature, params, return type, description
3. **Usage Examples** — realistic code snippets
4. **Configuration** — options and defaults if applicable

## Step 3: Output

Write docs to the appropriate location:
- If `docs/` directory exists, write there
- If a specific output path was requested, use that
- Otherwise, output inline in the conversation

## Rules

- Read actual code — don't guess signatures or behavior
- Include real examples, not placeholder code
- Match existing doc style if docs already exist
- Don't generate docs for internal/private code unless asked
- Keep descriptions concise — one line per param, one paragraph per function
