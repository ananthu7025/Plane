/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  fetchMyFeedback, clearError, clearSuccessMessage,
} from "@/store/slices/feedbackSlice";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/shared/StatCard";
import { MyFeedbackList } from "@/components/feedback/student/MyFeedbackList";
import { FeedbackCategoryGrid } from "@/components/feedback/student/FeedbackCategoryGrid";
import { FeedbackSubmitDialog } from "@/components/feedback/student/FeedbackSubmitDialog";
import { MessageSquare, CheckCircle2, Clock, Star, Plus, Loader2 } from "lucide-react";

export default function StudentFeedback() {
  const dispatch = useAppDispatch();
  const { myFeedback, studentStats, loadingMy, error, successMessage } =
    useAppSelector((s) => s.feedback);

  const [dialogOpen, setDialogOpen]         = useState(false);
  const [preselectedCat, setPreselectedCat] = useState<string | undefined>();

  useEffect(() => {
    dispatch(fetchMyFeedback() as any);
  }, [dispatch]);

  useEffect(() => {
    if (successMessage) { toast.success(successMessage); dispatch(clearSuccessMessage()); }
  }, [successMessage, dispatch]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearError()); }
  }, [error, dispatch]);

  const openDialog = (category?: string) => {
    setPreselectedCat(category);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setPreselectedCat(undefined);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Feedback</h1>
          <p className="text-gray-600 mt-1">Share your thoughts and help us improve</p>
        </div>
        <Button onClick={() => openDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          New Feedback
        </Button>
      </div>

      {/* Stats */}
      {studentStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Total Submitted" value={studentStats.total}
            icon={<MessageSquare className="w-5 h-5 text-primary" />} variant="primary" />
          <StatCard label="Reviewed" value={studentStats.reviewed}
            icon={<CheckCircle2 className="w-5 h-5 text-green-600" />} variant="success" />
          <StatCard label="Pending" value={studentStats.pending}
            icon={<Clock className="w-5 h-5 text-yellow-500" />} variant="warning" />
          <StatCard label="Avg Rating" value={studentStats.avgRating}
            icon={<Star className="w-5 h-5 text-yellow-500" />} />
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="submitted" className="space-y-4">
        <TabsList>
          <TabsTrigger value="submitted">My Feedback</TabsTrigger>
          <TabsTrigger value="categories">By Category</TabsTrigger>
        </TabsList>

        <TabsContent value="submitted">
          {loadingMy ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <MyFeedbackList feedback={myFeedback} />
          )}
        </TabsContent>

        <TabsContent value="categories">
          <FeedbackCategoryGrid onAddFeedback={openDialog} />
        </TabsContent>
      </Tabs>

      <FeedbackSubmitDialog
        isOpen={dialogOpen}
        preselectedCategory={preselectedCat}
        onClose={closeDialog}
      />
    </div>
  );
}
