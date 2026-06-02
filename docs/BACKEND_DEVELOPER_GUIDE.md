# Backend Developer Guide

**PlaneAndProp Backend** • Express.js + TypeScript + PostgreSQL + Drizzle ORM

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Code Standards](#code-standards)
4. [Common Patterns](#common-patterns)
5. [Error Handling](#error-handling)
6. [Logging](#logging)
7. [Database & ORM](#database--orm)
8. [API Development](#api-development)
9. [Type Safety](#type-safety)
10. [Do's and Don'ts](#dos-and-donts)

---

## Architecture Overview

The backend follows a **3-layer architecture** pattern:

```
Route (Express Router)
    ↓
Controller (Request handling, logging, error delegation)
    ↓
Service (Business logic, validation, DB operations)
    ↓
Database (Drizzle ORM queries)
```

### Layer Responsibilities

| Layer | Responsibility | Example |
|-------|-----------------|---------|
| **Route** | Define HTTP endpoints, validate input with Zod middleware | `router.post("/users", validate(schema), userController.create)` |
| **Controller** | Extract request data, call service, log operations, delegate errors | Try-catch wrapper (5-10 lines max) |
| **Service** | Business logic, validation, error throwing, DB queries | Check user exists, hash password, insert DB, log operation |
| **Database** | ORM queries using Drizzle | `db.insert(users).values(...)` |

### Why This Architecture?

✅ **Separation of Concerns** - Each layer has one job
✅ **Testability** - Services can be tested independently
✅ **Reusability** - Services used by multiple controllers if needed
✅ **Error Handling** - Global error handler catches all errors
✅ **Consistency** - Everyone follows the same pattern

---

## Project Structure

```
backend/src/
├── api/
│   ├── routes/              # Express routers
│   │   ├── auth.ts          # Auth endpoints (9 lines)
│   │   ├── newsletters.ts    # Newsletter endpoints (clean routing)
│   │   └── community.ts      # Community endpoints
│   ├── controllers/          # Request handlers
│   │   ├── authController.ts         # 8 functions, JSDoc for each
│   │   ├── newsletter/
│   │   │   ├── adminController.ts
│   │   │   └── studentController.ts
│   │   └── community/
│   │       ├── postController.ts
│   │       ├── commentController.ts
│   │       └── likeController.ts
│   └── services/            # Business logic
│       ├── authService.ts           # Auth logic, token handling
│       ├── newsletter/
│       │   ├── newsletterAdminService.ts
│       │   ├── newsletterStudentService.ts
│       │   └── newsletterAccessService.ts
│       └── community/
│           ├── postService.ts
│           ├── commentService.ts
│           └── likeService.ts
├── middleware/              # Express middleware
│   ├── auth.ts              # JWT verification
│   ├── permissions.ts       # Permission checking
│   ├── validation/          # Zod validation middleware
│   └── errorHandler.ts      # Global error handler
├── db/
│   ├── schema.ts            # Drizzle table definitions
│   └── index.ts             # Database connection
├── validation/              # Zod schemas (grouped by feature)
│   ├── auth.ts
│   ├── newsletter.ts
│   └── community.ts
├── types/
│   ├── request.ts           # Express Request interface
│   ├── newsletter.ts        # Newsletter types
│   ├── letter.ts            # Letter types
│   └── community.ts         # Community types
├── utils/
│   ├── errors.ts            # Custom error classes
│   ├── logger.ts            # Logger utility
│   ├── response.ts          # Response formatting
│   ├── auth.ts              # Auth utilities (token generation)
│   ├── permissions.ts       # Permission checking utilities
│   └── validation.ts        # Validation helpers
├── config/
│   └── index.ts             # Centralized config (env vars, constants)
└── lib/
    └── permissions.ts       # Permission constants
```

### Key Principles

- **One responsibility per file** - `authService.ts` only handles auth
- **Logical grouping** - Related features in folders (e.g., `newsletter/`)
- **Clear separation** - Routes never contain logic, controllers never query DB
- **Reusable services** - Services are called by controllers, not directly by routes

---

## Code Standards

### 1. File Naming

```
✅ DO:
- authService.ts            (camelCase, descriptive)
- authController.ts
- newsletter/               (lowercase, descriptive feature name)
- rolePermissions.ts        (compound names are clear)

❌ DON'T:
- service.ts                (too generic)
- s.ts                      (too abbreviated)
- AuthService.ts            (PascalCase for files)
- auth_service.ts           (snake_case for files)
```

### 2. Type Annotations

```typescript
✅ DO:
export async function getUserProfile(userId: string): Promise<UserProfile> {
  // ...
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
}

❌ DON'T:
export async function getUserProfile(userId: any) { // Avoid any
  // ...
}

const user: any = await db.query.users.findFirst(...);

function getUserProfile(userId) { // Missing type
```

### 3. JSDoc Comments

**Controllers** need JSDoc for every function:

```typescript
✅ DO:
/**
 * Get current authenticated user's profile
 * GET /auth/profile
 */
export async function getProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // ...
}

❌ DON'T:
export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Missing JSDoc
}
```

**Services** need JSDoc for public functions:

```typescript
✅ DO:
/**
 * Create a new letter with validation
 */
export async function createLetter(userId: string, data: CreateLetterInput): Promise<Letter> {

❌ DON'T:
export async function createLetter(userId: string, data: CreateLetterInput) {
  // Missing JSDoc
}
```

### 4. Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Variables | camelCase | `const accessToken`, `let userCount` |
| Functions | camelCase | `getUserProfile()`, `createPost()` |
| Classes | PascalCase | `class NotFoundError extends AppError` |
| Constants | UPPER_SNAKE_CASE | `const MAX_FILE_SIZE = 5000000` |
| Interfaces | PascalCase | `interface UserProfile` |
| Enums | PascalCase | `enum UserStatus` |
| Private fields | _camelCase | `private _refreshTokenTimeout` |

---

## Common Patterns

### Pattern 1: Controller Try-Catch

**Standard**: 5-10 line try-catch wrapper

```typescript
/**
 * Create a new post
 * POST /community/posts
 */
export async function createPost(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId!;
    const { title, content, categoryId } = req.body;

    const result = await postService.createPost(userId, { title, content, categoryId });

    logger.info("Post created via API", "APP", { postId: result.id, userId });

    sendSuccess(res, 201, result);
  } catch (error) {
    next(error); // ⬅️ Always use next(error) for global handler
  }
}
```

**Key Points**:
- Extract `userId` using `req.userId!` (not `req as any`)
- Extract body data with destructuring
- Call service and store result
- Log operation with structured context
- Use `sendSuccess(res, statusCode, data)`
- **Always** use `next(error)` - never manually send error response

### Pattern 2: Service Layer

**Standard**: Business logic, throw errors, let caller handle response

```typescript
/**
 * Create a new post
 */
export async function createPost(
  userId: string,
  data: CreatePostInput
): Promise<Post> {
  // 1. Validate data (if not in middleware)
  // 2. Check if user is banned
  const banned = await isUserBanned(userId);
  if (banned) {
    throw new UserBannedError("You are banned from creating posts");
  }

  // 3. Execute business logic
  const [post] = await db
    .insert(communityPosts)
    .values({
      authorId: userId,
      title: data.title,
      content: data.content,
      categoryId: data.categoryId,
      status: "PENDING",
      likeCount: 0,
      commentCount: 0,
      viewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  // 4. Log operation
  logger.info("Post created", "APP", { postId: post.id, userId });

  // 5. Return data
  return post;
}
```

**Key Points**:
- Throw custom error classes (`NotFoundError`, `UserBannedError`, etc.)
- No try-catch in service (let errors bubble up)
- Log operations (not errors - global handler logs)
- Return transformed data, not raw DB objects
- No side effects (don't send emails here, queue jobs instead)

### Pattern 3: Error Handling

```typescript
// ✅ DO: Throw custom error classes
if (!user) {
  throw new NotFoundError("User not found");
}

if (!hasPermission) {
  throw new ForbiddenError("Admin access required");
}

if (emailExists) {
  throw new ConflictError("Email already registered", "EMAIL_EXISTS");
}

// ❌ DON'T: Throw generic Error
if (!user) {
  throw new Error("User not found");
}

// ❌ DON'T: Manually handle errors in controller
try {
  // ...
  sendError(res, 500, "ERROR", "Something went wrong");
} catch (error) {
  sendError(res, 500, "ERROR", "Server error");
}
```

### Pattern 4: Validation Middleware

```typescript
// In routes/auth.ts
router.post(
  "/signup",
  validate(authSchemas.signup),  // ⬅️ Validate body
  authController.signup
);

router.get(
  "/users",
  validate(userSchemas.getPaginated, "query"),  // ⬅️ Validate query params
  userController.getAll
);

// If validation fails, middleware throws ValidationError
// Global error handler catches and returns 400 + field errors
```

### Pattern 5: Accessing Request Data

```typescript
// ✅ DO: Use typed Request properties
const userId = req.userId!;           // From authMiddleware
const roleName = req.roleName;        // From authMiddleware
const email = req.email;              // From authMiddleware
const permissions = req.userPermissions;  // From authMiddleware

// ✅ DO: Extract from body safely
const { title, content } = req.body;

// ✅ DO: Handle route params safely
const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];

// ❌ DON'T: Use `req as any`
const userId = (req as any).userId;

// ❌ DON'T: Access undefined properties
const userId = req.userId || "unknown";  // userId is guaranteed by authMiddleware
```

---

## Error Handling

### Error Hierarchy

```
AppError (base class)
├── ValidationError (400)
├── ConflictError (409)
├── NotFoundError (404)
├── UnauthorizedError (401)
├── ForbiddenError (403)
└── Feature-Specific Errors
    ├── NewsletterNotFoundError
    ├── LetterNotFoundError
    ├── UserBannedError
    └── etc.
```

### Creating Custom Errors

```typescript
// ✅ DO: Define in src/utils/errors.ts
export class PostNotFoundError extends AppError {
  constructor(message: string = "Post not found") {
    super(404, "POST_NOT_FOUND", message);
  }
}

// Usage in service:
if (!post) {
  throw new PostNotFoundError("Post not found");
}

// ❌ DON'T: Create error classes everywhere
throw new Error("Post not found");
```

### Error Response Format

**Automatic error responses** (via global error handler):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "POST_NOT_FOUND",
    "message": "Post not found",
    "details": {}
  },
  "timestamp": "2026-06-02T10:30:00Z"
}
```

---

## Logging

### Structured Logging Standard

```typescript
import { logger } from "@/utils/logger.js";

// ✅ DO: Log operations with context
logger.info("Post created via API", "APP", { postId: result.id, userId });
logger.info("User authenticated", "APP", { userId, email });
logger.warn("Rate limit approaching", "APP", { userId, attempts: 98 });

// ❌ DON'T: Console statements in production
console.log("Post created");  // ❌
console.error("Error:", error);  // ❌

// ❌ DON'T: Log errors (global handler does this)
try {
  // ...
  logger.error("Failed to create post", error);  // ❌ Don't log here
} catch (error) {
  next(error);  // ✅ Let global handler log
}
```

### Log Levels

- **info**: Successful operations, important events
- **warn**: Non-critical issues (rate limit approaching)
- **error**: Only logged by global error handler
- **debug**: Development only (use in dev environment)

### Log Format

```typescript
logger.info(
  "Operation description",
  "MODULE_NAME",  // "APP", "AUTH", "NEWSLETTER", etc.
  { key: value, userId, postId }  // Context object
);
```

---

## Database & ORM

### Drizzle ORM Standards

**Insert**:
```typescript
✅ DO:
const [user] = await db
  .insert(users)
  .values({
    email: email.toLowerCase(),
    passwordHash,
    status: "ACTIVE",
    createdAt: new Date(),
  })
  .returning();

return user;
```

**Query with relations**:
```typescript
✅ DO:
const user = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: {
    profile: true,      // Include profile relation
    role: { columns: { name: true } },  // Include only specific columns
  },
  columns: { id: true, email: true, status: true },  // Select specific user columns
});
```

**Update**:
```typescript
✅ DO:
await db
  .update(users)
  .set({
    lastLogin: new Date(),
    updatedAt: new Date(),
  })
  .where(eq(users.id, userId));
```

### Schema Organization

```typescript
// In db/schema.ts:
// 1. Define tables in logical order
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique(),
  // ...
});

// 2. Define relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles),
  posts: many(communityPosts),
}));
```

---

## API Development

### Endpoint Pattern

```typescript
/**
 * Operation description
 * METHOD /path
 */
