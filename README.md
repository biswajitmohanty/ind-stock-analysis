# Indian Stock Market Analysis Tool

A TypeScript/Bun CLI tool for technical analysis of NSE/BSE stocks. Generates BUY/SELL/HOLD predictions using 9 technical indicators, 10 chart patterns, weighted scoring, calibrated probabilities, and ATR-based risk management.

Uses a multi-source data fetching architecture with automatic fallback: **Upstox API** → **NSE Direct Scraping** → **Yahoo Finance**.

## Features

- **Technical Indicators**: RSI, Stochastic, Bollinger Bands, Donchian Channels, Williams %R, MACD, SMA, EMA, ATR
- **Chart Pattern Detection**: Ascending/Descending Triangle, Bullish/Bearish Flag, Double Top/Bottom, Rising/Falling Wedge, Head & Shoulders, Island Reversal
- **India VIX Sentiment**: Uses India VIX as a contrarian volatility signal (replaces US Fear & Greed Index)
- **Calibrated Probabilities**: Platt scaling converts raw scores to buy/sell/hold percentages
- **Risk Management**: ATR-based stop loss, take profit, and trailing stop levels
- **Multi-Source Data**: Upstox API, NSE direct scraping, Yahoo Finance with automatic fallback
- **Optimization**: Random search backtester tunes all weights and thresholds
- **Self-Improvement**: Learning loop evaluates past predictions and re-calibrates
- **Portfolio Tracking**: JSON-based portfolio with performance reports
- **Fundamentals**: P/E, Market Cap (Lakh Crore), ROE, Debt/Equity, Book Value
- **Earnings**: Quarterly results, EPS surprises, analyst estimates
- **Dividends**: Yield, payout ratio, dividend history
- **Options Chain**: Full options data from NSE (best source for Indian F&O)
- **News**: Google News India RSS feed
- **Output**: CSV, JSON, Slack notifications, Markdown reports

## Prerequisites

