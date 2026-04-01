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
/config apply codex        # smart=GPT-5.4-thinking, general=GPT-5.4, fast=GPT-5.4-mini
/config apply gemini       # smart=Gemini-3.1-Pro, general=Flash, fast=Flash-Lite
/config apply deepseek     # smart=DeepSeek-R1, general=V3, fast=V3
/config apply qwen         # smart=Qwen3.5-235B, general=Qwen3.5-32B, fast=Qwen3.5-8B
/config apply local        # Ollama: DeepSeek-Coder-V3 + Qwen2.5-Coder
/config apply lmstudio     # LM Studio: same models, OpenAI-compatible API
/config apply vllm         # vLLM: high-throughput serving
/config apply llamacpp     # llama.cpp: lightweight C++ inference
/config aliases            # Show current mappings
```

## Workflows

```bash
/workflow feature "add user authentication with JWT"
/workflow bugfix "TypeError in handleAuth when session is null"
/workflow refactor "simplify the payment processing module"
/workflow research "compare state management approaches for React"
/workflow tri-review "review the latest PR"
/workflow tri-dispatch "compare caching strategies"
/workflow tri-debug "TypeError in handleAuth after upgrading passport"
/workflow tri-security "audit src/api/ for vulnerabilities"
/workflow self-improve "--target src/ --metric 'npm test' --objective 'fix failing tests'"
/workflow self-test "npm test"
/workflow self-lint "npx eslint src/"
/workflow self-perf "node bench/run.js --target 200ms"
```

| Workflow | Steps | Models |
|---|---|---|
| `feature` | Brainstorm → Plan → Implement (loop) → Test → Lint → Review (parallel) → Report | all tiers |
| `bugfix` | Reproduce → Diagnose → Fix → Regression test → Verify → Summary | fast + smart |
| `refactor` | Analyze → Plan → Refactor (loop) → Verify → Before/after comparison | fast + smart |
| `research` | Clarify → Search → Analyze → Synthesize | smart + general |
| `tri-review` | Gather → 3-tier review (parallel) → Consolidate | all tiers |
| `tri-dispatch` | 3 models in parallel → Compare | all tiers |
| `tri-debug` | 3 models diagnose in parallel → Compare theories | all tiers |
| `tri-security` | 3 parallel audits (injection, auth, config) → Report | all tiers |
| `self-improve` | Baseline → Improve (loop) → Report | fast + smart |
| `self-test` | Run tests → Fix failures (loop) → Summary | fast + smart |
| `self-lint` | Run linter → Fix violations (loop) → Summary | fast + smart |
| `self-perf` | Profile → Optimize (loop) → Report improvement | fast + smart |

Write your own workflows with the `creating-workflows` skill — see `/workflow list` for available workflows.

## Token Efficiency

1. **[RTK](https://github.com/rtk-ai/rtk)** — Compresses shell output 60-90% before entering context
2. **Model routing** — Cheap models for simple steps, expensive for complex
3. **Token budgets** — Set a per-workflow ceiling; auto-downgrade to fast models when approaching limit
4. **Parallel steps** — Run independent steps concurrently (tri-review, tri-dispatch)
5. **Module pruning** — `/module hide search` removes unused tools from the prompt
6. **Progressive skills** — Only name+description loaded; full content on demand
7. **Dry run** — `/workflow --dry-run feature "..."` previews steps without executing
8. **Per-step stats** — `/rtk --steps` shows compression breakdown by workflow step

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
| `web_search` | Search via DuckDuckGo |
| `web_read` | Fetch URL as readable markdown |
| `ask_user` | Pause and ask the user a question |

## Commands

| Command | Usage |
|---|---|
| `/workflow <name> <input>` | Run a multi-step workflow |
| `/config apply <profile>` | Switch model profile |
| `/module show/hide <name>` | Toggle tool groups |
| `/todo add/done/list/clear` | Manage session todos |
| `/rtk` | Show RTK compression stats |
| `/test-gen <target>` | Generate tests for a file or directory |
| `/changelog [since]` | Generate changelog from git history |
