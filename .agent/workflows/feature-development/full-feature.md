# Full Feature Development Workflow

## Overview

End-to-end workflow for implementing a complete feature across frontend, backend, and database layers. This is the most comprehensive workflow used for significant new functionality.

## Agents Involved

| Phase | Primary Agent | Supporting Agents |
|-------|---------------|-------------------|
| Research | Research Agent | PM Agent |
| Design | Architecture Agent | Frontend, Backend |
| Frontend | Frontend Agent | Architecture |
| Backend | Backend Agent | Architecture |
| Testing | QA Agent | All |
| Deployment | DevOps Agent | QA |

## Prerequisites

- [ ] Feature requirements documented
- [ ] Product owner approval received
- [ ] Related context docs identified
- [ ] Dependencies mapped

---

## Phase 1: Research & Planning

### Step 1: Requirements Analysis
**Agent:** PM Agent  
**Duration:** 1-2 hours

```json
{
  "action": "analyze_requirements",
  "inputs": ["feature_request", "user_stories"],
  "outputs": ["requirements_doc", "acceptance_criteria"]
}
```

**Tasks:**
1. Parse feature request and extract requirements
2. Identify user stories and acceptance criteria
3. Map to existing system capabilities
4. Identify gaps and unknowns
5. Create preliminary task breakdown

**Deliverables:**
- Requirements document
- Acceptance criteria list
- Initial task estimates

---

### Step 2: Technical Research
**Agent:** Research Agent  
**Duration:** 2-4 hours

```json
{
  "action": "research_solutions",
  "inputs": ["requirements_doc"],
  "outputs": ["research_findings", "recommendations"]
}
```

**Tasks:**
1. Research similar implementations
2. Evaluate third-party libraries
3. Identify best practices
4. Document trade-offs
5. Recommend approach

**MCP Tools:**
- `perplexity_search` - External research
- `github_search` - Code examples
- `documentation_search` - Framework docs

**Deliverables:**
- Research findings document
- Technology recommendations
- Risk assessment

---

### Step 3: Architecture Design
**Agent:** Architecture Agent  
**Duration:** 2-4 hours

```json
{
  "action": "design_architecture",
  "inputs": ["requirements_doc", "research_findings"],
  "outputs": ["architecture_doc", "type_definitions"]
}
```

**Tasks:**
1. Design component architecture
2. Define TypeScript interfaces
3. Plan database schema changes
4. Map module dependencies
5. Create API contract

**Files to Create/Modify:**
```
types/
  └── [feature].ts          # New type definitions
services/
  └── [feature]/            # Service module structure
components/
  └── [feature]/            # Component structure
```

**Deliverables:**
- Architecture diagram
- Type definitions
- API specifications
- Database schema (if needed)

---

## Phase 2: Implementation

### Step 4: Database Setup (if needed)
**Agent:** Backend Agent  
**Duration:** 1-2 hours

```json
{
  "action": "implement_database",
  "inputs": ["architecture_doc"],
  "outputs": ["migrations", "schema_updates"]
}
```

**Tasks:**
1. Create migration files
2. Update Drizzle schema
3. Add seed data
4. Test migrations locally
5. Document schema changes

**Validation:**
```bash
npm run db:push
npm run db:migrate
```

---

### Step 5: Backend Implementation
**Agent:** Backend Agent  
**Duration:** 4-8 hours

```json
{
  "action": "implement_backend",
  "inputs": ["architecture_doc", "type_definitions"],
  "outputs": ["services", "routers", "tests"]
}
```

**Tasks:**
1. Create service layer
2. Implement tRPC routers
3. Add business logic
4. Handle error cases
5. Add logging

**Files to Create:**
```
server/services/[feature].ts
server/routers/[feature].ts
```

**Validation:**
```bash
npm run build
npm run test
```

---

### Step 6: Frontend Implementation
**Agent:** Frontend Agent  
**Duration:** 4-8 hours

```json
{
  "action": "implement_frontend",
  "inputs": ["architecture_doc", "type_definitions", "api_contracts"],
  "outputs": ["components", "pages", "styles"]
}
```

**Tasks:**
1. Create UI components
2. Implement page layouts
3. Connect to tRPC API
4. Add form validation
5. Handle loading/error states
6. Implement responsive design

**Files to Create:**
```
client/src/components/[feature]/
  ├── index.ts
  ├── [Feature].tsx
  └── [Feature].css
client/src/pages/[Feature].tsx
```

