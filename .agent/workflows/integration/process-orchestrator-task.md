# Process Orchestrator Task

## Overview
This workflow defines how to receive tasks from the AI Dev Orchestrator and execute them in the IDE/development environment.

## Workflow Type
**Integration** - Orchestrator ↔ IDE bridge

---

## Agents Involved

| Phase | Primary Agent | Supporting |
|-------|---------------|------------|
| Task Reception | Orchestrator | All |
| Context Loading | Coordinator | N/A |
| Execution | Relevant specialist | QA |
| Reporting | Orchestrator | N/A |

---

## Prerequisites

- [ ] Orchestrator running on port 3002
- [ ] Task watcher active (`.tasks/watcher.mjs`)
- [ ] `.tasks/config.json` configured correctly
- [ ] Agent context docs available in `.agent/`

---

## Steps

### 1. Task Arrival
**Agent:** Task Watcher (automated)

Task appears via:
- Orchestrator API → `.tasks/queue/task-{id}.json`
- Manual creation in queue folder

**Task Structure:**
```json
{
  "id": "task-uuid",
  "projectId": 1,
  "title": "Task Title",
  "description": "...",
  "status": "pending",
  "workflow": "feature-development/full-feature",
  "assignedAgentId": 5,
  "context": {
    "workflows": [".agent/workflows/add-pipeline-field.md"],
    "docs": [".agent/context.md"],
    "relatedFiles": ["services/platformDatabase.ts"]
  },
  "implementation": {
    "steps": [...]
  }
}
```

### 2. Context Loading
**Agent:** Coordinator

Load specified context files:
```
@{task.context.workflows}
@{task.context.docs}
@{task.context.relatedFiles}
```

Example:
```
@.agent/workflows/add-pipeline-field.md
@.agent/context.md
@services/platformDatabase.ts
```

### 3. Agent Routing
**Agent:** Coordinator

Map orchestrator agent to Cursor agent:

| Orchestrator Agent | Cursor Agent |
|-------------------|--------------|
| Project Manager | Coordinator |
| Architect | Architect |
| Frontend | Frontend |
| Backend | Services |
| DevOps | DevOps |
| QA | QA |
| Technical Writer | *Use Architect* |
| Security | *Use Architect* |

Invoke correct agent:
```
@{mapped_agent} {task.description}
```

### 4. Execute Steps
**Agent:** Assigned specialist

Follow `implementation.steps`:
```json
{
  "steps": [
    {
      "file": "services/platformDatabase.ts",
      "action": "add_field",
      "details": {...}
    }
  ]
}
```

Execute each step, updating progress.

### 5. Validation
**Agent:** QA (or assigned agent)

Run validation commands:
```bash
npm run build
npm run test  # if available
```

**Checklist:**
- [ ] Build passes
- [ ] No TypeScript errors
- [ ] No linter errors
- [ ] Tests pass (if applicable)
- [ ] Manual verification complete

### 6. Update Task Status
**Agent:** Orchestrator

Update task file:
```json
{
  "status": "completed",  // or "blocked"
  "completedAt": 1234567890,
  "output": {
    "filesModified": ["..."],
    "notes": "..."
  }
}
```

If orchestrator API available:
```bash
curl -X PATCH http://localhost:3002/api/trpc/tasks.updateStatus \
  -d '{"taskId": "...", "status": "completed"}'
```

### 7. Report Completion
**Agent:** Orchestrator

Move task file:
```
.tasks/queue/task-{id}.json → .tasks/completed/task-{id}.json
```

Update `.agent/current-work.md`:
```markdown
### {Task Title}
- **Completed**: {date}
- **Summary**: {brief summary}
- **Files Modified**: {list}
```

---

## Validation Checklist

**Before marking complete:**
- [ ] All implementation steps executed
- [ ] Build passes without errors
- [ ] Tests pass (if applicable)
- [ ] Task status updated in `.tasks/`
- [ ] `current-work.md` updated
- [ ] Orchestrator notified (if API available)

---

## Files Modified

**Always:**
- `.tasks/queue/task-{id}.json` (moved to completed)
- `.agent/current-work.md`

**Task-specific:**
- Per `implementation.steps`

---

## Error Handling

### Task Blocked
If unable to complete:
```json
{
  "status": "blocked",
  "blocker": {
    "reason": "Missing dependency",
    "details": "...",
    "suggestedAction": "..."
  }
}
```

### Context Missing
If required context not available:
```json
{
  "status": "blocked",
  "blocker": {
    "reason": "Missing context",
    "missingFiles": ["..."]
  }
}
```

Request missing context from orchestrator or user.

---

## Integration Points

### Orchestrator API Endpoints

**Get Task:**
```
GET /api/trpc/tasks.getById?input={"taskId": "..."}
```

**Update Status:**
```
POST /api/trpc/tasks.updateStatus
{taskId, status, output}
```

**Request Approval:**
```
POST /api/trpc/tasks.requestApproval
{taskId, changes, reasoning}
```

---

## Task Watcher Configuration

`.tasks/config.json`:
```json
{
  "orchestratorUrl": "http://localhost:3002",
  "projectPath": "/Users/abedmreyan/Desktop/aether_-foundation",
  "contextDirs": [".agent/", ".cursor/agents/"],
  "autoLoadContext": true,
  "taskQueuePollingMs": 5000
}
```

---

## Future Enhancements

- [ ] Automatic context loading based on task type
- [ ] Progress percentage updates during execution
- [ ] Rollback on validation failure
- [ ] Multi-step approval workflow
- [ ] Task dependency resolution

---

**Created:** 2025-12-18
**Last Updated:** 2025-12-18
