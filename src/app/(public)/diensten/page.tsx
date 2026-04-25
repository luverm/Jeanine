import type { Metadata } from "next";
import { listActiveServices } from "@/lib/db/services";
import { ServiceCard } from "@/components/public/service-card";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Diensten",
  description: "Overzicht van alle reguliere en bruidsdiensten.",
};

export default async function DienstenPage() {
  const services = await listActiveServices();
  const regular = services.filter((s) => s.kind === "regular");
  const bridal = services.filter((s) => s.kind === "bridal");

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <header className="max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Aanbod
        </p>
        <h1 className="mt-4 text-5xl tracking-tight">Diensten</h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          Reguliere diensten boek je direct online. Bruidsstyling plan je via
          een vrijblijvend consult — zo kunnen we je look, locatie en planning
          rustig doornemen.
        </p>
      </header>

      {regular.length > 0 && (
        <section className="mt-16">
          <div className="flex items-baseline justify-between gap-4 border-b border-border pb-4">
            <h2 className="text-3xl tracking-tight">Reguliere diensten</h2>
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Direct online boekbaar
            </span>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {regular.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
        </section>
      )}

      {bridal.length > 0 && (
        <section className="mt-20">
          <div className="flex items-baseline justify-between gap-4 border-b border-border pb-4">
            <h2 className="text-3xl tracking-tight">Bruidsstyling</h2>
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Op aanvraag
            </span>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {bridal.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
