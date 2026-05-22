import Link from "next/link";
import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { getBusiness } from "@/lib/db/business-settings";
import { rebookingNudgeText } from "@/lib/email/messages";
import { RebookingSettingsForm } from "@/components/admin/rebooking-settings-form";

export const metadata: Metadata = {
  title: "Terugkom-mail",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function RebookingSettingsPage() {
  const { rebooking } = await getBusiness();
  const exampleEmail = rebookingNudgeText({
    customerName: "Anouk",
    lastServiceName: "Knippen & föhnen",
    bookingUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://jouwsite.nl"}/boeken`,
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/instellingen"
        className="text-xs text-muted-foreground underline underline-offset-4"
      >
        ← Instellingen
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">
        Terugkom-mail
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Klanten met een afgelopen reguliere afspraak die nog geen nieuwe
        hebben geboekt, krijgen automatisch een vriendelijke herinnering met
        een boeklink. Bruidsklanten doen niet mee. De mail gaat één keer per
        dagelijkse controle uit; de wachttijd voorkomt dubbele mails.
      </p>

      <Card className="mt-6 p-6">
        <RebookingSettingsForm
          initial={{
            enabled: rebooking.enabled,
            minDays: rebooking.minDays,
            maxDays: rebooking.maxDays,
            cooldownDays: rebooking.cooldownDays,
          }}
        />
      </Card>

      <p className="mt-4 text-xs text-muted-foreground">
        Voorbeeld bij de standaardwaarden (42 / 120 / 60): wie 6 weken
        geleden voor het laatst kwam en niets nieuws boekte, krijgt een mail.
        Wie al ruim 4 maanden weg is, niet meer. Dezelfde klant hoort daarna
        minstens 60 dagen niets.
      </p>

      <Card className="mt-6 p-6">
        <h2 className="text-base font-semibold">Voorbeeld van de mail</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Dit is precies de tekst die de klant ontvangt — hier met
          voorbeeldgegevens ingevuld.
        </p>
        <div className="mt-4 rounded-md border bg-muted/30 p-4 text-sm">
          <p className="font-medium">
            Onderwerp: Tijd voor een nieuwe afspraak?
          </p>
          <p className="mt-3 whitespace-pre-line text-muted-foreground">
            {exampleEmail}
          </p>
        </div>
      </Card>
    </div>
  );
}
