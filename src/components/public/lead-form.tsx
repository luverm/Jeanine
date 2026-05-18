"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { uploadBridalAttachments } from "@/actions/bridal-upload";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

import {
  BRIDAL_SERVICE_OPTIONS,
  leadInputSchema,
  type BridalServiceOption,
  type LeadInput,
} from "@/lib/schemas/lead";
import { createLead } from "@/actions/lead";

const SERVICE_LABELS: Record<BridalServiceOption, string> = {
  bruid: "Bruidsstyling",
  proefsessie: "Proefsessie",
  bruidsmeisjes: "Bruidsmeisjes",
  "moeder-bruid": "Moeder van de bruid",
  hairextensions: "Hairextensions",
};

export function LeadForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [files, setFiles] = useState<File[]>([]);

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
    },
    mode: "onBlur",
  });

  function onSubmit(values: LeadInput) {
    startTransition(async () => {
      let attachmentPaths: string[] | undefined;
      if (files.length > 0) {
        try {
          const fd = new FormData();
          files.slice(0, 8).forEach((f) => fd.append("files", f));
          const { paths } = await uploadBridalAttachments(fd);
          if (paths.length > 0) attachmentPaths = paths;
        } catch {
          // never block the lead on an upload problem
        }
      }
      const payload: LeadInput = {
        ...values,
        budgetCents: null,
        attachmentPaths,
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
        <Label htmlFor="message">Bericht (optioneel)</Label>
        <Textarea id="message" rows={5} {...form.register("message")} />
      </div>

      <div>
        <Label htmlFor="inspiration">
          Inspiratiebeelden (optioneel, max 8)
        </Label>
        <input
          id="inspiration"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          className="mt-1.5 block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:bg-background file:px-3 file:py-1.5 file:text-sm"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Bijv. een Pinterest-screenshot of foto van de gewenste look.
        </p>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Versturen..." : "Verstuur aanvraag"}
        </Button>
      </div>
    </form>
  );
}
