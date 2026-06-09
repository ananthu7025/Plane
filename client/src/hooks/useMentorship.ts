import { useCallback } from "react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "./redux";
import {
  fetchMyMentorshipRequests,
  fetchSlotsForDate,
  createRazorpayOrder,
  verifyAndBookSession,
  fetchAdminMentorshipRequests,
  fetchSlotTemplates,
  createSlotTemplate,
  deleteSlotTemplate,
  toggleSlotTemplate,
  copySlotTemplates,
  fetchMentorshipSettings,
  updateMentorshipSettings,
  approveMentorshipRequest,
  rejectMentorshipRequest,
  rescheduleMentorshipRequest,
  deleteMentorshipRequest,
  setSelectedRequest,
  clearMentorshipError,
} from "@/store/slices/mentorshipSlice";
import type {
  MentorshipRequest,
  ApproveMentorshipInput,
  RejectMentorshipInput,
  RescheduleMentorshipInput,
  AdminMentorshipFilters,
  VerifyPaymentInput,
} from "@/types/mentorship";

export function useMentorship() {
  const dispatch = useAppDispatch();
  const state    = useAppSelector((s) => s.mentorship);

  // Student
  const loadMyRequests = useCallback(() => {
    dispatch(fetchMyMentorshipRequests());
  }, [dispatch]);

  const loadSlots = useCallback((date: string) => {
    dispatch(fetchSlotsForDate(date));
  }, [dispatch]);

  const getOrder = useCallback(async () => {
    return dispatch(createRazorpayOrder());
  }, [dispatch]);

  const bookSession = useCallback(async (input: VerifyPaymentInput): Promise<boolean> => {
    const result = await dispatch(verifyAndBookSession(input));
    if (result) {
      toast.success("Session booked! Awaiting admin approval.");
      return true;
    }
    toast.error(state.error ?? "Booking failed. Please try again.");
    return false;
  }, [dispatch, state.error]);

  // Admin — requests
  const loadAdminRequests = useCallback((filters: AdminMentorshipFilters = {}) => {
    dispatch(fetchAdminMentorshipRequests(filters));
  }, [dispatch]);

  const approve = useCallback(async (id: string, input: ApproveMentorshipInput = {}): Promise<boolean> => {
    const result = await dispatch(approveMentorshipRequest({ id, input }));
    if (result) {
      toast.success(result.teamsJoinUrl ? "Approved — Teams meeting created" : "Approved — meeting link coming shortly");
      return true;
    }
    toast.error(state.error ?? "Failed to approve");
    return false;
  }, [dispatch, state.error]);

  const reject = useCallback(async (id: string, input: RejectMentorshipInput): Promise<boolean> => {
    const result = await dispatch(rejectMentorshipRequest({ id, input }));
    if (result) { toast.success("Request rejected"); return true; }
    toast.error(state.error ?? "Failed to reject");
    return false;
  }, [dispatch, state.error]);

  const reschedule = useCallback(async (id: string, input: RescheduleMentorshipInput): Promise<boolean> => {
    const result = await dispatch(rescheduleMentorshipRequest({ id, input }));
    if (result) { toast.success("Request rescheduled"); return true; }
    toast.error(state.error ?? "Failed to reschedule");
    return false;
  }, [dispatch, state.error]);

  const deleteRequest = useCallback(async (id: string): Promise<boolean> => {
    const ok = await dispatch(deleteMentorshipRequest(id));
    if (ok) { toast.success("Request deleted"); return true; }
    toast.error(state.error ?? "Failed to delete");
    return false;
  }, [dispatch, state.error]);

  const selectRequest = useCallback((request: MentorshipRequest | null) => {
    dispatch(setSelectedRequest(request));
  }, [dispatch]);

  // Admin — slots
  const loadSlotTemplates = useCallback(() => {
    dispatch(fetchSlotTemplates());
  }, [dispatch]);

  const addSlot = useCallback(async (dayOfWeek: number, startTime: string): Promise<boolean> => {
    const ok = await dispatch(createSlotTemplate(dayOfWeek, startTime));
    if (ok) { toast.success("Slot added"); return true; }
    toast.error("Failed to add slot — it may already exist");
    return false;
  }, [dispatch]);

  const removeSlot = useCallback(async (id: string): Promise<boolean> => {
    const ok = await dispatch(deleteSlotTemplate(id));
    if (ok) { toast.success("Slot removed"); return true; }
    toast.error("Failed to remove slot");
    return false;
  }, [dispatch]);

  const toggleSlot = useCallback(async (id: string): Promise<boolean> => {
    return dispatch(toggleSlotTemplate(id));
  }, [dispatch]);

  const copySlots = useCallback(async (fromDay: number, toDays: number[]): Promise<boolean> => {
    const ok = await dispatch(copySlotTemplates(fromDay, toDays));
    if (ok) { toast.success(`Slots copied to ${toDays.length} day(s)`); return true; }
    toast.error("Failed to copy slots");
    return false;
  }, [dispatch]);

  // Admin — settings
  const loadSettings = useCallback(() => {
    dispatch(fetchMentorshipSettings());
  }, [dispatch]);

  const saveSettings = useCallback(async (sessionFeePaise: number): Promise<boolean> => {
    const ok = await dispatch(updateMentorshipSettings(sessionFeePaise));
    if (ok) { toast.success("Session fee updated"); return true; }
    toast.error("Failed to update fee");
    return false;
  }, [dispatch]);

  const clearError = useCallback(() => {
    dispatch(clearMentorshipError());
  }, [dispatch]);

  return {
    // State
    myRequests:      state.myRequests,
    myStats:         state.myStats,
    availableSlots:  state.availableSlots,
    slotsDate:       state.slotsDate,
    settings:        state.settings,
    adminRequests:   state.adminRequests,
    adminStats:      state.adminStats,
    adminPagination: state.adminPagination,
    selectedRequest: state.selectedRequest,
    slotTemplates:   state.slotTemplates,
    slotsLoading:    state.slotsLoading,
    loading:         state.loading,
    submitting:      state.submitting,
    actionLoading:   state.actionLoading,
    error:           state.error,
    // Student actions
    loadMyRequests,
    loadSlots,
    getOrder,
    bookSession,
    // Admin — requests
    loadAdminRequests,
    approve,
    reject,
    reschedule,
    deleteRequest,
    selectRequest,
    // Admin — slots
    loadSlotTemplates,
    addSlot,
    removeSlot,
    toggleSlot,
    copySlots,
    // Admin — settings
    loadSettings,
    saveSettings,
    clearError,
  };
}
