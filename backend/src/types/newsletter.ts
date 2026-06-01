/**
 * Newsletter Types
 */

export interface Newsletter {
  id: string;
  title: string;
  description: string | null;
  category: string;
  cloudinaryPublicId: string;
  cloudinaryUrl: string;
  thumbnailCloudinaryUrl?: string | null;
  fileSize: number;
  uploadedBy: string;
  status: "draft" | "published" | "archived";
  publishedAt: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreateNewsletterInput {
  title: string;
  description?: string;
  category: string;
  file: Express.Multer.File;
  thumbnailFile?: Express.Multer.File;
}

export interface UpdateNewsletterInput {
  title?: string;
  description?: string;
  category?: string;
}

export interface NewsletterFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  sort?: "recent" | "oldest";
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
