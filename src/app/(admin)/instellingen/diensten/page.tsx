import type { Metadata } from "next";
import { listAllServices } from "@/lib/db/admin-services";
import { NewServiceTrigger, ServiceRow } from "@/components/admin/service-row";

export const metadata: Metadata = {
  title: "Diensten beheren",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function DienstenAdminPage() {
  const services = await listAllServices();
  const regular = services.filter((s) => s.kind === "regular");
  const bridal = services.filter((s) => s.kind === "bridal");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Diensten</h1>
        <NewServiceTrigger />
      </header>

      <section>
        <h2 className="text-sm font-medium text-muted-foreground">Regulier</h2>
        <div className="mt-3 grid gap-2">
          {regular.length === 0 && (
            <p className="text-sm text-muted-foreground">Geen reguliere diensten.</p>
          )}
          {regular.map((s) => (
            <ServiceRow key={s.id} service={s} />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-muted-foreground">Bruid</h2>
        <div className="mt-3 grid gap-2">
          {bridal.length === 0 && (
            <p className="text-sm text-muted-foreground">Geen bruidsdiensten.</p>
          )}
          {bridal.map((s) => (
            <ServiceRow key={s.id} service={s} />
          ))}
        </div>
      </section>
    </div>
  );
}
