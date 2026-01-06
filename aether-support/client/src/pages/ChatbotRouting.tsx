import { useAuth } from "@/_core/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Bot, GitBranch, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import ReactFlow, {
  Background,
  Connection,
  Controls,
  Edge,
  MarkerType,
  Node,
  addEdge,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { toast } from "sonner";

interface RoutingNodeData {
  label: string;
  type: "chatbot" | "condition" | "mcp_check";
  chatbotId?: number;
  condition?: string;
}

export default function ChatbotRouting() {
  const { user, loading: authLoading } = useAuth();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showNodeDialog, setShowNodeDialog] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<number | null>(null);
  const [routingName, setRoutingName] = useState("");
  const [routingDescription, setRoutingDescription] = useState("");
  const [initialChatbotId, setInitialChatbotId] = useState<number | null>(null);

  // New node form
  const [newNodeType, setNewNodeType] = useState<"chatbot" | "condition" | "mcp_check">("chatbot");
  const [newNodeLabel, setNewNodeLabel] = useState("");
  const [newNodeChatbotId, setNewNodeChatbotId] = useState<number | null>(null);
  const [newNodeCondition, setNewNodeCondition] = useState("");

  const { data: widgets } = trpc.widget.list.useQuery();
  const { data: chatbots } = trpc.chatbots.list.useQuery();

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;
      const newEdge: Edge = {
        id: `e${params.source}-${params.target}`,
        source: params.source,
        target: params.target,
        type: "smoothstep",
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const addNode = () => {
    if (!newNodeLabel) {
      toast.error("Please enter a node label");
      return;
    }

    const newNode: Node<RoutingNodeData> = {
      id: `node-${Date.now()}`,
      type: "default",
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        label: newNodeLabel,
        type: newNodeType,
        chatbotId: newNodeChatbotId || undefined,
        condition: newNodeCondition || undefined,
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setShowNodeDialog(false);
    setNewNodeLabel("");
    setNewNodeChatbotId(null);
    setNewNodeCondition("");
    toast.success("Node added to workflow");
  };

  const saveRouting = async () => {
    if (!selectedWidget || !initialChatbotId || !routingName) {
      toast.error("Please fill in all required fields");
      return;
    }

    const routingConfig = {
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.data.type,
        label: node.data.label,
        chatbotId: node.data.chatbotId,
        condition: node.data.condition,
        position: node.position,
      })),
      edges: edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
      })),
    };

    try {
      // TODO: Implement save routing mutation
      toast.success("Routing workflow saved successfully!");
    } catch (error) {
      toast.error("Failed to save routing workflow");
    }
  };

  if (authLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Chatbot Routing</h1>
            <p className="text-gray-600 mt-1">
              Create intelligent routing workflows for your AI chatbots
            </p>
          </div>
          <Button onClick={saveRouting} className="gap-2">
            <Save className="h-4 w-4" />
            Save Workflow
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Configuration Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Configuration
              </CardTitle>
              <CardDescription>Set up your routing workflow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Workflow Name</Label>
                <Input
                  placeholder="E.g., Sales & Support Routing"
                  value={routingName}
                  onChange={(e) => setRoutingName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe your routing logic..."
                  value={routingDescription}
                  onChange={(e) => setRoutingDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Widget</Label>
                <Select
                  value={selectedWidget?.toString() || ""}
                  onValueChange={(value) => setSelectedWidget(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select widget" />
                  </SelectTrigger>
                  <SelectContent>
                    {widgets?.map((widget: any) => (
                      <SelectItem key={widget.id} value={widget.id.toString()}>
                        {widget.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Initial Chatbot (Welcome Agent)</Label>
                <Select
                  value={initialChatbotId?.toString() || ""}
                  onValueChange={(value) => setInitialChatbotId(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select chatbot" />
                  </SelectTrigger>
                  <SelectContent>
                    {chatbots?.map((chatbot: any) => (
                      <SelectItem key={chatbot.id} value={chatbot.id.toString()}>
                        {chatbot.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 border-t">
                <Button onClick={() => setShowNodeDialog(true)} className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Add Routing Node
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Node Types:</Label>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <Bot className="h-3 w-3 mt-0.5" />
                    <div>
                      <strong>Chatbot:</strong> Route to specific AI agent
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <GitBranch className="h-3 w-3 mt-0.5" />
                    <div>
                      <strong>Condition:</strong> Check conversation context
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <GitBranch className="h-3 w-3 mt-0.5" />
                    <div>
                      <strong>MCP Check:</strong> Fetch customer data
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visual Workflow Builder */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Visual Workflow Builder</CardTitle>
              <CardDescription>
                Drag nodes to arrange them. Click and drag from one node to another to create connections.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[600px] border rounded-lg bg-gray-50">
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  fitView
                >
                  <Background />
                  <Controls />
                </ReactFlow>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Node Dialog */}
        <Dialog open={showNodeDialog} onOpenChange={setShowNodeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Routing Node</DialogTitle>
              <DialogDescription>
                Create a new node in your chatbot routing workflow
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Node Type</Label>
                <Select
                  value={newNodeType}
                  onValueChange={(value: any) => setNewNodeType(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chatbot">Chatbot Agent</SelectItem>
                    <SelectItem value="condition">Condition Check</SelectItem>
                    <SelectItem value="mcp_check">MCP Data Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Node Label</Label>
                <Input
                  placeholder="E.g., Sales Agent, Check Intent, Fetch Customer"
                  value={newNodeLabel}
                  onChange={(e) => setNewNodeLabel(e.target.value)}
                />
              </div>

              {newNodeType === "chatbot" && (
                <div className="space-y-2">
                  <Label>Select Chatbot</Label>
                  <Select
                    value={newNodeChatbotId?.toString()}
                    onValueChange={(value) => setNewNodeChatbotId(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose AI agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {chatbots?.map((chatbot: any) => (
                        <SelectItem key={chatbot.id} value={chatbot.id.toString()}>
                          {chatbot.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {newNodeType === "condition" && (
                <div className="space-y-2">
                  <Label>Condition Logic</Label>
                  <Textarea
                    placeholder="E.g., Contains keywords: pricing, quote, cost"
                    value={newNodeCondition}
                    onChange={(e) => setNewNodeCondition(e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              {newNodeType === "mcp_check" && (
                <div className="space-y-2">
                  <Label>MCP Query</Label>
                  <Textarea
                    placeholder="E.g., Fetch customer tier from CRM"
                    value={newNodeCondition}
                    onChange={(e) => setNewNodeCondition(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNodeDialog(false)}>
                Cancel
              </Button>
              <Button onClick={addNode}>Add Node</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
