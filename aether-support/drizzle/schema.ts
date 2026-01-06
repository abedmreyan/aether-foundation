import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Widget configurations created by clients
 */
export const widgets = mysqlTable("widgets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  // Platform type
  platform: mysqlEnum("platform", ["website", "android", "ios"]).default("website").notNull(),
  // Appearance
  primaryColor: varchar("primaryColor", { length: 7 }).default("#3b82f6").notNull(),
  position: mysqlEnum("position", ["bottom-right", "bottom-left", "top-right", "top-left"]).default("bottom-right").notNull(),
  size: mysqlEnum("size", ["small", "medium", "large"]).default("medium").notNull(),
  welcomeMessage: text("welcomeMessage"),
  // Features
  enableChat: boolean("enableChat").default(true).notNull(),
  enableVoice: boolean("enableVoice").default(true).notNull(),
  // Push notification settings (for mobile)
  pushNotificationsEnabled: boolean("pushNotificationsEnabled").default(false).notNull(),
  // Widget key for embedding
  widgetKey: varchar("widgetKey", { length: 64 }).notNull().unique(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Widget = typeof widgets.$inferSelect;
export type InsertWidget = typeof widgets.$inferInsert;

/**
 * Agent status and configuration
 */
export const agents = mysqlTable("agents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(), // Links to users table
  status: mysqlEnum("status", ["available", "busy", "offline"]).default("offline").notNull(),
  currentSessionId: int("currentSessionId"), // Current active session
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = typeof agents.$inferInsert;

/**
 * Communication sessions (calls or chats)
 */
export const sessions = mysqlTable("sessions", {
  id: int("id").autoincrement().primaryKey(),
  widgetId: int("widgetId").notNull(),
  type: mysqlEnum("type", ["chat", "voice"]).notNull(),
  status: mysqlEnum("status", ["waiting", "active", "ended", "missed"]).default("waiting").notNull(),
  // Visitor information
  visitorName: varchar("visitorName", { length: 255 }),
  visitorEmail: varchar("visitorEmail", { length: 320 }),
  visitorId: varchar("visitorId", { length: 64 }).notNull(), // Anonymous ID from widget
  // Agent assignment
  agentId: int("agentId"),
  // Call specific
  recordingUrl: text("recordingUrl"),
  duration: int("duration"), // Duration in seconds
  // Timestamps
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  endedAt: timestamp("endedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;

/**
 * Chat messages within sessions
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  senderType: mysqlEnum("senderType", ["visitor", "agent"]).notNull(),
  senderId: varchar("senderId", { length: 64 }).notNull(), // visitorId or agentId
  senderName: varchar("senderName", { length: 255 }),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Canned responses for quick replies
 */
export const cannedResponses = mysqlTable("cannedResponses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Owner of the response
  category: varchar("category", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  shortcut: varchar("shortcut", { length: 50 }), // Optional keyboard shortcut
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CannedResponse = typeof cannedResponses.$inferSelect;
export type InsertCannedResponse = typeof cannedResponses.$inferInsert;

/**
 * Twilio VoIP settings for each user
 */
export const twilioSettings = mysqlTable("twilioSettings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  accountSid: varchar("accountSid", { length: 255 }),
  authToken: varchar("authToken", { length: 255 }),
  twimlAppSid: varchar("twimlAppSid", { length: 255 }),
  phoneNumber: varchar("phoneNumber", { length: 20 }),
  isConfigured: boolean("isConfigured").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TwilioSettings = typeof twilioSettings.$inferSelect;
export type InsertTwilioSettings = typeof twilioSettings.$inferInsert;

/**
 * Voice call records
 */
export const calls = mysqlTable("calls", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  widgetId: int("widgetId").notNull(),
  agentId: int("agentId"),
  callSid: varchar("callSid", { length: 255 }), // Twilio call SID
  status: mysqlEnum("status", ["initiated", "ringing", "in-progress", "completed", "failed", "busy", "no-answer"]).default("initiated").notNull(),
  duration: int("duration").default(0), // in seconds
  recordingUrl: text("recordingUrl"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  endedAt: timestamp("endedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Call = typeof calls.$inferSelect;
export type InsertCall = typeof calls.$inferInsert;

/**
 * AI Chatbots
 */
export const chatbots = mysqlTable("chatbots", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  systemPrompt: text("systemPrompt").notNull(),
  temperature: int("temperature").default(70), // 0-100, maps to 0.0-1.0
  maxTokens: int("maxTokens").default(500),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Chatbot = typeof chatbots.$inferSelect;
export type InsertChatbot = typeof chatbots.$inferInsert;

/**
 * Knowledge Bases for RAG
 */
export const knowledgeBases = mysqlTable("knowledgeBases", {
  id: int("id").autoincrement().primaryKey(),
  chatbotId: int("chatbotId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  content: text("content").notNull(), // Can store file content or URL
  type: mysqlEnum("type", ["text", "url", "file"]).notNull(),
  fileUrl: text("fileUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type KnowledgeBase = typeof knowledgeBases.$inferSelect;
export type InsertKnowledgeBase = typeof knowledgeBases.$inferInsert;

/**
 * MCP Server Configurations
 */
export const mcpServers = mysqlTable("mcpServers", {
  id: int("id").autoincrement().primaryKey(),
  chatbotId: int("chatbotId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  serverUrl: varchar("serverUrl", { length: 500 }).notNull(),
  authType: mysqlEnum("authType", ["none", "bearer", "api_key", "basic"]).default("none").notNull(),
  authToken: varchar("authToken", { length: 500 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type McpServer = typeof mcpServers.$inferSelect;
export type InsertMcpServer = typeof mcpServers.$inferInsert;

/**
 * Chatbot-Widget Assignments
 */
export const chatbotWidgets = mysqlTable("chatbotWidgets", {
  id: int("id").autoincrement().primaryKey(),
  chatbotId: int("chatbotId").notNull(),
  widgetId: int("widgetId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatbotWidget = typeof chatbotWidgets.$inferSelect;
export type InsertChatbotWidget = typeof chatbotWidgets.$inferInsert;

/**
 * Automation Workflows
 */
export const workflows = mysqlTable("workflows", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  triggerType: mysqlEnum("triggerType", ["new_message", "new_call", "status_change", "time_based", "webhook"]).notNull(),
  triggerConfig: text("triggerConfig"), // JSON config
  conditions: text("conditions"), // JSON array of conditions
  actions: text("actions"), // JSON array of actions
  isActive: boolean("isActive").default(true).notNull(),
  executionCount: int("executionCount").default(0),
  lastExecutedAt: timestamp("lastExecutedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = typeof workflows.$inferInsert;

/**
 * Workflow Execution Logs
 */
export const workflowLogs = mysqlTable("workflowLogs", {
  id: int("id").autoincrement().primaryKey(),
  workflowId: int("workflowId").notNull(),
  status: mysqlEnum("status", ["success", "failed", "skipped"]).notNull(),
  triggerData: text("triggerData"), // JSON data that triggered the workflow
  executionResult: text("executionResult"), // JSON result of execution
  errorMessage: text("errorMessage"),
  executedAt: timestamp("executedAt").defaultNow().notNull(),
});

export type WorkflowLog = typeof workflowLogs.$inferSelect;
export type InsertWorkflowLog = typeof workflowLogs.$inferInsert;

/**
 * AI Prompt Templates
 */
export const promptTemplates = mysqlTable("promptTemplates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description"),
  systemPrompt: text("systemPrompt").notNull(),
  isPublic: boolean("isPublic").default(true).notNull(), // System templates vs user templates
  userId: int("userId"), // NULL for system templates
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PromptTemplate = typeof promptTemplates.$inferSelect;
export type InsertPromptTemplate = typeof promptTemplates.$inferInsert;

/**
 * Chatbot Routing Rules - Define intelligent routing between AI agents
 */
export const chatbotRoutingRules = mysqlTable("chatbotRoutingRules", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  widgetId: int("widgetId").notNull(), // Which widget this routing applies to
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  // Initial chatbot (welcome agent)
  initialChatbotId: int("initialChatbotId").notNull(),
  // Routing configuration (JSON)
  routingConfig: text("routingConfig").notNull(), // JSON: nodes and connections
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChatbotRoutingRule = typeof chatbotRoutingRules.$inferSelect;
export type InsertChatbotRoutingRule = typeof chatbotRoutingRules.$inferInsert;

/**
 * Chatbot Routing Nodes - Individual routing decision points
 */
export const chatbotRoutingNodes = mysqlTable("chatbotRoutingNodes", {
  id: int("id").autoincrement().primaryKey(),
  routingRuleId: int("routingRuleId").notNull(),
  nodeId: varchar("nodeId", { length: 64 }).notNull(), // UUID for visual builder
  nodeType: mysqlEnum("nodeType", ["chatbot", "condition", "mcp_check", "handoff"]).notNull(),
  chatbotId: int("chatbotId"), // If nodeType is 'chatbot'
  conditionConfig: text("conditionConfig"), // JSON: condition logic
  positionX: int("positionX").default(0),
  positionY: int("positionY").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatbotRoutingNode = typeof chatbotRoutingNodes.$inferSelect;
export type InsertChatbotRoutingNode = typeof chatbotRoutingNodes.$inferInsert;

/**
 * Chatbot Routing Connections - Links between nodes
 */
export const chatbotRoutingConnections = mysqlTable("chatbotRoutingConnections", {
  id: int("id").autoincrement().primaryKey(),
  routingRuleId: int("routingRuleId").notNull(),
  sourceNodeId: varchar("sourceNodeId", { length: 64 }).notNull(),
  targetNodeId: varchar("targetNodeId", { length: 64 }).notNull(),
  conditionLabel: varchar("conditionLabel", { length: 255 }), // e.g., "Sales Intent Detected"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatbotRoutingConnection = typeof chatbotRoutingConnections.$inferSelect;
export type InsertChatbotRoutingConnection = typeof chatbotRoutingConnections.$inferInsert;

/**
 * Session Chatbot History - Track which chatbots handled each session
 */
export const sessionChatbotHistory = mysqlTable("sessionChatbotHistory", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  chatbotId: int("chatbotId").notNull(),
  handoffReason: text("handoffReason"), // Why the handoff occurred
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  endedAt: timestamp("endedAt"),
});

export type SessionChatbotHistory = typeof sessionChatbotHistory.$inferSelect;
export type InsertSessionChatbotHistory = typeof sessionChatbotHistory.$inferInsert;
