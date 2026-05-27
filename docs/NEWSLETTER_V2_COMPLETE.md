# Newsletter Feature V2 - Complete Implementation Guide

**Project**: Plane & Prop Educational Platform
**Feature**: Newsletter (PDF Distribution - Web Platform + Mobile App Future)
**Status**: ✅ Ready for Implementation
**Version**: 2.0 (Cloudinary + Platform-Specific Access)
**Updated**: May 26, 2026
**Timeline**: 10-11 days (1.5-2 weeks)

---

## 📑 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Feature Overview](#feature-overview)
3. [Access Model](#access-model)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Frontend Architecture](#frontend-architecture)
7. [Cloudinary Integration](#cloudinary-integration)
8. [Implementation Guide](#implementation-guide)
9. [FAQ & Troubleshooting](#faq--troubleshooting)
10. [Success Criteria](#success-criteria)
11. [Next Steps](#next-steps)

---

## Executive Summary

### Feature Overview

Newsletter feature for Plane & Prop platform that allows admins to upload PDF newsletters and students to preview them on web or access full content via mobile app.

### Key Specifications

**Storage**: Cloudinary (PDF + auto-extracted page images)
**Database**: 2 tables (newsletters, newsletterPages) - Drizzle ORM
**API Endpoints**: 12 total (6 admin + 3 web + 2 public + 4 mobile future)
**Payment**: None - Subscription status managed externally
**Timeline**: 10-11 days (1.5-2 weeks) for web platform
**Complexity**: Low

### Key Advantages

- **Simpler**: 2 tables only, no payment integration
- **Faster**: Cloudinary handles PDF processing automatically
- **Cheaper**: No payment gateway fees, Cloudinary free tier generous
- **Scalable**: Unlimited PDF storage on Cloudinary CDN
- **Platform-Specific**: Separate web (preview) and mobile (full access) experiences
- **Flexible**: Easy to add mobile app later with same database

---

## Feature Overview

### What is the Newsletter Feature?

A content distribution system that allows admins to upload PDF newsletters and students to preview them. The feature uses Cloudinary for PDF storage and automatic page extraction.

### Web Platform

**Admin Features**:
- ✅ Upload PDF newsletters to Cloudinary
- ✅ Set content as "Paid" or "Free"
- ✅ Edit title, description, category
- ✅ Publish/Archive newsletters
- ✅ Delete newsletters (soft delete)

**Student Features (Web)**:
- ✅ Browse all published newsletters
- ✅ View page 1 preview (all users - free + paid)
- ❌ Pages 2+ blocked on web (not available)
- ✅ See lock overlay with "Download Mobile App" button
- ✅ Links to app store for mobile download

### Mobile App (Future Development)

**Student Features**:
- ✅ Download full PDF (after paid subscription)
- ✅ View all pages offline
- ✅ Bookmark and annotations (Future)

---

## Access Model

### Web Platform

```
Page 1 (Preview):
├─ FREE users → ✅ Can view
├─ PAID users → ✅ Can view
└─ GUESTS → ✅ Can view (if logged in or public)

Pages 2+ (Full Content):
├─ ALL USERS → ❌ Not available on web
└─ SHOW → "Download Mobile App" overlay with app store links
```

**Implementation**: Return error code `WEB_RESTRICTED` for pages 2+

### Mobile App (Future)

```
Page 1 (Preview):
├─ ALL USERS → ✅ Can view

Pages 2+ (Full Content):
├─ FREE users → ❌ Blocked (show "Subscribe for full access")
└─ PAID users → ✅ Can view & download
```

**Implementation**: Check `user.subscriptionStatus === 'PAID'` for pages 2+

---

## Database Schema

### Tables Overview

Two simplified tables instead of five:

1. **newsletters** - Main newsletter records with Cloudinary metadata
2. **newsletterPages** - Individual PDF pages extracted as images

### 1. Newsletters Table

```typescript
import {
  pgTable, uuid, varchar, text, bigint, integer, timestamp, boolean,
  index, uniqueIndex,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const newsletters = pgTable(
  'newsletters',
  {
    // Primary Key
    id: uuid('id').primaryKey().defaultRandom(),

    // Content metadata
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    category: varchar('category', { length: 100 }).notNull(),
    // Categories: "Weekly Digest", "Safety", "Career", "Exam Prep", "Meteorology"

    // Cloudinary storage
    cloudinaryPublicId: varchar('cloudinary_public_id', { length: 255 }).notNull(),
    // Example: "planeandprop/newsletters/newsletter-dec-2024"
    // Used to: reference, delete, transform PDFs in Cloudinary

    cloudinaryUrl: varchar('cloudinary_url', { length: 500 }).notNull(),
    // Example: "https://res.cloudinary.com/mycloud/raw/upload/v1734000600/..."
    // Direct link to PDF file on Cloudinary

    cloudinaryThumbnail: varchar('cloudinary_thumbnail', { length: 500 }),
    // Example: "https://res.cloudinary.com/mycloud/image/upload/c_fill,h_300,w_400/..."
    // Generated thumbnail of first page for preview

    // File metadata
    fileSize: bigint('file_size').notNull(),  // Original PDF size in bytes
    pageCount: integer('page_count').notNull(), // Extracted from Cloudinary

    // Access control
    isPaid: boolean('is_paid').notNull().default(true),
    // Web: Page 1 visible to all users regardless of isPaid flag
    // Mobile: Pages 2+ locked for free users, visible for paid users
    // true = Requires subscription for full PDF access
    // false = Free to view on all platforms

    // Status management
    status: varchar('status', { length: 20 }).notNull().default('published'),
    // Values: 'published' | 'archived' | 'draft'

    // Metadata
    uploadedBy: uuid('uploaded_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
    publishedAt: timestamp('published_at').notNull().defaultNow(),
    archivedAt: timestamp('archived_at'),

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'), // Soft delete
  },
  (table) => ({
    statusIdx: index('newsletters_status_idx').on(table.status),
    categoryIdx: index('newsletters_category_idx').on(table.category),
    isPaidIdx: index('newsletters_is_paid_idx').on(table.isPaid),
    publishedIdx: index('newsletters_published_at_idx').on(table.publishedAt),
  }),
);
```

### 2. Newsletter Pages Table

```typescript
export const newsletterPages = pgTable(
  'newsletter_pages',
  {
    // Primary Key
    id: uuid('id').primaryKey().defaultRandom(),

    // Foreign key relationship
    newsletterId: uuid('newsletter_id')
      .notNull()
      .references(() => newsletters.id, { onDelete: 'cascade' }),

    // Page metadata
    pageNumber: integer('page_number').notNull(),
    // Pages numbered 1, 2, 3, ...

    // Cloudinary page image
    cloudinaryImageUrl: varchar('cloudinary_image_url', { length: 500 }).notNull(),
    // Example: "https://res.cloudinary.com/mycloud/image/upload/page_1/c_scale,w_1200/..."
    // URL to fetch the page as JPG image
    // Cloudinary automatically converts PDF pages to images

    cloudinaryPublicId: varchar('cloudinary_public_id', { length: 255 }).notNull(),
    // Example: "planeandprop/newsletters/newsletter-dec-2024/page-1"
    // Used to: update, delete, transform this specific page

    // Optional: Extracted text for search/OCR
    pageText: text('page_text'),
    // Extracted text from PDF for searching (optional - future feature)

    // Timestamp
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    uniqueIdx: uniqueIndex('newsletter_pages_unique_idx').on(
      table.newsletterId,
      table.pageNumber,
    ),
    lookupIdx: index('newsletter_pages_lookup_idx').on(
      table.newsletterId,
      table.pageNumber,
    ),
  }),
);

export type Newsletter = typeof newsletters.$inferSelect;
export type NewsletterInsert = typeof newsletters.$inferInsert;
export type NewsletterPage = typeof newsletterPages.$inferSelect;
export type NewsletterPageInsert = typeof newsletterPages.$inferInsert;
```

### Database Migration

```sql
-- Create newsletters table
CREATE TABLE newsletters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  cloudinary_public_id VARCHAR(255) NOT NULL,
  cloudinary_url VARCHAR(500) NOT NULL,
  cloudinary_thumbnail VARCHAR(500),
  file_size BIGINT NOT NULL,
  page_count INTEGER NOT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT true,
  status VARCHAR(20) NOT NULL DEFAULT 'published',
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  published_at TIMESTAMP NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX newsletters_status_idx ON newsletters(status);
CREATE INDEX newsletters_category_idx ON newsletters(category);
CREATE INDEX newsletters_is_paid_idx ON newsletters(is_paid);
CREATE INDEX newsletters_published_at_idx ON newsletters(published_at);

-- Create newsletter_pages table
CREATE TABLE newsletter_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  newsletter_id UUID NOT NULL REFERENCES newsletters(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  cloudinary_image_url VARCHAR(500) NOT NULL,
  cloudinary_public_id VARCHAR(255) NOT NULL,
  page_text TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX newsletter_pages_unique_idx
  ON newsletter_pages(newsletter_id, page_number);
CREATE INDEX newsletter_pages_lookup_idx
  ON newsletter_pages(newsletter_id, page_number);
```

### Data Examples

**Newsletter Record**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Plane Prop Weekly Newsletter - Dec 2024",
  "description": "Weekly aviation updates and news",
  "category": "Weekly Digest",
  "cloudinaryPublicId": "planeandprop/newsletters/newsletter-dec-2024",
  "cloudinaryUrl": "https://res.cloudinary.com/mycloud/raw/upload/v1734000600/planeandprop/newsletters/newsletter-dec-2024.pdf",
  "cloudinaryThumbnail": "https://res.cloudinary.com/mycloud/image/upload/c_fill,h_300,w_400,q_auto/planeandprop/newsletters/newsletter-dec-2024",
  "fileSize": 2548576,
  "pageCount": 8,
  "isPaid": true,
  "status": "published",
  "uploadedBy": "admin-uuid",
  "publishedAt": "2024-12-02T10:30:00Z",
  "createdAt": "2024-12-02T10:30:00Z",
  "updatedAt": "2024-12-02T10:30:00Z",
  "deletedAt": null
}
```

**Newsletter Page Record**:
```json
{
  "id": "page-uuid-1",
  "newsletterId": "550e8400-e29b-41d4-a716-446655440000",
  "pageNumber": 1,
  "cloudinaryImageUrl": "https://res.cloudinary.com/mycloud/image/upload/page_1/c_scale,w_1200,q_auto/planeandprop/newsletters/newsletter-dec-2024",
  "cloudinaryPublicId": "planeandprop/newsletters/newsletter-dec-2024/page-1",
  "pageText": null,
  "createdAt": "2024-12-02T10:30:00Z"
}
```

---

## API Endpoints

### Endpoints Overview (12 Total)

**Web Platform**:
- ✅ Admin: 6 endpoints (Upload, List, Get, Edit, Delete, Archive)
- ✅ Student: 3 endpoints (List, Get, Page 1 Only)
- ✅ Public: 2 endpoints (List, Get without auth)
- **Total Current**: 11 endpoints

**Mobile App** (Future):
- Mobile endpoints (4): List, Get, Download PDF, Get page with subscription check

### Admin Endpoints (6)

#### 1. POST /api/admin/newsletters
**Upload new newsletter via Cloudinary**

**Request**:
```
Content-Type: multipart/form-data

Fields:
- title: string (required)
- description: string (optional)
- category: string (required)
- isPaid: boolean (required) - true = paid users only, false = free
- file: File (required, PDF, max 50MB)
```

**Response (201)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Plane Prop Weekly Newsletter",
    "category": "Weekly Digest",
    "cloudinaryPublicId": "planeandprop/newsletters/newsletter-dec-2024",
    "cloudinaryUrl": "https://res.cloudinary.com/.../",
    "cloudinaryThumbnail": "https://res.cloudinary.com/.../c_fill,h_300,w_400/",
    "pageCount": 8,
    "fileSize": 2548576,
    "isPaid": true,
    "status": "published",
    "createdAt": "2024-12-02T10:30:00Z"
  }
}
```

**Implementation Notes**:
- Upload PDF to Cloudinary using API
- Use Cloudinary's PDF processing to extract pages
- Generate thumbnail: `c_fill,h_300,w_400/f_auto,q_auto`
- Extract page count from Cloudinary response
- Store all Cloudinary metadata in database
- Extract page images for each page

#### 2. GET /api/admin/newsletters
**List all newsletters**

**Query Parameters**:
```
status: "published" | "archived" | "all"
search: string
category: string
isPaid: boolean (filter by paid/free)
page: number
limit: number
sort: "recent" | "oldest"
```

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "newsletters": [
      {
        "id": "uuid",
        "title": "...",
        "category": "Weekly Digest",
        "pageCount": 8,
        "isPaid": true,
        "status": "published",
        "uploadedBy": { "id": "...", "fullName": "..." },
        "publishedAt": "2024-12-02T10:30:00Z"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 45, "totalPages": 3 }
  }
}
```

#### 3. GET /api/admin/newsletters/:id
**Get single newsletter details**

#### 4. PUT /api/admin/newsletters/:id
**Edit newsletter metadata (title, description, category, isPaid)**

**Request**:
```json
{
  "title": "Updated Title",
  "description": "...",
  "category": "Safety",
  "isPaid": false
}
```

#### 5. DELETE /api/admin/newsletters/:id
**Delete newsletter (soft delete)**

#### 6. PUT /api/admin/newsletters/:id/status
**Toggle archive status**

**Request**:
```json
{
  "status": "archived"
}
```

### Web Student Endpoints (3)

#### 7. GET /api/newsletters/web
**List published newsletters (web platform)**

**Response includes**:
```json
{
  "newsletters": [
    {
      "id": "uuid",
      "title": "...",
      "category": "Weekly Digest",
      "pageCount": 8,
      "cloudinaryThumbnail": "...",
      "isPaid": true,
      "publishedAt": "2024-12-02T10:30:00Z"
    }
  ]
}
```

#### 8. GET /api/newsletters/:id/web
**Get single newsletter details (web platform)**

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "...",
    "description": "...",
    "pageCount": 8,
    "cloudinaryThumbnail": "...",
    "isPaid": true,
    "previewPage": {
      "pageNumber": 1,
      "imageUrl": "https://res.cloudinary.com/.../page_1/"
    }
  }
}
```

#### 9. GET /api/newsletters/:id/pages/1/web
**Get page 1 only (web platform) - ⚠️ IMPORTANT**

**Web platform only supports Page 1 - Pages 2+ return 403 error**

**Valid Request**:
```
GET /api/newsletters/:id/pages/1/web
```

**Response (200) - Page 1**:
```json
{
  "success": true,
  "data": {
    "pageNumber": 1,
    "imageUrl": "https://res.cloudinary.com/.../page_1/",
    "cloudinaryPublicId": "planeandprop/newsletters/.../page-1",
    "isLocked": false
  }
}
```

**Error Response (403) - Page 2+ Not Available**:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "WEB_RESTRICTED",
    "message": "Full content is only available in our Mobile App.",
    "details": {
      "pageNumber": 2,
      "totalPages": 8,
      "redirectMessage": "Download Mobile App to view full newsletter"
    }
  }
}
```

### Public Endpoints (2)

#### 10. GET /api/newsletters/public
**List published newsletters (public, no auth)**

- ✅ No auth required
- ✅ Cache for 24 hours
- ✅ `isPaid` field included
- ✅ Used by homepage, landing page

#### 11. GET /api/newsletters/:id/public
**Get public details (no auth)**

- ✅ No auth required
- ✅ Shows only page 1 (preview image)
- ✅ Does NOT show full page count or locked pages
- ✅ Useful for sharing/preview links

### Mobile Endpoints (Future Development)

**Placeholder for mobile platform endpoints** (future development):

These will be added in future after web platform is deployed and stable:
- `GET /api/newsletters/mobile` - List published (mobile)
- `GET /api/newsletters/:id/mobile` - Get details (mobile)
- `GET /api/newsletters/:id/mobile/download` - Download full PDF (requires subscription)
- `GET /api/newsletters/:id/pages/:page/mobile` - Get page with subscription check

**Mobile differences from web**:
- Full PDF access for paid users
- Download capability
- Offline support
- Mobile device verification
- App token authentication

---

## Frontend Architecture

### Redux State Structure

```typescript
interface NewsletterState {
  // Admin
  adminNewsletters: Newsletter[];
  selectedNewsletter: Newsletter | null;

  // Web Student
  publicNewsletters: Newsletter[];
  currentViewingNewsletter: Newsletter | null;

  // Pagination
  pagination: { page: number; limit: number; total: number; totalPages: number };

  // Filters
  filters: {
    search: string;
    category: string;
    isPaid: boolean | null;
    sort: "recent" | "oldest";
  };

  // UI State (Web Only)
  selectedPageNumber: number; // Always 1 for web
  isUploadDialogOpen: boolean;
  lockedPageMessage: string | null; // Show "Download App" button
  downloadAppUrl: string | null; // App store URL

  // Loading
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}
```

### Async Thunks (8 Total - Web Only)

**Admin Thunks** (5):
- ✅ `getAdminNewsletters()` - List all
- ✅ `uploadNewsletter(formData)` - Upload PDF
- ✅ `updateNewsletter(id, data)` - Update metadata
- ✅ `deleteNewsletter(id)` - Soft delete
- ✅ `toggleNewsletterStatus(id)` - Archive/restore

**Student Thunks (Web)** (3):
- ✅ `getPublicNewsletters()` - List published
- ✅ `getNewsletterById(id)` - Get details (web)
- ✅ `getNewsletterPage(id, pageNumber=1)` - Get page 1 only (throws error for pages 2+)

**Removed** (No payment):
- ❌ initializePayment
- ❌ verifyPayment
- ❌ subscribeToNewsletter
- ❌ subscribeToMonthly

### Components

**Admin Components**:
- `AdminNewsletter.tsx` - Main admin page with newsletter table
- `NewsletterUploadDialog.tsx` - Upload form dialog
- `NewsletterActionMenu.tsx` - Edit/Delete/Archive actions

**Student Components (Web)**:
- `StudentNewsletter.tsx` - Main student page with grid
- `NewsletterCard.tsx` - Grid card component
- `NewsletterViewer.tsx` - Full page viewer (page 1 only)
- `LockOverlay.tsx` - "Download Mobile App" overlay for pages 2+

### NewsletterViewer Component (Web Only)

```typescript
export function NewsletterViewer() {
  const dispatch = useAppDispatch();
  const { currentViewingNewsletter, loading } = useAppSelector(
    state => state.newsletter
  );
  const [pageImage, setPageImage] = useState<string>("");

  // Web platform: Only page 1 is available
  const pageNumber = 1; // Force page 1 on web

  useEffect(() => {
    if (!currentViewingNewsletter) return;

    dispatch(getNewsletterPage({
      id: currentViewingNewsletter.id,
      pageNumber: pageNumber, // Always 1 on web
    }))
      .unwrap()
      .then(result => {
        setPageImage(result.imageUrl);
      })
      .catch(error => {
        if (error.code === "WEB_RESTRICTED") {
          // Show "Download App" overlay instead of page
          return null;
        }
      });
  }, [currentViewingNewsletter?.id]);

  // Check if newsletter has more pages (show "Download App" button)
  const hasMorePages = (currentViewingNewsletter?.pageCount ?? 0) > 1;

  return (
    <Dialog open={!!currentViewingNewsletter}>
      <DialogContent className="max-w-4xl h-[90vh] p-0">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <div>
            <DialogTitle>{currentViewingNewsletter?.title}</DialogTitle>
            {hasMorePages && (
              <p className="text-sm text-muted-foreground">
                📄 {currentViewingNewsletter?.pageCount} pages • Mobile app for full access
              </p>
            )}
          </div>
        </div>

        {/* Web: Page 1 Only Display */}
        <div className="flex-1 bg-muted/30 flex items-center justify-center p-8 overflow-auto">
          {loading ? (
            <Skeleton className="w-full max-w-2xl aspect-[8.5/11]" />
          ) : (
            <>
              <motion.img
                src={pageImage}
                alt="Page 1 Preview"
                className="max-w-2xl aspect-[8.5/11] rounded-lg shadow-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              />

              {/* Lock Overlay for pages 2+ on Web */}
              {hasMorePages && (
                <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                  <motion.div className="text-center bg-white rounded-lg p-8 max-w-sm">
                    <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
                      <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">View Full Content</h3>
                    <p className="text-muted-foreground mb-6">
                      Download our Mobile App to access all {currentViewingNewsletter?.pageCount} pages and read offline.
                    </p>
                    <div className="flex gap-2">
                      <Button className="flex-1">
                        <a href={process.env.VITE_APP_STORE_URL} target="_blank" rel="noopener noreferrer">
                          App Store
                        </a>
                      </Button>
                      <Button className="flex-1" variant="outline">
                        <a href={process.env.VITE_PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
                          Play Store
                        </a>
                      </Button>
                    </div>
                  </motion.div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer - No pagination on web */}
        <div className="p-4 border-t text-center text-sm text-muted-foreground">
          This is a preview. Full newsletter ({currentViewingNewsletter?.pageCount} pages) available in our Mobile App.
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### LockOverlay Component

```typescript
export function LockOverlay({ totalPages, newsletter }: { totalPages: number; newsletter: Newsletter }) {
  return (
    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
      <motion.div className="text-center bg-white rounded-lg p-8 max-w-sm">
        <PhoneIcon className="w-12 h-12 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Download Mobile App</h3>
        <p className="text-muted-foreground mb-6">
          Get access to all {totalPages} pages and read offline.
          Subscribe to unlock full content.
        </p>
        <div className="space-y-2">
          <Button asChild className="w-full">
            <a href={process.env.VITE_APP_STORE_URL} target="_blank" rel="noopener noreferrer">
              Download for iOS
            </a>
          </Button>
          <Button asChild className="w-full" variant="outline">
            <a href={process.env.VITE_PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
              Download for Android
            </a>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
```

---

## Cloudinary Integration

### Setup Instructions

1. **Create Cloudinary Account** at cloudinary.com (free tier available)
2. **Get API Credentials**:
   - Cloud Name
   - API Key
   - API Secret
   - Create unsigned upload preset for client uploads

3. **Add to `.env.local` (Frontend)**:
```bash
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=unsigned_preset_name
VITE_APP_STORE_URL=https://apps.apple.com/app/...
VITE_PLAY_STORE_URL=https://play.google.com/store/apps/details?id=...
```

4. **Add to `.env` (Backend)**:
```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Backend Upload Service

```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadPDFToCloudinary(file: Express.Multer.File, folder: string) {
  const result = await cloudinary.uploader.upload(file.path, {
    folder: `planeandprop/newsletters/${folder}`,
    resource_type: 'raw', // PDF is raw file
    use_filename: true,
    unique_filename: true,
  });

  // Extract pages as images
  const pages: { page: number; url: string; publicId: string }[] = [];

  for (let i = 1; i <= result.pages; i++) {
    const pageUrl = cloudinary.url(result.public_id, {
      resource_type: 'image',
      format: 'jpg',
      page: i,
      quality: 'auto',
      fetch_format: 'auto',
    });

    pages.push({
      page: i,
      url: pageUrl,
      publicId: `${result.public_id}/page-${i}`,
    });
  }

  // Generate thumbnail
  const thumbnail = cloudinary.url(result.public_id, {
    resource_type: 'image',
    format: 'jpg',
    page: 1,
    transformation: [
      { c: 'fill', h: 300, w: 400, quality: 'auto' },
    ],
  });

  return {
    publicId: result.public_id,
    url: result.secure_url,
    thumbnail,
    pageCount: result.pages,
    pages,
    fileSize: result.bytes,
  };
}
```

### Frontend Upload (Optional)

```typescript
export async function uploadPDF(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'planeandprop/newsletters');

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/auto/upload`,
    { method: 'POST', body: formData }
  );

  return response.json();
}
```

### Cloudinary Transformation URLs

**PDF File**:
```
https://res.cloudinary.com/{cloud_name}/raw/upload/{version}/{public_id}.pdf
```

**Page as Image**:
```
https://res.cloudinary.com/{cloud_name}/image/upload/page_{page_number}/c_scale,w_1200,q_auto/{public_id}
```

**Thumbnail**:
```
https://res.cloudinary.com/{cloud_name}/image/upload/c_fill,h_300,w_400,q_auto/{public_id}
```

---

## Implementation Guide

### Step 1: Database Setup (1 day)

- [ ] Create `newsletters` table with Cloudinary fields
- [ ] Create `newsletterPages` table
- [ ] Add indexes and relationships
- [ ] Generate TypeScript types from schema
- [ ] Run migrations on dev database

### Step 2: Backend Services (2 days)

- [ ] Set up Cloudinary integration
- [ ] Create `cloudinaryService.ts` with upload/extract/transform functions
- [ ] Create `newsletterService.ts` with core methods:
  - Create newsletter
  - Update newsletter
  - Delete newsletter (soft)
  - Get newsletter
  - List newsletters
  - Get newsletter page with access control
- [ ] Implement access control logic
- [ ] Test all service methods

### Step 3: Backend Routes (2 days)

- [ ] Implement 6 admin endpoints
- [ ] Implement 3 web student endpoints
- [ ] Implement 2 public endpoints
- [ ] Add authentication middleware
- [ ] Add error handling
- [ ] Add validation (Zod schemas)
- [ ] Test all endpoints with Postman/Insomnia

### Step 4: Redux Setup (1 day)

- [ ] Create `newsletterSlice.ts` with:
  - State shape
  - 10 sync reducers
  - Action creators
- [ ] Create `newsletterThunks.ts` with 8 async thunks
- [ ] Connect to main Redux store
- [ ] Test thunks with Redux DevTools

### Step 5: Admin Frontend (1 day)

- [ ] Modify `AdminNewsletter.tsx` to use Redux
- [ ] Create `NewsletterUploadDialog.tsx`:
  - File input
  - Form fields (title, description, category, isPaid)
  - Upload progress
  - Error handling
- [ ] Create `NewsletterActionMenu.tsx`:
  - Edit button
  - Delete button
  - Archive/restore button
- [ ] Integrate upload dialog into admin page
- [ ] Add table with pagination

### Step 6: Student Frontend (1.5 days)

- [ ] Modify `StudentNewsletter.tsx` to use Redux
- [ ] Create `NewsletterCard.tsx`:
  - Thumbnail image
  - Title & description
  - Category badge
  - Paid badge
  - Click to view
- [ ] Create `NewsletterViewer.tsx`:
  - Display page 1 only
  - Show page 1 image
  - Add lock overlay for multi-page newsletters
  - Link to app store
- [ ] Create `LockOverlay.tsx` component
- [ ] Add grid layout with cards
- [ ] Add filters and search

### Step 7: Testing & Polish (1.5 days)

- [ ] End-to-end flow testing
- [ ] Mobile responsive design
- [ ] Error handling and edge cases
- [ ] Performance optimization
- [ ] Accessibility review
- [ ] Browser compatibility testing

---

---

## FAQ & Troubleshooting

### Q: How do students get paid access?

**A**: Externally managed. You maintain a subscriptions table or flag in users table. Check `user.subscriptionStatus === 'PAID'` before showing pages 2+ in mobile app. Web always shows page 1 only.

### Q: Can users view pages 2+ on web?

**A**: No. Web platform is designed to show page 1 preview only. Full content (pages 2+) is exclusively available in the mobile app after subscription.

### Q: What if user is paid but on web?

**A**: Still can't view pages 2+ on web. It's a platform design decision - show them "Download Mobile App" button instead.

### Q: Can we add payment integration later?

**A**: Yes! Mobile app can integrate payment in the future. Web stays read-only preview.

### Q: Does Cloudinary handle PDF security?

**A**: Yes, direct URLs are fine for public content. Add authentication if needed later.

### Q: What about large PDFs?

**A**: Cloudinary handles up to 2GB files. Set 50MB limit in validation for your use case.

### Q: Will users want to download on mobile?

**A**: Yes - add offline download feature in mobile app when ready.

### Q: How long does Cloudinary page extraction take?

**A**: Usually < 5 seconds for PDFs up to 50MB. Store in queue if needed.

### Q: Can I use React Query instead of Redux?

**A**: Yes! The API contracts are the same. Just replace Redux thunks with React Query hooks.

### Q: What about OCR for searching?

**A**: Future feature. Extract text with Cloudinary's OCR, store in `pageText` field.

---

## Success Criteria

### Backend Complete When:
- [ ] Cloudinary integration working (upload, extract pages, thumbnails)
- [ ] All 11 API endpoints working (6 admin + 3 web + 2 public)
- [ ] Page 1 always accessible
- [ ] Pages 2+ return 403 `WEB_RESTRICTED` error
- [ ] Proper error responses with meaningful messages
- [ ] Validation working (file size, PDF type, etc.)
- [ ] Tests passing (unit + integration)

### Frontend Complete When:
- [ ] Admin can upload & manage newsletters
- [ ] Student can view newsletter list
- [ ] Page 1 displays as preview thumbnail
- [ ] Lock overlay shows with app store links
- [ ] Navigation and filters work
- [ ] Loading states display
- [ ] Error messages show
- [ ] Mobile responsive design
- [ ] Tests passing

### Deployment Ready When:
- [ ] Environment variables set (.env files)
- [ ] Database migrations run
- [ ] Cloudinary account configured
- [ ] API endpoints tested in staging
- [ ] Frontend builds without errors
- [ ] No console errors or warnings
- [ ] Performance acceptable (API < 500ms)
- [ ] Security review passed

---

## Next Steps

### This Week
1. ✅ Read this complete documentation
2. Review database schema with backend team
3. Create Cloudinary account & get credentials
4. Set up project structure and folders
5. Start implementation: Database setup

### Next 2 Weeks (Web Platform Development)
6. Implement backend services & API endpoints
7. Implement Redux state management
8. Build admin components (upload, manage)
9. Build student components (grid, viewer)
10. Integration testing
11. Deploy to staging environment
12. User acceptance testing
13. Deploy to production

### Future (Mobile App Development - Separate Project)
14. Mobile app project setup
15. Mobile API endpoints
16. Mobile app components
17. Full PDF download capability
18. Offline reading support
19. Advanced features (bookmarks, annotations, etc.)

---

## Files to Create/Modify

### Backend
```
src/db/schema.ts                       ← Add newsletters + newsletterPages tables
src/api/services/newsletterService.ts  ← Create (200 lines)
src/api/services/cloudinaryService.ts  ← Create (150 lines)
src/api/routes/newsletters.ts          ← Create (350 lines - web + public + placeholder for mobile)
```

### Frontend
```
src/store/slices/newsletterSlice.ts    ← Create (250 lines)
src/store/slices/newsletterThunks.ts   ← Create (300 lines)
src/pages/admin/AdminNewsletter.tsx    ← Modify (add Redux)
src/pages/student/StudentNewsletter.tsx ← Modify (add Redux for web)
src/components/newsletter/
  ├─ NewsletterUploadDialog.tsx    ← Create (150 lines)
  ├─ NewsletterActionMenu.tsx      ← Create (100 lines)
  ├─ NewsletterCard.tsx            ← Create (100 lines)
  ├─ NewsletterViewer.tsx          ← Create (200 lines - web only, page 1)
  └─ LockOverlay.tsx               ← Create (80 lines - "Download App" button)
```

### Future Files (Mobile App - Separate Project)
```
src/api/routes/mobile-newsletters.ts   ← Create later (400 lines)
src/mobile/pages/MobileNewsletter.tsx  ← Mobile app newsletter view
src/mobile/components/PdfViewer.tsx    ← Mobile PDF viewer
```

---

## Key Implementation Points

✅ **Web Platform**: Page 1 preview only for all users
✅ **No Payment Integration**: Subscription status managed externally
✅ **Cloudinary Handles PDFs**: Auto page extraction and transformations
✅ **Platform-Specific APIs**: Web and mobile endpoints are separate
✅ **Lock Overlay**: Directs users to download mobile app
✅ **Mobile App**: Full PDF access after subscription verification (future)

---

**Version**: 2.0 Complete
**Last Updated**: May 26, 2026
**Status**: ✅ Ready for Implementation
**Estimated Duration**: 10-11 days (1.5-2 weeks)
**Complexity**: LOW
