import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Bot, Rocket, Book, Wrench, Workflow, Copy, Check, Users,
    FileCode, Database, Cloud, TestTube, Palette, Search, Layers,
    Code, Terminal, Play, Target, AlertCircle, ArrowLeft, FolderOpen
} from "lucide-react";
import { toast } from "sonner";

// Agent definitions with IDE prompts
const agents = [
    {
        id: "coordinator",
        name: "Coordinator",
        role: "project_manager",
        icon: Layers,
        color: "text-purple-500",
        description: "Master orchestrator that analyzes requests and delegates to specialists",
        capabilities: ["Task routing", "Context assembly", "Multi-agent coordination", "Progress tracking"],
        cursorAgent: "coordinator.md",
        prompt: "@coordinator Analyze and delegate: [YOUR TASK]",
    },
    {
        id: "architect",
        name: "Architect",
        role: "architecture",
        icon: Database,
        color: "text-cyan-500",
        description: "System design, types, schemas, and module structure",
        capabilities: ["System design", "Type definitions", "Refactoring", "Design patterns"],
        cursorAgent: "architect.md",
        prompt: "@architect Design system for: [YOUR TASK]",
    },
    {
        id: "frontend",
        name: "Frontend Developer",
        role: "frontend",
        icon: FileCode,
        color: "text-green-500",
        description: "React components, UI/UX implementation, client-side logic",
        capabilities: ["React/TypeScript", "UI components", "Styling", "State management"],
        cursorAgent: "frontend.md",
        prompt: "@frontend Create component: [YOUR TASK]",
    },
    {
        id: "backend",
        name: "Backend Developer",
        role: "backend",
        icon: Database,
        color: "text-orange-500",
        description: "API endpoints, database queries, business logic",
        capabilities: ["tRPC endpoints", "Database queries", "Business logic", "Services"],
        cursorAgent: "services.md",
        prompt: "@backend Implement API: [YOUR TASK]",
    },
    {
        id: "devops",
        name: "DevOps Engineer",
        role: "devops",
        icon: Cloud,
        color: "text-indigo-500",
        description: "Deployment, CI/CD, infrastructure, monitoring",
        capabilities: ["Deployment", "CI/CD pipelines", "Infrastructure", "Monitoring"],
        cursorAgent: "devops.md",
        prompt: "@devops Deploy: [YOUR TASK]",
    },
    {
        id: "qa",
        name: "QA Engineer",
        role: "qa",
        icon: TestTube,
        color: "text-red-500",
        description: "Testing, debugging, quality assurance",
        capabilities: ["Unit testing", "Integration testing", "Bug investigation", "Validation"],
        cursorAgent: "qa.md",
        prompt: "@qa Test: [YOUR TASK]",
    },
    {
        id: "ux",
        name: "UX Designer",
        role: "ui_ux",
        icon: Palette,
        color: "text-pink-500",
        description: "User experience design, accessibility, visual aesthetics",
        capabilities: ["Design systems", "Accessibility", "User flows", "Visual design"],
        cursorAgent: "ux-designer.md",
        prompt: "@ux Design: [YOUR TASK]",
    },
    {
        id: "researcher",
        name: "Researcher",
        role: "research",
        icon: Search,
        color: "text-blue-500",
        description: "Technology evaluation, best practices research",
        capabilities: ["Market research", "Tech evaluation", "Best practices", "Competitive analysis"],
        cursorAgent: "researcher.md",
        prompt: "@researcher Research: [YOUR TASK]",
    },
];

