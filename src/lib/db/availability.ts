import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import {
  TZ,
  startOfDayInTz,
  endOfDayInTz,
  weekdayInTz,
  zonedDateTimeToUtc,
} from "@/lib/time";

export type Interval = { startsAt: Date; endsAt: Date };

export type ComputeSlotsInput = {
  /** YYYY-MM-DD in `Europe/Amsterdam`. */
  date: string;
  /** Recurring opening blocks for this weekday, "HH:MM" 24h. */
  openingBlocks: Array<{ start: string; end: string }>;
  /** Already-occupied UTC intervals (bookings + time-off; bookings already include buffer). */
  occupied: Interval[];
  /** Service duration in minutes. */
  durationMin: number;
  /** Step granularity, default 15 min. */
  stepMin?: number;
  /** Earliest a customer may book from now, default 2h. */
  minLeadMin?: number;
  /** Reference time for lead-time enforcement. Defaults to `new Date()`. */
  now?: Date;
};

const MS_PER_MIN = 60_000;

/**
 * Pure slot-computation. No DB. Easy to unit-test.
 */
export function computeAvailableSlots(input: ComputeSlotsInput): Interval[] {
  const {
    date,
    openingBlocks,
    occupied,
    durationMin,
    stepMin = 15,
    minLeadMin = 120,
    now = new Date(),
  } = input;

  const earliestStart = new Date(now.getTime() + minLeadMin * MS_PER_MIN);
  const slots: Interval[] = [];

  for (const block of openingBlocks) {
    const blockStart = zonedDateTimeToUtc(date, block.start);
    const blockEnd = zonedDateTimeToUtc(date, block.end);
    const stepMs = stepMin * MS_PER_MIN;
    const durMs = durationMin * MS_PER_MIN;

    for (
      let cursor = blockStart.getTime();
      cursor + durMs <= blockEnd.getTime();
      cursor += stepMs
    ) {
      const startsAt = new Date(cursor);
      const endsAt = new Date(cursor + durMs);

      if (startsAt < earliestStart) continue;

      const overlap = occupied.some((o) => intervalsOverlap(startsAt, endsAt, o.startsAt, o.endsAt));
      if (overlap) continue;

      slots.push({ startsAt, endsAt });
    }
  }

  return slots;
}

function intervalsOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** Apply a buffer (in minutes) at both ends of an interval. */
export function inflate(interval: Interval, bufferMin: number): Interval {
  const ms = bufferMin * MS_PER_MIN;
  return {
    startsAt: new Date(interval.startsAt.getTime() - ms),
    endsAt: new Date(interval.endsAt.getTime() + ms),
  };
}

// ---------------- DB-fronted ----------------

export type GetSlotsArgs = {
  staffId: string;
  serviceId: string;
  /** YYYY-MM-DD in `Europe/Amsterdam`. */
  date: string;
};

export async function getAvailableSlots(args: GetSlotsArgs): Promise<Interval[]> {
  const supabase = createSupabaseServiceClient();
  const { staffId, serviceId, date } = args;

  const { data: service, error: svcErr } = await supabase
    .from("services")
    .select("duration_min, buffer_min, is_online_bookable, kind, is_active")
    .eq("id", serviceId)
    .single();
  if (svcErr || !service) throw svcErr ?? new Error("Service not found");
  if (!service.is_active || !service.is_online_bookable) return [];
  if (service.kind !== "regular") return [];

  const dayStart = startOfDayInTz(date);
  const dayEnd = endOfDayInTz(date);

  // 48h-window: previous-day start to next-day end, so neighbouring bookings are visible.
  const windowStart = new Date(dayStart.getTime() - 24 * 60 * 60 * 1000);
  const windowEnd = new Date(dayEnd.getTime() + 24 * 60 * 60 * 1000);

  // We need the weekday of the requested date in Europe/Amsterdam.
  const weekday = weekdayInTz(dayStart);

  const [{ data: hours, error: hoursErr }, { data: timeOff, error: toErr }, { data: bookings, error: bookErr }] =
    await Promise.all([
      supabase
        .from("opening_hours")
        .select("start_time, end_time")
        .eq("staff_id", staffId)
        .eq("weekday", weekday),
      supabase
        .from("time_off")
        .select("starts_at, ends_at")
        .eq("staff_id", staffId)
        .lt("starts_at", windowEnd.toISOString())
        .gt("ends_at", windowStart.toISOString()),
      supabase
        .from("bookings")
        .select("starts_at, ends_at")
        .eq("staff_id", staffId)
        .in("status", ["pending", "confirmed"])
        .lt("starts_at", windowEnd.toISOString())
        .gt("ends_at", windowStart.toISOString()),
    ]);

  if (hoursErr) throw hoursErr;
  if (toErr) throw toErr;
  if (bookErr) throw bookErr;

  const openingBlocks = (hours ?? []).map((h: { start_time: string; end_time: string }) => ({
    start: h.start_time.slice(0, 5),
    end: h.end_time.slice(0, 5),
  }));

  const bookingIntervals: Interval[] = (bookings ?? []).map(
    (b: { starts_at: string; ends_at: string }) => ({
      startsAt: new Date(b.starts_at),
      endsAt: new Date(b.ends_at),
    }),
  );
  const inflated = bookingIntervals.map((i) => inflate(i, service.buffer_min ?? 0));

  const timeOffIntervals: Interval[] = (timeOff ?? []).map(
    (t: { starts_at: string; ends_at: string }) => ({
      startsAt: new Date(t.starts_at),
      endsAt: new Date(t.ends_at),
    }),
  );

  return computeAvailableSlots({
    date,
    openingBlocks,
    occupied: [...inflated, ...timeOffIntervals],
    durationMin: service.duration_min,
  });
}

export { TZ };
