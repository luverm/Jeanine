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
  const customers = await listCustomers(params.q);

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
            {customers.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-sm text-muted-foreground"
                >
                  Geen klanten gevonden.
                </TableCell>
              </TableRow>
            )}
            {customers.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.full_name}</TableCell>
                <TableCell>
                  <a href={`mailto:${c.email}`}>{c.email}</a>
                </TableCell>
                <TableCell>{c.phone ?? "—"}</TableCell>
                <TableCell className="text-right">{c.bookings_count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
