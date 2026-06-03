/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice } from "@reduxjs/toolkit";
import type { Dispatch, PayloadAction } from "@reduxjs/toolkit";
import { axiosInstance } from "@/api/client";
import { FAQ_ENDPOINTS } from "@/lib/constants";
import type {
  FAQ,
  FAQStats,
  CreateFAQInput,
  UpdateFAQInput,
  ReorderItem,
} from "@/types/faqs";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: { code: string; message: string } | null;
  timestamp: string;
}

interface FAQSliceState {
  faqs: FAQ[];
  stats: FAQStats | null;

  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  toggling: boolean;

  error: string | null;
  successMessage: string | null;
}

const initialState: FAQSliceState = {
  faqs: [],
  stats: null,

  loading: false,
  creating: false,
  updating: false,
  deleting: false,
  toggling: false,

  error: null,
  successMessage: null,
};

const faqSlice = createSlice({
  name: "faqs",
  initialState,
  reducers: {
    clearError: (state) => { state.error = null; },
    clearSuccessMessage: (state) => { state.successMessage = null; },

    // Fetch
    fetchFAQsStart: (state) => { state.loading = true; state.error = null; },
    fetchFAQsSuccess: (
      state,
      action: PayloadAction<{ faqs: FAQ[]; stats: FAQStats }>
    ) => {
      state.loading = false;
      state.faqs = action.payload.faqs;
      state.stats = action.payload.stats;
    },
    fetchFAQsError: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Create
    createFAQStart: (state) => { state.creating = true; state.error = null; },
    createFAQSuccess: (state, action: PayloadAction<FAQ>) => {
      state.creating = false;
      state.faqs.push(action.payload);
      state.faqs.sort((a, b) => a.order - b.order);
      state.successMessage = "FAQ created successfully!";
      if (state.stats) {
        state.stats.total += 1;
        if (action.payload.isActive) state.stats.active += 1;
        else state.stats.inactive += 1;
      }
    },
    createFAQError: (state, action: PayloadAction<string>) => {
      state.creating = false;
      state.error = action.payload;
    },

    // Update
    updateFAQStart: (state) => { state.updating = true; state.error = null; },
    updateFAQSuccess: (state, action: PayloadAction<FAQ>) => {
      state.updating = false;
      const idx = state.faqs.findIndex((f) => f.id === action.payload.id);
      if (idx !== -1) state.faqs[idx] = action.payload;
      state.successMessage = "FAQ updated successfully!";
    },
    updateFAQError: (state, action: PayloadAction<string>) => {
      state.updating = false;
      state.error = action.payload;
    },

    // Delete
    deleteFAQStart: (state) => { state.deleting = true; state.error = null; },
    deleteFAQSuccess: (state, action: PayloadAction<number>) => {
      state.deleting = false;
      const removed = state.faqs.find((f) => f.id === action.payload);
      state.faqs = state.faqs.filter((f) => f.id !== action.payload);
      state.successMessage = "FAQ deleted successfully!";
      if (state.stats && removed) {
        state.stats.total -= 1;
        if (removed.isActive) state.stats.active -= 1;
        else state.stats.inactive -= 1;
      }
    },
    deleteFAQError: (state, action: PayloadAction<string>) => {
      state.deleting = false;
      state.error = action.payload;
    },

    // Toggle
    toggleFAQStart: (state) => { state.toggling = true; },
    toggleFAQSuccess: (state, action: PayloadAction<FAQ>) => {
      state.toggling = false;
      const idx = state.faqs.findIndex((f) => f.id === action.payload.id);
      if (idx !== -1) {
        const wasActive = state.faqs[idx].isActive;
        state.faqs[idx] = action.payload;
        if (state.stats) {
          if (wasActive) { state.stats.active -= 1; state.stats.inactive += 1; }
          else { state.stats.inactive -= 1; state.stats.active += 1; }
        }
      }
    },
    toggleFAQError: (state, action: PayloadAction<string>) => {
      state.toggling = false;
      state.error = action.payload;
    },

    // Optimistic reorder — update local state immediately, persist in background
    reorderFAQsOptimistic: (state, action: PayloadAction<ReorderItem[]>) => {
      action.payload.forEach(({ id, order }) => {
        const faq = state.faqs.find((f) => f.id === id);
        if (faq) faq.order = order;
      });
      state.faqs.sort((a, b) => a.order - b.order);
    },
    reorderFAQsError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
  },
});

