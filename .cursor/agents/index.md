# Agent Index

Quick reference for all Cursor agents.

---

## Available Agents

### Research & Design
| Agent | File | Use For |
|-------|------|---------|
| **Researcher** | `researcher.md` | Market research, feature discovery |
| **UX Designer** | `ux-designer.md` | Interface design, layouts, UX |

### Development
| Agent | File | Use For |
|-------|------|---------|
| **Coordinator** | `coordinator.md` | **Complex tasks, multi-agent orchestration** |
| **Architect** | `architect.md` | System design, types, refactoring |
| **Frontend** | `frontend.md` | UI components, styling |
| **Services** | `services.md` | Database, context, business logic |
| **Pipeline** | `pipeline.md` | Pipeline config, views |
| **Permissions** | `permissions.md` | RBAC, access control |

### Operations
| Agent | File | Use For |
|-------|------|---------|
| **DevOps** | `devops.md` | Deployment, CI/CD, infrastructure |
| **QA** | `qa.md` | Testing, debugging |

---

## Aether Ecosystem Projects

| Project | Path | Purpose |
|---------|------|---------|
| **Aether Foundation** | `/` (root) | CRM platform |
| **Aether Support** | `/aether-support/` | Communication platform |

### When Working on Aether Support
1. Read `aether-support/.agent/context.md` first
2. Use `pnpm` (not npm!)
3. Different port: 3000 (not 5173)
4. Check `aether-support/.agent/file-index.md` for files

---

## Task → Agent Mapping

| Task | Agent |
|------|-------|
| Research a feature idea | Researcher |
| Design a new page layout | UX Designer |
| Add new component | Frontend |
| Add pipeline field | Pipeline |
| Change permissions | Permissions |
| Fix bugs / test | QA |
| Add types / refactor | Architect |
| Database / API work | Services |
| Deploy / infrastructure | DevOps |

---

## Workflow: New Feature

```
1. Researcher → Research the feature
2. UX Designer → Design the interface
3. Architect → Plan types and structure
4. Frontend/Services/Pipeline → Implement
5. QA → Test locally
6. DevOps → Deploy to staging/production
```

---

## Infrastructure Stack

| Layer | Aether Foundation | Aether Support |
|-------|-------------------|----------------|
| Frontend | Netlify | (TBD) |
| Backend | Azure | Node.js (migrating to Azure) |
| Database | Azure PostgreSQL | MySQL (migrating to Azure) |
| Real-time | — | Socket.io |
| Version Control | GitHub | GitHub |
