/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  deleteBlog,
  publishBlog,
  setSelectedBlog,
} from "@/store/slices/blogSlice";
import type { Blog } from "@/types/blogs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Eye,
  Edit2,
  Trash2,
  MoreVertical,
  CheckCircle,
  Circle,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { BlogDetailModal } from "./BlogDetailModal";
import { BlogFormDialog } from "./BlogFormDialog";

interface AdminBlogCardProps {
  blog: Blog;
  onRefetch?: () => void;
}

export function AdminBlogCard({ blog, onRefetch }: AdminBlogCardProps) {
  const dispatch = useAppDispatch();
  const { deletingBlog, publishingBlog } = useAppSelector(
    (state) => state.blogs
  );

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const isDeleting = deletingBlog;
  const isPublishing = publishingBlog;

  const handleDelete = async () => {
    await dispatch(deleteBlog(blog.id) as any);
    setShowDeleteDialog(false);
    toast.success("Blog deleted successfully");
    onRefetch?.();
  };

  const handlePublish = async () => {
    const action = blog.status === "draft" ? "publish" : "unpublish";
    await dispatch(publishBlog(blog.id, action) as any);
    toast.success(`Blog ${action}ed successfully`);
    onRefetch?.();
  };

  const handleEdit = () => {
    dispatch(setSelectedBlog(blog));
    setShowEditDialog(true);
  };

  const handleView = () => {
    dispatch(setSelectedBlog(blog));
    setShowDetailModal(true);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not published";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <>
      <Card className="p-4 hover:shadow-lg transition-shadow">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Blog Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3">
              {/* Cover Image */}
              {blog.coverImageUrl && (
                <img
                  src={blog.coverImageUrl}
                  alt={blog.title}
                  className="w-16 h-16 rounded object-cover flex-shrink-0"
                />
              )}

              {/* Details */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {blog.title}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {blog.excerpt}
                </p>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <Badge variant="outline">{blog.category}</Badge>
                  <Badge className={getStatusColor(blog.status)}>
                    {blog.status}
                  </Badge>
                  {blog.publishedDate && (
                    <span className="text-xs text-gray-500">
                      Published {formatDate(blog.publishedDate)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm md:border-l md:pl-6 md:border-gray-200">
            <div className="flex items-center gap-1 text-gray-600">
              <Eye className="w-4 h-4" />
              <span>{blog.viewCount}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600">
              <MessageSquare className="w-4 h-4" />
              <span>{blog.acknowledgementCount}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleView}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              View
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit} className="gap-2">
                  <Edit2 className="w-4 h-4" />
                  Edit
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="gap-2"
                >
                  {blog.status === "draft" ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Publish
                    </>
                  ) : (
                    <>
                      <Circle className="w-4 h-4" />
                      Unpublish
                    </>
                  )}
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isDeleting}
                  className="gap-2 text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blog</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{blog.title}"? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Detail Modal */}
      {showDetailModal && (
        <BlogDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          onEdit={handleEdit}
        />
      )}

      {/* Edit Dialog */}
      {showEditDialog && (
        <BlogFormDialog
          isOpen={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          onSuccess={onRefetch}
          categories={[
            "Navigation",
            "Meteorology",
            "Aircraft Systems",
            "Regulations",
            "Exam Tips",
            "Career",
          ]}
          editingBlog={blog}
        />
      )}
    </>
  );
}
