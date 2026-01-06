# Glossary

Project-specific terms and their definitions.

---

## Business Terms

| Term | Definition |
|------|------------|
| **Ajnabi** | First customer - tutoring company |
| **Pipeline** | Configurable workflow for entity management (like a Kanban board) |
| **Stage** | Step in a pipeline (e.g., "New", "Contacted", "Enrolled") |
| **Entity** | Item managed in a pipeline (Student, Tutor, Package) |

---

## Technical Terms

| Term | Definition |
|------|------------|
| **Adapter** | Implementation of database interface (LocalStorage, Supabase) |
| **Barrel Export** | `index.ts` file that re-exports all items from a folder |
| **Context** | React Context for global state (Auth, CRM, Data) |
| **RBAC** | Role-Based Access Control - permissions by role |

---

## User Roles

| Role | Access Level |
|------|-------------|
| `admin` | Full access to everything |
| `dev` | Technical/system access |
| `management` | Financial data + team oversight |
| `sales` | Lead and opportunity management |
| `support` | Customer service access |
| `team` | Limited entity access |

---

## Field Types

| Type | Description | Example |
|------|-------------|---------|
| `text` | Plain text | Name |
| `email` | Email with validation | Email address |
| `phone` | Phone with validation | Phone number |
| `select` | Dropdown options | Status |
| `number` | Numeric input | Age |
| `date` | Date picker | Birth date |
| `currency` | Auto-formatted money | Price |

---

## File Naming

| Pattern | Meaning |
|---------|---------|
| `*Context.tsx` | React Context provider |
| `*Adapter.ts` | Database adapter implementation |
| `Pipeline*.tsx` | Pipeline-related component |
| `index.ts` | Barrel export file |
