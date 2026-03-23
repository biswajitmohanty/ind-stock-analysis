# Task Completion Checklist

Before marking any task as complete, verify all applicable items:

## 1. Type Checking

```bash
npx tsc --noEmit
```

- [ ] Zero type errors
- [ ] All new functions have explicit return types
- [ ] No new `any` types (except raw API response parsing)

## 2. Linting & Formatting

```bash
bun run lint
```

- [ ] Zero lint errors
- [ ] No unused imports or variables
- [ ] Consistent formatting

## 3. Testing

```bash
bun test
```

- [ ] All existing tests pass
- [ ] New tests added for new functionality (if applicable)
- [ ] Edge cases covered (empty data, invalid tickers, source failures)

## 4. Manual Verification

```bash
bun src/index.ts predict --ticker=RELIANCE.NS
```

- [ ] Command runs without errors
- [ ] Output displays correctly with ₹ formatting
- [ ] India VIX shows with source indicator
- [ ] Data source breakdown shown (`📡 Data sources:`)
- [ ] CSV/JSON output files created in `public/`

## 5. Indian Market Specifics

- [ ] All prices show ₹ symbol
- [ ] Market cap in Crore/Lakh Crore notation
- [ ] Dates in IST (Asia/Kolkata) timezone
- [ ] Ticker validation (.NS/.BO suffix)
- [ ] India VIX thresholds correct (>20 bullish, <13 bearish)

## 6. Code Quality

- [ ] No hardcoded API tokens or secrets
- [ ] Error handling: graceful degradation, not crashes
- [ ] Consistent with existing code patterns
- [ ] No unnecessary refactoring beyond the task scope
