# Letters Feature - Backend API Endpoints

**Status**: Specification Complete
**Last Updated**: May 20, 2026
**Authentication**: JWT (Bearer token)

---

## Table of Contents

1. [API Overview](#api-overview)
2. [Error Handling](#error-handling)
3. [Student Endpoints](#student-endpoints)
4. [Admin Endpoints](#admin-endpoints)
5. [Response Examples](#response-examples)
6. [Rate Limiting](#rate-limiting)

---

## API Overview

### Base URL
```
http://localhost:5000/api/letters
```

### Authentication Header
```
Authorization: Bearer <accessToken>
```

### Response Format (All Endpoints)

**Success (2xx)**:
```json
{
  "success": true,
  "data": { /* response data */ },
  "error": null,
  "timestamp": "2024-11-18T10:30:00Z"
}
```

**Error (4xx/5xx)**:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { "field": "value" }
  },
  "timestamp": "2024-11-18T10:30:00Z"
}
```

---

## Error Handling

### Standard Error Codes

| Code | Status | Description |
|------|--------|-------------|
| VALIDATION_ERROR | 400 | Input validation failed |
| UNAUTHORIZED | 401 | Missing or invalid token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Letter/version not found |
| CONFLICT | 409 | Letter already exists in that state |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| SERVER_ERROR | 500 | Internal server error |

### Common Errors

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Subject must be 5-200 characters",
    "details": { "field": "subject", "type": "length" }
  }
}
```

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Letter not found"
  }
}
```

---

## Student Endpoints

### 1. Create a Letter

**Endpoint**: `POST /api/letters`

**Authentication**: Required (Student/Mentor/Admin)

**Request Body**:
```json
{
  "subject": "My First Solo Flight",
  "content": "Today was the best day of my life...",
  "isAnonymous": false,
  "coverImageMediaId": "media-123" // Optional
}
```

**Validation**:
- `subject`: Required, 5-200 characters
- `content`: Required, 10-5000 characters
- `isAnonymous`: Optional, boolean (default false)
- `coverImageMediaId`: Optional, must be valid UUID

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "letter-001",
    "userId": "user-123",
    "subject": "My First Solo Flight",
    "status": "pending",
    "currentVersion": 1,
    "isAnonymous": false,
    "createdAt": "2024-11-18T10:30:00Z"
  }
}
```

**Implementation Notes**:
- Letter created with status "pending"
- First version created automatically
- No views/likes until approved
- User becomes original author

---

### 2. Resubmit Letter (Create Version)

**Endpoint**: `POST /api/letters/:letterId/versions`

**Authentication**: Required (Original author only)

**Description**: Resubmit a rejected letter as a new version.

**Request Body**:
```json
{
  "subject": "My First Solo Flight (Revised)",
  "content": "Today was the best day...",
  "coverImageMediaId": "media-124" // Optional
}
```

**Validation**:
- Letter must exist and belong to current user
- Letter must have status "rejected"
- New content can be different
- Uses same validation as create

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "version-002",
    "letterId": "letter-001",
    "versionNumber": 2,
    "status": "pending",
    "subject": "My First Solo Flight (Revised)",
    "createdAt": "2024-11-18T14:15:00Z"
  }
}
```

**Implementation Notes**:
- Creates new version linked to same letter
- Increments `currentVersion` and `totalVersions` on parent
- Previous version stays in DB with rejection reason
- Status goes back to "pending"

---

### 3. Get Public Letters (Feed)

**Endpoint**: `GET /api/letters/public`

**Authentication**: Optional (Public data)

**Query Parameters**:
```
page=1                  (default: 1, min: 1)
limit=20                (default: 20, max: 100)
sort=recent             (recent|views|likes, default: recent)
search=query            (optional, searches subject + content)
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "letters": [
      {
        "id": "letter-001",
        "userId": "user-123",
        "subject": "My First Solo Flight",
        "contentSnippet": "Today was the best day...",
        "author": {
          "id": "user-123",
          "fullName": "Sneha Patel"
        },
        "isAnonymous": false,
        "viewCount": 342,
        "likeCount": 87,
        "createdAt": "2024-11-18T10:30:00Z",
        "coverImageUrl": "https://..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 156,
      "hasMore": true,
      "totalPages": 8
    }
  }
}
```

**Implementation Notes**:
- Only returns APPROVED letters
- Shows "Anonymous" for author if isAnonymous=true
- View/like counts from latest version
- Snippet is first 150 chars of content
- Sorted by submittedAt DESC by default
- Supports infinite scroll with page/limit

---

### 4. Get Letter Detail

**Endpoint**: `GET /api/letters/:letterId`

**Authentication**: Optional

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "letter-001",
    "userId": "user-123",
    "subject": "My First Solo Flight",
    "content": "Today was the best day of my life...",
    "author": {
      "id": "user-123",
      "fullName": "Sneha Patel",
      "avatarUrl": "https://..."
    },
    "isAnonymous": false,
    "status": "approved",
    "viewCount": 342,
    "likeCount": 87,
    "currentUserLiked": false,
    "createdAt": "2024-11-18T10:30:00Z",
    "approvedAt": "2024-11-18T14:30:00Z",
    "coverImageUrl": "https://..."
  }
}
```

