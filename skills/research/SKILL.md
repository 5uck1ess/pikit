---
name: research
description: Research workflow — use when asked to research a topic, investigate options, compare approaches, or find the best solution. For high-stakes or complex questions, use deep-research instead.
---

# Research Workflow

Lifecycle: clarify, decompose, search, summarize, corroborate, synthesize.

## Step 1: Clarify

Ask the user:
- What specifically are we trying to learn?
- What constraints matter (language, framework, scale)?
- Any sources they already know about?

Restate the research question precisely. Don't proceed until clear.

## Step 2: Decompose

Break into 3-5 sub-questions with explicit retrieval goals:
- Each targets a DIFFERENT angle (definition, evidence, criticism, alternatives, recency)
- Include at least one query seeking disconfirming evidence or criticism
- No two queries should return the same results

## Step 3: Search

Execute all sub-question searches. Collect titles, URLs, key snippets.

## Step 4: Summarize Sources

For the 3-5 most promising URLs, fetch and summarize into 3-5 key claims with source attribution. Do NOT carry raw page content forward.

## Step 5: Corroborate

For each key claim:
- CONFIRMED (2+ independent sources agree)
- UNCORROBORATED (only 1 source)
- CONTESTED (sources disagree)

## Escalation Check

Ask the user to upgrade to deep research if:
- 3+ CONTESTED claims
- High-stakes domain (security, architecture, compliance)
- Most claims are UNCORROBORATED

Never auto-escalate — always ask first.

## Step 6: Follow-Up

For UNCORROBORATED or CONTESTED claims, run one targeted search to confirm or resolve. Loop up to 2 times.

## Step 7: Synthesize

```
## Research: {question}

### Direct Answer
{clear answer}

### Key Findings
- CONFIRMED: {claim} — [source1], [source2]
- UNCORROBORATED: {claim} — [source]
- CONTESTED: {claim} — sources disagree

### Tradeoffs
{comparison between approaches}

### Recommendation
{what to do and why, with confidence level}
```

## Rules

- Clarify before searching
- Summarize immediately — never carry raw content forward
- Track corroboration status for every claim
- Surface contradictions explicitly
- Cite sources for every finding
