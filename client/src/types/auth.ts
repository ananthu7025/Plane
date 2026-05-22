import type { ApiUser } from "./api";

export interface AuthState {
  user: ApiUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  pendingVerificationEmail: string | null;
  permissions: string[]; // List of permission names user has
  roleId?: number; // Current role ID
  roleName?: string; // Current role name
}

export type UserRole = "STUDENT" | "ADMIN" | "MENTOR";
