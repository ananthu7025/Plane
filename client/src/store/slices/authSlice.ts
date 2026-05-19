/* eslint-disable @typescript-eslint/no-explicit-any */
import { axiosInstance } from "@/api/client";
import { createSlice } from "@reduxjs/toolkit";
import type { Dispatch, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "sonner";
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
      toast.success("Signed in successfully");
      return data;
    } catch (error: any) {
      const message = error.response?.data?.error?.message || "Login failed";
      toast.error(message);
      throw error;
    }
  };
}

/**
 * Sign up user
 */
export function signUp(data: SignUpRequest) {
  return async function () {
    try {
      const response = await axiosInstance.post<ApiResponse<any>>(
        AUTH_ENDPOINTS.SIGNUP,
        data,
      );
      toast.success("Account created. Please verify your email.");
      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.error?.message || "Signup failed";
      toast.error(message);
      throw error;
    }
  };
}

/**
 * Sign out user
 */
export function signOut(refreshToken: string) {
  return async function (dispatch: Dispatch) {
    try {
      await axiosInstance.post(AUTH_ENDPOINTS.SIGNOUT, { refreshToken });
      dispatch(clearCredentials());
      toast.success("Signed out successfully");
    } catch (error: any) {
      const message = error.response?.data?.error?.message || "Logout failed";
      toast.error(message);
      // Still clear credentials even if API call fails
      dispatch(clearCredentials());
      throw error;
    }
  };
}

/**
 * Verify email with OTP
 */
export function verifyEmail(payload: { email: string; otp: string }) {
  return async function () {
    try {
      const response = await axiosInstance.post<ApiResponse<any>>(
        AUTH_ENDPOINTS.VERIFY_EMAIL,
        payload,
      );
      toast.success("Email verified successfully");
      return response.data.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Email verification failed";
      toast.error(message);
      throw error;
    }
  };
}

/**
 * Resend OTP
 */
export function resendOtp(payload: { email: string }) {
  return async function () {
    try {
      const response = await axiosInstance.post<ApiResponse<any>>(
        AUTH_ENDPOINTS.RESEND_OTP,
        payload,
      );
      toast.success("OTP resent to your email");
      return response.data.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Resend OTP failed";
      toast.error(message);
      throw error;
    }
  };
}

/**
 * Forgot password
 */
export function forgotPassword(payload: { email: string }) {
  return async function () {
    try {
      const response = await axiosInstance.post<ApiResponse<any>>(
        AUTH_ENDPOINTS.FORGOT_PASSWORD,
        payload,
      );
      toast.success("Password reset link sent to your email");
      return response.data.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message ||
        "Forgot password request failed";
      toast.error(message);
      throw error;
    }
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
    try {
      const response = await axiosInstance.post<ApiResponse<any>>(
        AUTH_ENDPOINTS.RESET_PASSWORD,
        payload,
      );
      toast.success("Password reset successfully. Please log in with your new password.");
      // Clear all auth tokens after successful password reset
      // Backend revokes all refresh tokens for security, so force user to re-login
      dispatch(clearCredentials());
      return response.data.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Password reset failed";
      toast.error(message);
      throw error;
    }
  };
}
