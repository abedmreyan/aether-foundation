import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Trash2, Edit } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function CannedResponses() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [shortcut, setShortcut] = useState("");

  const cannedResponsesQuery = trpc.cannedResponse.list.useQuery();
  const createMutation = trpc.cannedResponse.create.useMutation({
    onSuccess: () => {
      cannedResponsesQuery.refetch();
      setIsCreateDialogOpen(false);
      setCategory("");
      setTitle("");
      setContent("");
      setShortcut("");
      toast.success("Quick reply created!");
    },
  });
  const deleteMutation = trpc.cannedResponse.delete.useMutation({
    onSuccess: () => {
      cannedResponsesQuery.refetch();
      toast.success("Quick reply deleted!");
    },
  });

  const handleCreate = () => {
    if (!category || !title || !content) {
      toast.error("Please fill in all required fields");
      return;
    }
    createMutation.mutate({ category, title, content, shortcut: shortcut || undefined });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this quick reply?")) {
      deleteMutation.mutate({ id });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to manage quick replies</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>Log In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group responses by category
  const groupedResponses = (cannedResponsesQuery.data || []).reduce((acc: any, response: any) => {
    if (!acc[response.category]) {
      acc[response.category] = [];
    }
    acc[response.category].push(response);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <a className="flex items-center gap-2">
              {APP_LOGO && <img src={APP_LOGO} alt={APP_TITLE} className="h-8" />}
              <span className="text-xl font-bold text-slate-900">{APP_TITLE}</span>
            </a>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/widgets">
              <a className="text-slate-600 hover:text-slate-900">Widgets</a>
            </Link>
            <Link href="/dashboard">
              <a className="text-slate-600 hover:text-slate-900">Dashboard</a>
            </Link>
            <Link href="/agent-chat">
              <a className="text-slate-600 hover:text-slate-900">Agent Chat</a>
            </Link>
            <Link href="/analytics">
              <a className="text-slate-600 hover:text-slate-900">Analytics</a>
            </Link>
            <span className="text-sm text-slate-600">{user?.name}</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Quick Replies</h1>
            <p className="text-slate-600">Manage your canned responses for faster customer support</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Quick Reply
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Quick Reply</DialogTitle>
                <DialogDescription>Add a new canned response to use in chats</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Input
                    id="category"
                    placeholder="e.g., Greetings, Support, Closing"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Welcome Message"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="content">Message Content *</Label>
                  <Textarea
                    id="content"
                    placeholder="Enter the message content..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="shortcut">Shortcut (Optional)</Label>
                  <Input
                    id="shortcut"
                    placeholder="e.g., /welcome"
                    value={shortcut}
                    onChange={(e) => setShortcut(e.target.value)}
                  />
                </div>
                <Button onClick={handleCreate} className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {Object.keys(groupedResponses).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-slate-500">No quick replies yet. Create your first one to get started!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedResponses).map(([cat, responses]: [string, any]) => (
              <Card key={cat}>
                <CardHeader>
                  <CardTitle className="text-lg">{cat}</CardTitle>
                  <CardDescription>{responses.length} quick replies</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {responses.map((response: any) => (
                      <div
                        key={response.id}
                        className="flex items-start justify-between p-4 border rounded-lg hover:bg-slate-50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{response.title}</h3>
                            {response.shortcut && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                {response.shortcut}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600">{response.content}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(response.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
