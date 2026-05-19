import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface StatusBadgeDropdownProps {
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  onStatusChange: (newStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED") => void;
}

const statusColors = {
  ACTIVE: "bg-green-100 text-green-800",
  INACTIVE: "bg-gray-100 text-gray-800",
  SUSPENDED: "bg-red-100 text-red-800",
};

export function StatusBadgeDropdown({
  status,
  onStatusChange,
}: StatusBadgeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleStatusClick = (
    newStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED",
  ) => {
    onStatusChange(newStatus);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium gap-2 ${statusColors[status]}`}
      >
        {status}
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          {(["ACTIVE", "INACTIVE", "SUSPENDED"] as const).map((s) => (
            <button
              key={s}
              onClick={() => handleStatusClick(s)}
              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
