import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { ROUTES } from "@/lib/constants";

interface AuthOnlyRouteProps {
  element: React.ReactNode;
}

export function AuthOnlyRoute({ element }: AuthOnlyRouteProps) {
  const { isAuthenticated, isHydrated, user } = useAuth();

  if (!isHydrated) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        role="status"
        aria-live="polite"
        aria-label="Loading auth route"
      >
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    const redirectPath =
      user?.role === "ADMIN" ? ROUTES.ADMIN_DASHBOARD : ROUTES.STUDENT_DASHBOARD;
    return <Navigate to={redirectPath} replace />;
  }

  return <>{element}</>;
}
