import { useNavigate } from "react-router-dom";
import type { Blog } from "@/store/slices/blogSlice";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Plane } from "lucide-react";

interface StudentBlogCardProps {
  blog: Blog;
}

export function StudentBlogCard({ blog }: StudentBlogCardProps) {
  const navigate = useNavigate();

  const calculateReadTime = (content: string) => {
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / 200);
  };

  return (
    <Card
      variant="elevated"
      className="overflow-hidden cursor-pointer group"
      onClick={() => navigate(`/student/blogs/${blog.id}`)}
    >
      <div className="aspect-video overflow-hidden">
        <img
          src={
            blog.coverImageUrl ||
            "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=200&fit=crop"
          }
          alt={blog.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <CardContent className="p-5">
        <Badge variant="muted" className="mb-2">
          {blog.category}
        </Badge>
        <h3 className="font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {blog.title}
        </h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {blog.excerpt}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Admin</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Plane className="w-3 h-3" />
              {blog.acknowledgementCount}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {calculateReadTime(blog.content)} min read
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