**Validation:**
```bash
npm run build
npm run dev  # Visual inspection
```

---

### Step 7: Permission Integration
**Agent:** Backend Agent  
**Duration:** 1-2 hours

```json
{
  "action": "implement_permissions",
  "inputs": ["requirements_doc"],
  "outputs": ["permission_rules", "role_updates"]
}
```

**Tasks:**
1. Define permission requirements
2. Add RBAC rules
3. Update role defaults
4. Add field-level permissions
5. Test permission enforcement

**Files to Modify:**
```
services/permissions/roleDefaults.ts
services/permissions/accessControl.ts
```

---

## Phase 3: Testing & Validation

### Step 8: Unit Testing
**Agent:** QA Agent  
**Duration:** 2-4 hours

```json
{
  "action": "write_unit_tests",
  "inputs": ["services", "components"],
  "outputs": ["test_files", "coverage_report"]
}
```

**Tasks:**
1. Write service unit tests
2. Write component tests
3. Test edge cases
4. Verify error handling
5. Check code coverage

**Files to Create:**
```
server/services/__tests__/[feature].test.ts
client/src/components/[feature]/__tests__/[Feature].test.tsx
```

**Validation:**
```bash
npm run test
npm run test:coverage
```

---

### Step 9: Integration Testing
**Agent:** QA Agent  
**Duration:** 2-4 hours

```json
{
  "action": "write_integration_tests",
  "inputs": ["routers", "pages"],
  "outputs": ["integration_tests"]
}
```

**Tasks:**
1. Test API endpoints end-to-end
2. Test user flows
3. Verify data persistence
4. Test multi-tenant isolation
5. Test permission enforcement

---

### Step 10: Manual Testing
**Agent:** QA Agent  
**Duration:** 1-2 hours

```json
{
  "action": "manual_testing",
  "inputs": ["acceptance_criteria"],
  "outputs": ["test_results", "bug_reports"]
}
```

**Tasks:**
1. Test against acceptance criteria
2. Test edge cases
3. Test error scenarios
4. Cross-browser testing
5. Mobile responsiveness

**Checklist:**
- [ ] All acceptance criteria met
- [ ] No console errors
- [ ] Forms validate correctly
- [ ] Error messages are user-friendly
- [ ] Loading states work
- [ ] Mobile layout correct

---

## Phase 4: Deployment

### Step 11: Pre-Deployment
**Agent:** DevOps Agent  
**Duration:** 1 hour

```json
{
  "action": "prepare_deployment",
  "inputs": ["migrations", "environment_config"],
  "outputs": ["deployment_plan"]
}
```

**Tasks:**
1. Review migration scripts
2. Update environment variables
3. Check dependency versions
4. Prepare rollback plan
5. Update deployment docs

---

### Step 12: Deployment & Validation
**Agent:** DevOps Agent  
**Duration:** 1-2 hours

```json
{
  "action": "deploy",
  "inputs": ["deployment_plan"],
  "outputs": ["deployment_confirmation"]
}
```

**Tasks:**
1. Deploy database migrations
2. Deploy backend changes
3. Deploy frontend changes
4. Run smoke tests
5. Monitor for errors

**Validation:**
```bash
# Health checks
curl https://api.example.com/health

# Smoke tests
npm run test:e2e:production
```

---

## Handoff Points

| From | To | Trigger |
|------|-----|---------|
| PM Agent | Research Agent | Requirements documented |
| Research Agent | Architecture Agent | Research complete |
| Architecture Agent | Backend Agent | Design approved |
| Backend Agent | Frontend Agent | APIs ready |
| Frontend Agent | QA Agent | Implementation complete |
| QA Agent | DevOps Agent | Tests passing |
| DevOps Agent | PM Agent | Deployment complete |

---

## Approval Gates

1. **Requirements Approval** - Product owner approves requirements
2. **Design Approval** - Technical lead approves architecture
3. **Code Review** - Peer review before merge
4. **QA Sign-off** - All tests passing
5. **Deployment Approval** - Final go/no-go decision

---

## Rollback Procedure

If issues are detected post-deployment:

1. **Immediate:** Revert to previous deployment
2. **Database:** Run down migrations
3. **Notify:** Alert stakeholders
4. **Investigate:** Root cause analysis
5. **Fix:** Create hotfix task

---

## Metrics to Track

- Total time per phase
- Blocker count and duration
- Test coverage percentage
- Bugs found in QA
- Post-deployment issues

