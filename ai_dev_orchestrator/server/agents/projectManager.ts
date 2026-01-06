import { BaseAgent, AgentContext } from "./base";
import { invokeLLM } from "../_core/llm";
import * as db from "../db";
import { MCPTools } from "../mcp/tools";
import { ContextManager } from "./contextManager";

/**
 * AI Project Manager Agent
 * 
 * The central coordinator that:
 * - Receives project ideas from product owners
 * - Conducts research and feasibility analysis
 * - Proposes comprehensive strategies
 * - Breaks down projects into subsystems, modules, and tasks
 * - Coordinates specialist agents
 * - Monitors progress and escalates issues
 */
export class ProjectManagerAgent extends BaseAgent {
  constructor(agentId: number) {
    super(
      agentId,
      "AI Project Manager",
      "project_manager",
      "Strategic planning, project decomposition, team coordination, and stakeholder communication"
    );
  }

  protected getSystemPrompt(): string {
    return `You are an AI Project Manager leading a team of specialized AI agents to build software projects.

Your responsibilities:
1. Analyze project ideas and conduct feasibility research
2. Create comprehensive project strategies including architecture, features, and timeline
3. Break down projects into subsystems, modules, and tasks
4. Assign tasks to appropriate specialist agents
5. Monitor progress and coordinate dependencies
6. Escalate blockers and risks to the product owner
7. Ensure quality standards are met

You have access to:
- Research tools (Perplexity for market/technical research)
- Documentation tools (Google Docs for specifications)
- Task management tools (Google Tasks)

Your specialist agents:
- Research Agent: Market research, competitive analysis, technical feasibility
- Architecture Agent: System design, data models, API specifications
- UI/UX Agent: Interface design, user experience, wireframes
- Frontend Agent: Client-side development
- Backend Agent: Server-side development, APIs, databases
- DevOps Agent: Deployment, infrastructure, CI/CD
- QA Agent: Testing, quality assurance, validation

When creating strategies:
- Be comprehensive and detailed
- Consider scalability, security, and maintainability
- Propose realistic timelines
- Identify potential risks and mitigation strategies
- Structure the project into clear subsystems and modules

When breaking down work:
- Create clear, actionable tasks with specific requirements
- Assign tasks to the most appropriate agent
- Define dependencies between tasks
- Set realistic estimates

Always communicate clearly with the product owner and provide regular updates.`;
  }

