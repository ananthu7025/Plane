import React from "react";
import { useAnyPermission, useAllPermissions } from "@/hooks/usePermission";

interface PermissionGateProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  permissions,
  requireAll = false,
  children,
  fallback = null,
  className,
}) => {
  const permList = permission ? [permission] : (permissions ?? []);
  const hasAny = useAnyPermission(...permList);
  const hasAll = useAllPermissions(...permList);
  let hasAccess: boolean;

  if (!permission && !permissions) {
    hasAccess = true;
  } else if (requireAll) {
    hasAccess = hasAll;
  } else {
    hasAccess = hasAny;
  }
  if (className) {
    return <div className={className}>{hasAccess ? children : fallback}</div>;
  }
  return <>{hasAccess ? children : fallback}</>;
};

export default PermissionGate;
