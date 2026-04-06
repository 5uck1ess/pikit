---
name: onboard
description: Generate a codebase onboarding guide — use when asked to explain this codebase, help understand the architecture, give a tour of the repo, or onboard a new contributor.
---

# Codebase Onboarding

Analyze a codebase and generate a practical onboarding guide.

## Step 1: Analyze Structure

Read and analyze:
- Directory structure and organization
- Package manifests (package.json, go.mod, pyproject.toml, Cargo.toml)
- Entry points (main files, index files, cmd/ directories)
- Configuration and CI/CD files
- README, CONTRIBUTING, AGENTS.md if they exist

## Step 2: Identify Architecture

Determine:
1. Architecture pattern (monolith, microservices, MVC, etc.)
2. Key directories and what lives in each
3. Data flow — how a request/event moves through the system
4. Core abstractions — important types, interfaces, classes
5. External dependencies — APIs, databases, services
6. Build and deploy — how to build, test, and deploy

## Step 3: Generate Guide

```
## Onboarding: {project_name}

### Quick Start
1. Install dependencies: {install_command}
2. Run tests: {test_command}
3. Start dev server: {dev_command}

### Architecture
{architecture_summary}

### Directory Map
| Directory | Purpose |
|-----------|---------|

### Key Files
| File | Why it matters |
|------|---------------|

### Data Flow
{request_lifecycle_explanation}

### Patterns & Conventions
{list}

### Gotchas
{non-obvious things that trip people up}

### Common Tasks
| Task | How |
|------|-----|
```

## Rules

- Read actual code — don't guess from file names alone
- Focus on what a new contributor needs to be productive
- Keep it practical — commands, file paths, concrete examples
- Identify gotchas that aren't obvious from the code
- Skip boilerplate explanations
