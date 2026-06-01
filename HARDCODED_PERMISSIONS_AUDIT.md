# Hardcoded Permissions Audit

## Summary
This document lists all hardcoded permissions found in the codebase that are referenced directly in route handlers, middleware calls, and service logic.

---

## 1. **Hardcoded Permission Strings in Routes**

### Community Routes (`backend/src/api/routes/community.ts`)

| Route | HTTP Method | Permission | Line |
|-------|-------------|-----------|------|
| `/posts/:id/approve` | POST | `MODERATE_COMMUNITY` | 32 |
| `/posts/:id/reject` | POST | `MODERATE_COMMUNITY` | 33 |
| `/comments/:id/approve` | POST | `MODERATE_COMMUNITY` | 34 |
| `/users/ban` | POST | `MANAGE_USERS` | 37 |
| `/users/unban` | POST | `MANAGE_USERS` | 38 |
| `/admin/categories` | POST | `MANAGE_COMMUNITY` | 42 |
| `/admin/categories/:id` | DELETE | `MANAGE_COMMUNITY` | 43 |
| `/admin/posts` | GET | `MODERATE_COMMUNITY` | 58 |
| `/admin/posts/:id/approve` | PUT | `MODERATE_COMMUNITY` | 59 |
| `/admin/posts/:id/decline` | PUT | `MODERATE_COMMUNITY` | 60 |
| `/admin/posts/:id` | DELETE | `MODERATE_COMMUNITY` | 61 |
| `/admin/posts/:postId/replies/:replyId` | DELETE | `MODERATE_COMMUNITY` | 62 |
| `/banned-users` | GET | `MANAGE_USERS` | 65 |

### Admin Routes (`backend/src/api/routes/admin.ts`)

| Route | HTTP Method | Permission | Line |
|-------|-------------|-----------|------|
| `/users` | GET | `VIEW_USERS` | 11 |
| `/users/:id` | GET | `VIEW_USERS` | 12 |
| `/users/:id` | PUT | `SUSPEND_USER` | 13 |
| `/users/:id/status` | PUT | `SUSPEND_USER` | 14 |
| `/users/:id` | DELETE | `SUSPEND_USER` | 15 |

### Newsletter Routes (`backend/src/api/routes/newsletters.ts`)

| Route | HTTP Method | Permission | Line |
|-------|-------------|-----------|------|
| `/admin/create` | POST | `MANAGE_NEWSLETTERS` | 29 |
| `/admin/list` | GET | `VIEW_NEWSLETTERS` | 30 |
| `/admin/:id` | GET | `VIEW_NEWSLETTERS` | 31 |
| `/admin/:id` | PUT | `MANAGE_NEWSLETTERS` | 32 |
| `/admin/:id/status` | PUT | `MANAGE_NEWSLETTERS` | 33 |
| `/admin/:id` | DELETE | `MANAGE_NEWSLETTERS` | 34 |

### Letters Routes (`backend/src/api/routes/letters.ts`)

| Route | HTTP Method | Permission | Line |
|-------|-------------|-----------|------|
| `/moderation/pending` | GET | `MODERATE_LETTERS` | 23 |
| `/:id/approve` | PUT | `MODERATE_LETTERS` | 24 |
| `/:id/reject` | PUT | `MODERATE_LETTERS` | 25 |
| `/:id` | DELETE | `MODERATE_LETTERS` | 26 |

---

## 2. **Hardcoded Role Names in Seed Data**

### Roles (`backend/src/db/seed.ts`)

| Role Name | Description | Line |
|-----------|-----------|------|
| `STUDENT` | Student user role - can post, comment, and view content | 26 |
| `MENTOR` | Mentor user role - can manage and moderate content | 30 |
| `ADMIN` | Administrator role - full system access | 34 |

### Default Roles in Role Service (`backend/src/api/services/rolesService.ts`)

**Deletion Prevention** (Line 524-530):
```typescript
if (["STUDENT", "MENTOR", "ADMIN"].includes(role.name)) {
  throw new AppError(...)
}
```

---

## 3. **Hardcoded Permission Names in Seed Data**

### Permissions Table (`backend/src/db/seed.ts`, Lines 47-89)

#### Post Permissions (Module: `posts`)
- `CREATE_POST`
- `EDIT_POST`
- `DELETE_POST`
- `APPROVE_POST`
- `REJECT_POST`
- `VIEW_POST`

#### Comment Permissions (Module: `comments`)
- `CREATE_COMMENT`
- `EDIT_COMMENT`
- `DELETE_COMMENT`
- `APPROVE_COMMENT`
- `REJECT_COMMENT`

#### Letter Permissions (Module: `letters`)
- `CREATE_LETTER`
- `PUBLISH_LETTER`
- `DELETE_LETTER`
- `APPROVE_LETTER`

#### Newsletter Permissions (Module: `newsletters`)
- `MANAGE_NEWSLETTERS`
- `VIEW_NEWSLETTERS`

