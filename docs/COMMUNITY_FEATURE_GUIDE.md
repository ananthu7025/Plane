# PlaneAndProp Community Feature - Complete Guide

**Last Updated**: May 18, 2026
**Status**: Partially Implemented (Frontend Complete, Backend Required)
**Feature Scope**: Community posts, moderation, categories, rules, engagement

---

## Table of Contents

1. [Feature Overview](#feature-overview)
2. [User Flows](#user-flows)
3. [Admin Flows](#admin-flows)
4. [Frontend Implementation Status](#frontend-implementation-status)
5. [Required API Endpoints](#required-api-endpoints)
6. [Database Schema](#database-schema)
7. [Backend Implementation Plan](#backend-implementation-plan)
8. [Development Guide](#development-guide)

---

## Feature Overview

### Purpose
Community feature enables students, mentors, and admins to:
- Share knowledge and ask questions
- Post anonymously for sensitive topics
- Engage through likes, comments, and shares
- Get posts moderated before publication
- Maintain community guidelines through moderation

### Key Components

#### 1. Community Feed (User)
**File**: `client/src/pages/community/CommunityFeed.tsx`

**Features**:
- ✅ Create posts with moderation workflow
- ✅ Post anonymously option
- ✅ Attach media (images, videos, documents)
- ✅ Category selection
- ✅ Like/comment/share posts
- ✅ Filter by category
- ✅ View pending posts status
- ✅ Delete own posts
- ✅ Community rules sidebar
- ✅ Stats display (members, posts, engagement)

**Sample Data** (hardcoded):
- 3 sample posts
- 6 community categories
- 7 community rules
- 2 pending posts

#### 2. Admin Community Panel
**File**: `client/src/pages/admin/AdminCommunity.tsx`

**Features**:
- ✅ Moderation queue (All/Pending/Approved/Declined tabs)
- ✅ View approved posts
- ✅ Approve/decline pending posts
- ✅ Delete posts and comments
- ✅ Ban users
- ✅ Manage categories (add/delete)
- ✅ View banned users list
- ✅ Activity log
- ✅ Create admin posts
- ✅ Poll support
- ✅ Search and filter posts

**Moderation Actions**:
- Approve pending posts
- Decline posts
- Delete posts/comments
- Ban users
- Create categories
- Delete categories

#### 3. Community Rules
**File**: `client/src/pages/community/CommunityRules.tsx`

**Features**:
- ✅ Display 4 core rules
- ✅ Additional guidelines (4 sections)
- ✅ Enforcement policy
- ✅ Feedback form link
- ✅ Agreement checkbox

**Core Rules**:
1. Be Respectful - No harassment, inclusive language
2. Stay On Topic - Use appropriate categories
3. No Spam - No self-promotion, ads, duplicates
4. Respect Privacy - Protect personal info

---

## User Flows

### 1. Creating a Post (Student/Mentor)

```
User navigates to /community
    ↓
Sees CommunityFeed with:
├─ Stats (members, weekly posts, engagement rate)
├─ Post creation dialog ("Request to Post")
├─ Category filter buttons
└─ Feed of approved posts
    ↓
Clicks "Request to Post" button
    ↓
Dialog opens with form:
├─ Category dropdown (required)
├─ Content textarea
├─ Anonymous toggle
├─ Optional media attachment
│   ├─ Image
│   ├─ Video
│   └─ Document
└─ Submit button (disabled until category + content)
    ↓
User fills form:
├─ Selects category (e.g., "Study Tips", "Questions")
├─ Enters content/question
├─ Optionally toggles "Post Anonymously"
├─ Optionally uploads media
└─ Clicks "Submit for Review" or "Submit Anonymously"
    ↓
Post submitted with status: "pending"
    ↓
Toast: "Your post has been submitted for review"
    ↓
Post appears in sidebar "My Pending Posts"
Status: pending, submittedAt: timestamp
    ↓
Moderator reviews within 24 hours
    ↓
Post approved or declined
    ↓
User sees updated status in "My Pending Posts"
If approved:
  ├─ Post appears in feed
  └─ Others can like/comment/share
If declined:
  └─ Post removed from pending list (reason optional)
```

### 2. Engaging with Posts

```
User views approved post in feed
    ↓
Post displays:
├─ Author name or "Anonymous"
├─ Author role badge
├─ Category tag
├─ Content
├─ Engagement buttons:
│  ├─ ❤️ Like (toggleable)
│  ├─ 💬 Comments
│  └─ 🔄 Share
└─ Timestamp
    ↓
Clicking "Comments" expands replies
    ↓
User can:
├─ View existing replies
├─ Like replies
└─ Write new reply
    ↓
User types reply and clicks Send
    ↓
Reply appears immediately with "Just now" timestamp
Reply count increments
    ↓
Reply author is labeled "You"
```

### 3. Viewing Community Rules

```
User navigates to /community/rules
    ↓
Page displays:
├─ Back button
├─ Title: "Community Guidelines"
├─ 4 Core Rules:
│  ├─ Be Respectful
│  ├─ Stay On Topic
│  ├─ No Spam
│  └─ Respect Privacy
├─ 4 Guideline sections:
│  ├─ Academic Integrity
│  ├─ Content Standards
│  ├─ Communication
│  └─ Reporting Issues
├─ Enforcement policy
│  ├─ Warning/suspension
│  ├─ Content removal
│  ├─ Account suspension
│  └─ Permanent ban
├─ Questions section with feedback link
└─ Agreement checkbox
```

### 4. Deleting Own Post

```
User views own post in feed
    ↓
Post shows "You" badge
    ↓
Post has "Delete" button
    ↓
User clicks Delete
    ↓
AlertDialog appears:
"Delete this post?"
"This action cannot be undone. Your post will be permanently removed."
    ↓
User clicks "Delete" in dialog
    ↓
Post removed from feed
Toast: "Post deleted"
    ↓
Post no longer appears in My Pending Posts
```

---

## Admin Flows

### 1. Moderating Posts

```
Admin navigates to /admin/community
    ↓
AdminCommunity page shows:
├─ 5 stat cards:
│  ├─ Total Posts
│  ├─ Pending (count)
│  ├─ Approved
│  ├─ Categories
│  └─ Banned Users
├─ 4 view buttons:
│  ├─ Moderate (default)
│  ├─ Community (view approved posts)
│  ├─ Categories
│  └─ Banned
└─ Activity log
    ↓
In "Moderate" view:
├─ Tabs: All | Pending | Approved | Declined
├─ Search and category filter
├─ List of posts with:
│  ├─ Author avatar & name
│  ├─ Title and content
│  ├─ Category badge
│  ├─ Status badge
│  ├─ Anonymous indicator (with tooltip showing real name)
│  ├─ Images/videos (if attached)
│  ├─ Poll (if type === "poll")
│  ├─ Engagement stats (likes, comments)
│  ├─ Replies (expandable)
│  └─ Action buttons:
│      ├─ ✅ Approve (for pending only)
│      ├─ ❌ Decline (for pending only)
│      ├─ ⋮ More menu:
│      │  ├─ View Details
│      │  ├─ Delete Post
│      │  └─ Ban User
│      └─ Delete comment button (on replies)
    ↓
Admin clicks "Approve" on pending post
    ↓
Post status changes to "approved"
    ↓
Post moves to "Approved" tab
    ↓
Activity log updated: "Post approved by Admin"
    ↓
Post becomes visible in user community feed
```

### 2. Managing Categories

```
Admin clicks "Categories" view button
    ↓
Categories page shows:
├─ Grid of category cards
├─ Each card displays:
│  ├─ Color dot
│  ├─ Category name
│  ├─ Post count
│  └─ Delete button (trash icon)
└─ "Add Category" button in header
    ↓
Admin clicks "Add Category"
    ↓
Dialog opens:
├─ Category Name input
├─ Cancel button
└─ Add Category button
    ↓
Admin enters name (e.g., "Flight Training")
    ↓
Admin clicks "Add Category"
    ↓
New category appears in grid with:
├─ Color: "primary" (default)
├─ Post count: 0
└─ Delete button
    ↓
Toast: "Category added"
    ↓
New category available in user post creation dropdown
```

### 3. Managing Banned Users

```
Admin clicks "Banned" view button
    ↓
Banned Users page shows:
├─ List of banned users
├─ Each entry displays:
│  ├─ User name
│  ├─ "Banned" badge
│  ├─ Email
│  ├─ Reason: "..."
│  ├─ Banned on: date
│  └─ "Unban" button
    ↓
Example banned users:
├─ Spam User (spam@mail.com)
│  Reason: "Repeated spam posts"
│  Banned: Dec 5, 2024
│
└─ Troll Account (troll@mail.com)
   Reason: "Harassment of other members"
   Banned: Nov 28, 2024
    ↓
Admin clicks "Unban" button
    ↓
User removed from banned list
    ↓
User can now post again
```

### 4. Creating Admin Posts

```
Admin clicks "Create Post" button
    ↓
Dialog opens with tabs:
├─ Text
├─ Poll
├─ Image
└─ Video
    ↓
If Text selected:
├─ Title input
├─ Content textarea
├─ Category dropdown
└─ Publish button
    ↓
If Poll selected:
├─ Title input
├─ Content textarea
├─ Poll Options (add up to 6)
├─ Category dropdown
└─ Publish button
    ↓
Admin fills form and clicks Publish
    ↓
Post created with status: "approved"
    ↓
Post immediately appears in community feed
    ↓
Toast: "Post published"
    ↓
Activity log: "Poll created by Admin"
```

### 5. Activity Log

```
Right sidebar shows Activity Log with entries:
├─ Post approved
├─ Anonymous post submitted
├─ Comment deleted
├─ User banned
├─ Poll created
...
    ↓
Each log entry shows:
├─ Dot indicator
├─ Action name
├─ Details (what was moderated)
├─ Actor (who did it)
└─ Time (2 hours ago, 1 day ago, etc.)
```

---

## Frontend Implementation Status

### ✅ Completed Components

**Pages** (Both 100% UI/UX complete):
1. `CommunityFeed.tsx` - User community feed with:
   - Post creation form with validation
   - Moderation workflow (pending → approved/declined)
   - Anonymous posting toggle
   - Media attachment UI
   - Like/comment/share buttons
   - Reply expansion/collapse
   - Category filtering
   - My pending posts sidebar
   - Community rules sidebar

2. `AdminCommunity.tsx` - Full moderation interface with:
   - Moderation queue with tab filtering
   - Approval/decline actions
   - Delete post/comment functionality
   - Category management (add/delete)
   - Banned users management
   - Admin post creation
   - Poll support
   - Activity log

3. `CommunityRules.tsx` - Community guidelines page with:
   - 4 core rules with details
   - 4 additional guidelines sections
   - Enforcement policy
   - Feedback form link
   - Agreement checkbox

### ⚠️ Currently Using Mock Data

All data is hardcoded in components:
- Sample posts array (3 posts)
- Categories (6 hardcoded)
- Banned users (2 hardcoded)
- Activity log (5 entries)

### State Management

Currently using local component state:
```tsx
const [posts, setPosts] = useState(communityPosts);
const [categories, setCategories] = useState(initialCategories);
const [expandedReplies, setExpandedReplies] = useState({});
```

---

## Required API Endpoints

### Community Posts

| Method | Endpoint | Auth | Body | Response | Purpose |
|--------|----------|------|------|----------|---------|
| POST | `/api/community/posts` | Required | `{ title?, content, category, isAnonymous, mediaIds? }` | `{ post }` | Create post (pending approval) |
| GET | `/api/community/posts` | Optional | Query: `page, limit, category, status, sort, order` | `{ posts[], pagination }` | Get all approved posts |
| GET | `/api/community/posts/:id` | Optional | - | `{ post }` | Get post details with replies |
| DELETE | `/api/community/posts/:id` | Required | - | `{ success }` | Delete own post (before approval) |
| PUT | `/api/community/posts/:id/like` | Required | - | `{ likes }` | Like/unlike post |
| POST | `/api/community/posts/:id/replies` | Required | `{ content }` | `{ reply }` | Add reply to post |
| DELETE | `/api/community/posts/:id/replies/:replyId` | Required | - | `{ success }` | Delete own reply |
| PUT | `/api/community/posts/:id/replies/:replyId/like` | Required | - | `{ likes }` | Like reply |

### Admin Moderation

| Method | Endpoint | Auth | Body | Response | Purpose |
|--------|----------|------|------|----------|---------|
| GET | `/api/admin/community/posts` | ADMIN | Query: `status, category, search, page, limit` | `{ posts[], pagination }` | Get posts for moderation |
| PUT | `/api/admin/community/posts/:id/approve` | ADMIN | `{ reason? }` | `{ post }` | Approve pending post |
| PUT | `/api/admin/community/posts/:id/decline` | ADMIN | `{ reason }` | `{ success }` | Decline post |
| DELETE | `/api/admin/community/posts/:id` | ADMIN | - | `{ success }` | Admin delete any post |
| DELETE | `/api/admin/community/posts/:id/replies/:replyId` | ADMIN | - | `{ success }` | Delete any reply |
| POST | `/api/admin/community/users/:userId/ban` | ADMIN | `{ reason, duration? }` | `{ user }` | Ban user |
| PUT | `/api/admin/community/users/:userId/unban` | ADMIN | - | `{ user }` | Unban user |

### Categories

| Method | Endpoint | Auth | Body | Response | Purpose |
|--------|----------|------|------|----------|---------|
| GET | `/api/community/categories` | Optional | - | `{ categories[] }` | Get all categories |
| POST | `/api/admin/community/categories` | ADMIN | `{ name, color?, description? }` | `{ category }` | Create category |
| DELETE | `/api/admin/community/categories/:id` | ADMIN | - | `{ success }` | Delete category |

### Posts User Made

| Method | Endpoint | Auth | Body | Response | Purpose |
|--------|----------|------|------|----------|---------|
| GET | `/api/community/my-posts` | Required | Query: `status, page, limit` | `{ posts[], pagination }` | Get user's own posts (all statuses) |

### Activity Log (Admin only)

| Method | Endpoint | Auth | Body | Response | Purpose |
|--------|----------|------|------|----------|---------|
| GET | `/api/admin/community/activity` | ADMIN | Query: `page, limit, action, user` | `{ logs[], pagination }` | Get moderation activity log |

---

## Database Schema

### Posts Table

```sql
CREATE TABLE community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Author info
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_anonymous BOOLEAN DEFAULT false,

  -- Content
  content TEXT NOT NULL,
  category_id INT NOT NULL REFERENCES community_categories(id),

  -- Type (text, poll, image, video)
  type VARCHAR(20) DEFAULT 'text',

  -- Media
  media_ids UUID[] DEFAULT '{}',  -- Array of media file IDs

  -- Poll-specific
  poll_options JSONB,  -- [{ text: "option", votes: 0 }, ...]

  -- Moderation
  status ENUM ('pending', 'approved', 'declined') DEFAULT 'pending',
  decline_reason VARCHAR,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,

  -- Engagement
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  shares_count INT DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,

  INDEX idx_posts_user_id (user_id),
  INDEX idx_posts_category_id (category_id),
  INDEX idx_posts_status (status),
  INDEX idx_posts_created_at (created_at DESC),
  INDEX idx_posts_is_anonymous (is_anonymous)
);
```

### Replies Table

```sql
CREATE TABLE community_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  content TEXT NOT NULL,

  likes_count INT DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,

  INDEX idx_replies_post_id (post_id),
  INDEX idx_replies_user_id (user_id),
  INDEX idx_replies_created_at (created_at)
);
```

### Post Likes Table

```sql
CREATE TABLE community_post_likes (
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (post_id, user_id),
  INDEX idx_post_likes_user_id (user_id)
);
```

### Reply Likes Table

```sql
CREATE TABLE community_reply_likes (
  reply_id UUID NOT NULL REFERENCES community_replies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (reply_id, user_id),
  INDEX idx_reply_likes_user_id (user_id)
);
```

### Categories Table

```sql
CREATE TABLE community_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(50) DEFAULT 'primary',  -- primary, warning, success, accent, muted
  posts_count INT DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_categories_name (name)
);

-- Seed default categories
INSERT INTO community_categories (name, description, color) VALUES
  ('Study Tips', 'Share study strategies and tips', 'primary'),
  ('Questions', 'Ask questions about course material', 'warning'),
  ('Exam Experience', 'Share exam experiences and tips', 'success'),
  ('Career Guidance', 'Discuss career paths and opportunities', 'accent'),
  ('General Discussion', 'General topics and discussions', 'muted'),
  ('Resource Sharing', 'Share learning resources and materials', 'primary');
```

### Banned Users Table

```sql
CREATE TABLE community_banned_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  banned_by UUID NOT NULL REFERENCES users(id),
  reason VARCHAR NOT NULL,
  duration_days INT,  -- NULL = permanent
  banned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  unbanned_at TIMESTAMP,

  INDEX idx_banned_users_user_id (user_id),
  INDEX idx_banned_users_unbanned_at (unbanned_at)
);
```

### Activity Log Table

```sql
CREATE TABLE community_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(100) NOT NULL,  -- post_approved, post_declined, comment_deleted, user_banned, etc.
  actor_id UUID NOT NULL REFERENCES users(id),
  target_type VARCHAR(50),  -- post, reply, user, category
  target_id UUID,
  details JSONB,  -- Additional context

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_activity_log_created_at (created_at DESC),
  INDEX idx_activity_log_action (action),
  INDEX idx_activity_log_actor_id (actor_id)
);
```

---

## Backend Implementation Plan

### Phase 1: Core Posts (Week 1)

**Endpoints**:
- `POST /api/community/posts` - Create post (pending)
- `GET /api/community/posts` - Get approved posts
- `DELETE /api/community/posts/:id` - Delete own post

**Database**:
- Create `community_posts` table
- Create `community_categories` table
- Create `community_post_likes` table

**Services**:
- `CommunityPostService.createPost()`
- `CommunityPostService.getAllApprovedPosts()`
- `CommunityPostService.deletePost()`

### Phase 2: Engagement (Week 1-2)

**Endpoints**:
- `PUT /api/community/posts/:id/like` - Like/unlike
- `POST /api/community/posts/:id/replies` - Add reply
- `DELETE /api/community/posts/:id/replies/:replyId` - Delete reply
- `PUT /api/community/posts/:id/replies/:replyId/like` - Like reply

**Database**:
- Create `community_replies` table
- Create `community_reply_likes` table
- Add likes_count, comments_count to posts

**Services**:
- `CommunityPostService.toggleLike()`
- `CommunityPostService.addReply()`
- `CommunityPostService.deleteReply()`
- `CommunityPostService.toggleReplyLike()`

### Phase 3: Moderation (Week 2)

**Endpoints**:
- `GET /api/admin/community/posts` - Get posts for moderation
- `PUT /api/admin/community/posts/:id/approve` - Approve
- `PUT /api/admin/community/posts/:id/decline` - Decline
- `DELETE /api/admin/community/posts/:id` - Admin delete
- `DELETE /api/admin/community/posts/:id/replies/:replyId` - Admin delete reply

**Database**:
- Add status, approved_by, approved_at, decline_reason to posts
- Create `community_activity_log` table

**Services**:
- `CommunityModerationService.approv Post()`
- `CommunityModerationService.declinePost()`
- `CommunityModerationService.deletePost()`
- `CommunityModerationService.logActivity()`

### Phase 4: Admin Controls (Week 2-3)

**Endpoints**:
- `POST /api/admin/community/users/:userId/ban` - Ban user
- `PUT /api/admin/community/users/:userId/unban` - Unban user
- `POST /api/admin/community/categories` - Create category
- `DELETE /api/admin/community/categories/:id` - Delete category
- `GET /api/admin/community/activity` - Activity log

**Database**:
- Create `community_banned_users` table

**Services**:
- `CommunityModerationService.banUser()`
- `CommunityModerationService.unbanUser()`
- `CommunityCategoryService.createCategory()`
- `CommunityCategoryService.deleteCategory()`

### Phase 5: Validation & Polish (Week 3)

- Input validation (Zod schemas)
- Rate limiting
- Content filtering (spam, profanity)
- Error handling
- Testing

---

## Development Guide

### Step-by-Step Backend Implementation

#### 1. Create Database Migrations

```typescript
// backend/src/db/migrations/001_community.sql
CREATE TABLE community_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(50) DEFAULT 'primary',
  posts_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  category_id INT NOT NULL REFERENCES community_categories(id),
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  type VARCHAR(20) DEFAULT 'text',
  status ENUM ('pending', 'approved', 'declined') DEFAULT 'pending',
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- ... other tables
```

#### 2. Define Zod Schemas

```typescript
// backend/src/utils/validation.ts
export const createPostSchema = z.object({
  content: z.string().min(1).max(5000),
  category: z.string().min(1),
  isAnonymous: z.boolean().optional(),
  mediaIds: z.array(z.string().uuid()).optional(),
  pollOptions: z.array(z.string()).optional(),
  type: z.enum(['text', 'poll', 'image', 'video']).optional(),
});

export const approvePostSchema = z.object({
  reason: z.string().optional(),
});

export const banUserSchema = z.object({
  reason: z.string().min(1),
  durationDays: z.number().positive().optional(),
});
```

#### 3. Create Services

```typescript
// backend/src/api/services/communityPostService.ts
export class CommunityPostService {
  static async createPost(userId: string, data: CreatePostData) {
    // Check user is not banned
    const isBanned = await this.isUserBanned(userId);
    if (isBanned) throw new ForbiddenError("User is banned");

    // Validate input
    const validated = createPostSchema.parse(data);

    // Create post
    const post = await db.insert(communityPosts).values({
      userId,
      categoryId: parseInt(validated.category),
      content: validated.content,
      isAnonymous: validated.isAnonymous || false,
      type: validated.type || 'text',
      status: 'pending',
    }).returning();

    return post[0];
  }

  static async getAllApprovedPosts(params: PaginationParams) {
    const { page = 1, limit = 20, category, search } = params;

    let query = db.select().from(communityPosts)
      .where(eq(communityPosts.status, 'approved'));

    if (category) {
      query = query.where(eq(communityPosts.categoryId, parseInt(category)));
    }

    if (search) {
      query = query.where(ilike(communityPosts.content, `%${search}%`));
    }

    const offset = (page - 1) * limit;
    const posts = await query.limit(limit).offset(offset);
    const total = await db.select({ count: count() }).from(communityPosts);

    return {
      posts: posts.map(p => this.formatPost(p)),
      pagination: { page, limit, total: total[0].count }
    };
  }

  static async deletePost(postId: string, userId: string) {
    const post = await db.query.communityPosts.findFirst({
      where: eq(communityPosts.id, postId),
    });

    if (!post) throw new NotFoundError("Post not found");
    if (post.userId !== userId && !isAdmin(userId)) {
      throw new ForbiddenError("Cannot delete other user's post");
    }

    await db.delete(communityPosts).where(eq(communityPosts.id, postId));
    return { success: true };
  }

  static async toggleLike(postId: string, userId: string) {
    // Check if already liked
    const existing = await db.query.communityPostLikes.findFirst({
      where: and(
        eq(communityPostLikes.postId, postId),
        eq(communityPostLikes.userId, userId)
      ),
    });

    if (existing) {
      // Unlike
      await db.delete(communityPostLikes).where(
        and(
          eq(communityPostLikes.postId, postId),
          eq(communityPostLikes.userId, userId)
        )
      );

      await db.update(communityPosts)
        .set({ likesCount: sql`likes_count - 1` })
        .where(eq(communityPosts.id, postId));
    } else {
      // Like
      await db.insert(communityPostLikes).values({ postId, userId });
      await db.update(communityPosts)
        .set({ likesCount: sql`likes_count + 1` })
        .where(eq(communityPosts.id, postId));
    }

    const updated = await db.query.communityPosts.findFirst({
      where: eq(communityPosts.id, postId),
    });

    return { likes: updated.likesCount };
  }

  private static async isUserBanned(userId: string) {
    const banned = await db.query.communityBannedUsers.findFirst({
      where: and(
        eq(communityBannedUsers.userId, userId),
        isNull(communityBannedUsers.unbannedAt)
      ),
    });
    return !!banned;
  }

  private static formatPost(post: any) {
    return {
      ...post,
      author: post.isAnonymous ? { name: "Anonymous" } : { name: post.userName },
      status: post.status,
      category: post.categoryName,
    };
  }
}
```

#### 4. Create Routes

```typescript
// backend/src/api/routes/community.ts
import { CommunityPostService } from '../services/communityPostService';

const router = express.Router();

// Create post (pending approval)
router.post('/posts', authenticateToken, async (req, res, next) => {
  try {
    const post = await CommunityPostService.createPost(req.user.id, req.body);
    res.status(201).json({ success: true, data: { post } });
  } catch (error) {
    next(error);
  }
});

// Get approved posts
router.get('/posts', async (req, res, next) => {
  try {
    const result = await CommunityPostService.getAllApprovedPosts(req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Like post
router.put('/posts/:id/like', authenticateToken, async (req, res, next) => {
  try {
    const result = await CommunityPostService.toggleLike(req.params.id, req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Delete own post
router.delete('/posts/:id', authenticateToken, async (req, res, next) => {
  try {
    await CommunityPostService.deletePost(req.params.id, req.user.id);
    res.json({ success: true, data: { message: "Post deleted" } });
  } catch (error) {
    next(error);
  }
});

export default router;
```

---

## Integration Checklist

### Frontend Ready (100%)
- ✅ CommunityFeed.tsx with all UI
- ✅ AdminCommunity.tsx with moderation UI
- ✅ CommunityRules.tsx with guidelines
- ⚠️ Using mock/hardcoded data
- ⚠️ No Redux state management yet

### Backend Required
- ⚠️ API endpoints (in progress)
- ⚠️ Database schema (in progress)
- ⚠️ Authentication & authorization
- ⚠️ Content validation & filtering
- ⚠️ Rate limiting & abuse prevention
- ⚠️ Testing

### Integration Steps
1. Create Redux slices for community state
2. Replace hardcoded data with API calls
3. Implement error handling & loading states
4. Add Redux async thunks (createPost, approvePost, etc.)
5. Connect components to Redux
6. Test all flows end-to-end

---

This comprehensive guide covers the entire community feature from frontend implementation to backend API requirements and database design.
