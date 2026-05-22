import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { listActiveServices } from "@/lib/db/services";
import {
  listPortfolioImages,
  BRUID_PROCESS_IMAGE_KEY,
  BRUID_HERO_IMAGES_KEY,
} from "@/lib/portfolio";
import { ServiceCard } from "@/components/public/service-card";
import { RotatingImage } from "@/components/public/rotating-image";
import {
  getResolvedContent,
  getSiteValue,
  getSiteStringArray,
} from "@/lib/db/site-content";
import { landing } from "@/content/landing";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Bruid",
  description:
    "Bruidsstyling op de mooiste dag — proefsessie, hairstyling op locatie, bridal party.",
};

export default async function BruidPage() {
  const [services, portfolio, content, processName, heroNames] =
    await Promise.all([
      listActiveServices("bridal"),
      listPortfolioImages(),
      getResolvedContent(),
      getSiteValue(BRUID_PROCESS_IMAGE_KEY),
      getSiteStringArray(BRUID_HERO_IMAGES_KEY),
    ]);
  // Admin-curated bridal photos win; otherwise fall back to the first six.
  const heroSet = new Set(heroNames);
  const pickedHero = portfolio.filter((p) => p.name && heroSet.has(p.name));
  const heroSlides = pickedHero.length > 0 ? pickedHero : portfolio.slice(0, 6);
  const stairImage =
    (processName
      ? portfolio.find((p) => p.name === processName)
      : undefined) ??
    portfolio.find((p) => p.src.includes("trap")) ??
    portfolio[1];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-accent/40 via-background to-muted/40">
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-accent/40 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 md:grid-cols-2 md:py-28">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Bruidsstyling
            </p>
            <h1 className="mt-6 text-5xl tracking-tight md:text-6xl">
              {content["bruid.hero.title"]}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              {content["bruid.intro"]}
            </p>
            <ul className="mt-8 grid gap-3 text-base">
              {landing.bridal.bullets.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="mt-2 h-1.5 w-1.5 rounded-full bg-primary"
                  />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <div className="mt-10">
              <Link
                href={landing.bridal.cta.href}
                className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-base text-primary-foreground shadow-sm transition hover:bg-primary/90"
              >
                {landing.bridal.cta.label}
              </Link>
            </div>
          </div>
          {heroSlides.length > 0 && (
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-muted">
              <RotatingImage
                images={heroSlides}
                sizes="(min-width: 768px) 50vw, 100vw"
                priority
              />
            </div>
          )}
        </div>
      </section>

      {/* Process */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          {stairImage && (
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-muted">
              <Image
                src={stairImage.src}
                alt={stairImage.alt}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          )}
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Hoe het werkt
            </p>
            <h2 className="mt-4 text-4xl tracking-tight">
              {content["bruid.process.title"]}
            </h2>
            <ol className="mt-8 space-y-6">
              {[
                {
                  n: "1",
                  title: content["bruid.step1.title"],
                  body: content["bruid.step1.body"],
                  note: null as string | null,
                },
                {
                  n: "2",
                  title: content["bruid.step2.title"],
                  body: content["bruid.step2.body"],
                  note: null as string | null,
                },
                {
                  n: "3",
                  title: content["bruid.step3.title"],
                  body: content["bruid.step3.body"],
                  note: content["bruid.step3.note"] || null,
                },
              ].map((step) => (
                <li key={step.n} className="flex items-start gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-medium text-accent-foreground">
                    {step.n}
                  </span>
                  <div>
                    <h3 className="text-lg">{step.title}</h3>
                    <p className="mt-1 text-muted-foreground">{step.body}</p>
                    {step.note && (
                      <p className="mt-2 flex gap-2 text-sm text-muted-foreground">
                        <span aria-hidden>•</span>
                        <span>{step.note}</span>
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {services.length > 0 && (
        <section className="border-t bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <h2 className="text-3xl tracking-tight">
              {content["bruid.services.title"]}
            </h2>
            <p className="mt-2 whitespace-pre-line text-muted-foreground">
              {content["bruid.services.intro"]}
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((s) => (
                <ServiceCard key={s.id} service={s} />
              ))}
            </div>

            <p className="mt-8 text-sm text-muted-foreground">
              Feestkapsel voor moeder, zussen of vriendinnen € 50 per
              persoon · reiskosten € 0,45 per kilometer vanaf Krabbendijke.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/brochure-bruidsstyling.pdf"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium transition hover:bg-accent"
              >
                Download bruidsbrochure (PDF)
              </a>
              <a
                href="/proefkapsel-info.pdf"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium transition hover:bg-accent"
              >
                Info proefkapsel (PDF)
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Closing CTA */}
      <section className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h2 className="text-4xl tracking-tight">
          {content["bruid.cta.title"]}
        </h2>
        <p className="mx-auto mt-4 max-w-xl whitespace-pre-line text-muted-foreground">
          {content["bruid.cta.body"]}
        </p>
        <div className="mt-8">
          <Link
            href={landing.bridal.cta.href}
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-base text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            {landing.bridal.cta.label}
          </Link>
        </div>
      </section>
    </>
  );
}
