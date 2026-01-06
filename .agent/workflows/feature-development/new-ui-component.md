# New UI Component Workflow

## Overview

Workflow for creating reusable UI components with proper typing, styling, and testing. Follows Aether design system patterns.

## Agents Involved

| Phase | Primary Agent | Supporting |
|-------|---------------|------------|
| Design | Frontend Agent | UX Designer |
| Implementation | Frontend Agent | Architecture |
| Testing | QA Agent | Frontend |

## Prerequisites

- [ ] Component requirements defined
- [ ] Design mockup/reference available
- [ ] Props interface specified
- [ ] Variants identified

---

## Step 1: Component Planning
**Agent:** Frontend Agent  
**Duration:** 15-30 minutes

**Tasks:**
1. Determine component type (UI/Feature/Layout)
2. Plan props interface
3. Identify variants
4. Plan accessibility requirements
5. Choose styling approach

**Component Type Decision:**

| Type | Location | Use Case |
|------|----------|----------|
| UI Primitive | `components/ui/` | Buttons, inputs, cards |
| Feature | `components/[feature]/` | Feature-specific components |
| Layout | `components/layout/` | Page layouts, grids |
| Pipeline | `components/pipeline/` | CRM pipeline components |

---

## Step 2: Create Component Structure
**Agent:** Frontend Agent  
**Duration:** 30-60 minutes

**Create Files:**

```
components/[type]/
├── [ComponentName].tsx      # Main component
├── [ComponentName].css      # Styles (or use Tailwind)
├── [ComponentName].test.tsx # Tests
└── index.ts                 # Barrel export
```

**Component Template:**

```tsx
// components/ui/Button.tsx
import { forwardRef } from 'react';
import './Button.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** Size of the button */
  size?: 'sm' | 'md' | 'lg';
  /** Full width button */
  fullWidth?: boolean;
  /** Loading state */
  isLoading?: boolean;
  /** Left icon */
  leftIcon?: React.ReactNode;
  /** Right icon */
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      className = '',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses = 'btn';
    const variantClasses = `btn--${variant}`;
    const sizeClasses = `btn--${size}`;
    const widthClasses = fullWidth ? 'btn--full-width' : '';
    const loadingClasses = isLoading ? 'btn--loading' : '';

    const classes = [
      baseClasses,
      variantClasses,
      sizeClasses,
      widthClasses,
      loadingClasses,
      className
    ].filter(Boolean).join(' ');

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <span className="btn__spinner" />}
        {!isLoading && leftIcon && <span className="btn__icon btn__icon--left">{leftIcon}</span>}
        <span className="btn__content">{children}</span>
        {!isLoading && rightIcon && <span className="btn__icon btn__icon--right">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

---

## Step 3: Styling
**Agent:** Frontend Agent  
**Duration:** 30-60 minutes

**CSS Module Approach:**

```css
/* components/ui/Button.css */
.btn {
  /* Base styles */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;
  border-radius: 0.375rem;
  transition: all 0.15s ease;
  cursor: pointer;
  border: none;
}

/* Variants */
.btn--primary {
  background: var(--color-primary);
  color: white;
}

