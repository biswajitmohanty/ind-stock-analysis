# Workflow: Review

Full QA review pipeline for security, data accuracy, performance, and code quality.

## Mandatory Rules

1. **No skipping steps** — Review all dimensions in order
2. **File:line references** — Every finding must cite exact location
3. **No false positives** — Every finding must be reproducible

## Step 1: Identify Review Scope

Determine what to review:
- Specific files (from PR diff or user request)
- Specific branch (compare against main)
- Entire project (full audit)

## Step 2: Automated Checks

Run automated tools:
```bash
npx tsc --noEmit          # Type checking
bun run lint              # Biome linting
bun test                  # Tests (if available)
```

Record results.

## Step 3: Security Review

Check for:
- [ ] No hardcoded API tokens (search for `UPSTOX`, `Bearer`, `token`)
- [ ] Environment variables used for secrets
- [ ] NSE scraper headers don't leak sensitive info
- [ ] No `eval()` or dynamic code execution
- [ ] Input validation on CLI arguments (ticker format)
- [ ] Safe HTTP error handling (no stack traces to console in production)

## Step 4: Data Accuracy Review

Check for:
- [ ] Indicator calculations match `technicalindicators` library API
- [ ] Scoring thresholds match `src/constants.ts` values
- [ ] India VIX interpretation: >20 = bullish (contrarian), <13 = bearish
- [ ] Probability calibration uses correct Platt scaling formula
- [ ] ATR risk levels use correct multipliers (SL: 1.5, TP: 3.0)
- [ ] Transaction costs: 0.15% applied in backtester
- [ ] No look-ahead bias in backtesting logic

## Step 5: Performance Review

Check for:
- [ ] Parallel ticker processing (`Promise.all`)
- [ ] No unnecessary sequential API calls
- [ ] Efficient pattern detection (no O(n²) when O(n) possible)
- [ ] NSE cookie refresh not too frequent (every 4 min, not every call)
- [ ] No redundant data source calls (fallback only on failure)

## Step 6: Code Quality Review

Check for:
- [ ] Explicit TypeScript return types on all exports
- [ ] Consistent INR formatting (`₹` prefix, Indian locale)
- [ ] Consistent IST timezone usage (Luxon `Asia/Kolkata`)
- [ ] Error handling: graceful degradation, not crashes
- [ ] No unused imports or variables
- [ ] Consistent naming conventions

## Step 7: Generate Report

```markdown
## QA Review Report — {date}

### Summary
- Verdict: {PASS | CONDITIONAL PASS | FAIL}
- Scope: {files/branch/project}
- Automated: tsc={pass/fail}, lint={pass/fail}, tests={pass/fail/skipped}

### Findings ({count})

#### [{CRITICAL|HIGH|MEDIUM|LOW}] {title}
- **File**: {path}:{line}
- **Description**: {issue}
- **Impact**: {consequence}
- **Recommendation**: {fix}

### Recommendations
{ordered list of suggested improvements}
```
