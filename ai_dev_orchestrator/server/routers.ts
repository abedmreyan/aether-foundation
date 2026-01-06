import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db-sqlite";
import { ProjectImportService } from "./services/projectImport";
import { getProjectContextService } from "./services/dynamicContext";
import { StructureAnalyzerService } from "./services/structureAnalyzer";
import { TaskGeneratorService } from "./services/taskGenerator";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============================================================================
  // PROJECT MANAGEMENT
  // ============================================================================
  projects: router({
    create: protectedProcedure
      .input(z.object({ name: z.string().min(1), description: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const projectId = await db.createProject({
          name: input.name,
          description: input.description,
          createdBy: ctx.user.id,
          status: "active",
        });
        return { projectId };
      }),

    list: protectedProcedure.query(async () => {
      return db.getAllProjects();
    }),

    getById: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return db.getProjectById(input.projectId);
      }),

    scan: protectedProcedure
      .input(z.object({ localPath: z.string().min(1) }))
      .mutation(async ({ input }) => {
        return ProjectImportService.scanProject(input.localPath);
      }),

    import: protectedProcedure
      .input(z.object({ localPath: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const scanned = await ProjectImportService.scanProject(input.localPath);
        const projectId = await ProjectImportService.importProject(scanned, ctx.user.id);
        return { projectId, name: scanned.name };
      }),

    getStatus: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        const contextService = await getProjectContextService(input.projectId);
        if (!contextService) return { error: "Project has no local path" };
        return contextService.getProjectStatus();
      }),
  }),

  // ============================================================================
  // STRUCTURE ANALYSIS (Subsystems & Modules)
  // ============================================================================
  subsystems: router({
    analyze: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ input }) => {
        const structure = await StructureAnalyzerService.analyzeProject(input.projectId);
        return {
          success: true,
          subsystemCount: structure.subsystems.length,
          subsystems: structure.subsystems.map(s => ({
            name: s.name,
            moduleCount: s.modules.length
          }))
        };
      }),

    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return StructureAnalyzerService.getProjectStructure(input.projectId);
      }),

    getById: protectedProcedure
      .input(z.object({ subsystemId: z.number() }))
      .query(async ({ input }) => {
        const database = db.getDb();
        const [subsystem] = await database
          .select()
          .from(db.subsystems)
          .where(db.eq(db.subsystems.id, input.subsystemId));

        if (!subsystem) return null;

        const subModules = await database
          .select()
          .from(db.modules)
          .where(db.eq(db.modules.subsystemId, subsystem.id));

        return {
          ...subsystem,
          modules: subModules.map(m => ({
            ...m,
            files: m.files ? JSON.parse(m.files) : []
          }))
        };
      }),
  }),

  modules: router({
    list: protectedProcedure
      .input(z.object({ subsystemId: z.number() }))
      .query(async ({ input }) => {
        const database = db.getDb();
        const mods = await database
          .select()
          .from(db.modules)
          .where(db.eq(db.modules.subsystemId, input.subsystemId));

        return mods.map(m => ({
          ...m,
          files: m.files ? JSON.parse(m.files) : []
        }));
      }),

    getById: protectedProcedure
      .input(z.object({ moduleId: z.number() }))
      .query(async ({ input }) => {
        const database = db.getDb();
        const [mod] = await database
          .select()
          .from(db.modules)
          .where(db.eq(db.modules.id, input.moduleId));

        if (!mod) return null;
        return {
          ...mod,
          files: mod.files ? JSON.parse(mod.files) : []
        };
      }),
  }),

  // ============================================================================
  // PIPELINE MANAGEMENT (Kanban)
  // ============================================================================
  pipelines: router({
    getByProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        const pipelines = await db.getPipelinesByProject(input.projectId);
        // Parse stages JSON and attach tasks
        const result = [];
        for (const p of pipelines) {
          const tasks = await db.getTasksByPipeline(p.id);
          result.push({
            ...p,
            stages: JSON.parse(p.stages),
            tasks,
          });
        }
        return result;
      }),

    getTasksByStage: protectedProcedure
      .input(z.object({ pipelineId: z.number(), stage: z.string() }))
      .query(async ({ input }) => {
        return db.getTasksByStage(input.pipelineId, input.stage);
      }),
  }),

  // ============================================================================
  // TASK MANAGEMENT
  // ============================================================================
  tasks: router({
    create: protectedProcedure
      .input(z.object({
        pipelineId: z.number(),
        title: z.string().min(1),
        description: z.string().min(1),
        requirements: z.string().optional(),
        suggestedAgentRole: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const taskId = await db.createTask({
          pipelineId: input.pipelineId,
          title: input.title,
          description: input.description,
          requirements: input.requirements,
          suggestedAgentRole: input.suggestedAgentRole,
          stage: "Backlog",
          status: "pending",
        });
        return { taskId };
      }),

    // Create task for a project (auto-finds development pipeline)
    createForProject: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        title: z.string().min(1),
        description: z.string().min(1),
        requirements: z.string().optional(),
        suggestedAgentRole: z.string().optional(),
        subsystemId: z.number().optional(),
        moduleId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        // Find development pipeline
        const pipelines = await db.getPipelinesByProject(input.projectId);
        const devPipeline = pipelines.find(p => p.type === "development");
        if (!devPipeline) throw new Error("No development pipeline found");

        const taskId = await db.createTask({
          pipelineId: devPipeline.id,
          title: input.title,
          description: input.description,
          requirements: input.requirements,
          suggestedAgentRole: input.suggestedAgentRole,
          subsystemId: input.subsystemId,
          moduleId: input.moduleId,
          stage: "Backlog",
          status: "pending",
        });
        return { taskId };
      }),

    // Generate tasks from business proposal analysis
    generateTasks: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ input }) => {
        const suggestions = await TaskGeneratorService.generateTasksForProject(input.projectId);
        return {
          success: true,
          count: suggestions.length,
          tasks: suggestions
        };
      }),

    getById: protectedProcedure
      .input(z.object({ taskId: z.number() }))
      .query(async ({ input }) => {
        return db.getTaskById(input.taskId);
      }),

    // Move task to a different stage (used for Kanban drag-drop)
    moveStage: protectedProcedure
      .input(z.object({ taskId: z.number(), stage: z.string(), queueOrder: z.number().optional() }))
      .mutation(async ({ input }) => {
        await db.updateTaskStage(input.taskId, input.stage, input.queueOrder);
        return { success: true };
      }),

    // Reorder task within a stage (drag to reorder)
    reorder: protectedProcedure
      .input(z.object({ taskId: z.number(), queueOrder: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateTaskOrder(input.taskId, input.queueOrder);
        return { success: true };
      }),

    // Complete task from IDE (writes result and files)
    complete: protectedProcedure
      .input(z.object({
        taskId: z.number(),
        result: z.string(),
        filesChanged: z.array(z.string()),
      }))
      .mutation(async ({ input }) => {
        await db.completeTask(input.taskId, input.result, input.filesChanged);
        return { success: true };
      }),

    // QA approve task
    approve: protectedProcedure
      .input(z.object({ taskId: z.number() }))
      .mutation(async ({ input }) => {
        // Move to Approved stage
        await db.updateTaskStage(input.taskId, "Approved");

        // Auto-generate prompt files for IDE
        try {
          const { FileSyncService } = await import("./services/fileSync");
          await FileSyncService.writeTaskPrompt(input.taskId);
          console.log(`[Tasks] Generated prompt files for task ${input.taskId}`);
        } catch (error) {
          console.error(`[Tasks] Failed to write prompt for task ${input.taskId}:`, error);
          // Don't fail the approval if file sync fails
        }

        return { success: true };
      }),

    completeFromIDE: protectedProcedure
      .input(z.object({ taskId: z.number() }))
      .mutation(async ({ input }) => {
        const { FileSyncService } = await import("./services/fileSync");

        // Read results from .tasks/output/
        await FileSyncService.processTaskCompletion(input.taskId);

        return { success: true };
      }),
    // Get all pending approval tasks for a project
    getPendingApproval: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return db.getPendingApprovalTasks(input.projectId);
      }),
  }),

  // ============================================================================
  // AGENT MANAGEMENT
  // ============================================================================
  agents: router({
    list: protectedProcedure.query(async () => {
      return db.getAllAgents();
    }),

    getByDepartment: protectedProcedure
      .input(z.object({ department: z.string() }))
      .query(async ({ input }) => {
        return db.getAgentsByDepartment(input.department);
      }),

    getByRole: protectedProcedure
      .input(z.object({ role: z.string() }))
      .query(async ({ input }) => {
        return db.getAgentByRole(input.role);
      }),

    updateStatus: protectedProcedure
      .input(z.object({ agentId: z.number(), status: z.string(), currentTaskId: z.number().optional() }))
      .mutation(async ({ input }) => {
        await db.updateAgentStatus(input.agentId, input.status, input.currentTaskId);
        return { success: true };
      }),
  }),

  // ============================================================================
  // APPROVAL WORKFLOW
  // ============================================================================
  approvals: router({
    create: protectedProcedure
      .input(z.object({
        entityType: z.enum(["task", "content", "roadmap", "release", "research"]),
        entityId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.createApproval({ ...input, status: "pending" });
        return { success: true };
      }),

    getPending: protectedProcedure.query(async () => {
      return db.getPendingApprovals();
    }),

    decide: protectedProcedure
      .input(z.object({
        approvalId: z.number(),
        status: z.enum(["approved", "rejected", "revision_requested"]),
        feedback: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateApprovalStatus(input.approvalId, input.status, ctx.user.id, input.feedback);
        return { success: true };
      }),
  }),

  // ============================================================================
  // AGENT MESSAGES
  // ============================================================================
  agentMessages: router({
    create: protectedProcedure
      .input(z.object({
        fromAgentId: z.number(),
        toAgentId: z.number(),
        taskId: z.number().optional(),
        type: z.enum(["question", "handoff", "feedback", "blocker", "qa_result"]),
        content: z.string(),
      }))
      .mutation(async ({ input }) => {
        const messageId = await db.createAgentMessage(input);
        return { messageId };
      }),

    getForAgent: protectedProcedure
      .input(z.object({ agentId: z.number() }))
      .query(async ({ input }) => {
        return db.getMessagesForAgent(input.agentId);
      }),

    respond: protectedProcedure
      .input(z.object({ messageId: z.number(), response: z.string() }))
      .mutation(async ({ input }) => {
        await db.respondToMessage(input.messageId, input.response);
        return { success: true };
      }),
  }),

  // ============================================================================
  // RESEARCH TASKS (Perplexity integration)
  // ============================================================================
  research: router({
    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        title: z.string(),
        description: z.string(),
        type: z.enum(["market", "technical", "competitive"]),
      }))
      .mutation(async ({ input }) => {
        const { ResearchService } = await import("./services/research");
        const researchId = await ResearchService.conductResearch(input);
        return { researchId };
      }),

    getByProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return db.getResearchTasksByProject(input.projectId);
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        researchId: z.number(),
        status: z.enum(["pending", "approved", "researching", "complete"]),
        results: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.updateResearchTaskStatus(input.researchId, input.status, input.results);
        return { success: true };
      }),

    getResults: protectedProcedure
      .input(z.object({ researchId: z.number() }))
      .query(async ({ input }) => {
        const { ResearchService } = await import("./services/research");
        return ResearchService.getResearchResults(input.researchId);
      }),
  }),

  // ============================================================================
  // CONTENT ITEMS
  // ============================================================================
  content: router({
    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        type: z.enum(["blog", "social", "docs", "video", "email", "landing_page"]),
        title: z.string(),
        content: z.string().optional(),
        createdBy: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const contentId = await db.createContentItem({
          ...input,
          status: "draft",
        });
        return { contentId };
      }),

    getByProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return db.getContentItemsByProject(input.projectId);
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        contentId: z.number(),
        status: z.enum(["draft", "review", "approved", "published", "rejected"]),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateContentItemStatus(input.contentId, input.status, ctx.user.id);
        return { success: true };
      }),
  }),

  // ============================================================================
  // KNOWLEDGE BASE
  // ============================================================================
  knowledge: router({
    add: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        key: z.string(),
        value: z.string(),
        source: z.string(),
      }))
      .mutation(async ({ input }) => {
        await db.addKnowledge(input);
        return { success: true };
      }),

    getByProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return db.getProjectKnowledge(input.projectId);
      }),
  }),

  // ============================================================================
  // AGENT CONTEXT
  // ============================================================================
  agentContext: router({
    // Get full context for a task
    getForTask: protectedProcedure
      .input(z.object({ taskId: z.number() }))
      .query(async ({ input }) => {
        const { AgentContextService } = await import("./services/agentContext");
        return AgentContextService.buildContext(input.taskId);
      }),

    // Get markdown summary
    getMarkdown: protectedProcedure
      .input(z.object({ taskId: z.number() }))
      .query(async ({ input }) => {
        const { AgentContextService } = await import("./services/agentContext");
        return AgentContextService.generateContextMarkdown(input.taskId);
      }),

    // Get IDE prompt
    getIDEPrompt: protectedProcedure
      .input(z.object({ taskId: z.number() }))
      .query(async ({ input }) => {
        const { AgentContextService } = await import("./services/agentContext");
        return AgentContextService.generateIDEPrompt(input.taskId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
