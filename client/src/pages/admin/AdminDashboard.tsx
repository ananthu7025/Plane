import {
  Users,
  Mail,
  BarChart2,
  Shield,
  Settings,
  Flag,
  BookOpen,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

const features = [
  { icon: BarChart2, label: "Analytics", description: "Platform usage, engagement, and growth metrics" },
  { icon: Users, label: "User Overview", description: "Active students, mentors, and role distribution" },
  { icon: Flag, label: "Moderation Queue", description: "Flagged content awaiting review" },
  { icon: Mail, label: "Email Campaigns", description: "Broadcast announcements to students" },
  { icon: BookOpen, label: "Course Insights", description: "Enrolment rates and course performance" },
  { icon: Settings, label: "System Settings", description: "Platform configuration and feature flags" },
];

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Admin Dashboard{user?.fullName ? ` — ${user.fullName}` : ""}
        </h1>
        <p className="text-muted-foreground mt-1">Platform overview and management tools are being set up.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, label, description }) => (
          <Card key={label} className="opacity-60">
            <CardContent className="p-6 flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{label}</p>
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
              </div>
              <span className="text-xs font-medium text-muted-foreground/70 border border-border rounded-full px-3 py-0.5">
                Coming Soon
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <Shield className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="font-medium text-muted-foreground">Dashboard overview coming soon</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Key metrics, recent activity, and moderation alerts will appear here.
        </p>
      </div>
    </div>
  );
}
