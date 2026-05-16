"use server";

import { z } from "zod";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { writeAuditLog, cancelBooking } from "@/lib/db/bookings";
import { dismissNoShowFlag } from "@/lib/db/no-show";
import { getEmailLogEntry } from "@/lib/db/email-log";
import { sendEmail } from "@/lib/email/client";

const statusSchema = z.enum([
  "pending",
  "confirmed",
  "cancelled",
  "no_show",
  "completed",
]);

export async function updateBookingStatusAction(
  id: string,
  rawStatus: string,
): Promise<{ ok: boolean }> {
  const status = statusSchema.parse(rawStatus);

  if (status === "cancelled") {
    await cancelBooking(id);
  } else {
    const supabase = createSupabaseServiceClient();
    const { error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", id);
    if (error) throw error;
  }

  await writeAuditLog({
    actor: "admin",
    action: "booking.status_change",
    entity: "booking",
    entityId: id,
    payload: { status },
  }).catch(() => {});

  return { ok: true };
}

const notesSchema = z.string().max(2000);

export async function updateBookingNotesAction(
  id: string,
  rawNotes: string,
): Promise<{ ok: boolean }> {
  const trimmed = notesSchema.parse(rawNotes).trim();
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from("bookings")
    .update({ notes: trimmed || null })
    .eq("id", id);
  if (error) throw error;

  await writeAuditLog({
    actor: "admin",
    action: "booking.notes_update",
    entity: "booking",
    entityId: id,
    payload: { length: trimmed.length },
  }).catch(() => {});

  return { ok: true };
}

export async function dismissNoShowFlagAction(
  customerId: string,
): Promise<{ ok: boolean }> {
  try {
    await dismissNoShowFlag(customerId);
  } catch (err) {
    console.error("[no-show] dismiss failed:", err);
    return { ok: false };
  }
  await writeAuditLog({
    actor: "admin",
    action: "customer.no_show_ack",
    entity: "customer",
    entityId: customerId,
    payload: {},
  }).catch(() => {});
  return { ok: true };
}

export async function resendEmailAction(
  id: number,
): Promise<{ ok: boolean }> {
  const entry = await getEmailLogEntry(id);
  if (!entry) return { ok: false };
  try {
    await sendEmail({
      to: entry.to_email,
      subject: entry.subject,
      text: entry.body,
      context: `resend:${entry.context ?? "onbekend"}`,
    });
  } catch (err) {
    console.error("[email] resend failed:", err);
    return { ok: false };
  }
  return { ok: true };
}
