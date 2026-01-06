---
description: How to add a new UI component to the project
---

# Adding a New UI Component

## Step 1: Determine Component Type

| Type | Location | Purpose |
|------|----------|---------|
| UI Primitive | `components/ui/` | Reusable buttons, inputs, logos |
| Pipeline | `components/pipeline/` | Pipeline-specific (modals, cards) |
| Navigation | `components/navigation/` | Sidebar, topbar, menus |
| Settings | `components/settings/` | Settings tab components |
| Feature | `components/<feature>/` | Feature-specific components |

## Step 2: Create the Component

```typescript
// components/<type>/<ComponentName>.tsx

import type { ReactNode } from 'react';

interface ComponentNameProps {
  // Define props with types
}

export function ComponentName({ ...props }: ComponentNameProps) {
  return (
    // JSX here
  );
}
```

## Step 3: Export from Barrel File

Add export to `components/<type>/index.ts`:

```typescript
export { ComponentName } from './ComponentName';
```

## Step 4: Import and Use

```typescript
import { ComponentName } from '../components/<type>';
```

## Step 5: Verify Build

```bash
// turbo
npm run build
```

## Notes

- Always define TypeScript interfaces for props
- Use context hooks (`useAuth`, `useCRM`, `useData`) for state
- Check permissions before rendering sensitive data
- Add `showInKanban` / `showInTable` flags for pipeline components
