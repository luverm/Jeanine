import fs from "node:fs/promises";
import path from "node:path";

const PORTFOLIO_DIR = path.join(process.cwd(), "public", "images", "portfolio");
const ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".webp", ".avif"];

export type PortfolioImage = {
  src: string;
  alt: string;
};

export async function listPortfolioImages(): Promise<PortfolioImage[]> {
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
