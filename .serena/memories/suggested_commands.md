# Suggested Commands

## Development

```bash
# Run analysis on default Nifty 50 tickers
bun run start

# Analyze specific tickers
bun src/index.ts predict --ticker=RELIANCE.NS,TCS.NS,INFY.NS

# Analyze with JSON output
bun src/index.ts predict --ticker=RELIANCE.NS --format=json

# Sort by score ascending
bun src/index.ts predict --ticker=RELIANCE.NS,TCS.NS --sort=asc
```

## Fundamental Data

```bash
bun src/index.ts predict --fundamentals --portfolio-ticker=RELIANCE.NS
bun src/index.ts predict --earnings --portfolio-ticker=INFY.NS
bun src/index.ts predict --dividends --portfolio-ticker=ITC.NS
bun src/index.ts predict --options --portfolio-ticker=RELIANCE.NS
bun src/index.ts predict --news --portfolio-ticker=TCS.NS
```

## Portfolio Management

```bash
bun src/index.ts predict --portfolio-action=add --portfolio-ticker=RELIANCE
bun src/index.ts predict --portfolio-action=remove --portfolio-ticker=RELIANCE.NS
bun src/index.ts predict --portfolio-action=list
bun src/index.ts predict --portfolio-action=report
```

## Optimization

```bash
# Optimize weights for a ticker (default 200 trials)
bun src/index.ts optimize RELIANCE.NS

# Custom trial count
bun src/index.ts optimize TCS.NS --trials=500

# Run full learning loop
bun src/index.ts learn
```

## Code Quality

```bash
# Type checking
npx tsc --noEmit

# Linting
bun run lint

# Auto-fix lint issues
bun run lint:fix

# Format code
bun run format

# Run tests
bun test
```

## Git

```bash
# Check status
git status

# View recent commits
git log --oneline -10
```
