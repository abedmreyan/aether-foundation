import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

interface Proposal {
  id: number;
  projectId: number;
  proposalType: string;
  title: string;
  content: string;
  status: string;
  createdAt: Date;
  reviewedAt: Date | null;
  feedback: string | null;
}

interface ProposalReviewProps {
  proposal: Proposal;
  onReviewed: () => void;
}

const statusConfig = {
  pending_review: { label: "Pending Review", color: "bg-yellow-500", icon: Clock },
  approved: { label: "Approved", color: "bg-green-500", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-red-500", icon: XCircle },
  revised: { label: "Revised", color: "bg-blue-500", icon: FileText },
};

export function ProposalReview({ proposal, onReviewed }: ProposalReviewProps) {
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [feedback, setFeedback] = useState("");

  const approveProposal = trpc.proposals.approve.useMutation({
    onSuccess: () => {
      toast.success("Proposal approved!");
      setIsApproveOpen(false);
      setFeedback("");
      onReviewed();
    },
    onError: (error) => {
      toast.error(`Failed to approve: ${error.message}`);
    },
  });

  const rejectProposal = trpc.proposals.reject.useMutation({
    onSuccess: () => {
      toast.success("Proposal rejected. AI PM will revise and resubmit.");
      setIsRejectOpen(false);
      setFeedback("");
      onReviewed();
    },
    onError: (error) => {
      toast.error(`Failed to reject: ${error.message}`);
    },
  });

  const handleApprove = () => {
    approveProposal.mutate({
      proposalId: proposal.id,
      feedback: feedback.trim() || undefined,
    });
  };

  const handleReject = () => {
    if (!feedback.trim()) {
      toast.error("Please provide feedback for rejection");
      return;
    }
    rejectProposal.mutate({
      proposalId: proposal.id,
      feedback: feedback.trim(),
    });
  };

  const status = statusConfig[proposal.status as keyof typeof statusConfig];
  const StatusIcon = status?.icon || Clock;

  let parsedContent;
  try {
    parsedContent = JSON.parse(proposal.content);
  } catch {
    parsedContent = { content: proposal.content };
  }

  const isPending = proposal.status === "pending_review";

  return (
    <>
      <Card className={isPending ? "border-orange-500" : ""}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <StatusIcon className={`w-5 h-5 ${status?.color.replace("bg-", "text-")}`} />
                <Badge variant="secondary" className={status?.color + " text-white"}>
                  {status?.label}
                </Badge>
                <Badge variant="outline">{proposal.proposalType.replace("_", " ").toUpperCase()}</Badge>
              </div>
              <CardTitle>{proposal.title}</CardTitle>
              <CardDescription>
                Submitted {new Date(proposal.createdAt).toLocaleString()}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {typeof parsedContent === "object" && parsedContent.content ? (
              <Streamdown>{parsedContent.content}</Streamdown>
            ) : (
              <Streamdown>{proposal.content}</Streamdown>
            )}
          </div>
          {proposal.feedback && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Feedback:</p>
              <p className="text-sm text-muted-foreground">{proposal.feedback}</p>
            </div>
          )}
        </CardContent>
        {isPending && (
          <CardFooter className="flex gap-2">
            <Button
              variant="default"
              onClick={() => setIsApproveOpen(true)}
              className="flex-1"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve
            </Button>
            <Button
              variant="destructive"
              onClick={() => setIsRejectOpen(true)}
              className="flex-1"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Approve Dialog */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Proposal</DialogTitle>
            <DialogDescription>
              Confirm that you approve this proposal. The AI PM will proceed with the next phase.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="approve-feedback">Feedback (Optional)</Label>
              <Textarea
                id="approve-feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Add any comments or guidance..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={approveProposal.isPending}>
              {approveProposal.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Proposal</DialogTitle>
            <DialogDescription>
              Provide feedback on why this proposal is rejected. The AI PM will revise and resubmit.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reject-feedback">Feedback (Required)</Label>
              <Textarea
                id="reject-feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Explain what needs to be changed or improved..."
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectProposal.isPending || !feedback.trim()}
            >
              {rejectProposal.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Reject & Request Revision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
