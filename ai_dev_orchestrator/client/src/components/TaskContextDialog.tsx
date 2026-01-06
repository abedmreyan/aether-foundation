import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { ScrollArea } from "../components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { trpc } from "../lib/trpc";
import { Copy, FileText, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export function TaskContextDialog({ taskId, open, onOpenChange }: {
    taskId: number | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { data: context, isLoading } = trpc.agentContext.getForTask.useQuery(
        { taskId: taskId! },
        { enabled: !!taskId }
    );

    const { data: markdown } = trpc.agentContext.getMarkdown.useQuery(
        { taskId: taskId! },
        { enabled: !!taskId }
    );

    const { data: idePrompt } = trpc.agentContext.getIDEPrompt.useQuery(
        { taskId: taskId! },
        { enabled: !!taskId }
    );

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    if (!taskId) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle>Task Context</DialogTitle>
                    <DialogDescription>
                        {context ? `Context for Task #${context.task.id}: ${context.task.title}` : "Loading..."}
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : context ? (
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="related">Related Work</TabsTrigger>
                            <TabsTrigger value="messages">Messages</TabsTrigger>
                            <TabsTrigger value="prompts">Prompts</TabsTrigger>
                        </TabsList>

                        <ScrollArea className="h-[500px] mt-4">
                            {/* Overview Tab */}
                            <TabsContent value="overview" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Task Details</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div>
                                            <span className="font-medium">Stage:</span>{" "}
                                            <Badge>{context.task.stage}</Badge>
                                        </div>
                                        {context.task.suggestedAgentRole && (
                                            <div>
                                                <span className="font-medium">Suggested Agent:</span>{" "}
                                                <Badge variant="outline">{context.task.suggestedAgentRole}</Badge>
                                            </div>
                                        )}
                                        <div>
                                            <span className="font-medium">Description:</span>
                                            <p className="text-sm text-muted-foreground mt-1">{context.task.description}</p>
                                        </div>
                                        {context.task.requirements && (
                                            <div>
                                                <span className="font-medium">Requirements:</span>
                                                <p className="text-sm text-muted-foreground mt-1">{context.task.requirements}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Project: {context.projectContext.name}</CardTitle>
                                        <CardDescription>{context.projectContext.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        {context.projectContext.techStack && context.projectContext.techStack.length > 0 && (
                                            <div>
                                                <span className="font-medium">Tech Stack:</span>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {context.projectContext.techStack.map((tech) => (
                                                        <Badge key={tech} variant="secondary">{tech}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {context.projectContext.localPath && (
                                            <div>
                                                <span className="font-medium">Path:</span>
                                                <code className="text-xs bg-muted px-2 py-1 rounded ml-2">
                                                    {context.projectContext.localPath}
                                                </code>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Related Work Tab */}
                            <TabsContent value="related" className="space-y-3">
                                {context.relatedTasks.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8">No related tasks</p>
                                ) : (
                                    context.relatedTasks.map((task) => (
                                        <Card key={task.id}>
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-sm">
                                                    Task #{task.id}: {task.title}
                                                </CardTitle>
                                                <CardDescription className="flex items-center gap-2">
                                                    <Badge variant="secondary">{task.status}</Badge>
                                                    {task.assignedAgent && <span className="text-xs">{task.assignedAgent}</span>}
                                                </CardDescription>
                                            </CardHeader>
                                            {task.result && (
                                                <CardContent>
                                                    <p className="text-sm text-muted-foreground">{task.result}</p>
                                                </CardContent>
                                            )}
                                        </Card>
                                    ))
                                )}
                            </TabsContent>

                            {/* Messages Tab */}
                            <TabsContent value="messages" className="space-y-3">
                                {context.agentMessages.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8">No agent messages</p>
                                ) : (
                                    context.agentMessages.map((msg) => (
                                        <Card key={msg.id}>
                                            <CardHeader className="pb-2">
                                                <div className="flex items-center gap-2">
                                                    <MessageSquare className="h-4 w-4" />
                                                    <span className="font-medium text-sm">{msg.from}</span>
                                                    <span className="text-muted-foreground text-xs">→</span>
                                                    <span className="font-medium text-sm">{msg.to}</span>
                                                    <Badge variant="outline" className="ml-auto text-xs">{msg.type}</Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-sm">{msg.content}</p>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </TabsContent>

                            {/* Prompts Tab */}
                            <TabsContent value="prompts" className="space-y-4">
                                {markdown && (
                                    <Card>
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-sm">Context Markdown</CardTitle>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => copyToClipboard(markdown, "Context")}
                                                >
                                                    <Copy className="h-3 w-3 mr-1" />
                                                    Copy
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <ScrollArea className="h-[200px]">
                                                <pre className="text-xs">{markdown}</pre>
                                            </ScrollArea>
                                        </CardContent>
                                    </Card>
                                )}

                                {idePrompt && (
                                    <Card>
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-sm">IDE Prompt</CardTitle>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => copyToClipboard(idePrompt, "IDE Prompt")}
                                                >
                                                    <Copy className="h-3 w-3 mr-1" />
                                                    Copy
                                                </Button>
                                            </div>
                                            <CardDescription>Ready to paste into your IDE agent</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <ScrollArea className="h-[200px]">
                                                <pre className="text-xs">{idePrompt}</pre>
                                            </ScrollArea>
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>
                        </ScrollArea>
                    </Tabs>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
