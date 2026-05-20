/* eslint-disable @typescript-eslint/no-explicit-any */
import { axiosInstance } from "@/api/client";
import { createSlice } from "@reduxjs/toolkit";
import type { Dispatch, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "sonner";
import { LETTERS_ENDPOINTS } from "@/lib/constants";

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
export interface Letter {
  id: string;
  subject: string;
  content: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  isAnonymous: boolean;
  isPublished: boolean;
  acknowledgementCount: number;
  viewCount: number;
  isLiked?: boolean;
  author?: {
    id: string;
    fullName: string;
    avatar?: string;
  } | null;
  authorId?: string; // Only for admins
  coverMediaId?: string | null;
  createdAt: string;
  publishedAt?: string | null;
  updatedAt: string;
}

export interface LetterPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface LetterStats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  totalLikes: number;
  totalViews: number;
  avgViewsPerLetter: number;
  avgLikesPerLetter: number;
}

// State Interface
interface LetterSliceState {
  // Public letters (feed)
  publicLetters: Letter[];
  publicPage: number;
  publicLimit: number;
  publicTotal: number;
  publicHasMore: boolean;
  publicSort: "recent" | "popular" | "trending";
  publicSearch: string;

  // My letters (user's own letters)
  myLetters: Letter[];
  myLettersPage: number;
  myLettersTotal: number;
  myLettersStatus: "all" | "PENDING" | "APPROVED" | "REJECTED";

  // Moderation queue (admin only)
  moderationLetters: Letter[];
  moderationPage: number;
  moderationTotal: number;
  moderationStatus: "PENDING" | "APPROVED" | "REJECTED";
  moderationSearch: string;

  // Detail view
  selectedLetter: Letter | null;
  selectedLetterVersions: any[];

  // Statistics (admin)
  stats: LetterStats | null;

  // Loading states - Fine-grained for different operations
  loadingPublicLetters: boolean;
  loadingMyLetters: boolean;
  loadingModerationQueue: boolean;
  loadingSelectedLetter: boolean;
  loadingStats: boolean;
  creatingLetter: boolean;
  resubmittingLetter: boolean;
  approvingLetter: boolean;
  rejectingLetter: boolean;
  deletingLetter: boolean;
  togglingLike: boolean;

  // Error & Success messages
  error: string | null;
  successMessage: string | null;
}

const initialState: LetterSliceState = {
  // Public letters
  publicLetters: [],
  publicPage: 1,
  publicLimit: 10,
  publicTotal: 0,
  publicHasMore: true,
  publicSort: "recent",
  publicSearch: "",

  // My letters
  myLetters: [],
  myLettersPage: 1,
  myLettersTotal: 0,
  myLettersStatus: "all",

  // Moderation queue
  moderationLetters: [],
  moderationPage: 1,
  moderationTotal: 0,
  moderationStatus: "PENDING",
  moderationSearch: "",

  // Detail view
  selectedLetter: null,
  selectedLetterVersions: [],

  // Statistics
  stats: null,

  // Loading states
  loadingPublicLetters: false,
  loadingMyLetters: false,
  loadingModerationQueue: false,
  loadingSelectedLetter: false,
  loadingStats: false,
  creatingLetter: false,
  resubmittingLetter: false,
  approvingLetter: false,
  rejectingLetter: false,
  deletingLetter: false,
  togglingLike: false,

  // Error & Success
  error: null,
  successMessage: null,
};

