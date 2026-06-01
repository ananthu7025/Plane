/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { useNewsletterFilters } from "@/hooks/useNewsletterFilters";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import PDFViewer from "@/components/PDFViewer";
import { NewslettersList } from "@/components/NewslettersList";
import { NEWSLETTER_CATEGORIES_LIST } from "@/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  fetchNewsletters,
  clearSuccessMessage,
} from "@/store/slices/newsletterSlice";

export default function Newsletters() {
  const dispatch = useAppDispatch();

  // Redux state
  const { newsletters = [], error, successMessage } = useAppSelector(
    (state) => state.newsletters
  ) || {};

  // Custom hook for filter management
  const {
    searchInput,
    selectedCategory,
    pagination,
    loading,
    handleSearch,
    handleSearchSubmit,
    handleCategoryChange,
    handlePreviousPage,
    handleNextPage,
    currentSearch,
    currentCategory,
  } = useNewsletterFilters();

  // Local state
  const [viewingNewsletterId, setViewingNewsletterId] = useState<string | null>(
    null
  );

  // Prevent duplicate toasts in Strict Mode
  const shownSuccessRef = useRef<string | null>(null);
  const shownErrorRef = useRef<string | null>(null);

  // Toast notifications
  useEffect(() => {
    if (successMessage && successMessage !== shownSuccessRef.current) {
      shownSuccessRef.current = successMessage;
      toast.success(successMessage);
      dispatch(clearSuccessMessage());
    }
  }, [successMessage, dispatch]);

  useEffect(() => {
    if (error && error !== shownErrorRef.current) {
      shownErrorRef.current = error;
      toast.error(error);
    }
  }, [error]);

  // Load newsletters on mount or filter change
  useEffect(() => {
    dispatch(
      fetchNewsletters({
        page: 1,
        search: currentSearch,
        category: currentCategory,
      }) as any
    );
  }, [dispatch, currentSearch, currentCategory]);

  // Get viewing newsletter data
  const viewingNewsletter = viewingNewsletterId
    ? newsletters.find((n) => n.id === viewingNewsletterId)
    : null;

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Newsletters
          </h1>
          <p className="text-slate-600">
            Stay updated with the latest aviation news and insights
          </p>
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
                    onChange={(e) => handleSearch(e.target.value)}
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
                <span className="text-sm font-medium text-slate-600 py-2">
                  Category:
                </span>
                {NEWSLETTER_CATEGORIES_LIST.map((category) => (
                  <Button
                    key={category}
                    variant={
                      selectedCategory ===
                      (category === "All" ? "" : category)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      handleCategoryChange(
                        category === "All" ? "" : category
                      )
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
          <NewslettersList
            newsletters={newsletters}
            loading={loading}
            onViewPdf={(newsletter) => setViewingNewsletterId(newsletter.id)}
          />
        </div>

        {/* Pagination */}
        {newsletters.length > 0 && pagination && (
          <div className="flex justify-center items-center gap-4">
            <Button
              variant="outline"
              disabled={pagination.page === 1}
              onClick={handlePreviousPage}
            >
              Previous
            </Button>
            <span className="text-sm text-slate-600">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              disabled={pagination.page === pagination.totalPages}
              onClick={handleNextPage}
            >
              Next
            </Button>
          </div>
        )}

      {/* PDF Viewer Dialog */}
      {viewingNewsletter && (
        <Dialog
          open={!!viewingNewsletterId}
          onOpenChange={(open) => !open && setViewingNewsletterId(null)}
        >
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>{viewingNewsletter.title}</DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-auto">
              <PDFViewer
                url={`/api/newsletters/${viewingNewsletter.id}/pdf`}
                title={viewingNewsletter.title}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
