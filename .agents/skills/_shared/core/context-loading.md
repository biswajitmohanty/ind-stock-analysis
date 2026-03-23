# Context Loading Guide

Minimize context window waste by loading resources progressively.

## Loading Priority

### Always Load (Auto)
- `SKILL.md` — Agent's primary skill file
- `execution-protocol.md` — How to report results (if exists)

### Load at Task Start
- `difficulty-guide.md` — Assess task complexity

### Load by Difficulty

| Difficulty | Additional Resources |
|-----------|---------------------|
| Simple (1-2 files changed) | None extra |
| Medium (3-5 files changed) | `reasoning-templates.md` |
| Complex (6+ files changed) | `reasoning-templates.md` + `clarification-protocol.md` |

### Load During Execution (On Demand)
- `quality-score.md` — At VERIFY phase
- `experiment-ledger.md` — When first experiment starts
- `exploration-loop.md` — When verification fails 2x on same issue

## Indian Stock Analysis Context

When working on this project, agents should be aware of:

### Key Files by Domain

**Data Fetching**: `src/services/data-fetcher.ts`, `upstox-api.ts`, `nse-scraper.ts`, `yahoo-finance.ts`
**Analysis**: `src/services/indicators.ts`, `patterns.ts`, `analysis.ts`, `probability.ts`
**Commands**: `src/commands/predict.ts`, `optimize.ts`, `learn.ts`
**Optimization**: `src/optimization/optimizer.ts`, `backtester.ts`, `calibrator.ts`
**Output**: `src/utils/csv-writer.ts`, `json-exporter.ts`, `slack.ts`
**Types**: `src/types/index.ts`
**Constants**: `src/constants.ts`

### Never Read Entire Files
- Use symbol queries for large files
- Read specific line ranges when possible
- Track what you've already read to avoid duplicates

## Context Budget

| Model Tier | Resource Budget | Working Budget |
|-----------|----------------|----------------|
| Flash | ~3,100 tokens | ~125K tokens |
| Pro/Opus | ~5,000 tokens | ~1M tokens |
