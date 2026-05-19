import type { ApiUser } from "./api";

export interface AuthState {
  user: ApiUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  pendingVerificationEmail: string | null;
}

export type UserRole = "STUDENT" | "ADMIN" | "MENTOR";
