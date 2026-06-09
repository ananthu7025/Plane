import { ExternalLink, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MentorshipStatusBadge } from "./MentorshipStatusBadge";
import { TOPIC_LABELS } from "./constants";
import type { MentorshipRequest } from "@/types/mentorship";

interface MeetingCardProps {
  request: MentorshipRequest;
}

export function MeetingCard({ request }: MeetingCardProps) {
  const displayDate = new Date(
    request.meetingStartDateTime ??
    request.rescheduledDateTime ??
    request.preferredDateTime
  );

  const canJoin = request.status === "APPROVED" && !!request.teamsJoinUrl;

  return (
    <div className="bg-white rounded-xl border p-5 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900">{TOPIC_LABELS[request.topic]}</h3>
        <MentorshipStatusBadge status={request.status} />
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          {displayDate.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          {displayDate.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      {request.status === "REJECTED" && request.rejectionReason && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {request.rejectionReason}
        </p>
      )}

      {canJoin && (
        <a href={request.teamsJoinUrl!} target="_blank" rel="noopener noreferrer">
          <Button size="sm" className="w-full">
            <ExternalLink className="h-4 w-4 mr-2" />
            Join Teams Meeting
          </Button>
        </a>
      )}
    </div>
  );
}
