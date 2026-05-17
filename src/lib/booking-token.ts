import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

// Server-only secret; never exposed to the client.
function secret(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? "dev-insecure-secret";
}

/** Stateless token that authorises a public action on one booking. */
export function signBooking(bookingId: string): string {
  return createHmac("sha256", secret())
    .update(bookingId)
    .digest("base64url");
}

export function verifyBookingToken(
  bookingId: string,
  token: string,
): boolean {
  const expected = signBooking(bookingId);
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Token that lets a waitlist link pre-fill the booking form with the
 * customer's contact details (resolved server-side — never in the URL).
 * Domain-separated so it can't be swapped with a booking token.
 */
export function signWaitlist(waitlistId: string): string {
  return createHmac("sha256", secret())
    .update(`waitlist:${waitlistId}`)
    .digest("base64url");
}

export function verifyWaitlistToken(
  waitlistId: string,
  token: string,
): boolean {
  const expected = signWaitlist(waitlistId);
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}
