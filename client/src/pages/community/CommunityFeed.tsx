import { toast } from "sonner";
import { motion } from "framer-motion";
import { StatCard } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PermissionGate from "@/components/common/PermissionGate";
import { Permissions } from "@/lib/permissions";
import type { Post } from "@/store/slices/communitySlice";
import { ANIMATION_VARIANTS } from "@/lib/communityConstants";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  MessageSquare,
  FolderOpen,
  BookOpen,
  Plus,
  Loader2,
  ChevronDown,
} from "lucide-react";
import {
  PostCard,
  CreatePostDialog,
  CommunityRulesWidget,
  CategoriesWidget,
} from "@/components/community";
import {
  getAllApprovedPosts,
  getAllCategories,
  clearError,
  clearSuccessMessage,
} from "@/store/slices/communitySlice";

const { container: containerVariants, item: itemVariants } = ANIMATION_VARIANTS;

export default function CommunityFeed() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { topSentinelRef, bottomSentinelRef, setCallbacks } = useInfiniteScroll(
    {
      threshold: 0.5,
      rootMargin: "200px 0px",
    },
  );

  // Redux state
  const {
    posts = [],
    categories = [],
    postsPagination = { page: 1, limit: 10, total: 0, totalPages: 0, hasMore: false },
    postsLoading = false,
    postsError,
    successMessage,
  } = useAppSelector((state) => state.community) || {};

  // Local UI state
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [shouldShowLoadNewer, setShouldShowLoadNewer] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Ref to prevent double-loads without relying on state
  const isLoadingRef = useRef(false);

  // Toast notifications
  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearSuccessMessage());
    }
  }, [successMessage, dispatch]);

  useEffect(() => {
    if (postsError) {
      toast.error(postsError);
      dispatch(clearError());
    }
  }, [postsError, dispatch]);

  // Initial load - fetch categories and first page of posts
  useEffect(() => {
    dispatch(getAllCategories());
    dispatch(getAllApprovedPosts({ page: 1, limit: 10 }));
  }, [dispatch]);

  // Handle load more (bottom scroll) - use refs to prevent double-loads
  const loadMorePosts = useCallback(() => {
    // Don't load if already loading
    if (isLoadingRef.current) return;

    // Don't load if we're at the last page
    if (
      postsPagination.totalPages === 0 ||
      currentPage >= postsPagination.totalPages
    ) {
      return;
    }

    isLoadingRef.current = true;
    setIsLoadingMore(true);

    const nextPage = currentPage + 1;
    dispatch(getAllApprovedPosts({ page: nextPage, limit: 10 }))
      .then(() => {
        setCurrentPage(nextPage);
      })
      .catch(() => {
        // Error already handled by Redux and toast
      })
      .finally(() => {
        isLoadingRef.current = false;
        setIsLoadingMore(false);
      });
  }, [dispatch, postsPagination.totalPages, currentPage]);

  // Handle load newer (reload from page 1)
  const loadNewerPosts = useCallback(() => {
    if (isLoadingRef.current) return;

    isLoadingRef.current = true;
    setIsLoadingMore(true);

    dispatch(getAllApprovedPosts({ page: 1, limit: 10 }))
      .then(() => {
        setCurrentPage(1);
        setShouldShowLoadNewer(false);
      })
      .catch(() => {
        // Error already handled by Redux and toast
      })
      .finally(() => {
        isLoadingRef.current = false;
        setIsLoadingMore(false);
      });
  }, [dispatch]);

  // Set up intersection observer callbacks
  useEffect(() => {
    setCallbacks(
      // onTop - no action needed, we use button instead
      undefined,
      // onBottom - load more posts
      loadMorePosts,
    );
  }, [setCallbacks, loadMorePosts]);

  // Track scroll position and show "load newer" button
  useEffect(() => {
    const handleScroll = () => {
      const shouldShow =
        window.scrollY > 300 &&
        currentPage > 1 &&
        !isLoadingMore &&
        !postsLoading;

      if (shouldShow) {
        setShouldShowLoadNewer(true);
      } else {
        setShouldShowLoadNewer(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isLoadingMore, postsLoading, currentPage]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Community
            </h1>
            <p className="text-muted-foreground mt-1">
              Share knowledge, ask questions, and connect with others
            </p>
          </div>
          <PermissionGate permission={Permissions.CREATE_POST}>
            <Button
              size="lg"
              onClick={() => setIsCreatePostOpen(true)}
              className="gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Post
            </Button>
          </PermissionGate>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <StatCard
          icon={<MessageSquare className="w-5 h-5" />}
          label="Total Posts"
          value={postsPagination.total}
        />
        <StatCard
          icon={<FolderOpen className="w-5 h-5" />}
          label="Categories"
          value={categories.length}
        />
        <StatCard
          icon={<BookOpen className="w-5 h-5" />}
          label="Your Posts"
          value={posts.filter((p) => p.author?.id === user?.id).length}
        />
      </motion.div>

      {/* Main Content with Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Posts Feed - Left Column (2/3 width) */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4">
          {/* Top Sentinel - Must be outside conditionals so ref is always available */}
          <div ref={topSentinelRef} className="h-0" />

          {/* Load Newer Button */}
          {shouldShowLoadNewer && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="sticky top-0 z-10"
            >
              <Button
                onClick={loadNewerPosts}
                className="w-full gap-2"
                variant="outline"
                disabled={postsLoading || isLoadingMore}
              >
                <ChevronDown className="w-4 h-4" />
                Load Newer Posts
              </Button>
            </motion.div>
          )}

          {postsLoading && posts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading posts...
            </div>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                <p className="text-muted-foreground">
                  No posts yet. Be the first to share!
                </p>
                <PermissionGate permission={Permissions.CREATE_POST}>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setIsCreatePostOpen(true)}
                  >
                    Create the First Post
                  </Button>
                </PermissionGate>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {posts.map((post: Post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={user?.id}
                  onReplyAdded={() => {
                    // Optionally refetch if needed
                  }}
                />
              ))}
            </div>
          )}

          {/* Bottom Sentinel - Must be outside conditionals so ref is always available */}
          <div ref={bottomSentinelRef} className="h-0" />

          {/* Loading & End-of-list indicators */}
          {posts.length > 0 && (
            <>
              {isLoadingMore && (
                <div className="flex justify-center py-6">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Loading more posts...</span>
                  </div>
                </div>
              )}
              {!isLoadingMore &&
                postsPagination.totalPages > 0 &&
                currentPage >= postsPagination.totalPages &&
                posts.length > 0 && (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground">
                      You've reached the end
                    </p>
                  </div>
                )}
            </>
          )}
        </motion.div>

        {/* Sidebar - Right Column (1/3 width) */}
        <motion.div variants={itemVariants} className="space-y-6">
          {/* Community Rules Widget */}
          <CommunityRulesWidget />
          {/* Categories Widget */}
          <CategoriesWidget categories={categories} />
        </motion.div>
      </div>

      {/* Create Post Dialog */}
      <CreatePostDialog
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        categories={categories}
      />
    </motion.div>
  );
}
