# Permission Change Workflow

## Overview

Workflow for safely modifying RBAC (Role-Based Access Control) permissions in the Aether platform. Permission changes are sensitive and require careful planning, testing, and validation.

## Agents Involved

| Phase | Primary Agent | Supporting |
|-------|---------------|------------|
| Requirements | PM Agent | Architecture |
| Design | Architecture Agent | Backend |
| Implementation | Backend Agent | Frontend |
| Testing | QA Agent | Backend |
| Review | Architecture Agent | PM |

## Prerequisites

- [ ] Permission change requirements defined
- [ ] Affected roles identified
- [ ] Current permission audit complete
- [ ] Test cases prepared

---

## Step 1: Permission Audit
**Agent:** Architecture Agent  
**Duration:** 30-60 minutes

**Current Permissions Matrix:**

```markdown
## Current Permission Audit

### Roles
| Role | Description |
|------|-------------|
| admin | Full system access |
| dev | Development features access |
| management | Financial and reports access |
| sales | Lead and customer access |
| support | Customer support access |
| team | Basic team member access |

### Pipeline Permissions
| Role | Students | Tutors | Packages | Leads |
|------|----------|--------|----------|-------|
| admin | CRUD+F | CRUD+F | CRUD+F | CRUD+F |
| management | R+F | R+F | CRUD+F | CRUD+F |
| sales | CRUD | - | R | CRUD+F |
| support | R | R | R | R |

Legend: C=Create, R=Read, U=Update, D=Delete, F=Financial

### Feature Permissions
| Role | Settings | Reports | AI Console | Agents |
|------|----------|---------|------------|--------|
| admin | ✓ | ✓ | ✓ | ✓ |
| dev | ✓ | ✓ | ✓ | R |
| management | - | ✓ | - | - |
| sales | - | Own | - | - |
| support | - | Own | - | - |
```

---

## Step 2: Change Specification
**Agent:** PM Agent  
**Duration:** 30 minutes

**Change Request:**

```markdown
## Permission Change Request

### Change ID: PERM-001
### Date: 2025-12-17
### Requested By: Product Owner

### Change Description
Allow Sales role to view (but not edit) Tutor pipeline for scheduling purposes.

### Business Justification
Sales needs to see tutor availability when closing deals.

### Affected Roles
- sales

### Affected Resources
- tutors pipeline (view only)

### Current State
Sales role: No access to tutors pipeline

### Desired State
Sales role: Read-only access to tutors pipeline (no financial fields)

### Risk Assessment
- Impact: Low (additive permission)
- Reversibility: Easy
- Data exposure: Controlled (no financial)
```

---

## Step 3: Design Permission Change
**Agent:** Architecture Agent  
**Duration:** 30-60 minutes

**Permission Design:**

```typescript
// Design document

// Before
const salesPermissions = {
  pipelines: {
    students: { view: true, create: true, edit: true, delete: false },
    tutors: { view: false, create: false, edit: false, delete: false },
    packages: { view: true, create: false, edit: false, delete: false },
    leads: { view: true, create: true, edit: true, delete: false, viewFinancial: true },
  },
  features: {
    settings: false,
    reports: 'own',
    aiConsole: false,
  },
};

// After
const salesPermissions = {
  pipelines: {
    students: { view: true, create: true, edit: true, delete: false },
    tutors: { 
      view: true,           // NEW: Allow view
      create: false, 
      edit: false, 
      delete: false,
      viewFinancial: false  // NEW: Explicitly deny financial
    },
    packages: { view: true, create: false, edit: false, delete: false },
    leads: { view: true, create: true, edit: true, delete: false, viewFinancial: true },
  },
  features: {
    settings: false,
    reports: 'own',
    aiConsole: false,
  },
};
```

---

## Step 4: Update Role Defaults
**Agent:** Backend Agent  
**Duration:** 30 minutes

**Modify Role Defaults:**

```typescript
// services/permissions/roleDefaults.ts

export const roleDefaults: Record<UserRole, RolePermissions> = {
  // ... other roles

  sales: {
    pipelines: {
      students: {
        view: true,
        create: true,
        edit: true,
        delete: false,
        viewFinancial: false,
      },
      tutors: {
        view: true,           // CHANGED: false → true
        create: false,
        edit: false,
        delete: false,
        viewFinancial: false, // ADDED: explicit financial restriction
      },
      packages: {
        view: true,
        create: false,
        edit: false,
        delete: false,
        viewFinancial: false,
      },
      leads: {
        view: true,
        create: true,
        edit: true,
        delete: false,
        viewFinancial: true,
      },
    },
    features: {
      settings: false,
      reports: 'own',
      aiConsole: false,
      agents: false,
    },
  },

  // ... other roles
};
```

---

## Step 5: Update Access Control
**Agent:** Backend Agent  
**Duration:** 30-60 minutes

**Ensure Access Control Logic:**

