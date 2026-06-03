/* eslint-disable @typescript-eslint/no-explicit-any */
import { axiosInstance } from "@/api/client";
import { createSlice } from "@reduxjs/toolkit";
import type { Dispatch, PayloadAction } from "@reduxjs/toolkit";
import { BLOGS_ENDPOINTS } from "@/lib/constants";

// API Response wrapper type
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  } | null;
  timestamp: string;
}

// Types
export interface Blog {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  status: "draft" | "published";
  authorId: string | null;
  coverImageUrl: string | null;
  viewCount: number;
  acknowledgementCount: number;
  commentCount: number;
  publishedDate: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  userAcknowledged?: boolean;
  readTime?: number;
}

export interface BlogPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface BlogStats {
  totalBlogs: number;
  totalPublished: number;
  totalViews: number;
  totalAcknowledgements: number;
}

// State Interface
interface BlogSliceState {
  // Published blogs (student view)
  publishedBlogs: Blog[];
  publishedPage: number;
  publishedLimit: number;
  publishedTotal: number;
  publishedPagination: BlogPagination | null;
  publishedSearch: string;
  publishedCategory: string;

  // Admin blogs view
  adminBlogs: Blog[];
  adminPage: number;
  adminLimit: number;
  adminPagination: BlogPagination | null;
  adminStats: BlogStats | null;
  adminSearch: string;
  adminCategory: string;
  adminStatus: "draft" | "published" | "all";

  // Blog categories
  categories: string[];

  // Single blog detail
  selectedBlog: Blog | null;

  // Form data for create/edit
  formData: Partial<Blog> | null;

  // Loading states
  loadingPublishedBlogs: boolean;
  loadingAdminBlogs: boolean;
  loadingDetail: boolean;
  loadingCategories: boolean;
  creatingBlog: boolean;
  updatingBlog: boolean;
  deletingBlog: boolean;
  publishingBlog: boolean;
  acknowledging: boolean;
  recordingView: boolean;

  // Error & Success messages
  error: string | null;
  successMessage: string | null;
}

const initialState: BlogSliceState = {
  // Published blogs
  publishedBlogs: [],
  publishedPage: 1,
  publishedLimit: 20,
  publishedTotal: 0,
  publishedPagination: null,
  publishedSearch: "",
  publishedCategory: "",

  // Admin blogs
  adminBlogs: [],
  adminPage: 1,
  adminLimit: 20,
  adminPagination: null,
  adminStats: null,
  adminSearch: "",
  adminCategory: "",
  adminStatus: "all",

  // Categories
  categories: [],

  // Detail
  selectedBlog: null,

  // Form
  formData: null,

  // Loading
  loadingPublishedBlogs: false,
  loadingAdminBlogs: false,
  loadingDetail: false,
  loadingCategories: false,
  creatingBlog: false,
  updatingBlog: false,
  deletingBlog: false,
  publishingBlog: false,
  acknowledging: false,
  recordingView: false,

  // Messages
  error: null,
  successMessage: null,
};

