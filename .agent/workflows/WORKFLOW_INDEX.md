# Workflow Index

Quick reference for all available workflows in the AI Dev Orchestrator.

---

## 🔍 Find the Right Workflow

### By Task Type

| Task | Workflow | Agents |
|------|----------|--------|
| Build a complete feature | [Full Feature](./feature-development/full-feature.md) | All |
| Create new API endpoint | [New API Endpoint](./feature-development/new-api-endpoint.md) | Backend, QA |
| Build UI component | [New UI Component](./feature-development/new-ui-component.md) | Frontend, QA |
| Add CRM entity type | [New Entity Type](./feature-development/new-entity-type.md) | Architecture, Backend, Frontend |
| Modify database schema | [Database Schema Change](./feature-development/database-schema-change.md) | Backend, DevOps |
| Fix a bug | [Bug Fix](./maintenance/bug-fix.md) | QA, Backend/Frontend |
| Improve performance | [Performance Optimization](./maintenance/performance-optimization.md) | All |
| Refactor code | [Refactoring](./maintenance/refactoring.md) | Architecture, Backend/Frontend |
| Integrate external service | [Third-Party Integration](./integration/third-party-integration.md) | Backend, DevOps |
| Deploy to production | [Deployment](./integration/deployment.md) | DevOps |
| Add MCP tool | [MCP Tool Integration](./integration/mcp-tool-integration.md) | Backend |
| Test a feature | [Feature Testing](./testing/feature-testing.md) | QA |
| Run E2E tests | [E2E Testing](./testing/e2e-testing.md) | QA, DevOps |
| Change permissions | [Permission Change](./cross-cutting/permission-change.md) | Backend, Architecture |
| Add multi-tenant feature | [Multi-Tenant Feature](./cross-cutting/multi-tenant-feature.md) | Architecture, Backend |
| Onboard new customer | [Customer Onboarding](./cross-cutting/onboarding-new-customer.md) | All |

---

## 📂 By Category

### Feature Development
- [Full Feature](./feature-development/full-feature.md) - End-to-end feature implementation
- [New API Endpoint](./feature-development/new-api-endpoint.md) - Create tRPC endpoints
- [New UI Component](./feature-development/new-ui-component.md) - Build React components
- [New Entity Type](./feature-development/new-entity-type.md) - Add CRM entity types
- [Database Schema Change](./feature-development/database-schema-change.md) - Schema modifications

### Maintenance
- [Bug Fix](./maintenance/bug-fix.md) - Bug investigation and fixing
- [Performance Optimization](./maintenance/performance-optimization.md) - Speed improvements
- [Refactoring](./maintenance/refactoring.md) - Code quality improvements

### Integration
- [Third-Party Integration](./integration/third-party-integration.md) - External APIs/services
- [Deployment](./integration/deployment.md) - Deploy to Netlify/GCP Cloud Run
- [MCP Tool Integration](./integration/mcp-tool-integration.md) - AI tool integration

### Testing
- [Feature Testing](./testing/feature-testing.md) - Unit/integration tests
- [E2E Testing](./testing/e2e-testing.md) - End-to-end tests with Playwright

### Cross-Cutting
- [Permission Change](./cross-cutting/permission-change.md) - RBAC modifications
- [Multi-Tenant Feature](./cross-cutting/multi-tenant-feature.md) - Tenant isolation
- [Customer Onboarding](./cross-cutting/onboarding-new-customer.md) - New tenant setup

---

## 🤖 By Primary Agent

### Orchestrator Agent
- Task delegation across all workflows
- Workflow selection based on task type
- Progress monitoring

### PM Agent
- [Full Feature](./feature-development/full-feature.md) (Step 1: Requirements)
- [Customer Onboarding](./cross-cutting/onboarding-new-customer.md) (Training)

### Research Agent
- [Full Feature](./feature-development/full-feature.md) (Step 2: Research)
- [Third-Party Integration](./integration/third-party-integration.md) (Step 1: Research)

### Architecture Agent
- [Full Feature](./feature-development/full-feature.md) (Step 3: Design)
- [New Entity Type](./feature-development/new-entity-type.md) (Step 1-2)
- [Database Schema Change](./feature-development/database-schema-change.md) (Step 1-2)
- [Refactoring](./maintenance/refactoring.md)
- [Permission Change](./cross-cutting/permission-change.md) (Steps 1-3)
- [Multi-Tenant Feature](./cross-cutting/multi-tenant-feature.md) (Steps 1-2)

