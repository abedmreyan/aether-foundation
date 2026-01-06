import * as db from "../db-sqlite";

/**
 * Agent Context Service
 * Builds rich context for agents executing tasks
 */

export interface AgentContext {
    task: {
        id: number;
        title: string;
        description: string;
        requirements?: string;
        stage: string;
        suggestedAgentRole?: string;
    };
    relatedTasks: Array<{
        id: number;
        title: string;
        status: string;
        result?: string;
        assignedAgent?: string;
    }>;
    agentMessages: Array<{
        id: number;
        from: string;
        to: string;
        type: string;
        content: string;
        createdAt: Date;
    }>;
    projectContext: {
        name: string;
        description: string;
        localPath?: string;
        techStack?: string[];
        recentChanges?: string[];
    };
    knowledgeBase: Array<{
        key: string;
        value: string;
        source: string;
    }>;
}

export class AgentContextService {
    /**
     * Build complete context for an agent executing a task
     */
    static async buildContext(taskId: number): Promise<AgentContext> {
        const task = await db.getTaskById(taskId);
        if (!task) {
            throw new Error(`Task ${taskId} not found`);
        }

        // Get pipeline and project info
        const pipeline = await db.getPipelineById(task.pipelineId);
        if (!pipeline) {
            throw new Error(`Pipeline ${task.pipelineId} not found`);
        }

        const project = await db.getProjectById(pipeline.projectId);
        if (!project) {
            throw new Error(`Project ${pipeline.projectId} not found`);
        }

        // Get related tasks (same pipeline, completed)
        const allPipelineTasks = await db.getTasksByPipeline(task.pipelineId);
        const relatedTasks = allPipelineTasks
            .filter((t) => t.status === "completed" && t.id !== taskId)
            .slice(-5) // Last 5 completed tasks
            .map((t) => ({
                id: t.id,
                title: t.title,
                status: t.status,
                result: t.result || undefined,
                assignedAgent: t.assignedAgentId
                    ? `Agent #${t.assignedAgentId}`
                    : undefined,
            }));

        // Get agent messages for this task
        const rawMessages = await this.getTaskMessages(taskId);
        const agentMessages = await Promise.all(
            rawMessages.map(async (m) => {
                const fromAgent = await db.getAgentById(m.fromAgentId);
                const toAgent = await db.getAgentById(m.toAgentId);
                return {
                    id: m.id,
                    from: fromAgent?.name || `Agent #${m.fromAgentId}`,
                    to: toAgent?.name || `Agent #${m.toAgentId}`,
                    type: m.type,
                    content: m.content,
                    createdAt: new Date(m.createdAt),
                };
            })
        );

        // Get project knowledge base
        const knowledge = await db.getProjectKnowledge(project.id);

        // Parse tech stack from knowledge
        const techStackEntry = knowledge.find((k) => k.key === "tech_stack");
        const techStack = techStackEntry
            ? JSON.parse(techStackEntry.value)
            : [];

        // Build project context
        const projectContext = {
            name: project.name,
            description: project.description,
            localPath: project.localPath || undefined,
            techStack,
            recentChanges: [], // TODO: Implement file watching
        };

        return {
            task: {
                id: task.id,
                title: task.title,
                description: task.description,
                requirements: task.requirements || undefined,
                stage: task.stage,
                suggestedAgentRole: task.suggestedAgentRole || undefined,
            },
            relatedTasks,
            agentMessages,
            projectContext,
            knowledgeBase: knowledge.map((k) => ({
                key: k.key,
                value: k.value,
                source: k.source,
            })),
        };
    }

    /**
     * Get messages for a specific task
     */
    private static async getTaskMessages(taskId: number) {
        const db_instance = db.getDb();
        const messages = await db_instance
            .select()
            .from(db.agentMessages)
            .where(db.eq(db.agentMessages.taskId, taskId));
        return messages;
    }

