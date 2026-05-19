import { Response } from "express";

export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  } | null;
  timestamp: string;
}

export function sendSuccess<T>(
  res: Response,
  statusCode: number,
  data: T,
  message?: string
) {
  const response: ApiResponse<T> = {
    success: true,
    data,
    error: null,
    timestamp: new Date().toISOString(),
  };
  res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: Record<string, any>
) {
  const response: ApiResponse = {
    success: false,
    data: null,
    error: {
      code,
      message,
      ...(details && { details }),
    },
    timestamp: new Date().toISOString(),
  };
  res.status(statusCode).json(response);
}