router.method("/path", middleware, authController.handler);

// Example:
/**
 * Create a new post
 * POST /community/posts
 */
router.post(
  "/posts",
  authMiddleware,
  validate(communitySchemas.createPost),
  postController.createPost
);
```

### Request/Response Contract

**Request** (validated by Zod middleware):
```json
{
  "title": "Post Title",
  "content": "Post content...",
  "categoryId": 1
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Post Title",
    "content": "Post content...",
    "authorId": "uuid",
    "status": "PENDING",
    "likeCount": 0,
    "commentCount": 0,
    "viewCount": 0,
    "createdAt": "2026-06-02T10:30:00Z",
    "updatedAt": "2026-06-02T10:30:00Z"
  },
  "error": null,
  "timestamp": "2026-06-02T10:30:00Z"
}
```

### Pagination Pattern

```typescript
// Controller
const { page, limit, search } = req.query;

const result = await postService.getPostFeed(
  page ? parseInt(page as string) : 1,
  limit ? parseInt(limit as string) : 20,
  search as string
);

// Service
export async function getPostFeed(
  page: number = 1,
  limit: number = 20,
  search?: string
): Promise<PaginatedResponse<Post>> {
  const limit_safe = Math.min(limit, 50);  // Max 50 per page
  const offset = (page - 1) * limit_safe;

  const [items, countResult] = await Promise.all([
    db.select().from(communityPosts)
      .where(search ? ilike(...) : undefined)
      .limit(limit_safe)
      .offset(offset),
    db.select().from(communityPosts)
      .where(search ? ilike(...) : undefined),
  ]);

  return {
    items,
    pagination: {
      page,
      limit: limit_safe,
      total: countResult.length,
      totalPages: Math.ceil(countResult.length / limit_safe),
    },
  };
}
```

---

## Type Safety

### Custom Request Interface

```typescript
// src/types/request.ts
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      roleId?: number;
      roleName?: string;
      userPermissions?: string[];
      email?: string;
      token?: string;
    }
  }
}
```

### Never Use `as any`

```typescript
❌ BAD:
const userId = (req as any).userId;
const role = (req as any).roleName;

