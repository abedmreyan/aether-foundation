import * as fs from "fs/promises";
import * as path from "path";
import * as db from "../db-sqlite";
import { AgentContextService } from "./agentContext";

/**
 * File Sync Service
 * Manages .tasks/ bridge folder for IDE synchronization
 */

export interface TaskPromptFile {
    taskId: number;
    title: string;
    description: string;
    requirements?: string;
    context: string;
    agent: string;
    projectPath: string;
}

export interface TaskResultFile {
    taskId: number;
    result: string;
    filesChanged: string[];
    errors?: string[];
}

export class FileSyncService {
    /**
     * Ensure .tasks/ folder structure exists in project
     */
    static async ensureTasksFolder(projectPath: string): Promise<void> {
        const tasksDir = path.join(projectPath, ".tasks");
        const currentDir = path.join(tasksDir, "current");
        const outputDir = path.join(tasksDir, "output");
        const contextDir = path.join(tasksDir, "context");

        await fs.mkdir(tasksDir, { recursive: true });
        await fs.mkdir(currentDir, { recursive: true });
        await fs.mkdir(outputDir, { recursive: true });
        await fs.mkdir(contextDir, { recursive: true });

        // Create README
        const readme = `# .tasks/ Bridge Folder

This folder enables bidirectional communication between the AI Dev Orchestrator and your IDE.

## Structure

- \`current/\` - Active tasks with IDE-ready prompts
- \`output/\` - Task results from IDE agents
- \`context/\` - Synced orchestrator state (agents, pipelines, knowledge)

## Workflow

1. Orchestrator writes \`current/task-{id}.json\` and \`task-{id}.prompt.md\` when task approved
2. IDE agent reads prompt and executes task
3. IDE agent writes results to \`output/task-{id}-result.md\` and \`task-{id}-files.json\`
4. Orchestrator reads results and moves task to QA Review

## Auto-Sync

Run \`node watcher.mjs\` to auto-sync changes between orchestrator and .tasks/ folder.
`;

        await fs.writeFile(path.join(tasksDir, "README.md"), readme);
    }

    /**
     * Write task prompt files when task is approved
     */
    static async writeTaskPrompt(taskId: number): Promise<void> {
        const task = await db.getTaskById(taskId);
        if (!task) {
            throw new Error(`Task ${taskId} not found`);
        }

        const pipeline = await db.getPipelineById(task.pipelineId);
        if (!pipeline) {
            throw new Error(`Pipeline ${task.pipelineId} not found`);
        }

        const project = await db.getProjectById(pipeline.projectId);
        if (!project || !project.localPath) {
            throw new Error(`Project has no local path`);
        }

        await this.ensureTasksFolder(project.localPath);

        // Generate IDE prompt
        const prompt = await AgentContextService.generateIDEPrompt(taskId);

        // Get full context
        const context = await AgentContextService.buildContext(taskId);

        // Create task JSON
        const taskData: TaskPromptFile = {
            taskId: task.id,
            title: task.title,
            description: task.description,
            requirements: task.requirements || undefined,
            context: JSON.stringify(context, null, 2),
            agent: task.suggestedAgentRole || "developer",
            projectPath: project.localPath,
        };

        const currentDir = path.join(project.localPath, ".tasks", "current");

        // Write files
        await fs.writeFile(
            path.join(currentDir, `task-${taskId}.json`),
            JSON.stringify(taskData, null, 2)
        );

        await fs.writeFile(
            path.join(currentDir, `task-${taskId}.prompt.md`),
            prompt
        );

        console.log(`[FileSync] Wrote task ${taskId} to ${currentDir}`);
    }

    /**
     * Read task results from IDE
     */
    static async readTaskResult(taskId: number): Promise<TaskResultFile | null> {
        const task = await db.getTaskById(taskId);
        if (!task) return null;

        const pipeline = await db.getPipelineById(task.pipelineId);
        if (!pipeline) return null;

        const project = await db.getProjectById(pipeline.projectId);
        if (!project || !project.localPath) return null;

        const outputDir = path.join(project.localPath, ".tasks", "output");

        try {
            // Read result markdown
            const resultPath = path.join(outputDir, `task-${taskId}-result.md`);
            const result = await fs.readFile(resultPath, "utf-8");

            // Read files changed JSON
            const filesPath = path.join(outputDir, `task-${taskId}-files.json`);
            let filesChanged: string[] = [];
            try {
                const filesData = await fs.readFile(filesPath, "utf-8");
                filesChanged = JSON.parse(filesData);
            } catch {
                // Files list is optional
            }

            return {
                taskId,
                result,
                filesChanged,
            };
        } catch (error) {
            console.log(`[FileSync] No results yet for task ${taskId}`);
            return null;
        }
    }

    /**
     * Process task completion from IDE
     */
    static async processTaskCompletion(taskId: number): Promise<void> {
        const taskResult = await this.readTaskResult(taskId);
        if (!taskResult) {
            throw new Error(`No results found for task ${taskId}`);
        }

        // Update task with results
        await db.updateTaskResult(
            taskId,
            taskResult.result,
            JSON.stringify(taskResult.filesChanged)
        );

        // Move to QA Review stage
        await db.updateTaskStage(taskId, "QA Review");

        // Clean up current task files
        const task = await db.getTaskById(taskId);
        if (task) {
            const pipeline = await db.getPipelineById(task.pipelineId);
            if (pipeline) {
                const project = await db.getProjectById(pipeline.projectId);
                if (project?.localPath) {
                    const currentDir = path.join(project.localPath, ".tasks", "current");
                    try {
                        await fs.unlink(path.join(currentDir, `task-${taskId}.json`));
                        await fs.unlink(path.join(currentDir, `task-${taskId}.prompt.md`));
                    } catch {
                        // Files may not exist
                    }
                }
            }
        }

        console.log(`[FileSync] Processed completion for task ${taskId}`);
    }

    /**
     * Sync orchestrator context to project
     */
    static async syncContextToProject(projectId: number): Promise<void> {
        const project = await db.getProjectById(projectId);
        if (!project || !project.localPath) return;

        await this.ensureTasksFolder(project.localPath);

        const contextDir = path.join(project.localPath, ".tasks", "context");

        // Write agent roster
        const agents = await db.getAllAgents();
        await fs.writeFile(
            path.join(contextDir, "agents.json"),
            JSON.stringify(agents, null, 2)
        );

        // Write pipelines
        const pipelines = await db.getPipelinesByProject(projectId);
        await fs.writeFile(
            path.join(contextDir, "pipelines.json"),
            JSON.stringify(pipelines, null, 2)
        );

        // Write knowledge base
        const knowledge = await db.getProjectKnowledge(projectId);
        await fs.writeFile(
            path.join(contextDir, "knowledge.json"),
            JSON.stringify(knowledge, null, 2)
        );

        console.log(`[FileSync] Synced context for project ${projectId}`);
    }

    /**
     * Check if task results are available
     */
    static async hasTaskResults(taskId: number): Promise<boolean> {
        const result = await this.readTaskResult(taskId);
        return result !== null;
    }
}
