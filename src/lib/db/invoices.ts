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

function splitVat(inclCents: number, vatRate: number) {
  if (vatRate <= 0) return { subtotal: inclCents, vat: 0 };
  const subtotal = Math.round(inclCents / (1 + vatRate / 100));
  return { subtotal, vat: inclCents - subtotal };
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

  const year = new Date().getFullYear();
  const { count } = await svc
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .gte("issued_on", `${year}-01-01`)
    .lte("issued_on", `${year}-12-31`);
  const seq = (count ?? 0) + 1;
  const number = `${args.prefix}${year}-${String(seq).padStart(3, "0")}`;

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
