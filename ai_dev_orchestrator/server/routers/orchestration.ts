import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { OrchestrationService } from "../orchestration";

export const orchestrationRouter = router({
  /**
   * Start a project - AI PM analyzes and creates strategy
   */
  startProject: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input }) => {
      await OrchestrationService.startProject(input.projectId);
      return { success: true };
    }),

  /**
   * Handle strategy approval
   */
  handleStrategyApproval: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input }) => {
      await OrchestrationService.handleStrategyApproval(input.projectId);
      return { success: true };
    }),

  /**
   * Handle task assignment approval
   */
  handleTaskAssignmentApproval: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input }) => {
      await OrchestrationService.handleTaskAssignmentApproval(input.projectId);
      return { success: true };
    }),

  /**
   * Execute a specific task
   */
  executeTask: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .mutation(async ({ input }) => {
      await OrchestrationService.executeTask(input.taskId);
      return { success: true };
    }),

  /**
   * Monitor project progress
   */
  monitorProject: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      return OrchestrationService.monitorProject(input.projectId);
    }),
});
