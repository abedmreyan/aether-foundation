# Onboarding New Customer Workflow

## Overview

Complete workflow for onboarding a new customer (tenant) to the Aether platform, including account setup, data migration, customization, and training.

## Agents Involved

| Phase | Primary Agent | Supporting |
|-------|---------------|------------|
| Setup | DevOps Agent | Backend |
| Configuration | Backend Agent | PM |
| Customization | Frontend Agent | Backend |
| Data Migration | Backend Agent | QA |
| Training | PM Agent | All |

## Prerequisites

- [ ] Customer contract signed
- [ ] Technical requirements gathered
- [ ] Data export from legacy system (if any)
- [ ] Admin user information

---

## Step 1: Tenant Creation
**Agent:** DevOps Agent  
**Duration:** 30 minutes

**Create Tenant Account:**

```typescript
// scripts/create-tenant.ts
import { db } from '../server/db';
import { companies, users, tenantSettings } from '../drizzle/schema';
import { hashPassword } from '../server/auth';

async function createTenant(config: TenantConfig) {
  const { companyName, adminEmail, adminPassword, industry, plan } = config;

  // Generate unique company ID
  const companyId = `${companyName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

  // Create company
  await db.insert(companies).values({
    id: companyId,
    name: companyName,
    industry,
    plan,
    status: 'active',
    createdAt: new Date(),
  });

  // Create admin user
  const hashedPassword = await hashPassword(adminPassword);
  await db.insert(users).values({
    email: adminEmail,
    password: hashedPassword,
    name: 'Admin',
    role: 'admin',
    companyId,
    createdAt: new Date(),
  });

  // Create default tenant settings
  await db.insert(tenantSettings).values({
    companyId,
    defaultLanguage: 'en',
    defaultTimezone: 'UTC',
    allowedLanguages: JSON.stringify(['en', 'es', 'fr', 'ar']),
    brandingConfig: JSON.stringify({
      primaryColor: '#3B82F6',
      companyName,
    }),
  });

  console.log(`✓ Tenant created: ${companyId}`);
  console.log(`✓ Admin user: ${adminEmail}`);

  return { companyId, adminEmail };
}
```

**Run Script:**

```bash
npx tsx scripts/create-tenant.ts \
  --company "New Customer Inc" \
  --admin-email "admin@newcustomer.com" \
  --admin-password "SecurePass123!" \
  --plan "professional"
```

---

## Step 2: Pipeline Configuration
**Agent:** Backend Agent  
**Duration:** 1-2 hours

**Create Customer-Specific Pipelines:**

```typescript
// services/customerOnboarding.ts
import { db } from '../db';
import { pipelines, stages, fields } from '../../drizzle/schema';

interface PipelineTemplate {
  name: string;
  entityType: string;
  stages: Array<{ name: string; color: string }>;
  fields: Array<{
    name: string;
    type: string;
    label: string;
    required: boolean;
    options?: string[];
    isFinancial?: boolean;
  }>;
}

const tutorCompanyTemplates: PipelineTemplate[] = [
  {
    name: 'Students',
    entityType: 'students',
    stages: [
      { name: 'New Inquiry', color: '#3B82F6' },
      { name: 'Assessment', color: '#F59E0B' },
      { name: 'Active', color: '#10B981' },
      { name: 'On Hold', color: '#6B7280' },
      { name: 'Completed', color: '#8B5CF6' },
    ],
    fields: [
      { name: 'name', type: 'text', label: 'Full Name', required: true },
      { name: 'email', type: 'email', label: 'Email', required: true },
      { name: 'phone', type: 'phone', label: 'Phone', required: false },
      { name: 'grade', type: 'select', label: 'Grade Level', required: true, 
        options: ['Elementary', 'Middle School', 'High School', 'College'] },
      { name: 'subjects', type: 'multiselect', label: 'Subjects', required: true,
        options: ['Math', 'Science', 'English', 'History', 'Languages'] },
      { name: 'monthlyFee', type: 'number', label: 'Monthly Fee', required: true, isFinancial: true },
    ],
  },
  {
    name: 'Tutors',
    entityType: 'tutors',
    stages: [
      { name: 'Applied', color: '#3B82F6' },
      { name: 'Screening', color: '#F59E0B' },
      { name: 'Interview', color: '#8B5CF6' },
      { name: 'Active', color: '#10B981' },
      { name: 'Inactive', color: '#EF4444' },
    ],
    fields: [
      { name: 'name', type: 'text', label: 'Full Name', required: true },
      { name: 'email', type: 'email', label: 'Email', required: true },
      { name: 'phone', type: 'phone', label: 'Phone', required: true },
      { name: 'subjects', type: 'multiselect', label: 'Subjects', required: true },
      { name: 'hourlyRate', type: 'number', label: 'Hourly Rate', required: true, isFinancial: true },
      { name: 'availability', type: 'textarea', label: 'Availability', required: false },
    ],
  },
];

