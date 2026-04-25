"use server";

import { revalidatePath } from "next/cache";
import { serviceUpsertSchema } from "@/lib/schemas/service";
import {
  upsertService,
  deleteService as dbDeleteService,
} from "@/lib/db/admin-services";
import { writeAuditLog } from "@/lib/db/bookings";

export type SaveServiceResult =
  | { ok: true }
  | { ok: false; message: string };

export async function saveServiceAction(input: unknown): Promise<SaveServiceResult> {
  const parsed = serviceUpsertSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.message };
  }
  const row = await upsertService({
    ...parsed.data,
    description: parsed.data.description ?? null,
  });
  await writeAuditLog({
    actor: "admin",
    action: "service.upsert",
    entity: "service",
    entityId: row.id,
    payload: parsed.data,
  }).catch(() => {});
  revalidatePath("/instellingen/diensten");
  revalidatePath("/diensten");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteServiceAction(id: string): Promise<{ ok: boolean }> {
  await dbDeleteService(id);
  await writeAuditLog({
    actor: "admin",
    action: "service.delete",
    entity: "service",
    entityId: id,
  }).catch(() => {});
  revalidatePath("/instellingen/diensten");
  revalidatePath("/diensten");
  revalidatePath("/");
  return { ok: true };
}
