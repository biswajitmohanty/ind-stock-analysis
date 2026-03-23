---
name: oma-orchestrator
description: Automated multi-agent orchestrator for Indian stock analysis. Spawns CLI subagents in parallel, coordinates via memory files, manages quality gates and verification loops.
version: 1.0.0
tags: [orchestration, multi-agent, parallel-execution, coordination]
---

# OMA Orchestrator

Automated multi-agent orchestration for the Indian stock analysis project. Spawns specialized agents in parallel, coordinates via memory files, and manages quality verification loops.

## Coordination Model

- **Max parallel agents**: 3
- **Communication**: File-based (`.agents/results/`)
- **Session tracking**: `orchestrator-session.md` + `task-board.md`
- **Per-agent output**: `progress-{agent}.md` + `result-{agent}.md`

## Workflow Phases

### Phase 1: Plan
- Analyze task requirements
- Decompose into agent-specific subtasks
- Generate session ID: `session-{YYYYMMDD}-{HHmm}`

### Phase 2: Setup
- Create `orchestrator-session.md` with session metadata
- Create `task-board.md` with all tasks, assignments, priorities
- Load agent-CLI mapping from config

### Phase 3: Execute
- Spawn agents by priority tier (P0 first, then P1, etc.)
- Max 3 agents running simultaneously
- Each agent reads its tasks from `task-board.md`

### Phase 4: Monitor
- Poll `progress-{agent}.md` files for status updates
- Handle completions, failures, and timeouts

### Phase 5: Verify
- Run verification for each completed agent
- On failure: feed error back to agent (max 2 retries)
- On repeated failure: activate Exploration Loop

### Phase 6: Collect
- Read all `result-{agent}.md` files
- Compile session summary
- Update `task-board.md` with final statuses

### Phase 7: Report
- Present final summary to user
- List all files changed, tests passed/failed
- Cleanup temporary progress files

## Agent Roster (Indian Stock Analysis)

| Agent | Domain | Typical Tasks |
|-------|--------|---------------|
| backend | API, data fetching | Upstox/NSE/Yahoo integration, service layer |
| data | Indicators, patterns | Technical analysis, scoring, calibration |
| qa | Review | Security, accuracy, performance review |
| debug | Bug fixing | Data fetch failures, calculation errors |
| pm | Planning | Feature decomposition, task assignment |

## Review Loop

1. **Self-Review**: Agent reviews own diff, runs type-check
2. **Automated Verify**: Run `bun run lint` + `npx tsc --noEmit`
3. **Cross-Review**: QA agent reviews if scope > 3 files
4. **Limits**: 3 self-review cycles, 2 cross-review rejections, 5 total max

## Clarification Debt (CD) Monitoring

| Event | Points |
|-------|--------|
| Clarify | +10 |
| Correct | +25 |
| Redo | +40 |

- CD ≥ 50 → Require Root Cause Analysis
- CD ≥ 80 → Pause session, escalate to user
- Redo ≥ 2 → Require scope confirmation
