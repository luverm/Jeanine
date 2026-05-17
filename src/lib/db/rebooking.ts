import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

// Een knip/kleur-cyclus duurt grofweg zes weken. Spoor aan zodra die
// voorbij is, stop na ~vier maanden (de klant is dan weg — niet
// achtervolgen) en mail dezelfde klant hoogstens eens per twee maanden.
export const REBOOKING_MIN_DAYS = 42;
export const REBOOKING_MAX_DAYS = 120;
export const REBOOKING_COOLDOWN_DAYS = 60;

export type RebookingCandidate = {
  customer_id: string;
  email: string;
  full_name: string;
  last_service: string;
  last_visit: string;
};

export async function listRebookingDue(): Promise<RebookingCandidate[]> {
  const svc = createSupabaseServiceClient();
  const { data, error } = await svc.rpc("rebooking_candidates", {
    min_days: REBOOKING_MIN_DAYS,
    max_days: REBOOKING_MAX_DAYS,
    cooldown_days: REBOOKING_COOLDOWN_DAYS,
  });
  if (error) throw error;
  return (data ?? []) as unknown as RebookingCandidate[];
}

export async function markRebookingNudged(customerId: string): Promise<void> {
  const svc = createSupabaseServiceClient();
  await svc
    .from("customers")
    .update({ rebooking_nudge_sent_at: new Date().toISOString() })
    .eq("id", customerId);
}