// Slice
const blogSlice = createSlice({
  name: "blogs",
  initialState,
  reducers: {
    // Filter & Search - Published
    setPublishedSearch: (state, action: PayloadAction<string>) => {
      state.publishedSearch = action.payload;
      state.publishedPage = 1;
    },
    setPublishedCategory: (state, action: PayloadAction<string>) => {
      state.publishedCategory = action.payload;
      state.publishedPage = 1;
    },
    setPublishedPage: (state, action: PayloadAction<number>) => {
      state.publishedPage = action.payload;
    },

    // Filter & Search - Admin
    setAdminSearch: (state, action: PayloadAction<string>) => {
      state.adminSearch = action.payload;
      state.adminPage = 1;
    },
    setAdminCategory: (state, action: PayloadAction<string>) => {
      state.adminCategory = action.payload;
      state.adminPage = 1;
    },
    setAdminStatus: (state, action: PayloadAction<"draft" | "published" | "all">) => {
      state.adminStatus = action.payload;
      state.adminPage = 1;
    },
    setAdminPage: (state, action: PayloadAction<number>) => {
      state.adminPage = action.payload;
    },

    // Detail
    setSelectedBlog: (state, action: PayloadAction<Blog>) => {
      state.selectedBlog = action.payload;
    },
    clearDetail: (state) => {
      state.selectedBlog = null;
    },

    // Form
    setFormData: (state, action: PayloadAction<Partial<Blog>>) => {
      state.formData = action.payload;
    },
    clearFormData: (state) => {
      state.formData = null;
    },

    // UI State
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },

    // Categories
    getCategoriesStart: (state) => {
      state.loadingCategories = true;
      state.error = null;
    },
    getCategoriesSuccess: (state, action: PayloadAction<string[]>) => {
      state.loadingCategories = false;
      state.categories = action.payload;
    },
    getCategoriesError: (state, action: PayloadAction<string>) => {
      state.loadingCategories = false;
      state.error = action.payload;
    },

    // Published Blogs - Load
    getPublishedBlogsStart: (state) => {
      state.loadingPublishedBlogs = true;
      state.error = null;
    },
    getPublishedBlogsSuccess: (
      state,
      action: PayloadAction<{ blogs: Blog[]; pagination: BlogPagination }>
    ) => {
      state.loadingPublishedBlogs = false;
      state.publishedBlogs = action.payload.blogs;
      state.publishedPagination = action.payload.pagination;
      state.publishedTotal = action.payload.pagination.total;
    },
    getPublishedBlogsError: (state, action: PayloadAction<string>) => {
      state.loadingPublishedBlogs = false;
      state.error = action.payload;
    },

    // Admin Blogs - Load
    getAdminBlogsStart: (state) => {
      state.loadingAdminBlogs = true;
      state.error = null;
    },
    getAdminBlogsSuccess: (
      state,
      action: PayloadAction<{
        blogs: Blog[];
        pagination: BlogPagination;
        stats: BlogStats;
      }>
    ) => {
      state.loadingAdminBlogs = false;
      state.adminBlogs = action.payload.blogs;
      state.adminPagination = action.payload.pagination;
      state.adminStats = action.payload.stats;
    },
    getAdminBlogsError: (state, action: PayloadAction<string>) => {
      state.loadingAdminBlogs = false;
      state.error = action.payload;
    },

    // Blog Detail
    getBlogDetailStart: (state) => {
      state.loadingDetail = true;
      state.error = null;
    },
    getBlogDetailSuccess: (state, action: PayloadAction<Blog>) => {
      state.loadingDetail = false;
      state.selectedBlog = action.payload;
    },
    getBlogDetailError: (state, action: PayloadAction<string>) => {
      state.loadingDetail = false;
      state.error = action.payload;
    },

    // Create Blog
    createBlogStart: (state) => {
      state.creatingBlog = true;
      state.error = null;
    },
    createBlogSuccess: (state) => {
      state.creatingBlog = false;
      state.successMessage = "Blog created successfully!";
      state.formData = null;
      state.adminPage = 1;
    },
    createBlogError: (state, action: PayloadAction<string>) => {
      state.creatingBlog = false;
      state.error = action.payload;
    },

    // Update Blog
    updateBlogStart: (state) => {
      state.updatingBlog = true;
      state.error = null;
    },
    updateBlogSuccess: (state, action: PayloadAction<Blog>) => {
      state.updatingBlog = false;
      state.successMessage = "Blog updated successfully!";
      state.formData = null;
      // Update in admin list
      const index = state.adminBlogs.findIndex(b => b.id === action.payload.id);
      if (index !== -1) {
        state.adminBlogs[index] = action.payload;
      }
      // Update selected if viewing
      if (state.selectedBlog?.id === action.payload.id) {
        state.selectedBlog = action.payload;
      }
    },
    updateBlogError: (state, action: PayloadAction<string>) => {
      state.updatingBlog = false;
      state.error = action.payload;
    },

    // Delete Blog
    deleteBlogStart: (state) => {
      state.deletingBlog = true;
      state.error = null;
    },
    deleteBlogSuccess: (state, action: PayloadAction<{ id: number }>) => {
      state.deletingBlog = false;
      state.successMessage = "Blog deleted successfully!";
      state.adminBlogs = state.adminBlogs.filter(b => b.id !== action.payload.id);
      if (state.selectedBlog?.id === action.payload.id) {
        state.selectedBlog = null;
      }
    },
    deleteBlogError: (state, action: PayloadAction<string>) => {
      state.deletingBlog = false;
      state.error = action.payload;
    },

    // Publish/Unpublish Blog
    publishBlogStart: (state) => {
      state.publishingBlog = true;
      state.error = null;
    },
    publishBlogSuccess: (state, action: PayloadAction<Blog>) => {
      state.publishingBlog = false;
      state.successMessage = `Blog ${action.payload.status}ed successfully!`;
      const index = state.adminBlogs.findIndex(b => b.id === action.payload.id);
      if (index !== -1) {
        state.adminBlogs[index] = action.payload;
      }
      if (state.selectedBlog?.id === action.payload.id) {
        state.selectedBlog = action.payload;
      }
    },
    publishBlogError: (state, action: PayloadAction<string>) => {
      state.publishingBlog = false;
      state.error = action.payload;
    },

    // Acknowledge Blog (Like)
    acknowledgeBlogStart: (state) => {
      state.acknowledging = true;
      state.error = null;
    },
    acknowledgeBlogSuccess: (
      state,
      action: PayloadAction<{ acknowledged: boolean; acknowledgementCount: number }>
    ) => {
      state.acknowledging = false;
      if (state.selectedBlog) {
        state.selectedBlog.userAcknowledged = action.payload.acknowledged;
        state.selectedBlog.acknowledgementCount = action.payload.acknowledgementCount;
      }
      // Update in published list
      const index = state.publishedBlogs.findIndex(b => b.id === state.selectedBlog?.id);
      if (index !== -1) {
        state.publishedBlogs[index].userAcknowledged = action.payload.acknowledged;
        state.publishedBlogs[index].acknowledgementCount = action.payload.acknowledgementCount;
      }
    },
    acknowledgeBlogError: (state, action: PayloadAction<string>) => {
      state.acknowledging = false;
      state.error = action.payload;
    },

    // Record View
    recordViewStart: (state) => {
      state.recordingView = true;
    },
    recordViewSuccess: (state, action: PayloadAction<{ viewCount: number }>) => {
      state.recordingView = false;
      if (state.selectedBlog) {
        state.selectedBlog.viewCount = action.payload.viewCount;
      }
      // Update in published list
      const index = state.publishedBlogs.findIndex(b => b.id === state.selectedBlog?.id);
      if (index !== -1) {
        state.publishedBlogs[index].viewCount = action.payload.viewCount;
      }
    },
    recordViewError: (state) => {
      state.recordingView = false;
    },
  },
});