// Slice
const letterSlice = createSlice({
  name: "letters",
  initialState,
  reducers: {
    // Filter & Search - Public Feed
    setPublicSearch: (state, action: PayloadAction<string>) => {
      state.publicSearch = action.payload;
      state.publicPage = 1;
    },
    setPublicSort: (state, action: PayloadAction<"recent" | "popular" | "trending">) => {
      state.publicSort = action.payload;
      state.publicPage = 1;
    },
    setPublicPage: (state, action: PayloadAction<number>) => {
      state.publicPage = action.payload;
    },

    // My Letters Filter
    setMyLettersStatus: (state, action: PayloadAction<"all" | "PENDING" | "APPROVED" | "REJECTED">) => {
      state.myLettersStatus = action.payload;
      state.myLettersPage = 1;
    },
    setMyLettersPage: (state, action: PayloadAction<number>) => {
      state.myLettersPage = action.payload;
    },

    // Moderation Filter
    setModerationStatus: (state, action: PayloadAction<"PENDING" | "APPROVED" | "REJECTED">) => {
      state.moderationStatus = action.payload;
      state.moderationPage = 1;
    },
    setModerationSearch: (state, action: PayloadAction<string>) => {
      state.moderationSearch = action.payload;
      state.moderationPage = 1;
    },
    setModerationPage: (state, action: PayloadAction<number>) => {
      state.moderationPage = action.payload;
    },

    // Detail View
    setSelectedLetter: (state, action: PayloadAction<Letter>) => {
      state.selectedLetter = action.payload;
    },
    clearSelectedLetter: (state) => {
      state.selectedLetter = null;
      state.selectedLetterVersions = [];
    },

    // UI State
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },

    // Public Letters - Load Start/Success/Error
    getPublicLettersStart: (state) => {
      state.loadingPublicLetters = true;
      state.error = null;
    },
    getPublicLettersSuccess: (
      state,
      action: PayloadAction<{ letters: Letter[]; pagination: LetterPagination }>
    ) => {
      state.loadingPublicLetters = false;
      const { letters, pagination } = action.payload;
      // Append if page > 1 (infinite scroll), else replace
      if (state.publicPage === 1) {
        state.publicLetters = letters;
      } else {
        state.publicLetters = [...state.publicLetters, ...letters];
      }
      state.publicTotal = pagination.total;
      state.publicHasMore = pagination.hasMore;
    },
    getPublicLettersError: (state, action: PayloadAction<string>) => {
      state.loadingPublicLetters = false;
      state.error = action.payload;
    },

    // My Letters - Load Start/Success/Error
    getMyLettersStart: (state) => {
      state.loadingMyLetters = true;
      state.error = null;
    },
    getMyLettersSuccess: (
      state,
      action: PayloadAction<{ letters: Letter[]; pagination: LetterPagination }>
    ) => {
      state.loadingMyLetters = false;
      state.myLetters = action.payload.letters;
      state.myLettersTotal = action.payload.pagination.total;
    },
    getMyLettersError: (state, action: PayloadAction<string>) => {
      state.loadingMyLetters = false;
      state.error = action.payload;
    },

    // Moderation Queue - Load Start/Success/Error
    getModerationQueueStart: (state) => {
      state.loadingModerationQueue = true;
      state.error = null;
    },
    getModerationQueueSuccess: (
      state,
      action: PayloadAction<{ letters: Letter[]; pagination: LetterPagination }>
    ) => {
      state.loadingModerationQueue = false;
      state.moderationLetters = action.payload.letters;
      state.moderationTotal = action.payload.pagination.total;
    },
    getModerationQueueError: (state, action: PayloadAction<string>) => {
      state.loadingModerationQueue = false;
      state.error = action.payload;
    },

    // Get Letter Detail - Start/Success/Error
    getLetterDetailStart: (state) => {
      state.loadingSelectedLetter = true;
      state.error = null;
    },
    getLetterDetailSuccess: (state, action: PayloadAction<Letter>) => {
      state.loadingSelectedLetter = false;
      state.selectedLetter = action.payload;
    },
    getLetterDetailError: (state, action: PayloadAction<string>) => {
      state.loadingSelectedLetter = false;
      state.error = action.payload;
    },

    // Get Stats - Start/Success/Error
    getLetterStatsStart: (state) => {
      state.loadingStats = true;
      state.error = null;
    },
    getLetterStatsSuccess: (state, action: PayloadAction<LetterStats>) => {
      state.loadingStats = false;
      state.stats = action.payload;
    },
    getLetterStatsError: (state, action: PayloadAction<string>) => {
      state.loadingStats = false;
      state.error = action.payload;
    },

    // Create Letter - Start/Success/Error
    createLetterStart: (state) => {
      state.creatingLetter = true;
      state.error = null;
    },
    createLetterSuccess: (state) => {
      state.creatingLetter = false;
      state.successMessage = "Letter submitted for review!";
      state.myLettersPage = 1; // Refresh my letters
    },
    createLetterError: (state, action: PayloadAction<string>) => {
      state.creatingLetter = false;
      state.error = action.payload;
    },

    // Resubmit Letter - Start/Success/Error
    resubmitLetterStart: (state) => {
      state.resubmittingLetter = true;
      state.error = null;
    },
    resubmitLetterSuccess: (state) => {
      state.resubmittingLetter = false;
      state.successMessage = "Letter resubmitted for review!";
    },
    resubmitLetterError: (state, action: PayloadAction<string>) => {
      state.resubmittingLetter = false;
      state.error = action.payload;
    },

    // Approve Letter - Start/Success/Error
    approveLetterStart: (state) => {
      state.approvingLetter = true;
      state.error = null;
    },
    approveLetterSuccess: (state, action: PayloadAction<{ id: string }>) => {
      state.approvingLetter = false;
      state.successMessage = "Letter approved and published!";
      // Update in moderation list
      const index = state.moderationLetters.findIndex(l => l.id === action.payload.id);
      if (index !== -1) {
        state.moderationLetters[index].status = "APPROVED";
      }
    },
    approveLetterError: (state, action: PayloadAction<string>) => {
      state.approvingLetter = false;
      state.error = action.payload;
    },

    // Reject Letter - Start/Success/Error
    rejectLetterStart: (state) => {
      state.rejectingLetter = true;
      state.error = null;
    },
    rejectLetterSuccess: (state, action: PayloadAction<{ id: string }>) => {
      state.rejectingLetter = false;
      state.successMessage = "Letter rejected. Student can resubmit.";
      // Update in moderation list
      const index = state.moderationLetters.findIndex(l => l.id === action.payload.id);
      if (index !== -1) {
        state.moderationLetters[index].status = "REJECTED";
      }
    },
    rejectLetterError: (state, action: PayloadAction<string>) => {
      state.rejectingLetter = false;
      state.error = action.payload;
    },

    // Delete Letter - Start/Success/Error
    deleteLetterStart: (state) => {
      state.deletingLetter = true;
      state.error = null;
    },
    deleteLetterSuccess: (state, action: PayloadAction<{ id: string }>) => {
      state.deletingLetter = false;
      state.successMessage = "Letter deleted successfully";
      // Remove from moderation list
      state.moderationLetters = state.moderationLetters.filter(
        l => l.id !== action.payload.id
      );
    },
    deleteLetterError: (state, action: PayloadAction<string>) => {
      state.deletingLetter = false;
      state.error = action.payload;
    },

    // Toggle Like - Start/Success/Error
    toggleLikeStart: (state) => {
      state.togglingLike = true;
      state.error = null;
    },
    toggleLikeSuccess: (
      state,
      action: PayloadAction<{ id: string; isLiked: boolean; acknowledgementCount: number }>
    ) => {
      state.togglingLike = false;
      // Update in public letters
      const publicIndex = state.publicLetters.findIndex(l => l.id === action.payload.id);
      if (publicIndex !== -1) {
        state.publicLetters[publicIndex].isLiked = action.payload.isLiked;
        state.publicLetters[publicIndex].acknowledgementCount = action.payload.acknowledgementCount;
      }
      // Update in selected letter
      if (state.selectedLetter?.id === action.payload.id) {
        state.selectedLetter.isLiked = action.payload.isLiked;
        state.selectedLetter.acknowledgementCount = action.payload.acknowledgementCount;
      }
    },
    toggleLikeError: (state, action: PayloadAction<string>) => {
      state.togglingLike = false;
      state.error = action.payload;
    },
  },
});

