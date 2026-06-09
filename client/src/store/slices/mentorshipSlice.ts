/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice } from "@reduxjs/toolkit";
import type { Dispatch, PayloadAction } from "@reduxjs/toolkit";
import { axiosInstance } from "@/api/client";
import { MENTORSHIP_ENDPOINTS } from "@/lib/constants";
import type {
  MentorshipRequest,
  MentorshipStats,
  ApproveMentorshipInput,
  RejectMentorshipInput,
  RescheduleMentorshipInput,
  AdminMentorshipFilters,
  SlotTemplate,
  AvailableSlot,
  MentorshipSettings,
  SlotsForDateResponse,
  CreateOrderResult,
  VerifyPaymentInput,
} from "@/types/mentorship";

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface MentorshipState {
  // Student view
  myRequests: MentorshipRequest[];
  myStats: MentorshipStats | null;
  // Slot availability
  availableSlots: AvailableSlot[];
  slotsDate: string | null;
  settings: MentorshipSettings | null;
  // Admin view
  adminRequests: MentorshipRequest[];
  adminStats: MentorshipStats | null;
  adminPagination: Pagination | null;
  selectedRequest: MentorshipRequest | null;
  // Admin slot templates
  slotTemplates: SlotTemplate[];
  slotsLoading: boolean;
  // Shared
  loading: boolean;
  submitting: boolean;
  actionLoading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: MentorshipState = {
  myRequests: [],
  myStats: null,
  availableSlots: [],
  slotsDate: null,
  settings: null,
  adminRequests: [],
  adminStats: null,
  adminPagination: null,
  selectedRequest: null,
  slotTemplates: [],
  slotsLoading: false,
  loading: false,
  submitting: false,
  actionLoading: false,
  error: null,
  successMessage: null,
};

const mentorshipSlice = createSlice({
  name: "mentorship",
  initialState,
  reducers: {
    setSelectedRequest(state, action: PayloadAction<MentorshipRequest | null>) {
      state.selectedRequest = action.payload;
    },
    clearMentorshipError(state) { state.error = null; },
    clearSuccessMessage(state) { state.successMessage = null; },

    // My requests
    fetchMyStart(state) { state.loading = true; state.error = null; },
    fetchMySuccess(state, action: PayloadAction<{ requests: MentorshipRequest[]; stats: MentorshipStats }>) {
      state.loading = false;
      state.myRequests = action.payload.requests;
      state.myStats = action.payload.stats;
    },
    fetchMyError(state, action: PayloadAction<string>) { state.loading = false; state.error = action.payload; },

    // Slots for a date
    fetchSlotsStart(state) { state.slotsLoading = true; state.error = null; },
    fetchSlotsSuccess(state, action: PayloadAction<SlotsForDateResponse & { date: string }>) {
      state.slotsLoading = false;
      state.availableSlots = action.payload.slots;
      state.slotsDate = action.payload.date;
      state.settings = {
        sessionFeePaise: action.payload.sessionFeePaise,
        sessionFeeFormatted: action.payload.sessionFeeFormatted,
      };
    },
    fetchSlotsError(state, action: PayloadAction<string>) { state.slotsLoading = false; state.error = action.payload; },

    // Submit (after payment verify)
    submitStart(state) { state.submitting = true; state.error = null; },
    submitSuccess(state, action: PayloadAction<MentorshipRequest>) {
      state.submitting = false;
      state.myRequests.unshift(action.payload);
      if (state.myStats) { state.myStats.total += 1; state.myStats.pending += 1; }
      state.successMessage = "Session booked successfully!";
    },
    submitError(state, action: PayloadAction<string>) { state.submitting = false; state.error = action.payload; },

    // Admin requests
    fetchAdminStart(state) { state.loading = true; state.error = null; },
    fetchAdminSuccess(state, action: PayloadAction<{ requests: MentorshipRequest[]; stats: MentorshipStats; pagination: Pagination }>) {
      state.loading = false;
      state.adminRequests = action.payload.requests;
      state.adminStats = action.payload.stats;
      state.adminPagination = action.payload.pagination;
    },
    fetchAdminError(state, action: PayloadAction<string>) { state.loading = false; state.error = action.payload; },

    // Admin slot templates
    fetchTemplatesSuccess(state, action: PayloadAction<SlotTemplate[]>) {
      state.slotTemplates = action.payload;
    },
    addTemplate(state, action: PayloadAction<SlotTemplate>) {
      state.slotTemplates.push(action.payload);
    },
    removeTemplate(state, action: PayloadAction<string>) {
      state.slotTemplates = state.slotTemplates.filter((t) => t.id !== action.payload);
    },
    updateTemplate(state, action: PayloadAction<SlotTemplate>) {
      const idx = state.slotTemplates.findIndex((t) => t.id === action.payload.id);
      if (idx !== -1) state.slotTemplates[idx] = action.payload;
    },

    // Admin settings
    fetchSettingsSuccess(state, action: PayloadAction<MentorshipSettings>) {
      state.settings = action.payload;
    },

    // Admin actions (approve/reject/reschedule)
    actionStart(state) { state.actionLoading = true; state.error = null; },
    actionSuccess(state, action: PayloadAction<MentorshipRequest>) {
      state.actionLoading = false;
      const idx = state.adminRequests.findIndex((r) => r.id === action.payload.id);
      if (idx !== -1) state.adminRequests[idx] = action.payload;
      if (state.selectedRequest?.id === action.payload.id) state.selectedRequest = action.payload;
    },
    actionError(state, action: PayloadAction<string>) { state.actionLoading = false; state.error = action.payload; },

    // Delete
    deleteStart(state) { state.actionLoading = true; state.error = null; },
    deleteSuccess(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.adminRequests = state.adminRequests.filter((r) => r.id !== action.payload);
      if (state.selectedRequest?.id === action.payload) state.selectedRequest = null;
    },
    deleteError(state, action: PayloadAction<string>) { state.actionLoading = false; state.error = action.payload; },
  },
});

export const {
  setSelectedRequest, clearMentorshipError, clearSuccessMessage,
  fetchMyStart, fetchMySuccess, fetchMyError,
  fetchSlotsStart, fetchSlotsSuccess, fetchSlotsError,
  submitStart, submitSuccess, submitError,
  fetchAdminStart, fetchAdminSuccess, fetchAdminError,
  fetchTemplatesSuccess, addTemplate, removeTemplate, updateTemplate,
  fetchSettingsSuccess,
  actionStart, actionSuccess, actionError,
  deleteStart, deleteSuccess, deleteError,
} = mentorshipSlice.actions;

export default mentorshipSlice.reducer;

// ── Thunks ────────────────────────────────────────────────────────────────────

export function fetchMyMentorshipRequests() {
  return async (dispatch: Dispatch) => {
    dispatch(fetchMyStart());
    try {
      const res = await axiosInstance.get(MENTORSHIP_ENDPOINTS.GET_MY);
      dispatch(fetchMySuccess(res.data.data));
    } catch (err: any) {
      dispatch(fetchMyError(err.response?.data?.error?.message || "Failed to fetch requests"));
    }
  };
}

export function fetchSlotsForDate(date: string) {
  return async (dispatch: Dispatch) => {
    dispatch(fetchSlotsStart());
    try {
      const res = await axiosInstance.get(MENTORSHIP_ENDPOINTS.GET_SLOTS, { params: { date } });
      dispatch(fetchSlotsSuccess({ ...res.data.data, date }));
    } catch (err: any) {
      dispatch(fetchSlotsError(err.response?.data?.error?.message || "Failed to fetch slots"));
    }
  };
}

export function createRazorpayOrder() {
  return async (): Promise<CreateOrderResult | null> => {
    try {
      const res = await axiosInstance.post(MENTORSHIP_ENDPOINTS.CREATE_ORDER);
      return res.data.data as CreateOrderResult;
    } catch {
      return null;
    }
  };
}

export function verifyAndBookSession(input: VerifyPaymentInput) {
  return async (dispatch: Dispatch): Promise<MentorshipRequest | null> => {
    dispatch(submitStart());
    try {
      const res = await axiosInstance.post(MENTORSHIP_ENDPOINTS.VERIFY_PAYMENT, input);
      const request = res.data.data.request as MentorshipRequest;
      dispatch(submitSuccess(request));
      return request;
    } catch (err: any) {
      dispatch(submitError(err.response?.data?.error?.message || "Failed to confirm booking"));
      return null;
    }
  };
}

export function fetchAdminMentorshipRequests(filters: AdminMentorshipFilters = {}) {
  return async (dispatch: Dispatch) => {
    dispatch(fetchAdminStart());
    try {
      const res = await axiosInstance.get(MENTORSHIP_ENDPOINTS.GET_ALL, { params: filters });
      dispatch(fetchAdminSuccess(res.data.data));
    } catch (err: any) {
      dispatch(fetchAdminError(err.response?.data?.error?.message || "Failed to fetch requests"));
    }
  };
}

export function fetchSlotTemplates() {
  return async (dispatch: Dispatch) => {
    try {
      const res = await axiosInstance.get(MENTORSHIP_ENDPOINTS.ADMIN_SLOTS);
      dispatch(fetchTemplatesSuccess(res.data.data.templates));
    } catch { /* silent */ }
  };
}

export function createSlotTemplate(dayOfWeek: number, startTime: string) {
  return async (dispatch: Dispatch): Promise<boolean> => {
    try {
      const res = await axiosInstance.post(MENTORSHIP_ENDPOINTS.ADMIN_SLOTS, { dayOfWeek, startTime });
      dispatch(addTemplate(res.data.data.template));
      return true;
    } catch {
      return false;
    }
  };
}

export function deleteSlotTemplate(id: string) {
  return async (dispatch: Dispatch): Promise<boolean> => {
    try {
      await axiosInstance.delete(MENTORSHIP_ENDPOINTS.ADMIN_SLOT_DELETE(id));
      dispatch(removeTemplate(id));
      return true;
    } catch {
      return false;
    }
  };
}

export function toggleSlotTemplate(id: string) {
  return async (dispatch: Dispatch): Promise<boolean> => {
    try {
      const res = await axiosInstance.patch(MENTORSHIP_ENDPOINTS.ADMIN_SLOT_TOGGLE(id));
      dispatch(updateTemplate(res.data.data.template));
      return true;
    } catch {
      return false;
    }
  };
}

export function copySlotTemplates(fromDay: number, toDays: number[]) {
  return async (dispatch: Dispatch): Promise<boolean> => {
    try {
      await axiosInstance.post(MENTORSHIP_ENDPOINTS.ADMIN_SLOTS_COPY, { fromDay, toDays });
      const res = await axiosInstance.get(MENTORSHIP_ENDPOINTS.ADMIN_SLOTS);
      dispatch(fetchTemplatesSuccess(res.data.data.templates));
      return true;
    } catch {
      return false;
    }
  };
}

export function fetchMentorshipSettings() {
  return async (dispatch: Dispatch) => {
    try {
      const res = await axiosInstance.get(MENTORSHIP_ENDPOINTS.GET_SETTINGS);
      dispatch(fetchSettingsSuccess(res.data.data));
    } catch { /* silent */ }
  };
}

export function updateMentorshipSettings(sessionFeePaise: number) {
  return async (dispatch: Dispatch): Promise<boolean> => {
    try {
      const res = await axiosInstance.patch(MENTORSHIP_ENDPOINTS.ADMIN_SETTINGS, { sessionFeePaise });
      dispatch(fetchSettingsSuccess(res.data.data));
      return true;
    } catch {
      return false;
    }
  };
}

export function approveMentorshipRequest({ id, input }: { id: string; input: ApproveMentorshipInput }) {
  return async (dispatch: Dispatch): Promise<MentorshipRequest | null> => {
    dispatch(actionStart());
    try {
      const res = await axiosInstance.patch(MENTORSHIP_ENDPOINTS.APPROVE(id), input);
      const request = res.data.data.request as MentorshipRequest;
      dispatch(actionSuccess(request));
      return request;
    } catch (err: any) {
      dispatch(actionError(err.response?.data?.error?.message || "Failed to approve request"));
      return null;
    }
  };
}

export function rejectMentorshipRequest({ id, input }: { id: string; input: RejectMentorshipInput }) {
  return async (dispatch: Dispatch): Promise<MentorshipRequest | null> => {
    dispatch(actionStart());
    try {
      const res = await axiosInstance.patch(MENTORSHIP_ENDPOINTS.REJECT(id), input);
      const request = res.data.data.request as MentorshipRequest;
      dispatch(actionSuccess(request));
      return request;
    } catch (err: any) {
      dispatch(actionError(err.response?.data?.error?.message || "Failed to reject request"));
      return null;
    }
  };
}

export function rescheduleMentorshipRequest({ id, input }: { id: string; input: RescheduleMentorshipInput }) {
  return async (dispatch: Dispatch): Promise<MentorshipRequest | null> => {
    dispatch(actionStart());
    try {
      const res = await axiosInstance.patch(MENTORSHIP_ENDPOINTS.RESCHEDULE(id), input);
      const request = res.data.data.request as MentorshipRequest;
      dispatch(actionSuccess(request));
      return request;
    } catch (err: any) {
      dispatch(actionError(err.response?.data?.error?.message || "Failed to reschedule request"));
      return null;
    }
  };
}

export function deleteMentorshipRequest(id: string) {
  return async (dispatch: Dispatch): Promise<boolean> => {
    dispatch(deleteStart());
    try {
      await axiosInstance.delete(MENTORSHIP_ENDPOINTS.DELETE(id));
      dispatch(deleteSuccess(id));
      return true;
    } catch (err: any) {
      dispatch(deleteError(err.response?.data?.error?.message || "Failed to delete request"));
      return false;
    }
  };
}