.btn--primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.btn--secondary {
  background: var(--color-secondary);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn--ghost {
  background: transparent;
  color: var(--color-text);
}

.btn--danger {
  background: var(--color-danger);
  color: white;
}

/* Sizes */
.btn--sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

.btn--md {
  padding: 0.5rem 1rem;
  font-size: 1rem;
}

.btn--lg {
  padding: 0.75rem 1.5rem;
  font-size: 1.125rem;
}

/* States */
.btn--full-width {
  width: 100%;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--loading {
  position: relative;
  color: transparent;
}

.btn__spinner {
  position: absolute;
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

**Tailwind Approach (Alternative):**

```tsx
const variantClasses = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-100 text-gray-900 border hover:bg-gray-200',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};
```

---

## Step 4: Export Component
**Agent:** Frontend Agent  
**Duration:** 5 minutes

**Update Barrel File:**

```typescript
// components/ui/index.ts
export { Button } from './Button';
export type { ButtonProps } from './Button';
```

---

## Step 5: Add Accessibility
**Agent:** Frontend Agent  
**Duration:** 15-30 minutes

**Accessibility Checklist:**
- [ ] Keyboard navigation works
- [ ] Focus states visible
- [ ] ARIA labels where needed
- [ ] Color contrast meets WCAG
- [ ] Screen reader friendly

**Example A11y Enhancements:**

```tsx
<button
  ref={ref}
  className={classes}
  disabled={disabled || isLoading}
  aria-busy={isLoading}
  aria-disabled={disabled || isLoading}
  {...props}
>
  {isLoading && (
    <span className="btn__spinner" aria-hidden="true" />
  )}
  {isLoading && (
    <span className="sr-only">Loading...</span>
  )}
  {/* ... rest of button */}
</button>
```

---

## Step 6: Create Tests
**Agent:** QA Agent  
**Duration:** 30-60 minutes

**Test File:**

```tsx
// components/ui/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('applies variant classes', () => {
    render(<Button variant="danger">Delete</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn--danger');
  });

  it('applies size classes', () => {
    render(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn--lg');
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disables button when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('disables button when loading', () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows loading spinner when loading', () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn--loading');
  });

  it('renders left icon', () => {
    render(<Button leftIcon={<span data-testid="icon">★</span>}>Star</Button>);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('applies fullWidth class', () => {
    render(<Button fullWidth>Full</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn--full-width');
  });
});
```

---

## Step 7: Documentation
**Agent:** Frontend Agent  
**Duration:** 15 minutes

**Storybook Story (if using Storybook):**

```tsx
// components/ui/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    children: 'Primary Button',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
  },
};

export const Loading: Story = {
  args: {
    children: 'Loading...',
    isLoading: true,
  },
};
```

**JSDoc Documentation:**

```tsx
/**
 * Button component for user interactions
 * 
 * @example
 * // Primary button
 * <Button variant="primary" onClick={handleClick}>
 *   Save Changes
 * </Button>
 * 
 * @example
 * // Loading state
 * <Button isLoading disabled>
 *   Saving...
 * </Button>
 * 
 * @example
 * // With icons
 * <Button leftIcon={<PlusIcon />} variant="secondary">
 *   Add Item
 * </Button>
 */
```

---

## Step 8: Usage Example
**Agent:** Frontend Agent  
**Duration:** 10 minutes

**Create Usage Example:**

```tsx
// Example usage in a page or feature component
import { Button } from '@/components/ui';
import { Plus, Trash } from 'lucide-react';

export function FeaturePage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    await saveData();
    setIsLoading(false);
  };

  return (
    <div className="flex gap-2">
      <Button 
        variant="primary" 
        onClick={handleSave}
        isLoading={isLoading}
      >
        Save
      </Button>
      
      <Button 
        variant="secondary" 
        leftIcon={<Plus size={16} />}
      >
        Add New
      </Button>
      
      <Button 
        variant="danger" 
        leftIcon={<Trash size={16} />}
      >
        Delete
      </Button>
    </div>
  );
}
```

---

## Validation Checklist

### Build
```bash
npm run build          # Must pass
npm run check          # TypeScript check
```

### Tests
```bash
npm run test           # All tests pass
```

### Visual
- [ ] Component renders correctly
- [ ] All variants look correct
- [ ] Responsive at all breakpoints
- [ ] Dark/light mode works (if applicable)

### Accessibility
- [ ] Keyboard navigation works
- [ ] Focus visible
- [ ] Screen reader compatible
- [ ] Color contrast passes

### Code Quality
- [ ] Props interface documented
- [ ] TypeScript types correct
- [ ] CSS follows conventions
- [ ] Exported from barrel file

---

## Common Component Patterns

### Controlled Input
```tsx
interface InputProps {
  value: string;
  onChange: (value: string) => void;
}
```

### Compound Component
```tsx
const Card = ({ children }) => <div className="card">{children}</div>;
Card.Header = ({ children }) => <div className="card-header">{children}</div>;
Card.Body = ({ children }) => <div className="card-body">{children}</div>;
```

### Polymorphic Component
```tsx
interface ButtonProps<T extends React.ElementType = 'button'> {
  as?: T;
}
```

### Render Prop
```tsx
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}
```

---

## Files Modified

| File | Action |
|------|--------|
| `components/[type]/[Component].tsx` | Create |
| `components/[type]/[Component].css` | Create |
| `components/[type]/[Component].test.tsx` | Create |
| `components/[type]/index.ts` | Update |

