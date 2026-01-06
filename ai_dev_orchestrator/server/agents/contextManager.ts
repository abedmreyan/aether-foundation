import * as db from "../db";
import { AgentContext } from "./base";
import { getAttachmentsByProject } from "../db/attachments";

/**
 * Context Manager - manages and retrieves project context for agents
 */
export class ContextManager {
  /**
   * Build comprehensive context for an agent task
   */
  static async buildContext(projectId: number, taskId?: number): Promise<AgentContext> {
    const context: AgentContext = {
      projectId,
      taskId,
    };

    // Get project details
    const project = await db.getProjectById(projectId);
    if (project) {
      context.projectVision = project.description;
    }

    // Get project attachments
    const attachments = await getAttachmentsByProject(projectId);
    if (attachments.length > 0) {
      let attachmentsList = "## Project Attachments\n\n";
      for (const attachment of attachments) {
        attachmentsList += `- **${attachment.fileName}** (${attachment.mimeType})\n`;
        attachmentsList += `  Size: ${(attachment.fileSize / 1024).toFixed(1)} KB\n`;
        attachmentsList += `  URL: ${attachment.fileUrl}\n\n`;
      }
      context.relatedWork = (context.relatedWork || "") + attachmentsList;
    }

    // Get knowledge base entries
    const knowledge = await db.getProjectKnowledge(projectId);
    
    // Extract specific knowledge types
    for (const entry of knowledge) {
      try {
        const value = JSON.parse(entry.value);
        
        if (entry.key === "approved_strategy") {
          context.approvedStrategy = typeof value === "string" ? value : JSON.stringify(value);
        } else if (entry.key === "design_specs") {
          context.designSpecs = typeof value === "string" ? value : JSON.stringify(value);
        } else if (entry.key === "project_history") {
          context.projectHistory = typeof value === "string" ? value : JSON.stringify(value);
        }
      } catch (e) {
        // If not JSON, use as-is
        if (entry.key === "approved_strategy") {
          context.approvedStrategy = entry.value;
        } else if (entry.key === "design_specs") {
          context.designSpecs = entry.value;
        } else if (entry.key === "project_history") {
          context.projectHistory = entry.value;
        }
      }
    }

    // If there's a specific task, get related work
    if (taskId) {
      context.relatedWork = await this.getRelatedWork(taskId);
    }

    return context;
  }

  /**
   * Get related work for a task (from other agents or previous tasks)
   */
  private static async getRelatedWork(taskId: number): Promise<string> {
    // Get deliverables from related tasks
    const deliverables = await db.getDeliverablesByTask(taskId);
    
    if (deliverables.length === 0) {
      return "";
    }

    let relatedWork = "## Related Deliverables\n\n";
    for (const deliverable of deliverables) {
      relatedWork += `### ${deliverable.name}\n`;
      relatedWork += `**Type**: ${deliverable.type}\n`;
      relatedWork += `**URL**: ${deliverable.url}\n`;
      if (deliverable.description) {
        relatedWork += `**Description**: ${deliverable.description}\n`;
      }
      relatedWork += `\n`;
    }

    return relatedWork;
  }

  /**
   * Store context in knowledge base
   */
  static async storeContext(
    projectId: number,
    key: string,
    value: any,
    source: string
  ): Promise<void> {
    const valueStr = typeof value === "string" ? value : JSON.stringify(value);
    
    await db.addKnowledge({
      projectId,
      key,
      value: valueStr,
      source,
    });
  }

  /**
   * Get project history summary
   */
  static async getProjectHistory(projectId: number): Promise<string> {
    const activityLogs = await db.getRecentActivityLogs(projectId, 50);
    
    if (activityLogs.length === 0) {
      return "No activity history available.";
    }

    let history = "## Recent Project Activity\n\n";
    for (const log of activityLogs) {
      history += `- **${log.action}** (${log.timestamp.toISOString()})\n`;
      if (log.details) {
        history += `  ${log.details}\n`;
      }
    }

    return history;
  }

  /**
   * Update project history in knowledge base
   */
  static async updateProjectHistory(projectId: number): Promise<void> {
    const history = await this.getProjectHistory(projectId);
    await this.storeContext(projectId, "project_history", history, "system");
  }
}
