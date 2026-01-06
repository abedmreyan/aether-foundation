import fs from 'fs/promises';
import path from 'path';
import * as db from '../db';

/**
 * Task Export Service
 * 
 * Generates task specification files for IDE agent consumption
 */

export interface TaskSpecification {
    id: string;
    title: string;
    status: 'pending_approval' | 'approved' | 'in_progress' | 'completed' | 'blocked' | 'rejected';
    createdAt: string;
    priority: 'high' | 'medium' | 'low';

    agent: {
        role: string;
        persona: string;
    };

    context: {
        project: string;
        workflows: string[];
        docs: string[];
        relatedFiles: string[];
    };

    implementation: {
        summary: string;
        steps: Array<{
            step: number;
            action: string;
            file: string;
            location?: string;
            description: string;
        }>;
        validation: {
            commands: string[];
            criteria: string[];
        };
    };

    research?: {
        summary: string;
        sources: string[];
    };

    notes?: string;
}

/**
 * Task Export Service Class
 */
export class TaskExportService {
    private projectPath: string;
    private tasksDir: string;

    constructor(projectPath: string) {
        this.projectPath = projectPath;
        this.tasksDir = path.join(projectPath, '.tasks');
    }

    /**
     * Generate a task specification from project data
     */
    async generateTaskSpec(
        projectId: number,
        taskId: number,
        researchSummary?: string
    ): Promise<TaskSpecification> {
        // Get task details
        const taskResult = await db.getDb().then((database) =>
            database?.select().from(require('../../drizzle/schema').tasks)
                .where(require('drizzle-orm').eq(require('../../drizzle/schema').tasks.id, taskId))
                .limit(1)
        );

        if (!taskResult || taskResult.length === 0) {
            throw new Error(`Task ${taskId} not found`);
        }

        const task = taskResult[0];

        // Get assigned agent
        let agentRole = 'general';
        let agentPersona = '.cursor/agents/coordinator.md';

        if (task.assignedAgentId) {
            const agent = await db.getAgentById(task.assignedAgentId);
            if (agent) {
                agentRole = agent.role;
                agentPersona = this.mapAgentRoleToPersona(agent.role);
            }
        }

        // Get project info
        const project = await db.getProjectById(projectId);
        const projectName = project?.name || 'Unknown Project';

        // Get module and subsystem info
        const moduleResult = await db.getDb().then((database) =>
            database?.select().from(require('../../drizzle/schema').modules)
                .where(require('drizzle-orm').eq(require('../../drizzle/schema').modules.id, task.moduleId))
                .limit(1)
        );

        const module = moduleResult?.[0];

        // Build context
        const context = await this.buildTaskContext(projectId, taskId, agentRole);

        // Parse task details into implementation steps
        const steps = this.parseImplementationSteps(task.description, task.requirements);

        // Generate task spec
        const spec: TaskSpecification = {
            id: `task-${taskId}`,
            title: task.title,
            status: 'pending_approval',
            createdAt: new Date().toISOString(),
            priority: 'medium',

            agent: {
                role: agentRole,
                persona: agentPersona,
            },

            context: {
                project: projectName,
                workflows: context.workflows,
                docs: context.docs,
                relatedFiles: context.relatedFiles,
            },

            implementation: {
                summary: task.description,
                steps: steps,
                validation: {
                    commands: ['npm run build'],
                    criteria: ['Build passes without errors'],
                },
            },

            notes: `Generated from orchestrator task ${taskId}`,
        };

        // Add research if provided
        if (researchSummary) {
            spec.research = {
                summary: researchSummary,
                sources: ['AI Research via Perplexity'],
            };
        }

        return spec;
    }

    /**
     * Write task spec to file system
     */
    async writeTaskFile(spec: TaskSpecification, filename?: string): Promise<string> {
        const targetFile = filename || 'current-task.json';
        const filePath = path.join(this.tasksDir, 'queue', targetFile);

        // Ensure directory exists
        await fs.mkdir(path.dirname(filePath), { recursive: true });

        // Write JSON file
        await fs.writeFile(filePath, JSON.stringify(spec, null, 2), 'utf-8');

        // Also write human-readable markdown
        const mdPath = filePath.replace('.json', '.md');
        const markdown = this.generateMarkdown(spec);
        await fs.writeFile(mdPath, markdown, 'utf-8');

        return filePath;
    }

    /**
     * Approve a task and move to current
     */
    async approveTask(taskId: string): Promise<void> {
        const queuePath = path.join(this.tasksDir, 'queue', `${taskId}.json`);
        const currentPath = path.join(this.tasksDir, 'current-task.json');

        // Read task
        const content = await fs.readFile(queuePath, 'utf-8');
        const spec: TaskSpecification = JSON.parse(content);

        // Update status
        spec.status = 'approved';

        // Write to current-task.json
        await fs.writeFile(currentPath, JSON.stringify(spec, null, 2), 'utf-8');

        // Also write markdown
        const mdPath = currentPath.replace('.json', '.md');
        const markdown = this.generateMarkdown(spec);
        await fs.writeFile(mdPath, markdown, 'utf-8');
    }

