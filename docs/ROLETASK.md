# Dynamic Role & Permission System - Implementation Guide

**Document**: Comprehensive implementation plan for dynamic role and permission management
**Date**: May 21, 2026
**Status**: Planning Phase - Ready for Implementation
**Priority**: High - Enables scalable access control

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Current State Analysis](#current-state-analysis)
3. [Architecture & Design](#architecture--design)
4. [Implementation Phases](#implementation-phases)
5. [Code Changes Required](#code-changes-required)
6. [Testing Strategy](#testing-strategy)
7. [Migration Plan](#migration-plan)
8. [Timeline & Effort](#timeline--effort)

---

## Overview

### What is Dynamic Role & Permission System?

A system that allows administrators to:
- ✅ Create unlimited custom roles (not just STUDENT, MENTOR, ADMIN)
- ✅ Create unlimited custom permissions (not predefined)
- ✅ Dynamically assign/remove permissions from roles
- ✅ Enforce permissions at runtime (not hardcoded)
- ✅ No code redeployment needed for role/permission changes

### Current Capability

Your system is **80% ready** for this:

✅ **Already Dynamic**:
- `roles` table exists for storing unlimited roles
- `permissions` table exists for storing unlimited permissions
- `role_permissions` junction table for many-to-many relationship
- Backend API endpoints exist for role/permission CRUD
- Redux infrastructure exists for frontend management

❌ **Not Yet Dynamic**:
- `userRoleEnum` hardcodes 3 roles (STUDENT, MENTOR, ADMIN)
- Authorization middleware checks **roles**, not **permissions**
- Frontend hardcodes roles in dropdowns
- No permission checking utility function
- No admin UI to manage roles/permissions dynamically

### Why Make It Dynamic?

| Benefit | Impact |
|---------|--------|
| **Scalability** | Support different role structures for different use cases |
| **Flexibility** | Admins can create roles without developer intervention |
| **Enterprise Ready** | Multi-tenant support becomes possible |
| **Compliance** | Custom permission sets for regulatory requirements |
| **Future-Proof** | New permissions can be added without code changes |

---

## Current State Analysis

### Database Schema (What We Have)

```typescript
// roles table - stores role definitions
roles {
  id: integer (PK)
  name: varchar (UNIQUE) ← Currently enum: STUDENT, MENTOR, ADMIN
  description: text
  createdAt: timestamp
}

// permissions table - stores permission definitions
permissions {
  id: integer (PK)
  name: varchar (UNIQUE) ← e.g., "users.create", "posts.approve"
  description: text
  module: varchar ← e.g., "Users", "Posts", "Letters"
  createdAt: timestamp
}

// role_permissions junction table
role_permissions {
  id: uuid (PK)
  roleId: integer (FK → roles)
  permissionId: integer (FK → permissions)
  createdAt: timestamp
  UNIQUE(roleId, permissionId)
}

// users table - stores users with role assignment
users {
  id: uuid (PK)
  roleId: integer (FK → roles) ← Dynamic role assignment
  email: varchar
  ...
}
```

### Backend API Endpoints (What We Have)

✅ **Role Management Endpoints**:
```typescript
GET    /api/admin/roles              // List all roles with permissions
GET    /api/admin/roles/:id          // Get single role with permissions
POST   /api/admin/roles              // Create new role (exists but might be incomplete)
PUT    /api/admin/roles/:id          // Update role (may need implementation)
DELETE /api/admin/roles/:id          // Delete role (may need implementation)
```

✅ **Permission Management Endpoints**:
```typescript
GET    /api/admin/permissions                    // List all permissions
POST   /api/admin/permissions                    // Create permission
PUT    /api/admin/permissions/:id                // Update permission
DELETE /api/admin/permissions/:id                // Delete permission
POST   /api/admin/roles/:id/permissions          // Assign permission to role
DELETE /api/admin/roles/:id/permissions/:permId  // Remove permission from role
```

### Authorization Middleware (What We Have)

❌ **Problem - Role-Based Checking**:
```typescript
// Current approach (hardcoded role checking)
export const requireAdmin = (req, res, next) => {
  if (req.user.role !== "ADMIN") {
    throw new ForbiddenError("Admin access required");
  }
  next();
};

// ❌ Issues:
// 1. Hardcodes role strings
// 2. Doesn't check actual permissions
// 3. Not scalable to dynamic roles
// 4. Can't handle permission granularity
```

### Frontend State Management (What We Have)

✅ **Redux Infrastructure Exists**:
- `rolesSlice.ts` created with state for roles/permissions
- Async thunks exist for API calls
- Middleware chain already set up

❌ **Frontend Usage Gaps**:
- AdminRoles.tsx page exists but may not be wired to Redux
- No permission-checking hook for UI conditionals
- Role dropdowns may still be hardcoded enums

---

## Architecture & Design

### Ideal Flow: Dynamic Role/Permission System

```
┌─────────────────────────────────────────────────────────┐
│                 Admin Dashboard                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Role Management:                                       │
│  - Create "ContentModerator" role                      │
│  - Assign "posts.approve", "posts.reject" permissions │
│  - Assign to user                                      │
│                                                         │
│  Permission Management:                                │
│  - Create "letters.publish" permission                 │
│  - Create "letters.moderate" permission                │
│                                                         │
└──────────┬──────────────────────────────────────────────┘
           │
           ↓
┌──────────────────────────────────────────────────────────┐
│              Backend API Endpoints                       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  POST /api/admin/roles                                  │
│  PUT /api/admin/roles/:id                               │
│  DELETE /api/admin/roles/:id                            │
│  POST /api/admin/permissions                            │
│  POST /api/admin/roles/:id/permissions                  │
│                                                          │
└──────────┬───────────────────────────────────────────────┘
           │
           ↓
┌──────────────────────────────────────────────────────────┐
│           Database (Drizzle ORM)                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  roles:              { id, name, description }          │
│  permissions:        { id, name, module, description }  │
│  role_permissions:   { roleId, permissionId }           │
│  users:              { id, roleId, email, ... }         │
│                                                          │
└──────────┬───────────────────────────────────────────────┘
           │
           ↓
┌──────────────────────────────────────────────────────────┐
│      Authorization: Permission-Based Checking           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  User makes request with JWT token                      │
│    ↓                                                    │
│  Middleware decodes token, gets userId                 │
│    ↓                                                    │
│  Fetch user's role → get all permissions               │
│    ↓                                                    │
│  Check: does user have "posts.approve"?                │
│    ↓ YES                 ↓ NO                           │
│  Continue            Return 403 Forbidden              │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Permission Naming Convention

Follows `module.action` pattern:

```
Users Module:
  - users.create
  - users.read
  - users.update
  - users.delete
  - users.ban

Posts Module:
  - posts.create
  - posts.read
  - posts.approve
  - posts.reject
  - posts.delete

Letters Module:
  - letters.create
  - letters.submit
  - letters.approve
  - letters.reject
  - letters.delete
  - letters.moderate

Admin Module:
  - admin.manage_roles
  - admin.manage_permissions
  - admin.manage_users
  - admin.view_audit_logs
```

---

## Implementation Phases

### Phase 1: Backend Foundation (Days 1-2)

#### 1.1 Create Permission Checking Utility

**File**: `backend/src/utils/permissions.ts` (NEW)

```typescript
import { db } from "../db";
import { users, roles, permissions, rolePermissions } from "../db/schema";
import { eq } from "drizzle-orm";

/**
 * Check if user has a specific permission
 * @param userId - User ID to check
 * @param requiredPermission - Permission name (e.g., "users.create")
 * @returns boolean
 */
export async function userHasPermission(
  userId: string,
  requiredPermission: string
): Promise<boolean> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        role: {
          with: {
            permissions: {
              columns: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.role) {
      return false;
    }

    // Check if any permission matches
    return user.role.permissions.some(
      (perm) => perm.name === requiredPermission
    );
  } catch (error) {
    console.error("Error checking permission:", error);
    return false;
  }
}

/**
 * Get all permissions for a user
 * @param userId - User ID
 * @returns Array of permission names
 */
export async function getUserPermissions(
  userId: string
): Promise<string[]> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        role: {
          with: {
            permissions: {
              columns: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.role) {
      return [];
    }

    return user.role.permissions.map((perm) => perm.name);
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return [];
  }
}

/**
 * Check if user has any of the given permissions
 * @param userId - User ID
 * @param permissions - Array of permission names
 * @returns boolean
 */
export async function userHasAnyPermission(
  userId: string,
  permissions: string[]
): Promise<boolean> {
  const userPerms = await getUserPermissions(userId);
  return permissions.some((perm) => userPerms.includes(perm));
}

/**
 * Check if user has all of the given permissions
 * @param userId - User ID
 * @param permissions - Array of permission names
 * @returns boolean
 */
export async function userHasAllPermissions(
  userId: string,
  permissions: string[]
): Promise<boolean> {
  const userPerms = await getUserPermissions(userId);
  return permissions.every((perm) => userPerms.includes(perm));
}
```

#### 1.2 Create Permission Checking Middleware

**File**: `backend/src/middleware/permissions.ts` (NEW)

```typescript
import { Request, Response, NextFunction } from "express";
import { userHasPermission } from "../utils/permissions";
import { AppError } from "../utils/errors";

/**
 * Middleware to check if user has a specific permission
 * Usage: router.get("/endpoint", requirePermission("users.create"), handler)
 */
export function requirePermission(requiredPermission: string) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError("UNAUTHORIZED", "User not authenticated", 401);
      }

      const hasPermission = await userHasPermission(
        req.user.id,
        requiredPermission
      );

      if (!hasPermission) {
        throw new AppError(
          "FORBIDDEN",
          `Missing permission: ${requiredPermission}`,
          403,
          {
            required: requiredPermission,
          }
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to check if user has ANY of the given permissions
 * Usage: router.get("/endpoint", requireAnyPermission(["users.create", "users.admin"]), handler)
 */
export function requireAnyPermission(permissions: string[]) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError("UNAUTHORIZED", "User not authenticated", 401);
      }

      const userPerms = await getUserPermissions(req.user.id);
      const hasAny = permissions.some((perm) => userPerms.includes(perm));

      if (!hasAny) {
        throw new AppError(
          "FORBIDDEN",
          `Missing one of required permissions: ${permissions.join(", ")}`,
          403,
          {
            required: permissions,
          }
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to check if user has ALL of the given permissions
 * Usage: router.get("/endpoint", requireAllPermissions(["users.create", "users.approve"]), handler)
 */
export function requireAllPermissions(permissions: string[]) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError("UNAUTHORIZED", "User not authenticated", 401);
      }

      const userPerms = await getUserPermissions(req.user.id);
      const hasAll = permissions.every((perm) => userPerms.includes(perm));

      if (!hasAll) {
        throw new AppError(
          "FORBIDDEN",
          `Missing all required permissions: ${permissions.join(", ")}`,
          403,
          {
            required: permissions,
          }
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
```

#### 1.3 Update Authentication Middleware

**File**: `backend/src/middleware/auth.ts` (UPDATE)

Update to include user's permissions in JWT payload:

```typescript
export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1];

    if (!token) {
      throw new AppError("UNAUTHORIZED", "Missing authentication token", 401);
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Attach user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      roleId: decoded.roleId,
      role: decoded.role, // ← New: include role name
    };

    next();
  } catch (error) {
    const errorMessage = error instanceof jwt.JsonWebTokenError
      ? "Invalid token"
      : "Token verification failed";

    next(new AppError("UNAUTHORIZED", errorMessage, 401));
  }
}
```

#### 1.4 Update Schema - Make Roles Dynamic

**File**: `backend/src/db/schema.ts` (MODIFY)

Remove hardcoded enum constraint:

```typescript
// BEFORE (hardcoded roles)
export const roles = pgTable("roles", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: userRoleEnum("name").notNull().unique(), // ← Enum constraint
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// AFTER (dynamic roles)
export const roles = pgTable("roles", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 100 }).notNull().unique(), // ← String, no enum
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

**Note**: Keep `userRoleEnum` for other tables or remove completely if not needed.

#### 1.5 Add Relations to Schema

**File**: `backend/src/db/schema.ts` (ADD RELATIONS)

```typescript
// Relations for users
export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  authTokens: many(authTokens),
}));

// Relations for roles
export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
  permissions: many(rolePermissions),
}));

// Relations for permissions
export const permissionsRelations = relations(permissions, ({ many }) => ({
  roles: many(rolePermissions),
}));

// Relations for role_permissions
export const rolePermissionsRelations = relations(
  rolePermissions,
  ({ one }) => ({
    role: one(roles, {
      fields: [rolePermissions.roleId],
      references: [roles.id],
    }),
    permission: one(permissions, {
      fields: [rolePermissions.permissionId],
      references: [permissions.id],
    }),
  })
);
```

#### 1.6 Create Database Migration

```bash
npm run db:generate
npm run db:migrate
```

**Checklist**:
- [ ] Permission utility function created
- [ ] Permission middleware created
- [ ] Auth middleware updated
- [ ] Schema modified for dynamic roles
- [ ] Relations added to schema
- [ ] Migration generated and applied
- [ ] Test: Can fetch user with permissions

---

### Phase 2: Update Backend Routes (Days 2-3)

#### 2.1 Update Existing Routes to Use Permissions

**File**: `backend/src/api/routes/users.ts` (MODIFY)

Replace hardcoded role checks with permission checks:

```typescript
// BEFORE (role-based)
router.get(
  "/",
  authenticateToken,
  requireRole("ADMIN"),  // ❌ Old way
  getAllUsersController
);

// AFTER (permission-based)
router.get(
  "/",
  authenticateToken,
  requirePermission("users.read"),  // ✅ New way
  getAllUsersController
);
```

**Routes to Update**:
```typescript
// User Management
GET    /api/users                     → requirePermission("users.read")
POST   /api/users                     → requirePermission("users.create")
PUT    /api/users/:id                 → requirePermission("users.update")
DELETE /api/users/:id                 → requirePermission("users.delete")

// Post Management (Community)
GET    /api/community/posts           → requirePermission("posts.read")
POST   /api/community/posts           → requirePermission("posts.create")
PUT    /api/community/posts/:id       → requirePermission("posts.update")
DELETE /api/community/posts/:id       → requirePermission("posts.delete")

// Admin Moderation
PUT    /api/admin/posts/:id/approve   → requirePermission("posts.approve")
PUT    /api/admin/posts/:id/reject    → requirePermission("posts.reject")
POST   /api/admin/users/:id/ban       → requirePermission("users.ban")

// Letters
POST   /api/letters                   → requirePermission("letters.create")
PUT    /api/letters/:id/approve       → requirePermission("letters.approve")
PUT    /api/letters/:id/reject        → requirePermission("letters.reject")
```

#### 2.2 Complete Role Management Endpoints

**File**: `backend/src/api/routes/roles.ts` (ENSURE COMPLETE)

```typescript
import { Router } from "express";
import { requirePermission } from "../middleware/permissions";
import { authenticateToken } from "../middleware/auth";
import * as roleService from "../services/rolesService";

const router = Router();

// List all roles with permissions
router.get("/", authenticateToken, async (req, res, next) => {
  try {
    const roles = await roleService.getAllRolesWithPermissions();
    res.json(formatResponse(true, roles));
  } catch (error) {
    next(error);
  }
});

// Get single role
router.get("/:id", authenticateToken, async (req, res, next) => {
  try {
    const role = await roleService.getRoleWithPermissions(Number(req.params.id));
    res.json(formatResponse(true, role));
  } catch (error) {
    next(error);
  }
});

// Create new role
router.post(
  "/",
  authenticateToken,
  requirePermission("admin.manage_roles"),
  async (req, res, next) => {
    try {
      const { name, description } = req.body;
      const role = await roleService.createRole(name, description);
      res.status(201).json(formatResponse(true, role));
    } catch (error) {
      next(error);
    }
  }
);

// Update role
router.put(
  "/:id",
  authenticateToken,
  requirePermission("admin.manage_roles"),
  async (req, res, next) => {
    try {
      const { name, description } = req.body;
      const role = await roleService.updateRole(
        Number(req.params.id),
        name,
        description
      );
      res.json(formatResponse(true, role));
    } catch (error) {
      next(error);
    }
  }
);

// Delete role
router.delete(
  "/:id",
  authenticateToken,
  requirePermission("admin.manage_roles"),
  async (req, res, next) => {
    try {
      await roleService.deleteRole(Number(req.params.id));
      res.json(formatResponse(true, { message: "Role deleted" }));
    } catch (error) {
      next(error);
    }
  }
);

// Assign permission to role
router.post(
  "/:id/permissions",
  authenticateToken,
  requirePermission("admin.manage_roles"),
  async (req, res, next) => {
    try {
      const { permissionId } = req.body;
      const role = await roleService.assignPermissionToRole(
        Number(req.params.id),
        Number(permissionId)
      );
      res.json(formatResponse(true, role));
    } catch (error) {
      next(error);
    }
  }
);

// Remove permission from role
router.delete(
  "/:id/permissions/:permissionId",
  authenticateToken,
  requirePermission("admin.manage_roles"),
  async (req, res, next) => {
    try {
      const role = await roleService.removePermissionFromRole(
        Number(req.params.id),
        Number(req.params.permissionId)
      );
      res.json(formatResponse(true, role));
    } catch (error) {
      next(error);
    }
  }
);

export default router;
```

#### 2.3 Complete Permission Management Endpoints

**File**: `backend/src/api/routes/permissions.ts` (ENSURE COMPLETE)

```typescript
import { Router } from "express";
import { requirePermission } from "../middleware/permissions";
import { authenticateToken } from "../middleware/auth";
import * as permissionService from "../services/permissionsService";

const router = Router();

// List all permissions
router.get("/", authenticateToken, async (req, res, next) => {
  try {
    const { module } = req.query;
    const permissions = await permissionService.getAllPermissions(
      module as string | undefined
    );
    res.json(formatResponse(true, permissions));
  } catch (error) {
    next(error);
  }
});

// Get single permission
router.get("/:id", authenticateToken, async (req, res, next) => {
  try {
    const permission = await permissionService.getPermissionById(Number(req.params.id));
    res.json(formatResponse(true, permission));
  } catch (error) {
    next(error);
  }
});

// Create new permission
router.post(
  "/",
  authenticateToken,
  requirePermission("admin.manage_permissions"),
  async (req, res, next) => {
    try {
      const { name, description, module } = req.body;
      const permission = await permissionService.createPermission(
        name,
        description,
        module
      );
      res.status(201).json(formatResponse(true, permission));
    } catch (error) {
      next(error);
    }
  }
);

// Update permission
router.put(
  "/:id",
  authenticateToken,
  requirePermission("admin.manage_permissions"),
  async (req, res, next) => {
    try {
      const { name, description, module } = req.body;
      const permission = await permissionService.updatePermission(
        Number(req.params.id),
        name,
        description,
        module
      );
      res.json(formatResponse(true, permission));
    } catch (error) {
      next(error);
    }
  }
);

// Delete permission
router.delete(
  "/:id",
  authenticateToken,
  requirePermission("admin.manage_permissions"),
  async (req, res, next) => {
    try {
      await permissionService.deletePermission(Number(req.params.id));
      res.json(formatResponse(true, { message: "Permission deleted" }));
    } catch (error) {
      next(error);
    }
  }
);

export default router;
```

**Checklist**:
- [ ] All routes updated to use permission checks
- [ ] Role management endpoints completed
- [ ] Permission management endpoints completed
- [ ] Test: Can create new role
- [ ] Test: Can create new permission
- [ ] Test: Can assign permission to role

---

### Phase 3: Frontend Setup (Days 3-4)

#### 3.1 Update Redux Slice for Permissions

**File**: `client/src/store/slices/authSlice.ts` (MODIFY)

Add permissions to auth state:

```typescript
// In authSlice reducer
const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  error: null,
  permissions: [], // ← New
};

// Add reducer for setting permissions
setPermissions: (state, action) => {
  state.permissions = action.payload;
},

// Update login success reducer
signInSuccess: (state, action) => {
  state.user = action.payload.user;
  state.accessToken = action.payload.accessToken;
  state.refreshToken = action.payload.refreshToken;
  state.permissions = action.payload.permissions; // ← New
  state.error = null;
  state.isLoading = false;
},
```

#### 3.2 Create Permission Checking Hook

**File**: `client/src/hooks/usePermission.ts` (NEW)

```typescript
import { useSelector } from "react-redux";
import { RootState } from "../store";

/**
 * Hook to check if user has a specific permission
 * Usage: const canCreateUsers = usePermission("users.create");
 */
export function usePermission(requiredPermission: string): boolean {
  const permissions = useSelector(
    (state: RootState) => state.auth.permissions
  );
  return permissions.includes(requiredPermission);
}

/**
 * Hook to check if user has ANY of the given permissions
 * Usage: const canModerate = usePermission("posts.approve", "posts.reject");
 */
export function useAnyPermission(...permissions: string[]): boolean {
  const userPermissions = useSelector(
    (state: RootState) => state.auth.permissions
  );
  return permissions.some((perm) => userPermissions.includes(perm));
}

/**
 * Hook to check if user has ALL of the given permissions
 * Usage: const canManageRoles = useAllPermissions("admin.manage_roles", "admin.manage_permissions");
 */
export function useAllPermissions(...permissions: string[]): boolean {
  const userPermissions = useSelector(
    (state: RootState) => state.auth.permissions
  );
  return permissions.every((perm) => userPermissions.includes(perm));
}

/**
 * Hook to get all user permissions
 * Usage: const perms = useUserPermissions();
 */
export function useUserPermissions(): string[] {
  return useSelector((state: RootState) => state.auth.permissions);
}
```

#### 3.3 Create Permission-Protected Component

**File**: `client/src/components/common/PermissionGate.tsx` (NEW)

```typescript
import React from "react";
import { usePermission } from "../../hooks/usePermission";

interface PermissionGateProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component to conditionally render content based on permissions
 * Usage:
 * <PermissionGate permission="users.create">
 *   <CreateUserButton />
 * </PermissionGate>
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  permissions,
  requireAll = false,
  children,
  fallback = null,
}) => {
  const hasPermission = usePermission(permission || "");
  const userPermissions = useUserPermissions();

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission;
  } else if (permissions && permissions.length > 0) {
    if (requireAll) {
      hasAccess = permissions.every((p) => userPermissions.includes(p));
    } else {
      hasAccess = permissions.some((p) => userPermissions.includes(p));
    }
  }

  return <>{hasAccess ? children : fallback}</>;
};
```

#### 3.4 Update Login/Auth Flow to Include Permissions

**File**: `client/src/store/slices/authThunks.ts` (MODIFY)

Update thunks to fetch and store permissions:

```typescript
export const signIn = (
  email: string,
  password: string
): AppDispatch => async (dispatch) => {
  dispatch(credentialsStart());
  try {
    const response = await api.post("/api/auth/signin", {
      email,
      password,
    });

    // Assuming backend now returns permissions
    const { user, accessToken, refreshToken, permissions } = response.data.data;

    dispatch(
      credentialsSuccess({
        user,
        accessToken,
        refreshToken,
        permissions, // ← New
      })
    );

    toast.success("Signed in successfully");
  } catch (error) {
    dispatch(credentialsError(error.message));
    toast.error("Sign in failed");
  }
};
```

#### 3.5 Update Backend Auth Response

**File**: `backend/src/api/services/authService.ts` (MODIFY)

Include permissions in sign-in response:

```typescript
export async function signin(email: string, password: string) {
  // ... existing validation code ...

  // Fetch user with role and permissions
  const userWithRole = await db.query.users.findFirst({
    where: eq(users.email, email),
    with: {
      role: {
        with: {
          permissions: {
            columns: { name: true },
          },
        },
      },
    },
  });

  // ... password verification ...

  // Extract permission names
  const permissions = userWithRole.role?.permissions.map((p) => p.name) || [];

  // Generate tokens with permissions
  const accessToken = jwt.sign(
    {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      role: userWithRole.role.name,
      permissions, // ← New
    },
    JWT_SECRET,
    { expiresIn: "15m" }
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      role: userWithRole.role.name,
    },
    accessToken,
    refreshToken,
    permissions, // ← Return to frontend
  };
}
```

**Checklist**:
- [ ] Redux auth slice updated with permissions
- [ ] Permission checking hooks created
- [ ] PermissionGate component created
- [ ] Auth thunks updated
- [ ] Backend auth response includes permissions
- [ ] Test: Login returns permissions

---

### Phase 4: Frontend Admin UI (Days 4-5)

#### 4.1 Wire AdminRoles Page to Redux

**File**: `client/src/pages/admin/AdminRoles.tsx` (COMPLETE)

```typescript
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  assignPermissionToRole,
  removePermissionFromRole,
} from "../../store/slices/rolesSlice";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { toast } from "sonner";

export const AdminRoles: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { roles, permissions, isLoading } = useSelector(
    (state: RootState) => state.roles
  );

  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [selectedRole, setSelectedRole] = useState<number | null>(null);

  // Load roles and permissions on mount
  useEffect(() => {
    dispatch(getRoles());
  }, [dispatch]);

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      toast.error("Role name is required");
      return;
    }
    try {
      await dispatch(createRole(newRoleName, newRoleDesc)).unwrap();
      setNewRoleName("");
      setNewRoleDesc("");
      toast.success("Role created");
    } catch (error) {
      toast.error("Failed to create role");
    }
  };

  const handleAssignPermission = async (roleId: number, permId: number) => {
    try {
      await dispatch(
        assignPermissionToRole({ roleId, permissionId: permId })
      ).unwrap();
      toast.success("Permission assigned");
    } catch (error) {
      toast.error("Failed to assign permission");
    }
  };

  // ... rest of component
};
```

#### 4.2 Create Role Management Components

**File**: `client/src/components/admin/RoleForm.tsx` (NEW)

```typescript
import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

interface RoleFormProps {
  onSubmit: (name: string, description: string) => Promise<void>;
  isLoading?: boolean;
}

export const RoleForm: React.FC<RoleFormProps> = ({
  onSubmit,
  isLoading = false,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      await onSubmit(name, description);
      setName("");
      setDescription("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        placeholder="Role name (e.g., ContentModerator)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={isLoading}
      />
      <Textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={isLoading}
      />
      <Button type="submit" disabled={isLoading || !name.trim()}>
        Create Role
      </Button>
    </form>
  );
};
```

**File**: `client/src/components/admin/PermissionAssigner.tsx` (NEW)

```typescript
import React from "react";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";

interface PermissionAssignerProps {
  roleId: number;
  allPermissions: Array<{ id: number; name: string; module: string }>;
  assignedPermissions: number[];
  onAssign: (roleId: number, permId: number) => Promise<void>;
  onRemove: (roleId: number, permId: number) => Promise<void>;
  isLoading?: boolean;
}

export const PermissionAssigner: React.FC<PermissionAssignerProps> = ({
  roleId,
  allPermissions,
  assignedPermissions,
  onAssign,
  onRemove,
  isLoading = false,
}) => {
  const handleToggle = async (permId: number, isAssigned: boolean) => {
    try {
      if (isAssigned) {
        await onRemove(roleId, permId);
      } else {
        await onAssign(roleId, permId);
      }
    } catch (error) {
      console.error("Failed to update permission");
    }
  };

  // Group by module
  const groupedByModule = allPermissions.reduce(
    (acc, perm) => {
      if (!acc[perm.module]) {
        acc[perm.module] = [];
      }
      acc[perm.module].push(perm);
      return acc;
    },
    {} as Record<string, typeof allPermissions>
  );

  return (
    <div className="space-y-4">
      {Object.entries(groupedByModule).map(([module, perms]) => (
        <div key={module} className="border rounded p-4">
          <h4 className="font-semibold mb-3">{module}</h4>
          <div className="space-y-2">
            {perms.map((perm) => (
              <label
                key={perm.id}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <Checkbox
                  checked={assignedPermissions.includes(perm.id)}
                  onCheckedChange={() =>
                    handleToggle(perm.id, assignedPermissions.includes(perm.id))
                  }
                  disabled={isLoading}
                />
                <span className="text-sm">{perm.name}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
```

**Checklist**:
- [ ] AdminRoles page wired to Redux
- [ ] Role creation form implemented
- [ ] Role list display implemented
- [ ] Permission assigner component created
- [ ] Test: Can create role from UI
- [ ] Test: Can assign permissions to role
- [ ] Test: Can remove permissions from role

---

### Phase 5: Seed Data & Defaults (Day 5)

#### 5.1 Create Seed Data with Default Roles & Permissions

**File**: `backend/src/db/seed.ts` (NEW/UPDATE)

```typescript
import { db } from "./index";
import { roles, permissions, rolePermissions } from "./schema";

export async function seedRoles() {
  // Create default roles
  const defaultRoles = [
    { name: "STUDENT", description: "Student role with limited permissions" },
    { name: "MENTOR", description: "Mentor role with teaching permissions" },
    { name: "ADMIN", description: "Administrator with full permissions" },
  ];

  for (const role of defaultRoles) {
    await db
      .insert(roles)
      .values(role)
      .onConflictDoNothing();
  }
}

export async function seedPermissions() {
  // User management permissions
  const userPerms = [
    { name: "users.read", module: "Users", description: "View users" },
    { name: "users.create", module: "Users", description: "Create new user" },
    { name: "users.update", module: "Users", description: "Update user" },
    { name: "users.delete", module: "Users", description: "Delete user" },
    { name: "users.ban", module: "Users", description: "Ban user" },
  ];

  // Post management permissions
  const postPerms = [
    { name: "posts.read", module: "Posts", description: "View posts" },
    { name: "posts.create", module: "Posts", description: "Create post" },
    { name: "posts.update", module: "Posts", description: "Edit post" },
    { name: "posts.delete", module: "Posts", description: "Delete post" },
    { name: "posts.approve", module: "Posts", description: "Approve post" },
    { name: "posts.reject", module: "Posts", description: "Reject post" },
  ];

  // Letter permissions
  const letterPerms = [
    { name: "letters.read", module: "Letters", description: "View letters" },
    { name: "letters.create", module: "Letters", description: "Create letter" },
    { name: "letters.submit", module: "Letters", description: "Submit letter" },
    { name: "letters.approve", module: "Letters", description: "Approve letter" },
    { name: "letters.reject", module: "Letters", description: "Reject letter" },
    { name: "letters.delete", module: "Letters", description: "Delete letter" },
  ];

  // Admin permissions
  const adminPerms = [
    { name: "admin.manage_roles", module: "Admin", description: "Manage roles" },
    { name: "admin.manage_permissions", module: "Admin", description: "Manage permissions" },
    { name: "admin.view_audit_logs", module: "Admin", description: "View audit logs" },
  ];

  const allPermissions = [
    ...userPerms,
    ...postPerms,
    ...letterPerms,
    ...adminPerms,
  ];

  for (const perm of allPermissions) {
    await db
      .insert(permissions)
      .values(perm)
      .onConflictDoNothing();
  }
}

export async function seedRolePermissions() {
  // Get role and permission IDs
  const studentRole = await db.query.roles.findFirst({
    where: (roles, { eq }) => eq(roles.name, "STUDENT"),
  });

  const mentorRole = await db.query.roles.findFirst({
    where: (roles, { eq }) => eq(roles.name, "MENTOR"),
  });

  const adminRole = await db.query.roles.findFirst({
    where: (roles, { eq }) => eq(roles.name, "ADMIN"),
  });

  // STUDENT permissions
  if (studentRole) {
    const studentPerms = await db.query.permissions.findMany({
      where: (perms, { inArray }) =>
        inArray(perms.name, [
          "posts.read",
          "posts.create",
          "letters.read",
          "letters.create",
          "letters.submit",
        ]),
    });

    for (const perm of studentPerms) {
      await db
        .insert(rolePermissions)
        .values({
          roleId: studentRole.id,
          permissionId: perm.id,
        })
        .onConflictDoNothing();
    }
  }

  // MENTOR permissions
  if (mentorRole) {
    const mentorPerms = await db.query.permissions.findMany({
      where: (perms, { inArray }) =>
        inArray(perms.name, [
          "posts.read",
          "posts.create",
          "posts.approve",
          "letters.read",
          "letters.create",
          "letters.submit",
          "letters.approve",
        ]),
    });

    for (const perm of mentorPerms) {
      await db
        .insert(rolePermissions)
        .values({
          roleId: mentorRole.id,
          permissionId: perm.id,
        })
        .onConflictDoNothing();
    }
  }

  // ADMIN permissions (all)
  if (adminRole) {
    const allPerms = await db.query.permissions.findMany();

    for (const perm of allPerms) {
      await db
        .insert(rolePermissions)
        .values({
          roleId: adminRole.id,
          permissionId: perm.id,
        })
        .onConflictDoNothing();
    }
  }
}

export async function runSeed() {
  try {
    console.log("Seeding roles...");
    await seedRoles();

    console.log("Seeding permissions...");
    await seedPermissions();

    console.log("Seeding role permissions...");
    await seedRolePermissions();

    console.log("Seed complete!");
  } catch (error) {
    console.error("Seed failed:", error);
    throw error;
  }
}
```

**Run seed**:
```bash
npm run db:seed
```

**Checklist**:
- [ ] Seed file created with all default roles
- [ ] Seed file created with all default permissions
- [ ] Seed file assigns permissions to default roles
- [ ] Run seed successfully
- [ ] Verify in database: roles, permissions, role_permissions populated

---

## Testing Strategy

### Phase 6: Testing & Validation (Days 5-6)

#### 6.1 Backend Tests

```bash
# Test 1: Permission checking utility
npm test -- permissions.test.ts

# Test 2: Permission middleware
npm test -- permissionMiddleware.test.ts

# Test 3: Role CRUD endpoints
npm test -- roles.integration.test.ts

# Test 4: Permission enforcement
npm test -- authorization.integration.test.ts
```

#### 6.2 Frontend Tests

```bash
# Test 1: Permission hooks
npm test -- usePermission.test.ts

# Test 2: PermissionGate component
npm test -- PermissionGate.test.tsx

# Test 3: Role Redux slice
npm test -- rolesSlice.test.ts
```

#### 6.3 E2E Tests

```gherkin
Feature: Dynamic Role Management

  Scenario: Admin creates new role
    Given I am logged in as admin
    When I create a new role "ContentModerator"
    And I assign permissions ["posts.approve", "posts.reject"]
    Then the role should exist in the database
    And users assigned this role should have those permissions

  Scenario: Permission enforcement
    Given user has role "STUDENT" without "users.delete" permission
    When I try to call DELETE /api/users/:id
    Then I should get 403 Forbidden
    And error message should mention missing permission

  Scenario: Dynamic permission update
    Given role "STUDENT" has ["posts.read"]
    When I assign "posts.create" permission
    Then students should immediately be able to create posts
```

---

## Migration Plan

### How to Safely Migrate Existing System

#### Step 1: Backup Database
```bash
pg_dump -U postgres plane_and_prop > backup.sql
```

#### Step 2: Create Migration
```bash
# Your existing roles/permissions stay, just change the schema
npm run db:generate
npm run db:migrate
```

#### Step 3: Run Seed (Careful!)
```bash
# Option A: Only create missing permissions
npm run db:seed:permissions-only

# Option B: Full seed (backup first!)
npm run db:seed
```

#### Step 4: Verify Data
```sql
SELECT * FROM roles;
SELECT * FROM permissions;
SELECT COUNT(*) FROM role_permissions;
```

#### Step 5: Deploy Changes
```bash
# 1. Deploy backend with new middleware
npm run build
npm run start

# 2. Deploy frontend
npm run build
npm start
```

#### Step 6: Validate
```bash
# 1. Test login - should return permissions
# 2. Test permission checks - should allow/deny correctly
# 3. Test UI - should show/hide based on permissions
```

**Rollback if needed**:
```bash
psql -U postgres plane_and_prop < backup.sql
```

---

## Timeline & Effort

### Day-by-Day Breakdown

| Day | Phase | Tasks | Hours | Status |
|-----|-------|-------|-------|--------|
| 1 | Backend Foundation | Permission utils, middleware, schema | 6-8 | 🚀 Start |
| 2 | Backend Foundation | Relations, migrations | 3-4 | ⏳ Continue |
| 2 | Backend Routes | Update routes to use permissions | 4-5 | ⏳ Continue |
| 3 | Backend Routes | Complete role/permission endpoints | 3-4 | ⏳ Continue |
| 3 | Frontend Setup | Redux, hooks, auth flow | 5-6 | ⏳ Continue |
| 4 | Frontend Admin | AdminRoles page, components | 5-6 | ⏳ Continue |
| 5 | Frontend Admin | Permission assigner, testing | 4-5 | ⏳ Continue |
| 5 | Seed Data | Create seed with defaults | 2-3 | ⏳ Continue |
| 6 | Testing | Backend + Frontend tests | 6-8 | ⏳ Continue |
| 6 | Migration | Deploy and validate | 3-4 | ⏳ Final |
| **Total** | | | **42-48 hours** | |

### Realistic Schedule

**Solo Developer**: 1-2 weeks (part-time)
**2 Developers**: 3-4 days (parallel work)
**Team (Backend + Frontend)**: 2-3 days (concurrent)

---

## Success Criteria

### ✅ Backend Complete When:
- [ ] Permission utility functions working
- [ ] Permission middleware enforcing checks
- [ ] All routes updated to use permissions
- [ ] Role CRUD endpoints complete
- [ ] Permission CRUD endpoints complete
- [ ] Can create custom roles dynamically
- [ ] Can create custom permissions dynamically
- [ ] Can assign/remove permissions from roles

### ✅ Frontend Complete When:
- [ ] Redux slice managing roles/permissions
- [ ] Permission hooks working (usePermission, etc.)
- [ ] PermissionGate component rendering correctly
- [ ] AdminRoles page fully functional
- [ ] Can create roles from UI
- [ ] Can assign permissions from UI
- [ ] Login includes permissions
- [ ] UI hides/shows features based on permissions

### ✅ Testing Complete When:
- [ ] All backend tests passing
- [ ] All frontend tests passing
- [ ] E2E tests validating flows
- [ ] Manual testing confirms behavior
- [ ] Permission enforcement verified

### ✅ Production Ready When:
- [ ] Migration completed successfully
- [ ] Zero permission bypass exploits
- [ ] Performance validated (permission checks < 50ms)
- [ ] Audit logging captures role/permission changes
- [ ] Documentation updated
- [ ] Team trained on new system

---

## Key Implementation Notes

### 1. Backward Compatibility
- Keep default STUDENT, MENTOR, ADMIN roles in seed data
- Existing users automatically get default permissions
- No breaking changes to existing API

### 2. Performance
- Cache user permissions in JWT token
- Reduce database queries for permission checks
- Monitor query performance during migration

### 3. Security
- Always check permissions on backend (never trust frontend)
- Use permission names (strings), not IDs, for business logic
- Log all role/permission changes for audit trail

### 4. Best Practices
- Use clear, consistent permission naming (module.action)
- Organize permissions by feature module
- Document all custom roles created
- Regular audit of role/permission assignments

---

## Common Pitfalls to Avoid

❌ **Don't**:
1. Check permissions only on frontend (bypass-able)
2. Use permission IDs in business logic (fragile)
3. Hardcode permission lists in code
4. Forget to update seed data with new permissions
5. Deploy without testing permission enforcement

✅ **Do**:
1. Always check permissions on backend
2. Use permission names (strings) in code
3. Store permission definitions in database
4. Test permission changes thoroughly
5. Have rollback plan ready

---

## Questions & Support

**Q: Can I have nested roles (role inheritance)?**
A: Not in this design. Workaround: Create role with combined permissions.

**Q: How do I handle temporary permission grants?**
A: Add `expiresAt` column to role_permissions table (future enhancement).

**Q: Can users have multiple roles?**
A: Current design: 1 role per user. Enhancement needed for multi-role support.

**Q: What about permission delegation?**
A: Users can only create/assign permissions they themselves have `admin.manage_permissions`.

---

## Next Steps

1. **Review this document** with your team
2. **Create a GitHub issue** with checklist for tracking
3. **Start Phase 1** - Create permission utilities
4. **Daily standup** - Track progress against checklist
5. **Deploy to staging** - Test before production

---

**Document Version**: 1.0
**Last Updated**: May 21, 2026
**Status**: 🟢 Ready for Implementation
**Next Review**: After Phase 1 Completion

---

**Start implementing! You've got this! 🚀**
