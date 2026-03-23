---
name: oma-data
description: Data engineering specialist for Indian stock technical analysis. Handles indicator calculation, chart pattern detection, weighted scoring, probability calibration, backtesting, and optimization.
version: 1.0.0
tags: [technical-analysis, indicators, patterns, scoring, backtesting, indian-market]
---

# OMA Data — Indian Market Analysis Engine

Specialist for technical indicator computation, chart pattern recognition, scoring engine, and backtesting optimization for NSE/BSE stocks.

## Indicator Suite (9 Indicators)

| Indicator | BUY Signal | SELL Signal | Default Weight |
|-----------|-----------|-------------|----------------|
| RSI (14) | < 30 | > 70 | 79 |
| Stochastic %K (14,3) | < 20 | > 80 | 76 |
| Bollinger Bands (20,2) | Close ≤ Lower | Close ≥ Upper | 78 |
| Donchian Channels (20) | Close ≤ Low | Close ≥ High | 74 |
| Williams %R (14) | < -80 | > -20 | 72 |
| India VIX | > 20 | < 13 | 50 |
| MACD Histogram (12,26,9) | > 0 | < 0 | 75 |
| SMA 20 | Close > SMA | Close < SMA | 60 |
| EMA 20 | Close > EMA | Close < EMA | 65 |

## Chart Patterns (10)

**Bullish** (+70 to +75 score): Ascending Triangle, Bullish Flag, Double Bottom, Falling Wedge, Island Reversal
**Bearish** (-70 to -75 score): Descending Triangle, Bearish Flag, Double Top, Rising Wedge, Head & Shoulders

## Scoring Engine

```
IF buyScore ≥ 200 AND buyScore ≥ sellScore → BUY
IF sellScore ≥ 200 AND sellScore > buyScore → SELL
ELSE → HOLD
```

## Probability Calibration (Platt Scaling)

```
P(buy) = 1 / (1 + exp(-(slope × buyScore + intercept)))
```

Confidence: very-high (≥75%), high (≥60%), medium (≥40%), low (<40%)

Default calibration: slope = 0.01, intercept = -1.5

## Risk Management (ATR-based)

```
Stop Loss      = Close - ATR × 1.5
Take Profit    = Close + ATR × 3.0  (1:2 risk/reward)
Trailing Start = Close + ATR × 0.5
Trailing Stop  = Close - ATR × 1.2
```

## Backtesting

- **Direction**: Long-only, sequential (one position at a time)
- **Transaction cost**: 0.15% per trade (STT + brokerage + stamp duty)
- **Starting capital**: ₹10,000 notional
- **Annualization**: √252 (Indian trading days)
- **Objective**: `sharpeRatio × 0.7 - (maxDrawdown / 100) × 0.3`
- **Reject if**: maxDrawdown > 30%

## Optimization (Random Search)

| Parameter | Range |
|-----------|-------|
| Indicator weights | 50-100 |
| India VIX weight | 30-80 |
| SMA/EMA weights | 40-80 |
| Pattern weights | 50-100 |
| Buy threshold | 150-250 |
| Sell threshold | 150-250 |
| Calibration slope | 0.005-0.02 |
| Calibration intercept | -2.0 to 0.0 |

## Key Files

| File | Purpose |
|------|---------|
| `src/services/indicators.ts` | 9 indicator calculations |
| `src/services/patterns.ts` | 10 pattern detectors |
| `src/services/analysis.ts` | Weighted scoring engine |
| `src/services/probability.ts` | Platt scaling calibration |
| `src/optimization/optimizer.ts` | Random search optimizer |
| `src/optimization/backtester.ts` | Trade simulator |
| `src/optimization/calibrator.ts` | Brier score minimization |
| `src/optimization/evaluator.ts` | Prediction accuracy metrics |
| `data/config/optimized_weights.json` | Persisted optimization results |
