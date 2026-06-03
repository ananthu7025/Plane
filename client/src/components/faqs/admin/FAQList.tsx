/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  toggleFAQ,
  deleteFAQ,
  reorderFAQs,
  clearError,
  clearSuccessMessage,
} from "@/store/slices/faqSlice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  HelpCircle,
  Plus,
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { FAQFormDialog } from "./FAQFormDialog";
import type { FAQ } from "@/types/faqs";

export function FAQList() {
  const dispatch = useAppDispatch();
  const { faqs, stats, loading, error, successMessage } = useAppSelector(
    (state) => state.faqs
  );

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);

  const sortedFaqs = [...faqs].sort((a, b) => a.order - b.order);

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

  const handleMoveUp = (faq: FAQ) => {
    const idx = sortedFaqs.findIndex((f) => f.id === faq.id);
    if (idx <= 0) return;
    const prev = sortedFaqs[idx - 1];
    dispatch(
      reorderFAQs([
        { id: faq.id, order: prev.order },
        { id: prev.id, order: faq.order },
      ]) as any
    );
  };

  const handleMoveDown = (faq: FAQ) => {
    const idx = sortedFaqs.findIndex((f) => f.id === faq.id);
    if (idx >= sortedFaqs.length - 1) return;
    const next = sortedFaqs[idx + 1];
    dispatch(
      reorderFAQs([
        { id: faq.id, order: next.order },
        { id: next.id, order: faq.order },
      ]) as any
    );
  };

  const handleToggle = (id: number) => {
    dispatch(toggleFAQ(id) as any);
  };

  const handleDelete = (id: number) => {
    dispatch(deleteFAQ(id) as any);
  };

  const handleEdit = (faq: FAQ) => {
    setEditingFaq(faq);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingFaq(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">FAQs Management</h1>
          <p className="text-gray-600 mt-1">
            Create, edit, reorder, and manage frequently asked questions
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2" size="lg">
          <Plus className="w-4 h-4" />
          Add FAQ
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="Total FAQs"
            value={stats.total}
            icon={<HelpCircle className="w-5 h-5 text-primary" />}
            variant="primary"
          />
          <StatCard
            label="Active FAQs"
            value={stats.active}
            icon={<Eye className="w-5 h-5 text-green-600" />}
            variant="success"
          />
          <StatCard
            label="Inactive FAQs"
            value={stats.inactive}
            icon={<EyeOff className="w-5 h-5 text-gray-500" />}
          />
        </div>
      )}

      {/* FAQ List */}
      <Card>
        <CardHeader>
          <CardTitle>FAQ List</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : sortedFaqs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No FAQs found. Add your first FAQ!
            </div>
          ) : (
            sortedFaqs.map((faq, idx) => (
              <div
                key={faq.id}
                className={`p-4 rounded-lg border transition-all ${
                  faq.isActive
                    ? "border-border bg-card"
                    : "border-border/50 bg-muted/30 opacity-60"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Reorder controls */}
                  <div className="flex flex-col items-center gap-1 pt-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-6 h-6"
                      onClick={() => handleMoveUp(faq)}
                      disabled={idx === 0}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground font-medium">
                      {faq.order}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-6 h-6"
                      onClick={() => handleMoveDown(faq)}
                      disabled={idx === sortedFaqs.length - 1}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-medium text-gray-900">
                        {faq.question}
                      </h4>
                      <Badge variant="outline">{faq.category}</Badge>
                      <Badge
                        className={
                          faq.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }
                      >
                        {faq.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {faq.answer}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Switch
                      checked={faq.isActive}
                      onCheckedChange={() => handleToggle(faq.id)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(faq)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete FAQ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(faq.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <FAQFormDialog
        isOpen={isFormOpen}
        editingFaq={editingFaq}
        onClose={handleCloseForm}
      />
    </div>
  );
}
