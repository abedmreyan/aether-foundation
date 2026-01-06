import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Link } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Pipelines from "./pages/Pipelines";
import Agents from "./pages/Agents";
import TaskApproval from "./pages/TaskApproval";
import Research from "./pages/Research";
import Help from "./pages/Help";
import { useAuth } from "./_core/hooks/useAuth";
import { Button } from "./components/ui/button";
import { Bot, Rocket, Activity, LogOut, Loader2, CheckSquare, HelpCircle, LayoutDashboard, Kanban, Search } from "lucide-react";

function Navigation() {
  const { user, loading, isAuthenticated, logout } = useAuth();

  if (loading) {
    return (
      <header className="border-b">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Bot className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-bold">AI Dev Orchestrator</h1>
          </div>
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      </header>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <header className="border-b">
      <div className="container flex items-center justify-between h-16">
        <div className="flex items-center gap-8">
          <Link href="/">
            <a className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Bot className="w-8 h-8 text-primary" />
              <h1 className="text-xl font-bold">AI Dev Orchestrator</h1>
            </a>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/dashboard">
              <a className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </a>
            </Link>
            <Link href="/projects">
              <a className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                <Rocket className="w-4 h-4" />
                Projects
              </a>
            </Link>
            <Link href="/pipelines">
              <a className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                <Kanban className="w-4 h-4" />
                Pipelines
              </a>
            </Link>
            <Link href="/agents">
              <a className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                <Activity className="w-4 h-4" />
                Agents
              </a>
            </Link>
            <Link href="/research">
              <a className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                <Search className="w-4 h-4" />
                Research
              </a>
            </Link>
            <Link href="/help">
              <a className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                <HelpCircle className="w-4 h-4" />
                Help
              </a>
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user?.name}</span>
          <Button variant="ghost" size="sm" onClick={() => logout()}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

function Router() {
  return (
    <>
      <Navigation />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/projects" component={Projects} />
        <Route path="/projects/:id" component={ProjectDetail} />
        <Route path="/pipelines" component={Pipelines} />
        <Route path="/tasks" component={TaskApproval} />
        <Route path="/agents" component={Agents} />
        <Route path="/research" component={Research} />
        <Route path="/help" component={Help} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
