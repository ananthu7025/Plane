import { eq, and, inArray, sql } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { mentorshipSlotTemplates, mentorshipRequests } from "../../../db/schema.js";
import { logger } from "../../../utils/logger.js";
import { SlotNotFoundError, SlotNotAvailableError, ConflictError } from "../../../utils/errors.js";
import type {
  SlotTemplate,
  AvailableSlot,
  CreateSlotTemplateInput,
  CopySlotsInput,
} from "../../../types/mentorship.js";

const SLOT_DURATION_MINUTES = 60;

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export async function getAllTemplates(): Promise<SlotTemplate[]> {
  const rows = await db
    .select()
    .from(mentorshipSlotTemplates)
    .orderBy(mentorshipSlotTemplates.dayOfWeek, mentorshipSlotTemplates.startTime);
  return rows as SlotTemplate[];
}

export async function createTemplate(
  adminId: string,
  data: CreateSlotTemplateInput
): Promise<SlotTemplate> {
  const existing = await db
    .select({ id: mentorshipSlotTemplates.id })
    .from(mentorshipSlotTemplates)
    .where(
      and(
        eq(mentorshipSlotTemplates.dayOfWeek, data.dayOfWeek),
        eq(mentorshipSlotTemplates.startTime, data.startTime)
      )
    );

  if (existing.length > 0) {
    throw new ConflictError(
      `A slot at ${data.startTime} already exists for this day`,
      "SLOT_ALREADY_EXISTS"
    );
  }

  const [row] = await db
    .insert(mentorshipSlotTemplates)
    .values({
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      isActive:  true,
      createdBy: adminId,
    })
    .returning();

  logger.info("Slot template created", "MENTORSHIP", { id: row.id, dayOfWeek: data.dayOfWeek, startTime: data.startTime });

  return row as SlotTemplate;
}

export async function deleteTemplate(id: string): Promise<void> {
  const [row] = await db
    .select({ id: mentorshipSlotTemplates.id })
    .from(mentorshipSlotTemplates)
    .where(eq(mentorshipSlotTemplates.id, id));

  if (!row) throw new SlotNotFoundError();

  await db.delete(mentorshipSlotTemplates).where(eq(mentorshipSlotTemplates.id, id));

  logger.info("Slot template deleted", "MENTORSHIP", { id });
}

export async function toggleTemplate(id: string): Promise<SlotTemplate> {
  const [row] = await db
    .select()
    .from(mentorshipSlotTemplates)
    .where(eq(mentorshipSlotTemplates.id, id));

  if (!row) throw new SlotNotFoundError();

  const [updated] = await db
    .update(mentorshipSlotTemplates)
    .set({ isActive: !row.isActive, updatedAt: new Date() })
    .where(eq(mentorshipSlotTemplates.id, id))
    .returning();

  return updated as SlotTemplate;
}

export async function copySlots(adminId: string, data: CopySlotsInput): Promise<{ created: number }> {
  const sourceSlots = await db
    .select()
    .from(mentorshipSlotTemplates)
    .where(eq(mentorshipSlotTemplates.dayOfWeek, data.fromDay));

  if (sourceSlots.length === 0) {
    return { created: 0 };
  }

  let created = 0;
  for (const targetDay of data.toDays) {
    for (const slot of sourceSlots) {
      const existing = await db
        .select({ id: mentorshipSlotTemplates.id })
        .from(mentorshipSlotTemplates)
        .where(
          and(
            eq(mentorshipSlotTemplates.dayOfWeek, targetDay),
            eq(mentorshipSlotTemplates.startTime, slot.startTime)
          )
        );

      if (existing.length === 0) {
        await db.insert(mentorshipSlotTemplates).values({
          dayOfWeek: targetDay,
          startTime: slot.startTime,
          isActive:  slot.isActive,
          createdBy: adminId,
        });
        created++;
      }
    }
  }

  logger.info("Slots copied", "MENTORSHIP", { fromDay: data.fromDay, toDays: data.toDays, created });

  return { created };
}

export async function getAvailableSlotsForDate(dateStr: string): Promise<AvailableSlot[]> {
  const date = new Date(dateStr);
  const dayOfWeek = date.getDay(); // 0=Sun

  const templates = await db
    .select()
    .from(mentorshipSlotTemplates)
    .where(
      and(
        eq(mentorshipSlotTemplates.dayOfWeek, dayOfWeek),
        eq(mentorshipSlotTemplates.isActive, true)
      )
    )
    .orderBy(mentorshipSlotTemplates.startTime);

  if (templates.length === 0) return [];

  // Find already-booked slots for this date (PENDING or APPROVED requests)
  const dateStart = new Date(dateStr);
  dateStart.setHours(0, 0, 0, 0);
  const dateEnd = new Date(dateStr);
  dateEnd.setHours(23, 59, 59, 999);

  const booked = await db
    .select({ preferredDateTime: mentorshipRequests.preferredDateTime })
    .from(mentorshipRequests)
    .where(
      and(
        sql`${mentorshipRequests.preferredDateTime} >= ${dateStart}`,
        sql`${mentorshipRequests.preferredDateTime} <= ${dateEnd}`,
        inArray(mentorshipRequests.status, ["PENDING", "APPROVED"])
      )
    );

  const bookedTimes = new Set(
    booked.map((r) => {
      const d = new Date(r.preferredDateTime);
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    })
  );

  return templates.map((t) => ({
    startTime: t.startTime,
    endTime:   addMinutes(t.startTime, SLOT_DURATION_MINUTES),
    available: !bookedTimes.has(t.startTime),
  }));
}

export async function validateSlotAvailable(slotDateTime: Date): Promise<void> {
  const dayOfWeek = slotDateTime.getDay();
  const hours     = String(slotDateTime.getHours()).padStart(2, "0");
  const minutes   = String(slotDateTime.getMinutes()).padStart(2, "0");
  const startTime = `${hours}:${minutes}`;

  const [template] = await db
    .select({ id: mentorshipSlotTemplates.id })
    .from(mentorshipSlotTemplates)
    .where(
      and(
        eq(mentorshipSlotTemplates.dayOfWeek, dayOfWeek),
        eq(mentorshipSlotTemplates.startTime, startTime),
        eq(mentorshipSlotTemplates.isActive, true)
      )
    );

  if (!template) {
    throw new SlotNotAvailableError("No active slot template found for this time");
  }

  // Check if already booked
  const dateStart = new Date(slotDateTime);
  dateStart.setSeconds(0, 0);
  const dateEnd = new Date(slotDateTime);
  dateEnd.setSeconds(59, 999);

  const [existing] = await db
    .select({ id: mentorshipRequests.id })
    .from(mentorshipRequests)
    .where(
      and(
        sql`${mentorshipRequests.preferredDateTime} >= ${dateStart}`,
        sql`${mentorshipRequests.preferredDateTime} <= ${dateEnd}`,
        inArray(mentorshipRequests.status, ["PENDING", "APPROVED"])
      )
    );

  if (existing) {
    throw new SlotNotAvailableError("This slot has already been booked");
  }
}
