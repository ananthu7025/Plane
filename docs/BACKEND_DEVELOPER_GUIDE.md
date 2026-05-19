# PlaneAndProp Backend - Developer Guide

**Last Updated**: May 18, 2026
**Framework**: Express.js + TypeScript
**Database**: PostgreSQL with Drizzle ORM

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Authentication System](#authentication-system)
7. [Middleware & Request Flow](#middleware--request-flow)
8. [Services Layer](#services-layer)
9. [Error Handling](#error-handling)
10. [Development Patterns](#development-patterns)
11. [Best Practices](#best-practices)

---

## Project Overview

PlaneAndProp Backend is a scalable Express.js REST API providing:

- **User Management**: Authentication, email verification, password reset
- **Role-Based Access Control**: Dynamic roles and permissions system
- **User Hierarchy**: Students, Mentors, Admins with different capabilities
- **Email Notifications**: OTP, password reset, notifications via queue system
- **Audit Logging**: Request tracking and logging
- **Security**: JWT auth, rate limiting, CORS, input validation

### Key Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL + Drizzle ORM
- **Authentication**: JWT (Access + Refresh tokens)
- **Email**: Email queue system (Bull/Redis)
- **Validation**: Zod schemas
- **Security**: bcryptjs, jsonwebtoken, helmet, cors
- **HTTP Client**: Axios
- **Environment**: dotenv

---

## Architecture

### Design Principles

#### ✅ **Layered Architecture**
```
Routes (Express handlers)
    ↓
Controllers/Services (business logic)
    ↓
Database Layer (Drizzle ORM)
    ↓
PostgreSQL Database
```

#### ✅ **Separation of Concerns**
- **Routes**: HTTP endpoint definitions
- **Services**: Business logic, validation, database operations
- **Middleware**: Authentication, error handling, logging, rate limiting
- **Utils**: Reusable helpers (email, validation, responses)
- **Database**: Schema definitions and migrations

#### ✅ **Error Handling**
- Centralized error handler middleware
- Consistent error response format
- Field-level validation errors
- Error codes for frontend error handling

#### ✅ **Type Safety**
- Full TypeScript coverage
- Type-safe database queries with Drizzle
- Zod schema validation
- Type inference where possible

---

## Project Structure

```
backend/
├── src/
│   ├── index.ts                    # Entry point, server config
│   │
│   ├── api/
│   │   ├── routes/
│   │   │   ├── auth.ts             # Authentication routes
│   │   │   ├── users.ts            # User management routes
│   │   │   └── roles.ts            # Roles & permissions routes
│   │   │
│   │   └── services/
│   │       ├── authService.ts      # Auth business logic
│   │       ├── userService.ts      # User business logic
│   │       └── rolesService.ts     # Roles business logic
│   │
│   ├── db/
│   │   ├── config.ts               # Database connection config
│   │   ├── schema.ts               # Drizzle schema definitions
│   │   ├── relations.ts            # Relationship definitions
│   │   └── migrations/             # Database migrations
│   │
│   ├── middleware/
│   │   ├── auth.ts                 # JWT verification, role checking
│   │   ├── errorHandler.ts         # Centralized error handling
│   │   ├── validation.ts           # Request validation
│   │   ├── logging.ts              # Request/response logging
│   │   └── rateLimiter.ts          # Rate limiting
│   │
│   ├── utils/
│   │   ├── email.ts                # Email sending utilities
│   │   ├── tokens.ts               # JWT token generation/verification
│   │   ├── validation.ts           # Zod schemas for validation
│   │   ├── responses.ts            # Standardized response format
│   │   └── errors.ts               # Custom error classes
│   │
│   └── types/
│       └── index.ts                # TypeScript type definitions
│
├── seed.ts                         # Database seeding script
├── .env                            # Environment variables
├── tsconfig.json                   # TypeScript config
└── package.json                    # Dependencies
```

---

## Database Schema

### Overview

```
Users (Central table)
├── Authentication data (email, password hash, tokens)
├── Profile data (fullName, bio, phone, city, country)
├── Status tracking (ACTIVE, INACTIVE, SUSPENDED)
└── Role assignment (STUDENT, MENTOR, ADMIN)

Roles (System roles)
├── name (STUDENT, MENTOR, ADMIN)
├── description
└── permissions[] (many-to-many)

Permissions (Granular access control)
├── name (e.g., users.create, posts.read)
├── module (Users, Posts, etc.)
├── description
└── roles[] (many-to-many)

RolePermissions (Junction table)
└── Connects roles ↔ permissions

Media (File storage metadata)
├── filename
├── mimetype
├── path
└── size
```

### Core Tables

#### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  full_name VARCHAR NOT NULL,
  role ENUM ('STUDENT', 'MENTOR', 'ADMIN') NOT NULL DEFAULT 'STUDENT',
  status ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  bio TEXT,
  phone VARCHAR,
  city VARCHAR,
  country VARCHAR,
  avatar_media_id UUID REFERENCES media(id),
  is_email_verified BOOLEAN DEFAULT false,
  email_verification_token VARCHAR,
  email_verification_token_expires_at TIMESTAMP,
  password_reset_token VARCHAR,
  password_reset_token_expires_at TIMESTAMP,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
```

#### Roles Table

```sql
CREATE TABLE roles (
  id INT PRIMARY KEY,
  name VARCHAR UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System roles (hardcoded)
INSERT INTO roles VALUES
  (1, 'STUDENT', 'Student user'),
  (2, 'MENTOR', 'Mentor user'),
  (3, 'ADMIN', 'Administrator');
```

#### Permissions Table

```sql
CREATE TABLE permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR UNIQUE NOT NULL,     -- e.g., "users.create"
  module VARCHAR NOT NULL,           -- e.g., "Users"
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Example permissions
INSERT INTO permissions (name, module, description) VALUES
  ('users.read', 'Users', 'Read user information'),
  ('users.create', 'Users', 'Create new user'),
  ('users.update', 'Users', 'Update user information'),
  ('users.delete', 'Users', 'Delete user'),
  ('roles.manage', 'Roles', 'Manage roles and permissions');
```

#### RolePermissions Junction Table

```sql
CREATE TABLE role_permissions (
  role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);
```

#### Media Table (File Storage)

```sql
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR NOT NULL,
  mimetype VARCHAR NOT NULL,
  path VARCHAR NOT NULL,
  size INT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Relationships

```
User 1─→ Many Roles (through role_id)
Role 1─→ Many Permissions (through RolePermissions)
Permission 1─→ Many Roles (through RolePermissions)
User 1─→ Many Media (avatars, documents)
```

---

## API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Body | Response | Purpose |
|--------|----------|------|----------|---------|
| POST | `/signup` | `{ email, password, fullName }` | `{ user, accessToken, refreshToken }` | Register new user |
| POST | `/signin` | `{ email, password }` | `{ user, accessToken, refreshToken }` | Login user |
| POST | `/verify-email` | `{ email, otp }` | `{ success: true }` | Verify email with OTP |
| POST | `/resend-otp` | `{ email }` | `{ success: true }` | Resend OTP to email |
| POST | `/forgot-password` | `{ email }` | `{ success: true }` | Request password reset link |
| POST | `/reset-password` | `{ email, token, newPassword }` | `{ success: true }` | Reset password with token |
| POST | `/refresh` | `{ refreshToken }` | `{ accessToken }` | Get new access token |
| POST | `/signout` | - | `{ success: true }` | Logout user |

### User Management Routes (`/api/users`)

| Method | Endpoint | Query | Body | Auth | Response |
|--------|----------|-------|------|------|----------|
| GET | `/` | `page, limit, search, role, status, sort, order` | - | Required | `{ users[], pagination }` |
| GET | `/:id` | - | - | Required | `{ user }` |
| PUT | `/:id` | - | `{ fullName, bio, phone, city, country }` | Required | `{ user }` |
| PUT | `/:id/role` | - | `{ role: STUDENT\|MENTOR\|ADMIN }` | Required (ADMIN) | `{ user }` |
| PUT | `/:id/status` | - | `{ status: ACTIVE\|INACTIVE\|SUSPENDED }` | Required (ADMIN) | `{ user }` |
| DELETE | `/:id` | - | - | Required (ADMIN) | `{ success: true }` |

### Roles & Permissions Routes (`/api/admin/roles`)

| Method | Endpoint | Query | Body | Auth | Response |
|--------|----------|-------|------|------|----------|
| GET | `/` | - | - | Required | `{ roles[] with permissions }` |
| GET | `/:id` | - | - | Required | `{ role with permissions }` |
| POST | `/:id/permissions` | - | `{ permissionId }` | Required (ADMIN) | `{ role }` |
| DELETE | `/:id/permissions/:permId` | - | - | Required (ADMIN) | `{ success: true }` |

### Permissions Routes (`/api/admin/permissions`)

| Method | Endpoint | Query | Body | Auth | Response |
|--------|----------|-------|------|------|----------|
| GET | `/` | `page, limit, module` | - | Required | `{ permissions[], pagination }` |
| POST | `/` | - | `{ name, module, description }` | Required (ADMIN) | `{ permission }` |
| PUT | `/:id` | - | `{ name, module, description }` | Required (ADMIN) | `{ permission }` |
| DELETE | `/:id` | - | - | Required (ADMIN) | `{ success: true }` |

### Health Check

| Method | Endpoint | Response |
|--------|----------|----------|
| GET | `/health` | `{ status: 'ok', timestamp }` |

---

## Authentication System

### Request Flow

```
Client Request
    ↓
Route Handler (Express)
    ↓
Middleware: authenticateToken
├─ Extract token from Authorization header
├─ Verify JWT signature
├─ Decode user data
└─ Attach user to request object
    ↓
Middleware: authorizeRole (optional)
├─ Check user.role matches required role
└─ Continue or reject
    ↓
Service Layer
├─ Business logic
├─ Database operations
└─ Response data
    ↓
Response Handler
├─ Format response
├─ Send to client
└─ Handle errors
```

### Token Management

#### Access Token
- **Payload**: `{ id, email, role, fullName }`
- **Expiration**: 15 minutes
- **Use**: Every API request in Authorization header
- **Header Format**: `Authorization: Bearer {accessToken}`

#### Refresh Token
- **Payload**: `{ id, version }`
- **Expiration**: 7 days
- **Use**: Get new access token when expired
- **Storage**: Database + HttpOnly cookie (optional)

#### Token Refresh Flow

```
Access Token Expired (401)
    ↓
Client detects 401
    ↓
Call POST /api/auth/refresh
├─ Send refresh token
├─ Verify refresh token
├─ Check version match (prevent old tokens)
└─ Generate new access token
    ↓
Retry original request with new token
```

### Password Management

#### Sign Up

```
1. User submits email, password, fullName
2. Validate inputs with Zod schema
3. Check email doesn't exist
4. Hash password (bcryptjs, salt=10)
5. Create user with is_email_verified=false
6. Generate OTP (6 digits)
7. Send OTP email
8. Return user + tokens
```

#### Email Verification

```
1. User receives OTP in email
2. User submits OTP
3. Verify OTP matches and not expired
4. Set is_email_verified=true
5. Clear verification token
6. Return success
```

#### Forgot Password

```
1. User enters email
2. Check user exists
3. Generate reset token (JWT with expiration)
4. Save token + expiration to user record
5. Send reset link in email: {domain}/reset?token=X&email=Y
6. Return success
```

#### Reset Password

```
1. User submits email, token, newPassword
2. Verify token is valid and not expired
3. Verify token hasn't been used before
4. Hash new password
5. Update password
6. Clear reset token + expiration
7. Set password_reset_token_used = true (prevent reuse)
8. Return success
```

---

## Middleware & Request Flow

### Request Processing Pipeline

```
┌─────────────────────────────────────────────────────┐
│  Incoming Request                                   │
└─────────────────┬───────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────┐
│  Global Middleware                                  │
│  - helmet() - Security headers                      │
│  - cors() - CORS configuration                      │
│  - express.json() - Parse JSON body                 │
│  - requestLogger() - Log all requests               │
└─────────────────┬───────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────┐
│  Route-Specific Middleware                          │
│  - authenticateToken() - Verify JWT                 │
│  - authorizeRole() - Check role permission          │
│  - validateRequest() - Validate body/params         │
│  - rateLimiter() - Rate limiting                    │
└─────────────────┬───────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────┐
│  Route Handler (Service Layer)                      │
│  - Business logic                                   │
│  - Database queries                                 │
│  - Validation                                       │
└─────────────────┬───────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────┐
│  Response Handler                                   │
│  - Format response                                  │
│  - Set status code                                  │
│  - Send JSON response                               │
└─────────────────┬───────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────┐
│  Error Handler (if error occurs)                    │
│  - Catch error                                      │
│  - Log error                                        │
│  - Format error response                            │
│  - Send error to client                             │
└─────────────────┬───────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────┐
│  Response Sent to Client                            │
└─────────────────────────────────────────────────────┘
```

### Key Middleware

#### Authentication Middleware

```typescript
// middleware/auth.ts
export function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;  // Attach to request
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
}

export function authorizeRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}
```

#### Error Handler Middleware

```typescript
// middleware/errorHandler.ts
export function errorHandler(err, req, res, next) {
  console.error(err);

  if (err instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: err.message,
        details: err.details,  // Field errors
      },
    });
  }

  if (err instanceof NotFoundError) {
    return res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: err.message },
    });
  }

  // Default error
  res.status(500).json({
    success: false,
    error: { code: "SERVER_ERROR", message: "Internal server error" },
  });
}
```

---

## Services Layer

### Pattern

```typescript
// services/userService.ts
export class UserService {
  static async getAllUsers(params) {
    // Validate params
    const validated = getAllUsersSchema.parse(params);

    // Build query
    const query = db.select().from(users);

    if (validated.search) {
      query.where(ilike(users.email, `%${validated.search}%`));
    }

    // Pagination
    const offset = (validated.page - 1) * validated.limit;
    const result = await query.limit(validated.limit).offset(offset);

    const total = await db.select({ count: count() }).from(users);

    return {
      users: result,
      pagination: {
        page: validated.page,
        limit: validated.limit,
        total: total[0].count,
        totalPages: Math.ceil(total[0].count / validated.limit),
      },
    };
  }

  static async getUserById(id) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return user;
  }

  static async updateUser(id, data) {
    // Validate
    const validated = updateUserSchema.parse(data);

    // Update
    const updated = await db
      .update(users)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    return updated[0];
  }
}
```

### Route Integration

```typescript
// routes/users.ts
router.get("/", authenticateToken, async (req, res, next) => {
  try {
    const result = await UserService.getAllUsers(req.query);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);  // Pass to error handler
  }
});

router.get("/:id", authenticateToken, async (req, res, next) => {
  try {
    const user = await UserService.getUserById(req.params.id);
    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
});

router.put("/:id", authenticateToken, async (req, res, next) => {
  try {
    const user = await UserService.updateUser(req.params.id, req.body);
    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
});
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {
      "field": "email",
      "validation": "invalid_value"
    }
  },
  "timestamp": "2026-05-18T10:08:34.438Z"
}
```

### Error Codes & Meanings

| Code | Status | Meaning |
|------|--------|---------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `CONFLICT` | 409 | Resource already exists (e.g., email taken) |
| `RESET_TOKEN_EXPIRED` | 400 | Reset link expired |
| `RESET_TOKEN_USED` | 400 | Reset link already used |
| `RESET_TOKEN_INVALID` | 400 | Invalid reset link |
| `SERVER_ERROR` | 500 | Unexpected server error |

### Custom Error Classes

```typescript
// utils/errors.ts
export class AppError extends Error {
  constructor(public code: string, public statusCode: number, message: string) {
    super(message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public details?: any) {
    super("VALIDATION_ERROR", 400, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super("UNAUTHORIZED", 401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super("FORBIDDEN", 403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super("NOT_FOUND", 404, message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super("CONFLICT", 409, message);
  }
}
```

---

## Development Patterns

### Pattern 1: Creating a New API Endpoint

```typescript
// 1. Define validation schema (utils/validation.ts)
export const createPostSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  categoryId: z.number().int().positive(),
});

// 2. Create service method (services/postService.ts)
export class PostService {
  static async createPost(data, userId) {
    // Validate
    const validated = createPostSchema.parse(data);

    // Create
    const post = await db.insert(posts).values({
      ...validated,
      userId,
      createdAt: new Date(),
    }).returning();

    return post[0];
  }
}

// 3. Create route handler (routes/posts.ts)
router.post(
  "/",
  authenticateToken,
  authorizeRole("MENTOR", "ADMIN"),
  async (req, res, next) => {
    try {
      const post = await PostService.createPost(req.body, req.user.id);
      res.status(201).json({
        success: true,
        data: { post },
      });
    } catch (error) {
      next(error);
    }
  }
);

// 4. Mount route in index.ts
app.use("/api/posts", postsRouter);
```

### Pattern 2: Protected Admin-Only Endpoint

```typescript
// routes/admin/users.ts
router.delete(
  "/:id",
  authenticateToken,                    // Step 1: Verify token
  authorizeRole("ADMIN"),                // Step 2: Check role
  async (req, res, next) => {            // Step 3: Handle request
    try {
      const userId = req.params.id;

      // Validation
      if (!isValidUUID(userId)) {
        throw new ValidationError("Invalid user ID");
      }

      // Check user exists
      const user = await UserService.getUserById(userId);

      // Prevent self-deletion
      if (user.id === req.user.id) {
        throw new ForbiddenError("Cannot delete yourself");
      }

      // Delete
      await UserService.deleteUser(userId);

      res.json({
        success: true,
        data: { message: "User deleted" },
      });
    } catch (error) {
      next(error);
    }
  }
);
```

### Pattern 3: Search & Pagination

```typescript
// services/userService.ts
export class UserService {
  static async getAllUsers({
    page = 1,
    limit = 20,
    search = "",
    role,
    status,
    sort = "createdAt",
    order = "desc",
  }) {
    // Build query with filters
    let query = db.select().from(users);

    // Search filter
    if (search) {
      query = query.where(
        or(
          ilike(users.email, `%${search}%`),
          ilike(users.fullName, `%${search}%`)
        )
      );
    }

    // Role filter
    if (role) {
      query = query.where(eq(users.role, role));
    }

    // Status filter
    if (status && status !== "all") {
      query = query.where(eq(users.status, status));
    }

    // Count total before pagination
    const countResult = await db
      .select({ count: count() })
      .from(users)
      .where(query.getSQL());

    const total = countResult[0].count;

    // Pagination & sorting
    const offset = (page - 1) * limit;
    const result = await query
      .orderBy(
        order === "asc"
          ? asc(users[sort])
          : desc(users[sort])
      )
      .limit(limit)
      .offset(offset);

    return {
      users: result,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
```

---

## Best Practices

### 1. **Always Validate Input**
```typescript
// ✅ GOOD
const validated = createUserSchema.parse(req.body);
const user = await UserService.createUser(validated);

// ❌ BAD
const user = await UserService.createUser(req.body);
```

### 2. **Use Custom Error Classes**
```typescript
// ✅ GOOD
if (user.email === email) {
  throw new ConflictError("Email already exists");
}

// ❌ BAD
throw new Error("Email already exists");
```

### 3. **Check Authorization Before Operations**
```typescript
// ✅ GOOD
router.delete(
  "/:id",
  authenticateToken,
  authorizeRole("ADMIN"),
  async (req, res, next) => {
    // Only admins reach here
  }
);

// ❌ BAD
router.delete("/:id", async (req, res, next) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Forbidden" });
  }
  // ...
});
```

### 4. **Hash Passwords Securely**
```typescript
// ✅ GOOD
import bcryptjs from "bcryptjs";
const hashedPassword = await bcryptjs.hash(password, 10);

// ❌ BAD
const hashedPassword = Buffer.from(password).toString("base64");
```

### 5. **Use Environment Variables for Secrets**
```typescript
// ✅ GOOD
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET not set");

// ❌ BAD
const JWT_SECRET = "my-secret-key";
```

### 6. **Return Consistent Response Format**
```typescript
// ✅ GOOD
res.json({
  success: true,
  data: { user, posts: [] },
  timestamp: new Date().toISOString(),
});

// ❌ BAD
res.json({ user, posts: [] });
res.json({ result: user });
res.json(user);
```

### 7. **Separate Business Logic from Routes**
```typescript
// ✅ GOOD
// services/userService.ts
export class UserService {
  static async updateUserStatus(userId, status) {
    // Validation
    // Logic
    // Database operations
  }
}

// routes/users.ts
router.put("/:id/status", async (req, res, next) => {
  try {
    const user = await UserService.updateUserStatus(req.params.id, req.body.status);
    res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
});

// ❌ BAD - All logic in route
router.put("/:id/status", async (req, res) => {
  const user = await db.update(users).set({ status: req.body.status })...;
  res.json(user);
});
```

### 8. **Log Important Events**
```typescript
// ✅ GOOD
logger.info(`User ${userId} created`, { email, role });
logger.warn(`Password reset requested for ${email}`, { timestamp });
logger.error(`Database connection failed`, { error });

// ❌ BAD - No logging
const user = UserService.createUser(data);
```

### 9. **Handle Database Errors Gracefully**
```typescript
// ✅ GOOD
try {
  const user = await db.insert(users).values(data);
} catch (error) {
  if (error.code === "23505") {  // Unique constraint violation
    throw new ConflictError("Email already exists");
  }
  throw error;
}

// ❌ BAD
const user = await db.insert(users).values(data);  // Crashes if error
```

### 10. **Use Type-Safe Database Queries**
```typescript
// ✅ GOOD - Drizzle ORM
const user = await db.query.users.findFirst({
  where: eq(users.id, userId),
  columns: {
    id: true,
    email: true,
    fullName: true,
    // passwordHash excluded for security
  },
});

// ❌ BAD
const user = await db.query("SELECT * FROM users WHERE id = $1", [userId]);
```

---

## Environment Variables

Create `.env` file in backend root:

```bash
# Server
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/planeandprop

# JWT
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your-refresh-secret-key-min-32-chars
REFRESH_TOKEN_EXPIRES_IN=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@planeandprop.com

# Frontend
CLIENT_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Running the Backend

```bash
# Install dependencies
npm install

# Setup database
npm run db:migrate

# Seed database with sample data
npm run db:seed

# Start development server (with auto-reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

## Useful Commands

```bash
# Database operations
npm run db:migrate         # Run migrations
npm run db:seed            # Seed sample data
npm run db:studio          # Open Drizzle Studio GUI

# Development
npm run dev                # Start with watch mode
npm run build              # TypeScript compilation
npm run type-check         # Type checking

# Testing
npm run test               # Run tests
npm run test:watch        # Run tests with watch
```

---

This guide provides a complete reference for backend development and architecture. Refer to specific service files for implementation details.
