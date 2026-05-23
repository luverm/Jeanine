"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Plus, Minus } from "lucide-react";
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

// `text-base` keeps iOS from zooming in when focusing an input.
const INPUT =
  "w-full rounded-md border bg-background px-3 py-2 text-base sm:text-sm";

export function BridalInvoiceForm({
  prefill,
  leadId,
  vatRate,
}: {
  prefill?: {
    customerName?: string;
    customerEmail?: string;
    depositCents?: number;
  };
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
  const [depositCents, setDepositCents] = useState(prefill?.depositCents ?? 0);
  const [busy, setBusy] = useState(false);

  const incl = lines.reduce(
    (s, l) => s + Math.round(l.quantity * l.unitCents),
    0,
  );
  const subtotal = vatRate > 0 ? Math.round(incl / (1 + vatRate / 100)) : incl;
  const vat = incl - subtotal;
  const due = Math.max(0, incl - depositCents);

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
        depositCents,
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
    <div className="space-y-8 pb-24 sm:pb-0">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Naam klant">
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className={INPUT}
            maxLength={120}
          />
        </Field>
        <Field label="E-mail (optioneel)">
          <input
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            type="email"
            className={INPUT}
            maxLength={254}
          />
        </Field>
        <Field label="Factuurdatum">
          <input
            value={issuedOn}
            onChange={(e) => setIssuedOn(e.target.value)}
            type="date"
            className={INPUT}
          />
        </Field>
        <Field label="Aanbetaling reeds ontvangen (€)">
          <input
            value={(depositCents / 100).toString()}
            onChange={(e) =>
              setDepositCents(
                Math.max(0, Math.round((Number(e.target.value) || 0) * 100)),
              )
            }
            type="number"
            inputMode="decimal"
            min={0}
            step={0.01}
            className={INPUT}
          />
        </Field>
      </div>

      <div className="rounded-lg border">
        <div className="border-b bg-muted/30 px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Regels
        </div>
        <ul className="divide-y">
          {lines.map((l) => (
            <li key={l.id} className="px-4 py-4">
              <LineRow
                line={l}
                onPatch={(p) => patch(l.id, p)}
                onRemove={() => remove(l.id)}
              />
            </li>
          ))}
        </ul>
        <div className="border-t px-4 py-3">
          <Button type="button" variant="outline" size="sm" onClick={add}>
            <Plus className="mr-1 h-4 w-4" /> Regel toevoegen
          </Button>
        </div>
      </div>

      <div className="w-full text-sm sm:ml-auto sm:w-72">
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
        {depositCents > 0 && (
          <>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">
                Reeds voldaan (aanbetaling)
              </span>
              <span className="tabular-nums">
                −{formatPrice(depositCents)}
              </span>
            </div>
            <div className="flex justify-between border-t py-2 font-semibold">
              <span>Nog te voldoen</span>
              <span className="tabular-nums">{formatPrice(due)}</span>
            </div>
          </>
        )}
      </div>

      <div
        className={
          "fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t bg-background p-3 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] " +
          "sm:static sm:mt-4 sm:justify-end sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none"
        }
      >
        <Button
          type="button"
          onClick={submit}
          disabled={busy}
          size="lg"
          className="flex-1 sm:flex-none"
        >
          {busy ? "Aanmaken…" : "Factuur aanmaken"}
        </Button>
      </div>
    </div>
  );
}

function LineRow({
  line,
  onPatch,
  onRemove,
}: {
  line: Line;
  onPatch: (p: Partial<Line>) => void;
  onRemove: () => void;
}) {
  const amount = Math.round(line.quantity * line.unitCents);

  return (
    <div className="grid gap-3">
      <div className="flex items-start gap-2">
        <input
          value={line.description}
          onChange={(e) => onPatch({ description: e.target.value })}
          placeholder="Omschrijving"
          className={INPUT + " flex-1"}
          maxLength={200}
        />
        <button
          type="button"
          onClick={onRemove}
          aria-label="Regel verwijderen"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-end">
        <FieldSmall label="Aantal">
          <QuantityStepper
            value={line.quantity}
            onChange={(q) => onPatch({ quantity: q })}
          />
        </FieldSmall>
        <FieldSmall label="Stuksprijs €">
          <input
            value={(line.unitCents / 100).toString()}
            onChange={(e) =>
              onPatch({
                unitCents: Math.round((Number(e.target.value) || 0) * 100),
              })
            }
            type="number"
            inputMode="decimal"
            min={0}
            step={0.01}
            className={INPUT + " text-right"}
          />
        </FieldSmall>
        <FieldSmall label="Bedrag" align="right">
          <span className="block py-2 text-base font-medium tabular-nums sm:text-sm">
            {formatPrice(amount)}
          </span>
        </FieldSmall>
      </div>
    </div>
  );
}

function QuantityStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-stretch overflow-hidden rounded-md border">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        aria-label="Aantal verlagen"
        className="flex w-10 items-center justify-center text-muted-foreground hover:bg-accent"
      >
        <Minus className="h-4 w-4" />
      </button>
      <input
        value={value}
        onChange={(e) =>
          onChange(Math.max(0, Math.round(Number(e.target.value) || 0)))
        }
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        className="w-16 border-x bg-background py-2 text-center text-base sm:text-sm"
      />
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        aria-label="Aantal verhogen"
        className="flex w-10 items-center justify-center text-muted-foreground hover:bg-accent"
      >
        <Plus className="h-4 w-4" />
      </button>
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

function FieldSmall({
  label,
  align,
  children,
}: {
  label: string;
  align?: "right";
  children: React.ReactNode;
}) {
  return (
    <label className={"block " + (align === "right" ? "text-right" : "")}>
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
