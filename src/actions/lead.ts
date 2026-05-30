"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { leadInputSchema } from "@/lib/schemas/lead";
import {
  insertLead,
  updateLeadStatus,
  updateLeadNotes,
  updateLeadContact,
  setLeadTrialSession,
  updateLeadFinance,
  deleteLead,
  type LeadStatus,
} from "@/lib/db/leads";
import { uuidString } from "@/lib/schemas/uuid";
import { deleteBridalAttachments } from "@/actions/bridal-upload";
import { writeAuditLog } from "@/lib/db/bookings";
import { requireAdmin } from "@/lib/auth/require-admin";
import { sendEmail } from "@/lib/email/client";
import { leadAdminText, leadCustomerAckEmail } from "@/lib/email/messages";
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
    location: `${data.street}, ${data.postcode} ${data.city}`,
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
    leadCustomerAckEmail(args.data.fullName).then((m) =>
      sendEmail({ to: args.data.email, ...m }),
    ),
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
          street: args.data.street,
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
  await requireAdmin();
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
  await requireAdmin();
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

const contactSchema = z.object({
  id: uuidString(),
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: z.string().trim().max(40).optional(),
  location: z.string().trim().max(200).optional(),
});

export async function updateLeadContactAction(
  input: unknown,
): Promise<{ ok: boolean; code?: "INVALID" }> {
  await requireAdmin();
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "INVALID" };
  try {
    await updateLeadContact(parsed.data.id, {
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      phone: parsed.data.phone?.trim() ? parsed.data.phone : null,
      location: parsed.data.location?.trim() ? parsed.data.location : null,
    });
  } catch (err) {
    console.error("[lead] contact update failed:", err);
    return { ok: false };
  }
  await safe(() =>
    writeAuditLog({
      actor: "admin",
      action: "lead.contact_update",
      entity: "bridal_lead",
      entityId: parsed.data.id,
      payload: {
        email: parsed.data.email,
        phone: parsed.data.phone ?? null,
      },
    }),
  );
  revalidatePath(`/leads/${parsed.data.id}`);
  return { ok: true };
}

const trialSchema = z.object({
  id: uuidString(),
  // Accept either an ISO timestamp or an empty/null to clear.
  at: z
    .string()
    .min(1)
    .refine((v) => !Number.isNaN(Date.parse(v)), "Ongeldige datum/tijd")
    .nullable(),
});

export async function setLeadTrialSessionAction(
  input: unknown,
): Promise<{ ok: boolean }> {
  await requireAdmin();
  const parsed = trialSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  try {
    await setLeadTrialSession(
      parsed.data.id,
      parsed.data.at ? new Date(parsed.data.at).toISOString() : null,
    );
  } catch (err) {
    console.error("[lead] trial-session update failed:", err);
    return { ok: false };
  }
  revalidatePath(`/leads/${parsed.data.id}`);
  revalidatePath("/leads");
  return { ok: true };
}

const financeSchema = z.object({
  agreedPrice: z.number().min(0).max(100000).nullable(),
  deposit: z.number().min(0).max(100000).nullable(),
  depositPaid: z.boolean(),
});

export async function updateLeadFinanceAction(
  id: string,
  input: { agreedPrice: number | null; deposit: number | null; depositPaid: boolean },
): Promise<{ ok: boolean }> {
  await requireAdmin();
  const parsed = financeSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  try {
    await updateLeadFinance(id, {
      agreedPriceCents:
        parsed.data.agreedPrice === null
          ? null
          : Math.round(parsed.data.agreedPrice * 100),
      depositCents:
        parsed.data.deposit === null
          ? null
          : Math.round(parsed.data.deposit * 100),
      depositPaid: parsed.data.depositPaid,
    });
  } catch (err) {
    console.error("[lead] finance update failed:", err);
    return { ok: false };
  }
  return { ok: true };
}

export async function deleteLeadAction(
  id: string,
): Promise<{ ok: boolean }> {
  await requireAdmin();
  let paths: string[];
  try {
    paths = await deleteLead(id);
  } catch (err) {
    console.error("[lead] delete failed:", err);
    return { ok: false };
  }
  await safe(() => deleteBridalAttachments(paths));
  await safe(() =>
    writeAuditLog({
      actor: "admin",
      action: "lead.delete",
      entity: "bridal_lead",
      entityId: id,
    }),
  );
  revalidatePath("/leads");
  return { ok: true };
}