export const {
  clearError,
  clearSuccessMessage,
  fetchFAQsStart,
  fetchFAQsSuccess,
  fetchFAQsError,
  createFAQStart,
  createFAQSuccess,
  createFAQError,
  updateFAQStart,
  updateFAQSuccess,
  updateFAQError,
  deleteFAQStart,
  deleteFAQSuccess,
  deleteFAQError,
  toggleFAQStart,
  toggleFAQSuccess,
  toggleFAQError,
  reorderFAQsOptimistic,
  reorderFAQsError,
} = faqSlice.actions;

// ── Thunks ──────────────────────────────────────────────────────────────────

export const fetchAdminFAQs = () => async (dispatch: Dispatch) => {
  dispatch(fetchFAQsStart());
  try {
    const res = await axiosInstance.get<
      ApiResponse<{ faqs: FAQ[]; stats: FAQStats }>
    >(FAQ_ENDPOINTS.GET_ADMIN_FAQS);
    if (res.data.success) {
      dispatch(fetchFAQsSuccess(res.data.data));
    } else {
      dispatch(fetchFAQsError(res.data.error?.message || "Failed to fetch FAQs"));
    }
  } catch (error: any) {
    dispatch(fetchFAQsError(error.response?.data?.error?.message || "Failed to fetch FAQs"));
  }
};

export const createFAQ = (data: CreateFAQInput) => async (dispatch: Dispatch) => {
  dispatch(createFAQStart());
  try {
    const res = await axiosInstance.post<ApiResponse<{ faq: FAQ }>>(
      FAQ_ENDPOINTS.CREATE_FAQ,
      data
    );
    if (res.data.success) {
      dispatch(createFAQSuccess(res.data.data.faq));
    } else {
      dispatch(createFAQError(res.data.error?.message || "Failed to create FAQ"));
    }
  } catch (error: any) {
    dispatch(createFAQError(error.response?.data?.error?.message || "Failed to create FAQ"));
  }
};

export const updateFAQ = (id: number, data: UpdateFAQInput) => async (dispatch: Dispatch) => {
  dispatch(updateFAQStart());
  try {
    const res = await axiosInstance.put<ApiResponse<{ faq: FAQ }>>(
      FAQ_ENDPOINTS.UPDATE_FAQ(id),
      data
    );
    if (res.data.success) {
      dispatch(updateFAQSuccess(res.data.data.faq));
    } else {
      dispatch(updateFAQError(res.data.error?.message || "Failed to update FAQ"));
    }
  } catch (error: any) {
    dispatch(updateFAQError(error.response?.data?.error?.message || "Failed to update FAQ"));
  }
};

export const deleteFAQ = (id: number) => async (dispatch: Dispatch) => {
  dispatch(deleteFAQStart());
  try {
    const res = await axiosInstance.delete<ApiResponse<null>>(
      FAQ_ENDPOINTS.DELETE_FAQ(id)
    );
    if (res.data.success) {
      dispatch(deleteFAQSuccess(id));
    } else {
      dispatch(deleteFAQError(res.data.error?.message || "Failed to delete FAQ"));
    }
  } catch (error: any) {
    dispatch(deleteFAQError(error.response?.data?.error?.message || "Failed to delete FAQ"));
  }
};

export const toggleFAQ = (id: number) => async (dispatch: Dispatch) => {
  dispatch(toggleFAQStart());
  try {
    const res = await axiosInstance.patch<ApiResponse<{ faq: FAQ }>>(
      FAQ_ENDPOINTS.TOGGLE_FAQ(id)
    );
    if (res.data.success) {
      dispatch(toggleFAQSuccess(res.data.data.faq));
    } else {
      dispatch(toggleFAQError(res.data.error?.message || "Failed to toggle FAQ"));
    }
  } catch (error: any) {
    dispatch(toggleFAQError(error.response?.data?.error?.message || "Failed to toggle FAQ"));
  }
};

export const reorderFAQs =
  (items: ReorderItem[]) => async (dispatch: Dispatch) => {
    dispatch(reorderFAQsOptimistic(items));
    try {
      await axiosInstance.patch(FAQ_ENDPOINTS.REORDER_FAQS, { items });
    } catch (error: any) {
      dispatch(reorderFAQsError("Reorder failed — refreshing list"));
      dispatch(fetchAdminFAQs() as any);
    }
  };

export default faqSlice.reducer;
