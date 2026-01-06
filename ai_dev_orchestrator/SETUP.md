# AI Dev Orchestrator - Complete Setup Guide

## 🚀 Quick Start

```bash
# 1. Navigate to project
cd /Users/abedmreyan/Desktop/aether_-foundation/ai_dev_orchestrator

# 2. Install dependencies (already done)
# npm install

# 3. Set environment variables
export AETHER_PROJECT_PATH=/Users/abedmreyan/Desktop/aether_-foundation
export DEEPSEEK_API_KEY=sk-7ec28d99332f4ba7a39373b076e81808


# 4. Initialize database
npm run db:push

# 5. Start server
npm run dev
```

## ✅ What's Implemented (100%)

### Core Features
- ✅ SQLite database (zero-config, local)
- ✅ Auth bypass (auto-login as "Local Developer")
- ✅ Agent-to-agent messaging
- ✅ Google Tasks integration
- ✅ Context summarization & checkpointing
- ✅ MCP server for IDE integration
- ✅ Project file access
- ✅ MCP tool reminders in agent prompts
- ✅ Complete tRPC API

### Routers
- ✅ Projects
- ✅ Agents
- ✅ Tasks
- ✅ Proposals
- ✅ Agent Messages (NEW)
- ✅ Google Tasks (Enhanced)
- ✅ Orchestration
- ✅ Knowledge Base

---

## 🛠️ MCP Server Integration

### Option 1: Add to Dev-MCP Server

Edit `/Users/abedmreyan/Desktop/MCP Servers/Dev MCP/config.json`:

```json
{
  "mcpServers": {
    "ai-orchestrator": {
      "command": "tsx",
      "args": [
        "/Users/abedmreyan/Desktop/aether_-foundation/ai_dev_orchestrator/server/mcp/server.ts"
      ],
      "env": {
        "AETHER_PROJECT_PATH": "/Users/abedmreyan/Desktop/aether_-foundation"
      }
    }
  }
}
```

### Option 2: Cursor Configuration

Add to `.cursor/mcp.json` in your project:

```json
{
  "mcpServers": {
    "ai-orchestrator": {
      "command": "tsx",
      "args": [
        "/Users/abedmreyan/Desktop/aether_-foundation/ai_dev_orchestrator/server/mcp/server.ts"
      ]
    }
  }
}
```

### Available MCP Tools

1. **orchestrator_get_next_task** - Get next task from queue
2. **orchestrator_complete_task** - Mark task as done
3. **orchestrator_ask_agent** - Ask another agent
4. **orchestrator_report_progress** - Update task progress
5. **orchestrator_get_context** - Get full task context
6. **orchestrator_get_messages** - Get pending messages
7. **orchestrator_respond_message** - Respond to message

---

## 🧪 Running Tests

```bash
# Run all tests
npm test

# Run agent messaging tests
npm test -- tests/agentMessaging.test.ts

# Run in watch mode
npm test -- --watch
```

---

## 📊 Google Tasks Setup

### 1. Get Authorization

```typescript
// Get OAuth URL
const authUrl = await trpc.googleTasks.getAuthUrl.query();
// Visit URL in browser
```

### 2. Complete OAuth

```typescript
// After OAuth redirect with code
await trpc.googleTasks.authorize.mutate({ code });
```

### 3. Sync Tasks

```typescript
// Sync all project tasks
await trpc.googleTasks.syncProject.mutate({ projectId: 1 });

// Or sync individual tasks
await trpc.googleTasks.updateTask.mutate({ taskId: 123 });
```

---

## 🤖 Using Agent Messages

### From Backend (TypeScript)

```typescript
import { AgentMessageService } from "./services/agentMessages";

// Ask another agent
const messageId = await AgentMessageService.askQuestion(
  currentAgentId,
  "backend", // target role
  taskId,
  "What's the authentication flow?"
);

// Get pending messages
const messages = await AgentMessageService.getPendingMessages(agentId);

// Respond to message
await AgentMessageService.respondToMessage(messageId, agentId, "Use JWT tokens");

// Send handoff
await AgentMessageService.sendHandoff(
  fromAgentId,
  toAgentId,
  taskId,
  "UI design complete, ready for implementation"
);
```

