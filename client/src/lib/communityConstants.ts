/**
 * Community Feature Frontend Constants
 * All hardcoded values extracted here to avoid magic strings/numbers
 */

// Community Rules (Static)
export const COMMUNITY_RULES = [
  "Be respectful and supportive of fellow students",
  "No spam, self-promotion, or irrelevant content",
  "Keep discussions related to aviation and learning",
  "No sharing of copyrighted exam materials",
  "Anonymous posts are still subject to moderation",
  "Report offensive content using the flag option",
  "Maintain academic integrity in all discussions",
] as const;

// Default Pagination Values
export const COMMUNITY_PAGINATION = {
  PAGE: 1,
  LIMIT: 20,
  ACTIVITY_LOG_LIMIT: 50,
} as const;

// Post Status for Display
export const POST_STATUS_DISPLAY = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

// Default Stats (Shown while loading)
export const DEFAULT_COMMUNITY_STATS = {
  members: 0,
  postsThisWeek: 0,
  engagementRate: 0,
} as const;

// Timeout for API calls
export const API_TIMEOUTS = {
  SHORT: 5000,
  MEDIUM: 10000,
  LONG: 20000,
} as const;

// Messages
export const COMMUNITY_MESSAGES = {
  NO_POSTS: "No posts available. Be the first to share!",
  NO_CATEGORIES: "No categories available.",
  NO_REPLIES: "No replies yet. Be the first to reply!",
  LOADING: "Loading...",
  ERROR: "Something went wrong. Please try again.",
  POST_SUBMITTED: "Your post has been submitted for review!",
  POST_DELETED: "Post deleted successfully",
  REPLY_ADDED: "Reply added successfully",
  REPLY_DELETED: "Reply deleted successfully",
  CATEGORY_SELECTED: "Category selected",
} as const;

// Modal/Dialog states
export const DIALOG_STATES = {
  CREATE_POST: "create_post",
  VIEW_POST: "view_post",
  EDIT_POST: "edit_post",
  DELETE_POST: "delete_post",
  REPORT_POST: "report_post",
} as const;

// Filter options
export const FILTER_OPTIONS = {
  ALL: "all",
  APPROVED: "approved",
  PENDING: "pending",
  REJECTED: "rejected",
} as const;

// Sort options
export const SORT_OPTIONS = {
  NEWEST: "newest",
  OLDEST: "oldest",
  MOST_LIKED: "most_liked",
  MOST_REPLIES: "most_replies",
} as const;

// Animation variants
export const ANIMATION_VARIANTS = {
  container: { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } },
  item: { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } },
  fadeIn: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
  slideIn: { hidden: { x: -20, opacity: 0 }, visible: { x: 0, opacity: 1 } },
} as const;

// Character limits
export const CHARACTER_LIMITS = {
  POST_MIN: 10,
  POST_MAX: 5000,
  REPLY_MIN: 1,
  REPLY_MAX: 5000,
  TITLE_MAX: 100,
} as const;

// Media type options
export const MEDIA_TYPES = ["image", "video", "document"] as const;

// Default avatar
export const DEFAULT_AVATAR = "";

// Role colors for badges
export const ROLE_COLORS = {
  student: "bg-blue-100 text-blue-800",
  mentor: "bg-purple-100 text-purple-800",
  instructor: "bg-green-100 text-green-800",
  moderator: "bg-red-100 text-red-800",
  admin: "bg-yellow-100 text-yellow-800",
} as const;
