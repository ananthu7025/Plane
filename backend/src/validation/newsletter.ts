import { z } from 'zod';

export const newsletterSchemas = {
  createNewsletter: z.object({
    title: z.string().min(5, 'Title must be at least 5 characters').max(200),
    description: z.string().min(20, 'Description must be at least 20 characters').max(1000),
    category: z.string().min(2).max(50),
  }),

  getAdminList: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(20),
    search: z.string().optional(),
    category: z.string().optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
    sort: z.enum(['recent', 'oldest']).default('recent'),
  }),

  getPublicList: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(20),
    search: z.string().optional(),
    category: z.string().optional(),
    sort: z.enum(['recent', 'oldest']).default('recent'),
  }),

  updateNewsletter: z.object({
    title: z.string().min(5).max(200).optional(),
    description: z.string().min(20).max(1000).optional(),
    category: z.string().min(2).max(50).optional(),
  }).strict(),

  updateNewsletterStatus: z.object({
    status: z.enum(['draft', 'published', 'archived']),
  }),
};
