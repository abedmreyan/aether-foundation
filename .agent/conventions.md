# Coding Conventions

This document defines coding standards for the Aether Foundation project. All AI agents and contributors must follow these patterns.

---

## File Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `PipelineBuilder.tsx` |
| Types | camelCase | `pipeline.ts` |
| Services | camelCase | `customerDatabase.ts` |
| Hooks | camelCase with `use` prefix | `useAuth.ts` |
| Constants | camelCase | `constants.ts` |

---

## Directory Structure Rules

```
components/
├── ui/           ← Reusable primitives (Button, Logo)
├── navigation/   ← Navigation components (Sidebar, TopBar)
├── pipeline/     ← Pipeline-specific components
├── settings/     ← Settings tab components
└── <feature>/    ← Feature-specific folders

services/
├── database/     ← Database adapters
├── permissions/  ← RBAC logic
└── *.ts          ← Standalone services

types/
└── *.ts          ← Type definitions only (no logic)
```

---

## Import Order

Order imports in this sequence, with blank lines between groups:

```typescript
// 1. React and external libraries
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// 2. Types (always use `import type` for type-only imports)
import type { PipelineConfig, User } from '../types';

// 3. Context hooks
import { useAuth, useCRM } from '../context';

// 4. Services
import { canAccessPipeline } from '../services/permissions';

// 5. Components
import { Button } from '../components/ui';

// 6. Local imports (same directory)
import { STAGE_COLORS } from './constants';
```

---

## TypeScript Patterns

### Always Define Props Interfaces

```typescript
interface ComponentProps {
  title: string;
  onSave: (data: FormData) => void;
  isLoading?: boolean;  // Optional props at end
}

export function Component({ title, onSave, isLoading = false }: ComponentProps) {
  // ...
}
```

### Use Type Imports

```typescript
// ✅ Correct
import type { User } from '../types';

// ❌ Avoid (unless also importing values)
import { User } from '../types';
```

### Avoid `any` Type

```typescript
// ✅ Use proper types
function processData(data: CRMEntity[]): void

// ✅ Use generics when needed
function getEntity<T extends CRMEntity>(type: string, id: string): Promise<T>

// ❌ Avoid any
function processData(data: any): void
```

---

## Component Patterns

### Functional Components Only

```typescript
// ✅ Correct
export function MyComponent({ prop }: Props) {
  return <div>{prop}</div>;
}

// ❌ Avoid class components
class MyComponent extends React.Component { }
```

### Use Context Hooks

```typescript
// ✅ Correct
const { user, isPrivileged } = useAuth();
const { pipelineConfigs, getEntities } = useCRM();

// ❌ Avoid direct context consumption
const context = useContext(AuthContext);
```

### Permission Checks

```typescript
// ✅ Always check permissions before rendering sensitive UI
function FinancialData() {
  const { user } = useAuth();
  const { roleDefinitions } = useCRM();
  
  if (!canViewFinancials(user, roleDefinitions)) {
    return null; // or <AccessDenied />
  }
  
  return <SensitiveData />;
}
```

---

## Barrel Exports

Every directory with multiple modules should have an `index.ts`:

```typescript
// components/ui/index.ts
export { Button } from './Button';
export { Logo } from './Logo';
export { ViewToggle } from './ViewToggle';
```

---

## State Management

### Local State

```typescript
// ✅ Use useState for component-local state
const [isOpen, setIsOpen] = useState(false);
```

### Shared State

```typescript
// ✅ Use context for shared state
const { user } = useAuth();
const { pipelineConfigs } = useCRM();
```

### Form State

```typescript
// ✅ Use object state for forms
const [formData, setFormData] = useState<FormData>({
  name: '',
  email: '',
});

const updateField = (field: keyof FormData, value: string) => {
  setFormData(prev => ({ ...prev, [field]: value }));
};
```

---

## Error Handling

```typescript
// ✅ Use try-catch with specific error handling
try {
  await createEntity('students', formData);
} catch (error) {
  if (error instanceof ValidationError) {
    setFieldErrors(error.errors);
  } else {
    setGeneralError('Failed to create entity');
  }
}
```

---

## Comments

```typescript
// ✅ Explain WHY, not WHAT
// Filter financial fields for non-privileged users to comply with data policy
const visibleFields = filterFieldsForRole(fields, user, roles);

// ❌ Don't explain obvious code
// Set loading to true
setLoading(true);
```

---

## CSS/Styling

- Use inline styles for dynamic values
- Use CSS modules or separate CSS files for static styles
- Follow existing color palette from `index.css`

```typescript
// ✅ Dynamic styles inline
<div style={{ backgroundColor: stage.color }}>

// ✅ Static styles in CSS
<div className="pipeline-card">
```

---

## Keeping This File Updated

**Update this file when:**
- Introducing new coding patterns
- Discovering anti-patterns to avoid
- Adding new file types or conventions
- Team agrees on new standards

**Format for additions:**
```markdown
## [Category Name]

### [Pattern Name]

```typescript
// ✅ Correct way
code example

// ❌ Avoid
anti-pattern example
```
```