✅ GOOD:
const userId = req.userId!;     // Use custom Request interface
const role = req.roleName;      // Properly typed
```

### Type Definitions

Always define types for data structures:

```typescript
✅ DO:
export interface CreatePostInput {
  title: string;
  content: string;
  categoryId: number;
}

export interface Post extends CreatePostInput {
  id: string;
  authorId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  likeCount: number;
  commentCount: number;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

❌ DON'T:
const post: any = { title: "...", content: "..." };
```

---

## Do's and Don'ts

### ✅ DO

- **Create custom error classes** for domain-specific errors
- **Throw errors** from services, catch in global error handler
- **Use `next(error)`** in controllers, not manual error responses
- **Validate input** with Zod middleware before reaching controllers
- **Log operations** with structured context in services
- **Use type annotations** - never use `any` unless absolutely necessary
- **Extract userdata** using Request interface properties
- **Keep controllers minimal** - 5-10 lines, just orchestration
- **Group related features** - put newsletter routes/controllers/services together
- **Use JSDoc** for all controller functions and public service functions
- **Centralize config** - use `src/config/index.ts` for all env vars
- **Handle timestamps** - always set `createdAt` and `updatedAt`
- **Use soft deletes** where applicable - set `deletedAt` instead of hard deleting

### ❌ DON'T

- **Don't use generic `Error`** - throw custom error classes
- **Don't catch and rethrow** - let errors bubble up naturally
- **Don't manually send error responses** - use `next(error)`
- **Don't put business logic in routes** - routes should be 2-3 lines
- **Don't query database in controllers** - use services
- **Don't use `req as any`** - use typed Request interface
- **Don't use console.log** in production code - use logger utility
- **Don't hardcode values** - use centralized config
- **Don't make service functions too large** - split into helpers
- **Don't return raw database objects** - transform and format responses
- **Don't skip validation** - always validate inputs
- **Don't leave TODO comments** - resolve or create GitHub issues
- **Don't create global variables** - use dependency injection or config

### Request Data Access

```typescript
✅ DO:
const userId = req.userId!;           // Guaranteed by authMiddleware
const roleName = req.roleName;        // Guaranteed by authMiddleware
const { email, title } = req.body;    // Validated by Zod middleware

❌ DON'T:
const userId = (req as any).userId;   // Don't cast
const user = req.body.user;           // Validate first
const email = req.body?.email;        // Validate, don't guess
```

---

## Checklist for New Features

When adding a new feature, follow this checklist:

- [ ] Create Zod schema in `src/validation/{feature}.ts`
- [ ] Define types in `src/types/{feature}.ts`
- [ ] Create service functions in `src/api/services/{feature}/`
- [ ] Create controller in `src/api/controllers/{feature}`
- [ ] Add routes in `src/api/routes/{feature}.ts` (keep minimal)
- [ ] Add JSDoc to all controller functions
- [ ] Add structured logging to service functions
- [ ] Use custom error classes for errors
- [ ] Test error cases (user not found, permission denied, etc.)
- [ ] Add to main app.ts route imports
- [ ] Document API endpoints in comments
- [ ] Ensure proper pagination if listing
- [ ] Handle soft deletes if applicable
- [ ] Use appropriate HTTP status codes (201 for create, 200 for update/list, 204 for delete)

---

## Resources

- **Error Classes**: `src/utils/errors.ts`
- **Logger**: `src/utils/logger.ts`
- **Response Helper**: `src/utils/response.ts`
- **Config**: `src/config/index.ts`
- **Request Type**: `src/types/request.ts`
- **Validation Schemas**: `src/validation/`
- **Database Schema**: `src/db/schema.ts`

---

**Last Updated**: June 2, 2026
