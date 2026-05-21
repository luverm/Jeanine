import type { Metadata } from "next";
import { listAllServices } from "@/lib/db/admin-services";
import { NewServiceTrigger } from "@/components/admin/service-row";
import { ServiceList } from "@/components/admin/service-list";
import type { Service } from "@/lib/services-format";

export const metadata: Metadata = {
  title: "Diensten beheren",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

function sig(services: Service[]) {
  return services
    .map((s) => `${s.id}:${s.sort_order}:${s.name}`)
    .join("|");
}

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

      <p className="mb-6 text-sm text-muted-foreground">
        Sleep met de greep links om de volgorde aan te passen — die
        volgorde wordt ook op de website en in het boekformulier gebruikt.
      </p>

      <section>
        <h2 className="text-sm font-medium text-muted-foreground">Regulier</h2>
        <div className="mt-3">
          {regular.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Geen reguliere diensten.
            </p>
          ) : (
            <ServiceList key={sig(regular)} services={regular} />
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-muted-foreground">Bruid</h2>
        <div className="mt-3">
          {bridal.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Geen bruidsdiensten.
            </p>
          ) : (
            <ServiceList key={sig(bridal)} services={bridal} />
          )}
        </div>
      </section>
    </div>
  );
}
