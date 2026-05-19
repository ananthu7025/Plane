import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  errorHandler,
  normalizeError,
  ErrorCode,
  ErrorSeverity,
  type ApiError,
} from "@/lib/errorHandler";

interface UseErrorHandlerOptions {
  onError?: (error: ApiError) => void;
  autoLog?: boolean;
  autoToast?: boolean;
  autoRedirect?: boolean;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const navigate = useNavigate();
  const {
    onError,
    autoLog = true,
    autoToast = true,
    autoRedirect = true,
  } = options;

  const handleError = useCallback(
    (
      error: unknown,
      httpStatus?: number,
      context?: Record<string, unknown>,
    ): ApiError => {
      const apiError = normalizeError(error, httpStatus);

      // Log error
      if (autoLog) {
        errorHandler.log(apiError, context);
      }

      // Call custom handler if provided
      if (onError) {
        onError(apiError);
      }

      // Auto-handle based on action
      if (autoToast && apiError.action !== "redirect") {
        const toastFn =
          apiError.severity === ErrorSeverity.INFO ? toast.info : toast.error;
        toastFn(apiError.userMessage);
      }

      if (
        autoRedirect &&
        apiError.action === "redirect" &&
        apiError.redirectTo
      ) {
        setTimeout(() => navigate(apiError.redirectTo!), 1500);
      }

      return apiError;
    },
    [navigate, autoLog, autoToast, autoRedirect, onError],
  );

  const isRetryable = useCallback((error: unknown): boolean => {
    const apiError = normalizeError(error);
    return apiError.retryable;
  }, []);

  const displayError = useCallback(
    (
      apiError: ApiError,
      options?: { skipToast?: boolean; skipRedirect?: boolean },
    ) => {
      if (!options?.skipToast && apiError.action !== "redirect") {
        const toastFn =
          apiError.severity === ErrorSeverity.INFO ? toast.info : toast.error;
        toastFn(apiError.userMessage);
      }

      if (
        !options?.skipRedirect &&
        apiError.action === "redirect" &&
        apiError.redirectTo
      ) {
        navigate(apiError.redirectTo);
      }
    },
    [navigate],
  );

  const mapFieldErrors = useCallback(
    (apiError: ApiError): Record<string, string> | null => {
      return apiError.fieldErrors || null;
    },
    [],
  );

  const getErrorMessage = useCallback((code: ErrorCode): string => {
    const error = normalizeError({ error: { code } });
    return error.userMessage;
  }, []);

  return {
    handleError,
    isRetryable,
    displayError,
    mapFieldErrors,
    getErrorMessage,
    logs: errorHandler.getLogs(),
    clearLogs: errorHandler.clearLogs,
  };
}
