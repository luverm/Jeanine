"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/services-format";
import { createBridalInvoiceAction } from "@/actions/bridal-invoice";

type Line = {
  id: string;
  description: string;
  /** km for Reiskosten, aantal for Feestkapsel, otherwise 1. */
  quantity: number;
  unitCents: number;
};

// Prefilled from the bruidsbrochure. Quantities default to 0 for the
// optional add-ons so nothing is invoiced unless Jeanine sets an amount.
function presetLines(): Line[] {
  return [
    { id: "p-bruid", description: "Bruidsstyling (incl. proefkapsel)", quantity: 1, unitCents: 24000 },
    { id: "p-makeup", description: "Bruidsmake-up (incl. proefsessie)", quantity: 0, unitCents: 7500 },
    { id: "p-reis", description: "Reiskosten (per km vanaf Krabbendijke)", quantity: 0, unitCents: 45 },
    { id: "p-feest", description: "Feestkapsel opsteken (vriendin/familie)", quantity: 0, unitCents: 5000 },
  ];
}

function newId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `l-${Math.random().toString(36).slice(2)}`;
}

export function BridalInvoiceForm({
  prefill,
  leadId,
  vatRate,
}: {
  prefill?: { customerName?: string; customerEmail?: string };
  leadId?: string;
  vatRate: number;
}) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);

  const [customerName, setCustomerName] = useState(prefill?.customerName ?? "");
  const [customerEmail, setCustomerEmail] = useState(
    prefill?.customerEmail ?? "",
  );
  const [issuedOn, setIssuedOn] = useState(today);
  const [lines, setLines] = useState<Line[]>(presetLines());
  const [busy, setBusy] = useState(false);

  const incl = lines.reduce(
    (s, l) => s + Math.round(l.quantity * l.unitCents),
    0,
  );
  const subtotal = vatRate > 0 ? Math.round(incl / (1 + vatRate / 100)) : incl;
  const vat = incl - subtotal;

  function patch(id: string, p: Partial<Line>) {
    setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...p } : l)));
  }
  function remove(id: string) {
    setLines((ls) => ls.filter((l) => l.id !== id));
  }
  function add() {
    setLines((ls) => [
      ...ls,
      { id: newId(), description: "", quantity: 1, unitCents: 0 },
    ]);
  }

  async function submit() {
    if (!customerName.trim()) {
      toast.error("Vul de naam van de klant in.");
      return;
    }
    const billable = lines.filter(
      (l) => l.description.trim() && l.quantity > 0,
    );
    if (billable.length === 0) {
      toast.error("Voeg minimaal één regel met een aantal toe.");
      return;
    }
    setBusy(true);
    try {
      const r = await createBridalInvoiceAction({
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        issuedOn,
        leadId: leadId ?? "",
        lines: billable.map((l) => ({
          description: l.description.trim(),
          quantity: l.quantity,
          unitCents: l.unitCents,
        })),
      });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success("Bruidsfactuur aangemaakt");
      router.push(`/facturen/${r.id}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Naam klant">
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            maxLength={120}
          />
        </Field>
        <Field label="E-mail (optioneel)">
          <input
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            type="email"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            maxLength={254}
          />
        </Field>
        <Field label="Factuurdatum">
          <input
            value={issuedOn}
            onChange={(e) => setIssuedOn(e.target.value)}
            type="date"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Field>
      </div>

      <div>
        <div className="grid grid-cols-[1fr_5rem_7rem_6rem_2rem] items-center gap-3 border-b pb-2 text-xs uppercase tracking-wider text-muted-foreground">
          <span>Omschrijving</span>
          <span className="text-right">Aantal</span>
          <span className="text-right">Stuksprijs €</span>
          <span className="text-right">Bedrag</span>
          <span />
        </div>
        <div className="divide-y">
          {lines.map((l) => (
            <div
              key={l.id}
              className="grid grid-cols-[1fr_5rem_7rem_6rem_2rem] items-center gap-3 py-2"
            >
              <input
                value={l.description}
                onChange={(e) => patch(l.id, { description: e.target.value })}
                placeholder="Omschrijving"
                className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                maxLength={200}
              />
              <input
                value={l.quantity}
                onChange={(e) =>
                  patch(l.id, { quantity: Number(e.target.value) || 0 })
                }
                type="number"
                min={0}
                step={1}
                className="w-full rounded-md border bg-background px-2 py-1.5 text-right text-sm"
              />
              <input
                value={(l.unitCents / 100).toString()}
                onChange={(e) =>
                  patch(l.id, {
                    unitCents: Math.round((Number(e.target.value) || 0) * 100),
                  })
                }
                type="number"
                min={0}
                step={0.01}
                className="w-full rounded-md border bg-background px-2 py-1.5 text-right text-sm"
              />
              <span className="text-right text-sm tabular-nums">
                {formatPrice(Math.round(l.quantity * l.unitCents))}
              </span>
              <button
                type="button"
                onClick={() => remove(l.id)}
                aria-label="Regel verwijderen"
                className="rounded-md p-1 text-muted-foreground hover:bg-muted"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={add}
          className="mt-3"
        >
          <Plus className="mr-1 h-4 w-4" /> Regel toevoegen
        </Button>
      </div>

      <div className="ml-auto w-64 text-sm">
        <div className="flex justify-between py-1">
          <span className="text-muted-foreground">Subtotaal</span>
          <span className="tabular-nums">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-muted-foreground">BTW {vatRate}%</span>
          <span className="tabular-nums">{formatPrice(vat)}</span>
        </div>
        <div className="flex justify-between border-t py-2 font-semibold">
          <span>Totaal</span>
          <span className="tabular-nums">{formatPrice(incl)}</span>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={submit} disabled={busy}>
          {busy ? "Aanmaken…" : "Factuur aanmaken"}
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
