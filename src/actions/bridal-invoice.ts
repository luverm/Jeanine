"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getBusiness } from "@/lib/db/business-settings";
import { createBridalInvoice } from "@/lib/db/invoices";
import { setLeadAgreedPrice } from "@/lib/db/leads";
import { writeAuditLog } from "@/lib/db/bookings";

const schema = z.object({
  customerName: z.string().trim().min(1).max(120),
  customerEmail: z
    .string()
    .trim()
    .email()
    .max(254)
    .optional()
    .or(z.literal("")),
  issuedOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("")),
  leadId: z.string().uuid().optional().or(z.literal("")),
  depositCents: z.number().int().min(0).max(10_000_00).optional(),
  lines: z
    .array(
      z.object({
        description: z.string().trim().max(200),
        quantity: z.number().min(0).max(1000),
        unitCents: z.number().int().min(0).max(10_000_00),
      }),
    )
    .min(1)
    .max(40),
});

export type CreateBridalInvoiceResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createBridalInvoiceAction(
  input: unknown,
): Promise<CreateBridalInvoiceResult> {
  await requireAdmin();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Ongeldige invoer" };
  const d = parsed.data;

  const billable = d.lines.filter(
    (l) => l.description.trim() && l.quantity > 0,
  );
  if (billable.length === 0) {
    return { ok: false, error: "Voeg minimaal één regel met een aantal toe" };
  }

  try {
    const business = await getBusiness();
    const invoice = await createBridalInvoice({
      customerName: d.customerName,
      customerEmail: d.customerEmail ? d.customerEmail : null,
      issuedOn: d.issuedOn ? d.issuedOn : null,
      vatRate: business.vatRate,
      prefix: business.invoicePrefix,
      lines: billable,
      depositCents: d.depositCents,
    });
    if (d.leadId) {
      // Mirror the invoice total onto the lead's agreed price so the
      // lead detail reflects what was actually billed.
      await setLeadAgreedPrice(d.leadId, invoice.total_cents).catch((e) =>
        console.error("[bridal-invoice] lead price sync failed:", e),
      );
    }
    await writeAuditLog({
      actor: "admin",
      action: "invoice.create.bridal",
      entity: "invoice",
      entityId: invoice.id,
      payload: { leadId: d.leadId || null, number: invoice.number },
    });
    return { ok: true, id: invoice.id };
  } catch (err) {
    console.error("[bridal-invoice] create failed:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Aanmaken mislukt",
    };
  }
}
