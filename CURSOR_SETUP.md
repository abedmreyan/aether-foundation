# Cursor IDE Setup Guide for Aether Systems

How to configure Cursor IDE to leverage all the AI agent documentation we created.

---

## 🎯 What We Built

A comprehensive AI agent system with:
- **Foundation**: 14 agent documentation files
- **Support**: 3 agent documentation files  
- **Custom rules**: `.cursorrules` in both projects
- **Agent personas**: In `.cursor/agents/` directory

---

## 📋 Prerequisites

- [ ] Cursor IDE installed (latest version)
- [ ] Projects cloned to `/Users/abedmreyan/Desktop/aether_-foundation`
- [ ] All `.agent/` directories in place
- [ ] `.cursorrules` files present

---

## 🚀 Step-by-Step Setup

### Step 1: Open Projects in Cursor

#### Option A: Multi-Root Workspace (Recommended)

Create a workspace file to work with both projects simultaneously:

1. **Create workspace file:**
```bash
cd ~/Desktop/aether_-foundation
cat > aether-systems.code-workspace << 'EOF'
{
  "folders": [
    {
      "name": "Aether Foundation (CRM)",
      "path": "."
    },
    {
      "name": "Aether Support",
      "path": "./aether-support"
    }
  ],
  "settings": {
    "cursor.ai.model": "claude-4-sonnet",
    "cursor.ai.contextFiles": [
      ".agent/**/*",
      ".cursorrules",
      "README.md"
    ],
    "files.exclude": {
      "**/node_modules": true,
      "**/.git": true,
      "**/dist": true,
      "**/.aether-support-db.json": true
    }
  }
}
EOF
```

2. **Open workspace in Cursor:**
```bash
cursor aether-systems.code-workspace
```

#### Option B: Single Project

```bash
# Open Foundation
cursor ~/Desktop/aether_-foundation

# Or open Support
cursor ~/Desktop/aether_-foundation/aether-support
```

---

### Step 2: Configure Cursor Rules

Both projects already have `.cursorrules` files. Verify they're being used:

1. **Check Foundation rules:**
```bash
cat ~/Desktop/aether_-foundation/.cursorrules
```

2. **Check Support rules:**
```bash
cat ~/Desktop/aether_-foundation/aether-support/.cursorrules
```

3. **Cursor automatically loads** these files when you open the project

---

### Step 3: Set Up Agent Personas

The Foundation has custom agent personas in `.cursor/agents/`:

#### View Available Agents

```bash
cd ~/Desktop/aether_-foundation/.cursor/agents
ls -l
```

You should see:
- `index.md` - Agent directory
- `researcher.md` - Research agent
- `ux-designer.md` - Design agent
- `devops.md` - DevOps agent

#### Use Agents in Cursor

1. **Open Cursor Command Palette** (`Cmd+Shift+P`)
2. Type: "Cursor: Use Agent"
3. Select agent persona:
   - "Researcher" - For technical research
   - "UX Designer" - For UI/UX work
   - "DevOps" - For infrastructure

---

### Step 4: Configure AI Context

Tell Cursor which documentation files to always include:

1. **Open Cursor Settings:**
   - Mac: `Cmd+,`
   - Windows: `Ctrl+,`

2. **Search for:** "Context Files"

3. **Add these patterns:**
```json
{
  "cursor.ai.alwaysIncludeContext": [
    ".agent/**/*.md",
    ".cursorrules",
    "README.md",
    "SETUP_GUIDE.md"
  ]
}
```

---

### Step 5: Set Up AI Model Preferences

1. **Open Cursor Settings** (`Cmd+,`)

2. **Search for:** "AI Model"

3. **Recommended settings:**
```json
{
  "cursor.ai.model": "claude-4.5-sonnet",
  "cursor.ai.temperature": 0.7,
  "cursor.ai.maxTokens": 4096,
  "cursor.ai.includeContextFromOpenFiles": true
}
```

---

### Step 6: Create Custom Composer Instructions

For each project, create custom composer instructions:

#### Foundation Composer Instructions

1. **Create file:** `.cursor/composer-instructions.md`

```bash
cd ~/Desktop/aether_-foundation
mkdir -p .cursor
cat > .cursor/composer-instructions.md << 'EOF'
# Aether Foundation - Composer Instructions

When working on this project:

1. **Always consult** `.agent/context.md` first
2. **Follow patterns** in `.agent/architecture.md`
3. **Check conventions** in `.agent/conventions.md`
4. **For integrations**, refer to `.agent/cross-app-integration.md`
5. **For data sync**, see `.agent/data-sync-strategy.md`

## Key Principles
- Use the database services in `services/platformDatabase.ts`
- Follow RBAC patterns for permissions
- Use Tailwind for styling
- TypeScript strict mode enabled

## Common Tasks
- Adding a component: Check `.agent/workflows/add-component.md`
- Adding a pipeline field: Check `.agent/workflows/add-pipeline-field.md`
- Modifying permissions: Check `.agent/workflows/modify-permissions.md`
EOF
```

#### Support Composer Instructions

