# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + Vite)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   Landing   │    │  Onboarding │    │  Dashboard  │         │
│  │    Page     │    │    Page     │    │    Page     │         │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘         │
│         │                  │                   │                 │
│         └──────────────────┴───────────────────┘                 │
│                            │                                     │
│  ┌─────────────────────────┴─────────────────────────┐          │
│  │              Context Providers                     │          │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐           │          │
│  │  │  Auth   │  │   CRM   │  │  Data   │           │          │
│  │  │ Context │  │ Context │  │ Context │           │          │
│  │  └────┬────┘  └────┬────┘  └────┬────┘           │          │
│  └───────┼────────────┼────────────┼─────────────────┘          │
│          │            │            │                             │
│  ┌───────┴────────────┴────────────┴─────────────────┐          │
│  │                   Services Layer                   │          │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────┐ │          │
│  │  │ PlatformDB   │  │ CustomerDB   │  │ Gemini  │ │          │
│  │  │  (Internal)  │  │  (Tenant)    │  │   AI    │ │          │
│  │  └──────────────┘  └──────────────┘  └─────────┘ │          │
│  └───────────────────────────────────────────────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      STORAGE LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   LocalStorage  │  │    Supabase     │  │   PostgreSQL    │ │
│  │   (Sandbox)     │  │   (Production)  │  │   (Optional)    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Module Dependencies

```
types/                    ← No dependencies (pure type definitions)
   ↓
services/                 ← Depends on types/
   ↓
context/                  ← Depends on types/, services/
   ↓
components/               ← Depends on types/, context/, services/
   ↓
pages/                    ← Depends on all above
   ↓
App.tsx                   ← Composes everything
```

---

## Data Flow

### Authentication Flow
```
Landing → login(email, password)
       → AuthContext.login()
       → platformDb.authenticate()
       → If success:
          → setUser(), setCompany()
          → CRMContext loads pipelines/roles
          → DataContext loads legacy data
          → Navigate to Dashboard
       → If fail:
          → Show error message
```

### Entity CRUD Flow
```
User Action → CRMContext method
           → CustomerDatabase adapter
           → Storage (Local/Supabase)
           → Update local state
           → Re-render UI
```

### Permission Flow
```
Component renders → Check user role
                 → canAccessPipeline()
                 → filterFieldsForRole()
                 → filterDataForRole()
                 → Render filtered content
```

---

## Multi-Tenant Architecture

Each tenant (company) has:
1. **Isolated data** via `companyId` in all records
2. **Custom pipelines** with their own stages/fields
3. **Custom roles** with specific permissions
4. **Separate database** connection (Supabase/Local)

---

## Key Design Decisions

1. **Barrel Exports** - All modules export via `index.ts` for clean imports
2. **Context + Hooks** - Prefer `useCRM()` over direct context access
3. **Adapter Pattern** - Database adapters for swappable storage
4. **RBAC** - Role-based access at field and entity level
5. **Type-First** - All data structures defined in `types/`
