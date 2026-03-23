# Workflow: Debug

Structured bug diagnosis and fixing for the Indian stock analysis tool.

## Mandatory Rules

1. **No skipping steps** — Follow the full diagnosis process
2. **Reproduce first** — Never propose a fix without reproducing the bug
3. **Minimal changes** — Fix root cause only, no refactoring

## Step 1: Collect Error Information

Gather:
- Error message (full stack trace if available)
- Command that triggered it (`bun src/index.ts predict --ticker=X`)
- Expected behavior vs actual behavior
- Environment (Bun version, OS, data source used)

## Step 2: Reproduce

Run the exact command:
```bash
bun src/index.ts predict --ticker={ticker}
```

If not reproducible:
- Check if data source is available (NSE might be blocked, Upstox token expired)
- Try with different tickers
- Check if time-dependent (market hours vs after hours)

## Step 3: Diagnose Root Cause

Trace from symptom to root cause:

### Data Fetching Issues
1. Check which data source was used (look for `📡 Data sources:` in output)
2. Test each source independently
3. Check NSE cookie freshness, Upstox token validity
4. Verify ticker format (.NS/.BO suffix)

### Indicator Calculation Issues
1. Check input data length (needs ≥ 50 bars)
2. Verify parameter values match constants
3. Check for NaN/undefined propagation
4. Compare with known correct values

### Scoring/Output Issues
1. Trace through scoring logic with actual values
2. Use reasoning template from `_shared/core/reasoning-templates.md`
3. Verify weights and thresholds from constants or optimized config

## Step 4: Propose Fix

Present to user (or fix directly if Simple difficulty):
```
Root Cause: {description}
Fix: {what will change}
Files: {list of files to modify}
Risk: {LOW | MEDIUM | HIGH}
```

## Step 5: Apply Fix and Test

1. Apply minimal fix
2. Run original failing command — must now succeed
3. Run with other tickers — must not regress
4. Run `npx tsc --noEmit` — no new type errors
5. Run `bun run lint` — no new lint errors

## Step 6: Scan for Similar Patterns

Search codebase for the same anti-pattern:
- If found in other files, fix those too
- Document the pattern for future prevention

## Step 7: Document

Write bug summary:
```
Bug: {one-line description}
Symptom: {what user saw}
Root Cause: {what was actually wrong}
Fix: {what was changed}
Files: {modified files}
Similar patterns: {found/fixed elsewhere? yes/no}
```
