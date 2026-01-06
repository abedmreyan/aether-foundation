# AI Dev Orchestrator

## Overview
Multi-agent AI development orchestration system that coordinates specialized AI agents for complex development tasks.

## Tech Stack
- **Frontend:** React, TypeScript, Vite, Shadcn UI
- **Backend:** Node.js, tRPC, SQLite (Drizzle ORM)
- **AI:** DeepSeek API, Context Summarization
- **Integrations:** Google Tasks, MCP Server

## Directory Structure
```
ai_dev_orchestrator/
├── client/           # React frontend
│   ├── src/components/  # UI components
│   └── src/pages/       # Page components
├── server/           # Node.js backend
│   ├── agents/          # AI agent logic
│   ├── services/        # Business logic
│   ├── routers/         # tRPC routers
│   └── mcp/             # MCP server
├── drizzle/          # Database schema
├── data/             # SQLite database
└── tests/            # Test files
```

## Key Types
- **Project** - Development project with status, description
- **Agent** - AI specialist (PM, Frontend, Backend, etc.)
- **Task** - Work item assigned to agents
- **Proposal** - Strategy/design waiting for approval
- **Message** - Inter-agent communication

## Common Tasks

| Task | Files |
|------|-------|
| Add API endpoint | `server/routers.ts`, `drizzle/schema-sqlite.ts` |
| Add UI component | `client/src/components/`, `client/src/pages/` |
| Add agent capability | `server/agents/`, `server/services/` |
| Modify database | `drizzle/schema-sqlite.ts` |

## Build Commands
- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm test` - Run tests
- `npm run db:push` - Push schema to database

## Running
```bash
cd /Users/abedmreyan/Desktop/aether_-foundation/ai_dev_orchestrator
export AETHER_PROJECT_PATH=/Users/abedmreyan/Desktop/aether_-foundation
npm run dev
# Frontend: http://localhost:3002
```

## Integration with Aether Foundation
This orchestrator coordinates AI development for the Aether Foundation CRM project.
See `../`.agent/cross-project-integration.md` for integration details.
