/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  fetchAdminFeedback,
  fetchFeedbackAnalytics,
  setSelectedFeedback,
  setAdminSearch,
  setAdminStatusFilter,
  clearError,
  clearSuccessMessage,
} from "@/store/slices/feedbackSlice";
import { usePermission } from "@/hooks/usePermission";
import { Permissions } from "@/lib/permissions";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/shared/StatCard";
import { FeedbackTable } from "@/components/feedback/admin/FeedbackTable";
import { FeedbackPendingList } from "@/components/feedback/admin/FeedbackPendingList";
import { FeedbackAnalytics } from "@/components/feedback/admin/FeedbackAnalytics";
import { FeedbackDetailDialog } from "@/components/feedback/admin/FeedbackDetailDialog";
import {
  MessageSquare, Star, CheckCircle2, Clock, Search, AlertCircle, Loader2,
} from "lucide-react";
import type { Feedback } from "@/types/feedback";

export default function AdminFeedback() {
  const dispatch = useAppDispatch();
  const canManage = usePermission(Permissions.MANAGE_FEEDBACK);
  const {
    allFeedback, adminStats, categoryStats,
    selectedFeedback, loadingAdmin, adminSearch, error, successMessage,
  } = useAppSelector((s) => s.feedback);

  const [searchInput, setSearchInput] = useState(adminSearch);

  useEffect(() => {
    if (!canManage) return;
    dispatch(fetchAdminFeedback() as any);
    dispatch(fetchFeedbackAnalytics() as any);
  }, [dispatch, canManage]);

  useEffect(() => {
    if (successMessage) { toast.success(successMessage); dispatch(clearSuccessMessage()); }
  }, [successMessage, dispatch]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearError()); }
  }, [error, dispatch]);

  const handleSearch = (value: string) => {
    setSearchInput(value);
    dispatch(setAdminSearch(value));
    dispatch(fetchAdminFeedback({ search: value }) as any);
  };

  const pendingFeedback = allFeedback.filter((f) => f.status === "pending");

  const filteredFeedback = allFeedback.filter((f) => {
    const q = searchInput.toLowerCase();
    return (
      !q ||
      (f.studentName ?? "").toLowerCase().includes(q) ||
      (f.subject ?? "").toLowerCase().includes(q) ||
      f.feedback.toLowerCase().includes(q)
    );
  });

  if (!canManage) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">You don't have permission to manage feedback.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Feedback Management</h1>
          <p className="text-gray-600 mt-1">Review and respond to student feedback</p>
        </div>
        {adminStats && adminStats.pending > 0 && (
          <Badge className="bg-yellow-100 text-yellow-800 text-sm px-4 py-2">
            <AlertCircle className="w-4 h-4 mr-2" />
            {adminStats.pending} Pending Reviews
          </Badge>
        )}
      </div>

      {/* Stats */}
      {adminStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Total Feedback" value={adminStats.total}
            icon={<MessageSquare className="w-5 h-5 text-primary" />} variant="primary" />
          <StatCard label="Avg Rating" value={adminStats.avgRating}
            icon={<Star className="w-5 h-5 text-yellow-500" />} variant="warning" />
          <StatCard label="Reviewed" value={adminStats.reviewed}
            icon={<CheckCircle2 className="w-5 h-5 text-green-600" />} variant="success" />
          <StatCard label="Pending" value={adminStats.pending}
            icon={<Clock className="w-5 h-5 text-red-500" />} variant="danger" />
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <TabsList>
            <TabsTrigger value="all">All Feedback</TabsTrigger>
            <TabsTrigger value="pending">
              Pending {pendingFeedback.length > 0 && `(${pendingFeedback.length})`}
            </TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search feedback..."
              value={searchInput}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <TabsContent value="all">
          <Card>
            <CardContent className="p-0">
              {loadingAdmin ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : (
                <FeedbackTable
                  feedback={filteredFeedback}
                  onView={(f) => dispatch(setSelectedFeedback(f))}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          {loadingAdmin ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <FeedbackPendingList
              feedback={pendingFeedback}
              onRespond={(f) => dispatch(setSelectedFeedback(f))}
            />
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <FeedbackAnalytics categoryStats={categoryStats} />
        </TabsContent>
      </Tabs>

      <FeedbackDetailDialog
        feedback={selectedFeedback}
        onClose={() => dispatch(setSelectedFeedback(null))}
      />
    </div>
  );
}
