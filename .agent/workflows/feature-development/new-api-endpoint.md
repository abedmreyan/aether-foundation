# New API Endpoint Workflow

## Overview

Workflow for creating a new tRPC API endpoint, including router setup, service layer, validation, and testing.

## Agents Involved

| Phase | Primary Agent | Supporting |
|-------|---------------|------------|
| Design | Architecture Agent | PM |
| Implementation | Backend Agent | Architecture |
| Testing | QA Agent | Backend |

## Prerequisites

- [ ] Endpoint requirements defined
- [ ] Request/response schema specified
- [ ] Authentication requirements known
- [ ] Rate limiting requirements known

---

## Step 1: API Contract Design
**Agent:** Architecture Agent  
**Duration:** 30-60 minutes

**Tasks:**
1. Define endpoint name and path
2. Specify input schema (Zod)
3. Specify output schema (TypeScript)
4. Document error cases
5. Define authentication level

**Create API Specification:**

```typescript
// Example: api-spec.ts (for documentation only)
interface EndpointSpec {
  name: string;          // 'users.getProfile'
  method: 'query' | 'mutation';
  input: ZodSchema;
  output: TypeSchema;
  auth: 'public' | 'protected' | 'admin';
  rateLimit?: number;    // requests per minute
}
```

**Deliverable:** API specification document

---

## Step 2: Type Definitions
**Agent:** Architecture Agent  
**Duration:** 15-30 minutes

**Tasks:**
1. Create input/output types
2. Add to appropriate type file
3. Export from barrel file

**Files to Modify:**

```typescript
// types/api.ts or types/[feature].ts
export interface GetProfileInput {
  userId: string;
}

export interface GetProfileOutput {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}
```

**Handoff:** → Backend Agent

---

## Step 3: Service Layer
**Agent:** Backend Agent  
**Duration:** 1-2 hours

**Tasks:**
1. Create service function
2. Implement business logic
3. Add database queries
4. Handle edge cases
5. Add logging

**Create Service:**

```typescript
// server/services/[feature].ts
import * as db from '../db';
import type { GetProfileInput, GetProfileOutput } from '../../types';

export async function getProfile(
  input: GetProfileInput,
  userId: number
): Promise<GetProfileOutput> {
  // 1. Validate permissions
  if (!canAccessProfile(userId, input.userId)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Access denied'
    });
  }

  // 2. Fetch data
  const user = await db.getUserById(input.userId);
  
  if (!user) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'User not found'
    });
  }

  // 3. Transform and return
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
}
```

---

## Step 4: tRPC Router
**Agent:** Backend Agent  
**Duration:** 30-60 minutes

**Tasks:**
1. Create router procedure
2. Add Zod validation
3. Wire to service
4. Handle errors

**Create/Update Router:**

```typescript
// server/routers/[feature].ts
import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { getProfile } from '../services/[feature]';

const getProfileInput = z.object({
  userId: z.string().min(1)
});

export const [feature]Router = router({
  getProfile: protectedProcedure
    .input(getProfileInput)
    .query(async ({ input, ctx }) => {
      return getProfile(input, ctx.userId);
    }),
});
```

**Register Router:**

```typescript
// server/routers.ts
import { [feature]Router } from './routers/[feature]';

export const appRouter = router({
  // ... existing routers
  [feature]: [feature]Router,
});
```

---

## Step 5: Error Handling
**Agent:** Backend Agent  
**Duration:** 30 minutes

**Tasks:**
1. Define error codes
2. Add try-catch blocks
3. Log errors appropriately
4. Return user-friendly messages

**Error Handling Pattern:**

```typescript
import { TRPCError } from '@trpc/server';

// Standard error codes
const ERROR_CODES = {
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
  BAD_REQUEST: 'BAD_REQUEST',
  INTERNAL_ERROR: 'INTERNAL_SERVER_ERROR'
} as const;

// Usage in service
try {
  // ... logic
} catch (error) {
  console.error('[getProfile] Error:', error);
  
  if (error instanceof TRPCError) {
    throw error;
  }
  
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred'
  });
}
```

---

