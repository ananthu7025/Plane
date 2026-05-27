/* eslint-disable @typescript-eslint/no-explicit-any */
import { axiosInstance } from "@/api/client";
import { createSlice } from "@reduxjs/toolkit";
import type { Dispatch, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "sonner";
import { NEWSLETTER_ENDPOINTS } from "@/lib/constants";

// API Response wrapper type
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  } | null;
  timestamp: string;
}

// Types
export interface Newsletter {
  id: string;
  title: string;
  description?: string;
  category: string;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  fileSize: number;
  status: "published" | "archived" | "draft";
  uploadedBy: string;
  publishedAt: string;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface NewsletterPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// State Interface
interface NewsletterSliceState {
  // Web newsletters (student view)
  newsletters: Newsletter[];
  newslettersPage: number;
  newslettersLimit: number;
  newslettersTotal: number;
  newslettersPagination: NewsletterPagination | null;
  newslettersSearch: string;
  newslettersCategory: string;

  // Admin newsletters view
  adminNewsletters: Newsletter[];
  adminPage: number;
  adminLimit: number;
  adminPagination: NewsletterPagination | null;
  adminSearch: string;
  adminCategory: string;
  adminStatus: "published" | "archived" | "draft" | "all";
  adminSort: "recent" | "oldest";

  // Single newsletter detail
  selectedNewsletter: Newsletter | null;

  // Loading states
  loadingNewsletters: boolean;
  loadingAdminNewsletters: boolean;
  loadingDetail: boolean;
  creatingNewsletter: boolean;
  updatingNewsletter: boolean;
  deletingNewsletter: boolean;
  togglingStatus: boolean;

