/**
 * Google Tasks Router
 * 
 * Provides tRPC endpoints for managing Google Tasks integration
 */

import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getMCPClient } from "../mcp/client";
import { getGoogleTasksSync } from "../services/googleTasksSync";

export const googleTasksRouter = router({
  /**
   * List all Google Tasks lists available to the user
   */
  listTaskLists: protectedProcedure.query(async () => {
    try {
      const mcp = getMCPClient();
      await mcp.connect();

      const result = await mcp.callTool({
        tool: 'mcp_dev-mcp_google_tasks_list_tasklists',
        parameters: {},
      });

      await mcp.disconnect();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch task lists');
      }

      return {
        success: true,
        lists: result.data?.items || [],
      };
    } catch (error) {
      console.error('[Google Tasks] Error listing task lists:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        lists: [],
      };
    }
  }),

  /**
   * Get current sync configuration
   */
  getConfig: protectedProcedure.query(async () => {
    return {
      taskListId: process.env.GOOGLE_TASKS_LIST_ID || null,
      syncInterval: parseInt(process.env.GOOGLE_TASKS_SYNC_INTERVAL || '15'),
      autoSync: process.env.GOOGLE_TASKS_AUTO_SYNC === 'true',
      isConfigured: !!process.env.GOOGLE_TASKS_LIST_ID,
    };
  }),

  /**
   * Get sync service status
   */
  getSyncStatus: protectedProcedure.query(async () => {
    const syncService = getGoogleTasksSync();
    
    if (!syncService) {
      return {
        isRunning: false,
        lastSync: null,
        message: 'Sync service not initialized. Run setup script first.',
      };
    }

    return {
      isRunning: true,
      lastSync: new Date().toISOString(), // TODO: Track actual last sync time
      taskListId: process.env.GOOGLE_TASKS_LIST_ID,
      syncInterval: parseInt(process.env.GOOGLE_TASKS_SYNC_INTERVAL || '15'),
      message: 'Sync service is active',
    };
  }),

  /**
   * Trigger manual sync
   */
  syncNow: protectedProcedure.mutation(async () => {
    try {
      const syncService = getGoogleTasksSync();

      if (!syncService) {
        throw new Error('Sync service not initialized. Configure Google Tasks first.');
      }

      if (!process.env.GOOGLE_TASKS_LIST_ID) {
        throw new Error('Task list ID not configured. Run setup script first.');
      }

      console.log('[Google Tasks] Manual sync triggered');
      await syncService.syncAll();

      return {
        success: true,
        message: 'Sync completed successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[Google Tasks] Manual sync failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }),

  /**
   * Test Google Tasks connection
   */
  testConnection: protectedProcedure.mutation(async () => {
    try {
      const mcp = getMCPClient();
      await mcp.connect();

      // Try to list task lists as a connection test
      const result = await mcp.callTool({
        tool: 'mcp_dev-mcp_google_tasks_list_tasklists',
        parameters: {},
      });

      await mcp.disconnect();

      if (!result.success) {
        throw new Error(result.error || 'Connection test failed');
      }

      const lists = result.data?.items || [];

      return {
        success: true,
        message: 'Successfully connected to Google Tasks',
        listsFound: lists.length,
        lists: lists.map((list: any) => ({
          id: list.id,
          title: list.title,
        })),
      };
    } catch (error) {
      console.error('[Google Tasks] Connection test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }),

  /**
   * Configure task list (update environment configuration)
   * Note: This updates the runtime config but doesn't persist to .env
   * Use the setup script for persistent configuration
   */
  configureTaskList: protectedProcedure
    .input(
      z.object({
        taskListId: z.string().min(1),
        syncInterval: z.number().min(1).max(1440).default(15),
        autoSync: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      // Update runtime environment (temporary until server restart)
      process.env.GOOGLE_TASKS_LIST_ID = input.taskListId;
      process.env.GOOGLE_TASKS_SYNC_INTERVAL = input.syncInterval.toString();
      process.env.GOOGLE_TASKS_AUTO_SYNC = input.autoSync.toString();

      console.log('[Google Tasks] Configuration updated (runtime only)');
      console.log(`  Task List ID: ${input.taskListId}`);
      console.log(`  Sync Interval: ${input.syncInterval} minutes`);
      console.log(`  Auto Sync: ${input.autoSync}`);

      return {
        success: true,
        message: 'Configuration updated. Run setup script to persist changes.',
        config: {
          taskListId: input.taskListId,
          syncInterval: input.syncInterval,
          autoSync: input.autoSync,
        },
      };
    }),

  /**
   * Get tasks from Google Tasks (for verification)
   */
  listGoogleTasks: protectedProcedure.query(async () => {
    try {
      const taskListId = process.env.GOOGLE_TASKS_LIST_ID;
      
      if (!taskListId) {
        throw new Error('Task list ID not configured');
      }

      const mcp = getMCPClient();
      await mcp.connect();

      const result = await mcp.callTool({
        tool: 'mcp_dev-mcp_google_tasks_list_tasks',
        parameters: {
          taskListId: taskListId,
        },
      });

      await mcp.disconnect();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch tasks');
      }

      return {
        success: true,
        tasks: result.data?.items || [],
        count: (result.data?.items || []).length,
      };
    } catch (error) {
      console.error('[Google Tasks] Error listing tasks:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        tasks: [],
        count: 0,
      };
    }
  }),
});

