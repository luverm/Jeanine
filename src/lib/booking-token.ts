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
