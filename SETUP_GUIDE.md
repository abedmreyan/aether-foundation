# Aether Systems - Development Team Setup Guide

Complete guide for setting up the Aether Systems ecosystem for development.

---

## 📋 Prerequisites

Before starting, ensure you have:

- [ ] **Node.js** 20.x or later
- [ ] **npm** or **pnpm** (Support uses pnpm)
- [ ] **Git** installed
- [ ] **Azure account** (for authentication testing)
- [ ] **Code editor** (VS Code recommended)
- [ ] **Terminal access**

---

## 🏗️ Project Structure

```
aether_-foundation/
├── .agent/                    # Foundation AI agent docs (14 files)
├── src/                       # Foundation CRM source
├── services/                  # Database services
├── vite.config.ts            # Port: 5173
├── .env                       # Foundation environment
├── .cursorrules              # AI agent rules
└── aether-support/           # Support app (nested)
    ├── .agent/               # Support AI agent docs (3 files)
    ├── client/               # React frontend
    ├── server/               # Node.js backend
    │   ├── _core/           # Business logic
    │   └── database/        # Database adapter
    ├── .env                  # Support environment
    └── .cursorrules         # AI agent rules
```

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Clone Repository

```bash
cd ~/Desktop
# Repository should already be at:
# /Users/abedmreyan/Desktop/aether_-foundation
```

### Step 2: Install Dependencies

```bash
# Install Foundation dependencies
cd aether_-foundation
npm install

# Install Support dependencies
cd aether-support
npm install --legacy-peer-deps
# Note: --legacy-peer-deps needed due to Vite version conflicts
```

### Step 3: Create Environment Files

**Foundation (Root `.env`):**
```bash
cd /Users/abedmreyan/Desktop/aether_-foundation

cat > .env << 'EOF'
# Azure AD Authentication
AZURE_TENANT_ID=your-azure-tenant-id-here
AZURE_CLIENT_ID=your-azure-client-id-here
AZURE_CLIENT_SECRET=your-azure-client-secret-here
AZURE_REDIRECT_URI=http://localhost:5173/api/auth/callback

# Gemini API
GEMINI_API_KEY=your-gemini-api-key-here
EOF
```

**Support (`aether-support/.env`):**
```bash
cd /Users/abedmreyan/Desktop/aether_-foundation/aether-support

cat > .env << 'EOF'
# Azure AD Authentication
AZURE_TENANT_ID=your-azure-tenant-id-here
AZURE_CLIENT_ID=your-azure-client-id-support-here
AZURE_CLIENT_SECRET=your-azure-client-secret-support-here
AZURE_REDIRECT_URI=http://localhost:3000/api/auth/callback

# Session Management
JWT_SECRET=change-this-to-random-32-char-string-production
COOKIE_SECRET=change-this-to-random-32-char-string-production

# Database
USE_AZURE_DB=false

# Optional: AI features
BUILT_IN_FORGE_API_URL=
BUILT_IN_FORGE_API_KEY=
EOF
```

### Step 4: Run Both Applications

**Terminal 1 - Foundation CRM:**
```bash
cd /Users/abedmreyan/Desktop/aether_-foundation
npm run dev

# Opens at: http://localhost:5173
```

**Terminal 2 - Support:**
```bash
cd /Users/abedmreyan/Desktop/aether_-foundation/aether-support
npm run dev

# Opens at: http://localhost:3000
```

✅ **You're ready to develop!**

---

## 📚 Understanding the Architecture

### Authentication Flow

Both apps use the same Azure AD tenant but different client IDs:

```
User Login
    ↓
Azure AD (Tenant: eb7a7dbf...)
    ↓
    ├─→ Foundation (Client: 948c639d...) → Port 5173
    └─→ Support (Client: 42ba4600...) → Port 3000
```

### Database Architecture

Both apps use the **adapter pattern**:

