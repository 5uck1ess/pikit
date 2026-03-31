# Pikit

Token-efficient coding harness for [pi-mono](https://github.com/badlogic/pi-mono). Multi-model workflows, [RTK](https://github.com/rtk-ai/rtk) compression, progressive skill loading, and model-tier routing.

## Quick Start

```bash
./scripts/install.sh                # Install bun, pi-mono, RTK, deps
./scripts/setup.sh /path/to/project # Link pikit to your project
cd /path/to/project && pi           # Start coding
```

## Model Profiles

```bash
/config apply anthropic    # smart=Opus, general=Sonnet, fast=Haiku
/config apply codex        # smart=GPT-5.4-codex, fast=GPT-5.1-codex-mini
/config apply gemini       # smart=Gemini-3.1-Pro, fast=Gemini-3.1-Flash
/config aliases            # Show current mappings
```

## Workflows

```bash
/workflow brainstorm "should we use a message queue here?"
/workflow feature "add user authentication with JWT"
/workflow research "compare state management for React"
/workflow code-review "check src/ for security issues"
/workflow test "generate tests for src/auth/"
/workflow tri-review "review the latest PR"
/workflow tri-dispatch "compare caching strategies"
/workflow self-improve "--target src/ --metric 'npm test' --objective 'fix failing tests'"
```

| Workflow | Steps | Models |
|---|---|---|
| `brainstorm` | Open ideation | smart |
| `feature` | Brainstorm → Plan → Implement (loop) | smart |
| `research` | Clarify → Search → Analyze → Synthesize | smart + general |
| `code-review` | Analyze → Summarize | smart → fast |
| `test` | Analyze → Generate → Run → Fix (loop) | smart + fast |
| `tri-review` | Gather → 3-tier review → Consolidate | all tiers |
| `tri-dispatch` | Same task to 3 models → Compare | all tiers |
| `self-improve` | Baseline → Improve (loop) → Report | fast + smart |

## Token Efficiency

1. **[RTK](https://github.com/rtk-ai/rtk)** — Compresses shell output 60-90% before entering context
2. **Model routing** — Cheap models for simple steps, expensive for complex
3. **Module pruning** — `/module hide search` removes unused tools from the prompt
4. **Progressive skills** — Only name+description loaded; full content on demand

## Skills

Built-in skills for code quality and workflow authoring:

| Skill | Purpose |
|---|---|
| `brainstorming` | Collaborative ideation techniques |
| `planning` | Implementation plan authoring |
| `executing` | Step-by-step plan execution |
| `clean-code` | Naming, functions, stepdown rule |
| `dry` | Don't Repeat Yourself + Rule of Three |
| `yagni` | Build only what's needed now |
| `writing-workflows` | Workflow YAML authoring guide |
| `writing-tests` | Test writing best practices |
| `skill-authoring` | How to write new skills |

## Tools

| Tool | What it does |
|---|---|
| `memory_set/get/list/delete` | Per-project key-value stores |
| `todo_add/complete/list` | Task tracking within sessions |
| `web_search` | Web search via SearXNG |
| `web_fetch` | Fetch URL as readable text |
| `ask_user` | Pause and ask the user a question |

## Commands

| Command | Usage |
|---|---|
| `/workflow <name> <input>` | Run a multi-step workflow |
| `/config apply <profile>` | Switch model profile |
| `/module show/hide <name>` | Toggle tool groups |
| `/todo add/done/list/clear` | Manage session todos |
| `/rtk` | Show RTK compression stats |
