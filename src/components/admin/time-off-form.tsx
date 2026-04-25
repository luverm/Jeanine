"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addTimeOffAction, deleteTimeOffAction } from "@/actions/schedule";
import { zonedDateTimeToUtc, formatHumanDateTime } from "@/lib/time";
import type { TimeOffRow } from "@/lib/db/admin-schedule";

export function TimeOffManager({
  staffId,
  rows,
}: {
  staffId: string;
  rows: TimeOffRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [start, setStart] = useState({ date: "", time: "00:00" });
  const [end, setEnd] = useState({ date: "", time: "23:59" });
  const [reason, setReason] = useState("");

  function onAdd() {
    if (!start.date || !end.date) {
      toast.error("Vul start- en einddatum in");
      return;
    }
    const startsAt = zonedDateTimeToUtc(start.date, start.time);
    const endsAt = zonedDateTimeToUtc(end.date, end.time);
    if (endsAt <= startsAt) {
      toast.error("Einde moet na de start liggen");
      return;
    }
    startTransition(async () => {
      await addTimeOffAction({
        staffId,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        reason: reason.trim() || undefined,
      });
      setStart({ date: "", time: "00:00" });
      setEnd({ date: "", time: "23:59" });
      setReason("");
      router.refresh();
      toast.success("Toegevoegd");
    });
  }

  function onDelete(id: string) {
    startTransition(async () => {
      await deleteTimeOffAction(id);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-8">
      <section className="rounded-lg border p-5">
        <h2 className="text-base font-semibold">Nieuwe blokkade</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Start</Label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={start.date}
                onChange={(e) => setStart({ ...start, date: e.target.value })}
              />
              <Input
                type="time"
                value={start.time}
                onChange={(e) => setStart({ ...start, time: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>Einde</Label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={end.date}
                onChange={(e) => setEnd({ ...end, date: e.target.value })}
              />
              <Input
                type="time"
                value={end.time}
                onChange={(e) => setEnd({ ...end, time: e.target.value })}
              />
            </div>
          </div>
        </div>
        <div className="mt-3">
          <Label htmlFor="reason">Reden (optioneel)</Label>
          <Input
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Vakantie, ziek, prive..."
          />
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={onAdd} disabled={pending}>
            {pending ? "..." : "Toevoegen"}
          </Button>
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold">Geplande blokkades</h2>
        {rows.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Geen geplande blokkades.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {rows.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {formatHumanDateTime(new Date(r.starts_at))}{" "}
                    <span className="text-muted-foreground">tot</span>{" "}
                    {formatHumanDateTime(new Date(r.ends_at))}
                  </p>
                  {r.reason && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {r.reason}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(r.id)}
                  disabled={pending}
                >
                  Verwijderen
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
