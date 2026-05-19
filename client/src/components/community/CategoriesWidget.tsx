import { FolderOpen } from "lucide-react";
import type { Category } from "@/store/slices/communitySlice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CategoriesWidgetProps {
  categories: Category[];
}

export function CategoriesWidget({ categories }: CategoriesWidgetProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4" />
          <CardTitle className="text-base">Categories</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No categories available
          </p>
        ) : (
          categories.map((cat) => (
            <div
              key={cat.id}
              className="p-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <p className="text-sm font-medium text-foreground mb-1">
                {cat.name}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {cat.description || "Category discussions"}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
