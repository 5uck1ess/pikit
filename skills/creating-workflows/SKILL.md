# Writing Workflows

Pikit workflows are YAML files in the `workflows/` directory. Each workflow defines a sequence of steps executed in order by the agent.

## Schema

```yaml
name: string          # Workflow display name
description: string   # What this workflow does
budget:               # Optional: token budget
  limit: number       # Max characters (1 token ~ 4 chars)
  downgrade: string   # "fast" | "skip" | "stop"
steps:
  - id: string        # Unique step identifier
    model: string     # Model alias (e.g., "smart", "fast")
    prompt: string    # The prompt to send (supports {{variable}} interpolation)
    command: string   # Alternative: shell command to run
    args: object      # Arguments for command steps
    skills: string[]  # Skills to load for this step
    approval: bool    # Require user confirmation before running
    loop:             # Optional: repeat this step
      max: number     # Maximum iterations
      until: string   # Stop when response contains this string
    branch:           # Optional: conditional execution
      - when: string  # Match this text in the response
        goto: string  # Jump to this step id
    parallel: string[] # Run listed step ids (sequentially, in order)
```

## Interpolation

- `{{input}}` — the user's input passed to `/workflow`
- `{{step_id}}` — output from a previous step, referenced by its `id`

Only referenced keys are injected into the prompt. Unreferenced step outputs are excluded to save tokens.

## Minimal Example

```yaml
name: summarize-and-review
description: Summarize a document then review the summary
steps:
  - id: summarize
    model: smart
    prompt: |
      Summarize the following document in 3 bullet points:
      {{input}}

  - id: review
    model: smart
    prompt: |
      Review this summary for accuracy and completeness.
      Summary: {{summarize}}
      Original: {{input}}
```

## Loop Example

```yaml
steps:
  - id: implement
    model: smart
    prompt: |
      Execute the next incomplete todo from the plan.
      If all todos are complete, say "ALL_DONE".
    loop:
      max: 20
      until: ALL_DONE
```

## Branch Example

```yaml
steps:
  - id: check
    model: fast
    prompt: Run the test suite and report results.
    branch:
      - when: all passing
        goto: done
      - when: failure
        goto: fix
```

## Running

```
/workflow list                    # List available workflows
/workflow feature implement auth  # Run "feature" workflow with input "implement auth"
/workflow --dry-run feature test  # Preview steps without executing
```

## Tips

- Keep prompts focused. One task per step.
- Use descriptive `id`s — they appear in the chat as step labels.
- Steps run as agent turns, so the agent has full tool access (read, edit, bash, etc.).
- Test workflows with `--dry-run` first.
- Use `approval: true` on destructive steps for a confirmation gate.
