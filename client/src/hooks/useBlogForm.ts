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
      return dispatch(
        createBlog({
          title: data.title,
          excerpt: data.excerpt,
          content: data.content,
          category: data.category,
          status: data.status,
          coverImageUrl: data.coverImageUrl || undefined,
        }) as any
      );
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
      return dispatch(
        updateBlog(blogId, {
          title: data.title,
          excerpt: data.excerpt,
          content: data.content,
          category: data.category,
          status: data.status,
          coverImageUrl: data.coverImageUrl || undefined,
        }) as any
      );
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
