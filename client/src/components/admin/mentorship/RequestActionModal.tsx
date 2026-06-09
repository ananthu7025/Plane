import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MentorshipStatusBadge } from "@/components/mentorship/MentorshipStatusBadge";
import { TOPIC_LABELS } from "@/components/mentorship/constants";
import {
  ExternalLink,
  Video,
  Clock,
  Calendar,
  Trash2,
  AlertTriangle,
  User,
  BookOpen,
  XCircle,
} from "lucide-react";
import type { MentorshipRequest } from "@/types/mentorship";

type ActionMode = "idle" | "reject" | "reschedule" | "confirmDelete";

interface RequestActionModalProps {
  request: MentorshipRequest | null;
  onClose: () => void;
  onApprove: (id: string, scheduledDateTime?: string) => Promise<boolean>;
  onReject: (id: string, reason: string) => Promise<boolean>;
  onReschedule: (id: string, rescheduledDateTime: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  loading: boolean;
}

function Section({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gray-100">
        <Icon className="h-3.5 w-3.5 text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</p>
        {children}
      </div>
    </div>
  );
}

export function RequestActionModal({
  request,
  onClose,
  onApprove,
  onReject,
  onReschedule,
  onDelete,
  loading,
}: RequestActionModalProps) {
  const [mode, setMode] = useState<ActionMode>("idle");
  const [rejectionReason, setRejectionReason] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");

  const canApprove = request?.status === "PENDING" || request?.status === "RESCHEDULED";

  function resetForm() {
    setMode("idle");
    setRejectionReason("");
    setRescheduleDate("");
    setRescheduleTime("");
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleApprove() {
    if (!request) return;
    const success = await onApprove(request.id);
    if (success) handleClose();
  }

  async function handleReject() {
    if (!request || !rejectionReason.trim()) return;
    const success = await onReject(request.id, rejectionReason);
    if (success) handleClose();
  }

  async function handleReschedule() {
    if (!request || !rescheduleDate || !rescheduleTime) return;
    const rescheduledDateTime = new Date(`${rescheduleDate}T${rescheduleTime}`).toISOString();
    const success = await onReschedule(request.id, rescheduledDateTime);
    if (success) handleClose();
  }

  async function handleDelete() {
    if (!request) return;
    const success = await onDelete(request.id);
    if (success) handleClose();
  }

  if (!request) return null;

  const meetingDate = request.meetingStartDateTime
    ? new Date(request.meetingStartDateTime)
    : null;

  const preferredDate = new Date(request.preferredDateTime);

  return (
    <Dialog open={!!request} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden gap-0">

        {/* ── Header ── */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b bg-gray-50">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-gray-900">
                {request.studentName ?? "Unknown Student"}
              </h2>
              <MentorshipStatusBadge status={request.status} />
            </div>
            <p className="text-xs text-gray-500">{request.studentEmail}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors mt-0.5"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">

          {/* Topic */}
          <Section icon={BookOpen} label="Topic">
            <p className="text-sm font-medium text-gray-900">{TOPIC_LABELS[request.topic]}</p>
          </Section>

          {/* Preferred date */}
          <Section icon={Calendar} label="Preferred Date & Time">
            <p className="text-sm font-medium text-gray-900">
              {preferredDate.toLocaleDateString("en-GB", {
                weekday: "short", day: "2-digit", month: "short", year: "numeric",
              })}{" "}
              at{" "}
              {preferredDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </Section>
          {/* Reviewed by */}
          {request.reviewedBy && (
            <Section icon={User} label="Reviewed By">
              <p className="text-sm text-gray-700 font-mono text-xs">{request.reviewedBy}</p>
            </Section>
          )}

          {/* Rejection reason */}
          {request.status === "REJECTED" && request.rejectionReason && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-1">
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">Rejection Reason</p>
              <p className="text-sm text-red-800">{request.rejectionReason}</p>
            </div>
          )}

          {/* Rescheduled date */}
          {request.status === "RESCHEDULED" && request.rescheduledDateTime && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-1">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Rescheduled To</p>
              <p className="text-sm text-blue-900 font-medium">
                {new Date(request.rescheduledDateTime).toLocaleString("en-GB", {
                  weekday: "short", day: "2-digit", month: "short", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </p>
            </div>
          )}

          {/* Teams meeting card */}
          {request.status === "APPROVED" && (
            request.teamsJoinUrl ? (
              <div className="rounded-xl border border-[#464eb8]/20 bg-gradient-to-br from-[#464eb8]/5 to-[#6264a7]/10 p-4 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#464eb8]">
                    <Video className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Microsoft Teams</p>
                    <p className="text-xs text-gray-500">Online meeting ready</p>
                  </div>
                </div>

                {meetingDate && (
                  <div className="flex gap-4 text-xs text-gray-600 pl-0.5">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      {meetingDate.toLocaleDateString("en-GB", {
                        weekday: "short", day: "2-digit", month: "short", year: "numeric",
                      })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-gray-400" />
                      {meetingDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                )}

                <a
                  href={request.teamsJoinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="sm" className="bg-[#464eb8] hover:bg-[#3b42a0] text-white w-full gap-2">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Join Teams Meeting
                  </Button>
                </a>
              </div>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex gap-3">
                <Clock className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Meeting link pending</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    The Teams meeting will be created shortly
                  </p>
                </div>
              </div>
            )
          )}

          {/* Inline forms */}
          {mode === "reject" && (
            <div className="space-y-2">
              <Label className="text-xs">Rejection Reason</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this request is being rejected..."
                rows={3}
                className="resize-none text-sm"
              />
            </div>
          )}

          {mode === "reschedule" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">New Date</Label>
                <input
                  type="date"
                  value={rescheduleDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">New Time</Label>
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
              </div>
            </div>
          )}

          {mode === "confirmDelete" && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex gap-3">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-800">Delete this request?</p>
                <p className="text-xs text-red-700 mt-0.5">
                  This action is permanent and cannot be undone.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between gap-2 px-6 py-4 border-t bg-gray-50">
          {/* Delete — always visible in idle mode */}
          {mode === "idle" && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-700 hover:bg-red-50 gap-1.5"
              onClick={() => setMode("confirmDelete")}
              disabled={loading}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          )}

          <div className="flex gap-2 ml-auto">
            {mode === "idle" && canApprove && (
              <>
                <Button variant="outline" size="sm" onClick={() => setMode("reschedule")} disabled={loading}>
                  Reschedule
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setMode("reject")} disabled={loading}>
                  Reject
                </Button>
                <Button size="sm" onClick={handleApprove} disabled={loading}>
                  {loading ? "Approving..." : "Approve & Create Meeting"}
                </Button>
              </>
            )}

            {mode === "reject" && (
              <>
                <Button variant="outline" size="sm" onClick={() => setMode("idle")} disabled={loading}>
                  Back
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleReject}
                  disabled={loading || !rejectionReason.trim()}
                >
                  {loading ? "Rejecting..." : "Confirm Rejection"}
                </Button>
              </>
            )}

            {mode === "reschedule" && (
              <>
                <Button variant="outline" size="sm" onClick={() => setMode("idle")} disabled={loading}>
                  Back
                </Button>
                <Button
                  size="sm"
                  onClick={handleReschedule}
                  disabled={loading || !rescheduleDate || !rescheduleTime}
                >
                  {loading ? "Rescheduling..." : "Confirm Reschedule"}
                </Button>
              </>
            )}

            {mode === "confirmDelete" && (
              <>
                <Button variant="outline" size="sm" onClick={() => setMode("idle")} disabled={loading}>
                  Cancel
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
                  {loading ? "Deleting..." : "Delete Request"}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
