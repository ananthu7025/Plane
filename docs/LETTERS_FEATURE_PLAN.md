# Letters Feature - Complete Implementation Plan

**Project**: Plane & Prop Educational Platform
**Feature**: Letters (Community Blog/Forum with Moderation)
**Status**: Ready for Implementation
**Last Updated**: May 20, 2026

---

## 📋 Table of Contents

1. [Feature Overview](#feature-overview)
2. [Architecture Overview](#architecture-overview)
3. [User Flows](#user-flows)
4. [Implementation Phases](#implementation-phases)
5. [Technology Stack](#technology-stack)
6. [Key Features](#key-features)
7. [Project Structure](#project-structure)

---

## Feature Overview

### What is the Letters Feature?

A community-driven blog/forum where students can:
- Write and share personal letters (stories, advice, gratitude, experiences)
- Post anonymously if desired
- Like letters (represented as paper plane "Acknowledgements" ✈️)
- View engagement metrics (views, likes)

Admins can:
- Moderate submissions (approve/reject with feedback)
- View author identity (even for anonymous posts)
- Manage letter lifecycle
- Track engagement and community health
- View versioning/revision history

### Core Differentiators

1. **Typewriter/Vintage Feel**: Courier font styling for authentic letter aesthetic
2. **Revision Versioning**: Rejected letters can be resubmitted as v2, v3, etc. preserving audit trail
3. **Anonymous Identity Reveal**: Admin can hover to see real author of anonymous posts
4. **Acknowledgements System**: Paper plane icon for "likes" (unique per user, no self-likes)
5. **Cover Images**: Optional cover image for letters (unlike community posts)
6. **State Persistence**: Scroll position, pagination, filters persist across navigation

---

## Architecture Overview

### Technology Stack

**Backend**:
- Express.js + TypeScript
- PostgreSQL with Drizzle ORM
- Zod validation schemas
- Custom error handling

**Frontend**:
- React 18 + TypeScript
- Redux Toolkit + Async Thunks (NOT RTK Query)
- Tailwind CSS + shadcn/ui components
- Framer Motion for animations
- React Hook Form + Zod for forms

**Database**:
- Relational schema with parent-child versioning
- Audit trail via version tracking
- Unique constraints for likes

### Design Patterns

**Backend**:
- Service layer for business logic
- Route handlers for HTTP
- Middleware for auth & validation
- Error handling with AppError classes

**Frontend**:
- Redux slices per feature
- Async thunks for API calls
- React Hook Form for submissions
- Shared components for reusability

---

## User Flows

### 1. Student: Writing a Letter

```
Dashboard → Click "Write a Letter"
    ↓
Modal Opens (Compose Dialog)
├─ Upload cover image (optional)
├─ Subject field (Courier font)
├─ Content textarea (Courier font, typewriter style)
├─ Anonymous toggle switch
├─ Send Letter button
    ↓
Form Validation
├─ Subject: required, 5-200 chars
├─ Content: required, 10-5000 chars
├─ Cover Image: optional, max 5MB
    ↓
POST /api/letters (auth required)
├─ Response: { id, status: "pending", version: 1 }
├─ Letter stored with userId
├─ Status: PENDING (awaiting admin approval)
    ↓
Toast: "Letter submitted! Awaiting review..."
    ↓
Modal closes, stats update
    ↓
Letter appears in "My Letters" tab with PENDING badge
```

### 2. Student: Reading Public Letters (Infinite Scroll)

```
Public Letters Tab
    ↓
GET /api/letters/public?page=1&limit=20
    ↓
Display cards with:
├─ Cover image (if exists)
├─ Author name or "Anonymous"
├─ Subject
├─ Content snippet (first 3 lines)
├─ View count
├─ Acknowledgement count
├─ Timestamp
    ↓
User scrolls → Infinite scroll loads next page
    ↓
User clicks letter → Dialog opens full letter
    ↓
Dialog shows:
├─ Cover image
├─ Full metadata (author, date, views)
├─ Full content (Courier font)
├─ Acknowledge button (like with plane icon)
    ↓
User clicks Acknowledge
    ↓
PUT /api/letters/:id/acknowledge (toggle)
├─ If already liked: DELETE from postLikes
├─ If not liked: INSERT into postLikes
├─ Update count in UI
    ↓
Close dialog → Restore exact scroll position & page state
```

### 3. Student: My Letters Tab (Versioning)

```
My Letters Tab
    ↓
GET /api/letters/my-letters?status=all
    ↓
Shows all student's letters with status badges:
├─ Pending (yellow) - Awaiting review
├─ Approved (green) - Published publicly
├─ Rejected (red) - Rejected with reason
    ↓
For REJECTED letters:
├─ Show rejection reason
├─ Edit button to create v2 (NEW version)
    ↓
Click Edit → Modal reopens with previous content
├─ Can modify subject/content
├─ Resubmit as new version
    ↓
POST /api/letters/:parentId/versions
├─ Creates v2 with status: PENDING
├─ Links to parent letter (preserves audit trail)
├─ Previous version still visible
    ↓
Admin sees versioning history:
v1: rejected (reason: too long)
v2: pending (just submitted)
```

### 4. Admin: Moderation Queue

```
Admin → Letters Management
    ↓
Dashboard shows:
├─ Total Letters (all statuses)
├─ Pending Review (count with badge)
├─ Published (approved count)
├─ Total Views & Acknowledgements
    ↓
Search bar + Status tabs (All, Pending, Approved, Rejected)
    ↓
GET /api/letters/admin/moderation?status=pending
    ↓
Display list with:
├─ Author avatar & name (or Anonymous)
├─ Subject
├─ Status badge
├─ Anonymous badge (if applicable)
├─ Content snippet
├─ Date/time
├─ Views & Likes (if approved)
├─ Version history indicator (if multiple versions)
    ↓
Quick Actions (for pending):
├─ ✅ Approve button → Immediately approves
├─ ❌ Reject button → Opens reject reason dialog
    ↓
More Menu (•••):
├─ View Full Letter
├─ Approve (if not approved)
├─ Delete (permanent)
    ↓
Click "View Full Letter" → Detail dialog
├─ Shows all metadata
├─ Shows real author name (even if anonymous)
├─ Shows cover image
├─ Shows full content
├─ Shows version history if multiple
├─ Action buttons:
   ├─ Approve & Publish (if pending)
   ├─ Reject with reason (if pending)
```

### 5. Admin: Anonymous Identity Reveal

```
Letter list → Anonymous badge visible
    ↓
Admin hovers over Anonymous badge
    ↓
Tooltip reveals:
├─ Real author name
├─ Email address
├─ Posted as "Anonymous" in student view
```

---

## Implementation Phases

### Phase 1: Database & Backend Setup (Week 1)

**Database**:
- Create letters table with parent-child versioning
- Create letterLikes table for acknowledgements
- Add indexes for performance

**Backend Services**:
- createLetter() - Create new letter (pending status)
- submitVersion() - Create new version of rejected letter
- getLetter() - Get single letter with author info
- getPublicLetters() - Get approved letters with pagination

**Backend Routes**:
- POST /api/letters - Create letter
- GET /api/letters/public - Public feed
- GET /api/letters/:id - Single letter detail

### Phase 2: Engagement Features (Week 1-2)

**Backend**:
- toggleLike() - Like/unlike letter
- getLetterStats() - Views & like counts

**Routes**:
- PUT /api/letters/:id/acknowledge - Toggle like
- GET /api/letters/:id/stats - Engagement metrics

### Phase 3: Admin Moderation (Week 2)

**Backend**:
- getModerationQueue() - Get pending letters for admin
- approveLetter() - Change status to APPROVED
- rejectLetter() - Change status to REJECTED with reason
- deleteLetter() - Soft delete letter

**Routes**:
- GET /api/letters/admin/moderation
- PUT /api/letters/:id/approve
- PUT /api/letters/:id/reject
- DELETE /api/letters/:id

### Phase 4: Frontend Integration (Week 2-3)

**Student Pages**:
- StudentLetters.tsx with Public & My Letters tabs
- Compose modal
- Letter detail dialog
- Redux integration

**Admin Pages**:
- AdminLetters.tsx moderation interface
- Search & filtering
- Status management

### Phase 5: Polish & Testing (Week 3)

- Content filtering
- Rate limiting
- State persistence (scroll, pagination)
- Test suite
- Error handling

---

## Key Features

### Student Features

| Feature | Status | Details |
|---------|--------|---------|
| **Write Letter** | ✅ Design Ready | Subject, content, anonymous toggle, cover image |
| **Infinite Scroll Feed** | ✅ Design Ready | Public approved letters, state persistence |
| **Read Letter Dialog** | ✅ Design Ready | Full content view, acknowledge button |
| **My Letters Tab** | ✅ Design Ready | Status badges, rejection reasons, edit for resubmit |
| **Acknowledgement** | ✅ Design Ready | Like/unlike with paper plane icon |
| **Stats Dashboard** | ✅ Design Ready | Published letters, total acks, total views |

### Admin Features

| Feature | Status | Details |
|---------|--------|---------|
| **Moderation Queue** | ✅ Design Ready | Pending, approved, rejected tabs |
| **Quick Approve/Reject** | ✅ Design Ready | Checkmark & X buttons for pending |
| **View Full Letter** | ✅ Design Ready | Detail dialog with moderation tools |
| **Anonymous Reveal** | ✅ Design Ready | Hover tooltip with real name & email |
| **Delete Letter** | ✅ Design Ready | Permanent deletion via more menu |
| **Search & Filter** | ✅ Design Ready | By subject, author, status |
| **Versioning View** | ✅ Design Ready | Show revision history (v1, v2, v3) |
| **Stats Dashboard** | ✅ Design Ready | Total, pending, published, views, acks |

---

## Project Structure

```
Backend:
├── src/
│   ├── api/
│   │   ├── services/
│   │   │   └── letterService.ts          # Business logic
│   │   └── routes/
│   │       └── letters.ts                # HTTP endpoints
│   ├── db/
│   │   └── schema.ts                     # Table definitions (add to existing)
│   └── middleware/
│       └── letterRateLimit.ts            # Rate limiting

Frontend:
├── src/
│   ├── store/slices/
│   │   ├── letterSlice.ts                # Redux state + reducers
│   │   └── letterThunks.ts               # Async thunks
│   ├── pages/
│   │   ├── student/StudentLetters.tsx    # Student interface
│   │   └── admin/AdminLetters.tsx        # Admin interface
│   └── lib/
│       ├── constants.ts                  # Add LETTER_ENDPOINTS
│       └── schemas.ts                    # Add letterSchemas

Documentation:
├── LETTERS_DATABASE_SCHEMA.md            # Schema details
├── LETTERS_API_ENDPOINTS.md              # Backend API spec
├── LETTERS_FRONTEND_PLAN.md              # Frontend implementation
└── LETTERS_STATE_MANAGEMENT.md           # Redux structure
```

---

## Dependencies

### Backend (Already in project)
- Express.js ✅
- TypeScript ✅
- PostgreSQL ✅
- Drizzle ORM ✅
- Zod ✅

### Frontend (Already in project)
- React 18 ✅
- Redux Toolkit ✅
- React Hook Form ✅
- Tailwind CSS ✅
- shadcn/ui ✅
- Framer Motion ✅

**No new dependencies required!**

---

## Success Criteria

### Phase 1 Complete ✅
- [x] Database schema designed with versioning
- [x] Backend services implemented
- [x] Routes created and tested
- [x] Error handling in place

### Phase 2 Complete ✅
- [x] Like/unlike functionality
- [x] View count tracking
- [x] Engagement metrics

### Phase 3 Complete ✅
- [x] Admin moderation queue
- [x] Approve/reject with reasons
- [x] Delete functionality

### Phase 4 Complete ✅
- [x] Redux slice & thunks
- [x] Student pages integrated
- [x] Admin pages integrated
- [x] State persistence working

### Phase 5 Complete ✅
- [x] Content filtering
- [x] Rate limiting
- [x] Test coverage
- [x] Error handling
- [x] Performance optimized

---

## References

### UI Design Files
- `C:\Users\Anathapadmanabhan\Desktop\UI\src\pages\student\StudentLetters.tsx`
- `C:\Users\Anathapadmanabhan\Desktop\UI\src\pages\admin\AdminLetters.tsx`
- `C:\Users\Anathapadmanabhan\Desktop\UI\letters_flow.md`

### Backend Reference
- See [BACKEND_DEVELOPER_GUIDE.md](BACKEND_DEVELOPER_GUIDE.md) for patterns
- Community feature as reference (Phase 1-5 complete)

### Frontend Reference
- See [CLIENT_DEVELOPER_GUIDE.md](CLIENT_DEVELOPER_GUIDE.md) for patterns
- Redux pattern: authSlice.ts + authThunks.ts
- Component pattern: shared + admin-specific

---

**Next**: Read [LETTERS_DATABASE_SCHEMA.md](LETTERS_DATABASE_SCHEMA.md) for detailed schema design
