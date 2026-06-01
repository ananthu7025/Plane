import { z } from 'zod';

export const rolesSchemas = {
  createRole: z.object({
    name: z.string().min(2, 'Role name must be at least 2 characters').max(100),
    description: z.string().max(500).optional(),
  }),

  updateRole: z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional(),
  }).strict(),

  createPermission: z.object({
    name: z.string().min(2, 'Permission name must be at least 2 characters').max(100),
    description: z.string().max(500).optional(),
    module: z.string().min(2).max(100),
  }),

  updatePermission: z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional(),
    module: z.string().min(2).max(100).optional(),
  }).strict(),

  assignPermission: z.object({
    permissionId: z.coerce.number().int().positive('Permission ID must be a positive number'),
  }),

  updateUserRole: z.object({
    role: z.enum(['STUDENT', 'MENTOR', 'ADMIN']),
  }),

  intIdParam: z.string().refine((val) => !isNaN(parseInt(val)), 'ID must be a valid integer'),

  pagination: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    search: z.string().optional(),
    module: z.string().optional(),
  }),
};
