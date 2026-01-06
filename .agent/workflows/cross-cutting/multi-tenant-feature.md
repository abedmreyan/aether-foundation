# Multi-Tenant Feature Workflow

## Overview

Workflow for implementing features that require multi-tenant awareness, ensuring proper data isolation, tenant-specific configuration, and cross-tenant security.

## Agents Involved

| Phase | Primary Agent | Supporting |
|-------|---------------|------------|
| Design | Architecture Agent | Backend |
| Implementation | Backend Agent | Frontend |
| Data Isolation | Backend Agent | QA |
| Testing | QA Agent | Backend |

## Prerequisites

- [ ] Feature requirements defined
- [ ] Tenant isolation requirements clear
- [ ] Data model impact assessed
- [ ] Cross-tenant scenarios identified

---

## Step 1: Multi-Tenancy Analysis
**Agent:** Architecture Agent  
**Duration:** 30-60 minutes

**Tenant Isolation Assessment:**

```markdown
## Multi-Tenant Analysis: [Feature Name]

### Feature Description
User preferences with language and timezone settings

### Tenant Scope
- [x] Tenant-specific data (each tenant has own data)
- [ ] Shared across tenants (global data)
- [ ] Hybrid (some shared, some tenant-specific)

### Data Model Impact
| Table | Tenant Column | Isolation Level |
|-------|---------------|-----------------|
| users | companyId | Row-level |
| preferences | userId → companyId | Row-level |
| languages | - | Global (shared) |

### Security Considerations
- User can only access their own preferences
- Admin can access all users within their tenant
- No cross-tenant data access

### Configuration
- [x] Tenant-specific defaults allowed
- [x] Override global defaults
- [ ] Shared configurations

### Cross-Tenant Scenarios
| Scenario | Allowed | Notes |
|----------|---------|-------|
| User A views User B's prefs (same tenant) | Admin only | Role check |
| User A views User B's prefs (diff tenant) | Never | Tenant isolation |
| Admin sets tenant defaults | Yes | Tenant settings |
```

---

## Step 2: Data Model Design
**Agent:** Architecture Agent  
**Duration:** 30-60 minutes

**Tenant-Aware Schema:**

```typescript
// drizzle/schema.ts

// User preferences - tenant isolated via user relation
export const userPreferences = mysqlTable("userPreferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  preferredLanguage: varchar("preferredLanguage", { length: 10 }).default("en"),
  timezone: varchar("timezone", { length: 50 }).default("UTC"),
  theme: mysqlEnum("theme", ["light", "dark", "system"]).default("system"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Tenant-level defaults
export const tenantSettings = mysqlTable("tenantSettings", {
  id: int("id").autoincrement().primaryKey(),
  companyId: varchar("companyId", { length: 50 }).notNull().unique(),
  defaultLanguage: varchar("defaultLanguage", { length: 10 }).default("en"),
  defaultTimezone: varchar("defaultTimezone", { length: 50 }).default("UTC"),
  allowedLanguages: text("allowedLanguages"), // JSON array
  brandingConfig: text("brandingConfig"),      // JSON object
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Global reference data (shared)
export const languages = mysqlTable("languages", {
  code: varchar("code", { length: 10 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  nativeName: varchar("nativeName", { length: 100 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
});
```

---

## Step 3: Tenant Context
**Agent:** Backend Agent  
**Duration:** 1-2 hours

**Tenant Context Middleware:**

```typescript
// server/middleware/tenantContext.ts
import { TRPCError } from '@trpc/server';
import * as db from '../db';

export interface TenantContext {
  tenantId: string;
  userId: number;
  userRole: string;
}

export async function getTenantContext(
  userId: number
): Promise<TenantContext> {
  const user = await db.getUserById(userId);
  
  if (!user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'User not found',
    });
  }

  return {
    tenantId: user.companyId,
    userId: user.id,
    userRole: user.role,
  };
}

export function requireTenant(ctx: any): TenantContext {
  if (!ctx.tenant) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Tenant context not available',
    });
  }
  return ctx.tenant;
}
```

**tRPC Context Enhancement:**

```typescript
// server/_core/trpc.ts
import { getTenantContext, TenantContext } from '../middleware/tenantContext';

interface Context {
  userId?: number;
  tenant?: TenantContext;
}

export const protectedProcedure = publicProcedure
  .use(async ({ ctx, next }) => {
    if (!ctx.userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    // Add tenant context
    const tenant = await getTenantContext(ctx.userId);

    return next({
      ctx: {
        ...ctx,
        tenant,
      },
    });
  });
```

