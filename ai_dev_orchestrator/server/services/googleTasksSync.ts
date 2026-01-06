/**
 * Google Tasks Synchronization Service
 * 
 * Syncs orchestrator tasks with Google Tasks via MCP
 */

import { getMCPClient } from '../mcp/client';
import * as db from '../db';

export interface GoogleTasksConfig {
    taskListId: string;  // Get from Google Tasks
    syncInterval?: number;  // Minutes
    autoSync?: boolean;
}

export class GoogleTasksSync {
    private mcp = getMCPClient();
    private config: GoogleTasksConfig;
    private syncTimer?: NodeJS.Timeout;

    constructor(config: GoogleTasksConfig) {
        this.config = {
            syncInterval: 15,  // Default 15 minutes
            autoSync: true,
            ...config,
        };
    }

    /**
     * Start automatic syncing
     */
    async start(): Promise<void> {
        console.log('[Google Tasks] Starting sync service...');
        await this.mcp.connect();

        // Initial sync
        await this.syncAll();

        // Set up periodic sync
        if (this.config.autoSync) {
            const intervalMs = (this.config.syncInterval || 15) * 60 * 1000;
            this.syncTimer = setInterval(() => this.syncAll(), intervalMs);
            console.log(`[Google Tasks] Auto-sync enabled (every ${this.config.syncInterval} minutes)`);
        }
    }

