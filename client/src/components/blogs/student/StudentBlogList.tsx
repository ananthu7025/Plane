/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  fetchPublishedBlogs,
  fetchCategories,
  setPublishedSearch,
  setPublishedCategory,
  setPublishedPage,
} from "@/store/slices/blogSlice";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Calendar, Clock, Plane } from "lucide-react";
import { StudentBlogCard } from "./StudentBlogCard";
import { PaginationControls } from "@/components/shared/PaginationControls";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function StudentBlogList() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const {
    publishedBlogs,
    publishedPage,
    publishedLimit,
    publishedPagination,
    publishedSearch,
    publishedCategory,
    categories,
    loadingPublishedBlogs,
  } = useAppSelector((state) => state.blogs);

  const [searchInput, setSearchInput] = useState(publishedSearch);

  useEffect(() => {
    dispatch(fetchCategories() as any);
  }, []);

  useEffect(() => {
    const actualCategory =
      publishedCategory === "All" || publishedCategory === ""
        ? undefined
        : publishedCategory;
    dispatch(
      fetchPublishedBlogs(
        publishedSearch || undefined,
        actualCategory,
        publishedPage,
        publishedLimit
      ) as any
    );
  }, [publishedSearch, publishedCategory, publishedPage]);

  const handleSearch = (value: string) => {
    setSearchInput(value);
    dispatch(setPublishedSearch(value));
  };

  const handleCategoryChange = (cat: string | null) => {
    dispatch(setPublishedCategory(cat ?? ""));
  };

  const handlePageChange = (newPage: number) => {
    dispatch(setPublishedPage(newPage));
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

  const activeCategory = publishedCategory === "" ? null : publishedCategory;
  const featuredBlog = publishedBlogs[0] ?? null;
  const gridBlogs = publishedBlogs.slice(1);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="font-display text-3xl font-bold text-foreground">Blogs</h1>
        <p className="text-muted-foreground mt-1">
          Read articles and insights from aviation experts
        </p>
      </motion.div>

      {/* Search + Category Filter Buttons */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search blogs..."
            className="pl-10"
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={activeCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => handleCategoryChange(null)}
          >
            All
          </Button>
          {(categories || []).map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryChange(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Loading */}
      {loadingPublishedBlogs && (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loadingPublishedBlogs && publishedBlogs.length === 0 && (
        <motion.div variants={itemVariants}>
          <Card className="p-12 text-center">
            <p className="text-muted-foreground text-lg">
              {searchInput || activeCategory
                ? "No articles match your search. Try adjusting your filters."
                : "No articles available yet."}
            </p>
          </Card>
        </motion.div>
      )}

      {!loadingPublishedBlogs && featuredBlog && (
        <>
          {/* Featured Blog */}
          <motion.div variants={itemVariants}>
            <Card
              variant="elevated"
              className="overflow-hidden cursor-pointer"
              onClick={() => navigate(`/student/blogs/${featuredBlog.id}`)}
            >
              <div className="grid md:grid-cols-2">
                <div className="aspect-video md:aspect-auto overflow-hidden">
                  <img
                    src={
                      featuredBlog.coverImageUrl ||
                      "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&h=400&fit=crop"
                    }
                    alt={featuredBlog.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-6 flex flex-col justify-center">
                  <Badge variant="muted" className="w-fit mb-3">
                    {featuredBlog.category}
                  </Badge>
                  <h2 className="font-display text-2xl font-bold mb-3">
                    {featuredBlog.title}
                  </h2>
                  <p className="text-muted-foreground mb-4">{featuredBlog.excerpt}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(featuredBlog.publishedDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {calculateReadTime(featuredBlog.content)} min read
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Plane className="w-4 h-4" />
                      {featuredBlog.acknowledgementCount} ✈️
                    </span>
                  </div>
                </CardContent>
              </div>
            </Card>
          </motion.div>

          {/* Blog Grid */}
          {gridBlogs.length > 0 && (
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {gridBlogs.map((blog) => (
                <StudentBlogCard key={blog.id} blog={blog} />
              ))}
            </motion.div>
          )}

          {/* Pagination */}
          {publishedPagination && publishedPagination.totalPages > 1 && (
            <motion.div variants={itemVariants}>
              <PaginationControls
                currentPage={publishedPage}
                totalPages={publishedPagination.totalPages}
                onPageChange={handlePageChange}
              />
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
}