```bash
cd ~/Desktop/aether_-foundation/aether-support
mkdir -p .cursor
cat > .cursor/composer-instructions.md << 'EOF'
# Aether Support - Composer Instructions

When working on this project:

1. **Always consult** `.agent/context.md` first
2. **Check ecosystem integration** in `.agent/ecosystem.md`
3. **Use database adapter** from `server/database/`
4. **For cross-app features**, see Foundation's `.agent/cross-app-integration.md`

## Key Principles
- Use `db` facade from `server/database/`
- Never use Drizzle ORM directly
- Socket.io for real-time features
- Azure AD for authentication

## Database Pattern
```typescript
import { db } from './server/database';

// All operations use the facade
const widgets = await db.getWidgetsByUserId(userId);
```
EOF
```

---

### Step 7: Configure File Indexing

Tell Cursor which files to index for AI context:

1. **Create `.cursorignore`** (like .gitignore but for Cursor):

```bash
cd ~/Desktop/aether_-foundation
cat > .cursorignore << 'EOF'
# Dependencies
node_modules/
aether-support/node_modules/

# Build outputs
dist/
build/
.next/
aether-support/dist/

# Database files
*.db
*.sqlite
.aether-support-db.json

# Logs
*.log
logs/

# Environment (keep .env.example)
.env
.env.local

# IDE
.vscode/
.idea/

# Cache
.cache/
.turbo/
EOF
```

---

### Step 8: Set Up Keyboard Shortcuts

Optimize your workflow with these shortcuts:

#### Open Cursor Settings → Keyboard Shortcuts

**Recommended shortcuts:**

| Action | Shortcut | Purpose |
|--------|----------|---------|
| Open AI Chat | `Cmd+L` | Start AI conversation |
| Inline Edit | `Cmd+K` | AI code suggestions |
| Composer | `Cmd+I` | Multi-file edits |
| Search Agent Docs | `Cmd+Shift+F` | Find in .agent/ files |
| Quick Open | `Cmd+P` | File navigation |

---

### Step 9: Test the Setup

#### Test 1: AI Understands Context

1. **Open Cursor Chat** (`Cmd+L`)
2. **Ask:** "What is the database architecture for Aether Support?"
3. **Expected:** AI should reference `.agent/` docs and database adapter pattern

#### Test 2: Agent Personas Work

1. **Switch to UX Designer agent**
2. **Ask:** "How should I design a new customer form?"
3. **Expected:** AI should reference design-system.md and UI conventions

#### Test 3: Cross-Project Awareness

1. **Open workspace** (both projects)
2. **Ask:** "How do I integrate a feature between Foundation and Support?"
3. **Expected:** AI should reference `cross-app-integration.md`

---

## 🎯 How to Use the AI Agents

### For New Features

```
You: "I need to add a new widget customization option"

AI (will reference):
- .agent/context.md → Understand project
- .agent/file-index.md → Find related files
- .agent/workflows/add-component.md → Follow pattern
- .cursorrules → Apply coding standards
```

### For Integration Tasks

```
You: "How do I sync customer data from Foundation to Support?"

AI (will reference):
- .agent/cross-app-integration.md → Integration patterns
- .agent/data-sync-strategy.md → Sync implementation
- .agent/ecosystem.md → Architecture overview
```

### For Infrastructure

```
You: "How do I deploy to production?"

AI (will reference):
- .agent/infrastructure.md → Deployment steps
- .agent/decisions.md → Architectural choices
- .cursorrules → Environment setup
```

---

## 🔧 Advanced Configuration

### Custom AI Prompts

Create project-specific prompts in `.cursor/prompts/`:

```bash
mkdir -p .cursor/prompts

# Database operation prompt
cat > .cursor/prompts/database-operation.md << 'EOF'
# Database Operation Prompt

When adding a database operation:
1. Add method to `database/adapter.ts`
2. Implement in `database/localAdapter.ts`
3. Add to facade in `database/index.ts`
4. Update `database/azureAdapter.ts` stub
5. Test with LocalDB first

Example pattern:
```typescript
// adapter.ts
abstract getWidgetById(id: number): Promise<Widget | null>;

// localAdapter.ts
async getWidgetById(id: number) {
  return this.state.widgets.find(w => w.id === id) || null;
}

// index.ts
getWidgetById = (id: number) => this.adapter.getWidgetById(id);
```
EOF
```

### Agent Templates

Create reusable agent templates in `.cursor/agents/`:

```bash
cd ~/Desktop/aether_-foundation/.cursor/agents

# Create a Database Engineer agent
cat > database-engineer.md << 'EOF'
# Database Engineer Agent

**Role:** Database architecture and optimization specialist

**Expertise:**
- PostgreSQL query optimization
- Database adapter pattern
- Schema design
- Data migration

**When to use:**
- Adding database tables
- Optimizing queries
- Planning data migration
- Designing sync strategies

**Key References:**
- `.agent/data-sync-strategy.md`
- `services/platformDatabase.ts`
- `aether-support/server/database/`

**Approach:**
1. Always use the adapter pattern
2. Consider both LocalDB and Azure implementations
3. Think about data consistency
4. Plan for scale
EOF
```

