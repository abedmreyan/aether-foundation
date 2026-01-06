import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getTaskExportService } from "../services/taskExport";
import * as db from "../db";

/**
 * Task Export Router
 * 
 * Handles task specification generation and approval workflows
 */

// Get project path from environment or config
const AETHER_PROJECT_PATH = process.env.AETHER_PROJECT_PATH || '/Users/abedmreyan/Desktop/aether_-foundation';

export const taskExportRouter = router({
    /**
     * Generate task specification file for a task
     */
    generateTaskSpec: protectedProcedure
        .input(
            z.object({
                projectId: z.number(),
                taskId: z.number(),
                researchSummary: z.string().optional(),
            })
        )
        .mutation(async ({ input }) => {
            const exportService = getTaskExportService(AETHER_PROJECT_PATH);

            // Generate task spec
            const spec = await exportService.generateTaskSpec(
                input.projectId,
                input.taskId,
                input.researchSummary
            );

            // Write to queue directory
            const filePath = await exportService.writeTaskFile(spec, `task-${input.taskId}.json`);

            return {
                success: true,
                taskId: spec.id,
                filePath,
                status: spec.status,
            };
        }),

    /**
     * Approve a task and move it to current execution
     */
    approveTask: protectedProcedure
        .input(
            z.object({
                taskId: z.string(), // e.g. "task-001"
                projectId: z.number(),
                feedback: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const exportService = getTaskExportService(AETHER_PROJECT_PATH);

            // Move task to current-task.json
            await exportService.approveTask(input.taskId);

            // Extract numeric task ID
            const numericTaskId = parseInt(input.taskId.replace('task-', ''));

            // Update task status in database
            await db.updateTaskStatus(numericTaskId, 'in_progress');

            // Log approval
            await db.createApproval({
                userId: ctx.user.id,
                entityType: 'task',
                entityId: numericTaskId,
                status: 'approved',
                comments: input.feedback,
            });

            return {
                success: true,
                message: 'Task approved and ready for IDE execution',
            };
        }),

    /**
     * Reject a task
     */
    rejectTask: protectedProcedure
        .input(
            z.object({
                taskId: z.string(),
                projectId: z.number(),
                feedback: z.string().min(1),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const numericTaskId = parseInt(input.taskId.replace('task-', ''));

            // Update task status
            await db.updateTaskStatus(numericTaskId, 'blocked');

            // Log rejection
            await db.createApproval({
                userId: ctx.user.id,
                entityType: 'task',
                entityId: numericTaskId,
                status: 'rejected',
                comments: input.feedback,
            });

            return {
                success: true,
                message: 'Task rejected - feedback provided to AI PM',
            };
        }),

    /**
     * List pending tasks awaiting approval
     */
    getPendingTasks: protectedProcedure
        .input(
            z.object({
                projectId: z.number(),
            })
        )
        .query(async ({ input }) => {
            const subsystems = await db.getSubsystemsByProject(input.projectId);
            const allTasks = [];

            for (const subsystem of subsystems) {
                const modules = await db.getModulesBySubsystem(subsystem.id);

                for (const module of modules) {
                    const tasks = await db.getTasksByModule(module.id);
                    allTasks.push(...tasks.filter(t => t.status === 'pending' || t.status === 'assigned'));
                }
            }

            return allTasks;
        }),
});
