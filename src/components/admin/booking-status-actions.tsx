"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateBookingStatusAction } from "@/actions/admin-booking";
import type { BookingRow } from "@/lib/db/bookings";

const TRANSITIONS: Record<BookingRow["status"], BookingRow["status"][]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed", "no_show", "cancelled"],
  cancelled: [],
  no_show: [],
  completed: [],
};

const LABELS: Record<BookingRow["status"], string> = {
  pending: "in afwachting",
  confirmed: "bevestigd",
  cancelled: "geannuleerd",
  no_show: "no-show",
  completed: "afgerond",
};

export function BookingStatusActions({
  bookingId,
  status,
}: {
  bookingId: string;
  status: BookingRow["status"];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyTarget, setBusyTarget] = useState<BookingRow["status"] | null>(
    null,
  );

  function dispatch(target: BookingRow["status"]) {
    setBusyTarget(target);
    startTransition(async () => {
      const result = await updateBookingStatusAction(bookingId, target);
      setBusyTarget(null);
      if (result.ok) {
        toast.success(`Status gewijzigd naar ${LABELS[target]}`);
        router.refresh();
      } else {
        toast.error("Wijzigen mislukt.");
      }
    });
  }

  const options = TRANSITIONS[status];

  if (options.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Status {LABELS[status]} — geen verdere acties.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <Button
          key={opt}
          variant={opt === "cancelled" || opt === "no_show" ? "outline" : "default"}
          disabled={pending}
          onClick={() => dispatch(opt)}
        >
          {busyTarget === opt ? "..." : `Markeer als ${LABELS[opt]}`}
        </Button>
      ))}
    </div>
  );
}
