import Link from "next/link";
import type { Metadata } from "next";
import { listHeroImages } from "@/lib/hero";
import { HeroAdmin } from "@/components/admin/hero-admin";

export const metadata: Metadata = {
  title: "Hero-afbeeldingen",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function HeroAdminPage() {
  const images = await listHeroImages();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/instellingen"
        className="text-xs text-muted-foreground underline underline-offset-4"
      >
        ← Instellingen
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">
        Hero-afbeeldingen
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        De foto&apos;s die als slideshow bovenaan de homepagina draaien.
        Apart van het portfolio. Laat je dit leeg, dan worden automatisch
        je portfolio-foto&apos;s gebruikt.
      </p>

      <div className="mt-8">
        <HeroAdmin images={images} />
      </div>
    </div>
  );
}
