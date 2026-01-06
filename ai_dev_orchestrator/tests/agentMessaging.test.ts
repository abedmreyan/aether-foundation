import { describe, it, expect, beforeAll } from "vitest";
import { AgentMessageService } from "../server/services/agentMessages";
import * as db from "../server/db";

describe("Agent Messaging", () => {
    let agent1Id: number;
    let agent2Id: number;
    let taskId: number;

    beforeAll(async () => {
        // Create test agents
        agent1Id = await db.createAgent({
            name: "Test Frontend Agent",
            role: "frontend",
            specialization: "React Development",
            status: "idle",
        });

        agent2Id = await db.createAgent({
            name: "Test Backend Agent",
            role: "backend",
            specialization: "Node.js APIs",
            status: "idle",
        });

        // Create test project, subsystem, module, and task
        const project = await db.createProject({
            name: "Test Project",
            description: "Testing agent messages",
            createdBy: 1,
            status: "development",
        });

        const subsystemId = await db.createSubsystem({
            projectId: project.id,
            name: "Test Subsystem",
            description: "Test",
            status: "planning",
        });

        const moduleId = await db.createModule({
            subsystemId,
            name: "Test Module",
            description: "Test",
            status: "planning",
        });

        taskId = await db.createTask({
            moduleId,
            title: "Test Task",
            description: "Test task for messaging",
            requirements: "Test requirements",
            status: "pending",
            assignedAgentId: agent1Id,
        });
    });

    it("should send a message between agents", async () => {
        const messageId = await AgentMessageService.sendMessage(agent1Id, agent2Id, {
            taskId,
            type: "question",
            content: "What's the API endpoint?",
        });

        expect(messageId).toBeGreaterThan(0);
    });

    it("should get pending messages for an agent", async () => {
        const messages = await AgentMessageService.getPendingMessages(agent2Id);
        expect(messages.length).toBeGreaterThan(0);
        expect(messages[0].content).toBe("What's the API endpoint?");
    });

    it("should respond to a message", async () => {
        const messages = await AgentMessageService.getPendingMessages(agent2Id);
        const messageId = messages[0].id;

        await AgentMessageService.respondToMessage(
            messageId,
            agent2Id,
            "POST /api/users/login"
        );

        const conversation = await AgentMessageService.getConversation(agent1Id, agent2Id, taskId);
        const answeredMessage = conversation.find(m => m.id === messageId);

        expect(answeredMessage?.status).toBe("answered");
        expect(answeredMessage?.response).toBe("POST /api/users/login");
    });

    it("should send handoff message", async () => {
        const messageId = await AgentMessageService.sendHandoff(
            agent1Id,
            agent2Id,
            taskId,
            "Frontend complete, ready for backend integration"
        );

        expect(messageId).toBeGreaterThan(0);
    });

    it("should ask question by role", async () => {
        const messageId = await AgentMessageService.askQuestion(
            agent1Id,
            "backend",
            taskId,
            "How should I handle authentication?"
        );

        expect(messageId).toBeGreaterThan(0);
    });
});
