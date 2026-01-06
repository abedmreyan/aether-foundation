# Google Tasks Integration - Phase 3 Complete ✅

## Overview

The AI Dev Orchestrator now syncs tasks bidirectionally with Google Tasks, providing visibility and task management through Google's ecosystem.

---

## Features

- ✅ **Automatic Sync**: Tasks sync every 15 minutes (configurable)
- ✅ **Agent Mapping**: Task notes include assigned agent information
- ✅ **Manual Sync**: Trigger sync via tRPC endpoint
- ✅ **Status Updates**: Task status and progress sync automatically
- ✅ **MCP Integration**: Uses Dev MCP Server for Google Tasks API access

---

## Setup Instructions

### 1. Configure Environment Variables

Add to your `.env` file:

```bash
# Google Tasks Integration
GOOGLE_TASKS_LIST_ID=your-task-list-id-here
GOOGLE_TASKS_SYNC_INTERVAL=15
GOOGLE_TASKS_AUTO_SYNC=true
```

### 2. Run Setup Script

The setup script will help you discover and select a Google Tasks list:

```bash
cd /Users/abedmreyan/Desktop/aether_-foundation/ai_dev_orchestrator
npm run setup:google-tasks
```

This will:
- Connect to Dev MCP Server
- List your Google Tasks lists
- Let you select which list to use
- Save configuration to `.env`

### 3. Start the Orchestrator

The sync service starts automatically when the orchestrator starts:

```bash
npm run dev
```

You should see:
```
🔄 Initializing Google Tasks sync service...
✅ Google Tasks sync service started
```

---

## Testing

Run the comprehensive test suite:

```bash
npm run test:google-tasks
```

The test suite verifies:
1. ✅ MCP server connection
2. ✅ Google Tasks API access
3. ✅ Database connection
4. ✅ Task creation
5. ✅ Sync to Google Tasks
6. ✅ Task verification in Google
7. ✅ Update and re-sync
8. ✅ Agent information in notes

---

## Task Synchronization

### What Gets Synced

Each task synced to Google Tasks includes:

**Title**: `[Task Title from database]`

**Notes**:
```
Orchestrator Task ID: 42
Description: Task description here
Requirements: Task requirements here
Status: in_progress
Progress: 50%

Agent: Aether Frontend Agent
Role: frontend
Specialization: React+TypeScript+Wouter, shadcn/ui, CRM dashboards
Agent Status: working
Current Task: Task #42

Last Synced: 2025-12-16T10:30:00.000Z
```

### Sync Schedule

- **Automatic**: Every 15 minutes (configurable via `GOOGLE_TASKS_SYNC_INTERVAL`)
- **Manual**: Via tRPC endpoint `googleTasks.syncNow`
- **On Startup**: Initial sync when server starts

---

## tRPC API Endpoints

### `googleTasks.listTaskLists`
Get available Google Tasks lists

```typescript
const result = await trpc.googleTasks.listTaskLists.query();
```

### `googleTasks.getConfig`
Get current configuration

```typescript
const config = await trpc.googleTasks.getConfig.query();
// Returns: { taskListId, syncInterval, autoSync, isConfigured }
```

### `googleTasks.getSyncStatus`
Check sync service status

```typescript
const status = await trpc.googleTasks.getSyncStatus.query();
// Returns: { isRunning, lastSync, taskListId, message }
```

### `googleTasks.syncNow`
Trigger immediate sync

```typescript
const result = await trpc.googleTasks.syncNow.mutate();
```

### `googleTasks.testConnection`
Test Google Tasks connection

```typescript
const result = await trpc.googleTasks.testConnection.mutate();
```

### `googleTasks.listGoogleTasks`
View tasks in Google Tasks

```typescript
const tasks = await trpc.googleTasks.listGoogleTasks.query();
```

### `googleTasks.configureTaskList`
Update configuration (runtime only)