export const {
  // Filter actions
  setPublicSearch,
  setPublicSort,
  setPublicPage,
  setMyLettersStatus,
  setMyLettersPage,
  setModerationStatus,
  setModerationSearch,
  setModerationPage,

  // Detail view
  setSelectedLetter,
  clearSelectedLetter,

  // UI state
  clearError,
  clearSuccessMessage,

  // Public Letters
  getPublicLettersStart,
  getPublicLettersSuccess,
  getPublicLettersError,

  // My Letters
  getMyLettersStart,
  getMyLettersSuccess,
  getMyLettersError,

  // Moderation
  getModerationQueueStart,
  getModerationQueueSuccess,
  getModerationQueueError,

  // Letter Detail
  getLetterDetailStart,
  getLetterDetailSuccess,
  getLetterDetailError,

  // Stats
  getLetterStatsStart,
  getLetterStatsSuccess,
  getLetterStatsError,

  // Create
  createLetterStart,
  createLetterSuccess,
  createLetterError,

  // Resubmit
  resubmitLetterStart,
  resubmitLetterSuccess,
  resubmitLetterError,

  // Approve
  approveLetterStart,
  approveLetterSuccess,
  approveLetterError,

  // Reject
  rejectLetterStart,
  rejectLetterSuccess,
  rejectLetterError,

  // Delete
  deleteLetterStart,
  deleteLetterSuccess,
  deleteLetterError,

  // Toggle Like
  toggleLikeStart,
  toggleLikeSuccess,
  toggleLikeError,
} = letterSlice.actions;

