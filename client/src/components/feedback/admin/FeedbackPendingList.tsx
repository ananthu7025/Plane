import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import type { Feedback } from "@/types/feedback";
import { getFeedbackCategoryMeta } from "@/types/feedback";

interface FeedbackPendingListProps {
  feedback: Feedback[];
  onRespond: (feedback: Feedback) => void;
}

export function FeedbackPendingList({ feedback, onRespond }: FeedbackPendingListProps) {
  if (feedback.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No pending feedback — all caught up!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {feedback.map((item) => (
        <Card key={item.id} className="border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-semibold flex-shrink-0">
                  {(item.studentName ?? "?").charAt(0).toUpperCase()}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold">{item.studentName ?? "Student"}</h4>
                    <Badge variant="outline">
                      {getFeedbackCategoryMeta(item.category).label}
                    </Badge>
                  </div>
                  {item.subject && (
                    <p className="text-sm text-muted-foreground">{item.subject}</p>
                  )}
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= item.rating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm mt-1">{item.feedback}</p>
                </div>
              </div>
              <Button onClick={() => onRespond(item)} className="flex-shrink-0">
                Respond
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
