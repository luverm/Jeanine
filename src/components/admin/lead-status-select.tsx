"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { updateLeadStatusAction } from "@/actions/lead";
import type { LeadStatus } from "@/lib/db/leads";

const OPTIONS: Array<{ value: LeadStatus; label: string }> = [
  { value: "new", label: "Nieuw" },
  { value: "contacted", label: "Contact gehad" },
  { value: "quoted", label: "Voorstel" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

export function LeadStatusSelect({
  leadId,
  status,
}: {
  leadId: string;
  status: LeadStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onChange(next: LeadStatus) {
    if (next === status) return;
    startTransition(async () => {
      const result = await updateLeadStatusAction(leadId, next);
      if (result.ok) {
        toast.success("Status bijgewerkt");
        router.refresh();
      } else {
        toast.error("Wijzigen mislukt");
      }
    });
  }

  return (
    <select
      defaultValue={status}
      disabled={pending}
      onChange={(e) => onChange(e.currentTarget.value as LeadStatus)}
      className="h-9 rounded-md border bg-background px-2 text-sm"
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
