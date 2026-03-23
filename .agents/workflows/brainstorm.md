# Workflow: Brainstorm

Design-first ideation workflow. Run before planning/implementation.

## When to Use

- New feature with unclear design
- Multiple valid approaches to evaluate
- Significant architecture change
- User says "explore", "brainstorm", "design", "think about"

## Steps

### Step 1: Explore Context
- Read relevant source files to understand current state
- Identify constraints (data source limitations, type system, existing patterns)

### Step 2: Ask Clarifying Questions
If requirements are ambiguous (MEDIUM/HIGH uncertainty):
- Present focused questions
- Wait for answers before proceeding

### Step 3: Propose Approaches
Generate 2-4 approaches:

```
## Approach A: {name}
- Description: {how it works}
- Pros: {advantages}
- Cons: {disadvantages}
- Effort: {Simple | Medium | Complex}
- Files affected: {list}

## Approach B: {name}
...
```

### Step 4: Present Design
Recommend one approach with rationale:
```
Recommendation: Approach {X}
Reason: {why this is best for Indian stock analysis}
Trade-offs: {what we give up}
```

### Step 5: Save Design Document
On approval, save to `.agents/results/design-{feature}.md`

### Step 6: Transition to Planning
Hand off to Plan workflow with the approved design.

## Indian Stock Analysis Brainstorm Topics

Common design decisions:
- Adding a new data source (which API? authentication model? fallback position?)
- New indicator (which library? default weight? backtest impact?)
- New output format (which data to include? formatting conventions?)
- Scoring engine changes (new weights? new signals? calibration impact?)
- Portfolio features (risk metrics? correlation? diversification scoring?)
