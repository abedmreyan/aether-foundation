import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Loader2, MessageCircle, Phone, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function WidgetCustomizer() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const [widgetConfig, setWidgetConfig] = useState({
    name: "My Widget",
    platform: "website" as "website" | "android" | "ios",
    primaryColor: "#3b82f6",
    position: "bottom-right" as "bottom-right" | "bottom-left" | "top-right" | "top-left",
    size: "medium" as "small" | "medium" | "large",
    welcomeMessage: "Hello! How can we help you today?",
    enableChat: true,
    enableVoice: true,
    pushNotificationsEnabled: false,
  });

  const [widgetOpen, setWidgetOpen] = useState(false);

  const [createdWidgetKey, setCreatedWidgetKey] = useState<string | null>(null);
  const [showEmbedCode, setShowEmbedCode] = useState(false);

  const createWidgetMutation = trpc.widget.create.useMutation({
    onSuccess: (data) => {
      toast.success("Widget created successfully!");
      setCreatedWidgetKey(data.widgetKey);
      setShowEmbedCode(true);
    },
    onError: (error) => {
      toast.error("Failed to create widget: " + error.message);
    },
  });

  const handleSaveWidget = () => {
    if (!isAuthenticated) {
      toast.error("Please log in to create a widget");
      return;
    }
    createWidgetMutation.mutate(widgetConfig);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to customize your widget</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>Log In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getSizeClass = () => {
    switch (widgetConfig.size) {
      case "small": return "w-80 h-96";
      case "medium": return "w-96 h-[500px]";
      case "large": return "w-[450px] h-[600px]";
    }
  };

  const getPositionClass = () => {
    switch (widgetConfig.position) {
      case "bottom-right": return "bottom-6 right-6";
      case "bottom-left": return "bottom-6 left-6";
      case "top-right": return "top-6 right-6";
      case "top-left": return "top-6 left-6";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {APP_LOGO && <img src={APP_LOGO} alt={APP_TITLE} className="h-8" />}
            <h1 className="text-2xl font-bold text-slate-900">{APP_TITLE}</h1>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost">Home</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <span className="text-sm text-slate-600">{user?.name}</span>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration Panel */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Widget Configuration</CardTitle>
                <CardDescription>Customize your chat and voice widget</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Widget Name</Label>
                  <Input
                    id="name"
                    value={widgetConfig.name}
                    onChange={(e) => setWidgetConfig({ ...widgetConfig, name: e.target.value })}
                    placeholder="My Widget"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="platform">Platform</Label>
                  <Select
                    value={widgetConfig.platform}
                    onValueChange={(value: any) => setWidgetConfig({ ...widgetConfig, platform: value })}
                  >
                    <SelectTrigger id="platform">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website">Website (JavaScript)</SelectItem>
                      <SelectItem value="android">Android (Native SDK)</SelectItem>
                      <SelectItem value="ios">iOS (Native SDK)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    {widgetConfig.platform === "website" && "Embeddable JavaScript widget for web browsers"}
                    {widgetConfig.platform === "android" && "Native Android SDK with push notifications and VoIP support"}
                    {widgetConfig.platform === "ios" && "Native iOS SDK with APNs and CallKit integration"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="color"
                      type="color"
                      value={widgetConfig.primaryColor}
                      onChange={(e) => setWidgetConfig({ ...widgetConfig, primaryColor: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={widgetConfig.primaryColor}
                      onChange={(e) => setWidgetConfig({ ...widgetConfig, primaryColor: e.target.value })}
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Select
                    value={widgetConfig.position}
                    onValueChange={(value: any) => setWidgetConfig({ ...widgetConfig, position: value })}
                  >
                    <SelectTrigger id="position">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottom-right">Bottom Right</SelectItem>
                      <SelectItem value="bottom-left">Bottom Left</SelectItem>
                      <SelectItem value="top-right">Top Right</SelectItem>
                      <SelectItem value="top-left">Top Left</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="size">Size</Label>
                  <Select
                    value={widgetConfig.size}
                    onValueChange={(value: any) => setWidgetConfig({ ...widgetConfig, size: value })}
                  >
                    <SelectTrigger id="size">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="welcome">Welcome Message</Label>
                  <Textarea
                    id="welcome"
                    value={widgetConfig.welcomeMessage}
                    onChange={(e) => setWidgetConfig({ ...widgetConfig, welcomeMessage: e.target.value })}
                    placeholder="Hello! How can we help you today?"
                    rows={3}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Features</Label>
                  <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Switch
                      id="enableChat"
                      checked={widgetConfig.enableChat}
                      onCheckedChange={(checked) => setWidgetConfig({ ...widgetConfig, enableChat: checked })}
                    />
                    <Label htmlFor="enableChat" className="font-normal cursor-pointer">Enable Chat</Label>
                  </div>

                  <div className="flex items-center justify-between">
                    <Switch
                      id="enableVoice"
                      checked={widgetConfig.enableVoice}
                      onCheckedChange={(checked) => setWidgetConfig({ ...widgetConfig, enableVoice: checked })}
                    />
                    <Label htmlFor="enableVoice" className="font-normal cursor-pointer">Enable Voice Calls</Label>
                  </div>

                  {(widgetConfig.platform === "android" || widgetConfig.platform === "ios") && (
                    <div className="flex items-center justify-between">
                      <Switch
                        id="pushNotifications"
                        checked={widgetConfig.pushNotificationsEnabled}
                        onCheckedChange={(checked) => setWidgetConfig({ ...widgetConfig, pushNotificationsEnabled: checked })}
                      />
                      <Label htmlFor="pushNotifications" className="font-normal cursor-pointer">Enable Push Notifications</Label>
                    </div>
                  )}
                  </div>
                </div>

                <Button
                  onClick={handleSaveWidget}
                  disabled={createWidgetMutation.isPending}
                  className="w-full"
                >
                  {createWidgetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Widget
                </Button>

                {showEmbedCode && createdWidgetKey && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {widgetConfig.platform === "website" ? "Embed Code" : "SDK Integration"}
                      </CardTitle>
                      <CardDescription>
                        {widgetConfig.platform === "website" && "Copy this code and paste it before the closing </body> tag of your website"}
                        {widgetConfig.platform === "android" && "Follow these steps to integrate the Android SDK"}
                        {widgetConfig.platform === "ios" && "Follow these steps to integrate the iOS SDK"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {widgetConfig.platform === "website" && (
                        <>
                          <div className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto">
                            <code className="text-sm whitespace-pre">
                              {`<script src="${window.location.origin}/widget.js"></script>
<script>
  SaaSCommWidget.init({
    widgetKey: '${createdWidgetKey}',
    apiUrl: '${window.location.origin}',
    primaryColor: '${widgetConfig.primaryColor}',
    position: '${widgetConfig.position}',
    size: '${widgetConfig.size}',
    welcomeMessage: '${widgetConfig.welcomeMessage}',
    enableChat: ${widgetConfig.enableChat},
    enableVoice: ${widgetConfig.enableVoice}
  });
</script>`}
                            </code>
                          </div>
                          <Button
                            className="mt-4 w-full"
                            variant="outline"
                            onClick={() => {
                              const code = `<script src="${window.location.origin}/widget.js"></script>\n<script>\n  SaaSCommWidget.init({\n    widgetKey: '${createdWidgetKey}',\n    apiUrl: '${window.location.origin}',\n    primaryColor: '${widgetConfig.primaryColor}',\n    position: '${widgetConfig.position}',\n    size: '${widgetConfig.size}',\n    welcomeMessage: '${widgetConfig.welcomeMessage}',\n    enableChat: ${widgetConfig.enableChat},\n    enableVoice: ${widgetConfig.enableVoice}\n  });\n</script>`;
                              navigator.clipboard.writeText(code);
                              toast.success("Embed code copied to clipboard!");
                            }}
                          >
                            Copy to Clipboard
                          </Button>
                        </>
                      )}

                      {widgetConfig.platform === "android" && (
                        <div className="space-y-4">
                          <div className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto">
                            <code className="text-sm whitespace-pre">
{`// Add to build.gradle
dependencies {
    implementation 'com.saascomm:android-sdk:1.0.0'
}

// Initialize in your Application class
SaaSCommSDK.init(
    context = this,
    widgetKey = "${createdWidgetKey}",
    apiUrl = "${window.location.origin}",
    config = WidgetConfig(
        primaryColor = "${widgetConfig.primaryColor}",
        enableChat = ${widgetConfig.enableChat},
        enableVoice = ${widgetConfig.enableVoice},
        pushNotifications = ${widgetConfig.pushNotificationsEnabled}
    )
)`}
                            </code>
                          </div>
                          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                            <p className="text-sm text-blue-900">
                              <strong>Note:</strong> The Android SDK provides native UI components, push notifications via FCM, and VoIP call handling. Download the SDK and integration guide from your dashboard.
                            </p>
                          </div>
                        </div>
                      )}

                      {widgetConfig.platform === "ios" && (
                        <div className="space-y-4">
                          <div className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto">
                            <code className="text-sm whitespace-pre">
{`// Add to Podfile
pod 'SaaSCommSDK', '~> 1.0'

// Initialize in AppDelegate
import SaaSCommSDK

SaaSCommSDK.shared.configure(
    widgetKey: "${createdWidgetKey}",
    apiURL: "${window.location.origin}",
    config: WidgetConfig(
        primaryColor: "${widgetConfig.primaryColor}",
        enableChat: ${widgetConfig.enableChat},
        enableVoice: ${widgetConfig.enableVoice},
        pushNotifications: ${widgetConfig.pushNotificationsEnabled}
    )
)`}
                            </code>
                          </div>
                          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                            <p className="text-sm text-blue-900">
                              <strong>Note:</strong> The iOS SDK includes CallKit integration for VoIP calls, APNs for push notifications, and native SwiftUI components. Download the SDK and integration guide from your dashboard.
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Live Preview */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
                <CardDescription>See how your widget will look on a website</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg h-[600px] overflow-hidden">
                  {/* Mock website content */}
                  <div className="p-8">
                    <div className="bg-white rounded-lg p-6 shadow-sm max-w-2xl">
                      <h2 className="text-2xl font-bold text-slate-900 mb-4">Welcome to Our Website</h2>
                      <p className="text-slate-600 mb-4">
                        This is a preview of how the widget will appear on your website. The widget button will be positioned according to your settings.
                      </p>
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-full"></div>
                        <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                        <div className="h-4 bg-slate-200 rounded w-4/6"></div>
                      </div>
                    </div>
                  </div>

                  {/* Widget Button */}
                  {!widgetOpen && (
                    <button
                      onClick={() => setWidgetOpen(true)}
                      className={`fixed ${getPositionClass()} rounded-full p-4 shadow-lg hover:scale-110 transition-transform`}
                      style={{ backgroundColor: widgetConfig.primaryColor }}
                    >
                      <MessageCircle className="h-6 w-6 text-white" />
                    </button>
                  )}

                  {/* Widget Window */}
                  {widgetOpen && (
                    <div className={`fixed ${getPositionClass()} ${getSizeClass()} bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden`}>
                      {/* Widget Header */}
                      <div className="p-4 text-white flex items-center justify-between" style={{ backgroundColor: widgetConfig.primaryColor }}>
                        <h3 className="font-semibold">Support</h3>
                        <button onClick={() => setWidgetOpen(false)} className="hover:bg-white/20 rounded p-1">
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Widget Content */}
                      <div className="flex-1 p-4 bg-slate-50 overflow-y-auto">
                        <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
                          <p className="text-sm text-slate-700">{widgetConfig.welcomeMessage}</p>
                        </div>
                        <div className="text-center text-sm text-slate-500">Start a conversation</div>
                      </div>

                      {/* Widget Actions */}
                      <div className="p-4 bg-white border-t flex gap-2">
                        {widgetConfig.enableChat && (
                          <Button className="flex-1" style={{ backgroundColor: widgetConfig.primaryColor }}>
                            <MessageCircle className="mr-2 h-4 w-4" />
                            Chat
                          </Button>
                        )}
                        {widgetConfig.enableVoice && (
                          <Button className="flex-1" variant="outline">
                            <Phone className="mr-2 h-4 w-4" />
                            Call
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
