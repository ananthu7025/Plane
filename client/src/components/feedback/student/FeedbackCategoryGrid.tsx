import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { FEEDBACK_CATEGORY_META } from "@/types/feedback";

interface FeedbackCategoryGridProps {
  onAddFeedback: (category: string) => void;
}

export function FeedbackCategoryGrid({ onAddFeedback }: FeedbackCategoryGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {FEEDBACK_CATEGORY_META.map((cat) => (
        <Card
          key={cat.value}
          className="hover:border-primary/50 transition-all cursor-pointer"
        >
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-muted mx-auto mb-4 flex items-center justify-center">
              <cat.icon className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold">{cat.label}</h3>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => onAddFeedback(cat.value)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Feedback
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
