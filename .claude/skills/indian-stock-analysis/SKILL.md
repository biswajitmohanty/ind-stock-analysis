---
name: indian-stock-analysis
description: Analyze Indian NSE/BSE stocks using technical indicators, chart patterns, and multi-source data (Upstox, NSE Direct, Yahoo Finance). Generates BUY/SELL/HOLD predictions with calibrated probabilities, risk management levels, and India VIX sentiment. Use for stock analysis, portfolio tracking, fundamentals, earnings, dividends, options, or news for Indian stocks.
version: 1.0.0
author: ind-stock-analysis
tags: [indian-stocks, nse, bse, technical-analysis, trading, nifty50]
---

# Indian Stock Analysis (v1.0)

Analyze NSE/BSE stocks using 9 technical indicators, 10 chart patterns, weighted scoring, calibrated probabilities, and ATR-based risk management. Uses multi-source data fetching: Upstox API → NSE Direct Scraping → Yahoo Finance.

## Quick Start

**IMPORTANT:** Tickers must use Yahoo Finance format with exchange suffix (`.NS` for NSE, `.BO` for BSE). If no suffix is provided, `.NS` is appended automatically.

Analyze stocks:

```bash
bun src/index.ts predict --ticker=RELIANCE.NS
bun src/index.ts predict --ticker=TCS.NS,INFY.NS,HDFCBANK.NS
```

Default analysis (top 5 Nifty 50 stocks):

```bash
bun src/index.ts predict
```

## Commands

### predict (default)

Run technical analysis and generate BUY/SELL/HOLD predictions.

```bash
# Analyze specific tickers
bun src/index.ts predict --ticker=RELIANCE.NS,TCS.NS,SBIN.NS

# Sort by score ascending
bun src/index.ts predict --ticker=RELIANCE.NS,TCS.NS --sort=asc

# Output as JSON
bun src/index.ts predict --format=json

# Send Slack notifications for BUY/SELL signals
bun src/index.ts predict --slack-webhook=https://hooks.slack.com/services/...
```

### Fundamental Data

```bash
bun src/index.ts predict --fundamentals --portfolio-ticker=RELIANCE.NS
```

Output: P/E Ratio, Dividend Yield, Market Cap (Crore/Lakh Crore), Book Value, Price/Book, Debt/Equity, ROE, Next Earnings Date.

### News

```bash
bun src/index.ts predict --news --portfolio-ticker=TCS.NS
```

Fetches 5 recent articles from Google News India.

### Earnings

```bash
bun src/index.ts predict --earnings --portfolio-ticker=INFY.NS
```

Shows quarterly EPS history, analyst estimates, earnings surprises.

### Dividends

```bash
bun src/index.ts predict --dividends --portfolio-ticker=ITC.NS
```

Shows dividend yield, payout ratio, annual rate, 3-year history (₹/share).

### Options Chain

```bash
bun src/index.ts predict --options --portfolio-ticker=RELIANCE.NS
```

Displays calls/puts with strike, last price, volume, open interest, IV. NSE Direct scraping provides the best options data for Indian F&O.

## Analysis Components

The scoring engine evaluates 9 indicators with configurable weights:

| Indicator | BUY Signal | SELL Signal | Default Weight |
|-----------|-----------|-------------|---------------|
| RSI (14) | < 30 (oversold) | > 70 (overbought) | 79 |
| Stochastic %K (14,3) | < 20 | > 80 | 76 |
| Bollinger Bands (20,2) | Close ≤ Lower Band | Close ≥ Upper Band | 78 |
| Donchian Channels (20) | Close ≤ 20-day Low | Close ≥ 20-day High | 74 |
| Williams %R (14) | < -80 | > -20 | 72 |
| India VIX | > 20 (high fear) | < 13 (complacency) | 50 |
| MACD Histogram (12,26,9) | > 0 | < 0 | 75 |
| SMA 20 | Close > SMA | Close < SMA | 60 |
| EMA 20 | Close > EMA | Close < EMA | 65 |

### Decision Logic

- BUY score ≥ 200 AND BUY ≥ SELL → **BUY**
- SELL score ≥ 200 AND SELL > BUY → **SELL**
- Otherwise → **HOLD**

Pattern scores are added on top (bullish +70 to +75, bearish -70 to -75).

### Chart Patterns Detected

