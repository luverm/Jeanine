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
// Diagonal hatch for time-off (absence) blocks.
const HATCH =
  "repeating-linear-gradient(45deg, rgba(120,113,108,0.18) 0 8px, transparent 8px 16px)";

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
 * start time. Time-off blocks show as hatched "afwezig" areas.
 */
export function AgendaTimeGrid({
  days,
  byDay,
  waitlistByDay,
  todayKey,
  timeOff = [],
}: {
  days: Date[];
  byDay: Map<string, BookingListItem[]>;
  waitlistByDay: Map<string, string[]>;
  todayKey: string;
  timeOff?: TimeOffRow[];
}) {
  let startHour = 8;
  let endHour = 19;
  for (const day of days) {
    const key = format(day, "yyyy-MM-dd");
    for (const b of byDay.get(key) ?? []) {
      startHour = Math.min(startHour, Math.floor(minutesOfDay(b.starts_at) / 60));
      endHour = Math.max(endHour, Math.ceil(minutesOfDay(b.ends_at) / 60));
    }
    for (const seg of timeOffSegmentsForDay(key, timeOff)) {
      startHour = Math.min(startHour, Math.floor(seg.startMin / 60));
      endHour = Math.max(endHour, Math.ceil(seg.endMin / 60));
    }
  }
  startHour = Math.max(6, startHour);
  endHour = Math.min(23, endHour);

  const hours: number[] = [];
  for (let h = startHour; h <= endHour; h++) hours.push(h);
  const gridHeight = (endHour - startHour) * HOUR_PX;
  const gridStartMin = startHour * 60;
  const gridEndMin = endHour * 60;
  const perMin = HOUR_PX / 60;
  const single = days.length === 1;
  const colClass = single ? "flex-1" : "w-44 shrink-0";

  return (
    <div className="overflow-x-auto rounded-lg border">
      <div className="w-max min-w-full">
        <div className="flex border-b bg-muted/30">
          <div className="w-14 shrink-0" />
          {days.map((day, i) => {
            const key = format(day, "yyyy-MM-dd");
            const isToday = key === todayKey;
            const waiting = waitlistByDay.get(key) ?? [];
            return (
              <div key={key} className={colClass + " border-l px-2 py-2"}>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm font-medium capitalize">
                    {single
                      ? WEEKDAYS_LONG[Number(format(day, "i")) - 1]
                      : WEEKDAYS[i % 7]}{" "}
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

        <div className="flex">
          <div className="w-14 shrink-0">
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
            const segments = timeOffSegmentsForDay(key, timeOff);
            return (
              <div
                key={key}
                className={colClass + " relative border-l"}
                style={{ height: gridHeight }}
              >
                {hours.map((h, i) => (
                  <div
                    key={h}
                    style={{ top: i * HOUR_PX }}
                    className="absolute inset-x-0 border-b border-border/70"
                  />
                ))}

                {segments.map((seg) => {
                  const visStart = Math.max(seg.startMin, gridStartMin);
                  const visEnd = Math.min(seg.endMin, gridEndMin);
                  if (visEnd <= visStart) return null;
                  return (
                    <Link
                      key={seg.id}
                      href="/instellingen/vrije-dagen"
                      style={{
                        top: (visStart - gridStartMin) * perMin,
                        height: (visEnd - visStart) * perMin,
                        backgroundColor: "rgb(245 245 244)",
                        backgroundImage: HATCH,
                      }}
                      className="absolute inset-x-0 overflow-hidden border-y border-stone-300 px-2 py-1 text-xs leading-tight text-stone-600"
                    >
                      <p className="font-semibold">Afwezig</p>
                      <p className="break-words">{seg.reason || "Geblokkeerd"}</p>
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
  );
}