async function setupPipelinesForTenant(
  companyId: string, 
  industry: 'tutoring' | 'sales' | 'support'
) {
  const templates = industry === 'tutoring' 
    ? tutorCompanyTemplates 
    : getIndustryTemplates(industry);

  for (const template of templates) {
    // Create pipeline
    const [pipeline] = await db.insert(pipelines).values({
      companyId,
      name: template.name,
      entityType: template.entityType,
    }).returning();

    // Create stages
    for (let i = 0; i < template.stages.length; i++) {
      await db.insert(stages).values({
        pipelineId: pipeline.id,
        name: template.stages[i].name,
        color: template.stages[i].color,
        order: i,
      });
    }

    // Create fields
    for (const field of template.fields) {
      await db.insert(fields).values({
        pipelineId: pipeline.id,
        name: field.name,
        type: field.type,
        label: field.label,
        required: field.required,
        options: field.options ? JSON.stringify(field.options) : null,
        isFinancial: field.isFinancial ?? false,
      });
    }
  }

  console.log(`✓ Created ${templates.length} pipelines for ${companyId}`);
}
```

---

## Step 3: Role Setup
**Agent:** Backend Agent  
**Duration:** 30-60 minutes

**Create Default Roles:**

```typescript
// services/roleSetup.ts
import { db } from '../db';
import { roles, rolePermissions } from '../../drizzle/schema';

const defaultRoles = [
  {
    name: 'admin',
    displayName: 'Administrator',
    description: 'Full system access',
    permissions: {
      pipelines: { '*': { view: true, create: true, edit: true, delete: true, viewFinancial: true }},
      features: { settings: true, reports: true, users: true, billing: true },
    },
  },
  {
    name: 'manager',
    displayName: 'Manager',
    description: 'Team and operations management',
    permissions: {
      pipelines: { '*': { view: true, create: true, edit: true, delete: false, viewFinancial: true }},
      features: { settings: false, reports: true, users: false, billing: false },
    },
  },
  {
    name: 'staff',
    displayName: 'Staff',
    description: 'Day-to-day operations',
    permissions: {
      pipelines: { '*': { view: true, create: true, edit: true, delete: false, viewFinancial: false }},
      features: { settings: false, reports: 'own', users: false, billing: false },
    },
  },
  {
    name: 'readonly',
    displayName: 'Read Only',
    description: 'View only access',
    permissions: {
      pipelines: { '*': { view: true, create: false, edit: false, delete: false, viewFinancial: false }},
      features: { settings: false, reports: false, users: false, billing: false },
    },
  },
];

async function setupRolesForTenant(companyId: string) {
  for (const role of defaultRoles) {
    await db.insert(roles).values({
      companyId,
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      permissions: JSON.stringify(role.permissions),
      isSystem: true,
    });
  }

  console.log(`✓ Created ${defaultRoles.length} roles for ${companyId}`);
}
```

---

## Step 4: Data Migration
**Agent:** Backend Agent  
**Duration:** 2-8 hours (varies by data size)

**Migration Script:**

```typescript
// scripts/migrate-customer-data.ts
import * as fs from 'fs';
import * as csv from 'csv-parse/sync';
import { db } from '../server/db';
import { entities } from '../drizzle/schema';

interface MigrationConfig {
  companyId: string;
  pipelineType: string;
  csvPath: string;
  fieldMapping: Record<string, string>;
  defaultStage: string;
}

