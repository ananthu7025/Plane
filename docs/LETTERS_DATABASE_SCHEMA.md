# Letters Feature - Database Schema

**Status**: Design Complete
**Last Updated**: May 20, 2026

---

## Table of Contents

1. [Schema Overview](#schema-overview)
2. [Core Tables](#core-tables)
3. [Relationships](#relationships)
4. [Indexes](#indexes)
5. [Drizzle ORM Schema](#drizzle-orm-schema)
6. [Data Examples](#data-examples)

---

## Schema Overview

The Letters feature uses a parent-child versioning system to maintain audit trails when letters are resubmitted after rejection.

```
Letters (Parent Records)
├─ Versions (Child Records - one per submission)
│  ├─ letterLikes (Engagement)
│  └─ Views (Tracking)
```

### Key Design Decisions

1. **Parent-Child Versioning**: Rejected letters create versions, not overwrites
   - Original v1 stays in DB with rejection reason
   - v2, v3, etc. are linked to same parent
   - Admin sees full audit trail

2. **Soft Deletes**: Letters marked with `deletedAt` timestamp
   - Preserves audit trail
   - Views and likes still count
   - Admin can restore if needed

3. **Anonymous Identity**: Author info always stored
   - `isAnonymous` flag hides from students
   - Admins can always see real identity

4. **Like Constraints**: Unique (letterId, userId)
   - One like per user
   - No self-likes (checked in service layer)

---

## Core Tables

### 1. Letters (Parent/Master Record)

Stores letter metadata and tracks status across all versions.

```sql
CREATE TABLE letters (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Author Information
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_author_id UUID NOT NULL,  -- Always the original author, even if deleted

  -- Anonymous Flag
  is_anonymous BOOLEAN DEFAULT false,

  -- Status (applies to latest version)
  status ENUM ('pending', 'approved', 'rejected') DEFAULT 'pending',

  -- Versioning
  current_version INT DEFAULT 1,
  total_versions INT DEFAULT 1,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,

  -- Soft Delete
  is_deleted BOOLEAN DEFAULT false,

  -- Indexes
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_letters_user_id (user_id),
  INDEX idx_letters_status (status),
  INDEX idx_letters_created_at (created_at DESC),
  INDEX idx_letters_is_deleted (is_deleted),
  INDEX idx_letters_is_anonymous (is_anonymous)
);
```

**Fields**:
- `id`: Unique identifier for the letter (parent)
- `user_id`: Current author (can be NULL if user deleted)
- `original_author_id`: Author who created v1 (immutable)
- `is_anonymous`: Whether to hide author from students
- `status`: Current status (pending/approved/rejected) of latest version
- `current_version`: Version number (1, 2, 3...)
- `total_versions`: Count of all versions ever created
- `created_at`: When letter was first created
- `updated_at`: When any version was last updated
- `deleted_at`: Soft delete timestamp
- `is_deleted`: Flag for easy filtering

---

### 2. Letter Versions

Stores each submission (version) of a letter.

```sql
CREATE TABLE letter_versions (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  letter_id UUID NOT NULL REFERENCES letters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Content
  subject VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,  -- Max 5000 chars in app, but unlimited in DB
  cover_image_media_id UUID REFERENCES media_files(id) ON DELETE SET NULL,

  -- Versioning
  version_number INT NOT NULL,  -- 1, 2, 3...

  -- Status & Moderation
  status ENUM ('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  rejection_reason VARCHAR(500),  -- Why admin rejected it
  approved_by_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  rejected_by_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Engagement
  view_count INT DEFAULT 0,
  like_count INT DEFAULT 0,

  -- Timestamps
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP,
  rejected_at TIMESTAMP,
  deleted_at TIMESTAMP,

  -- Soft Delete
  is_deleted BOOLEAN DEFAULT false,

  -- Unique constraint: Only one version per number per letter
  UNIQUE (letter_id, version_number),

  -- Indexes
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_letter_versions_letter_id (letter_id),
  INDEX idx_letter_versions_status (status),
  INDEX idx_letter_versions_version_number (version_number),
  INDEX idx_letter_versions_submitted_at (submitted_at DESC),
  INDEX idx_letter_versions_is_deleted (is_deleted)
);
```

**Fields**:
- `letter_id`: Link to parent letter
- `version_number`: 1 (first), 2 (resubmitted), 3 (resubmitted again)...
- `status`: Status of THIS version
- `rejection_reason`: If rejected, why
- `approved_by_admin_id`: Which admin approved
- `rejected_by_admin_id`: Which admin rejected
- `submitted_at`: When this version was submitted
- `approved_at`: When this version was approved
- `rejected_at`: When this version was rejected

**Audit Trail Example**:
```
Letter (id: abc-123)
├─ v1 (submitted Nov 15, 2:45 PM)
│  ├─ status: rejected
│  └─ rejection_reason: "Too political, needs balanced tone"
├─ v2 (submitted Nov 16, 10:30 AM)
│  ├─ status: pending
│  └─ approver: pending decision
└─ v3 (submitted Nov 17, 3:15 PM)
   ├─ status: approved
   └─ approver: Admin John Doe
```

---

### 3. Letter Likes (Acknowledgements)

Tracks "paper plane" acknowledgements.

```sql
CREATE TABLE letter_likes (
  -- Primary Key (Composite)
  letter_version_id UUID NOT NULL REFERENCES letter_versions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Timestamp
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Unique constraint: One like per user per version
  PRIMARY KEY (letter_version_id, user_id),

  -- Index for finding likes by user
  INDEX idx_letter_likes_user_id (user_id),
  INDEX idx_letter_likes_created_at (created_at)
);
```

**Rules**:
- One entry per (version, user) pair
- No self-likes (checked in service)
- Deleting either record cascades delete
- Most recent likes queried for feed

---

### 4. Letter Views

Tracks unique views for analytics.

```sql
CREATE TABLE letter_views (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  letter_version_id UUID NOT NULL REFERENCES letter_versions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Timestamp
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Unique constraint: Track only first view per user per version
  -- (Optional: can track multiple views if needed)
  UNIQUE (letter_version_id, user_id),

  -- Indexes
  INDEX idx_letter_views_letter_version_id (letter_version_id),
  INDEX idx_letter_views_user_id (user_id),
  INDEX idx_letter_views_viewed_at (viewed_at)
);
```

**Usage**:
- Increment view count when user opens letter detail
- Use UNIQUE constraint to count unique views
- Views visible only for APPROVED letters

---

## Relationships

### Letter → User (Author)

```
users (1)
  ↓ (user_id)
letters (many)
  ↓ (user_id)
letter_versions (many)
```

### Letter → Versions (Parent-Child)

```
letters (1)
  ↓ (letter_id)
letter_versions (many: v1, v2, v3...)
```

### Version → Likes (One-to-Many)

```
letter_versions (1)
  ↓ (letter_version_id)
letter_likes (many)
  ↓ (user_id references)
users (many)
```

### Version → Views (One-to-Many)

```
letter_versions (1)
  ↓ (letter_version_id)
letter_views (many)
```

### Admin User References

```
letter_versions.approved_by_admin_id → users(id)
letter_versions.rejected_by_admin_id → users(id)
letters.original_author_id → users(id)
```

---

## Indexes

### Performance Indexes

| Index | Table | Columns | Purpose |
|-------|-------|---------|---------|
| `idx_letters_user_id` | letters | user_id | Find user's letters |
| `idx_letters_status` | letters | status | Filter by status (pending, approved) |
| `idx_letters_created_at` | letters | created_at DESC | Sort by date |
| `idx_letter_versions_letter_id` | letter_versions | letter_id | Find versions of letter |
| `idx_letter_versions_status` | letter_versions | status | Filter versions by status |
| `idx_letter_versions_submitted_at` | letter_versions | submitted_at DESC | Timeline queries |
| `idx_letter_likes_user_id` | letter_likes | user_id | Find user's likes |
| `idx_letter_views_letter_version_id` | letter_views | letter_version_id | Count views |

### Composite Indexes (Optional)

```sql
-- For: "Get pending letters by user created in last 7 days"
CREATE INDEX idx_letters_user_status_date
ON letters(user_id, status, created_at DESC);

-- For: "Get approved letters with view/like counts"
CREATE INDEX idx_versions_status_date
ON letter_versions(status, submitted_at DESC)
WHERE status = 'approved';
```

---

## Drizzle ORM Schema

```typescript
// backend/src/db/schema.ts

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  int,
  boolean,
  uniqueIndex,
  foreignKey,
  primaryKey,
  relations
} from 'drizzle-orm/pg-core';

// Enums
export const letterStatusEnum = pgEnum('letter_status', ['pending', 'approved', 'rejected']);

// Tables
export const letters = pgTable('letters', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  originalAuthorId: uuid('original_author_id').notNull(),
  isAnonymous: boolean('is_anonymous').default(false),
  status: letterStatusEnum('status').default('pending'),
  currentVersion: int('current_version').default(1),
  totalVersions: int('total_versions').default(1),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
  isDeleted: boolean('is_deleted').default(false),
}, (table) => ({
  userIdIdx: index('idx_letters_user_id').on(table.userId),
  statusIdx: index('idx_letters_status').on(table.status),
  createdAtIdx: index('idx_letters_created_at').on(table.createdAt),
  deletedIdx: index('idx_letters_is_deleted').on(table.isDeleted),
}));

export const letterVersions = pgTable('letter_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  letterId: uuid('letter_id').notNull().references(() => letters.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id),
  subject: varchar('subject', { length: 255 }).notNull(),
  content: text('content').notNull(),
  coverImageMediaId: uuid('cover_image_media_id').references(() => mediaFiles.id),
  versionNumber: int('version_number').notNull(),
  status: letterStatusEnum('status').notNull().default('pending'),
  rejectionReason: varchar('rejection_reason', { length: 500 }),
  approvedByAdminId: uuid('approved_by_admin_id').references(() => users.id),
  rejectedByAdminId: uuid('rejected_by_admin_id').references(() => users.id),
  viewCount: int('view_count').default(0),
  likeCount: int('like_count').default(0),
  submittedAt: timestamp('submitted_at').defaultNow(),
  approvedAt: timestamp('approved_at'),
  rejectedAt: timestamp('rejected_at'),
  deletedAt: timestamp('deleted_at'),
  isDeleted: boolean('is_deleted').default(false),
}, (table) => ({
  letterIdIdx: index('idx_letter_versions_letter_id').on(table.letterId),
  statusIdx: index('idx_letter_versions_status').on(table.status),
  versionIdx: index('idx_letter_versions_version_number').on(table.versionNumber),
  submittedAtIdx: index('idx_letter_versions_submitted_at').on(table.submittedAt),
  unique: uniqueIndex('unique_letter_version').on(table.letterId, table.versionNumber),
}));

export const letterLikes = pgTable('letter_likes', {
  letterVersionId: uuid('letter_version_id').notNull().references(() => letterVersions.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.letterVersionId, table.userId] }),
  userIdIdx: index('idx_letter_likes_user_id').on(table.userId),
}));

export const letterViews = pgTable('letter_views', {
  id: uuid('id').primaryKey().defaultRandom(),
  letterVersionId: uuid('letter_version_id').notNull().references(() => letterVersions.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  viewedAt: timestamp('viewed_at').defaultNow(),
}, (table) => ({
  letterVersionIdIdx: index('idx_letter_views_letter_version_id').on(table.letterVersionId),
  userIdIdx: index('idx_letter_views_user_id').on(table.userId),
  unique: uniqueIndex('unique_letter_view').on(table.letterVersionId, table.userId),
}));

// Relations
export const lettersRelations = relations(letters, ({ one, many }) => ({
  author: one(users, { fields: [letters.userId], references: [users.id] }),
  versions: many(letterVersions),
}));

export const letterVersionsRelations = relations(letterVersions, ({ one, many }) => ({
  letter: one(letters, { fields: [letterVersions.letterId], references: [letters.id] }),
  author: one(users, { fields: [letterVersions.userId], references: [users.id] }),
  likes: many(letterLikes),
  views: many(letterViews),
  approvedByAdmin: one(users, { fields: [letterVersions.approvedByAdminId], references: [users.id] }),
  rejectedByAdmin: one(users, { fields: [letterVersions.rejectedByAdminId], references: [users.id] }),
  coverImage: one(mediaFiles, { fields: [letterVersions.coverImageMediaId], references: [mediaFiles.id] }),
}));

export const letterLikesRelations = relations(letterLikes, ({ one }) => ({
  version: one(letterVersions, { fields: [letterLikes.letterVersionId], references: [letterVersions.id] }),
  user: one(users, { fields: [letterLikes.userId], references: [users.id] }),
}));

export const letterViewsRelations = relations(letterViews, ({ one }) => ({
  version: one(letterVersions, { fields: [letterViews.letterVersionId], references: [letterVersions.id] }),
  user: one(users, { fields: [letterViews.userId], references: [users.id] }),
}));
```

---

## Data Examples

### Example 1: New Letter (Not Yet Approved)

```typescript
// Letter created Nov 14, pending review
letters:
{
  id: 'letter-001',
  userId: 'user-123',
  originalAuthorId: 'user-123',
  isAnonymous: false,
  status: 'pending',
  currentVersion: 1,
  totalVersions: 1,
  createdAt: '2024-11-14T14:30:00Z',
  updatedAt: '2024-11-14T14:30:00Z'
}

letterVersions:
{
  id: 'version-001',
  letterId: 'letter-001',
  userId: 'user-123',
  subject: 'My First Solo Flight',
  content: 'Today was the best day of my life...',
  versionNumber: 1,
  status: 'pending',
  submittedAt: '2024-11-14T14:30:00Z',
  viewCount: 0,
  likeCount: 0
}
```

### Example 2: Rejected Letter with Resubmission

```typescript
// Letter rejected, then resubmitted
letters:
{
  id: 'letter-002',
  userId: 'user-456',
  originalAuthorId: 'user-456',
  isAnonymous: true,
  status: 'pending',        // Status of v2
  currentVersion: 2,
  totalVersions: 2,
  updatedAt: '2024-11-16T09:15:00Z'
}

letterVersions (v1 - Rejected):
{
  id: 'version-002a',
  letterId: 'letter-002',
  versionNumber: 1,
  status: 'rejected',
  rejectionReason: 'Too long - please condense to 2000 chars max',
  rejectedByAdminId: 'admin-001',
  rejectedAt: '2024-11-15T16:45:00Z'
}

letterVersions (v2 - Resubmitted):
{
  id: 'version-002b',
  letterId: 'letter-002',
  versionNumber: 2,
  status: 'pending',
  submittedAt: '2024-11-16T09:15:00Z',
  rejectionReason: null
}
```

### Example 3: Approved Letter with Engagement

```typescript
// Approved letter with 5 views and 2 likes
letterVersions:
{
  id: 'version-003',
  letterId: 'letter-003',
  versionNumber: 1,
  status: 'approved',
  approvedByAdminId: 'admin-002',
  approvedAt: '2024-11-17T11:00:00Z',
  viewCount: 5,
  likeCount: 2
}

letterLikes:
[
  { letterVersionId: 'version-003', userId: 'user-100', createdAt: '2024-11-17T14:30:00Z' },
  { letterVersionId: 'version-003', userId: 'user-101', createdAt: '2024-11-18T09:45:00Z' }
]

letterViews:
[
  { id: 'view-001', letterVersionId: 'version-003', userId: 'user-100', viewedAt: '2024-11-17T14:25:00Z' },
  { id: 'view-002', letterVersionId: 'version-003', userId: 'user-101', viewedAt: '2024-11-17T14:50:00Z' },
  { id: 'view-003', letterVersionId: 'version-003', userId: 'user-102', viewedAt: '2024-11-18T09:20:00Z' },
  { id: 'view-004', letterVersionId: 'version-003', userId: 'user-103', viewedAt: '2024-11-18T10:15:00Z' },
  { id: 'view-005', letterVersionId: 'version-003', userId: 'user-104', viewedAt: '2024-11-18T14:40:00Z' }
]
```

---

## Migration Script

To add these tables to existing database:

```typescript
// backend/src/db/migrations/add_letters.sql

CREATE TABLE IF NOT EXISTS letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_author_id UUID NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending',
  current_version INT DEFAULT 1,
  total_versions INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  is_deleted BOOLEAN DEFAULT false,
  CONSTRAINT status_check CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE TABLE IF NOT EXISTS letter_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  letter_id UUID NOT NULL REFERENCES letters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  subject VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  cover_image_media_id UUID REFERENCES media_files(id) ON DELETE SET NULL,
  version_number INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  rejection_reason VARCHAR(500),
  approved_by_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  rejected_by_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  view_count INT DEFAULT 0,
  like_count INT DEFAULT 0,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP,
  rejected_at TIMESTAMP,
  deleted_at TIMESTAMP,
  is_deleted BOOLEAN DEFAULT false,
  UNIQUE(letter_id, version_number),
  CONSTRAINT status_check CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE TABLE IF NOT EXISTS letter_likes (
  letter_version_id UUID NOT NULL REFERENCES letter_versions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (letter_version_id, user_id)
);

CREATE TABLE IF NOT EXISTS letter_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  letter_version_id UUID NOT NULL REFERENCES letter_versions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(letter_version_id, user_id)
);

-- Indexes
CREATE INDEX idx_letters_user_id ON letters(user_id);
CREATE INDEX idx_letters_status ON letters(status);
CREATE INDEX idx_letters_created_at ON letters(created_at DESC);
CREATE INDEX idx_letter_versions_letter_id ON letter_versions(letter_id);
CREATE INDEX idx_letter_versions_status ON letter_versions(status);
CREATE INDEX idx_letter_likes_user_id ON letter_likes(user_id);
CREATE INDEX idx_letter_views_letter_version_id ON letter_views(letter_version_id);
```

---

**Next**: Read [LETTERS_API_ENDPOINTS.md](LETTERS_API_ENDPOINTS.md) for backend API specification
