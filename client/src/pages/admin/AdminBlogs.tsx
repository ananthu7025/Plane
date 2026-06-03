/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react";
import { useAppDispatch } from "@/hooks/redux";
import { fetchAdminBlogs, fetchCategories } from "@/store/slices/blogSlice";
import { AdminBlogList } from "@/components/blogs/admin/AdminBlogList";
import { usePermission } from "@/hooks/usePermission";
import { Permissions } from "@/lib/permissions";

export default function AdminBlogs() {
  const dispatch = useAppDispatch();
  const canManageBlogs = usePermission(Permissions.MANAGE_BLOGS);

  useEffect(() => {
    if (!canManageBlogs) return;
    dispatch(fetchAdminBlogs() as any);
    dispatch(fetchCategories() as any);
  }, [dispatch, canManageBlogs]);

  if (!canManageBlogs) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">You don't have permission to manage blogs.</p>
      </div>
    );
  }

  return <AdminBlogList />;
}
