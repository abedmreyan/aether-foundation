import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "../lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { ScrollArea } from "../components/ui/scroll-area";
import { Search, Loader2, CheckCircle2, Clock, XCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function Research() {
    const [, setLocation] = useLocation();
    const navigate = (path: string) => setLocation(path);
    const utils = trpc.useUtils();

    const { data: projects = [] } = trpc.projects.list.useQuery();
    const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || 1);

    const { data: researchTasks = [], isLoading } = trpc.research.getByProject.useQuery(
        { projectId: selectedProjectId },
        { enabled: !!selectedProjectId }
    );

    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [selectedResearch, setSelectedResearch] = useState<number | null>(null);
    const [resultsDialogOpen, setResultsDialogOpen] = useState(false);

    return (
        <div className="container mx-auto py-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Research</h1>
                    <p className="text-muted-foreground">AI-powered research using Perplexity</p>
                </div>
                <div className="flex gap-2">
                    <Select value={selectedProjectId.toString()} onValueChange={(v) => setSelectedProjectId(parseInt(v))}>
                        <SelectTrigger className="w-[250px]">
                            <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent>
                            {projects.map((p) => (
                                <SelectItem key={p.id} value={p.id.toString()}>
                                    {p.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Search className="h-4 w-4 mr-2" />
                                New Research
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <CreateResearchForm
                                projectId={selectedProjectId}
                                onSuccess={() => {
                                    setCreateDialogOpen(false);
                                    utils.research.getByProject.invalidate();
                                }}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Research Tasks Grid */}
            {isLoading ? (
                <div className="text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                </div>
            ) : researchTasks.length === 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle>No Research Tasks</CardTitle>
                        <CardDescription>Create a research task to get started</CardDescription>
                    </CardHeader>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {researchTasks.map((research: any) => (
                        <ResearchCard
                            key={research.id}
                            research={research}
                            onViewResults={() => {
                                setSelectedResearch(research.id);
                                setResultsDialogOpen(true);
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Results Dialog */}
            {selectedResearch && (
                <ResearchResultsDialog
                    researchId={selectedResearch}
                    open={resultsDialogOpen}
                    onOpenChange={setResultsDialogOpen}
                />
            )}
        </div>
    );
}

function CreateResearchForm({ projectId, onSuccess }: { projectId: number; onSuccess: () => void }) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState<"market" | "technical" | "competitive">("market");

    const createMutation = trpc.research.create.useMutation({
        onSuccess: () => {
            toast.success("Research task created! Processing...");
            onSuccess();
        },
        onError: (err) => toast.error(err.message),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate({ projectId, title, description, type });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
                <DialogTitle>New Research Task</DialogTitle>
                <DialogDescription>AI will research this topic using Perplexity</DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Market analysis for AI agents"
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="type">Research Type</Label>
                <Select value={type} onValueChange={(v: any) => setType(v)}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="market">Market Research</SelectItem>
                        <SelectItem value="technical">Technical Research</SelectItem>
                        <SelectItem value="competitive">Competitive Analysis</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Research Question</Label>
                <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What would you like to research? Be specific..."
                    rows={4}
                    required
                />
            </div>

            <Button type="submit" disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending ? (
                    <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                    </>
                ) : (
                    <>
                        <Search className="h-4 w-4 mr-2" />
                        Start Research
                    </>
                )}
            </Button>
        </form>
    );
}

function ResearchCard({ research, onViewResults }: { research: any; onViewResults: () => void }) {
    const getStatusIcon = (status: string) => {
        switch (status) {
            case "completed":
                return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case "in_progress":
                return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
            case "failed":
                return <XCircle className="h-4 w-4 text-red-500" />;
            default:
                return <Clock className="h-4 w-4 text-orange-500" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case "market":
                return "bg-purple-500/10 text-purple-700";
            case "technical":
                return "bg-blue-500/10 text-blue-700";
            case "competitive":
                return "bg-orange-500/10 text-orange-700";
            default:
                return "bg-gray-500/10 text-gray-700";
        }
    };

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-base line-clamp-2">{research.title}</CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">{research.description}</CardDescription>
                    </div>
                    {getStatusIcon(research.status)}
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <Badge className={getTypeColor(research.type)}>{research.type}</Badge>
                    {research.status === "completed" && (
                        <Button size="sm" variant="outline" onClick={onViewResults}>
                            View Results
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function ResearchResultsDialog({
    researchId,
    open,
    onOpenChange,
}: {
    researchId: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { data: results, isLoading } = trpc.research.getResults.useQuery(
        { researchId },
        { enabled: open }
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle>Research Results</DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : results ? (
                    <ScrollArea className="h-[500px]">
                        <div className="space-y-4 pr-4">
                            {/* Summary */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Summary</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm">{results.summary}</p>
                                </CardContent>
                            </Card>

                            {/* Findings */}
                            {results.findings && results.findings.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Key Findings</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="list-disc list-inside space-y-2">
                                            {results.findings.map((finding: string, i: number) => (
                                                <li key={i} className="text-sm">
                                                    {finding}
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Recommendations */}
                            {results.recommendations && results.recommendations.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Recommendations</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="list-disc list-inside space-y-2">
                                            {results.recommendations.map((rec: string, i: number) => (
                                                <li key={i} className="text-sm">
                                                    {rec}
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Sources */}
                            {results.sources && results.sources.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Sources</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {results.sources.map((source: any, i: number) => (
                                            <div key={i} className="border-l-2 border-primary pl-3">
                                                <a
                                                    href={source.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-medium text-sm text-primary flex items-center gap-1 hover:underline"
                                                >
                                                    {source.title}
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                                <p className="text-xs text-muted-foreground mt-1">{source.snippet}</p>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </ScrollArea>
                ) : (
                    <p className="text-center text-muted-foreground py-8">No results available</p>
                )}
            </DialogContent>
        </Dialog>
    );
}
