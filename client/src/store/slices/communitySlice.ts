/* eslint-disable no-useless-catch */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { axiosInstance } from "@/api/client";
import { createSlice } from "@reduxjs/toolkit";
import type { Dispatch, PayloadAction } from "@reduxjs/toolkit";
import { COMMUNITY_ENDPOINTS } from "@/lib/constants";

// API Response wrapper type
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: { code: string; message: string; details?: Record<string, unknown> } | null;
  timestamp: string;
}

// Types
export interface Post {
  id: string;
  author?: {
    id: string;
    name: string;
    role: string;
    avatar?: string;
  };
  category?: {
    id: number;
    name: string;
    description?: string;
  } | string;
  categoryId: number;
  title: string;
  content: string;
  isAnonymous: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED";
  likeCount: number;
  commentCount: number;
  viewCount: number;
  isLiked?: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  featuredMediaId?: string | null;
}

export interface Reply {
  id: string;
  authorId: string;
  content: string;
  status: string;
  likeCount: number;
  parentCommentId?: string | null;
  createdAt: string;
  author?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface PostLike {
  id: string;
  userId: string;
  userName: string;
  avatar?: string;
  createdAt: string;
}

export interface PostComment {
  id: string;
  authorId: string;
  authorName: string;
  avatar?: string;
  content: string;
  likeCount: number;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  color?: string;
  slug?: string;
}

export interface BannedUser {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  reason: string;
  bannedBy: string;
  bannedAt: string;
  isPermanent: boolean;
}

export interface ActivityLogEntry {
  id: string;
  action: string;
  actor: string;
  targetType: string;
  targetId: string;
  details: any;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Filters interface
export interface CommunityFilters {
  search: string;
  categoryId?: number;
  status?: string;
  page: number;
  limit: number;
}

interface CommunityState {
  // Posts
  posts: Post[];
  userPosts: Post[];
  moderationPosts: Post[];

  // Comments/Replies
  postReplies: Record<string, Reply[]>;
  postLikes: Record<string, PostLike[]>;
  postComments: Record<string, PostComment[]>;

  // Categories
  categories: Category[];

  // Moderation
  bannedUsers: BannedUser[];
  activityLog: ActivityLogEntry[];

  // Pagination & Filters
  postsPagination: Pagination;
  userPostsPagination: Pagination;
  moderationPagination: Pagination;
  bannedUsersPagination: Pagination;
  activityLogPagination: Pagination;
  postLikesPagination: Record<string, Pagination>;
  postCommentsPagination: Record<string, Pagination>;

  filters: CommunityFilters;

  // UI State - separate loading states for different operations
  loading: boolean;
  postsLoading: boolean;
  userPostsLoading: boolean;
  moderationLoading: boolean;
  categoriesLoading: boolean;
  bannedUsersLoading: boolean;
  activityLogLoading: boolean;
  postLikesLoading: Record<string, boolean>;
  postCommentsLoading: Record<string, boolean>;
  creatingPost: boolean;
  deletingPost: boolean;
  creatingCategory: boolean;
  updatingUser: boolean;

  error: string | null;
  postsError: string | null;
  userPostsError: string | null;
  moderationError: string | null;
  categoriesError: string | null;
  bannedUsersError: string | null;
  activityLogError: string | null;
  updateError: string | null;

