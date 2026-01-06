/**
 * Seed script for Aether AI Corporate Team
 * Creates all 16 agent roles and initializes database
 */
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "orchestrator.db");

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

// Delete existing database for fresh start
if (fs.existsSync(DB_FILE)) {
    fs.unlinkSync(DB_FILE);
    console.log("🗑️  Deleted existing database");
}

const sqlite = new Database(DB_FILE);
sqlite.pragma("journal_mode = WAL");

console.log("📦 Creating tables...");

// Create all tables
sqlite.exec(`
-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    openId TEXT NOT NULL UNIQUE,
    name TEXT,
    email TEXT,
    loginMethod TEXT,
    role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('founder', 'admin', 'member')),
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    lastSignedIn INTEGER NOT NULL
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    localPath TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'paused', 'completed', 'archived')),
    createdBy INTEGER NOT NULL REFERENCES users(id),
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
);

-- Pipelines table (Kanban per department)
CREATE TABLE IF NOT EXISTS pipelines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    projectId INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('development', 'marketing', 'research', 'strategy')),
    stages TEXT NOT NULL,
    createdAt INTEGER NOT NULL
);

-- Subsystems table (logical groupings detected by AI)
CREATE TABLE IF NOT EXISTS subsystems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    projectId INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    path TEXT,
    description TEXT,
    purpose TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    createdAt INTEGER NOT NULL
);

-- Modules table (components within subsystems)
CREATE TABLE IF NOT EXISTS modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subsystemId INTEGER NOT NULL REFERENCES subsystems(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    path TEXT,
    description TEXT,
    files TEXT,
    createdAt INTEGER NOT NULL
);

-- Agents table (16 roles)
CREATE TABLE IF NOT EXISTS agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN (
        'product_manager', 'strategy',
        'coordinator', 'lead_architect', 'frontend', 'backend',
        'data_engineer', 'devops', 'ui_ux', 'qa',
        'tech_research', 'market_research', 'business_analyst',
        'marketing', 'content', 'seo'
    )),
    description TEXT NOT NULL,
    department TEXT NOT NULL CHECK(department IN ('executive', 'development', 'research', 'marketing')),
    status TEXT NOT NULL DEFAULT 'idle' CHECK(status IN ('idle', 'working', 'blocked')),
    currentTaskId INTEGER,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
);

-- Tasks table (with queue ordering and scope)
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pipelineId INTEGER NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    subsystemId INTEGER REFERENCES subsystems(id),
    moduleId INTEGER REFERENCES modules(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    stage TEXT NOT NULL DEFAULT 'Backlog',
    queueOrder INTEGER NOT NULL DEFAULT 0,
    suggestedAgentRole TEXT,
    assignedAgentId INTEGER REFERENCES agents(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'in_progress', 'review', 'completed', 'rejected')),
    generatedPrompt TEXT,
    result TEXT,
    filesChanged TEXT,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    completedAt INTEGER
);

-- Approvals table
CREATE TABLE IF NOT EXISTS approvals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entityType TEXT NOT NULL CHECK(entityType IN ('task', 'content', 'roadmap', 'release', 'research')),
    entityId INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'revision_requested')),
    feedback TEXT,
    decidedBy INTEGER REFERENCES users(id),
    decidedAt INTEGER,
    createdAt INTEGER NOT NULL
);

-- Agent messages table
CREATE TABLE IF NOT EXISTS agentMessages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fromAgentId INTEGER NOT NULL REFERENCES agents(id),
    toAgentId INTEGER NOT NULL REFERENCES agents(id),
    taskId INTEGER REFERENCES tasks(id),
    type TEXT NOT NULL CHECK(type IN ('question', 'handoff', 'feedback', 'blocker', 'qa_result')),
    content TEXT NOT NULL,
    response TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'answered')),
    createdAt INTEGER NOT NULL,
    answeredAt INTEGER
);

-- Research tasks table
CREATE TABLE IF NOT EXISTS researchTasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    projectId INTEGER NOT NULL REFERENCES projects(id),
    topic TEXT NOT NULL,
    query TEXT NOT NULL,
    sources TEXT NOT NULL DEFAULT 'perplexity',
    results TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'researching', 'complete')),
    assignedAgentId INTEGER REFERENCES agents(id),
    createdAt INTEGER NOT NULL,
    completedAt INTEGER
);

-- Content items table
CREATE TABLE IF NOT EXISTS contentItems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    projectId INTEGER NOT NULL REFERENCES projects(id),
    type TEXT NOT NULL CHECK(type IN ('blog', 'social', 'docs', 'video', 'email', 'landing_page')),
    title TEXT NOT NULL,
    content TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'review', 'approved', 'published', 'rejected')),
    createdBy INTEGER REFERENCES agents(id),
    approvedBy INTEGER REFERENCES users(id),
    publishedAt INTEGER,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
);

-- Knowledge base table
CREATE TABLE IF NOT EXISTS knowledgeBase (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    projectId INTEGER NOT NULL REFERENCES projects(id),
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    source TEXT NOT NULL,
    createdAt INTEGER NOT NULL
);
`);

