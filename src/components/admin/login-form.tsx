"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendMagicLink } from "@/actions/auth";

export function LoginForm() {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "sent"; email: string }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  function onSubmit(formData: FormData) {
    const email = String(formData.get("email") ?? "");
    startTransition(async () => {
      const result = await sendMagicLink(formData);
      if (result.ok) {
        setState({ kind: "sent", email });
      } else {
        setState({ kind: "error", message: result.message });
      }
    });
  }

  if (state.kind === "sent") {
    return (
      <div className="rounded-lg border bg-muted/30 p-6 text-sm">
        <p className="font-medium">Magische link verzonden.</p>
        <p className="mt-2 text-muted-foreground">
          Check je inbox op <strong>{state.email}</strong> en klik op de link
          om in te loggen.
        </p>
      </div>
    );
  }

  return (
    <form action={onSubmit} className="grid gap-4">
      <div>
        <Label htmlFor="email">E-mailadres</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="jij@studiojeanine.nl"
        />
      </div>
      {state.kind === "error" && (
        <p className="text-xs text-red-600">{state.message}</p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Versturen..." : "Stuur magische link"}
      </Button>
    </form>
  );
}
