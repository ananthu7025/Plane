import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Users, Eye, Flag } from "lucide-react";

export function CommunityRulesWidget() {
  const rules = [
    {
      icon: <AlertCircle className="w-4 h-4" />,
      title: "Be Respectful",
      description: "Treat all community members with respect and courtesy",
    },
    {
      icon: <Users className="w-4 h-4" />,
      title: "Stay On Topic",
      description: "Keep discussions relevant to the community and categories",
    },
    {
      icon: <Eye className="w-4 h-4" />,
      title: "Constructive Feedback",
      description: "Provide helpful and constructive feedback to others",
    },
    {
      icon: <Flag className="w-4 h-4" />,
      title: "No Spam",
      description: "Avoid posting spam, advertisements, or irrelevant content",
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Community Rules</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {rules.map((rule, idx) => (
          <div key={idx} className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
              {rule.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{rule.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {rule.description}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
