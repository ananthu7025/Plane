/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { submitFeedback } from "@/store/slices/feedbackSlice";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Star, Send } from "lucide-react";
import { FEEDBACK_CATEGORY_META } from "@/types/feedback";

const feedbackSubmitSchema = z.object({
  category:    z.string().min(1, "Please select a category"),
  rating:      z.number().int().min(1, "Please select a rating").max(5),
  feedbackText: z.string().min(10, "Feedback must be at least 10 characters").max(2000, "Feedback must not exceed 2000 characters"),
});

type FeedbackSubmitFormData = z.infer<typeof feedbackSubmitSchema>;

interface FeedbackSubmitDialogProps {
  isOpen: boolean;
  preselectedCategory?: string;
  onClose: () => void;
}

export function FeedbackSubmitDialog({
  isOpen,
  preselectedCategory,
  onClose,
}: FeedbackSubmitDialogProps) {
  const dispatch = useAppDispatch();
  const { submitting } = useAppSelector((s) => s.feedback);
  const [hoverRating, setHoverRating] = useState(0);

  const form = useForm<FeedbackSubmitFormData>({
    resolver: zodResolver(feedbackSubmitSchema),
    defaultValues: { category: preselectedCategory ?? "", rating: 0, feedbackText: "" },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({ category: preselectedCategory ?? "", rating: 0, feedbackText: "" });
      setHoverRating(0);
    }
  }, [isOpen, preselectedCategory, form]);

  const feedbackLen = form.watch("feedbackText")?.length ?? 0;
  const currentRating = form.watch("rating");

  const onSubmit = async (data: FeedbackSubmitFormData) => {
    await dispatch(submitFeedback({
      category: data.category,
      rating:   data.rating,
      feedback: data.feedbackText,
    }) as any);
    handleClose();
  };

  const handleClose = () => {
    form.reset();
    setHoverRating(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit Feedback</DialogTitle>
          <DialogDescription>
            We value your feedback. Please share your thoughts with us.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          {/* Category */}
          <div>
            <label className="text-sm font-medium block mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <Select
              value={form.watch("category")}
              onValueChange={(value) => form.setValue("category", value, { shouldValidate: true })}
            >
              <SelectTrigger className={form.formState.errors.category ? "border-red-500" : ""}>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {FEEDBACK_CATEGORY_META.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <div className="flex items-center gap-2">
                      <cat.icon className="w-4 h-4" />
                      {cat.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.category && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.category.message}</p>
            )}
          </div>

          {/* Star rating */}
          <div>
            <label className="text-sm font-medium block mb-2">
              Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => form.setValue("rating", star, { shouldValidate: true })}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoverRating || currentRating)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            {form.formState.errors.rating && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.rating.message}</p>
            )}
          </div>

          {/* Feedback text */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">
                Your Feedback <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-muted-foreground">{feedbackLen}/2000</span>
            </div>
            <Textarea
              placeholder="Tell us what you think..."
              {...form.register("feedbackText")}
              rows={4}
              maxLength={2000}
              className={form.formState.errors.feedbackText ? "border-red-500" : ""}
            />
            {form.formState.errors.feedbackText && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.feedbackText.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            <Send className="w-4 h-4 mr-2" />
            {submitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
