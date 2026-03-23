---
name: oma-backend
description: Backend specialist for the Indian stock analysis CLI tool. Handles multi-source data fetching (Upstox, NSE, Yahoo), service layer architecture, CLI commands, and output formatting.
version: 1.0.0
tags: [backend, api, data-fetching, typescript, bun]
---

# OMA Backend — Indian Stock Analysis

Backend specialist for API integration, multi-source data architecture, and service layer implementation.

## Architecture

```
src/index.ts (Commander CLI)
  └── src/commands/
        ├── predict.ts    → Main analysis pipeline
        ├── optimize.ts   → Backtesting optimizer
        └── learn.ts      → Self-improvement loop
              └── src/services/
                    ├── data-fetcher.ts   → Unified multi-source fetcher
                    ├── upstox-api.ts     → Upstox REST API (OAuth2)
                    ├── nse-scraper.ts    → NSE Direct (cookie session)
                    ├── yahoo-finance.ts  → Yahoo Finance (fallback)
                    ├── indicators.ts     → Technical indicator calculation
                    ├── patterns.ts       → Chart pattern detection
                    ├── analysis.ts       → Weighted scoring engine
                    ├── probability.ts    → Platt scaling calibration
                    ├── fundamentals.ts   → P/E, Market Cap (₹ Cr)
                    ├── earnings.ts       → Quarterly EPS data
                    ├── dividends.ts      → Dividend history (₹/share)
                    ├── options.ts        → Options chain (multi-source)
                    └── news.ts           → Google News India RSS
```

## Data Source Priority

| Priority | Source | Auth | Best For |
|----------|--------|------|----------|
| 1 | Upstox API | `UPSTOX_ACCESS_TOKEN` | Real-time, historical, F&O |
| 2 | NSE Direct | Cookie session (auto) | India VIX, options OI |
| 3 | Yahoo Finance | None | Fundamentals, earnings, fallback |

## Core Rules

1. **Fallback chain** — Upstox → NSE → Yahoo. Never hardcode a single source.
2. **Ticker format** — `.NS` (NSE) or `.BO` (BSE). Auto-append `.NS` if no suffix.
3. **Error isolation** — One ticker failure must not crash batch processing.
4. **Type safety** — Explicit return types. `any` only for raw API response parsing.
5. **INR formatting** — `₹` prefix, Lakh Crore for market cap, Indian number notation.
6. **IST timezone** — All dates via Luxon `Asia/Kolkata`.
7. **Async patterns** — `Promise.all` for parallel tickers, sequential for dependent calls.
8. **Cookie lifecycle** — NSE cookies refresh every 4 minutes.
9. **Token handling** — Upstox OAuth2 via env var only. Retry on 429 with backoff.
10. **Import style** — Use relative imports within `src/`. No `@/` alias configured.

## Stack

- **Runtime**: Bun / Node.js
- **Language**: TypeScript (ESNext)
- **CLI**: Commander
- **HTTP**: Axios (Upstox/NSE), yahoo-finance2@2.11.0
- **Dates**: Luxon
- **Logging**: Pino
- **Linting**: Biome
