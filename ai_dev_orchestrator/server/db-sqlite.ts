import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and, desc, asc } from "drizzle-orm";

// Re-export for external use
export { eq, and, desc, asc } from "drizzle-orm";
import {
    users, InsertUser,
    projects, InsertProject,
    pipelines, InsertPipeline,
    subsystems, InsertSubsystem,
    modules, InsertModule,
    agents, InsertAgent,
    tasks, InsertTask,
    approvals, InsertApproval,
    agentMessages, InsertAgentMessage,
    researchTasks, InsertResearchTask,
    contentItems, InsertContentItem,
    knowledgeBase, InsertKnowledgeBase,
} from "../drizzle/schema-sqlite";
import path from "path";
import fs from "fs";

// Re-export schema tables
export { users, projects, pipelines, subsystems, modules, agents, tasks, approvals, agentMessages, researchTasks, contentItems, knowledgeBase } from "../drizzle/schema-sqlite";

// Database file location
const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "orchestrator.db");

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
    if (_db) return _db;
    const sqlite = new Database(DB_FILE);
    sqlite.pragma("journal_mode = WAL");
    _db = drizzle(sqlite);
    return _db;
}

// ============================================================================
// USER OPERATIONS
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
    const db = getDb();
    const existing = await db.select().from(users).where(eq(users.openId, user.openId)).limit(1);
    if (existing.length > 0) {
        await db.update(users).set({
            name: user.name ?? existing[0].name,
            email: user.email ?? existing[0].email,
            lastSignedIn: new Date(),
            updatedAt: new Date(),
        }).where(eq(users.openId, user.openId));
    } else {
        await db.insert(users).values(user);
    }
}

export async function getUserByOpenId(openId: string) {
    const db = getDb();
    const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
    return result[0] ?? null;
}

// ============================================================================
// PROJECT OPERATIONS
// ============================================================================

export async function createProject(project: InsertProject) {
    const db = getDb();
    const result = await db.insert(projects).values(project).returning();
    const projectId = result[0].id;

    // Create default pipelines for the project
    const defaultPipelines = [
        { name: "Development", type: "development" as const, stages: JSON.stringify(["Backlog", "Approved", "In Progress", "QA Review", "Done"]) },
        { name: "Marketing", type: "marketing" as const, stages: JSON.stringify(["Ideas", "Approved", "In Progress", "Review", "Published"]) },
        { name: "Research", type: "research" as const, stages: JSON.stringify(["Requests", "Approved", "Researching", "Complete"]) },
    ];

    for (const p of defaultPipelines) {
        await db.insert(pipelines).values({ ...p, projectId });
    }

    return projectId;
}

export async function getProjectById(projectId: number) {
    const db = getDb();
    const result = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
    return result[0] ?? null;
}

export async function getAllProjects() {
    const db = getDb();
    return db.select().from(projects).orderBy(desc(projects.createdAt));
}

export async function updateProjectStatus(projectId: number, status: string) {
    const db = getDb();
    await db.update(projects).set({ status: status as any, updatedAt: new Date() }).where(eq(projects.id, projectId));
}

// ============================================================================
// PIPELINE OPERATIONS
// ============================================================================

export async function getPipelinesByProject(projectId: number) {
    const db = getDb();
    return db.select().from(pipelines).where(eq(pipelines.projectId, projectId));
}

export async function getPipelineById(pipelineId: number) {
    const db = getDb();
    const result = await db.select().from(pipelines).where(eq(pipelines.id, pipelineId)).limit(1);
    return result[0] ?? null;
}

// ============================================================================
// AGENT OPERATIONS
// ============================================================================

export async function createAgent(agent: InsertAgent) {
    const db = getDb();
    const result = await db.insert(agents).values(agent).returning();
    return result[0].id;
}

export async function getAllAgents() {
    const db = getDb();
    return db.select().from(agents).orderBy(agents.department, agents.name);
}

export async function getAgentsByDepartment(department: string) {
    const db = getDb();
    return db.select().from(agents).where(eq(agents.department, department as any));
}

export async function getAgentByRole(role: string) {
    const db = getDb();
    const result = await db.select().from(agents).where(eq(agents.role, role as any)).limit(1);
    return result[0] ?? null;
}

export async function updateAgentStatus(agentId: number, status: string, currentTaskId?: number) {
    const db = getDb();
    await db.update(agents).set({
        status: status as any,
        currentTaskId: currentTaskId ?? null,
        updatedAt: new Date(),
    }).where(eq(agents.id, agentId));
}

export async function getAgentById(agentId: number) {
    const db = getDb();
    const result = await db.select().from(agents).where(eq(agents.id, agentId)).limit(1);
    return result[0] ?? null;
}

// ============================================================================
// TASK OPERATIONS
// ============================================================================

export async function createTask(task: InsertTask) {
    const db = getDb();
    const result = await db.insert(tasks).values(task).returning();
    return result[0].id;
}

export async function getTasksByPipeline(pipelineId: number) {
    const db = getDb();
    return db.select().from(tasks).where(eq(tasks.pipelineId, pipelineId)).orderBy(asc(tasks.queueOrder));
}

export async function getTasksByStage(pipelineId: number, stage: string) {
    const db = getDb();
    return db.select().from(tasks)
        .where(and(eq(tasks.pipelineId, pipelineId), eq(tasks.stage, stage)))
        .orderBy(asc(tasks.queueOrder));
}

