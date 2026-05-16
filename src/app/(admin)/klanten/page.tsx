import type { Metadata } from "next";
import Link from "next/link";
import { listCustomers } from "@/lib/db/admin-customers";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getDeviceInfo } from "@/lib/device";

export const metadata: Metadata = {
  title: "Klanten",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function KlantenPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const [customers, device] = await Promise.all([
    listCustomers(params.q),
    getDeviceInfo(),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Klanten</h1>
      </header>

      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/30 p-4"
      >
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="q">Zoek</Label>
          <Input
            id="q"
            name="q"
            type="search"
            placeholder="naam of e-mail"
            defaultValue={params.q ?? ""}
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit">Zoeken</Button>
          {params.q && (
            <Link
              href="/klanten"
              className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-4 text-sm hover:bg-accent"
            >
              Reset
            </Link>
          )}
        </div>
      </form>

      {customers.length === 0 ? (
        <p className="mt-6 rounded-lg border p-8 text-center text-sm text-muted-foreground">
          Geen klanten gevonden.
        </p>
      ) : device.isMobile ? (
        <div className="mt-6 grid gap-3">
          {customers.map((c) => (
            <div key={c.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`/klanten/${c.id}`}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {c.full_name}
                </Link>
                <Link
                  href={`/boekingen?q=${encodeURIComponent(c.email)}`}
                  className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs"
                >
                  {c.bookings_count} boeking
                  {c.bookings_count === 1 ? "" : "en"}
                </Link>
              </div>
              <a
                href={`mailto:${c.email}`}
                className="mt-2 block text-sm break-all text-muted-foreground"
              >
                {c.email}
              </a>
              {c.phone && (
                <a
                  href={`tel:${c.phone}`}
                  className="mt-1 block text-sm text-muted-foreground"
                >
                  {c.phone}
                </a>
              )}
            </div>
          ))}
        </div>
      ) : (
      <div className="mt-6 overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Naam</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Telefoon</TableHead>
              <TableHead className="text-right">Boekingen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/klanten/${c.id}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {c.full_name}
                  </Link>
                </TableCell>
                <TableCell>
                  <a href={`mailto:${c.email}`}>{c.email}</a>
                </TableCell>
                <TableCell>{c.phone ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/boekingen?q=${encodeURIComponent(c.email)}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {c.bookings_count}
                  </Link>
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
