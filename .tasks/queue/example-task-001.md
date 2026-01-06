# Example Task: Add Priority Field to Student Pipeline

**ID:** example-task-001  
**Status:** 🔴 Pending Approval (Example Only)  
**Agent:** Pipeline Agent  
**Priority:** High  
**Created:** 2025-12-16T01:45:00Z

---

## Context Files

Load these before starting:
- @.agent/workflows/add-pipeline-field.md
- @.agent/context.md
- @.agent/conventions.md

## Files to Edit

- `services/platformDatabase.ts`
- `types/pipeline.ts`
- `components/EntityForm.tsx` (verify only)

---

## Background Research

CRM systems typically use 3-5 priority levels. High/Medium/Low is most common and user-friendly. This helps with lead management and ensures sales teams focus on high-value prospects first.

**Source:** Perplexity research on CRM priority field best practices

---

## Implementation Steps

### Step 1: Add Field Definition

**File:** `services/platformDatabase.ts`

**Location:** In `createAjnabiPipelines()` → students pipeline → fields array

**Action:** Add a new FieldDefinition object:

```typescript
{
  id: 'priority',
  name: 'priority',
  type: 'select',
  label: 'Priority',
  required: false,
  options: ['High', 'Medium', 'Low'],
  showInKanban: true,
  showInTable: true
}
```

---

### Step 2: Verify Types

**File:** `types/pipeline.ts`

**Action:** Confirm `FieldType` union includes `'select'`. 

If not present:
```typescript
export type FieldType = '...existing types...' | 'select';
```

---

### Step 3: Test Rendering

**File:** `components/EntityForm.tsx`

**Action:** Verify EntityForm correctly renders a select dropdown for the new priority field based on the pipeline config.

No code changes needed - just verification that the dynamic form rendering works.

---

## Validation

Run these commands:

```bash
npm run build
npm run dev
```

**Criteria:**
- ✓ Build completes without errors
- ✓ Priority dropdown appears in EntityForm when creating/editing student
- ✓ Can select High/Medium/Low options
- ✓ Field value is saved with entity
- ✓ Field appears in both Kanban and Table views

---

## When Complete

Update `.tasks/current-task.json` (or the orchestrator will do it):

```json
{
  "status": "completed",
  "completedAt": "2025-12-16T02:00:00Z",
  "result": {
    "success": true,
    "filesModified": ["services/platformDatabase.ts"],
    "validation": "Build passed, field renders correctly in EntityForm"
  }
}
```

Or if blocked:

```json
{
  "status": "blocked",
  "blockedReason": "Describe the issue here",
  "needsHelp": true
}
```

---

## Notes

This is a straightforward pipeline field addition following the established pattern in the codebase. The dynamic EntityForm component should handle the rendering automatically based on the pipeline configuration.
