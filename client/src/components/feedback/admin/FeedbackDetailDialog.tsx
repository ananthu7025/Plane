/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { respondToFeedback, clearError, clearSuccessMessage } from "@/store/slices/feedbackSlice";
import { useEffect } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Star, CheckCircle2, Send } from "lucide-react";
import type { Feedback } from "@/types/feedback";
import { getFeedbackCategoryMeta } from "@/types/feedback";

interface FeedbackDetailDialogProps {
  feedback: Feedback | null;
  onClose: () => void;
}

export function FeedbackDetailDialog({ feedback, onClose }: FeedbackDetailDialogProps) {
  const dispatch = useAppDispatch();
  const { responding, error, successMessage } = useAppSelector((s) => s.feedback);
  const [responseText, setResponseText] = useState("");

  useEffect(() => {
    if (successMessage) { toast.success(successMessage); dispatch(clearSuccessMessage()); onClose(); }
  }, [successMessage, dispatch, onClose]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearError()); }
  }, [error, dispatch]);

  const handleSend = () => {
    if (!feedback || !responseText.trim()) return;
    dispatch(respondToFeedback(feedback.id, responseText) as any);
    setResponseText("");
  };

  const handleClose = () => { setResponseText(""); onClose(); };

  if (!feedback) return null;

  const meta = getFeedbackCategoryMeta(feedback.category);

  return (
    <Dialog open={!!feedback} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Feedback Details</DialogTitle>
          <DialogDescription>Review and respond to this feedback</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Student + rating */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-semibold">
                {(feedback.studentName ?? "?").charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-semibold">{feedback.studentName ?? "Student"}</h4>
                <p className="text-sm text-muted-foreground">
                  {new Date(feedback.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${star <= feedback.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`}
                />
              ))}
            </div>
          </div>

          {/* Category + subject + feedback text */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{meta.label}</Badge>
              {feedback.subject && (
                <span className="text-sm text-muted-foreground">{feedback.subject}</span>
              )}
            </div>
            <p className="p-3 rounded-lg bg-muted/50 text-sm">{feedback.feedback}</p>
          </div>

          {/* Response area */}
          {feedback.response ? (
            <div className="space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Response Sent
              </p>
              <p className="p-3 rounded-lg bg-green-50 border border-green-200 text-sm">
                {feedback.response}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium">Your Response</p>
              <Textarea
                placeholder="Type your response..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                rows={3}
                maxLength={2000}
              />
              <Button
                className="w-full"
                onClick={handleSend}
                disabled={!responseText.trim() || responding}
              >
                <Send className="w-4 h-4 mr-2" />
                {responding ? "Sending..." : "Send Response"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