  // Error & Success messages
  error: string | null;
  successMessage: string | null;
}

const initialState: NewsletterSliceState = {
  // Web newsletters
  newsletters: [],
  newslettersPage: 1,
  newslettersLimit: 10,
  newslettersTotal: 0,
  newslettersPagination: null,
  newslettersSearch: "",
  newslettersCategory: "",

  // Admin newsletters
  adminNewsletters: [],
  adminPage: 1,
  adminLimit: 20,
  adminPagination: null,
  adminSearch: "",
  adminCategory: "",
  adminStatus: "all",
  adminSort: "recent",

  // Detail
  selectedNewsletter: null,

  // Loading
  loadingNewsletters: false,
  loadingAdminNewsletters: false,
  loadingDetail: false,
  creatingNewsletter: false,
  updatingNewsletter: false,
  deletingNewsletter: false,
  togglingStatus: false,

  // Messages
  error: null,
  successMessage: null,
};

// Slice
const newsletterSlice = createSlice({
  name: "newsletters",
  initialState,
  reducers: {
    // Filter & Search - Web
    setNewslettersSearch: (state, action: PayloadAction<string>) => {
      state.newslettersSearch = action.payload;
      state.newslettersPage = 1;
    },
    setNewslettersCategory: (state, action: PayloadAction<string>) => {
      state.newslettersCategory = action.payload;
      state.newslettersPage = 1;
    },
    setNewslettersPage: (state, action: PayloadAction<number>) => {
      state.newslettersPage = action.payload;
    },

    // Filter & Search - Admin
    setAdminSearch: (state, action: PayloadAction<string>) => {
      state.adminSearch = action.payload;
      state.adminPage = 1;
    },
    setAdminCategory: (state, action: PayloadAction<string>) => {
      state.adminCategory = action.payload;
      state.adminPage = 1;
    },
    setAdminStatus: (state, action: PayloadAction<"published" | "archived" | "draft" | "all">) => {
      state.adminStatus = action.payload;
      state.adminPage = 1;
    },
    setAdminSort: (state, action: PayloadAction<"recent" | "oldest">) => {
      state.adminSort = action.payload;
      state.adminPage = 1;
    },
    setAdminPage: (state, action: PayloadAction<number>) => {
      state.adminPage = action.payload;
    },

    // Detail
    setSelectedNewsletter: (state, action: PayloadAction<Newsletter>) => {
      state.selectedNewsletter = action.payload;
    },
    clearDetail: (state) => {
      state.selectedNewsletter = null;
    },

    // UI State
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },

    // Web Newsletters - Load
    getNewslettersStart: (state) => {
      state.loadingNewsletters = true;
      state.error = null;
    },
    getNewslettersSuccess: (
      state,
      action: PayloadAction<{ items: Newsletter[]; pagination: NewsletterPagination }>
    ) => {
      state.loadingNewsletters = false;
      state.newsletters = action.payload.items;
      state.newslettersPagination = action.payload.pagination;
      state.newslettersTotal = action.payload.pagination.total;
    },
    getNewslettersError: (state, action: PayloadAction<string>) => {
      state.loadingNewsletters = false;
      state.error = action.payload;
    },

    // Admin Newsletters - Load
    getAdminNewslettersStart: (state) => {
      state.loadingAdminNewsletters = true;
      state.error = null;
    },
    getAdminNewslettersSuccess: (
      state,
      action: PayloadAction<{ items: Newsletter[]; pagination: NewsletterPagination }>
    ) => {
      state.loadingAdminNewsletters = false;
      state.adminNewsletters = action.payload.items;
      state.adminPagination = action.payload.pagination;
    },
    getAdminNewslettersError: (state, action: PayloadAction<string>) => {
      state.loadingAdminNewsletters = false;
      state.error = action.payload;
    },

    // Newsletter Detail
    getNewsletterDetailStart: (state) => {
      state.loadingDetail = true;
      state.error = null;
    },
    getNewsletterDetailSuccess: (state, action: PayloadAction<Newsletter>) => {
      state.loadingDetail = false;
      state.selectedNewsletter = action.payload;
    },
    getNewsletterDetailError: (state, action: PayloadAction<string>) => {
      state.loadingDetail = false;
      state.error = action.payload;
    },


    // Create Newsletter
    createNewsletterStart: (state) => {
      state.creatingNewsletter = true;
      state.error = null;
    },
    createNewsletterSuccess: (state) => {
      state.creatingNewsletter = false;
      state.successMessage = "Newsletter created successfully!";
      state.adminPage = 1;
    },
    createNewsletterError: (state, action: PayloadAction<string>) => {
      state.creatingNewsletter = false;
      state.error = action.payload;
    },

    // Update Newsletter
    updateNewsletterStart: (state) => {
      state.updatingNewsletter = true;
      state.error = null;
    },
    updateNewsletterSuccess: (state, action: PayloadAction<Newsletter>) => {
      state.updatingNewsletter = false;
      state.successMessage = "Newsletter updated successfully!";
      // Update in admin list
      const index = state.adminNewsletters.findIndex(n => n.id === action.payload.id);
      if (index !== -1) {
        state.adminNewsletters[index] = action.payload;
      }
      // Update selected if viewing
      if (state.selectedNewsletter?.id === action.payload.id) {
        state.selectedNewsletter = action.payload;
      }
    },
    updateNewsletterError: (state, action: PayloadAction<string>) => {
      state.updatingNewsletter = false;
      state.error = action.payload;
    },

    // Delete Newsletter
    deleteNewsletterStart: (state) => {
      state.deletingNewsletter = true;
      state.error = null;
    },
    deleteNewsletterSuccess: (state, action: PayloadAction<{ id: string }>) => {
      state.deletingNewsletter = false;
      state.successMessage = "Newsletter deleted successfully!";
      state.adminNewsletters = state.adminNewsletters.filter(n => n.id !== action.payload.id);
      if (state.selectedNewsletter?.id === action.payload.id) {
        state.selectedNewsletter = null;
      }
    },
    deleteNewsletterError: (state, action: PayloadAction<string>) => {
      state.deletingNewsletter = false;
      state.error = action.payload;
    },

    // Toggle Status
    toggleStatusStart: (state) => {
      state.togglingStatus = true;
      state.error = null;
    },
    toggleStatusSuccess: (state, action: PayloadAction<Newsletter>) => {
      state.togglingStatus = false;
      state.successMessage = "Status updated successfully!";
      const index = state.adminNewsletters.findIndex(n => n.id === action.payload.id);
      if (index !== -1) {
        state.adminNewsletters[index] = action.payload;
      }
      if (state.selectedNewsletter?.id === action.payload.id) {
        state.selectedNewsletter = action.payload;
      }
    },
    toggleStatusError: (state, action: PayloadAction<string>) => {
      state.togglingStatus = false;
      state.error = action.payload;
    },
  },
});

export const {
  // Web filters
  setNewslettersSearch,
  setNewslettersCategory,
  setNewslettersPage,

  // Admin filters
  setAdminSearch,
  setAdminCategory,
  setAdminStatus,
  setAdminSort,
  setAdminPage,

  // Detail
  setSelectedNewsletter,
  clearDetail,

  // UI state
  clearError,
  clearSuccessMessage,

  // Web Newsletters
  getNewslettersStart,
  getNewslettersSuccess,
  getNewslettersError,

  // Admin Newsletters
  getAdminNewslettersStart,
  getAdminNewslettersSuccess,
  getAdminNewslettersError,

  // Detail
  getNewsletterDetailStart,
  getNewsletterDetailSuccess,
  getNewsletterDetailError,

  // Create
  createNewsletterStart,
  createNewsletterSuccess,
  createNewsletterError,

  // Update
  updateNewsletterStart,
  updateNewsletterSuccess,
  updateNewsletterError,

  // Delete
  deleteNewsletterStart,
  deleteNewsletterSuccess,
  deleteNewsletterError,

  // Toggle
  toggleStatusStart,
  toggleStatusSuccess,
  toggleStatusError,
} = newsletterSlice.actions;

