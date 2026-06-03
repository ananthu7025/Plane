/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { respondToFeedback, clearError, clearSuccessMessage } from "@/store/slices/feedbackSlice";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Star, CheckCircle2, Send } from "lucide-react";
import type { Feedback } from "@/types/feedback";
import { getFeedbackCategoryMeta } from "@/types/feedback";

const respondSchema = z.object({
  response: z.string().min(5, "Response must be at least 5 characters").max(2000, "Response must not exceed 2000 characters"),
});

type RespondFormData = z.infer<typeof respondSchema>;

interface FeedbackDetailDialogProps {
  feedback: Feedback | null;
  onClose: () => void;
}

export function FeedbackDetailDialog({ feedback, onClose }: FeedbackDetailDialogProps) {
  const dispatch = useAppDispatch();
  const { responding, error, successMessage } = useAppSelector((s) => s.feedback);

  const form = useForm<RespondFormData>({
    resolver: zodResolver(respondSchema),
    defaultValues: { response: "" },
  });

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearSuccessMessage());
      handleClose();
    }
  }, [successMessage, dispatch]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearError()); }
  }, [error, dispatch]);

  const onSubmit = (data: RespondFormData) => {
    if (!feedback) return;
    dispatch(respondToFeedback(feedback.id, data.response) as any);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!feedback) return null;

  const meta = getFeedbackCategoryMeta(feedback.category);
  const responseLen = form.watch("response")?.length ?? 0;

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

          {/* Category + subject + feedback */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{meta.label}</Badge>
              {feedback.subject && (
                <span className="text-sm text-muted-foreground">{feedback.subject}</span>
              )}
            </div>
            <p className="p-3 rounded-lg bg-muted/50 text-sm">{feedback.feedback}</p>
          </div>

          {/* Response */}
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium">Your Response <span className="text-red-500">*</span></label>
                <span className="text-xs text-muted-foreground">{responseLen}/2000</span>
              </div>
              <Textarea
                placeholder="Type your response..."
                {...form.register("response")}
                rows={3}
                maxLength={2000}
                className={form.formState.errors.response ? "border-red-500" : ""}
              />
              {form.formState.errors.response && (
                <p className="text-sm text-red-500">{form.formState.errors.response.message}</p>
              )}
              <Button type="submit" className="w-full" disabled={responding}>
                <Send className="w-4 h-4 mr-2" />
                {responding ? "Sending..." : "Send Response"}
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
