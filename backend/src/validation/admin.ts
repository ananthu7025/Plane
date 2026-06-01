import { z } from 'zod';

export const adminSchemas = {
  getUserFilters: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    search: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
    role: z.enum(['STUDENT', 'MENTOR', 'ADMIN']).optional(),
    sort: z.string().default('createdAt').optional(),
    order: z.enum(['asc', 'desc']).default('desc').optional(),
  }),

  updateUserStatus: z.object({
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
  }),

  updateUserProfile: z.object({
    fullName: z.string().min(2).max(100).optional(),
    bio: z.string().max(500).optional(),
    phone: z.string().regex(/^[0-9\-\+\(\)\s]*$/, 'Invalid phone number format').max(20).optional(),
    city: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
  }).strict(),
};
