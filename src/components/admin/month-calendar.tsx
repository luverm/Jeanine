import Link from "next/link";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isValid,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { listBookings, type BookingListItem } from "@/lib/db/admin-bookings";
import { formatIsoDate, formatTime } from "@/lib/time";

const WEEKDAYS = ["ma", "di", "wo", "do", "vr", "za", "zo"];

const MONTHS_NL = [
  "januari",
  "februari",
  "maart",
  "april",
  "mei",
  "juni",
  "juli",
  "augustus",
  "september",
  "oktober",
  "november",
  "december",
];

const DOT: Record<string, string> = {
  confirmed: "bg-emerald-500",
  pending: "bg-amber-500",
  completed: "bg-sky-500",
  no_show: "bg-rose-500",
};

function monthBase(month?: string): Date {
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const d = parseISO(`${month}-01`);
    if (isValid(d)) return startOfMonth(d);
  }
  // Default to the current month in Europe/Amsterdam.
  return startOfMonth(parseISO(`${formatIsoDate(new Date()).slice(0, 7)}-01`));
}

export async function MonthCalendar({ month }: { month?: string }) {
  const base = monthBase(month);
  const gridStart = startOfWeek(startOfMonth(base), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(base), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const bookings = await listBookings({
    from: format(gridStart, "yyyy-MM-dd"),
    to: format(gridEnd, "yyyy-MM-dd"),
  });

  const byDay = new Map<string, BookingListItem[]>();
  for (const b of bookings) {
    if (b.status === "cancelled") continue;
    const key = formatIsoDate(new Date(b.starts_at));
    const arr = byDay.get(key) ?? [];
    arr.push(b);
    byDay.set(key, arr);
  }
  for (const arr of byDay.values()) {
    arr.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  }

  const monthIndex = Number(format(base, "M")) - 1;
  const title = `${MONTHS_NL[monthIndex]} ${format(base, "yyyy")}`;
  const prev = format(addMonths(base, -1), "yyyy-MM");
  const next = format(addMonths(base, 1), "yyyy-MM");
  const todayKey = formatIsoDate(new Date());
  const currentMonth = format(base, "yyyy-MM");

  return (
    <section className="rounded-lg border">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <h2 className="text-lg font-semibold capitalize">{title}</h2>
        <div className="flex items-center gap-2 text-sm">
          <Link
            href={`/dashboard?month=${prev}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background hover:bg-accent"
            aria-label="Vorige maand"
          >
            ‹
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-8 items-center justify-center rounded-md border bg-background px-3 hover:bg-accent"
          >
            Vandaag
          </Link>
          <Link
            href={`/dashboard?month=${next}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background hover:bg-accent"
            aria-label="Volgende maand"
          >
            ›
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="grid grid-cols-7 border-b bg-muted/30 text-xs font-medium text-muted-foreground">
            {WEEKDAYS.map((d) => (
              <div key={d} className="px-2 py-2 text-center uppercase">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const inMonth = format(day, "yyyy-MM") === currentMonth;
              const isToday = key === todayKey;
              const items = byDay.get(key) ?? [];
              const shown = items.slice(0, 3);
              const extra = items.length - shown.length;

              return (
                <div
                  key={key}
                  className={
                    "min-h-[104px] border-b border-r p-1.5 last:border-r-0 [&:nth-child(7n)]:border-r-0 " +
                    (inMonth ? "" : "bg-muted/20 text-muted-foreground")
                  }
                >
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/boekingen?from=${key}&to=${key}`}
                      className={
                        "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs hover:bg-accent " +
                        (isToday
                          ? "bg-foreground font-semibold text-background"
                          : "")
                      }
                    >
                      {format(day, "d")}
                    </Link>
                  </div>

                  <div className="mt-1 flex flex-col gap-0.5">
                    {shown.map((b) => (
                      <Link
                        key={b.id}
                        href={`/boekingen/${b.id}`}
                        title={`${formatTime(new Date(b.starts_at))} ${
                          b.service?.name ?? ""
                        } — ${b.customer?.full_name ?? ""}`}
                        className="flex items-center gap-1 truncate rounded px-1 py-0.5 text-[11px] leading-tight hover:bg-accent"
                      >
                        <span
                          className={
                            "h-1.5 w-1.5 shrink-0 rounded-full " +
                            (DOT[b.status] ?? "bg-muted-foreground")
                          }
                          aria-hidden
                        />
                        <span className="font-mono">
                          {formatTime(new Date(b.starts_at))}
                        </span>
                        <span className="truncate">
                          {b.service?.name ?? b.customer?.full_name ?? "—"}
                        </span>
                      </Link>
                    ))}
                    {extra > 0 && (
                      <Link
                        href={`/boekingen?from=${key}&to=${key}`}
                        className="px-1 text-[11px] text-muted-foreground hover:underline"
                      >
                        +{extra} meer
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
