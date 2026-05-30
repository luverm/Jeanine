import type { BookingRow } from "@/lib/db/bookings";
import type { LeadStatus } from "@/lib/db/leads";

export type BadgeVariant = "default" | "secondary" | "outline" | "destructive";

type BookingStatus = BookingRow["status"];

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "In afwachting",
  confirmed: "Bevestigd",
  cancelled: "Geannuleerd",
  no_show: "No-show",
  completed: "Afgerond",
};

export const BOOKING_STATUS_VARIANTS: Record<BookingStatus, BadgeVariant> = {
  pending: "secondary",
  confirmed: "default",
  cancelled: "destructive",
  no_show: "destructive",
  completed: "outline",
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Nieuw",
  contacted: "Contact gehad",
  quoted: "Voorstel",
  won: "Gewonnen",
  // Jeanine gebruikt deze kolom voor afgeronde bruiloften, niet voor
  // verloren leads — labels gewijzigd zodat de UI dat reflecteert.
  lost: "Afgerond",
};

export const LEAD_STATUS_VARIANTS: Record<LeadStatus, BadgeVariant> = {
  new: "default",
  contacted: "secondary",
  quoted: "secondary",
  won: "outline",
  lost: "outline",
};

export function bookingStatusLabel(status: string): string {
  return BOOKING_STATUS_LABELS[status as BookingStatus] ?? status;
}

export function bookingStatusVariant(status: string): BadgeVariant {
  return BOOKING_STATUS_VARIANTS[status as BookingStatus] ?? "outline";
}

export function leadStatusLabel(status: string): string {
  return LEAD_STATUS_LABELS[status as LeadStatus] ?? status;
}

export function leadStatusVariant(status: string): BadgeVariant {
  return LEAD_STATUS_VARIANTS[status as LeadStatus] ?? "outline";
}
