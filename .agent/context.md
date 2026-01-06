# Aether Foundation - Project Context for AI Agents

This document provides comprehensive context for AI agents working on the Aether Foundation CRM project. Read this file before starting any task.

## Project Overview

**What is this?** A multi-tenant SaaS CRM platform built with React + TypeScript + Vite.

**First customer:** Ajnabi tutoring company (manages students, tutors, packages).

**Key features:**
- Configurable pipelines (Kanban + Table views)
- Role-based access control (RBAC)
- Multi-database support (Supabase, PostgreSQL, Local)
- AI consultant (Gemini)

---

## Directory Structure

```
aether_-foundation/
├── .agent/               # AI agent documentation (READ FIRST)
│   ├── context.md       # Project overview (this file)
│   ├── architecture.md  # System design
│   ├── state.md         # State management
│   ├── conventions.md   # Coding standards
│   ├── current-work.md  # Current priorities
│   ├── file-index.md    # Task-to-file lookup (NEW)
│   └── workflows/       # Step-by-step guides
│
├── types/                 # TypeScript type definitions
│   ├── core.ts           # Message, AppState, schemas
│   ├── company.ts        # Company, subscriptions
│   ├── user.ts           # User, auth types
│   ├── database.ts       # DB connection configs
│   ├── pipeline.ts       # Pipeline, stages, fields
│   ├── permissions.ts    # Roles, permissions
│   ├── crm.ts            # Entities (Student, Tutor, Package)
│   └── index.ts          # Barrel export
│
├── context/              # React Context providers
│   ├── AuthContext.tsx   # User auth, login/logout
│   ├── CRMContext.tsx    # Pipelines, roles, entities
│   ├── DataContext.tsx   # Files, schemas, AI
│   └── index.ts          # Barrel export
│
├── services/
│   ├── database/adapters/  # Database implementations
│   │   ├── CustomerDatabaseAdapter.ts  # Abstract base
│   │   ├── LocalStorageAdapter.ts      # Development
│   │   └── SupabaseAdapter.ts          # Production
│   ├── permissions/        # RBAC logic
│   │   ├── roleDefaults.ts
│   │   ├── accessControl.ts
│   │   └── dataFiltering.ts
│   ├── platformDatabase.ts  # Internal platform DB
│   ├── customerDatabase.ts  # Customer data adapter
│   └── validation.ts        # Field validation
│
├── components/
│   ├── ui/               # Reusable primitives
│   │   ├── Button.tsx
│   │   ├── Logo.tsx
│   │   └── ViewToggle.tsx
│   ├── navigation/       # Dashboard navigation
│   │   ├── types.ts      # Navigation types
│   │   ├── config.ts     # Menu configuration
│   │   ├── Sidebar.tsx
│   │   ├── SidebarItem.tsx
│   │   └── TopBar.tsx
│   ├── pipeline/         # Pipeline components
│   │   ├── StageEditModal.tsx
│   │   ├── FieldEditModal.tsx
│   │   └── constants.ts
│   ├── settings/         # Settings sub-components
│   │   ├── BrandingTab.tsx
│   │   ├── DatabaseTab.tsx
│   │   ├── DefaultsTab.tsx
│   │   ├── PipelinesTab.tsx
│   │   └── RolesTab.tsx
│   ├── PipelineBuilder.tsx
│   ├── PipelineKanban.tsx
│   ├── PipelineTable.tsx
│   └── EntityForm.tsx
│
├── pages/
│   ├── Landing.tsx       # Login/signup page
│   ├── Onboarding.tsx    # Initial setup wizard
│   ├── Dashboard.tsx     # Main app shell
│   ├── CRM.tsx           # CRM workspace
│   └── Settings.tsx      # Company settings
│
└── App.tsx               # Root component + GlobalContext
```

---

## How to Use Context Providers

### AuthContext - Authentication
```typescript
import { useAuth } from './context';

function Component() {
  const { user, login, logout, isPrivileged } = useAuth();
  
  if (!user) return <Login />;
  if (isPrivileged()) return <AdminPanel />;
  return <Dashboard />;
}
```

