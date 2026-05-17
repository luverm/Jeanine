import Link from "next/link";
import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { getBusiness } from "@/lib/db/business-settings";
import { BusinessSettingsForm } from "@/components/admin/business-settings-form";

export const metadata: Metadata = {
  title: "Instellingen",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function InstellingenPage() {
  const b = await getBusiness();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Instellingen</h1>
      </header>

      <Card className="p-6">
        <h2 className="text-base font-semibold">Bedrijfsgegevens</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Wijzigingen verschijnen direct op de website (kop, footer,
          contact).
        </p>
        <div className="mt-5">
          <BusinessSettingsForm
            initial={{
              name: b.name,
              ownerName: b.ownerName,
              tagline: b.tagline,
              email: b.email,
              phone: b.phone,
              street: b.address.street,
              postcode: b.address.postcode,
              city: b.address.city,
              kvk: b.kvk,
              btw: b.btw,
              iban: b.iban,
              vatRate: b.vatRate,
              invoicePrefix: b.invoicePrefix,
              instagram: b.socials.instagram,
              instagramUrl: b.socials.instagramUrl,
              tiktok: b.socials.tiktok,
            }}
          />
        </div>
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
          <li>
            <Link
              href="/instellingen/agenda"
              className="text-foreground underline underline-offset-4 hover:opacity-80"
            >
              Agenda in je telefoon
            </Link>
          </li>
          <li>
            <Link
              href="/instellingen/financien"
              className="text-foreground underline underline-offset-4 hover:opacity-80"
            >
              Financieel &amp; BTW
            </Link>
          </li>
          <li>
            <Link
              href="/instellingen/e-mails"
              className="text-foreground underline underline-offset-4 hover:opacity-80"
            >
              E-maillog
            </Link>
          </li>
          <li>
            <Link
              href="/instellingen/portfolio"
              className="text-foreground underline underline-offset-4 hover:opacity-80"
            >
              Portfolio
            </Link>
          </li>
          <li>
            <Link
              href="/instellingen/reviews"
              className="text-foreground underline underline-offset-4 hover:opacity-80"
            >
              Reviews
            </Link>
          </li>
          <li>
            <Link
              href="/instellingen/wachtlijst"
              className="text-foreground underline underline-offset-4 hover:opacity-80"
            >
              Wachtlijst
            </Link>
          </li>
        </ul>
      </Card>
    </div>
  );
}
