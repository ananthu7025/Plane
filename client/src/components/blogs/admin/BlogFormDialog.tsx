/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { createBlog, updateBlog, clearFormData } from "@/store/slices/blogSlice";
import type { Blog } from "@/types/blogs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Loader2, X } from "lucide-react";
import { toast } from "sonner";

const blogFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(255),
  excerpt: z.string().min(10, "Excerpt must be at least 10 characters").max(500),
  content: z.string().min(50, "Content must be at least 50 characters").max(50000),
  category: z.string().min(1, "Please select a category"),
  status: z.enum(["draft", "published"]),
});

type BlogFormData = z.infer<typeof blogFormSchema>;

interface BlogFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  categories: string[];
  editingBlog?: Blog;
}

export function BlogFormDialog({
  isOpen,
  onClose,
  onSuccess,
  categories,
  editingBlog,
}: BlogFormDialogProps) {
  const dispatch = useAppDispatch();
  const { creatingBlog, updatingBlog, successMessage, error } = useAppSelector(
    (state) => state.blogs
  );

  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);

  const form = useForm<BlogFormData>({
    resolver: zodResolver(blogFormSchema),
    defaultValues: {
      title: "",
      excerpt: "",
      content: "",
      category: "",
      status: "draft",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (editingBlog) {
        form.reset({
          title: editingBlog.title,
          excerpt: editingBlog.excerpt,
          content: editingBlog.content,
          category: editingBlog.category,
          status: editingBlog.status,
        });
        setCoverImagePreview(editingBlog.coverImageUrl || null);
      } else {
        form.reset({ title: "", excerpt: "", content: "", category: "", status: "draft" });
        setCoverImageFile(null);
        setCoverImagePreview(null);
      }
    }
  }, [editingBlog, isOpen, form]);

  useEffect(() => {
    if (successMessage && isOpen) {
      toast.success(successMessage);
      handleClose();
      onSuccess?.();
    }
  }, [successMessage]);

  useEffect(() => {
    if (error && isOpen) {
      toast.error(error);
    }
  }, [error]);

  const handleClose = () => {
    form.reset();
    setCoverImageFile(null);
    setCoverImagePreview(null);
    dispatch(clearFormData());
    onClose();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }
    setCoverImageFile(file);
    setCoverImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setCoverImageFile(null);
    setCoverImagePreview(editingBlog?.coverImageUrl || null);
  };

  const onSubmit = async (data: BlogFormData) => {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("excerpt", data.excerpt);
    formData.append("content", data.content);
    formData.append("category", data.category);
    formData.append("status", data.status);
    if (coverImageFile) {
      formData.append("coverImage", coverImageFile);
    }

    if (editingBlog) {
      await dispatch(updateBlog(editingBlog.id, formData) as any);
    } else {
      await dispatch(createBlog(formData) as any);
    }
  };

  const isLoading = creatingBlog || updatingBlog;
  const isEditing = !!editingBlog;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Blog" : "Create New Blog"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the blog details below"
              : "Fill in the form to create a new blog post"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Title <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-gray-500">{form.watch("title").length}/255</span>
            </div>
            <Input
              placeholder="Enter blog title (minimum 5 characters)"
              {...form.register("title")}
              maxLength={255}
              className={form.formState.errors.title ? "border-red-500" : ""}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          {/* Excerpt */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Excerpt <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-gray-500">{form.watch("excerpt").length}/500</span>
            </div>
            <textarea
              placeholder="Brief summary of the article (minimum 10 characters)"
              {...form.register("excerpt")}
              maxLength={500}
              rows={2}
              className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 ${
                form.formState.errors.excerpt
                  ? "border-red-500 focus:ring-red-500"
                  : "border-input focus:ring-ring"
              }`}
            />
            {form.formState.errors.excerpt && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.excerpt.message}
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <Select
              value={form.watch("category")}
              onValueChange={(value) => form.setValue("category", value)}
            >
              <SelectTrigger className={form.formState.errors.category ? "border-red-500" : ""}>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.category && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.category.message}
              </p>
            )}
          </div>

          {/* Content */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Content <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-gray-500">
                {form.watch("content").length}/50000
              </span>
            </div>
            <textarea
              placeholder="Write your blog content here... (minimum 50 characters)"
              {...form.register("content")}
              maxLength={50000}
              rows={8}
              className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 ${
                form.formState.errors.content
                  ? "border-red-500 focus:ring-red-500"
                  : "border-input focus:ring-ring"
              }`}
            />
            {form.formState.errors.content && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.content.message}
              </p>
            )}
          </div>

          {/* Cover Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cover Image{" "}
              <span className="text-gray-500 font-normal">(Optional)</span>
            </label>

            {coverImagePreview ? (
              <div className="relative">
                <img
                  src={coverImagePreview}
                  alt="Cover preview"
                  className="w-full h-40 object-cover rounded-lg border border-slate-200"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-gray-100 transition"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
                {coverImageFile && (
                  <p className="text-xs text-gray-500 mt-1">{coverImageFile.name}</p>
                )}
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-slate-400 transition">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="cover-image-input"
                />
                <label htmlFor="cover-image-input" className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <p className="text-sm font-medium text-slate-700">
                    Click to select cover image or drag and drop
                  </p>
                  <p className="text-xs text-slate-500 mt-1">PNG, JPG, WebP (Max 5MB)</p>
                </label>
              </div>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status <span className="text-red-500">*</span>
            </label>
            <Select
              value={form.watch("status")}
              onValueChange={(value) =>
                form.setValue("status", value as "draft" | "published")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft (Hidden from students)</SelectItem>
                <SelectItem value="published">Published (Visible to students)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? "Update Blog" : "Create Blog"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
