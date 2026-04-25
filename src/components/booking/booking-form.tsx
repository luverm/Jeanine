"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";

import { customerInputSchema, type CustomerInput } from "@/lib/schemas/booking";
import {
  formatPrice,
  formatDuration,
  type Service,
} from "@/lib/db/services";
import { fetchAvailableSlots, type SlotDto } from "@/actions/availability";
import { createBooking } from "@/actions/booking";
import { SlotGrid, type Slot } from "@/components/booking/slot-grid";
import { formatIsoDate, formatHumanDateTime } from "@/lib/time";

const STEPS = ["Dienst", "Datum", "Tijd", "Gegevens"] as const;

const todayInTz = new Date(formatIsoDate(new Date()) + "T00:00:00Z");
const ninetyDaysOut = new Date(todayInTz.getTime() + 90 * 24 * 60 * 60 * 1000);

export function BookingForm({
  services,
  staffId,
  initialServiceSlug,
}: {
  services: Service[];
  staffId: string;
  initialServiceSlug?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState<string | null>(
    initialServiceSlug
      ? services.find((s) => s.slug === initialServiceSlug)?.id ?? null
      : null,
  );
  const [date, setDate] = useState<Date | undefined>();
  const [fetchedSlots, setFetchedSlots] = useState<Slot[]>([]);
  const [fetchedFor, setFetchedFor] = useState<string | null>(null);
  const [selectedStartIso, setSelectedStartIso] = useState<string | null>(null);
  // Idempotency-key generated once per mount via lazy useState initialiser.
  // Different value on server vs. client is fine — it isn't rendered into HTML.
  const [idempotencyKey] = useState<string>(() => uuidv4());
  const [pending, startTransition] = useTransition();

  const form = useForm<CustomerInput>({
    resolver: zodResolver(customerInputSchema),
    defaultValues: { fullName: "", email: "", phone: "", notes: "" },
    mode: "onBlur",
  });

  const service = useMemo(
    () => services.find((s) => s.id === serviceId) ?? null,
    [services, serviceId],
  );

  const dateStr = date ? formatIsoDate(date) : null;
  const requestKey =
    service && dateStr ? `${service.id}|${dateStr}` : null;
  const slotsLoading = requestKey !== null && fetchedFor !== requestKey;

  // Fetch slots when service or date change. Selection-clearing happens
  // in the user-input handlers (handleSelectService / handleSelectDate),
  // so this effect only deals with the async fetch.
  useEffect(() => {
    if (!service || !dateStr || !requestKey) return;
    let cancelled = false;
    fetchAvailableSlots({ staffId, serviceId: service.id, date: dateStr })
      .then((dtos: SlotDto[]) => {
        if (cancelled) return;
        setFetchedSlots(
          dtos.map((s) => ({
            startsAt: new Date(s.startsAt),
            endsAt: new Date(s.endsAt),
          })),
        );
        setFetchedFor(requestKey);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        toast.error("Kon vrije tijden niet ophalen — probeer het opnieuw.");
        setFetchedSlots([]);
        setFetchedFor(requestKey);
      });
    return () => {
      cancelled = true;
    };
  }, [staffId, service, dateStr, requestKey]);

  const slots: Slot[] =
    service && dateStr && fetchedFor === requestKey ? fetchedSlots : [];

  function handleSelectService(id: string) {
    setServiceId(id);
    setFetchedSlots([]);
    setFetchedFor(null);
    setSelectedStartIso(null);
  }

  function handleSelectDate(d: Date | undefined) {
    setDate(d);
    setFetchedSlots([]);
    setFetchedFor(null);
    setSelectedStartIso(null);
  }

  function refreshSlots() {
    if (!service || !dateStr || !requestKey) return;
    setFetchedFor(null);
    fetchAvailableSlots({ staffId, serviceId: service.id, date: dateStr })
      .then((dtos) => {
        setFetchedSlots(
          dtos.map((s) => ({
            startsAt: new Date(s.startsAt),
            endsAt: new Date(s.endsAt),
          })),
        );
        setFetchedFor(requestKey);
      });
  }

  const selectedSlot = slots.find(
    (s) => s.startsAt.toISOString() === selectedStartIso,
  );

  function onSubmit(values: CustomerInput) {
    if (!service || !selectedSlot || !idempotencyKey) return;
    startTransition(async () => {
      const result = await createBooking({
        serviceId: service.id,
        staffId,
        startsAt: selectedSlot.startsAt.toISOString(),
        endsAt: selectedSlot.endsAt.toISOString(),
        idempotencyKey,
        customer: {
          fullName: values.fullName,
          email: values.email,
          phone: values.phone,
          notes: values.notes ?? "",
        },
        website: "",
      });

      if (result.ok) {
        router.push(`/boeken/bevestigd?ref=${result.bookingId}`);
        return;
      }

      if (result.code === "SLOT_TAKEN") {
        toast.error("Dit slot is net weg — kies opnieuw.");
        setStep(2);
        setSelectedStartIso(null);
        refreshSlots();
        return;
      }

      toast.error(result.message ?? "Er ging iets mis. Probeer het opnieuw.");
    });
  }

  return (
    <div>
      <ol className="mb-8 flex flex-wrap gap-2 text-sm">
        {STEPS.map((label, i) => {
          const active = i === step;
          const done = i < step;
          return (
            <li
              key={label}
              className={
                "rounded-full border px-3 py-1 " +
                (active
                  ? "border-foreground bg-foreground text-background"
                  : done
                    ? "border-foreground text-foreground"
                    : "border-muted text-muted-foreground")
              }
            >
              {i + 1}. {label}
            </li>
          );
        })}
      </ol>

      {step === 0 && (
        <section className="grid gap-4 sm:grid-cols-2">
          {services.map((s) => {
            const isSelected = s.id === serviceId;
            return (
              <Card
                key={s.id}
                className={
                  "cursor-pointer p-5 transition " +
                  (isSelected ? "ring-2 ring-foreground" : "hover:shadow-md")
                }
                onClick={() => handleSelectService(s.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold">{s.name}</h3>
                  <span className="text-sm">{formatPrice(s.price_cents)}</span>
                </div>
                {s.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {s.description}
                  </p>
                )}
                <p className="mt-3 text-xs text-muted-foreground">
                  {formatDuration(s.duration_min)}
                </p>
              </Card>
            );
          })}
          <div className="col-span-full mt-4 flex justify-end">
            <Button disabled={!serviceId} onClick={() => setStep(1)}>
              Volgende
            </Button>
          </div>
        </section>
      )}

      {step === 1 && (
        <section>
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelectDate}
            disabled={(d) => {
              if (d < todayInTz) return true;
              if (d > ninetyDaysOut) return true;
              if (d.getDay() === 0) return true; // Sundays closed by default
              return false;
            }}
            className="mx-auto"
          />
          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={() => setStep(0)}>
              Terug
            </Button>
            <Button disabled={!date} onClick={() => setStep(2)}>
              Volgende
            </Button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-6">
          {date && (
            <p className="text-sm text-muted-foreground">
              {format(date, "EEEE d MMMM yyyy")}
            </p>
          )}
          <SlotGrid
            slots={slots}
            selected={selectedStartIso}
            onSelect={setSelectedStartIso}
            loading={slotsLoading}
          />
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              Terug
            </Button>
            <Button disabled={!selectedStartIso} onClick={() => setStep(3)}>
              Volgende
            </Button>
          </div>
        </section>
      )}

      {step === 3 && service && selectedSlot && (
        <section>
          <Card className="mb-6 p-5 text-sm">
            <p>
              <strong>{service.name}</strong> · {formatDuration(service.duration_min)}
              {" · "}
              {formatPrice(service.price_cents)}
            </p>
            <p className="mt-1 text-muted-foreground">
              {formatHumanDateTime(selectedSlot.startsAt)}
            </p>
          </Card>

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4"
            noValidate
          >
            {/* Honeypot */}
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
              defaultValue=""
            />

            <div>
              <Label htmlFor="fullName">Naam</Label>
              <Input id="fullName" {...form.register("fullName")} autoComplete="name" />
              {form.formState.errors.fullName && (
                <p className="mt-1 text-xs text-red-600">
                  {form.formState.errors.fullName.message}
                </p>
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
                {form.formState.errors.email && (
                  <p className="mt-1 text-xs text-red-600">
                    {form.formState.errors.email.message}
                  </p>
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
                {form.formState.errors.phone && (
                  <p className="mt-1 text-xs text-red-600">
                    {form.formState.errors.phone.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Opmerking (optioneel)</Label>
              <Textarea id="notes" rows={3} {...form.register("notes")} />
            </div>

            <div className="mt-2 flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>
                Terug
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Bevestigen..." : "Bevestig boeking"}
              </Button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