// Workflow definitions
const workflows = [
    {
        category: "Feature Development",
        icon: Rocket,
        color: "bg-green-500",
        items: [
            {
                name: "Full Feature",
                file: "feature-development/full-feature.md",
                description: "End-to-end feature implementation",
                agents: ["coordinator", "architect", "frontend", "backend", "qa"],
                duration: "8+ hours"
            },
            {
                name: "New API Endpoint",
                file: "feature-development/new-api-endpoint.md",
                description: "Create tRPC endpoints",
                agents: ["backend", "qa"],
                duration: "2-4 hours"
            },
            {
                name: "New UI Component",
                file: "feature-development/new-ui-component.md",
                description: "Build React components",
                agents: ["frontend", "qa"],
                duration: "2-4 hours"
            },
        ]
    },
    {
        category: "Maintenance",
        icon: Wrench,
        color: "bg-yellow-500",
        items: [
            {
                name: "Bug Fix",
                file: "maintenance/bug-fix.md",
                description: "Investigate and fix bugs",
                agents: ["qa", "backend", "frontend"],
                duration: "1-4 hours"
            },
            {
                name: "Refactoring",
                file: "maintenance/refactoring.md",
                description: "Code quality improvements",
                agents: ["architect", "frontend", "backend"],
                duration: "4-8 hours"
            },
        ]
    },
    {
        category: "Integration",
        icon: Workflow,
        color: "bg-blue-500",
        items: [
            {
                name: "Deployment",
                file: "integration/deployment.md",
                description: "Deploy to production",
                agents: ["devops", "qa"],
                duration: "1-2 hours"
            },
            {
                name: "Third-Party Integration",
                file: "integration/third-party-integration.md",
                description: "External service integration",
                agents: ["backend", "devops"],
                duration: "4-8 hours"
            },
            {
                name: "Process Orchestrator Task",
                file: "integration/process-orchestrator-task.md",
                description: "Execute task from orchestrator",
                agents: ["coordinator"],
                duration: "varies"
            },
        ]
    },
];

// MCP Tools
const mcpTools = [
    {
        name: "Perplexity Search",
        tool: "perplexity_search",
        description: "Search and research using AI",
        usage: 'mcp_dev-mcp_perplexity_search(query: "your search query")',
        example: 'Research best practices for React state management'
    },
    {
        name: "Gemini Code Generation",
        tool: "gemini_generate_code",
        description: "Generate code with Gemini AI",
        usage: 'mcp_dev-mcp_gemini_generate_code(prompt: "your prompt")',
        example: 'Generate a React component for a data table'
    },
    {
        name: "GitHub Create Issue",
        tool: "github_create_issue",
        description: "Create GitHub issues",
        usage: 'mcp_dev-mcp_github_create_issue(owner, repo, title, body)',
        example: 'Create issue for bug tracking'
    },
    {
        name: "Supabase Query",
        tool: "supabase_query",
        description: "Execute SQL on Supabase",
        usage: 'mcp_dev-mcp_supabase_query(query: "SQL")',
        example: 'SELECT * FROM users WHERE id = 1'
    },
    {
        name: "Netlify Deploy",
        tool: "netlify_deploy",
        description: "Deploy to Netlify",
        usage: 'mcp_dev-mcp_netlify_deploy(siteId, dir)',
        example: 'Deploy ./dist to production'
    },
];

interface ProjectContext {
    projectId: number;
    projectName: string;
    projectPath?: string;
}

