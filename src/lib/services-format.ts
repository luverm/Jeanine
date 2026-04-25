// Pure types + formatters for `services`. Safe to import from client
// components — does NOT pull in `next/headers` or any server-only deps.
// The DB-fetching helpers live in `@/lib/db/services` (server-only).

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