---

## 📚 AI Agent Documentation Structure

### Foundation (.agent/)

```
.agent/
├── 📖 Core (Read First)
│   ├── context.md              ← Start here
│   ├── architecture.md         ← System design
│   └── conventions.md          ← Code style
│
├── 🔗 Integration (NEW - Critical)
│   ├── cross-app-integration.md  ← How apps connect
│   └── data-sync-strategy.md     ← Data flow
│
├── 🏗️ Infrastructure
│   └── infrastructure.md       ← Azure, deployment
│
├── 💻 Development
│   ├── file-index.md          ← File locations
│   ├── design-system.md       ← UI/UX guide
│   ├── glossary.md            ← Terminology
│   ├── gotchas.md             ← Common issues
│   └── workflows/             ← How-to guides
│       ├── add-component.md
│       ├── add-pipeline-field.md
│       ├── modify-permissions.md
│       └── test-locally.md
│
└── 📋 Project
    ├── decisions.md           ← Why we did things
    ├── current-work.md        ← Active tasks
    ├── state.md               ← Current state
    └── handoff.md             ← Team transitions
```

### Support (.agent/)

```
.agent/
├── context.md       ← Project overview (UPDATED)
├── ecosystem.md     ← Integration with Foundation (UPDATED)
└── file-index.md    ← File organization
```

---

## 💡 Pro Tips

### 1. Reference Docs Explicitly

Instead of:
```
"How do I add a feature?"
```

Try:
```
"Based on .agent/architecture.md and .agent/conventions.md, 
how should I add a new customer status field?"
```

### 2. Use Multi-File Context

Select multiple files before asking:
```
1. Select: database/adapter.ts
2. Select: database/localAdapter.ts  
3. Ask: "Add a method to get sessions by status"
```

### 3. Leverage Workflows

```
"Follow the steps in .agent/workflows/add-component.md 
to create a CustomerStatusBadge component"
```

### 4. Switch Agent Personas

For different tasks:
- **Code implementation** → Default agent
- **UI design** → UX Designer agent
- **Research** → Researcher agent
- **Deployment** → DevOps agent

---

## ✅ Verification Checklist

Verify your Cursor setup:

- [ ] Projects open in workspace
- [ ] `.cursorrules` detected (check status bar)
- [ ] Agent docs indexed (test with search)
- [ ] Composer instructions created
- [ ] AI chat references .agent/ files
- [ ] Agent personas available
- [ ] Keyboard shortcuts configured
- [ ] .cursorignore in place

---

## 🎓 Learning Path

### Day 1: Familiarization
1. Open workspace
2. Read `.agent/context.md` (both projects)
3. Try AI chat with simple questions
4. Test agent personas

### Day 2: Deep Dive
1. Read all `.agent/` documentation
2. Try composer on small changes
3. Use workflows for tasks
4. Practice referencing docs explicitly

### Day 3: Advanced Usage
1. Create custom prompts
2. Add new agent personas
3. Configure personal shortcuts
4. Build muscle memory

---

## 🆘 Troubleshooting

### AI Doesn't Reference Agent Docs

**Solution:**
```bash
# Verify files exist
ls -la .agent/

# Check Cursor settings
# Settings → AI → Context Files
# Should include: .agent/**/*.md
```

### Agent Personas Don't Appear

**Solution:**
```bash
# Verify agents directory
ls -la .cursor/agents/

# Reload Cursor
Cmd+Shift+P → "Developer: Reload Window"
```

### Multi-Root Workspace Issues

**Solution:**
```bash
# Recreate workspace file
# Make sure paths are correct:
{
  "folders": [
    { "path": "." },                    # Foundation
    { "path": "./aether-support" }      # Support
  ]
}
```

---

## 🔄 Keeping Documentation in Sync

When you update code:

1. **Update relevant .agent/ docs**
   ```bash
   # Example: Added new database table
   # Update: .agent/data-sync-strategy.md
   ```

2. **Update file-index.md**
   ```bash
   # Example: Added new component
   # Update: .agent/file-index.md
   ```

3. **Update current-work.md**
   ```bash
   # Track active changes
   # Update: .agent/current-work.md
   ```

---

## 🚀 You're Ready!

Now Cursor will:
- ✅ Reference all 17 agent documentation files
- ✅ Apply project-specific coding standards
- ✅ Understand integration patterns
- ✅ Follow established conventions
- ✅ Use the correct agent personas
- ✅ Maintain context across both projects

**Start developing with AI-powered assistance!** 🎉

---

## 📞 Quick Reference

| Need | Do This |
|------|---------|
| Start AI chat | `Cmd+L` |
| Inline code edit | `Cmd+K` |
| Multi-file edit | `Cmd+I` (Composer) |
| Switch agent | `Cmd+Shift+P` → "Use Agent" |
| Search docs | `Cmd+Shift+F` in `.agent/` |
| Quick file open | `Cmd+P` → type filename |

**Happy coding with your AI team! 🤖**
