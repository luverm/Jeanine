"use server";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { PORTFOLIO_BUCKET } from "@/lib/portfolio";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_BYTES = 8 * 1024 * 1024;

function safeName(original: string): string {
  const dot = original.lastIndexOf(".");
  const ext = dot >= 0 ? original.slice(dot).toLowerCase() : ".jpg";
  const base = (dot >= 0 ? original.slice(0, dot) : original)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "foto";
  return `${Date.now()}-${base}${ext}`;
}

export async function uploadPortfolio(
  formData: FormData,
): Promise<{ ok: boolean; uploaded: number; message?: string }> {
  const files = formData.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) return { ok: false, uploaded: 0, message: "Geen bestanden." };

  const svc = createSupabaseServiceClient();
  let uploaded = 0;
  for (const file of files) {
    if (file.size === 0) continue;
    if (!ALLOWED.includes(file.type)) {
      return { ok: false, uploaded, message: `Type niet toegestaan: ${file.type}` };
    }
    if (file.size > MAX_BYTES) {
      return { ok: false, uploaded, message: `${file.name} is te groot (max 8MB).` };
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error } = await svc.storage
      .from(PORTFOLIO_BUCKET)
      .upload(safeName(file.name), bytes, { contentType: file.type });
    if (error) {
      console.error("[portfolio] upload failed:", error);
      return {
        ok: false,
        uploaded,
        message:
          "Upload mislukt. Bestaat de Storage-bucket 'portfolio' al?",
      };
    }
    uploaded += 1;
  }
  return { ok: true, uploaded };
}

export async function deletePortfolio(
  name: string,
): Promise<{ ok: boolean }> {
  try {
    const svc = createSupabaseServiceClient();
    const { error } = await svc.storage
      .from(PORTFOLIO_BUCKET)
      .remove([name]);
    if (error) return { ok: false };
  } catch {
    return { ok: false };
  }
  return { ok: true };
}
