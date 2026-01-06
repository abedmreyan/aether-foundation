import { invokeLLM } from "../_core/llm";
import * as db from "../db";
import { getTaskExportService } from "../services/taskExport";

export type AgentRole =
    | "project_manager"
    | "research"
    | "architecture"
    | "ui_ux"
    | "frontend"
    | "backend"
    | "devops"
    | "qa";

export interface AgentContext {
    projectId: number;
    taskId?: number;
    projectVision?: string;
    approvedStrategy?: string;
    designSpecs?: string;
    requirements?: string;
    relatedWork?: string;
    projectHistory?: string;
}

export interface AgentMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

export interface AgentAction {
    action: string;
    details?: string;
    mcpToolCalled?: string;
}

/**
 * Base class for Planning-Focused AI agents
 * 
 * These agents NO LONGER execute code directly.
 * Instead, they:
 * 1. Analyze requirements
 * 2. Create implementation plans
 * 3. Generate task specifications
 * 4. Export to .tasks/ for IDE execution
 */
export abstract class BaseAgent {
    protected agentId: number;
    protected name: string;
    protected role: AgentRole;
    protected specialization: string;

    constructor(agentId: number, name: string, role: AgentRole, specialization: string) {
        this.agentId = agentId;
        this.name = name;
        this.role = role;
        this.specialization = specialization;
    }

    /**
     * Get the system prompt for this agent
     */
    protected abstract getSystemPrompt(): string;

    /**
     * Plan a task (NEW - replaces executeTask)
     * 
     * This creates a detailed implementation plan and generates
     * a task specification file for IDE execution
    */
    async planTask(taskId: number, context: AgentContext): Promise<{
        plan: string;
        taskSpecId: string;
    }> {
        try {
            // Update agent status to working
            await db.updateAgentStatus(this.agentId, "working", taskId);
            await this.logActivity(taskId, "Planning task", JSON.stringify(context));

            // Get task details
            const task = await db.getDb().then((db) =>
                db?.select().from(require("../../drizzle/schema").tasks).where(require("drizzle-orm").eq(require("../../drizzle/schema").tasks.id, taskId)).limit(1)
            );

            if (!task || task.length === 0) {
                throw new Error(`Task ${taskId} not found`);
            }

            const taskDetails = task[0];

            // Build context message
            const contextMessage = this.buildContextMessage(context, taskDetails);

            // Use LLM to create implementation plan
            const plan = await this.createImplementationPlan(contextMessage, taskDetails);

            // Generate task specification
            const projectPath = process.env.AETHER_PROJECT_PATH || '/Users/abedmreyan/Desktop/aether_-foundation';
            const exportService = getTaskExportService(projectPath);

            const taskSpec = await exportService.generateTaskSpec(
                context.projectId,
                taskId,
                plan
            );

            // Write to queue directory (pending approval)
            await exportService.writeTaskFile(taskSpec, `task-${taskId}.json`);

            // Update task status to pending approval
            await db.updateTaskStatus(taskId, "assigned"); // Will be approved by user
            await this.logActivity(taskId, "Task plan created", `Spec ID: ${taskSpec.id}`);

            // Update agent status back to idle
            await db.updateAgentStatus(this.agentId, "idle");

            return {
                plan,
                taskSpecId: taskSpec.id,
            };
        } catch (error) {
            // Handle errors
            await db.updateAgentStatus(this.agentId, "blocked", taskId);
            await this.logActivity(taskId, "Planning failed", error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    /**
     * Build a context message from the provided context
     */
    protected buildContextMessage(context: AgentContext, taskDetails: any): string {
        let message = `# Task Context\n\n`;
        message += `**Project ID**: ${context.projectId}\n`;
        message += `**Task ID**: ${context.taskId}\n\n`;

        if (context.projectVision) {
            message += `## Project Vision\n${context.projectVision}\n\n`;
        }

        if (context.approvedStrategy) {
            message += `## Approved Strategy\n${context.approvedStrategy}\n\n`;
        }

        if (context.designSpecs) {
            message += `## Design Specifications\n${context.designSpecs}\n\n`;
        }

        message += `## Task Details\n`;
        message += `**Title**: ${taskDetails.title}\n`;
        message += `**Description**: ${taskDetails.description}\n`;
        message += `**Requirements**: ${taskDetails.requirements}\n\n`;

        if (context.relatedWork) {
            message += `## Related Work\n${context.relatedWork}\n\n`;
        }

        if (context.projectHistory) {
            message += `## Project History\n${context.projectHistory}\n\n`;
        }

        return message;
    }

    /**
     * Create implementation plan using LLM (NEW)
     * 
     * This generates a detailed plan but DOES NOT execute it
     */
    protected async createImplementationPlan(contextMessage: string, taskDetails: any): Promise<string> {
        const planningPrompt = this.getSystemPrompt() + `

IMPORTANT: You are in PLANNING mode. DO NOT execute any code.

Your task is to create a detailed implementation plan that includes:
1. Files that need to be modified
2. Specific changes to make in each file
3. Step-by-step instructions
4. Validation criteria

The plan will be exported to an IDE where another AI agent will execute it.

Focus on clarity and specificity.`;

        const messages: AgentMessage[] = [
            {
                role: "system",
                content: planningPrompt,
            },
            {
                role: "user",
                content: contextMessage + "\n\nCreate a detailed implementation plan.",
            },
        ];

        const response = await invokeLLM({
            messages: messages as any,
        });

        const content = response.choices[0]?.message?.content;
        if (typeof content === "string") {
            return content;
        }
        return "";
    }

    /**
     * Log an activity for this agent
     */
    protected async logActivity(taskId: number | undefined, action: string, details?: string, mcpToolCalled?: string) {
        await db.logAgentActivity({
            agentId: this.agentId,
            taskId,
            action,
            details,
            mcpToolCalled,
        });
    }

    /**
     * Report progress on a task
     */
    async reportProgress(taskId: number, percentage: number, message: string) {
        await db.updateTaskStatus(taskId, "in_progress", percentage);
        await this.logActivity(taskId, `Progress: ${percentage}%`, message);
    }

    /**
     * Report a blocker
     */
    async reportBlocker(taskId: number, reason: string) {
        await db.updateAgentStatus(this.agentId, "blocked", taskId);
        await this.logActivity(taskId, "Blocked", reason);
    }

    /**
     * Get agent information
     */
    getInfo() {
        return {
            id: this.agentId,
            name: this.name,
            role: this.role,
            specialization: this.specialization,
        };
    }
}
