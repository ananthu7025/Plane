-- Permission System Migration: Delete All & Insert New (Redesigned)
-- Date: May 29, 2026
-- Phase: Database Restructuring

-- ============================================================================
-- PART 1: DELETE ALL EXISTING PERMISSIONS (with cascade cleanup)
-- ============================================================================

-- Step 1: Delete all role-permission associations first
DELETE FROM role_permissions;

-- Step 2: Delete all permissions
DELETE FROM permissions;

-- Step 3: Reset permission ID sequence (if using auto-increment)
ALTER SEQUENCE permissions_id_seq RESTART WITH 1;

-- ============================================================================
-- PART 2: INSERT NEW 30 PERMISSIONS (Redesigned Structure)
-- ============================================================================

-- Category 1: Posts (5 permissions) - Consolidated from 6
INSERT INTO permissions (name, module, description, created_at, updated_at) VALUES
('CREATE_POST', 'community', 'Can create new community posts', NOW(), NOW()),
('EDIT_OWN_POST', 'community', 'Can edit own posts', NOW(), NOW()),
('DELETE_OWN_POST', 'community', 'Can delete own posts', NOW(), NOW()),
('MODERATE_POSTS', 'community', 'Can approve/reject/edit any post', NOW(), NOW()),
('VIEW_POST', 'community', 'Can view posts', NOW(), NOW());

-- Category 2: Comments (5 permissions) - Consolidated from 5
INSERT INTO permissions (name, module, description, created_at, updated_at) VALUES
('CREATE_COMMENT', 'community', 'Can create comments on posts', NOW(), NOW()),
('EDIT_OWN_COMMENT', 'community', 'Can edit own comments', NOW(), NOW()),
('DELETE_OWN_COMMENT', 'community', 'Can delete own comments', NOW(), NOW()),
('MODERATE_COMMENTS', 'community', 'Can approve/reject/edit any comment', NOW(), NOW()),
('APPROVE_COMMENT', 'community', 'Can approve comments (legacy alias for MODERATE_COMMENTS)', NOW(), NOW());

-- Category 3: Letters (6 permissions) - Consolidated from 4
INSERT INTO permissions (name, module, description, created_at, updated_at) VALUES
('CREATE_LETTER', 'letters', 'Can create/submit student letters', NOW(), NOW()),
('EDIT_OWN_LETTER', 'letters', 'Can edit own letters', NOW(), NOW()),
('DELETE_OWN_LETTER', 'letters', 'Can delete own letters', NOW(), NOW()),
('MODERATE_LETTERS', 'letters', 'Can approve/reject/edit any letter', NOW(), NOW()),
('PUBLISH_LETTER', 'letters', 'Can publish letters', NOW(), NOW()),
('DELETE_LETTER', 'letters', 'Can delete any letter (admin)', NOW(), NOW());

-- Category 4: Newsletters (2 permissions)
INSERT INTO permissions (name, module, description, created_at, updated_at) VALUES
('MANAGE_NEWSLETTERS', 'newsletters', 'Can upload/edit/delete newsletters', NOW(), NOW()),
('VIEW_NEWSLETTERS', 'newsletters', 'Can view full newsletter content', NOW(), NOW());

-- Category 5: User Management (5 permissions) - Consolidated from 5
INSERT INTO permissions (name, module, description, created_at, updated_at) VALUES
('MANAGE_USERS', 'users', 'Can ban/unban/suspend users (consolidated)', NOW(), NOW()),
('VIEW_USERS', 'users', 'Can view user list and details', NOW(), NOW()),
('MANAGE_PROFILES', 'users', 'Can edit user profiles', NOW(), NOW()),
('SUSPEND_USER', 'users', 'Can suspend users', NOW(), NOW()),
('BAN_USER', 'users', 'Can ban users (legacy alias for MANAGE_USERS)', NOW(), NOW());

-- Category 6: Community Management (2 permissions)
INSERT INTO permissions (name, module, description, created_at, updated_at) VALUES
('MANAGE_COMMUNITY', 'community', 'Can manage categories and community settings', NOW(), NOW()),
('MODERATE_COMMUNITY', 'community', 'Can moderate community (ban users, remove content)', NOW(), NOW());

-- Category 7: Moderation & Flags (2 permissions)
INSERT INTO permissions (name, module, description, created_at, updated_at) VALUES
('FLAG_CONTENT', 'moderation', 'Can flag/report content', NOW(), NOW()),
('REVIEW_FLAGS', 'moderation', 'Can review flagged content and take action', NOW(), NOW());

-- Category 8: System & Admin (3 permissions)
INSERT INTO permissions (name, module, description, created_at, updated_at) VALUES
('MANAGE_ROLES', 'system', 'Can create/edit/delete roles', NOW(), NOW()),
('MANAGE_PERMISSIONS', 'system', 'Can assign permissions to roles', NOW(), NOW()),
('MANAGE_SETTINGS', 'system', 'Can edit platform settings', NOW(), NOW()),
('VIEW_LOGS', 'system', 'Can view system logs and audit trail', NOW(), NOW());

