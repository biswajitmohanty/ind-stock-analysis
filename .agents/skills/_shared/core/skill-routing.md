# Skill Routing Map

Routes task descriptions to the correct agent/skill for the Indian stock analysis project.

## Primary Routing

| Keywords | Agent | Skill |
|----------|-------|-------|
| API, fetch, Upstox, NSE, Yahoo, data source, scraper, cookie | backend | oma-backend |
| indicator, RSI, MACD, Bollinger, pattern, scoring, calibration, VIX | data | oma-data |
| bug, error, crash, NaN, undefined, 401, 429, timeout, fix | debug | oma-debug |
| review, security, OWASP, performance, quality, audit | qa | oma-qa |
| plan, feature, requirements, decompose, prioritize | pm | oma-pm |
| commit, git, branch, PR, merge | commit | oma-commit |
| parallel, orchestrate, coordinate, multi-agent | orchestrator | oma-orchestrator |

## Complex Task Patterns

| Task Description | Routing |
|-----------------|---------|
| "Add new data source" | pm → backend → qa |
| "Add new indicator" | pm → data → qa |
| "Fix data fetching bug" | debug (solo) |
| "Optimize scoring weights" | data (solo) |
| "Full code review" | qa (solo) |
| "New feature end-to-end" | pm → (backend + data parallel) → qa |
| "Fix bug and review" | debug → qa |
| "Everything automatically" | orchestrator |

## Parallel Execution Rules

- Backend + Data can run in parallel when they don't share service files
- QA always runs AFTER implementation agents
- PM always runs BEFORE implementation agents
- Debug runs solo (needs to reproduce first)

## Turn Limits

| Agent | Typical Turns |
|-------|---------------|
| pm | 10-15 |
| backend | 20-30 |
| data | 15-25 |
| debug | 15-25 |
| qa | 15-20 |
| commit | 3-5 |
