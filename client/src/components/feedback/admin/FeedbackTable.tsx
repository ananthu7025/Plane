import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Star, CheckCircle2, Clock, Eye } from "lucide-react";
import type { Feedback } from "@/types/feedback";
import { getFeedbackCategoryMeta } from "@/types/feedback";

interface FeedbackTableProps {
  feedback: Feedback[];
  onView: (feedback: Feedback) => void;
}

export function FeedbackTable({ feedback, onView }: FeedbackTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Student</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Subject</TableHead>
          <TableHead>Rating</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-[50px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {feedback.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">
              {item.studentName ?? "Student"}
            </TableCell>
            <TableCell>
              <Badge variant="outline">
                {getFeedbackCategoryMeta(item.category).label}
              </Badge>
            </TableCell>
            <TableCell className="max-w-[200px] truncate">
              {item.subject ?? "—"}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= item.rating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
            </TableCell>
            <TableCell>
              {new Date(item.createdAt).toLocaleDateString()}
            </TableCell>
            <TableCell>
              {item.status === "reviewed" ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle2 className="w-3 h-3 mr-1" />Reviewed
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <Clock className="w-3 h-3 mr-1" />Pending
                </Badge>
              )}
            </TableCell>
            <TableCell>
              <Button variant="ghost" size="icon" onClick={() => onView(item)}>
                <Eye className="w-4 h-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
        {feedback.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
              No feedback found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
