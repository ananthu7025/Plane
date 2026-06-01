/* eslint-disable @typescript-eslint/no-explicit-any */
import { axiosInstance } from "@/api/client";
import { createSlice } from "@reduxjs/toolkit";
import type { Dispatch, PayloadAction } from "@reduxjs/toolkit";
import { ROLES_ENDPOINTS } from "@/lib/constants";
import { refreshUserPermissions } from "./authSlice";

// Types
interface Permission {
  id: number;
  name: string;
  description?: string;
  module: string;
}

interface Role {
  id: number;
  name: string;
  description?: string;
  permissions: Permission[];
  userCount: number;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

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

// State Interface
interface RolesState {
  roles: Role[];
  permissions: Permission[];
  selectedRole: Role | null;
  loading: boolean;
  updating: boolean;
  error: string | null;
  successMessage: string | null;
  permissionsPagination: Pagination;
}

const initialState: RolesState = {
  roles: [],
  permissions: [],
  selectedRole: null,
  loading: false,
  updating: false,
  error: null,
  successMessage: null,
  permissionsPagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasMore: false,
  },
};

// Slice
const rolesSlice = createSlice({
  name: "roles",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    // Get all roles reducers
    getAllRolesStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    getAllRolesSuccess: (state, action: PayloadAction<Role[]>) => {
      state.loading = false;
      state.roles = action.payload;
    },
    getAllRolesError: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    // Get single role reducers
    getRoleByIdStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    getRoleByIdSuccess: (state, action: PayloadAction<Role>) => {
      state.loading = false;
      state.selectedRole = action.payload;
    },
    getRoleByIdError: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    // Get all permissions reducers
    getAllPermissionsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    getAllPermissionsSuccess: (
      state,
      action: PayloadAction<{
        permissions: Permission[];
        pagination: Pagination;
      }>,
    ) => {
      state.loading = false;
      state.permissions = action.payload.permissions;
      state.permissionsPagination = action.payload.pagination;
    },
    getAllPermissionsError: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    // Create permission reducers
    createPermissionStart: (state) => {
      state.updating = true;
      state.error = null;
    },
    createPermissionSuccess: (state, action: PayloadAction<Permission>) => {
      state.updating = false;
      state.successMessage = "Permission created successfully";
      state.permissions.push(action.payload);
    },
    createPermissionError: (state, action: PayloadAction<string>) => {
      state.updating = false;
      state.error = action.payload;
    },
    // Update permission reducers
    updatePermissionStart: (state) => {
      state.updating = true;
      state.error = null;
    },
    updatePermissionSuccess: (state, action: PayloadAction<Permission>) => {
      state.updating = false;
      state.successMessage = "Permission updated successfully";
      const index = state.permissions.findIndex(
        (p) => p.id === action.payload.id,
      );
      if (index !== -1) {
        state.permissions[index] = action.payload;
      }
    },
    updatePermissionError: (state, action: PayloadAction<string>) => {
      state.updating = false;
      state.error = action.payload;
    },
    // Delete permission reducers
    deletePermissionStart: (state) => {
      state.updating = true;
      state.error = null;
    },
    deletePermissionSuccess: (state, action: PayloadAction<number>) => {
      state.updating = false;
      state.successMessage = "Permission deleted successfully";
      state.permissions = state.permissions.filter(
        (p) => p.id !== action.payload,
      );
    },
    deletePermissionError: (state, action: PayloadAction<string>) => {
      state.updating = false;
      state.error = action.payload;
    },
    // Assign permission to role reducers
    assignPermissionStart: (state) => {
      state.updating = true;
      state.error = null;
    },
    assignPermissionSuccess: (state) => {
      state.updating = false;
      state.successMessage = "Permission assigned successfully";
    },
    assignPermissionError: (state, action: PayloadAction<string>) => {
      state.updating = false;
      state.error = action.payload;
    },
    // Remove permission from role reducers
    removePermissionStart: (state) => {
      state.updating = true;
      state.error = null;
    },
    removePermissionSuccess: (state) => {
      state.updating = false;
      state.successMessage = "Permission removed successfully";
    },
    removePermissionError: (state, action: PayloadAction<string>) => {
      state.updating = false;
      state.error = action.payload;
    },
    // Update user role reducers
    updateUserRoleStart: (state) => {
      state.updating = true;
      state.error = null;
    },
    updateUserRoleSuccess: (state) => {
      state.updating = false;
      state.successMessage = "User role updated successfully";
    },
    updateUserRoleError: (state, action: PayloadAction<string>) => {
      state.updating = false;
      state.error = action.payload;
    },
    // Create role reducers
    createRoleStart: (state) => {
      state.updating = true;
      state.error = null;
    },
    createRoleSuccess: (state, action: PayloadAction<Role>) => {
      state.updating = false;
      state.successMessage = "Role created successfully";
      state.roles.push(action.payload);
    },
    createRoleError: (state, action: PayloadAction<string>) => {
      state.updating = false;
      state.error = action.payload;
    },
    // Update role reducers
    updateRoleStart: (state) => {
      state.updating = true;
      state.error = null;
    },
    updateRoleSuccess: (state, action: PayloadAction<Role>) => {
      state.updating = false;
      state.successMessage = "Role updated successfully";
      const index = state.roles.findIndex((r) => r.id === action.payload.id);
      if (index !== -1) {
        state.roles[index] = action.payload;
      }
    },
    updateRoleError: (state, action: PayloadAction<string>) => {
      state.updating = false;
      state.error = action.payload;
    },
    // Delete role reducers
    deleteRoleStart: (state) => {
      state.updating = true;
      state.error = null;
    },
    deleteRoleSuccess: (state, action: PayloadAction<number>) => {
      state.updating = false;
      state.successMessage = "Role deleted successfully";
      state.roles = state.roles.filter((r) => r.id !== action.payload);
    },
    deleteRoleError: (state, action: PayloadAction<string>) => {
      state.updating = false;
      state.error = action.payload;
    },
  },
});

