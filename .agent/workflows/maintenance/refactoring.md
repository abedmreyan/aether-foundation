# Code Refactoring Workflow

## Overview

Workflow for safely refactoring code to improve maintainability, readability, and performance without changing functionality.

## Agents Involved

| Phase | Primary Agent | Supporting |
|-------|---------------|------------|
| Analysis | Architecture Agent | QA |
| Planning | Architecture Agent | PM |
| Execution | Backend/Frontend Agent | Architecture |
| Validation | QA Agent | All |

## Prerequisites

- [ ] Code to refactor identified
- [ ] Refactoring goals defined
- [ ] Test coverage verified
- [ ] Team alignment on approach

---

## Step 1: Code Analysis
**Agent:** Architecture Agent  
**Duration:** 1-2 hours

**Identify Code Smells:**

```markdown
## Code Smell Analysis

### File: `services/userService.ts`

| Smell | Location | Severity |
|-------|----------|----------|
| Long method | `processUser()` 150 lines | High |
| Duplicate code | Lines 45-60, 120-135 | Medium |
| Magic numbers | Line 78: `if (count > 100)` | Low |
| Deep nesting | `handleAuth()` 5 levels | Medium |
| Large class | 800 lines, 25 methods | High |

### Recommended Actions
1. Extract `processUser()` into smaller functions
2. Create shared utility for duplicate code
3. Replace magic numbers with constants
4. Flatten nested conditionals with early returns
5. Split class into focused modules
```

**Metrics to Track:**

| Metric | Current | Target |
|--------|---------|--------|
| Cyclomatic complexity | 25 | < 10 |
| Lines per function | 150 | < 30 |
| Test coverage | 45% | > 80% |
| Duplicate code | 15% | < 5% |

---

## Step 2: Refactoring Plan
**Agent:** Architecture Agent  
**Duration:** 30-60 minutes

**Create Refactoring Plan:**

```markdown
## Refactoring Plan: userService.ts

### Goal
Break down monolithic service into focused, testable modules

### Approach
1. Add tests for existing functionality
2. Extract small pieces incrementally
3. Verify tests pass after each change
4. Update imports across codebase

### Phases

#### Phase 1: Add Test Coverage
- [ ] Write tests for `processUser()`
- [ ] Write tests for `handleAuth()`
- [ ] Achieve 80% coverage

#### Phase 2: Extract Utilities
- [ ] Create `utils/validation.ts`
- [ ] Move validation logic
- [ ] Update imports

#### Phase 3: Split Service
- [ ] Create `services/auth.ts`
- [ ] Create `services/profile.ts`
- [ ] Move methods to appropriate files

#### Phase 4: Cleanup
- [ ] Remove old file
- [ ] Update all imports
- [ ] Run full test suite

### Risk Mitigation
- Small incremental changes
- Tests run after each change
- Feature flags for rollback
```

---

## Step 3: Add Test Coverage
**Agent:** QA Agent  
**Duration:** 2-4 hours

**Write Tests Before Refactoring:**

```typescript
// __tests__/userService.test.ts

describe('userService', () => {
  describe('processUser', () => {
    it('validates user data correctly', async () => {
      const result = await processUser({
        email: 'test@example.com',
        name: 'Test User',
      });
      expect(result.isValid).toBe(true);
    });

    it('rejects invalid email', async () => {
      await expect(
        processUser({ email: 'invalid', name: 'Test' })
      ).rejects.toThrow('Invalid email');
    });

    it('handles missing required fields', async () => {
      await expect(
        processUser({ name: 'Test' })
      ).rejects.toThrow('Email required');
    });

    // Add more tests covering all branches
  });

  describe('handleAuth', () => {
    it('authenticates valid credentials', async () => {
      const result = await handleAuth('user@example.com', 'password123');
      expect(result.authenticated).toBe(true);
    });

    // More auth tests...
  });
});
```

**Verify Coverage:**

```bash
npm run test:coverage

# Should see:
# userService.ts: 80%+ coverage
```

---

## Step 4: Extract Utilities
**Agent:** Backend/Frontend Agent  
**Duration:** 1-2 hours

**Before:**

```typescript
// services/userService.ts (800 lines)

export async function processUser(data: UserData) {
  // Validation logic (50 lines)
  if (!data.email) throw new Error('Email required');
  if (!data.email.includes('@')) throw new Error('Invalid email');
  if (!data.name || data.name.length < 2) throw new Error('Invalid name');
  
  // Processing logic (100 lines)
  // ...
}
```

**After:**

```typescript
// utils/validation.ts (new file)
export function validateEmail(email: string): boolean {
  if (!email) return false;
  return email.includes('@') && email.includes('.');
}

export function validateName(name: string): boolean {
  return name && name.length >= 2;
}

export function validateUserData(data: UserData): ValidationResult {
  const errors: string[] = [];
  
  if (!validateEmail(data.email)) {
    errors.push('Invalid email');
  }
  
  if (!validateName(data.name)) {
    errors.push('Invalid name');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
```

```typescript
// services/userService.ts (now cleaner)
import { validateUserData } from '../utils/validation';

export async function processUser(data: UserData) {
  const validation = validateUserData(data);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(', '));
  }
  
  // Processing logic only
  // ...
}
```

**Run Tests:**

```bash
npm run test
# All tests should still pass
```

---

## Step 5: Split Large Files
**Agent:** Backend/Frontend Agent  
**Duration:** 2-4 hours

**Before:**

```typescript
// services/userService.ts (800 lines, 25 methods)
export async function processUser() { /* ... */ }
export async function handleAuth() { /* ... */ }
export async function updateProfile() { /* ... */ }
export async function deleteUser() { /* ... */ }
// ... 20 more methods
```

**After:**

