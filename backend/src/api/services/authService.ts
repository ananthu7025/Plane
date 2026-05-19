import { db } from "../../db/index.js";
import { users, userProfiles, authTokens, roles } from "../../db/schema.js";
import { eq, and, isNull, desc } from "drizzle-orm";
import { hashPassword, comparePassword, generateAccessToken, generateRefreshToken, generateVerificationToken, hashVerificationToken, verifyOTP, verifyToken } from "../../utils/auth.js";
import { ConflictError, NotFoundError, UnauthorizedError } from "../../utils/errors.js";
import { sendOTPEmail, sendPasswordResetEmail, sendPasswordConfirmationEmail } from "../../utils/emailService.js";

export async function signup(email: string, password: string, fullName: string) {
  // Check if email already exists
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
  });

  if (existingUser) {
    throw new ConflictError("Email already registered", "EMAIL_EXISTS", { email });
  }

  // Get STUDENT role
  const studentRole = await db.query.roles.findFirst({
    where: eq(roles.name, "STUDENT"),
  });

  if (!studentRole) {
    throw new Error("STUDENT role not found in database");
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const [newUser] = await db
    .insert(users)
    .values({
      email: email.toLowerCase(),
      passwordHash,
      roleId: studentRole.id,
      status: "ACTIVE",
    })
    .returning();

  // Create user profile
  await db.insert(userProfiles).values({
    userId: newUser.id,
    fullName,
    reputationScore: 0,
    verified: false,
  });

  // Generate verification token (OTP)
  const otp = generateVerificationToken();
  const otpHash = await hashVerificationToken(otp);

  // Calculate expiry (15 minutes from now)
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  // Store token hash
  await db.insert(authTokens).values({
    userId: newUser.id,
    tokenType: "ACCESS", // Using ACCESS for verification token storage (can use a separate token type in production)
    tokenHash: otpHash,
    expiresAt,
  });

  // Send OTP email asynchronously (non-blocking)
  sendOTPEmail(newUser.email, fullName, otp).catch((error) => {
    console.error(`⚠️ Failed to queue OTP email for ${newUser.email}:`, error);
    // Don't throw error - signup succeeds even if email fails
    // In production, you might want to mark this for retry
  });

  return {
    userId: newUser.id,
    email: newUser.email,
    fullName,
    verificationRequired: true,
    message: "Account created successfully. Check your email for the verification code.",
  };
}

export async function signin(email: string, password: string) {
  // Find user by email
  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
    with: {
      role: true,
      profile: true,
    },
  });

  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  // Check password
  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  // Check user status
  if (user.status === "SUSPENDED") {
    throw new UnauthorizedError("Your account has been suspended");
  }

  if (user.status === "INACTIVE") {
    throw new UnauthorizedError("Your account is inactive");
  }

  // Check if email is verified
  if (!user.profile?.verified) {
    throw new UnauthorizedError("Please verify your email before signing in");
  }

  // Generate tokens
  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  // Hash tokens for storage
  const accessTokenHash = await hashVerificationToken(accessToken);
  const refreshTokenHash = await hashVerificationToken(refreshToken);

  // Store tokens
  // NOTE: Access token set to 1 minute for testing refresh mechanism. Change back to 15 * 60 * 1000 for production.
  const accessTokenExpiry = new Date(Date.now() + 1 * 60 * 1000); // 1 minute for testing
  const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.insert(authTokens).values([
    {
      userId: user.id,
      tokenType: "ACCESS",
      tokenHash: accessTokenHash,
      expiresAt: accessTokenExpiry,
    },
    {
      userId: user.id,
      tokenType: "REFRESH",
      tokenHash: refreshTokenHash,
      expiresAt: refreshTokenExpiry,
    },
  ]);

  // Update last login
  await db
    .update(users)
    .set({
      lastLogin: new Date(),
    })
    .where(eq(users.id, user.id));

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.profile?.fullName,
      role: user.role.name,
    },
  };
}

