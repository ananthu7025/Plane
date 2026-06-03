import {
  BookOpen,
  Users,
  FileText,
  BarChart2,
  Calendar,
  CreditCard,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

const features = [
  { icon: BookOpen, label: "MCQ & Tests", description: "Practice exams and topic-wise quizzes" },
  { icon: Users, label: "Mentorship", description: "One-on-one sessions with expert mentors" },
  { icon: BarChart2, label: "Progress Analytics", description: "Track your scores and improvement" },
  { icon: Calendar, label: "Calendar", description: "Upcoming sessions and exam schedules" },
  { icon: CreditCard, label: "Subscriptions", description: "Manage your active plans" },
  { icon: MessageSquare, label: "Feedback", description: "Share your experience with us" },
];

export default function StudentDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back{user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}
        </h1>
        <p className="text-muted-foreground mt-1">Your learning hub is being set up. More features coming soon.</p>
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
        <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="font-medium text-muted-foreground">Dashboard analytics coming soon</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Your stats, progress charts, and activity feed will appear here.
        </p>
      </div>
    </div>
  );
}
