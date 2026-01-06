# How to Process Tasks from Orchestrator

## Overview

Tasks arrive from the AI Dev Orchestrator as JSON files in `.tasks/`. This workflow explains how to execute them.

---

## Task Lifecycle

```
1. pending_approval → User reviews in orchestrator
2. approved → Ready for IDE agent pickup
3. in_progress → AI agent is executing
4. completed/failed → Task finished
```

---

## Step-by-Step Process

### 1. Check for Approved Tasks

Monitor `.tasks/` for files with `status: "approved"`:

```bash
# Check for tasks
ls -la .tasks/queue/
```

Or the orchestrator will move the task to `current-task.json` when approved.

### 2. Load Task Specification

Read `.tasks/current-task.json`:

```json
{
  "id": "task-001",
  "title": "Add priority field",
  "status": "approved",
  "agent": { "role": "pipeline" },
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

### 3. Load Context

Load all referenced files:

```
@.agent/workflows/add-pipeline-field.md
@.agent/context.md
@services/platformDatabase.ts
```

### 4. Execute Steps

Follow the `implementation.steps` array:

```json
{
  "step": 1,
  "action": "Add field definition",
  "file": "services/platformDatabase.ts",
  "description": "Add priority field with options High/Medium/Low"
}
```

For each step:
- Open the specified file
- Make the described changes
- Follow conventions from `.agent/conventions.md`

### 5. Validate

Run the validation commands:

```bash
npm run build
npm run dev  # Manual check
```

Verify the criteria are met:
- Build passes ✓
- Field appears in UI ✓

### 6. Update Status

Update `.tasks/current-task.json`:

```json
{
  "status": "completed",
  "completedAt": "2025-12-16T02:00:00Z",
  "result": {
    "success": true,
    "filesModified": ["services/platformDatabase.ts"],
    "validation": "Build passed, field renders correctly"
  }
}
```

Or if there are issues:

```json
{
  "status": "blocked",
  "blockedReason": "Type mismatch in pipeline.ts",
  "needsHelp": true
}
```

### 7. Move to Completed

The orchestrator will move the task to `completed/`:

```bash
mv .tasks/current-task.json .tasks/completed/task-001.json
```

---

## Using with Antigravity

When I (Antigravity) see a task:

1. **Read task file**: Parse JSON and understand requirements
2. **Load context**: Read all referenced `.agent/` docs
3. **Execute with oversight**: Make changes while you watch
4. **Validate**: Run commands and check results
5. **Report**: Update status for orchestrator

---

## Using with Cursor

In Cursor:

1. Open task file manually or via command
2. Use `@` mentions to load context:
   ```
   @.agent/workflows/add-pipeline-field.md
   @services/platformDatabase.ts
   
   Execute step 1 from current task
   ```
3. Cursor AI follows the workflow
4. You manually update status when done

---

## Approval Gate

**IMPORTANT**: Never execute a task with `status: "pending_approval"`.

Only execute when:
- `status === "approved"`
- Task is in `current-task.json` (not in `queue/`)

The user must approve via the orchestrator web dashboard first.

---

## Error Handling

If you encounter issues:

1. **Update status to `blocked`**
2. **Describe the issue** in `blockedReason`
3. **Set `needsHelp: true`**
4. **Wait for orchestrator** to provide guidance

Never proceed if blocked without resolution.
