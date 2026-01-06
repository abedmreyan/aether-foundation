import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Rocket, Bot, FileText, Activity, ArrowRight } from "lucide-react";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const { data: projects } = trpc.projects.list.useQuery(undefined, { enabled: isAuthenticated });
  const { data: agents } = trpc.agents.list.useQuery(undefined, { enabled: isAuthenticated });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b">
          <div className="container flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Bot className="w-8 h-8 text-primary" />
              <h1 className="text-xl font-bold">AI Dev Orchestrator</h1>
            </div>
            <Button asChild>
              <Link href="/projects">Get Started</Link>
            </Button>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center">
          <div className="container max-w-4xl text-center">
            <div className="mb-8">
              <Bot className="w-20 h-20 mx-auto mb-6 text-primary" />
              <h1 className="text-5xl font-bold mb-4">AI Development Orchestration Platform</h1>
              <p className="text-xl text-muted-foreground mb-8">
                Transform your ideas into deployed products with a team of specialized AI agents
              </p>
              <Button size="lg" asChild>
                <Link href="/projects">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3 mt-16">
              <Card>
                <CardHeader>
                  <Rocket className="w-10 h-10 mb-2 text-purple-500" />
                  <CardTitle>Submit Ideas</CardTitle>
                  <CardDescription>
                    Describe your vision and let the AI Project Manager orchestrate the development
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <Bot className="w-10 h-10 mb-2 text-blue-500" />
                  <CardTitle>AI Team</CardTitle>
                  <CardDescription>
                    Specialized agents handle research, design, development, testing, and deployment
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <Activity className="w-10 h-10 mb-2 text-green-500" />
                  <CardTitle>Monitor Progress</CardTitle>
                  <CardDescription>
                    Track real-time agent activities and approve key decisions at every phase
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const activeProjects = projects?.filter((p) => p.status !== "deployed") || [];
  const workingAgents = agents?.filter((a) => a.status === "working") || [];

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.name}!</h1>
        <p className="text-muted-foreground">Here's what's happening with your AI development team</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Rocket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Agents</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agents?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Working Agents</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workingAgents.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/projects">
              <Button variant="outline" className="w-full justify-start">
                <Rocket className="w-4 h-4 mr-2" />
                Create New Project
              </Button>
            </Link>
            <Link href="/agents">
              <Button variant="outline" className="w-full justify-start">
                <Bot className="w-4 h-4 mr-2" />
                Monitor AI Agents
              </Button>
            </Link>
            <Link href="/projects">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Review Pending Proposals
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from your AI team</CardDescription>
          </CardHeader>
          <CardContent>
            {!projects || projects.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No projects yet</p>
                <Link href="/projects">
                  <Button>Create Your First Project</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.slice(0, 5).map((project) => (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent cursor-pointer">
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {project.status.replace("_", " ").toUpperCase()}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
