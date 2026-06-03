import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "./redux";
import {
  setPublishedSearch,
  setPublishedCategory,
  setPublishedPage,
  setAdminSearch,
  setAdminCategory,
  setAdminStatus,
  setAdminPage,
} from "@/store/slices/blogSlice";

interface UseBlogsOptions {
  type: "admin" | "student";
}

export function useBlogs({ type }: UseBlogsOptions) {
  const dispatch = useAppDispatch();

  if (type === "admin") {
    const {
      adminBlogs,
      adminPage,
      adminLimit,
      adminPagination,
      adminStats,
      adminSearch,
      adminCategory,
      adminStatus,
      loadingAdminBlogs,
      error,
    } = useAppSelector((state) => state.blogs);

    const handleSearch = useCallback(
      (value: string) => {
        dispatch(setAdminSearch(value));
      },
      [dispatch]
    );

    const handleCategoryChange = useCallback(
      (value: string) => {
        dispatch(setAdminCategory(value));
      },
      [dispatch]
    );

    const handleStatusChange = useCallback(
      (value: "draft" | "published" | "all") => {
        dispatch(setAdminStatus(value));
      },
      [dispatch]
    );

    const handlePageChange = useCallback(
      (newPage: number) => {
        dispatch(setAdminPage(newPage));
      },
      [dispatch]
    );

    return {
      blogs: adminBlogs,
      page: adminPage,
      limit: adminLimit,
      pagination: adminPagination,
      stats: adminStats,
      search: adminSearch,
      category: adminCategory,
      status: adminStatus,
      loading: loadingAdminBlogs,
      error,
      handleSearch,
      handleCategoryChange,
      handleStatusChange,
      handlePageChange,
    };
  } else {
    const {
      publishedBlogs,
      publishedPage,
      publishedPagination,
      publishedSearch,
      publishedCategory,
      loadingPublishedBlogs,
      error,
    } = useAppSelector((state) => state.blogs);

    const handleSearch = useCallback(
      (value: string) => {
        dispatch(setPublishedSearch(value));
      },
      [dispatch]
    );

    const handleCategoryChange = useCallback(
      (value: string) => {
        dispatch(setPublishedCategory(value));
      },
      [dispatch]
    );

    const handlePageChange = useCallback(
      (newPage: number) => {
        dispatch(setPublishedPage(newPage));
      },
      [dispatch]
    );

    return {
      blogs: publishedBlogs,
      page: publishedPage,
      pagination: publishedPagination,
      search: publishedSearch,
      category: publishedCategory,
      loading: loadingPublishedBlogs,
      error,
      handleSearch,
      handleCategoryChange,
      handlePageChange,
    };
  }
}
