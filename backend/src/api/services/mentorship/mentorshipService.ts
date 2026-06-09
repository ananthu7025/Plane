import { eq, desc, and, or, ilike, sql } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { mentorshipRequests, userProfiles, users } from "../../../db/schema.js";
import { logger } from "../../../utils/logger.js";
import {
  MentorshipNotFoundError,
  InvalidMentorshipStatusError,
} from "../../../utils/errors.js";
import { createTeamsMeeting } from "./teamsService.js";
import { verifySignature } from "./paymentService.js";
import { validateSlotAvailable } from "./slotService.js";
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
  paymentStatus:        mentorshipRequests.paymentStatus,
  razorpayOrderId:      mentorshipRequests.razorpayOrderId,
  razorpayPaymentId:    mentorshipRequests.razorpayPaymentId,
  amountPaidPaise:      mentorshipRequests.amountPaidPaise,
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
 * Submit a new mentorship session request (after successful Razorpay payment)
 */
export async function submitRequest(
  studentId: string,
  data: SubmitMentorshipInput
): Promise<MentorshipRequest> {
  // Verify Razorpay signature before creating the request
  verifySignature(data.razorpayOrderId, data.razorpayPaymentId, data.razorpaySignature);

  const slotDateTime = new Date(data.preferredDateTime);
  await validateSlotAvailable(slotDateTime);

  const [row] = await db
    .insert(mentorshipRequests)
    .values({
      studentId,
      topic:             data.topic,
      description:       data.description,
      preferredDateTime: slotDateTime,
      status:            "PENDING",
      paymentStatus:     "PAID",
      razorpayOrderId:   data.razorpayOrderId,
      razorpayPaymentId: data.razorpayPaymentId,
      amountPaidPaise:   data.amountPaidPaise,
      createdAt:         new Date(),
      updatedAt:         new Date(),
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
    const term = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(mentorshipRequests.description, term),
        ilike(userProfiles.fullName, term),
        ilike(users.email, term)
      )!
    );
  }
  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, countResult, statsRows] = await Promise.all([
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
      .leftJoin(userProfiles, eq(userProfiles.userId, mentorshipRequests.studentId))
      .leftJoin(users, eq(users.id, mentorshipRequests.studentId))
      .where(where),
    db
      .select({ status: mentorshipRequests.status, count: sql<number>`count(*)::int` })
      .from(mentorshipRequests)
      .groupBy(mentorshipRequests.status),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  const countByStatus = Object.fromEntries(statsRows.map((r) => [r.status, r.count])) as Record<string, number>;
  const stats: MentorshipStats = {
    total:     statsRows.reduce((sum, r) => sum + r.count, 0),
    pending:   countByStatus["PENDING"]   ?? 0,
    approved:  (countByStatus["APPROVED"] ?? 0) + (countByStatus["RESCHEDULED"] ?? 0),
    completed: countByStatus["COMPLETED"] ?? 0,
  };

  return {
    requests: rows as MentorshipRequest[],
    stats,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

/**
 * Approve a request — attempts to create a Teams meeting and stores the join URL.
 * If Teams meeting creation fails (e.g. policy not yet propagated), the request is
 * still approved and teamsJoinUrl remains null until createMeetingForApproved() is called.
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

  let meetingFields: {
    teamsMeetingId:       string | null;
    teamsJoinUrl:         string | null;
    meetingStartDateTime: Date   | null;
    meetingEndDateTime:   Date   | null;
  } = {
    teamsMeetingId:       null,
    teamsJoinUrl:         null,
    meetingStartDateTime: null,
    meetingEndDateTime:   null,
  };

  try {
    const teamsMeeting = await createTeamsMeeting(
      `Mentorship: ${topicLabel} — ${existing.studentName ?? "Student"}`,
      meetingStart
    );
    meetingFields = {
      teamsMeetingId:       teamsMeeting.id,
      teamsJoinUrl:         teamsMeeting.joinWebUrl,
      meetingStartDateTime: new Date(teamsMeeting.startDateTime),
      meetingEndDateTime:   new Date(teamsMeeting.endDateTime),
    };
  } catch (err: any) {
    logger.warn(
      "Teams meeting creation failed — approving without meeting link. Retry via createMeetingForApproved().",
      "MENTORSHIP",
      {
        id,
        message:    err?.message,
        code:       err?.code,
        statusCode: err?.statusCode,
        requestId:  err?.requestId,
        body:       err?.body,
      }
    );
  }

  await db
    .update(mentorshipRequests)
    .set({
      status:    "APPROVED",
      reviewedBy: adminId,
      ...meetingFields,
      updatedAt: new Date(),
    })
    .where(eq(mentorshipRequests.id, id));

  logger.info("Mentorship request approved", "MENTORSHIP", {
    id,
    adminId,
    hasMeetingLink: !!meetingFields.teamsJoinUrl,
  });

  return findById(id);
}

/**
 * Hard-delete a mentorship request (admin only)
 */
export async function deleteRequest(id: string): Promise<void> {
  const existing = await findById(id);

  await db
    .delete(mentorshipRequests)
    .where(eq(mentorshipRequests.id, existing.id));

  logger.info("Mentorship request deleted", "MENTORSHIP", { id });
}

/**
 * Retry Teams meeting creation for an already-approved request that has no meeting link.
 */
export async function createMeetingForApproved(id: string): Promise<MentorshipRequest> {
  const existing = await findById(id);

  if (existing.status !== "APPROVED") {
    throw new InvalidMentorshipStatusError("Meeting creation retry is only valid for APPROVED requests");
  }

  if (existing.teamsJoinUrl) {
    return existing;
  }

  const meetingStart = new Date(existing.preferredDateTime);
  const topicLabel   = existing.topic.replace(/_/g, " ");

  const teamsMeeting = await createTeamsMeeting(
    `Mentorship: ${topicLabel} — ${existing.studentName ?? "Student"}`,
    meetingStart
  );

  await db
    .update(mentorshipRequests)
    .set({
      teamsMeetingId:       teamsMeeting.id,
      teamsJoinUrl:         teamsMeeting.joinWebUrl,
      meetingStartDateTime: new Date(teamsMeeting.startDateTime),
      meetingEndDateTime:   new Date(teamsMeeting.endDateTime),
      updatedAt:            new Date(),
    })
    .where(eq(mentorshipRequests.id, id));

  logger.info("Teams meeting created for approved request", "MENTORSHIP", { id, teamsMeetingId: teamsMeeting.id });

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
