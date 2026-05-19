import { Toaster } from "sonner";
import { useEffect } from "react";
import { useAppDispatch } from "@/hooks/redux";
import { renderRoutes } from "@/lib/routeRenderer";
import { BrowserRouter, Routes } from "react-router-dom";
import { setHydratedState } from "@/store/slices/authSlice";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import {
  authRoutes,
  studentRoutes,
  adminRoutes,
  notFoundRoute,
} from "@/lib/routeConfig";

function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(setHydratedState(true));
  }, [dispatch]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {renderRoutes(authRoutes)}
          {renderRoutes(studentRoutes)}
          {renderRoutes(adminRoutes)}
          {renderRoutes([notFoundRoute])}
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </ErrorBoundary>
  );
}

export default App;
