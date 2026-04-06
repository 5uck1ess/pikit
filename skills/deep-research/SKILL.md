---
name: deep-research
description: Deep research with Analysis of Competing Hypotheses — use when asked to do deep research, deeply investigate, validate claims, or when correctness is critical and the user wants rigorous analysis with disconfirmation testing.
---

# Deep Research Workflow

ACH-enhanced research: clarify, discover perspectives, decompose, search, summarize, generate hypotheses, disconfirm, build evidence matrix, self-critique, synthesize.

## Step 1: Clarify

Before searching, clarify with the user:
- What specifically are we trying to learn?
- What constraints matter (language, framework, scale)?
- What would a wrong answer cost?
- Any sources they already know about?

Restate the research question precisely. Don't proceed until it's sharp.

## Step 2: Discover Perspectives

Search for 2-3 overview/survey articles. Extract:
- Major schools of thought or approaches
- Key voices (companies, researchers, communities)
- Known debates or controversies
- Underrepresented perspectives

Summarize immediately — do not carry raw content forward.

## Step 3: Decompose into Sub-Questions

Break the question into 5-8 sub-questions with explicit retrieval goals:
- At least one query per major perspective
- At least 2 queries seeking DISCONFIRMING evidence ("problems with X", "X failures")
- At least one query targeting recent sources (last 12 months)
- No two queries should return the same results

## Step 4: Search

Execute all sub-question searches. Collect titles, URLs, key snippets, dates.

## Step 5: Extract Atomic Claims

For the 5-8 most promising URLs, fetch and extract individual factual assertions:
- Claim: specific assertion
- Source: URL
- Recency: publication date or "unknown"

Summarize each page into atomic claims immediately. Do NOT carry raw content forward.

## Step 6: Generate Competing Hypotheses

Generate 2-4 competing hypotheses:
- Must be mutually exclusive or meaningfully different
- Include at least one "contrarian" hypothesis
- Each must be a clear, testable statement

## Step 7: Directed Disconfirmation

For EACH hypothesis, search specifically for evidence that would DISPROVE it. You are trying to KILL each hypothesis, not confirm it.

If you cannot find disconfirming evidence after genuine effort, note that — it's a signal of strength.

## Step 8: Build Evidence Matrix

Rows = all claims. Columns = hypotheses. For each cell:
- CC (Strongly Consistent) / C (Consistent) / N (Neutral) / I (Inconsistent) / II (Strongly Inconsistent)

Score by FEWEST inconsistencies. The surviving hypothesis has the fewest inconsistencies, NOT the most consistencies.

## Step 9: Sensitivity Check

For the leading hypothesis:
1. Which single piece of evidence, if wrong, would change the conclusion?
2. Are there linchpin claims from only one source?
3. What new evidence would flip the answer?

## Step 10: Self-Critique

Before final output:
1. Did I genuinely try to disprove each hypothesis?
2. Are there perspectives I missed?
3. Am I over-weighting any single source?
4. Would someone with the opposite view find this fair?

## Step 11: Synthesize

```
## Deep Research: {question}

### Direct Answer
{answer with confidence: HIGH / MEDIUM / LOW}

### Competing Hypotheses
For each: statement, status (REJECTED/SURVIVING/INCONCLUSIVE), supporting + disconfirming evidence, inconsistency count

### Evidence Matrix Summary

### Key Findings
- CONFIRMED: {claim} — [source1], [source2]
- CONTESTED: {claim} — sources disagree
- UNCORROBORATED: {claim} — single source

### Sensitivity Analysis
- Linchpin evidence and confidence fragility

### What Would Change This Conclusion

### Recommendation
{what to do and why, with calibrated confidence}
```

## Rules

- Disconfirm, don't confirm — try to DISPROVE hypotheses
- Summarize immediately — never carry raw fetched content forward
- Evidence matrix is mandatory
- Sensitivity check is mandatory
- Cite everything
- Be honest about uncertainty
