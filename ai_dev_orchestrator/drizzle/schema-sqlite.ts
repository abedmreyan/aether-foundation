import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ============================================================================
// USERS
// ============================================================================

export const users = sqliteTable("users", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    openId: text("openId").notNull().unique(),
    name: text("name"),
    email: text("email"),
    loginMethod: text("loginMethod"),
    role: text("role", { enum: ["founder", "admin", "member"] }).default("member").notNull(),
    createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
    lastSignedIn: integer("lastSignedIn", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================================
// PROJECTS
// ============================================================================

export const projects = sqliteTable("projects", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    description: text("description").notNull(),
    localPath: text("localPath"), // Path to local codebase
    status: text("status", {
        enum: ["active", "paused", "completed", "archived"]
    }).default("active").notNull(),
    createdBy: integer("createdBy").notNull().references(() => users.id),
    createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

// ============================================================================
// PIPELINES (Kanban per department)
// ============================================================================

export const pipelines = sqliteTable("pipelines", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    projectId: integer("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type", {
        enum: ["development", "marketing", "research", "strategy"]
    }).notNull(),
    stages: text("stages").notNull(), // JSON array: ["Backlog", "Approved", ...]
    createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type Pipeline = typeof pipelines.$inferSelect;
export type InsertPipeline = typeof pipelines.$inferInsert;

// ============================================================================
// SUBSYSTEMS (Logical groupings detected by AI)
// ============================================================================

export const subsystems = sqliteTable("subsystems", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    projectId: integer("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    path: text("path"), // Relative path in codebase
    description: text("description"),
    purpose: text("purpose"), // AI-generated purpose
    order: integer("order").default(0).notNull(), // Display order
    createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type Subsystem = typeof subsystems.$inferSelect;
export type InsertSubsystem = typeof subsystems.$inferInsert;

// ============================================================================
// MODULES (Components within subsystems)
// ============================================================================

export const modules = sqliteTable("modules", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    subsystemId: integer("subsystemId").notNull().references(() => subsystems.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    path: text("path"), // Relative path
    description: text("description"),
    files: text("files"), // JSON array of key files
    createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type Module = typeof modules.$inferSelect;
export type InsertModule = typeof modules.$inferInsert;
// ============================================================================
// AGENTS (Expanded roles)
// ============================================================================

export const agents = sqliteTable("agents", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    role: text("role", {
        enum: [
            // Executive
            "product_manager", "strategy",
            // Development
            "coordinator", "lead_architect", "frontend", "backend",
            "data_engineer", "devops", "ui_ux", "qa",
            // Research (on-demand via Perplexity)
            "tech_research", "market_research", "business_analyst",
            // Marketing
            "marketing", "content", "seo"
        ]
    }).notNull(),
    description: text("description").notNull(),
    department: text("department", {
        enum: ["executive", "development", "research", "marketing"]
    }).notNull(),
    status: text("status", {
        enum: ["idle", "working", "blocked"]
    }).default("idle").notNull(),
    currentTaskId: integer("currentTaskId"),
    createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = typeof agents.$inferInsert;

// ============================================================================
// TASKS (With queue ordering and approval)
// ============================================================================

export const tasks = sqliteTable("tasks", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    pipelineId: integer("pipelineId").notNull().references(() => pipelines.id, { onDelete: "cascade" }),
    // Scope fields (optional - null means project-level scope)
    subsystemId: integer("subsystemId").references(() => subsystems.id),
    moduleId: integer("moduleId").references(() => modules.id),
    title: text("title").notNull(),
    description: text("description").notNull(),
    requirements: text("requirements"), // Optional requirements
    stage: text("stage").default("Backlog").notNull(), // Current Kanban stage
    queueOrder: integer("queueOrder").default(0).notNull(), // Founder-controlled order
    suggestedAgentRole: text("suggestedAgentRole"), // AI suggestion
    assignedAgentId: integer("assignedAgentId").references(() => agents.id),
    status: text("status", {
        enum: ["pending", "approved", "in_progress", "review", "completed", "rejected"]
    }).default("pending").notNull(),
    generatedPrompt: text("generatedPrompt"), // Auto-generated IDE prompt
    result: text("result"), // What was done (from IDE agent)
    filesChanged: text("filesChanged"), // JSON array of files
    createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
    completedAt: integer("completedAt", { mode: "timestamp" }),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

// ============================================================================
// FOUNDER APPROVALS
// ============================================================================

export const approvals = sqliteTable("approvals", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    entityType: text("entityType", {
        enum: ["task", "content", "roadmap", "release", "research"]
    }).notNull(),
    entityId: integer("entityId").notNull(),
    status: text("status", {
        enum: ["pending", "approved", "rejected", "revision_requested"]
    }).default("pending").notNull(),
    feedback: text("feedback"),
    decidedBy: integer("decidedBy").references(() => users.id),
    decidedAt: integer("decidedAt", { mode: "timestamp" }),
    createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type Approval = typeof approvals.$inferSelect;
export type InsertApproval = typeof approvals.$inferInsert;

// ============================================================================
// AGENT MESSAGES (Inter-agent communication)
// ============================================================================

export const agentMessages = sqliteTable("agentMessages", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    fromAgentId: integer("fromAgentId").notNull().references(() => agents.id),
    toAgentId: integer("toAgentId").notNull().references(() => agents.id),
    taskId: integer("taskId").references(() => tasks.id),
    type: text("type", {
        enum: ["question", "handoff", "feedback", "blocker", "qa_result"]
    }).notNull(),
    content: text("content").notNull(),
    response: text("response"),
    status: text("status", {
        enum: ["pending", "answered"]
    }).default("pending").notNull(),
    createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
    answeredAt: integer("answeredAt", { mode: "timestamp" }),
});

export type AgentMessage = typeof agentMessages.$inferSelect;
export type InsertAgentMessage = typeof agentMessages.$inferInsert;

// ============================================================================
// RESEARCH TASKS (On-demand via Perplexity)
// ============================================================================

export const researchTasks = sqliteTable("researchTasks", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    projectId: integer("projectId").notNull().references(() => projects.id),
    topic: text("topic").notNull(),
    query: text("query").notNull(),
    sources: text("sources").default("perplexity").notNull(), // perplexity, linkedin, reddit, web
    results: text("results"), // JSON from Perplexity
    status: text("status", {
        enum: ["pending", "approved", "researching", "complete"]
    }).default("pending").notNull(),
    assignedAgentId: integer("assignedAgentId").references(() => agents.id),
    createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
    completedAt: integer("completedAt", { mode: "timestamp" }),
});

export type ResearchTask = typeof researchTasks.$inferSelect;
export type InsertResearchTask = typeof researchTasks.$inferInsert;

// ============================================================================
// CONTENT ITEMS (Marketing content pipeline)
// ============================================================================

export const contentItems = sqliteTable("contentItems", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    projectId: integer("projectId").notNull().references(() => projects.id),
    type: text("type", {
        enum: ["blog", "social", "docs", "video", "email", "landing_page"]
    }).notNull(),
    title: text("title").notNull(),
    content: text("content"),
    status: text("status", {
        enum: ["draft", "review", "approved", "published", "rejected"]
    }).default("draft").notNull(),
    createdBy: integer("createdBy").references(() => agents.id),
    approvedBy: integer("approvedBy").references(() => users.id),
    publishedAt: integer("publishedAt", { mode: "timestamp" }),
    createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type ContentItem = typeof contentItems.$inferSelect;
export type InsertContentItem = typeof contentItems.$inferInsert;

// ============================================================================
// KNOWLEDGE BASE (Shared context for agents)
// ============================================================================

export const knowledgeBase = sqliteTable("knowledgeBase", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    projectId: integer("projectId").notNull().references(() => projects.id),
    key: text("key").notNull(),
    value: text("value").notNull(), // JSON
    source: text("source").notNull(), // Where this came from
    createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type KnowledgeBase = typeof knowledgeBase.$inferSelect;
export type InsertKnowledgeBase = typeof knowledgeBase.$inferInsert;

// ============================================================================
// RELATIONS
// ============================================================================

export const projectsRelations = relations(projects, ({ one, many }) => ({
    creator: one(users, {
        fields: [projects.createdBy],
        references: [users.id],
    }),
    pipelines: many(pipelines),
    researchTasks: many(researchTasks),
    contentItems: many(contentItems),
    knowledgeBase: many(knowledgeBase),
}));

export const pipelinesRelations = relations(pipelines, ({ one, many }) => ({
    project: one(projects, {
        fields: [pipelines.projectId],
        references: [projects.id],
    }),
    tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
    pipeline: one(pipelines, {
        fields: [tasks.pipelineId],
        references: [pipelines.id],
    }),
    assignedAgent: one(agents, {
        fields: [tasks.assignedAgentId],
        references: [agents.id],
    }),
    messages: many(agentMessages),
}));

export const agentsRelations = relations(agents, ({ one, many }) => ({
    currentTask: one(tasks, {
        fields: [agents.currentTaskId],
        references: [tasks.id],
    }),
    sentMessages: many(agentMessages, { relationName: "sentMessages" }),
    receivedMessages: many(agentMessages, { relationName: "receivedMessages" }),
}));

export const agentMessagesRelations = relations(agentMessages, ({ one }) => ({
    fromAgent: one(agents, {
        fields: [agentMessages.fromAgentId],
        references: [agents.id],
        relationName: "sentMessages",
    }),
    toAgent: one(agents, {
        fields: [agentMessages.toAgentId],
        references: [agents.id],
        relationName: "receivedMessages",
    }),
    task: one(tasks, {
        fields: [agentMessages.taskId],
        references: [tasks.id],
    }),
}));
