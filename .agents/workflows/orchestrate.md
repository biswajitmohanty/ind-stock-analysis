# Workflow: Orchestrate

Automated CLI-based parallel agent execution for the Indian stock analysis project.

## Mandatory Rules

1. **Read coordination skill** before starting (`oma-orchestrator/SKILL.md`)
2. **Read context-loading** before loading any resources
3. **Use memory protocol** for all agent coordination (never raw file reads for state)
4. **Track Clarification Debt** throughout the session
5. **Generate session ID** format: `session-{YYYYMMDD}-{HHmm}`
6. **Max 3 agents** running in parallel
7. **Vendor detection** — Detect available CLI (Claude Code, Codex, Gemini) and use appropriate spawn method

## Step 0: Preparation

1. Read `oma-orchestrator/SKILL.md`
2. Read `_shared/core/context-loading.md`
3. Read `_shared/runtime/memory-protocol.md`
4. Read `.agents/config/user-preferences.yaml` (if exists)

## Step 1: Load or Create Plan

- If `.agents/plan.json` exists → load it
- If user provides task description → run PM agent to create plan
- If neither → ask user for task description

## Step 2: Initialize Session

1. Load config from `.agents/config/user-preferences.yaml`
2. Generate session ID
3. Create `.agents/results/orchestrator-session.md`:
   ```
   Session: {session-id}
   Started: {ISO timestamp}
   Task: {summary}
   Agents: {list}
   ```
4. Create `.agents/results/task-board.md` with all tasks from plan

## Step 3: Spawn Agents by Priority

For each priority tier (P0, P1, P2):
1. Identify tasks for this tier
2. Map tasks to agents via `_shared/core/skill-routing.md`
3. Spawn agents (max 3 parallel):
   - **Claude Code**: Use Agent tool with specialized prompt
   - **Codex**: Use `codex` CLI command
   - **Gemini**: Use `gemini` CLI command

Each agent receives:
- Its tasks from the task board
- The agent definition from `.agents/agents/{type}.md`
- The skill file from `.agents/skills/oma-{type}/SKILL.md`

## Step 4: Monitor Progress

- Poll `.agents/results/progress-{agent}.md` for status updates
- Handle:
  - **COMPLETE** → Move to Step 5 (Verify)
  - **FAILED** → Check if retriable, feed error back (max 2 retries)
  - **TIMEOUT** → Kill and mark as failed

## Step 5: Verify

For each completed agent:
1. Run automated checks:
   - `npx tsc --noEmit` (type checking)
   - `bun run lint` (linting)
2. If checks fail → feed error back to agent (max 2 retries)
3. If still failing after retries → activate Exploration Loop
4. If scope > 3 files → spawn QA agent for cross-review

## Step 6: Collect Results

1. Read all `.agents/results/result-{agent}.md` files
2. Compile into session summary
3. Update `task-board.md` with final statuses

## Step 7: Final Report

Present to user:
```
═══════════════════════════════════════════════════
  SESSION REPORT: {session-id}
═══════════════════════════════════════════════════

Tasks: {completed}/{total}
Agents: {list with status}
Quality Score: {composite}
CD Score: {total}

Files Changed:
  - {file}: {description}

Issues:
  - {any unresolved issues}
═══════════════════════════════════════════════════
```
