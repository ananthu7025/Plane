import { z } from 'zod';

export const letterSchemas = {
  submit: z.object({
    subject: z.string().min(5, 'Subject must be at least 5 characters').max(200),
    content: z.string().min(50, 'Content must be at least 50 characters').max(5000),
    isAnonymous: z.boolean().default(true),
    coverMediaId: z.string().uuid('Invalid media ID format').optional(),
  }),

  resubmit: z.object({
    subject: z.string().min(5, 'Subject must be at least 5 characters').max(200),
    content: z.string().min(50, 'Content must be at least 50 characters').max(5000),
    coverMediaId: z.string().uuid('Invalid media ID format').optional(),
  }),

  getFeed: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(20),
    search: z.string().optional(),
    sortBy: z.enum(['recent', 'popular', 'trending']).default('recent'),
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  }),

  getMyLetters: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(20),
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
    sortBy: z.enum(['recent', 'oldest']).default('recent'),
  }),

  rejectLetter: z.object({
    reason: z.string().min(10, 'Reason must be at least 10 characters').max(500), // Frontend: 10 chars required
  }),
};
