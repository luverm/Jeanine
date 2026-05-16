import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const PORTFOLIO_DIR = path.join(process.cwd(), "public", "images", "portfolio");
const ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".webp", ".avif"];
export const PORTFOLIO_BUCKET = "portfolio";

export type PortfolioImage = {
  src: string;
  alt: string;
  /** Storage object name when the image lives in Supabase Storage. */
  name?: string;
};

async function listFsPortfolio(): Promise<PortfolioImage[]> {
  let entries: string[];
  try {
    entries = await fs.readdir(PORTFOLIO_DIR);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
  return entries
    .filter((name) => ALLOWED_EXT.includes(path.extname(name).toLowerCase()))
    .sort()
    .map((name) => ({
      src: `/images/portfolio/${name}`,
      alt: path.parse(name).name.replace(/[-_]/g, " "),
    }));
}

/** Images uploaded by the admin to the Supabase Storage bucket. */
export async function listStoragePortfolio(): Promise<PortfolioImage[]> {
  try {
    const svc = createSupabaseServiceClient();
    const { data, error } = await svc.storage
      .from(PORTFOLIO_BUCKET)
      .list("", { limit: 200, sortBy: { column: "name", order: "asc" } });
    if (error || !data) return [];
    return data
      .filter((o) =>
        ALLOWED_EXT.includes(path.extname(o.name).toLowerCase()),
      )
      .map((o) => ({
        src: svc.storage.from(PORTFOLIO_BUCKET).getPublicUrl(o.name).data
          .publicUrl,
        alt: path.parse(o.name).name.replace(/[-_]/g, " "),
        name: o.name,
      }));
  } catch {
    return [];
  }
}

/** Storage images if any were uploaded, otherwise the bundled /public set. */
export async function listPortfolioImages(): Promise<PortfolioImage[]> {
  const fromStorage = await listStoragePortfolio();
  if (fromStorage.length > 0) return fromStorage;
  return listFsPortfolio();
}
