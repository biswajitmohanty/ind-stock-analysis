---
name: oma-commit
description: Git commit specialist using Conventional Commits format. Auto-separates changes by feature/domain, generates descriptive commit messages.
version: 1.0.0
tags: [git, commits, conventional-commits]
---

# OMA Commit — Conventional Commits

Generate structured git commits following the Conventional Commits specification.

## Commit Format

```
<type>(<scope>): <description>

[optional body]

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

## Types

| Type | When |
|------|------|
| feat | New feature or capability |
| fix | Bug fix |
| refactor | Code restructuring without behavior change |
| docs | Documentation only |
| test | Adding or updating tests |
| chore | Build, CI, tooling changes |
| style | Formatting, whitespace (no logic change) |
| perf | Performance improvement |

## Scopes (Indian Stock Analysis)

| Scope | Files |
|-------|-------|
| data | `src/services/data-fetcher.ts`, upstox-api, nse-scraper, yahoo-finance |
| indicators | `src/services/indicators.ts`, patterns.ts |
| analysis | `src/services/analysis.ts`, probability.ts |
| predict | `src/commands/predict.ts` |
| optimize | `src/commands/optimize.ts`, `src/optimization/*` |
| learn | `src/commands/learn.ts` |
| portfolio | `src/portfolio/*` |
| reports | `src/reports/*` |
| fundamentals | `src/services/fundamentals.ts`, earnings, dividends, options, news |
| cli | `src/index.ts` |
| output | `src/utils/csv-writer.ts`, json-exporter, slack |
| ci | `.github/workflows/*` |
| agents | `.agents/*` |
| skills | `.claude/skills/*` |

## Process

1. `git status` — See all changed files
2. `git diff` — Analyze staged + unstaged changes
3. Group by type/scope — Split into multiple commits if different domains
4. Write message — Imperative, max 72 chars, lowercase, no period
5. Execute — Use HEREDOC for message, specific file names in `git add`

## Absolute Rules

- **Never** `git add -A` or `git add .` — Always name specific files
- **Never** commit `.env`, credentials, or token files
- **Always** use HEREDOC for commit messages (proper formatting)
- **Split commits** if changes span different type/scope AND > 5 files
- **Co-Author footer** is mandatory
