import { Route } from "react-router-dom";
import type { RouteConfig } from "./routeConfig";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AuthOnlyRoute } from "@/components/common/AuthOnlyRoute";

export function renderRoutes(routes: RouteConfig[]) {
  return routes.map((route) => {
    const element = route.protected ? (
      <ProtectedRoute
        element={route.element}
        requiredRole={route.requiredRole || "STUDENT"}
      />
    ) : route.authOnly ? (
      <AuthOnlyRoute element={route.element} />
    ) : (
      route.element
    );

    if (route.children && route.children.length > 0) {
      return (
        <Route key={route.path} path={route.path} element={element}>
          {renderRoutes(route.children)}
        </Route>
      );
    }

    return <Route key={route.path} path={route.path} element={element} />;
  });
}