```typescript
// Import database facade
import { db } from './database';  // Foundation
import { db } from './server/database';  // Support

// Use methods
const user = await db.getUserByOpenId(openId);
const widgets = await db.getWidgetsByUserId(userId);
```

**Development**: File-based storage (`.aether-support-db.json`)  
**Production**: Azure PostgreSQL (when `USE_AZURE_DB=true`)

---

## 🎯 Development Workflows

### Working on Foundation CRM

```bash
cd /Users/abedmreyan/Desktop/aether_-foundation

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

**Key directories:**
- `src/pages/` - React pages
- `src/components/` - React components
- `services/` - Database services

### Working on Support

```bash
cd /Users/abedmreyan/Desktop/aether_-foundation/aether-support

# Run dev server
npm run dev

# Build for production
npm run build
```

**Key directories:**
- `client/src/pages/` - React pages
- `client/src/components/` - React components
- `server/` - Backend API
- `server/database/` - Database adapter

---

## 🤖 AI Agent Documentation

### Foundation (.agent/ - 14 files)

| Document                                                                                                          | Purpose                      |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| [`context.md`](file:///Users/abedmreyan/Desktop/aether_-foundation/.agent/context.md)                             | Project overview, tech stack |
| [`architecture.md`](file:///Users/abedmreyan/Desktop/aether_-foundation/.agent/architecture.md)                   | System design, patterns      |
| [`conventions.md`](file:///Users/abedmreyan/Desktop/aether_-foundation/.agent/conventions.md)                     | Code style, naming           |
| [`cross-app-integration.md`](file:///Users/abedmreyan/Desktop/aether_-foundation/.agent/cross-app-integration.md) | ⭐ Integration patterns       |
| [`data-sync-strategy.md`](file:///Users/abedmreyan/Desktop/aether_-foundation/.agent/data-sync-strategy.md)       | ⭐ Data sync design           |
| [`infrastructure.md`](file:///Users/abedmreyan/Desktop/aether_-foundation/.agent/infrastructure.md)               | Deployment, services         |
| `design-system.md`                                                                                                | UI/UX guidelines             |
| `file-index.md`                                                                                                   | Quick file reference         |
| `glossary.md`                                                                                                     | Terms and definitions        |
| `gotchas.md`                                                                                                      | Common pitfalls              |
| `state.md`                                                                                                        | Current state tracking       |
| `decisions.md`                                                                                                    | Architectural decisions      |
| `current-work.md`                                                                                                 | Active tasks                 |
| `workflows/`                                                                                                      | Common workflows (4 files)   |

### Support (.agent/ - 3 files)

| Document                                                                                                    | Purpose                                   |
| ----------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| [`context.md`](file:///Users/abedmreyan/Desktop/aether_-foundation/aether-support/.agent/context.md)        | Project overview, updated with migrations |
| [`ecosystem.md`](file:///Users/abedmreyan/Desktop/aether_-foundation/aether-support/.agent/ecosystem.md)    | ⭐ Integration with Foundation             |
| [`file-index.md`](file:///Users/abedmreyan/Desktop/aether_-foundation/aether-support/.agent/file-index. md) | File organization                         |

### AI Agent Rules

Both projects have `.cursorrules` files that define AI behavior:
- Foundation: `/Users/abedmreyan/Desktop/aether_-foundation/.cursorrules`
- Support: `/Users/abedmreyan/Desktop/aether_-foundation/aether-support/.cursorrules`

---

## 🔑 Important Credentials

### Azure AD (Both Apps)

**Tenant ID**: `your-azure-tenant-id-here` (shared)

**Foundation App**:
- Client ID: `your-foundation-client-id-here`
- Client Secret: `your-foundation-client-secret-here`

**Support App**:
- Client ID: `your-support-client-id-here`
- Client Secret: `your-support-client-secret-here`

⚠️ **Security Note**: These secrets should be rotated for production!

---

## 🧪 Testing the Setup

### Test 1: Foundation CRM

1. Navigate to http://localhost:5173
2. UI should load
3. Check for any console errors

### Test 2: Support

1. Navigate to http://localhost:3000
2. UI should load
3. Check for Socket.io connection
4. Verify database file created: `.aether-support-db.json`

### Test 3: Azure AD Authentication

1. Click login in either app
2. Should redirect to Azure AD
3. Sign in with Microsoft account
4. Should redirect back with session

---

## 📖 Common Tasks

### Adding a New Feature to Foundation

1. Read [`context.md`](file:///Users/abedmreyan/Desktop/aether_-foundation/.agent/context.md)
2. Check [`architecture.md`](file:///Users/abedmreyan/Desktop/aether_-foundation/.agent/architecture.md) for patterns
3. Follow [`conventions.md`](file:///Users/abedmreyan/Desktop/aether_-foundation/.agent/conventions.md)
4. Use workflows in `.agent/workflows/`

### Adding a New Feature to Support

1. Read [`context.md`](file:///Users/abedmreyan/Desktop/aether_-foundation/aether-support/.agent/context.md)
2. Check [`ecosystem.md`](file:///Users/abedmreyan/Desktop/aether_-foundation/aether-support/.agent/ecosystem.md) for integration points
3. Use database adapter: `import { db } from './database'`

### Database Operations

```typescript
// Both apps use the same pattern
import { db } from './database';  // or './server/database' for Support

