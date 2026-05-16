"use server";

import { z } from "zod";
import { insertWaitlist, setWaitlistResolved } from "@/lib/db/waitlist";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";

const joinSchema = z.object({
  serviceId: z.string().uuid().optional().or(z.literal("")),
  preferredDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("")),
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  note: z.string().trim().max(500).optional().or(z.literal("")),
  website: z.string().max(0).optional().or(z.literal("")), // honeypot
});

export type JoinWaitlistResult =
  | { ok: true }
  | { ok: false; code: "INVALID_INPUT" | "RATE_LIMITED" };

export async function joinWaitlist(
  input: unknown,
): Promise<JoinWaitlistResult> {
  const parsed = joinSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "INVALID_INPUT" };
  const d = parsed.data;
  if (d.website) return { ok: false, code: "INVALID_INPUT" };

  const ip = await getClientIp();
  const limited = await rateLimit({
    key: `waitlist:${ip}`,
    max: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) return { ok: false, code: "RATE_LIMITED" };

  try {
    await insertWaitlist({
      serviceId: d.serviceId || null,
      preferredDate: d.preferredDate || null,
      fullName: d.fullName,
      email: d.email,
      phone: d.phone || null,
      note: d.note || null,
    });
  } catch (err) {
    console.error("[waitlist] insert failed:", err);
    return { ok: false, code: "INVALID_INPUT" };
  }
  return { ok: true };
}

export async function resolveWaitlistAction(
  id: string,
  resolved: boolean,
): Promise<{ ok: boolean }> {
  try {
    await setWaitlistResolved(id, resolved);
  } catch {
    return { ok: false };
  }
  return { ok: true };
}
