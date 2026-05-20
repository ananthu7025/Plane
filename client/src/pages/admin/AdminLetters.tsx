/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, Trash2, Eye } from "lucide-react";
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

export default function AdminLetters() {
  const dispatch = useAppDispatch();

  // Redux state
  const {
    moderationLetters,
    moderationPage,
    moderationPagination,
    moderationStatus,
    stats,
    loadingModerationQueue,
    approvingLetter,
    rejectingLetter,
    deletingLetter,
    error,
    successMessage,
  } = useAppSelector((state) => state.letters);

  // Local UI state
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [viewLetterOpen, setViewLetterOpen] = useState<string | null>(null);

  // Toast notifications
  useEffect(() => {
    if (successMessage) {
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

  // Load moderation queue and stats
  useEffect(() => {
    dispatch(
      fetchModerationQueue({
        page: moderationPage,
        status: moderationStatus,
      }) as any
    );
    dispatch(fetchLetterStats() as any);
  }, [dispatch, moderationPage, moderationStatus]);

  const handleApprove = (letterId: string) => {
    dispatch(approveLetter(letterId) as any);
  };

  const handleReject = async (letterId: string, reason: string) => {
    dispatch(rejectLetter(letterId, reason) as any);
    setSelectedLetter(null);
  };

  const handleDelete = (letterId: string) => {
    if (confirm("Are you sure you want to delete this letter?")) {
      dispatch(deleteLetter(letterId) as any);
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
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-slate-900">{stats.total}</div>
                  <p className="text-sm text-slate-600 mt-1">Total Letters</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
                  <p className="text-sm text-slate-600 mt-1">Pending Review</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{stats.approved}</div>
                  <p className="text-sm text-slate-600 mt-1">Approved</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{stats.rejected}</div>
                  <p className="text-sm text-slate-600 mt-1">Rejected</p>
                </div>
              </CardContent>
            </Card>
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
                        By {letter.author?.fullName || "Anonymous"} •{" "}
                        {new Date(letter.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      letter.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-700"
                        : letter.status === "APPROVED"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                    }`}>
                      {letter.status}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-slate-700">{letter.content}</p>

                  <div className="bg-slate-50 p-3 rounded">
                    <p className="text-xs font-medium text-slate-600 mb-2">Author Details:</p>
                    <p className="text-sm text-slate-700">
                      {letter.author?.fullName || "Anonymous"} (ID: {letter.authorId})
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

                    {letter.status === "PENDING" && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          disabled={approvingLetter}
                          onClick={() => handleApprove(letter.id)}
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
                          onClick={() => setSelectedLetter(letter.id)}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 ml-auto"
                      disabled={deletingLetter}
                      onClick={() => handleDelete(letter.id)}
                    >
                      {deletingLetter ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {moderationLetters.length > 0 && (
          <div className="mt-8 flex justify-center gap-2">
            <Button
              variant="outline"
              disabled={moderationPage === 1}
              onClick={() => dispatch(setModerationPage(moderationPage - 1))}
            >
              Previous
            </Button>
            <span className="py-2 px-4 text-sm text-slate-600">
              Page {moderationPage} {moderationPagination && `of ${moderationPagination.totalPages}`}
            </span>
            <Button
              variant="outline"
              disabled={!moderationPagination?.hasMore}
              onClick={() => dispatch(setModerationPage(moderationPage + 1))}
            >
              Next
            </Button>
          </div>
        )}

        {/* View Letter Dialog */}
        {viewLetterOpen && (
          <Dialog open={!!viewLetterOpen} onOpenChange={() => setViewLetterOpen(null)}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              {moderationLetters.find((l) => l.id === viewLetterOpen) && (
                <div className="space-y-4">
                  <DialogHeader>
                    <DialogTitle>
                      {moderationLetters.find((l) => l.id === viewLetterOpen)?.subject}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="bg-amber-50/30 dark:bg-amber-950/10 rounded-lg p-6 border border-amber-200/30 dark:border-amber-800/20">
                    <div className="mb-4">
                      <p className="text-sm text-slate-600 mb-2">
                        <strong>From:</strong> {moderationLetters.find((l) => l.id === viewLetterOpen)?.author?.fullName || "Anonymous"}
                      </p>
                      <p className="text-sm text-slate-600">
                        <strong>Status:</strong>{" "}
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          moderationLetters.find((l) => l.id === viewLetterOpen)?.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-700"
                            : moderationLetters.find((l) => l.id === viewLetterOpen)?.status === "APPROVED"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                        }`}>
                          {moderationLetters.find((l) => l.id === viewLetterOpen)?.status}
                        </span>
                      </p>
                    </div>
                    <div
                      className="whitespace-pre-line leading-relaxed text-slate-700"
                      style={{ fontFamily: "'Courier New', Courier, monospace", lineHeight: "1.8" }}
                    >
                      {moderationLetters.find((l) => l.id === viewLetterOpen)?.content}
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}

        <AdminReasonDialog
          isOpen={!!selectedLetter}
          title="Reject Letter"
          label="Reason for Rejection"
          placeholder="Explain why this letter is being rejected..."
          confirmText="Reject"
          onClose={() => setSelectedLetter(null)}
          onSubmit={(reason) => {
            handleReject(selectedLetter || "", reason);
          }}
          isLoading={rejectingLetter}
        />
      </div>
    </div>
  );
}
