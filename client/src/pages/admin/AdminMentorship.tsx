import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMentorship } from "@/hooks/useMentorship";
import { MentorshipStatsBar } from "@/components/mentorship/MentorshipStatsBar";
import { MentorshipRequestsTable } from "@/components/admin/mentorship/MentorshipRequestsTable";
import { RequestActionModal } from "@/components/admin/mentorship/RequestActionModal";
import { SlotManagement } from "@/components/admin/mentorship/SlotManagement";
import { MentorshipSettings } from "@/components/admin/mentorship/MentorshipSettings";
import type { AdminMentorshipFilters } from "@/types/mentorship";

export default function AdminMentorship() {
  const {
    adminRequests,
    adminStats,
    adminPagination,
    selectedRequest,
    loading,
    actionLoading,
    loadAdminRequests,
    approve,
    reject,
    reschedule,
    deleteRequest,
    selectRequest,
  } = useMentorship();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch]             = useState("");
  const [page, setPage]                 = useState(1);

  useEffect(() => {
    const filters: AdminMentorshipFilters = {
      status: statusFilter !== "all" ? (statusFilter as AdminMentorshipFilters["status"]) : undefined,
      search: search || undefined,
      page,
    };
    loadAdminRequests(filters);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page]);

  function handleSearch() {
    setPage(1);
    loadAdminRequests({
      status: statusFilter !== "all" ? (statusFilter as AdminMentorshipFilters["status"]) : undefined,
      search: search || undefined,
      page: 1,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mentorship</h1>
        <p className="text-sm text-gray-500 mt-1">Manage sessions, time slots, and session fees</p>
      </div>

      <Tabs defaultValue="requests">
        <TabsList className="mb-4">
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="slots">Slot Management</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* ── Requests Tab ──────────────────────────────────────────────────── */}
        <TabsContent value="requests" className="space-y-4">
          {adminStats && <MentorshipStatsBar stats={adminStats} />}

          <div className="flex flex-wrap gap-3">
            <Input
              placeholder="Search by description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="max-w-xs"
            />
            <Select
              value={statusFilter}
              onValueChange={(v) => { setStatusFilter(v); setPage(1); }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="RESCHEDULED">Rescheduled</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleSearch}>Search</Button>
          </div>

          <div className="bg-white rounded-xl border p-5">
            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading...</div>
            ) : (
              <MentorshipRequestsTable requests={adminRequests} onSelect={selectRequest} />
            )}
          </div>

          {adminPagination && adminPagination.totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Showing {adminRequests.length} of {adminPagination.total} requests</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= adminPagination.totalPages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}

          <RequestActionModal
            request={selectedRequest}
            onClose={() => selectRequest(null)}
            onApprove={(id, scheduledDateTime) => approve(id, scheduledDateTime ? { scheduledDateTime } : {})}
            onReject={(id, reason) => reject(id, { reason })}
            onReschedule={(id, rescheduledDateTime) => reschedule(id, { rescheduledDateTime })}
            onDelete={(id) => deleteRequest(id)}
            loading={actionLoading}
          />
        </TabsContent>

        {/* ── Slots Tab ─────────────────────────────────────────────────────── */}
        <TabsContent value="slots">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-900">Weekly Slot Schedule</h2>
            <p className="text-sm text-gray-500">
              Configure recurring 1-hour slots. Students can book any active slot on its designated day.
            </p>
          </div>
          <SlotManagement />
        </TabsContent>

        {/* ── Settings Tab ──────────────────────────────────────────────────── */}
        <TabsContent value="settings">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-900">Session Configuration</h2>
            <p className="text-sm text-gray-500">
              Set the session fee students pay via Razorpay before booking.
            </p>
          </div>
          <MentorshipSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
