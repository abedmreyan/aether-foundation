import * as db from "./db";

/**
 * Initialize AI agents in the database
 * Run this script once to create the agent team
 */
async function initializeAgents() {
  console.log("Initializing AI agents...");

  const agents = [
    {
      name: "Atlas - AI Project Manager",
      role: "project_manager" as const,
      specialization: "Strategic planning, project decomposition, team coordination, and stakeholder communication",
      status: "idle" as const,
    },
    {
      name: "Sage - Research Agent",
      role: "research" as const,
      specialization: "Market research, competitive analysis, technical feasibility studies, and information gathering",
      status: "idle" as const,
    },
    {
      name: "Architect - System Designer",
      role: "architecture" as const,
      specialization: "System architecture design, data modeling, API specifications, and technology selection",
      status: "idle" as const,
    },
    {
      name: "Pixel - UI/UX Designer",
      role: "ui_ux" as const,
      specialization: "User interface design, user experience optimization, wireframing, and design systems",
      status: "idle" as const,
    },
    {
      name: "React - Frontend Developer",
      role: "frontend" as const,
      specialization: "Frontend development, React/Vue/Angular, responsive design, and client-side optimization",
      status: "idle" as const,
    },
    {
      name: "Node - Backend Developer",
      role: "backend" as const,
      specialization: "Backend development, API design, database management, and server-side logic",
      status: "idle" as const,
    },
    {
      name: "Deploy - DevOps Engineer",
      role: "devops" as const,
      specialization: "Deployment automation, infrastructure management, CI/CD pipelines, and monitoring",
      status: "idle" as const,
    },
    {
      name: "Test - QA Engineer",
      role: "qa" as const,
      specialization: "Testing, quality assurance, bug tracking, and validation",
      status: "idle" as const,
    },
  ];

  for (const agent of agents) {
    try {
      const agentId = await db.createAgent(agent);
      console.log(`✓ Created ${agent.name} (ID: ${agentId})`);
    } catch (error) {
      console.error(`✗ Failed to create ${agent.name}:`, error);
    }
  }

  console.log("\nAgent initialization complete!");
  process.exit(0);
}

initializeAgents().catch((error) => {
  console.error("Failed to initialize agents:", error);
  process.exit(1);
});
