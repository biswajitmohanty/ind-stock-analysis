---
name: indian-market-data
description: Fetch real-time and historical market data for Indian NSE/BSE stocks using multi-source architecture (Upstox API, NSE Direct Scraping, Yahoo Finance). Get prices, quotes, fundamentals, earnings, dividends, options chains, India VIX, and news. No API key required for basic usage.
version: 1.0.0
author: ind-stock-analysis
tags: [market-data, nse, bse, upstox, yahoo-finance, india-vix]
---

# Indian Market Data Fetcher

Provides comprehensive market data access for Indian NSE/BSE stocks using a multi-source architecture with automatic fallback.

## Overview

This skill fetches:
- Real-time and historical OHLCV price data (up to 2 years)
- India VIX (volatility index) for market sentiment
- Nifty 50 index price for benchmarking
- Fundamental data (P/E, Market Cap, ROE, Debt/Equity)
- Quarterly earnings history and analyst estimates
- Dividend history (₹/share) and yield
- Full options chains with OI and IV (best from NSE Direct)
- Financial news from Google News India

## Data Sources

### Source 1: Upstox API (Priority)

**Auth:** Requires `UPSTOX_ACCESS_TOKEN` environment variable.
**Best for:** Real-time quotes, reliable historical data, F&O with Greeks.

```
API Base: https://api.upstox.com/v2
Instrument Key Format: NSE_EQ|RELIANCE (for NSE), BSE_EQ|RELIANCE (for BSE)

Endpoints:
  GET /v2/market-quote/quotes         → Live quotes
  GET /v2/historical-candle/:key/:interval/:to/:from → Historical OHLCV
  GET /v2/option/chain                → Options chain with Greeks
  GET /v2/market-quote/ohlc           → OHLC data
```

Rate limit: Retry with exponential backoff on 429 responses.

### Source 2: NSE Direct Scraping (Free, No Key)

**Auth:** None — uses automated cookie-based session management.
**Best for:** India VIX (most accurate), options chain (full OI data), corporate actions.

```
Base URL: https://www.nseindia.com

Anti-Bot Protocol:
  1. GET / (homepage) → extract session cookies (bm_sv, nsit, nseappid)
  2. Use cookies in subsequent API calls
  3. Cookies expire ~5 minutes → auto-refresh
  4. Required headers: User-Agent, Referer, Accept

Endpoints:
  GET /api/quote-equity?symbol=RELIANCE           → Live quote + fundamentals
  GET /api/historical/cm/equity?symbol=X&from=&to= → Historical OHLCV
  GET /api/option-chain-equities?symbol=RELIANCE   → Options chain (full OI)
  GET /api/corporateActions?index=equities&symbol=X → Dividends, splits, bonuses
  GET /api/allIndices                              → India VIX + Nifty 50
```

**Note:** NSE may block automated access occasionally. The tool falls back to Yahoo Finance automatically.

### Source 3: Yahoo Finance (Fallback)

**Auth:** None — no API key required.
**Best for:** Fundamentals, earnings data, always-available fallback.

```
Package: yahoo-finance2 (v2.11.0)

Methods:
  yahooFinance.historical(symbol, options)   → Historical OHLCV
  yahooFinance.quote(symbol)                 → Live quote
  yahooFinance.quoteSummary(symbol, modules) → Fundamentals, earnings
  yahooFinance.options(symbol, options)       → Options chain (sparse for India)
```

## Ticker Format

| Market | Format | Example |
|--------|--------|---------|
| NSE stocks | `SYMBOL.NS` | `RELIANCE.NS`, `TCS.NS` |
| BSE stocks | `SYMBOL.BO` | `RELIANCE.BO`, `TCS.BO` |
| Nifty 50 index | `^NSEI` | — |
| Sensex index | `^BSESN` | — |
| India VIX | `^INDIAVIX` | — |

## Usage Examples

### Historical Prices

```bash
# Default: 1 year of daily OHLCV
bun src/index.ts predict --ticker=RELIANCE.NS

# Multiple tickers (parallel fetching)
bun src/index.ts predict --ticker=RELIANCE.NS,TCS.NS,INFY.NS
```

### Fundamentals

```bash
bun src/index.ts predict --fundamentals --portfolio-ticker=RELIANCE.NS
```

Returns: P/E Ratio, Dividend Yield, Market Cap (₹ Cr / L Cr), Book Value, Price/Book, Debt/Equity, ROE, Next Earnings Date.

### Earnings

```bash
bun src/index.ts predict --earnings --portfolio-ticker=INFY.NS
```

Returns: Quarterly EPS history with actuals vs estimates, surprise %, next earnings date, analyst estimates.

### Dividends

```bash
bun src/index.ts predict --dividends --portfolio-ticker=ITC.NS
```

Returns: Yield, payout ratio, annual rate (₹/share), last 3 years dividend history.

### Options Chain

```bash
bun src/index.ts predict --options --portfolio-ticker=RELIANCE.NS
```

Returns: Expiry dates, strikes, top calls/puts by volume with strike, LTP, volume, OI, IV.

**Note:** NSE Direct provides the best options data for Indian stocks (full open interest, change in OI). Yahoo Finance options data is sparse for `.NS` tickers.

### News

```bash
bun src/index.ts predict --news --portfolio-ticker=TCS.NS
```

Returns: 5 recent news articles from Google News India RSS (`hl=en-IN&gl=IN`).

### India VIX

Fetched automatically with every prediction run. Displayed as:

```
📊 India VIX: 14.25 [source: nse]
```

## Data Flow

```
User Request
    │
    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│  Upstox API │ ──▶ │ NSE Direct  │ ──▶ │ Yahoo Finance   │
│  (if token) │     │ (scraping)  │     │   (fallback)    │
└─────────────┘     └─────────────┘     └─────────────────┘
    │                     │                     │
    └─────────────────────┴─────────────────────┘
                          │
                          ▼
              ┌───────────────────┐
              │  Unified Result   │
              │  (HistoricalPrice │
              │   + DataSource)   │
              └───────────────────┘
```

## Caching & Rate Limits

- **NSE cookies:** Auto-refreshed every 4 minutes
- **Upstox:** Retry with 2s/4s backoff on 429 (rate limit)
- **Yahoo Finance:** No explicit rate limiting, but may throttle on heavy use
- **News (Google RSS):** Retry up to 3 times with 1s/2s/3s backoff

## Error Handling

All data fetchers return gracefully on failure:

- **Historical prices:** Returns empty array `[]` — ticker is skipped
- **India VIX:** Returns neutral default `15` — analysis proceeds normally
- **Fundamentals/Earnings/Dividends:** Returns null fields — displays "N/A"
- **Options:** Returns `null` — displays "No options data available"
- **News:** Returns empty array — displays "No recent news"

Source failures are logged with `pino` structured logging and the next source is tried automatically.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `UPSTOX_ACCESS_TOKEN` | No | Upstox OAuth2 access token (enables Upstox as primary source) |

Without `UPSTOX_ACCESS_TOKEN`, the tool works immediately using NSE Direct + Yahoo Finance.
