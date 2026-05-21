import Link from "next/link";
import type { Metadata } from "next";
import {
  addDays,
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

export const metadata: Metadata = {
  title: "Agenda",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

const WEEKDAYS = ["ma", "di", "wo", "do", "vr", "za", "zo"];
const WEEKDAYS_LONG = [
  "maandag",
  "dinsdag",
  "woensdag",
  "donderdag",
  "vrijdag",
  "zaterdag",
  "zondag",
];
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

type View = "maand" | "week" | "dag";

function anchorDate(date?: string): Date {
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const d = parseISO(date);
    if (isValid(d)) return d;
  }
  return parseISO(formatIsoDate(new Date()));
}

function groupByDay(bookings: BookingListItem[]): Map<string, BookingListItem[]> {
  const byDay = new Map<string, BookingListItem[]>();
  for (const b of bookings) {
    if (b.status === "cancelled") continue;
    const key = formatIsoDate(new Date(b.starts_at));
    const arr = byDay.get(key);
    if (arr) arr.push(b);
    else byDay.set(key, [b]);
  }
  for (const arr of byDay.values()) {
    arr.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  }
  return byDay;
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const sp = await searchParams;
  const view: View =
    sp.view === "week" || sp.view === "dag" ? sp.view : "maand";
  const anchor = anchorDate(sp.date);
  const todayKey = formatIsoDate(new Date());

  let rangeStart: Date;
  let rangeEnd: Date;
  if (view === "maand") {
    rangeStart = startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 });
    rangeEnd = endOfWeek(endOfMonth(anchor), { weekStartsOn: 1 });
  } else if (view === "week") {
    rangeStart = startOfWeek(anchor, { weekStartsOn: 1 });
    rangeEnd = endOfWeek(anchor, { weekStartsOn: 1 });
  } else {
    rangeStart = anchor;
    rangeEnd = anchor;
  }

  const bookings = await listBookings({
    from: format(rangeStart, "yyyy-MM-dd"),
    to: format(rangeEnd, "yyyy-MM-dd"),
  });
  const byDay = groupByDay(bookings);

  const step = (n: number): string => {
    const d =
      view === "maand"
        ? addMonths(anchor, n)
        : addDays(anchor, view === "week" ? n * 7 : n);
    return format(d, "yyyy-MM-dd");
  };
  const link = (v: View, date: string) => `/agenda?view=${v}&date=${date}`;

  let title: string;
  if (view === "maand") {
    title = `${MONTHS_NL[Number(format(anchor, "M")) - 1]} ${format(anchor, "yyyy")}`;
  } else if (view === "week") {
    const sameMonth = format(rangeStart, "M") === format(rangeEnd, "M");
    title = sameMonth
      ? `${format(rangeStart, "d")} – ${format(rangeEnd, "d")} ${MONTHS_NL[Number(format(rangeEnd, "M")) - 1]} ${format(rangeEnd, "yyyy")}`
      : `${format(rangeStart, "d")} ${MONTHS_NL[Number(format(rangeStart, "M")) - 1]} – ${format(rangeEnd, "d")} ${MONTHS_NL[Number(format(rangeEnd, "M")) - 1]} ${format(rangeEnd, "yyyy")}`;
  } else {
    title = `${WEEKDAYS_LONG[Number(format(anchor, "i")) - 1]} ${format(anchor, "d")} ${MONTHS_NL[Number(format(anchor, "M")) - 1]} ${format(anchor, "yyyy")}`;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Agenda</h1>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-md border p-0.5">
          {(["maand", "week", "dag"] as View[]).map((v) => (
            <Link
              key={v}
              href={link(v, formatIsoDate(anchor))}
              className={
                "rounded px-3 py-1.5 text-sm capitalize transition " +
                (v === view
                  ? "bg-foreground text-background"
                  : "hover:bg-accent")
              }
            >
              {v}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Link
            href={link(view, step(-1))}
            aria-label="Vorige"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background hover:bg-accent"
          >
            ‹
          </Link>
          <Link
            href={link(view, todayKey)}
            className="inline-flex h-8 items-center justify-center rounded-md border bg-background px-3 hover:bg-accent"
          >
            Vandaag
          </Link>
          <Link
            href={link(view, step(1))}
            aria-label="Volgende"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background hover:bg-accent"
          >
            ›
          </Link>
        </div>
      </div>

      <h2 className="mt-4 text-lg font-semibold capitalize">{title}</h2>

      <div className="mt-4">
        {view === "maand" && (
          <MonthView anchor={anchor} byDay={byDay} todayKey={todayKey} />
        )}
        {view === "week" && (
          <WeekView
            start={rangeStart}
            byDay={byDay}
            todayKey={todayKey}
          />
        )}
        {view === "dag" && (
          <DayView anchor={anchor} byDay={byDay} todayKey={todayKey} />
        )}
      </div>
    </div>
  );
}

function BookingChip({ b }: { b: BookingListItem }) {
  return (
    <Link
      href={`/boekingen/${b.id}`}
      title={`${formatTime(new Date(b.starts_at))} ${b.service?.name ?? ""} — ${b.customer?.full_name ?? ""}`}
      className="flex items-center gap-1.5 truncate rounded px-1 py-0.5 text-[11px] leading-tight hover:bg-accent"
    >
      <span
        className={
          "h-1.5 w-1.5 shrink-0 rounded-full " +
          (DOT[b.status] ?? "bg-muted-foreground")
        }
        aria-hidden
      />
      <span className="font-mono">{formatTime(new Date(b.starts_at))}</span>
      <span className="truncate">
        {b.service?.name ?? b.customer?.full_name ?? "—"}
      </span>
    </Link>
  );
}

function MonthView({
  anchor,
  byDay,
  todayKey,
}: {
  anchor: Date;
  byDay: Map<string, BookingListItem[]>;
  todayKey: string;
}) {
  const gridStart = startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(anchor), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const currentMonth = format(anchor, "yyyy-MM");

  return (
    <div className="overflow-x-auto rounded-lg border">
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
                    href={`/agenda?view=dag&date=${key}`}
                    className={
                      "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs hover:bg-accent " +
                      (isToday
                        ? "bg-foreground font-semibold text-background"
                        : "")
                    }
                  >
                    {format(day, "d")}
                  </Link>
                  <Link
                    href={`/boekingen/nieuw?date=${key}`}
                    aria-label={`Nieuwe boeking op ${key}`}
                    title="Nieuwe boeking"
                    className="inline-flex h-5 w-5 items-center justify-center rounded text-sm leading-none text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    +
                  </Link>
                </div>
                <div className="mt-1 flex flex-col gap-0.5">
                  {shown.map((b) => (
                    <BookingChip key={b.id} b={b} />
                  ))}
                  {extra > 0 && (
                    <Link
                      href={`/agenda?view=dag&date=${key}`}
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
  );
}

function WeekView({
  start,
  byDay,
  todayKey,
}: {
  start: Date;
  byDay: Map<string, BookingListItem[]>;
  todayKey: string;
}) {
  const days = eachDayOfInterval({ start, end: addDays(start, 6) });
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-7 md:gap-2">
      {days.map((day, i) => {
        const key = format(day, "yyyy-MM-dd");
        const isToday = key === todayKey;
        const items = byDay.get(key) ?? [];
        return (
          <div key={key} className="rounded-lg border">
            <div className="flex items-center justify-between border-b bg-muted/30 px-2 py-1.5">
              <Link
                href={`/agenda?view=dag&date=${key}`}
                className="text-xs font-medium capitalize hover:underline"
              >
                <span className="md:hidden">{WEEKDAYS_LONG[i]} </span>
                <span className="hidden md:inline">{WEEKDAYS[i]} </span>
                <span
                  className={
                    isToday
                      ? "rounded bg-foreground px-1 text-background"
                      : ""
                  }
                >
                  {format(day, "d")}
                </span>
              </Link>
              <Link
                href={`/boekingen/nieuw?date=${key}`}
                aria-label={`Nieuwe boeking op ${key}`}
                title="Nieuwe boeking"
                className="inline-flex h-5 w-5 items-center justify-center rounded text-sm leading-none text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                +
              </Link>
            </div>
            <div className="flex min-h-[60px] flex-col gap-0.5 p-1.5">
              {items.length === 0 ? (
                <p className="px-1 py-2 text-[11px] text-muted-foreground">
                  —
                </p>
              ) : (
                items.map((b) => <BookingChip key={b.id} b={b} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayView({
  anchor,
  byDay,
  todayKey,
}: {
  anchor: Date;
  byDay: Map<string, BookingListItem[]>;
  todayKey: string;
}) {
  const key = format(anchor, "yyyy-MM-dd");
  const items = byDay.get(key) ?? [];

  return (
    <div className="rounded-lg border">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="text-sm text-muted-foreground">
          {items.length} afspra{items.length === 1 ? "ak" : "ken"}
          {key === todayKey ? " · vandaag" : ""}
        </span>
        <Link
          href={`/boekingen/nieuw?date=${key}`}
          className="text-xs font-medium text-primary underline-offset-4 hover:underline"
        >
          + Nieuwe boeking
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="px-4 py-12 text-center text-sm text-muted-foreground">
          Geen afspraken op deze dag.
        </p>
      ) : (
        <ul className="divide-y">
          {items.map((b) => (
            <li key={b.id}>
              <Link
                href={`/boekingen/${b.id}`}
                className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-accent"
              >
                <span
                  className={
                    "h-2 w-2 shrink-0 rounded-full " +
                    (DOT[b.status] ?? "bg-muted-foreground")
                  }
                  aria-hidden
                />
                <span className="font-mono text-xs">
                  {formatTime(new Date(b.starts_at))} –{" "}
                  {formatTime(new Date(b.ends_at))}
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
      )}
    </div>
  );
}
