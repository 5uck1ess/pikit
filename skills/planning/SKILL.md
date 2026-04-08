---
name: planning
description: Writing implementation plans — small testable steps, dependency ordering, upfront risk identification.
---

# Planning

## What a Good Plan Looks Like

A plan is an ordered list of small steps. Each step should be:

- **Independently testable** — you can verify it works before moving on
- **Small** — completable in one focused session
- **Concrete** — "Add validation to `parseConfig`" not "improve error handling"

## Breaking Down Work

Start from the end: What does "done" look like? Work backwards.

1. Identify the deliverable
2. List the components/changes needed
3. For each component, identify the smallest meaningful increment
4. Order by dependency (what must exist before what?)

If a step feels large or vague, break it down further. If you can't describe how to verify a step, it's too abstract.

## Ordering Steps

- **Dependencies first**: Build the foundation before the features
- **Riskiest first**: Tackle unknowns early — if something will blow up the plan, find out now
- **Vertical slices over horizontal layers**: Prefer "auth end-to-end" over "all database tables, then all API routes, then all UI"

## Identifying Risks

Before starting, ask:

- What am I least sure about technically?
- Where am I making assumptions I haven't verified?
- What external dependencies could block me?
- What's the hardest part? (Do that first.)

Flag risks explicitly in the plan. A risk without a mitigation is just a wish.

## Plan Format

```
## Plan: [Feature Name]

### Steps
1. [ ] Step description — how to verify
2. [ ] Step description — how to verify
3. [ ] Step description — how to verify

### Risks
- Risk description → mitigation
```

## Thinking Models for Plans

Apply these at decision points, not continuously:

### Pre-Mortem
Before finalizing, assume the plan has already failed. List the 3 most likely reasons — missing dependency, wrong decomposition, underestimated complexity — and add mitigation steps.

### MECE Check
Verify the task breakdown is Mutually Exclusive, Collectively Exhaustive:
1. List every requirement from the goal
2. Confirm each maps to exactly one step
3. If two steps modify the same file, confirm they touch different concerns
4. Flag any requirement not covered by any step

### Constraint-First
Identify the single hardest constraint — the thing that, if it doesn't work, makes everything else irrelevant. Schedule it as step 1 or 2, not last. If it involves an unfamiliar API or library, add a spike step before the main work.

### Reversibility Test
For each significant decision, classify as REVERSIBLE (cheap to change later) or IRREVERSIBLE (requires migration, breaking changes). Spend analysis time proportional to irreversibility.

### Curse of Knowledge
Re-read each step as if you've never seen this codebase. Is every noun unambiguous (which file? which function?)? Is every verb specific (add WHERE? modify HOW?)? If a step could be interpreted two ways, rewrite it.

Skip these for single-step plans or trivially obvious changes.

## Gates

Every plan should identify its validation gates:

| Gate Type | When | What Happens |
|-----------|------|-------------|
| Pre-flight | Before starting | Check preconditions exist (files, deps, config). Block if unmet. |
| Revision | After producing output | Check quality, loop back with feedback if insufficient (cap iterations). |
| Escalation | When stuck | Surface to user with clear options. Don't spin. |
| Abort | When continuing would cause damage | Stop immediately, preserve state, report why. |

Not every plan needs all four. Simple changes need pre-flight at most. Multi-step work should have at least pre-flight and revision gates.

## Plans Change

A plan is a starting hypothesis, not a contract. Update it as you learn. The goal is to think through the work upfront, not to predict the future perfectly.
