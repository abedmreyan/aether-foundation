# IDE Agent Handoff System - Quick Reference

## What This Is

System for AI Dev Orchestrator (web app) to plan tasks and dispatch them to IDE agents (Antigravity/Cursor) for execution.

---

## Key Locations

| Path | Purpose |
|------|---------|
| `.tasks/current-task.json` | Active task being executed |
| `.tasks/queue/` | Pending tasks |
| `.tasks/completed/` | Finished tasks |
| `.tasks/config.json` | System configuration |
| `.agent/workflows/process-task.md` | Full workflow documentation |

---

## Task Flow

```
1. User submits request → AI Dev Orchestrator
2. Orchestrator analyzes, researches, creates plan
3. Task saved to .tasks/ with status: pending_approval
4. User reviews and approves in web dashboard
5. Status → approved
6. IDE agent reads task and executes
7. Status → completed
```

---

## Orchestrator Ports

| Service | Port |
|---------|------|
| AI Dev Orchestrator | 3001 |
| Aether Support | 3000 |
| Aether Foundation | 5173 |

---

## Task Statuses

- `pending_approval` - Awaiting user approval
- `approved` - Ready for execution
- `in_progress` - Agent working on it
- `completed` - Finished successfully
- `failed` - Could not complete
- `blocked` - Needs help
- `rejected` - User rejected plan

---

## For IDE Agents

**Only execute tasks with `status === "approved"`**

1. Read `.tasks/current-task.json`
2. Load context files from `context` section
3. Execute `implementation.steps`
4. Run `validation.commands`
5. Update status

See `.agent/workflows/process-task.md` for details.

---

## Example Task

See `.tasks/queue/example-task-001.json` (JSON format)  
See `.tasks/queue/example-task-001.md` (Human-readable)

---

## Next Steps

1. **Orchestrator Side**: Implement task export service
2. **MCP Bridge**: Connect file system operations
3. **Testing**: End-to-end test with real task

---

**Status:** Phase 1 complete, Phase 2-3 in progress
