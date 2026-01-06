# State Management Guide

This document describes the state management architecture for the Aether Foundation CRM.

## Context Providers

The application uses three React Context providers to manage state:

### 1. AuthContext (`context/AuthContext.tsx`)

**Purpose:** User authentication and company state

**State:**
| Field | Type | Description |
|-------|------|-------------|
| `user` | `User \| null` | Current authenticated user |
| `company` | `Company \| null` | Current company (multi-tenant) |
| `isLoading` | `boolean` | Auth operation in progress |
| `error` | `string \| null` | Last auth error |

**Methods:**
| Method | Signature | Description |
|--------|-----------|-------------|
| `login` | `(email, password) => Promise<boolean>` | Authenticate user |
| `register` | `(name, email, password) => Promise<boolean>` | Register new user |
| `logout` | `() => void` | Clear auth state |
| `hasRole` | `(role) => boolean` | Check user role |
| `isPrivileged` | `() => boolean` | Check if admin/dev |

**Hook:** `useAuth()`

---

### 2. CRMContext (`context/CRMContext.tsx`)

**Purpose:** CRM configuration and entity operations

**State:**
| Field | Type | Description |
|-------|------|-------------|
| `pipelineConfigs` | `PipelineConfig[]` | All pipelines for company |
| `roleDefinitions` | `RoleDefinition[]` | All roles for company |
| `dbConnection` | `DbConnectionConfig \| null` | Database config |
| `customerDb` | `CustomerDatabase \| null` | Database instance |
| `isLoading` | `boolean` | CRM data loading |

**Methods:**
| Method | Signature | Description |
|--------|-----------|-------------|
| `loadPipelines` | `(companyId) => Promise<void>` | Load pipeline configs |
| `getPipeline` | `(id) => PipelineConfig \| undefined` | Get specific pipeline |
| `updatePipeline` | `(id, data) => Promise<void>` | Update pipeline |
| `createPipeline` | `(data) => Promise<PipelineConfig>` | Create new pipeline |
| `loadRoles` | `(companyId) => Promise<void>` | Load role definitions |
| `getRole` | `(id) => RoleDefinition \| undefined` | Get specific role |
| `getEntities` | `<T>(type, filters?) => Promise<PaginatedResult<T>>` | Query entities |
| `createEntity` | `<T>(type, data) => Promise<T>` | Create entity |
| `updateEntity` | `<T>(type, id, data) => Promise<T>` | Update entity |
| `deleteEntity` | `(type, id) => Promise<void>` | Delete entity |
| `moveEntityStage` | `(type, id, stage) => Promise<void>` | Move entity stage |

**Hook:** `useCRM()`

---

### 3. DataContext (`context/DataContext.tsx`)

**Purpose:** Legacy data operations and AI features

**State:**
| Field | Type | Description |
|-------|------|-------------|
| `businessProfile` | `BusinessProfile` | User's business info |
| `uploadedFiles` | `UploadedFile[]` | Uploaded file metadata |
| `dataSchemas` | `TableSchema[]` | Detected data schemas |
| `chatHistory` | `Message[]` | AI chat messages |
| `pipelines` | `PipelineRecommendation[]` | AI recommendations |
| `cloudConfig` | `CloudConfig` | Cloud connection config |

**Methods:**
| Method | Signature | Description |
|--------|-----------|-------------|
| `updateBusinessProfile` | `(data) => void` | Update business profile |
| `addFile` | `(file, desc) => Promise<void>` | Upload and process file |
| `removeFile` | `(id) => Promise<void>` | Remove uploaded file |
| `updateFileDescription` | `(id, desc) => void` | Update file description |
| `refineSchemas` | `() => Promise<void>` | AI schema refinement |
| `addMessage` | `(msg) => void` | Add chat message |
| `clearChatHistory` | `() => void` | Clear chat history |
| `setPipelines` | `(pipes) => void` | Set AI recommendations |
| `updateCloudConfig` | `(config) => void` | Update cloud config |

**Hook:** `useData()`

---

## Provider Composition

Providers should be composed in this order:

```tsx
<AuthProvider>
  <CRMProvider companyId={company?.id}>
    <DataProvider userEmail={user?.email}>
      <App />
    </DataProvider>
  </CRMProvider>
</AuthProvider>
```

---

## State Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        AuthContext                          │
│  user, company, login(), logout(), isPrivileged()          │
└─────────────────────────────────────────────────────────────┘
                              │
              companyId ──────┼────── userEmail
                              ▼                     
┌──────────────────────────────────────────────────────────────┐
│                        CRMContext                            │
│  pipelineConfigs, roleDefinitions, customerDb               │
│  getEntities(), createEntity(), updateEntity()              │
└──────────────────────────────────────────────────────────────┘
                              │
          Uses pipelines to determine entity types
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                       DataContext                            │
│  businessProfile, uploadedFiles, chatHistory, pipelines     │
│  addFile(), refineSchemas(), addMessage()                   │
└──────────────────────────────────────────────────────────────┘
```

---

## Database Services

### Platform Database (Internal)
- **File:** `services/platformDatabase.ts`
- **Purpose:** Manage companies, users, pipelines, roles
- **Storage:** localStorage (key: `aether_platform_db_v1`)

### Customer Database (Per-Tenant)
- **File:** `services/customerDatabase.ts`
- **Purpose:** Manage CRM entities for each company
- **Adapters:**
  - `LocalStorageAdapter` - Development/sandbox
  - `SupabaseAdapter` - Production

---

## Permission Checks

Use these functions from `services/permissions`:

```typescript
// Check pipeline access
canAccessPipeline(user, pipelineId, roles) => boolean

// Get access level
getPipelineAccessLevel(user, pipelineId, roles) => 'none' | 'view' | 'edit' | 'full'

// Check specific action
canPerformAction(user, pipelineId, 'create' | 'edit' | 'delete' | 'move', roles) => boolean

// Filter financial fields
filterFieldsForRole(fields, user, roles) => FieldDefinition[]

// Filter data
filterDataForRole(data, fields, user, roles) => T[]
```
