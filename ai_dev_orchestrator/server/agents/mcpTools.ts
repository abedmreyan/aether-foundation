/**
 * MCP Tool Registry - Maps tools to agent roles
 */

export const MCP_TOOLS_BY_ROLE = {
    project_manager: [
        "documentation.createDoc",
        "tasks.createTask",
        "github.createIssue",
    ],
    research: [
        "perplexity.search",
        "perplexity.research",
        "documentation.createDoc",
    ],
    architecture: [
        "documentation.createDoc",
        "github.createFile",
        "database.createTable",
    ],
    ui_ux: [
        "documentation.createDoc",
        "github.createFile",
    ],
    frontend: [
        "github.createFile",
        "github.createPR",
        "deployment.deployNetlify",
    ],
    backend: [
        "github.createFile",
        "github.createPR",
        "database.createTable",
        "database.query",
        "supabase.query",
    ],
    devops: [
        "deployment.deployNetlify",
        "deployment.deployCloudRun",
        "gcp.createStorageBucket",
        "gcp.deploCloudRun",
    ],
    qa: [
        "github.createIssue",
        "documentation.createDoc",
    ],
} as const;

export const TOOL_DESCRIPTIONS: Record<string, string> = {
    // Research
    "perplexity.search": "Search the web and get AI-powered research summaries",
    "perplexity.research": "Deep research on a topic with sources and citations",

    // Documentation
    "documentation.createDoc": "Create a Google Doc for specs, designs, or documentation",

    // Version Control
    "github.createFile": "Create or update files in the GitHub repository",
    "github.createPR": "Create a pull request for code review",
    "github.createIssue": "Create an issue to track bugs or features",
    "github.listRepos": "List available repositories",

    // Database
    "database.createTable": "Create a table in Supabase database",
    "database.query": "Query the Supabase database",
    "supabase.query": "Execute SQL query on Supabase",
    "supabase.createTable": "Create table in Supabase",

    // Deployment
    "deployment.deployNetlify": "Deploy frontend to Netlify",
    "deployment.deployCloudRun": "Deploy backend to Google Cloud Run",

    // GCP
    "gcp.createStorageBucket": "Create a Google Cloud Storage bucket",
    "gcp.deployCloudRun": "Deploy service to Google Cloud Run",
    "gcp.createSqlDatabase": "Create Cloud SQL database",

    // Tasks
    "tasks.createTask": "Create a task in Google Tasks",
    "tasks.updateTask": "Update task status in Google Tasks",

    // Gemini
    "gemini.generateCode": "Generate code using Gemini AI",
    "gemini.explainCode": "Get code explanation from Gemini",
    "gemini.reviewCode": "Get code review feedback from Gemini",
};

/**
 * Get tools available for a specific agent role
 */
export function getToolsForRole(role: keyof typeof MCP_TOOLS_BY_ROLE): string[] {
    return MCP_TOOLS_BY_ROLE[role] || [];
}

/**
 * Get description for a specific tool
 */
export function getToolDescription(toolName: string): string {
    return TOOL_DESCRIPTIONS[toolName] || "No description available";
}

/**
 * Build tool reminder section for agent prompts
 */
export function buildToolReminder(role: keyof typeof MCP_TOOLS_BY_ROLE): string {
    const tools = getToolsForRole(role);

    if (tools.length === 0) {
        return "";
    }

    const toolList = tools
        .map(tool => `  - **${tool}**: ${getToolDescription(tool)}`)
        .join("\n");

    return `
## 🛠️ Available MCP Tools

You have access to these tools via the MCP server:

${toolList}

**Important**: Always use these tools when they can help with your task. Call them via the MCP client instead of doing manual work.

**Example**: Instead of manually writing code, use \`gemini.generateCode\` or \`github.createFile\`.
`;
}
