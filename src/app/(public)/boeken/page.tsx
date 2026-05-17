import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { BookingForm } from "@/components/booking/booking-form";
import { listActiveServices } from "@/lib/db/services";
import { getDefaultStaffId } from "@/lib/db/staff";
import { verifyWaitlistToken } from "@/lib/booking-token";
import { getWaitlistContact } from "@/lib/db/waitlist";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Boek je afspraak",
  description: "Plan je afspraak online — knippen, kleuren of föhnen.",
};

export default async function BoekenPage({
  searchParams,
}: {
  searchParams: Promise<{
    dienst?: string;
    datum?: string;
    tijd?: string;
    wl?: string;
    token?: string;
  }>;
}) {
  const [services, staffId, params] = await Promise.all([
    listActiveServices("regular"),
    getDefaultStaffId(),
    searchParams,
  ]);

  const bookable = services.filter((s) => s.is_online_bookable);

  // Coming from a waitlist "spot opened" mail: the service/date/time are
  // in the URL; the contact details are resolved server-side from the
  // signed waitlist id so no personal data travels in the link.
  let contact: { fullName: string; email: string; phone: string } | null =
    null;
  if (params?.wl && params?.token && verifyWaitlistToken(params.wl, params.token)) {
    try {
      const c = await getWaitlistContact(params.wl);
      if (c) {
        contact = {
          fullName: c.fullName,
          email: c.email,
          phone: c.phone ?? "",
        };
      }
    } catch {
      contact = null;
    }
  }

  const prefill =
    params?.dienst || contact
      ? {
          serviceSlug: params?.dienst,
          date: /^\d{4}-\d{2}-\d{2}$/.test(params?.datum ?? "")
            ? params!.datum
            : undefined,
          time: /^\d{2}:\d{2}$/.test(params?.tijd ?? "")
            ? params!.tijd
            : undefined,
          fullName: contact?.fullName,
          email: contact?.email,
          phone: contact?.phone,
        }
      : undefined;

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
          prefill={prefill}
        />
      )}

      <Toaster richColors position="top-right" />
    </div>
  );
}
