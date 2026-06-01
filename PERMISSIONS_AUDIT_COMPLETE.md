# Complete Permissions Audit - Frontend & Backend

**Date**: May 28, 2026
**Status**: ⚠️ CRITICAL MISMATCHES FOUND

---

## Executive Summary

| Layer | Hardcoded? | Issues | Priority |
|---|---|---|---|
| **Backend Routes** | ✅ YES (8 permissions) | 4 don't exist in seed file | 🔴 HIGH |
| **Backend Seed** | ❌ NO (database-driven) | Missing 4 permissions | 🔴 HIGH |
| **Backend adminMiddleware** | ✅ YES (hardcoded ADMIN role check) | No permission-based access | 🟡 MEDIUM |
| **Frontend permissions.ts** | ❌ NO (clean constants) | ✅ Well-structured | ✅ GOOD |
| **Frontend Components** | ❌ NO (uses constants) | ✅ Type-safe usage | ✅ GOOD |
| **Frontend/Backend** | ❌ NO - But MISMATCHES | Permission names don't align | 🔴 HIGH |

---

## PART 1: BACKEND HARDCODED PERMISSIONS (8 total)

### In Routes

```
admin.ts          → VIEW_USERS, SUSPEND_USER ✅ (in seed)
newsletters.ts    → MANAGE_NEWSLETTERS, VIEW_NEWSLETTERS ✅ (in seed)
letters.ts        → MODERATE_LETTERS ❌ (NOT in seed!)
community.ts      → MODERATE_COMMUNITY ❌ (NOT in seed!)
                  → MANAGE_COMMUNITY ❌ (NOT in seed!)
                  → MANAGE_USERS ❌ (NOT in seed!)
roles.ts          → Uses adminMiddleware (hardcoded role check)
```

### Missing in Seed File

| Permission | Routes | Count |
|---|---|---|
| `MODERATE_LETTERS` | letter endpoints | 4 |
| `MODERATE_COMMUNITY` | community moderation | 8 |
| `MANAGE_COMMUNITY` | category management | 2 |
| `MANAGE_USERS` | ban/unban users | 3 |

### Hardcoded Role Check

```typescript
// src/middleware/adminAuth.ts - Line 31
if (user.role?.name !== "ADMIN") {  // ← Hardcoded!
  throw new ForbiddenError("Admin access required");
}
```

**Affects**: 11 routes in `roles.ts`
**Should use**: `MANAGE_ROLES`, `MANAGE_PERMISSIONS` instead

---

## PART 2: FRONTEND PERMISSIONS (23 defined, 9 used)

### Defined in Constants

```
Posts (6):        CREATE_POST, EDIT_POST, DELETE_POST, APPROVE_POST, REJECT_POST, VIEW_POST
Comments (5):     CREATE_COMMENT, EDIT_COMMENT, DELETE_COMMENT, APPROVE_COMMENT, REJECT_COMMENT
Letters (4):      CREATE_LETTER, PUBLISH_LETTER, DELETE_LETTER, APPROVE_LETTER
Newsletters (2):  MANAGE_NEWSLETTERS, VIEW_NEWSLETTERS
Users (4):        BAN_USER, UNBAN_USER, SUSPEND_USER, VIEW_USERS
Moderation (1):   FLAG_CONTENT
```

### Actually Used

| Permission | Component | Count |
|---|---|---|
| `APPROVE_POST` | AdminCommunity.tsx | 1 |
| `REJECT_POST` | AdminCommunity.tsx | 1 |
| `APPROVE_LETTER` | AdminLetters.tsx | 1 |
| `BAN_USER` | AdminCommunity.tsx | 1 |
| `UNBAN_USER` | AdminCommunity.tsx | 1 |
| `SUSPEND_USER` | AdminStudents.tsx, UserManagement.tsx | 2 |
| `DELETE_LETTER` | AdminLetters.tsx | 1 |
| `MANAGE_NEWSLETTERS` | AdminNewsletters.tsx | 2 |
| `VIEW_USERS` | UserManagement.tsx | 1 |

**Frontend**: ✅ No hardcoding, uses constants, type-safe

---

## PART 3: CRITICAL MISMATCH TABLE

```
Frontend expects          | Backend enforces       | Match?
──────────────────────────┼────────────────────────┼────────
APPROVE_POST              | MODERATE_COMMUNITY     | ❌
REJECT_POST               | MODERATE_COMMUNITY     | ❌
APPROVE_COMMENT           | MODERATE_COMMUNITY     | ❌
REJECT_COMMENT            | MODERATE_COMMUNITY     | ❌
APPROVE_LETTER            | MODERATE_LETTERS       | ❌
BAN_USER                  | MANAGE_USERS           | ❌
UNBAN_USER                | MANAGE_USERS           | ❌
MANAGE_NEWSLETTERS        | MANAGE_NEWSLETTERS     | ✅
VIEW_NEWSLETTERS          | VIEW_NEWSLETTERS       | ✅
SUSPEND_USER              | SUSPEND_USER           | ✅
VIEW_USERS                | VIEW_USERS             | ✅
```