```typescript
// services/permissions/accessControl.ts

import { roleDefaults } from './roleDefaults';
import type { User, UserRole } from '../../types';

/**
 * Check if user can access a pipeline
 */
export function canAccessPipeline(
  user: User,
  pipelineType: string,
  action: 'view' | 'create' | 'edit' | 'delete'
): boolean {
  const role = user.role as UserRole;
  const permissions = roleDefaults[role];
  
  if (!permissions) {
    console.warn(`Unknown role: ${role}`);
    return false;
  }

  const pipelinePerms = permissions.pipelines[pipelineType];
  if (!pipelinePerms) {
    // Default deny for unknown pipelines
    return false;
  }

  return pipelinePerms[action] ?? false;
}

/**
 * Check if user can view financial fields
 */
export function canViewFinancial(
  user: User,
  pipelineType: string
): boolean {
  const role = user.role as UserRole;
  const permissions = roleDefaults[role];
  
  const pipelinePerms = permissions?.pipelines?.[pipelineType];
  return pipelinePerms?.viewFinancial ?? false;
}

/**
 * Check if user can access feature
 */
export function canAccessFeature(
  user: User,
  feature: string
): boolean {
  const role = user.role as UserRole;
  const permissions = roleDefaults[role];
  
  const featureAccess = permissions?.features?.[feature];
  
  if (featureAccess === 'own') {
    return true; // Handled by data filtering
  }
  
  return featureAccess ?? false;
}
```

---

## Step 6: Update Data Filtering
**Agent:** Backend Agent  
**Duration:** 30 minutes

**Ensure Field Filtering:**

```typescript
// services/permissions/dataFiltering.ts

import { canViewFinancial } from './accessControl';
import type { User, FieldDefinition, CRMEntity } from '../../types';

/**
 * Filter fields based on user permissions
 */
export function filterFieldsForRole(
  fields: FieldDefinition[],
  user: User,
  pipelineType: string
): FieldDefinition[] {
  const canSeeFinancial = canViewFinancial(user, pipelineType);

  return fields.filter(field => {
    // Hide financial fields if user doesn't have permission
    if (field.isFinancial && !canSeeFinancial) {
      return false;
    }
    return true;
  });
}

/**
 * Filter entity data based on user permissions
 */
export function filterEntityForRole<T extends CRMEntity>(
  entity: T,
  fields: FieldDefinition[],
  user: User,
  pipelineType: string
): Partial<T> {
  const allowedFields = filterFieldsForRole(fields, user, pipelineType);
  const allowedFieldNames = new Set(allowedFields.map(f => f.name));

  const filtered: Partial<T> = {
    id: entity.id,
    stage: entity.stage,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };

  for (const [key, value] of Object.entries(entity)) {
    if (allowedFieldNames.has(key)) {
      (filtered as any)[key] = value;
    }
  }

  return filtered;
}
```

---

## Step 7: Update Frontend Guards
**Agent:** Frontend Agent  
**Duration:** 30-60 minutes

**Update Permission Hooks:**

```typescript
// hooks/usePermissions.ts
import { useAuth } from '@/context/AuthContext';
import { canAccessPipeline, canViewFinancial, canAccessFeature } from '@/services/permissions';

export function usePermissions() {
  const { user } = useAuth();

  return {
    canView: (pipelineType: string) => 
      user ? canAccessPipeline(user, pipelineType, 'view') : false,
    
    canCreate: (pipelineType: string) => 
      user ? canAccessPipeline(user, pipelineType, 'create') : false,
    
    canEdit: (pipelineType: string) => 
      user ? canAccessPipeline(user, pipelineType, 'edit') : false,
    
    canDelete: (pipelineType: string) => 
      user ? canAccessPipeline(user, pipelineType, 'delete') : false,
    
    canViewFinancial: (pipelineType: string) => 
      user ? canViewFinancial(user, pipelineType) : false,
    
    canAccessFeature: (feature: string) => 
      user ? canAccessFeature(user, feature) : false,
  };
}
```

**Update Navigation:**

```typescript
// components/navigation/config.ts
import { usePermissions } from '@/hooks/usePermissions';

export function useNavigationItems() {
  const { canView, canAccessFeature } = usePermissions();

  return [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      path: '/dashboard',
      visible: true,
    },
    { 
      id: 'students', 
      label: 'Students', 
      path: '/crm/students',
      visible: canView('students'),
    },
    { 
      id: 'tutors', 
      label: 'Tutors', 
      path: '/crm/tutors',
      visible: canView('tutors'),  // Now visible for sales
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      path: '/settings',
      visible: canAccessFeature('settings'),
    },
  ].filter(item => item.visible);
}
```

---

## Step 8: Testing
**Agent:** QA Agent  
**Duration:** 2-4 hours

**Permission Tests:**

