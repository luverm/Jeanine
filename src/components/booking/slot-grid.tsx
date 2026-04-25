"use client";

import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/time";

export type Slot = { startsAt: Date; endsAt: Date };

export function SlotGrid({
  slots,
  selected,
  onSelect,
  loading,
}: {
  slots: Slot[];
  selected: string | null;
  onSelect: (iso: string) => void;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
        Geen vrije tijden op deze dag — kies een andere datum.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
      {slots.map((slot) => {
        const iso = slot.startsAt.toISOString();
        const isSelected = iso === selected;
        return (
          <Button
            key={iso}
            type="button"
            variant={isSelected ? "default" : "outline"}
            onClick={() => onSelect(iso)}
            className="font-mono"
          >
            {formatTime(slot.startsAt)}
          </Button>
        );
      })}
    </div>
  );
}