```typescript
// services/auth/index.ts
export * from './authenticate';
export * from './session';
export * from './tokens';
```

```typescript
// services/auth/authenticate.ts
export async function authenticate(email: string, password: string) {
  // Auth logic only
}

export async function validateCredentials(email: string, password: string) {
  // Validation logic
}
```

```typescript
// services/users/index.ts
export * from './profile';
export * from './crud';
```

```typescript
// services/users/profile.ts
export async function getProfile(userId: number) { /* ... */ }
export async function updateProfile(userId: number, data: ProfileData) { /* ... */ }
```

```typescript
// services/users/crud.ts
export async function createUser(data: CreateUserData) { /* ... */ }
export async function deleteUser(userId: number) { /* ... */ }
```

---

## Step 6: Update Imports
**Agent:** Backend/Frontend Agent  
**Duration:** 1-2 hours

**Find All Usages:**

```bash
# Find all imports of the old module
grep -r "from.*userService" --include="*.ts" --include="*.tsx"
```

**Update Imports:**

```typescript
// Before
import { processUser, handleAuth, updateProfile } from '../services/userService';

// After
import { processUser, updateProfile } from '../services/users';
import { handleAuth } from '../services/auth';
```

**Bulk Replace (careful!):**

```bash
# Use IDE refactoring tools when possible
# Or sed for simple replacements
sed -i 's/userService/users/g' src/**/*.ts
```

---

## Step 7: Flatten Nested Code
**Agent:** Backend/Frontend Agent  
**Duration:** 1-2 hours

**Before (deep nesting):**

```typescript
async function handleRequest(req: Request) {
  if (req.user) {
    if (req.user.isActive) {
      if (req.user.hasPermission('read')) {
        if (req.body.valid) {
          // Finally do something
          return processData(req.body);
        } else {
          throw new Error('Invalid body');
        }
      } else {
        throw new Error('No permission');
      }
    } else {
      throw new Error('User inactive');
    }
  } else {
    throw new Error('Not authenticated');
  }
}
```

**After (early returns):**

```typescript
async function handleRequest(req: Request) {
  if (!req.user) {
    throw new Error('Not authenticated');
  }
  
  if (!req.user.isActive) {
    throw new Error('User inactive');
  }
  
  if (!req.user.hasPermission('read')) {
    throw new Error('No permission');
  }
  
  if (!req.body.valid) {
    throw new Error('Invalid body');
  }
  
  return processData(req.body);
}
```

---

## Step 8: Replace Magic Numbers
**Agent:** Backend/Frontend Agent  
**Duration:** 30 minutes

**Before:**

```typescript
if (items.length > 100) {
  paginate = true;
}

if (retryCount > 3) {
  throw new Error('Max retries');
}

const timeout = 30000;
```

**After:**

```typescript
// constants.ts
export const PAGINATION_THRESHOLD = 100;
export const MAX_RETRY_COUNT = 3;
export const DEFAULT_TIMEOUT_MS = 30000;
```

```typescript
import { PAGINATION_THRESHOLD, MAX_RETRY_COUNT, DEFAULT_TIMEOUT_MS } from './constants';

if (items.length > PAGINATION_THRESHOLD) {
  paginate = true;
}

if (retryCount > MAX_RETRY_COUNT) {
  throw new Error('Max retries');
}

const timeout = DEFAULT_TIMEOUT_MS;
```

---

## Step 9: Final Validation
**Agent:** QA Agent  
**Duration:** 2-4 hours

**Validation Checklist:**

```markdown
## Refactoring Validation

### Tests
- [ ] All existing tests pass
- [ ] New tests added for extracted code
- [ ] Coverage maintained/improved

### Functionality
- [ ] All features work as before
- [ ] No regressions
- [ ] Performance maintained

### Code Quality
- [ ] Cyclomatic complexity reduced
- [ ] File sizes reasonable
- [ ] Clear module boundaries
- [ ] No circular dependencies

### Build
- [ ] TypeScript compiles
- [ ] No lint errors
- [ ] Production build succeeds
```

**Run Full Test Suite:**

```bash
npm run build
npm run test
npm run lint
npm run check
```

---

## Step 10: Documentation
**Agent:** Architecture Agent  
**Duration:** 30 minutes

**Update Architecture Docs:**

```markdown
## Module Structure (Updated)

### Services Layer

```
services/
├── auth/
│   ├── index.ts         # Barrel export
│   ├── authenticate.ts  # Authentication logic
│   ├── session.ts       # Session management
│   └── tokens.ts        # Token generation
├── users/
│   ├── index.ts
│   ├── profile.ts       # Profile operations
│   └── crud.ts          # User CRUD
└── utils/
    ├── validation.ts    # Shared validation
    └── constants.ts     # Magic numbers
```

### Import Pattern

```typescript
// Use barrel exports
import { authenticate } from '../services/auth';
import { updateProfile } from '../services/users';
import { validateEmail } from '../utils/validation';
```
```

---

## Common Refactoring Patterns

### Extract Method
```typescript
// Large function → smaller functions
```

### Extract Class/Module
```typescript
// Large file → multiple focused files
```

### Rename for Clarity
```typescript
// temp → temporaryUserData
// fn → processUserAuthentication
```

### Replace Conditionals with Polymorphism
```typescript
// if/else chains → strategy pattern
```

### Introduce Parameter Object
```typescript
// Many params → single object
fn(a, b, c, d) → fn({ a, b, c, d })
```

---

## Files Modified

| File | Action |
|------|--------|
| `services/userService.ts` | Split into modules |
| `services/auth/` | New module |
| `services/users/` | New module |
| `utils/validation.ts` | Extract utilities |
| `utils/constants.ts` | Extract constants |
| `__tests__/*.ts` | Add/update tests |
| `.agent/architecture.md` | Update docs |

