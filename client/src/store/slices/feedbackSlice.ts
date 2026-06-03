/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice } from "@reduxjs/toolkit";
import type { Dispatch, PayloadAction } from "@reduxjs/toolkit";
import { axiosInstance } from "@/api/client";
import { FEEDBACK_ENDPOINTS } from "@/lib/constants";
import type {
  Feedback,
  AdminFeedbackStats,
  CategoryStat,
  StudentFeedbackStats,
  SubmitFeedbackInput,
} from "@/types/feedback";

interface Pagination {
  page: number; limit: number; total: number; totalPages: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: { code: string; message: string } | null;
}

interface FeedbackSliceState {
  // Admin
  allFeedback: Feedback[];
  adminStats: AdminFeedbackStats | null;
  categoryStats: CategoryStat[];
  selectedFeedback: Feedback | null;
  adminPagination: Pagination | null;
  adminSearch: string;
  adminStatusFilter: "all" | "pending" | "reviewed";

  // Student
  myFeedback: Feedback[];
  studentStats: StudentFeedbackStats | null;

  // Loading
  loadingAdmin: boolean;
  loadingAnalytics: boolean;
  loadingMy: boolean;
  submitting: boolean;
  responding: boolean;

  error: string | null;
  successMessage: string | null;
}

const initialState: FeedbackSliceState = {
  allFeedback: [],
  adminStats: null,
  categoryStats: [],
  selectedFeedback: null,
  adminPagination: null,
  adminSearch: "",
  adminStatusFilter: "all",

  myFeedback: [],
  studentStats: null,

  loadingAdmin: false,
  loadingAnalytics: false,
  loadingMy: false,
  submitting: false,
  responding: false,

  error: null,
  successMessage: null,
};

const feedbackSlice = createSlice({
  name: "feedback",
  initialState,
  reducers: {
    clearError:          (state) => { state.error = null; },
    clearSuccessMessage: (state) => { state.successMessage = null; },
    setAdminSearch:      (state, action: PayloadAction<string>) => { state.adminSearch = action.payload; },
    setAdminStatusFilter:(state, action: PayloadAction<"all"|"pending"|"reviewed">) => {
      state.adminStatusFilter = action.payload;
    },
    setSelectedFeedback: (state, action: PayloadAction<Feedback | null>) => {
      state.selectedFeedback = action.payload;
    },

    // Admin fetch
    fetchAdminStart: (state) => { state.loadingAdmin = true; state.error = null; },
    fetchAdminSuccess: (state, action: PayloadAction<{
      feedback: Feedback[]; stats: AdminFeedbackStats; pagination: Pagination;
    }>) => {
      state.loadingAdmin = false;
      state.allFeedback    = action.payload.feedback;
      state.adminStats     = action.payload.stats;
      state.adminPagination = action.payload.pagination;
    },
    fetchAdminError: (state, action: PayloadAction<string>) => {
      state.loadingAdmin = false; state.error = action.payload;
    },

    // Analytics
    fetchAnalyticsStart: (state) => { state.loadingAnalytics = true; },
    fetchAnalyticsSuccess: (state, action: PayloadAction<CategoryStat[]>) => {
      state.loadingAnalytics = false; state.categoryStats = action.payload;
    },
    fetchAnalyticsError: (state, action: PayloadAction<string>) => {
      state.loadingAnalytics = false; state.error = action.payload;
    },

    // Respond
    respondStart: (state) => { state.responding = true; state.error = null; },
    respondSuccess: (state, action: PayloadAction<Feedback>) => {
      state.responding = false;
      state.successMessage = "Response sent successfully!";
      const idx = state.allFeedback.findIndex((f) => f.id === action.payload.id);
      if (idx !== -1) state.allFeedback[idx] = action.payload;
      if (state.selectedFeedback?.id === action.payload.id) {
        state.selectedFeedback = action.payload;
      }
      if (state.adminStats) {
        state.adminStats.pending  = Math.max(0, state.adminStats.pending - 1);
        state.adminStats.reviewed += 1;
      }
    },
    respondError: (state, action: PayloadAction<string>) => {
      state.responding = false; state.error = action.payload;
    },

    // Student fetch
    fetchMyStart: (state) => { state.loadingMy = true; state.error = null; },
    fetchMySuccess: (state, action: PayloadAction<{
      feedback: Feedback[]; stats: StudentFeedbackStats;
    }>) => {
      state.loadingMy   = false;
      state.myFeedback  = action.payload.feedback;
      state.studentStats = action.payload.stats;
    },
    fetchMyError: (state, action: PayloadAction<string>) => {
      state.loadingMy = false; state.error = action.payload;
    },

    // Student submit
    submitStart: (state) => { state.submitting = true; state.error = null; },
    submitSuccess: (state, action: PayloadAction<Feedback>) => {
      state.submitting = false;
      state.myFeedback.unshift(action.payload);
      state.successMessage = "Feedback submitted successfully!";
      if (state.studentStats) {
        state.studentStats.total   += 1;
        state.studentStats.pending += 1;
      }
    },
    submitError: (state, action: PayloadAction<string>) => {
      state.submitting = false; state.error = action.payload;
    },
  },
});

