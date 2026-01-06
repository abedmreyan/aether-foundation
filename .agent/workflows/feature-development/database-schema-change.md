# Database Schema Change Workflow

## Overview

Workflow for safely modifying database schemas including adding columns, creating tables, modifying constraints, and handling migrations across development and production environments.

## Agents Involved

| Phase | Primary Agent | Supporting |
|-------|---------------|------------|
| Design | Architecture Agent | Backend |
| Migration | Backend Agent | DevOps |
| Testing | QA Agent | Backend |
| Deployment | DevOps Agent | Backend |

## Prerequisites

- [ ] Schema change requirements documented
- [ ] Impact analysis completed
- [ ] Rollback plan prepared
- [ ] Backup strategy confirmed

---

## Step 1: Impact Analysis
**Agent:** Architecture Agent  
**Duration:** 30-60 minutes

**Tasks:**
1. Identify affected tables
2. Map dependent code
3. Assess data migration needs
4. Evaluate downtime requirements
5. Plan backward compatibility

**Impact Assessment Template:**

```markdown
## Schema Change Impact Analysis

### Change Description
Adding `preferredLanguage` column to `users` table

### Affected Areas
- [ ] Tables: users
- [ ] Services: userService.ts, authService.ts
- [ ] Components: UserProfile.tsx, SettingsForm.tsx
- [ ] APIs: users.update, users.getProfile

### Data Migration
- Existing users: Set default value 'en'
- No data loss expected

### Downtime
- Required: No (additive change)
- Recommended maintenance window: N/A

### Rollback Plan
1. Run down migration
2. Deploy previous code version
3. No data loss expected
```

---

## Step 2: Schema Design
**Agent:** Architecture Agent  
**Duration:** 30 minutes

**Design the Change:**

```typescript
// Design document

// BEFORE
users: {
  id: INT PRIMARY KEY,
  email: VARCHAR(320),
  name: VARCHAR(255),
  role: ENUM('user', 'admin'),
  createdAt: TIMESTAMP
}

// AFTER
users: {
  id: INT PRIMARY KEY,
  email: VARCHAR(320),
  name: VARCHAR(255),
  role: ENUM('user', 'admin'),
  preferredLanguage: VARCHAR(10) DEFAULT 'en',  // NEW
  timezone: VARCHAR(50) DEFAULT 'UTC',           // NEW
  createdAt: TIMESTAMP
}
```

**Considerations:**
- Default values for existing rows
- Nullable vs NOT NULL
- Index requirements
- Foreign key constraints

---

## Step 3: Update Drizzle Schema
**Agent:** Backend Agent  
**Duration:** 30 minutes

**Modify Schema File:**

```typescript
// drizzle/schema.ts

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  
  // NEW COLUMNS
  preferredLanguage: varchar("preferredLanguage", { length: 10 }).default("en"),
  timezone: varchar("timezone", { length: 50 }).default("UTC"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
```

---

## Step 4: Generate Migration
**Agent:** Backend Agent  
**Duration:** 15 minutes

**Generate Migration Files:**

```bash
# Using Drizzle Kit
npm run db:push

# Or generate migration file
npx drizzle-kit generate:mysql

# Output:
# ✅ Generated migration: 0001_add_user_preferences.sql
```

**Review Generated SQL:**

```sql
-- drizzle/migrations/0001_add_user_preferences.sql

ALTER TABLE `users` 
ADD COLUMN `preferredLanguage` VARCHAR(10) DEFAULT 'en';

ALTER TABLE `users` 
ADD COLUMN `timezone` VARCHAR(50) DEFAULT 'UTC';
```

---

## Step 5: Create Manual Migration (if needed)
**Agent:** Backend Agent  
**Duration:** 30 minutes

**For Complex Migrations:**

```sql
-- migrations/0001_add_user_preferences.sql

-- UP Migration
BEGIN TRANSACTION;

-- Add columns
ALTER TABLE users 
ADD COLUMN preferredLanguage VARCHAR(10) DEFAULT 'en';

ALTER TABLE users 
ADD COLUMN timezone VARCHAR(50) DEFAULT 'UTC';

-- Migrate existing data (if needed)
UPDATE users 
SET preferredLanguage = 'en', timezone = 'UTC'
WHERE preferredLanguage IS NULL;

-- Add constraints
ALTER TABLE users 
ALTER COLUMN preferredLanguage SET NOT NULL;

COMMIT;

-- DOWN Migration (for rollback)
-- Run manually if needed
-- ALTER TABLE users DROP COLUMN preferredLanguage;
-- ALTER TABLE users DROP COLUMN timezone;
```

---

## Step 6: Update TypeScript Types
**Agent:** Architecture Agent  
**Duration:** 15 minutes

**Update Type Definitions:**

```typescript
// types/user.ts

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  preferredLanguage: string;  // NEW
  timezone: string;           // NEW
  createdAt: Date;
  updatedAt: Date;
}

// For Drizzle inference
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
```

---

## Step 7: Update Services
**Agent:** Backend Agent  
**Duration:** 1-2 hours

**Update Service Layer:**

```typescript
// server/services/userService.ts

export async function updateUserPreferences(
  userId: number,
  preferences: {
    preferredLanguage?: string;
    timezone?: string;
  }
): Promise<User> {
  const database = await getDb();
  
  const [updated] = await database
    .update(users)
    .set({
      preferredLanguage: preferences.preferredLanguage,
      timezone: preferences.timezone,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();
    
  return updated;
}
```