**Bullish:** Ascending Triangle, Bullish Flag, Double Bottom, Falling Wedge, Island Reversal
**Bearish:** Descending Triangle, Bearish Flag, Double Top, Rising Wedge, Head & Shoulders

### India VIX Sentiment

| India VIX | Market Mood | Signal |
|-----------|------------|--------|
| > 20 | High fear / volatility | Contrarian **Bullish** (BUY weight) |
| 13 - 20 | Normal range | Neutral |
| < 13 | Low fear / complacency | Contrarian **Bearish** (SELL weight) |

### Probability Calibration

Raw scores are converted to calibrated probabilities using Platt Scaling:

```
P(buy) = 1 / (1 + exp(-(slope × buyScore + intercept)))
```

Confidence levels: very-high (≥75%), high (≥60%), medium (≥40%), low (<40%).

### Risk Management

ATR-based levels computed for every signal:

```
Stop Loss      = Close - ATR × 1.5
Take Profit    = Close + ATR × 3.0  (1:2 risk/reward)
Trailing Start = Close + ATR × 0.5
Trailing Stop  = Close - ATR × 1.2
```

## Data Sources

The tool tries sources in priority order, using the first that succeeds:

| Priority | Source | Auth | Best For |
|----------|--------|------|----------|
| 1 | Upstox API | `UPSTOX_ACCESS_TOKEN` env var | Real-time, reliable historical, F&O Greeks |
| 2 | NSE Direct | None (auto cookies) | India VIX, options chain (full OI), corp actions |
| 3 | Yahoo Finance | None | Fallback, fundamentals, earnings |

The console shows which source was used: `📡 Data sources: nse: 3, yahoo: 2`

## Portfolio Management

```bash
# Add ticker (auto-appends .NS if no suffix)
bun src/index.ts predict --portfolio-action=add --portfolio-ticker=RELIANCE

# Remove ticker
bun src/index.ts predict --portfolio-action=remove --portfolio-ticker=RELIANCE.NS

# List portfolio
bun src/index.ts predict --portfolio-action=list

# Analyze entire portfolio
bun src/index.ts predict --portfolio-action=report
```

Portfolio stored in `.portfolio.json`.

## Output Formats

### CSV (default)

Written to `public/stock_data_YYYYMMDD.csv`:
Date, Ticker, Close, Volume, RSI, StochK, BBLower, BBUpper, DonchLower, DonchUpper, WilliamsR, IndiaVIX, Patterns, Score, Opinion, ATR, StopLoss, TakeProfit, TrailingStop, TrailingStart, MACD, MACDSignal, MACDHistogram, SMA20, EMA20

### JSON

Written to `public/stock_data_YYYYMMDD.json` with all fields including probabilities.

### Slack

Sends notifications for BUY/SELL signals only (not HOLD).

## Ticker Format

- **NSE stocks:** RELIANCE.NS, TCS.NS, INFY.NS, SBIN.NS
- **BSE stocks:** RELIANCE.BO, TCS.BO
- **Indices:** ^NSEI (Nifty 50), ^BSESN (Sensex), ^INDIAVIX (India VIX)

## Default Tickers (Nifty 50 Blue Chips)

RELIANCE, TCS, INFY, HDFCBANK, ICICIBANK, HINDUNILVR, BHARTIARTL, ITC, KOTAKBANK, LT, SBIN, AXISBANK, BAJFINANCE, MARUTI, TATAMOTORS, SUNPHARMA, TITAN, WIPRO, ADANIENT, HCLTECH

## Limitations

- NSE scraping may be blocked occasionally (anti-bot protection) — falls back to Yahoo Finance
- Yahoo Finance options data is sparse for Indian stocks — use NSE Direct or Upstox
- Indian earnings data on Yahoo Finance is less complete than US data
- Upstox requires OAuth2 token refresh (tokens expire)
- Historical data for recently listed IPOs may be insufficient for backtesting (need ≥200 bars)
- All prices are in INR (₹) — no multi-currency support

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `UPSTOX_ACCESS_TOKEN` | No | Upstox OAuth2 token for primary data source |
| `SLACK_WEBHOOK` | No | Slack webhook URL for BUY/SELL notifications |

## Error Handling

- Invalid tickers → logged warning, ticker skipped
- NSE anti-bot block → automatic fallback to Yahoo Finance
- Upstox token expired → automatic fallback to NSE/Yahoo
- Insufficient data (< 50 bars) → ticker skipped with warning
- All data sources fail → empty result with error log
