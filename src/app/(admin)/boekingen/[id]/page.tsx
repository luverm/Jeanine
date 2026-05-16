import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import { getBookingDetail } from "@/lib/db/bookings";
import { getNoShowFlags } from "@/lib/db/no-show";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookingStatusActions } from "@/components/admin/booking-status-actions";
import { BookingNotesForm } from "@/components/admin/booking-notes-form";
import { NoShowDismiss } from "@/components/admin/no-show-dismiss";
import { formatHumanDateTime } from "@/lib/time";
import { formatPrice, formatDuration } from "@/lib/db/services";
import { bookingStatusLabel, bookingStatusVariant } from "@/lib/status-labels";

export const metadata: Metadata = {
  title: "Boeking detail",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const booking = await getBookingDetail(id);
  if (!booking) notFound();

  const flagged = await getNoShowFlags([booking.customer_id]);
  const noShowCount = flagged.get(booking.customer_id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/boekingen"
        className="text-xs text-muted-foreground underline underline-offset-4"
      >
        ← Alle boekingen
      </Link>

      <h1 className="mt-4 text-3xl font-semibold tracking-tight">
        {booking.service.name}
      </h1>
      <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
        <span>{formatHumanDateTime(new Date(booking.starts_at))}</span>
        <Badge variant={bookingStatusVariant(booking.status)}>
          {bookingStatusLabel(booking.status)}
        </Badge>
      </div>

      {noShowCount !== undefined && (
        <div className="mt-6 flex flex-col gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-semibold">
                Let op: deze klant heeft {noShowCount} no-shows
              </p>
              <p className="text-xs">
                Houd hier rekening mee — bv. bevestiging vragen of
                vooruitbetaling.
              </p>
            </div>
          </div>
          <div className="shrink-0">
            <NoShowDismiss customerId={booking.customer_id} />
          </div>
        </div>
      )}

      <Card className="mt-8 grid gap-3 p-6 text-sm">
        <Row label="Klant" value={booking.customer.full_name} />
        <Row label="E-mail" value={<a href={`mailto:${booking.customer.email}`}>{booking.customer.email}</a>} />
        {booking.customer.phone && (
          <Row label="Telefoon" value={<a href={`tel:${booking.customer.phone}`}>{booking.customer.phone}</a>} />
        )}
        <Row label="Duur" value={formatDuration(booking.service.duration_min)} />
        <Row label="Prijs" value={formatPrice(booking.service.price_cents)} />
      </Card>

      <Card className="mt-6 p-6">
        <h2 className="text-base font-semibold">Acties</h2>
        <div className="mt-4">
          <BookingStatusActions bookingId={booking.id} status={booking.status} />
        </div>
      </Card>

      <Card className="mt-6 p-6">
        <h2 className="text-base font-semibold">Interne notitie</h2>
        <div className="mt-4">
          <BookingNotesForm
            bookingId={booking.id}
            initialNotes={booking.notes}
          />
        </div>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
