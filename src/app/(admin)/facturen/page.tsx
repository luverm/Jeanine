import Link from "next/link";
import type { Metadata } from "next";
import { listInvoices } from "@/lib/db/invoices";
import { formatPrice } from "@/lib/db/services";
import { DangerDeleteInvoices } from "@/components/admin/danger-delete-invoices";

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
        <div className="mt-6 overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Nummer</th>
                <th className="px-4 py-3">Datum</th>
                <th className="px-4 py-3">Klant</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Totaal</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-accent/40">
                  <td className="px-4 py-3">
                    <Link
                      href={`/facturen/${inv.id}`}
                      className="font-medium underline underline-offset-4"
                    >
                      {inv.number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {inv.issued_on}
                  </td>
                  <td className="px-4 py-3">{inv.customer_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {inv.booking_id ? "Boeking" : "Bruid"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatPrice(inv.total_cents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DangerDeleteInvoices />
    </div>
  );
}