### Real-World Impact

**Admin tries to approve post:**
1. Frontend checks: `usePermission(Permissions.APPROVE_POST)` ✅
2. User has `APPROVE_POST` in JWT → UI button shown
3. Calls: `PUT /api/community/admin/posts/:id/approve`
4. Backend checks: `requirePermission("MODERATE_COMMUNITY")`
5. User permission is `APPROVE_POST` (name mismatch!)
6. Backend: ❌ INSUFFICIENT_PERMISSION
7. **Result**: Frontend shows button but backend blocks it!

---

## PART 4: DATABASE PERMISSIONS

### What's in Seed (28 permissions)

✅ All these exist:
- CREATE_POST, EDIT_POST, DELETE_POST, APPROVE_POST, REJECT_POST, VIEW_POST
- CREATE_COMMENT, EDIT_COMMENT, DELETE_COMMENT, APPROVE_COMMENT, REJECT_COMMENT
- CREATE_LETTER, PUBLISH_LETTER, DELETE_LETTER, APPROVE_LETTER
- MANAGE_NEWSLETTERS, VIEW_NEWSLETTERS
- BAN_USER, UNBAN_USER, SUSPEND_USER, VIEW_USERS
- FLAG_CONTENT, REVIEW_FLAGS, RESPOND_FEEDBACK
- MANAGE_ROLES, MANAGE_PERMISSIONS, MANAGE_SETTINGS, VIEW_LOGS

### What Routes Need But Seed Missing (4 permissions)

❌ These DON'T exist in DB but routes hardcode them:
- `MODERATE_LETTERS` (4 routes use it)
- `MODERATE_COMMUNITY` (8 routes use it)
- `MANAGE_COMMUNITY` (2 routes use it)
- `MANAGE_USERS` (3 routes use it)

**Result**: Routes will fail for these actions because permissions don't exist in DB

---

## ACTION ITEMS

### 🔴 CRITICAL (Fix Now)

#### 1. Add 4 Missing Permissions to Seed

**File**: `backend/src/db/seed.ts` (line ~47)

```typescript
// Add to permissions array:
{ name: "MODERATE_LETTERS", module: "letters", description: "Can moderate letters" },
{ name: "MODERATE_COMMUNITY", module: "community", description: "Can moderate community posts/comments" },
{ name: "MANAGE_COMMUNITY", module: "community", description: "Can manage community categories" },
{ name: "MANAGE_USERS", module: "users", description: "Can ban/unban users" },
```

#### 2. Assign to Roles

**File**: `backend/src/db/seed.ts` (line ~122)

Add to **mentorPerms**:
```typescript
"MANAGE_COMMUNITY",
"MANAGE_USERS",
// Keep existing:
"MANAGE_NEWSLETTERS",
"VIEW_NEWSLETTERS",
```

#### 3. Run Seed

```bash
npm run db:seed
```

### 🟡 MEDIUM (Improve Later)

#### 4. Replace adminMiddleware with Permissions

**File**: `backend/src/api/routes/roles.ts`

```typescript
// Change FROM:
router.get("/roles", authMiddleware, adminMiddleware, ...)

// Change TO:
router.get("/roles", authMiddleware, requirePermission("MANAGE_ROLES"), ...)
```

Add `MANAGE_ROLES` and `MANAGE_PERMISSIONS` to seed and mentor role permissions.

---

## Files Affected

```
MUST FIX (🔴):
└── backend/src/db/seed.ts

SHOULD FIX (🟡):
└── backend/src/api/routes/roles.ts
└── backend/src/middleware/adminAuth.ts (document usage)

NO CHANGES NEEDED (✅):
├── client/src/lib/permissions.ts
├── client/src/hooks/usePermission.ts
└── client/src/components/common/PermissionGate.tsx
```

---

## Effort Estimate

- Add missing permissions: 5 min
- Assign to roles: 5 min
- Run seed: 2 min
- Replace adminMiddleware: 10 min
- Test: 15 min
- **Total**: ~37 min

---

## Summary

| Aspect | Status | Issue |
|---|---|---|
| Backend hardcoded strings | ⚠️ 8 permissions | HIGH - 4 missing in DB |
| Frontend hardcoded strings | ✅ None | GOOD |
| Permission name alignment | ❌ Mismatched | HIGH - Routes will reject |
| Role-based access (adminMiddleware) | ⚠️ Hardcoded | MEDIUM - Should use permissions |
| Frontend/Backend integration | ❌ Broken for some | HIGH - UI buttons don't work |

**Recommendation**: Fix seed.ts first (5 min), test, then replace adminMiddleware (10 min).
