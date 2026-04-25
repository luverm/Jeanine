import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ServiceKind = "regular" | "bridal";

export type Service = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  kind: ServiceKind;
  duration_min: number;
  buffer_min: number;
  price_cents: number;
  is_online_bookable: boolean;
  sort_order: number;
};

export async function listActiveServices(kind?: ServiceKind): Promise<Service[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("services")
    .select(
      "id, slug, name, description, kind, duration_min, buffer_min, price_cents, is_online_bookable, sort_order",
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (kind) query = query.eq("kind", kind);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Service[];
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} uur` : `${h} uur ${m} min`;
}
