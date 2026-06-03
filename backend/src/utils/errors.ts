export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(400, "VALIDATION_ERROR", message, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code: string = "CONFLICT", details?: Record<string, any>) {
    super(409, code, message, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(404, "NOT_FOUND", message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized", code: string = "UNAUTHORIZED") {
    super(401, code, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden", code: string = "FORBIDDEN", details?: Record<string, any>) {
    super(403, code, message, details);
  }
}

// Auth Module Errors
export class InvalidCredentialsError extends AppError {
  constructor(message: string = "Invalid email or password") {
    super(401, "INVALID_CREDENTIALS", message);
  }
}

export class UserAlreadyExistsError extends AppError {
  constructor(email: string) {
    super(409, "USER_ALREADY_EXISTS", `User with email ${email} already exists`);
  }
}

export class InvalidOTPError extends AppError {
  constructor(message: string = "Invalid or expired OTP") {
    super(400, "INVALID_OTP", message);
  }
}

export class TokenExpiredError extends AppError {
  constructor(message: string = "Token has expired") {
    super(401, "TOKEN_EXPIRED", message);
  }
}

export class InvalidTokenError extends AppError {
  constructor(message: string = "Invalid token") {
    super(401, "INVALID_TOKEN", message);
  }
}

// Newsletter Module Errors
export class NewsletterNotFoundError extends AppError {
  constructor(message: string = "Newsletter not found") {
    super(404, "NEWSLETTER_NOT_FOUND", message);
  }
}

export class CloudinaryUploadError extends AppError {
  constructor(message: string = "Failed to upload PDF to Cloudinary") {
    super(500, "CLOUDINARY_UPLOAD_ERROR", message);
  }
}

export class InvalidFileTypeError extends AppError {
  constructor(fileType: string) {
    super(400, "INVALID_FILE_TYPE", `Invalid file type: ${fileType}. Only PDF files are allowed`);
  }
}

export class FileSizeError extends AppError {
  constructor(maxSize: number) {
    super(400, "FILE_SIZE_ERROR", `File size exceeds maximum allowed size of ${maxSize}MB`);
  }
}

// Letter Module Errors
export class LetterNotFoundError extends AppError {
  constructor(message: string = "Letter not found") {
    super(404, "LETTER_NOT_FOUND", message);
  }
}

export class CannotResubmitApprovedError extends AppError {
  constructor() {
    super(400, "CANNOT_RESUBMIT_APPROVED", "Cannot resubmit an approved letter");
  }
}

export class LetterAlreadyRejectedError extends AppError {
  constructor() {
    super(400, "LETTER_ALREADY_REJECTED", "Cannot perform action on a rejected letter");
  }
}

export class InvalidLetterStatusError extends AppError {
  constructor(status: string) {
    super(400, "INVALID_LETTER_STATUS", `Invalid letter status: ${status}`);
  }
}

// Community Module Errors
export class PostNotFoundError extends AppError {
  constructor(message: string = "Post not found") {
    super(404, "POST_NOT_FOUND", message);
  }
}

export class CommentNotFoundError extends AppError {
  constructor(message: string = "Comment not found") {
    super(404, "COMMENT_NOT_FOUND", message);
  }
}

export class CategoryNotFoundError extends AppError {
  constructor(message: string = "Category not found") {
    super(404, "CATEGORY_NOT_FOUND", message);
  }
}

export class UserBannedError extends AppError {
  constructor(message: string = "User is banned from community") {
    super(403, "USER_BANNED", message);
  }
}

export class PostAlreadyLikedError extends AppError {
  constructor() {
    super(400, "POST_ALREADY_LIKED", "You have already liked this post");
  }
}

export class CommentAlreadyLikedError extends AppError {
  constructor() {
    super(400, "COMMENT_ALREADY_LIKED", "You have already liked this comment");
  }
}

export class CannotDeleteOthersPostError extends AppError {
  constructor() {
    super(403, "CANNOT_DELETE_OTHERS_POST", "You can only delete your own posts");
  }
}

export class CannotDeleteOthersCommentError extends AppError {
  constructor() {
    super(403, "CANNOT_DELETE_OTHERS_COMMENT", "You can only delete your own comments");
  }
}

export class CategoryAlreadyExistsError extends AppError {
  constructor(name: string) {
    super(409, "CATEGORY_ALREADY_EXISTS", `Category "${name}" already exists`);
  }
}

export class InvalidPaginationError extends AppError {
  constructor(message: string = "Invalid pagination parameters") {
    super(400, "INVALID_PAGINATION", message);
  }
}

// Blog Module Errors
export class BlogNotFoundError extends AppError {
  constructor(message: string = "Blog not found") {
    super(404, "BLOG_NOT_FOUND", message);
  }
}

export class BlogAlreadyExistsError extends AppError {
  constructor(message: string = "Blog already exists") {
    super(409, "BLOG_ALREADY_EXISTS", message);
  }
}

export class InvalidBlogStatusError extends AppError {
  constructor(message: string = "Invalid blog status") {
    super(400, "INVALID_BLOG_STATUS", message);
  }
}

export class BlogContentTooLongError extends AppError {
  constructor(message: string = "Blog content exceeds maximum length") {
    super(400, "BLOG_CONTENT_TOO_LONG", message);
  }
}
