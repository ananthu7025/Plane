// Standard API Response Envelope
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
    details: Record<string, unknown>;
  } | null;
  timestamp: string;
}

// User Type
export type ApiUser = {
  id: string;
  email: string;
  fullName: string;
  role: "STUDENT" | "ADMIN" | "MENTOR";
};

// Auth Endpoint Response Data Types
export type SignUpData = {
  userId: string;
  email: string;
  fullName: string;
  verificationRequired: boolean;
  message: string;
};

export type SignInData = {
  user: ApiUser;
  accessToken: string;
  refreshToken: string;
};

export type VerifyEmailData = {
  message: string;
  userId: string;
  email: string;
};

export type RefreshData = {
  user: ApiUser;
  accessToken: string;
  refreshToken: string;
};

export type ResendOtpData = {
  message: string;
};

export type ForgotPasswordData = {
  message: string;
};

export type ResetPasswordData = {
  message: string;
};

export type SignOutData = {
  message: string;
};

// Request Types
export type SignUpRequest = {
  email: string;
  password: string;
  fullName: string;
};

export type SignInRequest = {
  email: string;
  password: string;
};

export type VerifyEmailRequest = {
  email: string;
  otp: string;
};

export type ResendOtpRequest = {
  email: string;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type ResetPasswordRequest = {
  email: string;
  token: string;
  newPassword: string;
};

export type RefreshRequest = {
  refreshToken: string;
};

export type SignOutRequest = {
  refreshToken: string;
};
