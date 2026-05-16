import Link from "next/link";
import type { Metadata } from "next";
import { loadDashboardKpis } from "@/lib/db/admin-bookings";
import { listLeads } from "@/lib/db/leads";
import { Card } from "@/components/ui/card";
import { MonthCalendar } from "@/components/admin/month-calendar";
import { formatPrice } from "@/lib/db/services";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const [kpis, leads] = await Promise.all([
    loadDashboardKpis(),
    listLeads("new"),
  ]);

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

      <section className="mt-6 flex flex-wrap gap-2">
        <QuickAction href="/boekingen" label="Alle boekingen" />
        <QuickAction href="/instellingen/vrije-dagen" label="Vrije dag blokkeren" />
        <QuickAction href="/instellingen/openingstijden" label="Openingstijden" />
        <QuickAction href="/instellingen/diensten" label="Diensten" />
      </section>

      <div className="mt-8">
        <MonthCalendar month={month} />
      </div>

      <Card className="mt-8 p-6">
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
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {leads.slice(0, 6).map((lead) => (
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
    </div>
  );
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-4 text-sm font-medium hover:bg-accent"
    >
      {label}
    </Link>
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
