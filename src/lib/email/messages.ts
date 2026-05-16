import { business } from "@/content/business";
import { formatHumanDateTime, format } from "@/lib/time";

/** Drop unfilled `{{PLACEHOLDER}}` content values. */
function real(value: string): string | null {
  return value && !value.startsWith("{{") ? value : null;
}

function contactLine(): string {
  const email = real(business.email);
  const phone = real(business.phone);
  if (email && phone) return `Verhinderd? Mail ${email} of bel ${phone}.`;
  if (email) return `Verhinderd? Mail ${email}.`;
  if (phone) return `Verhinderd? Bel ${phone}.`;
  return "Verhinderd? Laat het ons even weten.";
}

function locationLine(): string | null {
  const street = real(business.address.street);
  if (!street) return null;
  return `Locatie: ${street}, ${business.address.postcode} ${business.address.city}`;
}

export function bookingConfirmationText(args: {
  customerName: string;
  serviceName: string;
  startsAt: Date;
  calendarUrl?: string;
  cancelUrl?: string;
}): string {
  return [
    `Hoi ${args.customerName},`,
    "",
    `Je afspraak bij ${business.name} is bevestigd.`,
    "",
    `Dienst: ${args.serviceName}`,
    `Wanneer: ${formatHumanDateTime(args.startsAt)}`,
    locationLine(),
    "",
    args.calendarUrl ? `Zet in je agenda: ${args.calendarUrl}` : null,
    args.cancelUrl ? `Verzetten of annuleren? ${args.cancelUrl}` : null,
    args.calendarUrl || args.cancelUrl ? "" : null,
    contactLine(),
    "",
    "Tot snel,",
    business.ownerName,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

export function bookingReminderText(args: {
  customerName: string;
  serviceName: string;
  startsAt: Date;
  cancelUrl?: string;
}): string {
  return [
    `Hoi ${args.customerName},`,
    "",
    `Kleine herinnering aan je afspraak bij ${business.name}:`,
    "",
    `Dienst: ${args.serviceName}`,
    `Wanneer: ${formatHumanDateTime(args.startsAt)}`,
    locationLine(),
    "",
    args.cancelUrl
      ? `Niet meer nodig? Verzetten of annuleren: ${args.cancelUrl}`
      : contactLine(),
    "",
    "Tot snel,",
    business.ownerName,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

/** Google Calendar "add event" template link. */
export function googleCalendarUrl(args: {
  title: string;
  startsAt: Date;
  endsAt: Date;
  details?: string;
  location?: string;
}): string {
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: args.title,
    dates: `${fmt(args.startsAt)}/${fmt(args.endsAt)}`,
  });
  if (args.details) params.set("details", args.details);
  if (args.location) params.set("location", args.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function bookingAdminText(args: {
  serviceName: string;
  startsAt: Date;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes?: string;
  bookingUrl: string;
}): string {
  return [
    "Nieuwe boeking",
    "",
    `Wanneer: ${formatHumanDateTime(args.startsAt)}`,
    `Dienst: ${args.serviceName}`,
    `Klant: ${args.customerName} <${args.customerEmail}>`,
    `Telefoon: ${args.customerPhone}`,
    args.notes ? `Notitie: ${args.notes}` : null,
    "",
    `Open in admin: ${args.bookingUrl}`,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

export function leadAdminText(args: {
  fullName: string;
  email: string;
  phone: string;
  weddingDate: string;
  city: string;
  postcode: string;
  partySize: number;
  servicesWanted: string[];
  budgetCents?: number | null;
  message?: string;
  leadUrl: string;
}): string {
  let wedding = args.weddingDate;
  try {
    wedding = format(new Date(args.weddingDate), "EEEE d MMMM yyyy");
  } catch {
    // keep the raw value
  }
  return [
    "Nieuwe bruidslead",
    "",
    `Naam: ${args.fullName}`,
    `E-mail: ${args.email}`,
    `Telefoon: ${args.phone}`,
    `Trouwdatum: ${wedding}`,
    `Locatie: ${args.city} (${args.postcode})`,
    `Aantal: ${args.partySize}`,
    `Diensten: ${args.servicesWanted.join(", ")}`,
    typeof args.budgetCents === "number"
      ? `Budget: € ${(args.budgetCents / 100).toLocaleString("nl-NL")}`
      : null,
    args.message ? `\nBericht:\n${args.message}` : null,
    "",
    `Open in admin: ${args.leadUrl}`,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

export function leadCustomerAckText(fullName: string): string {
  return [
    `Hoi ${fullName},`,
    "",
    "Bedankt voor je aanvraag voor je trouwdag. Ik neem binnen twee werkdagen",
    "persoonlijk contact met je op om je wensen door te nemen en je een",
    "passend voorstel te sturen.",
    "",
    "Heb je inspiratiebeelden of een Pinterest-bord? Stuur ze gerust mee als",
    "reply op deze e-mail.",
    "",
    "Tot snel,",
    business.ownerName,
    business.name,
  ].join("\n");
}
