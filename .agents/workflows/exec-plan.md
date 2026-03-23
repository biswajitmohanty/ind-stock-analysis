# Workflow: Execution Plan

Create, manage, and track execution plans as repository artifacts.

## Plan Location

Plans live in `.agents/` directory:
- Active plan: `.agents/plan.json`
- Archived plans: `.agents/plans/plan-{date}-{name}.json`

## Plan Structure

```json
{
  "name": "Feature name",
  "created": "2026-03-23T10:00:00Z",
  "status": "active",
  "tasks": [
    {
      "id": 1,
      "agent": "backend",
      "description": "Implement Zerodha API client",
      "priority": "P0",
      "dependencies": [],
      "acceptance": [
        "Historical OHLCV data fetched successfully",
        "Fallback chain includes Zerodha"
      ],
      "difficulty": "Medium",
      "status": "pending"
    }
  ],
  "techDebt": [
    {
      "description": "NSE cookie handling is fragile",
      "severity": "MEDIUM",
      "trackedSince": "2026-03-23"
    }
  ]
}
```

## Plan Lifecycle

1. **Create**: PM agent generates plan from requirements
2. **Approve**: User reviews and approves
3. **Execute**: Orchestrator spawns agents per plan
4. **Track**: Task statuses updated as agents complete
5. **Complete**: All tasks done → plan archived
6. **Cancel**: User cancels → plan archived with status "cancelled"

## Task Status Flow

```
pending → in_progress → completed
                     → failed → retrying → completed
                                         → blocked
```