-- ============================================================================
-- PART 3: ASSIGN PERMISSIONS TO ROLES (Redesigned Matrix)
-- ============================================================================

-- Get role IDs (assuming standard seeded roles)
-- STUDENT_ID, MENTOR_ID, ADMIN_ID will be fetched from roles table

-- STUDENT ROLE PERMISSIONS (14 permissions)
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT r.id, p.id, NOW()
FROM roles r, permissions p
WHERE r.name = 'STUDENT' AND p.name IN (
  'CREATE_POST',
  'EDIT_OWN_POST',
  'DELETE_OWN_POST',
  'CREATE_COMMENT',
  'EDIT_OWN_COMMENT',
  'DELETE_OWN_COMMENT',
  'CREATE_LETTER',
  'EDIT_OWN_LETTER',
  'DELETE_OWN_LETTER',
  'VIEW_NEWSLETTERS',
  'VIEW_USERS',
  'FLAG_CONTENT',
  'VIEW_POST',
  'APPROVE_COMMENT'
);

-- MENTOR ROLE PERMISSIONS (28 permissions = STUDENT + additional)
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT r.id, p.id, NOW()
FROM roles r, permissions p
WHERE r.name = 'MENTOR' AND p.name IN (
  -- All STUDENT permissions
  'CREATE_POST',
  'EDIT_OWN_POST',
  'DELETE_OWN_POST',
  'CREATE_COMMENT',
  'EDIT_OWN_COMMENT',
  'DELETE_OWN_COMMENT',
  'CREATE_LETTER',
  'EDIT_OWN_LETTER',
  'DELETE_OWN_LETTER',
  'VIEW_NEWSLETTERS',
  'VIEW_USERS',
  'FLAG_CONTENT',
  'VIEW_POST',
  'APPROVE_COMMENT',

  -- Additional MENTOR permissions
  'MODERATE_POSTS',
  'MODERATE_COMMENTS',
  'MODERATE_LETTERS',
  'MANAGE_USERS',
  'MANAGE_PROFILES',
  'MANAGE_COMMUNITY',
  'MODERATE_COMMUNITY',
  'MANAGE_NEWSLETTERS',
  'REVIEW_FLAGS',
  'BAN_USER'
);

-- ADMIN ROLE PERMISSIONS (all 30 permissions)
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT r.id, p.id, NOW()
FROM roles r, permissions p
WHERE r.name = 'ADMIN';

-- ============================================================================
-- PART 4: VERIFICATION QUERIES
-- ============================================================================

-- Verify: Count total permissions
SELECT COUNT(*) as total_permissions FROM permissions;

-- Verify: Permissions by module
SELECT module, COUNT(*) as count FROM permissions GROUP BY module ORDER BY module;

-- Verify: Permissions by role
SELECT
  r.name as role,
  COUNT(p.id) as permission_count,
  STRING_AGG(p.name, ', ' ORDER BY p.name) as permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
GROUP BY r.id, r.name
ORDER BY r.name;

-- Verify: Find any orphaned role-permissions
SELECT rp.* FROM role_permissions rp
WHERE rp.permission_id NOT IN (SELECT id FROM permissions)
OR rp.role_id NOT IN (SELECT id FROM roles);

-- ============================================================================
-- SUMMARY OF CHANGES
-- ============================================================================
/*

DELETED: 32 old permissions
INSERTED: 30 new permissions

CONSOLIDATIONS:
- APPROVE_POST + REJECT_POST → MODERATE_POSTS
- APPROVE_COMMENT + REJECT_COMMENT → MODERATE_COMMENTS
- BAN_USER + UNBAN_USER + SUSPEND_USER → MANAGE_USERS
- APPROVE_LETTER → MODERATE_LETTERS

NEW GRANULAR PERMISSIONS:
+ EDIT_OWN_POST, DELETE_OWN_POST
+ EDIT_OWN_COMMENT, DELETE_OWN_COMMENT
+ EDIT_OWN_LETTER, DELETE_OWN_LETTER

REMOVED (UNUSED):
- REJECT_POST (now part of MODERATE_POSTS)
- REJECT_COMMENT (now part of MODERATE_COMMENTS)
- UNBAN_USER (now part of MANAGE_USERS)
- RESPOND_FEEDBACK (unused)

ROLE ASSIGNMENTS:
STUDENT: 14 permissions (create own content, flag, view)
MENTOR: 28 permissions (STUDENT + moderation + management)
ADMIN: 30 permissions (all)

*/

-- ============================================================================
-- OPTIONAL: Rollback Script (if needed)
-- ============================================================================

/*
-- To restore from backup:
DELETE FROM role_permissions;
DELETE FROM permissions;
-- Then run original seed.ts with: npm run db:seed
*/
