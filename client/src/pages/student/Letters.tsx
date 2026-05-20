/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search, Plus, Trash2, Send, Heart } from "lucide-react";
import {
  fetchPublicLetters,
  fetchMyLetters,
  fetchLetterStats,
  clearError,
  clearSuccessMessage,
  setPublicSearch,
  setPublicSort,
  setMyLettersStatus,
  setMyLettersPage,
  toggleLetterLike,
  createNewLetter,
  deleteLetter,
} from "@/store/slices/letterSlice";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";

interface CreateLetterForm {
  subject: string;
  content: string;
  isAnonymous: boolean;
}

export default function Letters() {
  const dispatch = useAppDispatch();
  const { topSentinelRef, bottomSentinelRef, setCallbacks } = useInfiniteScroll({
    threshold: 0.5,
    rootMargin: "200px 0px",
  });

  // Redux state
  const {
    publicLetters,
    publicHasMore,
    publicSearch,
    publicSort,
    loadingPublicLetters,
    myLetters,
    myLettersPage,
    myLettersStatus,
    loadingMyLetters,
    stats,
    creatingLetter,
    error,
    successMessage,
  } = useAppSelector((state) => state.letters);

  // Local state
  const [searchInput, setSearchInput] = useState("");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("public");
  const [viewLetterOpen, setViewLetterOpen] = useState<string | null>(null);
  const isLoadingRef = useRef(false);

  const form = useForm<CreateLetterForm>({
    defaultValues: {
      subject: "",
      content: "",
      isAnonymous: false,
    },
  });

  // Toast notifications
  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearSuccessMessage());
      setIsCreateOpen(false);
      form.reset();
    }
  }, [successMessage, dispatch, form]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Load public letters initially
  useEffect(() => {
    dispatch(
      fetchPublicLetters({
        page: 1,
        search: publicSearch,
        sortBy: publicSort,
      }) as any
    );
    dispatch(fetchLetterStats() as any);
    setCurrentPage(1);
  }, [dispatch, publicSearch, publicSort]);

  // Load my letters when tab changes or filters change
  useEffect(() => {
    if (activeTab === "my") {
      dispatch(
        fetchMyLetters({
          page: myLettersPage,
          status: myLettersStatus === "all" ? undefined : myLettersStatus,
        }) as any
      );
    }
  }, [dispatch, activeTab, myLettersPage, myLettersStatus]);

  // Load more public letters
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
    setCallbacks(undefined, loadMoreLetters);
  }, [setCallbacks, loadMoreLetters]);

  // Handle public search
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-700";
      case "PENDING":
        return "bg-yellow-100 text-yellow-700";
      case "REJECTED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Letters</h1>
            <p className="text-slate-600">Share your thoughts, stories, and gratitude with the community</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Write a Letter
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Letter</DialogTitle>
                <DialogDescription>
                  Share your thoughts and experiences with the community
                </DialogDescription>
              </DialogHeader>

              <form
                onSubmit={form.handleSubmit((data) => {
                  dispatch(
                    createNewLetter({
                      subject: data.subject,
                      content: data.content,
                      isAnonymous: data.isAnonymous,
                    }) as any
                  );
                })}
                className="space-y-4"
              >
                {/* Letter-style writing area with typewriter font */}
                <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-800/30 rounded-lg p-6 space-y-4">
                  <div className="text-right text-sm text-slate-500" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
                    {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </div>

                  <Input
                    placeholder="Subject of your letter..."
                    {...form.register("subject", {
                      required: "Subject is required",
                      minLength: { value: 5, message: "Subject must be at least 5 characters" },
                    })}
                    className="bg-transparent border-none border-b border-amber-200/50 dark:border-amber-800/30 rounded-none px-0 text-lg focus-visible:ring-0 placeholder:text-slate-400/50"
                    style={{ fontFamily: "'Courier New', Courier, monospace" }}
                  />
                  {form.formState.errors.subject && (
                    <p className="text-red-600 text-sm">{form.formState.errors.subject.message}</p>
                  )}

                  <Textarea
                    placeholder="Dear Plane & Prop Community,&#10;&#10;Write your letter here... Share your experiences, gratitude, advice, or stories with fellow aviation enthusiasts.&#10;&#10;Warm regards,&#10;Your name"
                    {...form.register("content", {
                      required: "Content is required",
                      minLength: { value: 20, message: "Content must be at least 20 characters" },
                      maxLength: { value: 10000, message: "Content cannot exceed 10000 characters" },
                    })}
                    className="bg-transparent border-none min-h-[250px] px-0 focus-visible:ring-0 leading-relaxed placeholder:text-slate-400/40 resize-none"
                    style={{ fontFamily: "'Courier New', Courier, monospace", lineHeight: "2" }}
                  />
                  {form.formState.errors.content && (
                    <p className="text-red-600 text-sm">{form.formState.errors.content.message}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <input
                    type="checkbox"
                    {...form.register("isAnonymous")}
                    id="isAnonymous"
                    className="w-4 h-4"
                  />
                  <label htmlFor="isAnonymous" className="text-sm text-slate-700">
                    Post anonymously
                  </label>
                </div>

                <Button type="submit" disabled={creatingLetter} className="w-full">
                  {creatingLetter ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Letter
                    </>
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-blue-50 border-blue-100">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Published Letters</p>
                    <div className="text-3xl font-bold text-slate-900">{stats.total}</div>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-100">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Total Acknowledgements</p>
                    <div className="text-3xl font-bold text-slate-900">{stats.approved || 0}</div>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="public" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="public">Public Letters</TabsTrigger>
            <TabsTrigger value="my">My Letters</TabsTrigger>
          </TabsList>

          {/* Public Letters Tab */}
          <TabsContent value="public" className="space-y-6">
            {/* Search and Filter Bar */}
            <Card>
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
                        <button
                          onClick={() => dispatch(toggleLetterLike(letter.id) as any)}
                          className={`flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity ${
                            letter.isLiked ? "text-red-500 font-semibold" : "text-slate-600"
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${letter.isLiked ? "fill-current" : ""}`} />
                          {letter.acknowledgementCount} acknowledgements
                        </button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setViewLetterOpen(letter.id)}
                      >
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
          </TabsContent>

          {/* My Letters Tab */}
          <TabsContent value="my" className="space-y-6">
            {/* Status Filter */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-2">
                  <span className="text-sm font-medium text-slate-600 py-2">Filter by:</span>
                  {(["all", "PENDING", "APPROVED", "REJECTED"] as const).map((status) => (
                    <Button
                      key={status}
                      variant={myLettersStatus === status ? "default" : "outline"}
                      size="sm"
                      onClick={() => dispatch(setMyLettersStatus(status))}
                      className="capitalize"
                    >
                      {status === "all" ? "All" : getStatusLabel(status)}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Letters List */}
            <div className="space-y-4">
              {loadingMyLetters && myLetters.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                </div>
              ) : myLetters.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-slate-600 mb-4">No letters yet</p>
                    <Button onClick={() => setIsCreateOpen(true)}>Create your first letter</Button>
                  </CardContent>
                </Card>
              ) : (
                myLetters.map((letter) => (
                  <Card key={letter.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2">{letter.subject}</CardTitle>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                                letter.status
                              )}`}
                            >
                              {getStatusLabel(letter.status)}
                            </span>
                            <span className="text-sm text-slate-600">
                              {new Date(letter.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this letter?")) {
                              dispatch(deleteLetter(letter.id) as any);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-slate-700 line-clamp-2">{letter.content}</p>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Heart className="w-4 h-4" />
                        <span>{letter.acknowledgementCount} acknowledgements</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Pagination */}
            {myLetters.length > 0 && (
              <div className="mt-8 flex justify-center gap-2">
                <Button
                  variant="outline"
                  disabled={myLettersPage === 1}
                  onClick={() => dispatch(setMyLettersPage(myLettersPage - 1))}
                >
                  Previous
                </Button>
                <span className="py-2 px-4 text-sm text-slate-600">Page {myLettersPage}</span>
                <Button variant="outline" onClick={() => dispatch(setMyLettersPage(myLettersPage + 1))}>
                  Next
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* View Letter Dialog */}
        {viewLetterOpen && (
          <Dialog open={!!viewLetterOpen} onOpenChange={() => setViewLetterOpen(null)}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              {publicLetters.find((l) => l.id === viewLetterOpen) && (
                <div className="space-y-4">
                  <DialogHeader>
                    <DialogTitle>
                      {publicLetters.find((l) => l.id === viewLetterOpen)?.subject}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="bg-amber-50/30 dark:bg-amber-950/10 rounded-lg p-6 border border-amber-200/30 dark:border-amber-800/20">
                    <div className="mb-4">
                      <p className="text-sm text-slate-600 mb-2">
                        <strong>From:</strong> {publicLetters.find((l) => l.id === viewLetterOpen)?.author?.fullName || "Anonymous"}
                      </p>
                    </div>
                    <div
                      className="whitespace-pre-line leading-relaxed text-slate-700"
                      style={{ fontFamily: "'Courier New', Courier, monospace", lineHeight: "1.8" }}
                    >
                      {publicLetters.find((l) => l.id === viewLetterOpen)?.content}
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
