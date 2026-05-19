/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";
import { motion } from "framer-motion";
import { ReplyItem } from "./ReplyItem";
import { LikeButton } from "./LikeButton";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { DeleteConfirmDialog } from "@/components/shared";
import type { Post } from "@/store/slices/communitySlice";
import { ANIMATION_VARIANTS } from "@/lib/communityConstants";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  togglePostLike,
  deletePost,
  getPostDetails,
  addReply,
} from "@/store/slices/communitySlice";
import {
  MessageCircle,
  Trash2,
  ChevronUp,
  ChevronDown,
  Loader2,
  Send,
} from "lucide-react";

// Reply validation schema
const replySchema = z.object({
  content: z
    .string()
    .min(1, "Reply cannot be empty")
    .max(1000, "Reply is too long"),
});

type ReplyFormData = z.infer<typeof replySchema>;

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onReplyAdded?: () => void;
}

const { item: itemVariants } = ANIMATION_VARIANTS;

export function PostCard({ post, currentUserId, onReplyAdded }: PostCardProps) {
  const dispatch = useAppDispatch();
  const [showReplies, setShowReplies] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const form = useForm<ReplyFormData>({
    resolver: zodResolver(replySchema),
    mode: "onSubmit",
    defaultValues: { content: "" },
  });

  const postReplies = useAppSelector(
    (state) => state.community.postReplies[post.id] || [],
  );
  const deletingPost = useAppSelector((state) => state.community.deletingPost);

  const isOwnPost = currentUserId && post.author?.id === currentUserId;

  useEffect(() => {
    if (showReplies && postReplies.length === 0 && post.commentCount > 0) {
      dispatch(getPostDetails(post.id) as any);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showReplies, post.id, dispatch]);

  const handleToggleLike = async () => {
    try {
      await dispatch(togglePostLike(post.id) as any);
    } catch (err) {
      console.log(err);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await dispatch(deletePost(post.id) as any);
      setDeleteConfirmOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmitReply = async (data: ReplyFormData) => {
    if (!currentUserId) return;
    if (!data.content || data.content.trim().length === 0) return;

    setIsSubmittingReply(true);
    try {
      await dispatch(addReply(post.id, data.content) as any);
      await dispatch(getPostDetails(post.id) as any);
      form.reset({ content: "" });
      onReplyAdded?.();
    } catch (err) {
      // Error handled by Redux
    } finally {
      setIsSubmittingReply(false);
    }
  };

  return (
    <motion.div
      variants={itemVariants}
      className="rounded-lg border border-border bg-background p-4 hover:bg-muted/30 transition-colors"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <Avatar className="w-10 h-10 flex-shrink-0">
            <AvatarImage src={post.isAnonymous ? "" : post.author?.avatar} />
            <AvatarFallback>
              {post.isAnonymous ? "?" : post.author?.name?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-sm">
                {post.isAnonymous
                  ? "Anonymous"
                  : post.author?.name || "Unknown"}
              </p>
              <Badge variant="muted" className="text-xs">
                {post.category}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(post.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Delete button for own posts */}
        {isOwnPost && (
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:bg-destructive/10 flex-shrink-0"
            onClick={() => setDeleteConfirmOpen(true)}
            disabled={deletingPost}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Content */}
      <p className="text-sm text-foreground mb-4 line-clamp-4">
        {post.content}
      </p>

      {/* Footer with actions */}
      <div className="flex items-center gap-4 pt-3 border-t border-border/50">
        <LikeButton
          likeCount={post.likeCount}
          postId={post.id}
          onToggleLike={handleToggleLike}
        />

        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-xs"
          onClick={() => setShowReplies(!showReplies)}
        >
          <MessageCircle className="w-4 h-4" />
          <span>{post.commentCount}</span>
          {showReplies ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </Button>
      </div>

      {/* Replies section */}
      {showReplies && (
        <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
          {postReplies.length > 0 ? (
            <div className="space-y-3">
              {postReplies.map((reply) => (
                <ReplyItem
                  key={reply.id}
                  reply={reply}
                  postId={post.id}
                  currentUserId={currentUserId}
                  onReplyDeleted={onReplyAdded}
                />
              ))}
            </div>
          ) : post.commentCount > 0 ? (
            <div className="flex items-center justify-center py-4 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span className="text-sm">Loading replies...</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No replies yet
            </p>
          )}

          {/* Reply form */}
          {currentUserId && (
            <form
              onSubmit={form.handleSubmit(handleSubmitReply)}
              className="mt-4 pt-3 border-t border-border/50 space-y-2"
            >
              <div className="flex gap-2">
                <textarea
                  {...form.register("content")}
                  placeholder="Add a reply..."
                  className="flex-1 resize-none min-h-[40px] rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-ring focus-visible:ring-offset-background"
                  required
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={isSubmittingReply}
                  className="flex-shrink-0 h-[40px]"
                >
                  {isSubmittingReply ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {form.formState.errors.content && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.content.message}
                </p>
              )}
            </form>
          )}
        </div>
      )}
      <DeleteConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Delete Post"
        itemName="this post"
        isDeleting={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </motion.div>
  );
}