export default letterSlice.reducer;

// ============================================================================
// THUNK FUNCTIONS
// ============================================================================

/**
 * Fetch public letters (feed)
 */
export function fetchPublicLetters(params: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "recent" | "popular" | "trending";
}) {
  return async function (dispatch: Dispatch) {
    dispatch(getPublicLettersStart());
    try {
      const response = await axiosInstance.get<ApiResponse<any>>(
        LETTERS_ENDPOINTS.GET_PUBLIC_LETTERS,
        { params }
      );
      const { letters, pagination } = response.data.data;
      dispatch(
        getPublicLettersSuccess({
          letters,
          pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total: pagination.total,
            totalPages: pagination.totalPages,
            hasMore: pagination.hasMore,
          },
        })
      );
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to load letters";
      dispatch(getPublicLettersError(message));
      toast.error(message);
    }
  };
}

/**
 * Fetch user's own letters
 */
export function fetchMyLetters(params: {
  page?: number;
  limit?: number;
  status?: "all" | "PENDING" | "APPROVED" | "REJECTED";
  sortBy?: "recent" | "oldest";
}) {
  return async function (dispatch: Dispatch) {
    dispatch(getMyLettersStart());
    try {
      const response = await axiosInstance.get<ApiResponse<any>>(
        LETTERS_ENDPOINTS.GET_MY_LETTERS,
        { params }
      );
      const { letters, pagination } = response.data.data;
      dispatch(
        getMyLettersSuccess({
          letters,
          pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total: pagination.total,
            totalPages: pagination.totalPages,
            hasMore: pagination.hasMore,
          },
        })
      );
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to load your letters";
      dispatch(getMyLettersError(message));
      toast.error(message);
    }
  };
}

/**
 * Fetch moderation queue (admin only)
 */
export function fetchModerationQueue(params: {
  page?: number;
  limit?: number;
  status?: "PENDING" | "APPROVED" | "REJECTED";
}) {
  return async function (dispatch: Dispatch) {
    dispatch(getModerationQueueStart());
    try {
      const response = await axiosInstance.get<ApiResponse<any>>(
        LETTERS_ENDPOINTS.GET_MODERATION_QUEUE,
        { params }
      );
      const { letters, pagination } = response.data.data;
      dispatch(
        getModerationQueueSuccess({
          letters,
          pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total: pagination.total,
            totalPages: pagination.totalPages,
            hasMore: pagination.hasMore,
          },
        })
      );
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to load moderation queue";
      dispatch(getModerationQueueError(message));
      toast.error(message);
    }
  };
}

/**
 * Fetch single letter details
 */
export function fetchLetterDetail(letterId: string) {
  return async function (dispatch: Dispatch) {
    dispatch(getLetterDetailStart());
    try {
      const response = await axiosInstance.get<ApiResponse<Letter>>(
        LETTERS_ENDPOINTS.GET_LETTER_DETAIL(letterId)
      );
      dispatch(getLetterDetailSuccess(response.data.data));
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to load letter";
      dispatch(getLetterDetailError(message));
      toast.error(message);
    }
  };
}

