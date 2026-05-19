-- Database Optimization for 5k users/day
-- These indexes improve query performance and reduce load

-- ============================================================
-- Authentication & User Lookup Indexes
-- ============================================================

-- User email lookup (used in signin, signup verification)
-- Already indexed in schema but verify:
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);

-- User status lookup (for active user checks)
CREATE INDEX IF NOT EXISTS users_status_idx ON users(status);

-- Auth tokens lookup by userId (for token revocation checks)
CREATE INDEX IF NOT EXISTS auth_tokens_user_id_idx ON auth_tokens(user_id);

-- Auth tokens expiry check (for cleanup and validation)
CREATE INDEX IF NOT EXISTS auth_tokens_expires_at_idx ON auth_tokens(expires_at);

-- Auth tokens revocation status (for signout validation)
CREATE INDEX IF NOT EXISTS auth_tokens_revoked_at_idx ON auth_tokens(revoked_at);

-- Combined index for efficient token validation
CREATE INDEX IF NOT EXISTS auth_tokens_user_token_type_idx ON auth_tokens(user_id, token_type, revoked_at);

-- ============================================================
-- Role & Permission Indexes
-- ============================================================

-- Role lookup by name
CREATE INDEX IF NOT EXISTS roles_name_idx ON roles(name);

-- Permission lookup by name (for permission checking)
CREATE INDEX IF NOT EXISTS permissions_name_idx ON permissions(name);

-- Role permissions composite index
CREATE INDEX IF NOT EXISTS role_permissions_role_id_idx ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS role_permissions_permission_id_idx ON role_permissions(permission_id);

-- ============================================================
-- Content Indexes (for future features)
-- ============================================================

-- User profile lookups
CREATE INDEX IF NOT EXISTS user_profiles_user_id_idx ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS user_profiles_verified_idx ON user_profiles(verified);

-- Community post queries (by category, status, date)
CREATE INDEX IF NOT EXISTS community_posts_category_id_idx ON community_posts(category_id);
CREATE INDEX IF NOT EXISTS community_posts_author_id_idx ON community_posts(author_id);
CREATE INDEX IF NOT EXISTS community_posts_status_idx ON community_posts(status);
CREATE INDEX IF NOT EXISTS community_posts_created_at_idx ON community_posts(created_at DESC);

-- ============================================================
-- Logging & Audit Indexes
-- ============================================================

-- API logs lookup by endpoint (for analytics)
CREATE INDEX IF NOT EXISTS api_logs_endpoint_idx ON api_logs(endpoint);

-- Audit logs lookup by user and entity
CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS audit_logs_entity_type_idx ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON audit_logs(action);

-- ============================================================
-- Performance Tuning
-- ============================================================

-- Vacuum analyze to update statistics
ANALYZE;

-- Display index sizes
SELECT
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelid) DESC;

-- Check for missing indexes on frequently joined tables
-- Run this periodically to identify optimization opportunities
SELECT
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch
FROM pg_stat_user_tables
WHERE seq_scan > idx_scan
ORDER BY seq_scan DESC
LIMIT 10;
