import { Calendar, CheckCircle, Clock, Trophy } from "lucide-react";
import type { MentorshipStats } from "@/types/mentorship";

interface MentorshipStatsBarProps {
  stats: MentorshipStats;
}

export function MentorshipStatsBar({ stats }: MentorshipStatsBarProps) {
  const cards = [
    { label: "Total",     value: stats.total,     icon: Calendar,    color: "text-blue-600"   },
    { label: "Pending",   value: stats.pending,   icon: Clock,       color: "text-yellow-600" },
    { label: "Approved",  value: stats.approved,  icon: CheckCircle, color: "text-green-600"  },
    { label: "Completed", value: stats.completed, icon: Trophy,      color: "text-purple-600" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {cards.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-gray-50 ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
