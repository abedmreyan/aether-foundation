# Documentation Standards

This document defines the systematic, standardised approach to documentation, context files, and project structure for Aether projects.

---

## Directory Structure

```
.agent/                 # AI agent context
├── context.md          # Project overview (REQUIRED)
├── architecture.md     # System design
├── conventions.md      # Coding standards
├── current-work.md     # Active tasks/progress
├── file-index.md       # Task-to-file lookup
├── agent-mapping.md    # Orchestrator↔IDE mapping
├── agent-orchestration.md  # Multi-agent guide
└── workflows/          # Step-by-step guides
    ├── WORKFLOW_INDEX.md
    ├── feature-development/
    ├── maintenance/
    ├── integration/
    └── testing/

.cursor/agents/         # Agent personas
├── coordinator.md
├── architect.md
├── frontend.md
├── services.md
├── devops.md
├── qa.md
└── index.md

.tasks/                 # Orchestrator integration
├── config.json         # Orchestrator settings
├── queue/              # Pending tasks
├── completed/          # Finished tasks
└── watcher.mjs         # Task sync script
```

---

## File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Context docs | `kebab-case.md` | `agent-orchestration.md` |
| Workflow files | `kebab-case.md` | `new-api-endpoint.md` |
| Agent personas | `kebab-case.md` | `ux-designer.md` |
| Task files | `task-{id}.json` | `task-abc123.json` |
| Config files | `camelCase.json` | `config.json` |

---

## Required Files

### Minimum for AI Agent Support

| File | Purpose |
|------|---------|
| `.agent/context.md` | Project overview, tech stack, folder structure |
| `.agent/file-index.md` | Quick task-to-file lookup |
| `.cursorrules` | Project-specific rules for Cursor |

### Recommended for Full Orchestration

| File | Purpose |
|------|---------|
| `.agent/current-work.md` | Track active/completed work |
| `.agent/architecture.md` | System design reference |
| `.agent/agent-orchestration.md` | Multi-agent coordination |
| `.tasks/config.json` | Orchestrator connection |

---

## Document Templates

### context.md Template

```markdown
# {Project Name}

## Overview
Brief project description and purpose.

## Tech Stack
- Framework: React/Next.js
- Backend: tRPC/Express
- Database: PostgreSQL/SQLite

## Directory Structure
- `/client` - Frontend
- `/server` - Backend
- `/drizzle` - Database schema

## Key Types
Important TypeScript types.

## Common Tasks
Quick reference for frequent operations.

## Build Commands
- `npm run dev` - Development
- `npm run build` - Production
```

### file-index.md Template

```markdown
# File Index

## Quick Lookup

| Task | Files |
|------|-------|
| Add UI component | `client/src/components/` |
| Add API endpoint | `server/routers.ts` |
| Update database | `drizzle/schema.ts` |
```

### Workflow Template

```markdown
# {Workflow Name}

## Overview
What this workflow accomplishes.

## Agents Involved
| Phase | Agent | Role |
|-------|-------|------|
| 1 | Architect | Design |
| 2 | Frontend | Implement |

## Prerequisites
- [ ] Requirement 1
- [ ] Requirement 2

## Steps
### 1. Step Title
**Agent:** Frontend
Description and instructions.

## Validation
- [ ] Build passes
- [ ] Tests pass

## Files Modified
List of typical files changed.
```

---

## Freshness Guidelines

| Doc Type | Update Frequency | Staleness Threshold |
|----------|------------------|---------------------|
| `context.md` | Major changes | 30 days |
| `architecture.md` | Design changes | 60 days |
| Workflows | As needed | 90 days |
| `current-work.md` | Daily when active | 7 days |
| `file-index.md` | New files added | 30 days |

---

## Version Control

### What to Commit
- All `.agent/` files
- `.cursorrules`
- Workflow definitions

### What to Ignore
- `.tasks/queue/*` (transient)
- `.tasks/current-task.json` (transient)
- Personal IDE settings

---

## Cross-Project Standards

When working across multiple projects:

1. **Maintain consistency** - Same structure in all projects
2. **Use absolute paths** in cross-project references
3. **Document dependencies** in `ecosystem.md`
4. **Share workflows** via symlinks or references

---

*Last Updated: 2025-12-18*