  successMessage: string | null;
}

const initialState: CommunityState = {
  posts: [],
  userPosts: [],
  moderationPosts: [],
  postReplies: {},
  postLikes: {},
  postComments: {},
  categories: [],
  bannedUsers: [],
  activityLog: [],
  postsPagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  userPostsPagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  moderationPagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  bannedUsersPagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  activityLogPagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  postLikesPagination: {},
  postCommentsPagination: {},
  filters: { search: "", page: 1, limit: 20 },
  loading: false,
  postsLoading: false,
  userPostsLoading: false,
  moderationLoading: false,
  categoriesLoading: false,
  bannedUsersLoading: false,
  activityLogLoading: false,
  postLikesLoading: {},
  postCommentsLoading: {},
  creatingPost: false,
  deletingPost: false,
  creatingCategory: false,
  updatingUser: false,
  error: null,
  postsError: null,
  userPostsError: null,
  moderationError: null,
  categoriesError: null,
  bannedUsersError: null,
  activityLogError: null,
  updateError: null,
  successMessage: null,
};

// Slice with reducers
const communitySlice = createSlice({
  name: "community",
  initialState,
  reducers: {
    // Filter actions
    setFilters: (state, action: PayloadAction<Partial<CommunityFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    // Clear error actions
    clearError: (state) => {
      state.error = null;
      state.postsError = null;
      state.userPostsError = null;
      state.moderationError = null;
      state.categoriesError = null;
      state.bannedUsersError = null;
      state.activityLogError = null;
      state.updateError = null;
    },

    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },

    // Get all approved posts
    getAllApprovedPostsStart: (state) => {
      state.postsLoading = true;
      state.postsError = null;
    },
    getAllApprovedPostsSuccess: (
      state,
      action: PayloadAction<{ data: Post[]; pagination: Pagination; isAppending?: boolean }>,
    ) => {
      state.postsLoading = false;

      // Append for pagination (loading more), replace for fresh fetch (page 1)
      if (action.payload.isAppending) {
        // Avoid duplicates: filter out posts that already exist
        const existingIds = new Set(state.posts.map(p => p.id));
        const newPosts = action.payload.data.filter(p => !existingIds.has(p.id));
        state.posts = [...state.posts, ...newPosts];
      } else {
        // Fresh fetch - replace all posts
        state.posts = action.payload.data;
      }

      state.postsPagination = action.payload.pagination;
    },
    getAllApprovedPostsError: (state, action: PayloadAction<string>) => {
      state.postsLoading = false;
      state.postsError = action.payload;
    },

    // Get single post
    getPostByIdStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    getPostByIdSuccess: (state, action: PayloadAction<Post>) => {
      state.loading = false;
      const index = state.posts.findIndex((p) => p.id === action.payload.id);
      if (index === -1) {
        state.posts.push(action.payload);
      } else {
        state.posts[index] = action.payload;
      }
    },
    getPostByIdError: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Get user posts
    getUserPostsStart: (state) => {
      state.userPostsLoading = true;
      state.userPostsError = null;
    },
    getUserPostsSuccess: (
      state,
      action: PayloadAction<{ data: Post[]; pagination: Pagination }>,
    ) => {
      state.userPostsLoading = false;
      state.userPosts = action.payload.data;
      state.userPostsPagination = action.payload.pagination;
    },
    getUserPostsError: (state, action: PayloadAction<string>) => {
      state.userPostsLoading = false;
      state.userPostsError = action.payload;
    },

    // Create post
    createPostStart: (state) => {
      state.creatingPost = true;
      state.error = null;
    },
    createPostSuccess: (state, action: PayloadAction<Post>) => {
      state.creatingPost = false;
      state.userPosts.unshift(action.payload);
      state.successMessage = "Post created successfully!";
    },
    createPostError: (state, action: PayloadAction<string>) => {
      state.creatingPost = false;
      state.error = action.payload;
    },

    // Delete post
    deletePostStart: (state) => {
      state.deletingPost = true;
      state.error = null;
    },
    deletePostSuccess: (state, action: PayloadAction<string>) => {
      state.deletingPost = false;
      state.userPosts = state.userPosts.filter((p) => p.id !== action.payload);
      state.posts = state.posts.filter((p) => p.id !== action.payload);
      state.successMessage = "Post deleted successfully!";
    },
    deletePostError: (state, action: PayloadAction<string>) => {
      state.deletingPost = false;
      state.error = action.payload;
    },

    // Toggle post like
    togglePostLikeSuccess: (
      state,
      action: PayloadAction<{ postId: string; likeCount: number; isLiked: boolean }>,
    ) => {
      const post = state.posts.find((p) => p.id === action.payload.postId);
      if (post) {
        post.likeCount = action.payload.likeCount;
        post.isLiked = action.payload.isLiked;
      }
      const userPost = state.userPosts.find((p) => p.id === action.payload.postId);
      if (userPost) {
        userPost.likeCount = action.payload.likeCount;
        userPost.isLiked = action.payload.isLiked;
      }
      const modPost = state.moderationPosts.find((p) => p.id === action.payload.postId);
      if (modPost) {
        modPost.likeCount = action.payload.likeCount;
        modPost.isLiked = action.payload.isLiked;
      }
    },

    // Load post replies
    loadPostRepliesSuccess: (
      state,
      action: PayloadAction<{ postId: string; replies: Reply[] }>,
    ) => {
      const { postId, replies } = action.payload;
      state.postReplies[postId] = replies;

      // Only update comment count if we have replies (don't reset to 0)
      if (replies.length > 0) {
        const post = state.posts.find((p) => p.id === postId);
        if (post) {
          post.commentCount = replies.length;
        }
        const moderationPost = state.moderationPosts.find((p) => p.id === postId);
        if (moderationPost) {
          moderationPost.commentCount = replies.length;
        }
        const userPost = state.userPosts.find((p) => p.id === postId);
        if (userPost) {
          userPost.commentCount = replies.length;
        }
      }
    },

    // Add reply
    addReplyStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    addReplySuccess: (
      state,
      action: PayloadAction<{ postId: string; reply: Reply }>,
    ) => {
      state.loading = false;
      const { postId, reply } = action.payload;
      if (!state.postReplies[postId]) {
        state.postReplies[postId] = [];
      }
      state.postReplies[postId].push(reply);

      // Update comment count
      const post = state.posts.find((p) => p.id === postId);
      if (post) {
        post.commentCount += 1;
      }
      const userPost = state.userPosts.find((p) => p.id === postId);
      if (userPost) {
        userPost.commentCount += 1;
      }

      state.successMessage = "Reply added successfully!";
    },
    addReplyError: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Delete reply
    deleteReplySuccess: (
      state,
      action: PayloadAction<{ postId: string; replyId: string }>,
    ) => {
      const { postId, replyId } = action.payload;
      if (state.postReplies[postId]) {
        state.postReplies[postId] = state.postReplies[postId].filter(
          (r) => r.id !== replyId,
        );
      }

      // Update comment count
      const post = state.posts.find((p) => p.id === postId);
      if (post) {
        post.commentCount = Math.max(0, post.commentCount - 1);
      }

      state.successMessage = "Reply deleted successfully!";
    },

    // Toggle reply like
    toggleReplyLikeSuccess: (
      state,
      action: PayloadAction<{ postId: string; replyId: string; likeCount: number }>,
    ) => {
      const { postId, replyId, likeCount } = action.payload;
      if (state.postReplies[postId]) {
        const reply = state.postReplies[postId].find((r) => r.id === replyId);
        if (reply) {
          reply.likeCount = likeCount;
        }
      }
    },

    // Get posts for moderation
    getPostsForModerationStart: (state) => {
      state.moderationLoading = true;
      state.moderationError = null;
    },
    getPostsForModerationSuccess: (
      state,
      action: PayloadAction<{ data: Post[]; pagination: Pagination }>,
    ) => {
      state.moderationLoading = false;
      state.moderationPosts = action.payload.data;
      state.moderationPagination = action.payload.pagination;
    },
    getPostsForModerationError: (state, action: PayloadAction<string>) => {
      state.moderationLoading = false;
      state.moderationError = action.payload;
    },

    // Approve post
    approvePostSuccess: (state, action: PayloadAction<Post>) => {
      const post = state.moderationPosts.find((p) => p.id === action.payload.id);
      if (post) {
        post.status = "APPROVED";
      }
      state.successMessage = "Post approved!";
    },

    // Decline post
    declinePostSuccess: (state, action: PayloadAction<Post>) => {
      const post = state.moderationPosts.find((p) => p.id === action.payload.id);
      if (post) {
        post.status = "REJECTED";
      }
      state.successMessage = "Post declined!";
    },

    // Delete post (admin)
    deletePostAdminSuccess: (state, action: PayloadAction<string>) => {
      state.moderationPosts = state.moderationPosts.filter(
        (p) => p.id !== action.payload,
      );
      state.posts = state.posts.filter(
        (p) => p.id !== action.payload,
      );
      state.successMessage = "Post deleted!";
    },

    // Delete reply (admin)
    deleteReplyAdminSuccess: (
      state,
      action: PayloadAction<{ postId: string; replyId: string }>,
    ) => {
      const { postId, replyId } = action.payload;
      if (state.postReplies[postId]) {
        state.postReplies[postId] = state.postReplies[postId].filter(
          (r) => r.id !== replyId,
        );
      }
      state.successMessage = "Reply deleted!";
    },

    // Get banned users
    getBannedUsersStart: (state) => {
      state.bannedUsersLoading = true;
      state.bannedUsersError = null;
    },
    getBannedUsersSuccess: (
      state,
      action: PayloadAction<{ data: BannedUser[]; pagination: Pagination }>,
    ) => {
      state.bannedUsersLoading = false;
      state.bannedUsers = action.payload.data;
      state.bannedUsersPagination = action.payload.pagination;
    },
    getBannedUsersError: (state, action: PayloadAction<string>) => {
      state.bannedUsersLoading = false;
      state.bannedUsersError = action.payload;
    },

    // Ban user
    banUserStart: (state) => {
      state.updatingUser = true;
      state.updateError = null;
    },
    banUserSuccess: (state, action: PayloadAction<BannedUser>) => {
      state.updatingUser = false;
      state.bannedUsers.unshift(action.payload);
      state.successMessage = "User banned successfully!";
    },
    banUserError: (state, action: PayloadAction<string>) => {
      state.updatingUser = false;
      state.updateError = action.payload;
    },

    // Unban user
    unbanUserStart: (state) => {
      state.updatingUser = true;
      state.updateError = null;
    },
    unbanUserSuccess: (state, action: PayloadAction<string>) => {
      state.updatingUser = false;
      state.bannedUsers = state.bannedUsers.filter((u) => u.id !== action.payload);
      state.successMessage = "User unbanned successfully!";
    },
    unbanUserError: (state, action: PayloadAction<string>) => {
      state.updatingUser = false;
      state.updateError = action.payload;
    },

    // Get all categories
    getAllCategoriesStart: (state) => {
      state.categoriesLoading = true;
      state.categoriesError = null;
    },
    getAllCategoriesSuccess: (state, action: PayloadAction<Category[]>) => {
      state.categoriesLoading = false;
      state.categories = action.payload;
    },
    getAllCategoriesError: (state, action: PayloadAction<string>) => {
      state.categoriesLoading = false;
      state.categoriesError = action.payload;
    },

    // Create category
    createCategoryStart: (state) => {
      state.creatingCategory = true;
      state.error = null;
    },
    createCategorySuccess: (state, action: PayloadAction<Category>) => {
      state.creatingCategory = false;
      state.categories.push(action.payload);
      state.successMessage = "Category created successfully!";
    },
    createCategoryError: (state, action: PayloadAction<string>) => {
      state.creatingCategory = false;
      state.error = action.payload;
    },

    // Delete category
    deleteCategorySuccess: (state, action: PayloadAction<number>) => {
      state.categories = state.categories.filter((c) => c.id !== action.payload);
      state.successMessage = "Category deleted successfully!";
    },

    // Get activity log
    getActivityLogStart: (state) => {
      state.activityLogLoading = true;
      state.activityLogError = null;
    },
    getActivityLogSuccess: (
      state,
      action: PayloadAction<{ data: ActivityLogEntry[]; pagination: Pagination }>,
    ) => {
      state.activityLogLoading = false;
      state.activityLog = action.payload.data;
      state.activityLogPagination = action.payload.pagination;
    },
    getActivityLogError: (state, action: PayloadAction<string>) => {
      state.activityLogLoading = false;
      state.activityLogError = action.payload;
    },

    // Get post likes
    getPostLikesStart: (state, action: PayloadAction<string>) => {
      state.postLikesLoading[action.payload] = true;
    },
    getPostLikesSuccess: (
      state,
      action: PayloadAction<{
        postId: string;
        data: PostLike[];
        pagination: Pagination;
      }>,
    ) => {
      const { postId, data, pagination } = action.payload;
      state.postLikesLoading[postId] = false;
      state.postLikes[postId] = data;
      state.postLikesPagination[postId] = pagination;
    },
    getPostLikesError: (
      state,
      action: PayloadAction<{ postId: string; error: string }>,
    ) => {
      state.postLikesLoading[action.payload.postId] = false;
    },

    // Get post comments
    getPostCommentsStart: (state, action: PayloadAction<string>) => {
      state.postCommentsLoading[action.payload] = true;
    },
    getPostCommentsSuccess: (
      state,
      action: PayloadAction<{
        postId: string;
        data: PostComment[];
        pagination: Pagination;
      }>,
    ) => {
      const { postId, data, pagination } = action.payload;
      state.postCommentsLoading[postId] = false;
      state.postComments[postId] = data;
      state.postCommentsPagination[postId] = pagination;
    },
    getPostCommentsError: (
      state,
      action: PayloadAction<{ postId: string; error: string }>,
    ) => {
      state.postCommentsLoading[action.payload.postId] = false;
    },
  },
});

export const {
  setFilters,
  clearError,
  clearSuccessMessage,
  getAllApprovedPostsStart,
  getAllApprovedPostsSuccess,
  getAllApprovedPostsError,
  getPostByIdStart,
  getPostByIdSuccess,
  getPostByIdError,
  getUserPostsStart,
  getUserPostsSuccess,
  getUserPostsError,
  createPostStart,
  createPostSuccess,
  createPostError,
  deletePostStart,
  deletePostSuccess,
  deletePostError,
  togglePostLikeSuccess,
  loadPostRepliesSuccess,
  addReplyStart,
  addReplySuccess,
  addReplyError,
  deleteReplySuccess,
  toggleReplyLikeSuccess,
  deleteReplyAdminSuccess,
  getPostsForModerationStart,
  getPostsForModerationSuccess,
  getPostsForModerationError,
  approvePostSuccess,
  declinePostSuccess,
  deletePostAdminSuccess,
  getBannedUsersStart,
  getBannedUsersSuccess,
  getBannedUsersError,
  banUserStart,
  banUserSuccess,
  banUserError,
  unbanUserStart,
  unbanUserSuccess,
  unbanUserError,
  getAllCategoriesStart,
  getAllCategoriesSuccess,
  getAllCategoriesError,
  createCategoryStart,
  createCategorySuccess,
  createCategoryError,
  deleteCategorySuccess,
  getActivityLogStart,
  getActivityLogSuccess,
  getActivityLogError,
  getPostLikesStart,
  getPostLikesSuccess,
  getPostLikesError,
  getPostCommentsStart,
  getPostCommentsSuccess,
  getPostCommentsError,
} = communitySlice.actions;

export default communitySlice.reducer;

// Thunk functions - following the pattern from authSlice and userManagementSlice

/**
 * Get all approved posts
 */
export function getAllApprovedPosts(params: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: number;
}) {
  return async function (dispatch: Dispatch) {
    dispatch(getAllApprovedPostsStart());
    try {
      const response = await axiosInstance.get<ApiResponse<any>>(
        COMMUNITY_ENDPOINTS.GET_ALL_POSTS,
        { params },
      );
      const responseData = response.data.data;

      // Append posts if loading page > 1 (pagination), else replace (fresh load)
      const isAppending = (params.page || 1) > 1;

      dispatch(
        getAllApprovedPostsSuccess({
          data: responseData.items || [],
          pagination: responseData.pagination,
          isAppending,
        }),
      );
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to fetch posts";
      dispatch(getAllApprovedPostsError(message));
    }
  };
}

/**
 * Get single post by ID
 */
export function getPostById(postId: string) {
  return async function (dispatch: Dispatch) {
    dispatch(getPostByIdStart());
    try {
      const response = await axiosInstance.get<ApiResponse<Post>>(
        COMMUNITY_ENDPOINTS.GET_POST_BY_ID(postId),
      );
      dispatch(getPostByIdSuccess(response.data.data));
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to fetch post";
      dispatch(getPostByIdError(message));
    }
  };
}

/**
 * Get user's own posts
 */
export function getUserPosts(params: { page?: number; limit?: number; status?: string }) {
  return async function (dispatch: Dispatch) {
    dispatch(getUserPostsStart());
    try {
      const response = await axiosInstance.get<ApiResponse<any>>(
        COMMUNITY_ENDPOINTS.GET_MY_POSTS,
        { params },
      );
      const responseData = response.data.data;
      dispatch(
        getUserPostsSuccess({
          data: responseData.items || [],
          pagination: responseData.pagination,
        }),
      );
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to fetch your posts";
      dispatch(getUserPostsError(message));
    }
  };
}

/**
 * Create new post
 */
export function createPost(data: {
  title: string;
  content: string;
  categoryId: number;
  isAnonymous?: boolean;
}) {
  return async function (dispatch: Dispatch) {
    dispatch(createPostStart());
    try {
      const response = await axiosInstance.post<ApiResponse<any>>(
        COMMUNITY_ENDPOINTS.CREATE_POST,
        data,
      );
      // Backend returns { data: { post: {...} } }
      const postData = response.data.data.post || response.data.data;
      dispatch(createPostSuccess(postData));
    } catch (error: any) {
      const errorData = error.response?.data?.error;
      const message = errorData?.message || "Failed to create post";
      dispatch(createPostError(message));

      // Throw error with details so component can handle validation errors
      const errorToThrow = new Error(message) as any;
      errorToThrow.details = errorData?.details;
      errorToThrow.message = message;
      throw errorToThrow;
    }
  };
}

/**
 * Delete own post
 */
export function deletePost(postId: string) {
  return async function (dispatch: Dispatch) {
    dispatch(deletePostStart());
    try {
      await axiosInstance.delete(COMMUNITY_ENDPOINTS.DELETE_POST(postId));
      dispatch(deletePostSuccess(postId));
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to delete post";
      dispatch(deletePostError(message));
    }
  };
}

/**
 * Toggle like on post (Instagram/Facebook style)
 */
export function togglePostLike(postId: string) {
  return async function (dispatch: Dispatch) {
    try {
      const response = await axiosInstance.put<ApiResponse<any>>(
        COMMUNITY_ENDPOINTS.LIKE_POST(postId),
      );
      dispatch(
        togglePostLikeSuccess({
          postId,
          isLiked: response.data.data.isLiked,
          likeCount: response.data.data.likeCount,
        }),
      );
    } catch (error: any) {
      // Silently fail for toggle like
    }
  };
}

/**
 * Add reply to post
 */
export function addReply(postId: string, content: string, parentCommentId?: string) {
  return async function (dispatch: Dispatch) {
    dispatch(addReplyStart());
    try {
      const response = await axiosInstance.post<ApiResponse<any>>(
        COMMUNITY_ENDPOINTS.ADD_REPLY(postId),
        { content, parentCommentId },
      );
      const commentData = response.data.data;

      // Transform comment to Reply interface
      const reply: Reply = {
        id: commentData.id,
        authorId: commentData.authorId,
        content: commentData.content,
        status: commentData.status || "APPROVED",
        likeCount: commentData.likeCount || 0,
        parentCommentId: commentData.parentCommentId || null,
        createdAt: commentData.createdAt,
        author: {
          id: commentData.authorId,
          name: commentData.authorName || "Unknown",
          avatar: commentData.avatar,
        },
      };

      dispatch(
        addReplySuccess({
          postId,
          reply,
        }),
      );
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to add reply";
      dispatch(addReplyError(message));
    }
  };
}

/**
 * Delete reply
 */
export function deleteReply(postId: string, replyId: string) {
  return async function (dispatch: Dispatch) {
    try {
      await axiosInstance.delete(
        COMMUNITY_ENDPOINTS.DELETE_REPLY(postId, replyId),
      );
      dispatch(deleteReplySuccess({ postId, replyId }));
    } catch (error: any) {
      // Silently fail for delete reply
    }
  };
}

/**
 * Toggle like on reply
 */
export function toggleReplyLike(postId: string, replyId: string) {
  return async function (dispatch: Dispatch) {
    try {
      const response = await axiosInstance.post<ApiResponse<any>>(
        COMMUNITY_ENDPOINTS.LIKE_REPLY(postId, replyId),
      );
      dispatch(
        toggleReplyLikeSuccess({
          postId,
          replyId,
          likeCount: response.data.data.likeCount,
        }),
      );
    } catch (error: any) {
      // Silently fail for toggle like
    }
  };
}

/**
 * Get posts for moderation (admin)
 */
export function getPostsForModeration(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  categoryId?: number;
}) {
  return async function (dispatch: Dispatch) {
    dispatch(getPostsForModerationStart());
    try {
      const response = await axiosInstance.get<ApiResponse<any>>(
        COMMUNITY_ENDPOINTS.GET_POSTS_FOR_MODERATION,
        { params },
      );
      const responseData = response.data.data;
      dispatch(
        getPostsForModerationSuccess({
          data: responseData.items || [],
          pagination: responseData.pagination,
        }),
      );
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message ||
        "Failed to fetch posts for moderation";
      dispatch(getPostsForModerationError(message));
    }
  };
}

