# Difficulty Assessment Guide

Assess task complexity to determine the right execution protocol.

## Difficulty Levels

### Simple (3-5 turns)
**Criteria**:
- Single file change
- Clear requirements, no ambiguity
- Repeating an established pattern

**Examples** (Indian Stock Analysis):
- Add a new default ticker to the list
- Fix a typo in console output formatting
- Update INR formatting for a single display

**Protocol**: Skip planning, proceed directly to implementation.

### Medium (8-15 turns)
**Criteria**:
- 2-3 files changed
- Some design decisions needed
- Follows existing patterns but with variations

**Examples**:
- Add a new technical indicator (following existing pattern in `indicators.ts`)
- Add a new chart pattern detector
- Modify scoring weights or thresholds
- Add a new CLI option to Commander
- Fix a data source fallback issue

**Protocol**: Full standard protocol (plan → implement → verify).

### Complex (15-25 turns)
**Criteria**:
- 4+ files changed
- Architecture decisions required
- New patterns or integrations

**Examples**:
- Add a completely new data source (e.g., Zerodha API)
- Implement a new analysis module (e.g., sector rotation analysis)
- Major refactor of the scoring engine
- Add real-time streaming price support
- Implement portfolio risk analysis (VaR, correlation matrix)

**Protocol**: Extended protocol with checkpoints:
- Checkpoint at Step 2.5 (after design, before implementation)
- Checkpoint at Step 3.5 (after core implementation, before edge cases)

## Assessment Checklist

1. How many files will be modified? (1 = Simple, 2-3 = Medium, 4+ = Complex)
2. Does it require new types in `src/types/index.ts`? (Yes = at least Medium)
3. Does it touch the data fetching layer? (Yes = at least Medium)
4. Does it require changes to multiple data sources? (Yes = Complex)
5. Does it change the scoring/calibration logic? (Yes = Complex, needs backtesting)
