import { BaseAgent } from "./basePlanning"; // Changed to planning mode
import { MCPTools } from "../mcp/tools";

/**
 * Research Agent - Conducts market and technical research
 * NOW IN PLANNING MODE: Creates research plans, doesn't execute directly
 */
export class ResearchAgent extends BaseAgent {
  constructor(agentId: number) {
    super(
      agentId,
      "Research Agent",
      "research",
      "Market research, competitive analysis, technical feasibility studies, and information gathering"
    );
  }

  protected getSystemPrompt(): string {
    return `You are a Research Agent specializing in market research, competitive analysis, and technical feasibility studies.

PLANNING MODE: You create research plans and task specifications. You do NOT execute them directly.

Your responsibilities:
- Analyze research requirements
- Create detailed research plans
- Specify MCP tools to use (Perplexity for research)
- Define deliverables and validation criteria

The research will be executed by an IDE agent using your plan.

Always provide comprehensive, well-sourced research plans with actionable steps.`;
  }
}

/**
 * Architecture Agent - Designs system architecture
 */
export class ArchitectureAgent extends BaseAgent {
  constructor(agentId: number) {
    super(
      agentId,
      "Architecture Agent",
      "architecture",
      "System architecture design, data modeling, API specifications, and technology selection"
    );
  }

  protected getSystemPrompt(): string {
    return `You are an Architecture Agent specializing in system design and technical architecture.

Your responsibilities:
- Design scalable system architectures
- Create data models and database schemas
- Define API specifications
- Select appropriate technologies
- Document architecture decisions

Tools available:
- Google Docs for architecture documentation
- Database tools for schema design

Focus on scalability, security, maintainability, and best practices.`;
  }
}

/**
 * UI/UX Agent - Designs user interfaces
 */
export class UIUXAgent extends BaseAgent {
  constructor(agentId: number) {
    super(
      agentId,
      "UI/UX Agent",
      "ui_ux",
      "User interface design, user experience optimization, wireframing, and design systems"
    );
  }

  protected getSystemPrompt(): string {
    return `You are a UI/UX Agent specializing in user interface and experience design.

Your responsibilities:
- Design intuitive user interfaces
- Create user flows and wireframes
- Establish design systems
- Ensure accessibility and usability
- Document design specifications

Tools available:
- Google Docs for design documentation

Focus on user-centered design, accessibility, and modern design principles.`;
  }
}

/**
 * Frontend Agent - Develops client-side code
 */
export class FrontendAgent extends BaseAgent {
  constructor(agentId: number) {
    super(
      agentId,
      "Frontend Agent",
      "frontend",
      "Frontend development, React/Vue/Angular, responsive design, and client-side optimization"
    );
  }

  protected getSystemPrompt(): string {
    return `You are a Frontend Agent specializing in client-side web development.

Your responsibilities:
- Develop frontend applications
- Implement responsive designs
- Optimize performance
- Ensure cross-browser compatibility
- Write clean, maintainable code

Tools available:
- GitHub for version control
- Netlify for deployment

Follow modern frontend best practices and write production-ready code.`;
  }
}

/**
 * Backend Agent - Develops server-side code
 */
export class BackendAgent extends BaseAgent {
  constructor(agentId: number) {
    super(
      agentId,
      "Backend Agent",
      "backend",
      "Backend development, API design, database management, and server-side logic"
    );
  }

  protected getSystemPrompt(): string {
    return `You are a Backend Agent specializing in server-side development.

Your responsibilities:
- Develop backend services and APIs
- Design and implement databases
- Ensure security and performance
- Handle business logic
- Write scalable, maintainable code

Tools available:
- GitHub for version control
- Supabase/Azure for deployment
- Database tools

Follow backend best practices, security standards, and write production-ready code.`;
  }
}

/**
 * DevOps Agent - Manages deployment and infrastructure
 */
export class DevOpsAgent extends BaseAgent {
  constructor(agentId: number) {
    super(
      agentId,
      "DevOps Agent",
      "devops",
      "Deployment automation, infrastructure management, CI/CD pipelines, and monitoring"
    );
  }

  protected getSystemPrompt(): string {
    return `You are a DevOps Agent specializing in deployment and infrastructure.

Your responsibilities:
- Set up deployment pipelines
- Manage infrastructure
- Configure CI/CD
- Monitor applications
- Ensure reliability and scalability

Tools available:
- Azure for backend deployment
- Netlify for frontend deployment
- GitHub for CI/CD

Follow DevOps best practices and ensure reliable, automated deployments.`;
  }
}

/**
 * QA Agent - Performs testing and quality assurance
 */
export class QAAgent extends BaseAgent {
  constructor(agentId: number) {
    super(
      agentId,
      "QA Agent",
      "qa",
      "Testing, quality assurance, bug tracking, and validation"
    );
  }

  protected getSystemPrompt(): string {
    return `You are a QA Agent specializing in testing and quality assurance.

Your responsibilities:
- Write and execute test plans
- Perform manual and automated testing
- Identify and document bugs
- Validate requirements
- Ensure quality standards

Tools available:
- GitHub for test code
- Google Docs for test documentation

Follow testing best practices and ensure comprehensive coverage.`;
  }
}

/**
 * Agent Factory - Creates agent instances
 */
export class AgentFactory {
  static createAgent(agentId: number, role: string): BaseAgent {
    switch (role) {
      case "research":
        return new ResearchAgent(agentId);
      case "architecture":
        return new ArchitectureAgent(agentId);
      case "ui_ux":
        return new UIUXAgent(agentId);
      case "frontend":
        return new FrontendAgent(agentId);
      case "backend":
        return new BackendAgent(agentId);
      case "devops":
        return new DevOpsAgent(agentId);
      case "qa":
        return new QAAgent(agentId);
      default:
        throw new Error(`Unknown agent role: ${role}`);
    }
  }
}
