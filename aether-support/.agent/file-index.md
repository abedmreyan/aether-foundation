# File Index - Aether Support

Quick task-to-file lookup for AI agents.

---

## Task → File Mapping

| Task | Primary Files | Secondary |
|------|---------------|-----------|
| **Widget customization** | `client/src/pages/widgets.tsx` | `server/routers.ts` |
| **AI chatbot config** | `client/src/pages/ai-chatbots.tsx` | `server/_core/aiChatbot.ts` |
| **Routing workflows** | `client/src/pages/chatbot-routing.tsx` | `server/_core/routingEngine.ts` |
| **Agent dashboard** | `client/src/pages/agent-chat.tsx` | `server/_core/socket.ts` |
| **Analytics** | `client/src/pages/analytics.tsx` | `server/routers.ts` |
| **Canned responses** | `client/src/pages/canned-responses.tsx` | `server/routers.ts` |
| **Settings/Twilio** | `client/src/pages/settings.tsx` | `server/_core/twilio.ts` |
| **Database schema** | `drizzle/schema.ts` | `server/db.ts` |
| **Socket.io events** | `server/_core/socket.ts` | `client/src/lib/socket.ts` |
| **tRPC endpoints** | `server/routers.ts` | `client/src/lib/trpc.ts` |
| **LLM/AI responses** | `server/_core/llm.ts` | `server/_core/aiChatbot.ts` |

---

## Page Files

| Page | File |
|------|------|
| Landing | `client/src/pages/landing.tsx` |
| Dashboard | `client/src/pages/dashboard.tsx` |
| Widgets | `client/src/pages/widgets.tsx` |
| Agent Chat | `client/src/pages/agent-chat.tsx` |
| AI Chatbots | `client/src/pages/ai-chatbots.tsx` |
| Chatbot Routing | `client/src/pages/chatbot-routing.tsx` |
| Analytics | `client/src/pages/analytics.tsx` |
| Canned Responses | `client/src/pages/canned-responses.tsx` |
| Settings | `client/src/pages/settings.tsx` |

---

## Server Core Files

| File | Purpose |
|------|---------|
| `_core/aiChatbot.ts` | AI response generation with RAG |
| `_core/routingEngine.ts` | Chatbot routing execution |
| `_core/socket.ts` | Socket.io event handlers |
| `_core/llm.ts` | LLM API integration |
| `_core/twilio.ts` | VoIP call handling |
| `_core/oauth.ts` | Authentication |
| `routers.ts` | All tRPC endpoints |
| `db.ts` | Database query helpers |

---

## Component Folders

| Folder | Contains |
|--------|----------|
| `components/ui/` | shadcn/ui primitives |
| `components/` | Feature components |

---

## File Sizes (Context Budgeting)

| File | Size | Notes |
|------|------|-------|
| `routers.ts` | ~15KB | Large - all API endpoints |
| `db.ts` | ~14KB | Large - all DB helpers |
| `routingEngine.ts` | ~12KB | Medium-large |
| `schema.ts` | ~10KB | Database schema |
| Most pages | 3-8KB | Medium |
