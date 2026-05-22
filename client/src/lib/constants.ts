export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Plane & Prop';

// API Endpoints
export const AUTH_ENDPOINTS = {
  SIGNUP: '/api/auth/signup',
  SIGNIN: '/api/auth/signin',
  VERIFY_EMAIL: '/api/auth/verify-email',
  RESEND_OTP: '/api/auth/resend-otp',
  REFRESH: '/api/auth/refresh',
  SIGNOUT: '/api/auth/signout',
  FORGOT_PASSWORD: '/api/auth/forgot-password',
  RESET_PASSWORD: '/api/auth/reset-password',
} as const;

export const USER_MANAGEMENT_ENDPOINTS = {
  GET_ALL_USERS: '/api/admin/users',
  GET_USER_BY_ID: (userId: string) => `/api/admin/users/${userId}`,
  UPDATE_USER_PROFILE: (userId: string) => `/api/admin/users/${userId}`,
  UPDATE_USER_STATUS: (userId: string) => `/api/admin/users/${userId}/status`,
  DELETE_USER: (userId: string) => `/api/admin/users/${userId}`,
  GET_OWN_PROFILE: '/api/user/profile',
  UPDATE_OWN_PROFILE: '/api/user/profile',
  GET_PUBLIC_PROFILE: (userId: string) => `/api/user/${userId}/public`,
  UPDATE_USER_ROLE: (userId: string) => `/api/admin/users/${userId}/role`,
} as const;

export const ROLES_ENDPOINTS = {
  GET_ALL_ROLES: '/api/admin/roles',
  GET_ROLE_BY_ID: (roleId: number) => `/api/admin/roles/${roleId}`,
  CREATE_ROLE: '/api/admin/roles',
  UPDATE_ROLE: (roleId: number) => `/api/admin/roles/${roleId}`,
  DELETE_ROLE: (roleId: number) => `/api/admin/roles/${roleId}`,
  GET_ALL_PERMISSIONS: '/api/admin/permissions',
  CREATE_PERMISSION: '/api/admin/permissions',
  UPDATE_PERMISSION: (permissionId: number) => `/api/admin/permissions/${permissionId}`,
  DELETE_PERMISSION: (permissionId: number) => `/api/admin/permissions/${permissionId}`,
  ASSIGN_PERMISSION: (roleId: number) => `/api/admin/roles/${roleId}/permissions`,
  REMOVE_PERMISSION: (roleId: number, permissionId: number) => `/api/admin/roles/${roleId}/permissions/${permissionId}`,
} as const;

export const COMMUNITY_ENDPOINTS = {
  // Public Posts
  GET_ALL_POSTS: '/api/community/posts',
  GET_POST_BY_ID: (postId: string) => `/api/community/posts/${postId}`,
  CREATE_POST: '/api/community/posts',
  DELETE_POST: (postId: string) => `/api/community/posts/${postId}`,
  LIKE_POST: (postId: string) => `/api/community/posts/${postId}/like`,

  // User Posts
  GET_MY_POSTS: '/api/community/my-posts',

  // Replies/Comments
  ADD_REPLY: (postId: string) => `/api/community/posts/${postId}/replies`,
  DELETE_REPLY: (postId: string, replyId: string) => `/api/community/posts/${postId}/replies/${replyId}`,
  LIKE_REPLY: (postId: string, replyId: string) => `/api/community/posts/${postId}/replies/${replyId}/like`,
  GET_POST_LIKES: (postId: string) => `/api/community/posts/${postId}/likes`,
  GET_POST_COMMENTS: (postId: string) => `/api/community/posts/${postId}/comments`,

  // Categories
  GET_ALL_CATEGORIES: '/api/community/categories',
  CREATE_CATEGORY: '/api/community/admin/categories',
  DELETE_CATEGORY: (categoryId: number) => `/api/community/admin/categories/${categoryId}`,

  // Admin - Moderation
  GET_POSTS_FOR_MODERATION: '/api/community/admin/posts',
  APPROVE_POST: (postId: string) => `/api/community/admin/posts/${postId}/approve`,
  DECLINE_POST: (postId: string) => `/api/community/admin/posts/${postId}/decline`,
  DELETE_POST_ADMIN: (postId: string) => `/api/community/admin/posts/${postId}`,
  DELETE_REPLY_ADMIN: (postId: string, replyId: string) => `/api/community/admin/posts/${postId}/replies/${replyId}`,

  // Admin - Ban Management
  BAN_USER: (userId: string) => `/api/community/admin/users/${userId}/ban`,
  UNBAN_USER: (userId: string) => `/api/community/admin/users/${userId}/unban`,
  GET_BANNED_USERS: '/api/community/admin/banned-users',
} as const;

export const LETTERS_ENDPOINTS = {
  // Student Endpoints
  GET_PUBLIC_LETTERS: '/api/letters',
  GET_LETTER_DETAIL: (letterId: string) => `/api/letters/${letterId}`,
  CREATE_LETTER: '/api/letters',
  RESUBMIT_LETTER: (letterId: string) => `/api/letters/${letterId}/resubmit`,
  GET_MY_LETTERS: '/api/letters/user/my-letters',
  TOGGLE_LIKE: (letterId: string) => `/api/letters/${letterId}/acknowledge`,
  GET_LETTER_VERSIONS: (letterId: string) => `/api/letters/${letterId}/versions`,

  // Admin Endpoints
  GET_MODERATION_QUEUE: '/api/letters/admin/queue',
  APPROVE_LETTER: (letterId: string) => `/api/letters/${letterId}/approve`,
  REJECT_LETTER: (letterId: string) => `/api/letters/${letterId}/reject`,
  DELETE_LETTER: (letterId: string) => `/api/letters/${letterId}`,
  GET_LETTER_STATS: '/api/letters/admin/stats',
} as const;

// Route Paths
export const ROUTES = {
  HOME: '/',
  SIGNUP: '/signup',
  VERIFY_EMAIL: '/verify-email',
  LOGIN: '/login',
  ADMIN_LOGIN: '/admin/login',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  STUDENT_DASHBOARD: '/student',
  ADMIN_DASHBOARD: '/admin',
  ADMIN_USERS: '/admin/users',
  NOT_FOUND: '*',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  EMAIL_EXISTS: 'Email already registered. Try signing in.',
  INVALID_CREDENTIALS: 'Incorrect email or password.',
  INVALID_TOKEN: 'Session expired. Please sign in again.',
  TOKEN_EXPIRED: 'Session expired. Please sign in again.',
  USER_SUSPENDED: 'Account is suspended. Contact support.',
  VALIDATION_ERROR: 'Please check the highlighted fields.',
  RATE_LIMIT_EXCEEDED: 'Too many attempts. Try again later.',
  INTERNAL_ERROR: 'Something went wrong. Please try again.',
  NETWORK_ERROR: 'No connection. Check your internet.',
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Timeouts (in ms)
export const TIMEOUTS = {
  API_REQUEST: 30000,
  TOKEN_REFRESH: 10000,
  DEBOUNCE: 300,
} as const;

// Toast Messages
export const TOAST_MESSAGES = {
  SIGNUP_SUCCESS: 'Account created successfully! Check your email for verification.',
  EMAIL_VERIFIED: 'Email verified! You can now sign in.',
  PASSWORD_RESET_SENT: 'Password reset link sent to your email.',
  PASSWORD_RESET_SUCCESS: 'Password reset successfully. Sign in with your new password.',
  LOGOUT_SUCCESS: 'Logged out successfully.',
  OTP_RESENT: 'Verification code resent to your email.',
} as const;