export default newsletterSlice.reducer;

// ============================================================================
// THUNK FUNCTIONS
// ============================================================================

/**
 * Fetch newsletters (web platform)
 */
export function fetchNewsletters(params: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
}) {
  return async function (dispatch: Dispatch) {
    dispatch(getNewslettersStart());
    try {
      const response = await axiosInstance.get<ApiResponse<any>>(
        NEWSLETTER_ENDPOINTS.GET_NEWSLETTERS,
        { params }
      );
      const { items, pagination } = response.data.data;
      dispatch(
        getNewslettersSuccess({
          items,
          pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total: pagination.total,
            totalPages: pagination.totalPages,
          },
        })
      );
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to load newsletters";
      dispatch(getNewslettersError(message));
      toast.error(message);
    }
  };
}

/**
 * Fetch admin newsletters
 */
export function fetchAdminNewsletters(params: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: "published" | "archived" | "draft" | "all";
  sort?: "recent" | "oldest";
}) {
  return async function (dispatch: Dispatch) {
    dispatch(getAdminNewslettersStart());
    try {
      const response = await axiosInstance.get<ApiResponse<any>>(
        NEWSLETTER_ENDPOINTS.GET_ADMIN_NEWSLETTERS,
        { params }
      );
      const { items, pagination } = response.data.data;
      dispatch(
        getAdminNewslettersSuccess({
          items,
          pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total: pagination.total,
            totalPages: pagination.totalPages,
          },
        })
      );
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to load newsletters";
      dispatch(getAdminNewslettersError(message));
      toast.error(message);
    }
  };
}

/**
 * Fetch newsletter detail
 */
export function fetchNewsletterDetail(id: string) {
  return async function (dispatch: Dispatch) {
    dispatch(getNewsletterDetailStart());
    try {
      const response = await axiosInstance.get<ApiResponse<Newsletter>>(
        NEWSLETTER_ENDPOINTS.GET_NEWSLETTER_DETAIL(id)
      );
      dispatch(getNewsletterDetailSuccess(response.data.data));
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to load newsletter";
      dispatch(getNewsletterDetailError(message));
      toast.error(message);
    }
  };
}

/**
 * Create newsletter
 */
export function createNewsletter(payload: FormData) {
  return async function (dispatch: Dispatch) {
    dispatch(createNewsletterStart());
    try {
      await axiosInstance.post<ApiResponse<Newsletter>>(
        NEWSLETTER_ENDPOINTS.CREATE_NEWSLETTER,
        payload,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      dispatch(createNewsletterSuccess());
      dispatch(fetchAdminNewsletters({ page: 1 }) as any);
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to create newsletter";
      dispatch(createNewsletterError(message));
      toast.error(message);
    }
  };
}

/**
 * Update newsletter
 */
export function updateNewsletter(id: string, payload: {
  title?: string;
  description?: string;
  category?: string;
}) {
  return async function (dispatch: Dispatch) {
    dispatch(updateNewsletterStart());
    try {
      const response = await axiosInstance.put<ApiResponse<Newsletter>>(
        NEWSLETTER_ENDPOINTS.UPDATE_NEWSLETTER(id),
        payload
      );
      dispatch(updateNewsletterSuccess(response.data.data));
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to update newsletter";
      dispatch(updateNewsletterError(message));
      toast.error(message);
    }
  };
}

/**
 * Delete newsletter
 */
export function deleteNewsletter(id: string) {
  return async function (dispatch: Dispatch) {
    dispatch(deleteNewsletterStart());
    try {
      await axiosInstance.delete<ApiResponse<any>>(
        NEWSLETTER_ENDPOINTS.DELETE_NEWSLETTER(id)
      );
      dispatch(deleteNewsletterSuccess({ id }));
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to delete newsletter";
      dispatch(deleteNewsletterError(message));
      toast.error(message);
    }
  };
}

/**
 * Toggle newsletter status
 */
export function toggleNewsletterStatus(id: string, status: "published" | "archived" | "draft") {
  return async function (dispatch: Dispatch) {
    dispatch(toggleStatusStart());
    try {
      const response = await axiosInstance.put<ApiResponse<Newsletter>>(
        NEWSLETTER_ENDPOINTS.TOGGLE_NEWSLETTER_STATUS(id),
        { status }
      );
      dispatch(toggleStatusSuccess(response.data.data));
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to update status";
      dispatch(toggleStatusError(message));
      toast.error(message);
    }
  };
}