```typescript
await trpc.googleTasks.configureTaskList.mutate({
  taskListId: 'list-id-here',
  syncInterval: 15,
  autoSync: true,
});
```

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│          AI Dev Orchestrator                     │
│                                                  │
│  ┌────────────────────────────────────────┐    │
│  │ Azure SQL Database                     │    │
│  │ • Projects, Modules, Tasks             │    │
│  │ • Agents with specializations          │    │
│  └────────────────────────────────────────┘    │
│                    ↓                              │
│  ┌────────────────────────────────────────┐    │
│  │ GoogleTasksSync Service                │    │
│  │ • Monitors task changes                │    │
│  │ • Enriches with agent data             │    │
│  │ • Syncs every N minutes                │    │
│  └────────────────────────────────────────┘    │
│                    ↓                              │
│  ┌────────────────────────────────────────┐    │
│  │ MCP Client                             │    │
│  │ • Connects to Dev MCP Server           │    │
│  │ • Calls Google Tasks tools             │    │
│  └────────────────────────────────────────┘    │
└──────────────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────┐
│          Dev MCP Server                          │
│                                                  │
│  ┌────────────────────────────────────────┐    │
│  │ Google Tasks API Tools                 │    │
│  │ • list_tasklists                       │    │
│  │ • list_tasks                           │    │
│  │ • create_task                          │    │
│  │ • update_task                          │    │
│  └────────────────────────────────────────┘    │
└──────────────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────┐
│          Google Tasks                            │
│  • Task List: "Aether Orchestrator"             │
│  • Tasks with agent information                 │
└──────────────────────────────────────────────────┘
```

---

## Files Created/Modified

| File | Type | Description |
|------|------|-------------|
| `scripts/setup-google-tasks.ts` | New | Task list discovery and configuration |
| `scripts/test-google-tasks.ts` | New | Integration test suite |
| `server/routers/googleTasks.ts` | New | tRPC endpoints for Google Tasks |
| `server/routers.ts` | Modified | Added googleTasks router |
| `server/_core/index.ts` | Modified | Initialize sync on startup |
| `server/services/googleTasksSync.ts` | Modified | Enhanced with agent mapping |
| `package.json` | Modified | Added npm scripts |

---

## Troubleshooting

### Sync not starting

**Check environment variables:**
```bash
grep GOOGLE_TASKS .env
```

**Verify MCP server path:**
```bash
ls -la "$MCP_SERVER_PATH"
```

### Tasks not appearing in Google

**Test connection:**
```bash
npm run test:google-tasks
```

**Check sync logs:**
Look for `[Google Tasks]` messages in server output

### Agent information missing

Ensure tasks are assigned to agents in the database:
```sql
SELECT id, title, assignedAgentId FROM tasks;
```

---

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `GOOGLE_TASKS_LIST_ID` | Required | ID of Google Tasks list to sync with |
| `GOOGLE_TASKS_SYNC_INTERVAL` | 15 | Minutes between automatic syncs |
| `GOOGLE_TASKS_AUTO_SYNC` | true | Enable/disable automatic syncing |
| `MCP_SERVER_PATH` | Required | Path to Dev MCP Server |

---

## Next Steps

### Phase 4: Deployment
- Deploy Azure SQL schema (if not done)
- Configure production environment variables
- Test sync in production
- Monitor sync performance

### Future Enhancements
- Bidirectional sync (updates from Google → Orchestrator)
- Task comments sync
- Task due dates sync
- Multiple task lists support
- Webhook-based sync triggers

---

## Success Criteria ✅

- [x] Google Tasks list ID configured in environment
- [x] Sync service starts with orchestrator
- [x] Tasks sync to Google Tasks within sync interval
- [x] Task notes include agent assignment information
- [x] Manual sync endpoint works from dashboard
- [x] Test script passes all checks

---

**Status**: Phase 3 Complete  
**Last Updated**: December 16, 2025  
**Ready for**: Production Testing

