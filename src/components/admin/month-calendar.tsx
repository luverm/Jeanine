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
import { AlertTriangle } from "lucide-react";
import { listBookings, type BookingListItem } from "@/lib/db/admin-bookings";
import { getNoShowFlags } from "@/lib/db/no-show";
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

export async function MonthCalendar({
  month,
  layout = "grid",
}: {
  month?: string;
  layout?: "grid" | "list";
}) {
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

  const flagged = await getNoShowFlags(bookings.map((b) => b.customer_id));

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

      {layout === "list" ? (
        <MonthList
          days={days}
          byDay={byDay}
          currentMonth={currentMonth}
          todayKey={todayKey}
          flagged={flagged}
        />
      ) : (
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
                        {flagged.has(b.customer_id) && (
                          <AlertTriangle
                            className="h-3 w-3 shrink-0 text-amber-600"
                            aria-label={`Let op: klant met ${flagged.get(
                              b.customer_id,
                            )} no-shows`}
                          />
                        )}
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
      )}
    </section>
  );
}

function MonthList({
  days,
  byDay,
  currentMonth,
  todayKey,
  flagged,
}: {
  days: Date[];
  byDay: Map<string, BookingListItem[]>;
  currentMonth: string;
  todayKey: string;
  flagged: Map<string, number>;
}) {
  const listDays = days.filter(
    (d) =>
      format(d, "yyyy-MM") === currentMonth &&
      (byDay.get(format(d, "yyyy-MM-dd"))?.length ?? 0) > 0,
  );

  if (listDays.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-muted-foreground">
        Geen afspraken deze maand.
      </p>
    );
  }

  return (
    <div className="divide-y">
      {listDays.map((day) => {
        const key = format(day, "yyyy-MM-dd");
        const items = byDay.get(key) ?? [];
        const isToday = key === todayKey;
        const weekday = WEEKDAYS[Number(format(day, "i")) - 1];
        const monthName = MONTHS_NL[Number(format(day, "M")) - 1];

        return (
          <div key={key} className="px-4 py-3">
            <div className="flex items-center gap-2">
              <span
                className={
                  "text-sm font-medium " +
                  (isToday
                    ? "rounded bg-foreground px-1.5 py-0.5 text-background"
                    : "")
                }
              >
                {weekday} {format(day, "d")} {monthName}
              </span>
              <span className="text-xs text-muted-foreground">
                · {items.length}
              </span>
            </div>
            <ul className="mt-2 divide-y rounded-md border">
              {items.map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/boekingen/${b.id}`}
                    className="flex items-center gap-3 px-3 py-3 text-sm hover:bg-accent"
                  >
                    <span
                      className={
                        "h-2 w-2 shrink-0 rounded-full " +
                        (DOT[b.status] ?? "bg-muted-foreground")
                      }
                      aria-hidden
                    />
                    {flagged.has(b.customer_id) && (
                      <AlertTriangle
                        className="h-4 w-4 shrink-0 text-amber-600"
                        aria-label={`Let op: klant met ${flagged.get(
                          b.customer_id,
                        )} no-shows`}
                      />
                    )}
                    <span className="font-mono text-xs">
                      {formatTime(new Date(b.starts_at))}
                    </span>
                    <span className="flex-1 truncate">
                      {b.service?.name ?? "—"}
                    </span>
                    <span className="max-w-[40%] truncate text-xs text-muted-foreground">
                      {b.customer?.full_name ?? ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
