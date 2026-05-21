import type { Metadata } from "next";
import { addDays, format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { Toaster } from "@/components/ui/sonner";
import { BookingForm } from "@/components/booking/booking-form";
import { listActiveServices } from "@/lib/db/services";
import { getDefaultStaffId } from "@/lib/db/staff";
import { listTimeOffInRange } from "@/lib/db/admin-schedule";
import { verifyWaitlistToken } from "@/lib/booking-token";
import { getWaitlistContact } from "@/lib/db/waitlist";
import { formatIsoDate, startOfDayInTz, endOfDayInTz } from "@/lib/time";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Boek je afspraak",
  description: "Plan je afspraak online — knippen, kleuren of föhnen.",
};

const HORIZON_DAYS = 90;

function dayLabel(isoDay: string): string {
  return format(parseISO(isoDay), "d MMMM", { locale: nl });
}

export default async function BoekenPage({
  searchParams,
}: {
  searchParams: Promise<{
    dienst?: string;
    datum?: string;
    tijd?: string;
    wl?: string;
    token?: string;
  }>;
}) {
  const [services, staffId, params] = await Promise.all([
    listActiveServices(),
    getDefaultStaffId(),
    searchParams,
  ]);

  const bookable = services.filter((s) => s.is_online_bookable);

  // Time-off (absences) in the bookable window — used to disable whole
  // closed days in the date picker and to show an absence notice.
  const today = new Date();
  const fromKey = formatIsoDate(today);
  const toKey = formatIsoDate(addDays(today, HORIZON_DAYS));
  const timeOff = await listTimeOffInRange(
    staffId,
    `${fromKey}T00:00:00Z`,
    `${toKey}T23:59:59Z`,
  ).catch(() => []);

  const blockedDates: string[] = [];
  for (let i = 0; i <= HORIZON_DAYS; i++) {
    const dayKey = formatIsoDate(addDays(today, i));
    const ds = startOfDayInTz(dayKey).getTime();
    const de = endOfDayInTz(dayKey).getTime();
    const fullyOff = timeOff.some(
      (t) =>
        new Date(t.starts_at).getTime() <= ds &&
        new Date(t.ends_at).getTime() >= de,
    );
    if (fullyOff) blockedDates.push(dayKey);
  }

  // Coming from a waitlist "spot opened" mail: the service/date/time are
  // in the URL; the contact details are resolved server-side from the
  // signed waitlist id so no personal data travels in the link.
  let contact: { fullName: string; email: string; phone: string } | null =
    null;
  if (params?.wl && params?.token && verifyWaitlistToken(params.wl, params.token)) {
    try {
      const c = await getWaitlistContact(params.wl);
      if (c) {
        contact = {
          fullName: c.fullName,
          email: c.email,
          phone: c.phone ?? "",
        };
      }
    } catch {
      contact = null;
    }
  }

  const prefill =
    params?.dienst || contact
      ? {
          serviceSlug: params?.dienst,
          date: /^\d{4}-\d{2}-\d{2}$/.test(params?.datum ?? "")
            ? params!.datum
            : undefined,
          time: /^\d{2}:\d{2}$/.test(params?.tijd ?? "")
            ? params!.tijd
            : undefined,
          fullName: contact?.fullName,
          email: contact?.email,
          phone: contact?.phone,
        }
      : undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <header className="mb-12 max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Online boeken
        </p>
        <h1 className="mt-4 text-5xl tracking-tight">Boek je afspraak</h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          Kies een dienst, een datum en een tijd. Bevestiging volgt direct per
          e-mail, met agenda-bijlage.
        </p>
      </header>

      {timeOff.length > 0 && (
        <div className="mb-10 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">Let op — Jeanine is afwezig</p>
          <ul className="mt-1.5 space-y-0.5">
            {timeOff.map((t) => {
              const startKey = formatIsoDate(new Date(t.starts_at));
              const endKey = formatIsoDate(new Date(t.ends_at));
              const period =
                startKey === endKey
                  ? `op ${dayLabel(startKey)}`
                  : `van ${dayLabel(startKey)} tot ${dayLabel(endKey)}`;
              return (
                <li key={t.id}>
                  Afwezig {period}
                  {t.reason ? ` — ${t.reason}` : ""}
                </li>
              );
            })}
          </ul>
          <p className="mt-1.5 text-amber-800">
            Volledig vrije dagen kun je niet kiezen in de kalender.
          </p>
        </div>
      )}

      {bookable.length === 0 ? (
        <p className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
          Er zijn op dit moment geen online boekbare diensten.
        </p>
      ) : (
        <BookingForm
          services={bookable}
          staffId={staffId}
          prefill={prefill}
          blockedDates={blockedDates}
        />
      )}

      <Toaster richColors position="top-right" />
    </div>
  );
}
