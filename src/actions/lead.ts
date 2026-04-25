"use server";

import { leadInputSchema } from "@/lib/schemas/lead";
import { insertLead, updateLeadStatus, type LeadStatus } from "@/lib/db/leads";
import { writeAuditLog } from "@/lib/db/bookings";
import { sendEmail } from "@/lib/email/client";
import { LeadAdminNotify } from "@/lib/email/templates/lead-admin-notify";
import { LeadCustomerAck } from "@/lib/email/templates/lead-customer-ack";
import { verifyTurnstile } from "@/lib/turnstile";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";
import { getServerEnv } from "@/lib/env";

export type CreateLeadResult =
  | { ok: true; leadId: string }
  | {
      ok: false;
      code:
        | "INVALID_INPUT"
        | "RATE_LIMITED"
        | "VERIFICATION_FAILED"
        | "INTERNAL";
      message?: string;
    };

const RATE_LIMIT = { max: 3, windowMs: 60 * 60 * 1000 } as const;

export async function createLead(input: unknown): Promise<CreateLeadResult> {
  const parsed = leadInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "INVALID_INPUT", message: parsed.error.message };
  }
  const data = parsed.data;

  // Honeypot — silently fail.
  if (data.website) {
    return { ok: false, code: "INVALID_INPUT" };
  }

  const ip = await getClientIp();
  const limited = rateLimit({
    key: `lead:${ip}`,
    max: RATE_LIMIT.max,
    windowMs: RATE_LIMIT.windowMs,
  });
  if (!limited.ok) {
    return { ok: false, code: "RATE_LIMITED" };
  }

  const ok = await verifyTurnstile(data.turnstileToken, ip);
  if (!ok) {
    return { ok: false, code: "VERIFICATION_FAILED" };
  }

  const lead = await insertLead({
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    weddingDate: data.weddingDate,
    location: `${data.city} (${data.postcode})`,
    partySize: data.partySize,
    servicesWanted: data.servicesWanted,
    budgetCents: data.budgetCents ?? null,
    message: data.message?.trim() || undefined,
  });

  await safe(() =>
    writeAuditLog({
      actor: "public",
      action: "lead.create",
      entity: "bridal_lead",
      entityId: lead.id,
      payload: {
        weddingDate: data.weddingDate,
        partySize: data.partySize,
        servicesWanted: data.servicesWanted,
      },
    }),
  );

  await safe(() => sendLeadEmails({ leadId: lead.id, data }));

  return { ok: true, leadId: lead.id };
}

async function sendLeadEmails(args: {
  leadId: string;
  data: ReturnType<typeof leadInputSchema.parse>;
}) {
  const { ADMIN_NOTIFY_EMAIL } = getServerEnv();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const leadUrl = `${siteUrl}/leads/${args.leadId}`;

  await Promise.all([
    sendEmail({
      to: ADMIN_NOTIFY_EMAIL,
      subject: `Nieuwe bruidslead — ${args.data.fullName}`,
      react: LeadAdminNotify({
        fullName: args.data.fullName,
        email: args.data.email,
        phone: args.data.phone,
        weddingDate: args.data.weddingDate,
        city: args.data.city,
        postcode: args.data.postcode,
        partySize: args.data.partySize,
        servicesWanted: args.data.servicesWanted,
        budgetCents: args.data.budgetCents ?? null,
        message: args.data.message || undefined,
        leadUrl,
      }),
      replyTo: args.data.email,
    }),
    sendEmail({
      to: args.data.email,
      subject: "We hebben je bericht ontvangen",
      react: LeadCustomerAck({ fullName: args.data.fullName }),
    }),
  ]);
}

async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    console.error("[lead] post-insert step failed:", err);
    return null;
  }
}

export async function updateLeadStatusAction(
  id: string,
  status: LeadStatus,
): Promise<{ ok: boolean }> {
  await updateLeadStatus(id, status);
  await safe(() =>
    writeAuditLog({
      actor: "admin",
      action: "lead.status_change",
      entity: "bridal_lead",
      entityId: id,
      payload: { status },
    }),
  );
  return { ok: true };
}