---

## Step 4: Tenant-Scoped Queries
**Agent:** Backend Agent  
**Duration:** 1-2 hours

**Service Layer with Tenant Isolation:**

```typescript
// server/services/preferencesService.ts
import { db } from '../db';
import { userPreferences, tenantSettings, users } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { TenantContext } from '../middleware/tenantContext';

/**
 * Get user preferences with tenant defaults fallback
 */
export async function getUserPreferences(
  tenant: TenantContext
): Promise<UserPreferences> {
  // Get user-specific preferences
  const [userPrefs] = await db.getDb()
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, tenant.userId));

  // Get tenant defaults
  const [tenantDefaults] = await db.getDb()
    .select()
    .from(tenantSettings)
    .where(eq(tenantSettings.companyId, tenant.tenantId));

  // Merge with fallbacks
  return {
    preferredLanguage: userPrefs?.preferredLanguage 
      ?? tenantDefaults?.defaultLanguage 
      ?? 'en',
    timezone: userPrefs?.timezone 
      ?? tenantDefaults?.defaultTimezone 
      ?? 'UTC',
    theme: userPrefs?.theme ?? 'system',
  };
}

/**
 * Update user preferences (tenant-scoped)
 */
export async function updateUserPreferences(
  tenant: TenantContext,
  data: Partial<UserPreferences>
): Promise<UserPreferences> {
  // Validate allowed values against tenant settings
  const [tenantConfig] = await db.getDb()
    .select()
    .from(tenantSettings)
    .where(eq(tenantSettings.companyId, tenant.tenantId));

  if (tenantConfig?.allowedLanguages) {
    const allowed = JSON.parse(tenantConfig.allowedLanguages);
    if (data.preferredLanguage && !allowed.includes(data.preferredLanguage)) {
      throw new Error('Language not allowed for this organization');
    }
  }

  // Upsert preferences
  await db.getDb()
    .insert(userPreferences)
    .values({
      userId: tenant.userId,
      ...data,
    })
    .onDuplicateKeyUpdate({
      set: {
        ...data,
        updatedAt: new Date(),
      },
    });

  return getUserPreferences(tenant);
}

/**
 * Get all users' preferences for admin (tenant-scoped)
 */
export async function getAllUserPreferences(
  tenant: TenantContext
): Promise<UserPreferences[]> {
  // Verify admin role
  if (tenant.userRole !== 'admin') {
    throw new Error('Admin access required');
  }

  // Get all users in this tenant
  const tenantUsers = await db.getDb()
    .select()
    .from(users)
    .where(eq(users.companyId, tenant.tenantId));

  const userIds = tenantUsers.map(u => u.id);

  // Get preferences for all tenant users
  const allPrefs = await db.getDb()
    .select()
    .from(userPreferences)
    .where(sql`userId IN ${userIds}`);

  return allPrefs;
}
```

---

## Step 5: Tenant Settings Management
**Agent:** Backend Agent  
**Duration:** 1-2 hours

**Tenant Settings Service:**

```typescript
// server/services/tenantSettingsService.ts
import { db } from '../db';
import { tenantSettings } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { TenantContext } from '../middleware/tenantContext';

export interface TenantSettingsData {
  defaultLanguage: string;
  defaultTimezone: string;
  allowedLanguages: string[];
  brandingConfig: {
    primaryColor: string;
    logo?: string;
    companyName: string;
  };
}

/**
 * Get tenant settings (admin only)
 */
export async function getTenantSettings(
  tenant: TenantContext
): Promise<TenantSettingsData> {
  if (tenant.userRole !== 'admin') {
    throw new Error('Admin access required');
  }

  const [settings] = await db.getDb()
    .select()
    .from(tenantSettings)
    .where(eq(tenantSettings.companyId, tenant.tenantId));

  if (!settings) {
    // Return defaults
    return {
      defaultLanguage: 'en',
      defaultTimezone: 'UTC',
      allowedLanguages: ['en', 'es', 'fr', 'de', 'ar'],
      brandingConfig: {
        primaryColor: '#3B82F6',
        companyName: tenant.tenantId,
      },
    };
  }

  return {
    defaultLanguage: settings.defaultLanguage ?? 'en',
    defaultTimezone: settings.defaultTimezone ?? 'UTC',
    allowedLanguages: settings.allowedLanguages 
      ? JSON.parse(settings.allowedLanguages) 
      : ['en'],
    brandingConfig: settings.brandingConfig 
      ? JSON.parse(settings.brandingConfig)
      : {},
  };
}

/**
 * Update tenant settings (admin only)
 */
export async function updateTenantSettings(
  tenant: TenantContext,
  data: Partial<TenantSettingsData>
): Promise<TenantSettingsData> {
  if (tenant.userRole !== 'admin') {
    throw new Error('Admin access required');
  }

  await db.getDb()
    .insert(tenantSettings)
    .values({
      companyId: tenant.tenantId,
      defaultLanguage: data.defaultLanguage,
      defaultTimezone: data.defaultTimezone,
      allowedLanguages: data.allowedLanguages 
        ? JSON.stringify(data.allowedLanguages) 
        : undefined,
      brandingConfig: data.brandingConfig 
        ? JSON.stringify(data.brandingConfig) 
        : undefined,
    })
    .onDuplicateKeyUpdate({
      set: {
        defaultLanguage: data.defaultLanguage,
        defaultTimezone: data.defaultTimezone,
        allowedLanguages: data.allowedLanguages 
          ? JSON.stringify(data.allowedLanguages) 
          : undefined,
        brandingConfig: data.brandingConfig 
          ? JSON.stringify(data.brandingConfig) 
          : undefined,
        updatedAt: new Date(),
      },
    });

  return getTenantSettings(tenant);
}
```

