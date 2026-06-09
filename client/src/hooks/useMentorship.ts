import { useCallback } from "react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "./redux";
import {
  fetchMyMentorshipRequests,
  submitMentorshipRequest,
  fetchAdminMentorshipRequests,
  approveMentorshipRequest,
  rejectMentorshipRequest,
  rescheduleMentorshipRequest,
  deleteMentorshipRequest,
  setSelectedRequest,
  clearMentorshipError,
} from "@/store/slices/mentorshipSlice";
import type {
  MentorshipRequest,
  SubmitMentorshipInput,
  ApproveMentorshipInput,
  RejectMentorshipInput,
  RescheduleMentorshipInput,
  AdminMentorshipFilters,
} from "@/types/mentorship";

export function useMentorship() {
  const dispatch = useAppDispatch();
  const state    = useAppSelector((s) => s.mentorship);

  const loadMyRequests = useCallback(() => {
    dispatch(fetchMyMentorshipRequests());
  }, [dispatch]);

  const submitRequest = useCallback(
    async (input: SubmitMentorshipInput): Promise<boolean> => {
      const result = await dispatch(submitMentorshipRequest(input));
      if (result) {
        toast.success("Mentorship request submitted successfully");
        return true;
      }
      toast.error(state.error ?? "Failed to submit request");
      return false;
    },
    [dispatch, state.error]
  );

  const loadAdminRequests = useCallback(
    (filters: AdminMentorshipFilters = {}) => {
      dispatch(fetchAdminMentorshipRequests(filters));
    },
    [dispatch]
  );

  const approve = useCallback(
    async (id: string, input: ApproveMentorshipInput = {}): Promise<boolean> => {
      const result = await dispatch(approveMentorshipRequest({ id, input }));
      if (result) {
        const hasMeeting = !!(result as any)?.teamsJoinUrl;
        toast.success(hasMeeting ? "Request approved — Teams meeting created" : "Request approved — meeting link will appear shortly");
        return true;
      }
      toast.error(state.error ?? "Failed to approve request");
      return false;
    },
    [dispatch, state.error]
  );

  const reject = useCallback(
    async (id: string, input: RejectMentorshipInput): Promise<boolean> => {
      const result = await dispatch(rejectMentorshipRequest({ id, input }));
      if (result) {
        toast.success("Request rejected");
        return true;
      }
      toast.error(state.error ?? "Failed to reject request");
      return false;
    },
    [dispatch, state.error]
  );

  const reschedule = useCallback(
    async (id: string, input: RescheduleMentorshipInput): Promise<boolean> => {
      const result = await dispatch(rescheduleMentorshipRequest({ id, input }));
      if (result) {
        toast.success("Request rescheduled");
        return true;
      }
      toast.error(state.error ?? "Failed to reschedule request");
      return false;
    },
    [dispatch, state.error]
  );

  const deleteRequest = useCallback(
    async (id: string): Promise<boolean> => {
      const result = await dispatch(deleteMentorshipRequest(id));
      if (result) {
        toast.success("Request deleted");
        return true;
      }
      toast.error(state.error ?? "Failed to delete request");
      return false;
    },
    [dispatch, state.error]
  );

  const selectRequest = useCallback(
    (request: MentorshipRequest | null) => {
      dispatch(setSelectedRequest(request));
    },
    [dispatch]
  );

  const clearError = useCallback(() => {
    dispatch(clearMentorshipError());
  }, [dispatch]);

  return {
    myRequests:      state.myRequests,
    myStats:         state.myStats,
    adminRequests:   state.adminRequests,
    adminStats:      state.adminStats,
    adminPagination: state.adminPagination,
    selectedRequest: state.selectedRequest,
    loading:         state.loading,
    submitting:      state.submitting,
    actionLoading:   state.actionLoading,
    error:           state.error,
    loadMyRequests,
    submitRequest,
    loadAdminRequests,
    approve,
    reject,
    reschedule,
    deleteRequest,
    selectRequest,
    clearError,
  };
}
