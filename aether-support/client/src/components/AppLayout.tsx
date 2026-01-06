import { useAuth } from "@/_core/hooks/useAuth";
import { APP_LOGO, APP_TITLE } from "@/const";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Settings, 
  Bot, 
  BarChart3, 
  MessageCircle, 
  Workflow,
  LogOut,
  Menu,
  X,
  GitBranch
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Widgets", href: "/widgets", icon: MessageSquare },
    { name: "Agent Chat", href: "/agent-chat", icon: MessageCircle },
    { name: "AI Chatbots", href: "/ai-chatbots", icon: Bot },
    { name: "Chatbot Routing", href: "/chatbot-routing", icon: GitBranch },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Quick Replies", href: "/canned-responses", icon: MessageCircle },
    { name: "Automations", href: "/automations", icon: Workflow },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const isActive = (path: string) => location === path;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop */}
      <aside 
        className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 bg-sidebar border-r border-sidebar-border transition-all duration-300 ${
          isSidebarExpanded ? "lg:w-64" : "lg:w-20"
        }`}
        onMouseEnter={() => setIsSidebarExpanded(true)}
        onMouseLeave={() => setIsSidebarExpanded(false)}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 h-16 px-4 border-b border-sidebar-border overflow-hidden">
          <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-8 flex-shrink-0" />
          {isSidebarExpanded && (
            <span className="text-sidebar-foreground font-bold text-lg whitespace-nowrap">
              {APP_TITLE}
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-hidden">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link key={item.name} href={item.href}>
                <a
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {isSidebarExpanded && (
                    <span className="text-sm font-medium whitespace-nowrap">{item.name}</span>
                  )}
                </a>
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        {user && (
          <div className="p-4 border-t border-sidebar-border">
            <div className={`flex items-center gap-3 mb-3 overflow-hidden ${!isSidebarExpanded && "justify-center"}`}>
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold flex-shrink-0">
                {user.name?.charAt(0).toUpperCase() || "U"}
              </div>
              {isSidebarExpanded && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {user.name || "User"}
                  </p>
                  <p className="text-xs text-sidebar-foreground/60 truncate">
                    {user.email || ""}
                  </p>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size={isSidebarExpanded ? "sm" : "icon"}
              onClick={logout}
              className={`${isSidebarExpanded ? "w-full" : "w-full"}`}
            >
              <LogOut className="h-4 w-4" />
              {isSidebarExpanded && <span className="ml-2">Log Out</span>}
            </Button>
          </div>
        )}
      </aside>

      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar border-b border-sidebar-border">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-auto" />
            <span className="text-sidebar-foreground font-bold text-lg">{APP_TITLE}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm">
          <aside className="fixed inset-y-0 left-0 w-64 bg-sidebar border-r border-sidebar-border">
            <div className="flex items-center gap-3 h-16 px-6 border-b border-sidebar-border mt-16">
              <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-auto" />
              <span className="text-sidebar-foreground font-bold text-lg">{APP_TITLE}</span>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link key={item.name} href={item.href}>
                    <a
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{item.name}</span>
                    </a>
                  </Link>
                );
              })}
            </nav>

            {user && (
              <div className="p-4 border-t border-sidebar-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-sidebar-foreground">
                      {user.name || "User"}
                    </p>
                    <p className="text-xs text-sidebar-foreground/60">
                      {user.email || ""}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="w-full"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Log Out
                </Button>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarExpanded ? "lg:ml-64" : "lg:ml-20"} pt-16 lg:pt-0`}>
        {children}
      </main>
    </div>
  );
}
