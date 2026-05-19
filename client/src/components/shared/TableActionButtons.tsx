import { Eye, Edit2, Trash2 } from "lucide-react";

interface TableActionButtonsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  viewTitle?: string;
  editTitle?: string;
  deleteTitle?: string;
}

export function TableActionButtons({
  onView,
  onEdit,
  onDelete,
  viewTitle = "View",
  editTitle = "Edit",
  deleteTitle = "Delete",
}: TableActionButtonsProps) {
  return (
    <div className="flex items-center gap-2">
      {onView && (
        <button
          onClick={onView}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title={viewTitle}
        >
          <Eye className="w-4 h-4 text-gray-600" />
        </button>
      )}

      {onEdit && (
        <button
          onClick={onEdit}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title={editTitle}
        >
          <Edit2 className="w-4 h-4 text-gray-600" />
        </button>
      )}

      {onDelete && (
        <button
          onClick={onDelete}
          className="p-2 hover:bg-red-100 rounded-lg transition-colors"
          title={deleteTitle}
        >
          <Trash2 className="w-4 h-4 text-red-600" />
        </button>
      )}
    </div>
  );
}