    /**
     * Map agent role to persona file
     */
    private mapAgentRoleToPersona(role: string): string {
        const mapping: Record<string, string> = {
            'frontend': '.cursor/agents/frontend.md',
            'backend': '.cursor/agents/services.md',
            'architecture': '.cursor/agents/architect.md',
            'ui_ux': '.cursor/agents/ux-designer.md',
            'devops': '.cursor/agents/devops.md',
            'qa': '.cursor/agents/qa.md',
            'research': '.cursor/agents/researcher.md',
            'pipeline': '.cursor/agents/pipeline.md',
        };

        return mapping[role] || '.cursor/agents/coordinator.md';
    }

    /**
     * Build context for task
     */
    private async buildTaskContext(
        projectId: number,
        taskId: number,
        agentRole: string
    ): Promise<{
        workflows: string[];
        docs: string[];
        relatedFiles: string[];
    }> {
        const context = {
            workflows: [] as string[],
            docs: ['.agent/context.md', '.agent/conventions.md'],
            relatedFiles: [] as string[],
        };

        // Add role-specific workflows
        if (agentRole === 'pipeline') {
            context.workflows.push('.agent/workflows/add-pipeline-field.md');
            context.relatedFiles.push('services/platformDatabase.ts', 'types/pipeline.ts');
        } else if (agentRole === 'frontend') {
            context.workflows.push('.agent/workflows/add-component.md');
            context.relatedFiles.push('components/');
        }

        return context;
    }

    /**
     * Parse task description into implementation steps
     */
    private parseImplementationSteps(description: string, requirements: string): Array<{
        step: number;
        action: string;
        file: string;
        description: string;
    }> {
        // Simple parsing - in production, use LLM to generate detailed steps
        return [
            {
                step: 1,
                action: 'Implement feature',
                file: 'Determined by agent',
                description: description,
            },
        ];
    }

    /**
     * Generate markdown version of task spec
     */
    private generateMarkdown(spec: TaskSpecification): string {
        let md = `# Task: ${spec.title}\n\n`;
        md += `**ID:** ${spec.id}  \n`;
        md += `**Status:** ${this.getStatusEmoji(spec.status)} ${spec.status}  \n`;
        md += `**Agent:** ${spec.agent.role}  \n`;
        md += `**Priority:** ${spec.priority}  \n`;
        md += `**Created:** ${spec.createdAt}  \n\n`;

        md += `---\n\n`;

        md += `## Context Files\n\n`;
        md += `Load these before starting:\n`;
        spec.context.workflows.forEach(w => md += `- @${w}\n`);
        spec.context.docs.forEach(d => md += `- @${d}\n`);
        md += `\n`;

        md += `## Files to Edit\n\n`;
        spec.context.relatedFiles.forEach(f => md += `- \`${f}\`\n`);
        md += `\n`;

        md += `---\n\n`;

        if (spec.research) {
            md += `## Background Research\n\n`;
            md += `${spec.research.summary}\n\n`;
            md += `**Sources:** ${spec.research.sources.join(', ')}\n\n`;
            md += `---\n\n`;
        }

        md += `## Implementation Steps\n\n`;
        spec.implementation.steps.forEach(step => {
            md += `### Step ${step.step}: ${step.action}\n\n`;
            md += `**File:** \`${step.file}\`\n\n`;
            if (step.location) {
                md += `**Location:** ${step.location}\n\n`;
            }
            md += `**Description:** ${step.description}\n\n`;
            md += `---\n\n`;
        });

        md += `## Validation\n\n`;
        md += `Run these commands:\n\`\`\`bash\n`;
        spec.implementation.validation.commands.forEach(cmd => md += `${cmd}\n`);
        md += `\`\`\`\n\n`;
        md += `**Criteria:**\n`;
        spec.implementation.validation.criteria.forEach(c => md += `- ✓ ${c}\n`);
        md += `\n`;

        if (spec.notes) {
            md += `---\n\n`;
            md += `## Notes\n\n${spec.notes}\n`;
        }

        return md;
    }

    /**
     * Get status emoji
     */
    private getStatusEmoji(status: string): string {
        const emojis: Record<string, string> = {
            'pending_approval': '🟡',
            'approved': '🟢',
            'in_progress': '🔵',
            'completed': '✅',
            'blocked': '🔴',
            'rejected': '❌',
        };
        return emojis[status] || '⚪';
    }
}

/**
 * Get task export service instance
 */
export function getTaskExportService(projectPath: string): TaskExportService {
    return new TaskExportService(projectPath);
}
