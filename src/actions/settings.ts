"use server";

import { z } from "zod";
import { updateBusinessSettings } from "@/lib/db/business-settings";

const schema = z.object({
  name: z.string().trim().max(160),
  ownerName: z.string().trim().max(160),
  tagline: z.string().trim().max(400),
  email: z.string().trim().max(254),
  phone: z.string().trim().max(40),
  street: z.string().trim().max(160),
  postcode: z.string().trim().max(20),
  city: z.string().trim().max(120),
  kvk: z.string().trim().max(40),
  btw: z.string().trim().max(40),
  instagram: z.string().trim().max(120),
  instagramUrl: z.string().trim().max(300),
  tiktok: z.string().trim().max(120),
});

export async function updateBusinessSettingsAction(
  formData: FormData,
): Promise<{ ok: boolean }> {
  const raw = Object.fromEntries(
    [
      "name",
      "ownerName",
      "tagline",
      "email",
      "phone",
      "street",
      "postcode",
      "city",
      "kvk",
      "btw",
      "instagram",
      "instagramUrl",
      "tiktok",
    ].map((k) => [k, String(formData.get(k) ?? "")]),
  );
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false };
  try {
    await updateBusinessSettings(parsed.data);
  } catch (err) {
    console.error("[settings] update failed:", err);
    return { ok: false };
  }
  return { ok: true };
}
