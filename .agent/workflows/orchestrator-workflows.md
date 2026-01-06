# AI Dev Orchestrator - Multi-Step Workflows

This directory contains comprehensive workflows for the Aether AI development team to handle complex tasks in the Aether Foundation and Aether Support projects.

## 🤖 Agent Roles

| Agent | Role | Specialization |
|-------|------|----------------|
| **Orchestrator** | Coordinator | Task delegation, workflow management, agent coordination |
| **PM Agent** | Project Manager | Planning, requirements, roadmap, stakeholder communication |
| **Research Agent** | Research | Market analysis, best practices, technology evaluation |
| **Architecture Agent** | Architecture | System design, types, schemas, module structure |
| **Frontend Agent** | Frontend | React/TypeScript, UI/UX, components, styling |
| **Backend Agent** | Backend | APIs, services, database queries, business logic |
| **DevOps Agent** | DevOps | Deployment, CI/CD, monitoring, infrastructure |
| **QA Agent** | QA | Testing, debugging, validation, quality assurance |

---

## 📁 Workflow Categories

### 🚀 Feature Development
- [full-feature.md](./feature-development/full-feature.md) - End-to-end feature implementation
- [new-api-endpoint.md](./feature-development/new-api-endpoint.md) - Creating new API endpoints
- [new-ui-component.md](./feature-development/new-ui-component.md) - Building UI components
- [new-entity-type.md](./feature-development/new-entity-type.md) - Adding CRM entity types
- [new-pipeline.md](./feature-development/new-pipeline.md) - Creating pipeline configurations
- [database-schema-change.md](./feature-development/database-schema-change.md) - Schema modifications

### 🔧 Maintenance
- [bug-fix.md](./maintenance/bug-fix.md) - Bug investigation and fixing
- [performance-optimization.md](./maintenance/performance-optimization.md) - Performance improvements
- [security-fix.md](./maintenance/security-fix.md) - Security vulnerability fixes
- [refactoring.md](./maintenance/refactoring.md) - Code refactoring workflows
- [dependency-update.md](./maintenance/dependency-update.md) - Package updates

### 🔌 Integration
- [third-party-integration.md](./integration/third-party-integration.md) - External service integration
- [deployment.md](./integration/deployment.md) - Deployment workflows
- [database-migration.md](./integration/database-migration.md) - Database migrations
- [mcp-tool-integration.md](./integration/mcp-tool-integration.md) - MCP tool setup

### ✅ Testing
- [feature-testing.md](./testing/feature-testing.md) - Feature test coverage
- [regression-testing.md](./testing/regression-testing.md) - Regression test suite
- [e2e-testing.md](./testing/e2e-testing.md) - End-to-end testing
- [load-testing.md](./testing/load-testing.md) - Performance/load testing

### 🔀 Cross-Cutting
- [permission-change.md](./cross-cutting/permission-change.md) - RBAC modifications
- [multi-tenant-feature.md](./cross-cutting/multi-tenant-feature.md) - Multi-tenant features
- [documentation.md](./cross-cutting/documentation.md) - Documentation updates
- [code-review.md](./cross-cutting/code-review.md) - Code review process
- [onboarding-new-customer.md](./cross-cutting/onboarding-new-customer.md) - Customer setup

---

## 🔄 Workflow Lifecycle

```
1. Task Created (PM/Orchestrator)
        ↓
2. Task Decomposed (PM Agent)
        ↓
3. Tasks Assigned (Orchestrator)
        ↓
4. Research Phase (Research Agent) - if needed
        ↓
5. Design Phase (Architecture Agent)
        ↓
6. Implementation (Frontend/Backend Agents)
        ↓
7. Testing (QA Agent)
        ↓
8. Deployment (DevOps Agent)
        ↓
9. Validation & Approval (Product Owner)
```

---

## 📋 Task JSON Structure

Each task follows this structure:

```json
{
  "id": "task-uuid",
  "projectId": 1,
  "title": "Task Title",
  "description": "Detailed description",
  "status": "pending|assigned|in_progress|completed|blocked",
  "workflow": "feature-development/full-feature",
  "currentStep": 3,
  "totalSteps": 12,
  "assignedAgentId": 5,
  "dependencies": [123, 124],
  "context": {
    "workflows": ["./workflows/feature-development/full-feature.md"],
    "docs": [".agent/context.md", ".agent/architecture.md"],
    "relatedFiles": ["src/components/Feature.tsx"]
  },
  "steps": [
    {
      "step": 1,
      "agent": "research",
      "action": "Research best practices",
      "status": "completed"
    }
  ],
  "metadata": {
    "priority": "high",
    "estimatedHours": 8,
    "googleTaskId": "xyz123"
  }
}
```

---

## 🎯 Using Workflows

### For Orchestrator

1. **Receive task** from user or PM Agent
2. **Select appropriate workflow** based on task type
3. **Decompose into steps** following the workflow
4. **Assign agents** to each step
5. **Monitor progress** and handle blockers
6. **Coordinate handoffs** between agents

### For Individual Agents

1. **Check assigned tasks** in the queue
2. **Load workflow context** from `context.workflows`
3. **Execute current step** following workflow instructions
4. **Update progress** percentage and status
5. **Report blockers** if encountered
6. **Hand off** to next agent when complete

---

## 🔗 Integration with Projects

### Aether Foundation (CRM)
- Path: `/Users/abedmreyan/Desktop/aether_-foundation`
- Focus: Multi-tenant CRM, pipelines, RBAC
- Key agents: Frontend, Backend, Permissions

### Aether Support (Help Desk)
- Path: `/Users/abedmreyan/Desktop/aether_-foundation/aether-support`
- Focus: Ticket management, knowledge base, SLA
- Key agents: Frontend, Backend, DevOps

---

## 📊 Workflow Metrics

Track these for continuous improvement:

- **Time per step** - Identify bottlenecks
- **Blocker frequency** - Common failure points
- **Handoff delays** - Agent coordination issues
- **Revision count** - Quality of initial work

---

## 🆘 When to Create New Workflows

Create a new workflow when:
- A task type is repeated 3+ times
- Current workflows don't cover the use case
- Complex multi-agent coordination is needed
- Specific project requirements differ significantly

Workflow template:

```markdown
# Workflow Title

## Overview
Brief description

## Agents Involved
- Primary: Agent Name
- Supporting: Agent Names

## Prerequisites
- What must be ready

## Steps
1. Step with agent assignment
2. Step with validation

## Validation
- Build passes
- Tests pass
- Manual verification

## Handoff Points
- Agent A → Agent B: Condition
```