**Implementation Notes**:
- Returns full content for approved letters only
- For anonymous letters, shows "Anonymous" as author
- `currentUserLiked`: true if authenticated user already liked
- Increments view count (if approved)
- 404 if letter not found or not approved

---

### 5. Toggle Like on Letter

**Endpoint**: `PUT /api/letters/:letterId/acknowledge`

**Authentication**: Required

**Method**: PUT (toggle on/off)

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "letterId": "letter-001",
    "likeCount": 88,
    "userLiked": true,
    "timestamp": "2024-11-18T15:45:00Z"
  }
}
```

**Implementation Notes**:
- Toggle like (no request body needed)
- Returns new like count
- If already liked: DELETE
- If not liked: INSERT
- Prevents self-likes (validation in service)
- Updates like_count in letterVersions
- 400 if trying to like own letter
- 404 if letter not found/approved

---

### 6. Get My Letters

**Endpoint**: `GET /api/letters/my-letters`

**Authentication**: Required

**Query Parameters**:
```
status=all              (all|pending|approved|rejected, default: all)
page=1                  (default: 1)
limit=20                (default: 20)
includeVersions=false   (default: false, true shows all versions)
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "letters": [
      {
        "id": "letter-001",
        "subject": "My First Solo Flight",
        "status": "approved",
        "currentVersion": 1,
        "totalVersions": 1,
        "isAnonymous": false,
        "viewCount": 342,
        "likeCount": 87,
        "submittedAt": "2024-11-18T10:30:00Z",
        "approvedAt": "2024-11-18T14:30:00Z",
        "versions": [
          {
            "versionNumber": 1,
            "status": "approved",
            "submittedAt": "2024-11-18T10:30:00Z"
          }
        ]
      },
      {
        "id": "letter-002",
        "subject": "Advice for New Students",
        "status": "rejected",
        "currentVersion": 1,
        "totalVersions": 1,
        "isAnonymous": true,
        "rejectionReason": "Please add more specific examples",
        "submittedAt": "2024-11-17T09:00:00Z",
        "rejectedAt": "2024-11-17T16:30:00Z",
        "versions": [
          {
            "versionNumber": 1,
            "status": "rejected",
            "rejectionReason": "Please add more specific examples",
            "rejectedAt": "2024-11-17T16:30:00Z"
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "hasMore": false
    }
  }
}
```

**Implementation Notes**:
- Returns all versions if `includeVersions=true`
- Shows rejection reason for rejected letters
- Includes view/like metrics for approved
- Sorted by submittedAt DESC
- Only returns letters belonging to current user

---

### 7. Get Letter Versions

**Endpoint**: `GET /api/letters/:letterId/versions`

**Authentication**: Required (Original author or admin)

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "letterId": "letter-001",
    "versions": [
      {
        "id": "version-001",
        "versionNumber": 1,
        "subject": "My First Solo Flight",
        "status": "rejected",
        "rejectionReason": "Too lengthy, please shorten",
        "submittedAt": "2024-11-14T10:30:00Z",
        "rejectedAt": "2024-11-14T16:45:00Z",
        "rejectedByAdmin": { "id": "admin-001", "fullName": "John Doe" }
      },
      {
        "id": "version-002",
        "versionNumber": 2,
        "subject": "My First Solo Flight (Revised)",
        "status": "pending",
        "submittedAt": "2024-11-15T09:15:00Z",
        "rejectedAt": null
      }
    ]
  }
}
```

---

## Admin Endpoints

### 8. Get Moderation Queue

**Endpoint**: `GET /api/letters/admin/moderation`

**Authentication**: Required (Admin only)

**Query Parameters**:
```
status=all              (all|pending|approved|rejected, default: pending)
page=1                  (default: 1)
limit=20                (default: 20)
sort=recent             (recent|oldest|author, default: recent)
search=query            (optional, searches subject + author name)
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "letters": [
      {
        "id": "letter-002",
        "userId": "user-456",
        "subject": "Confessions of a Failed Pilot",
        "contentSnippet": "I'm writing this with a heavy heart...",
        "author": {
          "id": "user-456",
          "fullName": "Priya Sharma",
          "email": "priya@example.com"
        },
        "isAnonymous": true,
        "status": "pending",
        "submittedAt": "2024-11-18T08:00:00Z",
        "currentVersion": 1,
        "totalVersions": 1,
        "versionHistory": [
          { "versionNumber": 1, "status": "pending", "submittedAt": "2024-11-18T08:00:00Z" }
        ],
        "coverImageUrl": null,
        "viewCount": 0,
        "likeCount": 0
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 3, "hasMore": false },
    "stats": {
      "totalLetters": 45,
      "pendingCount": 3,
      "approvedCount": 35,
      "rejectedCount": 7
    }
  }
}
```

**Implementation Notes**:
- Always shows real author info (even for anonymous)
- Shows version history for context
- Default sorts pending by recent
- Includes quick action buttons in UI

---

### 9. Approve Letter

**Endpoint**: `PUT /api/letters/:letterId/approve`

**Authentication**: Required (Admin only)

**Request Body**: (Empty)

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "letter-001",
    "status": "approved",
    "approvedAt": "2024-11-18T16:30:00Z",
    "approvedByAdmin": {
      "id": "admin-001",
      "fullName": "John Doe"
    }
  }
}
```

**Implementation Notes**:
- Changes letter status to "approved"
- Updates current version status to "approved"
- Sets approvedAt timestamp
- Records which admin approved
- Makes letter visible in public feed
- 404 if letter not found
- 409 if already approved

---

### 10. Reject Letter

**Endpoint**: `PUT /api/letters/:letterId/reject`

**Authentication**: Required (Admin only)

**Request Body**:
```json
{
  "rejectionReason": "Please add more specific examples and reduce length"
}
```

**Validation**:
- `rejectionReason`: Required, 10-500 characters

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "letter-001",
    "status": "rejected",
    "rejectionReason": "Please add more specific examples and reduce length",
    "rejectedAt": "2024-11-18T16:30:00Z",
    "rejectedByAdmin": {
      "id": "admin-001",
      "fullName": "John Doe"
    }
  }
}
```

