import { NextResponse, type NextRequest } from "next/server";
import { getServerEnv } from "@/lib/env";
import { listDueReminders, markReminderSent } from "@/lib/db/reminders";
import { sendEmail } from "@/lib/email/client";
import { bookingReminderText } from "@/lib/email/messages";
import { signBooking } from "@/lib/booking-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: NextRequest): boolean {
  // Vercel Cron sends "Authorization: Bearer <CRON_SECRET>".
  const cronSecret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (cronSecret && auth === `Bearer ${cronSecret}`) return true;
  // Manual trigger fallback: ?token=<ADMIN_ICS_TOKEN>.
  try {
    const { ADMIN_ICS_TOKEN } = getServerEnv();
    return request.nextUrl.searchParams.get("token") === ADMIN_ICS_TOKEN;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  let due;
  try {
    due = await listDueReminders();
  } catch (err) {
    console.error("[cron/reminders] query failed:", err);
    return NextResponse.json(
      { ok: false, reason: "query_failed" },
      { status: 200 },
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  let sent = 0;
  let failed = 0;

  for (const b of due) {
    if (!b.customer?.email) continue;
    try {
      await sendEmail({
        to: b.customer.email,
        subject: "Herinnering aan je afspraak",
        context: "booking_reminder",
        text: bookingReminderText({
          customerName: b.customer.full_name,
          serviceName: b.service?.name ?? "Afspraak",
          startsAt: new Date(b.starts_at),
          cancelUrl: `${siteUrl}/afspraak/${b.id}?token=${signBooking(b.id)}`,
        }),
      });
      await markReminderSent(b.id);
      sent += 1;
    } catch (err) {
      console.error(`[cron/reminders] booking ${b.id} failed:`, err);
      failed += 1;
    }
  }

  return NextResponse.json({ ok: true, considered: due.length, sent, failed });
}