```typescript
// __tests__/permissions/sales-tutors.test.ts
import { describe, it, expect } from 'vitest';
import { canAccessPipeline, canViewFinancial } from '../../services/permissions';

const salesUser = { id: '1', role: 'sales' as const };
const adminUser = { id: '2', role: 'admin' as const };

describe('Sales Tutor Permissions', () => {
  describe('Pipeline Access', () => {
    it('sales can view tutors', () => {
      expect(canAccessPipeline(salesUser, 'tutors', 'view')).toBe(true);
    });

    it('sales cannot create tutors', () => {
      expect(canAccessPipeline(salesUser, 'tutors', 'create')).toBe(false);
    });

    it('sales cannot edit tutors', () => {
      expect(canAccessPipeline(salesUser, 'tutors', 'edit')).toBe(false);
    });

    it('sales cannot delete tutors', () => {
      expect(canAccessPipeline(salesUser, 'tutors', 'delete')).toBe(false);
    });
  });

  describe('Financial Access', () => {
    it('sales cannot view tutor financial fields', () => {
      expect(canViewFinancial(salesUser, 'tutors')).toBe(false);
    });

    it('admin can view tutor financial fields', () => {
      expect(canViewFinancial(adminUser, 'tutors')).toBe(true);
    });
  });

  describe('Data Filtering', () => {
    it('filters out salary field for sales', () => {
      const fields = [
        { name: 'name', isFinancial: false },
        { name: 'email', isFinancial: false },
        { name: 'salary', isFinancial: true },
      ];

      const filtered = filterFieldsForRole(fields, salesUser, 'tutors');

      expect(filtered.map(f => f.name)).toEqual(['name', 'email']);
    });
  });
});
```

**E2E Permission Test:**

```typescript
// e2e/permissions.spec.ts
import { test, expect } from './fixtures';

test.describe('Sales Tutor Access', () => {
  test.use({ 
    storageState: 'e2e/.auth/sales.json' // Pre-authenticated sales user
  });

  test('sales can see tutors in navigation', async ({ page }) => {
    await page.goto('/dashboard');
    
    await expect(page.getByRole('link', { name: 'Tutors' })).toBeVisible();
  });

  test('sales can view tutors list', async ({ page }) => {
    await page.goto('/crm/tutors');
    
    await expect(page.getByRole('heading', { name: 'Tutors' })).toBeVisible();
    await expect(page.getByTestId('tutor-list')).toBeVisible();
  });

  test('sales cannot see create button', async ({ page }) => {
    await page.goto('/crm/tutors');
    
    await expect(page.getByRole('button', { name: /create/i })).not.toBeVisible();
  });

  test('sales cannot see salary column', async ({ page }) => {
    await page.goto('/crm/tutors');
    
    await expect(page.getByRole('columnheader', { name: /salary/i })).not.toBeVisible();
  });

  test('sales cannot access edit page', async ({ page }) => {
    await page.goto('/crm/tutors/1/edit');
    
    // Should redirect or show access denied
    await expect(page.getByText(/access denied|not authorized/i)).toBeVisible();
  });
});
```

---

## Step 9: Documentation
**Agent:** Architecture Agent  
**Duration:** 15 minutes

**Update Permission Documentation:**

```markdown
## Permission Matrix Update

### Change Log

| Date | Change ID | Description | Affected Roles |
|------|-----------|-------------|----------------|
| 2025-12-17 | PERM-001 | Sales can view tutors (no financial) | sales |

### Current Matrix

| Role | Students | Tutors | Packages | Leads |
|------|----------|--------|----------|-------|
| admin | CRUD+F | CRUD+F | CRUD+F | CRUD+F |
| dev | CRUD+F | CRUD+F | CRUD+F | CRUD+F |
| management | R+F | R+F | CRUD+F | CRUD+F |
| sales | CRUD | R* | R | CRUD+F |
| support | R | R | R | R |
| team | R | R | R | R |

*R = Read-only, no financial fields
```

---

## Step 10: Rollout
**Agent:** DevOps Agent  
**Duration:** 30 minutes

**Rollout Plan:**

```markdown
## Permission Change Rollout

### Pre-Rollout
- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Stakeholders notified

### Rollout Steps
1. Deploy to staging
2. Verify in staging (sales user tests)
3. Deploy to production
4. Verify in production
5. Monitor for issues

### Rollback Plan
If issues detected:
1. Revert roleDefaults.ts to previous version
2. Deploy immediately
3. Notify stakeholders

### Post-Rollout
- [ ] Confirm with sales team
- [ ] Check error logs
- [ ] Update training docs
```

---

## Validation Checklist

### Implementation
- [ ] Role defaults updated
- [ ] Access control logic correct
- [ ] Data filtering working
- [ ] Frontend guards updated

### Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing complete

### Security
- [ ] No permission escalation
- [ ] Financial data protected
- [ ] Audit logging in place

### Documentation
- [ ] Permission matrix updated
- [ ] Change log updated
- [ ] User docs updated

---

## Files Modified

| File | Action |
|------|--------|
| `services/permissions/roleDefaults.ts` | Update permissions |
| `services/permissions/accessControl.ts` | Verify logic |
| `services/permissions/dataFiltering.ts` | Update filtering |
| `components/navigation/config.ts` | Update visibility |
| `__tests__/permissions/*.test.ts` | Add tests |
| `e2e/permissions.spec.ts` | Add E2E tests |
| `docs/permissions.md` | Update docs |

