# Quality Score

Continuous quantitative scoring (0-100) for implementation quality.

## Dimensions

| Dimension | Weight | Measurement |
|-----------|--------|-------------|
| Correctness | 30% | Tests pass, indicator formulas verified, scoring logic correct |
| Security | 25% | No hardcoded tokens, safe HTTP headers, input validation |
| Performance | 15% | Parallel fetching, efficient computation, no redundant API calls |
| Coverage | 15% | Key paths tested, edge cases handled (empty data, invalid tickers) |
| Consistency | 15% | INR formatting, IST timezone, type safety, coding style |

## Composite Score

```
score = correctness × 0.30
      + security × 0.25
      + performance × 0.15
      + coverage × 0.15
      + consistency × 0.15
```

## Measurement Methods

### Automated (Preferred)
- `npx tsc --noEmit` — Type checking (affects Correctness)
- `bun run lint` — Linting (affects Consistency)
- `bun test` — Tests (affects Correctness + Coverage)

### Agent Estimation
When automated tools unavailable, agent estimates with `(estimated)` notation.

## Score Thresholds

| Range | Grade | Verdict |
|-------|-------|---------|
| 90-100 | A | PASS |
| 75-89 | B | CONDITIONAL PASS |
| 60-74 | C | FAIL — needs fixes |
| 0-59 | D | HARD FAIL — significant rework |

## Checkpoints

1. **IMPL baseline** — After initial implementation
2. **Post-VERIFY** — After running lint/type-check/tests and fixing
3. **Post-REFINE** — After optimization pass
4. **Final** — Before shipping

## Keep/Discard Rule

For any change attempt:
- `score_after ≥ score_before` → **KEEP**
- `score_before - score_after < 5` → **REVIEW** (might be noise)
- `score_before - score_after ≥ 5` → **DISCARD** (regression)
