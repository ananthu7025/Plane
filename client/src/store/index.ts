import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import authReducer from "./slices/authSlice";
import userManagementReducer from "./slices/userManagementSlice";
import rolesReducer from "./slices/rolesSlice";
import communityReducer from "./slices/communitySlice";
import letterReducer from "./slices/letterSlice";
import { setStore as setAxiosStore } from "@/api/client";

/**
 * Storage implementation that safely handles localStorage
 */
const createStorage = () => {
  if (typeof window === "undefined") {
    // Server-side fallback
    return {
      getItem: () => Promise.resolve(null),
      setItem: () => Promise.resolve(),
      removeItem: () => Promise.resolve(),
    };
  }

  // Client-side - use actual localStorage
  return {
    getItem: (key: string) => {
      try {
        const item = window.localStorage.getItem(key);
        return Promise.resolve(item);
      } catch {
        return Promise.resolve(null);
      }
    },
    setItem: (key: string, item: string) => {
      try {
        window.localStorage.setItem(key, item);
        return Promise.resolve();
      } catch {
        return Promise.resolve();
      }
    },
    removeItem: (key: string) => {
      try {
        window.localStorage.removeItem(key);
        return Promise.resolve();
      } catch {
        return Promise.resolve();
      }
    },
  };
};

/**
 * Redux-persist configuration
 */
const persistConfig = {
  key: "auth",
  storage: createStorage(),
  throttle: 1000, // Write to localStorage at most once per second
};

/**
 * Create persisted reducer
 */
const persistedAuthReducer = persistReducer(persistConfig, authReducer);

/**
 * Configure Redux store
 */
export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    userManagement: userManagementReducer,
    roles: rolesReducer,
    community: communityReducer,
    letters: letterReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
        ignoredActionPaths: ["meta.arg", "payload.timestamp"],
        ignoredPaths: ["auth.isHydrated"],
      },
    }),
});

/**
 * Setup axios to use store for token refresh
 */
setAxiosStore(store);

/**
 * Create persistor
 */
export const persistor = persistStore(store);

// Log rehydration status
persistor.subscribe(() => {
  const authState = store.getState().auth;
  console.log("[PERSIST] Auth state after rehydration:", {
    isAuthenticated: authState.isAuthenticated,
    hasAccessToken: !!authState.accessToken,
    hasRefreshToken: !!authState.refreshToken,
    user: authState.user?.email,
  });
});

/**
 * Export types
 */
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
