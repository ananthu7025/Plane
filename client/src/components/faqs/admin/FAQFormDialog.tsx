/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { createFAQ, updateFAQ } from "@/store/slices/faqSlice";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save } from "lucide-react";
import { FAQ_CATEGORIES } from "@/types/faqs";
import type { FAQ } from "@/types/faqs";

const faqFormSchema = z.object({
  question: z.string().min(5, "Question must be at least 5 characters").max(500, "Question must not exceed 500 characters"),
  answer:   z.string().min(10, "Answer must be at least 10 characters").max(2000, "Answer must not exceed 2000 characters"),
  category: z.string().min(1, "Please select a category"),
  isActive: z.boolean(),
});

type FAQFormData = z.infer<typeof faqFormSchema>;

interface FAQFormDialogProps {
  isOpen: boolean;
  editingFaq: FAQ | null;
  onClose: () => void;
}

export function FAQFormDialog({ isOpen, editingFaq, onClose }: FAQFormDialogProps) {
  const dispatch = useAppDispatch();
  const { creating, updating } = useAppSelector((state) => state.faqs);

  const form = useForm<FAQFormData>({
    resolver: zodResolver(faqFormSchema),
    defaultValues: { question: "", answer: "", category: "General", isActive: true },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(
        editingFaq
          ? { question: editingFaq.question, answer: editingFaq.answer, category: editingFaq.category, isActive: editingFaq.isActive }
          : { question: "", answer: "", category: "General", isActive: true }
      );
    }
  }, [editingFaq, isOpen, form]);

  const isSubmitting = creating || updating;
  const questionLen = form.watch("question")?.length ?? 0;
  const answerLen   = form.watch("answer")?.length ?? 0;

  const onSubmit = async (data: FAQFormData) => {
    if (editingFaq) {
      await dispatch(updateFAQ(editingFaq.id, data) as any);
    } else {
      await dispatch(createFAQ(data) as any);
    }
    handleClose();
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingFaq ? "Edit FAQ" : "Add New FAQ"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          {/* Question */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">
                Question <span className="text-red-500">*</span>
              </label>
              <span className={`text-xs ${questionLen > 500 ? "text-red-500" : "text-muted-foreground"}`}>
                {questionLen}/500
              </span>
            </div>
            <Input
              placeholder="Enter the question..."
              {...form.register("question")}
              maxLength={500}
              className={form.formState.errors.question ? "border-red-500" : ""}
            />
            {form.formState.errors.question && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.question.message}</p>
            )}
          </div>

          {/* Answer */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">
                Answer <span className="text-red-500">*</span>
              </label>
              <span className={`text-xs ${answerLen > 2000 ? "text-red-500" : "text-muted-foreground"}`}>
                {answerLen}/2000
              </span>
            </div>
            <Textarea
              placeholder="Enter the answer..."
              {...form.register("answer")}
              rows={4}
              maxLength={2000}
              className={form.formState.errors.answer ? "border-red-500" : ""}
            />
            {form.formState.errors.answer && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.answer.message}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-medium block mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <Select
              value={form.watch("category")}
              onValueChange={(value) => form.setValue("category", value, { shouldValidate: true })}
            >
              <SelectTrigger className={form.formState.errors.category ? "border-red-500" : ""}>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {FAQ_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.category && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.category.message}</p>
            )}
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Active</label>
            <Switch
              checked={form.watch("isActive")}
              onCheckedChange={(checked) => form.setValue("isActive", checked)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? "Saving..." : editingFaq ? "Save Changes" : "Add FAQ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
