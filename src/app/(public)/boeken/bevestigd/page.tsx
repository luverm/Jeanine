import Link from "next/link";
import type { Metadata } from "next";
import { z } from "zod";
import { getBookingDetail } from "@/lib/db/bookings";
import { formatHumanDateTime } from "@/lib/time";
import { formatPrice } from "@/lib/db/services";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Boeking bevestigd",
  robots: { index: false },
};

const refSchema = z.string().uuid();

export default async function BevestigdPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const params = await searchParams;
  const refResult = refSchema.safeParse(params?.ref);
  const booking = refResult.success ? await getBookingDetail(refResult.data) : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-20">
      <h1 className="text-4xl font-semibold tracking-tight">
        Bedankt — je afspraak staat
      </h1>
      <p className="mt-4 text-muted-foreground">
        Een bevestiging met agenda-bijlage is onderweg naar je e-mail.
      </p>

      {booking && (
        <dl className="mt-10 grid gap-3 rounded-lg border bg-muted/30 p-6 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Dienst</dt>
            <dd className="font-medium">{booking.service.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Wanneer</dt>
            <dd className="font-medium">
              {formatHumanDateTime(new Date(booking.starts_at))}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Op naam van</dt>
            <dd className="font-medium">{booking.customer.full_name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Prijs</dt>
            <dd className="font-medium">
              {formatPrice(booking.service.price_cents)}
            </dd>
          </div>
        </dl>
      )}

      <div className="mt-10">
        <Link
          href="/"
          className="inline-flex rounded-full border px-5 py-2 text-sm hover:bg-accent"
        >
          Terug naar de site
        </Link>
      </div>
    </div>
  );
}
