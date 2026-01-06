---
description: How to modify role-based access control permissions
---

# Modifying Permissions

## Understanding the RBAC System

```
User Role → RoleDefinition → PipelinePermission → Access Level
```

**Roles:** `admin`, `dev`, `management`, `sales`, `support`, `team`

**Access Levels:** `none`, `view`, `edit`, `full`

## Step 1: Modify Default Role Permissions

Edit `services/permissions/roleDefaults.ts`:

```typescript
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, DefaultPermissions> = {
  admin: { pipelineAccess: 'full', canManageUsers: true, canManageSettings: true },
  sales: { pipelineAccess: 'edit', canManageUsers: false, canManageSettings: false },
  // ...add or modify roles
};
```

## Step 2: Modify Access Control Logic

Edit `services/permissions/accessControl.ts`:

```typescript
// Check if user can access a pipeline
export function canAccessPipeline(
  user: User,
  pipelineId: string,
  roles: RoleDefinition[]
): boolean {
  // Add custom logic here
}

// Check specific action permission
export function canPerformAction(
  user: User,
  pipelineId: string,
  action: 'create' | 'edit' | 'delete' | 'move',
  roles: RoleDefinition[]
): boolean {
  // Add custom logic here
}
```

## Step 3: Modify Data Filtering

Edit `services/permissions/dataFiltering.ts`:

```typescript
// Filter fields based on role
export function filterFieldsForRole(
  fields: FieldDefinition[],
  user: User,
  roles: RoleDefinition[]
): FieldDefinition[] {
  // Hide isFinancial fields from non-financial roles
}

// Filter data rows based on role
export function filterDataForRole<T>(
  data: T[],
  fields: FieldDefinition[],
  user: User,
  roles: RoleDefinition[]
): T[] {
  // Filter sensitive data
}
```

## Step 4: Use in Components

```typescript
import { canPerformAction, filterFieldsForRole } from '../services/permissions';
import { useAuth, useCRM } from '../context';

function MyComponent() {
  const { user } = useAuth();
  const { roleDefinitions, getPipeline } = useCRM();
  
  const pipeline = getPipeline('students');
  const canEdit = canPerformAction(user, 'students', 'edit', roleDefinitions);
  const visibleFields = filterFieldsForRole(pipeline.fields, user, roleDefinitions);
  
  return canEdit ? <EditForm fields={visibleFields} /> : <ViewOnly />;
}
```

## Step 5: Verify Build

```bash
// turbo
npm run build
```

## Notes

- Always check permissions before rendering sensitive UI
- Use `isPrivileged()` from `useAuth()` for admin/dev checks
- Financial fields auto-hide based on `isFinancial: true` flag
