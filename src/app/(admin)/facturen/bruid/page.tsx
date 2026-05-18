import Link from "next/link";
import type { Metadata } from "next";
import { getBusiness } from "@/lib/db/business-settings";
import { getLead } from "@/lib/db/leads";
import { BridalInvoiceForm } from "@/components/admin/bridal-invoice-form";

export const metadata: Metadata = {
  title: "Bruidsfactuur maken",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function BridalInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ lead?: string }>;
}) {
  const { lead: leadId } = await searchParams;
  const [{ vatRate }, lead] = await Promise.all([
    getBusiness(),
    leadId ? getLead(leadId) : Promise.resolve(null),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href={lead ? `/leads/${lead.id}` : "/instellingen/financien"}
        className="text-xs text-muted-foreground underline underline-offset-4"
      >
        ← Terug
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">
        Bruidsfactuur maken
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Regels zijn voorgevuld vanuit de bruidsbrochure. Pas aantallen en
        bedragen aan; lege regels of regels met aantal 0 tellen niet mee.
      </p>

      <div className="mt-8">
        <BridalInvoiceForm
          prefill={
            lead
              ? { customerName: lead.full_name, customerEmail: lead.email }
              : undefined
          }
          leadId={lead?.id}
          vatRate={vatRate}
        />
      </div>
    </div>
  );
}
