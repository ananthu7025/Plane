import { useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "./redux";
import {
  createBlog,
  updateBlog,
  setSelectedBlog,
} from "@/store/slices/blogSlice";
import type { Blog } from "@/types/blogs";

interface UseBlogFormOptions {
  onSuccess?: () => void;
}

export function useBlogForm({ onSuccess }: UseBlogFormOptions = {}) {
  const dispatch = useAppDispatch();
  const {
    creatingBlog,
    updatingBlog,
    successMessage,
    error,
    selectedBlog,
  } = useAppSelector((state) => state.blogs);

  // Show success and call callback
  useEffect(() => {
    if (successMessage && onSuccess) {
      onSuccess();
    }
  }, [successMessage, onSuccess]);

  const handleCreateBlog = useCallback(
    async (data: {
      title: string;
      excerpt: string;
      content: string;
      category: string;
      status: "draft" | "published";
      coverImageUrl?: string;
    }) => {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("excerpt", data.excerpt);
      formData.append("content", data.content);
      formData.append("category", data.category);
      formData.append("status", data.status);
      if (data.coverImageUrl) formData.append("coverImageUrl", data.coverImageUrl);
      return dispatch(createBlog(formData) as any);
    },
    [dispatch]
  );

  const handleUpdateBlog = useCallback(
    async (
      blogId: number,
      data: {
        title: string;
        excerpt: string;
        content: string;
        category: string;
        status: "draft" | "published";
        coverImageUrl?: string;
      }
    ) => {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("excerpt", data.excerpt);
      formData.append("content", data.content);
      formData.append("category", data.category);
      formData.append("status", data.status);
      if (data.coverImageUrl) formData.append("coverImageUrl", data.coverImageUrl);
      return dispatch(updateBlog(blogId, formData) as any);
    },
    [dispatch]
  );

  const handleSelectBlog = useCallback(
    (blog: Blog | null) => {
      dispatch(setSelectedBlog(blog as any));
    },
    [dispatch]
  );

  const isLoading = creatingBlog || updatingBlog;
  const isEditing = !!selectedBlog;

  return {
    selectedBlog,
    isLoading,
    isEditing,
    successMessage,
    error,
    handleCreateBlog,
    handleUpdateBlog,
    handleSelectBlog,
  };
}
