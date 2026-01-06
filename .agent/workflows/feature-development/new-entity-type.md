# New CRM Entity Type Workflow

## Overview

Workflow for adding a new entity type to the Aether CRM (e.g., Student, Tutor, Package, Lead, Contact). This includes type definitions, pipeline configuration, database setup, and CRUD operations.

## Agents Involved

| Phase | Primary Agent | Supporting |
|-------|---------------|------------|
| Design | Architecture Agent | PM |
| Types | Architecture Agent | - |
| Database | Backend Agent | Architecture |
| Services | Backend Agent | Architecture |
| UI | Frontend Agent | Backend |
| Permissions | Backend Agent | - |
| Testing | QA Agent | All |

## Prerequisites

- [ ] Entity requirements defined
- [ ] Field list specified
- [ ] Pipeline stages defined
- [ ] Permission requirements known
- [ ] Relationships to other entities mapped

---

## Step 1: Entity Design
**Agent:** Architecture Agent  
**Duration:** 30-60 minutes

**Tasks:**
1. Define entity fields
2. Map relationships
3. Identify required vs optional fields
4. Plan validation rules
5. Define financial fields (if any)

**Entity Specification Template:**

```typescript
// Design document - not actual code
EntitySpec {
  name: "Lead"
  pluralName: "leads"
  
  fields: [
    { name: "name", type: "text", required: true },
    { name: "email", type: "email", required: true },
    { name: "phone", type: "phone", required: false },
    { name: "source", type: "select", options: ["Website", "Referral", "Ad"] },
    { name: "estimatedValue", type: "number", isFinancial: true },
    { name: "notes", type: "textarea", required: false }
  ]
  
  stages: [
    { name: "New", color: "#3B82F6" },
    { name: "Contacted", color: "#F59E0B" },
    { name: "Qualified", color: "#10B981" },
    { name: "Proposal", color: "#8B5CF6" },
    { name: "Won", color: "#22C55E" },
    { name: "Lost", color: "#EF4444" }
  ]
  
  relationships: [
    { entity: "Contact", type: "one-to-many" }
  ]
}
```

---

## Step 2: Type Definitions
**Agent:** Architecture Agent  
**Duration:** 30 minutes

**Create Type File:**

```typescript
// types/crm.ts

// Add to existing CRM types or create new file

export interface Lead extends CRMEntity {
  name: string;
  email: string;
  phone?: string;
  source: 'Website' | 'Referral' | 'Ad' | 'Other';
  estimatedValue?: number;
  notes?: string;
  assignedTo?: string;
}

export type LeadStage = 
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'won'
  | 'lost';
```

**Update Type Barrel:**

```typescript
// types/index.ts
export type { Lead, LeadStage } from './crm';
```

---

## Step 3: Pipeline Configuration
**Agent:** Backend Agent  
**Duration:** 30-60 minutes

**Update Platform Database:**

```typescript
// services/platformDatabase.ts

// Add to createPipelines() or createAjnabiPipelines()

const leadsPipeline: PipelineConfig = {
  id: 'pipeline-leads',
  companyId: company.id,
  name: 'Leads',
  entityType: 'leads',
  stages: [
    { id: 'stage-new', name: 'New', color: '#3B82F6', order: 0 },
    { id: 'stage-contacted', name: 'Contacted', color: '#F59E0B', order: 1 },
    { id: 'stage-qualified', name: 'Qualified', color: '#10B981', order: 2 },
    { id: 'stage-proposal', name: 'Proposal', color: '#8B5CF6', order: 3 },
    { id: 'stage-won', name: 'Won', color: '#22C55E', order: 4 },
    { id: 'stage-lost', name: 'Lost', color: '#EF4444', order: 5 },
  ],
  fields: [
    {
      id: 'field-name',
      name: 'name',
      type: 'text',
      label: 'Name',
      required: true,
      showInKanban: true,
      showInTable: true,
    },
    {
      id: 'field-email',
      name: 'email',
      type: 'email',
      label: 'Email',
      required: true,
      showInKanban: false,
      showInTable: true,
    },
    {
      id: 'field-phone',
      name: 'phone',
      type: 'phone',
      label: 'Phone',
      required: false,
      showInKanban: false,
      showInTable: true,
    },
    {
      id: 'field-source',
      name: 'source',
      type: 'select',
      label: 'Source',
      required: true,
      options: [
        { value: 'website', label: 'Website' },
        { value: 'referral', label: 'Referral' },
        { value: 'ad', label: 'Advertising' },
        { value: 'other', label: 'Other' },
      ],
      showInKanban: true,
      showInTable: true,
    },
    {
      id: 'field-value',
      name: 'estimatedValue',
      type: 'number',
      label: 'Estimated Value',
      required: false,
      isFinancial: true,
      showInKanban: true,
      showInTable: true,
    },
    {
      id: 'field-notes',
      name: 'notes',
      type: 'textarea',
      label: 'Notes',
      required: false,
      showInKanban: false,
      showInTable: false,
    },
  ],
};

// Add to pipelines array
pipelines.push(leadsPipeline);
```

