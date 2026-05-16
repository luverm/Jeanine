import Link from "next/link";
import type { Metadata } from "next";
import { listBookings } from "@/lib/db/admin-bookings";
import { listAllServices } from "@/lib/db/admin-services";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatHumanDateTime } from "@/lib/time";
import { formatPrice } from "@/lib/db/services";
import { getDeviceInfo } from "@/lib/device";
import {
  BOOKING_STATUS_LABELS,
  bookingStatusLabel,
  bookingStatusVariant,
} from "@/lib/status-labels";

export const metadata: Metadata = {
  title: "Boekingen",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

const STATUS_OPTIONS = [
  { value: "", label: "Alle statussen" },
  ...Object.entries(BOOKING_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

type SearchParams = {
  from?: string;
  to?: string;
  status?: string;
  service?: string;
  q?: string;
};

export default async function BoekingenPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const [services, bookings, device] = await Promise.all([
    listAllServices(),
    listBookings({
      from: params.from || undefined,
      to: params.to || undefined,
      status: (params.status as never) || undefined,
      serviceId: params.service || undefined,
      q: params.q || undefined,
    }),
    getDeviceInfo(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6 flex items-baseline justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Boekingen</h1>
        <p className="text-sm text-muted-foreground">
          {bookings.length}{" "}
          {bookings.length === 1 ? "boeking" : "boekingen"}
        </p>
      </header>

      <form
        method="get"
        className="grid gap-3 rounded-lg border bg-muted/30 p-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <div>
          <Label htmlFor="from">Vanaf</Label>
          <Input id="from" type="date" name="from" defaultValue={params.from ?? ""} />
        </div>
        <div>
          <Label htmlFor="to">Tot</Label>
          <Input id="to" type="date" name="to" defaultValue={params.to ?? ""} />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={params.status ?? ""}
            className="block h-9 w-full rounded-md border bg-background px-2 text-sm"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="service">Dienst</Label>
          <select
            id="service"
            name="service"
            defaultValue={params.service ?? ""}
            className="block h-9 w-full rounded-md border bg-background px-2 text-sm"
          >
            <option value="">Alle diensten</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="q">Zoek klant</Label>
          <Input
            id="q"
            type="search"
            name="q"
            placeholder="naam of e-mail"
            defaultValue={params.q ?? ""}
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-5 flex justify-end gap-2">
          <Button type="submit">Filter</Button>
          <Link
            href="/boekingen"
            className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-4 text-sm hover:bg-accent"
          >
            Reset
          </Link>
        </div>
      </form>

      {bookings.length === 0 ? (
        <p className="mt-6 rounded-lg border p-8 text-center text-sm text-muted-foreground">
          Geen boekingen gevonden.
        </p>
      ) : device.isMobile ? (
        <div className="mt-6 grid gap-3">
          {bookings.map((b) => (
            <Link
              key={b.id}
              href={`/boekingen/${b.id}`}
              className="block rounded-lg border p-4 hover:bg-accent"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm font-medium">
                  {formatHumanDateTime(new Date(b.starts_at))}
                </span>
                <Badge variant={bookingStatusVariant(b.status)}>
                  {bookingStatusLabel(b.status)}
                </Badge>
              </div>
              <p className="mt-2 text-sm font-medium">
                {b.customer?.full_name ?? "—"}
              </p>
              {b.customer?.email && (
                <p className="text-xs text-muted-foreground break-all">
                  {b.customer.email}
                </p>
              )}
              <div className="mt-2 flex items-center justify-between text-sm">
                <span>{b.service?.name ?? "—"}</span>
                <span className="font-medium">
                  {b.service ? formatPrice(b.service.price_cents) : "—"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
      <div className="mt-6 overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Wanneer</TableHead>
              <TableHead>Klant</TableHead>
              <TableHead>Dienst</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Prijs</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((b) => (
              <TableRow key={b.id} className="cursor-pointer">
                <TableCell>
                  <Link href={`/boekingen/${b.id}`} className="block">
                    {formatHumanDateTime(new Date(b.starts_at))}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/boekingen/${b.id}`} className="block">
                    <span className="font-medium">{b.customer?.full_name ?? "—"}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {b.customer?.email}
                    </span>
                  </Link>
                </TableCell>
                <TableCell>{b.service?.name ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={bookingStatusVariant(b.status)}>
                    {bookingStatusLabel(b.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {b.service ? formatPrice(b.service.price_cents) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      )}
    </div>
  );
}