### CRMContext - Pipelines & Entities
```typescript
import { useCRM } from './context';

function EntityList() {
  const { pipelineConfigs, getEntities, createEntity } = useCRM();
  
  // Get entities with filters
  const students = await getEntities('students', { stage: 'new' });
  
  // Create new entity
  await createEntity('students', { name: 'John', email: 'john@test.com' });
}
```

### DataContext - Files & AI
```typescript
import { useData } from './context';

function FileManager() {
  const { uploadedFiles, addFile, chatHistory, addMessage } = useData();
  
  // Add file
  await addFile(file, 'Customer data CSV');
  
  // Access AI chat
  addMessage({ role: 'user', text: 'Analyze my data', timestamp: Date.now() });
}
```

---

## Key Types Reference

### User & Auth
```typescript
type UserRole = 'admin' | 'dev' | 'management' | 'sales' | 'support' | 'team';

interface User {
  id: string;
  companyId: string;
  email: string;
  name: string;
  role: UserRole;
}
```

### Pipelines
```typescript
interface PipelineConfig {
  id: string;
  companyId: string;
  name: string;
  entityType: string;      // 'students' | 'tutors' | 'packages'
  stages: StageDefinition[];
  fields: FieldDefinition[];
}

interface StageDefinition {
  id: string;
  name: string;
  color: string;
  order: number;
}

interface FieldDefinition {
  id: string;
  name: string;
  type: FieldType;         // 'text' | 'email' | 'phone' | 'select' | etc.
  label: string;
  required: boolean;
  isFinancial?: boolean;   // Hide from non-financial roles
  showInKanban?: boolean;
  showInTable?: boolean;
}
```

### CRM Entities
```typescript
interface CRMEntity {
  id: string;
  stage: string;
  createdAt: number;
  updatedAt: number;
  [key: string]: any;      // Dynamic fields from pipeline config
}

interface Student extends CRMEntity {
  name: string;
  email: string;
  phone: string;
}
```

---

## Common Tasks

### Adding a new pipeline field
1. Edit `services/platformDatabase.ts` → `createAjnabiPipelines()`
2. Add field to corresponding `FieldDefinition[]` array
3. Update `PipelineBuilder.tsx` if custom field type behavior needed

### Adding a new entity type
1. Add type to `types/crm.ts`
2. Create pipeline config in `platformDatabase.ts`
3. Entity CRUD works automatically via `CustomerDatabase`

### Modifying permissions
1. Edit `services/permissions/roleDefaults.ts` for default permissions
2. Edit `services/permissions/accessControl.ts` for permission logic
3. Edit `services/permissions/dataFiltering.ts` for data filtering

### Adding UI component
1. Create in `components/ui/` for primitives
2. Create in `components/pipeline/` for pipeline-specific
3. Export from respective `index.ts` barrel file

---

## Testing Credentials

```
Email: admin@ajnabi.com
Password: admin123
Role: Admin (full access)
```

---

## Build Commands

```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
```

---

## State Management Flow

```
User Login → AuthContext.login()
          → platformDb.authenticate()
          → Load company data
          → CRMContext loads pipelines/roles
          → DataContext loads legacy data
          → Navigate to Dashboard
```

---

## Import Patterns

**Preferred (modular):**
```typescript
import type { PipelineConfig } from './types/pipeline';
import { useCRM } from './context';
import { canAccessPipeline } from './services/permissions';
```

**Backward compatible:**
```typescript
import type { PipelineConfig, User } from './types';  // Barrel export
```

---

## Notes for AI Agents

1. **Always check types** - Import from `types/` for type definitions
2. **Use context hooks** - `useAuth()`, `useCRM()`, `useData()` for state
3. **Check permissions** - Use `canAccessPipeline()` before showing data
4. **Financial fields** - Use `isFinancial: true` to hide from non-financial roles
5. **Build verification** - Run `npm run build` after changes
