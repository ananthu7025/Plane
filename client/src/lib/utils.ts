/* eslint-disable @typescript-eslint/no-explicit-any */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { AxiosError } from "axios";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError && error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function getErrorCode(error: unknown): string | null {
  if (error && typeof error === 'object') {
    // Check for error.error.code (most API responses)
    if ('error' in error) {
      const errorObj = (error as any).error;
      if (errorObj && typeof errorObj === 'object' && 'code' in errorObj) {
        return (errorObj as any).code ?? null;
      }
    }
    // Check for error.data.error.code (alternative structure)
    if ('data' in error) {
      const dataObj = (error as any).data;
      if (dataObj && typeof dataObj === 'object' && 'error' in dataObj) {
        const errorObj = dataObj.error;
        if (errorObj && typeof errorObj === 'object' && 'code' in errorObj) {
          return (errorObj as any).code ?? null;
        }
      }
    }
  }
  return null;
}

export function mapBackendErrorToField(error: unknown, setError: any): boolean {
  if (error instanceof AxiosError && error.response?.data?.errors) {
    const errors = error.response.data.errors;
    Object.keys(errors).forEach((key) => {
      setError(key, { type: "server", message: errors[key] });
    });
    return true;
  }
  return false;
}