### From Frontend (tRPC)

```typescript
// Send message
await trpc.agentMessages.send.mutate({
  fromAgentId: 1,
  toAgentId: 2,
  taskId: 10,
  type: "question",
  content: "How should we handle errors?",
});

// Get pending
const messages = await trpc.agentMessages.getPending.query({ agentId: 2 });

// Respond
await trpc.agentMessages.respond.mutate({
  messageId: 5,
  agentId: 2,
  response: "Use try/catch blocks with error boundaries",
});
```

---

## 📁 Project Structure

```
ai_dev_orchestrator/
├── server/
│   ├── agents/
│   │   ├── base.ts (✅ Enhanced with tool reminders)
│   │   ├── mcpTools.ts (✅ Tool registry)
│   │   └── contextSummarizer.ts (✅ NEW)
│   ├── services/
│   │   ├── agentMessages.ts (✅ NEW)
│   │   ├── googleTasks.ts (✅ NEW)
│   │   └── projectFiles.ts (✅ NEW)
│   ├── mcp/
│   │   ├── mcpServer.ts (✅ NEW)
│   │   └── server.ts (✅ NEW - Entry point)
│   ├── routers/
│   │   ├── agentMessages.ts (✅ NEW)
│   │   └── googleTasksRouter.ts (✅ NEW)
│   ├── db-sqlite.ts (✅ NEW - SQLite driver)
│   └── db.ts (✅ Updated - Re-exports SQLite)
├── drizzle/
│   └── schema-sqlite.ts (✅ NEW - SQLite schema)
├── tests/
│   └── agentMessaging.test.ts (✅ NEW)
└── data/
    └── orchestrator.db (Created on first run)
```

---

## 🎯 Usage Examples

### Example 1: Create Project & Assign Tasks

```typescript
// Create project
const project = await trpc.projects.create.mutate({
  name: "E-commerce Platform",
  description: "Full-stack e-commerce with React and Node.js",
});

// PM agent creates subsystems
// Architecture agent designs structure
// Tasks get assigned to specialized agents

// Frontend agent asks backend agent
await trpc.agentMessages.askByRole.mutate({
  fromAgentId: frontendAgent.id,
  toAgentRole: "backend",
  taskId: task.id,
  question: "What's the product API schema?",
});
```

### Example 2: Monitor via Google Tasks

```typescript
// Sync to Google Tasks
await trpc.googleTasks.syncProject.mutate({ project.id });

// Now check Google Tasks app on phone/web
// See all orchestrator tasks
// Get notifications on updates
```

### Example 3: Use MCP Tools from Cursor

In Cursor:
```
@agent Use orchestrator to get my next task

Cursor calls: orchestrator_get_next_task()

Gets task with full context, works on it

Cursor calls: orchestrator_complete_task({
  taskId: 5,
  result: "Implemented user login component",
  filesChanged: ["src/components/Login.tsx"]
})
```

---

## 🔍 Troubleshooting

### Database errors
```bash
# Reset database
rm data/orchestrator.db
npm run db:push
```

### MCP server not connecting
```bash
# Check MCP server directly
tsx server/mcp/server.ts

# Should output: "AI Dev Orchestrator MCP Server running"
```

### Google Tasks OAuth issues
- Ensure redirect URI is `http://localhost:3001/api/google-tasks/callback`
- Check client ID and secret are correct
- Clear browser cookies and try again

---

## 📈 Next Steps

1. ✅ **Everything is implemented!**
2. 🧪 **Run tests**: `npm test`
3. 🚀 **Deploy** (optional): Can deploy to production with OAuth
4. 📱 **Mobile monitoring**: Use Google Tasks app
5. 🤖 **IDE Integration**: Configure Cursor/Antigravity MCP

---

## 🎉 You're Done!

The orchestrator is now a **fully functional local-first system** with:
- Agent-to-agent communication
- Google Tasks monitoring
- MCP integration for IDEs
- Context management
- Automated testing

Run `npm run dev` and start orchestrating! 🚀
