"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import {
  updateCustomerNotes,
  updateCustomerContact,
  searchCustomers,
  deleteCustomers,
  type CustomerOption,
} from "@/lib/db/admin-customers";
import { writeAuditLog } from "@/lib/db/bookings";
import { uuidString } from "@/lib/schemas/uuid";
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

const contactSchema = z.object({
  id: uuidString(),
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: z.string().trim().max(40).optional(),
});

export async function updateCustomerContactAction(
  input: unknown,
): Promise<{ ok: boolean; code?: "INVALID" | "DUPLICATE_EMAIL" }> {
  await requireAdmin();
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "INVALID" };
  try {
    await updateCustomerContact(parsed.data.id, {
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      phone: parsed.data.phone?.trim() ? parsed.data.phone : null,
    });
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === "23505") return { ok: false, code: "DUPLICATE_EMAIL" };
    console.error("[customer] contact update failed:", err);
    return { ok: false };
  }
  await writeAuditLog({
    actor: "admin",
    action: "customer.contact_update",
    entity: "customer",
    entityId: parsed.data.id,
    payload: {
      email: parsed.data.email,
      phone: parsed.data.phone ?? null,
    },
  }).catch(() => {});
  revalidatePath(`/klanten/${parsed.data.id}`);
  revalidatePath("/klanten");
  return { ok: true };
}

export async function deleteCustomersAction(
  ids: unknown,
): Promise<{ ok: boolean; deleted?: number }> {
  await requireAdmin();
  const parsed = z.array(uuidString()).min(1).max(500).safeParse(ids);
  if (!parsed.success) return { ok: false };

  let deleted: number;
  try {
    deleted = await deleteCustomers(parsed.data);
  } catch (err) {
    console.error("[customer] delete failed:", err);
    return { ok: false };
  }

  await writeAuditLog({
    actor: "admin",
    action: "customer.delete",
    entity: "customer",
    entityId: "00000000-0000-0000-0000-000000000000",
    payload: { requested: parsed.data.length, deleted },
  }).catch(() => {});

  revalidatePath("/klanten");
  return { ok: true, deleted };
}
