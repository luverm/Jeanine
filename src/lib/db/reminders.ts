import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type DueReminder = {
  id: string;
  starts_at: string;
  ends_at: string;
  service: { name: string } | null;
  customer: { full_name: string; email: string } | null;
};

/**
 * Confirmed bookings starting in the next ~20–28h that haven't had a
 * reminder yet. The window is wide enough that an hourly cron never
 * misses one, and `reminder_sent_at` keeps it idempotent.
 */
export async function listDueReminders(): Promise<DueReminder[]> {
  const svc = createSupabaseServiceClient();
  const now = Date.now();
  const from = new Date(now + 20 * 60 * 60 * 1000).toISOString();
  const to = new Date(now + 28 * 60 * 60 * 1000).toISOString();

  const { data, error } = await svc
    .from("bookings")
    .select(
      `id, starts_at, ends_at,
       service:services(name),
       customer:customers(full_name, email)`,
    )
    .eq("status", "confirmed")
    .is("reminder_sent_at", null)
    .gte("starts_at", from)
    .lte("starts_at", to)
    .order("starts_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as DueReminder[];
}

export async function markReminderSent(id: string): Promise<void> {
  const svc = createSupabaseServiceClient();
  await svc
    .from("bookings")
    .update({ reminder_sent_at: new Date().toISOString() })
    .eq("id", id);
}