export const {
  clearError,
  clearSuccessMessage,
  getAllRolesStart,
  getAllRolesSuccess,
  getAllRolesError,
  getRoleByIdStart,
  getRoleByIdSuccess,
  getRoleByIdError,
  getAllPermissionsStart,
  getAllPermissionsSuccess,
  getAllPermissionsError,
  createPermissionStart,
  createPermissionSuccess,
  createPermissionError,
  updatePermissionStart,
  updatePermissionSuccess,
  updatePermissionError,
  deletePermissionStart,
  deletePermissionSuccess,
  deletePermissionError,
  assignPermissionStart,
  assignPermissionSuccess,
  assignPermissionError,
  removePermissionStart,
  removePermissionSuccess,
  removePermissionError,
  updateUserRoleStart,
  updateUserRoleSuccess,
  updateUserRoleError,
  createRoleStart,
  createRoleSuccess,
  createRoleError,
  updateRoleStart,
  updateRoleSuccess,
  updateRoleError,
  deleteRoleStart,
  deleteRoleSuccess,
  deleteRoleError,
} = rolesSlice.actions;

export default rolesSlice.reducer;

// Thunk functions

/**
 * Fetch all roles with their permissions
 */
export function getAllRoles() {
  return async function (dispatch: Dispatch) {
    dispatch(getAllRolesStart());
    try {
      const response = await axiosInstance.get<ApiResponse<Role[]>>(
        ROLES_ENDPOINTS.GET_ALL_ROLES,
      );
      dispatch(getAllRolesSuccess(response.data.data));
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to fetch roles";
      dispatch(getAllRolesError(message));
    }
  };
}

/**
 * Get a single role by ID
 */
export function getRoleById(roleId: number) {
  return async function (dispatch: Dispatch) {
    dispatch(getRoleByIdStart());
    try {
      const response = await axiosInstance.get<ApiResponse<Role>>(
        ROLES_ENDPOINTS.GET_ROLE_BY_ID(roleId),
      );
      dispatch(getRoleByIdSuccess(response.data.data));
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to fetch role";
      dispatch(getRoleByIdError(message));
    }
  };
}

/**
 * Fetch all permissions
 */
export function getAllPermissions(params?: {
  page?: number;
  limit?: number;
  search?: string;
  module?: string;
}) {
  return async function (dispatch: Dispatch) {
    dispatch(getAllPermissionsStart());
    try {
      const response = await axiosInstance.get<
        ApiResponse<{
          permissions: Permission[];
          pagination: Pagination;
        }>
      >(ROLES_ENDPOINTS.GET_ALL_PERMISSIONS, {
        params: params || { page: 1, limit: 20 },
      });
      dispatch(getAllPermissionsSuccess(response.data.data));
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to fetch permissions";
      dispatch(getAllPermissionsError(message));
    }
  };
}

/**
 * Create a new permission
 */
export function createPermission(data: {
  name: string;
  description?: string;
  module: string;
}) {
  return async function (dispatch: Dispatch) {
    dispatch(createPermissionStart());
    try {
      const response = await axiosInstance.post<ApiResponse<Permission>>(
        ROLES_ENDPOINTS.CREATE_PERMISSION,
        data,
      );
      dispatch(createPermissionSuccess(response.data.data));
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to create permission";
      dispatch(createPermissionError(message));
    }
  };
}