#### User Management Permissions (Module: `users`)
- `BAN_USER`
- `UNBAN_USER`
- `SUSPEND_USER`
- `VIEW_USERS`

#### Moderation Permissions (Module: `moderation`)
- `FLAG_CONTENT`
- `REVIEW_FLAGS`
- `RESPOND_FEEDBACK`

#### System Permissions (Module: `system`)
- `MANAGE_ROLES`
- `MANAGE_PERMISSIONS`
- `MANAGE_SETTINGS`
- `VIEW_LOGS`

### Role-Permission Assignments (`backend/src/db/seed.ts`, Lines 108-138)

#### Student Permissions (Lines 109-120)
- `CREATE_POST`
- `EDIT_POST`
- `DELETE_POST`
- `VIEW_POST`
- `CREATE_COMMENT`
- `EDIT_COMMENT`
- `DELETE_COMMENT`
- `CREATE_LETTER`
- `DELETE_LETTER`
- `FLAG_CONTENT`

#### Mentor Permissions (Lines 123-135)
- All student permissions
- `APPROVE_POST`
- `REJECT_POST`
- `APPROVE_COMMENT`
- `REJECT_COMMENT`
- `APPROVE_LETTER`
- `PUBLISH_LETTER`
- `REVIEW_FLAGS`
- `RESPOND_FEEDBACK`
- `MANAGE_NEWSLETTERS`
- `VIEW_NEWSLETTERS`

#### Admin Permissions (Line 138)
- All permissions (entire `permMap`)

---

## 4. **Hardcoded Permission Strings NOT in Database**

The following permissions are used in route handlers but **NOT defined in seed.ts**:

| Permission | Location | Used In | Line |
|-----------|----------|---------|------|
| `MODERATE_COMMUNITY` | `community.ts` | Multiple routes | 32-65 |
| `MANAGE_USERS` | `community.ts` | Ban/unban users | 37-38 |
| `MANAGE_COMMUNITY` | `community.ts` | Category management | 42-43 |
| `MODERATE_LETTERS` | `letters.ts` | Letter moderation | 23-26 |

---

## 5. **Hardcoded Admin Email in Seed**

### Admin User Credentials (`backend/src/db/seed.ts`)

| Field | Value | Line |
|-------|-------|------|
| Email | `admin@gmail.com` | 349 |
| Password | `Test@1234` | 358 |
| Initial Role | `ADMIN` | 362 |
| Full Name | `Admin User` | 372 |
| Verified | `true` | 373 |

---

## ⚠️ **Critical Issues Found**

### Issue 1: Permission Mismatch ❌
**Routes use permissions that don't exist in the database:**
- `MODERATE_COMMUNITY` (used 6 times in community.ts)
- `MANAGE_USERS` (used 2 times in community.ts)
- `MANAGE_COMMUNITY` (used 2 times in community.ts)
- `MODERATE_LETTERS` (used 4 times in letters.ts)

**Expected permissions in seed.ts:**
- `APPROVE_POST`, `REJECT_POST` (instead of `MODERATE_COMMUNITY`)
- `BAN_USER`, `UNBAN_USER` (instead of `MANAGE_USERS`)
- No equivalent for `MANAGE_COMMUNITY`
- No equivalent for `MODERATE_LETTERS` (should be letter-related permissions)

### Issue 2: Inconsistent Permission Naming ⚠️
- Routes use high-level action names: `MODERATE_COMMUNITY`, `MANAGE_USERS`
- Database seed uses granular permission names: `CREATE_POST`, `EDIT_POST`, `APPROVE_POST`

### Issue 3: Missing Permission Definitions 🚨
These permissions must be added to seed.ts:
```
- MODERATE_COMMUNITY (module: moderation)
- MANAGE_USERS (module: users)
- MANAGE_COMMUNITY (module: moderation)
- MODERATE_LETTERS (module: letters)
```

---

## Summary Table: All Hardcoded Values

| Type | Count | Location |
|------|-------|----------|
| Hardcoded permission strings in routes | 4 unique | Routes (community, letters) |
| Hardcoded role names | 3 | seed.ts, rolesService.ts |
| Hardcoded permission names (seed) | 26 | seed.ts |
| Hardcoded admin credentials | 1 set | seed.ts |
| Missing permission definitions | 4 | Routes (not in database) |

---

## Recommendations

1. **Add missing permissions to seed.ts:**
   - `MODERATE_COMMUNITY` (for community post moderation)
   - `MANAGE_USERS` (for user management in community)
   - `MANAGE_COMMUNITY` (for community settings)
   - `MODERATE_LETTERS` (for letter moderation)

2. **Centralize permission constants:**
   - Create `src/constants/permissions.ts` with all permission names
   - Import and use from this file in routes and seed

3. **Extract admin credentials:**
   - Move to `.env` file or config
   - Change default password in production

4. **Create a permission audit service:**
   - Compare database permissions with route definitions
   - Alert on mismatches
