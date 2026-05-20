import { useEffect, useState, useCallback, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Search, Plus } from "lucide-react";
import {
  fetchPublicLetters,
  clearError,
  clearSuccessMessage,
  setPublicSearch,
  setPublicSort,
  toggleLetterLike,
} from "@/store/slices/letterSlice";

export default function StudentLetterFeed() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { topSentinelRef, bottomSentinelRef, setCallbacks } = useInfiniteScroll({
    threshold: 0.5,
    rootMargin: "200px 0px",
  });

  // Redux state
  const {
    publicLetters,
    publicPage,
    publicTotal,
    publicHasMore,
    publicSearch,
    publicSort,
    loadingPublicLetters,
    error,
    successMessage,
  } = useAppSelector((state) => state.letters);

  // Local UI state
  const [searchInput, setSearchInput] = useState("");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const isLoadingRef = useRef(false);

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

  // Initial load
  useEffect(() => {
    dispatch(
      fetchPublicLetters({
        page: 1,
        search: publicSearch,
        sortBy: publicSort,
      }) as any
    );
    setCurrentPage(1);
  }, [dispatch, publicSearch, publicSort]);

  // Load more posts
  const loadMoreLetters = useCallback(() => {
    if (isLoadingRef.current || !publicHasMore || loadingPublicLetters) return;

    isLoadingRef.current = true;
    setIsLoadingMore(true);

    const nextPage = currentPage + 1;
    dispatch(
      fetchPublicLetters({
        page: nextPage,
        search: publicSearch,
        sortBy: publicSort,
      }) as any
    );

    setCurrentPage(nextPage);
    setTimeout(() => {
      isLoadingRef.current = false;
      setIsLoadingMore(false);
    }, 500);
  }, [currentPage, publicHasMore, publicSearch, publicSort, loadingPublicLetters, dispatch]);

  // Setup infinite scroll
  useEffect(() => {
    setCallbacks({ onLoadMore: loadMoreLetters });
  }, [setCallbacks, loadMoreLetters]);

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleSearchSubmit = () => {
    dispatch(setPublicSearch(searchInput));
    setCurrentPage(1);
  };

  // Handle sort change
  const handleSortChange = (sortBy: "recent" | "popular" | "trending") => {
    dispatch(setPublicSort(sortBy));
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Student Letters</h1>
          <p className="text-slate-600">Read and engage with letters from your peers</p>
        </div>

        {/* Search and Filter Bar */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Search */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search letters..."
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

              {/* Sort Options */}
              <div className="flex gap-2">
                <span className="text-sm font-medium text-slate-600 py-2">Sort by:</span>
                {(["recent", "popular", "trending"] as const).map((sort) => (
                  <Button
                    key={sort}
                    variant={publicSort === sort ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSortChange(sort)}
                    className="capitalize"
                  >
                    {sort}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Sentinel */}
        <div ref={topSentinelRef} className="h-0 invisible" />

        {/* Letters Feed */}
        <div className="space-y-4">
          {loadingPublicLetters && publicLetters.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            </div>
          ) : publicLetters.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-slate-600">No letters found. Check back later!</p>
              </CardContent>
            </Card>
          ) : (
            publicLetters.map((letter) => (
              <Card key={letter.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl mb-1">{letter.subject}</CardTitle>
                      <p className="text-sm text-slate-600">
                        {letter.author?.fullName || "Anonymous"} •{" "}
                        {new Date(letter.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                      Published
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-slate-700 line-clamp-3">{letter.content}</p>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span>👁️ {letter.viewCount} views</span>
                    <button
                      onClick={() => dispatch(toggleLetterLike(letter.id) as any)}
                      className={`cursor-pointer hover:opacity-80 transition-opacity ${
                        letter.isLiked ? "text-red-500 font-semibold" : "text-slate-600"
                      }`}
                    >
                      ❤️ {letter.acknowledgementCount} likes
                    </button>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    Read More
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Loading indicator for infinite scroll */}
        {isLoadingMore && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        )}

        {/* Bottom Sentinel */}
        <div ref={bottomSentinelRef} className="h-0 invisible" />

        {/* No more content message */}
        {!publicHasMore && publicLetters.length > 0 && (
          <div className="text-center py-8">
            <p className="text-slate-600">No more letters to load</p>
          </div>
        )}
      </div>
    </div>
  );
}
