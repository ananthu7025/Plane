# PlaneAndProp Backend - Architecture & Flows

**Document**: Visual flows and architecture diagrams for the Express.js backend
**Last Updated**: May 18, 2026

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    PlaneAndProp Backend                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │            Express.js HTTP Server                        │   │
│  │                                                          │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │ Global Middleware                                 │ │   │
│  │  │ - helmet() [Security headers]                     │ │   │
│  │  │ - cors() [Cross-origin]                           │ │   │
│  │  │ - express.json() [Parse JSON]                     │ │   │
│  │  │ - requestLogger() [Log requests]                  │ │   │
│  │  │ - rateLimiter() [Rate limiting]                   │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  │                                                          │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │ Route Handlers (API Endpoints)                    │ │   │
│  │  │ ├─ /api/auth/* (Authentication)                  │ │   │
│  │  │ ├─ /api/users/* (User management)                │ │   │
│  │  │ ├─ /api/admin/roles/* (Roles & permissions)      │ │   │
│  │  │ ├─ /api/admin/permissions/* (Permissions)        │ │   │
│  │  │ └─ /health (Health check)                        │ │   │
│  │  │                                                   │ │   │
│  │  │ Route-Specific Middleware:                        │ │   │
│  │  │ ├─ authenticateToken() [Verify JWT]              │ │   │
│  │  │ ├─ authorizeRole() [Check role permission]       │ │   │
│  │  │ └─ validateRequest() [Validate body/params]      │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  │                                                          │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │ Service Layer (Business Logic)                    │ │   │
│  │  │ ├─ AuthService                                    │ │   │
│  │  │ │  ├─ signup()                                    │ │   │
│  │  │ │  ├─ signin()                                    │ │   │
│  │  │ │  ├─ verifyEmail()                               │ │   │
│  │  │ │  ├─ forgotPassword()                            │ │   │
│  │  │ │  └─ resetPassword()                             │ │   │
│  │  │ ├─ UserService                                    │ │   │
│  │  │ │  ├─ getAllUsers()                               │ │   │
│  │  │ │  ├─ getUserById()                               │ │   │
│  │  │ │  ├─ updateUser()                                │ │   │
│  │  │ │  └─ deleteUser()                                │ │   │
│  │  │ └─ RolesService                                   │ │   │
│  │  │    ├─ getAllRoles()                               │ │   │
│  │  │    ├─ assignPermission()                          │ │   │
│  │  │    └─ removePermission()                          │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  │                                                          │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │ Data Layer (Drizzle ORM)                          │ │   │
│  │  │ ├─ Drizzle query builder                          │ │   │
│  │  │ ├─ Type-safe queries                              │ │   │
│  │  │ └─ Connection pooling                             │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  │                                                          │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │ Error Handling Middleware                         │ │   │
│  │  │ ├─ Catch errors from services                     │ │   │
│  │  │ ├─ Format error responses                         │ │   │
│  │  │ ├─ Log errors                                     │ │   │
│  │  │ └─ Send to client                                 │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ PostgreSQL Database                                     │   │
│  │ ├─ users (User accounts & profiles)                    │   │
│  │ ├─ roles (STUDENT, MENTOR, ADMIN)                      │   │
│  │ ├─ permissions (Granular access control)               │   │
│  │ ├─ role_permissions (Junction table)                   │   │
│  │ └─ media (File storage metadata)                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ External Services                                       │   │
│  │ ├─ Email Service (SMTP for OTP, password reset)        │   │
│  │ ├─ JWT Token Generation                                │   │
│  │ └─ Password Hashing (bcryptjs)                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Request/Response Flow

```
┌──────────────────────────┐
│  Client (React App)      │
└───────────┬──────────────┘
            │
            │ HTTP Request
            │ Headers: { Authorization: Bearer token }
            │ Body: JSON
            ↓
┌──────────────────────────┐
│  Express.js Server       │
│  (Receives request)      │
└───────────┬──────────────┘
            │
            ↓
┌──────────────────────────┐
│  Global Middleware       │
│  - CORS check            │
│  - JSON parse            │
│  - Request logging       │
└───────────┬──────────────┘
            │
            ↓
┌──────────────────────────┐
│  Route Matching          │
│  Find handler based on   │
│  method + path           │
└───────────┬──────────────┘
            │
            ↓
┌──────────────────────────┐
│  Route Middleware        │
│  - authenticateToken()   │
│  - authorizeRole()       │
│  - validateRequest()     │
└───────────┬──────────────┘
            │
    ┌───────┴───────┐
    │               │
    ↓               ↓
 ✅ Pass      ❌ Fail
    │               │
    │               ↓
    │         ┌─────────────────┐
    │         │ Error Response  │
    │         │ 401/403/400     │
    │         └────────┬────────┘
    │                  │
    │                  └──→ Send error JSON
    │
    ↓
┌──────────────────────────┐
│  Route Handler           │
│  async (req, res, next)  │
└───────────┬──────────────┘
            │
            ↓
┌──────────────────────────────────┐
│  Service Layer                   │
│  - Validate input                │
│  - Execute business logic        │
│  - Query database                │
│  - Throw errors if needed        │
└───────────┬──────────────────────┘
            │
    ┌───────┴────────┐
    │                │
    ↓                ↓
 ✅ Success    ❌ Error
    │                │
    │                ↓
    │         ┌──────────────────┐
    │         │ Catch Block      │
    │         │ next(error)      │
    │         └────────┬─────────┘
    │                  │
    │                  ↓
    │         ┌──────────────────────┐
    │         │ Error Handler        │
    │         │ Middleware           │
    │         └────────┬─────────────┘
    │                  │
    │                  ↓
    │         ┌──────────────────────┐
    │         │ Format error         │
    │         │ response             │
    │         └────────┬─────────────┘
    │                  │
    ↓                  ↓
┌──────────────────────────────┐
│  Response Handler            │
│  res.json({...})             │
│  res.status(201/200/...)     │
└───────────┬──────────────────┘
            │
            ↓
┌──────────────────────────────┐
│  HTTP Response Sent          │
│  - Status code               │
│  - Headers                   │
│  - JSON body                 │
└───────────┬──────────────────┘
            │
            ↓
┌──────────────────────────┐
│  Client Receives         │
│  Response                │
└──────────────────────────┘
```

---

## 3. Sign In Flow

```
┌────────────────────────────────────────────────────────────────┐
│  POST /api/auth/signin                                         │
│  Body: { email: "user@example.com", password: "..." }          │
└────────────────┬───────────────────────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────────────────────┐
│  Route Handler: signInController                               │
│  - No auth middleware (public endpoint)                        │
└────────────────┬───────────────────────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────────────────────┐
│  Validate Input with Zod                                       │
│  schema: { email: string().email(), password: string() }       │
│                                                                │
│  If invalid: throw ValidationError                            │
│    → Error handler formats response                           │
│    → Send 400 with field errors                               │
└────────────────┬───────────────────────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────────────────────┐
│  AuthService.signin(email, password)                           │
│                                                                │
│  1. Find user by email in database                            │
│     await db.query.users.findFirst({                          │
│       where: eq(users.email, email)                           │
│     })                                                        │
│                                                                │
│  2. Check if user exists                                      │
│     if (!user) throw NotFoundError("User not found")          │
└────────────────┬───────────────────────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────────────────────┐
│  Verify Password                                               │
│                                                                │
│  1. Compare submitted password with stored hash               │
│     const match = await bcryptjs.compare(                     │
│       password,                                               │
│       user.passwordHash                                       │
│     )                                                         │
│                                                                │
│  2. If passwords don't match                                  │
│     throw UnauthorizedError("Invalid credentials")            │
└────────────────┬───────────────────────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────────────────────┐
│  Check Email Verified                                          │
│                                                                │
│  If not verified:                                             │
│  throw ForbiddenError("Please verify your email first")       │
│  (Optional - depending on requirements)                       │
└────────────────┬───────────────────────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────────────────────┐
│  Generate Tokens                                               │
│                                                                │
│  1. Access Token (15 minutes):                                │
│     jwt.sign(                                                 │
│       { id: user.id, email: user.email, role: user.role },   │
│       JWT_SECRET,                                             │
│       { expiresIn: "15m" }                                    │
│     )                                                         │
│                                                                │
│  2. Refresh Token (7 days):                                   │
│     jwt.sign(                                                 │
│       { id: user.id, version: 1 },                            │
│       REFRESH_TOKEN_SECRET,                                   │
│       { expiresIn: "7d" }                                     │
│     )                                                         │
│                                                                │
│  3. Save refresh token to database (optional)                 │
│     update users set refreshTokenVersion = 1                  │
└────────────────┬───────────────────────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────────────────────┐
│  Update Last Login                                             │
│  await db.update(users)                                        │
│    .set({ lastLoginAt: new Date() })                          │
│    .where(eq(users.id, user.id))                              │
└────────────────┬───────────────────────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────────────────────┐
│  Return Success Response                                       │
│  {                                                            │
│    success: true,                                             │
│    data: {                                                    │
│      user: {                                                  │
│        id, email, fullName, role, status,                     │
│        (excludes: passwordHash)                               │
│      },                                                       │
│      accessToken: "jwt...",                                   │
│      refreshToken: "jwt..."                                   │
│    }                                                          │
│  }                                                            │
│                                                                │
│  Status: 200 OK                                               │
└────────────────┬───────────────────────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────────────────────┐
│  Client Receives Response                                      │
│  - Stores tokens (localStorage or memory)                     │
│  - Stores user data in Redux                                  │
│  - Sets Authorization header for future requests              │
└────────────────────────────────────────────────────────────────┘
```

### Error Scenarios

```
Invalid Email
    ↓
User not found in database
    ↓
NotFoundError("User not found")
    ↓
Error handler catches
    ↓
Response: 404 with code NOT_FOUND


Invalid Password
    ↓
bcryptjs.compare() returns false
    ↓
UnauthorizedError("Invalid credentials")
    ↓
Response: 401 with code UNAUTHORIZED


Email Not Verified
    ↓
user.isEmailVerified = false
    ↓
ForbiddenError("Please verify email")
    ↓
Response: 403 with code FORBIDDEN
```

---

## 4. Email Verification Flow

```
┌────────────────────────────────────────────────────────────────┐
│  POST /api/auth/signup                                         │
│  Creates user + sends OTP email                                │
└────────────────┬───────────────────────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────────────────────┐
│  AuthService.signup(email, password, fullName)                 │
│                                                                │
│  1. Validate inputs (Zod schema)                              │
│  2. Check email doesn't exist                                 │
│  3. Hash password with bcryptjs (salt: 10)                    │
│  4. Generate 6-digit OTP                                      │
│  5. Create user with:                                         │
│     - isEmailVerified: false                                  │
│     - emailVerificationToken: encrypted OTP                   │
│     - emailVerificationTokenExpiresAt: +10 minutes            │
│  6. Send email with OTP                                       │
│  7. Return user + tokens (optional - depends on policy)       │
└────────────────┬───────────────────────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────────────────────┐
│  Email Sent to User                                            │
│  Subject: "Verify your PlaneAndProp email"                    │
│  Body: "Your OTP is: 123456"                                  │
└────────────────┬───────────────────────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────────────────────┐
│  User Receives Email                                           │
│  Enters OTP in EmailVerificationPage                           │
└────────────────┬───────────────────────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────────────────────┐
│  POST /api/auth/verify-email                                   │
│  Body: { email, otp: "123456" }                                │
└────────────────┬───────────────────────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────────────────────┐
│  AuthService.verifyEmail(email, otp)                           │
│                                                                │
│  1. Find user by email                                        │
│  2. Verify token not expired                                  │
│     if (now > emailVerificationTokenExpiresAt)                │
│       throw Error("OTP expired")                              │
│  3. Decrypt stored OTP                                        │
│  4. Compare with submitted OTP                                │
│     if (storedOtp !== submittedOtp)                           │
│       throw Error("Invalid OTP")                              │
│  5. Update user:                                              │
│     - isEmailVerified: true                                   │
│     - Clear emailVerificationToken                            │
│     - Clear emailVerificationTokenExpiresAt                   │
│  6. Return success                                            │
└────────────────┬───────────────────────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────────────────────┐
│  Resend OTP (if user clicks "Resend")                          │
│  POST /api/auth/resend-otp                                     │
│  Body: { email }                                               │
│                                                                │
│  1. Find user                                                 │
│  2. Generate new OTP                                          │
│  3. Update user with new token + expiration                   │
│  4. Send email with new OTP                                   │
│  5. Return success                                            │
│                                                                │
│  Cooldown: Min 1 minute between resends (optional)            │
└────────────────┬───────────────────────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────────────────────┐
│  User Can Now Login                                            │
│  Email is verified, account is active                         │
└────────────────────────────────────────────────────────────────┘
```

---

## 5. User Management Flow (Admin)

```
┌──────────────────────────────────────────┐
│  GET /api/users?page=1&limit=20&role=... │
│  Auth: Required                          │
└──────────────┬───────────────────────────┘
               ↓
┌──────────────────────────────────────────────────────────────┐
│  authenticateToken Middleware                                │
│  - Extract token from Authorization header                   │
│  - Verify JWT signature                                      │
│  - Decode user data                                          │
│  - Attach req.user = { id, email, role, ... }               │
└──────────────┬───────────────────────────────────────────────┘
               ↓
┌──────────────────────────────────────────────────────────────┐
│  Validate Query Parameters                                   │
│  schema: {                                                   │
│    page: number >= 1                                         │
│    limit: number >= 1 and <= 100                            │
│    search?: string                                           │
│    role?: "STUDENT" | "MENTOR" | "ADMIN"                    │
│    status?: "ACTIVE" | "INACTIVE" | "SUSPENDED"             │
│    sort?: "createdAt" | "email"                             │
│    order?: "asc" | "desc"                                   │
│  }                                                          │
└──────────────┬───────────────────────────────────────────────┘
               ↓
┌──────────────────────────────────────────────────────────────┐
│  UserService.getAllUsers(validated)                          │
│                                                              │
│  1. Build Drizzle query                                      │
│     let query = db.select().from(users)                      │
│                                                              │
│  2. Apply filters                                            │
│     - Search: ilike(users.email, "%search%")                 │
│     - Role: eq(users.role, "STUDENT")                        │
│     - Status: eq(users.status, "ACTIVE")                     │
│     Note: If status="all", don't filter                      │
│                                                              │
│  3. Count total matching records                             │
│     const total = db.count().from(users)                     │
│                                                              │
│  4. Apply pagination                                         │
│     const offset = (page - 1) * limit                        │
│     query.offset(offset).limit(limit)                        │
│                                                              │
│  5. Apply sorting                                            │
│     order === "asc" ? asc(users[sort]) : desc(users[sort])  │
│                                                              │
│  6. Execute query                                            │
│     const result = await query                               │
│                                                              │
│  7. Return formatted response                                │
└──────────────┬───────────────────────────────────────────────┘
               ↓
┌──────────────────────────────────────────────────────────────┐
│  Response: 200 OK                                            │
│  {                                                           │
│    success: true,                                            │
│    data: {                                                   │
│      users: [{id, email, fullName, role, status, ...}],    │
│      pagination: {                                           │
│        page: 1,                                              │
│        limit: 20,                                            │
│        total: 150,                                           │
│        totalPages: 8                                         │
│      }                                                       │
│    }                                                         │
│  }                                                           │
└────────────────────────────────────────────────────────────────┘
```

---

## 6. Roles & Permissions Management

### Get All Roles (With Permissions)

```
GET /api/admin/roles
    ↓
RolesService.getAllRoles()
    ↓
SELECT roles
JOIN role_permissions
JOIN permissions
    ↓
Group permissions by role
    ↓
Return:
[
  {
    id: 1,
    name: "ADMIN",
    description: "...",
    permissions: [
      { id: 1, name: "users.read", module: "Users" },
      { id: 2, name: "users.create", module: "Users" },
      ...
    ],
    userCount: 5
  },
  ...
]
```

### Assign Permission to Role

```
POST /api/admin/roles/:roleId/permissions
Body: { permissionId: 5 }
Auth: Required (ADMIN)
    ↓
Validate:
- Role exists
- Permission exists
- Not already assigned
    ↓
RolesService.assignPermissionToRole(roleId, permissionId)
    ↓
INSERT INTO role_permissions (role_id, permission_id)
VALUES (1, 5)
    ↓
Return: Updated role with all permissions
    ↓
Success toast on frontend
```

### Remove Permission from Role

```
DELETE /api/admin/roles/:roleId/permissions/:permissionId
Auth: Required (ADMIN)
    ↓
Validate:
- Role exists
- Permission exists
- Currently assigned
    ↓
RolesService.removePermissionFromRole(roleId, permissionId)
    ↓
DELETE FROM role_permissions
WHERE role_id = 1 AND permission_id = 5
    ↓
Return: Updated role without the permission
    ↓
Success toast on frontend
```

---

## 7. Database Query Examples

### Type-Safe Queries with Drizzle

```typescript
// Get user by ID
const user = await db.query.users.findFirst({
  where: eq(users.id, userId),
  columns: {
    id: true,
    email: true,
    fullName: true,
    role: true,
    // passwordHash intentionally excluded
  },
});

// Get all users with filters and pagination
const result = await db
  .select({
    id: users.id,
    email: users.email,
    fullName: users.fullName,
    status: users.status,
  })
  .from(users)
  .where(
    and(
      eq(users.role, "STUDENT"),
      eq(users.status, "ACTIVE"),
      ilike(users.email, "%search%")
    )
  )
  .orderBy(desc(users.createdAt))
  .limit(20)
  .offset(0);

// Get role with all permissions
const role = await db.query.roles.findFirst({
  where: eq(roles.id, roleId),
  with: {
    permissions: {
      columns: {
        id: true,
        name: true,
        module: true,
      },
    },
  },
});

// Update user
const updated = await db
  .update(users)
  .set({
    fullName: "New Name",
    updatedAt: new Date(),
  })
  .where(eq(users.id, userId))
  .returning();

// Delete user
await db.delete(users).where(eq(users.id, userId));

// Count total
const count = await db
  .select({ count: count() })
  .from(users)
  .where(eq(users.role, "STUDENT"));
```

---

## 8. Error Response Examples

### Validation Error

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "field": "email",
      "validation": "invalid_value"
    }
  },
  "timestamp": "2026-05-18T10:08:34.438Z"
}
```

### Unauthorized

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid credentials"
  },
  "timestamp": "2026-05-18T10:08:34.438Z"
}
```

### Forbidden (No Permission)

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "FORBIDDEN",
    "message": "You don't have permission to perform this action"
  },
  "timestamp": "2026-05-18T10:08:34.438Z"
}
```

### Not Found

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "NOT_FOUND",
    "message": "User not found"
  },
  "timestamp": "2026-05-18T10:08:34.438Z"
}
```

### Conflict (Duplicate)

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "CONFLICT",
    "message": "Email already exists"
  },
  "timestamp": "2026-05-18T10:08:34.438Z"
}
```

---

## 9. Authentication Middleware Chain

```
Request with Bearer Token
    ↓
┌─────────────────────────────────────┐
│ authenticateToken Middleware        │
├─────────────────────────────────────┤
│ 1. Extract Authorization header     │
│    "Bearer eyJhbGciOiJIUzI1NiIs..." │
│ 2. Split by space, get token part   │
│ 3. Verify JWT signature             │
│    jwt.verify(token, JWT_SECRET)    │
│ 4. Decode payload                   │
│ 5. Attach to req.user               │
│    req.user = {                     │
│      id: "uuid",                    │
│      email: "user@example.com",     │
│      role: "STUDENT"                │
│    }                                │
│ 6. Call next()                      │
└─────────────────┬───────────────────┘
                  │
        ┌─────────┴──────────┐
        │                    │
        ↓                    ↓
    ✅ Valid           ❌ Invalid
        │                    │
        │                    ↓
        │         ┌────────────────────┐
        │         │ Throw Error        │
        │         │ "Invalid token"    │
        │         │ Status: 401        │
        │         └────────┬───────────┘
        │                  │
        ↓                  ↓
┌───────────────────────────────────┐
│ authorizeRole Middleware          │
│ (Optional - only on admin routes) │
├───────────────────────────────────┤
│ 1. Check req.user.role            │
│ 2. Match against allowed roles    │
│    e.g., ["ADMIN"]                │
│ 3. If match: continue             │
│    If no match: throw error       │
│    Status: 403                    │
└──────────────────┬────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ↓                     ↓
    ✅ Allowed          ❌ Forbidden
        │                     │
        ↓                     ↓
   Route Handler        Error Handler
```

---

## 10. Data Model Relationships

```
┌─────────────────┐
│     Users       │
├─────────────────┤
│ id (PK)         │
│ email           │ ─────────┐
│ passwordHash    │          │
│ fullName        │          │
│ role            │◄─────────┼──────── Roles
│ status          │          │  (STUDENT/MENTOR/ADMIN)
│ bio             │          │
│ phone           │          │
│ city            │          │
│ country         │          │
│ avatarMediaId   │◄─────────┼──────── Media
│ isEmailVerified │          │  (File storage)
│ createdAt       │          │
│ updatedAt       │          │
└─────────────────┘          │
                             │
                    ┌────────┴─────────┐
                    │                  │
              ┌─────▼──────┐    ┌──────▼──────┐
              │    Roles   │    │  Permissions│
              ├────────────┤    ├─────────────┤
              │ id (PK)    │    │ id (PK)     │
              │ name       │    │ name        │
              │ description│    │ module      │
              └─────┬──────┘    └──────┬──────┘
                    │                  │
                    └────────┬─────────┘
                             │
                  ┌──────────▼──────────┐
                  │ RolePermissions     │
                  ├─────────────────────┤
                  │ role_id (FK)        │
                  │ permission_id (FK)  │
                  │ PRIMARY KEY         │
                  │ (role_id, perm_id)  │
                  └─────────────────────┘

Flow:
1. User has one Role (STUDENT, MENTOR, ADMIN)
2. Role has many Permissions (through junction table)
3. Each User has optional Avatar Media
4. Permissions are modules (Users, Posts, etc.) with actions
```

---

This document provides comprehensive visual reference for all backend flows and architecture.
