# Agent Handoff Guidelines

When tasks require multiple specialists, use these handoff patterns.

## Handoff Format

```markdown
## HANDOFF TO: [Agent Name]

**From**: [Your Agent]
**Task**: [Brief description]
**Files involved**: [List files]
**What I completed**: [Your work]
**What's needed**: [Next steps]
**Context**: [Any important notes]
```

## Common Handoff Patterns

| Scenario | From | To |
|----------|------|------|
| New feature with types | Architect | Frontend/Services |
| UI needs data | Frontend | Services |
| CRUD needs permissions | Services | Permissions |
| New pipeline field | Pipeline | Permissions (if financial) |
| Any completed work | Any | QA |

## Agent Contact Summary

| Agent | Specialty |
|-------|-----------|
| **Architect** | Types, design, refactoring |
| **Frontend** | UI, components, styling |
| **Services** | Database, context, business logic |
| **Pipeline** | Pipeline config, Kanban/Table |
| **Permissions** | RBAC, access control |
| **QA** | Testing, debugging, verification |
