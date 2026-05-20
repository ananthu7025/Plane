/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { InputSelect } from "@/components/ui/input-select";
import { InputCheckbox } from "@/components/ui/input-checkbox";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { createPost } from "@/store/slices/communitySlice";
import type { Category } from "@/store/slices/communitySlice";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// Validation schema
const createPostSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200, "Title is too long"),
  content: z.string().min(10, "Content must be at least 10 characters").max(5000, "Content is too long"),
  categoryId: z.string().min(1, "Please select a category"),
  isAnonymous: z.boolean(),
});

type CreatePostFormData = z.infer<typeof createPostSchema>;

interface CreatePostDialogProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
}

export function CreatePostDialog({ isOpen, onClose, categories }: CreatePostDialogProps) {
  const dispatch = useAppDispatch();
  const creatingPost = useAppSelector((state) => state.community.creatingPost);

  const form = useForm<CreatePostFormData>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      title: "",
      content: "",
      categoryId: "",
      isAnonymous: false,
    },
  });

  const handleSubmit = async (data: CreatePostFormData) => {
    try {
      const categoryId = parseInt(data.categoryId, 10);

      // Validate categoryId is a valid number
      if (isNaN(categoryId) || categoryId <= 0) {
        form.setError("categoryId", {
          message: "Please select a valid category",
        });
        return;
      }

      await dispatch(
        createPost({
          title: data.title,
          content: data.content,
          categoryId,
          isAnonymous: data.isAnonymous,
        }) as any
      );

      form.reset();
      onClose();
    } catch (err: any) {
      const error = err as Record<string, unknown>;
      if (error?.details && typeof error.details === "object" && "field" in error.details) {
        const details = error.details as Record<string, unknown>;
        form.setError(String(details.field) as keyof CreatePostFormData, {
          message: String(error.message || "Validation error"),
        });
      }
    }
  };

  const categoryOptions = categories.map((cat) => ({
    label: cat.name,
    value: String(cat.id),
  }));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        form.reset();
        onClose();
      }
    }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a New Post</DialogTitle>
          <DialogDescription>Share your thoughts with the community</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-900">
              Title
            </label>
            <input
              id="title"
              type="text"
              {...form.register("title")}
              placeholder="Give your post a catchy title..."
              disabled={creatingPost}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-ring focus-visible:ring-offset-background"
            />
            {form.formState.errors.title && (
              <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
            )}
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label htmlFor="content" className="block text-sm font-medium text-gray-900">
              Content
            </label>
            <textarea
              id="content"
              {...form.register("content")}
              placeholder="Share your thoughts, questions, or knowledge..."
              disabled={creatingPost}
              rows={5}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-ring focus-visible:ring-offset-background resize-none"
            />
            {form.formState.errors.content && (
              <p className="text-sm text-red-600">{form.formState.errors.content.message}</p>
            )}
          </div>

          {/* Category */}
          <InputSelect
            hookForm={form}
            field="categoryId"
            label="Category"
            placeholder="Select a category"
            options={categoryOptions}
            disabled={creatingPost || categories.length === 0}
          />

          {/* Anonymous toggle */}
          <InputCheckbox
            hookForm={form}
            field="isAnonymous"
            label="Post as Anonymous"
            description="Your identity will be hidden from other users"
            disabled={creatingPost}
          />

          {/* Actions */}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset();
                onClose();
              }}
              disabled={creatingPost}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={creatingPost}>
              {creatingPost ? "Creating..." : "Create Post"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
