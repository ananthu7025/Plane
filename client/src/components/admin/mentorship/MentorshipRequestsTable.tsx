import { Button } from "@/components/ui/button";
import { MentorshipStatusBadge } from "@/components/mentorship/MentorshipStatusBadge";
import { TOPIC_LABELS } from "@/components/mentorship/constants";
import type { MentorshipRequest } from "@/types/mentorship";

interface MentorshipRequestsTableProps {
  requests: MentorshipRequest[];
  onSelect: (request: MentorshipRequest) => void;
}

export function MentorshipRequestsTable({
  requests,
  onSelect,
}: MentorshipRequestsTableProps) {
  if (requests.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No mentorship requests found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="pb-3 font-medium">Student</th>
            <th className="pb-3 font-medium">Topic</th>
            <th className="pb-3 font-medium">Preferred Date</th>
            <th className="pb-3 font-medium">Status</th>
            <th className="pb-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {requests.map((request) => {
            const displayDate = new Date(request.preferredDateTime);
            return (
              <tr key={request.id} className="hover:bg-gray-50">
                <td className="py-3">
                  <p className="font-medium text-gray-900">
                    {request.studentName ?? "Unknown"}
                  </p>
                  <p className="text-xs text-gray-500">{request.studentEmail}</p>
                </td>
                <td className="py-3">{TOPIC_LABELS[request.topic]}</td>
                <td className="py-3 text-gray-600">
                  {displayDate.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}{" "}
                  {displayDate.toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="py-3">
                  <MentorshipStatusBadge status={request.status} />
                </td>
                <td className="py-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSelect(request)}
                  >
                    Review
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