## Step 6: Frontend Integration
**Agent:** Frontend Agent  
**Duration:** 30-60 minutes

**Tasks:**
1. Use tRPC hook in component
2. Handle loading states
3. Handle error states
4. Type-check responses

**Frontend Usage:**

```typescript
// client/src/components/Profile.tsx
import { trpc } from '@/lib/trpc';

export function Profile({ userId }: { userId: string }) {
  const { data, isLoading, error } = trpc.[feature].getProfile.useQuery(
    { userId },
    { enabled: !!userId }
  );

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;
  if (!data) return null;

  return (
    <div>
      <h1>{data.name}</h1>
      <p>{data.email}</p>
    </div>
  );
}
```

**Handoff:** → QA Agent

---

## Step 7: Unit Testing
**Agent:** QA Agent  
**Duration:** 1-2 hours

**Tasks:**
1. Test happy path
2. Test error cases
3. Test validation
4. Test permissions

**Create Tests:**

```typescript
// server/services/__tests__/[feature].test.ts
import { describe, it, expect } from 'vitest';
import { getProfile } from '../[feature]';

describe('getProfile', () => {
  it('returns profile for valid user', async () => {
    const result = await getProfile({ userId: '123' }, 1);
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('name');
  });

  it('throws NOT_FOUND for invalid user', async () => {
    await expect(
      getProfile({ userId: 'invalid' }, 1)
    ).rejects.toThrow('NOT_FOUND');
  });

  it('throws FORBIDDEN for unauthorized access', async () => {
    await expect(
      getProfile({ userId: '999' }, 1)
    ).rejects.toThrow('FORBIDDEN');
  });
});
```

---

## Step 8: API Documentation
**Agent:** Backend Agent  
**Duration:** 15 minutes

**Tasks:**
1. Document endpoint in OpenAPI/JSDoc
2. Add to API reference docs
3. Include example requests/responses

**Documentation:**

```typescript
/**
 * Get user profile
 * 
 * @endpoint GET /trpc/[feature].getProfile
 * @auth Required (protected)
 * 
 * @param userId - The user ID to fetch
 * @returns User profile data
 * 
 * @example
 * // Request
 * { "userId": "123" }
 * 
 * // Response
 * { "id": "123", "name": "John", "email": "john@example.com", "role": "user" }
 * 
 * @throws NOT_FOUND - User doesn't exist
 * @throws FORBIDDEN - No permission to access
 */
```

---

## Validation Checklist

### Build & Tests
```bash
npm run build          # Must pass
npm run test          # All tests pass
npm run check         # TypeScript check
```

### Manual Testing
- [ ] Endpoint responds correctly
- [ ] Validation rejects bad input
- [ ] Auth blocks unauthorized
- [ ] Errors return proper codes
- [ ] Response matches schema

### Code Quality
- [ ] Input validation with Zod
- [ ] Proper error handling
- [ ] Logging in place
- [ ] Types exported correctly
- [ ] JSDoc/comments added

---

## Common Patterns

### Query (Read)
```typescript
getItems: protectedProcedure
  .input(z.object({ page: z.number().default(1) }))
  .query(async ({ input }) => {
    return db.getItems(input.page);
  })
```

### Mutation (Write)
```typescript
createItem: protectedProcedure
  .input(z.object({ name: z.string().min(1) }))
  .mutation(async ({ input, ctx }) => {
    return db.createItem(input, ctx.userId);
  })
```

### Admin Only
```typescript
deleteItem: adminProcedure
  .input(z.object({ id: z.number() }))
  .mutation(async ({ input }) => {
    return db.deleteItem(input.id);
  })
```

### Public (No Auth)
```typescript
healthCheck: publicProcedure
  .query(() => ({ status: 'ok', timestamp: new Date() }))
```

---

## Files Modified

| File | Action |
|------|--------|
| `types/[feature].ts` | Create/Update |
| `server/services/[feature].ts` | Create |
| `server/routers/[feature].ts` | Create |
| `server/routers.ts` | Add router |
| `client/src/components/[Feature].tsx` | Use API |
| `server/services/__tests__/[feature].test.ts` | Create |

