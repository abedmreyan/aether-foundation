import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "../lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { ScrollArea } from "../components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { GripVertical, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { TaskContextDialog } from "../components/TaskContextDialog";
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function Pipelines() {
    const [, setLocation] = useLocation();
    const navigate = (path: string) => setLocation(path);
    const utils = trpc.useUtils();
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
    const [contextDialogOpen, setContextDialogOpen] = useState(false);
    const [scopeFilter, setScopeFilter] = useState<"all" | number>("all");

    const { data: projects = [] } = trpc.projects.list.useQuery();
    const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || 1);

    const { data: pipelines = [], isLoading } = trpc.pipelines.getByProject.useQuery(
        { projectId: selectedProjectId },
        { enabled: !!selectedProjectId }
    );

    // Get subsystems for scope filtering
    const { data: subsystems = [] } = trpc.subsystems.list.useQuery(
        { projectId: selectedProjectId },
        { enabled: !!selectedProjectId }
    );

    // Filter pipelines' tasks by scope
    const filteredPipelines = useMemo(() => {
        if (scopeFilter === "all") return pipelines;
        return pipelines.map(pipeline => ({
            ...pipeline,
            tasks: pipeline.tasks.filter((task: any) =>
                task.subsystemId === scopeFilter || (!task.subsystemId && scopeFilter === "all")
            )
        }));
    }, [pipelines, scopeFilter]);

    const moveTaskMutation = trpc.tasks.moveStage.useMutation({
        onSuccess: () => {
            utils.pipelines.getByProject.invalidate();
            utils.tasks.getPendingApproval.invalidate();
        },
        onError: (err) => toast.error(err.message),
    });

    const reorderTaskMutation = trpc.tasks.reorder.useMutation({
        onSuccess: () => {
            utils.pipelines.getByProject.invalidate();
        },
        onError: (err) => toast.error(err.message),
    });

    if (isLoading) {
        return (
            <div className="container mx-auto py-8">
                <div className="text-center">Loading pipelines...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Pipelines</h1>
                    <p className="text-muted-foreground">Kanban boards for Development, Marketing, and Research</p>
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
                    {/* Scope Filter */}
                    {subsystems.length > 0 && (
                        <Select
                            value={scopeFilter.toString()}
                            onValueChange={(v) => setScopeFilter(v === "all" ? "all" : parseInt(v))}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by scope" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All scopes</SelectItem>
                                {subsystems.map((s: any) => (
                                    <SelectItem key={s.id} value={s.id.toString()}>
                                        {s.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                    <Button onClick={() => navigate("/dashboard")}>Dashboard</Button>
                </div>
            </div>

            <Tabs defaultValue={filteredPipelines[0]?.id?.toString() || "1"} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    {filteredPipelines.map((pipeline) => (
                        <TabsTrigger key={pipeline.id} value={pipeline.id.toString()}>
                            {pipeline.name} ({pipeline.tasks.length})
                        </TabsTrigger>
                    ))}
                </TabsList>

                {filteredPipelines.map((pipeline) => (
                    <TabsContent key={pipeline.id} value={pipeline.id.toString()} className="mt-6">
                        <DraggableKanbanBoard
                            pipeline={pipeline}
                            onTaskMove={(taskId, newStage, newOrder) => {
                                moveTaskMutation.mutate({ taskId, stage: newStage, queueOrder: newOrder });
                                toast.success("Task moved");
                            }}
                            onTaskReorder={(taskId, newOrder) => {
                                reorderTaskMutation.mutate({ taskId, queueOrder: newOrder });
                            }}
                            onTaskClick={(taskId) => {
                                setSelectedTaskId(taskId);
                                setContextDialogOpen(true);
                            }}
                        />
                    </TabsContent>
                ))}
            </Tabs>

            {pipelines.length === 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>No Pipelines Found</CardTitle>
                        <CardDescription>Create a project to see its pipelines here</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => navigate("/projects")}>Go to Projects</Button>
                    </CardContent>
                </Card>
            )}

            <TaskContextDialog
                taskId={selectedTaskId}
                open={contextDialogOpen}
                onOpenChange={setContextDialogOpen}
            />
        </div>
    );
}

// Draggable Kanban Board
function DraggableKanbanBoard({
    pipeline,
    onTaskMove,
    onTaskReorder,
    onTaskClick,
}: {
    pipeline: any;
    onTaskMove: (taskId: number, newStage: string, newOrder: number) => void;
    onTaskReorder: (taskId: number, newOrder: number) => void;
    onTaskClick: (taskId: number) => void;
}) {
    const [activeId, setActiveId] = useState<number | null>(null);
    const stages = Array.isArray(pipeline.stages) ? pipeline.stages : JSON.parse(pipeline.stages || "[]");

    const tasksByStage = useMemo(() => {
        const grouped = stages.reduce((acc: any, stage: string) => {
            acc[stage] = pipeline.tasks
                .filter((t: any) => t.stage === stage)
                .sort((a: any, b: any) => a.queueOrder - b.queueOrder);
            return acc;
        }, {});
        return grouped;
    }, [pipeline.tasks, stages]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as number);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeId = active.id as number;
        const overId = over.id;

        // Find the task being dragged
        const activeTask = pipeline.tasks.find((t: any) => t.id === activeId);
        if (!activeTask) return;

        // Check if we're dropping on a stage container
        if (typeof overId === "string" && stages.includes(overId)) {
            // Dropped on a stage - move to that stage
            const newStage = overId;
            if (newStage !== activeTask.stage) {
                const newOrder = tasksByStage[newStage]?.length || 0;
                onTaskMove(activeId, newStage, newOrder);
            }
        } else if (typeof overId === "number") {
            // Dropped on another task - reorder within stage
            const overTask = pipeline.tasks.find((t: any) => t.id === overId);
            if (!overTask) return;

            if (activeTask.stage === overTask.stage) {
                // Same stage reordering
                const tasksInStage = tasksByStage[activeTask.stage];
                const activeIndex = tasksInStage.findIndex((t: any) => t.id === activeId);
                const overIndex = tasksInStage.findIndex((t: any) => t.id === overId);

                if (activeIndex !== overIndex) {
                    onTaskReorder(activeId, overIndex);
                }
            } else {
                // Different stage - move to the stage of the task we're hovering over
                const overStage = overTask.stage;
                const overIndex = tasksByStage[overStage].findIndex((t: any) => t.id === overId);
                onTaskMove(activeId, overStage, overIndex);
            }
        }
    };

    const activeTask = activeId ? pipeline.tasks.find((t: any) => t.id === activeId) : null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {stages.map((stage: string) => (
                    <DroppableStage
                        key={stage}
                        stage={stage}
                        tasks={tasksByStage[stage]}
                        onTaskClick={onTaskClick}
                        availableStages={stages}
                    />
                ))}
            </div>
            <DragOverlay>
                {activeTask ? (
                    <div className="opacity-80">
                        <TaskCard task={activeTask} isDragging={true} availableStages={stages} />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

// Droppable Stage Column
function DroppableStage({
    stage,
    tasks,
    onTaskClick,
    availableStages,
}: {
    stage: string;
    tasks: any[];
    onTaskClick: (taskId: number) => void;
    availableStages: string[];
}) {
    const { setNodeRef } = useSortable({
        id: stage,
        data: { type: "stage" },
    });

    const taskIds = tasks.map((t) => t.id);

    return (
        <Card ref={setNodeRef} className="h-fit">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">{stage}</CardTitle>
                <CardDescription className="text-xs">{tasks.length} tasks</CardDescription>
            </CardHeader>
            <CardContent className="p-3 pt-0">
                <ScrollArea className="h-[500px]">
                    <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2">
                            {tasks.map((task) => (
                                <SortableTaskCard
                                    key={task.id}
                                    task={task}
                                    onClick={() => onTaskClick(task.id)}
                                    availableStages={availableStages}
                                />
                            ))}

                            {tasks.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    Drop tasks here
                                </div>
                            )}
                        </div>
                    </SortableContext>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

// Sortable Task Card
function SortableTaskCard({
    task,
    onClick,
    availableStages,
}: {
    task: any;
    onClick: () => void;
    availableStages: string[];
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: task.id,
        data: { type: "task", task },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <TaskCard task={task} onClick={onClick} dragHandleProps={listeners} availableStages={availableStages} />
        </div>
    );
}

// Task Card Component
function TaskCard({
    task,
    onClick,
    dragHandleProps,
    isDragging,
    availableStages,
}: {
    task: any;
    onClick?: () => void;
    dragHandleProps?: any;
    isDragging?: boolean;
    availableStages: string[];
}) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed":
                return "bg-green-500/10 text-green-700 border-green-200";
            case "in_progress":
                return "bg-blue-500/10 text-blue-700 border-blue-200";
            case "approved":
                return "bg-purple-500/10 text-purple-700 border-purple-200";
            case "pending":
                return "bg-orange-500/10 text-orange-700 border-orange-200";
            default:
                return "bg-gray-500/10 text-gray-700 border-gray-200";
        }
    };

    return (
        <div
            className={`p-3 border rounded-lg cursor-pointer hover:shadow-md transition-shadow ${getStatusColor(
                task.status
            )} ${isDragging ? "shadow-lg" : ""}`}
            onClick={onClick}
        >
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                    <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
                    {task.suggestedAgentRole && (
                        <Badge variant="outline" className="mt-1 text-xs">
                            {task.suggestedAgentRole}
                        </Badge>
                    )}
                </div>
                <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
                    <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
            </div>

            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{task.description}</p>

            <div className="flex items-center justify-between mt-2">
                <Badge variant="secondary" className="text-xs">
                    #{task.id}
                </Badge>
                <div className="text-xs text-muted-foreground">Order: {task.queueOrder}</div>
            </div>
        </div>
    );
}
