"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { deleteAllInvoices } from "@/lib/db/invoices";
import { writeAuditLog } from "@/lib/db/bookings";

const BULK_DELETE_PHRASE = "VERWIJDER";

/**
 * Hard-deletes EVERY invoice (and via cascade, every invoice line).
 * Irreversible. Double-guarded: admin only + exact confirmation phrase.
 */
export async function deleteAllInvoicesAction(
  confirm: string,
): Promise<{ ok: boolean; deleted?: number }> {
  await requireAdmin();
  if (confirm !== BULK_DELETE_PHRASE) return { ok: false };

  let deleted: number;
  try {
    deleted = await deleteAllInvoices();
  } catch (err) {
    console.error("[admin-invoice] bulk delete failed:", err);
    return { ok: false };
  }

  await writeAuditLog({
    actor: "admin",
    action: "invoice.bulk_delete",
    entity: "invoice",
    entityId: "00000000-0000-0000-0000-000000000000",
    payload: { deleted },
  }).catch(() => {});

  revalidatePath("/facturen");
  revalidatePath("/dashboard");
  revalidatePath("/instellingen/financien");
  return { ok: true, deleted };
}
