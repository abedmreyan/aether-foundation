import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AppLayout from "./components/AppLayout";
import Home from "./pages/Home";
import Analytics from "./pages/Analytics";
import CannedResponses from "./pages/CannedResponses";
import Settings from "./pages/Settings";
import AIChatbots from "./pages/AIChatbots";
import WidgetCustomizer from "./pages/WidgetCustomizer";
import Dashboard from "./pages/Dashboard";
import AgentChat from "./pages/AgentChat";
import ChatbotRouting from "./pages/ChatbotRouting";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path={"/"} component={Home} />
      
      {/* Authenticated routes with AppLayout - Dashboard already has AppLayout internally */}
      <Route path={"/dashboard"} component={Dashboard} />
      
      {/* Other authenticated routes wrapped with AppLayout */}
      <Route path={"/widgets"}>
        <AppLayout><WidgetCustomizer /></AppLayout>
      </Route>
      <Route path={"/agent-chat"}>
        <AppLayout><AgentChat /></AppLayout>
      </Route>
      <Route path={"/analytics"}>
        <AppLayout><Analytics /></AppLayout>
      </Route>
      <Route path={"/canned-responses"}>
        <AppLayout><CannedResponses /></AppLayout>
      </Route>
      <Route path={"/settings"}>
        <AppLayout><Settings /></AppLayout>
      </Route>
      <Route path={"/ai-chatbots"}>
        <AppLayout><AIChatbots /></AppLayout>
      </Route>
      <Route path={"/chatbot-routing"} component={ChatbotRouting} />      
      {/* Error routes */}
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
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