export default function Help() {
    const [, setLocation] = useLocation();
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [taskDescription, setTaskDescription] = useState("");
    const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
    const [generatedPrompt, setGeneratedPrompt] = useState<string>("");
    const [projectContext, setProjectContext] = useState<ProjectContext | null>(null);
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

    // Get projects list
    const { data: projects } = trpc.projects.list.useQuery();

    // Load context from sessionStorage on mount
    useEffect(() => {
        const stored = sessionStorage.getItem('helpContext');
        if (stored) {
            try {
                const ctx = JSON.parse(stored);
                setProjectContext(ctx);
                setSelectedProjectId(ctx.projectId);
                sessionStorage.removeItem('helpContext'); // Clear after reading
            } catch (e) {
                console.error('Failed to parse help context');
            }
        }
    }, []);

    // Update project context when selection changes
    useEffect(() => {
        if (selectedProjectId && projects) {
            const project = projects.find(p => p.id === selectedProjectId);
            if (project) {
                setProjectContext({
                    projectId: project.id,
                    projectName: project.name,
                    projectPath: project.localPath,
                });
            }
        }
    }, [selectedProjectId, projects]);

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success("Copied to clipboard");
        setTimeout(() => setCopiedId(null), 2000);
    };

    const generatePrompt = () => {
        if (!taskDescription.trim()) {
            toast.error("Please enter a task description");
            return;
        }

        const workflow = workflows.flatMap(w => w.items).find(i => i.file === selectedWorkflow);

        let prompt = "";

        // Include project context if available
        const projectInfo = projectContext ? `
**Project Context:**
- Project: ${projectContext.projectName}
- ID: ${projectContext.projectId}${projectContext.projectPath ? `
- Path: ${projectContext.projectPath}` : ''}
` : '';

        if (workflow) {
            prompt = `@coordinator Execute ${workflow.name} workflow

**Task:** ${taskDescription}
${projectInfo}
**Context Files to Load:**
- @.agent/workflows/${workflow.file}
- @.agent/context.md
- @.agent/agent-mapping.md

**Workflow Steps:**
1. Follow the workflow guide step-by-step
2. Load relevant source files as needed
3. Verify changes with build/test
4. Report completion with summary

**Agents to Involve:** ${workflow.agents.map(a => agents.find(ag => ag.id === a)?.name).join(", ")}`;
        } else {
            prompt = `@coordinator Analyze and execute task

**Task:** ${taskDescription}
${projectInfo}
**Instructions:**
1. Analyze the task and determine required agents
2. Load relevant context from .agent/ and .cursor/agents/
3. Create execution plan
4. Execute with verification
5. Report completion

**Context Files:**
- @.agent/context.md
- @.agent/file-index.md`;
        }

        setGeneratedPrompt(prompt);
        toast.success("Prompt generated!");
    };

    return (
        <div className="container py-8">
            {/* Header with Navigation */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        {projectContext && (
                            <Link href={`/projects/${projectContext.projectId}`}>
                                <Button variant="ghost" size="sm">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to {projectContext.projectName}
                                </Button>
                            </Link>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            className="px-3 py-2 border rounded-md text-sm"
                            value={selectedProjectId || ""}
                            onChange={(e) => setSelectedProjectId(e.target.value ? Number(e.target.value) : null)}
                        >
                            <option value="">Select Project (optional)</option>
                            {projects?.map((project) => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <h1 className="text-4xl font-bold mb-2">Help Center</h1>
                <p className="text-muted-foreground">
                    Learn how to use the AI Dev Orchestrator, run tasks in your IDE, and leverage AI agents
                </p>

                {projectContext && (
                    <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <div className="flex items-center gap-2">
                            <FolderOpen className="w-5 h-5 text-primary" />
                            <span className="font-medium">Working with: {projectContext.projectName}</span>
                        </div>
                        {projectContext.projectPath && (
                            <p className="text-sm text-muted-foreground mt-1 font-mono">
                                {projectContext.projectPath}
                            </p>
                        )}
                    </div>
                )}
            </div>

            <Tabs defaultValue="prompt-generator" className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="prompt-generator">Prompt Generator</TabsTrigger>
                    <TabsTrigger value="agents">Agents</TabsTrigger>
                    <TabsTrigger value="workflows">Workflows</TabsTrigger>
                    <TabsTrigger value="tools">MCP Tools</TabsTrigger>
                    <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
                </TabsList>

                {/* Prompt Generator - Now First Tab */}
                <TabsContent value="prompt-generator">
                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="w-5 h-5" />
                                    Generate IDE Prompt
                                    {projectContext && (
                                        <Badge variant="secondary">{projectContext.projectName}</Badge>
                                    )}
                                </CardTitle>
                                <CardDescription>
                                    Describe your task and get an optimized prompt for Cursor or Antigravity
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Task Description</label>
                                    <Textarea
                                        placeholder={`Example: Add a priority field to the ${projectContext?.projectName || 'pipeline'} with High/Medium/Low options`}
                                        value={taskDescription}
                                        onChange={(e) => setTaskDescription(e.target.value)}
                                        rows={4}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Workflow (Optional)</label>
                                    <select
                                        className="w-full px-3 py-2 border rounded-md"
                                        value={selectedWorkflow || ""}
                                        onChange={(e) => setSelectedWorkflow(e.target.value || null)}
                                    >
                                        <option value="">Auto-detect workflow</option>
                                        {workflows.map((cat) => (
                                            <optgroup key={cat.category} label={cat.category}>
                                                {cat.items.map((item) => (
                                                    <option key={item.file} value={item.file}>
                                                        {item.name}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>

                                <Button onClick={generatePrompt} className="w-full">
                                    <Play className="w-4 h-4 mr-2" />
                                    Generate Prompt
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Code className="w-5 h-5" />
                                    Generated Prompt
                                </CardTitle>
                                <CardDescription>
                                    Copy this prompt and paste it in your IDE
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {generatedPrompt ? (
                                    <>
                                        <ScrollArea className="h-80">
                                            <pre className="text-sm whitespace-pre-wrap bg-muted p-4 rounded">
                                                {generatedPrompt}
                                            </pre>
                                        </ScrollArea>
                                        <div className="flex gap-2">
                                            <Button
                                                className="flex-1"
                                                onClick={() => copyToClipboard(generatedPrompt, "generated")}
                                            >
                                                {copiedId === "generated" ? (
                                                    <><Check className="w-4 h-4 mr-2" /> Copied!</>
                                                ) : (
                                                    <><Copy className="w-4 h-4 mr-2" /> Copy Prompt</>
                                                )}
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="h-80 flex items-center justify-center text-center text-muted-foreground">
                                        <div>
                                            <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                            <p>Enter a task description and click Generate</p>
                                            {projectContext && (
                                                <p className="text-sm mt-2">
                                                    Prompts will include {projectContext.projectName} context
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Agents */}
                <TabsContent value="agents">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold">AI Agents</h2>
                            <Badge variant="secondary">{agents.length} agents available</Badge>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {agents.map((agent) => {
                                const Icon = agent.icon;
                                return (
                                    <Card key={agent.id} className="hover:shadow-md transition-shadow">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center`}>
                                                    <Icon className={`w-5 h-5 ${agent.color}`} />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                                                    <CardDescription>{agent.role}</CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <p className="text-sm text-muted-foreground">{agent.description}</p>

                                            <div className="flex flex-wrap gap-1">
                                                {agent.capabilities.map((cap) => (
                                                    <Badge key={cap} variant="outline" className="text-xs">
                                                        {cap}
                                                    </Badge>
                                                ))}
                                            </div>

                                            <div className="pt-2 border-t">
                                                <p className="text-xs text-muted-foreground mb-2">IDE Prompt:</p>
                                                <div className="flex items-center gap-2">
                                                    <code className="flex-1 text-xs bg-muted p-2 rounded truncate">
                                                        {agent.prompt}
                                                    </code>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => copyToClipboard(agent.prompt, agent.id)}
                                                    >
                                                        {copiedId === agent.id ? (
                                                            <Check className="w-4 h-4 text-green-500" />
                                                        ) : (
                                                            <Copy className="w-4 h-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                </TabsContent>

                {/* Workflows */}
                <TabsContent value="workflows">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold">Workflows</h2>
                            <Badge variant="secondary">{workflows.reduce((acc, w) => acc + w.items.length, 0)} workflows</Badge>
                        </div>

                        {workflows.map((category) => {
                            const Icon = category.icon;
                            return (
                                <Card key={category.category}>
                                    <CardHeader>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg ${category.color} flex items-center justify-center`}>
                                                <Icon className="w-5 h-5 text-white" />
                                            </div>
                                            <CardTitle>{category.category}</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                            {category.items.map((workflow) => (
                                                <div
                                                    key={workflow.file}
                                                    className="border rounded-lg p-4 hover:bg-accent transition-colors cursor-pointer"
                                                    onClick={() => {
                                                        setSelectedWorkflow(workflow.file);
                                                        setGeneratedPrompt("");
                                                    }}
                                                >
                                                    <h4 className="font-medium mb-1">{workflow.name}</h4>
                                                    <p className="text-sm text-muted-foreground mb-3">{workflow.description}</p>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex gap-1">
                                                            {workflow.agents.slice(0, 3).map((agentId) => {
                                                                const agent = agents.find(a => a.id === agentId);
                                                                const AgentIcon = agent?.icon || Bot;
                                                                return (
                                                                    <div
                                                                        key={agentId}
                                                                        className={`w-6 h-6 rounded-full bg-muted flex items-center justify-center`}
                                                                        title={agent?.name}
                                                                    >
                                                                        <AgentIcon className={`w-3 h-3 ${agent?.color}`} />
                                                                    </div>
                                                                );
                                                            })}
                                                            {workflow.agents.length > 3 && (
                                                                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                                                                    +{workflow.agents.length - 3}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <Badge variant="outline" className="text-xs">{workflow.duration}</Badge>
                                                    </div>
                                                    <div className="mt-3 pt-3 border-t">
                                                        <code className="text-xs text-muted-foreground">
                                                            .agent/workflows/{workflow.file}
                                                        </code>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </TabsContent>

                {/* MCP Tools */}
                <TabsContent value="tools">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold">MCP Tools</h2>
                            <Badge variant="secondary">{mcpTools.length} tools available</Badge>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5" />
                                    About MCP Tools
                                </CardTitle>
                                <CardDescription>
                                    MCP (Model Context Protocol) tools extend AI capabilities with external services.
                                    These tools are available in both Cursor and Antigravity.
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <div className="grid gap-4 md:grid-cols-2">
                            {mcpTools.map((tool) => (
                                <Card key={tool.tool}>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg">{tool.name}</CardTitle>
                                            <Badge variant="outline">{tool.tool}</Badge>
                                        </div>
                                        <CardDescription>{tool.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Usage:</p>
                                            <code className="text-xs bg-muted p-2 rounded block overflow-x-auto">
                                                {tool.usage}
                                            </code>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Example:</p>
                                            <p className="text-sm">{tool.example}</p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                            onClick={() => copyToClipboard(tool.usage, tool.tool)}
                                        >
                                            {copiedId === tool.tool ? (
                                                <><Check className="w-4 h-4 mr-2" /> Copied</>
                                            ) : (
                                                <><Copy className="w-4 h-4 mr-2" /> Copy Usage</>
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </TabsContent>

                {/* Getting Started */}
                <TabsContent value="getting-started">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bot className="w-5 h-5" />
                                    What is AI Dev Orchestrator?
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    A multi-agent AI system that coordinates specialized AI agents to complete
                                    complex development tasks. Each agent has specific expertise and works together
                                    under the guidance of a coordinator.
                                </p>
                                <div className="space-y-2">
                                    <h4 className="font-medium">Key Features:</h4>
                                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                        <li>8 specialized AI agents</li>
                                        <li>9+ predefined workflows</li>
                                        <li>IDE integration (Cursor & Antigravity)</li>
                                        <li>Task approval workflow</li>
                                        <li>Real-time project analysis</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Play className="w-5 h-5" />
                                    Quick Start
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <div className="flex gap-3">
                                        <Badge className="w-6 h-6 rounded-full flex items-center justify-center">1</Badge>
                                        <div>
                                            <h4 className="font-medium">Import or Create Project</h4>
                                            <p className="text-sm text-muted-foreground">Go to Projects → Import Local</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <Badge className="w-6 h-6 rounded-full flex items-center justify-center">2</Badge>
                                        <div>
                                            <h4 className="font-medium">Create a Task</h4>
                                            <p className="text-sm text-muted-foreground">From project view or use suggested tasks</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <Badge className="w-6 h-6 rounded-full flex items-center justify-center">3</Badge>
                                        <div>
                                            <h4 className="font-medium">Generate IDE Prompt</h4>
                                            <p className="text-sm text-muted-foreground">Use Prompt Generator tab</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <Badge className="w-6 h-6 rounded-full flex items-center justify-center">4</Badge>
                                        <div>
                                            <h4 className="font-medium">Run in IDE</h4>
                                            <p className="text-sm text-muted-foreground">Paste prompt in Cursor or Antigravity</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Terminal className="w-5 h-5" />
                                    Running Tasks in Your IDE
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <h4 className="font-semibold flex items-center gap-2">
                                            <Code className="w-4 h-4" />
                                            Cursor IDE
                                        </h4>
                                        <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                                            <li>Open your project in Cursor</li>
                                            <li>Press <code className="bg-muted px-1 rounded">Cmd+K</code> for Composer</li>
                                            <li>Paste the generated prompt</li>
                                            <li>Let the agent load context files</li>
                                            <li>Review and approve changes</li>
                                        </ol>
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="font-semibold flex items-center gap-2">
                                            <Bot className="w-4 h-4" />
                                            Antigravity
                                        </h4>
                                        <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                                            <li>Send the generated prompt to Antigravity</li>
                                            <li>Antigravity will read context and workflows</li>
                                            <li>Follow task boundary progress updates</li>
                                            <li>Review artifacts and code changes</li>
                                            <li>Approve via notify_user messages</li>
                                        </ol>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