**Implementation Notes**:
- Changes letter status to "rejected"
- Updates current version status
- Stores reason for student feedback
- Records which admin rejected
- Student sees reason in "My Letters" tab
- Student can then create v2
- 404 if letter not found
- 409 if already approved/rejected

---

### 11. Delete Letter (Admin)

**Endpoint**: `DELETE /api/letters/:letterId`

**Authentication**: Required (Admin only)

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "message": "Letter deleted successfully",
    "letterId": "letter-001"
  }
}
```

**Implementation Notes**:
- Soft delete: sets deletedAt and isDeleted
- Preserves data in DB
- Removes from public feed
- Can optionally add hard delete endpoint later
- 404 if letter not found

---

### 12. Get Letter Stats (Admin)

**Endpoint**: `GET /api/letters/admin/stats`

**Authentication**: Required (Admin only)

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "totalLetters": 45,
    "pendingLetters": 3,
    "approvedLetters": 35,
    "rejectedLetters": 7,
    "totalViews": 12840,
    "totalAcknowledgements": 2456,
    "averageViews": 286,
    "averageAcknowledgements": 54,
    "recentActivity": {
      "lastApproved": "2024-11-18T14:30:00Z",
      "lastRejected": "2024-11-17T16:45:00Z",
      "lastSubmitted": "2024-11-18T08:00:00Z"
    }
  }
}
```

---

## Response Examples

### Example 1: Create Letter Response

```bash
curl -X POST http://localhost:5000/api/letters \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "My First Solo Flight",
    "content": "Today was the best day of my life...",
    "isAnonymous": false
  }'

# Response:
{
  "success": true,
  "data": {
    "id": "letter-001",
    "userId": "user-123",
    "subject": "My First Solo Flight",
    "status": "pending",
    "currentVersion": 1,
    "isAnonymous": false,
    "createdAt": "2024-11-18T10:30:00Z"
  }
}
```

### Example 2: Get Public Letters (Infinite Scroll)

```bash
curl "http://localhost:5000/api/letters/public?page=1&limit=20&sort=recent"

# Response:
{
  "success": true,
  "data": {
    "letters": [
      {
        "id": "letter-001",
        "subject": "My First Solo Flight",
        "author": { "fullName": "Sneha Patel" },
        "viewCount": 342,
        "likeCount": 87,
        "createdAt": "2024-11-18T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 156,
      "hasMore": true
    }
  }
}
```

### Example 3: Reject Letter (Admin)

```bash
curl -X PUT http://localhost:5000/api/letters/:letterId/reject \
  -H "Authorization: Bearer <adminToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "rejectionReason": "Please add more specific examples"
  }'

# Response:
{
  "success": true,
  "data": {
    "status": "rejected",
    "rejectionReason": "Please add more specific examples",
    "rejectedAt": "2024-11-18T16:30:00Z"
  }
}
```

---

## Rate Limiting

### Limits Per Endpoint

| Endpoint | Limit | Window | Applies To |
|----------|-------|--------|-----------|
| POST /api/letters | 10/hour | 1 hour | Authenticated users |
| POST /api/letters/:id/versions | 20/hour | 1 hour | Authenticated users |
| PUT /api/letters/:id/acknowledge | 100/hour | 1 hour | Authenticated users |
| Admin endpoints | 50/hour | 1 hour | Admin only |

### Rate Limit Headers

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1703005200
```

### Rate Limit Exceeded Response (429)

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again in 3600 seconds",
    "retryAfter": 3600
  }
}
```

---

## Implementation Checklist

- [ ] Create letterService.ts with all business logic
- [ ] Create letters.ts routes with all endpoints
- [ ] Add Zod schemas for validation
- [ ] Add rate limiting middleware
- [ ] Add content filtering (optional profanity check)
- [ ] Test all endpoints
- [ ] Add error handling
- [ ] Document with swagger/postman
- [ ] Add logging/monitoring

---

**Next**: Read [LETTERS_FRONTEND_PLAN.md](LETTERS_FRONTEND_PLAN.md) for frontend implementation
