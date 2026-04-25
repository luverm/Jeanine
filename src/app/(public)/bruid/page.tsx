import Link from "next/link";
import type { Metadata } from "next";
import { listActiveServices } from "@/lib/db/services";
import { ServiceCard } from "@/components/public/service-card";
import { landing } from "@/content/landing";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Bruid",
  description:
    "Bruidsstyling op de mooiste dag — proefsessie, hairstyling op locatie, bridal party.",
};

export default async function BruidPage() {
  const services = await listActiveServices("bridal");

  return (
    <>
      <section className="border-b bg-gradient-to-b from-muted/40 to-background">
        <div className="mx-auto max-w-6xl px-4 py-24 md:py-28">
          <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Bruid
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
            {landing.bridal.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            {landing.bridal.intro}
          </p>
          <ul className="mt-8 grid max-w-2xl gap-2 text-base">
            {landing.bridal.bullets.map((b) => (
              <li key={b} className="flex items-start gap-2">
                <span aria-hidden className="mt-2 h-1.5 w-1.5 rounded-full bg-foreground" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <div className="mt-10">
            <Link
              href={landing.bridal.cta.href}
              className="inline-flex items-center justify-center rounded-full bg-foreground px-6 py-3 text-base text-background hover:opacity-90"
            >
              {landing.bridal.cta.label}
            </Link>
          </div>
        </div>
      </section>

      {services.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-3xl font-semibold tracking-tight">
            Bruidsdiensten
          </h2>
          <p className="mt-2 text-muted-foreground">
            Geen directe online boeking — we plannen samen na een consult.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
