"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Check, Clock, Calendar as CalendarIcon, User } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";

import { customerInputSchema, type CustomerInput } from "@/lib/schemas/booking";
import {
  formatPrice,
  formatDuration,
  type Service,
} from "@/lib/services-format";
import { fetchAvailableSlots, type SlotDto } from "@/actions/availability";
import { createBooking } from "@/actions/booking";
import { SlotGrid, type Slot } from "@/components/booking/slot-grid";
import { formatIsoDate, formatHumanDateTime, formatTime } from "@/lib/time";
import { SERVICE_CATEGORIES, categoryForSlug } from "@/content/services";

const STEPS = ["Dienst", "Datum", "Tijd", "Gegevens"] as const;
const TOTAL_STEPS = STEPS.length;

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
  const requestKey = service && dateStr ? `${service.id}|${dateStr}` : null;
  const slotsLoading = requestKey !== null && fetchedFor !== requestKey;

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
    fetchAvailableSlots({ staffId, serviceId: service.id, date: dateStr }).then(
      (dtos) => {
        setFetchedSlots(
          dtos.map((s) => ({
            startsAt: new Date(s.startsAt),
            endsAt: new Date(s.endsAt),
          })),
        );
        setFetchedFor(requestKey);
      },
    );
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
    <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
      <div>
        <Stepper current={step} />

        <div className="mt-10">
          {step === 0 && (
            <ServiceStep
              services={services}
              selectedId={serviceId}
              onSelect={handleSelectService}
              onNext={() => setStep(1)}
            />
          )}

          {step === 1 && (
            <DateStep
              date={date}
              onSelect={handleSelectDate}
              onBack={() => setStep(0)}
              onNext={() => setStep(2)}
            />
          )}

          {step === 2 && (
            <TimeStep
              date={date}
              slots={slots}
              selected={selectedStartIso}
              onSelect={setSelectedStartIso}
              loading={slotsLoading}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}

          {step === 3 && service && selectedSlot && (
            <DetailsStep
              service={service}
              slot={selectedSlot}
              form={form}
              onBack={() => setStep(2)}
              onSubmit={onSubmit}
              pending={pending}
            />
          )}
        </div>
      </div>

      <Summary
        service={service}
        date={date}
        slot={selectedSlot ?? null}
        step={step}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */
/* Stepper                                                                 */
/* ─────────────────────────────────────────────────────────────────────── */

function Stepper({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-1 sm:gap-3">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex flex-1 items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <span
                className={
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm transition " +
                  (active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : done
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground")
                }
                aria-current={active ? "step" : undefined}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span
                className={
                  "hidden text-sm sm:inline " +
                  (active
                    ? "font-medium text-foreground"
                    : done
                      ? "text-foreground"
                      : "text-muted-foreground")
                }
              >
                {label}
              </span>
            </div>
            {i < TOTAL_STEPS - 1 && (
              <span
                aria-hidden
                className={
                  "h-px flex-1 transition " +
                  (i < current ? "bg-primary/40" : "bg-border")
                }
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */
/* Step 1 — choose service                                                 */
/* ─────────────────────────────────────────────────────────────────────── */

function ServiceStep({
  services,
  selectedId,
  onSelect,
  onNext,
}: {
  services: Service[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNext: () => void;
}) {
  // Group services by UI category, in the order defined in SERVICE_CATEGORIES.
  // Anything that doesn't match a known category falls into "Overig" so it
  // stays bookable even if its slug doesn't follow the convention.
  const groups: Array<{ key: string; label: string; items: Service[] }> = [];
  const buckets = new Map<string, Service[]>();
  for (const s of services) {
    const cat = categoryForSlug(s.slug);
    const key = cat?.key ?? "overig";
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(s);
  }
  for (const cat of SERVICE_CATEGORIES) {
    const items = buckets.get(cat.key);
    if (items && items.length) {
      groups.push({ key: cat.key, label: cat.label, items });
    }
  }
  const overig = buckets.get("overig");
  if (overig && overig.length) {
    groups.push({ key: "overig", label: "Overig", items: overig });
  }

  return (
    <section>
      <h2 className="text-2xl tracking-tight">Kies een dienst</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Alle prijzen incl. wassen waar van toepassing.
      </p>

      <div className="mt-6 space-y-8">
        {groups.map((g) => (
          <div key={g.key}>
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {g.label}
            </p>
            <div className="grid gap-3">
              {g.items.map((s) => {
                const isSelected = s.id === selectedId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onSelect(s.id)}
                    className={
                      "group flex w-full items-start gap-4 rounded-lg border p-5 text-left transition " +
                      (isSelected
                        ? "border-primary bg-accent/30 shadow-sm"
                        : "border-border bg-card hover:border-primary/40 hover:bg-accent/10")
                    }
                  >
                    <span
                      className={
                        "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition " +
                        (isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border")
                      }
                      aria-hidden
                    >
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="text-lg tracking-tight">{s.name}</h3>
                        <span className="font-medium">
                          {formatPrice(s.price_cents)}
                        </span>
                      </div>
                      {s.description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {s.description}
                        </p>
                      )}
                      <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDuration(s.duration_min)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <Button disabled={!selectedId} onClick={onNext} size="lg">
          Volgende
        </Button>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */
/* Step 2 — choose date                                                    */
/* ─────────────────────────────────────────────────────────────────────── */

function DateStep({
  date,
  onSelect,
  onBack,
  onNext,
}: {
  date: Date | undefined;
  onSelect: (d: Date | undefined) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <section>
      <h2 className="text-2xl tracking-tight">Kies een datum</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Beschikbaarheid loopt tot 90 dagen vooruit.
      </p>

      <div className="mt-6 flex justify-center rounded-lg border border-border bg-card p-4 sm:p-6">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onSelect}
          locale={nl}
          weekStartsOn={1}
          disabled={(d) => {
            if (d < todayInTz) return true;
            if (d > ninetyDaysOut) return true;
            // Sat/Sun closed for regular bookings (Saturdays reserved for bridal).
            const day = d.getDay();
            if (day === 0 || day === 6) return true;
            return false;
          }}
        />
      </div>

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Terug
        </Button>
        <Button disabled={!date} onClick={onNext} size="lg">
          Volgende
        </Button>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */
/* Step 3 — choose time                                                    */
/* ─────────────────────────────────────────────────────────────────────── */

function TimeStep({
  date,
  slots,
  selected,
  onSelect,
  loading,
  onBack,
  onNext,
}: {
  date: Date | undefined;
  slots: Slot[];
  selected: string | null;
  onSelect: (iso: string) => void;
  loading: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <section>
      <h2 className="text-2xl tracking-tight">Kies een tijd</h2>
      {date && (
        <p className="mt-1 text-sm text-muted-foreground">
          {format(date, "EEEE d MMMM yyyy", { locale: nl })}
        </p>
      )}

      <div className="mt-6">
        <SlotGrid
          slots={slots}
          selected={selected}
          onSelect={onSelect}
          loading={loading}
        />
      </div>

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Terug
        </Button>
        <Button disabled={!selected} onClick={onNext} size="lg">
          Volgende
        </Button>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */
/* Step 4 — customer details                                               */
/* ─────────────────────────────────────────────────────────────────────── */

function DetailsStep({
  service,
  slot,
  form,
  onBack,
  onSubmit,
  pending,
}: {
  service: Service;
  slot: Slot;
  form: ReturnType<typeof useForm<CustomerInput>>;
  onBack: () => void;
  onSubmit: (v: CustomerInput) => void;
  pending: boolean;
}) {
  return (
    <section>
      <h2 className="text-2xl tracking-tight">Jouw gegevens</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Bevestiging volgt direct per e-mail, met agenda-bijlage.
      </p>

      <div className="mt-6 rounded-lg border border-border bg-accent/20 p-5 text-sm">
        <p>
          <span className="font-medium">{service.name}</span>{" "}
          <span className="text-muted-foreground">
            · {formatDuration(service.duration_min)} ·{" "}
            {formatPrice(service.price_cents)}
          </span>
        </p>
        <p className="mt-1 text-muted-foreground">
          {formatHumanDateTime(slot.startsAt)}
        </p>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mt-6 grid gap-5"
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
          <Input
            id="fullName"
            {...form.register("fullName")}
            autoComplete="name"
            className="mt-1.5"
          />
          {form.formState.errors.fullName && (
            <p className="mt-1 text-xs text-destructive">
              {form.formState.errors.fullName.message}
            </p>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...form.register("email")}
              className="mt-1.5"
            />
            {form.formState.errors.email && (
              <p className="mt-1 text-xs text-destructive">
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
              className="mt-1.5"
            />
            {form.formState.errors.phone && (
              <p className="mt-1 text-xs text-destructive">
                {form.formState.errors.phone.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Opmerking (optioneel)</Label>
          <Textarea
            id="notes"
            rows={3}
            {...form.register("notes")}
            className="mt-1.5"
            placeholder="Allergieën, gewenste lengte, inspiratiebeelden..."
          />
        </div>

        <div className="mt-2 flex justify-between">
          <Button type="button" variant="outline" onClick={onBack}>
            Terug
          </Button>
          <Button type="submit" disabled={pending} size="lg">
            {pending ? "Bevestigen..." : "Bevestig boeking"}
          </Button>
        </div>
      </form>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */
/* Sticky summary card                                                     */
/* ─────────────────────────────────────────────────────────────────────── */

function Summary({
  service,
  date,
  slot,
  step,
}: {
  service: Service | null;
  date: Date | undefined;
  slot: Slot | null;
  step: number;
}) {
  const empty = !service && !date && !slot;
  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Samenvatting
        </p>

        {empty ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Vul de stappen in om je samenvatting hier te zien.
          </p>
        ) : (
          <dl className="mt-5 space-y-5 text-sm">
            <SummaryRow
              icon={<User className="h-4 w-4" />}
              label="Dienst"
              value={
                service ? (
                  <>
                    <span className="block font-medium">{service.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {formatDuration(service.duration_min)}
                    </span>
                  </>
                ) : null
              }
              done={step > 0}
            />
            <SummaryRow
              icon={<CalendarIcon className="h-4 w-4" />}
              label="Datum"
              value={
                date
                  ? format(date, "EEEE d MMMM yyyy", { locale: nl })
                  : null
              }
              done={step > 1}
            />
            <SummaryRow
              icon={<Clock className="h-4 w-4" />}
              label="Tijd"
              value={slot ? formatTime(slot.startsAt) : null}
              done={step > 2}
            />
          </dl>
        )}

        {service && (
          <div className="mt-6 flex items-baseline justify-between border-t border-border pt-4">
            <span className="text-sm text-muted-foreground">Totaal</span>
            <span className="text-lg font-medium">
              {formatPrice(service.price_cents)}
            </span>
          </div>
        )}
      </div>

      <p className="mt-4 px-2 text-xs text-muted-foreground">
        Geen vooruitbetaling. Annuleren kan kosteloos tot 24 uur vooraf.
      </p>
    </aside>
  );
}

function SummaryRow({
  icon,
  label,
  value,
  done,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  done: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full " +
          (done
            ? "bg-primary/15 text-primary"
            : "bg-muted text-muted-foreground")
        }
        aria-hidden
      >
        {icon}
      </span>
      <div className="flex-1">
        <dt className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </dt>
        <dd className="mt-0.5">
          {value ?? (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </dd>
      </div>
    </div>
  );
}
