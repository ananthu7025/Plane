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
  { field: "reminder24hSent", label: "24 hours",   leadMs: 24 * 60 * 60 * 1000, toleranceMs: 10 * 60 * 1000 },
  { field: "reminder1hSent",  label: "1 hour",     leadMs:      60 * 60 * 1000, toleranceMs:  5 * 60 * 1000 },
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
