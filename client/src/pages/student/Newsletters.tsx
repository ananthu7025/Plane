/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Search, Eye } from "lucide-react";
import PDFViewer from "@/components/PDFViewer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  fetchNewsletters,
  clearError,
  clearSuccessMessage,
  setNewslettersSearch,
  setNewslettersCategory,
  setNewslettersPage,
} from "@/store/slices/newsletterSlice";

export default function Newsletters() {
  const dispatch = useAppDispatch();

  // Redux state
  const {
    newsletters,
    newslettersPagination,
    newslettersSearch,
    newslettersCategory,
    loadingNewsletters,
    error,
    successMessage,
  } = useAppSelector((state) => state.newsletters);

  // Local state
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [viewingNewsletterId, setViewingNewsletterId] = useState<string | null>(null);

  // Toast notifications
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

  // Load newsletters on mount or filter change
  useEffect(() => {
    dispatch(
      fetchNewsletters({
        page: 1,
        search: newslettersSearch,
        category: newslettersCategory,
      }) as any
    );
  }, [dispatch, newslettersSearch, newslettersCategory]);

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleSearchSubmit = () => {
    dispatch(setNewslettersSearch(searchInput));
  };

  // Handle category filter
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    dispatch(setNewslettersCategory(category));
  };

  // Handle pagination
  const handlePreviousPage = () => {
    if (newslettersPagination && newslettersPagination.page > 1) {
      dispatch(setNewslettersPage(newslettersPagination.page - 1));
      dispatch(
        fetchNewsletters({
          page: newslettersPagination.page - 1,
          search: newslettersSearch,
          category: newslettersCategory,
        }) as any
      );
    }
  };

  const handleNextPage = () => {
    if (
      newslettersPagination &&
      newslettersPagination.page < newslettersPagination.totalPages
    ) {
      dispatch(setNewslettersPage(newslettersPagination.page + 1));
      dispatch(
        fetchNewsletters({
          page: newslettersPagination.page + 1,
          search: newslettersSearch,
          category: newslettersCategory,
        }) as any
      );
    }
  };

  // Sample categories
  const categories = ["All", "Aviation News", "Safety Tips", "Industry Updates"];

  // Get viewing newsletter data
  const viewingNewsletter = viewingNewsletterId
    ? newsletters.find((n) => n.id === viewingNewsletterId)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Newsletters</h1>
          <p className="text-slate-600">Stay updated with the latest aviation news and insights</p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Search */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search newsletters..."
                    value={searchInput}
                    onChange={handleSearch}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") handleSearchSubmit();
                    }}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleSearchSubmit} variant="default">
                  Search
                </Button>
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium text-slate-600 py-2">Category:</span>
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={
                      selectedCategory === (category === "All" ? "" : category)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      handleCategoryChange(category === "All" ? "" : category)
                    }
                    className="capitalize"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Newsletters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {loadingNewsletters && newsletters.length === 0 ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            </div>
          ) : newsletters.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="py-12 text-center">
                <p className="text-slate-600">No newsletters found. Check back soon!</p>
              </CardContent>
            </Card>
          ) : (
            newsletters.map((newsletter) => (
              <Card
                key={newsletter.id}
                className="hover:shadow-lg transition-shadow flex flex-col overflow-hidden"
              >
                <CardHeader className="flex-1">
                  <div className="space-y-2">
                    <CardTitle className="text-lg line-clamp-2">
                      {newsletter.title}
                    </CardTitle>
                    {newsletter.description && (
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {newsletter.description}
                      </p>
                    )}
                    <div className="flex flex-col gap-1 text-xs text-slate-500">
                      <p>{newsletter.category}</p>
                      <p>{new Date(newsletter.publishedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => setViewingNewsletterId(newsletter.id)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View PDF
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {newsletters.length > 0 && newslettersPagination && (
          <div className="flex justify-center items-center gap-4">
            <Button
              variant="outline"
              disabled={newslettersPagination.page === 1}
              onClick={handlePreviousPage}
            >
              Previous
            </Button>
            <span className="text-sm text-slate-600">
              Page {newslettersPagination.page} of {newslettersPagination.totalPages}
            </span>
            <Button
              variant="outline"
              disabled={
                newslettersPagination.page === newslettersPagination.totalPages
              }
              onClick={handleNextPage}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* PDF Viewer Dialog */}
      {viewingNewsletter && (
        <Dialog open={!!viewingNewsletterId} onOpenChange={(open) => !open && setViewingNewsletterId(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>{viewingNewsletter.title}</DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-auto">
              <PDFViewer
                url={`/api/newsletters/${viewingNewsletter.id}/pdf`}
                title={viewingNewsletter.title}
                isPaid={true}
                showPageCount={true}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
