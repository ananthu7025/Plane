import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors.js";

export function errorHandler(error: Error, req: Request, res: Response, next: NextFunction) {
  console.error("Error:", error);

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      data: null,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details && { details: error.details }),
      },
      timestamp: new Date().toISOString(),
    });
  }

  // Generic error
  res.status(500).json({
    success: false,
    data: null,
    error: {
      code: "INTERNAL_ERROR",
      message: "Internal server error",
    },
    timestamp: new Date().toISOString(),
  });
}
