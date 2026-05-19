import axios from "axios";
import { API_BASE_URL, HTTP_STATUS } from "@/lib/constants";
import { clearCredentials, updateTokens } from "@/store/slices/authSlice";
import type {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

// Types for store and queue
interface StoreWithGetState {
  getState: () => {
    auth: { accessToken: string | null; refreshToken: string | null };
  };
  dispatch: (action: unknown) => unknown;
}

interface QueueItem {
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}

// Store reference to prevent circular imports
let store: StoreWithGetState | null = null;

export function setStore(s: StoreWithGetState) {
  store = s;
  console.log("[AUTH] Axios client store initialized");
}

// Queue for pending requests during token refresh
let isRefreshing = false;
let refreshTimeout: ReturnType<typeof setTimeout> | null = null;
let failedQueue: QueueItem[] = [];
const REFRESH_TIMEOUT_MS = 10000;

const clearRefreshTimeout = () => {
  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
    refreshTimeout = null;
  }
};

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });

  isRefreshing = false;
  failedQueue = [];
  clearRefreshTimeout();
};

/**
 * Create Axios instance with base configuration
 */
const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      try {
        // Get access token from Redux state
        if (store) {
          const state = store.getState();
          const { accessToken } = state.auth || {};

          if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
            console.log(`[AUTH] Request to ${config.url} with access token`);
          } else {
            console.log(`[AUTH] Request to ${config.url} WITHOUT access token`);
          }
        } else {
          console.warn("[AUTH] Store not initialized!");
        }
        const csrfToken = document
          .querySelector('meta[name="csrf-token"]')
          ?.getAttribute("content");
        if (csrfToken) {
          config.headers["X-CSRF-Token"] = csrfToken;
        }
      } catch (error) {
        console.log(error);
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };
      if (
        error.response?.status === HTTP_STATUS.UNAUTHORIZED &&
        !originalRequest._retry
      ) {
        console.log("[AUTH] 401 Error detected, attempting token refresh...", {
          url: originalRequest.url,
          isRefreshing,
        });

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({
              resolve: (token: string) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(instance(originalRequest));
              },
              reject: (err: Error) => {
                reject(err);
              },
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;
        refreshTimeout = setTimeout(() => {
          processQueue(new Error("Token refresh timeout"), null);
          // Force logout due to timeout
          if (store) {
            store.dispatch(clearCredentials());
          }
        }, REFRESH_TIMEOUT_MS);

        try {
          if (!store) {
            throw new Error("Store not initialized");
          }

          const state = store.getState();
          const { refreshToken } = state.auth || {};

          if (!refreshToken) {
            // No refresh token, force logout via dispatch
            clearRefreshTimeout();
            processQueue(new Error("No refresh token available"), null);
            store.dispatch(clearCredentials());
            return Promise.reject(error);
          }
          console.log("[AUTH] Calling /api/auth/refresh with refreshToken...");
          const response = await instance.post("/api/auth/refresh", {
            refreshToken,
          });

          console.log("[AUTH] Refresh endpoint response:", response.data);

          if (response.data.success && response.data.data) {
            const {
              accessToken: newAccessToken,
              refreshToken: newRefreshToken,
            } = response.data.data;

            console.log(
              "[AUTH] Token refresh successful, updating Redux store...",
            );
            store.dispatch(
              updateTokens({
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
              }),
            );
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            processQueue(null, newAccessToken);
            console.log("[AUTH] Retrying original request with new token...");
            return instance(originalRequest);
          } else {
            throw new Error("Failed to refresh token");
          }
        } catch (refreshError) {
          // Refresh failed, force logout via dispatch
          console.error("[AUTH] Token refresh failed:", refreshError);
          const err =
            refreshError instanceof Error
              ? refreshError
              : new Error("Token refresh failed");
          processQueue(err, null);
          if (store) {
            store.dispatch(clearCredentials());
          }
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    },
  );

  return instance;
};

export const axiosInstance = createAxiosInstance();

export default axiosInstance;