export async function verifyEmail(email: string, otp: string) {
  // Find user
  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
    with: {
      profile: true,
    },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Check if already verified
  if (user.profile?.verified) {
    throw new ConflictError("Email already verified", "EMAIL_ALREADY_VERIFIED");
  }

  // Find valid OTP token (exclude revoked tokens)
  const now = new Date();
  const otpToken = await db.query.authTokens.findFirst({
    where: and(
      eq(authTokens.userId, user.id),
      eq(authTokens.tokenType, "ACCESS"),
      isNull(authTokens.revokedAt)  // Only get non-revoked tokens
    ),
  });

  if (!otpToken) {
    throw new UnauthorizedError("The OTP has expired. Please request a new one.", "OTP_EXPIRED");
  }

  if (otpToken.expiresAt < now) {
    throw new UnauthorizedError("The OTP has expired. Please request a new one.", "OTP_EXPIRED");
  }

  // Verify OTP
  const isOtpValid = await verifyOTP(otp, otpToken.tokenHash);
  if (!isOtpValid) {
    throw new UnauthorizedError("Incorrect code. Please try again.", "OTP_INVALID");
  }

  // Mark email as verified
  await db
    .update(userProfiles)
    .set({
      verified: true,
      updatedAt: new Date(),
    })
    .where(eq(userProfiles.userId, user.id));

  // Mark OTP token as used (soft delete)
  await db
    .update(authTokens)
    .set({
      revokedAt: new Date(),
    })
    .where(eq(authTokens.id, otpToken.id));

  return {
    message: "Email verified successfully",
    userId: user.id,
    email: user.email,
  };
}

export async function refreshAccessToken(refreshToken: string) {
  try {
    // Verify JWT signature and extract payload
    const decoded = verifyToken(refreshToken) as { userId: string; type: string } | null;

    if (!decoded || decoded.type !== "REFRESH") {
      throw new UnauthorizedError("Invalid refresh token");
    }

    // Find refresh token in database (must NOT be revoked and must NOT be expired)
    const now = new Date();
    const storedToken = await db.query.authTokens.findFirst({
      where: and(
        eq(authTokens.userId, decoded.userId),
        eq(authTokens.tokenType, "REFRESH"),
        isNull(authTokens.revokedAt)  // Only active tokens
      ),
    });

    if (!storedToken) {
      throw new UnauthorizedError("Refresh token not found");
    }

    // Check if token is expired
    if (storedToken.expiresAt < now) {
      throw new UnauthorizedError("Refresh token has expired");
    }

    // Check if token is revoked
    if (storedToken.revokedAt !== null) {
      throw new UnauthorizedError("Refresh token has been revoked");
    }

    // Verify token hash matches
    const isTokenValid = await verifyOTP(refreshToken, storedToken.tokenHash);
    if (!isTokenValid) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    // Fetch user
    const user = await db.query.users.findFirst({
      where: eq(users.id, decoded.userId),
      with: {
        role: true,
        profile: true,
      },
    });

    if (!user || user.status !== "ACTIVE") {
      throw new UnauthorizedError("User not found or inactive");
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);

    // Hash new tokens
    const accessTokenHash = await hashVerificationToken(newAccessToken);
    const refreshTokenHash = await hashVerificationToken(newRefreshToken);

    // Calculate expiry times
    // NOTE: Access token set to 1 minute for testing refresh mechanism. Change back to 15 * 60 * 1000 for production.
    const accessTokenExpiry = new Date(Date.now() + 1 * 60 * 1000); // 1 minute for testing
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Revoke old refresh token (token rotation for security)
    await db
      .update(authTokens)
      .set({ revokedAt: new Date() })
      .where(eq(authTokens.id, storedToken.id));

    // Store new tokens
    await db.insert(authTokens).values([
      {
        userId: user.id,
        tokenType: "ACCESS",
        tokenHash: accessTokenHash,
        expiresAt: accessTokenExpiry,
      },
      {
        userId: user.id,
        tokenType: "REFRESH",
        tokenHash: refreshTokenHash,
        expiresAt: refreshTokenExpiry,
      },
    ]);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.profile?.fullName,
        role: user.role.name,
      },
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    throw new UnauthorizedError("Failed to refresh token");
  }
}

