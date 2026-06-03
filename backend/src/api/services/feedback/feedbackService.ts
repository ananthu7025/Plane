/**
 * Feedback Service
 * Student submission, admin listing, and admin respond operations
 */

import { eq, desc, ilike, or, and, isNull, sql } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { studentFeedback, userProfiles } from "../../../db/schema.js";
import { logger } from "../../../utils/logger.js";
import {
  FeedbackNotFoundError,
  FeedbackAlreadyRespondedError,
} from "../../../utils/errors.js";
import type {
  Feedback,
  AdminFeedbackStats,
  StudentFeedbackStats,
  SubmitFeedbackInput,
  AdminFeedbackFilters,
} from "../../../types/feedback.js";

/**
 * Submit new feedback from a student
 */
export async function submitFeedback(
  studentId: string,
  data: SubmitFeedbackInput
): Promise<Feedback> {
  const [row] = await db
    .insert(studentFeedback)
    .values({
      studentId: studentId,
      category:  data.category,
      subject:   data.subject ?? null,
      rating:    data.rating,
      feedback:  data.feedback,
      status:    "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  logger.info("Feedback submitted", "FEEDBACK", { feedbackId: row.id, studentId });

  return { ...row, studentName: null };
}

/**
 * Get current student's feedback list + stats
 */
export async function getMyFeedback(studentId: string): Promise<{
  feedback: Feedback[];
  stats: StudentFeedbackStats;
}> {
  const rows = await db
    .select()
    .from(studentFeedback)
    .where(eq(studentFeedback.studentId, studentId))
    .orderBy(desc(studentFeedback.createdAt));

  const stats: StudentFeedbackStats = {
    total:     rows.length,
    reviewed:  rows.filter((r) => r.status === "reviewed").length,
    pending:   rows.filter((r) => r.status === "pending").length,
    avgRating: rows.length
      ? parseFloat((rows.reduce((s, r) => s + r.rating, 0) / rows.length).toFixed(1))
      : 0,
  };

  return {
    feedback: rows.map((r) => ({ ...r, studentName: null })),
    stats,
  };
}

/**
 * Get all feedback for admin panel with optional filters + pagination
 */
export async function getAdminFeedback(filters: AdminFeedbackFilters): Promise<{
  feedback: Feedback[];
  stats: AdminFeedbackStats;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  const page  = filters.page  ?? 1;
  const limit = Math.min(filters.limit ?? 20, 50);
  const offset = (page - 1) * limit;

  const conditions = [];

  if (filters.status && filters.status !== "all") {
    conditions.push(eq(studentFeedback.status, filters.status));
  }
  if (filters.category) {
    conditions.push(eq(studentFeedback.category, filters.category));
  }
  if (filters.search) {
    conditions.push(
      or(
        ilike(studentFeedback.feedback, `%${filters.search}%`),
        ilike(studentFeedback.subject,  `%${filters.search}%`)
      )
    );
  }

  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, countResult, allRows] = await Promise.all([
    db
      .select({
        id:          studentFeedback.id,
        studentId:   studentFeedback.studentId,
        studentName: userProfiles.fullName,
        category:    studentFeedback.category,
        subject:     studentFeedback.subject,
        rating:      studentFeedback.rating,
        feedback:    studentFeedback.feedback,
        status:      studentFeedback.status,
        response:    studentFeedback.response,
        respondedBy: studentFeedback.respondedBy,
        respondedAt: studentFeedback.respondedAt,
        createdAt:   studentFeedback.createdAt,
        updatedAt:   studentFeedback.updatedAt,
      })
      .from(studentFeedback)
      .leftJoin(userProfiles, eq(userProfiles.userId, studentFeedback.studentId))
      .where(where)
      .orderBy(desc(studentFeedback.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(studentFeedback).where(where),
    db.select({ rating: studentFeedback.rating, status: studentFeedback.status }).from(studentFeedback),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  const stats: AdminFeedbackStats = {
    total:     allRows.length,
    reviewed:  allRows.filter((r) => r.status === "reviewed").length,
    pending:   allRows.filter((r) => r.status === "pending").length,
    avgRating: allRows.length
      ? parseFloat((allRows.reduce((s, r) => s + r.rating, 0) / allRows.length).toFixed(1))
      : 0,
  };

  return {
    feedback: rows,
    stats,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

/**
 * Get a single feedback by ID (admin)
 */
export async function getFeedbackById(id: number): Promise<Feedback> {
  const [row] = await db
    .select({
      id:          studentFeedback.id,
      studentId:   studentFeedback.studentId,
      studentName: userProfiles.fullName,
      category:    studentFeedback.category,
      subject:     studentFeedback.subject,
      rating:      studentFeedback.rating,
      feedback:    studentFeedback.feedback,
      status:      studentFeedback.status,
      response:    studentFeedback.response,
      respondedBy: studentFeedback.respondedBy,
      respondedAt: studentFeedback.respondedAt,
      createdAt:   studentFeedback.createdAt,
      updatedAt:   studentFeedback.updatedAt,
    })
    .from(studentFeedback)
    .leftJoin(userProfiles, eq(userProfiles.userId, studentFeedback.studentId))
    .where(eq(studentFeedback.id, id));

  if (!row) throw new FeedbackNotFoundError();
  return row;
}

/**
 * Submit admin response and mark as reviewed
 */
export async function respondToFeedback(
  id: number,
  adminId: string,
  response: string
): Promise<Feedback> {
  const existing = await db.query.studentFeedback.findFirst({
    where: eq(studentFeedback.id, id),
  });

  if (!existing) throw new FeedbackNotFoundError();
  if (existing.response) throw new FeedbackAlreadyRespondedError();

  await db
    .update(studentFeedback)
    .set({
      response:    response,
      respondedBy: adminId,
      respondedAt: new Date(),
      status:      "reviewed",
      updatedAt:   new Date(),
    })
    .where(eq(studentFeedback.id, id));

  logger.info("Feedback response sent", "FEEDBACK", { feedbackId: id, adminId });

  return getFeedbackById(id);
}
