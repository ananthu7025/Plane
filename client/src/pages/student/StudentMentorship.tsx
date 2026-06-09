import { useEffect, useState } from "react";
import { Plus, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMentorship } from "@/hooks/useMentorship";
import { MentorshipStatsBar } from "@/components/mentorship/MentorshipStatsBar";
import { MeetingCard } from "@/components/mentorship/MeetingCard";
import { ScheduleMeetingForm } from "@/components/mentorship/ScheduleMeetingForm";

export default function StudentMentorship() {
  const { myRequests, myStats, loading, loadMyRequests } = useMentorship();

  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadMyRequests();
  }, [loadMyRequests]);

  const upcomingRequests = myRequests.filter(
    (r) => r.status === "APPROVED" || r.status === "RESCHEDULED"
  );

  const otherRequests = myRequests.filter(
    (r) => r.status !== "APPROVED" && r.status !== "RESCHEDULED"
  );

  function handleBookingSuccess() {
    setShowForm(false);
    loadMyRequests();
  }

  if (loading && myRequests.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mentorship</h1>
          <p className="text-sm text-gray-500 mt-1">
            Book one-on-one sessions with your mentor
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Book a Session
          </Button>
        )}
      </div>

      {myStats && <MentorshipStatsBar stats={myStats} />}

      {showForm && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Book a Session</h2>
          <ScheduleMeetingForm
            onSuccess={handleBookingSuccess}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {upcomingRequests.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-green-600" />
            Upcoming Sessions
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {upcomingRequests.map((r) => (
              <MeetingCard key={r.id} request={r} />
            ))}
          </div>
        </section>
      )}

      {myRequests.length === 0 ? (
        <div className="bg-white rounded-xl border p-10 text-center text-gray-500">
          You have not booked any mentorship sessions yet.
        </div>
      ) : otherRequests.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Session History</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {otherRequests.map((r) => (
              <MeetingCard key={r.id} request={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
