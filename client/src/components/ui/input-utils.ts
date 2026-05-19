/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Get nested error from form errors object
 * Handles deep nested field paths like "address.city"
 */
export const getNestedError = (obj: any, path: string): any => {
  return path.split(".").reduce((current, prop) => current?.[prop], obj);
};

/**
 * Check if field has error
 */
export const hasFieldError = (errors: any, field: string): boolean => {
  return !!getNestedError(errors, field);
};

/**
 * Get error message for field
 */
export const getFieldErrorMessage = (errors: any, field: string): string | undefined => {
  return getNestedError(errors, field)?.message;
};