/**
 * Approve post (admin)
 */
export function approvePost(postId: string) {
  return async function (dispatch: Dispatch) {
    try {
      const response = await axiosInstance.put<ApiResponse<any>>(
        COMMUNITY_ENDPOINTS.APPROVE_POST(postId),
      );
      // Backend returns { data: { post: {...} } }
      const postData = response.data.data.post || response.data.data;
      dispatch(approvePostSuccess(postData));
      return postData;
    } catch (error: any) {
      throw error;
    }
  };
}

/**
 * Decline post (admin)
 */
export function declinePost(postId: string, reason: string) {
  return async function (dispatch: Dispatch) {
    try {
      const response = await axiosInstance.put<ApiResponse<Post>>(
        COMMUNITY_ENDPOINTS.DECLINE_POST(postId),
        { reason },
      );
      dispatch(declinePostSuccess(response.data.data));
      return response.data.data;
    } catch (error: any) {
      throw error;
    }
  };
}

/**
 * Delete post (admin)
 */
export function deletePostAdmin(postId: string) {
  return async function (dispatch: Dispatch) {
    try {
      await axiosInstance.delete(COMMUNITY_ENDPOINTS.DELETE_POST_ADMIN(postId));
      dispatch(deletePostAdminSuccess(postId));
      return postId;
    } catch (error: any) {
      throw error;
    }
  };
}