**Update tRPC Router:**

```typescript
// server/routers/users.ts

updatePreferences: protectedProcedure
  .input(z.object({
    preferredLanguage: z.string().length(2).optional(),
    timezone: z.string().max(50).optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    return updateUserPreferences(ctx.userId, input);
  }),
```

---

## Step 8: Update Frontend
**Agent:** Frontend Agent  
**Duration:** 1-2 hours

**Update Forms:**

```tsx
// client/src/components/settings/PreferencesTab.tsx

import { trpc } from '@/lib/trpc';

export function PreferencesTab() {
  const { data: user } = trpc.users.me.useQuery();
  const updatePreferences = trpc.users.updatePreferences.useMutation();

  const handleSubmit = async (data: FormData) => {
    await updatePreferences.mutateAsync({
      preferredLanguage: data.language,
      timezone: data.timezone,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <select name="language" defaultValue={user?.preferredLanguage}>
        <option value="en">English</option>
        <option value="es">Spanish</option>
        <option value="fr">French</option>
      </select>
      
      <select name="timezone" defaultValue={user?.timezone}>
        <option value="UTC">UTC</option>
        <option value="America/New_York">Eastern Time</option>
        {/* ... more timezones */}
      </select>
      
      <button type="submit">Save Preferences</button>
    </form>
  );
}
```

---

## Step 9: Testing
**Agent:** QA Agent  
**Duration:** 2-4 hours

**Test Migration:**

```bash
# Test in development
npm run db:push

# Verify schema
npm run db:studio  # Open Drizzle Studio
```

**Test Cases:**

```typescript
describe('User Preferences Schema', () => {
  it('creates user with default preferences', async () => {
    const user = await createUser({ email: 'test@example.com' });
    expect(user.preferredLanguage).toBe('en');
    expect(user.timezone).toBe('UTC');
  });

  it('updates user preferences', async () => {
    const updated = await updateUserPreferences(userId, {
      preferredLanguage: 'es',
      timezone: 'America/New_York',
    });
    expect(updated.preferredLanguage).toBe('es');
  });

  it('existing users have default values after migration', async () => {
    // After migration, verify existing users
    const users = await getAllUsers();
    expect(users.every(u => u.preferredLanguage !== null)).toBe(true);
  });
});
```

---

## Step 10: Deployment
**Agent:** DevOps Agent  
**Duration:** 1-2 hours

**Deployment Steps:**

### Development
```bash
# Apply migration locally
npm run db:push
npm run build
npm run test
```

### Staging
```bash
# Set DATABASE_URL to staging
export DATABASE_URL="staging-connection-string"

# Apply migration
npm run db:push

# Run smoke tests
npm run test:integration
```

### Production
```bash
# 1. Export Firebase data (optional backup)
firebase database:get / > backup.json

# 2. Apply migration during maintenance window
# For Firebase RTDB, update data structure directly or via script

# 3. Deploy application
gcloud run deploy aether-backend --image gcr.io/$PROJECT_ID/aether-backend

# 4. Verify
curl https://aether-backend-xxxxx.run.app/api/health
npm run test:smoke:production
```

---

## Rollback Procedure

### Automatic Rollback (Drizzle)
```bash
# Drizzle doesn't have built-in down migrations
# Must be done manually
```

### Manual Rollback
```sql
-- Connect to database
-- Run down migration
ALTER TABLE users DROP COLUMN preferredLanguage;
ALTER TABLE users DROP COLUMN timezone;

-- Verify
DESCRIBE users;
```

### Application Rollback
```bash
# Revert Cloud Run to previous revision
gcloud run services update-traffic aether-backend \
  --region us-central1 \
  --to-revisions PREVIOUS_REVISION=100

# Or rollback git and redeploy
git revert HEAD
git push
```

---

## Validation Checklist

### Schema
- [ ] Migration applies cleanly
- [ ] Rollback tested
- [ ] Default values correct
- [ ] Constraints enforced
- [ ] Indexes added (if needed)

### Application
- [ ] Types updated
- [ ] Services updated
- [ ] APIs updated
- [ ] Frontend updated
- [ ] Build passes

### Data
- [ ] Existing data preserved
- [ ] New records have defaults
- [ ] No orphaned records

### Production
- [ ] Backup taken
- [ ] Migration tested in staging
- [ ] Rollback plan verified
- [ ] Monitoring in place

---

## Common Migration Patterns

### Add Column with Default
```sql
ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active';
```

### Add Column NOT NULL (existing data)
```sql
-- Step 1: Add nullable
ALTER TABLE users ADD COLUMN status VARCHAR(20);

-- Step 2: Populate
UPDATE users SET status = 'active' WHERE status IS NULL;

-- Step 3: Add constraint
ALTER TABLE users ALTER COLUMN status SET NOT NULL;
```

### Rename Column
```sql
ALTER TABLE users RENAME COLUMN old_name TO new_name;
```

### Add Index
```sql
CREATE INDEX idx_users_email ON users(email);
```

### Add Foreign Key
```sql
ALTER TABLE orders 
ADD CONSTRAINT fk_orders_user 
FOREIGN KEY (userId) REFERENCES users(id);
```

---

## Files Modified

| File | Action |
|------|--------|
| `drizzle/schema.ts` | Update schema |
| `drizzle/migrations/*.sql` | Add migration |
| `types/user.ts` | Update types |
| `server/services/*.ts` | Update services |
| `server/routers/*.ts` | Update routers |
| `client/src/components/*.tsx` | Update UI |

