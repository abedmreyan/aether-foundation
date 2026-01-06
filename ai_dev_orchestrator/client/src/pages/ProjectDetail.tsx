import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2, ArrowLeft, FileText, CheckCircle, XCircle, Clock, AlertCircle, Activity,
  ListTodo, FolderOpen, RefreshCw, Plus, Play, Code, Copy, Check, Bot, HelpCircle,
  Rocket, ExternalLink, ChevronRight, Target, Sparkles, CheckSquare
} from "lucide-react";
import { ProposalReview } from "@/components/ProposalReview";
import { AttachmentsList } from "@/components/AttachmentsList";
import { FileUpload } from "@/components/FileUpload";
import { StructureTree } from "@/components/StructureTree";
import { ScopeSelector } from "@/components/ScopeSelector";
import { toast } from "sonner";

const healthColors = {
  healthy: "bg-green-500",
  needs_attention: "bg-yellow-500",
  blocked: "bg-red-500",
};

export default function ProjectDetail() {
  const [, params] = useRoute("/projects/:id");
  const [, setLocation] = useLocation();
  const projectId = params?.id ? parseInt(params.id) : 0;

  // State for dialogs
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [newTask, setNewTask] = useState({ title: "", description: "", requirements: "" });
  const [taskScope, setTaskScope] = useState<{ subsystemId?: number; moduleId?: number }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Queries
  const { data: project, isLoading: projectLoading } = trpc.projects.getById.useQuery({ projectId });
  const { data: proposals, isLoading: proposalsLoading, refetch: refetchProposals } = trpc.proposals.listByProject.useQuery({ projectId });
  const { data: agents } = trpc.agents.list.useQuery();
  const { data: projectStatus, isLoading: statusLoading, refetch: refetchStatus } = trpc.projects.getStatus.useQuery(
    { projectId },
    { enabled: !!project, refetchInterval: 30000 }
  );

  // Mutations
  const startProject = trpc.orchestration.startProject.useMutation({
    onSuccess: () => {
      toast.success("AI Project Manager is analyzing your project!");
      refetchProposals();
    },
    onError: (error) => toast.error(error.message),
  });

  const createTaskMutation = trpc.tasks.createForProject.useMutation({
    onSuccess: () => {
      toast.success("Task created!");
      setIsCreateTaskOpen(false);
      setNewTask({ title: "", description: "", requirements: "" });
      refetchStatus();
    },
    onError: (error) => toast.error(error.message),
  });

  // Helpers
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const generatePrompt = (task: any) => {
    return `@coordinator Execute task for ${project?.name}

**Task:** ${task.title}

**Description:** ${task.description}

**Project Context:**
- Project: ${project?.name}
- Path: ${project?.localPath || 'Not set'}

**Context Files to Load:**
- @.agent/context.md
- @.agent/file-index.md
- @.agent/workflows/integration/process-orchestrator-task.md

**Instructions:**
1. Load project context
2. Analyze requirements
3. Implement the changes
4. Verify with npm run build
5. Report completion

**Source:** ${task.source || `Project ID: ${projectId}`}`;
  };

  const convertToTask = (suggestedTask: any) => {
    setNewTask({
      title: suggestedTask.title,
      description: suggestedTask.description,
      requirements: suggestedTask.description,
    });
    setIsCreateTaskOpen(true);
  };

  const openPromptForTask = (task: any) => {
    setSelectedTask(task);
    setIsPromptOpen(true);
  };

  const goToHelpWithContext = () => {
    // Store project context for help page
    sessionStorage.setItem('helpContext', JSON.stringify({
      projectId,
      projectName: project?.name,
      projectPath: project?.localPath,
    }));
    setLocation('/help');
  };

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Project not found</h2>
          <Link href="/projects">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const pendingProposals = proposals?.filter((p) => p.status === "pending_review") || [];
  const status = projectStatus && !("error" in projectStatus) ? projectStatus : null;
  const allTasks: any[] = []; // TODO: Integrate with tasks API

  return (
    <div className="container py-8">
      {/* Navigation Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/projects">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Projects
            </Button>
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium">{project.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/tasks">
            <Button variant="outline" size="sm">
              <CheckSquare className="w-4 h-4 mr-2" />
              Tasks
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={goToHelpWithContext}>
            <HelpCircle className="w-4 h-4 mr-2" />
            Help & Prompts
          </Button>
        </div>
      </div>

      {/* Project Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <h1 className="text-4xl font-bold">{project.name}</h1>
          {status && (
            <Badge className={`${healthColors[status.health]} text-white`}>
              {status.health.replace("_", " ").toUpperCase()}
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground mb-4">{project.description?.substring(0, 200)}</p>
        <div className="flex items-center gap-4">
          <Badge variant="secondary">{project.status.replace("_", " ").toUpperCase()}</Badge>
          {status && (
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Activity className="w-3 h-3" />
              {status.summary}
            </span>
          )}
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="flex flex-wrap gap-3 mb-6">
        {project.status === "ideation" ? (
          <Button onClick={() => startProject.mutate({ projectId })} disabled={startProject.isPending}>
            {startProject.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Rocket className="w-4 h-4 mr-2" />}
            Start AI Analysis
          </Button>
        ) : (
          <Button variant="secondary" disabled>
            <CheckCircle className="w-4 h-4 mr-2" />
            AI Active
          </Button>
        )}
        <Button variant="outline" onClick={() => setIsCreateTaskOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Task
        </Button>
        <Button variant="outline" onClick={goToHelpWithContext}>
          <Sparkles className="w-4 h-4 mr-2" />
          Generate Prompt
        </Button>
        <Button variant="outline" onClick={() => refetchStatus()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Status Overview Cards */}
      {status && (
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ListTodo className="w-4 h-4" />
                TODOs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{status.todos?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                {status.todos?.filter((t: any) => t.priority === "high").length || 0} high priority
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                Recent Changes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{status.recentChanges?.length || 0}</div>
              <p className="text-xs text-muted-foreground">files this week</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setIsCreateTaskOpen(true)}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="w-4 h-4" />
                Suggested Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{status.suggestedTasks?.length || 0}</div>
              <p className="text-xs text-primary">Click to create →</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />
                Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allTasks.length}</div>
              <p className="text-xs text-muted-foreground">
                {allTasks.filter((t: any) => t.status === 'completed').length} completed
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pending Approvals Alert */}
      {pendingProposals.length > 0 && (
        <Card className="mb-6 border-orange-500 bg-orange-50 dark:bg-orange-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              {pendingProposals.length} Pending Approval{pendingProposals.length !== 1 ? "s" : ""}
            </CardTitle>
            <CardDescription>
              Review proposals from AI agents before they can proceed
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="tasks" className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="tasks">
            <CheckSquare className="w-4 h-4 mr-1" />
            Tasks
            {allTasks.length > 0 && <Badge variant="secondary" className="ml-2">{allTasks.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="status">
            <Activity className="w-4 h-4 mr-1" />
            Live Status
          </TabsTrigger>
          <TabsTrigger value="proposals">
            Proposals
            {pendingProposals.length > 0 && <Badge variant="destructive" className="ml-2">{pendingProposals.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="structure">Structure</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
        </TabsList>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Project Tasks</h3>
            <Button onClick={() => setIsCreateTaskOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          </div>

          {allTasks.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckSquare className="w-12 h-12 mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-medium mb-2">No Tasks Yet</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Create a task or convert a suggested task from the status analysis
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => setIsCreateTaskOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Task
                  </Button>
                  <Button variant="outline" onClick={goToHelpWithContext}>
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Generate with AI
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {allTasks.map((task: any) => (
                <Card key={task.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{task.title}</h4>
                          <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                            {task.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{task.description?.substring(0, 100)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openPromptForTask(task)}>
                          <Code className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(generatePrompt(task), task.id)}
                        >
                          {copiedId === task.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    {task.progressPercentage > 0 && (
                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 bg-secondary rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: `${task.progressPercentage}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{task.progressPercentage}%</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Suggested Tasks Section */}
          {status?.suggestedTasks && status.suggestedTasks.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Suggested Tasks
                <Badge variant="outline">{status.suggestedTasks.length}</Badge>
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {status.suggestedTasks.map((task: any, i: number) => (
                  <Card key={i} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => convertToTask(task)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{task.title}</span>
                            <Badge variant={task.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                              {task.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{task.description}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-primary" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Live Status Tab */}
        <TabsContent value="status" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => refetchStatus()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {statusLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : !status ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="w-12 h-12 mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No local path configured</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {/* TODOs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ListTodo className="w-5 h-5" />
                    TODOs in Code
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    {status.todos?.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No TODOs found</p>
                    ) : (
                      <div className="space-y-2">
                        {status.todos?.map((todo: any, i: number) => (
                          <div
                            key={i}
                            className="text-sm p-2 bg-muted rounded cursor-pointer hover:bg-accent"
                            onClick={() => convertToTask({ title: todo.text, description: `Found in ${todo.file}:${todo.line}`, priority: todo.priority })}
                          >
                            <div className="flex items-center gap-2">
                              <Badge variant={todo.priority === "high" ? "destructive" : "outline"} className="text-xs">
                                {todo.priority}
                              </Badge>
                              <span className="font-mono text-xs text-muted-foreground">{todo.file}:{todo.line}</span>
                            </div>
                            <p className="mt-1">{todo.text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Recent Changes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="w-5 h-5" />
                    Recent Changes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    {status.recentChanges?.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No recent changes</p>
                    ) : (
                      <div className="space-y-2">
                        {status.recentChanges?.map((change: any, i: number) => (
                          <div key={i} className="text-sm p-2 bg-muted rounded flex justify-between">
                            <span className="font-mono text-xs truncate">{change.file}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(change.modified).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Context Files */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Context Files
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {status.contextFiles?.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No context files found</p>
                  ) : (
                    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                      {status.contextFiles?.map((file: any, i: number) => (
                        <div key={i} className="p-3 bg-muted rounded-lg flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span className="font-mono text-sm flex-1 truncate">{file.path}</span>
                          <Badge variant="outline" className="text-xs">{file.type}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Proposals Tab */}
        <TabsContent value="proposals" className="space-y-4">
          {proposalsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : !proposals || proposals.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="w-12 h-12 mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No proposals yet</p>
              </CardContent>
            </Card>
          ) : (
            proposals.map((proposal) => (
              <ProposalReview key={proposal.id} proposal={proposal} onReviewed={() => refetchProposals()} />
            ))
          )}
        </TabsContent>

        {/* Structure Tab */}
        <TabsContent value="structure" className="space-y-4">
          <StructureTree
            projectId={projectId}
            onCreateTask={(scope) => {
              setNewTask({
                title: "",
                description: `Task for ${scope.scopeName}`,
                requirements: "",
              });
              setIsCreateTaskOpen(true);
            }}
          />
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold mb-4">Upload Files</h3>
              <FileUpload projectId={projectId} onUploadComplete={() => { }} />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Attached Files</h3>
              <AttachmentsList projectId={projectId} />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Task Dialog */}
      <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Task for {project.name}</DialogTitle>
            <DialogDescription>
              Create a new task. Once created, copy the IDE prompt to execute it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="e.g., Add priority field to student pipeline"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Describe what needs to be done..."
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Requirements (Optional)</label>
              <Textarea
                placeholder="Specific requirements or acceptance criteria..."
                value={newTask.requirements}
                onChange={(e) => setNewTask({ ...newTask, requirements: e.target.value })}
                rows={3}
              />
            </div>
            {/* Scope Selection */}
            <ScopeSelector
              projectId={projectId}
              value={taskScope}
              onChange={setTaskScope}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateTaskOpen(false);
              setTaskScope({});
            }}>Cancel</Button>
            <Button
              onClick={() => {
                createTaskMutation.mutate({
                  projectId,
                  title: newTask.title,
                  description: newTask.description,
                  requirements: newTask.requirements || undefined,
                  subsystemId: taskScope.subsystemId,
                  moduleId: taskScope.moduleId,
                });
                setTaskScope({});
              }}
              disabled={!newTask.title || createTaskMutation.isPending}
            >
              {createTaskMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* IDE Prompt Dialog */}
      <Dialog open={isPromptOpen} onOpenChange={setIsPromptOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>IDE Prompt for: {selectedTask?.title}</DialogTitle>
            <DialogDescription>Copy this prompt to Cursor or Antigravity</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-80">
            <pre className="text-sm bg-muted p-4 rounded whitespace-pre-wrap">
              {selectedTask && generatePrompt(selectedTask)}
            </pre>
          </ScrollArea>
          <DialogFooter>
            <Button
              onClick={() => {
                if (selectedTask) {
                  copyToClipboard(generatePrompt(selectedTask), 'prompt');
                }
              }}
            >
              {copiedId === 'prompt' ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              Copy Prompt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
