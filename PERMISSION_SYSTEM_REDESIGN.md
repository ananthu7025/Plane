# Permission System Redesign Plan

**Date**: May 29, 2026
**Status**: 🟠 DESIGN PHASE
**Effort**: ~2-3 weeks implementation (51-65 hours total, ~20-25 hours Phase 4 redesign)

---

## Executive Summary

**Current State**:
- ✅ 32 permissions defined across 7 modules
- ✅ 3 roles (ADMIN, MENTOR, STUDENT) implemented
- ❌ 49% of endpoints (39/90) have permission checks
- ❌ 51% of endpoints (41/90) lack permission enforcement
- ❌ 13 permissions defined but unused
- ❌ Frontend/Backend permission name mismatches
- ❌ No ownership verification (delete/edit any user's content)
- ❌ Admin endpoints accessible to any authenticated user
- ❌ 4 permissions used in routes but missing from database

**Redesign Goals**:
1. ✅ Fix all permission name mismatches (frontend ↔ backend)
2. ✅ Add permission checks to all 41 unprotected endpoints
3. ✅ Implement granular ownership verification
4. ✅ Consolidate 13 unused permissions (merge or remove)
5. ✅ Create permission assignment matrix for all 3 roles
6. ✅ Add module-level permission grouping for clarity

---

## Part 1: Current Permissions Inventory

### All 32 Permissions by Module

#### 1️⃣ Posts (6 permissions)
- `CREATE_POST` ✅ Checked: community routes
- `EDIT_POST` ❌ Never checked (missing enforcement)
- `DELETE_POST` ❌ Never checked
- `APPROVE_POST` ✅ Checked: community admin routes
- `REJECT_POST` ✅ Checked: community admin routes
- `VIEW_POST` ✅ Checked: community routes

#### 2️⃣ Comments (5 permissions)
- `CREATE_COMMENT` ❌ Never checked
- `EDIT_COMMENT` ❌ Never checked
- `DELETE_COMMENT` ❌ Never checked
- `APPROVE_COMMENT` ✅ Checked: community admin routes
- `REJECT_COMMENT` ✅ Checked: community admin routes

#### 3️⃣ Letters (4 permissions)
- `CREATE_LETTER` ✅ Checked: letter routes
- `PUBLISH_LETTER` ✅ Checked: letter routes
- `DELETE_LETTER` ✅ Checked: letter routes
- `APPROVE_LETTER` ✅ Checked: letter routes

#### 4️⃣ Newsletters (2 permissions)
- `MANAGE_NEWSLETTERS` ✅ Checked: newsletter admin
- `VIEW_NEWSLETTERS` ✅ Checked: newsletter routes

#### 5️⃣ User Management (5 permissions)
- `BAN_USER` ❌ Never checked (routes use MANAGE_USERS)
- `UNBAN_USER` ❌ Never checked (routes use MANAGE_USERS)
- `SUSPEND_USER` ✅ Checked: user management routes
- `VIEW_USERS` ✅ Checked: user routes
- `MANAGE_USERS` ✅ Checked: community moderation

#### 6️⃣ Moderation (3 permissions)
- `FLAG_CONTENT` ❌ Never checked (no route implements it)
- `REVIEW_FLAGS` ❌ Never checked
- `RESPOND_FEEDBACK` ❌ Never checked

#### 7️⃣ System/Admin (7 permissions)
- `MANAGE_ROLES` ✅ Checked via adminMiddleware (hardcoded)
- `MANAGE_PERMISSIONS` ✅ Checked via adminMiddleware (hardcoded)
- `MANAGE_SETTINGS` ❌ Never checked (no routes)
- `VIEW_LOGS` ❌ Never checked (no routes)
- `MODERATE_COMMUNITY` ⚠️ Used in routes but missing from DB
- `MANAGE_COMMUNITY` ⚠️ Used in routes but missing from DB
- `MODERATE_LETTERS` ⚠️ Used in routes but missing from DB

### Summary
| Status | Count | Permissions |
|--------|-------|-------------|
| ✅ Checked & Enforced | 14 | APPROVE_POST, REJECT_POST, CREATE_POST, VIEW_POST, APPROVE_COMMENT, REJECT_COMMENT, CREATE_LETTER, PUBLISH_LETTER, DELETE_LETTER, APPROVE_LETTER, MANAGE_NEWSLETTERS, VIEW_NEWSLETTERS, SUSPEND_USER, VIEW_USERS |
| ✅ Partially Checked (hardcoded role) | 2 | MANAGE_ROLES, MANAGE_PERMISSIONS |
| ❌ Never Checked | 13 | EDIT_POST, DELETE_POST, CREATE_COMMENT, EDIT_COMMENT, DELETE_COMMENT, BAN_USER, UNBAN_USER, FLAG_CONTENT, REVIEW_FLAGS, RESPOND_FEEDBACK, MANAGE_SETTINGS, VIEW_LOGS, MANAGE_USERS |
| ⚠️ Used but Missing from DB | 3 | MODERATE_COMMUNITY, MANAGE_COMMUNITY, MODERATE_LETTERS |

---

## Part 2: Redesigned Permission Structure

### New Permission Organization (Consolidated)

#### Core Content Permissions (18 total)
```typescript
// Posts (6)
CREATE_POST              // Create new post
EDIT_OWN_POST            // Edit own post (NEW - granular)
DELETE_OWN_POST          // Delete own post (NEW - granular)
MODERATE_POSTS           // Approve/reject/edit any post (RENAMED from APPROVE_POST)
PUBLISH_POST             // Publish post (implicit with CREATE_POST)

// Comments (5)
CREATE_COMMENT           // Create new comment
EDIT_OWN_COMMENT         // Edit own comment (NEW - granular)
DELETE_OWN_COMMENT       // Delete own comment (NEW - granular)
MODERATE_COMMENTS        // Approve/reject/edit any comment (RENAMED from APPROVE_COMMENT)

// Letters (4)
CREATE_LETTER            // Create/submit letter
EDIT_OWN_LETTER          // Edit own letter (NEW - granular)
DELETE_OWN_LETTER        // Delete own letter (NEW - granular)
MODERATE_LETTERS         // Approve/reject/edit any letter (NEW - consolidates APPROVE_LETTER)

// Newsletters (2)
MANAGE_NEWSLETTERS       // Upload/edit/delete newsletters
VIEW_NEWSLETTERS         // View full newsletter content
```

#### User Management Permissions (6 total)
```typescript
MANAGE_USERS             // Ban, unban, suspend users (CONSOLIDATED from BAN_USER, UNBAN_USER, SUSPEND_USER)
VIEW_USERS               // View user list and details
MANAGE_PROFILES          // Edit user profiles
MANAGE_ROLES             // Create/edit/delete roles
MANAGE_PERMISSIONS       // Assign permissions to roles
```

#### Community Moderation Permissions (4 total)
```typescript
MANAGE_COMMUNITY         // Manage categories, settings
MODERATE_COMMUNITY       // Ban users, remove content from community
FLAG_CONTENT             // Flag/report content
REVIEW_FLAGS             // Review flagged content, take action
```

#### System Permissions (2 total)
```typescript
MANAGE_SETTINGS          // Edit platform settings
VIEW_LOGS                // View system logs and audit trail
```

### Final Count: **30 permissions** (down from 32)
- Removed: `REJECT_POST`, `REJECT_COMMENT`, `RESPOND_FEEDBACK` (redundant with MODERATE_*)
- Added: `EDIT_OWN_POST`, `DELETE_OWN_POST`, `EDIT_OWN_COMMENT`, `DELETE_OWN_COMMENT`, `EDIT_OWN_LETTER`, `DELETE_OWN_LETTER` (granular ownership)
- Consolidated: `BAN_USER` + `UNBAN_USER` → `MANAGE_USERS` | `APPROVE_POST` + `APPROVE_COMMENT` → `MODERATE_POSTS` + `MODERATE_COMMENTS`

---

## Part 3: Role-Permission Matrix (Redesigned)

### STUDENT Role
```typescript
[
  // Content Creation
  "CREATE_POST",
  "CREATE_COMMENT",
  "CREATE_LETTER",

  // Own Content Editing
  "EDIT_OWN_POST",
  "EDIT_OWN_COMMENT",
  "EDIT_OWN_LETTER",
  "DELETE_OWN_POST",
  "DELETE_OWN_COMMENT",
  "DELETE_OWN_LETTER",

  // Reading
  "VIEW_NEWSLETTERS",
  "VIEW_USERS",

  // Engagement
  "FLAG_CONTENT",  // Can report/flag content
]
```

### MENTOR Role (+ all STUDENT permissions)
```typescript
[
  // All STUDENT permissions +

  // Moderation
  "MODERATE_POSTS",
  "MODERATE_COMMENTS",
  "MODERATE_LETTERS",

  // Community Management
  "MANAGE_COMMUNITY",
  "MANAGE_USERS",

  // Newsletters
  "MANAGE_NEWSLETTERS",

  // User Management
  "VIEW_USERS",
  "MANAGE_PROFILES",

  // Content Review
  "REVIEW_FLAGS",
]
```

### ADMIN Role (all permissions)
```typescript
[
  // All MENTOR permissions +

  // System Administration
  "MANAGE_ROLES",
  "MANAGE_PERMISSIONS",
  "MANAGE_SETTINGS",
  "VIEW_LOGS",
]
```

### Permission Summary by Role

| Permission | STUDENT | MENTOR | ADMIN |
|-----------|---------|--------|-------|
| **Content Creation** |
| CREATE_POST | ✅ | ✅ | ✅ |
| CREATE_COMMENT | ✅ | ✅ | ✅ |
| CREATE_LETTER | ✅ | ✅ | ✅ |
| **Own Content** |
| EDIT_OWN_POST | ✅ | ✅ | ✅ |
| EDIT_OWN_COMMENT | ✅ | ✅ | ✅ |
| EDIT_OWN_LETTER | ✅ | ✅ | ✅ |
| DELETE_OWN_POST | ✅ | ✅ | ✅ |
| DELETE_OWN_COMMENT | ✅ | ✅ | ✅ |
| DELETE_OWN_LETTER | ✅ | ✅ | ✅ |
| **Moderation** |
| MODERATE_POSTS | | ✅ | ✅ |
| MODERATE_COMMENTS | | ✅ | ✅ |
| MODERATE_LETTERS | | ✅ | ✅ |
| **User Management** |
| MANAGE_USERS | | ✅ | ✅ |
| MANAGE_PROFILES | | ✅ | ✅ |
| VIEW_USERS | ✅ | ✅ | ✅ |
| MANAGE_ROLES | | | ✅ |
| MANAGE_PERMISSIONS | | | ✅ |
| **Community** |
| MANAGE_COMMUNITY | | ✅ | ✅ |
| **Newsletters** |
| MANAGE_NEWSLETTERS | | ✅ | ✅ |
| VIEW_NEWSLETTERS | ✅ | ✅ | ✅ |
| **Moderation/Flags** |
| FLAG_CONTENT | ✅ | ✅ | ✅ |
| REVIEW_FLAGS | | ✅ | ✅ |
| **System** |
| MANAGE_SETTINGS | | | ✅ |
| VIEW_LOGS | | | ✅ |

---

## Part 4: Implementation Roadmap

### Phase 1: Database & Backend (Week 1-2, ~15-18 hours)
- [ ] Update permissions.ts constants (30 permissions)
- [ ] Update backend/src/lib/permissions.ts
- [ ] Update seed.ts with new permission assignments
- [ ] Run database migration
- [ ] Update Zod schemas for validation

### Phase 2: Permission Enforcement (Week 2-3, ~12-15 hours)
- [ ] Add permission checks to 41 unprotected endpoints
- [ ] Implement ownership verification middleware
- [ ] Update all 60+ routes with proper decorators
- [ ] Add unit tests for permission checks

### Phase 3: Frontend Alignment (Week 3, ~5-8 hours)
- [ ] Update frontend permissions.ts (30 permissions)
- [ ] Update all PermissionGate components
- [ ] Update admin UI condition checks
- [ ] Test all permission flows

### Phase 4: Testing & Documentation (Week 4, ~5-7 hours)
- [ ] E2E permission tests (all 30 × 3 roles = 90 scenarios)
- [ ] Permission matrix validation
- [ ] Documentation update
- [ ] Audit & sign-off

---

## Part 5: Critical Fixes (Do First - ~2 hours)

### 1. Fix Permission Name Mismatches
**Problem**: Frontend says `APPROVE_POST`, backend checks `MODERATE_POSTS`

**Solution**:
- Frontend: Use consolidated permission names
- Backend: Update requirePermission() checks
- Database: Ensure all permissions exist

### 2. Fix Missing DB Permissions
**Problem**: Routes hardcode permissions that don't exist in database

**Solution**:
```sql
INSERT INTO permissions (name, module, description) VALUES
('MODERATE_POSTS', 'community', 'Can moderate community posts'),
('MODERATE_COMMENTS', 'community', 'Can moderate community comments'),
('MODERATE_LETTERS', 'letters', 'Can moderate student letters'),
('EDIT_OWN_POST', 'community', 'Can edit own posts'),
('DELETE_OWN_POST', 'community', 'Can delete own posts'),
('EDIT_OWN_COMMENT', 'community', 'Can edit own comments'),
('DELETE_OWN_COMMENT', 'community', 'Can delete own comments'),
('EDIT_OWN_LETTER', 'letters', 'Can edit own letters'),
('DELETE_OWN_LETTER', 'letters', 'Can delete own letters');
```

### 3. Add Ownership Verification Middleware
**Problem**: Users can delete/edit any content, not just their own

**Solution**: Create middleware:
```typescript
// src/middleware/ownership.ts
export const requireOwnership = (resourceField = 'id') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const resourceId = req.params[resourceField];
    const userId = req.userId;

    const resource = await db.query.findById(resourceId);
    if (resource.userId !== userId && !hasPermission(req, `MODERATE_${resource.type}`)) {
      throw new ForbiddenError("You can only modify your own content");
    }
    next();
  };
};
```

### 4. Close Public Access to Admin Endpoints
**Problem**: `/letters/admin/stats` accessible to any authenticated user

**Solution**:
```typescript
// Before
router.get("/admin/stats", authMiddleware, ...);

// After
router.get("/admin/stats", authMiddleware, requirePermission("MODERATE_LETTERS"), ...);
```

---

## Part 6: Endpoints Needing Protection (41 total)

### Community Posts (12)
- ❌ POST /api/community/posts (CREATE_POST)
- ❌ PUT /api/community/posts/:id (EDIT_OWN_POST or MODERATE_POSTS)
- ❌ DELETE /api/community/posts/:id (DELETE_OWN_POST or MODERATE_POSTS)
- ❌ POST /api/community/posts/:id/like (implicit - CREATE_POST permission)
- ✅ PUT /api/community/admin/posts/:id/approve (MODERATE_POSTS)
- ✅ PUT /api/community/admin/posts/:id/reject (MODERATE_POSTS)
- ❌ GET /api/community/categories (no permission needed - public)
- ❌ POST /api/community/categories (MANAGE_COMMUNITY)
- ❌ PUT /api/community/categories/:id (MANAGE_COMMUNITY)
- ❌ DELETE /api/community/categories/:id (MANAGE_COMMUNITY)

### Community Comments (10)
- ❌ POST /api/community/posts/:id/comments (CREATE_COMMENT)
- ❌ PUT /api/community/comments/:id (EDIT_OWN_COMMENT or MODERATE_COMMENTS)
- ❌ DELETE /api/community/comments/:id (DELETE_OWN_COMMENT or MODERATE_COMMENTS)
- ❌ POST /api/community/comments/:id/like (implicit - CREATE_COMMENT)
- ✅ PUT /api/community/admin/comments/:id/approve (MODERATE_COMMENTS)
- ✅ PUT /api/community/admin/comments/:id/reject (MODERATE_COMMENTS)
- ❌ POST /api/community/admin/users/:id/ban (MANAGE_USERS)
- ❌ POST /api/community/admin/users/:id/unban (MANAGE_USERS)
- ❌ GET /api/community/admin/stats (MODERATE_COMMUNITY)
- ❌ GET /api/community/feed/search (implicit - VIEW_POST)

### Letters (12)
- ✅ POST /api/letters (CREATE_LETTER)
- ✅ PUT /api/letters/:id (EDIT_OWN_LETTER or MODERATE_LETTERS)
- ✅ DELETE /api/letters/:id (DELETE_OWN_LETTER or MODERATE_LETTERS)
- ❌ POST /api/letters/:id/like (implicit - CREATE_LETTER)
- ✅ GET /api/letters/admin/stats (MODERATE_LETTERS)
- ✅ PUT /api/letters/:id/approve (MODERATE_LETTERS)
- ✅ PUT /api/letters/:id/reject (MODERATE_LETTERS)
- ❌ GET /api/letters/feed (implicit - VIEW_POST)
- ❌ GET /api/letters/:id (implicit - VIEW_POST)
- ❌ GET /api/letters/my-submissions (implicit - CREATE_LETTER)
- ❌ PUT /api/letters/:id/status (MODERATE_LETTERS)
- ❌ GET /api/letters/moderation/pending (MODERATE_LETTERS)

### User Management (8)
- ❌ GET /api/users (VIEW_USERS - partially checked)
- ❌ PUT /api/users/:id/suspend (MANAGE_USERS)
- ❌ PUT /api/users/:id/unsuspend (MANAGE_USERS)
- ❌ GET /api/users/:id/profile (public - no permission)
- ❌ PUT /api/users/:id/profile (MANAGE_PROFILES)
- ❌ POST /api/users/ban-list (MANAGE_USERS)
- ❌ GET /api/admin/users (VIEW_USERS)
- ❌ DELETE /api/admin/users/:id (MANAGE_USERS)

### Roles & Permissions (4)
- ⚠️ GET /api/admin/roles (adminMiddleware - hardcoded)
- ⚠️ POST /api/admin/roles (adminMiddleware - should use MANAGE_ROLES)
- ⚠️ PUT /api/admin/roles/:id (adminMiddleware - should use MANAGE_ROLES)
- ⚠️ DELETE /api/admin/roles/:id (adminMiddleware - should use MANAGE_ROLES)

### Miscellaneous (5)
- ❌ POST /api/moderation/flag-content (FLAG_CONTENT)
- ❌ GET /api/moderation/flagged-content (REVIEW_FLAGS)
- ❌ PUT /api/moderation/flagged-content/:id (REVIEW_FLAGS)
- ❌ GET /api/settings (implicit - admin only)
- ❌ PUT /api/settings (MANAGE_SETTINGS)

---

## Part 7: Implementation Priority Matrix

### 🔴 CRITICAL (Week 1 - Must Fix)
1. [ ] Add missing 4 permissions to database
2. [ ] Fix permission name mismatches (MODERATE_* alignment)
3. [ ] Add ownership verification to DELETE/EDIT endpoints
4. [ ] Close /admin/* endpoints to only MENTOR+

### 🟡 HIGH (Week 2 - Should Fix)
1. [ ] Add permission checks to 41 unprotected endpoints
2. [ ] Replace hardcoded role checks with permission checks
3. [ ] Add EDIT_OWN_* granular permissions
4. [ ] Update all 3 controllers with ownership verification

### 🟢 MEDIUM (Week 3-4)
1. [ ] Add FLAG_CONTENT workflow
2. [ ] Add MANAGE_SETTINGS endpoint
3. [ ] Add VIEW_LOGS endpoint
4. [ ] Complete E2E testing

### ⚪ LOW (Post-MVP)
1. [ ] Implement audit logging
2. [ ] Add permission change history
3. [ ] Create admin UI for permission management

---

## Part 8: Files to Create/Modify

### New Files
```
src/api/controllers/
├── community/
│   ├── postController.ts        (NEW - 100+ lines)
│   ├── commentController.ts      (NEW - 80+ lines)
│   └── moderationController.ts   (NEW - 60+ lines)
├── letters/
│   ├── studentController.ts      (EXISTS - update)
│   ├── moderationController.ts   (EXISTS - update)
│   └── statisticsController.ts   (NEW - 30 lines)
└── roles/
    └── rolesController.ts        (NEW - 80 lines)

src/middleware/
├── ownership.ts                  (NEW - verify user owns resource)
└── validation/
    └── permissionValidator.ts    (NEW - validate permission existence)

src/api/services/
├── community/
│   ├── postService.ts           (EXISTS - update with ownership checks)
│   ├── commentService.ts        (EXISTS - update)
│   ├── moderationService.ts     (NEW - consolidate approval logic)
│   └── categoryService.ts       (NEW - 40 lines)
├── letters/
│   ├── letterStudentService.ts  (EXISTS - update)
│   ├── letterModerationService.ts (EXISTS - update)
│   └── letterOwnershipService.ts (NEW - verify ownership)
└── roles/
    ├── roleService.ts           (NEW - 60 lines)
    └── permissionService.ts     (NEW - 40 lines)

src/types/
├── permissions.ts               (NEW - permission type definitions)
└── ownership.ts                 (NEW - ownership verification types)

src/validation/
├── permissions.ts               (EXISTS - update with 30 permissions)
├── community.ts                 (EXISTS - update)
├── letters.ts                   (EXISTS - update)
└── roles.ts                     (NEW - validate role/permission assignment)
```

### Modified Files
```
Backend (16 files):
- src/lib/permissions.ts          (update constants)
- src/db/seed.ts                  (add 9 new permissions)
- src/api/routes/admin.ts         (add permission checks)
- src/api/routes/auth.ts          (no changes)
- src/api/routes/community.ts     (add 12+ permission checks)
- src/api/routes/letters.ts       (update 4 permission checks)
- src/api/routes/newsletters.ts   (no changes)
- src/api/routes/roles.ts         (replace adminMiddleware)
- src/api/routes/user.ts          (add 8 permission checks)
- src/middleware/auth.ts          (update JWT payload type)
- src/utils/auth.ts              (add permission caching)
- src/utils/errors.ts            (add OwnershipError)
- src/validation/*.ts            (update 5 schema files)

Frontend (8 files):
- src/lib/permissions.ts          (update 30 permissions)
- src/hooks/usePermission.ts      (add granular checks)
- src/components/PermissionGate.tsx (update logic)
- src/pages/admin/*.tsx          (update 5 admin pages)
- src/store/slices/*.ts          (update reducers as needed)
```

---

## Summary: What's Broken & What's Fixed

| Issue | Current | Redesigned | Status |
|-------|---------|-----------|--------|
| Permission enforcement | 49% | 100% | 🔴 → 🟢 |
| Unused permissions | 13 | 0 | 🔴 → 🟢 |
| Ownership verification | None | Full | ❌ → ✅ |
| Admin endpoint access | Public | Restricted | 🔴 → 🟢 |
| Permission name alignment | Mismatched | Unified | ❌ → ✅ |
| Missing DB permissions | 4 | 0 | ⚠️ → ✅ |
| Role-permission matrix | Unclear | Clear | 🟡 → ✅ |
| Granular controls | Limited | Full (own_* perms) | 🟡 → ✅ |

---

## Next Steps

1. ✅ **Design Review** (THIS DOCUMENT)
   - [ ] Approve permission structure
   - [ ] Approve role matrix
   - [ ] Confirm implementation priority

2. 📋 **Phase 1: Database** (2-3 hours)
   - [ ] Create migration for new permissions
   - [ ] Update seed.ts
   - [ ] Run and verify seed

3. 🔨 **Phase 2: Backend** (8-10 hours)
   - [ ] Update permission checks
   - [ ] Add ownership middleware
   - [ ] Protect 41 endpoints

4. 🎨 **Phase 3: Frontend** (4-6 hours)
   - [ ] Update permission constants
   - [ ] Update PermissionGate usage
   - [ ] Test all flows

5. ✅ **Phase 4: Testing** (4-6 hours)
   - [ ] Unit tests for permissions
   - [ ] E2E tests for all roles
   - [ ] Permission matrix validation

---

**Ready to implement?** Let me know which phase to start with! 🚀
