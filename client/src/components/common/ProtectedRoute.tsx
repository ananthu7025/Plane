import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import type { UserRole } from "@/types/auth";

interface ProtectedRouteProps {
  element: React.ReactNode;
  requiredRole?: UserRole;
}

export function ProtectedRoute({ element, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isHydrated, user } = useAuth();
  if (!isHydrated) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        role="status"
        aria-live="polite"
        aria-label="Loading protected route"
      >
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }
  return <>{element}</>;
}
