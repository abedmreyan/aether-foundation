import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { AgentMessageService } from "../services/agentMessages";

/**
 * Agent Messages Router
 * Handles agent-to-agent communication
 */
export const agentMessagesRouter = router({
    /**
     * Send a message to another agent
     */
    send: protectedProcedure
        .input(
            z.object({
                fromAgentId: z.number(),
                toAgentId: z.number(),
                taskId: z.number().optional(),
                type: z.enum(["question", "handoff", "feedback", "blocker"]),
                content: z.string().min(1),
            })
        )
        .mutation(async ({ input }) => {
            const messageId = await AgentMessageService.sendMessage(
                input.fromAgentId,
                input.toAgentId,
                {
                    taskId: input.taskId,
                    type: input.type,
                    content: input.content,
                }
            );
            return { messageId };
        }),

    /**
     * Get pending messages for an agent
     */
    getPending: protectedProcedure
        .input(z.object({ agentId: z.number() }))
        .query(async ({ input }) => {
            return AgentMessageService.getPendingMessages(input.agentId);
        }),

    /**
     * Respond to a message
     */
    respond: protectedProcedure
        .input(
            z.object({
                messageId: z.number(),
                agentId: z.number(),
                response: z.string().min(1),
            })
        )
        .mutation(async ({ input }) => {
            await AgentMessageService.respondToMessage(
                input.messageId,
                input.agentId,
                input.response
            );
            return { success: true };
        }),

    /**
     * Get conversation between two agents
     */
    getConversation: protectedProcedure
        .input(
            z.object({
                agent1Id: z.number(),
                agent2Id: z.number(),
                taskId: z.number().optional(),
            })
        )
        .query(async ({ input }) => {
            return AgentMessageService.getConversation(
                input.agent1Id,
                input.agent2Id,
                input.taskId
            );
        }),

    /**
     * Ask a question to an agent by role
     */
    askByRole: protectedProcedure
        .input(
            z.object({
                fromAgentId: z.number(),
                toAgentRole: z.string(),
                taskId: z.number(),
                question: z.string().min(1),
            })
        )
        .mutation(async ({ input }) => {
            const messageId = await AgentMessageService.askQuestion(
                input.fromAgentId,
                input.toAgentRole,
                input.taskId,
                input.question
            );
            return { messageId };
        }),
});
