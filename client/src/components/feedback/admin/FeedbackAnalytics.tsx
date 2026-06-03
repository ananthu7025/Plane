import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, BarChart3, TrendingUp } from "lucide-react";
import type { CategoryStat } from "@/types/feedback";
import { getFeedbackCategoryMeta } from "@/types/feedback";

interface FeedbackAnalyticsProps {
  categoryStats: CategoryStat[];
}

export function FeedbackAnalytics({ categoryStats }: FeedbackAnalyticsProps) {
  const maxCount = Math.max(...categoryStats.map((c) => c.count), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* By Category */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Feedback by Category
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {categoryStats.map((cat) => (
            <div key={cat.category} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  {getFeedbackCategoryMeta(cat.category).label}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground">{cat.count} reviews</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span>{cat.avgRating}</span>
                  </div>
                </div>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${(cat.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
          {categoryStats.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-4">
              No feedback data yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Avg ratings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Average Ratings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...categoryStats]
            .sort((a, b) => b.avgRating - a.avgRating)
            .map((cat) => (
              <div
                key={cat.category}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="font-semibold">{cat.avgRating || "—"}</span>
                  </div>
                  <span className="text-sm">
                    {getFeedbackCategoryMeta(cat.category).label}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">{cat.count} reviews</span>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
