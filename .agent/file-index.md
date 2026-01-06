# File Index - Quick Task-to-File Lookup

> **AI Agents**: Use this file to find exactly what files to read/edit for your task.
> Don't load the entire codebase - use this index first!

---

## 🎯 Quick Lookup by Task

| Task | Primary Files | Also Consider |
|------|---------------|---------------|
| **Add pipeline field** | `services/platformDatabase.ts` | `types/pipeline.ts`, `types/crm.ts` |
| **Change permissions** | `services/permissions/roleDefaults.ts` | `services/permissions/accessControl.ts` |
| **Add UI component** | `components/<type>/<Name>.tsx` | `components/<type>/index.ts` |
| **Modify login/auth** | `context/AuthContext.tsx` | `pages/Landing.tsx` |
| **Entity CRUD** | `services/customerDatabase.ts` | `context/CRMContext.tsx` |
| **Pipeline views** | `components/PipelineKanban.tsx`, `components/PipelineTable.tsx` | — |
| **Navigation/sidebar** | `components/navigation/` | `components/navigation/config.ts` |
| **Settings page** | `components/settings/` | `pages/Settings.tsx` |

---

## 📁 Folder Purpose Reference

| Folder | What Goes Here | Entry Point |
|--------|----------------|-------------|
| `types/` | TypeScript interfaces & types | `types/index.ts` |
| `context/` | React Context providers | `context/index.ts` |
| `services/` | Business logic, DB adapters | `services/index.ts` |
| `components/` | React components | `components/index.ts` |
| `pages/` | Full page components | Imported by `App.tsx` |
| `.agent/` | AI agent documentation | `agents.md` (root) |

---

## 🔍 Finding Specific Functionality

### Pipeline Configuration
```
services/platformDatabase.ts     ← Pipeline definitions (stages, fields)
types/pipeline.ts               ← Pipeline type definitions
components/PipelineBuilder.tsx  ← Pipeline builder UI (large file!)
```

### Authentication & Users
```
context/AuthContext.tsx         ← Login/logout logic
services/platformDatabase.ts    ← User storage/retrieval
types/user.ts                   ← User type definitions
```

### Permissions (RBAC)
```
services/permissions/roleDefaults.ts    ← Default role permissions
services/permissions/accessControl.ts   ← Permission checking logic
services/permissions/dataFiltering.ts   ← Filter data by role
types/permissions.ts                    ← Permission types
```

### Database Adapters
```
services/database/adapters/LocalStorageAdapter.ts  ← Dev/sandbox
services/database/adapters/SupabaseAdapter.ts      ← Production
services/customerDatabase.ts                       ← Customer data operations
```

---

## 📏 File Sizes (for context budgeting)

| File | Lines | Notes |
|------|-------|-------|
| `PipelineBuilder.tsx` | ~900 | Large - avoid loading fully |
| `Landing.tsx` | ~800 | Large - login page |
| `platformDatabase.ts` | ~600 | Medium - has pipeline configs |
| `Dashboard.tsx` | ~350 | Medium |
| Most type files | <50 | Small - safe to load |

---

## ⚡ Minimal Context Loading

For simple tasks, load ONLY:
1. This file (`file-index.md`)
2. The specific file(s) listed for your task
3. Related type definitions if needed

**Skip loading** `architecture.md`, `state.md`, `conventions.md` for small edits.

---

## 🤖 AI Dev Orchestrator

The orchestrator is a separate project at `./ai_dev_orchestrator/` with its own `.agent/` context.

| Orchestrator Task | Files |
|-------------------|-------|
| Add orchestrator page | `ai_dev_orchestrator/client/src/pages/` |
| Add orchestrator API | `ai_dev_orchestrator/server/routers.ts` |
| Modify orchestrator DB | `ai_dev_orchestrator/drizzle/schema-sqlite.ts` |
| Add agent capability | `ai_dev_orchestrator/server/agents/` |

**For orchestrator work, read:**
- `ai_dev_orchestrator/.agent/context.md`
- `ai_dev_orchestrator/.agent/file-index.md`

**Cross-project integration:**
- `.agent/cross-project-integration.md`
- `.agent/agent-mapping.md`

