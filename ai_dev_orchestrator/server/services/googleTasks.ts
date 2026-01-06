import { google } from "googleapis";
import * as db from "../db-sqlite";

// Google Tasks OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "your-google-client-id-here";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "your-google-client-secret-here";
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3001/api/google-tasks/callback";

/**
 * Google Tasks Integration Service
 * Syncs orchestrator tasks with Google Tasks for monitoring and approval
 */
export class GoogleTasksService {
    private oauth2Client: any;
    private tasks: any;

    constructor() {
        this.oauth2Client = new google.auth.OAuth2(
            GOOGLE_CLIENT_ID,
            GOOGLE_CLIENT_SECRET,
            REDIRECT_URI
        );

        // Check if we have stored tokens
        const tokens = this.loadTokens();
        if (tokens) {
            this.oauth2Client.setCredentials(tokens);
        }

        this.tasks = google.tasks({ version: "v1", auth: this.oauth2Client });
    }

    /**
     * Load stored tokens from environment or config
     */
    private loadTokens() {
        // For now, return null - will implement token storage later
        // In production, store in database or secure config
        return null;
    }

    /**
     * Save tokens after OAuth flow
     */
    private saveTokens(tokens: any) {
        // TODO: Implement token storage in database
        console.log("Tokens received:", tokens);
    }

    /**
     * Get authorization URL for initial OAuth flow
     */
    getAuthUrl(): string {
        return this.oauth2Client.generateAuthUrl({
            access_type: "offline",
            scope: ["https://www.googleapis.com/auth/tasks"],
        });
    }

    /**
     * Exchange authorization code for tokens
     */
    async authorize(code: string): Promise<void> {
        const { tokens } = await this.oauth2Client.getToken(code);
        this.oauth2Client.setCredentials(tokens);
        this.saveTokens(tokens);
    }

    /**
     * Create a Google Tasks list for a project
     */
    async createTaskList(projectId: number, projectName: string): Promise<string> {
        try {
            const response = await this.tasks.tasklists.insert({
                requestBody: {
                    title: `[Orchestrator] ${projectName}`,
                },
            });

            const listId = response.data.id;

            // Store the task list ID in the project
            await db.getDb()
                .update(db.projects)
                .set({ googleTasksListId: listId })
                .where(db.eq(db.projects.id, projectId));

            return listId;
        } catch (error) {
            console.error("Failed to create Google Tasks list:", error);
            throw error;
        }
    }

    /**
     * Create a Google Task from an orchestrator task
     */
    async createTask(taskId: number, listId: string): Promise<string> {
        try {
            const task = await db.getTaskById(taskId);
            if (!task) throw new Error(`Task ${taskId} not found`);

            const response = await this.tasks.tasks.insert({
                tasklist: listId,
                requestBody: {
                    title: task.title,
                    notes: `${task.description}\n\n**Requirements:**\n${task.requirements}\n\n**Status:** ${task.status}\n**Progress:** ${task.progressPercentage}%`,
                    due: task.completedAt?.toISOString(),
                },
            });

            const googleTaskId = response.data.id;

            // Store the Google Task ID
            await db.getDb()
                .update(db.tasks)
                .set({ googleTaskId })
                .where(db.eq(db.tasks.id, taskId));

            return googleTaskId;
        } catch (error) {
            console.error(`Failed to create Google Task for task ${taskId}:`, error);
            throw error;
        }
    }

    /**
     * Update a Google Task when orchestrator task changes
     */
    async updateTask(taskId: number): Promise<void> {
        try {
            const task = await db.getTaskById(taskId);
            if (!task || !task.googleTaskId) return;

            // Get the project to find the task list
            const module = await db.getDb()
                .select()
                .from(db.modules)
                .where(db.eq(db.modules.id, task.moduleId))
                .limit(1);

            if (!module[0]) return;

            const subsystem = await db.getDb()
                .select()
                .from(db.subsystems)
                .where(db.eq(db.subsystems.id, module[0].subsystemId))
                .limit(1);

            if (!subsystem[0]) return;

            const project = await db.getProjectById(subsystem[0].projectId);
            if (!project || !project.googleTasksListId) return;

            await this.tasks.tasks.update({
                tasklist: project.googleTasksListId,
                task: task.googleTaskId,
                requestBody: {
                    title: task.title,
                    notes: `${task.description}\n\n**Requirements:**\n${task.requirements}\n\n**Status:** ${task.status}\n**Progress:** ${task.progressPercentage}%`,
                    status: task.status === "completed" || task.status === "approved" ? "completed" : "needsAction",
                },
            });
        } catch (error) {
            console.error(`Failed to update Google Task for task ${taskId}:`, error);
        }
    }

    /**
     * Mark Google Task as complete
     */
    async completeTask(taskId: number): Promise<void> {
        try {
            const task = await db.getTaskById(taskId);
            if (!task || !task.googleTaskId) return;

            // Get project's task list
            const module = await db.getDb()
                .select()
                .from(db.modules)
                .where(db.eq(db.modules.id, task.moduleId))
                .limit(1);

            if (!module[0]) return;

            const subsystem = await db.getDb()
                .select()
                .from(db.subsystems)
                .where(db.eq(db.subsystems.id, module[0].subsystemId))
                .limit(1);

            if (!subsystem[0]) return;

            const project = await db.getProjectById(subsystem[0].projectId);
            if (!project || !project.googleTasksListId) return;

            await this.tasks.tasks.update({
                tasklist: project.googleTasksListId,
                task: task.googleTaskId,
                requestBody: {
                    status: "completed",
                },
            });
        } catch (error) {
            console.error(`Failed to complete Google Task for task ${taskId}:`, error);
        }
    }

    /**
     * Sync all tasks for a project
     */
    async syncProjectTasks(projectId: number): Promise<void> {
        const project = await db.getProjectById(projectId);
        if (!project) throw new Error(`Project ${projectId} not found`);

        // Create task list if it doesn't exist
        let listId = project.googleTasksListId;
        if (!listId) {
            listId = await this.createTaskList(projectId, project.name);
        }

        // Get all subsystems and their tasks
        const subsystems = await db.getSubsystemsByProject(projectId);

        for (const subsystem of subsystems) {
            const modules = await db.getModulesBySubsystem(subsystem.id);

            for (const module of modules) {
                const tasks = await db.getTasksByModule(module.id);

                for (const task of tasks) {
                    if (!task.googleTaskId) {
                        // Create new Google Task
                        await this.createTask(task.id, listId);
                    } else {
                        // Update existing Google Task
                        await this.updateTask(task.id);
                    }
                }
            }
        }
    }
}

// Export a singleton instance
export const googleTasksService = new GoogleTasksService();