---

## Step 4: Database Structure (Firebase RTDB)
**Agent:** Backend Agent  
**Duration:** 30 minutes

**For Firebase Realtime Database:**

```json
// Firebase RTDB structure
{
  "leads": {
    "lead-id-1": {
      "companyId": "company-1",
      "stage": "new",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "source": "website",
      "estimatedValue": 5000,
      "notes": "Interested in premium package",
      "assignedTo": "user-id-1",
      "createdAt": 1702847200000,
      "updatedAt": 1702847200000
    }
  },
  "leadsByCompany": {
    "company-1": {
      "lead-id-1": true,
      "lead-id-2": true
    }
  },
  "leadsByStage": {
    "new": { "lead-id-1": true },
    "contacted": { "lead-id-2": true }
  }
}
```

**For LocalStorage (development):**
- Entity data stored in CustomerDatabase adapter
- No schema changes needed if using dynamic fields

---

## Step 5: Service Layer
**Agent:** Backend Agent  
**Duration:** 1-2 hours

**Add to Customer Database Service:**

```typescript
// services/customerDatabase.ts

// If using adapter pattern, CRUD is automatic
// Just ensure entityType is registered

// For specific business logic:
export async function getLeadsByStage(
  companyId: string,
  stage: LeadStage
): Promise<Lead[]> {
  return getEntities<Lead>('leads', { 
    companyId, 
    filters: { stage } 
  });
}

export async function convertLeadToContact(leadId: string): Promise<Contact> {
  const lead = await getEntityById<Lead>('leads', leadId);
  
  // Create contact from lead
  const contact = await createEntity<Contact>('contacts', {
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    source: `Converted from Lead ${leadId}`,
  });
  
  // Update lead stage
  await updateEntity<Lead>('leads', leadId, { stage: 'won' });
  
  return contact;
}
```

---

## Step 6: Navigation Integration
**Agent:** Frontend Agent  
**Duration:** 15-30 minutes

**Update Navigation Config:**

```typescript
// components/navigation/config.ts

import { Users, UserPlus, Package, Target } from 'lucide-react';

export const pipelineNavItems = [
  // ... existing items
  {
    id: 'leads',
    label: 'Leads',
    icon: Target,
    path: '/crm/leads',
    entityType: 'leads',
    badge: true,  // Show count badge
  },
];
```

---

## Step 7: Permission Configuration
**Agent:** Backend Agent  
**Duration:** 30 minutes

**Update Role Defaults:**

```typescript
// services/permissions/roleDefaults.ts

export const roleDefaults: Record<UserRole, RolePermissions> = {
  admin: {
    pipelines: {
      // ... existing
      leads: { 
        view: true, 
        create: true, 
        edit: true, 
        delete: true,
        viewFinancial: true 
      },
    },
  },
  sales: {
    pipelines: {
      leads: { 
        view: true, 
        create: true, 
        edit: true, 
        delete: false,
        viewFinancial: true 
      },
    },
  },
  support: {
    pipelines: {
      leads: { 
        view: true, 
        create: false, 
        edit: false, 
        delete: false,
        viewFinancial: false 
      },
    },
  },
  // ... other roles
};
```

**Update Access Control:**

```typescript
// services/permissions/accessControl.ts

export function canAccessPipeline(
  user: User,
  pipelineId: string,
  action: 'view' | 'create' | 'edit' | 'delete'
): boolean {
  const role = user.role;
  const permissions = roleDefaults[role];
  
  // Extract entity type from pipeline
  const entityType = pipelineId.replace('pipeline-', '');
  
  return permissions.pipelines[entityType]?.[action] ?? false;
}
```

---

## Step 8: UI Components
**Agent:** Frontend Agent  
**Duration:** 2-4 hours

**Entity Renders in Pipeline Views:**

