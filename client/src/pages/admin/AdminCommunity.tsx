import { toast } from "sonner";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ANIMATION_VARIANTS } from "@/lib/communityConstants";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard, DeleteConfirmDialog } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MessageSquare,
  Clock,
  Search,
  Eye,
  Check,
  Shield,
  Plus,
  Trash2,
  Ban,
  Tag,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  AdminPostCard,
  AdminCategoryDialog,
  AdminReasonDialog,
  PostDetailsModal,
} from "@/components/community";
import {
  getAllApprovedPosts,
  getPostsForModeration,
  approvePost,
  declinePost,
  deletePostAdmin,
  getBannedUsers,
  banUser,
  unbanUser,
  getAllCategories,
  createCategory,
  deleteCategory,
  clearError,
  clearSuccessMessage,
  setFilters,
} from "@/store/slices/communitySlice";

const { container: containerVariants, item: itemVariants } = ANIMATION_VARIANTS;

export function AdminCommunity() {
  const dispatch = useAppDispatch();
  const {
    moderationPosts,
    posts,
    categories,
    bannedUsers,
    postsPagination,
    bannedUsersPagination,
    filters,
    loading,
    creatingCategory,
    error,
    successMessage,
  } = useAppSelector((state) => state.community);

  const [searchQuery, setSearchQuery] = useState(filters.search || "");
  const [activeTab, setActiveTab] = useState("all");
  const [mainView, setMainView] = useState<
    "moderate" | "view" | "categories" | "banned"
  >("moderate");
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [declineReasonDialogOpen, setDeclineReasonDialogOpen] = useState<
    string | null
  >(null);
  const [deletePostConfirmOpen, setDeletePostConfirmOpen] = useState<
    string | null
  >(null);
  const [viewPostDetailsOpen, setViewPostDetailsOpen] = useState<string | null>(
    null,
  );
  const [banUserDialogOpen, setBanUserDialogOpen] = useState<string | null>(
    null,
  );

  // Show toast notifications
  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearSuccessMessage());
    }
  }, [successMessage, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Fetch data on mount
  useEffect(() => {
    dispatch(getAllCategories());
    if (mainView === "moderate") {
      dispatch(
        getPostsForModeration({
          page: filters.page,
          search: searchQuery,
          status: activeTab !== "all" ? activeTab : undefined,
        }),
      );
    } else if (mainView === "view") {
      dispatch(
        getAllApprovedPosts({ page: filters.page, search: searchQuery }),
      );
    } else if (mainView === "banned") {
      dispatch(getBannedUsers({ page: filters.page }));
    } else if (mainView === "categories") {
      console.log("err");
    }
  }, [mainView, filters.page, activeTab, searchQuery, dispatch]);

  const handleSearch = () => {
    dispatch(setFilters({ search: searchQuery, page: 1 }));
  };

  const handleApprove = async (postId: string) => {
    try {
      await dispatch(approvePost(postId));
      // Refresh moderation posts
      dispatch(
        getPostsForModeration({
          page: filters.page,
          search: searchQuery,
          status: activeTab !== "all" ? activeTab : undefined,
        }),
      );
    } catch (err) {
      console.log(err);
    }
  };

  const handleDecline = async (postId: string, reason: string) => {
    try {
      await dispatch(declinePost(postId, reason));
      setDeclineReasonDialogOpen(null);
      // Refresh moderation posts
      dispatch(
        getPostsForModeration({
          page: filters.page,
          search: searchQuery,
          status: activeTab !== "all" ? activeTab : undefined,
        }),
      );
    } catch (err) {
      console.log(err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await dispatch(deletePostAdmin(postId));
      setDeletePostConfirmOpen(null);
      // Refresh moderation posts
      dispatch(
        getPostsForModeration({
          page: filters.page,
          search: searchQuery,
          status: activeTab !== "all" ? activeTab : undefined,
        }),
      );
    } catch (err) {
      console.log(err);
    }
  };

  const handleAddCategory = async (name: string, description: string) => {
    try {
      await dispatch(
        createCategory({
          name,
          description,
        }),
      );

      setIsCategoryDialogOpen(false);
      dispatch(getAllCategories());
    } catch (err) {
      console.error("Error creating category:", err);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    try {
      await dispatch(deleteCategory(categoryId));
    } catch (err) {
      console.log(err);
    }
  };

  const handleBanUser = async (userId: string, reason: string) => {
    try {
      await dispatch(banUser(userId, reason));
      setBanUserDialogOpen(null);
      // Refresh banned users list
      dispatch(getBannedUsers({ page: filters.page }));
    } catch (err) {
      console.log(err);
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      await dispatch(unbanUser(userId));
    } catch (err) {
      console.log(err);
    }
  };

  const displayPosts = mainView === "moderate" ? moderationPosts : posts;

  const pendingCount = moderationPosts.filter(
    (p) => p.status === "PENDING",
  ).length;
  const approvedCount = moderationPosts.filter(
    (p) => p.status === "APPROVED",
  ).length;

  return (
    <TooltipProvider>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div
          variants={itemVariants}
          className="flex items-start justify-between"
        >
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Community
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage community posts, categories, and moderate content
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(["moderate", "view", "categories", "banned"] as const).map(
              (view) => (
                <Button
                  key={view}
                  variant={mainView === view ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMainView(view)}
                >
                  {view === "moderate" && <Shield className="w-4 h-4 mr-1" />}
                  {view === "view" && <Eye className="w-4 h-4 mr-1" />}
                  {view === "categories" && <Tag className="w-4 h-4 mr-1" />}
                  {view === "banned" && <Ban className="w-4 h-4 mr-1" />}
                  {view === "moderate"
                    ? "Moderate"
                    : view === "view"
                      ? "Community"
                      : view === "categories"
                        ? "Categories"
                        : "Banned"}
                </Button>
              ),
            )}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-5 gap-4"
        >
          <StatCard
            icon={<MessageSquare className="w-5 h-5" />}
            label="Total Posts"
            value={postsPagination.total}
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="Pending"
            value={pendingCount}
          />
          <StatCard
            icon={<Check className="w-5 h-5" />}
            label="Approved"
            value={approvedCount}
          />
          <StatCard
            icon={<Tag className="w-5 h-5" />}
            label="Categories"
            value={categories.length}
          />
          <StatCard
            icon={<Ban className="w-5 h-5" />}
            label="Banned Users"
            value={bannedUsersPagination.total}
          />
        </motion.div>

        {/* Categories View */}
        {mainView === "categories" && (
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Community Categories</CardTitle>
                  <Button
                    size="sm"
                    onClick={() => setIsCategoryDialogOpen(true)}
                    disabled={loading}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Category
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {categories.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No categories found. Create one to get started.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((cat) => (
                      <div
                        key={cat.id}
                        className="p-4 rounded-lg border border-border flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-primary" />
                          <div>
                            <p className="font-medium">{cat.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {cat.description || "No description"}
                            </p>
                          </div>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              disabled={loading}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete "{cat.name}" category?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone if posts are
                                assigned to this category.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteCategory(cat.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Banned Users View */}
        {mainView === "banned" && (
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>Banned Users</CardTitle>
              </CardHeader>
              <CardContent>
                {bannedUsers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No banned users.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {bannedUsers.map((user) => (
                      <div
                        key={user.id}
                        className="p-4 rounded-lg border border-destructive/20 bg-destructive/5 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{user.userName}</p>
                            <Badge variant="destructive">Banned</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {user.userEmail}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Reason: {user.reason} · Banned on{" "}
                            {new Date(user.bannedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnbanUser(user.userId)}
                          disabled={loading}
                        >
                          Unban
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Moderate / Community View */}
        {(mainView === "moderate" || mainView === "view") && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle>
                      {mainView === "moderate"
                        ? "Moderation Queue"
                        : "Community Feed"}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <select
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        disabled={loading}
                      >
                        <option value="all">All Categories</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <div className="relative w-48">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search..."
                          className="pl-10"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          disabled={loading}
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={handleSearch}
                        disabled={loading}
                      >
                        Search
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {mainView === "moderate" && (
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="mb-4">
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="PENDING">
                          Pending{" "}
                          {pendingCount > 0 && (
                            <Badge variant="warning" className="ml-2">
                              {pendingCount}
                            </Badge>
                          )}
                        </TabsTrigger>
                        <TabsTrigger value="APPROVED">Approved</TabsTrigger>
                        <TabsTrigger value="REJECTED">Declined</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  )}
                  {loading && displayPosts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading posts...
                    </div>
                  ) : displayPosts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No posts found.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {displayPosts.map((post) => (
                        <AdminPostCard
                          key={post.id}
                          post={post}
                          isModeration={mainView === "moderate"}
                          onApprove={() => handleApprove(post.id)}
                          onDecline={() => setDeclineReasonDialogOpen(post.id)}
                          onDelete={() => setDeletePostConfirmOpen(post.id)}
                          onBanAuthor={() =>
                            setBanUserDialogOpen(post.author?.id || "")
                          }
                          onViewDetails={() => setViewPostDetailsOpen(post.id)}
                          isLoading={loading}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
        <AdminCategoryDialog
          isOpen={isCategoryDialogOpen}
          onClose={() => setIsCategoryDialogOpen(false)}
          onSubmit={({ name, description }) => {
            handleAddCategory(name, description || "");
          }}
          isLoading={creatingCategory}
        />
        <AdminReasonDialog
          isOpen={!!declineReasonDialogOpen}
          title="Decline Post"
          label="Reason for Decline"
          placeholder="Explain why this post is being declined..."
          confirmText="Decline"
          onClose={() => setDeclineReasonDialogOpen(null)}
          onSubmit={(reason) => {
            handleDecline(declineReasonDialogOpen || "", reason);
          }}
          isLoading={loading}
        />
        <AdminReasonDialog
          isOpen={!!banUserDialogOpen}
          title="Ban User"
          label="Ban Reason"
          placeholder="Explain why this user is being banned..."
          confirmText="Ban User"
          onClose={() => setBanUserDialogOpen(null)}
          onSubmit={(reason) => {
            handleBanUser(banUserDialogOpen || "", reason);
          }}
          isLoading={loading}
        />
        <DeleteConfirmDialog
          isOpen={!!deletePostConfirmOpen}
          title="Delete Post"
          itemName="this post"
          isDeleting={loading}
          onConfirm={async () => {
            if (deletePostConfirmOpen) {
              await handleDeletePost(deletePostConfirmOpen);
              setDeletePostConfirmOpen(null);
            }
          }}
          onCancel={() => setDeletePostConfirmOpen(null)}
        />
        {viewPostDetailsOpen &&
          moderationPosts.find((p) => p.id === viewPostDetailsOpen) && (
            <PostDetailsModal
              postId={viewPostDetailsOpen}
              onClose={() => setViewPostDetailsOpen(null)}
            />
          )}
      </motion.div>
    </TooltipProvider>
  );
}
