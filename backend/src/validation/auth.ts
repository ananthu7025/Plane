import { z } from 'zod';

export const authSchemas = {
  signup: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain uppercase letter')
      .regex(/[0-9]/, 'Password must contain number'),
    fullName: z.string().min(2).max(100),
  }),

  signin: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),

  verifyEmail: z.object({
    email: z.string().email(),
    otp: z.string().length(6, 'OTP must be 6 digits'),
  }),

  refreshToken: z.object({
    refreshToken: z.string().min(1, 'Refresh token required'),
  }),

  resetPassword: z.object({
    email: z.string().email(),
    token: z.string().min(1, 'Reset token required'),
    newPassword: z.string().min(8),
  }),

  forgotPassword: z.object({
    email: z.string().email('Invalid email format'),
  }),

  resendOTP: z.object({
    email: z.string().email('Invalid email format'),
  }),

  changePassword: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain an uppercase letter')
      .regex(/[0-9]/, 'Password must contain a number'),
  }).refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  }),
};
