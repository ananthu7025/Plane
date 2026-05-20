import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "@/components/ui/input-text";
import { InputTextarea } from "@/components/ui/input-textarea";
import { createCategorySchema, type CreateCategoryFormData } from "@/lib/schemas";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface AdminCategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCategoryFormData) => void;
  isLoading?: boolean;
}

export function AdminCategoryDialog({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: AdminCategoryDialogProps) {
  const form = useForm<CreateCategoryFormData>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: "",
      description: "",
      color: "",
    },
  });

  const handleSubmit = (data: CreateCategoryFormData) => {
    onSubmit(data);
    form.reset({
      name: "",
      description: "",
      color: "",
    });
  };

  const handleClose = () => {
    form.reset({
      name: "",
      description: "",
      color: "",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Category</DialogTitle>
          <DialogDescription>Create a new category for organizing content</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
          <InputText
            hookForm={form}
            field="name"
            label="Category Name"
            placeholder="e.g., Flight Training"
            disabled={isLoading}
            labelMandatory
          />
          <InputTextarea
            hookForm={form}
            field="description"
            label="Description (Optional)"
            placeholder="Describe this category..."
            disabled={isLoading}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
