# Project Overview

## Indian Stock Market Analysis Tool

A TypeScript/Bun CLI tool for technical analysis of NSE/BSE stocks. Generates BUY/SELL/HOLD predictions using 9 technical indicators, 10 chart patterns, weighted scoring, calibrated probabilities, and ATR-based risk management.

## Key Features

- Multi-source data fetching: Upstox API → NSE Direct Scraping → Yahoo Finance
- 9 technical indicators (RSI, MACD, Stochastic, Bollinger, Donchian, Williams %R, SMA, EMA, ATR)
- 10 chart pattern detectors (5 bullish, 5 bearish)
- India VIX as contrarian sentiment indicator
- Platt scaling probability calibration
- ATR-based risk management (stop loss, take profit, trailing stop)
- Random search backtesting optimizer with Indian transaction costs (0.15%)
- Self-improvement learning loop (predict → evaluate → calibrate → optimize)
- Portfolio management (JSON-based CRUD)
- Fundamental data (P/E, Market Cap in Lakh Crore, ROE, Debt/Equity)
- Quarterly earnings, dividend history, options chains
- Google News India RSS integration
- Output: CSV, JSON, Slack notifications, Markdown reports

## Tech Stack

- **Language**: TypeScript (ESNext target)
- **Runtime**: Bun / Node.js
- **CLI**: Commander
- **Data**: yahoo-finance2@2.11.0, Axios (Upstox/NSE)
- **Analysis**: technicalindicators
- **Dates**: Luxon
- **Logging**: Pino
- **Linting**: Biome
- **Utilities**: es-toolkit, csv-parse

## Project Structure

```
src/
  index.ts                  ← CLI entry point (Commander)
  constants.ts              ← Weights, thresholds, Indian market defaults
  types/index.ts            ← All TypeScript interfaces
  services/                 ← Data fetching, indicators, analysis
  commands/                 ← predict, optimize, learn
  optimization/             ← Backtester, optimizer, calibrator
  portfolio/                ← Portfolio management
  reports/                  ← Markdown report generator
  utils/                    ← CSV, JSON, Slack output

data/config/                ← Optimized weights
data/feedback/              ← Prediction history
public/                     ← Output files (CSV, JSON)
.agents/                    ← Multi-agent orchestration system
.serena/                    ← Persistent memory system
.claude/skills/             ← Claude Code skill definitions
```

## Indian Market Specifics

- Currency: ₹ (INR) with Lakh Crore notation for market cap
- Timezone: IST (Asia/Kolkata), market hours 9:15 AM - 3:30 PM
- Sentiment: India VIX (not US Fear & Greed Index)
- Transaction costs: 0.15% per trade (STT + brokerage + stamp duty)
- Default tickers: 20 Nifty 50 blue chips
- Data sources: Upstox (Indian broker API) + NSE Direct + Yahoo Finance
