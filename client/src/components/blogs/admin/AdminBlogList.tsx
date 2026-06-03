/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  fetchAdminBlogs,
  setAdminSearch,
  setAdminCategory,
  setAdminStatus,
  setAdminPage,
} from "@/store/slices/blogSlice";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Search, FileText, Megaphone, Eye, ThumbsUp } from "lucide-react";
import { AdminBlogCard } from "./AdminBlogCard";
import { BlogFormDialog } from "./BlogFormDialog";
import { StatCard } from "@/components/shared/StatCard";
import { PaginationControls } from "@/components/shared/PaginationControls";

const CATEGORIES = [
  "All",
  "Navigation",
  "Meteorology",
  "Aircraft Systems",
  "Regulations",
  "Exam Tips",
  "Career",
];

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
];

export function AdminBlogList() {
  const dispatch = useAppDispatch();
  const {
    adminBlogs,
    adminPage,
    adminLimit,
    adminPagination,
    adminStats,
    adminSearch,
    adminCategory,
    adminStatus,
    loadingAdminBlogs,
  } = useAppSelector((state) => state.blogs);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(adminSearch);

  const refetchBlogs = () => {
    const actualCategory = adminCategory === "All" ? undefined : adminCategory;
    dispatch(
      fetchAdminBlogs(
        adminSearch || undefined,
        actualCategory,
        adminStatus !== "all" ? adminStatus : undefined,
        adminPage,
        adminLimit
      ) as any
    );
  };

  // Fetch blogs on component mount and when filters change
  useEffect(() => {
    refetchBlogs();
  }, [adminSearch, adminCategory, adminStatus, adminPage]);

  const handleSearch = (value: string) => {
    setSearchInput(value);
    dispatch(setAdminSearch(value));
  };

  const handleCategoryChange = (value: string) => {
    dispatch(setAdminCategory(value));
  };

  const handleStatusChange = (value: string) => {
    dispatch(setAdminStatus(value as "draft" | "published" | "all"));
  };

  const handlePageChange = (newPage: number) => {
    dispatch(setAdminPage(newPage));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Blogs Management</h1>
          <p className="text-gray-600 mt-1">Create, edit, and manage blog posts</p>
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="gap-2"
          size="lg"
        >
          <Plus className="w-4 h-4" />
          Create Blog
        </Button>
      </div>

      {/* Stats Cards */}
      {adminStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Blogs"
            value={adminStats.totalBlogs}
            icon={<FileText className="w-5 h-5 text-primary" />}
            variant="primary"
          />
          <StatCard
            label="Published"
            value={adminStats.totalPublished}
            icon={<Megaphone className="w-5 h-5 text-success" />}
            variant="success"
          />
          <StatCard
            label="Total Views"
            value={adminStats.totalViews}
            icon={<Eye className="w-5 h-5 text-warning" />}
            variant="warning"
          />
          <StatCard
            label="Acknowledgements"
            value={adminStats.totalAcknowledgements}
            icon={<ThumbsUp className="w-5 h-5 text-primary" />}
            variant="primary"
          />
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by title..."
              value={searchInput}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <Select value={adminCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={adminStatus} onValueChange={handleStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Results count */}
          <div className="flex items-center text-sm text-gray-600">
            {adminPagination && (
              <span>
                Showing {(adminPage - 1) * adminLimit + 1} -{" "}
                {Math.min(adminPage * adminLimit, adminPagination.total)} of{" "}
                {adminPagination.total} blogs
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Blogs List */}
      <div className="space-y-4">
        {loadingAdminBlogs ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : adminBlogs.length > 0 ? (
          <>
            {adminBlogs.map((blog) => (
              <AdminBlogCard key={blog.id} blog={blog} onRefetch={refetchBlogs} />
            ))}

            {/* Pagination */}
            {adminPagination && adminPagination.totalPages > 1 && (
              <div className="mt-6">
                <PaginationControls
                  currentPage={adminPage}
                  totalPages={adminPagination.totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        ) : (
          <Card className="p-12 text-center">
            <p className="text-gray-600">No blogs found. Create your first blog!</p>
          </Card>
        )}
      </div>

      {/* Create/Edit Blog Dialog */}
      <BlogFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={refetchBlogs}
        categories={CATEGORIES.filter((c) => c !== "All")}
      />
    </div>
  );
}
