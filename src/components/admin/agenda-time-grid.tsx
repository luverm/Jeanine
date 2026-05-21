import Link from "next/link";
import { format } from "date-fns";
import type { BookingListItem } from "@/lib/db/admin-bookings";
import type { TimeOffRow } from "@/lib/db/admin-schedule";
import { formatIsoDate, formatTime } from "@/lib/time";

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

const EVENT_STYLE: Record<string, string> = {
  confirmed: "border-l-emerald-500 bg-emerald-50",
  pending: "border-l-amber-500 bg-amber-50",
  completed: "border-l-sky-500 bg-sky-50",
  no_show: "border-l-rose-500 bg-rose-50",
};

const HOUR_PX = 64;
const SLOT_PX = HOUR_PX / 2;
// Diagonal hatch for time-off (absence) bars.
const HATCH =
  "repeating-linear-gradient(45deg, rgba(120,113,108,0.22) 0 8px, transparent 8px 16px)";
// Subtler hatch for weekdays Jeanine doesn't work (no opening hours).
const CLOSED_HATCH =
  "repeating-linear-gradient(45deg, rgba(120,113,108,0.09) 0 6px, transparent 6px 12px)";

/** Groups bookings by their start day (Europe/Amsterdam), skipping cancelled. */
export function groupByDay(
  bookings: BookingListItem[],
): Map<string, BookingListItem[]> {
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

/** Wall-clock minutes from midnight (Europe/Amsterdam) for an ISO timestamp. */
function minutesOfDay(iso: string): number {
  const [h, m] = formatTime(new Date(iso)).split(":").map(Number);
  return h * 60 + m;
}

/** The part of each time-off block that falls on a given day, in minutes. */
export function timeOffSegmentsForDay(
  dayKey: string,
  timeOff: TimeOffRow[],
): Array<{ id: string; startMin: number; endMin: number; reason: string }> {
  const out: Array<{
    id: string;
    startMin: number;
    endMin: number;
    reason: string;
  }> = [];
  for (const t of timeOff) {
    const startKey = formatIsoDate(new Date(t.starts_at));
    const endKey = formatIsoDate(new Date(t.ends_at));
    if (dayKey < startKey || dayKey > endKey) continue;
    const startMin = dayKey === startKey ? minutesOfDay(t.starts_at) : 0;
    const endMin = dayKey === endKey ? minutesOfDay(t.ends_at) : 24 * 60;
    if (endMin <= startMin) continue;
    out.push({ id: t.id, startMin, endMin, reason: t.reason?.trim() || "" });
  }
  return out;
}

/**
 * Salonized-style time grid: an hour axis with appointments positioned by
 * start time. Absences show as a hatched bar in an all-day row on top.
 */
export function AgendaTimeGrid({
  days,
  byDay,
  waitlistByDay,
  todayKey,
  timeOff = [],
  openWeekdays = [],
}: {
  days: Date[];
  byDay: Map<string, BookingListItem[]>;
  waitlistByDay: Map<string, string[]>;
  todayKey: string;
  timeOff?: TimeOffRow[];
  /** Weekdays (0 = Sunday) Jeanine works; others are shown as closed. */
  openWeekdays?: number[];
}) {
  const isClosed = (day: Date) =>
    openWeekdays.length > 0 && !openWeekdays.includes(day.getDay());
  let startHour = 8;
  let endHour = 19;
  for (const day of days) {
    for (const b of byDay.get(format(day, "yyyy-MM-dd")) ?? []) {
      startHour = Math.min(startHour, Math.floor(minutesOfDay(b.starts_at) / 60));
      endHour = Math.max(endHour, Math.ceil(minutesOfDay(b.ends_at) / 60));
    }
  }
  startHour = Math.max(6, startHour);
  endHour = Math.min(23, endHour);

  const hours: number[] = [];
  for (let h = startHour; h <= endHour; h++) hours.push(h);
  const gridHeight = (endHour - startHour) * HOUR_PX;
  const gridStartMin = startHour * 60;
  const perMin = HOUR_PX / 60;
  const single = days.length === 1;
  const colClass = single ? "flex-1" : "w-44 shrink-0";

  // All-day absence info per day; the label shows once at the start of a run.
  const allDay = days.map((day) => {
    const segs = timeOffSegmentsForDay(format(day, "yyyy-MM-dd"), timeOff);
    return { off: segs.length > 0, reason: segs[0]?.reason ?? "" };
  });
  const hasAbsence = allDay.some((d) => d.off);

  return (
    <div>
      <p className="mb-2 text-xs text-muted-foreground">
        Tik of klik op een vrij tijdvak om een afspraak in te plannen.
      </p>
      <div className="overflow-x-auto rounded-lg border">
        <div className="w-max min-w-full">
        <div className="flex border-b bg-muted/30">
          <div className="sticky left-0 z-20 w-14 shrink-0 border-r bg-background" />
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const isToday = key === todayKey;
            const waiting = waitlistByDay.get(key) ?? [];
            return (
              <div
                key={key}
                className={
                  colClass +
                  " border-l px-2 py-2 " +
                  (isClosed(day) ? "bg-muted/50 text-muted-foreground" : "")
                }
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm font-medium capitalize">
                    {single
                      ? WEEKDAYS_LONG[Number(format(day, "i")) - 1]
                      : WEEKDAYS[Number(format(day, "i")) - 1]}{" "}
                    <span
                      className={
                        isToday
                          ? "rounded bg-foreground px-1 text-background"
                          : ""
                      }
                    >
                      {format(day, "d")}
                    </span>
                  </span>
                  <Link
                    href={`/boekingen/nieuw?date=${key}`}
                    aria-label={`Nieuwe boeking op ${key}`}
                    title="Nieuwe boeking"
                    className="inline-flex h-5 w-5 items-center justify-center rounded text-sm leading-none text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    +
                  </Link>
                </div>
                {waiting.length > 0 && (
                  <Link
                    href="/instellingen/wachtlijst"
                    className="mt-1 block rounded bg-amber-100 px-1.5 py-0.5 text-[11px] text-amber-900 hover:bg-amber-200"
                  >
                    Wachtlijst ({waiting.length}): {waiting.join(", ")}
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {hasAbsence && (
          <div className="flex border-b bg-muted/20">
            <div className="sticky left-0 z-20 flex w-14 shrink-0 items-center justify-end border-r bg-background pr-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
              vrij
            </div>
            {days.map((day, i) => {
              const key = format(day, "yyyy-MM-dd");
              const info = allDay[i];
              const runStart = info.off && (i === 0 || !allDay[i - 1].off);
              return (
                <div key={key} className={colClass + " border-l p-1"}>
                  {info.off && (
                    <Link
                      href="/instellingen/vrije-dagen"
                      title={info.reason || "Afwezig"}
                      style={{ backgroundImage: HATCH }}
                      className="block truncate rounded border border-stone-300 bg-stone-100 px-2 py-1 text-xs font-medium text-stone-600"
                    >
                      {runStart ? info.reason || "Afwezig" : " "}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex">
          <div className="sticky left-0 z-20 w-14 shrink-0 border-r bg-background">
            {hours.map((h) => (
              <div
                key={h}
                style={{ height: HOUR_PX }}
                className="relative border-b"
              >
                <span className="absolute -top-2 right-1.5 text-[11px] text-muted-foreground">
                  {String(h).padStart(2, "0")}:00
                </span>
              </div>
            ))}
          </div>

          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const items = byDay.get(key) ?? [];
            return (
              <div
                key={key}
                className={colClass + " relative border-l"}
                style={{
                  height: gridHeight,
                  ...(isClosed(day)
                    ? { backgroundImage: CLOSED_HATCH }
                    : {}),
                }}
              >
                {/* Clickable 30-min slots — open the new-booking form. */}
                {Array.from({
                  length: (endHour - startHour) * 2,
                }).map((_, i) => {
                  const totalMin = startHour * 60 + i * 30;
                  const hh = String(Math.floor(totalMin / 60)).padStart(
                    2,
                    "0",
                  );
                  const mm = totalMin % 60 === 0 ? "00" : "30";
                  return (
                    <Link
                      key={i}
                      href={`/boekingen/nieuw?date=${key}&tijd=${hh}:${mm}`}
                      aria-label={`Nieuwe afspraak om ${hh}:${mm}`}
                      style={{ top: i * SLOT_PX, height: SLOT_PX }}
                      className={
                        "group absolute inset-x-0 flex items-center justify-center border-b transition hover:bg-accent/60 " +
                        (mm === "00"
                          ? "border-border/70"
                          : "border-border/35")
                      }
                    >
                      <span className="text-[10px] font-medium text-primary opacity-0 transition group-hover:opacity-100">
                        + afspraak {hh}:{mm}
                      </span>
                    </Link>
                  );
                })}

                {items.map((b) => {
                  const startMin = minutesOfDay(b.starts_at);
                  let endMin = minutesOfDay(b.ends_at);
                  if (endMin <= startMin) endMin = startMin + 30;
                  const top = (startMin - gridStartMin) * perMin;
                  const minHeight = Math.max(48, (endMin - startMin) * perMin);
                  return (
                    <Link
                      key={b.id}
                      href={`/boekingen/${b.id}`}
                      style={{ top, minHeight }}
                      className={
                        "absolute inset-x-1 z-[1] rounded-md border border-l-4 px-2 py-1 text-xs leading-tight shadow-sm transition hover:z-10 hover:shadow " +
                        (EVENT_STYLE[b.status] ??
                          "border-l-stone-400 bg-stone-50")
                      }
                    >
                      <p className="font-medium text-foreground">
                        {formatTime(new Date(b.starts_at))} –{" "}
                        {formatTime(new Date(b.ends_at))}
                      </p>
                      <p className="font-medium break-words">
                        {b.customer?.full_name ?? "—"}
                      </p>
                      <p className="break-words text-muted-foreground">
                        {b.service?.name ?? ""}
                      </p>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      </div>
    </div>
  );
}
