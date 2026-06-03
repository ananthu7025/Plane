import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, CheckCircle2, Clock } from "lucide-react";
import type { Feedback } from "@/types/feedback";
import { getFeedbackCategoryMeta } from "@/types/feedback";

interface MyFeedbackListProps {
  feedback: Feedback[];
}

export function MyFeedbackList({ feedback }: MyFeedbackListProps) {
  if (feedback.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        You haven't submitted any feedback yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {feedback.map((item) => {
        const meta = getFeedbackCategoryMeta(item.category);
        const Icon = meta.icon;

        return (
          <Card key={item.id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-muted flex-shrink-0">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.subject && (
                          <h3 className="font-semibold">{item.subject}</h3>
                        )}
                        <Badge variant="outline">{meta.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center">
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
                      {item.status === "reviewed" ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" />Reviewed
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Clock className="w-3 h-3 mr-1" />Pending
                        </Badge>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-foreground">{item.feedback}</p>

                  {item.response && (
                    <div className="mt-3 p-4 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium">Admin Response</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.response}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
