/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Search, Plus, Trash2, Edit2, Upload, Archive, Eye } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import PermissionGate from "@/components/common/PermissionGate";
import PDFViewer from "@/components/PDFViewer";
import { DeleteConfirmDialog } from "@/components/shared";
import { InputText } from "@/components/ui/input-text";
import { InputSelect } from "@/components/ui/input-select";
import { InputTextarea } from "@/components/ui/input-textarea";
import { Permissions } from "@/lib/permissions";
import { NEWSLETTER_CATEGORIES_LIST, NEWSLETTER_STATUS_FILTER_OPTIONS } from "@/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  fetchAdminNewsletters,
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

const createNewsletterSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
});

const editNewsletterSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").optional(),
  description: z.string().optional(),
  category: z.string().optional(),
});

type CreateNewsletterForm = z.infer<typeof createNewsletterSchema>;
type EditNewsletterForm = z.infer<typeof editNewsletterSchema>;

export default function AdminNewsletters() {
  const dispatch = useAppDispatch();

  // Redux state
  const {
    adminNewsletters = [],
    adminPage = 1,
    adminPagination,
    adminSearch = "",
    adminCategory = "All",
    adminStatus = "all",
    adminSort = "recent",
    loadingAdminNewsletters = false,
    creatingNewsletter = false,
    updatingNewsletter = false,
    deletingNewsletter = false,
    togglingStatus = false,
    error,
    successMessage,
  } = useAppSelector((state) => state.newsletters) || {};

  // Local state
  const [searchInput, setSearchInput] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null);
  const [viewingNewsletterId, setViewingNewsletterId] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    open: boolean;
    newsletterId: string | null;
  }>({
    open: false,
    newsletterId: null,
  });

  const createForm = useForm<CreateNewsletterForm>({
    resolver: zodResolver(createNewsletterSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
    },
  });

  const editForm = useForm<EditNewsletterForm>({
    resolver: zodResolver(editNewsletterSchema),
  });

  // Prevent duplicate API calls and toasts in Strict Mode
  const shownMessagesRef = useRef<Set<string>>(new Set());
  const lastFetchRef = useRef<{
    page: number;
    search: string;
    category: string;
    status: string;
    sort: string;
  } | null>(null);

  // Toast notifications
  useEffect(() => {
    if (successMessage && !shownMessagesRef.current.has(successMessage)) {
      shownMessagesRef.current.add(successMessage);
      toast.success(successMessage);
      dispatch(clearSuccessMessage());
      setIsCreateOpen(false);
      setIsEditOpen(false);
      createForm.reset();
      editForm.reset();
      setSelectedFile(null);
      setSelectedThumbnail(null);
      setEditingId(null);
    }
  }, [successMessage, dispatch, createForm, editForm]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Load admin newsletters (prevent duplicate calls in Strict Mode)
  useEffect(() => {
    const currentFetch = {
      page: adminPage,
      search: adminSearch,
      category: adminCategory,
      status: adminStatus === "all" ? "" : adminStatus,
      sort: adminSort,
    };
    const lastFetch = lastFetchRef.current;

    // Only fetch if parameters have changed or this is the first fetch
    if (
      !lastFetch ||
      lastFetch.page !== currentFetch.page ||
      lastFetch.search !== currentFetch.search ||
      lastFetch.category !== currentFetch.category ||
      lastFetch.status !== currentFetch.status ||
      lastFetch.sort !== currentFetch.sort
    ) {
      lastFetchRef.current = currentFetch;
      dispatch(
        fetchAdminNewsletters({
          page: adminPage,
          search: adminSearch,
          category: adminCategory,
          status: adminStatus === "all" ? undefined : adminStatus,
          sort: adminSort,
        }) as any
      );
    }
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
    formData.append("description", data.description || "");
    formData.append("category", data.category);
    formData.append("file", selectedFile);
    if (selectedThumbnail) {
      formData.append("thumbnailFile", selectedThumbnail);
    }

    dispatch(createNewsletter(formData) as any);
  };

  // Handle edit newsletter
  const handleEditSubmit = (data: EditNewsletterForm) => {
    if (!editingId) return;

    const payload: EditNewsletterForm = {
      ...(data.title && { title: data.title }),
      ...(data.description && { description: data.description }),
      ...(data.category && { category: data.category }),
    };

    dispatch(updateNewsletter(editingId, payload) as any);
  };

  // Handle delete
  const handleDeleteClick = (id: string) => {
    setDeleteConfirmation({ open: true, newsletterId: id });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmation.newsletterId) {
      dispatch(deleteNewsletter(deleteConfirmation.newsletterId) as any);
      setDeleteConfirmation({ open: false, newsletterId: null });
    }
  };

  // Handle edit open
  const handleEditOpen = (newsletter: any) => {
    setEditingId(newsletter.id);
    editForm.reset({
      title: newsletter.title,
      description: newsletter.description,
      category: newsletter.category,
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

  const categories = NEWSLETTER_CATEGORIES_LIST;

  // Get viewing newsletter data
  const viewingNewsletter = viewingNewsletterId
    ? adminNewsletters.find((n) => n.id === viewingNewsletterId)
    : null;

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
                  <InputText
                    hookForm={createForm}
                    field="title"
                    label="Title"
                    labelMandatory
                    placeholder="Newsletter title..."
                  />

                  <InputTextarea
                    hookForm={createForm}
                    field="description"
                    label="Description"
                    placeholder="Newsletter description..."
                  />

                  <InputSelect
                    hookForm={createForm}
                    field="category"
                    label="Category"
                    labelMandatory
                    placeholder="Select category"
                    options={categories
                      .filter((c) => c !== "All")
                      .map((cat) => ({ value: cat, label: cat }))}
                  />

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

                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">
                      Thumbnail Image (Optional)
                    </label>
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-slate-400 transition">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && file.type.startsWith("image/")) {
                            setSelectedThumbnail(file);
                          } else if (file) {
                            toast.error("Please select a valid image file");
                          }
                        }}
                        className="hidden"
                        id="thumbnail-input"
                      />
                      <label htmlFor="thumbnail-input" className="cursor-pointer">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                        <p className="text-sm font-medium text-slate-700">
                          {selectedThumbnail ? selectedThumbnail.name : "Click to select thumbnail or drag and drop"}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">PNG, JPG, WebP (Max 5MB)</p>
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
                {NEWSLETTER_STATUS_FILTER_OPTIONS.map(
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
                    {newsletter.thumbnailCloudinaryUrl && (
                      <img
                        src={newsletter.thumbnailCloudinaryUrl}
                        alt={newsletter.title}
                        className="w-20 h-24 object-cover rounded-md flex-shrink-0"
                      />
                    )}
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
                      onClick={() => setViewingNewsletterId(newsletter.id)}
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
                        onClick={() => handleDeleteClick(newsletter.id)}
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
              <InputText
                hookForm={editForm}
                field="title"
                label="Title"
                placeholder="Newsletter title..."
              />

              <InputTextarea
                hookForm={editForm}
                field="description"
                label="Description"
                placeholder="Newsletter description..."
              />

              <InputSelect
                hookForm={editForm}
                field="category"
                label="Category"
                placeholder="Select category"
                options={categories
                  .filter((c) => c !== "All")
                  .map((cat) => ({ value: cat, label: cat }))}
              />

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

      {/* PDF Viewer Modal */}
      {viewingNewsletter && (
        <Dialog open={!!viewingNewsletterId} onOpenChange={(open) => !open && setViewingNewsletterId(null)}>
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmDialog
        isOpen={deleteConfirmation.open}
        title="Delete Newsletter"
        itemName="this newsletter"
        isDeleting={deletingNewsletter}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmation({ open: false, newsletterId: null })}
      />
    </div>
  );
}
