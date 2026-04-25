import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { format } from "date-fns";
import { getLead } from "@/lib/db/leads";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LeadStatusSelect } from "@/components/admin/lead-status-select";

export const metadata: Metadata = {
  title: "Lead detail",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await getLead(id);
  if (!lead) notFound();

  const wedding = lead.wedding_date
    ? format(new Date(lead.wedding_date), "EEEE d MMMM yyyy")
    : "—";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/leads"
        className="text-xs text-muted-foreground underline underline-offset-4"
      >
        ← Alle leads
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {lead.full_name}
          </h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <span>Trouwdatum: {wedding}</span>
            <Badge variant="outline">{lead.status}</Badge>
          </div>
        </div>
        <div>
          <LeadStatusSelect leadId={lead.id} status={lead.status} />
        </div>
      </header>

      <Card className="mt-8 grid gap-3 p-6 text-sm">
        <Row label="E-mail" value={<a href={`mailto:${lead.email}`}>{lead.email}</a>} />
        {lead.phone && (
          <Row label="Telefoon" value={<a href={`tel:${lead.phone}`}>{lead.phone}</a>} />
        )}
        {lead.location && <Row label="Locatie" value={lead.location} />}
        {typeof lead.party_size === "number" && (
          <Row
            label="Aantal personen"
            value={String(lead.party_size)}
          />
        )}
        {lead.services_wanted && lead.services_wanted.length > 0 && (
          <Row label="Diensten" value={lead.services_wanted.join(", ")} />
        )}
        {typeof lead.budget_cents === "number" && (
          <Row
            label="Budget"
            value={`€ ${(lead.budget_cents / 100).toLocaleString("nl-NL")}`}
          />
        )}
      </Card>

      {lead.message && (
        <Card className="mt-6 p-6">
          <h2 className="text-base font-semibold">Bericht</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {lead.message}
          </p>
        </Card>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
