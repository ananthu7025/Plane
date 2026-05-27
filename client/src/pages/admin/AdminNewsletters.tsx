/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Search, Plus, Trash2, Edit2, Upload, Archive, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import PermissionGate from "@/components/common/PermissionGate";
import { Permissions } from "@/lib/permissions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import {
  fetchAdminNewsletters,
  fetchNewsletterPage,
  createNewsletter,
  updateNewsletter,
  deleteNewsletter,
  toggleNewsletterStatus,
  clearError,
  clearSuccessMessage,
  setAdminSearch,
  setAdminCategory,
  setAdminStatus,
  setAdminSort,
  setAdminPage,
} from "@/store/slices/newsletterSlice";

interface CreateNewsletterForm {
  title: string;
  description: string;
  category: string;
  isPaid: boolean;
}

interface EditNewsletterForm {
  title?: string;
  description?: string;
  category?: string;
  isPaid?: boolean;
}

export default function AdminNewsletters() {
  const dispatch = useAppDispatch();

  // Redux state
  const {
    adminNewsletters,
    adminPage,
    adminPagination,
    adminSearch,
    adminCategory,
    adminStatus,
    adminSort,
    loadingAdminNewsletters,
    creatingNewsletter,
    updatingNewsletter,
    deletingNewsletter,
    togglingStatus,
    selectedPage,
    loadingPage,
    error,
    successMessage,
  } = useAppSelector((state) => state.newsletters);

  // Local state
  const [searchInput, setSearchInput] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [viewingNewsletterId, setViewingNewsletterId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const createForm = useForm<CreateNewsletterForm>({
    defaultValues: {
      title: "",
      description: "",
      category: "",
      isPaid: false,
    },
  });

  const editForm = useForm<EditNewsletterForm>();

  // Toast notifications
  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearSuccessMessage());
      setIsCreateOpen(false);
      setIsEditOpen(false);
      createForm.reset();
      editForm.reset();
      setSelectedFile(null);
      setEditingId(null);
    }
  }, [successMessage, dispatch, createForm, editForm]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Load admin newsletters
  useEffect(() => {
    dispatch(
      fetchAdminNewsletters({
        page: adminPage,
        search: adminSearch,
        category: adminCategory,
        status: adminStatus === "all" ? undefined : adminStatus,
        sort: adminSort,
      }) as any
    );
  }, [dispatch, adminPage, adminSearch, adminCategory, adminStatus, adminSort]);

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleSearchSubmit = () => {
    dispatch(setAdminSearch(searchInput));
  };

  // Handle create newsletter
  const handleCreateSubmit = (data: CreateNewsletterForm) => {
    if (!selectedFile) {
      toast.error("Please select a PDF file");
      return;
    }

    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("category", data.category);
    formData.append("isPaid", String(data.isPaid));
    formData.append("file", selectedFile);

    dispatch(createNewsletter(formData) as any);
  };

  // Handle edit newsletter
  const handleEditSubmit = (data: EditNewsletterForm) => {
    if (!editingId) return;

    const payload: EditNewsletterForm = {
      ...(data.title && { title: data.title }),
      ...(data.description && { description: data.description }),
      ...(data.category && { category: data.category }),
      ...(data.isPaid !== undefined && { isPaid: data.isPaid }),
    };

    dispatch(updateNewsletter(editingId, payload) as any);
  };

  // Handle delete
  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this newsletter?")) {
      dispatch(deleteNewsletter(id) as any);
    }
  };

  // Handle edit open
  const handleEditOpen = (newsletter: any) => {
    setEditingId(newsletter.id);
    editForm.reset({
      title: newsletter.title,
      description: newsletter.description,
      category: newsletter.category,
      isPaid: newsletter.isPaid,
    });
    setIsEditOpen(true);
  };

  // Handle toggle status
  const handleToggleStatus = (id: string, currentStatus: string) => {
    let newStatus: "published" | "archived" | "draft" = "published";
    if (currentStatus === "published") {
      newStatus = "archived";
    }
    dispatch(toggleNewsletterStatus(id, newStatus) as any);
  };

  // Handle view newsletter
  const handleView = (newsletter: any) => {
    setViewingNewsletterId(newsletter.id);
    setCurrentPage(1);
    // Load the first page
    loadPage(newsletter.id, 1);
  };

  // Load a specific page using Redux thunk
  const loadPage = (newsletterId: string, pageNum: number) => {
    dispatch(fetchNewsletterPage(newsletterId, pageNum) as any);
    setCurrentPage(pageNum);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-700";
      case "archived":
        return "bg-gray-100 text-gray-700";
      case "draft":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const categories = ["All", "Aviation News", "Safety Tips", "Industry Updates"];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Newsletters Management</h1>
            <p className="text-slate-600">Upload, edit, and manage newsletters</p>
          </div>
          <PermissionGate permission={Permissions.MANAGE_NEWSLETTERS}>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Upload Newsletter
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Upload New Newsletter</DialogTitle>
                  <DialogDescription>
                    Upload a PDF newsletter with metadata
                  </DialogDescription>
                </DialogHeader>

                <form
                  onSubmit={createForm.handleSubmit(handleCreateSubmit)}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">
                      Title *
                    </label>
                    <Input
                      placeholder="Newsletter title..."
                      {...createForm.register("title", {
                        required: "Title is required",
                        minLength: { value: 5, message: "Minimum 5 characters" },
                      })}
                    />
                    {createForm.formState.errors.title && (
                      <p className="text-red-600 text-sm mt-1">
                        {createForm.formState.errors.title.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">
                      Description
                    </label>
                    <Textarea
                      placeholder="Newsletter description..."
                      {...createForm.register("description")}
                      className="resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">
                      Category *
                    </label>
                    <Select
                      value={createForm.watch("category")}
                      onValueChange={(value) =>
                        createForm.setValue("category", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories
                          .filter((c) => c !== "All")
                          .map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {createForm.formState.errors.category && (
                      <p className="text-red-600 text-sm mt-1">
                        {createForm.formState.errors.category.message}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50">
                    <input
                      type="checkbox"
                      {...createForm.register("isPaid")}
                      id="isPaid"
                      className="w-4 h-4"
                    />
                    <label htmlFor="isPaid" className="text-sm text-slate-700">
                      Paid (Premium) Newsletter
                    </label>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">
                      PDF File *
                    </label>
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-slate-400 transition">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && file.type === "application/pdf") {
                            setSelectedFile(file);
                          } else {
                            toast.error("Please select a valid PDF file");
                          }
                        }}
                        className="hidden"
                        id="pdf-input"
                      />
                      <label htmlFor="pdf-input" className="cursor-pointer">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                        <p className="text-sm font-medium text-slate-700">
                          {selectedFile ? selectedFile.name : "Click to select PDF or drag and drop"}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Max 50MB</p>
                      </label>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={creatingNewsletter}
                    className="w-full"
                  >
                    {creatingNewsletter ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Newsletter
                      </>
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </PermissionGate>
        </div>

        {/* Filters */}
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

              {/* Category and Status Filters */}
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium text-slate-600 py-2">Category:</span>
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={
                      adminCategory === (category === "All" ? "" : category)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      dispatch(
                        setAdminCategory(category === "All" ? "" : category)
                      )
                    }
                    className="capitalize"
                  >
                    {category}
                  </Button>
                ))}
              </div>

              {/* Status and Sort */}
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium text-slate-600 py-2">Status:</span>
                {(["all", "published", "archived", "draft"] as const).map(
                  (status) => (
                    <Button
                      key={status}
                      variant={adminStatus === status ? "default" : "outline"}
                      size="sm"
                      onClick={() => dispatch(setAdminStatus(status))}
                      className="capitalize"
                    >
                      {status}
                    </Button>
                  )
                )}
              </div>

              {/* Sort */}
              <div className="flex gap-2">
                <span className="text-sm font-medium text-slate-600 py-2">Sort:</span>
                {(["recent", "oldest"] as const).map((sort) => (
                  <Button
                    key={sort}
                    variant={adminSort === sort ? "default" : "outline"}
                    size="sm"
                    onClick={() => dispatch(setAdminSort(sort))}
                    className="capitalize"
                  >
                    {sort}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Newsletters List */}
        <div className="space-y-4">
          {loadingAdminNewsletters && adminNewsletters.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            </div>
          ) : adminNewsletters.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-slate-600">No newsletters found</p>
              </CardContent>
            </Card>
          ) : (
            adminNewsletters.map((newsletter) => (
              <Card
                key={newsletter.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">
                        {newsletter.title}
                      </CardTitle>
                      <div className="flex gap-2 items-center flex-wrap">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                            newsletter.status
                          )}`}
                        >
                          {newsletter.status}
                        </span>
                        {newsletter.isPaid && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                            Paid
                          </span>
                        )}
                        <span className="text-sm text-slate-600">
                          {newsletter.pageCount} pages
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {newsletter.description && (
                    <p className="text-slate-700 text-sm">
                      {newsletter.description}
                    </p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-600">
                    <div>
                      <p className="font-medium">Category</p>
                      <p>{newsletter.category}</p>
                    </div>
                    <div>
                      <p className="font-medium">Size</p>
                      <p>
                        {(newsletter.fileSize / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Published</p>
                      <p>
                        {new Date(newsletter.publishedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Created</p>
                      <p>
                        {new Date(newsletter.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(newsletter)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>

                    <PermissionGate
                      permission={Permissions.MANAGE_NEWSLETTERS}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditOpen(newsletter)}
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Edit
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleToggleStatus(newsletter.id, newsletter.status)
                        }
                        disabled={togglingStatus}
                      >
                        {togglingStatus ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <Archive className="w-4 h-4 mr-1" />
                        )}
                        {newsletter.status === "published"
                          ? "Archive"
                          : "Publish"}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 ml-auto"
                        disabled={deletingNewsletter}
                        onClick={() => handleDelete(newsletter.id)}
                      >
                        {deletingNewsletter ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </PermissionGate>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {adminNewsletters.length > 0 && adminPagination && (
          <div className="mt-8 flex justify-center gap-2">
            <Button
              variant="outline"
              disabled={adminPage === 1}
              onClick={() => dispatch(setAdminPage(adminPage - 1))}
            >
              Previous
            </Button>
            <span className="py-2 px-4 text-sm text-slate-600">
              Page {adminPage} of {adminPagination.totalPages}
            </span>
            <Button
              variant="outline"
              disabled={adminPage === adminPagination.totalPages}
              onClick={() => dispatch(setAdminPage(adminPage + 1))}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      {isEditOpen && editingId && (
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Newsletter</DialogTitle>
              <DialogDescription>
                Update newsletter metadata
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={editForm.handleSubmit(handleEditSubmit)}
              className="space-y-4"
            >
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Title
                </label>
                <Input
                  placeholder="Newsletter title..."
                  {...editForm.register("title")}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Description
                </label>
                <Textarea
                  placeholder="Newsletter description..."
                  {...editForm.register("description")}
                  className="resize-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Category
                </label>
                <Select
                  value={editForm.watch("category") || ""}
                  onValueChange={(value) =>
                    editForm.setValue("category", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter((c) => c !== "All")
                      .map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50">
                <input
                  type="checkbox"
                  {...editForm.register("isPaid")}
                  id="editIsPaid"
                  className="w-4 h-4"
                />
                <label htmlFor="editIsPaid" className="text-sm text-slate-700">
                  Paid (Premium) Newsletter
                </label>
              </div>

              <Button
                type="submit"
                disabled={updatingNewsletter}
                className="w-full"
              >
                {updatingNewsletter ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Update Newsletter
                  </>
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Newsletter Viewer Modal */}
      {viewingNewsletterId && (
        <Dialog open={!!viewingNewsletterId} onOpenChange={(open) => !open && setViewingNewsletterId(null)}>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>Newsletter Viewer</DialogTitle>
              <DialogDescription>
                Page {currentPage} - {adminNewsletters.find(n => n.id === viewingNewsletterId)?.pageCount || 1} pages
              </DialogDescription>
            </DialogHeader>

            <div className="w-full bg-slate-100 rounded-lg flex items-center justify-center min-h-[500px]">
              {loadingPage ? (
                <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
              ) : selectedPage ? (
                <iframe
                  src={`https://docs.google.com/gview?url=${encodeURIComponent(selectedPage.imageUrl)}&embedded=true`}
                  title={`Page ${currentPage}`}
                  className="w-full h-[500px] border-0 rounded-lg"
                  onError={() => {
                    console.error("Failed to load PDF. URL:", selectedPage.imageUrl);
                    toast.error("Failed to load PDF");
                  }}
                  onLoad={() => {
                    console.log("PDF loaded successfully");
                  }}
                />
              ) : (
                <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
              )}
            </div>

            {/* Page Navigation - Admin only sees page 1 */}
            <div className="flex justify-between items-center mt-4">
              <Button variant="outline" size="sm" disabled className="invisible">
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <span className="text-sm text-slate-600">
                Page 1 of {adminNewsletters.find(n => n.id === viewingNewsletterId)?.pageCount || 1}
                <span className="text-xs text-slate-500 ml-2">(Admin preview only)</span>
              </span>
              <Button variant="outline" size="sm" disabled className="invisible">
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
