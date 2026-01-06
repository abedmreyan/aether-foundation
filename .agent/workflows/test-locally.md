---
description: How to run and test the application locally
---

# Testing Locally

## Quick Start

```bash
# Install dependencies (first time only)
npm install

# Start development server
// turbo
npm run dev
```

Server runs at: `http://localhost:5173`

## Test Credentials

| Email | Password | Role | Access |
|-------|----------|------|--------|
| admin@ajnabi.com | admin123 | Admin | Full access |

## Common Test Scenarios

### 1. Authentication Flow
1. Navigate to `http://localhost:5173`
2. Enter test credentials
3. Verify redirect to Dashboard

### 2. CRM Pipeline Test
1. Login as admin
2. Navigate to CRM from sidebar
3. Test Kanban view: drag cards between stages
4. Test Table view: toggle view button
5. Test entity creation: click "Add" button

### 3. Settings Test
1. Login as admin
2. Navigate to Settings
3. Test each tab: Branding, Database, Defaults, Pipelines, Roles

## Clearing Local Data

Development uses localStorage. To reset:

1. Open browser DevTools (F12)
2. Go to Application → Local Storage
3. Delete keys with prefix:
   - `aether_platform_db_v1`
   - `aether_customer_db_*`

## Build Verification

```bash
// turbo
npm run build
```

Check for:
- TypeScript errors
- Missing imports
- Build warnings

## Preview Production Build

```bash
// turbo
npm run preview
```

## Debugging

### Common Issues

| Issue | Solution |
|-------|----------|
| Login fails | Clear localStorage, re-seed data |
| Types mismatch | Check `types/` folder exports |
| Context undefined | Ensure component is inside provider |
| Build fails | Run `npm run build` to see errors |

### DevTools

Use React DevTools extension to inspect:
- Component tree
- Context values
- State changes
