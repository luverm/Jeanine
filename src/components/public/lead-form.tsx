"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";

import {
  BRIDAL_SERVICE_OPTIONS,
  leadInputSchema,
  type BridalServiceOption,
  type LeadInput,
} from "@/lib/schemas/lead";
import { createLead } from "@/actions/lead";
import { Turnstile } from "@/components/public/turnstile";

const SERVICE_LABELS: Record<BridalServiceOption, string> = {
  bruid: "Bruidsstyling",
  proefsessie: "Proefsessie",
  bruidsmeisjes: "Bruidsmeisjes",
  "moeder-bruid": "Moeder van de bruid",
  hairextensions: "Hairextensions",
};

const BUDGET_MIN_EUR = 0;
const BUDGET_MAX_EUR = 5000;
const BUDGET_STEP = 250;

export function LeadForm({ turnstileSiteKey }: { turnstileSiteKey: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [budgetEur, setBudgetEur] = useState<number | null>(null);

  const form = useForm<LeadInput>({
    resolver: zodResolver(leadInputSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      weddingDate: "",
      city: "",
      postcode: "",
      partySize: 1,
      servicesWanted: [],
      budgetCents: null,
      message: "",
      website: "",
      turnstileToken: "",
    },
    mode: "onBlur",
  });

  function onSubmit(values: LeadInput) {
    startTransition(async () => {
      const payload: LeadInput = {
        ...values,
        budgetCents: budgetEur === null ? null : budgetEur * 100,
      };
      const result = await createLead(payload);
      if (result.ok) {
        router.push("/bedankt");
        return;
      }
      switch (result.code) {
        case "RATE_LIMITED":
          toast.error("Te veel verzoeken — probeer het later opnieuw.");
          break;
        case "VERIFICATION_FAILED":
          toast.error("Verificatie mislukt — probeer het opnieuw.");
          break;
        default:
          toast.error("Er ging iets mis. Probeer het opnieuw.");
      }
    });
  }

  const errors = form.formState.errors;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="grid gap-6"
      noValidate
    >
      {/* Honeypot */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
        {...form.register("website")}
      />

      <div>
        <Label htmlFor="fullName">Volledige naam</Label>
        <Input id="fullName" autoComplete="name" {...form.register("fullName")} />
        {errors.fullName && (
          <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            {...form.register("email")}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="phone">Telefoon</Label>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            {...form.register("phone")}
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="weddingDate">Trouwdatum</Label>
          <Input id="weddingDate" type="date" {...form.register("weddingDate")} />
          {errors.weddingDate && (
            <p className="mt-1 text-xs text-red-600">
              {errors.weddingDate.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="partySize">Aantal personen</Label>
          <Input
            id="partySize"
            type="number"
            min={1}
            max={50}
            {...form.register("partySize", { valueAsNumber: true })}
          />
          {errors.partySize && (
            <p className="mt-1 text-xs text-red-600">{errors.partySize.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Label htmlFor="city">Stad</Label>
          <Input id="city" autoComplete="address-level2" {...form.register("city")} />
          {errors.city && (
            <p className="mt-1 text-xs text-red-600">{errors.city.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="postcode">Postcode</Label>
          <Input
            id="postcode"
            autoComplete="postal-code"
            placeholder="1234 AB"
            {...form.register("postcode")}
          />
          {errors.postcode && (
            <p className="mt-1 text-xs text-red-600">{errors.postcode.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label>Gewenste diensten</Label>
        <Controller
          control={form.control}
          name="servicesWanted"
          render={({ field }) => (
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {BRIDAL_SERVICE_OPTIONS.map((opt) => {
                const checked = field.value.includes(opt);
                return (
                  <label
                    key={opt}
                    className="flex cursor-pointer items-center gap-3 rounded border p-3 text-sm hover:bg-accent"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(next) => {
                        if (next === true) {
                          field.onChange([...field.value, opt]);
                        } else {
                          field.onChange(field.value.filter((v) => v !== opt));
                        }
                      }}
                    />
                    {SERVICE_LABELS[opt]}
                  </label>
                );
              })}
            </div>
          )}
        />
        {errors.servicesWanted && (
          <p className="mt-1 text-xs text-red-600">
            {errors.servicesWanted.message as string}
          </p>
        )}
      </div>

      <div>
        <Label>
          Budget (optioneel)
          <span className="ml-2 text-xs text-muted-foreground">
            {budgetEur === null
              ? "geen voorkeur"
              : `± € ${budgetEur.toLocaleString("nl-NL")}`}
          </span>
        </Label>
        <Slider
          className="mt-3"
          min={BUDGET_MIN_EUR}
          max={BUDGET_MAX_EUR}
          step={BUDGET_STEP}
          value={[budgetEur ?? BUDGET_MIN_EUR]}
          onValueChange={(values) => {
            const next = Array.isArray(values) ? values[0] : values;
            setBudgetEur(next ?? 0);
          }}
        />
        {budgetEur !== null && (
          <button
            type="button"
            onClick={() => setBudgetEur(null)}
            className="mt-2 text-xs text-muted-foreground underline underline-offset-4"
          >
            Geen voorkeur opgeven
          </button>
        )}
      </div>

      <div>
        <Label htmlFor="message">Bericht (optioneel)</Label>
        <Textarea id="message" rows={5} {...form.register("message")} />
      </div>

      <div>
        <Controller
          control={form.control}
          name="turnstileToken"
          render={({ field }) => (
            <Turnstile
              siteKey={turnstileSiteKey}
              onVerify={(token) => field.onChange(token)}
            />
          )}
        />
        {errors.turnstileToken && (
          <p className="mt-2 text-xs text-red-600">
            {errors.turnstileToken.message}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Versturen..." : "Verstuur aanvraag"}
        </Button>
      </div>
    </form>
  );
}
