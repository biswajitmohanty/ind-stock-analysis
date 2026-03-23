# Clarification Protocol

Handle ambiguous requirements systematically.

## Uncertainty Levels

### LOW — Apply defaults, proceed
The task is clear enough. Record assumptions and move forward.

**Template**:
```
Proceeding with assumptions:
- {assumption 1}
- {assumption 2}
```

### MEDIUM — Present options, let user choose
Multiple valid approaches exist. Present top 3 with trade-offs.

**Template**:
```
I see {n} approaches for this:

Option A: {description}
  Pro: {advantage}
  Con: {disadvantage}
  Effort: {low | medium | high}

Option B: {description}
  Pro: {advantage}
  Con: {disadvantage}
  Effort: {low | medium | high}

Which approach do you prefer?
```

### HIGH — Must ask, cannot proceed
Critical information is missing that affects correctness.

**Template**:
```
I need clarification before proceeding:

1. {specific question}
2. {specific question}

Status: BLOCKED until answered
```

## Triggers for MEDIUM/HIGH

| Trigger | Level |
|---------|-------|
| Business logic decision (e.g., new scoring formula) | HIGH |
| Security decision (e.g., new API key handling) | HIGH |
| Conflicts with existing code patterns | MEDIUM |
| Multiple valid implementation approaches | MEDIUM |
| Subjective requirement ("make it better") | MEDIUM |
| Unlimited scope ("improve everything") | HIGH |

## Indian Stock Analysis Specifics

Common clarification points:
- Which data source should be primary for a new feature?
- Should new indicators use default weights or need optimization?
- Does the new feature need all 3 output formats (CSV, JSON, console)?
- Should new tickers default to NSE (.NS) or require explicit suffix?
- Is backtesting validation required for scoring changes?