  /**
   * Analyze a project idea and create a strategy proposal
   */
  async analyzeProjectIdea(projectId: number): Promise<void> {
    try {
      await db.updateAgentStatus(this.agentId, "working");
      await this.logActivity(undefined, "Starting project analysis", `Project ID: ${projectId}`);

      // Get project details
      const project = await db.getProjectById(projectId);
      if (!project) {
        throw new Error("Project not found");
      }

      // Conduct research using MCP
      await this.logActivity(undefined, "Conducting market research", undefined, "perplexity_research");
      const researchResult = await MCPTools.research.conduct(
        `${project.name}: ${project.description}`,
        "market analysis, technical feasibility, competitive landscape"
      );

      // Create strategy document
      await this.logActivity(undefined, "Creating strategy proposal");
      
      const strategyPrompt = `Analyze this project idea and create a comprehensive strategy:

Project: ${project.name}
Description: ${project.description}

Research findings: ${JSON.stringify(researchResult.data)}

Create a detailed strategy proposal including:
1. Executive Summary
2. Market Analysis
3. Technical Feasibility Assessment
4. Proposed Architecture
5. Feature Breakdown
6. Technology Stack Recommendations
7. Project Structure (Subsystems and Modules)
8. Timeline Estimate
9. Risk Assessment
10. Success Metrics

Format the response as a structured document.`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: this.getSystemPrompt() },
          { role: "user", content: strategyPrompt },
        ] as any,
      });

      const strategyContent = response.choices[0]?.message?.content;
      if (typeof strategyContent !== "string") {
        throw new Error("Invalid strategy response");
      }

      // Create Google Doc for strategy
      await this.logActivity(undefined, "Creating strategy document", undefined, "google_docs_create");
      const docResult = await MCPTools.documentation.createDoc(
        `${project.name} - Strategy Proposal`,
        strategyContent
      );

      // Store strategy in knowledge base
      await ContextManager.storeContext(
        projectId,
        "approved_strategy",
        strategyContent,
        "ai_project_manager"
      );

      // Create proposal for product owner review
      const proposalId = await db.createProposal({
        projectId,
        proposalType: "strategy",
        title: `Strategy Proposal for ${project.name}`,
        content: JSON.stringify({
          content: strategyContent,
          documentUrl: docResult.data?.url,
        }),
        createdBy: this.agentId,
        status: "pending_review",
      });

      await this.logActivity(undefined, "Strategy proposal submitted", `Proposal ID: ${proposalId}`);
      await db.updateAgentStatus(this.agentId, "idle");
    } catch (error) {
      await db.updateAgentStatus(this.agentId, "blocked");
      await this.logActivity(undefined, "Project analysis failed", error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Break down an approved strategy into subsystems, modules, and tasks
   */
  async breakdownProject(projectId: number): Promise<void> {
    try {
      await db.updateAgentStatus(this.agentId, "working");
      await this.logActivity(undefined, "Starting project breakdown", `Project ID: ${projectId}`);

      // Get project and strategy
      const project = await db.getProjectById(projectId);
      const knowledge = await db.getProjectKnowledge(projectId);
      const strategy = knowledge.find((k) => k.key === "approved_strategy");

      if (!project || !strategy) {
        throw new Error("Project or strategy not found");
      }

      // Generate project breakdown
      const breakdownPrompt = `Based on the approved strategy, break down this project into subsystems, modules, and tasks:

Project: ${project.name}
Strategy: ${strategy.value}

Create a detailed breakdown with:
1. Subsystems (major functional areas)
2. Modules within each subsystem
3. Tasks for each module with:
   - Clear title and description
   - Specific requirements
   - Assigned agent role
   - Dependencies

Return the breakdown as a JSON structure:
{
  "subsystems": [
    {
      "name": "string",
      "description": "string",
      "modules": [
        {
          "name": "string",
          "description": "string",
          "tasks": [
            {
              "title": "string",
              "description": "string",
              "requirements": "string",
              "assignedRole": "research|architecture|ui_ux|frontend|backend|devops|qa"
            }
          ]
        }
      ]
    }
  ]
}`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: this.getSystemPrompt() },
          { role: "user", content: breakdownPrompt },
        ] as any,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "project_breakdown",
            strict: true,
            schema: {
              type: "object",
              properties: {
                subsystems: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      description: { type: "string" },
                      modules: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            name: { type: "string" },
                            description: { type: "string" },
                            tasks: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: {
                                  title: { type: "string" },
                                  description: { type: "string" },
                                  requirements: { type: "string" },
                                  assignedRole: { type: "string" },
                                },
                                required: ["title", "description", "requirements", "assignedRole"],
                                additionalProperties: false,
                              },
                            },
                          },
                          required: ["name", "description", "tasks"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["name", "description", "modules"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["subsystems"],
              additionalProperties: false,
            },
          },
        },
      });

      const breakdownContent = response.choices[0]?.message?.content;
      if (typeof breakdownContent !== "string") {
        throw new Error("Invalid breakdown response");
      }

      const breakdown = JSON.parse(breakdownContent);

      // Create subsystems, modules, and tasks in database
      for (const subsystem of breakdown.subsystems) {
        const subsystemId = await db.createSubsystem({
          projectId,
          name: subsystem.name,
          description: subsystem.description,
          status: "planned",
        });

        for (const module of subsystem.modules) {
          const moduleId = await db.createModule({
            subsystemId,
            name: module.name,
            description: module.description,
            status: "planned",
          });

          for (const task of module.tasks) {
            // Find agent by role
            const agents = await db.getAllAgents();
            const agent = agents.find((a) => a.role === task.assignedRole);

            await db.createTask({
              moduleId,
              title: task.title,
              description: task.description,
              requirements: task.requirements,
              assignedAgentId: agent?.id,
              status: "pending",
              progressPercentage: 0,
            });
          }
        }
      }

      // Create task assignment proposal
      const proposalId = await db.createProposal({
        projectId,
        proposalType: "task_assignment",
        title: `Task Assignments for ${project.name}`,
        content: JSON.stringify({
          content: `Project has been broken down into ${breakdown.subsystems.length} subsystems with tasks assigned to specialist agents.`,
          breakdown,
        }),
        createdBy: this.agentId,
        status: "pending_review",
      });

      await this.logActivity(undefined, "Project breakdown completed", `Proposal ID: ${proposalId}`);
      await db.updateAgentStatus(this.agentId, "idle");
    } catch (error) {
      await db.updateAgentStatus(this.agentId, "blocked");
      await this.logActivity(undefined, "Project breakdown failed", error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
}
