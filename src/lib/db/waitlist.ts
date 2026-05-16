import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type WaitlistRow = {
  id: string;
  service_id: string | null;
  preferred_date: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  note: string | null;
  resolved: boolean;
  created_at: string;
  service?: { name: string } | null;
};

export async function insertWaitlist(input: {
  serviceId?: string | null;
  preferredDate?: string | null;
  fullName: string;
  email: string;
  phone?: string | null;
  note?: string | null;
}): Promise<void> {
  const svc = createSupabaseServiceClient();
  const { error } = await svc.from("waitlist").insert({
    service_id: input.serviceId ?? null,
    preferred_date: input.preferredDate ?? null,
    full_name: input.fullName,
    email: input.email,
    phone: input.phone ?? null,
    note: input.note ?? null,
  });
  if (error) throw error;
}

export async function listWaitlist(): Promise<WaitlistRow[]> {
  const svc = createSupabaseServiceClient();
  const { data, error } = await svc
    .from("waitlist")
    .select("*, service:services(name)")
    .order("resolved", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as WaitlistRow[];
}

export async function setWaitlistResolved(
  id: string,
  resolved: boolean,
): Promise<void> {
  const svc = createSupabaseServiceClient();
  const { error } = await svc
    .from("waitlist")
    .update({ resolved })
    .eq("id", id);
  if (error) throw error;
}
