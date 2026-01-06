import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, FileText, Image, File, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface FileUploadProps {
  projectId: number;
  onUploadComplete?: () => void;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: "uploading" | "complete" | "error";
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function FileUpload({ projectId, onUploadComplete }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, UploadingFile>>(new Map());

  const uploadMutation = trpc.attachments.upload.useMutation({
    onSuccess: (_, variables) => {
      setUploadingFiles((prev) => {
        const next = new Map(prev);
        const key = variables.fileName;
        const existing = next.get(key);
        if (existing) {
          next.set(key, { ...existing, status: "complete", progress: 100 });
        }
        return next;
      });
      
      // Remove from list after a delay
      setTimeout(() => {
        setUploadingFiles((prev) => {
          const next = new Map(prev);
          next.delete(variables.fileName);
          return next;
        });
      }, 2000);

      onUploadComplete?.();
    },
    onError: (error, variables) => {
      setUploadingFiles((prev) => {
        const next = new Map(prev);
        const key = variables.fileName;
        const existing = next.get(key);
        if (existing) {
          next.set(key, { ...existing, status: "error" });
        }
        return next;
      });
      toast.error(`Failed to upload ${variables.fileName}: ${error.message}`);
    },
  });

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`${file.name} is too large. Maximum size is 50MB.`);
          continue;
        }

        // Add to uploading list
        setUploadingFiles((prev) => {
          const next = new Map(prev);
          next.set(file.name, { file, progress: 0, status: "uploading" });
          return next;
        });

        // Convert file to base64
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64Data = e.target?.result as string;
          const base64Content = base64Data.split(",")[1]; // Remove data:mime;base64, prefix

          // Upload file
          uploadMutation.mutate({
            projectId,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type || "application/octet-stream",
            fileData: base64Content,
          });
        };

        reader.onerror = () => {
          toast.error(`Failed to read ${file.name}`);
          setUploadingFiles((prev) => {
            const next = new Map(prev);
            next.delete(file.name);
            return next;
          });
        };

        reader.readAsDataURL(file);
      }
    },
    [projectId, uploadMutation]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
    },
    [handleFiles]
  );

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return <Image className="w-5 h-5" />;
    if (mimeType === "application/pdf") return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Upload className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-2">
            Drag and drop files here, or click to browse
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Supports PDFs, images, code files, ZIP archives (max 50MB per file)
          </p>
          <input
            type="file"
            id="file-upload"
            className="hidden"
            multiple
            onChange={handleFileInput}
            accept=".pdf,.png,.jpg,.jpeg,.gif,.zip,.js,.ts,.tsx,.jsx,.py,.java,.cpp,.c,.h,.css,.html,.json,.xml,.md,.txt"
          />
          <Button asChild variant="outline">
            <label htmlFor="file-upload" className="cursor-pointer">
              Browse Files
            </label>
          </Button>
        </CardContent>
      </Card>

      {uploadingFiles.size > 0 && (
        <div className="space-y-2">
          {Array.from(uploadingFiles.entries()).map(([fileName, fileInfo]) => (
            <Card key={fileName}>
              <CardContent className="flex items-center gap-3 py-3">
                {getFileIcon(fileInfo.file.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(fileInfo.file.size)}
                  </p>
                </div>
                {fileInfo.status === "uploading" && (
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                )}
                {fileInfo.status === "complete" && (
                  <div className="text-green-600 text-sm font-medium">✓ Uploaded</div>
                )}
                {fileInfo.status === "error" && (
                  <div className="text-red-600 text-sm font-medium">✗ Failed</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
