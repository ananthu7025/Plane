import { z } from "zod";
import { ValidationError } from "./errors.js";

// Common schemas
export const emailSchema = z.string().email("Invalid email format");
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[!@#$%^&*]/, "Password must contain at least one special character");

export const uuidSchema = z.string().uuid("Invalid UUID format");
export const otpSchema = z.string().regex(/^\d{6}$/, "OTP must be 6 digits");

// Auth schemas
export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(255),
});

export const signupRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  full_name: z.string().min(2).max(255),
});

export const signinSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const signinRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export const verifyEmailSchema = z.object({
  email: emailSchema,
  otp: otpSchema,
});

export const verifyEmailRequestSchema = z.object({
  email: emailSchema,
  otp: otpSchema,
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const resendOtpSchema = z.object({
  email: emailSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
  token: z.string().min(1, "Reset token is required"),
  newPassword: passwordSchema,
});

// Post schemas
export const createPostSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(255),
  content: z.string().min(10, "Content must be at least 10 characters"),
  categoryId: z.number().int().positive(),
  isAnonymous: z.boolean().optional().default(false),
});

export const updatePostSchema = z.object({
  title: z.string().min(5).max(255).optional(),
  content: z.string().min(10).optional(),
  categoryId: z.number().int().positive().optional(),
  isAnonymous: z.boolean().optional(),
});

// Comment schemas
export const createCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(5000),
  parentCommentId: uuidSchema.optional(),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1).max(5000),
});

// Profile schemas
export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(255).optional(),
  bio: z.string().max(500).optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

// User status schema (for admin)
export const updateUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).describe("Status must be ACTIVE, INACTIVE, or SUSPENDED"),
});

// Pagination and filtering schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
  role: z.enum(["STUDENT", "MENTOR", "ADMIN"]).optional(),
  sort: z.enum(["createdAt", "email", "fullName"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

// Permission schemas
export const createPermissionSchema = z.object({
  name: z.string().min(2, "Permission name must be at least 2 characters").max(100),
  description: z.string().optional(),
  module: z.string().min(1, "Module is required").max(50),
});

export const updatePermissionSchema = createPermissionSchema.partial();

// Role schemas (dynamic role support)
export const createRoleSchema = z.object({
  name: z
    .string()
    .min(2, "Role name must be at least 2 characters")
    .max(100)
    .regex(/^[a-zA-Z0-9_\- ]+$/, "Role name can only contain letters, numbers, underscores, hyphens, and spaces"),
  description: z.string().max(500).optional(),
});

export const updateRoleSchema = createRoleSchema.partial();

export const intIdParamSchema = z.coerce.number().int().positive("ID must be a positive integer");

// Role permission assignment
export const assignPermissionSchema = z.object({
  permissionId: z.number().int().positive("Permission ID must be a positive integer"),
});

// User role update schema (now supports any role name, not just enum values)
export const updateUserRoleSchema = z.object({
  role: z.string().min(2, "Role must be at least 2 characters").max(100),
});

// Generic validation function
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data) as T;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new ValidationError(firstError.message, {
        field: firstError.path.join("."),
        validation: firstError.code,
      });
    }
    throw error;
  }
}
