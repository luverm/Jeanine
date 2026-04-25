import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { listActiveServices } from "@/lib/db/services";
import { listPortfolioImages } from "@/lib/portfolio";
import { ServiceCard } from "@/components/public/service-card";
import { landing } from "@/content/landing";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Bruid",
  description:
    "Bruidsstyling op de mooiste dag — proefsessie, hairstyling op locatie, bridal party.",
};

export default async function BruidPage() {
  const [services, portfolio] = await Promise.all([
    listActiveServices("bridal"),
    listPortfolioImages(),
  ]);
  const heroImage =
    portfolio.find((p) => p.src.includes("portret")) ?? portfolio[0];
  const stairImage =
    portfolio.find((p) => p.src.includes("trap")) ?? portfolio[1];

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
              {landing.bridal.title}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              {landing.bridal.intro}
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
          {heroImage && (
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-muted">
              <Image
                src={heroImage.src}
                alt={heroImage.alt}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
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
            <h2 className="mt-4 text-4xl tracking-tight">Van consult tot dag-zelf</h2>
            <ol className="mt-8 space-y-6">
              {[
                {
                  n: "1",
                  title: "Consult",
                  body: "Vrijblijvend gesprek — we bespreken jouw stijl, jurk, locatie en planning.",
                },
                {
                  n: "2",
                  title: "Proefsessie",
                  body: "Ruim voor de dag werken we de look in detail uit met jouw accessoires.",
                },
                {
                  n: "3",
                  title: "De grote dag",
                  body: "Op locatie of in de studio — voor jou en eventueel je bridal party.",
                },
              ].map((step) => (
                <li key={step.n} className="flex items-start gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-medium text-accent-foreground">
                    {step.n}
                  </span>
                  <div>
                    <h3 className="text-lg">{step.title}</h3>
                    <p className="mt-1 text-muted-foreground">{step.body}</p>
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
            <h2 className="text-3xl tracking-tight">Bruidsdiensten</h2>
            <p className="mt-2 text-muted-foreground">
              Geen directe online boeking — we plannen samen na een consult.
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((s) => (
                <ServiceCard key={s.id} service={s} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Closing CTA */}
      <section className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h2 className="text-4xl tracking-tight">Klaar om te plannen?</h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Vertel kort over je trouwdag. We nemen binnen twee werkdagen contact
          op.
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