async function migrateData(config: MigrationConfig) {
  const { companyId, pipelineType, csvPath, fieldMapping, defaultStage } = config;

  // Read CSV
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  const records = csv.parse(fileContent, { columns: true });

  console.log(`Found ${records.length} records to migrate`);

  let migrated = 0;
  let failed = 0;

  for (const record of records) {
    try {
      // Map fields
      const entityData: Record<string, any> = {
        stage: defaultStage,
      };

      for (const [csvField, dbField] of Object.entries(fieldMapping)) {
        entityData[dbField] = record[csvField];
      }

      // Insert entity
      await db.insert(entities).values({
        companyId,
        pipelineType,
        data: JSON.stringify(entityData),
        stage: defaultStage,
        createdAt: new Date(),
      });

      migrated++;
    } catch (error) {
      console.error(`Failed to migrate record:`, record, error);
      failed++;
    }
  }

  console.log(`✓ Migrated: ${migrated}, Failed: ${failed}`);
  return { migrated, failed };
}

// Usage
await migrateData({
  companyId: 'new-customer-123',
  pipelineType: 'students',
  csvPath: './data/students-export.csv',
  fieldMapping: {
    'Student Name': 'name',
    'Email Address': 'email',
    'Phone Number': 'phone',
    'Grade': 'grade',
    'Monthly Payment': 'monthlyFee',
  },
  defaultStage: 'active',
});
```

**Data Validation:**

```typescript
// Validate migrated data
async function validateMigration(companyId: string) {
  const entityCounts = await db
    .select({
      pipelineType: entities.pipelineType,
      count: sql`count(*)`,
    })
    .from(entities)
    .where(eq(entities.companyId, companyId))
    .groupBy(entities.pipelineType);

  console.log('Migration Summary:');
  for (const { pipelineType, count } of entityCounts) {
    console.log(`  ${pipelineType}: ${count} records`);
  }
}
```

---

## Step 5: Branding Customization
**Agent:** Frontend Agent  
**Duration:** 1-2 hours

**Branding Configuration:**

```typescript
// Configure via tenant settings
await updateTenantSettings(tenantContext, {
  brandingConfig: {
    primaryColor: '#FF6B00',  // Customer's brand color
    logo: 'https://storage.example.com/logos/new-customer.png',
    companyName: 'New Customer Inc',
    favicon: 'https://storage.example.com/favicons/new-customer.ico',
    emailFooter: 'New Customer Inc | 123 Main St | contact@newcustomer.com',
  },
});
```

**CSS Variables:**

```css
/* Auto-generated from branding config */
:root {
  --color-primary: #FF6B00;
  --color-primary-dark: #CC5600;
  --color-primary-light: #FF8533;
}
```

---

## Step 6: Integration Setup
**Agent:** DevOps Agent  
**Duration:** 1-2 hours

**Configure Integrations:**

```typescript
// Set up Google Tasks for customer
await db.insert(integrations).values({
  companyId,
  type: 'google_tasks',
  config: JSON.stringify({
    taskListId: 'customer-task-list-id',
    syncEnabled: true,
    syncInterval: 15,
  }),
  status: 'active',
});

// Set up email integration
await db.insert(integrations).values({
  companyId,
  type: 'email',
  config: JSON.stringify({
    provider: 'sendgrid',
    fromEmail: 'noreply@newcustomer.com',
    fromName: 'New Customer',
  }),
  status: 'pending_verification',
});
```

---

## Step 7: User Invitations
**Agent:** Backend Agent  
**Duration:** 30 minutes

**Send User Invitations:**

```typescript
// scripts/invite-users.ts
import { db } from '../server/db';
import { userInvitations } from '../drizzle/schema';
import { sendEmail } from '../server/email';

interface UserInvite {
  email: string;
  name: string;
  role: string;
}

async function inviteUsers(companyId: string, users: UserInvite[]) {
  for (const user of users) {
    // Generate invite token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Store invitation
    await db.insert(userInvitations).values({
      companyId,
      email: user.email,
      name: user.name,
      role: user.role,
      token,
      expiresAt,
      createdAt: new Date(),
    });

    // Send invitation email
    await sendEmail({
      to: user.email,
      subject: 'You\'re invited to join Aether',
      template: 'user-invitation',
      data: {
        name: user.name,
        inviteUrl: `https://app.aether.com/accept-invite?token=${token}`,
        companyName: 'New Customer Inc',
      },
    });

    console.log(`✓ Invited ${user.email} as ${user.role}`);
  }
}

