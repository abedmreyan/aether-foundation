import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { ArrowRight, Bot, MessageSquare, Phone, BarChart3, Zap, Shield } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // If user is logged in, redirect to dashboard
  if (user) {
    setLocation("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={APP_LOGO} alt={APP_TITLE} className="h-10 w-auto" />
            <span className="text-2xl font-bold text-foreground">{APP_TITLE}</span>
          </div>
          <Button onClick={() => window.location.href = getLoginUrl()}>
            Get Started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-card to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">
              Transform Customer Communication with AI-Powered Clarity
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Embed intelligent chat and voice widgets into your website or mobile app. Connect customers to your team with real-time communication, AI chatbots, and powerful automation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => window.location.href = getLoginUrl()}>
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline">
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Everything You Need for Modern Customer Support
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete communication platform that grows with your business
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Live Chat Support</h3>
              <p className="text-muted-foreground">
                Enable real-time text conversations between your visitors and support agents with instant message delivery and typing indicators.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Voice Calls (VoIP)</h3>
              <p className="text-muted-foreground">
                Integrate VoIP technology to allow visitors to make voice calls directly from your website to your agents with call recording.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">AI Chatbots with RAG</h3>
              <p className="text-muted-foreground">
                Deploy intelligent AI chatbots powered by your knowledge base and MCP servers for context-aware automated responses.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Analytics Dashboard</h3>
              <p className="text-muted-foreground">
                Track session metrics, agent performance, response times, and customer satisfaction with comprehensive analytics.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Easy Integration</h3>
              <p className="text-muted-foreground">
                Add the widget to any website with a simple embed code. Native SDKs available for iOS and Android mobile apps.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Full Customization</h3>
              <p className="text-muted-foreground">
                Customize colors, position, size, and welcome messages to match your brand identity perfectly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground">
              Get started in three simple steps
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-12">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-shrink-0 h-16 w-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold">
                1
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-foreground mb-2">Create Your Widget</h3>
                <p className="text-muted-foreground">
                  Customize the appearance, position, and features of your widget using our intuitive configuration interface with live preview.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-shrink-0 h-16 w-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold">
                2
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-foreground mb-2">Embed on Your Website</h3>
                <p className="text-muted-foreground">
                  Copy the generated embed code and paste it into your website. The widget appears instantly on your pages with full functionality.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-shrink-0 h-16 w-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold">
                3
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-foreground mb-2">Connect with Customers</h3>
                <p className="text-muted-foreground">
                  Visitors can initiate chats or voice calls directly from the widget. Agents receive notifications in the dashboard and can respond immediately.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-primary/80">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Transform Your Customer Support?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Start creating your customizable chat and voice widget today. No credit card required.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => window.location.href = getLoginUrl()}
          >
            Create Your First Widget
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-sidebar border-t border-sidebar-border py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sidebar-foreground/70">
            © 2024 {APP_TITLE}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