console.log("✅ Tables created");

// Seed default founder user
console.log("👤 Creating default founder user...");

const now = Date.now();

sqlite.exec(`
    INSERT INTO users (openId, name, email, role, createdAt, updatedAt, lastSignedIn)
    VALUES ('founder-default', 'Founder', 'founder@aether.local', 'founder', ${now}, ${now}, ${now})
`);

console.log("✅ Default founder user created (ID: 1)");

// Seed agents
console.log("🤖 Seeding agents...");

const agentData = [
    // Executive
    { name: "PM Agent", role: "product_manager", description: "Product vision, roadmap, feature prioritization, sprint planning", department: "executive" },
    { name: "Strategy Agent", role: "strategy", description: "Business strategy, market positioning, go-to-market, partnerships", department: "executive" },

    // Development
    { name: "Sprint Coordinator", role: "coordinator", description: "Task distribution, standups, blocker resolution", department: "development" },
    { name: "Lead Architect", role: "lead_architect", description: "Technical decisions, architecture, code standards", department: "development" },
    { name: "Frontend Dev", role: "frontend", description: "React/TypeScript UI implementation", department: "development" },
    { name: "Backend Dev", role: "backend", description: "API, server logic, business logic", department: "development" },
    { name: "Data Engineer", role: "data_engineer", description: "Databases, ETLs, data pipelines", department: "development" },
    { name: "DevOps Engineer", role: "devops", description: "CI/CD, deployment, infrastructure", department: "development" },
    { name: "UI/UX Designer", role: "ui_ux", description: "Design systems, user flows, prototypes", department: "development" },
    { name: "QA Engineer", role: "qa", description: "Testing, quality gates, code review", department: "development" },

    // Research (on-demand via Perplexity)
    { name: "Tech Researcher", role: "tech_research", description: "Technology evaluation, best practices, POCs", department: "research" },
    { name: "Market Researcher", role: "market_research", description: "Competitor analysis, market gaps, user research", department: "research" },
    { name: "Business Analyst", role: "business_analyst", description: "Metrics, analytics, ROI analysis", department: "research" },

    // Marketing
    { name: "Marketing Specialist", role: "marketing", description: "Go-to-market, campaigns, branding", department: "marketing" },
    { name: "Content Creator", role: "content", description: "Blogs, social media, documentation", department: "marketing" },
    { name: "SEO Specialist", role: "seo", description: "Keywords, search optimization, analytics", department: "marketing" },
];

const insertAgent = sqlite.prepare(`
    INSERT INTO agents (name, role, description, department, status, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, 'idle', ?, ?)
`);

for (const agent of agentData) {
    insertAgent.run(agent.name, agent.role, agent.description, agent.department, now, now);
}

console.log(`✅ Created ${agentData.length} agents`);

// Verify
const agentCount = sqlite.prepare("SELECT COUNT(*) as count FROM agents").get() as { count: number };
console.log(`📊 Total agents in database: ${agentCount.count}`);

const byDept = sqlite.prepare("SELECT department, COUNT(*) as count FROM agents GROUP BY department").all();
console.log("📊 Agents by department:");
for (const row of byDept as { department: string; count: number }[]) {
    console.log(`   ${row.department}: ${row.count}`);
}

sqlite.close();
console.log("\n🎉 Database seeded successfully!");
console.log(`📁 Database file: ${DB_FILE}`);