/**
 * Update a permission
 */
export function updatePermission(
  permissionId: number,
  data: {
    name?: string;
    description?: string;
    module?: string;
  },
) {
  return async function (dispatch: Dispatch) {
    dispatch(updatePermissionStart());
    try {
      const response = await axiosInstance.put<ApiResponse<Permission>>(
        ROLES_ENDPOINTS.UPDATE_PERMISSION(permissionId),
        data,
      );
      dispatch(updatePermissionSuccess(response.data.data));
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to update permission";
      dispatch(updatePermissionError(message));
    }
  };
}

/**
 * Delete a permission
 */
export function deletePermission(permissionId: number) {
  return async function (dispatch: Dispatch) {
    dispatch(deletePermissionStart());
    try {
      await axiosInstance.delete(
        ROLES_ENDPOINTS.DELETE_PERMISSION(permissionId),
      );
      dispatch(deletePermissionSuccess(permissionId));
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to delete permission";
      dispatch(deletePermissionError(message));
    }
  };
}

/**
 * Assign permission to role
 */
export function assignPermissionToRole(roleId: number, permissionId: number) {
  return async function (dispatch: Dispatch) {
    dispatch(assignPermissionStart());
    try {
      await axiosInstance.post(ROLES_ENDPOINTS.ASSIGN_PERMISSION(roleId), {
        permissionId,
      });
      dispatch(assignPermissionSuccess());
      // Refresh the role to get updated permissions
      dispatch(getRoleById(roleId) as any);
      // Refresh user's token to get updated permissions immediately
      dispatch(refreshUserPermissions() as any);
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to assign permission";
      dispatch(assignPermissionError(message));
    }
  };
}

/**
 * Remove permission from role
 */
export function removePermissionFromRole(roleId: number, permissionId: number) {
  return async function (dispatch: Dispatch) {
    dispatch(removePermissionStart());
    try {
      await axiosInstance.delete(
        ROLES_ENDPOINTS.REMOVE_PERMISSION(roleId, permissionId),
      );
      dispatch(removePermissionSuccess());
      // Refresh the role to get updated permissions
      dispatch(getRoleById(roleId) as any);
      // Refresh user's token to get updated permissions immediately
      dispatch(refreshUserPermissions() as any);
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to remove permission";
      dispatch(removePermissionError(message));
    }
  };
}

/**
 * Update user's role
 */
export function updateUserRole(
  userId: string,
  role: "STUDENT" | "MENTOR" | "ADMIN",
) {
  return async function (dispatch: Dispatch) {
    dispatch(updateUserRoleStart());
    try {
      await axiosInstance.put(
        USER_MANAGEMENT_ENDPOINTS.UPDATE_USER_ROLE(userId),
        { role },
      );
      dispatch(updateUserRoleSuccess());
      // Refresh all roles to get updated user counts
      dispatch(getAllRoles() as any);
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to update user role";
      dispatch(updateUserRoleError(message));
    }
  };
}

/**
 * Create a new role
 */
export function createRole(data: { name: string; description?: string }) {
  return async function (dispatch: Dispatch) {
    dispatch(createRoleStart());
    try {
      const response = await axiosInstance.post<ApiResponse<Role>>(
        ROLES_ENDPOINTS.CREATE_ROLE,
        data,
      );
      dispatch(createRoleSuccess(response.data.data));
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to create role";
      dispatch(createRoleError(message));
    }
  };
}

/**
 * Update an existing role
 */
export function updateRole(
  roleId: number,
  data: { name?: string; description?: string },
) {
  return async function (dispatch: Dispatch) {
    dispatch(updateRoleStart());
    try {
      const response = await axiosInstance.put<ApiResponse<Role>>(
        ROLES_ENDPOINTS.UPDATE_ROLE(roleId),
        data,
      );
      dispatch(updateRoleSuccess(response.data.data));
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to update role";
      dispatch(updateRoleError(message));
    }
  };
}

/**
 * Delete a role
 */
export function deleteRole(roleId: number) {
  return async function (dispatch: Dispatch) {
    dispatch(deleteRoleStart());
    try {
      await axiosInstance.delete(ROLES_ENDPOINTS.DELETE_ROLE(roleId));
      dispatch(deleteRoleSuccess(roleId));
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to delete role";
      dispatch(deleteRoleError(message));
    }
  };
}

// Re-export USER_MANAGEMENT_ENDPOINTS for updateUserRole
import { USER_MANAGEMENT_ENDPOINTS } from "@/lib/constants";
