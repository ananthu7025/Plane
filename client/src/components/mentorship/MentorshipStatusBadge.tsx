import type { MentorshipStatus } from "@/types/mentorship";
import { STATUS_LABELS, STATUS_BADGE_CLASSES } from "./constants";

interface MentorshipStatusBadgeProps {
  status: MentorshipStatus;
}

export function MentorshipStatusBadge({ status }: MentorshipStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE_CLASSES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
