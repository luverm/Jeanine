"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteLeadAction } from "@/actions/lead";

export function LeadDelete({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const r = await deleteLeadAction(leadId);
      if (r.ok) {
        toast.success("Lead verwijderd");
        router.push("/leads");
        router.refresh();
      } else {
        toast.error("Verwijderen mislukt.");
      }
    });
  }

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="destructive"
        onClick={() => setConfirming(true)}
      >
        Lead verwijderen
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">
        Definitief verwijderen? Dit kan niet ongedaan worden gemaakt.
      </span>
      <Button
        type="button"
        variant="destructive"
        onClick={remove}
        disabled={pending}
      >
        {pending ? "Verwijderen…" : "Ja, verwijder"}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => setConfirming(false)}
        disabled={pending}
      >
        Annuleren
      </Button>
    </div>
  );
}
