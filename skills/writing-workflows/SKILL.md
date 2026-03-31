---
name: writing-workflows
description: How to write pikit workflow YAML files — schema reference, step types, and examples.
---

# Writing Workflows

Pikit workflows are YAML files in the `workflows/` directory. Each workflow defines a sequence of steps that are executed in order.

## Schema

```yaml
name: string          # Workflow display name
description: string   # What this workflow does
steps:
  - id: string        # Unique step identifier
    model: string     # Model to use (e.g., "claude-sonnet-4-20250514")
    prompt: string    # The prompt to send (supports ${{variable}} interpolation)
    loop:             # Optional: repeat this step
      over: string    # Variable name containing an array to iterate
      as: string      # Variable name for current item
    branch:           # Optional: conditional execution
      if: string      # Condition expression
      then: string    # Step id to jump to if true
      else: string    # Step id to jump to if false
```

## Step Fields

- **id** — Must be unique within the workflow. Used for branch targets and output references.
- **model** — Which model runs this step. Pick based on task complexity.
- **prompt** — The instruction. Use `${{steps.previous_id.output}}` to reference earlier step outputs. Use `${{input.field}}` for workflow inputs.
- **loop** — Iterates the step over an array. Each iteration gets the current item as the `as` variable.
- **branch** — Routes execution conditionally. Both `then` and `else` reference step `id`s.

## Minimal Example

```yaml
name: summarize-and-review
description: Summarize a document then review the summary
steps:
  - id: summarize
    model: claude-sonnet-4-20250514
    prompt: |
      Summarize the following document in 3 bullet points:
      ${{input.document}}

  - id: review
    model: claude-sonnet-4-20250514
    prompt: |
      Review this summary for accuracy and completeness.
      Summary: ${{steps.summarize.output}}
      Original: ${{input.document}}
```

## Tips

- Keep prompts focused. One task per step.
- Use descriptive `id`s — they appear in logs and output references.
- Put complex multi-step logic in workflows, not in prompts.
- Test workflows with small inputs first.
