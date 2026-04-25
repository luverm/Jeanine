"use server";

import { z } from "zod";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { writeAuditLog, cancelBooking } from "@/lib/db/bookings";

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
