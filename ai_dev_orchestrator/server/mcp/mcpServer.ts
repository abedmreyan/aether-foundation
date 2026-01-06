import * as db from "../db";
import { AgentMessageService } from "../services/agentMessages";
import { ContextSummarizer } from "./contextSummarizer";

/**
 * MCP Server for AI Dev Orchestrator
 * Exposes tools that Cursor/Antigravity can call
 */

export interface MCPServerConfig {
    name: string;
    version: string;
    tools: MCPTool[];
}

export interface MCPTool {
    name: string;
    description: string;
    inputSchema: any;
    execute: (args: any) => Promise<any>;
}

/**
 * Get next available task for an agent
 */
async function getNextTask(): Promise<any> {
    // Get pending tasks
    const allAgents = await db.getAllAgents();

    for (const agent of allAgents) {
        const tasks = await db.getTasksByAgent(agent.id);
        const pendingTask = tasks.find(t => t.status === "pending" || t.status === "assigned");

        if (pendingTask) {
            // Build context for this task
            const module = await db.getDb()
                .select()
                .from((await import("../../drizzle/schema-sqlite")).modules)
                .where((await import("drizzle-orm")).eq((await import("../../drizzle/schema-sqlite")).modules.id, pendingTask.moduleId))
                .limit(1);

            if (!module[0]) continue;

            const subsystem = await db.getDb()
                .select()
                .from((await import("../../drizzle/schema-sqlite")).subsystems)
                .where((await import("drizzle-orm")).eq((await import("../../drizzle/schema-sqlite")).subsystems.id, module[0].subsystemId))
                .limit(1);

            if (!subsystem[0]) continue;

            return {
                task: pendingTask,
                agent: agent,
                context: {
                    projectId: subsystem[0].projectId,
                    taskId: pendingTask.id,
                    module: module[0],
                    subsystem: subsystem[0],
                },
            };
        }
    }

    return { message: "No pending tasks available" };
}

/**
 * Complete a task
 */
async function completeTask(args: { taskId: number; result: string; filesChanged?: string[] }): Promise<any> {
    await db.updateTaskStatus(args.taskId, "completed", 100);

    // Log the completion
    const task = await db.getTaskById(args.taskId);
    if (task && task.assignedAgentId) {
        await db.logAgentActivity({
            agentId: task.assignedAgentId,
            taskId: args.taskId,
            action: "Task completed via MCP",
            details: args.result,
        });
    }

    return { success: true, taskId: args.taskId };
}

/**
 * Ask another agent a question
 */
async function askAgent(args: { agentRole: string; question: string; taskId?: number }): Promise<any> {
    // Get current agent (would be passed in real implementation)
    const currentAgent = await db.getAgentByRole("project_manager");
    if (!currentAgent) throw new Error("Current agent not found");

    const targetAgent = await db.getAgentByRole(args.agentRole);
    if (!targetAgent) throw new Error(`Agent with role ${args.agentRole} not found`);

    const messageId = await AgentMessageService.sendMessage(
        currentAgent.id,
        targetAgent.id,
        {
            taskId: args.taskId,
            type: "question",
            content: args.question,
        }
    );

    return {
        success: true,
        messageId,
        status: "pending",
        message: `Question sent to ${args.agentRole} agent`,
    };
}

/**
 * Report progress on a task
 */
async function reportProgress(args: { taskId: number; percentage: number; message: string }): Promise<any> {
    await db.updateTaskStatus(args.taskId, "in_progress", args.percentage);

    const task = await db.getTaskById(args.taskId);
    if (task && task.assignedAgentId) {
        await db.logAgentActivity({
            agentId: task.assignedAgentId,
            taskId: args.taskId,
            action: "Progress update",
            details: `${args.percentage}%: ${args.message}`,
        });

        // Create checkpoint at 25%, 50%, 75%
        if (args.percentage === 25 || args.percentage === 50 || args.percentage === 75) {
            // Would call ContextSummarizer.checkpoint here
        }
    }

    return { success: true, taskId: args.taskId, percentage: args.percentage };
}

/**
 * Get full context for a task
 */