The existing `PipelineKanban.tsx` and `PipelineTable.tsx` components should automatically render the new entity type if:
1. Pipeline config is properly defined
2. Fields are specified with `showInKanban` / `showInTable`

**Custom Entity Card (if needed):**

```tsx
// components/pipeline/LeadCard.tsx

import { Lead } from '@/types';
import { formatCurrency } from '@/utils';

interface LeadCardProps {
  lead: Lead;
  showFinancial: boolean;
}

export function LeadCard({ lead, showFinancial }: LeadCardProps) {
  return (
    <div className="lead-card">
      <h4>{lead.name}</h4>
      <p className="text-sm text-gray-600">{lead.email}</p>
      <div className="flex items-center gap-2 mt-2">
        <span className="badge">{lead.source}</span>
        {showFinancial && lead.estimatedValue && (
          <span className="text-green-600">
            {formatCurrency(lead.estimatedValue)}
          </span>
        )}
      </div>
    </div>
  );
}
```

---

## Step 9: Entity Form
**Agent:** Frontend Agent  
**Duration:** 1-2 hours

**The EntityForm component should handle this automatically based on field definitions.**

**Custom Form Logic (if needed):**

```tsx
// components/forms/LeadForm.tsx

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lead } from '@/types';

const leadSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  source: z.enum(['website', 'referral', 'ad', 'other']),
  estimatedValue: z.number().optional(),
  notes: z.string().optional(),
});

interface LeadFormProps {
  onSubmit: (data: Lead) => void;
  initialData?: Partial<Lead>;
}

export function LeadForm({ onSubmit, initialData }: LeadFormProps) {
  const form = useForm({
    resolver: zodResolver(leadSchema),
    defaultValues: initialData,
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

---

## Step 10: Testing
**Agent:** QA Agent  
**Duration:** 2-4 hours

**Test Cases:**

```typescript
// __tests__/leads.test.ts

describe('Leads Entity', () => {
  describe('CRUD Operations', () => {
    it('creates a new lead', async () => {
      const lead = await createEntity('leads', {
        name: 'Test Lead',
        email: 'test@example.com',
        source: 'website',
      });
      expect(lead.id).toBeDefined();
    });

    it('updates lead stage', async () => {
      const lead = await updateEntity('leads', leadId, {
        stage: 'contacted',
      });
      expect(lead.stage).toBe('contacted');
    });

    it('filters leads by stage', async () => {
      const leads = await getLeadsByStage(companyId, 'new');
      expect(leads.every(l => l.stage === 'new')).toBe(true);
    });
  });

  describe('Permissions', () => {
    it('allows sales to create leads', () => {
      expect(canAccessPipeline(salesUser, 'leads', 'create')).toBe(true);
    });

    it('denies support from creating leads', () => {
      expect(canAccessPipeline(supportUser, 'leads', 'create')).toBe(false);
    });

    it('hides financial fields from non-financial roles', () => {
      const fields = filterFieldsForRole(leadFields, supportUser);
      expect(fields.find(f => f.name === 'estimatedValue')).toBeUndefined();
    });
  });

  describe('Pipeline View', () => {
    it('renders lead in kanban', () => {
      render(<PipelineKanban pipeline={leadsPipeline} />);
      expect(screen.getByText('Test Lead')).toBeInTheDocument();
    });

    it('renders lead in table', () => {
      render(<PipelineTable pipeline={leadsPipeline} />);
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });
});
```

---

## Validation Checklist

### Build
```bash
npm run build
npm run check
```

### Functionality
- [ ] Entity appears in navigation
- [ ] Kanban view works
- [ ] Table view works
- [ ] Create form works
- [ ] Edit form works
- [ ] Delete works
- [ ] Stage transitions work
- [ ] Search/filter works

### Permissions
- [ ] Role-based access enforced
- [ ] Financial fields hidden correctly
- [ ] Multi-tenant isolation works

### Data
- [ ] Data persists correctly
- [ ] Relationships work (if any)
- [ ] Validation enforced

---

## Files Modified

| File | Action |
|------|--------|
| `types/crm.ts` | Add entity type |
| `types/index.ts` | Export type |
| `services/platformDatabase.ts` | Add pipeline config |
| `services/customerDatabase.ts` | Add service methods (optional) |
| `services/permissions/roleDefaults.ts` | Add permissions |
| `components/navigation/config.ts` | Add nav item |
| `drizzle/schema.ts` | Add table (if SQL) |

