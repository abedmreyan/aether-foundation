# 🎯 Azure SQL Database Configuration

## ✅ Now Using Azure SQL Server!

**Previous:** Generic MySQL/PostgreSQL schema  
**Current:** Azure SQL Server (T-SQL) optimized schema

---

## 📊 Database Details

### Server Information
- **Server:** `aether-orch-897256.database.windows.net`
- **Database:** `orchestrator-db`
- **Location:** East US 2
- **Tier:** Basic (2GB, ~$5/month)
- **Status:** ✅ Online

### credentials
- **Username:** `orchestrator_admin`
- **Password:** `AetherOrch#2025!Secure$Pass`

### Connection String
```
Server=tcp:aether-orch-897256.database.windows.net,1433;
Initial Catalog=orchestrator-db;
Persist Security Info=False;
User ID=orchestrator_admin;
Password=AetherOrch#2025!Secure$Pass;
MultipleActiveResultSets=False;
Encrypt=True;
TrustServerCertificate=False;
Connection Timeout=30;
```

---

## 🤖 Complete Aether Agent Roster (8 Agents)

### 1. **Aether Orchestrator** ⭐ NEW!
- **Role:** `orchestrator`
- **Focus:** Overall system coordination, task delegation, workflow management, agent coordination
- **Why Added:** Core orchestrator role for managing the entire AI agent system

### 2. **Aether Project Manager**
- **Role:** `project_manager`
- **Focus:** Aether CRM planning, multi-tenant architecture, customer pipeline management

### 3. **Aether Research Agent**
- **Role:** `research`
- **Focus:** CRM market analysis, Supabase/Azure best practices, multi-tenant SaaS research

### 4. **Aether Architecture Agent**
- **Role:** `architecture`
- **Focus:** Multi-tenant DB design, RBAC systems, Supabase schema, Azure integration

### 5. **Aether Frontend Agent**
- **Role:** `frontend`
- **Focus:** React+TypeScript+Wouter, shadcn/ui, CRM dashboards, Kanban/Table views

### 6. **Aether Backend Agent**
- **Role:** `backend`
- **Focus:** tRPC APIs, Supabase integration, multi-tenant isolation, permissions middleware

### 7. **Aether DevOps Agent**
- **Role:** `devops`
- **Focus:** Netlify deployment, Supabase/Azure setup, environment configuration

### 8. **Aether QA Agent**
- **Role:** `qa`
- **Focus:** CRM workflow testing, permissions testing, multi-tenant data isolation verification

---

## 📝 Deploying the Azure SQL Schema

### Updated Schema File: `schema-azure.sql`

**Key Features:**
- ✅ T-SQL syntax (Azure SQL compatible)
- ✅ Proper `IF NOT EXISTS` checks
- ✅ `IDENTITY` instead of `SERIAL`
- ✅ `NVARCHAR` for Unicode support
- ✅ `DATETIME2` for timestamps
- ✅ All 8 Aether agents including Orchestrator
- ✅ Demo Aether CRM project
- ✅ Verification queries at the end

### How to Deploy:

**Azure Portal (Recommended):**
1. Go to [portal.azure.com](https://portal.azure.com)
2. Navigate to: SQL databases → `orchestrator-db`
3. Click "Query editor" (left sidebar)
4. Login:
   - **Server:** `aether-orch-897256`
   -** Username:** `orchestrator_admin`
   - **Password:** `AetherOrch#2025!Secure$Pass`
5. Copy entire contents of `schema-azure.sql`
6. Paste and click "Run"
7. Verify at bottom: Should show "8 agents created"

**Expected Output:**
```
Tables Created
- agent_activity
- agents
- modules
- projects
- tasks
- users

Agents Created
1. Aether Orchestrator (orchestrator)
2. Aether Project Manager (project_manager)
3. Aether Research Agent (research)
4. Aether Architecture Agent (architecture)
5. Aether Frontend Agent (frontend)
6. Aether Backend Agent (backend)
7. Aether DevOps Agent (devops)
8. Aether QA Agent (qa)

Projects Created
1. Aether CRM (active)

Users Created
1. Admin User (admin@aether.dev)
```

---

## 🔄 What Changed from Generic Schema

### Fixed for Azure SQL:
1. ❌ `SERIAL` → ✅ `IDENTITY(1,1)`
2. ❌ `TEXT` → ✅ `NVARCHAR(MAX)`
3. ❌ `VARCHAR` → ✅ `NVARCHAR` (Unicode)
4. ❌ `TIMESTAMP` → ✅ `DATETIME2`
5. ❌ `CURRENT_TIMESTAMP` → ✅ `GETUTCDATE()`
6. ❌ `ON UPDATE CURRENT_TIMESTAMP` → ✅ Removed (not supported)
7. ❌ `ON CONFLICT DO NOTHING` → ✅ `IF NOT EXISTS` checks
8. ❌ `CREATE INDEX IF NOT EXISTS` → ✅ Check `sys.indexes` first

### Added for Aether:
- ✅ **Aether Orchestrator** agent (was missing!)
- ✅ Aether CRM demo project (not generic "Demo Project")
- ✅ Aether-specific specializations for all agents
- ✅ Verification queries for easy validation

---

## 🧪 Testing the Database

### After Schema Deploy:

**Test 1: Count Agents**
```sql
SELECT COUNT(*) as AgentCount FROM agents;
-- Expected: 8
```

**Test 2: List All Agents**
```sql
SELECT id, name, role, status FROM agents ORDER BY id;
-- Should show all 8 Aether agents
```

**Test 3: Check Project**
```sql
SELECT * FROM projects WHERE name = 'Aether CRM';
-- Should return 1 row
```

**Test 4: Verify Tables**
```sql
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE' 
ORDER BY TABLE_NAME;
-- Expected: 6 tables
```

---

## 🎯 Environment Configuration

### Update `.env` (Already done in `.env.production`)

```env
# Database - Azure SQL Server
DATABASE_URL="Server=tcp:aether-orch-897256.database.windows.net,1433;Initial Catalog=orchestrator-db;Persist Security Info=False;User ID=orchestrator_admin;Password=AetherOrch#2025!Secure$Pass;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"

# Azure Configuration
AZURE_SQL_SERVER=aether-orch-897256
AZURE_SQL_DATABASE=orchestrator-db
AZURE_SQL_USER=orchestrator_admin

# Aether Project
AETHER_PROJECT_PATH=/Users/abedmreyan/Desktop/aether_-foundation
```

---

## 📊 Database Schema Overview

```
projects (Aether CRM projects)
  ↓ (1:N)
modules (CRM features/modules)
  ↓ (1:N)
tasks (Specific tasks)
  ↓ (assigned to)
agents (8 Aether-specific agents)
  ↓ (1:N)
agent_activity (Activity logs)

users (Aether CRM users)
```

---

## ✅ Ready for Phase 3!

Once schema is deployed:
- [x] Azure SQL Server created
- [x] Database provisioned
- [x] Firewall configured
- [x] T-SQL schema prepared
- [x] All 8 Aether agents defined (including Orchestrator!)
- [ ] Deploy `schema-azure.sql` ← **YOU ARE HERE**
- [ ] Verify 8 agents created
- [ ] Proceed to Google Tasks integration

---

**Deploy the schema and we'll continue!** 🚀
