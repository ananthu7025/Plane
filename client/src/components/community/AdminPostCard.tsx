import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Post } from "@/store/slices/communitySlice";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreVertical, Check, X, Eye, Trash2, Ban, ThumbsUp, MessageCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AdminPostCardProps {
  post: Post;
  isModeration?: boolean;
  onApprove?: (postId: string) => void;
  onDecline?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onBanAuthor?: (userId: string) => void;
  onViewDetails?: (postId: string) => void;
  isLoading?: boolean;
}

export function AdminPostCard({
  post,
  isModeration = false,
  onApprove,
  onDecline,
  onDelete,
  onBanAuthor,
  onViewDetails,
  isLoading = false,
}: AdminPostCardProps) {
  const isPending = post.status === "PENDING";

  return (
    <TooltipProvider>
      <div className="p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="w-10 h-10">
            <AvatarImage src={post.author?.avatar} />
            <AvatarFallback>
              { post.author?.name?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h4 className="font-medium line-clamp-1">
                {post.title}
              </h4>
              <Badge variant="muted">
                {typeof post.category === "string" ? post.category : post.category?.name || "Uncategorized"}
              </Badge>
              {isModeration && (
                <Badge
                  variant={
                    post.status === "APPROVED"
                      ? "success"
                      : post.status === "PENDING"
                        ? "warning"
                        : "destructive"
                  }
                >
                  {post.status}
                </Badge>
              )}
              {post.isAnonymous && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="gap-1">
                      Anonymous
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>Posted anonymously</TooltipContent>
                </Tooltip>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {post.content}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                { post.author?.name || ""}
              </span>
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              {post.status === "APPROVED" && (
                <>
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3" />
                    <span>{post.likeCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    <span>{post.commentCount}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isModeration && isPending && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-success hover:text-success hover:bg-success/10"
                      onClick={() => onApprove?.(post.id)}
                      disabled={isLoading}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Approve</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => onDecline?.(post.id)}
                      disabled={isLoading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Decline</TooltipContent>
                </Tooltip>
              </>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={isLoading}>
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onViewDetails && (
                  <DropdownMenuItem onClick={() => onViewDetails(post.id)}>
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDelete(post.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Post
                  </DropdownMenuItem>
                )}
                {onBanAuthor && post.author?.id && (
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onBanAuthor(post.author?.id || "")}
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    Ban Author
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
