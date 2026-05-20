import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2, Send } from "lucide-react";
import {
  fetchMyLetters,
  clearError,
  clearSuccessMessage,
  setMyLettersStatus,
  setMyLettersPage,
  createNewLetter,
  resubmitLetter,
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
import { InputText } from "@/components/ui/input-text";
import { useForm } from "react-hook-form";

interface CreateLetterForm {
  subject: string;
  content: string;
  isAnonymous: boolean;
}

export default function StudentLetters() {
  const dispatch = useAppDispatch();
  const { myLetters, myLettersPage, myLettersTotal, myLettersStatus, loadingMyLetters, error, successMessage } = useAppSelector(
    (state) => state.letters
  );

  const form = useForm<CreateLetterForm>({
    defaultValues: {
      subject: "",
      content: "",
      isAnonymous: false,
    },
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { creatingLetter } = useAppSelector((state) => state.letters);

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

  // Load letters on mount and when filters change
  useEffect(() => {
    dispatch(
      fetchMyLetters({
        page: myLettersPage,
        status: myLettersStatus === "all" ? undefined : myLettersStatus,
      }) as any
    );
  }, [dispatch, myLettersPage, myLettersStatus]);

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
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">My Letters</h1>
            <p className="text-slate-600">Manage your submitted letters</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Letter
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Letter</DialogTitle>
                <DialogDescription>
                  Share your thoughts and experiences with the community
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={form.handleSubmit((data) => {
                dispatch(
                  createNewLetter({
                    subject: data.subject,
                    content: data.content,
                    isAnonymous: data.isAnonymous,
                  }) as any
                );
              })} className="space-y-4">
                <InputText
                  label="Subject"
                  hookForm={form}
                  field="subject"
                  placeholder="Enter letter subject"
                />

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Content
                  </label>
                  <Textarea
                    placeholder="Write your letter content here..."
                    className="min-h-40"
                    {...form.register("content", {
                      required: "Content is required",
                      minLength: { value: 20, message: "Content must be at least 20 characters" },
                      maxLength: { value: 10000, message: "Content cannot exceed 10000 characters" },
                    })}
                  />
                  {form.formState.errors.content && (
                    <p className="text-red-600 text-sm mt-1">
                      {form.formState.errors.content.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
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

        {/* Status Filter */}
        <Card className="mb-8">
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
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(letter.status)}`}>
                          {getStatusLabel(letter.status)}
                        </span>
                        <span className="text-sm text-slate-600">
                          {new Date(letter.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {letter.status === "REJECTED" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Could open a resubmit dialog here
                            toast.info("Resubmit feature coming soon");
                          }}
                        >
                          Resubmit
                        </Button>
                      )}
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
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-slate-700 line-clamp-2">{letter.content}</p>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span>👁️ {letter.viewCount} views</span>
                    <span>❤️ {letter.acknowledgementCount} likes</span>
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
            <span className="py-2 px-4 text-sm text-slate-600">
              Page {myLettersPage}
            </span>
            <Button
              variant="outline"
              onClick={() => dispatch(setMyLettersPage(myLettersPage + 1))}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
