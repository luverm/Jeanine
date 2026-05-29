"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateCustomerContactAction } from "@/actions/admin-customer";

export function CustomerContactForm({
  customerId,
  initial,
}: {
  customerId: string;
  initial: { fullName: string; email: string; phone: string | null };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [fullName, setFullName] = useState(initial.fullName);
  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone ?? "");

  function reset() {
    setFullName(initial.fullName);
    setEmail(initial.email);
    setPhone(initial.phone ?? "");
    setOpen(false);
  }

  function submit() {
    startTransition(async () => {
      const result = await updateCustomerContactAction({
        id: customerId,
        fullName,
        email,
        phone,
      });
      if (result.ok) {
        toast.success("Klantgegevens bijgewerkt");
        setOpen(false);
        router.refresh();
      } else if (result.code === "DUPLICATE_EMAIL") {
        toast.error("Dit e-mailadres is al in gebruik door een andere klant.");
      } else {
        toast.error("Kon klantgegevens niet bijwerken.");
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline"
      >
        <Pencil className="h-3.5 w-3.5" aria-hidden />
        Bewerk
      </button>
    );
  }

  return (
    <div className="mt-3 grid gap-3 rounded-md border border-border bg-card p-4 sm:max-w-md">
      <div>
        <Label htmlFor="cc-name">Naam</Label>
        <Input
          id="cc-name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="name"
        />
      </div>
      <div>
        <Label htmlFor="cc-email">E-mail</Label>
        <Input
          id="cc-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </div>
      <div>
        <Label htmlFor="cc-phone">Telefoon</Label>
        <Input
          id="cc-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="button" onClick={submit} disabled={pending} size="sm">
          {pending ? "Bezig..." : "Opslaan"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={reset}
          disabled={pending}
        >
          Annuleren
        </Button>
      </div>
    </div>
  );
}
