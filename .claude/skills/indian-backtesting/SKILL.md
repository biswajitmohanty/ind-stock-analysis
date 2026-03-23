---
name: indian-backtesting
description: |
  Backtest trading strategies on Indian NSE/BSE stocks with India-specific transaction costs (STT, brokerage, stamp duty).
  Optimizes indicator weights and thresholds via random search. Includes self-improvement learning loop that
  evaluates past predictions, calibrates probabilities, and re-optimizes parameters.
  Trigger with: "backtest", "optimize", "learn", "test strategy", "tune parameters", "historical performance".
version: 1.0.0
author: ind-stock-analysis
tags: [backtesting, optimization, indian-stocks, nse, trading-strategy]
---

# Indian Stock Backtesting & Optimization

Validate and optimize trading strategies on Indian NSE/BSE stocks before risking real capital. Includes India-specific transaction costs and a self-improvement learning loop.

## Overview

**Key Features:**
- Random search optimizer tunes 9 indicator weights + 5 pattern weights + 2 thresholds + 2 calibration params
- Backtester simulates trades with Indian transaction costs (STT + brokerage + stamp duty = 0.15% per trade)
- Objective function maximizes Sharpe ratio while penalizing drawdown > 30%
- Learning loop: predict → evaluate accuracy → calibrate probabilities → optimize weights
- Uses multi-source data fetching (Upstox → NSE → Yahoo Finance)
- Annualized Sharpe ratio uses √252 (Indian trading days)

## Commands

### Optimize

Find optimal indicator weights for a specific Indian stock:

```bash
# Default: 200 trials on RELIANCE.NS
bun src/index.ts optimize RELIANCE.NS

# Custom trial count
bun src/index.ts optimize TCS.NS --trials=500

# Without exchange suffix (defaults to .NS)
bun src/index.ts optimize HDFCBANK
```

**What it does:**
1. Fetches 2 years (730 days) of historical OHLCV data
2. Generates 200 random parameter combinations
3. For each combination, runs the full backtester:
   - Computes all 9 indicators on a rolling window
   - Detects 10 chart patterns
   - Generates BUY/SELL/HOLD signals using weighted scoring
   - Simulates long-only sequential trades
   - Deducts 0.15% transaction cost per trade (buy + sell)
4. Selects the parameters that maximize: `Sharpe × 0.7 - (Drawdown/100) × 0.3`
5. Discards any result with max drawdown > 30%
6. Saves best parameters to `data/config/optimized_weights.json`

### Learn

Run the full self-improvement loop:

```bash
bun src/index.ts learn
```

**Steps:**
1. **Predict** — runs predictions on 8 key Indian tickers (RELIANCE, TCS, INFY, HDFCBANK, ICICIBANK, SBIN, BAJFINANCE, TATAMOTORS)
2. **Load History** — reads all saved predictions from `data/feedback/predictions_*.json`
3. **Match Outcomes** — finds price 5+ days forward for each prediction:
   - BUY correct if price rose ≥ 2%
   - SELL correct if price fell ≥ 2%
   - HOLD correct if price stayed within ±2%
4. **Calculate Metrics** — hit rate, precision, recall, F1 score
5. **Calibrate** — fits Platt scaling sigmoid (4×5 grid search minimizing Brier score)
6. **Optimize** — runs backtester on RELIANCE, TCS, HDFCBANK (100 trials each), takes best
7. **Save** — writes optimized config to `data/config/optimized_weights.json`

## Parameter Space

Random search ranges for each trial:

| Parameter | Range | Type |
|-----------|-------|------|
| Indicator weights (RSI, Stoch, BB, etc.) | 50 - 100 | Float |
| India VIX weight | 30 - 80 | Float |
| SMA/EMA weights | 40 - 80 | Float |
| Pattern weights (5 bullish) | 50 - 100 | Float |
| Buy threshold | 150 - 250 | Integer |
| Sell threshold | 150 - 250 | Integer |
| Calibration slope | 0.005 - 0.02 | Float |
| Calibration intercept | -2.0 - 0.0 | Float |

Bearish pattern weights are automatically set as negatives of their bullish counterparts.

## Backtester Details

