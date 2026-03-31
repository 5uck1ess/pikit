---
name: skill-authoring
description: How to write new skills for pikit — SKILL.md format, frontmatter, progressive disclosure, keeping content concise.
---

# Skill Authoring

## Structure

A skill is a directory under `skills/` containing a `SKILL.md` file:

```
skills/
  my-skill/
    SKILL.md           # Required: skill definition
    references/        # Optional: supplementary material
      examples.md
      advanced.md
```

## SKILL.md Format

Every `SKILL.md` has two parts: YAML frontmatter and a markdown body.

```markdown
---
name: my-skill
description: One-line description of what this skill provides.
---

# Skill Title

Body content here.
```

### Frontmatter Fields

- **name** (required) — Identifier for the skill. Use kebab-case. Must match the directory name.
- **description** (required) — Brief description. This is shown in skill listings and used for matching, so make it specific.

## Writing the Body

The body is the instruction set that gets loaded into context when the skill is activated.

**Keep it under 100 lines.** Context space is expensive. Every line should earn its place.

Guidelines:

- **Be direct.** Claude is smart — state the principle, give one example, move on. Don't over-explain.
- **Use structure.** Headers, bullet points, and short code blocks are easier to follow than long paragraphs.
- **Focus on decisions.** The most valuable guidance helps choose *between* options, not catalog all options.
- **Include examples** for anything where the format matters (schemas, naming conventions, file structure).
- **Omit the obvious.** Don't restate things any competent developer already knows.

## Progressive Disclosure with references/

Put supplementary material in a `references/` subdirectory. This content is not loaded by default — it's available on demand for deeper dives.

Use references for:
- Extended examples
- Edge cases and advanced patterns
- Background/rationale that's useful but not essential

## Naming

- Directory name = skill name = frontmatter `name` field
- Use kebab-case: `writing-tests`, `clean-code`, `skill-authoring`
- Pick names that are natural to invoke: "use the clean-code skill"