// Create
await db.createWidget({ name: "My Widget", userId: 1 });

// Read
const widget = await db.getWidgetById(1);
const widgets = await db.getWidgetsByUserId(userId);

// Update
await db.updateWidget(1, { name: "Updated Name" });

// Delete
await db.deleteWidget(1);
```

---

## 🔧 Troubleshooting

### Issue: Port already in use

```bash
# Kill process on port 5173 (Foundation)
lsof -ti:5173 | xargs kill -9

# Kill process on port 3000 (Support)
lsof -ti:3000 | xargs kill -9
```

### Issue: Database not persisting

Check if `.aether-support-db.json` exists in Support root:
```bash
cd aether-support
ls -la .aether-support-db.json
```

### Issue: Azure AD redirect error

Verify redirect URIs match in Azure Portal:
- Foundation: `http://localhost:5173/api/auth/callback`
- Support: `http://localhost:3000/api/auth/callback`

### Issue: Dependencies conflict

```bash
# For Support, use --legacy-peer-deps
npm install --legacy-peer-deps
```

---

## 🌐 Production Deployment

### Prerequisites

- [ ] Azure PostgreSQL database set up
- [ ] Implement `AzureDBAdapter` in Support
- [ ] Update environment variables
- [ ] Configure custom domain (aethersystems.co)

### Deployment Steps

1. **Set up Azure PostgreSQL**
   ```bash
   # Create instance via Azure Portal
   # Configure firewall rules
   # Create databases and schemas
   ```

2. **Update Environment Variables**
   ```bash
   USE_AZURE_DB=true
   AZURE_DB_URL=postgresql://...
   ```

3. **Deploy to Netlify/Azure**
   ```bash
   # Foundation
   npm run build
   netlify deploy --prod

   # Support
   npm run build
   # Deploy to hosting provider
   ```

---

## 📚 Essential Reading for New Team Members

