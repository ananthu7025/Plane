import { useEffect, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "./redux";
import {
  fetchBlogDetail,
  acknowledgeBlog,
  recordBlogView,
  setSelectedBlog,
} from "@/store/slices/blogSlice";

export function useBlogDetail(blogId: number | string) {
  const dispatch = useAppDispatch();
  const {
    selectedBlog,
    loadingDetail,
    acknowledging,
    recordingView,
    error,
  } = useAppSelector((state) => state.blogs);

  // Fetch blog details on mount
  useEffect(() => {
    if (blogId) {
      dispatch(fetchBlogDetail(Number(blogId)) as any);
    }
  }, [blogId, dispatch]);

  // Record view on component mount
  useEffect(() => {
    if (selectedBlog?.id) {
      dispatch(recordBlogView(selectedBlog.id) as any);
    }
  }, [selectedBlog?.id, dispatch]);

  const handleToggleLike = useCallback(async () => {
    if (selectedBlog?.id) {
      await dispatch(acknowledgeBlog(selectedBlog.id) as any);
    }
  }, [selectedBlog?.id, dispatch]);

  const handleNavigateBack = useCallback(() => {
    dispatch(setSelectedBlog(null as any));
  }, [dispatch]);

  return {
    blog: selectedBlog,
    loading: loadingDetail,
    acknowledging,
    recordingView,
    error,
    handleToggleLike,
    handleNavigateBack,
  };
}
