import { z } from 'zod';

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least 1 number')
  .regex(/[!@#$%^&*]/, 'Password must contain at least 1 special character (!@#$%^&*)');

export const signUpSchema = z.object({
  full_name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const emailVerificationSchema = z.object({
  otp: z.string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only numbers'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const resetPasswordSchema = z.object({
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type SignUpFormData = z.infer<typeof signUpSchema>;
export type SignInFormData = z.infer<typeof signInSchema>;
export type EmailVerificationFormData = z.infer<typeof emailVerificationSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// Community Schemas
export const createPostSchema = z.object({
  content: z.string()
    .min(10, 'Post content must be at least 10 characters')
    .max(5000, 'Post content must be less than 5000 characters'),
  categoryId: z.number()
    .int('Category must be a valid number')
    .positive('Please select a category'),
  isAnonymous: z.boolean().optional().default(false),
});

export const addReplySchema = z.object({
  content: z.string()
    .min(1, 'Reply cannot be empty')
    .max(5000, 'Reply must be less than 5000 characters'),
});

export const createCategorySchema = z.object({
  name: z.string()
    .min(2, 'Category name must be at least 2 characters')
    .max(100, 'Category name must be less than 100 characters'),
  description: z.string().optional(),
  color: z.string().optional(),
});

export const banUserSchema = z.object({
  reason: z.string()
    .min(5, 'Ban reason must be at least 5 characters')
    .max(500, 'Ban reason must be less than 500 characters'),
});

export const declinePostSchema = z.object({
  reason: z.string()
    .min(5, 'Decline reason must be at least 5 characters')
    .max(500, 'Decline reason must be less than 500 characters'),
});

export type CreatePostFormData = z.infer<typeof createPostSchema>;
export type AddReplyFormData = z.infer<typeof addReplySchema>;
export type CreateCategoryFormData = z.infer<typeof createCategorySchema>;
export type BanUserFormData = z.infer<typeof banUserSchema>;
export type DeclinePostFormData = z.infer<typeof declinePostSchema>;
