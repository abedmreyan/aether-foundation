---
description: How to add a new field to a pipeline configuration
---

# Adding a New Pipeline Field

## Step 1: Define the Field

Determine field properties:

| Property | Required | Description |
|----------|----------|-------------|
| `id` | Yes | Unique snake_case identifier |
| `name` | Yes | Internal name (same as id) |
| `type` | Yes | `text`, `email`, `phone`, `select`, `number`, `date`, `currency` |
| `label` | Yes | Display label |
| `required` | Yes | Is field required? |
| `isFinancial` | No | Hide from non-financial roles |
| `showInKanban` | No | Display in Kanban card |
| `showInTable` | No | Display in Table view |
| `options` | No | For `select` type only |

## Step 2: Add to Pipeline Config

Edit `services/platformDatabase.ts`, find the pipeline in `createAjnabiPipelines()`:

```typescript
fields: [
  // ...existing fields
  {
    id: 'new_field',
    name: 'new_field',
    type: 'text',
    label: 'New Field',
    required: false,
    showInKanban: true,
    showInTable: true,
  },
],
```

## Step 3: Update Type Definition (if entity-specific)

Edit `types/crm.ts` to add the field to the interface:

```typescript
interface Student extends CRMEntity {
  // ...existing fields
  new_field?: string;
}
```

## Step 4: Clear Local Storage

Development uses localStorage. Clear to see changes:

1. Open browser DevTools → Application → Local Storage
2. Delete keys with `aether_platform_db` prefix
3. Refresh the app

## Step 5: Verify Build

```bash
// turbo
npm run build
```

## Notes

- Financial fields (`isFinancial: true`) are hidden from sales/support roles
- Field order in array = display order
- Use `currency` type for monetary values (auto-formats)