export const {
  clearError, clearSuccessMessage, setAdminSearch, setAdminStatusFilter,
  setSelectedFeedback,
  fetchAdminStart, fetchAdminSuccess, fetchAdminError,
  fetchAnalyticsStart, fetchAnalyticsSuccess, fetchAnalyticsError,
  respondStart, respondSuccess, respondError,
  fetchMyStart, fetchMySuccess, fetchMyError,
  submitStart, submitSuccess, submitError,
} = feedbackSlice.actions;

// ── Thunks ──────────────────────────────────────────────────────────────────

export const fetchAdminFeedback =
  (params?: { page?: number; search?: string; status?: string }) =>
  async (dispatch: Dispatch) => {
    dispatch(fetchAdminStart());
    try {
      const query = new URLSearchParams();
      if (params?.page)   query.append("page",   String(params.page));
      if (params?.search) query.append("search", params.search);
      if (params?.status && params.status !== "all") query.append("status", params.status);
      const res = await axiosInstance.get<ApiResponse<any>>(
        `${FEEDBACK_ENDPOINTS.GET_ALL}?${query}`
      );
      if (res.data.success) dispatch(fetchAdminSuccess(res.data.data));
      else dispatch(fetchAdminError(res.data.error?.message || "Failed to fetch feedback"));
    } catch (err: any) {
      dispatch(fetchAdminError(err.response?.data?.error?.message || "Failed to fetch feedback"));
    }
  };

export const fetchFeedbackAnalytics = () => async (dispatch: Dispatch) => {
  dispatch(fetchAnalyticsStart());
  try {
    const res = await axiosInstance.get<ApiResponse<{ categoryStats: CategoryStat[] }>>(
      FEEDBACK_ENDPOINTS.ANALYTICS
    );
    if (res.data.success) dispatch(fetchAnalyticsSuccess(res.data.data.categoryStats));
    else dispatch(fetchAnalyticsError(res.data.error?.message || "Failed to fetch analytics"));
  } catch (err: any) {
    dispatch(fetchAnalyticsError(err.response?.data?.error?.message || "Failed to fetch analytics"));
  }
};

export const respondToFeedback =
  (id: number, response: string) => async (dispatch: Dispatch) => {
    dispatch(respondStart());
    try {
      const res = await axiosInstance.patch<ApiResponse<{ feedback: Feedback }>>(
        FEEDBACK_ENDPOINTS.RESPOND(id),
        { response }
      );
      if (res.data.success) dispatch(respondSuccess(res.data.data.feedback));
      else dispatch(respondError(res.data.error?.message || "Failed to send response"));
    } catch (err: any) {
      dispatch(respondError(err.response?.data?.error?.message || "Failed to send response"));
    }
  };

export const fetchMyFeedback = () => async (dispatch: Dispatch) => {
  dispatch(fetchMyStart());
  try {
    const res = await axiosInstance.get<ApiResponse<any>>(FEEDBACK_ENDPOINTS.GET_MY);
    if (res.data.success) dispatch(fetchMySuccess(res.data.data));
    else dispatch(fetchMyError(res.data.error?.message || "Failed to fetch feedback"));
  } catch (err: any) {
    dispatch(fetchMyError(err.response?.data?.error?.message || "Failed to fetch feedback"));
  }
};

export const submitFeedback =
  (data: SubmitFeedbackInput) => async (dispatch: Dispatch) => {
    dispatch(submitStart());
    try {
      const res = await axiosInstance.post<ApiResponse<{ feedback: Feedback }>>(
        FEEDBACK_ENDPOINTS.SUBMIT,
        data
      );
      if (res.data.success) dispatch(submitSuccess(res.data.data.feedback));
      else dispatch(submitError(res.data.error?.message || "Failed to submit feedback"));
    } catch (err: any) {
      dispatch(submitError(err.response?.data?.error?.message || "Failed to submit feedback"));
    }
  };

export default feedbackSlice.reducer;
