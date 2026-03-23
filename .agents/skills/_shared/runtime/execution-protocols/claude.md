# Execution Protocol — Claude Code

File-based execution protocol for Claude Code agents.

## State Management

All state written to `.agents/results/` directory.

## On Start

1. Read `.agents/results/task-board.md` (or `read_memory("task-board")` if Serena available)
2. Create `progress-{agent-id}.md` with:
   ```
   Status: STARTED
   Agent: {agent-id}
   Task: {task description}
   Started: {ISO timestamp}
   ```

## During Execution

Periodically update `progress-{agent-id}.md` (every 3-5 turns):
```
Status: IN_PROGRESS
Turn: {n}
Current: {what you're working on}
Files: {files modified so far}
```

## On Completion

Write `result-{agent-id}.md`:
```
Status: COMPLETE
Agent: {agent-id}
Summary: {1-2 sentence summary}
Completed: {ISO timestamp}

### Files Changed
- {file}: {description of change}

### Acceptance Criteria
- [x] {criterion met}
- [ ] {criterion not met — reason}

### Quality Score
- Correctness: {0-100}
- Security: {0-100}
- Performance: {0-100}
- Coverage: {0-100}
- Consistency: {0-100}
- **Composite: {weighted score}**
```

## On Failure

Still create `result-{agent-id}.md`:
```
Status: FAILED
Agent: {agent-id}
Error: {error description}
Failed: {ISO timestamp}

### Root Cause
{analysis if identified}

### Partial Changes
- {file}: {what was done before failure}

### Recovery
{suggestion for next attempt}
```

## Verification

After writing results, the orchestrator or QA agent may run:
- `npx tsc --noEmit` — Type checking
- `bun run lint` — Linting
- `bun test` — Tests (if available)

If verification fails, the agent receives the error output and has up to 2 retry attempts.