/**
 * Get post details with comments
 */
export function getPostDetails(postId: string) {
  return async function (dispatch: Dispatch) {
    try {
      // Fetch both post and comments in parallel
      const [postResponse, commentsResponse] = await Promise.all([
        axiosInstance.get(COMMUNITY_ENDPOINTS.GET_POST_BY_ID(postId)),
        axiosInstance.get<ApiResponse<any>>(
          COMMUNITY_ENDPOINTS.GET_POST_COMMENTS(postId),
          { params: { page: 1, limit: 50 } }
        ),
      ]);

      const postData = postResponse.data.data;
      const commentsData = commentsResponse.data.data;

      console.log("[DEBUG] Post details response:", { postData, commentsData });

      // Map comments to Reply format, including parentCommentId for nested replies
      const mappedComments = (commentsData.items || []).map((comment: any) => ({
        id: comment.id,
        authorId: comment.authorId,
        content: comment.content,
        status: comment.status || "APPROVED",
        likeCount: comment.likeCount || 0,
        parentCommentId: comment.parentCommentId || null,
        createdAt: comment.createdAt,
        author: {
          id: comment.authorId,
          name: comment.authorName || "Unknown",
          avatar: comment.avatar,
        },
      }));

      dispatch(
        loadPostRepliesSuccess({
          postId,
          replies: mappedComments,
        })
      );

      return postData;
    } catch (error: any) {
      console.error("Failed to fetch post details:", error);
      throw error;
    }
  };
}

