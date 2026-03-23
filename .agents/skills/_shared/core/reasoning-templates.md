# Reasoning Templates

Structured reasoning frameworks for different problem types.

## 1. Debugging Reasoning

```
HYPOTHESIS: {what you think is wrong}
VERIFICATION: {how to test this hypothesis}
RESULT: {what you found}
VERDICT: {confirmed | rejected | inconclusive}
NEXT: {next hypothesis if rejected, or fix if confirmed}
```

## 2. Data Source Diagnosis

```
SOURCE: {Upstox | NSE | Yahoo}
REQUEST: {endpoint / method called}
EXPECTED: {what should be returned}
ACTUAL: {what was returned}
CAUSE: {token expired | cookie stale | API changed | rate limited | ticker invalid}
FIX: {specific fix with file:line reference}
```

## 3. Indicator Verification

```
INDICATOR: {RSI | MACD | Bollinger | etc.}
INPUT: {closes array length, parameters used}
EXPECTED OUTPUT: {range, typical values}
ACTUAL OUTPUT: {what was computed}
LIBRARY CALL: {exact function and parameters}
DISCREPANCY: {what's wrong, if anything}
```

## 4. Architecture Decision

```
OPTIONS:
  A: {option description}
     Pro: {advantage}
     Con: {disadvantage}
  B: {option description}
     Pro: {advantage}
     Con: {disadvantage}

EVALUATION:
  - Complexity: A={low|med|high} vs B={low|med|high}
  - Data accuracy impact: A vs B
  - Performance: A vs B
  - Maintainability: A vs B

DECISION: {chosen option} because {reason}
```

## 5. Scoring Logic Trace

```
TICKER: {symbol}
CLOSE: ₹{price}

INDICATOR SIGNALS:
  RSI({value}) → {BUY|SELL|NEUTRAL} weight={w}
  Stoch({value}) → {BUY|SELL|NEUTRAL} weight={w}
  ...

PATTERN SIGNALS:
  {pattern name} → +{score}

FINAL SCORES:
  BUY: {total} | SELL: {total}
  Threshold: {buy_threshold} / {sell_threshold}

DECISION: {BUY|SELL|HOLD}
PROBABILITIES: Buy={x}% Sell={y}% Hold={z}% [{confidence}]
```

## 6. Performance Bottleneck

```
MEASUREMENT: {what was measured, timing}
BOTTLENECK: {where time is spent}
CAUSE: {sequential fetching | redundant computation | etc.}
SOLUTION: {specific optimization}
EXPECTED IMPROVEMENT: {estimated speedup}
```
