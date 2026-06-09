# Mentorship Module — Backend Implementation Guide

**PlaneAndProp Backend** • Express.js + TypeScript + PostgreSQL + Drizzle ORM + Microsoft Graph API

---

## Table of Contents

1. [Overview](#overview)
2. [Install Packages](#install-packages)
3. [Environment Variables](#environment-variables)
4. [Step 1 — Add Custom Error Classes](#step-1--add-custom-error-classes)
5. [Step 2 — Add Permission Constant](#step-2--add-permission-constant)
6. [Step 3 — Database Schema](#step-3--database-schema)
7. [Step 4 — Run Migration](#step-4--run-migration)
8. [Step 5 — Types](#step-5--types)
9. [Step 6 — Validation Schemas](#step-6--validation-schemas)
10. [Step 7 — Teams Service](#step-7--teams-service)
11. [Step 8 — Mentorship Service](#step-8--mentorship-service)
12. [Step 9 — Controllers](#step-9--controllers)
13. [Step 10 — Routes](#step-10--routes)
14. [Step 11 — Register in index.ts](#step-11--register-in-indexts)
15. [Step 12 — Reminder Background Service](#step-12--reminder-background-service)
16. [Step 13 — Seed Permission](#step-13--seed-permission)
17. [API Reference](#api-reference)
18. [Implementation Checklist](#implementation-checklist)

---

## Overview

Students submit mentorship session requests. Admins review them — approving, rejecting, or rescheduling. On approval, a Microsoft Teams meeting is created automatically via the Microsoft Graph API and the join URL is stored. Email reminders are sent at 24 h, 1 h, and 15 min before approved meetings.

**Flow:**

```
Student submits request
        ↓ status: PENDING
Admin reviews
        ↓
Approve → Graph API creates Teams meeting → joinWebUrl stored
Reject  → reason stored
Reschedule → new datetime stored, status: RESCHEDULED → Admin approves again
        ↓
Student joins via Teams link
        ↓
Background job sends reminders (24 h / 1 h / 15 min)
```

**Architecture (same 3-layer pattern as all modules):**

```
Route  →  Controller  →  Service  →  Database (Drizzle)
                              ↓
                        TeamsService (Graph API)
```

---

## Install Packages

```bash
cd backend
npm install @azure/msal-node @microsoft/microsoft-graph-client isomorphic-fetch
npm install --save-dev @types/isomorphic-fetch
```

---

## Environment Variables

Add to `backend/.env` and `backend/.env.example`:

```env
# ========== Microsoft Teams / Graph API ==========
TEAMS_TENANT_ID=6bea4f27-a3ee-4946-be9d-cf5889630eda
TEAMS_CLIENT_ID=73165d04-5236-48ba-956e-f7036e810afb
TEAMS_CLIENT_SECRET=<value-from-azure-portal-certificates-and-secrets>
# Entra ID → Users → "Gautham P" → copy Object ID field (NOT the App Registration Object ID)
TEAMS_ORGANIZER_USER_ID=<gautham-p-user-object-id-from-azure-ad>
TEAMS_MEETING_DURATION_MINUTES=60
```

> **How to get `TEAMS_ORGANIZER_USER_ID`:**  
> Azure Portal → Microsoft Entra ID → Users → find "Gautham P" → copy the **Object ID** field.  
> This is the **user's** Object ID, not the App Registration Object ID (`2a3037cb-…`).

---

## Step 1 — Add Custom Error Classes

Add to the bottom of **`backend/src/utils/errors.ts`**:

```typescript
// Mentorship Module Errors
export class MentorshipNotFoundError extends AppError {
  constructor(message: string = "Mentorship request not found") {
    super(404, "MENTORSHIP_NOT_FOUND", message);
  }
}

export class InvalidMentorshipStatusError extends AppError {
  constructor(message: string) {
    super(400, "INVALID_MENTORSHIP_STATUS", message);
  }
}

export class TeamsMeetingCreationError extends AppError {
  constructor(message: string = "Failed to create Microsoft Teams meeting") {
    super(502, "TEAMS_MEETING_CREATION_ERROR", message);
  }
}
```

---

## Step 2 — Add Permission Constant

In **`backend/src/lib/permissions.ts`**, add inside the `Permissions` object:

```typescript
// Mentorship (1)
MANAGE_MENTORSHIP: "MANAGE_MENTORSHIP",
```

---

## Step 3 — Database Schema

Add to **`backend/src/db/schema.ts`** — place enums after the existing enum block and the table after the `users` table.

```typescript
// ── Enums (add after existing enum declarations) ───────────────────────────

export const mentorshipTopicEnum = pgEnum("mentorship_topic", [
  "AIR_NAVIGATION",
  "FLIGHT_PLANNING",
  "METEOROLOGY",
  "AIRCRAFT_SYSTEMS",
  "ATPL_PREPARATION",
  "CPL_PREPARATION",
  "CAREER_GUIDANCE",
  "GENERAL_DOUBT_CLEARING",
]);

export const mentorshipStatusEnum = pgEnum("mentorship_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "RESCHEDULED",
  "COMPLETED",
  "CANCELLED",
]);

// ── Table (add after users table) ─────────────────────────────────────────

export const mentorshipRequests = pgTable(
  "mentorship_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "CASCADE" }),
    reviewedBy: uuid("reviewed_by").references(() => users.id),

    topic: mentorshipTopicEnum("topic").notNull(),
    description: text("description").notNull(),
    preferredDateTime: timestamp("preferred_date_time").notNull(),

    status: mentorshipStatusEnum("status").notNull().default("PENDING"),

    // Admin action fields
    rejectionReason: text("rejection_reason"),
    rescheduledDateTime: timestamp("rescheduled_date_time"),

    // Teams meeting (populated on approval)
    teamsMeetingId: text("teams_meeting_id"),
    teamsJoinUrl: text("teams_join_url"),
    meetingStartDateTime: timestamp("meeting_start_date_time"),
    meetingEndDateTime: timestamp("meeting_end_date_time"),

    // Reminder tracking — prevents duplicate sends
    reminder24hSent: boolean("reminder_24h_sent").notNull().default(false),
    reminder1hSent: boolean("reminder_1h_sent").notNull().default(false),
    reminder15mSent: boolean("reminder_15m_sent").notNull().default(false),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    mentorshipStudentIdx: index("mentorship_student_id_idx").on(table.studentId),
    mentorshipStatusIdx:  index("mentorship_status_idx").on(table.status),
    mentorshipDateIdx:    index("mentorship_preferred_date_idx").on(table.preferredDateTime),
  })
);

// ── Relations (add after existing relations declarations) ──────────────────

export const mentorshipRequestsRelations = relations(
  mentorshipRequests,
  ({ one }) => ({
    student: one(users, {
      fields: [mentorshipRequests.studentId],
      references: [users.id],
    }),
    reviewer: one(users, {
      fields: [mentorshipRequests.reviewedBy],
      references: [users.id],
    }),
  })
);
```

---

## Step 4 — Run Migration

```bash
cd backend
npm run db:generate   # generates the SQL migration file
npm run db:push       # applies schema to the dev database
```

---

## Step 5 — Types

Create **`backend/src/types/mentorship.ts`**:

```typescript
export type MentorshipTopic =
  | "AIR_NAVIGATION"
  | "FLIGHT_PLANNING"
  | "METEOROLOGY"
  | "AIRCRAFT_SYSTEMS"
  | "ATPL_PREPARATION"
  | "CPL_PREPARATION"
  | "CAREER_GUIDANCE"
  | "GENERAL_DOUBT_CLEARING";

export type MentorshipStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "RESCHEDULED"
  | "COMPLETED"
  | "CANCELLED";

export interface MentorshipRequest {
  id: string;
  studentId: string;
  studentName: string | null;
  studentEmail: string | null;
  reviewedBy: string | null;
  topic: MentorshipTopic;
  description: string;
  preferredDateTime: Date;
  status: MentorshipStatus;
  rejectionReason: string | null;
  rescheduledDateTime: Date | null;
  teamsJoinUrl: string | null;
  meetingStartDateTime: Date | null;
  meetingEndDateTime: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubmitMentorshipInput {
  topic: MentorshipTopic;
  description: string;
  preferredDateTime: string; // ISO 8601 string from client
}

export interface ApproveMentorshipInput {
  scheduledDateTime?: string; // Optional — falls back to preferredDateTime
}

export interface RejectMentorshipInput {
  reason: string;
}

export interface RescheduleMentorshipInput {
  rescheduledDateTime: string; // ISO 8601 string
}

export interface MentorshipStats {
  total: number;
  pending: number;
  approved: number;
  completed: number;
}

export interface AdminMentorshipFilters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export interface TeamsOnlineMeeting {
  id: string;
  joinWebUrl: string;
  startDateTime: string;
  endDateTime: string;
}
```

---

## Step 6 — Validation Schemas

Create **`backend/src/validation/mentorship.ts`**:

```typescript
import { z } from "zod";

const TOPICS = [
  "AIR_NAVIGATION",
  "FLIGHT_PLANNING",
  "METEOROLOGY",
  "AIRCRAFT_SYSTEMS",
  "ATPL_PREPARATION",
  "CPL_PREPARATION",
  "CAREER_GUIDANCE",
  "GENERAL_DOUBT_CLEARING",
] as const;

export const submitMentorshipSchema = z.object({
  topic: z.enum(TOPICS, { message: "Invalid topic" }),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(1000, "Description must not exceed 1000 characters"),
  preferredDateTime: z
    .string()
    .datetime({ message: "preferredDateTime must be a valid ISO 8601 datetime" })
    .refine(
      (dt) => new Date(dt) > new Date(),
      "Preferred date must be in the future"
    ),
});

export const approveMentorshipSchema = z.object({
  scheduledDateTime: z
    .string()
    .datetime({ message: "scheduledDateTime must be a valid ISO 8601 datetime" })
    .optional(),
});

export const rejectMentorshipSchema = z.object({
  reason: z
    .string()
    .min(5, "Reason must be at least 5 characters")
    .max(500, "Reason must not exceed 500 characters"),
});

export const rescheduleMentorshipSchema = z.object({
  rescheduledDateTime: z
    .string()
    .datetime({ message: "rescheduledDateTime must be a valid ISO 8601 datetime" })
    .refine(
      (dt) => new Date(dt) > new Date(),
      "Rescheduled date must be in the future"
    ),
});

export const adminMentorshipQuerySchema = z.object({
  page: z
    .string()
    .transform(Number)
    .refine((v) => v > 0)
    .optional(),
  limit: z
    .string()
    .transform(Number)
    .refine((v) => v > 0 && v <= 50)
    .optional(),
  status: z
    .enum(["PENDING", "APPROVED", "REJECTED", "RESCHEDULED", "COMPLETED", "CANCELLED", "all"])
    .optional(),
  search: z.string().optional(),
});

export const mentorshipSchemas = {
  submit:     submitMentorshipSchema,
  approve:    approveMentorshipSchema,
  reject:     rejectMentorshipSchema,
  reschedule: rescheduleMentorshipSchema,
  adminQuery: adminMentorshipQuerySchema,
};
```

---

## Step 7 — Teams Service

Create **`backend/src/api/services/mentorship/teamsService.ts`**.

Uses **Client Credentials** flow — no user OAuth required. The `OnlineMeetings.ReadWrite.All` application permission (already granted in Azure Portal) lets the app create meetings on behalf of any tenant user.

```typescript
import "isomorphic-fetch";
import { ConfidentialClientApplication } from "@azure/msal-node";
import { Client } from "@microsoft/microsoft-graph-client";
import { logger } from "../../../utils/logger.js";
import { TeamsMeetingCreationError } from "../../../utils/errors.js";
import type { TeamsOnlineMeeting } from "../../../types/mentorship.js";

const TENANT_ID        = process.env.TEAMS_TENANT_ID!;
const CLIENT_ID        = process.env.TEAMS_CLIENT_ID!;
const CLIENT_SECRET    = process.env.TEAMS_CLIENT_SECRET!;
const ORGANIZER_ID     = process.env.TEAMS_ORGANIZER_USER_ID!;
const DURATION_MINUTES = parseInt(process.env.TEAMS_MEETING_DURATION_MINUTES ?? "60", 10);

let msalClient: ConfidentialClientApplication | null = null;

function getMsalClient(): ConfidentialClientApplication {
  if (!msalClient) {
    msalClient = new ConfidentialClientApplication({
      auth: {
        clientId: CLIENT_ID,
        authority: `https://login.microsoftonline.com/${TENANT_ID}`,
        clientSecret: CLIENT_SECRET,
      },
    });
  }
  return msalClient;
}

/**
 * Acquire an access token via client credentials flow
 */
async function getAccessToken(): Promise<string> {
  const result = await getMsalClient().acquireTokenByClientCredential({
    scopes: ["https://graph.microsoft.com/.default"],
  });

  if (!result?.accessToken) {
    throw new TeamsMeetingCreationError("Failed to acquire Microsoft Graph access token");
  }

  return result.accessToken;
}

/**
 * Create a Teams online meeting for the configured organizer
 */
export async function createTeamsMeeting(
  subject: string,
  startDateTime: Date
): Promise<TeamsOnlineMeeting> {
  const endDateTime = new Date(startDateTime.getTime() + DURATION_MINUTES * 60 * 1000);

  const token = await getAccessToken();

  const graph = Client.init({
    authProvider: (done) => done(null, token),
  });

  const meeting = await graph
    .api(`/users/${ORGANIZER_ID}/onlineMeetings`)
    .post({
      subject,
      startDateTime: startDateTime.toISOString(),
      endDateTime:   endDateTime.toISOString(),
    });

  logger.info("Teams meeting created", "MENTORSHIP", { meetingId: meeting.id, subject });

  return {
    id:            meeting.id,
    joinWebUrl:    meeting.joinWebUrl,
    startDateTime: meeting.startDateTime,
    endDateTime:   meeting.endDateTime,
  };
}
```

---

## Step 8 — Mentorship Service

Create **`backend/src/api/services/mentorship/mentorshipService.ts`**.

**Standards applied:**
- No try-catch — errors bubble up to the global handler
- Throw custom error classes (`MentorshipNotFoundError`, `InvalidMentorshipStatusError`)
- Log operations with `"MENTORSHIP"` module name
- JSDoc on all public functions

```typescript
import { eq, desc, and, ilike, sql } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { mentorshipRequests, userProfiles, users } from "../../../db/schema.js";
import { logger } from "../../../utils/logger.js";
import {
  MentorshipNotFoundError,
  InvalidMentorshipStatusError,
} from "../../../utils/errors.js";
import { createTeamsMeeting } from "./teamsService.js";
import type {
  MentorshipRequest,
  SubmitMentorshipInput,
  ApproveMentorshipInput,
  RejectMentorshipInput,
  RescheduleMentorshipInput,
  MentorshipStats,
  AdminMentorshipFilters,
} from "../../../types/mentorship.js";

// Shared column selector used across all queries
const requestSelector = {
  id:                   mentorshipRequests.id,
  studentId:            mentorshipRequests.studentId,
  studentName:          userProfiles.fullName,
  studentEmail:         users.email,
  reviewedBy:           mentorshipRequests.reviewedBy,
  topic:                mentorshipRequests.topic,
  description:          mentorshipRequests.description,
  preferredDateTime:    mentorshipRequests.preferredDateTime,
  status:               mentorshipRequests.status,
  rejectionReason:      mentorshipRequests.rejectionReason,
  rescheduledDateTime:  mentorshipRequests.rescheduledDateTime,
  teamsJoinUrl:         mentorshipRequests.teamsJoinUrl,
  meetingStartDateTime: mentorshipRequests.meetingStartDateTime,
  meetingEndDateTime:   mentorshipRequests.meetingEndDateTime,
  createdAt:            mentorshipRequests.createdAt,
  updatedAt:            mentorshipRequests.updatedAt,
};

/**
 * Fetch a single mentorship request by ID, including student info
 */
export async function findById(id: string): Promise<MentorshipRequest> {
  const [row] = await db
    .select(requestSelector)
    .from(mentorshipRequests)
    .leftJoin(userProfiles, eq(userProfiles.userId, mentorshipRequests.studentId))
    .leftJoin(users, eq(users.id, mentorshipRequests.studentId))
    .where(eq(mentorshipRequests.id, id));

  if (!row) {
    throw new MentorshipNotFoundError();
  }

  return row as MentorshipRequest;
}

/**
 * Submit a new mentorship session request
 */
export async function submitRequest(
  studentId: string,
  data: SubmitMentorshipInput
): Promise<MentorshipRequest> {
  const [row] = await db
    .insert(mentorshipRequests)
    .values({
      studentId,
      topic:               data.topic,
      description:         data.description,
      preferredDateTime:   new Date(data.preferredDateTime),
      status:              "PENDING",
      createdAt:           new Date(),
      updatedAt:           new Date(),
    })
    .returning();

  logger.info("Mentorship request submitted", "MENTORSHIP", { id: row.id, studentId });

  return findById(row.id);
}

/**
 * Get all requests for the authenticated student, plus their stats
 */
export async function getMyRequests(studentId: string): Promise<{
  requests: MentorshipRequest[];
  stats: MentorshipStats;
}> {
  const rows = await db
    .select(requestSelector)
    .from(mentorshipRequests)
    .leftJoin(userProfiles, eq(userProfiles.userId, mentorshipRequests.studentId))
    .leftJoin(users, eq(users.id, mentorshipRequests.studentId))
    .where(eq(mentorshipRequests.studentId, studentId))
    .orderBy(desc(mentorshipRequests.createdAt));

  const stats: MentorshipStats = {
    total:     rows.length,
    pending:   rows.filter((r) => r.status === "PENDING").length,
    approved:  rows.filter((r) => r.status === "APPROVED" || r.status === "RESCHEDULED").length,
    completed: rows.filter((r) => r.status === "COMPLETED").length,
  };

  return { requests: rows as MentorshipRequest[], stats };
}

/**
 * Get all requests for the admin panel with optional filters and pagination
 */
export async function getAdminRequests(filters: AdminMentorshipFilters): Promise<{
  requests: MentorshipRequest[];
  stats: MentorshipStats;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  const page   = filters.page  ?? 1;
  const limit  = Math.min(filters.limit ?? 20, 50);
  const offset = (page - 1) * limit;

  const conditions = [];
  if (filters.status && filters.status !== "all") {
    conditions.push(eq(mentorshipRequests.status, filters.status as any));
  }
  if (filters.search) {
    conditions.push(ilike(mentorshipRequests.description, `%${filters.search}%`));
  }
  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, countResult, allRows] = await Promise.all([
    db
      .select(requestSelector)
      .from(mentorshipRequests)
      .leftJoin(userProfiles, eq(userProfiles.userId, mentorshipRequests.studentId))
      .leftJoin(users, eq(users.id, mentorshipRequests.studentId))
      .where(where)
      .orderBy(desc(mentorshipRequests.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(mentorshipRequests)
      .where(where),
    db
      .select({ status: mentorshipRequests.status })
      .from(mentorshipRequests),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  const stats: MentorshipStats = {
    total:     allRows.length,
    pending:   allRows.filter((r) => r.status === "PENDING").length,
    approved:  allRows.filter((r) => r.status === "APPROVED" || r.status === "RESCHEDULED").length,
    completed: allRows.filter((r) => r.status === "COMPLETED").length,
  };

  return {
    requests: rows as MentorshipRequest[],
    stats,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

/**
 * Approve a request — creates a Teams meeting and stores the join URL
 */
export async function approveRequest(
  id: string,
  adminId: string,
  data: ApproveMentorshipInput
): Promise<MentorshipRequest> {
  const existing = await findById(id);

  if (existing.status !== "PENDING" && existing.status !== "RESCHEDULED") {
    throw new InvalidMentorshipStatusError(
      "Only PENDING or RESCHEDULED requests can be approved"
    );
  }

  const meetingStart = new Date(data.scheduledDateTime ?? existing.preferredDateTime);
  const topicLabel   = existing.topic.replace(/_/g, " ");

  const teamsMeeting = await createTeamsMeeting(
    `Mentorship: ${topicLabel} — ${existing.studentName ?? "Student"}`,
    meetingStart
  );

  await db
    .update(mentorshipRequests)
    .set({
      status:               "APPROVED",
      reviewedBy:           adminId,
      teamsMeetingId:       teamsMeeting.id,
      teamsJoinUrl:         teamsMeeting.joinWebUrl,
      meetingStartDateTime: new Date(teamsMeeting.startDateTime),
      meetingEndDateTime:   new Date(teamsMeeting.endDateTime),
      updatedAt:            new Date(),
    })
    .where(eq(mentorshipRequests.id, id));

  logger.info("Mentorship request approved", "MENTORSHIP", {
    id,
    adminId,
    teamsMeetingId: teamsMeeting.id,
  });

  return findById(id);
}

/**
 * Reject a pending request with a reason
 */
export async function rejectRequest(
  id: string,
  adminId: string,
  data: RejectMentorshipInput
): Promise<MentorshipRequest> {
  const existing = await findById(id);

  if (existing.status !== "PENDING") {
    throw new InvalidMentorshipStatusError("Only PENDING requests can be rejected");
  }

  await db
    .update(mentorshipRequests)
    .set({
      status:          "REJECTED",
      reviewedBy:      adminId,
      rejectionReason: data.reason,
      updatedAt:       new Date(),
    })
    .where(eq(mentorshipRequests.id, id));

  logger.info("Mentorship request rejected", "MENTORSHIP", { id, adminId });

  return findById(id);
}

/**
 * Reschedule a request to a new datetime — clears any existing Teams meeting
 */
export async function rescheduleRequest(
  id: string,
  adminId: string,
  data: RescheduleMentorshipInput
): Promise<MentorshipRequest> {
  const existing = await findById(id);

  if (existing.status !== "PENDING" && existing.status !== "APPROVED") {
    throw new InvalidMentorshipStatusError(
      "Only PENDING or APPROVED requests can be rescheduled"
    );
  }

  await db
    .update(mentorshipRequests)
    .set({
      status:               "RESCHEDULED",
      reviewedBy:           adminId,
      rescheduledDateTime:  new Date(data.rescheduledDateTime),
      // Clear existing Teams meeting — will be recreated on next approval
      teamsMeetingId:       null,
      teamsJoinUrl:         null,
      meetingStartDateTime: null,
      meetingEndDateTime:   null,
      updatedAt:            new Date(),
    })
    .where(eq(mentorshipRequests.id, id));

  logger.info("Mentorship request rescheduled", "MENTORSHIP", { id, adminId });

  return findById(id);
}
```

---

## Step 9 — Controllers

### `backend/src/api/controllers/mentorship/studentMentorshipController.ts`

```typescript
import type { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../../../utils/response.js";
import { logger } from "../../../utils/logger.js";
import { ForbiddenError } from "../../../utils/errors.js";
import * as mentorshipService from "../../services/mentorship/mentorshipService.js";

/**
 * Submit a new mentorship session request
 * POST /api/mentorship
 */
export async function submitRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const studentId = req.userId!;
    const { topic, description, preferredDateTime } = req.body;

    const result = await mentorshipService.submitRequest(studentId, {
      topic,
      description,
      preferredDateTime,
    });

    logger.info("Mentorship request submitted via API", "MENTORSHIP", {
      requestId: result.id,
      studentId,
    });

    sendSuccess(res, 201, { request: result });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all mentorship requests for the authenticated student
 * GET /api/mentorship/my
 */
export async function getMyRequests(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const studentId = req.userId!;
    const result = await mentorshipService.getMyRequests(studentId);
    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
}

/**
 * Get a single mentorship request by ID (student can only view their own)
 * GET /api/mentorship/my/:id
 */
export async function getRequestById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const studentId = req.userId!;
    const id = req.params.id;

    const result = await mentorshipService.findById(id);

    if (result.studentId !== studentId) {
      throw new ForbiddenError("You can only view your own mentorship requests");
    }

    sendSuccess(res, 200, { request: result });
  } catch (error) {
    next(error);
  }
}
```

### `backend/src/api/controllers/mentorship/adminMentorshipController.ts`

```typescript
import type { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../../../utils/response.js";
import { logger } from "../../../utils/logger.js";
import * as mentorshipService from "../../services/mentorship/mentorshipService.js";

/**
 * Get all mentorship requests with optional filters and pagination
 * GET /api/mentorship/admin
 */
export async function getAllRequests(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { page, limit, status, search } = req.query as Record<string, string>;

    const result = await mentorshipService.getAdminRequests({
      page:   page   ? parseInt(page)   : undefined,
      limit:  limit  ? parseInt(limit)  : undefined,
      status: status ?? undefined,
      search: search ?? undefined,
    });

    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
}

/**
 * Get a single mentorship request by ID
 * GET /api/mentorship/admin/:id
 */
export async function getRequestById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id;
    const result = await mentorshipService.findById(id);
    sendSuccess(res, 200, { request: result });
  } catch (error) {
    next(error);
  }
}

/**
 * Approve a mentorship request and create the Teams meeting
 * PATCH /api/mentorship/admin/:id/approve
 */
export async function approveRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const adminId = req.userId!;
    const id      = req.params.id;
    const { scheduledDateTime } = req.body;

    const result = await mentorshipService.approveRequest(id, adminId, { scheduledDateTime });

    logger.info("Mentorship request approved via API", "MENTORSHIP", { id, adminId });

    sendSuccess(res, 200, { request: result });
  } catch (error) {
    next(error);
  }
}

/**
 * Reject a mentorship request with a reason
 * PATCH /api/mentorship/admin/:id/reject
 */
export async function rejectRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const adminId = req.userId!;
    const id      = req.params.id;
    const { reason } = req.body;

    const result = await mentorshipService.rejectRequest(id, adminId, { reason });

    logger.info("Mentorship request rejected via API", "MENTORSHIP", { id, adminId });

    sendSuccess(res, 200, { request: result });
  } catch (error) {
    next(error);
  }
}

/**
 * Reschedule a mentorship request to a new datetime
 * PATCH /api/mentorship/admin/:id/reschedule
 */
export async function rescheduleRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const adminId = req.userId!;
    const id      = req.params.id;
    const { rescheduledDateTime } = req.body;

    const result = await mentorshipService.rescheduleRequest(id, adminId, { rescheduledDateTime });

    logger.info("Mentorship request rescheduled via API", "MENTORSHIP", { id, adminId });

    sendSuccess(res, 200, { request: result });
  } catch (error) {
    next(error);
  }
}
```

---

## Step 10 — Routes

Create **`backend/src/api/routes/mentorship.ts`**:

```typescript
/**
 * Mentorship Routes
 * Student: POST /api/mentorship
 *          GET  /api/mentorship/my
 *          GET  /api/mentorship/my/:id
 * Admin:   GET  /api/mentorship/admin         (MANAGE_MENTORSHIP)
 *          GET  /api/mentorship/admin/:id      (MANAGE_MENTORSHIP)
 *          PATCH /api/mentorship/admin/:id/approve
 *          PATCH /api/mentorship/admin/:id/reject
 *          PATCH /api/mentorship/admin/:id/reschedule
 *
 * NOTE: /admin routes must be declared BEFORE /my/:id to avoid Express
 * matching "admin" as a dynamic :id parameter.
 */

import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/permissions.js";
import { validate } from "../../middleware/validation/validationMiddleware.js";
import { Permissions } from "../../lib/permissions.js";
import { mentorshipSchemas } from "../../validation/mentorship.js";
import * as studentController from "../controllers/mentorship/studentMentorshipController.js";
import * as adminController   from "../controllers/mentorship/adminMentorshipController.js";

const router = Router();

// ── Student ───────────────────────────────────────────────────────────────────

/**
 * Submit a new mentorship request
 * POST /api/mentorship
 */
router.post(
  "/",
  authMiddleware,
  validate(mentorshipSchemas.submit),
  studentController.submitRequest
);

/**
 * Get own requests and stats
 * GET /api/mentorship/my
 */
router.get(
  "/my",
  authMiddleware,
  studentController.getMyRequests
);

/**
 * Get a single own request
 * GET /api/mentorship/my/:id
 */
router.get(
  "/my/:id",
  authMiddleware,
  studentController.getRequestById
);

// ── Admin ─────────────────────────────────────────────────────────────────────

/**
 * List all requests with filters (must be before /admin/:id)
 * GET /api/mentorship/admin
 */
router.get(
  "/admin",
  authMiddleware,
  requirePermission(Permissions.MANAGE_MENTORSHIP),
  adminController.getAllRequests
);

/**
 * Get single request detail
 * GET /api/mentorship/admin/:id
 */
router.get(
  "/admin/:id",
  authMiddleware,
  requirePermission(Permissions.MANAGE_MENTORSHIP),
  adminController.getRequestById
);

/**
 * Approve request and create Teams meeting
 * PATCH /api/mentorship/admin/:id/approve
 */
router.patch(
  "/admin/:id/approve",
  authMiddleware,
  requirePermission(Permissions.MANAGE_MENTORSHIP),
  validate(mentorshipSchemas.approve),
  adminController.approveRequest
);

/**
 * Reject request with reason
 * PATCH /api/mentorship/admin/:id/reject
 */
router.patch(
  "/admin/:id/reject",
  authMiddleware,
  requirePermission(Permissions.MANAGE_MENTORSHIP),
  validate(mentorshipSchemas.reject),
  adminController.rejectRequest
);

/**
 * Reschedule request to a new datetime
 * PATCH /api/mentorship/admin/:id/reschedule
 */
router.patch(
  "/admin/:id/reschedule",
  authMiddleware,
  requirePermission(Permissions.MANAGE_MENTORSHIP),
  validate(mentorshipSchemas.reschedule),
  adminController.rescheduleRequest
);

export default router;
```

---

## Step 11 — Register in index.ts

In **`backend/src/index.ts`**, add alongside the other route imports and `app.use()` calls:

```typescript
import mentorshipRoutes from "./api/routes/mentorship.js";
import { startMentorshipReminder } from "./utils/mentorshipReminder.js";

// In the API Routes section:
app.use("/api/mentorship", mentorshipRoutes);

// In the server.listen callback, after startEmailProcessor():
try {
  startMentorshipReminder();
} catch (reminderError) {
  logger.warn("Failed to start mentorship reminder service, continuing without it", "SERVER");
}
```

---

## Step 12 — Reminder Background Service

Create **`backend/src/utils/mentorshipReminder.ts`**.

Runs every 5 minutes. Sends email reminders at 24 h, 1 h, and 15 min before each approved meeting. Boolean flags on each row prevent duplicate sends.

```typescript
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { mentorshipRequests, users, userProfiles } from "../db/schema.js";
import { logger } from "./logger.js";
// import { queueEmail } from "./emailService.js"; // Uncomment when email templates are ready

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

interface ReminderWindow {
  field: "reminder24hSent" | "reminder1hSent" | "reminder15mSent";
  label: string;
  leadMs: number;
  toleranceMs: number;
}

const REMINDER_WINDOWS: ReminderWindow[] = [
  { field: "reminder24hSent", label: "24 hours",  leadMs: 24 * 60 * 60 * 1000, toleranceMs: 10 * 60 * 1000 },
  { field: "reminder1hSent",  label: "1 hour",    leadMs:      60 * 60 * 1000, toleranceMs:  5 * 60 * 1000 },
  { field: "reminder15mSent", label: "15 minutes", leadMs:      15 * 60 * 1000, toleranceMs:  5 * 60 * 1000 },
];

async function processReminders(): Promise<void> {
  const now = new Date();

  const upcoming = await db
    .select({
      id:                   mentorshipRequests.id,
      topic:                mentorshipRequests.topic,
      studentEmail:         users.email,
      studentName:          userProfiles.fullName,
      teamsJoinUrl:         mentorshipRequests.teamsJoinUrl,
      meetingStartDateTime: mentorshipRequests.meetingStartDateTime,
      reminder24hSent:      mentorshipRequests.reminder24hSent,
      reminder1hSent:       mentorshipRequests.reminder1hSent,
      reminder15mSent:      mentorshipRequests.reminder15mSent,
    })
    .from(mentorshipRequests)
    .leftJoin(users, eq(users.id, mentorshipRequests.studentId))
    .leftJoin(userProfiles, eq(userProfiles.userId, mentorshipRequests.studentId))
    .where(eq(mentorshipRequests.status, "APPROVED"));

  for (const meeting of upcoming) {
    if (!meeting.meetingStartDateTime || !meeting.studentEmail) continue;

    const startMs = new Date(meeting.meetingStartDateTime).getTime();

    for (const window of REMINDER_WINDOWS) {
      if (meeting[window.field]) continue; // Already sent

      const targetTime = startMs - window.leadMs;
      const diff = Math.abs(now.getTime() - targetTime);

      if (diff <= window.toleranceMs) {
        // TODO: Replace with actual email template when ready
        // await queueEmail({
        //   to: meeting.studentEmail,
        //   subject: `Reminder: Your mentorship session in ${window.label}`,
        //   html: getMentorshipReminderTemplate(
        //     meeting.studentName ?? "Student",
        //     window.label,
        //     meeting.topic,
        //     meeting.teamsJoinUrl ?? ""
        //   ),
        // });

        await db
          .update(mentorshipRequests)
          .set({ [window.field]: true, updatedAt: new Date() })
          .where(eq(mentorshipRequests.id, meeting.id));

        logger.info(
          `Mentorship ${window.label} reminder queued`,
          "MENTORSHIP",
          { id: meeting.id, email: meeting.studentEmail }
        );
      }
    }
  }
}

/**
 * Start the background reminder service (5-minute poll interval)
 */
export function startMentorshipReminder(): void {
  processReminders().catch((err) =>
    logger.error("Initial mentorship reminder check failed", "MENTORSHIP", err)
  );
  setInterval(() => {
    processReminders().catch((err) =>
      logger.error("Mentorship reminder check failed", "MENTORSHIP", err)
    );
  }, CHECK_INTERVAL_MS);

  logger.info("Mentorship reminder service started (5-min interval)", "MENTORSHIP");
}
```

---

## Step 13 — Seed Permission

In **`backend/src/db/seed.ts`**, find the `permissions` array and add:

```typescript
{ name: "MANAGE_MENTORSHIP", description: "Manage mentorship requests and sessions", module: "mentorship" },
```

Then add it to the ADMIN role `rolePermissions` entries (same pattern as `MANAGE_FEEDBACK`). After editing:

```bash
npm run db:seed
```

---

## API Reference

| Method  | Endpoint                              | Auth     | Permission           | Description                           |
|---------|---------------------------------------|----------|----------------------|---------------------------------------|
| `POST`  | `/api/mentorship`                     | Student  | —                    | Submit new request                    |
| `GET`   | `/api/mentorship/my`                  | Student  | —                    | Own requests + stats                  |
| `GET`   | `/api/mentorship/my/:id`              | Student  | —                    | Single own request                    |
| `GET`   | `/api/mentorship/admin`               | Admin    | `MANAGE_MENTORSHIP`  | All requests, paginated + filterable  |
| `GET`   | `/api/mentorship/admin/:id`           | Admin    | `MANAGE_MENTORSHIP`  | Single request detail                 |
| `PATCH` | `/api/mentorship/admin/:id/approve`   | Admin    | `MANAGE_MENTORSHIP`  | Approve + create Teams meeting        |
| `PATCH` | `/api/mentorship/admin/:id/reject`    | Admin    | `MANAGE_MENTORSHIP`  | Reject with reason                    |
| `PATCH` | `/api/mentorship/admin/:id/reschedule`| Admin    | `MANAGE_MENTORSHIP`  | Reschedule to new datetime            |

### Query Parameters — `GET /api/mentorship/admin`

| Param    | Type   | Default | Description                                                |
|----------|--------|---------|------------------------------------------------------------|
| `page`   | number | 1       | Page number                                                |
| `limit`  | number | 20      | Items per page (max 50)                                    |
| `status` | string | —       | PENDING \| APPROVED \| REJECTED \| RESCHEDULED \| COMPLETED \| all |
| `search` | string | —       | Searches description text                                  |

### Request / Response Examples

**Submit request — `POST /api/mentorship`**
```json
// Request body
{
  "topic": "FLIGHT_PLANNING",
  "description": "I need help understanding TMA entry procedures and VFR flight plans in controlled airspace.",
  "preferredDateTime": "2026-06-20T10:00:00.000Z"
}

// Response 201
{
  "success": true,
  "data": { "request": { "id": "uuid", "status": "PENDING", "..." } },
  "error": null,
  "timestamp": "2026-06-08T10:00:00Z"
}
```

**Approve — `PATCH /api/mentorship/admin/:id/approve`**
```json
// Request body (scheduledDateTime is optional; omit to use preferredDateTime)
{ "scheduledDateTime": "2026-06-20T10:00:00.000Z" }

// Response 200 — teamsJoinUrl is now populated
{
  "success": true,
  "data": {
    "request": {
      "status": "APPROVED",
      "teamsJoinUrl": "https://teams.microsoft.com/l/meetup-join/...",
      "meetingStartDateTime": "2026-06-20T10:00:00Z"
    }
  }
}
```

**Reject — `PATCH /api/mentorship/admin/:id/reject`**
```json
{ "reason": "No available mentors for the requested time slot." }
```

**Reschedule — `PATCH /api/mentorship/admin/:id/reschedule`**
```json
{ "rescheduledDateTime": "2026-06-22T14:00:00.000Z" }
```

---

## Implementation Checklist

- [ ] `npm install @azure/msal-node @microsoft/microsoft-graph-client isomorphic-fetch`
- [ ] Add env vars to `.env` and `.env.example`
- [ ] Get `TEAMS_ORGANIZER_USER_ID` from Azure Portal (Entra ID → Users → Gautham P → Object ID)
- [ ] Add 3 error classes to `utils/errors.ts`
- [ ] Add `MANAGE_MENTORSHIP` to `lib/permissions.ts`
- [ ] Add enums + table + relations to `db/schema.ts`
- [ ] `npm run db:generate` and `npm run db:push`
- [ ] Create `types/mentorship.ts`
- [ ] Create `validation/mentorship.ts`
- [ ] Create `services/mentorship/teamsService.ts`
- [ ] Create `services/mentorship/mentorshipService.ts`
- [ ] Create `controllers/mentorship/studentMentorshipController.ts`
- [ ] Create `controllers/mentorship/adminMentorshipController.ts`
- [ ] Create `routes/mentorship.ts`
- [ ] Register route and reminder service in `index.ts`
- [ ] Create `utils/mentorshipReminder.ts`
- [ ] Add `MANAGE_MENTORSHIP` to seed and run `npm run db:seed`

---

**Last Updated:** June 8, 2026
