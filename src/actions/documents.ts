"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import {
  PORTFOLIO_BUCKET,
  BRUID_BROCHURE_KEY,
  BRUID_PROEFKAPSEL_KEY,
} from "@/lib/portfolio";
import { setSiteValue } from "@/lib/db/site-content";
import { requireAdmin } from "@/lib/auth/require-admin";

const DOC_KEY = {
  brochure: BRUID_BROCHURE_KEY,
  proefkapsel: BRUID_PROEFKAPSEL_KEY,
} as const;

const MAX_BYTES = 15 * 1024 * 1024;

/** Uploads a PDF for one of the bridal-page document slots. */
export async function uploadDocumentAction(
  formData: FormData,
): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin();
  const slot = formData.get("slot");
  const file = formData.get("file");
  if (slot !== "brochure" && slot !== "proefkapsel") {
    return { ok: false, message: "Onbekend document." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Kies een PDF-bestand." };
  }
  if (file.type !== "application/pdf") {
    return { ok: false, message: "Alleen PDF-bestanden zijn toegestaan." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, message: "Bestand te groot (max 15MB)." };
  }

  const svc = createSupabaseServiceClient();
  const objectName = `documents/${slot}-${Date.now()}.pdf`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error } = await svc.storage
    .from(PORTFOLIO_BUCKET)
    .upload(objectName, bytes, {
      contentType: "application/pdf",
      upsert: true,
    });
  if (error) {
    console.error("[documents] upload failed:", error);
    return {
      ok: false,
      message: "Upload mislukt. Bestaat de Storage-bucket 'portfolio' al?",
    };
  }

  const url = svc.storage
    .from(PORTFOLIO_BUCKET)
    .getPublicUrl(objectName).data.publicUrl;
  try {
    await setSiteValue(DOC_KEY[slot], url);
  } catch (err) {
    console.error("[documents] save url failed:", err);
    return { ok: false, message: "Opslaan mislukt." };
  }

  revalidatePath("/bruid");
  revalidatePath("/instellingen/documenten");
  return { ok: true };
}
