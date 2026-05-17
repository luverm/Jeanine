"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateLeadFinanceAction } from "@/actions/lead";

function eur(cents: number | null): string {
  return cents === null ? "" : (cents / 100).toFixed(2);
}
function num(v: string): number | null {
  const n = parseFloat(v.replace(",", "."));
  return v.trim() === "" || Number.isNaN(n) ? null : n;
}

export function LeadFinanceForm({
  leadId,
  agreedPriceCents,
  depositCents,
  depositPaid,
}: {
  leadId: string;
  agreedPriceCents: number | null;
  depositCents: number | null;
  depositPaid: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [agreed, setAgreed] = useState(eur(agreedPriceCents));
  const [deposit, setDeposit] = useState(eur(depositCents));
  const [paid, setPaid] = useState(depositPaid);

  const agreedN = num(agreed);
  const depositN = num(deposit);
  const remaining =
    agreedN !== null ? agreedN - (paid ? (depositN ?? 0) : 0) : null;

  function save() {
    startTransition(async () => {
      const result = await updateLeadFinanceAction(leadId, {
        agreedPrice: agreedN,
        deposit: depositN,
        depositPaid: paid,
      });
      if (result.ok) {
        toast.success("Opgeslagen");
        router.refresh();
      } else {
        toast.error("Opslaan mislukt.");
      }
    });
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="agreed">Afgesproken prijs (€)</Label>
          <Input
            id="agreed"
            inputMode="decimal"
            value={agreed}
            onChange={(e) => setAgreed(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="deposit">Aanbetaling (€)</Label>
          <Input
            id="deposit"
            inputMode="decimal"
            value={deposit}
            onChange={(e) => setDeposit(e.target.value)}
            className="mt-1.5"
          />
        </div>
      </div>
      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={paid}
          onChange={(e) => setPaid(e.target.checked)}
          className="h-4 w-4"
        />
        Aanbetaling ontvangen
      </label>
      {remaining !== null && (
        <p className="text-sm">
          Nog te ontvangen:{" "}
          <strong>
            € {remaining.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
          </strong>
        </p>
      )}
      <div>
        <Button type="button" onClick={save} disabled={pending}>
          {pending ? "Opslaan…" : "Opslaan"}
        </Button>
      </div>
    </div>
  );
}