// Usage
await inviteUsers('new-customer-123', [
  { email: 'manager@newcustomer.com', name: 'John Manager', role: 'manager' },
  { email: 'staff1@newcustomer.com', name: 'Jane Staff', role: 'staff' },
  { email: 'staff2@newcustomer.com', name: 'Bob Staff', role: 'staff' },
]);
```

---

## Step 8: Testing
**Agent:** QA Agent  
**Duration:** 2-4 hours

**Onboarding Validation Checklist:**

```markdown
## Onboarding Validation: New Customer Inc

### Account Setup
- [ ] Company created in database
- [ ] Admin user can login
- [ ] Admin sees correct company name

### Pipelines
- [ ] All pipelines visible
- [ ] Stages configured correctly
- [ ] Fields display properly
- [ ] Financial fields restricted to admin

### Data Migration
- [ ] All records imported
- [ ] Data displays correctly
- [ ] Search works
- [ ] Filters work

### Permissions
- [ ] Admin has full access
- [ ] Manager role works
- [ ] Staff role restricted correctly
- [ ] Read-only user can't edit

### Branding
- [ ] Logo displays correctly
- [ ] Colors applied
- [ ] Company name in header

### Integrations
- [ ] Google Tasks syncing
- [ ] Email sending works
- [ ] Webhooks configured

### User Invitations
- [ ] Invites sent
- [ ] Accept invite flow works
- [ ] New users can login
```

---

## Step 9: Training Session
**Agent:** PM Agent  
**Duration:** 2-4 hours

**Training Agenda:**

```markdown
## Customer Training: New Customer Inc

### Session 1: Admin Training (2 hours)
- Platform overview
- User management
- Pipeline customization
- Settings and configuration
- Reporting basics

### Session 2: Staff Training (1 hour)
- Daily workflows
- Entity management
- Kanban vs Table views
- Search and filters

### Session 3: Advanced Features (1 hour)
- Google Tasks integration
- Automation rules
- Custom reports
- API access (if applicable)

### Materials Provided
- [ ] Quick start guide
- [ ] Video tutorials
- [ ] FAQ document
- [ ] Support contact info
```

---

## Step 10: Go-Live Checklist
**Agent:** DevOps Agent  
**Duration:** 1 hour

**Final Checklist:**

```markdown
## Go-Live Checklist: New Customer Inc

### Technical
- [ ] All tests passing
- [ ] Performance acceptable
- [ ] Backups configured
- [ ] Monitoring active
- [ ] SSL certificate valid

### Data
- [ ] All data migrated
- [ ] Data validated
- [ ] No duplicate records
- [ ] Historical data accessible

### Users
- [ ] All users invited
- [ ] Admin trained
- [ ] Staff trained
- [ ] Support escalation path defined

### Documentation
- [ ] Custom docs provided
- [ ] API docs shared (if needed)
- [ ] Training videos accessible

### Support
- [ ] Support SLA defined
- [ ] Primary contact identified
- [ ] Escalation path documented

### Sign-off
- [ ] Customer approval
- [ ] Technical approval
- [ ] Go-live date confirmed
```

---

## Validation Checklist

### Setup
- [ ] Tenant created
- [ ] Pipelines configured
- [ ] Roles created
- [ ] Branding applied

### Data
- [ ] Migration complete
- [ ] Data validated
- [ ] No errors

### Users
- [ ] Admin active
- [ ] Users invited
- [ ] Permissions working

### Integration
- [ ] External services connected
- [ ] Sync working
- [ ] Webhooks active

---

## Files Modified

| File | Action |
|------|--------|
| `scripts/create-tenant.ts` | Tenant creation |
| `scripts/migrate-customer-data.ts` | Data migration |
| `scripts/invite-users.ts` | User invitations |
| `services/customerOnboarding.ts` | Pipeline setup |
| `services/roleSetup.ts` | Role creation |

