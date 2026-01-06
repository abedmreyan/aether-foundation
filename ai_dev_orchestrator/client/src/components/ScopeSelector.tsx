import { trpc } from "@/lib/trpc";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Package, FileCode, FolderTree } from "lucide-react";

interface ScopeSelectorProps {
    projectId: number;
    value: { subsystemId?: number; moduleId?: number };
    onChange: (value: { subsystemId?: number; moduleId?: number }) => void;
}

export function ScopeSelector({ projectId, value, onChange }: ScopeSelectorProps) {
    const { data: subsystems } = trpc.subsystems.list.useQuery(
        { projectId },
        { enabled: !!projectId }
    );

    const selectedSubsystem = subsystems?.find((s: any) => s.id === value.subsystemId);

    return (
        <div className="space-y-3">
            <div className="space-y-2">
                <Label className="flex items-center gap-2">
                    <FolderTree className="w-4 h-4 text-[var(--aether-teal)]" />
                    Task Scope
                </Label>

                {/* Subsystem Selector */}
                <Select
                    value={value.subsystemId?.toString() || "project"}
                    onValueChange={(val) => {
                        if (val === "project") {
                            onChange({ subsystemId: undefined, moduleId: undefined });
                        } else {
                            onChange({ subsystemId: parseInt(val), moduleId: undefined });
                        }
                    }}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select scope" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="project">
                            <div className="flex items-center gap-2">
                                <FolderTree className="w-4 h-4" />
                                <span>Entire Project</span>
                            </div>
                        </SelectItem>
                        {subsystems?.map((subsystem: any) => (
                            <SelectItem key={subsystem.id} value={subsystem.id.toString()}>
                                <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4 text-[var(--aether-teal)]" />
                                    <span>{subsystem.name}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Module Selector (only if subsystem is selected) */}
            {selectedSubsystem && selectedSubsystem.modules?.length > 0 && (
                <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                        <FileCode className="w-4 h-4 text-[var(--aether-forest-green)]" />
                        Module (optional)
                    </Label>
                    <Select
                        value={value.moduleId?.toString() || "subsystem"}
                        onValueChange={(val) => {
                            if (val === "subsystem") {
                                onChange({ subsystemId: value.subsystemId, moduleId: undefined });
                            } else {
                                onChange({ subsystemId: value.subsystemId, moduleId: parseInt(val) });
                            }
                        }}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select module (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="subsystem">
                                <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4" />
                                    <span>All of {selectedSubsystem.name}</span>
                                </div>
                            </SelectItem>
                            {selectedSubsystem.modules.map((mod: any) => (
                                <SelectItem key={mod.id} value={mod.id.toString()}>
                                    <div className="flex items-center gap-2">
                                        <FileCode className="w-4 h-4 text-[var(--aether-forest-green)]" />
                                        <span>{mod.name}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Scope Summary */}
            <div className="text-sm text-muted-foreground bg-[var(--aether-light-gray)]/50 rounded-md p-2">
                <span className="font-medium">Scope:</span>{" "}
                {!value.subsystemId ? (
                    "Project-wide task"
                ) : value.moduleId ? (
                    `${selectedSubsystem?.name} → ${selectedSubsystem?.modules?.find((m: any) => m.id === value.moduleId)?.name}`
                ) : (
                    `${selectedSubsystem?.name} subsystem`
                )}
            </div>
        </div>
    );
}
