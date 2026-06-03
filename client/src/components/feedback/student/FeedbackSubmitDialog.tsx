/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { submitFeedback } from "@/store/slices/feedbackSlice";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Star, Send } from "lucide-react";
import { FEEDBACK_CATEGORY_META } from "@/types/feedback";

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

  const [category, setCategory]       = useState(preselectedCategory ?? "");
  const [rating, setRating]           = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");

  useEffect(() => {
    if (preselectedCategory) setCategory(preselectedCategory);
  }, [preselectedCategory]);

  const isValid = !!category && rating > 0 && feedbackText.trim().length >= 10;

  const handleSubmit = async () => {
    if (!isValid) return;
    await dispatch(submitFeedback({ category, rating, feedback: feedbackText }) as any);
    handleClose();
  };

  const handleClose = () => {
    setCategory(preselectedCategory ?? "");
    setRating(0);
    setHoverRating(0);
    setFeedbackText("");
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

        <div className="space-y-4 pt-4">
          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
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
          </div>

          {/* Star rating */}
          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoverRating || rating)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Feedback text */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Your Feedback</Label>
              <span className="text-xs text-muted-foreground">
                {feedbackText.trim().length}/2000
              </span>
            </div>
            <Textarea
              placeholder="Tell us what you think..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows={4}
              maxLength={2000}
            />
          </div>

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!isValid || submitting}
          >
            <Send className="w-4 h-4 mr-2" />
            {submitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
