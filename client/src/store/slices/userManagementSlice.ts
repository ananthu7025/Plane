/* eslint-disable @typescript-eslint/no-explicit-any */
import { axiosInstance } from "@/api/client";
import { createSlice } from "@reduxjs/toolkit";
import type { Dispatch, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "sonner";
import { USER_MANAGEMENT_ENDPOINTS } from "@/lib/constants";

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
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  role?: "STUDENT" | "MENTOR" | "ADMIN";
  sort?: string;
  order?: "asc" | "desc";
}

export interface UserProfile {
  id: string;
  fullName?: string;
  email: string;
  role: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  bio?: string;
  phone?: string;
  city?: string;
  country?: string;
  avatarMediaId?: string | null;
  reputationScore?: number;
  lastLogin?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface GetAllUsersResponse {
  users: UserProfile[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
    totalPages: number;
  };
}

export interface UpdateProfilePayload {
  fullName?: string;
  bio?: string;
  phone?: string;
  city?: string;
  country?: string;
}

// State Interface
interface UserManagementState {
  users: UserProfile[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
    totalPages: number;
  };
  selectedUser: UserProfile | null;
  ownProfile: UserProfile | null;
  publicProfiles: Record<string, UserProfile>;
  filters: PaginationParams;
  loading: boolean;
  selectedUserLoading: boolean;
  ownProfileLoading: boolean;
  updating: boolean;
  error: string | null;
  selectedUserError: string | null;
  ownProfileError: string | null;
  updateError: string | null;
  successMessage: string | null;
}

const initialState: UserManagementState = {
  users: [],
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false,
    totalPages: 0,
  },
  selectedUser: null,
  ownProfile: null,
  publicProfiles: {},
  filters: {
    page: 1,
    limit: 20,
    search: "",
    status: undefined,
    role: undefined,
    sort: "createdAt",
    order: "desc",
  },
  loading: false,
  selectedUserLoading: false,
  ownProfileLoading: false,
  updating: false,
  error: null,
  selectedUserError: null,
  ownProfileError: null,
  updateError: null,
  successMessage: null,
};

// Slice
const userManagementSlice = createSlice({
  name: "userManagement",
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<PaginationParams>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = action.payload.page || 1;
    },
    clearError: (state) => {
      state.error = null;
      state.selectedUserError = null;
      state.updateError = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    clearSelectedUser: (state) => {
      state.selectedUser = null;
      state.selectedUserError = null;
    },
    // Get all users reducers
    getAllUsersStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    getAllUsersSuccess: (state, action: PayloadAction<GetAllUsersResponse>) => {
      state.loading = false;
      state.users = action.payload.users;
      state.pagination = action.payload.pagination;
    },
    getAllUsersError: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    // Get user by ID reducers
    getUserByIdStart: (state) => {
      state.selectedUserLoading = true;
      state.selectedUserError = null;
    },
    getUserByIdSuccess: (state, action: PayloadAction<UserProfile>) => {
      state.selectedUserLoading = false;
      state.selectedUser = action.payload;
    },
    getUserByIdError: (state, action: PayloadAction<string>) => {
      state.selectedUserLoading = false;
      state.selectedUserError = action.payload;
    },
    // Update user profile reducers
    updateUserProfileStart: (state) => {
      state.updating = true;
      state.updateError = null;
    },
    updateUserProfileSuccess: (state, action: PayloadAction<UserProfile>) => {
      state.updating = false;
      state.successMessage = "User profile updated successfully";
      const index = state.users.findIndex((u) => u.id === action.payload.id);
      if (index !== -1) {
        state.users[index] = action.payload;
      }
      if (state.selectedUser?.id === action.payload.id) {
        state.selectedUser = action.payload;
      }
    },
    updateUserProfileError: (state, action: PayloadAction<string>) => {
      state.updating = false;
      state.updateError = action.payload;
    },
    // Update user status reducers
    updateUserStatusStart: (state) => {
      state.updating = true;
      state.updateError = null;
    },
    updateUserStatusSuccess: (state, action: PayloadAction<UserProfile>) => {
      state.updating = false;
      state.successMessage = `User status updated to ${action.payload.status}`;
      const index = state.users.findIndex((u) => u.id === action.payload.id);
      if (index !== -1) {
        state.users[index] = action.payload;
      }
      if (state.selectedUser?.id === action.payload.id) {
        state.selectedUser = action.payload;
      }
    },
    updateUserStatusError: (state, action: PayloadAction<string>) => {
      state.updating = false;
      state.updateError = action.payload;
    },
    // Get own profile reducers
    getOwnProfileStart: (state) => {
      state.ownProfileLoading = true;
      state.ownProfileError = null;
    },
    getOwnProfileSuccess: (state, action: PayloadAction<UserProfile>) => {
      state.ownProfileLoading = false;
      state.ownProfile = action.payload;
    },
    getOwnProfileError: (state, action: PayloadAction<string>) => {
      state.ownProfileLoading = false;
      state.ownProfileError = action.payload;
    },
    // Update own profile reducers
    updateOwnProfileStart: (state) => {
      state.updating = true;
      state.updateError = null;
    },
    updateOwnProfileSuccess: (state, action: PayloadAction<UserProfile>) => {
      state.updating = false;
      state.successMessage = "Profile updated successfully";
      state.ownProfile = action.payload;
    },
    updateOwnProfileError: (state, action: PayloadAction<string>) => {
      state.updating = false;
      state.updateError = action.payload;
    },
    // Get public profile reducers
    getPublicProfileStart: (state) => {
      state.loading = true;
    },
    getPublicProfileSuccess: (
      state,
      action: PayloadAction<{ id: string; profile: UserProfile }>,
    ) => {
      state.loading = false;
      state.publicProfiles[action.payload.id] = action.payload.profile;
    },
    getPublicProfileError: (state) => {
      state.loading = false;
    },
  },
});

