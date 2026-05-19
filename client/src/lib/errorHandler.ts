export const ErrorCode = {
  // Auth Errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  ACCOUNT_INACTIVE: 'ACCOUNT_INACTIVE',
  // Email Verification Errors
  OTP_INVALID: 'OTP_INVALID',
  OTP_EXPIRED: 'OTP_EXPIRED',
  EMAIL_ALREADY_VERIFIED: 'EMAIL_ALREADY_VERIFIED',
  // Password Reset Errors
  RESET_TOKEN_INVALID: 'RESET_TOKEN_INVALID',
  RESET_TOKEN_EXPIRED: 'RESET_TOKEN_EXPIRED',
  RESET_TOKEN_USED: 'RESET_TOKEN_USED',
  // Registration Errors
  EMAIL_EXISTS: 'EMAIL_EXISTS',
  // Validation Errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  // User Errors
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  // Token Errors
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  // Network Errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',
  // Server Errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  // Unknown Error
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ErrorCode = typeof ErrorCode[keyof typeof ErrorCode];

export const ErrorSeverity = {
  INFO: 'INFO',           // User info (email verified)
  WARNING: 'WARNING',     // Non-critical (rate limit soon)
  ERROR: 'ERROR',         // Critical (invalid token)
  FATAL: 'FATAL',         // System-breaking (server down)
} as const;

export type ErrorSeverity = typeof ErrorSeverity[keyof typeof ErrorSeverity];

export interface ApiError {
  code: ErrorCode;
  message: string;
  severity: ErrorSeverity;
  userMessage: string;    // User-friendly message
  details?: unknown;
  retryable: boolean;
  retryAfterMs?: number;
  action?: 'redirect' | 'refresh' | 'retry' | 'none';
  redirectTo?: string;
  fieldErrors?: Record<string, string>;
}

// ============================================================================
// ERROR MAPPING
// ============================================================================

const HTTP_TO_ERROR_CODE: Record<number, ErrorCode> = {
  400: ErrorCode.VALIDATION_ERROR,
  401: ErrorCode.INVALID_TOKEN,
  403: ErrorCode.ACCOUNT_SUSPENDED,
  404: ErrorCode.USER_NOT_FOUND,
  409: ErrorCode.EMAIL_EXISTS,
  429: ErrorCode.RATE_LIMIT_EXCEEDED,
  500: ErrorCode.INTERNAL_ERROR,
  503: ErrorCode.SERVICE_UNAVAILABLE,
  0: ErrorCode.NETWORK_ERROR,
};

const ERROR_CODE_CONFIG: Record<ErrorCode, {
  severity: ErrorSeverity;
  userMessage: string;
  retryable: boolean;
  action?: 'redirect' | 'refresh' | 'retry' | 'none';
  redirectTo?: string;
}> = {
  // Auth Errors
  [ErrorCode.INVALID_CREDENTIALS]: {
    severity: ErrorSeverity.WARNING,
    userMessage: 'Incorrect email or password. Please try again.',
    retryable: true,
    action: 'none',
  },
  [ErrorCode.EMAIL_NOT_VERIFIED]: {
    severity: ErrorSeverity.ERROR,
    userMessage: 'Please verify your email before signing in.',
    retryable: false,
    action: 'redirect',
    redirectTo: '/verify-email',
  },
  [ErrorCode.ACCOUNT_SUSPENDED]: {
    severity: ErrorSeverity.ERROR,
    userMessage: 'Your account has been suspended. Please contact support.',
    retryable: false,
    action: 'none',
  },
  [ErrorCode.ACCOUNT_INACTIVE]: {
    severity: ErrorSeverity.ERROR,
    userMessage: 'Your account is inactive. Please contact support to reactivate.',
    retryable: false,
    action: 'none',
  },
  // Email Verification Errors
  [ErrorCode.OTP_INVALID]: {
    severity: ErrorSeverity.WARNING,
    userMessage: 'Incorrect OTP. Please check and try again.',
    retryable: true,
    action: 'none',
  },
  [ErrorCode.OTP_EXPIRED]: {
    severity: ErrorSeverity.ERROR,
    userMessage: 'The OTP has expired. Please request a new one.',
    retryable: false,
    action: 'none',
  },
  [ErrorCode.EMAIL_ALREADY_VERIFIED]: {
    severity: ErrorSeverity.INFO,
    userMessage: 'Your email is already verified. Redirecting to login...',
    retryable: false,
    action: 'redirect',
    redirectTo: '/login',
  },
  // Password Reset Errors
  [ErrorCode.RESET_TOKEN_INVALID]: {
    severity: ErrorSeverity.ERROR,
    userMessage: 'Invalid reset link. Please request a new one.',
    retryable: false,
    action: 'redirect',
    redirectTo: '/forgot-password',
  },
  [ErrorCode.RESET_TOKEN_EXPIRED]: {
    severity: ErrorSeverity.ERROR,
    userMessage: 'The reset link has expired. Please request a new one.',
    retryable: false,
    action: 'redirect',
    redirectTo: '/forgot-password',
  },
  [ErrorCode.RESET_TOKEN_USED]: {
    severity: ErrorSeverity.ERROR,
    userMessage: 'This reset link has already been used. Please request a new one.',
    retryable: false,
    action: 'redirect',
    redirectTo: '/forgot-password',
  },
  // Registration Errors
  [ErrorCode.EMAIL_EXISTS]: {
    severity: ErrorSeverity.WARNING,
    userMessage: 'This email is already registered. Please sign in instead.',
    retryable: false,
    action: 'none',
  },
  // Validation Errors
  [ErrorCode.VALIDATION_ERROR]: {
    severity: ErrorSeverity.WARNING,
    userMessage: 'Please check the highlighted fields.',
    retryable: false,
    action: 'none',
  },
  // User Errors
  [ErrorCode.USER_NOT_FOUND]: {
    severity: ErrorSeverity.ERROR,
    userMessage: 'Email not found. Please check or sign up.',
    retryable: false,
    action: 'none',
  },
  // Rate Limiting
  [ErrorCode.RATE_LIMIT_EXCEEDED]: {
    severity: ErrorSeverity.WARNING,
    userMessage: 'Too many attempts. Please try again later.',
    retryable: true,
    action: 'none',
  },
  // Token Errors
  [ErrorCode.INVALID_TOKEN]: {
    severity: ErrorSeverity.ERROR,
    userMessage: 'Session expired. Please sign in again.',
    retryable: false,
    action: 'redirect',
    redirectTo: '/login',
  },
  [ErrorCode.TOKEN_EXPIRED]: {
    severity: ErrorSeverity.ERROR,
    userMessage: 'Session expired. Please sign in again.',
    retryable: false,
    action: 'redirect',
    redirectTo: '/login',
  },
  // Network Errors
  [ErrorCode.NETWORK_ERROR]: {
    severity: ErrorSeverity.ERROR,
    userMessage: 'No internet connection. Please check and try again.',
    retryable: true,
    action: 'retry',
  },
  [ErrorCode.REQUEST_TIMEOUT]: {
    severity: ErrorSeverity.ERROR,
    userMessage: 'Request timed out. Please try again.',
    retryable: true,
    action: 'retry',
  },
  // Server Errors
  [ErrorCode.INTERNAL_ERROR]: {
    severity: ErrorSeverity.FATAL,
    userMessage: 'Something went wrong. Please try again or contact support.',
    retryable: true,
    action: 'retry',
  },
  [ErrorCode.SERVICE_UNAVAILABLE]: {
    severity: ErrorSeverity.FATAL,
    userMessage: 'Service temporarily unavailable. Please try again later.',
    retryable: true,
    action: 'retry',
  },
  // Unknown Error
  [ErrorCode.UNKNOWN_ERROR]: {
    severity: ErrorSeverity.ERROR,
    userMessage: 'An unexpected error occurred. Please try again.',
    retryable: true,
    action: 'none',
  },
};

// ============================================================================
// ERROR DETECTION & MAPPING
// ============================================================================

/**
 * Detect error code from backend response
 */
export function detectErrorCode(error: unknown, httpStatus?: number): ErrorCode {
  try {
    if (!error || typeof error !== 'object') {
      return httpStatus && httpStatus in HTTP_TO_ERROR_CODE
        ? HTTP_TO_ERROR_CODE[httpStatus]
        : ErrorCode.UNKNOWN_ERROR;
    }

    const errorObj = error as Record<string, unknown>;

    // Extract error code from API response: error.error.code
    if ('error' in errorObj && errorObj.error && typeof errorObj.error === 'object') {
      const apiError = errorObj.error as Record<string, unknown>;
      if ('code' in apiError && typeof apiError.code === 'string') {
        const code = apiError.code as string;
        // Verify it's a valid ErrorCode
        if (Object.values(ErrorCode).includes(code as ErrorCode)) {
          return code as ErrorCode;
        }
      }
    }

    // Fallback to HTTP status code mapping
    if (httpStatus && httpStatus in HTTP_TO_ERROR_CODE) {
      return HTTP_TO_ERROR_CODE[httpStatus];
    }

    return ErrorCode.UNKNOWN_ERROR;
  } catch {
    return ErrorCode.UNKNOWN_ERROR;
  }
}

/**
 * Convert error to standardized ApiError
 */
export function normalizeError(error: unknown, httpStatus?: number): ApiError {
  const errorCode = detectErrorCode(error, httpStatus);
  const config = ERROR_CODE_CONFIG[errorCode];

  // Extract backend message
  let backendMessage = '';
  try {
    if (error && typeof error === 'object') {
      const errorObj = error as Record<string, unknown>;
      if ('error' in errorObj && errorObj.error && typeof errorObj.error === 'object') {
        const apiError = errorObj.error as Record<string, unknown>;
        if ('message' in apiError && typeof apiError.message === 'string') {
          backendMessage = apiError.message;
        }
      }
    }
  } catch {
    // Continue with default message
  }

  // Extract field errors
  let fieldErrors: Record<string, string> | undefined;
  try {
    if (error && typeof error === 'object') {
      const errorObj = error as Record<string, unknown>;
      if ('error' in errorObj && errorObj.error && typeof errorObj.error === 'object') {
        const apiError = errorObj.error as Record<string, unknown>;
        if ('details' in apiError && apiError.details && typeof apiError.details === 'object') {
          fieldErrors = apiError.details as Record<string, string>;
        }
      }
    }
  } catch {
    // Continue without field errors
  }

  // Extract retry info
  let retryAfterMs: number | undefined;
  try {
    if (error && typeof error === 'object') {
      const errorObj = error as Record<string, unknown>;
      if ('retryAfter' in errorObj && typeof errorObj.retryAfter === 'number') {
        retryAfterMs = errorObj.retryAfter * 1000; // Convert seconds to ms
      }
    }
  } catch {
    // Continue without retry info
  }

  return {
    code: errorCode,
    message: backendMessage || config.userMessage,
    severity: config.severity,
    userMessage: config.userMessage,
    details: error,
    retryable: config.retryable,
    retryAfterMs,
    action: config.action,
    redirectTo: config.redirectTo,
    fieldErrors,
  };
}

// ============================================================================
// ERROR LOGGING & TRACKING
// ============================================================================

export interface ErrorLog {
  code: ErrorCode;
  severity: ErrorSeverity;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  url?: string;
  userAgent?: string;
}

class ErrorLogger {
  private logs: ErrorLog[] = [];
  private maxLogs = 50;

  log(error: ApiError, context?: Record<string, unknown>): void {
    const logEntry: ErrorLog = {
      code: error.code,
      severity: error.severity,
      message: error.message,
      timestamp: new Date().toISOString(),
      context,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };

    this.logs.push(logEntry);

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log to console in development
    if (typeof import.meta !== 'undefined' && import.meta.env.DEV) {
      console.error(`[${error.code}] ${error.message}`, { context, error });
    }

    // TODO: Send to Sentry in production
    // if (import.meta.env.PROD && window.Sentry) {
    //   Sentry.captureException(error, { level: severityToLevel(error.severity) });
    // }
  }

  getLogs(): ErrorLog[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }
}

export const errorLogger = new ErrorLogger();

// ============================================================================
// RETRY LOGIC
// ============================================================================

export interface RetryConfig {
  maxAttempts: number;
  backoffMs: number;
  backoffMultiplier: number;
  maxBackoffMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  backoffMs: 100,
  backoffMultiplier: 2,
  maxBackoffMs: 10000,
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: unknown;
  let backoffMs = finalConfig.backoffMs;

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      const apiError = normalizeError(error);
      if (!apiError.retryable || attempt === finalConfig.maxAttempts) {
        throw error;
      }

      // Use server's retry-after if available
      const waitMs = apiError.retryAfterMs || backoffMs;
      await new Promise(resolve => setTimeout(resolve, waitMs));

      // Exponential backoff for next attempt
      backoffMs = Math.min(
        backoffMs * finalConfig.backoffMultiplier,
        finalConfig.maxBackoffMs
      );
    }
  }

  throw lastError;
}

// ============================================================================
// ERROR HANDLER EXPORT
// ============================================================================

export const errorHandler = {
  detectCode: detectErrorCode,
  normalize: normalizeError,
  log: errorLogger.log.bind(errorLogger),
  getLogs: errorLogger.getLogs.bind(errorLogger),
  clearLogs: errorLogger.clearLogs.bind(errorLogger),
  withRetry,
};
