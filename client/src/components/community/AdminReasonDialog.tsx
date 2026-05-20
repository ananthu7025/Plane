import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { InputTextarea } from "@/components/ui/input-textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// Validation schema
const reasonSchema = z.object({
  reason: z.string()
    .min(5, "Reason must be at least 5 characters")
    .max(500, "Reason must be less than 500 characters"),
});

type ReasonFormData = z.infer<typeof reasonSchema>;

interface AdminReasonDialogProps {
  isOpen: boolean;
  title: string;
  label?: string;
  placeholder?: string;
  confirmText?: string;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  isLoading?: boolean;
}

export function AdminReasonDialog({
  isOpen,
  title,
  label = "Reason",
  placeholder = "Explain your action...",
  confirmText = "Submit",
  onClose,
  onSubmit,
  isLoading = false,
}: AdminReasonDialogProps) {
  const form = useForm<ReasonFormData>({
    resolver: zodResolver(reasonSchema),
    defaultValues: {
      reason: "",
    },
  });

  const handleSubmit = (data: ReasonFormData) => {
    onSubmit(data.reason);
    form.reset();
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Please provide a reason for this action</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
          <InputTextarea
            hookForm={form}
            field="reason"
            label={label}
            placeholder={placeholder}
            disabled={isLoading}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Submitting..." : confirmText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
