# Workflow: Ultrawork

High-quality 5-phase development workflow with quality gates and continuous measurement.

## Phases

### Phase 1: PLAN (PM Agent)
1. Gather requirements
2. Analyze technical feasibility
3. Decompose into tasks with acceptance criteria
4. User approval required before proceeding

**Gate**: User approves plan

### Phase 2: IMPL (Backend + Data Agents)
1. Implement according to plan
2. Each agent follows Charter Preflight
3. Write code following existing patterns
4. Self-review: check own diff, run type-check

**Gate**: `npx tsc --noEmit` passes, `bun run lint` passes
**Measurement**: Take IMPL baseline quality score

### Phase 3: VERIFY (QA Agent)
1. Run full review workflow (security, accuracy, performance, quality)
2. Report findings with severity levels
3. Feed CRITICAL/HIGH findings back to implementing agents

**Gate**: Zero CRITICAL findings, ≤ 2 HIGH findings
**Measurement**: Post-VERIFY quality score

### Phase 4: REFINE (Debug + Backend/Data Agents)
1. Fix HIGH/MEDIUM findings from QA
2. Optimize performance if needed
3. Run Exploration Loop if stuck (max 2 rounds)

**Gate**: Quality score ≥ 75 (Grade B or higher)
**Measurement**: Post-REFINE quality score

### Phase 5: SHIP (Commit Agent)
1. Run final automated checks
2. Generate commit(s) following Conventional Commits
3. Update quality score to Final
4. Present session report

**Gate**: All automated checks pass, quality score ≥ 75

## Quality Gates Summary

| Phase | Gate | Measurement |
|-------|------|-------------|
| PLAN | User approval | — |
| IMPL | tsc + lint pass | Baseline score |
| VERIFY | Zero CRITICAL | Post-VERIFY score |
| REFINE | Score ≥ 75 | Post-REFINE score |
| SHIP | All checks pass | Final score |

## Experiment Tracking

During REFINE phase:
1. Each fix attempt is an "experiment"
2. Measure quality score before and after
3. Keep if score improves, discard if regresses
4. Record in experiment ledger

## Escalation Rules

- VERIFY fails 2x on same issue → Activate Exploration Loop
- Exploration Loop produces no improvement → Escalate to user
- CD ≥ 50 → Root Cause Analysis required
- CD ≥ 80 → Pause session