/**
 * Delete reply (admin)
 */
export function deleteReplyAdmin(postId: string, replyId: string) {
  return async function (dispatch: Dispatch) {
    try {
      await axiosInstance.delete(
        COMMUNITY_ENDPOINTS.DELETE_REPLY_ADMIN(postId, replyId),
      );
      dispatch(deleteReplyAdminSuccess({ postId, replyId }));
    } catch (error: any) {
      // Silently fail for delete reply admin
    }
  };
}

/**
 * Get banned users (admin)
 */
export function getBannedUsers(params: { page?: number; limit?: number }) {
  return async function (dispatch: Dispatch) {
    dispatch(getBannedUsersStart());
    try {
      const response = await axiosInstance.get<ApiResponse<any>>(
        COMMUNITY_ENDPOINTS.GET_BANNED_USERS,
        { params },
      );
      const responseData = response.data.data;
      dispatch(
        getBannedUsersSuccess({
          data: responseData.items || [],
          pagination: responseData.pagination,
        }),
      );
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to fetch banned users";
      dispatch(getBannedUsersError(message));
    }
  };
}

/**
 * Ban user (admin)
 */
export function banUser(userId: string, reason: string) {
  return async function (dispatch: Dispatch) {
    dispatch(banUserStart());
    try {
      const response = await axiosInstance.post<ApiResponse<BannedUser>>(
        COMMUNITY_ENDPOINTS.BAN_USER,
        { userId, reason },
      );
      dispatch(banUserSuccess(response.data.data));
      return response.data.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to ban user";
      dispatch(banUserError(message));
      throw error;
    }
  };
}