export async function signout(userId: string, refreshToken: string) {
  try {
    // Verify refresh token format
    const decoded = verifyToken(refreshToken) as { userId: string; type: string } | null;

    if (!decoded || decoded.userId !== userId) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    // Find and revoke refresh token
    const storedToken = await db.query.authTokens.findFirst({
      where: and(
        eq(authTokens.userId, userId),
        eq(authTokens.tokenType, "REFRESH")
      ),
    });

    if (storedToken) {
      // Mark token as revoked instead of deleting (for audit trail)
      await db
        .update(authTokens)
        .set({
          revokedAt: new Date(),
        })
        .where(eq(authTokens.id, storedToken.id));
    }

    // Optional: Revoke all active tokens for this user (for security)
    // This prevents token reuse across devices
    // Uncomment below if needed:
    /*
    await db
      .update(authTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(authTokens.userId, userId),
          (t) => `${t.revokedAt} IS NULL` as any
        )
      );
    */

    return {
      message: "Signed out successfully",
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    throw new UnauthorizedError("Failed to signout");
  }
}

export async function resendOTP(email: string) {
  // Find user
  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
    with: {
      profile: true,
    },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Check if already verified
  if (user.profile?.verified) {
    throw new ConflictError("Email already verified", "EMAIL_ALREADY_VERIFIED");
  }

  // Revoke old OTP token
  const oldToken = await db.query.authTokens.findFirst({
    where: and(
      eq(authTokens.userId, user.id),
      eq(authTokens.tokenType, "ACCESS")
    ),
  });

  if (oldToken) {
    await db
      .update(authTokens)
      .set({ revokedAt: new Date() })
      .where(eq(authTokens.id, oldToken.id));
  }

  // Generate new OTP
  const otp = generateVerificationToken();
  const otpHash = await hashVerificationToken(otp);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  // Store new OTP
  await db.insert(authTokens).values({
    userId: user.id,
    tokenType: "ACCESS",
    tokenHash: otpHash,
    expiresAt,
  });

  // Send OTP email
  sendOTPEmail(user.email, user.profile?.fullName || "User", otp).catch((error) => {
    console.error(`⚠️ Failed to queue OTP email for ${user.email}:`, error);
  });

  return {
    message: "Verification code sent to your email",
    email: user.email,
  };
}

export async function initiatePasswordReset(email: string) {
  // Find user (case-insensitive, but don't reveal if user exists)
  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
    with: {
      profile: true,
    },
  });

  // Always return success for security (don't leak if email exists)
  if (!user || user.status !== "ACTIVE") {
    return {
      message: "If an account exists with this email, a password reset link has been sent",
    };
  }

  // Generate reset token (UUID)
  const resetToken = generateVerificationToken(); // Using same token generator for simplicity
  const resetTokenHash = await hashVerificationToken(resetToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Store reset token
  await db.insert(authTokens).values({
    userId: user.id,
    tokenType: "PASSWORD_RESET",
    tokenHash: resetTokenHash,
    expiresAt,
  });

  // Send reset email
  sendPasswordResetEmail(user.email, user.profile?.fullName || "User", resetToken).catch(
    (error) => {
      console.error(`⚠️ Failed to queue password reset email for ${user.email}:`, error);
    }
  );

  return {
    message: "If an account exists with this email, a password reset link has been sent",
  };
}

export async function resetPassword(email: string, resetToken: string, newPassword: string) {
  // Find user
  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
    with: {
      profile: true,
    },
  });

  if (!user) {
    throw new NotFoundError("Invalid reset request");
  }

  // Find reset token (get the most recent one in case of multiple requests)
  const now = new Date();
  const storedToken = await db.query.authTokens.findFirst({
    where: and(
      eq(authTokens.userId, user.id),
      eq(authTokens.tokenType, "PASSWORD_RESET")
    ),
    orderBy: (table) => desc(table.issuedAt),
  });

  if (!storedToken) {
    throw new UnauthorizedError("Reset token is invalid or expired");
  }

  // Check expiry
  if (storedToken.expiresAt < now) {
    throw new UnauthorizedError("The reset link has expired. Please request a new one.", "RESET_TOKEN_EXPIRED");
  }

  // Check if already revoked
  if (storedToken.revokedAt !== null) {
    throw new UnauthorizedError("This reset link has already been used. Please request a new one.", "RESET_TOKEN_USED");
  }

  // Verify token hash
  const isTokenValid = await verifyOTP(resetToken, storedToken.tokenHash);
  if (!isTokenValid) {
    throw new UnauthorizedError("Invalid reset link. Please request a new one.", "RESET_TOKEN_INVALID");
  }

  // Hash new password
  const newPasswordHash = await hashPassword(newPassword);

  // Update user password
  await db
    .update(users)
    .set({
      passwordHash: newPasswordHash,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  // Revoke reset token
  await db
    .update(authTokens)
    .set({ revokedAt: new Date() })
    .where(eq(authTokens.id, storedToken.id));

  // Revoke all PASSWORD_RESET tokens for this user (security)
  await db
    .update(authTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(authTokens.userId, user.id), eq(authTokens.tokenType, "PASSWORD_RESET")));

  // Revoke all REFRESH tokens (force re-login)
  await db
    .update(authTokens)
    .set({ revokedAt: new Date() })
    .where(
      and(eq(authTokens.userId, user.id), eq(authTokens.tokenType, "REFRESH"))
    );

  // Send confirmation email
  sendPasswordConfirmationEmail(user.email, user.profile?.fullName || "User").catch((error) => {
    console.error(`⚠️ Failed to queue password confirmation email for ${user.email}:`, error);
  });

  return {
    message: "Password reset successfully. Please sign in with your new password",
  };
}