---

## Step 6: tRPC Router
**Agent:** Backend Agent  
**Duration:** 30-60 minutes

```typescript
// server/routers/preferences.ts
import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { requireTenant } from '../middleware/tenantContext';
import * as prefsService from '../services/preferencesService';
import * as tenantService from '../services/tenantSettingsService';

export const preferencesRouter = router({
  // User preferences
  get: protectedProcedure.query(async ({ ctx }) => {
    const tenant = requireTenant(ctx);
    return prefsService.getUserPreferences(tenant);
  }),

  update: protectedProcedure
    .input(z.object({
      preferredLanguage: z.string().optional(),
      timezone: z.string().optional(),
      theme: z.enum(['light', 'dark', 'system']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = requireTenant(ctx);
      return prefsService.updateUserPreferences(tenant, input);
    }),

  // Tenant settings (admin)
  tenantSettings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const tenant = requireTenant(ctx);
      return tenantService.getTenantSettings(tenant);
    }),

    update: protectedProcedure
      .input(z.object({
        defaultLanguage: z.string().optional(),
        defaultTimezone: z.string().optional(),
        allowedLanguages: z.array(z.string()).optional(),
        brandingConfig: z.object({
          primaryColor: z.string(),
          logo: z.string().optional(),
          companyName: z.string(),
        }).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const tenant = requireTenant(ctx);
        return tenantService.updateTenantSettings(tenant, input);
      }),
  }),

  // Admin view all users (tenant-scoped)
  all: protectedProcedure.query(async ({ ctx }) => {
    const tenant = requireTenant(ctx);
    return prefsService.getAllUserPreferences(tenant);
  }),
});
```

---

## Step 7: Frontend Tenant Context
**Agent:** Frontend Agent  
**Duration:** 1-2 hours

**Tenant Context Provider:**

```typescript
// context/TenantContext.tsx
import { createContext, useContext, ReactNode } from 'react';
import { trpc } from '@/lib/trpc';

interface TenantSettings {
  defaultLanguage: string;
  defaultTimezone: string;
  allowedLanguages: string[];
  brandingConfig: {
    primaryColor: string;
    logo?: string;
    companyName: string;
  };
}

interface TenantContextValue {
  settings: TenantSettings | null;
  isLoading: boolean;
  refetch: () => void;
}

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({ children }: { children: ReactNode }) {
  const { data, isLoading, refetch } = trpc.preferences.tenantSettings.get.useQuery();

  return (
    <TenantContext.Provider value={{ settings: data ?? null, isLoading, refetch }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
}
```

**Tenant-Aware Components:**

```tsx
// components/settings/LanguageSelector.tsx
import { useTenant } from '@/context/TenantContext';

export function LanguageSelector({ value, onChange }) {
  const { settings } = useTenant();

  // Only show allowed languages for this tenant
  const allowedLanguages = settings?.allowedLanguages ?? ['en'];

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'ar', label: 'Arabic' },
  ].filter(lang => allowedLanguages.includes(lang.value));

  return (
    <select value={value} onChange={e => onChange(e.target.value)}>
      {languageOptions.map(lang => (
        <option key={lang.value} value={lang.value}>
          {lang.label}
        </option>
      ))}
    </select>
  );
}
```

