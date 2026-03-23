# Experiment Ledger

Automatic record of significant change attempts with measurable impact.

## Ledger Format

```markdown
| # | Phase | Agent | Hypothesis | Score Before | Score After | Delta | Decision | Files Changed |
|---|-------|-------|-----------|-------------|------------|-------|----------|---------------|
| 1 | IMPL | data | Add momentum indicator | 65 | 72 | +7 | KEEP | indicators.ts, analysis.ts |
| 2 | REFINE | backend | Parallel NSE+Yahoo fetch | 72 | 78 | +6 | KEEP | data-fetcher.ts |
| 3 | REFINE | data | Alternative RSI period=7 | 78 | 71 | -7 | DISCARD | indicators.ts |
```

## What to Record

- Discrete logical changes with measurable impact
- Each experiment must have a clear hypothesis
- Score measured before and after using quality-score.md

## Who Records

| Agent | Records At |
|-------|-----------|
| Orchestrator | Baseline score, session-end summary |
| QA | Post-VERIFY score |
| Debug | Post-fix score |
| Backend/Data | Post-REFINE score |

## Session-End Analysis

At session end, summarize:
- Score trajectory (start → final)
- Top improvements (highest positive delta)
- Failed experiments with root causes
- Agent effectiveness (which agent contributed most improvement)

## Constraints

- Max 3 hypotheses per exploration round
- Max 2 exploration rounds per session
- Max 10 turns per hypothesis
- Min 5-point gap to justify exploration