### Frontend Agent
- [New UI Component](./feature-development/new-ui-component.md) (Primary)
- [Full Feature](./feature-development/full-feature.md) (Step 6)
- [Performance Optimization](./maintenance/performance-optimization.md) (Step 3)

### Backend Agent
- [New API Endpoint](./feature-development/new-api-endpoint.md) (Primary)
- [Database Schema Change](./feature-development/database-schema-change.md) (Steps 3-7)
- [Third-Party Integration](./integration/third-party-integration.md) (Steps 4-7)
- [MCP Tool Integration](./integration/mcp-tool-integration.md) (Primary)

### DevOps Agent
- [Deployment](./integration/deployment.md) (Primary)
- [Customer Onboarding](./cross-cutting/onboarding-new-customer.md) (Steps 1, 6, 10)

### QA Agent
- [Bug Fix](./maintenance/bug-fix.md) (Primary)
- [Feature Testing](./testing/feature-testing.md) (Primary)
- [E2E Testing](./testing/e2e-testing.md) (Primary)
- All workflows (Testing steps)

---

## ⏱️ By Duration

### Quick (< 2 hours)
- [New UI Component](./feature-development/new-ui-component.md)
- [New API Endpoint](./feature-development/new-api-endpoint.md)
- [Permission Change](./cross-cutting/permission-change.md)

### Medium (2-8 hours)
- [Bug Fix](./maintenance/bug-fix.md)
- [Database Schema Change](./feature-development/database-schema-change.md)
- [New Entity Type](./feature-development/new-entity-type.md)
- [Third-Party Integration](./integration/third-party-integration.md)
- [Feature Testing](./testing/feature-testing.md)

### Long (8+ hours)
- [Full Feature](./feature-development/full-feature.md)
- [Performance Optimization](./maintenance/performance-optimization.md)
- [Refactoring](./maintenance/refactoring.md)
- [E2E Testing](./testing/e2e-testing.md) (initial setup)
- [Customer Onboarding](./cross-cutting/onboarding-new-customer.md)

---

## 🎯 Common Scenarios

### "I need to add a new field to the CRM"
→ [New Entity Type](./feature-development/new-entity-type.md) (Step 3: Pipeline Configuration)

### "I need to create a new page with data from API"
→ [New API Endpoint](./feature-development/new-api-endpoint.md) + [New UI Component](./feature-development/new-ui-component.md)

### "Users are reporting a bug"
→ [Bug Fix](./maintenance/bug-fix.md)

### "The app is slow"
→ [Performance Optimization](./maintenance/performance-optimization.md)

### "We need to integrate with a new service"
→ [Third-Party Integration](./integration/third-party-integration.md)

### "We have a new customer to onboard"
→ [Customer Onboarding](./cross-cutting/onboarding-new-customer.md)

### "I need to change who can see what"
→ [Permission Change](./cross-cutting/permission-change.md)

### "I need to add a feature that's different per customer"
→ [Multi-Tenant Feature](./cross-cutting/multi-tenant-feature.md)

### "I need to deploy changes"
→ [Deployment](./integration/deployment.md)

---

## 📊 Workflow Statistics

| Category | Count | Avg Duration |
|----------|-------|--------------|
| Feature Development | 5 | 4-8 hours |
| Maintenance | 3 | 2-6 hours |
| Integration | 3 | 4-8 hours |
| Testing | 2 | 4-8 hours |
| Cross-Cutting | 3 | 4-12 hours |
| **Total** | **16** | **4-8 hours** |

---

## 📝 Creating New Workflows

When creating a new workflow:

1. **Choose category** from existing folders
2. **Use template** from README.md
3. **Define agents** and their responsibilities
4. **Include validation** steps
5. **Add to this index**

Template structure:
```markdown
# Workflow Title

## Overview
Brief description

## Agents Involved
| Phase | Primary Agent | Supporting |

## Prerequisites
- [ ] Checklist items

## Steps
Detailed steps with code examples

## Validation Checklist

## Files Modified
```

