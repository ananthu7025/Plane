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
import type { Post, Reply } from "@/store/slices/communitySlice";
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

// Recursive reply tree renderer component
function NestedReplyTree({
  replyGroup,
  postId,
  currentUserId,
  onReplyDeleted,
}: {
  replyGroup: any;
  postId: string;
  currentUserId?: string;
  onReplyDeleted?: () => void;
}) {
  return (
    <div>
      <ReplyItem
        reply={replyGroup.parent}
        postId={postId}
        currentUserId={currentUserId}
        onReplyDeleted={onReplyDeleted}
      />
      {replyGroup.nested.length > 0 && (
        <div className="space-y-2 mt-2">
          {replyGroup.nested.map((nestedGroup: any) => (
            <NestedReplyTree
              key={nestedGroup.parent.id}
              replyGroup={nestedGroup}
              postId={postId}
              currentUserId={currentUserId}
              onReplyDeleted={onReplyDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function PostCard({ post, currentUserId, onReplyAdded }: PostCardProps) {
  const dispatch = useAppDispatch();
  const [showReplies, setShowReplies] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
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
  const { user } = useAppSelector((state) => state.auth);

  const isOwnPost = currentUserId && post.author?.id === currentUserId;
  const isAdmin = user?.role === "ADMIN";
  const shouldShowActualAuthor = !post.isAnonymous || isAdmin;

  // Reverse replies to show oldest first (API returns newest first)
  // This ensures parent comments appear before their nested replies
  const orderedReplies = [...postReplies].reverse();

  // Helper function to recursively find nested replies
  const findNestedReplies = (parentId: string, mentionedAuthor?: string): Reply[] => {
    return orderedReplies.filter((nestedReply) => {
      // Don't include the parent comment itself
      if (nestedReply.id === parentId) return false;

      // New format: check parentCommentId (supports infinite nesting)
      if (nestedReply.parentCommentId === parentId) return true;

      // Old format: check @username mention (only for direct children)
      if (mentionedAuthor && nestedReply.content?.startsWith("@")) {
        const mentionMatch = nestedReply.content.match(/^@(\S+)\s+/);
        if (mentionMatch && mentionMatch[1] === mentionedAuthor) {
          return true;
        }
      }
      return false;
    });
  };

  // Helper function to recursively build nested reply tree
  const buildReplyTree = (parent: Reply): any => ({
    parent,
    nested: findNestedReplies(parent.id, parent.author?.name).map((child) => buildReplyTree(child)),
  });

  // Group replies: parent comments and their nested replies (with recursive support)
  // Support both new (parentCommentId) and old (@username) formats for backward compatibility
  const parentComments = orderedReplies.filter(
    (reply) => !reply.parentCommentId && !reply.content?.startsWith("@")
  );

  const groupedReplies = parentComments.map(buildReplyTree).filter((group) => {
    // Only keep groups where parent exists
    return group.parent;
  });

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
            <AvatarImage src={shouldShowActualAuthor ? post.author?.avatar : ""} />
            <AvatarFallback>
              {shouldShowActualAuthor ? (post.author?.name?.[0] || "U") : "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-sm">
                {shouldShowActualAuthor
                  ? post.author?.name || "Unknown"
                  : "Anonymous"}
              </p>
              {post.isAnonymous && isAdmin && (
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                  (Admin: {post.author?.name})
                </span>
              )}
              <Badge variant="muted" className="text-xs">
                {typeof post.category === "string" ? post.category : post.category?.name || "Uncategorized"}
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
      <div className="mb-3">
        <p className={`text-sm text-foreground ${!isExpanded ? 'line-clamp-4' : ''}`}>
          {post.content}
        </p>
        {post.content.split('\n').length > 4 && !isExpanded && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 text-primary p-0 h-auto"
            onClick={() => setIsExpanded(true)}
          >
            Read More
          </Button>
        )}
        {isExpanded && (post.content.split('\n').length > 4) && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 text-primary p-0 h-auto"
            onClick={() => setIsExpanded(false)}
          >
            Read Less
          </Button>
        )}
      </div>

      {/* Footer with actions */}
      <div className="flex items-center gap-4 pt-3 border-t border-border/50">
        <LikeButton
          likeCount={post.likeCount}
          postId={post.id}
          isLiked={post.isLiked || false}
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
            <div className="space-y-4">
              {groupedReplies.map((group, idx) => (
                <div key={`group-${idx}`}>
                  {/* Parent comment */}
                  <ReplyItem
                    key={group.parent.id}
                    reply={group.parent}
                    postId={post.id}
                    currentUserId={currentUserId}
                    onReplyDeleted={onReplyAdded}
                  />
                  {/* Nested replies (recursive) */}
                  {group.nested.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {group.nested.map((nestedGroup: any) => (
                        <NestedReplyTree
                          key={nestedGroup.parent.id}
                          replyGroup={nestedGroup}
                          postId={post.id}
                          currentUserId={currentUserId}
                          onReplyDeleted={onReplyAdded}
                        />
                      ))}
                    </div>
                  )}
                </div>
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
