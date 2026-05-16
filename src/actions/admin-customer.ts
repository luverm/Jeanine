"use server";

import { z } from "zod";
import { updateCustomerNotes } from "@/lib/db/admin-customers";
import { writeAuditLog } from "@/lib/db/bookings";

const notesSchema = z.string().max(2000);

export async function updateCustomerNotesAction(
  id: string,
  rawNotes: string,
): Promise<{ ok: boolean }> {
  const trimmed = notesSchema.parse(rawNotes).trim();
  try {
    await updateCustomerNotes(id, trimmed);
  } catch (err) {
    console.error("[customer] notes update failed:", err);
    return { ok: false };
  }
  await writeAuditLog({
    actor: "admin",
    action: "customer.notes_update",
    entity: "customer",
    entityId: id,
    payload: { length: trimmed.length },
  }).catch(() => {});
  return { ok: true };
}
