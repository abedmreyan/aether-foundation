import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Image, File, Download, Trash2, Loader2, Paperclip } from "lucide-react";
import { toast } from "sonner";

interface AttachmentsListProps {
  projectId: number;
}

export function AttachmentsList({ projectId }: AttachmentsListProps) {
  const { data: attachments, isLoading, refetch } = trpc.attachments.listByProject.useQuery({
    projectId,
  });

  const deleteMutation = trpc.attachments.delete.useMutation({
    onSuccess: () => {
      toast.success("Attachment deleted");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return <Image className="w-5 h-5 text-blue-600" />;
    if (mimeType === "application/pdf") return <FileText className="w-5 h-5 text-red-600" />;
    return <File className="w-5 h-5 text-gray-600" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDelete = (attachmentId: number, fileName: string) => {
    if (confirm(`Are you sure you want to delete "${fileName}"?`)) {
      deleteMutation.mutate({ attachmentId });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!attachments || attachments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paperclip className="w-5 h-5" />
            Attachments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No files attached yet. Upload files to provide context for AI agents.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paperclip className="w-5 h-5" />
          Attachments ({attachments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              {getFileIcon(attachment.mimeType)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{attachment.fileName}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatFileSize(attachment.fileSize)}</span>
                  <span>•</span>
                  <span>{new Date(attachment.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                >
                  <a
                    href={attachment.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={attachment.fileName}
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(attachment.id, attachment.fileName)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
