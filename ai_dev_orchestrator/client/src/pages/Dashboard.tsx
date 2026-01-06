import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "../lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import { Loader2, CheckCircle2, XCircle, AlertCircle, Users, Briefcase, TrendingUp, FileText } from "lucide-react";
import { toast } from "sonner";

export default function Dashboard() {
    const [, setLocation] = useLocation();
    const navigate = (path: string) => setLocation(path);
    const utils = trpc.useUtils();

    // Fetch data
    const { data: user } = trpc.auth.me.useQuery();
    const { data: projects = [] } = trpc.projects.list.useQuery();
    const { data: agents = [] } = trpc.agents.list.useQuery();
    const { data: pendingApprovals = [] } = trpc.approvals.getPending.useQuery();

    // Get pending tasks for the first project (or make this selectable)
    const [selectedProjectId] = useState(projects[0]?.id || 1);
    const { data: pendingTasks = [] } = trpc.tasks.getPendingApproval.useQuery(
        { projectId: selectedProjectId },
        { enabled: !!selectedProjectId }
    );

    const approveMutation = trpc.approvals.decide.useMutation({
        onSuccess: () => {
            toast.success("Approved!");
            utils.approvals.getPending.invalidate();
            utils.tasks.getPendingApproval.invalidate();
        },
        onError: (err) => toast.error(err.message),
    });

    const rejectMutation = trpc.approvals.decide.useMutation({
        onSuccess: () => {
            toast.success("Rejected");
            utils.approvals.getPending.invalidate();
            utils.tasks.getPendingApproval.invalidate();
        },
        onError: (err) => toast.error(err.message),
    });

    // Group agents by department
    const agentsByDept = agents.reduce((acc, agent) => {
        if (!acc[agent.department]) acc[agent.department] = [];
        acc[agent.department].push(agent);
        return acc;
    }, {} as Record<string, typeof agents>);

    const isFounder = user?.role === "founder" || user?.role === "admin";

    if (!isFounder) {
        return (
            <div className="container mx-auto py-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Access Denied</CardTitle>
                        <CardDescription>You must be a founder or admin to access this dashboard.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Founder Dashboard</h1>
                    <p className="text-muted-foreground">Approve tasks, manage priorities, and oversee your AI team</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate("/projects")}>
                        Projects
                    </Button>
                    <Button variant="outline" onClick={() => navigate("/pipelines")}>
                        Pipelines
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingApprovals.length + pendingTasks.length}</div>
                        <p className="text-xs text-muted-foreground">Awaiting your decision</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                        <Briefcase className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{projects.filter(p => p.status === "active").length}</div>
                        <p className="text-xs text-muted-foreground">Projects in progress</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">AI Agents</CardTitle>
                        <Users className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{agents.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {agents.filter(a => a.status === "working").length} working
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">94%</div>
                        <p className="text-xs text-muted-foreground">This sprint</p>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Approvals */}
            {(pendingApprovals.length > 0 || pendingTasks.length > 0) && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-orange-500" />
                            Pending Your Approval ({pendingApprovals.length + pendingTasks.length})
                        </CardTitle>
                        <CardDescription>Review and approve or reject tasks and content</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[400px]">
                            <div className="space-y-3">
                                {/* Task Approvals */}
                                {pendingTasks.map((task) => (
                                    <div
                                        key={`task-${task.id}`}
                                        className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <FileText className="h-4 w-4 text-blue-500" />
                                                <h4 className="font-medium">{task.title}</h4>
                                                {task.suggestedAgentRole && (
                                                    <Badge variant="outline">{task.suggestedAgentRole}</Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                                            {task.requirements && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Requirements: {task.requirements}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-green-600 hover:text-green-700"
                                                onClick={() => {
                                                    // Move from Backlog to Approved
                                                    // TODO: Implement task approval
                                                    toast.success("Task approved!");
                                                }}
                                            >
                                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                                Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-red-600 hover:text-red-700"
                                                onClick={() => {
                                                    // Reject task
                                                    toast.success("Task rejected");
                                                }}
                                            >
                                                <XCircle className="h-4 w-4 mr-1" />
                                                Reject
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                {/* Other Approvals */}
                                {pendingApprovals.map((approval) => (
                                    <div
                                        key={`approval-${approval.id}`}
                                        className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge>{approval.entityType}</Badge>
                                                <h4 className="font-medium">ID: {approval.entityId}</h4>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-green-600 hover:text-green-700"
                                                onClick={() =>
                                                    approveMutation.mutate({
                                                        approvalId: approval.id,
                                                        status: "approved",
                                                    })
                                                }
                                                disabled={approveMutation.isPending}
                                            >
                                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                                Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-red-600 hover:text-red-700"
                                                onClick={() =>
                                                    rejectMutation.mutate({
                                                        approvalId: approval.id,
                                                        status: "rejected",
                                                    })
                                                }
                                                disabled={rejectMutation.isPending}
                                            >
                                                <XCircle className="h-4 w-4 mr-1" />
                                                Reject
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            )}

            {/* Department Overview */}
            <div>
                <h2 className="text-2xl font-bold mb-4">AI Team by Department</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(agentsByDept).map(([dept, deptAgents]) => (
                        <Card key={dept}>
                            <CardHeader>
                                <CardTitle className="text-lg capitalize">{dept}</CardTitle>
                                <CardDescription>{deptAgents.length} agents</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[200px]">
                                    <div className="space-y-2">
                                        {deptAgents.map((agent) => (
                                            <div key={agent.id} className="flex items-center justify-between text-sm">
                                                <span className="font-medium">{agent.name}</span>
                                                <Badge
                                                    variant={
                                                        agent.status === "working"
                                                            ? "default"
                                                            : agent.status === "blocked"
                                                                ? "destructive"
                                                                : "secondary"
                                                    }
                                                >
                                                    {agent.status}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-4">
                    <Button onClick={() => navigate("/pipelines")}>View All Pipelines</Button>
                    <Button variant="outline" onClick={() => navigate("/agents")}>
                        Manage Agents
                    </Button>
                    <Button variant="outline" onClick={() => navigate("/research")}>
                        Research Tasks
                    </Button>
                    <Button variant="outline" onClick={() => navigate("/help")}>
                        Generate Prompts
                    </Button>
                </CardContent>
            </Card>

            {pendingApprovals.length === 0 && pendingTasks.length === 0 && (
                <Card className="border-dashed">
                    <CardHeader>
                        <CardTitle>✨ All Caught Up!</CardTitle>
                        <CardDescription>No pending approvals. Your team is running smoothly.</CardDescription>
                    </CardHeader>
                </Card>
            )}
        </div>
    );
}
