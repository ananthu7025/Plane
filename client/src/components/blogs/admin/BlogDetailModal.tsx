/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAppSelector } from "@/hooks/redux";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, MessageSquare, Calendar, User, Tag } from "lucide-react";

interface BlogDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
}

export function BlogDetailModal({
  isOpen,
  onClose,
  onEdit,
}: BlogDetailModalProps) {
  const { selectedBlog } = useAppSelector((state) => state.blogs);

  if (!selectedBlog) return null;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not published";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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

  const calculateReadTime = (content: string) => {
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / 200);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{selectedBlog.title}</DialogTitle>
          <DialogDescription>View detailed blog information</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cover Image */}
          {selectedBlog.coverImageUrl && (
            <img
              src={selectedBlog.coverImageUrl}
              alt={selectedBlog.title}
              className="w-full h-64 object-cover rounded-lg"
            />
          )}

          {/* Meta Information */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-xs text-gray-600 font-medium">Status</div>
              <Badge className={`mt-1 ${getStatusColor(selectedBlog.status)}`}>
                {selectedBlog.status}
              </Badge>
            </div>

            <div className="bg-gray-50 p-3 rounded">
              <div className="flex items-center gap-1 text-xs text-gray-600 font-medium">
                <Eye className="w-3 h-3" />
                Views
              </div>
              <div className="text-lg font-semibold mt-1">
                {selectedBlog.viewCount}
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded">
              <div className="flex items-center gap-1 text-xs text-gray-600 font-medium">
                <MessageSquare className="w-3 h-3" />
                Likes
              </div>
              <div className="text-lg font-semibold mt-1">
                {selectedBlog.acknowledgementCount}
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded">
              <div className="text-xs text-gray-600 font-medium">
                Read Time
              </div>
              <div className="text-lg font-semibold mt-1">
                {calculateReadTime(selectedBlog.content)} min
              </div>
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Excerpt
            </h3>
            <p className="text-gray-700">{selectedBlog.excerpt}</p>
          </div>

          {/* Category */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Category
            </h3>
            <Badge variant="outline">{selectedBlog.category}</Badge>
          </div>

          {/* Content */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Content
            </h3>
            <div className="prose prose-sm max-w-none bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
              <p className="text-gray-700 whitespace-pre-wrap">
                {selectedBlog.content}
              </p>
            </div>
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            {selectedBlog.publishedDate && (
              <div>
                <div className="flex items-center gap-2 text-xs text-gray-600 font-medium mb-1">
                  <Calendar className="w-3 h-3" />
                  Published
                </div>
                <p className="text-sm text-gray-900">
                  {formatDate(selectedBlog.publishedDate)}
                </p>
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 text-xs text-gray-600 font-medium mb-1">
                <Calendar className="w-3 h-3" />
                Created
              </div>
              <p className="text-sm text-gray-900">
                {formatDate(selectedBlog.createdAt)}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs text-gray-600 font-medium mb-1">
                <Calendar className="w-3 h-3" />
                Last Updated
              </div>
              <p className="text-sm text-gray-900">
                {formatDate(selectedBlog.updatedAt)}
              </p>
            </div>
          </div>

          {/* Author */}
          {selectedBlog.authorId && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                <User className="w-4 h-4" />
                Author ID: {selectedBlog.authorId}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={onEdit} className="gap-2">
              Edit Blog
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
