"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateLeadContactAction } from "@/actions/lead";

export function LeadContactForm({
  leadId,
  initial,
}: {
  leadId: string;
  initial: {
    fullName: string;
    email: string;
    phone: string | null;
    location: string | null;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [fullName, setFullName] = useState(initial.fullName);
  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [location, setLocation] = useState(initial.location ?? "");

  function reset() {
    setFullName(initial.fullName);
    setEmail(initial.email);
    setPhone(initial.phone ?? "");
    setLocation(initial.location ?? "");
    setOpen(false);
  }

  function submit() {
    startTransition(async () => {
      const result = await updateLeadContactAction({
        id: leadId,
        fullName,
        email,
        phone,
        location,
      });
      if (result.ok) {
        toast.success("Gegevens bijgewerkt");
        setOpen(false);
        router.refresh();
      } else {
        toast.error("Kon gegevens niet bijwerken.");
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
    <div className="mt-3 grid gap-3 rounded-md border bg-card p-4 sm:max-w-md">
      <div>
        <Label htmlFor="lc-name">Naam</Label>
        <Input
          id="lc-name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="name"
        />
      </div>
      <div>
        <Label htmlFor="lc-email">E-mail</Label>
        <Input
          id="lc-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </div>
      <div>
        <Label htmlFor="lc-phone">Telefoon</Label>
        <Input
          id="lc-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
        />
      </div>
      <div>
        <Label htmlFor="lc-loc">Locatie (straat + postcode + stad)</Label>
        <Input
          id="lc-loc"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          autoComplete="street-address"
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
