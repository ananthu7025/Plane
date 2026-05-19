/**
 * Community Feature Constants
 * All hardcoded values are extracted here to avoid magic strings/numbers
 */

// Post Status Constants
export const POST_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export const POST_STATUS_VALUES = Object.values(POST_STATUS);

// Default Pagination Values
export const DEFAULT_PAGINATION = {
  POST_PAGE: 1,
  POST_LIMIT: 20,
  ACTIVITY_LOG_PAGE: 1,
  ACTIVITY_LOG_LIMIT: 50,
  BANNED_USERS_PAGE: 1,
  BANNED_USERS_LIMIT: 20,
} as const;

// Content Validation Limits
export const CONTENT_LIMITS = {
  REPLY_MAX_LENGTH: 5000,
  POST_ID_LENGTH: 36, // UUID length
} as const;

// Entity Type Patterns for Activity Log
export const ACTIVITY_LOG_ENTITY_TYPES = {
  COMMUNITY_POST: "community_post",
  COMMUNITY_REPLY: "community_reply",
  COMMUNITY_BAN: "community_ban",
  COMMUNITY_CATEGORY: "community_category",
} as const;

export const ACTIVITY_LOG_ENTITY_TYPE_PATTERN = "%community%";

// Activity Log Actions
export const ACTIVITY_LOG_ACTIONS = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  APPROVE: "APPROVE",
  REJECT: "REJECT",
  BAN: "BAN",
  UNBAN: "UNBAN",
} as const;

// API Error Messages
export const ERROR_MESSAGES = {
  POST_CREATE_ERROR: "Failed to create post",
  POST_FETCH_ERROR: "Failed to fetch posts",
  POST_DELETE_ERROR: "Failed to delete post",
  POST_APPROVE_ERROR: "Failed to approve post",
  POST_DECLINE_ERROR: "Failed to decline post",
  LIKE_TOGGLE_ERROR: "Failed to toggle like",
  REPLY_CREATE_ERROR: "Failed to add reply",
  REPLY_DELETE_ERROR: "Failed to delete reply",
  REPLY_LIKE_ERROR: "Failed to toggle reply like",
  BAN_USER_ERROR: "Failed to ban user",
  UNBAN_USER_ERROR: "Failed to unban user",
  BANNED_USERS_ERROR: "Failed to fetch banned users",
  CATEGORY_CREATE_ERROR: "Failed to create category",
  CATEGORY_DELETE_ERROR: "Failed to delete category",
  CATEGORIES_ERROR: "Failed to fetch categories",
  ACTIVITY_LOG_ERROR: "Failed to fetch activity log",
  VALIDATION_ERROR: "Validation error",
  POST_NOT_FOUND: "Post not found",
  REPLY_NOT_FOUND: "Reply not found",
  CATEGORY_NOT_FOUND: "Category not found",
  USER_BANNED: "User is banned from community",
  REPLY_TOO_LONG: `Reply content is too long (max ${5000} characters)`,
} as const;

// HTTP Status Codes (for clarity)
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
} as const;
