/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice } from "@reduxjs/toolkit";
import type { Dispatch, PayloadAction } from "@reduxjs/toolkit";
import { axiosInstance } from "@/api/client";
import { MENTORSHIP_ENDPOINTS } from "@/lib/constants";
import type {
  MentorshipRequest,
  MentorshipStats,
  SubmitMentorshipInput,
  ApproveMentorshipInput,
  RejectMentorshipInput,
  RescheduleMentorshipInput,
  AdminMentorshipFilters,
} from "@/types/mentorship";

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface MentorshipState {
  myRequests: MentorshipRequest[];
  myStats: MentorshipStats | null;
  adminRequests: MentorshipRequest[];
  adminStats: MentorshipStats | null;
  adminPagination: Pagination | null;
  selectedRequest: MentorshipRequest | null;
  loading: boolean;
  submitting: boolean;
  actionLoading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: MentorshipState = {
  myRequests: [],
  myStats: null,
  adminRequests: [],
  adminStats: null,
  adminPagination: null,
  selectedRequest: null,
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
    clearMentorshipError(state) {
      state.error = null;
    },
    clearSuccessMessage(state) {
      state.successMessage = null;
    },

    fetchMyStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchMySuccess(state, action: PayloadAction<{ requests: MentorshipRequest[]; stats: MentorshipStats }>) {
      state.loading = false;
      state.myRequests = action.payload.requests;
      state.myStats = action.payload.stats;
    },
    fetchMyError(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    submitStart(state) {
      state.submitting = true;
      state.error = null;
    },
    submitSuccess(state, action: PayloadAction<MentorshipRequest>) {
      state.submitting = false;
      state.myRequests.unshift(action.payload);
      if (state.myStats) {
        state.myStats.total += 1;
        state.myStats.pending += 1;
      }
      state.successMessage = "Mentorship request submitted successfully";
    },
    submitError(state, action: PayloadAction<string>) {
      state.submitting = false;
      state.error = action.payload;
    },

    fetchAdminStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchAdminSuccess(
      state,
      action: PayloadAction<{ requests: MentorshipRequest[]; stats: MentorshipStats; pagination: Pagination }>
    ) {
      state.loading = false;
      state.adminRequests = action.payload.requests;
      state.adminStats = action.payload.stats;
      state.adminPagination = action.payload.pagination;
    },
    fetchAdminError(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    actionStart(state) {
      state.actionLoading = true;
      state.error = null;
    },
    actionSuccess(state, action: PayloadAction<MentorshipRequest>) {
      state.actionLoading = false;
      const idx = state.adminRequests.findIndex((r) => r.id === action.payload.id);
      if (idx !== -1) state.adminRequests[idx] = action.payload;
      if (state.selectedRequest?.id === action.payload.id) state.selectedRequest = action.payload;
    },
    actionError(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.error = action.payload;
    },

    deleteStart(state) {
      state.actionLoading = true;
      state.error = null;
    },
    deleteSuccess(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.adminRequests = state.adminRequests.filter((r) => r.id !== action.payload);
      if (state.selectedRequest?.id === action.payload) state.selectedRequest = null;
    },
    deleteError(state, action: PayloadAction<string>) {
      state.actionLoading = false;
      state.error = action.payload;
    },
  },
});

export const {
  setSelectedRequest,
  clearMentorshipError,
  clearSuccessMessage,
  fetchMyStart,
  fetchMySuccess,
  fetchMyError,
  submitStart,
  submitSuccess,
  submitError,
  fetchAdminStart,
  fetchAdminSuccess,
  fetchAdminError,
  actionStart,
  actionSuccess,
  actionError,
  deleteStart,
  deleteSuccess,
  deleteError,
} = mentorshipSlice.actions;

export default mentorshipSlice.reducer;

// ── Thunk functions ───────────────────────────────────────────────────────────

export function fetchMyMentorshipRequests() {
  return async function (dispatch: Dispatch) {
    dispatch(fetchMyStart());
    try {
      const response = await axiosInstance.get(MENTORSHIP_ENDPOINTS.GET_MY);
      dispatch(fetchMySuccess(response.data.data));
    } catch (error: any) {
      const message = error.response?.data?.error?.message || "Failed to fetch requests";
      dispatch(fetchMyError(message));
    }
  };
}

export function submitMentorshipRequest(input: SubmitMentorshipInput) {
  return async function (dispatch: Dispatch) {
    dispatch(submitStart());
    try {
      const response = await axiosInstance.post(MENTORSHIP_ENDPOINTS.SUBMIT, input);
      const request = response.data.data.request as MentorshipRequest;
      dispatch(submitSuccess(request));
      return request;
    } catch (error: any) {
      const message = error.response?.data?.error?.message || "Failed to submit request";
      dispatch(submitError(message));
      return null;
    }
  };
}

export function fetchAdminMentorshipRequests(filters: AdminMentorshipFilters = {}) {
  return async function (dispatch: Dispatch) {
    dispatch(fetchAdminStart());
    try {
      const response = await axiosInstance.get(MENTORSHIP_ENDPOINTS.GET_ALL, { params: filters });
      dispatch(fetchAdminSuccess(response.data.data));
    } catch (error: any) {
      const message = error.response?.data?.error?.message || "Failed to fetch requests";
      dispatch(fetchAdminError(message));
    }
  };
}

export function approveMentorshipRequest({ id, input }: { id: string; input: ApproveMentorshipInput }) {
  return async function (dispatch: Dispatch) {
    dispatch(actionStart());
    try {
      const response = await axiosInstance.patch(MENTORSHIP_ENDPOINTS.APPROVE(id), input);
      const request = response.data.data.request as MentorshipRequest;
      dispatch(actionSuccess(request));
      return request;
    } catch (error: any) {
      const message = error.response?.data?.error?.message || "Failed to approve request";
      dispatch(actionError(message));
      return null;
    }
  };
}

export function rejectMentorshipRequest({ id, input }: { id: string; input: RejectMentorshipInput }) {
  return async function (dispatch: Dispatch) {
    dispatch(actionStart());
    try {
      const response = await axiosInstance.patch(MENTORSHIP_ENDPOINTS.REJECT(id), input);
      const request = response.data.data.request as MentorshipRequest;
      dispatch(actionSuccess(request));
      return request;
    } catch (error: any) {
      const message = error.response?.data?.error?.message || "Failed to reject request";
      dispatch(actionError(message));
      return null;
    }
  };
}

export function rescheduleMentorshipRequest({ id, input }: { id: string; input: RescheduleMentorshipInput }) {
  return async function (dispatch: Dispatch) {
    dispatch(actionStart());
    try {
      const response = await axiosInstance.patch(MENTORSHIP_ENDPOINTS.RESCHEDULE(id), input);
      const request = response.data.data.request as MentorshipRequest;
      dispatch(actionSuccess(request));
      return request;
    } catch (error: any) {
      const message = error.response?.data?.error?.message || "Failed to reschedule request";
      dispatch(actionError(message));
      return null;
    }
  };
}

export function deleteMentorshipRequest(id: string) {
  return async function (dispatch: Dispatch) {
    dispatch(deleteStart());
    try {
      await axiosInstance.delete(MENTORSHIP_ENDPOINTS.DELETE(id));
      dispatch(deleteSuccess(id));
      return id;
    } catch (error: any) {
      const message = error.response?.data?.error?.message || "Failed to delete request";
      dispatch(deleteError(message));
      return null;
    }
  };
}
