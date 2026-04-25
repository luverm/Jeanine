import "server-only";
import * as ics from "ics";
import { business } from "@/content/business";

export type IcsBooking = {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  description?: string;
  customerEmail?: string;
};

function dateToArray(d: Date): [number, number, number, number, number] {
  return [
    d.getUTCFullYear(),
    d.getUTCMonth() + 1,
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes(),
  ];
}

export function bookingToIcs(b: IcsBooking): string {
  const { error, value } = ics.createEvent({
    uid: `booking-${b.id}@${hostFrom(business.email)}`,
    title: b.title,
    description: b.description ?? "",
    start: dateToArray(b.startsAt),
    startInputType: "utc",
    end: dateToArray(b.endsAt),
    endInputType: "utc",
    organizer: { name: business.name, email: business.email },
    attendees: b.customerEmail
      ? [{ email: b.customerEmail, rsvp: false, partstat: "ACCEPTED" }]
      : undefined,
    productId: "jeanine/booking",
  });
  if (error || !value) {
    throw error ?? new Error("Failed to generate ICS");
  }
  return value;
}

function hostFrom(email: string): string {
  const at = email.lastIndexOf("@");
  return at >= 0 ? email.slice(at + 1) : "studiojeanine.nl";
}
