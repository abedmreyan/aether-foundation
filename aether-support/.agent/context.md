# Aether Support - Project Context for AI Agents

> Part of the **Aether Ecosystem** - Customer Support & Communication Platform

## Project Overview

**What is this?** A SaaS communication platform with embeddable chat/voice widgets, AI chatbots, and agent call center dashboard.

**Relationship to Aether Foundation:** Aether Support is the customer communication layer that integrates with the Aether Foundation CRM.

## Tech Stack

### Current (After Migration)
- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **API**: tRPC
- **Database**: Azure Database for PostgreSQL (Adapter Pattern)
  - Development: File-based storage (`LocalDBAdapter`)
  - Production: Azure PostgreSQL (`AzureDBAdapter`)
- **Authentication**: Azure AD (MSAL)
- **Real-time**: Socket.io
- **AI**: Google Gemini (for chatbots)

### Migration Status
- ✅ Database: Migrated to adapter pattern
- ✅ Auth: Migrated from Manus OAuth to Azure AD
- ✅ Routing Engine: Refactored to use database adapter
- ⏳ Deployment: Ready for Azure/Netlify

---

## Directory Structure

```
aether-support/
├── .agent/              # AI agent documentation
├── client/              # React frontend
│   └── src/
│       ├── pages/       # 11 page components
│       ├── components/  # UI components (~60)
│       ├── lib/         # tRPC client, utilities
│       ├── hooks/       # Custom React hooks
│       └── contexts/    # React contexts
├── server/              # Node.js backend
│   ├── _core/           # Business logic
│   │   ├── aiChatbot.ts    # AI response generation
│   │   ├── routingEngine.ts # Chatbot routing logic
│   │   ├── socket.ts       # Socket.io handlers
│   │   ├── llm.ts          # LLM API integration
│   │   └── twilio.ts       # VoIP integration
│   ├── routers.ts       # tRPC API endpoints
│   └── db.ts            # Database helpers
├── drizzle/             # Database schema
│   └── schema.ts        # Table definitions
├── shared/              # Shared types
└── package.json
```

---

## Key Features

### 1. Embeddable Widgets
- JavaScript widget for websites
- Native SDKs for iOS/Android
- Customizable appearance

### 2. AI Chatbots
- Multiple chatbots with unique personalities
- RAG knowledge bases (documents, URLs, text)
- MCP server integration for external data

### 3. Intelligent Routing
- Visual workflow builder (React Flow)
- Condition-based chatbot handoffs
- Customer data queries via MCP

### 4. Agent Dashboard
- Real-time session queue
- Live chat interface
- Canned responses
- Browser notifications

### 5. Analytics
- Session metrics
- Performance tracking
- Date range filtering

---

## Key Files by Feature

### Widget System
```
client/src/pages/widgets.tsx       # Widget customizer
server/routers.ts → widgets.*     # Widget CRUD
drizzle/schema.ts → widgets       # Widget table
```

### AI Chatbots
```
client/src/pages/ai-chatbots.tsx  # Chatbot management
server/_core/aiChatbot.ts         # AI response engine
server/_core/llm.ts               # LLM API calls
drizzle/schema.ts → chatbots      # Chatbot tables
```

### Routing Workflows
```
client/src/pages/chatbot-routing.tsx  # Visual builder
server/_core/routingEngine.ts         # Execution engine
drizzle/schema.ts → chatbotRoutings   # Routing tables
```

### Agent Dashboard
```
client/src/pages/agent-chat.tsx   # Agent interface
server/_core/socket.ts            # Real-time events
drizzle/schema.ts → sessions      # Session management
```

### Socket.io Events
```
server/_core/socket.ts            # All socket handlers
client/src/lib/socket.ts          # Client connection
```

---

## Database Schema (Key Tables)

| Table | Purpose |
|-------|---------|
| `users` | User accounts |
| `widgets` | Widget configurations |
| `sessions` | Chat sessions |
| `messages` | Chat messages |
| `chatbots` | AI chatbot configs |
| `knowledgeBases` | RAG content |
| `mcpServers` | External data sources |
| `chatbotRoutings` | Routing workflows |
| `cannedResponses` | Quick replies |

---

## API Patterns

### tRPC
```typescript
// Client usage
const { data } = trpc.widgets.list.useQuery();
await trpc.widgets.create.mutate({ name: "..." });

// Server definition (routers.ts)
widgets: {
  list: protectedProcedure.query(async ({ ctx }) => { ... }),
  create: protectedProcedure.input(z.object({...})).mutation(...),
}
```

### Socket.io
```typescript
// Client
socket.emit('visitor:message', { sessionId, content });
socket.on('message:received', (msg) => { ... });

// Server (_core/socket.ts)
io.on('connection', (socket) => {
  socket.on('visitor:message', async (data) => { ... });
});
```

---

## Notes for AI Agents

1. **This is a separate codebase** from Aether Foundation
2. **Different package manager**: Uses `pnpm`, not `npm`
3. **Database**: Uses adapter pattern (LocalDBAdapter for dev)
4. **Auth**: Uses Azure AD (MSAL)
5. **Real-time is critical**: Socket.io handles all live chat functionality
6. **Orchestrator integration**: See `agent-orchestration.md` and `../cross-project-integration.md`

---

## Related Projects

| Project | Path | Purpose |
|---------|------|---------|
| Aether Foundation | `../` | Main CRM platform |
| AI Dev Orchestrator | `../ai_dev_orchestrator/` | AI task coordination |

*Last Updated: 2025-12-18*

