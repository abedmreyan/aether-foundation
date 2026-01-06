import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ChevronDown,
    ChevronRight,
    FolderTree,
    Package,
    FileCode,
    Loader2,
    Sparkles,
    Plus
} from "lucide-react";
import { toast } from "sonner";

interface StructureTreeProps {
    projectId: number;
    onCreateTask?: (scope: { subsystemId?: number; moduleId?: number; scopeName: string }) => void;
}

interface Module {
    id: number;
    name: string;
    path: string | null;
    description: string | null;
    files: string[];
}

interface Subsystem {
    id: number;
    name: string;
    path: string | null;
    description: string | null;
    purpose: string | null;
    modules: Module[];
}

export function StructureTree({ projectId, onCreateTask }: StructureTreeProps) {
    const [expandedSubsystems, setExpandedSubsystems] = useState<Set<number>>(new Set());

    const { data: subsystems, isLoading, refetch } = trpc.subsystems.list.useQuery(
        { projectId },
        { enabled: !!projectId }
    );

    const analyzeMutation = trpc.subsystems.analyze.useMutation({
        onSuccess: (result) => {
            toast.success(`Analyzed! Found ${result.subsystemCount} subsystems`);
            refetch();
        },
        onError: (error) => {
            toast.error(`Analysis failed: ${error.message}`);
        },
    });

    const toggleSubsystem = (id: number) => {
        setExpandedSubsystems((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleAnalyze = () => {
        analyzeMutation.mutate({ projectId });
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </CardContent>
            </Card>
        );
    }

    const hasSubsystems = subsystems && subsystems.length > 0;

    return (
        <Card className="border-[var(--aether-light-gray)]">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <FolderTree className="w-5 h-5 text-[var(--aether-teal)]" />
                        Project Structure
                    </CardTitle>
                    <Button
                        size="sm"
                        onClick={handleAnalyze}
                        disabled={analyzeMutation.isPending}
                        className="bg-[var(--aether-teal)] hover:bg-[var(--aether-teal)]/90"
                    >
                        {analyzeMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Sparkles className="w-4 h-4 mr-2" />
                        )}
                        {hasSubsystems ? "Re-analyze" : "Analyze Structure"}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {!hasSubsystems ? (
                    <div className="text-center py-6 text-muted-foreground">
                        <FolderTree className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="mb-2">No structure analysis yet</p>
                        <p className="text-sm">Click "Analyze Structure" to scan your codebase</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {subsystems.map((subsystem: Subsystem) => {
                            const isExpanded = expandedSubsystems.has(subsystem.id);
                            const moduleCount = subsystem.modules?.length || 0;

                            return (
                                <div key={subsystem.id} className="border rounded-lg overflow-hidden">
                                    {/* Subsystem Header */}
                                    <div
                                        className="flex items-center gap-2 p-3 bg-[var(--aether-light-gray)]/50 hover:bg-[var(--aether-light-gray)] cursor-pointer transition-colors"
                                        onClick={() => toggleSubsystem(subsystem.id)}
                                    >
                                        <button className="p-0.5">
                                            {isExpanded ? (
                                                <ChevronDown className="w-4 h-4 text-[var(--aether-deep-blue)]" />
                                            ) : (
                                                <ChevronRight className="w-4 h-4 text-[var(--aether-deep-blue)]" />
                                            )}
                                        </button>
                                        <Package className="w-4 h-4 text-[var(--aether-teal)]" />
                                        <span className="font-medium text-[var(--aether-deep-blue)]">
                                            {subsystem.name}
                                        </span>
                                        <Badge variant="secondary" className="ml-auto text-xs">
                                            {moduleCount} module{moduleCount !== 1 ? "s" : ""}
                                        </Badge>
                                        {onCreateTask && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-6 px-2"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onCreateTask({
                                                        subsystemId: subsystem.id,
                                                        scopeName: subsystem.name
                                                    });
                                                }}
                                            >
                                                <Plus className="w-3 h-3" />
                                            </Button>
                                        )}
                                    </div>

                                    {/* Modules */}
                                    {isExpanded && moduleCount > 0 && (
                                        <div className="border-t bg-white">
                                            {subsystem.modules.map((mod: Module) => (
                                                <div
                                                    key={mod.id}
                                                    className="flex items-center gap-2 p-2 pl-10 hover:bg-gray-50 group"
                                                >
                                                    <FileCode className="w-4 h-4 text-[var(--aether-forest-green)]" />
                                                    <span className="text-sm">{mod.name}</span>
                                                    {mod.files && mod.files.length > 0 && (
                                                        <span className="text-xs text-muted-foreground">
                                                            ({mod.files.length} files)
                                                        </span>
                                                    )}
                                                    {onCreateTask && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-5 px-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => {
                                                                onCreateTask({
                                                                    subsystemId: subsystem.id,
                                                                    moduleId: mod.id,
                                                                    scopeName: `${subsystem.name} > ${mod.name}`
                                                                });
                                                            }}
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Subsystem Purpose */}
                                    {isExpanded && subsystem.purpose && (
                                        <div className="border-t px-3 py-2 text-sm text-muted-foreground bg-white">
                                            <span className="font-medium">Purpose:</span> {subsystem.purpose}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