export async function getPendingApprovalTasks(projectId: number) {
    const db = getDb();
    // Get all pipelines for this project, then get pending tasks
    const projectPipelines = await getPipelinesByProject(projectId);
    const pipelineIds = projectPipelines.map(p => p.id);

    if (pipelineIds.length === 0) return [];

    const allTasks = [];
    for (const pId of pipelineIds) {
        const pTasks = await db.select().from(tasks)
            .where(and(eq(tasks.pipelineId, pId), eq(tasks.stage, "Backlog")))
            .orderBy(asc(tasks.queueOrder));
        allTasks.push(...pTasks);
    }
    return allTasks;
}

export async function updateTaskStage(taskId: number, stage: string, queueOrder?: number) {
    const db = getDb();
    const updates: any = { stage, updatedAt: new Date() };
    if (queueOrder !== undefined) updates.queueOrder = queueOrder;
    if (stage === "Approved") updates.status = "approved";
    if (stage === "In Progress") updates.status = "in_progress";
    if (stage === "QA Review") updates.status = "review";
    if (stage === "Done") updates.status = "completed";
    await db.update(tasks).set(updates).where(eq(tasks.id, taskId));
}

export async function updateTaskOrder(taskId: number, queueOrder: number) {
    const db = getDb();
    await db.update(tasks).set({ queueOrder, updatedAt: new Date() }).where(eq(tasks.id, taskId));
}

export async function completeTask(taskId: number, result: string, filesChanged: string[]) {
    const db = getDb();
    await db.update(tasks).set({
        result,
        filesChanged: JSON.stringify(filesChanged),
        stage: "QA Review",
        status: "review",
        updatedAt: new Date(),
    }).where(eq(tasks.id, taskId));
}

export async function approveTask(taskId: number) {
    const db = getDb();
    await db.update(tasks).set({
        stage: "Done",
        status: "completed",
        completedAt: new Date(),
        updatedAt: new Date(),
    }).where(eq(tasks.id, taskId));
}

export async function getTaskById(taskId: number) {
    const db = getDb();
    const result = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
    return result[0] ?? null;
}

// ============================================================================
// APPROVAL OPERATIONS
// ============================================================================

export async function createApproval(approval: InsertApproval) {
    const db = getDb();
    await db.insert(approvals).values(approval);
}

export async function getPendingApprovals() {
    const db = getDb();
    return db.select().from(approvals).where(eq(approvals.status, "pending")).orderBy(desc(approvals.createdAt));
}

export async function updateApprovalStatus(approvalId: number, status: string, decidedBy: number, feedback?: string) {
    const db = getDb();
    await db.update(approvals).set({
        status: status as any,
        decidedBy,
        feedback: feedback ?? null,
        decidedAt: new Date(),
    }).where(eq(approvals.id, approvalId));
}

// ============================================================================
// AGENT MESSAGE OPERATIONS
// ============================================================================

export async function createAgentMessage(message: InsertAgentMessage) {
    const db = getDb();
    const result = await db.insert(agentMessages).values(message).returning();
    return result[0].id;
}

export async function getMessagesForAgent(agentId: number) {
    const db = getDb();
    return db.select().from(agentMessages)
        .where(and(eq(agentMessages.toAgentId, agentId), eq(agentMessages.status, "pending")))
        .orderBy(desc(agentMessages.createdAt));
}

export async function respondToMessage(messageId: number, response: string) {
    const db = getDb();
    await db.update(agentMessages).set({
        response,
        status: "answered",
        answeredAt: new Date(),
    }).where(eq(agentMessages.id, messageId));
}

// ============================================================================
// RESEARCH TASK OPERATIONS
// ============================================================================

export async function createResearchTask(research: InsertResearchTask) {
    const db = getDb();
    const result = await db.insert(researchTasks).values(research).returning();
    return result[0].id;
}

export async function getResearchTasksByProject(projectId: number) {
    const db = getDb();
    return db.select().from(researchTasks).where(eq(researchTasks.projectId, projectId)).orderBy(desc(researchTasks.createdAt));
}

export async function updateResearchTaskStatus(researchId: number, status: string, results?: string) {
    const db = getDb();
    const updates: any = { status: status as any };
    if (results) updates.results = results;
    if (status === "complete") updates.completedAt = new Date();
    await db.update(researchTasks).set(updates).where(eq(researchTasks.id, researchId));
}

// ============================================================================
// CONTENT ITEM OPERATIONS
// ============================================================================

export async function createContentItem(content: InsertContentItem) {
    const db = getDb();
    const result = await db.insert(contentItems).values(content).returning();
    return result[0].id;
}

export async function getContentItemsByProject(projectId: number) {
    const db = getDb();
    return db.select().from(contentItems).where(eq(contentItems.projectId, projectId)).orderBy(desc(contentItems.createdAt));
}

export async function updateContentItemStatus(contentId: number, status: string, approvedBy?: number) {
    const db = getDb();
    const updates: any = { status: status as any, updatedAt: new Date() };
    if (approvedBy) updates.approvedBy = approvedBy;
    if (status === "published") updates.publishedAt = new Date();
    await db.update(contentItems).set(updates).where(eq(contentItems.id, contentId));
}

// ============================================================================
// KNOWLEDGE BASE OPERATIONS
// ============================================================================

export async function addKnowledge(knowledge: InsertKnowledgeBase) {
    const db = getDb();
    await db.insert(knowledgeBase).values(knowledge);
}

export async function getProjectKnowledge(projectId: number) {
    const db = getDb();
    return db.select().from(knowledgeBase).where(eq(knowledgeBase.projectId, projectId)).orderBy(desc(knowledgeBase.createdAt));
}
