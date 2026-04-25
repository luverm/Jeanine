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

export const metadata: Metadata = {
  title: "Boekingen",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

const STATUS_OPTIONS = [
  { value: "", label: "Alle statussen" },
  { value: "confirmed", label: "Bevestigd" },
  { value: "pending", label: "In afwachting" },
  { value: "cancelled", label: "Geannuleerd" },
  { value: "completed", label: "Afgerond" },
  { value: "no_show", label: "No-show" },
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

  const [services, bookings] = await Promise.all([
    listAllServices(),
    listBookings({
      from: params.from || undefined,
      to: params.to || undefined,
      status: (params.status as never) || undefined,
      serviceId: params.service || undefined,
      q: params.q || undefined,
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Boekingen</h1>
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
            {bookings.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  Geen boekingen gevonden.
                </TableCell>
              </TableRow>
            )}
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
                  <Badge variant={statusVariant(b.status)}>{b.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {b.service ? formatPrice(b.service.price_cents) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function statusVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "confirmed":
      return "default";
    case "pending":
      return "secondary";
    case "cancelled":
    case "no_show":
      return "destructive";
    default:
      return "outline";
  }
}