/**
 * Fetch letter statistics (admin only)
 */
export function fetchLetterStats() {
  return async function (dispatch: Dispatch) {
    dispatch(getLetterStatsStart());
    try {
      const response = await axiosInstance.get<ApiResponse<LetterStats>>(
        LETTERS_ENDPOINTS.GET_LETTER_STATS
      );
      dispatch(getLetterStatsSuccess(response.data.data));
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to load statistics";
      dispatch(getLetterStatsError(message));
      toast.error(message);
    }
  };
}

/**
 * Create a new letter
 */
export function createNewLetter(payload: {
  subject: string;
  content: string;
  isAnonymous?: boolean;
  coverMediaId?: string;
}) {
  return async function (dispatch: Dispatch) {
    dispatch(createLetterStart());
    try {
      await axiosInstance.post<ApiResponse<Letter>>(
        LETTERS_ENDPOINTS.CREATE_LETTER,
        payload
      );
      dispatch(createLetterSuccess());
      // Trigger refresh of my letters
      dispatch(fetchMyLetters({ page: 1 }) as any);
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to create letter";
      dispatch(createLetterError(message));
      toast.error(message);
    }
  };
}

/**
 * Resubmit a rejected letter
 */
export function resubmitLetter(
  letterId: string,
  payload: {
    subject: string;
    content: string;
    coverMediaId?: string;
  }
) {
  return async function (dispatch: Dispatch) {
    dispatch(resubmitLetterStart());
    try {
      await axiosInstance.post<ApiResponse<Letter>>(
        LETTERS_ENDPOINTS.RESUBMIT_LETTER(letterId),
        payload
      );
      dispatch(resubmitLetterSuccess());
      // Trigger refresh of my letters
      dispatch(fetchMyLetters({ page: 1 }) as any);
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to resubmit letter";
      dispatch(resubmitLetterError(message));
      toast.error(message);
    }
  };
}

/**
 * Approve a letter (admin)
 */
export function approveLetter(letterId: string) {
  return async function (dispatch: Dispatch) {
    dispatch(approveLetterStart());
    try {
      await axiosInstance.put<ApiResponse<Letter>>(
        LETTERS_ENDPOINTS.APPROVE_LETTER(letterId)
      );
      dispatch(approveLetterSuccess({ id: letterId }));
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to approve letter";
      dispatch(approveLetterError(message));
      toast.error(message);
    }
  };
}

/**
 * Reject a letter (admin)
 */
export function rejectLetter(letterId: string, rejectionReason: string) {
  return async function (dispatch: Dispatch) {
    dispatch(rejectLetterStart());
    try {
      await axiosInstance.put<ApiResponse<Letter>>(
        LETTERS_ENDPOINTS.REJECT_LETTER(letterId),
        { rejectionReason }
      );
      dispatch(rejectLetterSuccess({ id: letterId }));
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to reject letter";
      dispatch(rejectLetterError(message));
      toast.error(message);
    }
  };
}

/**
 * Delete a letter (admin)
 */
export function deleteLetter(letterId: string) {
  return async function (dispatch: Dispatch) {
    dispatch(deleteLetterStart());
    try {
      await axiosInstance.delete<ApiResponse<any>>(
        LETTERS_ENDPOINTS.DELETE_LETTER(letterId)
      );
      dispatch(deleteLetterSuccess({ id: letterId }));
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to delete letter";
      dispatch(deleteLetterError(message));
      toast.error(message);
    }
  };
}

/**
 * Toggle like on a letter
 */
export function toggleLetterLike(letterId: string) {
  return async function (dispatch: Dispatch) {
    dispatch(toggleLikeStart());
    try {
      const response = await axiosInstance.post<ApiResponse<any>>(
        LETTERS_ENDPOINTS.TOGGLE_LIKE(letterId)
      );
      const { isLiked, acknowledgementCount } = response.data.data;
      dispatch(
        toggleLikeSuccess({
          id: letterId,
          isLiked,
          acknowledgementCount,
        })
      );
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to toggle like";
      dispatch(toggleLikeError(message));
      toast.error(message);
    }
  };
}
