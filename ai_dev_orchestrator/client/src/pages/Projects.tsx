import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { FileUpload } from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Rocket, CheckCircle2, AlertCircle, Code, TestTube, FolderOpen, FileCode2 } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

const statusConfig = {
  active: { label: "Active", color: "bg-green-500", icon: Rocket },
  paused: { label: "Paused", color: "bg-yellow-500", icon: AlertCircle },
  completed: { label: "Completed", color: "bg-blue-500", icon: CheckCircle2 },
  archived: { label: "Archived", color: "bg-gray-500", icon: Code },
};

export default function Projects() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [createdProjectId, setCreatedProjectId] = useState<number | null>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);

  // Import local project state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [localPath, setLocalPath] = useState("");
  const [scannedProject, setScannedProject] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);

  const { data: projects, isLoading, refetch } = trpc.projects.list.useQuery();
  const createProject = trpc.projects.create.useMutation({
    onSuccess: (project) => {
      toast.success("Project created! You can now upload files.");
      setCreatedProjectId(project.id);
      setShowFileUpload(true);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to create project: ${error.message}`);
    },
  });

  // Import project mutation
  const importProject = trpc.projects.import.useMutation({
    onSuccess: (result) => {
      toast.success(`Project "${result.name}" imported successfully!`);
      setIsImportOpen(false);
      setLocalPath("");
      setScannedProject(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to import: ${error.message}`);
    },
  });

  // Scan project mutation
  const scanProject = trpc.projects.scan.useMutation({
    onSuccess: (result) => {
      setScannedProject(result);
      setIsScanning(false);
    },
    onError: (error) => {
      toast.error(`Failed to scan: ${error.message}`);
      setIsScanning(false);
    },
  });

  const handleScan = () => {
    if (!localPath.trim()) {
      toast.error("Please enter a path");
      return;
    }
    setIsScanning(true);
    setScannedProject(null);
    scanProject.mutate({ localPath });
  };

  const handleImport = () => {
    importProject.mutate({ localPath });
  };

  const handleCreate = () => {
    if (!name.trim() || !description.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    createProject.mutate({ name, description });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Projects</h1>
          <p className="text-muted-foreground">
            Manage your AI-orchestrated development projects
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Submit your idea and let the AI Project Manager orchestrate the development
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {!showFileUpload ? (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="name">Project Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., E-commerce Platform"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Project Vision & Requirements</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your project idea, goals, target users, and key features..."
                      rows={8}
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">✓ Project Created</p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">Now you can upload files to provide context for the AI agents.</p>
                  </div>
                  {createdProjectId && (
                    <FileUpload
                      projectId={createdProjectId}
                      onUploadComplete={() => { }}
                    />
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              {!showFileUpload ? (
                <>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} disabled={createProject.isPending}>
                    {createProject.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Create Project
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => {
                    setIsCreateOpen(false);
                    setName("");
                    setDescription("");
                    setCreatedProjectId(null);
                    setShowFileUpload(false);
                  }}
                >
                  Done
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Import Local Project Dialog */}
        <Dialog open={isImportOpen} onOpenChange={(open) => {
          setIsImportOpen(open);
          if (!open) {
            setScannedProject(null);
            setLocalPath("");
          }
        }}>
          <DialogTrigger asChild>
            <Button size="lg" variant="outline" className="ml-2">
              <FolderOpen className="w-4 h-4 mr-2" />
              Import Local
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Import Local Project</DialogTitle>
              <DialogDescription>
                Load an existing project from your local drive
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="localPath">Project Path</Label>
                <div className="flex gap-2">
                  <Input
                    id="localPath"
                    value={localPath}
                    onChange={(e) => setLocalPath(e.target.value)}
                    placeholder="/Users/you/projects/my-app"
                    className="flex-1"
                  />
                  <Button onClick={handleScan} disabled={isScanning}>
                    {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : "Scan"}
                  </Button>
                </div>
              </div>

              {scannedProject && (
                <div className="space-y-3 p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileCode2 className="w-5 h-5 text-primary" />
                    <span className="font-semibold">{scannedProject.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {scannedProject.description?.substring(0, 200)}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {scannedProject.techStack?.slice(0, 6).map((tech: string) => (
                      <Badge key={tech} variant="secondary" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {scannedProject.structure?.totalFiles} files •
                    {scannedProject.structure?.totalDirs} directories
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsImportOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={!scannedProject || importProject.isPending}
              >
                {importProject.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Import Project
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!projects || projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Rocket className="w-16 h-16 mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first project to get started with AI-orchestrated development
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const status = statusConfig[project.status as keyof typeof statusConfig] || statusConfig.active;
            const StatusIcon = status.icon;

            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <StatusIcon className={`w-5 h-5 ${status.color.replace('bg-', 'text-')}`} />
                      <Badge variant="secondary" className={`${status.color} text-white`}>
                        {status.label}
                      </Badge>
                    </div>
                    <CardTitle className="line-clamp-1">{project.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {project.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      Created {new Date(project.createdAt).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
