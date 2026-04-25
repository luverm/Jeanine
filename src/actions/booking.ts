"use server";

import { bookingInputSchema } from "@/lib/schemas/booking";
import {
  cancelBooking as dbCancelBooking,
  findBookingByIdempotencyKey,
  insertBooking,
  isExclusionViolation,
  writeAuditLog,
} from "@/lib/db/bookings";
import { upsertCustomerByEmail } from "@/lib/db/customers";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/email/client";
import { bookingToIcs } from "@/lib/email/ics";
import { BookingConfirmation } from "@/lib/email/templates/booking-confirmation";
import { BookingAdminNotify } from "@/lib/email/templates/booking-admin-notify";
import { getServerEnv } from "@/lib/env";
import { business } from "@/content/business";

export type CreateBookingResult =
  | { ok: true; bookingId: string }
  | { ok: false; code: "SLOT_TAKEN" | "INVALID_INPUT" | "INTERNAL"; message?: string };

type ServiceLookup = {
  id: string;
  name: string;
  duration_min: number;
};

async function loadService(serviceId: string): Promise<ServiceLookup | null> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("services")
    .select("id, name, duration_min, kind, is_active, is_online_bookable")
    .eq("id", serviceId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  if (!data.is_active || !data.is_online_bookable || data.kind !== "regular") {
    return null;
  }
  return { id: data.id, name: data.name, duration_min: data.duration_min };
}

export async function createBooking(input: unknown): Promise<CreateBookingResult> {
  const parsed = bookingInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "INVALID_INPUT", message: parsed.error.message };
  }
  const data = parsed.data;

  // Honeypot — silently succeed-shaped failure so bots don't probe.
  if (data.website) {
    return { ok: false, code: "INVALID_INPUT" };
  }

  // 1. Idempotency: have we seen this key?
  const existing = await findBookingByIdempotencyKey(data.idempotencyKey);
  if (existing) return { ok: true, bookingId: existing.id };

  // 2. Validate service is online-bookable.
  const service = await loadService(data.serviceId);
  if (!service) {
    return { ok: false, code: "INVALID_INPUT", message: "Dienst niet boekbaar" };
  }

  // 3. Sanity-check the duration matches the requested window.
  const startMs = new Date(data.startsAt).getTime();
  const endMs = new Date(data.endsAt).getTime();
  if (endMs - startMs !== service.duration_min * 60_000) {
    return { ok: false, code: "INVALID_INPUT", message: "Tijd komt niet overeen met dienst" };
  }

  // 4. Upsert customer.
  const customer = await upsertCustomerByEmail({
    email: data.customer.email,
    full_name: data.customer.fullName,
    phone: data.customer.phone,
  });

  // 5. Insert booking; rely on the GIST exclusion constraint to detect a race.
  let booking;
  try {
    booking = await insertBooking({
      staffId: data.staffId,
      serviceId: data.serviceId,
      customerId: customer.id,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      notes: data.customer.notes || undefined,
      idempotencyKey: data.idempotencyKey,
    });
  } catch (err) {
    if (isExclusionViolation(err)) {
      return { ok: false, code: "SLOT_TAKEN" };
    }
    throw err;
  }

  // 6. Audit + emails. Failures here don't roll back the booking.
  await safe(() =>
    writeAuditLog({
      actor: "public",
      action: "booking.create",
      entity: "booking",
      entityId: booking.id,
      payload: {
        serviceId: booking.service_id,
        customerId: booking.customer_id,
        startsAt: booking.starts_at,
      },
    }),
  );

  await safe(() => sendBookingEmails({
    booking,
    service,
    customer: {
      fullName: data.customer.fullName,
      email: data.customer.email,
      phone: data.customer.phone,
      notes: data.customer.notes || undefined,
    },
  }));

  return { ok: true, bookingId: booking.id };
}

async function sendBookingEmails(args: {
  booking: { id: string; starts_at: string; ends_at: string };
  service: ServiceLookup;
  customer: {
    fullName: string;
    email: string;
    phone: string;
    notes?: string;
  };
}) {
  const startsAt = new Date(args.booking.starts_at);
  const endsAt = new Date(args.booking.ends_at);
  const ics = bookingToIcs({
    id: args.booking.id,
    title: `${business.name} — ${args.service.name}`,
    startsAt,
    endsAt,
    description: `Afspraak voor ${args.service.name}`,
    customerEmail: args.customer.email,
  });

  const { ADMIN_NOTIFY_EMAIL } = getServerEnv();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  await Promise.all([
    sendEmail({
      to: args.customer.email,
      subject: `Afspraak bevestigd — ${args.service.name}`,
      react: BookingConfirmation({
        customerName: args.customer.fullName,
        serviceName: args.service.name,
        startsAt,
        endsAt,
      }),
      attachments: [
        {
          filename: "afspraak.ics",
          content: Buffer.from(ics, "utf-8").toString("base64"),
        },
      ],
    }),
    sendEmail({
      to: ADMIN_NOTIFY_EMAIL,
      subject: `Nieuwe boeking — ${args.service.name}`,
      react: BookingAdminNotify({
        serviceName: args.service.name,
        startsAt,
        endsAt,
        customerName: args.customer.fullName,
        customerEmail: args.customer.email,
        customerPhone: args.customer.phone,
        notes: args.customer.notes,
        bookingUrl: `${siteUrl}/boekingen/${args.booking.id}`,
      }),
      replyTo: args.customer.email,
    }),
  ]);
}

async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    console.error("[booking] post-insert step failed:", err);
    return null;
  }
}

export async function cancelBookingAction(id: string): Promise<{ ok: boolean }> {
  await dbCancelBooking(id);
  await safe(() =>
    writeAuditLog({
      actor: "admin",
      action: "booking.cancel",
      entity: "booking",
      entityId: id,
    }),
  );
  return { ok: true };
}