async function getContext(args: { taskId: number }): Promise<any> {
    const task = await db.getTaskById(args.taskId);
    if (!task) throw new Error(`Task ${args.taskId} not found`);

    const module = await db.getDb()
        .select()
        .from((await import("../../drizzle/schema-sqlite")).modules)
        .where((await import("drizzle-orm")).eq((await import("../../drizzle/schema-sqlite")).modules.id, task.moduleId))
        .limit(1);

    if (!module[0]) throw new Error("Module not found");

    const subsystem = await db.getDb()
        .select()
        .from((await import("../../drizzle/schema-sqlite")).subsystems)
        .where((await import("drizzle-orm")).eq((await import("../../drizzle/schema-sqlite")).subsystems.id, module[0].subsystemId))
        .limit(1);

    if (!subsystem[0]) throw new Error("Subsystem not found");

    const project = await db.getProjectById(subsystem[0].projectId);
    if (!project) throw new Error("Project not found");

    return {
        task,
        module: module[0],
        subsystem: subsystem[0],
        project,
    };
}

/**
 * Get pending messages for current agent
 */
async function getMessages(): Promise<any> {
    // Would get current agent from context
    const currentAgent = await db.getAgentByRole("project_manager");
    if (!currentAgent) return { messages: [] };

    const messages = await AgentMessageService.getPendingMessages(currentAgent.id);
    return { messages };
}

/**
 * Respond to a message
 */
async function respondMessage(args: { messageId: number; response: string }): Promise<any> {
    const currentAgent = await db.getAgentByRole("project_manager");
    if (!currentAgent) throw new Error("Current agent not found");

    await AgentMessageService.respondToMessage(args.messageId, currentAgent.id, args.response);
    return { success: true, messageId: args.messageId };
}

/**
 * MCP Server Configuration
 */
export const mcpServerConfig: MCPServerConfig = {
    name: "ai-dev-orchestrator",
    version: "1.0.0",
    tools: [
        {
            name: "orchestrator_get_next_task",
            description: "Get the next available task from the orchestrator queue",
            inputSchema: {
                type: "object",
                properties: {},
            },
            execute: getNextTask,
        },
        {
            name: "orchestrator_complete_task",
            description: "Mark a task as completed with results",
            inputSchema: {
                type: "object",
                properties: {
                    taskId: { type: "number" },
                    result: { type: "string" },
                    filesChanged: { type: "array", items: { type: "string" } },
                },
                required: ["taskId", "result"],
            },
            execute: completeTask,
        },
        {
            name: "orchestrator_ask_agent",
            description: "Ask another agent for help or clarification",
            inputSchema: {
                type: "object",
                properties: {
                    agentRole: { type: "string" },
                    question: { type: "string" },
                    taskId: { type: "number" },
                },
                required: ["agentRole", "question"],
            },
            execute: askAgent,
        },
        {
            name: "orchestrator_report_progress",
            description: "Report progress on a task",
            inputSchema: {
                type: "object",
                properties: {
                    taskId: { type: "number" },
                    percentage: { type: "number" },
                    message: { type: "string" },
                },
                required: ["taskId", "percentage", "message"],
            },
            execute: reportProgress,
        },
        {
            name: "orchestrator_get_context",
            description: "Get full context for a task including project, module, and requirements",
            inputSchema: {
                type: "object",
                properties: {
                    taskId: { type: "number" },
                },
                required: ["taskId"],
            },
            execute: getContext,
        },
        {
            name: "orchestrator_get_messages",
            description: "Get pending messages for the current agent",
            inputSchema: {
                type: "object",
                properties: {},
            },
            execute: getMessages,
        },
        {
            name: "orchestrator_respond_message",
            description: "Respond to a pending message",
            inputSchema: {
                type: "object",
                properties: {
                    messageId: { type: "number" },
                    response: { type: "string" },
                },
                required: ["messageId", "response"],
            },
            execute: respondMessage,
        },
    ],
};

/**
 * Export MCP server for use in dev-mcp server
 */
export function getMCPServer() {
    return mcpServerConfig;
}