export const {
  setFilters,
  clearError,
  clearSuccessMessage,
  clearSelectedUser,
  getAllUsersStart,
  getAllUsersSuccess,
  getAllUsersError,
  getUserByIdStart,
  getUserByIdSuccess,
  getUserByIdError,
  updateUserProfileStart,
  updateUserProfileSuccess,
  updateUserProfileError,
  updateUserStatusStart,
  updateUserStatusSuccess,
  updateUserStatusError,
  getOwnProfileStart,
  getOwnProfileSuccess,
  getOwnProfileError,
  updateOwnProfileStart,
  updateOwnProfileSuccess,
  updateOwnProfileError,
  getPublicProfileStart,
  getPublicProfileSuccess,
  getPublicProfileError,
} = userManagementSlice.actions;

export default userManagementSlice.reducer;

// Thunk functions
export function getAllUsers(params: PaginationParams) {
  return async function (dispatch: Dispatch) {
    dispatch(getAllUsersStart());
    try {
      const response = await axiosInstance.get<ApiResponse<any>>(
        USER_MANAGEMENT_ENDPOINTS.GET_ALL_USERS,
        {
          params,
        },
      );
      const { users, pagination } = response.data.data;
      dispatch(
        getAllUsersSuccess({
          users,
          pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total: pagination.total,
            hasMore: pagination.hasMore,
            totalPages: pagination.totalPages,
          },
        }),
      );
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to fetch users";
      dispatch(getAllUsersError(message));
      toast.error(message);
    }
  };
}

export function getUserById(userId: string) {
  return async function (dispatch: Dispatch) {
    dispatch(getUserByIdStart());
    try {
      const response = await axiosInstance.get<ApiResponse<any>>(
        USER_MANAGEMENT_ENDPOINTS.GET_USER_BY_ID(userId),
      );
      const user = response.data.data;
      const flattenedUser: UserProfile = {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        fullName: user.profile?.fullName,
        phone: user.profile?.phone,
        bio: user.profile?.bio,
        city: user.profile?.city,
        country: user.profile?.country,
        avatarMediaId: user.profile?.avatarMediaId,
        reputationScore: user.profile?.reputationScore,
        lastLogin: user.lastLogin,
        createdAt: user.profile?.createdAt || user.createdAt,
        updatedAt: user.profile?.updatedAt,
      };

      dispatch(getUserByIdSuccess(flattenedUser));
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to fetch user";
      dispatch(getUserByIdError(message));
      toast.error(message);
    }
  };
}

