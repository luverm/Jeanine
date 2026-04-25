import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { listActiveServices } from "@/lib/db/services";
import { listPortfolioImages } from "@/lib/portfolio";
import { ServiceCard } from "@/components/public/service-card";
import { business } from "@/content/business";
import { landing } from "@/content/landing";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: business.name,
  description: business.tagline,
};

export default async function HomePage() {
  const [services, portfolio] = await Promise.all([
    listActiveServices(),
    listPortfolioImages(),
  ]);
  const regular = services.filter((s) => s.kind === "regular").slice(0, 3);
  const bridalTeaser = services.find((s) => s.kind === "bridal");
  const previewServices = bridalTeaser ? [...regular, bridalTeaser] : regular;
  const portfolioStrip = portfolio.slice(0, 6);

  return (
    <>
      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-muted/40 to-background">
        <div className="mx-auto max-w-6xl px-4 py-24 md:py-32">
          <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            {landing.hero.eyebrow}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
            {landing.hero.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            {landing.hero.subtitle}
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href={landing.hero.primaryCta.href}
              className="inline-flex items-center justify-center rounded-full bg-foreground px-6 py-3 text-base text-background hover:opacity-90"
            >
              {landing.hero.primaryCta.label}
            </Link>
            <Link
              href={landing.hero.secondaryCta.href}
              className="inline-flex items-center justify-center rounded-full border px-6 py-3 text-base hover:bg-accent"
            >
              {landing.hero.secondaryCta.label}
            </Link>
          </div>
        </div>
      </section>

      {/* Services preview */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Diensten</h2>
            <p className="mt-2 text-muted-foreground">
              Een greep uit het aanbod. Bekijk{" "}
              <Link href="/diensten" className="underline underline-offset-4">
                alle diensten
              </Link>
              .
            </p>
          </div>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {previewServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </section>

      {/* Portfolio strip */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-3xl font-semibold tracking-tight">Portfolio</h2>
            <Link
              href="/portfolio"
              className="text-sm underline underline-offset-4"
            >
              Bekijk alles
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {portfolioStrip.length > 0
              ? portfolioStrip.map((img) => (
                  <Link
                    key={img.src}
                    href="/portfolio"
                    className="relative block aspect-square overflow-hidden rounded-lg bg-muted"
                  >
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 50vw"
                      className="object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </Link>
                ))
              : Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-lg bg-muted"
                    aria-hidden
                  />
                ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="mx-auto max-w-3xl px-4 py-20">
        <h2 className="text-3xl font-semibold tracking-tight">
          {landing.about.title}
        </h2>
        <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-muted-foreground">
          {landing.about.body}
        </p>
      </section>

      {/* Reviews */}
      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-3xl font-semibold tracking-tight">Reviews</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {landing.reviews.map((r, i) => (
              <figure
                key={i}
                className="flex h-full flex-col rounded-lg border bg-background p-6"
              >
                <blockquote className="flex-1 text-base leading-relaxed">
                  &ldquo;{r.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-4 text-sm text-muted-foreground">
                  — {r.author}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
