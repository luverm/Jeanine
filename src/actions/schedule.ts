"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import {
  replaceOpeningHours,
  insertTimeOff,
  deleteTimeOff,
} from "@/lib/db/admin-schedule";
import { writeAuditLog } from "@/lib/db/bookings";

const openingHoursSchema = z.object({
  staffId: z.string().uuid(),
  rows: z.array(
    z.object({
      weekday: z.number().int().min(0).max(6),
      start_time: z.string().regex(/^\d{2}:\d{2}$/),
      end_time: z.string().regex(/^\d{2}:\d{2}$/),
    }),
  ),
});

export async function saveOpeningHoursAction(
  input: unknown,
): Promise<{ ok: boolean }> {
  const parsed = openingHoursSchema.parse(input);
  await replaceOpeningHours(parsed.staffId, parsed.rows);
  await writeAuditLog({
    actor: "admin",
    action: "opening_hours.replace",
    entity: "staff",
    entityId: parsed.staffId,
    payload: { rows: parsed.rows },
  }).catch(() => {});
  revalidatePath("/instellingen/openingstijden");
  return { ok: true };
}

const timeOffSchema = z.object({
  staffId: z.string().uuid(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  reason: z.string().trim().max(200).optional(),
});

export async function addTimeOffAction(input: unknown): Promise<{ ok: boolean }> {
  const parsed = timeOffSchema.parse(input);
  await insertTimeOff({
    staffId: parsed.staffId,
    startsAt: parsed.startsAt,
    endsAt: parsed.endsAt,
    reason: parsed.reason,
  });
  revalidatePath("/instellingen/vrije-dagen");
  return { ok: true };
}

export async function deleteTimeOffAction(id: string): Promise<{ ok: boolean }> {
  await deleteTimeOff(id);
  revalidatePath("/instellingen/vrije-dagen");
  return { ok: true };
}
