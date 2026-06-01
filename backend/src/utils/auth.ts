import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import config from "../config/index.js";

const JWT_SECRET = config.JWT_SECRET;
const ACCESS_TOKEN_EXPIRY = config.JWT_ACCESS_EXPIRY;
const REFRESH_TOKEN_EXPIRY = config.JWT_REFRESH_EXPIRY;

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateAccessToken(userId: string): string {
  return jwt.sign(
    { userId, type: "ACCESS" },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY } as any
  );
}

/**
 * Generate access token with extended user info (role, permissions)
 */
export function generateAccessTokenWithRole(
  userId: string,
  roleId: number,
  roleName: string,
  permissions: string[] = []
): string {
  return jwt.sign(
    { userId, type: "ACCESS", roleId, roleName, permissions },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY } as any
  );
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { userId, type: "REFRESH" },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY } as any
  );
}

export function verifyToken(
  token: string
): { userId: string; type: string; roleId?: number; roleName?: string; permissions?: string[] } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      type: string;
      roleId?: number;
      roleName?: string;
      permissions?: string[];
    };
    return decoded;
  } catch {
    return null;
  }
}

export function generateVerificationToken(): string {
  return Math.random().toString().substring(2, 8); // 6-digit OTP
}

export async function hashVerificationToken(token: string): Promise<string> {
  return bcrypt.hash(token, 10);
}

export async function verifyOTP(providedOtp: string, storedHash: string): Promise<boolean> {
  return bcrypt.compare(providedOtp, storedHash);
}
