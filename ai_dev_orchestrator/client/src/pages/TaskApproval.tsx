import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    CheckCircle2,
    XCircle,
    Clock,
    FileText,
    Code,
    ChevronDown,
    ChevronUp,
    Plus,
    Play,
    Loader2,
    Copy,
    Check,
    Bot,
    AlertCircle,
    RefreshCw
} from "lucide-react";
import { toast } from "sonner";

export default function TaskApproval() {
    const [selectedProject, setSelectedProject] = useState<number | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newTask, setNewTask] = useState({
        title: "",
        description: "",
        requirements: "",
        workflow: "",
    });

    // Get projects
    const { data: projects } = trpc.projects.list.useQuery();

    // Get modules for selected project
    const { data: subsystems } = trpc.projects.getSubsystems.useQuery(
        { projectId: selectedProject! },
        { enabled: selectedProject !== null }
    );

    // Get pending tasks for selected project from taskExport
    const { data: pendingTasks, refetch, isLoading } = trpc.taskExport.getPendingTasks.useQuery(
        { projectId: selectedProject! },
        { enabled: selectedProject !== null }
    );

    // Get agents
    const { data: agents } = trpc.agents.list.useQuery();

    // Create task mutation
    const createTaskMutation = trpc.tasks.create.useMutation({
        onSuccess: () => {
            toast.success("Task created successfully!");
            setIsCreateOpen(false);
            setNewTask({ title: "", description: "", requirements: "", workflow: "" });
            refetch();
        },
        onError: (error) => {
            toast.error("Failed to create task", {
                description: error.message,
            });
        },
    });

    const handleCreateTask = () => {
        if (!newTask.title.trim() || !newTask.description.trim()) {
            toast.error("Please fill in title and description");
            return;
        }

        // Find first module for the project
        const firstModule = subsystems?.flatMap(s => s.modules || [])?.[0];

        createTaskMutation.mutate({
            moduleId: firstModule?.id || 1,
            title: newTask.title,
            description: newTask.description,
            requirements: newTask.requirements || newTask.description,
        });
    };

    const selectedProjectData = projects?.find(p => p.id === selectedProject);

    return (
        <div className="container py-8">
            <div className="mb-8 flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Task Management</h1>
                    <p className="text-muted-foreground">
                        Create, review, and approve tasks for AI agents to execute
                    </p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button disabled={!selectedProject}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Task
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Create New Task</DialogTitle>
                            <DialogDescription>
                                Define a task for AI agents to execute. Tasks will be routed to the appropriate specialist.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Task Title</label>
                                <Input
                                    placeholder="e.g., Add priority field to student pipeline"
                                    value={newTask.title}
                                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Description</label>
                                <Textarea
                                    placeholder="Detailed description of what needs to be done..."
                                    value={newTask.description}
                                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                    rows={4}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Requirements (Optional)</label>
                                <Textarea
                                    placeholder="Specific requirements, constraints, or acceptance criteria..."
                                    value={newTask.requirements}
                                    onChange={(e) => setNewTask({ ...newTask, requirements: e.target.value })}
                                    rows={3}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Workflow (Optional)</label>
                                <select
                                    className="w-full px-3 py-2 border rounded-md"
                                    value={newTask.workflow}
                                    onChange={(e) => setNewTask({ ...newTask, workflow: e.target.value })}
                                >
                                    <option value="">Auto-detect workflow</option>
                                    <optgroup label="Feature Development">
                                        <option value="feature-development/full-feature.md">Full Feature</option>
                                        <option value="feature-development/new-api-endpoint.md">New API Endpoint</option>
                                        <option value="feature-development/new-ui-component.md">New UI Component</option>
                                    </optgroup>
                                    <optgroup label="Maintenance">
                                        <option value="maintenance/bug-fix.md">Bug Fix</option>
                                        <option value="maintenance/refactoring.md">Refactoring</option>
                                    </optgroup>
                                    <optgroup label="Integration">
                                        <option value="integration/deployment.md">Deployment</option>
                                        <option value="integration/process-orchestrator-task.md">Process Orchestrator Task</option>
                                    </optgroup>
                                </select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreateTask} disabled={createTaskMutation.isPending}>
                                {createTaskMutation.isPending ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
                                ) : (
                                    <><Plus className="w-4 h-4 mr-2" /> Create Task</>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Project Selector */}
            <Card className="mb-6">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Select Project</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 items-center">
                        <select
                            className="flex-1 max-w-md px-3 py-2 border rounded-md"
                            value={selectedProject || ""}
                            onChange={(e) => setSelectedProject(Number(e.target.value))}
                        >
                            <option value="">Choose a project...</option>
                            {projects?.map((project) => (
                                <option key={project.id} value={project.id}>
                                    {project.name} ({project.status})
                                </option>
                            ))}
                        </select>
                        {selectedProject && (
                            <Button variant="outline" size="icon" onClick={() => refetch()}>
                                <RefreshCw className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                    {selectedProjectData && (
                        <p className="text-sm text-muted-foreground mt-2">
                            {selectedProjectData.description}
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Main Content */}
            {selectedProject && (
                <Tabs defaultValue="pending" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="pending">
                            Pending Tasks
                            {pendingTasks && pendingTasks.length > 0 && (
                                <Badge variant="secondary" className="ml-2">{pendingTasks.length}</Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="all">All Tasks</TabsTrigger>
                        <TabsTrigger value="agents">Agent Assignment</TabsTrigger>
                    </TabsList>

                    <TabsContent value="pending" className="space-y-4">
                        {isLoading ? (
                            <Card>
                                <CardContent className="py-8 text-center">
                                    <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
                                    <p className="text-muted-foreground">Loading tasks...</p>
                                </CardContent>
                            </Card>
                        ) : pendingTasks && pendingTasks.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <h3 className="text-lg font-medium mb-2">No Pending Tasks</h3>
                                    <p className="text-muted-foreground mb-4">
                                        Create a new task to get started, or use the Help page to generate IDE prompts
                                    </p>
                                    <div className="flex gap-2 justify-center">
                                        <Button onClick={() => setIsCreateOpen(true)}>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Create Task
                                        </Button>
                                        <Button variant="outline" onClick={() => window.location.href = '/help'}>
                                            View Help
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {pendingTasks?.map((task) => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        projectId={selectedProject}
                                        agents={agents || []}
                                        onUpdate={() => refetch()}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="all">
                        <AllTasksView projectId={selectedProject} agents={agents || []} />
                    </TabsContent>

                    <TabsContent value="agents">
                        <AgentAssignmentView agents={agents || []} projectId={selectedProject} />
                    </TabsContent>
                </Tabs>
            )}

            {/* Empty State */}
            {!selectedProject && (
                <Card>
                    <CardContent className="py-16 text-center">
                        <Bot className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <h2 className="text-xl font-semibold mb-2">Select a Project</h2>
                        <p className="text-muted-foreground mb-4">
                            Choose a project above to view and manage tasks
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// Task Card Component
interface TaskCardProps {
    task: any;
    projectId: number;
    agents: any[];
    onUpdate: () => void;
}

function TaskCard({ task, projectId, agents, onUpdate }: TaskCardProps) {
    const [expanded, setExpanded] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [showFeedback, setShowFeedback] = useState(false);
    const [copiedPrompt, setCopiedPrompt] = useState(false);

    const generateMutation = trpc.taskExport.generateTaskSpec.useMutation();
    const approveMutation = trpc.taskExport.approveTask.useMutation();
    const rejectMutation = trpc.taskExport.rejectTask.useMutation();

    const handleGenerateSpec = async () => {
        try {
            const result = await generateMutation.mutateAsync({
                projectId,
                taskId: task.id,
                researchSummary: "Task spec generated from orchestrator",
            });

            toast.success("Task spec generated!", {
                description: `Created ${result.taskId} - Ready for approval`,
            });
            onUpdate();
        } catch (error) {
            toast.error("Failed to generate task spec", {
                description: error instanceof Error ? error.message : "Unknown error",
            });
        }
    };

    const handleApprove = async () => {
        try {
            await approveMutation.mutateAsync({
                taskId: `task-${task.id}`,
                projectId,
                feedback,
            });

            toast.success("Task approved!", {
                description: "Task moved to .tasks/current-task.json for IDE execution",
            });
            onUpdate();
        } catch (error) {
            toast.error("Failed to approve task", {
                description: error instanceof Error ? error.message : "Unknown error",
            });
        }
    };

    const handleReject = async () => {
        if (!feedback.trim()) {
            toast.error("Feedback required for rejection");
            return;
        }

        try {
            await rejectMutation.mutateAsync({
                taskId: `task-${task.id}`,
                projectId,
                feedback,
            });

            toast.success("Task rejected", {
                description: "Feedback sent to AI PM for revision",
            });
            onUpdate();
        } catch (error) {
            toast.error("Failed to reject task", {
                description: error instanceof Error ? error.message : "Unknown error",
            });
        }
    };

    const generateIDEPrompt = () => {
        return `@coordinator Execute task from orchestrator

**Task:** ${task.title}

**Description:** ${task.description}

**Requirements:** ${task.requirements || task.description}

**Context Files to Load:**
- @.agent/context.md
- @.agent/file-index.md
- @.agent/workflows/integration/process-orchestrator-task.md

**Instructions:**
1. Analyze the task requirements
2. Load relevant source files
3. Implement the changes
4. Verify with npm run build
5. Report completion

**Task ID:** ${task.id}
**Project ID:** ${projectId}`;
    };

    const copyPrompt = () => {
        navigator.clipboard.writeText(generateIDEPrompt());
        setCopiedPrompt(true);
        toast.success("IDE prompt copied to clipboard!");
        setTimeout(() => setCopiedPrompt(false), 2000);
    };

    const getStatusBadge = () => {
        const variants: Record<string, "default" | "secondary" | "destructive"> = {
            pending: "secondary",
            assigned: "default",
            in_progress: "default",
            blocked: "destructive",
        };

        return (
            <Badge variant={variants[task.status] || "default"}>
                {task.status}
            </Badge>
        );
    };

    const assignedAgent = agents.find(a => a.id === task.assignedAgentId);

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-xl">{task.title}</CardTitle>
                            {getStatusBadge()}
                        </div>
                        <CardDescription>{task.description?.substring(0, 150)}...</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={copyPrompt}
                        >
                            {copiedPrompt ? (
                                <Check className="w-4 h-4" />
                            ) : (
                                <Copy className="w-4 h-4" />
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpanded(!expanded)}
                        >
                            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>
                {assignedAgent && (
                    <div className="flex items-center gap-2 mt-2">
                        <Bot className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                            Assigned to: <strong>{assignedAgent.name}</strong>
                        </span>
                    </div>
                )}
            </CardHeader>

            {expanded && (
                <CardContent className="space-y-4 border-t pt-4">
                    {/* Requirements */}
                    <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Requirements
                        </h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-3 rounded">
                            {task.requirements || "No specific requirements"}
                        </p>
                    </div>

                    {/* IDE Prompt */}
                    <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Code className="w-4 h-4" />
                            IDE Prompt
                        </h4>
                        <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-48">
                            {generateIDEPrompt()}
                        </pre>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={copyPrompt}
                        >
                            {copiedPrompt ? (
                                <><Check className="w-4 h-4 mr-2" /> Copied!</>
                            ) : (
                                <><Copy className="w-4 h-4 mr-2" /> Copy to Clipboard</>
                            )}
                        </Button>
                    </div>

                    {/* Actions */}
                    <div className="border-t pt-4">
                        <h4 className="font-semibold mb-3">Actions</h4>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                onClick={handleGenerateSpec}
                                disabled={generateMutation.isPending}
                                variant="outline"
                            >
                                <Code className="w-4 h-4 mr-2" />
                                {generateMutation.isPending ? "Generating..." : "Generate Spec"}
                            </Button>
                            <Button
                                onClick={() => setShowFeedback(!showFeedback)}
                                variant="outline"
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                Add Feedback
                            </Button>
                        </div>

                        {showFeedback && (
                            <div className="mt-4 space-y-3">
                                <Textarea
                                    placeholder="Add feedback or notes..."
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    rows={3}
                                />
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleApprove}
                                        disabled={approveMutation.isPending}
                                        className="flex-1"
                                    >
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Approve
                                    </Button>
                                    <Button
                                        onClick={handleReject}
                                        disabled={rejectMutation.isPending}
                                        variant="destructive"
                                        className="flex-1"
                                    >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Reject
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Progress */}
                    {task.progressPercentage > 0 && (
                        <div className="border-t pt-4">
                            <h4 className="font-semibold mb-2">Progress</h4>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 bg-secondary rounded-full h-2">
                                    <div
                                        className="bg-primary h-2 rounded-full transition-all"
                                        style={{ width: `${task.progressPercentage}%` }}
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    {task.progressPercentage}%
                                </span>
                            </div>
                        </div>
                    )}
                </CardContent>
            )}
        </Card>
    );
}

// All Tasks View
function AllTasksView({ projectId, agents }: { projectId: number; agents: any[] }) {
    const { data: subsystems } = trpc.projects.getSubsystems.useQuery({ projectId });

    const allTasks = subsystems?.flatMap(s =>
        s.modules?.flatMap(m => m.tasks || []) || []
    ) || [];

    const tasksByStatus = {
        pending: allTasks.filter(t => t.status === 'pending'),
        in_progress: allTasks.filter(t => t.status === 'in_progress'),
        completed: allTasks.filter(t => t.status === 'completed'),
        blocked: allTasks.filter(t => t.status === 'blocked'),
    };

    return (
        <div className="grid gap-4 md:grid-cols-4">
            {Object.entries(tasksByStatus).map(([status, tasks]) => (
                <Card key={status}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium capitalize">
                            {status.replace('_', ' ')}
                        </CardTitle>
                        <CardDescription>{tasks.length} tasks</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-64">
                            <div className="space-y-2">
                                {tasks.map((task: any) => (
                                    <div
                                        key={task.id}
                                        className="p-2 border rounded text-sm hover:bg-accent transition-colors"
                                    >
                                        <p className="font-medium truncate">{task.title}</p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {task.description?.substring(0, 50)}
                                        </p>
                                    </div>
                                ))}
                                {tasks.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No tasks
                                    </p>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

// Agent Assignment View
function AgentAssignmentView({ agents, projectId }: { agents: any[]; projectId: number }) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
                <Card key={agent.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Bot className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-base">{agent.name}</CardTitle>
                                <CardDescription>{agent.role}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <Badge variant={agent.status === 'idle' ? 'secondary' : 'default'}>
                                {agent.status}
                            </Badge>
                            {agent.currentTaskId && (
                                <span className="text-xs text-muted-foreground">
                                    Task #{agent.currentTaskId}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            {agent.specialization?.substring(0, 100)}...
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
