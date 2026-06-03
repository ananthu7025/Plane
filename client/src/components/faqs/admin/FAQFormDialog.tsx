/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save } from "lucide-react";
import { FAQ_CATEGORIES } from "@/types/faqs";
import type { FAQ } from "@/types/faqs";

interface FAQFormDialogProps {
  isOpen: boolean;
  editingFaq: FAQ | null;
  onClose: () => void;
}

interface FormState {
  question: string;
  answer: string;
  category: string;
  isActive: boolean;
}

const DEFAULT_FORM: FormState = {
  question: "",
  answer: "",
  category: "General",
  isActive: true,
};

export function FAQFormDialog({
  isOpen,
  editingFaq,
  onClose,
}: FAQFormDialogProps) {
  const dispatch = useAppDispatch();
  const { creating, updating } = useAppSelector((state) => state.faqs);

  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

  useEffect(() => {
    if (editingFaq) {
      setForm({
        question: editingFaq.question,
        answer:   editingFaq.answer,
        category: editingFaq.category,
        isActive: editingFaq.isActive,
      });
    } else {
      setForm(DEFAULT_FORM);
    }
  }, [editingFaq]);

  const isSubmitting = creating || updating;

  const questionLen = form.question.trim().length;
  const answerLen   = form.answer.trim().length;
  const isValid =
    questionLen >= 5 && questionLen <= 500 &&
    answerLen  >= 10 && answerLen  <= 2000;

  const handleSubmit = async () => {
    if (!isValid) return;
    if (editingFaq) {
      await dispatch(updateFAQ(editingFaq.id, form) as any);
    } else {
      await dispatch(createFAQ(form) as any);
    }
    handleClose();
  };

  const handleClose = () => {
    setForm(DEFAULT_FORM);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingFaq ? "Edit FAQ" : "Add New FAQ"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="faq-question">Question</Label>
              <span className={`text-xs ${questionLen > 500 ? "text-destructive" : "text-muted-foreground"}`}>
                {questionLen}/500
              </span>
            </div>
            <Input
              id="faq-question"
              value={form.question}
              onChange={(e) => setForm({ ...form, question: e.target.value })}
              placeholder="Enter the question..."
              maxLength={500}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="faq-answer">Answer</Label>
              <span className={`text-xs ${answerLen > 2000 ? "text-destructive" : "text-muted-foreground"}`}>
                {answerLen}/2000
              </span>
            </div>
            <Textarea
              id="faq-answer"
              value={form.answer}
              onChange={(e) => setForm({ ...form, answer: e.target.value })}
              placeholder="Enter the answer..."
              rows={4}
              maxLength={2000}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="faq-category">Category</Label>
            <select
              id="faq-category"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {FAQ_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="faq-active">Active</Label>
            <Switch
              id="faq-active"
              checked={form.isActive}
              onCheckedChange={(checked) =>
                setForm({ ...form, isActive: checked })
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !isValid}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting
              ? "Saving..."
              : editingFaq
              ? "Save Changes"
              : "Add FAQ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
