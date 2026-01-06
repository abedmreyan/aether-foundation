import { trpc } from "@/lib/trpc";
import * as db from "../db-sqlite";
import { subsystems, modules } from "../../drizzle/schema-sqlite";

/**
 * Task Generator Service
 * Generates intelligent tasks based on project state and Aether business proposal
 */

// Aether Foundation MVP milestones from business proposal
const AETHER_MILESTONES = {
    month_1_4: {
        phase: "MVP Development",
        goals: [
            "Core platform features",
            "Data import and organization",
            "Basic analytics engine",
            "User authentication",
            "Dashboard interface",
        ],
    },
    month_4_6: {
        phase: "Beta Launch",
        goals: [
            "User onboarding flow",
            "Help documentation",
            "Feedback collection",
            "Bug fixes and optimization",
            "Performance monitoring",
        ],
    },
    month_6_12: {
        phase: "Growth & Iteration",
        goals: [
            "Advanced analytics",
            "Third-party integrations",
            "Mobile responsiveness",
            "Customer support features",
            "Marketing automation",
        ],
    },
};

// Agent role recommendations based on task type
const AGENT_ROLE_MAP: Record<string, string> = {
    authentication: "backend",
    api: "backend",
    database: "data_engineer",
    ui: "frontend",
    component: "frontend",
    design: "ui_ux",
    test: "qa",
    deploy: "devops",
    docs: "content",
    analytics: "data_engineer",
    marketing: "marketing",
    research: "tech_research",
};

export interface GeneratedTask {
    title: string;
    description: string;
    requirements: string;
    suggestedAgentRole: string;
    subsystemName?: string;
    priority: "high" | "medium" | "low";
}

export class TaskGeneratorService {
    /**
     * Generate tasks based on project analysis and business proposal alignment
     */
    static async generateTasksForProject(projectId: number): Promise<GeneratedTask[]> {
        const project = await db.getProjectById(projectId);
        if (!project) throw new Error("Project not found");

        const database = db.getDb();
        const projectSubsystems = await database
            .select()
            .from(subsystems)
            .where(db.eq(subsystems.projectId, projectId));

        // Analyze current project state
        const analysis = await this.analyzeProjectState(project, projectSubsystems);

        // Generate tasks based on gaps
        const tasks = this.generateTasksFromAnalysis(analysis);

        return tasks;
    }

    /**
     * Analyze current project state vs Aether milestones
     */
    static async analyzeProjectState(project: any, projectSubsystems: any[]): Promise<{
        phase: string;
        foundFeatures: string[];
        missingFeatures: string[];
        subsystemGaps: string[];
    }> {
        const foundFeatures: string[] = [];
        const subsystemNames = projectSubsystems.map((s) => s.name.toLowerCase());

        // Check for existing features based on subsystems
        if (subsystemNames.some((n) => n.includes("auth") || n.includes("user"))) {
            foundFeatures.push("authentication");
        }
        if (subsystemNames.some((n) => n.includes("api") || n.includes("backend") || n.includes("server"))) {
            foundFeatures.push("backend_api");
        }
        if (subsystemNames.some((n) => n.includes("frontend") || n.includes("client") || n.includes("ui"))) {
            foundFeatures.push("frontend_ui");
        }
        if (subsystemNames.some((n) => n.includes("database") || n.includes("drizzle") || n.includes("prisma"))) {
            foundFeatures.push("database");
        }
        if (subsystemNames.some((n) => n.includes("test"))) {
            foundFeatures.push("testing");
        }

        // Determine phase based on project status
        let phase = "MVP Development";
        if (project.status === "active" && foundFeatures.length >= 3) {
            phase = "Beta Launch";
        }

        // Identify missing features for current phase
        const currentMilestone = AETHER_MILESTONES.month_1_4;
        const missingFeatures = currentMilestone.goals.filter(
            (g) => !foundFeatures.some((f) => g.toLowerCase().includes(f))
        );

        // Identify subsystem gaps
        const subsystemGaps: string[] = [];
        if (!foundFeatures.includes("authentication")) {
            subsystemGaps.push("Authentication subsystem needed");
        }
        if (!foundFeatures.includes("testing")) {
            subsystemGaps.push("Testing infrastructure needed");
        }
        if (!foundFeatures.includes("database")) {
            subsystemGaps.push("Database layer optimization needed");
        }

        return {
            phase,
            foundFeatures,
            missingFeatures,
            subsystemGaps,
        };
    }

    /**
     * Generate tasks from project analysis
     */
    static generateTasksFromAnalysis(analysis: {
        phase: string;
        foundFeatures: string[];
        missingFeatures: string[];
        subsystemGaps: string[];
    }): GeneratedTask[] {
        const tasks: GeneratedTask[] = [];

        // Generate tasks for missing features
        for (const feature of analysis.missingFeatures.slice(0, 3)) {
            const agentRole = this.suggestAgentRole(feature);
            tasks.push({
                title: `Implement ${feature}`,
                description: `As part of the ${analysis.phase} phase, implement ${feature} following Aether Foundation standards.`,
                requirements: `- Follow Aether brand guidelines\n- Ensure responsive design\n- Add appropriate error handling`,
                suggestedAgentRole: agentRole,
                priority: "high",
            });
        }

        // Generate tasks for subsystem gaps
        for (const gap of analysis.subsystemGaps.slice(0, 2)) {
            tasks.push({
                title: gap.replace(" needed", ""),
                description: `Address infrastructure gap: ${gap}`,
                requirements: `- Review existing architecture\n- Propose solution\n- Implement with tests`,
                suggestedAgentRole: "lead_architect",
                priority: "medium",
            });
        }

        // Add standard improvement tasks
        if (analysis.phase === "MVP Development") {
            tasks.push({
                title: "Create user onboarding flow",
                description: "Design and implement first-time user onboarding experience",
                requirements: "- Welcome screen\n- Feature tutorial\n- Settings configuration",
                suggestedAgentRole: "ui_ux",
                priority: "medium",
            });
        }

        if (analysis.phase === "Beta Launch") {
            tasks.push({
                title: "Add analytics and user feedback",
                description: "Implement user behavior tracking and feedback collection",
                requirements: "- Usage metrics\n- Error tracking\n- User feedback forms",
                suggestedAgentRole: "data_engineer",
                priority: "high",
            });
        }

        return tasks;
    }

    /**
     * Suggest agent role based on feature/task keywords
     */
    static suggestAgentRole(feature: string): string {
        const lowerFeature = feature.toLowerCase();

        for (const [keyword, role] of Object.entries(AGENT_ROLE_MAP)) {
            if (lowerFeature.includes(keyword)) {
                return role;
            }
        }

        // Default to product manager for planning tasks
        return "product_manager";
    }
}
