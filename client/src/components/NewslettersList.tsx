import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Loader2 } from "lucide-react";

export interface Newsletter {
  id: string;
  title: string;
  description?: string;
  category: string;
  publishedAt: string;
  thumbnailCloudinaryUrl?: string | null;
}

interface NewslettersListProps {
  newsletters: Newsletter[];
  loading: boolean;
  onViewPdf: (newsletter: Newsletter) => void;
  emptyMessage?: string;
}

export function NewslettersList({
  newsletters,
  loading,
  onViewPdf,
  emptyMessage = "No newsletters found. Check back soon!",
}: NewslettersListProps) {
  if (loading && newsletters.length === 0) {
    return (
      <div className="col-span-full flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (newsletters.length === 0) {
    return (
      <Card className="col-span-full">
        <CardContent className="py-12 text-center">
          <p className="text-slate-600">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {newsletters.map((newsletter) => (
        <Card
          key={newsletter.id}
          className="hover:shadow-lg transition-shadow flex flex-col overflow-hidden"
        >
          {newsletter.thumbnailCloudinaryUrl && (
            <div className="w-full h-48 overflow-hidden">
              <img
                src={newsletter.thumbnailCloudinaryUrl}
                alt={newsletter.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <CardHeader className="flex-1">
            <div className="space-y-2">
              <CardTitle className="text-lg line-clamp-2">
                {newsletter.title}
              </CardTitle>
              {newsletter.description && (
                <p className="text-sm text-slate-600 line-clamp-2">
                  {newsletter.description}
                </p>
              )}
              <div className="flex flex-col gap-1 text-xs text-slate-500">
                <p>{newsletter.category}</p>
                <p>{new Date(newsletter.publishedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <Button
              size="sm"
              className="w-full"
              onClick={() => onViewPdf(newsletter)}
            >
              <Eye className="w-4 h-4 mr-1" />
              View PDF
            </Button>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
