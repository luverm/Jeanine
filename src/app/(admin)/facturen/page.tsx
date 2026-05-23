import Link from "next/link";
import type { Metadata } from "next";
import { listInvoices } from "@/lib/db/invoices";
import { DangerDeleteInvoices } from "@/components/admin/danger-delete-invoices";
import { InvoicesList } from "@/components/admin/invoices-list";

export const metadata: Metadata = {
  title: "Facturen",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function InvoicesListPage() {
  let invoices;
  try {
    invoices = await listInvoices();
  } catch {
    invoices = null;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/dashboard"
            className="text-xs text-muted-foreground underline underline-offset-4"
          >
            ← Dashboard
          </Link>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Facturen
          </h1>
        </div>
        <Link
          href="/facturen/bruid"
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Bruidsfactuur maken
        </Link>
      </div>

      {invoices === null ? (
        <p className="mt-6 rounded-lg border p-6 text-sm text-muted-foreground">
          Nog niet beschikbaar. Draai migratie 0011 (en 0019 voor
          bruidsfacturen) in Supabase.
        </p>
      ) : invoices.length === 0 ? (
        <p className="mt-6 rounded-lg border p-6 text-sm text-muted-foreground">
          Nog geen facturen.
        </p>
      ) : (
        <InvoicesList invoices={invoices} />
      )}

      <DangerDeleteInvoices />
    </div>
  );
}
