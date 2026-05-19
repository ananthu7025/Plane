/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAppDispatch } from "@/hooks/redux";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Reply } from "@/store/slices/communitySlice";
import {
  Trash2,
  MessageCircle,
  Send,
  Loader2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  deleteReply,
  addReply,
  getPostDetails,
} from "@/store/slices/communitySlice";

// Nested reply validation schema
const nestedReplySchema = z.object({
  content: z
    .string()
    .min(1, "Reply cannot be empty")
    .max(1000, "Reply is too long"),
});

type NestedReplyFormData = z.infer<typeof nestedReplySchema>;

interface ReplyItemProps {
  reply: Reply;
  postId: string;
  currentUserId?: string;
  onReplyDeleted?: () => void;
}

export function ReplyItem({
  reply,
  postId,
  currentUserId,
  onReplyDeleted,
}: ReplyItemProps) {
  const dispatch = useAppDispatch();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isSubmittingNestedReply, setIsSubmittingNestedReply] = useState(false);

  const isOwnReply = currentUserId && reply.author?.id === currentUserId;

  // Parse nested reply format: "@username content"
  const isNestedReply = reply.content && reply.content.startsWith("@");
  let mentionedUser = "";
  let displayContent = reply.content || "";

  if (isNestedReply && reply.content) {
    const mentionMatch = reply.content.match(/^@(\S+)\s+(.*)/);
    if (mentionMatch) {
      mentionedUser = mentionMatch[1];
      displayContent = mentionMatch[2];
    }
  }

  const form = useForm<NestedReplyFormData>({
    resolver: zodResolver(nestedReplySchema),
    mode: "onSubmit",
    defaultValues: { content: "" },
  });

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await dispatch(deleteReply(postId, reply.id) as any);
      onReplyDeleted?.();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmitNestedReply = async (data: NestedReplyFormData) => {
    if (!currentUserId) return;
    if (!data.content || data.content.trim().length === 0) return;

    setIsSubmittingNestedReply(true);
    try {
      // Add nested reply with parent reply reference in content format: "@parentAuthor content"
      const nestedContent = `@${reply.author?.name || "User"} ${data.content}`;
      await dispatch(addReply(postId, nestedContent) as any);
      // Refresh post details to get updated replies
      await dispatch(getPostDetails(postId) as any);
      form.reset({ content: "" });
      setShowReplyForm(false);
    } finally {
      setIsSubmittingNestedReply(false);
    }
  };

  return (
    <div
      className={`flex gap-3 p-3 rounded-lg border transition-colors ${
        isNestedReply
          ? "ml-8 pl-4 bg-background border-l-2 border-l-primary border-border/20"
          : "bg-muted/30 border-border/50"
      }`}
    >
      {/* Avatar */}
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarImage src={reply.author?.avatar} />
        <AvatarFallback>{reply.author?.name?.[0] || "U"}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        {/* Author & date with mention indicator */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium">
              {reply.author?.name || "Unknown"}
            </p>
            {isNestedReply && mentionedUser && (
              <span className="text-xs text-primary/70 font-medium">
                ↳ Replying to @{mentionedUser}
              </span>
            )}
          </div>
          {isOwnReply && (
            <Button
              variant="ghost"
              size="icon"
              className="w-6 h-6 text-destructive hover:bg-destructive/10"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>

        {/* Content */}
        <p className="text-xs text-foreground mb-2">{displayContent}</p>

        {/* Footer - date & reply button */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {new Date(reply.createdAt).toLocaleDateString()}
          </span>
          {currentUserId && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs h-auto p-0"
              onClick={() => setShowReplyForm(!showReplyForm)}
            >
              <MessageCircle className="w-3 h-3" />
              <span>Reply</span>
              {showReplyForm ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </Button>
          )}
        </div>

        {/* Nested reply form */}
        {showReplyForm && currentUserId && (
          <form
            onSubmit={form.handleSubmit(handleSubmitNestedReply)}
            className="mt-3 pt-3 border-t border-border/50 space-y-2"
          >
            <div className="flex gap-2">
              <textarea
                {...form.register("content")}
                placeholder="Reply to this comment..."
                className="flex-1 resize-none min-h-[32px] rounded-md border border-input bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-ring focus-visible:ring-offset-background"
                required
              />
              <Button
                type="submit"
                size="icon"
                disabled={isSubmittingNestedReply}
                className="flex-shrink-0 h-[32px] w-8"
              >
                {isSubmittingNestedReply ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Send className="w-3 h-3" />
                )}
              </Button>
            </div>
            {form.formState.errors.content && (
              <p className="text-xs text-red-600">
                {form.formState.errors.content.message}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
