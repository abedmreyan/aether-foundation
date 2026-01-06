import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Play, CheckCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface ProjectActionsProps {
  projectId: number;
  projectStatus: string;
  onActionComplete?: () => void;
}

export function ProjectActions({ projectId, projectStatus, onActionComplete }: ProjectActionsProps) {
  const [isStarting, setIsStarting] = useState(false);

  const startProject = trpc.orchestration.startProject.useMutation({
    onSuccess: () => {
      toast.success("AI Project Manager is analyzing your project idea!");
      setIsStarting(false);
      onActionComplete?.();
    },
    onError: (error) => {
      toast.error(`Failed to start project: ${error.message}`);
      setIsStarting(false);
    },
  });

  const handleStartProject = async () => {
    setIsStarting(true);
    startProject.mutate({ projectId });
  };

  // Show start button only for projects in ideation phase
  if (projectStatus === "ideation") {
    return (
      <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5 text-blue-600" />
            Ready to Start
          </CardTitle>
          <CardDescription>
            Click below to have the AI Project Manager analyze your idea and create a comprehensive strategy proposal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleStartProject}
            disabled={isStarting}
            size="lg"
            className="w-full"
          >
            {isStarting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                AI PM is working...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start AI Analysis
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show progress indicator for other phases
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          Project Active
        </CardTitle>
        <CardDescription>
          Your AI team is working on this project. Review proposals below and monitor agent activity.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
