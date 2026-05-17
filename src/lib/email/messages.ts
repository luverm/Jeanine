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

function helpLine(): string {
  const email = real(business.email);
  const phone = real(business.phone);
  if (email && phone) return `Vragen? Mail ${email} of bel ${phone}.`;
  if (email) return `Vragen? Mail ${email}.`;
  if (phone) return `Vragen? Bel ${phone}.`;
  return "Vragen? Laat het ons gerust weten.";
}

function dutchDate(date: string): string {
  try {
    return format(new Date(`${date}T00:00:00`), "EEEE d MMMM yyyy");
  } catch {
    return date;
  }
}

export function bookingCancelledText(args: {
  customerName: string;
  serviceName: string;
  startsAt: Date;
}): string {
  return [
    `Hoi ${args.customerName},`,
    "",
    `Je afspraak bij ${business.name} is geannuleerd:`,
    "",
    `Dienst: ${args.serviceName}`,
    `Was gepland op: ${formatHumanDateTime(args.startsAt)}`,
    "",
    "Wil je een nieuwe afspraak? Boek gerust opnieuw online.",
    "",
    helpLine(),
    "",
    "Tot snel,",
    business.ownerName,
  ].join("\n");
}

export function waitlistConfirmationText(args: {
  fullName: string;
  serviceName?: string | null;
  preferredDate?: string | null;
}): string {
  const what = args.serviceName ? ` voor ${args.serviceName}` : "";
  const when = args.preferredDate
    ? ` op ${dutchDate(args.preferredDate)}`
    : "";
  return [
    `Hoi ${args.fullName},`,
    "",
    `Je staat op de wachtlijst${what}${when} bij ${business.name}.`,
    "",
    "Komt er een plek vrij, dan krijg je automatisch een e-mail met een",
    "boeklink. Wie het eerst boekt, heeft de plek.",
    "",
    helpLine(),
    "",
    "Tot snel,",
    business.ownerName,
  ].join("\n");
}

export function waitlistAdminText(args: {
  fullName: string;
  email: string;
  phone?: string | null;
  serviceName?: string | null;
  preferredDate?: string | null;
  note?: string | null;
}): string {
  return [
    "Nieuwe wachtlijst-aanmelding",
    "",
    `Naam: ${args.fullName}`,
    `E-mail: ${args.email}`,
    args.phone ? `Telefoon: ${args.phone}` : null,
    `Dienst: ${args.serviceName ?? "geen voorkeur"}`,
    `Voorkeursdag: ${
      args.preferredDate ? dutchDate(args.preferredDate) : "geen voorkeur"
    }`,
    args.note ? `Notitie: ${args.note}` : null,
  ]
    .filter((line) => line !== null)
    .join("\n");
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

export function rebookingNudgeText(args: {
  customerName: string;
  lastServiceName: string;
  bookingUrl: string;
}): string {
  return [
    `Hoi ${args.customerName},`,
    "",
    `Het is alweer even geleden sinds je laatste afspraak (${args.lastServiceName}) bij ${business.name}. Tijd om weer eens bij te laten werken?`,
    "",
    `Een nieuwe afspraak plan je zo in: ${args.bookingUrl}`,
    "",
    contactLine(),
    "",
    "Tot snel,",
    business.ownerName,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

export function waitlistOpeningText(args: {
  customerName: string;
  serviceName: string;
  freedAt: Date;
  bookingUrl: string;
}): string {
  return [
    `Hoi ${args.customerName},`,
    "",
    `Goed nieuws — er is een plek vrijgekomen bij ${business.name} waar je op de wachtlijst voor staat:`,
    "",
    `Dienst: ${args.serviceName}`,
    `Vrijgekomen moment: ${formatHumanDateTime(args.freedAt)}`,
    "",
    `Wie het eerst boekt, krijgt de plek: ${args.bookingUrl}`,
    "",
    "Net te laat of niet het juiste moment? Geen zorgen — je blijft gewoon op de wachtlijst staan voor een volgende keer.",
    "",
    "Tot snel,",
    business.ownerName,
  ].join("\n");
}

export function reviewRequestText(args: {
  customerName: string;
  serviceName: string;
  reviewUrl: string;
}): string {
  return [
    `Hoi ${args.customerName},`,
    "",
    `Bedankt voor je bezoek aan ${business.name} (${args.serviceName})! Ik hoop dat je er blij mee bent.`,
    "",
    "Zou je een korte review willen achterlaten? Het kost een halve minuut en helpt anderen enorm:",
    args.reviewUrl,
    "",
    "Alvast bedankt,",
    business.ownerName,
  ].join("\n");
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
