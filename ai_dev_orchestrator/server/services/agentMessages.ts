import * as db from "../db-sqlite";
import type { InsertAgentMessage } from "../../drizzle/schema-sqlite";

export interface AgentMessageCreate {
    fromAgentId: number;
    toAgentId: number;
    taskId?: number;
    type: "question" | "handoff" | "feedback" | "blocker";
    content: string;
}

/**
 * Agent Message Service - Enables agent-to-agent communication
 */
export class AgentMessageService {
    /**
     * Agent sends a message to another agent
     */
    static async sendMessage(
        fromAgentId: number,
        toAgentId: number,
        message: Omit<AgentMessageCreate, "fromAgentId" | "toAgentId">
    ): Promise<number> {
        const messageData: InsertAgentMessage = {
            fromAgentId,
            toAgentId,
            taskId: message.taskId,
            type: message.type,
            content: message.content,
            status: "pending",
        };

        const messageId = await db.createAgentMessage(messageData);

        // Log the activity
        await db.logAgentActivity({
            agentId: fromAgentId,
            taskId: message.taskId,
            action: `Message sent to agent ${toAgentId}`,
            details: `Type: ${message.type}, Content: ${message.content.substring(0, 100)}...`,
        });

        return messageId;
    }

    /**
     * Get pending messages for an agent
     */
    static async getPendingMessages(agentId: number) {
        return db.getPendingMessagesForAgent(agentId);
    }

    /**
     * Agent responds to a message
     */
    static async respondToMessage(messageId: number, agentId: number, response: string): Promise<void> {
        await db.respondToMessage(messageId, response);

        // Log the activity
        await db.logAgentActivity({
            agentId,
            action: `Responded to message ${messageId}`,
            details: `Response: ${response.substring(0, 100)}...`,
        });
    }

    /**
     * Get conversation between two agents
     */
    static async getConversation(agent1Id: number, agent2Id: number, taskId?: number) {
        return db.getConversation(agent1Id, agent2Id, taskId);
    }

    /**
     * Send a handoff message (task complete, ready for next agent)
     */
    static async sendHandoff(
        fromAgentId: number,
        toAgentId: number,
        taskId: number,
        summary: string
    ): Promise<number> {
        return this.sendMessage(fromAgentId, toAgentId, {
            taskId,
            type: "handoff",
            content: `Task ${taskId} handoff: ${summary}`,
        });
    }

    /**
     * Ask another agent for help/clarification
     */
    static async askQuestion(
        fromAgentId: number,
        toAgentRole: string,
        taskId: number,
        question: string
    ): Promise<number> {
        // Get the agent by role
        const targetAgent = await db.getAgentByRole(toAgentRole);
        if (!targetAgent) {
            throw new Error(`No agent found with role: ${toAgentRole}`);
        }

        return this.sendMessage(fromAgentId, targetAgent.id, {
            taskId,
            type: "question",
            content: question,
        });
    }

    /**
     * Report a blocker that requires another agent's attention
     */
    static async reportBlocker(
        fromAgentId: number,
        toAgentId: number,
        taskId: number,
        blockerDescription: string
    ): Promise<number> {
        return this.sendMessage(fromAgentId, toAgentId, {
            taskId,
            type: "blocker",
            content: `Blocker: ${blockerDescription}`,
        });
    }

    /**
     * Get all messages for a specific task (agent communication history)
     */
    static async getTaskMessages(taskId: number) {
        // This would require a custom query - for now return empty
        // Can be enhanced later if needed
        return [] as any[];
    }
}
