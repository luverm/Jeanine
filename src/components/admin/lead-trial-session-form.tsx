"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setLeadTrialSessionAction } from "@/actions/lead";

// HTML datetime-local wants "YYYY-MM-DDTHH:mm" in *local* time, not UTC.
function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function LeadTrialSessionForm({
  leadId,
  trialSessionAt,
}: {
  leadId: string;
  trialSessionAt: string | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(
    trialSessionAt ? isoToLocalInput(trialSessionAt) : "",
  );

  function save(at: string | null) {
    startTransition(async () => {
      const isoIn = at ? new Date(at).toISOString() : null;
      const result = await setLeadTrialSessionAction({ id: leadId, at: isoIn });
      if (result.ok) {
        toast.success(at ? "Proefsessie opgeslagen" : "Proefsessie gewist");
        setEditing(false);
        router.refresh();
      } else {
        toast.error("Kon proefsessie niet opslaan.");
      }
    });
  }

  if (trialSessionAt && !editing) {
    const pretty = format(
      new Date(trialSessionAt),
      "EEEE d MMMM yyyy 'om' HH:mm",
      { locale: nl },
    );
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-2.5 py-1 text-sm text-emerald-900">
          <Check className="h-4 w-4" aria-hidden />
          Ingepland — <span className="font-medium">{pretty}</span>
        </span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden />
          Wijzigen
        </button>
        <button
          type="button"
          onClick={() => save(null)}
          disabled={pending}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 transition hover:text-destructive hover:underline"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          Verwijderen
        </button>
      </div>
    );
  }

  if (!editing) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setEditing(true)}
      >
        Proefsessie inplannen
      </Button>
    );
  }

  return (
    <div className="grid gap-3 sm:max-w-sm">
      <div>
        <Label htmlFor="trial-at">Datum &amp; tijd</Label>
        <Input
          id="trial-at"
          type="datetime-local"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={pending || !value}
          onClick={() => save(value)}
        >
          {pending ? "Bezig..." : "Opslaan"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setValue(
              trialSessionAt ? isoToLocalInput(trialSessionAt) : "",
            );
            setEditing(false);
          }}
          disabled={pending}
        >
          Annuleren
        </Button>
      </div>
    </div>
  );
}