/**
 * Unban user (admin)
 */
export function unbanUser(userId: string) {
  return async function (dispatch: Dispatch) {
    dispatch(unbanUserStart());
    try {
      await axiosInstance.post(COMMUNITY_ENDPOINTS.UNBAN_USER, { userId });
      dispatch(unbanUserSuccess(userId));
      return userId;
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to unban user";
      dispatch(unbanUserError(message));
      throw error;
    }
  };
}

/**
 * Get all categories
 */
export function getAllCategories() {
  return async function (dispatch: Dispatch) {
    dispatch(getAllCategoriesStart());
    try {
      const response = await axiosInstance.get<ApiResponse<any>>(
        COMMUNITY_ENDPOINTS.GET_ALL_CATEGORIES,
      );
      const responseData = response.data.data;
      // Handle both direct array and { data: [...] } response structures
      const categories = Array.isArray(responseData)
        ? responseData
        : (responseData?.data || responseData || []);
      dispatch(getAllCategoriesSuccess(categories));
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to fetch categories";
      dispatch(getAllCategoriesError(message));
    }
  };
}

/**
 * Create category (admin)
 */
export function createCategory(data: {
  name: string;
  description?: string;
  color?: string;
}) {
  return async function (dispatch: Dispatch) {
    dispatch(createCategoryStart());
    try {
      const response = await axiosInstance.post<ApiResponse<any>>(
        COMMUNITY_ENDPOINTS.CREATE_CATEGORY,
        data,
      );

      // Handle nested response structure: { data: { category: {...} } }
      let categoryData: Category;
      const responseData = response.data.data;

      if (responseData?.category) {
        // Backend returns { category: {...} }
        categoryData = responseData.category;
      } else if (responseData && responseData.id) {
        // Fallback: direct category object
        categoryData = responseData;
      } else {
        throw new Error("Invalid category response structure");
      }

      if (!categoryData.id || !categoryData.name) {
        throw new Error("Category missing required fields");
      }

      dispatch(createCategorySuccess(categoryData));
      return categoryData;
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || error.message || "Failed to create category";
      dispatch(createCategoryError(message));
      throw error;
    }
  };
}

