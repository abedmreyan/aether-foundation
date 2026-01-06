# File Index - AI Dev Orchestrator

Quick lookup for common development tasks.

---

## Frontend

| Task | Files |
|------|-------|
| Add page | `client/src/pages/*.tsx`, `client/src/App.tsx` (routes) |
| Add component | `client/src/components/*.tsx` |
| Modify navigation | `client/src/App.tsx` |
| Add Shadcn component | `npx shadcn-ui@latest add [component]` |

### Key Pages
- `Projects.tsx` - Project list, import local projects
- `ProjectDetail.tsx` - Project view with tasks, status
- `TaskApproval.tsx` - Task management and approval
- `Agents.tsx` - Agent list and status
- `Help.tsx` - Help center with prompt generator

---

## Backend

| Task | Files |
|------|-------|
| Add tRPC endpoint | `server/routers.ts` or `server/routers/*.ts` |
| Add database table | `drizzle/schema-sqlite.ts`, then `npm run db:push` |
| Add service | `server/services/*.ts` |
| Add agent capability | `server/agents/*.ts` |

### Key Routers
- `projects` - Project CRUD, import, context
- `tasks` - Task CRUD, status updates
- `agents` - Agent list, status
- `proposals` - Proposal review workflow
- `agentMessages` - Inter-agent communication
- `googleTasks` - Google Tasks sync
- `orchestration` - Project workflow control
- `taskExport` - Task file generation

---

## Database

| Task | Files |
|------|-------|
| Modify schema | `drizzle/schema-sqlite.ts` |
| Add query | `server/db-sqlite.ts` |
| Reset database | `rm data/orchestrator.db && npm run db:push` |

### Key Tables
- `users` - User accounts
- `projects` - Development projects
- `agents` - AI agents
- `tasks` - Work items
- `proposals` - Strategy/design proposals
- `agentMessages` - Inter-agent messages
- `knowledge` - Project knowledge base

---

## MCP Server

| Task | Files |
|------|-------|
| Add MCP tool | `server/mcp/mcpServer.ts` |
| Configure MCP | `.cursor/mcp.json` or Dev MCP config |

### Available Tools
- `orchestrator_get_next_task`
- `orchestrator_complete_task`
- `orchestrator_ask_agent`
- `orchestrator_report_progress`
- `orchestrator_get_context`

---

## Configuration

| File | Purpose |
|------|---------|
| `.env` | Environment variables |
| `drizzle.config.ts` | Drizzle ORM config |
| `vite.config.ts` | Vite bundler config |
| `tsconfig.json` | TypeScript config |
