import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type InvoiceRow = {
  id: string;
  number: string;
  booking_id: string | null;
  customer_name: string;
  customer_email: string | null;
  issued_on: string;
  description: string;
  subtotal_cents: number;
  vat_rate: number;
  vat_cents: number;
  total_cents: number;
  created_at: string;
};

export async function getInvoiceByBooking(
  bookingId: string,
): Promise<InvoiceRow | null> {
  const svc = createSupabaseServiceClient();
  const { data, error } = await svc
    .from("invoices")
    .select("*")
    .eq("booking_id", bookingId)
    .maybeSingle();
  if (error) throw error;
  return (data as InvoiceRow | null) ?? null;
}

export type InvoiceLine = {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_cents: number;
  amount_cents: number;
  sort: number;
};

function splitVat(inclCents: number, vatRate: number) {
  if (vatRate <= 0) return { subtotal: inclCents, vat: 0 };
  const subtotal = Math.round(inclCents / (1 + vatRate / 100));
  return { subtotal, vat: inclCents - subtotal };
}

/** Next sequential invoice number for the current year: {prefix}{YYYY}-{NNN}. */
async function nextInvoiceNumber(
  svc: ReturnType<typeof createSupabaseServiceClient>,
  prefix: string,
): Promise<string> {
  const year = new Date().getFullYear();
  const { count } = await svc
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .gte("issued_on", `${year}-01-01`)
    .lte("issued_on", `${year}-12-31`);
  const seq = (count ?? 0) + 1;
  return `${prefix}${year}-${String(seq).padStart(3, "0")}`;
}

/**
 * Returns the existing invoice for a booking, or creates one with the
 * next sequential number ({prefix}{YYYY}-{NNN}).
 */
export async function ensureInvoiceForBooking(args: {
  bookingId: string;
  customerName: string;
  customerEmail: string | null;
  description: string;
  inclCents: number;
  vatRate: number;
  prefix: string;
}): Promise<InvoiceRow> {
  const svc = createSupabaseServiceClient();

  const existing = await getInvoiceByBooking(args.bookingId);
  if (existing) return existing;

  const number = await nextInvoiceNumber(svc, args.prefix);

  const { subtotal, vat } = splitVat(args.inclCents, args.vatRate);
  const { data, error } = await svc
    .from("invoices")
    .insert({
      number,
      booking_id: args.bookingId,
      customer_name: args.customerName,
      customer_email: args.customerEmail,
      description: args.description,
      subtotal_cents: subtotal,
      vat_rate: args.vatRate,
      vat_cents: vat,
      total_cents: args.inclCents,
    })
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Failed to create invoice");
  return data as InvoiceRow;
}

export type BridalInvoiceLineInput = {
  description: string;
  quantity: number;
  unitCents: number;
};

/**
 * Creates a standalone (no booking) invoice with itemised lines —
 * used by the bridal invoice maker. Amounts are VAT-inclusive; the
 * split follows the same rule as booking invoices.
 */
export async function createBridalInvoice(args: {
  customerName: string;
  customerEmail: string | null;
  issuedOn: string | null;
  vatRate: number;
  prefix: string;
  lines: BridalInvoiceLineInput[];
}): Promise<InvoiceRow> {
  const svc = createSupabaseServiceClient();

  const lines = args.lines
    .map((l) => ({
      description: l.description.trim(),
      quantity: l.quantity,
      unit_cents: Math.round(l.unitCents),
      amount_cents: Math.round(l.quantity * l.unitCents),
    }))
    .filter((l) => l.description && l.quantity > 0);
  if (lines.length === 0) throw new Error("Geen factuurregels");

  const inclTotal = lines.reduce((s, l) => s + l.amount_cents, 0);
  const number = await nextInvoiceNumber(svc, args.prefix);
  const { subtotal, vat } = splitVat(inclTotal, args.vatRate);
  const summary =
    lines.length === 1 ? lines[0].description : "Bruidsstyling — zie specificatie";

  const { data, error } = await svc
    .from("invoices")
    .insert({
      number,
      booking_id: null,
      customer_name: args.customerName,
      customer_email: args.customerEmail,
      issued_on: args.issuedOn || undefined,
      description: summary,
      subtotal_cents: subtotal,
      vat_rate: args.vatRate,
      vat_cents: vat,
      total_cents: inclTotal,
    })
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Failed to create invoice");
  const invoice = data as InvoiceRow;

  const { error: lineErr } = await svc.from("invoice_lines").insert(
    lines.map((l, i) => ({
      invoice_id: invoice.id,
      description: l.description,
      quantity: l.quantity,
      unit_cents: l.unit_cents,
      amount_cents: l.amount_cents,
      sort: i,
    })),
  );
  if (lineErr) throw lineErr;

  return invoice;
}

export async function getInvoiceWithLines(
  invoiceId: string,
): Promise<{ invoice: InvoiceRow; lines: InvoiceLine[] } | null> {
  const svc = createSupabaseServiceClient();
  const { data: inv } = await svc
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .maybeSingle();
  if (!inv) return null;
  const { data: lines } = await svc
    .from("invoice_lines")
    .select("id, invoice_id, description, quantity, unit_cents, amount_cents, sort")
    .eq("invoice_id", invoiceId)
    .order("sort", { ascending: true });
  return {
    invoice: inv as InvoiceRow,
    lines: (lines ?? []) as InvoiceLine[],
  };
}
