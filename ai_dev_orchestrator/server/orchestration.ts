import * as db from "./db";
import { ProjectManagerAgent } from "./agents/projectManager";
import { AgentFactory } from "./agents/specialists";
import { ContextManager } from "./agents/contextManager";

/**
 * Orchestration Service
 * 
 * Coordinates the AI agents and manages project workflows
 */
export class OrchestrationService {
  /**
   * Start a new project - AI PM analyzes the idea and creates strategy
   */
  static async startProject(projectId: number): Promise<void> {
    console.log(`[Orchestration] Starting project ${projectId}`);

    // Get the AI PM agent
    const agents = await db.getAllAgents();
    const pmAgent = agents.find((a) => a.role === "project_manager");

    if (!pmAgent) {
      throw new Error("AI Project Manager not found");
    }

    // Create AI PM instance and analyze project
    const aiPM = new ProjectManagerAgent(pmAgent.id);
    await aiPM.analyzeProjectIdea(projectId);
  }

  /**
   * Handle strategy approval - AI PM breaks down the project
   */
  static async handleStrategyApproval(projectId: number): Promise<void> {
    console.log(`[Orchestration] Strategy approved for project ${projectId}`);

    // Update project status
    await db.updateProjectStatus(projectId, "design");

    // Get the AI PM agent
    const agents = await db.getAllAgents();
    const pmAgent = agents.find((a) => a.role === "project_manager");

    if (!pmAgent) {
      throw new Error("AI Project Manager not found");
    }

    // Create AI PM instance and break down project
    const aiPM = new ProjectManagerAgent(pmAgent.id);
    await aiPM.breakdownProject(projectId);
  }

  /**
   * Handle task assignment approval - Start executing tasks
   */
  static async handleTaskAssignmentApproval(projectId: number): Promise<void> {
    console.log(`[Orchestration] Task assignments approved for project ${projectId}`);

    // Update project status
    await db.updateProjectStatus(projectId, "development");

    // Get all subsystems for the project
    const subsystems = await db.getSubsystemsByProject(projectId);

    // For each subsystem, get modules and tasks
    for (const subsystem of subsystems) {
      const modules = await db.getModulesBySubsystem(subsystem.id);

      for (const module of modules) {
        const tasks = await db.getTasksByModule(module.id);

        // Start tasks that have no dependencies
        for (const task of tasks) {
          if (task.status === "pending" && task.assignedAgentId) {
            // Mark task as assigned
            await db.updateTaskStatus(task.id, "assigned");
          }
        }
      }
    }
  }

  /**
   * Execute a task with the assigned agent
   */
  static async executeTask(taskId: number): Promise<void> {
    console.log(`[Orchestration] Executing task ${taskId}`);

    // Get task details
    const taskResult = await db.getDb().then((database) =>
      database?.select().from(require("../drizzle/schema").tasks).where(require("drizzle-orm").eq(require("../drizzle/schema").tasks.id, taskId)).limit(1)
    );

    if (!taskResult || taskResult.length === 0) {
      throw new Error("Task not found");
    }

    const task = taskResult[0];

    if (!task.assignedAgentId) {
      throw new Error("Task has no assigned agent");
    }

    // Get agent details
    const agent = await db.getAgentById(task.assignedAgentId);
    if (!agent) {
      throw new Error("Agent not found");
    }

    // Get module to find project ID
    const moduleResult = await db.getDb().then((database) =>
      database?.select().from(require("../drizzle/schema").modules).where(require("drizzle-orm").eq(require("../drizzle/schema").modules.id, task.moduleId)).limit(1)
    );

    if (!moduleResult || moduleResult.length === 0) {
      throw new Error("Module not found");
    }

    const module = moduleResult[0];

    // Get subsystem to find project ID
    const subsystemResult = await db.getDb().then((database) =>
      database?.select().from(require("../drizzle/schema").subsystems).where(require("drizzle-orm").eq(require("../drizzle/schema").subsystems.id, module.subsystemId)).limit(1)
    );

    if (!subsystemResult || subsystemResult.length === 0) {
      throw new Error("Subsystem not found");
    }

    const subsystem = subsystemResult[0];
    const projectId = subsystem.projectId;

    // Build context for the task
    const context = await ContextManager.buildContext(projectId, taskId);

    // Create agent instance and execute task
    const agentInstance = AgentFactory.createAgent(agent.id, agent.role);
    await agentInstance.executeTask(taskId, context);
  }

  /**
   * Monitor project progress and identify next steps
   */
  static async monitorProject(projectId: number): Promise<{
    status: string;
    completedTasks: number;
    totalTasks: number;
    blockedTasks: number;
    nextActions: string[];
  }> {
    const subsystems = await db.getSubsystemsByProject(projectId);
    
    let totalTasks = 0;
    let completedTasks = 0;
    let blockedTasks = 0;
    const nextActions: string[] = [];

    for (const subsystem of subsystems) {
      const modules = await db.getModulesBySubsystem(subsystem.id);

      for (const module of modules) {
        const tasks = await db.getTasksByModule(module.id);
        totalTasks += tasks.length;

        for (const task of tasks) {
          if (task.status === "completed" || task.status === "approved") {
            completedTasks++;
          } else if (task.status === "blocked") {
            blockedTasks++;
            nextActions.push(`Resolve blocker for task: ${task.title}`);
          } else if (task.status === "assigned" || task.status === "pending") {
            nextActions.push(`Execute task: ${task.title}`);
          }
        }
      }
    }

    const project = await db.getProjectById(projectId);
    const status = project?.status || "unknown";

    return {
      status,
      completedTasks,
      totalTasks,
      blockedTasks,
      nextActions: nextActions.slice(0, 5), // Return top 5 next actions
    };
  }
}
