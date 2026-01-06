import { invokeLLM } from "../_core/llm";
import * as db from "../db";
import { buildToolReminder } from "./mcpTools";

export type AgentRole =
  | "project_manager"
  | "research"
  | "architecture"
  | "ui_ux"
  | "frontend"
  | "backend"
  | "devops"
  | "qa";

export interface AgentContext {
  projectId: number;
  taskId?: number;
  projectVision?: string;
  approvedStrategy?: string;
  designSpecs?: string;
  requirements?: string;
  relatedWork?: string;
  projectHistory?: string;
}

export interface AgentMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AgentAction {
  action: string;
  details?: string;
  mcpToolCalled?: string;
}

/**
 * Base class for all AI agents in the system
 */
export abstract class BaseAgent {
  protected agentId: number;
  protected name: string;
  protected role: AgentRole;
  protected specialization: string;

  constructor(agentId: number, name: string, role: AgentRole, specialization: string) {
    this.agentId = agentId;
    this.name = name;
    this.role = role;
    this.specialization = specialization;
  }

  /**
   * Get the system prompt for this agent
   */
  protected abstract getSystemPrompt(): string;

  /**
   * Execute a task with the given context
   */
  async executeTask(taskId: number, context: AgentContext): Promise<string> {
    try {
      // Update agent status to working
      await db.updateAgentStatus(this.agentId, "working", taskId);
      await this.logActivity(taskId, "Task started", JSON.stringify(context));

      // Get task details
      const task = await db.getDb().then((db) =>
        db?.select().from(require("../../drizzle/schema").tasks).where(require("drizzle-orm").eq(require("../../drizzle/schema").tasks.id, taskId)).limit(1)
      );

      if (!task || task.length === 0) {
        throw new Error(`Task ${taskId} not found`);
      }

      const taskDetails = task[0];

      // Build context message
      const contextMessage = this.buildContextMessage(context, taskDetails);

      // Execute the task using LLM
      const result = await this.executeLLMTask(contextMessage, taskDetails);

      // Update task progress
      await db.updateTaskStatus(taskId, "completed", 100);
      await this.logActivity(taskId, "Task completed", result);

      // Update agent status back to idle
      await db.updateAgentStatus(this.agentId, "idle");

      return result;
    } catch (error) {
      // Handle errors
      await db.updateAgentStatus(this.agentId, "blocked", taskId);
      await this.logActivity(taskId, "Task failed", error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Build a context message from the provided context
   */
  protected buildContextMessage(context: AgentContext, taskDetails: any): string {
    // Start with tool reminder
    let message = buildToolReminder(this.role);

    message += `\n# Task Context\n\n`;
    message += `**Project ID**: ${context.projectId}\n`;
    message += `**Task ID**: ${context.taskId}\n\n`;

    if (context.projectVision) {
      message += `## Project Vision\n${context.projectVision}\n\n`;
    }

    if (context.approvedStrategy) {
      message += `## Approved Strategy\n${context.approvedStrategy}\n\n`;
    }

    if (context.designSpecs) {
      message += `## Design Specifications\n${context.designSpecs}\n\n`;
    }

    message += `## Task Details\n`;
    message += `**Title**: ${taskDetails.title}\n`;
    message += `**Description**: ${taskDetails.description}\n`;
    message += `**Requirements**: ${taskDetails.requirements}\n\n`;

    if (context.relatedWork) {
      message += `## Related Work\n${context.relatedWork}\n\n`;
    }

    if (context.projectHistory) {
      message += `## Project History\n${context.projectHistory}\n\n`;
    }

    return message;
  }

  /**
   * Execute the task using LLM
   */
  protected async executeLLMTask(contextMessage: string, taskDetails: any): Promise<string> {
    const messages: AgentMessage[] = [
      {
        role: "system",
        content: this.getSystemPrompt(),
      },
      {
        role: "user",
        content: contextMessage,
      },
    ];

    const response = await invokeLLM({
      messages: messages as any,
    });

    const content = response.choices[0]?.message?.content;
    if (typeof content === "string") {
      return content;
    }
    return "";
  }

  /**
   * Log an activity for this agent
   */
  protected async logActivity(taskId: number | undefined, action: string, details?: string, mcpToolCalled?: string) {
    await db.logAgentActivity({
      agentId: this.agentId,
      taskId,
      action,
      details,
      mcpToolCalled,
    });
  }

  /**
   * Report progress on a task
   */
  async reportProgress(taskId: number, percentage: number, message: string) {
    await db.updateTaskStatus(taskId, "in_progress", percentage);
    await this.logActivity(taskId, `Progress: ${percentage}%`, message);
  }

  /**
   * Report a blocker
   */
  async reportBlocker(taskId: number, reason: string) {
    await db.updateAgentStatus(this.agentId, "blocked", taskId);
    await this.logActivity(taskId, "Blocked", reason);
  }

  /**
   * Get agent information
   */
  getInfo() {
    return {
      id: this.agentId,
      name: this.name,
      role: this.role,
      specialization: this.specialization,
    };
  }
}
