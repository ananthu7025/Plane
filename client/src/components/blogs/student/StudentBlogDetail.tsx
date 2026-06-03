/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  fetchBlogDetail,
  recordBlogView,
  acknowledgeBlog,
} from "@/store/slices/blogSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Plane,
  Share2,
  Check,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function StudentBlogDetail() {
  const { blogId } = useParams<{ blogId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedBlog, loadingDetail, acknowledging } = useAppSelector(
    (state) => state.blogs
  );
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (blogId) {
      const id = parseInt(blogId);
      dispatch(fetchBlogDetail(id) as any);
      dispatch(recordBlogView(id) as any);
    }
  }, [blogId]);

  const handleAcknowledge = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to acknowledge articles");
      return;
    }
    if (selectedBlog) {
      await dispatch(acknowledgeBlog(selectedBlog.id) as any);
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/student/blogs/${blogId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    toast.success("Link copied!", {
      description: "Share link has been copied to clipboard.",
    });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const calculateReadTime = (content: string) => {
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / 200);
  };

  if (loadingDetail) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!selectedBlog) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg mb-4">Article not found</p>
        <Button variant="ghost" onClick={() => navigate("/student/blogs")}>
          ← Back to Blogs
        </Button>
      </div>
    );
  }

  const readTime = calculateReadTime(selectedBlog.content);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <Button
          variant="ghost"
          onClick={() => navigate("/student/blogs")}
          className="mb-4"
        >
          ← Back to Blogs
        </Button>

        <Card variant="default">
          <div className="aspect-[3/1] overflow-hidden">
            <img
              src={
                selectedBlog.coverImageUrl ||
                "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&h=400&fit=crop"
              }
              alt={selectedBlog.title}
              className="w-full h-full object-cover"
            />
          </div>
          <CardContent className="p-8">
            <Badge variant="muted" className="mb-4">
              {selectedBlog.category}
            </Badge>
            <h1 className="font-display text-3xl font-bold mb-4">
              {selectedBlog.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8 pb-8 border-b border-border">
              <span>Admin</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(selectedBlog.publishedDate)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {readTime} min read
              </span>
            </div>

            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-muted-foreground mb-6">
                {selectedBlog.excerpt}
              </p>
              <p className="whitespace-pre-wrap">{selectedBlog.content}</p>
            </div>

            {/* Acknowledge & Share */}
            <div className="flex items-center gap-4 mt-8 pt-6 border-t border-border">
              <Button
                variant={selectedBlog.userAcknowledged ? "default" : "outline"}
                className="gap-2"
                disabled={acknowledging}
                onClick={handleAcknowledge}
              >
                <Plane
                  className={`w-4 h-4 ${
                    selectedBlog.userAcknowledged ? "fill-primary-foreground" : ""
                  }`}
                />
                {selectedBlog.userAcknowledged ? "Acknowledged" : "Acknowledge"}{" "}
                ✈️
                <span className="ml-1 text-sm">
                  {selectedBlog.acknowledgementCount}
                </span>
              </Button>
              <Button variant="outline" className="gap-2" onClick={handleShare}>
                {copiedLink ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
                {copiedLink ? "Copied!" : "Share"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
