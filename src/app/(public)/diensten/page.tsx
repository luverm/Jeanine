import type { Metadata } from "next";
import { listActiveServices } from "@/lib/db/services";
import type { Service } from "@/lib/services-format";
import { ServiceCard } from "@/components/public/service-card";
import { SERVICE_CATEGORIES, categoryForSlug } from "@/content/services";
import { getResolvedContent } from "@/lib/db/site-content";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Diensten",
  description: "Overzicht van alle diensten: knippen, kleuren, feestkapsels en bruid.",
};

export default async function DienstenPage() {
  const [services, content] = await Promise.all([
    listActiveServices(),
    getResolvedContent(),
  ]);

  const buckets = new Map<string, Service[]>();
  for (const s of services) {
    const key = categoryForSlug(s.slug)?.key ?? "overig";
    const list = buckets.get(key);
    if (list) list.push(s);
    else buckets.set(key, [s]);
  }

  const groups = [
    ...SERVICE_CATEGORIES.map((c) => ({
      key: c.key,
      label: c.label,
      items: buckets.get(c.key) ?? [],
    })),
    { key: "overig", label: "Overig", items: buckets.get("overig") ?? [] },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <header className="max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Aanbod
        </p>
        <h1 className="mt-4 text-5xl tracking-tight">Diensten</h1>
        <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-muted-foreground">
          {content["diensten.intro"]}
        </p>
      </header>

      {groups.map((g) => (
        <section key={g.key} className="mt-16">
          <div className="flex items-baseline justify-between gap-4 border-b border-border pb-4">
            <h2 className="text-3xl tracking-tight">{g.label}</h2>
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              {g.key === "bruid" ? "Op aanvraag" : "Direct online boekbaar"}
            </span>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {g.items.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