export const {
  // Published filters
  setPublishedSearch,
  setPublishedCategory,
  setPublishedPage,

  // Admin filters
  setAdminSearch,
  setAdminCategory,
  setAdminStatus,
  setAdminPage,

  // Detail
  setSelectedBlog,
  clearDetail,

  // Form
  setFormData,
  clearFormData,

  // UI state
  clearError,
  clearSuccessMessage,

  // Categories
  getCategoriesStart,
  getCategoriesSuccess,
  getCategoriesError,

  // Published Blogs
  getPublishedBlogsStart,
  getPublishedBlogsSuccess,
  getPublishedBlogsError,

  // Admin Blogs
  getAdminBlogsStart,
  getAdminBlogsSuccess,
  getAdminBlogsError,

  // Detail
  getBlogDetailStart,
  getBlogDetailSuccess,
  getBlogDetailError,

  // Create
  createBlogStart,
  createBlogSuccess,
  createBlogError,

  // Update
  updateBlogStart,
  updateBlogSuccess,
  updateBlogError,

  // Delete
  deleteBlogStart,
  deleteBlogSuccess,
  deleteBlogError,

  // Publish
  publishBlogStart,
  publishBlogSuccess,
  publishBlogError,

  // Acknowledge
  acknowledgeBlogStart,
  acknowledgeBlogSuccess,
  acknowledgeBlogError,

  // View
  recordViewStart,
  recordViewSuccess,
  recordViewError,
} = blogSlice.actions;

// Thunks
export const fetchCategories = () => async (dispatch: Dispatch) => {
  dispatch(getCategoriesStart());
  try {
    const response = await axiosInstance.get<ApiResponse<{ categories: string[] }>>(
      BLOGS_ENDPOINTS.GET_CATEGORIES
    );
    if (response.data.success) {
      dispatch(getCategoriesSuccess(response.data.data.categories || []));
    } else {
      dispatch(getCategoriesError(response.data.error?.message || "Failed to fetch categories"));
    }
  } catch (error: any) {
    dispatch(getCategoriesError(error.response?.data?.error?.message || "Failed to fetch categories"));
  }
};

export const fetchPublishedBlogs =
  (search?: string, category?: string, page: number = 1, limit: number = 20) =>
  async (dispatch: Dispatch) => {
    dispatch(getPublishedBlogsStart());
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (category) params.append("category", category);
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const response = await axiosInstance.get<
        ApiResponse<{ blogs: Blog[]; pagination: BlogPagination }>
      >(`${BLOGS_ENDPOINTS.GET_BLOGS}?${params.toString()}`);

      if (response.data.success) {
        dispatch(getPublishedBlogsSuccess(response.data.data));
      } else {
        dispatch(getPublishedBlogsError(response.data.error?.message || "Failed to fetch blogs"));
      }
    } catch (error: any) {
      dispatch(getPublishedBlogsError(error.response?.data?.error?.message || "Failed to fetch blogs"));
    }
  };

export const fetchAdminBlogs =
  (search?: string, category?: string, status?: string, page: number = 1, limit: number = 20) =>
  async (dispatch: Dispatch) => {
    dispatch(getAdminBlogsStart());
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (category) params.append("category", category);
      if (status) params.append("status", status);
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const response = await axiosInstance.get<
        ApiResponse<{ blogs: Blog[]; pagination: BlogPagination; stats: BlogStats }>
      >(`${BLOGS_ENDPOINTS.GET_ADMIN_BLOGS}?${params.toString()}`);

      if (response.data.success) {
        dispatch(getAdminBlogsSuccess(response.data.data));
      } else {
        dispatch(getAdminBlogsError(response.data.error?.message || "Failed to fetch blogs"));
      }
    } catch (error: any) {
      dispatch(getAdminBlogsError(error.response?.data?.error?.message || "Failed to fetch blogs"));
    }
  };

