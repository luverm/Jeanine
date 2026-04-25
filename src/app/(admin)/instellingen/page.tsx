import Link from "next/link";
import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { business } from "@/content/business";

export const metadata: Metadata = {
  title: "Instellingen",
  robots: { index: false },
};

export default function InstellingenPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Instellingen</h1>
      </header>

      <Card className="grid gap-3 p-6 text-sm">
        <h2 className="text-base font-semibold">Bedrijfsgegevens</h2>
        <p className="text-xs text-muted-foreground">
          Aanpassen via{" "}
          <code className="rounded bg-muted px-1.5 py-0.5">
            src/content/business.ts
          </code>{" "}
          en deployen.
        </p>
        <Row label="Naam" value={business.name} />
        <Row label="Eigenaar" value={business.ownerName} />
        <Row label="E-mail" value={business.email} />
        <Row label="Telefoon" value={business.phone} />
        <Row
          label="Adres"
          value={`${business.address.street}, ${business.address.postcode} ${business.address.city}`}
        />
        <Row label="KvK" value={business.kvk} />
        <Row label="BTW" value={business.btw} />
      </Card>

      <Card className="mt-6 p-6">
        <h2 className="text-base font-semibold">Beheer</h2>
        <ul className="mt-3 grid gap-2 text-sm">
          <li>
            <Link
              href="/instellingen/diensten"
              className="text-foreground underline underline-offset-4 hover:opacity-80"
            >
              Diensten beheren
            </Link>
          </li>
          <li>
            <Link
              href="/instellingen/openingstijden"
              className="text-foreground underline underline-offset-4 hover:opacity-80"
            >
              Openingstijden
            </Link>
          </li>
          <li>
            <Link
              href="/instellingen/vrije-dagen"
              className="text-foreground underline underline-offset-4 hover:opacity-80"
            >
              Vrije dagen / blokkades
            </Link>
          </li>
        </ul>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b py-2 last:border-b-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
