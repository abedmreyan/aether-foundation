import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("Project Management", () => {
  let testProjectId: number;

  beforeAll(async () => {
    // Create a test project for all tests in this suite
    const project = await db.createProject({
      name: "Test E-commerce Platform",
      description: "A comprehensive e-commerce platform with user management, product catalog, shopping cart, and payment processing.",
      status: "ideation",
      createdBy: 1, // Test user ID
    });
    testProjectId = project.id;
  });

  it("should create a new project", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.projects.create({
      name: "Another Test Project",
      description: "Testing project creation via tRPC",
    });

    expect(result).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
    expect(result.name).toBe("Another Test Project");
    expect(result.status).toBe("ideation");
  });

  it("should list all projects", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const projects = await caller.projects.list();

    expect(projects).toBeDefined();
    expect(Array.isArray(projects)).toBe(true);
    expect(projects.length).toBeGreaterThan(0);
  });

  it("should get project by ID", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const project = await caller.projects.getById({ projectId: testProjectId });

    expect(project).toBeDefined();
    expect(project?.id).toBe(testProjectId);
    expect(project?.name).toBe("Test E-commerce Platform");
  });

  it("should update project status", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    await caller.projects.updateStatus({
      projectId: testProjectId,
      status: "strategy_review",
    });

    const project = await caller.projects.getById({ projectId: testProjectId });
    expect(project?.status).toBe("strategy_review");
  });
});

describe("Proposal Workflows", () => {
  let testProjectId: number;
  let testProposalId: number;

  beforeAll(async () => {
    // Create a test project
    const project = await db.createProject({
      name: "Test Project for Proposals",
      description: "Testing proposal workflows",
      status: "ideation",
      createdBy: 1, // Test user ID
    });
    testProjectId = project.id;
  });

  it("should create a proposal", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Get AI PM agent
    const agents = await db.getAllAgents();
    const pmAgent = agents.find((a) => a.role === "project_manager");
    expect(pmAgent).toBeDefined();

    const result = await caller.proposals.create({
      projectId: testProjectId,
      proposalType: "strategy",
      title: "Test Strategy Proposal",
      content: JSON.stringify({
        content: "This is a test strategy proposal with comprehensive analysis.",
      }),
      createdBy: pmAgent!.id,
    });

    expect(result).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
    expect(result.status).toBe("pending_review");

    testProposalId = result.id;
  });

  it("should list proposals by project", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const proposals = await caller.proposals.listByProject({ projectId: testProjectId });

    expect(proposals).toBeDefined();
    expect(Array.isArray(proposals)).toBe(true);
    expect(proposals.length).toBeGreaterThan(0);
  });

  it("should approve a proposal", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    await caller.proposals.approve({
      proposalId: testProposalId,
      feedback: "Looks good, approved!",
    });

    const proposals = await caller.proposals.listByProject({ projectId: testProjectId });
    const proposal = proposals.find((p) => p.id === testProposalId);

    expect(proposal?.status).toBe("approved");
    expect(proposal?.feedback).toBe("Looks good, approved!");
  });

  it("should reject a proposal", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Create another proposal to reject
    const agents = await db.getAllAgents();
    const pmAgent = agents.find((a) => a.role === "project_manager");

    const newProposal = await caller.proposals.create({
      projectId: testProjectId,
      proposalType: "task_assignment",
      title: "Test Task Assignment",
      content: JSON.stringify({ content: "Task assignments" }),
      createdBy: pmAgent!.id,
    });

    await caller.proposals.reject({
      proposalId: newProposal.id,
      feedback: "Needs more detail on timeline",
    });

    const proposals = await caller.proposals.listByProject({ projectId: testProjectId });
    const proposal = proposals.find((p) => p.id === newProposal.id);

    expect(proposal?.status).toBe("rejected");
    expect(proposal?.feedback).toBe("Needs more detail on timeline");
  });
});

describe("Agent Management", () => {
  it("should list all agents", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const agents = await caller.agents.list();

    expect(agents).toBeDefined();
    expect(Array.isArray(agents)).toBe(true);
    expect(agents.length).toBe(8); // We initialized 8 agents
  });

  it("should have all required agent roles", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const agents = await caller.agents.list();
    const roles = agents.map((a) => a.role);

    expect(roles).toContain("project_manager");
    expect(roles).toContain("research");
    expect(roles).toContain("architecture");
    expect(roles).toContain("ui_ux");
    expect(roles).toContain("frontend");
    expect(roles).toContain("backend");
    expect(roles).toContain("devops");
    expect(roles).toContain("qa");
  });

  it("should get agent by ID", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const agents = await caller.agents.list();
    const firstAgent = agents[0];

    const agent = await caller.agents.getById({ agentId: firstAgent.id });

    expect(agent).toBeDefined();
    expect(agent?.id).toBe(firstAgent.id);
    expect(agent?.name).toBe(firstAgent.name);
  });

  it("should get activity logs for an agent", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const agents = await caller.agents.list();
    const pmAgent = agents.find((a) => a.role === "project_manager");
    expect(pmAgent).toBeDefined();

    const logs = await caller.agents.getActivityLogs({
      agentId: pmAgent!.id,
      limit: 10,
    });

    expect(logs).toBeDefined();
    expect(Array.isArray(logs)).toBe(true);
  });
});

describe("Knowledge Base", () => {
  let testProjectId: number;

  beforeAll(async () => {
    const project = await db.createProject({
      name: "Test Project for Knowledge",
      description: "Testing knowledge base",
      status: "ideation",
      createdBy: 1, // Test user ID
    });
    testProjectId = project.id;
  });

  it("should add knowledge entry", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    await caller.knowledge.add({
      projectId: testProjectId,
      key: "test_key",
      value: "test_value",
      source: "test",
    });

    const knowledge = await caller.knowledge.getByProject({ projectId: testProjectId });
    expect(knowledge).toBeDefined();
    expect(knowledge.length).toBeGreaterThan(0);
  });

  it("should retrieve knowledge by project", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const knowledge = await caller.knowledge.getByProject({ projectId: testProjectId });

    expect(knowledge).toBeDefined();
    expect(Array.isArray(knowledge)).toBe(true);
    const entry = knowledge.find((k) => k.key === "test_key");
    expect(entry).toBeDefined();
    expect(entry?.value).toBe("test_value");
  });
});
