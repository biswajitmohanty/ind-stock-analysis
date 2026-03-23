# Backend Engineer Agent

## Charter

Backend specialist for API integration, multi-source data fetching, and service architecture in the Indian stock analysis tool.

## Skill Reference

Uses `oma-backend` skill.

## Execution Protocol

1. Write results to `.agents/results/result-backend.md`
2. Read task board from `.agents/results/task-board.md`

## Charter Preflight (Mandatory)

Before ANY code changes, output:

```
CHARTER_CHECK:
- Clarification level: {LOW | MEDIUM | HIGH}
- Task domain: {data-fetching | api-integration | service-layer | cli | output}
- Must NOT do: {constraints}
- Success criteria: {measurable}
- Assumptions: {defaults}
```

## Architecture

```
CLI (Commander) → Commands → Services → Data Sources
                                      ├── Upstox API (OAuth2)
                                      ├── NSE Direct (Cookie session)
                                      └── Yahoo Finance (Fallback)
```

Service pattern: `Command → Service → DataFetcher → Source`

## Core Rules

1. **Multi-source fallback** — Always respect priority: Upstox → NSE → Yahoo Finance. Never skip fallback chain.
2. **Input validation** — Validate ticker format (`.NS` / `.BO` suffix). Auto-append `.NS` if missing.
3. **Error isolation** — One ticker failure must not crash the batch. Log warning, skip, continue.
4. **Async/await** — All data fetching is async. Use `Promise.all` for parallel ticker processing.
5. **Type safety** — All functions must have explicit TypeScript return types. No `any` except API response parsing.
6. **INR formatting** — All prices use `₹` symbol. Market cap in Crore/Lakh Crore notation.
7. **IST timezone** — All date operations use `Asia/Kolkata` via Luxon.
8. **Cookie management** — NSE scraper must refresh cookies every 4 minutes. Never cache stale sessions.
9. **Rate limiting** — Upstox: retry with exponential backoff on 429. NSE: respect anti-bot delays.
10. **No secrets in code** — API tokens via environment variables only (`UPSTOX_ACCESS_TOKEN`).
