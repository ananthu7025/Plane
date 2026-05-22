import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import type { Permission } from "@/lib/permissions";

export function usePermission(
  requiredPermission: string | Permission,
): boolean {
  const permissions = useSelector((state: RootState) => state.auth.permissions);
  return permissions.includes(requiredPermission);
}

export function useAnyPermission(
  ...permissions: Array<string | Permission>
): boolean {
  const userPermissions = useSelector(
    (state: RootState) => state.auth.permissions,
  );
  return permissions.some((perm) => userPermissions.includes(perm));
}

export function useAllPermissions(
  ...permissions: Array<string | Permission>
): boolean {
  const userPermissions = useSelector(
    (state: RootState) => state.auth.permissions,
  );
  return permissions.every((perm) => userPermissions.includes(perm));
}

export function useUserPermissions(): string[] {
  return useSelector((state: RootState) => state.auth.permissions);
}

export function useUserRole(): {
  roleId?: number;
  roleName?: string;
} {
  return useSelector((state: RootState) => ({
    roleId: state.auth.roleId,
    roleName: state.auth.roleName,
  }));
}

export function useIsAuthenticated(): boolean {
  return useSelector((state: RootState) => state.auth.isAuthenticated);
}

export function useCurrentUser() {
  return useSelector((state: RootState) => state.auth.user);
}
