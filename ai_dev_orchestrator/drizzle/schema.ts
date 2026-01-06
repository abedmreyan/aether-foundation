import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, bigint } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
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
 * Projects table - top level entity for each development project
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  status: mysqlEnum("status", [
    "ideation",
    "strategy_review",
    "design",
    "development",
    "testing",
    "deployed"
  ]).default("ideation").notNull(),
  createdBy: int("createdBy").notNull().references(() => users.id),
  aiPmId: int("aiPmId"),
  strategyDocUrl: text("strategyDocUrl"),
  architectureDocUrl: text("architectureDocUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Project attachments table - stores files uploaded with projects
 */
export const projectAttachments = mysqlTable("projectAttachments", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileSize: int("fileSize").notNull(), // in bytes
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  fileKey: text("fileKey").notNull(), // S3 key
  fileUrl: text("fileUrl").notNull(), // S3 URL
  uploadedBy: int("uploadedBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProjectAttachment = typeof projectAttachments.$inferSelect;
export type InsertProjectAttachment = typeof projectAttachments.$inferInsert;

/**
 * Proposals table - tracks AI PM proposals for strategy, design, and task assignments
 */
export const proposals = mysqlTable("proposals", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id),
  proposalType: mysqlEnum("proposalType", [
    "strategy",
    "design",
    "task_assignment"
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(), // JSON string with proposal details
  status: mysqlEnum("status", [
    "pending_review",
    "approved",
    "rejected",
    "revised"
  ]).default("pending_review").notNull(),
  createdBy: int("createdBy").notNull().references(() => agents.id),
  reviewedBy: int("reviewedBy").references(() => users.id),
  feedback: text("feedback"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  reviewedAt: timestamp("reviewedAt"),
});

export type Proposal = typeof proposals.$inferSelect;
export type InsertProposal = typeof proposals.$inferInsert;

/**
 * Subsystems table - major functional areas within a project
 */
export const subsystems = mysqlTable("subsystems", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  status: mysqlEnum("status", [
    "planned",
    "designing",
    "in_development",
    "testing",
    "deployed"
  ]).default("planned").notNull(),
  ownerAgentId: int("ownerAgentId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subsystem = typeof subsystems.$inferSelect;
export type InsertSubsystem = typeof subsystems.$inferInsert;

/**
 * Modules table - smaller components within subsystems
 */
export const modules = mysqlTable("modules", {
  id: int("id").autoincrement().primaryKey(),
  subsystemId: int("subsystemId").notNull().references(() => subsystems.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  status: mysqlEnum("status", [
    "planned",
    "designing",
    "in_development",
    "testing",
    "deployed"
  ]).default("planned").notNull(),
  ownerAgentId: int("ownerAgentId"),
  designDocUrl: text("designDocUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Module = typeof modules.$inferSelect;
export type InsertModule = typeof modules.$inferInsert;

/**
 * Tasks table - individual units of work
 */
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  moduleId: int("moduleId").notNull().references(() => modules.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  requirements: text("requirements").notNull(),
  status: mysqlEnum("status", [
    "pending",
    "assigned",
    "in_progress",
    "completed",
    "approved",
    "blocked"
  ]).default("pending").notNull(),
  assignedAgentId: int("assignedAgentId").references(() => agents.id),
  progressPercentage: int("progressPercentage").default(0).notNull(),
  blockerReason: text("blockerReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

/**
 * Task dependencies table - tracks dependencies between tasks
 */
export const taskDependencies = mysqlTable("taskDependencies", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull().references(() => tasks.id),
  dependsOnTaskId: int("dependsOnTaskId").notNull().references(() => tasks.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TaskDependency = typeof taskDependencies.$inferSelect;
export type InsertTaskDependency = typeof taskDependencies.$inferInsert;

/**
 * Agents table - AI agents in the system
 */
export const agents = mysqlTable("agents", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  role: mysqlEnum("role", [
    "project_manager",
    "research",
    "architecture",
    "ui_ux",
    "frontend",
    "backend",
    "devops",
    "qa"
  ]).notNull(),
  specialization: text("specialization").notNull(),
  status: mysqlEnum("status", [
    "idle",
    "working",
    "blocked"
  ]).default("idle").notNull(),
  currentTaskId: int("currentTaskId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = typeof agents.$inferInsert;

/**
 * Agent activity logs - tracks real-time agent actions
 */
export const agentActivityLogs = mysqlTable("agentActivityLogs", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull().references(() => agents.id),
  taskId: int("taskId").references(() => tasks.id),
  action: varchar("action", { length: 255 }).notNull(),
  details: text("details"), // JSON string with action details
  mcpToolCalled: varchar("mcpToolCalled", { length: 255 }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type AgentActivityLog = typeof agentActivityLogs.$inferSelect;
export type InsertAgentActivityLog = typeof agentActivityLogs.$inferInsert;

/**
 * Approvals table - tracks product owner approvals
 */
export const approvals = mysqlTable("approvals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  entityType: mysqlEnum("entityType", [
    "proposal",
    "task",
    "deliverable"
  ]).notNull(),
  entityId: int("entityId").notNull(),
  status: mysqlEnum("status", [
    "approved",
    "rejected",
    "pending_revision"
  ]).notNull(),
  comments: text("comments"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Approval = typeof approvals.$inferSelect;
export type InsertApproval = typeof approvals.$inferInsert;

/**
 * Knowledge base table - stores project context and history
 */
export const knowledgeBase = mysqlTable("knowledgeBase", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id),
  key: varchar("key", { length: 255 }).notNull(),
  value: text("value").notNull(), // JSON string
  source: varchar("source", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type KnowledgeBase = typeof knowledgeBase.$inferSelect;
export type InsertKnowledgeBase = typeof knowledgeBase.$inferInsert;

/**
 * Deliverables table - tracks artifacts produced by agents
 */
export const deliverables = mysqlTable("deliverables", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull().references(() => tasks.id),
  agentId: int("agentId").notNull().references(() => agents.id),
  type: varchar("type", { length: 100 }).notNull(), // e.g., "code", "document", "design"
  name: varchar("name", { length: 255 }).notNull(),
  url: text("url").notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Deliverable = typeof deliverables.$inferSelect;
export type InsertDeliverable = typeof deliverables.$inferInsert;

// Relations
export const projectsRelations = relations(projects, ({ one, many }) => ({
  creator: one(users, {
    fields: [projects.createdBy],
    references: [users.id],
  }),
  aiPm: one(agents, {
    fields: [projects.aiPmId],
    references: [agents.id],
  }),
  subsystems: many(subsystems),
  proposals: many(proposals),
  knowledgeBase: many(knowledgeBase),
}));

export const subsystemsRelations = relations(subsystems, ({ one, many }) => ({
  project: one(projects, {
    fields: [subsystems.projectId],
    references: [projects.id],
  }),
  ownerAgent: one(agents, {
    fields: [subsystems.ownerAgentId],
    references: [agents.id],
  }),
  modules: many(modules),
}));

export const modulesRelations = relations(modules, ({ one, many }) => ({
  subsystem: one(subsystems, {
    fields: [modules.subsystemId],
    references: [subsystems.id],
  }),
  ownerAgent: one(agents, {
    fields: [modules.ownerAgentId],
    references: [agents.id],
  }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  module: one(modules, {
    fields: [tasks.moduleId],
    references: [modules.id],
  }),
  assignedAgent: one(agents, {
    fields: [tasks.assignedAgentId],
    references: [agents.id],
  }),
  dependencies: many(taskDependencies, { relationName: "taskDependencies" }),
  dependents: many(taskDependencies, { relationName: "dependentTasks" }),
  activityLogs: many(agentActivityLogs),
  deliverables: many(deliverables),
}));

export const agentsRelations = relations(agents, ({ one, many }) => ({
  currentTask: one(tasks, {
    fields: [agents.currentTaskId],
    references: [tasks.id],
  }),
  activityLogs: many(agentActivityLogs),
  deliverables: many(deliverables),
}));
