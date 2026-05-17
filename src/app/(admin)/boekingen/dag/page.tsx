import Link from "next/link";
import type { Metadata } from "next";
import { addDays, format, parseISO, isValid } from "date-fns";
import { listBookings } from "@/lib/db/admin-bookings";
import { PrintButton } from "@/components/admin/print-button";
import { formatIsoDate, formatTime } from "@/lib/time";
import { bookingStatusLabel } from "@/lib/status-labels";

export const metadata: Metadata = {
  title: "Dagstaat",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

const MONTHS_NL = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
];

export default async function DaySheetPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const today = formatIsoDate(new Date());
  const day =
    date && /^\d{4}-\d{2}-\d{2}$/.test(date) && isValid(parseISO(date))
      ? date
      : today;

  const bookings = (await listBookings({ from: day, to: day }))
    .filter((b) => b.status !== "cancelled")
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));

  const d = parseISO(day);
  const heading = `${Number(format(d, "d"))} ${
    MONTHS_NL[Number(format(d, "M")) - 1]
  } ${format(d, "yyyy")}`;
  const prev = format(addDays(d, -1), "yyyy-MM-dd");
  const next = format(addDays(d, 1), "yyyy-MM-dd");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/dashboard"
          className="text-xs text-muted-foreground underline underline-offset-4"
        >
          ← Dashboard
        </Link>
        <div className="flex items-center gap-2 text-sm">
          <Link
            href={`/boekingen/dag?date=${prev}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-accent"
            aria-label="Vorige dag"
          >
            ‹
          </Link>
          <Link
            href="/boekingen/dag"
            className="inline-flex h-8 items-center justify-center rounded-md border px-3 hover:bg-accent"
          >
            Vandaag
          </Link>
          <Link
            href={`/boekingen/dag?date=${next}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-accent"
            aria-label="Volgende dag"
          >
            ›
          </Link>
          <Link
            href={`/boekingen/nieuw?date=${day}`}
            className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            + Boeking
          </Link>
          <PrintButton label="Print dagstaat" />
        </div>
      </div>

      <header className="mt-6 mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Dagstaat</h1>
        <p className="text-sm text-muted-foreground">{heading}</p>
      </header>

      {bookings.length === 0 ? (
        <p className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          Geen afspraken op deze dag.
        </p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="py-2 pr-3">Tijd</th>
              <th className="py-2 pr-3">Klant</th>
              <th className="py-2 pr-3">Dienst</th>
              <th className="py-2 pr-3">Telefoon</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id} className="border-b align-top">
                <td className="py-2.5 pr-3 font-mono">
                  {formatTime(new Date(b.starts_at))}
                </td>
                <td className="py-2.5 pr-3">{b.customer?.full_name ?? "—"}</td>
                <td className="py-2.5 pr-3">{b.service?.name ?? "—"}</td>
                <td className="py-2.5 pr-3">{b.customer?.phone ?? "—"}</td>
                <td className="py-2.5">{bookingStatusLabel(b.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
