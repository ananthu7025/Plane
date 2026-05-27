/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Search, Download, Lock, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  fetchNewsletters,
  fetchNewsletterDetail,
  fetchNewsletterPage,
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
    loadingDetail,
    loadingPage,
    selectedNewsletter,
    selectedPage,
    currentPageNumber,
    error,
    successMessage,
  } = useAppSelector((state) => state.newsletters);

  // Local state
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);

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

  // Handle newsletter detail view
  const handleViewDetail = (newsletter: any) => {
    dispatch(fetchNewsletterDetail(newsletter.id) as any);
    setDetailOpen(true);
  };

  // Handle view PDF (page 1)
  const handleViewPDF = (newsletter: any) => {
    dispatch(fetchNewsletterPage(newsletter.id, 1) as any);
    setPdfOpen(true);
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
                {/* Thumbnail */}
                {newsletter.cloudinaryThumbnail && (
                  <div className="h-40 bg-slate-200 overflow-hidden">
                    <img
                      src={newsletter.cloudinaryThumbnail}
                      alt={newsletter.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <CardHeader className="flex-1">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-lg line-clamp-2">
                        {newsletter.title}
                      </CardTitle>
                      {newsletter.isPaid && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium whitespace-nowrap">
                          Paid
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {newsletter.pageCount} pages
                    </p>
                    {newsletter.description && (
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {newsletter.description}
                      </p>
                    )}
                    <p className="text-xs text-slate-500">
                      {new Date(newsletter.publishedAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleViewDetail(newsletter)}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Details
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleViewPDF(newsletter)}
                      disabled={loadingPage}
                    >
                      {loadingPage ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-1" />
                      )}
                      View
                    </Button>
                  </div>
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

      {/* Newsletter Detail Dialog */}
      {detailOpen && selectedNewsletter && (
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            {loadingDetail ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                <DialogHeader>
                  <DialogTitle>{selectedNewsletter.title}</DialogTitle>
                  <DialogDescription>
                    {selectedNewsletter.category} • {selectedNewsletter.pageCount} pages
                  </DialogDescription>
                </DialogHeader>

                {/* Thumbnail */}
                {selectedNewsletter.cloudinaryThumbnail && (
                  <div className="h-48 w-full rounded-lg overflow-hidden">
                    <img
                      src={selectedNewsletter.cloudinaryThumbnail}
                      alt={selectedNewsletter.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Details */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-lg">
                  <div>
                    <p className="text-xs font-medium text-slate-600 mb-1">DESCRIPTION</p>
                    <p className="text-sm text-slate-700">
                      {selectedNewsletter.description || "No description provided"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-slate-600 mb-1">PAGES</p>
                      <p className="text-sm text-slate-700">{selectedNewsletter.pageCount}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-600 mb-1">CATEGORY</p>
                      <p className="text-sm text-slate-700">{selectedNewsletter.category}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-600 mb-1">FILE SIZE</p>
                      <p className="text-sm text-slate-700">
                        {(selectedNewsletter.fileSize / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-600 mb-1">PUBLISHED</p>
                      <p className="text-sm text-slate-700">
                        {new Date(selectedNewsletter.publishedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {selectedNewsletter.isPaid && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                      <p className="text-xs font-medium text-yellow-700">Premium Content</p>
                      <p className="text-xs text-yellow-600 mt-1">
                        This newsletter is exclusive to paid subscribers
                      </p>
                    </div>
                  )}
                </div>

                {/* Info: Web Only Shows Page 1 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex gap-2">
                    <Lock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 mb-1">
                        Full Access Available on Mobile App
                      </p>
                      <p className="text-xs text-blue-700">
                        On the web platform, you can only preview the first page. Download our mobile app
                        to access the complete newsletter.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  onClick={() => {
                    setDetailOpen(false);
                    handleViewPDF(selectedNewsletter);
                  }}
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  View Preview
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* PDF Preview Dialog */}
      {pdfOpen && selectedNewsletter && (
        <Dialog open={pdfOpen} onOpenChange={setPdfOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>{selectedNewsletter.title}</DialogTitle>
              <DialogDescription>
                Page {currentPageNumber} of {selectedNewsletter.pageCount}
              </DialogDescription>
            </DialogHeader>

            {loadingPage ? (
              <div className="flex items-center justify-center py-20 flex-1">
                <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
              </div>
            ) : selectedPage ? (
              <div className="flex-1 overflow-hidden flex flex-col">
                {/* Page Image */}
                <div className="flex-1 overflow-auto bg-slate-100 flex items-center justify-center">
                  <img
                    src={selectedPage.imageUrl}
                    alt={`Page ${currentPageNumber}`}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>

                {/* Navigation */}
                <div className="border-t bg-white p-4 flex justify-between items-center">
                  {currentPageNumber > 1 ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        dispatch(
                          fetchNewsletterPage(
                            selectedNewsletter.id,
                            currentPageNumber - 1
                          ) as any
                        );
                      }}
                    >
                      Previous Page
                    </Button>
                  ) : (
                    <div />
                  )}

                  {currentPageNumber < selectedNewsletter.pageCount ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        const nextPage = currentPageNumber + 1;
                        if (nextPage === 2) {
                          // Next page is 2+, show warning
                          toast.error(
                            "Full content is only available in our Mobile App. Download now to view the complete newsletter!",
                            {
                              duration: 5000,
                            }
                          );
                        } else {
                          dispatch(
                            fetchNewsletterPage(
                              selectedNewsletter.id,
                              nextPage
                            ) as any
                          );
                        }
                      }}
                    >
                      Next Page
                    </Button>
                  ) : (
                    <div />
                  )}
                </div>

                {/* Mobile App Prompt */}
                {currentPageNumber === 1 && selectedNewsletter.pageCount > 1 && (
                  <div className="bg-amber-50 border-t border-amber-200 p-4">
                    <div className="flex items-center gap-2">
                      <Lock className="w-5 h-5 text-amber-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-amber-900">
                          Access complete newsletter on mobile app
                        </p>
                        <p className="text-xs text-amber-700 mt-1">
                          Pages 2+ are only available in our mobile app. Download now to view the entire document.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center py-20 flex-1">
                <p className="text-slate-600">Failed to load page preview</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
