import "server-only";
import path from "node:path";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".webp", ".avif"];
export const HERO_BUCKET = "hero";

export type HeroImage = {
  src: string;
  alt: string;
  /** Storage object name (present for admin-managed images). */
  name?: string;
};

/**
 * Hero slideshow images, managed by the admin in the 'hero' Storage
 * bucket. Independent of the portfolio set; the landing page falls
 * back to portfolio when this is empty.
 */
export async function listHeroImages(): Promise<HeroImage[]> {
  try {
    const svc = createSupabaseServiceClient();
    const { data, error } = await svc.storage
      .from(HERO_BUCKET)
      .list("", { limit: 50, sortBy: { column: "name", order: "asc" } });
    if (error || !data) return [];
    return data
      .filter((o) => ALLOWED_EXT.includes(path.extname(o.name).toLowerCase()))
      .map((o) => ({
        src: svc.storage.from(HERO_BUCKET).getPublicUrl(o.name).data
          .publicUrl,
        alt: path.parse(o.name).name.replace(/[-_]/g, " "),
        name: o.name,
      }));
  } catch {
    return [];
  }
}
