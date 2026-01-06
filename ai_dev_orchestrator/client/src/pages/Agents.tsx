import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Bot,
  CheckCircle2,
  AlertCircle,
  Clock,
  Activity,
  FileCode,
  Palette,
  Database,
  Cloud,
  TestTube,
  Search,
  Layers,
} from "lucide-react";

const roleConfig = {
  project_manager: { label: "Project Manager", icon: Layers, color: "text-purple-500" },
  research: { label: "Research", icon: Search, color: "text-blue-500" },
  architecture: { label: "Architecture", icon: Database, color: "text-cyan-500" },
  ui_ux: { label: "UI/UX", icon: Palette, color: "text-pink-500" },
  frontend: { label: "Frontend", icon: FileCode, color: "text-green-500" },
  backend: { label: "Backend", icon: Database, color: "text-orange-500" },
  devops: { label: "DevOps", icon: Cloud, color: "text-indigo-500" },
  qa: { label: "QA", icon: TestTube, color: "text-red-500" },
};

const statusConfig = {
  idle: { label: "Idle", color: "bg-gray-500", icon: Clock },
  working: { label: "Working", color: "bg-green-500", icon: Activity },
  blocked: { label: "Blocked", color: "bg-red-500", icon: AlertCircle },
};

export default function Agents() {
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: agents, isLoading, refetch } = trpc.agents.list.useQuery();
  const { data: activityLogs, refetch: refetchLogs } = trpc.agents.getActivityLogs.useQuery(
    { agentId: selectedAgent!, limit: 100 },
    { enabled: selectedAgent !== null }
  );

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetch();
      if (selectedAgent) {
        refetchLogs();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh, selectedAgent, refetch, refetchLogs]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const idleAgents = agents?.filter((a) => a.status === "idle") || [];
  const workingAgents = agents?.filter((a) => a.status === "working") || [];
  const blockedAgents = agents?.filter((a) => a.status === "blocked") || [];

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">AI Agents</h1>
        <p className="text-muted-foreground">Monitor your AI development team in real-time</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workingAgents.length}</div>
            <p className="text-xs text-muted-foreground">Currently working on tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Idle Agents</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{idleAgents.length}</div>
            <p className="text-xs text-muted-foreground">Available for assignment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Agents</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blockedAgents.length}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Agent Status</CardTitle>
            <CardDescription>Real-time status of all agents</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {agents?.map((agent) => {
                  const role = roleConfig[agent.role as keyof typeof roleConfig];
                  const status = statusConfig[agent.status as keyof typeof statusConfig];
                  const RoleIcon = role?.icon || Bot;
                  const StatusIcon = status?.icon || Clock;

                  return (
                    <div
                      key={agent.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-accent ${
                        selectedAgent === agent.id ? "bg-accent" : ""
                      }`}
                      onClick={() => setSelectedAgent(agent.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <RoleIcon className={`w-5 h-5 ${role?.color}`} />
                          <div>
                            <h4 className="font-semibold">{agent.name}</h4>
                            <p className="text-sm text-muted-foreground">{role?.label}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className={`${status?.color} text-white`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status?.label}
                        </Badge>
                      </div>
                      {agent.currentTaskId && (
                        <div className="text-sm text-muted-foreground mt-2">
                          Working on Task #{agent.currentTaskId}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
            <CardDescription>
              {selectedAgent
                ? `Activity history for ${agents?.find((a) => a.id === selectedAgent)?.name}`
                : "Select an agent to view activity"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              {!selectedAgent ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Bot className="w-16 h-16 mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Select an agent to view its activity log</p>
                </div>
              ) : !activityLogs || activityLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Activity className="w-16 h-16 mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No activity recorded yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="pb-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-sm">{log.action}</h4>
                            <span className="text-xs text-muted-foreground">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          {log.details && (
                            <p className="text-sm text-muted-foreground mb-1">{log.details}</p>
                          )}
                          {log.mcpToolCalled && (
                            <Badge variant="outline" className="text-xs">
                              MCP: {log.mcpToolCalled}
                            </Badge>
                          )}
                          {log.taskId && (
                            <Badge variant="outline" className="text-xs ml-2">
                              Task #{log.taskId}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Separator className="mt-4" />
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
