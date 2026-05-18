"use server";

import { z } from "zod";
import {
  updateCustomerNotes,
  searchCustomers,
  type CustomerOption,
} from "@/lib/db/admin-customers";
import { writeAuditLog } from "@/lib/db/bookings";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function searchCustomersAction(
  q: string,
): Promise<CustomerOption[]> {
  await requireAdmin();
  try {
    return await searchCustomers(q);
  } catch (err) {
    console.error("[customer] search failed:", err);
    return [];
  }
}

const notesSchema = z.string().max(2000);

export async function updateCustomerNotesAction(
  id: string,
  rawNotes: string,
): Promise<{ ok: boolean }> {
  await requireAdmin();
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
