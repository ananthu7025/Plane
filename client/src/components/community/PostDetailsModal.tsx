import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  getPostLikes,
  getPostComments,
} from "@/store/slices/communitySlice";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  User,
  FileText,
  Tag,
  Check,
  Calendar,
  UserX,
  Heart,
  MessageCircle,
  ThumbsUp,
  Loader2,
} from "lucide-react";

interface PostDetailsModalProps {
  postId: string;
  onClose: () => void;
}

export function PostDetailsModal({
  postId,
  onClose,
}: PostDetailsModalProps) {
  const dispatch = useAppDispatch();
  const { moderationPosts, postLikes, postComments, postLikesLoading, postCommentsLoading } = useAppSelector(
    (state) => state.community
  );
  const [activeTab, setActiveTab] = useState("details");

  const post = moderationPosts.find((p) => p.id === postId);

  useEffect(() => {
    if (postId && activeTab === "likes") {
      dispatch(getPostLikes(postId, { page: 1, limit: 50 }));
    }
  }, [postId, activeTab, dispatch]);

  useEffect(() => {
    if (postId && activeTab === "comments") {
      dispatch(getPostComments(postId, { page: 1, limit: 50 }));
    }
  }, [postId, activeTab, dispatch]);

  if (!post) return null;

  const isLoadingLikes = postLikesLoading[postId];
  const isLoadingComments = postCommentsLoading[postId];
  const likes = postLikes[postId] || [];
  const comments = postComments[postId] || [];

  return (
    <Dialog open={!!postId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Post Details
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="likes" className="flex items-center gap-1">
              <ThumbsUp className="w-4 h-4" />
              Likes ({post.likeCount})
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              Comments ({post.commentCount})
            </TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6 py-4">
            {/* Author Section */}
            <div className="p-4 rounded-lg bg-muted/40 border border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Author
                  </p>
                  <p className="text-sm font-medium mt-1">
                    {post.author?.name || "Unknown"}
                  </p>
                  {post.isAnonymous && (
                    <Badge variant="secondary" className="mt-2 gap-1">
                      <UserX className="w-3 h-3" />
                      Posted Anonymously
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Title/Content Section */}
            <div className="p-4 rounded-lg bg-muted/40 border border-border">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-accent/10 mt-1">
                  <FileText className="w-4 h-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Post Content
                  </p>
                  <p className="text-sm font-medium mt-1 text-foreground whitespace-pre-wrap">
                    {post.content}
                  </p>
                </div>
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Category */}
              <div className="p-4 rounded-lg bg-muted/40 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Category
                  </p>
                </div>
                <Badge className="w-fit bg-primary/20 text-primary border-primary/30">
                  {post.category}
                </Badge>
              </div>

              {/* Status */}
              <div className="p-4 rounded-lg bg-muted/40 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="w-4 h-4 text-muted-foreground" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Status
                  </p>
                </div>
                <Badge
                  variant={
                    post.status === "PENDING"
                      ? "warning"
                      : post.status === "APPROVED"
                        ? "success"
                        : "destructive"
                  }
                >
                  {post.status}
                </Badge>
              </div>

              {/* Created Date */}
              <div className="p-4 rounded-lg bg-muted/40 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Created
                  </p>
                </div>
                <p className="text-sm font-medium">
                  {new Date(post.createdAt).toLocaleDateString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(post.createdAt).toLocaleTimeString()}
                </p>
              </div>

              {/* Anonymous Status */}
              <div className="p-4 rounded-lg bg-muted/40 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <UserX className="w-4 h-4 text-muted-foreground" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Privacy
                  </p>
                </div>
                <Badge variant={post.isAnonymous ? "secondary" : "outline"}>
                  {post.isAnonymous ? "Anonymous" : "Public"}
                </Badge>
              </div>
            </div>

            {/* Engagement Summary */}
            <div className="p-4 rounded-lg bg-success/5 border border-success/20">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-4 h-4 text-success" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Engagement
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background border border-success/20">
                  <ThumbsUp className="w-5 h-5 text-success" />
                  <div>
                    <p className="text-lg font-bold text-foreground">
                      {post.likeCount}
                    </p>
                    <p className="text-xs text-muted-foreground">Likes</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background border border-success/20">
                  <MessageCircle className="w-5 h-5 text-success" />
                  <div>
                    <p className="text-lg font-bold text-foreground">
                      {post.commentCount}
                    </p>
                    <p className="text-xs text-muted-foreground">Comments</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Likes Tab */}
          <TabsContent value="likes" className="py-4">
            {isLoadingLikes ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : likes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No likes yet
              </div>
            ) : (
              <div className="space-y-2">
                {likes.map((like) => (
                  <div
                    key={like.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border hover:bg-muted/60 transition-colors"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={like.avatar} />
                      <AvatarFallback>
                        {like.userName[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {like.userName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(like.createdAt).toLocaleDateString()} at{" "}
                        {new Date(like.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <ThumbsUp className="w-4 h-4 text-success flex-shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments" className="py-4">
            {isLoadingComments ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No comments yet
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-4 rounded-lg bg-muted/30 border border-border space-y-2"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={comment.avatar} />
                        <AvatarFallback>
                          {comment.authorName[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-foreground">
                            {comment.authorName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(comment.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap ml-11">
                      {comment.content}
                    </p>
                    <div className="flex items-center gap-2 ml-11">
                      <ThumbsUp className="w-3 h-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        {comment.likeCount}{" "}
                        {comment.likeCount === 1 ? "like" : "likes"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
