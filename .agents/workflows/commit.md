# Workflow: Commit

Conventional Commits generation with auto-separation by feature/domain.

## Mandatory Rules

1. **No skipping steps** — Analyze before committing
2. **Never `git add -A`** — Always name specific files
3. **Never commit secrets** — Check for .env, tokens, credentials
4. **HEREDOC for messages** — Ensures proper formatting
5. **Co-Author footer** — Always include

## Commit Format

```
<type>(<scope>): <description>

[optional body]

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

## Types

| Type | When to Use |
|------|------------|
| feat | New feature (indicator, data source, CLI option) |
| fix | Bug fix (data fetch failure, calculation error) |
| refactor | Code restructuring (no behavior change) |
| docs | Documentation (README, SKILL.md, comments) |
| test | Adding or updating tests |
| chore | Build, CI, tooling (package.json, workflows) |
| style | Formatting (no logic change) |
| perf | Performance improvement |

## Process

### Step 1: Analyze Changes
```bash
git status
git diff --stat
git diff
```

### Step 2: Separate Features
If changes span different type/scope AND > 5 files:
- Group by domain (data-fetching, indicators, scoring, output)
- Create separate commits per group

### Step 3: Determine Type and Scope
Match changed files to scope:
- `src/services/data-fetcher.ts`, `upstox-api.ts`, `nse-scraper.ts` → scope: `data`
- `src/services/indicators.ts`, `patterns.ts` → scope: `indicators`
- `src/services/analysis.ts`, `probability.ts` → scope: `analysis`
- `src/commands/predict.ts` → scope: `predict`
- `src/optimization/*` → scope: `optimize`
- `.agents/*` → scope: `agents`
- `.claude/skills/*` → scope: `skills`

### Step 4: Write Description
- Imperative mood ("add", "fix", "update")
- Max 72 characters
- Lowercase
- No period at end

### Step 5: Execute
```bash
git add {specific files}
git commit -m "$(cat <<'EOF'
type(scope): description

Optional body with details.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

### Step 6: Verify
```bash
git log --oneline -1
git status
```