### Signal Generation

For each bar (starting at bar 50):
1. Compute all 9 indicators on the price history up to that bar
2. Detect all 10 chart patterns
3. Apply weighted scoring with trial parameters
4. Generate BUY/SELL/HOLD based on trial thresholds

### Trade Simulation

- **Direction:** Long-only, sequential (one position at a time)
- **Entry:** BUY signal opens position (deduct 0.15% buy cost)
- **Exit:** SELL signal closes position (deduct 0.15% sell cost)
- **End-of-data:** Open position is force-closed at last price
- **Starting capital:** ₹10,000 notional

### Indian Transaction Costs

```
Per trade cost = 0.15% (total for one side)

Breakdown:
  Securities Transaction Tax (STT): ~0.05% (delivery)
  Brokerage: ~0.03-0.05%
  Stamp Duty: ~0.015%
  Exchange fees: ~0.003%
  GST on brokerage: ~0.008%
```

### Performance Metrics

| Metric | Formula |
|--------|---------|
| Sharpe Ratio | (mean daily return / std daily return) × √252 |
| Max Drawdown | max((peak - trough) / peak) × 100% |
| Win Rate | winning trades / total trades × 100% |
| Profit Factor | sum(winning %) / sum(losing %) |
| Total Return | (final equity - 10000) / 10000 × 100% |

### Objective Function

```
if maxDrawdown > 30%:
    value = -Infinity  (discard)
else:
    value = sharpeRatio × 0.7 - (maxDrawdown / 100) × 0.3
```

## Output

### Optimization Results

```
═══════════════════════════════════════════════════════════════
  OPTIMIZATION RESULTS
═══════════════════════════════════════════════════════════════
  Symbol: RELIANCE.NS
  Strategy: random-search
  Trials: 200
  Best Value: 4.523

  Metrics:
    Sharpe Ratio: 7.09
    Max Drawdown: 20.3%
    Win Rate: 62.5%
    Total Trades: 16
    Profit Factor: 2.34
    Return: 48.2%

  Optimized Weights:
    RSI: 93.1 | Stoch: 64.8 | BB: 52.9
    Donch: 87.5 | WillR: 68.2 | VIX: 45.3
    MACD: 89.0 | SMA: 55.7 | EMA: 72.1
    Buy Threshold: 195
    Sell Threshold: 212
═══════════════════════════════════════════════════════════════
```

### Saved Configuration

`data/config/optimized_weights.json`:

```json
{
  "version": 1,
  "updatedAt": "2026-03-23T10:30:00.000Z",
  "symbol": "RELIANCE.NS",
  "indicatorWeights": { "rsi": 93.1, "stochastic": 64.8, ... },
  "patternWeights": { "ascendingTriangle": 75, ... },
  "thresholds": { "buy": 195, "sell": 212 },
  "calibration": { "slope": 0.0103, "intercept": -1.935 },
  "metrics": { "sharpeRatio": 7.09, "maxDrawdown": 20.3, ... }
}
```

## Files

| File | Purpose |
|------|---------|
| `src/optimization/optimizer.ts` | Random search parameter optimizer |
| `src/optimization/backtester.ts` | Trade simulator with Indian tx costs |
| `src/optimization/calibrator.ts` | Platt scaling (Brier score minimization) |
| `src/optimization/data-loader.ts` | Historical data loader (multi-source) |
| `src/optimization/evaluator.ts` | Prediction accuracy metrics |
| `src/optimization/types.ts` | OptimizationParams, BacktestMetrics interfaces |
| `src/commands/optimize.ts` | CLI optimize command |
| `src/commands/learn.ts` | CLI learn command (full loop) |
| `data/config/optimized_weights.json` | Persisted optimization results |
| `data/feedback/predictions_*.json` | Daily prediction history for learning |

## Tips

- Run `optimize` on multiple tickers and use the best result
- Run `learn` weekly (automated via `.github/workflows/weekly-optimize.yml`)
- More trials = better results but slower (200 is a good default, 500 for thorough search)
- Newly listed stocks (IPOs < 2 years) may have insufficient data (need ≥ 200 bars)
- Re-optimize periodically as market regimes change