export function updateUserProfile(userId: string, data: UpdateProfilePayload) {
  return async function (dispatch: Dispatch) {
    dispatch(updateUserProfileStart());
    try {
      const response = await axiosInstance.put<ApiResponse<any>>(
        USER_MANAGEMENT_ENDPOINTS.UPDATE_USER_PROFILE(userId),
        data,
      );
      dispatch(updateUserProfileSuccess(response.data.data));
      toast.success("User profile updated successfully");
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to update user profile";
      dispatch(updateUserProfileError(message));
      toast.error(message);
    }
  };
}

export function updateUserStatus(
  userId: string,
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED",
) {
  return async function (dispatch: Dispatch) {
    dispatch(updateUserStatusStart());
    try {
      const response = await axiosInstance.put<ApiResponse<any>>(
        USER_MANAGEMENT_ENDPOINTS.UPDATE_USER_STATUS(userId),
        { status },
      );
      dispatch(updateUserStatusSuccess(response.data.data));
      toast.success(`User status updated to ${status}`);
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to update user status";
      dispatch(updateUserStatusError(message));
      toast.error(message);
    }
  };
}

export function getOwnProfile() {
  return async function (dispatch: Dispatch) {
    dispatch(getOwnProfileStart());
    try {
      const response = await axiosInstance.get<ApiResponse<any>>(
        USER_MANAGEMENT_ENDPOINTS.GET_OWN_PROFILE,
      );

      // Flatten nested profile data from API response
      const user = response.data.data;
      const flattenedUser: UserProfile = {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        fullName: user.profile?.fullName,
        phone: user.profile?.phone,
        bio: user.profile?.bio,
        city: user.profile?.city,
        country: user.profile?.country,
        avatarMediaId: user.profile?.avatarMediaId,
        reputationScore: user.profile?.reputationScore,
        lastLogin: user.lastLogin,
        createdAt: user.profile?.createdAt || user.createdAt,
        updatedAt: user.profile?.updatedAt,
      };

      dispatch(getOwnProfileSuccess(flattenedUser));
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to fetch profile";
      dispatch(getOwnProfileError(message));
      toast.error(message);
    }
  };
}

export function updateOwnProfile(data: UpdateProfilePayload) {
  return async function (dispatch: Dispatch) {
    dispatch(updateOwnProfileStart());
    try {
      const response = await axiosInstance.put<ApiResponse<any>>(
        USER_MANAGEMENT_ENDPOINTS.UPDATE_OWN_PROFILE,
        data,
      );
      dispatch(updateOwnProfileSuccess(response.data.data));
      toast.success("Profile updated successfully");
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to update profile";
      dispatch(updateOwnProfileError(message));
      toast.error(message);
    }
  };
}

export function getPublicProfile(userId: string) {
  return async function (dispatch: Dispatch) {
    dispatch(getPublicProfileStart());
    try {
      const response = await axiosInstance.get<ApiResponse<any>>(
        USER_MANAGEMENT_ENDPOINTS.GET_PUBLIC_PROFILE(userId),
      );
      dispatch(
        getPublicProfileSuccess({
          id: userId,
          profile: response.data.data,
        }),
      );
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message ||
        "Failed to fetch public profile";
      dispatch(getPublicProfileError());
      toast.error(message);
    }
  };
}

export function deleteUser(userId: string) {
  return async function (dispatch: Dispatch) {
    dispatch(getAllUsersStart());
    try {
      await axiosInstance.delete<ApiResponse<any>>(
        USER_MANAGEMENT_ENDPOINTS.DELETE_USER(userId),
      );
      toast.success("User deleted successfully");
      // Refresh the users list
      dispatch(getAllUsers({ page: 1, limit: 20 }) as any);
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to delete user";
      dispatch(getAllUsersError(message));
      toast.error(message);
    }
  };
}