    /**
     * Generate a markdown summary of context for agents
     */
    static async generateContextMarkdown(taskId: number): Promise<string> {
        const context = await this.buildContext(taskId);

        let md = `# Task Context: ${context.task.title}\n\n`;

        // Task details
        md += `## Task Details\n\n`;
        md += `**ID:** ${context.task.id}\n`;
        md += `**Stage:** ${context.task.stage}\n`;
        if (context.task.suggestedAgentRole) {
            md += `**Suggested Agent:** ${context.task.suggestedAgentRole}\n`;
        }
        md += `\n**Description:**\n${context.task.description}\n\n`;
        if (context.task.requirements) {
            md += `**Requirements:**\n${context.task.requirements}\n\n`;
        }

        // Project context
        md += `## Project: ${context.projectContext.name}\n\n`;
        md += `${context.projectContext.description}\n\n`;
        if (context.projectContext.techStack.length > 0) {
            md += `**Tech Stack:** ${context.projectContext.techStack.join(", ")}\n\n`;
        }
        if (context.projectContext.localPath) {
            md += `**Local Path:** \`${context.projectContext.localPath}\`\n\n`;
        }

        // Related work
        if (context.relatedTasks.length > 0) {
            md += `## Related Completed Tasks\n\n`;
            for (const task of context.relatedTasks) {
                md += `### Task #${task.id}: ${task.title}\n`;
                md += `**Status:** ${task.status}\n`;
                if (task.assignedAgent) {
                    md += `**Agent:** ${task.assignedAgent}\n`;
                }
                if (task.result) {
                    md += `**Result:** ${task.result}\n`;
                }
                md += `\n`;
            }
        }

        // Agent messages
        if (context.agentMessages.length > 0) {
            md += `## Agent Messages\n\n`;
            for (const msg of context.agentMessages) {
                md += `**From ${msg.from} to ${msg.to}** (${msg.type}):\n`;
                md += `> ${msg.content}\n\n`;
            }
        }

        // Knowledge base highlights
        const readme = context.knowledgeBase.find((k) => k.key === "readme");
        if (readme) {
            md += `## README\n\n`;
            md += `${readme.value.substring(0, 500)}...\n\n`;
        }

        return md;
    }

    /**
     * Create a prompt for IDE agent
     */
    static async generateIDEPrompt(taskId: number): Promise<string> {
        const context = await this.buildContext(taskId);

        let prompt = `# Task #${context.task.id}: ${context.task.title}\n\n`;

        if (context.task.suggestedAgentRole) {
            prompt += `## Assigned To: @${context.task.suggestedAgentRole}\n\n`;
        }

        prompt += `## Requirements\n`;
        if (context.task.requirements) {
            prompt += `${context.task.requirements}\n\n`;
        } else {
            prompt += `${context.task.description}\n\n`;
        }

        // Context from related work
        if (context.relatedTasks.length > 0) {
            prompt += `## Context from Related Work\n\n`;
            for (const task of context.relatedTasks.slice(0, 3)) {
                prompt += `- **Task #${task.id}** (${task.status}): ${task.title}\n`;
                if (task.result) {
                    prompt += `  - Result: ${task.result}\n`;
                }
            }
            prompt += `\n`;
        }

        // Agent messages
        if (context.agentMessages.length > 0) {
            prompt += `## Messages\n\n`;
            for (const msg of context.agentMessages) {
                prompt += `**${msg.from}:** ${msg.content}\n\n`;
            }
        }

        // Project info
        prompt += `## Project Context\n\n`;
        prompt += `**Name:** ${context.projectContext.name}\n`;
        if (context.projectContext.techStack.length > 0) {
            prompt += `**Tech Stack:** ${context.projectContext.techStack.join(", ")}\n`;
        }
        if (context.projectContext.localPath) {
            prompt += `**Path:** \`${context.projectContext.localPath}\`\n`;
        }
        prompt += `\n`;

        // Instructions
        prompt += `## On Completion\n\n`;
        prompt += `1. Write result summary to \`.tasks/output/task-${context.task.id}-result.md\`\n`;
        prompt += `2. List changed files in \`.tasks/output/task-${context.task.id}-files.json\`\n`;
        prompt += `3. Task will auto-move to QA Review stage\n`;

        return prompt;
    }
}
