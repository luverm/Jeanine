import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { BookingForm } from "@/components/booking/booking-form";
import { listActiveServices } from "@/lib/db/services";
import { getDefaultStaffId } from "@/lib/db/staff";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Boek je afspraak",
  description: "Plan je afspraak online — knippen, kleuren of föhnen.",
};

export default async function BoekenPage({
  searchParams,
}: {
  searchParams: Promise<{ dienst?: string }>;
}) {
  const [services, staffId, params] = await Promise.all([
    listActiveServices("regular"),
    getDefaultStaffId(),
    searchParams,
  ]);

  const bookable = services.filter((s) => s.is_online_bookable);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <header className="mb-12 max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Online boeken
        </p>
        <h1 className="mt-4 text-5xl tracking-tight">Boek je afspraak</h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          Kies een dienst, een datum en een tijd. Bevestiging volgt direct per
          e-mail, met agenda-bijlage.
        </p>
      </header>

      {bookable.length === 0 ? (
        <p className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
          Er zijn op dit moment geen online boekbare diensten.
        </p>
      ) : (
        <BookingForm
          services={bookable}
          staffId={staffId}
          initialServiceSlug={params?.dienst}
        />
      )}

      <Toaster richColors position="top-right" />
    </div>
  );
}
