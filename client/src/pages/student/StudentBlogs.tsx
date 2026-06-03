/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react";
import { useAppDispatch } from "@/hooks/redux";
import {
  fetchPublishedBlogs,
  fetchCategories,
} from "@/store/slices/blogSlice";
import { StudentBlogList } from "@/components/blogs/student/StudentBlogList";
import { StudentBlogDetail } from "@/components/blogs/student/StudentBlogDetail";
import { useParams } from "react-router-dom";

export default function StudentBlogs() {
  const dispatch = useAppDispatch();
  const { blogId } = useParams<{ blogId?: string }>();

  // Fetch blogs and categories on mount (only needed for list view)
  useEffect(() => {
    if (!blogId) {
      dispatch(fetchPublishedBlogs() as any);
      dispatch(fetchCategories() as any);
    }
  }, [dispatch, blogId]);

  // If a blogId is in the URL, show the detail view (StudentBlogDetail fetches it)
  if (blogId) {
    return <StudentBlogDetail />;
  }

  return <StudentBlogList />;
}
