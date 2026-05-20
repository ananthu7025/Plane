/* eslint-disable @typescript-eslint/no-explicit-any */
import { axiosInstance } from "@/api/client";
import { createSlice } from "@reduxjs/toolkit";
import type { Dispatch, PayloadAction } from "@reduxjs/toolkit";
import { AUTH_ENDPOINTS } from "@/lib/constants";
import type { AuthState } from "@/types/auth";
import type { ApiUser, SignInData, SignInRequest, SignUpRequest } from "@/types/api";

// API Response wrapper type
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: { code: string; message: string; details?: Record<string, unknown> } | null;
  timestamp: string;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isHydrated: false,
  pendingVerificationEmail: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /**
     * Set credentials after successful sign in
     */
    setCredentials: (
      state,
      action: PayloadAction<{
        user: ApiUser;
        accessToken: string;
        refreshToken: string;
      }>,
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
    },

    /**
     * Update tokens (used during refresh)
     */
    updateTokens: (
      state,
      action: PayloadAction<{
        accessToken: string;
        refreshToken: string;
      }>,
    ) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },

    /**
     * Clear all auth state (logout)
     */
    clearCredentials: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
    },

    /**
     * Mark state as hydrated (after rehydration from localStorage)
     */
    setHydrated: (state) => {
      state.isHydrated = true;
    },

    /**
     * Set hydrated status
     */
    setHydratedState: (state, action: PayloadAction<boolean>) => {
      state.isHydrated = action.payload;
    },

    /**
     * Store email pending verification (secure alternative to URL params)
     */
    setPendingVerificationEmail: (
      state,
      action: PayloadAction<string | null>,
    ) => {
      state.pendingVerificationEmail = action.payload;
    },
  },
});

export const {
  setCredentials,
  updateTokens,
  clearCredentials,
  setHydrated,
  setHydratedState,
  setPendingVerificationEmail,
} = authSlice.actions;

export default authSlice.reducer;

// Thunk functions

/**
 * Sign in user
 */
export function signIn(credentials: SignInRequest) {
  return async function (dispatch: Dispatch) {
    try {
      const response = await axiosInstance.post<ApiResponse<SignInData>>(
        AUTH_ENDPOINTS.SIGNIN,
        credentials,
      );
      const data = response.data.data;
      dispatch(
        setCredentials({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        }),
      );
      return data;
    } catch (error: any) {
      // Store email if verification needed
      if (error.response?.data?.error?.code === "UNAUTHORIZED" &&
          error.response?.data?.error?.message?.includes("verify your email")) {
        dispatch(setPendingVerificationEmail(credentials.email));
      }
      throw error;
    }
  };
}

/**
 * Sign up user
 */
export function signUp(data: SignUpRequest) {
  return async function () {
    const response = await axiosInstance.post<ApiResponse<any>>(
      AUTH_ENDPOINTS.SIGNUP,
      data,
    );
    return response.data.data;
  };
}

/**
 * Sign out user
 */
export function signOut(refreshToken: string) {
  return async function (dispatch: Dispatch) {
    try {
      await axiosInstance.post(AUTH_ENDPOINTS.SIGNOUT, { refreshToken });
    } finally {
      // Always clear credentials (whether API succeeds or fails)
      dispatch(clearCredentials());
    }
  };
}

/**
 * Verify email with OTP
 */
export function verifyEmail(payload: { email: string; otp: string }) {
  return async function () {
    const response = await axiosInstance.post<ApiResponse<any>>(
      AUTH_ENDPOINTS.VERIFY_EMAIL,
      payload,
    );
    return response.data.data;
  };
}

/**
 * Resend OTP
 */
export function resendOtp(payload: { email: string }) {
  return async function () {
    const response = await axiosInstance.post<ApiResponse<any>>(
      AUTH_ENDPOINTS.RESEND_OTP,
      payload,
    );
    return response.data.data;
  };
}

/**
 * Forgot password
 */
export function forgotPassword(payload: { email: string }) {
  return async function () {
    const response = await axiosInstance.post<ApiResponse<any>>(
      AUTH_ENDPOINTS.FORGOT_PASSWORD,
      payload,
    );
    return response.data.data;
  };
}

/**
 * Reset password
 */
export function resetPassword(payload: {
  email: string;
  token: string;
  newPassword: string;
}) {
  return async function (dispatch: Dispatch) {
    const response = await axiosInstance.post<ApiResponse<any>>(
      AUTH_ENDPOINTS.RESET_PASSWORD,
      payload,
    );
    // Clear all auth tokens after successful password reset
    // Backend revokes all refresh tokens for security, so force user to re-login
    dispatch(clearCredentials());
    return response.data.data;
  };
}
