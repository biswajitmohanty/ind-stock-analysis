---
name: oma-debug
description: Debug specialist for Indian stock analysis tool. Diagnoses data fetching failures (NSE/Upstox/Yahoo), indicator miscalculations, scoring bugs, and CLI issues.
version: 1.0.0
tags: [debugging, bug-fixing, indian-market, data-fetching]
---

# OMA Debug — Bug Diagnosis Specialist

Structured bug diagnosis and fixing for the Indian stock analysis tool.

## Diagnosis Process

1. **Reproduce** — Run the exact command (`bun src/index.ts predict --ticker=X`)
2. **Diagnose** — Trace from symptom to root cause
3. **Fix** — Minimal change that addresses root cause
4. **Test** — Verify fix with the original command + edge cases
5. **Scan** — Search for similar anti-patterns in codebase

## Common Bug Categories

### Data Fetching Failures
| Symptom | Likely Cause | Fix Pattern |
|---------|-------------|-------------|
| NSE returns HTML instead of JSON | Cookie expired / anti-bot block | Refresh cookies, verify User-Agent header |
| Upstox 401 error | Token expired | Check `UPSTOX_ACCESS_TOKEN`, guide user to refresh OAuth2 |
| Yahoo Finance throws on `.historical()` | Wrong yahoo-finance2 version | Must use v2.11.0, not v2.14+ |
| Empty price array for ticker | Ticker delisted or invalid format | Validate ticker, check suffix (.NS/.BO) |
| India VIX returns `null` | NSE allIndices endpoint blocked | Fall back to neutral default (15) |

### Indicator Calculation Errors
| Symptom | Likely Cause | Fix Pattern |
|---------|-------------|-------------|
| RSI/MACD returns NaN | Insufficient data (< period) | Check data length ≥ 50 bars before calculation |
| Bollinger bands identical | stdDev parameter wrong | Verify period=20, stdDev=2 |
| Stochastic always 0/100 | High/low arrays swapped | Check parameter order in library call |

### Scoring & Output Bugs
| Symptom | Likely Cause | Fix Pattern |
|---------|-------------|-------------|
| All tickers show HOLD | Weights too low or threshold too high | Check default weights vs optimized config |
| Wrong ₹ formatting | Missing or misplaced toLocaleString | Use `₹${value.toLocaleString('en-IN')}` |
| CSV missing columns | Column order mismatch | Verify headers match data array order |

## Core Rules

1. **Root cause only** — Fix the bug, not a workaround
2. **Minimal changes** — No refactoring during debug
3. **Regression check** — Test other tickers/sources after fix
4. **Similar pattern scan** — Grep for the same anti-pattern
5. **Document the fix** — Symptom, cause, fix, files changed
6. **Never change constants** — Weights/thresholds are tuned; changing them masks bugs
7. **Source isolation** — Test each data source independently when debugging fetch issues
