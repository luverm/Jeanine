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
        <h1 className="text-4xl font-semibold tracking-tight">Diensten</h1>
        <p className="mt-4 text-muted-foreground">
          Reguliere diensten boek je direct online. Bruidsstyling plan je via
          een vrijblijvend consult.
        </p>
      </header>

      {regular.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-semibold tracking-tight">
            Reguliere diensten
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {regular.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
        </section>
      )}

      {bridal.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-semibold tracking-tight">Bruid</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {bridal.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