/**
 * Delete category (admin)
 */
export function deleteCategory(categoryId: number) {
  return async function (dispatch: Dispatch) {
    try {
      await axiosInstance.delete(
        COMMUNITY_ENDPOINTS.DELETE_CATEGORY(categoryId),
      );
      dispatch(deleteCategorySuccess(categoryId));
    } catch (error: any) {
      // Silently fail for delete category
    }
  };
}

/**
 * Get post likes
 */
export function getPostLikes(postId: string, params?: { page?: number; limit?: number }) {
  return async function (dispatch: Dispatch) {
    dispatch(getPostLikesStart(postId));
    try {
      const response = await axiosInstance.get<ApiResponse<any>>(
        COMMUNITY_ENDPOINTS.GET_POST_LIKES(postId),
        { params },
      );
      const responseData = response.data.data;
      dispatch(
        getPostLikesSuccess({
          postId,
          data: responseData.items || [],
          pagination: responseData.pagination,
        }),
      );
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to fetch post likes";
      dispatch(getPostLikesError({ postId, error: message }));
    }
  };
}

/**
 * Get post comments
 */
export function getPostComments(postId: string, params?: { page?: number; limit?: number }) {
  return async function (dispatch: Dispatch) {
    dispatch(getPostCommentsStart(postId));
    try {
      const response = await axiosInstance.get<ApiResponse<any>>(
        COMMUNITY_ENDPOINTS.GET_POST_COMMENTS(postId),
        { params },
      );
      const responseData = response.data.data;
      dispatch(
        getPostCommentsSuccess({
          postId,
          data: responseData.items || [],
          pagination: responseData.pagination,
        }),
      );
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to fetch post comments";
      dispatch(getPostCommentsError({ postId, error: message }));
    }
  };
}
