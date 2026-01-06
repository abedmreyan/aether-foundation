# AI Dev Orchestrator

Multi-agent AI development orchestration system that coordinates specialized AI agents for complex development tasks.

## 🚀 Quick Start

```bash
cd /Users/abedmreyan/Desktop/aether_-foundation/ai_dev_orchestrator
export AETHER_PROJECT_PATH=/Users/abedmreyan/Desktop/aether_-foundation
npm run dev
# Frontend: http://localhost:3002
```

## ✅ Features

| Feature | Status |
|---------|--------|
| SQLite database (local-first) | ✅ |
| 8 AI agents with specializations | ✅ |
| Agent-to-agent messaging | ✅ |
| Google Tasks integration | ✅ |
| MCP server for IDE integration | ✅ |
| Task approval workflow | ✅ |
| Project import from local paths | ✅ |
| Real-time project analysis | ✅ |
| Context-aware help system | ✅ |

## 📁 Project Structure

```
ai_dev_orchestrator/
├── client/               # React frontend
│   └── src/pages/        # UI pages
├── server/               # Node.js backend
│   ├── agents/           # AI agent logic
│   ├── services/         # Business logic
│   ├── routers/          # tRPC endpoints
│   └── mcp/              # MCP server
├── drizzle/              # Database schema
├── data/                 # SQLite database
├── .agent/               # AI context files
└── tests/                # Test files
```

## 🤖 For AI Agents

Read these files in order:
1. `.agent/context.md` - Project overview
2. `.agent/file-index.md` - Task-to-file lookup
3. `.agent/current-work.md` - Current priorities

## 🔧 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build  
npm test             # Run tests
npm run db:push      # Push schema changes
```

## 📖 Documentation

- **Setup Guide:** See `SETUP.md` for detailed configuration
- **Google Tasks:** See `GOOGLE_TASKS_INTEGRATION.md`
- **Deployment:** See `DEPLOYMENT_GUIDE.md`

## 🔗 Integration

This orchestrator integrates with:
- **Aether Foundation** - CRM project at `../`
- **Aether Support** - Support portal at `../aether-support/`
- **Cursor/Antigravity** - IDE via MCP server

See `../.agent/cross-project-integration.md` for details.

---

*Built with React, TypeScript, tRPC, SQLite*