### Start Here (15 mins)
1. [Foundation Context](file:///Users/abedmreyan/Desktop/aether_-foundation/.agent/context.md)
2. [Support Context](file:///Users/abedmreyan/Desktop/aether_-foundation/aether-support/.agent/context.md)
3. [Ecosystem Overview](file:///Users/abedmreyan/Desktop/aether_-foundation/aether-support/.agent/ecosystem.md)

### Integration Patterns (30 mins)
4. [Cross-App Integration](file:///Users/abedmreyan/Desktop/aether_-foundation/.agent/cross-app-integration.md)
5. [Data Sync Strategy](file:///Users/abedmreyan/Desktop/aether_-foundation/.agent/data-sync-strategy.md)

### Architecture Deep Dive (45 mins)
6. [Foundation Architecture](file:///Users/abedmreyan/Desktop/aether_-foundation/.agent/architecture.md)
7. [Infrastructure](file:///Users/abedmreyan/Desktop/aether_-foundation/.agent/infrastructure.md)

### Code Standards (20 mins)
8. [Conventions](file:///Users/abedmreyan/Desktop/aether_-foundation/.agent/conventions.md)
9. [Design System](file:///Users/abedmreyan/Desktop/aether_-foundation/.agent/design-system.md)

---

## 🎯 Development Best Practices

### 1. Always Check Agent Docs First
Before writing code, check `.agent/` directory for:
- Existing patterns
- Architectural decisions
- Common pitfalls

### 2. Use the Database Adapter
Never use Drizzle ORM directly. Always use:
```typescript
import { db } from './database';
```

### 3. Follow Naming Conventions
Check [`conventions.md`](file:///Users/abedmreyan/Desktop/aether_-foundation/.agent/conventions.md) for:
- File naming
- Component naming
- Function naming

### 4. Update Documentation
When adding features, update:
- `file-index.md` if adding new files
- `decisions.md` if making arch decisions
- `current-work.md` for active tasks

---

## 🚦 Project Status

| Component        | Status        | Notes                  |
| ---------------- | ------------- | ---------------------- |
| Foundation CRM   | ✅ Ready       | Port 5173              |
| Support          | ✅ Ready       | Port 3000              |
| Azure AD Auth    | ✅ Configured  | Both apps              |
| Database Adapter | ✅ Implemented | LocalDB + Azure stub   |
| Documentation    | ✅ Complete    | 17 docs total          |
| Production DB    | ⏳ Pending     | Needs Azure PostgreSQL |
| Deployment       | ⏳ Pending     | Needs hosting setup    |

---

## 🆘 Getting Help

### Documentation Locations

```bash
# Foundation docs
cd /Users/abedmreyan/Desktop/aether_-foundation/.agent
ls -l

# Support docs
cd /Users/abedmreyan/Desktop/aether_-foundation/aether-support/.agent
ls -l

# Migration walkthrough
cat /Users/abedmreyan/.gemini/antigravity/brain/.../walkthrough.md
```

### Common Commands Cheat Sheet

```bash
# Foundation
cd ~/Desktop/aether_-foundation
npm run dev              # Start dev server (5173)
npm run build            # Build for production

# Support
cd ~/Desktop/aether_-foundation/aether-support
npm run dev              # Start dev server (3000)
npm run build            # Build for production

# Both at once (use 2 terminals)
# Terminal 1: Foundation
cd ~/Desktop/aether_-foundation && npm run dev

# Terminal 2: Support
cd ~/Desktop/aether_-foundation/aether-support && npm run dev
```

---

## ✅ Verification Checklist

Before starting development, verify:

- [ ] Both apps run without errors
- [ ] Foundation opens at http://localhost:5173
- [ ] Support opens at http://localhost:3000
- [ ] All `.agent/` docs are accessible
- [ ] `.env` files created in both apps
- [ ] Database file `.aether-support-db.json` created
- [ ] No console errors in either app
- [ ] Azure AD login redirects work
- [ ] You've read the essential documentation

---

## 🎓 Next Steps

Once setup is complete:

1. **Explore the codebase** using file-index.md documents
2. **Run a test workflow** from `.agent/workflows/`
3. **Make a small change** to verify your setup
4. **Review open tasks** in `current-work.md`
5. **Join the team** and start building!

---

**Domain**: `aethersystems.co` (configured, pending DNS)  
**Stack**: React + TypeScript + Vite + Azure AD + PostgreSQL
**Status**: ✅ Ready for development team onboarding

**Questions?** Check `.agent/` docs or ask the team lead!