    /**
     * Stop syncing
     */
    async stop(): Promise<void> {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
        }
        await this.mcp.disconnect();
        console.log('[Google Tasks] Sync service stopped');
    }

    /**
     * Sync all tasks
     */
    async syncAll(): Promise<void> {
        try {
            console.log('[Google Tasks] Starting sync...');

            // Get all pending/in-progress tasks from orchestrator
            const database = await db.getDb();
            if (!database) {
                console.error('[Google Tasks] Database not available');
                return;
            }

            const { tasks } = require('../drizzle/schema');
            const { inArray } = require('drizzle-orm');
            
            const taskList = await database
                .select()
                .from(tasks)
                .where(inArray(tasks.status, ['pending', 'assigned', 'in_progress']));

            console.log(`[Google Tasks] Found ${taskList.length} tasks to sync`);

            for (const task of taskList) {
                await this.syncTask(task);
            }

            console.log('[Google Tasks] Sync complete!');
        } catch (error) {
            console.error('[Google Tasks] Sync failed:', error);
        }
    }

    /**
     * Sync a single task to Google Tasks
     */
    async syncTask(task: any): Promise<void> {
        try {
            // Check if task already exists in Google Tasks
            const existingTasks = await this.mcp.callTool({
                tool: 'mcp_dev-mcp_google_tasks_list_tasks',
                parameters: {
                    taskListId: this.config.taskListId,
                },
            });

            if (!existingTasks.success) {
                console.error(`[Google Tasks] Failed to list tasks: ${existingTasks.error}`);
                return;
            }

            // Check if task already synced (by title match)
            const existingTask = existingTasks.data?.items?.find(
                (t: any) => t.title === task.title
            );

            if (existingTask) {
                // Update existing task
                await this.updateGoogleTask(existingTask.id, task);
            } else {
                // Create new task
                await this.createGoogleTask(task);
            }
        } catch (error) {
            console.error(`[Google Tasks] Failed to sync task ${task.id}:`, error);
        }
    }

    /**
     * Create a new Google Task
     */
    private async createGoogleTask(task: any): Promise<void> {
        // Fetch agent information if task is assigned
        let agentInfo = '';
        if (task.assignedAgentId) {
            const database = await db.getDb();
            const agent = await db.getAgentById(task.assignedAgentId);
            
            if (agent) {
                agentInfo = `
Agent: ${agent.name}
Role: ${agent.role}
Specialization: ${agent.specialization}
Agent Status: ${agent.status}
`;
            }
        }

        const notes = `
Orchestrator Task ID: ${task.id}
Description: ${task.description || 'N/A'}
Requirements: ${task.requirements || 'N/A'}
Status: ${task.status}
Progress: ${task.progressPercentage}%${agentInfo ? '\n' + agentInfo : ''}
Last Synced: ${new Date().toISOString()}
    `.trim();

        const result = await this.mcp.callTool({
            tool: 'mcp_dev-mcp_google_tasks_create_task',
            parameters: {
                taskListId: this.config.taskListId,
                title: task.title,
                notes: notes,
            },
        });

        if (result.success) {
            console.log(`[Google Tasks] Created: ${task.title}`);
        } else {
            console.error(`[Google Tasks] Failed to create: ${result.error}`);
        }
    }

    /**
     * Update an existing Google Task
     */
    private async updateGoogleTask(googleTaskId: string, task: any): Promise<void> {
        // Fetch agent information if task is assigned
        let agentInfo = '';
        if (task.assignedAgentId) {
            const database = await db.getDb();
            const agent = await db.getAgentById(task.assignedAgentId);
            
            if (agent) {
                agentInfo = `
Agent: ${agent.name}
Role: ${agent.role}
Specialization: ${agent.specialization}
Agent Status: ${agent.status}
Current Task: ${agent.currentTaskId ? `Task #${agent.currentTaskId}` : 'None'}
`;
            }
        } else {
            agentInfo = `
Agent: Unassigned
`;
        }

        const notes = `
Orchestrator Task ID: ${task.id}
Description: ${task.description || 'N/A'}
Requirements: ${task.requirements || 'N/A'}
Status: ${task.status}
Progress: ${task.progressPercentage}%${agentInfo ? '\n' + agentInfo : ''}
Last Synced: ${new Date().toISOString()}
    `.trim();

        // Map orchestrator status to Google Tasks status
        const status = task.status === 'completed' ? 'completed' : 'needsAction';

        const result = await this.mcp.callTool({
            tool: 'mcp_dev-mcp_google_tasks_update_task',
            parameters: {
                taskListId: this.config.taskListId,
                taskId: googleTaskId,
                title: task.title,
                notes: notes,
                status: status,
            },
        });

        if (result.success) {
            console.log(`[Google Tasks] Updated: ${task.title}`);
        } else {
            console.error(`[Google Tasks] Failed to update: ${result.error}`);
        }
    }

    /**
     * Get Google Tasks lists
     */
    async getTaskLists(): Promise<any[]> {
        const result = await this.mcp.callTool({
            tool: 'mcp_dev-mcp_google_tasks_list_tasklists',
            parameters: {},
        });

        if (result.success) {
            return result.data?.items || [];
        }
        return [];
    }
}

// Singleton instance
let syncInstance: GoogleTasksSync | null = null;

export function getGoogleTasksSync(config?: GoogleTasksConfig): GoogleTasksSync {
    if (!syncInstance && config) {
        syncInstance = new GoogleTasksSync(config);
    }
    return syncInstance!;
}

export async function setupGoogleTasksSync(): Promise<void> {
    console.log('Setting up Google Tasks sync...');

    const mcp = getMCPClient();
    await mcp.connect();

    // Get available task lists
    const result = await mcp.callTool({
        tool: 'mcp_dev-mcp_google_tasks_list_tasklists',
        parameters: {},
    });

    if (!result.success) {
        console.error('Failed to get Google Tasks lists:', result.error);
        console.log('Please configure Google Tasks API access in MCP server');
        return;
    }

    const lists = result.data?.items || [];

    if (lists.length === 0) {
        console.log('No Google Tasks lists found. Please create one first.');
        return;
    }

    console.log('\nAvailable Google Tasks Lists:');
    lists.forEach((list: any, index: number) => {
        console.log(`  ${index + 1}. ${list.title} (${list.id})`);
    });

    // Use the first list by default
    const taskListId = lists[0].id;
    console.log(`\nUsing: "${lists[0].title}"`);

    // Create sync instance
    const sync = new GoogleTasksSync({ taskListId });
    await sync.start();

    console.log('\n✅ Google Tasks sync is now active!');
    console.log('Tasks will sync automatically every 15 minutes.');

    await mcp.disconnect();
}
