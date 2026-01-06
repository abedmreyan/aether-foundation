# Aether Foundation - AI Agent Instructions

> **IMPORTANT**: Read this file completely before starting any task.

## Quick Start for AI Agents

When you first start working on this project, follow these steps:

### 1. Read Core Documentation

**For SMALL tasks** (single file edits, simple fixes):
```
.agent/file-index.md   ← Task-to-file lookup (START HERE for quick tasks)
```

**For LARGER tasks** (new features, multi-file changes):
```
.agent/context.md      ← Project overview, directory structure, types
.agent/architecture.md ← System design, data flows, dependencies
.agent/state.md        ← State management, context providers
.agent/conventions.md  ← Coding standards and patterns
.agent/current-work.md ← Current sprint priorities and progress
```

### 2. Check Available Workflows

Use these slash commands for common tasks:
- `/add-component` - Adding new UI components
- `/add-pipeline-field` - Adding fields to pipelines
- `/modify-permissions` - Changing RBAC rules
- `/test-locally` - Running and testing the app

### 3. Update Progress Tracking

**Before starting work:**
1. Read `.agent/current-work.md` to understand priorities
2. Add your task to the "Active Tasks" section
3. Update status as you work

**After completing work:**
1. Mark task as complete in `.agent/current-work.md`
2. Add summary to "Completed Work" section
3. Note any follow-up items

---

## Project Quick Facts

| Item | Value |
|------|-------|
| **Stack** | React + TypeScript + Vite |
| **Run** | `npm run dev` |
| **Build** | `npm run build` |
| **Port** | `http://localhost:5173` |
| **Test Login** | admin@ajnabi.com / admin123 |

---

## Key Files Reference

| Purpose | Location |
|---------|----------|
| Types | `types/*.ts` |
| Context hooks | `context/*.tsx` |
| Database services | `services/database/` |
| Permissions | `services/permissions/` |
| UI components | `components/ui/` |
| Pages | `pages/*.tsx` |

---

## Agent Responsibilities

### DO

- ✅ Read `.agent/` documentation before starting
- ✅ Update `.agent/current-work.md` with progress
- ✅ Run `npm run build` to verify changes
- ✅ Use TypeScript types from `types/` folder
- ✅ Check permissions before rendering sensitive data
- ✅ Follow patterns in `.agent/conventions.md`

### DON'T

- ❌ Skip reading context documentation
- ❌ Make changes without updating current-work.md
- ❌ Create files outside established directory structure
- ❌ Use `any` type without justification
- ❌ Forget to export from barrel files

---

## Getting Help

1. **Can't find something?** Check `types/index.ts` for exports
2. **Authentication issues?** Clear localStorage and refresh
3. **Build errors?** Check TypeScript errors in terminal
4. **Confused about architecture?** Read `.agent/architecture.md`

---

## Maintaining Agent Documentation

These files should be kept up-to-date:

| File | Update When |
|------|-------------|
| `current-work.md` | Every task start/complete |
| `context.md` | Adding new modules or changing structure |
| `architecture.md` | Changing system design |
| `conventions.md` | Adding new coding patterns |
| Workflow files | Adding new procedures |
