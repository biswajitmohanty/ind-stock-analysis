# Workflow: Plan

Requirements analysis, task decomposition, and execution planning for the Indian stock analysis project.

## Mandatory Rules

1. **No skipping steps** — Execute all steps in order
2. **Use code analysis** for understanding existing codebase before planning
3. **User confirmation required** — MUST get user approval before saving plan

## Step 1: Gather Requirements

Ask or infer:
- What feature/change is requested?
- Which data sources are affected? (Upstox, NSE, Yahoo)
- Which analysis components? (indicators, patterns, scoring, calibration)
- What output formats needed? (CSV, JSON, console, Slack, Markdown)
- Target users/audience for this change?

## Step 2: Analyze Technical Feasibility

1. Read relevant source files to understand current architecture
2. Identify reusable components
3. Check if existing types in `src/types/index.ts` cover the need
4. Verify data source support for the feature

## Step 3: Define Contracts

For new/modified functions:
- Input types (parameters)
- Output types (return values)
- Error handling (what can fail)
- CLI argument additions (Commander options)

## Step 4: Decompose into Tasks

For each task, specify:
- **Agent**: backend, data, qa, debug
- **Description**: What needs to be done
- **Acceptance criteria**: Measurable conditions for "done"
- **Priority**: P0 (blocking), P1 (important), P2 (nice-to-have)
- **Dependencies**: Which tasks must complete first
- **Estimated difficulty**: Simple, Medium, Complex

## Step 5: Review with User

Present plan summary:
```
## Plan: {feature name}

### Tasks ({count})

| # | Agent | Task | Priority | Depends On |
|---|-------|------|----------|------------|
| 1 | pm | Define requirements | P0 | — |
| 2 | backend | Implement data fetching | P0 | 1 |
| 3 | data | Add indicator logic | P1 | 2 |
| 4 | qa | Review implementation | P1 | 2, 3 |

### Parallel Execution
- Tasks 2 and 3 can run in parallel (no shared files)
- Task 4 must wait for both 2 and 3

Approve this plan? (y/n)
```

## Step 6: Save Plan

On approval, save to `.agents/plan.json`:
```json
{
  "name": "{feature name}",
  "created": "{ISO timestamp}",
  "status": "active",
  "tasks": [
    {
      "id": 1,
      "agent": "backend",
      "description": "...",
      "priority": "P0",
      "dependencies": [],
      "acceptance": ["..."],
      "status": "pending"
    }
  ]
}
```
