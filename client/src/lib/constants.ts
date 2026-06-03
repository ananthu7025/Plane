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
  CHANGE_PASSWORD: '/api/auth/change-password',
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
  BAN_USER: '/api/community/users/ban',
  UNBAN_USER: '/api/community/users/unban',
  GET_BANNED_USERS: '/api/community/banned-users',
} as const;

export const LETTERS_ENDPOINTS = {
  // Student Endpoints
  CREATE_LETTER: '/api/letters/submit',
  GET_PUBLIC_LETTERS: '/api/letters/feed',
  GET_LETTER_DETAIL: (letterId: string) => `/api/letters/${letterId}`,
  GET_MY_LETTERS: '/api/letters/my-letters',
  RESUBMIT_LETTER: (letterId: string) => `/api/letters/${letterId}/resubmit`,
  TOGGLE_LIKE: (letterId: string) => `/api/letters/${letterId}/like`,
  GET_LETTER_VERSIONS: (letterId: string) => `/api/letters/${letterId}/versions`,

  // Admin Endpoints
  GET_MODERATION_QUEUE: '/api/letters/moderation/pending',
  APPROVE_LETTER: (letterId: string) => `/api/letters/${letterId}/approve`,
  REJECT_LETTER: (letterId: string) => `/api/letters/${letterId}/reject`,
  DELETE_LETTER: (letterId: string) => `/api/letters/${letterId}`,
  GET_LETTER_STATS: '/api/letters/admin/stats',
} as const;

export const NEWSLETTER_ENDPOINTS = {
  // Admin Endpoints
  CREATE_NEWSLETTER: '/api/newsletters/admin/create',
  GET_ADMIN_NEWSLETTERS: '/api/newsletters/admin/list',
  GET_ADMIN_NEWSLETTER_DETAIL: (id: string) => `/api/newsletters/admin/${id}`,
  UPDATE_NEWSLETTER: (id: string) => `/api/newsletters/admin/${id}`,
  DELETE_NEWSLETTER: (id: string) => `/api/newsletters/admin/${id}`,
  TOGGLE_NEWSLETTER_STATUS: (id: string) => `/api/newsletters/admin/${id}/status`,

  // Student Endpoints
  GET_NEWSLETTERS: '/api/newsletters/list',
  GET_NEWSLETTER_DETAIL: (id: string) => `/api/newsletters/${id}`,
  CHECK_NEWSLETTER_ACCESS: (id: string) => `/api/newsletters/${id}/access`,
} as const;

export const BLOGS_ENDPOINTS = {
  // Admin Endpoints
  CREATE_BLOG: '/api/blogs/admin',
  GET_ADMIN_BLOGS: '/api/blogs/admin',
  GET_ADMIN_BLOG_DETAIL: (blogId: number) => `/api/blogs/admin/${blogId}`,
  UPDATE_BLOG: (blogId: number) => `/api/blogs/admin/${blogId}`,
  DELETE_BLOG: (blogId: number) => `/api/blogs/admin/${blogId}`,
  PUBLISH_BLOG: (blogId: number) => `/api/blogs/admin/${blogId}/publish`,

  // Public/Student Endpoints
  GET_BLOGS: '/api/blogs',
  GET_BLOG_DETAIL: (blogId: number) => `/api/blogs/${blogId}`,
  GET_CATEGORIES: '/api/blogs/categories',
  ACKNOWLEDGE_BLOG: (blogId: number) => `/api/blogs/${blogId}/acknowledge`,
  RECORD_VIEW: (blogId: number) => `/api/blogs/${blogId}/view`,
} as const;

export const FEEDBACK_ENDPOINTS = {
  // Student
  SUBMIT:     '/api/feedback',
  GET_MY:     '/api/feedback/my',
  // Admin
  GET_ALL:    '/api/feedback/admin',
  ANALYTICS:  '/api/feedback/admin/analytics',
  GET_DETAIL: (id: number) => `/api/feedback/admin/${id}`,
  RESPOND:    (id: number) => `/api/feedback/admin/${id}/respond`,
} as const;

export const FAQ_ENDPOINTS = {
  // Public
  GET_PUBLIC_FAQS: '/api/faqs',
  // Admin
  GET_ADMIN_FAQS:  '/api/faqs/admin',
  CREATE_FAQ:      '/api/faqs/admin',
  UPDATE_FAQ:      (id: number) => `/api/faqs/admin/${id}`,
  DELETE_FAQ:      (id: number) => `/api/faqs/admin/${id}`,
  TOGGLE_FAQ:      (id: number) => `/api/faqs/admin/${id}/toggle`,
  REORDER_FAQS:    '/api/faqs/admin/reorder',
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
  STUDENT_BLOGS: '/student/blogs',
  STUDENT_BLOG_DETAIL: '/student/blogs/:blogId',
  ADMIN_DASHBOARD: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_BLOGS: '/admin/blogs',
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

// Newsletter Constants
export const NEWSLETTER_CATEGORIES = {
  ALL: 'All',
  AVIATION_NEWS: 'Aviation News',
  SAFETY_TIPS: 'Safety Tips',
  INDUSTRY_UPDATES: 'Industry Updates',
} as const;

export const NEWSLETTER_CATEGORIES_LIST = Object.values(NEWSLETTER_CATEGORIES);

export const NEWSLETTER_STATUSES = {
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
  DRAFT: 'draft',
} as const;

export const NEWSLETTER_STATUSES_LIST = Object.values(NEWSLETTER_STATUSES);

export const NEWSLETTER_STATUS_FILTER_OPTIONS = [
  'all',
  NEWSLETTER_STATUSES.PUBLISHED,
  NEWSLETTER_STATUSES.ARCHIVED,
  NEWSLETTER_STATUSES.DRAFT,
] as const;

// File Upload Configuration
export const FILE_UPLOAD_CONFIG = {
  PDF_MAX_SIZE: 50 * 1024 * 1024, // 50MB
  PDF_MIME_TYPE: 'application/pdf',
} as const;

// Pagination
export const PAGINATION = {
  STUDENT_LIMIT: 10,
  ADMIN_LIMIT: 20,
  DEFAULT_PAGE: 1,
} as const;

// Cache Control
export const CACHE_CONTROL = {
  PDF_CACHE_AGE: 3600, // 1 hour in seconds
} as const;