---

## Step 8: Testing Multi-Tenancy
**Agent:** QA Agent  
**Duration:** 2-4 hours

**Isolation Tests:**

```typescript
// __tests__/multi-tenant/isolation.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import * as prefsService from '../../server/services/preferencesService';

// Two different tenants
const tenant1 = { tenantId: 'company-a', userId: 1, userRole: 'admin' };
const tenant2 = { tenantId: 'company-b', userId: 2, userRole: 'admin' };

describe('Multi-Tenant Isolation', () => {
  describe('User Preferences', () => {
    it('users can only access their own preferences', async () => {
      // Set preference for tenant 1 user
      await prefsService.updateUserPreferences(tenant1, {
        preferredLanguage: 'es',
      });

      // Get preferences for each tenant
      const prefs1 = await prefsService.getUserPreferences(tenant1);
      const prefs2 = await prefsService.getUserPreferences(tenant2);

      expect(prefs1.preferredLanguage).toBe('es');
      expect(prefs2.preferredLanguage).toBe('en'); // Default, not 'es'
    });

    it('admin can see all users within their tenant only', async () => {
      const allPrefs = await prefsService.getAllUserPreferences(tenant1);

      // Should only contain users from tenant1
      expect(allPrefs.every(p => p.tenantId === 'company-a')).toBe(true);
    });
  });

  describe('Tenant Settings', () => {
    it('tenant settings are isolated', async () => {
      // Update tenant 1 settings
      await tenantService.updateTenantSettings(tenant1, {
        defaultLanguage: 'es',
        allowedLanguages: ['en', 'es'],
      });

      // Check isolation
      const settings1 = await tenantService.getTenantSettings(tenant1);
      const settings2 = await tenantService.getTenantSettings(tenant2);

      expect(settings1.defaultLanguage).toBe('es');
      expect(settings2.defaultLanguage).toBe('en');
      expect(settings1.allowedLanguages).toEqual(['en', 'es']);
      expect(settings2.allowedLanguages).toContain('en');
    });
  });

  describe('Cross-Tenant Access Prevention', () => {
    it('cannot access another tenants data via API', async () => {
      // Try to access tenant2 data with tenant1 credentials
      const maliciousTenant = { ...tenant1, targetTenantId: 'company-b' };
      
      // This should fail or return only tenant1 data
      const result = await prefsService.getAllUserPreferences(maliciousTenant);
      
      expect(result.some(p => p.tenantId === 'company-b')).toBe(false);
    });
  });
});
```

---

## Step 9: Documentation
**Agent:** Architecture Agent  
**Duration:** 30 minutes

**Multi-Tenant Architecture Doc:**

```markdown
# Multi-Tenant Architecture

## Tenant Isolation

### Data Isolation Levels
| Level | Description | Implementation |
|-------|-------------|----------------|
| Row | Same table, filtered by tenantId | WHERE companyId = ? |
| Schema | Separate schemas per tenant | Not used |
| Database | Separate DB per tenant | Future consideration |

### Tenant Context Flow
```
Request → Auth Middleware → Tenant Context Middleware
                              ↓
                        Extract companyId from user
                              ↓
                        Add to request context
                              ↓
                        All queries filtered by tenant
```

### Security Measures
1. Tenant ID never from client input
2. Always derived from authenticated user
3. All queries include tenant filter
4. Admin actions scoped to tenant
5. No cross-tenant references allowed

## Adding Tenant-Aware Features

1. Add `companyId` or `userId` (which has companyId) column
2. Use `requireTenant(ctx)` in procedures
3. Include tenant filter in all queries
4. Test cross-tenant isolation
```

---

## Validation Checklist

### Data Isolation
- [ ] All queries filter by tenant
- [ ] No cross-tenant data leaks
- [ ] Tenant ID from server, not client
- [ ] Foreign keys within tenant

### Security
- [ ] Tenant context verified
- [ ] Admin actions scoped
- [ ] No tenant ID spoofing

### Testing
- [ ] Isolation tests pass
- [ ] Cross-tenant access denied
- [ ] Multi-tenant E2E tests pass

---

## Files Modified

| File | Action |
|------|--------|
| `drizzle/schema.ts` | Add tenant tables |
| `server/middleware/tenantContext.ts` | Create middleware |
| `server/services/*.ts` | Add tenant filtering |
| `server/routers/*.ts` | Use tenant context |
| `context/TenantContext.tsx` | Frontend context |
| `__tests__/multi-tenant/*.ts` | Isolation tests |