- [Bun](https://bun.sh/) v1.0+ (runtime)
- Node.js v18+ (alternative runtime)

## Installation

```bash
git clone https://github.com/your-username/ind-stock-analysis.git
cd ind-stock-analysis
bun install
```

## Quick Start

```bash
# Run analysis on default Nifty 50 blue chips
bun run start

# Analyze specific tickers
bun src/index.ts predict --ticker=RELIANCE.NS,TCS.NS,INFY.NS

# Output as JSON instead of CSV
bun src/index.ts predict --ticker=RELIANCE.NS --format=json
```

## Data Sources

The tool tries data sources in this order, using the first that succeeds:

| Priority | Source | Auth Required | Best For |
|----------|--------|--------------|----------|
| 1 | **Upstox API** | `UPSTOX_ACCESS_TOKEN` env var | Real-time quotes, reliable historical, F&O with Greeks |
| 2 | **NSE Direct** | None (auto cookie session) | India VIX, options chain (full OI), corporate actions |
| 3 | **Yahoo Finance** | None | Fallback, fundamentals, earnings data |

### Setting Up Upstox (Optional)

Without Upstox, the tool works immediately using NSE scraping + Yahoo Finance. To enable Upstox as the primary source:

1. Create a free account at [upstox.com](https://upstox.com)
2. Go to [Upstox Developer Portal](https://upstox.com/developer/api-documentation/)
3. Create an app and obtain your API key
4. Complete the OAuth2 login flow to get an access token
5. Set the environment variable:

```bash
export UPSTOX_ACCESS_TOKEN=your_access_token_here
```

Or create a `.env` file:

```env
UPSTOX_ACCESS_TOKEN=your_access_token_here
```

## CLI Commands

### predict (default)

Run technical analysis and generate predictions.

```bash
# Default: top 5 Nifty 50 stocks
bun src/index.ts predict

# Custom tickers (use .NS for NSE, .BO for BSE)
bun src/index.ts predict --ticker=RELIANCE.NS,TCS.NS,SBIN.NS

# Sort ascending (lowest score first)
bun src/index.ts predict --ticker=RELIANCE.NS,TCS.NS --sort=asc

# Output as JSON
bun src/index.ts predict --format=json

# Send Slack notifications for BUY/SELL signals
bun src/index.ts predict --slack-webhook=https://hooks.slack.com/services/...
```

#### Fundamental Data

```bash
bun src/index.ts predict --fundamentals --portfolio-ticker=RELIANCE.NS
```

Output includes: P/E Ratio, Dividend Yield, Market Cap (in Crore/Lakh Crore), Book Value, Price/Book, Debt/Equity, ROE, Next Earnings Date.

#### News

```bash
bun src/index.ts predict --news --portfolio-ticker=TCS.NS
```

Fetches 5 recent news articles from Google News India.

#### Earnings

```bash
bun src/index.ts predict --earnings --portfolio-ticker=INFY.NS
```

Shows quarterly EPS history, analyst estimates, earnings surprises, and next earnings date.

#### Dividends

```bash
bun src/index.ts predict --dividends --portfolio-ticker=ITC.NS
```

Shows dividend yield, payout ratio, annual rate, and 3-year dividend history (in INR/share).

#### Options Chain

```bash
bun src/index.ts predict --options --portfolio-ticker=RELIANCE.NS
```

Displays top calls/puts by volume with strike, last price, volume, open interest, and implied volatility. NSE direct scraping provides the best options data for Indian stocks.

### optimize

Tune indicator weights via random search backtesting.

```bash
# Optimize for RELIANCE (default 200 trials)
bun src/index.ts optimize RELIANCE.NS

# Custom trial count
bun src/index.ts optimize TCS.NS --trials=500

# Without exchange suffix (defaults to .NS)
bun src/index.ts optimize RELIANCE
```

The optimizer:
1. Fetches 2 years of historical data
2. Generates random parameter combinations (weights, thresholds, calibration)
3. Backtests each combination with Indian transaction costs (0.15% per trade)
4. Maximizes Sharpe ratio while penalizing drawdown >30%
5. Saves best parameters to `data/config/optimized_weights.json`

### learn

Run the full self-improvement loop.

```bash
bun src/index.ts learn
```

This command:
1. Runs predictions on 8 key Indian tickers (RELIANCE, TCS, INFY, HDFCBANK, ICICIBANK, SBIN, BAJFINANCE, TATAMOTORS)
2. Loads all saved prediction history from `data/feedback/`
3. Matches past predictions with actual price outcomes (5-day forward look)
4. Calculates accuracy metrics (hit rate, precision, recall, F1)
5. Calibrates the probability model (Platt scaling)
6. Optimizes weights on RELIANCE, TCS, HDFCBANK (takes best result)
7. Saves optimized configuration

### Portfolio Management

```bash
# Add a ticker (auto-appends .NS if no suffix)
bun src/index.ts predict --portfolio-action=add --portfolio-ticker=RELIANCE

# Remove a ticker
bun src/index.ts predict --portfolio-action=remove --portfolio-ticker=RELIANCE.NS

# List portfolio
bun src/index.ts predict --portfolio-action=list

# Run analysis on entire portfolio
bun src/index.ts predict --portfolio-action=report
```

Portfolio is stored in `.portfolio.json`.

## How the Scoring Works

### Indicator Signals

Each indicator generates a BUY or SELL signal with a configurable weight:

| Indicator | BUY Signal | SELL Signal | Default Weight |
|-----------|-----------|-------------|---------------|
| RSI | < 30 (oversold) | > 70 (overbought) | 79 |
| Stochastic %K | < 20 | > 80 | 76 |
| Bollinger Bands | Close <= Lower Band | Close >= Upper Band | 78 |
| Donchian Channels | Close <= 20-day Low | Close >= 20-day High | 74 |
| Williams %R | < -80 | > -20 | 72 |
| India VIX | > 20 (high fear) | < 13 (complacency) | 50 |
| MACD Histogram | > 0 | < 0 | 75 |
| SMA 20 | Close > SMA | Close < SMA | 60 |
| EMA 20 | Close > EMA | Close < EMA | 65 |

### Decision Logic

- BUY score >= 200 AND BUY >= SELL → **BUY**
- SELL score >= 200 AND SELL > BUY → **SELL**
- Otherwise → **HOLD**

Pattern scores are added on top (bullish patterns +70 to +75, bearish -70 to -75).

### India VIX as Sentiment

The India VIX replaces the US Fear & Greed Index:

| India VIX | Market Mood | Signal |
|-----------|------------|--------|
| > 20 | High fear / volatility | Contrarian **Bullish** (BUY) |
| 13 - 20 | Normal range | Neutral |
| < 13 | Low fear / complacency | Contrarian **Bearish** (SELL) |

### Risk Management

All risk levels are calculated from ATR (Average True Range):

```
Stop Loss     = Close - ATR * 1.5
Take Profit   = Close + ATR * 3.0  (1:2 risk/reward)
Trailing Start = Close + ATR * 0.5
Trailing Stop  = Close - ATR * 1.2
```

## Output

### CSV (default)

Written to `public/stock_data_YYYYMMDD.csv` with columns:
Date, Ticker, Close, Volume, RSI, StochK, BBLower, BBUpper, DonchLower, DonchUpper, WilliamsR, IndiaVIX, Patterns, Score, Opinion, ATR, StopLoss, TakeProfit, TrailingStop, TrailingStart, MACD, MACDSignal, MACDHistogram, SMA20, EMA20

### JSON

Written to `public/stock_data_YYYYMMDD.json` with all fields including probabilities and confidence.

### Console

```
📊 India VIX: 14.25 [source: nse]
📡 Data sources: nse: 3, yahoo: 2

════════════════════════════════════════════════════════════════════════════════
  INDIAN STOCK MARKET ANALYSIS
════════════════════════════════════════════════════════════════════════════════

🟢 RELIANCE.NS — BUY (Score: 312)
  Close: ₹2,450.75 | Vol: 12,34,567
  RSI: 28.5 | StochK: 18.2 | WillR: -85.3
  MACD: 12.4500 | SMA20: ₹2,480.00 | EMA20: ₹2,475.50
  Buy: 68.5% | Sell: 12.3% | Hold: 19.2% [high]
  SL: ₹2,390.50 | TP: ₹2,570.25
  Patterns: Double Bottom, Falling Wedge

🟡 TCS.NS — HOLD (Score: 145)
  Close: ₹3,890.20 | Vol: 5,67,890
  ...
```

### Slack Notifications

Set `--slack-webhook` to receive notifications for BUY/SELL signals only:

```bash
bun src/index.ts predict --slack-webhook=https://hooks.slack.com/services/T.../B.../xxx
```

## Automation (GitHub Actions)

Two workflows are included:

### Daily Analysis (`.github/workflows/daily-data.yml`)

Runs at **4:00 PM IST** (after NSE closes at 3:30 PM) on weekdays:
- Analyzes default tickers
- Saves CSV output and predictions
- Commits results to the repo

### Weekly Optimization (`.github/workflows/weekly-optimize.yml`)

Runs every **Saturday at 6:00 AM IST**:
- Runs the full learning loop
- Re-calibrates probability model
- Re-optimizes indicator weights
- Commits updated configuration

### Setup

1. Go to your repo **Settings → Secrets and variables → Actions**
2. Add `SLACK_WEBHOOK` secret (optional, for Slack notifications)
3. Add `UPSTOX_ACCESS_TOKEN` secret (optional, for Upstox data source)

## Multi-Agent Orchestration System

The project includes a comprehensive multi-agent AI orchestration system (`.agents/`) inspired by the OMA (Oh-My-Agent) framework, fully adapted for Indian stock market analysis.

### Agent Roster

| Agent | Domain | Specialization |
|-------|--------|----------------|
| **Backend Engineer** | API & Data | Multi-source fetching (Upstox/NSE/Yahoo), service layer |
| **Data Engineer** | Analysis | Technical indicators, chart patterns, scoring, calibration |
| **QA Reviewer** | Quality | Security, data accuracy, performance, code quality |
| **Debug Investigator** | Bug Fixing | Data fetch failures, indicator errors, scoring bugs |
| **PM Planner** | Planning | Requirements analysis, task decomposition |

### Workflows

| Workflow | Purpose |
|----------|---------|
| **orchestrate** | Automated parallel agent execution (max 3 agents) |
| **plan** | Requirements gathering and task decomposition |
| **debug** | Structured 7-step bug diagnosis |
| **review** | Security/accuracy/performance/quality review pipeline |
| **commit** | Conventional Commits with auto-separation by domain |
| **ultrawork** | 5-phase development: PLAN → IMPL → VERIFY → REFINE → SHIP |
| **brainstorm** | Design-first ideation before implementation |
| **exec-plan** | Execution plan lifecycle management |

### Quality System

- **Quality Score** (0-100): 5 dimensions — Correctness (30%), Security (25%), Performance (15%), Coverage (15%), Consistency (15%)
- **Experiment Ledger**: Tracks every change attempt with before/after quality scores
- **Exploration Loop**: Hypothesis-driven alternative testing when standard approaches fail
- **Clarification Debt**: Tracks session quality (clarify +10, correct +25, redo +40)

### Serena Memory System

The `.serena/` directory provides persistent memory for AI assistants:

- **project_overview.md** — Full project description, features, tech stack
- **code_style_and_conventions.md** — TypeScript conventions, INR formatting, error handling
- **suggested_commands.md** — All CLI commands for development and analysis
- **task_completion_checklist.md** — 6-section verification checklist

### Claude Code Skills

Four skill definitions in `.claude/skills/` enable Claude Code to assist with:

- **indian-stock-analysis** — Technical analysis, predictions, scoring engine
- **indian-trading-analysis** — Report generation, portfolio analysis
- **indian-market-data** — Multi-source data fetching (Upstox, NSE, Yahoo)
- **indian-backtesting** — Strategy optimization, self-improvement learning

## Indian Market Adaptations

| Feature | US Version | Indian Version |
|---------|-----------|----------------|
| Tickers | `TSLA`, `AAPL` | `RELIANCE.NS`, `TCS.NS` |
| Sentiment | CNN Fear & Greed Index | India VIX (`^INDIAVIX`) |
| Currency | `$` (USD) | `₹` (INR) |
| Market Cap | Billions | Crore / Lakh Crore |
| News | Google News US | Google News India (`hl=en-IN`) |
| Transaction Costs | None | 0.15% per trade (STT + brokerage) |
| Timezone | Local | Asia/Kolkata (IST) |
| Trading Days | 252/year | ~250/year |
| Circuit Breakers | None modeled | 20% limit awareness |
| Data Sources | Yahoo Finance only | Upstox + NSE + Yahoo Finance |
| Options | Yahoo (sparse for India) | NSE Direct (full OI data) |

## Default Tickers

The tool ships with 20 Nifty 50 blue chips:

RELIANCE, TCS, INFY, HDFCBANK, ICICIBANK, HINDUNILVR, BHARTIARTL, ITC, KOTAKBANK, LT, SBIN, AXISBANK, BAJFINANCE, MARUTI, TATAMOTORS, SUNPHARMA, TITAN, WIPRO, ADANIENT, HCLTECH

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `UPSTOX_ACCESS_TOKEN` | No | Upstox OAuth2 token (enables Upstox as primary data source) |
| `SLACK_WEBHOOK` | No | Slack incoming webhook URL for BUY/SELL notifications |

## Scripts

```bash
bun run start        # Run analysis on default tickers
bun run predict      # Run predict command
bun run optimize     # Run optimizer
bun run learn        # Run learning loop
bun run test         # Run tests
bun run lint         # Lint with Biome
bun run lint:fix     # Auto-fix lint issues
bun run format       # Format with Biome
```

## License

MIT
