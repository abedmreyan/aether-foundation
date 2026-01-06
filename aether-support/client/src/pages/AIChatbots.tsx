import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Bot, Plus, Trash2, Edit, Database, Server, FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function AIChatbots() {
  const { user, loading: authLoading } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedChatbot, setSelectedChatbot] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);

  // Chatbot form state
  const [chatbotName, setChatbotName] = useState("");
  const [chatbotDescription, setChatbotDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [temperature, setTemperature] = useState(70);
  const [maxTokens, setMaxTokens] = useState(500);

  // Knowledge base form state
  const [kbName, setKbName] = useState("");
  const [kbContent, setKbContent] = useState("");
  const [kbType, setKbType] = useState<"text" | "url" | "file">("text");

  // MCP server form state
  const [mcpName, setMcpName] = useState("");
  const [mcpDescription, setMcpDescription] = useState("");
  const [mcpUrl, setMcpUrl] = useState("");
  const [mcpAuthType, setMcpAuthType] = useState<"none" | "bearer" | "api_key" | "basic">("none");
  const [mcpAuthToken, setMcpAuthToken] = useState("");

  const utils = trpc.useUtils();
  
  // Queries
  const { data: chatbots, isLoading: loadingChatbots } = trpc.chatbots.list.useQuery();
  const { data: templates } = trpc.chatbots.getTemplates.useQuery();
  const { data: selectedChatbotData } = trpc.chatbots.getById.useQuery(
    { chatbotId: selectedChatbot! },
    { enabled: !!selectedChatbot }
  );
  const { data: knowledgeBases } = trpc.chatbots.getKnowledgeBases.useQuery(
    { chatbotId: selectedChatbot! },
    { enabled: !!selectedChatbot }
  );
  const { data: mcpServers } = trpc.chatbots.getMcpServers.useQuery(
    { chatbotId: selectedChatbot! },
    { enabled: !!selectedChatbot }
  );

  // Mutations
  const createChatbot = trpc.chatbots.create.useMutation({
    onSuccess: () => {
      toast.success("Chatbot created successfully!");
      utils.chatbots.list.invalidate();
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to create chatbot: ${error.message}`);
    },
  });

  const deleteChatbot = trpc.chatbots.delete.useMutation({
    onSuccess: () => {
      toast.success("Chatbot deleted successfully!");
      utils.chatbots.list.invalidate();
      setSelectedChatbot(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete chatbot: ${error.message}`);
    },
  });

  const addKnowledgeBase = trpc.chatbots.addKnowledgeBase.useMutation({
    onSuccess: () => {
      toast.success("Knowledge base added!");
      utils.chatbots.getKnowledgeBases.invalidate();
      setKbName("");
      setKbContent("");
    },
    onError: (error) => {
      toast.error(`Failed to add knowledge base: ${error.message}`);
    },
  });

  const deleteKnowledgeBase = trpc.chatbots.deleteKnowledgeBase.useMutation({
    onSuccess: () => {
      toast.success("Knowledge base deleted!");
      utils.chatbots.getKnowledgeBases.invalidate();
    },
  });

  const addMcpServer = trpc.chatbots.addMcpServer.useMutation({
    onSuccess: () => {
      toast.success("MCP server added!");
      utils.chatbots.getMcpServers.invalidate();
      setMcpName("");
      setMcpDescription("");
      setMcpUrl("");
      setMcpAuthToken("");
    },
    onError: (error) => {
      toast.error(`Failed to add MCP server: ${error.message}`);
    },
  });

  const deleteMcpServer = trpc.chatbots.deleteMcpServer.useMutation({
    onSuccess: () => {
      toast.success("MCP server deleted!");
      utils.chatbots.getMcpServers.invalidate();
    },
  });

  const resetForm = () => {
    setChatbotName("");
    setChatbotDescription("");
    setSystemPrompt("");
    setTemperature(70);
    setMaxTokens(500);
    setSelectedTemplate(null);
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates?.find(t => t.id === parseInt(templateId));
    if (template) {
      setSelectedTemplate(template.id);
      setChatbotName(template.name);
      setChatbotDescription(template.description || "");
      setSystemPrompt(template.systemPrompt);
    }
  };

  const handleCreateChatbot = () => {
    if (!chatbotName || !systemPrompt) {
      toast.error("Please fill in all required fields");
      return;
    }

    createChatbot.mutate({
      name: chatbotName,
      description: chatbotDescription,
      systemPrompt,
      temperature,
      maxTokens,
    });
  };

  const handleAddKnowledgeBase = () => {
    if (!selectedChatbot || !kbName || !kbContent) {
      toast.error("Please fill in all fields");
      return;
    }

    addKnowledgeBase.mutate({
      chatbotId: selectedChatbot,
      name: kbName,
      content: kbContent,
      type: kbType,
    });
  };

  const handleAddMcpServer = () => {
    if (!selectedChatbot || !mcpName || !mcpUrl) {
      toast.error("Please fill in all required fields");
      return;
    }

    addMcpServer.mutate({
      chatbotId: selectedChatbot,
      name: mcpName,
      description: mcpDescription,
      serverUrl: mcpUrl,
      authType: mcpAuthType,
      authToken: mcpAuthToken || undefined,
    });
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <h1 className="text-xl font-bold text-slate-900">SaaS Communication Platform</h1>
            </Link>
            <span className="text-slate-400">|</span>
            <h2 className="text-lg font-semibold text-slate-700">AI Chatbots</h2>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/"><Button variant="ghost">Home</Button></Link>
            <span className="text-sm text-slate-600">{user.name}</span>
            <Button variant="outline" onClick={() => window.location.href = "/api/auth/logout"}>
              Log Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chatbot List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    My Chatbots
                  </CardTitle>
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        New
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Create AI Chatbot</DialogTitle>
                        <DialogDescription>
                          Create a new AI-powered chatbot for your widgets
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Start from Template (Optional)</Label>
                          <Select onValueChange={handleTemplateSelect}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a template or start from scratch" />
                            </SelectTrigger>
                            <SelectContent>
                              {templates?.map((template) => (
                                <SelectItem key={template.id} value={template.id.toString()}>
                                  {template.name} - {template.category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="name">Chatbot Name *</Label>
                          <Input
                            id="name"
                            value={chatbotName}
                            onChange={(e) => setChatbotName(e.target.value)}
                            placeholder="e.g., Customer Support Bot"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Input
                            id="description"
                            value={chatbotDescription}
                            onChange={(e) => setChatbotDescription(e.target.value)}
                            placeholder="Brief description of this chatbot"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="systemPrompt">System Prompt *</Label>
                          <Textarea
                            id="systemPrompt"
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            placeholder="You are a helpful assistant..."
                            rows={8}
                          />
                          <p className="text-xs text-slate-500">
                            Define the chatbot's personality, role, and behavior
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="temperature">
                              Temperature: {temperature}%
                            </Label>
                            <input
                              type="range"
                              id="temperature"
                              min="0"
                              max="100"
                              value={temperature}
                              onChange={(e) => setTemperature(parseInt(e.target.value))}
                              className="w-full"
                            />
                            <p className="text-xs text-slate-500">
                              Higher = more creative, Lower = more focused
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="maxTokens">Max Tokens</Label>
                            <Input
                              type="number"
                              id="maxTokens"
                              value={maxTokens}
                              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                              min="100"
                              max="4000"
                            />
                            <p className="text-xs text-slate-500">
                              Maximum response length
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                          <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleCreateChatbot} disabled={createChatbot.isPending}>
                            {createChatbot.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Create Chatbot
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {loadingChatbots ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  </div>
                ) : chatbots && chatbots.length > 0 ? (
                  <div className="space-y-2">
                    {chatbots.map((chatbot) => (
                      <div
                        key={chatbot.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedChatbot === chatbot.id
                            ? "bg-blue-50 border-blue-300"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                        onClick={() => setSelectedChatbot(chatbot.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-slate-900">{chatbot.name}</div>
                            {chatbot.description && (
                              <div className="text-sm text-slate-500 mt-1">{chatbot.description}</div>
                            )}
                          </div>
                          <Badge variant={chatbot.isActive ? "default" : "secondary"}>
                            {chatbot.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Bot className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p>No chatbots yet</p>
                    <p className="text-sm">Create your first AI chatbot to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chatbot Details */}
          <div className="lg:col-span-2">
            {selectedChatbot && selectedChatbotData ? (
              <Tabs defaultValue="config" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="config">Configuration</TabsTrigger>
                  <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
                  <TabsTrigger value="mcp">MCP Servers</TabsTrigger>
                </TabsList>

                <TabsContent value="config" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{selectedChatbotData.name}</CardTitle>
                          <CardDescription>{selectedChatbotData.description}</CardDescription>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this chatbot?")) {
                              deleteChatbot.mutate({ chatbotId: selectedChatbot });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>System Prompt</Label>
                        <Textarea value={selectedChatbotData.systemPrompt} readOnly rows={10} className="mt-2" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Temperature</Label>
                          <Input value={`${selectedChatbotData.temperature}%`} readOnly className="mt-2" />
                        </div>
                        <div>
                          <Label>Max Tokens</Label>
                          <Input value={selectedChatbotData.maxTokens || 500} readOnly className="mt-2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="knowledge" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Knowledge Base (RAG)
                      </CardTitle>
                      <CardDescription>
                        Add documents, URLs, or text content for the chatbot to reference
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="kbName">Name</Label>
                          <Input
                            id="kbName"
                            value={kbName}
                            onChange={(e) => setKbName(e.target.value)}
                            placeholder="e.g., Product Documentation"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="kbType">Type</Label>
                          <Select value={kbType} onValueChange={(v: any) => setKbType(v)}>
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text Content</SelectItem>
                              <SelectItem value="url">URL</SelectItem>
                              <SelectItem value="file">File Upload</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="kbContent">Content</Label>
                          <Textarea
                            id="kbContent"
                            value={kbContent}
                            onChange={(e) => setKbContent(e.target.value)}
                            placeholder={
                              kbType === "url"
                                ? "https://example.com/docs"
                                : "Paste your content here..."
                            }
                            rows={4}
                            className="mt-1"
                          />
                        </div>
                        <Button onClick={handleAddKnowledgeBase} disabled={addKnowledgeBase.isPending}>
                          {addKnowledgeBase.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          <Plus className="h-4 w-4 mr-1" />
                          Add Knowledge Base
                        </Button>
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-3">Existing Knowledge Bases</h4>
                        {knowledgeBases && knowledgeBases.length > 0 ? (
                          <div className="space-y-2">
                            {knowledgeBases.map((kb) => (
                              <div key={kb.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <FileText className="h-4 w-4 text-slate-400" />
                                  <div>
                                    <div className="font-medium text-sm">{kb.name}</div>
                                    <div className="text-xs text-slate-500">Type: {kb.type}</div>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteKnowledgeBase.mutate({ knowledgeBaseId: kb.id })}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500 text-center py-4">No knowledge bases added yet</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="mcp" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Server className="h-5 w-5" />
                        MCP Servers
                      </CardTitle>
                      <CardDescription>
                        Connect Model Context Protocol servers for dynamic data access
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-blue-900 mb-2">What are MCP Servers?</h4>
                        <p className="text-sm text-blue-800 mb-3">
                          MCP (Model Context Protocol) servers allow your chatbot to fetch real-time data from external sources like databases, APIs, or custom services.
                        </p>
                        <a
                          href="https://modelcontextprotocol.io/introduction"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Learn how to set up MCP servers →
                        </a>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="mcpName">Server Name</Label>
                          <Input
                            id="mcpName"
                            value={mcpName}
                            onChange={(e) => setMcpName(e.target.value)}
                            placeholder="e.g., Customer Database"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="mcpDescription">Description</Label>
                          <Input
                            id="mcpDescription"
                            value={mcpDescription}
                            onChange={(e) => setMcpDescription(e.target.value)}
                            placeholder="What data does this server provide?"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="mcpUrl">Server URL</Label>
                          <Input
                            id="mcpUrl"
                            value={mcpUrl}
                            onChange={(e) => setMcpUrl(e.target.value)}
                            placeholder="https://your-mcp-server.com"
                            className="mt-1"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="mcpAuthType">Authentication</Label>
                            <Select value={mcpAuthType} onValueChange={(v: any) => setMcpAuthType(v)}>
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                <SelectItem value="bearer">Bearer Token</SelectItem>
                                <SelectItem value="api_key">API Key</SelectItem>
                                <SelectItem value="basic">Basic Auth</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {mcpAuthType !== "none" && (
                            <div>
                              <Label htmlFor="mcpAuthToken">Auth Token/Key</Label>
                              <Input
                                id="mcpAuthToken"
                                type="password"
                                value={mcpAuthToken || ""}
                                onChange={(e) => setMcpAuthToken(e.target.value)}
                                placeholder="Enter token or key"
                                className="mt-1"
                              />
                            </div>
                          )}
                        </div>
                        <Button onClick={handleAddMcpServer} disabled={addMcpServer.isPending}>
                          {addMcpServer.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          <Plus className="h-4 w-4 mr-1" />
                          Add MCP Server
                        </Button>
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-3">Connected Servers</h4>
                        {mcpServers && mcpServers.length > 0 ? (
                          <div className="space-y-2">
                            {mcpServers.map((server) => (
                              <div key={server.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <Server className="h-4 w-4 text-slate-400" />
                                  <div>
                                    <div className="font-medium text-sm">{server.name}</div>
                                    <div className="text-xs text-slate-500">{server.serverUrl}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={server.isActive ? "default" : "secondary"}>
                                    {server.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteMcpServer.mutate({ serverId: server.id })}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500 text-center py-4">No MCP servers connected yet</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-slate-500">
                    <Bot className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                    <p className="text-lg font-medium">Select a chatbot to view details</p>
                    <p className="text-sm mt-2">Or create a new one to get started</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