export const fetchBlogDetail = (blogId: number) => async (dispatch: Dispatch) => {
  dispatch(getBlogDetailStart());
  try {
    const response = await axiosInstance.get<ApiResponse<Blog>>(
      BLOGS_ENDPOINTS.GET_BLOG_DETAIL(blogId)
    );
    if (response.data.success) {
      dispatch(getBlogDetailSuccess(response.data.data));
    } else {
      dispatch(getBlogDetailError(response.data.error?.message || "Failed to fetch blog"));
    }
  } catch (error: any) {
    dispatch(getBlogDetailError(error.response?.data?.error?.message || "Failed to fetch blog"));
  }
};

export const createBlog = (data: FormData) => async (dispatch: Dispatch) => {
  dispatch(createBlogStart());
  try {
    const response = await axiosInstance.post<ApiResponse<Blog>>(
      BLOGS_ENDPOINTS.CREATE_BLOG,
      data,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    if (response.data.success) {
      dispatch(createBlogSuccess());
    } else {
      dispatch(createBlogError(response.data.error?.message || "Failed to create blog"));
    }
  } catch (error: any) {
    dispatch(createBlogError(error.response?.data?.error?.message || "Failed to create blog"));
  }
};

export const updateBlog = (blogId: number, data: FormData) => async (dispatch: Dispatch) => {
  dispatch(updateBlogStart());
  try {
    const response = await axiosInstance.put<ApiResponse<Blog>>(
      BLOGS_ENDPOINTS.UPDATE_BLOG(blogId),
      data,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    if (response.data.success) {
      dispatch(updateBlogSuccess(response.data.data));
    } else {
      dispatch(updateBlogError(response.data.error?.message || "Failed to update blog"));
    }
  } catch (error: any) {
    dispatch(updateBlogError(error.response?.data?.error?.message || "Failed to update blog"));
  }
};

export const deleteBlog = (blogId: number) => async (dispatch: Dispatch) => {
  dispatch(deleteBlogStart());
  try {
    const response = await axiosInstance.delete<ApiResponse<null>>(
      BLOGS_ENDPOINTS.DELETE_BLOG(blogId)
    );
    if (response.data.success) {
      dispatch(deleteBlogSuccess({ id: blogId }));
    } else {
      dispatch(deleteBlogError(response.data.error?.message || "Failed to delete blog"));
    }
  } catch (error: any) {
    dispatch(deleteBlogError(error.response?.data?.error?.message || "Failed to delete blog"));
  }
};

export const publishBlog = (blogId: number, action: "publish" | "unpublish") =>
  async (dispatch: Dispatch) => {
    dispatch(publishBlogStart());
    try {
      const response = await axiosInstance.patch<ApiResponse<Blog>>(
        BLOGS_ENDPOINTS.PUBLISH_BLOG(blogId),
        { action }
      );
      if (response.data.success) {
        dispatch(publishBlogSuccess(response.data.data));
      } else {
        dispatch(publishBlogError(response.data.error?.message || "Failed to publish blog"));
      }
    } catch (error: any) {
      dispatch(publishBlogError(error.response?.data?.error?.message || "Failed to publish blog"));
    }
  };

export const acknowledgeBlog = (blogId: number) => async (dispatch: Dispatch) => {
  dispatch(acknowledgeBlogStart());
  try {
    const response = await axiosInstance.post<
      ApiResponse<{ acknowledged: boolean; acknowledgementCount: number }>
    >(BLOGS_ENDPOINTS.ACKNOWLEDGE_BLOG(blogId), {});
    if (response.data.success) {
      dispatch(acknowledgeBlogSuccess(response.data.data));
    } else {
      dispatch(acknowledgeBlogError(response.data.error?.message || "Failed to acknowledge blog"));
    }
  } catch (error: any) {
    dispatch(acknowledgeBlogError(error.response?.data?.error?.message || "Failed to acknowledge blog"));
  }
};

export const recordBlogView = (blogId: number) => async (dispatch: Dispatch) => {
  dispatch(recordViewStart());
  try {
    const response = await axiosInstance.post<ApiResponse<{ viewCount: number }>>(
      BLOGS_ENDPOINTS.RECORD_VIEW(blogId),
      {}
    );
    if (response.data.success) {
      dispatch(recordViewSuccess(response.data.data));
    } else {
      dispatch(recordViewError());
    }
  } catch (error) {
    dispatch(recordViewError());
  }
};

export default blogSlice.reducer;
