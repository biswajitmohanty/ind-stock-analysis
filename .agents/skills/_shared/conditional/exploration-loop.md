# Exploration Loop

Hypothesis-driven exploration for when standard approaches fail.

## Activation Triggers

1. Verification fails 2x on the same issue
2. Quality score delta is negative after a fix attempt
3. User explicitly requests exploration of alternatives

## Protocol (5 Steps)

### Step 1: Hypothesize
Generate 2-3 alternative approaches.

```
EXPLORATION ROUND {n}

Hypothesis A: {description}
  Expected impact: {score delta estimate}
  Confidence: {low | medium | high}

Hypothesis B: {description}
  Expected impact: {score delta estimate}
  Confidence: {low | medium | high}
```

### Step 2: Experiment
Test each hypothesis in isolation.
- **Single-agent mode**: Sequential, use `git stash` between experiments
- **Multi-agent mode**: Spawn same agent type with different hypothesis prompts

### Step 3: Measure
Score each result using quality-score.md dimensions.

### Step 4: Select
- Best score > current score → **KEEP best**, discard others
- No improvement → **KEEP current**, escalate to user

### Step 5: Record
Log all experiments in the experiment-ledger.md (both kept and discarded).

## Indian Stock Analysis Examples

| Trigger | Hypothesis A | Hypothesis B |
|---------|-------------|-------------|
| NSE scraping blocked repeatedly | Switch to Upstox-first with NSE as fallback | Add proxy rotation for NSE requests |
| Indicator giving inconsistent signals | Try different period (14 → 21) | Add smoothing (SMA on RSI) |
| Backtester showing poor Sharpe | Increase transaction cost accuracy | Add slippage model |
| Pattern detection false positives | Increase confirmation window (20 → 30 bars) | Add volume confirmation filter |

## Constraints

- Max 3 hypotheses per round
- Max 2 rounds per session
- Max 10 turns per hypothesis
- If no hypothesis improves score, escalate to user
