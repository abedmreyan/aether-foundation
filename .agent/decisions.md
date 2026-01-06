# Decision Log

Architectural and design decisions made during development. Reference before proposing changes.

---

## Format

```markdown
### [Date] Decision Title
**Context**: Why this came up
**Decision**: What was decided
**Rationale**: Why this choice
**Alternatives Considered**: What else was evaluated
```

---

## Decisions

### [2024-12-13] Use localStorage for Development
**Context**: Need fast iteration without backend setup.
**Decision**: LocalStorage adapter for development, Supabase for production.
**Rationale**: Faster feedback loop, no external dependencies during dev.
**Alternatives**: SQLite, in-memory store.

---

### [2024-12-13] Modular Component Structure
**Context**: AI agents were struggling with large files.
**Decision**: Break components into small, focused files with barrel exports.
**Rationale**: Easier for AI to understand and modify specific pieces.
**Alternatives**: Monolithic files (rejected - too hard to navigate).

---

### [2024-12-13] Barrel Exports for All Folders
**Context**: Import statements were getting messy.
**Decision**: Every folder has `index.ts` that re-exports everything.
**Rationale**: Cleaner imports, easier refactoring.
**Alternatives**: Direct imports (rejected - harder to refactor).

---

### [2024-12-13] RBAC at Field Level
**Context**: Different roles need different data visibility.
**Decision**: Fields have `isFinancial` flag, filtered by role.
**Rationale**: Granular control without complex permission matrices.
**Alternatives**: Entity-level permissions (too coarse).

---

### [2024-12-15] Multi-Agent Cursor Team
**Context**: Single agent trying to do everything was inefficient.
**Decision**: 6 specialized agents (Architect, Frontend, Services, Pipeline, Permissions, QA).
**Rationale**: Focused expertise, smaller context windows, clearer handoffs.
**Alternatives**: Single generalist agent (rejected - context overload).

---

## Adding New Decisions

When making significant architectural choices:
1. Add entry to this file
2. Include context, decision, rationale, alternatives
3. Date the entry
