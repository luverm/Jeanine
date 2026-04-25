import Image from "next/image";
import type { Metadata } from "next";
import { listPortfolioImages } from "@/lib/portfolio";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Een selectie uit recent werk.",
};

export default async function PortfolioPage() {
  const images = await listPortfolioImages();

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <header className="max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight">Portfolio</h1>
        <p className="mt-4 text-muted-foreground">
          Een selectie uit recent werk — knip, kleur en bruid.
        </p>
      </header>

      {images.length === 0 ? (
        <div className="mt-12 rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          <p>Nog geen portfolio-afbeeldingen.</p>
          <p className="mt-2">
            Voeg foto&apos;s toe aan{" "}
            <code className="rounded bg-muted px-1.5 py-0.5">
              public/images/portfolio/
            </code>
            .
          </p>
        </div>
      ) : (
        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img) => (
            <div
              key={img.src}
              className="relative aspect-square overflow-hidden rounded-lg bg-muted"
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
