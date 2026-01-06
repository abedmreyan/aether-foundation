# Agent Mapping: Orchestrator ↔ Cursor

This document defines how agents from the AI Dev Orchestrator map to Cursor agents.

---

## Agent Mapping Table

| Orchestrator Agent | Cursor Agent | Notes |
|-------------------|--------------|-------|
| Project Manager | Coordinator | Task routing & planning |
| Architect | Architect | System design, types, refactoring |
| Frontend Developer | Frontend | UI components, React/TypeScript |
| Backend Developer | Services | Database, APIs, business logic |
| DevOps Engineer | DevOps | Deployment, CI/CD, infrastructure |
| QA Engineer | QA | Testing, debugging, validation |
| Technical Writer | Architect | Docs + architecture knowledge |
| Security Specialist | Architect | Security audits + system design |

---

## Specialized Cursor Agents

These Cursor agents don't have direct orchestrator equivalents:

| Cursor Agent | Purpose | When to Use |
|-------------|---------|-------------|
| Pipeline | CRM pipeline configuration | Add/modify stages, fields |
| Permissions | RBAC & access control | Permission changes |
| UX Designer | Design decisions | UI/UX improvements |
| Researcher | Market research | Technology evaluation |

---

## Role Descriptions

### Orchestrator Agents

**Project Manager**
- Task planning and decomposition
- Stakeholder communication
- Roadmap management
- Progress tracking

**Architect**
- System design
- Type definitions
- Module structure
- Design patterns

**Frontend Developer**
- React components
- UI/UX implementation
- Client-side logic
- Styling

**Backend Developer**
- API endpoints
- Database queries
- Business logic
- Server-side services

**DevOps Engineer**
- Deployment pipelines
- Infrastructure as code
- Monitoring & logging
- CI/CD automation

**QA Engineer**
- Test planning & execution
- Bug reproduction
- Quality assurance
- Validation

**Technical Writer**
- API documentation
- User guides
- Code comments
- Architecture docs

**Security Specialist**
- Security audits
- Vulnerability assessment
- Secure coding practices
- Auth/authz implementation

### Cursor-Only Agents

**Pipeline**
- CRM pipeline configuration
- Stage definitions
- Field management
- View customization

**Permissions**
- Role definitions
- Permission matrices
- Data filtering
- Access control logic

**UX Designer**
- User experience design
- Design system
- Accessibility
- Visual aesthetics

**Researcher**
- Technology evaluation
- Best practices research
- Market analysis
- Competitive analysis

---

## Routing Logic

### When Orchestrator assigns a task:

1. **Check assigned agent ID** in task JSON
2. **Map to Cursor agent** using table above
3. **Load agent context** from `.cursor/agents/{agent}.md`
4. **Pass task with context** to mapped agent

### Example:

```json
{
  "assignedAgentId": 3,  // Frontend Developer
  "task": "Add priority badge to student cards"
}
```

→ Maps to `Frontend` agent
→ Loads `.cursor/agents/frontend.md`
→ Invokes: `@Frontend Add priority badge to student cards`

---

## Cross-Project Context

### Aether Foundation (CRM)
Primary agents: Pipeline, Frontend, Services, Permissions

### Aether Support (Help Desk)
Primary agents: Frontend, Services, DevOps

### Shared Integration Work
Uses: Coordinator, Architect, DevOps

---

## Future Enhancements

- [ ] Dynamic agent selection based on file patterns
- [ ] Multi-agent collaboration for complex tasks
- [ ] Agent specialization learning
- [ ] Custom agent creation per project

---

**Created:** 2025-12-18
**Last Updated:** 2025-12-18
