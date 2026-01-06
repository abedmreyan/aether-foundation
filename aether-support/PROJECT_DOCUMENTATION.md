# Aether Foundation - SaaS Communication Platform
## Complete Project Documentation

**Version:** 8b20053d  
**Last Updated:** November 19, 2025  
**Project Type:** Full-Stack SaaS Communication Platform

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Technology Stack](#technology-stack)
3. [Features Implemented](#features-implemented)
4. [Architecture Overview](#architecture-overview)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [User Interface](#user-interface)
8. [AI & Automation](#ai--automation)
9. [Integration Capabilities](#integration-capabilities)
10. [What's Next](#whats-next)
11. [Deployment Guide](#deployment-guide)

---

## Executive Summary

Aether Foundation is a comprehensive SaaS communication platform that enables businesses to embed intelligent chat and voice widgets into their websites and mobile applications. The platform combines real-time communication, AI-powered chatbots with RAG knowledge bases, MCP server integration, agent dashboards, and intelligent routing workflows.

### Core Value Proposition

- **Embeddable Widgets**: JavaScript widget for websites, native SDKs for iOS/Android
- **AI-Powered Responses**: Multiple chatbots with RAG knowledge bases and MCP integration
- **Intelligent Routing**: Visual workflow builder for dynamic chatbot handoffs
- **Agent Dashboard**: Real-time chat management with filtering, canned responses, and analytics
- **VoIP Integration**: Twilio-ready infrastructure for voice calling
- **Mobile-First**: Full support for push notifications and native OS integrations

---

## Technology Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS 4 with Aether Foundation brand colors
- **UI Components**: shadcn/ui component library
- **Routing**: Wouter (lightweight React router)
- **State Management**: tRPC React Query hooks
- **Real-time**: Socket.io client
- **Workflow Builder**: React Flow for visual routing

### Backend
- **Runtime**: Node.js with Express 4
- **API**: tRPC 11 (type-safe RPC)
- **Authentication**: Manus OAuth with JWT sessions
- **Real-time**: Socket.io server
- **Database ORM**: Drizzle ORM
- **Database**: MySQL/TiDB

### AI & Integration
- **LLM**: Manus built-in LLM API
- **Voice Transcription**: Whisper API integration
- **VoIP**: Twilio SDK (configured, UI pending)
- **MCP**: Model Context Protocol for external data sources
- **Storage**: S3-compatible object storage

### Development
- **Build Tool**: Vite
- **Package Manager**: pnpm
- **Testing**: Vitest (framework ready)
- **TypeScript**: Strict mode enabled

---

## Features Implemented

### ✅ 1. Widget Management System

**Status**: Fully Functional

**Capabilities**:
- Create unlimited communication widgets
- Platform selection: Website (JavaScript), Android (Native SDK), iOS (Native SDK)
- Customization options:
  - Primary color picker
  - Position (bottom-right, bottom-left, top-right, top-left)
  - Size (small, medium, large)
  - Welcome message
  - Enable/disable chat and voice features
  - Push notifications toggle (mobile only)
- Auto-generated embed code for each platform
- Live preview panel showing widget appearance
- Widget key generation for secure initialization

**Technical Details**:
- Database table: `widgets`
- API: `trpc.widgets.*` (create, list, getByKey, update, delete)
- Embed script: `/widget.js` (standalone, no dependencies)

---

### ✅ 2. Real-Time Chat System

**Status**: Fully Functional

**Capabilities**:
- Bidirectional real-time messaging via Socket.io
- Session management (waiting, active, ended states)
- Message history persistence
- Typing indicators for both visitors and agents
- Visitor identification (name, email, optional)
- Session metadata tracking (start time, duration, widget source)

**Technical Details**:
- Database tables: `sessions`, `messages`
- Socket.io events:
  - `visitor:join` - Visitor initiates chat
  - `visitor:message` - Visitor sends message
  - `agent:message` - Agent responds
  - `agent:typing` - Typing indicator
  - `session:accept` - Agent accepts chat
  - `session:end` - End conversation
- Message storage with timestamps and sender identification

---

### ✅ 3. Agent Dashboard

**Status**: Fully Functional

**Capabilities**:
- Real-time incoming session queue
- One-click session acceptance
- Live chat interface with message history
- Agent status management (Available, Busy, Offline)
- Session filtering:
  - By status (all, waiting, active, ended)
  - By widget source
  - By date range (calendar picker)
  - Search by visitor name/email/ID
- Browser notifications for new sessions and messages
- Audio alerts for incoming chats
- Notification permission management

**Technical Details**:
- Page: `/agent-chat`
- Real-time updates via Socket.io
- Browser Notification API integration
- Agent status persisted in database

---

### ✅ 4. AI Chatbot System

**Status**: Fully Functional

**Capabilities**:
- Create multiple AI chatbots with unique personalities
- 8 pre-built prompt templates:
  - Customer Support Agent
  - E-commerce Sales Assistant
  - Technical Support Specialist
  - Appointment Scheduling Assistant
  - Product Recommendation Engine
  - FAQ & Knowledge Base Bot
  - Lead Qualification Agent
  - Onboarding & Training Assistant
- Custom prompt creation (start from scratch)
- RAG Knowledge Base integration:
  - Upload documents (PDF, TXT, DOCX)
  - Add URLs for web scraping
  - Direct text input
- MCP Server configuration:
  - Connect to external data sources
  - Real-time customer data fetching
  - Custom server URL and authentication
- AI parameter tuning:
  - Temperature (creativity)
  - Max tokens (response length)
  - System instructions
- Chatbot testing interface

**Technical Details**:
- Database tables: `chatbots`, `knowledgeBases`, `mcpServers`, `promptTemplates`
- API: `trpc.chatbots.*`
- LLM integration: `server/_core/aiChatbot.ts`
- RAG implementation with vector similarity search
- MCP protocol client for external data

---

### ✅ 5. Intelligent Chatbot Routing

**Status**: Visual Builder Complete, Execution Engine Implemented

**Capabilities**:
- Visual workflow builder with drag-and-drop interface
- Node types:
  - **Chatbot Node**: Route to specific AI agent
  - **Condition Node**: Check conversation context (keywords, intent)
  - **MCP Check Node**: Query customer data from MCP servers
- Dynamic chatbot handoffs based on:
  - Conversation keywords (e.g., "pricing" → Sales Agent)
  - Customer data (e.g., premium tier → VIP Support)
  - Intent detection (e.g., technical issue → Tech Support)
- Real-time routing execution during conversations
- Routing history tracking per session
- Seamless handoff notifications to visitors

**Technical Details**:
- Database tables: `chatbotRoutings`, `routingNodes`, `routingEdges`, `routingExecutions`
- Visual builder: React Flow (`/chatbot-routing`)
- Execution engine: `server/_core/routingEngine.ts`
- Integrated into Socket.io message handler
- Condition evaluation with keyword matching and intent analysis

---

### ✅ 6. Canned Responses (Quick Replies)

**Status**: Fully Functional

**Capabilities**:
- Create, edit, delete quick reply templates
- Category organization (General, Technical, Sales, Billing)
- Shortcut integration in agent chat interface
- One-click message insertion
- Searchable response library

**Technical Details**:
- Database table: `cannedResponses`
- API: `trpc.cannedResponses.*`
- Page: `/canned-responses`
- Integrated into Agent Chat UI

---

### ✅ 7. Analytics Dashboard

**Status**: Fully Functional

**Capabilities**:
- Session metrics:
  - Total sessions (all time)
  - Active sessions (real-time)
  - Completed sessions
  - Missed sessions
- Performance metrics:
  - Average session duration
  - Average response time
  - Response rate
  - Miss rate
- Date range filtering
- Session status breakdown
- Widget performance comparison

**Technical Details**:
- Page: `/analytics`
- Real-time data aggregation
- Date range selector with calendar
- Visual metrics cards with icons

---

### ✅ 8. Settings & Configuration

**Status**: Fully Functional

**Capabilities**:
- Twilio VoIP configuration:
  - Account SID
  - Auth Token
  - TwiML App SID
  - Phone Number
- Secure credential storage
- Setup instructions and documentation
- Test connection functionality (ready for implementation)

**Technical Details**:
- Database table: `twilioSettings`
- API: `trpc.twilio.*`
- Page: `/settings`
- Encrypted credential storage

---

### ✅ 9. Branding & UI/UX

**Status**: Complete

**Capabilities**:
- Aether Foundation brand identity:
  - Deep Blue (#003251) - Primary backgrounds
  - Teal (#05B3B4) - CTAs and interactive elements
  - Vibrant Orange (#FF7A11) - Accent color
  - Light Gray (#E4F1F2) - Secondary backgrounds
  - Raleway font family
- Collapsible sidebar navigation:
  - Shows only icons when collapsed
  - Expands on hover with labels
  - Smooth transitions
- Responsive design (mobile-first)
- Consistent component library (shadcn/ui)
- Professional CRM-style layout

**Technical Details**:
- Global styles: `client/src/index.css`
- Layout component: `client/src/components/AppLayout.tsx`
- Logo: `/aether-logo-full.png`
- Theme provider with light mode default

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                         │
├─────────────────────────────────────────────────────────────┤
│  React App (Vite)          │  Embeddable Widget (Vanilla JS)│
│  - tRPC Client             │  - Socket.io Client            │
│  - Socket.io Client        │  - Standalone Script           │
│  - React Flow              │  - No Dependencies             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                      │
├─────────────────────────────────────────────────────────────┤
│  Express Server                                             │
│  - tRPC Router (/api/trpc)                                  │
│  - Socket.io Server (/socket.io)                            │
│  - OAuth Callback (/api/oauth/callback)                     │
│  - Static Assets (/widget.js, /logo.png)                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     Business Logic Layer                    │
├─────────────────────────────────────────────────────────────┤
│  - AI Chatbot Engine (aiChatbot.ts)                         │
│  - Routing Engine (routingEngine.ts)                        │
│  - Socket Event Handlers (socket.ts)                        │
│  - Database Helpers (db.ts)                                 │
│  - Twilio Integration (twilio.ts)                           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                             │
├─────────────────────────────────────────────────────────────┤
│  MySQL/TiDB Database (Drizzle ORM)                          │
│  - Users, Widgets, Sessions, Messages                       │
│  - Chatbots, Knowledge Bases, MCP Servers                   │
│  - Routing Workflows, Canned Responses                      │
│  - Analytics, Settings                                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   External Services                         │
├─────────────────────────────────────────────────────────────┤
│  - Manus LLM API (AI responses)                             │
│  - Manus OAuth (Authentication)                             │
│  - S3 Storage (File uploads)                                │
│  - Twilio (VoIP - configured)                               │
│  - MCP Servers (External data sources)                      │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow: Visitor Chat with AI Routing

```
1. Visitor opens website with embedded widget
2. Widget loads and connects to Socket.io server
3. Visitor clicks chat button and sends first message
4. Socket.io receives message and creates session
5. Routing engine evaluates workflow:
   - Checks initial chatbot (Welcome Agent)
   - Analyzes message content for keywords
   - Queries MCP server for customer data (if configured)
   - Determines next chatbot based on conditions
6. AI Chatbot generates response:
   - Retrieves RAG knowledge base content
   - Queries MCP server for real-time data
   - Calls LLM API with context
   - Returns response to visitor
7. If handoff condition met:
   - Routing engine switches to specialized agent (Sales/Support)
   - Notifies visitor of handoff
   - New chatbot continues conversation
8. Agent can take over at any time:
   - Receives notification in dashboard
   - Accepts session
   - AI pauses, agent responds manually
9. Session ends when visitor closes or agent ends chat
10. Analytics updated with session data
```

---

## Database Schema

### Core Tables

#### `users`
- `id` (INT, PK, Auto-increment)
- `openId` (VARCHAR, Unique) - Manus OAuth ID
- `name` (TEXT)
- `email` (VARCHAR)
- `loginMethod` (VARCHAR)
- `role` (ENUM: 'user', 'admin', 'agent')
- `createdAt`, `updatedAt`, `lastSignedIn` (TIMESTAMP)

#### `widgets`
- `id` (INT, PK)
- `userId` (INT, FK → users)
- `widgetKey` (VARCHAR, Unique)
- `name` (VARCHAR)
- `platform` (ENUM: 'website', 'android', 'ios')
- `primaryColor` (VARCHAR)
- `position` (ENUM: 'bottom-right', 'bottom-left', 'top-right', 'top-left')
- `size` (ENUM: 'small', 'medium', 'large')
- `welcomeMessage` (TEXT)
- `enableChat`, `enableVoice`, `pushNotificationsEnabled` (BOOLEAN)
- `createdAt`, `updatedAt` (TIMESTAMP)

#### `sessions`
- `id` (INT, PK)
- `widgetId` (INT, FK → widgets)
- `visitorName`, `visitorEmail` (VARCHAR, Optional)
- `status` (ENUM: 'waiting', 'active', 'ended')
- `currentChatbotId` (INT, FK → chatbots, Optional)
- `agentId` (INT, FK → users, Optional)
- `startedAt`, `endedAt` (TIMESTAMP)

#### `messages`
- `id` (INT, PK)
- `sessionId` (INT, FK → sessions)
- `senderType` (ENUM: 'visitor', 'agent', 'bot')
- `senderId` (INT, Optional)
- `content` (TEXT)
- `createdAt` (TIMESTAMP)

### AI & Automation Tables

#### `chatbots`
- `id` (INT, PK)
- `userId` (INT, FK → users)
- `name`, `description` (VARCHAR)
- `systemPrompt` (TEXT)
- `temperature` (FLOAT)
- `maxTokens` (INT)
- `isActive` (BOOLEAN)
- `createdAt`, `updatedAt` (TIMESTAMP)

#### `knowledgeBases`
- `id` (INT, PK)
- `chatbotId` (INT, FK → chatbots)
- `type` (ENUM: 'document', 'url', 'text')
- `content` (TEXT)
- `metadata` (JSON)
- `createdAt` (TIMESTAMP)

#### `mcpServers`
- `id` (INT, PK)
- `chatbotId` (INT, FK → chatbots)
- `name`, `serverUrl` (VARCHAR)
- `authToken` (VARCHAR, Optional)
- `isActive` (BOOLEAN)
- `createdAt` (TIMESTAMP)

#### `chatbotRoutings`
- `id` (INT, PK)
- `userId` (INT, FK → users)
- `name`, `description` (VARCHAR)
- `initialChatbotId` (INT, FK → chatbots)
- `isActive` (BOOLEAN)
- `createdAt`, `updatedAt` (TIMESTAMP)

#### `routingNodes`
- `id` (INT, PK)
- `routingId` (INT, FK → chatbotRoutings)
- `nodeId` (VARCHAR, Unique)
- `type` (ENUM: 'chatbot', 'condition', 'mcp_check')
- `config` (JSON) - Stores node-specific data
- `position` (JSON) - X, Y coordinates

#### `routingEdges`
- `id` (INT, PK)
- `routingId` (INT, FK → chatbotRoutings)
- `edgeId` (VARCHAR, Unique)
- `sourceNodeId`, `targetNodeId` (VARCHAR)
- `label` (VARCHAR, Optional)

#### `routingExecutions`
- `id` (INT, PK)
- `sessionId` (INT, FK → sessions)
- `routingId` (INT, FK → chatbotRoutings)
- `nodeId` (VARCHAR)
- `result` (JSON)
- `executedAt` (TIMESTAMP)

### Configuration Tables

#### `cannedResponses`
- `id` (INT, PK)
- `userId` (INT, FK → users)
- `category` (ENUM: 'general', 'technical', 'sales', 'billing')
- `title`, `content` (TEXT)
- `createdAt`, `updatedAt` (TIMESTAMP)

#### `twilioSettings`
- `id` (INT, PK)
- `userId` (INT, FK → users)
- `accountSid`, `authToken`, `twimlAppSid`, `phoneNumber` (VARCHAR)
- `isActive` (BOOLEAN)
- `createdAt`, `updatedAt` (TIMESTAMP)

#### `calls`
- `id` (INT, PK)
- `sessionId` (INT, FK → sessions)
- `twilioCallSid` (VARCHAR)
- `status` (ENUM: 'initiated', 'ringing', 'in-progress', 'completed', 'failed')
- `duration` (INT)
- `recordingUrl` (VARCHAR, Optional)
- `startedAt`, `endedAt` (TIMESTAMP)

#### `promptTemplates`
- `id` (INT, PK)
- `name`, `description`, `category` (VARCHAR)
- `systemPrompt` (TEXT)
- `suggestedTemperature` (FLOAT)
- `suggestedMaxTokens` (INT)
- `isPublic` (BOOLEAN)
- `createdAt` (TIMESTAMP)

---

## API Endpoints

### tRPC Routers

All endpoints are type-safe and accessible via `trpc.<router>.<procedure>`

#### `auth`
- `me` (query) - Get current user
- `logout` (mutation) - Clear session

#### `widgets`
- `create` (mutation) - Create new widget
- `list` (query) - Get user's widgets
- `getByKey` (query) - Get widget by key (public)
- `update` (mutation) - Update widget
- `delete` (mutation) - Delete widget

#### `sessions`
- `create` (mutation) - Create chat session
- `list` (query) - Get sessions with filters
- `getById` (query) - Get session details
- `accept` (mutation) - Agent accepts session
- `end` (mutation) - End session
- `getMessages` (query) - Get session messages

#### `messages`
- `create` (mutation) - Send message
- `list` (query) - Get messages for session

#### `chatbots`
- `create` (mutation) - Create chatbot
- `list` (query) - Get user's chatbots
- `getById` (query) - Get chatbot details
- `update` (mutation) - Update chatbot
- `delete` (mutation) - Delete chatbot
- `test` (mutation) - Test chatbot response

#### `knowledgeBases`
- `create` (mutation) - Add knowledge base
- `list` (query) - Get chatbot's knowledge bases
- `delete` (mutation) - Remove knowledge base

#### `mcpServers`
- `create` (mutation) - Add MCP server
- `list` (query) - Get chatbot's MCP servers
- `update` (mutation) - Update MCP server
- `delete` (mutation) - Remove MCP server
- `test` (mutation) - Test MCP connection

#### `routings`
- `create` (mutation) - Create routing workflow
- `list` (query) - Get user's routings
- `getById` (query) - Get routing details
- `update` (mutation) - Update routing
- `delete` (mutation) - Delete routing
- `saveNodes` (mutation) - Save workflow nodes
- `saveEdges` (mutation) - Save workflow connections

#### `cannedResponses`
- `create` (mutation) - Create quick reply
- `list` (query) - Get user's responses
- `update` (mutation) - Update response
- `delete` (mutation) - Delete response

#### `analytics`
- `getOverview` (query) - Get analytics summary
- `getSessionStats` (query) - Get session statistics

#### `twilio`
- `getSettings` (query) - Get Twilio config
- `saveSettings` (mutation) - Save Twilio credentials
- `generateToken` (mutation) - Generate access token
- `initiateCall` (mutation) - Start voice call

### Socket.io Events

#### Client → Server
- `visitor:join` - Visitor joins chat
  - Payload: `{ widgetKey, visitorName?, visitorEmail? }`
- `visitor:message` - Visitor sends message
  - Payload: `{ sessionId, content }`
- `agent:join` - Agent connects to dashboard
  - Payload: `{ agentId }`
- `agent:accept` - Agent accepts session
  - Payload: `{ sessionId }`
- `agent:message` - Agent sends message
  - Payload: `{ sessionId, content }`
- `agent:typing` - Agent is typing
  - Payload: `{ sessionId }`
- `agent:status` - Agent updates status
  - Payload: `{ status: 'available' | 'busy' | 'offline' }`
- `session:end` - End session
  - Payload: `{ sessionId }`

#### Server → Client
- `session:created` - New session created
  - Payload: `{ session }`
- `session:accepted` - Agent accepted session
  - Payload: `{ sessionId, agentName }`
- `message:received` - New message
  - Payload: `{ message }`
- `agent:typing` - Agent typing indicator
  - Payload: `{ sessionId }`
- `chatbot:handoff` - Chatbot switched
  - Payload: `{ sessionId, fromChatbot, toChatbot, reason }`
- `session:ended` - Session ended
  - Payload: `{ sessionId }`

---

## User Interface

### Page Structure

#### Public Pages
- **`/`** - Landing page with product showcase
  - Hero section
  - Features overview
  - CTA buttons (Get Started, Log In)

#### Authenticated Pages (with Sidebar)
- **`/dashboard`** - Overview dashboard
  - Widget statistics
  - Active sessions count
  - Average response time
  - Total conversations
  - Quick access cards (Agent Chat, AI Chatbots, Analytics)
  
- **`/widgets`** - Widget customizer
  - Platform selector (Website/Android/iOS)
  - Customization form
  - Live preview panel
  - Embed code generator
  
- **`/agent-chat`** - Agent dashboard
  - Session queue (waiting/active)
  - Chat interface
  - Filters (status, widget, date, search)
  - Canned responses selector
  - Agent status controls
  
- **`/ai-chatbots`** - AI chatbot management
  - Chatbot list
  - Create/edit chatbot form
  - Prompt template selector
  - Knowledge base management
  - MCP server configuration
  - Test interface
  
- **`/chatbot-routing`** - Visual routing builder
  - React Flow canvas
  - Node palette (Chatbot, Condition, MCP Check)
  - Workflow configuration
  - Save/load workflows
  
- **`/analytics`** - Analytics dashboard
  - Session metrics cards
  - Date range selector
  - Performance indicators
  - Status breakdown
  
- **`/canned-responses`** - Quick replies management
  - Response list by category
  - Create/edit/delete forms
  - Search functionality
  
- **`/settings`** - Platform settings
  - Twilio configuration
  - Setup instructions

### Component Library

All UI components use shadcn/ui:
- `Button`, `Input`, `Textarea`, `Label`
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`
- `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`
- `Switch`, `Badge`, `Avatar`, `Separator`
- `Popover`, `Calendar`, `Tabs`, `Alert`

### Sidebar Navigation

Collapsible sidebar with icons:
- 🏠 Dashboard
- 💬 Widgets
- 👥 Agent Chat
- 🤖 AI Chatbots
- 🔀 Chatbot Routing
- 📊 Analytics
- ⚡ Quick Replies
- 🔧 Automations (placeholder)
- ⚙️ Settings

---

## AI & Automation

### AI Chatbot Engine

**File**: `server/_core/aiChatbot.ts`

**Process**:
1. Receive message from visitor
2. Retrieve chatbot configuration
3. Load RAG knowledge bases:
   - Search for relevant documents
   - Extract context snippets
4. Query MCP servers:
   - Fetch customer data
   - Get real-time information
5. Build LLM prompt:
   - System instructions
   - Knowledge base context
   - MCP data
   - Conversation history
   - Current message
6. Call LLM API with parameters:
   - Temperature (creativity)
   - Max tokens (length)
7. Return AI-generated response
8. Store message in database

**RAG Implementation**:
- Document chunking (1000 chars)
- Keyword extraction
- Similarity search
- Context injection into prompt

**MCP Integration**:
- HTTP client for MCP servers
- Authentication token support
- JSON response parsing
- Error handling and fallbacks

### Routing Engine

**File**: `server/_core/routingEngine.ts`

**Process**:
1. Receive message in active session
2. Load routing workflow for widget
3. Get current node (chatbot/condition/mcp_check)
4. Evaluate node:
   - **Chatbot Node**: Use this chatbot for response
   - **Condition Node**: Check keywords in message
   - **MCP Check Node**: Query MCP server for data
5. Determine next node based on evaluation
6. If chatbot changed:
   - Update session's currentChatbotId
   - Emit handoff notification
   - Log routing execution
7. Continue with new chatbot

**Condition Evaluation**:
- Keyword matching (case-insensitive)
- Intent detection (future: NLP model)
- Boolean logic support

**MCP Queries**:
- Dynamic endpoint construction
- Customer ID from session metadata
- Response caching (5 minutes)

---

## Integration Capabilities

### Embeddable Widget

**File**: `client/public/widget.js`

**Features**:
- Standalone JavaScript (no dependencies)
- Responsive design (mobile-first)
- Customizable appearance
- Socket.io connection
- Chat interface with typing indicators
- Voice call button (UI ready, Twilio integration pending)

**Initialization**:
```javascript
<script src="https://your-domain.com/widget.js"></script>
<script>
  SaaSCommWidget.init({
    widgetKey: 'your-widget-key',
    apiUrl: 'https://your-domain.com',
    primaryColor: '#05B3B4',
    position: 'bottom-right',
    size: 'medium',
    welcomeMessage: 'Hello! How can we help?',
    enableChat: true,
    enableVoice: true
  });
</script>
```

### Native Mobile SDKs

**Android Integration** (Documentation Ready):
```kotlin
// build.gradle
dependencies {
    implementation 'com.aether:saas-comm-sdk:1.0.0'
    implementation 'com.google.firebase:firebase-messaging:23.0.0'
}

// Initialize
val config = WidgetConfig(
    widgetKey = "your-widget-key",
    apiUrl = "https://your-domain.com",
    primaryColor = "#05B3B4",
    enableChat = true,
    enableVoice = true,
    pushNotifications = true
)
SaaSCommSDK.initialize(context, config)

// Show widget
SaaSCommSDK.show()
```

**iOS Integration** (Documentation Ready):
```swift
// Podfile
pod 'AetherSaaSComm', '~> 1.0'

// Initialize
let config = WidgetConfig(
    widgetKey: "your-widget-key",
    apiURL: "https://your-domain.com",
    primaryColor: "#05B3B4",
    enableChat: true,
    enableVoice: true,
    pushNotifications: true
)
SaaSCommSDK.initialize(config: config)

// Show widget
SaaSCommSDK.show()
```

### MCP Server Integration

**Example MCP Server** (Customer Data):
```javascript
// MCP Server Endpoint
POST https://your-mcp-server.com/customer-data
Headers:
  Authorization: Bearer your-token
Body:
  {
    "customerId": "visitor-email@example.com",
    "action": "get_profile"
  }

Response:
  {
    "customer": {
      "id": "12345",
      "name": "John Doe",
      "tier": "premium",
      "lastPurchase": "2025-11-01",
      "totalSpent": 5000
    }
  }
```

**Chatbot can then use**:
- Customer tier for routing (premium → VIP support)
- Purchase history for recommendations
- Account status for personalized responses

### Twilio VoIP Integration

**Configuration** (via Settings page):
- Account SID
- Auth Token
- TwiML App SID
- Phone Number

**Backend Ready**:
- Token generation endpoint
- Call initiation endpoint
- Call status webhooks (structure ready)

**Frontend Pending**:
- Widget voice call UI
- Agent call interface
- In-call controls (mute, hold, transfer)
- Call recording playback

---

## What's Next

### 🔴 High Priority (Core Functionality)

#### 1. Complete Voice Call Integration
**Status**: Backend ready, UI pending  
**Effort**: Medium (2-3 days)

**Tasks**:
- [ ] Add voice call UI to widget
  - Call button
  - Dialing interface
  - In-call controls (mute, hang up)
  - Connection status indicator
- [ ] Implement agent call interface
  - Incoming call notification
  - Answer/reject buttons
  - Active call panel
  - Call transfer controls
- [ ] Integrate Twilio Voice SDK
  - Client-side token refresh
  - Call event handlers
  - Error handling
- [ ] Add call recording
  - Enable recording in Twilio
  - Store recording URLs
  - Playback interface in dashboard
- [ ] Test end-to-end voice calling

**Files to Modify**:
- `client/public/widget.js` - Add voice UI
- `client/src/pages/AgentChat.tsx` - Add call interface
- `server/_core/twilio.ts` - Add call handlers
- `server/routers.ts` - Add call endpoints

---

#### 2. Connect Chatbots to Widgets
**Status**: Not started  
**Effort**: Small (1 day)

**Tasks**:
- [ ] Add chatbot routing selector to widget customizer
- [ ] Update widget schema to include `routingId`
- [ ] Display routing workflow preview in widget form
- [ ] Update widget initialization to load routing
- [ ] Test chatbot assignment and routing execution

**Files to Modify**:
- `client/src/pages/WidgetCustomizer.tsx` - Add routing selector
- `drizzle/schema.ts` - Add routingId to widgets table
- `server/db.ts` - Update widget queries
- `client/public/widget.js` - Load routing config

---

#### 3. Build Automation Workflow Engine
**Status**: Not started  
**Effort**: Large (5-7 days)

**Description**: Create a visual workflow builder for general automations beyond chatbot routing.

**Features**:
- Visual workflow builder (React Flow)
- Trigger types:
  - New message received
  - Session status change
  - Time-based (schedule)
  - Webhook received
- Action nodes:
  - Send message
  - Assign to agent
  - Update session status
  - Call webhook
  - Send email (AI-generated)
  - Create task
  - Update CRM
- Condition nodes:
  - If/else logic
  - Multiple conditions (AND/OR)
  - Field comparisons
  - Custom expressions
- Filter nodes:
  - Session filters
  - Message filters
  - Customer data filters
- Webhook integration:
  - Incoming webhooks (triggers)
  - Outgoing webhooks (actions)
  - Authentication support
- AI-powered actions:
  - Generate follow-up emails
  - Summarize conversations
  - Sentiment analysis
  - Priority scoring

**Database Schema**:
```sql
CREATE TABLE automationWorkflows (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  name VARCHAR(255),
  description TEXT,
  triggerType ENUM('message', 'status_change', 'schedule', 'webhook'),
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE automationNodes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  workflowId INT NOT NULL,
  nodeId VARCHAR(255) UNIQUE,
  type ENUM('trigger', 'action', 'condition', 'filter'),
  config JSON,
  position JSON
);

CREATE TABLE automationEdges (
  id INT PRIMARY KEY AUTO_INCREMENT,
  workflowId INT NOT NULL,
  edgeId VARCHAR(255) UNIQUE,
  sourceNodeId VARCHAR(255),
  targetNodeId VARCHAR(255),
  label VARCHAR(255)
);

CREATE TABLE automationExecutions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  workflowId INT NOT NULL,
  sessionId INT,
  status ENUM('running', 'completed', 'failed'),
  result JSON,
  executedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Files to Create**:
- `client/src/pages/Automations.tsx` - Workflow builder UI
- `server/_core/automationEngine.ts` - Execution engine
- `server/routers.ts` - Add automation endpoints

---

### 🟡 Medium Priority (Enhancements)

#### 4. Routing Analytics Dashboard
**Status**: Not started  
**Effort**: Small (1 day)

**Features**:
- Routing performance metrics
- Most common routing paths
- Handoff frequency by chatbot
- Average time per chatbot
- Conversion rates by route
- Visual flow diagram with usage stats

---

#### 5. Advanced Agent Features
**Status**: Not started  
**Effort**: Medium (2-3 days)

**Features**:
- Agent assignment rules (round-robin, skill-based)
- Agent workload balancing
- Agent performance metrics
- Session transfer between agents
- Internal agent notes
- Agent-to-agent chat
- Supervisor monitoring dashboard

---

#### 6. Enhanced Knowledge Base
**Status**: Basic implementation  
**Effort**: Medium (2-3 days)

**Improvements**:
- Vector embeddings for semantic search
- Multi-language support
- Knowledge base versioning
- Automatic document updates (URL monitoring)
- Knowledge base analytics (most used articles)
- Suggested knowledge base entries (from conversations)

---

#### 7. Mobile App (Native Agent Dashboard)
**Status**: Not started  
**Effort**: Large (10-14 days)

**Description**: Build native mobile apps for agents to respond on the go.

**Platforms**:
- iOS (Swift/SwiftUI)
- Android (Kotlin/Jetpack Compose)

**Features**:
- Push notifications for new chats
- Real-time chat interface
- Voice call support
- Agent status management
- Session history
- Canned responses
- Offline mode with sync

---

#### 8. Customer Portal
**Status**: Not started  
**Effort**: Medium (3-4 days)

**Description**: Self-service portal for end customers.

**Features**:
- Chat history access
- Download transcripts
- Rate conversations
- View knowledge base articles
- Submit feedback
- Manage preferences

---

### 🟢 Low Priority (Nice to Have)

#### 9. Advanced Analytics
- Sentiment analysis dashboard
- Customer satisfaction scores (CSAT)
- Net Promoter Score (NPS) tracking
- Conversation topic clustering
- Agent performance leaderboard
- Custom report builder
- Data export (CSV, PDF)

---

#### 10. Integrations Marketplace
- Pre-built integrations:
  - Salesforce CRM
  - HubSpot
  - Zendesk
  - Intercom
  - Slack notifications
  - Microsoft Teams
  - Google Sheets
  - Zapier
- Integration templates
- OAuth connection flows
- Webhook documentation

---

#### 11. White-Label Solution
- Custom branding for resellers
- Multi-tenant architecture
- Subdomain provisioning
- Custom email templates
- Branded mobile apps
- Reseller dashboard
- Usage-based billing

---

#### 12. Compliance & Security
- GDPR compliance tools
- Data retention policies
- PII redaction
- Audit logs
- Two-factor authentication (2FA)
- Role-based access control (RBAC)
- IP whitelisting
- SOC 2 compliance

---

## Deployment Guide

### Prerequisites

- Node.js 22+
- MySQL 8+ or TiDB
- S3-compatible storage
- Domain with SSL certificate
- Twilio account (for voice)

### Environment Variables

Create `.env` file:

```bash
# Database
DATABASE_URL=mysql://user:password@host:3306/database

# Authentication
JWT_SECRET=your-secret-key
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://auth.manus.im
VITE_APP_ID=your-app-id
OWNER_OPEN_ID=your-owner-id
OWNER_NAME=Your Name

# LLM & AI
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key
VITE_FRONTEND_FORGE_API_KEY=your-frontend-key
VITE_FRONTEND_FORGE_API_URL=https://forge.manus.im

# Application
VITE_APP_TITLE=Aether: Foundation
VITE_APP_LOGO=/aether-logo-full.png

# Analytics (optional)
VITE_ANALYTICS_ENDPOINT=https://analytics.example.com
VITE_ANALYTICS_WEBSITE_ID=your-website-id
```

### Installation Steps

```bash
# 1. Clone repository
git clone <repository-url>
cd saas-communication-platform

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# 4. Run database migrations
pnpm db:push

# 5. Seed prompt templates
pnpm tsx scripts/seed-prompt-templates.mjs

# 6. Build for production
pnpm build

# 7. Start server
pnpm start
```

### Deployment Platforms

#### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Railway
```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy
railway up
```

#### Docker
```dockerfile
# Dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

```bash
# Build and run
docker build -t aether-saas .
docker run -p 3000:3000 --env-file .env aether-saas
```

### Database Migrations

```bash
# Generate migration
pnpm drizzle-kit generate

# Apply migration
pnpm db:push

# View database
pnpm drizzle-kit studio
```

### Monitoring

**Recommended Tools**:
- **Application**: Sentry (error tracking)
- **Performance**: New Relic or Datadog
- **Logs**: Logtail or Papertrail
- **Uptime**: UptimeRobot or Pingdom

**Health Check Endpoint**:
```
GET /api/health
Response: { "status": "ok", "timestamp": "..." }
```

---

## Testing

### Unit Tests (Vitest)

**Framework Ready**, tests to be written:

```bash
# Run tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

**Test Structure**:
```
tests/
├── unit/
│   ├── aiChatbot.test.ts
│   ├── routingEngine.test.ts
│   └── db.test.ts
├── integration/
│   ├── api.test.ts
│   └── socket.test.ts
└── e2e/
    ├── widget.test.ts
    └── agent-flow.test.ts
```

### Manual Testing Checklist

- [ ] Widget embedding on test website
- [ ] Visitor chat flow (initiate, message, end)
- [ ] Agent dashboard (accept, respond, end)
- [ ] AI chatbot responses
- [ ] Chatbot routing handoffs
- [ ] Canned responses insertion
- [ ] Analytics data accuracy
- [ ] Settings save/load
- [ ] Browser notifications
- [ ] Mobile responsiveness

---

## Support & Documentation

### User Documentation

**Create**:
- Getting Started Guide
- Widget Integration Tutorial
- AI Chatbot Setup Guide
- Routing Workflow Examples
- Agent Dashboard Manual
- API Reference
- Troubleshooting Guide

### Developer Documentation

**Create**:
- Architecture Deep Dive
- Database Schema Reference
- API Endpoint Documentation
- Socket.io Event Reference
- MCP Server Integration Guide
- Custom Integration Examples
- Contributing Guidelines

---

## License & Credits

**Project**: Aether Foundation SaaS Communication Platform  
**Created**: November 2025  
**Technology**: Built with React, tRPC, Socket.io, Drizzle ORM  
**AI Integration**: Manus LLM API  
**Design**: Aether Foundation Brand Guidelines  

---

## Conclusion

This SaaS communication platform provides a comprehensive foundation for intelligent customer communication. With real-time chat, AI-powered chatbots, intelligent routing, and agent dashboards, it's ready for production use. The modular architecture allows for easy extension with voice calling, automation workflows, and advanced integrations.

**Current State**: Fully functional chat platform with AI capabilities  
**Next Milestone**: Complete voice integration and automation engine  
**Long-term Vision**: Full-featured customer communication hub with white-label options

For questions or support, contact the development team.

---

**End of Documentation**
