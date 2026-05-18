"use server";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";

const BRIDAL_BUCKET = "bridal-moodboards";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_BYTES = 8 * 1024 * 1024;

function ext(type: string): string {
  if (type === "image/png") return ".png";
  if (type === "image/webp") return ".webp";
  if (type === "image/avif") return ".avif";
  return ".jpg";
}

/**
 * Uploads inspiration images to the private bucket and returns their
 * object paths. Best-effort: returns [] on any failure so a missing
 * bucket never blocks the lead form.
 */
export async function uploadBridalAttachments(
  formData: FormData,
): Promise<{ paths: string[] }> {
  const files = formData
    .getAll("files")
    .filter((f): f is File => f instanceof File && f.size > 0)
    .slice(0, 8);
  if (files.length === 0) return { paths: [] };

  const ip = await getClientIp();
  const limited = await rateLimit({
    key: `bridal-upload:${ip}`,
    max: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) return { paths: [] };

  const svc = createSupabaseServiceClient();
  const folder = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const paths: string[] = [];
  for (const file of files) {
    if (!ALLOWED.includes(file.type) || file.size > MAX_BYTES) continue;
    const objectPath = `${folder}/${paths.length + 1}${ext(file.type)}`;
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const { error } = await svc.storage
        .from(BRIDAL_BUCKET)
        .upload(objectPath, bytes, { contentType: file.type });
      if (!error) paths.push(objectPath);
      else console.error("[bridal-upload] failed:", error.message);
    } catch (err) {
      console.error("[bridal-upload] failed:", err);
    }
  }
  return { paths };
}

/** Short-lived signed URLs for the admin lead detail view. */
export async function signBridalAttachments(
  paths: string[],
): Promise<string[]> {
  if (!paths || paths.length === 0) return [];
  try {
    const svc = createSupabaseServiceClient();
    const { data, error } = await svc.storage
      .from(BRIDAL_BUCKET)
      .createSignedUrls(paths, 60 * 60);
    if (error || !data) return [];
    return data
      .map((d) => d.signedUrl)
      .filter((u): u is string => Boolean(u));
  } catch {
    return [];
  }
}

/** Best-effort removal of a lead's inspiration images from Storage. */
export async function deleteBridalAttachments(
  paths: string[],
): Promise<void> {
  if (!paths || paths.length === 0) return;
  try {
    const svc = createSupabaseServiceClient();
    await svc.storage.from(BRIDAL_BUCKET).remove(paths);
  } catch (err) {
    console.error("[bridal-upload] attachment cleanup failed:", err);
  }
}
