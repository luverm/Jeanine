"use server";

import { z } from "zod";
import { leadInputSchema } from "@/lib/schemas/lead";
import {
  insertLead,
  updateLeadStatus,
  updateLeadNotes,
  type LeadStatus,
} from "@/lib/db/leads";
import { writeAuditLog } from "@/lib/db/bookings";
import { sendEmail } from "@/lib/email/client";
import { leadAdminText, leadCustomerAckText } from "@/lib/email/messages";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type CreateLeadResult =
  | { ok: true; leadId: string }
  | {
      ok: false;
      code: "INVALID_INPUT" | "RATE_LIMITED" | "INTERNAL";
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
  const limited = await rateLimit({
    key: `lead:${ip}`,
    max: RATE_LIMIT.max,
    windowMs: RATE_LIMIT.windowMs,
  });
  if (!limited.ok) {
    return { ok: false, code: "RATE_LIMITED" };
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

  // Best-effort: link uploaded inspiration images. Never block the lead
  // if the column/bucket isn't there yet.
  if (data.attachmentPaths && data.attachmentPaths.length > 0) {
    await safe(async () => {
      const svc = createSupabaseServiceClient();
      await svc
        .from("bridal_leads")
        .update({ attachment_paths: data.attachmentPaths })
        .eq("id", lead.id);
    });
  }

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
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const leadUrl = `${siteUrl}/leads/${args.leadId}`;

  const jobs = [
    sendEmail({
      to: args.data.email,
      subject: "We hebben je bericht ontvangen",
      text: leadCustomerAckText(args.data.fullName),
    }),
  ];

  if (adminEmail) {
    jobs.push(
      sendEmail({
        to: adminEmail,
        subject: `Nieuwe bruidslead — ${args.data.fullName}`,
        text: leadAdminText({
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
    );
  } else {
    console.warn("[email] ADMIN_NOTIFY_EMAIL not set — admin lead notice skipped");
  }

  await Promise.all(jobs);
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

const leadNotesSchema = z.string().max(2000);

export async function updateLeadNotesAction(
  id: string,
  rawNotes: string,
): Promise<{ ok: boolean }> {
  const trimmed = leadNotesSchema.parse(rawNotes).trim();
  try {
    await updateLeadNotes(id, trimmed);
  } catch (err) {
    console.error("[lead] notes update failed:", err);
    return { ok: false };
  }
  await safe(() =>
    writeAuditLog({
      actor: "admin",
      action: "lead.notes_update",
      entity: "bridal_lead",
      entityId: id,
      payload: { length: trimmed.length },
    }),
  );
  return { ok: true };
}
