/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, Trash2, Eye } from "lucide-react";
import { usePermission } from "@/hooks/usePermission";
import { Permissions } from "@/lib/permissions";
import PermissionGate from "@/components/common/PermissionGate";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  fetchModerationQueue,
  fetchLetterStats,
  approveLetter,
  rejectLetter,
  deleteLetter,
  clearError,
  clearSuccessMessage,
  setModerationStatus,
  setModerationPage,
} from "@/store/slices/letterSlice";
import { AdminReasonDialog } from "@/components/community";
import { DeleteConfirmDialog, StatCard, PaginationControls } from "@/components/shared";
import { FileCheck, Clock, CheckCircle2, XCircle as XCircleIcon } from "lucide-react";

export default function AdminLetters() {
  const dispatch = useAppDispatch();

  // Redux state
  const {
    moderationLetters = [],
    moderationPage = 1,
    moderationPagination,
    moderationStatus = "PENDING",
    stats,
    loadingModerationQueue = false,
    approvingLetter = false,
    rejectingLetter = false,
    deletingLetter = false,
    error,
    successMessage,
  } = useAppSelector((state) => state.letters) || {};

  const canApprove = usePermission(Permissions.MODERATE_LETTERS);

  // Local UI state
  const [viewLetterOpen, setViewLetterOpen] = useState<string | null>(null);
  const [approveConfirmOpen, setApproveConfirmOpen] = useState<string | null>(null);
  const [rejectReasonDialogOpen, setRejectReasonDialogOpen] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    open: boolean;
    letterId: string | null;
  }>({
    open: false,
    letterId: null,
  });

  // Prevent duplicate API calls and toasts in Strict Mode
  const shownMessagesRef = useRef<Set<string>>(new Set());
  const lastFetchRef = useRef<{ page: number; status: string } | null>(null);

  // Toast notifications
  useEffect(() => {
    if (successMessage && !shownMessagesRef.current.has(successMessage)) {
      shownMessagesRef.current.add(successMessage);
      toast.success(successMessage);
      dispatch(clearSuccessMessage());
    }
  }, [successMessage, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Load moderation queue and stats (prevent duplicate calls in Strict Mode)
  useEffect(() => {
    const currentFetch = { page: moderationPage, status: moderationStatus };
    const lastFetch = lastFetchRef.current;

    // Only fetch if parameters have changed or this is the first fetch
    if (
      !lastFetch ||
      lastFetch.page !== currentFetch.page ||
      lastFetch.status !== currentFetch.status
    ) {
      lastFetchRef.current = currentFetch;
      dispatch(
        fetchModerationQueue({
          page: moderationPage,
          status: moderationStatus,
        }) as any
      );
      dispatch(fetchLetterStats() as any);
    }
  }, [dispatch, moderationPage, moderationStatus]);

  const handleApproveClick = (letterId: string) => {
    setApproveConfirmOpen(letterId);
  };

  const handleApproveConfirm = async (letterId: string) => {
    await dispatch(approveLetter(letterId) as any);
    setApproveConfirmOpen(null);
    dispatch(fetchModerationQueue({ page: moderationPage, status: moderationStatus }) as any);
    dispatch(fetchLetterStats() as any);
  };

  const handleRejectClick = (letterId: string) => {
    setRejectReasonDialogOpen(letterId);
  };

  const handleRejectConfirm = async (reason: string) => {
    if (rejectReasonDialogOpen) {
      await dispatch(rejectLetter(rejectReasonDialogOpen, reason) as any);
      setRejectReasonDialogOpen(null);
      dispatch(fetchModerationQueue({ page: moderationPage, status: moderationStatus }) as any);
      dispatch(fetchLetterStats() as any);
    }
  };

  const handleDeleteClick = (letterId: string) => {
    setDeleteConfirmation({ open: true, letterId });
  };

  const getLetterStatusClass = (status: string) => {
    switch (status) {
      case "PENDING":  return "bg-yellow-100 text-yellow-700";
      case "APPROVED": return "bg-green-100 text-green-700";
      case "REJECTED": return "bg-red-100 text-red-700";
      default:         return "bg-gray-100 text-gray-700";
    }
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmation.letterId) {
      dispatch(deleteLetter(deleteConfirmation.letterId) as any);
      setDeleteConfirmation({ open: false, letterId: null });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Letters Moderation</h1>
          <p className="text-slate-600">Review and manage student letters</p>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Letters"  value={stats.total}    icon={<FileCheck className="w-5 h-5 text-primary" />}         variant="primary" />
            <StatCard label="Pending Review" value={stats.pending}  icon={<Clock className="w-5 h-5 text-yellow-500" />}           variant="warning" />
            <StatCard label="Approved"       value={stats.approved} icon={<CheckCircle2 className="w-5 h-5 text-green-600" />}     variant="success" />
            <StatCard label="Rejected"       value={stats.rejected} icon={<XCircleIcon className="w-5 h-5 text-red-500" />}        variant="danger" />
          </div>
        )}

        {/* Filter */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <span className="text-sm font-medium text-slate-600 py-2">Filter by status:</span>
              {(["PENDING", "APPROVED", "REJECTED"] as const).map((status) => (
                <Button
                  key={status}
                  variant={moderationStatus === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => dispatch(setModerationStatus(status))}
                  className="capitalize"
                >
                  {status}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Letters Queue */}
        <div className="space-y-4">
          {loadingModerationQueue && moderationLetters.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            </div>
          ) : moderationLetters.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-slate-600">No letters to review</p>
              </CardContent>
            </Card>
          ) : (
            moderationLetters.map((letter) => (
              <Card key={letter.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{letter.subject}</CardTitle>
                      <p className="text-sm text-slate-600">
                        By {letter.author?.fullName || "Unknown"} {letter.isAnonymous ? "(Anonymous)" : ""} •{" "}
                        {new Date(letter.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getLetterStatusClass(letter.status)}`}>
                      {letter.status}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-slate-700">{letter.content}</p>

                  <div className="bg-slate-50 p-3 rounded">
                    <p className="text-xs font-medium text-slate-600 mb-2">Author Details:</p>
                    <p className="text-sm text-slate-700">
                      {letter.author?.fullName || "Unknown"} (ID: {letter.authorId})
                      {letter.isAnonymous && (
                        <span className="ml-2 px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded">
                          Marked Anonymous by User
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-600"
                      onClick={() => setViewLetterOpen(letter.id)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>

                    {letter.status === "PENDING" && canApprove && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          disabled={approvingLetter}
                          onClick={() => handleApproveClick(letter.id)}
                        >
                          {approvingLetter ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Approve
                            </>
                          )}
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectClick(letter.id)}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}

                    <PermissionGate permission={Permissions.DELETE_LETTER}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 ml-auto"
                        disabled={deletingLetter}
                        onClick={() => handleDeleteClick(letter.id)}
                      >
                        {deletingLetter ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </PermissionGate>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {moderationLetters.length > 0 && moderationPagination && moderationPagination.totalPages > 1 && (
          <div className="mt-8">
            <PaginationControls
              currentPage={moderationPage}
              totalPages={moderationPagination.totalPages}
              onPageChange={(page) => dispatch(setModerationPage(page))}
            />
          </div>
        )}

        {/* View Letter Dialog */}
        {viewLetterOpen && (() => {
          const viewingLetter = moderationLetters.find((l) => l.id === viewLetterOpen);
          if (!viewingLetter) return null;
          return (
            <Dialog open={!!viewLetterOpen} onOpenChange={() => setViewLetterOpen(null)}>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <div className="space-y-4">
                  <DialogHeader>
                    <DialogTitle>{viewingLetter.subject}</DialogTitle>
                  </DialogHeader>
                  <div className="bg-amber-50/30 dark:bg-amber-950/10 rounded-lg p-6 border border-amber-200/30 dark:border-amber-800/20">
                    <div className="mb-4">
                      <p className="text-sm text-slate-600 mb-2">
                        <strong>From:</strong>{" "}
                        {viewingLetter.author?.fullName || "Unknown"}
                        {viewingLetter.isAnonymous ? " (Anonymous)" : ""}
                      </p>
                      <p className="text-sm text-slate-600">
                        <strong>Status:</strong>{" "}
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getLetterStatusClass(viewingLetter.status)}`}>
                          {viewingLetter.status}
                        </span>
                      </p>
                    </div>
                    <div className="whitespace-pre-line leading-relaxed text-slate-700 font-mono">
                      {viewingLetter.content}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          );
        })()}

        {/* Approve Confirmation Dialog */}
        <Dialog open={!!approveConfirmOpen} onOpenChange={() => setApproveConfirmOpen(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Letter?</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-slate-700">
                Are you sure you want to approve this letter? It will be published immediately.
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setApproveConfirmOpen(null)} disabled={approvingLetter}>
                Cancel
              </Button>
              <Button
                onClick={() => handleApproveConfirm(approveConfirmOpen || "")}
                disabled={approvingLetter}
                className="bg-green-600 hover:bg-green-700"
              >
                {approvingLetter ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Approve
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Reject Confirmation Dialog */}
        <AdminReasonDialog
          isOpen={!!rejectReasonDialogOpen}
          title="Reject Letter"
          label="Reason for Rejection"
          placeholder="Explain why this letter is being rejected..."
          confirmText="Reject"
          onClose={() => setRejectReasonDialogOpen(null)}
          onSubmit={(reason) => {
            handleRejectConfirm(reason);
          }}
          isLoading={rejectingLetter}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmDialog
          isOpen={deleteConfirmation.open}
          title="Delete Letter"
          itemName="this letter"
          isDeleting={deletingLetter}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteConfirmation({ open: false, letterId: null })}
        />
      </div>
    </div>
  );
}
