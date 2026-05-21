"use server";

import { revalidatePath } from "next/cache";
import { serviceUpsertSchema } from "@/lib/schemas/service";
import {
  upsertService,
  deleteService as dbDeleteService,
  setServiceOrder,
} from "@/lib/db/admin-services";
import { writeAuditLog } from "@/lib/db/bookings";
import { getSiteStringArray, setSiteValue } from "@/lib/db/site-content";
import { requireAdmin } from "@/lib/auth/require-admin";

const FEATURED_SERVICES_KEY = "home.featured_services";

export type SaveServiceResult =
  | { ok: true }
  | { ok: false; message: string };

export async function saveServiceAction(input: unknown): Promise<SaveServiceResult> {
  await requireAdmin();
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

export async function reorderServicesAction(
  ids: unknown,
): Promise<{ ok: boolean }> {
  await requireAdmin();
  if (
    !Array.isArray(ids) ||
    ids.length > 200 ||
    ids.some((x) => typeof x !== "string")
  ) {
    return { ok: false };
  }
  try {
    await setServiceOrder(ids as string[]);
  } catch (err) {
    console.error("[service] reorder failed:", err);
    return { ok: false };
  }
  revalidatePath("/instellingen/diensten");
  revalidatePath("/diensten");
  revalidatePath("/boeken");
  revalidatePath("/");
  return { ok: true };
}

export async function setFeaturedServiceAction(
  id: unknown,
  featured: unknown,
): Promise<{ ok: boolean }> {
  await requireAdmin();
  if (typeof id !== "string" || typeof featured !== "boolean") {
    return { ok: false };
  }
  try {
    const set = new Set(await getSiteStringArray(FEATURED_SERVICES_KEY));
    if (featured) set.add(id);
    else set.delete(id);
    await setSiteValue(FEATURED_SERVICES_KEY, JSON.stringify([...set]));
  } catch (err) {
    console.error("[service] set featured failed:", err);
    return { ok: false };
  }
  revalidatePath("/");
  revalidatePath("/instellingen/diensten");
  return { ok: true };
}

export async function deleteServiceAction(id: string): Promise<{ ok: boolean }> {
  await requireAdmin();
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
