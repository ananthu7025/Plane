import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import type { ReactNode } from "react";

interface SearchFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterLabel?: string;
  filterOptions?: { value: string; label: string }[];
  children?: ReactNode;
}

export function SearchFilterBar({
  searchValue,
  onSearchChange,
  onSearch,
  filterValue,
  onFilterChange,
  filterLabel = "Filter",
  filterOptions = [],
  children,
}: SearchFilterBarProps) {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex gap-4 flex-wrap">
          {/* Search Input */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSearch()}
                className="w-full pl-10 pr-4 h-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filter Select */}
          {filterOptions.length > 0 && onFilterChange && (
            <Select value={filterValue} onValueChange={onFilterChange}>
              <SelectTrigger className="w-32 h-10">
                <SelectValue placeholder={filterLabel} />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Search Button */}
          <Button onClick={onSearch} className="px-6 h-10">
            Search
          </Button>

          {/* Additional Controls */}
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
