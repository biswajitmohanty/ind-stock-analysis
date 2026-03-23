# Session Metrics

Track session quality via Clarification Debt (CD) and quality progression.

## Clarification Debt (CD) Scoring

| Event | Points | Description |
|-------|--------|-------------|
| Clarify | +10 | Agent asked for clarification |
| Correct | +25 | User corrected agent's approach |
| Redo | +40 | Agent had to redo work |
| Blocked | +0 | Waiting for external input (not agent's fault) |

### Modifiers

| Modifier | Effect |
|----------|--------|
| Charter not read | +15 |
| Repeated same error | ×1.5 |

### Thresholds

| CD Score | Action |
|----------|--------|
| < 50 | Normal operation |
| ≥ 50 | Root Cause Analysis required |
| ≥ 80 | Pause session, escalate to user |
| Redo ≥ 2 | Require scope confirmation |

## CD Log Format

```
| Turn | Agent | Event | Points | Detail |
|------|-------|-------|--------|--------|
| 3 | backend | clarify | +10 | Which NSE endpoint for corporate actions? |
| 7 | data | correct | +25 | RSI period should be 14 not 7 |
```

## Quality Score Tracking

Track quality through implementation phases:

```
| Phase | Score | Delta | Notes |
|-------|-------|-------|-------|
| IMPL baseline | 65 | — | Initial implementation |
| Post-VERIFY | 78 | +13 | Fixed type errors, added validation |
| Post-REFINE | 85 | +7 | Performance optimization |
| Final | 85 | 0 | Shipped |
```
