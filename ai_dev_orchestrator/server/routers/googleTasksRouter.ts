import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { googleTasksService } from "../services/googleTasks";

/**
 * Google Tasks Router
 * Handles Google Tasks integration and OAuth
 */
export const googleTasksRouter = router({
    /**
     * Get OAuth authorization URL
     */
    getAuthUrl: publicProcedure.query(() => {
        const authUrl = googleTasksService.getAuthUrl();
        return { authUrl };
    }),

    /**
     * Complete OAuth flow with authorization code
     */
    authorize: publicProcedure
        .input(z.object({ code: z.string() }))
        .mutation(async ({ input }) => {
            await googleTasksService.authorize(input.code);
            return { success: true };
        }),

    /**
     * Sync all tasks for a project
     */
    syncProject: protectedProcedure
        .input(z.object({ projectId: z.number() }))
        .mutation(async ({ input }) => {
            await googleTasksService.syncProjectTasks(input.projectId);
            return { success: true };
        }),

    /**
     * Create a Google Tasks list for a project
     */
    createTaskList: protectedProcedure
        .input(
            z.object({
                projectId: z.number(),
                projectName: z.string(),
            })
        )
        .mutation(async ({ input }) => {
            const listId = await googleTasksService.createTaskList(
                input.projectId,
                input.projectName
            );
            return { listId };
        }),

    /**
     * Create a Google Task from an orchestrator task
     */
    createTask: protectedProcedure
        .input(
            z.object({
                taskId: z.number(),
                listId: z.string(),
            })
        )
        .mutation(async ({ input }) => {
            const googleTaskId = await googleTasksService.createTask(
                input.taskId,
                input.listId
            );
            return { googleTaskId };
        }),

    /**
     * Update a Google Task
     */
    updateTask: protectedProcedure
        .input(z.object({ taskId: z.number() }))
        .mutation(async ({ input }) => {
            await googleTasksService.updateTask(input.taskId);
            return { success: true };
        }),

    /**
     * Mark a Google Task as complete
     */
    completeTask: protectedProcedure
        .input(z.object({ taskId: z.number() }))
        .mutation(async ({ input }) => {
            await googleTasksService.completeTask(input.taskId);
            return { success: true };
        }),
});
