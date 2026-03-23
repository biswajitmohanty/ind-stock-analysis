# Memory Protocol

File-based coordination for CLI subagents.

## Memory Location

Base path: `.agents/results/` (file-based)
Alternative: `.serena/memories/` (if Serena MCP available)

## File Operations

| Operation | File-Based | Serena MCP |
|-----------|-----------|------------|
| Read | Read file from `.agents/results/` | `read_memory` |
| Write | Write file to `.agents/results/` | `write_memory` |
| Edit | Edit file in `.agents/results/` | `edit_memory` |
| List | List files in `.agents/results/` | `list_memories` |
| Delete | Delete file from `.agents/results/` | `delete_memory` |

## Agent Lifecycle

### On Start
1. Read `task-board.md` to get assigned tasks
2. Create `progress-{agent-id}.md` with initial status

### During Execution
Update `progress-{agent-id}.md` every 3-5 turns:

```markdown
## Progress: {agent-id}
- Status: IN_PROGRESS
- Turn: {n}
- Current task: {description}
- Files modified: {list}
- Blockers: {none | description}
```

### On Completion
Write `result-{agent-id}.md`:

```markdown
## Result: {agent-id}
- Status: COMPLETE
- Summary: {what was done}
- Files changed:
  - {file1}: {what changed}
  - {file2}: {what changed}
- Acceptance criteria:
  - [x] {criterion 1}
  - [x] {criterion 2}
  - [ ] {criterion not met — reason}
```

### On Failure
Still create `result-{agent-id}.md`:

```markdown
## Result: {agent-id}
- Status: FAILED
- Error: {error description}
- Root cause: {if identified}
- Files changed: {partial changes, if any}
- Recovery suggestion: {what to try next}
```

## Orchestrator Files

| File | Owner | Purpose |
|------|-------|---------|
| `orchestrator-session.md` | Orchestrator | Session metadata, agent mapping |
| `task-board.md` | Orchestrator | All tasks with assignments and status |
| `progress-{agent}.md` | Each agent | Live progress updates |
| `result-{agent}.md` | Each agent | Final results |
