import Link from "next/link";
import type { Metadata } from "next";
import {
  loadDashboardKpis,
  listTodaysAgenda,
} from "@/lib/db/admin-bookings";
import { listLeads } from "@/lib/db/leads";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/db/services";
import { formatTime, formatIsoDate } from "@/lib/time";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [kpis, agenda, leads] = await Promise.all([
    loadDashboardKpis(),
    listTodaysAgenda(),
    listLeads("new"),
  ]);

  const today = formatIsoDate(new Date());
  const todays = agenda.filter((b) => formatIsoDate(new Date(b.starts_at)) === today);
  const tomorrows = agenda.filter((b) => formatIsoDate(new Date(b.starts_at)) !== today);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Vandaag" value={String(kpis.bookingsToday)} />
        <Kpi label="Omzet deze week" value={formatPrice(kpis.weekRevenueCents)} />
        <Kpi label="Open leads" value={String(kpis.openLeads)} />
        <Kpi label="No-shows (30d)" value={String(kpis.noShowsLast30Days)} />
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Vandaag</h2>
            <Link
              href="/boekingen"
              className="text-xs text-muted-foreground underline underline-offset-4"
            >
              Alle boekingen
            </Link>
          </div>
          <AgendaList items={todays} empty="Geen afspraken vandaag." />

          <h3 className="mt-8 text-sm font-medium text-muted-foreground">
            Morgen
          </h3>
          <AgendaList items={tomorrows} empty="Geen afspraken morgen." />
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Nieuwe leads</h2>
            <Link
              href="/leads"
              className="text-xs text-muted-foreground underline underline-offset-4"
            >
              Alle leads
            </Link>
          </div>
          {leads.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              Geen openstaande leads.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {leads.slice(0, 5).map((lead) => (
                <li key={lead.id} className="rounded border p-3 text-sm">
                  <Link href={`/leads/${lead.id}`} className="block">
                    <p className="font-medium">{lead.full_name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {lead.wedding_date ?? "datum onbekend"}
                      {lead.location ? ` · ${lead.location}` : ""}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
    </Card>
  );
}

function AgendaList({
  items,
  empty,
}: {
  items: Awaited<ReturnType<typeof listTodaysAgenda>>;
  empty: string;
}) {
  if (items.length === 0) {
    return <p className="mt-4 text-sm text-muted-foreground">{empty}</p>;
  }
  return (
    <ul className="mt-4 divide-y">
      {items.map((b) => (
        <li key={b.id} className="py-3">
          <Link
            href={`/boekingen/${b.id}`}
            className="flex items-center justify-between gap-3 text-sm hover:opacity-80"
          >
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs">
                {formatTime(new Date(b.starts_at))}
              </span>
              <span>{b.service?.name ?? "—"}</span>
              <Badge variant="outline" className="ml-2">
                {b.status}
              </Badge>
            </div>
            <span className="text-muted-foreground">
              {b.customer?.full_name ?? "—"}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
